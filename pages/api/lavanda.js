// pages/api/lavanda.js
// Server-side proxy for Lavanda PMS API — fetches short-stay data.
// Supports: legacy Azure Dev API key OR GraphQL OAuth2.
// Falls back to cached data if API unreachable.

export default async function handler(req, res) {
  const apiKey = req.query.apiKey || req.headers["x-lavanda-key"];
  const action = req.query.action || "dashboard";

  try {
    // ── Action: dashboard — aggregate live short-stay data into dashboard shape ──
    if (action === "dashboard") {
      if (!apiKey) return res.status(400).json({ error: "Missing apiKey" });

      const BASE = "https://lavanda.azure-api.net";
      const headers = { "Ocp-Apim-Subscription-Key": apiKey, Accept: "application/json" };
      const errors = [];

      // 1. Account
      let accountName = "andsoul";
      try {
        const aRes = await fetch(`${BASE}/account`, { headers });
        if (aRes.ok) {
          const a = await aRes.json();
          accountName = a?.data?.attributes?.name || accountName;
        }
      } catch (e) { errors.push(`account: ${e.message}`); }

      // 2. All property groups
      let propGroups = [];
      try {
        const pRes = await fetch(`${BASE}/properties?perPage=100`, { headers });
        if (pRes.ok) {
          const p = await pRes.json();
          propGroups = p?.data || [];
        } else errors.push(`properties: ${pRes.status}`);
      } catch (e) { errors.push(`properties: ${e.message}`); }

      // 3. All bookings (paginate)
      let allBookings = [];
      try {
        for (let page = 1; page <= 10; page++) {
          const bRes = await fetch(`${BASE}/bookings?perPage=100&page[number]=${page}`, { headers });
          if (!bRes.ok) { if (page === 1) errors.push(`bookings: ${bRes.status}`); break; }
          const b = await bRes.json();
          const rows = b?.data || [];
          allBookings = allBookings.concat(rows);
          const totalPages = Math.ceil((b?.meta?.page?.total || 0) / 100);
          if (page >= totalPages) break;
        }
      } catch (e) { errors.push(`bookings: ${e.message}`); }

      // 4. Calendar for the short-stay property group (rates + blocked)
      const todayStr = new Date().toISOString().slice(0, 10);
      const rangeStart = new Date(Date.now() - 45 * 86400000).toISOString().slice(0, 10);
      const rangeEnd = new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10);
      // The short-stay group = the one referenced by bookings (or largest with bookings)
      const bookedPropIds = new Set(allBookings.map(b => b?.relationships?.property?.data?.id).filter(Boolean));
      const ssGroup = propGroups.find(g => bookedPropIds.has(g.id)) || propGroups[0];
      let calRaw = null;
      const calById = {}; // date -> {rate, blocked, available}
      if (ssGroup) {
        try {
          const cRes = await fetch(
            `${BASE}/properties/${ssGroup.id}/calendar?start_date=${rangeStart}&end_date=${rangeEnd}&perPage=200`,
            { headers }
          );
          if (cRes.ok) {
            calRaw = await cRes.json();
            const items = calRaw?.data || [];
            items.forEach(it => {
              const at = it?.attributes || it;
              const date = (at.date || at.day || "").slice(0, 10);
              if (!date) return;
              calById[date] = {
                rate: at.price ?? at.rate ?? at.daily_rate ?? null,
                available: at.available_units ?? at.available ?? at.availability ?? null,
                status: at.status ?? null,
              };
            });
          } else errors.push(`calendar: ${cRes.status}`);
        } catch (e) { errors.push(`calendar: ${e.message}`); }
      }

      // ── Aggregate ──
      // Exclude child properties: any property referenced in another group's relationships.properties
      const childIds = new Set();
      propGroups.forEach(g => (g?.relationships?.properties?.data || []).forEach(c => childIds.add(c.id)));
      const parentGroups = propGroups.filter(g => !childIds.has(g.id) && (g?.attributes?.total_units || 0) > 0);

      const ssUnits = ssGroup?.attributes?.total_units || 30;
      const totalInventory = parentGroups.reduce((s, g) => s + (g?.attributes?.total_units || 0), 0);

      // Only status === "confirmed" counts — inquiries have null cost and aren't real bookings
      const confirmed = allBookings.filter(b => (b.attributes.status || "").toLowerCase() === "confirmed");
      const canceled = allBookings.filter(b => b.attributes.canceled || (b.attributes.status || "").toLowerCase() === "canceled");
      const inquiries = allBookings.filter(b => (b.attributes.status || "").toLowerCase() === "inquiry");

      // Daily occupancy: count units with a confirmed booking each night
      const daily = [];
      const msDay = 86400000;
      const dStart = new Date(rangeStart + "T00:00:00Z");
      const dEnd = new Date(rangeEnd + "T00:00:00Z");
      for (let t = dStart.getTime(); t <= dEnd.getTime(); t += msDay) {
        const date = new Date(t).toISOString().slice(0, 10);
        const unitsBooked = new Set();
        confirmed.forEach(b => {
          const a = b.attributes;
          if (a.start_date <= date && a.end_date > date) {
            unitsBooked.add(b?.relationships?.unit?.data?.id || b.id);
          }
        });
        const cal = calById[date] || {};
        const booked = unitsBooked.size;
        // available from calendar if present; blocked = units - booked - available
        let available = cal.available != null ? Number(cal.available) : null;
        let blocked = 0;
        if (available != null && !isNaN(available)) {
          blocked = Math.max(0, ssUnits - booked - available);
        } else {
          available = ssUnits - booked;
        }
        daily.push({ date, booked, blocked, total: ssUnits, available, rate: cal.rate != null ? Number(cal.rate) : null });
      }

      // Tonight KPIs
      const tonight = daily.find(d => d.date === todayStr) || { booked: 0, blocked: 0, available: ssUnits };
      const in7 = new Date(Date.now() + 7 * msDay).toISOString().slice(0, 10);
      const arrivals7 = confirmed.filter(b => b.attributes.start_date >= todayStr && b.attributes.start_date < in7).length;
      const departures7 = confirmed.filter(b => b.attributes.end_date >= todayStr && b.attributes.end_date < in7).length;
      const inHouse = confirmed.filter(b => b.attributes.start_date <= todayStr && b.attributes.end_date > todayStr).length;

      // Revenue
      let totalConfValue = 0, totalNights = 0, futureRev = 0;
      const monthlyMap = {};
      confirmed.forEach(b => {
        const a = b.attributes;
        const cost = Number(a.total_cost) || 0;
        const nights = Number(a.total_days) || Math.max(1, Math.round((new Date(a.end_date) - new Date(a.start_date)) / msDay));
        totalConfValue += cost;
        totalNights += nights;
        const perNight = nights > 0 ? cost / nights : 0;
        for (let t = new Date(a.start_date + "T00:00:00Z").getTime(); t < new Date(a.end_date + "T00:00:00Z").getTime(); t += msDay) {
          const d = new Date(t).toISOString().slice(0, 10);
          const mk = d.slice(0, 7);
          monthlyMap[mk] = (monthlyMap[mk] || 0) + perNight;
          if (d >= todayStr) futureRev += perNight;
        }
      });
      const monthly = Object.keys(monthlyMap).sort().map(m => ({ month: m, revenue: Math.round(monthlyMap[m] * 100) / 100 }));
      const adr = totalNights > 0 ? Math.round((totalConfValue / totalNights) * 100) / 100 : 0;

      // Tiers
      const tiers = parentGroups.map(g => {
        const isSS = g.id === ssGroup?.id;
        const name = (g?.attributes?.name || "").replace(/^Southall\s*&?Soul\s*-\s*/i, "");
        return {
          tier: name || g?.attributes?.name || "—",
          units: g?.attributes?.total_units || 0,
          booked: isSS ? tonight.booked : 0,
          blocked: isSS ? tonight.blocked : 0,
          available: isSS ? tonight.available : (g?.attributes?.total_units || 0),
          rate: isSS ? (tonight.rate ?? null) : null,
          shortstay: isSS,
        };
      });

      // Upcoming bookings (in-house or future, soonest first)
      const upcoming = confirmed
        .filter(b => b.attributes.end_date >= todayStr)
        .sort((x, y) => x.attributes.start_date.localeCompare(y.attributes.start_date))
        .slice(0, 20)
        .map(b => {
          const a = b.attributes;
          return {
            guest: `${a.lead_guest_first_name || ""} ${a.lead_guest_last_name || ""}`.trim() || a.confirmation_code,
            start: a.start_date,
            end: a.end_date,
            nights: Number(a.total_days) || 0,
            value: Number(a.total_cost) || 0,
            platform: a.platform || "—",
            code: a.confirmation_code,
          };
        });

      return res.status(200).json({
        source: "live",
        errors,
        account: accountName,
        generated: new Date().toISOString(),
        kpis: {
          occ_tonight: tonight.booked,
          blocked_tonight: tonight.blocked,
          units: ssUnits,
          available_tonight: tonight.available,
          in_house: inHouse,
          arrivals7,
          departures7,
          future_rev: Math.round(futureRev * 100) / 100,
          total_conf_value: Math.round(totalConfValue * 100) / 100,
          adr,
          confirmed: confirmed.length,
          canceled: canceled.length,
          inquiries: inquiries.length,
          total_inventory: totalInventory,
        },
        daily,
        monthly,
        tiers,
        upcoming,
        _debug: { bookingCount: allBookings.length, propGroupCount: propGroups.length, calSample: calRaw?.data?.slice ? calRaw.data.slice(0, 2) : calRaw },
      });
    }

    // ── Action: graphql — proxy a GraphQL query to platapi ──
    if (action === "graphql") {
      const { client_id, client_secret } = req.query;
      const query = req.body?.query;
      const variables = req.body?.variables || {};

      if (!client_id || !client_secret) {
        return res.status(400).json({ error: "Missing client_id or client_secret for GraphQL" });
      }

      // 1. Get OAuth token
      const tokenRes = await fetch("https://platapi.lavanda.app/v1/oauth2/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ grant_type: "client_credentials", client_id, client_secret }),
      });
      if (!tokenRes.ok) {
        const text = await tokenRes.text();
        return res.status(tokenRes.status).json({ error: "OAuth token failed", detail: text });
      }
      const { access_token } = await tokenRes.json();

      // 2. Execute GraphQL query
      const gqlRes = await fetch("https://platapi.lavanda.app/v1", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${access_token}`,
        },
        body: JSON.stringify({ query, variables }),
      });
      const data = await gqlRes.json();
      return res.status(gqlRes.status).json(data);
    }

    // ── Action: raw — passthrough GET to any Lavanda path (debugging/reconciliation) ──
    if (action === "raw") {
      if (!apiKey) return res.status(400).json({ error: "Missing apiKey" });
      const path = req.query.path || "/account";
      if (!path.startsWith("/")) return res.status(400).json({ error: "path must start with /" });
      const r = await fetch(`https://lavanda.azure-api.net${path}`, {
        headers: { "Ocp-Apim-Subscription-Key": apiKey, Accept: "application/json" },
      });
      const text = await r.text();
      let parsed; try { parsed = JSON.parse(text); } catch { parsed = { rawResponse: text.slice(0, 3000) }; }
      return res.status(r.status).json(parsed);
    }

    // ── Action: probe — Azure APIM at lavanda.azure-api.net, paths WITHOUT /api/dev prefix ──
    if (action === "probe") {
      if (!apiKey) return res.status(400).json({ error: "Missing apiKey" });

      const headers = { "Ocp-Apim-Subscription-Key": apiKey, Accept: "application/json" };
      const paths = ["/account", "/properties?perPage=3", "/bookings?perPage=3"];
      const results = {};

      for (const p of paths) {
        try {
          const r = await fetch(`https://lavanda.azure-api.net${p}`, { headers });
          const text = await r.text();
          results[p] = { status: r.status, preview: text.slice(0, 2500) };
        } catch (e) {
          results[p] = { status: "error", preview: e.message };
        }
      }

      return res.status(200).json({ results });
    }

    return res.status(400).json({ error: "Invalid action. Use 'dashboard', 'graphql', or 'probe'." });
  } catch (err) {
    console.error("Lavanda proxy error:", err);
    return res.status(500).json({ error: "Proxy error: " + err.message });
  }
}
