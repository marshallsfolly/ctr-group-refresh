// The rest of the pages: accounts, saved jobs, profiles, employers, about, audit, recruiter tools.

import { TRADES, TRADE, LEVEL, CERT, PLACE, OFFICES, COMPANY, REGIONS, esc, placeName, payLabel, AS_OF } from "../src/assets/js/catalog.js";
import { glyph, plimsoll } from "../src/assets/js/glyphs.js";
import { layout, rootFor, crumbs, crumbsLd, n, SITE } from "./site.mjs";

const keyIcon = `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="8" cy="12" r="4"/><path d="M12 12h9M18 12v3M21 12v2"/></svg>`;
const mailIcon = `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M3 5h18v14H3z"/><path d="m3 6 9 7 9-7"/></svg>`;

export function signInPage({ counts }) {
  const path = "sign-in/";
  const root = rootFor(path);
  return layout({
    path, counts, tab: "account",
    title: "Sign In or Sign Up | CTR Group Jobs",
    description: "One CTR Group account for searching, applying, video interviews and onboarding. Continue with LinkedIn, a passkey or your email. No passwords.",
    scripts: ["auth.js"],
    body: `<div class="wrap auth">
  <div>
    ${crumbs(root, [["Home", ""], ["Sign in", path]])}
    <h1 class="display" style="font-size:clamp(40px,8vw,96px);margin:18px 0 20px">Sign in or sign up. Same button.</h1>
    <p class="lede">One account for searching, applying, video interviews and onboarding. No passwords to remember.</p>
    <div class="panel" data-apply-banner hidden style="margin-top:24px"><div class="panel__head"><span>Applying to</span><span data-apply-id></span></div><p style="margin:0" data-apply-title></p></div>
    <dl class="spec" style="margin-top:32px">
      <div><dt>LinkedIn</dt><dd>Brings your name, email and photo, so your profile starts filled in. Add your work history by uploading LinkedIn's "Save to PDF" export.</dd></div>
      <div><dt>Passkey</dt><dd>Your phone's Face ID, fingerprint or PIN. Nothing to type and nothing a phisher can steal. Works across your devices.</dd></div>
      <div><dt>Email</dt><dd>We send a one-time link. Tap it on this phone and you're in.</dd></div>
    </dl>
  </div>
  <div>
    <div class="panel" data-auth>
      <div class="panel__head"><span>Account</span><span>Encrypted</span></div>
      <div data-step="choose">
        <div class="auth__opts">
          <button class="auth-btn auth-btn--li" type="button" data-method="linkedin"><span class="mark">in</span><span>Continue with LinkedIn<br><small>Name, email, photo</small></span><span aria-hidden="true">→</span></button>
          <button class="auth-btn" type="button" data-method="passkey"><span class="mark">${keyIcon}</span><span>Sign in with a passkey<br><small>Face ID, fingerprint or PIN</small></span><span aria-hidden="true">→</span></button>
          <button class="auth-btn" type="button" data-method="new-passkey"><span class="mark">+</span><span>New here? Create a passkey<br><small>Takes about ten seconds</small></span><span aria-hidden="true">→</span></button>
        </div>
        <div class="or">or use email</div>
        <form data-email-form novalidate>
          <div class="field"><label for="email">Email</label><input class="input" id="email" type="email" autocomplete="email webauthn" inputmode="email" placeholder="you@example.com" required></div>
          <button class="btn btn--block" type="submit">${mailIcon}<span>Email me a sign-in link</span></button>
        </form>
      </div>
      <div data-step="linkedin" hidden>
        <p class="label">LinkedIn would ask you to share</p>
        <ul class="ticks ticks--check" style="margin:8px 0 18px"><li>Your name and profile photo</li><li>Your primary email address</li></ul>
        <p class="small">LinkedIn's sign-in doesn't share work history. Upload your LinkedIn PDF on your profile and CTR fills in your yards, years and trade.</p>
        <button class="btn btn--block auth-btn--li" type="button" data-continue="linkedin" style="background:#0a66c2;border-color:#0a66c2;color:#fff">Allow and continue</button>
        <button class="btn btn--line btn--block" type="button" data-back style="margin-top:8px">Back</button>
      </div>
      <div data-step="new-passkey" hidden>
        <form data-passkey-form>
          <div class="grid-2">
            <div class="field"><label for="first">First name</label><input class="input" id="first" autocomplete="given-name" required></div>
            <div class="field"><label for="last">Last name</label><input class="input" id="last" autocomplete="family-name" required></div>
          </div>
          <div class="field"><label for="pk-email">Email</label><input class="input" id="pk-email" type="email" autocomplete="email" inputmode="email" required></div>
          <button class="btn btn--hazard btn--block" type="submit">${keyIcon}<span>Create my passkey</span></button>
        </form>
        <button class="btn btn--line btn--block" type="button" data-back style="margin-top:8px">Back</button>
      </div>
      <div data-step="sent" hidden>
        <p class="h3" style="margin-bottom:8px">Check your email.</p>
        <p class="small">We sent a sign-in link to <strong data-sent-to></strong>. It works once and expires in 15 minutes.</p>
        <button class="btn btn--hazard btn--block" type="button" data-continue="email">Open the link (demo)</button>
        <button class="btn btn--line btn--block" type="button" data-back style="margin-top:8px">Use a different method</button>
      </div>
      <div data-step="confirm" hidden>
        <p class="label">Signed in as</p>
        <p class="h3" data-who style="margin:6px 0 16px"></p>
        <div data-confirm-apply hidden>
          <p class="small">Your trade card, certs and work history go with this application. Your recruiter usually replies within a few hours.</p>
          <button class="btn btn--hazard btn--block" type="button" data-send-app>Send my application</button>
        </div>
        <a class="btn btn--line btn--block" href="${root}account/" style="margin-top:8px">Go to my profile</a>
        <button class="btn btn--line btn--block" type="button" data-signout style="margin-top:8px">Sign out</button>
      </div>
      <p class="fine" data-msg style="margin-top:14px">Concept demo: nothing leaves this browser. Passkeys are real browser passkeys; there's no server checking them yet.</p>
    </div>
  </div>
</div>`,
  });
}

