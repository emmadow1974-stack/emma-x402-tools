import express from "express";

const app = express();
app.use(express.json());
const PORT = process.env.PORT || 3000;
const CH_API_KEY = process.env.COMPANIES_HOUSE_API_KEY;
const CH_BASE = "https://api.company-information.service.gov.uk";

async function chGet(path) {
  if (!CH_API_KEY) {
    const err = new Error("Companies House API key is not configured");
    err.status = 503;
    throw err;
  }
  const auth = Buffer.from(`${CH_API_KEY}:`).toString("base64");
  const response = await fetch(`${CH_BASE}${path}`, {
    headers: { Authorization: `Basic ${auth}` }
  });
  if (!response.ok) {
    const err = new Error(`Companies House returned HTTP ${response.status}`);
    err.status = response.status === 404 ? 404 : 502;
    throw err;
  }
  return response.json();
}

function riskSignals(company) {
  const signals = [];
  if (company.company_status && company.company_status !== "active") {
    signals.push({ code: "company_not_active", severity: "high", detail: company.company_status });
  }
  if (company.accounts?.next_accounts?.overdue) {
    signals.push({ code: "accounts_overdue", severity: "high" });
  }
  if (company.confirmation_statement?.overdue) {
    signals.push({ code: "confirmation_statement_overdue", severity: "medium" });
  }
  if (company.registered_office_is_in_dispute) {
    signals.push({ code: "registered_office_in_dispute", severity: "high" });
  }
  if (company.undeliverable_registered_office_address) {
    signals.push({ code: "registered_office_undeliverable", severity: "high" });
  }
  if (company.has_insolvency_history || company.links?.insolvency) {
    signals.push({ code: "insolvency_data_available", severity: "high" });
  }
  return signals;
}

app.get("/", (_req, res) => res.json({
  service: "Emma UK Business Intelligence",
  status: "online",
  version: "0.2.0",
  description: "Machine-readable UK company intelligence for AI agents",
  endpoints: ["/health", "/v1/company/:companyNumber"]
}));

app.get("/health", (_req, res) => res.json({ ok: true }));

app.get("/v1/company/:companyNumber", async (req, res) => {
  try {
    const companyNumber = String(req.params.companyNumber).trim().toUpperCase();
    const company = await chGet(`/company/${encodeURIComponent(companyNumber)}`);
    const signals = riskSignals(company);

    res.json({
      source: "Companies House",
      retrieved_at: new Date().toISOString(),
      company: {
        company_number: company.company_number,
        company_name: company.company_name,
        status: company.company_status,
        status_detail: company.company_status_detail ?? null,
        type: company.type,
        jurisdiction: company.jurisdiction,
        incorporated_on: company.date_of_creation ?? null,
        sic_codes: company.sic_codes ?? [],
        registered_office_address: company.registered_office_address ?? null,
        accounts: {
          next_due: company.accounts?.next_accounts?.due_on ?? null,
          overdue: company.accounts?.next_accounts?.overdue ?? false,
          last_period_end: company.accounts?.last_accounts?.period_end_on ?? null
        },
        confirmation_statement: {
          next_due: company.confirmation_statement?.next_due ?? null,
          overdue: company.confirmation_statement?.overdue ?? false
        }
      },
      signals,
      signal_count: signals.length,
      note: "Signals are factual flags from public registry data, not a credit rating or financial advice."
    });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
});

app.listen(PORT, () => console.log(`Emma UK Business Intelligence listening on port ${PORT}`));
