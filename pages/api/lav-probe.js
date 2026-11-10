// TEMPORARY token-gated weekly-report reconciliation (no guest names). Remove after use.
import { oppChannel } from "../../lib/ghlLeads";
export const config = { maxDuration: 60 };
const dd = (a, b) => Math.round((new Date(b + "T00:00:00Z") - new Date(a + "T00:00:00Z")) / 864e5);
export default async function handler(req, res) {
  if (req.query.ghl && req.query.t === "251f49e5990cd15d2540b655") return ghl(req, res);
  if (req.query.t !== "251f49e5990cd15d2540b655") return res.status(404).end();
  const { createClient } = await import("redis");
  const c = createClient({ url: process.env.KV_REDIS_URL }); await c.connect();
  const s = JSON.parse(await c.get(req.query.p === "sd" ? "snapshot:sd:v1" : "snapshot:rh:v1")); await c.quit();
  const from = req.query.from, to = req.query.to;
  const sales = s.sales;
  const live = (x) => !x.canceled && x.status !== "canceled" && x.status !== "inquiry" && !x.status.endsWith("_expired");
  const conf = (x) => !x.canceled && x.status === "confirmed";
  const byC = {}; sales.filter(live).forEach((x) => { if (x.contact && x.contact !== "|") (byC[x.contact] = byC[x.contact] || []).push(x); });
  const ren = new Set(), cont = new Set(), fol = {};
  Object.values(byC).forEach((l) => l.forEach((a) => l.forEach((b) => { if (a === b || b.start <= a.start) return; const g = dd(a.end, b.start); if (g < -30 || g > 14) return; cont.add(b.id); if (!a.nomad && !b.nomad) ren.add(b.id); fol[a.id] = b; })));
  const inR = (d) => d && d >= from && d <= to;
  const wk = (x) => (x.days > 0 && x.total > 0 ? Math.round(x.total / x.days * 7) : null);
  const kind = (x) => (x.nomad || x.days < 28 ? "short" : ren.has(x.id) ? "renewal" : "new long");
  const made = sales.filter((x) => inR(x.created)).map((x) => ({ id: x.id, created: x.created, status: x.canceled ? "canceled" : x.status, room: x.room, type: x.type, start: x.start, end: x.end, days: x.days, wk: wk(x), kind: kind(x), platform: x.platform }));
  const offline = ["12","308","327","404","405","506","507","627","727","927","1104"];
  const occOn = (d) => new Set(sales.filter((x) => conf(x) && x.start <= d && x.end >= d).map((x) => x.room)).size;
  const occOnUsable = (d) => new Set(sales.filter((x) => conf(x) && x.start <= d && x.end >= d && !offline.includes(x.room)).map((x) => x.room)).size;
  const people = (d) => sales.filter((x) => conf(x) && x.start <= d && x.end >= d).length;
  const ins = sales.filter((x) => conf(x) && inR(x.start) && !cont.has(x.id));
  const outs = sales.filter((x) => conf(x) && inR(x.end) && !fol[x.id]);
  const cancelled = sales.filter((x) => (x.canceled || x.status === "canceled") && (inR(x.created) || inR(x.start)));
  const today = new Date().toISOString().slice(0, 10);
  const held = sales.filter((x) => !x.canceled && (x.status === "confirmed" || x.status === "tentative"));
  const noFuture = (s.allUnits || []).filter((u) => !offline.includes(u.room) && !held.some((x) => x.room === u.room && x.end > today)).map((u) => u.room + " " + u.type);
  res.status(200).json({ builtAt: s.builtAt, from, to, made, totals: { made: made.length, byStatus: made.reduce((m, x) => (m[x.status] = (m[x.status] || 0) + 1, m), {}) },
    occ: { [from]: { rooms: occOn(addDay(from, -1)), people: people(addDay(from, -1)) }, [to]: { rooms: occOn(to), usableRooms: occOnUsable(to), people: people(to) }, today: { rooms: occOn(today), usableRooms: occOnUsable(today), people: people(today) } },
    checkIns: { total: ins.length, ls: ins.filter((x) => !x.nomad).length, nomad: ins.filter((x) => x.nomad).length }, checkOuts: { total: outs.length, ls: outs.filter((x) => !x.nomad).length, nomad: outs.filter((x) => x.nomad).length },
    cancelled: cancelled.length, cancelledAll: sales.filter((x) => x.canceled || x.status === "canceled").length, noFuture });
}
function addDay(d, n) { const x = new Date(d + "T00:00:00Z"); x.setUTCDate(x.getUTCDate() + n); return x.toISOString().slice(0, 10); }

async function ghl(req, res) {
  const KEY = process.env.GHL_API_KEY || "pit-da675da7-68cd-4c4e-8693-c490f7f86f04";
  const get = async (p) => (await fetch("https://services.leadconnectorhq.com" + p, { headers: { Authorization: "Bearer " + KEY, Version: "2021-07-28", Accept: "application/json" } })).json();
  const pid = req.query.pid || "Kxo9AHQiTKlZoWoBojAl";
  const pr = await get("/opportunities/pipelines?locationId=PwquLuIhIjj0D80e6jLU");
  const pipe = pr.pipelines.find((x) => x.id === pid); const sn = {}; pipe.stages.forEach((x) => { sn[x.id] = x.name; });
  let all = [], sa, sai;
  for (let i = 0; i < 60; i++) {
    const q = new URLSearchParams({ location_id: "PwquLuIhIjj0D80e6jLU", pipeline_id: pid, limit: "100" }); if (sa) q.set("startAfter", sa); if (sai) q.set("startAfterId", sai);
    const r = await get("/opportunities/search?" + q); const o = r.opportunities || []; all = all.concat(o);
    sa = r.meta?.startAfter; sai = r.meta?.startAfterId; if (!o.length || !sa || all.length >= (r.meta?.total || 0)) break;
  }
  const { from, to } = req.query; const inR = (d) => d && d.slice(0, 10) >= from && d.slice(0, 10) <= to;
  const created = all.filter((o) => inR(o.createdAt));
  const uniq = {}; created.forEach((o) => { uniq[o.contactId || o.id] = o; });
  const leads = Object.values(uniq);
  const ch = {}; leads.forEach((o) => { const c = oppChannel(o); ch[c] = (ch[c] || 0) + 1; });
  const src = {}; leads.forEach((o) => { const k = (o.source || "—").slice(0, 40); src[k] = (src[k] || 0) + 1; });
  const stageNow = {}; leads.forEach((o) => { const k = sn[o.pipelineStageId]; stageNow[k] = (stageNow[k] || 0) + 1; });
  const movedTour = all.filter((o) => /tour (booked|completed)/i.test(sn[o.pipelineStageId] || "") && inR(o.lastStageChangeAt)).length;
  const tagTour = leads.filter((o) => (o.contact?.tags || []).some((t) => /tour booked/i.test(t))).length;
  const booked = all.filter((o) => /booking confirmed/i.test(sn[o.pipelineStageId] || "") && inR(o.lastStageChangeAt)).map((o) => ({ ch: oppChannel(o), at: o.lastStageChangeAt.slice(0, 10) }));
  res.status(200).json({ total: all.length, oppsCreated: created.length, uniqueLeads: leads.length, channels: ch, sources: src, stageNow, movedToTourStage: movedTour, leadsTaggedTour: tagTour, bookedInRange: booked });
}
