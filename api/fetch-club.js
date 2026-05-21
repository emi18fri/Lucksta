const https = require("https");
 
// ================================================================
// LÄGG TILL MANUELL INFO HÄR (det chatboten inte hittar själv)
// Uppdatera när träningstider eller ledare ändras.
// ================================================================
 
const MANUELL_INFO = `
=== TRÄNINGSTIDER ===
 
v.18
01	fre	
02	lör	
03	sön	
 
v.19
04	mån	
19:00
Kubikenborgs IF hemma, NP3 Arena (Div 2 Norrland Vår Södra 2026) (..)
05	tis	
06	ons	
18:45 - 20:30
Träning, Idrottsparken/NP3
07	tor	
20:15 - 21:30
Träning, Idrottsparken/NP3
08	fre	
09	lör	
10	sön	
14:00
Fränsta IK borta, Ånge IP (Div 2 Norrland Vår Södra 2026) (..)
 
v.20
11	mån	
18:00 - 19:30
Träning, Idrottsparken/NP3
12	tis	
13	ons	
19:15 - 21:00
Träning, Idrottsparken/NP3
19:30
Friska Viljor FC hemma, NP3 Arena (Div 2 Norrland Vår Södra 2026) (..)
14	tor	
15	fre	
16	lör	
17	sön	
17:00
Gottne IF borta, Skyttis IP (Div 2 Norrland Vår Södra 2026) (..)
 
v.21
18	mån	
19	tis	
20	ons	
19:15 - 21:00
Träning, Idrottsparken/NP3
21	tor	
20:15 - 21:30
Träning, Idrottsparken/NP3
22	fre	
23	lör	
13:00
IFK Östersund borta, Jämtkraft Arena (Div 2 Norrland Vår Södra 2026) (..)
24	sön	
 
v.22
25	mån	
18:00 - 19:30
Träning, Idrottsparken/NP3
26	tis	
27	ons	
19:15 - 21:00
Träning, Idrottsparken/NP3
28	tor	
20:15 - 21:30
Träning, Idrottsparken/NP3
29	fre	
30	lör	
14:00
Friska Viljor FC borta, Skyttis IP (Div 2 Norrland Vår Södra 2026) (..)
31	sön	
 
=== LEDARE OCH KONTAKT ===
(Klistra in ledarnas namn, telefon och mail här, t.ex:)
A-lagets tränare: Förnamn Efternamn, tel: 070-xxx xx xx
(osv...)
 
=== ÖVRIGT ===
(Annan info som inte finns på hemsidan)
`;
 
// ================================================================
// NEDAN BEHÖVER DU INTE ÄNDRA NÅGOT
// ================================================================
 
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
  { name: "Startsida", url: "https://www.luckstaif.se/start/?ID=121176" },
  { name: "Kontakt", url: "https://www.luckstaif.se/sida/?ID=121183" },
  { name: "Kalender", url: "https://www.luckstaif.se/kalender/?ID=121178" },
  { name: "Ledare", url: "https://www.luckstaif.se/?SID=19919" },
  { name: "Styrelse", url: "https://www.luckstaif.se/?SID=19920" },
  { name: "A-lag", url: "https://www.luckstaif.se/start/?ID=191580" },
  { name: "A-lag Kontakt", url: "https://www.luckstaif.se/sida/?ID=191586" },
  { name: "Ungdomsektion fotboll", url: "https://www.luckstaif.se/?SID=57803" },
  { name: "F10/11", url: "https://www.luckstaif.se/?SID=12501" },
  { name: "F16/17", url: "https://www.luckstaif.se/?SID=57851" },
  { name: "P11/12", url: "https://www.luckstaif.se/?SID=25176" },
  { name: "P13/14", url: "https://www.luckstaif.se/?SID=56248" },
  { name: "P15/16", url: "https://www.luckstaif.se/?SID=56762" },
  { name: "P17/18", url: "https://www.luckstaif.se/?SID=64965" },
  { name: "Skidlek", url: "https://www.luckstaif.se/?SID=21572" },
  { name: "Uthyrning", url: "https://www.luckstaif.se/?SID=20003" },
  { name: "Deltaterrängen", url: "https://www.luckstaif.se/?SID=20392" },
];
 
let cachedContent = null;
let cacheTime = null;
const CACHE_DURATION = 3 * 60 * 60 * 1000;
 
module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET");
 
  if (cachedContent && cacheTime && (Date.now() - cacheTime < CACHE_DURATION)) {
    return res.json({ content: cachedContent, cached: true });
  }
 
  try {
    let autoText = "";
    for (const page of PAGES) {
      try {
        const html = await fetchUrl(page.url);
        const text = stripHtml(html);
        autoText += `\n\n=== ${page.name} ===\n` + text.slice(0, 1200);
      } catch (e) {
        console.error("Failed:", page.url, e.message);
      }
    }
 
    // Kombinera manuell info + automatiskt hämtad info
    cachedContent = "=== MANUELLT INLAGD INFO ===\n" + MANUELL_INFO + "\n\n=== AUTOMATISKT HÄMTAD FRÅN HEMSIDAN ===\n" + autoText;
    cachedContent = cachedContent.slice(0, 20000);
    cacheTime = Date.now();
 
    res.json({ content: cachedContent, cached: false });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