export function accountPage({ counts }) {
  const path = "account/";
  const root = rootFor(path);
  return layout({
    path, counts, tab: "account",
    title: "Your Profile | CTR Group Jobs",
    description: "Your CTR Group profile: trade card, certifications, applications, interviews and onboarding documents.",
    scripts: ["account.js"],
    body: `<div class="wrap" data-account>
  <div class="empty">
    <p class="label">Profile</p>
    <h1 class="h2" style="margin:12px 0 16px">Sign in to see your profile.</h1>
    <p class="lede">Applications, interviews, paperwork and your shareable trade card live here.</p>
    <p style="margin-top:20px"><a class="btn btn--hazard" href="${root}sign-in/">Sign in or sign up</a></p>
  </div>
</div>`,
  });
}

export function savedPage({ counts }) {
  const path = "saved/";
  const root = rootFor(path);
  return layout({
    path, counts, tab: "saved",
    title: "Saved Jobs | CTR Group Jobs",
    description: "Jobs you saved on this device. They stay available offline.",
    scripts: ["saved.js"],
    body: `<div class="page-head"><div class="wrap">${crumbs(root, [["Home", ""], ["Saved", path]])}<h1>Saved jobs.</h1><div class="status-line label"><span data-saved-count>0 saved</span><span>Kept on this device</span><span>Work offline</span></div></div></div>
<div class="wrap results"><ol class="jobs" data-saved></ol>
<div class="empty" data-saved-empty><p class="h3">Nothing saved yet.</p><p class="muted">Tap the bookmark on any job to keep it here. Saved jobs open even with no signal.</p><p><a class="btn btn--hazard" href="${root}">Search jobs</a></p></div></div>`,
  });
}

