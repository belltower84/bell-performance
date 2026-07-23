"use strict";

function byId(id) {
  return document.getElementById(id);
}

function setText(id, value) {
  const element = byId(id);
  if (element) element.textContent = value;
}

function setValue(id, value) {
  const element = byId(id);
  if (element) element.value = value;
}

function showScreen(name) {
  document.querySelectorAll(".screen").forEach(screen => screen.classList.remove("active"));
  byId(name)?.classList.add("active");
  document.querySelectorAll("nav button").forEach(button => button.classList.remove("active"));
  document.querySelector(`nav button[data-screen="${name}"]`)?.classList.add("active");
  window.scrollTo(0, 0);
}

function renderReadiness() {
  const score = readinessScore();
  const status = readinessStatus(score);
  const explanation = byId("readinessExplanation");
  if (explanation) {
    explanation.textContent = scalingProfile().label;
  }

  const r = data.settings.readiness;
  const weekly = weeklyReadinessSummary();
  setText("weeklyReadinessOut", `${weekly.score}%`);
  setText("weeklyReadinessLabel", weekly.trend === "BUILDING_WELL" ? "Training load is being absorbed well" : weekly.trend === "MANAGE_LOAD" ? "Manage volume and protect recovery" : weekly.trend === "ACCUMULATING_FATIGUE" ? "Fatigue is accumulating — volume is capped" : "Recovery emphasis recommended");
  setText("weeklyReadinessDetail", `${weekly.checkIns} daily check-ins • ${weekly.feedbackCount} post-session reports`);
  ["sleepQuality", "energy", "motivation", "soreness", "timeAvailability"]
    .forEach(id => {
      const element = byId(id);
      if (element) element.value = r[id];
    });
}

function timeGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 18) return "Good Afternoon";
  return "Good Evening";
}

function missionPurpose(template) {
  if (!template) return "Review the weekly plan or build a new training block.";
  const label = (template.label || "").toLowerCase();
  if (label.includes("lower") || label.includes("squat") || label.includes("deadlift")) return "Build lower-body strength, power, and durability without compromising the next conditioning session.";
  if (label.includes("upper") || label.includes("bench") || label.includes("press")) return "Build upper-body strength and athletic muscle while preserving shoulder health.";
  if (label.includes("tempo") || label.includes("interval")) return "Raise sustainable speed and improve race-specific fitness.";
  if (label.includes("long") || label.includes("easy") || label.includes("recovery")) return "Build aerobic capacity at a controlled, recoverable effort.";
  if (label.includes("mobility") || label.includes("reset")) return "Restore useful range of motion and prepare for the next training demand.";
  return "Execute today's work with quality and move the current block forward.";
}

function performanceScores() {
  const readiness = readinessScore();
  const history = data.history || [];
  const recent = history.slice(0, 12);
  const strengthSessions = recent.filter(x => String(x.name || "").startsWith("S-")).length;
  const runSessions = recent.filter(x => String(x.name || "").startsWith("R-")).length;
  const consistency = Math.min(100, Math.round((data.plan.filter(x => x.done).length / Math.max(1, data.plan.length)) * 100));
  const maxes = data.settings.maxes || {};
  const bw = Number(data.settings.weight) || 207;
  const strengthIndex = ((Number(maxes.bench)||0) + (Number(maxes.squat)||0) + (Number(maxes.deadlift)||0)) / Math.max(1, bw * 5.5);
  const strength = Math.max(35, Math.min(98, Math.round(55 + strengthIndex * 25 + strengthSessions * 1.5)));
  const runningBase = data.mission.current5k ? Math.max(35, 100 - Math.round((Number(data.mission.current5k) - 20) * 2.2)) : 55;
  const running = Math.max(35, Math.min(98, Math.round(runningBase + runSessions * 2)));
  const hybrid = Math.round(strength * .35 + running * .30 + readiness * .25 + consistency * .10);
  return { strength, running, recovery: readiness, hybrid, strengthSessions, runSessions };
}


