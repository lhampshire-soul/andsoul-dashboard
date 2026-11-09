// pages/preview.js — simplified Southall dashboard (Snapshot · Sales · Renewals).
// Property, revenue and sales: Lavanda snapshot (/api/snapshot).
// Spend: Meta + Google Ads (Windsor). Leads: Go High Level CRM only.
import { useEffect, useMemo, useState } from "react";
import Head from "next/head";
import { BEDS, OFFLINE_ROOMS, OFFLINE_UNLISTED } from "../lib/offline";
import { loadCrmLeads } from "../lib/ghlLeads";

const C = { bg: "#F6F5F2", card: "#FFFFFF", text: "#1B1B1B", muted: "#7A7A7A", line: "#E7E4DE", accent: "#1F3864", good: "#2E7D4F", warn: "#B7791F", bad: "#B23B3B" };
const TYPES = ["Nomad", "Nook", "Snug", "Cosy", "Roomy", "Spacious", "Deluxe Accessible", "Deluxe"];
const tl = (t) => ({ "Deluxe Accessible": "Accessible" }[t] || t);

const iso = (d) => d.toISOString().slice(0, 10);
const addDays = (s, n) => { const d = new Date(s + "T00:00:00Z"); d.setUTCDate(d.getUTCDate() + n); return iso(d); };
const dayDiff = (a, b) => Math.round((new Date(b + "T00:00:00Z") - new Date(a + "T00:00:00Z")) / 864e5);
const monthStart = (s, k = 0) => { const d = new Date(s.slice(0, 8) + "01T00:00:00Z"); d.setUTCMonth(d.getUTCMonth() + k); return iso(d); };
const monthEnd = (s, k = 0) => addDays(monthStart(s, k + 1), -1);
const gbp = (n, dp = 0) => (n == null || isNaN(n) || !isFinite(n) ? "—" : "£" + Number(n).toLocaleString("en-GB", { minimumFractionDigits: dp, maximumFractionDigits: dp }));
const num = (n) => (n == null || isNaN(n) ? "—" : Number(n).toLocaleString("en-GB"));
const pct = (n, dp = 0) => (n == null || isNaN(n) || !isFinite(n) ? "—" : (n * 100).toFixed(dp) + "%");
const fmtDate = (s) => (s ? new Date(s + "T00:00:00Z").toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" }) : "—");
const daily = (s) => (s.days > 0 && s.total > 0 ? s.total / s.days : 0);
const weekly = (s) => (s.days > 0 && s.total > 0 ? (s.total / s.days) * 7 : null);
const sane = (w) => w != null && w >= 100 && w <= 1000;   // AWR: drops £0/staff stays and mis-keyed totals
const badRecord = (s) => { const w = weekly(s); return w != null && w > 1000; }; // revenue: drop mis-keyed totals only

function periodRange(key, today) {
  if (key === "7d") return { from: addDays(today, -6), to: today };
  if (key === "30d") return { from: addDays(today, -29), to: today };
  if (key === "mtd") return { from: monthStart(today), to: today };
  return { from: monthStart(today, -1), to: monthEnd(today, -1) };
}
function prevRange(key, r) {
  if (key === "7d" || key === "30d") { const n = dayDiff(r.from, r.to) + 1; return { from: addDays(r.from, -n), to: addDays(r.to, -n) }; }
  if (key === "mtd") { const f = monthStart(r.from, -1); const t = addDays(f, dayDiff(r.from, r.to)); const e = monthEnd(r.from, -1); return { from: f, to: t < e ? t : e }; }
  return { from: monthStart(r.from, -1), to: monthEnd(r.from, -1) };
}

const isLive = (s) => !s.canceled && s.status !== "canceled" && s.status !== "inquiry" && !s.status.endsWith("_expired");
const isConfirmed = (s) => !s.canceled && s.status === "confirmed";
const isShort = (s) => s.nomad || s.days < 28;

// Follow-on stays: same guest, next stay starts 30 days before → 14 days after
// the previous one ends (same rule as the renewals tracker).
function buildChains(sales) {
  const byContact = {};
  sales.filter(isLive).forEach((s) => { if (s.contact && s.contact !== "|") (byContact[s.contact] = byContact[s.contact] || []).push(s); });
  const isRenewal = new Set(), isContinuation = new Set(), followOn = {};
  const rank = (x) => (isConfirmed(x) ? 2 : x.status === "tentative" ? 1 : 0);
  Object.values(byContact).forEach((list) => list.forEach((a) => list.forEach((b) => {
    if (a === b || b.start <= a.start) return;
    const gap = dayDiff(a.end, b.start);
    if (gap < -30 || gap > 14) return;
    isContinuation.add(b.id);
    if (!a.nomad && !b.nomad) isRenewal.add(b.id);
    if (!followOn[a.id] || rank(b) > rank(followOn[a.id])) followOn[a.id] = b;
  })));
  return { isRenewal, isContinuation, followOn };
}

const LOS = [{ key: "1–2 months", max: 85 }, { key: "3–5 months", max: 175 }, { key: "6–11 months", max: 360 }, { key: "12 months +", max: Infinity }];
const losBand = (d) => LOS.find((b) => d < b.max).key;

// ─── UI ─────────────────────────────────────────────────────────────────────
const Card = ({ children, style }) => <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 12, padding: 18, ...style }}>{children}</div>;
function Delta({ cur, prev, fmt = num, lowerIsBetter, label = "prev" }) {
  if (cur == null || prev == null || isNaN(cur) || isNaN(prev)) return null;
  const ch = prev ? cur / prev - 1 : null;
  const up = cur > prev, flat = cur === prev;
  const good = flat ? null : lowerIsBetter ? !up : up;
  return <span style={{ fontSize: 12, color: C.muted }}>{label} {fmt(prev)}{ch != null && isFinite(ch) && !flat && <span style={{ color: good ? C.good : C.bad, fontWeight: 600 }}> {up ? "▲" : "▼"} {Math.abs(ch * 100).toFixed(0)}%</span>}</span>;
}
const Stat = ({ label, value, sub, color, delta }) => (
  <Card style={{ padding: "14px 16px" }}>
    <div style={{ fontSize: 11, letterSpacing: 0.6, textTransform: "uppercase", color: C.muted, marginBottom: 6 }}>{label}</div>
    <div style={{ fontSize: 26, fontWeight: 700, color: color || C.text, fontVariantNumeric: "tabular-nums" }}>{value}</div>
    {sub != null && <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>{sub}</div>}
    {delta && <div style={{ marginTop: 4 }}>{delta}</div>}
  </Card>
);
const Grid = ({ min = 160, children }) => <div style={{ display: "grid", gridTemplateColumns: `repeat(auto-fill, minmax(${min}px, 1fr))`, gap: 12 }}>{children}</div>;
const H = ({ children, right }) => (
  <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", margin: "28px 0 12px", gap: 10, flexWrap: "wrap" }}>
    <h2 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>{children}</h2>{right}
  </div>
);
const th = { padding: "8px 10px", fontSize: 11, fontWeight: 600, color: C.muted, textTransform: "uppercase", letterSpacing: 0.5, borderBottom: `1px solid ${C.line}`, whiteSpace: "nowrap" };
const td = { padding: "8px 10px", fontSize: 13, borderBottom: `1px solid ${C.line}`, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" };
const Table = ({ cols, rows, total }) => (
  <Card style={{ padding: 0, overflowX: "auto" }}>
    <table style={{ width: "100%", borderCollapse: "collapse" }}>
      <thead><tr>{cols.map((c, i) => <th key={i} style={{ ...th, textAlign: i ? "right" : "left" }}>{c}</th>)}</tr></thead>
      <tbody>
        {rows.map((r, i) => <tr key={i}>{r.map((v, j) => <td key={j} style={{ ...td, textAlign: j ? "right" : "left" }}>{v}</td>)}</tr>)}
        {total && <tr>{total.map((v, j) => <td key={j} style={{ ...td, textAlign: j ? "right" : "left", fontWeight: 700, borderBottom: "none", background: "#FAF9F7" }}>{v}</td>)}</tr>}
      </tbody>
    </table>
  </Card>
);
const Pill = ({ on, onClick, children }) => (
  <button onClick={onClick} style={{ border: `1px solid ${on ? C.accent : C.line}`, background: on ? C.accent : C.card, color: on ? "#fff" : C.text, borderRadius: 999, padding: "6px 14px", fontSize: 13, cursor: "pointer" }}>{children}</button>
);
const SC = { Renewed: C.good, Pending: C.warn, Leaving: C.bad, Undecided: C.muted, Confirmed: C.good, Cancelled: C.bad, "Expired hold": C.muted, Enquiry: C.muted };
const Tag = ({ s }) => <span style={{ color: SC[s] || C.text, fontWeight: 600 }}>{s}</span>;

// ─── Page ───────────────────────────────────────────────────────────────────
export default function Preview() {
  const [tab, setTab] = useState("snapshot");
  const [period, setPeriod] = useState("7d");
  const [snap, setSnap] = useState(null);
  const [err, setErr] = useState(null);
  const [rstate, setRstate] = useState({ leaving: [], pending: [] });
  const [ads, setAds] = useState({});
  const [crm, setCrm] = useState(null);
  const [crmErr, setCrmErr] = useState(null);
  const [month, setMonth] = useState(null);
  const today = useMemo(() => iso(new Date()), []);
  const range = periodRange(period, today);
  const prev = prevRange(period, range);

  useEffect(() => {
    let dead = false;
    (async () => {
      try {
        let s = await (await fetch("/api/snapshot")).json();
        if (!s.ok || !s.sales) {
          for (let i = 0; i < 30; i++) {
            const r = await (await fetch("/api/snapshot?action=build", { method: "POST" })).json();
            if (r.done || r.stage === "error") break;
            if (r.stage === "locked") await new Promise((z) => setTimeout(z, 3000));
          }
          s = await (await fetch("/api/snapshot")).json();
        }
        if (!dead) s.ok ? setSnap(s) : setErr(s.reason || s.error || "Snapshot unavailable");
      } catch (e) { if (!dead) setErr(e.message); }
      try { const r = await (await fetch("/api/renewal-state")).json(); if (!dead) setRstate(r); } catch {}
    })();
    loadCrmLeads().then((l) => !dead && setCrm(l)).catch((e) => !dead && setCrmErr(e.message));
    return () => { dead = true; };
  }, []);

  // Ad spend for the period and the previous period
  useEffect(() => {
    [range, prev].forEach((r) => {
      const k = `${r.from}|${r.to}`;
      if (ads[k]) return;
      setAds((x) => ({ ...x, [k]: "loading" }));
      const get = async (u) => { try { const j = await (await fetch(u)).json(); return j.data || null; } catch { return null; } };
      Promise.all([get(`/api/meta?dateFrom=${r.from}&dateTo=${r.to}&property=southall`), get(`/api/google?dateFrom=${r.from}&dateTo=${r.to}&property=southall`)])
        .then(([m, g]) => setAds((x) => ({ ...x, [k]: { meta: m?.totalSpend ?? null, google: g?.totalSpend ?? null } })));
    });
  }, [range.from, range.to]); // eslint-disable-line

  const sales = snap?.sales || [];
  const ch = useMemo(() => buildChains(sales), [snap]); // eslint-disable-line
  const offline = useMemo(() => OFFLINE_ROOMS.filter((o) => o.from <= today && o.until >= today).map((o) => o.room), [today]);
  const offSet = useMemo(() => new Set(offline), [offline]);
  const offTotal = offline.length + OFFLINE_UNLISTED;
  const usable = BEDS - offTotal;
  const conf = useMemo(() => sales.filter(isConfirmed), [snap]); // eslint-disable-line
  const occRoomsOn = (d) => new Set(conf.filter((s) => s.start <= d && s.end >= d && !offSet.has(s.room)).map((s) => s.room)).size;
  const peopleOn = (d) => conf.filter((s) => s.start <= d && s.end >= d).length;

  // ─── Property ────────────────────────────────────────────────────────────
  const prop = useMemo(() => {
    if (!snap) return null;
    const units = snap.allUnits || [];
    const typeOf = {}; units.forEach((u) => { typeOf[u.room] = u.type; });
    const inHouse = conf.filter((s) => s.start <= today && s.end >= today);
    const rows = TYPES.map((t) => {
      const rooms = units.filter((u) => u.type === t).length;
      const off = offline.filter((r) => typeOf[r] === t).length;
      const stays = inHouse.filter((s) => s.type === t && !offSet.has(s.room));
      const occ = new Set(stays.map((s) => s.room)).size;
      const w = stays.map(weekly).filter(sane);
      return { t, rooms, off, usable: rooms - off, occ, awr: w.length ? w.reduce((a, b) => a + b, 0) / w.length : null, wSum: w.reduce((a, b) => a + b, 0), wN: w.length };
    });
    const occ = rows.reduce((a, r) => a + r.occ, 0);
    const sum = (rs, f) => rs.reduce((a, r) => a + r[f], 0);
    const ls = rows.filter((r) => r.t !== "Nomad");
    const wk = addDays(today, -7);
    return { rows, recordRooms: sum(rows, "rooms"), occ, occWk: occRoomsOn(wk), people: inHouse.length, peopleWk: peopleOn(wk),
      awr: sum(rows, "wSum") / Math.max(1, sum(rows, "wN")), lsAwr: sum(ls, "wSum") / Math.max(1, sum(ls, "wN")), nomad: rows.find((r) => r.t === "Nomad") };
  }, [snap, today, offline]); // eslint-disable-line

  // ─── Revenue (gross, from booked stays) ──────────────────────────────────
  const rev = useMemo(() => {
    if (!snap) return null;
    const good = conf.filter((s) => !badRecord(s));
    const nightsIn = (s, f, t) => Math.max(0, dayDiff(s.start > f ? s.start : f, s.end < addDays(t, 1) ? s.end : addDays(t, 1)));
    const revIn = (f, t, pred = () => true) => good.filter(pred).reduce((a, s) => a + nightsIn(s, f, t) * daily(s), 0);
    const inHouse = good.filter((s) => s.start <= today && s.end > today);
    const roll = (pred) => inHouse.filter(pred).reduce((a, s) => a + daily(s) * 365 / 12, 0);
    const m0 = [monthStart(today), monthEnd(today)], m1 = [monthStart(today, 1), monthEnd(today, 1)], mp = [monthStart(today, -1), monthEnd(today, -1)];
    const excluded = conf.filter(badRecord).length;
    return {
      roll: roll(() => true), rollLs: roll((s) => !s.nomad), rollNomad: roll((s) => s.nomad),
      thisM: revIn(...m0), thisLs: revIn(...m0, (s) => !s.nomad), thisNomad: revIn(...m0, (s) => s.nomad),
      lastM: revIn(...mp), nextM: revIn(...m1), period: revIn(range.from, range.to), periodPrev: revIn(prev.from, prev.to),
      m0Label: new Date(m0[0] + "T00:00:00Z").toLocaleDateString("en-GB", { month: "long", timeZone: "UTC" }),
      m1Label: new Date(m1[0] + "T00:00:00Z").toLocaleDateString("en-GB", { month: "long", timeZone: "UTC" }), excluded,
    };
  }, [snap, today, range.from, range.to]); // eslint-disable-line

  // ─── Next 30 days ────────────────────────────────────────────────────────
  const ahead = useMemo(() => {
    if (!snap) return null;
    const weeks = [0, 1, 2, 3].map((w) => {
      const f = addDays(today, 7 * w + 1), t = addDays(today, 7 * (w + 1));
      const arr = conf.filter((s) => s.start >= f && s.start <= t && !ch.isContinuation.has(s.id));
      const dep = conf.filter((s) => s.end >= f && s.end <= t && !ch.followOn[s.id]);
      const occ = occRoomsOn(t);
      return { label: `${fmtDate(f)} – ${fmtDate(t)}`, aLs: arr.filter((s) => !s.nomad).length, aN: arr.filter((s) => s.nomad).length, dLs: dep.filter((s) => !s.nomad).length, dN: dep.filter((s) => s.nomad).length, occ, pct: occ / usable };
    });
    const tot = (f) => weeks.reduce((a, w) => a + w[f], 0);
    const d30 = addDays(today, 30);
    const arr30 = conf.filter((s) => s.start > today && s.start <= d30 && !ch.isContinuation.has(s.id));
    const dep30 = conf.filter((s) => s.end > today && s.end <= d30 && !ch.followOn[s.id]);
    return { weeks, aLs: tot("aLs"), aN: tot("aN"), dLs: tot("dLs"), dN: tot("dN"), occ30: occRoomsOn(d30), arr30, dep30 };
  }, [snap, today, offline]); // eslint-disable-line

  // ─── Sales for a date range ──────────────────────────────────────────────
  const salesFor = (r) => {
    const kind = (s) => (isShort(s) ? "Short stay" : ch.isRenewal.has(s.id) ? "Long stay — renewal" : "Long stay — new");
    const statusOf = (s) => (s.canceled || s.status === "canceled" ? "Cancelled" : s.status === "inquiry" ? "Enquiry" : s.status.endsWith("_expired") ? "Expired hold" : s.status === "tentative" ? "Pending" : "Confirmed");
    const recs = sales.filter((s) => s.created && s.created >= r.from && s.created <= r.to).map((s) => ({ ...s, kind: kind(s), st: statusOf(s) })).sort((a, b) => b.created.localeCompare(a.created));
    const made = recs.filter((x) => x.st !== "Enquiry"), confd = made.filter((x) => x.st === "Confirmed");
    return { recs, made, confd, enq: recs.length - made.length, pend: made.filter((x) => x.st === "Pending").length, canc: made.filter((x) => x.st === "Cancelled").length, exp: made.filter((x) => x.st === "Expired hold").length,
      newLong: confd.filter((x) => x.kind === "Long stay — new").length, renew: confd.filter((x) => x.kind === "Long stay — renewal").length, short: confd.filter((x) => x.kind === "Short stay").length,
      value: confd.reduce((a, x) => a + (badRecord(x) ? 0 : x.total), 0) };
  };
  const sale = useMemo(() => (snap ? salesFor(range) : null), [snap, range.from, range.to, ch]); // eslint-disable-line
  const saleP = useMemo(() => (snap ? salesFor(prev) : null), [snap, prev.from, prev.to, ch]); // eslint-disable-line

  // ─── Marketing (spend: ads · leads: CRM) ─────────────────────────────────
  const mktFor = (r, s) => {
    const a = ads[`${r.from}|${r.to}`];
    if (!a || a === "loading") return null;
    const leads = crm ? crm.filter((l) => l.created >= r.from && l.created <= r.to) : null;
    const n = (c) => (leads ? leads.filter((l) => l.channel === c).length : null);
    const spend = (a.meta || 0) + (a.google || 0);
    return { spend, meta: a.meta, google: a.google, leads: leads ? leads.length : null, lMeta: n("meta"), lGoogle: n("google"), lOther: n("other"),
      cpl: leads && leads.length ? spend / leads.length : null, cplMeta: n("meta") ? a.meta / n("meta") : null, cplGoogle: n("google") ? a.google / n("google") : null,
      cpa: s && s.newLong ? spend / s.newLong : null, conv: leads && leads.length && s ? s.newLong / leads.length : null };
  };
  const mk = mktFor(range, sale), mkP = mktFor(prev, saleP);

  // ─── Renewals ────────────────────────────────────────────────────────────
  const renewals = useMemo(() => {
    const leaving = new Set((rstate.leaving || []).map(String)), pending = new Set((rstate.pending || []).map(String));
    const byMonth = {};
    conf.filter((s) => !s.nomad && s.days >= 28 && s.total > 0).forEach((s) => {
      const m = (byMonth[s.end.slice(0, 7)] = byMonth[s.end.slice(0, 7)] || {});
      const key = s.contact || s.id;
      if (!m[key] || s.end > m[key].end) m[key] = s;
    });
    const out = [];
    for (let i = -1; i <= 6; i++) {
      const k = monthStart(today, i).slice(0, 7);
      const entries = Object.values(byMonth[k] || {}).map((s) => {
        const f = ch.followOn[s.id];
        const st = leaving.has(String(s.id)) ? "Leaving" : f && isConfirmed(f) ? "Renewed" : (f && f.status === "tentative") || pending.has(String(s.id)) ? "Pending" : s.end < today ? "Leaving" : "Undecided";
        const cur = weekly(s), nw = f && isConfirmed(f) ? weekly(f) : null;
        return { ...s, st, cur, nw };
      }).sort((a, b) => a.end.localeCompare(b.end));
      const c = (x) => entries.filter((e) => e.st === x).length;
      const ups = entries.filter((e) => e.nw && sane(e.cur) && sane(e.nw)).map((e) => e.nw / e.cur - 1);
      out.push({ k, label: new Date(k + "-01T00:00:00Z").toLocaleDateString("en-GB", { month: "short", year: "numeric", timeZone: "UTC" }), entries, total: entries.length,
        renewed: c("Renewed"), pending: c("Pending"), leaving: c("Leaving"), undecided: c("Undecided"), uplift: ups.length ? ups.reduce((a, b) => a + b, 0) / ups.length : null });
    }
    return out;
  }, [snap, rstate, ch, today]); // eslint-disable-line

  const pills = (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
      <span style={{ fontSize: 12, color: C.muted, marginRight: 4 }}>{fmtDate(range.from)} – {fmtDate(range.to)} · vs {fmtDate(prev.from)} – {fmtDate(prev.to)}</span>
      {[["7d", "7 days"], ["30d", "30 days"], ["mtd", "Month to date"], ["lm", "Last month"]].map(([k, l]) => <Pill key={k} on={period === k} onClick={() => setPeriod(k)}>{l}</Pill>)}
    </div>
  );
  const L = (v) => (v == null ? "…" : v);

  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.text, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" }}>
      <Head><title>&Soul Southall</title><meta name="viewport" content="width=device-width, initial-scale=1" /></Head>
      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "22px 18px 60px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800 }}>&amp;Soul Southall</div>
            <div style={{ fontSize: 12, color: C.muted }}>{snap ? `Lavanda · updated ${new Date(snap.builtAt).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}` : "Loading…"}{crmErr ? " · CRM unavailable" : ""}</div>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {[["snapshot", "Snapshot"], ["sales", "Sales"], ["renewals", "Renewals"]].map(([k, l]) => <Pill key={k} on={tab === k} onClick={() => setTab(k)}>{l}</Pill>)}
          </div>
        </div>

        {err && <Card style={{ marginTop: 20, color: C.bad }}>{err}</Card>}
        {!snap && !err && <Card style={{ marginTop: 20, color: C.muted }}>Loading Lavanda data…</Card>}

        {snap && prop && tab === "snapshot" && (<>
          <H right={<span style={{ fontSize: 12, color: C.muted }}>Today · {fmtDate(today)} · vs 7 days ago</span>}>Property</H>
          <Grid>
            <Stat label="Occupancy" value={pct(prop.occ / usable, 1)} sub={`${prop.occ} of ${usable} usable rooms`} delta={<Delta cur={prop.occ / usable} prev={prop.occWk / usable} fmt={(v) => pct(v, 1)} label="7d ago" />} />
            <Stat label="Residents in house" value={num(prop.people)} sub="Active stays today" delta={<Delta cur={prop.people} prev={prop.peopleWk} label="7d ago" />} />
            <Stat label="Rooms empty" value={num(usable - prop.occ)} sub="Usable, not occupied" />
            <Stat label="Rooms offline" value={num(offTotal)} sub={`of ${BEDS} rooms`} />
            <Stat label="AWR — building" value={gbp(prop.awr)} sub="Avg weekly rate, in house" />
            <Stat label="AWR — long stay" value={gbp(prop.lsAwr)} sub={`Nomad ${gbp(prop.nomad?.awr)}/wk`} />
          </Grid>
          <div style={{ height: 12 }} />
          <Table cols={["Room type", "Rooms", "Offline", "Usable", "Occupied", "Empty", "Occupancy", "AWR"]}
            rows={prop.rows.map((r) => [tl(r.t), r.rooms, r.off || "—", r.usable, r.occ, r.usable - r.occ, pct(r.occ / r.usable), gbp(r.awr)])}
            total={["Total", BEDS, offTotal, usable, prop.occ, usable - prop.occ, pct(prop.occ / usable, 1), gbp(prop.awr)]} />
          {OFFLINE_UNLISTED > 0 && <div style={{ fontSize: 11, color: C.muted, marginTop: 6 }}>{OFFLINE_UNLISTED} offline rooms not yet assigned to a room number are in the total only.</div>}

          <H right={<span style={{ fontSize: 12, color: C.muted }}>Gross</span>}>Revenue</H>
          <Grid>
            <Stat label="Monthly rent roll" value={gbp(rev.roll)} sub={`Long stay ${gbp(rev.rollLs)} · Nomad ${gbp(rev.rollNomad)}`} />
            <Stat label={`${rev.m0Label} revenue`} value={gbp(rev.thisM)} sub={`Long stay ${gbp(rev.thisLs)} · Nomad ${gbp(rev.thisNomad)}`} delta={<Delta cur={rev.thisM} prev={rev.lastM} fmt={gbp} label="last month" />} />
            <Stat label={`${rev.m1Label} booked so far`} value={gbp(rev.nextM)} />
            <Stat label="Booking value (period)" value={gbp(sale.value)} sub="Confirmed bookings made" delta={<Delta cur={sale.value} prev={saleP.value} fmt={gbp} />} />
          </Grid>
          {rev.excluded > 0 && <div style={{ fontSize: 11, color: C.muted, marginTop: 6 }}>{rev.excluded} Lavanda record{rev.excluded > 1 ? "s" : ""} with a weekly rate above £1,000 excluded.</div>}

          <H right={<span style={{ fontSize: 12, color: C.muted }}>Confirmed stays · {fmtDate(addDays(today, 1))} – {fmtDate(addDays(today, 30))}</span>}>Next 30 days</H>
          <Grid>
            <Stat label="Arrivals" value={num(ahead.aLs + ahead.aN)} sub={`Long stay ${ahead.aLs} · Nomad ${ahead.aN}`} />
            <Stat label="Departures" value={num(ahead.dLs + ahead.dN)} sub={`Long stay ${ahead.dLs} · Nomad ${ahead.dN}`} />
            <Stat label="Net change" value={(ahead.aLs + ahead.aN - ahead.dLs - ahead.dN > 0 ? "+" : "") + (ahead.aLs + ahead.aN - ahead.dLs - ahead.dN)} />
            <Stat label="Occupancy in 30 days" value={pct(ahead.occ30 / usable, 1)} sub={`${ahead.occ30} rooms booked`} />
          </Grid>
          <div style={{ height: 12 }} />
          <Table cols={["Week", "Arrivals LS", "Arrivals Nomad", "Departures LS", "Departures Nomad", "Rooms occupied", "Occupancy"]}
            rows={ahead.weeks.map((w) => [w.label, w.aLs, w.aN, w.dLs, w.dN, w.occ, pct(w.pct, 1)])} />

          <H right={pills}>Marketing</H>
          <Grid>
            <Stat label="Marketing spend" value={mk ? gbp(mk.spend) : "…"} sub={mk ? `Meta ${gbp(mk.meta)} · Google ${gbp(mk.google)}` : null} delta={mk && mkP && <Delta cur={mk.spend} prev={mkP.spend} fmt={gbp} lowerIsBetter />} />
            <Stat label="Leads (CRM)" value={L(mk?.leads)} sub={mk?.leads != null ? `Meta ${mk.lMeta} · Google ${mk.lGoogle} · Other ${mk.lOther}` : null} delta={mk && mkP && <Delta cur={mk.leads} prev={mkP.leads} />} />
            <Stat label="Cost per lead" value={mk ? gbp(mk.cpl) : "…"} sub="All CRM leads" delta={mk && mkP && <Delta cur={mk.cpl} prev={mkP.cpl} fmt={gbp} lowerIsBetter />} />
            <Stat label="Cost per acquisition" value={mk ? gbp(mk.cpa) : "…"} sub={`Spend ÷ ${sale.newLong} new long-stay bookings`} delta={mk && mkP && <Delta cur={mk.cpa} prev={mkP.cpa} fmt={gbp} lowerIsBetter />} />
          </Grid>
          <div style={{ height: 12 }} />
          <Table cols={["Channel", "Spend", "Leads (CRM)", "Cost per lead", "Prev cost per lead"]}
            rows={mk ? [
              ["Meta", gbp(mk.meta), L(mk.lMeta), gbp(mk.cplMeta), mkP ? gbp(mkP.cplMeta) : "…"],
              ["Google", gbp(mk.google), L(mk.lGoogle), gbp(mk.cplGoogle), mkP ? gbp(mkP.cplGoogle) : "…"],
              ["Other (organic, direct, referral)", "—", L(mk.lOther), "—", "—"],
            ] : [["Loading…", "", "", "", ""]]}
            total={mk ? ["Total", gbp(mk.spend), L(mk.leads), gbp(mk.cpl), mkP ? gbp(mkP.cpl) : "…"] : null} />
          <div style={{ height: 12 }} />
          <Grid>
            <Stat label="New long-stay bookings" value={num(sale.newLong)} sub="Confirmed, excl. renewals" delta={<Delta cur={sale.newLong} prev={saleP.newLong} />} />
            <Stat label="Lead → booking" value={mk ? pct(mk.conv, 1) : "…"} sub="New long-stay ÷ CRM leads" delta={mk && mkP && <Delta cur={mk.conv} prev={mkP.conv} fmt={(v) => pct(v, 1)} />} />
            <Stat label="Short-stay bookings" value={num(sale.short)} sub="Confirmed, Nomad & < 28 nights" delta={<Delta cur={sale.short} prev={saleP.short} />} />
          </Grid>
        </>)}

        {snap && sale && tab === "sales" && (<>
          <H right={pills}>Bookings made</H>
          <Grid min={140}>
            <Stat label="Enquiries" value={num(sale.enq)} delta={<Delta cur={sale.enq} prev={saleP.enq} />} />
            <Stat label="Bookings made" value={num(sale.made.length)} delta={<Delta cur={sale.made.length} prev={saleP.made.length} />} />
            <Stat label="Confirmed" value={num(sale.confd.length)} color={C.good} sub={sale.made.length ? pct(sale.confd.length / sale.made.length) + " of made" : null} delta={<Delta cur={sale.confd.length} prev={saleP.confd.length} />} />
            <Stat label="Pending" value={num(sale.pend)} color={C.warn} delta={<Delta cur={sale.pend} prev={saleP.pend} />} />
            <Stat label="Cancelled" value={num(sale.canc)} color={C.bad} delta={<Delta cur={sale.canc} prev={saleP.canc} lowerIsBetter />} />
            <Stat label="Expired holds" value={num(sale.exp)} delta={<Delta cur={sale.exp} prev={saleP.exp} lowerIsBetter />} />
          </Grid>

          <H>Long stay vs short stay</H>
          <Table cols={["", "Made", "Confirmed", "Prev confirmed", "Pending", "Cancelled", "Avg length", "Avg £/week", "Value"]}
            rows={["Long stay — new", "Long stay — renewal", "Short stay"].map((k) => {
              const m = sale.made.filter((r) => r.kind === k), c = m.filter((r) => r.st === "Confirmed"), w = c.map(weekly).filter((x) => x);
              return [k, m.length, c.length, saleP.confd.filter((r) => r.kind === k).length, m.filter((r) => r.st === "Pending").length, m.filter((r) => r.st === "Cancelled").length,
                c.length ? Math.round(c.reduce((a, r) => a + r.days, 0) / c.length) + " nights" : "—", w.length ? gbp(w.reduce((a, b) => a + b, 0) / w.length) : "—", gbp(c.reduce((a, r) => a + (badRecord(r) ? 0 : r.total), 0))];
            })} />

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 12 }}>
            <div>
              <H>Long stay — length (confirmed)</H>
              {(() => { const cl = sale.confd.filter((r) => !isShort(r)); const rows = LOS.map((b) => { const x = cl.filter((r) => losBand(r.days) === b.key); return [b.key, x.filter((r) => r.kind === "Long stay — new").length, x.filter((r) => r.kind === "Long stay — renewal").length, x.length]; });
                return <Table cols={["Length", "New", "Renewal", "Total"]} rows={rows} total={["Total", rows.reduce((a, r) => a + r[1], 0), rows.reduce((a, r) => a + r[2], 0), cl.length]} />; })()}
            </div>
            <div>
              <H>Room type (confirmed)</H>
              {(() => { const rows = TYPES.map((t) => [tl(t), sale.confd.filter((r) => r.type === t).length]).filter((r) => r[1]); return <Table cols={["Room type", "Bookings"]} rows={rows.length ? rows : [["—", 0]]} total={["Total", sale.confd.length]} />; })()}
            </div>
          </div>

          <H>All bookings in period</H>
          <Table cols={["Booked", "Guest", "Room", "Type", "Arrives", "Nights", "£/week", "Kind", "Status"]}
            rows={sale.recs.map((r) => [fmtDate(r.created), r.guest || "—", r.room, tl(r.type), fmtDate(r.start), r.days, weekly(r) ? gbp(weekly(r)) : "—", r.kind.replace("Long stay — ", "LS "), <Tag key={r.id} s={r.st} />])} />
        </>)}

        {snap && tab === "renewals" && (() => {
          const sel = renewals.find((m) => m.k === month) || renewals[1];
          const all = renewals.reduce((a, m) => a.concat(m.entries.filter((e) => e.nw && sane(e.cur) && sane(e.nw)).map((e) => e.nw / e.cur - 1)), []);
          return (<>
            <H>Contracts ending by month</H>
            <Table cols={["Month", "Ending", "Renewed", "Pending", "Leaving", "Undecided", "Renewal rate", "Avg rate change"]}
              rows={renewals.map((m) => [
                <button key={m.k} onClick={() => setMonth(m.k)} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", fontWeight: m.k === sel.k ? 800 : 500, color: m.k === sel.k ? C.accent : C.text, fontSize: 13 }}>{m.label}</button>,
                m.total, m.renewed, m.pending, m.leaving, m.undecided, m.total ? pct(m.renewed / m.total) : "—", m.uplift != null ? (m.uplift >= 0 ? "+" : "") + pct(m.uplift, 1) : "—"])}
              total={["Total", ...["total", "renewed", "pending", "leaving", "undecided"].map((f) => renewals.reduce((a, m) => a + m[f], 0)),
                pct(renewals.reduce((a, m) => a + m.renewed, 0) / Math.max(1, renewals.reduce((a, m) => a + m.total, 0))), all.length ? "+" + pct(all.reduce((a, b) => a + b, 0) / all.length, 1) : "—"]} />
            <H right={<span style={{ fontSize: 12, color: C.muted }}>{sel.total} contracts</span>}>{sel.label}</H>
            <Grid min={140}>
              <Stat label="Renewed" value={sel.renewed} color={C.good} />
              <Stat label="Pending" value={sel.pending} color={C.warn} />
              <Stat label="Leaving" value={sel.leaving} color={C.bad} />
              <Stat label="Undecided" value={sel.undecided} />
              <Stat label="Renewal rate" value={sel.total ? pct(sel.renewed / sel.total) : "—"} />
              <Stat label="Avg rate change" value={sel.uplift != null ? (sel.uplift >= 0 ? "+" : "") + pct(sel.uplift, 1) : "—"} />
            </Grid>
            <div style={{ height: 12 }} />
            <Table cols={["Guest", "Room", "Type", "Ends", "Current £/wk", "Status", "New £/wk", "Change"]}
              rows={sel.entries.map((e) => [e.guest || "—", e.room, tl(e.type), fmtDate(e.end), gbp(e.cur), <Tag key={e.id} s={e.st} />, e.nw ? gbp(e.nw) : "—", e.nw && e.cur ? pct(e.nw / e.cur - 1, 1) : "—"])} />
          </>);
        })()}
      </div>
    </div>
  );
}
