// TEMPORARY token-gated weekly-report reconciliation (no guest names). Remove after use.
export const config = { maxDuration: 30 };
const dd = (a, b) => Math.round((new Date(b + "T00:00:00Z") - new Date(a + "T00:00:00Z")) / 864e5);
export default async function handler(req, res) {
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
