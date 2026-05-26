// pages/api/leads.js
// Stores / retrieves parsed lead data in Redis.
// GET  /api/leads  → { leads: [...], updatedAt }
// POST /api/leads  → body { leads: [...] } → { ok, count, updatedAt }

const REDIS_KEY = "leads_data_v1";

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
    return res.status(200).json({ kvConfigured: false, leads: [], updatedAt: null });
  }

  let client;
  try {
    client = await getClient();

    if (req.method === "GET") {
      const raw = await client.get(REDIS_KEY);
      const data = raw ? JSON.parse(raw) : { leads: [], updatedAt: null };
      return res.status(200).json({
        kvConfigured: true,
        leads: data.leads || [],
        updatedAt: data.updatedAt || null,
      });
    }

    if (req.method === "POST") {
      const body = req.body || {};
      const leads = Array.isArray(body.leads) ? body.leads : [];
      // Merge mode: if body.merge is true, append to existing (dedup by email+date)
      let finalLeads = leads;
      if (body.merge) {
        const existing = await client.get(REDIS_KEY);
        const prev = existing ? JSON.parse(existing) : { leads: [] };
        const existingLeads = prev.leads || [];
        const seen = new Set(existingLeads.map(l => `${l.email}|${l.date}`));
        const newOnly = leads.filter(l => !seen.has(`${l.email}|${l.date}`));
        finalLeads = [...existingLeads, ...newOnly];
      }
      const record = {
        leads: finalLeads,
        updatedAt: new Date().toISOString(),
      };
      await client.set(REDIS_KEY, JSON.stringify(record));
      return res.status(200).json({
        kvConfigured: true,
        ok: true,
        count: finalLeads.length,
        updatedAt: record.updatedAt,
      });
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

// Increase body size limit for large lead datasets
export const config = {
  api: { bodyParser: { sizeLimit: "4mb" } },
};
