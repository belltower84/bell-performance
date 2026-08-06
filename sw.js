"use strict";
const CACHE_NAME = "bell-performance-13-22-4-visible-general-warmup-modality";
const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.json",
  "./assets/artwork/engine/mountain-trail.jpg?v=10006",
  "./assets/artwork/strength/powerlifting.jpg?v=10006",
  "./assets/icons/engine-mark.svg?v=10006",
  "./assets/logo-bell-emblem.png?v=12210",
  "./assets/logo-shield.svg?v=13720",
  "./css/app.css?v=13710",
  "./css/athlete-response-13130.css?v=131400",
  "./css/bell13.css?v=13300",
  "./css/bell134.css?v=13620",
  "./css/bell135.css?v=13712",
  "./css/bell1364.css?v=13640",
  "./css/commercial-dashboard-13200.css?v=132000",
  "./css/first-flight-1372.css?v=13721",
  "./css/guided-tour-1374.css?v=13740",
  "./css/guided-workout-13192.css?v=131920",
  "./css/guided-workout-13193.css?v=131930",
  "./css/guided-workout-13203.css?v=132030",
  "./css/guided-workout-13216.css?v=132160",
  "./css/guided-workout-13205.css?v=132050",
  "./css/guided-workout-13206.css?v=132060",
  "./css/guided-workout-13212.css?v=132120",
  "./css/guided-workout-cleanup-13216.css?v=132161",
  "./css/guided-workout-paired-rounds-13219.css?v=132190",
  "./css/independent-daily-sessions-1382.css?v=13840",
  "./css/settings-1376.css?v=13760",
  "./css/workout-experience-1385.css?v=13850",
  "./css/workout-preview-warmup-13210.css?v=132100",
  "./css/readiness-transparency-13213.css?v=132130",
  "./css/adaptive-mobility-rehab-13220.css?v=132200",
  "./css/integrated-movement-preparation-13221.css?v=132210",
  "./css/integrated-warmup-sequence-13222.css?v=132220",
  "./css/evidence-warmup-plate-guides-13223.css?v=132230",
  "./data/workouts.js?v=132160",
  "./js/adaptive-weekly-schedule.js?v=13730",
  "./js/adaptive-mobility-rehab-13220.js?v=132200",
  "./js/integrated-movement-preparation-13221.js?v=132210",
  "./js/integrated-warmup-sequence-13222.js?v=132220",
  "./js/evidence-warmup-plate-guides-13223.js?v=132230",
  "./js/integrated-warmup-modality-13224.js?v=132240",
  "./js/api-integration.js?v=131300",
  "./js/app.js?v=12101",
  "./js/artwork.js?v=10006",
  "./js/athlete-response-13130.js?v=131670",
  "./js/bell-api.js?v=131300",
  "./js/bell-coaching-engine.js?v=13200",
  "./js/bell13-athlete-experience.js?v=13650",
  "./js/bell13-coach-intelligence.js?v=13620",
  "./js/bell13-commercial-home.js?v=13850",
  "./js/bell13-dashboard.js?v=13850",
  "./js/block-lifecycle.js?v=10006",
  "./js/coaching-pathways.js?v=13600",
  "./js/completion-engine-13717.js?v=13718",
  "./js/daily-mission-13710.js?v=13718",
  "./js/dashboard-command-center.js?v=132130",
  "./js/dual-goals.js?v=10006",
  "./js/equipment.js?v=132160",
  "./js/event-coaching.js?v=13721",
  "./js/exercise-library.js?v=132160",
  "./js/first-flight-1372.js?v=13721",
  "./js/guided-workout-13193.js?v=131930",
  "./js/guided-workout-13203.js?v=132030",
  "./js/guided-workout-13219.js?v=132190",
  "./js/guided-workout-13205.js?v=132191",
  "./js/guided-workout-13206.js?v=132060",
  "./js/guided-workout-13212.js?v=132120",
  "./js/habits.js?v=10006",
  "./js/how-to.js?v=13740",
  "./js/independent-daily-sessions-1382.js?v=13850",
  "./js/longitudinal-coaching-1390.js?v=13910",
  "./js/longitudinal-progression-13140.js?v=131600",
  "./js/milestones.js?v=10006",
  "./js/missed-sessions.js?v=10006",
  "./js/mission-planner.js?v=10006",
  "./js/mission-routing-1385.js?v=13850",
  "./js/mobility.js?v=13650",
  "./js/nutrition.js?v=10006",
  "./js/performance-review.js?v=10006",
  "./js/plan-progress.js?v=10006",
  "./js/powerlifting-meet-prep.js?v=12213",
  "./js/powerlifting-programming.js?v=12212",
  "./js/premium-dashboard.js?v=13790",
  "./js/prescription-application-13150.js?v=131600",
  "./js/progression.js?v=10006",
  "./js/quote-cache.js?v=10006",
  "./js/readiness.js?v=132130",
  "./js/real-world-chaos-13160.js?v=131670",
  "./js/settings-1376.js?v=13760",
  "./js/storage.js?v=13841",
  "./js/training-blocks.js?v=13600",
  "./js/training-hub-1385.js?v=13850",
  "./js/ui.js?v=13850",
  "./js/version-8.js?v=132100",
  "./js/weekly-debrief.js?v=131300",
  "./js/workout-display-names.js?v=131740",
  "./js/workout-model.js?v=13850",
  "./js/workouts.js?v=132160"
];

async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const response = await fetch(request, { cache: "no-store" });
    if (response && response.ok) await cache.put(request, response.clone());
    return response;
  } catch (error) {
    return (await cache.match(request)) || (request.mode === "navigate" ? cache.match("./index.html") : Promise.reject(error));
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response && response.ok) await cache.put(request, response.clone());
  return response;
}

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  const dynamicCode = request.mode === "navigate" || ["script","style","document"].includes(request.destination) || /(?:index\.html|\.js|\.css)$/.test(url.pathname);
  event.respondWith(dynamicCode ? networkFirst(request) : cacheFirst(request));
});
