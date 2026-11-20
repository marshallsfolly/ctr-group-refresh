// The candidate's side: trade card, applications, interviews, paperwork, certs, alerts, security.

import { root, session, store, applications, toast, loadJobs, initials } from "./lib.js";
import { CERT, PLACE, placeName, payLabel, esc, AS_OF, daysBetween } from "./catalog.js";

const host = document.querySelector("[data-account]");
const who = session.get();

const STEPS = ["Applied", "Screening", "Interview", "Offer", "Start"];
const DOCS = [
  ["offer", "Offer letter", "Sign", "Review and e-sign your offer"],
  ["w4", "W-4", "Fill out", "Federal tax withholding"],
  ["i9", "I-9, Section 1", "Fill out", "Work eligibility. Bring your ID on day one."],
  ["deposit", "Direct deposit", "Add bank", "Paid weekly, every Friday"],
  ["safety", "Safety orientation", "Watch · 22 min", "CTR safety video and a short quiz"],
  ["ppe", "PPE sizes", "Choose", "Boots are yours. We issue the rest."],
  ["twic", "TWIC card photo", "Upload", "Front of the card, for gate access"],
];
const TABS = [["applications", "Applications"], ["interviews", "Interviews"], ["paperwork", "Paperwork"], ["certs", "Certs"], ["alerts", "Alerts"], ["security", "Security"]];

if (who) start();

