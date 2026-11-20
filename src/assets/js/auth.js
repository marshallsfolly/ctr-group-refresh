// Sign in or sign up: LinkedIn (mocked), passkeys (real WebAuthn, no server yet) and email links (mocked).

import { root, session, store, applications, toast, loadJobs } from "./lib.js";
import { PLACE, placeName, esc } from "./catalog.js";

const panel = document.querySelector("[data-auth]");
const steps = panel.querySelectorAll("[data-step]");
const msg = panel.querySelector("[data-msg]");
const applyId = new URLSearchParams(location.search).get("apply");
let pendingConditional = null;

function show(name) {
  steps.forEach((s) => (s.hidden = s.dataset.step !== name));
  if (name !== "choose") pendingConditional?.abort();
}

const DEMO = { first: "Andre", last: "Whitfield", email: "andre.whitfield@example.com", headline: "1st Class Pipe Welder", demo: true };

function signIn(data) {
  session.set({ ...DEMO, ...data, since: new Date().toISOString() });
  confirmStep();
}

function confirmStep() {
  const who = session.get();
  if (!who) return show("choose");
  panel.querySelector("[data-who]").textContent = `${who.first} ${who.last}`.trim();
  panel.querySelector("[data-confirm-apply]").hidden = !applyId;
  show("confirm");
  if (!applyId) setTimeout(() => (location.href = `${root}account/`), 700);
}

if (applyId) {
  loadJobs().then((jobs) => {
    const job = jobs.find((j) => j.id === applyId);
    if (!job) return;
    const banner = document.querySelector("[data-apply-banner]");
    banner.hidden = false;
    banner.querySelector("[data-apply-id]").textContent = job.id;
    banner.querySelector("[data-apply-title]").innerHTML = `<strong>${esc(job.title)}</strong><br><span class="small">${esc(job.yard)} · ${esc(placeName(PLACE[job.place]))}</span>`;
  });
}

// ---------- passkeys ----------

const bytes = (n) => crypto.getRandomValues(new Uint8Array(n));
const supported = () => typeof window.PublicKeyCredential === "function" && window.isSecureContext;

async function createPasskey({ first, last, email }) {
  if (!supported()) return (msg.textContent = "This browser can't make passkeys here. Use email instead.");
  try {
    const credential = await navigator.credentials.create({
      publicKey: {
        challenge: bytes(32),
        rp: { name: "CTR Group" },
        user: { id: bytes(16), name: email, displayName: `${first} ${last}` },
        pubKeyCredParams: [{ type: "public-key", alg: -7 }, { type: "public-key", alg: -257 }],
        authenticatorSelection: { residentKey: "preferred", userVerification: "preferred" },
        attestation: "none",
        timeout: 60000,
      },
    });
    const keys = store.get("ctr-passkeys", []);
    keys.unshift({ id: credential.id, first, last, email, made: new Date().toISOString(), device: navigator.userAgentData?.platform ?? (/iphone|ipad/i.test(navigator.userAgent) ? "iPhone" : /android/i.test(navigator.userAgent) ? "Android" : "This device") });
    store.set("ctr-passkeys", keys);
    toast("Passkey created");
    signIn({ first, last, email, method: "passkey", headline: "" , demo: false });
  } catch (error) {
    msg.textContent = error.name === "NotAllowedError" ? "Passkey cancelled. Try again or use email." : `Couldn't create a passkey (${error.name}).`;
  }
}

async function usePasskey(mediation) {
  if (!supported()) return (msg.textContent = "This browser can't use passkeys here. Use email instead.");
  try {
    const controller = new AbortController();
    if (mediation === "conditional") pendingConditional = controller;
    const assertion = await navigator.credentials.get({
      publicKey: { challenge: bytes(32), userVerification: "preferred", timeout: 60000 },
      ...(mediation ? { mediation } : {}),
      signal: controller.signal,
    });
    const known = store.get("ctr-passkeys", []).find((k) => k.id === assertion.id);
    signIn(known ? { first: known.first, last: known.last, email: known.email, method: "passkey", demo: false, headline: "" } : { method: "passkey" });
  } catch (error) {
    if (error.name === "AbortError") return;
    msg.textContent = error.name === "NotAllowedError" ? "No passkey picked. New here? Create one below." : `Passkey sign-in failed (${error.name}).`;
  }
}

// Offer saved passkeys right in the email field's autofill, where the browser supports it.
if (supported() && PublicKeyCredential.isConditionalMediationAvailable) {
  PublicKeyCredential.isConditionalMediationAvailable().then((ok) => ok && !session.get() && usePasskey("conditional")).catch(() => {});
}

// ---------- the buttons ----------

panel.addEventListener("click", (e) => {
  const method = e.target.closest("[data-method]")?.dataset.method;
  if (method === "linkedin") show("linkedin");
  if (method === "passkey") usePasskey();
  if (method === "new-passkey") {
    show("new-passkey");
    panel.querySelector("#first").focus();
  }
  if (e.target.closest("[data-back]")) show("choose");
  const cont = e.target.closest("[data-continue]")?.dataset.continue;
  if (cont === "linkedin") signIn({ method: "linkedin" });
  if (cont === "email") {
    const email = panel.querySelector("[data-sent-to]").textContent;
    const local = email.split("@")[0].split(/[._-]/);
    signIn({ first: cap(local[0] ?? "Friend"), last: cap(local[1] ?? ""), email, method: "email", demo: false, headline: "" });
  }
  if (e.target.closest("[data-send-app]")) {
    applications.add(applyId);
    toast("Application sent");
    setTimeout(() => (location.href = `${root}account/#applications`), 500);
  }
  if (e.target.closest("[data-signout]")) {
    session.clear();
    toast("Signed out");
    show("choose");
  }
});
const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : "");

panel.querySelector("[data-email-form]").addEventListener("submit", (e) => {
  e.preventDefault();
  const email = panel.querySelector("#email").value.trim();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return (msg.textContent = "That email doesn't look right.");
  panel.querySelector("[data-sent-to]").textContent = email;
  show("sent");
});
panel.querySelector("[data-passkey-form]").addEventListener("submit", (e) => {
  e.preventDefault();
  const first = panel.querySelector("#first").value.trim();
  const last = panel.querySelector("#last").value.trim();
  const email = panel.querySelector("#pk-email").value.trim();
  if (!first || !email) return (msg.textContent = "Add your name and email first.");
  createPasskey({ first, last, email });
});

if (session.get()) confirmStep();
