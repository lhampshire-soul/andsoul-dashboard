// pages/api/rh.js
// Server-side proxy for Res Harmonics API — fixes CORS issues.
// Browser calls /api/rh?action=token or /api/rh?action=fetch&path=/api/units

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
      const apiRes = await fetch(`https://apiv3.rerumapp.uk${path}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await apiRes.text();
      let parsed;
      try { parsed = JSON.parse(data); } catch { parsed = { rawResponse: data }; }
      if (!apiRes.ok) {
        console.error(`RH API ${apiRes.status} for ${path}:`, data.slice(0, 500));
      }
      return res.status(apiRes.status).json(parsed);
    }

    return res.status(400).json({ error: "Invalid action. Use 'token' or 'fetch'." });
  } catch (err) {
    console.error("RH proxy error:", err);
    return res.status(500).json({ error: "Proxy error: " + err.message });
  }
}
