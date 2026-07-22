"use strict";

const defaults = {
  settings: {
    phase: "Foundation",
    weight: 207,
    goal: 185,
    cardioType: "Running",
    rotationWeek: 1,
    maxes: { bench: 315, squat: 455, deadlift: 455, pushPress: 185 },
    readiness: {
      sleepHours: 7, sleepQuality: 4, energy: 4, motivation: 4,
      stress: 3, soreness: 3, jointPain: 0, restingHr: 0,
      score: 78, status: "GREEN"
    }
  },
  plan: [
    { day: "Monday", mission: "S-1 Upper Strength", done: false },
    { day: "Tuesday", mission: "R-2 Easy Run", done: false },
    { day: "Wednesday", mission: "S-2 Lower Strength", done: false },
    { day: "Thursday", mission: "M-1 Daily Reset", done: false },
    { day: "Friday", mission: "S-3 Athletic Upper", done: false },
    { day: "Saturday", mission: "R-5 Long Run", done: false },
    { day: "Sunday", mission: "S-4 Athletic Lower", done: false }
  ],
  history: [],
  activeWorkout: null,
  mobility: { focus: "Auto", minutes: 10, completedDates: [], checks: {} },
  readinessLog: [],
  mission: {
    goalWorkouts: 40, goalMobility: 30, goalPullups: 25, goal5k: 28,
    currentPullups: 20, current5k: null
  },
  nutrition: { height: 66, age: 41, activity: 1.55, goal: "cut" }
};

const STORAGE_KEY = "bellPerformanceV2";

function cloneDefaults() {
  return JSON.parse(JSON.stringify(defaults));
}

let data;
try {
  data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null") || cloneDefaults();
} catch {
  data = cloneDefaults();
}

function normalizeData() {
  data.settings = data.settings || {};
  data.settings.phase = data.settings.phase || defaults.settings.phase;
  data.settings.weight = Number(data.settings.weight) || defaults.settings.weight;
  data.settings.goal = Number(data.settings.goal) || defaults.settings.goal;
  data.settings.cardioType = data.settings.cardioType || "Running";
  data.settings.rotationWeek = Math.min(4, Math.max(1, Number(data.settings.rotationWeek) || 1));
  data.settings.maxes = {
    bench: Number(data.settings.maxes?.bench) || 315,
    squat: Number(data.settings.maxes?.squat) || 455,
    deadlift: Number(data.settings.maxes?.deadlift) || 455,
    pushPress: Number(data.settings.maxes?.pushPress) || 185
  };

  const old = data.settings.readiness || {};
  data.settings.readiness = {
    sleepHours: Number.isFinite(+old.sleepHours) ? +old.sleepHours : 7,
    sleepQuality: Number.isFinite(+old.sleepQuality) ? +old.sleepQuality : (Number.isFinite(+old.sleep) ? +old.sleep : 4),
    energy: Number.isFinite(+old.energy) ? +old.energy : 4,
    motivation: Number.isFinite(+old.motivation) ? +old.motivation : 4,
    stress: Number.isFinite(+old.stress) ? +old.stress : 3,
    soreness: Number.isFinite(+old.soreness) ? +old.soreness : 3,
    jointPain: Number.isFinite(+old.jointPain) ? +old.jointPain : 0,
    restingHr: Number.isFinite(+old.restingHr) ? +old.restingHr : 0,
    score: Number.isFinite(+old.score) ? +old.score : 78,
    status: old.status || "GREEN"
  };

  data.plan = Array.isArray(data.plan) ? data.plan : cloneDefaults().plan;
  data.history = Array.isArray(data.history) ? data.history : [];
  data.mobility = { ...defaults.mobility, ...(data.mobility || {}) };
  data.mobility.completedDates = Array.isArray(data.mobility.completedDates) ? data.mobility.completedDates : [];
  data.mobility.checks = data.mobility.checks || {};
  data.readinessLog = Array.isArray(data.readinessLog) ? data.readinessLog : [];
  data.mission = { ...defaults.mission, ...(data.mission || {}) };
  data.nutrition = { ...defaults.nutrition, ...(data.nutrition || {}) };

  if (data.activeWorkout && !Array.isArray(data.activeWorkout.exercises)) {
    data.activeWorkout = null;
  }
}

function saveData({ render = true } = {}) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  if (render && typeof renderApp === "function") renderApp();
}

function exportData() {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `bell-performance-backup-${todayKey()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function importData(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      data = JSON.parse(reader.result);
      normalizeData();
      saveData();
      alert("Backup imported.");
    } catch {
      alert("That backup file could not be read.");
    }
  };
  reader.readAsText(file);
}

function resetApp() {
  if (!confirm("Reset all Bell Performance data on this device?")) return;
  data = cloneDefaults();
  saveData();
}

normalizeData();
