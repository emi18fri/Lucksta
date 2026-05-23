const https = require("https");
 
module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
 
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
 
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "API key not configured" });
 
  // Lägg till systemprompt med flerspråksstöd
  const bodyObj = req.body;
  bodyObj.system = (bodyObj.system || "") + "\n\nVIKTIGT: Svara alltid på samma språk som användaren skriver på. Om användaren skriver på engelska, svara på engelska. Om användaren skriver på arabiska, svara på arabiska. Osv.";
 
  const body = JSON.stringify(bodyObj);
 
  const options = {
    hostname: "api.anthropic.com",
    path: "/v1/messages",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "Content-Length": Buffer.byteLength(body),
    },
  };
 
  return new Promise((resolve) => {
    const proxyReq = https.request(options, (proxyRes) => {
      let data = "";
      proxyRes.on("data", chunk => data += chunk);
      proxyRes.on("end", () => {
        res.status(proxyRes.statusCode).json(JSON.parse(data));
        resolve();
      });
    });
    proxyReq.on("error", (err) => {
      res.status(500).json({ error: err.message });
      resolve();
    });
    proxyReq.write(body);
    proxyReq.end();
  });
};
