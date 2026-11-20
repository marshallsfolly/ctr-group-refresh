// The query bar. The sentence in the box is the whole search: chips, quick buttons, regions and
// sort all edit the sentence, and the list follows the sentence.

import { read, search, without, withPhrase, ghost, suggestions, EXAMPLES } from "./query.js";
import { REGIONS, REGION, PLACE } from "./catalog.js";
import { jobRow, plate, chip } from "./render.js";
import { createHistory } from "./jevbar/index.js";
import { root, saved, toast, loadJobs, debounce, reducedMotion, session } from "./lib.js";

const zone = document.querySelector("[data-search]");
const form = zone.querySelector(".qb");
const input = form.querySelector(".qb__input");
const ghostEl = form.querySelector(".qb__ghost");
const clearBtn = form.querySelector(".qb__clear");
const suggestEl = form.querySelector(".qb__suggest");
const readingEl = form.querySelector(".reading");
const notesEl = form.querySelector(".notes");
const listEl = document.querySelector("[data-jobs]");
const countEl = document.querySelector("[data-count]");
const countLabel = document.querySelector("[data-count-label]");
const previewEl = document.querySelector("[data-preview]");
const moreLink = document.querySelector("[data-more]");
const recent = createHistory("ctr-search-history", 30);

const PAGE = 40;
let jobs = [];
let reading = read("");
let outcome = null;
let shown = PAGE;
let origin = null;
let activeId = null;
let shownCount = Number(countEl.textContent.replace(/,/g, "")) || 0;

// ---------- reading and results ----------

function run({ keepPage = false } = {}) {
  if (!jobs.length) return;
  reading = read(input.value);
  outcome = search(jobs, reading, { origin });
  if (!keepPage) shown = PAGE;
  paintReading();
  paintCount();
  paintList();
  paintRegions();
  paintSort();
  paintQuick();
  syncUrl();
  dispatchEvent(new Event("ctr:results"));
}

function paintReading() {
  const items = reading.items;
  readingEl.innerHTML = `<span class="reading__k">Reading</span>${items.length
    ? items.map((item, i) => chip(item, i)).join("")
    : `<span class="reading__empty">${input.value.trim() ? "Ranking by your words." : "Type a trade, a town, a shift or a rate. Everything is optional."}</span>`}`;
  notesEl.innerHTML = outcome.notes.map((note) => `<li>${note}</li>`).join("");
  if (reading.filters.action === "alert") {
    notesEl.insertAdjacentHTML("beforeend", `<li style="color:var(--ink)">Job alert: <a href="${root}${session.get() ? "account/#alerts" : "sign-in/"}" data-alert>save this search</a> and we'll text you when new jobs match.</li>`);
  }
  clearBtn.hidden = !input.value;
}

