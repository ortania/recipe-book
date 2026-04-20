/**
 * Generates resources/icon.png (1024×1024) and resources/splash.png (2732×2732)
 * for @capacitor/assets to convert into all Android / iOS sizes.
 *
 * Design: friendly cooking pot with steam + smile on a green gradient.
 *   - Accent green  : #1a9c5a  (app primary)
 *   - Dark green    : #0d6638
 *   - Warm brown    : #635555  (app heading)
 *   - Cream         : #f7f5f4  (app background)
 */

const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

const OUT = path.join(__dirname, "..", "resources");
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

// ─────────────────────────────────────────────────────────────────────────────
// Shared pot drawing (reused in both icon and splash)
// Coordinate space: 1024 × 1024
// ─────────────────────────────────────────────────────────────────────────────
function potPaths(opts = {}) {
  const { face = true } = opts;
  return `
  <!-- Steam left -->
  <path d="M 390 430 Q 355 385 390 340 Q 425 295 390 248"
        stroke="white" stroke-width="28" stroke-linecap="round" fill="none" opacity="0.75"/>
  <!-- Steam center -->
  <path d="M 512 408 Q 477 363 512 318 Q 547 273 512 228"
        stroke="white" stroke-width="28" stroke-linecap="round" fill="none" opacity="0.75"/>
  <!-- Steam right -->
  <path d="M 634 430 Q 599 385 634 340 Q 669 295 634 248"
        stroke="white" stroke-width="28" stroke-linecap="round" fill="none" opacity="0.75"/>

  <!-- Pot rim (wide rounded bar) -->
  <rect x="226" y="454" width="572" height="72" rx="36" fill="white"/>

  <!-- Pot body -->
  <rect x="254" y="502" width="516" height="340" rx="80" fill="white"/>

  <!-- Left handle -->
  <rect x="148" y="504" width="124" height="62" rx="31" fill="white"/>
  <rect x="244" y="504" width="32" height="62" fill="white"/>

  <!-- Right handle -->
  <rect x="752" y="504" width="124" height="62" rx="31" fill="white"/>
  <rect x="748" y="504" width="32" height="62" fill="white"/>

  ${face ? `
  <!-- Eyes -->
  <circle cx="420" cy="618" r="32" fill="#0d6638"/>
  <circle cx="604" cy="618" r="32" fill="#0d6638"/>
  <!-- Smile -->
  <path d="M 388 692 Q 512 782 636 692"
        stroke="#0d6638" stroke-width="30" fill="none" stroke-linecap="round"/>
  <!-- Eye shine (white dot) -->
  <circle cx="432" cy="608" r="10" fill="white"/>
  <circle cx="616" cy="608" r="10" fill="white"/>
  ` : ""}
  `;
}

// ─────────────────────────────────────────────────────────────────────────────
// Icon  1024 × 1024
// ─────────────────────────────────────────────────────────────────────────────
const iconSvg = `
<svg xmlns="http://www.w3.org/2000/svg"
     width="1024" height="1024" viewBox="0 0 1024 1024">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1024" y2="1024"
                    gradientUnits="userSpaceOnUse">
      <stop offset="0%"   stop-color="#2ecc85"/>
      <stop offset="100%" stop-color="#0a5e33"/>
    </linearGradient>
  </defs>

  <!-- Full-square background — @capacitor/assets clips per platform -->
  <rect width="1024" height="1024" fill="url(#bg)"/>

  ${potPaths({ face: true })}
</svg>
`;

// ─────────────────────────────────────────────────────────────────────────────
// Splash  2732 × 2732
// ─────────────────────────────────────────────────────────────────────────────
// Icon rendered at 660 px, centered horizontally, placed in upper half.
const S = 2732;
const ICON_PX = 660;
const ICON_SCALE = ICON_PX / 1024;
const ICON_X = (S - ICON_PX) / 2;   // 1036
const ICON_Y = 740;
const TEXT_Y  = ICON_Y + ICON_PX + 200;  // more space between logo and text

const splashSvg = `
<svg xmlns="http://www.w3.org/2000/svg"
     width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">

  <!-- Cream background matching the app -->
  <rect width="${S}" height="${S}" fill="#f7f5f4"/>

  <!-- Icon group: scale the 1024-coord pot to ICON_PX size -->
  <g transform="translate(${ICON_X}, ${ICON_Y}) scale(${ICON_SCALE.toFixed(6)})">
    <defs>
      <linearGradient id="bg2" x1="0" y1="0" x2="1024" y2="1024"
                      gradientUnits="userSpaceOnUse">
        <stop offset="0%"   stop-color="#2ecc85"/>
        <stop offset="100%" stop-color="#0a5e33"/>
      </linearGradient>
      <clipPath id="rnd">
        <rect width="1024" height="1024" rx="220" ry="220"/>
      </clipPath>
    </defs>
    <!-- Rounded-square green background for the icon tile -->
    <rect width="1024" height="1024" rx="220" ry="220" fill="url(#bg2)"/>
    <g clip-path="url(#rnd)">
      ${potPaths({ face: true })}
    </g>
  </g>

  <!-- App name -->
  <text x="${S / 2}" y="${TEXT_Y}"
        font-family="Arial, Helvetica, sans-serif"
        font-size="200" font-weight="700"
        fill="#635555" text-anchor="middle">CookiPal</text>
</svg>
`;

// ─────────────────────────────────────────────────────────────────────────────
// Generate PNGs
// ─────────────────────────────────────────────────────────────────────────────
async function generate() {
  console.log("Generating resources/icon.png …");
  await sharp(Buffer.from(iconSvg))
    .resize(1024, 1024)
    .png()
    .toFile(path.join(OUT, "icon.png"));

  console.log("Generating resources/splash.png …");
  await sharp(Buffer.from(splashSvg))
    .resize(S, S)
    .png()
    .toFile(path.join(OUT, "splash.png"));

  console.log("Done ✓");
  console.log("  resources/icon.png   (1024×1024)");
  console.log("  resources/splash.png (2732×2732)");
}

generate().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
