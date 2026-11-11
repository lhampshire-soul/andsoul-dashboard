// components/Reputation.js — reputation view (Google, Booking.com, Airbnb, Trustpilot)
// carried over from the classic dashboard, restyled for the light dashboard.
import { useMemo, useState } from "react";
const C = { bg: "#F6F5F2", card: "#FFFFFF", border: "#E7E4DE", gold: "#B7791F", sage: "#2E7D4F", rose: "#B23B3B", text: "#1B1B1B", muted: "#7A7A7A", blue: "#2F6FB0" };

// ─── REPUTATION ────────────────────────────────────────────────────────────
// TrustYou-style reputation view built only from connected sources. Category
// sentiment is keyword-based (v1) over the review text we hold — labelled as
// such in the UI. Nothing is estimated when a source is not connected.
const REP_CATEGORIES = [
  { key: "staff",       label: "Staff & Service",     re: /\b(staff|reception|team|yasm[ie]n|tamika|security|helpful|welcoming|professional|management|manager|front of house)\b/i },
  { key: "cleanliness", label: "Cleanliness",         re: /\b(clean|dirty|filthy|hygien|black marks|dust|murky|razor)\w*/i },
  { key: "room",        label: "Room & Comfort",      re: /\b(room|bed|tiny|spacious|comfort|comfy|studio)\w*/i },
  { key: "climate",     label: "Air Con & Ventilation", re: /\b(air ?con|ac\b|ventilat|vents?|breathe|air quality|hot|heatwave|degrees|windows? (don't|do not|can't|sealed)|temperature|cold)\w*/i },
  { key: "maintenance", label: "Maintenance & Lifts", re: /\b(lift|lifts|broken|maintenance|repair|electric|tripping|leak|oven|gate|malfunction)\w*/i },
  { key: "facilities",  label: "Facilities & Wellness", re: /\b(sauna|cold plunge|gym|spa|pilates|yoga|trx|co-?working|studio|terrace|garden|pool|meditation|podcast|laundry|kitchen|facilit)\w*/i },
  { key: "community",   label: "Community & Events",  re: /\b(community|friends|connections|events|dinner|vibe|atmosphere|social|welcome)\w*/i },
  { key: "location",    label: "Location & Transport", re: /\b(location|heathrow|airport|transport|shuttle|links|local area|view)\w*/i },
  { key: "value",       label: "Value & Price",       re: /\b(price|pricing|value|expensive|cheap|fees?|exchange rate|£\d+)\w*/i },
  { key: "deposit",     label: "Deposit & Contract",  re: /\b(deposit|contract|licen[cs]e|refund|withh[eo]ld|cancel)\w*/i },
  { key: "pests",       label: "Pests",               re: /\b(rat|rats|rodent|pest|infestation|droppings)\b/i },
  { key: "food",        label: "Food & Breakfast",    re: /\b(breakfast|food|meal|toast|cafe|bar|fridge)\w*/i },
];
const REP_WINDOWS = [
  { key: "7d",  label: "Last 7 days",  days: 7 },
  { key: "30d", label: "Last 30 days", days: 30 },
  { key: "3m",  label: "Previous 3 months", days: 92 },
  { key: "6m",  label: "Previous 6 months", days: 183 },
  { key: "12m", label: "Previous 12 months", days: 365 },
];
const repPct = (rating, scale) => rating != null && scale ? Math.round((rating / scale) * 100) : null;
const repCol = (p) => p == null ? C.muted : p >= 80 ? C.sage : p >= 60 ? C.gold : C.rose;
const SRC_META = {
  trustpilot: { color: "#00b67a", glyph: "★" },
  google:     { color: "#4285f4", glyph: "G" },
  booking:    { color: "#003580", glyph: "B" },
  airbnb:     { color: "#ff5a5f", glyph: "A" },
  tripadvisor:{ color: "#34e0a1", glyph: "T" },
};

