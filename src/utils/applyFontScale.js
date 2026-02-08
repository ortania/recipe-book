const BASE_FONTS = {
  "--huge-font": 2.2,
  "--very-large-font": 1.9,
  "--large-font": 1.7,
  "--basic-font": 1.5,
  "--small-font": 1.2,
  "--very-small-font": 1,
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
