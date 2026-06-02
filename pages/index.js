import Head from "next/head";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  Line, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, ComposedChart
} from "recharts";

// ─── SOUTHALL META DATA (Windsor.ai · 11 Feb – 12 Mar 2026) ──────────────────
const META_DAILY = [
  { d:"11/2", iso:"2026-02-11", spend:61.02,  leads:20, cpl:3.05  },
  { d:"12/2", iso:"2026-02-12", spend:56.82,  leads:12, cpl:4.74  },
  { d:"13/2", iso:"2026-02-13", spend:52.11,  leads:18, cpl:2.90  },
  { d:"14/2", iso:"2026-02-14", spend:55.65,  leads:14, cpl:3.98  },
  { d:"15/2", iso:"2026-02-15", spend:98.47,  leads:17, cpl:5.79  },
  { d:"16/2", iso:"2026-02-16", spend:52.43,  leads:12, cpl:4.37  },
  { d:"17/2", iso:"2026-02-17", spend:56.14,  leads:9,  cpl:6.24  },
  { d:"18/2", iso:"2026-02-18", spend:77.07,  leads:12, cpl:6.42  },
  { d:"19/2", iso:"2026-02-19", spend:82.21,  leads:19, cpl:4.33  },
  { d:"20/2", iso:"2026-02-20", spend:73.87,  leads:8,  cpl:9.23  },
  { d:"21/2", iso:"2026-02-21", spend:80.11,  leads:10, cpl:8.01  },
  { d:"22/2", iso:"2026-02-22", spend:82.79,  leads:10, cpl:8.28  },
  { d:"23/2", iso:"2026-02-23", spend:111.62, leads:21, cpl:5.32  },
  { d:"24/2", iso:"2026-02-24", spend:117.69, leads:18, cpl:6.54  },
  { d:"25/2", iso:"2026-02-25", spend:117.22, leads:12, cpl:9.77  },
  { d:"26/2", iso:"2026-02-26", spend:105.31, leads:10, cpl:10.53 },
  { d:"27/2", iso:"2026-02-27", spend:134.96, leads:11, cpl:12.27 },
  { d:"28/2", iso:"2026-02-28", spend:99.37,  leads:11, cpl:9.03  },
  { d:"1/3",  iso:"2026-03-01", spend:136.46, leads:26, cpl:5.25  },
  { d:"2/3",  iso:"2026-03-02", spend:115.00, leads:13, cpl:8.85  },
  { d:"3/3",  iso:"2026-03-03", spend:105.79, leads:5,  cpl:21.16 },
  { d:"4/3",  iso:"2026-03-04", spend:126.69, leads:12, cpl:10.56 },
  { d:"5/3",  iso:"2026-03-05", spend:142.62, leads:10, cpl:14.26 },
  { d:"6/3",  iso:"2026-03-06", spend:119.86, leads:10, cpl:11.99 },
  { d:"7/3",  iso:"2026-03-07", spend:125.24, leads:7,  cpl:17.89 },
  { d:"8/3",  iso:"2026-03-08", spend:159.86, leads:11, cpl:14.53 },
  { d:"9/3",  iso:"2026-03-09", spend:137.71, leads:13, cpl:10.59 },
  { d:"10/3", iso:"2026-03-10", spend:124.50, leads:6,  cpl:20.75 },
  { d:"11/3", iso:"2026-03-11", spend:132.06, leads:10, cpl:13.21 },
  { d:"12/3", iso:"2026-03-12", spend:96.33,  leads:10, cpl:9.63  },
];

const GOOGLE_DAILY_SPEND = {
  "2026-02-11":241.86,"2026-02-12":122.84,"2026-02-13":168.53,"2026-02-14":208.63,
  "2026-02-15":319.03,"2026-02-16":318.73,"2026-02-17":166.73,"2026-02-18":143.43,
  "2026-02-19":202.88,"2026-02-20":103.27,"2026-02-21":100.14,"2026-02-22":174.36,
  "2026-02-23":160.35,"2026-02-24":121.57,"2026-02-25":183.09,"2026-02-26":167.68,
  "2026-02-27":172.55,"2026-02-28":187.31,"2026-03-01":198.96,"2026-03-02":233.47,
  "2026-03-03":474.26,"2026-03-04":299.21,"2026-03-05":300.21,"2026-03-06":349.86,
  "2026-03-07":276.27,"2026-03-08":307.85,"2026-03-09":260.20,"2026-03-10":228.05,
  "2026-03-11":229.51,"2026-03-12":112.85,
};

const GOOGLE_CAMPAIGNS = [
  { name:"&Soul - Southall",             spend:3951, convs:85, avgCPC:0.84, type:"Search" },
  { name:"Southall Co Living",            spend:1007, convs:16, avgCPC:1.12, type:"Search" },
  { name:"Southall - Performance Max",    spend:  54, convs: 1, avgCPC:0.62, type:"Pmax"  },
  { name:"Southall - Local Pmax",         spend: 906, convs:42, avgCPC:0.62, type:"Pmax"  },
  { name:"&Soul - Southall Video",        spend:  98, convs: 3, avgCPC:0.88, type:"Video" },
];

// ─── SHOREDITCH DATA ─────────────────────────────────────────────────────────
const SD_GOOGLE_DAILY = [
  {date:"2026-02-17",spend:113.34,convs:19},{date:"2026-02-18",spend:121.55,convs:24},
  {date:"2026-02-19",spend:109.87,convs:21},{date:"2026-02-20",spend:128.02,convs:27},
  {date:"2026-02-21",spend:154.30,convs:16},{date:"2026-02-22",spend:106.00,convs:21},
  {date:"2026-02-23",spend:29.12,convs:25},{date:"2026-02-24",spend:52.15,convs:32},
  {date:"2026-02-25",spend:56.84,convs:27},{date:"2026-02-26",spend:36.19,convs:9},
  {date:"2026-02-27",spend:0,convs:0},{date:"2026-02-28",spend:21.11,convs:0},
  {date:"2026-03-01",spend:28.16,convs:1},{date:"2026-03-02",spend:27.25,convs:1},
  {date:"2026-03-03",spend:35.78,convs:0},{date:"2026-03-04",spend:41.04,convs:1},
  {date:"2026-03-05",spend:40.79,convs:0},{date:"2026-03-06",spend:40.93,convs:1},
  {date:"2026-03-07",spend:41.72,convs:0},{date:"2026-03-08",spend:25.88,convs:0},
  {date:"2026-03-09",spend:63.21,convs:2},{date:"2026-03-10",spend:43.60,convs:0},
  {date:"2026-03-11",spend:35.18,convs:2},{date:"2026-03-12",spend:47.70,convs:1},
  {date:"2026-03-13",spend:39.90,convs:0},{date:"2026-03-14",spend:41.43,convs:1},
  {date:"2026-03-15",spend:40.40,convs:3},{date:"2026-03-16",spend:27.37,convs:0},
  {date:"2026-03-17",spend:46.87,convs:0},{date:"2026-03-18",spend:50.00,convs:0},
];
const SD_META = {campaign:"Shoreditch &Soul | Villas | Website Lead Gen",spend:1175.34,leads:48,totalLeads:260,landingPageViews:597,linkClicks:1217};
const SD_VILLAS = 16;
const SD_BEDROOMS = 72;
const SD_GHL_PIPELINE = "Shoreditch";
const SD_FLATS = [
  {name:"Flat 1",rooms:[{id:"1.1",s:"OCCUPIED"},{id:"1.2",s:"VACANT"},{id:"1.3",s:"VACANT"},{id:"1.4",s:"OCCUPIED"},{id:"1.5",s:"VACANT"}]},
  {name:"Flat 2",rooms:[{id:"2.1",s:"OCCUPIED"},{id:"2.2",s:"VACANT"},{id:"2.3",s:"VACANT"},{id:"2.4",s:"INCOMING"},{id:"2.5",s:"OCCUPIED"}]},
  {name:"Flat 3",rooms:[{id:"3.1",s:"VACANT"},{id:"3.2",s:"VACANT"},{id:"3.3",s:"OCCUPIED"},{id:"3.4",s:"OCCUPIED"}]},
  {name:"Flat 4",rooms:[{id:"4.1",s:"OCCUPIED"},{id:"4.2",s:"VACANT"},{id:"4.3",s:"VACANT"},{id:"4.4",s:"INCOMING"},{id:"4.5",s:"OCCUPIED"},{id:"4.6",s:"VACANT"}]},
  {name:"Flat 5",rooms:[{id:"5.1",s:"OCCUPIED"},{id:"5.2",s:"OCCUPIED"},{id:"5.3",s:"OCCUPIED"},{id:"5.4",s:"OCCUPIED"}]},
  {name:"Flat 6",rooms:[{id:"6.1",s:"OCCUPIED"},{id:"6.2",s:"OCCUPIED"},{id:"6.3",s:"OCCUPIED"},{id:"6.4",s:"VACANT"}]},
  {name:"Flat 7",rooms:[{id:"7.1",s:"OCCUPIED"},{id:"7.2",s:"VACANT"},{id:"7.3",s:"VACANT"},{id:"7.4",s:"OCCUPIED"}]},
  {name:"Flat 8",rooms:[{id:"8.1",s:"OCCUPIED"},{id:"8.2",s:"VACANT"},{id:"8.3",s:"VACANT"},{id:"8.4",s:"OCCUPIED"}]},
  {name:"Flat 9",rooms:[{id:"9.1",s:"OCCUPIED"},{id:"9.2",s:"VACANT"},{id:"9.3",s:"OCCUPIED"},{id:"9.4",s:"OCCUPIED"}]},
  {name:"Flat 10",rooms:[{id:"10.1",s:"OCCUPIED"},{id:"10.2",s:"VACANT"},{id:"10.3",s:"OCCUPIED"},{id:"10.4",s:"INCOMING"},{id:"10.5",s:"INCOMING"}]},
  {name:"Flat 11",rooms:[{id:"11.1",s:"VACANT"},{id:"11.2",s:"VACANT"},{id:"11.3",s:"OCCUPIED"},{id:"11.4",s:"INCOMING"},{id:"11.5",s:"OCCUPIED"},{id:"11.6",s:"OCCUPIED"}]},
  {name:"Flat 12",rooms:[{id:"12.1",s:"OCCUPIED"},{id:"12.2",s:"VACANT"},{id:"12.3",s:"VACANT"},{id:"12.4",s:"OCCUPIED"},{id:"12.5",s:"OCCUPIED"},{id:"12.6",s:"OCCUPIED"}]},
  {name:"Flat 13",rooms:[{id:"13.1",s:"VACANT"},{id:"13.2",s:"OCCUPIED"},{id:"13.3",s:"VACANT"},{id:"13.4",s:"VACANT"}]},
  {name:"Flat 14",rooms:[{id:"14.1",s:"VACANT"},{id:"14.2",s:"VACANT"},{id:"14.3",s:"OCCUPIED"},{id:"14.4",s:"OCCUPIED"}]},
  {name:"Flat 15",rooms:[{id:"15.1",s:"VACANT"},{id:"15.2",s:"VACANT"},{id:"15.3",s:"VACANT"},{id:"15.4",s:"OCCUPIED"}]},
  {name:"Flat 16",rooms:[{id:"16.1",s:"VACANT"},{id:"16.2",s:"OCCUPIED"},{id:"16.3",s:"OCCUPIED"},{id:"16.4",s:"VACANT"}]},
];

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const BEDS = 300;
const TARGET_OCC = 0.9;
const TARGET_RATE = 300;
const TARGET_ROOMS = Math.round(BEDS * TARGET_OCC);
const TARGET_MONTHLY = Math.round(TARGET_ROOMS * TARGET_RATE * (52/12));
const ROOM_TYPES = ['Ensuite', 'Nook', 'Snug', 'Snug plus', 'Cosy', 'Roomy', 'Spacious', 'Deluxe', 'Deluxe Accessible', 'Deluxe Duo'];

// ─── COLOURS ──────────────────────────────────────────────────────────────────
const C = {
  bg:"#080a0d", card:"#0e1115", border:"#1c2028",
  gold:"#d4a843", goldDim:"#7a5c1e",
  blue:"#3d82c4", sage:"#3d9e75", rose:"#c95c54", purple:"#9b72cf",
  text:"#e8e4dc", muted:"#6e717a",
};

const fmt = (n, prefix="£", dp=0) =>
  `${prefix}${Number(n).toLocaleString("en-GB",{minimumFractionDigits:dp,maximumFractionDigits:dp})}`;
const cplColor = v => v < 7 ? C.sage : v < 13 ? C.gold : C.rose;

// Extract base room type from unitTypeName
const baseRoomType = (typeName) => {
  if (!typeName) return 'Other';
  const exclude = ['Bike', 'Corridor', 'Parking', 'Floor 1', 'Shuffle', 'Studios', 'Art Studio', 'Therapy Room', 'Visual Studio'];
  if (exclude.some(e => typeName.startsWith(e))) return null;
  return typeName.replace(/ - Flr:.*$/, '').replace(/^Premium - /, '').replace(/^Standard - /, '');
};

const MIN_STAY_DAYS = 28; // Only count bookings >= 28 days for occupancy & AWR

// ─── Shared PMS metrics computation ──────────────────────────────────────────
// Used by both connectPMS (initial load) and silentPmsRefresh (background)
// Helper: format date as YYYY-MM-DD using LOCAL time (avoids BST/UTC timezone shift)
function localDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function computePmsMetrics(allGuestStays, allBookings, allUnits) {
  const now = new Date();
  const today = localDateStr(now);
  const mthStart = today.slice(0,7) + "-01";
  const mthEnd = today.slice(0,7) + "-" + String(new Date(now.getFullYear(), now.getMonth()+1, 0).getDate()).padStart(2,"0");
  const wkStart = localDateStr(new Date(Date.now()-7*864e5));

  // ── Build contact history for renewal/move detection ──
  // Group stays by contactId to detect consecutive bookings.
  // Merge BOTH guestStays AND bookings — some CONFIRMED/PENDING follow-on stays
  // only appear in bookings (no guestStay record yet), so guestStays alone misses them.
  const contactStays = {};
  const seenRoomStayIds = new Set();
  allGuestStays.forEach(g => {
    const cid = g.contactId;
    if (!cid) return;
    if (!contactStays[cid]) contactStays[cid] = [];
    contactStays[cid].push({
      roomStayId: g.roomStayId, unitId: g.unitId,
      dateFrom: (g.dateFrom ?? "").slice(0,10),
      dateTo: (g.dateTo ?? "").slice(0,10),
      status: (g.status ?? "").toUpperCase()
    });
    seenRoomStayIds.add(g.roomStayId);
  });
  // Add bookings that don't have a guestStay record yet (e.g. future CONFIRMED/PENDING)
  allBookings.forEach(b => {
    if (seenRoomStayIds.has(b.roomStayId)) return; // already covered by guestStays
    const cid = b.contactId || b.bookingContact?.id;
    if (!cid) return;
    if (!contactStays[cid]) contactStays[cid] = [];
    contactStays[cid].push({
      roomStayId: b.roomStayId, unitId: b.unitId,
      dateFrom: (b.startDate ?? "").slice(0,10),
      dateTo: (b.endDate ?? "").slice(0,10),
      status: (b.roomStayStatus ?? "").toUpperCase()
    });
  });
  // FIX: guestStays endpoint reports PENDING bookings as CONFIRMED — override
  // with the authoritative status from the bookings endpoint. Without this,
  // pending renewals appear as "renewed" and disappear from the pending tracker.
  const bookingStatusByRsId = {};
  allBookings.forEach(b => {
    if (b.roomStayId && b.roomStayStatus) bookingStatusByRsId[b.roomStayId] = (b.roomStayStatus ?? "").toUpperCase();
  });
  Object.values(contactStays).forEach(stays => {
    stays.forEach(s => {
      const authStatus = bookingStatusByRsId[s.roomStayId];
      if (authStatus && authStatus === "PENDING" && s.status !== "PENDING") {
        s.status = "PENDING"; // bookings endpoint is authoritative for PENDING status
      }
    });
  });

  // Build a set of roomStayIds that are renewals or room moves (not genuinely new)
  // Check all pairs — adjacent-only comparison misses renewals when long stays
  // have intermediate short stays (e.g. event bookings) in between
  const renewalRoomStays = new Set();
  const roomMoveRoomStays = new Set();
  Object.values(contactStays).forEach(stays => {
    if (stays.length < 2) return;
    for (let i = 0; i < stays.length; i++) {
      const curr = stays[i];
      const currFromMs = new Date(curr.dateFrom).getTime();
      // Find any earlier stay whose end is within [-1, +7] days of this stay's start
      for (let j = 0; j < stays.length; j++) {
        if (j === i) continue;
        const prev = stays[j];
        const gap = (currFromMs - new Date(prev.dateTo).getTime()) / 864e5;
        if (gap >= -1 && gap <= 7) {
          if (prev.unitId === curr.unitId) {
            renewalRoomStays.add(curr.roomStayId);
          } else {
            roomMoveRoomStays.add(curr.roomStayId);
          }
          break;
        }
      }
    }
  });

  // Build a set of roomStayIds that checked back in after checkout (not true departures)
  // A check-out is "not real" if the same contact checks back in within 7 days
  const notRealCheckouts = new Set();
  Object.values(contactStays).forEach(stays => {
    if (stays.length < 2) return;
    for (let i = 0; i < stays.length; i++) {
      const curr = stays[i];
      if (curr.status !== "CHECKED_OUT" && !curr.dateTo) continue;
      const endMs = new Date(curr.dateTo).getTime();
      for (let j = 0; j < stays.length; j++) {
        if (j === i) continue;
        const gap = (new Date(stays[j].dateFrom).getTime() - endMs) / 864e5;
        if (gap >= -1 && gap <= 7) { notRealCheckouts.add(curr.roomStayId); break; }
      }
    }
  });

  // ── In House count (CHECKED_IN, deduplicated by roomStayId) ──
  const checkedInRooms = new Set();
  let inHouseGuestCount = 0;
  allGuestStays.forEach(g => {
    if ((g.status ?? "").toUpperCase() === "CHECKED_IN") {
      checkedInRooms.add(g.roomStayId);
      inHouseGuestCount++;
    }
  });
  const inHouseCount = checkedInRooms.size;

  // ── Check-ins (7d) — only genuinely NEW members, not renewals or room moves ──
  const newCheckInRooms7d = new Set();
  allGuestStays.forEach(g => {
    if ((g.status ?? "").toUpperCase() !== "CHECKED_IN") return;
    const d = (g.dateFrom ?? "").slice(0,10);
    if (d < wkStart || d > today) return;
    const rid = g.roomStayId;
    if (renewalRoomStays.has(rid) || roomMoveRoomStays.has(rid)) return; // skip renewals & moves
    newCheckInRooms7d.add(rid);
  });
  const checkInsWeek = newCheckInRooms7d.size;

  // ── Check-outs (7d) — only if the person does NOT check back in ──
  const realCheckOutRooms7d = new Set();
  allGuestStays.forEach(g => {
    if ((g.status ?? "").toUpperCase() !== "CHECKED_OUT") return;
    const d = (g.dateTo ?? "").slice(0,10);
    if (d < wkStart || d > today) return;
    const rid = g.roomStayId;
    if (notRealCheckouts.has(rid)) return; // person checked back in
    realCheckOutRooms7d.add(rid);
  });
  const checkOutsWeek = realCheckOutRooms7d.size;

  // ── Revenue — pro-rated for bookings active in current month ──
  // Only count 28+ day bookings to exclude short stays / desk bookings
  const proRateRevenue = (bookings, periodStart, periodEnd) => {
    let total = 0;
    bookings.forEach(b => {
      const from = (b.startDate ?? b.dateFrom ?? "").slice(0,10);
      const to = (b.endDate ?? b.dateTo ?? "").slice(0,10);
      if (!from || !to) return;
      const totalDays = Math.max(1, (new Date(to) - new Date(from)) / 864e5);
      if (totalDays < MIN_STAY_DAYS) return; // skip short stays
      const net = parseFloat(b.netAmount ?? 0);
      if (isNaN(net) || net <= 0) return;
      // Check overlap with period
      if (from > periodEnd || to < periodStart) return;
      const overlapStart = from > periodStart ? from : periodStart;
      const overlapEnd = to < periodEnd ? to : periodEnd;
      const overlapDays = Math.max(0, (new Date(overlapEnd) - new Date(overlapStart)) / 864e5 + 1);
      total += (net / totalDays) * overlapDays;
    });
    return total;
  };

  const monthlyRev = proRateRevenue(allBookings, mthStart, mthEnd);
  const weeklyRev = proRateRevenue(allBookings, wkStart, today);

  // ── Occupancy forecast — DAYS-BASED ──
  // occupancy = total booked days / (BEDS × daysInMonth)
  // Only count stays >= 28 days, deduplicate by unit per day
  // DEPARTURES & ARRIVALS count ALL statuses (incl. CHECKED_OUT) so past departures aren't missed
  // OCCUPANCY (booked days) counts only active stays for future months, ALL for current/past
  const nowDate = new Date();
  const forecastByRoom = [];
  const forecastMonths = [];
  // Full calendar year: Jan through Dec of current year
  const currentYear = nowDate.getFullYear();
  const currentMonthIdx = nowDate.getMonth(); // 0-indexed (Apr = 3)
  const FORECAST_START = -currentMonthIdx; // go back to Jan
  const FORECAST_MONTHS = 12; // Jan through Dec
  for (let m = FORECAST_START; m < FORECAST_START + FORECAST_MONTHS; m++) {
    const d = new Date(currentYear, currentMonthIdx + m, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
    const label = d.toLocaleDateString("en-GB", { month: "short", year: "numeric" });
    const daysInMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    forecastMonths.push({ key, label, daysInMonth });
  }

  const currentMonthKey = forecastMonths[0].key;
  const todayKey = `${nowDate.getFullYear()}-${String(nowDate.getMonth()+1).padStart(2,'0')}`;

  for (let m = 0; m < forecastMonths.length; m++) {
    const fm = forecastMonths[m];
    const mS = fm.key + "-01";
    const mE = fm.key + "-" + String(fm.daysInMonth).padStart(2, "0");
    const unitDays = {}; // unitId -> Set of booked day numbers (for occupancy)
    const seenRidsOcc = new Set(); // dedup for occupancy
    const seenRidsAll = new Set(); // dedup for arrivals/departures (ALL statuses)
    const checkInRooms = new Set();
    const checkOutRooms = new Set();

    allGuestStays.forEach(g => {
      const status = (g.status ?? "").toString().toUpperCase();
      const stayFrom = (g.dateFrom ?? "").slice(0, 10);
      const stayTo = (g.dateTo ?? "").slice(0, 10);
      if (!stayFrom || !stayTo) return;
      const totalDays = Math.round((new Date(stayTo) - new Date(stayFrom)) / 864e5);
      if (totalDays < MIN_STAY_DAYS) return; // skip short stays

      const rid = g.roomStayId ?? g.id;

      // Check overlap with this month
      if (stayFrom > mE || stayTo < mS) return;

      // === ARRIVALS & DEPARTURES: count from ALL statuses ===
      // (CHECKED_OUT stays still represent real arrivals/departures)
      if (!seenRidsAll.has(rid)) {
        seenRidsAll.add(rid);
        if (stayFrom >= mS && stayFrom <= mE) checkInRooms.add(rid);
        if (stayTo >= mS && stayTo <= mE) checkOutRooms.add(rid);
      }

      // === OCCUPANCY (booked days) ===
      // Past months only: include CHECKED_OUT — those guests actually stayed.
      // Current + future months: exclude CHECKED_OUT — only live/active bookings matter.
      const isPastMonth = fm.key < todayKey;
      if (isPastMonth) {
        if (!["CHECKED_IN", "CONFIRMED", "PENDING", "CHECKED_OUT"].includes(status)) return;
      } else {
        if (!["CHECKED_IN", "CONFIRMED", "PENDING"].includes(status)) return;
      }
      if (seenRidsOcc.has(rid)) return;
      seenRidsOcc.add(rid);

      // Count booked days per unit (prevents double counting overlapping bookings on same unit)
      const uid = g.unitId;
      if (!unitDays[uid]) unitDays[uid] = new Set();
      const overlapStart = new Date(Math.max(new Date(mS), new Date(stayFrom)));
      const overlapEnd = new Date(Math.min(new Date(mE), new Date(stayTo)));
      for (let day = new Date(overlapStart); day <= overlapEnd; day.setDate(day.getDate() + 1)) {
        unitDays[uid].add(localDateStr(day));
      }
    });

    let totalBookedDays = 0;
    Object.values(unitDays).forEach(daySet => totalBookedDays += daySet.size);
    const totalBookableDays = BEDS * fm.daysInMonth;

    forecastByRoom.push({
      key: fm.key, label: fm.label, daysInMonth: fm.daysInMonth,
      bookedDays: totalBookedDays,
      totalBookableDays,
      activeStays: Object.keys(unitDays).length, // unique units with active bookings
      checkIns: checkInRooms.size,
      checkOuts: checkOutRooms.size,
      occupancyPct: Math.round((totalBookedDays / totalBookableDays) * 100),
    });
  }

  // ── Room Type Data — days-based, deduplicated ──
  const unitIdToRoomType = {};
  const roomTypeCounts = {};
  ROOM_TYPES.forEach(rt => roomTypeCounts[rt] = 0);
  allUnits.forEach(u => {
    const rt = baseRoomType(u.unitTypeName);
    if (rt && ROOM_TYPES.includes(rt)) {
      unitIdToRoomType[u.id] = rt;
      roomTypeCounts[rt]++;
    }
  });

  const roomTypeData = {};
  ROOM_TYPES.forEach(rt => {
    roomTypeData[rt] = { totalUnits: roomTypeCounts[rt], months: [], awr: 0 };
    for (let m = 0; m < FORECAST_MONTHS; m++) {
      roomTypeData[rt].months.push({ bookedDays: 0, totalDays: roomTypeCounts[rt] * forecastMonths[m].daysInMonth, booked: 0, available: 0 });
    }
  });

  // Count booked days per room type per month (deduplicated by unit+day)
  const rtUnitDays = {}; // "rt|month|unitId" -> Set of day strings
  const seenRidsRT = new Set();
  allGuestStays.forEach(g => {
    const status = (g.status ?? "").toString().toUpperCase();
    const rid = g.roomStayId ?? g.id;
    if (seenRidsRT.has(rid)) return;
    seenRidsRT.add(rid);

    const uid = g.unitId;
    const rt = unitIdToRoomType[uid];
    if (!rt) return;
    const stayFrom = (g.dateFrom ?? "").slice(0, 10);
    const stayTo = (g.dateTo ?? "").slice(0, 10);
    if (!stayFrom || !stayTo) return;
    const totalDays = Math.round((new Date(stayTo) - new Date(stayFrom)) / 864e5);
    if (totalDays < MIN_STAY_DAYS) return;

    forecastMonths.forEach((fm, mi) => {
      const mS = fm.key + "-01";
      const mE = fm.key + "-" + String(fm.daysInMonth).padStart(2, "0");
      if (stayFrom > mE || stayTo < mS) return;
      // Past months only: include CHECKED_OUT for accurate historical data
      // Current + future: only live bookings
      const isPastRT = fm.key < todayKey;
      if (isPastRT) {
        if (!["CHECKED_IN", "CONFIRMED", "PENDING", "CHECKED_OUT"].includes(status)) return;
      } else {
        if (!["CHECKED_IN", "CONFIRMED", "PENDING"].includes(status)) return;
      }

      const mapKey = `${rt}|${mi}|${uid}`;
      if (!rtUnitDays[mapKey]) rtUnitDays[mapKey] = new Set();
      const overlapStart = new Date(Math.max(new Date(mS), new Date(stayFrom)));
      const overlapEnd = new Date(Math.min(new Date(mE), new Date(stayTo)));
      for (let day = new Date(overlapStart); day <= overlapEnd; day.setDate(day.getDate() + 1)) {
        rtUnitDays[mapKey].add(localDateStr(day));
      }
    });
  });

  // Aggregate days into roomTypeData
  Object.entries(rtUnitDays).forEach(([key, daySet]) => {
    const [rt, miStr] = key.split("|");
    const mi = parseInt(miStr);
    roomTypeData[rt].months[mi].bookedDays += daySet.size;
  });

  // Calculate booked units and available (for backward compat with existing UI)
  ROOM_TYPES.forEach(rt => {
    forecastMonths.forEach((fm, mi) => {
      const md = roomTypeData[rt].months[mi];
      const totalDaysForType = roomTypeCounts[rt] * fm.daysInMonth;
      md.totalDays = totalDaysForType;
      // "booked" as count of equivalent full-month units
      md.booked = totalDaysForType > 0 ? Math.round((md.bookedDays / totalDaysForType) * roomTypeCounts[rt]) : 0;
      md.available = Math.max(0, roomTypeCounts[rt] - md.booked);
      md.occupancyPct = totalDaysForType > 0 ? Math.round((md.bookedDays / totalDaysForType) * 100) : 0;
    });
  });

  // ── AWR — only 28+ day bookings, use b.unit.id for room type matching ──
  const awrByType = {};
  ROOM_TYPES.forEach(rt => awrByType[rt] = { sum: 0, count: 0 });
  let globalAwrSum = 0, globalAwrCount = 0;

  allBookings.forEach(b => {
    const status = (b.roomStayStatus ?? "").toUpperCase();
    if (!["CHECKED_IN", "CONFIRMED"].includes(status)) return;
    const from = (b.startDate ?? "").slice(0,10);
    const to = (b.endDate ?? "").slice(0,10);
    if (!from || !to) return;
    const days = Math.round((new Date(to) - new Date(from)) / 864e5);
    if (days < MIN_STAY_DAYS) return; // only long-term stays
    const net = parseFloat(b.netAmount ?? 0);
    if (isNaN(net) || net <= 0) return;
    const weeklyRate = (net / days) * 7;
    if (weeklyRate <= 0 || weeklyRate > 5000) return; // sanity

    globalAwrSum += weeklyRate;
    globalAwrCount++;

    // Match to room type via b.unit.id (bookings use unit object, not unitId)
    const uid = b.unit?.id ?? b.unitId;
    const rt = unitIdToRoomType[uid];
    if (rt) {
      awrByType[rt].sum += weeklyRate;
      awrByType[rt].count++;
    }
  });

  ROOM_TYPES.forEach(rt => {
    roomTypeData[rt].awr = awrByType[rt].count > 0 ? Math.round(awrByType[rt].sum / awrByType[rt].count) : 0;
  });

  const globalAwr = globalAwrCount > 0 ? Math.round(globalAwrSum / globalAwrCount) : 0;

  // ─── Length-of-stay distribution (from last 12 months of bookings) ───
  // Bucket: <=31d, 31-91d, 92-181d, 365+d. Bookings that fall 182-364d
  // (between long and annual) are split proportionally so buckets sum to 100%.
  // Renewals and room-moves are excluded — they aren't independent "new" stays.
  const losCutoff = new Date(now);
  losCutoff.setMonth(losCutoff.getMonth() - 12);
  const losCutoffStr = localDateStr(losCutoff);

  const losBuckets = {
    short:  { label: "≤31 days",    min: 0,   max: 31,   count: 0, sumDays: 0 },
    medium: { label: "31–91 days",  min: 31,  max: 91,   count: 0, sumDays: 0 },
    long:   { label: "92–181 days", min: 91,  max: 181,  count: 0, sumDays: 0 },
    annual: { label: "365+ days",   min: 181, max: 9999, count: 0, sumDays: 0 },
  };

  allBookings.forEach(b => {
    const status = (b.roomStayStatus ?? "").toUpperCase();
    // Count both completed (CHECKED_OUT) and in-progress (CHECKED_IN / CONFIRMED) so
    // recent data is represented. This measures the *intended* length of stay.
    if (!["CHECKED_OUT", "CHECKED_IN", "CONFIRMED"].includes(status)) return;
    const from = (b.startDate ?? "").slice(0,10);
    const to = (b.endDate ?? "").slice(0,10);
    if (!from || !to || from < losCutoffStr) return;
    // Exclude renewals / room moves — they're chained, not fresh stays
    const rid = b.roomStayId;
    if (rid && (renewalRoomStays.has(rid) || roomMoveRoomStays.has(rid))) return;
    const days = Math.round((new Date(to) - new Date(from)) / 864e5);
    if (days < 1) return;
    // Exclude very short desk / hot-room bookings
    if (days < 1) return;
    let bucket;
    if (days <= 31) bucket = losBuckets.short;
    else if (days <= 91) bucket = losBuckets.medium;
    else if (days <= 181) bucket = losBuckets.long;
    else bucket = losBuckets.annual;
    bucket.count++;
    bucket.sumDays += days;
  });

  const totalLosCount = Object.values(losBuckets).reduce((s,b)=>s+b.count, 0);
  const losDistribution = Object.fromEntries(
    Object.entries(losBuckets).map(([k,b]) => [k, {
      label: b.label,
      count: b.count,
      share: totalLosCount > 0 ? b.count / totalLosCount : 0,
      avgDays: b.count > 0 ? Math.round(b.sumDays / b.count) : 0,
    }])
  );
  losDistribution.total = totalLosCount;
  losDistribution.cutoff = losCutoffStr;

  // ─── AWR by status (28+ day bookings only) — net AND gross ─────────────────
  const awrByStatus = {
    inHouse:  { sumNet: 0, sumGross: 0, count: 0, awr: 0, awrGross: 0 },
    upcoming: { sumNet: 0, sumGross: 0, count: 0, awr: 0, awrGross: 0 },
    all:      { sumNet: 0, sumGross: 0, count: 0, awr: 0, awrGross: 0 },
  };
  allBookings.forEach(b => {
    const status = (b.roomStayStatus ?? "").toUpperCase();
    let group;
    if (status === "CHECKED_IN") group = awrByStatus.inHouse;
    else if (status === "CONFIRMED" || status === "PENDING") group = awrByStatus.upcoming;
    else return;
    const fromD = (b.startDate ?? "").slice(0, 10);
    const toD   = (b.endDate ?? "").slice(0, 10);
    if (!fromD || !toD) return;
    const days = Math.round((new Date(toD) - new Date(fromD)) / 864e5);
    if (days < MIN_STAY_DAYS) return;
    const net = parseFloat(b.netAmount ?? 0);
    const vat = parseFloat(b.vatAmount ?? 0);
    if (isNaN(net) || net <= 0) return;
    const gross = net + (isNaN(vat) ? 0 : vat);
    const weeklyNet = (net / days) * 7;
    const weeklyGross = (gross / days) * 7;
    if (weeklyNet <= 0 || weeklyNet > 5000) return;
    group.sumNet += weeklyNet;
    group.sumGross += weeklyGross;
    group.count++;
    awrByStatus.all.sumNet += weeklyNet;
    awrByStatus.all.sumGross += weeklyGross;
    awrByStatus.all.count++;
  });
  for (const g of [awrByStatus.inHouse, awrByStatus.upcoming, awrByStatus.all]) {
    g.awr = g.count > 0 ? Math.round(g.sumNet / g.count) : 0;
    g.awrGross = g.count > 0 ? Math.round(g.sumGross / g.count) : 0;
  }

  // ─── Live LoS breakdown by booking status ──────────────────────────────────
  // Two groups: "inHouse" (CHECKED_IN) and "upcoming" (CONFIRMED + PENDING).
  // Bands per user spec: <31d, 31-91d, 92-181d, 182-363d, 364d+.
  const LOS_BANDS = [
    { key: "lt31",    label: "< 31 days",       min: 0,   max: 30  },
    { key: "d31_91",  label: "31 – 91 days",    min: 31,  max: 91  },
    { key: "d92_181", label: "92 – 181 days",   min: 92,  max: 181 },
    { key: "d182_363",label: "182 – 363 days",  min: 182, max: 363 },
    { key: "d364",    label: "364+ days",        min: 364, max: 99999 },
  ];
  const makeEmpty = () => LOS_BANDS.reduce((o, b) => { o[b.key] = 0; return o; }, {});
  const losByStatus = {
    inHouse:  { counts: makeEmpty(), total: 0 },
    upcoming: { counts: makeEmpty(), total: 0 },
    bands: LOS_BANDS,
  };
  allBookings.forEach(b => {
    const status = (b.roomStayStatus ?? "").toUpperCase();
    let group;
    if (status === "CHECKED_IN") group = losByStatus.inHouse;
    else if (status === "CONFIRMED" || status === "PENDING") group = losByStatus.upcoming;
    else return;
    const fromD = (b.startDate ?? "").slice(0, 10);
    const toD   = (b.endDate ?? "").slice(0, 10);
    if (!fromD || !toD) return;
    const days = Math.round((new Date(toD) - new Date(fromD)) / 864e5);
    if (days < 1) return;
    const band = LOS_BANDS.find(bd => days >= bd.min && days <= bd.max);
    if (band) { group.counts[band.key]++; group.total++; }
  });

  // ─── Renewals data — group active bookings by contract end month ───────────
  // Detect renewals: same contact has ANY stay starting within 14 days of current end
  // NOTE: must check all pairs, not just adjacent — long stays with intermediate short
  // stays break adjacent-only comparison (e.g. a 12-month stay with 1-day event stays)
  // Track the STATUS of the follow-on stay so we can distinguish:
  //   CONFIRMED/CHECKED_IN = truly renewed (signed)
  //   PENDING = contract on account but not yet signed
  const renewalFollowOnStatus = {}; // roomStayId → best follow-on status
  const renewalFollowOnRoomStayId = {}; // roomStayId → follow-on roomStayId (for financials)
  Object.values(contactStays).forEach(stays => {
    if (stays.length < 2) return;
    for (let i = 0; i < stays.length; i++) {
      const endMs = new Date(stays[i].dateTo).getTime();
      for (let j = 0; j < stays.length; j++) {
        if (j === i) continue;
        const gap = (new Date(stays[j].dateFrom).getTime() - endMs) / 864e5;
        // Allow up to 30 days of overlap (room moves / mid-stay extensions can have large overlaps)
        if (gap >= -30 && gap <= 14) {
          const followStatus = (stays[j].status || "").toUpperCase();
          const prev = renewalFollowOnStatus[stays[i].roomStayId];
          // Prefer CHECKED_OUT/CHECKED_IN (proven) > CONFIRMED (signed) > PENDING
          const rank = {"CHECKED_OUT":3,"CHECKED_IN":3,"CONFIRMED":2,"PENDING":1};
          if (!prev || (rank[followStatus]||0) > (rank[prev]||0)) {
            renewalFollowOnStatus[stays[i].roomStayId] = followStatus;
            renewalFollowOnRoomStayId[stays[i].roomStayId] = stays[j].roomStayId;
          }
        }
      }
    }
  });
  const renewedRoomStayIds = new Set(Object.keys(renewalFollowOnStatus).map(Number));

  // Build a lookup of roomStayId → booking financials for follow-on rate display
  const bookingByRoomStayId = {};
  allBookings.forEach(b => {
    if (b.roomStayId) bookingByRoomStayId[b.roomStayId] = b;
  });

  // ─── Build consecutive stay chains per contact ─────────────────────────────
  // Chain = sequence of stays where gap between end→start is ≤ 14 days.
  // If a chain's cumulative days ≥ 27, ALL stays in that chain qualify for the
  // renewals board — even individually short extensions (e.g. 14d, 9d, 1d).
  // Any stay that follows a prior stay in the chain is marked as an extension/renewal.
  const chainCumulDays = {}; // roomStayId → cumulative days of its chain
  const chainMaxSingleStay = {}; // roomStayId → longest individual stay (days) in its chain
  const chainStayCount = {}; // roomStayId → number of stays in its chain
  const isChainExtension = {}; // roomStayId → true if this stay follows a prior in its chain
  {
    // Group bookings by contact
    const byContact = {};
    allBookings.forEach(b => {
      const cid = b.contactId || b.bookingContact?.id;
      if (!cid) return;
      const start = (b.startDate ?? "").slice(0, 10);
      const end = (b.endDate ?? "").slice(0, 10);
      if (!start || !end) return;
      const status = (b.roomStayStatus ?? "").toUpperCase();
      if (!["CHECKED_IN", "CONFIRMED", "PENDING", "CHECKED_OUT"].includes(status)) return;
      if (!byContact[cid]) byContact[cid] = [];
      byContact[cid].push({ rsid: b.roomStayId, start, end, days: Math.round((new Date(end) - new Date(start)) / 864e5) });
    });
    // For each contact, sort stays by start date and build chains
    Object.values(byContact).forEach(stays => {
      stays.sort((a, b) => a.start.localeCompare(b.start));
      // Build chains: a stay joins the current chain if it starts within 14 days of the previous stay's end
      let chains = [];
      let current = [stays[0]];
      for (let i = 1; i < stays.length; i++) {
        const prevEnd = new Date(current[current.length - 1].end).getTime();
        const gap = (new Date(stays[i].start).getTime() - prevEnd) / 864e5;
        if (gap >= -30 && gap <= 14) {
          current.push(stays[i]);
        } else {
          chains.push(current);
          current = [stays[i]];
        }
      }
      chains.push(current);
      // Calculate cumulative days for each chain and mark extensions
      for (const chain of chains) {
        const totalDays = chain.reduce((s, c) => s + c.days, 0);
        const maxSingle = Math.max(...chain.map(c => c.days));
        chain.forEach((c, idx) => {
          chainCumulDays[c.rsid] = totalDays;
          chainMaxSingleStay[c.rsid] = maxSingle;
          chainStayCount[c.rsid] = chain.length;
          if (idx > 0) isChainExtension[c.rsid] = true;
        });
      }
    });
  }

  const renewalsMap = {};
  const todayStr = localDateStr(now);
  allBookings.forEach(b => {
    const status = (b.roomStayStatus ?? "").toUpperCase();
    const endDate = (b.endDate ?? "").slice(0, 10);
    if (!endDate) return;
    const isPast = endDate < todayStr;
    // Include CHECKED_OUT for ALL dates — covers early checkouts (contract end in future
    // but guest already departed). Without this, early checkouts vanish from the renewals board.
    if (!["CHECKED_IN", "CONFIRMED", "PENDING", "CHECKED_OUT"].includes(status)) return;
    const startDate = (b.startDate ?? "").slice(0, 10);
    if (!startDate) return;
    const days = Math.round((new Date(endDate) - new Date(startDate)) / 864e5);
    // Use cumulative chain days for the 27-day threshold — if a contact's consecutive
    // stays total 27+ days, include ALL stays in that chain (even short extensions)
    const cumulDays = chainCumulDays[b.roomStayId] || days;
    if (cumulDays < 27) return;

    // ─── EXCLUSION FILTERS (align dashboard with manual tracker) ─────────────
    // 1. Non-residential units: parking, bike storage, corridors etc.
    const unitRoomType = unitIdToRoomType[b.unit?.id];
    if (!unitRoomType) return; // null = excluded unit type (parking, bike, corridor, etc.)

    // 2. £0 stays: staff/internal rooms (e.g. Manan Maqsood, Paul Gillingham)
    const netAmt = parseFloat(b.netAmount ?? 0);
    const vatAmt = parseFloat(b.vatAmount ?? 0);
    const grossAmt = netAmt + (isNaN(vatAmt) ? 0 : vatAmt);
    if (grossAmt <= 0) return; // skip £0 PCM / staff rooms

    // 3. Short-stay / nightly-rate guests: chains of multiple short bookings where
    //    no single stay reaches 28 days. These are transient guests, not standard
    //    residential contracts (e.g. Cody Moir, Callum Webber, Joseph Levi Ryan).
    const maxSingle = chainMaxSingleStay[b.roomStayId] || days;
    const stayCount = chainStayCount[b.roomStayId] || 1;
    if (stayCount >= 2 && maxSingle < 28) return; // multiple short stays chained = nightly/short-stay pattern

    // 4. Very short stays in multi-stay chains: if this stay is ≤ 3 days AND part of
    //    a chain with 2+ stays, it's a trial/bridge/gap-fill — not a real renewal
    //    decision. Applies to any position in the chain (first or follow-on).
    //    The actual renewal decision is on the longer stay(s) in the chain.
    if (days <= 3 && stayCount >= 2) return;

    const monthKey = endDate.slice(0, 7);
    if (!renewalsMap[monthKey]) renewalsMap[monthKey] = [];
    const gross = grossAmt; // reuse from filter calculation above
    // Use calendar month diff for more accurate PCM (avoids 30-day stays showing inflated rates)
    const sD = new Date(startDate), eD = new Date(endDate);
    const calMonths = (eD.getFullYear() - sD.getFullYear()) * 12 + (eD.getMonth() - sD.getMonth()) + (eD.getDate() - sD.getDate()) / 30;
    const months = calMonths > 0 ? calMonths : (days > 0 ? days / 30.44 : 1);
    const daysUntilExpiry = Math.round((new Date(endDate) - now) / 864e5);
    const followOnStatus = renewalFollowOnStatus[b.roomStayId] || null;
    // Renewed = follow-on is CONFIRMED, CHECKED_IN, or CHECKED_OUT
    // (any confirmed/active/completed follow-on means the resident has renewed)
    const isRenewed = followOnStatus === "CHECKED_IN" || followOnStatus === "CHECKED_OUT" || followOnStatus === "CONFIRMED";
    // Pending = only via manual pendingSet (for cases where RH API doesn't expose the pending stay)
    const isPendingRenewal = followOnStatus === "PENDING";
    // Is this stay itself an extension/renewal of a prior stay in the chain?
    const isExtension = !!isChainExtension[b.roomStayId];
    // Auto-mark as expired/leaving if:
    // - end date has passed and no follow-on, OR
    // - guest already CHECKED_OUT (early checkout) and no follow-on
    const isEarlyCheckout = status === "CHECKED_OUT" && !isPast;
    const expired = (isPast || isEarlyCheckout) && !isRenewed && !isPendingRenewal;

    // Calculate follow-on stay's PCM rate when available (shows renewal rate, not expiring rate)
    let renewalPcm = null;
    const followOnRsId = renewalFollowOnRoomStayId[b.roomStayId];
    if (followOnRsId && bookingByRoomStayId[followOnRsId]) {
      const fb = bookingByRoomStayId[followOnRsId];
      const fNet = parseFloat(fb.netAmount ?? 0);
      const fVat = parseFloat(fb.vatAmount ?? 0);
      const fGross = fNet + (isNaN(fVat) ? 0 : fVat);
      const fStart = (fb.startDate ?? "").slice(0, 10);
      const fEnd = (fb.endDate ?? "").slice(0, 10);
      const fDays = Math.round((new Date(fEnd) - new Date(fStart)) / 864e5);
      // Calendar month diff for accurate PCM
      const fsD = new Date(fStart), feD = new Date(fEnd);
      const fCalMonths = (feD.getFullYear() - fsD.getFullYear()) * 12 + (feD.getMonth() - fsD.getMonth()) + (feD.getDate() - fsD.getDate()) / 30;
      const fMonths = fCalMonths > 0 ? fCalMonths : (fDays > 0 ? fDays / 30.44 : 1);
      renewalPcm = fMonths > 0 ? Math.round(fGross / fMonths) : 0;
    }

    renewalsMap[monthKey].push({
      bookingId: b.bookingId,
      bookingReference: b.bookingReference,
      customerReference: b.customerReference || "",
      roomStayId: b.roomStayId,
      contactId: b.contactId || b.bookingContact?.id,
      name: `${b.bookingContact?.firstName || ""} ${b.bookingContact?.lastName || ""}`.trim(),
      email: (b.bookingContact?.emailAddress || "").toLowerCase().trim(),
      phone: b.bookingContact?.mobileNumber || b.bookingContact?.phoneNumber || "",
      startDate, endDate, losDays: days, cumulDays: cumulDays,
      room: b.unit?.name || "—",
      roomType: unitRoomType, // already validated non-null above
      status, pcm: months > 0 ? Math.round(gross / months) : 0,
      renewalPcm, // PCM of the follow-on stay (null if no follow-on)
      grossTotal: Math.round(gross),
      isRenewed,
      isPendingRenewal,
      isExtension, // true = this stay is a follow-on/extension in a consecutive chain
      followOnStatus,
      daysUntilExpiry,
      critical: daysUntilExpiry >= 0 && daysUntilExpiry <= 14 && !isRenewed && !isPendingRenewal,
      expired, // true = contract ended without any follow-on → auto-leaving
    });
  });
  // Deduplicate: if the same contact has multiple stays ending in the same month
  // (chain extensions / room moves), keep only the latest-ending stay.
  // Earlier stays in the chain are intermediate — not separate renewal decisions.
  Object.keys(renewalsMap).forEach(monthKey => {
    const arr = renewalsMap[monthKey];
    const byContact = {};
    arr.forEach(e => {
      const cid = e.contactId;
      if (!cid) { byContact[e.roomStayId] = e; return; } // no contact → keep as-is
      if (!byContact[cid] || e.endDate > byContact[cid].endDate) {
        byContact[cid] = e; // keep latest-ending stay per contact
      }
    });
    renewalsMap[monthKey] = Object.values(byContact);
  });
  Object.values(renewalsMap).forEach(arr => arr.sort((a, b) => a.endDate.localeCompare(b.endDate)));

  // Build months from Jan of current year through 12 months ahead
  const renewalMonths = [];
  const janStart = -now.getMonth(); // offset to reach January
  const totalMonths = 12 + now.getMonth(); // Jan through 12 months from now
  for (let m = janStart; m < janStart + totalMonths; m++) {
    const d = new Date(now.getFullYear(), now.getMonth() + m, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("en-GB", { month: "short", year: "numeric" });
    const entries = renewalsMap[key] || [];
    renewalMonths.push({
      key, label, entries,
      notRenewed: entries.filter(e => !e.isRenewed && !e.expired),
      renewed: entries.filter(e => e.isRenewed),
      critical: entries.filter(e => e.critical && !e.isRenewed && !e.expired),
      autoLeaving: entries.filter(e => e.expired),
      total: entries.length,
    });
  }

  // ─── Weekly Renewals Activity ──────────────────────────────────────────────
  // Two sources of renewal events:
  // 1. Follow-on bookings detected via renewalFollowOnRoomStayId (chain matching)
  // 2. ALL pending bookings for contacts that have a current CHECKED_IN stay
  //    (catches pending renewals that chain-matching misses)
  // Creation date is parsed from bookingReference (YYYYMMDD-NNNNN format).
  const weeklyRenewals = (() => {
    const parseCreated = (ref) => {
      if (!ref || ref.length < 8) return null;
      return `${ref.slice(0,4)}-${ref.slice(4,6)}-${ref.slice(6,8)}`;
    };
    const getWeekMonday = (dateStr) => {
      const d = new Date(dateStr);
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      const mon = new Date(d);
      mon.setDate(diff);
      return localDateStr(mon);
    };
    // Track which roomStayIds we've already added to avoid duplicates
    const seenFollowOnRsIds = new Set();

    // Source 1: follow-on bookings from chain matching
    const renewalEvents = [];
    Object.entries(renewalFollowOnRoomStayId).forEach(([expiringRsId, followOnRsId]) => {
      const followOnBooking = bookingByRoomStayId[followOnRsId];
      if (!followOnBooking) return;
      const created = parseCreated(followOnBooking.bookingReference);
      if (!created) return;
      const followOnStatus = (followOnBooking.roomStayStatus ?? "").toUpperCase();
      if (!["PENDING","CONFIRMED","CHECKED_IN","CHECKED_OUT"].includes(followOnStatus)) return;
      const expiringBooking = bookingByRoomStayId[Number(expiringRsId)];
      if (!expiringBooking) return;
      const bld = (expiringBooking.unit?.buildingName || followOnBooking.unit?.buildingName || "").toLowerCase();
      if (!bld.includes("southall")) return;
      const effectiveStatus = (followOnStatus === "CHECKED_IN" || followOnStatus === "CHECKED_OUT") ? "CONFIRMED" : followOnStatus;
      seenFollowOnRsIds.add(followOnRsId);
      renewalEvents.push({
        created,
        weekMonday: getWeekMonday(created),
        status: effectiveStatus,
        name: `${followOnBooking.bookingContact?.firstName || ""} ${followOnBooking.bookingContact?.lastName || ""}`.trim(),
        bookingRef: followOnBooking.bookingReference,
        expiringRef: expiringBooking.bookingReference,
        room: followOnBooking.unit?.name || expiringBooking.unit?.name || "—",
        followOnStart: (followOnBooking.startDate ?? "").slice(0,10),
        followOnEnd: (followOnBooking.endDate ?? "").slice(0,10),
      });
    });

    // Source 2: ALL pending bookings for in-house contacts (not already captured above)
    // This catches pending renewals that chain-matching misses (e.g. gap > 14 days,
    // or booking created before the prior stay existed in the system)
    const checkedInContactIds = new Set();
    allBookings.forEach(b => {
      if ((b.roomStayStatus ?? "").toUpperCase() === "CHECKED_IN") {
        const cid = b.contactId || b.bookingContact?.id;
        if (cid) checkedInContactIds.add(cid);
      }
    });
    allBookings.forEach(b => {
      if (seenFollowOnRsIds.has(b.roomStayId)) return; // already captured via chain matching
      const status = (b.roomStayStatus ?? "").toUpperCase();
      if (status !== "PENDING") return;
      const cid = b.contactId || b.bookingContact?.id;
      if (!cid || !checkedInContactIds.has(cid)) return; // only for in-house contacts
      const bld = (b.unit?.buildingName || "").toLowerCase();
      if (!bld.includes("southall")) return;
      const created = parseCreated(b.bookingReference);
      if (!created) return;
      // Find the contact's current checked-in booking as the "expiring" reference
      const currentStay = allBookings.find(cb =>
        (cb.contactId || cb.bookingContact?.id) === cid &&
        (cb.roomStayStatus ?? "").toUpperCase() === "CHECKED_IN" &&
        (cb.unit?.buildingName || "").toLowerCase().includes("southall")
      );
      renewalEvents.push({
        created,
        weekMonday: getWeekMonday(created),
        status: "PENDING",
        name: `${b.bookingContact?.firstName || ""} ${b.bookingContact?.lastName || ""}`.trim(),
        bookingRef: b.bookingReference,
        expiringRef: currentStay?.bookingReference || "—",
        room: b.unit?.name || currentStay?.unit?.name || "—",
        followOnStart: (b.startDate ?? "").slice(0,10),
        followOnEnd: (b.endDate ?? "").slice(0,10),
      });
    });

    // Group by week
    const byWeek = {};
    for (const ev of renewalEvents) {
      if (!byWeek[ev.weekMonday]) byWeek[ev.weekMonday] = [];
      byWeek[ev.weekMonday].push(ev);
    }
    const weekKeys = Object.keys(byWeek).sort().slice(-12);
    return weekKeys.map(wk => {
      const events = byWeek[wk];
      const wkEnd = new Date(wk);
      wkEnd.setDate(wkEnd.getDate() + 6);
      return {
        weekMonday: wk,
        weekLabel: `${new Date(wk).toLocaleDateString("en-GB",{day:"numeric",month:"short"})} – ${wkEnd.toLocaleDateString("en-GB",{day:"numeric",month:"short"})}`,
        events,
        total: events.length,
        confirmed: events.filter(e => e.status === "CONFIRMED").length,
        pending: events.filter(e => e.status === "PENDING").length,
      };
    });
  })();

  // ─── All Current Pending Renewals (unfiltered snapshot) ────────────────────
  // For the Renewal Activity tracker: show ALL pending bookings for in-house
  // contacts regardless of creation date. This is a "current state" metric.
  const pendingRenewals = (() => {
    const ciContactIds = new Set();
    allBookings.forEach(b => {
      if ((b.roomStayStatus ?? "").toUpperCase() === "CHECKED_IN") {
        const cid = b.contactId || b.bookingContact?.id;
        if (cid) ciContactIds.add(cid);
      }
    });
    const results = [];
    allBookings.forEach(b => {
      const status = (b.roomStayStatus ?? "").toUpperCase();
      if (status !== "PENDING") return;
      const cid = b.contactId || b.bookingContact?.id;
      if (!cid || !ciContactIds.has(cid)) return;
      const bld = (b.unit?.buildingName || "").toLowerCase();
      if (!bld.includes("southall")) return;
      const parseCreated = (ref) => {
        if (!ref || ref.length < 8) return null;
        return `${ref.slice(0,4)}-${ref.slice(4,6)}-${ref.slice(6,8)}`;
      };
      const currentStay = allBookings.find(cb =>
        (cb.contactId || cb.bookingContact?.id) === cid &&
        (cb.roomStayStatus ?? "").toUpperCase() === "CHECKED_IN" &&
        (cb.unit?.buildingName || "").toLowerCase().includes("southall")
      );
      results.push({
        created: parseCreated(b.bookingReference) || "—",
        status: "PENDING",
        name: `${b.bookingContact?.firstName || ""} ${b.bookingContact?.lastName || ""}`.trim(),
        bookingRef: b.bookingReference,
        roomStayId: b.roomStayId,
        expiringRef: currentStay?.bookingReference || "—",
        room: b.unit?.name || currentStay?.unit?.name || "—",
        followOnStart: (b.startDate ?? "").slice(0,10),
        followOnEnd: (b.endDate ?? "").slice(0,10),
        // These will be enriched after individual roomStay fetch:
        conversionDate: null, confirmedDate: null, contractSignedDate: null,
      });
    });
    return results;
  })();

  // ─── All Current Confirmed Renewals (unfiltered snapshot) ──────────────────
  const confirmedRenewals = (() => {
    const ciContactIds = new Set();
    allBookings.forEach(b => {
      if ((b.roomStayStatus ?? "").toUpperCase() === "CHECKED_IN") {
        const cid = b.contactId || b.bookingContact?.id;
        if (cid) ciContactIds.add(cid);
      }
    });
    const results = [];
    allBookings.forEach(b => {
      const status = (b.roomStayStatus ?? "").toUpperCase();
      if (status !== "CONFIRMED") return;
      const cid = b.contactId || b.bookingContact?.id;
      if (!cid || !ciContactIds.has(cid)) return;
      const bld = (b.unit?.buildingName || "").toLowerCase();
      if (!bld.includes("southall")) return;
      const parseCreated = (ref) => {
        if (!ref || ref.length < 8) return null;
        return `${ref.slice(0,4)}-${ref.slice(4,6)}-${ref.slice(6,8)}`;
      };
      const currentStay = allBookings.find(cb =>
        (cb.contactId || cb.bookingContact?.id) === cid &&
        (cb.roomStayStatus ?? "").toUpperCase() === "CHECKED_IN" &&
        (cb.unit?.buildingName || "").toLowerCase().includes("southall")
      );
      results.push({
        created: parseCreated(b.bookingReference) || "—",
        status: "CONFIRMED",
        name: `${b.bookingContact?.firstName || ""} ${b.bookingContact?.lastName || ""}`.trim(),
        bookingRef: b.bookingReference,
        roomStayId: b.roomStayId,
        expiringRef: currentStay?.bookingReference || "—",
        room: b.unit?.name || currentStay?.unit?.name || "—",
        followOnStart: (b.startDate ?? "").slice(0,10),
        followOnEnd: (b.endDate ?? "").slice(0,10),
        // These will be enriched after individual roomStay fetch:
        conversionDate: null, confirmedDate: null, contractSignedDate: null,
      });
    });
    return results;
  })();

  return {
    occupied: inHouseCount,
    inHouseGuests: inHouseGuestCount,
    checkInsWeek,
    checkOutsWeek,
    total: allUnits.length || BEDS,
    occupancyPct: Math.round(inHouseCount / BEDS * 100),
    revenue: Math.round(monthlyRev),
    weeklyRevenue: Math.round(weeklyRev),
    forecast: forecastByRoom,
    roomTypeData,
    globalAwr,
    renewalCount: renewalRoomStays.size,
    roomMoveCount: roomMoveRoomStays.size,
    losDistribution,
    losByStatus,
    awrByStatus,
    renewalMonths,
    weeklyRenewals,
    pendingRenewals,
    confirmedRenewals,
  };
}

// ─── GHL SETTINGS ─────────────────────────────────────────────────────────────
const GHL_LOCATION = "PwquLuIhIjj0D80e6jLU";
const GHL_PIPELINE = "Southall &Soul";
const TAG_TOUR     = "tour booked";
const STAGE_BOOKED = "booking confirmed";

// ─── GHL API — routes through /api/ghl (server-side, no CORS issues) ──────────
async function ghlGet(path) {
  const res = await fetch(`/api/ghl?path=${encodeURIComponent(path)}`);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const msg  = data?.error ?? data?.message ?? data?.msg ?? JSON.stringify(data).slice(0,200) ?? `HTTP ${res.status}`;
    if (res.status === 401) throw new Error("GHL 401: Invalid API key — check your environment variable.");
    if (res.status === 403) throw new Error("GHL 403: Forbidden — key may not have access to this location.");
    if (res.status === 422) throw new Error(`GHL 422: ${msg} — Path: ${path}`);
    throw new Error(`GHL ${res.status}: ${msg}`);
  }
  return res.json();
}

async function fetchAllOpps(pipelineId, dateFrom, dateTo) {
  let all=[], startAfter, startAfterId, safety=0;
  while(safety < 20) {
    const p = new URLSearchParams({
      location_id: GHL_LOCATION,
      pipeline_id: pipelineId,
      limit: "100",
    });
    if (startAfter)   p.set("startAfter", startAfter);
    if (startAfterId) p.set("startAfterId", startAfterId);
    const res = await ghlGet(`/opportunities/search?${p}`);
    const opps = res?.opportunities ?? res?.data ?? [];
    all = all.concat(opps);
    startAfter   = res?.meta?.startAfter   ?? res?.startAfter   ?? null;
    startAfterId = res?.meta?.startAfterId ?? res?.startAfterId ?? null;
    const total  = res?.meta?.total ?? res?.total ?? opps.length;
    if (all.length >= total || opps.length === 0 || !startAfter) break;
    safety++;
  }
  if (dateFrom || dateTo) {
    all = all.filter(o => {
      const created = (o.createdAt ?? o.dateAdded ?? o.created_at ?? "").slice(0,10);
      const updated = (o.updatedAt ?? o.lastStatusChangeAt ?? o.updated_at ?? "").slice(0,10);
      // Include if created OR updated/won within the date range
      const createdInRange = created && (!dateFrom || created >= dateFrom) && (!dateTo || created <= dateTo);
      const updatedInRange = updated && (!dateFrom || updated >= dateFrom) && (!dateTo || updated <= dateTo);
      if (!created && !updated) return true;
      return createdInRange || updatedInRange;
    });
  }
  return all;
}

async function loadGHL(dateFrom, dateTo) {
  const pRes = await ghlGet(`/opportunities/pipelines?locationId=${GHL_LOCATION}`);
  const pipelines = pRes?.pipelines ?? pRes?.data ?? [];

  const pipeline = pipelines.find(p => p.name?.trim() === GHL_PIPELINE)
    ?? pipelines.find(p => p.name?.toLowerCase().includes("southall"));
  if (!pipeline) throw new Error(
    `Pipeline "${GHL_PIPELINE}" not found. Available: ${pipelines.map(p=>p.name).join(", ")||"none"}`
  );

  const stages = pipeline.stages ?? [];

  const tourStage = stages.find(s => s.name?.trim().toLowerCase() === TAG_TOUR.toLowerCase())
    ?? stages.find(s => s.name?.toLowerCase().includes("tour"));

  const bookedStage = stages.find(s => s.name?.trim().toLowerCase() === STAGE_BOOKED.toLowerCase())
    ?? stages.find(s => s.name?.toLowerCase().includes("booking confirmed"))
    ?? stages.find(s => s.name?.toLowerCase().includes("booking"));

  // Wide lookback pool — all opps in the past ~180 days before dateFrom,
  // used for CAC email→channel attribution. UI metrics still use narrow window.
  const lookbackFrom = (() => {
    if (!dateFrom) return null;
    const d = new Date(dateFrom);
    if (isNaN(d)) return null;
    d.setDate(d.getDate() - 180);
    return d.toISOString().slice(0, 10);
  })();

  const [opps, allOppsLookup] = await Promise.all([
    fetchAllOpps(pipeline.id, dateFrom, dateTo),
    lookbackFrom ? fetchAllOpps(pipeline.id, lookbackFrom, dateTo) : Promise.resolve(null),
  ]);

  // GHL tags live on contact.tags / relations[].tags, NOT on the opportunity directly
  const getOppTags = (o) => {
    const contactTags = o.contact?.tags ?? [];
    const relationTags = (o.relations ?? []).flatMap(r => r.tags ?? []);
    const oppTags = o.tags ?? [];
    return [...contactTags, ...relationTags, ...oppTags];
  };

  const tours = opps.filter(o => {
    const inTourStage = tourStage ? o.pipelineStageId === tourStage.id : false;
    const hasTag = getOppTags(o).some(t => t.toLowerCase().trim() === TAG_TOUR.toLowerCase());
    return inTourStage || hasTag;
  });

  const confirmed = opps.filter(o => {
    const inBookedStage = bookedStage
      ? o.pipelineStageId === bookedStage.id
      : (o.pipelineStage?.name ?? o.stage?.name ?? "").toLowerCase().includes("booking");
    const won = (o.status??"").toLowerCase() === "won";
    return inBookedStage || won;
  });

  const confirmedValue = confirmed.reduce((s,o) => {
    const v = parseFloat(o.monetaryValue ?? o.value ?? o.amount ?? 0);
    return s + (isNaN(v) ? 0 : v);
  }, 0);

  return {
    pipelineName:    pipeline.name,
    stages:          stages.map(s=>({id:s.id,name:s.name})),
    tourStageName:   tourStage?.name ?? null,
    bookedStageName: bookedStage?.name ?? null,
    toursBooked:     tours.length,
    confirmed:       confirmed.length,
    confirmedValue,
    convRate:        tours.length > 0 ? Math.round(confirmed.length/tours.length*100) : null,
    totalOpps:       opps.length,
    allOpps:         opps,
    allOppsLookup:   allOppsLookup || opps,
  };
}

// ─── RES HARMONICS — routes through /api/rh (server-side, no CORS issues) ───
// ─── EXCEL EXPORT HELPER ─────────────────────────────────────────────────────
// Dynamically loads SheetJS from CDN and generates .xlsx file
async function exportRenewalsToExcel(monthStats, leavingSet, pendingSet, leavingReasons, customerRefs) {
  // Load SheetJS if not already loaded
  if (!window.XLSX) {
    await new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }
  const XLSX = window.XLSX;

  // Collect all renewed + pending entries across all months
  const rows = [];
  monthStats.forEach(m => {
    const exportEntries = [...m.renewed, ...m.pendingRenewal];
    exportEntries.forEach(e => {
      const status = e.isRenewed ? "Renewed" : (e.isPendingRenewal || pendingSet.has(e.roomStayId)) ? "Pending" : "Not Started";
      rows.push({
        "Name": e.name || "—",
        "Email": e.email || "—",
        "Phone": e.phone || "—",
        "Room": e.room || "—",
        "Room Type": e.roomType || "—",
        "Booking Ref": e.bookingReference || "—",
        "Customer Ref": (customerRefs && customerRefs[e.roomStayId]) || e.customerReference || "—",
        "Contract Start": e.startDate || "—",
        "Contract End": e.endDate || "—",
        "Days Until Expiry": e.daysUntilExpiry ?? "—",
        "Current PCM (£)": e.pcm || 0,
        "Renewal PCM (£)": e.renewalPcm ?? "—",
        "Status": status,
        "Renewal Month": m.label,
        "Departure Reason": leavingReasons[e.roomStayId] || "—",
      });
    });
  });

  if (rows.length === 0) {
    alert("No renewed or pending entries to export.");
    return;
  }

  // Create workbook
  const ws = XLSX.utils.json_to_sheet(rows);
  // Set column widths
  ws["!cols"] = [
    { wch: 22 }, // Name
    { wch: 28 }, // Email
    { wch: 16 }, // Phone
    { wch: 14 }, // Room
    { wch: 16 }, // Room Type
    { wch: 18 }, // Booking Ref
    { wch: 18 }, // Customer Ref
    { wch: 14 }, // Contract Start
    { wch: 14 }, // Contract End
    { wch: 16 }, // Days Until Expiry
    { wch: 14 }, // Current PCM
    { wch: 14 }, // Renewal PCM
    { wch: 12 }, // Status
    { wch: 14 }, // Renewal Month
    { wch: 22 }, // Departure Reason
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Renewals");
  const today = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `AndSoul_Renewals_${today}.xlsx`);
}

async function getRHToken(cid, sec) {
  const r = await fetch(`/api/rh?action=token&client_id=${encodeURIComponent(cid)}&client_secret=${encodeURIComponent(sec)}`);
  const data = await r.json();
  if(!r.ok) throw new Error(data?.error ?? `Auth ${r.status}`);
  return data.access_token;
}
async function rhFetch(tok,path) {
  const r = await fetch(`/api/rh?action=fetch&path=${encodeURIComponent(path)}`,{headers:{"x-rh-token":tok}});
  const data = await r.json();
  if(!r.ok) throw new Error(data?.error ?? `${r.status}`);
  return data;
}

async function rhUpdate(tok, path, body) {
  const r = await fetch(`/api/rh?action=update&path=${encodeURIComponent(path)}`, {
    method: "POST",
    headers: { "x-rh-token": tok, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data?.error ?? `${r.status}`);
  return data;
}

async function rhFetchAll(tok, basePath, maxPages=50) {
  let all = [];
  let page = 0;
  while (page < maxPages) {
    const sep = basePath.includes("?") ? "&" : "?";
    const data = await rhFetch(tok, `${basePath}${sep}page=${page}&size=100`);
    const content = data.content ?? data.data ?? data.results ?? (Array.isArray(data) ? data : []);
    all = all.concat(content);
    const pageInfo = data.page ?? {};
    const totalPages = pageInfo.totalPages ?? 1;
    const totalElements = pageInfo.totalElements ?? all.length;
    if (page + 1 >= totalPages || all.length >= totalElements) break;
    page++;
  }
  return all;
}

// ─── Enrich renewal objects with status change dates from individual roomStay ─
// The list endpoint doesn't include conversionDate/confirmedDate/contractSignedDate.
// We must fetch /api/v3/roomStays/{id} for each renewal to get these timestamps.
async function enrichRenewalsWithDates(tok, renewals) {
  const BATCH = 10; // concurrency limit
  for (let i = 0; i < renewals.length; i += BATCH) {
    const batch = renewals.slice(i, i + BATCH);
    await Promise.all(batch.map(async (r) => {
      if (!r.roomStayId) return;
      try {
        const detail = await rhFetch(tok, `/api/v3/roomStays/${r.roomStayId}`);
        r.conversionDate = detail.conversionDate ? detail.conversionDate.slice(0, 10) : null;
        r.confirmedDate = detail.confirmedDate ? detail.confirmedDate.slice(0, 10) : null;
        r.contractSignedDate = detail.contractSignedDate ? detail.contractSignedDate.slice(0, 10) : null;
        r.lastStatusChangeDate = detail.lastStatusChangeDate ? detail.lastStatusChangeDate.slice(0, 10) : null;
      } catch (e) {
        console.log(`Failed to enrich roomStay ${r.roomStayId}:`, e.message);
      }
    }));
  }
  return renewals;
}

// ─── UI COMPONENTS ────────────────────────────────────────────────────────────
const Tip = ({active,payload,label}) => {
  if(!active||!payload?.length) return null;
  return <div style={{background:"#13161b",border:`1px solid ${C.border}`,borderRadius:8,padding:"10px 14px",fontSize:12}}>
    <p style={{color:C.muted,marginBottom:6,fontFamily:"monospace"}}>{label}</p>
    {payload.map((p,i)=><p key={i} style={{color:p.color,margin:"2px 0"}}>{p.name}: <strong>{p.name==="leads"?p.value:p.name==="cpl"?fmt(p.value,"£",2):fmt(p.value)}</strong></p>)}
  </div>;
};

const KPI = ({label,value,sub,accent=C.gold,badge}) => (
  <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:"18px 20px",borderTop:`2px solid ${accent}`,flex:"1 1 140px",minWidth:0,position:"relative"}}>
    {badge&&<span style={{position:"absolute",top:10,right:12,fontSize:10,color:accent,background:accent+"22",padding:"2px 8px",borderRadius:20}}>{badge}</span>}
    <p style={{color:C.muted,fontSize:10,letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:6}}>{label}</p>
    <p style={{fontSize:26,fontWeight:700,color:C.text,fontFamily:"'DM Mono',monospace",letterSpacing:"-0.02em"}}>{value}</p>
    {sub&&<p style={{fontSize:11,color:C.muted,marginTop:4}}>{sub}</p>}
  </div>
);

const OccRing = ({pct,color=C.gold,label="target"}) => {
  const r=42,c=2*Math.PI*r,d=(pct/100)*c;
  return <svg width={110} height={110} viewBox="0 0 100 100">
    <circle cx="50" cy="50" r={r} fill="none" stroke={C.border} strokeWidth="9"/>
    <circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="9" strokeDasharray={`${d} ${c}`} strokeDashoffset={c*0.25} strokeLinecap="round" style={{transition:"stroke-dasharray 0.5s ease"}}/>
    <text x="50" y="47" textAnchor="middle" fill={C.text} fontSize="15" fontWeight="700" fontFamily="DM Mono,monospace">{pct}%</text>
    <text x="50" y="61" textAnchor="middle" fill={C.muted} fontSize="6.5">{label}</text>
  </svg>;
};

const PRESETS=[{l:"7d",d:7},{l:"14d",d:14},{l:"30d",d:30}];
const dinp={background:C.card,border:`1px solid ${C.border}`,color:C.text,borderRadius:8,padding:"5px 10px",fontSize:12,fontFamily:"DM Mono,monospace"};

// ─── CALENDAR DATE PICKER ───
const CalendarPicker = ({ value, onChange, style }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const parsed = value ? new Date(value + "T00:00:00") : new Date();
  const [viewYear, setViewYear] = useState(parsed.getFullYear());
  const [viewMonth, setViewMonth] = useState(parsed.getMonth());

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Sync view when value changes externally
  useEffect(() => {
    if (value) {
      const d = new Date(value + "T00:00:00");
      setViewYear(d.getFullYear());
      setViewMonth(d.getMonth());
    }
  }, [value]);

  const DAYS = ["Mo","Tu","We","Th","Fr","Sa","Su"];
  const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  // Monday = 0
  let startDay = new Date(viewYear, viewMonth, 1).getDay() - 1;
  if (startDay < 0) startDay = 6;

  const cells = [];
  for (let i = 0; i < startDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const today = new Date().toISOString().slice(0,10);
  const fmt = (d) => `${viewYear}-${String(viewMonth+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;

  const displayDate = value
    ? new Date(value + "T00:00:00").toLocaleDateString("en-GB", { day:"2-digit", month:"short", year:"numeric" })
    : "Pick date";

  const prevMonth = () => { if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y-1); } else setViewMonth(m => m-1); };
  const nextMonth = () => { if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y+1); } else setViewMonth(m => m+1); };

  return (
    <div ref={ref} style={{ position:"relative", display:"inline-block", ...style }}>
      <button onClick={() => setOpen(!open)} style={{
        padding:"4px 10px", borderRadius:8, border:`1px solid ${C.border}`, background:C.card,
        color:C.text, fontSize:11, fontFamily:"'DM Mono',monospace", cursor:"pointer",
        display:"flex", alignItems:"center", gap:5, whiteSpace:"nowrap"
      }}>
        <span style={{fontSize:13}}>📅</span> {displayDate}
      </button>
      {open && (
        <div style={{
          position:"absolute", top:"100%", left:0, marginTop:4, zIndex:9999,
          background:C.card, border:`1px solid ${C.border}`, borderRadius:12,
          padding:12, boxShadow:"0 8px 24px rgba(0,0,0,0.4)", width:240
        }}>
          {/* Header: month nav */}
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
            <button onClick={prevMonth} style={{ background:"none", border:"none", color:C.muted, cursor:"pointer", fontSize:14, padding:"2px 6px" }}>◀</button>
            <span style={{ fontSize:12, fontWeight:700, color:C.text }}>{MONTHS[viewMonth]} {viewYear}</span>
            <button onClick={nextMonth} style={{ background:"none", border:"none", color:C.muted, cursor:"pointer", fontSize:14, padding:"2px 6px" }}>▶</button>
          </div>
          {/* Day headers */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:1, marginBottom:4 }}>
            {DAYS.map(d => <div key={d} style={{ textAlign:"center", fontSize:9, color:C.muted, fontWeight:700, padding:"2px 0" }}>{d}</div>)}
          </div>
          {/* Day grid */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:1 }}>
            {cells.map((day, i) => {
              if (!day) return <div key={`e${i}`} />;
              const iso = fmt(day);
              const isSelected = iso === value;
              const isToday = iso === today;
              return (
                <button key={i} onClick={() => { onChange(iso); setOpen(false); }} style={{
                  width:30, height:28, borderRadius:6, border:"none", cursor:"pointer",
                  fontSize:11, fontWeight: isSelected ? 700 : 400,
                  background: isSelected ? C.gold+"33" : "transparent",
                  color: isSelected ? C.gold : isToday ? C.sage : C.text,
                  outline: isToday && !isSelected ? `1px solid ${C.sage}44` : "none",
                  margin:"0 auto", display:"flex", alignItems:"center", justifyContent:"center",
                }}>
                  {day}
                </button>
              );
            })}
          </div>
          {/* Quick: Today */}
          <div style={{ marginTop:8, textAlign:"center" }}>
            <button onClick={() => { onChange(today); setOpen(false); }} style={{
              fontSize:10, color:C.gold, background:"none", border:"none", cursor:"pointer", textDecoration:"underline"
            }}>Today</button>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── PERFORMANCE INSIGHTS: period-over-period, source mix, device mix, expert playbook ───
const PerformanceInsights = ({ analytics, propertyLabel }) => {
  if (!analytics?.data) return null;
  const { periodComparison: pc, trafficSources = [], devices = [], expertPlaybook = [] } = analytics.data;
  const fmtPct = (n) => (n >= 0 ? "+" : "") + n.toFixed(0) + "%";
  const changeColor = (n, goodWhenPositive = true) => {
    if (n === null || n === undefined) return C.muted;
    if (Math.abs(n) < 2) return C.muted;
    const isGood = goodWhenPositive ? n > 0 : n < 0;
    return isGood ? C.sage : C.rose;
  };
  const arrow = (n) => (n > 2 ? "↑" : n < -2 ? "↓" : "→");

  // Channel group aggregates from trafficSources
  const channelTotals = {};
  let totalSrcSessions = 0;
  trafficSources.forEach(r => {
    const g = r.channelGroup || "Other";
    channelTotals[g] = (channelTotals[g] || 0) + r.sessions;
    totalSrcSessions += r.sessions;
  });
  const channels = Object.entries(channelTotals)
    .map(([name, sessions]) => ({ name, sessions, pct: totalSrcSessions ? sessions / totalSrcSessions : 0 }))
    .sort((a, b) => b.sessions - a.sessions);

  const channelColor = (name) => {
    if (/Organic Search/i.test(name)) return C.sage;
    if (/Paid Search/i.test(name)) return C.blue;
    if (/Paid Social|Organic Social/i.test(name)) return C.gold;
    if (/Direct/i.test(name)) return C.text;
    if (/Referral/i.test(name)) return "#b78af7";
    if (/Email/i.test(name)) return "#59c5d2";
    return C.muted;
  };

  const totalDeviceSessions = devices.reduce((s, r) => s + r.sessions, 0) || 1;
  const deviceColor = { mobile: C.blue, desktop: C.sage, tablet: C.gold };

  const playbookColors = { high: C.rose, medium: C.gold, low: C.muted, success: C.sage };
  const playbookIcons = { high: "🔴", medium: "🟡", low: "💡", success: "✅" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 14 }}>
      {/* Period-over-period strip */}
      {pc && (
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div>
              <p style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Period-over-Period · {propertyLabel}
              </p>
              <p style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>
                Current range vs prior {pc.days} days ({pc.priorFrom} → {pc.priorTo})
              </p>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}>
            {[
              { key: "sessions", label: "Sessions", curr: pc.sessions.current, prior: pc.sessions.prior, change: pc.sessions.change, goodPositive: true },
              { key: "confirmations", label: "Applications", curr: pc.confirmations.current, prior: pc.confirmations.prior, change: pc.confirmations.change, goodPositive: true },
              { key: "convRate", label: "Conversion Rate", curr: (pc.conversionRate.current * 100).toFixed(1) + "%", prior: (pc.conversionRate.prior * 100).toFixed(1) + "%", change: pc.conversionRate.change, goodPositive: true },
            ].map(m => (
              <div key={m.key} style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 14px" }}>
                <p style={{ fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>{m.label}</p>
                <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                  <span style={{ fontSize: 20, fontWeight: 700, color: C.text, fontFamily: "DM Mono,monospace" }}>{m.curr}</span>
                  <span style={{ fontSize: 11, color: C.muted, fontFamily: "DM Mono,monospace" }}>vs {m.prior}</span>
                </div>
                {m.change !== null && m.change !== undefined && (
                  <p style={{ fontSize: 11, color: changeColor(m.change, m.goodPositive), fontWeight: 600, marginTop: 4 }}>
                    {arrow(m.change)} {fmtPct(m.change)}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Source + Device row */}
      {(channels.length > 0 || devices.length > 0) && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 14 }}>
          {channels.length > 0 && (
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16 }}>
              <p style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>
                Traffic Source Mix · {propertyLabel}
              </p>
              <p style={{ fontSize: 10, color: C.muted, marginBottom: 12 }}>Channel groups driving landing-page sessions</p>
              {/* Stacked bar */}
              <div style={{ display: "flex", height: 12, borderRadius: 6, overflow: "hidden", marginBottom: 12, background: C.bg }}>
                {channels.map(ch => (
                  <div key={ch.name} title={`${ch.name}: ${(ch.pct * 100).toFixed(1)}%`} style={{ width: `${ch.pct * 100}%`, background: channelColor(ch.name) }} />
                ))}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {channels.slice(0, 6).map(ch => (
                  <div key={ch.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 11 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ width: 10, height: 10, borderRadius: 3, background: channelColor(ch.name), display: "inline-block" }} />
                      <span style={{ color: C.text }}>{ch.name}</span>
                    </div>
                    <div style={{ display: "flex", gap: 12, fontFamily: "DM Mono,monospace" }}>
                      <span style={{ color: C.muted }}>{ch.sessions.toLocaleString()}</span>
                      <span style={{ color: channelColor(ch.name), minWidth: 52, textAlign: "right" }}>{(ch.pct * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {devices.length > 0 && (
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16 }}>
              <p style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>
                Device Split · {propertyLabel}
              </p>
              <p style={{ fontSize: 10, color: C.muted, marginBottom: 12 }}>Share of sessions & per-device engagement</p>
              <div style={{ display: "flex", height: 12, borderRadius: 6, overflow: "hidden", marginBottom: 12, background: C.bg }}>
                {devices.map(d => (
                  <div key={d.device} title={`${d.device}: ${((d.sessions / totalDeviceSessions) * 100).toFixed(1)}%`} style={{ width: `${(d.sessions / totalDeviceSessions) * 100}%`, background: deviceColor[d.device] || C.muted }} />
                ))}
              </div>
              <table style={{ width: "100%", fontSize: 11, fontFamily: "DM Mono,monospace", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ color: C.muted }}>
                    <th style={{ textAlign: "left", fontWeight: 500, padding: "4px 0" }}>Device</th>
                    <th style={{ textAlign: "right", fontWeight: 500, padding: "4px 0" }}>Sessions</th>
                    <th style={{ textAlign: "right", fontWeight: 500, padding: "4px 0" }}>Share</th>
                    <th style={{ textAlign: "right", fontWeight: 500, padding: "4px 0" }}>Bounce</th>
                    <th style={{ textAlign: "right", fontWeight: 500, padding: "4px 0" }}>Engage</th>
                  </tr>
                </thead>
                <tbody>
                  {devices.map(d => (
                    <tr key={d.device} style={{ borderTop: `1px solid ${C.border}` }}>
                      <td style={{ padding: "6px 0", color: C.text, textTransform: "capitalize" }}>
                        <span style={{ width: 8, height: 8, borderRadius: 2, background: deviceColor[d.device] || C.muted, display: "inline-block", marginRight: 6 }} />
                        {d.device}
                      </td>
                      <td style={{ padding: "6px 0", textAlign: "right", color: C.text }}>{d.sessions.toLocaleString()}</td>
                      <td style={{ padding: "6px 0", textAlign: "right", color: C.muted }}>{((d.sessions / totalDeviceSessions) * 100).toFixed(1)}%</td>
                      <td style={{ padding: "6px 0", textAlign: "right", color: C.muted }}>{(d.bounceRate * 100).toFixed(1)}%</td>
                      <td style={{ padding: "6px 0", textAlign: "right", color: C.muted }}>{(d.engagementRate * 100).toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Expert Playbook */}
      {expertPlaybook.length > 0 && (
        <div style={{ background: C.card, border: `1px solid ${C.sage}44`, borderRadius: 12, padding: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 12 }}>
            <div>
              <p style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em" }}>Expert SEO & Landing Page Playbook · {propertyLabel}</p>
              <p style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>Prioritised, data-backed recommendations for organic growth and conversion lift</p>
            </div>
            <span style={{ fontSize: 9, padding: "2px 10px", borderRadius: 10, background: C.rose + "22", color: C.rose }}>
              {expertPlaybook.filter(x => x.priority === "high").length} high priority
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {expertPlaybook.map((item, i) => {
              const bc = playbookColors[item.priority] || C.muted;
              return (
                <div key={i} style={{ background: C.bg, border: `1px solid ${bc}33`, borderLeft: `3px solid ${bc}`, borderRadius: 8, padding: "12px 14px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 6 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 12 }}>{playbookIcons[item.priority]}</span>
                      <span style={{ fontSize: 12.5, color: C.text, fontWeight: 600 }}>{item.title}</span>
                    </div>
                    <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                      <span style={{ fontSize: 9, padding: "2px 8px", borderRadius: 8, background: bc + "18", color: bc }}>{item.priority}</span>
                      <span style={{ fontSize: 9, padding: "2px 8px", borderRadius: 8, background: C.blue + "18", color: C.blue }}>{item.category}</span>
                    </div>
                  </div>
                  <p style={{ fontSize: 11, color: C.muted, lineHeight: 1.5, marginBottom: 6, fontStyle: "italic" }}>
                    <span style={{ color: C.text, fontStyle: "normal", fontWeight: 500 }}>Why: </span>{item.why}
                  </p>
                  <p style={{ fontSize: 11, color: C.text, lineHeight: 1.55, marginBottom: 6 }}>
                    <span style={{ color: C.text, fontWeight: 500 }}>Action: </span>
                    <span style={{ color: C.muted }}>{item.action}</span>
                  </p>
                  <p style={{ fontSize: 10, color: bc, fontFamily: "DM Mono,monospace" }}>{item.metric}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [tab, setTab] = useState("marketing");
  const [property, setProperty] = useState("southall");
  const [sdTab, setSdTab] = useState("marketing");
  const [preset, setPreset] = useState(30);
  const todayISO = new Date().toISOString().slice(0,10);
  const [from, setFrom] = useState(()=>{const d=new Date();d.setDate(d.getDate()-29);return d.toISOString().slice(0,10);});
  const [to,   setTo]   = useState(todayISO);

  useEffect(()=>{
    if(!preset) return;
    const end=new Date(), start=new Date(end);
    start.setDate(end.getDate()-preset+1);
    setFrom(start.toISOString().slice(0,10));
    setTo(end.toISOString().slice(0,10));
  },[preset]);

  const rangeLabel = preset ? `Last ${preset}d` : `${from} → ${to}`;

  // ─── LIVE DATA: Meta + Google via Windsor.ai ────────────────────────────────
  const [liveMetaData, setLiveMetaData] = useState(null);
  const [liveGoogleData, setLiveGoogleData] = useState(null);
  const [metaIsLive, setMetaIsLive] = useState(false);
  const [googleIsLive, setGoogleIsLive] = useState(false);
  const [adLoading, setAdLoading] = useState(false);

  const fetchLiveMeta = useCallback(async (dateFrom, dateTo, prop) => {
    try {
      const r = await fetch(`/api/meta?dateFrom=${dateFrom}&dateTo=${dateTo}&property=${prop}`);
      const j = await r.json();
      if (j.configured && j.data) { setLiveMetaData(j.data); setMetaIsLive(true); }
      else { setLiveMetaData(null); setMetaIsLive(false); }
    } catch(e) { console.log("Meta fetch error:", e.message); setLiveMetaData(null); setMetaIsLive(false); }
  }, []);

  const fetchLiveGoogle = useCallback(async (dateFrom, dateTo, prop) => {
    try {
      const r = await fetch(`/api/google?dateFrom=${dateFrom}&dateTo=${dateTo}&property=${prop}`);
      const j = await r.json();
      if (j.configured && j.data) { setLiveGoogleData(j.data); setGoogleIsLive(true); }
      else { setLiveGoogleData(null); setGoogleIsLive(false); }
    } catch(e) { console.log("Google fetch error:", e.message); setLiveGoogleData(null); setGoogleIsLive(false); }
  }, []);

  // ─── LIVE DATA: GA4 Landing Page Analytics ──────────────────────────────────
  const [analyticsData, setAnalyticsData] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [sdAnalyticsData, setSdAnalyticsData] = useState(null);

  const fetchAnalytics = useCallback(async (dateFrom, dateTo, prop) => {
    try {
      const r = await fetch(`/api/analytics?dateFrom=${dateFrom}&dateTo=${dateTo}&property=${prop}`);
      const j = await r.json();
      if (j.configured && j.data) return j.data;
      return null;
    } catch(e) { console.log("Analytics fetch error:", e.message); return null; }
  }, []);

  useEffect(()=>{
    setAdLoading(true);
    setAnalyticsLoading(true);
    Promise.all([
      fetchLiveMeta(from, to, property),
      fetchLiveGoogle(from, to, property),
      fetchAnalytics(from, to, "southall").then(d => setAnalyticsData(d)),
      fetchAnalytics(from, to, "shoreditch").then(d => setSdAnalyticsData(d)),
    ]).finally(()=>{ setAdLoading(false); setAnalyticsLoading(false); });
  }, [from, to, property]);

  // ─── COMPUTED: prefer live data, fall back to static ────────────────────────
  const metaRows  = useMemo(()=>META_DAILY.filter(r=>r.iso>=from&&r.iso<=to),[from,to]);

  // Chart data: live or static
  const chartData = useMemo(()=>{
    if (metaIsLive && liveMetaData?.daily) {
      return liveMetaData.daily.map(d => {
        const gDay = googleIsLive && liveGoogleData?.daily ? liveGoogleData.daily.find(g=>g.date===d.date) : null;
        const dt = new Date(d.date);
        return { d: `${dt.getDate()}/${dt.getMonth()+1}`, meta: d.spend, google: gDay ? gDay.spend : 0, leads: d.leads, cpl: d.leads > 0 ? d.spend/d.leads : 0 };
      });
    }
    return metaRows.map(r=>({d:r.d,meta:r.spend,google:GOOGLE_DAILY_SPEND[r.iso]??0,leads:r.leads,cpl:r.cpl}));
  },[metaIsLive, liveMetaData, googleIsLive, liveGoogleData, metaRows]);

  const metaSpend = metaIsLive && liveMetaData ? liveMetaData.totalSpend : metaRows.reduce((s,r)=>s+r.spend,0);
  const metaLeads = metaIsLive && liveMetaData ? liveMetaData.totalLeads : metaRows.reduce((s,r)=>s+r.leads,0);
  const metaCpl   = metaLeads>0 ? metaSpend/metaLeads : 0;
  const gSpend    = googleIsLive && liveGoogleData ? liveGoogleData.totalSpend : metaRows.reduce((s,r)=>s+(GOOGLE_DAILY_SPEND[r.iso]??0),0);
  const gConvs    = googleIsLive && liveGoogleData ? liveGoogleData.totalConversions : GOOGLE_CAMPAIGNS.reduce((s,c)=>s+c.convs,0);
  const googleCostPerSubmit = gConvs>0 ? gSpend/gConvs : 0;
  const blendedAvgCPL = (metaLeads+gConvs)>0 ? (metaSpend+gSpend)/(metaLeads+gConvs) : 0;
  const liveCampaigns = googleIsLive && liveGoogleData?.campaigns ? liveGoogleData.campaigns : GOOGLE_CAMPAIGNS;

  // ─── COST PER BOOKING (Southall) ──────────────────────────────────────────
  // Joins RH bookings (by email) ↔ GHL opps (utmSource in attributions) ↔ Meta/Google spend.
  // A "booking" = any RH record whose booking-reference date falls in [from,to]
  // and whose building is Southall. Bookings are attributed to a channel only
  // if we find the guest's email on a GHL opp with a Facebook/Google utmSource;
  // otherwise they count as "Other" for blended CAC.
  const [rhAllBookings, setRhAllBookings] = useState([]);
  const [rhAllUnits, setRhAllUnits] = useState([]);
  const [ghlData, setGhlData] = useState(null);
  const [cpbExpanded, setCpbExpanded] = useState(false);
  const cacStats = useMemo(() => {
    const opps = ghlData?.allOpps || [];
    // Wide lookback pool for email→channel attribution: catches Meta leads
    // captured 40–180d before dateFrom who book inside the current window.
    const lookupOpps = ghlData?.allOppsLookup || opps;
    const bookings = rhAllBookings || [];
    if (!opps.length || !bookings.length) return null;

    // Classify a raw utmSource/source string into a channel.
    // Returns null when the value is empty OR doesn't match any known platform
    // (so the caller can keep walking the attributions list).
    // Returns "other" ONLY for explicit non-paid sources (referrals, organic, etc).
    const classifyChannel = (s) => {
      const v = (s || "").toLowerCase().trim();
      if (!v) return null;
      // Meta variants observed in GHL: facebook, fb, ig, instagram, meta
      // plus common ad-platform suffixes
      if (/^(facebook|fb|meta|ig|instagram)(\.com|_ads|ads|-ads)?$/.test(v)) return "meta";
      // Google variants: adwords, google, google_ads
      if (/^(google|adwords)(_ads|ads)?$/.test(v)) return "google";
      // Explicit non-paid sources — treat as "other" so the walk stops
      return "other";
    };
    // Meta signal in utmMedium (Facebook Lead Forms often set
    // utmMedium="Broad ... - Lead Form" or similar when utmSource is empty).
    const mediumSignalsMeta = (m) => {
      const v = (m || "").toLowerCase();
      if (!v) return false;
      // "lead form" is the strongest Meta signal; guard against Google
      // campaigns that happen to include "google" in the name.
      if (/google|adwords/.test(v)) return false;
      return /\blead[\s._-]?form\b/.test(v);
    };
    // Pick the best channel for an opp by walking all attributions:
    //   1. Prefer the isLast=true attribution if it classifies cleanly.
    //   2. Otherwise walk backwards (most recent first) and take the first
    //      classifiable touch. This rescues cases where isLast has empty
    //      utmSource but an earlier touch was Meta/Google.
    //   3. Finally fall back to the opp's top-level `source` field.
    const getOppChannel = (o) => {
      const attrs = o.attributions || [];
      const tryAttr = (a) => {
        if (!a) return null;
        const bySrc = classifyChannel(a.utmSource);
        if (bySrc === "meta" || bySrc === "google") return bySrc;
        if (mediumSignalsMeta(a.utmMedium)) return "meta";
        return bySrc; // null or "other"
      };
      const last = attrs.find(a => a.isLast);
      const fromLast = tryAttr(last);
      if (fromLast === "meta" || fromLast === "google") return fromLast;
      for (let i = attrs.length - 1; i >= 0; i--) {
        if (attrs[i] === last) continue;
        const ch = tryAttr(attrs[i]);
        if (ch === "meta" || ch === "google") return ch;
      }
      if (fromLast === "other") return "other";
      return classifyChannel(o.source) || "other";
    };

    // Email → latest-opp channel lookup.
    // Walk the WIDE lookup pool so leads captured months ago still attribute
    // when they book in the current window. If multiple opps share an email,
    // prefer the one with the strongest (Meta/Google) signal, then most recent.
    const channelRank = { meta: 3, google: 2, other: 1 };
    const emailMap = {};
    for (const o of lookupOpps) {
      const email = (o.contact?.email || "").toLowerCase().trim();
      if (!email) continue;
      const ch = getOppChannel(o);
      const oppDate = o.createdAt || o.dateAdded || "";
      const existing = emailMap[email];
      if (!existing) {
        emailMap[email] = { channel: ch, oppDate };
        continue;
      }
      const newRank = channelRank[ch] || 0;
      const oldRank = channelRank[existing.channel] || 0;
      if (newRank > oldRank || (newRank === oldRank && oppDate > existing.oppDate)) {
        emailMap[email] = { channel: ch, oppDate };
      }
    }

    // "YYYYMMDD-NNNN" → ISO
    const refToIso = (ref) => {
      if (!ref || ref.length < 8) return null;
      return `${ref.slice(0,4)}-${ref.slice(4,6)}-${ref.slice(6,8)}`;
    };
    // LoS bands per user spec: 28–92 / 93–182 / 183–360 / 361+
    const banding = (d) => {
      if (d == null || d < 0) return null;
      if (d <= 92) return "1m";
      if (d <= 182) return "3m";
      if (d <= 360) return "6m";
      return "12m";
    };
    const bandLabel = { "1m":"1m (≤92d)", "3m":"3m (93–182d)", "6m":"6m (183–360d)", "12m":"12m+ (361d+)" };

    const rows = [];
    const lags = [];
    for (const b of bookings) {
      const bld = (b.unit?.buildingName || "").toLowerCase();
      if (!bld.includes("southall")) continue;
      const refIso = refToIso(b.bookingReference);
      const email = (b.bookingContact?.emailAddress || "").toLowerCase().trim();
      const losDays = (b.startDate && b.endDate)
        ? Math.round((new Date(b.endDate) - new Date(b.startDate)) / 86400000)
        : null;
      const band = banding(losDays);
      const value = parseFloat(b.netAmount || 0) + parseFloat(b.vatAmount || 0);
      const match = email ? emailMap[email] : null;
      const channel = match?.channel || "other";

      // lag (historical, all matched — independent of window)
      if (match && refIso && match.oppDate) {
        const oppIso = (match.oppDate || "").slice(0,10);
        if (oppIso) {
          const lag = Math.round((new Date(refIso) - new Date(oppIso)) / 86400000);
          if (lag >= 0 && lag <= 365) lags.push(lag);
        }
      }

      // in-window filter
      if (!refIso) continue;
      if (from && refIso < from) continue;
      if (to && refIso > to) continue;

      rows.push({
        bookingId: b.bookingId, ref: b.bookingReference, refIso,
        name: `${b.bookingContact?.firstName || ""} ${b.bookingContact?.lastName || ""}`.trim(),
        email, start: b.startDate, end: b.endDate,
        losDays, band, value, channel,
        status: b.roomStayStatus, unit: b.unit?.name,
      });
    }

    const counts = { meta:0, google:0, other:0, total: rows.length };
    const valueByChannel = { meta:0, google:0, other:0 };
    const losBandCounts = { "1m":0, "3m":0, "6m":0, "12m":0 };
    const losBandValue  = { "1m":0, "3m":0, "6m":0, "12m":0 };
    const losBandChannel = { "1m":{meta:0,google:0,other:0}, "3m":{meta:0,google:0,other:0}, "6m":{meta:0,google:0,other:0}, "12m":{meta:0,google:0,other:0} };
    for (const r of rows) {
      counts[r.channel]++;
      valueByChannel[r.channel] += r.value;
      if (r.band) { losBandCounts[r.band]++; losBandValue[r.band] += r.value; losBandChannel[r.band][r.channel]++; }
    }

    const totalSpend = metaSpend + gSpend;
    const blendedCAC = counts.total > 0 ? totalSpend / counts.total : 0;
    const metaCAC    = counts.meta  > 0 ? metaSpend   / counts.meta  : 0;
    const googleCAC  = counts.google> 0 ? gSpend      / counts.google: 0;

    const bandCAC = {}, bandAvgValue = {}, bandCacPctValue = {};
    for (const band of ["1m","3m","6m","12m"]) {
      const c = losBandChannel[band], total = losBandCounts[band];
      if (total > 0) {
        const costAttributed = (c.meta * metaCAC) + (c.google * googleCAC) + (c.other * blendedCAC);
        bandCAC[band] = costAttributed / total;
        bandAvgValue[band] = losBandValue[band] / total;
        bandCacPctValue[band] = bandAvgValue[band] > 0 ? (bandCAC[band] / bandAvgValue[band]) * 100 : 0;
      } else {
        bandCAC[band] = 0; bandAvgValue[band] = 0; bandCacPctValue[band] = 0;
      }
    }

    let medianLag = null;
    if (lags.length) {
      const sorted = lags.slice().sort((a,b)=>a-b);
      medianLag = sorted[Math.floor(sorted.length/2)];
    }

    return {
      counts, valueByChannel,
      totalSpend, blendedCAC, metaCAC, googleCAC,
      losBandCounts, losBandValue, losBandChannel, bandCAC, bandAvgValue, bandCacPctValue, bandLabel,
      medianLag, lagSampleSize: lags.length,
      rows: rows.sort((a,b) => (b.refIso || "").localeCompare(a.refIso || "")),
    };
  }, [ghlData, rhAllBookings, from, to, metaSpend, gSpend]);

  // GHL
  const [ghlLoading, setGhlLoad] = useState(false);
  const [ghlError,   setGhlErr]  = useState("");
  const [ghlConn,    setGhlConn] = useState(false);
  const [manualBookings, setManualBookings] = useState(0);
  const [manualValue, setManualValue] = useState(0);

  const runGHL = useCallback(async(f,t)=>{
    setGhlLoad(true); setGhlErr("");
    try { setGhlData(await loadGHL(f,t)); setGhlConn(true); }
    catch(e) { setGhlErr(e.message); console.log("GHL Error:", e.message); }
    finally { setGhlLoad(false); }
  },[]);

  useEffect(()=>{ runGHL(from,to); }, []);
  useEffect(()=>{ if(ghlConn) runGHL(from,to); },[from,to]);

  // PMS
  const [cid,setCid]=useState("5n3lgu73rc3jqus4fur3c58fbb"), [csec,setCsec]=useState("1bfob7es3ge16bmjs8t4i0ah2ica4t1ujt8aeqa4b3rs9cmsa7uh");
  const [pmsLoad,setPmsLoad]=useState(false), [pmsErr,setPmsErr]=useState("");
  const [pmsConn,setPmsConn]=useState(false), [pmsData,setPmsData]=useState(null);
  const [mOcc,setMOcc]=useState(72), [mRate,setMRate]=useState(1450);
  const [mBook,setMBook]=useState(14), [mRen,setMRen]=useState(18), [mChurn,setMChurn]=useState(4);
  const [forecastRenewalRate, setForecastRenewalRate] = useState(60);
  const [forecastNewPerMonth, setForecastNewPerMonth] = useState(50);
  const [salesCycleDays, setSalesCycleDays] = useState(47);
  // LoS mix override — null means "use live distribution from Res Harmonics"
  // Shape: { short:{share,avgDays}, medium:{...}, long:{...}, annual:{...} }
  const [losOverride, setLosOverride] = useState(null);
  const [rateAdjustments, setRateAdjustments] = useState({});
  const [forecastAwrOverride, setForecastAwrOverride] = useState(null); // null = use live AWR from RH
  const [offlineRooms, setOfflineRooms] = useState(10);
  const [occupancyOverrides, setOccupancyOverrides] = useState({}); // monthIdx → occupancy % (0-100)

  // ── Canopy Reference Checks (loaded from Redis via webhook data) ──
  const [canopyData, setCanopyData] = useState(null); // { byEmail: { email -> { signal, rawStatus, ... } }, totalRecords }
  const [canopyLoad, setCanopyLoad] = useState(false);
  const [canopyErr, setCanopyErr] = useState("");
  const [canopyConn, setCanopyConn] = useState(false);

  const fetchCanopy = useCallback(async () => {
    setCanopyLoad(true); setCanopyErr("");
    try {
      const res = await fetch("/api/canopy-webhook");
      if (!res.ok) throw new Error(`Canopy load ${res.status}: ${(await res.text()).slice(0, 200)}`);
      const data = await res.json();
      if (data.ok) {
        setCanopyData({ byEmail: data.byEmail || {}, totalRecords: data.totalRecords || 0 });
        setCanopyConn(true);
      }
    } catch (err) {
      setCanopyErr(err.message);
      console.error("Canopy fetch error:", err);
    } finally {
      setCanopyLoad(false);
    }
  }, []);

  // Auto-load Canopy data when renewals tab is opened
  useEffect(() => { if (tab === "renewals" && !canopyConn && !canopyLoad) fetchCanopy(); }, [tab]);

  // ── Renewals state ──
  const [renewalTrackerFrom, setRenewalTrackerFrom] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 6);
    return d.toISOString().slice(0,10);
  });
  const [renewalTrackerTo, setRenewalTrackerTo] = useState(() => new Date().toISOString().slice(0,10));
  const [renewalTrackerPreset, setRenewalTrackerPreset] = useState("7d");
  const [renewalSelectedMonth, setRenewalSelectedMonth] = useState(null);
  const [renewalSort, setRenewalSort] = useState({ col: "expiry", dir: "asc" }); // default sort by expiry ascending
  const [smsModal, setSmsModal] = useState(null);
  const [smsText, setSmsText] = useState("");
  const [smsSending, setSmsSending] = useState(false);
  const [smsResult, setSmsResult] = useState(null);

  // Leaving reason options
  const LEAVING_REASONS = [
    "Travel / Temporary / Nomadic Stay",
    "Heating / Comfort / Health Issues",
    "Found Alternative Accommodation",
    "Affordability / Financial Constraints",
    "No Reason Given",
    "Canopy Not Passed",
  ];

  // Manual "leaving" markers — persisted in Redis (with localStorage fallback)
  const [leavingSet, setLeavingSet] = useState(() => {
    if (typeof window === "undefined") return new Set();
    try { return new Set(JSON.parse(localStorage.getItem("renewal_leaving_v1") || "[]")); } catch { return new Set(); }
  });

  // Leaving reasons map: roomStayId → reason string
  const [leavingReasons, setLeavingReasons] = useState(() => {
    if (typeof window === "undefined") return {};
    try { return JSON.parse(localStorage.getItem("renewal_leaving_reasons_v1") || "{}"); } catch { return {}; }
  });

  // Manual "pending renewal" markers — for cases where RH has a pending room stay
  // that the API doesn't expose (API excludes PENDING status)
  const [pendingSet, setPendingSet] = useState(() => {
    if (typeof window === "undefined") return new Set();
    try { return new Set(JSON.parse(localStorage.getItem("renewal_pending_v1") || "[]")); } catch { return new Set(); }
  });

  // Customer reference map: roomStayId → free-text reference
  const [customerRefs, setCustomerRefs] = useState(() => {
    if (typeof window === "undefined") return {};
    try { return JSON.parse(localStorage.getItem("renewal_customer_refs_v1") || "{}"); } catch { return {}; }
  });

  // ─── Lead Source Data ──────────────────────────────────────────────────────────
  const [leadsData, setLeadsData] = useState([]);
  const [leadsUpdatedAt, setLeadsUpdatedAt] = useState(null);
  useEffect(() => {
    fetch("/api/leads").then(r => r.json()).then(d => {
      if (d.leads && d.leads.length) { setLeadsData(d.leads); setLeadsUpdatedAt(d.updatedAt); }
    }).catch(() => {});
  }, []);

  const leadsFiltered = useMemo(() => {
    if (!leadsData.length) return { bySource: {}, byChannel: {}, byDay: {}, total: 0, dateRange: "" };
    const filtered = leadsData.filter(l => l.date >= from && l.date <= to);
    const bySource = {};
    const byChannel = {};
    const byDay = {};
    for (const l of filtered) {
      bySource[l.source] = (bySource[l.source] || 0) + 1;
      byChannel[l.channel] = (byChannel[l.channel] || 0) + 1;
      byDay[l.date] = (byDay[l.date] || 0) + 1;
    }
    return { bySource, byChannel, byDay, total: filtered.length, dateRange: `${from} → ${to}` };
  }, [leadsData, from, to]);

  // Save customer ref locally (and to RH API if connected)
  const saveCustomerRef = useCallback((roomStayId, bookingId, value) => {
    setCustomerRefs(prev => {
      const next = { ...prev, [roomStayId]: value };
      try { localStorage.setItem("renewal_customer_refs_v1", JSON.stringify(next)); } catch {}
      return next;
    });
    // Also persist customerRefs to Redis (merge — API now does read-merge-write)
    setCustomerRefs(prev => {
      fetch("/api/renewal-state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerRefs: prev }),
      }).catch(() => {});
      return prev;
    });
    // Attempt to update RH API if we have credentials
    if (cid && csec && bookingId) {
      (async () => {
        try {
          const tok = await getRHToken(cid, csec);
          await rhUpdate(tok, `/api/v3/bookings/${bookingId}`, { customerReference: value });
          console.log(`RH: Updated customerReference for booking ${bookingId} to "${value}"`);
        } catch (e) {
          console.log(`RH: Could not update customerReference for ${bookingId}:`, e.message);
          // Still saved locally — will show in dashboard regardless
        }
      })();
    }
  }, [cid, csec]);

  // Helper: save both sets + leaving reasons to Redis + localStorage
  const persistRenewalState = useCallback((newLeaving, newPending, newReasons) => {
    const lArr = [...newLeaving];
    const pArr = [...newPending];
    const reasons = newReasons || leavingReasons;
    try { localStorage.setItem("renewal_leaving_v1", JSON.stringify(lArr)); } catch {}
    try { localStorage.setItem("renewal_pending_v1", JSON.stringify(pArr)); } catch {}
    try { localStorage.setItem("renewal_leaving_reasons_v1", JSON.stringify(reasons)); } catch {}
    fetch("/api/renewal-state", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leaving: lArr, pending: pArr, leavingReasons: reasons }),
    }).catch(() => {});
  }, [leavingReasons]);

  // Load from Redis on mount — overrides localStorage with server state
  useEffect(() => {
    fetch("/api/renewal-state")
      .then(r => r.json())
      .then(data => {
        if (data.leaving && data.leaving.length > 0) {
          const ls = new Set(data.leaving);
          setLeavingSet(ls);
          try { localStorage.setItem("renewal_leaving_v1", JSON.stringify(data.leaving)); } catch {}
        }
        if (data.pending && data.pending.length > 0) {
          const ps = new Set(data.pending);
          setPendingSet(ps);
          try { localStorage.setItem("renewal_pending_v1", JSON.stringify(data.pending)); } catch {}
        }
        if (data.leavingReasons && Object.keys(data.leavingReasons).length > 0) {
          setLeavingReasons(data.leavingReasons);
          try { localStorage.setItem("renewal_leaving_reasons_v1", JSON.stringify(data.leavingReasons)); } catch {}
        }
        if (data.customerRefs && Object.keys(data.customerRefs).length > 0) {
          setCustomerRefs(data.customerRefs);
          try { localStorage.setItem("renewal_customer_refs_v1", JSON.stringify(data.customerRefs)); } catch {}
        }
      })
      .catch(() => {}); // fall back to localStorage values already in state
  }, []);

  // Set a leaving reason for a roomStayId and persist
  const setLeavingReason = useCallback((roomStayId, reason) => {
    setLeavingReasons(prev => {
      const next = { ...prev, [roomStayId]: reason };
      try { localStorage.setItem("renewal_leaving_reasons_v1", JSON.stringify(next)); } catch {}
      // persist with current sets
      setLeavingSet(ls => {
        setPendingSet(ps => {
          persistRenewalState(ls, ps, next);
          return ps;
        });
        return ls;
      });
      return next;
    });
  }, [persistRenewalState]);

  const toggleLeaving = useCallback((roomStayId) => {
    setLeavingSet(prev => {
      const next = new Set(prev);
      if (next.has(roomStayId)) {
        next.delete(roomStayId);
        // Clear reason when undoing
        setLeavingReasons(prevR => {
          const nextR = { ...prevR };
          delete nextR[roomStayId];
          try { localStorage.setItem("renewal_leaving_reasons_v1", JSON.stringify(nextR)); } catch {}
          setPendingSet(prevP => {
            const nextP = new Set(prevP);
            nextP.delete(roomStayId);
            persistRenewalState(next, nextP, nextR);
            return nextP;
          });
          return nextR;
        });
      } else {
        next.add(roomStayId);
        // Also remove from pendingSet
        setPendingSet(prevP => {
          const nextP = new Set(prevP);
          nextP.delete(roomStayId);
          persistRenewalState(next, nextP);
          return nextP;
        });
      }
      return next;
    });
  }, [persistRenewalState]);

  const togglePending = useCallback((roomStayId) => {
    setPendingSet(prev => {
      const next = new Set(prev);
      if (next.has(roomStayId)) next.delete(roomStayId); else next.add(roomStayId);
      // Also remove from leavingSet
      setLeavingSet(prevL => {
        const nextL = new Set(prevL);
        nextL.delete(roomStayId);
        persistRenewalState(nextL, next);
        return nextL;
      });
      return next;
    });
  }, [persistRenewalState]);

  // Messaging state — supports SMS and Email via GHL
  const [msgChannel, setMsgChannel] = useState("sms"); // "sms" | "email"
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");

  // ── Recent Booking Activity state ──
  const [activityFrom, setActivityFrom] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 6);
    return d.toISOString().slice(0,10);
  });
  const [activityTo, setActivityTo] = useState(() => new Date().toISOString().slice(0,10));
  const [activityPreset, setActivityPreset] = useState("7d");

  const recentActivity = useMemo(() => {
    if (!rhAllBookings || !rhAllBookings.length) return { newBookings:[], renewals:[], pending:[], all:[], losBuckets:{"<32d":0,"32-91d":0,"92-181d":0,"182-364d":0,"365d+":0}, roomBuckets:{}, stats:{newCount:0,renewalCount:0,pendingCount:0,totalActivity:0} };

    const bookings = rhAllBookings;
    // Parse creation date from booking reference "YYYYMMDD-NNNNN"
    const parseCreated = (ref) => {
      if (!ref || ref.length < 8) return null;
      return `${ref.slice(0,4)}-${ref.slice(4,6)}-${ref.slice(6,8)}`;
    };

    // Build unit ID → room type map from rhAllUnits
    const unitTypeMap = {};
    for (const u of (rhAllUnits || [])) {
      const tn = (u.unitTypeName || "").toLowerCase();
      let rt = "Other";
      if (tn.includes("nook")) rt = "Nook";
      else if (tn.includes("ensuite") || tn.includes("nomad")) rt = "Ensuite/Nomad";
      else if (tn.includes("snug plus") || tn.includes("snug +")) rt = "Snug / +";
      else if (tn.includes("snug")) rt = "Snug / +";
      else if (tn.includes("cosy") || tn.includes("cozy")) rt = "Cosy";
      else if (tn.includes("roomy")) rt = "Roomy";
      else if (tn.includes("spacious")) rt = "Spacious";
      else if (tn.includes("deluxe accessible") || tn.includes("dda")) rt = "Deluxe/DDA";
      else if (tn.includes("deluxe")) rt = "Deluxe/DDA";
      unitTypeMap[u.id] = rt;
    }

    // Filter to Southall, active statuses, created within date range
    const activeStatuses = new Set(["PENDING","CONFIRMED","CHECKED_IN"]);
    const candidates = [];
    for (const b of bookings) {
      const bld = (b.unit?.buildingName || "").toLowerCase();
      if (!bld.includes("southall")) continue;
      const status = (b.roomStayStatus ?? "").toUpperCase();
      if (!activeStatuses.has(status)) continue;
      const start = b.startDate?.slice(0,10);
      const end = b.endDate?.slice(0,10);
      if (!start || !end) continue;
      const losDays = Math.round((new Date(end) - new Date(start)) / 86400000);
      if (losDays < 27) continue;
      const created = parseCreated(b.bookingReference);
      if (!created) continue;
      if (created < activityFrom || created > activityTo) continue;
      // Classify room type from unit ID → unitTypeName map
      const roomType = unitTypeMap[b.unit?.id] || "Other";
      // Compute AWR from netAmount
      const net = parseFloat(b.netAmount ?? 0);
      const weeklyRate = (losDays > 0 && net > 0) ? Math.round((net / losDays) * 7) : 0;
      candidates.push({
        bookingReference: b.bookingReference,
        created,
        startDate: start,
        endDate: end,
        losDays,
        status,
        firstName: b.bookingContact?.firstName || "",
        lastName: b.bookingContact?.lastName || "",
        name: `${b.bookingContact?.firstName || ""} ${b.bookingContact?.lastName || ""}`.trim(),
        contactId: b.contactId || b.bookingContact?.id,
        room: b.unit?.name || "—",
        roomType,
        roomStayId: b.roomStayId,
        bookingType: b.bookingType || "",
        bookingId: b.bookingId,
        netAmount: net,
        weeklyRate,
      });
    }

    // LoS breakdown buckets (all candidates are already 27+ days)
    const losBuckets = { "<32d":0, "32-91d":0, "92-181d":0, "182-364d":0, "365d+":0 };
    for (const c of candidates) {
      if (c.losDays < 32) losBuckets["<32d"]++;
      else if (c.losDays <= 91) losBuckets["32-91d"]++;
      else if (c.losDays <= 181) losBuckets["92-181d"]++;
      else if (c.losDays <= 364) losBuckets["182-364d"]++;
      else losBuckets["365d+"]++;
    }

    // Room type breakdown
    const roomBuckets = {};
    for (const c of candidates) {
      roomBuckets[c.roomType] = (roomBuckets[c.roomType] || 0) + 1;
    }

    // Move-in by month breakdown (next 6 months: May–Oct or whatever the current window is)
    const moveInMonths = {};
    const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    for (const c of candidates) {
      const d = new Date(c.startDate);
      const key = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
      moveInMonths[key] = (moveInMonths[key] || 0) + 1;
    }
    // Build ordered list of months from earliest to latest move-in
    const moveInOrdered = Object.entries(moveInMonths)
      .map(([month, count]) => ({ month, count }))
      .sort((a, b) => {
        const parse = s => { const [m, y] = s.split(" "); return new Date(`${m} 1, ${y}`); };
        return parse(a.month) - parse(b.month);
      });

    // AWR summary
    const awrCandidates = candidates.filter(c => c.weeklyRate > 0 && c.weeklyRate < 5000);
    const avgAwr = awrCandidates.length > 0 ? Math.round(awrCandidates.reduce((s, c) => s + c.weeklyRate, 0) / awrCandidates.length) : 0;
    const minAwr = awrCandidates.length > 0 ? Math.min(...awrCandidates.map(c => c.weeklyRate)) : 0;
    const maxAwr = awrCandidates.length > 0 ? Math.max(...awrCandidates.map(c => c.weeklyRate)) : 0;
    const totalContractValue = candidates.reduce((s, c) => s + c.netAmount, 0);

    // Build contact history from ALL bookings (not just filtered) to detect renewals
    // Only include 27+ day Southall stays from DIFFERENT booking references
    const contactHistory = {};
    for (const b of bookings) {
      const cid = b.contactId || b.bookingContact?.id;
      if (!cid) continue;
      const bld = (b.unit?.buildingName || "").toLowerCase();
      if (!bld.includes("southall")) continue;
      const start = b.startDate?.slice(0,10);
      const end = b.endDate?.slice(0,10);
      if (!start || !end) continue;
      const los = Math.round((new Date(end) - new Date(start)) / 86400000);
      if (los < 27) continue; // Only track meaningful stays for renewal detection
      if (!contactHistory[cid]) contactHistory[cid] = [];
      contactHistory[cid].push({ start, end, roomStayId: b.roomStayId, bookingRef: b.bookingReference });
    }

    // Classify each candidate as new or renewal
    // A renewal = contact has a prior 27+ day Southall stay from a DIFFERENT booking reference
    const newBookings = [];
    const renewalBookings = [];
    const pendingBookings = [];
    for (const c of candidates) {
      const cid = c.contactId;
      const history = cid ? (contactHistory[cid] || []) : [];
      const hasPrior = history.some(h => h.bookingRef !== c.bookingReference && h.roomStayId !== c.roomStayId && h.end <= c.startDate);
      const isRenewal = hasPrior;
      c.activityType = isRenewal ? "Returning" : "New";
      if (isRenewal) {
        renewalBookings.push(c);
      } else {
        newBookings.push(c);
      }
      if (c.status === "PENDING") {
        pendingBookings.push(c);
      }
    }

    // Sort by created descending
    candidates.sort((a,b) => b.created.localeCompare(a.created));

    return {
      newBookings, renewals: renewalBookings, pending: pendingBookings,
      all: candidates,
      losBuckets, roomBuckets, moveInOrdered,
      awrSummary: { avg: avgAwr, min: minAwr, max: maxAwr, totalContractValue, count: awrCandidates.length },
      stats: {
        newCount: newBookings.length,
        renewalCount: renewalBookings.length,
        pendingCount: pendingBookings.length,
        totalActivity: newBookings.length + renewalBookings.length,
      }
    };
  }, [rhAllBookings, rhAllUnits, activityFrom, activityTo]);

  const openSmsModal = useCallback((entry, channel = "sms") => {
    const firstName = entry.name.split(" ")[0];
    const expiryStr = new Date(entry.endDate).toLocaleDateString("en-GB",{day:"numeric",month:"long",year:"numeric"});
    const smsTemplate = `Hi ${firstName}, your stay at &Soul Southall is coming to an end on ${expiryStr}. We'd love to have you stay with us! Reply to this message or speak to the front desk to discuss your renewal options.`;
    const emailSub = `Your Stay at &Soul Southall — Renewal`;
    const emailTpl = `Hi ${firstName},\n\nWe hope you've been enjoying your time at &Soul Southall.\n\nYour current stay is due to end on ${expiryStr}, and we'd love the opportunity to discuss your renewal options with you.\n\nWhether you'd like to extend in your current room or explore other options within the building, our team is here to help make the process as smooth as possible.\n\nPlease feel free to reply to this email, or pop down to the front desk at your convenience.\n\nWarm regards,\nThe &Soul Team`;
    setSmsText(smsTemplate);
    setEmailSubject(emailSub);
    setEmailBody(emailTpl);
    setSmsResult(null);
    setMsgChannel(channel);
    setSmsModal(entry);
  }, []);

  const sendMessage = useCallback(async () => {
    if (!smsModal) return;
    const isSms = msgChannel === "sms";
    const body = isSms ? smsText.trim() : emailBody.trim();
    if (!body || (!isSms && !emailSubject.trim())) return;
    setSmsSending(true);
    setSmsResult(null);
    try {
      // Step 1: Find GHL contact by email, then phone
      let contactId = null;
      if (smsModal.email) {
        const r1 = await ghlGet(`/contacts/search/duplicate?locationId=${GHL_LOCATION}&email=${encodeURIComponent(smsModal.email)}`);
        contactId = r1?.contact?.id;
      }
      if (!contactId && smsModal.phone) {
        const r2 = await ghlGet(`/contacts/search/duplicate?locationId=${GHL_LOCATION}&phone=${encodeURIComponent(smsModal.phone)}`);
        contactId = r2?.contact?.id;
      }
      if (!contactId) { setSmsResult("error:Contact not found in GHL. Add them first."); return; }

      // Step 2: Send via GHL conversations API
      const payload = isSms
        ? { type: "SMS", contactId, message: body }
        : { type: "Email", contactId, subject: emailSubject.trim(), message: body, emailFrom: "stay@andsoul.com" };
      const res = await fetch(`/api/ghl?path=${encodeURIComponent("/conversations/messages")}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) { const d = await res.json().catch(()=>({})); throw new Error(d.message || d.error || `HTTP ${res.status}`); }
      setSmsResult(isSms ? "sms_sent" : "email_sent");
    } catch (e) {
      setSmsResult("error:" + e.message);
    } finally { setSmsSending(false); }
  }, [smsModal, smsText, emailBody, emailSubject, msgChannel]);

  const occupied  = pmsConn&&pmsData ? pmsData.occupied : Math.round(BEDS*mOcc/100);
  const occPct    = pmsConn&&pmsData ? pmsData.occupancyPct : mOcc;
  const monthRev  = pmsConn&&pmsData ? pmsData.revenue : occupied*mRate;
  const weekRev   = pmsConn&&pmsData ? (pmsData.weeklyRevenue??0) : 0;
  const renewRate = (mRen+mChurn)>0 ? Math.round(mRen/(mRen+mChurn)*100) : 0;

  // Adjust GHL confirmed counts with manual values
  const adjConfirmed = ghlConn && ghlData ? ghlData.confirmed + manualBookings : ghlData?.confirmed ?? 0;
  const adjConfirmedValue = ghlConn && ghlData ? ghlData.confirmedValue + manualValue : ghlData?.confirmedValue ?? 0;
  const adjConvRate = ghlConn && ghlData && ghlData.toursBooked > 0 ? Math.round(adjConfirmed/ghlData.toursBooked*100) : ghlData?.convRate;

  // Load RH credentials from localStorage on mount
  useEffect(()=>{
    const saved = typeof window !== "undefined" && localStorage.getItem("rh_creds");
    if (saved) {
      try {
        const { cid: c, csec: s } = JSON.parse(saved);
        setCid(c);
        setCsec(s);
      } catch (e) {
        console.log("Failed to load RH creds from localStorage:", e);
      }
    }
  }, []);

  // Auto-connect PMS when cid+csec loaded from localStorage
  useEffect(()=>{
    if (cid && csec && !pmsConn) {
      connectPMS();
    }
  }, [cid, csec]);

  // Silent background refresh — re-fetches PMS data without showing loading spinner
  const silentPmsRefresh = useCallback(async()=>{
    if(!cid||!csec) return;
    try{
      console.log("PMS silent refresh started");
      const tok=await getRHToken(cid,csec);
      let allGuestStays = [];
      try { allGuestStays = await rhFetchAll(tok, "/api/v3/guestStays"); } catch(e) { console.log("silent refresh guestStays error:", e.message); }
      let allBookings = [];
      try { allBookings = await rhFetchAll(tok, "/api/v3/bookings"); } catch(e) {}
      // RH API excludes PENDING bookings by default — fetch them separately and merge
      let pendingBookings = [];
      try { pendingBookings = await rhFetchAll(tok, "/api/v3/bookings?statuses=PENDING"); } catch(e) {}
      const pendingRefs = new Set(pendingBookings.map(b => `${b.bookingReference}-${b.roomStayId}`));
      const mergedBookings = [...allBookings.filter(b => !pendingRefs.has(`${b.bookingReference}-${b.roomStayId}`)), ...pendingBookings];
      let allUnits = [];
      try { allUnits = await rhFetchAll(tok, "/api/v3/units"); } catch(e) {}

      const metrics = computePmsMetrics(allGuestStays, mergedBookings, allUnits);

      // Enrich renewal objects with status change dates
      const allRenewals = [...(metrics.pendingRenewals || []), ...(metrics.confirmedRenewals || [])];
      await enrichRenewalsWithDates(tok, allRenewals);

      setPmsData(metrics);
      setRhAllBookings(mergedBookings);
      setRhAllUnits(allUnits);
      console.log("PMS silent refresh complete, bookings:", mergedBookings.length, "(incl", pendingBookings.length, "pending)");
    }catch(e){ console.log("PMS silent refresh error:", e.message); }
  },[cid,csec]);

  // Auto-refresh PMS data every 5 minutes so new bookings appear live
  useEffect(()=>{
    if (!pmsConn || !cid || !csec) return;
    const interval = setInterval(silentPmsRefresh, 5 * 60 * 1000);
    return ()=> clearInterval(interval);
  }, [pmsConn, cid, csec, silentPmsRefresh]);

  // Auto-refresh GA4 analytics every 5 minutes
  useEffect(()=>{
    if (!analyticsData && !sdAnalyticsData) return;
    const interval = setInterval(()=>{
      console.log("Analytics silent refresh started");
      fetchAnalytics(from, to, "southall").then(d => { if (d) setAnalyticsData(d); });
      fetchAnalytics(from, to, "shoreditch").then(d => { if (d) setSdAnalyticsData(d); });
    }, 5 * 60 * 1000);
    return ()=> clearInterval(interval);
  }, [analyticsData, sdAnalyticsData, from, to, fetchAnalytics]);

  const connectPMS = useCallback(async()=>{
    if(!cid||!csec){setPmsErr("Enter both fields.");return;}
    setPmsLoad(true);setPmsErr("");
    try{
      const tok=await getRHToken(cid,csec);
      localStorage.setItem("rh_creds", JSON.stringify({ cid, csec }));

      let allGuestStays = [];
      try { allGuestStays = await rhFetchAll(tok, "/api/v3/guestStays"); } catch(e) { console.log("guestStays error:", e.message); }
      let allBookings = [];
      try { allBookings = await rhFetchAll(tok, "/api/v3/bookings"); } catch(e) { console.log("bookings error:", e.message); }
      // RH API excludes PENDING bookings by default — fetch them separately and merge
      let pendingBookings = [];
      try { pendingBookings = await rhFetchAll(tok, "/api/v3/bookings?statuses=PENDING"); } catch(e) { console.log("pending bookings error:", e.message); }
      const pendingRefSet = new Set(pendingBookings.map(b => `${b.bookingReference}-${b.roomStayId}`));
      allBookings = [...allBookings.filter(b => !pendingRefSet.has(`${b.bookingReference}-${b.roomStayId}`)), ...pendingBookings];
      console.log("Bookings loaded:", allBookings.length, "(incl", pendingBookings.length, "pending)");
      let allUnits = [];
      try { allUnits = await rhFetchAll(tok, "/api/v3/units"); } catch(e) { console.log("units error:", e.message); }

      const metrics = computePmsMetrics(allGuestStays, allBookings, allUnits);
      console.log(`RH: occupied=${metrics.occupied}, checkIns=${metrics.checkInsWeek}, checkOuts=${metrics.checkOutsWeek}, monthRev=${metrics.revenue}, awr=${metrics.globalAwr}`);

      // Enrich renewal objects with status change dates (conversionDate, confirmedDate, contractSignedDate)
      const allRenewals = [...(metrics.pendingRenewals || []), ...(metrics.confirmedRenewals || [])];
      console.log(`Enriching ${allRenewals.length} renewals with status dates...`);
      await enrichRenewalsWithDates(tok, allRenewals);
      console.log("Renewal date enrichment complete");

      setPmsData(metrics);
      setRhAllBookings(allBookings);
      setRhAllUnits(allUnits);
      setPmsConn(true);
    }catch(e){setPmsErr(`Failed: ${e.message}`); console.log("PMS Error:", e.message);}
    finally{setPmsLoad(false);}
  },[cid,csec]);

  // Reputation state
  const [gmbRating, setGmbRating] = useState(4.4);
  const [gmbCount, setGmbCount] = useState(42);
  const [airbnbRating, setAirbnbRating] = useState(3.1);
  const [airbnbCount, setAirbnbCount] = useState(156);
  const [trustpilotRating, setTrustpilotRating] = useState(3.55);
  const [trustpilotCount, setTrustpilotCount] = useState(28);
  const [mentions, setMentions] = useState("");
  const [repLive, setRepLive] = useState({ trustpilot: false, google: false, airbnb: false });
  const [repLoading, setRepLoading] = useState(false);

  // Fetch live reputation data on mount
  useEffect(() => {
    setRepLoading(true);
    fetch("/api/reputation")
      .then(r => r.json())
      .then(data => {
        if (data.trustpilot && !data.trustpilot.error && data.trustpilot.rating != null) {
          setTrustpilotRating(data.trustpilot.rating);
          setTrustpilotCount(data.trustpilot.count || 0);
          setRepLive(p => ({ ...p, trustpilot: true }));
        }
        if (data.google && !data.google.error && data.google.rating != null) {
          setGmbRating(data.google.rating);
          setGmbCount(data.google.count || 0);
          setRepLive(p => ({ ...p, google: true }));
        }
        if (data.airbnb && !data.airbnb.error && data.airbnb.rating != null) {
          setAirbnbRating(data.airbnb.rating);
          setAirbnbCount(data.airbnb.count || 0);
          setRepLive(p => ({ ...p, airbnb: true }));
        }
      })
      .catch(e => console.log("Reputation fetch error:", e.message))
      .finally(() => setRepLoading(false));
  }, []);

  // Shoreditch
  const [sdGhlLoading, setSdGhlLoad] = useState(false);
  const [sdGhlError, setSdGhlErr] = useState("");
  const [sdGhlData, setSdGhlData] = useState(null);
  const [sdGhlConn, setSdGhlConn] = useState(false);
  const [sdFlats, setSdFlats] = useState(()=>{
    // Lazy init: localStorage first for instant paint, API will overwrite once it loads
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("sd_flats_v1");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].rooms) return parsed;
        }
      } catch(e) { console.log("sdFlats load error:", e.message); }
    }
    return SD_FLATS.map(f=>({...f,rooms:f.rooms.map(r=>({...r}))}));
  });
  // sdFlatsSync state: "loading" | "cloud" | "local" | "saving" | "error"
  const [sdFlatsSync, setSdFlatsSync] = useState("loading");
  const [sdFlatsUpdatedAt, setSdFlatsUpdatedAt] = useState(null);
  const sdFlatsInitialLoad = useRef(true);
  const sdFlatsSaveTimer = useRef(null);

  // On mount: fetch the canonical state from the API (Vercel KV)
  useEffect(()=>{
    let cancelled = false;
    (async ()=>{
      try {
        const r = await fetch("/api/sd-occupancy");
        const j = await r.json();
        if (cancelled) return;
        if (j.kvConfigured === false) {
          setSdFlatsSync("local");
          console.log("sdFlats: KV not configured, using localStorage only");
          return;
        }
        if (j.flats && Array.isArray(j.flats) && j.flats.length > 0) {
          setSdFlats(j.flats);
          setSdFlatsUpdatedAt(j.updatedAt || null);
          try { localStorage.setItem("sd_flats_v1", JSON.stringify(j.flats)); } catch(e) {}
        }
        setSdFlatsSync("cloud");
      } catch(e) {
        if (cancelled) return;
        console.log("sdFlats fetch error:", e.message);
        setSdFlatsSync("local");
      } finally {
        sdFlatsInitialLoad.current = false;
      }
    })();
    return ()=>{ cancelled = true; };
  },[]);

  // On sdFlats change: save to localStorage immediately + debounced POST to API
  useEffect(()=>{
    if (typeof window === "undefined") return;
    try { localStorage.setItem("sd_flats_v1", JSON.stringify(sdFlats)); }
    catch(e) { console.log("sdFlats save error:", e.message); }

    // Skip the very first render (API fetch will set state)
    if (sdFlatsInitialLoad.current) return;
    if (sdFlatsSync === "local") return; // KV not configured, don't try API

    if (sdFlatsSaveTimer.current) clearTimeout(sdFlatsSaveTimer.current);
    setSdFlatsSync("saving");
    sdFlatsSaveTimer.current = setTimeout(async ()=>{
      try {
        const r = await fetch("/api/sd-occupancy", {
          method: "POST",
          headers: {"Content-Type": "application/json"},
          body: JSON.stringify({ flats: sdFlats, updatedBy: "dashboard" }),
        });
        const j = await r.json();
        if (j.ok) {
          setSdFlatsSync("cloud");
          setSdFlatsUpdatedAt(j.updatedAt || new Date().toISOString());
        } else {
          setSdFlatsSync("error");
          console.log("sdFlats save failed:", j.error || "unknown");
        }
      } catch(e) {
        setSdFlatsSync("error");
        console.log("sdFlats save error:", e.message);
      }
    }, 600);
  },[sdFlats]);
  const sdGoogleFiltered = useMemo(()=>SD_GOOGLE_DAILY.filter(r=>r.date>=from&&r.date<=to),[from,to]);
  // Shoreditch live Google data (reuse the same Windsor API, which excludes GMB)
  const [sdLiveGoogleData, setSdLiveGoogleData] = useState(null);
  const [sdGoogleIsLive, setSdGoogleIsLive] = useState(false);
  const fetchSdLiveGoogle = useCallback(async (dateFrom, dateTo) => {
    try {
      const r = await fetch(`/api/google?dateFrom=${dateFrom}&dateTo=${dateTo}&property=shoreditch`);
      const j = await r.json();
      if (j.configured && j.data) { setSdLiveGoogleData(j.data); setSdGoogleIsLive(true); }
      else { setSdLiveGoogleData(null); setSdGoogleIsLive(false); }
    } catch(e) { console.log("SD Google fetch error:", e.message); setSdLiveGoogleData(null); setSdGoogleIsLive(false); }
  }, []);
  useEffect(()=>{ fetchSdLiveGoogle(from, to); },[from, to]);
  // Prefer live data (GMB excluded), fall back to static
  // Use filtered campaigns (excl Sanctuary) for spend/conv totals
  const sdGSpendRaw = sdGoogleIsLive && sdLiveGoogleData ? sdLiveGoogleData.totalSpend : sdGoogleFiltered.reduce((s,r)=>s+r.spend,0);
  const sdGConvsRaw = sdGoogleIsLive && sdLiveGoogleData ? sdLiveGoogleData.totalConversions : sdGoogleFiltered.reduce((s,r)=>s+r.convs,0);
  const sdLiveCampaignsAllTemp = sdGoogleIsLive && sdLiveGoogleData?.campaigns ? sdLiveGoogleData.campaigns : [];
  const sdSanctuaryCamps = sdLiveCampaignsAllTemp.filter(c => (c.name||"").toLowerCase().includes("sanctuary"));
  const sdSanctuarySpend = sdSanctuaryCamps.reduce((s,c)=>s+c.spend,0);
  const sdSanctuaryConvs = sdSanctuaryCamps.reduce((s,c)=>s+c.convs,0);
  const sdGSpend = sdGoogleIsLive ? sdGSpendRaw - sdSanctuarySpend : sdGSpendRaw;
  const sdGConvs = sdGoogleIsLive ? sdGConvsRaw - sdSanctuaryConvs : sdGConvsRaw;
  const sdGCPC = sdGConvs>0?sdGSpend/sdGConvs:0;
  const sdLiveCampaignsAll = sdGoogleIsLive && sdLiveGoogleData?.campaigns ? sdLiveGoogleData.campaigns : [];
  // Filter out Sanctuary campaigns — only show Shoreditch Apartments campaigns
  const sdLiveCampaigns = sdLiveCampaignsAll.filter(c => !(c.name||"").toLowerCase().includes("sanctuary"));
  const sdGoogleDaily = sdGoogleIsLive && sdLiveGoogleData?.daily ? sdLiveGoogleData.daily.map(r=>({date:r.date,spend:r.spend,convs:r.convs})) : sdGoogleFiltered;
  // Shoreditch Meta: prefer live data, fall back to static
  const sdMetaSpend = (property==="shoreditch" && metaIsLive && liveMetaData) ? liveMetaData.totalSpend : SD_META.spend;
  const sdMetaLeads = (property==="shoreditch" && metaIsLive && liveMetaData) ? liveMetaData.totalLeads : SD_META.leads;
  const sdMetaIsLive = property==="shoreditch" && metaIsLive && !!liveMetaData;
  const sdMetaCpl = sdMetaLeads>0?sdMetaSpend/sdMetaLeads:0;
  const sdTotalLeads = sdMetaLeads + sdGConvs;
  const sdTotalSpend = sdMetaSpend + sdGSpend;
  const sdBlendedCpl = sdTotalLeads>0 ? sdTotalSpend/sdTotalLeads : 0;
  const sdOcc = useMemo(()=>{
    let o=0,i=0,v=0,t=0;
    sdFlats.forEach(f=>f.rooms.forEach(r=>{t++;if(r.s==="OCCUPIED")o++;else if(r.s==="INCOMING")i++;else v++;}));
    const pct=t>0?Math.round(o/t*100):0;
    const fut=t>0?Math.round((o+i)/t*100):0;
    // Target: 90% occupancy by 1st July 2026
    const SD_TARGET_OCC=0.9;
    const targetRooms=Math.round(t*SD_TARGET_OCC);
    const roomsNeeded=Math.max(0,targetRooms-(o+i));
    const today=new Date();
    const deadline=new Date("2026-07-01");
    const msPerWeek=7*24*60*60*1000;
    const weeksLeft=Math.max(1,Math.ceil((deadline-today)/msPerWeek));
    const roomsPerWeek=Math.ceil(roomsNeeded/weeksLeft);
    return{o,i,v,t,pct,fut,targetRooms,roomsNeeded,weeksLeft,roomsPerWeek,targetPct:Math.round(SD_TARGET_OCC*100)};
  },[sdFlats]);
  const sdToggleRoom=(fi,ri)=>{setSdFlats(p=>{const n=p.map(f=>({...f,rooms:f.rooms.map(r=>({...r}))}));const ss=["OCCUPIED","VACANT","INCOMING"];const c=n[fi].rooms[ri].s;n[fi].rooms[ri].s=ss[(ss.indexOf(c)+1)%3];return n;});};
  const runSDGHL = useCallback(async(f,t)=>{
    setSdGhlLoad(true);setSdGhlErr("");
    try{
      const pRes=await ghlGet("/opportunities/pipelines?locationId="+GHL_LOCATION);
      const pipelines=pRes?.pipelines??pRes?.data??[];
      // Find the Shoreditch pipeline
      const pipeline=pipelines.find(p=>(p.name||"").toLowerCase().includes("shoreditch"))
        ||pipelines.find(p=>p.name?.trim()===SD_GHL_PIPELINE);
      if(!pipeline) throw new Error("Shoreditch pipeline not found. Available: "+pipelines.map(p=>p.name).join(", "));
      const stages=pipeline.stages??[];
      const opps=await fetchAllOpps(pipeline.id,f,t);
      // Filter by "applied for villas" tag — tags live on contact.tags, NOT o.tags
      const TAG_APPLIED="applied for villas";
      const getOppTags = (o) => {
        const contactTags = o.contact?.tags ?? [];
        const relationTags = (o.relations ?? []).flatMap(r => r.tags ?? []);
        const oppTags = o.tags ?? [];
        return [...contactTags, ...relationTags, ...oppTags];
      };
      const appliedByTag=opps.filter(o=>getOppTags(o).some(tag=>tag.toLowerCase().trim()===TAG_APPLIED));
      // Also find the applied stage for fallback display
      const appliedStage=stages.find(s=>(s.name||"").toLowerCase().includes("applied"));
      const appliedByStage=appliedStage?opps.filter(o=>o.pipelineStageId===appliedStage.id):[];
      // Use tag-based count as primary, stage as secondary
      const appliedCount=appliedByTag.length>0?appliedByTag.length:appliedByStage.length;
      const appliedLabel=appliedByTag.length>0?"applied for villas tag":(appliedStage?.name||"Applied stage");
      setSdGhlData({pipelineName:pipeline.name,stages:stages.map(s=>({id:s.id,name:s.name})),totalOpps:opps.length,applied:appliedCount,appliedStageName:appliedLabel,appliedByTag:appliedByTag.length,appliedByStage:appliedByStage.length});
      setSdGhlConn(true);
    }catch(e){setSdGhlErr(e.message);}
    finally{setSdGhlLoad(false);}
  },[]);

  // Auto-connect Shoreditch GHL on mount + refresh on date change
  useEffect(()=>{ runSDGHL(from,to); },[]);
  useEffect(()=>{ if(sdGhlConn) runSDGHL(from,to); },[from,to]);

  const reputationScore = Math.round(((gmbRating + airbnbRating + trustpilotRating) / 3 / 5) * 100);
  const reputationColor = reputationScore >= 80 ? C.sage : reputationScore >= 60 ? C.gold : C.rose;

  const tabBtn=(t,label,dot)=>(
    <button onClick={()=>setTab(t)} style={{padding:"9px 22px",border:"none",cursor:"pointer",fontWeight:600,fontSize:12,letterSpacing:"0.06em",textTransform:"uppercase",borderRadius:8,transition:"all 0.2s",display:"flex",alignItems:"center",gap:6,background:tab===t?C.gold:"transparent",color:tab===t?"#000":C.muted,whiteSpace:"nowrap"}}>
      {dot&&<span style={{width:6,height:6,borderRadius:"50%",background:dot,flexShrink:0}}/>}
      {label}
    </button>
  );

  return (
    <>
      <Head>
        <title>The Residential Dashboard</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500;700&display=swap" rel="stylesheet"/>
      </Head>
      <div style={{background:C.bg,minHeight:"100vh",color:C.text,fontFamily:"'DM Sans',system-ui,sans-serif"}}>

        {/* HEADER */}
        <div style={{background:C.card,borderBottom:`1px solid ${C.border}`,padding:"13px 26px",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:10}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <div style={{width:32,height:32,borderRadius:8,background:C.gold,display:"flex",alignItems:"center",justifyContent:"center"}}>
              <span style={{color:"#000",fontWeight:800,fontSize:15,fontFamily:"DM Mono,monospace"}}>&</span>
            </div>
            <div>
              <p style={{fontSize:"0.95rem",color:C.text,margin:"4px 0 0 0"}}>&Soul · Performance Dashboard</p>
              <p style={{fontSize:11,color:C.muted}}>Performance dashboard</p>
            </div>
          </div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            <span style={{background:metaIsLive?"#d4a84322":C.border,color:metaIsLive?C.gold:C.muted,padding:"3px 10px",borderRadius:20,fontSize:11}}>{metaIsLive?"● Meta · live":"○ Meta · static"}</span>
            <span style={{background:googleIsLive?"#3d82c422":C.border,color:googleIsLive?C.blue:C.muted,padding:"3px 10px",borderRadius:20,fontSize:11}}>{googleIsLive?"● Google Ads · live":"○ Google Ads · static"}</span>
            <span style={{background:ghlConn?"#9b72cf22":C.border,color:ghlConn?C.purple:C.muted,padding:"3px 10px",borderRadius:20,fontSize:11}}>{ghlConn?"● GHL CRM · live":"○ GHL CRM"}</span>
            <span style={{background:pmsConn?"#3d9e7522":C.border,color:pmsConn?C.sage:C.muted,padding:"3px 10px",borderRadius:20,fontSize:11}}>{pmsConn?"● Res Harmonics · live":"○ Res Harmonics"}</span>
          </div>
        </div>

        {/* DATE RANGE BAR */}
        <div style={{background:"#0b0d11",borderBottom:`1px solid ${C.border}`,padding:"9px 26px",display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
          <span style={{fontSize:11,color:C.muted,textTransform:"uppercase",letterSpacing:"0.1em",marginRight:4}}>Range</span>
          {PRESETS.map(o=>(
            <button key={o.d} onClick={()=>setPreset(o.d)} style={{padding:"4px 13px",borderRadius:20,border:`1px solid ${preset===o.d?C.gold:C.border}`,background:preset===o.d?C.gold+"22":"transparent",color:preset===o.d?C.gold:C.muted,fontSize:12,fontWeight:600,cursor:"pointer"}}>Last {o.l}</button>
          ))}
          <CalendarPicker value={from} onChange={v=>{setFrom(v);setPreset(null);}} />
          <span style={{fontSize:11,color:C.muted}}>→</span>
          <CalendarPicker value={to} onChange={v=>{setTo(v);setPreset(null);}} />
          <span style={{marginLeft:"auto",fontSize:11,color:C.gold,fontFamily:"DM Mono,monospace"}}>{from} → {to}</span>
        </div>

{/* PROPERTY SWITCHER + TABS */}
        <div style={{padding:"10px 26px 0",borderBottom:`1px solid ${C.border}`,display:"flex",gap:0,flexWrap:"wrap",alignItems:"stretch"}}>
          <div style={{display:"flex",gap:4,marginRight:16,borderRight:`1px solid ${C.border}`,paddingRight:16,alignItems:"center"}}>
            <span style={{fontSize:10,color:C.muted,textTransform:"uppercase",marginRight:4}}>Property:</span>
            {[{k:"southall",l:"Southall"},{k:"shoreditch",l:"Shoreditch"}].map(p=>(
              <button key={p.k} onClick={()=>setProperty(p.k)} style={{padding:"7px 14px",border:`1px solid ${property===p.k?C.gold:C.border}`,cursor:"pointer",fontWeight:700,fontSize:11,letterSpacing:"0.08em",textTransform:"uppercase",borderRadius:8,background:property===p.k?C.gold+"22":"transparent",color:property===p.k?C.gold:C.muted}}>{p.l}</button>
            ))}
          </div>
          {property==="southall"&&<>{tabBtn("marketing","Marketing")}{tabBtn("crm","CRM Pipeline",ghlConn?C.purple:null)}{tabBtn("bookings","Occupancy")}{tabBtn("renewals","Renewals",pmsConn?C.sage:null)}{tabBtn("reputation","Reputation")}</>}
          {property==="shoreditch"&&<div style={{display:"flex",gap:6}}>
            <button onClick={()=>setSdTab("marketing")} style={{padding:"9px 22px",border:"none",cursor:"pointer",fontWeight:600,fontSize:12,letterSpacing:"0.06em",textTransform:"uppercase",borderRadius:8,background:sdTab==="marketing"?C.gold:"transparent",color:sdTab==="marketing"?"#000":C.muted}}>Marketing</button>
            <button onClick={()=>setSdTab("crm")} style={{padding:"9px 22px",border:"none",cursor:"pointer",fontWeight:600,fontSize:12,letterSpacing:"0.06em",textTransform:"uppercase",borderRadius:8,background:sdTab==="crm"?C.gold:"transparent",color:sdTab==="crm"?"#000":C.muted}}>CRM</button>
            <button onClick={()=>setSdTab("occupancy")} style={{padding:"9px 22px",border:"none",cursor:"pointer",fontWeight:600,fontSize:12,letterSpacing:"0.06em",textTransform:"uppercase",borderRadius:8,background:sdTab==="occupancy"?C.gold:"transparent",color:sdTab==="occupancy"?"#000":C.muted}}>Occupancy</button>
          </div>}
        </div>

        {/* ════ MARKETING ════ */}
        {property==="southall"&&tab==="marketing"&&(
          <div style={{padding:"22px 26px"}}>
            <p style={{fontSize:11,color:C.muted,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:2}}>Southall only · {rangeLabel} · {metaIsLive||googleIsLive?"live data":"static data"}{adLoading?" · loading…":""}</p>
            <h2 style={{fontSize:20,fontWeight:700,color:C.text,marginBottom:18}}>Marketing Performance</h2>

            <div style={{display:"flex",gap:12,marginBottom:18,flexWrap:"wrap"}}>
              <KPI label="Total Spend"         value={fmt(metaSpend+gSpend)}  sub="Meta + Google · Southall"         accent={C.gold}/>
              <KPI label="Meta Spend"          value={fmt(metaSpend)}          sub={`${metaLeads} lead form submits`} accent={C.gold}/>
              <KPI label="Meta Avg CPL"        value={fmt(metaCpl,"£",2)}      sub="Per lead form submit"             accent={C.sage}/>
              <KPI label="Google Spend"        value={fmt(gSpend)}             sub="Filtered period"                  accent={C.blue}/>
              <KPI label="Google Form Submits" value={gConvs}                  sub="GTM tag · 30d fixed"              accent={C.blue}/>
              <KPI label="Google Cost/Submit"  value={fmt(googleCostPerSubmit,"£",2)} sub="Spend ÷ form submits"        accent={C.blue}/>
              <KPI label="Blended Avg CPL"     value={fmt(blendedAvgCPL,"£",2)} sub="All channels weighted"           accent={C.rose}/>
            </div>

            <div style={{display:"flex",gap:14,marginBottom:16,flexWrap:"wrap"}}>
              <div style={{flex:"1 1 280px",minWidth:0,background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:"16px 16px 8px",overflowX:"auto"}}>
                <p style={{fontSize:11,color:C.muted,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:10}}>Daily Spend — Meta vs Google (£)</p>
                <ResponsiveContainer width="100%" height={180}>
                  <AreaChart data={chartData} margin={{top:2,right:6,bottom:0,left:-8}}>
                    <defs>
                      <linearGradient id="gM" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.gold} stopOpacity={0.25}/><stop offset="95%" stopColor={C.gold} stopOpacity={0}/></linearGradient>
                      <linearGradient id="gG" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.blue} stopOpacity={0.2}/><stop offset="95%" stopColor={C.blue} stopOpacity={0}/></linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.border}/>
                    <XAxis dataKey="d" tick={{fill:C.muted,fontSize:9}} tickLine={false} interval="preserveStartEnd"/>
                    <YAxis tick={{fill:C.muted,fontSize:9}} tickLine={false} axisLine={false} tickFormatter={v=>`£${v}`}/>
                    <Tooltip content={<Tip/>}/>
                    <Area type="monotone" dataKey="meta"   name="Meta"   stroke={C.gold} fill="url(#gM)" strokeWidth={2} dot={false}/>
                    <Area type="monotone" dataKey="google" name="Google" stroke={C.blue} fill="url(#gG)" strokeWidth={2} dot={false}/>
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div style={{flex:"1 1 220px",minWidth:0,background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:"16px 16px 8px",overflowX:"auto"}}>
                <p style={{fontSize:11,color:C.muted,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:10}}>Meta · Lead Form Submits & CPL</p>
                <ResponsiveContainer width="100%" height={180}>
                  <ComposedChart data={chartData} margin={{top:2,right:6,bottom:0,left:-16}}>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.border}/>
                    <XAxis dataKey="d" tick={{fill:C.muted,fontSize:9}} tickLine={false} interval="preserveStartEnd"/>
                    <YAxis yAxisId="l" tick={{fill:C.sage,fontSize:9}}  tickLine={false} axisLine={false}/>
                    <YAxis yAxisId="c" orientation="right" tick={{fill:C.gold,fontSize:9}} tickLine={false} axisLine={false} tickFormatter={v=>`£${v}`}/>
                    <Tooltip content={<Tip/>}/>
                    <Bar  yAxisId="l" dataKey="leads" name="leads" fill={C.sage}   radius={[2,2,0,0]} opacity={0.85}/>
                    <Line yAxisId="c" type="monotone" dataKey="cpl" name="cpl" stroke={C.gold} strokeWidth={2} dot={false}/>
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Meta Ad Set Breakdown */}
            {metaIsLive && liveMetaData?.adsets && liveMetaData.adsets.length > 0 && (
              <div style={{background:C.card,border:`1px solid ${C.gold}44`,borderRadius:12,padding:16,overflowX:"auto",marginBottom:14}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                  <p style={{fontSize:11,color:C.muted,textTransform:"uppercase",letterSpacing:"0.08em"}}>Meta · Ad Set Breakdown · {rangeLabel} · live</p>
                  <div style={{display:"flex",gap:8}}>
                    <span style={{fontSize:9,padding:"2px 8px",borderRadius:10,background:C.sage+"22",color:C.sage}}>Website Leads: {liveMetaData.totalWebsiteLeads ?? 0}</span>
                    <span style={{fontSize:9,padding:"2px 8px",borderRadius:10,background:C.gold+"22",color:C.gold}}>Meta Leads: {liveMetaData.totalMetaLeads ?? 0}</span>
                  </div>
                </div>
                <table style={{width:"100%",borderCollapse:"collapse",fontSize:12,minWidth:700}}>
                  <thead><tr style={{borderBottom:`1px solid ${C.border}`}}>
                    {["Ad Set","Spend","Website Leads","Meta Leads","Counted Leads","Lead Source","CPL"].map(h=>(
                      <th key={h} style={{padding:"6px 10px",textAlign:h==="Ad Set"?"left":"right",color:C.muted,fontWeight:500,fontSize:10,textTransform:"uppercase",letterSpacing:"0.06em"}}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {[...liveMetaData.adsets].sort((a,b)=>b.spend-a.spend).map((a,i)=>{
                      const isMetaOnly = a.leadType === "meta_leads_only";
                      return (
                        <tr key={i} style={{borderBottom:`1px solid ${C.border}22`}}>
                          <td style={{padding:"8px 10px",color:C.text,maxWidth:260}}>
                            <p style={{marginBottom:2}}>{a.name}</p>
                            {isMetaOnly && <span style={{fontSize:8,padding:"1px 6px",borderRadius:8,background:C.gold+"22",color:C.gold}}>Meta leads only</span>}
                          </td>
                          <td style={{textAlign:"right",padding:"8px 10px",fontFamily:"DM Mono,monospace",color:C.text}}>{fmt(a.spend)}</td>
                          <td style={{textAlign:"right",padding:"8px 10px",fontFamily:"DM Mono,monospace",color:isMetaOnly ? C.muted : C.sage}}>
                            {a.websiteLeads}
                            {isMetaOnly && <span style={{fontSize:8,color:C.rose,marginLeft:4}}>excluded</span>}
                          </td>
                          <td style={{textAlign:"right",padding:"8px 10px",fontFamily:"DM Mono,monospace",color:isMetaOnly ? C.gold : C.muted}}>{a.metaLeads}</td>
                          <td style={{textAlign:"right",padding:"8px 10px",fontFamily:"DM Mono,monospace",color:C.gold,fontWeight:600}}>{a.leads}</td>
                          <td style={{textAlign:"right",padding:"8px 10px"}}>
                            <span style={{fontSize:10,padding:"2px 8px",borderRadius:10,background:isMetaOnly ? C.gold+"22" : C.sage+"22",color:isMetaOnly ? C.gold : C.sage}}>
                              {isMetaOnly ? "Meta form" : "Website"}
                            </span>
                          </td>
                          <td style={{textAlign:"right",padding:"8px 10px",fontFamily:"DM Mono,monospace",color:a.cpl > 10 ? C.rose : C.sage}}>{a.leads > 0 ? fmt(a.cpl,"£",2) : "—"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot><tr style={{borderTop:`1px solid ${C.border}`}}>
                    <td style={{padding:"8px 10px",color:C.muted,fontWeight:600,fontSize:11}}>Total</td>
                    <td style={{textAlign:"right",padding:"8px 10px",fontFamily:"DM Mono,monospace",color:C.gold,fontWeight:700}}>{fmt(metaSpend)}</td>
                    <td style={{textAlign:"right",padding:"8px 10px",fontFamily:"DM Mono,monospace",color:C.muted}}>{liveMetaData.totalWebsiteLeads ?? 0}</td>
                    <td style={{textAlign:"right",padding:"8px 10px",fontFamily:"DM Mono,monospace",color:C.muted}}>{liveMetaData.totalMetaLeads ?? 0}</td>
                    <td style={{textAlign:"right",padding:"8px 10px",fontFamily:"DM Mono,monospace",color:C.gold,fontWeight:700}}>{metaLeads}</td>
                    <td/>
                    <td style={{textAlign:"right",padding:"8px 10px",fontFamily:"DM Mono,monospace",color:C.muted}}>Avg: {fmt(metaCpl,"£",2)}/lead</td>
                  </tr></tfoot>
                </table>
              </div>
            )}

            {/* Landing Page Performance — Southall */}
            {analyticsData && (
              <div style={{background:C.card,border:`1px solid ${C.blue}44`,borderRadius:12,padding:16,marginBottom:14}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                  <div>
                    <p style={{fontSize:11,color:C.muted,textTransform:"uppercase",letterSpacing:"0.08em"}}>Landing Page Performance · {rangeLabel} · live</p>
                    <p style={{fontSize:10,color:C.muted,marginTop:2}}>{analyticsData.landingPage}</p>
                  </div>
                  <span style={{fontSize:9,padding:"2px 10px",borderRadius:10,background:C.blue+"22",color:C.blue}}>GA4</span>
                </div>

                {/* KPI row */}
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(130px, 1fr))",gap:10,marginBottom:16}}>
                  <div style={{background:C.bg,borderRadius:10,padding:"12px 14px",border:`1px solid ${C.border}`,borderTop:`2px solid ${C.blue}`}}>
                    <p style={{fontSize:10,color:C.muted,marginBottom:4}}>Sessions</p>
                    <p style={{fontSize:22,fontWeight:700,color:C.text,fontFamily:"DM Mono,monospace"}}>{analyticsData.summary.totalSessions.toLocaleString()}</p>
                    <p style={{fontSize:10,color:C.muted,marginTop:2}}>{analyticsData.summary.avgDailySessions.toFixed(0)}/day avg</p>
                  </div>
                  <div style={{background:C.bg,borderRadius:10,padding:"12px 14px",border:`1px solid ${C.border}`,borderTop:`2px solid ${analyticsData.summary.avgBounceRate>0.4?C.rose:analyticsData.summary.avgBounceRate>0.3?C.gold:C.sage}`}}>
                    <p style={{fontSize:10,color:C.muted,marginBottom:4}}>Bounce Rate</p>
                    <p style={{fontSize:22,fontWeight:700,color:analyticsData.summary.avgBounceRate>0.4?C.rose:analyticsData.summary.avgBounceRate>0.3?C.gold:C.sage,fontFamily:"DM Mono,monospace"}}>{(analyticsData.summary.avgBounceRate*100).toFixed(1)}%</p>
                  </div>
                  <div style={{background:C.bg,borderRadius:10,padding:"12px 14px",border:`1px solid ${C.border}`,borderTop:`2px solid ${analyticsData.summary.avgEngagementRate>=0.7?C.sage:analyticsData.summary.avgEngagementRate>=0.6?C.gold:C.rose}`}}>
                    <p style={{fontSize:10,color:C.muted,marginBottom:4}}>Engagement Rate</p>
                    <p style={{fontSize:22,fontWeight:700,color:analyticsData.summary.avgEngagementRate>=0.7?C.sage:C.gold,fontFamily:"DM Mono,monospace"}}>{(analyticsData.summary.avgEngagementRate*100).toFixed(1)}%</p>
                  </div>
                  <div style={{background:C.bg,borderRadius:10,padding:"12px 14px",border:`1px solid ${C.border}`,borderTop:`2px solid ${analyticsData.summary.overallConversionRate>=0.1?C.sage:analyticsData.summary.overallConversionRate>=0.05?C.gold:C.rose}`}}>
                    <p style={{fontSize:10,color:C.muted,marginBottom:4}}>Conversion Rate</p>
                    <p style={{fontSize:22,fontWeight:700,color:analyticsData.summary.overallConversionRate>=0.1?C.sage:analyticsData.summary.overallConversionRate>=0.05?C.gold:C.rose,fontFamily:"DM Mono,monospace"}}>{(analyticsData.summary.overallConversionRate*100).toFixed(1)}%</p>
                    <p style={{fontSize:10,color:C.muted,marginTop:2}}>{analyticsData.summary.totalConfirmations} applications</p>
                  </div>
                  <div style={{background:C.bg,borderRadius:10,padding:"12px 14px",border:`1px solid ${C.border}`,borderTop:`2px solid ${C.purple}`}}>
                    <p style={{fontSize:10,color:C.muted,marginBottom:4}}>Unique Visitors</p>
                    <p style={{fontSize:22,fontWeight:700,color:C.purple,fontFamily:"DM Mono,monospace"}}>{analyticsData.summary.totalUsers.toLocaleString()}</p>
                    <p style={{fontSize:10,color:C.muted,marginTop:2}}>{analyticsData.summary.sessionsPerUser?.toFixed(1)} sessions/user</p>
                  </div>
                  <div style={{background:C.bg,borderRadius:10,padding:"12px 14px",border:`1px solid ${C.border}`,borderTop:`2px solid ${analyticsData.summary.applicationsPerUser>=0.08?C.sage:analyticsData.summary.applicationsPerUser>=0.05?C.gold:C.rose}`}}>
                    <p style={{fontSize:10,color:C.muted,marginBottom:4}}>Applications/Visitor</p>
                    <p style={{fontSize:22,fontWeight:700,color:analyticsData.summary.applicationsPerUser>=0.08?C.sage:analyticsData.summary.applicationsPerUser>=0.05?C.gold:C.rose,fontFamily:"DM Mono,monospace"}}>{(analyticsData.summary.applicationsPerUser*100).toFixed(1)}%</p>
                    <p style={{fontSize:10,color:C.muted,marginTop:2}}>{analyticsData.summary.totalConfirmations} from {analyticsData.summary.totalUsers.toLocaleString()} visitors</p>
                  </div>
                </div>

                {/* Daily trend chart */}
                {analyticsData.daily && analyticsData.daily.length > 0 && (
                  <div style={{height:180,marginBottom:16}}>
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={analyticsData.daily.map(d=>{const dt=new Date(d.date);return{d:`${dt.getDate()}/${dt.getMonth()+1}`,sessions:d.sessions,bounceRate:Math.round(d.bounceRate*100),convRate:Math.round(d.conversionRate*1000)/10,confirmations:d.confirmations};})} margin={{top:5,right:20,left:0,bottom:5}}>
                        <CartesianGrid strokeDasharray="3 3" stroke={C.border}/>
                        <XAxis dataKey="d" tick={{fill:C.muted,fontSize:9}} tickLine={false} interval="preserveStartEnd"/>
                        <YAxis yAxisId="l" tick={{fill:C.blue,fontSize:9}} tickLine={false} axisLine={false}/>
                        <YAxis yAxisId="r" orientation="right" tick={{fill:C.sage,fontSize:9}} tickLine={false} axisLine={false} tickFormatter={v=>`${v}%`}/>
                        <Tooltip content={({active,payload,label})=>{
                          if(!active||!payload?.length) return null;
                          return <div style={{background:"#13161b",border:`1px solid ${C.border}`,borderRadius:8,padding:"10px 14px",fontSize:12}}>
                            <p style={{color:C.muted,marginBottom:6,fontFamily:"monospace"}}>{label}</p>
                            {payload.map((p,i)=><p key={i} style={{color:p.color,margin:"2px 0"}}>{p.name}: <strong>{p.name.includes("Rate")?`${p.value}%`:p.value}</strong></p>)}
                          </div>;
                        }}/>
                        <Bar yAxisId="l" dataKey="sessions" name="Sessions" fill={C.blue} radius={[2,2,0,0]} opacity={0.6}/>
                        <Line yAxisId="r" type="monotone" dataKey="convRate" name="Conv Rate" stroke={C.sage} strokeWidth={2} dot={false}/>
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Recommendations */}
                {analyticsData.recommendations && analyticsData.recommendations.length > 0 && (
                  <div>
                    <p style={{fontSize:10,color:C.muted,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:8}}>Recommendations</p>
                    <div style={{display:"flex",flexDirection:"column",gap:6}}>
                      {analyticsData.recommendations.map((rec,i) => {
                        const icon = rec.type==="warning" ? "⚠️" : rec.type==="success" ? "✅" : "💡";
                        const borderColor = rec.type==="warning" ? C.rose : rec.type==="success" ? C.sage : C.gold;
                        return (
                          <div key={i} style={{background:C.bg,border:`1px solid ${borderColor}33`,borderLeft:`3px solid ${borderColor}`,borderRadius:8,padding:"8px 12px",fontSize:11}}>
                            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:2}}>
                              <span style={{color:C.text,fontWeight:600}}>{icon} {rec.metric}: {rec.value}</span>
                              <span style={{fontSize:9,color:borderColor,background:borderColor+"18",padding:"1px 6px",borderRadius:8}}>{rec.priority}</span>
                            </div>
                            <p style={{color:C.muted,lineHeight:1.4}}>{rec.message}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Performance Insights — Southall (period comparison, source mix, device split, expert playbook) */}
            <PerformanceInsights analytics={analyticsData} propertyLabel="Southall" />

            {/* Weekly Recommendations — Southall */}
            {analyticsData?.weeklyInsights?.actions?.length > 0 && (
              <div style={{background:C.card,border:`1px solid ${C.sage}44`,borderRadius:12,padding:16,marginBottom:14}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                  <div>
                    <p style={{fontSize:11,color:C.muted,textTransform:"uppercase",letterSpacing:"0.08em"}}>Weekly Landing Page Recommendations · Southall</p>
                    <p style={{fontSize:10,color:C.muted,marginTop:2}}>Data-driven actions based on this week vs last week performance</p>
                  </div>
                  <span style={{fontSize:9,padding:"2px 10px",borderRadius:10,background:C.sage+"22",color:C.sage}}>
                    {analyticsData.weeklyInsights.actions.filter(a=>a.priority==="high").length} high priority
                  </span>
                </div>

                {/* Week-over-week trend badges */}
                {analyticsData.weeklyInsights.trends && (
                  <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:14}}>
                    {Object.entries(analyticsData.weeklyInsights.trends).filter(([,t])=>t.change!==null).map(([key, t]) => {
                      const labels = {sessions:"Sessions",confirmations:"Applications",bounceRate:"Bounce",engagementRate:"Engagement",convRate:"Conv Rate"};
                      const isGood = key==="bounceRate" ? t.change<0 : t.change>0;
                      const arrow = t.change > 2 ? "↑" : t.change < -2 ? "↓" : "→";
                      const color = t.change > 2 ? (isGood ? C.sage : C.rose) : t.change < -2 ? (isGood ? C.sage : C.rose) : C.muted;
                      return (
                        <div key={key} style={{background:color+"12",border:`1px solid ${color}33`,borderRadius:8,padding:"4px 10px",fontSize:10}}>
                          <span style={{color:C.muted}}>{labels[key] || key}</span>{" "}
                          <span style={{color,fontWeight:600}}>{arrow} {t.change > 0 ? "+" : ""}{t.change.toFixed(0)}%</span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Action items */}
                <div style={{display:"flex",flexDirection:"column",gap:8}}>
                  {analyticsData.weeklyInsights.actions.map((item, i) => {
                    const priorityColors = { high: C.rose, medium: C.gold, low: C.muted, success: C.sage };
                    const priorityIcons = { high: "🔴", medium: "🟡", low: "💡", success: "✅" };
                    const bc = priorityColors[item.priority] || C.muted;
                    return (
                      <div key={i} style={{background:C.bg,border:`1px solid ${bc}33`,borderLeft:`3px solid ${bc}`,borderRadius:8,padding:"10px 14px"}}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:4}}>
                          <div style={{display:"flex",alignItems:"center",gap:6}}>
                            <span style={{fontSize:12}}>{priorityIcons[item.priority]}</span>
                            <span style={{fontSize:12,color:C.text,fontWeight:600}}>{item.title}</span>
                          </div>
                          <div style={{display:"flex",gap:6,flexShrink:0}}>
                            <span style={{fontSize:9,padding:"2px 8px",borderRadius:8,background:bc+"18",color:bc}}>{item.priority}</span>
                            <span style={{fontSize:9,padding:"2px 8px",borderRadius:8,background:C.blue+"18",color:C.blue}}>{item.category}</span>
                          </div>
                        </div>
                        <p style={{fontSize:11,color:C.muted,lineHeight:1.5,marginBottom:4}}>{item.action}</p>
                        <p style={{fontSize:10,color:bc,fontFamily:"DM Mono,monospace"}}>{item.metric}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:16,overflowX:"auto"}}>
              <p style={{fontSize:11,color:C.muted,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:12}}>Google Ads · Southall Campaigns · {rangeLabel}{googleIsLive?" · live":" · static"}</p>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:13,minWidth:600}}>
                <thead><tr style={{borderBottom:`1px solid ${C.border}`}}>
                  {["Campaign","Type","Spend","Form Submits","Avg CPC","Cost/Submit"].map(h=>(
                    <th key={h} style={{padding:"5px 10px",textAlign:"left",color:C.muted,fontWeight:500,fontSize:10,textTransform:"uppercase",letterSpacing:"0.06em"}}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {[...liveCampaigns].sort((a,b)=>b.spend-a.spend).map((c,i)=>{
                    const max=Math.max(...liveCampaigns.map(x=>x.spend));
                    const cpc2=(c.convs||c.leads)>0?c.spend/(c.convs||c.leads):null;
                    const tc={Search:C.blue,GMB:C.sage,Pmax:C.gold,Video:C.rose};
                    return <tr key={i} style={{borderBottom:`1px solid ${C.border}`}} onMouseEnter={e=>e.currentTarget.style.background="#ffffff07"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                      <td style={{padding:"9px 10px"}}>
                        <p style={{color:C.text,marginBottom:3}}>{c.name}</p>
                        <div style={{height:3,background:C.border,borderRadius:2,maxWidth:160}}><div style={{height:3,background:C.blue,borderRadius:2,width:`${Math.round(c.spend/max*100)}%`,opacity:0.55}}/></div>
                      </td>
                      <td style={{padding:"9px 10px"}}><span style={{color:tc[c.type],fontSize:11,background:tc[c.type]+"22",padding:"2px 8px",borderRadius:20}}>{c.type}</span></td>
                      <td style={{padding:"9px 10px",fontFamily:"DM Mono,monospace",color:C.text}}>{fmt(c.spend)}</td>
                      <td style={{padding:"9px 10px",fontFamily:"DM Mono,monospace",color:C.text}}>{c.convs}</td>
                      <td style={{padding:"9px 10px",fontFamily:"DM Mono,monospace",color:C.text}}>{fmt(c.avgCPC,"£",2)}</td>
                      <td style={{padding:"9px 10px",fontFamily:"DM Mono,monospace"}}>{cpc2!=null?<span style={{color:cplColor(cpc2)}}>{fmt(cpc2,"£",2)}</span>:<span style={{color:C.muted}}>—</span>}</td>
                    </tr>;
                  })}
                </tbody>
                <tfoot><tr style={{borderTop:`1px solid ${C.border}`}}>
                  <td colSpan={2} style={{padding:"9px 10px",color:C.muted,fontSize:11}}>Total</td>
                  <td style={{padding:"9px 10px",fontFamily:"DM Mono,monospace",color:C.gold,fontWeight:700}}>{fmt(liveCampaigns.reduce((s,c)=>s+c.spend,0))}</td>
                  <td style={{padding:"9px 10px",fontFamily:"DM Mono,monospace",color:C.gold,fontWeight:700}}>{gConvs}</td>
                  <td colSpan={2} style={{padding:"9px 10px",fontFamily:"DM Mono,monospace",color:C.muted}}>Avg: {fmt(gConvs>0?liveCampaigns.reduce((s,c)=>s+c.spend,0)/gConvs:0,"£",2)}/submit</td>
                </tr></tfoot>
              </table>
            </div>

            {/* ── LEAD SOURCE BREAKDOWN ── */}
            <div style={{marginTop:24}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:2}}>
                <p style={{fontSize:11,color:C.muted,textTransform:"uppercase",letterSpacing:"0.1em"}}>Southall · {rangeLabel} · CSV Upload Data</p>
                {leadsUpdatedAt && <p style={{fontSize:10,color:C.muted}}>Last updated: {new Date(leadsUpdatedAt).toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"})}</p>}
              </div>
              <h2 style={{fontSize:20,fontWeight:700,color:C.text,marginBottom:18}}>Lead Source Breakdown</h2>

              {leadsData.length === 0 ? (
                <div style={{padding:"16px 18px",background:C.card,border:`1px solid ${C.border}`,borderRadius:12,color:C.muted,fontSize:13}}>
                  No lead data uploaded yet. Upload your weekly CSV in the chat to populate this section.
                </div>
              ) : (
                <>
                  {/* Summary KPIs */}
                  <div style={{display:"flex",gap:12,marginBottom:14,flexWrap:"wrap"}}>
                    <KPI label="Total Leads" value={leadsFiltered.total} sub={`In selected period`} accent={C.gold}/>
                    <KPI label="Website Form" value={Object.entries(leadsFiltered.byChannel).filter(([k])=>k==="Organic").reduce((s,[,v])=>s+v,0)} sub="Direct / organic" accent={C.sage}/>
                    <KPI label="Google Ads" value={leadsFiltered.bySource["Google Ads"]||0} sub="Paid search leads" accent={C.blue}/>
                    <KPI label="Meta Ads" value={(leadsFiltered.bySource["Instagram Ad"]||0)+(leadsFiltered.bySource["Facebook Ad"]||0)+(leadsFiltered.bySource["Meta Ad"]||0)} sub="FB + IG paid leads" accent={C.purple}/>
                    <KPI label="Instagram (Organic)" value={leadsFiltered.bySource["Instagram"]||0} sub="Non-paid IG" accent={C.rose}/>
                  </div>

                  <div style={{display:"flex",gap:12,flexWrap:"wrap",marginBottom:14}}>
                    {/* Source breakdown table */}
                    <div style={{flex:"1 1 400px",background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:16}}>
                      <p style={{fontSize:11,color:C.muted,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:12}}>Leads by Source</p>
                      <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                        <thead><tr style={{borderBottom:`1px solid ${C.border}`}}>
                          <th style={{padding:"5px 10px",textAlign:"left",color:C.muted,fontWeight:500,fontSize:10,textTransform:"uppercase"}}>Source</th>
                          <th style={{padding:"5px 10px",textAlign:"right",color:C.muted,fontWeight:500,fontSize:10,textTransform:"uppercase"}}>Leads</th>
                          <th style={{padding:"5px 10px",textAlign:"right",color:C.muted,fontWeight:500,fontSize:10,textTransform:"uppercase"}}>%</th>
                          <th style={{padding:"5px 10px",textAlign:"left",color:C.muted,fontWeight:500,fontSize:10,width:"40%"}}></th>
                        </tr></thead>
                        <tbody>
                          {Object.entries(leadsFiltered.bySource).sort((a,b)=>b[1]-a[1]).map(([src, count], i) => {
                            const pct = leadsFiltered.total > 0 ? (count / leadsFiltered.total * 100) : 0;
                            const maxCount = Math.max(...Object.values(leadsFiltered.bySource));
                            const barPct = maxCount > 0 ? (count / maxCount * 100) : 0;
                            const srcColors = {"Google Ads":C.blue,"Google Search":C.blue,"Instagram Ad":"#E1306C","Instagram":"#E1306C","Facebook Ad":"#4267B2","Meta Ad":"#4267B2","LinkedIn":"#0A66C2","Word of Mouth":C.sage,"Online Ad":C.gold,"TikTok":"#69C9D0"};
                            const barColor = srcColors[src] || C.muted;
                            return (
                              <tr key={src} style={{borderBottom:`1px solid ${C.border}22`}}>
                                <td style={{padding:"7px 10px",color:C.text,fontSize:12}}>
                                  <span style={{display:"inline-block",width:8,height:8,borderRadius:4,background:barColor,marginRight:6,verticalAlign:"middle"}}/>
                                  {src}
                                </td>
                                <td style={{padding:"7px 10px",textAlign:"right",fontFamily:"DM Mono,monospace",color:C.text,fontWeight:600}}>{count}</td>
                                <td style={{padding:"7px 10px",textAlign:"right",fontFamily:"DM Mono,monospace",color:C.muted,fontSize:11}}>{pct.toFixed(1)}%</td>
                                <td style={{padding:"7px 10px"}}>
                                  <div style={{height:6,background:C.border,borderRadius:3,overflow:"hidden"}}>
                                    <div style={{height:6,background:barColor,borderRadius:3,width:`${barPct}%`,opacity:0.7,transition:"width 0.3s ease"}}/>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                        <tfoot><tr style={{borderTop:`1px solid ${C.border}`}}>
                          <td style={{padding:"7px 10px",color:C.muted,fontSize:11,fontWeight:600}}>Total</td>
                          <td style={{padding:"7px 10px",textAlign:"right",fontFamily:"DM Mono,monospace",color:C.gold,fontWeight:700}}>{leadsFiltered.total}</td>
                          <td colSpan={2}/>
                        </tr></tfoot>
                      </table>
                    </div>

                    {/* Channel breakdown */}
                    <div style={{flex:"1 1 250px",background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:16}}>
                      <p style={{fontSize:11,color:C.muted,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:12}}>By Channel</p>
                      {Object.entries(leadsFiltered.byChannel).sort((a,b)=>b[1]-a[1]).map(([ch, count]) => {
                        const pct = leadsFiltered.total > 0 ? (count / leadsFiltered.total * 100) : 0;
                        const chColors = {"Google Ads":C.blue,"Meta Ads":"#4267B2","Organic":C.sage,"Paid":C.gold};
                        const cc = chColors[ch] || C.muted;
                        return (
                          <div key={ch} style={{marginBottom:12}}>
                            <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                              <span style={{fontSize:12,color:C.text}}>{ch}</span>
                              <span style={{fontSize:12,fontFamily:"DM Mono,monospace",color:cc,fontWeight:600}}>{count} <span style={{color:C.muted,fontWeight:400}}>({pct.toFixed(0)}%)</span></span>
                            </div>
                            <div style={{height:8,background:C.border,borderRadius:4,overflow:"hidden"}}>
                              <div style={{height:8,background:cc,borderRadius:4,width:`${pct}%`,opacity:0.7,transition:"width 0.3s ease"}}/>
                            </div>
                          </div>
                        );
                      })}

                      {/* Daily lead volume sparkline */}
                      <div style={{marginTop:20}}>
                        <p style={{fontSize:11,color:C.muted,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:8}}>Daily Volume</p>
                        {(() => {
                          const days = Object.entries(leadsFiltered.byDay).sort((a,b)=>a[0].localeCompare(b[0]));
                          if (!days.length) return <p style={{fontSize:11,color:C.muted}}>No data</p>;
                          const maxD = Math.max(...days.map(d=>d[1]));
                          return (
                            <div style={{display:"flex",alignItems:"flex-end",gap:2,height:50}}>
                              {days.map(([day, cnt]) => (
                                <div key={day} title={`${day}: ${cnt} leads`} style={{flex:1,background:C.gold,borderRadius:"2px 2px 0 0",height:`${maxD>0?(cnt/maxD*100):0}%`,minHeight:2,opacity:0.65,cursor:"default",transition:"height 0.3s ease"}}/>
                              ))}
                            </div>
                          );
                        })()}
                        <div style={{display:"flex",justifyContent:"space-between",marginTop:4}}>
                          {(() => {
                            const days = Object.keys(leadsFiltered.byDay).sort();
                            if (days.length < 2) return null;
                            return <><span style={{fontSize:9,color:C.muted}}>{days[0].slice(5)}</span><span style={{fontSize:9,color:C.muted}}>{days[days.length-1].slice(5)}</span></>;
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* ── COST PER BOOKING ── */}
            <div style={{marginTop:24}}>
              <p style={{fontSize:11,color:C.muted,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:2}}>Southall · {rangeLabel} · GHL × RH × Ad spend</p>
              <h2 style={{fontSize:20,fontWeight:700,color:C.text,marginBottom:18}}>Cost Per Booking</h2>

              {!cacStats && (
                <div style={{padding:"16px 18px",background:C.card,border:`1px solid ${C.border}`,borderRadius:12,color:C.muted,fontSize:13}}>
                  {!ghlData?.allOpps ? "Connect Go High Level to attribute bookings to channels." : ""}
                  {!rhAllBookings?.length ? " Connect Res Harmonics to pull bookings." : ""}
                </div>
              )}

              {cacStats && (
                <>
                  {/* Core CAC cards */}
                  <div style={{display:"flex",gap:12,marginBottom:14,flexWrap:"wrap"}}>
                    <KPI label="Total Bookings" value={cacStats.counts.total} sub={`${cacStats.counts.meta} Meta · ${cacStats.counts.google} Google · ${cacStats.counts.other} Other`} accent={C.text}/>
                    <KPI label="Blended CAC" value={fmt(cacStats.blendedCAC,"£",0)} sub={`${fmt(cacStats.totalSpend)} spend ÷ ${cacStats.counts.total} bookings`} accent={C.rose}/>
                    <KPI label="Meta CAC" value={cacStats.counts.meta>0?fmt(cacStats.metaCAC,"£",0):"—"} sub={`${cacStats.counts.meta} Meta-attributed bookings`} accent={C.gold}/>
                    <KPI label="Google CAC" value={cacStats.counts.google>0?fmt(cacStats.googleCAC,"£",0):"—"} sub={`${cacStats.counts.google} Google-attributed bookings`} accent={C.blue}/>
                    <KPI label="Median Lead→Booking" value={cacStats.medianLag!=null?`${cacStats.medianLag}d`:"—"} sub={`Actual attribution window · n=${cacStats.lagSampleSize}`} accent={C.purple}/>
                  </div>

                  {/* LoS band cards */}
                  <p style={{fontSize:11,color:C.muted,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:10}}>Cost Per Booking · by length of stay</p>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:12,marginBottom:18}}>
                    {["1m","3m","6m","12m"].map(band => {
                      const n = cacStats.losBandCounts[band];
                      const cac = cacStats.bandCAC[band];
                      const avgV = cacStats.bandAvgValue[band];
                      const pct = cacStats.bandCacPctValue[band];
                      const ch = cacStats.losBandChannel[band];
                      const accent = band==="1m"?C.gold:band==="3m"?C.sage:band==="6m"?C.blue:C.purple;
                      return (
                        <div key={band} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:"14px 14px 12px",borderLeft:`3px solid ${accent}`}}>
                          <div style={{fontSize:10,color:C.muted,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:6}}>{cacStats.bandLabel[band]}</div>
                          <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:4}}>
                            <span style={{fontSize:22,fontWeight:700,color:C.text,fontFamily:"DM Mono,monospace"}}>{n>0?fmt(cac,"£",0):"—"}</span>
                            <span style={{fontSize:11,color:C.muted}}>CAC</span>
                          </div>
                          <div style={{fontSize:11,color:C.muted,marginBottom:3}}>{n} bookings · avg {fmt(avgV)}</div>
                          <div style={{fontSize:11,color:pct>0&&pct<10?C.sage:pct>=10&&pct<25?C.gold:pct>=25?C.rose:C.muted}}>{n>0?`${pct.toFixed(1)}% of contract value`:"no bookings"}</div>
                          <div style={{fontSize:10,color:C.muted,marginTop:6,paddingTop:6,borderTop:`1px dashed ${C.border}`}}>M:{ch.meta} · G:{ch.google} · O:{ch.other}</div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Bookings table — accordion */}
                  <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,overflow:"hidden"}}>
                    <button
                      onClick={()=>setCpbExpanded(v=>!v)}
                      style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"space-between",background:"transparent",border:"none",padding:"14px 16px",cursor:"pointer",color:C.text,fontFamily:"inherit"}}
                    >
                      <span style={{fontSize:11,color:C.muted,textTransform:"uppercase",letterSpacing:"0.08em"}}>
                        Bookings created in window — {cacStats.rows.length} total
                      </span>
                      <span style={{fontSize:13,color:C.muted,display:"flex",alignItems:"center",gap:8}}>
                        {cpbExpanded ? "Hide" : "View"} <span style={{display:"inline-block",transform:cpbExpanded?"rotate(180deg)":"rotate(0)",transition:"transform 0.15s"}}>▾</span>
                      </span>
                    </button>
                    {cpbExpanded && (
                    <div style={{padding:"0 14px 10px",overflowX:"auto"}}>
                    <table style={{width:"100%",minWidth:760,fontSize:12,borderCollapse:"collapse"}}>
                      <thead><tr style={{color:C.muted,textAlign:"left",borderBottom:`1px solid ${C.border}`}}>
                        <th style={{padding:"8px 10px"}}>Booked</th>
                        <th style={{padding:"8px 10px"}}>Guest</th>
                        <th style={{padding:"8px 10px"}}>Stay</th>
                        <th style={{padding:"8px 10px"}}>LoS</th>
                        <th style={{padding:"8px 10px"}}>Band</th>
                        <th style={{padding:"8px 10px"}}>Value</th>
                        <th style={{padding:"8px 10px"}}>Channel</th>
                        <th style={{padding:"8px 10px"}}>CAC</th>
                        <th style={{padding:"8px 10px"}}>CAC %</th>
                      </tr></thead>
                      <tbody>
                        {cacStats.rows.slice(0,40).map(r => {
                          const cac = r.channel==="meta"?cacStats.metaCAC : r.channel==="google"?cacStats.googleCAC : cacStats.blendedCAC;
                          const pct = r.value>0 ? (cac/r.value)*100 : 0;
                          const chCol = r.channel==="meta"?C.gold : r.channel==="google"?C.blue : C.muted;
                          return (
                            <tr key={r.bookingId} style={{borderBottom:`1px solid ${C.border}`}}>
                              <td style={{padding:"8px 10px",fontFamily:"DM Mono,monospace",color:C.muted}}>{r.refIso}</td>
                              <td style={{padding:"8px 10px",color:C.text}}>{r.name||r.email||"—"}</td>
                              <td style={{padding:"8px 10px",fontFamily:"DM Mono,monospace",color:C.muted,fontSize:11}}>{r.start}→{r.end}</td>
                              <td style={{padding:"8px 10px",fontFamily:"DM Mono,monospace",color:C.text}}>{r.losDays??"—"}d</td>
                              <td style={{padding:"8px 10px",color:C.muted}}>{r.band||"—"}</td>
                              <td style={{padding:"8px 10px",fontFamily:"DM Mono,monospace",color:C.text}}>{fmt(r.value)}</td>
                              <td style={{padding:"8px 10px",color:chCol,fontWeight:600,textTransform:"capitalize"}}>{r.channel}</td>
                              <td style={{padding:"8px 10px",fontFamily:"DM Mono,monospace",color:C.text}}>{fmt(cac,"£",0)}</td>
                              <td style={{padding:"8px 10px",fontFamily:"DM Mono,monospace",color:pct<10?C.sage:pct<25?C.gold:C.rose}}>{pct.toFixed(1)}%</td>
                            </tr>
                          );
                        })}
                        {cacStats.rows.length===0 && (
                          <tr><td colSpan={9} style={{padding:"18px 10px",textAlign:"center",color:C.muted}}>No bookings created in this window.</td></tr>
                        )}
                      </tbody>
                    </table>
                    {cacStats.rows.length > 40 && (
                      <div style={{fontSize:11,color:C.muted,marginTop:8,textAlign:"center"}}>Showing 40 of {cacStats.rows.length}</div>
                    )}
                    </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* ════ CRM ════ */}
        {property==="southall"&&tab==="crm"&&(
          <div style={{padding:"22px 26px"}}>
            <p style={{fontSize:11,color:C.muted,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:2}}>Go High Level · {GHL_PIPELINE} · {rangeLabel}</p>
            <h2 style={{fontSize:20,fontWeight:700,color:C.text,marginBottom:18}}>CRM Pipeline</h2>

            {!ghlConn&&!ghlLoading&&(
              <div style={{background:C.card,border:`1px solid ${C.purple}44`,borderRadius:14,padding:32,textAlign:"center"}}>
                <p style={{fontSize:30,marginBottom:10}}>🔌</p>
                <p style={{color:C.text,fontWeight:600,fontSize:15,marginBottom:6}}>Southall &Soul Pipeline</p>
                <p style={{color:C.muted,fontSize:13,marginBottom:20}}>
                  Pulls live tours booked (stage: <strong style={{color:C.purple}}>&ldquo;Tour Booked&rdquo;</strong>) and bookings confirmed (stage: <strong style={{color:C.sage}}>&ldquo;{STAGE_BOOKED}&rdquo;</strong>) plus total pipeline value.
                </p>
                <button onClick={()=>runGHL(from,to)} style={{background:C.purple,color:"#fff",border:"none",borderRadius:8,padding:"11px 32px",fontWeight:700,fontSize:14,cursor:"pointer"}}>
                  Connect to Go High Level
                </button>
                {ghlError&&(
                  <div style={{marginTop:16,background:C.rose+"18",border:`1px solid ${C.rose}44`,borderRadius:10,padding:"12px 16px",textAlign:"left"}}>
                    <p style={{color:C.rose,fontSize:12,fontWeight:600,marginBottom:4}}>Connection failed</p>
                    <p style={{color:C.rose,fontSize:11,fontFamily:"DM Mono,monospace",lineHeight:1.6,wordBreak:"break-word"}}>{ghlError}</p>
                    <button onClick={()=>runGHL(from,to)} style={{marginTop:10,background:"transparent",border:`1px solid ${C.rose}`,color:C.rose,borderRadius:6,padding:"5px 14px",fontSize:11,cursor:"pointer",fontWeight:600}}>↻ Try again</button>
                  </div>
                )}
              </div>
            )}

            {ghlLoading&&(
              <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:40,textAlign:"center"}}>
                <div style={{display:"inline-block",width:28,height:28,border:`3px solid ${C.border}`,borderTop:`3px solid ${C.purple}`,borderRadius:"50%",animation:"spin 0.8s linear infinite",marginBottom:14}}/>
                <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                <p style={{color:C.muted,fontSize:14}}>Connecting to Go High Level…</p>
              </div>
            )}

            {ghlConn&&ghlData&&!ghlLoading&&(
              <>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18,flexWrap:"wrap",gap:8}}>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <span style={{width:8,height:8,borderRadius:"50%",background:C.purple,display:"inline-block"}}/>
                    <span style={{fontSize:12,color:C.purple,fontWeight:600}}>{ghlData.pipelineName}</span>
                    <span style={{fontSize:11,color:C.muted}}>{ghlData.totalOpps} opps in range</span>
                  </div>
                  <div style={{display:"flex",gap:8}}>
                    <button onClick={()=>runGHL(from,to)} style={{background:"transparent",border:`1px solid ${C.purple}`,color:C.purple,borderRadius:6,padding:"4px 12px",fontSize:11,cursor:"pointer"}}>↻ Refresh</button>
                    <button onClick={()=>{setGhlConn(false);setGhlData(null);}} style={{background:"transparent",border:`1px solid ${C.border}`,color:C.muted,borderRadius:6,padding:"4px 12px",fontSize:11,cursor:"pointer"}}>Disconnect</button>
                  </div>
                </div>

                {ghlError&&<p style={{color:C.rose,fontSize:12,marginBottom:12}}>⚠ {ghlError}</p>}

                <div style={{display:"flex",gap:14,marginBottom:20,flexWrap:"wrap"}}>
                  <KPI label="Tours Booked"             value={ghlData.toursBooked}   sub={`Stage: "${ghlData.tourStageName??TAG_TOUR}"`}                                       accent={C.purple} badge={rangeLabel}/>
                  <KPI label="Bookings Confirmed"       value={adjConfirmed}      sub={`Won · Stage: "${ghlData.bookedStageName??STAGE_BOOKED}"`} accent={C.sage}   badge={rangeLabel}/>
                  <KPI label="Confirmed Pipeline Value" value={adjConfirmedValue>0?fmt(adjConfirmedValue):"£0"} sub="Total value of Won + Booking Confirmed" accent={C.gold}/>
                  <KPI label="Tour → Booking Rate"      value={adjConvRate!=null?`${adjConvRate}%`:"—"} sub="Confirmed ÷ Tours booked"       accent={adjConvRate==null?C.muted:adjConvRate>=30?C.sage:adjConvRate>=15?C.gold:C.rose}/>
                </div>

                {/* Manual Adjustments */}
                <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:16,marginBottom:14}}>
                  <p style={{fontSize:11,color:C.muted,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:12}}>Manual Adjustments</p>
                  <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
                    <div style={{flex:1,minWidth:150}}>
                      <label style={{display:"block",fontSize:12,color:C.muted,marginBottom:6}}>Manual bookings (+)</label>
                      <input type="number" value={manualBookings} onChange={e=>setManualBookings(Math.max(0,+e.target.value))} style={{width:"100%",background:C.bg,border:`1px solid ${C.border}`,color:C.text,borderRadius:8,padding:"8px 10px",fontSize:13,boxSizing:"border-box"}}/>
                    </div>
                    <div style={{flex:1,minWidth:150}}>
                      <label style={{display:"block",fontSize:12,color:C.muted,marginBottom:6}}>Manual value £ (+)</label>
                      <input type="number" value={manualValue} onChange={e=>setManualValue(Math.max(0,+e.target.value))} style={{width:"100%",background:C.bg,border:`1px solid ${C.border}`,color:C.text,borderRadius:8,padding:"8px 10px",fontSize:13,boxSizing:"border-box"}}/>
                    </div>
                  </div>
                </div>

                <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:20,marginBottom:14}}>
                  <p style={{fontSize:11,color:C.muted,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:14}}>Sales Funnel</p>
                  <div style={{display:"flex",alignItems:"stretch",gap:8,flexWrap:"wrap"}}>
                    {[
                      {label:"Total Opps",    value:ghlData.totalOpps,   color:C.blue,   pct:100},
                      {label:"Tours Booked",  value:ghlData.toursBooked, color:C.purple, pct:ghlData.totalOpps>0?Math.round(ghlData.toursBooked/ghlData.totalOpps*100):0},
                      {label:"Confirmed Won", value:adjConfirmed,   color:C.sage,   pct:ghlData.totalOpps>0?Math.round(adjConfirmed/ghlData.totalOpps*100):0},
                    ].map((s,i)=>(
                      <div key={i} style={{flex:"1 1 100px",minWidth:0,display:"flex",alignItems:"center",gap:6}}>
                        {i>0&&<span style={{color:C.muted,fontSize:20,flexShrink:0}}>›</span>}
                        <div style={{flex:1,background:s.color+"18",border:`1px solid ${s.color}44`,borderRadius:10,padding:"14px 10px",textAlign:"center"}}>
                          <p style={{fontSize:28,fontWeight:700,color:s.color,fontFamily:"DM Mono,monospace"}}>{s.value}</p>
                          <p style={{fontSize:11,color:C.muted,marginTop:3}}>{s.label}</p>
                          <p style={{fontSize:10,color:s.color,marginTop:2}}>{s.pct}%</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:18}}>
                  <p style={{fontSize:11,color:C.muted,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:10}}>Pipeline Stages — {ghlData.pipelineName}</p>
                  <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                    {ghlData.stages.map((s,i)=>{
                      const isMatch = s.name?.toLowerCase().includes("booking");
                      return <div key={i} style={{background:C.bg,border:`1px solid ${isMatch?C.sage:C.border}`,borderRadius:8,padding:"5px 12px",fontSize:12,color:isMatch?C.sage:C.muted}}>
                        {isMatch?"✓ ":""}{s.name}
                      </div>;
                    })}
                  </div>
                  {!ghlData.bookedStageName&&(
                    <p style={{fontSize:12,color:C.gold,marginTop:10}}>⚠ No stage matched &ldquo;{STAGE_BOOKED}&rdquo; — see stages above.</p>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* ════ OCCUPANCY ════ */}
        {property==="southall"&&tab==="bookings"&&(
          <div style={{padding:"22px 26px"}}>
            <p style={{fontSize:11,color:C.muted,textTransform:"uppercase",letterSpacing:"0.1em"}}>The House · 300 beds</p>
            <h2 style={{fontSize:20,fontWeight:700,color:C.text,margin:"4px 0 16px"}}>Occupancy & Revenue</h2>

            {/* ── RECENT BOOKING ACTIVITY ── */}
            <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:18,marginBottom:18}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14,flexWrap:"wrap",gap:8}}>
                <div>
                  <p style={{fontSize:11,color:C.gold,textTransform:"uppercase",letterSpacing:"0.1em",fontWeight:700}}>Recent Booking Activity</p>
                  <p style={{fontSize:12,color:C.muted,marginTop:2}}>New bookings & renewals created in period</p>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
                  {[
                    {l:"Last 7d",k:"7d",fn:()=>{const d=new Date();d.setDate(d.getDate()-6);setActivityFrom(d.toISOString().slice(0,10));setActivityTo(new Date().toISOString().slice(0,10));setActivityPreset("7d");}},
                    {l:"Last 14d",k:"14d",fn:()=>{const d=new Date();d.setDate(d.getDate()-13);setActivityFrom(d.toISOString().slice(0,10));setActivityTo(new Date().toISOString().slice(0,10));setActivityPreset("14d");}},
                    {l:"This week",k:"week",fn:()=>{const d=new Date();const day=d.getDay();const diff=day===0?6:day-1;const mon=new Date(d);mon.setDate(mon.getDate()-diff);setActivityFrom(mon.toISOString().slice(0,10));setActivityTo(new Date().toISOString().slice(0,10));setActivityPreset("week");}},
                  ].map(o=>(
                    <button key={o.k} onClick={o.fn} style={{padding:"4px 13px",borderRadius:20,border:`1px solid ${activityPreset===o.k?C.gold:C.border}`,background:activityPreset===o.k?C.gold+"22":"transparent",color:activityPreset===o.k?C.gold:C.muted,fontSize:11,fontWeight:600,cursor:"pointer"}}>{o.l}</button>
                  ))}
                  <CalendarPicker value={activityFrom} onChange={v=>{setActivityFrom(v);setActivityPreset(null);}} />
                  <span style={{fontSize:11,color:C.muted}}>→</span>
                  <CalendarPicker value={activityTo} onChange={v=>{setActivityTo(v);setActivityPreset(null);}} />
                </div>
              </div>

              {/* KPI cards */}
              <div style={{display:"flex",gap:12,flexWrap:"wrap",marginBottom:16}}>
                <KPI label="New Bookings" value={recentActivity.stats.newCount} sub="First-time tenants" accent={C.blue}/>
                <KPI label="Returning" value={recentActivity.stats.renewalCount} sub="Returning residents" accent={C.sage}/>
                <KPI label="Moved to Pending" value={recentActivity.stats.pendingCount} sub="Status: PENDING" accent={C.gold}/>
                <KPI label="Total Activity" value={recentActivity.stats.totalActivity} sub="New + Returning" accent={C.text}/>
              </div>

              {/* LoS & Room Type breakdown */}
              {recentActivity.all.length > 0 && (
                <div style={{display:"flex",gap:14,flexWrap:"wrap",marginBottom:16}}>
                  {/* LoS Breakdown */}
                  <div style={{flex:"1 1 280px",background:C.bg,borderRadius:12,padding:14,border:`1px solid ${C.border}`}}>
                    <p style={{fontSize:10,color:C.gold,textTransform:"uppercase",letterSpacing:"0.08em",fontWeight:700,marginBottom:10}}>LoS Breakdown</p>
                    <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                      <tbody>
                        {[
                          {l:"< 32 days",k:"<32d"},
                          {l:"32 – 91 days",k:"32-91d"},
                          {l:"92 – 181 days",k:"92-181d"},
                          {l:"182 – 364 days",k:"182-364d"},
                          {l:"365+ days",k:"365d+"},
                        ].map(row=>(
                          <tr key={row.k} style={{borderBottom:`1px solid ${C.border}22`}}>
                            <td style={{padding:"5px 8px",color:C.muted}}>{row.l}</td>
                            <td style={{padding:"5px 8px",textAlign:"right",fontFamily:"DM Mono,monospace",fontWeight:700,color:(recentActivity.losBuckets?.[row.k]||0)>0?C.text:C.muted}}>{recentActivity.losBuckets?.[row.k]||0}</td>
                          </tr>
                        ))}
                        <tr style={{borderTop:`1px solid ${C.border}`}}>
                          <td style={{padding:"6px 8px",color:C.text,fontWeight:700}}>Total New Bookings (Full)</td>
                          <td style={{padding:"6px 8px",textAlign:"right",fontFamily:"DM Mono,monospace",fontWeight:700,color:C.gold}}>{recentActivity.all?.length||0}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  {/* Room Type Breakdown */}
                  <div style={{flex:"1 1 280px",background:C.bg,borderRadius:12,padding:14,border:`1px solid ${C.border}`}}>
                    <p style={{fontSize:10,color:C.gold,textTransform:"uppercase",letterSpacing:"0.08em",fontWeight:700,marginBottom:10}}>Room Type Breakdown</p>
                    <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                      <tbody>
                        {["Nook","Ensuite/Nomad","Snug / +","Cosy","Roomy","Spacious","Deluxe/DDA"].map(rt=>(
                          <tr key={rt} style={{borderBottom:`1px solid ${C.border}22`}}>
                            <td style={{padding:"5px 8px",color:C.muted}}>{rt}</td>
                            <td style={{padding:"5px 8px",textAlign:"right",fontFamily:"DM Mono,monospace",fontWeight:700,color:(recentActivity.roomBuckets?.[rt]||0)>0?C.text:C.muted}}>{recentActivity.roomBuckets?.[rt]||0}</td>
                          </tr>
                        ))}
                        {(recentActivity.roomBuckets?.Other||0) > 0 && (
                          <tr style={{borderBottom:`1px solid ${C.border}22`}}>
                            <td style={{padding:"5px 8px",color:C.muted}}>Other</td>
                            <td style={{padding:"5px 8px",textAlign:"right",fontFamily:"DM Mono,monospace",fontWeight:700,color:C.text}}>{recentActivity.roomBuckets.Other}</td>
                          </tr>
                        )}
                        <tr style={{borderTop:`1px solid ${C.border}`}}>
                          <td style={{padding:"6px 8px",color:C.text,fontWeight:700}}>Total</td>
                          <td style={{padding:"6px 8px",textAlign:"right",fontFamily:"DM Mono,monospace",fontWeight:700,color:C.gold}}>{recentActivity.all?.length||0}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Move-in by Month & AWR Summary */}
              {recentActivity.all.length > 0 && (
                <div style={{display:"flex",gap:14,flexWrap:"wrap",marginBottom:16}}>
                  {/* Move-in by Month */}
                  <div style={{flex:"1 1 280px",background:C.bg,borderRadius:12,padding:14,border:`1px solid ${C.border}`}}>
                    <p style={{fontSize:10,color:C.gold,textTransform:"uppercase",letterSpacing:"0.08em",fontWeight:700,marginBottom:10}}>Move-in by Month</p>
                    <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                      <tbody>
                        {(recentActivity.moveInOrdered||[]).map(row=>(
                          <tr key={row.month} style={{borderBottom:`1px solid ${C.border}22`}}>
                            <td style={{padding:"5px 8px",color:C.muted}}>{row.month}</td>
                            <td style={{padding:"5px 8px",textAlign:"right",fontFamily:"DM Mono,monospace",fontWeight:700,color:row.count>0?C.text:C.muted}}>{row.count}</td>
                          </tr>
                        ))}
                        <tr style={{borderTop:`1px solid ${C.border}`}}>
                          <td style={{padding:"6px 8px",color:C.text,fontWeight:700}}>Total</td>
                          <td style={{padding:"6px 8px",textAlign:"right",fontFamily:"DM Mono,monospace",fontWeight:700,color:C.gold}}>{recentActivity.all?.length||0}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  {/* AWR Summary */}
                  <div style={{flex:"1 1 280px",background:C.bg,borderRadius:12,padding:14,border:`1px solid ${C.border}`}}>
                    <p style={{fontSize:10,color:C.gold,textTransform:"uppercase",letterSpacing:"0.08em",fontWeight:700,marginBottom:10}}>Closed Bookings — AWR Summary</p>
                    <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                      <tbody>
                        <tr style={{borderBottom:`1px solid ${C.border}22`}}>
                          <td style={{padding:"5px 8px",color:C.muted}}>Avg Weekly Rent</td>
                          <td style={{padding:"5px 8px",textAlign:"right",fontFamily:"DM Mono,monospace",fontWeight:700,color:C.text}}>£{recentActivity.awrSummary?.avg||0}</td>
                        </tr>
                        <tr style={{borderBottom:`1px solid ${C.border}22`}}>
                          <td style={{padding:"5px 8px",color:C.muted}}>Min AWR</td>
                          <td style={{padding:"5px 8px",textAlign:"right",fontFamily:"DM Mono,monospace",fontWeight:700,color:C.muted}}>£{recentActivity.awrSummary?.min||0}</td>
                        </tr>
                        <tr style={{borderBottom:`1px solid ${C.border}22`}}>
                          <td style={{padding:"5px 8px",color:C.muted}}>Max AWR</td>
                          <td style={{padding:"5px 8px",textAlign:"right",fontFamily:"DM Mono,monospace",fontWeight:700,color:C.muted}}>£{recentActivity.awrSummary?.max||0}</td>
                        </tr>
                        <tr style={{borderBottom:`1px solid ${C.border}22`}}>
                          <td style={{padding:"5px 8px",color:C.muted}}>Bookings with rate data</td>
                          <td style={{padding:"5px 8px",textAlign:"right",fontFamily:"DM Mono,monospace",fontWeight:700,color:C.muted}}>{recentActivity.awrSummary?.count||0} / {recentActivity.all?.length||0}</td>
                        </tr>
                        <tr style={{borderTop:`1px solid ${C.border}`}}>
                          <td style={{padding:"6px 8px",color:C.text,fontWeight:700}}>Total Contract Value</td>
                          <td style={{padding:"6px 8px",textAlign:"right",fontFamily:"DM Mono,monospace",fontWeight:700,color:C.gold}}>£{(recentActivity.awrSummary?.totalContractValue||0).toLocaleString()}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Breakdown table */}
              {recentActivity.all.length > 0 && (
                <div style={{overflowX:"auto"}}>
                  <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                    <thead>
                      <tr style={{borderBottom:`1px solid ${C.border}`}}>
                        {["Name","Booking Ref","Created","Start → End","LoS","Room","AWR","Status","Type"].map(h=>(
                          <th key={h} style={{padding:"8px 10px",textAlign:"left",color:C.muted,fontSize:10,textTransform:"uppercase",letterSpacing:"0.08em",fontWeight:600}}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {recentActivity.all.map((r,i)=>{
                        const statusColor = r.status==="CHECKED_IN"?C.sage:r.status==="CONFIRMED"?C.blue:C.gold;
                        const typeColor = r.activityType==="Returning"?C.sage:C.blue;
                        return (
                          <tr key={r.roomStayId||i} style={{borderBottom:`1px solid ${C.border}22`}}>
                            <td style={{padding:"8px 10px",color:C.text,fontWeight:600,whiteSpace:"nowrap"}}>{r.name||"—"}</td>
                            <td style={{padding:"8px 10px",fontFamily:"DM Mono,monospace",fontSize:11}}>
                              {r.bookingId?(
                                <a href={`https://app.resharmonics.com/bookings/${r.bookingId}`} target="_blank" rel="noopener noreferrer" style={{color:C.gold,textDecoration:"none",borderBottom:`1px dashed ${C.gold}55`}}>{r.bookingReference}</a>
                              ):(
                                <span style={{color:C.muted}}>{r.bookingReference||"—"}</span>
                              )}
                            </td>
                            <td style={{padding:"8px 10px",color:C.muted,fontFamily:"DM Mono,monospace",fontSize:11}}>{r.created}</td>
                            <td style={{padding:"8px 10px",color:C.muted,whiteSpace:"nowrap",fontSize:11}}>{r.startDate} → {r.endDate}</td>
                            <td style={{padding:"8px 10px",color:C.muted,fontFamily:"DM Mono,monospace"}}>{r.losDays}d</td>
                            <td style={{padding:"8px 10px",color:C.muted,whiteSpace:"nowrap"}}>{r.room}</td>
                            <td style={{padding:"8px 10px",color:r.weeklyRate>0?C.text:C.muted,fontFamily:"DM Mono,monospace",fontSize:11}}>{r.weeklyRate>0?`£${r.weeklyRate}`:"—"}</td>
                            <td style={{padding:"8px 10px"}}><span style={{fontSize:10,background:statusColor+"22",color:statusColor,padding:"2px 8px",borderRadius:8,fontWeight:600}}>{r.status}</span></td>
                            <td style={{padding:"8px 10px"}}><span style={{fontSize:10,background:typeColor+"22",color:typeColor,padding:"2px 8px",borderRadius:8,fontWeight:600}}>{r.activityType}</span></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
              {recentActivity.all.length === 0 && (
                <p style={{fontSize:12,color:C.muted,textAlign:"center",padding:16}}>No qualifying bookings found in this date range.</p>
              )}
            </div>

            {!pmsConn&&(
              <div style={{background:C.card,border:`1px solid ${C.goldDim}`,borderRadius:14,padding:18,marginBottom:18}}>
                <p style={{fontWeight:700,color:C.gold,fontSize:14,marginBottom:4}}>Connect Res Harmonics PMS</p>
                <p style={{fontSize:12,color:C.muted,marginBottom:12}}>OAuth2 from Res Harmonics admin → Settings → API / Integrations</p>
                <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
                  <input type="text" placeholder="Client ID" value={cid} onChange={e=>setCid(e.target.value)} style={{flex:1,minWidth:150,background:C.bg,border:`1px solid ${C.border}`,color:C.text,borderRadius:8,padding:"9px 12px",fontSize:13}}/>
                  <input type="password" placeholder="Client Secret" value={csec} onChange={e=>setCsec(e.target.value)} style={{flex:1,minWidth:150,background:C.bg,border:`1px solid ${C.border}`,color:C.text,borderRadius:8,padding:"9px 12px",fontSize:13}}/>
                  <button onClick={connectPMS} disabled={pmsLoad} style={{background:C.gold,color:"#000",border:"none",borderRadius:8,padding:"9px 18px",fontWeight:700,fontSize:13,cursor:"pointer",opacity:pmsLoad?0.6:1}}>{pmsLoad?"Connecting…":"Connect"}</button>
                </div>
                {pmsErr&&<p style={{color:C.rose,fontSize:12,marginTop:8}}>⚠ {pmsErr}</p>}
              </div>
            )}

            {/* ── TODAY'S SNAPSHOT ── */}
            <div style={{background:C.card,border:`1px solid ${C.gold}44`,borderRadius:14,padding:18,marginBottom:16}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                <div>
                  <p style={{fontSize:11,color:C.gold,textTransform:"uppercase",letterSpacing:"0.1em",fontWeight:700}}>Today · {new Date().toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"})}</p>
                  <p style={{fontSize:12,color:C.muted,marginTop:2}}>Current in-house occupancy (checked-in guests only)</p>
                </div>
                {pmsConn&&<span style={{fontSize:10,color:C.sage,fontWeight:600}}>● LIVE</span>}
              </div>
              <div style={{display:"flex",gap:14,flexWrap:"wrap"}}>
                <div style={{flex:"1 1 200px",background:C.bg,borderRadius:12,padding:16,border:`1px solid ${C.border}`,display:"flex",alignItems:"center",gap:16}}>
                  <OccRing pct={occPct}/>
                  <div>
                    <p style={{fontSize:28,fontWeight:700,color:C.text,fontFamily:"DM Mono,monospace"}}>{occupied}<span style={{fontSize:14,color:C.muted,fontWeight:400}}> / {BEDS}</span></p>
                    <p style={{fontSize:12,color:C.muted}}>rooms occupied today{pmsData?.inHouseGuests > occupied ? ` (${pmsData.inHouseGuests} guests)` : ""}</p>
                  </div>
                </div>
                <div style={{flex:"1 1 200px",display:"flex",flexDirection:"column",gap:8}}>
                  {(pmsConn&&pmsData?[
                    {label:"Check-ins (7d)",value:pmsData.checkInsWeek??0,color:C.sage},
                    {label:"Check-outs (7d)",value:pmsData.checkOutsWeek??0,color:C.rose},
                    {label:"Revenue this month",value:fmt(monthRev),color:C.gold},
                    {label:"Revenue this week",value:fmt(weekRev),color:C.text},
                  ]:[
                    {label:"Occupancy %",value:`${mOcc}%`,color:C.gold},
                    {label:"Est. monthly revenue",value:fmt(monthRev),color:C.gold},
                  ]).map(x=>(
                    <div key={x.label} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:`1px solid ${C.border}`}}>
                      <span style={{fontSize:12,color:C.muted}}>{x.label}</span>
                      <span style={{fontSize:13,fontWeight:700,color:x.color,fontFamily:"DM Mono,monospace"}}>{x.value}</span>
                    </div>
                  ))}
                </div>
              </div>
              {!pmsConn&&(<div style={{marginTop:12,display:"flex",gap:14,flexWrap:"wrap"}}>
                <div style={{flex:1,minWidth:150}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><span style={{fontSize:12,color:C.muted}}>Occupancy % (manual)</span><span style={{fontSize:12,color:C.gold,fontFamily:"DM Mono,monospace"}}>{mOcc}%</span></div>
                  <input type="range" min={0} max={100} value={mOcc} onChange={e=>setMOcc(+e.target.value)} style={{width:"100%",accentColor:C.gold}}/>
                </div>
                <div style={{flex:1,minWidth:150}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}><span style={{fontSize:12,color:C.muted}}>Avg monthly rent</span><span style={{fontSize:12,color:C.gold,fontFamily:"DM Mono,monospace"}}>£{mRate.toLocaleString()}</span></div>
                  <input type="number" value={mRate} onChange={e=>setMRate(+e.target.value)} style={{width:"100%",background:C.bg,border:`1px solid ${C.border}`,color:C.text,borderRadius:8,padding:"7px 10px",fontSize:13,boxSizing:"border-box"}}/>
                </div>
              </div>)}
              <div style={{display:"flex",justifyContent:"space-between",marginTop:12,marginBottom:4}}>
                <span style={{fontSize:11,color:C.muted}}>Target 95% ({Math.round(BEDS*.95)} beds)</span>
                <span style={{fontSize:11,color:occPct>=95?C.sage:C.rose}}>{occPct>=95?"✓ Hit":`${Math.round(BEDS*.95)-occupied} to go`}</span>
              </div>
              <div style={{height:6,background:C.border,borderRadius:3,position:"relative"}}>
                <div style={{height:6,background:occPct>=95?C.sage:C.gold,borderRadius:3,width:`${Math.min(occPct,100)}%`,transition:"width 0.4s"}}/>
                <div style={{position:"absolute",top:-2,left:"95%",height:10,width:2,background:C.muted,borderRadius:1}}/>
              </div>
            </div>

            {/* ── LENGTH-OF-STAY BREAKDOWN BY STATUS ── */}
            {pmsConn && pmsData?.losByStatus && (pmsData.losByStatus.inHouse.total > 0 || pmsData.losByStatus.upcoming.total > 0) && (() => {
              const { inHouse, upcoming, bands } = pmsData.losByStatus;
              const barColors = [C.rose, C.gold, C.blue, C.sage, C.purple];
              const renderGroup = (group, title, subtitle) => {
                if (group.total === 0) return null;
                return (
                  <div style={{flex:"1 1 320px",background:C.bg,borderRadius:12,padding:16,border:`1px solid ${C.border}`}}>
                    <p style={{fontSize:13,fontWeight:700,color:C.text,marginBottom:2}}>{title}</p>
                    <p style={{fontSize:11,color:C.muted,marginBottom:14}}>{group.total} bookings · {subtitle}</p>
                    {/* Stacked bar */}
                    <div style={{display:"flex",height:18,borderRadius:6,overflow:"hidden",marginBottom:14}}>
                      {bands.map((b, i) => {
                        const pct = group.total > 0 ? (group.counts[b.key] / group.total) * 100 : 0;
                        if (pct === 0) return null;
                        return <div key={b.key} style={{width:`${pct}%`,background:barColors[i],minWidth:pct>0?2:0}} title={`${b.label}: ${Math.round(pct)}%`}/>;
                      })}
                    </div>
                    {/* Rows */}
                    {bands.map((b, i) => {
                      const count = group.counts[b.key];
                      const pct = group.total > 0 ? (count / group.total) * 100 : 0;
                      return (
                        <div key={b.key} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"5px 0",borderBottom:i<bands.length-1?`1px solid ${C.border}`:"none"}}>
                          <div style={{display:"flex",alignItems:"center",gap:8}}>
                            <div style={{width:10,height:10,borderRadius:3,background:barColors[i],flexShrink:0}}/>
                            <span style={{fontSize:12,color:C.muted}}>{b.label}</span>
                          </div>
                          <div style={{display:"flex",alignItems:"baseline",gap:8}}>
                            <span style={{fontSize:13,fontWeight:700,color:C.text,fontFamily:"DM Mono,monospace"}}>{Math.round(pct)}%</span>
                            <span style={{fontSize:11,color:C.muted,fontFamily:"DM Mono,monospace",minWidth:28,textAlign:"right"}}>{count}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              };
              // Combined totals
              const combined = { counts: {}, total: inHouse.total + upcoming.total };
              bands.forEach(b => { combined.counts[b.key] = (inHouse.counts[b.key] || 0) + (upcoming.counts[b.key] || 0); });
              return (
                <div style={{background:C.card,border:`1px solid ${C.blue}44`,borderRadius:14,padding:18,marginBottom:16}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                    <div>
                      <p style={{fontSize:11,color:C.blue,textTransform:"uppercase",letterSpacing:"0.1em",fontWeight:700}}>Length-of-Stay Breakdown</p>
                      <p style={{fontSize:12,color:C.muted,marginTop:2}}>All current & upcoming bookings by stay duration</p>
                    </div>
                    <span style={{fontSize:10,color:C.sage,fontWeight:600}}>● LIVE</span>
                  </div>
                  <div style={{display:"flex",gap:14,flexWrap:"wrap"}}>
                    <div style={{flex:"2 1 500px",display:"flex",gap:14,flexWrap:"wrap"}}>
                      {renderGroup(inHouse, "Checked In", "currently in the building")}
                      {renderGroup(upcoming, "Confirmed & Pending", "future bookings")}
                    </div>
                    {renderGroup(combined, "All Bookings", `${inHouse.total} checked in + ${upcoming.total} upcoming`)}
                  </div>
                  {/* AWR by status row */}
                  {pmsData.awrByStatus && (() => {
                    const a = pmsData.awrByStatus;
                    const cards = [
                      { title: "Checked In", awr: a.inHouse.awr, awrGross: a.inHouse.awrGross, count: a.inHouse.count },
                      { title: "Confirmed & Pending", awr: a.upcoming.awr, awrGross: a.upcoming.awrGross, count: a.upcoming.count },
                      { title: "All Bookings", awr: a.all.awr, awrGross: a.all.awrGross, count: a.all.count },
                    ];
                    return (
                      <div style={{marginTop:14}}>
                        <p style={{fontSize:11,color:C.gold,textTransform:"uppercase",letterSpacing:"0.1em",fontWeight:700,marginBottom:10}}>Average Weekly Rate (AWR) · 28+ Day Bookings</p>
                        <div style={{display:"flex",gap:14,flexWrap:"wrap"}}>
                          {cards.map((c, i) => (
                            <div key={i} style={{flex:"1 1 200px",background:C.bg,borderRadius:12,padding:16,border:`1px solid ${C.border}`}}>
                              <p style={{fontSize:12,fontWeight:700,color:C.text,marginBottom:2}}>{c.title}</p>
                              <p style={{fontSize:11,color:C.muted,marginBottom:10}}>{c.count} qualifying bookings</p>
                              <div style={{display:"flex",alignItems:"baseline",gap:10,marginBottom:2}}>
                                <div>
                                  <p style={{fontSize:10,color:C.muted,marginBottom:2}}>Net (ex-VAT)</p>
                                  <p style={{fontSize:24,fontWeight:700,color:c.awr>=TARGET_RATE?C.sage:c.awr>=250?C.gold:C.rose,fontFamily:"DM Mono,monospace",margin:0}}>
                                    {c.awr>0?`£${c.awr.toLocaleString()}`:"—"}
                                  </p>
                                </div>
                                <div>
                                  <p style={{fontSize:10,color:C.muted,marginBottom:2}}>Gross (inc VAT)</p>
                                  <p style={{fontSize:24,fontWeight:700,color:c.awrGross>=TARGET_RATE?C.sage:c.awrGross>=250?C.gold:C.rose,fontFamily:"DM Mono,monospace",margin:0}}>
                                    {c.awrGross>0?`£${c.awrGross.toLocaleString()}`:"—"}
                                  </p>
                                </div>
                              </div>
                              <p style={{fontSize:10,color:c.awr>=TARGET_RATE?C.sage:C.rose,marginTop:4}}>
                                {c.awr>0?(c.awr>=TARGET_RATE?`✓ Net above £${TARGET_RATE} target`:`Net £${TARGET_RATE-c.awr} below £${TARGET_RATE} target`):"No data"}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              );
            })()}

            <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:18}}>
              <p style={{fontSize:11,color:C.muted,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:12}}>Revenue Target Calculator</p>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(140px, 1fr))",gap:10,marginBottom:16}}>
                {[{label:"Target occupancy",value:`${TARGET_OCC*100}%`,color:C.gold},{label:"Target rooms",value:TARGET_ROOMS,color:C.sage},{label:"Average rate",value:fmt(TARGET_RATE),color:C.blue},{label:"Monthly target",value:fmt(TARGET_MONTHLY),color:C.rose}].map((s,i)=>(
                  <div key={i} style={{background:C.bg,borderRadius:10,padding:"12px 14px",border:`1px solid ${C.border}`}}>
                    <p style={{fontSize:10,color:C.muted,marginBottom:4}}>{s.label}</p>
                    <p style={{fontSize:16,fontWeight:700,color:s.color,fontFamily:"DM Mono,monospace"}}>{s.value}</p>
                  </div>
                ))}
              </div>

              <div style={{background:C.bg,borderRadius:10,padding:14,border:`1px solid ${C.border}`,marginBottom:12}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:8}}>
                  <span style={{fontSize:12,color:C.muted}}>Current vs Target</span>
                  <span style={{fontSize:14,fontWeight:700,color:occupied>=TARGET_ROOMS?C.sage:C.gold,fontFamily:"DM Mono,monospace"}}>{occupied} / {TARGET_ROOMS} rooms</span>
                </div>
                <div style={{height:8,background:C.border,borderRadius:4,position:"relative",overflow:"hidden"}}>
                  <div style={{height:8,background:occupied>=TARGET_ROOMS?C.sage:C.gold,borderRadius:4,width:`${Math.min((occupied/TARGET_ROOMS)*100,100)}%`,transition:"width 0.4s"}}/>
                </div>
                <p style={{fontSize:10,color:C.muted,marginTop:6}}>{occupied>=TARGET_ROOMS?`✓ TARGET HIT`:`${TARGET_ROOMS-occupied} rooms still needed`}</p>
              </div>

              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(140px, 1fr))",gap:10}}>
                {(() => {
                  const today = new Date();
                  const july1 = new Date("2026-07-01");
                  const daysLeft = Math.ceil((july1 - today) / (1000*60*60*24));
                  const weeksLeft = Math.ceil(daysLeft / 7);
                  const roomsNeeded = Math.max(0, TARGET_ROOMS - occupied);
                  const bookingsPerWeek = weeksLeft > 0 ? Math.ceil(roomsNeeded / weeksLeft) : 0;

                  return [
                    {label:"Days until July 1st",value:daysLeft,color:C.muted},
                    {label:"Weeks remaining",value:weeksLeft,color:C.muted},
                    {label:"Rooms still needed",value:roomsNeeded,color:roomsNeeded===0?C.sage:C.rose},
                    {label:"Bookings per week needed",value:bookingsPerWeek,color:C.gold},
                  ].map((s,i)=>(
                    <div key={i} style={{background:C.bg,borderRadius:10,padding:"12px 14px",border:`1px solid ${C.border}`}}>
                      <p style={{fontSize:10,color:C.muted,marginBottom:4}}>{s.label}</p>
                      <p style={{fontSize:16,fontWeight:700,color:s.color,fontFamily:"DM Mono,monospace"}}>{s.value}</p>
                    </div>
                  ));
                })()}
              </div>
            </div>

            {/* ── MONTH-BY-MONTH OCCUPANCY FORECAST ── */}
            {pmsConn && pmsData?.forecast && (
              <div style={{background:C.card,border:`1px solid ${C.sage}44`,borderRadius:14,padding:18,marginTop:16}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                  <p style={{fontSize:11,color:C.sage,textTransform:"uppercase",letterSpacing:"0.1em",fontWeight:700}}>Future Occupancy · Month by Month</p>
                  <span style={{fontSize:10,color:C.sage}}>● LIVE from Res Harmonics</span>
                </div>
                <p style={{fontSize:12,color:C.muted,marginBottom:16}}>Bookings 28+ days · occupancy by days and rooms / {BEDS}</p>

                {/* Bar chart with dual occupancy — days + rooms */}
                <div style={{display:"flex",gap:8,alignItems:"flex-end",height:220,marginBottom:16,padding:"0 4px"}}>
                  {pmsData.forecast.map((fm, i) => {
                    const daysPct = Math.min(fm.occupancyPct, 100);
                    const roomsPct = Math.min(Math.round((fm.activeStays / BEDS) * 100), 100);
                    const barColor = daysPct >= 90 ? C.sage : daysPct >= 70 ? C.gold : C.rose;
                    return (
                      <div key={fm.key} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:2}}>
                        <span style={{fontSize:11,fontWeight:700,color:C.text,fontFamily:"DM Mono,monospace"}}>{(fm.bookedDays||0).toLocaleString()}</span>
                        <span style={{fontSize:9,color:C.muted}}>/ {(fm.totalBookableDays||0).toLocaleString()} days</span>
                        <span style={{fontSize:10,fontWeight:600,color:C.blue,fontFamily:"DM Mono,monospace"}}>{fm.activeStays} <span style={{fontWeight:400,color:C.muted}}>/ {BEDS} rooms</span></span>
                        <div style={{width:"100%",maxWidth:60,background:C.border,borderRadius:6,height:120,position:"relative",overflow:"hidden",display:"flex",alignItems:"flex-end"}}>
                          <div style={{width:"100%",height:`${daysPct}%`,background:barColor,borderRadius:6,transition:"height 0.4s"}}/>
                        </div>
                        <span style={{fontSize:11,fontWeight:700,color:barColor,fontFamily:"DM Mono,monospace"}}>{fm.occupancyPct}% <span style={{fontSize:9,fontWeight:400,color:C.muted}}>days</span></span>
                        <span style={{fontSize:10,fontWeight:600,color:C.blue,fontFamily:"DM Mono,monospace"}}>{roomsPct}% <span style={{fontSize:9,fontWeight:400,color:C.muted}}>rooms</span></span>
                        <span style={{fontSize:10,color:i===0?C.text:C.muted,fontWeight:i===0?700:400}}>{fm.label}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Detail table */}
                <div style={{overflowX:"auto"}}>
                  <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                    <thead>
                      <tr style={{borderBottom:`1px solid ${C.border}`}}>
                        <th style={{textAlign:"left",padding:"8px 10px",color:C.muted,fontWeight:600,fontSize:10,textTransform:"uppercase"}}>Month</th>
                        <th style={{textAlign:"right",padding:"8px 10px",color:C.muted,fontWeight:600,fontSize:10,textTransform:"uppercase"}}>Booked Days</th>
                        <th style={{textAlign:"right",padding:"8px 10px",color:C.muted,fontWeight:600,fontSize:10,textTransform:"uppercase"}}>Days Occ.</th>
                        <th style={{textAlign:"right",padding:"8px 10px",color:C.muted,fontWeight:600,fontSize:10,textTransform:"uppercase"}}>Rooms / {BEDS - offlineRooms}</th>
                        <th style={{textAlign:"right",padding:"8px 10px",color:C.muted,fontWeight:600,fontSize:10,textTransform:"uppercase"}}>Rooms Occ.</th>
                        <th style={{textAlign:"right",padding:"8px 10px",color:C.muted,fontWeight:600,fontSize:10,textTransform:"uppercase"}}>Arrivals</th>
                        <th style={{textAlign:"right",padding:"8px 10px",color:C.muted,fontWeight:600,fontSize:10,textTransform:"uppercase"}}>Departures</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pmsData.forecast.map((fm, i) => {
                        const roomsPct = Math.round((fm.activeStays / BEDS) * 100);
                        return (
                        <tr key={fm.key} style={{borderBottom:`1px solid ${C.border}`,background:i===0?C.gold+"0a":"transparent"}}>
                          <td style={{padding:"8px 10px",color:i===0?C.text:C.muted,fontWeight:i===0?700:400}}>{fm.label}{i===0?" (current)":""}</td>
                          <td style={{padding:"8px 10px",textAlign:"right",fontFamily:"DM Mono,monospace",color:C.text,fontWeight:600}}>{(fm.bookedDays||0).toLocaleString()} <span style={{color:C.muted,fontWeight:400}}>/ {(fm.totalBookableDays||0).toLocaleString()}</span></td>
                          <td style={{padding:"8px 10px",textAlign:"right",fontFamily:"DM Mono,monospace",fontWeight:700,color:fm.occupancyPct>=90?C.sage:fm.occupancyPct>=70?C.gold:C.rose}}>{fm.occupancyPct}%</td>
                          <td style={{padding:"8px 10px",textAlign:"right",fontFamily:"DM Mono,monospace",color:C.text}}><span style={{fontWeight:700}}>{fm.activeStays}</span> <span style={{color:C.muted,fontWeight:400}}>/ {BEDS}</span></td>
                          <td style={{padding:"8px 10px",textAlign:"right",fontFamily:"DM Mono,monospace",fontWeight:700,color:roomsPct>=90?C.sage:roomsPct>=70?C.gold:C.blue}}>{roomsPct}%</td>
                          <td style={{padding:"8px 10px",textAlign:"right",fontFamily:"DM Mono,monospace",color:C.sage}}>+{fm.checkIns}</td>
                          <td style={{padding:"8px 10px",textAlign:"right",fontFamily:"DM Mono,monospace",color:C.rose}}>-{fm.checkOuts}</td>
                        </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── RENEWAL RATE PREDICTION ── */}
            {pmsConn && pmsData?.forecast && (
              <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:18,marginTop:16}}>
                <p style={{fontSize:11,color:C.muted,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:4}}>Occupancy Prediction Model</p>
                <p style={{fontSize:12,color:C.muted,marginBottom:14}}>Cohort-based model: each new booking / renewal stays for its real length-of-stay, then leaves</p>

                {/* ── LoS mix panel — fixed business mix ── */}
                {(() => {
                  const bands = [
                    { key:"short",  label:"30-day bookings",  share:0.25, avgDays:30,  color:C.rose },
                    { key:"medium", label:"90-day bookings",  share:0.25, avgDays:90,  color:C.gold },
                    { key:"long",   label:"180-day bookings", share:0.15, avgDays:180, color:C.blue },
                    { key:"annual", label:"365-day bookings", share:0.35, avgDays:365, color:C.sage },
                  ];
                  return (
                    <div style={{background:C.bg,border:`1px solid ${C.border}`,borderRadius:8,padding:12,marginBottom:14}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                        <span style={{fontSize:11,color:C.muted,textTransform:"uppercase",letterSpacing:"0.08em",fontWeight:600}}>Length-of-Stay Mix</span>
                        <span style={{fontSize:10,color:C.muted}}>Business mix · applied to every new booking + renewal</span>
                      </div>
                      <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                        {bands.map(b => (
                          <div key={b.key} style={{flex:"1 1 140px",background:C.card,border:`1px solid ${C.border}`,borderRadius:6,padding:"8px 10px"}}>
                            <div style={{fontSize:10,color:C.muted,textTransform:"uppercase",letterSpacing:"0.06em"}}>{b.label}</div>
                            <div style={{display:"flex",alignItems:"baseline",gap:6,marginTop:2}}>
                              <span style={{fontSize:18,fontWeight:700,color:b.color,fontFamily:"DM Mono,monospace"}}>{Math.round(b.share*100)}%</span>
                              <span style={{fontSize:10,color:C.muted}}>· {b.avgDays}d stay</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                <div style={{display:"flex",gap:16,marginBottom:18,flexWrap:"wrap"}}>
                  <div style={{flex:"1 1 200px"}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                      <span style={{fontSize:12,color:C.muted}}>Predicted renewal rate</span>
                      <span style={{fontSize:13,fontWeight:700,color:forecastRenewalRate>=70?C.sage:forecastRenewalRate>=50?C.gold:C.rose,fontFamily:"DM Mono,monospace"}}>{forecastRenewalRate}%</span>
                    </div>
                    <input type="range" min={0} max={100} value={forecastRenewalRate} onChange={e=>setForecastRenewalRate(+e.target.value)} style={{width:"100%",accentColor:C.sage}}/>
                    <p style={{fontSize:10,color:C.muted,marginTop:2}}>% of guests whose contracts end who will renew</p>
                  </div>
                  <div style={{flex:"1 1 200px"}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                      <span style={{fontSize:12,color:C.muted}}>New bookings per month</span>
                      <span style={{fontSize:13,fontWeight:700,color:C.gold,fontFamily:"DM Mono,monospace"}}>{forecastNewPerMonth}</span>
                    </div>
                    <input type="range" min={0} max={80} value={forecastNewPerMonth} onChange={e=>setForecastNewPerMonth(+e.target.value)} style={{width:"100%",accentColor:C.gold}}/>
                    <p style={{fontSize:10,color:C.muted,marginTop:2}}>New contracts signed per month beyond confirmed</p>
                  </div>
                  <div style={{flex:"1 1 200px"}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                      <span style={{fontSize:12,color:C.muted}}>Sales cycle</span>
                      <div style={{display:"flex",alignItems:"center",gap:4}}>
                        <input type="number" min={0} max={90} value={salesCycleDays} onChange={e=>{const v=Math.max(0,Math.min(90,+e.target.value||0));setSalesCycleDays(v);}} style={{width:48,fontSize:13,fontWeight:700,color:C.blue,fontFamily:"DM Mono,monospace",background:C.card,border:`1px solid ${C.border}`,borderRadius:4,padding:"2px 6px",textAlign:"right",outline:"none"}}/>
                        <span style={{fontSize:12,color:C.muted}}>days</span>
                      </div>
                    </div>
                    <input type="range" min={0} max={90} value={salesCycleDays} onChange={e=>setSalesCycleDays(+e.target.value)} style={{width:"100%",accentColor:C.blue}}/>
                    <p style={{fontSize:10,color:C.muted,marginTop:2}}>Days from booking to move-in (avg 47d current · target 30d)</p>
                  </div>
                  <div style={{flex:"1 1 200px"}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                      <span style={{fontSize:12,color:C.muted}}>Rooms offline (maintenance)</span>
                      <div style={{display:"flex",alignItems:"center",gap:4}}>
                        <input type="number" min={0} max={50} value={offlineRooms} onChange={e=>{const v=Math.max(0,Math.min(50,+e.target.value||0));setOfflineRooms(v);}} style={{width:48,fontSize:13,fontWeight:700,color:C.rose,fontFamily:"DM Mono,monospace",background:C.card,border:`1px solid ${C.border}`,borderRadius:4,padding:"2px 6px",textAlign:"right",outline:"none"}}/>
                        <span style={{fontSize:12,color:C.muted}}>rooms</span>
                      </div>
                    </div>
                    <input type="range" min={0} max={50} value={offlineRooms} onChange={e=>setOfflineRooms(+e.target.value)} style={{width:"100%",accentColor:C.rose}}/>
                    <p style={{fontSize:10,color:C.muted,marginTop:2}}>Usable: {BEDS - offlineRooms} rooms · 95% target: {Math.ceil((BEDS - offlineRooms) * 0.95)} rooms</p>
                  </div>
                </div>

                {/* Predicted occupancy table + bars — computed once, used by both */}
                {(() => {
                  // ── PREDICTION MODEL (COHORT-BASED) ──
                  // Every new booking / renewal enters as a cohort with a length-of-stay
                  // drawn from the real LoS distribution observed in the last 12 months
                  // of Res Harmonics data (short / medium / long / annual). Each cohort
                  // contributes days month-by-month until its average LoS is used up —
                  // so short-stay guests naturally churn out while annual cohorts persist.
                  //
                  // Fixed LoS mix per business rules — Res Harmonics live data is
                  // unreliable for length-of-stay (mixes renewals, room moves, etc.),
                  // so we use the agreed mix as the source of truth:
                  //   30-day  bookings → 15%
                  //   90-day  bookings → 30%
                  //   180-day bookings → 20%
                  //   365-day bookings → 35%
                  const LOS_MIX = {
                    short:  { share: 0.15, avgDays: 30  },
                    medium: { share: 0.30, avgDays: 90  },
                    long:   { share: 0.20, avgDays: 180 },
                    annual: { share: 0.35, avgDays: 365 },
                  };
                  const losMix = losOverride || LOS_MIX;

                  // Sales cycle: new bookings take X days before moving in
                  const moveInDelay = Math.floor(salesCycleDays / 30);
                  const partialOffset = salesCycleDays % 30;

                  const predRows = [];
                  // Active cohorts from previous months: { size, remainingDays }
                  const activeCohorts = [];

                  // Determine which month index is "current" (the one matching today)
                  const todayKey = `${new Date().getFullYear()}-${String(new Date().getMonth()+1).padStart(2,'0')}`;
                  const currentMonthFcIdx = pmsData.forecast.findIndex(f => f.key === todayKey);
                  const firstFutureIdx = currentMonthFcIdx >= 0 ? currentMonthFcIdx + 1 : pmsData.forecast.length;

                  for (let i = 0; i < pmsData.forecast.length; i++) {
                    const fm = pmsData.forecast[i];
                    const actualDays = fm.bookedDays || 0;
                    const totalDays = fm.totalBookableDays || (BEDS * 30);
                    const dim = fm.daysInMonth || 30;
                    const confirmedRooms = fm.activeStays || 0;
                    const isPastOrCurrent = i <= (currentMonthFcIdx >= 0 ? currentMonthFcIdx : 0);

                    if (isPastOrCurrent) {
                      const USABLE_PR = BEDS - offlineRooms;
                      const pct = USABLE_PR > 0 ? Math.round((confirmedRooms / USABLE_PR) * 100) : 0;
                      predRows.push({ ...fm, renewalCount: 0, newBooked: 0, newMoveIns: 0, carryoverRooms: 0, carryoverDays: 0, leavingFromCohorts: 0, predictedDays: actualDays, predictedPct: pct, actualPct: pct, confirmedRooms, predictedRooms: confirmedRooms, isPast: i < (currentMonthFcIdx >= 0 ? currentMonthFcIdx : 0), isCurrent: i === (currentMonthFcIdx >= 0 ? currentMonthFcIdx : 0) });
                      continue;
                    }

                    // Step 1: roll forward existing cohorts a full month each.
                    // A cohort with remainingDays >= dim survives into next month; otherwise it expires.
                    let carryoverDays = 0;
                    let carryoverRooms = 0;
                    let leavingFromCohorts = 0;
                    const surviving = [];
                    for (const c of activeCohorts) {
                      const take = Math.min(c.remainingDays, dim);
                      carryoverDays += c.size * take;
                      if (c.remainingDays > dim) {
                        surviving.push({ size: c.size, remainingDays: c.remainingDays - dim });
                        carryoverRooms += c.size;
                      } else {
                        leavingFromCohorts += c.size;
                      }
                    }

                    // Step 2: this month's renewals (immediate) and new move-ins
                    const leaving = fm.checkOuts || 0;
                    const renewalCount = Math.round(leaving * forecastRenewalRate / 100);
                    const bookedMonthAgo = i - moveInDelay;
                    const newMoveIns = bookedMonthAgo >= 1 ? forecastNewPerMonth : 0;

                    // Step 3: split new entrants into LoS cohorts and add their first-month days
                    const newCohorts = [];
                    const addCohort = (count, firstMonthDays) => {
                      if (count <= 0 || firstMonthDays <= 0) return 0;
                      let daysAdded = 0;
                      for (const key of ["short","medium","long","annual"]) {
                        const band = losMix[key];
                        if (!band || band.share <= 0) continue;
                        const size = count * band.share;
                        const firstDays = Math.min(band.avgDays, firstMonthDays);
                        daysAdded += size * firstDays;
                        const remaining = band.avgDays - firstDays;
                        if (remaining > 0) {
                          newCohorts.push({ size, remainingDays: remaining });
                        }
                      }
                      return daysAdded;
                    };
                    // Renewals: on average they "switch" mid-month → ~half month of extra days
                    const renewalDays = addCohort(renewalCount, Math.round(dim / 2));
                    // New move-ins: arrive partialOffset days into the month
                    const newMoveInDays = addCohort(newMoveIns, Math.max(0, dim - partialOffset));

                    const USABLE = BEDS - offlineRooms;
                    const predictedDays = Math.min(totalDays, actualDays + carryoverDays + renewalDays + newMoveInDays);
                    const predictedRooms = Math.min(USABLE, Math.round(confirmedRooms + carryoverRooms + renewalCount + newMoveIns));
                    const predictedPct = USABLE > 0 ? Math.round((predictedRooms / USABLE) * 100) : 0;
                    const actualPct = USABLE > 0 ? Math.round((confirmedRooms / USABLE) * 100) : 0;

                    predRows.push({ ...fm, renewalCount, newBooked: forecastNewPerMonth, newMoveIns, carryoverRooms, carryoverDays, leavingFromCohorts, predictedDays, predictedPct, actualPct, confirmedRooms, predictedRooms });

                    // Commit surviving + new cohorts for next month
                    activeCohorts.length = 0;
                    activeCohorts.push(...surviving, ...newCohorts);
                  }

                  // ── 95% Occupancy Target Date — derived from predRows (single source of truth) ──
                  const USABLE_T = BEDS - offlineRooms; // dynamically adjustable
                  const TARGET_95 = Math.ceil(USABLE_T * 0.95);
                  // Find which month in predRows first hits TARGET_95
                  let targetHitMonth = null;
                  for (let i = 0; i < predRows.length; i++) {
                    if (predRows[i].predictedRooms >= TARGET_95 && !targetHitMonth) {
                      targetHitMonth = { month: predRows[i].label, index: i };
                    }
                  }
                  const startRooms = predRows.length > 0 ? predRows[0].predictedRooms : 0;
                  const avgLosWeighted = Object.values(losMix).reduce((s, b) => s + b.share * b.avgDays, 0);
                  const avgTurnoverPerMonth = Math.round(TARGET_95 / (avgLosWeighted / 30));
                  const churnPerMonth = Math.round(avgTurnoverPerMonth * (1 - forecastRenewalRate / 100));

                  return (<>
                {/* ── 95% OCCUPANCY TARGET BANNER ── */}
                <div style={{background:C.card,border:`1px solid ${targetHitMonth?C.sage:C.gold}44`,borderRadius:14,padding:18,marginBottom:16}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                    <div>
                      <p style={{fontSize:11,color:targetHitMonth?C.sage:C.gold,textTransform:"uppercase",letterSpacing:"0.1em",fontWeight:700}}>95% Occupancy Target · {TARGET_95} / {USABLE_T} usable rooms</p>
                      <p style={{fontSize:12,color:C.muted,marginTop:2}}>{offlineRooms} rooms offline · {USABLE_T} occupiable · 95% = {TARGET_95} rooms</p>
                    </div>
                    <span style={{fontSize:10,color:C.sage,fontWeight:600}}>● LIVE MODEL</span>
                  </div>
                  <div style={{display:"flex",gap:14,flexWrap:"wrap",marginBottom:16}}>
                    <div style={{flex:"1 1 180px",background:C.bg,borderRadius:12,padding:16,border:`1px solid ${C.border}`}}>
                      <p style={{fontSize:10,color:C.muted,marginBottom:4}}>Target hit date</p>
                      <p style={{fontSize:24,fontWeight:700,color:targetHitMonth?C.sage:C.rose,fontFamily:"DM Mono,monospace"}}>{targetHitMonth?targetHitMonth.month:"Beyond forecast"}</p>
                      <p style={{fontSize:10,color:C.muted,marginTop:4}}>{targetHitMonth?`Month ${targetHitMonth.index} of forecast`:"Adjust inputs to reach target"}</p>
                    </div>
                    <div style={{flex:"1 1 180px",background:C.bg,borderRadius:12,padding:16,border:`1px solid ${C.border}`}}>
                      <p style={{fontSize:10,color:C.muted,marginBottom:4}}>Current → Target</p>
                      <p style={{fontSize:24,fontWeight:700,color:C.blue,fontFamily:"DM Mono,monospace"}}>{startRooms} → {TARGET_95}</p>
                      <p style={{fontSize:10,color:C.muted,marginTop:4}}>{Math.max(0, TARGET_95-startRooms)} rooms still needed</p>
                    </div>
                    <div style={{flex:"1 1 180px",background:C.bg,borderRadius:12,padding:16,border:`1px solid ${C.border}`}}>
                      <p style={{fontSize:10,color:C.muted,marginBottom:4}}>Bookings to sustain 95%</p>
                      <p style={{fontSize:24,fontWeight:700,color:C.gold,fontFamily:"DM Mono,monospace"}}>{churnPerMonth}/month</p>
                      <p style={{fontSize:10,color:C.muted,marginTop:4}}>New sales needed after renewals ({forecastRenewalRate}%)</p>
                    </div>
                    <div style={{flex:"1 1 180px",background:C.bg,borderRadius:12,padding:16,border:`1px solid ${C.border}`}}>
                      <p style={{fontSize:10,color:C.muted,marginBottom:4}}>Avg weighted LoS</p>
                      <p style={{fontSize:24,fontWeight:700,color:C.purple,fontFamily:"DM Mono,monospace"}}>{Math.round(avgLosWeighted)}d</p>
                      <p style={{fontSize:10,color:C.muted,marginTop:4}}>Blended from target mix</p>
                    </div>
                  </div>
                  {/* Mini trajectory chart from predRows */}
                  <div style={{display:"flex",alignItems:"flex-end",gap:2,height:80,marginBottom:8}}>
                    {predRows.map((pr, i) => {
                      const pct = USABLE_T > 0 ? (pr.predictedRooms / USABLE_T) * 100 : 0;
                      const hit = pr.predictedRooms >= TARGET_95;
                      return <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:2}}>
                        <div style={{width:"100%",background:hit?C.sage:pct>=70?C.gold:C.rose,borderRadius:2,height:`${Math.max(4, pct*0.75)}px`,transition:"height 0.3s"}}/>
                        <span style={{fontSize:8,color:C.muted,writingMode:"vertical-rl",transform:"rotate(180deg)",maxHeight:40,overflow:"hidden"}}>{(pr.label||"").split(" ")[0]}</span>
                      </div>;
                    })}
                  </div>
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:C.muted}}>
                    <span>Now: {startRooms} rooms ({Math.round(startRooms/USABLE_T*100)}%)</span>
                    <span style={{color:C.sage}}>■ ≥95% target ({TARGET_95} rooms)</span>
                  </div>
                </div>

                <div style={{overflowX:"auto"}}>
                  <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                    <thead>
                      <tr style={{borderBottom:`1px solid ${C.border}`}}>
                        <th style={{textAlign:"left",padding:"8px 10px",color:C.muted,fontWeight:600,fontSize:10,textTransform:"uppercase"}}>Month</th>
                        <th style={{textAlign:"right",padding:"8px 10px",color:C.muted,fontWeight:600,fontSize:10,textTransform:"uppercase"}}>Confirmed Days</th>
                        <th style={{textAlign:"right",padding:"8px 10px",color:C.muted,fontWeight:600,fontSize:10,textTransform:"uppercase"}}>Leaving</th>
                        <th style={{textAlign:"right",padding:"8px 10px",color:C.muted,fontWeight:600,fontSize:10,textTransform:"uppercase"}}>Renewals</th>
                        <th style={{textAlign:"right",padding:"8px 10px",color:C.muted,fontWeight:600,fontSize:10,textTransform:"uppercase"}}>+ Booked</th>
                        <th style={{textAlign:"right",padding:"8px 10px",color:C.muted,fontWeight:600,fontSize:10,textTransform:"uppercase"}}>Move-ins</th>
                        <th style={{textAlign:"right",padding:"8px 10px",color:C.muted,fontWeight:600,fontSize:10,textTransform:"uppercase"}}>Carryover</th>
                        <th style={{textAlign:"right",padding:"8px 10px",color:C.muted,fontWeight:600,fontSize:10,textTransform:"uppercase"}}>Predicted Days</th>
                        <th style={{textAlign:"right",padding:"8px 10px",color:C.muted,fontWeight:600,fontSize:10,textTransform:"uppercase"}}>Rooms / {BEDS - offlineRooms}</th>
                        <th style={{textAlign:"right",padding:"8px 10px",color:C.muted,fontWeight:600,fontSize:10,textTransform:"uppercase"}}>Predicted Occ.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {predRows.map((r, i) => (
                        <tr key={r.key||i} style={{borderBottom:`1px solid ${C.border}`,background:r.isCurrent?C.gold+"0a":r.isPast?C.bg+"88":"transparent"}}>
                          <td style={{padding:"8px 10px",color:r.isCurrent||r.isPast?C.text:C.muted,fontWeight:r.isCurrent?700:400}}>{r.label}{r.isCurrent?" (current)":r.isPast?" (actual)":""}</td>
                          <td style={{padding:"8px 10px",textAlign:"right",fontFamily:"DM Mono,monospace",color:C.text}}>{(r.bookedDays||0).toLocaleString()} <span style={{color:C.muted,fontSize:10}}>/ {(r.totalBookableDays||0).toLocaleString()}</span></td>
                          <td style={{padding:"8px 10px",textAlign:"right",fontFamily:"DM Mono,monospace",color:C.rose}}>{r.checkOuts||0}</td>
                          <td style={{padding:"8px 10px",textAlign:"right",fontFamily:"DM Mono,monospace",color:C.sage}}>{(r.isPast||r.isCurrent)?"-":r.renewalCount}</td>
                          <td style={{padding:"8px 10px",textAlign:"right",fontFamily:"DM Mono,monospace",color:C.gold}}>{(r.isPast||r.isCurrent)?"-":`+${r.newBooked}`}</td>
                          <td style={{padding:"8px 10px",textAlign:"right",fontFamily:"DM Mono,monospace",color:r.newMoveIns>0?C.blue:C.muted}}>{(r.isPast||r.isCurrent)?"-":r.newMoveIns>0?`+${r.newMoveIns}`:<span style={{fontSize:9}}>({salesCycleDays}d wait)</span>}</td>
                          <td style={{padding:"8px 10px",textAlign:"right",fontFamily:"DM Mono,monospace",color:C.purple}}>{(r.isPast||r.isCurrent)?"-":r.carryoverRooms>0?`+${Math.round(r.carryoverRooms)}${r.leavingFromCohorts>0?` / -${Math.round(r.leavingFromCohorts)}`:""}`:"-"}</td>
                          <td style={{padding:"8px 10px",textAlign:"right",fontFamily:"DM Mono,monospace",color:C.text,fontWeight:600}}>{Math.round(r.predictedDays).toLocaleString()}</td>
                          <td style={{padding:"8px 10px",textAlign:"right",fontFamily:"DM Mono,monospace",color:C.text}}>
                            <span style={{fontWeight:700}}>{Math.round(r.predictedRooms)}</span>
                            <span style={{color:C.muted,fontWeight:400}}> / {BEDS - offlineRooms}</span>
                            {!r.isPast && !r.isCurrent && r.predictedRooms !== r.confirmedRooms && (
                              <span style={{fontSize:9,color:C.muted,marginLeft:4}}>({r.confirmedRooms} confirmed)</span>
                            )}
                          </td>
                          <td style={{padding:"8px 10px",textAlign:"right",fontFamily:"DM Mono,monospace",fontWeight:700,color:r.predictedPct>=90?C.sage:r.predictedPct>=70?C.gold:C.rose}}>
                            {r.predictedPct}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Predicted bar chart — shows both actual (solid) and predicted (striped overlay) */}
                <div style={{display:"flex",gap:8,alignItems:"flex-end",height:140,marginTop:16,padding:"0 4px"}}>
                  {predRows.map((r, i) => {
                    const actualPct = Math.min(r.actualPct, 100);
                    const predPct = Math.min(r.predictedPct, 100);
                    const barColor = predPct >= 90 ? C.sage : predPct >= 70 ? C.gold : C.rose;
                    const actualColor = actualPct >= 90 ? C.sage : actualPct >= 70 ? C.gold : C.rose;
                    return (
                      <div key={r.key} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
                        <span style={{fontSize:11,fontWeight:700,color:barColor,fontFamily:"DM Mono,monospace"}}>{r.predictedPct}%</span>
                        {i > 0 && r.predictedPct !== r.actualPct && (
                          <span style={{fontSize:9,color:C.muted}}>({r.actualPct}% confirmed)</span>
                        )}
                        <div style={{width:"100%",maxWidth:60,background:C.border,borderRadius:6,height:90,position:"relative",overflow:"hidden",display:"flex",alignItems:"flex-end"}}>
                          {/* Predicted (striped, behind) */}
                          <div style={{position:"absolute",bottom:0,width:"100%",height:`${predPct}%`,background:`repeating-linear-gradient(45deg,${barColor}44,${barColor}44 3px,${barColor}22 3px,${barColor}22 6px)`,borderRadius:6,transition:"height 0.4s"}}/>
                          {/* Actual (solid, front) */}
                          <div style={{position:"relative",width:"100%",height:`${actualPct}%`,background:actualColor,borderRadius:6,transition:"height 0.4s"}}/>
                        </div>
                        <span style={{fontSize:10,color:i===0?C.text:C.muted,fontWeight:i===0?700:400}}>{r.label}</span>
                      </div>
                    );
                  })}
                </div>
                <div style={{display:"flex",gap:16,justifyContent:"center",marginTop:8}}>
                  <span style={{fontSize:10,color:C.muted}}>■ Solid = confirmed bookings</span>
                  <span style={{fontSize:10,color:C.muted}}>▧ Striped = predicted (renewals + new)</span>
                </div>

                {/* ── PREDICTIVE REVENUE MODEL ── */}
                {(() => {
                  const liveAwr = pmsData?.awrByStatus?.all?.awr || pmsData?.globalAwr || 279;
                  const liveAwrGross = pmsData?.awrByStatus?.all?.awrGross || Math.round(liveAwr * 1.07);
                  const useAwr = forecastAwrOverride ?? liveAwr;
                  const useAwrGross = forecastAwrOverride ? Math.round(forecastAwrOverride * 1.07) : liveAwrGross;
                  const USABLE_REV = BEDS - offlineRooms;

                  // Build revenue rows from predRows — with per-month occupancy overrides
                  const revRows = predRows.map((pr, i) => {
                    const dim = pr.daysInMonth || 30;
                    const confirmedRooms = pr.confirmedRooms || 0;
                    const modelPredictedRooms = pr.predictedRooms || 0;

                    // Model occupancy % (what the prediction engine computed)
                    const modelOccPct = USABLE_REV > 0 ? Math.round((modelPredictedRooms / USABLE_REV) * 100) : 0;

                    // Effective occupancy: use override if set, else model prediction
                    const occOverride = occupancyOverrides[i];
                    const useOccPct = occOverride != null ? occOverride : modelOccPct;
                    const effectiveRooms = occOverride != null ? Math.round(USABLE_REV * occOverride / 100) : modelPredictedRooms;

                    const newRooms = Math.max(0, effectiveRooms - confirmedRooms);
                    const confirmedRevNet = Math.round(confirmedRooms * useAwr * (dim / 7));
                    const confirmedRevGross = Math.round(confirmedRooms * useAwrGross * (dim / 7));
                    const newRevNet = Math.round(newRooms * useAwr * (dim / 7));
                    const newRevGross = Math.round(newRooms * useAwrGross * (dim / 7));
                    const totalRevNet = confirmedRevNet + newRevNet;
                    const totalRevGross = confirmedRevGross + newRevGross;
                    return {
                      label: pr.label, confirmedRooms, modelPredictedRooms, effectiveRooms, newRooms,
                      modelOccPct, useOccPct, isOverridden: occOverride != null,
                      confirmedRevNet, confirmedRevGross, newRevNet, newRevGross,
                      totalRevNet, totalRevGross, isActual: pr.isPast || pr.isCurrent, isCurrent: pr.isCurrent, isPast: pr.isPast,
                    };
                  });
                  const totalPredRevNet = revRows.reduce((s, r) => s + r.totalRevNet, 0);
                  const totalPredRevGross = revRows.reduce((s, r) => s + r.totalRevGross, 0);
                  const totalConfRevNet = revRows.reduce((s, r) => s + r.confirmedRevNet, 0);
                  const totalNewRevNet = revRows.reduce((s, r) => s + r.newRevNet, 0);
                  const avgMonthlyNet = revRows.length > 0 ? Math.round(totalPredRevNet / revRows.length) : 0;
                  const avgOccPct = revRows.length > 0 ? Math.round(revRows.reduce((s, r) => s + r.useOccPct, 0) / revRows.length) : 0;
                  // At full 95% occupancy monthly revenue
                  const full95Net = Math.round(TARGET_95 * useAwr * (30 / 7));
                  const full95Gross = Math.round(TARGET_95 * useAwrGross * (30 / 7));
                  const hasAnyOccOverride = Object.keys(occupancyOverrides).length > 0;

                  return (
                    <div style={{marginTop:18,background:C.card,border:`1px solid ${C.gold}44`,borderRadius:14,padding:18}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                        <div>
                          <p style={{fontSize:11,color:C.gold,textTransform:"uppercase",letterSpacing:"0.1em",fontWeight:700}}>Predictive Revenue Model</p>
                          <p style={{fontSize:12,color:C.muted,marginTop:2}}>Editable occupancy × AWR · live from Res Harmonics · adjust per month to model scenarios</p>
                        </div>
                        <span style={{fontSize:10,color:C.sage,fontWeight:600}}>● LIVE</span>
                      </div>

                      {/* Controls row: AWR + 95% target + avg predicted */}
                      <div style={{display:"flex",gap:14,flexWrap:"wrap",marginBottom:16,alignItems:"flex-end"}}>
                        <div style={{flex:"1 1 280px",background:C.bg,borderRadius:12,padding:14,border:`1px solid ${C.border}`}}>
                          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                            <span style={{fontSize:12,color:C.muted}}>AWR (net, ex-VAT)</span>
                            <div style={{display:"flex",alignItems:"center",gap:6}}>
                              <span style={{fontSize:10,color:C.muted}}>£</span>
                              <input type="number" min={100} max={600} value={useAwr}
                                onChange={e=>{const v=Math.max(100,Math.min(600,+e.target.value||0));setForecastAwrOverride(v);}}
                                style={{width:64,fontSize:14,fontWeight:700,color:C.gold,fontFamily:"DM Mono,monospace",background:C.card,border:`1px solid ${C.border}`,borderRadius:4,padding:"3px 6px",textAlign:"right",outline:"none"}}/>
                              <span style={{fontSize:10,color:C.muted}}>/week</span>
                            </div>
                          </div>
                          <input type="range" min={100} max={600} value={useAwr}
                            onChange={e=>setForecastAwrOverride(+e.target.value)}
                            style={{width:"100%",accentColor:C.gold}}/>
                          <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:C.muted,marginTop:4}}>
                            <span>Live from RH: £{liveAwr}/wk net · £{liveAwrGross}/wk gross</span>
                            {forecastAwrOverride && <button onClick={()=>setForecastAwrOverride(null)}
                              style={{background:"none",border:"none",color:C.blue,cursor:"pointer",fontSize:10,padding:0}}>Reset to live</button>}
                          </div>
                        </div>
                        <div style={{flex:"1 1 180px",background:C.bg,borderRadius:12,padding:14,border:`1px solid ${C.border}`}}>
                          <p style={{fontSize:10,color:C.muted,marginBottom:4}}>At 95% occupancy ({TARGET_95} rooms)</p>
                          <p style={{fontSize:20,fontWeight:700,color:C.sage,fontFamily:"DM Mono,monospace"}}>£{full95Net.toLocaleString()}<span style={{fontSize:12,color:C.muted,fontWeight:400}}>/mo net</span></p>
                          <p style={{fontSize:13,color:C.muted,fontFamily:"DM Mono,monospace",marginTop:2}}>£{full95Gross.toLocaleString()}<span style={{fontSize:11}}>/mo gross</span></p>
                        </div>
                        <div style={{flex:"1 1 180px",background:C.bg,borderRadius:12,padding:14,border:`1px solid ${C.border}`}}>
                          <p style={{fontSize:10,color:C.muted,marginBottom:4}}>Avg predicted monthly (net)</p>
                          <p style={{fontSize:20,fontWeight:700,color:C.blue,fontFamily:"DM Mono,monospace"}}>£{avgMonthlyNet.toLocaleString()}</p>
                          <p style={{fontSize:10,color:C.muted,marginTop:4}}>Avg occupancy: {avgOccPct}% · {revRows.length} months</p>
                        </div>
                      </div>

                      {/* Revenue chart */}
                      <div style={{display:"flex",alignItems:"flex-end",gap:3,height:120,marginBottom:12}}>
                        {revRows.map((r, i) => {
                          const maxRev = Math.max(...revRows.map(x=>x.totalRevNet), 1);
                          const confH = (r.confirmedRevNet / maxRev) * 100;
                          const newH = (r.newRevNet / maxRev) * 100;
                          return <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:1}}>
                            <span style={{fontSize:9,color:C.text,fontFamily:"DM Mono,monospace",fontWeight:600}}>£{Math.round(r.totalRevNet/1000)}k</span>
                            <div style={{width:"100%",display:"flex",flexDirection:"column",justifyContent:"flex-end",height:90}}>
                              <div style={{width:"100%",background:C.blue+"66",borderRadius:"2px 2px 0 0",height:`${newH}%`}} title={`New: £${r.newRevNet.toLocaleString()}`}/>
                              <div style={{width:"100%",background:C.sage,borderRadius:newH>0?"0":"2px 2px 0 0",height:`${confH}%`}} title={`Confirmed: £${r.confirmedRevNet.toLocaleString()}`}/>
                            </div>
                            <span style={{fontSize:9,color:C.muted,marginTop:2}}>{(r.label||"").split(" ")[0]}</span>
                          </div>;
                        })}
                      </div>
                      <div style={{display:"flex",gap:16,fontSize:10,color:C.muted,marginBottom:14}}>
                        <span style={{display:"flex",alignItems:"center",gap:4}}><span style={{width:10,height:10,borderRadius:2,background:C.sage}}/> Confirmed revenue</span>
                        <span style={{display:"flex",alignItems:"center",gap:4}}><span style={{width:10,height:10,borderRadius:2,background:C.blue+"66"}}/> Predicted new revenue</span>
                        {hasAnyOccOverride && <button onClick={()=>setOccupancyOverrides({})}
                          style={{background:"none",border:"none",color:C.blue,cursor:"pointer",fontSize:10,padding:0,marginLeft:"auto"}}>Reset all occupancy overrides</button>}
                      </div>

                      {/* Revenue table with editable occupancy */}
                      <div style={{overflowX:"auto"}}>
                        <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                          <thead>
                            <tr style={{borderBottom:`1px solid ${C.border}`}}>
                              <th style={{textAlign:"left",padding:"8px 10px",color:C.muted,fontWeight:600,fontSize:10,textTransform:"uppercase"}}>Month</th>
                              <th style={{textAlign:"center",padding:"8px 10px",color:C.gold,fontWeight:600,fontSize:10,textTransform:"uppercase"}}>Occupancy %</th>
                              <th style={{textAlign:"right",padding:"8px 10px",color:C.muted,fontWeight:600,fontSize:10,textTransform:"uppercase"}}>Confirmed</th>
                              <th style={{textAlign:"right",padding:"8px 10px",color:C.muted,fontWeight:600,fontSize:10,textTransform:"uppercase"}}>Predicted</th>
                              <th style={{textAlign:"right",padding:"8px 10px",color:C.muted,fontWeight:600,fontSize:10,textTransform:"uppercase"}}>Conf Rev (net)</th>
                              <th style={{textAlign:"right",padding:"8px 10px",color:C.muted,fontWeight:600,fontSize:10,textTransform:"uppercase"}}>New Rev (net)</th>
                              <th style={{textAlign:"right",padding:"8px 10px",color:C.muted,fontWeight:600,fontSize:10,textTransform:"uppercase"}}>Total Rev (net)</th>
                              <th style={{textAlign:"right",padding:"8px 10px",color:C.muted,fontWeight:600,fontSize:10,textTransform:"uppercase"}}>Total Rev (gross)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {revRows.map((r, i) => (
                              <tr key={i} style={{borderBottom:`1px solid ${C.border}`,background:r.isCurrent?C.gold+"0a":r.isPast?C.bg+"88":"transparent"}}>
                                <td style={{padding:"8px 10px",color:r.isActual?C.text:C.muted,fontWeight:r.isCurrent?700:400,whiteSpace:"nowrap"}}>{r.label}{r.isCurrent?" (current)":r.isPast?" (actual)":""}</td>
                                <td style={{padding:"4px 6px",textAlign:"center"}}>
                                  <div style={{display:"flex",alignItems:"center",gap:4,justifyContent:"center"}}>
                                    <input type="number" min={0} max={100}
                                      value={r.useOccPct}
                                      onChange={e=>{const v=Math.max(0,Math.min(100,+e.target.value||0));setOccupancyOverrides(prev=>({...prev,[i]:v}));}}
                                      style={{width:42,fontSize:12,fontWeight:700,color:r.isOverridden?C.gold:C.text,fontFamily:"DM Mono,monospace",background:r.isOverridden?C.gold+"12":"transparent",border:`1px solid ${r.isOverridden?C.gold+"66":C.border}`,borderRadius:4,padding:"2px 4px",textAlign:"right",outline:"none"}}/>
                                    <span style={{fontSize:10,color:C.muted}}>%</span>
                                    {r.isOverridden && <button onClick={()=>setOccupancyOverrides(prev=>{const n={...prev};delete n[i];return n;})}
                                      style={{background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:9,padding:0}} title="Reset to model">✕</button>}
                                  </div>
                                </td>
                                <td style={{padding:"8px 10px",textAlign:"right",fontFamily:"DM Mono,monospace",color:C.text}}>{r.confirmedRooms}</td>
                                <td style={{padding:"8px 10px",textAlign:"right",fontFamily:"DM Mono,monospace",color:r.isOverridden?C.gold:C.blue,fontWeight:600}}>{Math.round(r.effectiveRooms)}</td>
                                <td style={{padding:"8px 10px",textAlign:"right",fontFamily:"DM Mono,monospace",color:C.sage}}>£{r.confirmedRevNet.toLocaleString()}</td>
                                <td style={{padding:"8px 10px",textAlign:"right",fontFamily:"DM Mono,monospace",color:r.newRevNet>0?C.blue:C.muted}}>{r.newRevNet>0?`+£${r.newRevNet.toLocaleString()}`:"—"}</td>
                                <td style={{padding:"8px 10px",textAlign:"right",fontFamily:"DM Mono,monospace",color:C.text,fontWeight:700}}>£{r.totalRevNet.toLocaleString()}</td>
                                <td style={{padding:"8px 10px",textAlign:"right",fontFamily:"DM Mono,monospace",color:C.muted}}>£{r.totalRevGross.toLocaleString()}</td>
                              </tr>
                            ))}
                            <tr style={{borderTop:`2px solid ${C.gold}44`,background:C.gold+"08",fontWeight:700}}>
                              <td style={{padding:"10px 10px",color:C.gold,fontSize:13}}>Annual Total</td>
                              <td style={{padding:"10px 10px",textAlign:"center",fontFamily:"DM Mono,monospace",fontSize:11,color:C.gold}}>{avgOccPct}% avg</td>
                              <td style={{padding:"10px 10px"}}/>
                              <td style={{padding:"10px 10px"}}/>
                              <td style={{padding:"10px 10px",textAlign:"right",fontFamily:"DM Mono,monospace",color:C.sage,fontSize:13}}>£{totalConfRevNet.toLocaleString()}</td>
                              <td style={{padding:"10px 10px",textAlign:"right",fontFamily:"DM Mono,monospace",color:C.blue,fontSize:13}}>+£{totalNewRevNet.toLocaleString()}</td>
                              <td style={{padding:"10px 10px",textAlign:"right",fontFamily:"DM Mono,monospace",color:C.gold,fontSize:14}}>£{totalPredRevNet.toLocaleString()}</td>
                              <td style={{padding:"10px 10px",textAlign:"right",fontFamily:"DM Mono,monospace",color:C.muted,fontSize:13}}>£{totalPredRevGross.toLocaleString()}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })()}

                  </>);
                })()}
              </div>
            )}

            {/* ── SECTION A: Room Type Occupancy — Month by Month ── */}
            {pmsConn && pmsData?.roomTypeData && (
              <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:18,marginTop:18,marginBottom:18}}>
                <h3 style={{fontSize:14,fontWeight:700,color:C.text,marginBottom:14}}>Room Type Occupancy — Month by Month</h3>
                <div style={{overflowX:"auto"}}>
                  <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                    <thead>
                      <tr style={{borderBottom:`1px solid ${C.border}`}}>
                        <th style={{textAlign:"left",padding:"8px 12px",color:C.muted,fontWeight:600}}>Room Type</th>
                        {pmsData.forecast.map((fm, i) => (
                          <th key={fm.key} style={{textAlign:"center",padding:"8px 6px",color:C.muted,fontWeight:600,fontSize:11}}>{fm.label}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {ROOM_TYPES.map((rt, idx) => {
                        const data = pmsData.roomTypeData[rt];
                        if (!data || data.totalUnits === 0) return null;
                        return (
                          <tr key={rt} style={{borderBottom:`1px solid ${C.border}`}}>
                            <td style={{padding:"10px 12px",color:C.text,fontWeight:600,fontSize:12}}>
                              {rt} <span style={{color:C.muted,fontWeight:400}}>({data.totalUnits})</span>
                            </td>
                            {data.months.map((m, mi) => {
                              const pct = m.occupancyPct ?? (m.totalDays > 0 ? Math.round((m.bookedDays / m.totalDays) * 100) : 0);
                              const occupiedColor = pct >= 90 ? C.sage : pct >= 70 ? C.gold : C.rose;
                              return (
                                <td key={mi} style={{textAlign:"center",padding:"10px 6px",fontFamily:"DM Mono,monospace",fontSize:11,color:occupiedColor,fontWeight:600}}>
                                  {pct}% <span style={{color:C.muted,fontWeight:400,fontSize:9}}>({(m.bookedDays||0)}/{(m.totalDays||0)}d)</span>
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                      <tr style={{borderTop:`1px solid ${C.border}`,background:C.bg}}>
                        <td style={{padding:"10px 12px",color:C.muted,fontWeight:600,fontSize:12}}>Available Rooms</td>
                        {(() => {
                          const available = Array(pmsData.forecast.length).fill(0);
                          ROOM_TYPES.forEach(rt => {
                            const data = pmsData.roomTypeData[rt];
                            if (data) {
                              data.months.forEach((m, mi) => {
                                available[mi] += m.available;
                              });
                            }
                          });
                          return available.map((avail, mi) => (
                            <td key={mi} style={{textAlign:"center",padding:"10px 6px",fontFamily:"DM Mono,monospace",fontSize:11,color:C.sage,fontWeight:600}}>
                              {avail}
                            </td>
                          ));
                        })()}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── SECTION B: Live Average Weekly Rate (AWR) ── */}
            {pmsConn && pmsData?.roomTypeData && (
              <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:18,marginBottom:18}}>
                <h3 style={{fontSize:14,fontWeight:700,color:C.text,marginBottom:14}}>Live Average Weekly Rate (AWR)</h3>
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(200px, 1fr))",gap:12,marginBottom:16}}>
                  {ROOM_TYPES.map((rt) => {
                    const data = pmsData.roomTypeData[rt];
                    if (!data || data.totalUnits === 0) return null;
                    const awr = data.awr;
                    const color = awr >= TARGET_RATE ? C.sage : awr >= 250 ? C.gold : C.rose;
                    return (
                      <div key={rt} style={{background:C.bg,border:`1px solid ${C.border}`,borderRadius:10,padding:12}}>
                        <p style={{fontSize:11,color:C.muted,marginBottom:4}}>{rt}</p>
                        <p style={{fontSize:20,fontWeight:700,color:color,fontFamily:"DM Mono,monospace",marginBottom:2}}>{fmt(awr)}</p>
                        <p style={{fontSize:10,color:awr >= TARGET_RATE ? C.sage : C.rose}}>
                          {awr >= TARGET_RATE ? "✓ Target met" : `£${TARGET_RATE - awr} below target`}
                        </p>
                      </div>
                    );
                  })}
                </div>
                <div style={{background:C.bg,border:`1px solid ${C.border}`,borderRadius:10,padding:12}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div>
                      <p style={{fontSize:11,color:C.muted,marginBottom:4}}>Blended AWR (28+ day bookings)</p>
                      <p style={{fontSize:24,fontWeight:700,color:C.text,fontFamily:"DM Mono,monospace"}}>
                        {fmt(pmsData.globalAwr || 0)}
                      </p>
                    </div>
                    <div style={{textAlign:"right"}}>
                      <p style={{fontSize:12,color:C.muted,marginBottom:4}}>Target: {fmt(TARGET_RATE)}</p>
                      <p style={{fontSize:18,fontWeight:700,color:(pmsData.globalAwr||0) >= TARGET_RATE ? C.sage : C.rose,fontFamily:"DM Mono,monospace"}}>
                        {(() => {
                          const diff = (pmsData.globalAwr||0) - TARGET_RATE;
                          return diff >= 0 ? `+${fmt(diff)}` : fmt(diff);
                        })()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── SECTION C: Rate Adjustment & Revenue Predictor ── */}
            {pmsConn && pmsData?.roomTypeData && (
              <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:18}}>
                <h3 style={{fontSize:14,fontWeight:700,color:C.text,marginBottom:14}}>Rate Adjustment & Revenue Predictor</h3>
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(280px, 1fr))",gap:16}}>
                  {ROOM_TYPES.map((rt) => {
                    const data = pmsData.roomTypeData[rt];
                    if (!data || data.totalUnits === 0) return null;

                    const currentAWR = data.awr || TARGET_RATE;
                    const adjustedRate = rateAdjustments[rt] ?? currentAWR;
                    const available = data.months[0]?.available ?? 0;

                    return (
                      <div key={rt} style={{background:C.bg,border:`1px solid ${C.border}`,borderRadius:10,padding:12}}>
                        <p style={{fontSize:11,color:C.muted,marginBottom:8,fontWeight:600}}>{rt}</p>
                        <p style={{fontSize:10,color:C.muted,marginBottom:4}}>Rate for unsold rooms</p>
                        <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:8}}>
                          <input
                            type="range"
                            min="150"
                            max="500"
                            step="5"
                            value={adjustedRate}
                            onChange={(e) => setRateAdjustments(prev => ({...prev, [rt]: parseInt(e.target.value)}))}
                            style={{flex:1}}
                          />
                          <span style={{fontSize:12,fontWeight:700,color:C.gold,fontFamily:"DM Mono,monospace",minWidth:"45px"}}>{fmt(adjustedRate)}</span>
                        </div>
                        <p style={{fontSize:9,color:C.muted,marginBottom:10}}>Current: {fmt(currentAWR)} | Gap: {fmt(Math.abs(adjustedRate - currentAWR))}</p>
                        <div style={{fontSize:10,color:C.muted,lineHeight:1.5}}>
                          <p>Booked: {data.months[0]?.booked ?? 0} rooms</p>
                          <p>Available: {available} rooms</p>
                          <p style={{marginTop:6,color:C.text,fontWeight:600}}>Predicted Monthly Revenue:</p>
                          <p style={{fontSize:14,fontWeight:700,color:C.gold,fontFamily:"DM Mono,monospace",marginTop:4}}>
                            {(() => {
                              const bookedRevenue = (data.months[0]?.booked ?? 0) * currentAWR * (52 / 12);
                              const availableRevenue = available * adjustedRate * (52 / 12) * 0.7; // 70% fill assumption
                              return fmt(bookedRevenue + availableRevenue);
                            })()}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* ── Blended AWR Projection over time ── */}
                <div style={{marginTop:20,background:C.bg,border:`1px solid ${C.border}`,borderRadius:12,padding:16}}>
                  <h4 style={{fontSize:13,fontWeight:700,color:C.text,marginBottom:4}}>Projected Blended AWR — Month by Month</h4>
                  <p style={{fontSize:10,color:C.muted,marginBottom:14}}>Shows how your rate adjustments affect overall AWR across all room types (70% fill on unsold rooms)</p>
                  {(() => {
                    const now = new Date();
                    const FILL_RATE = 0.7;
                    const monthProjections = [];

                    for (let m = 0; m < pmsData.forecast.length; m++) {
                      const d = new Date(now.getFullYear(), now.getMonth() + m, 1);
                      const label = d.toLocaleString("en-GB", { month: "short", year: "numeric" });
                      let totalWeightedAWR = 0;
                      let totalRooms = 0;

                      ROOM_TYPES.forEach(rt => {
                        const data = pmsData.roomTypeData[rt];
                        if (!data || data.totalUnits === 0) return;
                        const currentAWR = data.awr || 0;
                        const adjustedRate = rateAdjustments[rt] ?? currentAWR;
                        const booked = data.months[m]?.booked ?? 0;
                        const available = data.months[m]?.available ?? 0;
                        const newFill = Math.round(available * FILL_RATE);

                        // Booked rooms contribute at current AWR
                        totalWeightedAWR += booked * currentAWR;
                        totalRooms += booked;

                        // Unsold rooms that fill contribute at the adjusted rate
                        totalWeightedAWR += newFill * adjustedRate;
                        totalRooms += newFill;
                      });

                      const blended = totalRooms > 0 ? Math.round(totalWeightedAWR / totalRooms) : 0;
                      const occupiedRooms = totalRooms;
                      monthProjections.push({ label, blended, occupiedRooms, month: m });
                    }

                    const maxAWR = Math.max(TARGET_RATE + 20, ...monthProjections.map(p => p.blended));
                    const barH = 140;

                    return (
                      <>
                        {/* Bar chart */}
                        <div style={{display:"flex",gap:8,alignItems:"flex-end",justifyContent:"space-around",height:barH + 40,marginBottom:16,position:"relative"}}>
                          {/* Target line */}
                          <div style={{position:"absolute",bottom:barH * (TARGET_RATE / maxAWR) + 20,left:0,right:0,borderTop:`2px dashed ${C.rose}`,zIndex:1}}>
                            <span style={{position:"absolute",right:0,top:-16,fontSize:9,color:C.rose,fontFamily:"DM Mono,monospace"}}>Target £{TARGET_RATE}</span>
                          </div>
                          {monthProjections.map((p, i) => {
                            const h = Math.round(barH * (p.blended / maxAWR));
                            const meetTarget = p.blended >= TARGET_RATE;
                            return (
                              <div key={i} style={{display:"flex",flexDirection:"column",alignItems:"center",flex:1}}>
                                <span style={{fontSize:11,fontWeight:700,color:meetTarget ? C.sage : C.gold,fontFamily:"DM Mono,monospace",marginBottom:4}}>£{p.blended}</span>
                                <div style={{width:"60%",height:h,background:meetTarget ? `linear-gradient(to top, ${C.sage}66, ${C.sage}cc)` : `linear-gradient(to top, ${C.gold}44, ${C.gold}aa)`,borderRadius:"6px 6px 0 0",transition:"height 0.3s ease"}} />
                                <span style={{fontSize:9,color:C.muted,marginTop:6}}>{p.label}</span>
                                <span style={{fontSize:8,color:C.muted}}>{p.occupiedRooms} rooms</span>
                              </div>
                            );
                          })}
                        </div>

                        {/* Detail table */}
                        <table style={{width:"100%",fontSize:11,borderCollapse:"collapse"}}>
                          <thead>
                            <tr style={{borderBottom:`1px solid ${C.border}`}}>
                              <th style={{textAlign:"left",padding:"6px 8px",color:C.muted,fontWeight:500}}>Month</th>
                              <th style={{textAlign:"right",padding:"6px 8px",color:C.muted,fontWeight:500}}>Booked Rooms</th>
                              <th style={{textAlign:"right",padding:"6px 8px",color:C.muted,fontWeight:500}}>+ New Fill (70%)</th>
                              <th style={{textAlign:"right",padding:"6px 8px",color:C.muted,fontWeight:500}}>Total Occupied</th>
                              <th style={{textAlign:"right",padding:"6px 8px",color:C.muted,fontWeight:500}}>Projected AWR</th>
                              <th style={{textAlign:"right",padding:"6px 8px",color:C.muted,fontWeight:500}}>vs Target</th>
                              <th style={{textAlign:"right",padding:"6px 8px",color:C.muted,fontWeight:500}}>Proj. Monthly Rev</th>
                            </tr>
                          </thead>
                          <tbody>
                            {monthProjections.map((p, i) => {
                              // Re-calculate breakdown for table
                              let totalBooked = 0, totalNewFill = 0, totalWeighted = 0;
                              ROOM_TYPES.forEach(rt => {
                                const data = pmsData.roomTypeData[rt];
                                if (!data || data.totalUnits === 0) return;
                                const currentAWR = data.awr || 0;
                                const adjustedRate = rateAdjustments[rt] ?? currentAWR;
                                const booked = data.months[p.month]?.booked ?? 0;
                                const available = data.months[p.month]?.available ?? 0;
                                const newFill = Math.round(available * 0.7);
                                totalBooked += booked;
                                totalNewFill += newFill;
                                totalWeighted += booked * currentAWR + newFill * adjustedRate;
                              });
                              const diff = p.blended - TARGET_RATE;
                              const monthlyRev = Math.round(totalWeighted * (52 / 12));
                              return (
                                <tr key={i} style={{borderBottom:`1px solid ${C.border}22`,background: i === 0 ? C.card : "transparent"}}>
                                  <td style={{padding:"8px",color:C.text,fontWeight: i === 0 ? 600 : 400}}>{p.label}{i === 0 ? " (current)" : ""}</td>
                                  <td style={{textAlign:"right",padding:"8px",color:C.text,fontFamily:"DM Mono,monospace"}}>{totalBooked}</td>
                                  <td style={{textAlign:"right",padding:"8px",color:C.sage,fontFamily:"DM Mono,monospace"}}>+{totalNewFill}</td>
                                  <td style={{textAlign:"right",padding:"8px",color:C.gold,fontWeight:600,fontFamily:"DM Mono,monospace"}}>{p.occupiedRooms}</td>
                                  <td style={{textAlign:"right",padding:"8px",color: p.blended >= TARGET_RATE ? C.sage : C.gold,fontWeight:700,fontFamily:"DM Mono,monospace"}}>£{p.blended}</td>
                                  <td style={{textAlign:"right",padding:"8px",color: diff >= 0 ? C.sage : C.rose,fontFamily:"DM Mono,monospace"}}>{diff >= 0 ? "+" : ""}{fmt(diff)}</td>
                                  <td style={{textAlign:"right",padding:"8px",color:C.gold,fontWeight:600,fontFamily:"DM Mono,monospace"}}>{fmt(monthlyRev)}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </>
                    );
                  })()}
                </div>

                {/* ── SECTION D: Rate Strategy Advisor ── */}
                <div style={{marginTop:20,background:C.bg,border:`1px solid ${C.blue}44`,borderRadius:12,padding:18}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                    <h4 style={{fontSize:13,fontWeight:700,color:C.blue}}>Rate Strategy Advisor</h4>
                    <span style={{fontSize:9,padding:"3px 10px",borderRadius:10,background:C.blue+"22",color:C.blue}}>AI Analysis</span>
                  </div>
                  <p style={{fontSize:10,color:C.muted,marginBottom:16}}>Three strategies to reach £{TARGET_RATE} blended AWR target based on current room type rates & availability</p>
                  {(() => {
                    // Gather current state
                    const roomData = [];
                    let totalBookedRooms = 0, totalAvailableRooms = 0, currentBlendedWeighted = 0, currentBlendedCount = 0;

                    ROOM_TYPES.forEach(rt => {
                      const data = pmsData.roomTypeData[rt];
                      if (!data || data.totalUnits === 0) return;
                      const currentAWR = data.awr || 0;
                      const booked = data.months[0]?.booked ?? 0;
                      const available = data.months[0]?.available ?? 0;
                      if (currentAWR > 0) {
                        currentBlendedWeighted += booked * currentAWR;
                        currentBlendedCount += booked;
                      }
                      totalBookedRooms += booked;
                      totalAvailableRooms += available;
                      roomData.push({ rt, currentAWR, booked, available, totalUnits: data.totalUnits });
                    });

                    const currentBlended = currentBlendedCount > 0 ? Math.round(currentBlendedWeighted / currentBlendedCount) : 0;
                    const gap = TARGET_RATE - currentBlended;

                    // For each strategy, calculate what rate each unsold room type needs to achieve target
                    // Target: (sum of booked*currentAWR + sum of fill*newRate) / totalOccupied = TARGET_RATE
                    // We need: sum of fill*newRate = TARGET_RATE * totalOccupied - sum of booked*currentAWR
                    const FILL = 0.7;
                    const totalExpectedFill = roomData.reduce((s, r) => s + Math.round(r.available * FILL), 0);
                    const totalExpectedOccupied = totalBookedRooms + totalExpectedFill;
                    const revenueNeeded = TARGET_RATE * totalExpectedOccupied;
                    const bookedRevenue = roomData.reduce((s, r) => s + r.booked * r.currentAWR, 0);
                    const unsoldRevenueNeeded = revenueNeeded - bookedRevenue;
                    const flatUnsoldRate = totalExpectedFill > 0 ? Math.round(unsoldRevenueNeeded / totalExpectedFill) : TARGET_RATE;

                    // Strategy 1: Conservative — small increases spread across all types
                    const conservative = roomData.map(r => {
                      const newRate = r.currentAWR > 0 ? Math.round(r.currentAWR + gap * 0.5) : TARGET_RATE;
                      return { ...r, newRate: Math.max(r.currentAWR, Math.min(500, newRate)), increase: Math.max(0, newRate - r.currentAWR) };
                    });

                    // Strategy 2: Balanced — increase proportionally, more on underperformers
                    const balanced = roomData.map(r => {
                      if (r.available <= 0 || r.currentAWR === 0) return { ...r, newRate: r.currentAWR || TARGET_RATE, increase: 0 };
                      const typeGap = TARGET_RATE - r.currentAWR;
                      const newRate = Math.round(r.currentAWR + typeGap * 0.8);
                      return { ...r, newRate: Math.max(r.currentAWR, Math.min(500, newRate)), increase: Math.max(0, newRate - r.currentAWR) };
                    });

                    // Strategy 3: Aggressive — push premium rooms hard, price unsold at what's needed
                    const aggressive = roomData.map(r => {
                      if (r.available <= 0 || r.currentAWR === 0) return { ...r, newRate: r.currentAWR || TARGET_RATE, increase: 0 };
                      const newRate = Math.max(r.currentAWR, flatUnsoldRate);
                      return { ...r, newRate: Math.min(500, newRate), increase: Math.max(0, newRate - r.currentAWR) };
                    });

                    // Calculate projected blended AWR for each strategy
                    const calcBlended = (strat) => {
                      let w = 0, c = 0;
                      strat.forEach(r => {
                        w += r.booked * r.currentAWR;
                        c += r.booked;
                        const fill = Math.round(r.available * FILL);
                        w += fill * r.newRate;
                        c += fill;
                      });
                      return c > 0 ? Math.round(w / c) : 0;
                    };
                    const calcRevenue = (strat) => {
                      let w = 0;
                      strat.forEach(r => {
                        w += r.booked * r.currentAWR;
                        const fill = Math.round(r.available * FILL);
                        w += fill * r.newRate;
                      });
                      return Math.round(w * (52 / 12));
                    };

                    const strategies = [
                      { name: "Conservative", desc: "Small uplift across all room types — lower risk, gradual improvement", color: C.sage, strat: conservative },
                      { name: "Balanced", desc: "Close 80% of each type's gap to target — best balance of achievability and impact", color: C.gold, strat: balanced },
                      { name: "Aggressive", desc: "Price all unsold rooms at the flat rate needed to hit target — maximum impact", color: C.rose, strat: aggressive },
                    ];

                    return (
                      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(320px, 1fr))",gap:14}}>
                        {strategies.map((s, si) => {
                          const projAWR = calcBlended(s.strat);
                          const projRev = calcRevenue(s.strat);
                          const hitsTarget = projAWR >= TARGET_RATE;
                          return (
                            <div key={si} style={{background:C.card,border:`1px solid ${s.color}44`,borderRadius:10,padding:14}}>
                              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                                <h5 style={{fontSize:12,fontWeight:700,color:s.color,margin:0}}>{si + 1}. {s.name}</h5>
                                <span style={{fontSize:18,fontWeight:800,color: hitsTarget ? C.sage : s.color,fontFamily:"DM Mono,monospace"}}>£{projAWR}</span>
                              </div>
                              <p style={{fontSize:9,color:C.muted,marginBottom:10,lineHeight:1.4}}>{s.desc}</p>
                              <div style={{fontSize:10,lineHeight:1.8}}>
                                {s.strat.filter(r => r.increase > 0 && r.available > 0).map((r, ri) => (
                                  <div key={ri} style={{display:"flex",justifyContent:"space-between",borderBottom:`1px solid ${C.border}22`,padding:"2px 0"}}>
                                    <span style={{color:C.text}}>{r.rt}</span>
                                    <span style={{fontFamily:"DM Mono,monospace"}}>
                                      <span style={{color:C.muted}}>£{r.currentAWR}</span>
                                      <span style={{color:s.color,margin:"0 4px"}}>→</span>
                                      <span style={{color:s.color,fontWeight:600}}>£{r.newRate}</span>
                                      <span style={{color:C.muted,marginLeft:4}}>(+£{r.increase}/wk)</span>
                                    </span>
                                  </div>
                                ))}
                              </div>
                              <div style={{marginTop:10,padding:"8px 10px",background:C.bg,borderRadius:8,display:"flex",justifyContent:"space-between"}}>
                                <div>
                                  <p style={{fontSize:9,color:C.muted}}>Projected AWR</p>
                                  <p style={{fontSize:14,fontWeight:700,color: hitsTarget ? C.sage : s.color,fontFamily:"DM Mono,monospace"}}>£{projAWR}</p>
                                </div>
                                <div style={{textAlign:"right"}}>
                                  <p style={{fontSize:9,color:C.muted}}>Monthly Revenue</p>
                                  <p style={{fontSize:14,fontWeight:700,color:C.gold,fontFamily:"DM Mono,monospace"}}>{fmt(projRev)}</p>
                                </div>
                              </div>
                              {hitsTarget && <p style={{fontSize:9,color:C.sage,marginTop:6,textAlign:"center"}}>✓ Hits £{TARGET_RATE} AWR target</p>}
                              {!hitsTarget && <p style={{fontSize:9,color:C.rose,marginTop:6,textAlign:"center"}}>£{TARGET_RATE - projAWR} short of target — combine with occupancy growth</p>}

                              {/* Apply this strategy button */}
                              <button
                                onClick={() => {
                                  const newAdj = {};
                                  s.strat.forEach(r => { if (r.increase > 0) newAdj[r.rt] = r.newRate; });
                                  setRateAdjustments(prev => ({...prev, ...newAdj}));
                                }}
                                style={{width:"100%",marginTop:8,padding:"6px 0",fontSize:10,fontWeight:600,color:C.bg,background:s.color,border:"none",borderRadius:6,cursor:"pointer",opacity:0.9}}
                              >
                                Apply to sliders ↑
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}

          </div>
        )}

        {/* ════ RENEWALS ════ */}
        {property==="southall"&&tab==="renewals"&&(
          <div style={{padding:"22px 26px"}}>
            <p style={{fontSize:11,color:C.muted,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:2}}>Contract Management · Res Harmonics{pmsConn?" · live":""}{canopyConn?" · Canopy ✓":""}</p>
            <h2 style={{fontSize:20,fontWeight:700,color:C.text,marginBottom:18}}>Renewals Dashboard</h2>

            {/* ── Renewal Activity Tracker (date-filtered, reconciles with board below) ── */}
            {pmsConn && pmsData?.weeklyRenewals && (
              <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:"18px 22px",marginBottom:18}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:10,marginBottom:14}}>
                  <div>
                    <h3 style={{fontSize:13,fontWeight:700,color:C.text,marginBottom:2}}>Renewal Activity</h3>
                    <p style={{fontSize:11,color:C.muted}}>Renewal activity for in-house contacts · All metrics filtered by date range</p>
                  </div>
                  {/* Date range picker */}
                  <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
                    {[{l:"Last 7d",k:"7d"},{l:"Last 14d",k:"14d"},{l:"Last 30d",k:"30d"}].map(p => (
                      <button key={p.k} onClick={() => { const d=new Date(); d.setDate(d.getDate()-(p.k==="7d"?6:p.k==="14d"?13:29)); setRenewalTrackerFrom(d.toISOString().slice(0,10)); setRenewalTrackerTo(new Date().toISOString().slice(0,10)); setRenewalTrackerPreset(p.k); }}
                        style={{padding:"5px 12px",borderRadius:8,border:`1px solid ${renewalTrackerPreset===p.k?C.gold:C.border}`,background:renewalTrackerPreset===p.k?C.gold+"22":"transparent",color:renewalTrackerPreset===p.k?C.gold:C.muted,fontWeight:renewalTrackerPreset===p.k?700:500,fontSize:11,cursor:"pointer"}}>{p.l}</button>
                    ))}
                    <CalendarPicker value={renewalTrackerFrom} onChange={v=>{setRenewalTrackerFrom(v);setRenewalTrackerPreset(null);}} />
                    <span style={{color:C.muted,fontSize:11}}>→</span>
                    <CalendarPicker value={renewalTrackerTo} onChange={v=>{setRenewalTrackerTo(v);setRenewalTrackerPreset(null);}} />
                  </div>
                </div>

                {(() => {
                  // Now using REAL status change dates from individual roomStay API:
                  // - conversionDate = when contract was sent (booking moved to PENDING)
                  // - confirmedDate = when ops confirmed (booking moved to CONFIRMED)
                  // - contractSignedDate = when DocuSign/Canopy was signed
                  const allPendingAll = pmsData.pendingRenewals || [];
                  const allConfirmedAll = pmsData.confirmedRenewals || [];

                  // Filter CONFIRMED by confirmedDate (when it was actually confirmed)
                  const filteredConfirmed = allConfirmedAll.filter(ev => {
                    const d = ev.confirmedDate || ev.contractSignedDate || ev.conversionDate;
                    if (!d) return false;
                    return d >= renewalTrackerFrom && d <= renewalTrackerTo;
                  });

                  // Filter PENDING by conversionDate (when contract was sent out)
                  const filteredPending = allPendingAll.filter(ev => {
                    const d = ev.conversionDate;
                    if (!d) return false;
                    return d >= renewalTrackerFrom && d <= renewalTrackerTo;
                  });

                  const filteredAll = [...filteredConfirmed, ...filteredPending];

                  // Departing: entries marked leaving whose expiry falls in the selected period
                  const allRenewalEntries = (pmsData.renewalMonths || []).flatMap(m => m.entries);
                  const departingInPeriod = allRenewalEntries.filter(e => {
                    const isLeaving = leavingSet.has(e.roomStayId);
                    const isAutoLeft = e.expired && !e.isRenewed && !e.isPendingRenewal && !pendingSet.has(e.roomStayId);
                    if (!isLeaving && !isAutoLeft) return false;
                    return e.endDate >= renewalTrackerFrom && e.endDate <= renewalTrackerTo;
                  });

                  return (
                    <div>
                      {/* KPIs */}
                      <div style={{display:"flex",gap:12,flexWrap:"wrap",marginBottom:14}}>
                        <KPI label="Renewed" value={filteredAll.length} sub="In selected period" accent={C.gold}/>
                        <KPI label="Confirmed" value={filteredConfirmed.length} sub="Signed in period" accent={C.sage}/>
                        <KPI label="Pending" value={filteredPending.length} sub="Contracts sent in period" accent={C.blue}/>
                        <KPI label="Departing" value={departingInPeriod.length} sub="Leaving in period" accent={C.rose}/>
                      </div>

                      {/* Totals context bar */}
                      <div style={{display:"flex",gap:16,marginBottom:14,padding:"6px 12px",background:C.bg,borderRadius:8,fontSize:11,color:C.muted}}>
                        <span>Total in-house renewals: <strong style={{color:C.text}}>{allConfirmedAll.length + allPendingAll.length}</strong></span>
                        <span>Confirmed: <strong style={{color:C.sage}}>{allConfirmedAll.length}</strong></span>
                        <span>Pending: <strong style={{color:C.blue}}>{allPendingAll.length}</strong></span>
                      </div>

                      {/* Confirmed renewals in period */}
                      {filteredConfirmed.length > 0 && (
                        <div style={{marginTop:4}}>
                          <p style={{fontSize:11,fontWeight:700,color:C.sage,marginBottom:8,textTransform:"uppercase",letterSpacing:"0.06em"}}>
                            Confirmed in Period ({filteredConfirmed.length})
                          </p>
                          <div style={{overflowX:"auto",maxHeight:280,overflowY:"auto"}}>
                            <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                              <thead>
                                <tr style={{borderBottom:`1px solid ${C.border}`,position:"sticky",top:0,background:C.card}}>
                                  <th style={{padding:"6px 10px",textAlign:"left",color:C.muted,fontWeight:600,fontSize:10,textTransform:"uppercase"}}>Name</th>
                                  <th style={{padding:"6px 10px",textAlign:"left",color:C.muted,fontWeight:600,fontSize:10,textTransform:"uppercase"}}>Confirmed</th>
                                  <th style={{padding:"6px 10px",textAlign:"left",color:C.muted,fontWeight:600,fontSize:10,textTransform:"uppercase"}}>Room</th>
                                  <th style={{padding:"6px 10px",textAlign:"left",color:C.muted,fontWeight:600,fontSize:10,textTransform:"uppercase"}}>New Stay</th>
                                  <th style={{padding:"6px 10px",textAlign:"left",color:C.muted,fontWeight:600,fontSize:10,textTransform:"uppercase"}}>Status</th>
                                </tr>
                              </thead>
                              <tbody>
                                {filteredConfirmed.sort((a,b)=>(b.confirmedDate||"").localeCompare(a.confirmedDate||"")).map((ev,i) => (
                                  <tr key={i} style={{borderBottom:`1px solid ${C.border}22`}}>
                                    <td style={{padding:"7px 10px",color:C.text,fontWeight:600}}>{ev.name||"—"}</td>
                                    <td style={{padding:"7px 10px",color:C.sage,fontFamily:"DM Mono,monospace",fontSize:11}}>{ev.confirmedDate||ev.contractSignedDate||"—"}</td>
                                    <td style={{padding:"7px 10px",color:C.muted}}>{ev.room}</td>
                                    <td style={{padding:"7px 10px",color:C.muted,fontFamily:"DM Mono,monospace",fontSize:11}}>{ev.followOnStart} → {ev.followOnEnd}</td>
                                    <td style={{padding:"7px 10px"}}>
                                      <span style={{fontSize:10,fontWeight:700,color:C.sage,background:C.sage+"22",padding:"2px 8px",borderRadius:8}}>CONFIRMED</span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {/* Pending (contracts sent) in period */}
                      {filteredPending.length > 0 && (
                        <div style={{marginTop:14}}>
                          <p style={{fontSize:11,fontWeight:700,color:C.blue,marginBottom:8,textTransform:"uppercase",letterSpacing:"0.06em"}}>
                            Contracts Sent in Period ({filteredPending.length})
                          </p>
                          <div style={{overflowX:"auto",maxHeight:200,overflowY:"auto"}}>
                            <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                              <thead>
                                <tr style={{borderBottom:`1px solid ${C.border}`,position:"sticky",top:0,background:C.card}}>
                                  <th style={{padding:"6px 10px",textAlign:"left",color:C.muted,fontWeight:600,fontSize:10,textTransform:"uppercase"}}>Name</th>
                                  <th style={{padding:"6px 10px",textAlign:"left",color:C.muted,fontWeight:600,fontSize:10,textTransform:"uppercase"}}>Sent</th>
                                  <th style={{padding:"6px 10px",textAlign:"left",color:C.muted,fontWeight:600,fontSize:10,textTransform:"uppercase"}}>Room</th>
                                  <th style={{padding:"6px 10px",textAlign:"left",color:C.muted,fontWeight:600,fontSize:10,textTransform:"uppercase"}}>New Stay</th>
                                  <th style={{padding:"6px 10px",textAlign:"left",color:C.muted,fontWeight:600,fontSize:10,textTransform:"uppercase"}}>Status</th>
                                </tr>
                              </thead>
                              <tbody>
                                {filteredPending.sort((a,b)=>(b.conversionDate||"").localeCompare(a.conversionDate||"")).map((ev,i) => (
                                  <tr key={i} style={{borderBottom:`1px solid ${C.border}22`}}>
                                    <td style={{padding:"7px 10px",color:C.text,fontWeight:600}}>{ev.name||"—"}</td>
                                    <td style={{padding:"7px 10px",color:C.blue,fontFamily:"DM Mono,monospace",fontSize:11}}>{ev.conversionDate||"—"}</td>
                                    <td style={{padding:"7px 10px",color:C.muted}}>{ev.room}</td>
                                    <td style={{padding:"7px 10px",color:C.muted,fontFamily:"DM Mono,monospace",fontSize:11}}>{ev.followOnStart} → {ev.followOnEnd}</td>
                                    <td style={{padding:"7px 10px"}}>
                                      <span style={{fontSize:10,fontWeight:700,color:C.blue,background:C.blue+"22",padding:"2px 8px",borderRadius:8}}>PENDING</span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {/* Departing list */}
                      {departingInPeriod.length > 0 && (
                        <div style={{marginTop:14}}>
                          <p style={{fontSize:11,fontWeight:700,color:C.rose,marginBottom:8,textTransform:"uppercase",letterSpacing:"0.06em"}}>
                            Departing in Period ({departingInPeriod.length})
                          </p>
                          <div style={{overflowX:"auto",maxHeight:200,overflowY:"auto"}}>
                            <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                              <thead>
                                <tr style={{borderBottom:`1px solid ${C.border}`,position:"sticky",top:0,background:C.card}}>
                                  <th style={{padding:"6px 10px",textAlign:"left",color:C.muted,fontWeight:600,fontSize:10,textTransform:"uppercase"}}>Name</th>
                                  <th style={{padding:"6px 10px",textAlign:"left",color:C.muted,fontWeight:600,fontSize:10,textTransform:"uppercase"}}>Expiry</th>
                                  <th style={{padding:"6px 10px",textAlign:"left",color:C.muted,fontWeight:600,fontSize:10,textTransform:"uppercase"}}>Room</th>
                                  <th style={{padding:"6px 10px",textAlign:"left",color:C.muted,fontWeight:600,fontSize:10,textTransform:"uppercase"}}>Reason</th>
                                </tr>
                              </thead>
                              <tbody>
                                {departingInPeriod.sort((a,b)=>a.endDate.localeCompare(b.endDate)).map((e,i) => (
                                  <tr key={i} style={{borderBottom:`1px solid ${C.border}22`}}>
                                    <td style={{padding:"7px 10px",color:C.text,fontWeight:600}}>{e.name||"—"}</td>
                                    <td style={{padding:"7px 10px",color:C.muted,fontFamily:"DM Mono,monospace",fontSize:11}}>{e.endDate}</td>
                                    <td style={{padding:"7px 10px",color:C.muted}}>{e.room}</td>
                                    <td style={{padding:"7px 10px",color:C.muted,fontSize:11}}>{leavingReasons[e.roomStayId]||"—"}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {filteredAll.length === 0 && departingInPeriod.length === 0 && (
                        <p style={{color:C.muted,fontSize:12,textAlign:"center",padding:"12px 0"}}>No renewal activity or departures in this date range.</p>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Canopy reference checks status bar */}
            <div style={{background:C.card,border:`1px solid ${canopyConn?C.sage+"44":C.border}`,borderRadius:12,padding:"12px 18px",marginBottom:16,display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8}}>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <span style={{fontSize:14}}>{canopyConn?"✓":"○"}</span>
                <div>
                  <p style={{fontSize:12,fontWeight:600,color:canopyConn?C.sage:C.muted,margin:0}}>
                    {canopyLoad ? "Loading Canopy checks…" : canopyConn ? `Canopy Reference Checks · ${canopyData?.totalRecords||0} records` : "Canopy Reference Checks"}
                  </p>
                  {canopyErr && <p style={{fontSize:10,color:C.rose,margin:"2px 0 0"}}>{canopyErr}</p>}
                  {!canopyConn && !canopyLoad && !canopyErr && <p style={{fontSize:10,color:C.muted,margin:"2px 0 0"}}>Webhook data will appear here once Canopy is connected</p>}
                </div>
              </div>
              <button onClick={fetchCanopy} disabled={canopyLoad}
                style={{padding:"6px 14px",borderRadius:8,border:`1px solid ${C.border}`,background:C.bg,color:C.text,fontWeight:600,fontSize:11,cursor:canopyLoad?"wait":"pointer",whiteSpace:"nowrap"}}>
                {canopyLoad?"Loading…":"↻ Refresh"}
              </button>
            </div>

            {!pmsConn ? (
              <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:"24px 20px",textAlign:"center"}}>
                <p style={{color:C.muted,fontSize:13}}>Connect Res Harmonics in the Occupancy tab to view renewal data.</p>
              </div>
            ) : !pmsData?.renewalMonths ? (
              <p style={{color:C.muted,fontSize:13}}>Loading renewal data…</p>
            ) : (() => {
              const months = pmsData.renewalMonths;
              // Compute stats with leaving markers factored in
              // Statuses: Renewed (CONFIRMED/CHECKED_IN follow-on), Pending (PENDING follow-on),
              //           Not Yet Started (no follow-on, not expired), Left (expired, no follow-on), Leaving (manual override)
              const monthStats = months.map(m => {
                // Categories are mutually exclusive with clear priority:
                // 1. leavingSet (manual override) → leaving
                // 2. isRenewed (auto-detected follow-on) → renewed
                // 3. isPendingRenewal or pendingSet → pending
                // 4. expired (past end date, no follow-on) → leaving
                // 5. everything else → not started
                const leaving = m.entries.filter(e => {
                  if (leavingSet.has(e.roomStayId)) return true;
                  if (e.isRenewed || e.isPendingRenewal || pendingSet.has(e.roomStayId)) return false;
                  return e.expired;
                });
                const renewed = m.entries.filter(e => e.isRenewed && !leavingSet.has(e.roomStayId));
                const pendingRenewal = m.entries.filter(e => (e.isPendingRenewal || pendingSet.has(e.roomStayId)) && !e.isRenewed && !leavingSet.has(e.roomStayId));
                const notStarted = m.entries.filter(e => !e.isRenewed && !e.isPendingRenewal && !e.expired && !leavingSet.has(e.roomStayId) && !pendingSet.has(e.roomStayId));
                const critical = notStarted.filter(e => e.critical);
                const total = m.entries.length;
                const renewedPct = total > 0 ? Math.round((renewed.length / total) * 100) : 0;
                const leavingPct = total > 0 ? Math.round((leaving.length / total) * 100) : 0;
                const pendingPct = total > 0 ? Math.round((pendingRenewal.length / total) * 100) : 0;
                return { ...m, leaving, renewed, pendingRenewal, notStarted, critical, renewedPct, leavingPct, pendingPct };
              });
              const totalAll = monthStats.reduce((s, m) => s + m.total, 0);
              const totalRenewed = monthStats.reduce((s, m) => s + m.renewed.length, 0);
              const totalLeaving = monthStats.reduce((s, m) => s + m.leaving.length, 0);
              const totalPending = monthStats.reduce((s, m) => s + m.pendingRenewal.length, 0);
              const totalNotStarted = monthStats.reduce((s, m) => s + m.notStarted.length, 0);
              const totalCritical = monthStats.reduce((s, m) => s + m.critical.length, 0);
              const overallRenewedPct = totalAll > 0 ? Math.round((totalRenewed / totalAll) * 100) : 0;
              const overallLeavingPct = totalAll > 0 ? Math.round((totalLeaving / totalAll) * 100) : 0;
              const selected = renewalSelectedMonth !== null ? monthStats.find(m => m.key === renewalSelectedMonth) : null;

              return (
                <div>
                  {/* Summary KPIs + Export button */}
                  <div style={{display:"flex",gap:12,marginBottom:18,flexWrap:"wrap",alignItems:"flex-start"}}>
                    <KPI label="Expiring (12mo)" value={totalAll} sub="All contracts ending" accent={C.gold}/>
                    <KPI label="Renewed" value={`${totalRenewed} (${overallRenewedPct}%)`} sub="Contract signed" accent={C.sage}/>
                    <KPI label="Pending" value={totalPending} sub="Contract sent, awaiting signature" accent={C.blue}/>
                    <KPI label="Not Yet Started" value={totalNotStarted} sub="No renewal action yet" accent={C.gold}/>
                    <KPI label="Departing" value={`${totalLeaving} (${overallLeavingPct}%)`} sub="Left or marked leaving" accent={C.rose}/>
                    <KPI label="Critical (≤14d)" value={totalCritical} sub="Expiring soon, no action" accent={C.rose}/>
                  </div>
                  <div style={{display:"flex",gap:10,marginBottom:16}}>
                    <button onClick={() => exportRenewalsToExcel(monthStats, leavingSet, pendingSet, leavingReasons, customerRefs)}
                      style={{padding:"8px 16px",borderRadius:8,border:`1px solid ${C.sage}`,background:C.sage+"22",color:C.sage,fontWeight:700,fontSize:11,cursor:"pointer",letterSpacing:"0.04em",display:"flex",alignItems:"center",gap:6}}>
                      ↓ Export Renewed + Pending (.xlsx)
                    </button>
                  </div>

                  {/* ── Leaving Reasons Pie Charts ── */}
                  {(() => {
                    // Gather all leaving entries across all months
                    const allLeavingEntries = monthStats.flatMap(m => m.leaving);
                    if (allLeavingEntries.length === 0) return null;
                    // Count reasons
                    const reasonCounts = {};
                    let noReasonCount = 0;
                    allLeavingEntries.forEach(e => {
                      const reason = leavingReasons[e.roomStayId];
                      if (reason) { reasonCounts[reason] = (reasonCounts[reason] || 0) + 1; }
                      else { noReasonCount++; }
                    });
                    const reasonEntries = Object.entries(reasonCounts).sort((a,b) => b[1] - a[1]);
                    if (noReasonCount > 0) reasonEntries.push(["No Reason Set", noReasonCount]);
                    const total = allLeavingEntries.length;
                    const pieColors = ["#e55", "#e09f3e", "#4ea8de", "#c8a455", "#9b59b6", "#e07c5a", "#888"];
                    // SVG pie chart
                    const pieData = reasonEntries.map(([label, count], i) => ({
                      label, count, pct: Math.round((count / total) * 100),
                      color: pieColors[i % pieColors.length]
                    }));
                    let cumAngle = 0;
                    const slices = pieData.map(d => {
                      const angle = (d.count / total) * 360;
                      const startAngle = cumAngle;
                      cumAngle += angle;
                      const endAngle = cumAngle;
                      const startRad = (startAngle - 90) * Math.PI / 180;
                      const endRad = (endAngle - 90) * Math.PI / 180;
                      const largeArc = angle > 180 ? 1 : 0;
                      const x1 = 80 + 70 * Math.cos(startRad);
                      const y1 = 80 + 70 * Math.sin(startRad);
                      const x2 = 80 + 70 * Math.cos(endRad);
                      const y2 = 80 + 70 * Math.sin(endRad);
                      // For single-item pie, draw a full circle
                      if (pieData.length === 1) {
                        return { ...d, path: null, fullCircle: true };
                      }
                      return { ...d, path: `M80,80 L${x1},${y1} A70,70 0 ${largeArc},1 ${x2},${y2} Z`, fullCircle: false };
                    });
                    return (
                      <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:"18px 22px",marginBottom:18}}>
                        <h3 style={{fontSize:13,fontWeight:700,color:C.text,marginBottom:14}}>Departure Reasons Breakdown</h3>
                        <div style={{display:"flex",gap:30,alignItems:"center",flexWrap:"wrap"}}>
                          <svg width="160" height="160" viewBox="0 0 160 160">
                            {slices.map((s, i) => s.fullCircle ? (
                              <circle key={i} cx="80" cy="80" r="70" fill={s.color}/>
                            ) : (
                              <path key={i} d={s.path} fill={s.color} stroke={C.card} strokeWidth="1.5"/>
                            ))}
                            <circle cx="80" cy="80" r="35" fill={C.card}/>
                            <text x="80" y="76" textAnchor="middle" fill={C.text} fontSize="18" fontWeight="700">{total}</text>
                            <text x="80" y="92" textAnchor="middle" fill={C.muted} fontSize="9">departing</text>
                          </svg>
                          <div style={{display:"flex",flexDirection:"column",gap:8,flex:1}}>
                            {pieData.map((d, i) => (
                              <div key={i} style={{display:"flex",alignItems:"center",gap:10}}>
                                <div style={{width:12,height:12,borderRadius:3,background:d.color,flexShrink:0}}/>
                                <div style={{flex:1}}>
                                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline"}}>
                                    <span style={{fontSize:12,color:C.text,fontWeight:600}}>{d.label}</span>
                                    <span style={{fontSize:11,color:C.muted,fontFamily:"DM Mono,monospace"}}>{d.count} ({d.pct}%)</span>
                                  </div>
                                  <div style={{height:4,borderRadius:2,background:C.border,marginTop:3}}>
                                    <div style={{height:"100%",borderRadius:2,background:d.color,width:`${d.pct}%`,transition:"width 0.3s"}}/>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Month grid */}
                  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(175px,1fr))",gap:10,marginBottom:20}}>
                    {monthStats.map(m => {
                      const isSel = renewalSelectedMonth === m.key;
                      const hasCritical = m.critical.length > 0;
                      return (
                        <button key={m.key} onClick={() => setRenewalSelectedMonth(isSel ? null : m.key)}
                          style={{background:isSel?C.gold+"22":C.card,border:`1px solid ${isSel?C.gold:hasCritical?C.rose+"88":C.border}`,borderRadius:12,padding:"14px 12px",cursor:"pointer",textAlign:"left",transition:"all 0.2s"}}>
                          <p style={{fontSize:12,fontWeight:700,color:isSel?C.gold:C.text,marginBottom:6}}>{m.label}</p>
                          <p style={{fontSize:10,color:C.muted,marginBottom:4}}>{m.total} contracts up for renewal</p>
                          <div style={{display:"flex",gap:4,marginBottom:6,flexWrap:"wrap"}}>
                            {m.renewed.length > 0 && <span style={{fontSize:9,color:C.sage,background:C.sage+"22",padding:"1px 5px",borderRadius:8}}>✓ {m.renewed.length} renewed</span>}
                            {m.pendingRenewal.length > 0 && <span style={{fontSize:9,color:C.blue,background:C.blue+"22",padding:"1px 5px",borderRadius:8}}>◎ {m.pendingRenewal.length} pending</span>}
                            {m.notStarted.length > 0 && <span style={{fontSize:9,color:C.gold,background:C.gold+"22",padding:"1px 5px",borderRadius:8}}>○ {m.notStarted.length} not started</span>}
                            {m.leaving.length > 0 && <span style={{fontSize:9,color:C.rose,background:C.rose+"22",padding:"1px 5px",borderRadius:8}}>✗ {m.leaving.length} left</span>}
                            {m.critical.length > 0 && <span style={{fontSize:9,color:C.rose,background:C.rose+"22",padding:"1px 5px",borderRadius:8}}>⚠ {m.critical.length} critical</span>}
                          </div>
                          {m.total > 0 && (
                            <div style={{marginTop:2}}>
                              <div style={{display:"flex",height:6,borderRadius:3,overflow:"hidden",background:C.border,marginBottom:4}}>
                                {m.renewedPct > 0 && <div style={{width:`${m.renewedPct}%`,background:C.sage,transition:"width 0.3s"}}/>}
                                {m.pendingPct > 0 && <div style={{width:`${m.pendingPct}%`,background:C.blue,transition:"width 0.3s"}}/>}
                                {m.leavingPct > 0 && <div style={{width:`${m.leavingPct}%`,background:C.rose,transition:"width 0.3s"}}/>}
                              </div>
                              <div style={{display:"flex",justifyContent:"space-between",fontSize:9,color:C.muted}}>
                                <span style={{color:C.sage}}>{m.renewedPct}%</span>
                                {m.pendingPct > 0 && <span style={{color:C.blue}}>{m.pendingPct}% pending</span>}
                                <span style={{color:C.rose}}>{m.leavingPct}%</span>
                              </div>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Expanded month detail */}
                  {selected && (
                    <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:"18px 20px",marginBottom:18}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14,flexWrap:"wrap",gap:8}}>
                        <div>
                          <h3 style={{fontSize:16,fontWeight:700,color:C.text}}>{selected.label} — {selected.total} contract{selected.total!==1?"s":""} expiring</h3>
                          <p style={{fontSize:12,color:C.muted,marginTop:2}}>
                            <span style={{color:C.sage}}>{selected.renewed.length} renewed ({selected.renewedPct}%)</span>
                            {" · "}
                            <span style={{color:C.blue}}>{selected.pendingRenewal.length} pending</span>
                            {" · "}
                            <span style={{color:C.gold}}>{selected.notStarted.length} not started</span>
                            {" · "}
                            <span style={{color:C.rose}}>{selected.leaving.length} left/leaving ({selected.leavingPct}%)</span>
                          </p>
                        </div>
                        <button onClick={() => setRenewalSelectedMonth(null)} style={{background:"transparent",border:`1px solid ${C.border}`,color:C.muted,padding:"4px 12px",borderRadius:8,cursor:"pointer",fontSize:11}}>Close</button>
                      </div>

                      {/* Per-month leaving reasons summary */}
                      {selected.leaving.length > 0 && (() => {
                        const monthReasonCounts = {};
                        let monthNoReason = 0;
                        selected.leaving.forEach(e => {
                          const reason = leavingReasons[e.roomStayId];
                          if (reason) { monthReasonCounts[reason] = (monthReasonCounts[reason] || 0) + 1; }
                          else { monthNoReason++; }
                        });
                        const monthReasonEntries = Object.entries(monthReasonCounts).sort((a,b) => b[1] - a[1]);
                        const pieColors = ["#e55", "#e09f3e", "#4ea8de", "#c8a455", "#9b59b6", "#e07c5a", "#888"];
                        return (
                          <div style={{background:C.bg,border:`1px solid ${C.border}`,borderRadius:10,padding:"12px 16px",marginBottom:14}}>
                            <p style={{fontSize:11,fontWeight:700,color:C.rose,marginBottom:8,textTransform:"uppercase",letterSpacing:"0.06em"}}>
                              Departure Reasons - {selected.label} ({selected.leaving.length} departed)
                            </p>
                            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                              {monthReasonEntries.map(([reason, count], i) => (
                                <span key={reason} style={{fontSize:10,background:pieColors[i % pieColors.length]+"22",color:pieColors[i % pieColors.length],padding:"3px 10px",borderRadius:8,fontWeight:600}}>
                                  {reason}: {count}
                                </span>
                              ))}
                              {monthNoReason > 0 && (
                                <span style={{fontSize:10,background:C.muted+"22",color:C.muted,padding:"3px 10px",borderRadius:8,fontWeight:600}}>
                                  No Reason Set: {monthNoReason}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })()}

                      {selected.entries.length === 0 ? (
                        <p style={{color:C.muted,fontSize:13}}>No contracts expiring this month.</p>
                      ) : (
                        <div style={{overflowX:"auto"}}>
                          {(() => {
                            // Sort entries based on current sort state
                            const statusRank = (e) => {
                              if (leavingSet.has(e.roomStayId)) return 4; // manual leaving
                              if (e.isRenewed) return 3; // renewed
                              const mp = pendingSet.has(e.roomStayId);
                              if (e.isPendingRenewal || mp) return 2; // pending
                              if (e.expired) return 4; // auto-expired/left
                              return 1; // not started (highest priority)
                            };
                            const sorted = [...selected.entries].sort((a, b) => {
                              let cmp = 0;
                              switch (renewalSort.col) {
                                case "name": cmp = (a.name || "").localeCompare(b.name || ""); break;
                                case "expiry": cmp = (a.endDate || "").localeCompare(b.endDate || ""); break;
                                case "los": cmp = (a.losDays || 0) - (b.losDays || 0); break;
                                case "room": cmp = (a.room || "").localeCompare(b.room || "", undefined, {numeric:true}); break;
                                case "pcm": {
                                  const aPcm = a.renewalPcm && a.isRenewed ? a.renewalPcm : a.pcm;
                                  const bPcm = b.renewalPcm && b.isRenewed ? b.renewalPcm : b.pcm;
                                  cmp = aPcm - bPcm; break;
                                }
                                case "status": cmp = statusRank(a) - statusRank(b); break;
                                default: cmp = (a.endDate || "").localeCompare(b.endDate || "");
                              }
                              return renewalSort.dir === "desc" ? -cmp : cmp;
                            });
                            const sortCols = [
                              {key:"name",label:"Name"},{key:null,label:"Booking Ref"},{key:null,label:"Cust Ref"},{key:"expiry",label:"Expiry"},
                              {key:"los",label:"LoS"},{key:"room",label:"Room"},{key:"pcm",label:"PCM"},
                              {key:"status",label:"Status"},{key:null,label:"Ref Check"},
                              {key:null,label:""},{key:null,label:"Reason"},{key:null,label:""},{key:null,label:"SMS"},{key:null,label:"Email"}
                            ];
                            const arrow = (col) => renewalSort.col === col ? (renewalSort.dir === "asc" ? " ▲" : " ▼") : "";
                            const handleSort = (col) => {
                              if (!col) return;
                              setRenewalSort(prev => prev.col === col ? {col, dir: prev.dir === "asc" ? "desc" : "asc"} : {col, dir: "asc"});
                            };
                            return (
                          <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                            <thead>
                              <tr style={{borderBottom:`1px solid ${C.border}`}}>
                                {sortCols.map((h, idx) => (
                                  <th key={h.label||idx} onClick={() => handleSort(h.key)}
                                    style={{padding:"8px 10px",textAlign:"left",color:renewalSort.col===h.key?C.gold:C.muted,fontWeight:600,fontSize:10,textTransform:"uppercase",letterSpacing:"0.08em",whiteSpace:"nowrap",cursor:h.key?"pointer":"default",userSelect:"none"}}>
                                    {h.label}{h.key ? arrow(h.key) : ""}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {sorted.map((e, i) => {
                                const isManualPending = pendingSet.has(e.roomStayId);
                                const isLeaving = leavingSet.has(e.roomStayId) || (e.expired && !e.isRenewed && !e.isPendingRenewal && !isManualPending);
                                const isPending = (e.isPendingRenewal || isManualPending) && !e.isRenewed && !leavingSet.has(e.roomStayId);
                                const rowBg = isLeaving ? C.rose + "0a" : isPending ? C.blue + "0a" : (e.critical && !e.isRenewed ? C.rose + "12" : "transparent");
                                const expiryColor = e.critical && !e.isRenewed && !isLeaving && !isPending ? C.rose : C.text;
                                // Determine display status
                                const displayStatus = leavingSet.has(e.roomStayId) ? "leaving"
                                  : e.isRenewed ? "renewed"
                                  : isPending ? "pending"
                                  : e.expired ? "left"
                                  : "not_started";
                                return (
                                  <tr key={e.roomStayId || i} style={{borderBottom:`1px solid ${C.border}22`,background:rowBg}}>
                                    <td style={{padding:"10px 10px",color:isLeaving?C.muted:C.text,fontWeight:600,whiteSpace:"nowrap",textDecoration:isLeaving?"line-through":"none"}}>{e.name || "—"}</td>
                                    <td style={{padding:"10px 10px",fontFamily:"DM Mono,monospace",fontSize:11}}>
                                      {e.bookingId ? (
                                        <a href={`https://app.resharmonics.com/bookings/${e.bookingId}`} target="_blank" rel="noopener noreferrer"
                                          style={{color:C.gold,textDecoration:"none",borderBottom:`1px dashed ${C.gold}55`}}
                                          onMouseEnter={ev=>ev.target.style.borderBottomColor=C.gold}
                                          onMouseLeave={ev=>ev.target.style.borderBottomColor=C.gold+"55"}>
                                          {e.bookingReference || e.bookingId}
                                        </a>
                                      ) : (
                                        <span style={{color:C.muted}}>{e.bookingReference || "—"}</span>
                                      )}
                                    </td>
                                    <td style={{padding:"10px 6px",minWidth:110}}>
                                      <input type="text"
                                        value={customerRefs[e.roomStayId] ?? e.customerReference ?? ""}
                                        onChange={ev => setCustomerRefs(prev => ({...prev, [e.roomStayId]: ev.target.value}))}
                                        onBlur={ev => saveCustomerRef(e.roomStayId, e.bookingId, ev.target.value)}
                                        onKeyDown={ev => { if (ev.key === "Enter") { ev.target.blur(); } }}
                                        placeholder="Add ref..."
                                        style={{width:"100%",background:"transparent",border:`1px solid ${C.border}`,borderRadius:6,padding:"3px 6px",fontSize:10,color:C.text,fontFamily:"DM Mono,monospace",outline:"none"}}
                                        onFocus={ev => ev.target.style.borderColor = C.gold}
                                        onBlurCapture={ev => ev.target.style.borderColor = C.border}
                                      />
                                    </td>
                                    <td style={{padding:"10px 10px",color:expiryColor,fontWeight:e.critical&&displayStatus==="not_started"?700:400,whiteSpace:"nowrap"}}>
                                      {new Date(e.endDate).toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"})}
                                      {e.daysUntilExpiry >= 0 && e.daysUntilExpiry <= 14 && displayStatus === "not_started" && (
                                        <span style={{marginLeft:6,fontSize:9,background:C.rose,color:"#fff",padding:"1px 5px",borderRadius:4,fontWeight:700}}>{e.daysUntilExpiry}d</span>
                                      )}
                                    </td>
                                    <td style={{padding:"10px 10px",color:C.muted}}>{e.losDays}d{e.cumulDays && e.cumulDays !== e.losDays ? <span style={{fontSize:9,color:C.gold,marginLeft:4}} title={`Cumulative stay: ${e.cumulDays}d`}>({e.cumulDays}d)</span> : ""}</td>
                                    <td style={{padding:"10px 10px",color:C.muted,whiteSpace:"nowrap"}}>{e.room}</td>
                                    <td style={{padding:"10px 10px",fontFamily:"DM Mono,monospace",color:C.text}}>
                                      {e.renewalPcm && e.isRenewed ? (
                                        <span title={`Expiring: £${e.pcm.toLocaleString()} → Renewal: £${e.renewalPcm.toLocaleString()}`}>
                                          £{e.renewalPcm.toLocaleString()}
                                          {e.renewalPcm !== e.pcm && <span style={{fontSize:9,color:e.renewalPcm>e.pcm?C.sage:C.rose,marginLeft:4}}>{e.renewalPcm>e.pcm?"▲":"▼"}</span>}
                                        </span>
                                      ) : (
                                        <span>£{e.pcm.toLocaleString()}</span>
                                      )}
                                    </td>
                                    <td style={{padding:"10px 10px"}}>
                                      {displayStatus === "renewed" ? (
                                        <span style={{fontSize:10,background:C.sage+"22",color:C.sage,padding:"2px 8px",borderRadius:8,fontWeight:600}}>Renewed</span>
                                      ) : displayStatus === "pending" ? (
                                        <span style={{fontSize:10,background:C.blue+"22",color:C.blue,padding:"2px 8px",borderRadius:8,fontWeight:600}}>Pending</span>
                                      ) : displayStatus === "left" ? (
                                        <span style={{fontSize:10,background:C.rose+"22",color:C.rose,padding:"2px 8px",borderRadius:8,fontWeight:600}}>Left</span>
                                      ) : displayStatus === "leaving" ? (
                                        <span style={{fontSize:10,background:C.rose+"22",color:C.rose,padding:"2px 8px",borderRadius:8,fontWeight:600}}>Leaving</span>
                                      ) : (
                                        <span style={{fontSize:10,background:C.gold+"22",color:C.gold,padding:"2px 8px",borderRadius:8,fontWeight:600}}>Not Yet Started</span>
                                      )}
                                    </td>
                                    <td style={{padding:"10px 8px"}}>
                                      {(() => {
                                        if (!canopyConn) return <span style={{fontSize:10,color:C.muted}}>—</span>;
                                        const check = canopyData?.byEmail?.[e.email];
                                        if (!check) return <span style={{fontSize:9,color:C.muted,background:C.muted+"18",padding:"2px 6px",borderRadius:6}}>No Check</span>;
                                        const colors = { PASS: C.sage, FAIL: C.rose, CONDITIONAL: "#e09f3e", PENDING: C.gold, NOT_STARTED: C.muted, UNKNOWN: C.muted };
                                        const icons = { PASS: "✓", FAIL: "✗", CONDITIONAL: "⚠", PENDING: "◌", NOT_STARTED: "○", UNKNOWN: "?" };
                                        const labels = { PASS: "Pass", FAIL: "High Risk", CONDITIONAL: "Consider", PENDING: "In Progress", NOT_STARTED: "Not Started", UNKNOWN: "Unknown" };
                                        const c = colors[check.signal] || C.muted;
                                        return (
                                          <span title={`Canopy: ${check.rawStatus}${check.updatedAt ? ` (${new Date(check.updatedAt).toLocaleDateString("en-GB")})` : ""}`}
                                            style={{fontSize:10,background:c+"22",color:c,padding:"2px 8px",borderRadius:8,fontWeight:600,whiteSpace:"nowrap",cursor:"help"}}>
                                            {icons[check.signal]} {labels[check.signal]}
                                          </span>
                                        );
                                      })()}
                                    </td>
                                    <td style={{padding:"10px 6px"}}>
                                      <button onClick={() => toggleLeaving(e.roomStayId)} title={leavingSet.has(e.roomStayId) ? "Undo leaving" : "Mark as leaving"}
                                        style={{background:leavingSet.has(e.roomStayId)?C.sage+"22":C.rose+"22",color:leavingSet.has(e.roomStayId)?C.sage:C.rose,border:`1px solid ${leavingSet.has(e.roomStayId)?C.sage:C.rose}44`,borderRadius:6,padding:"4px 8px",cursor:"pointer",fontSize:10,fontWeight:600,whiteSpace:"nowrap"}}>
                                        {leavingSet.has(e.roomStayId) ? "↩ Undo" : "✗ Leaving"}
                                      </button>
                                    </td>
                                    <td style={{padding:"10px 6px",minWidth:140}}>
                                      {(leavingSet.has(e.roomStayId) || (e.expired && !e.isRenewed && !e.isPendingRenewal && !isManualPending)) ? (
                                        <select
                                          value={leavingReasons[e.roomStayId] || ""}
                                          onChange={(ev) => setLeavingReason(e.roomStayId, ev.target.value)}
                                          style={{background:C.bg,color:leavingReasons[e.roomStayId]?C.text:C.muted,border:`1px solid ${C.border}`,borderRadius:6,padding:"3px 6px",fontSize:10,cursor:"pointer",maxWidth:160,width:"100%",appearance:"auto"}}>
                                          <option value="">Select reason...</option>
                                          {LEAVING_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                                        </select>
                                      ) : (
                                        <span style={{fontSize:10,color:C.muted}}>—</span>
                                      )}
                                    </td>
                                    <td style={{padding:"10px 6px"}}>
                                      <button onClick={() => togglePending(e.roomStayId)} title={pendingSet.has(e.roomStayId) ? "Undo pending" : "Mark as pending renewal"}
                                        style={{background:pendingSet.has(e.roomStayId)?C.sage+"22":C.blue+"22",color:pendingSet.has(e.roomStayId)?C.sage:C.blue,border:`1px solid ${pendingSet.has(e.roomStayId)?C.sage:C.blue}44`,borderRadius:6,padding:"4px 8px",cursor:"pointer",fontSize:10,fontWeight:600,whiteSpace:"nowrap"}}>
                                        {pendingSet.has(e.roomStayId) ? "↩ Undo" : "◎ Pending"}
                                      </button>
                                    </td>
                                    <td style={{padding:"10px 6px"}}>
                                      {displayStatus !== "renewed" && displayStatus !== "left" && displayStatus !== "leaving" && (
                                        <button onClick={() => openSmsModal(e, "sms")} title="Send renewal SMS"
                                          style={{background:C.purple+"22",color:C.purple,border:`1px solid ${C.purple}44`,borderRadius:6,padding:"4px 8px",cursor:"pointer",fontSize:11,fontWeight:600}}>
                                          💬
                                        </button>
                                      )}
                                    </td>
                                    <td style={{padding:"10px 6px"}}>
                                      {displayStatus !== "renewed" && displayStatus !== "left" && displayStatus !== "leaving" && (
                                        <button onClick={() => openSmsModal(e, "email")} title="Send renewal email"
                                          style={{background:C.gold+"22",color:C.gold,border:`1px solid ${C.gold}44`,borderRadius:6,padding:"4px 8px",cursor:"pointer",fontSize:11,fontWeight:600}}>
                                          ✉
                                        </button>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                            );
                          })()}
                        </div>
                      )}
                    </div>
                  )}

                  {/* SMS / Email Modal */}
                  {smsModal && (
                    <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.6)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}
                      onClick={(ev) => { if (ev.target === ev.currentTarget) setSmsModal(null); }}>
                      <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:"24px 26px",maxWidth:560,width:"100%",maxHeight:"80vh",overflow:"auto"}} onClick={e => e.stopPropagation()}>
                        <h3 style={{fontSize:16,fontWeight:700,color:C.text,marginBottom:4}}>Send Renewal Message</h3>
                        <p style={{fontSize:12,color:C.muted,marginBottom:12}}>To: {smsModal.name} {smsModal.phone ? `(${smsModal.phone})` : ""} {smsModal.email ? `(${smsModal.email})` : ""}</p>

                        {/* Channel tabs */}
                        <div style={{display:"flex",gap:0,marginBottom:16,borderBottom:`1px solid ${C.border}`}}>
                          {[{k:"sms",label:"SMS",icon:"💬"},{k:"email",label:"Email",icon:"✉"}].map(ch => (
                            <button key={ch.k} onClick={() => { setMsgChannel(ch.k); setSmsResult(null); }}
                              style={{background:"transparent",border:"none",borderBottom:msgChannel===ch.k?`2px solid ${C.gold}`:"2px solid transparent",
                                color:msgChannel===ch.k?C.gold:C.muted,padding:"8px 18px",cursor:"pointer",fontSize:13,fontWeight:600,transition:"all 0.2s"}}>
                              {ch.icon} {ch.label}
                            </button>
                          ))}
                        </div>

                        {msgChannel === "sms" ? (
                          <textarea value={smsText} onChange={e => setSmsText(e.target.value)} placeholder="SMS message..."
                            style={{width:"100%",minHeight:120,background:C.bg,color:C.text,border:`1px solid ${C.border}`,borderRadius:8,padding:"10px 12px",fontSize:13,fontFamily:"'DM Sans',system-ui,sans-serif",resize:"vertical",boxSizing:"border-box"}}/>
                        ) : (
                          <div style={{display:"flex",flexDirection:"column",gap:10}}>
                            <input value={emailSubject} onChange={e => setEmailSubject(e.target.value)} placeholder="Subject line..."
                              style={{width:"100%",background:C.bg,color:C.text,border:`1px solid ${C.border}`,borderRadius:8,padding:"10px 12px",fontSize:13,fontFamily:"'DM Sans',system-ui,sans-serif",boxSizing:"border-box"}}/>
                            <textarea value={emailBody} onChange={e => setEmailBody(e.target.value)} placeholder="Email body..."
                              style={{width:"100%",minHeight:180,background:C.bg,color:C.text,border:`1px solid ${C.border}`,borderRadius:8,padding:"10px 12px",fontSize:13,fontFamily:"'DM Sans',system-ui,sans-serif",resize:"vertical",boxSizing:"border-box"}}/>
                          </div>
                        )}

                        <div style={{display:"flex",gap:8,marginTop:14,justifyContent:"flex-end",alignItems:"center"}}>
                          {smsResult === "sms_sent" && <span style={{fontSize:12,color:C.sage,marginRight:"auto"}}>✓ SMS sent successfully</span>}
                          {smsResult === "email_sent" && <span style={{fontSize:12,color:C.sage,marginRight:"auto"}}>✓ Email sent successfully</span>}
                          {smsResult && smsResult.startsWith("error:") && <span style={{fontSize:12,color:C.rose,marginRight:"auto"}}>{smsResult.slice(6)}</span>}
                          <button onClick={() => setSmsModal(null)} style={{background:"transparent",border:`1px solid ${C.border}`,color:C.muted,padding:"8px 16px",borderRadius:8,cursor:"pointer",fontSize:12}}>Cancel</button>
                          <button onClick={sendMessage} disabled={smsSending || (msgChannel==="sms" ? !smsText.trim() : !emailBody.trim() || !emailSubject.trim())}
                            style={{background:msgChannel==="sms"?C.purple:C.gold,color:"#fff",border:"none",padding:"8px 20px",borderRadius:8,cursor:smsSending?"wait":"pointer",fontSize:12,fontWeight:600,opacity:smsSending?0.6:1}}>
                            {smsSending ? "Sending…" : msgChannel==="sms" ? "Send SMS" : "Send Email"}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ── Room Availability — rooms becoming available from confirmed departures ── */}
                  {(() => {
                    const today = new Date();
                    const todayStr = today.toISOString().slice(0, 10);
                    // 3-month lookahead
                    const cutoff = new Date(today);
                    cutoff.setMonth(cutoff.getMonth() + 3);
                    const cutoffStr = cutoff.toISOString().slice(0, 10);

                    // Collect rooms from leaving/left entries across all months
                    const availableRooms = [];
                    monthStats.forEach(m => {
                      m.leaving.forEach(e => {
                        // Only future: end date >= today
                        if (e.endDate < todayStr) return;
                        // Within 3-month window
                        if (e.endDate > cutoffStr) return;
                        // Skip if this person actually renewed (safety check)
                        if (e.isRenewed) return;
                        // Available date = end date + 1 day (handover day)
                        const endD = new Date(e.endDate);
                        endD.setDate(endD.getDate() + 1);
                        const availableFrom = endD.toISOString().slice(0, 10);
                        // Skip non-residential units (parking, bike stores, etc.)
                        if (!e.roomType || e.roomType === "Other") return;
                        availableRooms.push({
                          room: e.room,
                          roomType: e.roomType,
                          availableFrom,
                          endDate: e.endDate,
                          name: e.name,
                          pcm: e.pcm,
                          roomStayId: e.roomStayId,
                          isManualLeaving: leavingSet.has(e.roomStayId),
                          reason: leavingReasons[e.roomStayId] || null,
                        });
                      });
                    });

                    // Cross-reference with all bookings to find next incoming booking per room
                    const allBk = rhAllBookings || [];
                    availableRooms.forEach(r => {
                      // Find bookings for the same room that start on or after this room becomes available
                      const roomName = r.room;
                      let nextBooking = null;
                      allBk.forEach(b => {
                        if (!b.unit?.name || b.unit.name !== roomName) return;
                        const bStart = (b.startDate || "").slice(0, 10);
                        const bStatus = (b.roomStayStatus || "").toUpperCase();
                        if (bStatus !== "CONFIRMED" && bStatus !== "PENDING" && bStatus !== "CHECKED_IN") return;
                        // Must start on or after the available date
                        if (bStart < r.availableFrom) return;
                        // Skip the departing person's own booking
                        if (b.roomStayId === r.roomStayId) return;
                        if (!nextBooking || bStart < nextBooking.start) {
                          nextBooking = {
                            start: bStart,
                            name: `${b.bookingContact?.firstName || ""} ${b.bookingContact?.lastName || ""}`.trim(),
                            status: bStatus,
                          };
                        }
                      });
                      if (nextBooking) {
                        const avail = new Date(r.availableFrom);
                        const nxt = new Date(nextBooking.start);
                        const gapDays = Math.round((nxt - avail) / 86400000);
                        r.nextBookingStart = nextBooking.start;
                        r.nextBookingName = nextBooking.name;
                        r.nextBookingStatus = nextBooking.status;
                        r.gapDays = gapDays;
                      } else {
                        r.gapDays = null; // No upcoming booking found — fully available
                      }
                    });

                    if (availableRooms.length === 0) return null;

                    // Group by room type
                    const byType = {};
                    availableRooms.forEach(r => {
                      if (!byType[r.roomType]) byType[r.roomType] = [];
                      byType[r.roomType].push(r);
                    });
                    // Sort each group by available date
                    Object.values(byType).forEach(arr => arr.sort((a, b) => a.availableFrom.localeCompare(b.availableFrom)));
                    // Sort room types by count (most rooms first)
                    const sortedTypes = Object.entries(byType).sort((a, b) => b[1].length - a[1].length);

                    return (
                      <div style={{marginTop:24}}>
                        <div style={{marginBottom:14}}>
                          <h3 style={{fontSize:18,fontWeight:700,color:C.text,marginBottom:4}}>Room Availability</h3>
                          <p style={{fontSize:12,color:C.muted}}>
                            Rooms becoming available in the next 3 months from confirmed departures.
                            {" "}<span style={{color:C.sage,fontSize:10}}>Live data — rooms disappear if the resident renews.</span>
                          </p>
                        </div>

                        <div style={{display:"flex",gap:10,marginBottom:16,flexWrap:"wrap"}}>
                          <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:"10px 16px"}}>
                            <p style={{fontSize:10,color:C.muted,textTransform:"uppercase",letterSpacing:"0.06em"}}>Total Rooms</p>
                            <p style={{fontSize:22,fontWeight:700,color:C.gold,fontFamily:"DM Mono,monospace"}}>{availableRooms.length}</p>
                          </div>
                          <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:"10px 16px"}}>
                            <p style={{fontSize:10,color:C.muted,textTransform:"uppercase",letterSpacing:"0.06em"}}>Room Types</p>
                            <p style={{fontSize:22,fontWeight:700,color:C.blue,fontFamily:"DM Mono,monospace"}}>{sortedTypes.length}</p>
                          </div>
                          <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:"10px 16px"}}>
                            <p style={{fontSize:10,color:C.muted,textTransform:"uppercase",letterSpacing:"0.06em"}}>Earliest Available</p>
                            <p style={{fontSize:14,fontWeight:700,color:C.sage,fontFamily:"DM Mono,monospace"}}>{new Date(availableRooms.sort((a,b) => a.availableFrom.localeCompare(b.availableFrom))[0].availableFrom).toLocaleDateString("en-GB",{day:"numeric",month:"short"})}</p>
                          </div>
                        </div>

                        {sortedTypes.map(([type, rooms]) => (
                          <div key={type} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:"14px 18px",marginBottom:10}}>
                            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                              <div style={{display:"flex",alignItems:"center",gap:10}}>
                                <span style={{fontSize:14,fontWeight:700,color:C.text}}>{type}</span>
                                <span style={{fontSize:10,background:C.gold+"22",color:C.gold,padding:"2px 8px",borderRadius:8,fontWeight:600}}>{rooms.length} room{rooms.length!==1?"s":""}</span>
                              </div>
                            </div>
                            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:8}}>
                              {rooms.map((r, i) => {
                                const hasNext = r.gapDays !== null;
                                const shortGap = hasNext && r.gapDays <= 28;
                                const borderColor = shortGap ? C.sage+"66" : hasNext ? C.gold+"66" : C.border;
                                return (
                                <div key={r.roomStayId || i} style={{background:C.bg,border:`1px solid ${borderColor}`,borderRadius:8,padding:"10px 12px",position:"relative"}}>
                                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                                    <span style={{fontSize:13,fontWeight:700,color:C.text}}>{r.room}</span>
                                    <span style={{fontSize:10,color:C.muted,fontFamily:"DM Mono,monospace"}}>£{r.pcm.toLocaleString()}/mo</span>
                                  </div>
                                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                                    <span style={{fontSize:11,color:C.sage,fontWeight:600}}>
                                      Available {new Date(r.availableFrom).toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"})}
                                    </span>
                                  </div>
                                  <div style={{marginTop:4,display:"flex",gap:4,alignItems:"center",flexWrap:"wrap"}}>
                                    <span style={{fontSize:9,color:C.muted}}>Departing: {r.name}</span>
                                    {r.reason && <span style={{fontSize:8,background:C.rose+"18",color:C.rose,padding:"1px 5px",borderRadius:4}}>{r.reason}</span>}
                                  </div>
                                  {hasNext && (
                                    <div style={{marginTop:6,padding:"4px 8px",borderRadius:6,background:shortGap ? C.sage+"12" : C.gold+"12",display:"flex",alignItems:"center",gap:6}}>
                                      <span style={{fontSize:9,fontWeight:700,color:shortGap ? C.sage : C.gold}}>
                                        {shortGap ? "⚡" : "📅"} Next booking in {r.gapDays} day{r.gapDays !== 1 ? "s" : ""}
                                      </span>
                                      <span style={{fontSize:8,color:C.muted}}>
                                        {r.nextBookingName} · {new Date(r.nextBookingStart + "T00:00:00").toLocaleDateString("en-GB",{day:"numeric",month:"short"})}
                                        {r.nextBookingStatus === "PENDING" && <span style={{color:C.gold,marginLeft:3}}>(Pending)</span>}
                                      </span>
                                    </div>
                                  )}
                                  {!hasNext && (
                                    <div style={{marginTop:6,padding:"4px 8px",borderRadius:6,background:C.rose+"10",display:"flex",alignItems:"center",gap:4}}>
                                      <span style={{fontSize:9,fontWeight:600,color:C.rose}}>No upcoming booking — fully available</span>
                                    </div>
                                  )}
                                </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}

                </div>
              );
            })()}
          </div>
        )}

        {/* ════ REPUTATION ════ */}
        {property==="southall"&&tab==="reputation"&&(
          <div style={{padding:"22px 26px"}}>
            <p style={{fontSize:11,color:C.muted,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:2}}>Brand Health{repLoading?" · loading…":""}</p>
            <h2 style={{fontSize:20,fontWeight:700,color:C.text,marginBottom:18}}>Reputation Score</h2>

            <div style={{display:"flex",gap:14,marginBottom:18,flexWrap:"wrap",alignItems:"center"}}>
              <div style={{flex:"0 0 auto",background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:24}}>
                <OccRing pct={reputationScore} color={reputationColor}/>
              </div>
              <div style={{flex:"1 1 220px",minWidth:0}}>
                <p style={{fontSize:11,color:C.muted,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:6}}>Composite Score</p>
                <p style={{fontSize:36,fontWeight:700,color:reputationColor,fontFamily:"DM Mono,monospace",marginBottom:4}}>{reputationScore}</p>
                <p style={{fontSize:12,color:C.muted}}>
                  {reputationScore>=80?"Excellent — strong brand presence":reputationScore>=60?"Good — solid reputation":reputationScore>=40?"Fair — room for improvement":"Poor — needs attention"}
                </p>
                <div style={{marginTop:10,display:"flex",gap:6}}>
                  <span style={{fontSize:10,background:reputationColor+"22",color:reputationColor,padding:"3px 8px",borderRadius:12}}>Weighted average</span>
                </div>
              </div>
            </div>

            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(240px, 1fr))",gap:12,marginBottom:16}}>
              {[
                {title:"Google My Business",rating:gmbRating,count:gmbCount,setRating:setGmbRating,setCount:setGmbCount,color:C.blue,icon:"🔍",live:repLive.google},
                {title:"Airbnb",rating:airbnbRating,count:airbnbCount,setRating:setAirbnbRating,setCount:setAirbnbCount,color:C.rose,icon:"🏠",live:repLive.airbnb},
                {title:"Trustpilot",rating:trustpilotRating,count:trustpilotCount,setRating:setTrustpilotRating,setCount:setTrustpilotCount,color:C.sage,icon:"⭐",live:repLive.trustpilot},
              ].map((p,i)=>(
                <div key={i} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:16}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                    <div>
                      <p style={{fontSize:11,color:C.muted,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:2}}>{p.icon} {p.title} <span style={{fontSize:9,color:p.live?C.sage:C.muted,marginLeft:4}}>{p.live?"● live":"○ manual"}</span></p>
                    </div>
                  </div>
                  <div style={{marginBottom:12}}>
                    <p style={{fontSize:28,fontWeight:700,color:p.color,fontFamily:"DM Mono,monospace",marginBottom:4}}>{p.rating.toFixed(1)}<span style={{fontSize:14,color:C.muted}}>/5</span></p>
                    <div style={{display:"flex",gap:2,marginBottom:8}}>
                      {[1,2,3,4,5].map(x=>(
                        <span key={x} style={{fontSize:16,opacity:x<=Math.floor(p.rating)?1:x<=p.rating?0.6:0.2}}>★</span>
                      ))}
                    </div>
                    <p style={{fontSize:12,color:C.muted}}>{p.count} reviews</p>
                  </div>
                </div>
              ))}
            </div>

            <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:16}}>
              <p style={{fontSize:11,color:C.muted,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:10}}>Online Mentions & Sentiment</p>
              <p style={{fontSize:12,color:C.muted,marginBottom:6}}>Reddit, forums, social media</p>
              <textarea value={mentions} onChange={e=>setMentions(e.target.value)} placeholder="Paste mentions here..." style={{width:"100%",background:C.bg,border:`1px solid ${C.border}`,color:C.text,borderRadius:8,padding:"10px 12px",fontSize:12,fontFamily:"DM Mono,monospace",minHeight:100,boxSizing:"border-box",resize:"vertical"}}/>
              <div style={{marginTop:10,display:"flex",gap:8,flexWrap:"wrap"}}>
                <span style={{fontSize:10,background:mentions.toLowerCase().includes("love")||mentions.toLowerCase().includes("great")?"#3d9e7522":"#1c202855",color:mentions.toLowerCase().includes("love")||mentions.toLowerCase().includes("great")?C.sage:C.muted,padding:"4px 10px",borderRadius:12}}>
                  Positive mentions: {mentions.split(" ").filter(w=>["love","great","amazing","best","excellent","perfect"].includes(w.toLowerCase())).length}
                </span>
                <span style={{fontSize:10,background:mentions.toLowerCase().includes("issue")||mentions.toLowerCase().includes("problem")?"#c95c5422":"#1c202855",color:mentions.toLowerCase().includes("issue")||mentions.toLowerCase().includes("problem")?C.rose:C.muted,padding:"4px 10px",borderRadius:12}}>
                  Negative mentions: {mentions.split(" ").filter(w=>["issue","problem","bad","awful","hate","disappointed"].includes(w.toLowerCase())).length}
                </span>
              </div>
            </div>

            <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:16,marginTop:16}}>
              <h3 style={{fontSize:"1rem",marginBottom:"12px"}}>Expert Recommendations</h3>
              <div style={{fontSize:"0.9rem",color:C.muted,lineHeight:"1.6"}}>
                <div style={{marginBottom:"8px"}}>• Continue optimizing Google & Meta campaigns for cost efficiency</div>
                <div style={{marginBottom:"8px"}}>• Increase landing page conversion focus to improve CPL</div>
                <div style={{marginBottom:"8px"}}>• Monitor villa application pipeline for completion rate</div>
                <div style={{marginBottom:"8px"}}>• Expand room inventory occupancy strategy</div>
                <div style={{marginBottom:"8px"}}>• ROADMAP: Integrate additional marketing channels for 2026</div>
              </div>
            </div>
          </div>
        )}


      {/* setSdTab("crm"), setSdTab("occupancy") - handled in button map above */}

      {/* SHOREDITCH MARKETING */}
      {property==="shoreditch"&&sdTab==="marketing"&&(
        <div style={{padding:"22px 26px"}}>
          <p style={{fontSize:11,color:C.muted,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:2}}>Shoreditch · {rangeLabel}{(sdGoogleIsLive||sdMetaIsLive)?" · live data":""}</p>
          <h2 style={{fontSize:20,fontWeight:700,color:C.text,marginBottom:18}}>Marketing Performance</h2>

          <div style={{display:"flex",gap:12,marginBottom:18,flexWrap:"wrap"}}>
            <KPI label="Total Spend" value={fmt(sdTotalSpend)} sub="Meta + Google" accent={C.gold}/>
            <KPI label="Avg CPL (Blended)" value={fmt(sdBlendedCpl,"£",2)} sub={`${sdTotalLeads} total leads`} accent={C.sage} badge="KEY"/>
            <KPI label="Google Spend" value={fmt(sdGSpend)} sub={`${sdGConvs} conversions`} accent={C.blue}/>
            <KPI label="Google Cost/Conv" value={fmt(sdGCPC,"£",2)} sub="Per conversion" accent={C.blue}/>
            <KPI label="Meta Spend" value={fmt(sdMetaSpend)} sub={`${sdMetaLeads} leads`} accent={C.gold}/>
            <KPI label="Meta CPL" value={fmt(sdMetaCpl,"£",2)} sub="Per lead" accent={C.sage}/>
          </div>

          <div style={{display:"flex",gap:14,marginBottom:16,flexWrap:"wrap"}}>
            <div style={{flex:"1 1 280px",minWidth:0,background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:"16px 16px 8px",overflowX:"auto"}}>
              <p style={{fontSize:11,color:C.muted,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:10}}>Daily Google Spend — Shoreditch (£){sdGoogleIsLive?" · live (excl. GMB)":""}</p>
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={sdGoogleDaily.map(r=>({d:r.date.slice(5),spend:r.spend,convs:r.convs}))} margin={{top:2,right:6,bottom:0,left:-8}}>
                  <defs>
                    <linearGradient id="gSD" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.blue} stopOpacity={0.25}/><stop offset="95%" stopColor={C.blue} stopOpacity={0}/></linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border}/>
                  <XAxis dataKey="d" tick={{fill:C.muted,fontSize:9}} tickLine={false} interval="preserveStartEnd"/>
                  <YAxis tick={{fill:C.muted,fontSize:9}} tickLine={false} axisLine={false} tickFormatter={v=>`£${v}`}/>
                  <Tooltip content={<Tip/>}/>
                  <Area type="monotone" dataKey="spend" name="Spend" stroke={C.blue} fill="url(#gSD)" strokeWidth={2} dot={false}/>
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Meta Ad Set Breakdown — Shoreditch */}
          {sdMetaIsLive && liveMetaData?.adsets && liveMetaData.adsets.length > 0 && (
            <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:16,marginBottom:16}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                <p style={{fontSize:11,color:C.muted,textTransform:"uppercase",letterSpacing:"0.08em"}}>Meta · Ad Set Breakdown · {rangeLabel} · live</p>
                <div style={{display:"flex",gap:6}}>
                  <span style={{fontSize:9,padding:"2px 8px",borderRadius:10,background:C.sage+"22",color:C.sage}}>Website Leads: {liveMetaData.totalWebsiteLeads ?? 0}</span>
                  <span style={{fontSize:9,padding:"2px 8px",borderRadius:10,background:C.gold+"22",color:C.gold}}>Meta Leads: {liveMetaData.totalMetaLeads ?? 0}</span>
                </div>
              </div>
              <table style={{width:"100%",fontSize:12,borderCollapse:"collapse"}}>
                <thead>
                  <tr style={{borderBottom:`1px solid ${C.border}`}}>
                    {["Ad Set","Spend","Website Leads","Meta Leads","Counted Leads","Lead Source","CPL"].map(h=>(
                      <th key={h} style={{textAlign:h==="Ad Set"?"left":"right",padding:"8px 10px",color:C.muted,fontWeight:500,fontSize:11}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...liveMetaData.adsets].sort((a,b)=>b.spend-a.spend).map((a,i)=>{
                    const isMetaOnly = a.leadType === "meta_leads_only";
                    return(
                      <tr key={i} style={{borderBottom:`1px solid ${C.border}22`}}>
                        <td style={{padding:"8px 10px",color:C.text,maxWidth:220,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
                          {a.name}
                          {isMetaOnly && <span style={{display:"block",fontSize:9,color:C.gold,background:C.gold+"18",padding:"1px 6px",borderRadius:6,width:"fit-content",marginTop:2}}>Meta leads only</span>}
                        </td>
                        <td style={{textAlign:"right",padding:"8px 10px",fontFamily:"DM Mono,monospace",color:C.text}}>{fmt(a.spend)}</td>
                        <td style={{textAlign:"right",padding:"8px 10px",fontFamily:"DM Mono,monospace",color:isMetaOnly?C.muted:C.text}}>
                          {isMetaOnly ? <span>{a.websiteLeads} <span style={{fontSize:9,color:C.rose}}>excluded</span></span> : a.websiteLeads}
                        </td>
                        <td style={{textAlign:"right",padding:"8px 10px",fontFamily:"DM Mono,monospace",color:isMetaOnly?C.gold:C.muted}}>{a.metaLeads}</td>
                        <td style={{textAlign:"right",padding:"8px 10px",fontFamily:"DM Mono,monospace",fontWeight:600,color:C.sage}}>{a.leads}</td>
                        <td style={{textAlign:"right",padding:"8px 10px"}}>
                          <span style={{fontSize:10,padding:"2px 8px",borderRadius:10,background:isMetaOnly?C.gold+"22":C.sage+"22",color:isMetaOnly?C.gold:C.sage}}>{isMetaOnly?"Meta form":"Website"}</span>
                        </td>
                        <td style={{textAlign:"right",padding:"8px 10px",fontFamily:"DM Mono,monospace",color:a.cpl>15?C.rose:C.sage}}>{fmt(a.cpl,"£",2)}</td>
                      </tr>
                    );
                  })}
                  <tr style={{borderTop:`1px solid ${C.border}`}}>
                    <td style={{padding:"8px 10px",color:C.muted,fontWeight:600}}>Total</td>
                    <td style={{textAlign:"right",padding:"8px 10px",fontFamily:"DM Mono,monospace",color:C.gold,fontWeight:600}}>{fmt(sdMetaSpend)}</td>
                    <td style={{textAlign:"right",padding:"8px 10px",fontFamily:"DM Mono,monospace",color:C.muted}}>{liveMetaData.totalWebsiteLeads ?? 0}</td>
                    <td style={{textAlign:"right",padding:"8px 10px",fontFamily:"DM Mono,monospace",color:C.muted}}>{liveMetaData.totalMetaLeads ?? 0}</td>
                    <td style={{textAlign:"right",padding:"8px 10px",fontFamily:"DM Mono,monospace",fontWeight:600,color:C.sage}}>{sdMetaLeads}</td>
                    <td/>
                    <td style={{textAlign:"right",padding:"8px 10px",fontFamily:"DM Mono,monospace",color:C.sage,fontWeight:600}}>{fmt(sdMetaCpl,"£",2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* Static Meta fallback when not live */}
          {!sdMetaIsLive && (
            <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:16,marginBottom:16}}>
              <p style={{fontSize:11,color:C.muted,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:12}}>Meta · {SD_META.campaign} · static</p>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(120px, 1fr))",gap:12}}>
                {[{l:"Campaign Spend",v:fmt(SD_META.spend),c:C.gold},{l:"Leads (period)",v:SD_META.leads,c:C.sage},{l:"Total Leads",v:SD_META.totalLeads,c:C.text},{l:"Link Clicks",v:SD_META.linkClicks,c:C.purple}].map((m,i)=>(
                  <div key={i} style={{background:C.bg,borderRadius:10,padding:"12px 14px",border:`1px solid ${C.border}`}}>
                    <p style={{fontSize:10,color:C.muted,marginBottom:4}}>{m.l}</p>
                    <p style={{fontSize:16,fontWeight:700,color:m.c,fontFamily:"DM Mono,monospace"}}>{m.v}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Performance Insights — Shoreditch (period comparison, source mix, device split, expert playbook) */}
          <PerformanceInsights analytics={sdAnalyticsData} propertyLabel="Shoreditch" />

          {/* Weekly Recommendations — Shoreditch */}
          {sdAnalyticsData?.weeklyInsights?.actions?.length > 0 && (
            <div style={{background:C.card,border:`1px solid ${C.sage}44`,borderRadius:12,padding:16,marginTop:16}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                <div>
                  <p style={{fontSize:11,color:C.muted,textTransform:"uppercase",letterSpacing:"0.08em"}}>Weekly Landing Page Recommendations · Shoreditch</p>
                  <p style={{fontSize:10,color:C.muted,marginTop:2}}>Data-driven actions based on this week vs last week performance</p>
                </div>
                <span style={{fontSize:9,padding:"2px 10px",borderRadius:10,background:C.sage+"22",color:C.sage}}>
                  {sdAnalyticsData.weeklyInsights.actions.filter(a=>a.priority==="high").length} high priority
                </span>
              </div>

              {sdAnalyticsData.weeklyInsights.trends && (
                <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:14}}>
                  {Object.entries(sdAnalyticsData.weeklyInsights.trends).filter(([,t])=>t.change!==null).map(([key, t]) => {
                    const labels = {sessions:"Sessions",confirmations:"Applications",bounceRate:"Bounce",engagementRate:"Engagement",convRate:"Conv Rate"};
                    const isGood = key==="bounceRate" ? t.change<0 : t.change>0;
                    const arrow = t.change > 2 ? "↑" : t.change < -2 ? "↓" : "→";
                    const color = t.change > 2 ? (isGood ? C.sage : C.rose) : t.change < -2 ? (isGood ? C.sage : C.rose) : C.muted;
                    return (
                      <div key={key} style={{background:color+"12",border:`1px solid ${color}33`,borderRadius:8,padding:"4px 10px",fontSize:10}}>
                        <span style={{color:C.muted}}>{labels[key] || key}</span>{" "}
                        <span style={{color,fontWeight:600}}>{arrow} {t.change > 0 ? "+" : ""}{t.change.toFixed(0)}%</span>
                      </div>
                    );
                  })}
                </div>
              )}

              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                {sdAnalyticsData.weeklyInsights.actions.map((item, i) => {
                  const priorityColors = { high: C.rose, medium: C.gold, low: C.muted, success: C.sage };
                  const priorityIcons = { high: "🔴", medium: "🟡", low: "💡", success: "✅" };
                  const bc = priorityColors[item.priority] || C.muted;
                  return (
                    <div key={i} style={{background:C.bg,border:`1px solid ${bc}33`,borderLeft:`3px solid ${bc}`,borderRadius:8,padding:"10px 14px"}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:4}}>
                        <div style={{display:"flex",alignItems:"center",gap:6}}>
                          <span style={{fontSize:12}}>{priorityIcons[item.priority]}</span>
                          <span style={{fontSize:12,color:C.text,fontWeight:600}}>{item.title}</span>
                        </div>
                        <div style={{display:"flex",gap:6,flexShrink:0}}>
                          <span style={{fontSize:9,padding:"2px 8px",borderRadius:8,background:bc+"18",color:bc}}>{item.priority}</span>
                          <span style={{fontSize:9,padding:"2px 8px",borderRadius:8,background:C.blue+"18",color:C.blue}}>{item.category}</span>
                        </div>
                      </div>
                      <p style={{fontSize:11,color:C.muted,lineHeight:1.5,marginBottom:4}}>{item.action}</p>
                      <p style={{fontSize:10,color:bc,fontFamily:"DM Mono,monospace"}}>{item.metric}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Google Ads Campaign Table — Shoreditch (live, excl GMB) */}
          {sdGoogleIsLive && sdLiveCampaigns.length > 0 && (
            <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:16,marginTop:16}}>
              <p style={{fontSize:11,color:C.muted,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:12}}>Google Ads · Shoreditch Campaigns · {rangeLabel} · live (excl. GMB)</p>
              <table style={{width:"100%",fontSize:12,borderCollapse:"collapse"}}>
                <thead>
                  <tr style={{borderBottom:`1px solid ${C.border}`}}>
                    {["Campaign","Type","Spend","Conversions","Avg CPC","Cost/Conv"].map(h=>(
                      <th key={h} style={{textAlign:h==="Campaign"?"left":"right",padding:"8px",color:C.muted,fontWeight:500,fontSize:11}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...sdLiveCampaigns].sort((a,b)=>b.spend-a.spend).map((c,i)=>{
                    const cpc = c.clicks > 0 ? c.spend/c.clicks : c.avgCPC || 0;
                    const costConv = c.convs > 0 ? c.spend/c.convs : 0;
                    return(
                      <tr key={i} style={{borderBottom:`1px solid ${C.border}22`}}>
                        <td style={{padding:"8px",color:C.text,maxWidth:200,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{c.name}</td>
                        <td style={{textAlign:"right",padding:"8px"}}><span style={{fontSize:10,background:c.type==="Search"?C.sage+"22":c.type==="Pmax"?C.gold+"22":C.purple+"22",color:c.type==="Search"?C.sage:c.type==="Pmax"?C.gold:C.purple,padding:"2px 8px",borderRadius:10}}>{c.type}</span></td>
                        <td style={{textAlign:"right",padding:"8px",color:C.text,fontFamily:"DM Mono,monospace"}}>{fmt(c.spend)}</td>
                        <td style={{textAlign:"right",padding:"8px",color:C.text,fontFamily:"DM Mono,monospace"}}>{c.convs}</td>
                        <td style={{textAlign:"right",padding:"8px",color:C.text,fontFamily:"DM Mono,monospace"}}>{fmt(cpc,"£",2)}</td>
                        <td style={{textAlign:"right",padding:"8px",color:costConv>20?C.rose:C.sage,fontFamily:"DM Mono,monospace"}}>{fmt(costConv,"£",2)}</td>
                      </tr>
                    );
                  })}
                  <tr style={{borderTop:`1px solid ${C.border}`}}>
                    <td style={{padding:"8px",color:C.muted,fontWeight:600}}>Total</td>
                    <td/>
                    <td style={{textAlign:"right",padding:"8px",color:C.gold,fontWeight:600,fontFamily:"DM Mono,monospace"}}>{fmt(sdGSpend)}</td>
                    <td style={{textAlign:"right",padding:"8px",color:C.gold,fontWeight:600,fontFamily:"DM Mono,monospace"}}>{sdGConvs}</td>
                    <td colSpan={2} style={{textAlign:"right",padding:"8px",color:C.muted,fontFamily:"DM Mono,monospace"}}>Avg: {fmt(sdGCPC,"£",2)}/conv</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* Landing Page Performance — Shoreditch */}
          {sdAnalyticsData && (
            <div style={{background:C.card,border:`1px solid ${C.blue}44`,borderRadius:12,padding:16,marginTop:16}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                <div>
                  <p style={{fontSize:11,color:C.muted,textTransform:"uppercase",letterSpacing:"0.08em"}}>Landing Page Performance · {rangeLabel} · live</p>
                  <p style={{fontSize:10,color:C.muted,marginTop:2}}>{sdAnalyticsData.landingPage}</p>
                </div>
                <span style={{fontSize:9,padding:"2px 10px",borderRadius:10,background:C.blue+"22",color:C.blue}}>GA4</span>
              </div>

              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(130px, 1fr))",gap:10,marginBottom:16}}>
                <div style={{background:C.bg,borderRadius:10,padding:"12px 14px",border:`1px solid ${C.border}`,borderTop:`2px solid ${C.blue}`}}>
                  <p style={{fontSize:10,color:C.muted,marginBottom:4}}>Sessions</p>
                  <p style={{fontSize:22,fontWeight:700,color:C.text,fontFamily:"DM Mono,monospace"}}>{sdAnalyticsData.summary.totalSessions.toLocaleString()}</p>
                  <p style={{fontSize:10,color:C.muted,marginTop:2}}>{sdAnalyticsData.summary.avgDailySessions.toFixed(0)}/day avg</p>
                </div>
                <div style={{background:C.bg,borderRadius:10,padding:"12px 14px",border:`1px solid ${C.border}`,borderTop:`2px solid ${sdAnalyticsData.summary.avgBounceRate>0.4?C.rose:sdAnalyticsData.summary.avgBounceRate>0.3?C.gold:C.sage}`}}>
                  <p style={{fontSize:10,color:C.muted,marginBottom:4}}>Bounce Rate</p>
                  <p style={{fontSize:22,fontWeight:700,color:sdAnalyticsData.summary.avgBounceRate>0.4?C.rose:sdAnalyticsData.summary.avgBounceRate>0.3?C.gold:C.sage,fontFamily:"DM Mono,monospace"}}>{(sdAnalyticsData.summary.avgBounceRate*100).toFixed(1)}%</p>
                </div>
                <div style={{background:C.bg,borderRadius:10,padding:"12px 14px",border:`1px solid ${C.border}`,borderTop:`2px solid ${sdAnalyticsData.summary.avgEngagementRate>=0.7?C.sage:sdAnalyticsData.summary.avgEngagementRate>=0.6?C.gold:C.rose}`}}>
                  <p style={{fontSize:10,color:C.muted,marginBottom:4}}>Engagement Rate</p>
                  <p style={{fontSize:22,fontWeight:700,color:sdAnalyticsData.summary.avgEngagementRate>=0.7?C.sage:C.gold,fontFamily:"DM Mono,monospace"}}>{(sdAnalyticsData.summary.avgEngagementRate*100).toFixed(1)}%</p>
                </div>
                <div style={{background:C.bg,borderRadius:10,padding:"12px 14px",border:`1px solid ${C.border}`,borderTop:`2px solid ${sdAnalyticsData.summary.overallConversionRate>=0.1?C.sage:sdAnalyticsData.summary.overallConversionRate>=0.05?C.gold:C.rose}`}}>
                  <p style={{fontSize:10,color:C.muted,marginBottom:4}}>Conversion Rate</p>
                  <p style={{fontSize:22,fontWeight:700,color:sdAnalyticsData.summary.overallConversionRate>=0.1?C.sage:sdAnalyticsData.summary.overallConversionRate>=0.05?C.gold:C.rose,fontFamily:"DM Mono,monospace"}}>{(sdAnalyticsData.summary.overallConversionRate*100).toFixed(1)}%</p>
                  <p style={{fontSize:10,color:C.muted,marginTop:2}}>{sdAnalyticsData.summary.totalConfirmations} applications</p>
                </div>
                <div style={{background:C.bg,borderRadius:10,padding:"12px 14px",border:`1px solid ${C.border}`,borderTop:`2px solid ${C.purple}`}}>
                  <p style={{fontSize:10,color:C.muted,marginBottom:4}}>Unique Visitors</p>
                  <p style={{fontSize:22,fontWeight:700,color:C.purple,fontFamily:"DM Mono,monospace"}}>{sdAnalyticsData.summary.totalUsers.toLocaleString()}</p>
                  <p style={{fontSize:10,color:C.muted,marginTop:2}}>{sdAnalyticsData.summary.sessionsPerUser?.toFixed(1)} sessions/user</p>
                </div>
                <div style={{background:C.bg,borderRadius:10,padding:"12px 14px",border:`1px solid ${C.border}`,borderTop:`2px solid ${sdAnalyticsData.summary.applicationsPerUser>=0.08?C.sage:sdAnalyticsData.summary.applicationsPerUser>=0.05?C.gold:C.rose}`}}>
                  <p style={{fontSize:10,color:C.muted,marginBottom:4}}>Applications/Visitor</p>
                  <p style={{fontSize:22,fontWeight:700,color:sdAnalyticsData.summary.applicationsPerUser>=0.08?C.sage:sdAnalyticsData.summary.applicationsPerUser>=0.05?C.gold:C.rose,fontFamily:"DM Mono,monospace"}}>{(sdAnalyticsData.summary.applicationsPerUser*100).toFixed(1)}%</p>
                  <p style={{fontSize:10,color:C.muted,marginTop:2}}>{sdAnalyticsData.summary.totalConfirmations} from {sdAnalyticsData.summary.totalUsers.toLocaleString()} visitors</p>
                </div>
              </div>

              {sdAnalyticsData.daily && sdAnalyticsData.daily.length > 0 && (
                <div style={{height:180,marginBottom:16}}>
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={sdAnalyticsData.daily.map(d=>{const dt=new Date(d.date);return{d:`${dt.getDate()}/${dt.getMonth()+1}`,sessions:d.sessions,bounceRate:Math.round(d.bounceRate*100),convRate:Math.round(d.conversionRate*1000)/10,confirmations:d.confirmations};})} margin={{top:5,right:20,left:0,bottom:5}}>
                      <CartesianGrid strokeDasharray="3 3" stroke={C.border}/>
                      <XAxis dataKey="d" tick={{fill:C.muted,fontSize:9}} tickLine={false} interval="preserveStartEnd"/>
                      <YAxis yAxisId="l" tick={{fill:C.blue,fontSize:9}} tickLine={false} axisLine={false}/>
                      <YAxis yAxisId="r" orientation="right" tick={{fill:C.sage,fontSize:9}} tickLine={false} axisLine={false} tickFormatter={v=>`${v}%`}/>
                      <Tooltip content={({active,payload,label})=>{
                        if(!active||!payload?.length) return null;
                        return <div style={{background:"#13161b",border:`1px solid ${C.border}`,borderRadius:8,padding:"10px 14px",fontSize:12}}>
                          <p style={{color:C.muted,marginBottom:6,fontFamily:"monospace"}}>{label}</p>
                          {payload.map((p,i)=><p key={i} style={{color:p.color,margin:"2px 0"}}>{p.name}: <strong>{p.name.includes("Rate")?`${p.value}%`:p.value}</strong></p>)}
                        </div>;
                      }}/>
                      <Bar yAxisId="l" dataKey="sessions" name="Sessions" fill={C.blue} radius={[2,2,0,0]} opacity={0.6}/>
                      <Line yAxisId="r" type="monotone" dataKey="convRate" name="Conv Rate" stroke={C.sage} strokeWidth={2} dot={false}/>
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              )}

              {sdAnalyticsData.recommendations && sdAnalyticsData.recommendations.length > 0 && (
                <div>
                  <p style={{fontSize:10,color:C.muted,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:8}}>Recommendations</p>
                  <div style={{display:"flex",flexDirection:"column",gap:6}}>
                    {sdAnalyticsData.recommendations.map((rec,i) => {
                      const icon = rec.type==="warning" ? "⚠️" : rec.type==="success" ? "✅" : "💡";
                      const borderColor = rec.type==="warning" ? C.rose : rec.type==="success" ? C.sage : C.gold;
                      return (
                        <div key={i} style={{background:C.bg,border:`1px solid ${borderColor}33`,borderLeft:`3px solid ${borderColor}`,borderRadius:8,padding:"8px 12px",fontSize:11}}>
                          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:2}}>
                            <span style={{color:C.text,fontWeight:600}}>{icon} {rec.metric}: {rec.value}</span>
                            <span style={{fontSize:9,color:borderColor,background:borderColor+"18",padding:"1px 6px",borderRadius:8}}>{rec.priority}</span>
                          </div>
                          <p style={{color:C.muted,lineHeight:1.4}}>{rec.message}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* SHOREDITCH CRM */}
      {property==="shoreditch"&&sdTab==="crm"&&(
        <div style={{padding:"22px 26px"}}>
          <p style={{fontSize:11,color:C.muted,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:2}}>Shoreditch · {rangeLabel}</p>
          <h2 style={{fontSize:20,fontWeight:700,color:C.text,marginBottom:18}}>Pipeline — Villa Applications</h2>
          {!sdGhlConn&&sdGhlLoading&&<p style={{fontSize:13,color:C.muted}}>Connecting to GHL…</p>}
          {!sdGhlConn&&!sdGhlLoading&&!sdGhlError&&<p style={{fontSize:13,color:C.muted}}>Loading pipeline data…</p>}
          {sdGhlError&&<div style={{color:C.rose,marginTop:8,padding:"10px 14px",background:C.rose+"18",border:`1px solid ${C.rose}33`,borderRadius:8,fontSize:12}}>{sdGhlError}</div>}
          {sdGhlConn&&sdGhlData&&(
            <div>
              <div style={{display:"flex",gap:12,marginBottom:18,flexWrap:"wrap"}}>
                <KPI label="Total Opportunities" value={sdGhlData.totalOpps} sub="All stages" accent={C.purple}/>
                <KPI label="Applied" value={sdGhlData.applied} sub={sdGhlData.appliedStageName||"Applied stage"} accent={C.sage}/>
                <KPI label="Pipeline" value={sdGhlData.pipelineName} sub="Active pipeline" accent={C.gold}/>
              </div>
              <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:16}}>
                <p style={{fontSize:11,color:C.muted,marginBottom:6}}>Stages: {sdGhlData.stages.map(s=>s.name).join(" → ")}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SHOREDITCH OCCUPANCY */}
      {property==="shoreditch"&&sdTab==="occupancy"&&(
        <div style={{padding:"22px 26px"}}>
          <p style={{fontSize:11,color:C.muted,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:2}}>Shoreditch · {SD_VILLAS} villas · {SD_BEDROOMS} bedrooms</p>
          <h2 style={{fontSize:20,fontWeight:700,color:C.text,marginBottom:18}}>Room Occupancy</h2>

          <div style={{display:"flex",gap:12,marginBottom:18,flexWrap:"wrap"}}>
            <KPI label="Total Rooms" value={sdOcc.t} accent={C.gold}/>
            <KPI label="Occupied" value={sdOcc.o} accent={C.sage}/>
            <KPI label="Vacant" value={sdOcc.v} accent={C.rose}/>
            <KPI label="Incoming" value={sdOcc.i} accent={C.blue}/>
            <KPI label="Current Occupancy" value={`${sdOcc.pct}%`} accent={C.gold}/>
            <KPI label="Future Occupancy" value={`${sdOcc.fut}%`} sub="incl. incoming" accent={C.sage}/>
          </div>

          {/* TARGET TRACKER — 90% by 1st July */}
          <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:"18px 20px",marginBottom:18}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12,flexWrap:"wrap",gap:8}}>
              <div>
                <p style={{fontSize:11,color:C.muted,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:2}}>Occupancy Target</p>
                <p style={{fontSize:18,fontWeight:700,color:C.text}}>{sdOcc.targetPct}% by 1st July 2026</p>
              </div>
              <div style={{textAlign:"right"}}>
                <p style={{fontSize:24,fontWeight:700,color:sdOcc.roomsNeeded===0?C.sage:C.gold,fontFamily:"DM Mono,monospace"}}>{sdOcc.roomsPerWeek}</p>
                <p style={{fontSize:11,color:C.muted}}>rooms/week needed</p>
              </div>
            </div>
            <div style={{height:8,background:C.border,borderRadius:4,overflow:"hidden",marginBottom:10}}>
              <div style={{height:"100%",background:`linear-gradient(90deg, ${C.sage}, ${C.gold})`,borderRadius:4,width:`${Math.min(100,Math.round((sdOcc.o+sdOcc.i)/sdOcc.targetRooms*100))}%`,transition:"width 0.5s ease"}}/>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:C.muted}}>
              <span>{sdOcc.o+sdOcc.i} / {sdOcc.targetRooms} rooms filled (incl. incoming)</span>
              <span>{sdOcc.weeksLeft} weeks remaining · {sdOcc.roomsNeeded} rooms to go</span>
            </div>
          </div>

          <div style={{display:"flex",gap:24,justifyContent:"center",marginBottom:24}}>
            <OccRing pct={sdOcc.pct} color={C.gold} label="Current Occupancy"/>
            <OccRing pct={sdOcc.fut} color={C.sage} label="Future Occupancy"/>
          </div>

          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:12}}>
            {sdFlats.map((flat,fi)=>(
              <div key={fi} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:"12px 14px"}}>
                <p style={{fontSize:12,fontWeight:700,color:C.text,marginBottom:8}}>{flat.name}</p>
                <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                  {flat.rooms.map((room,ri)=>{
                    const colors={OCCUPIED:C.sage,VACANT:C.rose,INCOMING:C.blue};
                    return <button key={ri} onClick={()=>sdToggleRoom(fi,ri)} style={{padding:"4px 8px",background:colors[room.s]+"33",color:colors[room.s],border:`1px solid ${colors[room.s]}55`,borderRadius:6,cursor:"pointer",fontSize:11,fontWeight:600,fontFamily:"DM Mono,monospace"}}>{room.id}</button>;
                  })}
                </div>
              </div>
            ))}
          </div>

          <div style={{display:"flex",gap:12,marginTop:16,justifyContent:"center",alignItems:"center",flexWrap:"wrap"}}>
            <span style={{fontSize:10,color:C.sage,background:C.sage+"22",padding:"3px 10px",borderRadius:12}}>● Occupied</span>
            <span style={{fontSize:10,color:C.rose,background:C.rose+"22",padding:"3px 10px",borderRadius:12}}>● Vacant</span>
            <span style={{fontSize:10,color:C.blue,background:C.blue+"22",padding:"3px 10px",borderRadius:12}}>● Incoming</span>
            <span style={{fontSize:10,color:sdFlatsSync==="cloud"?C.sage:sdFlatsSync==="saving"?C.gold:sdFlatsSync==="error"?C.rose:C.muted,marginLeft:12}}>
              {sdFlatsSync==="loading"&&"◌ Loading…"}
              {sdFlatsSync==="cloud"&&`● Synced${sdFlatsUpdatedAt?" · "+new Date(sdFlatsUpdatedAt).toLocaleString("en-GB",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"}):""}`}
              {sdFlatsSync==="saving"&&"◌ Saving…"}
              {sdFlatsSync==="error"&&"⚠ Sync failed (using local)"}
              {sdFlatsSync==="local"&&"◌ Local only (KV not configured)"}
            </span>
            <button onClick={()=>{if(confirm("Reset Shoreditch occupancy to defaults? This will clear saved changes across all devices.")){localStorage.removeItem("sd_flats_v1");setSdFlats(SD_FLATS.map(f=>({...f,rooms:f.rooms.map(r=>({...r}))})));}}} style={{fontSize:10,color:C.muted,background:"transparent",border:`1px solid ${C.border}`,padding:"3px 10px",borderRadius:12,cursor:"pointer"}}>Reset to defaults</button>
          </div>
        </div>
      )}

      <div style={{padding:"10px 26px",borderTop:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:4}}>
          <p style={{fontSize:10,color:C.muted}}>Meta 296625156418426 · Google Ads 635-731-8686 · GHL {GHL_LOCATION} · Res Harmonics</p>
          <p style={{fontSize:10,color:C.muted}}>Southall &soul · {new Date().toLocaleDateString("en-GB")}</p>
        </div>
      </div>
    </>
  );
}
