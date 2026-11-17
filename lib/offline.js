// Offline-room register for the simple dashboard (mirrors OFFLINE_ROOMS in pages/index.js).
export const BEDS = 302;
export const OFFLINE_UNLISTED = 0;
export const OFFLINE_ROOMS = [
  // Source: Room Availability Tracker (Planner export 16.11.2026) — 12 rooms "In progress"
  { room: "12",   category: "Structural",  reason: "Lift motor in room",                        from: "2026-01-01", until: "2031-12-31", note: "Permanently offline — 24/7 access needed" },
  { room: "210",  category: "Staff room",  reason: "Non-bookable staff room (FOC)",             from: "2026-09-28", until: "2026-12-31", note: "" },
  { room: "216",  category: "Maintenance", reason: "Bathroom leak",                             from: "2026-11-16", until: "2026-11-19", note: "" },
  { room: "308",  category: "Staff room",  reason: "Non-bookable staff room (FOC)",             from: "2026-07-20", until: "2026-12-31", note: "" },
  { room: "325",  category: "Deluxe Duo",  reason: "Deluxe Duo",                                from: "2026-06-22", until: "2026-12-31", note: "" },
  { room: "404",  category: "Maintenance", reason: "AC issue (blowing warm air)",               from: "2026-04-22", until: "2026-11-30", note: "" },
  { room: "405",  category: "Legal",       reason: "Ongoing legal case (occupant)",             from: "2025-12-19", until: "2026-12-31", note: "" },
  { room: "506",  category: "Staff room",  reason: "Non-bookable staff room (FOC)",             from: "2026-07-20", until: "2026-12-31", note: "" },
  { room: "606",  category: "Maintenance", reason: "Window leak and shower tray",               from: "2026-10-23", until: "2026-12-31", note: "" },
  { room: "627",  category: "Linen room",  reason: "Linen room — lift contingency",             from: "2025-10-13", until: "2026-12-31", note: "" },
  { room: "727",  category: "Linen room",  reason: "Linen room — lift contingency",             from: "2026-07-31", until: "2026-12-31", note: "" },
  { room: "1104", category: "Staff room",  reason: "Non-bookable staff room (FOC)",             from: "2026-07-20", until: "2026-12-31", note: "" },
  // 13 offline confirmed by Leyth (16 Nov 2026); the tracker names 12, so the 13th has no room number yet
  { room: "TBC",  category: "To confirm",  reason: "13th offline room, number to be confirmed", from: "2026-11-16", until: "2026-12-31", note: "" },
];
