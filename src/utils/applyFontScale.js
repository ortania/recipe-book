const BASE_FONTS = {
  "--huge-font": 2.2,
  "--very-large-font": 2.0,
  "--large-font": 1.8,
  "--basic-font": 1.6,
  "--input-font": 1.6, // ← add this
  "--small-font": 1.4,
  "--very-small-font": 1.2,
};

export function applyFontScale(scale) {
  const numScale = typeof scale === "number" ? scale : parseFloat(scale) || 1;
  const root = document.documentElement;
  Object.entries(BASE_FONTS).forEach(([varName, baseSize]) => {
    root.style.setProperty(varName, `${(baseSize * numScale).toFixed(2)}rem`);
  });
}

export function applySavedFontSize() {
  const saved = localStorage.getItem("fontScale");
  const scale = saved ? parseFloat(saved) : 1;
  applyFontScale(scale);
}
