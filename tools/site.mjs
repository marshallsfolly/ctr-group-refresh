// Page templates. Every page is plain HTML with its own title, description, canonical URL and
// structured data; JavaScript only makes it livelier.

import {
  TRADES, TRADE, LEVEL, CERT, SHIFT, TYPE, PROGRAM, REGIONS, REGION, PLACES, PLACE, OFFICES, OFFICE, STATES, COMPANY, AS_OF,
  esc, placeName, payLabel, postedLabel, money, miles, slugify,
} from "../src/assets/js/catalog.js";
import { glyph, plimsoll } from "../src/assets/js/glyphs.js";
import { jobRow, plate, shiftLabel, certList } from "../src/assets/js/render.js";
import { EXAMPLES } from "../src/assets/js/query.js";

export const SITE = {
  base: "https://marshallsfolly.github.io/ctr-group-refresh/",
  production: false,
  version: "dev",
};

const n = (x) => Number(x).toLocaleString("en-US");
const rootFor = (path) => "../".repeat(path.split("/").filter(Boolean).length) || "./";
const abs = (path) => SITE.base + path;
const ld = (data) => `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, "\\u003c")}</script>`;

const ORG_ID = () => abs("#org");
function orgLd() {
  const hq = OFFICE["newport-news-va"];
  return {
    "@context": "https://schema.org",
    "@type": "EmploymentAgency",
    "@id": ORG_ID(),
    name: COMPANY.name,
    legalName: COMPANY.legal,
    url: SITE.base,
    logo: abs("assets/icons/icon-512.png"),
    image: abs("assets/icons/og.png"),
    foundingDate: String(COMPANY.founded),
    telephone: "+1-757-873-5900",
    email: COMPANY.email,
    address: { "@type": "PostalAddress", streetAddress: hq.street, addressLocality: hq.city, addressRegion: hq.state, postalCode: hq.zip, addressCountry: "US" },
    areaServed: { "@type": "Country", name: "United States" },
    sameAs: Object.values(COMPANY.social),
    department: OFFICES.map((o) => ({ "@id": abs(`locations/${o.key}/#office`) })),
  };
}
function crumbsLd(items) {
  return { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: items.map(([name, path], i) => ({ "@type": "ListItem", position: i + 1, name, item: abs(path) })) };
}
function crumbs(root, items) {
  return `<nav aria-label="Breadcrumb"><ol class="crumbs">${items.map(([name, path], i) => `<li>${i === items.length - 1 ? `<span aria-current="page">${esc(name)}</span>` : `<a href="${root}${path}">${esc(name)}</a>`}</li>`).join("")}</ol></nav>`;
}

// ---------- layout ----------

const NAV = [
  ["Jobs", "", "jobs"],
  ["Trades", "trades/", "trades"],
  ["Locations", "locations/", "locations"],
  ["Employers", "employers/", "employers"],
  ["Recruiters", "recruit/", "recruit"],
];

function header(root, current) {
  return `<header class="site-head">
  <div class="wrap">
    <a class="brand" href="${root}" aria-label="CTR Group home">${plimsoll(30)}<span class="brand__ctr">CTR</span><span class="brand__group">Group<small>Since 1987</small></span></a>
    <nav class="nav" aria-label="Main">${NAV.map(([label, path, key]) => `<a href="${root}${path}"${current === key ? ' aria-current="page"' : ""}>${label}</a>`).join("")}</nav>
    <div class="head-actions">
      <a class="btn btn--sm" href="${root}sign-in/" data-session-link>Sign in</a>
      <button class="menu-btn" type="button" aria-expanded="false" aria-controls="drawer" aria-label="Menu"><span></span></button>
    </div>
  </div>
</header>
<div class="drawer" id="drawer" hidden>
  <div class="wrap">
    ${NAV.map(([label, path]) => `<a href="${root}${path}">${label}<span>→</span></a>`).join("")}
    <a href="${root}saved/">Saved jobs<span>→</span></a>
    <a href="${root}account/">Your profile<span>→</span></a>
    <a href="${root}about/">About CTR<span>→</span></a>
    <span class="label">Call us</span>
    <a href="tel:+17578735900">757-873-5900<span>Newport News</span></a>
    <button class="btn btn--line btn--block install" type="button" data-install style="margin-top:20px">Install the CTR Jobs app</button>
  </div>
</div>`;
}

