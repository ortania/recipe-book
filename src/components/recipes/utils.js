export function formatDifficulty(difficulty) {
  if (!difficulty) return "";

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

      const searchLower = searchTerm.toLowerCase();
      const nameMatch = person.name?.toLowerCase().includes(searchLower);
      const ingredientsMatch = person.ingredients?.some((ing) =>
        ing.toLowerCase().includes(searchLower),
      );

      return nameMatch || ingredientsMatch;
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
        const difficultyOrder = { VeryEasy: 0, Easy: 1, Medium: 2, Hard: 3 };
        const aDifficulty = difficultyOrder[a.difficulty] || 0;
        const bDifficulty = difficultyOrder[b.difficulty] || 0;
        comparison = aDifficulty - bDifficulty;
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });
}