function computeReputation(data, windowKey) {
  const sources = (data?.sources || []);
  const connected = sources.filter(s => s.connected && s.rating != null);
  const win = REP_WINDOWS.find(w => w.key === windowKey) || REP_WINDOWS[4];
  const now = new Date(); const from = new Date(now.getTime() - win.days * 864e5);
  const prevFrom = new Date(from.getTime() - win.days * 864e5);
  const iso = d => d.toISOString().slice(0, 10);
  const allReviews = connected.flatMap(s => (s.reviews || []).map(r => ({ ...r, source: s.key, sourceName: s.name, scale: s.scale || 5 })));
  const inWin = allReviews.filter(r => r.date >= iso(from) && r.date <= iso(now));
  const inPrev = allReviews.filter(r => r.date >= iso(prevFrom) && r.date < iso(from));

  // Overall score: count-weighted average of each source's lifetime rating, on /100
  const wSum = connected.reduce((a, s) => a + (s.count || 0), 0);
  const overall = wSum ? Math.round(connected.reduce((a, s) => a + repPct(s.rating, s.scale) * (s.count || 0), 0) / wSum) : null;
  // Performance in window: average star of reviews in window (/100) vs previous window
  const avg = (list) => list.length ? list.reduce((a, r) => a + (r.rating / r.scale) * 100, 0) / list.length : null;
  const perf = avg(inWin), perfPrev = avg(inPrev);

  // Categories over the window
  const cats = REP_CATEGORIES.map(c => {
    const hits = inWin.filter(r => c.re.test(`${r.title || ""} ${r.text || ""}`));
    const prevHits = inPrev.filter(r => c.re.test(`${r.title || ""} ${r.text || ""}`));
    const pos = hits.filter(r => r.rating / r.scale >= 0.8).length, neg = hits.filter(r => r.rating / r.scale <= 0.4).length;
    const score = hits.length ? Math.round(hits.reduce((a, r) => a + (r.rating / r.scale) * 10, 0) / hits.length * 10) / 10 : null;
    const prevScore = prevHits.length ? prevHits.reduce((a, r) => a + (r.rating / r.scale) * 10, 0) / prevHits.length : null;
    return { ...c, mentions: hits.length, pos, neg, neu: hits.length - pos - neg, score, trend: score != null && prevScore != null ? score - prevScore : null };
  }).filter(c => c.mentions > 0).sort((a, b) => b.mentions - a.mentions);
  const rated = cats.filter(c => c.mentions >= 2);
  const best = rated.length ? [...rated].sort((a, b) => b.score - a.score)[0] : null;
  const worst = rated.length ? [...rated].sort((a, b) => a.score - b.score)[0] : null;

  // Volume + responses in window
  const bySource = {};
  inWin.forEach(r => { bySource[r.sourceName] = (bySource[r.sourceName] || 0) + 1; });
  const topSource = Object.entries(bySource).sort((a, b) => b[1] - a[1])[0] || null;
  const replied = inWin.filter(r => r.replied).length;
  const negWin = inWin.filter(r => r.rating / r.scale <= 0.4);
  const negReplied = negWin.filter(r => r.replied).length;

  // Comparison: our Trustpilot vs named peers (public Trustpilot figures)
  const tp = connected.find(s => s.key === "trustpilot");
  const peers = tp?.competitors || [];
  const peerAvg = peers.length ? peers.reduce((a, p) => a + p.rating, 0) / peers.length : null;
  const compIndex = tp && peerAvg ? Math.round((tp.rating / peerAvg) * 100) / 100 : null;

  return { win, connected, overall, perf: perf != null ? Math.round(perf) : null, perfPrev: perfPrev != null ? Math.round(perfPrev) : null,
           cats, best, worst, inWin, inPrev, topSource, replied, negWin: negWin.length, negReplied, peers, peerAvg, compIndex, tp, allReviews };
}

const ScoreRing = ({ pct, size = 92, color, label }) => {
  const r = 40, c = 2 * Math.PI * r, d = pct == null ? 0 : (pct / 100) * c;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      <circle cx="50" cy="50" r={r} fill="none" stroke={C.border} strokeWidth="9"/>
      <circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="9" strokeDasharray={`${d} ${c}`} strokeDashoffset={c * 0.25} strokeLinecap="round"/>
      <text x="50" y="48" textAnchor="middle" fill={C.text} fontSize="24" fontWeight="800" fontFamily="DM Mono,monospace">{pct == null ? "—" : pct}</text>
      {label && <text x="50" y="64" textAnchor="middle" fill={C.muted} fontSize="8">{label}</text>}
    </svg>
  );
};

const RepCard = ({ title, children, right, style }) => (
  <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 16, ...style }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10, gap: 8 }}>
      <p style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{title}</p>
      {right}
    </div>
    {children}
  </div>
);

