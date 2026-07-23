"use strict";

function missionNutritionText() {
  const block = data.trainingBlock || {};
  const mission = block.mission || {};
  return [
    block.goalType,
    block.bodybuildingPhase,
    block.dualGoals?.strengthGoal,
    block.dualGoals?.engineGoal,
    block.dualGoals?.engineMode,
    mission.developmentGoal,
    mission.eventType,
    mission.objective,
    mission.sport,
    mission.secondaryGoal?.type,
    mission.secondaryGoal?.target,
    block.secondaryGoal
  ].filter(Boolean).join(" ").toLowerCase();
}

function inferredNutritionGoal() {
  const manual = data.nutrition?.manualGoal;
  if (data.nutrition?.goalMode === "manual" && ["cut","maintain","gain"].includes(manual)) return manual;
  const values = missionNutritionText();
  if (/fat loss|recomp|recomposition|tone|cut|weight loss/.test(values)) return "cut";
  if (/lean gain|mass|hypertrophy|muscle gain|bodybuilding|physique/.test(values)) return "gain";
  return "maintain";
}

function nutritionMissionProfile() {
  const text = missionNutritionText();
  const primary = String(data.trainingBlock?.mission?.developmentGoal || data.trainingBlock?.mission?.eventType || data.trainingBlock?.goalType || "General Performance");
  const secondary = String(data.trainingBlock?.mission?.secondaryGoal?.type || "");
  let id = "balanced", label = "Balanced Performance", carbBias = 0, proteinPerLb = 0.85, fatPerLb = 0.30, hydrationPerLb = 0.55;
  let focus = "Balanced meals, consistent protein, and enough carbohydrate to support the scheduled work.";

  if (/body recomposition|recomp|fat loss|weight loss|cut|tone/.test(text)) {
    id = "recomposition"; label = "Body Recomposition"; proteinPerLb = 0.95; fatPerLb = 0.28; carbBias = -10;
    focus = "Preserve lean mass with high protein, maintain a controlled calorie deficit, and concentrate carbohydrates around training.";
  } else if (/bodybuilding|physique|hypertrophy|lean gain|muscle gain|mass/.test(text)) {
    id = "hypertrophy"; label = "Strength & Hypertrophy"; proteinPerLb = 0.88; fatPerLb = 0.30; carbBias = 20;
    focus = "Support training volume and recovery with high protein, repeatable meals, and carbohydrate around lifting sessions.";
  } else if (/marathon|half marathon|10k|5k|running|endurance|cycling|triathlon/.test(text)) {
    id = "endurance"; label = "Endurance Preparation"; proteinPerLb = 0.80; fatPerLb = 0.27; carbBias = 45; hydrationPerLb = 0.60;
    focus = "Prioritize carbohydrate availability, hydration, sodium, and recovery while keeping protein high enough to protect lean mass.";
  } else if (/tactical|hybrid|hyrox|tactical games|obstacle|combat|hockey|lacrosse|soccer|sport performance/.test(text)) {
    id = "hybrid"; label = "Hybrid Performance"; proteinPerLb = 0.88; fatPerLb = 0.29; carbBias = 30; hydrationPerLb = 0.60;
    focus = "Fuel repeated high-output work with sufficient carbohydrate while preserving strength, recovery, and body composition.";
  } else if (/powerlifting|strength|power|strongman/.test(text)) {
    id = "strength"; label = "Strength & Power"; proteinPerLb = 0.88; fatPerLb = 0.31; carbBias = 15;
    focus = "Maintain high protein, stable calories, and enough carbohydrate to support heavy training and nervous-system recovery.";
  }

  const secondaryEndurance = /5k|10k|half marathon|marathon|running|endurance/.test(secondary.toLowerCase());
  if (secondaryEndurance && id !== "endurance") {
    carbBias += 20;
    hydrationPerLb = Math.max(hydrationPerLb, 0.60);
    focus += " The secondary endurance goal adds targeted carbohydrate and hydration without replacing the primary goal.";
  }
  return { id, label, carbBias, proteinPerLb, fatPerLb, hydrationPerLb, focus, primary, secondary };
}