function readinessWord(value, reverse=false) {
  const v = Number(value) || 3;
  if (reverse) return v <= 2 ? "Low" : v === 3 ? "Moderate" : "High";
  return v >= 4 ? "High" : v === 3 ? "Moderate" : "Low";
}
function timeAvailabilityLabel(value) {
  return ({1:"20–30 min",2:"30–45 min",3:"45–60 min",4:"60–75 min",5:"75–90+ min"})[Number(value)] || "45–60 min";
}
function renderVisualProfile(template, status) {
  const sex = data.settings.sex || "Male";
  const female = sex === "Female";
  const cardio = data.settings.cardioType || "Running";
  const strengthArt = byId("strengthArtwork");
  const engineArt = byId("engineArtwork");
  document.body.classList.toggle("female-profile", female);
  if (strengthArt) strengthArt.src = "./assets/strength-power.svg?v=663";
  if (engineArt) engineArt.src = cardio === "Cycling" ? "./assets/engine-route.svg?v=663" : "./assets/engine-route.svg?v=663";
  const r = data.settings.readiness || {};
  setText("dashSleep", readinessWord(r.sleepQuality));
  setText("dashSoreness", readinessWord(r.soreness, true));
  setText("dashEnergy", readinessWord(r.energy));
  setText("dashMotivation", readinessWord(r.motivation));
  setText("dashTime", timeAvailabilityLabel(r.timeAvailability));
  setText("engineSessionTitle", cardio === "Cycling" ? "Zone 2 Cycle" : cardio === "Air Bike" ? "Zone 2 Air Bike" : cardio === "Rower" ? "Zone 2 Row" : "Zone 2 Run");
  setText("engineSessionPurpose", status === "RED" ? "Easy recovery work only." : status === "YELLOW" ? "Controlled aerobic work. Keep it easy." : "Build your base. Fuel your engine.");
  setText("mobilityDashboardTitle", `${data.mobility.minutes || 10} min ${resolvedMobilityFocus()} Mobility`);
  setText("mobilityDashboardDetail", `Matched to today's training • ${data.mobility.completedDates.includes(todayKey()) ? "Completed today ✓" : "Complete morning or evening"}`);
}

