"use strict";

let timerInterval = null;
let savedPageScroll = 0;

function currentPlan() {
  return data.plan.find(item => !item.done) || data.plan[0] || null;
}

function cardioPrescription(mission, modality) {
  const map = {
    "R-1 Recovery Run": {"Running":["Recovery Run","20 min easy"],"Cycling":["Easy Spin","25 min easy"],"Air Bike":["Recovery Ride","15–20 min easy"],"Rower":["Easy Row","15–20 min easy"],"Elliptical":["Easy Elliptical","20–25 min easy"],"Stair Climber":["Easy Climb","15–20 min easy"]},
    "R-2 Easy Run": {"Running":["Easy Run","2–3 miles"],"Cycling":["Zone 2 Ride","35–45 min"],"Air Bike":["Zone 2 Air Bike","25–35 min"],"Rower":["Zone 2 Row","25–35 min"],"Elliptical":["Zone 2 Elliptical","30–40 min"],"Stair Climber":["Zone 2 Climb","20–30 min"]},
    "R-3 Tempo Run": {"Running":["Tempo Run","3 × 5 min"],"Cycling":["Tempo Ride","3 × 6 min"],"Air Bike":["Tempo Air Bike","5 × 3 min"],"Rower":["Tempo Row","4 × 4 min"],"Elliptical":["Tempo Elliptical","3 × 6 min"],"Stair Climber":["Tempo Climb","4 × 4 min"]},
    "R-4 Intervals": {"Running":["Fast Interval","6 × 1 min"],"Cycling":["Bike Interval","8 × 1 min"],"Air Bike":["Air Bike Sprint","10 × 20 sec"],"Rower":["Row Interval","8 × 250 m"],"Elliptical":["Elliptical Interval","8 × 1 min"],"Stair Climber":["Climb Interval","8 × 45 sec"]},
    "R-5 Long Run": {"Running":["Long Easy Run","3–5 miles"],"Cycling":["Long Zone 2 Ride","60–90 min"],"Air Bike":["Long Aerobic Ride","35–50 min"],"Rower":["Long Easy Row","35–50 min"],"Elliptical":["Long Aerobic Session","45–60 min"],"Stair Climber":["Long Easy Climb","30–45 min"]}
  };
  return map[mission]?.[modality] || map[mission]?.Running;
}

function applyCardioModality(name, template) {
  if (!name.startsWith("R-")) return template;
  const modality = data.settings.cardioType || "Running";
  const selected = cardioPrescription(name, modality);
  const exercises = template.exercises.map((exercise, index) => {
    const targetIndex = ["R-3 Tempo Run", "R-4 Intervals"].includes(name) ? 1 : 0;
    return index === targetIndex ? {...exercise, name:selected[0], reps:selected[1]} : exercise;
  });
  return {...template, exercises, cardioType:modality};
}

function cardioGuidance() {
  const notes = {"Running":"Best for rebuilding running durability. Keep easy days conversational.","Cycling":"Low-impact aerobic work. Use steady cadence and moderate resistance.","Air Bike":"Full-body conditioning. Avoid turning every session into a sprint.","Rower":"Drive with the legs first, then finish with the arms.","Elliptical":"Low-impact option that closely matches steady running effort.","Stair Climber":"Keep posture tall and avoid leaning heavily on the handles."};
  return notes[data.settings.cardioType || "Running"];
}

function saveCardioType() { data.settings.cardioType = document.getElementById("cardioType").value; saveData(); }
function roundTo5(value) { return Math.max(5, Math.round(value / 5) * 5); }

