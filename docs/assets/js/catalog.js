// The shared vocabulary of the site: trades, levels, certifications, places, offices.
// Plain ESM with no imports, so the page generator (Node) and the browser read the same file.

/** Trades. `words` is how people say it; `pay` is the 1st-class Hampton Roads midpoint in $/hr. */
export const TRADES = [
  { key: "welder", name: "Welder", plural: "Welders", family: "Metal trades", pay: 32, weight: 18,
    words: /\bweld(?:er|ers|ing|s)?\b|\btig\b|\bmig\b|\bsmaw\b|\bgmaw\b|\bfcaw\b|\bgtaw\b|\bflux ?core\b|\bstick welding\b/,
    specialties: ["Structural", "Pipe", "Combo", "TIG", "Aluminum", "Flux Core", "Stud"],
    about: "Joins structural steel, pipe and aluminum on hulls, decks and systems, to code and to print." },
  { key: "shipfitter", name: "Shipfitter", plural: "Shipfitters", family: "Metal trades", pay: 31, weight: 14,
    words: /\bship ?fitt(?:er|ers|ing)\b|\bstructural fitters?\b|(?<!pipe ?)(?<!steam ?)\bfitters?\b|\bfit[- ]?up\b/,
    specialties: ["Structural", "Hull", "Outfitting", "Unit"],
    about: "Lays out, fits and tacks plate, shapes and units so welders can close them out." },
  { key: "pipefitter", name: "Pipefitter", plural: "Pipefitters", family: "Mechanical trades", pay: 33, weight: 10,
    words: /\bpipe ?fitt(?:er|ers|ing)\b|\bsteam ?fitters?\b|\bpiping\b/,
    specialties: ["Shipboard", "Hydraulic", "Process", "Shop"],
    about: "Fabricates and installs shipboard piping, hangers and valves from isometrics." },
  { key: "outside-machinist", name: "Outside Machinist", plural: "Outside Machinists", family: "Mechanical trades", pay: 32, weight: 5,
    words: /\boutside machinists?\b|(?<!inside )\bmachinists?\b|\bmillwrights?\b|\bshaft alignment\b/,
    specialties: ["Shipboard", "Propulsion", "Valve", "Alignment"],
    about: "Installs, aligns and repairs propulsion, pumps, valves and deck machinery aboard ship." },
  { key: "inside-machinist", name: "Inside Machinist", plural: "Inside Machinists", family: "Mechanical trades", pay: 30, weight: 3,
    words: /\binside machinists?\b|(?<!outside )\bmachinists?\b|\bcnc\b|\blathe\b|\bmill operators?\b|\bboring mill\b|\bmachining\b/,
    specialties: ["CNC", "Manual Lathe", "Horizontal Boring Mill", "Shop"],
    about: "Turns, mills and bores parts in the shop to tolerances measured in tenths." },
  { key: "electrician", name: "Marine Electrician", plural: "Marine Electricians", family: "Electrical", pay: 32, weight: 8,
    words: /\belectricians?\b|\belectrical\b(?! engineer)|\bwire ?m[ae]n\b|\bcable pull(?:ing|ers?)\b/,
    specialties: ["Shipboard", "Cable Puller", "Terminations", "Industrial"],
    about: "Pulls cable, hangs equipment and terminates power and lighting systems on board." },
  { key: "electronics-tech", name: "Electronics Technician", plural: "Electronics Technicians", family: "Electrical", pay: 34, weight: 1.5,
    words: /\belectronics?\b|\bcombat systems?\b|\bradar\b|\bc5i\b|\bfiber optics?\b/,
    specialties: ["Combat Systems", "Fiber Optic", "Radar", "Communications"],
    about: "Installs, tests and troubleshoots combat, radar and communications systems." },
  { key: "painter", name: "Painter / Blaster", plural: "Painters and Blasters", family: "Surface prep", pay: 26, weight: 6,
    words: /\bpaint(?:er|ers|ing)?\b|\bblast(?:er|ers|ing)?\b|\bsand ?blast\w*|\bcoatings?\b|\bprep(?:per)?\b/,
    specialties: ["Industrial", "Abrasive Blaster", "Tank", "Spray"],
    about: "Blasts, preps and sprays tanks, voids and hull to coating spec and DFT." },
  { key: "shipwright", name: "Shipwright", plural: "Shipwrights", family: "Hull and dock", pay: 29, weight: 3,
    words: /\bshipwrights?\b|\bdocking\b|\bdry ?dock\b|\bkeel blocks?\b/,
    specialties: ["Docking", "Hull", "Alignment"],
    about: "Builds keel and bilge blocks, docks and undocks hulls, sets shores and sight lines." },
  { key: "scaffold", name: "Scaffold Builder", plural: "Scaffold Builders", family: "Hull and dock", pay: 25, weight: 3,
    words: /\bscaffold(?:ing|er|ers|s)?\b|\bstaging\b/,
    specialties: ["Tube and Clamp", "System", "Shipboard"],
    about: "Erects tube-and-clamp and system scaffold inside tanks, holds and over the side." },
  { key: "rigger", name: "Rigger", plural: "Riggers", family: "Rigging and lift", pay: 28, weight: 4,
    words: /\briggers?\b|\brigging\b|\bsignal ?(?:man|person|men)\b/,
    specialties: ["Shipboard", "Heavy Lift", "Signal Person"],
    about: "Plans and rigs lifts, signals cranes and moves equipment into tight spaces." },
  { key: "crane-operator", name: "Crane Operator", plural: "Crane Operators", family: "Rigging and lift", pay: 35, weight: 2,
    words: /\bcrane operators?\b|\bcranes?\b|\bnccco\b|\bportal crane\b|\bgantry\b/,
    specialties: ["Portal", "Mobile", "Gantry", "Overhead"],
    about: "Runs portal, gantry and mobile cranes for module lifts and yard moves." },
  { key: "boilermaker", name: "Boilermaker", plural: "Boilermakers", family: "Metal trades", pay: 33, weight: 2,
    words: /\bboiler ?makers?\b|\bboilers?\b|\bpressure vessels?\b/,
    specialties: ["Marine", "Field", "Shop"],
    about: "Repairs and retubes marine boilers, uptakes and pressure vessels." },
  { key: "sheet-metal", name: "Sheet Metal Mechanic", plural: "Sheet Metal Mechanics", family: "Metal trades", pay: 29, weight: 3,
    words: /\bsheet ?metal\b|\btinsmiths?\b|\bhvac\b|\bduct(?:work|s)?\b|\bventilation\b/,
    specialties: ["Ventilation", "Shipboard", "Shop"],
    about: "Fabricates and installs ventilation, ductwork and light-gauge foundations." },
  { key: "insulator", name: "Insulator", plural: "Insulators", family: "Mechanical trades", pay: 27, weight: 3,
    words: /\binsulat(?:or|ors|ion)\b|\blagg(?:er|ers|ing)\b|\bpipe covering\b/,
    specialties: ["Marine", "Pipe", "Bulkhead"],
    about: "Insulates and lags piping, bulkheads and overheads to fire and thermal spec." },
  { key: "inspector", name: "QC / NDT Inspector", plural: "QC and NDT Inspectors", family: "Quality", pay: 36, weight: 4,
    words: /\binspect(?:or|ors|ion)\b|\bqa\b|\bqc\b|\bndt\b|\bndi\b|\bcwi\b|\bquality\b|\bultrasonic\b|\bmag(?:netic)? particle\b|\bvisual testing\b/,
    specialties: ["Weld (CWI)", "UT", "MT/PT", "VT", "Dimensional"],
    about: "Inspects welds and fit-up, runs UT, MT, PT and VT, and signs off to spec." },
  { key: "fire-watch", name: "Fire Watch", plural: "Fire Watch", family: "Entry level", pay: 17, weight: 4, flat: true,
    words: /\bfire ?watch(?:es)?\b|\bhole ?watch\b|\bsafety watch\b/,
    specialties: ["Hot Work", "Confined Space"],
    about: "Stands watch over hot work with an extinguisher and keeps the space safe." },
  { key: "burner", name: "Burner / Torch Cutter", plural: "Burners", family: "Metal trades", pay: 25, weight: 3,
    words: /\btorch cutt(?:er|ers|ing)\b|\bplasma cutt(?:er|ers|ing)\b|\bburn(?:er|ers|ing)\b|\btorch\b|\bgoug(?:e|ing|er)\b/,
    specialties: ["Torch", "Plasma", "Arc Gouging"],
    about: "Cuts, bevels and gouges plate and shapes with oxy-fuel, plasma and carbon arc." },
  { key: "joiner", name: "Joiner / Shipboard Carpenter", plural: "Joiners", family: "Hull and dock", pay: 27, weight: 2,
    words: /\bjoiners?\b|\bcarpent(?:er|ers|ry)\b|\bjoinery\b/,
    specialties: ["Shipboard", "Furniture", "Deck Covering"],
    about: "Installs joiner bulkheads, furniture, ceilings and deck coverings in berthing and spaces." },
  { key: "laborer", name: "General Laborer", plural: "General Laborers", family: "Entry level", pay: 18, weight: 3, flat: true,
    words: /\blaborers?\b|\blabou?r\b|\bgeneral labor\b|\bclean ?up crew\b/,
    specialties: ["Shipyard", "Clean-up", "Material"],
    about: "Keeps the work moving: material, housekeeping, staging and support to the crafts." },
  { key: "maintenance", name: "Maintenance Mechanic", plural: "Maintenance Mechanics", family: "Mechanical trades", pay: 29, weight: 2,
    words: /\bmaintenance\b|(?<!metal )\bmechanics?\b(?! engineer)/,
    specialties: ["Industrial", "Facility", "Equipment"],
    about: "Keeps yard equipment, compressors and facilities running." },
  { key: "planner", name: "Planner / Scheduler", plural: "Planners", family: "Professional", pay: 36, weight: 1.5, flat: true, salaried: true,
    words: /\bplann(?:er|ers|ing)\b|\bschedul(?:er|ers|ing)\b|\bp6\b|\bprimavera\b/,
    specialties: ["Production", "Maintenance", "Material"],
    about: "Builds work packages and schedules, tracks progress and keeps crafts supplied." },
  { key: "warehouse", name: "Warehouse / Forklift", plural: "Warehouse Associates", family: "Entry level", pay: 19, weight: 3,
    words: /\bwarehouse\b|\bfork ?lifts?\b|\bmaterial handl(?:er|ers|ing)\b|\breceiving\b|\bshipping clerks?\b/,
    specialties: ["Forklift", "Receiving", "Material Handler"],
    about: "Receives, stores and issues material and moves it with forklifts and telehandlers." },
  { key: "engineer", name: "Engineering and Design", plural: "Engineers and Designers", family: "Professional", pay: 46, weight: 2, flat: true, salaried: true,
    words: /\bengineer(?:s|ing)?\b|\bdesigners?\b|\bdrafters?\b|\bcad\b|\bnaval architect\w*|\belectrical engineer\b/,
    specialties: ["Structural Designer", "Piping Designer", "Mechanical Engineer", "Naval Architect", "Electrical Engineer", "Manufacturing Engineer"],
    about: "Designs structure and systems, writes work instructions and supports the waterfront." },
];
export const TRADE = Object.fromEntries(TRADES.map((t) => [t.key, t]));

