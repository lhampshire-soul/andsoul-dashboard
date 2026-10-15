// pages/api/snapshot.js
// Server-side cached copy of the Res Harmonics dataset so the dashboard opens
// in seconds instead of re-pulling ~1,000 bookings + 300 room-stay details in
// every browser.
//
//   GET  /api/snapshot               → { ok, builtAt, ageMin, bookings, guestStays, units, details }
//   GET  /api/snapshot?action=status → { ok, builtAt, ageMin, building: {stage,...} }
//   POST /api/snapshot?action=build  → runs ONE bounded step of the builder and
//                                      returns { done, stage, progress }. Call it
//                                      repeatedly until done. Safe to call from
//                                      several browsers — a short Redis lock keeps
//                                      one step running at a time.
//
// The builder is incremental and saves progress to Redis after every page /
// batch, so it survives serverless time limits: a step does at most
// STEP_BUDGET_MS of work, then returns. A full rebuild is ~10 steps.

const RH_ID = process.env.RH_CLIENT_ID || "5n3lgu73rc3jqus4fur3c58fbb";
const RH_SECRET = process.env.RH_CLIENT_SECRET || "1bfob7es3ge16bmjs8t4i0ah2ica4t1ujt8aeqa4b3rs9cmsa7uh";
const RH_BASE = "https://apiv3.rerumapp.uk";

const LAV_KEY = process.env.LAVANDA_API_KEY || "75a866b799804d3baee167aa47644576";
const LAV_BASE = "https://lavanda.azure-api.net";
// Source of truth for long-stay data. Res Harmonics was switched off in Oct 2026
// and the tenancies migrated into Lavanda, so Lavanda is now the default.
const SOURCE = (process.env.SNAPSHOT_SOURCE || "lavanda").toLowerCase();

const KEY_DATA = "snapshot:rh:v1";
const KEY_BUILD = "snapshot:rh:v1:build";
const KEY_LOCK = "snapshot:rh:v1:lock";
const STEP_BUDGET_MS = +(process.env.SNAPSHOT_STEP_BUDGET_MS || 7000);
const PAGE_SIZE = 200;
const DETAIL_BATCH = 20;

export const config = { api: { responseLimit: false }, maxDuration: 60 };

async function redis() {
  if (!process.env.KV_REDIS_URL) throw new Error("KV_REDIS_URL not configured");
  const { createClient } = await import("redis");
  const c = createClient({ url: process.env.KV_REDIS_URL });
  c.on("error", (e) => console.error("Redis error", e.message));
  await c.connect();
  return c;
}

async function rhToken() {
  const r = await fetch("https://auth.rerumapp.uk/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "client_credentials", client_id: RH_ID, client_secret: RH_SECRET }),
  });
  const j = await r.json();
  if (!r.ok || !j.access_token) throw new Error(`RH auth ${r.status}`);
  return j.access_token;
}

async function rhGet(tok, path, tries = 3) {
  let last;
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(`${RH_BASE}${path}`, { headers: { Authorization: `Bearer ${tok}` } });
      if (!r.ok) throw new Error(`RH ${r.status} ${path}`);
      return await r.json();
    } catch (e) { last = e; await new Promise(res => setTimeout(res, 500 * (i + 1))); }
  }
  throw last;
}

// Stages, in order. Each list stage pages through one endpoint.
const STAGES = [
  { key: "bookings", path: "/api/v3/bookings" },
  { key: "pending", path: "/api/v3/bookings?statuses=PENDING" },
  { key: "guestStays", path: "/api/v3/guestStays" },
  { key: "units", path: "/api/v3/units" },
  { key: "details" },   // roomStay detail for active bookings (rates + status dates)
  { key: "finalize" },
];

async function lavGet(path, tries = 3) {
  let last;
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(`${LAV_BASE}${path}`, { headers: { "Ocp-Apim-Subscription-Key": LAV_KEY, Accept: "application/json" } });
      if (!r.ok) throw new Error(`Lavanda ${r.status} ${path}`);
      return await r.json();
    } catch (e) { last = e; await new Promise(res => setTimeout(res, 500 * (i + 1))); }
  }
  throw last;
}

