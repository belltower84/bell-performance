"use strict";

const mobilityRoutines = {
  "Full Body": [
    ["Cat-Camel", "8 slow reps"], ["World's Greatest Stretch", "4/side"],
    ["90/90 Hip Rotations", "8 reps"], ["Wall Slides", "10 reps"],
    ["Deep Squat Hold", "45 seconds"], ["Dead Hang", "30 seconds"]
  ],
  "Hips": [
    ["90/90 Hip Rotations", "10 reps"], ["Couch Stretch", "45 sec/side"],
    ["Adductor Rock-Back", "8/side"], ["Cossack Squat", "6/side"],
    ["Deep Squat Hold", "60 seconds"], ["Glute Bridge", "12 reps"]
  ],
  "Shoulders": [
    ["Wall Slides", "10 reps"], ["Band Pull-Apart", "15 reps"],
    ["Thread the Needle", "6/side"], ["Dead Hang", "30–45 seconds"],
    ["Doorway Pec Stretch", "45 sec/side"], ["Scapular Push-up", "10 reps"]
  ],
  "Low Back": [
    ["Cat-Camel", "10 reps"], ["Child's Pose Breathing", "5 breaths"],
    ["Open Book Rotation", "6/side"], ["Bird Dog", "6/side"],
    ["Hip Flexor Stretch", "45 sec/side"], ["Glute Bridge", "12 reps"]
  ],
  "Ankles": [
    ["Knee-to-Wall Ankle Rock", "10/side"], ["Calf Stretch", "45 sec/side"],
    ["Tibialis Raise", "15 reps"], ["Slow Calf Raise", "12 reps"],
    ["Deep Squat Pry", "45 seconds"], ["Single-Leg Balance", "30 sec/side"]
  ]
};

function resolvedMobilityFocus() {
  if (data.mobility.focus !== "Auto") return data.mobility.focus;
  const mission = currentPlan()?.mission || "";
  if (mission.includes("Lower") || mission.includes("Run")) return "Hips";
  if (mission.includes("Upper")) return "Shoulders";
  return "Full Body";
}

function dailyMobilityRoutine() {
  const focus = resolvedMobilityFocus();
  const minutes = Number(data.mobility.minutes) || 10;
  const source = mobilityRoutines[focus] || mobilityRoutines["Full Body"];
  const count = minutes <= 6 ? 4 : minutes <= 10 ? 5 : 6;
  return source.slice(0, count);
}

function saveMobilityFocus() {
  data.mobility.focus = document.getElementById("mobilityFocus").value;
  data.mobility.minutes = +document.getElementById("mobilityMinutes").value || 10;
  data.mobility.checks = {};
  saveData();
}

function toggleMobilityMove(index, checked) {
  const key = todayKey();
  data.mobility.checks[key] = data.mobility.checks[key] || {};
  data.mobility.checks[key][index] = checked;
  saveData({ render: false });
}

function completeMobility() {
  const key = todayKey();
  if (!data.mobility.completedDates.includes(key)) {
    data.mobility.completedDates.push(key);
    saveData();
    alert("Daily mobility complete. +40 XP earned.");
  }
}


let activeMobilityDateKey = null;
let mobilitySavedPageScroll = 0;

function mobilityDateKey(dateKey) {
  return dateKey || (typeof selectedDashboardDateKey === "function" ? selectedDashboardDateKey() : todayKey());
}

function openMobilityRoutine(dateKey) {
  const modal = document.getElementById("mobilityRoutineModal");
  if (!modal) {
    console.error("Bell Performance: mobility routine modal is missing.");
    return;
  }
  activeMobilityDateKey = mobilityDateKey(dateKey);
  mobilitySavedPageScroll = window.scrollY;
  try {
    renderMobilityRoutineScreen();
    document.body.style.top = `-${mobilitySavedPageScroll}px`;
    document.body.classList.add("workout-open", "mobility-session");
    modal.classList.remove("hidden");
    modal.setAttribute("aria-hidden", "false");
  } catch (error) {
    console.error("Bell Performance: unable to open mobility routine.", error);
    document.body.classList.remove("workout-open", "mobility-session");
    document.body.style.top = "";
    activeMobilityDateKey = null;
  }
}

function closeMobilityRoutine() {
  const modal = document.getElementById("mobilityRoutineModal");
  if (modal) {
    modal.classList.add("hidden");
    modal.setAttribute("aria-hidden", "true");
  }
  document.body.classList.remove("workout-open", "mobility-session");
  document.body.style.top = "";
  window.scrollTo(0, mobilitySavedPageScroll);
  activeMobilityDateKey = null;
}

