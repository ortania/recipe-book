import { auth } from "../firebase/config";

const DEBUG = import.meta.env.DEV;

const CLOUD_FUNCTION_URL =
  "https://us-central1-recipe-book-82d57.cloudfunctions.net/fetchUrl";
const CLOUD_FUNCTION_BROWSER_URL =
  "https://us-central1-recipe-book-82d57.cloudfunctions.net/fetchUrlBrowser";

async function getAuthHeaders() {
  const user = auth.currentUser;
  if (!user) return {};
  const token = await user.getIdToken();
  return { Authorization: `Bearer ${token}` };
}

const isBotBlocked = (html) => {
  const lower = html.toLowerCase();
  const blockedPhrases = [
    "you are a bot",
    "are you a bot",
    "think that you are a bot",
    "cannot process your request",
    "access denied",
    "incident id",
    "request blocked",
    "captcha",
    "cf-browser-verification",
    "challenge-platform",
    "just a moment",
    "checking your browser",
    "ddos protection",
    "security check",
    "blocked by",
    "pardon our interruption",
  ];
  const matchCount = blockedPhrases.filter((p) => lower.includes(p)).length;
  return matchCount >= 2;
};

const hasRecipeJsonLd = (jsonLd) => {
  if (!jsonLd || jsonLd.length === 0) return false;
  for (const item of jsonLd) {
    const data = Array.isArray(item) ? item[0] : item;
    if (data?.["@type"] === "Recipe") return true;
    if (Array.isArray(data?.["@graph"])) {
      if (data["@graph"].some((g) => g["@type"] === "Recipe")) return true;
    }
  }
  return false;
};

const fetchWithProxy = async (url) => {
  let regularResult = null;

  const authHeaders = await getAuthHeaders();

  // Try Firebase Cloud Function first — returns html + cleanText + jsonLd + ogImage
  try {
    if (DEBUG) console.log("[fetchProxy] Trying Cloud Function...");
    const cfUrl = `${CLOUD_FUNCTION_URL}?url=${encodeURIComponent(url)}`;
    const cfResponse = await fetch(cfUrl, { headers: authHeaders });
    if (DEBUG) console.log("[fetchProxy] CF status:", cfResponse.status);
    if (cfResponse.ok) {
      const data = await cfResponse.json();
      const cleanLen = (data.cleanText || "").length;
      if (DEBUG) console.log(
        "[fetchProxy] CF html length:",
        (data.contents || "").length,
        "cleanText length:",
        cleanLen,
      );
      if (
        data.contents &&
        data.contents.length > 200 &&
        !isBotBlocked(data.contents)
      ) {
        if (hasRecipeJsonLd(data.jsonLd) || cleanLen > 2000) {
          return data;
        }
        if (DEBUG) console.log(
          "[fetchProxy] CF content seems thin, will try browser CF...",
        );
        regularResult = data;
      }
    }
  } catch (e) {
    console.warn("[fetchProxy] Cloud Function failed:", e.message);
  }

  // Try headless browser Cloud Function (bypasses bot protection + renders JS)
  try {
    if (DEBUG) console.log("[fetchProxy] Trying browser-based Cloud Function...");
    const cfUrl = `${CLOUD_FUNCTION_BROWSER_URL}?url=${encodeURIComponent(url)}`;
    const cfResponse = await fetch(cfUrl, { headers: authHeaders });
    if (DEBUG) console.log("[fetchProxy] Browser CF status:", cfResponse.status);
    if (cfResponse.ok) {
      const data = await cfResponse.json();
      if (DEBUG) console.log(
        "[fetchProxy] Browser CF html length:",
        (data.contents || "").length,
        "cleanText length:",
        (data.cleanText || "").length,
      );
      if (
        data.contents &&
        data.contents.length > 200 &&
        !isBotBlocked(data.contents)
      ) {
        return data;
      }
    }
  } catch (e) {
    console.warn("[fetchProxy] Browser Cloud Function failed:", e.message);
  }

  // If we got partial content from regular CF, use it
  if (regularResult) {
    if (DEBUG) console.log("[fetchProxy] Using partial regular CF result as fallback");
    return regularResult;
  }

  // Fallback to free CORS proxies (return only html)
  const proxies = [
    {
      name: "allorigins",
      fn: (u) => `https://api.allorigins.win/get?url=${encodeURIComponent(u)}`,
    },
    {
      name: "codetabs",
      fn: (u) =>
        `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(u)}`,
    },
  ];

  for (const { name, fn: makeProxy } of proxies) {
    try {
      const proxyUrl = makeProxy(url);
      const response = await fetch(proxyUrl);
      if (!response.ok) continue;
      const contentType = response.headers.get("content-type") || "";
      let html = "";
      if (contentType.includes("json")) {
        const data = await response.json();
        html = typeof data === "string" ? data : data.contents || "";
      } else {
        html = await response.text();
      }
      if (
        typeof html === "string" &&
        html.length > 200 &&
        !isBotBlocked(html)
      ) {
        return { contents: html };
      }
    } catch (e) {
      continue;
    }
  }
  throw new Error("All proxies failed to fetch the URL.");
};

const cleanHtml = (text) => {
  if (!text) return "";
  const tmp = document.createElement("div");
  tmp.innerHTML = text;
  return tmp.textContent.replace(/\s+/g, " ").trim();
};

const TIPS_HEADING_RE =
  /^(טיפים|טיפים ותחליפים|הערות|הערות המתכון|tips|tips & substitutions|notes|chef['']s?\s*(?:tips?|notes?))/i;

const extractTipsFromHtml = (html) => {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const headings = [
    ...doc.querySelectorAll("h1, h2, h3, h4, h5, h6, strong, b"),
  ];
  for (const h of headings) {
    const text = (h.textContent || "")
      .trim()
      .replace(/[:\-–—]+$/, "")
      .trim();
    if (!TIPS_HEADING_RE.test(text)) continue;
    const parts = [];
    let el = h.tagName.match(/^H\d$/i)
      ? h.nextElementSibling
      : h.closest("p, div, li")?.nextElementSibling;
    while (el) {
      if (el.tagName.match(/^H[1-6]$/i)) break;
      const t = (el.textContent || "").trim();
      if (t && t.length > 3 && isLikelyRecipeNote(t) && !JUNK_LINE_RE.test(t)) {
        parts.push(t);
      }
      if (parts.length >= 10) break;
      el = el.nextElementSibling;
    }
    if (parts.length > 0) return parts.join("\n");
  }
  return "";
};

