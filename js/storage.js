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
    appControlMode: "coach",
    rotationWeek: 1,
    maxes: { bench: null, squat: null, deadlift: null, pushPress: null },
    readiness: { checkInVersion:"", sleepState:"", bodyState:"", energyState:"", painToday:false, painNotes:"", timeMinutes:45, sleepHours:7, sleepMinutes:30, sleepQuality:4, energy:4, motivation:4, recoveryStatus:4, timeAvailability:3, score:null, status:"", lastPromptDate:"" },
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
  coachingState: null,
  coachIntelligence: { schemaVersion:1, memories:[], dismissedMemoryKeys:[], decisions:[], summaries:[], lastAnalyzedAt:"", lastPhaseFingerprint:"", processedSourceRefs:[] },
  athleteProfile: {
    schemaVersion: 1,
    demographics: { firstName:"", age:null, sex:"Prefer not to say", heightInches:null, bodyweightLb:null, goalWeightLb:null },
    identity: { primary:"Performance & Health", objective:"Continuous Development", journeyMode:"continuous_development", journeyName:"", eventName:"", eventDate:"" },
    experience: { level:"Intermediate", trainingAgeYears:null },
    availability: { normalDays:[], sessionMinutes:60, preferredTime:"Flexible", reliability:"Mostly consistent", minimumDays:3 },
    baselines: { maxes:{ bench:null, squat:null, deadlift:null, pushPress:null } },
    recovery: { sleepTargetHours:8, deloadPreference:"Bell decides", limitationStatus:"none" },
    coaching: { controlMode:"coach", style:"Performance", detailLevel:"Balanced", checkInFrequency:"Weekly", scriptureFrequency:"Occasionally", memoryEnabled:true, showConfidence:true },
    profileCompleteness: 0,
    updatedAt:""
  },
  mobility: { focus: "Auto", minutes: 10, completedDates: [], checks: {} },
  readinessLog: [],
  sessionFeedbackLog: [],
  responseEngine: { schemaVersion:3, decisions:[], exerciseDecisions:{}, lastEvaluation:null, trend:{}, longitudinalState:null, prescriptionApplications:[], lastApplication:null },
  pendingFeedbackSessionId: null,
  dayNavigation: { selectedDate: "", lastLocalDate: "" },
  performanceReviews: { weeklySeen:[], blockReviews:[], milestones:[], weeklyDebriefs:[] },
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
  nutrition: { height: null, age: null, activity: 1.55, goal: "maintain", manualGoal: "maintain", goalMode: "auto" },
  trainingBlock: {
    enabled: false, goalType: "General Hybrid", targetDate: "", targetMinutes: 60,
    lengthWeeks: 12, currentWeek: 1, trainingDays: 5, runDays: 3, strengthDays: 3,
    sessionMinutes: 75, secondaryGoal: "Maintain Strength", maintainStrength: true, bodybuildingFocus: "Balanced", bodybuildingPhase: "Recomposition", startDate: "", generatedAt: ""
  }
};

const STORAGE_KEY = "bellPerformanceV2";
const STORAGE_RECOVERY_KEY = "bellPerformanceV2Recovery";
const STORAGE_SCHEMA_VERSION = 4;
const STORAGE_SOFT_LIMIT_BYTES = 3_600_000;
const STORAGE_RECENT_HISTORY_LIMIT = 140;
const STORAGE_RECENT_DECISION_LIMIT = 120;
const STORAGE_RECENT_APPLICATION_LIMIT = 120;
const STORAGE_SUMMARY_LIMIT = 1200;
const STORAGE_DB_NAME = "bellPerformanceDurable";
const STORAGE_DB_VERSION = 1;
let durableArchiveQueue = [];
let durableArchiveFlushPending = false;

function storageBytes(value) {
  try { return new Blob([typeof value === "string" ? value : JSON.stringify(value)]).size; }
  catch { return String(typeof value === "string" ? value : JSON.stringify(value || null)).length * 2; }
}

