// pages/api/analytics.js
// Server-side proxy for GA4 landing page analytics via Windsor.ai
// Fetches sessions, bounce rate, engagement, and conversion data for landing pages
//
// Required env var:
//   WINDSOR_API_KEY — your Windsor.ai API key

const WINDSOR_KEY = process.env.WINDSOR_API_KEY || "";
const WINDSOR_BASE = "https://connectors.windsor.ai";
const GA4_ACCOUNT = "383717987"; // andsoul.com - GA4

// Landing page paths per property
const PAGES = {
  southall: {
    landing: "/co-living-southall-west-london",
    confirmation: "/applicationcomplete",
    label: "Southall Co-Living",
  },
  shoreditch: {
    landing: "/co-living-shoreditch-east-london",
    confirmation: "/shoreditchapplicationcomplete",
    label: "Shoreditch Co-Living",
  },
};

async function fetchGA4(dateFrom, dateTo, fields, filters = []) {
  const params = new URLSearchParams({
    api_key: WINDSOR_KEY,
    date_from: dateFrom,
    date_to: dateTo,
    fields,
    _renderer: "json",
  });
  if (filters.length > 0) {
    params.set("filter", JSON.stringify(filters));
  }
  const url = `${WINDSOR_BASE}/googleanalytics4?${params}`;
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

  const propertyFilter = (property || "southall").toLowerCase();
  const pageConfig = PAGES[propertyFilter];
  if (!pageConfig) {
    return res.status(400).json({ error: "Unknown property: " + property });
  }

  try {
    // Make 4 parallel requests:
    // 1. Landing page daily metrics (sessions, bounce rate, engagement)
    // 2. Confirmation page daily sessions (= completed applications)
    // 3. Form events site-wide (form_start/form_submit don't carry page_path)
    // 4. Total site sessions (to calculate this property's share of form events)
    const [landingRes, confirmRes, eventsRes, siteTotalRes] = await Promise.all([
      fetchGA4(
        dateFrom, dateTo,
        "date,page_path,sessions,users,bounce_rate,engagement_rate,engaged_sessions",
        [["page_path", "eq", pageConfig.landing]]
      ),
      fetchGA4(
        dateFrom, dateTo,
        "date,page_path,sessions,users",
        [["page_path", "eq", pageConfig.confirmation]]
      ),
      // Form events (form_start/form_submit) fire site-wide, not per page_path,
      // so we fetch without page filter and attribute proportionally
      fetchGA4(
        dateFrom, dateTo,
        "event_name,event_count",
        [["event_name", "contains", "form"]]
      ),
      // Total site sessions to calculate property session share
      fetchGA4(
        dateFrom, dateTo,
        "sessions",
        []
      ),
    ]);

    // Parse landing page data
    let landingDaily = [];
    if (landingRes.ok) {
      const d = await landingRes.json();
      landingDaily = (d.data || d || []).filter(r => r.page_path === pageConfig.landing);
    } else {
      console.error("GA4 landing error:", landingRes.status, await landingRes.text().catch(() => ""));
    }

    // Parse confirmation page data
    let confirmDaily = [];
    if (confirmRes.ok) {
      const d = await confirmRes.json();
      confirmDaily = (d.data || d || []).filter(r => r.page_path === pageConfig.confirmation);
    } else {
      console.error("GA4 confirm error:", confirmRes.status, await confirmRes.text().catch(() => ""));
    }

    // Parse form events (site-wide — form_start/form_submit don't carry page_path)
    let formEvents = {};
    if (eventsRes.ok) {
      const d = await eventsRes.json();
      const rows = d.data || d || [];
      rows.forEach(r => {
        const name = r.event_name || "";
        if (!formEvents[name]) formEvents[name] = 0;
        formEvents[name] += parseInt(r.event_count || 0);
      });
    }

    // Get total site sessions for proportional attribution
    let siteTotalSessions = 0;
    if (siteTotalRes.ok) {
      const d = await siteTotalRes.json();
      const rows = d.data || d || [];
      rows.forEach(r => { siteTotalSessions += parseInt(r.sessions || 0); });
    }

    // Attribute form events proportionally to this property based on session share
    // (form events are site-wide; we estimate per-property using landing page session ratio)
    const siteFormStarts = formEvents["form_start"] || 0;
    const siteFormSubmits = formEvents["form_submit"] || 0;

    // Build confirmation lookup by date
    const confirmMap = {};
    confirmDaily.forEach(r => {
      confirmMap[r.date] = (confirmMap[r.date] || 0) + parseInt(r.sessions || 0);
    });

    // Build daily data with conversion rate
    let totalSessions = 0, totalUsers = 0, totalEngaged = 0;
    let totalConfirmations = 0;
    let totalBounceWeighted = 0, totalEngRateWeighted = 0;

    const daily = landingDaily.map(r => {
      const sessions = parseInt(r.sessions || 0);
      const users = parseInt(r.users || 0);
      const engagedSessions = parseInt(r.engaged_sessions || 0);
      const bounceRate = parseFloat(r.bounce_rate || 0);
      const engagementRate = parseFloat(r.engagement_rate || 0);
      const confirmations = confirmMap[r.date] || 0;
      const conversionRate = sessions > 0 ? confirmations / sessions : 0;

      totalSessions += sessions;
      totalUsers += users;
      totalEngaged += engagedSessions;
      totalConfirmations += confirmations;
      totalBounceWeighted += bounceRate * sessions;
      totalEngRateWeighted += engagementRate * sessions;

      return {
        date: r.date,
        sessions,
        users,
        engagedSessions,
        bounceRate,
        engagementRate,
        confirmations,
        conversionRate,
      };
    }).sort((a, b) => a.date.localeCompare(b.date));

    // Overall metrics
    const avgBounceRate = totalSessions > 0 ? totalBounceWeighted / totalSessions : 0;
    const avgEngagementRate = totalSessions > 0 ? totalEngRateWeighted / totalSessions : 0;
    const overallConversionRate = totalSessions > 0 ? totalConfirmations / totalSessions : 0;
    // Proportionally attribute form events: this property's landing sessions / total site sessions
    const sessionShare = siteTotalSessions > 0 ? totalSessions / siteTotalSessions : 0;
    const formStarts = Math.round(siteFormStarts * sessionShare);
    const formSubmits = Math.round(siteFormSubmits * sessionShare);
    const formStartRate = totalSessions > 0 ? formStarts / totalSessions : 0;
    const formCompletionRate = formStarts > 0 ? totalConfirmations / formStarts : 0;

    // Generate live recommendations
    const recommendations = [];

    // Bounce rate analysis
    if (avgBounceRate > 0.4) {
      recommendations.push({
        type: "warning",
        metric: "Bounce Rate",
        value: `${(avgBounceRate * 100).toFixed(1)}%`,
        message: "Bounce rate is high (>40%). Consider improving above-the-fold content, page load speed, and ensuring ad messaging matches the landing page.",
        priority: "high",
      });
    } else if (avgBounceRate > 0.3) {
      recommendations.push({
        type: "info",
        metric: "Bounce Rate",
        value: `${(avgBounceRate * 100).toFixed(1)}%`,
        message: "Bounce rate is moderate (30-40%). Test different hero images, headlines, or CTAs to reduce further.",
        priority: "medium",
      });
    } else {
      recommendations.push({
        type: "success",
        metric: "Bounce Rate",
        value: `${(avgBounceRate * 100).toFixed(1)}%`,
        message: "Bounce rate is healthy (<30%). Your landing page is engaging visitors well.",
        priority: "low",
      });
    }

    // Conversion rate analysis
    if (overallConversionRate < 0.05) {
      recommendations.push({
        type: "warning",
        metric: "Conversion Rate",
        value: `${(overallConversionRate * 100).toFixed(1)}%`,
        message: "Conversion rate is below 5%. Consider simplifying the application form, adding social proof/testimonials, or creating urgency with availability messaging.",
        priority: "high",
      });
    } else if (overallConversionRate < 0.10) {
      recommendations.push({
        type: "info",
        metric: "Conversion Rate",
        value: `${(overallConversionRate * 100).toFixed(1)}%`,
        message: "Conversion rate is fair (5-10%). A/B test form length, CTA button copy, and placement to push towards 10%+.",
        priority: "medium",
      });
    } else {
      recommendations.push({
        type: "success",
        metric: "Conversion Rate",
        value: `${(overallConversionRate * 100).toFixed(1)}%`,
        message: "Strong conversion rate (10%+). Your landing page funnel is performing well.",
        priority: "low",
      });
    }

    // Engagement analysis
    if (avgEngagementRate < 0.6) {
      recommendations.push({
        type: "warning",
        metric: "Engagement Rate",
        value: `${(avgEngagementRate * 100).toFixed(1)}%`,
        message: "Engagement rate is low (<60%). Visitors aren't exploring the page. Add interactive elements, video tours, or clearer section navigation.",
        priority: "high",
      });
    } else if (avgEngagementRate >= 0.7) {
      recommendations.push({
        type: "success",
        metric: "Engagement Rate",
        value: `${(avgEngagementRate * 100).toFixed(1)}%`,
        message: "Engagement rate is strong (70%+). Visitors are actively interacting with the page content.",
        priority: "low",
      });
    }

    // Form funnel analysis
    if (formStarts > 0 && formCompletionRate < 0.5) {
      recommendations.push({
        type: "warning",
        metric: "Form Completion",
        value: `${(formCompletionRate * 100).toFixed(1)}%`,
        message: `Only ${(formCompletionRate * 100).toFixed(0)}% of form starters complete the application. Consider reducing form fields, adding progress indicators, or saving partial submissions.`,
        priority: "high",
      });
    }

    // Form start rate
    if (formStartRate < 0.15 && totalSessions > 50) {
      recommendations.push({
        type: "info",
        metric: "Form Start Rate",
        value: `${(formStartRate * 100).toFixed(1)}%`,
        message: "Less than 15% of visitors start the form. Make the CTA more prominent, add it above the fold, or use sticky CTA buttons.",
        priority: "medium",
      });
    }

    // Volume-based insight
    const avgDailySessions = daily.length > 0 ? totalSessions / daily.length : 0;
    if (avgDailySessions < 30) {
      recommendations.push({
        type: "info",
        metric: "Traffic Volume",
        value: `${avgDailySessions.toFixed(0)}/day`,
        message: "Low daily traffic to this landing page. Consider increasing ad spend or broadening targeting to get statistically meaningful data.",
        priority: "medium",
      });
    }

    return res.status(200).json({
      configured: true,
      data: {
        daily,
        summary: {
          totalSessions,
          totalUsers,
          totalEngagedSessions: totalEngaged,
          totalConfirmations,
          avgBounceRate,
          avgEngagementRate,
          overallConversionRate,
          formStarts,
          formSubmits,
          formStartRate,
          formCompletionRate,
          avgDailySessions: daily.length > 0 ? totalSessions / daily.length : 0,
        },
        recommendations,
        landingPage: pageConfig.landing,
        confirmationPage: pageConfig.confirmation,
        label: pageConfig.label,
        dateFrom,
        dateTo,
        property: propertyFilter,
      },
    });
  } catch (err) {
    console.error("GA4 analytics proxy error:", err);
    return res.status(500).json({
      error: "Proxy error: " + err.message,
      configured: true,
      data: null,
    });
  }
}
