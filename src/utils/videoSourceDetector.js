// Lightweight, dependency-free detection of the platform behind a video link.
// We never fetch the URL — we only inspect the host/path so we can:
//   1) decide which on-screen hint to show in the wizard, and
//   2) tag the recipe (in-memory only) when we want to render an attribution
//      label next to the source link.
// The result is intentionally a small union of strings and is NOT persisted
// on the recipe document — sourceUrl + the importedFromVideo boolean are the
// only fields that actually live in Firestore.

const YOUTUBE_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "music.youtube.com",
  "youtu.be",
]);

const INSTAGRAM_HOSTS = new Set([
  "instagram.com",
  "www.instagram.com",
  "m.instagram.com",
]);

export const detectVideoSource = (rawUrl) => {
  if (!rawUrl || typeof rawUrl !== "string") return null;
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;

  let parsed;
  try {
    parsed = new URL(trimmed);
  } catch {
    return null;
  }
  if (!/^https?:$/.test(parsed.protocol)) return null;

  const host = parsed.hostname.toLowerCase();
  if (YOUTUBE_HOSTS.has(host)) return "youtube";
  if (INSTAGRAM_HOSTS.has(host)) return "instagram";
  return "video";
};

export const isVideoSource = (rawUrl) => {
  const kind = detectVideoSource(rawUrl);
  return kind === "youtube" || kind === "instagram" || kind === "video";
};
