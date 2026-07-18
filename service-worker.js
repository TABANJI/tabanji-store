"use strict";
const VERSION = "v4";
const STATIC_CACHE = `tabanji-static-${VERSION}`;
const PAGES_CACHE = `tabanji-pages-${VERSION}`;
const RUNTIME_CACHE = `tabanji-runtime-${VERSION}`;
const CACHE_NAMES = [STATIC_CACHE, PAGES_CACHE, RUNTIME_CACHE];
const PAGE_LIMIT = 30;
const RUNTIME_LIMIT = 80;
const CRITICAL = ["./index.html", "./offline.html", "./css/info.css", "./css/offline.css", "./css/pwa.css", "./css/mobile-header.css", "./css/mobile-navigation.css", "./css/mobile-drawer.css", "./css/design-system.css", "./css/components.css", "./css/utilities.css", "./js/store.js", "./js/catalog-repository.js", "./js/pwa.js", "./js/mobile-navigation.js", "./manifest.webmanifest", "./icons/tabanji-192.png", "./icons/tabanji-512.png", "./icons/tabanji-maskable-512.png", "./icons/apple-touch-icon-180.png"];
const OPTIONAL = ["./css/index.css", "./css/product-premium.css", "./css/cart-premium.css", "./css/checkout-premium.css", "./js/index.js", "./data/products.js", "./data/categories.js", "./icons/tabanji-192.svg", "./icons/tabanji-512.svg", "./icons/tabanji-maskable-512.svg", "./images/og-tabanji-placeholder.jpg"];
const PRIVATE_PAGES = ["/admin.html", "/checkout.html", "/account.html", "/login.html"];
const SENSITIVE_PARAMS = ["token", "auth", "session", "email", "password", "code"];

self.addEventListener("install", event => {
  event.waitUntil((async () => {
    const cache = await caches.open(STATIC_CACHE);
    await cache.addAll(CRITICAL);
    await Promise.allSettled(OPTIONAL.map(asset => cache.add(asset)));
  })());
});

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith("tabanji-") && !CACHE_NAMES.includes(key)).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener("message", event => { if (event.data?.type === "SKIP_WAITING") self.skipWaiting(); });

const usable = request => request.method === "GET" && request.url.startsWith(self.location.origin) && ["http:", "https:"].includes(new URL(request.url).protocol);
const cacheableResponse = response => response?.ok && response.type === "basic" && !response.redirected;
const privateNavigation = url => PRIVATE_PAGES.some(path => url.pathname.endsWith(path)) || SENSITIVE_PARAMS.some(parameter => url.searchParams.has(parameter));
async function trim(cacheName, limit) {
  const cache = await caches.open(cacheName), keys = await cache.keys();
  if (keys.length > limit) await Promise.all(keys.slice(0, keys.length - limit).map(key => cache.delete(key)));
}
async function networkFirst(request) {
  const url = new URL(request.url), isPrivate = privateNavigation(url), cache = await caches.open(PAGES_CACHE);
  try {
    const response = await fetch(request);
    if (!isPrivate && cacheableResponse(response)) {
      await cache.put(request, response.clone());
      await trim(PAGES_CACHE, PAGE_LIMIT);
    }
    return response;
  } catch {
    if (!isPrivate) {
      const cached = await cache.match(request, { ignoreSearch: true }) || await caches.match(request, { ignoreSearch: true });
      if (cached) return cached;
    }
    return caches.match("./offline.html");
  }
}
async function staleWhileRevalidate(request, cacheName, limit) {
  const cache = await caches.open(cacheName), cached = await cache.match(request);
  const network = fetch(request).then(async response => {
    if (cacheableResponse(response)) {
      await cache.put(request, response.clone());
      await trim(cacheName, limit);
    }
    return response;
  }).catch(() => null);
  return cached || await network || Response.error();
}
self.addEventListener("fetch", event => {
  const request = event.request;
  if (!usable(request)) return;
  const url = new URL(request.url);
  if (url.pathname.endsWith("/admin.html")) return;
  if (request.mode === "navigate") { event.respondWith(networkFirst(request)); return; }
  if (url.pathname.includes("/data/") && url.pathname.endsWith(".js")) { event.respondWith(staleWhileRevalidate(request, RUNTIME_CACHE, RUNTIME_LIMIT)); return; }
  if (["style", "script", "font", "image"].includes(request.destination)) event.respondWith(staleWhileRevalidate(request, RUNTIME_CACHE, RUNTIME_LIMIT));
});
