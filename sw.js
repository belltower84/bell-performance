"use strict";
const CACHE_NAME = 'bell-performance-12.2.2-unified-mission-flow';
const CORE = [
  "./",
  "./index.html",
  "./manifest.json",
  "./css/app.css?v=12220",
  "./assets/logo-bell-emblem.png?v=12210",
  "./assets/icons/engine-shoe.svg?v=10006",
  "./assets/icons/engine-mark.svg?v=10006",
  "./assets/artwork/strength/powerlifting.jpg?v=10006",
  "./assets/artwork/strength/strength-building.jpg?v=10006",
  "./assets/artwork/strength/upper-body.jpg?v=10006",
  "./assets/artwork/strength/power-performance.jpg?v=10006",
  "./assets/artwork/strength/bodybuilding.jpg?v=10006",
  "./assets/artwork/strength/strength-size.jpg?v=10006",
  "./assets/artwork/strength/gym-conditioning.jpg?v=10006",
  "./assets/artwork/engine/mountain-trail.jpg?v=10006",
  "./assets/artwork/engine/forest-trail.jpg?v=10006",
  "./assets/artwork/engine/ridge-run.jpg?v=10006",
  "./assets/artwork/engine/alpine-lake.jpg?v=10006",
  "./assets/artwork/engine/desert-trail.jpg?v=10006",
  "./assets/artwork/engine/winter-trail.jpg?v=10006",
  "./assets/artwork/engine/hill-country.jpg?v=10006",
  "./data/workouts.js?v=10007",
  "./js/storage.js?v=10006",
  "./js/exercise-library.js?v=10006",
  "./js/readiness.js?v=10006",
  "./js/equipment.js?v=10006",
  "./js/training-blocks.js?v=10006",
  "./js/mobility.js?v=10006",
  "./js/nutrition.js?v=10006",
  "./js/milestones.js?v=10006",
  "./js/progression.js?v=10006",
  "./js/workout-model.js?v=10006",
  "./js/workouts.js?v=11000",
  "./js/missed-sessions.js?v=10006",
  "./js/performance-review.js?v=10006",
  "./js/artwork.js?v=10006",
  "./js/quote-cache.js?v=10006",
  "./js/ui.js?v=10006",
  "./js/habits.js?v=10006",
  "./js/dual-goals.js?v=10006",
  "./js/version-8.js?v=10006",
  "./js/mission-planner.js?v=10006",
  "./js/coaching-pathways.js?v=10006",
  "./js/event-coaching.js?v=10006",
  "./js/how-to.js?v=10006",
  "./js/premium-dashboard.js?v=11000",
  "./js/block-lifecycle.js?v=10006",
  "./js/plan-progress.js?v=10006",
  "./js/weekly-debrief.js?v=10006",
  "./js/bell-api.js?v=12220",
  "./js/api-integration.js?v=12101",
  "./js/dashboard-command-center.js?v=12220",
  "./js/app.js?v=12101"
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
