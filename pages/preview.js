// pages/preview.js — simplified Southall dashboard (Snapshot · Sales · Renewals).
// All property and sales figures come from the Lavanda snapshot (/api/snapshot);
// spend and leads from Meta / Google Ads via Windsor. No commentary, data only.
import { useEffect, useMemo, useState } from "react";
import Head from "next/head";
import { BEDS, OFFLINE_ROOMS, OFFLINE_UNLISTED } from "../lib/offline";

const C = { bg: "#F6F5F2", card: "#FFFFFF", text: "#1B1B1B", muted: "#7A7A7A", line: "#E7E4DE", accent: "#1F3864", good: "#2E7D4F", warn: "#B7791F", bad: "#B23B3B" };
const TYPES = ["Nomad", "Nook", "Snug", "Cosy", "Roomy", "Spacious", "Deluxe Accessible", "Deluxe"];
const TYPE_LABEL = { "Deluxe Accessible": "Accessible" };
const tl = (t) => TYPE_LABEL[t] || t;

const iso = (d) => d.toISOString().slice(0, 10);
const addDays = (s, n) => { const d = new Date(s + "T00:00:00Z"); d.setUTCDate(d.getUTCDate() + n); return iso(d); };
const dayDiff = (a, b) => Math.round((new Date(b + "T00:00:00Z") - new Date(a + "T00:00:00Z")) / 864e5);
const gbp = (n, dp = 0) => (n == null || isNaN(n) ? "—" : "£" + Number(n).toLocaleString("en-GB", { minimumFractionDigits: dp, maximumFractionDigits: dp }));
const num = (n) => (n == null || isNaN(n) ? "—" : Number(n).toLocaleString("en-GB"));
const pct = (n, dp = 0) => (n == null || isNaN(n) || !isFinite(n) ? "—" : (n * 100).toFixed(dp) + "%");
const fmtDate = (s) => (s ? new Date(s + "T00:00:00Z").toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" }) : "—");
const weekly = (s) => (s.days > 0 && s.total > 0 ? (s.total / s.days) * 7 : null);
// AWR sanity band: drops £0 staff stays and mis-keyed totals in Lavanda
const sane = (w) => w != null && w >= 100 && w <= 1000;

function periodRange(key, today) {
  if (key === "7d") return { from: addDays(today, -6), to: today, label: "Last 7 days" };
  if (key === "30d") return { from: addDays(today, -29), to: today, label: "Last 30 days" };
  if (key === "mtd") return { from: today.slice(0, 8) + "01", to: today, label: "Month to date" };
  const d = new Date(today.slice(0, 8) + "01T00:00:00Z"); d.setUTCDate(0);
  return { from: iso(d).slice(0, 8) + "01", to: iso(d), label: "Last month" };
}

const isLive = (s) => !s.canceled && s.status !== "canceled" && s.status !== "inquiry" && !s.status.endsWith("_expired");
const isConfirmed = (s) => !s.canceled && s.status === "confirmed";
const isShort = (s) => s.nomad || s.days < 28;

// A long-stay record is a renewal if the same guest had a stay ending within
// 30 days before → 14 days after its start (same rule as the renewals tracker).
function buildRenewalIndex(sales) {
  const byContact = {};
  sales.filter(isLive).forEach((s) => { if (s.contact && s.contact !== "|") (byContact[s.contact] = byContact[s.contact] || []).push(s); });
  const isRenewal = new Set();
  const followOn = {};
  Object.values(byContact).forEach((list) => {
    list.forEach((a) => list.forEach((b) => {
      if (a === b || b.start <= a.start) return;
      const gap = dayDiff(a.end, b.start);
      if (gap >= -30 && gap <= 14) {
        if (!a.nomad && !b.nomad) isRenewal.add(b.id);
        const prev = followOn[a.id];
        const rank = (x) => (isConfirmed(x) ? 2 : x.status === "tentative" ? 1 : 0);
        if (!prev || rank(b) > rank(prev)) followOn[a.id] = b;
      }
    }));
  });
  return { isRenewal, followOn };
}

const LOS = [
  { key: "1–2 months", max: 85 },
  { key: "3–5 months", max: 175 },
  { key: "6–11 months", max: 360 },
  { key: "12 months +", max: Infinity },
];
const losBand = (d) => LOS.find((b) => d < b.max).key;

// ─── UI bits ────────────────────────────────────────────────────────────────
const Card = ({ children, style }) => <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 12, padding: 18, ...style }}>{children}</div>;
const Stat = ({ label, value, sub, color }) => (
  <Card style={{ padding: "14px 16px" }}>
    <div style={{ fontSize: 11, letterSpacing: 0.6, textTransform: "uppercase", color: C.muted, marginBottom: 6 }}>{label}</div>
    <div style={{ fontSize: 26, fontWeight: 700, color: color || C.text, fontVariantNumeric: "tabular-nums" }}>{value}</div>
    {sub != null && <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>{sub}</div>}
  </Card>
);
const Grid = ({ min = 160, children }) => <div style={{ display: "grid", gridTemplateColumns: `repeat(auto-fill, minmax(${min}px, 1fr))`, gap: 12 }}>{children}</div>;
const H = ({ children, right }) => (
  <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", margin: "28px 0 12px" }}>
    <h2 style={{ fontSize: 15, fontWeight: 700, margin: 0, letterSpacing: 0.2 }}>{children}</h2>{right}
  </div>
);
const th = { textAlign: "right", padding: "8px 10px", fontSize: 11, fontWeight: 600, color: C.muted, textTransform: "uppercase", letterSpacing: 0.5, borderBottom: `1px solid ${C.line}`, whiteSpace: "nowrap" };
const td = { textAlign: "right", padding: "8px 10px", fontSize: 13, borderBottom: `1px solid ${C.line}`, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" };
const Table = ({ cols, rows, total }) => (
  <Card style={{ padding: 0, overflowX: "auto" }}>
    <table style={{ width: "100%", borderCollapse: "collapse" }}>
      <thead><tr>{cols.map((c, i) => <th key={i} style={{ ...th, textAlign: i === 0 ? "left" : "right" }}>{c}</th>)}</tr></thead>
      <tbody>
        {rows.map((r, i) => <tr key={i}>{r.map((v, j) => <td key={j} style={{ ...td, textAlign: j === 0 ? "left" : "right" }}>{v}</td>)}</tr>)}
        {total && <tr>{total.map((v, j) => <td key={j} style={{ ...td, textAlign: j === 0 ? "left" : "right", fontWeight: 700, borderBottom: "none", background: "#FAF9F7" }}>{v}</td>)}</tr>}
      </tbody>
    </table>
  </Card>
);
const Pill = ({ on, onClick, children }) => (
  <button onClick={onClick} style={{ border: `1px solid ${on ? C.accent : C.line}`, background: on ? C.accent : C.card, color: on ? "#fff" : C.text, borderRadius: 999, padding: "6px 14px", fontSize: 13, cursor: "pointer" }}>{children}</button>
);
const STATUS_COLOR = { Renewed: C.good, Pending: C.warn, Leaving: C.bad, Undecided: C.muted, Confirmed: C.good, Cancelled: C.bad, "Expired hold": C.muted, Enquiry: C.muted };
const Tag = ({ s }) => <span style={{ color: STATUS_COLOR[s] || C.text, fontWeight: 600 }}>{s}</span>;

// ─── Page ───────────────────────────────────────────────────────────────────
export default function Preview() {
  const [tab, setTab] = useState("snapshot");
  const [period, setPeriod] = useState("7d");
  const [snap, setSnap] = useState(null);
  const [err, setErr] = useState(null);
  const [rstate, setRstate] = useState({ leaving: [], pending: [] });
  const [mkt, setMkt] = useState({});
  const [month, setMonth] = useState(null);
  const today = useMemo(() => iso(new Date()), []);
  const range = periodRange(period, today);

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
    return () => { dead = true; };
  }, []);

  useEffect(() => {
    const k = `${range.from}|${range.to}`;
    if (mkt[k]) return;
    (async () => {
      const get = async (u) => { try { const j = await (await fetch(u)).json(); return j.data || null; } catch { return null; } };
      const [m, g] = await Promise.all([
        get(`/api/meta?dateFrom=${range.from}&dateTo=${range.to}&property=southall`),
        get(`/api/google?dateFrom=${range.from}&dateTo=${range.to}&property=southall`),
      ]);
      setMkt((x) => ({ ...x, [k]: { m, g } }));
    })();
  }, [range.from, range.to]); // eslint-disable-line

  const sales = snap?.sales || [];
  const ren = useMemo(() => buildRenewalIndex(sales), [snap]); // eslint-disable-line

  // ─── Property snapshot (today) ───────────────────────────────────────────
  const prop = useMemo(() => {
    if (!snap) return null;
    const units = snap.allUnits || [];
    const typeOf = {}; units.forEach((u) => { typeOf[u.room] = u.type; });
    const offline = OFFLINE_ROOMS.filter((o) => o.from <= today && o.until >= today).map((o) => o.room);
    const offSet = new Set(offline);
    const inHouse = sales.filter((s) => isConfirmed(s) && s.start <= today && s.end >= today);
    const rows = TYPES.map((t) => {
      const rooms = units.filter((u) => u.type === t).length;
      const off = offline.filter((r) => typeOf[r] === t).length;
      const stays = inHouse.filter((s) => s.type === t && !offSet.has(s.room));
      const occ = new Set(stays.map((s) => s.room)).size;
      const w = stays.map(weekly).filter(sane);
      return { t, rooms, off, usable: rooms - off, occ, awr: w.length ? w.reduce((a, b) => a + b, 0) / w.length : null, wSum: w.reduce((a, b) => a + b, 0), wN: w.length };
    });
    const recordRooms = rows.reduce((a, r) => a + r.rooms, 0);
    const offTotal = offline.length + OFFLINE_UNLISTED;
    const usable = BEDS - offTotal;
    const occ = rows.reduce((a, r) => a + r.occ, 0);
    const wSum = rows.reduce((a, r) => a + r.wSum, 0), wN = rows.reduce((a, r) => a + r.wN, 0);
    const ls = rows.filter((r) => r.t !== "Nomad");
    const lsW = ls.reduce((a, r) => a + r.wSum, 0) / Math.max(1, ls.reduce((a, r) => a + r.wN, 0));
    return { rows, recordRooms, offTotal, usable, occ, people: inHouse.length, awr: wN ? wSum / wN : null, lsAwr: lsW, nomad: rows.find((r) => r.t === "Nomad") };
  }, [snap, today]); // eslint-disable-line

  // ─── Sales in the selected period ────────────────────────────────────────
  const sale = useMemo(() => {
    const inP = sales.filter((s) => s.created && s.created >= range.from && s.created <= range.to);
    const kind = (s) => (isShort(s) ? "Short stay" : ren.isRenewal.has(s.id) ? "Long stay — renewal" : "Long stay — new");
    const statusOf = (s) => (s.canceled || s.status === "canceled" ? "Cancelled" : s.status === "inquiry" ? "Enquiry" : s.status.endsWith("_expired") ? "Expired hold" : s.status === "tentative" ? "Pending" : "Confirmed");
    const recs = inP.map((s) => ({ ...s, kind: kind(s), st: statusOf(s) })).sort((a, b) => b.created.localeCompare(a.created));
    const made = recs.filter((r) => r.st !== "Enquiry");
    const cnt = (f) => recs.filter(f).length;
    const byKind = ["Long stay — new", "Long stay — renewal", "Short stay"].map((k) => {
      const m = made.filter((r) => r.kind === k), c = m.filter((r) => r.st === "Confirmed");
      const w = c.map(weekly).filter((x) => x != null && x > 0);
      return [k, m.length, c.length, m.filter((r) => r.st === "Pending").length, m.filter((r) => r.st === "Cancelled").length,
        c.length ? Math.round(c.reduce((a, r) => a + r.days, 0) / c.length) + " nights" : "—",
        w.length ? gbp(w.reduce((a, b) => a + b, 0) / w.length) : "—", gbp(c.reduce((a, r) => a + r.total, 0))];
    });
    const confLong = made.filter((r) => r.st === "Confirmed" && !isShort(r));
    const los = LOS.map((b) => [b.key, confLong.filter((r) => losBand(r.days) === b.key && r.kind === "Long stay — new").length, confLong.filter((r) => losBand(r.days) === b.key && r.kind === "Long stay — renewal").length, confLong.filter((r) => losBand(r.days) === b.key).length]);
    const conf = made.filter((r) => r.st === "Confirmed");
    const types = TYPES.map((t) => [tl(t), conf.filter((r) => r.type === t).length]).filter((r) => r[1] > 0);
    return {
      recs, made: made.length, enq: cnt((r) => r.st === "Enquiry"), conf: conf.length, pend: cnt((r) => r.st === "Pending"),
      canc: cnt((r) => r.st === "Cancelled"), exp: cnt((r) => r.st === "Expired hold"), byKind, los, types,
      newLong: conf.filter((r) => r.kind === "Long stay — new").length,
      shortConf: conf.filter((r) => r.kind === "Short stay").length,
      confLongAll: confLong.length,
    };
  }, [snap, range.from, range.to, ren]); // eslint-disable-line

  // ─── Renewals by contract end month ──────────────────────────────────────
  const renewals = useMemo(() => {
    const leaving = new Set((rstate.leaving || []).map(String)), pending = new Set((rstate.pending || []).map(String));
    const byMonth = {};
    sales.filter((s) => isConfirmed(s) && !s.nomad && s.days >= 28 && s.total > 0).forEach((s) => {
      const k = s.end.slice(0, 7);
      const m = (byMonth[k] = byMonth[k] || {});
      const key = s.contact || s.id;
      if (!m[key] || s.end > m[key].end) m[key] = s;
    });
    const months = [];
    for (let i = -1; i <= 6; i++) {
      const d = new Date(today.slice(0, 8) + "01T00:00:00Z"); d.setUTCMonth(d.getUTCMonth() + i);
      const k = iso(d).slice(0, 7);
      const entries = Object.values(byMonth[k] || {}).map((s) => {
        const f = ren.followOn[s.id];
        let st;
        if (leaving.has(String(s.id))) st = "Leaving";
        else if (f && isConfirmed(f)) st = "Renewed";
        else if ((f && f.status === "tentative") || pending.has(String(s.id))) st = "Pending";
        else if (s.end < today) st = "Leaving";
        else st = "Undecided";
        const cur = weekly(s), nw = f && isConfirmed(f) ? weekly(f) : null;
        return { ...s, st, cur, nw, f };
      }).sort((a, b) => a.end.localeCompare(b.end));
      const c = (x) => entries.filter((e) => e.st === x).length;
      months.push({ k, label: d.toLocaleDateString("en-GB", { month: "short", year: "numeric", timeZone: "UTC" }), entries, total: entries.length, renewed: c("Renewed"), pending: c("Pending"), leaving: c("Leaving"), undecided: c("Undecided") });
    }
    return months;
  }, [snap, rstate, ren, today]); // eslint-disable-line

  const mk = mkt[`${range.from}|${range.to}`];
  const mSpend = mk?.m?.totalSpend ?? null, gSpend = mk?.g?.totalSpend ?? null;
  const mLeads = mk?.m?.totalLeads ?? null, gLeads = mk?.g?.totalConversions ?? null;
  const spend = (mSpend || 0) + (gSpend || 0), leads = (mLeads || 0) + (gLeads || 0);
  const mkLoaded = !!mk;

  const periodPills = (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
      {[["7d", "7 days"], ["30d", "30 days"], ["mtd", "Month to date"], ["lm", "Last month"]].map(([k, l]) => <Pill key={k} on={period === k} onClick={() => setPeriod(k)}>{l}</Pill>)}
    </div>
  );
  const rangeTxt = <span style={{ fontSize: 12, color: C.muted }}>{fmtDate(range.from)} – {fmtDate(range.to)}</span>;

  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.text, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" }}>
      <Head><title>&Soul Southall</title><meta name="viewport" content="width=device-width, initial-scale=1" /></Head>
      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "22px 18px 60px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800 }}>&amp;Soul Southall</div>
            <div style={{ fontSize: 12, color: C.muted }}>{snap ? `Lavanda · updated ${new Date(snap.builtAt).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}` : "Loading…"}</div>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {[["snapshot", "Snapshot"], ["sales", "Sales"], ["renewals", "Renewals"]].map(([k, l]) => <Pill key={k} on={tab === k} onClick={() => setTab(k)}>{l}</Pill>)}
          </div>
        </div>

        {err && <Card style={{ marginTop: 20, color: C.bad }}>{err}</Card>}
        {!snap && !err && <Card style={{ marginTop: 20, color: C.muted }}>Loading Lavanda data…</Card>}

        {snap && prop && tab === "snapshot" && (<>
          <H right={<span style={{ fontSize: 12, color: C.muted }}>Today · {fmtDate(today)}</span>}>Property</H>
          <Grid>
            <Stat label="Occupancy" value={pct(prop.occ / prop.usable, 1)} sub={`${prop.occ} of ${prop.usable} usable rooms`} />
            <Stat label="Residents in house" value={num(prop.people)} sub="Active stays today" />
            <Stat label="Rooms empty" value={num(prop.usable - prop.occ)} sub="Usable, not occupied" />
            <Stat label="Rooms offline" value={num(prop.offTotal)} sub={`of ${BEDS} rooms`} />
            <Stat label="AWR — building" value={gbp(prop.awr)} sub="Avg weekly rate, in house" />
            <Stat label="AWR — long stay" value={gbp(prop.lsAwr)} sub={`Nomad ${gbp(prop.nomad?.awr)}/wk`} />
          </Grid>
          <div style={{ height: 12 }} />
          <Table
            cols={["Room type", "Rooms", "Offline", "Usable", "Occupied", "Empty", "Occupancy", "AWR"]}
            rows={prop.rows.map((r) => [tl(r.t), r.rooms, r.off || "—", r.usable, r.occ, r.usable - r.occ, pct(r.occ / r.usable), gbp(r.awr)])}
            total={["Total", BEDS, prop.offTotal, prop.usable, prop.occ, prop.usable - prop.occ, pct(prop.occ / prop.usable, 1), gbp(prop.awr)]}
          />
          {(OFFLINE_UNLISTED > 0 || prop.recordRooms !== BEDS) && (
            <div style={{ fontSize: 11, color: C.muted, marginTop: 6 }}>
              Total row uses {BEDS} rooms and {prop.offTotal} offline ({prop.offTotal - OFFLINE_UNLISTED} by room type + {OFFLINE_UNLISTED} not yet assigned to a room).
            </div>
          )}

          <H right={<div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>{rangeTxt}{periodPills}</div>}>Marketing</H>
          <Grid>
            <Stat label="Spend" value={mkLoaded ? gbp(spend) : "…"} sub={mkLoaded ? `Meta ${gbp(mSpend)} · Google ${gbp(gSpend)}` : null} />
            <Stat label="Leads" value={mkLoaded ? num(leads) : "…"} sub={mkLoaded ? `Meta ${num(mLeads)} · Google ${num(gLeads)}` : null} />
            <Stat label="Cost per lead" value={mkLoaded && leads ? gbp(spend / leads) : "—"} sub={mkLoaded ? `Meta ${mLeads ? gbp(mSpend / mLeads) : "—"} · Google ${gLeads ? gbp(gSpend / gLeads) : "—"}` : null} />
          </Grid>

          <H right={rangeTxt}>Customer acquisition</H>
          <Grid>
            <Stat label="New long-stay bookings" value={num(sale.newLong)} sub="Confirmed, excl. renewals" />
            <Stat label="CAC" value={mkLoaded && sale.newLong ? gbp(spend / sale.newLong) : "—"} sub="Spend ÷ new long-stay bookings" />
            <Stat label="Lead → booking" value={mkLoaded && leads ? pct(sale.newLong / leads, 1) : "—"} sub="New long-stay bookings ÷ leads" />
            <Stat label="Short-stay bookings" value={num(sale.shortConf)} sub="Confirmed, Nomad & < 28 nights" />
          </Grid>
        </>)}

        {snap && tab === "sales" && (<>
          <H right={<div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>{rangeTxt}{periodPills}</div>}>Bookings made</H>
          <Grid min={140}>
            <Stat label="Enquiries" value={num(sale.enq)} />
            <Stat label="Bookings made" value={num(sale.made)} />
            <Stat label="Confirmed" value={num(sale.conf)} color={C.good} sub={sale.made ? pct(sale.conf / sale.made) + " of made" : null} />
            <Stat label="Pending" value={num(sale.pend)} color={C.warn} />
            <Stat label="Cancelled" value={num(sale.canc)} color={C.bad} />
            <Stat label="Expired holds" value={num(sale.exp)} />
          </Grid>

          <H>Long stay vs short stay</H>
          <Table cols={["", "Made", "Confirmed", "Pending", "Cancelled", "Avg length", "Avg weekly rate", "Value"]} rows={sale.byKind} />

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 12 }}>
            <div>
              <H>Long stay — length (confirmed)</H>
              <Table cols={["Length", "New", "Renewal", "Total"]} rows={sale.los} total={["Total", sale.los.reduce((a, r) => a + r[1], 0), sale.los.reduce((a, r) => a + r[2], 0), sale.confLongAll]} />
            </div>
            <div>
              <H>Room type (confirmed)</H>
              <Table cols={["Room type", "Bookings"]} rows={sale.types.length ? sale.types : [["—", 0]]} total={["Total", sale.conf]} />
            </div>
          </div>

          <H>All bookings in period</H>
          <Table
            cols={["Booked", "Guest", "Room", "Type", "Arrives", "Nights", "£/week", "Kind", "Status"]}
            rows={sale.recs.map((r) => [fmtDate(r.created), r.guest || "—", r.room, tl(r.type), fmtDate(r.start), r.days, weekly(r) ? gbp(weekly(r)) : "—", r.kind.replace("Long stay — ", "LS "), <Tag key={r.id} s={r.st} />])}
          />
        </>)}

        {snap && tab === "renewals" && (() => {
          const sel = renewals.find((m) => m.k === month) || renewals[1];
          return (<>
            <H>Contracts ending by month</H>
            <Table
              cols={["Month", "Ending", "Renewed", "Pending", "Leaving", "Undecided", "Renewal rate"]}
              rows={renewals.map((m) => [
                <button key={m.k} onClick={() => setMonth(m.k)} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", fontWeight: m.k === sel.k ? 800 : 500, color: m.k === sel.k ? C.accent : C.text, fontSize: 13 }}>{m.label}</button>,
                m.total, m.renewed, m.pending, m.leaving, m.undecided, m.total ? pct(m.renewed / m.total) : "—"])}
              total={["Total", ...["total", "renewed", "pending", "leaving", "undecided"].map((f) => renewals.reduce((a, m) => a + m[f], 0)), pct(renewals.reduce((a, m) => a + m.renewed, 0) / Math.max(1, renewals.reduce((a, m) => a + m.total, 0)))]}
            />
            <H right={<span style={{ fontSize: 12, color: C.muted }}>{sel.total} contracts</span>}>{sel.label}</H>
            <Grid min={140}>
              <Stat label="Renewed" value={sel.renewed} color={C.good} />
              <Stat label="Pending" value={sel.pending} color={C.warn} />
              <Stat label="Leaving" value={sel.leaving} color={C.bad} />
              <Stat label="Undecided" value={sel.undecided} />
              <Stat label="Renewal rate" value={sel.total ? pct(sel.renewed / sel.total) : "—"} />
            </Grid>
            <div style={{ height: 12 }} />
            <Table
              cols={["Guest", "Room", "Type", "Ends", "Current £/wk", "Status", "New £/wk", "Change"]}
              rows={sel.entries.map((e) => [e.guest || "—", e.room, tl(e.type), fmtDate(e.end), gbp(e.cur), <Tag key={e.id} s={e.st} />, e.nw ? gbp(e.nw) : "—", e.nw && e.cur ? pct(e.nw / e.cur - 1, 1) : "—"])}
            />
          </>);
        })()}
      </div>
    </div>
  );
}
