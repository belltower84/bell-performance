"use strict";

function readinessScore() {
  const r = data.settings.readiness;
  const n = (value, fallback) => Number.isFinite(+value) ? +value : fallback;

  const sleepHours = n(r.sleepHours, 7);
  const sleepQuality = n(r.sleepQuality, 4);
  const energyValue = n(r.energy, 4);
  const motivationValue = n(r.motivation, 4);
  const stressValue = n(r.stress, 3);
  const sorenessValue = n(r.soreness, 3);
  const jointPainValue = n(r.jointPain, 0);
  const restingHrValue = n(r.restingHr, 0);

  const sleepHoursScore = Math.max(0, Math.min(100, ((sleepHours - 4) / 4) * 100));
  const sleepQualityScore = (sleepQuality / 5) * 100;
  const energyScore = (energyValue / 5) * 100;
  const motivationScore = (motivationValue / 5) * 100;
  const stressScore = ((6 - stressValue) / 5) * 100;
  const sorenessScore = ((6 - sorenessValue) / 5) * 100;
  const jointPainScore = ((5 - jointPainValue) / 5) * 100;
  const hrScore = [100, 80, 55, 25][restingHrValue] ?? 100;

  let score =
    sleepHoursScore * 0.20 +
    sleepQualityScore * 0.15 +
    energyScore * 0.20 +
    motivationScore * 0.10 +
    stressScore * 0.15 +
    sorenessScore * 0.10 +
    jointPainScore * 0.05 +
    hrScore * 0.05;

  if (jointPainValue >= 4) score = Math.min(score, 49);
  if (sleepHours < 4.5) score = Math.min(score, 49);

  return Math.max(0, Math.min(100, Math.round(score)));
}

function readinessStatus(score = readinessScore()) {
  if (score >= 75) return "GREEN";
  if (score >= 50) return "YELLOW";
  return "RED";
}

function scalingProfile() {
  const status = readinessStatus();
  if (status === "GREEN") {
    return { status, load: 1, sets: 1, conditioning: 1, label: "GREEN — full prescribed workout" };
  }
  if (status === "YELLOW") {
    return { status, load: 0.90, sets: 0.70, conditioning: 0.75, label: "YELLOW — 10% lighter, about 30% fewer working sets" };
  }
  return { status, load: 0.75, sets: 0.45, conditioning: 0.50, label: "RED — 25% lighter, about half the working sets, no hard conditioning" };
}

function saveReadiness() {
  data.settings.readiness = {
    sleepHours: +document.getElementById("sleepHours").value,
    sleepQuality: +document.getElementById("sleepQuality").value,
    energy: +document.getElementById("energy").value,
    motivation: +document.getElementById("motivation").value,
    stress: +document.getElementById("stress").value,
    soreness: +document.getElementById("soreness").value,
    jointPain: +document.getElementById("jointPain").value,
    restingHr: +document.getElementById("restingHr").value
  };

  data.settings.readiness.score = readinessScore();
  data.settings.readiness.status = readinessStatus(data.settings.readiness.score);

  const key = todayKey();
  const index = data.readinessLog.findIndex(entry => entry.date === key);
  const entry = {
    date: key,
    score: data.settings.readiness.score,
    status: data.settings.readiness.status
  };
  if (index >= 0) data.readinessLog[index] = entry;
  else data.readinessLog.push(entry);

  saveData();
  alert(`Readiness updated: ${entry.status} (${entry.score}/100). Today's workout has been scaled automatically.`);
}
