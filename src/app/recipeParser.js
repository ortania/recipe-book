const CLOUD_FUNCTION_URL =
  "https://us-central1-recipe-book-82d57.cloudfunctions.net/fetchUrl";

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

const fetchWithProxy = async (url) => {
  // Try Firebase Cloud Function first — returns html + cleanText + jsonLd + ogImage
  try {
    console.log("[fetchProxy] Trying Cloud Function...");
    const cfUrl = `${CLOUD_FUNCTION_URL}?url=${encodeURIComponent(url)}`;
    const cfResponse = await fetch(cfUrl);
    console.log("[fetchProxy] CF status:", cfResponse.status);
    if (cfResponse.ok) {
      const data = await cfResponse.json();
      console.log(
        "[fetchProxy] CF html length:",
        (data.contents || "").length,
        "cleanText length:",
        (data.cleanText || "").length,
      );
      if (data.contents && data.contents.length > 200) {
        return data;
      }
    }
  } catch (e) {
    console.warn("[fetchProxy] Cloud Function failed:", e.message);
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

export const parseRecipeFromUrl = async (url) => {
  try {
    console.log("[recipeParser] Parsing URL:", url);
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

    console.log(
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
      image_src: serverOgImage,
    };

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
          console.log(
            "[recipeParser] Found Recipe in JSON-LD:",
            recipeData.name,
          );
          recipe.name = cleanHtml(recipeData.name || "");

          if (recipeData.recipeIngredient) {
            recipe.ingredients = Array.isArray(recipeData.recipeIngredient)
              ? recipeData.recipeIngredient
                  .map(cleanHtml)
                  .filter(Boolean)
                  .join(", ")
              : cleanHtml(recipeData.recipeIngredient);
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
                      .join(". ");
                  }
                  if (step.name) return cleanHtml(step.name);
                  return "";
                })
                .filter(Boolean)
                .join(". ");
            } else if (typeof recipeData.recipeInstructions === "string") {
              recipe.instructions = cleanHtml(recipeData.recipeInstructions);
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

          return recipe;
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

    if (articleHeadline) recipe.name = articleHeadline;
    if (articleImage && !recipe.image_src) recipe.image_src = articleImage;

    // Use articleBody if available (cleaner than generic page text), otherwise use server cleanText
    const cleanText = articleBody || serverCleanText || "";
    console.log(
      "[recipeParser] No JSON-LD Recipe found. articleBody:",
      articleBody.length,
      "cleanText:",
      cleanText.length,
    );

    if (cleanText.length > 100) {
      // Try OpenAI extraction
      try {
        console.log("[recipeParser] Trying OpenAI extraction...");
        const { extractRecipeFromText: aiExtract } =
          await import("../services/openai");
        const aiResult = await aiExtract(cleanText);
        console.log("[recipeParser] OpenAI result:", aiResult);

        if (aiResult && !aiResult.error) {
          recipe.name = aiResult.name || "";
          if (Array.isArray(aiResult.ingredients))
            recipe.ingredients = aiResult.ingredients.join(", ");
          if (Array.isArray(aiResult.instructions))
            recipe.instructions = aiResult.instructions.join(". ");
          recipe.prepTime = aiResult.prepTime || "";
          recipe.cookTime = aiResult.cookTime || "";
          recipe.servings = aiResult.servings || "";
          return recipe;
        }
      } catch (aiError) {
        console.error("[recipeParser] OpenAI extraction failed:", aiError);
      }

      // Fallback: local text parsing
      try {
        console.log("[recipeParser] Trying local text parsing...");
        const textResult = parseRecipeFromText(cleanText);
        if (textResult.name) recipe.name = textResult.name;
        if (textResult.ingredients.length > 0)
          recipe.ingredients = textResult.ingredients.join(", ");
        if (textResult.instructions.length > 0)
          recipe.instructions = textResult.instructions.join(". ");
        if (recipe.name && recipe.ingredients) return recipe;
      } catch (textError) {
        console.error("[recipeParser] Local text parsing failed:", textError);
      }
    }

    if (!recipe.name || !recipe.ingredients) {
      throw new Error("Could not extract enough recipe data.");
    }

    return recipe;
  } catch (error) {
    console.error("Error parsing recipe:", error);
    throw error;
  }
};

export const parseRecipeFromText = (text) => {
  const recipe = {
    name: "",
    ingredients: [],
    instructions: [],
    prepTime: "",
    cookTime: "",
    servings: "",
    image_src: "https://source.unsplash.com/400x300/?food,recipe",
  };

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
  let ingredientsStart = -1;
  let ingredientsEnd = -1;
  let instructionsStart = -1;
  let currentSection = "none";

  for (let i = 0; i < lines.length; i++) {
    const lowerLine = lines[i].toLowerCase();

    if (ingredientsKeywords.some((keyword) => lowerLine.includes(keyword))) {
      ingredientsStart = i + 1;
      currentSection = "ingredients";
      continue;
    }

    if (instructionsKeywords.some((keyword) => lowerLine.includes(keyword))) {
      instructionsStart = i + 1;
      currentSection = "instructions";
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

    if (currentSection === "ingredients" && ingredientsStart > 0) {
      if (lines[i].match(/^[\d\-•\*]/) || lines[i].length > 5) {
        recipe.ingredients.push(lines[i].replace(/^[\d\-•\*\.]\s*/, ""));
      }
    } else if (currentSection === "instructions" && instructionsStart > 0) {
      if (lines[i].length > 3) {
        recipe.instructions.push(lines[i].replace(/^[\d\-•\*\.]\s*/, ""));
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
