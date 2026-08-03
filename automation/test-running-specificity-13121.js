"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");
const appRoot = path.resolve(__dirname, "..");

global.window = global;
global.document = { addEventListener: () => {}, getElementById: () => null, querySelectorAll: () => [], querySelector: () => null, body: { classList: { add() {}, remove() {} } } };
global.data = {
  settings: {
    primaryTrainingIdentity: "Endurance Athlete",
    trainingExperience: "Intermediate",
    trainingAvailability: { normalDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"], weekOverrides: {} }
  },
  trainingBlock: {},
  plan: [],
  dayNavigation: {}
};
global.todayKey = () => "2026-08-03";
global.localDateFromKey = key => new Date(`${key}T12:00:00`);
global.addLocalDays = (key, days) => { const d = new Date(`${key}T12:00:00`); d.setDate(d.getDate() + days); return d.toISOString().slice(0, 10); };
global.readinessScore = () => 95;
global.readinessStatus = () => "GREEN";
global.bellCoachModeEnabled = () => true;
global.saveData = () => {};
global.renderApp = () => {};
global.byId = () => null;
global.getWorkoutLabel = name => name;
global.CUSTOM_TEMPLATES = {};
global.buildCurrentWeekPlan = () => { data.plan = []; };
global.bpGenerateWeekForBlock = () => [];
global.bpPrepareBlockPlan = () => {};
global.bpLoadActiveWeekFromPlan = () => {};
global.bpPhaseForWeek = () => null;

const warnings = [];
const originalWarn = console.warn;
console.warn = (...args) => warnings.push(args.map(String).join(" "));
for (const file of ["js/event-coaching.js", "js/adaptive-weekly-schedule.js", "js/longitudinal-coaching-1390.js"]) {
  vm.runInThisContext(fs.readFileSync(path.join(appRoot, file), "utf8"), { filename: file });
}

function assert(condition, message) { if (!condition) throw new Error(message); }
const events = [
  ["5K Race", 10, 75],
  ["10K Race", 12, 75],
  ["Half Marathon", 16, 105],
  ["Marathon", 20, 120]
];
const doses = [];
for (const [eventType, lengthWeeks, sessionMinutes] of events) {
  const block = {
    enabled: true,
    currentWeek: 1,
    lengthWeeks,
    trainingDays: 6,
    sessionMinutes,
    startDate: "2026-08-03",
    generatedAt: `route-${eventType}`,
    mission: { path: "event", eventType, eventName: eventType },
    weeks: []
  };
  data.trainingBlock = block;
  const plan = bpGenerateWeekForBlock(block, lengthWeeks - 2);
  const token = eventType.replace(/\s+Race$/i, "").toLowerCase();
  assert(plan.length === 6, `${eventType}: expected six event-preparation sessions, observed ${plan.length}`);
  assert(plan.some(item => String(item.customLabel || "").toLowerCase().includes(token)), `${eventType}: athlete-facing event identity missing`);
  const rehearsal = plan.find(item => item.enduranceRole === "race_rehearsal");
  assert(Boolean(rehearsal), `${eventType}: race rehearsal role missing`);
  doses.push(Number(rehearsal.prescribedDuration) || 0);
}
assert(doses.every((value, index) => index === 0 || value >= doses[index - 1]), `Running doses are not monotonic: ${doses.join(", ")}`);
assert(doses[doses.length - 1] - doses[0] >= 30, `Running dose separation is too small: ${doses.join(", ")}`);
assert(!warnings.some(text => text.includes("weekly exposure validation failed")), `Unexpected exposure warning: ${warnings.join(" | ")}`);
console.warn = originalWarn;
console.log(`PASS: running event identity and dose differentiation preserved (${doses.join(" / ")} minutes).`);
