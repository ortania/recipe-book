import { JSDOM } from "jsdom";

const URL_TO_TEST =
  "https://www.mako.co.il/food-cooking_magazine/sweets/Article-bda19e3b25a6731006.htm";

async function test() {
  // Step 1: Fetch via Cloud Function
  const r = await fetch(
    "https://us-central1-recipe-book-82d57.cloudfunctions.net/fetchUrl?url=" +
      encodeURIComponent(URL_TO_TEST)
  );
  const data = await r.json();
  const html = data.contents;
  console.log("1. HTML fetched, length:", html.length);

  // Step 2: Check JSON-LD
  const dom = new JSDOM(html);
  const doc = dom.window.document;
  const scripts = doc.querySelectorAll('script[type="application/ld+json"]');
  let foundRecipe = false;
  for (const s of scripts) {
    try {
      let d = JSON.parse(s.textContent);
      if (Array.isArray(d)) d = d[0];
      const rd =
        d["@type"] === "Recipe"
          ? d
          : d["@graph"]
            ? d["@graph"].find((i) => i["@type"] === "Recipe")
            : null;
      if (rd) {
        console.log("2. Found Recipe in JSON-LD:", rd.name);
        foundRecipe = true;
      }
    } catch (e) {
      console.log("   JSON-LD parse error:", e.message.slice(0, 80));
    }
  }

  if (!foundRecipe) {
    console.log("2. No Recipe in JSON-LD, scripts found:", scripts.length);

    // Step 3: Clean body text
    const clone = doc.body.cloneNode(true);
    clone
      .querySelectorAll("script, style, noscript, svg, nav, footer, header")
      .forEach((el) => el.remove());
    const text = clone.textContent.replace(/\s+/g, " ").trim();
    console.log("3. Clean text length:", text.length);
    console.log("4. Has מרכיבים:", text.includes("מרכיבים"));
    console.log("5. Has הכנה:", text.includes("הכנה"));
    console.log("6. First 300 chars:", text.substring(0, 300));
  }
}

test().catch((e) => console.error("ERROR:", e));
