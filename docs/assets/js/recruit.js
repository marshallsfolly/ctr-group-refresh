// Recruiter console: pipeline, candidates, calendar, documents, onboarding.
// Recruiters search with the same plain-words reader as candidates, plus stage and source words.

import { read, without } from "./query.js";
import { TRADE, LEVEL, CERT, PLACE, COASTS, placeName, payLabel, miles, esc, AS_OF, daysBetween } from "./catalog.js";
import { root, store, toast, debounce, initials } from "./lib.js";

const host = document.querySelector("[data-console]");
const rail = document.querySelector(".rail");
const state = store.get("ctr-recruit", { moves: {}, notes: {}, events: [], docs: {}, verified: {} });
const save = () => store.set("ctr-recruit", state);

const STAGE_WORDS = {
  lead: /\bnew leads?\b|\bleads?\b|\bnew ones\b/,
  screen: /\bscreen(?:ing|ed)?\b/,
  interview: /\binterview(?:s|ing|ed)?\b/,
  offer: /\boffers?\b/,
  onboard: /\bonboard(?:ing)?\b|\bpaperwork\b/,
  placed: /\bplaced\b|\bon the job\b|\bworking now\b/,
};
const SOURCE_WORDS = { linkedin: /\blinked ?in\b/, referral: /\breferr(?:al|als|ed)\b/, passkey: /\bpasskeys?\b/, "walk-in": /\bwalk[- ]?ins?\b/, email: /\bemail sign[- ]?ups?\b/, search: /\bsite search\b/ };
const EXPIRING = /\bexpir(?:ing|ed|es)\b|\brenewals?\b/;
const DOC_NAMES = { offer: "Offer letter", i9: "I-9", w4: "W-4", deposit: "Direct deposit", drug: "Drug screen", safety: "Safety orientation", badge: "Gate badge" };

let data = null;
let people = [];
let text = "";

fetch(`${root}data/candidates.json`).then((r) => r.json()).then((d) => {
  data = d;
  people = d.candidates;
  route();
});

const stageOf = (c) => state.moves[c.id] ?? c.stage;
const stageName = (key) => data.stages.find((s) => s.key === key)?.name ?? key;
const sourceName = (key) => data.sources.find((s) => s.key === key)?.name ?? key;
const expiring = (c) => c.certs.some((x) => x.expires && daysBetween(AS_OF, x.expires) < 30);

// ---------- filtering ----------

function readConsole(value) {
  const reading = read(value);
  const lower = reading.text.toLowerCase();
  const stages = Object.keys(STAGE_WORDS).filter((k) => STAGE_WORDS[k].test(lower));
  const sources = Object.keys(SOURCE_WORDS).filter((k) => SOURCE_WORDS[k].test(lower));
  const expiry = EXPIRING.test(lower);
  return { reading, stages, sources, expiry };
}

function filter(list, r) {
  const f = r.reading.filters;
  return list.filter((c) => {
    if (f.trades.length && !f.trades.includes(c.trade)) return false;
    if (f.level && c.level !== f.level) return false;
    if (f.certs.length && !f.certs.every((k) => c.certs.some((x) => x.key === k))) return false;
    if (f.travel === "travel" && !c.travel) return false;
    if (f.where) {
      const home = PLACE[c.home];
      const w = f.where;
      if (w.kind === "place" && miles(home, PLACE[w.key]) > (f.radius ?? 30)) return false;
      if (w.kind === "region" && home.region !== w.key) return false;
      if (w.kind === "coast" && !COASTS.find((x) => x.key === w.key).regions.includes(home.region)) return false;
      if (w.kind === "state" && home.state !== w.key) return false;
    }
    if (r.stages.length && !r.stages.includes(stageOf(c))) return false;
    if (r.sources.length && !r.sources.includes(c.source)) return false;
    if (r.expiry && !expiring(c)) return false;
    return true;
  });
}

function filterBar(placeholder) {
  return `<form class="qb" data-filter style="position:static;margin:0 0 14px;padding:0">
    <div class="qb__field" style="min-height:52px"><i class="corner corner--tl"></i><i class="corner corner--tr"></i><i class="corner corner--bl"></i><i class="corner corner--br"></i>
      <span class="qb__prompt" aria-hidden="true">Q›</span>
      <div class="qb__box"><input class="qb__input" style="font-size:18px;line-height:52px" type="search" value="${esc(text)}" placeholder="${esc(placeholder)}" aria-label="Filter candidates in plain words" autocomplete="off" spellcheck="false"></div>
    </div>
    <div class="reading" data-reading></div>
  </form>`;
}

