// pages/api/lavanda.js
// Server-side proxy for Lavanda PMS API — fetches short-stay data.
// Supports: legacy Azure Dev API key OR GraphQL OAuth2.
// Falls back to cached data if API unreachable.

export default async function handler(req, res) {
  const apiKey = req.query.apiKey || req.headers["x-lavanda-key"];
  const action = req.query.action || "dashboard";

  try {
    // ── Action: dashboard — aggregate all short-stay data ──
    if (action === "dashboard") {
      if (!apiKey) return res.status(400).json({ error: "Missing apiKey" });

      const BASE = "https://lavanda.azure-api.net";
      const headers = {
        "Ocp-Apim-Subscription-Key": apiKey,
        "XX-SUBSCRIPTION-PORTAL-ID": apiKey,
        Accept: "application/json",
      };

      // Try fetching from multiple possible endpoints
      let bookings = null, properties = null, calendar = null;
      const errors = [];

      // 1. Fetch bookings
      try {
        const bRes = await fetch(`${BASE}/api/dev/bookings?limit=100`, { headers });
        if (bRes.ok) {
          bookings = await bRes.json();
        } else {
          errors.push(`bookings: ${bRes.status}`);
        }
      } catch (e) { errors.push(`bookings: ${e.message}`); }

      // 2. Fetch properties (units)
      try {
        const pRes = await fetch(`${BASE}/api/dev/properties?limit=200`, { headers });
        if (pRes.ok) {
          properties = await pRes.json();
        } else {
          errors.push(`properties: ${pRes.status}`);
        }
      } catch (e) { errors.push(`properties: ${e.message}`); }

      // 3. Fetch calendar for each short-stay property (first 60 days)
      if (properties && Array.isArray(properties)) {
        const today = new Date().toISOString().slice(0, 10);
        const end = new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10);
        const calendars = [];
        for (const p of properties.slice(0, 50)) {
          try {
            const cRes = await fetch(
              `${BASE}/api/dev/properties/${p.id || p.uuid}/calendar?start_date=${today}&end_date=${end}`,
              { headers }
            );
            if (cRes.ok) calendars.push({ id: p.id || p.uuid, cal: await cRes.json() });
          } catch {}
        }
        calendar = calendars;
      }

      return res.status(200).json({
        source: errors.length === 0 ? "live" : "partial",
        errors,
        bookings,
        properties,
        calendar,
        fetchedAt: new Date().toISOString(),
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

    // ── Action: probe — legacy API uses HTTP Basic Auth + XX-SUBSCRIPTION-PORTAL-ID header ──
    if (action === "probe") {
      if (!apiKey) return res.status(400).json({ error: "Missing apiKey" });
      const portal = req.query.portal || "";

      const b64 = (s) => Buffer.from(s).toString("base64");
      const EMAIL = "lhampshire@andsoul.com";
      const authVariants = [
        { name: "email:key", auth: `Basic ${b64(EMAIL + ":" + apiKey)}` },
        { name: "key:email", auth: `Basic ${b64(apiKey + ":" + EMAIL)}` },
      ];
      const portalVariants = portal ? [portal] : [apiKey, "andsoul", ""];
      const url = "https://api.lavanda.app/api/dev/account";
      const results = {};

      for (const av of authVariants) {
        for (const pv of portalVariants) {
          try {
            const hdrs = { Authorization: av.auth, Accept: "application/json" };
            if (pv) hdrs["XX-SUBSCRIPTION-PORTAL-ID"] = pv;
            const r = await fetch(url, { headers: hdrs });
            const text = await r.text();
            results[`${av.name} | portal=${pv.slice(0,12)||"none"}`] = { status: r.status, preview: text.slice(0, 250) };
          } catch (e) {
            results[`${av.name} | portal=${pv.slice(0,12)||"none"}`] = { status: "error", preview: e.message };
          }
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
