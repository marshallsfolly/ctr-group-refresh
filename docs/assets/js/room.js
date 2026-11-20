// Video interview room. Your camera is real (asked for only when you press the button); the other
// side is simulated, since a mockup has no call server. Nothing is recorded or sent anywhere.

import { root, toast, initials, store } from "./lib.js";
import { TRADE, LEVEL, CERT, esc } from "./catalog.js";

const params = new URLSearchParams(location.search);
const asCandidate = params.get("as") === "candidate";
const id = params.get("c") ?? "C-1001";
const remoteName = document.querySelector("[data-remote-name]");
const remoteInitials = document.querySelector("[data-remote-initials]");
const wave = document.querySelector("[data-wave]");
const video = document.querySelector("[data-video]");
const camOn = document.querySelector("[data-cam-on]");
const pane = document.querySelector("[data-pane]");
const clock = document.querySelector("[data-clock]");
const leave = asCandidate ? `${root}account/#interviews` : `${root}recruit/`;
document.querySelector("[data-leave]").href = leave;
document.querySelector("[data-leave]").textContent = asCandidate ? "← Profile" : "← Console";

let stream = null;
let person = null;
let job = null;
const chat = [];

fetch(`${root}data/candidates.json`).then((r) => r.json()).then((data) => {
  person = data.candidates.find((c) => c.id === id) ?? data.candidates[0];
  job = data.jobs[person.job];
  const other = asCandidate ? { first: job.recruiter.split(" ")[0], last: job.recruiter.split(" ")[1], label: `${job.recruiter} · CTR Group` } : { first: person.first, last: person.last, label: `${person.first} ${person.last} · ${TRADE[person.trade].name}` };
  remoteInitials.textContent = initials(other.first, other.last);
  chat.push({ from: "system", text: `Call with ${other.label}. Encrypted end to end; only the two of you have the keys.` });
  setTimeout(() => {
    remoteName.textContent = other.label;
    wave.hidden = false;
    chat.push({ from: other.first, text: asCandidate ? "Morning! Thanks for making time. Can you hear me okay?" : "Hey, can you hear me alright? I'm on my break at the yard." });
    if (currentTab === "chat") paint("chat");
  }, 1600);
  paint("notes");
});