function paintReading(r, el) {
  const chips = r.reading.items.filter((i) => !["word", "spec", "sort"].includes(i.kind)).map((item) => `<button class="chip" type="button" data-item="${r.reading.items.indexOf(item)}"><span class="chip__k">${item.kind === "where" ? "Home" : item.kind === "cert" ? "Has" : item.kind === "trade" ? "Trade" : item.kind}</span><span class="chip__v">${esc(item.label)}</span><span class="chip__x">×</span></button>`);
  for (const s of r.stages) chips.push(`<span class="chip"><span class="chip__k">Stage</span><span class="chip__v">${esc(stageName(s))}</span></span>`);
  for (const s of r.sources) chips.push(`<span class="chip"><span class="chip__k">Source</span><span class="chip__v">${esc(sourceName(s))}</span></span>`);
  if (r.expiry) chips.push(`<span class="chip"><span class="chip__k">Certs</span><span class="chip__v">Expiring in 30 days</span></span>`);
  el.innerHTML = `<span class="reading__k">Reading</span>${chips.join("") || `<span class="reading__empty">Try “welders with TWIC in screening” or “referrals near Mobile”.</span>`}`;
}

function wireFilter(repaint) {
  const form = host.querySelector("[data-filter]");
  const input = form.querySelector("input");
  const readingEl = form.querySelector("[data-reading]");
  const update = () => {
    text = input.value;
    const r = readConsole(text);
    paintReading(r, readingEl);
    repaint(r);
  };
  input.addEventListener("input", debounce(update, 60));
  form.addEventListener("submit", (e) => e.preventDefault());
  readingEl.addEventListener("click", (e) => {
    const b = e.target.closest("[data-item]");
    if (!b) return;
    const r = readConsole(text);
    input.value = without(r.reading, r.reading.items[Number(b.dataset.item)]);
    update();
  });
  update();
}

// ---------- views ----------

function head(title, sub, extra = "") {
  return `<div class="console-head"><div><p class="label">${sub}</p><h1>${title}</h1></div>${extra}</div>`;
}

function card(c) {
  const t = TRADE[c.trade];
  const certs = c.certs.slice(0, 4).map((x) => `<span class="${x.expires && x.expires < AS_OF ? "bad" : ""}">${esc(CERT[x.key].name)}</span>`).join("");
  return `<li class="card" draggable="true" data-id="${c.id}" tabindex="0" role="button" aria-label="${esc(c.first)} ${esc(c.last)}, ${esc(t.name)}">
    <span class="card__src card__src--${c.source}" title="${esc(sourceName(c.source))}"></span>
    <div class="card__top"><span class="card__name">${esc(c.first)} ${esc(c.last)}</span><span class="card__match${c.match >= 85 ? " hi" : ""}">${c.match}</span></div>
    <span class="card__meta">${esc(t.flat ? t.name : `${LEVEL[c.level].name} ${t.name.replace(/ \/.*$/, "")}`)} · ${c.years} yrs<br>${esc(placeName(PLACE[c.home]))} · ${esc(sourceName(c.source))}</span>
    ${certs ? `<div class="card__certs">${certs}</div>` : ""}
  </li>`;
}

