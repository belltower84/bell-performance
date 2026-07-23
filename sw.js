"use strict";
const CACHE_NAME = "bell-performance-6-6-dual-mission-660";
const CORE = [
  "./", "./index.html", "./manifest.json", "./css/app.css?v=660",
  "./assets/logo-shield.svg?v=660", "./assets/athlete-male.svg?v=660",
  "./assets/athlete-female.svg?v=660", "./assets/engine-run.svg?v=660",
  "./assets/engine-cycle.svg?v=660", "./data/workouts.js?v=660",
  "./js/storage.js?v=660", "./js/readiness.js?v=660", "./js/equipment.js?v=660",
  "./js/training-blocks.js?v=660", "./js/mobility.js?v=660", "./js/nutrition.js?v=660",
  "./js/milestones.js?v=660", "./js/workouts.js?v=660", "./js/ui.js?v=660",
  "./js/dual-goals.js?v=660", "./js/app.js?v=660"
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