const GROUP_LINE_PATTERNS = [
  /^(for|for the|לציפוי|למילוי|לבצק|לקרם|לרוטב|לסירופ|להגשה|לקישוט|לבלילת?|לתערובת|לגלזורה|לעיטור|לגנאש|לציפוי|לשכבה|לתבנית|ל)\s/i,
  /:$/,
  /^(יבשים|רטובים|ציפוי|מילוי|בצק|קרם|רוטב|סירופ|תערובת|שכבה|תחתונה|עליונה|בלילה|בלילת|dry|wet|filling|coating|frosting|dough|sauce|syrup|topping|base|crust|batter|glaze|ganache|cream|decoration|garnish)\s*:?\s*$/i,
];

const isIngredientGroupLine = (line) => {
  if (!line || line.length > 40) return false;
  if (/^\d/.test(line)) return false;
  return GROUP_LINE_PATTERNS.some((p) => p.test(line.trim()));
};

const extractOgImage = (doc) => {
  const ogImage =
    doc.querySelector('meta[property="og:image"]') ||
    doc.querySelector('meta[name="og:image"]');
  if (ogImage) return ogImage.getAttribute("content");
  const twitterImage =
    doc.querySelector('meta[name="twitter:image"]') ||
    doc.querySelector('meta[property="twitter:image"]');
  if (twitterImage) return twitterImage.getAttribute("content");
  return "";
};

/**
 * If ingredients string has "למלית:" etc. in the middle of a line, put header on its own line
 * so parseIngredients (ingredientUtils) shows it as a group. Does not change content otherwise.
 */
const normalizeIngredientsSections = (str) => {
  if (!str || typeof str !== "string") return str;
  let s = str.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const sectionHeaders = [
    "למלית",
    "לציפוי",
    "לעיטור",
    "לקישוט",
    "להגשה",
    "לבלילה",
    "לבלילת",
    "לבצק",
    "למילוי",
  ];
  for (const h of sectionHeaders) {
    const re = new RegExp(`\\s+(${h}\\s*:\\s*)`, "g");
    s = s.replace(re, "\n$1\n");
  }
  return s.replace(/\n{3,}/g, "\n\n").trim();
};

/**
 * Only for mako.co.il: when cleanText is truncated before "למלית" but html has it,
 * append that section so AI gets full ingredients. Skip for other sites to avoid regression.
 */
const ensureMultiSectionFromHtml = (html, currentText, pageUrl) => {
  if (!pageUrl || !pageUrl.includes("mako.co.il")) return currentText;
  if (!currentText || !html || currentText.length < 100) return currentText;
  if (/למלית|לציפוי|לקישוט|לעיטור/.test(currentText)) return currentText;
  const needle = "למלית";
  const idx = html.indexOf(needle);
  if (idx === -1) return currentText;
  const maxLen = 1800;
  const stop = ["אופן ההכנה", "הוראות", "הכנה"];
  let end = idx + maxLen;
  const chunk = html.slice(idx, idx + maxLen + 200);
  for (const s of stop) {
    const i = chunk.indexOf(s);
    if (i !== -1) end = Math.min(end, idx + i);
  }
  const raw = html.slice(idx, end);
  const text = cleanHtml(raw);
  if (!text || text.length < 15) return currentText;
  return currentText + "\n\n" + text;
};

const SERVING_SUGGESTIONS_RE =
  /^(הצעות להגשה|הצעות הגשה|אפשרויות הגשה|serving suggestions?|ways to serve)/i;

const JUNK_LINE_RE =
  /\[.*?\]|the_ad_group|widget|sidebar|newsletter|copyright|©|@|favicon|\.ico|\.png|\.jpg/i;

const RECIPE_NOTE_WORDS_RE =
  /טיפ|הערה|תחליף|אפשר (גם |ל)|במקום|ניתן (גם |ל)|מומלץ|שימו לב|חשוב|אם (אין |רוצים |מעדיפים )|מעלות|דקות|שעה|שעות|תנור|מקרר|לצנן|tip|note|substitut|instead|can also|optional|recommend|preheat|degrees|minute|hour|cool|refrig/i;

const isLikelyRecipeNote = (line) => {
  if (line.length > 80) return true;
  if (RECIPE_NOTE_WORDS_RE.test(line)) return true;
  return false;
};

const cleanRecipeResult = (recipe) => {
  if (recipe.instructions && typeof recipe.instructions === "string") {
    const lines = recipe.instructions.split("\n");
    const cleaned = [];
    let inServingSuggestions = false;
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      if (SERVING_SUGGESTIONS_RE.test(trimmed)) {
        inServingSuggestions = true;
        continue;
      }
      if (inServingSuggestions) continue;
      if (JUNK_LINE_RE.test(trimmed)) continue;
      cleaned.push(line);
    }
    recipe.instructions = cleaned.join("\n");
  }

  if (recipe.notes && typeof recipe.notes === "string") {
    const lines = recipe.notes.split("\n");
    const cleaned = lines.filter((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.length <= 2) return false;
      if (JUNK_LINE_RE.test(trimmed)) return false;
      return isLikelyRecipeNote(trimmed);
    });
    recipe.notes = cleaned.join("\n");
  }

  return recipe;
};