function recommendedWeight(exerciseName, status) {
  const m = data.settings.maxes || {};
  const bodyweight = Number(data.settings.weight) || 207;
  const scale = status === "GREEN" ? 1 : status === "YELLOW" ? 0.90 : 0.75;
  const blockLoadFactor = data.trainingBlock?.enabled ? (strengthProgression().load / 0.76) : 1;
  const table = {
    "Bench Press":{base:(m.bench||315)*0.70,label:"based on bench strength"},"Paused Bench Press":{base:(m.bench||315)*0.74,label:"based on bench strength"},"Close-Grip Bench Press":{base:(m.bench||315)*0.62,label:"based on bench strength"},"Incline Barbell Press":{base:(m.bench||315)*0.58,label:"based on bench strength"},
    "Back Squat":{base:(m.squat||455)*0.68,label:"based on squat strength"},"Tempo Back Squat":{base:(m.squat||455)*0.58,label:"based on squat strength"},"Speed Back Squat":{base:(m.squat||455)*0.50,label:"move explosively"},"Front Squat":{base:(m.squat||455)*0.52,label:"based on squat strength"},"Narrow-Stance Squat":{base:(m.squat||455)*0.55,label:"based on squat strength"},
    "Deadlift":{base:(m.deadlift||455)*0.68,label:"based on deadlift strength"},"Trap-Bar Deadlift":{base:(m.deadlift||455)*0.68,label:"based on deadlift strength"},"Romanian Deadlift":{base:(m.deadlift||455)*0.45,label:"based on deadlift strength"},"Good Morning":{base:(m.squat||455)*0.28,label:"start conservatively"},
    "Push Press":{base:(m.pushPress||185)*0.70,label:"based on push-press strength"},"Strict Overhead Press":{base:(m.pushPress||185)*0.58,label:"based on overhead strength"},
    "Incline Dumbbell Press":{base:(m.bench||315)*0.18,label:"per dumbbell"},"Flat Dumbbell Press":{base:(m.bench||315)*0.20,label:"per dumbbell"},"Arnold Press":{base:(m.pushPress||185)*0.20,label:"per dumbbell"},"Dumbbell Floor Press":{base:(m.bench||315)*0.20,label:"per dumbbell"},
    "Single-Arm Dumbbell Row":{base:(m.bench||315)*0.24,label:"per dumbbell"},"Chest-Supported Row":{base:(m.bench||315)*0.21,label:"per dumbbell or equivalent"},
    "Reverse Lunge":{base:bodyweight*0.16,label:"per dumbbell"},"Bulgarian Split Squat":{base:bodyweight*0.15,label:"per dumbbell"},"Step-up":{base:bodyweight*0.14,label:"per dumbbell"},"Walking Lunge":{base:bodyweight*0.13,label:"per dumbbell"},
    "Kettlebell Swing":{base:bodyweight*0.24,label:"suggested kettlebell"},"Farmer Carry":{base:bodyweight*0.32,label:"per hand"},"Goblet Squat":{base:bodyweight*0.25,label:"suggested dumbbell or kettlebell"}
  };
  if (["Weighted Pull-up","Weighted Chin-up"].includes(exerciseName)) {
    const add = status === "GREEN" ? 25 : status === "YELLOW" ? 10 : 0;
    return {value:add,display:add?`Bodyweight + ${add} lb`:"Bodyweight",note:"Adjust to preserve clean reps."};
  }
  if (/Pull-up|Chin-up|Push-up|Jump|Sprint|Plank|Raise|Curl|Pressdown|Extension|Fly|Face Pull|Crunch|Ab Wheel|Hamstring Curl|Leg Extension/.test(exerciseName)) return {value:"",display:"Choose by effort",note:"Use clean reps and stop before technique breaks."};
  const item = table[exerciseName];
  if (!item) return {value:"",display:"Choose by effort",note:status === "GREEN" ? "Finish with 1–2 reps in reserve." : status === "YELLOW" ? "Finish with about 3 reps in reserve." : "Keep effort easy and technique-focused."};
  const value = roundTo5(item.base * scale * blockLoadFactor);
  return {value,display:`${value} lb`,note:`${item.label}; ${status.toLowerCase()} readiness applied.`};
}

function saveMaxes() {
  data.settings.maxes = {bench:+document.getElementById("benchMax").value||315,squat:+document.getElementById("squatMax").value||455,deadlift:+document.getElementById("deadliftMax").value||455,pushPress:+document.getElementById("pushPressMax").value||185};
  saveData(); alert("Training maxes saved. Weight recommendations have been updated.");
}

function saveRotationWeek() {
  data.settings.rotationWeek = Math.min(4, Math.max(1, +document.getElementById("rotationWeekInput").value || 1));
  saveData(); alert(`Rotation Week ${data.settings.rotationWeek} loaded.`);
}

