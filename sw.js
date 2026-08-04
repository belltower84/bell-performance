"use strict";
const CACHE_NAME = 'bell-performance-13-20-5-superset-feedback-gate';
const CORE = [
  "./",
  "./index.html",
  "./manifest.json",
  "./css/app.css?v=13710",
  "./css/first-flight-1372.css?v=13721",
  "./css/independent-daily-sessions-1382.css?v=13840",
  "./css/bell13.css?v=13300",
  "./css/bell134.css?v=13620",
  "./css/bell135.css?v=13712",
  "./css/bell1364.css?v=13640",
  "./css/guided-tour-1374.css?v=13740",
  "./css/settings-1376.css?v=13760",
  "./css/workout-experience-1385.css?v=13850",
  "./css/athlete-response-13130.css?v=131400",
  "./css/guided-workout-13190.css?v=131900",
  "./assets/logo-bell-emblem.png?v=12210",
  "./assets/logo-shield.svg?v=13720",
  "./assets/icons/engine-shoe.svg?v=10006",
  "./assets/icons/engine-mark.svg?v=10006",
  "./assets/artwork/strength/powerlifting.jpg?v=10006",
  "./assets/artwork/strength/strength-building.jpg?v=10006",
  "./assets/artwork/strength/upper-body.jpg?v=10006",
  "./assets/artwork/strength/power-performance.jpg?v=10006",
  "./assets/artwork/strength/bodybuilding.jpg?v=10006",
  "./assets/artwork/strength/strength-size.jpg?v=10006",
  "./assets/artwork/strength/gym-conditioning.jpg?v=10006",
  "./assets/library/back-squat-production-guide.png?v=13710",
  "./assets/library/back-squat-muscle-map.png?v=13710",
  "./assets/library/back-squat-instructional.png?v=13670",
  "./assets/artwork/engine/mountain-trail.jpg?v=10006",
  "./assets/artwork/engine/forest-trail.jpg?v=10006",
  "./assets/artwork/engine/ridge-run.jpg?v=10006",
  "./assets/artwork/engine/alpine-lake.jpg?v=10006",
  "./assets/artwork/engine/desert-trail.jpg?v=10006",
  "./assets/artwork/engine/winter-trail.jpg?v=10006",
  "./assets/artwork/engine/hill-country.jpg?v=10006",
  "./data/workouts.js?v=10007",
  "./js/storage.js?v=13841",
  "./js/exercise-library.js?v=13710",
  "./js/readiness.js?v=13840",
  "./js/equipment.js?v=13640",
  "./js/training-blocks.js?v=13600",
  "./js/mobility.js?v=13650",
  "./js/nutrition.js?v=10006",
  "./js/milestones.js?v=10006",
  "./js/progression.js?v=10006",
  "./js/workout-model.js?v=13850",
  "./js/workouts.js?v=131300",
  "./js/guided-workout-13190.js?v=131900",
  "./js/missed-sessions.js?v=10006",
  "./js/performance-review.js?v=10006",
  "./js/artwork.js?v=10006",
  "./js/quote-cache.js?v=10006",
  "./js/ui.js?v=13850",
  "./js/habits.js?v=10006",
  "./js/dual-goals.js?v=13610",
  "./js/version-8.js?v=13600",
  "./js/mission-planner.js?v=10006",
  "./js/coaching-pathways.js?v=13600",
  "./js/event-coaching.js?v=13721",
  "./js/real-world-chaos-13160.js?v=131670",
  "./js/longitudinal-progression-13140.js?v=131600",
  "./js/prescription-application-13150.js?v=131600",
  "./js/athlete-response-13130.js?v=131670",
  "./js/how-to.js?v=13740",
  "./js/premium-dashboard.js?v=13610",
  "./js/block-lifecycle.js?v=10006",
  "./js/plan-progress.js?v=10006",
  "./js/weekly-debrief.js?v=131300",
  "./js/bell-api.js?v=131300",
  "./js/api-integration.js?v=131300",
  "./js/dashboard-command-center.js?v=13650",
  "./js/adaptive-weekly-schedule.js?v=13730",
  "./js/app.js?v=12101",
  "./js/bell-coaching-engine.js?v=13200",
  "./js/bell13-dashboard.js?v=13850",
  "./js/bell13-athlete-experience.js?v=13650",
  "./js/first-flight-1372.js?v=13721",
  "./js/bell13-coach-intelligence.js?v=13620",
  "./js/bell13-commercial-home.js?v=13850",
  "./js/settings-1376.js?v=13760",
  "./js/independent-daily-sessions-1382.js?v=13850",
  "./js/training-hub-1385.js?v=13850",
  "./js/mission-routing-1385.js?v=13850",
  "./js/longitudinal-coaching-1390.js?v=13910",
,
  "./css/guided-workout-13193.css",
  "./css/commercial-dashboard-13200.css",
  "./js/guided-workout-13193.js",
  './css/guided-workout-13203.css',
  './js/guided-workout-13203.js',
  './css/guided-workout-13204.css',
  './js/guided-workout-13204.js',
  './css/guided-workout-13205.css',
  './js/guided-workout-13205.js',
  './assets/library/commercial-lower-body-anatomy.png'];
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
