export function hasTime(value) {
  if (!value) return false;
  const str = String(value).trim();
  return str !== "" && str !== "0";
}

export function formatTime(value, minutesLabel) {
  if (!value) return "";
  const str = String(value).trim();
  if (/^\d+$/.test(str)) {
    return `${str} ${minutesLabel}`;
  }
  return str;
}

export function formatDifficulty(difficulty) {
  if (!difficulty || difficulty === "Unknown") return "";

  const difficultyMap = {
    VeryEasy: "Very Easy",
    Easy: "Easy",
    Medium: "Medium",
    Hard: "Hard",
  };

  return difficultyMap[difficulty] || difficulty;
}

const heCollator = new Intl.Collator("he", { sensitivity: "base" });

export function search(recipes, searchTerm, sortField, sortDirection) {
  return recipes
    .filter((recipe) => {
      if (!searchTerm) return true;

      const term = searchTerm.trim();

      // Exact phrase search: wrapped in quotes
      if (term.startsWith('"') && term.endsWith('"') && term.length > 2) {
        const phrase = term.slice(1, -1).toLowerCase();
        const nameMatch = recipe.name?.toLowerCase().includes(phrase);
        const ingredientsMatch = recipe.ingredients?.some((ing) =>
          ing.toLowerCase().includes(phrase),
        );
        const instructionsMatch = recipe.instructions?.some((inst) =>
          inst.toLowerCase().includes(phrase),
        );
        return nameMatch || ingredientsMatch || instructionsMatch;
      }

      // Multi-word AND search: all words must match somewhere
      const words = term.toLowerCase().split(/\s+/).filter(Boolean);

      return words.every((word) => {
        const nameMatch = recipe.name?.toLowerCase().includes(word);
        const ingredientsMatch = recipe.ingredients?.some((ing) =>
          ing.toLowerCase().includes(word),
        );
        const instructionsMatch = recipe.instructions?.some((inst) =>
          inst.toLowerCase().includes(word),
        );
        return nameMatch || ingredientsMatch || instructionsMatch;
      });
    })
    .sort((a, b) => {
      let comparison = 0;
      if (sortField === "name") {
        comparison = heCollator.compare(a.name || "", b.name || "");
      } else if (sortField === "prepTime") {
        const aPrepTime = parseInt(a.prepTime) || 0;
        const bPrepTime = parseInt(b.prepTime) || 0;
        comparison = aPrepTime - bPrepTime;
      } else if (sortField === "difficulty") {
        const difficultyOrder = {
          Unknown: 0,
          VeryEasy: 1,
          Easy: 2,
          Medium: 3,
          Hard: 4,
        };
        const aDifficulty = difficultyOrder[a.difficulty] || 0;
        const bDifficulty = difficultyOrder[b.difficulty] || 0;
        comparison = aDifficulty - bDifficulty;
      } else if (sortField === "rating") {
        const aRating = parseFloat(a.avgRating || a.rating) || 0;
        const bRating = parseFloat(b.avgRating || b.rating) || 0;
        comparison = aRating - bRating;
      } else if (sortField === "newest") {
        const toMs = (v) => {
          if (!v) return 0;
          if (typeof v === "number") return v;
          if (v.seconds) return v.seconds * 1000;
          const ms = new Date(v).getTime();
          return isNaN(ms) ? 0 : ms;
        };
        const aTime = toMs(a.createdAt) || toMs(a.order) || 0;
        const bTime = toMs(b.createdAt) || toMs(b.order) || 0;
        comparison = aTime - bTime;
      } else if (sortField === "favorites") {
        const aFav = a.isFavorite ? 1 : 0;
        const bFav = b.isFavorite ? 1 : 0;
        comparison = aFav - bFav;
      } else if (sortField === "saved") {
        try {
          const ids = JSON.parse(
            localStorage.getItem("savedCommunityRecipes") || "[]",
          );
          const aSaved = ids.includes(a.id) ? 1 : 0;
          const bSaved = ids.includes(b.id) ? 1 : 0;
          comparison = aSaved - bSaved;
        } catch {
          comparison = 0;
        }
      } else if (sortField === "recentlyViewed") {
        try {
          const ids = JSON.parse(
            localStorage.getItem("recentlyViewedRecipes") || "[]",
          );
          const aPos = ids.indexOf(a.id);
          const bPos = ids.indexOf(b.id);
          comparison = (aPos === -1 ? 9999 : aPos) - (bPos === -1 ? 9999 : bPos);
        } catch {
          comparison = 0;
        }
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });
}
