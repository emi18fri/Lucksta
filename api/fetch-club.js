const https = require("https");
 
function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { "User-Agent": "Mozilla/5.0" } }, (res) => {
      let data = "";
      res.on("data", chunk => data += chunk);
      res.on("end", () => resolve(data));
    }).on("error", reject);
  });
}
 
function stripHtml(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<nav[\s\S]*?<\/nav>/gi, "")
    .replace(/<footer[\s\S]*?<\/footer>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&aring;/g, "å")
    .replace(/&auml;/g, "ä")
    .replace(/&ouml;/g, "ö")
    .replace(/&Aring;/g, "Å")
    .replace(/&Auml;/g, "Ä")
    .replace(/&Ouml;/g, "Ö")
    .replace(/\s{2,}/g, " ")
    .trim();
}
 
const PAGES = [
  // Huvudsidor
  { name: "Startsida", url: "https://www.luckstaif.se/start/?ID=121176" },
  { name: "Kontakt", url: "https://www.luckstaif.se/sida/?ID=121183" },
  { name: "Kalender", url: "https://www.luckstaif.se/kalender/?ID=121178" },
  { name: "Ledare", url: "https://www.luckstaif.se/?SID=19919" },
  { name: "Styrelse", url: "https://www.luckstaif.se/?SID=19920" },
 
  // A-lag
  { name: "A-lag", url: "https://www.luckstaif.se/start/?ID=191580" },
  { name: "A-lag Kalender", url: "https://www.luckstaif.se/kalender/?ID=191582" },
  { name: "A-lag Matcher", url: "https://www.luckstaif.se/match/?ID=191587" },
  { name: "A-lag Kontakt", url: "https://www.luckstaif.se/sida/?ID=191586" },
  { name: "A-lag Truppen", url: "https://www.luckstaif.se/grupp/?ID=191583" },
 
  // Ungdomslag fotboll
  { name: "Ungdomsektion fotboll", url: "https://www.luckstaif.se/?SID=57803" },
  { name: "F10/11", url: "https://www.luckstaif.se/?SID=12501" },
  { name: "F16/17", url: "https://www.luckstaif.se/?SID=57851" },
  { name: "Fotbollslek", url: "https://www.luckstaif.se/?SID=20000" },
  { name: "P11/12", url: "https://www.luckstaif.se/?SID=25176" },
  { name: "P13/14", url: "https://www.luckstaif.se/?SID=56248" },
  { name: "P15/16", url: "https://www.luckstaif.se/?SID=56762" },
  { name: "P17/18", url: "https://www.luckstaif.se/?SID=64965" },
 
  // Skidor
  { name: "Skidlek", url: "https://www.luckstaif.se/?SID=21572" },
  { name: "Blå grupp skidor", url: "https://www.luckstaif.se/?SID=26613" },
  { name: "Röd grupp skidor", url: "https://www.luckstaif.se/?SID=21580" },
  { name: "Svart grupp skidor", url: "https://www.luckstaif.se/?SID=20390" },
  { name: "Junior 17-20 skidor", url: "https://www.luckstaif.se/?SID=21578" },
  { name: "Gemensamt skidgrupper", url: "https://www.luckstaif.se/?SID=21581" },
 
  // Övrigt
  { name: "Uthyrning", url: "https://www.luckstaif.se/?SID=20003" },
  { name: "Deltaterrängen", url: "https://www.luckstaif.se/?SID=20392" },
  { name: "Medlemslotteriet", url: "https://www.luckstaif.se/?SID=20394" },
];
 
let cachedContent = null;
let cacheTime = null;
const CACHE_DURATION = 3 * 60 * 60 * 1000; // 3 timmar
 
module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET");
 
  if (cachedContent && cacheTime && (Date.now() - cacheTime < CACHE_DURATION)) {
    return res.json({ content: cachedContent, cached: true });
  }
 
  try {
    let allText = "";
    for (const page of PAGES) {
      try {
        const html = await fetchUrl(page.url);
        const text = stripHtml(html);
        allText += `\n\n=== ${page.name} ===\n` + text.slice(0, 1500);
      } catch (e) {
        console.error("Failed:", page.url, e.message);
      }
    }
 
    if (!allText) throw new Error("Kunde inte hämta någon sida");
 
    cachedContent = allText.slice(0, 20000);
    cacheTime = Date.now();
 
    res.json({ content: cachedContent, cached: false });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
