"use strict";
const CACHE_NAME = "bell-performance-8.0.2";
const CORE = [
  "./",
  "./index.html",
  "./manifest.json",
  "./css/app.css?v=8020",
  "./assets/logo-shield.svg?v=8020",
  "./assets/artwork/strength/powerlifting.jpg?v=8020",
  "./assets/artwork/strength/strength-building.jpg?v=8020",
  "./assets/artwork/strength/upper-body.jpg?v=8020",
  "./assets/artwork/strength/power-performance.jpg?v=8020",
  "./assets/artwork/strength/bodybuilding.jpg?v=8020",
  "./assets/artwork/strength/strength-size.jpg?v=8020",
  "./assets/artwork/strength/gym-conditioning.jpg?v=8020",
  "./assets/artwork/engine/mountain-trail.jpg?v=8020",
  "./assets/artwork/engine/forest-trail.jpg?v=8020",
  "./assets/artwork/engine/ridge-run.jpg?v=8020",
  "./assets/artwork/engine/alpine-lake.jpg?v=8020",
  "./assets/artwork/engine/desert-trail.jpg?v=8020",
  "./assets/artwork/engine/winter-trail.jpg?v=8020",
  "./assets/artwork/engine/hill-country.jpg?v=8020",
  "./data/workouts.js?v=8020",
  "./js/storage.js?v=8020",
  "./js/exercise-library.js?v=8020",
  "./js/readiness.js?v=8020",
  "./js/equipment.js?v=8020",
  "./js/training-blocks.js?v=8020",
  "./js/mobility.js?v=8020",
  "./js/nutrition.js?v=8020",
  "./js/milestones.js?v=8020",
  "./js/progression.js?v=8020",
  "./js/workouts.js?v=8020",
  "./js/missed-sessions.js?v=8020",
  "./js/performance-review.js?v=8020",
  "./js/artwork.js?v=8020",
  "./js/quote-cache.js?v=8020",
  "./js/ui.js?v=8020",
  "./js/habits.js?v=8020",
  "./js/dual-goals.js?v=8020",
  "./js/version-8.js?v=8020",
  "./js/mission-planner.js?v=8020",
  "./js/how-to.js?v=8020",
  "./js/app.js?v=8020"
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
