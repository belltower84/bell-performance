"use strict";

const defaults = {
  settings: {
    phase: "Foundation",
    athleteName: "Chris",
    athleteMode: "Hybrid Athlete",
    sex: "Male",
    weight: 207,
    goal: 185,
    cardioType: "Running",
    rotationWeek: 1,
    maxes: { bench: 315, squat: 455, deadlift: 455, pushPress: 185 },
    readiness: { sleepQuality:4, energy:4, motivation:4, soreness:3, timeAvailability:3, score:80, status:"GREEN", lastPromptDate:"" },
    coachMessages: { setupComplete:false, style:"Performance", scriptureFrequency:"Occasionally" },
    equipmentSetup: { locations:[{id:"default",name:"My Gym",environment:"commercial",equipment:["barbell","rack","bench","dumbbells","cables","machines","smith","kettlebells","bands","pullupBar","dipStation","plyoBox","treadmill","bike","rower","skiErg","sled","airBike","jumpRope","outdoor"]}], activeLocationId:"default" }
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
  sessionFeedbackLog: [],
  pendingFeedbackSessionId: null,
  mission: {
    goalWorkouts: 40, goalMobility: 30, goalPullups: 25, goal5k: 28,
    currentPullups: 20, current5k: null
  },
  nutrition: { height: 66, age: 41, activity: 1.55, goal: "cut" },
  trainingBlock: {
    enabled: false, goalType: "General Hybrid", targetDate: "", targetMinutes: 60,
    lengthWeeks: 12, currentWeek: 1, trainingDays: 5, runDays: 3, strengthDays: 3,
    sessionMinutes: 75, secondaryGoal: "Maintain Strength", maintainStrength: true, bodybuildingFocus: "Balanced", bodybuildingPhase: "Recomposition", startDate: "", generatedAt: ""
  }
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
  data.settings.athleteName = data.settings.athleteName || "Chris";
  data.settings.athleteMode = data.settings.athleteMode || "Hybrid Athlete";
  data.settings.sex = ["Male", "Female", "Prefer not to say"].includes(data.settings.sex) ? data.settings.sex : "Male";
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
    sleepQuality: Number.isFinite(+old.sleepQuality) ? +old.sleepQuality : (Number.isFinite(+old.sleep) ? +old.sleep : 4),
    energy: Number.isFinite(+old.energy) ? +old.energy : 4,
    motivation: Number.isFinite(+old.motivation) ? +old.motivation : 4,
    soreness: Number.isFinite(+old.soreness) ? +old.soreness : 3,
    timeAvailability: Number.isFinite(+old.timeAvailability) ? +old.timeAvailability : 3,
    score: Number.isFinite(+old.score) ? +old.score : 80,
    status: old.status || "GREEN",
    lastPromptDate: old.lastPromptDate || ""
  };
  data.settings.coachMessages = { ...defaults.settings.coachMessages, ...(data.settings.coachMessages || {}) };
  if (typeof normalizeEquipmentSettings === "function") normalizeEquipmentSettings();

  data.plan = Array.isArray(data.plan) ? data.plan : cloneDefaults().plan;
  data.history = Array.isArray(data.history) ? data.history : [];
  data.mobility = { ...defaults.mobility, ...(data.mobility || {}) };
  data.mobility.completedDates = Array.isArray(data.mobility.completedDates) ? data.mobility.completedDates : [];
  data.mobility.checks = data.mobility.checks || {};
  data.readinessLog = Array.isArray(data.readinessLog) ? data.readinessLog : [];
  data.sessionFeedbackLog = Array.isArray(data.sessionFeedbackLog) ? data.sessionFeedbackLog : [];
  data.pendingFeedbackSessionId = data.pendingFeedbackSessionId || null;
  data.mission = { ...defaults.mission, ...(data.mission || {}) };
  data.nutrition = { ...defaults.nutrition, ...(data.nutrition || {}) };
  data.trainingBlock = { ...defaults.trainingBlock, ...(data.trainingBlock || {}) };
  data.trainingBlock.currentWeek = Math.max(1, Math.min(Number(data.trainingBlock.lengthWeeks) || 12, Number(data.trainingBlock.currentWeek) || 1));

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
