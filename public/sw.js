const CACHE_NAME = "softweek-static-v4";
const APP_SHELL = [
  "/offline.html",
  "/icon-192.png",
  "/icon-512.png",
  "/maskable-icon-192.png",
  "/maskable-icon-512.png",
];

const PRIVATE_PREFIXES = ["/dashboard", "/planner", "/guest", "/login", "/auth"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith("softweek-") && key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

function isPrivateNavigation(url) {
  return PRIVATE_PREFIXES.some(
    (prefix) => url.pathname === prefix || url.pathname.startsWith(`${prefix}/`),
  );
}

function isNextStaticAsset(url) {
  return url.pathname.startsWith("/_next/static/");
}

function isCacheableMedia(url) {
  return /\.(?:png|jpg|jpeg|svg|webp|ico|woff2?)$/i.test(url.pathname);
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      await cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) return cached;
    throw error;
  }
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith("/api/")) return;

  // JavaScript and CSS are network-first so an old client bundle can never be
  // paired with newer server-rendered HTML after a deployment.
  if (isNextStaticAsset(url)) {
    event.respondWith(networkFirst(request));
    return;
  }

  if (isCacheableMedia(url)) {
    event.respondWith(caches.match(request).then((cached) => cached || networkFirst(request)));
    return;
  }

  if (request.mode !== "navigate") return;

  // Never cache rendered HTML, especially authenticated family screens.
  if (isPrivateNavigation(url)) {
    event.respondWith(fetch(request).catch(() => caches.match("/offline.html")));
    return;
  }

  event.respondWith(fetch(request).catch(() => caches.match("/offline.html")));
});
