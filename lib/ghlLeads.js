// lib/ghlLeads.js — CRM leads from Go High Level (Southall pipeline), with the
// same Meta / Google channel attribution the main dashboard uses for CAC.
const GHL_LOCATION = "PwquLuIhIjj0D80e6jLU";
const GHL_PIPELINE = "Southall &Soul";

async function ghlGet(path) {
  const r = await fetch(`/api/ghl?path=${encodeURIComponent(path)}`);
  if (!r.ok) throw new Error(`GHL ${r.status}`);
  return r.json();
}

// utmSource / source → "meta" | "google" | "other" | null (null = keep looking)
const classify = (s) => {
  const v = (s || "").toLowerCase().trim();
  if (!v) return null;
  if (/^(facebook|fb|meta|ig|instagram)(\.com|_ads|ads|-ads)?$/.test(v)) return "meta";
  if (/^(google|adwords)(_ads|ads)?$/.test(v)) return "google";
  return "other";
};
const mediumIsMetaForm = (m) => { const v = (m || "").toLowerCase(); return !!v && !/google|adwords/.test(v) && /\blead[\s._-]?form\b/.test(v); };

export function oppChannel(o) {
  const attrs = o.attributions || [];
  const tryA = (a) => { if (!a) return null; const c = classify(a.utmSource); if (c === "meta" || c === "google") return c; if (mediumIsMetaForm(a.utmMedium)) return "meta"; if (a.utmGclid || a.gclid || a.gbraid) return "google"; if (a.utmFbclid || a.fbclid) return "meta"; return c; };
  const last = attrs.find((a) => a.isLast);
  const fl = tryA(last);
  if (fl === "meta" || fl === "google") return fl;
  for (let i = attrs.length - 1; i >= 0; i--) { if (attrs[i] === last) continue; const c = tryA(attrs[i]); if (c === "meta" || c === "google") return c; }
  if (fl === "other") return "other";
  return classify(o.source) || "other";
}

// Every opportunity in a pipeline (matched by name) → { leads, opps }.
//   leads: one per contact (earliest opportunity), with channel
//   opps:  every opportunity with its current stage and when it moved there
// GHL returns opportunities newest-first, so paging stops once we pass `since`
// (default: 100 days back — enough for "last month" and its comparison period).
export async function loadCrm(match = /southall/i, since = new Date(Date.now() - 100 * 864e5).toISOString().slice(0, 10)) {
  const pr = await ghlGet(`/opportunities/pipelines?locationId=${GHL_LOCATION}`);
  const pipes = pr?.pipelines ?? pr?.data ?? [];
  const pipe = pipes.find((p) => match.test(p.name || ""));
  if (!pipe) throw new Error("Pipeline not found in GHL");
  const stageName = {}; (pipe.stages || []).forEach((st) => { stageName[st.id] = (st.name || "").trim(); });
  let all = [], startAfter, startAfterId;
  for (let i = 0; i < 40; i++) {
    const p = new URLSearchParams({ location_id: GHL_LOCATION, pipeline_id: pipe.id, limit: "100" });
    if (startAfter) p.set("startAfter", startAfter);
    if (startAfterId) p.set("startAfterId", startAfterId);
    const r = await ghlGet(`/opportunities/search?${p}`);
    const opps = r?.opportunities ?? r?.data ?? [];
    all = all.concat(opps);
    startAfter = r?.meta?.startAfter ?? null; startAfterId = r?.meta?.startAfterId ?? null;
    const total = r?.meta?.total ?? opps.length;
    const oldest = opps.map((o) => (o.createdAt || o.dateAdded || "").slice(0, 10)).filter(Boolean).sort()[0];
    if (all.length >= total || !opps.length || !startAfter || (oldest && oldest < since)) break;
  }
  const opps = all.map((o) => ({
    id: o.id, name: o.name || o.contact?.name || "", created: (o.createdAt || o.dateAdded || "").slice(0, 10),
    stage: stageName[o.pipelineStageId] || "", stageAt: (o.lastStageChangeAt || o.updatedAt || "").slice(0, 10),
    status: (o.status || "").toLowerCase(), statusAt: (o.lastStatusChangeAt || "").slice(0, 10),
    channel: oppChannel(o), email: (o.contact?.email || "").toLowerCase().trim(),
    key: o.contactId || o.contact?.id || (o.contact?.email || "").toLowerCase() || o.id,
  })).filter((o) => o.created);
  const byContact = {};
  opps.forEach((o) => { if (!byContact[o.key] || o.created < byContact[o.key].created) byContact[o.key] = o; });
  return { leads: Object.values(byContact), opps, pipeline: pipe.name };
}