export function profilePage({ cand, job, counts }) {
  const path = `p/${cand.slug}/`;
  const root = rootFor(path);
  const trade = TRADE[cand.trade];
  const level = LEVEL[cand.level];
  const home = PLACE[cand.home];
  const name = `${cand.first} ${cand.last}`;
  const history = [
    ["2022 – now", "Pipe Welder, 1st Class", "Naval shipbuilder, Newport News, VA", "Carrier overhaul and submarine modules. Copper-nickel and stainless pipe, GTAW root and hot pass."],
    ["2019 – 2022", "Pipe Welder, 2nd Class", "Naval ship repair contractor, Norfolk, VA", "Surface ship availabilities. Tech Pub 248 qualified in 2020."],
    ["2016 – 2019", "Structural Welder", "Commercial ship repair yard, Portsmouth, VA", "FCAW and SMAW on barges, tugs and dry dock work."],
    ["2015 – 2016", "Fire Watch / Welder Helper", "Steel fabrication shop, Chesapeake, VA", "Started in the trade through CTR."],
  ];
  return layout({
    path, counts,
    title: `${name}, ${level.name} ${trade.name} | CTR Trade Card`,
    description: `${name}: ${level.name} pipe welder, ${cand.years} years, Tech Pub 248 and 6G qualified. Verified by CTR Group.`,
    head: `<meta name="robots" content="noindex, nofollow">`,
    body: `<div class="page-head"><div class="wrap">
  <div class="status-line label"><span><i class="dot"></i>Trade card</span><span>Verified by CTR Group</span><span>Shared by link</span></div>
  <div class="page-head__row" style="align-items:center;margin-top:16px"><span class="avatar avatar--lg">${cand.first[0]}${cand.last[0]}</span><h1 style="margin:0">${esc(name)}</h1></div>
  <p class="lede" style="margin-top:14px">${level.name} pipe welder from ${esc(placeName(home))}. ${cand.years} years on naval and commercial work. Available ${new Date(cand.available + "T12:00:00Z").toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" })}, ${cand.travel ? "open to travel" : "local work preferred"}.</p>
</div></div>
<div class="wrap resume">
  <div>
    <div class="qual"><div><b>${cand.years}</b><span>Years in trade</span></div><div><b>6G</b><span>Pipe position</span></div><div><b>${cand.certs.filter((c) => c.verified).length}</b><span>Verified certs</span></div></div>
    <div class="prose" style="margin-top:8px">
      <h2><span>01</span>Processes</h2>
      <ul class="chips-row"><li><a>GTAW (TIG)</a></li><li><a>SMAW (Stick)</a></li><li><a>FCAW</a></li><li><a>Copper-nickel</a></li><li><a>Stainless</a></li><li><a>Carbon steel</a></li><li><a>Consumable insert</a></li></ul>
      <h2><span>02</span>Work history</h2>
      <ul class="ticks">${history.map(([when, role, where, what]) => `<li><span class="label muted">${when}</span><br><strong>${role}</strong> · ${where}<br><span class="small">${what}</span></li>`).join("")}</ul>
      <h2><span>03</span>References</h2>
      <p class="small">Available from CTR on request: two foremen and one general foreman.</p>
    </div>
  </div>
  <aside>
    <div class="panel">
      <div class="panel__head"><span>Credentials</span><span>Checked by CTR</span></div>
      <ul class="certs">${cand.certs.map((c) => `<li><span><strong>${esc(CERT[c.key].name)}</strong><br><small>${c.expires ? `Expires ${c.expires}` : "No expiry"}</small></span>${c.verified ? `<span class="badge-verified">✓ Verified</span>` : `<span class="badge-warn">Self-reported</span>`}</li>`).join("")}</ul>
    </div>
    <div class="panel">
      <div class="panel__head"><span>Hire ${esc(cand.first)}</span><span>CTR Group</span></div>
      <p class="small">Want ${esc(cand.first)} on your crew? CTR handles payroll, per diem, safety orientation and the 90-day guarantee.</p>
      <a class="btn btn--hazard btn--block" href="${root}employers/?candidate=${cand.id}">Request this welder</a>
    </div>
  </aside>
</div>`,
  });
}

