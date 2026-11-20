// Synthetic but believable data for the mockup: jobs and candidates.
// Seeded, so every run makes the same site. Nothing here is a real posting or a real person.

import {
  TRADES, TRADE, LEVELS, LEVEL, CERT, SHIFTS, TYPES, REGIONS, REGION, PLACES, PLACE, OFFICES, PROGRAM,
  AS_OF, slugify, miles,
} from "../src/assets/js/catalog.js";

// ---------- randomness ----------

function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
let rand = mulberry32(1987);
const chance = (p) => rand() < p;
const between = (lo, hi) => lo + rand() * (hi - lo);
const int = (lo, hi) => Math.floor(between(lo, hi + 1));
const pick = (list) => list[Math.floor(rand() * list.length)];
function weighted(list, weight = (item) => item.weight ?? 1) {
  const total = list.reduce((sum, item) => sum + weight(item), 0);
  let r = rand() * total;
  for (const item of list) {
    r -= weight(item);
    if (r <= 0) return item;
  }
  return list[list.length - 1];
}
function sample(list, n) {
  const copy = [...list];
  const out = [];
  while (copy.length && out.length < n) out.push(copy.splice(Math.floor(rand() * copy.length), 1)[0]);
  return out;
}
function addDays(date, days) {
  const d = new Date(date + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

// ---------- yards ----------

/** Kinds of employer. Real clients stay unnamed, the way staffing firms list them. */
const YARDS = [
  { key: "naval-builder", name: "Naval shipbuilder", programs: ["submarine", "carrier", "amphib", "surface"], fits: (p) => p.naval && p.yards >= 3, weight: 5 },
  { key: "naval-repair", name: "Naval ship repair contractor", programs: ["surface", "amphib", "carrier"], fits: (p) => p.naval, weight: 6 },
  { key: "sub-modules", name: "Submarine module facility", programs: ["submarine"], fits: (p) => ["newport-news-va", "chesapeake-va", "groton-ct", "north-kingstown-ri"].includes(p.key), weight: 3 },
  { key: "commercial-repair", name: "Commercial ship repair yard", programs: ["commercial"], fits: () => true, weight: 4 },
  { key: "barge-tug", name: "Barge and tug builder", programs: ["commercial"], fits: (p) => ["gulf-coast", "great-lakes", "pacific-northwest", "hampton-roads"].includes(p.region), weight: 3 },
  { key: "offshore", name: "Offshore fabrication yard", programs: ["offshore"], fits: (p) => ["houma-la", "theodore-al", "mobile-al", "corpus-christi-tx", "galveston-tx", "north-kingstown-ri", "bayou-la-batre-al"].includes(p.key), weight: 3 },
  { key: "cutter", name: "Patrol boat and cutter builder", programs: ["surface"], fits: (p) => ["panama-city-fl", "houma-la", "gulfport-ms", "marinette-wi", "seattle-wa", "new-orleans-la"].includes(p.key), weight: 2 },
  { key: "dry-dock", name: "Dry dock contractor", programs: ["surface", "commercial", "amphib"], fits: (p) => p.naval || p.yards >= 3, weight: 2 },
  { key: "plant", name: "Refinery turnaround contractor", programs: ["plant"], fits: (p) => p.plant, weight: 6 },
  { key: "fab-shop", name: "Steel fabrication shop", programs: ["commercial", "plant"], fits: () => true, weight: 1.5 },
];

const PROGRAM_PHRASES = {
  submarine: ["submarine module construction", "submarine new construction", "submarine hull and outfitting work"],
  carrier: ["aircraft carrier overhaul", "carrier maintenance availability", "carrier refit work"],
  surface: ["destroyer modernization", "surface ship repair", "cutter and patrol boat construction"],
  amphib: ["amphibious ship repair", "an amphibious ship maintenance availability"],
  commercial: ["commercial vessel repair", "barge and tug new construction", "ferry and workboat construction", "container ship repair"],
  offshore: ["offshore vessel fabrication", "liftboat and platform fabrication", "offshore wind vessel construction"],
  plant: ["a refinery turnaround", "a petrochemical plant outage", "unit turnaround work"],
};

// ---------- trade writing ----------

const DUTIES = {
  welder: [
    "Weld structural steel and plate in all positions with FCAW and SMAW",
    "Read weld symbols and prints and work to the weld procedure (WPS)",
    "Preheat, back-gouge and grind joints to sound metal",
    "Tack and close out units and blocks in the assembly hall",
    "Coordinate hot work with fire watch and keep your area fire-safe",
    "Repair defects called out by QA and pass UT and MT inspection",
    "Weld aboard ship in tanks, voids and machinery spaces",
  ],
  "welder:pipe": [
    "Weld carbon, stainless and copper-nickel pipe from root to cap",
    "Run open-root and consumable-insert joints with GTAW",
    "Purge stainless and CuNi joints and keep the purge log",
  ],
  shipfitter: [
    "Lay out, fit and tack plate, stiffeners and brackets from prints",
    "Bring steel to line with jacks, strongbacks, wedges and come-alongs",
    "Check fit-up with levels, squares and a transit before welding",
    "Install foundations, inserts and penetrations aboard ship",
    "Burn and grind to trim steel to fit",
    "Work in tanks, voids and double bottoms",
  ],
  pipefitter: [
    "Fabricate and install piping systems from isometric drawings",
    "Cut, bevel, fit and tack pipe, flanges and fittings",
    "Install hangers, supports and valves to the drawing",
    "Hydro and pneumatic test systems and chase down leaks",
    "Work with copper-nickel, carbon and stainless pipe",
    "Rig and move pipe spools in tight shipboard spaces",
  ],
  "outside-machinist": [
    "Install, align and repair pumps, motors, valves and deck machinery",
    "Pull and reinstall shafts, couplings and bearings",
    "Take readings with dial indicators, mics and feeler gauges",
    "Overhaul valves and hydraulic components aboard ship",
    "Work from technical manuals and job orders",
  ],
  "inside-machinist": [
    "Set up and run manual and CNC lathes, mills and boring mills",
    "Machine shafting, valve parts and fittings to tight tolerances",
    "Measure with mics, bore gauges and height gauges",
    "Read prints with GD&T callouts",
    "Keep machines maintained and the shop clean",
  ],
  electrician: [
    "Pull, route and band shipboard cable",
    "Install light fixtures, panels, switchboards and equipment",
    "Terminate and test power, lighting and control circuits",
    "Read electrical schematics and wire run sheets",
    "Megger and continuity-test before sign-off",
    "Install stuffing tubes, cable hangers and kick pipes",
  ],
  "electronics-tech": [
    "Install and test combat, radar and communications equipment",
    "Terminate fiber optic and coax cable to spec",
    "Troubleshoot to the board level with meters and scopes",
    "Document tests and results for the customer",
    "Work in controlled spaces under a security clearance",
  ],
  painter: [
    "Abrasive blast steel to the surface profile on the work spec",
    "Spray, brush and roll coatings in tanks, voids and on the hull",
    "Take wet and dry film thickness readings and log them",
    "Mask, prep and clean up between coats",
    "Set up and maintain blast pots, hoses and spray rigs",
    "Work in supplied air and full PPE in confined spaces",
  ],
  shipwright: [
    "Build and set keel and bilge blocks from the docking plan",
    "Dock and undock vessels and set shores",
    "Run sight lines and take hull measurements",
    "Install and remove temporary access",
    "Rig and move heavy timber and blocking",
  ],
  scaffold: [
    "Erect and dismantle tube-and-clamp and system scaffold",
    "Build scaffold in tanks, holds and over the side",
    "Inspect and tag scaffold before use",
    "Load and unload scaffold material",
    "Work at heights with fall protection",
  ],
  rigger: [
    "Plan and rig lifts with slings, shackles and chain falls",
    "Signal cranes by hand and radio",
    "Move equipment and material aboard ship and through hatches",
    "Inspect rigging gear before each use",
    "Work out loads and pick the right gear",
  ],
  "crane-operator": [
    "Run portal, gantry or mobile cranes for module and material lifts",
    "Do pre-shift inspections and keep the crane log",
    "Work with riggers and signal persons on critical lifts",
    "Read load charts and plan lifts with the lift supervisor",
  ],
  boilermaker: [
    "Repair and retube marine boilers",
    "Fit and weld pressure parts and casings",
    "Replace refractory and uptakes",
    "Hydro-test boilers and pressure vessels",
    "Rig and move boiler components",
  ],
  "sheet-metal": [
    "Fabricate ventilation duct, fittings and plenums in the shop",
    "Install ductwork, dampers and foundations aboard ship",
    "Lay out patterns and run brakes, shears and rolls",
    "Spot weld and rivet light-gauge metal",
  ],
  insulator: [
    "Insulate piping, valves and bulkheads to the insulation drawing",
    "Cut and fit fiberglass, mineral wool and lagging cloth",
    "Install fire insulation in machinery spaces",
    "Work overhead and in tight spaces",
  ],
  inspector: [
    "Inspect welds, fit-up and dimensions against drawings and specs",
    "Perform UT, MT, PT and VT and record the results",
    "Review weld maps and NDT reports",
    "Write and close nonconformance reports",
    "Work with production to clear defects quickly",
  ],
  "fire-watch": [
    "Stand watch during hot work with an extinguisher ready",
    "Check the space before, during and after hot work",
    "Keep the area clear of combustibles",
    "Stay in place, stay alert and call it in if anything changes",
    "Log hot work start and stop times",
  ],
  burner: [
    "Cut and bevel plate and shapes with oxy-fuel and plasma",
    "Arc gouge out welds and defects",
    "Follow cut lines, templates and marked work",
    "Set up and maintain torches, hoses and regulators",
  ],
  joiner: [
    "Install joiner bulkheads, doors and ceilings",
    "Install berthing furniture, lockers and shelving",
    "Lay deck covering and underlayment",
    "Read joiner drawings and arrangements",
  ],
  laborer: [
    "Move material and tools to the crafts",
    "Keep work areas clean and safe",
    "Set up and break down temporary lighting and ventilation",
    "Help with rigging and staging",
    "Run to the tool room and warehouse for the crew",
  ],
  maintenance: [
    "Repair and maintain yard equipment, compressors and pumps",
    "Troubleshoot mechanical, hydraulic and pneumatic systems",
    "Do preventive maintenance on schedule",
    "Weld and fabricate repair parts as needed",
  ],
  planner: [
    "Build work packages and schedules for production crews",
    "Track progress and report weekly against the plan",
    "Order material and chase shortages",
    "Work in Primavera P6 and the yard's planning system",
  ],
  warehouse: [
    "Receive, check and store incoming material",
    "Issue material to the crafts and track it",
    "Run forklifts and telehandlers safely",
    "Keep inventory counts accurate",
  ],
  engineer: [
    "Prepare drawings and models in AutoCAD, ShipConstructor or NX",
    "Answer production questions on the waterfront",
    "Write work instructions and engineering change notices",
    "Check calculations and review vendor data",
    "Work with QA and the customer to close issues",
  ],
};

const TOOLED = new Set(["welder", "shipfitter", "pipefitter", "outside-machinist", "inside-machinist", "electrician", "boilermaker", "sheet-metal", "insulator", "joiner", "maintenance", "burner", "rigger", "scaffold", "shipwright"]);

const SPECIAL_TITLES = {
  "welder:Combo": "Combo Welder (Pipe and Structural)",
  "welder:Flux Core": "Flux Core Welder (FCAW)",
  "welder:TIG": "TIG Welder (GTAW)",
  "welder:Aluminum": "Aluminum Welder (GMAW)",
  "painter:Industrial": "Industrial Painter",
  "painter:Abrasive Blaster": "Abrasive Blaster",
  "painter:Tank": "Tank Coatings Painter",
  "painter:Spray": "Spray Painter",
  "electrician:Cable Puller": "Marine Electrician (Cable Pulling)",
  "electrician:Terminations": "Marine Electrician (Terminations)",
  "rigger:Signal Person": "Rigger / Signal Person",
  "crane-operator:Portal": "Portal Crane Operator",
  "crane-operator:Mobile": "Mobile Crane Operator",
  "crane-operator:Gantry": "Gantry Crane Operator",
  "crane-operator:Overhead": "Overhead Crane Operator",
  "inspector:Weld (CWI)": "Weld Inspector (CWI)",
  "inspector:UT": "UT Technician",
  "inspector:MT/PT": "MT/PT Inspector",
  "inspector:VT": "Visual Weld Inspector",
  "inspector:Dimensional": "Dimensional Inspector",
  "fire-watch:Hot Work": "Fire Watch",
  "fire-watch:Confined Space": "Fire Watch / Hole Watch",
  "burner:Torch": "Burner",
  "burner:Plasma": "Plasma Cutter",
  "burner:Arc Gouging": "Burner / Arc Gouger",
  "laborer:Shipyard": "Shipyard Laborer",
  "laborer:Clean-up": "General Laborer (Clean-up Crew)",
  "laborer:Material": "Material Handler, Shipyard",
  "planner:Production": "Production Planner",
  "planner:Maintenance": "Maintenance Planner / Scheduler",
  "planner:Material": "Material Planner",
  "warehouse:Forklift": "Forklift Operator",
  "warehouse:Receiving": "Warehouse Receiving Clerk",
  "warehouse:Material Handler": "Warehouse Material Handler",
  "joiner:Deck Covering": "Deck Covering Installer",
  "joiner:Furniture": "Joiner (Furniture and Outfitting)",
  "scaffold:Tube and Clamp": "Scaffold Builder (Tube and Clamp)",
  "scaffold:System": "Scaffold Builder (System)",
  "electronics-tech:Fiber Optic": "Fiber Optic Technician",
  "inside-machinist:CNC": "CNC Machinist",
  "outside-machinist:Alignment": "Outside Machinist (Shaft Alignment)",
  "outside-machinist:Propulsion": "Propulsion Machinist",
  "outside-machinist:Valve": "Valve Machinist",
  "shipwright:Alignment": "Shipwright (Hull Alignment)",
  "shipwright:Docking": "Docking Shipwright",
  "shipfitter:Unit": "Shipfitter (Unit Assembly)",
  "maintenance:Facility": "Facility Maintenance Mechanic",
  "inside-machinist:Manual Lathe": "Lathe Machinist",
  "inside-machinist:Horizontal Boring Mill": "Horizontal Boring Mill Machinist",
};

function baseTitle(trade, specialty) {
  const special = SPECIAL_TITLES[`${trade.key}:${specialty}`];
  if (special) return special;
  if (trade.key === "engineer") return specialty;
  const name = trade.name.replace(/ \/.*$/, "");
  if (["Shop", "Shipboard", "Industrial", "Field", "Marine", "Hull", "Unit", "Outfitting", "Facility", "Equipment", "Process", "Hydraulic", "Propulsion", "Valve", "Alignment", "Docking", "Heavy Lift", "Pipe", "Structural", "Stud", "Bulkhead", "Ventilation", "Radar", "Communications", "Combat Systems"].includes(specialty)) {
    return `${specialty} ${name}`;
  }
  return name;
}

function titleFor(trade, specialty, level) {
  const base = baseTitle(trade, specialty);
  if (trade.flat) return base;
  if (level.key === "helper") return `${base.replace(/ \(.*\)$/, "")} Helper`;
  if (level.key === "lead") return chance(0.5) ? `Lead ${base}` : `${base.replace(/ \(.*\)$/, "")} Foreman`;
  return `${base}, ${level.name}`;
}

// ---------- jobs ----------

const RECRUITERS = {
  "newport-news-va": ["Tasha Greene", "Mike Dorsey", "Renee Patel", "Luis Ortega"],
  "portsmouth-va": ["Jamal Carter", "Kelly Brooks", "Heather Lyle"],
  "mobile-al": ["Brandon LeBlanc", "Crystal Nguyen", "Wade Thibodeaux"],
  "national-city-ca": ["Marisol Vega", "Kevin Tran", "Alicia Moreno"],
  travel: ["Dana Whitaker", "Curtis Boone"],
};

const SCHEDULES = [
  { key: "5x8", label: "5×8s, Mon to Fri", hours: 40, weight: 34 },
  { key: "4x10", label: "4×10s", hours: 40, weight: 18 },
  { key: "5x10", label: "5×10s", hours: 50, weight: 26 },
  { key: "6x10", label: "6×10s", hours: 60, weight: 16 },
  { key: "7x12", label: "7×12s (turnaround)", hours: 84, weight: 6, plant: true },
];

function nearestOffice(place) {
  let best = null;
  for (const office of OFFICES) {
    const d = miles(place, office);
    if (!best || d < best.d) best = { office, d };
  }
  return best;
}

function certsFor(trade, specialty, level, yard, place) {
  const naval = ["naval-builder", "naval-repair", "sub-modules", "dry-dock", "cutter"].includes(yard.key);
  const port = ["commercial-repair", "barge-tug", "offshore", "plant"].includes(yard.key) || place.region === "gulf-coast";
  const out = new Set();
  const k = trade.key;
  if (k === "welder") {
    if (naval && chance(0.75)) out.add("tp248");
    if (chance(naval ? 0.25 : 0.6)) out.add("aws-d11");
    if (["Pipe", "Combo", "TIG"].includes(specialty) && chance(0.7)) out.add("6g");
    if (yard.key === "plant" && chance(0.8)) out.add("asme-ix");
  }
  if (k === "boilermaker" && chance(0.6)) out.add("asme-ix");
  if (k === "inspector") {
    if (specialty === "Weld (CWI)") out.add("cwi");
    else if (chance(0.8)) out.add("asnt2");
    if (naval && chance(0.7)) out.add("tp271");
  }
  if (k === "crane-operator" && chance(0.95)) out.add("nccco");
  if ((k === "fire-watch" || specialty === "Tank" || k === "painter") && chance(0.45)) out.add("confined");
  if (["shipfitter", "pipefitter", "electrician", "scaffold"].includes(k) && chance(0.12)) out.add("nccer");
  if (k === "electronics-tech" && chance(0.55)) out.add("secret");
  if (k === "engineer" && naval && chance(0.35)) out.add("secret");
  if (k === "planner" && naval && chance(0.15)) out.add("secret");
  if (naval && !out.has("secret") && chance(0.04)) out.add("secret");
  if (naval && chance(0.8)) out.add("citizen");
  if (chance(port ? 0.55 : 0.15)) out.add("twic");
  if (level.key === "lead" && chance(0.4)) out.add("osha30");
  else if (chance(0.3)) out.add("osha10");
  return [...out];
}

function describe(job, trade, yard, place, program) {
  const city = place.city;
  const crew = int(4, 40);
  const lowerTitle = job.title.replace(/, (1st|2nd) Class$/, "").toLowerCase();
  const phrase = pick(PROGRAM_PHRASES[program]);
  const intro = pick([
    `A ${yard.name.toLowerCase()} in ${city} needs ${job.openings === 1 ? "one" : job.openings} ${lowerTitle}${job.openings === 1 ? "" : "s"} for ${phrase}.`,
    `We're staffing ${lowerTitle}s for ${phrase} at a ${yard.name.toLowerCase()} in ${city}, ${place.state}.`,
    `Join a ${crew}-person ${trade.name.toLowerCase().replace(/ \/.*$/, "")} crew on ${phrase} at a ${yard.name.toLowerCase()} in ${city}.`,
    `${job.openings > 1 ? `${job.openings} openings` : "One opening"} on ${phrase} at a ${yard.name.toLowerCase()} in ${city}. ${pick(["Steady work with a good crew.", "Long-term work with room to move up.", "The yard is ramping up and wants people who show up.", "Good foremen, clean yard, steady hours."])}`,
  ]);
  const shiftLine = {
    day: `Day shift, ${job.schedule.label.toLowerCase()}.`,
    swing: `Swing shift (2nd), ${job.schedule.label.toLowerCase()}, with a shift differential.`,
    night: `Night shift (3rd), ${job.schedule.label.toLowerCase()}, with a shift differential.`,
    weekend: `Weekend crew, Friday to Sunday, 3×12s.`,
  }[job.shift];
  const typeLine = {
    contract: `Contract runs about ${int(3, 14)} months, and extensions are common.`,
    "temp-to-hire": `You start on CTR's payroll. After ${pick([60, 90, 90, 120])} days of good work the yard plans to hire on.`,
    direct: `Direct hire with the yard. CTR runs the search and gets you through onboarding.`,
    temporary: `Short-term work, about ${int(3, 10)} weeks.`,
  }[job.type];
  const otLine = job.schedule.hours > 40 ? ` Expect ${job.schedule.hours - 40} hours of overtime a week at time and a half.` : chance(0.4) ? " Overtime comes up most weeks." : "";
  const pool = [...DUTIES[trade.key], ...(trade.key === "welder" && ["Pipe", "Combo", "TIG"].includes(job.specialty) ? DUTIES["welder:pipe"] : [])];
  const duties = sample(pool, Math.min(pool.length, int(4, 6)));
  const level = LEVEL[job.level];
  const reqs = [];
  reqs.push(trade.flat ? (trade.key === "fire-watch" || trade.key === "laborer" ? "No experience needed. We train you on day one." : `${int(2, 8)} or more years in a similar role`) : level.years);
  if (job.level === "helper") reqs.push("Willing to learn the trade and show up every day");
  for (const key of job.certs) reqs.push(CERT[key].long);
  if (trade.key === "welder") reqs.push("Pass a CTR weld test at the start (we pay for test time)");
  if (TOOLED.has(trade.key) && job.level !== "helper") reqs.push("Your own hand tools per the tool list");
  if (!trade.salaried) reqs.push("Able to climb, crawl, lift 50 lb and work at heights and in confined spaces");
  reqs.push("Pass a drug screen and background check");
  reqs.push(trade.salaried ? "Steel-toe boots for waterfront visits" : "Steel-toe boots. CTR provides the rest of your PPE.");
  const perks = ["Weekly pay by direct deposit"];
  if (job.perDiem) perks.push(`$${job.perDiem}/day per diem${job.travel ? "" : " for those living 50+ miles out"}`);
  if (job.schedule.hours > 40) perks.push("Overtime at time and a half");
  if (job.shift === "night" || job.shift === "swing") perks.push("Shift differential");
  if (job.benefits) perks.push(job.type === "direct" ? "Full benefits from day one, 401(k) with match" : job.type === "temp-to-hire" ? "Medical, dental and vision after 60 days" : "Medical, dental and vision available");
  if (job.bonus) perks.push(`$${job.bonus.toLocaleString("en-US")} sign-on bonus after 90 days`);
  if (job.housing) perks.push("Help finding housing near the yard");
  if (job.relocation) perks.push("Relocation assistance");
  perks.push("A recruiter who picks up the phone");
  return { summary: `${intro} ${shiftLine}${otLine} ${typeLine}`.replace(/\s+/g, " ").trim(), duties, reqs, perks };
}

function makeJob(i) {
  const region = weighted(REGIONS);
  const place = weighted(PLACES.filter((p) => p.region === region.key), (p) => p.yards);
  const yard = weighted(YARDS.filter((y) => y.fits(place)));
  const program = pick(yard.programs);
  const trade = weighted(TRADES.filter((t) => !(yard.key === "plant" && ["shipwright", "joiner", "electronics-tech"].includes(t.key))));
  const specialty = pick(trade.specialties);
  const level = trade.flat ? (trade.salaried ? weighted([LEVEL.second, LEVEL.first, LEVEL.lead], (l) => [2, 6, 2][[LEVEL.second, LEVEL.first, LEVEL.lead].indexOf(l)]) : LEVEL.helper) : weighted(LEVELS);
  const shift = yard.key === "plant" ? weighted(SHIFTS.filter((s) => s.key !== "weekend")) : weighted(SHIFTS);
  const type = trade.salaried ? weighted(TYPES, (t) => ({ direct: 7, contract: 3, "temp-to-hire": 1, temporary: 0 })[t.key]) : weighted(TYPES);
  let schedule = weighted(SCHEDULES.filter((s) => (s.plant ? yard.key === "plant" : true)));
  if (trade.salaried) schedule = SCHEDULES[0];
  if (shift.key === "weekend") schedule = { key: "3x12", label: "3×12s, Fri to Sun", hours: 36 };

  const near = nearestOffice(place);
  const travel = near.d > 60;
  const regionPay = REGION[place.region].pay * between(0.97, 1.04);
  let mid = trade.pay * level.pay * regionPay;
  if (shift.key === "night") mid += 1.5;
  if (shift.key === "swing") mid += 0.75;
  if (travel) mid += between(0, 2);
  const width = Math.max(2, Math.round(mid * between(0.08, 0.16)));
  const lo = Math.max(15, Math.round(mid - width / 2));
  const pay = [lo, lo + width];
  const salary = trade.salaried ? [Math.round((mid * 2080 * 0.93) / 1000) * 1000, Math.round((mid * 2080 * 1.08) / 1000) * 1000] : null;

  let perDiem = 0;
  if (travel) perDiem = Math.round((REGION[place.region].perdiem * between(0.85, 1.25)) / 5) * 5;
  else if (type.key === "contract" && chance(0.3)) perDiem = Math.round((REGION[place.region].perdiem * between(0.6, 0.9)) / 5) * 5;
  if (trade.salaried) perDiem = travel && chance(0.4) ? perDiem : 0;

  const posted = addDays(AS_OF, -Math.min(44, Math.floor(-Math.log(1 - rand()) * 9)));
  const big = ["welder", "shipfitter", "pipefitter", "electrician", "fire-watch", "painter", "laborer"].includes(trade.key);
  const openings = trade.salaried ? int(1, 2) : big ? Math.max(1, Math.round(Math.pow(rand(), 2.2) * 24)) : int(1, 6);
  const job = {
    i,
    title: titleFor(trade, specialty, level),
    trade: trade.key,
    specialty,
    level: level.key,
    place: place.key,
    region: place.region,
    yard: yard.name,
    program,
    shift: shift.key,
    type: type.key,
    schedule,
    pay: salary ? null : pay,
    salary,
    perDiem,
    travel,
    benefits: type.key === "direct" || type.key === "temp-to-hire" || (type.key === "contract" && chance(0.55)),
    bonus: !trade.salaried && ["welder", "shipfitter", "pipefitter", "electrician"].includes(trade.key) && chance(0.08) ? pick([500, 750, 1000, 1500, 2000, 2500]) : 0,
    housing: travel && chance(0.35),
    relocation: type.key === "direct" && chance(0.35),
    overtime: schedule.hours > 40,
    certs: certsFor(trade, specialty, level, yard, place),
    posted,
    validThrough: addDays(posted, 60),
    openings,
    applicants: int(0, openings * 7 + 3),
    urgent: chance(0.13),
    office: travel ? "newport-news-va" : near.office.key,
    recruiter: pick(travel ? RECRUITERS.travel : RECRUITERS[near.office.key]),
  };
  Object.assign(job, describe(job, trade, yard, place, program));
  return job;
}

// ---------- candidates ----------

const FIRST = "James Marcus Andre Darnell Tyrone Luis Carlos Miguel Jose Juan Thanh Minh Kevin Brian Travis Cody Dustin Wade Bobby Ricky Jerome Terrell Andre DeShawn Malik Isaiah Elijah Caleb Austin Garrett Hunter Colton Dylan Tanner Shane Brandon Corey Derek Jason Randy Rodney Earl Clarence Leon Hector Rafael Ernesto Ramon Victor Javier Nguyen Tuan Hung Duc Samuel Daniel Patrick Sean Ryan Kyle Logan Chase Blake Jamal Reggie Curtis Lamar Dwayne Maria Ashley Brittany Jasmine Tiffany Keisha Shanice Crystal Amber Heather Megan Danielle Rosa Guadalupe Carmen Lupe Linh Mai Kim Tara Kayla Destiny Erica Monique Latoya Felicia Sierra Jade Whitney".split(" ");
const LAST = "Whitfield Johnson Williams Brown Jones Davis Wilson Moore Taylor Anderson Thomas Jackson White Harris Martin Thompson Garcia Martinez Robinson Clark Rodriguez Lewis Lee Walker Hall Allen Young Hernandez King Wright Lopez Hill Scott Green Adams Baker Gonzalez Nelson Carter Mitchell Perez Roberts Turner Phillips Campbell Parker Evans Edwards Collins Stewart Sanchez Morris Rogers Reed Cook Morgan Bell Bailey Rivera Cooper Richardson Cox Howard Ward Torres Peterson Gray Ramirez James Watson Brooks Kelly Sanders Price Bennett Wood Barnes Ross Henderson Coleman Jenkins Perry Powell Long Patterson Hughes Flores Washington Butler Simmons Foster Gonzales Bryant Alexander Russell Griffin Diaz Hayes Boudreaux Thibodeaux Landry Hebert Fontenot Guidry Tran Pham Le Vo Dang Bui Kowalski Nowak Lindqvist Okafor Mensah Boateng Haddad".split(" ");

const STAGES = [
  { key: "lead", name: "New lead", weight: 30 },
  { key: "screen", name: "Screening", weight: 24 },
  { key: "interview", name: "Interview", weight: 15 },
  { key: "offer", name: "Offer", weight: 8 },
  { key: "onboard", name: "Onboarding", weight: 9 },
  { key: "placed", name: "On the job", weight: 14 },
];
const SOURCES = [
  { key: "linkedin", name: "LinkedIn", weight: 26 },
  { key: "search", name: "Site search", weight: 30 },
  { key: "passkey", name: "Passkey sign-up", weight: 10 },
  { key: "email", name: "Email sign-up", weight: 12 },
  { key: "referral", name: "Referral", weight: 14 },
  { key: "walk-in", name: "Walk-in", weight: 8 },
];

const NOTE_TEMPLATES = [
  "Called, left voicemail. Will try again after shift change.",
  "Strong on the phone. Has worked {yard} before.",
  "Prefers {shift}. Flexible on start date.",
  "Weld test booked for {day} at 7:00.",
  "TWIC expires soon; reminded to renew.",
  "Referred by a crew lead on the {city} job.",
  "Asked about per diem and housing near the yard.",
  "Good references from his last two foremen.",
  "Wants to stay local, home every night.",
  "Available two weeks after current contract ends.",
];

function makeCandidates(jobs, n) {
  const out = [];
  const byTrade = {};
  for (const job of jobs) (byTrade[job.trade] ??= []).push(job);
  const used = new Set();
  for (let k = 0; out.length < n; k++) {
    let first = pick(FIRST);
    let last = pick(LAST);
    if (k === 0) [first, last] = ["Andre", "Whitfield"];
    if (used.has(first + last)) continue;
    used.add(first + last);
    const trade = k === 0 ? TRADE.welder : weighted(TRADES);
    const level = k === 0 ? LEVEL.first : trade.flat ? LEVEL.first : weighted(LEVELS);
    const pool = byTrade[trade.key] ?? jobs;
    const job = k === 0 ? jobs.find((j) => j.trade === "welder" && j.specialty === "Pipe" && j.region === "hampton-roads" && j.level === "first") ?? pool[0] : pick(pool);
    const home = k === 0 ? PLACE["chesapeake-va"] : chance(0.75) ? PLACE[job.place] : weighted(PLACES, (p) => p.yards);
    const stage = k === 0 ? STAGES[2] : weighted(STAGES);
    const source = k === 0 ? SOURCES[0] : weighted(SOURCES);
    const years = level.key === "helper" ? int(0, 1) : level.key === "second" ? int(1, 4) : level.key === "first" ? int(3, 15) : int(8, 25);
    const certs = [...new Set([...job.certs.filter(() => chance(0.8)), ...(chance(0.5) ? ["twic"] : []), ...(chance(0.4) ? ["osha10"] : [])])].map((key) => ({
      key,
      expires: ["twic", "tp248", "aws-d11", "6g", "asnt2", "nccco", "cwi"].includes(key) ? addDays(AS_OF, int(-20, 900)) : null,
      verified: chance(0.6),
    }));
    if (k === 0) {
      certs.splice(0, certs.length,
        { key: "tp248", expires: "2027-08-14", verified: true },
        { key: "6g", expires: "2027-03-02", verified: true },
        { key: "aws-d11", expires: "2027-11-30", verified: true },
        { key: "twic", expires: "2026-12-11", verified: true },
        { key: "osha10", expires: null, verified: false },
        { key: "citizen", expires: null, verified: true });
    }
    const stageIndex = STAGES.indexOf(stage);
    const docs = stageIndex >= 3 ? {
      offer: stageIndex >= 4 ? "signed" : pick(["sent", "viewed"]),
      i9: stageIndex >= 4 ? pick(["section-1", "verified", "verified"]) : "not-started",
      w4: stageIndex >= 4 ? pick(["done", "done", "pending"]) : "not-started",
      deposit: stageIndex >= 4 ? pick(["done", "pending"]) : "not-started",
      drug: stageIndex >= 4 ? pick(["scheduled", "passed", "passed"]) : "not-started",
      safety: stageIndex >= 5 ? "done" : pick(["not-started", "in-progress"]),
      badge: stageIndex >= 5 ? "issued" : pick(["requested", "not-started"]),
    } : null;
    const notes = sample(NOTE_TEMPLATES, k === 0 ? 2 : int(0, 2)).map((text, n2) => ({
      by: job.recruiter,
      at: addDays(AS_OF, -int(0, 12)),
      text: text.replace("{yard}", job.yard.toLowerCase()).replace("{shift}", pick(["days", "nights", "4×10s"])).replace("{day}", pick(["Monday", "Tuesday", "Thursday"])).replace("{city}", PLACE[job.place].city),
    }));
    const mid = job.pay ? (job.pay[0] + job.pay[1]) / 2 : null;
    out.push({
      id: `C-${1001 + k}`,
      first, last,
      slug: slugify(`${first} ${last}`),
      trade: trade.key,
      level: level.key,
      home: home.key,
      years,
      certs,
      source: source.key,
      stage: stage.key,
      job: job.id,
      match: k === 0 ? 94 : Math.round(between(52, 98)),
      rate: mid ? Math.round(mid + between(-2, 3)) : null,
      travel: chance(0.45),
      available: addDays(AS_OF, int(0, 30)),
      phone: `757-555-01${String(int(0, 99)).padStart(2, "0")}`,
      email: `${first}.${last}@example.com`.toLowerCase(),
      active: addDays(AS_OF, -Math.floor(-Math.log(1 - rand()) * 3)),
      notes,
      screen: {
        drug: stageIndex >= 1 ? chance(0.92) : null,
        tools: chance(0.85),
        travel: chance(0.5),
        certsCurrent: certs.every((c) => !c.expires || c.expires > AS_OF),
      },
      docs,
    });
  }
  return { candidates: out, stages: STAGES, sources: SOURCES };
}

// ---------- assemble ----------

export function makeData({ jobs: jobCount = 1500, candidates: candidateCount = 400 } = {}) {
  rand = mulberry32(1987);
  const jobs = Array.from({ length: jobCount }, (_, i) => makeJob(i));
  jobs.sort((a, b) => (a.posted < b.posted ? -1 : a.posted > b.posted ? 1 : a.i - b.i));
  let req = 30412;
  for (const job of jobs) {
    req += int(1, 4);
    job.id = `CTR-${req}`;
    const place = PLACE[job.place];
    job.slug = slugify(`${job.title.replace(/[(),/]/g, " ")} ${place.city} ${place.state} ${req}`);
    delete job.i;
  }
  jobs.reverse(); // newest first
  const people = makeCandidates(jobs, candidateCount);
  return { jobs, ...people };
}