export const parseRecipeFromUrl = async (url, options = {}) => {
  const { canUseAiFallback = true } = options;
  try {
    if (DEBUG) console.log("[recipeParser] Parsing URL:", url);
    // Validate URL
    try {
      const parsed = new URL(url);
      if (!parsed.protocol.startsWith("http")) {
        throw new Error("Invalid URL");
      }
    } catch {
      throw new Error(
        "Invalid URL. Please enter a valid web address starting with http:// or https://",
      );
    }

    const fetchResult = await fetchWithProxy(url);
    const html = fetchResult.contents || "";
    const serverCleanText = fetchResult.cleanText || "";
    const serverJsonLd = fetchResult.jsonLd || [];
    const serverOgImage = fetchResult.ogImage || "";
    let serverMicrodata = fetchResult.microdata || null;
    let hadJsonLdRecipe = false;

    if (DEBUG) console.log(
      "[recipeParser] html:",
      html.length,
      "cleanText:",
      serverCleanText.length,
      "jsonLd:",
      serverJsonLd.length,
    );

    if (isBotBlocked(html)) {
      throw new Error("BLOCKED: This website blocks automated access.");
    }

    const recipe = {
      name: "",
      ingredients: "",
      instructions: "",
      prepTime: "",
      cookTime: "",
      servings: "",
      notes: "",
      image_src: serverOgImage,
    };

    // --- Try microdata extracted by browser CF ---
    if (
      serverMicrodata &&
      serverMicrodata.ingredients &&
      serverMicrodata.ingredients.length > 0
    ) {
      if (DEBUG) console.log(
        "[recipeParser] Using microdata:",
        serverMicrodata.ingredients.length,
        "ingredients",
      );
      recipe.name = serverMicrodata.name || "";
      recipe.ingredients = serverMicrodata.ingredients.join("\n");
      if (
        serverMicrodata.instructions &&
        serverMicrodata.instructions.length > 0
      ) {
        recipe.instructions = serverMicrodata.instructions.join("\n");
      }
      if (recipe.name && recipe.ingredients) return cleanRecipeResult(recipe);
    }

    // --- Try client-side microdata extraction from HTML ---
    if (!serverMicrodata && html) {
      const domParser = new DOMParser();
      const domDoc = domParser.parseFromString(html, "text/html");
      const domIngredients = [
        ...domDoc.querySelectorAll('[itemprop="recipeIngredient"]'),
      ]
        .map((el) => el.textContent.trim())
        .filter(Boolean);
      if (domIngredients.length > 0) {
        const domName =
          (
            domDoc.querySelector('[itemprop="name"]') ||
            domDoc.querySelector("h1")
          )?.textContent?.trim() || "";
        const domInstructions = [
          ...domDoc.querySelectorAll(
            '[itemprop="recipeInstructions"] [itemprop="text"], ' +
              '[itemprop="recipeInstructions"] li, ' +
              '[itemprop="step"] [itemprop="text"]',
          ),
        ]
          .map((el) => el.textContent.trim())
          .filter(Boolean);
        serverMicrodata = {
          name: domName,
          ingredients: domIngredients,
          instructions: domInstructions,
        };
        if (DEBUG) console.log(
          "[recipeParser] Extracted client-side microdata:",
          domIngredients.length,
          "ingredients",
        );
      }

      if (serverMicrodata) {
        recipe.name = serverMicrodata.name || "";
        recipe.ingredients = serverMicrodata.ingredients.join("\n");
        if (
          serverMicrodata.instructions &&
          serverMicrodata.instructions.length > 0
        ) {
          recipe.instructions = serverMicrodata.instructions.join("\n");
        }
        if (recipe.name && recipe.ingredients) return cleanRecipeResult(recipe);
      }
    }

    // --- Try JSON-LD structured data (from server or browser) ---
    let jsonLdItems = serverJsonLd;
    if (jsonLdItems.length === 0) {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");
      const scripts = doc.querySelectorAll(
        'script[type="application/ld+json"]',
      );
      for (const script of scripts) {
        try {
          jsonLdItems.push(JSON.parse(script.textContent));
        } catch (e) {
          /* skip */
        }
      }
      if (!recipe.image_src) recipe.image_src = extractOgImage(doc);
    }

    for (const rawData of jsonLdItems) {
      try {
        let data = rawData;
        if (Array.isArray(data)) data = data[0];
        const recipeData =
          data["@type"] === "Recipe"
            ? data
            : Array.isArray(data["@graph"])
              ? data["@graph"].find((item) => item["@type"] === "Recipe")
              : null;

        if (recipeData) {
          hadJsonLdRecipe = true;
          if (DEBUG) console.log(
            "[recipeParser] Found Recipe in JSON-LD:",
            recipeData.name,
          );
          recipe.name = cleanHtml(recipeData.name || "");

          if (recipeData.recipeIngredient) {
            const rawIngs = Array.isArray(recipeData.recipeIngredient)
              ? recipeData.recipeIngredient.map(cleanHtml).filter(Boolean)
              : [cleanHtml(recipeData.recipeIngredient)];
            const isConcatenated =
              rawIngs.length === 1 && rawIngs[0].length > 80;
            if (isConcatenated) {
              const parts = rawIngs[0]
                .split(/(?=(?:\d+|[½¼¾⅓⅔])[\s])/)
                .map((s) => s.trim())
                .filter((s) => s.length > 2 && /^[\d½¼¾⅓⅔]/.test(s));
              recipe.ingredients = parts.length > 1 ? parts.join("\n") : "";
            } else {
              recipe.ingredients = rawIngs.join("\n");
            }
          }

          if (recipeData.recipeInstructions) {
            if (Array.isArray(recipeData.recipeInstructions)) {
              recipe.instructions = recipeData.recipeInstructions
                .map((step) => {
                  if (typeof step === "string") return cleanHtml(step);
                  if (step.text) return cleanHtml(step.text);
                  if (
                    step.itemListElement &&
                    Array.isArray(step.itemListElement)
                  ) {
                    return step.itemListElement
                      .map((s) => s.text || s.name || "")
                      .filter(Boolean)
                      .join("\n");
                  }
                  if (step.name) return cleanHtml(step.name);
                  return "";
                })
                .filter(Boolean)
                .join("\n");
            } else if (typeof recipeData.recipeInstructions === "string") {
              const rawInst = recipeData.recipeInstructions
                .replace(/<br\s*\/?>/gi, "\n")
                .replace(/&lt;br\s*\/?&gt;/gi, "\n");
              recipe.instructions = rawInst
                .split("\n")
                .map((s) => cleanHtml(s).replace(/^\d+\.\s*/, ""))
                .filter((s) => s.length > 3)
                .join("\n");
            }
          }

          if (recipeData.prepTime)
            recipe.prepTime = parseDuration(recipeData.prepTime);
          if (recipeData.cookTime)
            recipe.cookTime = parseDuration(recipeData.cookTime);
          if (recipeData.recipeYield) {
            const yieldMatch = String(recipeData.recipeYield).match(/\d+/);
            recipe.servings = yieldMatch ? yieldMatch[0] : "";
          }

          if (recipeData.image) {
            if (typeof recipeData.image === "string") {
              recipe.image_src = recipeData.image;
            } else if (
              Array.isArray(recipeData.image) &&
              recipeData.image.length > 0
            ) {
              recipe.image_src =
                typeof recipeData.image[0] === "string"
                  ? recipeData.image[0]
                  : recipeData.image[0].url || "";
            } else if (recipeData.image.url) {
              recipe.image_src = recipeData.image.url;
            }
          }

          if (recipeData.description && !recipe.notes) {
            const desc = cleanHtml(recipeData.description);
            const lowerDesc = desc.toLowerCase();
            if (
              lowerDesc.includes("טיפ") ||
              lowerDesc.includes("הערה") ||
              lowerDesc.includes("tip") ||
              lowerDesc.includes("note")
            ) {
              recipe.notes = desc;
            }
          }

          const jsonLdIngs = recipe.ingredients
            ? recipe.ingredients.split("\n").filter(Boolean)
            : [];
          const jsonLdIngCount = jsonLdIngs.length;
          const ingsWithQty = jsonLdIngs.filter((ing) =>
            /\d|½|¼|¾|⅓|⅔|כוס|כף|כפית|יחידה|יחידות|גרם|מ"ל|ליטר|ק"ג/.test(ing),
          ).length;
          const ingredientsLackQuantities =
            jsonLdIngCount > 0 && ingsWithQty / jsonLdIngCount < 0.3;
          const textForAI = ensureMultiSectionFromHtml(
            html,
            serverCleanText || "",
            url,
          );

          const shouldTryAI =
            (jsonLdIngCount < 6 || ingredientsLackQuantities) &&
            textForAI.length > 500;

          if (shouldTryAI) {
            if (DEBUG) console.log(
              "[recipeParser] JSON-LD ingredients:",
              jsonLdIngCount,
              "with quantities:",
              ingsWithQty,
              canUseAiFallback ? "- trying OpenAI..." : "- AI fallback blocked (premium)",
            );
            if (!canUseAiFallback) {
              if (DEBUG) console.log("[recipeParser] Skipping AI fallback (not entitled)");
            } else try {
              const { extractRecipeFromText: aiExtract } =
                await import("../services/openai");
              const aiResult = await aiExtract(textForAI);
              if (
                aiResult &&
                !aiResult.error &&
                Array.isArray(aiResult.ingredients) &&
                aiResult.ingredients.length >= jsonLdIngCount
              ) {
                if (DEBUG) console.log(
                  "[recipeParser] OpenAI found:",
                  aiResult.ingredients.length,
                  "ingredients",
                );
                recipe.ingredients = aiResult.ingredients.join("\n");
                if (
                  Array.isArray(aiResult.instructions) &&
                  aiResult.instructions.length > 0
                ) {
                  recipe.instructions = aiResult.instructions.join("\n");
                }
                if (aiResult.prepTime) recipe.prepTime = aiResult.prepTime;
                if (aiResult.cookTime) recipe.cookTime = aiResult.cookTime;
                if (aiResult.servings) recipe.servings = aiResult.servings;
                if (aiResult.notes) recipe.notes = aiResult.notes;
              }
            } catch (aiErr) {
              console.warn("[recipeParser] OpenAI fallback failed:", aiErr);
            }
          }

          const finalIngCount = recipe.ingredients
            ? recipe.ingredients.split("\n").filter(Boolean).length
            : 0;
          if (finalIngCount >= 6) return cleanRecipeResult(recipe);
          if (DEBUG) console.log(
            "[recipeParser] JSON-LD ingredients insufficient (" +
              finalIngCount +
              "), trying other methods...",
          );
        }
      } catch (e) {
        continue;
      }
    }

    // --- Check for NewsArticle/Article JSON-LD (e.g. mako.co.il) ---
    let articleBody = "";
    let articleHeadline = "";
    let articleImage = "";
    for (const rawData of jsonLdItems) {
      try {
        let data = rawData;
        if (Array.isArray(data)) data = data[0];
        if (data["@type"] === "NewsArticle" || data["@type"] === "Article") {
          articleHeadline = data.headline || data.name || "";
          articleBody = data.articleBody || data.description || "";
          if (data.image) {
            if (typeof data.image === "string") articleImage = data.image;
            else if (Array.isArray(data.image) && data.image.length > 0)
              articleImage =
                typeof data.image[0] === "string"
                  ? data.image[0]
                  : data.image[0].url || "";
            else if (data.image.url) articleImage = data.image.url;
          }
          break;
        }
      } catch (e) {
        /* skip */
      }
    }

    if (!hadJsonLdRecipe && articleHeadline) recipe.name = articleHeadline;
    if (articleImage && !recipe.image_src) recipe.image_src = articleImage;

    if (!recipe.notes && html) {
      try {
        const tipsFromHtml = extractTipsFromHtml(html);
        if (tipsFromHtml) recipe.notes = tipsFromHtml;
      } catch {
        /* ignore */
      }
    }

    let cleanText = articleBody || serverCleanText || "";
    cleanText = ensureMultiSectionFromHtml(html, cleanText, url);
    if (DEBUG) console.log(
      "[recipeParser] articleBody:",
      articleBody.length,
      "cleanText:",
      cleanText.length,
      "hadJsonLdRecipe:",
      hadJsonLdRecipe,
    );

    if (cleanText.length > 100) {
      if (!canUseAiFallback) {
        if (DEBUG) console.log("[recipeParser] Skipping main OpenAI extraction (not entitled)");
      } else try {
        if (DEBUG) console.log("[recipeParser] Trying OpenAI extraction...");
        const { extractRecipeFromText: aiExtract } =
          await import("../services/openai");
        const aiResult = await aiExtract(cleanText);
        if (DEBUG) console.log("[recipeParser] OpenAI result:", aiResult);

        if (aiResult && !aiResult.error) {
          if (hadJsonLdRecipe) {
            if (
              Array.isArray(aiResult.ingredients) &&
              aiResult.ingredients.length > 0
            )
              recipe.ingredients = aiResult.ingredients.join("\n");
          } else {
            recipe.name = aiResult.name || "";
            if (Array.isArray(aiResult.ingredients))
              recipe.ingredients = aiResult.ingredients.join("\n");
            if (Array.isArray(aiResult.instructions))
              recipe.instructions = aiResult.instructions.join("\n");
            recipe.prepTime = aiResult.prepTime || "";
            recipe.cookTime = aiResult.cookTime || "";
            recipe.servings = aiResult.servings || "";
          }
          if (aiResult.notes && !recipe.notes) recipe.notes = aiResult.notes;
          return cleanRecipeResult(recipe);
        }
      } catch (aiError) {
        console.error("[recipeParser] OpenAI extraction failed:", aiError);
      }

      try {
        if (DEBUG) console.log("[recipeParser] Trying local text parsing...");
        const textResult = parseRecipeFromText(cleanText);
        if (!hadJsonLdRecipe && textResult.name) recipe.name = textResult.name;
        if (textResult.ingredients.length > 0)
          recipe.ingredients = textResult.ingredients.join("\n");
        if (!hadJsonLdRecipe && textResult.instructions.length > 0)
          recipe.instructions = textResult.instructions.join("\n");
        if (textResult.notes && !recipe.notes) recipe.notes = textResult.notes;
        if (recipe.name && recipe.ingredients) return cleanRecipeResult(recipe);
      } catch (textError) {
        console.error("[recipeParser] Local text parsing failed:", textError);
      }
    }

    if (!recipe.name || !recipe.ingredients) {
      if (!canUseAiFallback) {
        throw new Error("AI_FALLBACK_BLOCKED");
      }
      throw new Error("Could not extract enough recipe data.");
    }

    if (typeof recipe.ingredients === "string") {
      recipe.ingredients = normalizeIngredientsSections(recipe.ingredients);
    }

    return cleanRecipeResult(recipe);
  } catch (error) {
    console.error("Error parsing recipe:", error);
    throw error;
  }
};

