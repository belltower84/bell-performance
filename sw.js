"use strict";
const CACHE_NAME = "bell-performance-9.0.1";
const CORE = [
  "./",
  "./index.html",
  "./manifest.json",
  "./css/app.css?v=9010",
  "./assets/logo-shield.svg?v=9010",
  "./assets/icons/engine-shoe.svg?v=9010",
  "./assets/artwork/strength/powerlifting.jpg?v=9010",
  "./assets/artwork/strength/strength-building.jpg?v=9010",
  "./assets/artwork/strength/upper-body.jpg?v=9010",
  "./assets/artwork/strength/power-performance.jpg?v=9010",
  "./assets/artwork/strength/bodybuilding.jpg?v=9010",
  "./assets/artwork/strength/strength-size.jpg?v=9010",
  "./assets/artwork/strength/gym-conditioning.jpg?v=9010",
  "./assets/artwork/engine/mountain-trail.jpg?v=9010",
  "./assets/artwork/engine/forest-trail.jpg?v=9010",
  "./assets/artwork/engine/ridge-run.jpg?v=9010",
  "./assets/artwork/engine/alpine-lake.jpg?v=9010",
  "./assets/artwork/engine/desert-trail.jpg?v=9010",
  "./assets/artwork/engine/winter-trail.jpg?v=9010",
  "./assets/artwork/engine/hill-country.jpg?v=9010",
  "./data/workouts.js?v=9010",
  "./js/storage.js?v=9010",
  "./js/exercise-library.js?v=9010",
  "./js/readiness.js?v=9010",
  "./js/equipment.js?v=9010",
  "./js/training-blocks.js?v=9010",
  "./js/mobility.js?v=9010",
  "./js/nutrition.js?v=9010",
  "./js/milestones.js?v=9010",
  "./js/progression.js?v=9010",
  "./js/workouts.js?v=9010",
  "./js/missed-sessions.js?v=9010",
  "./js/performance-review.js?v=9010",
  "./js/artwork.js?v=9010",
  "./js/quote-cache.js?v=9010",
  "./js/ui.js?v=9010",
  "./js/habits.js?v=9010",
  "./js/dual-goals.js?v=9010",
  "./js/version-8.js?v=9010",
  "./js/mission-planner.js?v=9010",
  "./js/coaching-pathways.js?v=9010",
  "./js/event-coaching.js?v=9010",
  "./js/how-to.js?v=9010",
  "./js/premium-dashboard.js?v=9010",
  "./js/app.js?v=9010"
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