export function employersPage({ counts }) {
  const path = "employers/";
  const root = rootFor(path);
  return layout({
    path, counts, current: "employers",
    title: "Hire Shipyard Welders, Fitters and Trades | CTR Group Staffing",
    description: "Contract, temp-to-hire and direct-hire staffing for shipyards and industrial plants since 1987. Screened, tested crews with a 90-day replacement guarantee.",
    scripts: ["employers.js"],
    jsonld: [crumbsLd([["Home", ""], ["Employers", path]])],
    body: `<div class="page-head"><div class="wrap">${crumbs(root, [["Home", ""], ["Employers", path]])}<h1>Crews that pass the weld test the first time.</h1><p class="lede">Tell us the trade, headcount and start date. A recruiter calls you back the same day with candidates who are already screened.</p></div></div>
<div class="wrap split" style="padding:40px var(--gutter) 72px">
  <div>
    <dl class="spec">
      <div><dt>Contract staffing</dt><dd>Crews for an availability, a turnaround or a new-build surge. On CTR's payroll, insurance and per diem.</dd></div>
      <div><dt>Temp-to-hire</dt><dd>Try the work before you commit. Convert after 60 to 120 days.</dd></div>
      <div><dt>Direct hire</dt><dd>Leads, inspectors, planners and engineers. CTR runs the search; you make the hire.</dd></div>
      <div><dt>Executive search</dt><dd>Superintendents, program managers and yard leadership.</dd></div>
      <div><dt>Trades training</dt><dd>CTR's trades training program builds helpers into 2nd class mechanics.</dd></div>
      <div><dt>Guarantee</dt><dd>Any concern in the first 90 days, we replace the employee at no extra cost.</dd></div>
    </dl>
    <p style="margin-top:28px"><a class="btn btn--line" href="${root}recruit/">See how recruiters screen candidates →</a></p>
  </div>
  <form class="panel" data-request>
    <div class="panel__head"><span>Request talent</span><span>Reply same day</span></div>
    <div class="grid-2">
      <div class="field"><label for="co">Company</label><input class="input" id="co" autocomplete="organization" required></div>
      <div class="field"><label for="nm">Your name</label><input class="input" id="nm" autocomplete="name" required></div>
      <div class="field"><label for="em">Email</label><input class="input" id="em" type="email" autocomplete="email" required></div>
      <div class="field"><label for="ph">Phone</label><input class="input" id="ph" type="tel" autocomplete="tel"></div>
      <div class="field"><label for="tr">Trade</label><select class="select" id="tr">${TRADES.map((t) => `<option>${esc(t.name)}</option>`).join("")}</select></div>
      <div class="field"><label for="hc">Headcount</label><input class="input" id="hc" type="number" min="1" value="6" inputmode="numeric"></div>
      <div class="field"><label for="ht">Hire type</label><select class="select" id="ht"><option>Contract</option><option>Temp-to-hire</option><option>Direct hire</option><option>Temporary</option></select></div>
      <div class="field"><label for="sh">Shift</label><select class="select" id="sh"><option>Day</option><option>Swing</option><option>Night</option><option>Weekend</option></select></div>
      <div class="field"><label for="loc">Yard location</label><input class="input" id="loc" placeholder="City, state"></div>
      <div class="field"><label for="st">Start date</label><input class="input" id="st" type="date" value="${AS_OF}"></div>
    </div>
    <div class="field"><label for="du">Scope and requirements</label><textarea class="textarea" id="du" placeholder="Tech Pub 248 pipe welders, CuNi, 6×10s, TWIC required…"></textarea></div>
    <button class="btn btn--hazard btn--block" type="submit">Send request</button>
    <p class="fine" style="margin-top:12px">Concept demo: the request stays in this browser.</p>
  </form>
</div>`,
  });
}