const sourcesOf = (data) => (data?.sources || []);
export default function ReputationTab({ data, loading, propertyName, investor }) {
  const [win, setWin] = useState("12m");
  const [expanded, setExpanded] = useState(null);
  const [filterCat, setFilterCat] = useState(null);
  const [detail, setDetail] = useState(false);
  const R = useMemo(() => computeReputation(data, win), [data, win]);
  const totalReviews = R.connected.reduce((a, s) => a + (s.count || 0), 0);
  const booking = sourcesOf(data).find(s => s.key === "booking" && s.connected);
  const unrepliedNeg = R.allReviews.filter(r => r.rating / r.scale <= 0.4 && !r.replied).sort((a, b) => b.date.localeCompare(a.date));
  const sources = data?.sources || [];
  const notConnected = sources.filter(s => !s.connected);
  const overallCol = repCol(R.overall);
  const label = (p) => p == null ? "No data" : p >= 90 ? "Excellent" : p >= 80 ? "Very good" : p >= 70 ? "Good" : p >= 60 ? "Fair" : "Poor";
  const sentBar = (c) => {
    const tot = c.mentions || 1;
    return (
      <div style={{ display: "flex", height: 8, borderRadius: 4, overflow: "hidden", width: 90, background: C.border }} title={`${c.pos} positive · ${c.neu} neutral · ${c.neg} negative`}>
        <div style={{ width: `${c.pos / tot * 100}%`, background: C.sage }}/>
        <div style={{ width: `${c.neu / tot * 100}%`, background: C.gold }}/>
        <div style={{ width: `${c.neg / tot * 100}%`, background: C.rose }}/>
      </div>
    );
  };
  const reviewsShown = (filterCat ? R.inWin.filter(r => REP_CATEGORIES.find(c => c.key === filterCat).re.test(`${r.title || ""} ${r.text || ""}`)) : R.inWin)
    .slice().sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 10, marginBottom: 14 }}>
        <div>
          <p style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: "0.1em" }}>{propertyName} · Guest reviews across platforms{loading ? " · loading…" : ""}</p>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: C.text, margin: "4px 0 0" }}>Reputation</h2>
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
          <button onClick={() => setDetail(v => !v)} style={{ padding: "5px 14px", borderRadius: 20, border: `1px solid ${detail ? C.gold : C.border}`, background: detail ? C.gold + "22" : "transparent", color: detail ? C.gold : C.muted, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>{detail ? "Simple view" : "Detailed view"}</button>
          {detail && <>
            <span style={{ fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 4px 0 8px" }}>Timeframe</span>
            {REP_WINDOWS.map(w => (
              <button key={w.key} onClick={() => setWin(w.key)} style={{ padding: "4px 12px", borderRadius: 20, border: `1px solid ${win === w.key ? C.gold : C.border}`, background: win === w.key ? C.gold + "22" : "transparent", color: win === w.key ? C.gold : C.muted, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>{w.label}</button>
            ))}
          </>}
        </div>
      </div>

      {/* ── HERO: one score, one line per platform ── */}
      {R.connected.length > 0 && (
        <div style={{ background: `linear-gradient(135deg, ${C.card}, ${C.bg})`, border: `1px solid ${overallCol}55`, borderRadius: 16, padding: 20, marginBottom: 12, display: "grid", gridTemplateColumns: "minmax(220px, 300px) 1fr", gap: 20, alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <ScoreRing pct={R.overall} size={110} color={overallCol} label="/100"/>
            <div>
              <p style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: "0.1em" }}>Overall reputation</p>
              <p style={{ fontSize: 22, fontWeight: 800, color: overallCol, lineHeight: 1.1, marginTop: 2 }}>{label(R.overall)}</p>
              <p style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>{totalReviews} reviews across {R.connected.length} platform{R.connected.length === 1 ? "" : "s"}</p>
              <p style={{ fontSize: 9, color: C.muted, marginTop: 2 }}>Weighted by review count · lifetime</p>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10 }}>
            {sources.map(s => {
              const m = SRC_META[s.key] || { color: C.muted, glyph: "•" };
              const p = s.connected ? repPct(s.rating, s.scale) : null;
              return (
                <a key={s.key} href={s.connected && s.url ? s.url : undefined} target="_blank" rel="noreferrer" style={{ textDecoration: "none", background: C.bg, border: `1px solid ${s.connected ? m.color + "55" : C.border}`, borderRadius: 12, padding: "10px 12px", opacity: s.connected ? 1 : 0.6, cursor: s.connected ? "pointer" : "default" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <span style={{ width: 22, height: 22, borderRadius: 6, background: m.color + "33", color: m.color, display: "inline-flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 11 }}>{m.glyph}</span>
                    <span style={{ fontSize: 11, color: C.text, fontWeight: 700 }}>{s.name}</span>
                  </div>
                  {s.connected && s.rating != null ? (<>
                    <p style={{ fontSize: 22, fontWeight: 800, color: repCol(p), fontFamily: "DM Mono,monospace", lineHeight: 1 }}>{s.rating}<span style={{ fontSize: 11, color: C.muted, fontWeight: 400 }}>/{s.scale}</span></p>
                    <p style={{ fontSize: 10, color: C.muted, marginTop: 4 }}>{s.count} reviews · {p}/100{s.label ? ` · ${s.label}` : ""}</p>
                  </>) : s.connected ? (<>
                    <p style={{ fontSize: 14, fontWeight: 700, color: C.text, lineHeight: 1 }}>New</p>
                    <p style={{ fontSize: 10, color: C.muted, marginTop: 4 }}>listed · no reviews yet</p>
                  </>) : (<>
                    <p style={{ fontSize: 14, fontWeight: 700, color: C.muted, lineHeight: 1 }}>—</p>
                    <p style={{ fontSize: 10, color: C.muted, marginTop: 4 }}>{s.notListed ? "not listed yet" : "not connected"}</p>
                  </>)}
                </a>
              );
            })}
          </div>
        </div>
      )}

      {/* ── SIMPLE VIEW: what guests rate + what needs a reply ── */}
      {!detail && R.connected.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12, marginBottom: 12 }}>
          {booking?.categories?.length > 0 && (
            <RepCard title="What guests rate — Booking.com" right={<span style={{ fontSize: 9, color: C.muted }}>platform category scores · /10</span>}>
              {[...booking.categories].sort((a, b) => b.score - a.score).map(c => (
                <div key={c.name} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 7 }}>
                  <span style={{ fontSize: 11, color: C.text, width: 110, flexShrink: 0 }}>{c.name}</span>
                  <div style={{ flex: 1, height: 7, background: C.border, borderRadius: 4 }}><div style={{ width: `${c.score * 10}%`, height: "100%", background: c.score >= 9 ? C.sage : c.score >= 8 ? "#3d82c4" : C.gold, borderRadius: 4 }}/></div>
                  <span style={{ fontSize: 12, fontFamily: "DM Mono,monospace", fontWeight: 700, color: C.text, width: 30, textAlign: "right" }}>{c.score}</span>
                </div>
              ))}
            </RepCard>
          )}
          {(() => { const g = sources.find(s => s.key === "google" && s.connected && s.topics?.length); if (!g || booking?.categories?.length) return null; return (
            <RepCard title="What guests talk about — Google" right={<span style={{ fontSize: 9, color: C.muted }}>review topics Google surfaces · mentions</span>}>
              {g.topics.map(tp => (
                <div key={tp.name} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 7 }}>
                  <span style={{ fontSize: 11, color: C.text, width: 110, flexShrink: 0, textTransform: "capitalize" }}>{tp.name}</span>
                  <div style={{ flex: 1, height: 7, background: C.border, borderRadius: 4 }}><div style={{ width: `${Math.min(100, tp.mentions / Math.max(...g.topics.map(x => x.mentions)) * 100)}%`, height: "100%", background: "#4285f4", borderRadius: 4 }}/></div>
                  <span style={{ fontSize: 12, fontFamily: "DM Mono,monospace", fontWeight: 700, color: C.text, width: 30, textAlign: "right" }}>{tp.mentions}×</span>
                </div>
              ))}
            </RepCard>
          ); })()}
          {R.cats.length > 0 && (
            <RepCard title={`What guests talk about — ${R.connected.filter(s => (s.reviews || []).length).map(s => s.name).join(" + ") || "reviews"}`} right={<span style={{ fontSize: 9, color: C.muted }}>last 12 months · keyword-based · /10</span>}>
              {[...R.cats].sort((a, b) => (b.score ?? 0) - (a.score ?? 0)).slice(0, 8).map(c => (
                <div key={c.key} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 7 }}>
                  <span style={{ fontSize: 11, color: C.text, width: 130, flexShrink: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.label}</span>
                  <div style={{ flex: 1, height: 7, background: C.border, borderRadius: 4 }}><div style={{ width: `${(c.score || 0) * 10}%`, height: "100%", background: c.score >= 8 ? C.sage : c.score >= 6 ? C.gold : C.rose, borderRadius: 4 }}/></div>
                  <span style={{ fontSize: 12, fontFamily: "DM Mono,monospace", fontWeight: 700, color: c.score >= 8 ? C.sage : c.score >= 6 ? C.gold : C.rose, width: 30, textAlign: "right" }}>{c.score}</span>
                  <span style={{ fontSize: 9, color: C.muted, width: 22, textAlign: "right" }}>{c.mentions}×</span>
                </div>
              ))}
            </RepCard>
          )}
          <RepCard title="Needs a reply" right={<span style={{ fontSize: 9, color: C.muted }}>negative reviews with no owner response</span>}>
            {unrepliedNeg.length ? (<>
              <p style={{ fontSize: 26, fontWeight: 800, color: C.rose, fontFamily: "DM Mono,monospace", lineHeight: 1, marginBottom: 8 }}>{unrepliedNeg.length}</p>
              {unrepliedNeg.slice(0, 4).map(r => (
                <div key={r.id} style={{ borderLeft: `3px solid ${C.rose}`, paddingLeft: 8, marginBottom: 6 }}>
                  <p style={{ fontSize: 11, color: C.text, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.title || r.text.slice(0, 60)}</p>
                  <p style={{ fontSize: 9, color: C.muted }}>{r.sourceName} · {new Date(r.date + "T00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })} · {Math.round(r.rating / r.scale * 5)}★</p>
                </div>
              ))}
              {R.tp?.response && <p style={{ fontSize: 10, color: C.muted, marginTop: 6 }}>Trustpilot: replied to {R.tp.response.negativeRepliedPct}% of negative reviews, {R.tp.response.typicalReplyTime}.</p>}
            </>) : <p style={{ fontSize: 12, color: C.sage }}>Every negative review we hold has an owner reply.</p>}
          </RepCard>
          {(booking?.highlights?.length || sources.find(s => s.key === "google")?.highlights?.length) ? (
            <RepCard title="Guests said" right={<span style={{ fontSize: 9, color: C.muted }}>platform-selected highlights</span>}>
              {(booking?.highlights || []).slice(0, 3).map((h, i) => <p key={"b" + i} style={{ fontSize: 11, color: C.text, marginBottom: 6, lineHeight: 1.5 }}>“{h.text}” <span style={{ color: C.muted, fontSize: 9 }}>— {h.author}, Booking.com</span></p>)}
              {(sources.find(s => s.key === "google")?.highlights || []).slice(0, 2).map((h, i) => <p key={"g" + i} style={{ fontSize: 11, color: C.text, marginBottom: 6, lineHeight: 1.5 }}>“{h}” <span style={{ color: C.muted, fontSize: 9 }}>— Google</span></p>)}
            </RepCard>
          ) : null}
        </div>
      )}

      {detail && <>

      {!R.connected.length && (
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 18, marginBottom: 16 }}>
          <p style={{ fontSize: 13, color: C.text, fontWeight: 700 }}>No review platform is connected for {propertyName} yet.</p>
          <p style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>Scores appear here only from live or collected platform data — nothing is estimated.</p>
        </div>
      )}

      {/* Row 1: Overall · Performance · Comparison · Sentiment */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: 12, marginBottom: 12 }}>
        <RepCard title="Overall score" right={<span style={{ fontSize: 9, color: C.muted }}>lifetime · all connected sources</span>}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 64, height: 64, borderRadius: 12, background: overallCol + "22", border: `1px solid ${overallCol}55`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 28, fontWeight: 800, color: overallCol, fontFamily: "DM Mono,monospace" }}>{R.overall ?? "—"}</span>
            </div>
            <div>
              <p style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{label(R.overall)}</p>
              <p style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>{R.connected.length ? `${R.connected.map(s => s.name).join(" + ")} · ${R.connected.reduce((a, s) => a + (s.count || 0), 0)} reviews` : "no connected sources"}</p>
              <p style={{ fontSize: 9, color: C.muted, marginTop: 2 }}>Count-weighted average of each platform's rating, on a 0–100 scale</p>
            </div>
          </div>
        </RepCard>
        <RepCard title="Performance" right={<span style={{ fontSize: 9, color: C.muted }}>{R.win.label.toLowerCase()}</span>}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <ScoreRing pct={R.perf} color={repCol(R.perf)} label="/100"/>
            <div>
              <p style={{ fontSize: 12, color: C.text }}>{R.inWin.length} review{R.inWin.length === 1 ? "" : "s"} in period</p>
              {R.perfPrev != null && R.perf != null && (
                <p style={{ fontSize: 11, color: R.perf >= R.perfPrev ? C.sage : C.rose, marginTop: 4 }}>{R.perf >= R.perfPrev ? "↑" : "↓"} {Math.abs(R.perf - R.perfPrev)} pts vs previous {R.win.days}d ({R.perfPrev})</p>
              )}
              {R.worst && <p style={{ fontSize: 10, color: C.rose, marginTop: 6 }}>↓ {R.worst.score} {R.worst.label} · {R.worst.neg} complaint{R.worst.neg === 1 ? "" : "s"}</p>}
              {R.best && <p style={{ fontSize: 10, color: C.sage, marginTop: 2 }}>↑ {R.best.score} {R.best.label} · {R.best.pos} compliment{R.best.pos === 1 ? "" : "s"}</p>}
            </div>
          </div>
        </RepCard>
        <RepCard title="Comparison" right={<span style={{ fontSize: 9, color: C.muted }}>Trustpilot peers</span>}>
          {R.compIndex != null ? (
            <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
              <div>
                <p style={{ fontSize: 28, fontWeight: 800, color: R.compIndex >= 1 ? C.sage : C.rose, fontFamily: "DM Mono,monospace", lineHeight: 1 }}>{R.compIndex.toFixed(2)}</p>
                <p style={{ fontSize: 10, color: C.muted, marginTop: 4 }}>CompIndex</p>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                {[{ n: propertyName, v: R.tp.rating, c: C.gold }, { n: "Peer average", v: R.peerAvg, c: C.muted }].map(x => (
                  <div key={x.n} style={{ marginBottom: 6 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: C.muted }}><span>{x.n}</span><span style={{ color: x.c, fontFamily: "DM Mono,monospace" }}>{repPct(x.v, 5)}/100</span></div>
                    <div style={{ height: 5, background: C.border, borderRadius: 3, marginTop: 3 }}><div style={{ width: `${repPct(x.v, 5)}%`, height: "100%", background: x.c, borderRadius: 3 }}/></div>
                  </div>
                ))}
                <p style={{ fontSize: 9, color: C.muted }} title={R.peers.map(p => `${p.name} ${p.rating} (${p.count})`).join(" · ")}>{R.peers.map(p => p.name).join(", ")}</p>
              </div>
            </div>
          ) : <p style={{ fontSize: 12, color: C.muted }}>Needs a connected Trustpilot profile.</p>}
        </RepCard>
        <RepCard title="Sentiment" right={<span style={{ fontSize: 9, color: C.muted }}>keyword-based · {R.win.label.toLowerCase()}</span>}>
          {R.best || R.worst ? (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <div>
                <p style={{ fontSize: 10, color: C.muted, marginBottom: 4 }}>Best rated</p>
                {R.best ? <><span style={{ fontSize: 11, background: C.sage + "22", color: C.sage, padding: "3px 8px", borderRadius: 8, fontWeight: 600 }}>{R.best.label}</span><p style={{ fontSize: 10, color: C.muted, marginTop: 6 }}><b style={{ color: C.sage }}>{R.best.mentions}</b> mentions · {R.best.score}/10</p></> : <p style={{ fontSize: 11, color: C.muted }}>—</p>}
              </div>
              <div>
                <p style={{ fontSize: 10, color: C.muted, marginBottom: 4 }}>Worst rated</p>
                {R.worst ? <><span style={{ fontSize: 11, background: C.rose + "22", color: C.rose, padding: "3px 8px", borderRadius: 8, fontWeight: 600 }}>{R.worst.label}</span><p style={{ fontSize: 10, color: C.muted, marginTop: 6 }}><b style={{ color: C.rose }}>{R.worst.mentions}</b> mentions · {R.worst.score}/10</p></> : <p style={{ fontSize: 11, color: C.muted }}>—</p>}
              </div>
            </div>
          ) : <p style={{ fontSize: 12, color: C.muted }}>Not enough reviews in this period.</p>}
        </RepCard>
      </div>

      {/* Row 2: Sources overview · Volume · Responses */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12, marginBottom: 12 }}>
        <RepCard title="Sources overview" right={<span style={{ fontSize: 9, color: C.muted }}>{sources.filter(s => s.connected).length} of {sources.length} connected</span>}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {sources.map(s => {
              const m = SRC_META[s.key] || { color: C.muted, glyph: "•" };
              const p = s.connected ? repPct(s.rating, s.scale) : null;
              return (
                <div key={s.key} style={{ display: "flex", alignItems: "center", gap: 10, opacity: s.connected ? 1 : 0.7 }}>
                  <span style={{ width: 26, height: 26, borderRadius: 7, background: m.color + "33", color: m.color, display: "inline-flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 13, flexShrink: 0 }}>{m.glyph}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                      <span style={{ fontSize: 12, color: C.text, fontWeight: 600 }}>{s.name}{s.url && s.connected && <a href={s.url} target="_blank" rel="noreferrer" style={{ fontSize: 9, color: C.muted, marginLeft: 6, textDecoration: "none" }}>open ↗</a>}</span>
                      {s.connected && s.rating != null
                        ? <span style={{ fontSize: 12, fontFamily: "DM Mono,monospace", color: repCol(p), fontWeight: 700 }}>{p}<span style={{ color: C.muted, fontWeight: 400 }}>/100</span> <span style={{ fontSize: 10, color: C.muted }}>· {s.rating}/{s.scale} · {s.count}</span></span>
                        : s.connected ? <span style={{ fontSize: 10, color: C.text }}>● connected · no reviews yet</span>
                        : <span style={{ fontSize: 10, color: C.muted }}>○ {s.notListed ? "not listed yet" : "not connected"}</span>}
                    </div>
                    <p style={{ fontSize: 9, color: C.muted, marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={s.connected ? `${s.method || ""} · fetched ${s.fetchedAt || ""}${s.scope ? " · " + s.scope : ""}` : s.needs}>
                      {s.connected ? `${s.scope || s.method || ""}${s.fetchedAt ? " · " + new Date(s.fetchedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : ""}` : (investor ? "Awaiting connection" : `Needs: ${s.needs}`)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </RepCard>
        <RepCard title="Volume" right={<span style={{ fontSize: 9, color: C.muted }}>{R.win.label.toLowerCase()}</span>}>
          <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
            <div>
              <p style={{ fontSize: 30, fontWeight: 800, color: C.text, fontFamily: "DM Mono,monospace", lineHeight: 1 }}>{R.inWin.length}</p>
              <p style={{ fontSize: 10, color: C.muted, marginTop: 4 }}>reviews</p>
              {R.inPrev.length > 0 && <p style={{ fontSize: 10, color: R.inWin.length >= R.inPrev.length ? C.sage : C.rose, marginTop: 2 }}>{R.inWin.length >= R.inPrev.length ? "↑" : "↓"} vs {R.inPrev.length} previous period</p>}
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 10, color: C.muted }}>Highest volume</p>
              <p style={{ fontSize: 12, color: C.text, fontWeight: 600 }}>{R.topSource ? `${R.topSource[0]} · ${R.topSource[1]}` : "—"}</p>
              <p style={{ fontSize: 10, color: C.muted, marginTop: 8 }}>Rating mix in period</p>
              <div style={{ display: "flex", gap: 6, marginTop: 4, flexWrap: "wrap" }}>
                {[5, 4, 3, 2, 1].map(st => { const n = R.inWin.filter(r => Math.round(r.rating / r.scale * 5) === st).length; return <span key={st} style={{ fontSize: 10, color: n ? C.text : C.muted, fontFamily: "DM Mono,monospace" }}>{st}★ {n}</span>; })}
              </div>
            </div>
          </div>
        </RepCard>
        <RepCard title="Responses" right={<span style={{ fontSize: 9, color: C.muted }}>{R.win.label.toLowerCase()}</span>}>
          <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
            <div>
              <p style={{ fontSize: 30, fontWeight: 800, color: R.inWin.length ? repCol(Math.round(R.replied / R.inWin.length * 100)) : C.muted, fontFamily: "DM Mono,monospace", lineHeight: 1 }}>{R.inWin.length ? Math.round(R.replied / R.inWin.length * 100) : "—"}{R.inWin.length ? "%" : ""}</p>
              <p style={{ fontSize: 10, color: C.muted, marginTop: 4 }}>reviews replied to</p>
              <div style={{ height: 5, background: C.border, borderRadius: 3, marginTop: 6, width: 90 }}><div style={{ width: `${R.inWin.length ? R.replied / R.inWin.length * 100 : 0}%`, height: "100%", background: C.sage, borderRadius: 3 }}/></div>
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 10, color: C.muted }}>Negative reviews replied to</p>
              <p style={{ fontSize: 12, color: R.negWin && R.negReplied < R.negWin ? C.rose : C.text, fontWeight: 600 }}>{R.negWin ? `${R.negReplied} of ${R.negWin}` : "none in period"}</p>
              {R.tp?.response && <>
                <p style={{ fontSize: 10, color: C.muted, marginTop: 8 }}>Trustpilot says</p>
                <p style={{ fontSize: 11, color: C.text }}>Replied to {R.tp.response.negativeRepliedPct}% of negative reviews · {R.tp.response.typicalReplyTime}</p>
              </>}
            </div>
          </div>
        </RepCard>
      </div>

      {/* Category table */}
      <RepCard title="Categories" right={<span style={{ fontSize: 9, color: C.muted }}>score = avg rating of reviews mentioning the topic (/10) · keyword-based v1 · click a row to filter reviews</span>} style={{ marginBottom: 12 }}>
        {R.cats.length ? (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead><tr style={{ borderBottom: `1px solid ${C.border}` }}>
                {["Category", "Score", "Trend", "Sentiment", "Mentions"].map(h => <th key={h} style={{ padding: "6px 10px", textAlign: h === "Category" ? "left" : "right", color: C.muted, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>{h}</th>)}
              </tr></thead>
              <tbody>
                {R.cats.map(c => (
                  <tr key={c.key} onClick={() => setFilterCat(filterCat === c.key ? null : c.key)} style={{ borderBottom: `1px solid ${C.border}22`, cursor: "pointer", background: filterCat === c.key ? C.gold + "11" : "transparent" }}>
                    <td style={{ padding: "8px 10px", color: C.text, fontWeight: 600 }}>{c.label}</td>
                    <td style={{ padding: "8px 10px", textAlign: "right", fontFamily: "DM Mono,monospace", color: c.score == null ? C.muted : c.score >= 8 ? C.sage : c.score >= 6 ? C.gold : C.rose, fontWeight: 700 }}>{c.score ?? "—"}</td>
                    <td style={{ padding: "8px 10px", textAlign: "right", fontSize: 11, color: c.trend == null ? C.muted : c.trend > 0.2 ? C.sage : c.trend < -0.2 ? C.rose : C.muted }}>{c.trend == null ? "—" : c.trend > 0.2 ? "↑" : c.trend < -0.2 ? "↓" : "→"}</td>
                    <td style={{ padding: "8px 10px" }}><div style={{ display: "flex", justifyContent: "flex-end" }}>{sentBar(c)}</div></td>
                    <td style={{ padding: "8px 10px", textAlign: "right", fontFamily: "DM Mono,monospace", color: C.text }}>{c.mentions}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p style={{ fontSize: 12, color: C.muted }}>No review text in this period.</p>}
      </RepCard>

      {/* Reviews */}
      <RepCard title={`Reviews${filterCat ? ` · ${REP_CATEGORIES.find(c => c.key === filterCat).label}` : ""}`} right={filterCat ? <button onClick={() => setFilterCat(null)} style={{ fontSize: 10, padding: "3px 10px", borderRadius: 6, border: `1px solid ${C.border}`, background: "transparent", color: C.muted, cursor: "pointer" }}>Clear filter</button> : <span style={{ fontSize: 9, color: C.muted }}>{reviewsShown.length} in period · newest first</span>}>
        {reviewsShown.length ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {reviewsShown.map(r => {
              const p = r.rating / r.scale; const col = p >= 0.8 ? C.sage : p <= 0.4 ? C.rose : C.gold; const m = SRC_META[r.source] || {};
              const open = expanded === r.id;
              return (
                <div key={r.id} onClick={() => setExpanded(open ? null : r.id)} style={{ background: C.bg, border: `1px solid ${col}33`, borderLeft: `3px solid ${col}`, borderRadius: 10, padding: "10px 12px", cursor: "pointer" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "baseline", minWidth: 0 }}>
                      <span style={{ fontSize: 12, color: col, fontFamily: "DM Mono,monospace", fontWeight: 700 }}>{"★".repeat(Math.round(p * 5))}<span style={{ opacity: 0.25 }}>{"★".repeat(5 - Math.round(p * 5))}</span></span>
                      <span style={{ fontSize: 12, color: C.text, fontWeight: 600 }}>{r.title || (r.text || "").slice(0, 60)}</span>
                    </div>
                    <span style={{ fontSize: 10, color: C.muted, whiteSpace: "nowrap" }}>
                      <span style={{ color: m.color || C.muted, fontWeight: 700 }}>{r.sourceName}</span> · {new Date(r.date + "T00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}{!investor && r.author ? ` · ${r.author}` : ""} · {r.replied ? <span style={{ color: C.sage }}>replied{r.replyDate ? " " + new Date(r.replyDate + "T00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : ""}</span> : <span style={{ color: p <= 0.4 ? C.rose : C.muted }}>no reply</span>}
                    </span>
                  </div>
                  <p style={{ fontSize: 11, color: C.muted, marginTop: 6, lineHeight: 1.5, ...(open ? {} : { display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }) }}>{r.text}</p>
                </div>
              );
            })}
          </div>
        ) : <p style={{ fontSize: 12, color: C.muted }}>No reviews in this period{filterCat ? " for this category" : ""}.</p>}
      </RepCard>

      </>}

      {!investor && notConnected.some(s => !s.notListed) && (
        <div style={{ marginTop: 12, background: C.card, border: `1px solid ${C.gold}44`, borderRadius: 14, padding: 16 }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: C.gold, marginBottom: 6 }}>To connect the remaining platforms</p>
          {notConnected.filter(s => !s.notListed).map(s => <p key={s.key} style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}><b style={{ color: C.text }}>{s.name}:</b> {s.needs}</p>)}
        </div>
      )}
    </div>
  );
}