function renderDashboard() {
  const profile = scalingProfile();
  const plan = currentPlan();
  const template = plan ? scaledTemplate(plan.mission) : null;
  const rank = rankInfo();
  const mission = missionProgress();
  const macros = macroTargets();
  const block = data.trainingBlock;
  const scores = performanceScores();
  const athleteName = data.settings.athleteName || "Chris";

  setText("greetingOut", `${timeGreeting()}, ${athleteName}`);
  const status = readinessStatus();
  setText("trainingStatusOut", trainingStatusText(status));
  const statusCard = byId("trainingStatusCard");
  if (statusCard) statusCard.className = `training-status ${status.toLowerCase()}`;
  setText("missionBlock", block.enabled ? `${block.goalType} • ${blockPhase()}` : data.settings.phase);
  setText("missionWeek", block.enabled ? `${blockWeek()} of ${block.lengthWeeks}` : "Open plan");
  setText("todayMission", template?.label || plan?.mission || "Plan complete");
  setText("missionPurpose", missionPurpose(template));
  setText("todayDuration", template ? `${template.duration} minutes` : "—");
  setText("todayFocusOut", status === "GREEN" ? "Progress with clean, controlled work" : status === "YELLOW" ? "Protect quality and trim extra volume" : "Restore, move, and prepare for tomorrow");
  renderVisualProfile(template, status);
  byId("todayPreview").innerHTML = template
    ? template.exercises.slice(0, 5).map(exercise => `<span class="preview-block">${exercise.block || "Training"}</span> ${exercise.name}: ${exercise.sets} × ${exercise.reps}`).join("<br>")
    : "";
  const message = selectedCoachMessage();
  const messageCard = byId("coachMessageCard");
  if (messageCard) messageCard.classList.toggle("hidden", !message);
  if (message) { setText("coachMessageOut", `“${message[0]}”`); setText("coachMessageSource", message[1] || "Bell Performance Coach"); }



  if (block.enabled) {
    const week = blockWeek(); const total = block.lengthWeeks; const pct = Math.round((week / total) * 100);
    setText("blockTitle", `${block.goalType} Goal • ${blockPhase()}`);
    const goal = goalProfile(block.goalType);
    const dateText = block.targetDate ? `Target ${new Date(`${block.targetDate}T12:00:00`).toLocaleDateString()}` : `${block.lengthWeeks}-week block`;
    const timeText = goal.category === "endurance" ? ` • ${block.targetMinutes} min goal` : ` • ${block.secondaryGoal || "Balanced development"}`;
    setText("blockStatus", `${dateText}${timeText}`); setText("blockWeekPill", `Week ${week}/${total}`);
    byId("blockProgressBar").style.width = `${pct}%`;
    const easy = cardioPrescriptionForBlock("easy"), quality = cardioPrescriptionForBlock("quality"), long = cardioPrescriptionForBlock("long");
    setText("blockRunSummary", `This week: ${easy.detail} • ${quality.detail} • ${long.detail}`);
    byId("advanceBlockButton").disabled = week >= total;
  } else {
    setText("blockTitle", "No active block"); setText("blockStatus", "Build a goal-based plan in More."); setText("blockWeekPill", "—");
    byId("blockProgressBar").style.width = "0%"; setText("blockRunSummary", "Strength rotation and cardio selection remain available without a block."); byId("advanceBlockButton").disabled = true;
  }
  setText("coachHeadline", block.enabled ? `${blockPhase()} guidance` : "Coach setup");
  setText("coachRecommendation", coachRecommendation());

  byId("cardioType").value = data.settings.cardioType;
  byId("cardioModeNote").textContent = cardioGuidance();
  byId("mobilityFocus").value = data.mobility.focus;
  byId("mobilityMinutes").value = String(data.mobility.minutes);
  const resolved = resolvedMobilityFocus();
  byId("mobilityReason").textContent = data.mobility.focus === "Auto" ? `Auto-selected ${resolved} based on today's training.` : `${resolved} focus selected.`;

  const key = todayKey(); const checks = data.mobility.checks[key] || {}; const list = byId("mobilityList"); list.innerHTML = "";
  dailyMobilityRoutine().forEach((move, index) => { const row = document.createElement("label"); row.className = "mobility-move"; row.innerHTML = `<input type="checkbox" ${checks[index] ? "checked" : ""} onchange="toggleMobilityMove(${index},this.checked)"><div><strong>${move[0]}</strong><div class="hint">${move[1]}</div></div>`; list.appendChild(row); });
  const doneToday = data.mobility.completedDates.includes(key);
  byId("mobilityCompleteButton").textContent = doneToday ? "Mobility Completed Today ✓" : "Complete Daily Mobility"; byId("mobilityCompleteButton").disabled = doneToday;

  byId("calorieOut").textContent = macros.calories; byId("proteinOut").textContent = `${macros.protein}g`; byId("carbOut").textContent = `${macros.carbs}g`; byId("fatOut").textContent = `${macros.fat}g`;
  byId("nutritionMode").textContent = `${macros.trainingDay ? "Training-day" : "Recovery-day"} target • ${data.nutrition.goal === "cut" ? "Fat-loss" : data.nutrition.goal === "gain" ? "Lean-gain" : "Maintenance"} mode`;
  const completed = data.plan.filter(item => item.done).length; const weeklyPct = Math.round((completed / data.plan.length) * 100);
  byId("scoreOut").textContent = `${weeklyPct}%`; byId("scoreBar").style.width = `${weeklyPct}%`; byId("scoreDetail").textContent = `${completed} of ${data.plan.length} planned sessions completed`;
}

function renderPlan() {
  const container = byId("planList");
  container.innerHTML = "";
  data.plan.forEach((item, index) => {
    const row = document.createElement("div");
    row.className = "plan-row";
    row.innerHTML = `
      <div><strong>${item.day}</strong><div class="sub">${item.customLabel || item.mission}</div>${item.detail ? `<div class="hint">${item.detail}</div>` : ""}</div>
      <label><input type="checkbox" ${item.done ? "checked" : ""} onchange="togglePlan(${index},this.checked)"> Done</label>
    `;
    container.appendChild(row);
  });
}

function togglePlan(index, checked) {
  data.plan[index].done = checked;
  saveData();
}

