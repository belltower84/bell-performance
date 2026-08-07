"use strict";
const CACHE_NAME = "bell-performance-13-22-10-github-actions-deployment";
const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.json?v=1322100",
  "./version.json?v=1322100",
  "./refresh.html?v=1322100",
  "./favicon.ico?v=1322100",
  "./assets/app-icon-192.png?v=1322100",
  "./assets/app-icon-512.png?v=1322100",
  "./assets/logo-bell-emblem.png?v=12210",
  "./assets/artwork/strength/powerlifting.jpg?v=10006",
  "./assets/artwork/engine/mountain-trail.jpg?v=10006",
  "./assets/icons/engine-mark.svg?v=10006",
  "./data/workouts.js?v=132160",
  "./js/exercise-library.js?v=132160",
  "./js/storage.js?v=13841",
  "./js/readiness.js?v=132130",
  "./js/equipment.js?v=132160",
  "./js/training-blocks.js?v=13600",
  "./js/mobility.js?v=13650",
  "./js/nutrition.js?v=10006",
  "./js/milestones.js?v=10006",
  "./js/progression.js?v=10006",
  "./js/workout-model.js?v=13850",
  "./js/workouts.js?v=132160",
  "./js/missed-sessions.js?v=10006",
  "./js/performance-review.js?v=10006",
  "./js/artwork.js?v=10006",
  "./js/quote-cache.js?v=10006",
  "./js/ui.js?v=13850",
  "./js/habits.js?v=10006",
  "./js/dual-goals.js?v=10006",
  "./js/version-8.js?v=132100",
  "./js/mission-planner.js?v=10006",
  "./js/coaching-pathways.js?v=13600",
  "./js/event-coaching.js?v=13721",
  "./js/real-world-chaos-13160.js?v=131670",
  "./js/longitudinal-progression-13140.js?v=131600",
  "./js/prescription-application-13150.js?v=131600",
  "./js/athlete-response-13130.js?v=131670",
  "./js/how-to.js?v=13740",
  "./js/workout-display-names.js?v=131740",
  "./js/premium-dashboard.js?v=13790",
  "./js/block-lifecycle.js?v=10006",
  "./js/weekly-debrief.js?v=131300",
  "./js/plan-progress.js?v=10006",
  "./js/bell-api.js?v=131300",
  "./js/api-integration.js?v=131300",
  "./js/dashboard-command-center.js?v=132130",
  "./js/adaptive-weekly-schedule.js?v=13730",
  "./js/powerlifting-programming.js?v=12212",
  "./js/powerlifting-meet-prep.js?v=12213",
  "./js/app.js?v=1322100",
  "./js/bell-coaching-engine.js?v=13200",
  "./js/bell13-dashboard.js?v=13850",
  "./js/bell13-athlete-experience.js?v=13650",
  "./js/first-flight-1372.js?v=13721",
  "./js/bell13-coach-intelligence.js?v=13620",
  "./js/bell13-commercial-home.js?v=132260",
  "./js/settings-1376.js?v=13760",
  "./js/daily-mission-13710.js?v=132250",
  "./js/completion-engine-13717.js?v=13718",
  "./js/independent-daily-sessions-1382.js?v=13850",
  "./js/training-hub-1385.js?v=13850",
  "./js/mission-routing-1385.js?v=13850",
  "./js/longitudinal-coaching-1390.js?v=13910",
  "./js/guided-workout-13193.js?v=131930",
  "./js/guided-workout-13203.js?v=132030",
  "./js/guided-workout-13219.js?v=132190",
  "./js/guided-workout-13205.js?v=132191",
  "./js/guided-workout-13206.js?v=132060",
  "./js/guided-workout-13212.js?v=132120",
  "./js/adaptive-mobility-rehab-13220.js?v=132200",
  "./js/integrated-movement-preparation-13221.js?v=132210",
  "./js/integrated-warmup-sequence-13222.js?v=132220",
  "./js/evidence-warmup-plate-guides-13223.js?v=132230",
  "./js/integrated-warmup-modality-13224.js?v=132240",
  "./js/mission-setup-selectors-13225.js?v=132250",
  "./js/coach-dashboard-13226.js?v=132270",
  "./js/runtime-stability-13229.js?v=1322100",
  "./assets/logo-shield.svg?v=13720",
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
  "./css/guided-workout-13192.css?v=131920",
  "./css/guided-workout-13193.css?v=131930",
  "./css/commercial-dashboard-13200.css?v=132000",
  "./css/guided-workout-13203.css?v=132030",
  "./css/guided-workout-13216.css?v=132160",
  "./css/guided-workout-13205.css?v=132050",
  "./css/guided-workout-13206.css?v=132060",
  "./css/guided-workout-13212.css?v=132120",
  "./css/guided-workout-cleanup-13216.css?v=132161",
  "./css/guided-workout-paired-rounds-13219.css?v=132190",
  "./css/workout-preview-warmup-13210.css?v=132100",
  "./css/readiness-transparency-13213.css?v=132130",
  "./css/adaptive-mobility-rehab-13220.css?v=132200",
  "./css/integrated-movement-preparation-13221.css?v=132210",
  "./css/integrated-warmup-sequence-13222.css?v=132220",
  "./css/evidence-warmup-plate-guides-13223.css?v=132230",
  "./css/mission-setup-selectors-13225.css?v=132250",
  "./css/coach-dashboard-13226.css?v=132260"
];

async function safePrecache() {
  const cache = await caches.open(CACHE_NAME);
  await Promise.allSettled(APP_SHELL.map(async url => {
    try {
      const response = await fetch(url, { cache:"reload" });
      if (response && response.ok) await cache.put(url, response.clone());
    } catch (_) { /* One optional asset must not block the whole deployment. */ }
  }));
}

async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const response = await fetch(request, { cache:"no-store" });
    if (response && response.ok) await cache.put(request, response.clone());
    return response;
  } catch (error) {
    const cached = await cache.match(request, { ignoreSearch:true });
    if (cached) return cached;
    if (request.mode === "navigate") return cache.match("./index.html", { ignoreSearch:true });
    throw error;
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request, { ignoreSearch:true });
  if (cached) return cached;
  const response = await fetch(request);
  if (response && response.ok) await cache.put(request, response.clone());
  return response;
}

self.addEventListener("install", event => {
  event.waitUntil(safePrecache().then(() => self.skipWaiting()));
});

self.addEventListener("activate", event => {
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(key=>key.startsWith("bell-performance-")&&key!==CACHE_NAME).map(key=>caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", event => {
  const request=event.request;
  if(request.method!=="GET")return;
  const url=new URL(request.url);
  if(url.origin!==self.location.origin)return;
  const codeLike=request.mode==="navigate" || ["script","style","document"].includes(request.destination) || /\.(?:js|css|json|html)$/.test(url.pathname);
  event.respondWith(codeLike ? networkFirst(request) : cacheFirst(request));
});