/** Skill levels. `pay` multiplies the trade midpoint. */
export const LEVELS = [
  { key: "helper", name: "Helper", long: "Helper / Trainee", pay: 0.62, weight: 15, years: "No experience needed",
    words: /\bhelpers?\b|\btrainees?\b|\bentry[- ]level\b|\bapprentices?\b|\bno experience\b|\bbeginners?\b|\bnew to the trade\b|\bgreen\b/ },
  { key: "second", name: "2nd Class", long: "2nd Class", pay: 0.85, weight: 30, years: "1 to 3 years in the trade",
    words: /\b2nd class\b|\bsecond class\b|\bclass b\b|\bmid[- ]level\b/ },
  { key: "first", name: "1st Class", long: "1st Class", pay: 1.0, weight: 40, years: "3 or more years in the trade",
    words: /\b1st class\b|\bfirst class\b|\bclass a\b|\bjourney(?:man|men|level)\b|\bexperienced\b|\bsenior\b/ },
  { key: "lead", name: "Lead", long: "Lead / Foreman", pay: 1.15, weight: 15, years: "5 or more years, 2 leading a crew",
    words: /\blead(?:man|men|s)?\b(?! (?:paint|abatement))|\bforem[ae]n\b|\bsupervisors?\b|\bpushers?\b/ },
];
export const LEVEL = Object.fromEntries(LEVELS.map((l) => [l.key, l]));

