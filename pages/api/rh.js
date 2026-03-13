// pages/api/rh.js
// Server-side proxy for Res Harmonics API — fixes CORS issues.
// Actions: token, fetch, discover

export default async function handler(req, res) {
  const { action, path, client_id, client_secret } = req.query;

  try {
    // Step 1: Get OAuth token
    if (action === "token") {
      if (!client_id || !client_secret) {
        return res.status(400).json({ error: "Missing client_id or client_secret" });
      }
      const tokenRes = await fetch("https://auth.rerumapp.uk/oauth2/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "client_credentials",
          client_id,
          client_secret,
        }),
      });
      const data = await tokenRes.text();
      let parsed;
      try { parsed = JSON.parse(data); } catch { parsed = { rawResponse: data }; }
      if (!tokenRes.ok) {
        console.error(`RH auth ${tokenRes.status}:`, data.slice(0, 500));
      }
      return res.status(tokenRes.status).json(parsed);
    }

    // Step 2: Fetch data with token
    if (action === "fetch") {
      const token = req.headers["x-rh-token"];
      if (!token || !path) {
        return res.status(400).json({ error: "Missing token or path" });
      }
      const url = `https://apiv3.rerumapp.uk${path}`;
      console.log(`RH FETCH: ${url}`);
      const apiRes = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await apiRes.text();
      console.log(`RH RESPONSE ${apiRes.status} for ${path}: ${data.slice(0, 300)}`);
      let parsed;
      try { parsed = JSON.parse(data); } catch { parsed = { rawResponse: data }; }
      if (!apiRes.ok) {
        console.error(`RH API ${apiRes.status} for ${path}:`, data.slice(0, 500));
      }
      return res.status(apiRes.status).json(parsed);
    }

    // Step 3: Discover valid endpoints by probing many paths
    if (action === "discover") {
      const token = req.headers["x-rh-token"];
      if (!token) {
        return res.status(400).json({ error: "Missing token" });
      }

      // Try many possible endpoint patterns — based on apidocs.resharmonics.com
      const paths = [
        // Root / docs / swagger
        "/",
        "/api",
        "/api/v3",
        "/swagger/index.html",
        // Confirmed from API docs: accessGroups, activities, buildings, companies, contacts, teams
        "/api/v3/accessGroups",
        "/api/v3/activities",
        "/api/v3/buildings",
        "/api/v3/salesChannels",
        "/api/v3/companies",
        "/api/v3/contacts",
        "/api/v3/teams",
        // Bookings (confirmed in Go client)
        "/api/v3/bookings",
        "/bookings",
        "/api/bookings",
        // Contracts (confirmed in Go client)
        "/api/v3/contracts",
        "/contracts",
        "/api/contracts",
        // Financials (confirmed in Go client)
        "/api/v3/financials",
        "/financials",
        "/api/financials",
        // Properties (confirmed in Go client + docs)
        "/api/v3/properties",
        "/properties",
        "/api/properties",
        // Products
        "/api/v3/products",
        // Organizations
        "/api/v3/organizations",
        // Tenancies (co-living)
        "/api/v3/tenancies",
        "/tenancies",
        "/api/tenancies",
        // Units / rooms / beds
        "/api/v3/units",
        "/units",
        "/api/units",
        "/api/v3/rooms",
        "/rooms",
        "/api/rooms",
        "/api/v3/beds",
        // Reservations
        "/api/v3/reservations",
        "/reservations",
        "/api/reservations",
        // Guests / guest stays
        "/api/v3/guests",
        "/guests",
        "/api/v3/guestStays",
        "/api/v3/guest-stays",
        // Occupancy / availability
        "/api/v3/occupancy",
        "/occupancy",
        "/api/v3/availability",
        "/availability",
        // Revenue / invoices / charges / payments
        "/api/v3/invoices",
        "/invoices",
        "/api/v3/charges",
        "/charges",
        "/api/v3/payments",
        "/payments",
        "/api/v3/revenue",
        "/revenue",
        // Service delivery
        "/api/v3/serviceDelivery",
        "/api/v3/service-delivery",
        // Leases / stays
        "/api/v3/leases",
        "/leases",
        "/api/v3/stays",
        "/stays",
        // Dashboard / stats / reports
        "/api/v3/dashboard",
        "/api/v3/stats",
        "/api/v3/reports",
        "/dashboard",
        "/stats",
        "/reports",
      ];

      const results = {};
      const fetches = paths.map(async (p) => {
        try {
          const url = `https://apiv3.rerumapp.uk${p}`;
          const r = await fetch(url, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const text = await r.text();
          let preview = text.slice(0, 200);
          try {
            const j = JSON.parse(text);
            // If it's an array, show count
            if (Array.isArray(j)) preview = `[Array: ${j.length} items] ${text.slice(0,150)}`;
            else if (j.data && Array.isArray(j.data)) preview = `{data: [${j.data.length} items]} ${text.slice(0,150)}`;
            else if (j.results && Array.isArray(j.results)) preview = `{results: [${j.results.length} items]} ${text.slice(0,150)}`;
            else if (j.items && Array.isArray(j.items)) preview = `{items: [${j.items.length} items]} ${text.slice(0,150)}`;
          } catch {}
          results[p] = { status: r.status, preview };
        } catch (e) {
          results[p] = { status: "error", preview: e.message };
        }
      });

      await Promise.all(fetches);
      return res.status(200).json({ endpoints: results });
    }

    return res.status(400).json({ error: "Invalid action. Use 'token', 'fetch', or 'discover'." });
  } catch (err) {
    console.error("RH proxy error:", err);
    return res.status(500).json({ error: "Proxy error: " + err.message });
  }
}
