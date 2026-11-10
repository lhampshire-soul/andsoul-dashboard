// pages/api/offline-rooms.js — editable offline-room list per property (Redis).
//   GET  /api/offline-rooms?property=southall → { rooms: [{ room, reason }] | null, updatedAt }
//   POST /api/offline-rooms?property=southall  body { rooms: [{ room, reason }] } → { ok, updatedAt }
// null means "never edited" — the dashboard then falls back to the built-in register.
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  const prop = ["southall", "shoreditch"].includes(req.query.property) ? req.query.property : "southall";
  if (!process.env.KV_REDIS_URL) return res.status(200).json({ rooms: null, kvConfigured: false });
  const { createClient } = await import("redis");
  const c = createClient({ url: process.env.KV_REDIS_URL });
  c.on("error", () => {});
  await c.connect();
  const KEY = `offline_rooms_v1:${prop}`;
  try {
    if (req.method === "POST") {
      const rooms = Array.isArray(req.body?.rooms) ? req.body.rooms : null;
      if (!rooms) return res.status(400).json({ error: "rooms[] required" });
      const clean = rooms.map((r) => ({ room: String(r.room || "").trim(), reason: String(r.reason || "").trim().slice(0, 80) })).filter((r) => r.room).slice(0, 100);
      const rec = { rooms: clean, updatedAt: new Date().toISOString() };
      await c.set(KEY, JSON.stringify(rec));
      return res.status(200).json({ ok: true, ...rec });
    }
    const raw = await c.get(KEY);
    return res.status(200).json(raw ? JSON.parse(raw) : { rooms: null, updatedAt: null });
  } catch (e) { return res.status(500).json({ error: e.message }); }
  finally { try { await c.quit(); } catch {} }
}