/** Certifications and credentials a posting can require. */
export const CERTS = [
  { key: "aws-d11", name: "AWS D1.1", long: "AWS D1.1 structural welding certification", words: /\baws\b|\bd1\.1\b/ },
  { key: "tp248", name: "NAVSEA Tech Pub 248", long: "NAVSEA Technical Publication 248 welding qualification", words: /\btech ?pub ?248\b|\btp ?248\b|\b248\b|\bnavsea\b/ },
  { key: "6g", name: "6G pipe", long: "6G all-position pipe qualification", words: /\b6g\b/ },
  { key: "asme-ix", name: "ASME Section IX", long: "ASME Section IX pressure welding qualification", words: /\basme\b|\bsection ix\b/ },
  { key: "twic", name: "TWIC", long: "TWIC card (Transportation Worker Identification Credential)", words: /\btwic\b/ },
  { key: "citizen", name: "U.S. citizen", long: "U.S. citizenship for base access", words: /\bu\.?s\.? citizens?\b|\bcitizenship\b|\bbase access\b/ },
  { key: "secret", name: "Secret clearance", long: "Active DoD Secret clearance", words: /\bclearances?\b|\bsecret\b|\bclearable\b|\bcleared\b/ },
  { key: "osha10", name: "OSHA 10", long: "OSHA 10-hour card", words: /\bosha(?: ?10)?\b(?! ?30)/ },
  { key: "osha30", name: "OSHA 30", long: "OSHA 30-hour card", words: /\bosha ?30\b/ },
  { key: "nccco", name: "NCCCO", long: "NCCCO crane operator certification", words: /\bnccco\b|\bcco\b/ },
  { key: "asnt2", name: "ASNT Level II", long: "ASNT SNT-TC-1A Level II", words: /\basnt\b|\blevel (?:ii|2)\b/ },
  { key: "tp271", name: "NAVSEA Tech Pub 271", long: "NAVSEA Technical Publication 271 NDT certification", words: /\btech ?pub ?271\b|\b271\b/ },
  { key: "cwi", name: "AWS CWI", long: "AWS Certified Welding Inspector", words: /\bcwi\b|\bcertified welding inspector\b/ },
  { key: "nccer", name: "NCCER", long: "NCCER craft credential", words: /\bnccer\b/ },
  { key: "confined", name: "Confined space", long: "Confined space entry training", words: /\bconfined[- ]space\b/ },
];
export const CERT = Object.fromEntries(CERTS.map((c) => [c.key, c]));