/**
 * Parse continuous speech text using per-item keywords.
 * User says "שם" before the recipe name, "מרכיב" before EACH ingredient,
 * "שלב" before EACH instruction step, "מנות" before servings count,
 * "זמן הכנה" before prep time, "זמן בישול" before cook time.
 */
const parseSpeechText = (text, recipe) => {
  const lower = text.toLowerCase();

  const itemMarkers = [
    { keyword: "שם המתכון", type: "name" },
    { keyword: "שם מתכון", type: "name" },
    { keyword: "recipe name", type: "name" },
    { keyword: "שם", type: "name" },
    { keyword: "name", type: "name" },
    { keyword: "מרכיב", type: "ingredient" },
    { keyword: "חומר", type: "ingredient" },
    { keyword: "ingredient", type: "ingredient" },
    { keyword: "הוראה", type: "step" },
    { keyword: "הוראת הכנה", type: "step" },
    { keyword: "שלב", type: "step" },
    { keyword: "step", type: "step" },
    { keyword: "כמות מנות", type: "servings" },
    { keyword: "מספר מנות", type: "servings" },
    { keyword: "מנות", type: "servings" },
    { keyword: "servings", type: "servings" },
    { keyword: "זמן הכנה", type: "prepTime" },
    { keyword: "prep time", type: "prepTime" },
    { keyword: "זמן בישול", type: "cookTime" },
    { keyword: "cook time", type: "cookTime" },
    { keyword: "רמת קושי", type: "difficulty" },
    { keyword: "קושי", type: "difficulty" },
    { keyword: "difficulty", type: "difficulty" },
    { keyword: "קטגוריה", type: "category" },
    { keyword: "שיוך", type: "category" },
    { keyword: "category", type: "category" },
    { keyword: "טיפים ותחליפים", type: "notes" },
    { keyword: "טיפים", type: "notes" },
    { keyword: "הערות", type: "notes" },
    { keyword: "tips", type: "notes" },
    { keyword: "notes", type: "notes" },
  ];

  // Helper: check if character at position is a word boundary (space, punctuation, start/end)
  const isWordBoundary = (str, pos) => {
    if (pos < 0 || pos >= str.length) return true;
    const ch = str[pos];
    return /[\s,.\-;:!?()[\]{}'"،]/.test(ch);
  };

  // Find ALL occurrences of ALL markers in the text
  const found = [];
  for (const { keyword, type } of itemMarkers) {
    let searchFrom = 0;
    while (searchFrom < lower.length) {
      const idx = lower.indexOf(keyword, searchFrom);
      if (idx === -1) break;
      const endIdx = idx + keyword.length;
      // Only match if keyword is at a word boundary (not inside another word)
      if (isWordBoundary(lower, idx - 1) && isWordBoundary(lower, endIdx)) {
        if (!found.some((f) => f.idx === idx)) {
          found.push({ type, idx, len: keyword.length });
        }
      }
      searchFrom = idx + keyword.length;
    }
  }

  // Remove overlapping matches — keep the longest match at each position
  found.sort((a, b) => a.idx - b.idx || b.len - a.len);
  const cleaned = [];
  for (const f of found) {
    const last = cleaned[cleaned.length - 1];
    if (last && f.idx < last.idx + last.len) continue;
    cleaned.push(f);
  }

  if (cleaned.length === 0) {
    recipe.name = text.trim() || "Untitled Recipe";
    return recipe;
  }

  // Text before the first marker = recipe name (if no explicit name marker)
  const beforeFirst = text.substring(0, cleaned[0].idx).trim();
  if (cleaned[0].type !== "name" && beforeFirst.length > 0) {
    recipe.name = beforeFirst;
  }

  // Hebrew number words that likely start a new ingredient item
  const hebrewNumbers =
    /^(אחד|אחת|שניים|שתיים|שנים|שלוש|שלושה|ארבע|ארבעה|חמש|חמישה|שש|שישה|שבע|שבעה|שמונה|תשע|תשעה|עשר|עשרה|חצי|רבע)\b/;
  // Hebrew verbs/infinitives that likely start a new instruction step
  const stepStarters =
    /^(לערבב|לבשל|לאפות|להוסיף|לשים|להכניס|לחמם|לקרר|להקציף|להפריד|לחתוך|לטגן|למזוג|לערום|לקפל|למרוח|לגרד|לסנן|ליצור|להגיש|לפזר|למלא|לכסות|לרדד|ללוש|לגלגל|לצקת|להמתין|לנקות|לשטוף|לקלף|לרסק|לטחון|למעוך)\b/;

  // Split long ingredient content into separate items
  const splitIngredients = (content) => {
    const parts = content.split(/\s+/);
    const items = [];
    let current = [];
    for (let j = 0; j < parts.length; j++) {
      const word = parts[j];
      // If this word looks like a step starter, stop collecting ingredients
      if (stepStarters.test(word)) {
        if (current.length > 0) items.push(current.join(" "));
        // Collect the rest as a step
        const rest = parts.slice(j).join(" ");
        return { ingredients: items, trailingSteps: rest };
      }
      // If this word is a number (digit or Hebrew) and we already have content, start new item
      if (
        current.length > 0 &&
        (/^\d/.test(word) || hebrewNumbers.test(word))
      ) {
        items.push(current.join(" "));
        current = [word];
      } else {
        current.push(word);
      }
    }
    if (current.length > 0) items.push(current.join(" "));
    return { ingredients: items, trailingSteps: null };
  };

  // Split long step content into separate steps
  const splitSteps = (content) => {
    const parts = content.split(/\s+/);
    const items = [];
    let current = [];
    for (const word of parts) {
      if (current.length > 0 && stepStarters.test(word)) {
        items.push(current.join(" "));
        current = [word];
      } else {
        current.push(word);
      }
    }
    if (current.length > 0) items.push(current.join(" "));
    return items;
  };

  // Hebrew word → digit map for servings, prep/cook time
  const hebrewWordToNum = {
    אחד: "1",
    אחת: "1",
    שניים: "2",
    שתיים: "2",
    שנים: "2",
    שלוש: "3",
    שלושה: "3",
    ארבע: "4",
    ארבעה: "4",
    חמש: "5",
    חמישה: "5",
    שש: "6",
    שישה: "6",
    שבע: "7",
    שבעה: "7",
    שמונה: "8",
    תשע: "9",
    תשעה: "9",
    עשר: "10",
    עשרה: "10",
    חצי: "0.5",
    רבע: "0.25",
  };
  const toDigit = (str) => {
    const d = str.match(/\d+/);
    if (d) return d[0];
    const w = str.trim().split(/\s+/)[0];
    return hebrewWordToNum[w] || null;
  };

  // Extract content after each marker until the next marker
  for (let i = 0; i < cleaned.length; i++) {
    const start = cleaned[i].idx + cleaned[i].len;
    const end = i + 1 < cleaned.length ? cleaned[i + 1].idx : text.length;
    const content = text.substring(start, end).trim();
    if (!content) continue;

    switch (cleaned[i].type) {
      case "name":
        recipe.name = content;
        break;
      case "ingredient": {
        const { ingredients, trailingSteps } = splitIngredients(content);
        ingredients.forEach((ing) => {
          const trimmed = ing.trim();
          if (trimmed) recipe.ingredients.push(trimmed);
        });
        if (trailingSteps) {
          splitSteps(trailingSteps).forEach((step) => {
            const trimmed = step.trim();
            if (trimmed) recipe.instructions.push(trimmed);
          });
        }
        break;
      }
      case "step": {
        splitSteps(content).forEach((step) => {
          const trimmed = step.trim();
          if (trimmed) recipe.instructions.push(trimmed);
        });
        break;
      }
      case "servings": {
        const num = toDigit(content);
        if (num) recipe.servings = num;
        break;
      }
      case "prepTime": {
        const timeNum = toDigit(content);
        if (timeNum) recipe.prepTime = `${timeNum}min`;
        break;
      }
      case "cookTime": {
        const cookNum = toDigit(content);
        if (cookNum) recipe.cookTime = `${cookNum}min`;
        break;
      }
      case "difficulty":
        recipe.difficulty = content;
        break;
      case "category":
        if (!recipe.category) {
          recipe.category = content;
        } else {
          recipe.category += ", " + content;
        }
        break;
      case "notes":
        recipe.notes = (recipe.notes ? recipe.notes + "\n" : "") + content;
        break;
    }
  }

  // ---- Fallback heuristics for when keywords are dropped by speech API ----
  // If the name is suspiciously long (contains ingredient-like or step-like content),
  // try to split it into name + ingredients + steps
  const difficultyWords = {
    קשה: "hard",
    קל: "easy",
    בינוני: "medium",
    hard: "hard",
    easy: "easy",
    medium: "medium",
  };
  const hebrewNumberValues = {
    אחד: "1",
    אחת: "1",
    שניים: "2",
    שתיים: "2",
    שנים: "2",
    שלוש: "3",
    שלושה: "3",
    ארבע: "4",
    ארבעה: "4",
    חמש: "5",
    חמישה: "5",
    שש: "6",
    שישה: "6",
    שבע: "7",
    שבעה: "7",
    שמונה: "8",
    תשע: "9",
    תשעה: "9",
    עשר: "10",
    עשרה: "10",
  };

  // If name is very long and we have few ingredients, try to extract from name
  if (
    recipe.name &&
    recipe.name.split(/\s+/).length > 5 &&
    recipe.ingredients.length === 0
  ) {
    const words = recipe.name.split(/\s+/);
    // Find first step-starter verb or number that indicates ingredient list started
    let nameEnd = words.length;
    for (let w = 2; w < words.length; w++) {
      if (
        /^\d/.test(words[w]) ||
        hebrewNumbers.test(words[w]) ||
        stepStarters.test(words[w])
      ) {
        nameEnd = w;
        break;
      }
    }
    if (nameEnd < words.length) {
      const actualName = words.slice(0, nameEnd).join(" ");
      const rest = words.slice(nameEnd).join(" ");
      recipe.name = actualName;
      const { ingredients, trailingSteps } = splitIngredients(rest);
      ingredients.forEach((ing) => {
        const trimmed = ing.trim();
        if (trimmed) recipe.ingredients.push(trimmed);
      });
      if (trailingSteps) {
        splitSteps(trailingSteps).forEach((step) => {
          const trimmed = step.trim();
          if (trimmed) recipe.instructions.push(trimmed);
        });
      }
    }
  }

  // Extract difficulty from last items if not set
  if (!recipe.difficulty) {
    const allItems = [...recipe.ingredients, ...recipe.instructions];
    for (let i = allItems.length - 1; i >= 0; i--) {
      const w = allItems[i].trim().toLowerCase();
      if (difficultyWords[w]) {
        recipe.difficulty = difficultyWords[w];
        // Remove from whichever list it was in
        const ingIdx = recipe.ingredients.indexOf(allItems[i]);
        if (ingIdx >= 0) recipe.ingredients.splice(ingIdx, 1);
        const stepIdx = recipe.instructions.indexOf(allItems[i]);
        if (stepIdx >= 0) recipe.instructions.splice(stepIdx, 1);
        break;
      }
    }
  }

  // Extract servings from last items if not set (Hebrew number word alone)
  if (!recipe.servings) {
    const allItems = [...recipe.ingredients, ...recipe.instructions];
    for (let i = allItems.length - 1; i >= 0; i--) {
      const w = allItems[i].trim().toLowerCase();
      if (hebrewNumberValues[w]) {
        recipe.servings = hebrewNumberValues[w];
        const ingIdx = recipe.ingredients.indexOf(allItems[i]);
        if (ingIdx >= 0) recipe.ingredients.splice(ingIdx, 1);
        const stepIdx = recipe.instructions.indexOf(allItems[i]);
        if (stepIdx >= 0) recipe.instructions.splice(stepIdx, 1);
        break;
      }
    }
  }

  if (!recipe.name) recipe.name = "Untitled Recipe";
  return recipe;
};

/**
 * Parse structured text (with newlines) — the original line-based parser.
 */
const parseStructuredText = (text, recipe) => {
  let lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line);

  if (lines.length === 0) {
    throw new Error("Please paste recipe text");
  }

  lines = lines.filter((line) => {
    const lower = line.toLowerCase();
    return (
      !lower.includes("advertisement") &&
      !lower.includes("subscribe") &&
      !lower.includes("newsletter") &&
      !lower.includes("click here") &&
      !lower.includes("sign up") &&
      !lower.includes("follow us") &&
      !lower.includes("share") &&
      !lower.includes("print") &&
      !lower.includes("save") &&
      !lower.includes("rating") &&
      !lower.includes("review") &&
      !lower.includes("comment") &&
      !line.includes("פרסומת") &&
      !line.includes("מודעה") &&
      !line.includes("הירשם") &&
      !line.includes("שתף") &&
      line.length > 2 &&
      line.length < 300
    );
  });

  const titleCandidates = lines
    .slice(0, 10)
    .filter(
      (line) =>
        (line.length > 5 &&
          line.length < 100 &&
          !line.toLowerCase().includes("recipe")) ||
        line.split(" ").length <= 10,
    );

  recipe.name = titleCandidates[0] || lines[0] || "Untitled Recipe";

  const ingredientsKeywords = [
    "ingredients",
    "מרכיבים",
    "המרכיבים",
    "חומרים",
    "רכיבים",
    "מצרכים",
    "המצרכים",
  ];
  const instructionsKeywords = [
    "instructions",
    "directions",
    "method",
    "preparation",
    "steps",
    "הוראות",
    "אופן הכנה",
    "אופן ההכנה",
    "הכנה",
    "שלבים",
    "שלבי הכנה",
    "להכנת",
  ];
  const timeKeywords = [
    "prep time",
    "cook time",
    "total time",
    "זמן הכנה",
    "זמן בישול",
  ];
  const servingsKeywords = ["servings", "serves", "yield", "מנות"];
  const notesKeywords = [
    "טיפים",
    "טיפים ותחליפים",
    "הערות",
    "הערות המתכון",
    "tips",
    "notes",
    "chef's tips",
  ];
  let ingredientsStart = -1;
  let ingredientsEnd = -1;
  let instructionsStart = -1;
  let currentSection = "none";
  let ingredientsViaGroup = false;

  const instructionVerbRe =
    /^(לשים|לערבב|לבשל|לאפות|להוסיף|להכניס|לחמם|לקרר|להקציף|להפריד|לחתוך|לטגן|למזוג|לערום|לקפל|למרוח|לגרד|לסנן|ליצור|להגיש|לפזר|למלא|לכסות|לרדד|ללוש|לגלגל|לצקת|להמתין|לנקות|לשטוף|לקלף|לרסק|לטחון|למעוך|מוסיפים|מערבבים|שמים|מחממים|אופים|מבשלים|מחכים|יוצקים|מורחים|מכניסים|שופכים|מקציפים|חותכים|מטגנים|מגישים|מפזרים|ממלאים|מכסים|בקערה|כדי)\b/;

  const isSectionHeader = (line, keywords) => {
    const clean = line.replace(/[:\s\-–—]/g, "");
    if (clean.length > 35) return false;
    return keywords.some((kw) => line.includes(kw));
  };

  for (let i = 0; i < lines.length; i++) {
    const lowerLine = lines[i].toLowerCase();

    if (isSectionHeader(lowerLine, ingredientsKeywords)) {
      ingredientsStart = i + 1;
      currentSection = "ingredients";
      ingredientsViaGroup = false;
      continue;
    }

    if (isSectionHeader(lowerLine, instructionsKeywords)) {
      instructionsStart = i + 1;
      currentSection = "instructions";
      ingredientsViaGroup = false;
      for (const kw of instructionsKeywords) {
        const kwIdx = lowerLine.indexOf(kw);
        if (kwIdx !== -1) {
          const afterKw = lines[i]
            .substring(kwIdx + kw.length)
            .replace(/^[:\s\-–—]+/, "")
            .trim();
          if (afterKw.length > 10) {
            recipe.instructions.push(afterKw);
          }
          break;
        }
      }
      continue;
    }

    if (timeKeywords.some((keyword) => lowerLine.includes(keyword))) {
      const timeMatch = lines[i].match(/(\d+)\s*(min|minutes|hour|hours|h|m)/i);
      if (timeMatch) {
        const value = timeMatch[1];
        const unit = timeMatch[2].toLowerCase();
        const timeStr = unit.startsWith("h") ? `${value}h` : `${value}min`;

        if (lowerLine.includes("prep")) {
          recipe.prepTime = timeStr;
        } else if (lowerLine.includes("cook")) {
          recipe.cookTime = timeStr;
        }
      }
      continue;
    }

    if (servingsKeywords.some((keyword) => lowerLine.includes(keyword))) {
      const servingsMatch = lines[i].match(/(\d+)/);
      if (servingsMatch) {
        recipe.servings = servingsMatch[1];
      }
      continue;
    }

    if (isSectionHeader(lowerLine, notesKeywords)) {
      currentSection = "notes";
      continue;
    }

    if (currentSection === "notes") {
      if (lines[i].length > 3) {
        recipe.notes += (recipe.notes ? "\n" : "") + lines[i];
      }
      continue;
    }

    if (currentSection !== "ingredients") {
      const groupClean = lines[i].replace(/[:\-–—]+\s*$/, "").trim();
      const isKnownGroup =
        GROUP_LINE_PATTERNS[0].test(groupClean + " ") ||
        GROUP_LINE_PATTERNS[2].test(groupClean);
      const isHebrewLGroup =
        /^ל[\u0590-\u05FF]/.test(groupClean) &&
        lines[i].trim().endsWith(":") &&
        groupClean.length < 15;
      if (
        groupClean.length > 1 &&
        groupClean.length <= 20 &&
        groupClean.split(/\s+/).length <= 3 &&
        (isKnownGroup || isHebrewLGroup)
      ) {
        if (ingredientsStart < 0) ingredientsStart = i;
        currentSection = "ingredients";
        ingredientsViaGroup = true;
        recipe.ingredients.push("::" + groupClean);
        continue;
      }
    }

    if (
      currentSection === "ingredients" &&
      ingredientsViaGroup &&
      ingredientsStart > 0 &&
      instructionVerbRe.test(lines[i]) &&
      lines[i].length > 20
    ) {
      currentSection = "instructions";
      ingredientsViaGroup = false;
      if (instructionsStart < 0) instructionsStart = i;
      recipe.instructions.push(
        lines[i].replace(/^(?:\d+[\.\)]\s+|[-•\*]\s*)/, ""),
      );
      continue;
    }

    if (currentSection === "ingredients" && ingredientsStart > 0) {
      const stripped = lines[i].replace(/^(?:\d+[\.\)]\s+|[-•\*]\s*)/, "");
      if (isIngredientGroupLine(stripped)) {
        recipe.ingredients.push(
          "::" + stripped.replace(/[:\-–—]+\s*$/, "").trim(),
        );
      } else if (lines[i].match(/^[\d\-•\*]/) || lines[i].length > 5) {
        recipe.ingredients.push(stripped);
      }
    } else if (currentSection === "instructions" && instructionsStart > 0) {
      if (lines[i].length > 3) {
        recipe.instructions.push(
          lines[i].replace(/^(?:\d+[\.\)]\s+|[-•\*]\s*)/, ""),
        );
      }
    }
  }

  if (recipe.ingredients.length === 0 && recipe.instructions.length === 0) {
    const contentLines = lines.slice(1);
    const midpoint = Math.ceil(contentLines.length / 2);
    recipe.ingredients = contentLines
      .slice(0, midpoint)
      .filter(
        (line) =>
          line.match(/^[\d\-•\*]/) || (line.length > 3 && line.length < 100),
      );
    recipe.instructions = contentLines
      .slice(midpoint)
      .filter((line) => line.length > 10);
  } else if (recipe.ingredients.length === 0) {
    recipe.ingredients = lines
      .slice(1, Math.min(15, lines.length))
      .filter(
        (line) =>
          line.match(/^[\d\-•\*]/) || (line.length > 5 && line.length < 100),
      );
  } else if (recipe.instructions.length === 0) {
    recipe.instructions = lines
      .slice(Math.max(1, lines.length - 20))
      .filter((line) => line.length > 20);
  }

  return recipe;
};

/**
 * Parse recipe from speech or text.
 * For speech: splits a single continuous string into sections using keyword detection.
 * For pasted text: uses newlines already present.
 */
export const parseRecipeFromText = (text) => {
  const recipe = {
    name: "",
    ingredients: [],
    instructions: [],
    prepTime: "",
    cookTime: "",
    servings: "",
    notes: "",
    image_src: "https://source.unsplash.com/400x300/?food,recipe",
  };

  const isSpeech = !text.includes("\n");

  if (isSpeech) {
    return parseSpeechText(text, recipe);
  }

  return parseStructuredText(text, recipe);
};

const parseDuration = (duration) => {
  if (!duration) return "";

  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!match) return duration;

  const hours = match[1] ? parseInt(match[1]) : 0;
  const minutes = match[2] ? parseInt(match[2]) : 0;

  if (hours > 0 && minutes > 0) {
    return `${hours}h ${minutes}min`;
  } else if (hours > 0) {
    return `${hours}h`;
  } else if (minutes > 0) {
    return `${minutes}min`;
  }

  return "";
};