const VIEWS = {
  pipeline() {
    const counts = Object.fromEntries(data.stages.map((s) => [s.key, people.filter((c) => stageOf(c) === s.key).length]));
    host.innerHTML = `${head("Pipeline", "Tasha Greene · all offices", `<a class="btn btn--sm btn--line" href="${root}employers/">New job order</a>`)}
      <div class="kpis"><div><b>${counts.lead}</b><span>New leads</span></div><div><b>${counts.screen}</b><span>In screening</span></div><div><b>${counts.interview}</b><span>Interviews this week</span></div><div><b>${counts.onboard + counts.offer}</b><span>Starting soon</span></div></div>
      ${filterBar("welders with TWIC in screening")}
      <div class="board" data-board></div>`;
    const board = host.querySelector("[data-board]");
    wireFilter((r) => {
      const list = filter(people, r).sort((a, b) => (a.active < b.active ? 1 : -1));
      board.innerHTML = data.stages.map((s) => {
        const col = list.filter((c) => stageOf(c) === s.key);
        return `<section class="col" data-stage="${s.key}" aria-label="${esc(s.name)}"><header><span>${esc(s.name)}</span><b>${col.length}</b></header><ol>${col.slice(0, 60).map(card).join("")}${col.length > 60 ? `<li class="fine" style="padding:8px">+${col.length - 60} more. Narrow the search.</li>` : ""}</ol></section>`;
      }).join("");
    });
    // Drag between columns (mouse); on touch, the card sheet has a stage picker.
    board.addEventListener("dragstart", (e) => {
      const el = e.target.closest(".card");
      if (!el) return;
      e.dataTransfer.setData("text/plain", el.dataset.id);
      e.dataTransfer.effectAllowed = "move";
      el.classList.add("is-dragging");
    });
    board.addEventListener("dragend", (e) => e.target.closest?.(".card")?.classList.remove("is-dragging"));
    board.addEventListener("dragover", (e) => {
      const col = e.target.closest(".col");
      if (!col) return;
      e.preventDefault();
      board.querySelectorAll(".is-over").forEach((x) => x !== col && x.classList.remove("is-over"));
      col.classList.add("is-over");
    });
    board.addEventListener("dragleave", (e) => {
      if (!e.relatedTarget?.closest?.(".col")) e.target.closest(".col")?.classList.remove("is-over");
    });
    board.addEventListener("drop", (e) => {
      const col = e.target.closest(".col");
      if (!col) return;
      e.preventDefault();
      col.classList.remove("is-over");
      move(e.dataTransfer.getData("text/plain"), col.dataset.stage);
    });
    board.addEventListener("click", (e) => {
      const el = e.target.closest(".card");
      if (el) openSheet(el.dataset.id);
    });
    board.addEventListener("keydown", (e) => {
      const el = e.target.closest(".card");
      if (el && (e.key === "Enter" || e.key === " ")) {
        e.preventDefault();
        openSheet(el.dataset.id);
      }
    });
  },

  candidates() {
    host.innerHTML = `${head("Candidates", `${people.length} people · all sources`)}${filterBar("referrals near Mobile with expiring certs")}<div class="table-wrap"><table class="table"><thead><tr><th>Name</th><th>Trade</th><th>Home</th><th>Stage</th><th>Match</th><th>Source</th><th>Active</th></tr></thead><tbody data-rows></tbody></table></div>`;
    const rows = host.querySelector("[data-rows]");
    wireFilter((r) => {
      const list = filter(people, r).sort((a, b) => b.match - a.match);
      rows.innerHTML = list.slice(0, 150).map((c) => `<tr data-id="${c.id}" style="cursor:pointer"><td><strong>${esc(c.first)} ${esc(c.last)}</strong><br><span class="fine">${c.id}</span></td><td>${esc(TRADE[c.trade].name)}<br><span class="fine">${esc(LEVEL[c.level].name)} · ${c.years} yrs</span></td><td>${esc(placeName(PLACE[c.home]))}</td><td>${esc(stageName(stageOf(c)))}</td><td><b class="stencil" style="font-size:22px">${c.match}</b></td><td>${esc(sourceName(c.source))}</td><td>${c.active}</td></tr>`).join("") + (list.length > 150 ? `<tr><td colspan="7" class="fine">Showing 150 of ${list.length}. Narrow the search.</td></tr>` : "");
    });
    rows.addEventListener("click", (e) => {
      const tr = e.target.closest("tr[data-id]");
      if (tr) openSheet(tr.dataset.id);
    });
  },

  calendar() {
    const seeded = people.filter((c) => stageOf(c) === "interview").slice(0, 14).map((c, i) => ({ id: `seed-${c.id}`, cand: c.id, day: i % 5, time: ["8:00", "9:30", "10:00", "11:00", "1:30", "2:00", "3:30"][i % 7], kind: i % 3 ? "Video interview" : "Weld test" }));
    const events = [...state.events, ...seeded];
    const days = ["Thu, Nov 20", "Fri, Nov 21", "Mon, Nov 24", "Tue, Nov 25", "Wed, Nov 26"];
    host.innerHTML = `${head("Calendar", "This week · Eastern time")}${days.map((d, i) => {
      const list = events.filter((e) => e.day === i).sort((a, b) => toMin(a.time) - toMin(b.time));
      return `<h2 class="label" style="margin:22px 0 6px">${d}</h2><ul class="agenda">${list.map((e) => {
        const c = people.find((p) => p.id === e.cand);
        return `<li><time>${e.time}</time><div><strong>${esc(e.kind)} · ${esc(c.first)} ${esc(c.last)}</strong><br><span class="small">${esc(TRADE[c.trade].name)} · ${esc(data.jobs[c.job]?.title ?? "")}</span></div><span style="display:flex;gap:6px">${e.kind === "Weld test" ? `<span class="status status--wait">On site</span>` : `<a class="btn btn--sm btn--hazard" href="${root}recruit/room/?c=${c.id}">Join</a>`}</span></li>`;
      }).join("") || `<li><span></span><span class="small">Nothing booked.</span><span></span></li>`}</ul>`;
    }).join("")}`;
  },

  documents() {
    const rows = [];
    for (const c of people) {
      const docs = { ...(c.docs ?? {}), ...(state.docs[c.id] ?? {}) };
      for (const [k, status] of Object.entries(docs)) if (status !== "not-started") rows.push([c, k, status]);
    }
    const tone = (s) => (/signed|verified|done|passed|issued/.test(s) ? "done" : /requested|sent|viewed|scheduled|pending|section-1|in-progress/.test(s) ? "wait" : "todo");
    host.innerHTML = `${head("Documents", "Shared securely · links expire in 7 days · watermarked with the viewer's name")}
      <div class="table-wrap"><table class="table"><thead><tr><th>Candidate</th><th>Document</th><th>Status</th><th></th></tr></thead><tbody>${rows.slice(0, 200).map(([c, k, s]) => `<tr><td><strong>${esc(c.first)} ${esc(c.last)}</strong><br><span class="fine">${esc(TRADE[c.trade].name)}</span></td><td>${esc(DOC_NAMES[k] ?? k)}</td><td><span class="status status--${tone(s)}">${esc(s.replace("-", " "))}</span></td><td>${tone(s) === "done" ? `<button class="btn btn--sm btn--line" type="button" data-view-doc>View</button>` : `<button class="btn btn--sm" type="button" data-nudge="${c.id}">Nudge</button>`}</td></tr>`).join("")}</tbody></table></div>`;
    host.onclick = (e) => {
      if (e.target.closest("[data-nudge]")) toast("Reminder texted");
      if (e.target.closest("[data-view-doc]")) toast("Opens in the secure viewer (watermarked)");
    };
  },

  onboarding() {
    const list = people.filter((c) => ["onboard", "offer"].includes(stageOf(c)));
    host.innerHTML = `${head("Onboarding", `${list.length} people starting soon`)}<div class="offices" style="grid-template-columns:repeat(auto-fill,minmax(280px,1fr))">${list.map((c) => {
      const docs = { offer: "not-started", i9: "not-started", w4: "not-started", deposit: "not-started", drug: "not-started", safety: "not-started", badge: "not-started", ...(c.docs ?? {}), ...(state.docs[c.id] ?? {}) };
      const done = Object.values(docs).filter((s) => /signed|verified|done|passed|issued/.test(s)).length;
      const job = data.jobs[c.job];
      return `<article class="office"><header><span>${esc(stageName(stageOf(c)))}</span><span>Starts ${c.available.slice(5).replace("-", "/")}</span></header><h3 style="font-size:20px">${esc(c.first)} ${esc(c.last)}</h3><p class="small">${esc(job?.title ?? "")}<br>${esc(job?.yard ?? "")}</p>
        <p style="padding:0 16px"><span class="label">${done} of 7 done</span></p><ol class="track" style="grid-template-columns:repeat(7,1fr);padding:0 16px">${Object.values(docs).map((s) => `<li class="${/signed|verified|done|passed|issued/.test(s) ? "on" : /requested|sent|viewed|scheduled|pending|section-1|in-progress/.test(s) ? "now" : ""}"></li>`).join("")}</ol>
        <p style="padding:8px 16px 0;display:flex;gap:6px"><button class="btn btn--sm" type="button" data-open="${c.id}">Open</button><button class="btn btn--sm btn--line" type="button" data-nudge>Nudge</button></p></article>`;
    }).join("")}</div>`;
    host.onclick = (e) => {
      const id = e.target.closest("[data-open]")?.dataset.open;
      if (id) openSheet(id);
      if (e.target.closest("[data-nudge]")) toast("Reminder texted");
    };
  },
};
const toMin = (t) => {
  const [h, m] = t.split(":").map(Number);
  return (h < 7 ? h + 12 : h) * 60 + m;
};

