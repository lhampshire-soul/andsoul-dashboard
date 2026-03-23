// pages/api/google.js
// Server-side proxy for Google Ads API
// Fetches ad spend, conversions, CPC data for date ranges
//
// Required env vars:
//   GOOGLE_ADS_DEVELOPER_TOKEN - from Google Ads API Center
//   GOOGLE_ADS_CUSTOMER_ID     - Google Ads customer/account ID (no dashes)
//   GOOGLE_ADS_REFRESH_TOKEN   - OAuth2 refresh token
//   GOOGLE_ADS_CLIENT_ID       - OAuth2 client ID
//   GOOGLE_ADS_CLIENT_SECRET   - OAuth2 client secret
//   GOOGLE_ADS_LOGIN_CUSTOMER_ID - (optional) MCC manager account ID if using MCC

const DEV_TOKEN = process.env.GOOGLE_ADS_DEVELOPER_TOKEN || "";
const CUSTOMER_ID = process.env.GOOGLE_ADS_CUSTOMER_ID || "";
const REFRESH_TOKEN = process.env.GOOGLE_ADS_REFRESH_TOKEN || "";
const CLIENT_ID = process.env.GOOGLE_ADS_CLIENT_ID || "";
const CLIENT_SECRET = process.env.GOOGLE_ADS_CLIENT_SECRET || "";
const LOGIN_CUSTOMER_ID = process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID || "";

async function getAccessToken() {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      refresh_token: REFRESH_TOKEN,
      grant_type: "refresh_token",
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`OAuth error: ${data.error_description || data.error}`);
  return data.access_token;
}

async function queryGoogleAds(accessToken, query) {
  const cleanId = CUSTOMER_ID.replace(/-/g, "");
  const url = `https://googleads.googleapis.com/v16/customers/${cleanId}/googleAds:searchStream`;

  const headers = {
    Authorization: `Bearer ${accessToken}`,
    "developer-token": DEV_TOKEN,
    "Content-Type": "application/json",
  };
  if (LOGIN_CUSTOMER_ID) headers["login-customer-id"] = LOGIN_CUSTOMER_ID.replace(/-/g, "");

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({ query }),
  });

  const data = await res.json();
  if (!res.ok || data.error) {
    throw new Error(data.error?.message || `Google Ads API ${res.status}`);
  }

  const results = [];
  (Array.isArray(data) ? data : [data]).forEach(batch => {
    (batch.results || []).forEach(r => results.push(r));
  });
  return results;
}

export default async function handler(req, res) {
  const { dateFrom, dateTo, property } = req.query;

  if (!DEV_TOKEN || !CUSTOMER_ID || !REFRESH_TOKEN || !CLIENT_ID || !CLIENT_SECRET) {
    return res.status(200).json({
      error: "Google Ads API credentials not configured",
      configured: false,
      data: null,
    });
  }

  if (!dateFrom || !dateTo) {
    return res.status(400).json({ error: "Missing dateFrom or dateTo" });
  }

  try {
    const accessToken = await getAccessToken();
    const propertyFilter = (property || "southall").toLowerCase();

    const dailyQuery = `
      SELECT
        segments.date,
        metrics.cost_micros,
        metrics.conversions,
        metrics.clicks,
        metrics.impressions,
        metrics.average_cpc,
        campaign.name
      FROM campaign
      WHERE segments.date BETWEEN '${dateFrom}' AND '${dateTo}'
        AND campaign.status != 'REMOVED'
      ORDER BY segments.date
    `;

    const dailyResults = await queryGoogleAds(accessToken, dailyQuery);

    const filtered = dailyResults.filter(r => {
      const name = (r.campaign?.name || "").toLowerCase();
      if (propertyFilter === "shoreditch") return name.includes("shoreditch");
      return name.includes("southall") || name.includes("&soul");
    });

    const dailyMap = {};
    let totalSpend = 0, totalConversions = 0, totalClicks = 0;

    filtered.forEach(r => {
      const date = r.segments?.date;
      const spend = (parseInt(r.metrics?.costMicros || 0)) / 1000000;
      const convs = parseFloat(r.metrics?.conversions || 0);
      const clicks = parseInt(r.metrics?.clicks || 0);

      if (!dailyMap[date]) dailyMap[date] = { date, spend: 0, convs: 0, clicks: 0 };
      dailyMap[date].spend += spend;
      dailyMap[date].convs += convs;
      dailyMap[date].clicks += clicks;
      totalSpend += spend;
      totalConversions += convs;
      totalClicks += clicks;
    });

    const daily = Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date));

    const campaignQuery = `
      SELECT
        campaign.name,
        metrics.cost_micros,
        metrics.conversions,
        metrics.clicks,
        metrics.impressions,
        metrics.average_cpc,
        campaign.advertising_channel_type
      FROM campaign
      WHERE segments.date BETWEEN '${dateFrom}' AND '${dateTo}'
        AND campaign.status != 'REMOVED'
    `;

    const campResults = await queryGoogleAds(accessToken, campaignQuery);

    const campMap = {};
    campResults
      .filter(r => {
        const name = (r.campaign?.name || "").toLowerCase();
        if (propertyFilter === "shoreditch") return name.includes("shoreditch");
        return name.includes("southall") || name.includes("&soul");
      })
      .forEach(r => {
        const name = r.campaign?.name || "Unknown";
        if (!campMap[name]) campMap[name] = { name, spend: 0, convs: 0, clicks: 0, impressions: 0, avgCPC: 0, type: "" };
        campMap[name].spend += (parseInt(r.metrics?.costMicros || 0)) / 1000000;
        campMap[name].convs += parseFloat(r.metrics?.conversions || 0);
        campMap[name].clicks += parseInt(r.metrics?.clicks || 0);
        campMap[name].impressions += parseInt(r.metrics?.impressions || 0);
        const ch = r.campaign?.advertisingChannelType || "";
        campMap[name].type = ch === "SEARCH" ? "Search" : ch === "PERFORMANCE_MAX" ? "Pmax" : ch === "VIDEO" ? "Video" : ch === "LOCAL" ? "Local" : ch;
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
        avgCPC: totalClicks > 0 ? totalSpend / totalClicks : 0,
        costPerConv: totalConversions > 0 ? totalSpend / totalConversions : 0,
        dateFrom,
        dateTo,
        property: propertyFilter,
      },
    });
  } catch (err) {
    console.error("Google Ads proxy error:", err);
    return res.status(500).json({ error: "Proxy error: " + err.message, configured: true, data: null });
  }
}
