"use strict";
const CACHE_NAME = "bell-performance-6-6-4";
const CORE = [
  "./", "./index.html", "./manifest.json", "./css/app.css?v=663",
  "./assets/logo-shield.svg?v=663", "./assets/strength-power.svg?v=663",
  "./assets/strength-power.svg?v=663", "./assets/engine-route.svg?v=663",
  "./assets/engine-route.svg?v=663", "./data/workouts.js?v=663",
  "./js/storage.js?v=663", "./js/readiness.js?v=663", "./js/equipment.js?v=663",
  "./js/training-blocks.js?v=663", "./js/mobility.js?v=663", "./js/nutrition.js?v=663",
  "./js/milestones.js?v=663", "./js/workouts.js?v=663", "./js/ui.js?v=663",
  "./js/dual-goals.js?v=663", "./js/app.js?v=663"
];
self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET" || new URL(request.url).origin !== self.location.origin) return;
  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(() => caches.match("./index.html")));
    return;
  }
  event.respondWith(
    caches.match(request).then(cached => cached || fetch(request).then(response => {
      if (response && response.ok) caches.open(CACHE_NAME).then(cache => cache.put(request, response.clone()));
      return response;
    }))
  );
});
