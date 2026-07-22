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
  const ready = byId("readyOut");
  if (ready) {
    ready.textContent = `${status} ${score}`;
    ready.className = `big ${status === "GREEN" ? "good" : status === "YELLOW" ? "accent" : "bad"}`;
  }

  const explanation = byId("readinessExplanation");
  if (explanation) {
    explanation.textContent = scalingProfile().label;
  }

  const r = data.settings.readiness;
  ["sleepHours", "sleepQuality", "energy", "motivation", "stress", "soreness", "jointPain", "restingHr"]
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
  setText("missionReadiness", `${readinessScore()}%`);
  setText("recoveryOut", readinessScore() >= 85 ? "Excellent" : readinessScore() >= 72 ? "Good" : readinessScore() >= 58 ? "Limited" : "Recovery Day");
  setText("missionBlock", block.enabled ? `${block.goalType} • ${blockPhase()}` : data.settings.phase);
  setText("missionWeek", block.enabled ? `${blockWeek()} of ${block.lengthWeeks}` : "Open plan");
  setText("todayMission", template?.label || plan?.mission || "Plan complete");
  setText("missionPurpose", missionPurpose(template));
  setText("todayDuration", template ? `${template.duration} minutes` : "—");
  setText("todayScale", profile.label);
  byId("todayPreview").innerHTML = template
    ? template.exercises.slice(0, 5).map(exercise => `<span class="preview-block">${exercise.block || "Training"}</span> ${exercise.name}: ${exercise.sets} × ${exercise.reps}`).join("<br>")
    : "";

  setText("strengthScoreOut", scores.strength);
  setText("runningScoreOut", scores.running);
  setText("recoveryScoreOut", scores.recovery);
  setText("hybridScoreOut", scores.hybrid);
  setText("strengthTrendOut", scores.strengthSessions ? `${scores.strengthSessions} recent sessions` : "Log strength work");
  setText("runningTrendOut", scores.runSessions ? `${scores.runSessions} recent sessions` : "Log conditioning");

  byId("rankOut").textContent = rank.rank;
  byId("levelOut").textContent = `Level ${rank.level} • ${rank.next > rank.xp ? `${rank.next - rank.xp} XP to next rank` : "Top rank reached"}`;
  byId("xpOut").textContent = `${rank.xp} XP`;
  byId("xpBar").style.width = `${rank.pct}%`;
  byId("milestoneSummary").innerHTML = `<strong>${mission.workouts}/${data.mission.goalWorkouts}</strong> workouts • <strong>${mission.mobility}/${data.mission.goalMobility}</strong> mobility days • <strong>${mission.weightPct}%</strong> toward goal weight`;

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
  container.innerHTML = data.history.length ? "" : '<div class="card"><div class="hint">No completed workouts yet.</div></div>';

  data.history.forEach(session => {
    const sets = session.exercises?.flatMap(exercise => exercise.sets).filter(set => set.done).length || 0;
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <h3>${session.label || session.name}</h3>
      <div class="sub">${new Date(session.completedAt).toLocaleDateString()} • ${session.cardioType ? `${session.cardioType} • ` : ""}${Math.round((session.elapsed || 0) / 60)} min • ${sets} sets • ${session.readiness?.status || "-"} ${session.readiness?.score || ""} • RPE ${session.rpe || "-"}</div>
      ${session.notes ? `<div class="hint" style="margin-top:8px">${session.notes}</div>` : ""}
    `;
    container.appendChild(card);
  });
}

function renderSettings() {
  setValue("athleteNameInput", data.settings.athleteName || "Chris");
  setValue("athleteModeInput", data.settings.athleteMode || "Hybrid Athlete");
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
}

function saveProfile() {
  data.settings.athleteName = byId("athleteNameInput").value.trim() || "Chris";
  data.settings.athleteMode = byId("athleteModeInput").value || "Hybrid Athlete";
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

  if (data.activeWorkout && byId("workoutModal").classList.contains("hidden")) {
    openWorkoutUI();
  }
}
