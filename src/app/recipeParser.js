export const parseRecipeFromUrl = async (url) => {
  try {
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
    const response = await fetch(proxyUrl);

    if (!response.ok) {
      throw new Error(`Failed to fetch recipe: ${response.status}`);
    }

    const data = await response.json();
    const html = data.contents;

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    const recipe = {
      name: "",
      ingredients: "",
      instructions: "",
      prepTime: "",
      cookTime: "",
      servings: "",
      image_src: "https://source.unsplash.com/400x300/?food,recipe",
    };

    const jsonLdScripts = doc.querySelectorAll(
      'script[type="application/ld+json"]',
    );
    for (const script of jsonLdScripts) {
      try {
        const data = JSON.parse(script.textContent);
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
              recipe.image_src = recipeData.image[0];
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

    if (!recipe.name) {
      const h1 = doc.querySelector("h1");
      if (h1) recipe.name = h1.textContent.trim();
    }

    if (!recipe.ingredients) {
      const ingredientSelectors = [
        ".ingredients li",
        ".ingredient-list li",
        "[class*='ingredient'] li",
        "ul[class*='ingredient'] li",
        ".recipe-ingredients li",
      ];

      for (const selector of ingredientSelectors) {
        const items = doc.querySelectorAll(selector);
        if (items.length > 0) {
          recipe.ingredients = Array.from(items)
            .map((item) => item.textContent.trim())
            .filter((text) => text.length > 2)
            .join(", ");
          if (recipe.ingredients) break;
        }
      }
    }

    if (!recipe.instructions) {
      const instructionSelectors = [
        ".instructions li",
        ".directions li",
        ".recipe-directions li",
        "[class*='instruction'] li",
        "[class*='direction'] li",
        ".steps li",
        ".recipe-steps li",
        ".method li",
        ".preparation li",
        "ol li",
        ".instructions p",
        ".directions p",
        "[class*='instruction'] p",
        "[class*='direction'] p",
      ];

      for (const selector of instructionSelectors) {
        const items = doc.querySelectorAll(selector);
        if (items.length > 0) {
          recipe.instructions = Array.from(items)
            .map((item) => item.textContent.trim())
            .filter(
              (text) =>
                text.length > 10 &&
                !text.toLowerCase().includes("advertisement"),
            )
            .join(". ");
          if (recipe.instructions && recipe.instructions.length > 50) break;
        }
      }

      if (!recipe.instructions || recipe.instructions.length < 50) {
        const allParagraphs = doc.querySelectorAll("p");
        const instructionParagraphs = Array.from(allParagraphs)
          .map((p) => p.textContent.trim())
          .filter(
            (text) =>
              text.length > 30 &&
              text.length < 500 &&
              (text.match(/\d+\./g) ||
                text.toLowerCase().includes("bake") ||
                text.toLowerCase().includes("cook") ||
                text.toLowerCase().includes("mix") ||
                text.toLowerCase().includes("heat") ||
                text.toLowerCase().includes("add")),
          );

        if (instructionParagraphs.length > 0) {
          recipe.instructions = instructionParagraphs.join(". ");
        }
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
    ingredients: "",
    instructions: "",
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

  const ingredientsKeywords = ["ingredients", "מרכיבים", "חומרים"];
  const instructionsKeywords = [
    "instructions",
    "directions",
    "method",
    "preparation",
    "steps",
    "הוראות",
    "אופן הכנה",
    "שלבים",
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
      if (instructionsStart === -1 || i < instructionsStart) {
        if (lines[i].match(/^[\d\-•\*]/) || lines[i].length > 5) {
          recipe.ingredients +=
            (recipe.ingredients ? ", " : "") +
            lines[i].replace(/^[\d\-•\*\.]\s*/, "");
        }
      }
    }

    if (
      currentSection === "instructions" &&
      instructionsStart > 0 &&
      i >= instructionsStart
    ) {
      if (lines[i].length > 10) {
        recipe.instructions +=
          (recipe.instructions ? ". " : "") +
          lines[i].replace(/^[\d\-•\*\.]\s*/, "");
      }
    }
  }

  if (!recipe.ingredients) {
    const possibleIngredients = lines
      .slice(1, Math.min(15, lines.length))
      .filter(
        (line) =>
          line.match(/^[\d\-•\*]/) || (line.length > 5 && line.length < 100),
      );
    recipe.ingredients = possibleIngredients.join(", ");
  }

  if (!recipe.instructions) {
    const possibleInstructions = lines
      .slice(Math.max(1, lines.length - 20))
      .filter((line) => line.length > 20);
    recipe.instructions = possibleInstructions.join(". ");
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
