// Request talent: the mock keeps the request in this browser and shows what a confirmation looks like.

import { store, toast } from "./lib.js";
import { esc } from "./catalog.js";

const form = document.querySelector("[data-request]");
form?.addEventListener("submit", (e) => {
  e.preventDefault();
  if (!form.reportValidity()) return;
  const value = (id) => esc(form.querySelector(`#${id}`).value);
  const list = store.get("ctr-requests", []);
  const id = `R-${(4100 + list.length + 1).toString()}`;
  list.unshift({ id, company: value("co"), trade: value("tr"), headcount: value("hc"), type: value("ht"), shift: value("sh"), location: value("loc"), start: value("st"), at: new Date().toISOString() });
  store.set("ctr-requests", list);
  form.innerHTML = `<div class="panel__head"><span>Request received</span><span>${id}</span></div>
    <p class="h3" style="margin-bottom:10px">${value("hc")} × ${value("tr")} for ${value("co") || "your yard"}.</p>
    <p class="small">A recruiter calls you back today with screened candidates and a rate sheet. Weld tests and cert checks are done before anyone reaches your gate.</p>
    <dl class="spec" style="margin-top:16px"><div><dt>Hire type</dt><dd>${value("ht")}</dd></div><div><dt>Shift</dt><dd>${value("sh")}</dd></div><div><dt>Start</dt><dd>${value("st")}</dd></div></dl>`;
  toast("Request sent");
});
