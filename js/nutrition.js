"use strict";

function macroTargets() {
  const n = data.nutrition;
  const kg = (Number(data.settings.weight) || 207) * 0.453592;
  const cm = (Number(n.height) || 66) * 2.54;
  const age = Number(n.age) || 41;

  const bmr = 10 * kg + 6.25 * cm - 5 * age + 5;
  let calories = Math.round((bmr * (Number(n.activity) || 1.55)) / 50) * 50;

  if (n.goal === "cut") calories -= 450;
  if (n.goal === "gain") calories += 250;

  const next = currentPlan();
  const trainingDay = Boolean(next && !next.mission.startsWith("M-") && !next.mission.startsWith("R-1"));
  if (!trainingDay) calories -= 150;

  calories = Math.max(1600, calories);
  const protein = Math.round(Math.min(Number(data.settings.weight) || 207, (Number(data.settings.goal) || 185) * 1.05) / 5) * 5;
  const fat = Math.round(((Number(data.settings.weight) || 207) * 0.32) / 5) * 5;
  const carbs = Math.max(50, Math.round((calories - protein * 4 - fat * 9) / 4 / 5) * 5);

  return { calories, protein, fat, carbs, trainingDay };
}

function saveNutritionSettings() {
  data.nutrition.height = +document.getElementById("heightInput").value || 66;
  data.nutrition.age = +document.getElementById("ageInput").value || 41;
  data.nutrition.activity = +document.getElementById("activityInput").value || 1.55;
  data.nutrition.goal = document.getElementById("nutritionGoalInput").value || "cut";
  saveData();
}
