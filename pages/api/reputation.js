// pages/api/reputation.js
// Reputation data per property (southall | shoreditch).
//
//   GET  /api/reputation?property=southall
//        → { property, sources:[ {key,name,connected,rating,scale,count,distribution,response,competitors,reviews,...} ], generatedAt }
//   POST /api/reputation?property=southall&source=trustpilot   (header x-ingest-key)
//        → stores a freshly collected source payload in Redis; GET prefers Redis
//          over the bundled file when it is newer.
//
// Layers, newest wins per source:
//   1. Bundled file  data/reputation/<property>.json   (committed by the collector)
//   2. Redis         reputation:<property>:<source>     (pushed by the collector)
//   3. Live          Google Places, when GOOGLE_PLACES_API_KEY + place id are set
//
// No hard-coded ratings anywhere: a source with connected:false renders as
// "not connected" and contributes nothing to the scores.

import southall from "../../data/reputation/southall.json";
import shoreditch from "../../data/reputation/shoreditch.json";

const FILES = { southall, shoreditch };
const PLACE_IDS = { southall: process.env.GOOGLE_PLACE_ID_SOUTHALL || process.env.GOOGLE_PLACE_ID || "", shoreditch: process.env.GOOGLE_PLACE_ID_SHOREDITCH || "" };

export const config = { api: { responseLimit: false } };

async function redis() {
  if (!process.env.KV_REDIS_URL) return null;
  try {
    const { createClient } = await import("redis");
    const c = createClient({ url: process.env.KV_REDIS_URL });
    c.on("error", () => {});
    await c.connect();
    return c;
  } catch { return null; }
}

async function googlePlaces(placeId) {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key || !placeId) return null;
  try {
    const r = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}?fields=rating,userRatingCount,reviews,googleMapsUri,displayName`, {
      headers: { "X-Goog-Api-Key": key, "X-Goog-FieldMask": "rating,userRatingCount,reviews,googleMapsUri,displayName" },
    });
    if (!r.ok) return { error: `Places ${r.status}` };
    const j = await r.json();
    if (j.rating == null) return { error: "no rating" };
    return {
      key: "google", name: "Google", connected: true, method: "Google Places API (live)", fetchedAt: new Date().toISOString(),
      url: j.googleMapsUri, rating: j.rating, scale: 5, count: j.userRatingCount || 0,
      reviews: (j.reviews || []).map((v, i) => ({
        id: `g-${i}`, author: v.authorAttribution?.displayName || "Google user",
        date: (v.publishTime || "").slice(0, 10), rating: v.rating, title: "", text: v.text?.text || v.originalText?.text || "", replied: false, lang: v.text?.languageCode || "en",
      })),
      note: "Places API returns at most 5 reviews; connect Google Business Profile for the full set and reply data.",
    };
  } catch (e) { return { error: e.message }; }
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  const property = (req.query.property || "southall").toLowerCase();
  const file = FILES[property];
  if (!file) return res.status(404).json({ error: "unknown property" });

  let client = null;
  try {
    client = await redis();

    if (req.method === "POST") {
      const key = process.env.REPUTATION_INGEST_KEY;
      if (!key || req.headers["x-ingest-key"] !== key) return res.status(401).json({ error: "bad ingest key" });
      if (!client) return res.status(503).json({ error: "redis not configured" });
      const source = (req.query.source || req.body?.key || "").toLowerCase();
      if (!source) return res.status(400).json({ error: "source required" });
      const payload = { ...req.body, key: source, connected: true, fetchedAt: req.body?.fetchedAt || new Date().toISOString() };
      await client.set(`reputation:${property}:${source}`, JSON.stringify(payload));
      return res.status(200).json({ ok: true, stored: source, reviews: (payload.reviews || []).length });
    }

    const sources = [];
    for (const s of file.sources) {
      let best = s;
      if (client) {
        try {
          const raw = await client.get(`reputation:${property}:${s.key}`);
          if (raw) { const r = JSON.parse(raw); if (!s.fetchedAt || (r.fetchedAt || "") > s.fetchedAt) best = { ...s, ...r }; }
        } catch {}
      }
      if (s.key === "google" && !best.connected) {
        const live = await googlePlaces(PLACE_IDS[property]);
        if (live && !live.error) best = { ...s, ...live };
        else if (live?.error) best = { ...s, liveError: live.error };
      }
      sources.push(best);
    }
    return res.status(200).json({ property, propertyName: file.propertyName, sources, generatedAt: new Date().toISOString() });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  } finally {
    try { if (client) await client.quit(); } catch {}
  }
}
