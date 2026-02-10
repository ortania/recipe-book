const fetchWithProxy = async (url) => {
  const proxies = [
    (u) => `https://api.allorigins.win/get?url=${encodeURIComponent(u)}`,
    (u) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(u)}`,
  ];

  for (const makeProxy of proxies) {
    try {
      const proxyUrl = makeProxy(url);
      const response = await fetch(proxyUrl);
      if (!response.ok) continue;
      const contentType = response.headers.get("content-type") || "";
      if (contentType.includes("json")) {
        const data = await response.json();
        const html = data.contents || data;
        if (typeof html === "string" && html.length > 200) return html;
      } else {
        const html = await response.text();
        if (html.length > 200) return html;
      }
    } catch (e) {
      continue;
    }
  }
  throw new Error("All proxies failed to fetch the URL.");
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

export const parseRecipeFromUrl = async (url) => {
  try {
    const html = await fetchWithProxy(url);

    if (isBotBlocked(html)) {
      throw new Error(
        "BLOCKED: This website blocks automated access. Please copy the recipe text from the website and paste it in the Text tab.",
      );
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    const recipe = {
      name: "",
      ingredients: "",
      instructions: "",
      prepTime: "",
      cookTime: "",
      servings: "",
      image_src: "",
    };

    // --- Try JSON-LD structured data first ---
    const jsonLdScripts = doc.querySelectorAll(
      'script[type="application/ld+json"]',
    );
    for (const script of jsonLdScripts) {
      try {
        let data = JSON.parse(script.textContent);
        if (Array.isArray(data)) data = data[0];
        const recipeData =
          data["@type"] === "Recipe"
            ? data
            : Array.isArray(data["@graph"])
              ? data["@graph"].find((item) => item["@type"] === "Recipe")
              : null;

        if (recipeData) {
          recipe.name = recipeData.name || "";

          if (recipeData.recipeIngredient) {
            recipe.ingredients = Array.isArray(recipeData.recipeIngredient)
              ? recipeData.recipeIngredient.join(", ")
              : recipeData.recipeIngredient;
          }

          if (recipeData.recipeInstructions) {
            if (Array.isArray(recipeData.recipeInstructions)) {
              recipe.instructions = recipeData.recipeInstructions
                .map((step) => {
                  if (typeof step === "string") return step;
                  if (step.text) return step.text;
                  if (
                    step.itemListElement &&
                    Array.isArray(step.itemListElement)
                  ) {
                    return step.itemListElement
                      .map((s) => s.text || s.name || "")
                      .filter(Boolean)
                      .join(". ");
                  }
                  if (step.name) return step.name;
                  return "";
                })
                .filter(Boolean)
                .join(". ");
            } else if (typeof recipeData.recipeInstructions === "string") {
              recipe.instructions = recipeData.recipeInstructions;
            }
          }

          if (recipeData.prepTime) {
            recipe.prepTime = parseDuration(recipeData.prepTime);
          }

          if (recipeData.cookTime) {
            recipe.cookTime = parseDuration(recipeData.cookTime);
          }

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

          if (!recipe.image_src) {
            recipe.image_src = extractOgImage(doc);
          }

          return recipe;
        }
      } catch (e) {
        continue;
      }
    }

    // --- Fallback: use OpenAI to extract from page text ---
    if (!recipe.image_src) {
      recipe.image_src = extractOgImage(doc);
    }

    const bodyText = doc.body ? doc.body.innerText || doc.body.textContent : "";

    if (bodyText && bodyText.length > 100) {
      try {
        const { extractRecipeFromText: aiExtract } =
          await import("../services/openai");
        const aiResult = await aiExtract(bodyText);

        if (aiResult && !aiResult.error) {
          recipe.name = aiResult.name || "";
          if (Array.isArray(aiResult.ingredients)) {
            recipe.ingredients = aiResult.ingredients.join(", ");
          }
          if (Array.isArray(aiResult.instructions)) {
            recipe.instructions = aiResult.instructions.join(". ");
          }
          recipe.prepTime = aiResult.prepTime || "";
          recipe.cookTime = aiResult.cookTime || "";
          recipe.servings = aiResult.servings || "";
          return recipe;
        }
      } catch (aiError) {
        console.error("OpenAI extraction failed:", aiError);
      }
    }

    if (!recipe.name || !recipe.ingredients) {
      throw new Error(
        "Could not extract enough recipe data. Please use the Text tab and paste the recipe manually.",
      );
    }

    return recipe;
  } catch (error) {
    console.error("Error parsing recipe:", error);
    throw new Error(
      "Failed to import recipe. Please check the URL or enter the recipe manually.",
    );
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
