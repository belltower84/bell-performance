"use strict";
const CACHE_NAME = "bell-performance-6-6-1-readiness-661";
const CORE = [
  "./", "./index.html", "./manifest.json", "./css/app.css?v=661",
  "./assets/logo-shield.svg?v=661", "./assets/athlete-male.svg?v=661",
  "./assets/athlete-female.svg?v=661", "./assets/engine-run.svg?v=661",
  "./assets/engine-cycle.svg?v=661", "./data/workouts.js?v=661",
  "./js/storage.js?v=661", "./js/readiness.js?v=661", "./js/equipment.js?v=661",
  "./js/training-blocks.js?v=661", "./js/mobility.js?v=661", "./js/nutrition.js?v=661",
  "./js/milestones.js?v=661", "./js/workouts.js?v=661", "./js/ui.js?v=661",
  "./js/dual-goals.js?v=661", "./js/app.js?v=661"
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
