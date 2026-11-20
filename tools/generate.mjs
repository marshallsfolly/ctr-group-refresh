#!/usr/bin/env node
// Builds the static site into docs/ (what GitHub Pages serves).
//   node tools/generate.mjs                 mockup: noindex, canonicals on the GitHub Pages URL
//   node tools/generate.mjs --production    real build: indexable, canonicals on www.ctrc.com
// No dependencies; the output is plain files.

import { mkdirSync, rmSync, writeFileSync, cpSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";

import { TRADES, PLACES, PLACE, OFFICES, AS_OF, miles } from "../src/assets/js/catalog.js";
import { makeData } from "./data.mjs";
import { SITE, homePage, jobsPage, jobPage, tradesIndex, tradePage, tradeCityPage, locationsIndex, locationPage } from "./site.mjs";
import { signInPage, accountPage, savedPage, profilePage, employersPage, aboutPage, auditPage, offlinePage, notFoundPage, recruitPage, roomPage } from "./pages.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const ROOT = join(here, "..");
const OUT = join(ROOT, "docs");
const SRC = join(ROOT, "src");

const production = process.argv.includes("--production");
SITE.production = production;
if (production) SITE.base = "https://www.ctrc.com/";

const started = Date.now();
const { jobs, candidates, stages, sources } = makeData();

// A version that changes whenever assets or data change, for cache busting and the service worker.
function filesUnder(dir) {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? filesUnder(full) : [full];
  });
}
const hash = createHash("sha256");
for (const file of filesUnder(join(SRC, "assets")).sort()) hash.update(readFileSync(file));
for (const file of ["data.mjs", "site.mjs", "pages.mjs", "generate.mjs"]) hash.update(readFileSync(join(here, file)));
SITE.version = hash.digest("hex").slice(0, 10);

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
cpSync(join(SRC, "assets"), join(OUT, "assets"), { recursive: true });

const pages = [];
function write(path, html, { lastmod = AS_OF, sitemap = true, priority = 0.5 } = {}) {
  const file = join(OUT, path, path.endsWith(".html") ? "" : "index.html");
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, html);
  if (sitemap) pages.push({ path, lastmod, priority });
}

const placesWithJobs = PLACES.filter((p) => jobs.some((j) => j.place === p.key));
const counts = { jobs: jobs.length, places: placesWithJobs.length };

// ---------- data for the browser ----------

mkdirSync(join(OUT, "data"), { recursive: true });
const slim = jobs.map(({ duties, reqs, perks, validThrough, ...rest }) => rest);
writeFileSync(join(OUT, "data", "jobs.json"), JSON.stringify(slim));
const jobBits = Object.fromEntries(jobs.map((j) => [j.id, { title: j.title, slug: j.slug, place: j.place, pay: j.pay, salary: j.salary, perDiem: j.perDiem, yard: j.yard, recruiter: j.recruiter, shift: j.shift, type: j.type }]));
writeFileSync(join(OUT, "data", "candidates.json"), JSON.stringify({ asOf: AS_OF, candidates, stages, sources, jobs: jobBits }));

// ---------- pages ----------

write("", homePage({ jobs, counts }), { priority: 1.0 });
write("jobs/", jobsPage({ jobs, counts }), { priority: 0.9 });

const tradeCitySet = new Set();
for (const job of jobs) tradeCitySet.add(`${job.trade}/${job.place}`);
for (const key of [...tradeCitySet]) {
  const [t, p] = key.split("/");
  if (jobs.filter((j) => j.trade === t && j.place === p).length < 3) tradeCitySet.delete(key);
}
for (const job of jobs) {
  const at = PLACE[job.place];
  const similar = jobs
    .filter((o) => o.id !== job.id && o.trade === job.trade)
    .map((o) => [o, miles(PLACE[o.place], at)])
    .sort((a, b) => a[1] - b[1] || (a[0].posted < b[0].posted ? 1 : -1))
    .slice(0, 5)
    .map(([o]) => o);
  write(`jobs/${job.slug}/`, jobPage({ job, similar, counts, tradeCities: tradeCitySet }), { lastmod: job.posted, priority: 0.8 });
}

write("trades/", tradesIndex({ jobs, counts }), { priority: 0.8 });
let tradeCities = 0;
for (const trade of TRADES) {
  write(`trades/${trade.key}/`, tradePage({ trade, jobs, counts }), { priority: 0.8 });
  for (const place of PLACES) {
    const list = jobs.filter((j) => j.trade === trade.key && j.place === place.key);
    if (list.length < 3) continue; // no thin pages
    tradeCities++;
    write(`trades/${trade.key}/${place.key}/`, tradeCityPage({ trade, place, list, jobs, counts }), { lastmod: list[0].posted, priority: 0.7 });
  }
}

