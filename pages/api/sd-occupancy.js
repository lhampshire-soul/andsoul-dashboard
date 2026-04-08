// Shared Shoreditch occupancy state — persisted in Vercel KV for multi-device sync.
//
// GET  /api/sd-occupancy        → { flats: [...], updatedAt, updatedBy }
// POST /api/sd-occupancy        → body { flats: [...], updatedBy? } → { ok: true, updatedAt }
//
// If Vercel KV is not provisioned (env vars missing) the route returns a
// { kvConfigured: false } flag so the client can fall back to localStorage.

const KEY = "sd_flats_v1";

function kvAvailable() {
  return !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

async function loadKv() {
  // Dynamic import so a missing package doesn't blow up the whole build
  try {
    const mod = await import("@vercel/kv");
    return mod.kv;
  } catch (e) {
    return null;
  }
}

export default async function handler(req, res) {
  // CORS-friendly for the same-origin dashboard
  res.setHeader("Cache-Control", "no-store");

  if (!kvAvailable()) {
    return res.status(200).json({
      kvConfigured: false,
      message: "Vercel KV not provisioned. Set KV_REST_API_URL and KV_REST_API_TOKEN.",
    });
  }

  const kv = await loadKv();
  if (!kv) {
    return res.status(500).json({ kvConfigured: true, error: "@vercel/kv package not installed" });
  }

  try {
    if (req.method === "GET") {
      const data = await kv.get(KEY);
      return res.status(200).json({
        kvConfigured: true,
        flats: data?.flats || null,
        updatedAt: data?.updatedAt || null,
        updatedBy: data?.updatedBy || null,
      });
    }

    if (req.method === "POST") {
      const body = req.body || {};
      const flats = body.flats;
      const updatedBy = body.updatedBy || "unknown";

      // Validate payload shape
      if (!Array.isArray(flats) || flats.length === 0 || !flats[0]?.rooms) {
        return res.status(400).json({ error: "Invalid payload: expected { flats: [{name, rooms: [...]}] }" });
      }

      const record = {
        flats,
        updatedAt: new Date().toISOString(),
        updatedBy,
      };
      await kv.set(KEY, record);
      return res.status(200).json({ kvConfigured: true, ok: true, updatedAt: record.updatedAt });
    }

    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "Method not allowed" });
  } catch (e) {
    return res.status(500).json({ kvConfigured: true, error: e.message });
  }
}
