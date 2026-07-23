"use strict";
const CACHE_NAME = "bell-performance-6.9.0";
const CORE = [
  "./",
  "./index.html",
  "./manifest.json",
  "./css/app.css?v=690",
  "./assets/logo-shield.svg?v=690",
  "./assets/artwork/strength/powerlifting.jpg?v=690",
  "./assets/artwork/strength/strength-building.jpg?v=690",
  "./assets/artwork/strength/upper-body.jpg?v=690",
  "./assets/artwork/strength/power-performance.jpg?v=690",
  "./assets/artwork/strength/bodybuilding.jpg?v=690",
  "./assets/artwork/strength/strength-size.jpg?v=690",
  "./assets/artwork/strength/gym-conditioning.jpg?v=690",
  "./assets/artwork/engine/mountain-trail.jpg?v=690",
  "./assets/artwork/engine/forest-trail.jpg?v=690",
  "./assets/artwork/engine/ridge-run.jpg?v=690",
  "./assets/artwork/engine/alpine-lake.jpg?v=690",
  "./assets/artwork/engine/desert-trail.jpg?v=690",
  "./assets/artwork/engine/winter-trail.jpg?v=690",
  "./assets/artwork/engine/hill-country.jpg?v=690",
  "./data/workouts.js?v=690",
  "./js/storage.js?v=690",
  "./js/readiness.js?v=690",
  "./js/equipment.js?v=690",
  "./js/training-blocks.js?v=690",
  "./js/mobility.js?v=690",
  "./js/nutrition.js?v=690",
  "./js/milestones.js?v=690",
  "./js/progression.js?v=690",
  "./js/workouts.js?v=690",
  "./js/artwork.js?v=690",
  "./js/quote-cache.js?v=690",
  "./js/ui.js?v=690",
  "./js/dual-goals.js?v=690",
  "./js/how-to.js?v=690",
  "./js/app.js?v=690"
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