function renderWorkoutLibrary() {
  const container = byId("workoutLibrary");
  container.innerHTML = "";
  setText("libraryRotation", `Week ${getRotationWeek()}`);
  allWorkoutNames().forEach(name => {
    const scaled = scaledTemplate(name);
    if (!scaled) return;
    const blocks = [...new Set(scaled.exercises.map(exercise => exercise.block).filter(Boolean))].join(" • ");
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <div class="status-line">
        <div><h3>${name}</h3><div class="workout-library-title">${scaled.label}</div><div class="sub">${scaled.duration} min • ${blocks}</div></div>
        <button class="compact-button" onclick="beginWorkout('${name.replaceAll("'", "\\'")}')">Begin</button>
      </div>
      <div class="hint">${scaled.exercises.map(exercise => `${exercise.name}: ${exercise.sets} × ${exercise.reps}`).join(" • ")}</div>
    `;
    container.appendChild(card);
  });
}

function renderHistory() {
  const container = byId("historyList");
  container.innerHTML = data.history.length ? "" : '<div class="card"><div class="hint">No completed training sessions yet.</div></div>';

  data.history.forEach(session => {
    const sets = session.exercises?.flatMap(exercise => exercise.sets).filter(set => set.done).length || 0;
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <h3>${session.label || session.name}</h3>
      <div class="sub">${new Date(session.completedAt).toLocaleDateString()} • ${session.cardioType ? `${session.cardioType} • ` : ""}${Math.round((session.elapsed || 0) / 60)} min • ${sets} sets • ${session.readiness?.status ? trainingStatusText(session.readiness.status) : "-"} • RPE ${session.rpe || "-"}${session.feedback ? ` • Post-session ${feedbackRecoveryScore(session.feedback)}%` : ""}</div>
      ${session.notes ? `<div class="hint" style="margin-top:8px">${session.notes}</div>` : ""}
    `;
    container.appendChild(card);
  });
}

function renderSettings() {
  setValue("athleteNameInput", data.settings.athleteName || "Chris");
  setValue("athleteModeInput", data.settings.athleteMode || "Hybrid Athlete");
  setValue("sexInput", data.settings.sex || "Male");
  setValue("phaseInput", data.settings.phase);
  byId("weightInput").value = data.settings.weight;
  byId("goalInput").value = data.settings.goal;
  byId("benchMax").value = data.settings.maxes.bench;
  byId("squatMax").value = data.settings.maxes.squat;
  byId("deadliftMax").value = data.settings.maxes.deadlift;
  byId("pushPressMax").value = data.settings.maxes.pushPress;
  byId("rotationWeekInput").value = String(getRotationWeek());
  byId("goalWorkouts").value = data.mission.goalWorkouts;
  byId("goalMobility").value = data.mission.goalMobility;
  byId("goalPullups").value = data.mission.goalPullups;
  byId("goal5k").value = data.mission.goal5k;
  byId("heightInput").value = data.nutrition.height;
  byId("ageInput").value = data.nutrition.age;
  byId("activityInput").value = String(data.nutrition.activity);
  byId("nutritionGoalInput").value = data.nutrition.goal;
  byId("blockGoalType").value = data.trainingBlock.goalType || "General Hybrid";
  if (byId("blockBodybuildingFocus")) byId("blockBodybuildingFocus").value = data.trainingBlock.bodybuildingFocus || "Balanced";
  if (byId("blockBodybuildingPhase")) byId("blockBodybuildingPhase").value = data.trainingBlock.bodybuildingPhase || "Recomposition";
  byId("blockTargetDate").value = data.trainingBlock.targetDate || "";
  byId("blockTargetMinutes").value = data.trainingBlock.targetMinutes || 60;
  byId("blockLength").value = String(data.trainingBlock.lengthWeeks || 12);
  byId("blockTrainingDays").value = String(data.trainingBlock.trainingDays || 5);
  byId("blockRunDays").value = String(data.trainingBlock.runDays || 3);
  byId("blockStrengthDays").value = String(data.trainingBlock.strengthDays || 3);
  byId("blockSessionMinutes").value = String(data.trainingBlock.sessionMinutes || 75);
  byId("blockSecondaryGoal").value = data.trainingBlock.secondaryGoal || "Maintain Strength";
  byId("blockMaintainStrength").checked = data.trainingBlock.maintainStrength !== false;
  updateGoalBuilderFields();
  byId("currentBlockWeekInput").value = data.trainingBlock.currentWeek || 1;
  byId("currentBlockWeekInput").max = data.trainingBlock.lengthWeeks || 12;
  byId("coachMessageStyle").value = data.settings.coachMessages?.style || "Performance";
  byId("scriptureFrequency").value = data.settings.coachMessages?.scriptureFrequency || "Occasionally";
  byId("scriptureFrequencyWrap").style.display = ["Faith-Based","Mixed"].includes(byId("coachMessageStyle").value) ? "block" : "none";
  if (typeof renderEquipmentSettings === "function") renderEquipmentSettings();
}


