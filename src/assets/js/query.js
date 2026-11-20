// The query bar's reader. One sentence in plain words becomes a set of filters, each tied to the
// words that set it, so a chip can be removed by removing its words.
//
// Reading runs on jevbar's code path (readOffline): every filter here is settled by the words
// themselves, so it is instant and works offline. A server with a TypeSafe key can hand the same
// schema to createReader(schema, jev(...)) later for the vaguer asks, without changing this module's
// callers.

import { readOffline, statedDistance, statedSpan, phraseCandidates, ghostFor, suggest as jevSuggest } from "./jevbar/index.js";
import {
  TRADES, TRADE, LEVELS, LEVEL, CERTS, CERT, PERKS, PERK, PROGRAMS, PROGRAM, SHIFTS, SHIFT, TYPES, TYPE,
  REGIONS, REGION, COASTS, PLACES, PLACE, STATES, AS_OF, miles, placeName, daysBetween,
} from "./catalog.js";

const escapeRe = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const globalize = (re) => new RegExp(re.source, re.flags.includes("g") ? re.flags : re.flags + "g");

/** Every [start, end] where `re` matches `lower`. */
function rangesOf(lower, re) {
  const out = [];
  for (const m of lower.matchAll(globalize(re))) if (m[0]) out.push([m.index, m.index + m[0].length]);
  return out;
}

/** The key of whichever entry's words appear first in the sentence. */
function firstStated(list, sentence) {
  const lower = sentence.toLowerCase();
  let best = null;
  for (const item of list) {
    const m = globalize(item.words).exec(lower);
    if (m && (!best || m.index < best.at)) best = { key: item.key, at: m.index };
  }
  return best?.key ?? null;
}

// ---------- places ----------

const ALIASES = {
  "virginia-beach-va": ["va beach"],
  "new-orleans-la": ["nola"],
  "honolulu-hi": ["pearl harbor", "oahu"],
  "jacksonville-fl": ["mayport", "jax"],
  "north-kingstown-ri": ["quonset point", "quonset"],
  "kittery-me": ["portsmouth naval shipyard"],
  "groton-ct": ["new london"],
  "corpus-christi-tx": ["corpus"],
  "national-city-ca": ["natl city", "nat'l city"],
  "panama-city-fl": ["panama city beach"],
  "bremerton-wa": ["puget sound naval shipyard"],
};

const WHERE = [];
for (const place of PLACES) {
  for (const name of [place.city.toLowerCase(), ...(ALIASES[place.key] ?? [])]) {
    const guard = name === "mobile" ? "(?! cranes?\\b)" : name === "portsmouth" ? "(?! naval shipyard)(?!,? (?:nh|new hampshire)\\b)" : name === "bath" ? "(?=,? ?(?:me|maine)\\b)" : "";
    WHERE.push({ id: `place:${place.key}`, kind: "place", key: place.key, label: placeName(place), re: new RegExp(`\\b${escapeRe(name)}\\b${guard}(?:,?\\s*${place.state.toLowerCase()}\\b)?`) });
  }
}
for (const region of REGIONS) WHERE.push({ id: `region:${region.key}`, kind: "region", key: region.key, label: region.name, re: region.words });
for (const coast of COASTS) WHERE.push({ id: `coast:${coast.key}`, kind: "coast", key: coast.key, label: coast.name, re: coast.words });
for (const [code, name] of Object.entries(STATES)) {
  const guard = code === "VA" ? "(?! beach)" : code === "WA" ? "(?! ?d\\.?c\\.?)" : "";
  WHERE.push({ id: `state:${code}`, kind: "state", key: code, label: name, re: new RegExp(`\\b${name.toLowerCase()}\\b${guard}`) });
}
const RANK = { place: 0, region: 1, coast: 2, state: 3 };