function paintCount() {
  const target = outcome.results.length;
  const from = shownCount;
  shownCount = target;
  const sortWord = { pay: "best pay first", closest: "closest first", newest: "newest first" }[outcome.sort];
  countLabel.innerHTML = `${target === jobs.length ? "open jobs" : target === 1 ? "job matches" : "jobs match"}<br>${reading.filters.words.length ? "best match first" : sortWord}`;
  if (reducedMotion() || Math.abs(target - from) < 3) return (countEl.textContent = target.toLocaleString("en-US"));
  const start = performance.now();
  const step = (now) => {
    const t = Math.min(1, (now - start) / 320);
    const eased = 1 - (1 - t) ** 3;
    countEl.textContent = Math.round(from + (target - from) * eased).toLocaleString("en-US");
    if (t < 1 && shownCount === target) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

function paintList() {
  const ids = new Set(saved.ids());
  const rows = outcome.results.slice(0, shown);
  listEl.innerHTML = rows.map((job, i) => jobRow(job, { root, index: i, distance: outcome.distance.get(job.id) ?? null, saved: ids.has(job.id) })).join("");
  if (!reducedMotion()) [...listEl.children].slice(0, 12).forEach((li, i) => li.style.setProperty("--i", i));
  moreButton.hidden = outcome.results.length <= shown;
  moreButton.textContent = `Show ${Math.min(PAGE, outcome.results.length - shown)} more of ${outcome.results.length.toLocaleString("en-US")}`;
  const first = outcome.results.find((j) => j.id === activeId) ?? outcome.results[0];
  if (first) showPreview(first.id);
}

function showPreview(id) {
  if (!previewEl || !matchMedia("(min-width: 1100px)").matches) return;
  const job = outcome?.results.find((j) => j.id === id) ?? jobs.find((j) => j.id === id);
  if (!job) return;
  activeId = id;
  previewEl.innerHTML = plate(job, { root, heading: "h3" });
  previewEl.querySelector("[data-save]")?.setAttribute("aria-pressed", String(saved.has(id)));
  listEl.querySelectorAll(".job.is-active").forEach((li) => li.classList.remove("is-active"));
  listEl.querySelector(`.job[data-id="${id}"]`)?.classList.add("is-active");
}

function paintRegions() {
  // Counts per region for the search without its place, so other regions stay reachable.
  const loose = search(jobs, { ...reading, filters: { ...reading.filters, where: null, radius: null } }, {}).results;
  const byRegion = loose.reduce((m, j) => ((m[j.region] = (m[j.region] ?? 0) + 1), m), {});
  const where = reading.filters.where;
  for (const button of zone.querySelectorAll("[data-region]")) {
    const key = button.dataset.region;
    const c = byRegion[key] ?? 0;
    button.querySelector("b").textContent = c.toLocaleString("en-US");
    const on = where && ((where.kind === "region" && where.key === key) || (where.kind === "place" && PLACE[where.key].region === key));
    button.setAttribute("aria-pressed", String(Boolean(on)));
    button.disabled = !c;
  }
}

function paintQuick() {
  const have = new Set(reading.items.map((i) => `${i.kind}:${i.key}`));
  for (const button of zone.querySelectorAll("[data-add]")) {
    const parts = read(button.dataset.add).items;
    button.hidden = parts.length > 0 && parts.every((i) => have.has(`${i.kind}:${i.key}`));
  }
}

function paintSort() {
  for (const button of document.querySelectorAll("[data-sort]")) button.setAttribute("aria-pressed", String(button.dataset.sort === outcome.sort));
}

function syncUrl() {
  const url = new URL(location.href);
  if (input.value.trim()) url.searchParams.set("q", input.value.trim());
  else url.searchParams.delete("q");
  url.searchParams.delete("source");
  window.history.replaceState(null, "", url);
}

const moreButton = document.createElement("button");
moreButton.type = "button";
moreButton.className = "btn btn--line";
moreLink?.replaceWith(moreButton);
moreButton.addEventListener("click", () => {
  shown += PAGE;
  paintList();
  dispatchEvent(new Event("ctr:results"));
});

// ---------- typing help ----------

function paintGhost() {
  const text = input.value;
  const atEnd = input.selectionStart === text.length && input.selectionEnd === text.length;
  const rest = document.activeElement === input && atEnd && input.scrollWidth <= input.clientWidth ? ghost(text, recent.all()) : "";
  ghostEl.innerHTML = rest ? `${escapeHtml(text)}<i>${escapeHtml(rest)}</i>` : "";
  ghostEl.dataset.rest = rest;
}
const escapeHtml = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");

let options = [];
let selected = -1;
function paintSuggestions() {
  const text = input.value.trim();
  if (document.activeElement !== input) return closeSuggestions();
  const past = recent.all();
  options = text
    ? [...past.filter((h) => h.toLowerCase().startsWith(text.toLowerCase()) && h.toLowerCase() !== text.toLowerCase()).slice(0, 2).map((t) => [t, "Recent"]), ...suggestions(text, 6).map((t) => [t, ""])]
    : [...past.slice(0, 3).map((t) => [t, "Recent"]), ...EXAMPLES.slice(0, past.length ? 3 : 5).map((t) => [t, "Try"])];
  options = options.filter(([t], i, all) => all.findIndex(([u]) => u.toLowerCase() === t.toLowerCase()) === i).slice(0, matchMedia("(max-width: 719px)").matches ? 4 : 7);
  if (!options.length) return closeSuggestions();
  selected = -1;
  suggestEl.innerHTML = options.map(([t, tag], i) => `<li role="option" id="sg-${i}" aria-selected="false" data-i="${i}">${escapeHtml(t)}${tag ? `<small>${tag}</small>` : ""}</li>`).join("");
  suggestEl.hidden = false;
  input.setAttribute("aria-expanded", "true");
}
function closeSuggestions() {
  suggestEl.hidden = true;
  input.setAttribute("aria-expanded", "false");
  input.removeAttribute("aria-activedescendant");
  selected = -1;
}
function highlight(i) {
  selected = (i + options.length) % options.length;
  suggestEl.querySelectorAll("li").forEach((li, k) => li.setAttribute("aria-selected", String(k === selected)));
  input.setAttribute("aria-activedescendant", `sg-${selected}`);
  suggestEl.querySelector(`#sg-${selected}`)?.scrollIntoView({ block: "nearest" });
}
function choose(text) {
  input.value = text;
  closeSuggestions();
  commit();
}

function commit() {
  recent.remember(input.value);
  run();
  if (matchMedia("(max-width: 859px)").matches) {
    input.blur();
    document.querySelector(".results")?.scrollIntoView({ behavior: reducedMotion() ? "auto" : "smooth", block: "start" });
  }
}

const runSoon = debounce(() => run(), 70);
input.addEventListener("input", () => {
  paintGhost();
  paintSuggestions();
  runSoon();
});
input.addEventListener("focus", () => {
  stopTyping();
  paintGhost();
  paintSuggestions();
});
input.addEventListener("blur", () => setTimeout(() => {
  closeSuggestions();
  ghostEl.innerHTML = "";
  startTyping();
}, 120));
input.addEventListener("keydown", (e) => {
  if (e.key === "ArrowDown" && !suggestEl.hidden) {
    e.preventDefault();
    highlight(selected + 1);
  } else if (e.key === "ArrowUp" && !suggestEl.hidden) {
    e.preventDefault();
    highlight(selected - 1);
  } else if ((e.key === "Tab" || e.key === "ArrowRight") && ghostEl.dataset.rest && input.selectionStart === input.value.length) {
    e.preventDefault();
    input.value += ghostEl.dataset.rest;
    paintGhost();
    paintSuggestions();
    run();
  } else if (e.key === "Enter" && selected >= 0) {
    e.preventDefault();
    choose(options[selected][0]);
  } else if (e.key === "Escape") {
    if (!suggestEl.hidden) closeSuggestions();
    else if (input.value) {
      input.value = "";
      run();
    }
  }
});
input.addEventListener("click", paintGhost);
suggestEl.addEventListener("pointerdown", (e) => {
  const li = e.target.closest("li");
  if (!li) return;
  e.preventDefault();
  choose(options[Number(li.dataset.i)][0]);
});
form.addEventListener("submit", (e) => {
  e.preventDefault();
  closeSuggestions();
  commit();
});
clearBtn.addEventListener("click", () => {
  input.value = "";
  run();
  input.focus();
});

// The chips, quick adds, regions and sort all rewrite the sentence.
readingEl.addEventListener("click", (e) => {
  const button = e.target.closest("[data-item]");
  if (!button) return;
  input.value = without(reading, reading.items[Number(button.dataset.item)]);
  run();
});
zone.addEventListener("click", (e) => {
  const add = e.target.closest("[data-add]");
  if (add) {
    input.value = withPhrase(reading, add.dataset.add);
    return run();
  }
  const region = e.target.closest("[data-region]");
  if (region) {
    const pressed = region.getAttribute("aria-pressed") === "true";
    const whereItem = reading.items.find((i) => i.kind === "where");
    input.value = pressed && whereItem ? without(reading, whereItem) : withPhrase(reading, `in ${REGION[region.dataset.region].name.replace(/, VA$/, "")}`, "where");
    run();
  }
});
document.addEventListener("click", (e) => {
  const button = e.target.closest("[data-sort]");
  if (!button) return;
  const kind = button.dataset.sort;
  if (kind === "newest") input.value = withPhrase(reading, "newest first", "sort");
  else if (kind === "pay") input.value = withPhrase(reading, "best paying", "sort");
  else {
    if (!reading.filters.where && !origin) locate();
    input.value = withPhrase(reading, reading.filters.where ? "closest first" : "near me", "sort");
  }
  run();
});

function locate() {
  if (!navigator.geolocation) return toast("Say a town to sort by distance");
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      origin = { lat: pos.coords.latitude, lon: pos.coords.longitude };
      run({ keepPage: true });
    },
    () => toast("Location is off. Say a town instead."),
    { maximumAge: 600000, timeout: 8000 },
  );
}

