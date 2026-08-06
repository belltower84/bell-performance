"use strict";

const CACHE_NAME = "bell-performance-13-22-8";
const CORE_FILES = [
  "./",
  "./index.html",
  "./manifest.json",
  "./version.json",
  "./css/app.css?v=13710",
  "./js/storage.js?v=13841",
  "./js/app.js?v=132280"
];

async function safePrecache() {
  const cache = await caches.open(CACHE_NAME);
  await Promise.allSettled(CORE_FILES.map(async url => {
    try {
      const response = await fetch(url, { cache: "reload" });
      if (response && response.ok) await cache.put(url, response.clone());
    } catch (_) {
      // A single missing or temporarily unavailable file must not prevent
      // the new service worker from installing on GitHub Pages.
    }
  }));
}

async function networkFirst(request, fallbackUrl = null) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const response = await fetch(request, { cache: "no-store" });
    if (response && response.ok) await cache.put(request, response.clone());
    return response;
  } catch (error) {
    const cached = await cache.match(request, { ignoreSearch: false });
    if (cached) return cached;
    if (fallbackUrl) {
      const fallback = await cache.match(fallbackUrl, { ignoreSearch: true });
      if (fallback) return fallback;
    }
    throw error;
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  const network = fetch(request).then(async response => {
    if (response && response.ok) await cache.put(request, response.clone());
    return response;
  }).catch(() => null);
  return cached || network || Response.error();
}

self.addEventListener("install", event => {
  event.waitUntil((async () => {
    await safePrecache();
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys
      .filter(key => key.startsWith("bell-performance-") && key !== CACHE_NAME)
      .map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request, "./index.html"));
    return;
  }

  const path = url.pathname.toLowerCase();
  const isFreshCode = ["script", "style", "document"].includes(request.destination)
    || path.endsWith(".js")
    || path.endsWith(".css")
    || path.endsWith(".json")
    || path.endsWith(".html");

  event.respondWith(isFreshCode ? networkFirst(request) : staleWhileRevalidate(request));
});