function footer(root, counts) {
  return `<footer class="site-foot">
  <div class="wrap">
    <div class="foot-mark"><b>CTR<span>/</span>GROUP</b>${plimsoll(120)}</div>
    <div class="foot-cols">
      <div><h4>Job seekers</h4><ul>
        <li><a href="${root}">Search ${n(counts.jobs)} jobs</a></li>
        <li><a href="${root}saved/">Saved jobs</a></li>
        <li><a href="${root}sign-in/">Sign in or sign up</a></li>
        <li><a href="${root}account/">Your profile</a></li>
        <li><button class="btn btn--sm btn--orange install" type="button" data-install>Install the app</button></li>
      </ul></div>
      <div><h4>Trades</h4><ul>${["welder", "shipfitter", "pipefitter", "electrician", "painter", "fire-watch"].map((k) => `<li><a href="${root}trades/${k}/">${esc(TRADE[k].plural)}</a></li>`).join("")}<li><a href="${root}trades/">All ${TRADES.length} trades</a></li></ul></div>
      <div><h4>Offices</h4><ul>${OFFICES.map((o) => `<li><a href="${root}locations/${o.key}/">${esc(o.name)}, ${o.state}</a></li>`).join("")}<li><a href="${root}locations/">All ${counts.places} locations</a></li></ul></div>
      <div><h4>Employers</h4><ul>
        <li><a href="${root}employers/">Request talent</a></li>
        <li><a href="${root}recruit/">Recruiter console</a></li>
        <li><a href="${root}about/">About CTR</a></li>
        <li><a href="${root}audit/">SEO audit</a></li>
      </ul></div>
      <div><h4>Contact</h4><ul>
        <li><a href="tel:+17578735900">757-873-5900</a></li>
        <li><a href="tel:+18552875627">${COMPANY.tollFree}</a></li>
        <li><a href="mailto:${COMPANY.email}">${COMPANY.email}</a></li>
        <li><a href="${COMPANY.social.linkedin}" rel="noopener">LinkedIn</a> · <a href="${COMPANY.social.facebook}" rel="noopener">Facebook</a></li>
      </ul></div>
    </div>
    <div class="foot-base"><span>© 2026 ${COMPANY.legal} · Est. 1987 · Made in the U.S.A.</span><span>Concept mockup · jobs and people are sample data</span></div>
  </div>
</footer>`;
}

function tabbar(root, current) {
  const tab = (key, path, label, icon) => `<a href="${root}${path}"${current === key ? ' aria-current="page"' : ""} data-tab="${key}">${icon}<span>${label}</span></a>`;
  const svg = (d) => `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">${d}</svg>`;
  return `<nav class="tabbar" aria-label="App">
  ${tab("jobs", "", "Search", svg('<circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5 21 21"/>'))}
  ${tab("saved", "saved/", "Saved", svg('<path d="M6 3h12v18l-6-4.5L6 21z"/>'))}
  ${tab("applied", "account/#applications", "Applied", svg('<path d="M4 4h16v16H4zM8 9h8M8 13h8M8 17h5"/>'))}
  ${tab("account", "account/", "Profile", svg('<circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4.5-6 8-6s7 2 8 6"/>'))}
</nav>`;
}

/** A whole page. */
export function layout({ path, title, description, body, jsonld = [], scripts = [], current = "", tab = "", counts, head = "", bodyClass = "", chrome = true, foot = true, tabs = true, ogType = "website" }) {
  const root = rootFor(path);
  const url = abs(path);
  const robots = SITE.production ? "index, follow, max-image-preview:large" : "noindex, nofollow";
  return `<!doctype html>
<html lang="en-US" data-root="${root}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${url}">
${head.includes('name="robots"') ? "" : `<meta name="robots" content="${robots}">`}
<meta name="theme-color" content="#c3c8c8">
<meta name="color-scheme" content="light">
<link rel="manifest" href="${root}manifest.webmanifest">
<link rel="icon" href="${root}assets/icons/icon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="${root}assets/icons/apple-touch-icon.png">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="CTR Jobs">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta property="og:type" content="${ogType}">
<meta property="og:site_name" content="CTR Group">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${abs("assets/icons/og.png")}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<link rel="preload" href="${root}assets/fonts/inter-tight.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="${root}assets/fonts/martian-mono.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="${root}assets/fonts/big-shoulders.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="${root}assets/css/site.css?v=${SITE.version}">
${head}
${jsonld.map(ld).join("\n")}
</head>
<body class="${bodyClass}">
${chrome ? `<a class="skip" href="#main">Skip to content</a>
<div class="concept"><div class="wrap"><span>Concept for CTR Group · Nov 2026</span><span>Sample data</span></div></div>
${header(root, current)}` : ""}
<main id="main">
${body}
</main>
${chrome && foot ? footer(root, counts) : ""}
${chrome && tabs ? tabbar(root, tab) : ""}
${chrome && foot ? `<div class="draft" aria-hidden="true"></div>` : ""}
<script type="module" src="${root}assets/js/app.js?v=${SITE.version}"></script>
${scripts.map((s) => `<script type="module" src="${root}assets/js/${s}?v=${SITE.version}"></script>`).join("\n")}
</body>
</html>
`;
}

// ---------- the search block ----------

const QUICK = [
  ["Nights", "nights"], ["Per diem", "with per diem"], ["Over $35/hr", "over $35/hr"], ["Travel", "travel jobs"],
  ["No experience", "no experience"], ["TWIC", "TWIC"], ["Direct hire", "direct hire"], ["Overtime", "overtime"], ["Submarine work", "submarine"],
];

