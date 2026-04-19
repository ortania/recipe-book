import { Filesystem, Directory } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import { CapacitorHttp } from "@capacitor/core";
import { Media } from "@capacitor-community/media";

function loadImage(src) {
  const isNative =
    typeof window !== "undefined" &&
    window.Capacitor?.isNativePlatform?.() === true;

  const proxyUrl = src.includes("firebasestorage.googleapis.com")
    ? src.replace("https://firebasestorage.googleapis.com", "/firebase-storage")
    : null;

  function fetchAsDataUrl(url) {
    return fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.blob();
      })
      .then(
        (blob) =>
          new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          }),
      );
  }

  function loadAsImg(dataUrl) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = dataUrl;
    });
  }

  function loadCrossOriginImg(url) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    });
  }

  // On Capacitor / Android, browser fetch() and crossOrigin <img> are both
  // subject to CORS. Recipes imported from arbitrary third-party sites will
  // not have Access-Control-Allow-Origin headers, so both of those fail.
  //
  // CapacitorHttp performs requests from the native (Java/Kotlin) side, which
  // is NOT subject to browser CORS. That's the only reliable way to pull an
  // arbitrary image into a canvas on native. It returns the body as a base64
  // string when responseType is "blob" / "arraybuffer".
  if (isNative) {
    const errors = [];

    async function loadViaCapacitorHttp() {
      const res = await CapacitorHttp.request({
        method: "GET",
        url: src,
        responseType: "blob",
      });
      if (!res || res.status < 200 || res.status >= 300) {
        throw new Error(`HTTP ${res?.status ?? "?"}`);
      }
      // Guess MIME from URL extension; JPEG is a safe default since the
      // browser's <img> decodes any common image regardless of declared type.
      const lower = src.split("?")[0].toLowerCase();
      const mime = lower.endsWith(".png")
        ? "image/png"
        : lower.endsWith(".webp")
          ? "image/webp"
          : lower.endsWith(".gif")
            ? "image/gif"
            : "image/jpeg";
      const dataUrl = `data:${mime};base64,${res.data}`;
      return loadAsImg(dataUrl);
    }

    return loadViaCapacitorHttp()
      .catch((e) => {
        errors.push("CapacitorHttp: " + (e?.message || e));
        return fetchAsDataUrl(src).then(loadAsImg);
      })
      .catch((e) => {
        errors.push("fetch→dataURL: " + (e?.message || e));
        return loadCrossOriginImg(src);
      })
      .catch((e) => {
        errors.push("crossOrigin: " + (e?.message || e));
        const err = new Error(
          "All native image load attempts failed. " + errors.join(" | "),
        );
        err.attempts = errors;
        throw err;
      });
  }

  // Dev image proxy: routes any URL through Vite's Node server (no CORS restriction)
  const devProxyUrl =
    typeof window !== "undefined" &&
    window.location.hostname !== "localhost" &&
    window.location.hostname !== "127.0.0.1"
      ? null // only works when Vite dev server is reachable
      : `/img-proxy?url=${encodeURIComponent(src)}`;

  // 1) Firebase Storage proxy (Vite dev, works on desktop + mobile on local network)
  // 2) Dev image proxy (any URL, works in dev via Node.js fetch – no CORS)
  // 3) Direct fetch → data URL (works in production for CORS-friendly servers)
  // 4) Last resort: crossOrigin img
  const proxyAttempt = proxyUrl
    ? fetchAsDataUrl(proxyUrl).then(loadAsImg)
    : Promise.reject(new Error("no proxy"));

  return proxyAttempt
    .catch(() =>
      devProxyUrl
        ? fetchAsDataUrl(devProxyUrl).then(loadAsImg)
        : Promise.reject(new Error("no dev proxy")),
    )
    .catch(() => fetchAsDataUrl(src).then(loadAsImg))
    .catch(() => {
      const cb = src.includes("?")
        ? `&_cb=${Date.now()}`
        : `?_cb=${Date.now()}`;
      return loadCrossOriginImg(src + cb);
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

// ─── Lucide SVG icon helpers ───

const ICON_SVGS = {
  clock:
    '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
  flame:
    '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',
  chart:
    '<path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/>',
  users:
    '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  servings:
    '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
};

function loadSvgIcon(name, size, color) {
  const svgBody = ICON_SVGS[name];
  if (!svgBody) return Promise.resolve(null);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${svgBody}</svg>`;
  const dataUrl = "data:image/svg+xml," + encodeURIComponent(svg);
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = dataUrl;
  });
}

function drawListIcon(ctx, cx, cy, size, color) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  const s = size / 2;
  for (let i = -1; i <= 1; i++) {
    const ly = cy + i * s * 0.6;
    ctx.beginPath();
    ctx.arc(cx - s * 0.6, ly, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(cx - s * 0.25, ly);
    ctx.lineTo(cx + s * 0.8, ly);
    ctx.stroke();
  }
  ctx.restore();
}

function drawStepsIcon(ctx, cx, cy, size, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2;
  const s = size / 2;
  for (let i = -1; i <= 1; i++) {
    const ly = cy + i * s * 0.6;
    ctx.beginPath();
    ctx.moveTo(cx - s * 0.25, ly);
    ctx.lineTo(cx + s * 0.8, ly);
    ctx.stroke();
  }
  ctx.font = `bold ${size * 0.35}px "Noto Sans Hebrew", sans-serif`;
  ctx.textAlign = "center";
  const nums = ["1", "2", "3"];
  for (let i = -1; i <= 1; i++) {
    ctx.fillText(nums[i + 1], cx - s * 0.6, cy + i * s * 0.6 + size * 0.12);
  }
  ctx.restore();
}

function drawNoteIcon(ctx, cx, cy, size, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  const s = size / 2;
  drawRoundedRect(ctx, cx - s * 0.6, cy - s * 0.75, s * 1.2, s * 1.5, 3);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx - s * 0.3, cy - s * 0.3);
  ctx.lineTo(cx + s * 0.3, cy - s * 0.3);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx - s * 0.3, cy + s * 0.05);
  ctx.lineTo(cx + s * 0.3, cy + s * 0.05);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx - s * 0.3, cy + s * 0.4);
  ctx.lineTo(cx + s * 0.1, cy + s * 0.4);
  ctx.stroke();
  ctx.restore();
}

// ─── Site theme colors ───
const THEME = {
  bgPrimary: "#f7f5f4",
  bgCard: "#ffffff",
  bgTertiary: "#f8f9fa",
  textPrimary: "#635555",
  textSecondary: "#555555",
  textMuted: "#888888",
  accent: "#1a9c5a",
  heading: "#635555",
  border: "#e0e0e0",
  divider: "#dddddd",
  tipColor: "#6b4f2a",
  tipBg: "#f6efe7",
  tipBorder: "#c8a97e",
  footerText: "#999999",
};

const FONT_FAMILY = '"Noto Sans Hebrew", sans-serif';

export async function generateRecipeImage(recipe, t, language) {
  const isNative =
    typeof window !== "undefined" &&
    window.Capacitor?.isNativePlatform?.() === true;

  const WIDTH = 1080;
  const PADDING = 60;
  const CONTENT_WIDTH = WIDTH - PADDING * 2;
  const RTL_LANGS = ["he", "ar", "mixed"];
  const isRTL = RTL_LANGS.includes(language);
  const START_X = isRTL ? WIDTH - PADDING : PADDING;
  const TEXT_ALIGN = isRTL ? "right" : "left";

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
  const recipeImageSrc = recipe.image_src || recipe.image || null;
  let loadedImg = null;
  if (recipeImageSrc) {
    try {
      loadedImg = await loadImage(recipeImageSrc);
    } catch (err) {
      console.warn("[ExportImage] Failed to load image:", err);
      loadedImg = null;
    }
  }

  // Calculate image height preserving aspect ratio, cap max height
  const MAX_IMAGE_H = 600;
  let imageHeight = 0;
  if (loadedImg) {
    const aspectRatio = loadedImg.naturalHeight / loadedImg.naturalWidth;
    imageHeight = Math.min(Math.round(WIDTH * aspectRatio), MAX_IMAGE_H);
  }

  // Pre-calculate height
  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  const ctx = canvas.getContext("2d");

  // Measure text heights
  const TITLE_FONT = `700 42px ${FONT_FAMILY}`;
  const SECTION_FONT = `700 28px ${FONT_FAMILY}`;
  const BODY_FONT = `400 22px ${FONT_FAMILY}`;
  const META_FONT = `500 20px ${FONT_FAMILY}`;
  const NOTES_FONT = `400 21px ${FONT_FAMILY}`;
  const LINE_HEIGHT = 34;

  let totalHeight = 0;

  // Image area or header banner
  const HEADER_BANNER_H = 120;
  totalHeight += imageHeight > 0 ? imageHeight : HEADER_BANNER_H;

  const AUTHOR_FONT = `500 20px ${FONT_FAMILY}`;
  const authorText = recipe.author?.trim() || "";
  const sourceHost =
    !authorText && recipe.sourceUrl
      ? (() => {
          try {
            return new URL(recipe.sourceUrl).hostname.replace(/^www\./, "");
          } catch {
            return "";
          }
        })()
      : "";
  const hasAuthor = Boolean(authorText || sourceHost);
  if (hasAuthor) {
    totalHeight += 36;
  }

  // Title
  totalHeight += 60; // top padding
  ctx.font = TITLE_FONT;
  const titleLines = wrapText(
    ctx,
    recipe.name || "Untitled Recipe",
    CONTENT_WIDTH,
  );
  totalHeight += titleLines.length * 52;

  // Meta info (prep time, cook time, difficulty)
  totalHeight += 60;

  // Ingredients section
  totalHeight += 90; // section header + spacing
  ctx.font = BODY_FONT;
  for (const ing of ingredientsArray) {
    const lines = wrapText(ctx, ing, CONTENT_WIDTH - 40);
    totalHeight += lines.length * LINE_HEIGHT + 8;
  }
  if (ingredientsArray.length === 0) totalHeight += LINE_HEIGHT;

  // Instructions section — keep per-item heights so we can truncate later
  // if the total canvas would exceed the native height limit.
  totalHeight += 90; // section header + spacing
  const instructionHeights = [];
  for (let i = 0; i < instructionsArray.length; i++) {
    const lines = wrapText(
      ctx,
      `${i + 1}. ${instructionsArray[i]}`,
      CONTENT_WIDTH - 20,
    );
    const h = lines.length * LINE_HEIGHT + 12;
    instructionHeights.push(h);
    totalHeight += h;
  }
  if (instructionsArray.length === 0) totalHeight += LINE_HEIGHT;

  // Notes section
  let notesHeight = 0;
  if (recipe.notes) {
    ctx.font = NOTES_FONT;
    const notesLines = wrapText(ctx, recipe.notes, CONTENT_WIDTH - 40);
    // 90 header + 16 padding + 40 bottom spacing + text lines
    notesHeight = 90 + notesLines.length * LINE_HEIGHT + 16 + 40;
    totalHeight += notesHeight;
  }

  // Footer
  totalHeight += 80;

  // ─── Native canvas sizing ───
  //
  // Earlier approach was to scale the whole canvas down to fit under an
  // Android height limit. That made the image very narrow (scale 0.55 →
  // 594 px wide) which looks terrible in the phone gallery.
  //
  // New approach: keep canvas at full 1080 px wide, no scaling. If the
  // content would produce a canvas taller than the WebView can handle
  // reliably, truncate trailing content (notes first, then instructions
  // from the bottom) and show a "truncated" marker. Image, title, meta,
  // and ALL ingredients are always kept.
  const MAX_NATIVE_H = 4500; // safe upper bound for Android canvas export
  const TRUNC_NOTICE_H = 60;
  let truncated = false;
  let skipNotes = false;
  let keptInstructions = instructionsArray.length;

  if (isNative && totalHeight > MAX_NATIVE_H) {
    // Step 1: drop notes entirely if present.
    if (notesHeight > 0) {
      totalHeight -= notesHeight;
      skipNotes = true;
      truncated = true;
    }
    // Step 2: if still too tall, drop instructions from the end.
    if (totalHeight + TRUNC_NOTICE_H > MAX_NATIVE_H) {
      const target = MAX_NATIVE_H - TRUNC_NOTICE_H;
      while (keptInstructions > 0 && totalHeight > target) {
        keptInstructions -= 1;
        totalHeight -= instructionHeights[keptInstructions];
      }
      truncated = true;
    }
    // Add space for the truncation notice we'll draw later.
    if (truncated) {
      totalHeight += TRUNC_NOTICE_H;
    }
  }

  canvas.width = WIDTH;
  canvas.height = Math.round(totalHeight);

  // ─── Direction ───
  ctx.direction = isRTL ? "rtl" : "ltr";

  // ─── Background ───
  ctx.fillStyle = THEME.bgPrimary;
  ctx.fillRect(0, 0, WIDTH, totalHeight);

  // ─── Recipe Image or Header Banner ───
  let y = 0;
  if (loadedImg && imageHeight > 0) {
    // If image was capped, center-crop vertically
    const fullH = Math.round(
      WIDTH * (loadedImg.naturalHeight / loadedImg.naturalWidth),
    );
    if (fullH > imageHeight) {
      const srcY = Math.round(
        (((fullH - imageHeight) / fullH) * loadedImg.naturalHeight) / 2,
      );
      const srcH = Math.round((imageHeight / fullH) * loadedImg.naturalHeight);
      ctx.drawImage(
        loadedImg,
        0,
        srcY,
        loadedImg.naturalWidth,
        srcH,
        0,
        0,
        WIDTH,
        imageHeight,
      );
    } else {
      ctx.drawImage(loadedImg, 0, 0, WIDTH, imageHeight);
    }
    // Gradient overlay at bottom of image
    const gradH = Math.min(120, imageHeight);
    const gradient = ctx.createLinearGradient(
      0,
      imageHeight - gradH,
      0,
      imageHeight,
    );
    gradient.addColorStop(0, "rgba(0,0,0,0)");
    gradient.addColorStop(1, "rgba(0,0,0,0.45)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, imageHeight - gradH, WIDTH, gradH);
    y = imageHeight;
  } else {
    // Decorative header banner when no image
    const bannerGrad = ctx.createLinearGradient(0, 0, WIDTH, HEADER_BANNER_H);
    bannerGrad.addColorStop(0, "#635555");
    bannerGrad.addColorStop(1, "#1a9c5a");
    ctx.fillStyle = bannerGrad;
    ctx.fillRect(0, 0, WIDTH, HEADER_BANNER_H);
    // Subtle pattern line
    ctx.strokeStyle = "rgba(255,255,255,0.15)";
    ctx.lineWidth = 1;
    for (let px = 0; px < WIDTH; px += 40) {
      ctx.beginPath();
      ctx.moveTo(px, 0);
      ctx.lineTo(px + 40, HEADER_BANNER_H);
      ctx.stroke();
    }
    y = HEADER_BANNER_H;
  }

  // ─── Author credit (below image) ───
  if (hasAuthor) {
    y += 26;
    const authorLabel = t ? t("recipeDetails", "recipeBy") : "Recipe by";
    const displayAuthor = authorText || sourceHost;
    ctx.font = AUTHOR_FONT;
    ctx.fillStyle = THEME.textMuted;
    ctx.textAlign = "center";
    ctx.fillText(`${authorLabel}: ${displayAuthor}`, WIDTH / 2, y);
    y += 10;
  }

  // ─── Title ───
  y += 60;
  ctx.font = TITLE_FONT;
  ctx.fillStyle = THEME.heading;
  ctx.textAlign = "center";
  for (const line of titleLines) {
    ctx.fillText(line, WIDTH / 2, y);
    y += 52;
  }
  ctx.textAlign = TEXT_ALIGN;

  // ─── Meta Info Bar ───
  y += 16;
  const metaItems = [];
  // Format time like recipe page: "הכנה 30 דק'" or "Prep 30 min"
  const isHeLang = language === "he" || language === "mixed";
  const minLabel = t ? t("recipes", "minutes") : "min";
  const fmtTime = (val) => {
    const str = String(val).trim();
    return /^\d+$/.test(str) ? `${str} ${minLabel}` : str;
  };
  if (recipe.prepTime && String(recipe.prepTime).trim() !== "0")
    metaItems.push({
      icon: "clock",
      text: `${isHeLang ? "הכנה" : "Prep"} ${fmtTime(recipe.prepTime)}`,
    });
  if (recipe.cookTime && String(recipe.cookTime).trim() !== "0")
    metaItems.push({
      icon: "flame",
      text: `${isHeLang ? "בישול" : "Cook"} ${fmtTime(recipe.cookTime)}`,
    });
  if (recipe.difficulty && recipe.difficulty !== "Unknown") {
    const diffLabel = t
      ? t("difficulty", recipe.difficulty)
      : recipe.difficulty;
    metaItems.push({
      icon: "chart",
      text: diffLabel,
    });
  }
  if (recipe.servings)
    metaItems.push({
      icon: "servings",
      text: `${recipe.servings} ${t ? t("recipes", "servings") : "servings"}`,
    });

  if (metaItems.length > 0) {
    const iconSize = 20;
    // Pre-load Lucide SVG icons for meta bar
    const metaIcons = await Promise.all(
      metaItems.map((item) =>
        loadSvgIcon(item.icon, iconSize, THEME.textMuted),
      ),
    );

    // Draw meta bar background
    drawRoundedRect(ctx, PADDING - 10, y - 6, CONTENT_WIDTH + 20, 48, 12);
    ctx.fillStyle = THEME.bgTertiary;
    ctx.fill();
    ctx.strokeStyle = THEME.border;
    ctx.lineWidth = 1;
    ctx.stroke();

    // Measure total width to center all items
    ctx.font = META_FONT;
    const iconGap = 6;
    const sep = "   \u00B7   ";
    const sepW = ctx.measureText(sep).width;
    const itemWidths = metaItems.map(
      (item) => iconSize + iconGap + ctx.measureText(item.text).width,
    );
    const totalW =
      itemWidths.reduce((a, b) => a + b, 0) + sepW * (metaItems.length - 1);
    let mx = WIDTH / 2 - totalW / 2;
    const metaY = y + 16;

    for (let i = 0; i < metaItems.length; i++) {
      // Draw icon
      if (metaIcons[i]) {
        ctx.drawImage(metaIcons[i], mx, metaY - 2, iconSize, iconSize);
      }
      // Draw text
      ctx.font = META_FONT;
      ctx.fillStyle = THEME.textSecondary;
      ctx.textAlign = "left";
      ctx.fillText(metaItems[i].text, mx + iconSize + iconGap, metaY + 14);
      mx += itemWidths[i];
      // Draw separator
      if (i < metaItems.length - 1) {
        ctx.fillStyle = THEME.textMuted;
        ctx.fillText(sep, mx, metaY + 14);
        mx += sepW;
      }
    }
    ctx.textAlign = TEXT_ALIGN;
    y += 48;
  }

  // ─── Divider ───
  y += 28;
  ctx.strokeStyle = THEME.divider;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(PADDING, y);
  ctx.lineTo(WIDTH - PADDING, y);
  ctx.stroke();

  // ─── Ingredients Section ───
  y += 36;
  const sectionIconSize = 24;
  const sectionIconX = isRTL
    ? WIDTH - PADDING - sectionIconSize / 2
    : PADDING + sectionIconSize / 2;
  const sectionTextX = isRTL
    ? WIDTH - PADDING - sectionIconSize - 12
    : PADDING + sectionIconSize + 12;

  drawListIcon(ctx, sectionIconX, y - 7, sectionIconSize, THEME.accent);
  ctx.font = SECTION_FONT;
  ctx.fillStyle = THEME.heading;
  ctx.textAlign = TEXT_ALIGN;
  ctx.fillText(
    t ? t("recipes", "ingredients") : "Ingredients",
    sectionTextX,
    y,
  );
  y += 50;

  ctx.font = BODY_FONT;
  ctx.fillStyle = THEME.textSecondary;
  if (ingredientsArray.length > 0) {
    ctx.textBaseline = "middle";
    for (const ing of ingredientsArray) {
      const bulletX = isRTL ? WIDTH - PADDING - 10 : PADDING + 10;
      const textX = isRTL ? WIDTH - PADDING - 28 : PADDING + 28;
      ctx.font = BODY_FONT;
      ctx.textAlign = TEXT_ALIGN;
      const lines = wrapText(ctx, ing, CONTENT_WIDTH - 40);
      // First line center Y
      const lineCenter = y;
      // Draw bullet at same center as first text line
      ctx.fillStyle = THEME.accent;
      ctx.beginPath();
      ctx.arc(bulletX, lineCenter, 4, 0, Math.PI * 2);
      ctx.fill();
      // Draw text lines
      ctx.fillStyle = THEME.textSecondary;
      for (let j = 0; j < lines.length; j++) {
        ctx.fillText(lines[j], textX, y + j * LINE_HEIGHT);
      }
      y += lines.length * LINE_HEIGHT + 8;
    }
    ctx.textBaseline = "alphabetic";
  } else {
    const textX = isRTL ? WIDTH - PADDING - 28 : PADDING + 28;
    ctx.fillStyle = THEME.textMuted;
    ctx.textAlign = TEXT_ALIGN;
    ctx.fillText(
      t ? t("recipes", "noIngredientsListed") : "No ingredients listed",
      textX,
      y,
    );
    y += LINE_HEIGHT;
  }

  // ─── Divider ───
  y += 20;
  ctx.strokeStyle = THEME.divider;
  ctx.beginPath();
  ctx.moveTo(PADDING, y);
  ctx.lineTo(WIDTH - PADDING, y);
  ctx.stroke();

  // ─── Instructions Section ───
  y += 36;
  drawStepsIcon(ctx, sectionIconX, y - 7, sectionIconSize, THEME.accent);
  ctx.font = SECTION_FONT;
  ctx.fillStyle = THEME.heading;
  ctx.textAlign = TEXT_ALIGN;
  ctx.fillText(
    t ? t("recipes", "instructions") : "Instructions",
    sectionTextX,
    y,
  );
  y += 50;

  ctx.font = BODY_FONT;
  if (instructionsArray.length > 0) {
    ctx.textBaseline = "middle";
    // Render only the first `keptInstructions` items; the rest (if any)
    // were dropped to keep the canvas under the native height limit.
    const instructionCount = Math.min(
      instructionsArray.length,
      keptInstructions,
    );
    for (let i = 0; i < instructionCount; i++) {
      // Step number circle — centered with first text line
      const circleX = isRTL ? WIDTH - PADDING - 14 : PADDING + 14;
      ctx.fillStyle = THEME.accent;
      ctx.beginPath();
      ctx.arc(circleX, y, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.font = `700 16px ${FONT_FAMILY}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`${i + 1}`, circleX, y);
      ctx.textAlign = TEXT_ALIGN;

      const stepTextX = isRTL ? WIDTH - PADDING - 40 : PADDING + 40;
      ctx.font = BODY_FONT;
      ctx.fillStyle = THEME.textSecondary;
      ctx.textBaseline = "middle";
      const lines = wrapText(ctx, instructionsArray[i], CONTENT_WIDTH - 50);
      for (let j = 0; j < lines.length; j++) {
        ctx.fillText(lines[j], stepTextX, y + j * LINE_HEIGHT);
      }
      y += lines.length * LINE_HEIGHT + 12;
    }
    ctx.textBaseline = "alphabetic";
  } else {
    const textX = isRTL ? WIDTH - PADDING - 28 : PADDING + 28;
    ctx.fillStyle = THEME.textMuted;
    ctx.textAlign = TEXT_ALIGN;
    ctx.fillText(
      t ? t("recipes", "noInstructionsListed") : "No instructions provided",
      textX,
      y,
    );
    y += LINE_HEIGHT;
  }

  // ─── Notes Section ───
  if (recipe.notes && !skipNotes) {
    y += 20;
    ctx.strokeStyle = THEME.divider;
    ctx.beginPath();
    ctx.moveTo(PADDING, y);
    ctx.lineTo(WIDTH - PADDING, y);
    ctx.stroke();

    y += 36;
    drawNoteIcon(ctx, sectionIconX, y - 7, sectionIconSize, THEME.tipColor);
    ctx.font = SECTION_FONT;
    ctx.fillStyle = THEME.tipColor;
    ctx.textAlign = TEXT_ALIGN;
    ctx.fillText(t ? t("recipes", "notes") : "Notes", sectionTextX, y);
    y += 50;

    // Notes background
    ctx.font = NOTES_FONT;
    const notesLines = wrapText(ctx, recipe.notes, CONTENT_WIDTH - 40);
    const notesPadTop = 24;
    const notesPadBottom = 20;
    const notesBgHeight =
      notesLines.length * LINE_HEIGHT + notesPadTop + notesPadBottom;
    drawRoundedRect(ctx, PADDING, y - 16, CONTENT_WIDTH, notesBgHeight, 12);
    ctx.fillStyle = THEME.tipBg;
    ctx.fill();
    ctx.strokeStyle = THEME.tipBorder;
    ctx.lineWidth = 1;
    ctx.stroke();

    const notesTextX = isRTL ? WIDTH - PADDING - 20 : PADDING + 20;
    ctx.fillStyle = THEME.tipColor;
    ctx.textAlign = TEXT_ALIGN;
    for (let j = 0; j < notesLines.length; j++) {
      ctx.fillText(
        notesLines[j],
        notesTextX,
        y + j * LINE_HEIGHT + notesPadTop,
      );
    }
    y += notesBgHeight;
  }

  // ─── Truncation notice ───
  // Shown when the recipe was too long to fit in a native-safe canvas and
  // we dropped notes / trailing instructions. Tells the user the image is
  // a shortened version and full recipe lives in the app.
  if (truncated) {
    y += 20;
    ctx.font = `500 18px ${FONT_FAMILY}`;
    ctx.fillStyle = THEME.footerText;
    ctx.textAlign = "center";
    const droppedSteps = instructionsArray.length - keptInstructions;
    const parts = [];
    if (droppedSteps > 0) {
      parts.push(
        t
          ? `${droppedSteps} ${t("recipes", "moreSteps") || "more steps"}`
          : `${droppedSteps} more steps`,
      );
    }
    if (skipNotes) {
      parts.push(t ? t("recipes", "notes") || "notes" : "notes");
    }
    const suffix = parts.length > 0 ? ` (${parts.join(", ")})` : "";
    ctx.fillText(
      (t
        ? t("recipes", "imageTruncatedSeeApp") ||
          "Shortened for image export — see full recipe in the app"
        : "Shortened for image export — see full recipe in the app") + suffix,
      WIDTH / 2,
      y,
    );
    y += 20;
  }

  // ─── Footer ───
  y += 30;
  ctx.strokeStyle = THEME.divider;
  ctx.beginPath();
  ctx.moveTo(PADDING, y);
  ctx.lineTo(WIDTH - PADDING, y);
  ctx.stroke();
  y += 30;
  ctx.font = `500 18px ${FONT_FAMILY}`;
  ctx.fillStyle = THEME.footerText;
  ctx.textAlign = "center";
  ctx.fillText("CookiPal", WIDTH / 2, y);

  // Add extra bottom spacing
  y += 40;

  // ─── Export ───
  const safeName = (recipe.name || "recipe")
    .replace(/[^a-zA-Z0-9\u0590-\u05FF ]/g, "")
    .trim() || "recipe";
  // On native we export JPEG — it's 5–10× smaller than PNG at the same visual
  // quality, which makes the base64 round-trip (canvas → Blob → FileReader →
  // Filesystem.writeFile) far more reliable on Android WebView. Web keeps PNG
  // because browsers handle large PNGs fine and users may expect lossless.
  const fileName = isNative ? `${safeName}.jpg` : `${safeName}.png`;

  if (isNative) {
    // On native we ONLY generate the image and write it to cache. The caller
    // (ExportImageButton) then asks the user what to do with it —
    // Save to Gallery or Share — so we never auto-hand-off to another app
    // (which causes Android to kill our backgrounded process).
    //
    // NOTE: canvas.toDataURL() can truncate / corrupt the base64 output on
    // large Android canvases. canvas.toBlob() + FileReader is more reliable.
    const blob = await new Promise((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error("toBlob returned null"))),
        "image/jpeg",
        0.92,
      );
    });

    const base64 = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = String(reader.result || "");
        const comma = result.indexOf(",");
        resolve(comma >= 0 ? result.slice(comma + 1) : result);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

    const { uri } = await Filesystem.writeFile({
      path: fileName,
      data: base64,
      directory: Directory.Cache,
    });

    return { uri, fileName, safeName };
  } else {
    // Web path — unchanged
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        resolve();
      }, "image/png");
    });
  }
}

