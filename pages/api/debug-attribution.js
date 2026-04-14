// pages/api/debug-attribution.js
// Diagnostic: inspect how GHL attributes lead source on recent Southall contacts,
// and peek at RH contract/booking shape so we can plan the cost-per-booking join.

const GHL_API_KEY = process.env.GHL_API_KEY || "pit-da675da7-68cd-4c4e-8693-c490f7f86f04";
const GHL_BASE    = "https://services.leadconnectorhq.com";
const GHL_LOCATION = "PwquLuIhIjj0D80e6jLU"; // same as dashboard

// Res Harmonics creds (client-side today — we can move to env later)
const RH_CLIENT_ID     = process.env.RH_CLIENT_ID     || "";
const RH_CLIENT_SECRET = process.env.RH_CLIENT_SECRET || "";

async function ghl(path) {
  const r = await fetch(`${GHL_BASE}${path}`, {
    headers: {
      Authorization: `Bearer ${GHL_API_KEY}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      Version: "2021-07-28",
    },
  });
  const text = await r.text();
  let j; try { j = JSON.parse(text); } catch { j = { raw: text.slice(0, 400) }; }
  return { ok: r.ok, status: r.status, json: j };
}

async function rhToken() {
  if (!RH_CLIENT_ID || !RH_CLIENT_SECRET) return null;
  const r = await fetch("https://auth.rerumapp.uk/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: RH_CLIENT_ID,
      client_secret: RH_CLIENT_SECRET,
    }),
  });
  const j = await r.json().catch(() => ({}));
  return j.access_token || null;
}

async function rh(path, token) {
  const r = await fetch(`https://apiv3.rerumapp.uk${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const text = await r.text();
  let j; try { j = JSON.parse(text); } catch { j = { raw: text.slice(0, 400) }; }
  return { ok: r.ok, status: r.status, json: j };
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  const out = { ghl: {}, rh: {} };

  // ── 1) GHL: find Southall pipeline ────────────────────────────────────────
  const pipes = await ghl(`/opportunities/pipelines?locationId=${GHL_LOCATION}`);
  out.ghl.pipelinesStatus = pipes.status;
  const pipelines = pipes.json?.pipelines ?? [];
  const southall = pipelines.find(p => (p.name || "").toLowerCase().includes("southall"));
  out.ghl.southallPipeline = southall ? { id: southall.id, name: southall.name, stages: (southall.stages || []).map(s => s.name) } : null;

  if (southall) {
    // ── 2) Pull 20 most recent opportunities ──────────────────────────────
    const q = new URLSearchParams({
      location_id: GHL_LOCATION,
      pipeline_id: southall.id,
      limit: "20",
    });
    const opps = await ghl(`/opportunities/search?${q}`);
    out.ghl.oppSearchStatus = opps.status;
    const oppList = opps.json?.opportunities ?? [];
    out.ghl.oppCount = oppList.length;
    out.ghl.oppKeys = oppList[0] ? Object.keys(oppList[0]) : [];

    // ── 3) For up to 5 opps, fetch contact detail and report source-ish fields
    const sample = oppList.slice(0, 5);
    const contactSamples = [];
    for (const o of sample) {
      const cid = o.contactId || o.contact?.id;
      if (!cid) continue;
      const cDet = await ghl(`/contacts/${cid}`);
      const c = cDet.json?.contact || cDet.json || {};

      contactSamples.push({
        oppId: o.id,
        oppName: o.name,
        oppStage: o.pipelineStageId,
        oppStatus: o.status,
        oppCreated: o.createdAt || o.dateAdded,
        oppUpdated: o.updatedAt || o.lastStatusChangeAt,
        oppTags: o.tags,
        contactId: cid,
        contactKeys: Object.keys(c),
        // the fields we CARE about for attribution
        source: c.source,
        attributionSource: c.attributionSource,
        lastAttributionSource: c.lastAttributionSource,
        attributions: c.attributions, // GHL v2 exposes an attributions array
        customFields: c.customFields,
        tags: c.tags,
        email: c.email,
        phone: c.phone,
        dateAdded: c.dateAdded,
      });
    }
    out.ghl.contactSamples = contactSamples;

    // ── 4) Summary: how many of the recent contacts have a usable source ──
    const has = (v) => v && (typeof v === "string" ? v.trim() : true);
    out.ghl.sourceCoverage = {
      total: contactSamples.length,
      withSource: contactSamples.filter(s => has(s.source)).length,
      withAttributionSource: contactSamples.filter(s => has(s.attributionSource)).length,
      withAttributions: contactSamples.filter(s => Array.isArray(s.attributions) && s.attributions.length).length,
      withLastAttribution: contactSamples.filter(s => has(s.lastAttributionSource)).length,
    };
  }

  // ── 5) RH: pending contracts/bookings shape ────────────────────────────────
  const token = await rhToken();
  out.rh.authed = !!token;
  if (token) {
    // Try the contracts endpoint — RH uses /api/v3/contracts for bookings
    const c = await rh("/api/v3/contracts?limit=5", token);
    out.rh.contractsStatus = c.status;
    const rows = c.json?.data || c.json?.results || c.json?.items || (Array.isArray(c.json) ? c.json : []);
    out.rh.contractCount = Array.isArray(rows) ? rows.length : 0;
    out.rh.contractKeys = rows[0] ? Object.keys(rows[0]) : [];
    out.rh.contractSample = rows[0] || null;

    // Also try bookings endpoint just in case
    const b = await rh("/api/v3/bookings?limit=5", token);
    out.rh.bookingsStatus = b.status;
    const brows = b.json?.data || b.json?.results || b.json?.items || (Array.isArray(b.json) ? b.json : []);
    out.rh.bookingCount = Array.isArray(brows) ? brows.length : 0;
    out.rh.bookingKeys = brows[0] ? Object.keys(brows[0]) : [];
    out.rh.bookingSample = brows[0] || null;
  } else {
    out.rh.note = "RH client_id/secret not in Vercel env — will need to add RH_CLIENT_ID + RH_CLIENT_SECRET to hit RH server-side.";
  }

  return res.status(200).json(out);
}