export function aboutPage({ counts }) {
  const path = "about/";
  const root = rootFor(path);
  const affiliations = ["Virginia Ship Repair Association", "DVS V3 Program", "Better Business Bureau", "JASRA", "Aircraft Carrier Industrial Base Coalition", "NFIB", "ABC Virginia", "Submarine Industrial Base Council"];
  return layout({
    path, counts,
    title: "About CTR Group: Shipyard Staffing Since 1987",
    description: "CTR Group has recruited and staffed skilled trades for shipyards and industrial clients since 1987, from offices in Newport News, Portsmouth, Mobile and National City.",
    jsonld: [crumbsLd([["Home", ""], ["About", path]])],
    body: `<div class="page-head"><div class="wrap">${crumbs(root, [["Home", ""], ["About", path]])}<h1>Staffing shipyards since 1987.</h1><p class="lede">CTR Group recruits the highest-skilled tradespeople with the longest tenures for shipyard and industrial clients, and keeps safety first on every job.</p></div></div>
<div class="wrap" style="padding:40px var(--gutter) 72px">
  <div class="split">
    <dl class="spec">
      <div><dt>Founded</dt><dd>1987, Newport News, Virginia</dd></div>
      <div><dt>Legal name</dt><dd>${COMPANY.legal}</dd></div>
      <div><dt>Offices</dt><dd>${OFFICES.map((o) => `${o.name}, ${o.state}`).join(" · ")}</dd></div>
      <div><dt>Services</dt><dd>Contract, temporary, temp-to-hire and direct-hire staffing, executive search, trades training</dd></div>
      <div><dt>Industries</dt><dd>Marine and shipyard, government and defense, industrial, aerospace, energy, automotive, engineering and design, light industrial</dd></div>
      <div><dt>Main line</dt><dd><a href="tel:+17578735900">757-873-5900</a> · ${COMPANY.tollFree}</dd></div>
    </dl>
    <div>
      <h2 class="label" style="margin-bottom:12px">Affiliations</h2>
      <ul class="ticks">${affiliations.map((a) => `<li>${esc(a)}</li>`).join("")}</ul>
    </div>
  </div>
</div>`,
  });
}