// Preview the plate on hover and focus (wide screens).
listEl.addEventListener("pointerover", (e) => {
  const li = e.target.closest(".job");
  if (li && li.dataset.id !== activeId) showPreview(li.dataset.id);
});
listEl.addEventListener("focusin", (e) => {
  const li = e.target.closest(".job");
  if (li) showPreview(li.dataset.id);
});

// "/" jumps to the bar, like most search-first sites.
document.addEventListener("keydown", (e) => {
  if (e.key !== "/" || e.metaKey || e.ctrlKey || /input|textarea|select/i.test(document.activeElement?.tagName)) return;
  e.preventDefault();
  input.focus();
  input.select();
});

// Dock the bar once it sticks under the header.
const sentinel = document.createElement("div");
form.before(sentinel);
new IntersectionObserver(([entry]) => form.classList.toggle("is-docked", !entry.isIntersecting && entry.boundingClientRect.top < 0), {
  rootMargin: `-${parseInt(getComputedStyle(document.documentElement).getPropertyValue("--header")) + 1 || 57}px 0px 0px 0px`,
}).observe(sentinel);

// ---------- placeholder that types out working searches ----------

let typing = null;
function startTyping() {
  if (reducedMotion() || input.value || document.activeElement === input) return;
  stopTyping();
  let ex = 0;
  let pos = 0;
  let dir = 1;
  let hold = 0;
  typing = setInterval(() => {
    const text = EXAMPLES[ex % EXAMPLES.length];
    if (hold > 0) return hold--;
    pos += dir;
    input.placeholder = text.slice(0, pos) || " ";
    if (pos >= text.length) {
      dir = -1;
      hold = 36;
    } else if (pos <= 0) {
      dir = 1;
      ex++;
      hold = 4;
    }
  }, 42);
}
function stopTyping() {
  clearInterval(typing);
  typing = null;
  input.placeholder = EXAMPLES[0];
}

// ---------- start ----------

const q = new URLSearchParams(location.search).get("q");
if (q) input.value = q;
loadJobs()
  .then((data) => {
    jobs = data;
    run();
    if (!q) startTyping();
  })
  .catch(() => {
    readingEl.innerHTML = `<span class="reading__empty">Couldn't load jobs. Check your connection and pull to refresh.</span>`;
  });
