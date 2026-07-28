"use strict";

/** Bell Core API integration.
 * The app remains usable offline. When connected, athlete lifecycle events are
 * mirrored to Bell Core and the latest server coaching state is cached locally.
 */
const BELL_CLOUD_KEY = "bellPerformanceCloudV1";
const bellCloudDefaults = {
  apiBaseUrl: "http://localhost:8000/api/v1",
  token: "",
  userId: "",
  role: "athlete",
  email: "",
  athleteId: "",
  missionId: "",
  planId: "",
  connected: false,
  lastSyncAt: "",
  lastError: "",
  state: null,
  today: null,
  intelligence: null,
  lastDecision: null
};

function loadBellCloud() {
  try { return { ...bellCloudDefaults, ...(JSON.parse(localStorage.getItem(BELL_CLOUD_KEY) || "{}")) }; }
  catch { return { ...bellCloudDefaults }; }
}
let bellCloud = loadBellCloud();
function saveBellCloud() { localStorage.setItem(BELL_CLOUD_KEY, JSON.stringify(bellCloud)); }
function bellApiUrl(path) { return `${String(bellCloud.apiBaseUrl || "").replace(/\/$/, "")}${path}`; }
function bellCloudConnected() { return Boolean(bellCloud.connected && bellCloud.token); }

async function bellApiRequest(path, options = {}) {
  const headers = { Accept: "application/json", ...(options.headers || {}) };
  if (bellCloud.token) headers.Authorization = `Bearer ${bellCloud.token}`;
  if (options.body && !(options.body instanceof FormData) && !headers["Content-Type"]) headers["Content-Type"] = "application/json";
  const response = await fetch(bellApiUrl(path), { ...options, headers });
  const requestId = response.headers.get("X-Request-ID");
  let payload = null;
  try { payload = await response.json(); } catch { payload = { detail: response.statusText }; }
  if (!response.ok) {
    const detail = typeof payload?.detail === "string" ? payload.detail : JSON.stringify(payload?.detail || payload);
    const error = new Error(detail || `Bell API request failed (${response.status})`);
    error.status = response.status; error.requestId = requestId; error.payload = payload;
    throw error;
  }
  return payload;
}

async function bellRegister(email, password) {
  const result = await bellApiRequest("/auth/register", { method: "POST", body: JSON.stringify({ email, password, role: "athlete" }) });
  Object.assign(bellCloud, { token: result.access_token, userId: result.user_id, role: result.role, email, connected: true, lastError: "" });
  saveBellCloud(); return result;
}

