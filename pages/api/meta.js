// pages/api/meta.js
// Server-side proxy for Meta (Facebook) ad data via Windsor.ai
// Fetches ad spend, leads, and CPL data for date ranges
//
// Required env var:
//   WINDSOR_API_KEY — your Windsor.ai API key (from https://app.windsor.ai/settings)

const WINDSOR_KEY = process.env.WINDSOR_API_KEY || "";
const WINDSOR_BASE = "https://connectors.windsor.ai";
const META_ACCOUNT = "296625156418426"; // AndSoul

export default async function handler(req, res) {
  const { dateFrom, dateTo, property } = req.query;

  if (!WINDSOR_KEY) {
    return res.status(200).json({
      error: "WINDSOR_API_KEY not configured",
      configured: false,
      data: null,
    });
  }

  if (!dateFrom || !dateTo) {
    return res.status(400).json({ error: "Missing dateFrom or dateTo" });
  }

  try {
    const propertyFilter = (property || "southall").toLowerCase();

    // Fetch daily campaign-level data from Windsor.ai
    const params = new URLSearchParams({
      api_key: WINDSOR_KEY,
      date_from: dateFrom,
      date_to: dateTo,
      fields: "date,campaign,spend,impressions,clicks,actions_lead,actions_onsite_conversion_lead_grouped",
      _renderer: "json",
    });

    const url = `${WINDSOR_BASE}/facebook?${params}`;
    const windsorRes = await fetch(url);

    if (!windsorRes.ok) {
      const text = await windsorRes.text();
      console.error("Windsor Meta error:", windsorRes.status, text.slice(0, 500));
      return res.status(windsorRes.status).json({
        error: `Windsor API error: ${windsorRes.status}`,
        configured: true,
        data: null,
      });
    }

    const windsorData = await windsorRes.json();
    const rows = windsorData.data || windsorData || [];

    // Filter campaigns by property name
    const filtered = rows.filter(r => {
      const name = (r.campaign || "").toLowerCase();
      if (propertyFilter === "shoreditch") {
        return name.includes("shoreditch") || name.includes("villas");
      }
      return (name.includes("southall") || name.includes("&soul")) && !name.includes("shoreditch");
    });

    // Aggregate daily data
    const dailyMap = {};
    let totalSpend = 0, totalLeads = 0;

    filtered.forEach(row => {
      const date = row.date;
      const spend = parseFloat(row.spend || 0);
      const leads = parseInt(row.actions_lead || 0) + parseInt(row.actions_onsite_conversion_lead_grouped || 0);

      if (!dailyMap[date]) dailyMap[date] = { date, spend: 0, leads: 0 };
      dailyMap[date].spend += spend;
      dailyMap[date].leads += leads;
      totalSpend += spend;
      totalLeads += leads;
    });

    const daily = Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date));
    daily.forEach(d => { d.cpl = d.leads > 0 ? d.spend / d.leads : 0; });

    // Campaign-level summary
    const campMap = {};
    filtered.forEach(row => {
      const name = row.campaign || "Unknown";
      if (!campMap[name]) campMap[name] = { name, spend: 0, leads: 0, impressions: 0, clicks: 0 };
      campMap[name].spend += parseFloat(row.spend || 0);
      campMap[name].leads += parseInt(row.actions_lead || 0) + parseInt(row.actions_onsite_conversion_lead_grouped || 0);
      campMap[name].impressions += parseInt(row.impressions || 0);
      campMap[name].clicks += parseInt(row.clicks || 0);
    });

    const campaigns = Object.values(campMap).map(c => ({
      ...c,
      cpl: c.leads > 0 ? c.spend / c.leads : 0,
    }));

    return res.status(200).json({
      configured: true,
      data: {
        daily,
        campaigns,
        totalSpend,
        totalLeads,
        avgCpl: totalLeads > 0 ? totalSpend / totalLeads : 0,
        dateFrom,
        dateTo,
        property: propertyFilter,
      },
    });
  } catch (err) {
    console.error("Windsor Meta proxy error:", err);
    return res.status(500).json({
      error: "Proxy error: " + err.message,
      configured: true,
      data: null,
    });
  }
}
