// pages/api/narrative.js
// Weekly narrative. The dashboard sends the computed facts plus a deterministic
// three-paragraph draft. If ANTHROPIC_API_KEY is configured on Vercel the draft
// is rewritten by a model into plainer, more readable prose using ONLY the
// supplied numbers; otherwise the draft is returned unchanged so the panel
// always has something accurate to show.

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  const { facts, draft, attention } = req.body || {};
  if (!Array.isArray(draft) || draft.length === 0) return res.status(400).json({ error: "draft required" });

  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return res.status(200).json({ paragraphs: draft, source: "deterministic" });

  try {
    const prompt =
`You are writing the weekly performance summary for the Southall &Soul co-living building. Rewrite the three draft paragraphs below into three clear paragraphs of plain British English for a busy operations lead. Keep every number exactly as given — do not invent, round differently, or add figures. Keep the same order: (1) occupancy and stock, (2) revenue and rates, (3) marketing and bookings. Lead each paragraph with the single most important change. No headings, no bullet points, no preamble. Return only the three paragraphs separated by a blank line.

FACTS (JSON):
${JSON.stringify(facts)}

ATTENTION FEED (top items):
${JSON.stringify(attention || [])}

DRAFT:
${draft.join("\n\n")}`;

    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model: "claude-sonnet-4-5", max_tokens: 900, messages: [{ role: "user", content: prompt }] }),
    });
    if (!r.ok) return res.status(200).json({ paragraphs: draft, source: "deterministic", note: `model ${r.status}` });
    const j = await r.json();
    const text = (j?.content || []).map(c => c.text || "").join("").trim();
    const paragraphs = text.split(/\n\s*\n/).map(s => s.trim()).filter(Boolean).slice(0, 3);
    if (paragraphs.length !== 3) return res.status(200).json({ paragraphs: draft, source: "deterministic" });
    return res.status(200).json({ paragraphs, source: "model" });
  } catch (e) {
    return res.status(200).json({ paragraphs: draft, source: "deterministic", note: e.message });
  }
}
