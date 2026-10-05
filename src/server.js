import express from "express";

const app = express();
app.use(express.json());
const PORT = process.env.PORT || 3000;

function normalizePostcode(value = "") {
  const compact = String(value).trim().toUpperCase().replace(/\s+/g, "");
  if (compact.length < 5) return compact;
  return compact.slice(0, -3) + " " + compact.slice(-3);
}

function validateUkPostcode(value = "") {
  const formatted = normalizePostcode(value);
  const regex = /^(GIR 0AA|(?:[A-Z]{1,2}\d[A-Z\d]?|[A-Z]{1,2}\d{1,2}) \d[A-Z]{2})$/i;
  return { input: value, formatted, valid_format: regex.test(formatted) };
}

app.get("/", (_req, res) => res.json({
  service: "Emma x402 Tools",
  status: "online",
  version: "0.1.0",
  endpoints: ["/health", "/v1/uk-postcode?postcode=TQ5%209AA"]
}));

app.get("/health", (_req, res) => res.json({ ok: true }));

app.get("/v1/uk-postcode", (req, res) => {
  const postcode = req.query.postcode;
  if (!postcode) return res.status(400).json({ error: "postcode query parameter is required" });
  return res.json(validateUkPostcode(postcode));
});

app.listen(PORT, () => console.log(`Emma x402 Tools listening on port ${PORT}`));
