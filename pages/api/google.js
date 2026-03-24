// pages/api/google.js
// Server-side proxy for Google Ads data via Windsor.ai
// Fetches ad spend, conversions, CPC data for date ranges
//
// Required env var:
//   WINDSOR_API_KEY — your Windsor.ai API key (from https://app.windsor.ai/settings)

const WINDSOR_KEY = process.env.WINDSOR_API_KEY || "";
const WINDSOR_BASE = "https://connectors.windsor.ai";
const GOOGLE_ACCOUNT = "635-731-8686"; // &Soul

// Map campaign names to friendly types
function getCampaignType(name) {
  const n = (name || "").toLowerCase();
  if (n.includes("pmax") || n.includes("performance max") || n.includes("local.")) return "Pmax";
  if (n.includes("video")) return "Video";
  if (n.includes("gmb") || n.includes("google my business") || n.includes("my business")) return "GMB";
  if (n.includes("display")) return "Display";
  return "Search";
}

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
      fields: "date,campaign,spend,impressions,clicks,conversions,cpc",
      _renderer: "json",
    });

    const url = `${WINDSOR_BASE}/google_ads?${params}`;
    const windsorRes = await fetch(url);

    if (!windsorRes.ok) {
      const text = await windsorRes.text();
      console.error("Windsor Google error:", windsorRes.status, text.slice(0, 500));
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
        return name.includes("shoreditch") || name.includes("sanctuary");
      }
      return (name.includes("southall") || name.includes("&soul") || name.includes("google my business | southall"))
        && !name.includes("shoreditch") && !name.includes("sanctuary");
    });

    // Aggregate by date
    const dailyMap = {};
    let totalSpend = 0, totalConversions = 0, totalClicks = 0, totalImpressions = 0;

    filtered.forEach(r => {
      const date = r.date;
      const spend = parseFloat(r.spend || 0);
      const convs = Math.round(parseFloat(r.conversions || 0));
      const clicks = parseInt(r.clicks || 0);
      const imps = parseInt(r.impressions || 0);

      if (!dailyMap[date]) dailyMap[date] = { date, spend: 0, convs: 0, clicks: 0, impressions: 0 };
      dailyMap[date].spend += spend;
      dailyMap[date].convs += convs;
      dailyMap[date].clicks += clicks;
      dailyMap[date].impressions += imps;
      totalSpend += spend;
      totalConversions += convs;
      totalClicks += clicks;
      totalImpressions += imps;
    });

    const daily = Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date));

    // Campaign-level summary
    const campMap = {};
    filtered.forEach(r => {
      const name = r.campaign || "Unknown";
      if (!campMap[name]) campMap[name] = { name, spend: 0, convs: 0, clicks: 0, impressions: 0, type: getCampaignType(name) };
      campMap[name].spend += parseFloat(r.spend || 0);
      campMap[name].convs += Math.round(parseFloat(r.conversions || 0));
      campMap[name].clicks += parseInt(r.clicks || 0);
      campMap[name].impressions += parseInt(r.impressions || 0);
    });

    const campaigns = Object.values(campMap).map(c => ({
      ...c,
      avgCPC: c.clicks > 0 ? c.spend / c.clicks : 0,
      costPerConv: c.convs > 0 ? c.spend / c.convs : 0,
    }));

    return res.status(200).json({
      configured: true,
      data: {
        daily,
        campaigns,
        totalSpend,
        totalConversions: Math.round(totalConversions),
        totalClicks,
        totalImpressions,
        avgCPC: totalClicks > 0 ? totalSpend / totalClicks : 0,
        costPerConv: totalConversions > 0 ? totalSpend / totalConversions : 0,
        dateFrom,
        dateTo,
        property: propertyFilter,
      },
    });
  } catch (err) {
    console.error("Windsor Google proxy error:", err);
    return res.status(500).json({
      error: "Proxy error: " + err.message,
      configured: true,
      data: null,
    });
  }
}
