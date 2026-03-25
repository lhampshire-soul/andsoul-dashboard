// pages/api/meta.js
// Server-side proxy for Meta (Facebook) ad data via Windsor.ai
// Fetches ad spend, leads, and CPL data for date ranges at ad set level
//
// IMPORTANT: Windsor's Facebook connector cannot combine actions_lead + actions_onsite_conversion_lead_grouped
// + adset_name in a single request (returns 400). So we make TWO separate requests and merge.
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
  "broad shoreditch + 60km - lead form",
];

async function fetchWindsor(dateFrom, dateTo, fields) {
  const params = new URLSearchParams({
    api_key: WINDSOR_KEY,
    date_from: dateFrom,
    date_to: dateTo,
    fields,
    _renderer: "json",
  });
  const url = `${WINDSOR_BASE}/facebook?${params}`;
  const res = await fetch(url);
  return res;
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

    // Make TWO parallel requests to avoid Windsor field combination bug:
    // Request A: ad set level + website leads (actions_lead)
    // Request B: ad set level + meta leads (actions_onsite_conversion_lead_grouped)
    const [resA, resB] = await Promise.all([
      fetchWindsor(dateFrom, dateTo, "date,campaign,adset_name,spend,impressions,clicks,actions_lead"),
      fetchWindsor(dateFrom, dateTo, "date,campaign,adset_name,spend,actions_onsite_conversion_lead_grouped"),
    ]);

    if (!resA.ok) {
      const text = await resA.text();
      console.error("Windsor Meta error (req A):", resA.status, text.slice(0, 500));
      return res.status(resA.status).json({
        error: `Windsor API error: ${resA.status}`,
        configured: true,
        data: null,
      });
    }

    const dataA = await resA.json();
    const rowsA = dataA.data || dataA || [];

    // Build a lookup from request B (meta leads) keyed by date+campaign+adset
    let metaLeadsMap = {};
    if (resB.ok) {
      const dataB = await resB.json();
      const rowsB = dataB.data || dataB || [];
      rowsB.forEach(r => {
        const key = `${r.date}|${r.campaign}|${r.adset_name || ""}`;
        metaLeadsMap[key] = parseInt(r.actions_onsite_conversion_lead_grouped || 0);
      });
    } else {
      console.warn("Windsor Meta: meta leads request failed, will use website leads only");
    }

    // Merge: add meta leads to each row from request A
    const rows = rowsA.map(r => {
      const key = `${r.date}|${r.campaign}|${r.adset_name || ""}`;
      return {
        ...r,
        actions_onsite_conversion_lead_grouped: metaLeadsMap[key] || 0,
      };
    });

    // Log for debugging
    const allCampaigns = [...new Set(rows.map(r => r.campaign))];
    console.log("Meta campaigns from Windsor:", JSON.stringify(allCampaigns));
    const allAdsets = [...new Set(rows.map(r => r.adset_name).filter(Boolean))];
    console.log("Meta ad sets:", JSON.stringify(allAdsets));

    // Filter campaigns by property name
    const SOUTHALL_CAMPAIGN = "southall &soul | application | website lead gen";
    const filterRow = (r) => {
      const name = (r.campaign || "").toLowerCase();
      if (propertyFilter === "shoreditch") {
        return name.includes("shoreditch") || name.includes("villas");
      }
      return name === SOUTHALL_CAMPAIGN;
    };

    const filtered = rows.filter(filterRow);

    // Helper: count leads for a row based on ad set rules
    function getLeads(row) {
      const websiteLeads = parseInt(row.actions_lead || 0);
      const metaLeads = parseInt(row.actions_onsite_conversion_lead_grouped || 0);
      const adsetName = (row.adset_name || "").toLowerCase();

      if (adsetName) {
        // For specified ad sets, only count meta leads (on-platform lead forms)
        if (META_LEADS_ONLY_ADSETS.some(a => adsetName.includes(a))) {
          return { total: metaLeads, websiteLeads: 0, metaLeads, source: "meta_leads_only" };
        }
        // For all other ad sets, count website leads only
        return { total: websiteLeads, websiteLeads, metaLeads: 0, source: "website_leads" };
      }

      // No ad set info — use meta leads only as safer default
      return { total: metaLeads, websiteLeads: 0, metaLeads, source: "meta_leads_default" };
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
      const name = row.adset_name || "Unknown";
      const campaignName = row.campaign || "Unknown";
      if (!adsetMap[name]) adsetMap[name] = { name, campaign: campaignName, spend: 0, websiteLeads: 0, metaLeads: 0, leads: 0, impressions: 0, clicks: 0 };
      const leads = getLeads(row);
      adsetMap[name].spend += parseFloat(row.spend || 0);
      adsetMap[name].websiteLeads += parseInt(row.actions_lead || 0);
      adsetMap[name].metaLeads += parseInt(row.actions_onsite_conversion_lead_grouped || 0);
      adsetMap[name].leads += leads.total;
      adsetMap[name].impressions += parseInt(row.impressions || 0);
      adsetMap[name].clicks += parseInt(row.clicks || 0);
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
        adsetFieldFound: "adset_name",
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
