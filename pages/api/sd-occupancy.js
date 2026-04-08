// Shared Shoreditch occupancy state — persisted in Vercel Marketplace Redis.
//
// GET  /api/sd-occupancy        → { flats: [...], updatedAt, updatedBy }
// POST /api/sd-occupancy        → body { flats: [...], updatedBy? } → { ok: true, updatedAt }
//
// Uses the standard `redis` client with KV_REDIS_URL (TCP connection URL
// provided by the new Vercel Marketplace Redis integration). Falls back to
// { kvConfigured: false } if the env var is missing so the client can use
// localStorage only.

const KEY = "sd_flats_v1";

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
      message: "Redis not provisioned. Set KV_REDIS_URL.",
    });
  }

  let client;
  try {
    client = await getClient();

    if (req.method === "GET") {
      const raw = await client.get(KEY);
      const data = raw ? JSON.parse(raw) : null;
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
      await client.set(KEY, JSON.stringify(record));
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
