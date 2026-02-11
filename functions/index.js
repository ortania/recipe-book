// v2 - server-side text extraction
const { onRequest } = require("firebase-functions/v2/https");

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