/** Perks a search can ask for. Each needs the job to have it. */
export const PERKS = [
  { key: "perdiem", name: "Per diem", words: /\bper ?diem\b|\btravel pay\b|\bpd\b/ },
  { key: "overtime", name: "Overtime", words: /\bover ?time\b|\bot\b|\b(?:50|58|60|70)[- ]?(?:hours?|hrs?)\b|\bsix tens\b|\blots of hours\b/ },
  { key: "benefits", name: "Benefits", words: /\bbenefits\b|\bhealth insurance\b|\bmedical\b|\b401 ?\(?k\)?\b|\bdental\b/ },
  { key: "bonus", name: "Sign-on bonus", words: /\bsign[- ]?on\b|\bbonus(?:es)?\b/ },
  { key: "housing", name: "Housing help", words: /\bhousing\b|\blodging\b|\bplace to stay\b/ },
  { key: "relocation", name: "Relocation", words: /\breloc(?:ate|ation)\b|\bmove me\b/ },
];
export const PERK = Object.fromEntries(PERKS.map((p) => [p.key, p]));

/** Kinds of work, by vessel or program. */
export const PROGRAMS = [
  { key: "submarine", name: "Submarine", words: /\bsub(?:marine)?s?\b|\bsubsafe\b|\bvirginia[- ]class\b|\bcolumbia[- ]class\b/ },
  { key: "carrier", name: "Aircraft carrier", words: /\b(?:aircraft )?carriers?\b|\bcvn\b|\bflat ?tops?\b/ },
  { key: "surface", name: "Surface combatant", words: /\bdestroyers?\b|\bddgs?\b|\bfrigates?\b|\bsurface combatants?\b|(?<!(?:torch|plasma) )\bcutters?\b(?! jobs?\b)|\bwarships?\b/ },
  { key: "amphib", name: "Amphibious ship", words: /\bamphib(?:ious|s)?\b|\blhd\b|\blpd\b|\blha\b/ },
  { key: "commercial", name: "Commercial vessel", words: /\bcommercial\b|\bferr(?:y|ies)\b|\btugs?\b|\bbarges?\b|\bcontainer ships?\b|\bcruise ships?\b|\bfishing vessels?\b/ },
  { key: "offshore", name: "Offshore", words: /\boffshore\b|\boil (?:and|&) gas\b|\bplatforms?\b|\bwind farms?\b|\bliftboats?\b/ },
  { key: "plant", name: "Plant and refinery", words: /\brefiner(?:y|ies)\b|\bplants?\b|\bturnarounds?\b|\boutages?\b|\bpetrochem\w*\b|\bpower plants?\b/ },
];
export const PROGRAM = Object.fromEntries(PROGRAMS.map((p) => [p.key, p]));

