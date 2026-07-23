"use strict";
const CACHE_NAME = "bell-performance-6-6-5";
const CORE = [
  "./", "./index.html", "./manifest.json", "./css/app.css?v=665",
  "./assets/logo-shield.svg?v=665",
  "./assets/strength-classic-bg.jpg?v=665",
  "./assets/engine-mountain-trail-bg.jpg?v=665",
  "./data/workouts.js?v=665",
  "./js/storage.js?v=665", "./js/readiness.js?v=665", "./js/equipment.js?v=665",
  "./js/training-blocks.js?v=665", "./js/mobility.js?v=665", "./js/nutrition.js?v=665",
  "./js/milestones.js?v=665", "./js/workouts.js?v=665", "./js/ui.js?v=665",
  "./js/dual-goals.js?v=665", "./js/app.js?v=665"
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
