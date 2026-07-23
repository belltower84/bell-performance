"use strict";

const ARTWORK_CATALOGUE = {
  strength: {
    powerlifting: ["powerlifting", "strength-building", "power-performance"],
    "olympic lifting": ["power-performance", "strength-size", "strength-building"],
    athlete: ["power-performance", "gym-conditioning", "strength-building"],
    hybrid: ["strength-building", "powerlifting", "gym-conditioning", "strength-size"],
    bodybuilding: ["bodybuilding", "upper-body", "strength-size"],
    default: ["powerlifting", "strength-building", "upper-body", "power-performance", "bodybuilding", "strength-size", "gym-conditioning"]
  },
  engine: {
    running: ["mountain-trail", "forest-trail", "ridge-run", "alpine-lake", "desert-trail", "winter-trail", "hill-country"],
    rowing: ["alpine-lake", "mountain-trail", "ridge-run"],
    "hiking / rucking": ["mountain-trail", "alpine-lake", "desert-trail", "winter-trail", "hill-country"],
    cycling: ["ridge-run", "hill-country", "mountain-trail", "desert-trail"],
    "sprint / field": ["hill-country", "forest-trail", "ridge-run"],
    swimming: ["alpine-lake", "mountain-trail", "forest-trail"],
    "general conditioning": ["forest-trail", "hill-country", "mountain-trail"],
    "none / recovery only": ["forest-trail", "alpine-lake", "hill-country"],
    default: ["mountain-trail", "forest-trail", "ridge-run", "alpine-lake", "desert-trail", "winter-trail", "hill-country"]
  }
};

function artworkHash(text) {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash >>> 0);
}

function artworkDayKey() {
  const now = new Date();
  return `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
}

function currentArtworkGoals() {
  const dual = data?.trainingBlock?.dualGoals || {};
  return {
    strengthGoal: String(dual.strengthGoal || data?.trainingBlock?.goalType || "Hybrid").toLowerCase(),
    engineMode: String(dual.engineMode || data?.settings?.cardioType || "Running").toLowerCase(),
    engineGoal: String(dual.engineGoal || "general").toLowerCase()
  };
}

function chooseArtwork(type, context = "dashboard") {
  const goals = currentArtworkGoals();
  let key = type === "strength" ? goals.strengthGoal : goals.engineMode;
  let choices = ARTWORK_CATALOGUE[type][key] || ARTWORK_CATALOGUE[type].default;

  // Refine Engine artwork by what the athlete is preparing for.
  if (type === "engine") {
    const goal = goals.engineGoal;
    if (/trail|mountain|hike|ruck|hunt|backpack/.test(goal)) choices = ["mountain-trail", "alpine-lake", "desert-trail", "winter-trail", "hill-country"];
    else if (/recovery|zone-?2|base|aerobic|general/.test(goal)) choices = ["forest-trail", "hill-country", "alpine-lake"];
    else if (/heat|ultra|marathon/.test(goal)) choices = ["desert-trail", "ridge-run", "mountain-trail"];
    else if (/speed|sprint|5k|10k|time/.test(goal)) choices = ["ridge-run", "hill-country", "mountain-trail"];
  }

  const index = artworkHash(`${artworkDayKey()}|${type}|${key}|${goals.engineGoal}|${context}`) % choices.length;
  const selected = choices[index];
  return `./assets/artwork/${type}/${selected}.jpg?v=670`;
}

function applyMissionArtwork() {
  const strength = document.getElementById("strengthArtwork");
  const engine = document.getElementById("engineArtwork");
  if (strength) strength.src = chooseArtwork("strength", "mission");
  if (engine) engine.src = chooseArtwork("engine", "mission");
}
