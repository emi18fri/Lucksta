const https = require("https");
const http = require("http");

// Fetches a URL and returns the HTML
function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith("https") ? https : http;
    lib.get(url, { headers: { "User-Agent": "Mozilla/5.0" } }, (res) => {
      let data = "";
      res.on("data", chunk => data += chunk);
      res.on("end", () => resolve(data));
    }).on("error", reject);
  });
}

// Strip HTML tags and return clean text
function stripHtml(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<nav[\s\S]*?<\/nav>/gi, "")
    .replace(/<footer[\s\S]*?<\/footer>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&gt;/g, ">")
    .replace(/&lt;/g, "<")
    .replace(/\s{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// Pages to fetch from Lucksta IF
const PAGES = [
  "https://www.luckstaif.se/start/?ID=121176",
  "https://www.luckstaif.se/?SID=19919",  // Ledare
  "https://www.luckstaif.se/?SID=20391",  // A-lag
  "https://www.luckstaif.se/sida/?ID=121183", // Kontakt
];

let cachedContent = null;
let cacheTime = null;
const CACHE_DURATION = 3 * 60 * 60 * 1000; // 3 timmar

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET");

  // Returnera cachad version om den är färsk
  if (cachedContent && cacheTime && (Date.now() - cacheTime < CACHE_DURATION)) {
    return res.json({ content: cachedContent, cached: true });
  }

  try {
    let allText = "";
    for (const url of PAGES) {
      try {
        const html = await fetchUrl(url);
        const text = stripHtml(html);
        allText += text.slice(0, 3000) + "\n\n";
      } catch (e) {
        console.error("Failed to fetch", url, e.message);
      }
    }

    if (!allText) throw new Error("Kunde inte hämta någon sida");

    cachedContent = allText.slice(0, 12000);
    cacheTime = Date.now();

    res.json({ content: cachedContent, cached: false });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
