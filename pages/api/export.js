// pages/api/export.js
// Monthly finance export — raw booking data apportioned to a month (nights basis).
// Returns text/plain CSV. Use ?part=N&size=4000 to fetch in slices, ?part=meta for info.

const RH_ID = "5n3lgu73rc3jqus4fur3c58fbb";
const RH_SECRET = "1bfob7es3ge16bmjs8t4i0ah2ica4t1ujt8aeqa4b3rs9cmsa7uh";
const LAV_KEY = "75a866b799804d3baee167aa47644576";

export default async function handler(req, res) {
  try {
    const month = req.query.month || "2026-07";
    const [y, m] = month.split("-").map(Number);
    const daysInMonth = new Date(y, m, 0).getDate();
    const MS = `${month}-01`;
    const ME = `${month}-${String(daysInMonth).padStart(2, "0")}`;
    const msD = 864e5;

    // ── RH long-stay ──
    const tokRes = await fetch("https://auth.rerumapp.uk/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ grant_type: "client_credentials", client_id: RH_ID, client_secret: RH_SECRET }),
    });
    const { access_token } = await tokRes.json();

    let bk = [], page = 0, totalPages = 1;
    while (page < totalPages && page < 40) {
      const r = await fetch(`https://apiv3.rerumapp.uk/api/v3/bookings?page=${page}&size=200`, {
        headers: { Authorization: `Bearer ${access_token}` },
      });
      const d = await r.json();
      bk = bk.concat(d.content || []);
      totalPages = d.page?.totalPages || 1;
      page++;
    }

    const lsRows = [];
    bk.forEach(b => {
      const st = (b.roomStayStatus || "").toUpperCase();
      if (!["CHECKED_IN", "CHECKED_OUT", "CONFIRMED"].includes(st)) return;
      const f = (b.startDate || "").slice(0, 10), t = (b.endDate || "").slice(0, 10);
      if (!f || !t) return;
      const nights = Math.round((new Date(t) - new Date(f)) / msD);
      if (nights <= 0) return;
      const lastN = new Date(new Date(t).getTime() - msD).toISOString().slice(0, 10);
      if (f > ME || lastN < MS) return;
      const oS = f > MS ? f : MS, oE = lastN < ME ? lastN : ME;
      const mN = Math.max(0, (new Date(oE) - new Date(oS)) / msD + 1);
      if (mN <= 0) return;
      const net = parseFloat(b.netAmount || 0) || 0, vat = parseFloat(b.vatAmount || 0) || 0;
      const g = `${b.bookingContact?.firstName || ""} ${b.bookingContact?.lastName || ""}`.trim().replace(/\|/g, "/");
      const room = (b.unit?.name || "").replace(/\|/g, "/"), typ = (b.unit?.unitTypeName || "").replace(/\|/g, "/");
      lsRows.push([b.bookingReference || "", g, room, typ, f, t, nights, mN,
        net.toFixed(2), vat.toFixed(2), (net / nights * mN).toFixed(2), (vat / nights * mN).toFixed(2),
        st, nights >= 28 ? "LS" : "short"].join("|"));
    });

    // ── Lavanda short-stay ──
    const lavHeaders = { "Ocp-Apim-Subscription-Key": LAV_KEY, Accept: "application/json" };
    let lav = [];
    for (let p = 1; p <= 10; p++) {
      const r = await fetch(`https://lavanda.azure-api.net/bookings?perPage=100&page[number]=${p}`, { headers: lavHeaders });
      if (!r.ok) break;
      const d = await r.json();
      lav = lav.concat(d.data || []);
      if ((d.data || []).length < 100) break;
    }
    const ssRows = [];
    lav.forEach(b => {
      const a = b.attributes;
      if ((a.status || "").toLowerCase() !== "confirmed") return;
      const f = a.start_date, t = a.end_date;
      const nights = Number(a.total_days) || Math.round((new Date(t) - new Date(f)) / msD);
      if (nights <= 0) return;
      const lastN = new Date(new Date(t).getTime() - msD).toISOString().slice(0, 10);
      if (f > ME || lastN < MS) return;
      const oS = f > MS ? f : MS, oE = lastN < ME ? lastN : ME;
      const mN = Math.max(0, (new Date(oE) - new Date(oS)) / msD + 1);
      if (mN <= 0) return;
      const cost = Number(a.total_cost) || 0;
      const g = `${a.lead_guest_first_name || ""} ${a.lead_guest_last_name || ""}`.trim().replace(/\|/g, "/");
      ssRows.push([a.confirmation_code || "", g, f, t, nights, mN, cost.toFixed(2),
        (cost / nights * mN).toFixed(2), a.platform || "", a.currency || "GBP"].join("|"));
    });

    const payload = "===LS===\n" + lsRows.join("\n") + "\n===SS===\n" + ssRows.join("\n");

    const part = req.query.part;
    const size = Math.min(8000, parseInt(req.query.size || "4000", 10));
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    if (part === "meta") {
      return res.status(200).send(`month=${month} lsRows=${lsRows.length} ssRows=${ssRows.length} bytes=${payload.length} parts=${Math.ceil(payload.length / size)} size=${size}`);
    }
    if (part != null) {
      const i = parseInt(part, 10);
      return res.status(200).send(payload.slice(i * size, (i + 1) * size));
    }
    return res.status(200).send(payload);
  } catch (e) {
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    return res.status(500).send("ERROR: " + e.message);
  }
}