/** Where the sentence asks for: a town, a region, a coast or a state, with its words. */
export function findWhere(sentence) {
  const lower = sentence.toLowerCase();
  let best = null;
  for (const entry of WHERE) {
    const m = globalize(entry.re).exec(lower);
    if (!m) continue;
    const found = { ...entry, range: [m.index, m.index + m[0].length] };
    const overlaps = best && found.range[0] < best.range[1] && best.range[0] < found.range[1];
    const longer = best && found.range[1] - found.range[0] > best.range[1] - best.range[0];
    const better = !best || (overlaps ? longer || (!longer && found.range[1] - found.range[0] === best.range[1] - best.range[0] && RANK[entry.kind] < RANK[best.kind]) : RANK[entry.kind] < RANK[best.kind]);
    if (better) best = found;
  }
  if (!best) {
    // Two-letter state codes, written the way addresses write them: "in VA", "Pascagoula, MS".
    const m = /(?:,\s*|\bin\s+)([A-Z]{2})\b/.exec(sentence) ?? /\b(VA|AL|MS|LA|TX|CA|SC|GA|NC|CT|RI|ME|PA|MD|WI|WA|OR|HI|AK|FL)\b/.exec(sentence);
    if (m && STATES[m[1].toUpperCase()]) {
      const start = m.index + m[0].indexOf(m[1]);
      best = { id: `state:${m[1].toUpperCase()}`, kind: "state", key: m[1].toUpperCase(), label: STATES[m[1].toUpperCase()], range: [start, start + 2] };
    }
  }
  return best;
}

const WHERE_OPTIONS = Object.fromEntries(WHERE.map((w) => [w.id, w.label]));

// ---------- pay ----------

const PAY_RE = /(?:\b(over|above|at least|min(?:imum)?|more than|starting at|paying|pays|making|make|earn|north of|under|below|less than|up to|max(?:imum)?)\s+)?(\$\s?)?(\d{2,3}(?:,\d{3})?(?:\.\d{1,2})?)\s?(k\b)?\s*(\+|\/\s?h(?:ou)?r\b|\/\s?hour\b|an hour\b|per hour\b|hourly\b|bucks\b|dollars\b|a year\b|\/\s?yr\b|per year\b|a yr\b|annually\b)?(\s*(?:an hour|per hour|\/hr|a year|\/yr|\+))?/g;
const CEILING = /^(under|below|less than|up to|max|maximum)$/;

/** A pay floor or ceiling the sentence states, as $/hr. */
export function findPay(lower) {
  for (const m of lower.matchAll(PAY_RE)) {
    const [whole, lead, dollar, digits, k, unit, unit2] = m;
    const after = lower.slice(m.index + whole.length);
    if (!dollar && !k && !unit && !unit2 && !(lead && !/^(from|make)$/.test(lead))) continue;
    if (/^\s*(?:mi\b|miles?|km|%|x\b|×|days?|weeks?|months?|hours?\b|hrs?\b|s\b|-?hour|\/\s?d(?:ay)?\b|a day\b|per day\b|daily\b)/.test(after)) continue;
    let value = Number(digits.replace(/,/g, ""));
    if (k) value *= 1000;
    const yearly = Boolean(k) || /year|yr|annual/.test(`${unit ?? ""}${unit2 ?? ""}`) || value >= 1000;
    const hourly = yearly ? Math.round(value / 2080) : value;
    if (hourly < 10 || hourly > 150) continue;
    const ceiling = lead && CEILING.test(lead);
    return { [ceiling ? "max" : "min"]: hourly, yearly, range: [m.index, m.index + whole.trimEnd().length] };
  }
  return null;
}

// ---------- typos ----------

const DICTIONARY = new Set(
  `welder welders welding shipfitter shipfitters fitter fitters pipefitter pipefitters machinist machinists electrician
  electricians electrical electronics painter painters blaster blasters shipwright shipwrights scaffold scaffolding rigger
  riggers rigging crane operator boilermaker insulator insulators inspector inspectors inspection burner burners joiner
  carpenter laborer laborers mechanic mechanics maintenance planner scheduler warehouse forklift engineer engineers
  designer structural combo aluminum journeyman apprentice helper foreman supervisor experienced nights night swing
  weekend weekends contract contractor temporary permanent overtime benefits diem travel traveling submarine submarines
  carrier destroyer offshore refinery turnaround commercial clearance citizen secret
  ${PLACES.map((p) => p.city.toLowerCase()).join(" ")}
  ${Object.values(STATES).join(" ").toLowerCase()}`.split(/\s+/).filter((w) => w.length >= 4),
);

