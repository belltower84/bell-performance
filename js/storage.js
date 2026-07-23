"use strict";

const defaults = {
  settings: {
    phase: "Foundation",
    athleteName: "",
    athleteMode: "Hybrid Athlete",
    sex: "Male",
    weight: null,
    goal: null,
    cardioType: "Running",
    rotationWeek: 1,
    maxes: { bench: null, squat: null, deadlift: null, pushPress: null },
    readiness: { sleepQuality:4, energy:4, motivation:4, soreness:3, timeAvailability:3, score:null, status:"", lastPromptDate:"" },
    coachMessages: { setupComplete:false, style:"Performance", scriptureFrequency:"Occasionally" },
    firstFlightStage: "profile",
    firstFlightTourComplete: false,
    injuryProfile: { hasLimitations:false, restrictedPatterns:[], affectedAreas:[], notes:"", medicalClearance:false, updatedAt:"", startedAt:"", recoveryHistory:[] },
    equipmentSetup: { locations:[{id:"default",name:"My Gym",environment:"commercial",equipment:["barbell","rack","bench","dumbbells","cables","machines","smith","kettlebells","bands","pullupBar","dipStation","plyoBox","treadmill","bike","rower","skiErg","sled","airBike","jumpRope","outdoor"]}], activeLocationId:"default" }
  },
  plan: [],
  history: [],
  exerciseProgression: {},
  exerciseIntelligence: { replacements: [], personalConstraints: [] },
  activeWorkout: null,
  mobility: { focus: "Auto", minutes: 10, completedDates: [], checks: {} },
  readinessLog: [],
  sessionFeedbackLog: [],
  pendingFeedbackSessionId: null,
  performanceReviews: { weeklySeen:[], blockReviews:[], milestones:[] },
  missedSessionLog: [],
  habits: {
    items: [
      {id:"training",label:"Complete prescribed training",icon:"⚒",custom:false},
      {id:"mobility",label:"Mobility",icon:"♡",custom:false},
      {id:"protein",label:"Protein",icon:"P",custom:false},
      {id:"hydration",label:"Hydration",icon:"◉",custom:false},
      {id:"steps",label:"Daily movement",icon:"↟",custom:false},
      {id:"sleep",label:"Sleep",icon:"☾",custom:false}
    ],
    targets: {proteinGrams:0,hydrationOz:0,steps:0,sleepHours:0,mobilityMinutes:0,customized:false},
    completions: {}
  },
  mission: {
    goalWorkouts: null, goalMobility: null, goalPullups: null, goal5k: null,
    currentPullups: null, current5k: null
  },
  nutrition: { height: null, age: null, activity: 1.55, goal: "maintain" },
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
  data.settings.athleteName = typeof data.settings.athleteName === "string" ? data.settings.athleteName : "";
  data.settings.athleteMode = data.settings.athleteMode || "Hybrid Athlete";
  data.settings.sex = ["Male", "Female", "Prefer not to say"].includes(data.settings.sex) ? data.settings.sex : "Male";
  data.settings.weight = Number.isFinite(Number(data.settings.weight)) && Number(data.settings.weight) > 0 ? Number(data.settings.weight) : null;
  data.settings.goal = Number.isFinite(Number(data.settings.goal)) && Number(data.settings.goal) > 0 ? Number(data.settings.goal) : null;
  data.settings.cardioType = data.settings.cardioType || "Running";
  data.settings.rotationWeek = Math.min(4, Math.max(1, Number(data.settings.rotationWeek) || 1));
  data.settings.maxes = {
    bench: Number(data.settings.maxes?.bench) || null,
    squat: Number(data.settings.maxes?.squat) || null,
    deadlift: Number(data.settings.maxes?.deadlift) || null,
    pushPress: Number(data.settings.maxes?.pushPress) || null
  };

  const old = data.settings.readiness || {};
  data.settings.readiness = {
    sleepQuality: Number.isFinite(+old.sleepQuality) ? +old.sleepQuality : (Number.isFinite(+old.sleep) ? +old.sleep : 4),
    energy: Number.isFinite(+old.energy) ? +old.energy : 4,
    motivation: Number.isFinite(+old.motivation) ? +old.motivation : 4,
    soreness: Number.isFinite(+old.soreness) ? +old.soreness : 3,
    timeAvailability: Number.isFinite(+old.timeAvailability) ? +old.timeAvailability : 3,
    score: Number.isFinite(+old.score) ? +old.score : null,
    status: old.status || "",
    lastPromptDate: old.lastPromptDate || ""
  };
  data.settings.coachMessages = { ...defaults.settings.coachMessages, ...(data.settings.coachMessages || {}) };
  data.settings.firstFlightStage = data.settings.firstFlightStage || (data.settings.coachMessages.setupComplete ? "complete" : "profile");
  data.settings.firstFlightTourComplete = Boolean(data.settings.firstFlightTourComplete || data.settings.coachMessages.setupComplete);
  const injury=data.settings.injuryProfile||{};
  data.settings.injuryProfile={...defaults.settings.injuryProfile,...injury,restrictedPatterns:Array.isArray(injury.restrictedPatterns)?injury.restrictedPatterns:[],affectedAreas:Array.isArray(injury.affectedAreas)?injury.affectedAreas:[],recoveryHistory:Array.isArray(injury.recoveryHistory)?injury.recoveryHistory:[]};
  if (typeof normalizeEquipmentSettings === "function") normalizeEquipmentSettings();

  data.plan = Array.isArray(data.plan) ? data.plan : [];
  data.plan = data.plan.map((item,index)=>({...item,id:item.id||`plan-${index}-${String(item.day||"day").toLowerCase()}`,status:item.status||(item.done?"completed":"planned"),done:Boolean(item.done||item.status==="completed")}));
  data.history = Array.isArray(data.history) ? data.history : [];
  data.missedSessionLog = Array.isArray(data.missedSessionLog) ? data.missedSessionLog : [];
  const habitDefaults=cloneDefaults().habits;
  data.habits=data.habits&&typeof data.habits==="object"?data.habits:habitDefaults;
  data.habits.items=Array.isArray(data.habits.items)&&data.habits.items.length?data.habits.items:habitDefaults.items;
  data.habits.items=data.habits.items.map((item,index)=>({id:item.id||`habit-${index}`,label:item.label||"Daily habit",icon:item.icon||"✓",custom:Boolean(item.custom)}));
  data.habits.targets={...habitDefaults.targets,...(data.habits.targets||{})};
  ["proteinGrams","hydrationOz","steps","sleepHours","mobilityMinutes"].forEach(key=>data.habits.targets[key]=Math.max(0,Number(data.habits.targets[key])||0));
  data.habits.targets.customized=Boolean(data.habits.targets.customized);
  data.habits.completions=data.habits.completions&&typeof data.habits.completions==="object"?data.habits.completions:{};
  data.exerciseProgression = data.exerciseProgression && typeof data.exerciseProgression === "object" ? data.exerciseProgression : {};
  data.exerciseIntelligence = data.exerciseIntelligence && typeof data.exerciseIntelligence === "object" ? data.exerciseIntelligence : {replacements:[],personalConstraints:[]};
  data.exerciseIntelligence.replacements = Array.isArray(data.exerciseIntelligence.replacements) ? data.exerciseIntelligence.replacements : [];
  data.exerciseIntelligence.personalConstraints = Array.isArray(data.exerciseIntelligence.personalConstraints) ? data.exerciseIntelligence.personalConstraints : [];
  data.mobility = { ...defaults.mobility, ...(data.mobility || {}) };
  data.mobility.completedDates = Array.isArray(data.mobility.completedDates) ? data.mobility.completedDates : [];
  data.mobility.checks = data.mobility.checks || {};
  data.readinessLog = Array.isArray(data.readinessLog) ? data.readinessLog : [];
  data.sessionFeedbackLog = Array.isArray(data.sessionFeedbackLog) ? data.sessionFeedbackLog : [];
  data.pendingFeedbackSessionId = data.pendingFeedbackSessionId || null;
  data.performanceReviews = { ...defaults.performanceReviews, ...(data.performanceReviews || {}) };
  data.performanceReviews.weeklySeen = Array.isArray(data.performanceReviews.weeklySeen) ? data.performanceReviews.weeklySeen : [];
  data.performanceReviews.blockReviews = Array.isArray(data.performanceReviews.blockReviews) ? data.performanceReviews.blockReviews : [];
  data.performanceReviews.milestones = Array.isArray(data.performanceReviews.milestones) ? data.performanceReviews.milestones : [];
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
  localStorage.removeItem(STORAGE_KEY);
  data = cloneDefaults();
  delete data.missionPlan;
  data.settings.maxes = { bench:null, squat:null, deadlift:null, pushPress:null };
  data.mission = { goalWorkouts:null, goalMobility:null, goalPullups:null, goal5k:null, currentPullups:null, current5k:null };
  data.trainingBlock = cloneDefaults().trainingBlock;
  data.plan = [];
  data.history = [];
  data.exerciseProgression = {};
  data.exerciseIntelligence = { replacements:[], personalConstraints:[] };
  data.habits.targets = {proteinGrams:0,hydrationOz:0,steps:0,sleepHours:0,mobilityMinutes:0,customized:false};
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  window.location.reload();
}

normalizeData();
