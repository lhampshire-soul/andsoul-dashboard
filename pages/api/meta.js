// pages/api/meta.js
// Server-side proxy for Meta (Facebook) Marketing API
// Fetches ad spend, leads, and CPL data for date ranges
//
// Required env vars:
//   META_ACCESS_TOKEN  - long-lived access token from Facebook Business Manager
//   META_AD_ACCOUNT_ID - ad account ID (format: act_XXXXXXXXXX)

const META_TOKEN = process.env.META_ACCESS_TOKEN || "";
const META_AD_ACCOUNT = process.env.META_AD_ACCOUNT_ID || "";
const META_BASE = "https://graph.facebook.com/v19.0";

export default async function handler(req, res) {
  const { dateFrom, dateTo, property } = req.query;

  if (!META_TOKEN || !META_AD_ACCOUNT) {
    return res.status(200).json({
      error: "META_ACCESS_TOKEN and META_AD_ACCOUNT_ID environment variables not set",
      configured: false,
      data: null,
    });
  }

  if (!dateFrom || !dateTo) {
    return res.status(400).json({ error: "Missing dateFrom or dateTo" });
  }

  try {
    const propertyFilter = (property || "southall").toLowerCase();

    const insightsUrl = `${META_BASE}/${META_AD_ACCOUNT}/insights?` + new URLSearchParams({
      access_token: META_TOKEN,
      time_range: JSON.stringify({ since: dateFrom, until: dateTo }),
      time_increment: 1,
      fields: "spend,impressions,clicks,actions,cost_per_action_type,campaign_name",
      level: "campaign",
      limit: 500,
    });

    const insightsRes = await fetch(insightsUrl);
    const insightsData = await insightsRes.json();

    if (!insightsRes.ok || insightsData.error) {
      console.error("Meta API error:", insightsData.error || insightsData);
      return res.status(insightsRes.status || 500).json({
        error: insightsData.error?.message || "Meta API error",
        configured: true,
        data: null,
      });
    }

    const rows = insightsData.data || [];
    const filtered = rows.filter(r => {
      const name = (r.campaign_name || "").toLowerCase();
      if (propertyFilter === "shoreditch") return name.includes("shoreditch");
      return name.includes("southall") || name.includes("&soul");
    });

    const dailyMap = {};
    let totalSpend = 0, totalLeads = 0;

    filtered.forEach(row => {
      const date = row.date_start;
      const spend = parseFloat(row.spend || 0);
      const leadAction = (row.actions || []).find(a =>
        a.action_type === "lead" || a.action_type === "onsite_conversion.lead_grouped"
      );
      const leads = leadAction ? parseInt(leadAction.value || 0) : 0;

      if (!dailyMap[date]) dailyMap[date] = { date, spend: 0, leads: 0 };
      dailyMap[date].spend += spend;
      dailyMap[date].leads += leads;
      totalSpend += spend;
      totalLeads += leads;
    });

    const daily = Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date));
    daily.forEach(d => { d.cpl = d.leads > 0 ? d.spend / d.leads : 0; });

    const campaignUrl = `${META_BASE}/${META_AD_ACCOUNT}/insights?` + new URLSearchParams({
      access_token: META_TOKEN,
      time_range: JSON.stringify({ since: dateFrom, until: dateTo }),
      fields: "spend,impressions,clicks,actions,campaign_name,cost_per_action_type",
      level: "campaign",
      limit: 100,
    });

    const campRes = await fetch(campaignUrl);
    const campData = await campRes.json();
    const campaigns = (campData.data || [])
      .filter(r => {
        const name = (r.campaign_name || "").toLowerCase();
        if (propertyFilter === "shoreditch") return name.includes("shoreditch");
        return name.includes("southall") || name.includes("&soul");
      })
      .map(r => {
        const leads = ((r.actions || []).find(a => a.action_type === "lead") || {}).value || 0;
        return {
          name: r.campaign_name,
          spend: parseFloat(r.spend || 0),
          leads: parseInt(leads),
          impressions: parseInt(r.impressions || 0),
          clicks: parseInt(r.clicks || 0),
        };
      });

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
    console.error("Meta proxy error:", err);
    return res.status(500).json({ error: "Proxy error: " + err.message, configured: true, data: null });
  }
}
