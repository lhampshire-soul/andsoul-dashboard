// pages/api/crm-leads.js — CRM leads (GoHighLevel) for the dashboard, built
// server-side and cached in Redis for 15 minutes (paging 3,000+ opportunities
// from the browser took ~60s).
//   GET /api/crm-leads?property=southall|shoreditch[&fresh=1]
//   → { leads: [{created, channel, key, stage, stageAt, status, statusAt, name}], opps: [...], builtAt }
import { oppChannel } from "../../lib/ghlLeads";
export const config = { maxDuration: 60 };
const GHL_KEY = process.env.GHL_API_KEY || "pit-da675da7-68cd-4c4e-8693-c490f7f86f04";
const LOC = "PwquLuIhIjj0D80e6jLU";
const MATCH = { southall: /southall/i, shoreditch: /shoreditch/i };

export async function buildCrm(prop) {
  const get = async (p) => { const r = await fetch("https://services.leadconnectorhq.com" + p, { headers: { Authorization: `Bearer ${GHL_KEY}`, Version: "2021-07-28", Accept: "application/json" } }); if (!r.ok) throw new Error(`GHL ${r.status}`); return r.json(); };
  const pr = await get(`/opportunities/pipelines?locationId=${LOC}`);
  const pipe = (pr.pipelines || []).find((p) => MATCH[prop].test(p.name || ""));
  if (!pipe) throw new Error("pipeline not found");
  const sn = {}; (pipe.stages || []).forEach((s) => { sn[s.id] = (s.name || "").trim(); });
  const since = new Date(Date.now() - 100 * 864e5).toISOString().slice(0, 10);
  let all = [], sa, sai;
  for (let i = 0; i < 80; i++) {
    const q = new URLSearchParams({ location_id: LOC, pipeline_id: pipe.id, limit: "100" });
    if (sa) q.set("startAfter", sa); if (sai) q.set("startAfterId", sai);
    const r = await get(`/opportunities/search?${q}`); const o = r.opportunities || [];
    all = all.concat(o); sa = r.meta?.startAfter; sai = r.meta?.startAfterId;
    const oldest = o.map((x) => (x.createdAt || "").slice(0, 10)).filter(Boolean).sort()[0];
    if (!o.length || !sa || all.length >= (r.meta?.total || 0) || (oldest && oldest < since)) break;
  }
  const opps = all.map((o) => ({
    id: o.id, name: o.name || o.contact?.name || "", created: (o.createdAt || "").slice(0, 10),
    stage: sn[o.pipelineStageId] || "", stageAt: (o.lastStageChangeAt || o.updatedAt || "").slice(0, 10),
    status: (o.status || "").toLowerCase(), statusAt: (o.lastStatusChangeAt || "").slice(0, 10),
    channel: oppChannel(o), key: o.contactId || o.contact?.id || (o.contact?.email || "").toLowerCase() || o.id,
  })).filter((o) => o.created);
  const by = {}; opps.forEach((o) => { if (!by[o.key] || o.created < by[o.key].created) by[o.key] = o; });
  return { leads: Object.values(by), opps, pipeline: pipe.name, builtAt: new Date().toISOString() };
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  const prop = MATCH[req.query.property] ? req.query.property : "southall";
  let c = null;
  try {
    if (process.env.KV_REDIS_URL) { const { createClient } = await import("redis"); c = createClient({ url: process.env.KV_REDIS_URL }); c.on("error", () => {}); await c.connect(); }
    const KEY = `crm_leads_v1:${prop}`;
    if (c && !req.query.fresh) {
      const raw = await c.get(KEY);
      if (raw) { const d = JSON.parse(raw); if (Date.now() - new Date(d.builtAt).getTime() < 15 * 60000) return res.status(200).send(raw); }
    }
    const d = await buildCrm(prop);
    if (c) await c.set(KEY, JSON.stringify(d), { EX: 24 * 3600 });
    return res.status(200).json(d);
  } catch (e) { return res.status(500).json({ error: e.message }); }
  finally { try { if (c) await c.quit(); } catch {} }
}