function searchZone({ root, jobs, counts, heading, lede }) {
  const initial = jobs.slice(0, 30);
  const regionCounts = REGIONS.map((r) => [r, jobs.filter((j) => j.region === r.key).length]);
  return `<section class="hero" aria-labelledby="hero-h">
  <div class="wrap">
    <div class="status-line label"><span><i class="dot dot--live"></i>Hiring now</span><span>${n(counts.jobs)} open jobs</span><span>${counts.places} towns</span><span>${TRADES.length} trades</span><span>Est. 1987</span></div>
    <h1 class="display" id="hero-h">${heading}</h1>
    ${lede ? `<p class="lede" style="margin-bottom:28px">${lede}</p>` : ""}
    <div class="search-zone" data-search>
      <form class="qb" role="search" action="${root}" method="get" autocomplete="off">
        <div class="qb__label label"><label for="q">Search jobs in plain words</label><span class="hide-sm" aria-hidden="true">Press <kbd>/</kbd></span></div>
        <div class="qb__field">
          <i class="corner corner--tl"></i><i class="corner corner--tr"></i><i class="corner corner--bl"></i><i class="corner corner--br"></i>
          <span class="qb__prompt" aria-hidden="true">Q›</span>
          <div class="qb__box">
            <div class="qb__ghost" aria-hidden="true"></div>
            <input class="qb__input" id="q" name="q" type="search" inputmode="search" enterkeyhint="search" spellcheck="false" autocapitalize="off" autocorrect="off"
              placeholder="${esc(EXAMPLES[0])}" role="combobox" aria-expanded="false" aria-controls="qb-suggest" aria-autocomplete="list" aria-describedby="qb-reading">
          </div>
          <button class="qb__clear" type="button" aria-label="Clear search" hidden>×</button>
          <button class="qb__go" type="submit" aria-label="Search"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5 21 21"/></svg><span>Search</span></button>
        </div>
        <ul class="qb__suggest" id="qb-suggest" role="listbox" aria-label="Suggested searches" hidden></ul>
        <div class="reading" id="qb-reading" aria-live="polite"><span class="reading__k">Reading</span><span class="reading__empty">Type a trade, a town, a shift or a rate. Everything is optional.</span></div>
        <ul class="notes" aria-live="polite"></ul>
      </form>
      <div class="quick" aria-label="Add to your search">${QUICK.map(([label, phrase]) => `<button type="button" data-add="${esc(phrase)}">${esc(label)}</button>`).join("")}</div>
      <div class="yards" role="group" aria-label="Jobs by region">${regionCounts.map(([r, c]) => `<button type="button" data-region="${r.key}" aria-pressed="false"><b>${n(c)}</b><span>${esc(r.short)}</span></button>`).join("")}</div>
    </div>
  </div>
</section>
<section class="results" aria-label="Job results">
  <div class="wrap">
    <div class="results__bar">
      <div class="count" aria-live="polite"><b data-count>${n(jobs.length)}</b><span class="label" data-count-label>open jobs<br>newest first</span></div>
      <div class="seg" role="group" aria-label="Sort">
        <button type="button" data-sort="newest" aria-pressed="true">Newest</button><button type="button" data-sort="pay" aria-pressed="false">Best pay</button><button type="button" data-sort="closest" aria-pressed="false">Closest</button>
      </div>
    </div>
    <div class="results__grid">
      <div>
        <ol class="jobs" data-jobs>${initial.map((job, i) => jobRow(job, { root, index: i })).join("")}</ol>
        <div class="more"><a class="btn btn--line" href="${root}jobs/" data-more>Show more jobs</a></div>
      </div>
      <aside class="preview" data-preview aria-label="Selected job">${plate(initial[0], { root, heading: "h3" })}</aside>
    </div>
  </div>
</section>`;
}

// ---------- pages ----------

