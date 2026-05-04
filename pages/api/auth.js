// pages/api/auth.js
// Handles dashboard authentication.
//
// POST /api/auth  { password } → sets httpOnly cookie, returns { ok: true }
// DELETE /api/auth              → clears cookie (logout)
// GET /api/auth                 → returns { authenticated: true/false }
//
// Password is checked against DASHBOARD_PASSWORD env var.
// Session token is an HMAC-SHA256 of the password + a secret salt.

import crypto from "crypto";

const COOKIE_NAME = "andsoul_session";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function getPassword() {
  return process.env.DASHBOARD_PASSWORD || "";
}

function getSessionToken() {
  const pw = getPassword();
  if (!pw) return null;
  // Create a deterministic token from the password so we can verify it later
  const salt = process.env.DASHBOARD_SECRET || "andsoul-dashboard-v1";
  return crypto.createHmac("sha256", salt).update(pw).digest("hex");
}

function isAuthenticated(req) {
  const token = getSessionToken();
  if (!token) return true; // No password set = open access (backward compat)
  const cookie = parseCookie(req.headers.cookie || "");
  return cookie[COOKIE_NAME] === token;
}

function parseCookie(cookieStr) {
  const result = {};
  cookieStr.split(";").forEach((pair) => {
    const [key, ...val] = pair.trim().split("=");
    if (key) result[key] = decodeURIComponent(val.join("="));
  });
  return result;
}

export { isAuthenticated };

export default async function handler(req, res) {
  // GET: Check auth status
  if (req.method === "GET") {
    return res.status(200).json({ authenticated: isAuthenticated(req) });
  }

  // DELETE: Logout
  if (req.method === "DELETE") {
    res.setHeader(
      "Set-Cookie",
      `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0; Secure`
    );
    return res.status(200).json({ ok: true, loggedOut: true });
  }

  // POST: Login
  if (req.method === "POST") {
    const { password } = req.body || {};
    const correctPassword = getPassword();

    if (!correctPassword) {
      return res.status(200).json({ ok: true, message: "No password configured" });
    }

    // Constant-time comparison to prevent timing attacks
    const inputBuf = Buffer.from(String(password || ""));
    const correctBuf = Buffer.from(correctPassword);

    if (inputBuf.length !== correctBuf.length || !crypto.timingSafeEqual(inputBuf, correctBuf)) {
      // Rate limit: small delay on wrong password
      await new Promise((r) => setTimeout(r, 1000));
      return res.status(401).json({ error: "Incorrect password" });
    }

    const token = getSessionToken();
    res.setHeader(
      "Set-Cookie",
      `${COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${MAX_AGE}; Secure`
    );
    return res.status(200).json({ ok: true });
  }

  res.setHeader("Allow", "GET, POST, DELETE");
  return res.status(405).json({ error: "Method not allowed" });
}