function saveProfile() {
  data.settings.athleteName = byId("athleteNameInput").value.trim() || "Chris";
  data.settings.athleteMode = byId("athleteModeInput").value || "Hybrid Athlete";
  data.settings.sex = byId("sexInput").value || "Prefer not to say";
  data.settings.phase = byId("phaseInput").value.trim() || data.settings.phase;
  data.settings.weight = +byId("weightInput").value || data.settings.weight;
  data.settings.goal = +byId("goalInput").value || data.settings.goal;
  saveData();
  alert("Profile settings saved.");
}

function renderApp() {
  renderReadiness();
  renderDashboard();
  renderPlan();
  renderWorkoutLibrary();
  renderHistory();
  renderSettings();

  if (!data.settings.coachMessages?.setupComplete) byId("onboardingModal")?.classList.remove("hidden");
  if (data.activeWorkout && byId("workoutModal").classList.contains("hidden")) {
    openWorkoutUI();
  }
}

const coachMessageLibrary = {
  Performance: [
    ["Consistency beats perfection. Win today.", ""],
    ["Execute the plan. Let the results follow.", ""],
    ["You do not need a perfect day. You need the next right action.", ""],
    ["Trust the work. Attack the session with control.", ""]
  ],
  Stoic: [
    ["Control the effort. Release the outcome.", ""],
    ["The obstacle becomes part of the training.", ""],
    ["Discipline is freedom from the mood of the moment.", ""]
  ],
  Faith: [
    ["Whatever you do, work at it with all your heart.", "Colossians 3:23"],
    ["Let us not become weary in doing good.", "Galatians 6:9"],
    ["Run in such a way as to get the prize.", "1 Corinthians 9:24"],
    ["Those who hope in the Lord will renew their strength.", "Isaiah 40:31"]
  ]
};

function dailyIndex(length, offset = 0) {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  return (Math.floor((now - start) / 86400000) + offset) % length;
}

function shouldUseFaithToday(pref) {
  if (pref.style === "Faith-Based") return true;
  if (pref.style !== "Mixed") return false;
  if (pref.scriptureFrequency === "Daily") return true;
  const day = dailyIndex(7);
  return pref.scriptureFrequency === "Several" ? [1,3,5].includes(day) : day === 0;
}

function selectedCoachMessage() {
  const pref = data.settings.coachMessages || {};
  if (pref.style === "Off") return null;
  let type = pref.style;
  if (shouldUseFaithToday(pref)) type = "Faith";
  if (type === "Mixed") type = dailyIndex(2) ? "Performance" : "Stoic";
  const list = coachMessageLibrary[type] || coachMessageLibrary.Performance;
  return list[dailyIndex(list.length, readinessStatus() === "RED" ? 1 : 0)];
}

function saveCoachMessagePreferences() {
  data.settings.coachMessages = {
    setupComplete:true,
    style:byId("coachMessageStyle").value,
    scriptureFrequency:byId("scriptureFrequency").value
  };
  saveData();
  alert("Coach's Message preferences saved.");
}

function completeOnboarding() {
  data.settings.athleteName = byId("onboardingAthleteName").value.trim() || data.settings.athleteName || "Athlete";
  data.settings.sex = byId("onboardingSex").value || "Prefer not to say";
  if (typeof saveOnboardingEquipment === "function") saveOnboardingEquipment();
  data.settings.coachMessages = {
    setupComplete:true,
    style:byId("onboardingMessageStyle").value,
    scriptureFrequency:byId("onboardingScriptureFrequency").value
  };
  saveData({render:false});
  byId("onboardingModal").classList.add("hidden");
  renderApp();
}
