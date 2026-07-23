"use strict";

function workoutXP() { return data.history.length * 100; }
function mobilityXP() { return data.mobility.completedDates.length * 40; }
function readinessXP() { return data.readinessLog.filter(entry => entry.score >= 75).length * 10; }
function totalXP() { return workoutXP() + mobilityXP() + readinessXP(); }

function rankInfo() {
  const xp = totalXP();
  const levels = [
    [0, "Foundation Athlete"],
    [500, "Developing Athlete"],
    [1200, "Hybrid Athlete"],
    [2500, "Tactical Athlete"],
    [4500, "Performance Athlete"],
    [7000, "Lifetime Athlete"]
  ];

  let index = 0;
  for (let i = 0; i < levels.length; i += 1) {
    if (xp >= levels[i][0]) index = i;
  }

  const current = levels[index];
  const next = levels[Math.min(index + 1, levels.length - 1)];
  const pct = index === levels.length - 1
    ? 100
    : Math.round(((xp - current[0]) / (next[0] - current[0])) * 100);

  return { xp, rank: current[1], level: index + 1, pct, next: next[0] };
}

function missionProgress() {
  const workouts = data.history.length;
  const mobility = data.mobility.completedDates.length;
  const startWeight = 207;
  const currentWeight = Number(data.settings.weight) || startWeight;
  const goalWeight = Number(data.settings.goal) || 185;
  const weightPct = goalWeight === startWeight
    ? 100
    : Math.max(0, Math.min(100, Math.round(((startWeight - currentWeight) / (startWeight - goalWeight)) * 100)));

  return {
    workouts,
    mobility,
    weightPct,
    workoutPct: Math.min(100, Math.round((workouts / Math.max(1, Number(data.mission.goalWorkouts)||40)) * 100)),
    mobilityPct: Math.min(100, Math.round((mobility / Math.max(1, Number(data.mission.goalMobility)||30)) * 100))
  };
}

function saveMissionGoals() {
  const readGoal=id=>{const raw=document.getElementById(id)?.value;const value=Number(raw);return raw!==""&&Number.isFinite(value)&&value>0?value:null;};
  data.mission.goalWorkouts = readGoal("goalWorkouts");
  data.mission.goalMobility = readGoal("goalMobility");
  data.mission.goalPullups = readGoal("goalPullups");
  data.mission.goal5k = readGoal("goal5k");
  saveData();
}