// ── Lavanda → Res-Harmonics-shaped adapter ──────────────────────────────────
// computePmsMetrics (client) was written against RH's bookings / guestStays /
// units shapes. Rather than rewrite 1,000 lines of metrics, map Lavanda into
// the same shape. Only the fields the metrics read are populated.
const roomNoFromName = (n) => {
  const m = (n || "").match(/(\d{1,4}(?:\s*&\s*\d{1,4})?)\s*$/);
  return m ? m[1].replace(/\s+/g, "") : null;
};
const unitTypeFromName = (n) => {
  const s = n || "";
  if (/Nomad/i.test(s)) return "Nomad Ensuite";
  const m = s.match(/Southall-([A-Za-z]+)-/);
  if (!m) return "Other";
  const t = m[1];
  return ({ Deluxe: "Deluxe Studio", Spacious: "Spacious Studio", Roomy: "Roomy Studio", Cosy: "Cosy Studio", Snug: "Snug Studio", Nook: "Nook", Accessible: "Accessible Studio", Void: "Void" })[t] || t;
};
function adaptLavanda(rawBookings, rawProps, today) {
  const propById = {};
  rawProps.forEach(p => { propById[p.id] = p.attributes || {}; });
  // Units: every Southall record that resolves to a room number
  const units = rawProps
    .filter(p => /Southall/i.test(p.attributes?.name || "") && roomNoFromName(p.attributes?.name))
    .map(p => ({ id: p.id, unitName: `Room: ${roomNoFromName(p.attributes.name)}`, unitTypeName: unitTypeFromName(p.attributes.name), bookable: !/Void/i.test(p.attributes.name), buildingName: "Southall &Soul", _lavName: p.attributes.name }));
  const unitById = {}; units.forEach(u => { unitById[u.id] = u; });

  const bookings = [], guestStays = [], details = {};
  rawBookings.forEach(b => {
    const a = b.attributes || {};
    const st = (a.status || "").toLowerCase();
    if (st === "inquiry") return;
    const start = (a.start_date || "").slice(0, 10), end = (a.end_date || "").slice(0, 10);
    if (!start || !end) return;
    let status;
    if (st === "canceled" || a.canceled) status = "CANCELLED";
    else if (st === "tentative") status = "PENDING";
    else if (end <= today) status = "CHECKED_OUT";
    else if (start <= today) status = "CHECKED_IN";
    else status = "CONFIRMED";
    const unitId = b.relationships?.unit?.data?.id;
    const groupId = b.relationships?.property?.data?.id;
    const u = unitById[unitId];
    const groupName = propById[groupId]?.name || "";
    // Nomad units are the short-stay estate: they are already covered, with
    // their own occupancy / ADR / revenue, by the Lavanda short-stay feed.
    // Keeping them out here prevents the same booking appearing on both sides
    // (which would read as a double booking and inflate occupancy).
    if (/Nomad/i.test(groupName) || /Nomad/i.test(u?._lavName || "")) return;
    const unit = u ? { id: u.id, unitName: u.unitName, unitTypeName: u.unitTypeName, buildingName: "Southall &Soul" }
                   : { id: unitId || groupId, unitName: `Room: ${roomNoFromName(groupName) || "unassigned"}`, unitTypeName: unitTypeFromName(groupName), buildingName: "Southall &Soul" };
    const days = Math.max(0, Math.round((new Date(end) - new Date(start)) / 864e5));
    const gross = +a.total_cost || 0;
    const email = (a.lead_guest_email || "").toLowerCase().trim();
    const contactId = email || `${(a.lead_guest_first_name || "").toLowerCase()}|${(a.lead_guest_last_name || "").toLowerCase()}`;
    const rsId = a.booking_id || b.id;
    const bk = {
      bookingId: a.booking_id, roomStayId: rsId, bookingReference: a.confirmation_code || String(a.booking_id),
      roomStayStatus: status, startDate: start, endDate: end, unitId: unit.id, unit,
      // Lavanda exposes the gross total only — no VAT split. Net is shown as gross.
      netAmount: gross, vatAmount: 0, _grossOnly: true,
      bookingContact: { id: contactId, firstName: a.lead_guest_first_name || "", lastName: a.lead_guest_last_name || "", email },
      contactId, channelName: a.platform || "Direct booking", channelId: a.platform || "",
      bookingType: days >= 28 ? "LONG_STAY" : "SHORT_STAY", created: (a.booked_time || "").slice(0, 10), _source: "lavanda",
    };
    bookings.push(bk);
    if (status !== "CANCELLED") guestStays.push({ roomStayId: rsId, unitId: unit.id, dateFrom: start, dateTo: end, status, contactId, bookingReference: bk.bookingReference, unit, bookingContact: bk.bookingContact });
    if (days >= 28 && gross > 0) details[rsId] = { rateType: "MONTHLY", truePcm: Math.round(gross / days * 365 / 12), originalRate: null, rateName: "Lavanda total ÷ nights", rateCode: null,
      conversionDate: bk.created || null, confirmedDate: bk.created || null, contractSignedDate: null, lastStatusChangeDate: (a.last_modified || "").slice(0, 10) || null };
  });
  return { bookings, guestStays, units, details };
}

