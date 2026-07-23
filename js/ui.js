"use strict";

function byId(id) {
  return document.getElementById(id);
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, character => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","\'":"&#39;"}[character]));
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


function trackedActivityDates() {
  const dates = new Set();
  (data.readinessLog || []).forEach(entry => entry?.date && dates.add(entry.date));
  (data.history || []).forEach(session => session?.completedAt && dates.add(String(session.completedAt).slice(0,10)));
  (data.mobility?.completedDates || []).forEach(date => date && dates.add(date));
  Object.entries(data.habits?.completions || {}).forEach(([date, values]) => {
    if (values && Object.values(values).some(Boolean)) dates.add(date);
  });
  return dates;
}

function currentActivityStreak() {
  const dates = trackedActivityDates();
  if (!dates.size) return 0;
  const cursor = new Date();
  const today = todayKey();
  if (!dates.has(today)) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (true) {
    const key = `${cursor.getFullYear()}-${String(cursor.getMonth()+1).padStart(2,"0")}-${String(cursor.getDate()).padStart(2,"0")}`;
    if (!dates.has(key)) break;
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function renderReadinessTrendBars() {
  const container = byId("readinessTrendBars");
  if (!container) return;
  const logs = new Map((data.readinessLog || []).map(entry => [entry.date, Number(entry.score)]));
  const feedbackByDate = new Map();
  (data.sessionFeedbackLog || []).forEach(entry => {
    const score = feedbackRecoveryScore(entry);
    if (!entry?.date || !Number.isFinite(score)) return;
    const values = feedbackByDate.get(entry.date) || [];
    values.push(score); feedbackByDate.set(entry.date, values);
  });
  const days = [];
  for (let offset = 6; offset >= 0; offset--) {
    const d = new Date(); d.setHours(12,0,0,0); d.setDate(d.getDate()-offset);
    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
    const daily = logs.get(key);
    const feedback = feedbackByDate.get(key) || [];
    const feedbackAverage = feedback.length ? feedback.reduce((a,b)=>a+b,0)/feedback.length : null;
    const score = Number.isFinite(daily) ? (Number.isFinite(feedbackAverage) ? Math.round(daily*.65+feedbackAverage*.35) : daily) : feedbackAverage;
    days.push({label:d.toLocaleDateString("en-US",{weekday:"narrow"}),score:Number.isFinite(score)?Math.round(score):null});
  }
  if (!days.some(day => day.score !== null)) {
    container.className = "trend-bars empty";
    container.innerHTML = '<div class="chart-empty-state">Complete a readiness check-in to begin your trend.</div>';
    return;
  }
  container.className = "trend-bars";
  container.innerHTML = days.map(day => day.score === null
    ? `<i class="no-data" style="height:4%"><b>${day.label}</b></i>`
    : `<i class="${day.score<52?"red":day.score<75?"yellow":""}" style="height:${Math.max(8,day.score)}%" title="${day.score}%"><b>${day.label}</b></i>`).join("");
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
  setText("weeklyReadinessOut", weekly.hasData ? `${weekly.score}%` : "—");
  setText("weeklyReadinessLabel", weekly.trend === "NO_DATA" ? "No readiness history yet" : weekly.trend === "BUILDING_WELL" ? "Training load is being absorbed well" : weekly.trend === "MANAGE_LOAD" ? "Manage volume and protect recovery" : weekly.trend === "ACCUMULATING_FATIGUE" ? "Fatigue is accumulating — volume is capped" : "Recovery emphasis recommended");
  setText("weeklyReadinessDetail", weekly.hasData ? `${weekly.checkIns} daily check-ins • ${weekly.feedbackCount} post-session reports` : "Your rolling trend begins after the first check-in.");
  renderReadinessTrendBars();
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
  if (strengthArt) strengthArt.src = typeof chooseArtwork === "function" ? chooseArtwork("strength", "dashboard") : "./assets/artwork/strength/powerlifting.jpg?v=670";
  if (engineArt) engineArt.src = typeof chooseArtwork === "function" ? chooseArtwork("engine", "dashboard") : "./assets/artwork/engine/mountain-trail.jpg?v=670";
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


function weeklyScheduleStart(reference=new Date()) {
  const start=new Date(reference);
  start.setHours(0,0,0,0);
  const day=start.getDay();
  start.setDate(start.getDate()-(day===0?6:day-1));
  return start;
}
function scheduleTypeForMission(mission) {
  const name=String(mission||"");
  if(name.startsWith("S-")) return "strength";
  if(name.startsWith("R-")) return "engine";
  return null;
}
function renderWeeklyScheduleStrip() {
  const host=byId("weeklyScheduleDays");
  if(!host) return;
  const days=["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
  const shortDays=["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
  const start=weeklyScheduleStart();
  const today=todayKey();
  host.innerHTML=days.map((day,index)=>{
    const date=new Date(start); date.setDate(start.getDate()+index);
    const key=date.toISOString().slice(0,10);
    const items=(data.plan||[]).filter(item=>item.day===day && !["skipped","replaced"].includes(item.status));
    const types=[];
    items.forEach(item=>{
      const primary=scheduleTypeForMission(item.mission);
      const secondary=scheduleTypeForMission(item.secondaryMission);
      if(primary&&!types.includes(primary)) types.push(primary);
      if(secondary&&!types.includes(secondary)) types.push(secondary);
    });
    const codes=types.length?types.map(type=>`<i class="schedule-code ${type}" title="${type==='strength'?'Strength':'Engine'}">${type==='strength'?'S':'E'}</i>`).join(""):`<i class="schedule-code rest" title="Rest / recovery">R</i>`;
    const allDone=items.length>0&&items.every(item=>item.done||item.status==="completed");
    return `<div class="weekly-schedule-day${key===today?' today':''}${allDone?' completed':''}" aria-label="${day}, ${date.toLocaleDateString('en-US',{month:'short',day:'numeric'})}: ${types.length?types.join(' and '):'rest'}"><span class="day-name">${shortDays[index]}</span><span class="day-date">${date.getDate()}</span><div class="weekly-schedule-codes">${codes}</div></div>`;
  }).join("");
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
  const athleteName = data.settings.athleteName || "Athlete";

  setText("greetingOut", data.settings.athleteName ? `${timeGreeting()}, ${athleteName}` : timeGreeting());
  const streak=currentActivityStreak(); setText("streakDaysOut", String(streak)); setText("streakLabelOut", streak===1?"DAY STREAK":"DAY STREAK");
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
  renderTodayTrainingCards();
  renderWeeklyScheduleStrip();
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
  const completed = data.plan.filter(item => item.done).length; const accountable = data.plan.filter(item => item.status!=="replaced" || item.done).length; const weeklyPct = Math.round((completed / Math.max(1,accountable)) * 100);
  byId("scoreOut").textContent = `${weeklyPct}%`; byId("scoreBar").style.width = `${weeklyPct}%`; byId("scoreDetail").textContent = `${completed} completed • ${data.plan.filter(item=>item.status==="rescheduled").length} rescheduled • ${data.plan.filter(item=>item.status==="skipped").length} skipped`;
}

function renderPlan() {
  const container = byId("planList");
  container.innerHTML = "";
  data.plan.forEach((item, index) => {
    const row = document.createElement("div");
    const status=item.status||(item.done?"completed":"planned");
    const statusLabel={planned:"Planned",completed:"Completed",rescheduled:"Rescheduled",skipped:"Skipped",replaced:"Replaced"}[status]||status;
    row.className = `plan-row plan-status-${status}`;
    row.innerHTML = `
      <div class="grow"><strong>${item.day}</strong><div class="sub">${item.customLabel || item.mission}</div>${item.detail ? `<div class="hint">${item.detail}</div>` : ""}${item.originalDay&&item.originalDay!==item.day?`<div class="hint">Moved from ${item.originalDay}</div>`:""}${item.missedReasonLabel?`<div class="hint">Reason: ${item.missedReasonLabel}</div>`:""}</div>
      <div class="plan-actions"><span class="plan-status-chip">${statusLabel}</span>${status==="completed"?"":`<button class="secondary compact-button" onclick="openMissedSessionManager(${index})">Manage</button>`}</div>
    `;
    container.appendChild(row);
  });
}

function togglePlan(index, checked) {
  const item=data.plan[index]; item.done=checked; item.status=checked?"completed":"planned";
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
  if(typeof renderPerformanceReviews==="function")renderPerformanceReviews();
  container.innerHTML = data.history.length ? "" : '<div class="card"><div class="hint">No completed training sessions yet.</div></div>';

  data.history.forEach(session => {
    const sets = session.exercises?.flatMap(exercise => exercise.sets).filter(set => set.done).length || 0;
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <div class="status-line"><div class="grow"><h3>${session.label || session.name}</h3>
      <div class="sub">${new Date(session.completedAt).toLocaleDateString()} • ${session.cardioType ? `${session.cardioType} • ` : ""}${Math.round((session.officialElapsed || session.elapsed || 0) / 60)} min${session.engineMetrics?.distance ? ` • ${session.engineMetrics.distance} ${session.engineMetrics.distanceUnit}${session.engineMetrics.pace ? ` • ${session.engineMetrics.pace}` : ""}` : ""} • ${sets} sets • ${session.readiness?.status ? trainingStatusText(session.readiness.status) : "-"} • RPE ${session.rpe || "-"}${session.feedback ? ` • Post-session ${feedbackRecoveryScore(session.feedback)}%` : ""}</div>
      ${session.notes ? `<div class="hint" style="margin-top:8px">${session.notes}</div>` : ""}</div><button class="secondary compact-button" onclick="openHistoryEditor(${data.history.indexOf(session)})">Edit</button></div>
    `;
    container.appendChild(card);
  });
}

function historyLocalDateValue(iso){const d=new Date(iso||Date.now());const offset=d.getTimezoneOffset()*60000;return new Date(d-offset).toISOString().slice(0,16);}
function openHistoryEditor(index){const session=data.history[index];if(!session)return;byId("historyEditIndex").value=index;byId("historyEditLabel").value=session.label||session.name||"";byId("historyEditDate").value=historyLocalDateValue(session.completedAt);byId("historyEditTime").value=typeof formatEngineTime==="function"?formatEngineTime(session.officialElapsed||session.elapsed||0):"";byId("historyEditDistance").value=session.engineMetrics?.distance||"";byId("historyEditDistanceUnit").value=session.engineMetrics?.distanceUnit||"mi";byId("historyEditHeartRate").value=session.engineMetrics?.avgHeartRate||"";byId("historyEditElevation").value=session.engineMetrics?.elevationGain||"";byId("historyEditRpe").value=session.rpe||"";byId("historyEditNotes").value=session.notes||"";byId("historyEditModal").classList.remove("hidden");}
function closeHistoryEditor(){byId("historyEditModal").classList.add("hidden");}
function saveHistoryEdit(){const index=Number(byId("historyEditIndex").value),session=data.history[index];if(!session)return;session.label=byId("historyEditLabel").value.trim()||session.label||session.name;const dateValue=byId("historyEditDate").value;if(dateValue)session.completedAt=new Date(dateValue).toISOString();session.rpe=byId("historyEditRpe").value;session.notes=byId("historyEditNotes").value;const enteredTime=typeof parseEngineTime==="function"?parseEngineTime(byId("historyEditTime").value):0;if(enteredTime){session.officialElapsed=enteredTime;session.elapsed=enteredTime;}const distance=byId("historyEditDistance").value;if(session.engineMetrics||distance){session.engineMetrics=session.engineMetrics||{};session.engineMetrics.manualTime=byId("historyEditTime").value;session.engineMetrics.distance=distance;session.engineMetrics.distanceUnit=byId("historyEditDistanceUnit").value;session.engineMetrics.avgHeartRate=byId("historyEditHeartRate").value;session.engineMetrics.elevationGain=byId("historyEditElevation").value;session.engineMetrics.pace=typeof calculateEnginePace==="function"?calculateEnginePace(session.engineMetrics,session.officialElapsed||session.elapsed||0):"";}closeHistoryEditor();saveData();}
function deleteHistoryRecord(){const index=Number(byId("historyEditIndex").value);if(!data.history[index]||!confirm("Delete this workout record? This cannot be undone."))return;data.history.splice(index,1);closeHistoryEditor();saveData();}

function currentDayName(){return new Intl.DateTimeFormat("en-US",{weekday:"long"}).format(new Date());}
function dashboardSessionsForToday(){const day=currentDayName();const eligible=item=>item&&!item.done&&!['skipped','replaced'].includes(item.status);let item=data.plan.find(x=>eligible(x)&&x.day===day);if(!item)item=data.plan.find(eligible)||null;if(!item)return[];const sessions=[{mission:item.mission,label:item.customLabel,detail:item.detail,prescribedDuration:item.prescribedDuration,primary:true}];if(item.secondaryMission)sessions.push({mission:item.secondaryMission,label:item.secondaryLabel,detail:item.secondaryDetail,prescribedDuration:item.secondaryDuration,primary:false});return sessions.filter(x=>!String(x.mission||'').startsWith('M-'));}
function optionalSessionHtml(primaryType){if(primaryType==='strength')return `<span class="metric-label">Optional Support</span><h3>Add Easy Cardio</h3><p class="hint">Add 20–30 minutes of easy Zone 2 work only when readiness is Green or Yellow and it will not compromise tomorrow's training.</p><div class="row"><button class="secondary" onclick="beginWorkout('R-1 Recovery Run')">Start Optional Cardio</button><button class="secondary" onclick="document.getElementById('mobilityFocus').scrollIntoView({behavior:'smooth'})">Choose Mobility Instead</button></div>`;return `<span class="metric-label">Optional Support</span><h3>Add Mobility</h3><p class="hint">A conditioning-only day can be paired with extra mobility, breathing, or easy recovery work without adding another hard session.</p><button class="secondary" onclick="document.getElementById('mobilityFocus').scrollIntoView({behavior:'smooth'})">Open Daily Mobility</button>`;}
function renderTodayTrainingCards(){const sessions=dashboardSessionsForToday(),strengthCard=byId('strengthTrainingCard'),engineCard=byId('engineTrainingCard'),option=byId('singleSessionOption');const strength=sessions.find(x=>String(x.mission).startsWith('S-')),engine=sessions.find(x=>String(x.mission).startsWith('R-'));strengthCard?.classList.toggle('hidden',!strength);engineCard?.classList.toggle('hidden',!engine);if(strength){const t=scaledTemplate(strength.mission);setText('todayMission',strength.label||t?.label||strength.mission);setText('todayDuration',t?`${t.duration} minutes`:'—');strengthCard.querySelector('button[onclick="beginToday()"]')?.setAttribute('onclick',`beginWorkout('${strength.mission.replaceAll("'","\\'")}')`);}if(engine){const t=scaledTemplate(engine.mission);setText('engineSessionTitle',engine.label||t?.label||engine.mission);setText('engineSessionPurpose',engine.detail||'Complete the prescribed conditioning session.');const canonicalDuration=Number(engine.prescribedDuration)||Number(t?.duration)||30;const meta=engineCard.querySelector('.training-meta');if(meta)meta.innerHTML=`◷ <span>${canonicalDuration} minutes</span>`;engineCard.querySelector('button')?.setAttribute('onclick',`beginWorkout('${engine.mission.replaceAll("'","\\'")}')`);}option.classList.toggle('hidden',sessions.length!==1);if(sessions.length===1){option.innerHTML=optionalSessionHtml(strength?'strength':'engine');}}

function renderSettings() {
  setValue("athleteNameInput", data.settings.athleteName || "");
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
  byId("blockStrengthDays").value = String(data.trainingBlock.strengthDays || 4);
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
  data.settings.athleteName = byId("athleteNameInput").value.trim();
  data.settings.athleteMode = byId("athleteModeInput").value || "Hybrid Athlete";
  data.settings.sex = byId("sexInput").value || "Prefer not to say";
  data.settings.phase = byId("phaseInput").value.trim() || data.settings.phase;
  data.settings.weight = +byId("weightInput").value || data.settings.weight;
  data.settings.goal = +byId("goalInput").value || data.settings.goal;
  saveData();
  alert("Profile settings saved.");
}


function missionManagementText(){
  const b=data.trainingBlock||{},m=b.mission,d=b.dualGoals||{};
  if(!b.enabled)return {title:"No active block",detail:"Choose Edit Mission / Event to create a training mission."};
  const title=m?(m.path==="event"?(m.eventName||m.eventType):(m.developmentGoal||"Development Mission")):`${d.strengthGoal||b.goalType||"Strength"} + ${d.engineGoal||"Engine"}`;
  const detail=`Week ${b.currentWeek||1} of ${b.lengthWeeks||12} • ${b.strengthDays||0} Strength • ${b.runDays||0} Engine${m?.eventDate?` • Event ${m.eventDate}`:""}`;
  return {title,detail};
}
function openMissionEditor(){missionEditorActive=true;openFirstFlight(3);}
function focusBlockEditor(){showScreen("more");window.setTimeout(()=>document.querySelector(".dual-goal-builder")?.scrollIntoView({behavior:"smooth",block:"start"}),80);}
function startFreshBlockFromCurrentMission(){
  if(!data.trainingBlock?.enabled){openMissionEditor();return;}
  if(!confirm("Restart the active mission at Week 1? Workout history and all other app data will be preserved."))return;
  data.trainingBlock.currentWeek=1;data.trainingBlock.startDate=todayKey();data.trainingBlock.generatedAt=new Date().toISOString();
  if(typeof buildCurrentWeekPlan==="function")buildCurrentWeekPlan();saveData();alert("The active block was restarted at Week 1. Prior workout history was preserved.");
}
function openRecoveryClearance(){
  const p=data.settings.injuryProfile||{};if(!p.hasLimitations){alert("There are no active movement limitations to clear.");return;}
  byId("recoveryClearanceDate").value=todayKey();byId("recoveryClearanceType").value="self";byId("recoveryClearanceNotes").value="";byId("recoveryGradualReturn").checked=true;
  byId("recoveryClearanceModal").classList.remove("hidden");document.body.classList.add("modal-open");
}
function closeRecoveryClearance(){byId("recoveryClearanceModal")?.classList.add("hidden");document.body.classList.remove("modal-open");}
function confirmRecoveryClearance(){
  const p=data.settings.injuryProfile||{};if(!p.hasLimitations)return closeRecoveryClearance();
  const record={recoveredAt:byId("recoveryClearanceDate").value||todayKey(),clearanceType:byId("recoveryClearanceType").value,notes:byId("recoveryClearanceNotes").value.trim(),gradualReturn:byId("recoveryGradualReturn").checked,restrictedPatterns:[...(p.restrictedPatterns||[])],affectedAreas:[...(p.affectedAreas||[])],originalNotes:p.notes||"",startedAt:p.startedAt||p.updatedAt||""};
  data.settings.injuryProfile={...p,hasLimitations:false,restrictedPatterns:[],affectedAreas:[],notes:"",medicalClearance:record.clearanceType==="clinician",updatedAt:new Date().toISOString(),startedAt:"",recoveryHistory:[...(p.recoveryHistory||[]),record]};
  if(record.gradualReturn)data.settings.returnToTraining={active:true,startDate:record.recoveredAt,endDate:(()=>{const d=new Date(record.recoveredAt+"T12:00:00");d.setDate(d.getDate()+7);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;})(),volumeScale:.75};
  else data.settings.returnToTraining={active:false};
  if(typeof buildCurrentWeekPlan==="function"&&data.trainingBlock?.enabled)buildCurrentWeekPlan();closeRecoveryClearance();saveData();alert(record.gradualReturn?"Restrictions cleared. Normal exercise selection is restored with a one-week gradual return.":"Restrictions cleared. Normal exercise selection is restored.");
}
function renderMissionAndRecoveryManagement(){
  const mt=missionManagementText();setText("activeMissionManagementSummary",mt.title);setText("activeMissionManagementDetail",mt.detail);
  const p=data.settings.injuryProfile||{},btn=byId("markRecoveredButton");if(btn)btn.classList.toggle("hidden",!p.hasLimitations);
  const h=p.recoveryHistory||[],el=byId("injuryRecoveryHistorySummary");if(el)el.textContent=h.length?`${h.length} recovered limitation record${h.length===1?"":"s"} archived. Most recent: ${h[h.length-1].recoveredAt}.`:"No recovered injury records archived yet.";
}

function renderApp() {
  const injurySummaryEl=byId("injuryProfileSummary");if(injurySummaryEl){const x=injuryProfileSummaryText();injurySummaryEl.innerHTML=`<strong>${escapeHtml(x.title)}</strong><br>${escapeHtml(x.detail)}`;}
  renderReadiness();
  renderDashboard();
  renderPlan();
  renderWorkoutLibrary();
  renderHistory();
  if (typeof renderHabits === "function") renderHabits();
  renderSettings();
  renderMissionAndRecoveryManagement();

  if (!data.settings.coachMessages?.setupComplete && data.settings.firstFlightStage !== "tour") openFirstFlight();
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
  if (typeof BellQuoteCache !== "undefined") return BellQuoteCache.selected();
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

let onboardingStep=0;
let missionEditorActive=false;
function openFirstFlight(startStep=null){
  const modal=byId("onboardingModal"); if(!modal||!modal.classList.contains("hidden"))return;
  byId("onboardingAthleteName").value=data.settings.athleteName||"";
  byId("onboardingSex").value=data.settings.sex||"Prefer not to say";
  byId("onboardingAthleteMode").value=data.settings.athleteMode||"Hybrid Athlete";
  byId("onboardingAge").value=data.nutrition.age||"";
  byId("onboardingBodyweight").value=data.settings.weight||"";
  const totalHeight=Number(data.nutrition.height)||0;
  byId("onboardingHeightFeet").value=totalHeight?Math.floor(totalHeight/12):"";
  byId("onboardingHeightInches").value=totalHeight?totalHeight%12:"";
  byId("onboardingGoalWeight").value=data.settings.goal||"";
  byId("onboardingMessageStyle").value=data.settings.coachMessages?.style||"Performance";
  byId("onboardingScriptureFrequency").value=data.settings.coachMessages?.scriptureFrequency||"Occasionally";
  toggleOnboardingScripture();
  loadOnboardingInjuryProfile();
  if(typeof initializeOnboardingLocationEditor==="function")initializeOnboardingLocationEditor();
  loadOnboardingDualGoals();
  const resolvedStep=startStep===null?(data.settings.firstFlightStage==="configure"?2:0):Number(startStep);
  onboardingStep=Math.max(0,Math.min(5,resolvedStep));renderOnboardingStep();modal.classList.remove("hidden");document.body.classList.add("modal-open");
}
function renderOnboardingStep(){
  document.querySelectorAll("[data-onboarding-step]").forEach((step,index)=>step.classList.toggle("active",index===onboardingStep));
  byId("onboardingStepNumber").textContent=String(onboardingStep+1);
  byId("onboardingProgress").style.width=`${((onboardingStep+1)/6)*100}%`;
  byId("onboardingBack").disabled=onboardingStep===0;
  byId("onboardingNext").textContent=onboardingStep===1&&!data.settings.firstFlightTourComplete?"Save Limitations & Start Tour":onboardingStep===5?(missionEditorActive?"Apply Mission & Rebuild Block":"Start First Training Block"):"Continue";
  const subtitles=["Enter the athlete details that personalize Bell Performance.","Identify movement patterns that require modification or avoidance.","Map the equipment available everywhere you train.","Choose the Strength and Engine goals for your first coordinated block.","Choose how the coach communicates with you.","Confirm the flight plan before launch."];
  byId("onboardingStepSubtitle").textContent=subtitles[onboardingStep];
  if(onboardingStep===5)renderOnboardingReview();
}
function saveFirstFlightProfile(){
  const name=byId("onboardingAthleteName").value.trim();
  const age=Number(byId("onboardingAge").value);
  const weight=Number(byId("onboardingBodyweight").value);
  const feet=Number(byId("onboardingHeightFeet").value);
  const inches=Number(byId("onboardingHeightInches").value);
  const goal=Number(byId("onboardingGoalWeight").value);
  if(!name){byId("onboardingAthleteName").focus();alert("Enter the athlete's first name to continue.");return false;}
  if(!Number.isFinite(age)||age<8||age>100){byId("onboardingAge").focus();alert("Enter an age from 8 to 100.");return false;}
  if(!Number.isFinite(weight)||weight<50||weight>700){byId("onboardingBodyweight").focus();alert("Enter a bodyweight from 50 to 700 lb.");return false;}
  if(!Number.isFinite(feet)||feet<3||feet>7||!Number.isFinite(inches)||inches<0||inches>11){byId("onboardingHeightFeet").focus();alert("Enter a valid height in feet and inches.");return false;}
  data.settings.athleteName=name;
  data.settings.sex=byId("onboardingSex").value||"Prefer not to say";
  data.settings.athleteMode=byId("onboardingAthleteMode").value||"Hybrid Athlete";
  data.settings.weight=weight;
  if(Number.isFinite(goal)&&goal>=50&&goal<=700)data.settings.goal=goal;
  data.nutrition.age=age;
  data.nutrition.height=feet*12+inches;
  return true;
}
function checkedValues(containerId){return [...document.querySelectorAll(`#${containerId} input[type="checkbox"]:checked`)].map(x=>x.value);}
function setCheckedValues(containerId,values){document.querySelectorAll(`#${containerId} input[type="checkbox"]`).forEach(x=>x.checked=(values||[]).includes(x.value));}
function toggleOnboardingLimitations(){const on=byId("onboardingHasLimitations").checked;byId("onboardingLimitationsPanel").classList.toggle("hidden",!on);}
function loadOnboardingInjuryProfile(){
  const profile=data.settings.injuryProfile||{};
  byId("onboardingHasLimitations").checked=Boolean(profile.hasLimitations);
  setCheckedValues("onboardingLimitationGrid",profile.restrictedPatterns||[]);setCheckedValues("onboardingInjuryAreaGrid",profile.affectedAreas||[]);
  byId("onboardingInjuryNotes").value=profile.notes||"";byId("onboardingMedicalClearance").checked=Boolean(profile.medicalClearance);toggleOnboardingLimitations();
}
function saveOnboardingInjuryProfile(){
  const has=byId("onboardingHasLimitations").checked,restricted=has?checkedValues("onboardingLimitationGrid"):[],areas=has?checkedValues("onboardingInjuryAreaGrid"):[];
  if(has&&!restricted.length&&!byId("onboardingInjuryNotes").value.trim()){alert("Select at least one restricted movement pattern or add a short coach note.");return false;}
  data.settings.injuryProfile={hasLimitations:has,restrictedPatterns:restricted,affectedAreas:areas,notes:has?byId("onboardingInjuryNotes").value.trim():"",medicalClearance:has?byId("onboardingMedicalClearance").checked:false,updatedAt:new Date().toISOString(),startedAt:has?(data.settings.injuryProfile?.startedAt||new Date().toISOString()):"",recoveryHistory:data.settings.injuryProfile?.recoveryHistory||[]};
  return true;
}
function injuryProfileSummaryText(){
  const p=data.settings.injuryProfile||{};if(!p.hasLimitations)return {title:"None reported",detail:"Standard movement selection is active."};
  const labels={overheadPress:"overhead pressing",horizontalPress:"chest pressing",pulling:"pulling / hanging",squat:"squatting",lunge:"lunging / single-leg",hinge:"hinging / deadlifting",running:"running / impact",jumping:"jumping / landing"};
  const list=(p.restrictedPatterns||[]).map(x=>labels[x]||x);return {title:`${list.length} restricted pattern${list.length===1?"":"s"}`,detail:list.length?list.join(", "):"Custom limitation notes saved"};
}
function validateOnboardingStep(){
  if(onboardingStep===0)return saveFirstFlightProfile();
  if(onboardingStep===1)return saveOnboardingInjuryProfile();
  if(onboardingStep===2){
    if(typeof syncOnboardingEquipmentFromChecks==="function")syncOnboardingEquipmentFromChecks();
    const invalid=onboardingLocations.find(location=>!location.name.trim());if(invalid){editOnboardingLocation(invalid.id);byId("onboardingLocationName").focus();alert("Give every workout location a name.");return false;}
    const empty=onboardingLocations.find(location=>!location.equipment.length);if(empty&&!confirm(`${empty.name} has no equipment selected. Continue with bodyweight-only substitutions?`))return false;
  }
  if(onboardingStep===3)return saveOnboardingDualGoals(false);
  return true;
}
function nextOnboardingStep(){
  if(!validateOnboardingStep())return;
  if(onboardingStep===1&&!data.settings.firstFlightTourComplete){
    data.settings.firstFlightStage="tour";saveData({render:false});
    byId("onboardingModal").classList.add("hidden");document.body.classList.remove("modal-open");
    renderApp();showScreen("home");window.scrollTo(0,0);
    if(typeof launchFirstFlightTour==="function")window.setTimeout(launchFirstFlightTour,250);
    return;
  }
  if(onboardingStep<5){onboardingStep++;renderOnboardingStep();return;}completeOnboarding();
}
function previousOnboardingStep(){if(onboardingStep>0){if(onboardingStep===2&&typeof syncOnboardingEquipmentFromChecks==="function")syncOnboardingEquipmentFromChecks();onboardingStep--;renderOnboardingStep();}}
function toggleOnboardingScripture(){const style=byId("onboardingMessageStyle").value;byId("onboardingScriptureWrap").style.display=["Faith-Based","Mixed"].includes(style)?"block":"none";}
function selectedOnboardingBlockMode(){return document.querySelector('input[name="onboardingBlockMode"]:checked')?.value||"selected";}
function nextMondayKey(){const d=new Date();d.setHours(0,0,0,0);const days=(8-d.getDay())%7||7;d.setDate(d.getDate()+days);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;}
function recommendedFirstBlockSettings(){
  const mode=byId("onboardingEngineMode")?.value||"Running",goal=byId("onboardingEngineGoal")?.value||"General Aerobic Fitness",strength=byId("onboardingStrengthGoal")?.value||"Hybrid",athlete=byId("onboardingAthleteMode")?.value||"Hybrid Athlete";
  let strengthDays=strength==="Bodybuilding"?5:4,engineDays=mode==="None / Recovery Only"?1:["Half Marathon","Marathon","Century Ride","10 Mile Ruck"].includes(goal)?4:3,trainingDays=5,sessionMinutes=75,lengthWeeks=["Marathon","Century Ride"].includes(goal)?20:["Half Marathon","10 Mile Ruck"].includes(goal)?16:12;
  if(athlete==="Endurance Athlete"){engineDays=Math.max(engineDays,4);strengthDays=Math.min(strengthDays,2);trainingDays=6;}
  if(athlete==="Strength Athlete"){strengthDays=Math.max(strengthDays,4);engineDays=Math.min(engineDays,2);trainingDays=5;}
  if(athlete==="Masters Athlete"){trainingDays=Math.min(trainingDays,5);sessionMinutes=60;}
  if(athlete==="Youth Athlete"){strengthDays=Math.min(strengthDays,3);engineDays=Math.min(engineDays,3);sessionMinutes=60;lengthWeeks=Math.min(lengthWeeks,12);}
  return {strengthDays,engineDays,trainingDays,sessionMinutes,lengthWeeks,strength,mode,goal};
}
function applyRecommendedFirstBlock(){const r=recommendedFirstBlockSettings();byId("onboardingStrengthDays").value=String(r.strengthDays);byId("onboardingEngineDays").value=String(r.engineDays);byId("onboardingTrainingDays").value=String(r.trainingDays);byId("onboardingSessionMinutes").value=String(r.sessionMinutes);byId("onboardingBlockLength").value=String(r.lengthWeeks);return r;}
function renderOnboardingReview(){
  if(typeof syncOnboardingEquipmentFromChecks==="function")syncOnboardingEquipmentFromChecks();
  const injurySummary=injuryProfileSummaryText();
  const primary=onboardingLocations.find(x=>x.id===onboardingActiveLocationId)||onboardingLocations[0];
  const height=Number(data.nutrition.height)||66;
  const dual=data.trainingBlock?.dualGoals||{};
  const recommended=selectedOnboardingBlockMode()==="recommended",r=recommended?recommendedFirstBlockSettings():null;
  const strengthDays=recommended?r.strengthDays:(data.trainingBlock?.strengthDays||4),engineDays=recommended?r.engineDays:(data.trainingBlock?.runDays||3),lengthWeeks=recommended?r.lengthWeeks:(data.trainingBlock?.lengthWeeks||12),start=byId("onboardingBlockStart")?.value==="nextMonday"?"Next Monday":"Today";
  byId("onboardingReview").innerHTML=`<div><span>Athlete</span><strong>${escapeHtml(byId("onboardingAthleteName").value.trim())}</strong><small>${escapeHtml(byId("onboardingAthleteMode").value)} • Age ${escapeHtml(data.nutrition.age)} • ${escapeHtml(data.settings.weight)} lb • ${Math.floor(height/12)}′${height%12}″</small></div><div><span>Movement limitations</span><strong>${escapeHtml(injurySummary.title)}</strong><small>${escapeHtml(injurySummary.detail)}</small></div><div><span>Primary workout location</span><strong>${escapeHtml(primary.name)}</strong><small>${primary.equipment.length} equipment options • ${onboardingLocations.length} saved location${onboardingLocations.length===1?"":"s"}</small></div><div><span>Dual Mission</span><strong>${escapeHtml(dual.strengthGoal||"Hybrid")} + ${escapeHtml(dual.engineGoal||"Aerobic Base")}</strong><small>${escapeHtml(String(strengthDays))} strength • ${escapeHtml(String(engineDays))} engine • ${escapeHtml(String(lengthWeeks))}-week block</small></div><div><span>Block launch</span><strong>${recommended?"Recommended default":"Your selected setup"}</strong><small>Week 1 begins ${escapeHtml(start.toLowerCase())}</small></div><div><span>Coach messages</span><strong>${escapeHtml(byId("onboardingMessageStyle").value)}</strong><small>${["Faith-Based","Mixed"].includes(byId("onboardingMessageStyle").value)?escapeHtml(byId("onboardingScriptureFrequency").value+" Scripture"):"Message preference saved"}</small></div>`;
}

function onboardingEngineGoalOptions(mode){
  const options={"Running":["General Aerobic Fitness","5K","10K","Half Marathon","Marathon"],"Cycling":["General Aerobic Fitness","20K Time Trial","40K Time Trial","Century Ride"],"Rower":["General Aerobic Fitness","2K Row","5K Row"],"Swimming":["General Aerobic Fitness","500m Swim","1500m Swim"],"Hiking / Rucking":["General Aerobic Fitness","5 Mile Ruck","10 Mile Ruck"],"Sprint / Field":["Speed Development","Field Conditioning"],"General Conditioning":["General Aerobic Fitness","Work Capacity"],"None / Recovery Only":["Recovery and Mobility"]};
  return options[mode]||options.Running;
}
function populateOnboardingEngineGoals(){const el=byId("onboardingEngineGoal"),mode=byId("onboardingEngineMode")?.value||"Running",current=el?.value;if(!el)return;el.innerHTML=onboardingEngineGoalOptions(mode).map(x=>`<option>${x}</option>`).join("");if(onboardingEngineGoalOptions(mode).includes(current))el.value=current;}
function loadOnboardingDualGoals(){const b=data.trainingBlock||{},d=b.dualGoals||{};byId("onboardingStrengthGoal").value=d.strengthGoal||"Hybrid";byId("onboardingStrengthDays").value=String(b.strengthDays||4);byId("onboardingEngineMode").value=d.engineMode||"Running";populateOnboardingEngineGoals();const goals=onboardingEngineGoalOptions(byId("onboardingEngineMode").value);byId("onboardingEngineGoal").value=goals.includes(d.engineGoal)?d.engineGoal:goals[0];byId("onboardingEngineDays").value=String(b.runDays||3);byId("onboardingTrainingDays").value=String(b.trainingDays||5);byId("onboardingSessionMinutes").value=String(b.sessionMinutes||75);byId("onboardingBlockLength").value=String(b.lengthWeeks||12);}
function saveOnboardingDualGoals(buildPlan=true){const strengthDays=+byId("onboardingStrengthDays").value,engineDays=+byId("onboardingEngineDays").value,trainingDays=+byId("onboardingTrainingDays").value;if(strengthDays+engineDays>trainingDays*2){alert("Reduce weekly sessions or increase available training days so the plan remains practical.");return false;}const strength=byId("onboardingStrengthGoal").value,mode=byId("onboardingEngineMode").value,goal=byId("onboardingEngineGoal").value;data.trainingBlock={...data.trainingBlock,enabled:true,lengthWeeks:+byId("onboardingBlockLength").value||12,currentWeek:1,trainingDays,strengthDays,runDays:engineDays,sessionMinutes:+byId("onboardingSessionMinutes").value||75,startDate:data.trainingBlock?.startDate||todayKey(),generatedAt:new Date().toISOString(),dualGoals:{...(data.trainingBlock?.dualGoals||{}),strengthGoal:strength,engineMode:mode,engineGoal:goal,trainingCoordination:"Coach Decides",engineSessions:engineDays,targetValue:0}};data.settings.cardioType=mode==="General Conditioning"?"Air Bike":mode==="None / Recovery Only"?"Running":mode;if(buildPlan&&typeof buildCurrentWeekPlan==="function")buildCurrentWeekPlan();return true;}
function completeOnboarding() {
  if(selectedOnboardingBlockMode()==="recommended")applyRecommendedFirstBlock();
  if(!saveOnboardingDualGoals(false))return;
  saveFirstFlightProfile();
  saveOnboardingInjuryProfile();
  if (typeof saveOnboardingEquipment === "function") saveOnboardingEquipment();
  data.trainingBlock.startDate=byId("onboardingBlockStart")?.value==="nextMonday"?nextMondayKey():todayKey();
  data.trainingBlock.currentWeek=1;data.trainingBlock.enabled=true;data.trainingBlock.generatedAt=new Date().toISOString();
  if(typeof buildCurrentWeekPlan==="function")buildCurrentWeekPlan();
  data.settings.coachMessages = {setupComplete:true,style:byId("onboardingMessageStyle").value,scriptureFrequency:byId("onboardingScriptureFrequency").value};
  data.settings.firstFlightStage="complete";data.settings.firstFlightTourComplete=true;data.settings.firstBlockLaunchMode=selectedOnboardingBlockMode();
  saveData({render:false});
  byId("onboardingModal").classList.add("hidden");document.body.classList.remove("modal-open");renderApp();showScreen("home");
  alert(missionEditorActive?`Mission updated. A revised block begins ${data.trainingBlock.startDate}; all prior app history was preserved.`:`First training block created. Week 1 begins ${data.trainingBlock.startDate}.`);missionEditorActive=false;
}