export function auditPage({ counts, jobs, trades, tradeCities, places }) {
  const path = "audit/";
  const root = rootFor(path);
  const rows = [
    ["high", "Jobs are invisible to Google's job search", "No JobPosting structured data anywhere, and jobs live on a separate careers subdomain that showed zero postings when checked.", `Every job is its own page with JobPosting data: title, pay, location, shift, credentials, dates. ${n(jobs)} pages in this mockup.`],
    ["high", "Search is a separate site", "careers.ctrc.com runs on a different system with its own look; the main site sends people away to search.", "Search is the first thing on the home page, reads plain words, and updates as you type."],
    ["high", "No local pages for the four offices", "Offices are listed on one contact page. No location markup, so maps and local results get little to work with.", `A page per office with EmploymentAgency markup, plus ${places} town pages and ${tradeCities} trade-by-town pages.`],
    ["med", "Weak page headings", "Headings render as h3 and h4; most pages have no clear h1.", "One h1 per page that says exactly what the page is."],
    ["med", "Duplicate content on every page", "The same four testimonials and three news teasers repeat across home, about, contact, marine and welding pages.", "Each page carries its own content; shared blocks link out instead of repeating."],
    ["med", "Organization data is thin", "Organization schema has no phone, address, founding date or social profiles.", "Full EmploymentAgency record: legal name, 1987, HQ address, phone, email, social profiles, and all four offices."],
    ["med", "Name and age don't agree", "\"CTR Group\" and \"CTR Corporation\" are used interchangeably; the careers footer says \"Over 35 Years\" (1987 makes it 39).", "CTR Group as the brand everywhere, CTR Corporation as the legal name in the footer and schema. Years computed, never typed."],
    ["low", "Images", "Blog thumbnails have empty alt text; photos are served as PNG.", "Vector line drawings for trades (a few hundred bytes each). Photography, when added, goes in as AVIF/WebP with alt text."],
    ["low", "Navigation labels drift", "\"Blog\" vs \"Blogs\", \"Pipefitters\" vs \"Pipe Fitters\".", "One vocabulary file drives the nav, the search and the pages."],
    ["low", "Mobile", "Desktop-first WordPress theme; search and apply are separate hops.", "Built phone-first and installable as an app: offline saved jobs, bottom tab bar, apply in 60 seconds."],
  ];
  return layout({
    path, counts,
    title: "SEO Audit: ctrc.com Today and the Refresh | CTR Group",
    description: "What holds ctrc.com back in search today, and what the refresh changes: job structured data, local pages, headings, duplicate content and mobile.",
    body: `<div class="page-head"><div class="wrap">${crumbs(root, [["Home", ""], ["SEO audit", path]])}<h1>SEO audit.</h1><p class="lede">What ctrc.com does today, checked on Nov 19, 2026, and what this refresh does instead. Speed and Core Web Vitals weren't measured yet; that comes with a Lighthouse run on the live build.</p></div></div>
<div class="wrap" style="padding:40px var(--gutter) 72px">
  <div class="table-wrap"><table class="table audit-table">
    <thead><tr><th>Issue</th><th>Impact</th><th>Today</th><th>In the refresh</th></tr></thead>
    <tbody>${rows.map(([sev, issue, now, fix]) => `<tr><td>${esc(issue)}</td><td><span class="sev sev--${sev}">${{ high: "High", med: "Medium", low: "Low" }[sev]}</span></td><td>${esc(now)}</td><td>${esc(fix)}</td></tr>`).join("")}</tbody>
  </table></div>

  <h2 class="h2" style="margin:64px 0 20px">How a search result reads.</h2>
  <div class="compare">
    <div><p class="label" style="margin-bottom:12px">Today: welding page</p><div class="serp"><cite>https://www.ctrc.com › positions › welding</cite><h3>Welding Staffing Agency | Welding Jobs | CTR Group</h3><p>Welding jobs for MIG, TIG, pipe, and structural welders across Virginia and Southeastern U.S. …</p></div></div>
    <div><p class="label" style="margin-bottom:12px">Refresh: trade-by-town page</p><div class="serp"><cite>https://www.ctrc.com › trades › welder › norfolk-va</cite><h3>Welder Jobs in Norfolk, VA | $24–41/hr | CTR Group</h3><p>23 welder jobs in Norfolk, VA right now, $24–41/hr. Shipyard and industrial work on day, swing and night shifts. Apply in 60 seconds.</p></div></div>
  </div>

  <h2 class="h2" style="margin:64px 0 20px">What ships in this build.</h2>
  <dl class="spec">
    <div><dt>Job pages</dt><dd>${n(jobs)} static pages, each with JobPosting and BreadcrumbList data</dd></div>
    <div><dt>Trade pages</dt><dd>${trades} trade hubs and ${tradeCities} trade-by-town pages (only where 3 or more jobs exist, so none are thin)</dd></div>
    <div><dt>Location pages</dt><dd>${places} town pages; the four office pages carry EmploymentAgency data</dd></div>
    <div><dt>Site search</dt><dd>WebSite SearchAction pointing at the home page query bar (?q=)</dd></div>
    <div><dt>Sitemap</dt><dd><a href="${root}sitemap.xml">sitemap.xml</a> with every page and its last change date</dd></div>
    <div><dt>Mockup safety</dt><dd>This preview is marked noindex so sample jobs never reach Google. The production build flips it to index and points canonicals at www.ctrc.com.</dd></div>
  </dl>
</div>`,
  });
}

export function offlinePage({ counts }) {
  const path = "offline/";
  const root = rootFor(path);
  return layout({
    path, counts,
    title: "Offline | CTR Group Jobs",
    description: "You're offline.",
    body: `<div class="wrap empty" style="padding:72px var(--gutter)"><p class="label">No signal</p><h1 class="h2" style="margin:12px 0 16px">You're offline.</h1><p class="lede">Search and your saved jobs still work from what's on this phone. Applying waits until you're back online.</p><p style="display:flex;gap:10px;flex-wrap:wrap;margin-top:20px"><a class="btn btn--hazard" href="${root}">Search jobs</a><a class="btn btn--line" href="${root}saved/">Saved jobs</a></p></div>`,
  });
}

