// Shared helpers with no side effects. Every page script imports this one file.

export const root = document.documentElement.dataset.root || "./";

/** localStorage that never throws: private windows and blocked storage just mean nothing is kept. */
export const store = {
  get(key, fallback = null) {
    try {
      const raw = localStorage.getItem(key);
      return raw == null ? fallback : JSON.parse(raw);
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // A convenience only.
    }
  },
  remove(key) {
    try {
      localStorage.removeItem(key);
    } catch {
      // Nothing to remove.
    }
  },
};

export const session = {
  get: () => store.get("ctr-session"),
  set: (value) => store.set("ctr-session", value),
  clear: () => store.remove("ctr-session"),
};

export const saved = {
  ids: () => store.get("ctr-saved", []),
  has: (id) => saved.ids().includes(id),
  toggle(id) {
    const ids = saved.ids();
    const on = !ids.includes(id);
    store.set("ctr-saved", on ? [id, ...ids] : ids.filter((x) => x !== id));
    return on;
  },
};

export const applications = {
  all: () => store.get("ctr-apps", []),
  add(job) {
    const list = applications.all().filter((a) => a.job !== job);
    list.unshift({ job, at: new Date().toISOString(), stage: 0 });
    store.set("ctr-apps", list);
  },
};

let toastTimer = null;
export function toast(message) {
  let el = document.querySelector(".toast");
  if (!el) {
    el = document.createElement("div");
    el.className = "toast";
    el.setAttribute("role", "status");
    document.body.append(el);
  }
  el.textContent = message;
  el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (el.hidden = true), 2600);
}

let jobsPromise = null;
/** The search index of every job, loaded once. */
export function loadJobs() {
  jobsPromise ??= fetch(`${root}data/jobs.json`).then((r) => r.json());
  return jobsPromise;
}

/** Ask the service worker to keep pages for offline reading. */
export function keepOffline(urls) {
  navigator.serviceWorker?.controller?.postMessage({ type: "keep", urls: urls.map((u) => new URL(u, location.href).href) });
}

export function initials(first = "", last = "") {
  return `${first[0] ?? ""}${last[0] ?? ""}`.toUpperCase() || "?";
}

export function debounce(fn, ms) {
  let t = null;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

export const reducedMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
