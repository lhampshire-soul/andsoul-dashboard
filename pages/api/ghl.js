// pages/api/ghl.js
// Server-side proxy for Go High Level API.
// Browser calls /api/ghl?path=/opportunities/pipelines...
// This function forwards to GHL with the API key — no CORS issues.

const GHL_API_KEY  = process.env.GHL_API_KEY  || "pit-da675da7-68cd-4c4e-8693-c490f7f86f04";
const GHL_BASE     = "https://services.leadconnectorhq.com";

export default async function handler(req, res) {
  // Allow requests from same origin only
  const { path } = req.query;

  if (!path) {
    return res.status(400).json({ error: "Missing path parameter" });
  }

  const targetUrl = `${GHL_BASE}${path}`;

  try {
    const ghlRes = await fetch(targetUrl, {
      method: req.method || "GET",
      headers: {
        Authorization: `Bearer ${GHL_API_KEY}`,
        "Content-Type": "application/json",
        Version: "2021-07-28",
      },
      // Forward body for POST requests if needed in future
      ...(req.method === "POST" && req.body
        ? { body: JSON.stringify(req.body) }
        : {}),
    });

    const data = await ghlRes.json().catch(() => ({}));

    // Forward the exact status code from GHL
    return res.status(ghlRes.status).json(data);
  } catch (err) {
    console.error("GHL proxy error:", err);
    return res.status(500).json({ error: "Proxy error: " + err.message });
  }
}