function scaledTemplate(name) {
  let base = getWorkoutTemplate(name);
  if (!base) return null;
  base = blockRunOverride(name, base);
  if (!(data.trainingBlock?.enabled && data.trainingBlock.goalType === "10K" && name.startsWith("R-"))) base = applyCardioModality(name, base);
  const profile = scalingProfile();
  const isMobility = name.startsWith("M-");
  const isRun = name.startsWith("R-");
  return {
    ...base,
    name,
    label:getWorkoutLabel(name),
    rotationWeek:getRotationWeek(),
    readinessStatus:profile.status,
    duration:Math.max(10, Math.round(base.duration * (isMobility ? 1 : profile.status === "GREEN" ? 1 : profile.status === "YELLOW" ? 0.82 : 0.58))),
    exercises:base.exercises.map(exercise => {
      const originalSets = exercise.sets;
      let sets = exercise.sets;
      let reps = exercise.reps;
      if (!isMobility) {
        sets = Math.max(1, Math.floor(exercise.sets * (isRun ? profile.conditioning : profile.sets)));
        if (profile.status === "GREEN") sets = originalSets;
        if (!isRun && !isMobility && data.trainingBlock?.enabled) sets = Math.max(1, Math.floor(sets * strengthProgression().setScale));
        if (profile.status === "YELLOW" && exercise.block === "Golden Era Finisher") sets = Math.min(2, sets);
        if (profile.status === "RED" && exercise.block === "Golden Era Finisher") sets = 0;
        if (isRun && profile.status === "RED") { reps = (data.settings.cardioType||"Running") === "Running" ? "15–25 min easy walk or walk/jog" : "15–25 min very easy"; sets = 1; }
      }
      const recommendation = recommendedWeight(exercise.name, profile.status);
      return {...exercise,originalSets,sets,reps,recommendedWeight:recommendation.value,recommendationDisplay:recommendation.display,recommendationNote:recommendation.note,scaleNote:sets===0?"RED: optional finisher removed to protect recovery":profile.status === "GREEN"?`GREEN: ${sets} sets as written`:profile.status === "YELLOW"?`YELLOW: scaled to ${sets} sets and reduced load`: `RED: scaled to ${sets} sets and technique-focused load`};
    }).filter(exercise => exercise.sets > 0)
  };
}

