"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const appRoot = path.resolve(__dirname, "..");
global.window = global;
global.document = {
  addEventListener: () => {},
  getElementById: () => null,
  querySelectorAll: () => [],
  querySelector: () => null,
  body: { classList: { add() {}, remove() {} } }
};
global.todayKey = () => "2026-08-03";
global.localDateFromKey = key => new Date(`${key}T12:00:00`);
global.readinessScore = () => 95;
global.readinessStatus = () => "GREEN";
global.bellCoachModeEnabled = () => true;
global.saveData = () => {};
global.renderApp = () => {};
global.byId = () => null;
global.data = {
  settings: {
    primaryTrainingIdentity: "Hybrid Athlete",
    trainingAvailability: {
      normalDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      weekOverrides: {}
    }
  },
  trainingBlock: {},
  plan: []
};

for (const file of ["js/event-coaching.js", "js/adaptive-weekly-schedule.js"]) {
  vm.runInThisContext(fs.readFileSync(path.join(appRoot, file), "utf8"), { filename: file });
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const cases = [
  ["5K Race", 10, "5K Race Rehearsal", "long_run", 6],
  ["Cycling Time Trial", 12, "Cycling Event Rehearsal", "cycling_rehearsal", 6],
  ["Triathlon", 16, "Race-Specific Brick", "brick_rehearsal", 6],
  ["HYROX", 12, "HYROX Simulation", "hyrox_simulation", 6],
  ["CrossFit Competition", 10, "Competition Simulation", "crossfit_simulation", 6],
  ["Combat Sports Tournament", 10, "Tournament Round Simulation", "tournament_simulation", 6],
  ["Strongman Competition", 12, "Strongman Event Simulation", "strongman_simulation", 6],
  ["Tactical Games", 12, "Full Test / Tactical Simulation", "test_simulation", 6],
  ["Military / Law-Enforcement Fitness Test", 10, "Full Test / Tactical Simulation", "test_simulation", 6],
  ["Obstacle Course Race", 12, "OCR Course Simulation", "course_simulation", 6],
  ["Bodybuilding / Physique Competition", 20, "Physique Lower A", "resistance_lower", 6]
];

for (const [eventType, lengthWeeks, expectedLabel, expectedRole, expectedCount] of cases) {
  const currentWeek = Math.max(2, lengthWeeks - 2);
  data.trainingBlock = {
    enabled: true,
    currentWeek,
    lengthWeeks,
    trainingDays: 6,
    sessionMinutes: 120,
    startDate: "2026-08-03",
    mission: { path: "event", eventType, eventName: eventType }
  };
  data.plan = [];
  applyEventCoachingArchitecture();
  const routed = bellApplyAvailabilityToWeek(data.trainingBlock, currentWeek, data.plan);
  const target = routed.find(item => item.customLabel === expectedLabel && item.eventRole === expectedRole);
  assert(routed.length === expectedCount, `${eventType}: expected ${expectedCount} routed sessions, observed ${routed.length}`);
  assert(Boolean(target), `${eventType}: missing ${expectedLabel} with role ${expectedRole}`);
  const validation = bellValidateGeneratedWeek(
    routed,
    bellMissionAlignedExposureTargets({ strength: 4, engine: 3 }, data.trainingBlock, bellNormalTrainingDays())
  );
  assert(validation.passed, `${eventType}: routed week failed exposure validation: ${JSON.stringify(validation)}`);
}

data.trainingBlock = {
  enabled: true,
  currentWeek: 8,
  lengthWeeks: 10,
  trainingDays: 6,
  sessionMinutes: 75,
  startDate: "2026-08-03",
  mission: { path: "event", eventType: "Custom Sport Event", eventName: "Custom Field Competition" }
};
data.plan = [];
applyEventCoachingArchitecture();
assert(data.trainingBlock.eventScopeStatus === "SCOPE_LIMITED", "Custom event without demand profile must be SCOPE_LIMITED");
assert(data.plan.every(item => item.eventScopeStatus === "SCOPE_LIMITED"), "Custom event sessions must preserve the scope boundary");

console.log(`PASS: ${cases.length} canonical event routes preserved; undefined custom event is SCOPE_LIMITED.`);
