/**
 * "Publish a recipe to the community" is a *freeze* action: the content
 * the user sees at that exact moment becomes the immutable community
 * version. Later edits to the sharer's private recipe never change the
 * community version — they only live on the sharer's local doc.
 *
 * To implement this without introducing a new collection (and therefore
 * without touching Firestore rules, indexes, or the Cloud Function
 * query shape), we store the frozen content inside the same recipe
 * document under a single field: `publishedSnapshot`.
 *
 * This module owns everything about that field.
 */

// The shape of the frozen content. Keep this in sync with
// Cloud Function `searchCommunityRecipes` if you change field names.
export const SNAPSHOT_FIELDS = [
  "name",
  "ingredients",
  "instructions",
  "prepTime",
  "cookTime",
  "servings",
  "difficulty",
  "nutrition",
  "image_src",
  "images",
  "sourceUrl",
  "importedFromUrl",
  "author",
  "notes",
];

/**
 * Build a snapshot object from the recipe's current content. The returned
 * object is safe to store directly in Firestore.
 *
 * @param {object} recipe          The user's current recipe content.
 * @param {object} opts            Optional metadata about the sharer.
 * @param {string} [opts.sharerUserId]
 * @param {string} [opts.sharerName]
 */
export const buildPublishedSnapshot = (recipe, opts = {}) => {
  const snapshot = {};
  for (const key of SNAPSHOT_FIELDS) {
    const v = recipe?.[key];
    if (v === undefined) continue;
    if (Array.isArray(v)) snapshot[key] = [...v];
    else if (v && typeof v === "object") snapshot[key] = { ...v };
    else snapshot[key] = v;
  }
  snapshot.publishedAt = new Date().toISOString();
  if (opts.sharerUserId) snapshot.sharerUserId = opts.sharerUserId;
  if (opts.sharerName) snapshot.sharerName = opts.sharerName;
  return snapshot;
};

/**
 * Take a recipe document and return the version that should be displayed
 * to a community viewer. When a snapshot exists, its fields override the
 * live fields. Legacy recipes without a snapshot return unchanged (their
 * live fields ARE what the community saw at share time historically).
 */
export const resolveCommunityView = (recipe) => {
  if (!recipe || !recipe.publishedSnapshot) return recipe;
  const snap = recipe.publishedSnapshot;
  const merged = { ...recipe };
  for (const key of SNAPSHOT_FIELDS) {
    if (snap[key] !== undefined) merged[key] = snap[key];
  }
  // The sharer's name/id attached to the snapshot reflect how the recipe
  // should be attributed in the community. These can be cleared on an
  // anonymize-unshare without touching the content itself.
  if (snap.sharerUserId !== undefined) merged.sharerUserId = snap.sharerUserId;
  if (snap.sharerName !== undefined) merged.sharerName = snap.sharerName;
  return merged;
};

/**
 * Compare the live recipe with its published snapshot and decide if the
 * owner has made changes that are not reflected in the community version.
 * Used to show a "You have unpublished edits" hint in the edit form.
 */
export const hasUnpublishedChanges = (recipe) => {
  if (!recipe?.publishedSnapshot) return false;
  const snap = recipe.publishedSnapshot;
  for (const key of SNAPSHOT_FIELDS) {
    const a = recipe[key];
    const b = snap[key];
    if (a === undefined && b === undefined) continue;
    if (JSON.stringify(a ?? null) !== JSON.stringify(b ?? null)) return true;
  }
  return false;
};