function beginToday() { const plan=currentPlan(); if(plan) beginWorkout(plan.mission); else alert("All planned sessions are complete. Choose a workout from the Workouts tab."); }
function beginWorkout(name) {
  const template=scaledTemplate(name); if(!template) return;
  data.activeWorkout={name,label:template.label,rotationWeek:template.rotationWeek,startedAt:new Date().toISOString(),elapsed:0,rpe:"",notes:"",readiness:{score:readinessScore(),status:readinessStatus()},cardioType:name.startsWith("R-")?(data.settings.cardioType||"Running"):null,exercises:template.exercises.map(exercise=>({name:exercise.name,block:exercise.block,prescription:`${exercise.sets} × ${exercise.reps}`,originalSets:exercise.originalSets,cue:exercise.cue,scaleNote:exercise.scaleNote,recommendationDisplay:exercise.recommendationDisplay,recommendationNote:exercise.recommendationNote,sets:Array.from({length:exercise.sets},(_,index)=>({set:index+1,weight:typeof exercise.recommendedWeight==="number"?exercise.recommendedWeight:"",reps:exercise.reps,done:false}))}))};
  saveData({render:false}); openWorkoutUI(); startTimer();
}
function openWorkoutUI() {
  const active=data.activeWorkout; if(!active) return;
  if(!document.body.classList.contains("workout-open")){savedPageScroll=window.scrollY;document.body.style.top=`-${savedPageScroll}px`;document.body.classList.add("workout-open");}
  document.getElementById("workoutModal").classList.remove("hidden");
  document.getElementById("activeTitle").textContent=active.cardioType?`${active.label||active.name} • ${active.cardioType}`:(active.label||active.name);
  renderActiveWorkout();
}
function renderActiveWorkout() {
  const active=data.activeWorkout; if(!active) return;
  const container=document.getElementById("activeExercises"); container.innerHTML="";
  let lastBlock="";
  active.exercises.forEach((exercise,exerciseIndex)=>{
    if(exercise.block && exercise.block!==lastBlock){const heading=document.createElement("div");heading.className="workout-block-title";heading.textContent=exercise.block;container.appendChild(heading);lastBlock=exercise.block;}
    const card=document.createElement("div"); card.className="exercise-card";
    card.innerHTML=`<div class="exercise-head"><div class="exercise-num">${exerciseIndex+1}</div><div class="grow"><div class="exercise-name">${exercise.name}</div><div class="prescription">${exercise.prescription}</div><div class="cue">${exercise.cue||""}</div><div class="cue"><strong>Readiness:</strong> ${exercise.scaleNote||"As written"}</div><div class="cue"><strong>Starting weight:</strong> ${exercise.recommendationDisplay||"Choose by effort"}</div><div class="cue">${exercise.recommendationNote||""}</div></div></div><div class="set-head"><span>Set</span><span>Weight</span><span>Reps</span><span>Done</span></div><div id="sets-${exerciseIndex}"></div>`;
    container.appendChild(card);
    const setsContainer=card.querySelector(`#sets-${exerciseIndex}`);
    exercise.sets.forEach((set,setIndex)=>{const row=document.createElement("div");row.className="set-row";row.innerHTML=`<span>${set.set}</span><input inputmode="decimal" value="${set.weight}" oninput="updateSet(${exerciseIndex},${setIndex},'weight',this.value)"><input inputmode="text" value="${set.reps}" oninput="updateSet(${exerciseIndex},${setIndex},'reps',this.value)"><input type="checkbox" ${set.done?"checked":""} onchange="updateSet(${exerciseIndex},${setIndex},'done',this.checked)">`;setsContainer.appendChild(row);});
  });
  document.getElementById("sessionRpe").value=active.rpe||"";document.getElementById("sessionNotes").value=active.notes||"";updateTimerDisplay();updateWorkoutProgress();
}
function updateSet(exerciseIndex,setIndex,field,value){data.activeWorkout.exercises[exerciseIndex].sets[setIndex][field]=value;saveData({render:false});updateWorkoutProgress();}
function persistActive(){if(!data.activeWorkout)return;data.activeWorkout.rpe=document.getElementById("sessionRpe").value;data.activeWorkout.notes=document.getElementById("sessionNotes").value;saveData({render:false});}
function updateWorkoutProgress(){const sets=data.activeWorkout?.exercises.flatMap(exercise=>exercise.sets)||[];const completed=sets.filter(set=>set.done).length;const pct=sets.length?Math.round((completed/sets.length)*100):0;const bar=document.getElementById("workoutProgressBar");const text=document.getElementById("workoutProgressText");if(bar)bar.style.width=`${pct}%`;if(text)text.textContent=`${completed}/${sets.length} sets complete`;}
function startTimer(){clearInterval(timerInterval);timerInterval=setInterval(()=>{if(!data.activeWorkout)return;data.activeWorkout.elapsed=(data.activeWorkout.elapsed||0)+1;updateTimerDisplay();if(data.activeWorkout.elapsed%15===0)saveData({render:false});},1000);}
function updateTimerDisplay(){const elapsed=data.activeWorkout?.elapsed||0;const minutes=String(Math.floor(elapsed/60)).padStart(2,"0");const seconds=String(elapsed%60).padStart(2,"0");const timer=document.getElementById("workoutTimer");if(timer)timer.textContent=`${minutes}:${seconds}`;}
function closeWorkout(){if(data.activeWorkout)persistActive();document.getElementById("workoutModal").classList.add("hidden");clearInterval(timerInterval);document.body.classList.remove("workout-open");document.body.style.top="";window.scrollTo(0,savedPageScroll);}
function completeWorkout(){if(!data.activeWorkout)return;persistActive();const completed={...data.activeWorkout,completedAt:new Date().toISOString()};data.history.unshift(completed);const plan=data.plan.find(item=>item.mission===completed.name&&!item.done);if(plan)plan.done=true;closeWorkout();data.activeWorkout=null;saveData();alert("Workout complete. +100 XP earned.");}
function discardWorkout(){if(!confirm("Discard this workout?"))return;closeWorkout();data.activeWorkout=null;saveData();}