write("locations/", locationsIndex({ jobs, counts }), { priority: 0.7 });
const locationKeys = new Set([...placesWithJobs.map((p) => p.key), ...OFFICES.map((o) => o.key)]);
for (const key of locationKeys) write(`locations/${key}/`, locationPage({ place: PLACE[key], jobs, counts }), { priority: OFFICES.some((o) => o.key === key) ? 0.8 : 0.6 });

write("sign-in/", signInPage({ counts }), { sitemap: false });
write("account/", accountPage({ counts }), { sitemap: false });
write("saved/", savedPage({ counts }), { sitemap: false });
write("offline/", offlinePage({ counts }), { sitemap: false });
write("recruit/", recruitPage({ counts }), { sitemap: false });
write("recruit/room/", roomPage({ counts }), { sitemap: false });
const featured = candidates[0];
write(`p/${featured.slug}/`, profilePage({ cand: featured, job: jobs.find((j) => j.id === featured.job), counts }), { sitemap: false });
write("employers/", employersPage({ counts }), { priority: 0.8 });
write("about/", aboutPage({ counts }), { priority: 0.5 });
write("audit/", auditPage({ counts, jobs: jobs.length, trades: TRADES.length, tradeCities, places: locationKeys.size }), { sitemap: false });
writeFileSync(join(OUT, "404.html"), notFoundPage({ counts }));

// ---------- sitemap, robots, PWA ----------

writeFileSync(join(OUT, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map((p) => `  <url><loc>${SITE.base}${p.path}</loc><lastmod>${p.lastmod}</lastmod><priority>${p.priority.toFixed(1)}</priority></url>`).join("\n")}
</urlset>
`);
writeFileSync(join(OUT, "robots.txt"), production
  ? `User-agent: *\nDisallow: /account/\nDisallow: /recruit/\nDisallow: /p/\nAllow: /\n\nSitemap: ${SITE.base}sitemap.xml\n`
  : `# Concept mockup with sample jobs. Keep it out of search.\nUser-agent: *\nDisallow: /\n`);
writeFileSync(join(OUT, ".nojekyll"), "");

writeFileSync(join(OUT, "manifest.webmanifest"), JSON.stringify({
  id: "./",
  name: "CTR Group Jobs",
  short_name: "CTR Jobs",
  description: "Search shipyard and skilled trades jobs in plain words, apply in a minute, and meet your recruiter on video.",
  start_url: "./?source=pwa",
  scope: "./",
  display: "standalone",
  background_color: "#c3c8c8",
  theme_color: "#c3c8c8",
  categories: ["business", "productivity"],
  icons: [
    { src: "assets/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    { src: "assets/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    { src: "assets/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    { src: "assets/icons/icon.svg", sizes: "any", type: "image/svg+xml" },
  ],
  shortcuts: [
    { name: "Search jobs", short_name: "Search", url: "./?source=shortcut", icons: [{ src: "assets/icons/icon-192.png", sizes: "192x192" }] },
    { name: "Saved jobs", short_name: "Saved", url: "saved/", icons: [{ src: "assets/icons/icon-192.png", sizes: "192x192" }] },
    { name: "My applications", short_name: "Applied", url: "account/#applications", icons: [{ src: "assets/icons/icon-192.png", sizes: "192x192" }] },
  ],
}, null, 2));

const assetUrls = filesUnder(join(OUT, "assets"))
  .map((f) => f.slice(OUT.length + 1).split("\\").join("/"))
  .filter((f) => !/\.(svg|png)$/.test(f) || /icon-192|icon\.svg/.test(f))
  .filter((f) => !/LICENSE|VERSION|OFL/.test(f));
const entries = ["app.js", "search.js", "saved.js", "account.js", "auth.js"].map((f) => `assets/js/${f}?v=${SITE.version}`);
const precache = ["./", "jobs/", "saved/", "sign-in/", "account/", "offline/", "manifest.webmanifest", "data/jobs.json", `assets/css/site.css?v=${SITE.version}`, ...entries, ...assetUrls];
writeFileSync(join(OUT, "sw.js"), readFileSync(join(here, "sw.template.js"), "utf8").replace("__VERSION__", SITE.version).replace("__PRECACHE__", JSON.stringify(precache, null, 2)));

const total = filesUnder(OUT).length;
console.log(`built ${pages.length} indexed pages (${jobs.length} jobs, ${tradeCities} trade-by-town, ${locationKeys.size} locations), ${total} files, version ${SITE.version}, ${production ? "production" : "mockup"}, ${Date.now() - started} ms`);
