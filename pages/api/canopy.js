// pages/api/canopy.js
// Server-side proxy for Canopy Referencing API.
// Browser calls /api/canopy?action=list&clientId=XXX
// This function forwards to Canopy with auth headers — no CORS issues.
//
// Actions:
//   list     — GET /referencing-requests/client/:clientId  (list all references)
//   get      — GET /referencing-requests/client/:clientId/rent-passport/:referenceId
//   search   — GET /referencing-requests/client/:clientId?email=...
//   refresh  — POST /referencing-requests/client/:clientId/refresh (refresh auth token)

const CANOPY_API_KEY = process.env.CANOPY_API_KEY || "";
const CANOPY_AUTH_TOKEN = process.env.CANOPY_AUTH_TOKEN || "";

// Toggle between staging and production
const CANOPY_BASE_STG = "https://api.stg.canopy.rent/v2";
const CANOPY_BASE_PROD = "https://api.canopy.rent/v2";

export default async function handler(req, res) {
  const { action, clientId, referenceId, email, env } = req.query;

  // Use staging by default until production creds are ready
  const baseUrl = env === "prod" ? CANOPY_BASE_PROD : CANOPY_BASE_STG;

  // Use env-specific keys if provided, otherwise fall back to defaults
  const apiKey = req.headers["x-canopy-api-key"] || CANOPY_API_KEY;
  const authToken = req.headers["x-canopy-auth-token"] || CANOPY_AUTH_TOKEN;

  if (!clientId) {
    return res.status(400).json({ error: "Missing clientId parameter" });
  }

  const headers = {
    "x-api-key": apiKey,
    Authorization: authToken,
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  try {
    let targetUrl;
    let method = "GET";
    let body = undefined;

    switch (action) {
      // List all referencing requests for the client
      case "list": {
        targetUrl = `${baseUrl}/referencing-requests/client/${clientId}`;
        // Pass through any query params for pagination/filtering
        const params = new URLSearchParams();
        if (email) params.set("email", email);
        if (req.query.page) params.set("page", req.query.page);
        if (req.query.limit) params.set("limit", req.query.limit);
        const qs = params.toString();
        if (qs) targetUrl += `?${qs}`;
        break;
      }

      // Get a specific rent passport / reference result
      case "get": {
        if (!referenceId) {
          return res.status(400).json({ error: "Missing referenceId parameter" });
        }
        targetUrl = `${baseUrl}/referencing-requests/client/${clientId}/rent-passport/${referenceId}`;
        break;
      }

      // Search by email — convenience wrapper around list with email filter
      case "search": {
        if (!email) {
          return res.status(400).json({ error: "Missing email parameter for search" });
        }
        targetUrl = `${baseUrl}/referencing-requests/client/${clientId}?email=${encodeURIComponent(email)}`;
        break;
      }

      // Refresh the auth token
      case "refresh": {
        targetUrl = `${baseUrl}/referencing-requests/client/${clientId}/refresh`;
        method = "POST";
        body = JSON.stringify({});
        break;
      }

      // Discovery — hit a known endpoint to test connectivity
      case "test": {
        targetUrl = `${baseUrl}/referencing-requests/client/${clientId}`;
        break;
      }

      default:
        return res.status(400).json({
          error: `Unknown action: ${action}. Use: list, get, search, refresh, test`,
        });
    }

    const fetchOpts = { method, headers };
    if (body) fetchOpts.body = body;

    const canopyRes = await fetch(targetUrl, fetchOpts);
    const text = await canopyRes.text();

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { rawResponse: text };
    }

    if (!canopyRes.ok) {
      console.error(
        `Canopy ${canopyRes.status} for ${action} (${targetUrl}):`,
        JSON.stringify(data).slice(0, 500)
      );
    }

    return res.status(canopyRes.status).json(data);
  } catch (err) {
    console.error("Canopy proxy error:", err);
    return res.status(500).json({ error: "Proxy error: " + err.message });
  }
}
