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

function freshBuild() {
  return { startedAt: new Date().toISOString(), stage: 0, page: 0, token: null, tokenAt: 0,
           bookings: [], pending: [], guestStays: [], units: [], details: {}, detailIdx: 0, detailTargets: null, log: [] };
}

async function runStep(client) {
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
      return res.status(200).json({ ok: true, builtAt: s.builtAt, ageMin: Math.round((Date.now() - new Date(s.builtAt)) / 60000),
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
