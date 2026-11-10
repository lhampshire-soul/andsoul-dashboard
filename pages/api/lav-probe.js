// TEMPORARY: anonymised booking list for renewal-logic verification. Remove after use.
import crypto from "crypto";
export default async function handler(req, res) {
  if (req.query.t !== "b9c24ab4ed925fb67184ad55") return res.status(404).end();
  const { createClient } = await import("redis");
  const c = createClient({ url: process.env.KV_REDIS_URL }); await c.connect();
  const s = JSON.parse(await c.get(req.query.p === "sd" ? "snapshot:sd:v1" : "snapshot:rh:v1")); await c.quit();
  const h = (x) => crypto.createHash("sha1").update(String(x)).digest("hex").slice(0, 8);
  res.status(200).json({ builtAt: s.builtAt, sales: s.sales.map(({ guest, contact, ...r }) => ({ ...r, contact: h(contact) })) });
}
