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
  { name:"Google My Business | Southall", spend: 238, convs: 8, avgCPC:0.23, type:"GMB"   },
  { name:"Southall - Performance Max",    spend:  54, convs: 1, avgCPC:0.62, type:"Pmax"  },
  { name:"Southall - Local Pmax",         spend: 906, convs:42, avgCPC:0.62, type:"Pmax"  },
  { name:"&Soul - Southall Video",        spend:  98, convs: 3, avgCPC:0.88, type:"Video" },
];

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

// ─── GHL SETTINGS ─────────────────────────────────────────────────────────────
const GHL_LOCATION = "PwquLuIhIjj0D80e6jLU";
const GHL_PIPELINE = "Southall &Soul";
const TAG_TOUR     = "tour booked";
const STAGE_BOOKED = "booking confirmed";

// ─── GHL API — routes through /api/ghl (server-side, no CORS issues) ──────────
async function ghlGet(path) {
  // The path is passed as a query param to our Next.js serverless function
  const res = await fetch(`/api/ghl?path=${encodeURIComponent(path)}`);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    // Build a detailed error message for debugging
    const msg  = data?.error ?? data?.message ?? data?.msg ?? JSON.stringify(data).slice(0,200) ?? `HTTP ${res.status}`;
    if (res.status === 401) throw new Error("GHL 401: Invalid API key — check your environment variable.");
    if (res.status === 403) throw new Error("GHL 403: Forbidden — key may not have access to this location.");
    if (res.status === 422) throw new Error(`GHL 422: ${msg} — Path: ${path}`);
    throw new Error(`GHL ${res.status}: ${msg}`);
  }
  return res.json();
}

