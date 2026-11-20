// Saved jobs, kept on this device and readable offline.

import { jobRow } from "./render.js";
import { root, saved, loadJobs, keepOffline } from "./lib.js";

const list = document.querySelector("[data-saved]");
const empty = document.querySelector("[data-saved-empty]");
const count = document.querySelector("[data-saved-count]");

async function paint() {
  const ids = saved.ids();
  count.textContent = `${ids.length} saved`;
  empty.hidden = ids.length > 0;
  if (!ids.length) return (list.innerHTML = "");
  const jobs = await loadJobs();
  const byId = new Map(jobs.map((j) => [j.id, j]));
  const rows = ids.map((id) => byId.get(id)).filter(Boolean);
  list.innerHTML = rows.map((job, i) => jobRow(job, { root, index: i, saved: true })).join("");
  keepOffline(rows.map((job) => `${root}jobs/${job.slug}/`));
}

paint();
addEventListener("click", (e) => {
  if (e.target.closest("[data-save]")) setTimeout(paint, 0);
});
