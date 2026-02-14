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

export function search(persons, searchTerm, sortField, sortDirection) {
  return persons
    .filter((person) => {
      if (!searchTerm) return true;

      const term = searchTerm.trim();

      // Exact phrase search: wrapped in quotes
      if (term.startsWith('"') && term.endsWith('"') && term.length > 2) {
        const phrase = term.slice(1, -1).toLowerCase();
        const nameMatch = person.name?.toLowerCase().includes(phrase);
        const ingredientsMatch = person.ingredients?.some((ing) =>
          ing.toLowerCase().includes(phrase),
        );
        const instructionsMatch = person.instructions?.some((inst) =>
          inst.toLowerCase().includes(phrase),
        );
        return nameMatch || ingredientsMatch || instructionsMatch;
      }

      // Multi-word AND search: all words must match somewhere
      const words = term.toLowerCase().split(/\s+/).filter(Boolean);

      return words.every((word) => {
        const nameMatch = person.name?.toLowerCase().includes(word);
        const ingredientsMatch = person.ingredients?.some((ing) =>
          ing.toLowerCase().includes(word),
        );
        const instructionsMatch = person.instructions?.some((inst) =>
          inst.toLowerCase().includes(word),
        );
        return nameMatch || ingredientsMatch || instructionsMatch;
      });
    })
    .sort((a, b) => {
      let comparison = 0;
      if (sortField === "name") {
        comparison = (a.name || "").localeCompare(b.name || "");
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
        const aRating = parseFloat(a.rating) || 0;
        const bRating = parseFloat(b.rating) || 0;
        comparison = aRating - bRating;
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });
}
