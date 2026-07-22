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

function renderDashboard() {
  const quote = getDailyQuote();
  const profile = scalingProfile();
  const plan = currentPlan();
  const template = plan ? scaledTemplate(plan.mission) : null;
  const rotationWeek = getRotationWeek();
  const rank = rankInfo();
  const mission = missionProgress();
  const macros = macroTargets();
  const block = data.trainingBlock;

  setText("phaseOut", data.settings.phase);
  setText("weightOut", data.settings.weight);
  setText("goalOut", data.settings.goal);
  byId("dailyQuote").textContent = `“${quote.text}”`;
  byId("quoteAuthor").textContent = `— ${quote.author}`;
  byId("rankOut").textContent = rank.rank;
  byId("levelOut").textContent = `Level ${rank.level} • ${rank.next > rank.xp ? `${rank.next - rank.xp} XP to next rank` : "Top rank reached"}`;
  byId("xpOut").textContent = `${rank.xp} XP`;
  byId("xpBar").style.width = `${rank.pct}%`;
  byId("milestoneSummary").innerHTML =
    `<strong>${mission.workouts}/${data.mission.goalWorkouts}</strong> workouts • ` +
    `<strong>${mission.mobility}/${data.mission.goalMobility}</strong> mobility days • ` +
    `<strong>${mission.weightPct}%</strong> toward goal weight`;

  if (block.enabled) {
    const week = blockWeek();
    const total = block.lengthWeeks;
    const pct = Math.round((week / total) * 100);
    setText("blockTitle", `${block.goalType} Goal • ${blockPhase()}`);
    setText("blockStatus", block.targetDate ? `Target ${new Date(`${block.targetDate}T12:00:00`).toLocaleDateString()} • ${block.targetMinutes} min goal` : `${block.targetMinutes} min goal`);
    setText("blockWeekPill", `Week ${week}/${total}`);
    byId("blockProgressBar").style.width = `${pct}%`;
    const easy = runPrescription("easy"); const quality = runPrescription("quality"); const long = runPrescription("long");
    setText("blockRunSummary", `This week: ${easy.detail} • ${quality.detail} • ${long.detail}`);
    byId("advanceBlockButton").disabled = week >= total;
  } else {
    setText("blockTitle", "No active block"); setText("blockStatus", "Build a goal-based plan in More."); setText("blockWeekPill", "—");
    byId("blockProgressBar").style.width = "0%"; setText("blockRunSummary", "Strength rotation and cardio selection remain available without a block.");
    byId("advanceBlockButton").disabled = true;
  }
  setText("coachHeadline", block.enabled ? `${blockPhase()} guidance` : "Coach setup");
  setText("coachRecommendation", coachRecommendation());

  byId("todayMission").textContent = template?.label || plan?.mission || "Plan complete";
  byId("todayRotation").textContent = `Rotation Week ${rotationWeek}`;
  byId("todayDuration").textContent = template ? `${template.duration} min` : "—";
  byId("todayScale").textContent = profile.label;

  byId("todayPreview").innerHTML = template
    ? template.exercises.slice(0, 7).map(exercise => {
        const setChange = exercise.originalSets !== exercise.sets
          ? `${exercise.originalSets}→${exercise.sets} sets`
          : `${exercise.sets} sets`;
        const weight = exercise.recommendationDisplay ? ` • Suggested: ${exercise.recommendationDisplay}` : "";
        return `<span class="preview-block">${exercise.block || "Training"}</span> ${exercise.name}: ${setChange} × ${exercise.reps}${weight}`;
      }).join("<br>")
    : "";

  byId("cardioType").value = data.settings.cardioType;
  byId("cardioModeNote").textContent = cardioGuidance();

  byId("mobilityFocus").value = data.mobility.focus;
  byId("mobilityMinutes").value = String(data.mobility.minutes);
  const resolved = resolvedMobilityFocus();
  byId("mobilityReason").textContent = data.mobility.focus === "Auto"
    ? `Auto-selected ${resolved} based on today's training.`
    : `${resolved} focus selected.`;

  const key = todayKey();
  const checks = data.mobility.checks[key] || {};
  const list = byId("mobilityList");
  list.innerHTML = "";
  dailyMobilityRoutine().forEach((move, index) => {
    const row = document.createElement("label");
    row.className = "mobility-move";
    row.innerHTML = `
      <input type="checkbox" ${checks[index] ? "checked" : ""} onchange="toggleMobilityMove(${index},this.checked)">
      <div><strong>${move[0]}</strong><div class="hint">${move[1]}</div></div>
    `;
    list.appendChild(row);
  });

  const doneToday = data.mobility.completedDates.includes(key);
  byId("mobilityCompleteButton").textContent = doneToday ? "Mobility Completed Today ✓" : "Complete Daily Mobility";
  byId("mobilityCompleteButton").disabled = doneToday;

  byId("calorieOut").textContent = macros.calories;
  byId("proteinOut").textContent = `${macros.protein}g`;
  byId("carbOut").textContent = `${macros.carbs}g`;
  byId("fatOut").textContent = `${macros.fat}g`;
  byId("nutritionMode").textContent =
    `${macros.trainingDay ? "Training-day" : "Recovery-day"} target • ` +
    `${data.nutrition.goal === "cut" ? "Fat-loss" : data.nutrition.goal === "gain" ? "Lean-gain" : "Maintenance"} mode`;

  const completed = data.plan.filter(item => item.done).length;
  const weeklyPct = Math.round((completed / data.plan.length) * 100);
  byId("scoreOut").textContent = `${weeklyPct}%`;
  byId("scoreBar").style.width = `${weeklyPct}%`;
  byId("scoreDetail").textContent = `${completed} of ${data.plan.length} planned sessions completed`;
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
  byId("blockGoalType").value = data.trainingBlock.goalType || "10K";
  byId("blockTargetDate").value = data.trainingBlock.targetDate || "";
  byId("blockTargetMinutes").value = data.trainingBlock.targetMinutes || 60;
  byId("blockLength").value = String(data.trainingBlock.lengthWeeks || 12);
  byId("blockRunDays").value = String(data.trainingBlock.runDays || 3);
  byId("blockStrengthDays").value = String(data.trainingBlock.strengthDays || 3);
  byId("blockMaintainStrength").checked = data.trainingBlock.maintainStrength !== false;
  byId("currentBlockWeekInput").value = data.trainingBlock.currentWeek || 1;
  byId("currentBlockWeekInput").max = data.trainingBlock.lengthWeeks || 12;
}

function saveProfile() {
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
