// pages/api/canopy.js
// Server-side proxy for Canopy Referencing API.
//
// Auth flow (per Canopy docs):
//   1. POST /referencing-requests/client/:clientId/token  (x-api-key + secretKey → access token)
//   2. Use Bearer <token> for all subsequent calls
//
// Actions:
//   token    — POST to get an access token (returns JWT)
//   list     — GET /referencing-requests/client/:clientId  (list all references)
//   get      — GET /referencing-requests/client/:clientId/rent-passport/:referenceId
//   search   — GET /referencing-requests/client/:clientId?email=...
//   create   — POST /referencing-requests/client/:clientId  (create a new referencing request)
//   test     — GET connectivity test
//
// Env vars:
//   CANOPY_API_KEY      — x-api-key header value
//   CANOPY_SECRET_KEY   — secret used in token exchange
//   CANOPY_CLIENT_ID    — default clientId (can be overridden via query param)

const CANOPY_API_KEY = process.env.CANOPY_API_KEY || "";
const CANOPY_SECRET_KEY = process.env.CANOPY_SECRET_KEY || "";
const CANOPY_CLIENT_ID = process.env.CANOPY_CLIENT_ID || "";

// Toggle between staging and production
const CANOPY_BASE_STG = "https://api.stg.canopy.rent/v2";
const CANOPY_BASE_PROD = "https://api.canopy.rent/v2";

// In-memory token cache (per serverless instance)
let cachedToken = null;
let tokenExpiry = 0;

async function getAccessToken(baseUrl, clientId, apiKey, secretKey) {
  // Return cached token if still valid (with 60s buffer)
  if (cachedToken && Date.now() < tokenExpiry - 60000) {
    return cachedToken;
  }

  // Step 1: Generate a JWT signed with the secretKey (per Canopy docs)
  const jwt = require("jsonwebtoken");
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: "canopy.rent",
    scope: "request.write_only document.read_only",
    aud: clientId,
    iat: now,
    exp: now + 300, // 5 min expiry
  };
  const signedJwt = jwt.sign(payload, secretKey, { algorithm: "HS256" });

  // Step 2: Exchange the signed JWT for an access token
  const tokenUrl = `${baseUrl}/referencing-requests/client/${clientId}/token`;
  const tokenRes = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ jwtKey: signedJwt }),
  });

  const tokenText = await tokenRes.text();
  let tokenData;
  try {
    tokenData = JSON.parse(tokenText);
  } catch {
    throw new Error(`Token exchange failed (${tokenRes.status}): ${tokenText.slice(0, 300)}`);
  }

  if (!tokenRes.ok) {
    throw new Error(`Token exchange failed (${tokenRes.status}): ${JSON.stringify(tokenData).slice(0, 300)}`);
  }

  // The token might be in various fields depending on Canopy's response shape
  let token = tokenData.token || tokenData.access_token || tokenData.accessToken || tokenData.jwt;
  if (!token) {
    // Return the full response so we can see the actual shape
    throw new Error(`No token in response. Keys: ${Object.keys(tokenData).join(", ")}. Full: ${JSON.stringify(tokenData).slice(0, 500)}`);
  }

  // Strip "Bearer " prefix if present — we add it ourselves in the Authorization header
  if (typeof token === "string" && token.startsWith("Bearer ")) {
    token = token.slice(7);
  }

  cachedToken = token;
  // Default 1 hour expiry if not specified
  const expiresIn = tokenData.expiresIn || tokenData.expires_in || 3600;
  tokenExpiry = Date.now() + expiresIn * 1000;

  return token;
}