function updateMobilityRoutineSettings() {
  const focus = document.getElementById("mobilityRoutineFocusSelect");
  const minutes = document.getElementById("mobilityRoutineMinutesSelect");
  if (!focus || !minutes) return;
  data.mobility.focus = focus.value;
  data.mobility.minutes = Number(minutes.value) || 10;
  const key = mobilityDateKey(activeMobilityDateKey);
  data.mobility.checks[key] = {};
  saveData({ render: false });
  renderMobilityRoutineScreen();
}

function toggleMobilityRoutineMove(index, checked) {
  const key = mobilityDateKey(activeMobilityDateKey);
  data.mobility.checks[key] = data.mobility.checks[key] || {};
  data.mobility.checks[key][index] = Boolean(checked);
  saveData({ render: false });
  renderMobilityRoutineScreen();
}

function renderMobilityRoutineScreen() {
  const key = mobilityDateKey(activeMobilityDateKey);
  const routine = dailyMobilityRoutine();
  const checks = data.mobility.checks[key] || {};
  const completed = routine.filter((_, index) => checks[index]).length;
  const total = routine.length;
  const percent = total ? Math.round((completed / total) * 100) : 0;
  const focus = resolvedMobilityFocus();
  const minutes = Number(data.mobility.minutes) || 10;
  const done = data.mobility.completedDates.includes(key);

  const focusSelect = document.getElementById("mobilityRoutineFocusSelect");
  const minutesSelect = document.getElementById("mobilityRoutineMinutesSelect");
  if (focusSelect) focusSelect.value = data.mobility.focus || "Auto";
  if (minutesSelect) minutesSelect.value = String(minutes);
  setText("mobilityRoutineTitle", done ? "Mobility Complete" : "Daily Mobility");
  setText("mobilityRoutineHeroTitle", `${minutes} min ${focus}`);
  setText("mobilityRoutineDuration", `${minutes} min`);
  setText("mobilityRoutineFocus", focus);
  setText("mobilityRoutineReason", data.mobility.focus === "Auto" ? `Auto-selected ${focus} to support today's training.` : `${focus} recovery routine selected.`);
  setText("mobilityRoutineProgressText", `${completed} of ${total} movements complete`);
  const bar = document.getElementById("mobilityRoutineProgressBar");
  if (bar) bar.style.width = `${done ? 100 : percent}%`;

  const host = document.getElementById("mobilityRoutineMoves");
  if (host) {
    host.innerHTML = routine.map((move, index) => `
      <article class="mobility-routine-move ${checks[index] ? "complete" : ""}">
        <button type="button" class="mobility-move-check" onclick="toggleMobilityRoutineMove(${index},${checks[index] ? "false" : "true"})" aria-pressed="${checks[index] ? "true" : "false"}">${checks[index] ? "✓" : index + 1}</button>
        <div><span class="metric-label">Movement ${index + 1}</span><h3>${move[0]}</h3><p>${move[1]}</p><small>Move slowly and stay within a comfortable range.</small></div>
      </article>`).join("");
  }

  const finish = document.getElementById("finishMobilityRoutineButton");
  const hint = document.getElementById("mobilityRoutineFinishHint");
  if (finish) {
    finish.disabled = done || completed < total;
    finish.textContent = done ? "Mobility Completed ✓" : completed < total ? `Complete ${total - completed} More Movement${total - completed === 1 ? "" : "s"}` : "Finish Mobility Routine";
  }
  if (hint) hint.textContent = done ? "Recovery mobility is complete for this day." : completed < total ? "Check off every movement before finishing the routine." : "Routine complete. Finish to record recovery work and earn XP.";
}

function finishMobilityRoutine() {
  const key = mobilityDateKey(activeMobilityDateKey);
  const routine = dailyMobilityRoutine();
  const checks = data.mobility.checks[key] || {};
  if (!routine.every((_, index) => checks[index])) {
    alert("Complete each mobility movement before finishing the routine.");
    return;
  }
  if (!data.mobility.completedDates.includes(key)) {
    data.mobility.completedDates.push(key);
    saveData({ render: false });
  }
  renderMobilityRoutineScreen();
  if (typeof renderApp === "function") renderApp();
  setTimeout(() => alert("Daily mobility complete. +40 XP earned."), 50);
}