export const SHIFTS = [
  { key: "day", name: "Day shift", short: "Days", weight: 55,
    words: /\bday ?shift\b|\b1st shift\b|\bfirst shift\b|\bdays only\b|\bdaylight\b|\bdaytime\b|(?<!\d\s?)(?<!\b(?:few|couple|last|past|next|three|two|four|five|seven|thirty) )\bdays\b(?! (?:ago|a week|old|off|per))/ },
  { key: "swing", name: "Swing shift", short: "Swing", weight: 20, words: /\bswing(?: shift)?\b|\b2nd shift\b|\bsecond shift\b|\bevenings?\b/ },
  { key: "night", name: "Night shift", short: "Nights", weight: 20, words: /(?<!(?:every|at|each) )\bnights?\b(?! (?:at home|home))|\bnight ?shift\b|\b3rd shift\b|\bthird shift\b|\bgraveyard\b|\bovernights?\b/ },
  { key: "weekend", name: "Weekend crew", short: "Weekends", weight: 5, words: /\bweekends?\b|\bsaturdays?\b|\bsundays?\b/ },
];
export const SHIFT = Object.fromEntries(SHIFTS.map((s) => [s.key, s]));

export const TYPES = [
  { key: "contract", name: "Contract", schema: "CONTRACTOR", weight: 50, words: /\bcontract(?:s|or|ors)?\b(?![- ]to[- ]hire)|\b1099\b/ },
  { key: "temp-to-hire", name: "Temp-to-hire", schema: "TEMPORARY", weight: 25, words: /\btemp[- ]to[- ](?:hire|perm)\b|\bcontract[- ]to[- ]hire\b|\bpath to hire\b|\bget hired on\b/ },
  { key: "direct", name: "Direct hire", schema: "FULL_TIME", weight: 15, words: /\bdirect[- ]?hire\b|\bpermanent\b|\bperm\b|\bfull[- ]?time\b|\bstaff (?:job|position)\b|\bw-?2 staff\b/ },
  { key: "temporary", name: "Temporary", schema: "TEMPORARY", weight: 10, words: /\btemp(?:orary)?\b(?![- ]to)|\bshort[- ]term\b|\bseasonal\b/ },
];
export const TYPE = Object.fromEntries(TYPES.map((t) => [t.key, t]));

/** Regions of the country CTR staffs. `pay` scales wages, `perdiem` is a typical daily rate. */
export const REGIONS = [
  { key: "hampton-roads", name: "Hampton Roads, VA", short: "Hampton Roads", pay: 1.0, perdiem: 110, weight: 38,
    words: /\bhampton roads\b|\btidewater\b|\b757\b|\bsoutheast(?:ern)? virginia\b/ },
  { key: "gulf-coast", name: "Gulf Coast", short: "Gulf Coast", pay: 0.95, perdiem: 100, weight: 24,
    words: /\b(?:the )?gulf(?: coast)?\b/ },
  { key: "southern-california", name: "Southern California", short: "SoCal", pay: 1.18, perdiem: 150, weight: 14,
    words: /\bsouthern california\b|\bsocal\b|\bso ?cal\b/ },
  { key: "atlantic", name: "South Atlantic", short: "South Atlantic", pay: 0.97, perdiem: 105, weight: 8,
    words: /\bsouth atlantic\b|\bcarolinas?\b|\bsoutheast\b(?! (?:virginia))/ },
  { key: "northeast", name: "Northeast", short: "Northeast", pay: 1.14, perdiem: 140, weight: 7,
    words: /\bnortheast\b|\bnew england\b/ },
  { key: "great-lakes", name: "Great Lakes", short: "Great Lakes", pay: 1.0, perdiem: 105, weight: 3,
    words: /\bgreat lakes\b|\bmidwest\b/ },
  { key: "pacific-northwest", name: "Pacific Northwest", short: "Pacific NW", pay: 1.2, perdiem: 150, weight: 4,
    words: /\bpacific northwest\b|\bpnw\b|\bpuget sound\b/ },
  { key: "pacific", name: "Hawaii and Alaska", short: "HI / AK", pay: 1.32, perdiem: 205, weight: 2,
    words: /\bhawaii\b|\balaska\b|\bpearl harbor\b|\boverseas\b|\boff the mainland\b/ },
];
export const REGION = Object.fromEntries(REGIONS.map((r) => [r.key, r]));

