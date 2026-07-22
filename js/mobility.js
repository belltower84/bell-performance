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