async function bellLogin(email, password) {
  const body = new URLSearchParams({ username: email, password });
  const result = await bellApiRequest("/auth/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body });
  Object.assign(bellCloud, { token: result.access_token, userId: result.user_id, role: result.role, email, connected: true, lastError: "" });
  saveBellCloud(); return result;
}

function bellAthleteProfile() {
  return {
    sex: data.settings.sex,
    athlete_mode: data.settings.athleteMode,
    age: Number(data.nutrition.age) || null,
    height_inches: Number(data.nutrition.height) || null,
    weight_lb: Number(data.settings.weight) || null,
    goal_weight_lb: Number(data.settings.goal) || null,
    maxes: data.settings.maxes || {},
    limitations: data.settings.injuryProfile || {},
    equipment: data.settings.equipmentSetup || {},
    training_experience: data.settings.trainingExperience || "Intermediate"
  };
}

function bellMissionRequest() {
  const block = data.trainingBlock || {};
  const primary = data.settings.primaryTrainingIdentity || data.settings.athleteMode || "Hybrid Performance";
  const secondary = data.settings.secondaryTrainingGoal || block.secondaryGoal || "Balanced Program";
  const date = data.settings.secondaryTargetDate || block.targetDate || null;
  return {
    goal: `${primary}: ${secondary}`,
    timeline_weeks: Math.max(4, Math.min(52, Number(block.lengthWeeks) || 12)),
    priority_order: [primary, secondary].filter(Boolean),
    constraints: {
      training_days: Math.max(2, Math.min(6, Number(block.trainingDays) || 5)),
      strength_days: Number(block.strengthDays) || 3,
      engine_days: Number(block.runDays) || 2,
      session_minutes: Math.max(20, Math.min(180, Number(block.sessionMinutes) || 60)),
      equipment_location: data.settings.equipmentSetup?.activeLocationId || "default",
      limitations: data.settings.injuryProfile || {}
    },
    competition_date: date || null
  };
}

async function bellEnsureAthlete() {
  if (!bellCloudConnected()) return null;
  if (bellCloud.athleteId) return bellCloud.athleteId;
  const athlete = await bellApiRequest("/athletes", { method: "POST", body: JSON.stringify({ name: data.settings.athleteName || "Bell Athlete", profile: bellAthleteProfile() }) });
  bellCloud.athleteId = athlete.id; saveBellCloud(); return athlete.id;
}

async function bellSyncMissionAndPlan() {
  const athleteId = await bellEnsureAthlete();
  if (!athleteId) return null;
  const mission = await bellApiRequest(`/athletes/${athleteId}/missions`, { method: "POST", body: JSON.stringify(bellMissionRequest()) });
  const plan = await bellApiRequest(`/athletes/${athleteId}/plans`, { method: "POST" });
  bellCloud.missionId = mission.id; bellCloud.planId = plan.id;
  await bellRefreshCloudState(); return { mission, plan };
}

function bellReadinessPayload() {
  const r = data.settings.readiness || {};
  const recovery = Number(r.recoveryStatus) || 4;
  const painAreas = data.settings.injuryProfile?.hasLimitations ? (data.settings.injuryProfile.affectedAreas || []) : [];
  const pain = Object.fromEntries(painAreas.map(area => [area, Math.max(0, Math.min(10, (5 - recovery) * 2))]));
  return {
    sleep_hours: (Number(r.sleepHours) || 0) + (Number(r.sleepMinutes) || 0) / 60,
    sleep_quality: Math.max(0, Math.min(10, ((Number(r.sleepQuality) || 3) - 1) * 2.5)),
    stress: Math.max(0, Math.min(10, 10 - ((Number(r.energy) || 3) * 2))),
    motivation: Math.max(0, Math.min(10, (Number(r.motivation) || 3) * 2)),
    soreness: { general: Math.max(0, Math.min(10, (5 - recovery) * 2)) },
    pain,
    available_minutes: [25, 40, 55, 70, 90][Math.max(0, Math.min(4, (Number(r.timeAvailability) || 3) - 1))],
    symptoms: [], illness: {}
  };
}

async function bellSubmitReadiness() {
  const athleteId = await bellEnsureAthlete();
  if (!athleteId || !bellCloud.planId) return null;
  const result = await bellApiRequest(`/athletes/${athleteId}/check-ins`, { method: "POST", body: JSON.stringify(bellReadinessPayload()) });
  bellCloud.lastDecision = result; await bellRefreshCloudState(); return result;
}

function bellCloudSessionId() {
  return bellCloud.today?.session?.session?.session_id || bellCloud.today?.original_session?.session?.session_id || null;
}
async function bellCompleteCurrentSession(completed) {
  const athleteId = bellCloud.athleteId, sessionId = completed?.cloudSessionId || bellCloudSessionId();
  if (!bellCloudConnected() || !athleteId || !sessionId) return null;
  const duration = Math.max(1, Math.round((Number(completed.elapsed) || Number(completed.officialElapsed) || 2700) / 60));
  const idempotency = `bell-${athleteId}-${sessionId}-${completed.completedAt || todayKey()}`;
  const result = await bellApiRequest(`/athletes/${athleteId}/sessions/${encodeURIComponent(sessionId)}/complete`, {
    method: "POST", headers: { "Idempotency-Key": idempotency },
    body: JSON.stringify({ duration_minutes: duration, session_rpe: Number(completed.sessionRpe) || 7, performance_ratio: 1, notes: completed.notes || "Completed in Bell Performance" })
  });
  await bellRefreshCloudState(); return result;
}

async function bellRefreshCloudState() {
  if (!bellCloudConnected() || !bellCloud.athleteId) return null;
  const [state, today, intelligence] = await Promise.all([
    bellApiRequest(`/athletes/${bellCloud.athleteId}/state`),
    bellApiRequest(`/athletes/${bellCloud.athleteId}/today`).catch(error => error.status === 404 ? null : Promise.reject(error)),
    bellApiRequest(`/athletes/${bellCloud.athleteId}/intelligence`).catch(error => error.status === 404 ? null : Promise.reject(error))
  ]);
  bellCloud.state = state; bellCloud.today = today; bellCloud.intelligence = intelligence;
  if (intelligence?.plan_id) bellCloud.planId = intelligence.plan_id;
  bellCloud.lastSyncAt = new Date().toISOString(); bellCloud.lastError = ""; saveBellCloud();
  renderBellCloudCard(); return { state, today, intelligence };
}

function bellDisconnect() {
  bellCloud = { ...bellCloudDefaults, apiBaseUrl: bellCloud.apiBaseUrl || bellCloudDefaults.apiBaseUrl };
  saveBellCloud(); renderBellCloudCard();
}

function bellCloudStatusText() {
  if (!bellCloudConnected()) return "Not connected — the app is running in local/offline mode.";
  const sync = bellCloud.lastSyncAt ? new Date(bellCloud.lastSyncAt).toLocaleString() : "Not synced yet";
  const readiness = bellCloud.state?.readiness?.current;
  const compliance = bellCloud.state?.compliance?.rate;
  const compliancePercent = Number.isFinite(compliance) ? (compliance > 1 ? compliance : compliance * 100) : null;
  return `Connected as ${bellCloud.email}. Last sync: ${sync}.${Number.isFinite(readiness) ? ` Server readiness: ${Math.round(readiness)}.` : ""}${Number.isFinite(compliancePercent) ? ` Compliance: ${Math.round(compliancePercent)}%.` : ""}`;
}

function ensureBellCloudCard() {
  const screen = document.getElementById("more");
  if (!screen || document.getElementById("bellCloudCard")) return;
  const heading = screen.querySelector(".settings-section-heading");
  const card = document.createElement("div"); card.className = "card bell-cloud-card"; card.id = "bellCloudCard";
  card.innerHTML = `<div class="status-line"><div><span class="metric-label">Bell Core</span><h3>Cloud Coaching Connection</h3><p class="sub" id="bellCloudStatus"></p></div><span class="cloud-dot" id="bellCloudDot"></span></div>
  <div class="row"><div><label>API URL</label><input id="bellApiBaseUrl" placeholder="https://api.example.com/api/v1"></div><div><label>Email</label><input id="bellCloudEmail" type="email" autocomplete="email"></div><div><label>Password</label><input id="bellCloudPassword" type="password" minlength="10" autocomplete="current-password"></div></div>
  <div class="row three"><button type="button" onclick="bellCloudConnect(false)">Sign In</button><button type="button" class="secondary" onclick="bellCloudConnect(true)">Create Account</button><button type="button" class="secondary" onclick="bellManualSync()">Sync Now</button></div>
  <div class="row"><button type="button" class="danger" onclick="bellDisconnect()">Disconnect This Device</button></div>
  <div class="performance-callout" id="bellCloudDecision">Cloud decisions will appear here after a readiness check-in.</div>
  <div class="performance-callout" id="bellCloudIntelligence">Connect and generate a plan to see Bell's intelligence stack.</div>`;
  screen.insertBefore(card, heading || screen.firstChild);
}

function renderBellCloudCard() {
  ensureBellCloudCard();
  const status = document.getElementById("bellCloudStatus"), dot = document.getElementById("bellCloudDot"), decision = document.getElementById("bellCloudDecision"), intelligence = document.getElementById("bellCloudIntelligence");
  if (!status) return;
  status.textContent = bellCloud.lastError ? `${bellCloudStatusText()} Last error: ${bellCloud.lastError}` : bellCloudStatusText();
  dot?.classList.toggle("connected", bellCloudConnected());
  const url = document.getElementById("bellApiBaseUrl"), email = document.getElementById("bellCloudEmail");
  if (url && document.activeElement !== url) url.value = bellCloud.apiBaseUrl;
  if (email && document.activeElement !== email) email.value = bellCloud.email;
  if (decision) {
    const action = bellCloud.lastDecision?.decision?.action || bellCloud.today?.adaptation?.action?.action;
    const score = bellCloud.lastDecision?.readiness?.score || bellCloud.today?.adaptation?.readiness?.score;
    const explanation = bellCloud.lastDecision?.explanation || bellCloud.today?.adaptation?.explanation;
    decision.textContent = action ? `Latest Bell Core decision: ${String(action).replaceAll("_", " ")}${score != null ? ` • readiness ${Math.round(score)}` : ""}.${explanation ? ` ${explanation}` : ""}` : "Cloud decisions will appear here after a readiness check-in.";
  }
  if (intelligence) {
    const intel = bellCloud.intelligence;
    const probability = intel?.goal_probability?.probability;
    const strategy = intel?.simulation?.selected?.candidate_id;
    const model = intel?.periodization?.model;
    const calories = intel?.nutrition?.blocks?.[0]?.daily_calories;
    const taper = intel?.competition?.taper?.duration_days;
    const patterns = intel?.patterns?.patterns?.length || 0;
    const engineCount = Object.keys(intel?.engine_manifest || {}).length;
    const parts = [];
    if (strategy) parts.push(`${strategy} digital-twin strategy`);
    if (model) parts.push(String(model).replaceAll("_", " "));
    if (Number.isFinite(probability)) parts.push(`${Math.round(probability * 100)}% heuristic goal probability`);
    if (Number.isFinite(calories)) parts.push(`${Math.round(calories).toLocaleString()} daily calories in the current nutrition block`);
    if (Number.isFinite(taper)) parts.push(`${taper}-day competition taper`);
    if (patterns) parts.push(`${patterns} learned pattern${patterns === 1 ? "" : "s"}`);
    if (engineCount) parts.push(`${engineCount} engine outputs active`);
    intelligence.textContent = parts.length ? `Coaching intelligence: ${parts.join(" • ")}.` : "Generate a Bell Core plan to activate periodization, simulation, nutrition, competition, and learning intelligence.";
  }
}

async function bellCloudConnect(register) {
  const url = document.getElementById("bellApiBaseUrl")?.value.trim();
  const email = document.getElementById("bellCloudEmail")?.value.trim();
  const password = document.getElementById("bellCloudPassword")?.value || "";
  if (!url || !email || password.length < 10) { alert("Enter the API URL, a valid email, and a password of at least 10 characters."); return; }
  bellCloud.apiBaseUrl = url.replace(/\/$/, ""); bellCloud.token = ""; saveBellCloud();
  try {
    await (register ? bellRegister(email, password) : bellLogin(email, password));
    await bellEnsureAthlete();
    if (data.settings.coachMessages?.setupComplete) await bellSyncMissionAndPlan();
    renderBellCloudCard(); alert(register ? "Bell Core account created and connected." : "Connected to Bell Core.");
  } catch (error) { bellCloud.lastError = error.message; saveBellCloud(); renderBellCloudCard(); alert(`Bell Core connection failed: ${error.message}`); }
}

async function bellManualSync() {
  if (!bellCloudConnected()) { alert("Connect to Bell Core first."); return; }
  try {
    await bellEnsureAthlete();
    if (!bellCloud.planId && data.settings.coachMessages?.setupComplete) await bellSyncMissionAndPlan(); else await bellRefreshCloudState();
    alert("Bell Core sync complete.");
  } catch (error) { bellCloud.lastError = error.message; saveBellCloud(); renderBellCloudCard(); alert(`Sync failed: ${error.message}`); }
}

function bellRunInBackground(task) {
  Promise.resolve().then(task).catch(error => { bellCloud.lastError = error.message; saveBellCloud(); renderBellCloudCard(); console.warn("Bell Core sync failed", error); });
}

document.addEventListener("DOMContentLoaded", () => { ensureBellCloudCard(); ensureBellCloudTodayCard(); renderBellCloudCard(); if (bellCloudConnected() && bellCloud.athleteId) bellRunInBackground(bellRefreshCloudState); });

function bellCloudWorkoutModel(payload = bellCloud.today?.session) {
  if (!payload?.session) return null;
  const meta = payload.session;
  const isEngine = payload.session_type === "engine" || meta.session_type === "engine" || meta.type === "engine";
  const blocks = Array.isArray(payload.exercise_blocks) ? payload.exercise_blocks : [];
  const exercises = isEngine ? [{
    name: payload.engine_prescription?.mode || payload.engine_prescription?.intensity || "Engine Prescription",
    block: "Engine Work",
    prescription: `${payload.engine_prescription?.duration_minutes || meta.estimated_minutes || 30} minutes`,
    originalSets: 1,
    cue: payload.coach_summary || "Hold the prescribed effort and finish with control.",
    rest: 0,
    feedback: "",
    feedbackSaved: false,
    methodology: "Bell Engine Prescription",
    sets: [{ set: 1, weight: "", reps: `${payload.engine_prescription?.duration_minutes || meta.estimated_minutes || 30} min`, done: false }]
  }] : blocks.map(block => {
    const rx = block.prescription || {};
    const setCount = Math.max(1, Number(rx.sets) || 1);
    return {
      name: block.name || "Training Exercise",
      block: block.role || block.slot_name || "Training",
      prescription: `${setCount} × ${rx.reps || "As prescribed"}`,
      originalSets: setCount,
      cue: block.coaching?.primary_cue || block.coaching?.why || "Use controlled, repeatable technique.",
      rest: Number(rx.rest_seconds) || 60,
      feedback: "",
      feedbackSaved: false,
      methodology: rx.progression_model || "Bell adaptive progression",
      bellPhase: meta.phase || payload.programming?.block_phase || null,
      sets: Array.from({ length: setCount }, (_, index) => ({
        set: index + 1,
        weight: "",
        reps: rx.reps || "",
        done: false
      }))
    };
  });
  const warmupMinutes = Number(payload.warmup?.minutes) || 5;
  const cooldownMinutes = Number(payload.cooldown?.minutes) || 5;
  const duration = Math.max(10, Number(meta.estimated_minutes) || Number(meta.requested_minutes) || 45);
  const selectionEquipment = (payload.selection_trace?.selected_exercises || [])
    .flatMap(item => item?.metadata?.required_equipment || []);
  const targetRpes = blocks.map(block => Number(block?.prescription?.target_rpe)).filter(Number.isFinite);
  const avgRpe = targetRpes.length ? targetRpes.reduce((sum, value) => sum + value, 0) / targetRpes.length : null;
  const explanation = bellCloud.today?.adaptation?.explanation;
  return {
    name: isEngine ? `R-CLOUD-${meta.session_id}` : `CLOUD-${meta.session_id}`,
    label: meta.title || meta.name || (isEngine ? "Bell Engine Session" : "Bell Strength Session"),
    duration,
    prescribedDuration: duration,
    startedAt: null,
    timerStartedAt: null,
    timerAccumulatedSeconds: 0,
    timerRunning: false,
    stage: "briefing",
    planId: bellCloud.planId || null,
    planSessionKey: `cloud:${meta.session_id}`,
    cloudSessionId: meta.session_id,
    cloudGenerated: true,
    scheduledDate: todayKey(),
    optionalCore: false,
    elapsed: 0,
    rpe: "",
    notes: "",
    readiness: {
      score: bellCloud.today?.adaptation?.readiness?.score ?? bellCloud.state?.readiness?.current ?? readinessScore(),
      status: bellCloud.today?.status === "adapted" ? "modified" : readinessStatus()
    },
    cardioType: isEngine ? (payload.engine_prescription?.mode || data.settings.cardioType || "Running") : null,
    engineMetrics: isEngine ? {
      manualTime: "",
      distance: "",
      distanceUnit: data.settings.cardioType === "Swimming" ? "m" : "mi",
      avgHeartRate: "",
      elevationGain: "",
      elevationUnit: "ft"
    } : null,
    exercises,
    focus: [
      payload.programming?.week_purpose ? String(payload.programming.week_purpose).replaceAll("_", " ") : null,
      explanation || payload.coach_notes?.session_focus || payload.coach_summary || null
    ].filter(Boolean),
    coachBrief: explanation || payload.coach_notes?.session_focus || payload.coach_summary || "Bell generated this session from your mission, current phase, equipment, readiness, and training history.",
    sections: [
      { title: "Warm-Up", minutes: warmupMinutes },
      { title: isEngine ? "Engine Work" : "Primary Training", minutes: Math.max(1, duration - warmupMinutes - cooldownMinutes) },
      { title: "Cooldown", minutes: cooldownMinutes }
    ],
    successCriteria: isEngine ? [
      "Stay within the prescribed effort.",
      "Record the official time and distance.",
      "Finish with controlled form and breathing."
    ] : [
      "Keep every working set inside the target RPE.",
      "Stop before technique meaningfully breaks down.",
      "Record pain, performance, and session RPE honestly."
    ],
    workSets: exercises.reduce((sum, exercise) => sum + exercise.sets.length, 0),
    intensity: isEngine ? (payload.engine_prescription?.intensity || "Controlled") : (avgRpe ? `RPE ${avgRpe.toFixed(1)}` : "Autoregulated"),
    equipment: [...new Set(selectionEquipment)],
    week: meta.week || 1,
    phase: payload.programming?.block_phase || meta.phase || "Training",
    nextWorkout: null
  };
}

function bellStartCloudWorkout() {
  const workout = bellCloudWorkoutModel();
  if (!workout) {
    alert("Bell Core does not have a current session ready yet. Sync or generate a plan first.");
    return;
  }
  if (data.activeWorkout && data.activeWorkout.cloudSessionId === workout.cloudSessionId) {
    openWorkoutUI();
    return;
  }
  if (data.activeWorkout && !confirm("Another workout is already in progress. Discard it and start the Bell Core session?")) return;
  data.activeWorkout = workout;
  if (typeof bpNormalizeWorkout === "function") bpNormalizeWorkout(data.activeWorkout);
  saveData({ render: false });
  openWorkoutUI();
}

function ensureBellCloudTodayCard() {
  const dashboard = document.getElementById("premiumDashboard");
  if (!dashboard || document.getElementById("bellCloudTodayCard")) return;
  const card = document.createElement("section");
  card.id = "bellCloudTodayCard";
  card.className = "premium-mission-card bell-cloud-today-card hidden";
  card.innerHTML = `<div class="premium-mission-banner">Bell Core AI Mission</div>
    <div class="premium-section-heading"><div><span class="premium-kicker" id="bellCloudTodayKicker">Cloud Coaching</span><h2 id="bellCloudTodayTitle">Syncing Bell Core</h2><p id="bellCloudTodayMeta">Your server-generated workout will appear here.</p></div></div>
    <div class="performance-callout" id="bellCloudTodayReason">Bell will explain any readiness-driven change before you train.</div>
    <div class="row"><button class="good premium-primary-button" type="button" onclick="bellStartCloudWorkout()">Start AI Workout</button><button class="secondary" type="button" onclick="bellManualSync()">Sync Bell Core</button></div>`;
  const missionCard = dashboard.querySelector(".bell11-mission-card");
  dashboard.insertBefore(card, missionCard || dashboard.firstChild);
}

function renderBellCloudTodayCard() {
  ensureBellCloudTodayCard();
  const card = document.getElementById("bellCloudTodayCard");
  if (!card) return;
  const payload = bellCloud.today?.session;
  const connected = bellCloudConnected();
  card.classList.toggle("hidden", !connected || !payload?.session);
  if (!connected || !payload?.session) return;
  const meta = payload.session;
  const title = document.getElementById("bellCloudTodayTitle");
  const kicker = document.getElementById("bellCloudTodayKicker");
  const detail = document.getElementById("bellCloudTodayMeta");
  const reason = document.getElementById("bellCloudTodayReason");
  if (title) title.textContent = meta.title || meta.name || "Bell Core Training";
  if (kicker) kicker.textContent = bellCloud.today?.status === "adapted" ? "AI-Adjusted Session" : "Server-Generated Session";
  if (detail) detail.textContent = `${String(payload.session_type || meta.type || "training").replaceAll("_", " ")} • ${meta.estimated_minutes || meta.requested_minutes || 45} min • Week ${meta.week || 1} • ${String(payload.programming?.block_phase || meta.phase || "training").replaceAll("_", " ")}`;
  if (reason) reason.textContent = bellCloud.today?.adaptation?.explanation || payload.coach_notes?.session_focus || payload.coach_summary || "This workout was selected from your mission, phase, readiness, equipment, and athlete history.";
}

const bellOriginalRenderCloudCard = renderBellCloudCard;
renderBellCloudCard = function renderBellCloudCardWithToday() {
  bellOriginalRenderCloudCard();
  renderBellCloudTodayCard();
};
