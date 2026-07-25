"use strict";
const CACHE_NAME = "bell-performance-8.9.3";
const CORE = [
  "./",
  "./index.html",
  "./manifest.json",
  "./css/app.css?v=8800",
  "./css/polish-880.css?v=8930",
  "./css/polish-881.css?v=8910",
  "./assets/logo-shield.svg?v=8800",
  "./assets/artwork/strength/powerlifting.jpg?v=8800",
  "./assets/artwork/strength/strength-building.jpg?v=8800",
  "./assets/artwork/strength/upper-body.jpg?v=8800",
  "./assets/artwork/strength/power-performance.jpg?v=8800",
  "./assets/artwork/strength/bodybuilding.jpg?v=8800",
  "./assets/artwork/strength/strength-size.jpg?v=8800",
  "./assets/artwork/strength/gym-conditioning.jpg?v=8800",
  "./assets/artwork/engine/mountain-trail.jpg?v=8800",
  "./assets/artwork/engine/forest-trail.jpg?v=8800",
  "./assets/artwork/engine/ridge-run.jpg?v=8800",
  "./assets/artwork/engine/alpine-lake.jpg?v=8800",
  "./assets/artwork/engine/desert-trail.jpg?v=8800",
  "./assets/artwork/engine/winter-trail.jpg?v=8800",
  "./assets/artwork/engine/hill-country.jpg?v=8800",
  "./assets/artwork/engine/custom-ridge-runner.jpg?v=8930",
  "./data/workouts.js?v=8800",
  "./js/storage.js?v=8800",
  "./js/exercise-library.js?v=8800",
  "./js/readiness.js?v=8800",
  "./js/equipment.js?v=8800",
  "./js/training-blocks.js?v=8800",
  "./js/mobility.js?v=8800",
  "./js/nutrition.js?v=8800",
  "./js/milestones.js?v=8800",
  "./js/progression.js?v=8800",
  "./js/workouts.js?v=8800",
  "./js/missed-sessions.js?v=8800",
  "./js/adaptive-engine.js?v=8900",
  "./js/performance-review.js?v=8800",
  "./js/artwork.js?v=8800",
  "./js/quote-cache.js?v=8800",
  "./js/ui.js?v=8800",
  "./js/habits.js?v=8800",
  "./js/dual-goals.js?v=8800",
  "./js/version-8.js?v=8800",
  "./js/mission-planner.js?v=8800",
  "./js/coaching-pathways.js?v=8800",
  "./js/event-coaching.js?v=8800",
  "./js/how-to.js?v=8800",
  "./js/premium-dashboard.js?v=8800",
  "./js/app.js?v=8800"
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