/** Coast groupings people say out loud. */
export const COASTS = [
  { key: "east-coast", name: "East Coast", regions: ["hampton-roads", "atlantic", "northeast"], words: /\beast coast\b|\batlantic coast\b/ },
  { key: "west-coast", name: "West Coast", regions: ["southern-california", "pacific-northwest"], words: /\bwest coast\b|\bpacific coast\b/ },
];

/** Shipyard and industrial towns with work. `yards` sets how much work lands there. */
export const PLACES = [
  // Hampton Roads
  { key: "newport-news-va", city: "Newport News", state: "VA", region: "hampton-roads", lat: 36.9788, lon: -76.428, yards: 10, naval: true },
  { key: "norfolk-va", city: "Norfolk", state: "VA", region: "hampton-roads", lat: 36.8508, lon: -76.2859, yards: 9, naval: true },
  { key: "portsmouth-va", city: "Portsmouth", state: "VA", region: "hampton-roads", lat: 36.8354, lon: -76.2983, yards: 7, naval: true },
  { key: "chesapeake-va", city: "Chesapeake", state: "VA", region: "hampton-roads", lat: 36.7682, lon: -76.2875, yards: 4 },
  { key: "virginia-beach-va", city: "Virginia Beach", state: "VA", region: "hampton-roads", lat: 36.8529, lon: -75.978, yards: 2, naval: true },
  { key: "hampton-va", city: "Hampton", state: "VA", region: "hampton-roads", lat: 37.0299, lon: -76.3452, yards: 2 },
  { key: "suffolk-va", city: "Suffolk", state: "VA", region: "hampton-roads", lat: 36.7282, lon: -76.5836, yards: 2 },
  { key: "yorktown-va", city: "Yorktown", state: "VA", region: "hampton-roads", lat: 37.2388, lon: -76.5097, yards: 1, naval: true },
  { key: "williamsburg-va", city: "Williamsburg", state: "VA", region: "hampton-roads", lat: 37.2707, lon: -76.7075, yards: 1 },
  // Gulf Coast
  { key: "mobile-al", city: "Mobile", state: "AL", region: "gulf-coast", lat: 30.6954, lon: -88.0399, yards: 9, naval: true },
  { key: "theodore-al", city: "Theodore", state: "AL", region: "gulf-coast", lat: 30.5477, lon: -88.1753, yards: 2 },
  { key: "bayou-la-batre-al", city: "Bayou La Batre", state: "AL", region: "gulf-coast", lat: 30.4035, lon: -88.2486, yards: 3 },
  { key: "pascagoula-ms", city: "Pascagoula", state: "MS", region: "gulf-coast", lat: 30.3658, lon: -88.5561, yards: 8, naval: true },
  { key: "moss-point-ms", city: "Moss Point", state: "MS", region: "gulf-coast", lat: 30.4116, lon: -88.5345, yards: 1 },
  { key: "gulfport-ms", city: "Gulfport", state: "MS", region: "gulf-coast", lat: 30.3674, lon: -89.0928, yards: 3 },
  { key: "pensacola-fl", city: "Pensacola", state: "FL", region: "gulf-coast", lat: 30.4213, lon: -87.2169, yards: 2 },
  { key: "panama-city-fl", city: "Panama City", state: "FL", region: "gulf-coast", lat: 30.1588, lon: -85.6602, yards: 2 },
  { key: "houma-la", city: "Houma", state: "LA", region: "gulf-coast", lat: 29.5958, lon: -90.7195, yards: 3 },
  { key: "new-orleans-la", city: "New Orleans", state: "LA", region: "gulf-coast", lat: 29.9511, lon: -90.0715, yards: 2 },
  { key: "lake-charles-la", city: "Lake Charles", state: "LA", region: "gulf-coast", lat: 30.2266, lon: -93.2174, yards: 2, plant: true },
  { key: "beaumont-tx", city: "Beaumont", state: "TX", region: "gulf-coast", lat: 30.0802, lon: -94.1266, yards: 2, plant: true },
  { key: "galveston-tx", city: "Galveston", state: "TX", region: "gulf-coast", lat: 29.3013, lon: -94.7977, yards: 1 },
  { key: "corpus-christi-tx", city: "Corpus Christi", state: "TX", region: "gulf-coast", lat: 27.8006, lon: -97.3964, yards: 2, plant: true },
  // Southern California
  { key: "san-diego-ca", city: "San Diego", state: "CA", region: "southern-california", lat: 32.7157, lon: -117.1611, yards: 8, naval: true },
  { key: "national-city-ca", city: "National City", state: "CA", region: "southern-california", lat: 32.6781, lon: -117.0992, yards: 5, naval: true },
  { key: "chula-vista-ca", city: "Chula Vista", state: "CA", region: "southern-california", lat: 32.6401, lon: -117.0842, yards: 2 },
  { key: "coronado-ca", city: "Coronado", state: "CA", region: "southern-california", lat: 32.6859, lon: -117.1831, yards: 1, naval: true },
  { key: "long-beach-ca", city: "Long Beach", state: "CA", region: "southern-california", lat: 33.7701, lon: -118.1937, yards: 2 },
  // South Atlantic
  { key: "charleston-sc", city: "Charleston", state: "SC", region: "atlantic", lat: 32.7765, lon: -79.9311, yards: 3, naval: true },
  { key: "jacksonville-fl", city: "Jacksonville", state: "FL", region: "atlantic", lat: 30.3322, lon: -81.6557, yards: 3, naval: true },
  { key: "brunswick-ga", city: "Brunswick", state: "GA", region: "atlantic", lat: 31.1499, lon: -81.4915, yards: 1 },
  { key: "savannah-ga", city: "Savannah", state: "GA", region: "atlantic", lat: 32.0809, lon: -81.0912, yards: 1, plant: true },
  { key: "wilmington-nc", city: "Wilmington", state: "NC", region: "atlantic", lat: 34.2257, lon: -77.9447, yards: 1 },
  // Northeast
  { key: "groton-ct", city: "Groton", state: "CT", region: "northeast", lat: 41.3501, lon: -72.0787, yards: 4, naval: true },
  { key: "north-kingstown-ri", city: "North Kingstown", state: "RI", region: "northeast", lat: 41.5501, lon: -71.4662, yards: 2, naval: true },
  { key: "bath-me", city: "Bath", state: "ME", region: "northeast", lat: 43.9109, lon: -69.8206, yards: 3, naval: true },
  { key: "kittery-me", city: "Kittery", state: "ME", region: "northeast", lat: 43.0881, lon: -70.7364, yards: 1, naval: true },
  { key: "philadelphia-pa", city: "Philadelphia", state: "PA", region: "northeast", lat: 39.9526, lon: -75.1652, yards: 2 },
  { key: "baltimore-md", city: "Baltimore", state: "MD", region: "northeast", lat: 39.2904, lon: -76.6122, yards: 1 },
  // Great Lakes
  { key: "marinette-wi", city: "Marinette", state: "WI", region: "great-lakes", lat: 45.1, lon: -87.6307, yards: 2, naval: true },
  { key: "sturgeon-bay-wi", city: "Sturgeon Bay", state: "WI", region: "great-lakes", lat: 44.8342, lon: -87.377, yards: 1 },
  { key: "erie-pa", city: "Erie", state: "PA", region: "great-lakes", lat: 42.1292, lon: -80.0851, yards: 1 },
  // Pacific Northwest
  { key: "bremerton-wa", city: "Bremerton", state: "WA", region: "pacific-northwest", lat: 47.5673, lon: -122.6326, yards: 3, naval: true },
  { key: "everett-wa", city: "Everett", state: "WA", region: "pacific-northwest", lat: 47.979, lon: -122.2021, yards: 1, naval: true },
  { key: "seattle-wa", city: "Seattle", state: "WA", region: "pacific-northwest", lat: 47.6062, lon: -122.3321, yards: 2 },
  { key: "tacoma-wa", city: "Tacoma", state: "WA", region: "pacific-northwest", lat: 47.2529, lon: -122.4443, yards: 1 },
  { key: "portland-or", city: "Portland", state: "OR", region: "pacific-northwest", lat: 45.5152, lon: -122.6784, yards: 1 },
  // Hawaii and Alaska
  { key: "honolulu-hi", city: "Honolulu", state: "HI", region: "pacific", lat: 21.3069, lon: -157.8583, yards: 2, naval: true },
  { key: "ketchikan-ak", city: "Ketchikan", state: "AK", region: "pacific", lat: 55.3422, lon: -131.6461, yards: 1 },
];
export const PLACE = Object.fromEntries(PLACES.map((p) => [p.key, p]));

