// pages/api/renewal-state.js
// Persists renewal manual overrides (leaving/pending sets) in Redis.
// This ensures the data survives page refreshes and is shared across devices.
//
// GET  /api/renewal-state  → { leaving: [...], pending: [...] }
// POST /api/renewal-state  → body { leaving: [...], pending: [...] } → { ok: true }

const REDIS_KEY = "renewal_state_v1";

function kvAvailable() {
  return !!process.env.KV_REDIS_URL;
}

async function getClient() {
  const { createClient } = await import("redis");
  const client = createClient({ url: process.env.KV_REDIS_URL });
  client.on("error", (err) => console.error("Redis error", err));
  await client.connect();
  return client;
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (!kvAvailable()) {
    return res.status(200).json({
      kvConfigured: false,
      leaving: [],
      pending: [],
    });
  }

  let client;
  try {
    client = await getClient();

    if (req.method === "GET") {
      const raw = await client.get(REDIS_KEY);
      const data = raw ? JSON.parse(raw) : { leaving: [], pending: [] };
      return res.status(200).json({
        kvConfigured: true,
        leaving: data.leaving || [],
        pending: data.pending || [],
        leavingReasons: data.leavingReasons || {},
        customerRefs: data.customerRefs || {},
        earlyTerm: data.earlyTerm || [],
        updatedAt: data.updatedAt || null,
      });
    }

    if (req.method === "POST") {
      const body = req.body || {};
      // Merge: read existing state first so partial updates don't clobber other fields
      const existing = await client.get(REDIS_KEY);
      const prev = existing ? JSON.parse(existing) : {};
      const record = {
        leaving: Array.isArray(body.leaving) ? body.leaving : (prev.leaving || []),
        pending: Array.isArray(body.pending) ? body.pending : (prev.pending || []),
        leavingReasons: (body.leavingReasons && typeof body.leavingReasons === "object") ? body.leavingReasons : (prev.leavingReasons || {}),
        customerRefs: (body.customerRefs && typeof body.customerRefs === "object") ? body.customerRefs : (prev.customerRefs || {}),
        earlyTerm: Array.isArray(body.earlyTerm) ? body.earlyTerm : (prev.earlyTerm || []),
        updatedAt: new Date().toISOString(),
      };
      await client.set(REDIS_KEY, JSON.stringify(record));
      return res.status(200).json({ kvConfigured: true, ok: true, updatedAt: record.updatedAt });
    }

    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "Method not allowed" });
  } catch (e) {
    return res.status(500).json({ kvConfigured: true, error: e.message });
  } finally {
    if (client) {
      try { await client.quit(); } catch (_) {}
    }
  }
}
