// TEMPORARY structure probe for the Shoreditch Lavanda account. Returns unit
// names, counts and status mix only (no guest data). Remove after setup.
const KEY = process.env.LAVANDA_API_KEY_SHOREDITCH || "6a13b2ba0b8544eda849bfebbac0fce8";
export const config = { maxDuration: 60 };
export default async function handler(req, res) {
  if (req.query.ping) return res.status(200).json({ pong: true });
  if (req.query.t !== "f3502d29ebf57a9cf3abab7f") return res.status(404).end();
  const get = async (p) => { const r = await fetch("https://lavanda.azure-api.net" + p, { headers: { "Ocp-Apim-Subscription-Key": KEY, Accept: "application/json" } }); if (!r.ok) throw new Error(r.status + " " + p + " " + (await r.text()).slice(0, 200)); return r.json(); };
  try {
    const acct = await get("/account").catch((e) => ({ err: e.message }));
    let props = [], cur = null;
    for (let i = 0; i < 20; i++) { const r = await get("/properties?page[size]=100" + (cur ? "&page[after]=" + encodeURIComponent(cur) : "")); props = props.concat(r.data || []); cur = r.meta?.page?.next; if (!cur) break; }
    let bk = [], c2 = null;
    for (let i = 0; i < +(req.query.pages || 6); i++) { const r = await get("/bookings?page[size]=100" + (c2 ? "&page[after]=" + encodeURIComponent(c2) : "")); bk = bk.concat(r.data || []); c2 = r.meta?.page?.next; if (!c2) break; }
    const st = {}; bk.forEach((b) => { const s = b.attributes?.status || "?"; st[s] = (st[s] || 0) + 1; });
    const unitUse = {}; bk.forEach((b) => { const u = b.relationships?.unit?.data?.id; if (u) unitUse[u] = (unitUse[u] || 0) + 1; });
    const today = new Date().toISOString().slice(0, 10);
    const active = bk.filter((b) => b.attributes?.status === "confirmed" && b.attributes.start_date <= today && b.attributes.end_date >= today).length;
    const days = bk.map((b) => Math.round((new Date(b.attributes.end_date) - new Date(b.attributes.start_date)) / 864e5)).filter((x) => x >= 0);
    const sdUnit = (n) => { n = (n || "").trim(); if (/remove/i.test(n)) return null; let m = n.match(/^Villa-(\d+)-(\d+)-([A-Za-z]+)$/); if (m) return { room: +m[1] + "." + +m[2], type: m[3] }; m = n.match(/^Villa-Loft\s*-\s*Flat\s*(\d+)$/i); if (m) return { room: "Loft " + m[1], type: "Loft" }; return null; };
    const uById = {}; props.forEach((p) => { const u = sdUnit(p.attributes?.name); if (u) uById[p.id] = u; });
    const byType = {}; Object.values(uById).forEach((u) => { byType[u.type] = (byType[u.type] || 0) + 1; });
    const conf = bk.filter((b) => b.attributes.status === "confirmed" && !b.attributes.canceled);
    const inH = conf.filter((b) => b.attributes.start_date <= today && b.attributes.end_date >= today);
    const unmapped = inH.filter((b) => !uById[b.relationships?.unit?.data?.id]).map((b) => (props.find((p) => p.id === b.relationships?.unit?.data?.id) || {}).attributes?.name || "no unit");
    const occRooms = new Set(inH.map((b) => uById[b.relationships?.unit?.data?.id]?.room).filter(Boolean));
    const occByType = {}; inH.forEach((b) => { const u = uById[b.relationships?.unit?.data?.id]; if (u) occByType[u.type] = (occByType[u.type] || 0) + 1; });
    const wk = inH.map((b) => (+b.attributes.total_cost) / Math.max(1, (new Date(b.attributes.end_date) - new Date(b.attributes.start_date)) / 864e5) * 7);
    const roll = inH.reduce((a, b) => a + (+b.attributes.total_cost) / Math.max(1, (new Date(b.attributes.end_date) - new Date(b.attributes.start_date)) / 864e5) * 365 / 12, 0);
    if (req.query.summary) return res.status(200).json({ units: Object.keys(uById).length, byType, inHouse: inH.length, occRooms: occRooms.size, occByType, unmapped, awr: Math.round(wk.reduce((a, b) => a + b, 0) / Math.max(1, wk.length)), wkMin: Math.round(Math.min(...wk)), wkMax: Math.round(Math.max(...wk)), roll: Math.round(roll), createdRange: [bk.map((b) => (b.attributes.booked_time || "").slice(0, 10)).sort()[0], bk.map((b) => (b.attributes.booked_time || "").slice(0, 10)).sort().pop()], zeroCost: conf.filter((b) => !(+b.attributes.total_cost)).length });
    res.status(200).json({
      account: acct?.data?.attributes?.name || acct, props: props.map((p) => ({ id: p.id, type: p.type, name: p.attributes?.name, units: p.attributes?.total_units, children: (p.relationships?.properties?.data || []).length, bookings: unitUse[p.id] || 0 })),
      propAttrKeys: Object.keys(props[0]?.attributes || {}), bookingAttrKeys: Object.keys(bk[0]?.attributes || {}), bookingRel: Object.keys(bk[0]?.relationships || {}),
      bookings: bk.length, statuses: st, activeToday: active, longStay: days.filter((d) => d >= 28).length, platforms: [...new Set(bk.map((b) => b.attributes?.platform))],
      firstStart: bk.map((b) => b.attributes.start_date).sort()[0], lastEnd: bk.map((b) => b.attributes.end_date).sort().pop(),
    });
  } catch (e) { res.status(200).json({ error: e.message }); }
}