async function start() {
  const [jobs, people] = await Promise.all([loadJobs(), fetch(`${root}data/candidates.json`).then((r) => r.json())]);
  const byId = new Map(jobs.map((j) => [j.id, j]));
  const me = people.candidates[0]; // the sample trade card
  const demo = who.demo !== false;
  const apps = applications.all().filter((a) => byId.has(a.job));
  if (demo && !apps.some((a) => a.job === me.job)) apps.push({ job: me.job, at: `${AS_OF}T14:10:00Z`, stage: 2, demo: true });
  const interview = demo ? { when: "Thu, Nov 20", time: "10:00 a.m. ET", start: "20261120T150000Z", end: "20261120T153000Z", with: byId.get(me.job)?.recruiter ?? "Tasha Greene", job: byId.get(me.job) } : null;
  const name = `${who.first} ${who.last}`.trim();
  const shareUrl = new URL(`${root}p/${me.slug}/`, location.href).href;

  host.className = "wrap dash";
  host.innerHTML = `<aside class="profile-card">
    <div class="panel">
      <div class="panel__head"><span>Trade card</span><span>${demo ? "Verified by CTR" : "Draft"}</span></div>
      <div style="display:flex;gap:14px;align-items:center"><span class="avatar avatar--lg">${initials(who.first, who.last)}</span><div><p class="h3" style="margin:0">${esc(name)}</p><p class="small" style="margin:4px 0 0">${demo ? `1st Class Pipe Welder · ${esc(placeName(PLACE[me.home]))}` : "Add your trade to get matched"}</p></div></div>
      <div style="margin-top:16px"><span class="label">Profile ${demo ? 85 : 30}% complete</span><ol class="track">${[0, 1, 2, 3, 4].map((i) => `<li class="${i < (demo ? 4 : 1) ? "on" : ""}"></li>`).join("")}</ol></div>
      <button class="btn btn--line btn--block" type="button" data-avail aria-pressed="true" style="margin-top:12px">● Available now</button>
      ${demo ? "" : `<button class="btn btn--block" type="button" data-sample style="margin-top:8px">Load the sample trade card</button>`}
    </div>
    <div class="panel">
      <div class="panel__head"><span>Share your trade card</span><span>Link only</span></div>
      <p class="small">A clean one-pager for foremen and hiring managers: certs, processes and yards. Not listed in search engines.</p>
      <input class="input" readonly value="${shareUrl}" aria-label="Trade card link" data-share-url>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px">
        <button class="btn btn--sm" type="button" data-copy>Copy link</button>
        <button class="btn btn--sm btn--line" type="button" data-share>Share</button>
      </div>
      <a class="btn btn--sm btn--line btn--block" style="margin-top:8px" href="https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}" target="_blank" rel="noopener">Post to LinkedIn</a>
      <a class="btn btn--sm btn--line btn--block" style="margin-top:8px" href="${root}p/${me.slug}/">Preview</a>
    </div>
    <div class="panel">
      <div class="panel__head"><span>Work history</span><span>From LinkedIn</span></div>
      <p class="small">LinkedIn sign-in shares your name and email, not your history. Upload the PDF from your LinkedIn profile (More → Save to PDF) and we fill it in.</p>
      <label class="btn btn--sm btn--line btn--block">Upload LinkedIn PDF<input type="file" accept="application/pdf" data-pdf hidden></label>
      <p class="fine" data-pdf-out style="margin-top:8px"></p>
    </div>
  </aside>
  <section aria-label="Your activity">
    <div class="tabs" role="tablist">${TABS.map(([k, label]) => `<a href="#${k}" role="tab" data-tab="${k}">${label}${k === "applications" ? `<span class="n">${apps.length}</span>` : ""}</a>`).join("")}</div>
    <div data-pane></div>
  </section>`;

  const pane = host.querySelector("[data-pane]");
  const views = {
    applications() {
      const done = Object.keys(store.get("ctr-docs", {})).length;
      const picks = demo ? jobs.filter((j) => j.trade === "welder" && /pipe|combo|tig/i.test(j.specialty) && j.region === "hampton-roads" && j.id !== me.job).slice(0, 3) : jobs.slice(0, 3);
      const next = `<div class="kpis" style="margin-bottom:8px">
        <div><b>${apps.length}</b><span>Applications</span></div>
        <div><b>${interview ? "Thu" : "None"}</b><span>${interview ? "Video interview, 10:00" : "Interviews"}</span></div>
        <div><b>${done}/${DOCS.length}</b><span>Paperwork done</span></div>
        <div><b>${demo ? me.certs.filter((c) => c.verified).length : 0}</b><span>Verified certs</span></div></div>
        ${interview ? `<div class="panel" style="margin:16px 0 8px"><div class="panel__head"><span>Up next</span><span>${interview.when}</span></div><div style="display:flex;gap:12px;align-items:center;justify-content:space-between;flex-wrap:wrap"><p style="margin:0"><strong>Video interview with ${esc(interview.with)}</strong><br><span class="small">${esc(interview.job.title)} · ${interview.time} · 30 min</span></p><a class="btn btn--hazard" href="${root}recruit/room/?as=candidate&c=${me.id}">Join call</a></div></div>` : ""}`;
      const recs = `<h3 class="label" style="margin:28px 0 8px">Picked for you</h3><ul class="mini-list">${picks.map((j) => `<li><a href="${root}jobs/${j.slug}/"><span>${esc(j.title)} <span class="small">· ${esc(placeName(PLACE[j.place]))}</span></span><span>${esc(payLabel(j))}</span></a></li>`).join("")}</ul>`;
      return next + this.list() + recs;
    },
    list() {
      if (!apps.length) return `<div class="empty"><p class="h3">No applications yet.</p><p><a class="btn btn--hazard" href="${root}">Find a job</a></p></div>`;
      return apps.map((a) => {
        const job = byId.get(a.job);
        const stage = a.stage ?? 0;
        return `<div class="app-row">
          <span class="mono">${job.id} · applied ${new Date(a.at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
          <h3><a href="${root}jobs/${job.slug}/">${esc(job.title)}</a></h3>
          <p class="small" style="margin:0">${esc(job.yard)} · ${esc(placeName(PLACE[job.place]))} · ${esc(payLabel(job))}</p>
          <ol class="track">${STEPS.map((s, i) => `<li class="${i < stage ? "on" : i === stage ? "now" : ""}" title="${s}"></li>`).join("")}</ol>
          <span class="label">${STEPS[stage]}${stage === 2 && interview ? ` · video interview ${interview.when}, ${interview.time}` : stage === 0 ? " · your recruiter will reach out within a day" : ""}</span>
        </div>`;
      }).join("");
    },
    interviews() {
      if (!interview) return `<div class="empty"><p class="h3">No interviews yet.</p><p class="muted">When a recruiter schedules one, it shows up here with a link to join from your phone.</p></div>`;
      return `<ul class="agenda"><li><time>10:00</time><div><strong>Video interview · ${esc(interview.job.title)}</strong><br><span class="small">${interview.when}, ${interview.time} · with ${esc(interview.with)}, CTR Group · 30 min</span></div>
        <span style="display:grid;gap:6px"><a class="btn btn--sm btn--hazard" href="${root}recruit/room/?as=candidate&c=${me.id}">Join</a><button class="btn btn--sm btn--line" type="button" data-ics>Add to calendar</button></span></li></ul>
        <p class="fine" style="margin-top:12px">Calls are end-to-end encrypted. Join from your phone; no app to install.</p>`;
    },
    paperwork() {
      const done = store.get("ctr-docs", {});
      const n = DOCS.filter(([k]) => done[k]).length;
      return `<p class="label">${n} of ${DOCS.length} done · start date Dec 1</p><ol class="track" style="grid-template-columns:repeat(${DOCS.length},1fr)">${DOCS.map(([k]) => `<li class="${done[k] ? "on" : ""}"></li>`).join("")}</ol>
        <ul class="checklist" style="margin-top:16px">${DOCS.map(([k, label, action, note]) => `<li><span class="box ${done[k] ? "yes" : ""}">${done[k] ? "✓" : ""}</span><span><strong>${label}</strong><br><span class="small">${note}</span></span>${done[k] ? `<span class="status status--done">Done</span>` : `<button class="btn btn--sm${k === "offer" ? " btn--hazard" : ""}" type="button" data-doc="${k}">${action}</button>`}</li>`).join("")}</ul>
        <p class="fine" style="margin-top:12px">Documents are encrypted and shared only with your recruiter and CTR payroll.</p>`;
    },
    certs() {
      if (!demo) return `<div class="empty"><p class="h3">No certs on file.</p><p class="muted">Add your TWIC, weld certs and OSHA cards and CTR verifies them, so you don't re-test for every job.</p></div>`;
      return `<ul class="certs">${me.certs.map((c) => {
        const days = c.expires ? daysBetween(AS_OF, c.expires) : null;
        const warn = days != null && days < 45;
        return `<li><span><strong>${esc(CERT[c.key].long)}</strong><br><small>${c.expires ? `${warn ? "Expires in " + days + " days" : "Expires " + c.expires}` : "No expiry"}</small></span>${warn ? `<span class="badge-warn">Renew soon</span>` : c.verified ? `<span class="badge-verified">✓ Verified</span>` : `<span class="badge-warn">Self-reported</span>`}</li>`;
      }).join("")}</ul><p style="margin-top:16px"><label class="btn btn--line">Upload a cert<input type="file" accept="image/*,application/pdf" capture="environment" hidden data-cert></label></p>`;
    },
    alerts() {
      const alerts = store.get("ctr-alerts", demo ? ["pipe welder near Norfolk, nights", "travel jobs with per diem over $40/hr"] : []);
      return `<ul class="mini-list">${alerts.map((a, i) => `<li><a href="${root}?q=${encodeURIComponent(a)}"><span>${esc(a)}</span><span class="label">Text + email</span></a></li>`).join("") || `<li class="small" style="padding:12px 0">No alerts yet.</li>`}</ul>
        <form data-alert-form style="display:flex;gap:8px;margin-top:16px"><input class="input" placeholder="e.g. shipfitter in Mobile with per diem" aria-label="New alert"><button class="btn" type="submit">Add</button></form>
        <p class="fine" style="margin-top:8px">New matches arrive by text the morning they're posted.</p>`;
    },
    security() {
      const keys = store.get("ctr-passkeys", []);
      return `<dl class="spec"><div><dt>Signed in with</dt><dd>${{ linkedin: "LinkedIn", passkey: "Passkey", email: "Email link" }[who.method] ?? "Demo"}</dd></div><div><dt>Email</dt><dd>${esc(who.email ?? "")}</dd></div></dl>
        <h3 class="label" style="margin:24px 0 8px">Passkeys</h3>
        <ul class="certs">${keys.map((k) => `<li><span><strong>${esc(k.device)}</strong><br><small>Added ${new Date(k.made).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</small></span><span class="badge-verified">Active</span></li>`).join("") || `<li><span class="small">No passkeys yet. Add one and skip email links next time.</span></li>`}</ul>
        <p style="display:flex;gap:8px;flex-wrap:wrap;margin-top:16px"><button class="btn btn--hazard" type="button" data-add-passkey>Add a passkey</button><button class="btn btn--line" type="button" data-signout>Sign out</button></p>`;
    },
  };

  function route() {
    const key = TABS.some(([k]) => `#${k}` === location.hash) ? location.hash.slice(1) : "applications";
    host.querySelectorAll("[data-tab]").forEach((t) => t.setAttribute("aria-selected", String(t.dataset.tab === key)));
    pane.innerHTML = views[key]();
    document.querySelector('.tabbar [data-tab="applied"]')?.setAttribute("aria-current", key === "applications" ? "page" : "false");
    document.querySelector('.tabbar [data-tab="account"]')?.setAttribute("aria-current", key === "applications" ? "false" : "page");
  }
  addEventListener("hashchange", route);
  route();

  host.addEventListener("click", async (e) => {
    const t = e.target;
    if (t.closest("[data-copy]")) {
      try {
        await navigator.clipboard.writeText(shareUrl);
        toast("Link copied");
      } catch {
        host.querySelector("[data-share-url]").select();
      }
    }
    if (t.closest("[data-share]")) {
      if (navigator.share) navigator.share({ title: `${name} · CTR trade card`, url: shareUrl }).catch(() => {});
      else toast("Copy the link to share it");
    }
    const avail = t.closest("[data-avail]");
    if (avail) {
      const on = avail.getAttribute("aria-pressed") !== "true";
      avail.setAttribute("aria-pressed", String(on));
      avail.textContent = on ? "● Available now" : "○ Not looking right now";
    }
    if (t.closest("[data-sample]")) {
      session.set({ ...who, demo: true });
      location.reload();
    }
    const doc = t.closest("[data-doc]")?.dataset.doc;
    if (doc) {
      const done = store.get("ctr-docs", {});
      done[doc] = new Date().toISOString();
      store.set("ctr-docs", done);
      toast(doc === "offer" ? "Offer signed" : "Saved");
      route();
    }
    if (t.closest("[data-ics]")) {
      const ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//CTR Group//Jobs//EN", "BEGIN:VEVENT", `UID:${me.id}-${interview.start}@ctr-jobs`, `DTSTAMP:${interview.start}`, `DTSTART:${interview.start}`, `DTEND:${interview.end}`, `SUMMARY:CTR video interview: ${interview.job.title}`, `DESCRIPTION:Join: ${new URL(`${root}recruit/room/?as=candidate&c=${me.id}`, location.href).href}`, "END:VEVENT", "END:VCALENDAR"].join("\r\n");
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
      a.download = "ctr-interview.ics";
      a.click();
    }
    if (t.closest("[data-add-passkey]")) {
      location.href = `${root}sign-in/`;
    }
    if (t.closest("[data-signout]")) {
      session.clear();
      location.href = root;
    }
  });
  host.addEventListener("change", (e) => {
    if (e.target.matches("[data-pdf]") && e.target.files[0]) {
      host.querySelector("[data-pdf-out]").textContent = `Read ${e.target.files[0].name}: 4 roles at 4 yards, 2015 to now. Added to your history.`;
      toast("Work history imported");
    }
    if (e.target.matches("[data-cert]") && e.target.files[0]) toast(`${e.target.files[0].name} sent to CTR for verification`);
  });
  host.addEventListener("submit", (e) => {
    if (!e.target.matches("[data-alert-form]")) return;
    e.preventDefault();
    const text = e.target.querySelector("input").value.trim();
    if (!text) return;
    store.set("ctr-alerts", [text, ...store.get("ctr-alerts", demo ? ["pipe welder near Norfolk, nights", "travel jobs with per diem over $40/hr"] : [])]);
    toast("Alert saved");
    route();
  });
}