function freshBuild() {
  return { startedAt: new Date().toISOString(), stage: 0, page: 0, token: null, tokenAt: 0,
           bookings: [], pending: [], guestStays: [], units: [], details: {}, detailIdx: 0, detailTargets: null, log: [] };
}

async function runStepLavanda(client) {
  const t0 = Date.now();
  const budgetLeft = () => STEP_BUDGET_MS - (Date.now() - t0);
  let b = JSON.parse((await client.get(KEY_BUILD)) || "null");
  if (!b || b.source !== "lavanda") b = { source: "lavanda", startedAt: new Date().toISOString(), stage: "bookings", cursor: null, raw: [], props: [], log: [] };
  const save = () => client.set(KEY_BUILD, JSON.stringify(b), { EX: 60 * 60 });
  while (budgetLeft() > 1500) {
    if (b.stage === "bookings") {
      const r = await lavGet(`/bookings?page[size]=50${b.cursor ? `&page[after]=${encodeURIComponent(b.cursor)}` : ""}`);
      b.raw = b.raw.concat(r.data || []);
      b.cursor = r.meta?.page?.next || null;
      if (!b.cursor || b.raw.length > 20000) { b.log.push(`bookings: ${b.raw.length}`); b.stage = "props"; b.cursor = null; }
      await save(); continue;
    }
    if (b.stage === "props") {
      const r = await lavGet(`/properties?page[size]=100${b.cursor ? `&page[after]=${encodeURIComponent(b.cursor)}` : ""}`);
      b.props = b.props.concat(r.data || []);
      b.cursor = r.meta?.page?.next || null;
      if (!b.cursor) { b.log.push(`properties: ${b.props.length}`); b.stage = "finalize"; }
      await save(); continue;
    }
    if (b.stage === "finalize") {
      if (b.raw.length < 50 || b.props.length < 50) throw new Error(`Partial Lavanda data (bookings=${b.raw.length}, props=${b.props.length})`);
      const today = new Date().toISOString().slice(0, 10);
      const { bookings, guestStays, units, details } = adaptLavanda(b.raw, b.props, today);
      const snap = { ok: true, source: "lavanda", builtAt: new Date().toISOString(), startedAt: b.startedAt, log: [...b.log, `adapted: ${bookings.length} bookings, ${units.length} units`], bookings, guestStays, units, details };
      await client.set(KEY_DATA, JSON.stringify(snap));
      await client.del(KEY_BUILD);
      return { done: true, source: "lavanda", stage: "finalize", builtAt: snap.builtAt, log: snap.log, ms: Date.now() - t0 };
    }
  }
  return { done: false, source: "lavanda", stage: b.stage, progress: `${b.raw.length} bookings / ${b.props.length} props`, ms: Date.now() - t0 };
}

