// CTR Jobs service worker. The generator fills in the version and the precache list.
// Shell and search data are cached up front so search works with no signal; pages are
// network-first with a cached copy behind them; saved jobs are cached on request.

const VERSION = "bd802ac8fa";
const SHELL = `ctr-shell-${VERSION}`;
const PAGES = "ctr-pages";
const PRECACHE = [
  "./",
  "jobs/",
  "saved/",
  "sign-in/",
  "account/",
  "offline/",
  "manifest.webmanifest",
  "data/jobs.json",
  "assets/css/site.css?v=bd802ac8fa",
  "assets/js/app.js?v=bd802ac8fa",
  "assets/js/search.js?v=bd802ac8fa",
  "assets/js/saved.js?v=bd802ac8fa",
  "assets/js/account.js?v=bd802ac8fa",
  "assets/js/auth.js?v=bd802ac8fa",
  "assets/css/site.css",
  "assets/fonts/big-shoulders-stencil.woff2",
  "assets/fonts/inter-tight.woff2",
  "assets/fonts/martian-mono.woff2",
  "assets/icons/icon-192.png",
  "assets/icons/icon.svg",
  "assets/js/account.js",
  "assets/js/app.js",
  "assets/js/auth.js",
  "assets/js/catalog.js",
  "assets/js/employers.js",
  "assets/js/glyphs.js",
  "assets/js/jevbar/commands.js",
  "assets/js/jevbar/complete.js",
  "assets/js/jevbar/compose.js",
  "assets/js/jevbar/extract.js",
  "assets/js/jevbar/history.js",
  "assets/js/jevbar/index.js",
  "assets/js/jevbar/intent.js",
  "assets/js/jevbar/numbers.js",
  "assets/js/jevbar/suggest.js",
  "assets/js/lib.js",
  "assets/js/query.js",
  "assets/js/recruit.js",
  "assets/js/render.js",
  "assets/js/room.js",
  "assets/js/saved.js",
  "assets/js/search.js"
];
const PAGE_LIMIT = 150;

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(SHELL).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key.startsWith("ctr-shell-") && key !== SHELL).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

async function trim(cache) {
  const keys = await cache.keys();
  for (const request of keys.slice(0, Math.max(0, keys.length - PAGE_LIMIT))) await cache.delete(request);
}

function timeout(ms) {
  return new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), ms));
}

async function page(request) {
  const cache = await caches.open(PAGES);
  try {
    const response = await Promise.race([fetch(request), timeout(4000)]);
    if (response.ok) {
      cache.put(request, response.clone()).then(() => trim(cache));
      return response;
    }
    return response;
  } catch {
    return (await cache.match(request, { ignoreSearch: true }))
      ?? (await caches.match(request, { ignoreSearch: true }))
      ?? (await caches.match(new URL("offline/", self.registration.scope).href))
      ?? new Response("Offline", { status: 503, headers: { "content-type": "text/plain" } });
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(SHELL);
  const cached = await cache.match(request);
  const fresh = fetch(request).then((response) => {
    if (response.ok) cache.put(request, response.clone());
    return response;
  }).catch(() => null);
  return cached ?? (await fresh) ?? new Response("[]", { headers: { "content-type": "application/json" } });
}

async function asset(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) (await caches.open(SHELL)).put(request, response.clone());
    return response;
  } catch {
    // An older page asks for an older ?v= asset: the current one will do.
    return (await caches.match(request, { ignoreSearch: true })) ?? new Response("", { status: 504 });
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || !url.href.startsWith(self.registration.scope)) return;
  if (request.mode === "navigate") return event.respondWith(page(request));
  if (url.pathname.endsWith("/data/jobs.json") || url.pathname.endsWith("/data/candidates.json")) return event.respondWith(staleWhileRevalidate(request));
  event.respondWith(asset(request));
});

// Saved jobs: the page asks for them to be kept for offline reading.
self.addEventListener("message", (event) => {
  const { type, urls } = event.data ?? {};
  if (type !== "keep" || !Array.isArray(urls)) return;
  event.waitUntil(caches.open(PAGES).then((cache) => Promise.all(urls.map((u) => fetch(u).then((r) => (r.ok ? cache.put(u, r) : null)).catch(() => null)))));
});