/**
 * Save a file that was written by generateRecipeImage into the device Gallery
 * (Photos / Pictures) using the @capacitor-community/media plugin.
 * Native-only. On Android this creates/reuses a "CookiPal" album.
 */
export async function saveImageToGallery({ uri, safeName }) {
  try {
    await Media.createAlbum({ name: "CookiPal" });
  } catch (_createErr) {
    /* already exists or platform quirk; continue */
  }

  let albumIdentifier;
  try {
    const albumsPathRes =
      typeof Media.getAlbumsPath === "function"
        ? await Media.getAlbumsPath()
        : null;
    const albumsPath = albumsPathRes?.path || "";
    const { albums } = await Media.getAlbums();
    const ours = (albums || []).find(
      (a) =>
        a?.name === "CookiPal" &&
        (!albumsPath || a?.identifier?.startsWith(albumsPath)),
    );
    albumIdentifier = ours?.identifier;
  } catch (_getErr) {
    /* ignore — will fail below with clearer message */
  }

  if (!albumIdentifier) {
    throw new Error("Could not find or create CookiPal album");
  }

  await Media.savePhoto({
    path: uri,
    albumIdentifier,
    fileName: safeName,
  });
}

/**
 * Open the native share sheet for a file that was written by
 * generateRecipeImage. Native-only.
 * Returns { cancelled: true } if the user cancelled the share sheet.
 */
export async function shareImageFile({ uri, title, dialogTitle }) {
  try {
    await Share.share({
      title: title || "Recipe",
      dialogTitle: dialogTitle || "Export recipe",
      files: [uri],
    });
    return { shared: true };
  } catch (err) {
    if (err?.message && /cancel/i.test(err.message)) {
      return { cancelled: true };
    }
    throw err;
  }
}
