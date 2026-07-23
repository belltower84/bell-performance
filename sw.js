"use strict";
const CACHE_NAME = "bell-performance-6-5-dual-mission-650";
const CORE = [
  "./", "./index.html", "./manifest.json", "./css/app.css?v=650",
  "./assets/logo-shield.svg?v=650", "./assets/athlete-male.svg?v=650",
  "./assets/athlete-female.svg?v=650", "./assets/engine-run.svg?v=650",
  "./assets/engine-cycle.svg?v=650", "./data/workouts.js?v=650",
  "./js/storage.js?v=650", "./js/readiness.js?v=650", "./js/equipment.js?v=650",
  "./js/training-blocks.js?v=650", "./js/mobility.js?v=650", "./js/nutrition.js?v=650",
  "./js/milestones.js?v=650", "./js/workouts.js?v=650", "./js/ui.js?v=650",
  "./js/dual-goals.js?v=650", "./js/app.js?v=650"
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
