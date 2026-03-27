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

// ─── WEEKLY INSIGHTS ENGINE ──────────────────────────────────────────────────
// Compares the most recent 7 days vs the prior 7 days and generates
// trend-aware, property-specific recommendations
function buildWeeklyInsights(daily, pageConfig, property, metrics) {
  if (!daily || daily.length < 7) return { trends: {}, actions: [] };

  // Split daily into this week (last 7 days) and last week (7 days before that)
  const sorted = [...daily].sort((a, b) => b.date.localeCompare(a.date));
  const thisWeek = sorted.slice(0, 7);
  const lastWeek = sorted.slice(7, 14);

  const avg = (arr, key) => {
    if (!arr.length) return 0;
    const sum = arr.reduce((s, r) => s + (r[key] || 0), 0);
    return sum / arr.length;
  };
  const sum = (arr, key) => arr.reduce((s, r) => s + (r[key] || 0), 0);

  const tw = {
    sessions: sum(thisWeek, "sessions"),
    users: sum(thisWeek, "users"),
    confirmations: sum(thisWeek, "confirmations"),
    bounceRate: avg(thisWeek, "bounceRate"),
    engagementRate: avg(thisWeek, "engagementRate"),
    convRate: avg(thisWeek, "conversionRate"),
    avgSessions: avg(thisWeek, "sessions"),
  };
  const lw = lastWeek.length >= 5 ? {
    sessions: sum(lastWeek, "sessions"),
    users: sum(lastWeek, "users"),
    confirmations: sum(lastWeek, "confirmations"),
    bounceRate: avg(lastWeek, "bounceRate"),
    engagementRate: avg(lastWeek, "engagementRate"),
    convRate: avg(lastWeek, "conversionRate"),
    avgSessions: avg(lastWeek, "sessions"),
  } : null;

  const pctChange = (curr, prev) => prev > 0 ? ((curr - prev) / prev) * 100 : null;
  const dir = (change) => change > 2 ? "up" : change < -2 ? "down" : "flat";

  // Build trends
  const trends = {
    sessions: { thisWeek: tw.sessions, lastWeek: lw?.sessions ?? null, change: lw ? pctChange(tw.sessions, lw.sessions) : null },
    confirmations: { thisWeek: tw.confirmations, lastWeek: lw?.confirmations ?? null, change: lw ? pctChange(tw.confirmations, lw.confirmations) : null },
    bounceRate: { thisWeek: tw.bounceRate, lastWeek: lw?.bounceRate ?? null, change: lw ? pctChange(tw.bounceRate, lw.bounceRate) : null },
    engagementRate: { thisWeek: tw.engagementRate, lastWeek: lw?.engagementRate ?? null, change: lw ? pctChange(tw.engagementRate, lw.engagementRate) : null },
    convRate: { thisWeek: tw.convRate, lastWeek: lw?.convRate ?? null, change: lw ? pctChange(tw.convRate, lw.convRate) : null },
  };

  // Generate weekly action items — data-driven, property-specific
  const actions = [];
  const propLabel = property === "shoreditch" ? "Shoreditch" : "Southall";

  // 1. Traffic trend
  if (trends.sessions.change !== null) {
    if (trends.sessions.change < -10) {
      actions.push({
        category: "Traffic",
        priority: "high",
        title: `Sessions dropped ${Math.abs(trends.sessions.change).toFixed(0)}% week-over-week`,
        action: `${propLabel} landing page traffic fell from ${lw.sessions} to ${tw.sessions} sessions. Review ad spend levels, check if any campaigns were paused, and verify tracking is firing correctly.`,
        metric: `${tw.sessions} sessions (was ${lw.sessions})`,
      });
    } else if (trends.sessions.change > 15) {
      actions.push({
        category: "Traffic",
        priority: "success",
        title: `Sessions grew ${trends.sessions.change.toFixed(0)}% week-over-week`,
        action: `Traffic is up from ${lw.sessions} to ${tw.sessions}. Identify which channels drove the increase and double down on what's working.`,
        metric: `${tw.sessions} sessions (was ${lw.sessions})`,
      });
    }
  }

  // 2. Conversion trend
  if (trends.convRate.change !== null) {
    if (trends.convRate.change < -15) {
      actions.push({
        category: "Conversion",
        priority: "high",
        title: "Conversion rate declining",
        action: `Conversion dropped from ${(lw.convRate * 100).toFixed(1)}% to ${(tw.convRate * 100).toFixed(1)}%. Check if the application form is working, test the full user journey, and review any recent page changes that might have broken the funnel.`,
        metric: `${(tw.convRate * 100).toFixed(1)}% (was ${(lw.convRate * 100).toFixed(1)}%)`,
      });
    } else if (trends.convRate.change > 15) {
      actions.push({
        category: "Conversion",
        priority: "success",
        title: "Conversion rate improving",
        action: `Conversion improved from ${(lw.convRate * 100).toFixed(1)}% to ${(tw.convRate * 100).toFixed(1)}%. Document what changed this week — if you made page updates, keep them. If traffic mix shifted, analyse which audiences convert best.`,
        metric: `${(tw.convRate * 100).toFixed(1)}% (was ${(lw.convRate * 100).toFixed(1)}%)`,
      });
    }
  }

  // 3. Bounce rate trend
  if (trends.bounceRate.change !== null && trends.bounceRate.change > 10) {
    actions.push({
      category: "Bounce Rate",
      priority: "high",
      title: "Bounce rate rising",
      action: `Bounce rate increased from ${(lw.bounceRate * 100).toFixed(1)}% to ${(tw.bounceRate * 100).toFixed(1)}%. This often means ad targeting is less relevant or page load speed has degraded. Run a PageSpeed test and review recent ad audience changes.`,
      metric: `${(tw.bounceRate * 100).toFixed(1)}% (was ${(lw.bounceRate * 100).toFixed(1)}%)`,
    });
  }

  // 4. Absolute-level recommendations (always present)
  // Hero & Above-the-fold
  if (metrics.avgBounceRate > 0.30) {
    actions.push({
      category: "Above the Fold",
      priority: "medium",
      title: "Optimise hero section to reduce bounce",
      action: `With a ${(metrics.avgBounceRate * 100).toFixed(0)}% bounce rate, test a new hero image showing the ${propLabel} building interior, add a clear value proposition headline ("Co-living from £X/week, all bills included"), and ensure the primary CTA is visible without scrolling.`,
      metric: `${(metrics.avgBounceRate * 100).toFixed(1)}% bounce rate`,
    });
  }

  // CTA Optimisation
  if (metrics.overallConversionRate < 0.10) {
    actions.push({
      category: "CTA & Form",
      priority: "medium",
      title: "Strengthen call-to-action to boost conversions",
      action: `Currently ${(metrics.overallConversionRate * 100).toFixed(1)}% of sessions convert. Add a sticky CTA button that stays visible on scroll, test action-oriented copy like "Apply Now — No Deposit Required" instead of generic "Submit", and add urgency messaging showing remaining room availability.`,
      metric: `${(metrics.overallConversionRate * 100).toFixed(1)}% conversion rate`,
    });
  }

  // Social Proof
  if (metrics.overallConversionRate < 0.12) {
    actions.push({
      category: "Social Proof",
      priority: "medium",
      title: "Add trust signals and testimonials",
      action: `Add 2-3 resident testimonials with photos near the application form. Include trust badges (e.g. "200+ residents", star ratings). For ${propLabel}, highlight community events and shared spaces to show the lifestyle.`,
      metric: `Target: 12%+ conversion rate`,
    });
  }

  // Mobile Experience
  if (metrics.avgBounceRate > 0.25) {
    actions.push({
      category: "Mobile UX",
      priority: "medium",
      title: "Audit the mobile experience",
      action: `Most ad traffic lands on mobile. Test the ${propLabel} landing page on iPhone and Android — check load time (<3s target), form usability, image sizing, and CTA tap targets. Use Google's Mobile-Friendly Test tool.`,
      metric: `${(metrics.avgBounceRate * 100).toFixed(1)}% bounce rate`,
    });
  }

  // Page Speed
  actions.push({
    category: "Page Speed",
    priority: "low",
    title: "Check page load performance",
    action: `Run ${pageConfig.landing} through PageSpeed Insights. Target a Largest Contentful Paint under 2.5s. Compress hero images, lazy-load below-fold content, and ensure fonts load quickly. Every 1s of load time adds ~7% to bounce rate.`,
    metric: "Target: <2.5s LCP",
  });

  // Content & SEO
  if (metrics.avgDailySessions < 100) {
    actions.push({
      category: "Content & SEO",
      priority: "low",
      title: "Boost organic traffic with content updates",
      action: `${propLabel} gets ${metrics.avgDailySessions.toFixed(0)} sessions/day — mostly paid. Add an FAQ section answering common questions (bills, contracts, amenities), create a virtual tour, and optimise meta titles/descriptions for "${propLabel.toLowerCase()} co-living" keywords.`,
      metric: `${metrics.avgDailySessions.toFixed(0)} daily sessions`,
    });
  }

  // Application confirmations volume
  const weeklyApps = tw.confirmations;
  if (weeklyApps < 10) {
    actions.push({
      category: "Volume",
      priority: "high",
      title: `Only ${weeklyApps} applications this week`,
      action: `${propLabel} had just ${weeklyApps} completed applications in the last 7 days. Priority: increase traffic (raise ad budget), reduce friction (shorten form), and retarget visitors who viewed the page but didn't apply.`,
      metric: `${weeklyApps} applications/week`,
    });
  }

  return { trends, actions, thisWeekDates: thisWeek.map(d => d.date).sort(), lastWeekDates: lastWeek.map(d => d.date).sort() };
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
    // NOTE: GA4 form_start/form_submit are enhanced measurement events that only fire for
    // native HTML <form> elements. Custom/embedded forms (GHL, Typeform, etc.) don't trigger these.
    // Instead we use confirmation page views as the reliable conversion signal, and compute
    // user-level conversion metrics which are more actionable.
    const sessionsPerUser = totalUsers > 0 ? totalSessions / totalUsers : 0;
    const applicationsPerUser = totalUsers > 0 ? totalConfirmations / totalUsers : 0;
    const newVisitorRate = totalSessions > 0 ? totalUsers / totalSessions : 0;

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

    // User conversion analysis
    if (applicationsPerUser < 0.05 && totalUsers > 50) {
      recommendations.push({
        type: "info",
        metric: "Applications/User",
        value: `${(applicationsPerUser * 100).toFixed(1)}%`,
        message: "Less than 5% of unique visitors apply. Test stronger CTAs, add social proof above the fold, or use exit-intent popups to capture leaving visitors.",
        priority: "medium",
      });
    }

    // Sessions per user (returning visitors)
    if (sessionsPerUser > 1.5) {
      recommendations.push({
        type: "success",
        metric: "Sessions/User",
        value: sessionsPerUser.toFixed(1),
        message: `Users average ${sessionsPerUser.toFixed(1)} sessions — visitors are returning to research. Ensure the page answers all key questions to convert them on return visits.`,
        priority: "low",
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

    // ─── WEEKLY INSIGHTS: compare this week vs last week for trend analysis ───
    const weeklyInsights = buildWeeklyInsights(daily, pageConfig, propertyFilter, {
      avgBounceRate, avgEngagementRate, overallConversionRate,
      applicationsPerUser, sessionsPerUser, avgDailySessions, totalConfirmations, totalSessions, totalUsers,
    });

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
          sessionsPerUser,
          applicationsPerUser,
          newVisitorRate,
          avgDailySessions: daily.length > 0 ? totalSessions / daily.length : 0,
        },
        recommendations,
        weeklyInsights,
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
