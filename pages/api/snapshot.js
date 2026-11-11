// pages/api/snapshot.js
// Server-side cached copy of the Lavanda dataset (all Southall bookings +
// units), adapted into the shape the dashboard metrics read.
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


const LAV_KEY = process.env.LAVANDA_API_KEY || "75a866b799804d3baee167aa47644576";
const LAV_BASE = "https://lavanda.azure-api.net";
// Lavanda is the only PMS (Res Harmonics was retired in October 2026).

// One Lavanda account per property. Southall keeps its original Redis key so
// existing data carries over; Shoreditch gets its own.
const PROPS = {
  southall:   { lavKey: LAV_KEY, data: "snapshot:rh:v1", min: 50 },
  shoreditch: { lavKey: process.env.LAVANDA_API_KEY_SHOREDITCH || "6a13b2ba0b8544eda849bfebbac0fce8", data: "snapshot:sd:v1", min: 5 },
};
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



async function lavGet(path, key = LAV_KEY, tries = 3) {
  let last;
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(`${LAV_BASE}${path}`, { headers: { "Ocp-Apim-Subscription-Key": key, Accept: "application/json" } });
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
  // Map Lavanda unit names onto the dashboard's room-type vocabulary
  // (ROOM_TYPES in index.js): Ensuite, Nook, Snug, Snug plus, Cosy, Roomy,
  // Spacious, Deluxe, Deluxe Accessible, Deluxe Duo.
  const s = n || "";
  if (/Nomad/i.test(s)) return "Ensuite";
  if (/2-?Bed/i.test(s)) return "Deluxe Duo";
  const m = s.match(/Southall-([A-Za-z]+)-/);
  if (!m) return "Other";
  const t = m[1];
  return ({ Deluxe: "Deluxe", Spacious: "Spacious", Roomy: "Roomy", Cosy: "Cosy", Snug: "Snug", Nook: "Nook", Accessible: "Deluxe Accessible", Void: "Void" })[t] || t;
};
function adaptLavanda(rawBookings, rawProps, today) {
  const propById = {};
  rawProps.forEach(p => { propById[p.id] = p.attributes || {}; });
  // Units: every Southall record that resolves to a room number
  const units = rawProps
    // "Void" records are placeholders, not bedrooms — leaving them in inflates
    // the building total (and therefore usable rooms) by 3.
    .filter(p => /Southall/i.test(p.attributes?.name || "") && !/DO NOT USE|Void/i.test(p.attributes?.name || "") && roomNoFromName(p.attributes?.name))
    .map(p => ({ id: p.id, unitName: `Room: ${roomNoFromName(p.attributes.name)}`, unitTypeName: unitTypeFromName(p.attributes.name), bookable: !/Void/i.test(p.attributes.name), buildingName: "Southall &Soul", _lavName: p.attributes.name }));
  const unitById = {}; units.forEach(u => { unitById[u.id] = u; });

  const bookings = [], guestStays = [], details = {};
  // `sales`: every Southall booking record (long-stay AND Nomad, every status,
  // including enquiries and expired holds) in a compact form, for the simple
  // dashboard's Sales and Snapshot views. Additive — nothing above reads it.
  const sales = [];
  const allUnitById = {};
  rawProps.filter(p => /Southall/i.test(p.attributes?.name || "") && !/DO NOT USE|Void/i.test(p.attributes?.name || "") && roomNoFromName(p.attributes?.name))
    .forEach(p => { allUnitById[p.id] = { room: roomNoFromName(p.attributes.name), type: /Nomad/i.test(p.attributes.name) ? "Nomad" : unitTypeFromName(p.attributes.name) }; });
  rawBookings.forEach(b => {
    const a = b.attributes || {};
    const uid = b.relationships?.unit?.data?.id;
    const au = allUnitById[uid];
    if (au) {
      const s0 = (a.start_date || "").slice(0, 10), e0 = (a.end_date || "").slice(0, 10);
      sales.push({
        id: a.booking_id || b.id, status: (a.status || "").toLowerCase(), canceled: !!a.canceled,
        created: (a.booked_time || "").slice(0, 10), start: s0, end: e0,
        days: s0 && e0 ? Math.max(0, Math.round((new Date(e0) - new Date(s0)) / 864e5)) : 0,
        total: +a.total_cost || 0, room: au.room, type: au.type, nomad: au.type === "Nomad",
        guest: `${a.lead_guest_first_name || ""} ${a.lead_guest_last_name || ""}`.trim(),
        contact: (a.lead_guest_email || "").toLowerCase().trim() || `${(a.lead_guest_first_name || "").toLowerCase()}|${(a.lead_guest_last_name || "").toLowerCase()}`,
        platform: a.platform || "Direct booking",
      });
    }
    const st = (a.status || "").toLowerCase();
    // Inquiries and expired holds are not bookings. "tentative_expired" is a
    // hold that lapsed (£0, never confirmed) — Lavanda keeps the record, but the
    // guest never arrives, so it must not count as in house or as a clash.
    if (st === "inquiry" || st === "tentative_expired" || st.endsWith("_expired")) return;
    const start = (a.start_date || "").slice(0, 10), end = (a.end_date || "").slice(0, 10);
    if (!start || !end) return;
    let status;
    if (st === "canceled" || a.canceled) status = "CANCELLED";
    else if (st === "tentative") status = "PENDING";
    // "In house" follows Lavanda's own definition: a guest counts until they
    // have checked out, so a stay ending today is still in the building today.
    else if (end < today) status = "CHECKED_OUT";
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
  const allUnits = Object.values(allUnitById);
  return { bookings, guestStays, units, details, sales, allUnits };
}


// Shoreditch: units are "Villa-<flat>-<room>-<Type>" plus five "Villa-Loft - Flat N".
// Whole-flat records ("Villa-03-4 Bedroom flat") and anything marked [remove]
// are containers, not bedrooms.
function sdUnit(name) {
  const n = (name || "").trim();
  if (/remove/i.test(n)) return null;
  let m = n.match(/^Villa-(\d+)-(\d+)-([A-Za-z]+)$/);
  if (m) return { room: `${+m[1]}.${+m[2]}`, type: m[3][0].toUpperCase() + m[3].slice(1).toLowerCase(), flat: `Villa ${+m[1]}` };
  m = n.match(/^Villa-Loft\s*-\s*Flat\s*(\d+)$/i);
  if (m) return { room: `Loft ${m[1]}`, type: "Loft", flat: "Lofts" };
  return null;
}
function adaptShoreditch(rawBookings, rawProps) {
  const unitById = {};
  rawProps.forEach((p) => { const u = sdUnit(p.attributes?.name); if (u) unitById[p.id] = u; });
  const sales = [];
  rawBookings.forEach((b) => {
    const a = b.attributes || {};
    const u = unitById[b.relationships?.unit?.data?.id] || unitById[b.relationships?.property?.data?.id];
    if (!u) return;
    const s0 = (a.start_date || "").slice(0, 10), e0 = (a.end_date || "").slice(0, 10);
    sales.push({
      id: a.booking_id || b.id, status: (a.status || "").toLowerCase(), canceled: !!a.canceled,
      created: (a.booked_time || "").slice(0, 10), start: s0, end: e0,
      days: s0 && e0 ? Math.max(0, Math.round((new Date(e0) - new Date(s0)) / 864e5)) : 0,
      total: +a.total_cost || 0, room: u.room, type: u.type, flat: u.flat, nomad: false,
      guest: `${a.lead_guest_first_name || ""} ${a.lead_guest_last_name || ""}`.trim(),
      contact: (a.lead_guest_email || "").toLowerCase().trim() || `${(a.lead_guest_first_name || "").toLowerCase()}|${(a.lead_guest_last_name || "").toLowerCase()}`,
      platform: a.platform || "Direct booking",
    });
  });
  return { sales, allUnits: Object.values(unitById) };
}

async function runStepLavanda(client, prop = "southall") {
  const cfg = PROPS[prop];
  const KEY_DATA = cfg.data, KEY_BUILD = cfg.data + ":build";
  const t0 = Date.now();
  const budgetLeft = () => STEP_BUDGET_MS - (Date.now() - t0);
  let b = JSON.parse((await client.get(KEY_BUILD)) || "null");
  if (!b || b.source !== "lavanda") b = { source: "lavanda", startedAt: new Date().toISOString(), stage: "bookings", cursor: null, raw: [], props: [], log: [] };
  const save = () => client.set(KEY_BUILD, JSON.stringify(b), { EX: 60 * 60 });
  while (budgetLeft() > 1500) {
    if (b.stage === "bookings") {
      const r = await lavGet(`/bookings?page[size]=50${b.cursor ? `&page[after]=${encodeURIComponent(b.cursor)}` : ""}`, cfg.lavKey);
      b.raw = b.raw.concat(r.data || []);
      b.cursor = r.meta?.page?.next || null;
      if (!b.cursor || b.raw.length > 20000) { b.log.push(`bookings: ${b.raw.length}`); b.stage = "props"; b.cursor = null; }
      await save(); continue;
    }
    if (b.stage === "props") {
      const r = await lavGet(`/properties?page[size]=100${b.cursor ? `&page[after]=${encodeURIComponent(b.cursor)}` : ""}`, cfg.lavKey);
      b.props = b.props.concat(r.data || []);
      b.cursor = r.meta?.page?.next || null;
      if (!b.cursor) { b.log.push(`properties: ${b.props.length}`); b.stage = "finalize"; }
      await save(); continue;
    }
    if (b.stage === "finalize") {
      if (b.raw.length < cfg.min || b.props.length < cfg.min) throw new Error(`Partial Lavanda data (bookings=${b.raw.length}, props=${b.props.length})`);
      const today = new Date().toISOString().slice(0, 10);
      const { bookings, guestStays, units, details, sales, allUnits } = prop === "shoreditch"
        ? { bookings: [], guestStays: [], units: [], details: {}, ...adaptShoreditch(b.raw, b.props) }
        : adaptLavanda(b.raw, b.props, today);
      const snap = { ok: true, source: "lavanda", builtAt: new Date().toISOString(), startedAt: b.startedAt, log: [...b.log, `adapted: ${bookings.length} bookings, ${units.length} units, ${sales.length} sales records`], bookings, guestStays, units, details, sales, allUnits };
      await client.set(KEY_DATA, JSON.stringify(snap));
      await client.del(KEY_BUILD);
      return { done: true, source: "lavanda", stage: "finalize", builtAt: snap.builtAt, log: snap.log, ms: Date.now() - t0 };
    }
  }
  return { done: false, source: "lavanda", stage: b.stage, progress: `${b.raw.length} bookings / ${b.props.length} props`, ms: Date.now() - t0 };
}

async function runStep(client, prop) { return runStepLavanda(client, prop); }

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  const action = req.query.action || "get";
  const prop = PROPS[req.query.property] ? req.query.property : "southall";
  const KEY_DATA = PROPS[prop].data, KEY_BUILD = KEY_DATA + ":build", KEY_LOCK = KEY_DATA + ":lock";
  let client;
  try {
    client = await redis();

    if (action === "cron") {
      // Rebuild every property end to end inside one invocation (Vercel Cron,
      // every 15 min). Returns status only.
      const out = {};
      const t0 = Date.now();
      for (const p of Object.keys(PROPS)) {
        const kd = PROPS[p].data, kb = kd + ":build", kl = kd + ":lock";
        out[p] = "skipped";
        for (let i = 0; i < 12 && Date.now() - t0 < 50000; i++) {
          const got = await client.set(kl, String(Date.now()), { NX: true, PX: STEP_BUDGET_MS + 15000 });
          if (!got) { out[p] = "locked"; break; }
          try {
            const r = await runStep(client, p);
            out[p] = r.done ? `built ${r.builtAt}` : r.stage;
            if (r.done) break;
          } catch (e) { await client.del(kb); out[p] = "error: " + e.message; break; }
          finally { await client.del(kl); }
        }
      }
      // Warm the CRM lead cache for both properties
      try {
        const { buildCrm } = await import("./crm-leads");
        for (const p of ["southall", "shoreditch"]) { if (Date.now() - t0 > 52000) break; const d = await buildCrm(p); await client.set(`crm_leads_v1:${p}`, JSON.stringify(d), { EX: 24 * 3600 }); out["crm_" + p] = d.leads.length + " leads"; }
      } catch (e) { out.crm = "error: " + e.message; }
      return res.status(200).json({ ok: true, ms: Date.now() - t0, out });
    }

    if (action === "build") {
      // One step at a time across all callers
      const got = await client.set(KEY_LOCK, String(Date.now()), { NX: true, PX: STEP_BUDGET_MS + 15000 });
      if (!got) return res.status(200).json({ done: false, stage: "locked", note: "another step is running" });
      try {
        const out = await runStep(client, prop);
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
      return res.status(200).json({ ok: false, reason: "no snapshot yet", building: building ? { stage: building.stage, page: building.page, detailIdx: building.detailIdx } : null });
    }
    if (action === "status") {
      const s = JSON.parse(raw);
      const building = JSON.parse((await client.get(KEY_BUILD)) || "null");
      return res.status(200).json({ ok: true, source: s.source || "rh", builtAt: s.builtAt, ageMin: Math.round((Date.now() - new Date(s.builtAt)) / 60000),
        counts: { bookings: s.bookings.length, guestStays: s.guestStays.length, units: s.units.length, details: Object.keys(s.details).length },
        building: building ? { stage: building.stage, page: building.page, detailIdx: building.detailIdx } : null });
    }
    res.setHeader("Content-Type", "application/json");
    return res.status(200).send(raw);
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message });
  } finally {
    try { if (client) await client.quit(); } catch {}
  }
}