function durableSummary(record, collection) {
  const source = record && typeof record === "object" ? record : {};
  return {
    archiveId: source.id || source.sessionId || source.completionId || source.applicationId || `${collection}-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,
    collection,
    date: source.date || source.completedAt || source.createdAt || source.timestamp || source.evaluatedAt || "",
    channel: source.channel || source.sessionChannel || source.type || "",
    status: source.status || source.decision || source.finalStatus || source.result || "",
    sessionId: source.sessionId || source.targetSessionId || source.planSessionId || "",
    goal: source.goal || source.objective || source.goalType || "",
    rpe: Number.isFinite(Number(source.rpe ?? source.sessionRpe)) ? Number(source.rpe ?? source.sessionRpe) : null,
    readiness: Number.isFinite(Number(source.readinessScore ?? source.readiness?.score)) ? Number(source.readinessScore ?? source.readiness?.score) : null,
    compactedAt: new Date().toISOString()
  };
}

function openDurableStorage() {
  if (typeof indexedDB === "undefined") return Promise.resolve(null);
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(STORAGE_DB_NAME, STORAGE_DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains("archive")) {
        const store = db.createObjectStore("archive", { keyPath:"archiveKey" });
        store.createIndex("collection", "collection", { unique:false });
        store.createIndex("date", "date", { unique:false });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function flushDurableArchiveQueue() {
  if (durableArchiveFlushPending || !durableArchiveQueue.length) return;
  durableArchiveFlushPending = true;
  const batch = durableArchiveQueue.splice(0, durableArchiveQueue.length);
  try {
    const db = await openDurableStorage();
    if (!db) return;
    await new Promise((resolve, reject) => {
      const transaction = db.transaction("archive", "readwrite");
      const store = transaction.objectStore("archive");
      batch.forEach(item => store.put(item));
      transaction.oncomplete = resolve;
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error || new Error("Archive transaction aborted"));
    });
    db.close();
    if (data?.storageDurability) {
      data.storageDurability.lastArchiveWriteAt = new Date().toISOString();
      data.storageDurability.lastArchiveError = "";
    }
  } catch (error) {
    durableArchiveQueue.unshift(...batch.slice(-500));
    if (data?.storageDurability) data.storageDurability.lastArchiveError = String(error?.message || error);
  } finally {
    durableArchiveFlushPending = false;
    if (durableArchiveQueue.length) setTimeout(flushDurableArchiveQueue, 50);
  }
}

function queueDurableArchive(collection, records) {
  if (!Array.isArray(records) || !records.length) return;
  const athleteId = data?.athleteProfile?.id || data?.athleteProfile?.demographics?.firstName || "default-athlete";
  records.forEach((record, index) => {
    const summary = durableSummary(record, collection);
    durableArchiveQueue.push({
      archiveKey: `${athleteId}:${collection}:${summary.archiveId}:${summary.date || index}`,
      athleteId,
      collection,
      date: summary.date,
      summary,
      record,
      archivedAt: new Date().toISOString()
    });
  });
  setTimeout(flushDurableArchiveQueue, 0);
}

function ensureStorageDurability() {
  const current = data.storageDurability && typeof data.storageDurability === "object" ? data.storageDurability : {};
  data.storageDurability = {
    schemaVersion: STORAGE_SCHEMA_VERSION,
    archiveCounts: { ...(current.archiveCounts || {}) },
    summaries: Array.isArray(current.summaries) ? current.summaries : [],
    lastCompactionAt: current.lastCompactionAt || "",
    lastArchiveWriteAt: current.lastArchiveWriteAt || "",
    lastArchiveError: current.lastArchiveError || "",
    lastPersistedBytes: Number(current.lastPersistedBytes) || 0,
    peakPersistedBytes: Number(current.peakPersistedBytes) || 0,
    compactionRuns: Number(current.compactionRuns) || 0,
    recoveredWrites: Number(current.recoveredWrites) || 0
  };
}

function compactArray(collection, array, keep) {
  if (!Array.isArray(array) || array.length <= keep) return array;
  const removed = array.splice(0, array.length - keep);
  queueDurableArchive(collection, removed);
  ensureStorageDurability();
  data.storageDurability.archiveCounts[collection] = (Number(data.storageDurability.archiveCounts[collection]) || 0) + removed.length;
  const summaries = removed.map(item => durableSummary(item, collection));
  data.storageDurability.summaries.push(...summaries);
  if (data.storageDurability.summaries.length > STORAGE_SUMMARY_LIMIT) {
    data.storageDurability.summaries.splice(0, data.storageDurability.summaries.length - STORAGE_SUMMARY_LIMIT);
  }
  return array;
}

function compactDataForPersistence({ aggressive = false } = {}) {
  ensureStorageDurability();
  const before = storageBytes(data);
  const historyKeep = aggressive ? 90 : STORAGE_RECENT_HISTORY_LIMIT;
  const decisionKeep = aggressive ? 80 : STORAGE_RECENT_DECISION_LIMIT;
  const applicationKeep = aggressive ? 80 : STORAGE_RECENT_APPLICATION_LIMIT;
  compactArray("history", data.history, historyKeep);
  if (data.responseEngine) {
    compactArray("responseDecisions", data.responseEngine.decisions, decisionKeep);
    compactArray("prescriptionApplications", data.responseEngine.prescriptionApplications, applicationKeep);
  }
  if (data.coachIntelligence) compactArray("coachDecisions", data.coachIntelligence.decisions, decisionKeep);
  if (data.sessionFeedbackLog) compactArray("sessionFeedback", data.sessionFeedbackLog, aggressive ? 80 : 120);
  if (data.readinessLog) compactArray("readiness", data.readinessLog, aggressive ? 100 : 180);
  if (data.missedSessionLog) compactArray("missedSessions", data.missedSessionLog, 100);
  if (data.performanceReviews) {
    compactArray("weeklyDebriefs", data.performanceReviews.weeklyDebriefs, 80);
    compactArray("blockReviews", data.performanceReviews.blockReviews, 40);
  }
  data.storageDurability.lastCompactionAt = new Date().toISOString();
  data.storageDurability.compactionRuns += 1;
  data.storageDurability.lastCompaction = { beforeBytes:before, afterBytes:storageBytes(data), aggressive };
}

function storageDiagnostics() {
  ensureStorageDurability();
  return {
    schemaVersion: STORAGE_SCHEMA_VERSION,
    localBytes: storageBytes(data),
    archiveQueue: durableArchiveQueue.length,
    archiveCounts: { ...data.storageDurability.archiveCounts },
    summaryCount: data.storageDurability.summaries.length,
    lastCompactionAt: data.storageDurability.lastCompactionAt,
    lastArchiveWriteAt: data.storageDurability.lastArchiveWriteAt,
    lastArchiveError: data.storageDurability.lastArchiveError
  };
}
window.bellStorageDiagnostics = storageDiagnostics;


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
  data.settings.appControlMode = data.settings.appControlMode === "planner" ? "planner" : "coach";
  data.settings.rotationWeek = Math.min(4, Math.max(1, Number(data.settings.rotationWeek) || 1));
  data.settings.maxes = {
    bench: Number(data.settings.maxes?.bench) || null,
    squat: Number(data.settings.maxes?.squat) || null,
    deadlift: Number(data.settings.maxes?.deadlift) || null,
    pushPress: Number(data.settings.maxes?.pushPress) || null
  };

  const old = data.settings.readiness || {};
  const migrateTen = (value, fallback) => {
    const number=Number(value); if(!Number.isFinite(number))return fallback;
    return number<=5?Math.max(1,Math.min(10,Math.round((number-1)*2.25+1))):Math.max(1,Math.min(10,Math.round(number)));
  };
  const toFive = (value, fallback=4) => {
    const number=Number(value); if(!Number.isFinite(number))return fallback;
    if(number<=5)return Math.max(1,Math.min(5,Math.round(number)));
    return Math.max(1,Math.min(5,Math.round(1+(number-1)*4/9)));
  };
  const legacySoreness=Number(old.soreness);
  const migratedRecovery=Number.isFinite(+old.recoveryStatus)
    ? toFive(old.recoveryStatus,4)
    : Number.isFinite(legacySoreness)
      ? Math.max(1,Math.min(5,Math.round(5-(legacySoreness-1)*4/9)))
      : 4;
  const normalizedTimeAvailability=Math.max(1,Math.min(7,Number.isFinite(+old.timeAvailability)?Math.round(+old.timeAvailability):3));
  const normalizedTimeMinutes=Number.isFinite(+old.timeMinutes)&&+old.timeMinutes>=30?Math.min(120,Math.round(+old.timeMinutes)):({1:30,2:45,3:60,4:75,5:90,6:105,7:120})[normalizedTimeAvailability];
  data.settings.readiness = {
    checkInVersion: old.checkInVersion === "quick-v1" ? "quick-v1" : "",
    sleepState: ["poor","okay","good"].includes(old.sleepState) ? old.sleepState : "",
    bodyState: ["beat-up","normal","fresh"].includes(old.bodyState) ? old.bodyState : "",
    energyState: ["drained","steady","fired-up"].includes(old.energyState) ? old.energyState : "",
    painToday: Boolean(old.painToday),
    painNotes: typeof old.painNotes === "string" ? old.painNotes : "",
    timeMinutes: normalizedTimeMinutes,
    sleepHours: Math.max(0,Math.min(16,Number.isFinite(+old.sleepHours)?+old.sleepHours:7)),
    sleepMinutes: Math.max(0,Math.min(59,Number.isFinite(+old.sleepMinutes)?+old.sleepMinutes:30)),
    sleepQuality: toFive(old.sleepQuality ?? old.sleep,4),
    energy: toFive(old.energy,4),
    motivation: toFive(old.motivation,4),
    recoveryStatus: migratedRecovery,
    timeAvailability: normalizedTimeAvailability,
    score: Number.isFinite(+old.score) ? +old.score : null,
    status: old.status || "",
    lastPromptDate: old.lastPromptDate || ""
  };
  data.settings.coachMessages = { ...defaults.settings.coachMessages, ...(data.settings.coachMessages || {}) };
  data.athleteProfile = data.athleteProfile && typeof data.athleteProfile === "object" ? data.athleteProfile : cloneDefaults().athleteProfile;
  data.athleteProfile.coaching = { ...cloneDefaults().athleteProfile.coaching, ...(data.athleteProfile.coaching || {}) };
  data.athleteProfile.coaching.controlMode = data.athleteProfile.coaching.controlMode === "planner" ? "planner" : data.settings.appControlMode;
  data.settings.firstFlightStage = data.settings.firstFlightStage || (data.settings.coachMessages.setupComplete ? "complete" : "profile");
  data.settings.firstFlightTourComplete = data.settings.pendingFirstFlightTour ? false : Boolean(data.settings.firstFlightTourComplete || data.settings.coachMessages.setupComplete);
  const injury=data.settings.injuryProfile||{};
  data.settings.injuryProfile={...defaults.settings.injuryProfile,...injury,restrictedPatterns:Array.isArray(injury.restrictedPatterns)?injury.restrictedPatterns:[],affectedAreas:Array.isArray(injury.affectedAreas)?injury.affectedAreas:[],recoveryHistory:Array.isArray(injury.recoveryHistory)?injury.recoveryHistory:[]};
  if (typeof normalizeEquipmentSettings === "function") normalizeEquipmentSettings();

  data.plan = Array.isArray(data.plan) ? data.plan : [];
  data.plan = data.plan.map((item,index)=>({...item,id:item.id||`plan-${index}-${String(item.day||"day").toLowerCase()}`,status:item.status||(item.done?"completed":"planned"),done:Boolean(item.done||item.status==="completed"),sessionCompletions:item.sessionCompletions&&typeof item.sessionCompletions==="object"?item.sessionCompletions:{}}));
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
  const response=data.responseEngine&&typeof data.responseEngine==="object"?data.responseEngine:{};
  // Preserve the complete adaptive-coaching state across reloads. Earlier normalization
  // rebuilt responseEngine from a small allow-list and silently discarded longitudinal
  // state plus closed-loop application records.
  data.responseEngine={
    ...response,
    schemaVersion:Math.max(3,Number(response.schemaVersion)||0),
    decisions:Array.isArray(response.decisions)?response.decisions:[],
    exerciseDecisions:response.exerciseDecisions&&typeof response.exerciseDecisions==="object"?response.exerciseDecisions:{},
    lastEvaluation:response.lastEvaluation||null,
    trend:response.trend&&typeof response.trend==="object"?response.trend:{},
    longitudinalState:response.longitudinalState&&typeof response.longitudinalState==="object"?response.longitudinalState:null,
    prescriptionApplications:Array.isArray(response.prescriptionApplications)?response.prescriptionApplications:[],
    lastApplication:response.lastApplication&&typeof response.lastApplication==="object"?response.lastApplication:null
  };
  const coachDefaults=cloneDefaults().coachIntelligence;
  data.coachIntelligence=data.coachIntelligence&&typeof data.coachIntelligence==="object"?data.coachIntelligence:coachDefaults;
  data.coachIntelligence={...coachDefaults,...data.coachIntelligence};
  data.coachIntelligence.memories=Array.isArray(data.coachIntelligence.memories)?data.coachIntelligence.memories:[];
  data.coachIntelligence.dismissedMemoryKeys=Array.isArray(data.coachIntelligence.dismissedMemoryKeys)?data.coachIntelligence.dismissedMemoryKeys:[];
  data.coachIntelligence.decisions=Array.isArray(data.coachIntelligence.decisions)?data.coachIntelligence.decisions:[];
  data.coachIntelligence.summaries=Array.isArray(data.coachIntelligence.summaries)?data.coachIntelligence.summaries:[];
  data.coachIntelligence.processedSourceRefs=Array.isArray(data.coachIntelligence.processedSourceRefs)?data.coachIntelligence.processedSourceRefs:[];
  data.performanceReviews = data.performanceReviews && typeof data.performanceReviews === "object" ? data.performanceReviews : {weeklySeen:[],blockReviews:[],milestones:[],weeklyDebriefs:[]};
  data.performanceReviews.weeklySeen = Array.isArray(data.performanceReviews.weeklySeen) ? data.performanceReviews.weeklySeen : [];
  data.performanceReviews.blockReviews = Array.isArray(data.performanceReviews.blockReviews) ? data.performanceReviews.blockReviews : [];
  data.performanceReviews.milestones = Array.isArray(data.performanceReviews.milestones) ? data.performanceReviews.milestones : [];
  data.performanceReviews.weeklyDebriefs = Array.isArray(data.performanceReviews.weeklyDebriefs) ? data.performanceReviews.weeklyDebriefs : [];
  data.pendingFeedbackSessionId = data.pendingFeedbackSessionId || null;
  data.dayNavigation = { ...defaults.dayNavigation, ...(data.dayNavigation || {}) };
  data.dayNavigation.selectedDate = /^\d{4}-\d{2}-\d{2}$/.test(data.dayNavigation.selectedDate || "") ? data.dayNavigation.selectedDate : "";
  data.dayNavigation.lastLocalDate = /^\d{4}-\d{2}-\d{2}$/.test(data.dayNavigation.lastLocalDate || "") ? data.dayNavigation.lastLocalDate : "";
  data.performanceReviews = { ...defaults.performanceReviews, ...(data.performanceReviews || {}) };
  data.performanceReviews.weeklySeen = Array.isArray(data.performanceReviews.weeklySeen) ? data.performanceReviews.weeklySeen : [];
  data.performanceReviews.blockReviews = Array.isArray(data.performanceReviews.blockReviews) ? data.performanceReviews.blockReviews : [];
  data.performanceReviews.milestones = Array.isArray(data.performanceReviews.milestones) ? data.performanceReviews.milestones : [];
  data.mission = { ...defaults.mission, ...(data.mission || {}) };
  data.nutrition = { ...defaults.nutrition, ...(data.nutrition || {}) };
  data.nutrition.goalMode = data.nutrition.goalMode === "manual" ? "manual" : "auto";
  data.nutrition.manualGoal = ["cut","maintain","gain"].includes(data.nutrition.manualGoal) ? data.nutrition.manualGoal : (data.nutrition.goal || "maintain");
  data.trainingBlock = { ...defaults.trainingBlock, ...(data.trainingBlock || {}) };
  data.trainingBlock.currentWeek = Math.max(1, Math.min(Number(data.trainingBlock.lengthWeeks) || 12, Number(data.trainingBlock.currentWeek) || 1));
  data.coachingState = data.coachingState && typeof data.coachingState === "object" ? data.coachingState : null;

  const priorProfile = data.athleteProfile && typeof data.athleteProfile === "object" ? data.athleteProfile : {};
  const priorDemographics = priorProfile.demographics || {};
  const priorIdentity = priorProfile.identity || {};
  const priorExperience = priorProfile.experience || {};
  const priorAvailability = priorProfile.availability || {};
  const priorBaselines = priorProfile.baselines || {};
  const priorRecovery = priorProfile.recovery || {};
  const priorCoaching = priorProfile.coaching || {};
  const legacyIdentity = data.settings.primaryTrainingIdentity || data.settings.athleteMode || "Performance & Health";
  const legacyObjective = data.settings.secondaryTrainingGoal || data.trainingBlock.secondaryGoal || (data.nutrition.goal === "cut" ? "Lose Fat" : data.nutrition.goal === "gain" ? "Build Muscle" : "Continuous Development");
  const legacyMission = data.trainingBlock.mission || {};
  const legacyEventDate = legacyMission.eventDate || data.trainingBlock.targetDate || data.settings.secondaryTargetDate || "";
  const legacyMode = legacyMission.path === "event" || Boolean(legacyEventDate && /meet|competition|race|marathon|5k|10k|selection|event/i.test(String(legacyMission.eventType || legacyObjective))) ? "event_preparation" : "continuous_development";
  const normalDays = Array.isArray(priorAvailability.normalDays) && priorAvailability.normalDays.length
    ? priorAvailability.normalDays
    : Array.isArray(data.settings.trainingAvailability?.normalDays) ? data.settings.trainingAvailability.normalDays : Array.isArray(data.trainingBlock.availableDays) ? data.trainingBlock.availableDays : [];
  data.athleteProfile = {
    ...defaults.athleteProfile,
    ...priorProfile,
    schemaVersion: 1,
    demographics: {
      ...defaults.athleteProfile.demographics,
      ...priorDemographics,
      firstName: priorDemographics.firstName || data.settings.athleteName || "",
      age: Number(priorDemographics.age) || Number(data.nutrition.age) || null,
      sex: priorDemographics.sex || data.settings.sex || "Prefer not to say",
      heightInches: Number(priorDemographics.heightInches) || Number(data.nutrition.height) || null,
      bodyweightLb: Number(priorDemographics.bodyweightLb) || Number(data.settings.weight) || null,
      goalWeightLb: Number(priorDemographics.goalWeightLb) || Number(data.settings.goal) || null
    },
    identity: {
      ...defaults.athleteProfile.identity,
      ...priorIdentity,
      primary: priorIdentity.primary || legacyIdentity,
      objective: priorIdentity.objective || legacyObjective,
      journeyMode: priorIdentity.journeyMode || legacyMode,
      journeyName: priorIdentity.journeyName || legacyMission.eventName || legacyMission.developmentGoal || "",
      eventName: priorIdentity.eventName || legacyMission.eventName || legacyMission.eventType || "",
      eventDate: priorIdentity.eventDate || legacyEventDate
    },
    experience: {
      ...defaults.athleteProfile.experience,
      ...priorExperience,
      level: priorExperience.level || data.settings.trainingExperience || "Intermediate",
      trainingAgeYears: Number(priorExperience.trainingAgeYears) || null
    },
    availability: {
      ...defaults.athleteProfile.availability,
      ...priorAvailability,
      normalDays: Array.isArray(normalDays) ? normalDays : [],
      sessionMinutes: Number(priorAvailability.sessionMinutes) || Number(data.trainingBlock.sessionMinutes) || 60,
      minimumDays: Math.max(2, Math.min(7, Number(priorAvailability.minimumDays) || Math.min(3, Number(data.trainingBlock.trainingDays) || 3)))
    },
    baselines: {
      ...defaults.athleteProfile.baselines,
      ...priorBaselines,
      maxes: { ...defaults.athleteProfile.baselines.maxes, ...(priorBaselines.maxes || {}), ...data.settings.maxes }
    },
    recovery: { ...defaults.athleteProfile.recovery, ...priorRecovery, limitationStatus: data.settings.injuryProfile?.hasLimitations ? "active" : (priorRecovery.limitationStatus || "none") },
    coaching: {
      ...defaults.athleteProfile.coaching,
      ...priorCoaching,
      style: priorCoaching.style || data.settings.coachMessages?.style || "Performance",
      scriptureFrequency: priorCoaching.scriptureFrequency || data.settings.coachMessages?.scriptureFrequency || "Occasionally"
    },
    profileCompleteness: Math.max(0, Math.min(100, Number(priorProfile.profileCompleteness) || 0)),
    updatedAt: priorProfile.updatedAt || ""
  };
  data.athleteProfile.coaching.memoryEnabled=data.athleteProfile.coaching.memoryEnabled!==false;
  data.athleteProfile.coaching.showConfidence=data.athleteProfile.coaching.showConfidence!==false;

  if (data.activeWorkout && !Array.isArray(data.activeWorkout.exercises)) {
    data.activeWorkout = null;
  }
}

function saveData({ render = true } = {}) {
  ensureStorageDurability();
  let serialized = JSON.stringify(data);
  if (storageBytes(serialized) > STORAGE_SOFT_LIMIT_BYTES || data.history.length > STORAGE_RECENT_HISTORY_LIMIT + 40) {
    compactDataForPersistence({ aggressive:false });
    serialized = JSON.stringify(data);
  }
  if (storageBytes(serialized) > STORAGE_SOFT_LIMIT_BYTES) {
    compactDataForPersistence({ aggressive:true });
    serialized = JSON.stringify(data);
  }
  try {
    localStorage.setItem(STORAGE_KEY, serialized);
    localStorage.removeItem(STORAGE_RECOVERY_KEY);
    data.storageDurability.lastPersistedBytes = storageBytes(serialized);
    data.storageDurability.peakPersistedBytes = Math.max(data.storageDurability.peakPersistedBytes, data.storageDurability.lastPersistedBytes);
  } catch (error) {
    const recovery = {
      savedAt:new Date().toISOString(),
      error:String(error?.message || error),
      activeWorkout:data.activeWorkout || null,
      pendingFeedbackSessionId:data.pendingFeedbackSessionId || null,
      latestHistory:Array.isArray(data.history) ? data.history.slice(-3) : []
    };
    try { localStorage.setItem(STORAGE_RECOVERY_KEY, JSON.stringify(recovery)); } catch {}
    compactDataForPersistence({ aggressive:true });
    serialized = JSON.stringify(data);
    localStorage.setItem(STORAGE_KEY, serialized);
    data.storageDurability.recoveredWrites += 1;
    data.storageDurability.lastPersistedBytes = storageBytes(serialized);
  }
  if (render && typeof renderApp === "function") renderApp();
}

function exportData() {
  ensureStorageDurability();
  const exportPayload = { ...data, storageExport:{ exportedAt:new Date().toISOString(), diagnostics:storageDiagnostics(), note:"Detailed archived records remain in this device's IndexedDB; compact summaries are included here." } };
  const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: "application/json" });
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
ensureStorageDurability();
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
  localStorage.removeItem(STORAGE_RECOVERY_KEY);
  try { indexedDB.deleteDatabase(STORAGE_DB_NAME); } catch {}
  data = cloneDefaults();
  delete data.missionPlan;
  data.settings.maxes = { bench:null, squat:null, deadlift:null, pushPress:null };
  data.mission = { goalWorkouts:null, goalMobility:null, goalPullups:null, goal5k:null, currentPullups:null, current5k:null };
  data.trainingBlock = cloneDefaults().trainingBlock;
  data.plan = [];
  data.history = [];
  data.exerciseProgression = {};
  data.exerciseIntelligence = { replacements:[], personalConstraints:[] };
  data.coachingState = null;
  data.habits.targets = {proteinGrams:0,hydrationOz:0,steps:0,sleepHours:0,mobilityMinutes:0,customized:false};
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  window.location.reload();
}

normalizeData();
ensureStorageDurability();
