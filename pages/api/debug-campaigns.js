// Temporary debug endpoint — lists ALL unique Google Ads campaign names from Windsor
const WINDSOR_KEY = process.env.WINDSOR_API_KEY || "";
const WINDSOR_BASE = "https://connectors.windsor.ai";

export default async function handler(req, res) {
  if (!WINDSOR_KEY) return res.status(200).json({ error: "no key" });

  const params = new URLSearchParams({
    api_key: WINDSOR_KEY,
    date_from: "2026-04-01",
    date_to: "2026-05-11",
    fields: "campaign,spend",
    _renderer: "json",
  });

  const r = await fetch(`${WINDSOR_BASE}/google_ads?${params}`);
  const j = await r.json();
  const rows = j.data || j || [];

  // Aggregate by campaign name
  const map = {};
  rows.forEach(r => {
    const name = r.campaign || "Unknown";
    if (!map[name]) map[name] = { name, totalSpend: 0, rows: 0 };
    map[name].totalSpend += parseFloat(r.spend || 0);
    map[name].rows++;
  });

  const campaigns = Object.values(map).sort((a, b) => b.totalSpend - a.totalSpend);
  return res.status(200).json({ totalUniqueNames: campaigns.length, campaigns });
}
