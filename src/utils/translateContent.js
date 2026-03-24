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

function cleanTranslatedText(text) {
  if (typeof text !== "string") return text;
  let s = text;
  // Fix double parentheses added by Google Translate
  while (s.includes("((") || s.includes("))")) {
    s = s.replace(/\(\(/g, "(").replace(/\)\)/g, ")");
  }
  return s;
}

function isEmptyItem(text) {
  if (typeof text !== "string") return false;
  const stripped = text.replace(/[\s().\d:;,،-]/g, "");
  return stripped.length === 0;
}

function stripControlChars(s) {
  return s.replace(/[\u200E\u200F\u200B\u200C\u200D\u202A-\u202E\u2066-\u2069\uFEFF]/g, "");
}

function isParenthetical(text) {
  const cleaned = stripControlChars(text.trim());
  return cleaned.startsWith("(") && /\)\s*[.!?]*\s*$/.test(cleaned);
}

function mergeParentheticalItems(arr) {
  if (!Array.isArray(arr) || arr.length < 2) return arr;
  const result = [];
  for (const item of arr) {
    if (typeof item !== "string") { result.push(item); continue; }
    const trimmed = item.trim();
    if (
      isParenthetical(trimmed) &&
      result.length > 0 &&
      typeof result[result.length - 1] === "string"
    ) {
      result[result.length - 1] = result[result.length - 1].trimEnd() + " " + trimmed;
    } else {
      result.push(trimmed);
    }
  }
  return result;
}

export async function translateRecipeContent(recipe, targetLang) {
  if (!recipe || !targetLang || targetLang === "mixed") {
    return recipe;
  }

  const translateArray = async (arr) => {
    if (!Array.isArray(arr) || arr.length === 0) return arr;
    const translated = await Promise.all(arr.map(async (item) => {
      if (typeof item === "string" && item.startsWith("::")) {
        const name = item.slice(2).trim();
        if (!name) return item;
        const result = await translateText(name, targetLang);
        return "::" + cleanTranslatedText(result);
      }
      const result = await translateText(item, targetLang);
      return cleanTranslatedText(result);
    }));
    return translated.filter((item) => !isEmptyItem(item));
  };

  const translateAndMergeInstructions = async (arr) => {
    const translated = await translateArray(arr);
    return mergeParentheticalItems(translated);
  };

  const [name, ingredients, instructions, notes] = await Promise.all([
    translateText(recipe.name, targetLang).then(cleanTranslatedText),
    translateArray(recipe.ingredients),
    translateAndMergeInstructions(recipe.instructions),
    recipe.notes
      ? translateText(recipe.notes, targetLang).then(cleanTranslatedText)
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