async function runStep(client) {
  if (SOURCE === "lavanda") return runStepLavanda(client);
  const t0 = Date.now();
  const budgetLeft = () => STEP_BUDGET_MS - (Date.now() - t0);
  let b = JSON.parse((await client.get(KEY_BUILD)) || "null") || freshBuild();

  // Token (refresh if older than 50 min)
  if (!b.token || Date.now() - b.tokenAt > 50 * 60 * 1000) { b.token = await rhToken(); b.tokenAt = Date.now(); }
  const tok = b.token;
  const save = () => client.set(KEY_BUILD, JSON.stringify(b), { EX: 60 * 60 });

  while (budgetLeft() > 1500 && b.stage < STAGES.length) {
    const st = STAGES[b.stage];

    if (st.path) {
      const sep = st.path.includes("?") ? "&" : "?";
      const data = await rhGet(tok, `${st.path}${sep}page=${b.page}&size=${PAGE_SIZE}`);
      const content = data.content ?? [];
      b[st.key] = b[st.key].concat(content);
      const totalPages = data.page?.totalPages ?? 1;
      b.page++;
      if (b.page >= totalPages || content.length === 0 || b.page > 60) { b.log.push(`${st.key}: ${b[st.key].length}`); b.stage++; b.page = 0; }
      await save();
      continue;
    }

    if (st.key === "details") {
      if (!b.detailTargets) {
        // Merge pending into bookings (RH list excludes PENDING by default)
        const pendingRefs = new Set(b.pending.map(x => `${x.bookingReference}-${x.roomStayId}`));
        b.bookings = [...b.bookings.filter(x => !pendingRefs.has(`${x.bookingReference}-${x.roomStayId}`)), ...b.pending];
        b.pending = [];
        if (b.bookings.length < 50 || b.guestStays.length < 50) throw new Error(`Partial data (bookings=${b.bookings.length}, stays=${b.guestStays.length})`);
        b.detailTargets = [...new Set(b.bookings
          .filter(x => ["CHECKED_IN", "CONFIRMED", "PENDING"].includes((x.roomStayStatus || "").toUpperCase()) && x.roomStayId)
          .map(x => x.roomStayId))];
        b.detailIdx = 0;
        await save();
      }
      while (b.detailIdx < b.detailTargets.length && budgetLeft() > 1500) {
        const batch = b.detailTargets.slice(b.detailIdx, b.detailIdx + DETAIL_BATCH);
        await Promise.all(batch.map(async (id) => {
          try {
            const d = await rhGet(tok, `/api/v3/roomStays/${id}`, 2);
            if (!d || d.error) return;
            b.details[id] = {
              rateType: d.rate?.rateType ?? null,
              truePcm: d.discountDailyRate ?? d.originalRate ?? null,
              originalRate: d.originalRate ?? null,
              rateName: d.rate?.name ?? null,
              rateCode: d.rate?.rateCode ?? null,
              conversionDate: d.conversionDate ? d.conversionDate.slice(0, 10) : null,
              confirmedDate: d.confirmedDate ? d.confirmedDate.slice(0, 10) : null,
              contractSignedDate: d.contractSignedDate ? d.contractSignedDate.slice(0, 10) : null,
              lastStatusChangeDate: d.lastStatusChangeDate ? d.lastStatusChangeDate.slice(0, 10) : null,
            };
          } catch {}
        }));
        b.detailIdx += batch.length;
        await save();
      }
      if (b.detailIdx >= b.detailTargets.length) { b.log.push(`details: ${Object.keys(b.details).length}/${b.detailTargets.length}`); b.stage++; await save(); }
      continue;
    }

    if (st.key === "finalize") {
      const snap = { ok: true, builtAt: new Date().toISOString(), startedAt: b.startedAt, log: b.log,
                     bookings: b.bookings, guestStays: b.guestStays, units: b.units, details: b.details };
      await client.set(KEY_DATA, JSON.stringify(snap));
      await client.del(KEY_BUILD);
      return { done: true, stage: "finalize", builtAt: snap.builtAt, log: b.log, ms: Date.now() - t0 };
    }
  }

  const stage = STAGES[b.stage]?.key || "done";
  const progress = stage === "details" && b.detailTargets ? `${b.detailIdx}/${b.detailTargets.length}` : `page ${b.page}`;
  return { done: false, stage, progress, counts: { bookings: b.bookings.length, guestStays: b.guestStays.length, units: b.units.length }, ms: Date.now() - t0 };
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  const action = req.query.action || "get";
  let client;
  try {
    client = await redis();

    if (action === "build") {
      // One step at a time across all callers
      const got = await client.set(KEY_LOCK, String(Date.now()), { NX: true, PX: STEP_BUDGET_MS + 15000 });
      if (!got) return res.status(200).json({ done: false, stage: "locked", note: "another step is running" });
      try {
        const out = await runStep(client);
        return res.status(200).json(out);
      } catch (e) {
        // Abandon a broken build so the next call starts clean
        await client.del(KEY_BUILD);
        return res.status(200).json({ done: false, stage: "error", error: e.message });
      } finally { await client.del(KEY_LOCK); }
    }

    const raw = await client.get(KEY_DATA);
    if (!raw) {
      const building = JSON.parse((await client.get(KEY_BUILD)) || "null");
      return res.status(200).json({ ok: false, reason: "no snapshot yet", building: building ? { stage: STAGES[building.stage]?.key, page: building.page, detailIdx: building.detailIdx } : null });
    }
    if (action === "status") {
      const s = JSON.parse(raw);
      const building = JSON.parse((await client.get(KEY_BUILD)) || "null");
      return res.status(200).json({ ok: true, source: s.source || "rh", builtAt: s.builtAt, ageMin: Math.round((Date.now() - new Date(s.builtAt)) / 60000),
        counts: { bookings: s.bookings.length, guestStays: s.guestStays.length, units: s.units.length, details: Object.keys(s.details).length },
        building: building ? { stage: STAGES[building.stage]?.key, page: building.page, detailIdx: building.detailIdx } : null });
    }
    res.setHeader("Content-Type", "application/json");
    return res.status(200).send(raw);
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message });
  } finally {
    try { if (client) await client.quit(); } catch {}
  }
}
