// v2 - server-side text extraction + OpenAI proxy
const { onRequest } = require("firebase-functions/v2/https");
const { onDocumentWritten } = require("firebase-functions/v2/firestore");
const { getFirestore } = require("firebase-admin/firestore");
const { initializeApp } = require("firebase-admin/app");

initializeApp();

function extractTextFromHtml(html) {
  let text = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<nav[\s\S]*?<\/nav>/gi, " ")
    .replace(/<footer[\s\S]*?<\/footer>/gi, " ")
    .replace(/<header[\s\S]*?<\/header>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&#\d+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text;
}

function extractJsonLd(html) {
  const results = [];
  const regex =
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    try {
      results.push(JSON.parse(match[1]));
    } catch (e) {
      // skip invalid JSON-LD
    }
  }
  return results;
}

function extractOgImage(html) {
  const ogMatch = html.match(
    /<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i,
  );
  if (ogMatch) return ogMatch[1];
  const twMatch = html.match(
    /<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i,
  );
  if (twMatch) return twMatch[1];
  return "";
}

exports.fetchUrl = onRequest(
  { cors: true, region: "us-central1" },
  async (req, res) => {
    const url = req.query.url || req.body.url;

    if (!url) {
      res.status(400).json({ error: "Missing url parameter" });
      return;
    }

    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "he-IL,he;q=0.9,en-US;q=0.8,en;q=0.7",
        },
        redirect: "follow",
      });

      if (!response.ok) {
        res
          .status(response.status)
          .json({ error: `Failed to fetch: ${response.statusText}` });
        return;
      }

      const html = await response.text();
      const cleanText = extractTextFromHtml(html);
      const jsonLd = extractJsonLd(html);
      const ogImage = extractOgImage(html);

      res.json({
        contents: html,
        cleanText,
        jsonLd,
        ogImage,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
);

// ── OpenAI chat completions proxy ──
exports.openaiChat = onRequest(
  { cors: true, region: "us-central1" },
  async (req, res) => {
    if (req.method !== "POST") {
      res.status(405).json({ error: "Method not allowed" });
      return;
    }

    const key = process.env.OPENAI_API_KEY;
    if (!key) {
      res.status(500).json({ error: "OpenAI API key not configured" });
      return;
    }

    try {
      const response = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${key}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(req.body),
        },
      );

      const data = await response.json();
      if (!response.ok) {
        res
          .status(response.status)
          .json({ error: data.error?.message || "OpenAI request failed" });
        return;
      }
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
);

// ── OpenAI TTS proxy (returns audio binary) ──
exports.openaiTts = onRequest(
  { cors: true, region: "us-central1" },
  async (req, res) => {
    if (req.method !== "POST") {
      res.status(405).json({ error: "Method not allowed" });
      return;
    }

    const key = process.env.OPENAI_API_KEY;
    if (!key) {
      res.status(500).json({ error: "OpenAI API key not configured" });
      return;
    }

    try {
      const response = await fetch("https://api.openai.com/v1/audio/speech", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(req.body),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        res
          .status(response.status)
          .json({ error: errorData.error?.message || "TTS request failed" });
        return;
      }

      const arrayBuffer = await response.arrayBuffer();
      res.set("Content-Type", "audio/mpeg");
      res.send(Buffer.from(arrayBuffer));
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
);

// ── Update avgRating on original recipe when a copy's rating changes ──
exports.updateAvgRating = onDocumentWritten(
  { document: "recipes/{recipeId}", region: "us-central1" },
  async (event) => {
    const before = event.data.before?.data();
    const after = event.data.after?.data();

    const copiedFrom = after?.copiedFrom || before?.copiedFrom;
    if (!copiedFrom) return;

    const oldRating = before?.rating || 0;
    const newRating = after?.rating || 0;
    if (oldRating === newRating && event.data.after.exists) return;

    const db = getFirestore();
    const snap = await db
      .collection("recipes")
      .where("copiedFrom", "==", copiedFrom)
      .get();

    let sum = 0;
    let count = 0;
    snap.forEach((doc) => {
      const r = doc.data().rating;
      if (r && r > 0) {
        sum += r;
        count++;
      }
    });

    const avgRating = count > 0 ? Math.round((sum / count) * 10) / 10 : 0;
    await db.collection("recipes").doc(copiedFrom).update({
      avgRating,
      ratingCount: count,
    });
  },
);