export function notFoundPage({ counts }) {
  // GitHub Pages serves 404.html from any depth, so this page links absolutely to the site root.
  const base = new URL(SITE.base).pathname;
  return layout({
    path: "",
    counts,
    title: "Page Not Found | CTR Group",
    description: "That page isn't here.",
    body: `<div class="wrap empty" style="padding:72px var(--gutter)"><p class="label">404 · Wrong pier</p><h1 class="h2" style="margin:12px 0 16px">That page isn't here.</h1><p class="lede">The job may have filled. Search for it instead.</p><p style="margin-top:20px"><a class="btn btn--hazard" href="./">Search jobs</a></p></div>`,
  }).replace('data-root="./"', `data-root="${base}"`).replaceAll('href="./', `href="${base}`).replaceAll('src="./', `src="${base}`);
}

export function recruitPage({ counts }) {
  const path = "recruit/";
  const root = rootFor(path);
  const rail = [["pipeline", "Pipeline"], ["candidates", "Candidates"], ["calendar", "Calendar"], ["documents", "Documents"], ["onboarding", "Onboarding"]];
  return layout({
    path, counts, current: "recruit", foot: false, tabs: false,
    title: "Recruiter Console | CTR Group",
    description: "Lead pipeline, screening, video interviews, document requests and onboarding for CTR recruiters.",
    head: `<meta name="robots" content="noindex, nofollow">`,
    scripts: ["recruit.js"],
    body: `<div class="console">
  <nav class="rail" aria-label="Console">${rail.map(([k, label]) => `<a href="#${k}" data-view="${k}">${label} <b data-n="${k}"></b></a>`).join("")}
    <div class="rail__foot"><span class="avatar">TG</span><p class="small" style="margin:8px 0 0"><strong>Tasha Greene</strong><br>Recruiter · Newport News</p></div>
  </nav>
  <div class="stage-area" data-console><p class="label" style="padding:24px 0">Loading the pipeline…</p></div>
</div>`,
  });
}

export function roomPage({ counts }) {
  const path = "recruit/room/";
  const root = rootFor(path);
  return layout({
    path, counts, chrome: false,
    title: "Video Interview | CTR Group",
    description: "Secure video interview room.",
    head: `<meta name="robots" content="noindex, nofollow"><meta name="theme-color" content="#111416">`,
    scripts: ["room.js"],
    body: `<div class="room" data-room>
  <div class="room__bar"><a href="${root}recruit/" data-leave>← Console</a><span class="e2ee">${plimsoll(14)} End-to-end encrypted</span><span data-clock>00:00</span></div>
  <div class="room__stage">
    <div class="tiles">
      <div class="tile" data-remote><span class="avatar" data-remote-initials>AW</span><span class="tile__wave" hidden data-wave></span><span class="tile__name" data-remote-name>Connecting…</span>
        <div class="tile tile--self" data-self><video data-video autoplay muted playsinline hidden></video><button class="btn btn--sm btn--orange" type="button" data-cam-on>Camera on</button><span class="tile__name">You</span></div>
      </div>
    </div>
    <div class="room__side">
      <div class="tabs" role="tablist"><button role="tab" aria-selected="true" data-tab="notes">Scorecard</button><button role="tab" aria-selected="false" data-tab="docs">Docs</button><button role="tab" aria-selected="false" data-tab="chat">Chat</button></div>
      <div class="room__pane" data-pane></div>
    </div>
  </div>
  <div class="room__ctrls">
    <button class="ctrl" type="button" aria-pressed="false" aria-label="Mute microphone" data-mic><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="9" y="3" width="6" height="12"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg></button>
    <button class="ctrl" type="button" aria-pressed="false" aria-label="Turn camera off" data-cam><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="6" width="13" height="12"/><path d="m16 10 5-3v10l-5-3"/></svg></button>
    <button class="ctrl" type="button" aria-label="Share screen" data-share><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="4" width="18" height="13"/><path d="M8 21h8M12 17v4M12 7v6M9 10l3-3 3 3"/></svg></button>
    <button class="ctrl ctrl--end" type="button" data-end>End</button>
  </div>
</div>`,
  });
}
