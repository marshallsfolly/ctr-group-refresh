#!/usr/bin/env node
// Checks the built site in docs/ without a browser:
//   every JSON-LD block parses, and JobPostings carry Google's required fields;
//   every internal link and asset resolves to a file;
//   pages have one h1, a title and a description;
//   everything the service worker precaches exists.

import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, dirname, resolve, relative } from "node:path";
import { fileURLToPath } from "node:url";

const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "docs");
const files = (dir) => readdirSync(dir).flatMap((n) => (statSync(join(dir, n)).isDirectory() ? files(join(dir, n)) : [join(dir, n)]));
const all = files(OUT);
const html = all.filter((f) => f.endsWith(".html"));
const problems = [];
const warn = [];
const stats = { pages: html.length, jsonld: 0, jobPostings: 0, links: 0, bytes: 0, biggest: [0, ""] };

const BASE_PATH = "/ctr-group-refresh/";
const REQUIRED = ["title", "description", "datePosted", "validThrough", "hiringOrganization", "jobLocation", "baseSalary", "employmentType", "identifier"];

for (const file of html) {
  const text = readFileSync(file, "utf8");
  const rel = relative(OUT, file);
  stats.bytes += text.length;
  if (text.length > stats.biggest[0]) stats.biggest = [text.length, rel];

  for (const m of text.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    stats.jsonld++;
    let data;
    try {
      data = JSON.parse(m[1]);
    } catch (e) {
      problems.push(`${rel}: JSON-LD doesn't parse (${e.message})`);
      continue;
    }
    if (data["@type"] === "JobPosting") {
      stats.jobPostings++;
      for (const key of REQUIRED) if (data[key] == null) problems.push(`${rel}: JobPosting missing ${key}`);
      const a = data.jobLocation?.address ?? {};
      if (!a.addressLocality || !a.addressRegion || !a.addressCountry) problems.push(`${rel}: JobPosting address incomplete`);
      const v = data.baseSalary?.value ?? {};
      if (!(v.minValue > 0) || !(v.maxValue >= v.minValue) || !["HOUR", "YEAR"].includes(v.unitText)) problems.push(`${rel}: JobPosting salary malformed`);
      if (!(Date.parse(data.validThrough) > Date.parse(data.datePosted))) problems.push(`${rel}: validThrough not after datePosted`);
    }
  }

  const titles = text.match(/<title>([^<]*)<\/title>/);
  if (!titles) problems.push(`${rel}: no <title>`);
  else if (titles[1].length > 75) warn.push(`${rel}: title ${titles[1].length} chars`);
  const desc = text.match(/<meta name="description" content="([^"]*)"/);
  if (!desc) problems.push(`${rel}: no meta description`);
  const h1 = (text.match(/<h1[\s>]/g) ?? []).length;
  const appShell = /data-console|data-room/.test(text);
  if (!appShell && h1 !== 1) problems.push(`${rel}: ${h1} h1 elements`);

  for (const m of text.matchAll(/\s(?:href|src)="([^"]+)"/g)) {
    let url = m[1].replace(/&amp;/g, "&");
    if (/^(?:https?:|mailto:|tel:|data:|#|blob:)/.test(url)) continue;
    stats.links++;
    url = url.split("#")[0].split("?")[0];
    if (!url) continue;
    let target = url.startsWith(BASE_PATH) ? join(OUT, url.slice(BASE_PATH.length)) : resolve(dirname(file), url);
    if (url.endsWith("/") || (existsSync(target) && statSync(target).isDirectory())) target = join(target, "index.html");
    if (!existsSync(target)) problems.push(`${rel}: broken link ${m[1]}`);
  }
}

const sw = readFileSync(join(OUT, "sw.js"), "utf8");
const precache = JSON.parse(sw.match(/const PRECACHE = (\[[\s\S]*?\]);/)[1]);
for (const entry of precache) {
  const path = entry.split("?")[0];
  const target = path.endsWith("/") ? join(OUT, path, "index.html") : join(OUT, path);
  if (!existsSync(target)) problems.push(`sw.js precaches missing ${entry}`);
}
const manifest = JSON.parse(readFileSync(join(OUT, "manifest.webmanifest"), "utf8"));
for (const icon of manifest.icons) if (!existsSync(join(OUT, icon.src))) problems.push(`manifest icon missing ${icon.src}`);

const unique = [...new Set(problems)];
console.log(`${stats.pages} pages · ${stats.jsonld} JSON-LD blocks (${stats.jobPostings} JobPostings) · ${stats.links} internal links · ${precache.length} precached · avg ${Math.round(stats.bytes / stats.pages / 1024)} KB/page, biggest ${Math.round(stats.biggest[0] / 1024)} KB (${stats.biggest[1]})`);
if (warn.length) console.log(`${warn.length} warnings, e.g.\n  ${warn.slice(0, 5).join("\n  ")}`);
if (unique.length) {
  console.log(`${unique.length} problems:\n  ${unique.slice(0, 40).join("\n  ")}`);
  process.exit(1);
}
console.log("all checks pass");
