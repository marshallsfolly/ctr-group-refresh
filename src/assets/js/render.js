// Markup shared by the page generator and the live search, so a job looks the same either way.

import { TRADE, LEVEL, CERT, SHIFT, TYPE, PROGRAM, PLACE, placeName, payLabel, postedLabel, esc, daysBetween, AS_OF, money } from "./catalog.js";
import { glyph } from "./glyphs.js";

export function jobTags(job) {
  const tags = [];
  if (job.urgent) tags.push(["hot", "Hot"]);
  if (daysBetween(job.posted, AS_OF) <= 2) tags.push(["new", "New"]);
  if (job.bonus) tags.push(["bonus", `${money(job.bonus)} bonus`]);
  if (job.applicants >= job.openings * 5 && !job.urgent) tags.push(["fast", "Filling fast"]);
  if (job.travel) tags.push(["travel", "Travel"]);
  return tags;
}

export function shiftLabel(job) {
  return `${SHIFT[job.shift].short} · ${job.schedule.label.replace(/, .*$/, "").replace(/ \(.*\)$/, "")}`;
}

export function certList(job) {
  return job.certs.map((key) => CERT[key].name);
}

const pad = (n) => String(n).padStart(3, "0");

/** One row in a list of jobs. */
export function jobRow(job, { root = "", index = null, distance = null, saved = false } = {}) {
  const place = PLACE[job.place];
  const tags = jobTags(job)
    .map(([kind, label]) => `<b class="tag tag--${kind}">${esc(label)}</b>`)
    .join("");
  const meta = [job.yard, TYPE[job.type].name, ...certList(job).slice(0, 2)].join(" · ");
  const away = distance != null ? ` <em>${distance < 1 ? "<1" : Math.round(distance)} mi</em>` : "";
  return `<li class="job" data-id="${job.id}">
  <a class="job__link" href="${root}jobs/${job.slug}/">
    ${index != null ? `<span class="job__idx" aria-hidden="true">[${pad(index + 1)}]</span>` : ""}
    <span class="job__glyph" aria-hidden="true">${glyph(job.trade, 28)}</span>
    <span class="job__main">
      <span class="job__title">${esc(job.title)}</span>
      <span class="job__meta">${esc(meta)}</span>
    </span>
    <span class="job__where">${esc(placeName(place))}${away}</span>
    <span class="job__shift">${esc(shiftLabel(job))}</span>
    <span class="job__pay"><strong>${esc(payLabel(job))}</strong>${job.perDiem ? `<em>+${money(job.perDiem)}/day per diem</em>` : ""}</span>
    <span class="job__tags">${tags}<span class="job__posted">${esc(postedLabel(job.posted))}</span></span>
  </a>
  <button class="save" type="button" data-save="${job.id}" aria-pressed="${saved}" aria-label="Save ${esc(job.title)}">${saveIcon()}</button>
</li>`;
}

export function saveIcon() {
  return `<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M6 3h12v18l-6-4.5L6 21z" fill="var(--save-fill, none)" stroke="currentColor" stroke-width="1.6" stroke-linejoin="miter"/></svg>`;
}

/** The job's data plate: the riveted nameplate that sums up a posting. */
export function plate(job, { root = "", heading = "h2", actions = true, link = true } = {}) {
  const place = PLACE[job.place];
  const trade = TRADE[job.trade];
  const level = LEVEL[job.level];
  const cell = (label, value, wide = false) => `<div class="plate__cell${wide ? " plate__cell--wide" : ""}"><dt>${label}</dt><dd>${value}</dd></div>`;
  const certs = certList(job);
  const title = link ? `<a href="${root}jobs/${job.slug}/">${esc(job.title)}</a>` : esc(job.title);
  return `<article class="plate" data-id="${job.id}">
  <span class="rivet rivet--tl"></span><span class="rivet rivet--tr"></span><span class="rivet rivet--bl"></span><span class="rivet rivet--br"></span>
  <header class="plate__head"><span>CTR Group · Job data plate</span><span>Req. ${job.id}</span></header>
  <div class="plate__title">
    <span class="plate__glyph" aria-hidden="true">${glyph(job.trade, 44)}</span>
    <${heading} class="plate__name">${title}</${heading}>
  </div>
  <dl class="plate__grid">
    ${cell("Trade", esc(trade.name))}
    ${cell("Class", esc(trade.flat ? "Open" : level.name))}
    ${cell("Location", esc(placeName(place)))}
    ${cell("Shift", esc(shiftLabel(job)))}
    ${cell("Rate", `<span class="plate__pay">${esc(payLabel(job))}</span>`)}
    ${cell("Per diem", job.perDiem ? `${money(job.perDiem)}/day` : "None")}
    ${cell("Hire", esc(TYPE[job.type].name))}
    ${cell("Openings", String(job.openings))}
    ${cell("Program", esc(PROGRAM[job.program].name))}
    ${cell("Posted", esc(postedLabel(job.posted)))}
    ${cell("Requires", certs.length ? certs.map(esc).join(" · ") : "No credentials needed to apply", true)}
  </dl>
  ${actions ? `<div class="plate__actions">
    <a class="btn btn--hazard" href="${root}sign-in/?apply=${job.id}">Apply in 60 seconds</a>
    <button class="btn btn--line" type="button" data-save="${job.id}" aria-pressed="false">${saveIcon()}<span>Save</span></button>
  </div>` : ""}
</article>`;
}

/** "Q›" readout chip for a reading item. */
export function chip(item, index) {
  const KIND = { trade: "Trade", cert: "Needs", perk: "Perk", program: "Work", level: "Class", shift: "Shift", type: "Hire", travel: "Travel", sort: "Sort", where: "Where", pay: "Pay", posted: "Posted", spec: "Spec", word: "Words", schedule: "Sched", perdiem: "Per diem" };
  return `<button class="chip chip--${item.kind}" type="button" data-item="${index}" aria-label="Remove ${esc(KIND[item.kind] ?? item.kind)} ${esc(item.label)}"><span class="chip__k">${esc(KIND[item.kind] ?? item.kind)}</span><span class="chip__v">${esc(item.label)}</span><span class="chip__x" aria-hidden="true">×</span></button>`;
}
