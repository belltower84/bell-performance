"use strict";
const CACHE_NAME = "bell-performance-6-4-visual-experience";
const ASSETS = [
  "./","./index.html","./manifest.json","./css/app.css",
  "./assets/logo-shield.svg","./assets/athlete-male.svg","./assets/athlete-female.svg","./assets/engine-run.svg","./assets/engine-cycle.svg",
  "./data/workouts.js","./js/storage.js","./js/readiness.js","./js/equipment.js","./js/training-blocks.js","./js/mobility.js","./js/nutrition.js","./js/milestones.js","./js/workouts.js","./js/ui.js","./js/app.js"
];
self.addEventListener("install", event => { event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting())); });
self.addEventListener("activate", event => { event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", event => { if (event.request.method !== "GET") return; event.respondWith(fetch(event.request).then(response => { const copy=response.clone(); caches.open(CACHE_NAME).then(cache=>cache.put(event.request,copy)); return response; }).catch(()=>caches.match(event.request).then(cached=>cached||caches.match("./index.html")))); });