function route() {
  if (!data) return;
  const key = location.hash.slice(1) in VIEWS ? location.hash.slice(1) : "pipeline";
  host.onclick = null;
  rail.querySelectorAll("[data-view]").forEach((a) => a.setAttribute("aria-current", a.dataset.view === key ? "page" : "false"));
  const n = { pipeline: people.filter((c) => stageOf(c) !== "placed").length, candidates: people.length, calendar: 14 + state.events.length, documents: "", onboarding: people.filter((c) => ["onboard", "offer"].includes(stageOf(c))).length };
  for (const [k, v] of Object.entries(n)) rail.querySelector(`[data-n="${k}"]`).textContent = v;
  VIEWS[key]();
}
addEventListener("hashchange", route);

function move(id, stage) {
  const c = people.find((p) => p.id === id);
  if (!c || stageOf(c) === stage) return;
  state.moves[id] = stage;
  save();
  toast(`${c.first} ${c.last} → ${stageName(stage)}`);
  route();
}

// ---------- candidate sheet ----------

function openSheet(id) {
  const c = people.find((p) => p.id === id);
  const job = data.jobs[c.job];
  const t = TRADE[c.trade];
  const notes = [...(state.notes[id] ?? []), ...c.notes];
  const verified = state.verified[id] ?? {};
  const yes = (v) => (v === true ? `<span class="box yes">✓</span>` : v === false ? `<span class="box no">×</span>` : `<span class="box"></span>`);
  const twic = c.certs.find((x) => x.key === "twic");
  const sheet = document.createElement("div");
  sheet.className = "sheet";
  sheet.innerHTML = `<div class="sheet__body" role="dialog" aria-modal="true" aria-label="${esc(c.first)} ${esc(c.last)}">
    <div class="sheet__head"><span>Candidate ${c.id} · ${esc(sourceName(c.source))}</span><button type="button" data-close aria-label="Close">×</button></div>
    <div class="sheet__inner">
      <div style="display:flex;gap:14px;align-items:center"><span class="avatar avatar--lg">${initials(c.first, c.last)}</span><div style="flex:1"><p class="h3" style="margin:0">${esc(c.first)} ${esc(c.last)}</p><p class="small" style="margin:4px 0 0">${esc(t.flat ? t.name : `${LEVEL[c.level].name} ${t.name}`)} · ${c.years} yrs · ${esc(placeName(PLACE[c.home]))}</p></div><div style="text-align:right"><b class="stencil" style="font-size:48px">${c.match}</b><br><span class="fine">Match</span></div></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
        <button class="btn btn--hazard" type="button" data-schedule>Schedule interview</button>
        <a class="btn" href="${root}recruit/room/?c=${c.id}">Start video call</a>
        <button class="btn btn--line" type="button" data-request>Request documents</button>
        <label class="field" style="margin:0"><span class="sr-only">Stage</span><select class="select" data-stage-pick>${data.stages.map((s) => `<option value="${s.key}"${s.key === stageOf(c) ? " selected" : ""}>${esc(s.name)}</option>`).join("")}</select></label>
      </div>
      <div class="slots" data-slots hidden>${["Thu 8:00", "Thu 10:30", "Thu 2:00", "Fri 9:00", "Fri 11:00", "Mon 7:30"].map((s) => `<button type="button" aria-pressed="false" data-slot="${s}">${s}</button>`).join("")}</div>
      <div class="panel"><div class="panel__head"><span>Applied for</span><span>${c.job}</span></div><p style="margin:0"><a href="${root}jobs/${job.slug}/"><strong>${esc(job.title)}</strong></a><br><span class="small">${esc(job.yard)} · ${esc(placeName(PLACE[job.place]))} · ${esc(payLabel(job))}${job.perDiem ? ` · $${job.perDiem}/day per diem` : ""}</span></p><p class="small" style="margin:8px 0 0">Wants ${c.rate ? `$${c.rate}/hr` : "market rate"} · available ${c.available} · ${c.travel ? "will travel" : "local only"}</p></div>
      <dl class="spec"><div><dt>Phone</dt><dd><a href="tel:${c.phone}">${c.phone}</a></dd></div><div><dt>Email</dt><dd>${esc(c.email)}</dd></div><div><dt>Last active</dt><dd>${c.active}</dd></div></dl>
      <div><h3 class="label" style="margin-bottom:8px">Screening</h3><ul class="checklist">
        <li>${yes(c.screen.drug)}<span>Drug screen</span><span class="fine">${c.screen.drug == null ? "Not yet" : c.screen.drug ? "Passed" : "Failed"}</span></li>
        <li>${yes(c.screen.tools)}<span>Has own hand tools</span><span></span></li>
        <li>${yes(c.screen.travel)}<span>Will travel for work</span><span></span></li>
        <li>${yes(Boolean(twic))}<span>TWIC card</span><span class="fine">${twic?.expires ?? ""}</span></li>
        <li>${yes(c.screen.certsCurrent)}<span>All certs current</span><span></span></li>
      </ul></div>
      <div><h3 class="label" style="margin-bottom:8px">Credentials</h3><ul class="certs">${c.certs.map((x) => {
        const ok = x.verified || verified[x.key];
        const late = x.expires && x.expires < AS_OF;
        return `<li><span><strong>${esc(CERT[x.key].name)}</strong><br><small>${x.expires ? `${late ? "Expired" : "Expires"} ${x.expires}` : "No expiry"}</small></span>${late ? `<span class="badge-warn">Expired</span>` : ok ? `<span class="badge-verified">✓ Verified</span>` : `<button class="btn btn--sm btn--line" type="button" data-verify="${x.key}">Verify</button>`}</li>`;
      }).join("") || `<li class="small">No credentials on file.</li>`}</ul></div>
      <div><h3 class="label" style="margin-bottom:8px">Notes</h3>
        <form data-note style="display:flex;gap:8px;margin-bottom:8px"><input class="input" placeholder="Add a note" aria-label="Add a note"><button class="btn" type="submit">Add</button></form>
        <ul class="mini-list">${notes.map((n) => `<li style="padding:10px 0;border-bottom:1px solid var(--rule)"><span class="fine">${esc(n.by)} · ${n.at}</span><br>${esc(n.text)}</li>`).join("")}</ul>
      </div>
    </div>
  </div>`;
  document.body.append(sheet);
  document.body.style.overflow = "hidden";
  const close = () => {
    sheet.remove();
    document.body.style.overflow = "";
  };
  sheet.addEventListener("click", (e) => {
    if (e.target === sheet || e.target.closest("[data-close]")) return close();
    if (e.target.closest("[data-schedule]")) sheet.querySelector("[data-slots]").hidden = false;
    const slot = e.target.closest("[data-slot]");
    if (slot) {
      const [day, time] = slot.dataset.slot.split(" ");
      state.events.push({ id: `ev-${Date.now()}`, cand: c.id, day: { Thu: 0, Fri: 1, Mon: 2 }[day], time, kind: "Video interview" });
      state.moves[c.id] = "interview";
      save();
      toast(`Video interview booked ${slot.dataset.slot}. Invite texted.`);
      close();
      route();
    }
    if (e.target.closest("[data-request]")) {
      state.docs[c.id] = { ...(state.docs[c.id] ?? {}), i9: "requested", w4: "requested", deposit: "requested" };
      save();
      toast("I-9, W-4 and direct deposit requested");
    }
    const v = e.target.closest("[data-verify]");
    if (v) {
      state.verified[c.id] = { ...(state.verified[c.id] ?? {}), [v.dataset.verify]: true };
      save();
      v.outerHTML = `<span class="badge-verified">✓ Verified</span>`;
      toast("Checked against the issuer");
    }
  });
  sheet.querySelector("[data-stage-pick]").addEventListener("change", (e) => {
    move(c.id, e.target.value);
    close();
  });
  sheet.querySelector("[data-note]").addEventListener("submit", (e) => {
    e.preventDefault();
    const input = e.target.querySelector("input");
    if (!input.value.trim()) return;
    (state.notes[c.id] ??= []).unshift({ by: "Tasha Greene", at: AS_OF, text: input.value.trim() });
    save();
    close();
    openSheet(c.id);
  });
  const onKey = (e) => {
    if (e.key === "Escape") {
      close();
      removeEventListener("keydown", onKey);
    }
  };
  addEventListener("keydown", onKey);
  sheet.querySelector("[data-close]").focus();
}