function within(a, b, max) {
  if (Math.abs(a.length - b.length) > max) return false;
  let prev2 = null;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const row = [i];
    let low = i;
    for (let j = 1; j <= b.length; j++) {
      let v = Math.min(prev[j] + 1, row[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      if (prev2 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) v = Math.min(v, prev2[j - 2] + 1);
      row[j] = v;
      low = Math.min(low, v);
    }
    if (low > max) return false;
    prev2 = prev;
    prev = row;
  }
  return prev[b.length] <= max;
}

const KNOWN = new Set(`with near nights days shift jobs work over under and the for any some that want need find show from hire class first second local only hour year`.split(" "));

/** Fixes misspelled trade, place and filter words: "weldr in pascagula" → "welder in pascagoula". */
export function fixTypos(text) {
  const fixes = [];
  const out = text.replace(/[A-Za-z]{5,}/g, (word) => {
    const lower = word.toLowerCase();
    if (DICTIONARY.has(lower) || KNOWN.has(lower)) return word;
    const max = lower.length >= 8 ? 2 : 1;
    for (const known of DICTIONARY) {
      if (known[0] !== lower[0] && max === 1) continue;
      if (known.startsWith(lower) || lower.startsWith(known)) continue;
      if (within(lower, known, max)) {
        fixes.push({ from: word, to: known });
        return known;
      }
    }
    return word;
  });
  return { text: out, fixes };
}

// ---------- the schema jevbar reads with ----------

const subject = (prefix, list) => Object.fromEntries(list.map((item) => [`${prefix}:${item.key}`, { about: item.name, words: item.words }]));
const options = (list) => Object.fromEntries(list.map((item) => [item.key, item.long ?? item.name]));

const TRAVEL = [
  { key: "travel", name: "Travel jobs", words: /\btravel(?:er|ers|ing)?\b(?! pay)|\bon the road\b|\bout of town\b|\bwilling to relocate\b|\bgo anywhere\b|\banywhere\b/ },
  { key: "local", name: "Local only", words: /\blocal(?: only)?\b|\bhome (?:every|each|at) night\b|\bnights at home\b|\bno travel\b|\bnear home\b|\bclose to home\b|\bcommut\w+/ },
];
const SORTS = [
  { key: "pay", name: "Best pay", words: /\b(?:best|highest|top|most|good|great)[- ](?:pay(?:ing)?|paid|money|rates?|dollar)\b|\bpays? (?:the )?(?:most|best|well|good)\b|\bbig money\b|\bhighest\b|\bbest paying\b|\bmost money\b/ },
  { key: "closest", name: "Closest", words: /\bclosest\b|\bnearest\b|\bnear me\b|\bnearby\b|\bclose to me\b|\bclose by\b/ },
  { key: "newest", name: "Newest", words: /\bnew(?:est)?\b(?! (?:to|york|orleans|london|haven|bern|iberia|hampshire|jersey|port)\b)|\blatest\b|\bjust posted\b|\brecent(?:ly)?(?: posted)?\b/ },
];
const POSTED_RE = /\b(?:posted |added )?(?:in the )?(?:last|past|previous)\s+(?:\d+|few|couple(?: of)?)?\s*(?:hours?|days?|weeks?|months?)\b|\b(?:posted |added )?(?:today|yesterday|this week|this month)\b/;
const ALERT_RE = /\b(?:alert|notify|email|text|ping) me\b|\blet me know\b|\bsave (?:this|the|my) search\b|\bjob alerts?\b/;
const NEAR_ME_RE = /\bnear me\b|\bclose to me\b|\bnearby\b|\bclose by\b/;
const SCHEDULE_RE = /\b([3-7])\s?[x×]\s?(8|10|12)'?s?\b/;
const PERDIEM_RE = /(?:\b(?:over|above|at least|min(?:imum)?|more than|north of)\s+)?\$\s?(\d{2,3})\s*(?:\/\s?d(?:ay)?\b|a day\b|per day\b|daily\b)/;
const RADIUS_RE = /\b(?:within|inside|under|less than|in a)?\s*(\d{1,3})\s*(?:-\s*)?(?:mi|miles?|mile radius)\b(?:\s*(?:of|from|around|radius))?/;

export const SCHEMA = {
  actions: { search: "Find jobs and show them.", alert: "Save this search and send alerts when new jobs match." },
  defaultAction: "search",
  subjects: { ...subject("trade", TRADES), ...subject("cert", CERTS), ...subject("perk", PERKS), ...subject("program", PROGRAMS) },
  choices: {
    level: { question: "What skill level does `sentence` ask for?", options: options(LEVELS), stated: (s) => firstStated(LEVELS, s) },
    shift: { question: "Which shift does `sentence` want?", options: options(SHIFTS), stated: (s) => firstStated(SHIFTS, s) },
    type: { question: "What kind of hire does `sentence` want?", options: options(TYPES), stated: (s) => firstStated(TYPES, s) },
    travel: { question: "Does `sentence` want to travel for work or stay local?", options: options(TRAVEL), stated: (s) => firstStated(TRAVEL, s) },
    sort: { question: "In what order does `sentence` want jobs?", options: options(SORTS), stated: (s) => firstStated(SORTS, s) },
    where: { question: "Where does `sentence` want to work?", options: WHERE_OPTIONS, stated: (s) => findWhere(s)?.id ?? null },
  },
};

// ---------- reading ----------

const STOP = new Set(`a an the and or of in on at to for with from by near around within me my i i'm im we us you your our is are be
  was am it its that this these those some any all job jobs work working gig gigs position positions opening openings role roles
  hiring hire find show get got give looking look want wants need needs please can could would like something anything
  where what who which how yard yards shipyard shipyards shipbuilding company per hour hr hours an pay pays paying good great
  available open now also just only than more less up out new there here area class over under around about into job's
  i'd i've let know time full part type kind somewhere close operator operators tech techs technician worker workers hand
  hands guy guys crew crews person people when open soon then if them they ones one start starting right away asap`.split(/\s+/));

/** Words that can narrow a trade to a specialty: "pipe welder", "mobile crane", "tank painter". */
const SPECIALTY_WORDS = new Set(TRADES.flatMap((t) => t.specialties.flatMap((s) => s.toLowerCase().split(/[^a-z0-9]+/))).filter((w) => w.length >= 2 && !["and", "shop", "the"].includes(w)));

/**
 * Read one sentence. Returns the filters, one item per filter (with the character ranges of the
 * words that set it), notes for the reader, and the jevbar intent underneath.
 */
export function read(raw) {
  const { text, fixes } = fixTypos(raw.slice(0, 300));
  const lower = text.toLowerCase();
  const intent = readOffline(SCHEMA, text);
  const items = [];
  const taken = [];
  const take = (ranges) => taken.push(...ranges);
  const add = (item) => {
    take(item.ranges);
    items.push(item);
  };
  const leadBefore = (start, leads) => {
    const m = new RegExp(`(?:\\b(?:${leads})\\s+)$`).exec(lower.slice(0, start));
    return m ? m.index : start;
  };

  const f = { trades: [], certs: [], perks: [], programs: [], spec: [], words: [], level: null, shift: null, type: null, travel: null, sort: null, where: null, radius: null, pay: null, posted: null, schedule: null, perDiemMin: null, action: "search", nearMe: false };

  for (const id of intent.subjects) {
    const [kind, key] = id.split(":");
    const def = { trade: TRADE, cert: CERT, perk: PERK, program: PROGRAM }[kind][key];
    const ranges = rangesOf(lower, def.words).map(([s, e]) => [kind === "trade" ? s : leadBefore(s, "with|with an?|have an?|have|needs?|requires?|on|doing"), e]);
    f[{ trade: "trades", cert: "certs", perk: "perks", program: "programs" }[kind]].push(key);
    add({ kind, key, label: def.name, ranges });
  }
  // "Inside" and "outside machinist" each mean one trade, not both.
  if (f.trades.includes("inside-machinist") && f.trades.includes("outside-machinist")) {
    const drop = /\boutside machinist/.test(lower) ? "inside-machinist" : /\binside machinist/.test(lower) ? "outside-machinist" : null;
    if (drop) {
      f.trades = f.trades.filter((t) => t !== drop);
      items.splice(items.findIndex((i) => i.key === drop), 1);
    }
  }

  const choice = (name, list, kind) => {
    const key = intent.choices[name];
    if (!key) return;
    const def = list.find((d) => d.key === key);
    f[name] = key;
    add({ kind, key, label: def.long ?? def.name, ranges: rangesOf(lower, def.words) });
  };
  choice("level", LEVELS, "level");
  choice("shift", SHIFTS, "shift");
  choice("type", TYPES, "type");
  choice("travel", TRAVEL, "travel");
  choice("sort", SORTS, "sort");

  const notes = [];
  if (intent.choices.where) {
    const where = findWhere(text);
    const start = leadBefore(where.range[0], "near|in|around|at|by|outside of|outside|close to|from|out of|based in|down in|up in|over in");
    f.where = where;
    const radius = RADIUS_RE.exec(lower);
    if (radius && where.kind === "place") {
      f.radius = statedDistance(radius[0]) ?? Number(radius[1]);
      take([[radius.index, radius.index + radius[0].length]]);
    }
    if (where.kind === "place" && !f.radius) f.radius = 30;
    add({ kind: "where", key: where.id, label: where.kind === "place" ? `${where.label} · ${f.radius} mi` : where.label, ranges: [[start, where.range[1]], ...(radius && where.kind === "place" ? [[radius.index, radius.index + radius[0].length]] : [])] });
  } else {
    // A place we don't staff: say so, and keep going.
    const known = (p) => Object.values(SCHEMA.subjects).some((sub) => sub.words.test(p.toLowerCase())) || STOP.has(p.toLowerCase());
    const skip = /^(me|home|here|town|my area|the area|the yard|state|nights?|days?|tanks?|the|a)$/i;
    const found = [
      ...phraseCandidates(text, { leads: ["near", "around", "outside"], exclude: skip }),
      ...phraseCandidates(text, { leads: ["in"], exclude: skip }).filter((p) => /^[A-Z]/.test(p)),
    ].filter((p) => p.split(" ").length <= 3 && !/\d/.test(p) && !known(p))
      .map((p) => p.replace(/\b[a-z]/g, (c) => c.toUpperCase()));
    if (found.length) {
      const name = found[0];
      const at = lower.indexOf(name.toLowerCase());
      f.unknownPlace = name;
      if (at >= 0) take([[leadBefore(at, "near|in|around|outside"), at + name.length]]);
      notes.push(`No CTR work near ${name} yet. Showing every location, travel jobs with per diem first.`);
    }
  }

  const pay = findPay(lower);
  if (pay) {
    f.pay = pay;
    add({ kind: "pay", key: "pay", label: pay.min ? `≥ $${pay.min}/hr` : `≤ $${pay.max}/hr`, ranges: [pay.range] });
  }

  const sched = SCHEDULE_RE.exec(lower);
  if (sched) {
    f.schedule = `${sched[1]}x${sched[2]}`;
    add({ kind: "schedule", key: f.schedule, label: `${sched[1]}×${sched[2]}s`, ranges: [[sched.index, sched.index + sched[0].length]] });
  }

  const diem = PERDIEM_RE.exec(lower);
  if (diem) {
    f.perDiemMin = Number(diem[1]);
    if (!f.perks.includes("perdiem")) f.perks.push("perdiem");
    add({ kind: "perdiem", key: "perdiem-min", label: `Per diem ≥ $${diem[1]}/day`, ranges: [[diem.index, diem.index + diem[0].length]] });
  }

  const posted = POSTED_RE.exec(lower);
  if (posted) {
    const span = statedSpan(posted[0]);
    const days = span ? Math.max(1, Math.round(span.hours / 24)) : 7;
    f.posted = days;
    add({ kind: "posted", key: "posted", label: days <= 1 ? "Posted today" : `Last ${days} days`, ranges: [[posted.index, posted.index + posted[0].length]] });
  }

  if (ALERT_RE.test(lower)) {
    f.action = "alert";
    take(rangesOf(lower, ALERT_RE));
  }
  if (NEAR_ME_RE.test(lower)) {
    f.nearMe = true;
    take(rangesOf(lower, NEAR_ME_RE));
  }

  // What's left over: specialty words narrow the trade, anything else ranks.
  const blank = [...lower];
  for (const [s, e] of taken) for (let i = s; i < e; i++) blank[i] = " ";
  const rest = blank.join("");
  for (const m of rest.matchAll(/[a-z0-9][a-z0-9'./-]*/g)) {
    const word = m[0].replace(/[.']+$/, "");
    if (STOP.has(word) || word.length < 2 || /^\d+$/.test(word)) continue;
    const range = [m.index, m.index + m[0].length];
    if (SPECIALTY_WORDS.has(word) && f.trades.length) {
      f.spec.push(word);
      add({ kind: "spec", key: word, label: word.toUpperCase().length <= 4 ? word.toUpperCase() : word[0].toUpperCase() + word.slice(1), ranges: [range] });
    } else if (word.length >= 3) {
      f.words.push(word);
      add({ kind: "word", key: word, label: `“${word}”`, ranges: [range] });
    }
  }

  notes.unshift(...fixes.map((fix) => `Read “${fix.from}” as “${fix.to}”.`));
  return { raw, text, filters: f, items, notes, intent, fixes };
}

// ---------- matching ----------

const top = (job) => (job.pay ? job.pay[1] : job.salary[1] / 2080);
const bottom = (job) => (job.pay ? job.pay[0] : job.salary[0] / 2080);

function centerOf(where) {
  if (where?.kind === "place") return PLACE[where.key];
  return null;
}

function test(job, f, origin) {
  if (f.trades.length && !f.trades.includes(job.trade)) return false;
  if (f.level && job.level !== f.level) return false;
  if (f.shift && job.shift !== f.shift) return false;
  if (f.type && job.type !== f.type) return false;
  if (f.travel === "travel" && !job.travel) return false;
  if (f.travel === "local" && job.travel) return false;
  if (f.where) {
    const place = PLACE[job.place];
    const w = f.where;
    if (w.kind === "place" && miles(place, PLACE[w.key]) > (f.radius ?? 30)) return false;
    if (w.kind === "region" && job.region !== w.key) return false;
    if (w.kind === "coast" && !COASTS.find((c) => c.key === w.key).regions.includes(job.region)) return false;
    if (w.kind === "state" && place.state !== w.key) return false;
  }
  if (f.pay?.min && top(job) < f.pay.min) return false;
  if (f.pay?.max && bottom(job) > f.pay.max) return false;
  for (const cert of f.certs) if (!job.certs.includes(cert)) return false;
  for (const perk of f.perks) {
    if (perk === "perdiem" && !job.perDiem) return false;
    if (perk === "overtime" && !job.overtime) return false;
    if (perk === "benefits" && !job.benefits) return false;
    if (perk === "bonus" && !job.bonus) return false;
    if (perk === "housing" && !job.housing) return false;
    if (perk === "relocation" && !job.relocation) return false;
  }
  if (f.programs.length && !f.programs.includes(job.program)) return false;
  if (f.schedule && job.schedule.key !== f.schedule) return false;
  if (f.perDiemMin && job.perDiem < f.perDiemMin) return false;
  if (f.posted && daysBetween(job.posted, AS_OF) > f.posted) return false;
  if (f.spec.length) {
    const hay = `${job.title} ${job.specialty}`.toLowerCase();
    if (!f.spec.every((word) => new RegExp(`\\b${escapeRe(word)}`).test(hay))) return false;
  }
  return true;
}

function score(job, words) {
  if (!words.length) return 0;
  const title = job.title.toLowerCase();
  const body = `${job.summary} ${job.yard} ${(job.duties ?? []).join(" ")}`.toLowerCase();
  let s = 0;
  for (const word of words) {
    if (title.includes(word)) s += 3;
    else if (body.includes(word)) s += 1;
  }
  return s;
}

/** Steps to widen a search that found nothing, in the order a recruiter would. */
const RELAX = [
  { field: "posted", when: (f) => f.posted, apply: (f) => (f.posted = null), note: () => "Nothing that new. Showing older postings too." },
  { field: "spec", when: (f) => f.spec.length, apply: (f) => (f.spec = []), note: () => "No exact specialty match. Showing the whole trade." },
  { field: "schedule", when: (f) => f.schedule, apply: (f) => (f.schedule = null), note: () => "Not on that schedule. Showing every schedule." },
  { field: "radius", when: (f) => f.where?.kind === "place" && f.radius < 60, apply: (f) => (f.radius = 60), note: (f) => `Nothing that close. Widened to 60 mi of ${f.where.label}.` },
  { field: "radius", when: (f) => f.where?.kind === "place" && f.radius < 150, apply: (f) => (f.radius = 150), note: (f) => `Nothing that close. Widened to 150 mi of ${f.where.label}.` },
  { field: "pay", when: (f) => f.pay, apply: (f) => (f.pay = null), note: () => "Nothing at that rate here. Showing every rate." },
  { field: "perDiemMin", when: (f) => f.perDiemMin, apply: (f) => (f.perDiemMin = null), note: () => "No per diem that high. Showing lower rates too." },
  { field: "shift", when: (f) => f.shift, apply: (f) => (f.shift = null), note: () => "Not on that shift. Showing all shifts." },
  { field: "level", when: (f) => f.level, apply: (f) => (f.level = null), note: () => "Not at that class. Showing every class." },
  { field: "type", when: (f) => f.type, apply: (f) => (f.type = null), note: () => "Not that kind of hire. Showing every kind." },
  { field: "perks", when: (f) => f.perks.length, apply: (f) => (f.perks = []), note: () => "No match with those perks. Showing jobs without them too." },
  { field: "certs", when: (f) => f.certs.length, apply: (f) => (f.certs = []), note: () => "No match needing all those credentials. Showing the rest." },
  { field: "programs", when: (f) => f.programs.length, apply: (f) => (f.programs = []), note: () => "Nothing on that program. Showing all work." },
  { field: "travel", when: (f) => f.travel, apply: (f) => (f.travel = null), note: () => "Showing local and travel work." },
  { field: "where", when: (f) => f.where, apply: (f) => (f.where = null), note: () => "Nothing there right now. Showing every location." },
];

/**
 * Jobs that match a reading, sorted. Never empty while there are jobs: when nothing matches,
 * the search widens step by step and says how. `origin` is the reader's position for "near me".
 */
export function search(jobs, reading, { origin = null } = {}) {
  const f = structuredClone({ ...reading.filters, where: reading.filters.where ? { ...reading.filters.where, re: undefined } : null });
  const notes = [...reading.notes];
  const original = structuredClone(f);
  const matching = () => jobs.filter((job) => test(job, f, origin));
  let results = matching();
  const applied = [];
  for (const step of RELAX) {
    if (results.length) break;
    if (!step.when(f)) continue;
    step.apply(f);
    applied.push(step);
    results = matching();
  }
  // Put back any widening the final search didn't need, so only the minimum is loosened.
  for (let i = applied.length - 2; i >= 0 && results.length; i--) {
    const step = applied[i];
    if (applied.slice(i + 1).some((later) => later.field === step.field)) continue;
    const before = f[step.field];
    f[step.field] = structuredClone(original[step.field]);
    const again = matching();
    if (again.length) {
      results = again;
      applied.splice(i, 1);
    } else f[step.field] = before;
  }
  for (const step of applied) notes.push(step.note(reading.filters));
  const center = centerOf(f.where) ?? origin;
  const distance = new Map();
  if (center) for (const job of results) distance.set(job.id, miles(PLACE[job.place], center));
  const sort = f.sort ?? (f.nearMe && center ? "closest" : null);
  const scores = new Map(results.map((job) => [job.id, score(job, f.words)]));
  const newest = (a, b) => (a.posted < b.posted ? 1 : a.posted > b.posted ? -1 : Number(b.urgent) - Number(a.urgent));
  results.sort((a, b) => {
    if (f.words.length && scores.get(b.id) !== scores.get(a.id)) return scores.get(b.id) - scores.get(a.id);
    if (reading.filters.unknownPlace && a.travel !== b.travel) return a.travel ? -1 : 1;
    if (sort === "pay") return top(b) - top(a) || newest(a, b);
    if (sort === "closest" && center) return distance.get(a.id) - distance.get(b.id) || newest(a, b);
    return newest(a, b);
  });
  if (f.nearMe && !center) notes.push("Allow location to sort by distance, or say a town.");
  return { results, notes, distance, sort: sort ?? "newest", effective: f };
}

// ---------- editing the sentence from the chips ----------

/** The sentence with one item's words taken out, tidied. */
export function without(reading, item) {
  const chars = [...reading.text];
  for (const [s, e] of item.ranges) for (let i = s; i < e; i++) chars[i] = "\u0000";
  return tidy(chars.join("").replace(/\u0000+/g, " "));
}

/** The sentence with a phrase added, or one kind's words swapped for it. */
export function withPhrase(reading, phrase, replaceKind = null) {
  let text = reading.text;
  if (replaceKind) {
    const chars = [...text];
    for (const item of reading.items.filter((i) => i.kind === replaceKind)) for (const [s, e] of item.ranges) for (let i = s; i < e; i++) chars[i] = "\u0000";
    text = chars.join("").replace(/\u0000+/g, " ");
  }
  text = tidy(text);
  return tidy(text ? `${text}, ${phrase}` : phrase);
}

function tidy(text) {
  return text
    .replace(/\s+/g, " ")
    .replace(/\s+([,.!?])/g, "$1")
    .replace(/,(\s*,)+/g, ",")
    .replace(/^[\s,]+|[\s,]+$/g, "")
    .replace(/\b(with|and|near|in|at|over|on|for|or)\s*(,|$)/gi, "$2")
    .replace(/^(and|with|or)\b\s*/i, "")
    .replace(/[\s,]+$/g, "")
    .trim();
}

// ---------- typing help ----------

export const EXAMPLES = [
  "pipe welder near Norfolk, nights, $35+",
  "shipfitter in Mobile with per diem",
  "1st class pipefitter in San Diego, day shift",
  "entry level fire watch near Newport News",
  "travel jobs with per diem over $40/hr",
  "TWIC jobs on the Gulf Coast",
  "submarine work in Groton",
  "crane operator, NCCCO, 6x10s",
  "direct hire electrician in Hampton Roads",
  "painter blaster near Pascagoula, swing shift",
  "helper jobs, no experience, Chesapeake",
  "CWI inspector with a secret clearance",
  "best paying jobs on the West Coast",
  "outside machinist, carrier work, overtime",
];

const PLACE_LABELS = [...PLACES].sort((a, b) => b.yards - a.yards).map(placeName);

const SHAPES = [
  ["with per diem", 6], ["night shift", 5], ["day shift", 5], ["swing shift", 4], ["1st class", 5], ["2nd class", 4],
  ["temp-to-hire", 4], ["direct hire", 4], ["no experience", 3], ["secret clearance", 3], ["travel jobs", 4], ["overtime", 4],
  ["best paying", 4], ["posted this week", 3], ["local only", 3], ["sign-on bonus", 2], ["Hampton Roads", 4], ["Gulf Coast", 4],
  ["West Coast", 3], ["East Coast", 3], ["over $30/hr", 4], ["over $35/hr", 3],
];
const VOCAB = [
  ...TRADES.map((t) => [t.name.replace(/ \/.*$/, "").toLowerCase(), Math.round(t.weight)]),
  ["pipe welder", 7], ["structural welder", 5], ["combo welder", 3], ["tig welder", 3], ["fitter", 3], ["machinist", 3],
  ["electrician", 6], ["painter", 4], ["blaster", 3], ["crane operator", 3], ["fire watch", 5], ["inspector", 4],
  ["submarine", 3], ["carrier", 2], ["offshore", 3], ["refinery turnaround", 2], ["forklift", 3], ["helper", 4],
];
const NEXT = {
  near: PLACE_LABELS.slice(0, 6).map((p, i) => [p, 6 - i]),
  in: [["Hampton Roads", 5], ["Mobile, AL", 4], ["San Diego, CA", 4]],
  with: [["per diem", 6], ["overtime", 4], ["benefits", 3], ["a TWIC card", 2]],
  over: [["$30/hr", 5], ["$35/hr", 4], ["$40/hr", 3]],
  "1st": [["class", 6]],
  "2nd": [["class", 6]],
  night: [["shift", 5]],
  day: [["shift", 5]],
  swing: [["shift", 5]],
  per: [["diem", 6]],
  fire: [["watch", 6]],
  pipe: [["welder", 6], ["fitter", 4]],
  crane: [["operator", 6]],
  sheet: [["metal", 6]],
  direct: [["hire", 6]],
  secret: [["clearance", 6]],
  entry: [["level", 6]],
  no: [["experience", 6]],
};

/** The grayed rest of what's being typed. */
export function ghost(text, history = []) {
  return ghostFor(text, {
    history,
    entities: { triggers: ["near", "in", "around", "outside"], values: PLACE_LABELS },
    shapes: SHAPES,
    next: NEXT,
    vocab: VOCAB,
  });
}

const TOPICS = [
  ...TRADES.map((t) => {
    const n = t.name.replace(/ \/.*$/, "").toLowerCase();
    return {
      label: t.plural,
      words: `${t.words.source.replace(/\\b|\(\?[:<!=]+|[()?|\\[\]^$*+]/g, " ")} ${t.specialties.join(" ")}`.toLowerCase(),
      asks: t.flat
        ? [`${n} near Newport News, VA`, `${n} jobs with benefits`, `${n} in Mobile, AL`]
        : [`${n} near Newport News, VA`, `1st class ${n} with per diem`, `${n}, nights, over $30/hr`, `${n} helper, no experience`],
      weight: t.weight,
    };
  }),
  ...REGIONS.map((r) => ({ label: r.name, words: `${r.short} ${PLACES.filter((p) => p.region === r.key).map((p) => p.city).join(" ")}`.toLowerCase(), asks: [`welder jobs in ${r.short}`, `travel work in ${r.short} with per diem`], weight: r.weight / 4 })),
  { label: "Travel work", words: "travel per diem road anywhere housing", asks: ["travel jobs with per diem", "travel welder with housing help", "per diem over $150/day"], weight: 5 },
  { label: "Credentials", words: "twic clearance secret navsea tech pub 248 aws d1.1 cwi asnt nccco osha", asks: ["TWIC jobs on the Gulf Coast", "jobs needing a secret clearance", "Tech Pub 248 welder"], weight: 3 },
];

/** Requests that work, ranked against what's typed. */
export function suggestions(text, limit = 6) {
  return jevSuggest(text, TOPICS, { limit, weight: (t) => t.weight ?? 1 }).map((s) => s.ask);
}
