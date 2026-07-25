"use strict";

const CUSTOM_ARTWORK_EXTENSIONS = {
  "custom-heavy-deadlift": "jpg",
  "custom-strength-shadows": "jpg",
  "custom-sled-push": "jpg",
  "custom-ridge-runner": "jpg",
  "custom-sandbag-trek": "jpg"
};

const CURATED_ARTWORK = {
  strength: {
    powerlifting: ["custom-heavy-deadlift", "powerlifting", "custom-strength-shadows", "strength-building"],
    strength: ["custom-heavy-deadlift", "strength-building", "powerlifting", "power-performance"],
    male_physique: ["custom-strength-shadows", "strength-size", "bodybuilding", "upper-body"],
    female_physique: ["strength-size", "bodybuilding", "upper-body", "custom-strength-shadows"],
    hybrid_athletic: ["custom-sled-push", "power-performance", "gym-conditioning", "strength-building"],
    functional: ["custom-sled-push", "gym-conditioning", "power-performance", "strength-building"],
    tactical: ["custom-sled-push", "gym-conditioning", "strength-building", "power-performance"],
    endurance_support: ["gym-conditioning", "custom-strength-shadows", "upper-body", "strength-building"],
    general: ["strength-building", "custom-strength-shadows", "upper-body", "powerlifting"]
  },
  engine: {
    recovery: ["forest-trail", "alpine-lake", "hill-country"],
    aerobic_base: ["forest-trail", "hill-country", "mountain-trail", "custom-ridge-runner"],
    speed_endurance: ["custom-ridge-runner", "ridge-run", "hill-country", "mountain-trail"],
    long_endurance: ["custom-ridge-runner", "mountain-trail", "ridge-run", "hill-country"],
    trail_loaded: ["custom-sandbag-trek", "mountain-trail", "hill-country", "desert-trail"],
    multisport: ["alpine-lake", "custom-ridge-runner", "ridge-run", "forest-trail"],
    mixed_modal: ["custom-sandbag-trek", "ridge-run", "forest-trail", "hill-country"],
    general: ["mountain-trail", "custom-ridge-runner", "forest-trail", "hill-country", "alpine-lake"]
  }
};

function artworkHash(text) { let hash = 2166136261; for (let i = 0; i < text.length; i += 1) { hash ^= text.charCodeAt(i); hash = Math.imul(hash, 16777619); } return Math.abs(hash >>> 0); }
function artworkDayKey() { const now = new Date(); return `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`; }
function fallbackArtworkPath(type){ return type === 'engine' ? './assets/engine-mountain-trail.jpg?v=8600' : './assets/strength-classic.jpg?v=8600'; }

function currentArtworkSignals() {
  const dual = data?.trainingBlock?.dualGoals || {};
  const mission = data?.trainingBlock?.mission || {};
  const eventType = String(mission?.eventType || "").toLowerCase();
  const eventFamily = typeof currentEventFamilyId === "function" ? currentEventFamilyId(mission?.eventType) : null;
  return {
    sex: String(data?.settings?.sex || "Prefer not to say"),
    strengthGoal: String(dual.strengthGoal || data?.trainingBlock?.goalType || data?.settings?.athleteMode || "Hybrid").toLowerCase(),
    engineMode: String(dual.engineMode || data?.settings?.cardioType || "Running").toLowerCase(),
    engineGoal: String(dual.engineGoal || "general").toLowerCase(),
    missionPath: String(mission?.path || ""),
    eventType,
    eventFamily,
    bodybuildingFocus: String(data?.trainingBlock?.bodybuildingFocus || "").toLowerCase()
  };
}

function resolveStrengthArtworkProfile() {
  const s = currentArtworkSignals();
  if (s.missionPath === 'event') {
    if (s.eventFamily === 'physique') return s.sex === 'Female' ? 'female_physique' : 'male_physique';
    if (s.eventFamily === 'strength_competition') return 'powerlifting';
    if (s.eventFamily === 'functional') return 'functional';
    if (s.eventFamily === 'tactical' || /tactical|military|law-enforcement|police|fire/.test(s.eventType)) return 'tactical';
    if (s.eventFamily === 'running' || s.eventFamily === 'multisport' || s.eventFamily === 'obstacle_loaded') return 'endurance_support';
  }
  if (/bodybuilding|physique|muscle|hypertrophy|recomposition|fat loss/.test(s.strengthGoal)) return s.sex === 'Female' ? 'female_physique' : 'male_physique';
  if (/powerlifting|strength/.test(s.strengthGoal)) return 'powerlifting';
  if (/crossfit|functional/.test(s.strengthGoal)) return 'functional';
  if (/tactical|operator|military|police/.test(s.strengthGoal)) return 'tactical';
  if (/endurance|running|marathon|triathlon/.test(s.strengthGoal)) return 'endurance_support';
  if (/hybrid|athlete|general/.test(s.strengthGoal)) return 'hybrid_athletic';
  return 'general';
}

