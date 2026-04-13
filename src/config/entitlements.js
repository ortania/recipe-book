export const FEATURES = {
  GENERAL_CHAT: "canUseGeneralChat",
  RECIPE_CHAT: "canUseRecipeChat",
  APPLY_AI_SUGGESTION: "canApplyAiSuggestion",
  COOKING_VOICE: "canUseCookingVoice",
  IMPORT_PHOTO: "canImportFromPhoto",
  IMPORT_TEXT: "canImportFromText",
  IMPORT_VOICE: "canImportFromVoice",
  AI_URL_FALLBACK: "canUseAiUrlFallback",
  OCR: "canUseOcr",
  NUTRITION_CALC: "canCalculateNutrition",
  NUTRITION_PHOTO: "canAnalyzeNutritionPhoto",
  DALLE_IMAGE: "canGenerateDalleImage",
  CREATE_VARIATION: "canCreateVariation",
};

export const GATE_TYPES = {
  HARD: "hard",
  SOFT: "soft",
  USAGE: "usage",
};

export const FEATURE_CONFIG = {
  [FEATURES.GENERAL_CHAT]: {
    gate: GATE_TYPES.USAGE,
    counter: "generalChatMessages",
    freeLimit: 5,
    reset: "monthly",
  },
  [FEATURES.RECIPE_CHAT]: {
    gate: GATE_TYPES.USAGE,
    counter: "recipeChatMessages",
    freeLimit: 3,
    reset: "monthly",
  },
  [FEATURES.APPLY_AI_SUGGESTION]: { gate: GATE_TYPES.HARD },
  [FEATURES.COOKING_VOICE]: { gate: GATE_TYPES.HARD },
  [FEATURES.IMPORT_PHOTO]: {
    gate: GATE_TYPES.SOFT,
    counter: "photoImports",
    freeLimit: 2,
    reset: "never",
  },
  [FEATURES.IMPORT_TEXT]: {
    gate: GATE_TYPES.SOFT,
    counter: "textImports",
    freeLimit: 3,
    reset: "never",
  },
  [FEATURES.IMPORT_VOICE]: { gate: GATE_TYPES.HARD },
  [FEATURES.AI_URL_FALLBACK]: { gate: GATE_TYPES.HARD },
  [FEATURES.OCR]: { gate: GATE_TYPES.HARD },
  [FEATURES.NUTRITION_CALC]: { gate: GATE_TYPES.HARD },
  [FEATURES.NUTRITION_PHOTO]: { gate: GATE_TYPES.HARD },
  [FEATURES.DALLE_IMAGE]: { gate: GATE_TYPES.HARD },
  [FEATURES.CREATE_VARIATION]: {
    gate: GATE_TYPES.USAGE,
    counter: "variationsCreated",
    freeLimit: 2,
    reset: "monthly",
  },
};

export const DEFAULT_USAGE = {
  generalChatMessages: 0,
  recipeChatMessages: 0,
  nutritionCalcs: 0,
  variationsCreated: 0,
  photoImports: 0,
  textImports: 0,
  lastMonthlyReset: null,
};

export const FULL_ACCESS_ROLES = ["tester", "admin"];