function nutritionDayLoad() {
  const sessions = typeof dashboardSessionsForToday === "function" ? dashboardSessionsForToday() : (currentPlan() ? [currentPlan()] : []);
  const strength = sessions.some(item => String(item?.mission || "").startsWith("S-"));
  const engine = sessions.some(item => String(item?.mission || "").startsWith("R-") && !String(item?.mission || "").startsWith("R-1"));
  let engineMinutes = 0;
  sessions.forEach(item => {
    if (!String(item?.mission || "").startsWith("R-") || String(item?.mission || "").startsWith("R-1")) return;
    const template = typeof scaledTemplate === "function" ? scaledTemplate(item.mission) : null;
    engineMinutes += Number(item.prescribedDuration) || Number(template?.duration) || 30;
  });
  return { sessions, strength, engine, engineMinutes, trainingDay: strength || engine, blended: strength && engine };
}

function macroTargets() {
  const n = data.nutrition || {};
  const weight = Number(data.settings.weight) || 0;
  const goalWeight = Number(data.settings.goal) || weight;
  const heightIn = Number(n.height) || 0;
  const age = Number(n.age) || 0;
  const activity = Number(n.activity) || 1.55;
  const goal = inferredNutritionGoal();
  const profile = nutritionMissionProfile();
  const day = nutritionDayLoad();

  if (!weight || !heightIn || !age) {
    return { calories: "—", protein: "—", fat: "—", carbs: "—", hydration: "—", trainingDay: day.trainingDay, blended: day.blended, goal, profile, incomplete: true, detail: "Complete weight, height, and age in Profile to calculate targets.", focus: profile.focus };
  }

  const kg = weight * 0.453592;
  const cm = heightIn * 2.54;
  const sex = data.settings.sex || "Prefer not to say";
  const sexConstant = sex === "Female" ? -161 : sex === "Male" ? 5 : -78;
  const bmr = 10 * kg + 6.25 * cm - 5 * age + sexConstant;
  let calories = bmr * activity;

  if (goal === "cut") calories -= profile.id === "recomposition" ? 300 : 400;
  if (goal === "gain") calories += profile.id === "hypertrophy" ? 250 : 200;
  if (!day.trainingDay) calories -= profile.id === "endurance" ? 75 : 125;
  if (day.strength) calories += profile.id === "hypertrophy" ? 100 : 50;
  if (day.engine) calories += Math.min(350, Math.max(75, Math.round(day.engineMinutes * (profile.id === "endurance" ? 4 : 2.5))));
  if (day.blended) calories += 75;
  if (day.trainingDay) calories += profile.carbBias * 2;

  calories = Math.max(sex === "Female" ? 1300 : 1500, Math.round(calories / 50) * 50);

  const customizedProtein = data.habits?.targets?.customized && Number(data.habits.targets.proteinGrams) > 0 ? Number(data.habits.targets.proteinGrams) : 0;
  let proteinBase = Math.max(goal === "cut" ? goalWeight : 0, weight * profile.proteinPerLb);
  if (goal === "cut") proteinBase = Math.max(proteinBase, weight * 0.90);
  const protein = customizedProtein || Math.round(proteinBase / 5) * 5;
  const fat = Math.max(40, Math.round((weight * profile.fatPerLb) / 5) * 5);
  const baseCarbs = (calories - protein * 4 - fat * 9) / 4;
  const carbs = Math.max(50, Math.round(baseCarbs / 5) * 5);
  const hydration = Math.round((weight * profile.hydrationPerLb + (day.engine ? Math.min(32, day.engineMinutes * 0.35) : 0)) / 5) * 5;
  const dayLabel = day.blended ? "Strength + Engine day" : day.strength ? "Strength day" : day.engine ? `${day.engineMinutes}-minute Engine day` : "Recovery day";
  const secondaryLabel = profile.secondary ? ` • Secondary: ${profile.secondary}` : "";
  const detail = `${profile.label} • ${dayLabel}${secondaryLabel}${customizedProtein ? " • custom protein target" : ""}`;
  const focus = `${profile.focus} Estimated hydration target: about ${hydration} oz today.`;

  return { calories, protein, fat, carbs, hydration, trainingDay: day.trainingDay, blended: day.blended, goal, profile, incomplete: false, detail, focus };
}

function saveNutritionSettings() {
  data.nutrition.height = +document.getElementById("heightInput").value || null;
  data.nutrition.age = +document.getElementById("ageInput").value || null;
  data.nutrition.activity = +document.getElementById("activityInput").value || 1.55;
  data.nutrition.manualGoal = document.getElementById("nutritionGoalInput").value || "maintain";
  data.nutrition.goal = data.nutrition.manualGoal;
  data.nutrition.goalMode = "manual";
  saveData();
}

function useAutomaticNutritionGoal() {
  data.nutrition.goalMode = "auto";
  saveData();
}
