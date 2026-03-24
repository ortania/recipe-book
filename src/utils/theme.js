const THEME_KEY = "theme";

export function getStoredTheme() {
  return localStorage.getItem(THEME_KEY) || "light";
}

export function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem(THEME_KEY, theme);
}

export function applySavedTheme() {
  const saved = getStoredTheme();
  applyTheme(saved);
}
