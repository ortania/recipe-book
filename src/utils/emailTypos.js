/**
 * Small client-only email typo-detector.
 *
 * Given an email address, return a suggested corrected address if the domain
 * matches a common misspelling of a well-known provider, or `null` if the
 * domain looks fine. Intentionally conservative: only matches exact known
 * typos. We don't do fuzzy matching to avoid false positives on legitimate
 * niche domains.
 *
 * Example:
 *   suggestEmailCorrection("tania@gmial.com") === "tania@gmail.com"
 *   suggestEmailCorrection("tania@gmail.com") === null
 *   suggestEmailCorrection("tania@acme.co")   === null   // unknown, leave alone
 */
const DOMAIN_TYPOS = {
  // Gmail
  "gmial.com": "gmail.com",
  "gnail.com": "gmail.com",
  "gmil.com": "gmail.com",
  "gmali.com": "gmail.com",
  "gmaill.com": "gmail.com",
  "gmai.com": "gmail.com",
  "gmail.co": "gmail.com",
  "gmail.cm": "gmail.com",
  "gmail.con": "gmail.com",

  // Yahoo
  "yaho.com": "yahoo.com",
  "yahoo.co": "yahoo.com",
  "yahooo.com": "yahoo.com",
  "yahoo.con": "yahoo.com",
  "yaoo.com": "yahoo.com",

  // Hotmail
  "hotnail.com": "hotmail.com",
  "hotmai.com": "hotmail.com",
  "hotmial.com": "hotmail.com",
  "hotmail.co": "hotmail.com",
  "hotmail.con": "hotmail.com",

  // Outlook
  "outlok.com": "outlook.com",
  "outloo.com": "outlook.com",
  "outllok.com": "outlook.com",
  "outlook.co": "outlook.com",

  // Apple
  "iclod.com": "icloud.com",
  "iclould.com": "icloud.com",
  "icould.com": "icloud.com",
  "icloud.co": "icloud.com",

  // Israeli providers (common in this app's audience)
  "walla.con": "walla.com",
  "walla.co": "walla.com",
  "wala.com": "walla.com",
  "bezeqnit.net": "bezeqint.net",
  "bezeqint.com": "bezeqint.net",
};

export const suggestEmailCorrection = (email) => {
  if (!email || typeof email !== "string") return null;
  const trimmed = email.trim();
  const at = trimmed.lastIndexOf("@");
  if (at < 1 || at === trimmed.length - 1) return null;

  const local = trimmed.slice(0, at);
  const domain = trimmed.slice(at + 1).toLowerCase();

  const fixedDomain = DOMAIN_TYPOS[domain];
  if (!fixedDomain || fixedDomain === domain) return null;

  return `${local}@${fixedDomain}`;
};