function resolveEngineArtworkProfile() {
  const s = currentArtworkSignals();
  const mode = `${s.engineMode} ${s.engineGoal} ${s.eventType}`;
  if (s.missionPath === 'event') {
    if (s.eventFamily === 'physique') return 'recovery';
    if (s.eventFamily === 'running') return /5k|10k|speed|time/.test(mode) ? 'speed_endurance' : 'long_endurance';
    if (s.eventFamily === 'multisport') return 'multisport';
    if (s.eventFamily === 'obstacle_loaded' || /trail|ruck|hike|mountain|obstacle/.test(mode)) return 'trail_loaded';
    if (s.eventFamily === 'functional' || s.eventFamily === 'tactical') return 'mixed_modal';
    if (s.eventFamily === 'strength_competition') return 'recovery';
  }
  if (/none \/ recovery only|recovery|mobility|reset/.test(mode)) return 'recovery';
  if (/trail|ruck|hike|mountain|hunt|backpack/.test(mode)) return 'trail_loaded';
  if (/swim|swimming|cycling|bike|row|triathlon/.test(mode)) return 'multisport';
  if (/interval|speed|sprint|5k|10k|hyrox|crossfit|conditioning/.test(mode)) return 'speed_endurance';
  if (/marathon|half|base|aerobic|long|zone 2|running/.test(mode)) return 'long_endurance';
  if (/physique|fat loss|bodybuilding/.test(s.strengthGoal)) return 'recovery';
  if (/hybrid|athlete|general/.test(s.strengthGoal)) return 'mixed_modal';
  return 'aerobic_base';
}

function curatedArtworkList(type, context = 'dashboard') {
  const profile = type === 'strength' ? resolveStrengthArtworkProfile() : resolveEngineArtworkProfile();
  let choices = [...(CURATED_ARTWORK[type][profile] || CURATED_ARTWORK[type].general)];
  if (context.includes('workout')) choices = [choices[0], ...choices.slice(1)];
  if (context.includes('quote') && type === 'engine') choices = [choices[0], ...choices];
  return { profile, choices };
}

function artworkPath(type, selected){
  const ext = CUSTOM_ARTWORK_EXTENSIONS[selected] || 'jpg';
  return `./assets/artwork/${type}/${selected}.${ext}?v=8600`;
}

function chooseArtwork(type, context = 'dashboard') {
  const { profile, choices } = curatedArtworkList(type, context);
  const signals = currentArtworkSignals();
  const seed = `${artworkDayKey()}|${type}|${profile}|${signals.strengthGoal}|${signals.engineGoal}|${signals.eventFamily || ''}|${context}`;
  const index = artworkHash(seed) % choices.length;
  return artworkPath(type, choices[index]);
}

function assignArtworkWithFallback(img, type, context){ if (!img) return; img.onerror = () => { img.onerror = null; img.src = fallbackArtworkPath(type); }; img.src = chooseArtwork(type, context); }
function applyCuratedArtworkTheme(){ const quoteCard = document.getElementById('premiumQuoteCard'); if (quoteCard) { const bg = chooseArtwork('engine', 'quote-card'); quoteCard.style.backgroundImage = `linear-gradient(90deg,rgba(8,10,13,.95),rgba(8,10,13,.84)),url('${bg}')`; quoteCard.style.backgroundPosition = 'center 55%'; quoteCard.style.backgroundSize = 'cover'; } }
function artworkCurationSummary(){ return { strengthProfile: resolveStrengthArtworkProfile(), engineProfile: resolveEngineArtworkProfile() }; }
function applyMissionArtwork() { assignArtworkWithFallback(document.getElementById('strengthArtwork'), 'strength', 'mission'); assignArtworkWithFallback(document.getElementById('engineArtwork'), 'engine', 'mission'); applyCuratedArtworkTheme(); }