export function homePage({ jobs, counts }) {
  const root = "./";
  const tradeCounts = TRADES.map((t) => [t, jobs.filter((j) => j.trade === t.key).length]);
  return layout({
    path: "",
    title: "Shipyard and Skilled Trades Jobs | CTR Group",
    description: `Search ${n(counts.jobs)} welding, shipfitting, pipefitting and marine trades jobs in Hampton Roads, the Gulf Coast, San Diego and on the road. CTR Group, staffing shipyards since 1987.`,
    current: "jobs",
    tab: "jobs",
    counts,
    scripts: ["search.js"],
    jsonld: [orgLd(), {
      "@context": "https://schema.org", "@type": "WebSite", "@id": abs("#site"), url: SITE.base, name: "CTR Group Jobs", publisher: { "@id": ORG_ID() },
      potentialAction: { "@type": "SearchAction", target: { "@type": "EntryPoint", urlTemplate: `${SITE.base}?q={search_term_string}` }, "query-input": "required name=search_term_string" },
    }],
    body: `${searchZone({ root, jobs, counts, heading: `Skilled trades for America's <em>shipyards</em>.` })}

<section class="section" aria-labelledby="trades-h">
  <div class="wrap">
    <div class="section__head">
      <span class="index"><b>01</b>Trades</span>
      <h2 class="h2" id="trades-h">Every trade that builds a ship.</h2>
      <p class="lede">From fire watch on your first day to lead pipe welder on a carrier overhaul. Pick a trade or just type it in the bar.</p>
    </div>
    <ul class="trades">${tradeCounts.map(([t, c]) => `<li><a href="${root}trades/${t.key}/"><span class="top">${glyph(t.key, 30)}<b>${n(c)}</b></span><strong>${esc(t.plural)}</strong><small>${esc(t.family)}</small></a></li>`).join("")}</ul>
  </div>
</section>

<section class="section" aria-labelledby="how-h">
  <div class="wrap">
    <div class="section__head">
      <span class="index"><b>02</b>How it works</span>
      <h2 class="h2" id="how-h">From search to the gate in three steps.</h2>
      <p class="lede">No forms to fight with. Your phone does the work, and a real recruiter picks up when you call.</p>
    </div>
    <ol class="steps">
      <li><span class="num">0<span>1</span></span><h3>Say what you want.</h3><p>Type it the way you'd tell a recruiter: trade, town, shift, pay. The list changes as you type, and every word you used shows up as a filter you can tap off.</p></li>
      <li><span class="num">0<span>2</span></span><h3>Apply in a minute.</h3><p>Sign in with LinkedIn, a passkey or just your email. Your trade card, certs and work history go with every application, so you only fill it out once.</p></li>
      <li><span class="num">0<span>3</span></span><h3>Meet your recruiter.</h3><p>Do your screening on a video call from your phone, sign your paperwork online, and show up on day one with your badge and orientation already handled.</p></li>
    </ol>
  </div>
</section>

<section class="band" aria-labelledby="safety-h">
  <div class="wrap">
    <span class="label" id="safety-h">CTR is about safety</span>
    <blockquote>“Ignorance about safety is not an excuse.”</blockquote>
    <cite>CTR Safety Manager, FSO</cite>
    <div class="facts">
      <div><b>1987</b><span class="label">Staffing shipyards since</span></div>
      <div><b>90 days</b><span class="label">Replacement guarantee for clients</span></div>
      <div><b>3 coasts</b><span class="label">Atlantic, Gulf and Pacific offices</span></div>
    </div>
  </div>
</section>

<section class="section" aria-labelledby="emp-h">
  <div class="wrap split">
    <div>
      <span class="index"><b>03</b>For employers</span>
      <h2 class="h2" id="emp-h" style="margin:14px 0 18px">Need a crew by Monday?</h2>
      <p class="lede">Tell us the trade, the headcount and the yard. CTR has staffed shipyards and industrial plants since 1987, and every placement carries a 90-day replacement guarantee.</p>
      <p style="display:flex;gap:10px;flex-wrap:wrap;margin-top:24px"><a class="btn btn--hazard" href="${root}employers/">Request talent</a><a class="btn btn--line" href="${root}recruit/">See the recruiter console</a></p>
    </div>
    <dl class="spec">
      <div><dt>Hire types</dt><dd>Contract, temporary, temp-to-hire, direct hire and executive search</dd></div>
      <div><dt>Crafts</dt><dd>${TRADES.length} trades, from fire watch to naval architect</dd></div>
      <div><dt>Coverage</dt><dd>Hampton Roads, the Gulf Coast, San Diego, and travel crews nationwide</dd></div>
      <div><dt>Screening</dt><dd>Weld tests, cert checks, drug screens and video interviews before anyone reaches your gate</dd></div>
      <div><dt>Onboarding</dt><dd>Offer, I-9, W-4, direct deposit and safety orientation done online</dd></div>
      <div><dt>Guarantee</dt><dd>Any concern in the first 90 days, we replace the worker at no extra cost</dd></div>
    </dl>
  </div>
</section>

<section class="section" aria-labelledby="off-h">
  <div class="wrap">
    <div class="section__head">
      <span class="index"><b>04</b>Offices</span>
      <h2 class="h2" id="off-h">Four offices. Three coasts.</h2>
      <p class="lede">Walk in, call, or start on your phone. The Newport News office runs the national travel desk.</p>
    </div>
    ${officeList(root)}
  </div>
</section>`,
  });
}

function officeList(root) {
  return `<ul class="offices">${OFFICES.map((o) => `<li class="office">
  <span class="rivet rivet--bl"></span><span class="rivet rivet--br"></span>
  <header><span>${esc(o.role)}</span><span>${o.state}</span></header>
  <h3><a href="${root}locations/${o.key}/" style="text-decoration:none">${esc(o.name)}</a></h3>
  <p>${esc(o.street)}<br>${esc(o.city)}, ${o.state} ${o.zip}</p>
  <p><a href="tel:+1${o.phone.replace(/-/g, "")}">${o.phone}</a></p>
</li>`).join("")}</ul>`;
}

export function jobsPage({ jobs, counts }) {
  return layout({
    path: "jobs/",
    title: `Search ${n(counts.jobs)} Shipyard and Trades Jobs | CTR Group`,
    description: "Every open CTR Group job in one search: welders, shipfitters, pipefitters, electricians, painters, riggers and more, with pay, shift and per diem up front.",
    current: "jobs",
    tab: "jobs",
    counts,
    scripts: ["search.js"],
    jsonld: [crumbsLd([["Home", ""], ["Jobs", "jobs/"]])],
    body: searchZone({ root: "../", jobs, counts, heading: "All open jobs." }),
  });
}

function jobLd(job) {
  const place = PLACE[job.place];
  const trade = TRADE[job.trade];
  const description = `<p>${esc(job.summary)}</p><h3>What you'll do</h3><ul>${job.duties.map((d) => `<li>${esc(d)}</li>`).join("")}</ul><h3>What you need</h3><ul>${job.reqs.map((d) => `<li>${esc(d)}</li>`).join("")}</ul><h3>What you get</h3><ul>${job.perks.map((d) => `<li>${esc(d)}</li>`).join("")}</ul>`;
  const SOC = { welder: "51-4121", burner: "51-4121", shipfitter: "51-2041", pipefitter: "47-2152", "inside-machinist": "51-4041", "outside-machinist": "49-9041", electrician: "47-2111", "electronics-tech": "49-2093", painter: "51-9122", shipwright: "47-2031", joiner: "47-2031", scaffold: "47-2061", rigger: "49-9096", "crane-operator": "53-7021", boilermaker: "47-2011", "sheet-metal": "47-2211", insulator: "47-2132", inspector: "51-9061", laborer: "53-7062", maintenance: "49-9071", planner: "43-5061", warehouse: "53-7051", engineer: "17-2121" };
  const months = { helper: 0, second: 12, first: 36, lead: 60 }[job.level];
  return {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title,
    description,
    identifier: { "@type": "PropertyValue", name: COMPANY.name, value: job.id },
    datePosted: job.posted,
    validThrough: `${job.validThrough}T23:59:59-05:00`,
    employmentType: TYPE[job.type].schema,
    hiringOrganization: { "@type": "Organization", "@id": ORG_ID(), name: COMPANY.name, sameAs: COMPANY.site, logo: abs("assets/icons/icon-512.png") },
    jobLocation: { "@type": "Place", address: { "@type": "PostalAddress", addressLocality: place.city, addressRegion: place.state, addressCountry: "US" } },
    baseSalary: job.salary
      ? { "@type": "MonetaryAmount", currency: "USD", value: { "@type": "QuantitativeValue", minValue: job.salary[0], maxValue: job.salary[1], unitText: "YEAR" } }
      : { "@type": "MonetaryAmount", currency: "USD", value: { "@type": "QuantitativeValue", minValue: job.pay[0], maxValue: job.pay[1], unitText: "HOUR" } },
    ...(SOC[job.trade] ? { occupationalCategory: SOC[job.trade] } : {}),
    industry: "Shipbuilding and ship repair",
    workHours: `${SHIFT[job.shift].name}, ${job.schedule.label}`,
    ...(months ? { experienceRequirements: { "@type": "OccupationalExperienceRequirements", monthsOfExperience: months } } : { experienceRequirements: "no requirements" }),
    ...(job.certs.length ? { qualifications: certList(job).join(", ") } : {}),
    jobBenefits: job.perks.join(". "),
    totalJobOpenings: job.openings,
    directApply: true,
    url: abs(`jobs/${job.slug}/`),
  };
}

export function jobPage({ job, similar, counts, tradeCities }) {
  const path = `jobs/${job.slug}/`;
  const root = rootFor(path);
  const place = PLACE[job.place];
  const trade = TRADE[job.trade];
  const hasCity = tradeCities.has(`${job.trade}/${job.place}`);
  const tradeCity = hasCity ? `trades/${job.trade}/${job.place}/` : `locations/${job.place}/`;
  const crumbItems = [["Home", ""], [trade.plural, `trades/${job.trade}/`], [placeName(place), tradeCity], [job.id, path]];
  const fullTitle = `${job.title} in ${placeName(place)} | ${payLabel(job)}`;
  const office = OFFICE[job.office];
  const initials = job.recruiter.split(" ").map((s) => s[0]).join("");
  return layout({
    path,
    title: fullTitle.length > 58 ? fullTitle : `${fullTitle} | CTR Group`,
    description: `${job.title} job in ${placeName(place)}: ${payLabel(job)}${job.perDiem ? ` plus $${job.perDiem}/day per diem` : ""}, ${SHIFT[job.shift].name.toLowerCase()}, ${TYPE[job.type].name.toLowerCase()}. ${job.yard}. Apply in 60 seconds with CTR Group.`.slice(0, 300),
    current: "jobs",
    counts,
    bodyClass: "has-dock",
    ogType: "article",
    jsonld: [jobLd(job), crumbsLd(crumbItems)],
    body: `<div class="page-head">
  <div class="wrap">
    ${crumbs(root, crumbItems)}
    <div class="page-head__row">${glyph(job.trade, 48)}<h1>${esc(job.title)}</h1></div>
    <div class="status-line label"><span><i class="dot${job.urgent ? " dot--live" : ""}"></i>${job.urgent ? "Hiring fast" : "Open"}</span><span>${esc(placeName(place))}</span><span>Req. ${job.id}</span><span>Posted ${esc(postedLabel(job.posted))}</span><span>${job.openings} opening${job.openings === 1 ? "" : "s"}</span></div>
  </div>
</div>
<div class="wrap posting">
  <article class="prose">
    <p>${esc(job.summary)}</p>
    <h2><span>01</span>What you'll do</h2>
    <ul class="ticks">${job.duties.map((d) => `<li>${esc(d)}</li>`).join("")}</ul>
    <h2><span>02</span>What you need</h2>
    <ul class="ticks">${job.reqs.map((d) => `<li>${esc(d)}</li>`).join("")}</ul>
    <h2><span>03</span>What you get</h2>
    <ul class="ticks ticks--check">${job.perks.map((d) => `<li>${esc(d)}</li>`).join("")}</ul>
    <h2><span>04</span>Your recruiter</h2>
    <div class="recruiter"><span class="avatar avatar--lg">${initials}</span><p><strong>${esc(job.recruiter)}</strong><br>CTR ${esc(office.name)} · <a href="tel:+1${office.phone.replace(/-/g, "")}">${office.phone}</a><br><span class="small">Usually replies within a few hours on weekdays.</span></p></div>
    <h2><span>05</span>More like this</h2>
    <ul class="mini-list">${similar.map((s) => `<li><a href="${root}jobs/${s.slug}/"><span>${esc(s.title)} <span class="small">· ${esc(placeName(PLACE[s.place]))}</span></span><span>${esc(payLabel(s))}</span></a></li>`).join("")}</ul>
    <p style="margin-top:16px"><a href="${root}${hasCity ? tradeCity : `?q=${encodeURIComponent(`${trade.name.replace(/ \/.*$/, "").toLowerCase()} near ${placeName(place)}`)}`}">All ${esc(trade.name.toLowerCase())} jobs near ${esc(placeName(place))} →</a></p>
  </article>
  <aside>${plate(job, { root, heading: "h2", link: false })}</aside>
</div>
<div class="apply-dock"><div><strong>${esc(payLabel(job))}</strong><small>${job.perDiem ? `+$${job.perDiem}/day per diem · ` : ""}${esc(SHIFT[job.shift].short)}</small></div><a class="btn btn--hazard" href="${root}sign-in/?apply=${job.id}">Apply</a></div>`,
  });
}

export function tradesIndex({ jobs, counts }) {
  const root = "../";
  const families = [...new Set(TRADES.map((t) => t.family))];
  return layout({
    path: "trades/",
    title: `Shipyard Trades Jobs: ${TRADES.length} Crafts Hiring Now | CTR Group`,
    description: `Browse open jobs for ${TRADES.length} shipyard and industrial trades: welders, shipfitters, pipefitters, electricians, machinists, painters, riggers, inspectors and more.`,
    current: "trades",
    counts,
    jsonld: [crumbsLd([["Home", ""], ["Trades", "trades/"]])],
    body: `<div class="page-head"><div class="wrap">${crumbs(root, [["Home", ""], ["Trades", "trades/"]])}<h1>Every trade that builds a ship.</h1><p class="lede">${n(counts.jobs)} open jobs across ${TRADES.length} crafts. Pick yours.</p></div></div>
<div class="wrap" style="padding:40px var(--gutter) 72px">
${families.map((fam) => `<h2 class="label" style="margin:28px 0 10px">${esc(fam)}</h2><ul class="trades">${TRADES.filter((t) => t.family === fam).map((t) => `<li><a href="${root}trades/${t.key}/"><span class="top">${glyph(t.key, 30)}<b>${n(jobs.filter((j) => j.trade === t.key).length)}</b></span><strong>${esc(t.plural)}</strong><small>${esc(t.about.split(",")[0])}</small></a></li>`).join("")}</ul>`).join("")}
</div>`,
  });
}

function stats(list) {
  const hourly = list.filter((j) => j.pay);
  const lo = hourly.length ? Math.min(...hourly.map((j) => j.pay[0])) : null;
  const hi = hourly.length ? Math.max(...hourly.map((j) => j.pay[1])) : null;
  const pd = list.filter((j) => j.perDiem).length;
  return { lo, hi, pd };
}

export function tradePage({ trade, jobs, counts }) {
  const path = `trades/${trade.key}/`;
  const root = rootFor(path);
  const list = jobs.filter((j) => j.trade === trade.key);
  const s = stats(list);
  const byPlace = Object.entries(list.reduce((m, j) => ((m[j.place] = (m[j.place] ?? 0) + 1), m), {})).sort((a, b) => b[1] - a[1]);
  const items = [["Home", ""], ["Trades", "trades/"], [trade.plural, path]];
  const short = trade.name.replace(/ \/.*$/, "").toLowerCase();
  return layout({
    path,
    title: `${trade.name} Jobs at Shipyards: ${n(list.length)} Open | CTR Group`,
    description: `${n(list.length)} open ${short} jobs${s.lo ? ` paying $${s.lo}–${s.hi}/hr` : ""} in ${byPlace.slice(0, 3).map(([k]) => PLACE[k].city).join(", ")} and more. ${trade.about}`,
    current: "trades",
    counts,
    jsonld: [crumbsLd(items)],
    body: `<div class="page-head"><div class="wrap">${crumbs(root, items)}
  <div class="page-head__row">${glyph(trade.key, 56)}<h1>${esc(trade.name)} jobs.</h1></div>
  <p class="lede">${esc(trade.about)}</p>
  <div class="status-line label" style="margin-top:16px"><span>${n(list.length)} open</span>${s.lo ? `<span>$${s.lo}–${s.hi}/hr</span>` : ""}<span>${n(s.pd)} with per diem</span><span>${byPlace.length} towns</span></div>
</div></div>
<div class="wrap" style="padding:28px var(--gutter) 0">
  <h2 class="label" style="margin-bottom:10px">By town</h2>
  <ul class="chips-row">${byPlace.filter(([, c]) => c >= 3).map(([k, c]) => `<li><a href="${root}trades/${trade.key}/${k}/">${esc(placeName(PLACE[k]))}<b>${c}</b></a></li>`).join("")}</ul>
  <p style="margin-top:20px"><a class="btn btn--hazard" href="${root}?q=${encodeURIComponent(short)}">Search ${esc(short)} jobs by shift, pay and place</a></p>
</div>
<div class="wrap results"><ol class="jobs">${list.slice(0, 60).map((job, i) => jobRow(job, { root, index: i })).join("")}</ol>
${list.length > 60 ? `<div class="more"><a class="btn btn--line" href="${root}?q=${encodeURIComponent(short)}">See all ${n(list.length)} in search</a></div>` : ""}</div>`,
  });
}

export function tradeCityPage({ trade, place, list, jobs, counts }) {
  const path = `trades/${trade.key}/${place.key}/`;
  const root = rootFor(path);
  const s = stats(list);
  const items = [["Home", ""], ["Trades", "trades/"], [trade.plural, `trades/${trade.key}/`], [placeName(place), path]];
  const short = trade.name.replace(/ \/.*$/, "").toLowerCase();
  const nearby = PLACES.filter((p) => p.key !== place.key && miles(p, place) < 120)
    .map((p) => [p, jobs.filter((j) => j.trade === trade.key && j.place === p.key).length])
    .filter(([, c]) => c >= 3);
  return layout({
    path,
    title: `${trade.name} Jobs in ${placeName(place)}${s.lo ? ` | $${s.lo}–${s.hi}/hr` : ""} | CTR Group`,
    description: `${n(list.length)} ${short} jobs in ${placeName(place)} right now${s.lo ? `, $${s.lo}–${s.hi}/hr` : ""}. Shipyard and industrial work on day, swing and night shifts. Apply in 60 seconds.`,
    current: "trades",
    counts,
    jsonld: [crumbsLd(items)],
    body: `<div class="page-head"><div class="wrap">${crumbs(root, items)}
  <div class="page-head__row">${glyph(trade.key, 56)}<h1>${esc(trade.name)} jobs in ${esc(place.city)}, ${place.state}.</h1></div>
  <div class="status-line label"><span>${n(list.length)} open</span>${s.lo ? `<span>$${s.lo}–${s.hi}/hr</span>` : ""}<span>${esc(REGION[place.region].name)}</span></div>
</div></div>
<div class="wrap results"><ol class="jobs">${list.map((job, i) => jobRow(job, { root, index: i })).join("")}</ol>
  <div style="padding-top:32px">
    ${nearby.length ? `<h2 class="label" style="margin-bottom:10px">Nearby</h2><ul class="chips-row">${nearby.map(([p, c]) => `<li><a href="${root}trades/${trade.key}/${p.key}/">${esc(placeName(p))}<b>${c}</b></a></li>`).join("")}</ul>` : ""}
    <p style="margin-top:20px"><a class="btn btn--hazard" href="${root}?q=${encodeURIComponent(`${short} near ${placeName(place)}`)}">Narrow it down in search</a></p>
  </div>
</div>`,
  });
}

export function locationsIndex({ jobs, counts }) {
  const root = "../";
  return layout({
    path: "locations/",
    title: `Shipyard Jobs by Location: ${counts.places} Towns | CTR Group`,
    description: "CTR Group staffs shipyards and industrial plants in Hampton Roads, the Gulf Coast, San Diego and across the country. Find work near you.",
    current: "locations",
    counts,
    jsonld: [crumbsLd([["Home", ""], ["Locations", "locations/"]])],
    body: `<div class="page-head"><div class="wrap">${crumbs(root, [["Home", ""], ["Locations", "locations/"]])}<h1>Work on three coasts.</h1><p class="lede">${counts.places} towns with open jobs, and four offices to call.</p></div></div>
<div class="wrap" style="padding:40px var(--gutter) 72px">
  ${officeList(root)}
  ${REGIONS.map((r) => {
    const places = PLACES.filter((p) => p.region === r.key).map((p) => [p, jobs.filter((j) => j.place === p.key).length]).filter(([, c]) => c);
    return `<h2 class="h3" style="margin:44px 0 12px">${esc(r.name)} <span class="label muted">${n(places.reduce((a, [, c]) => a + c, 0))} jobs</span></h2><ul class="chips-row">${places.map(([p, c]) => `<li><a href="${root}locations/${p.key}/">${esc(placeName(p))}<b>${c}</b></a></li>`).join("")}</ul>`;
  }).join("")}
</div>`,
  });
}

export function locationPage({ place, jobs, counts }) {
  const path = `locations/${place.key}/`;
  const root = rootFor(path);
  const office = OFFICE[place.key];
  const near = jobs.filter((j) => miles(PLACE[j.place], place) <= 30);
  const byTrade = Object.entries(near.reduce((m, j) => ((m[j.trade] = (m[j.trade] ?? 0) + 1), m), {})).sort((a, b) => b[1] - a[1]);
  const items = [["Home", ""], ["Locations", "locations/"], [placeName(place), path]];
  const jsonld = [crumbsLd(items)];
  if (office) {
    jsonld.push({
      "@context": "https://schema.org", "@type": "EmploymentAgency", "@id": abs(`${path}#office`), name: `${COMPANY.name} ${office.name}`, url: abs(path),
      telephone: `+1-${office.phone}`, parentOrganization: { "@id": ORG_ID() }, image: abs("assets/icons/og.png"),
      address: { "@type": "PostalAddress", streetAddress: office.street, addressLocality: office.city, addressRegion: office.state, postalCode: office.zip, addressCountry: "US" },
    });
  }
  return layout({
    path,
    title: `Shipyard and Trades Jobs in ${placeName(place)}${office ? " | CTR Office" : ""} | CTR Group`,
    description: `${n(near.length)} shipyard and industrial jobs within 30 miles of ${placeName(place)}: ${byTrade.slice(0, 4).map(([k]) => TRADE[k].plural.toLowerCase()).join(", ")} and more.${office ? ` Visit CTR at ${office.street}.` : ""}`,
    current: "locations",
    counts,
    jsonld,
    body: `<div class="page-head"><div class="wrap">${crumbs(root, items)}<h1>Jobs in ${esc(place.city)}, ${place.state}.</h1>
  <div class="status-line label"><span>${n(near.length)} within 30 mi</span><span>${esc(REGION[place.region].name)}</span>${office ? `<span>CTR office</span>` : ""}</div></div></div>
<div class="wrap" style="padding:28px var(--gutter) 0">
  ${office ? `<div class="split" style="margin-bottom:32px"><dl class="spec"><div><dt>Office</dt><dd>CTR Group ${esc(office.name)} · ${esc(office.role)}</dd></div><div><dt>Address</dt><dd>${esc(office.street)}, ${esc(office.city)}, ${office.state} ${office.zip}</dd></div><div><dt>Phone</dt><dd><a href="tel:+1${office.phone.replace(/-/g, "")}">${office.phone}</a></dd></div></dl>
  <p class="lede">Walk in with your certs and ID and we can often test and place you the same week. Or start on your phone: search, apply and do your screening by video.</p></div>` : ""}
  <h2 class="label" style="margin-bottom:10px">By trade</h2>
  <ul class="chips-row">${byTrade.map(([k, c]) => `<li><a href="${root}${c >= 3 && jobs.filter((j) => j.trade === k && j.place === place.key).length >= 3 ? `trades/${k}/${place.key}/` : `?q=${encodeURIComponent(`${TRADE[k].name.replace(/ \/.*$/, "").toLowerCase()} near ${placeName(place)}`)}`}">${esc(TRADE[k].plural)}<b>${c}</b></a></li>`).join("")}</ul>
</div>
<div class="wrap results"><ol class="jobs">${near.slice(0, 40).map((job, i) => jobRow(job, { root, index: i, distance: miles(PLACE[job.place], place) })).join("")}</ol>
<div class="more"><a class="btn btn--hazard" href="${root}?q=${encodeURIComponent(`near ${placeName(place)}`)}">Search all ${n(near.length)} near ${esc(place.city)}</a></div></div>`,
  });
}

export function simplePage({ path, title, description, current = "", tab = "", counts, body, scripts = [], jsonld = [], bodyClass = "", chrome = true }) {
  return layout({ path, title, description, current, tab, counts, body, scripts, jsonld, bodyClass, chrome });
}

export { rootFor, crumbs, crumbsLd, abs, n, officeList };
