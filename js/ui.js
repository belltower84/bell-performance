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
  document.querySelectorAll(".screen").forEach(screen => screen.classList.add("hidden"));
  byId(name)?.classList.remove("hidden");
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
  const rank = rankInfo();
  const mission = missionProgress();
  const macros = macroTargets();

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

  byId("todayMission").textContent = plan?.mission || "Plan complete";
  byId("todayLocation").textContent = template?.location || "—";
  byId("todayDuration").textContent = template ? `${template.duration} min` : "—";
  byId("todayScale").textContent = profile.label;

  byId("todayPreview").innerHTML = template
    ? template.exercises.slice(0, 5).map(exercise => {
        const setChange = exercise.originalSets !== exercise.sets
          ? `${exercise.originalSets}→${exercise.sets} sets`
          : `${exercise.sets} sets`;
        const weight = exercise.recommendationDisplay ? ` • Suggested: ${exercise.recommendationDisplay}` : "";
        return `• ${exercise.name}: ${setChange} × ${exercise.reps}${weight}`;
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
      <div><strong>${item.day}</strong><div class="sub">${item.mission}</div></div>
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
  Object.entries(workoutTemplates).forEach(([name, template]) => {
    const scaled = scaledTemplate(name);
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <div class="status-line">
        <div><h3>${name}</h3><div class="sub">${scaled.location} • ${scaled.duration} min</div></div>
        <button onclick="beginWorkout('${name.replaceAll("'", "\\'")}')">Begin</button>
      </div>
      <div class="hint">${scaled.exercises.slice(0,4).map(exercise => `${exercise.name}: ${exercise.sets} × ${exercise.reps}`).join(" • ")}</div>
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
      <h3>${session.name}</h3>
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
  byId("goalWorkouts").value = data.mission.goalWorkouts;
  byId("goalMobility").value = data.mission.goalMobility;
  byId("goalPullups").value = data.mission.goalPullups;
  byId("goal5k").value = data.mission.goal5k;
  byId("heightInput").value = data.nutrition.height;
  byId("ageInput").value = data.nutrition.age;
  byId("activityInput").value = String(data.nutrition.activity);
  byId("nutritionGoalInput").value = data.nutrition.goal;
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
