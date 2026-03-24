export const SPEECH_LANG_MAP = {
  he: "he-IL",
  en: "en-US",
  ru: "ru-RU",
  de: "de-DE",
  mixed: "he-IL",
};

const HE_ONES = ["", "אחת", "שתיים", "שלוש", "ארבע", "חמש", "שש", "שבע", "שמונה", "תשע"];
const HE_TENS = ["", "עשר", "עשרים", "שלושים", "ארבעים", "חמישים", "שישים", "שבעים", "שמונים", "תשעים"];
const HE_TEENS = [
  "עשר", "אחת עשרה", "שתים עשרה", "שלוש עשרה", "ארבע עשרה",
  "חמש עשרה", "שש עשרה", "שבע עשרה", "שמונה עשרה", "תשע עשרה",
];

export function numberToHebrew(n) {
  if (n === 0) return "אפס";
  if (n < 0) return "מינוס " + numberToHebrew(-n);
  const num = Math.round(n);
  if (num >= 1000) return String(num);
  let result = "";
  if (num >= 100) {
    const h = Math.floor(num / 100);
    result += h === 1 ? "מאה" : h === 2 ? "מאתיים" : HE_ONES[h] + " מאות";
    const rem = num % 100;
    if (rem > 0) result += " " + numberToHebrew(rem);
    return result;
  }
  if (num >= 20) {
    result = HE_TENS[Math.floor(num / 10)];
    const rem = num % 10;
    if (rem > 0) result += " ו" + HE_ONES[rem];
    return result;
  }
  if (num >= 10) return HE_TEENS[num - 10];
  return HE_ONES[num];
}

export function digitsToHebrew(text) {
  return text.replace(/\d+(\.\d+)?/g, (match) => {
    const num = parseFloat(match);
    if (match.includes(".")) {
      const [whole, frac] = match.split(".");
      return numberToHebrew(parseInt(whole)) + " נקודה " + numberToHebrew(parseInt(frac));
    }
    return numberToHebrew(num);
  });
}
