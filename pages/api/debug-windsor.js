// pages/api/debug-windsor.js
// Diagnostic endpoint — hits Windsor for both Facebook and Google Ads
// and reports status/body so we can see what's failing.

const WINDSOR_KEY = process.env.WINDSOR_API_KEY || "";
const WINDSOR_BASE = "https://connectors.windsor.ai";

async function probe(connector, fields) {
  if (!WINDSOR_KEY) return { ok: false, reason: "no_key" };
  const today = new Date();
  const from = new Date(today); from.setDate(from.getDate() - 7);
  const iso = d => d.toISOString().slice(0, 10);
  const params = new URLSearchParams({
    api_key: WINDSOR_KEY,
    date_from: iso(from),
    date_to: iso(today),
    fields,
    _renderer: "json",
  });
  const url = `${WINDSOR_BASE}/${connector}?${params}`;
  try {
    const r = await fetch(url);
    const text = await r.text();
    let rows = 0;
    try {
      const j = JSON.parse(text);
      rows = Array.isArray(j?.data) ? j.data.length : (Array.isArray(j) ? j.length : 0);
    } catch (_) {}
    return {
      ok: r.ok,
      status: r.status,
      rows,
      bodyPreview: text.slice(0, 400),
    };
  } catch (e) {
    return { ok: false, reason: "fetch_error", message: e.message };
  }
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  const keyPreview = WINDSOR_KEY
    ? `${WINDSOR_KEY.slice(0, 6)}…${WINDSOR_KEY.slice(-4)} (len ${WINDSOR_KEY.length})`
    : "MISSING";
  const [facebook, google_ads] = await Promise.all([
    probe("facebook", "date,campaign,spend"),
    probe("google_ads", "date,campaign,spend"),
  ]);
  return res.status(200).json({ keyPreview, facebook, google_ads });
}
