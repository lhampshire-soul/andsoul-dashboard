import Head from "next/head";
import { useState, useEffect, useCallback, useMemo } from "react";
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
  // Group stays by contactId to detect consecutive bookings
  const contactStays = {};
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
  });

  // Build a set of roomStayIds that are renewals or room moves (not genuinely new)
  const renewalRoomStays = new Set();
  const roomMoveRoomStays = new Set();
  Object.values(contactStays).forEach(stays => {
    if (stays.length < 2) return;
    const sorted = stays.sort((a,b) => a.dateFrom.localeCompare(b.dateFrom));
    for (let i = 1; i < sorted.length; i++) {
      const prev = sorted[i-1];
      const curr = sorted[i];
      const gap = (new Date(curr.dateFrom) - new Date(prev.dateTo)) / 864e5;
      if (gap >= -1 && gap <= 7) { // consecutive or overlapping
        if (prev.unitId === curr.unitId) {
          renewalRoomStays.add(curr.roomStayId); // renewal — same room
        } else {
          roomMoveRoomStays.add(curr.roomStayId); // room move — different room
        }
      }
    }
  });

  // Build a set of roomStayIds that checked back in after checkout (not true departures)
  // A check-out is "not real" if the same contact checks back in within 7 days
  const notRealCheckouts = new Set();
  Object.values(contactStays).forEach(stays => {
    if (stays.length < 2) return;
    const sorted = stays.sort((a,b) => a.dateFrom.localeCompare(b.dateFrom));
    for (let i = 0; i < sorted.length - 1; i++) {
      const curr = sorted[i];
      const next = sorted[i+1];
      if (curr.status === "CHECKED_OUT" || curr.dateTo) {
        const gap = (new Date(next.dateFrom) - new Date(curr.dateTo)) / 864e5;
        if (gap >= -1 && gap <= 7) {
          notRealCheckouts.add(curr.roomStayId); // this person checked back in
        }
      }
    }
  });

  // ── In House count (CHECKED_IN, deduplicated by roomStayId) ──
  const checkedInRooms = new Set();
  allGuestStays.forEach(g => {
    if ((g.status ?? "").toUpperCase() === "CHECKED_IN") checkedInRooms.add(g.roomStayId);
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
  const FORECAST_MONTHS = 7; // Mar through Sep
  for (let m = 0; m < FORECAST_MONTHS; m++) {
    const d = new Date(nowDate.getFullYear(), nowDate.getMonth() + m, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
    const label = d.toLocaleDateString("en-GB", { month: "short", year: "numeric" });
    const daysInMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    forecastMonths.push({ key, label, daysInMonth });
  }

  const currentMonthKey = forecastMonths[0].key;

  for (let m = 0; m < FORECAST_MONTHS; m++) {
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

      // === OCCUPANCY (booked days): only active stays ===
      // (CHECKED_OUT stays in future months mean early departure — room is available)
      if (!["CHECKED_IN", "CONFIRMED", "PENDING"].includes(status)) return;
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
    if (!["CHECKED_IN", "CONFIRMED", "PENDING"].includes(status)) return;
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

  return {
    occupied: inHouseCount,
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

  const opps = await fetchAllOpps(pipeline.id, dateFrom, dateTo);

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
  };
}

// ─── RES HARMONICS — routes through /api/rh (server-side, no CORS issues) ───
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

  // GHL
  const [ghlLoading, setGhlLoad] = useState(false);
  const [ghlError,   setGhlErr]  = useState("");
  const [ghlData,    setGhlData] = useState(null);
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
  const [forecastRenewalRate, setForecastRenewalRate] = useState(75);
  const [forecastNewPerMonth, setForecastNewPerMonth] = useState(20);
  const [salesCycleDays, setSalesCycleDays] = useState(47);
  const [rateAdjustments, setRateAdjustments] = useState({});

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
      let allUnits = [];
      try { allUnits = await rhFetchAll(tok, "/api/v3/units"); } catch(e) {}

      const metrics = computePmsMetrics(allGuestStays, allBookings, allUnits);
      setPmsData(metrics);
      console.log("PMS silent refresh complete");
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
      let allUnits = [];
      try { allUnits = await rhFetchAll(tok, "/api/v3/units"); } catch(e) { console.log("units error:", e.message); }

      const metrics = computePmsMetrics(allGuestStays, allBookings, allUnits);
      console.log(`RH: occupied=${metrics.occupied}, checkIns=${metrics.checkInsWeek}, checkOuts=${metrics.checkOutsWeek}, monthRev=${metrics.revenue}, awr=${metrics.globalAwr}`);
      setPmsData(metrics);
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
  const [sdFlats, setSdFlats] = useState(SD_FLATS.map(f=>({...f,rooms:f.rooms.map(r=>({...r}))})));
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
  const sdGSpend = sdGoogleIsLive && sdLiveGoogleData ? sdLiveGoogleData.totalSpend : sdGoogleFiltered.reduce((s,r)=>s+r.spend,0);
  const sdGConvs = sdGoogleIsLive && sdLiveGoogleData ? sdLiveGoogleData.totalConversions : sdGoogleFiltered.reduce((s,r)=>s+r.convs,0);
  const sdGCPC = sdGConvs>0?sdGSpend/sdGConvs:0;
  const sdLiveCampaigns = sdGoogleIsLive && sdLiveGoogleData?.campaigns ? sdLiveGoogleData.campaigns : [];
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
          <input type="date" value={from} onChange={e=>{setFrom(e.target.value);setPreset(null);}} style={dinp}/>
          <span style={{fontSize:11,color:C.muted}}>→</span>
          <input type="date" value={to} onChange={e=>{setTo(e.target.value);setPreset(null);}} style={dinp}/>
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
          {property==="southall"&&<>{tabBtn("marketing","Marketing")}{tabBtn("crm","CRM Pipeline",ghlConn?C.purple:null)}{tabBtn("bookings","Occupancy")}{tabBtn("reputation","Reputation")}</>}
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
                    <p style={{fontSize:12,color:C.muted}}>rooms occupied today</p>
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
                        <th style={{textAlign:"right",padding:"8px 10px",color:C.muted,fontWeight:600,fontSize:10,textTransform:"uppercase"}}>Rooms / {BEDS}</th>
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
                <p style={{fontSize:12,color:C.muted,marginBottom:14}}>Adjust renewal rate and new bookings to project future occupancy</p>

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
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                      <span style={{fontSize:12,color:C.muted}}>Sales cycle</span>
                      <span style={{fontSize:13,fontWeight:700,color:C.blue,fontFamily:"DM Mono,monospace"}}>{salesCycleDays}d</span>
                    </div>
                    <input type="range" min={0} max={90} value={salesCycleDays} onChange={e=>setSalesCycleDays(+e.target.value)} style={{width:"100%",accentColor:C.blue}}/>
                    <p style={{fontSize:10,color:C.muted,marginTop:2}}>Days from booking to move-in (avg 47d current · target 30d)</p>
                  </div>
                </div>

                {/* Predicted occupancy table + bars — computed once, used by both */}
                {(() => {
                  // ── PREDICTION MODEL (CUMULATIVE) ──
                  // Key insight: new bookings and renewals from previous months STAY —
                  // if 20 people move in during April, they're still there in May, June, July...
                  // Similarly, if someone renews in May, they persist in June, July, August...
                  //
                  // For each month i (1..5):
                  //   predictedDays = confirmedDays
                  //     + carryover from previous months' extras (full month each)
                  //     + this month's renewals (~half month, they renew mid-month on avg)
                  //     + this month's new move-ins (full month)
                  //   predictedRooms = confirmedRooms + cumulative extra rooms
                  //
                  // cumulativeExtraRooms accumulates: each month adds its renewals + new,
                  // and all previous months' extras carry forward.

                  // Sales cycle: new bookings take X days before moving in
                  // moveInDelay = full months of delay, partialOffset = days into the move-in month
                  const moveInDelay = Math.floor(salesCycleDays / 30);
                  const partialOffset = salesCycleDays % 30;

                  const predRows = [];
                  let cumulativeExtraRooms = 0; // rooms from renewals + moved-in new from all previous months

                  for (let i = 0; i < pmsData.forecast.length; i++) {
                    const fm = pmsData.forecast[i];
                    const actualDays = fm.bookedDays || 0;
                    const totalDays = fm.totalBookableDays || (BEDS * 30);
                    const dim = fm.daysInMonth || 30;
                    const confirmedRooms = fm.activeStays || 0;

                    if (i === 0) {
                      const pct = totalDays > 0 ? Math.round((actualDays / totalDays) * 100) : 0;
                      predRows.push({ ...fm, renewalCount: 0, newBooked: 0, newMoveIns: 0, carryover: 0, predictedDays: actualDays, predictedPct: pct, actualPct: pct, confirmedRooms, predictedRooms: confirmedRooms });
                      continue;
                    }

                    // This month's leavers and renewals (immediate — they already live here)
                    const leaving = fm.checkOuts || 0;
                    const renewalCount = Math.round(leaving * forecastRenewalRate / 100);

                    // New bookings: signed this month, but move in after sales cycle delay
                    // Bookings from month j move in during month (j + moveInDelay)
                    // In month i, we receive move-ins from bookings made in month (i - moveInDelay)
                    const bookedMonthAgo = i - moveInDelay;
                    const newMoveIns = bookedMonthAgo >= 1 ? forecastNewPerMonth : 0;

                    // Days from carry-forward: previous months' settled extras stay full month
                    const carryoverDays = cumulativeExtraRooms * dim;
                    // This month's renewals: they renew mid-month on avg, so ~half month of extra days
                    const renewalDays = renewalCount * Math.round(dim / 2);
                    // New move-ins this month: they arrive partialOffset days into the month
                    const newMoveInDays = newMoveIns * Math.max(0, dim - partialOffset);

                    const predictedDays = Math.min(totalDays, actualDays + carryoverDays + renewalDays + newMoveInDays);
                    const predictedPct = totalDays > 0 ? Math.round((predictedDays / totalDays) * 100) : 0;
                    const actualPct = totalDays > 0 ? Math.round((actualDays / totalDays) * 100) : 0;

                    // Predicted rooms = confirmed + all accumulated extras + this month's additions
                    const predictedRooms = Math.min(BEDS, confirmedRooms + cumulativeExtraRooms + renewalCount + newMoveIns);

                    predRows.push({ ...fm, renewalCount, newBooked: forecastNewPerMonth, newMoveIns, carryover: cumulativeExtraRooms, predictedDays, predictedPct, actualPct, confirmedRooms, predictedRooms });

                    // Accumulate for next month: renewals (immediate) + new move-ins (just arrived)
                    cumulativeExtraRooms += renewalCount + newMoveIns;
                  }

                  return (<>
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
                        <th style={{textAlign:"right",padding:"8px 10px",color:C.muted,fontWeight:600,fontSize:10,textTransform:"uppercase"}}>Rooms / {BEDS}</th>
                        <th style={{textAlign:"right",padding:"8px 10px",color:C.muted,fontWeight:600,fontSize:10,textTransform:"uppercase"}}>Predicted Occ.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {predRows.map((r, i) => (
                        <tr key={r.key} style={{borderBottom:`1px solid ${C.border}`,background:i===0?C.gold+"0a":"transparent"}}>
                          <td style={{padding:"8px 10px",color:i===0?C.text:C.muted,fontWeight:i===0?700:400}}>{r.label}{i===0?" (actual)":""}</td>
                          <td style={{padding:"8px 10px",textAlign:"right",fontFamily:"DM Mono,monospace",color:C.text}}>{(r.bookedDays||0).toLocaleString()} <span style={{color:C.muted,fontSize:10}}>/ {(r.totalBookableDays||0).toLocaleString()}</span></td>
                          <td style={{padding:"8px 10px",textAlign:"right",fontFamily:"DM Mono,monospace",color:C.rose}}>{r.checkOuts||0}</td>
                          <td style={{padding:"8px 10px",textAlign:"right",fontFamily:"DM Mono,monospace",color:C.sage}}>{i===0?"-":r.renewalCount}</td>
                          <td style={{padding:"8px 10px",textAlign:"right",fontFamily:"DM Mono,monospace",color:C.gold}}>{i===0?"-":`+${r.newBooked}`}</td>
                          <td style={{padding:"8px 10px",textAlign:"right",fontFamily:"DM Mono,monospace",color:r.newMoveIns>0?C.blue:C.muted}}>{i===0?"-":r.newMoveIns>0?`+${r.newMoveIns}`:<span style={{fontSize:9}}>({salesCycleDays}d wait)</span>}</td>
                          <td style={{padding:"8px 10px",textAlign:"right",fontFamily:"DM Mono,monospace",color:C.purple}}>{i===0?"-":r.carryover>0?`+${r.carryover}`:"-"}</td>
                          <td style={{padding:"8px 10px",textAlign:"right",fontFamily:"DM Mono,monospace",color:C.text,fontWeight:600}}>{r.predictedDays.toLocaleString()}</td>
                          <td style={{padding:"8px 10px",textAlign:"right",fontFamily:"DM Mono,monospace",color:C.text}}>
                            <span style={{fontWeight:700}}>{r.predictedRooms}</span>
                            <span style={{color:C.muted,fontWeight:400}}> / {BEDS}</span>
                            {i > 0 && r.predictedRooms !== r.confirmedRooms && (
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

          <div style={{display:"flex",gap:12,marginTop:16,justifyContent:"center"}}>
            <span style={{fontSize:10,color:C.sage,background:C.sage+"22",padding:"3px 10px",borderRadius:12}}>● Occupied</span>
            <span style={{fontSize:10,color:C.rose,background:C.rose+"22",padding:"3px 10px",borderRadius:12}}>● Vacant</span>
            <span style={{fontSize:10,color:C.blue,background:C.blue+"22",padding:"3px 10px",borderRadius:12}}>● Incoming</span>
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
