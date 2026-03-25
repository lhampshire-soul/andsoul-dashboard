// pages/api/meta.js
// Server-side proxy for Meta (Facebook) ad data via Windsor.ai
// Fetches ad spend, leads, and CPL data for date ranges at ad set level
//
// Required env var:
//   WINDSOR_API_KEY — your Windsor.ai API key (from https://app.windsor.ai/settings)

const WINDSOR_KEY = process.env.WINDSOR_API_KEY || "";
const WINDSOR_BASE = "https://connectors.windsor.ai";
const META_ACCOUNT = "296625156418426"; // AndSoul

// Ad sets where we ONLY count meta leads (on-platform lead forms), NOT website leads
// These ad sets have inflated website lead counts
const META_LEADS_ONLY_ADSETS = [
  "broad southall + 80km - lead form",
];

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

    // Fetch daily ad-set-level data from Windsor.ai
    const params = new URLSearchParams({
      api_key: WINDSOR_KEY,
      date_from: dateFrom,
      date_to: dateTo,
      fields: "date,campaign,adset,spend,impressions,clicks,actions_lead,actions_onsite_conversion_lead_grouped",
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
    const SOUTHALL_CAMPAIGN = "southall &soul | application | website lead gen";
    // Log all campaign names and ad sets for debugging
    const allCampaigns = [...new Set(rows.map(r => r.campaign))];
    const allAdsets = [...new Set(rows.map(r => r.adset))];
    console.log("Meta campaigns from Windsor:", JSON.stringify(allCampaigns));
    console.log("Meta ad sets from Windsor:", JSON.stringify(allAdsets));

    const filtered = rows.filter(r => {
      const name = (r.campaign || "").toLowerCase();
      if (propertyFilter === "shoreditch") {
        return name.includes("shoreditch") || name.includes("villas");
      }
      return name === SOUTHALL_CAMPAIGN;
    });

    // Helper: count leads for a row, respecting the meta-leads-only rule for certain ad sets
    function getLeads(row) {
      const adsetName = (row.adset || "").toLowerCase();
      const websiteLeads = parseInt(row.actions_lead || 0);
      const metaLeads = parseInt(row.actions_onsite_conversion_lead_grouped || 0);

      // For specified ad sets, only count meta leads (on-platform lead forms)
      if (META_LEADS_ONLY_ADSETS.some(a => adsetName.includes(a))) {
        return { total: metaLeads, websiteLeads: 0, metaLeads };
      }
      // For all other ad sets, count website leads only (avoid double-counting)
      return { total: websiteLeads, websiteLeads, metaLeads: 0 };
    }

    // Aggregate daily data
    const dailyMap = {};
    let totalSpend = 0, totalLeads = 0, totalWebsiteLeads = 0, totalMetaLeads = 0;

    filtered.forEach(row => {
      const date = row.date;
      const spend = parseFloat(row.spend || 0);
      const leads = getLeads(row);

      if (!dailyMap[date]) dailyMap[date] = { date, spend: 0, leads: 0 };
      dailyMap[date].spend += spend;
      dailyMap[date].leads += leads.total;
      totalSpend += spend;
      totalLeads += leads.total;
      totalWebsiteLeads += leads.websiteLeads;
      totalMetaLeads += leads.metaLeads;
    });

    const daily = Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date));
    daily.forEach(d => { d.cpl = d.leads > 0 ? d.spend / d.leads : 0; });

    // Ad set level summary
    const adsetMap = {};
    filtered.forEach(row => {
      const adsetName = row.adset || "Unknown";
      const campaignName = row.campaign || "Unknown";
      if (!adsetMap[adsetName]) adsetMap[adsetName] = { name: adsetName, campaign: campaignName, spend: 0, websiteLeads: 0, metaLeads: 0, leads: 0, impressions: 0, clicks: 0 };
      const leads = getLeads(row);
      adsetMap[adsetName].spend += parseFloat(row.spend || 0);
      adsetMap[adsetName].websiteLeads += parseInt(row.actions_lead || 0);
      adsetMap[adsetName].metaLeads += parseInt(row.actions_onsite_conversion_lead_grouped || 0);
      adsetMap[adsetName].leads += leads.total; // Only the leads that count
      adsetMap[adsetName].impressions += parseInt(row.impressions || 0);
      adsetMap[adsetName].clicks += parseInt(row.clicks || 0);
    });

    const adsets = Object.values(adsetMap).map(a => ({
      ...a,
      cpl: a.leads > 0 ? a.spend / a.leads : 0,
      leadType: META_LEADS_ONLY_ADSETS.some(x => a.name.toLowerCase().includes(x)) ? "meta_leads_only" : "website_leads",
    }));

    // Campaign-level summary
    const campMap = {};
    filtered.forEach(row => {
      const name = row.campaign || "Unknown";
      if (!campMap[name]) campMap[name] = { name, spend: 0, leads: 0, websiteLeads: 0, metaLeads: 0, impressions: 0, clicks: 0 };
      const leads = getLeads(row);
      campMap[name].spend += parseFloat(row.spend || 0);
      campMap[name].leads += leads.total;
      campMap[name].websiteLeads += leads.websiteLeads;
      campMap[name].metaLeads += leads.metaLeads;
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
        adsets,
        totalSpend,
        totalLeads,
        totalWebsiteLeads,
        totalMetaLeads,
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