export default async function handler(req, res) {
  const { action, referenceId, email, env } = req.query;
  const clientId = req.query.clientId || CANOPY_CLIENT_ID;

  // Use staging by default until production creds are ready
  const baseUrl = env === "prod" ? CANOPY_BASE_PROD : CANOPY_BASE_STG;
  const apiKey = CANOPY_API_KEY;
  const secretKey = CANOPY_SECRET_KEY;

  if (!clientId) {
    return res.status(400).json({ error: "Missing clientId. Set CANOPY_CLIENT_ID env var or pass ?clientId=..." });
  }

  if (!apiKey) {
    return res.status(500).json({ error: "CANOPY_API_KEY not configured" });
  }

  try {
    // ── Token action: return full token response for debugging ──
    if (action === "token") {
      if (!secretKey) {
        return res.status(500).json({ error: "CANOPY_SECRET_KEY not configured" });
      }
      // Get raw response from token endpoint
      const jwt = require("jsonwebtoken");
      const now = Math.floor(Date.now() / 1000);
      const payload = { iss: "canopy.rent", scope: "request.write_only document.read_only", aud: clientId, iat: now, exp: now + 300 };
      const signedJwt = jwt.sign(payload, secretKey, { algorithm: "HS256" });
      const tokenUrl = `${baseUrl}/referencing-requests/client/${clientId}/token`;
      const tokenRes = await fetch(tokenUrl, {
        method: "POST",
        headers: { "x-api-key": apiKey, "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ jwtKey: signedJwt }),
      });
      const txt = await tokenRes.text();
      return res.status(200).json({ status: tokenRes.status, rawResponse: txt.slice(0, 1000), responseHeaders: Object.fromEntries(tokenRes.headers) });
    }

    // ── Debug action: try different auth patterns with the access token ──
    if (action === "debug") {
      const accessToken = await getAccessToken(baseUrl, clientId, apiKey, secretKey);
      const base = `${baseUrl}/referencing-requests/client/${clientId}`;
      const results = [];

      const authHeaders = { "x-api-key": apiKey, Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json", Accept: "application/json" };

      // Try POST endpoints (POST works for /token, so try creating a reference)
      const variants = [
        // POST to create a referencing request (Joab says this is the way to test)
        { name: "POST-create-ref", method: "POST", url: `${base}/referencing-request`, headers: authHeaders, body: JSON.stringify({ email: "test@andsoul.com" }) },
        { name: "POST-create-ref-v2", method: "POST", url: `${base}`, headers: authHeaders, body: JSON.stringify({ email: "test@andsoul.com" }) },
        // Try GET on rent-passport path
        { name: "GET-rent-passport-list", method: "GET", url: `${base}/rent-passport`, headers: authHeaders },
        // Try v1 POST
        { name: "POST-v1-create", method: "POST", url: `https://api.stg.canopy.rent/v1/referencing-requests/client/${clientId}/referencing-request`, headers: authHeaders, body: JSON.stringify({ email: "test@andsoul.com" }) },
        // Try GET with POST method (some APIs do this)
        { name: "POST-list", method: "POST", url: `${base}/list`, headers: authHeaders, body: JSON.stringify({}) },
      ];

      for (const v of variants) {
        try {
          const opts = { method: v.method, headers: v.headers };
          if (v.body) opts.body = v.body;
          const r = await fetch(v.url, opts);
          const txt = await r.text();
          results.push({ format: v.name, status: r.status, response: txt.slice(0, 500) });
          if (r.ok) break;
        } catch (e) { results.push({ format: v.name, error: e.message }); }
      }

      return res.status(200).json({ tokenPreview: accessToken.slice(0, 30) + "...", results });
    }

    // For all other actions, get an access token first
    if (!secretKey) {
      return res.status(500).json({ error: "CANOPY_SECRET_KEY not configured" });
    }

    const accessToken = await getAccessToken(baseUrl, clientId, apiKey, secretKey);

    const headers = {
      "x-api-key": apiKey,
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    };

    let targetUrl;
    let method = "GET";
    let body = undefined;

    switch (action) {
      // List all referencing requests for the client
      case "list": {
        targetUrl = `${baseUrl}/referencing-requests/client/${clientId}`;
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

      // Search by email
      case "search": {
        if (!email) {
          return res.status(400).json({ error: "Missing email parameter for search" });
        }
        targetUrl = `${baseUrl}/referencing-requests/client/${clientId}?email=${encodeURIComponent(email)}`;
        break;
      }

      // Create a new referencing request (for staging testing)
      case "create": {
        if (req.method !== "POST") {
          return res.status(405).json({ error: "Use POST for create action" });
        }
        targetUrl = `${baseUrl}/referencing-requests/client/${clientId}`;
        method = "POST";
        body = JSON.stringify(req.body || {});
        break;
      }

      // Connectivity test — try to list references
      case "test": {
        targetUrl = `${baseUrl}/referencing-requests/client/${clientId}`;
        break;
      }

      default:
        return res.status(400).json({
          error: `Unknown action: ${action}. Use: token, list, get, search, create, test`,
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
      // If 401/403, clear cached token so next request re-authenticates
      if (canopyRes.status === 401 || canopyRes.status === 403) {
        cachedToken = null;
        tokenExpiry = 0;
      }
    }

    return res.status(canopyRes.status).json(data);
  } catch (err) {
    console.error("Canopy proxy error:", err);
    // Clear token cache on auth errors
    cachedToken = null;
    tokenExpiry = 0;
    return res.status(500).json({ error: "Proxy error: " + err.message });
  }
}