// ---------- clock ----------
const t0 = Date.now();
setInterval(() => {
  const s = Math.floor((Date.now() - t0) / 1000);
  clock.textContent = `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}, 1000);

// ---------- camera, mic, screen ----------
async function startCamera() {
  if (!navigator.mediaDevices?.getUserMedia) return toast("This browser can't use the camera here");
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: { ideal: 1280 } }, audio: true });
    video.srcObject = stream;
    video.hidden = false;
    camOn.hidden = true;
  } catch (error) {
    toast(error.name === "NotAllowedError" ? "Camera blocked. Allow it in the address bar." : "No camera found");
  }
}
camOn.addEventListener("click", startCamera);

const toggleTrack = (kind, button, offLabel, onLabel) => {
  const track = stream?.getTracks().find((t) => t.kind === kind);
  if (!track) return kind === "video" ? startCamera() : toast("Turn on the camera first");
  track.enabled = !track.enabled;
  button.setAttribute("aria-pressed", String(!track.enabled));
  button.setAttribute("aria-label", track.enabled ? offLabel : onLabel);
};
const mic = document.querySelector("[data-mic]");
const cam = document.querySelector("[data-cam]");
mic.addEventListener("click", () => toggleTrack("audio", mic, "Mute microphone", "Unmute microphone"));
cam.addEventListener("click", () => toggleTrack("video", cam, "Turn camera off", "Turn camera on"));

const share = document.querySelector("[data-share]");
if (!navigator.mediaDevices?.getDisplayMedia) share.hidden = true;
share.addEventListener("click", async () => {
  try {
    const screen = await navigator.mediaDevices.getDisplayMedia({ video: true });
    toast("Sharing your screen");
    screen.getVideoTracks()[0].addEventListener("ended", () => toast("Stopped sharing"));
  } catch {
    // Cancelled.
  }
});

document.querySelector("[data-end]").addEventListener("click", () => {
  stream?.getTracks().forEach((t) => t.stop());
  if (!asCandidate) {
    const s = store.get("ctr-recruit", { moves: {}, notes: {}, events: [], docs: {}, verified: {} });
    (s.notes[id] ??= []).unshift({ by: "Tasha Greene", at: new Date().toISOString().slice(0, 10), text: `Video interview done (${clock.textContent}). Scorecard saved.` });
    store.set("ctr-recruit", s);
  }
  location.href = leave;
});
addEventListener("pagehide", () => stream?.getTracks().forEach((t) => t.stop()));

// ---------- side panel ----------
let currentTab = "notes";
const SCORES = ["Trade knowledge", "Safety mindset", "Certs check out", "Availability", "Communication"];
function paint(tab) {
  currentTab = tab;
  document.querySelectorAll("[data-tab]").forEach((b) => b.setAttribute("aria-selected", String(b.dataset.tab === tab)));
  if (!person) return;
  if (tab === "notes") {
    pane.innerHTML = asCandidate
      ? `<p class="label" style="color:var(--orange)">Your interview</p><p>${esc(job.title)}<br><span class="small" style="color:var(--steel)">${esc(job.yard)}</span></p><p class="small" style="color:var(--steel)">Have your TWIC card and cert cards handy. Your recruiter may ask to see them on camera.</p>`
      : `<p class="label" style="color:var(--orange)">Scorecard · ${esc(person.first)} ${esc(person.last)}</p>
        <p class="small" style="color:var(--steel);margin-bottom:6px">${esc(LEVEL[person.level].name)} ${esc(TRADE[person.trade].name)} · applied for ${esc(job.title)}</p>
        <ul>${SCORES.map((s, i) => `<li><span>${s}</span><span role="radiogroup" aria-label="${s}" style="display:flex;gap:4px">${[1, 2, 3, 4, 5].map((n) => `<button type="button" class="ctrl" style="width:28px;height:28px;font:600 11px var(--mono)" aria-pressed="false" data-score="${i}" data-n="${n}">${n}</button>`).join("")}</span></li>`).join("")}</ul>
        <textarea class="textarea" style="margin-top:12px;background:#1d2326;color:var(--haze-hi);border-color:#3a4246" placeholder="Notes for the hiring manager"></textarea>`;
  } else if (tab === "docs") {
    const docs = person.certs.map((c) => [`${CERT[c.key].name}.pdf`, c.verified ? "Verified" : "Unverified"]);
    pane.innerHTML = `<p class="label" style="color:var(--orange)">Shared in this call</p><ul>${[["Resume.pdf", "From LinkedIn"], ...docs].map(([n, s]) => `<li><span>${esc(n)}<br><span class="fine" style="color:var(--steel)">${s}</span></span><button class="btn btn--sm btn--line" type="button" style="color:var(--haze);border-color:#3a4246" data-view>View</button></li>`).join("")}</ul><p class="fine" style="color:var(--steel);margin-top:10px">Files are encrypted in transit and at rest, watermarked with the viewer's name, and the link dies when the call ends.</p>`;
  } else {
    pane.innerHTML = `<ul data-msgs>${chat.map((m) => `<li style="display:block"><span class="fine" style="color:${m.from === "system" ? "var(--orange)" : "var(--steel)"}">${esc(m.from === "system" ? "Secure room" : m.from)}</span><br>${esc(m.text)}</li>`).join("")}</ul><form data-chat style="display:flex;gap:6px;margin-top:10px"><input class="input" style="background:#1d2326;color:var(--haze-hi);border-color:#3a4246" placeholder="Message" aria-label="Message"><button class="btn btn--sm btn--orange" type="submit">Send</button></form>`;
  }
}
document.querySelector(".room__side .tabs").addEventListener("click", (e) => {
  const b = e.target.closest("[data-tab]");
  if (b) paint(b.dataset.tab);
});
pane.addEventListener("click", (e) => {
  const s = e.target.closest("[data-score]");
  if (s) pane.querySelectorAll(`[data-score="${s.dataset.score}"]`).forEach((b) => b.setAttribute("aria-pressed", String(Number(b.dataset.n) <= Number(s.dataset.n))));
  if (e.target.closest("[data-view]")) toast("Opens in the secure viewer");
});
pane.addEventListener("submit", (e) => {
  e.preventDefault();
  const input = e.target.querySelector("input");
  if (!input.value.trim()) return;
  chat.push({ from: "You", text: input.value.trim() });
  paint("chat");
});
