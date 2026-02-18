const LANG_MAP = {
  he: "iw",
  en: "en",
  ru: "ru",
  de: "de",
  mixed: null,
};

const STORAGE_KEY = "translationCache";
const CACHE_MAX = 500;

const cache = new Map();

try {
  const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  stored.forEach(([k, v]) => cache.set(k, v));
} catch {
  /* ignore corrupt storage */
}

function persistCache() {
  try {
    const entries = [...cache.entries()].slice(-CACHE_MAX);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    /* quota exceeded — ignore */
  }
}

let persistTimer = null;
function schedulePersist() {
  if (persistTimer) return;
  persistTimer = setTimeout(() => {
    persistTimer = null;
    persistCache();
  }, 2000);
}

function getCacheKey(text, targetLang) {
  return `${targetLang}:${text}`;
}

function parseGoogleResponse(data) {
  if (data && data[0]) {
    return data[0].map((part) => part[0]).join("");
  }
  return null;
}

async function translateText(text, targetLang, sourceLang = "auto") {
  if (!text || !targetLang || targetLang === "mixed") {
    return text;
  }

  const trimmed = text.trim();
  if (!trimmed) return text;

  const cacheKey = getCacheKey(trimmed, targetLang);
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey);
  }

  const tl = LANG_MAP[targetLang];
  if (!tl) return text;
  const sl = sourceLang === "auto" ? "auto" : LANG_MAP[sourceLang] || "auto";
  const q = encodeURIComponent(trimmed);
  const urls = [`/api/translate?client=gtx&sl=${sl}&tl=${tl}&dt=t&q=${q}`];

  for (const url of urls) {
    try {
      const response = await fetch(url);
      if (!response.ok) continue;
      const data = await response.json();

      const result = data.translation || parseGoogleResponse(data);
      if (result) {
        cache.set(cacheKey, result);
        schedulePersist();
        return result;
      }
    } catch {
      // Try next URL
    }
  }

  return text;
}

export async function translateRecipeContent(recipe, targetLang) {
  if (!recipe || !targetLang || targetLang === "mixed") {
    return recipe;
  }

  const translateArray = async (arr) => {
    if (!Array.isArray(arr) || arr.length === 0) return arr;
    return Promise.all(arr.map((item) => translateText(item, targetLang)));
  };

  const [name, ingredients, instructions, notes] = await Promise.all([
    translateText(recipe.name, targetLang),
    translateArray(recipe.ingredients),
    translateArray(recipe.instructions),
    recipe.notes
      ? translateText(recipe.notes, targetLang)
      : Promise.resolve(""),
  ]);

  return {
    ...recipe,
    name,
    ingredients,
    instructions,
    notes,
  };
}

export { translateText };
