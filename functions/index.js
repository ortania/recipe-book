// v2 - server-side text extraction + OpenAI proxy
const { onRequest } = require("firebase-functions/v2/https");
const { onDocumentWritten } = require("firebase-functions/v2/firestore");
const { getFirestore } = require("firebase-admin/firestore");
const { getAuth } = require("firebase-admin/auth");
const { initializeApp } = require("firebase-admin/app");

initializeApp();

async function verifyFirebaseToken(req, res) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }
  const token = authHeader.split("Bearer ")[1];
  try {
    return await getAuth().verifyIdToken(token);
  } catch {
    res.status(401).json({ error: "Invalid token" });
    return null;
  }
}

function setCors(req, res) {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  // Echo requested headers so preflight matches what the browser sends (e.g. content-type).
  const requested = req.headers["access-control-request-headers"];
  res.set(
    "Access-Control-Allow-Headers",
    requested || "Content-Type, Authorization",
  );
  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return true;
  }
  return false;
}

/** URL from GET query or POST JSON body (avoids query-string length limits on long Hebrew URLs). */
function getRequestUrl(req) {
  let u = req.query?.url;
  if (Array.isArray(u)) u = u[0];
  if (typeof u === "string" && u.trim()) return u.trim();
  const b = req.body;
  if (b && typeof b === "object" && typeof b.url === "string" && b.url.trim()) {
    return b.url.trim();
  }
  if (typeof b === "string" && b.length > 0) {
    try {
      const o = JSON.parse(b);
      if (typeof o.url === "string" && o.url.trim()) return o.url.trim();
    } catch {}
  }
  const raw = req.rawBody;
  if (raw && Buffer.isBuffer(raw)) {
    try {
      const o = JSON.parse(raw.toString("utf8"));
      if (typeof o.url === "string" && o.url.trim()) return o.url.trim();
    } catch {}
  }
  return "";
}

function extractTextFromHtml(html) {
  let text = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, "")
    .replace(/<nav[\s\S]*?<\/nav>/gi, "")
    .replace(/<footer[\s\S]*?<\/footer>/gi, "")
    .replace(/<header[\s\S]*?<\/header>/gi, "")
    .replace(/<aside[\s\S]*?<\/aside>/gi, "")
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/?(h[1-6]|p|div|li|ol|ul|tr|dt|dd|blockquote|section|article|figcaption|figure|table|thead|tbody|tfoot)[^>]*>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&#\d+;/gi, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return text;
}