export const STATES = {
  VA: "Virginia", AL: "Alabama", MS: "Mississippi", FL: "Florida", LA: "Louisiana", TX: "Texas", CA: "California",
  SC: "South Carolina", GA: "Georgia", NC: "North Carolina", CT: "Connecticut", RI: "Rhode Island", ME: "Maine",
  PA: "Pennsylvania", MD: "Maryland", WI: "Wisconsin", WA: "Washington", OR: "Oregon", HI: "Hawaii", AK: "Alaska",
};

/** CTR's real offices, from ctrc.com. */
export const OFFICES = [
  { key: "newport-news-va", place: "newport-news-va", name: "Newport News", role: "Headquarters",
    street: "11843 Canon Blvd., Suite C", city: "Newport News", state: "VA", zip: "23606", phone: "757-873-5900",
    lat: 37.0915, lon: -76.4796 },
  { key: "portsmouth-va", place: "portsmouth-va", name: "Portsmouth", role: "Southside office",
    street: "309 County St., Suite 204", city: "Portsmouth", state: "VA", zip: "23704", phone: "757-873-5900",
    lat: 36.8338, lon: -76.3023 },
  { key: "mobile-al", place: "mobile-al", name: "Mobile", role: "Gulf Coast office",
    street: "5101 Halls Mill Rd.", city: "Mobile", state: "AL", zip: "36693", phone: "251-216-9983",
    lat: 30.6194, lon: -88.1323 },
  { key: "national-city-ca", place: "national-city-ca", name: "National City", role: "West Coast office",
    street: "1010 W 19th St., Suite C", city: "National City", state: "CA", zip: "91950", phone: "619-866-6172",
    lat: 32.6683, lon: -117.1089 },
];
export const OFFICE = Object.fromEntries(OFFICES.map((o) => [o.key, o]));

