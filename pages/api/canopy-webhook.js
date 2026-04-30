// pages/api/canopy-webhook.js
// Receives webhook POST events from Canopy when a referencing check changes status.
// Stores each check in Redis (KV_REDIS_URL) keyed by tenant email for fast lookup.
//
// POST /api/canopy-webhook  ← Canopy sends this
// GET  /api/canopy-webhook  → returns all stored Canopy checks (for dashboard)
//
// Redis key: "canopy_checks_v1" → JSON object { [email]: { signal, rawStatus, referenceId, name, updatedAt } }

const REDIS_KEY = "canopy_checks_v1";

// Map Canopy statuses to traffic-light signals
function mapSignal(rawStatus) {
  const s = (rawStatus || "").toUpperCase().trim();
  if (["ACCEPT", "ACCEPTED", "COMPLETE", "COMPLETED", "PASSED", "PASS", "APPROVED"].includes(s)) return "PASS";
  if (["HIGH RISK", "HIGH_RISK", "FAILED", "FAIL", "REJECTED", "DECLINED", "ADVERSE"].includes(s)) return "FAIL";
  if (["ACCEPT WITH CONSIDERATION", "ACCEPT_WITH_CONSIDERATION", "CONDITIONAL", "CONSIDER"].includes(s)) return "CONDITIONAL";
  if (["IN PROGRESS", "IN_PROGRESS", "PROCESSING", "AWAITING", "SUBMITTED", "STARTED"].includes(s)) return "PENDING";
  if (["NOT STARTED", "NOT_STARTED", "CREATED"].includes(s)) return "NOT_STARTED";
  return "UNKNOWN";
}

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
    return res.status(503).json({ error: "Redis not configured. Set KV_REDIS_URL." });
  }

  let client;
  try {
    client = await getClient();

    // ── GET: Return all stored Canopy checks for dashboard ──
    if (req.method === "GET") {
      const raw = await client.get(REDIS_KEY);
      const checks = raw ? JSON.parse(raw) : {};
      return res.status(200).json({
        ok: true,
        totalRecords: Object.keys(checks).length,
        byEmail: checks,
      });
    }

    // ── POST: Receive webhook from Canopy ──
    if (req.method === "POST") {
      const body = req.body || {};
      console.log("Canopy webhook received:", JSON.stringify(body).slice(0, 1000));

      // Extract tenant info — handle various possible shapes from Canopy
      // Could be a single event or array of events
      const events = Array.isArray(body) ? body : [body];

      // Load existing checks
      const raw = await client.get(REDIS_KEY);
      const checks = raw ? JSON.parse(raw) : {};

      let processed = 0;
      for (const event of events) {
        // Try to extract email from various possible field paths
        const email = (
          event.email || event.tenant_email || event.applicant_email ||
          event.tenantEmail || event.rentPassportTenantEmail ||
          (event.tenant && event.tenant.email) ||
          (event.applicant && event.applicant.email) ||
          (event.data && (event.data.email || event.data.tenant_email || event.data.tenantEmail)) ||
          (event.data && event.data.tenant && event.data.tenant.email) ||
          ""
        ).toLowerCase().trim();

        if (!email) {
          console.warn("Canopy webhook: no email found in event", JSON.stringify(event).slice(0, 300));
          continue;
        }

        // Extract status
        const rawStatus = (
          event.status || event.referencing_status || event.overallStatus ||
          event.rentPassportStatus || event.outcome ||
          (event.data && (event.data.status || event.data.referencing_status || event.data.overallStatus)) ||
          ""
        ).trim();

        // Extract reference ID
        const referenceId = (
          event.canopyReferenceId || event.reference_id || event.id ||
          (event.data && (event.data.canopyReferenceId || event.data.reference_id || event.data.id)) ||
          null
        );

        // Extract name
        const name = (
          event.tenant_name || event.applicant_name ||
          (event.tenant && `${event.tenant.firstName || ""} ${event.tenant.lastName || ""}`.trim()) ||
          (event.data && (event.data.tenant_name || event.data.applicant_name)) ||
          (event.data && event.data.tenant && `${event.data.tenant.firstName || ""} ${event.data.tenant.lastName || ""}`.trim()) ||
          ""
        );

        checks[email] = {
          signal: mapSignal(rawStatus),
          rawStatus,
          referenceId,
          name,
          email,
          updatedAt: new Date().toISOString(),
          webhookReceivedAt: new Date().toISOString(),
        };
        processed++;
      }

      await client.set(REDIS_KEY, JSON.stringify(checks));

      return res.status(200).json({
        ok: true,
        processed,
        totalStored: Object.keys(checks).length,
      });
    }

    // ── DELETE: Clear all stored checks (admin/reset) ──
    if (req.method === "DELETE") {
      await client.del(REDIS_KEY);
      return res.status(200).json({ ok: true, message: "All Canopy checks cleared." });
    }

    // ── PUT: Manually add/update a check (for testing or manual overrides) ──
    if (req.method === "PUT") {
      const { email, status, referenceId, name } = req.body || {};
      if (!email) return res.status(400).json({ error: "Missing email" });

      const raw = await client.get(REDIS_KEY);
      const checks = raw ? JSON.parse(raw) : {};

      checks[email.toLowerCase().trim()] = {
        signal: mapSignal(status || ""),
        rawStatus: status || "",
        referenceId: referenceId || null,
        name: name || "",
        email: email.toLowerCase().trim(),
        updatedAt: new Date().toISOString(),
        manualEntry: true,
      };

      await client.set(REDIS_KEY, JSON.stringify(checks));
      return res.status(200).json({ ok: true, totalStored: Object.keys(checks).length });
    }

    res.setHeader("Allow", "GET, POST, PUT, DELETE");
    return res.status(405).json({ error: "Method not allowed" });
  } catch (e) {
    console.error("Canopy webhook error:", e);
    return res.status(500).json({ error: e.message });
  } finally {
    if (client) {
      try { await client.quit(); } catch (_) {}
    }
  }
}
