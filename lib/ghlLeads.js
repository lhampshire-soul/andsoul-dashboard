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

// Every opportunity in the Southall pipeline → compact lead records.
export async function loadCrmLeads() {
  const pr = await ghlGet(`/opportunities/pipelines?locationId=${GHL_LOCATION}`);
  const pipes = pr?.pipelines ?? pr?.data ?? [];
  const pipe = pipes.find((p) => p.name?.trim() === GHL_PIPELINE) ?? pipes.find((p) => /southall/i.test(p.name || ""));
  if (!pipe) throw new Error("Southall pipeline not found in GHL");
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
    if (all.length >= total || !opps.length || !startAfter) break;
  }
  // One lead per contact: keep the earliest opportunity
  const byContact = {};
  all.forEach((o) => {
    const created = (o.createdAt || o.dateAdded || "").slice(0, 10);
    if (!created) return;
    const key = o.contactId || o.contact?.id || (o.contact?.email || "").toLowerCase() || o.id;
    const rec = { created, channel: oppChannel(o), email: (o.contact?.email || "").toLowerCase().trim() };
    if (!byContact[key] || created < byContact[key].created) byContact[key] = rec;
  });
  return Object.values(byContact);
}