async function fetchAllOpps(pipelineId, dateFrom, dateTo) {
  // Try minimal params first, then add dates if that works
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
    // Cursor-based pagination
    startAfter   = res?.meta?.startAfter   ?? res?.startAfter   ?? null;
    startAfterId = res?.meta?.startAfterId ?? res?.startAfterId ?? null;
    const total  = res?.meta?.total ?? res?.total ?? opps.length;
    if (all.length >= total || opps.length === 0 || !startAfter) break;
    safety++;
  }
  // Filter dates client-side for reliability
  if (dateFrom || dateTo) {
    all = all.filter(o => {
      const d = (o.createdAt ?? o.dateAdded ?? o.created_at ?? "").slice(0,10);
      if (!d) return true;
      if (dateFrom && d < dateFrom) return false;
      if (dateTo && d > dateTo) return false;
      return true;
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

  // Find "Tour Booked" stage
  const tourStage = stages.find(s => s.name?.trim().toLowerCase() === TAG_TOUR.toLowerCase())
    ?? stages.find(s => s.name?.toLowerCase().includes("tour"));

  // Find "Booking Confirmed" stage
  const bookedStage = stages.find(s => s.name?.trim().toLowerCase() === STAGE_BOOKED.toLowerCase())
    ?? stages.find(s => s.name?.toLowerCase().includes("booking confirmed"))
    ?? stages.find(s => s.name?.toLowerCase().includes("booking"));

  const opps = await fetchAllOpps(pipeline.id, dateFrom, dateTo);

  // Tours = opportunities in the "Tour Booked" pipeline stage (or tagged)
  const tours = opps.filter(o => {
    const inTourStage = tourStage ? o.pipelineStageId === tourStage.id : false;
    const hasTag = (o.tags??[]).some(t => t.toLowerCase().trim() === TAG_TOUR.toLowerCase());
    return inTourStage || hasTag;
  });

  // Confirmed = opportunities in "Booking Confirmed" stage (with or without Won status)
  const confirmed = opps.filter(o => {
    const inBookedStage = bookedStage
      ? o.pipelineStageId === bookedStage.id
      : (o.pipelineStage?.name ?? o.stage?.name ?? "").toLowerCase().includes("booking");
    // Count if in the right stage — don't require Won status as some may not be marked
    const won = (o.status??"").toLowerCase() === "won";
    return inBookedStage || (won && inBookedStage);
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

// Fetch ALL pages from a Spring Boot paginated endpoint
async function rhFetchAll(tok, basePath, maxPages=50) {
  let all = [];
  let page = 0;
  while (page < maxPages) {
    const sep = basePath.includes("?") ? "&" : "?";
    const data = await rhFetch(tok, `${basePath}${sep}page=${page}&size=100`);
    const content = data.content ?? data.data ?? data.results ?? (Array.isArray(data) ? data : []);
    all = all.concat(content);
    // Check pagination info
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
  <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:"18px 20px",borderTop:`2px solid ${accent}`,flex:1,minWidth:0,position:"relative"}}>
    {badge&&<span style={{position:"absolute",top:10,right:12,fontSize:10,color:accent,background:accent+"22",padding:"2px 8px",borderRadius:20}}>{badge}</span>}
    <p style={{color:C.muted,fontSize:10,letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:6}}>{label}</p>
    <p style={{fontSize:26,fontWeight:700,color:C.text,fontFamily:"'DM Mono',monospace",letterSpacing:"-0.02em"}}>{value}</p>
    {sub&&<p style={{fontSize:11,color:C.muted,marginTop:4}}>{sub}</p>}
  </div>
);

const OccRing = ({pct}) => {
  const r=42,c=2*Math.PI*r,d=(pct/100)*c;
  return <svg width={110} height={110} viewBox="0 0 100 100">
    <circle cx="50" cy="50" r={r} fill="none" stroke={C.border} strokeWidth="9"/>
    <circle cx="50" cy="50" r={r} fill="none" stroke={C.gold} strokeWidth="9" strokeDasharray={`${d} ${c}`} strokeDashoffset={c*0.25} strokeLinecap="round" style={{transition:"stroke-dasharray 0.5s ease"}}/>
    <text x="50" y="47" textAnchor="middle" fill={C.text} fontSize="15" fontWeight="700" fontFamily="DM Mono,monospace">{pct}%</text>
    <text x="50" y="61" textAnchor="middle" fill={C.muted} fontSize="8">occupancy</text>
  </svg>;
};

const PRESETS=[{l:"7d",d:7},{l:"14d",d:14},{l:"30d",d:30}];
const dinp={background:C.card,border:`1px solid ${C.border}`,color:C.text,borderRadius:8,padding:"5px 10px",fontSize:12,fontFamily:"DM Mono,monospace"};

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [tab, setTab] = useState("marketing");
  const [preset, setPreset] = useState(30);
  const [from, setFrom] = useState("2026-02-11");
  const [to,   setTo]   = useState("2026-03-12");

  useEffect(()=>{
    if(!preset) return;
    const end=new Date("2026-03-12"), start=new Date(end);
    start.setDate(end.getDate()-preset+1);
    setFrom(start.toISOString().slice(0,10));
    setTo("2026-03-12");
  },[preset]);

  const rangeLabel = preset ? `Last ${preset}d` : `${from} → ${to}`;

  const metaRows  = useMemo(()=>META_DAILY.filter(r=>r.iso>=from&&r.iso<=to),[from,to]);
  const chartData = useMemo(()=>metaRows.map(r=>({d:r.d,meta:r.spend,google:GOOGLE_DAILY_SPEND[r.iso]??0,leads:r.leads,cpl:r.cpl})),[metaRows]);
  const metaSpend = metaRows.reduce((s,r)=>s+r.spend,0);
  const metaLeads = metaRows.reduce((s,r)=>s+r.leads,0);
  const metaCpl   = metaLeads>0 ? metaSpend/metaLeads : 0;
  const gSpend    = metaRows.reduce((s,r)=>s+(GOOGLE_DAILY_SPEND[r.iso]??0),0);
  const gConvs    = GOOGLE_CAMPAIGNS.reduce((s,c)=>s+c.convs,0);

  // GHL
  const [ghlLoading, setGhlLoad] = useState(false);
  const [ghlError,   setGhlErr]  = useState("");
  const [ghlData,    setGhlData] = useState(null);
  const [ghlConn,    setGhlConn] = useState(false);

  const runGHL = useCallback(async(f,t)=>{
    setGhlLoad(true); setGhlErr("");
    try { setGhlData(await loadGHL(f,t)); setGhlConn(true); }
    catch(e) { setGhlErr(e.message); }
    finally { setGhlLoad(false); }
  },[]);

  useEffect(()=>{ if(ghlConn) runGHL(from,to); },[from,to]);

  // PMS
  const [cid,setCid]=useState(""), [csec,setCsec]=useState("");
  const [pmsLoad,setPmsLoad]=useState(false), [pmsErr,setPmsErr]=useState("");
  const [pmsConn,setPmsConn]=useState(false), [pmsData,setPmsData]=useState(null);
  const [mOcc,setMOcc]=useState(72), [mRate,setMRate]=useState(1450);
  const [mBook,setMBook]=useState(14), [mRen,setMRen]=useState(18), [mChurn,setMChurn]=useState(4);
  const BEDS=300;
  const occupied  = pmsConn&&pmsData ? pmsData.occupied : Math.round(BEDS*mOcc/100);
  const occPct    = pmsConn&&pmsData ? pmsData.occupancyPct : mOcc;
  const monthRev  = pmsConn&&pmsData ? pmsData.revenue : occupied*mRate;
  const weekRev   = pmsConn&&pmsData ? (pmsData.weeklyRevenue??0) : 0;
  const renewRate = (mRen+mChurn)>0 ? Math.round(mRen/(mRen+mChurn)*100) : 0;

  const [pmsDebug, setPmsDebug] = useState(null);

  const connectPMS = useCallback(async()=>{
    if(!cid||!csec){setPmsErr("Enter both fields.");return;}
    setPmsLoad(true);setPmsErr("");setPmsDebug(null);
    try{
      const tok=await getRHToken(cid,csec);
      const today = new Date().toISOString().slice(0,10);
      const mthStart = today.slice(0,7) + "-01";
      const wkStart = new Date(Date.now()-7*864e5).toISOString().slice(0,10);
      const debug = [];

      // ── 1. Fetch ALL guestStays (paginated) for in-house / check-in / confirmed ──
      debug.push("Fetching /api/v3/guestStays (all pages)...");
      let allGuestStays = [];
      try { allGuestStays = await rhFetchAll(tok, "/api/v3/guestStays"); } catch(e) { debug.push(`guestStays error: ${e.message}`); }
      debug.push(`guestStays: ${allGuestStays.length} total records`);

      // Also fetch ALL bookings for revenue + additional occupancy data
      debug.push("Fetching /api/v3/bookings (all pages)...");
      let allBookings = [];
      try { allBookings = await rhFetchAll(tok, "/api/v3/bookings"); } catch(e) { debug.push(`bookings error: ${e.message}`); }
      debug.push(`bookings: ${allBookings.length} total records`);

      // Fetch units for total room/bed count
      debug.push("Fetching /api/v3/units (all pages)...");
      let allUnits = [];
      try { allUnits = await rhFetchAll(tok, "/api/v3/units"); } catch(e) { debug.push(`units error: ${e.message}`); }
      debug.push(`units: ${allUnits.length} total records`);

      // Fetch financials for revenue
      debug.push("Fetching /api/v3/financials (all pages)...");
      let allFinancials = [];
      try { allFinancials = await rhFetchAll(tok, "/api/v3/financials"); } catch(e) { debug.push(`financials error: ${e.message}`); }
      debug.push(`financials: ${allFinancials.length} total records`);

      // ── 2. Count occupied guests from guestStays ──
      // Log all unique status values to understand the data
      const gsStatuses = {};
      allGuestStays.forEach(g => {
        const s = g.status ?? g.stayStatus ?? g.roomStayStatus ?? g.state ?? "unknown";
        gsStatuses[s] = (gsStatuses[s]||0) + 1;
      });
      debug.push(`guestStay statuses: ${JSON.stringify(gsStatuses)}`);

      // Count ONLY CHECKED_IN guests — this is the accurate occupancy number
      const checkedInGuests = allGuestStays.filter(g => {
        const status = (g.status ?? g.stayStatus ?? g.roomStayStatus ?? g.state ?? "").toString().toUpperCase();
        return status === "CHECKED_IN";
      });
      const inHouseCount = checkedInGuests.length;
      debug.push(`CHECKED_IN guests: ${inHouseCount}`);

      // ── 4. Total units ──
      const totalUnits = allUnits.length || BEDS;
      debug.push(`Total units: ${totalUnits}`);

      // ── 5. Revenue from financials ──
      // Log sample financial record to understand structure
      if (allFinancials.length > 0) {
        debug.push(`Financial sample keys: ${Object.keys(allFinancials[0]).join(", ")}`);
        debug.push(`Financial sample: ${JSON.stringify(allFinancials[0]).slice(0,300)}`);
      }

      // Revenue from bookings — using netAmount field (confirmed from debug)
      // Bookings have: startDate, endDate, netAmount, vatAmount, roomStayStatus
      const sumBookingRevenue = (bookings, dateFrom, dateTo) => {
        return bookings.reduce((sum, b) => {
          const bDate = b.startDate ?? b.checkInDate ?? b.arrivalDate ?? b.createdDate ?? "";
          if (dateFrom && bDate && bDate < dateFrom) return sum;
          if (dateTo && bDate && bDate > dateTo) return sum;
          const v = parseFloat(b.netAmount ?? b.grossAmount ?? b.totalAmount ?? b.amount ?? b.vatAmount ?? 0);
          return sum + (isNaN(v) ? 0 : v);
        }, 0);
      };

      // Revenue from financials — using gross/net fields (confirmed from debug)
      const sumFinancials = (records, dateFrom, dateTo) => {
        return records.filter(f => {
          if (f.financialType !== "SALES_INVOICE") return false; // Only count sales
          const fDate = f.dateCreated ?? "";
          if (dateFrom && fDate && fDate < dateFrom) return false;
          if (dateTo && fDate && fDate > dateTo) return false;
          return true;
        }).reduce((sum, f) => {
          const v = parseFloat(f.gross ?? f.net ?? f.amountPaid ?? 0);
          return sum + (isNaN(v) ? 0 : v);
        }, 0);
      };

      const monthlyRevBkg = sumBookingRevenue(allBookings, mthStart, today);
      const weeklyRevBkg = sumBookingRevenue(allBookings, wkStart, today);
      const monthlyRevFin = sumFinancials(allFinancials, mthStart, today);
      const weeklyRevFin = sumFinancials(allFinancials, wkStart, today);

      // Use bookings revenue as primary (it's working), financials as fallback
      const monthlyRev = monthlyRevBkg > 0 ? monthlyRevBkg : monthlyRevFin;
      const weeklyRev = weeklyRevBkg > 0 ? weeklyRevBkg : weeklyRevFin;

      debug.push(`Revenue (bookings): month £${monthlyRevBkg.toFixed(0)}, week £${weeklyRevBkg.toFixed(0)}`);
      debug.push(`Revenue (financials/invoices): month £${monthlyRevFin.toFixed(0)}, week £${weeklyRevFin.toFixed(0)}`);
      debug.push(`Final revenue: month £${monthlyRev.toFixed(0)}, week £${weeklyRev.toFixed(0)}`);

      setPmsDebug(debug);
      setPmsData({
        occupied: inHouseCount,
        total: totalUnits,
        occupancyPct: Math.round(inHouseCount / BEDS * 100),
        revenue: monthlyRev,
        weeklyRevenue: weeklyRev,
        newThisWeek: 0,
        rawBookings: inHouseCount,
      });
      setPmsConn(true);
    }catch(e){setPmsErr(`Failed: ${e.message}`);}
    finally{setPmsLoad(false);}
  },[cid,csec]);

  const tabBtn=(t,label,dot)=>(
    <button onClick={()=>setTab(t)} style={{padding:"9px 22px",border:"none",cursor:"pointer",fontWeight:600,fontSize:12,letterSpacing:"0.06em",textTransform:"uppercase",borderRadius:8,transition:"all 0.2s",display:"flex",alignItems:"center",gap:6,background:tab===t?C.gold:"transparent",color:tab===t?"#000":C.muted}}>
      {dot&&<span style={{width:6,height:6,borderRadius:"50%",background:dot,flexShrink:0}}/>}
      {label}
    </button>
  );

  return (
    <>
      <Head>
        <title>Southall · The House — Dashboard</title>
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
              <p style={{fontWeight:700,fontSize:15,color:C.text}}>Southall · The House</p>
              <p style={{fontSize:11,color:C.muted}}>Performance dashboard</p>
            </div>
          </div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            <span style={{background:"#d4a84322",color:C.gold,padding:"3px 10px",borderRadius:20,fontSize:11}}>● Meta</span>
            <span style={{background:"#3d82c422",color:C.blue,padding:"3px 10px",borderRadius:20,fontSize:11}}>● Google Ads</span>
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
          <input type="date" value={from} min="2026-02-11" max="2026-03-12" onChange={e=>{setFrom(e.target.value);setPreset(null);}} style={dinp}/>
          <span style={{fontSize:11,color:C.muted}}>→</span>
          <input type="date" value={to}   min="2026-02-11" max="2026-03-12" onChange={e=>{setTo(e.target.value);setPreset(null);}}   style={dinp}/>
          <span style={{marginLeft:"auto",fontSize:11,color:C.gold,fontFamily:"DM Mono,monospace"}}>{from} → {to}</span>
        </div>

        {/* TABS */}
        <div style={{padding:"10px 26px 0",display:"flex",gap:6,borderBottom:`1px solid ${C.border}`}}>
          {tabBtn("marketing","Marketing")}
          {tabBtn("crm","CRM Pipeline",ghlConn?C.purple:null)}
          {tabBtn("bookings","Occupancy")}
        </div>

        {/* ════ MARKETING ════ */}
        {tab==="marketing"&&(
          <div style={{padding:"22px 26px"}}>
            <p style={{fontSize:11,color:C.muted,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:2}}>Southall only · {rangeLabel} · form submit leads only</p>
            <h2 style={{fontSize:20,fontWeight:700,color:C.text,marginBottom:18}}>Marketing Performance</h2>

            <div style={{display:"flex",gap:12,marginBottom:18,flexWrap:"wrap"}}>
              <KPI label="Total Spend"         value={fmt(metaSpend+gSpend)}  sub="Meta + Google · Southall"         accent={C.gold}/>
              <KPI label="Meta Spend"          value={fmt(metaSpend)}          sub={`${metaLeads} lead form submits`} accent={C.gold}/>
              <KPI label="Meta Avg CPL"        value={fmt(metaCpl,"£",2)}      sub="Per lead form submit"             accent={C.sage}/>
              <KPI label="Google Spend"        value={fmt(gSpend)}             sub="Filtered period"                  accent={C.blue}/>
              <KPI label="Google Form Submits" value={gConvs}                  sub="GTM tag · 30d fixed"              accent={C.blue}/>
            </div>

            <div style={{display:"flex",gap:14,marginBottom:16,flexWrap:"wrap"}}>
              <div style={{flex:1.6,minWidth:280,background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:"16px 16px 8px"}}>
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
              <div style={{flex:1,minWidth:220,background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:"16px 16px 8px"}}>
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

            <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:16}}>
              <p style={{fontSize:11,color:C.muted,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:12}}>Google Ads · Southall Campaigns · 30d · GTM form submits only</p>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
                <thead><tr style={{borderBottom:`1px solid ${C.border}`}}>
                  {["Campaign","Type","Spend","Form Submits","Avg CPC","Cost/Submit"].map(h=>(
                    <th key={h} style={{padding:"5px 10px",textAlign:"left",color:C.muted,fontWeight:500,fontSize:10,textTransform:"uppercase",letterSpacing:"0.06em"}}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {[...GOOGLE_CAMPAIGNS].sort((a,b)=>b.spend-a.spend).map((c,i)=>{
                    const max=Math.max(...GOOGLE_CAMPAIGNS.map(x=>x.spend));
                    const cpc2=c.convs>0?c.spend/c.convs:null;
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
                  <td style={{padding:"9px 10px",fontFamily:"DM Mono,monospace",color:C.gold,fontWeight:700}}>{fmt(GOOGLE_CAMPAIGNS.reduce((s,c)=>s+c.spend,0))}</td>
                  <td style={{padding:"9px 10px",fontFamily:"DM Mono,monospace",color:C.gold,fontWeight:700}}>{gConvs}</td>
                  <td colSpan={2} style={{padding:"9px 10px",fontFamily:"DM Mono,monospace",color:C.muted}}>Avg: {fmt(GOOGLE_CAMPAIGNS.reduce((s,c)=>s+c.spend,0)/gConvs,"£",2)}/submit</td>
                </tr></tfoot>
              </table>
            </div>
          </div>
        )}

        {/* ════ CRM ════ */}
        {tab==="crm"&&(
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
                  <KPI label="Bookings Confirmed"       value={ghlData.confirmed}      sub={`Won · Stage: "${ghlData.bookedStageName??STAGE_BOOKED}"`} accent={C.sage}   badge={rangeLabel}/>
                  <KPI label="Confirmed Pipeline Value" value={ghlData.confirmedValue>0?fmt(ghlData.confirmedValue):"£0"} sub="Total value of Won + Booking Confirmed" accent={C.gold}/>
                  <KPI label="Tour → Booking Rate"      value={ghlData.convRate!=null?`${ghlData.convRate}%`:"—"} sub="Confirmed ÷ Tours booked"       accent={ghlData.convRate==null?C.muted:ghlData.convRate>=30?C.sage:ghlData.convRate>=15?C.gold:C.rose}/>
                </div>

                <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:20,marginBottom:14}}>
                  <p style={{fontSize:11,color:C.muted,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:14}}>Sales Funnel</p>
                  <div style={{display:"flex",alignItems:"stretch",gap:8,flexWrap:"wrap"}}>
                    {[
                      {label:"Total Opps",    value:ghlData.totalOpps,   color:C.blue,   pct:100},
                      {label:"Tours Booked",  value:ghlData.toursBooked, color:C.purple, pct:ghlData.totalOpps>0?Math.round(ghlData.toursBooked/ghlData.totalOpps*100):0},
                      {label:"Confirmed Won", value:ghlData.confirmed,   color:C.sage,   pct:ghlData.totalOpps>0?Math.round(ghlData.confirmed/ghlData.totalOpps*100):0},
                    ].map((s,i)=>(
                      <div key={i} style={{flex:1,minWidth:100,display:"flex",alignItems:"center",gap:6}}>
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
        {tab==="bookings"&&(
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

            {/* DEBUG PANEL — always visible when debug data exists */}
            {pmsDebug&&pmsDebug.length>0&&(
              <div style={{marginBottom:18,background:"#0a0c10",border:`1px solid ${C.border}`,borderRadius:8,padding:12,maxHeight:300,overflow:"auto"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                  <p style={{fontSize:10,color:C.gold,textTransform:"uppercase",letterSpacing:"0.08em"}}>API Debug Log</p>
                  <button onClick={()=>setPmsDebug(null)} style={{background:"transparent",border:`1px solid ${C.border}`,color:C.muted,borderRadius:4,padding:"2px 8px",fontSize:9,cursor:"pointer"}}>Hide</button>
                </div>
                {pmsDebug.map((line,i)=>(
                  <p key={i} style={{fontSize:10,fontFamily:"DM Mono,monospace",color:line.includes("error")?C.rose:line.includes("Final")||line.includes("sample")?C.gold:C.sage,marginBottom:2,wordBreak:"break-all"}}>{line}</p>
                ))}
              </div>
            )}

            <div style={{display:"flex",gap:14,marginBottom:16,flexWrap:"wrap"}}>
              <div style={{flex:1.5,minWidth:250,background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:20,borderTop:`2px solid ${C.gold}`}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                  <div>
                    <p style={{color:C.muted,fontSize:10,textTransform:"uppercase",letterSpacing:"0.1em"}}>The House · Southall</p>
                    <p style={{color:C.text,fontSize:17,fontWeight:700,marginTop:4}}>{pmsConn ? `${occupied} checked in` : `${occupied} / ${BEDS} beds`} {pmsConn&&<span style={{fontSize:10,color:C.sage}}>● live</span>}</p>
                  </div>
                  <OccRing pct={occPct}/>
                </div>
                {!pmsConn&&(<>
                  <div style={{marginBottom:12}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><span style={{fontSize:12,color:C.muted}}>Occupancy % (manual)</span><span style={{fontSize:12,color:C.gold,fontFamily:"DM Mono,monospace"}}>{mOcc}%</span></div>
                    <input type="range" min={0} max={100} value={mOcc} onChange={e=>setMOcc(+e.target.value)} style={{width:"100%",accentColor:C.gold}}/>
                  </div>
                  <div style={{marginBottom:12}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}><span style={{fontSize:12,color:C.muted}}>Avg monthly rent</span><span style={{fontSize:12,color:C.gold,fontFamily:"DM Mono,monospace"}}>£{mRate.toLocaleString()}</span></div>
                    <input type="number" value={mRate} onChange={e=>setMRate(+e.target.value)} style={{width:"100%",background:C.bg,border:`1px solid ${C.border}`,color:C.text,borderRadius:8,padding:"7px 10px",fontSize:13,boxSizing:"border-box"}}/>
                  </div>
                </>)}
                <div style={{background:C.bg,borderRadius:8,padding:"10px 14px",display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                  <span style={{fontSize:13,color:C.muted}}>{pmsConn ? "Revenue this month" : "Est. monthly revenue"}</span>
                  <span style={{fontSize:16,fontWeight:700,color:C.gold,fontFamily:"DM Mono,monospace"}}>{fmt(monthRev)}</span>
                </div>
                {pmsConn&&<div style={{background:C.bg,borderRadius:8,padding:"10px 14px",display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                  <span style={{fontSize:13,color:C.muted}}>Revenue this week</span>
                  <span style={{fontSize:16,fontWeight:700,color:C.sage,fontFamily:"DM Mono,monospace"}}>{fmt(weekRev)}</span>
                </div>}
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                  <span style={{fontSize:11,color:C.muted}}>Target 95% ({Math.round(BEDS*.95)} beds)</span>
                  <span style={{fontSize:11,color:occPct>=95?C.sage:C.rose}}>{occPct>=95?"✓ Hit":`${Math.round(BEDS*.95)-occupied} to go`}</span>
                </div>
                <div style={{height:6,background:C.border,borderRadius:3,position:"relative"}}>
                  <div style={{height:6,background:occPct>=95?C.sage:C.gold,borderRadius:3,width:`${Math.min(occPct,100)}%`,transition:"width 0.4s"}}/>
                  <div style={{position:"absolute",top:-2,left:"95%",height:10,width:2,background:C.muted,borderRadius:1}}/>
                </div>
              </div>

              <div style={{flex:1,minWidth:200,background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:20}}>
                <p style={{fontSize:11,color:C.muted,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:12}}>Booking Activity {pmsConn?<span style={{color:C.sage}}>· live</span>:"· manual"}</p>
                {pmsConn&&pmsData?(
                  <div style={{display:"flex",flexDirection:"column",gap:10}}>
                    {[{label:"Checked in",value:pmsData.occupied,color:C.gold},{label:"Revenue this month",value:fmt(monthRev),color:C.sage},{label:"Revenue this week",value:fmt(weekRev),color:C.text}].map(x=>(
                      <div key={x.label} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:`1px solid ${C.border}`}}>
                        <span style={{fontSize:13,color:C.muted}}>{x.label}</span>
                        <span style={{fontSize:14,fontWeight:700,color:x.color,fontFamily:"DM Mono,monospace"}}>{x.value}</span>
                      </div>
                    ))}
                  </div>
                ):(
                  <div style={{display:"flex",flexDirection:"column",gap:10}}>
                    {[{label:"New bookings this week",val:mBook,set:setMBook,max:50,color:C.sage},{label:"Renewals this month",val:mRen,set:setMRen,max:50,color:C.sage},{label:"Move-outs / churn",val:mChurn,set:setMChurn,max:30,color:C.rose}].map(x=>(
                      <div key={x.label}>
                        <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}><span style={{fontSize:12,color:C.muted}}>{x.label}</span><span style={{fontSize:13,fontWeight:700,color:x.color,fontFamily:"DM Mono,monospace"}}>{x.val}</span></div>
                        <input type="range" min={0} max={x.max} value={x.val} onChange={e=>x.set(+e.target.value)} style={{width:"100%",accentColor:x.color}}/>
                      </div>
                    ))}
                    <div style={{background:C.bg,borderRadius:8,padding:"7px 12px",display:"flex",justifyContent:"space-between"}}>
                      <span style={{fontSize:12,color:C.muted}}>Renewal rate</span>
                      <span style={{fontSize:13,fontWeight:700,fontFamily:"DM Mono,monospace",color:renewRate>=80?C.sage:renewRate>=60?C.gold:C.rose}}>{renewRate}%</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:18}}>
              <p style={{fontSize:11,color:C.muted,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:12}}>Revenue Scenarios</p>
              <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
                {[{label:"Current",pct:occPct,rev:occupied*mRate},{label:"75%",pct:75,rev:Math.round(BEDS*.75)*mRate},{label:"85%",pct:85,rev:Math.round(BEDS*.85)*mRate},{label:"95% target",pct:95,rev:Math.round(BEDS*.95)*mRate}].map((s,i)=>(
                  <div key={i} style={{flex:1,minWidth:120,background:C.bg,borderRadius:10,padding:"12px 14px",border:`1px solid ${s.pct===95?C.sage:C.border}`}}>
                    <p style={{fontSize:11,color:C.muted,marginBottom:5}}>{s.label}</p>
                    <p style={{fontSize:20,fontWeight:700,color:s.pct===occPct?C.gold:s.pct===95?C.sage:C.text,fontFamily:"DM Mono,monospace"}}>{fmt(s.rev)}</p>
                    <p style={{fontSize:10,color:C.muted,marginTop:3}}>{s.pct}% · {Math.round(BEDS*s.pct/100)} beds</p>
                  </div>
                ))}
              </div>
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