export const COMPANY = {
  name: "CTR Group", legal: "CTR Corporation", founded: 1987, phone: "757-873-5900", tollFree: "1-855-CTR-JOBS",
  email: "contact@ctrc.com", site: "https://www.ctrc.com",
  social: {
    linkedin: "https://www.linkedin.com/company/ctrgroup", facebook: "https://www.facebook.com/ctrcorp",
    instagram: "https://www.instagram.com/ctrjobs", youtube: "https://www.youtube.com/channel/UCd1bos0ZFKJ8-l6BfXBvvGw",
    x: "https://x.com/ctrjobs",
  },
};

/** The day the dummy data is "as of". Fixed so the generated site is stable. */
export const AS_OF = "2026-11-19";

// ---------- helpers ----------

export function slugify(text) {
  return String(text).toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

/** Miles between two points. */
export function miles(a, b) {
  const rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad;
  const dLon = (b.lon - a.lon) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLon / 2) ** 2;
  return 3958.8 * 2 * Math.asin(Math.sqrt(h));
}

export function placeName(place) {
  return `${place.city}, ${place.state}`;
}

export function money(n, digits = 0) {
  return "$" + Number(n).toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

/** "$31–36/hr" or "$78K–92K/yr". */
export function payLabel(job) {
  if (job.salary) return `${money(Math.round(job.salary[0] / 1000))}K–${Math.round(job.salary[1] / 1000)}K/yr`;
  return `${money(job.pay[0])}–${job.pay[1]}/hr`;
}

export function daysBetween(a, b) {
  return Math.round((Date.parse(b) - Date.parse(a)) / 86400000);
}

/** "Today", "Yesterday", "3 days ago", "Oct 28". */
export function postedLabel(date, asOf = AS_OF) {
  const d = daysBetween(date, asOf);
  if (d <= 0) return "Today";
  if (d === 1) return "Yesterday";
  if (d < 14) return `${d} days ago`;
  return new Date(date + "T12:00:00Z").toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}

export function esc(text) {
  return String(text ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
