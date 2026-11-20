// Runs on every page: header, menu, saved jobs, install, offline, the draft-mark ruler.

import { root, session, saved, toast, keepOffline, initials, reducedMotion } from "./lib.js";

// ---------- who's signed in ----------

const who = session.get();
const link = document.querySelector("[data-session-link]");
if (who && link) {
  link.outerHTML = `<a class="who" href="${root}account/"><span class="avatar">${initials(who.first, who.last)}</span><span class="hide-sm">${who.first}</span></a>`;
}
const tab = document.querySelector('.tabbar [data-tab="account"] span');
if (tab && !who) tab.textContent = "Sign in";

// ---------- menu ----------

const menuBtn = document.querySelector(".menu-btn");
const drawer = document.getElementById("drawer");
menuBtn?.addEventListener("click", () => {
  const open = menuBtn.getAttribute("aria-expanded") !== "true";
  menuBtn.setAttribute("aria-expanded", String(open));
  drawer.hidden = !open;
  document.body.style.overflow = open ? "hidden" : "";
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && menuBtn?.getAttribute("aria-expanded") === "true") menuBtn.click();
});

// ---------- saved jobs ----------

export function paintSaved(scope = document) {
  const ids = new Set(saved.ids());
  for (const button of scope.querySelectorAll("[data-save]")) button.setAttribute("aria-pressed", String(ids.has(button.dataset.save)));
  const tabSaved = document.querySelector('.tabbar [data-tab="saved"]');
  if (tabSaved) {
    tabSaved.querySelector(".badge")?.remove();
    if (ids.size) tabSaved.insertAdjacentHTML("beforeend", `<span class="badge">${ids.size}</span>`);
  }
}
paintSaved();
document.addEventListener("click", (e) => {
  const button = e.target.closest("[data-save]");
  if (!button) return;
  e.preventDefault();
  const on = saved.toggle(button.dataset.save);
  paintSaved();
  toast(on ? "Saved. Works offline too." : "Removed from saved");
  if (on) {
    const link = button.closest(".job, .plate, main")?.querySelector('a[href*="jobs/"]');
    if (link) keepOffline([link.href]);
    else keepOffline([location.href]);
  }
});
addEventListener("ctr:results", () => paintSaved());

// ---------- service worker and install ----------

if ("serviceWorker" in navigator && location.protocol !== "file:") {
  addEventListener("load", () => navigator.serviceWorker.register(`${root}sw.js`, { scope: root }).catch(() => {}));
}

let deferred = null;
const standalone = matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream;
const installButtons = document.querySelectorAll("[data-install]");
addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferred = e;
  installButtons.forEach((b) => b.classList.add("is-ready"));
});
if (ios && !standalone) installButtons.forEach((b) => b.classList.add("is-ready"));
installButtons.forEach((b) =>
  b.addEventListener("click", async () => {
    if (deferred) {
      deferred.prompt();
      await deferred.userChoice;
      deferred = null;
      installButtons.forEach((x) => x.classList.remove("is-ready"));
    } else if (ios) {
      toast("Tap Share, then Add to Home Screen");
    }
  }),
);
addEventListener("appinstalled", () => toast("Installed. Find CTR Jobs on your home screen."));

// ---------- offline ----------

function onlineState() {
  let flag = document.querySelector(".offline-flag");
  if (navigator.onLine) return flag?.remove();
  if (!flag) {
    flag = document.createElement("div");
    flag.className = "offline-flag";
    flag.textContent = "Offline · search and saved jobs still work";
    document.body.append(flag);
  }
}
addEventListener("online", onlineState);
addEventListener("offline", onlineState);
onlineState();

// ---------- draft marks: the scroll ruler, painted like a hull's draft numbers ----------

const draft = document.querySelector(".draft");
if (draft && matchMedia("(min-width: 1280px)").matches) {
  const ticks = [];
  for (let i = 0; i <= 50; i++) {
    const top = (i / 50) * 100;
    const major = i % 5 === 0;
    ticks.push(`<span class="draft__tick${major ? " draft__tick--major" : ""}" style="top:${top}%"></span>`);
    if (major && i % 10 === 0) ticks.push(`<span class="draft__num" style="top:${top}%">${i / 5 * 2}</span>`);
  }
  draft.innerHTML = `${ticks.join("")}<span class="draft__line"></span>`;
  const line = draft.querySelector(".draft__line");
  let raf = 0;
  const paint = () => {
    raf = 0;
    const max = document.documentElement.scrollHeight - innerHeight;
    const p = max > 0 ? Math.min(1, scrollY / max) : 0;
    draft.style.setProperty("--p", p.toFixed(4));
    line.dataset.ft = `${(p * 20).toFixed(1)} FT`;
  };
  addEventListener("scroll", () => (raf ||= requestAnimationFrame(paint)), { passive: true });
  paint();
}

// Rows animate in with a slight stagger.
export function stagger(list) {
  if (reducedMotion()) return;
  [...list.children].slice(0, 12).forEach((li, i) => li.style.setProperty("--i", i));
}
document.querySelectorAll(".jobs").forEach(stagger);
