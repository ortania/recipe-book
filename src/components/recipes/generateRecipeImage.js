function loadImage(src) {
  return new Promise((resolve, reject) => {
    fetch(src)
      .then((res) => res.blob())
      .then((blob) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = reject;
          img.src = reader.result;
        };
        reader.readAsDataURL(blob);
      })
      .catch(reject);
  });
}

function wrapText(ctx, text, maxWidth) {
  const words = text.split(" ");
  const lines = [];
  let currentLine = "";

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

function drawRoundedRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

export async function generateRecipeImage(recipe, t) {
  const WIDTH = 1080;
  const PADDING = 60;
  const CONTENT_WIDTH = WIDTH - PADDING * 2;

  const ingredientsArray = Array.isArray(recipe.ingredients)
    ? recipe.ingredients
    : recipe.ingredients
        ?.split(",")
        .map((item) => item.trim())
        .filter((item) => item) || [];

  const instructionsArray = Array.isArray(recipe.instructions)
    ? recipe.instructions
    : recipe.instructions
        ?.split(".")
        .map((item) => item.trim())
        .filter((item) => item && item.length > 10) || [];

  // Pre-load recipe image
  let loadedImg = null;
  if (recipe.image_src) {
    try {
      loadedImg = await loadImage(recipe.image_src);
    } catch {
      loadedImg = null;
    }
  }

  // Calculate image height preserving aspect ratio
  let imageHeight = 0;
  if (loadedImg) {
    const aspectRatio = loadedImg.naturalHeight / loadedImg.naturalWidth;
    imageHeight = Math.round(WIDTH * aspectRatio);
  }

  // Pre-calculate height
  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  const ctx = canvas.getContext("2d");

  // Measure text heights
  const TITLE_FONT = 'bold 42px "Raleway", sans-serif';
  const SECTION_FONT = 'bold 28px "Raleway", sans-serif';
  const BODY_FONT = '22px "Raleway", sans-serif';
  const META_FONT = '20px "Raleway", sans-serif';
  const NOTES_FONT = '21px "Raleway", sans-serif';
  const LINE_HEIGHT = 34;

  let totalHeight = 0;

  // Image area
  totalHeight += imageHeight;

  // Title
  totalHeight += 50; // top padding
  ctx.font = TITLE_FONT;
  const titleLines = wrapText(
    ctx,
    recipe.name || "Untitled Recipe",
    CONTENT_WIDTH,
  );
  totalHeight += titleLines.length * 52;

  // Meta info (prep time, cook time, difficulty)
  totalHeight += 50;

  // Ingredients section
  totalHeight += 60; // section header + spacing
  ctx.font = BODY_FONT;
  for (const ing of ingredientsArray) {
    const lines = wrapText(ctx, ing, CONTENT_WIDTH - 40);
    totalHeight += lines.length * LINE_HEIGHT + 8;
  }
  if (ingredientsArray.length === 0) totalHeight += LINE_HEIGHT;

  // Instructions section
  totalHeight += 60; // section header + spacing
  for (let i = 0; i < instructionsArray.length; i++) {
    const lines = wrapText(
      ctx,
      `${i + 1}. ${instructionsArray[i]}`,
      CONTENT_WIDTH - 20,
    );
    totalHeight += lines.length * LINE_HEIGHT + 12;
  }
  if (instructionsArray.length === 0) totalHeight += LINE_HEIGHT;

  // Notes section
  if (recipe.notes) {
    totalHeight += 60; // divider + section header
    ctx.font = NOTES_FONT;
    const notesLines = wrapText(ctx, recipe.notes, CONTENT_WIDTH - 40);
    totalHeight += notesLines.length * LINE_HEIGHT + 16;
  }

  // Footer
  totalHeight += 80;

  // Set final canvas height
  canvas.height = totalHeight;

  // ─── Background ───
  ctx.fillStyle = "#fafafa";
  ctx.fillRect(0, 0, WIDTH, totalHeight);

  // ─── Recipe Image ───
  let y = 0;
  if (loadedImg && imageHeight > 0) {
    ctx.drawImage(loadedImg, 0, 0, WIDTH, imageHeight);
    // Gradient overlay at bottom of image
    const gradH = Math.min(120, imageHeight);
    const gradient = ctx.createLinearGradient(
      0,
      imageHeight - gradH,
      0,
      imageHeight,
    );
    gradient.addColorStop(0, "rgba(0,0,0,0)");
    gradient.addColorStop(1, "rgba(0,0,0,0.6)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, imageHeight - gradH, WIDTH, gradH);
    y = imageHeight;
  }

  // ─── Title ───
  y += 50;
  ctx.font = TITLE_FONT;
  ctx.fillStyle = "#1a1a1a";
  ctx.textAlign = "center";
  for (const line of titleLines) {
    ctx.fillText(line, WIDTH / 2, y);
    y += 52;
  }
  ctx.textAlign = "start";

  // ─── Meta Info Bar ───
  y += 10;
  const metaParts = [];
  if (recipe.prepTime) metaParts.push(`⏱ Prep: ${recipe.prepTime}`);
  if (recipe.cookTime) metaParts.push(`🔥 Cook: ${recipe.cookTime}`);
  if (recipe.difficulty && recipe.difficulty !== "Unknown") {
    const diffMap = {
      VeryEasy: "Very Easy",
      Easy: "Easy",
      Medium: "Medium",
      Hard: "Hard",
    };
    metaParts.push(`📊 ${diffMap[recipe.difficulty] || recipe.difficulty}`);
  }
  if (recipe.servings)
    metaParts.push(
      `🍽 ${recipe.servings} ${t ? t("recipes", "servings") : "servings"}`,
    );

  if (metaParts.length > 0) {
    // Draw meta bar background
    drawRoundedRect(ctx, PADDING - 10, y - 6, CONTENT_WIDTH + 20, 40, 10);
    ctx.fillStyle = "#f0f0f0";
    ctx.fill();

    ctx.font = META_FONT;
    ctx.fillStyle = "#666";
    ctx.textAlign = "center";
    ctx.fillText(metaParts.join("   •   "), WIDTH / 2, y + 22);
    ctx.textAlign = "start";
    y += 40;
  }

  // ─── Divider ───
  y += 20;
  ctx.strokeStyle = "#e0e0e0";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(PADDING, y);
  ctx.lineTo(WIDTH - PADDING, y);
  ctx.stroke();

  // ─── Ingredients Section ───
  y += 30;
  ctx.font = SECTION_FONT;
  ctx.fillStyle = "#0066cc";
  ctx.fillText(
    `🥗  ${t ? t("recipes", "ingredients") : "Ingredients"}`,
    PADDING,
    y,
  );
  y += 30;

  ctx.font = BODY_FONT;
  ctx.fillStyle = "#333";
  if (ingredientsArray.length > 0) {
    for (const ing of ingredientsArray) {
      // Bullet point
      ctx.fillStyle = "#0066cc";
      ctx.beginPath();
      ctx.arc(PADDING + 10, y - 4, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#333";
      const lines = wrapText(ctx, ing, CONTENT_WIDTH - 40);
      for (let j = 0; j < lines.length; j++) {
        ctx.fillText(lines[j], PADDING + 28, y + j * LINE_HEIGHT);
      }
      y += lines.length * LINE_HEIGHT + 8;
    }
  } else {
    ctx.fillStyle = "#999";
    ctx.fillText(
      t ? t("recipes", "noIngredientsListed") : "No ingredients listed",
      PADDING + 28,
      y,
    );
    y += LINE_HEIGHT;
  }

  // ─── Divider ───
  y += 10;
  ctx.strokeStyle = "#e0e0e0";
  ctx.beginPath();
  ctx.moveTo(PADDING, y);
  ctx.lineTo(WIDTH - PADDING, y);
  ctx.stroke();

  // ─── Instructions Section ───
  y += 30;
  ctx.font = SECTION_FONT;
  ctx.fillStyle = "#0066cc";
  ctx.fillText(
    `📝  ${t ? t("recipes", "instructions") : "Instructions"}`,
    PADDING,
    y,
  );
  y += 30;

  ctx.font = BODY_FONT;
  if (instructionsArray.length > 0) {
    for (let i = 0; i < instructionsArray.length; i++) {
      // Step number circle
      ctx.fillStyle = "#0066cc";
      ctx.beginPath();
      ctx.arc(PADDING + 14, y - 2, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.font = 'bold 16px "Raleway", sans-serif';
      ctx.textAlign = "center";
      ctx.fillText(`${i + 1}`, PADDING + 14, y + 4);
      ctx.textAlign = "start";

      ctx.font = BODY_FONT;
      ctx.fillStyle = "#333";
      const lines = wrapText(ctx, instructionsArray[i], CONTENT_WIDTH - 50);
      for (let j = 0; j < lines.length; j++) {
        ctx.fillText(lines[j], PADDING + 40, y + j * LINE_HEIGHT);
      }
      y += lines.length * LINE_HEIGHT + 12;
    }
  } else {
    ctx.fillStyle = "#999";
    ctx.fillText(
      t ? t("recipes", "noInstructionsListed") : "No instructions provided",
      PADDING + 28,
      y,
    );
    y += LINE_HEIGHT;
  }

  // ─── Notes Section ───
  if (recipe.notes) {
    y += 10;
    ctx.strokeStyle = "#e0e0e0";
    ctx.beginPath();
    ctx.moveTo(PADDING, y);
    ctx.lineTo(WIDTH - PADDING, y);
    ctx.stroke();

    y += 30;
    ctx.font = SECTION_FONT;
    ctx.fillStyle = "#7c3aed";
    ctx.fillText(`📝  ${t ? t("recipes", "notes") : "Notes"}`, PADDING, y);
    y += 30;

    // Notes background
    ctx.font = NOTES_FONT;
    const notesLines = wrapText(ctx, recipe.notes, CONTENT_WIDTH - 40);
    const notesBgHeight = notesLines.length * LINE_HEIGHT + 24;
    drawRoundedRect(ctx, PADDING, y - 16, CONTENT_WIDTH, notesBgHeight, 12);
    ctx.fillStyle = "#f5f3ff";
    ctx.fill();
    ctx.strokeStyle = "#ddd6fe";
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = "#4c1d95";
    for (let j = 0; j < notesLines.length; j++) {
      ctx.fillText(notesLines[j], PADDING + 20, y + j * LINE_HEIGHT + 6);
    }
    y += notesBgHeight;
  }

  // ─── Footer ───
  y += 20;
  ctx.strokeStyle = "#e0e0e0";
  ctx.beginPath();
  ctx.moveTo(PADDING, y);
  ctx.lineTo(WIDTH - PADDING, y);
  ctx.stroke();
  y += 30;
  ctx.font = '18px "Raleway", sans-serif';
  ctx.fillStyle = "#aaa";
  ctx.textAlign = "center";
  ctx.fillText("CookiPal App", WIDTH / 2, y);

  // ─── Export ───
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${(recipe.name || "recipe").replace(/[^a-zA-Z0-9\u0590-\u05FF ]/g, "").trim()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      resolve();
    }, "image/png");
  });
}