function extractMicrodataFromHtml(html) {
  const result = { name: "", ingredients: [], instructions: [] };

  const nameMatch = html.match(
    /itemprop=["']name["'][^>]*>([^<]+)/i,
  );
  if (nameMatch) result.name = nameMatch[1].trim();

  const ingRegex =
    /<[^>]+itemprop=["']recipeIngredient["'][^>]*>([\s\S]*?)<\/[^>]+>/gi;
  let m;
  while ((m = ingRegex.exec(html)) !== null) {
    const text = m[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    if (text) result.ingredients.push(text);
  }

  const instBlockMatch = html.match(
    /itemprop=["']recipeInstructions["']([\s\S]*?)(?=<\/(?:div|ol|section))/i,
  );
  if (instBlockMatch) {
    const stepRegex =
      /itemprop=["'](?:text|step|itemListElement)["'][^>]*>([\s\S]*?)<\/[^>]+>/gi;
    while ((m = stepRegex.exec(instBlockMatch[0])) !== null) {
      const text = m[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
      if (text) result.instructions.push(text);
    }
  }

  if (result.ingredients.length === 0) {
    const altRegex =
      /itemprop=["']ingredients["'][^>]*>([^<]+)/gi;
    while ((m = altRegex.exec(html)) !== null) {
      const text = m[1].trim();
      if (text) result.ingredients.push(text);
    }
  }

  return result.ingredients.length > 0 ? result : null;
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
    if (setCors(req, res)) return;

    const user = await verifyFirebaseToken(req, res);
    if (!user) return;

    const url = getRequestUrl(req);

    if (!url || !(url.startsWith("http://") || url.startsWith("https://"))) {
      res.status(400).json({ error: "Missing or invalid url parameter" });
      return;
    }

    try {
      let referer = "";
      try {
        referer = new URL(url).origin + "/";
      } catch {}
      const response = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "he-IL,he;q=0.9,en-US;q=0.8,en;q=0.7",
          ...(referer ? { Referer: referer } : {}),
        },
        redirect: "follow",
      });

      if (!response.ok) {
        res
          .status(response.status)
          .json({ error: `Failed to fetch: ${response.statusText}` });
        return;
      }

      const iconv = require("iconv-lite");
      const rawBuffer = Buffer.from(await response.arrayBuffer());
      const contentType = response.headers.get("content-type") || "";
      let charset = "utf-8";
      const ctMatch = contentType.match(/charset=([^\s;]+)/i);
      if (ctMatch) {
        charset = ctMatch[1].replace(/['"]/g, "");
      } else {
        const preview = rawBuffer.slice(0, 4096).toString("ascii");
        const metaMatch =
          preview.match(/<meta[^>]*charset=["']?([^"';\s>]+)/i) ||
          preview.match(/content=["'][^"']*charset=([^"';\s]+)/i);
        if (metaMatch) charset = metaMatch[1];
      }
      const html = iconv.encodingExists(charset)
        ? iconv.decode(rawBuffer, charset)
        : rawBuffer.toString("utf-8");

      const cleanText = extractTextFromHtml(html);
      const jsonLd = extractJsonLd(html);
      const ogImage = extractOgImage(html);
      const microdata = extractMicrodataFromHtml(html);

      res.json({
        contents: html,
        cleanText,
        jsonLd,
        ogImage,
        microdata,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
);

// ── Fetch URL via headless browser (for bot-protected sites) ──
exports.fetchUrlBrowser = onRequest(
  {
    cors: true,
    region: "us-central1",
    memory: "2GiB",
    timeoutSeconds: 120,
  },
  async (req, res) => {
    if (setCors(req, res)) return;

    const user = await verifyFirebaseToken(req, res);
    if (!user) return;

    const url = getRequestUrl(req);
    if (!url || !(url.startsWith("http://") || url.startsWith("https://"))) {
      res.status(400).json({ error: "Missing or invalid url parameter" });
      return;
    }

    let browser;
    try {
      // Full `puppeteer` bundle often fails on Cloud Functions (no usable Chrome).
      // @sparticuz/chromium ships a Lambda/GCF-compatible binary for puppeteer-core.
      const chromium = require("@sparticuz/chromium");
      const puppeteer = require("puppeteer-core");

      browser = await puppeteer.launch({
        args: [...chromium.args, "--disable-dev-shm-usage"],
        defaultViewport: chromium.defaultViewport,
        executablePath: await chromium.executablePath(),
        headless: chromium.headless,
      });

      const page = await browser.newPage();
      await page.setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      );
      // networkidle2 often times out on WordPress / ad-heavy sites (e.g. chef-lavan.co.il)
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
      await new Promise((r) => setTimeout(r, 2500));

      // Scroll to bottom to trigger lazy-loaded content
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await new Promise((r) => setTimeout(r, 1500));

      // Expand any collapsed/hidden sections (details, accordions, "show more")
      await page.evaluate(() => {
        document.querySelectorAll("details:not([open])").forEach((d) => d.setAttribute("open", ""));
        document.querySelectorAll("[class*='expand'], [class*='more'], [class*='toggle'], [class*='accordion']")
          .forEach((el) => { try { el.click(); } catch {} });
      });
      await new Promise((r) => setTimeout(r, 1500));

      const extracted = await page.evaluate(() => {
        // Extract JSON-LD from the live DOM
        const jsonLd = [];
        document
          .querySelectorAll('script[type="application/ld+json"]')
          .forEach((s) => {
            try {
              jsonLd.push(JSON.parse(s.textContent));
            } catch {}
          });

        // Extract OG image
        const ogMeta = document.querySelector('meta[property="og:image"]');
        const ogImage = ogMeta ? ogMeta.getAttribute("content") : "";

        // Try to find recipe-specific content via microdata/schema
        const microdataIngredients = [
          ...document.querySelectorAll('[itemprop="recipeIngredient"]'),
        ].map((el) => el.textContent.trim());
        const microdataInstructions = [
          ...document.querySelectorAll(
            '[itemprop="recipeInstructions"] [itemprop="text"], ' +
            '[itemprop="recipeInstructions"] li, ' +
            '[itemprop="step"] [itemprop="text"]'
          ),
        ].map((el) => el.textContent.trim()).filter(Boolean);
        const microdataName = (
          document.querySelector('[itemprop="name"]') ||
          document.querySelector("h1")
        )?.textContent?.trim() || "";

        // Remove noise elements before extracting text
        const clone = document.body.cloneNode(true);
        const noiseSelectors = [
          "nav", "footer", "header", "aside", "iframe",
          "[role='banner']", "[role='navigation']", "[role='complementary']",
          "[class*='recommend']", "[class*='Recommend']",
          "[class*='related']", "[class*='Related']",
          "[class*='advert']", "[class*='banner']",
          "[class*='social']", "[class*='share']",
          "[class*='comment']", "[class*='Comment']",
          "[class*='sidebar']", "[class*='Sidebar']",
          "[class*='popup']", "[class*='modal']",
          "[class*='newsletter']", "[class*='promo']",
          "[id*='comment']", "[id*='sidebar']",
          "[id*='related']", "[id*='recommend']",
        ];
        noiseSelectors.forEach((sel) => {
          try {
            clone.querySelectorAll(sel).forEach((el) => el.remove());
          } catch {}
        });

        // Try to get just the article/recipe body for cleaner text
        const articleEl = clone.querySelector(
          "article, [class*='article-body'], [class*='articleBody'], " +
          "[class*='recipe-body'], [class*='recipeBody'], " +
          "[class*='recipe_body'], [class*='recipe-content'], " +
          "[class*='entry-content'], [role='main'], main"
        );
        const textSource = articleEl || clone;
        const cleanText = textSource.innerText.replace(/\s+/g, " ").trim();

        return {
          jsonLd,
          ogImage,
          cleanText,
          microdata:
            microdataIngredients.length > 0
              ? { name: microdataName, ingredients: microdataIngredients, instructions: microdataInstructions }
              : null,
        };
      });

      const html = await page.content();

      res.json({
        contents: html,
        cleanText: extracted.cleanText,
        jsonLd: extracted.jsonLd,
        ogImage: extracted.ogImage,
        microdata: extracted.microdata,
      });
    } catch (error) {
      console.error("fetchUrlBrowser error:", error);
      res.status(500).json({ error: error.message });
    } finally {
      if (browser) await browser.close().catch(() => {});
    }
  },
);

// ── Google Cloud Vision OCR ──
exports.ocrImage = onRequest(
  { cors: true, region: "us-central1", memory: "512MiB" },
  async (req, res) => {
    if (setCors(req, res)) return;
    if (req.method !== "POST") {
      res.status(405).json({ error: "Method not allowed" });
      return;
    }

    const user = await verifyFirebaseToken(req, res);
    if (!user) return;

    const { images } = req.body;
    if (!images || !Array.isArray(images) || images.length === 0) {
      res.status(400).json({ error: "Missing images array" });
      return;
    }

    try {
      const vision = require("@google-cloud/vision");
      const client = new vision.ImageAnnotatorClient();

      const results = await Promise.all(
        images.map(async (base64Data) => {
          const imageContent = base64Data.replace(/^data:image\/\w+;base64,/, "");
          const [result] = await client.documentTextDetection({
            image: { content: imageContent },
          });
          const fullText = result.fullTextAnnotation?.text || "";
          return fullText;
        }),
      );

      res.json({ text: results.join("\n\n") });
    } catch (error) {
      console.error("OCR error:", error);
      res.status(500).json({ error: error.message });
    }
  },
);

// ── OpenAI chat completions proxy ──
const ALLOWED_CHAT_MODELS = ["gpt-4o-mini", "gpt-4o"];
const MAX_CHAT_TOKENS = 4096;
const ALLOWED_CHAT_FIELDS = [
  "model", "messages", "temperature", "max_tokens", "response_format", "seed",
];

exports.openaiChat = onRequest(
  { cors: true, region: "us-central1" },
  async (req, res) => {
    if (setCors(req, res)) return;
    if (req.method !== "POST") {
      res.status(405).json({ error: "Method not allowed" });
      return;
    }

    const user = await verifyFirebaseToken(req, res);
    if (!user) return;

    const { model, messages, temperature, max_tokens, response_format, seed } =
      req.body || {};

    if (!model || !ALLOWED_CHAT_MODELS.includes(model)) {
      res.status(400).json({ error: `Model not allowed. Use: ${ALLOWED_CHAT_MODELS.join(", ")}` });
      return;
    }
    if (!Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({ error: "messages must be a non-empty array" });
      return;
    }
    if (temperature !== undefined && (typeof temperature !== "number" || temperature < 0 || temperature > 2)) {
      res.status(400).json({ error: "temperature must be 0-2" });
      return;
    }

    const sanitized = { model, messages };
    sanitized.max_tokens = Math.min(
      typeof max_tokens === "number" && max_tokens > 0 ? max_tokens : MAX_CHAT_TOKENS,
      MAX_CHAT_TOKENS,
    );
    if (typeof temperature === "number") sanitized.temperature = temperature;
    if (response_format && typeof response_format === "object") sanitized.response_format = response_format;
    if (seed !== undefined && typeof seed === "number") sanitized.seed = seed;

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
          body: JSON.stringify(sanitized),
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
const ALLOWED_TTS_MODELS = ["tts-1", "tts-1-hd"];
const ALLOWED_TTS_VOICES = ["alloy", "echo", "fable", "onyx", "nova", "shimmer"];
const ALLOWED_TTS_FORMATS = ["mp3", "opus", "aac", "flac", "wav", "pcm"];
const MAX_TTS_INPUT_LENGTH = 2000;

exports.openaiTts = onRequest(
  { cors: true, region: "us-central1" },
  async (req, res) => {
    if (setCors(req, res)) return;
    if (req.method !== "POST") {
      res.status(405).json({ error: "Method not allowed" });
      return;
    }

    const user = await verifyFirebaseToken(req, res);
    if (!user) return;

    const { model, input, voice, response_format } = req.body || {};

    if (!model || !ALLOWED_TTS_MODELS.includes(model)) {
      res.status(400).json({ error: `Model not allowed. Use: ${ALLOWED_TTS_MODELS.join(", ")}` });
      return;
    }
    if (typeof input !== "string" || input.length === 0) {
      res.status(400).json({ error: "input is required" });
      return;
    }
    if (input.length > MAX_TTS_INPUT_LENGTH) {
      res.status(400).json({ error: `input too long (max ${MAX_TTS_INPUT_LENGTH} chars)` });
      return;
    }
    if (voice && !ALLOWED_TTS_VOICES.includes(voice)) {
      res.status(400).json({ error: `Voice not allowed. Use: ${ALLOWED_TTS_VOICES.join(", ")}` });
      return;
    }
    if (response_format && !ALLOWED_TTS_FORMATS.includes(response_format)) {
      res.status(400).json({ error: `Format not allowed. Use: ${ALLOWED_TTS_FORMATS.join(", ")}` });
      return;
    }

    const sanitized = { model, input: input.slice(0, MAX_TTS_INPUT_LENGTH) };
    if (voice) sanitized.voice = voice;
    if (response_format) sanitized.response_format = response_format;

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
        body: JSON.stringify(sanitized),
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

// ── OpenAI recipe image (DALL·E) proxy ──
exports.openaiRecipeImage = onRequest(
  {
    cors: true,
    region: "us-central1",
    timeoutSeconds: 120,
    memory: "512MiB",
    invoker: "public",
  },
  async (req, res) => {
    if (setCors(req, res)) return;
    if (req.method !== "POST") {
      res.status(405).json({ error: "Method not allowed" });
      return;
    }

    const user = await verifyFirebaseToken(req, res);
    if (!user) return;

    const key = process.env.OPENAI_API_KEY;
    if (!key) {
      res.status(500).json({ error: "OpenAI API key not configured" });
      return;
    }

    const { recipeName, ingredients } = req.body || {};
    const name = typeof recipeName === "string" ? recipeName.trim() : "";
    if (!name) {
      res.status(400).json({ error: "recipeName is required" });
      return;
    }

    const ingList = Array.isArray(ingredients)
      ? ingredients
          .filter((s) => typeof s === "string" && s.trim())
          .slice(0, 15)
      : [];
    const prompt = [
      "Professional food photography of the finished dish on a wooden table, soft natural light, shallow depth of field, appetizing, no text, no watermark, no people, no hands.",
      `Dish name or theme: ${name}.`,
      ingList.length
        ? `Key ingredients (visual hints only): ${ingList.join(", ")}.`
        : "",
    ]
      .filter(Boolean)
      .join(" ");

    try {
      const response = await fetch(
        "https://api.openai.com/v1/images/generations",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${key}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "dall-e-3",
            prompt,
            n: 1,
            size: "1024x1024",
            quality: "standard",
            response_format: "b64_json",
          }),
        },
      );

      const data = await response.json();
      if (!response.ok) {
        res
          .status(response.status)
          .json({ error: data.error?.message || "Image generation failed" });
        return;
      }

      const b64 = data.data?.[0]?.b64_json;
      if (!b64) {
        res.status(500).json({ error: "No image in response" });
        return;
      }

      res.json({ mimeType: "image/png", imageBase64: b64 });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
);

// ── Google Translate proxy (so /api/translate works in production) ──
exports.translate = onRequest(
  { cors: true, region: "us-central1" },
  async (req, res) => {
    if (setCors(req, res)) return;
    const { client, sl, tl, dt, q } = req.query;
    if (!q || !tl) {
      res.status(400).json({ error: "Missing required parameters (tl, q)" });
      return;
    }
    try {
      const url =
        `https://translate.googleapis.com/translate_a/single` +
        `?client=${encodeURIComponent(client || "gtx")}` +
        `&sl=${encodeURIComponent(sl || "auto")}` +
        `&tl=${encodeURIComponent(tl)}` +
        `&dt=${encodeURIComponent(dt || "t")}` +
        `&q=${encodeURIComponent(q)}`;
      const response = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0" },
      });
      if (!response.ok) {
        res.status(response.status).json({ error: "Translation service error" });
        return;
      }
      const data = await response.json();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
);

// ── Community recipes: browse, search, filter (paginated) ──
exports.searchCommunityRecipes = onRequest(
  { cors: true, region: "us-central1" },
  async (req, res) => {
    if (setCors(req, res)) return;
    if (req.method !== "POST") {
      res.status(405).json({ error: "Method not allowed" });
      return;
    }

    const {
      searchTerm = "",
      categoryId = "",
      sortBy = "avgRating",
      sortDirection = "desc",
      cursor = null,
      pageSize = 30,
      excludeUserId = null,
      sharerUserId = null,
    } = req.body;

    try {
      const db = getFirestore();
      let q = db.collection("recipes").where("shareToGlobal", "==", true);

      if (sharerUserId) {
        q = q.where("userId", "==", sharerUserId);
      }

      if (categoryId && categoryId !== "all") {
        q = q.where("categories", "array-contains", categoryId);
      }

      const snapshot = await q.get();

      let recipes = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (excludeUserId && data.userId === excludeUserId) return;
        recipes.push({ id: doc.id, ...data });
      });

      if (searchTerm.trim()) {
        const terms = searchTerm.trim().toLowerCase().split(/\s+/).filter(Boolean);
        recipes = recipes.filter((r) =>
          terms.every((word) => {
            const name = (r.name || "").toLowerCase();
            const ingredients = (r.ingredients || []).join(" ").toLowerCase();
            const instructions = (r.instructions || []).join(" ").toLowerCase();
            return name.includes(word) || ingredients.includes(word) || instructions.includes(word);
          }),
        );
      }

      const dir = sortDirection === "asc" ? 1 : -1;
      recipes.sort((a, b) => {
        if (sortBy === "avgRating" || sortBy === "rating") {
          return dir * ((a.avgRating || 0) - (b.avgRating || 0));
        }
        if (sortBy === "name") {
          return dir * (a.name || "").localeCompare(b.name || "");
        }
        if (sortBy === "createdAt" || sortBy === "updatedAt") {
          return dir * ((a[sortBy] || "").localeCompare(b[sortBy] || ""));
        }
        return 0;
      });

      const startIndex = cursor ? parseInt(cursor, 10) : 0;
      const page = recipes.slice(startIndex, startIndex + pageSize);
      const nextCursor = startIndex + pageSize < recipes.length
        ? String(startIndex + pageSize)
        : null;

      res.json({
        recipes: page,
        cursor: nextCursor,
        total: recipes.length,
      });
    } catch (error) {
      console.error("searchCommunityRecipes error:", error);
      res.status(500).json({ error: error.message });
    }
  },
);

// ── Update avgRating when a user rates a recipe directly via subcollection ──
exports.updateAvgRatingDirect = onDocumentWritten(
  { document: "recipes/{recipeId}/ratings/{userId}", region: "us-central1" },
  async (event) => {
    const recipeId = event.params.recipeId;
    await aggregateRatings(recipeId);
  },
);

async function aggregateRatings(recipeId) {
  const db = getFirestore();
  const ratingsByUser = new Map();

  const directSnap = await db
    .collection("recipes")
    .doc(recipeId)
    .collection("ratings")
    .get();
  directSnap.forEach((doc) => {
    const r = doc.data().rating;
    if (r && r > 0) ratingsByUser.set(doc.id, r);
  });

  let sum = 0;
  let count = 0;
  ratingsByUser.forEach((r) => {
    sum += r;
    count++;
  });

  const avgRating = count > 0 ? Math.round((sum / count) * 10) / 10 : 0;
  await db.collection("recipes").doc(recipeId).update({
    avgRating,
    ratingCount: count,
  });
}
