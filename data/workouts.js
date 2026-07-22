"use strict";

const strengthRotations = {
  1: {
    "S-1 Upper Strength": {
      label: "Upper Strength A — Bench & Back",
      duration: 62,
      exercises: [
        {name:"Bench Press", block:"Primary Strength", sets:4, reps:"5", rest:150, cue:"Leave 1–2 reps in reserve."},
        {name:"Weighted Pull-up", block:"Primary Strength", sets:4, reps:"5–8", rest:120, cue:"Full hang. Drive chest toward the bar."},
        {name:"Incline Dumbbell Press", block:"Athletic Assistance", sets:3, reps:"8–10", rest:75, cue:"Controlled lowering."},
        {name:"Chest-Supported Row", block:"Athletic Assistance", sets:3, reps:"8–12", rest:75, cue:"Pause at the top."},
        {name:"Dumbbell Lateral Raise", block:"Golden Era Finisher", sets:3, reps:"12–15", rest:30, cue:"Superset with curls. Stop short of sloppy reps."},
        {name:"Incline Dumbbell Curl", block:"Golden Era Finisher", sets:3, reps:"10–12", rest:30, cue:"Superset with lateral raises."}
      ]
    },
    "S-2 Lower Strength": {
      label: "Lower Strength A — Squat",
      duration: 62,
      exercises: [
        {name:"Back Squat", block:"Primary Strength", sets:4, reps:"5", rest:180, cue:"Smooth reps. No grinders."},
        {name:"Romanian Deadlift", block:"Primary Strength", sets:3, reps:"6–8", rest:120, cue:"Hinge and keep lats tight."},
        {name:"Reverse Lunge", block:"Athletic Assistance", sets:3, reps:"8/leg", rest:75, cue:"Control the knee and pelvis."},
        {name:"Standing Calf Raise", block:"Athletic Assistance", sets:3, reps:"12–15", rest:45, cue:"Full stretch and pause."},
        {name:"Leg Extension", block:"Golden Era Finisher", sets:2, reps:"15–20", rest:30, cue:"Pair with ab work."},
        {name:"Hanging Knee Raise", block:"Golden Era Finisher", sets:2, reps:"10–15", rest:30, cue:"Control the pelvis."}
      ]
    },
    "S-3 Athletic Upper": {
      label: "Athletic Upper A — Power Press",
      duration: 55,
      exercises: [
        {name:"Push Press", block:"Primary Strength", sets:5, reps:"3", rest:120, cue:"Fast bar speed."},
        {name:"Chin-up", block:"Primary Strength", sets:4, reps:"AMRAP -2", rest:90, cue:"Stop before form breaks."},
        {name:"Single-Arm Dumbbell Row", block:"Athletic Assistance", sets:3, reps:"10/side", rest:60, cue:"Drive elbow toward hip."},
        {name:"Push-up", block:"Athletic Assistance", sets:3, reps:"12–20", rest:45, cue:"Rigid plank position."},
        {name:"Rear-Delt Fly", block:"Golden Era Finisher", sets:3, reps:"15–20", rest:30, cue:"Superset with triceps."},
        {name:"Rope Pressdown", block:"Golden Era Finisher", sets:3, reps:"12–15", rest:30, cue:"Full lockout without shoulder movement."}
      ]
    },
    "S-4 Athletic Lower": {
      label: "Athletic Lower A — Hinge & Jump",
      duration: 55,
      exercises: [
        {name:"Box Jump", block:"Power", sets:4, reps:"3", rest:60, cue:"Land quietly."},
        {name:"Trap-Bar Deadlift", block:"Primary Strength", sets:4, reps:"3", rest:150, cue:"Fast, clean reps."},
        {name:"Bulgarian Split Squat", block:"Athletic Assistance", sets:3, reps:"8/leg", rest:75, cue:"Stable trunk."},
        {name:"Kettlebell Swing", block:"Athletic Assistance", sets:3, reps:"15", rest:45, cue:"Snap the hips."},
        {name:"Seated Calf Raise", block:"Golden Era Finisher", sets:2, reps:"15–20", rest:30, cue:"Pause in the stretched position."},
        {name:"Tibialis Raise", block:"Golden Era Finisher", sets:2, reps:"15–25", rest:30, cue:"Keep heels down."}
      ]
    }
  },
  2: {
    "S-1 Upper Strength": {
      label: "Upper Strength B — Incline & Row",
      duration: 60,
      exercises: [
        {name:"Incline Barbell Press", block:"Primary Strength", sets:4, reps:"6", rest:135, cue:"Keep shoulder blades set."},
        {name:"Pendlay Row", block:"Primary Strength", sets:4, reps:"6", rest:105, cue:"Reset each rep from the floor."},
        {name:"Flat Dumbbell Press", block:"Athletic Assistance", sets:3, reps:"8–12", rest:75, cue:"Use a neutral grip if shoulders prefer it."},
        {name:"Neutral-Grip Lat Pulldown", block:"Athletic Assistance", sets:3, reps:"8–12", rest:75, cue:"Drive elbows down."},
        {name:"Cable Lateral Raise", block:"Golden Era Finisher", sets:3, reps:"12–15", rest:30, cue:"Superset with hammer curls."},
        {name:"Hammer Curl", block:"Golden Era Finisher", sets:3, reps:"10–12", rest:30, cue:"Keep elbows pinned."}
      ]
    },
    "S-2 Lower Strength": {
      label: "Lower Strength B — Deadlift",
      duration: 62,
      exercises: [
        {name:"Deadlift", block:"Primary Strength", sets:4, reps:"4", rest:180, cue:"Brace before every rep."},
        {name:"Front Squat", block:"Primary Strength", sets:3, reps:"6", rest:120, cue:"Stay tall and drive through midfoot."},
        {name:"Step-up", block:"Athletic Assistance", sets:3, reps:"8/leg", rest:75, cue:"Use the working leg, not the trailing foot."},
        {name:"Hamstring Curl", block:"Athletic Assistance", sets:3, reps:"10–12", rest:60, cue:"Slow eccentric."},
        {name:"Leg Extension", block:"Golden Era Finisher", sets:2, reps:"15–20", rest:30, cue:"Squeeze hard at the top."},
        {name:"Ab Wheel", block:"Golden Era Finisher", sets:2, reps:"8–12", rest:30, cue:"Keep ribs down."}
      ]
    },
    "S-3 Athletic Upper": {
      label: "Athletic Upper B — Close Grip",
      duration: 55,
      exercises: [
        {name:"Close-Grip Bench Press", block:"Primary Strength", sets:4, reps:"6", rest:120, cue:"Keep elbows under the bar."},
        {name:"Weighted Chin-up", block:"Primary Strength", sets:4, reps:"5–8", rest:105, cue:"Use a full range."},
        {name:"Landmine Press", block:"Athletic Assistance", sets:3, reps:"8/side", rest:60, cue:"Reach at the top."},
        {name:"Cable Row", block:"Athletic Assistance", sets:3, reps:"10–12", rest:60, cue:"Do not lean back."},
        {name:"Lean-Away Lateral Raise", block:"Golden Era Finisher", sets:3, reps:"12–15", rest:30, cue:"Superset with overhead triceps."},
        {name:"Overhead Triceps Extension", block:"Golden Era Finisher", sets:3, reps:"10–15", rest:30, cue:"Keep upper arms still."}
      ]
    },
    "S-4 Athletic Lower": {
      label: "Athletic Lower B — Speed Squat",
      duration: 54,
      exercises: [
        {name:"Broad Jump", block:"Power", sets:4, reps:"3", rest:60, cue:"Reset between reps."},
        {name:"Speed Back Squat", block:"Primary Strength", sets:6, reps:"2", rest:75, cue:"Move every rep explosively."},
        {name:"Single-Leg Romanian Deadlift", block:"Athletic Assistance", sets:3, reps:"8/leg", rest:60, cue:"Square the hips."},
        {name:"Walking Lunge", block:"Athletic Assistance", sets:3, reps:"10/leg", rest:60, cue:"Long, controlled stride."},
        {name:"Standing Calf Raise", block:"Golden Era Finisher", sets:2, reps:"15–20", rest:30, cue:"Full range."},
        {name:"Tibialis Raise", block:"Golden Era Finisher", sets:2, reps:"15–25", rest:30, cue:"Controlled reps."}
      ]
    }
  },
  3: {
    "S-1 Upper Strength": {
      label: "Upper Strength C — Pause Bench",
      duration: 61,
      exercises: [
        {name:"Paused Bench Press", block:"Primary Strength", sets:5, reps:"3", rest:150, cue:"One-count pause on the chest."},
        {name:"Weighted Pull-up", block:"Primary Strength", sets:4, reps:"6", rest:105, cue:"No swinging."},
        {name:"Arnold Press", block:"Athletic Assistance", sets:3, reps:"8–10", rest:75, cue:"Smooth rotation."},
        {name:"T-Bar Row", block:"Athletic Assistance", sets:3, reps:"8–12", rest:75, cue:"Keep chest supported when possible."},
        {name:"Dumbbell Lateral Raise", block:"Golden Era Finisher", sets:3, reps:"15", rest:30, cue:"Superset with preacher curls."},
        {name:"Preacher Curl", block:"Golden Era Finisher", sets:3, reps:"10–12", rest:30, cue:"Do not bounce from the bottom."}
      ]
    },
    "S-2 Lower Strength": {
      label: "Lower Strength C — Tempo Squat",
      duration: 60,
      exercises: [
        {name:"Tempo Back Squat", block:"Primary Strength", sets:4, reps:"4", rest:165, cue:"Three seconds down."},
        {name:"Good Morning", block:"Primary Strength", sets:3, reps:"8", rest:105, cue:"Brace and hinge."},
        {name:"Reverse Smith Lunge", block:"Athletic Assistance", sets:3, reps:"8/leg", rest:75, cue:"Keep front foot planted."},
        {name:"Hamstring Curl", block:"Athletic Assistance", sets:3, reps:"10–15", rest:60, cue:"Control the return."},
        {name:"Leg Extension", block:"Golden Era Finisher", sets:2, reps:"15–20", rest:30, cue:"Do not lock out aggressively."},
        {name:"Cable Crunch", block:"Golden Era Finisher", sets:2, reps:"12–15", rest:30, cue:"Curl ribs toward pelvis."}
      ]
    },
    "S-3 Athletic Upper": {
      label: "Athletic Upper C — Dumbbell Power",
      duration: 54,
      exercises: [
        {name:"Single-Arm Dumbbell Push Press", block:"Power", sets:4, reps:"5/side", rest:75, cue:"Drive through the floor."},
        {name:"Chest-to-Bar Pull-up", block:"Primary Strength", sets:4, reps:"5–8", rest:90, cue:"Stop before speed drops."},
        {name:"Dumbbell Floor Press", block:"Athletic Assistance", sets:3, reps:"10", rest:60, cue:"Pause triceps on floor."},
        {name:"Single-Arm Cable Row", block:"Athletic Assistance", sets:3, reps:"10/side", rest:60, cue:"Resist rotation."},
        {name:"Rear-Delt Fly", block:"Golden Era Finisher", sets:3, reps:"15–20", rest:30, cue:"Superset with pressdowns."},
        {name:"Rope Pressdown", block:"Golden Era Finisher", sets:3, reps:"12–15", rest:30, cue:"Spread the rope at lockout."}
      ]
    },
    "S-4 Athletic Lower": {
      label: "Athletic Lower C — Unilateral",
      duration: 55,
      exercises: [
        {name:"Box Jump", block:"Power", sets:4, reps:"3", rest:60, cue:"Quality over height."},
        {name:"Front Squat", block:"Primary Strength", sets:4, reps:"5", rest:135, cue:"Elbows high."},
        {name:"Bulgarian Split Squat", block:"Athletic Assistance", sets:3, reps:"10/leg", rest:75, cue:"Control the bottom."},
        {name:"Kettlebell Swing", block:"Athletic Assistance", sets:4, reps:"12", rest:45, cue:"Powerful hip snap."},
        {name:"Seated Calf Raise", block:"Golden Era Finisher", sets:2, reps:"15–20", rest:30, cue:"Slow eccentric."},
        {name:"Side Plank", block:"Golden Era Finisher", sets:2, reps:"30–45 sec/side", rest:30, cue:"Straight line from head to heel."}
      ]
    }
  },
  4: {
    "S-1 Upper Strength": {
      label: "Upper Strength D — Volume Bench",
      duration: 60,
      exercises: [
        {name:"Bench Press", block:"Primary Strength", sets:4, reps:"8", rest:120, cue:"Use a moderate, repeatable load."},
        {name:"Chin-up", block:"Primary Strength", sets:4, reps:"8–10", rest:90, cue:"Add weight only if all reps stay clean."},
        {name:"Incline Dumbbell Press", block:"Athletic Assistance", sets:3, reps:"10–12", rest:60, cue:"Do not rush the lowering."},
        {name:"Single-Arm Dumbbell Row", block:"Athletic Assistance", sets:3, reps:"10–12/side", rest:60, cue:"Full stretch at the bottom."},
        {name:"Mechanical Drop-Set Lateral Raise", block:"Golden Era Finisher", sets:2, reps:"10+10", rest:45, cue:"Strict reps then partials."},
        {name:"Alternating Dumbbell Curl", block:"Golden Era Finisher", sets:2, reps:"12/side", rest:30, cue:"Rotate the palm up hard."}
      ]
    },
    "S-2 Lower Strength": {
      label: "Lower Strength D — Volume Hinge",
      duration: 60,
      exercises: [
        {name:"Trap-Bar Deadlift", block:"Primary Strength", sets:4, reps:"6", rest:150, cue:"Leave two reps in reserve."},
        {name:"Narrow-Stance Squat", block:"Primary Strength", sets:3, reps:"8", rest:120, cue:"Stay upright and controlled."},
        {name:"Step-up", block:"Athletic Assistance", sets:3, reps:"10/leg", rest:60, cue:"Drive through the whole foot."},
        {name:"Hamstring Curl", block:"Athletic Assistance", sets:3, reps:"12–15", rest:45, cue:"Hard squeeze."},
        {name:"Leg Extension", block:"Golden Era Finisher", sets:2, reps:"20", rest:30, cue:"Chase tension, not load."},
        {name:"Hanging Knee Raise", block:"Golden Era Finisher", sets:2, reps:"12–15", rest:30, cue:"Avoid swinging."}
      ]
    },
    "S-3 Athletic Upper": {
      label: "Athletic Upper D — Shoulder & Arms",
      duration: 52,
      exercises: [
        {name:"Strict Overhead Press", block:"Primary Strength", sets:4, reps:"6", rest:120, cue:"Squeeze glutes and ribs down."},
        {name:"Neutral-Grip Pull-up", block:"Primary Strength", sets:4, reps:"6–10", rest:90, cue:"Use a smooth cadence."},
        {name:"Push-up", block:"Athletic Assistance", sets:3, reps:"15–20", rest:45, cue:"Stop one rep before form breaks."},
        {name:"Face Pull", block:"Athletic Assistance", sets:3, reps:"15–20", rest:45, cue:"Pull toward forehead."},
        {name:"Lateral Raise", block:"Golden Era Finisher", sets:3, reps:"12–15", rest:20, cue:"Tri-set with curls and triceps."},
        {name:"EZ-Bar Curl", block:"Golden Era Finisher", sets:3, reps:"10–12", rest:20, cue:"Tri-set with lateral raises and triceps."},
        {name:"Rope Pressdown", block:"Golden Era Finisher", sets:3, reps:"12–15", rest:45, cue:"Finish the tri-set here."}
      ]
    },
    "S-4 Athletic Lower": {
      label: "Athletic Lower D — Carry & Conditioning",
      duration: 52,
      exercises: [
        {name:"Broad Jump", block:"Power", sets:4, reps:"3", rest:60, cue:"Explode and stick the landing."},
        {name:"Goblet Squat", block:"Primary Strength", sets:4, reps:"10", rest:75, cue:"Keep torso tall."},
        {name:"Romanian Deadlift", block:"Athletic Assistance", sets:3, reps:"10", rest:75, cue:"Maintain tension."},
        {name:"Farmer Carry", block:"Athletic Assistance", sets:4, reps:"40 yd", rest:45, cue:"Tall posture and hard brace."},
        {name:"Standing Calf Raise", block:"Golden Era Finisher", sets:2, reps:"20", rest:30, cue:"Full range."},
        {name:"Tibialis Raise", block:"Golden Era Finisher", sets:2, reps:"20", rest:30, cue:"Controlled burn."}
      ]
    }
  }
};

const bodybuildingVariations = {
  "B-1 Chest & Back": [
    ["Bench Press","Weighted Pull-up","Incline Dumbbell Press","Chest-Supported Row","Cable Fly","Straight-Arm Pulldown"],
    ["Incline Barbell Press","Pendlay Row","Flat Dumbbell Press","Neutral-Grip Lat Pulldown","Pec Deck","Single-Arm Cable Row"],
    ["Paused Bench Press","T-Bar Row","Low-Incline Dumbbell Press","Chin-up","Cable Crossover","Dumbbell Pullover"],
    ["Machine Chest Press","Wide-Grip Pulldown","Incline Smith Press","Single-Arm Dumbbell Row","Push-up","Face Pull"]
  ],
  "B-2 Legs": [
    ["Back Squat","Romanian Deadlift","Leg Press","Hamstring Curl","Leg Extension","Standing Calf Raise"],
    ["Front Squat","Good Morning","Bulgarian Split Squat","Seated Leg Curl","Leg Extension","Seated Calf Raise"],
    ["Hack Squat","Romanian Deadlift","Reverse Smith Lunge","Hamstring Curl","Leg Extension","Standing Calf Raise"],
    ["Narrow-Stance Squat","Hip Thrust","Walking Lunge","Seated Leg Curl","Leg Extension","Tibialis Raise"]
  ],
  "B-3 Shoulders & Arms": [
    ["Seated Dumbbell Press","Dumbbell Lateral Raise","Rear-Delt Fly","EZ-Bar Curl","Incline Dumbbell Curl","Rope Pressdown","Overhead Triceps Extension"],
    ["Arnold Press","Cable Lateral Raise","Face Pull","Preacher Curl","Hammer Curl","Close-Grip Bench Press","Rope Pressdown"],
    ["Strict Overhead Press","Machine Lateral Raise","Reverse Pec Deck","Barbell Curl","Bayesian Cable Curl","Skull Crusher","Single-Arm Pressdown"],
    ["Machine Shoulder Press","Mechanical Drop-Set Lateral Raise","Rear-Delt Cable Fly","Alternating Dumbbell Curl","Cable Curl","Dips","Overhead Cable Extension"]
  ],
  "B-4 Back & Posterior": [
    ["Deadlift","Neutral-Grip Pull-up","Chest-Supported Row","Single-Leg Romanian Deadlift","Hamstring Curl","Farmer Carry"],
    ["Trap-Bar Deadlift","Wide-Grip Lat Pulldown","Single-Arm Dumbbell Row","Hip Thrust","Seated Leg Curl","Back Extension"],
    ["Romanian Deadlift","Chin-up","T-Bar Row","Reverse Lunge","Hamstring Curl","Face Pull"],
    ["Rack Pull","Neutral-Grip Lat Pulldown","Cable Row","Good Morning","Glute Bridge","Rear-Delt Fly"]
  ]
};

const femaleBodybuildingVariations = {
  "B-1 Chest & Back": [
    ["Incline Dumbbell Press","Neutral-Grip Lat Pulldown","Machine Chest Press","Chest-Supported Row","Cable Lateral Raise","Face Pull"],
    ["Incline Barbell Press","Assisted Pull-up","Flat Dumbbell Press","Single-Arm Cable Row","Cable Fly","Rear-Delt Fly"],
    ["Low-Incline Dumbbell Press","Wide-Grip Lat Pulldown","Machine Chest Press","T-Bar Row","Cable Lateral Raise","Straight-Arm Pulldown"],
    ["Incline Smith Press","Neutral-Grip Pulldown","Push-up","Single-Arm Dumbbell Row","Pec Deck","Face Pull"]
  ],
  "B-2 Legs": [
    ["Back Squat","Hip Thrust","Leg Press","Romanian Deadlift","Leg Extension","Cable Hip Abduction","Standing Calf Raise"],
    ["Front Squat","Barbell Glute Bridge","Bulgarian Split Squat","Seated Leg Curl","Leg Extension","Cable Hip Abduction","Seated Calf Raise"],
    ["Hack Squat","Hip Thrust","Reverse Smith Lunge","Romanian Deadlift","Leg Extension","Machine Hip Abduction","Standing Calf Raise"],
    ["Narrow-Stance Squat","Romanian Deadlift","Walking Lunge","Seated Leg Curl","Leg Extension","Machine Hip Abduction","Tibialis Raise"]
  ],
  "B-3 Shoulders & Arms": [
    ["Seated Dumbbell Press","Dumbbell Lateral Raise","Rear-Delt Fly","EZ-Bar Curl","Incline Dumbbell Curl","Rope Pressdown","Overhead Triceps Extension"],
    ["Arnold Press","Cable Lateral Raise","Face Pull","Preacher Curl","Hammer Curl","Close-Grip Push-up","Rope Pressdown"],
    ["Machine Shoulder Press","Machine Lateral Raise","Reverse Pec Deck","Barbell Curl","Bayesian Cable Curl","Skull Crusher","Single-Arm Pressdown"],
    ["Seated Dumbbell Press","Mechanical Drop-Set Lateral Raise","Rear-Delt Cable Fly","Alternating Dumbbell Curl","Cable Curl","Bench Dip","Overhead Cable Extension"]
  ],
  "B-4 Back & Posterior": [
    ["Romanian Deadlift","Hip Thrust","Neutral-Grip Pull-up","Chest-Supported Row","Seated Leg Curl","Cable Kickback","Farmer Carry"],
    ["Trap-Bar Deadlift","Barbell Glute Bridge","Wide-Grip Lat Pulldown","Single-Arm Dumbbell Row","Seated Leg Curl","Back Extension","Cable Hip Abduction"],
    ["Romanian Deadlift","Reverse Lunge","Chin-up","T-Bar Row","Hamstring Curl","Cable Kickback","Face Pull"],
    ["Good Morning","Hip Thrust","Neutral-Grip Lat Pulldown","Cable Row","Glute Bridge","Rear-Delt Fly","Machine Hip Abduction"]
  ]
};

function getBodybuildingTemplate(name, rotationWeek = getRotationWeek()) {
  const sex=data?.settings?.sex||"Prefer not to say"; const library=sex==="Female"?femaleBodybuildingVariations:bodybuildingVariations; const options=library[name]||bodybuildingVariations[name]; if(!options)return null; const ex=options[Math.max(0,Math.min(3,rotationWeek-1))];
  const focus=data?.trainingBlock?.bodybuildingFocus||"Balanced"; const phase=data?.trainingBlock?.bodybuildingPhase||"Recomposition";
  const profileLabel=sex==="Female"?"Female Profile":sex==="Male"?"Male Profile":"Individual Profile";
  return {label:`${name.replace(/^B-\d\s*/,"")} — ${focus} Focus • ${profileLabel}`,duration:name.includes("Shoulders")?68:72,exercises:ex.map((exercise,i)=>{
    const compound=i<2, armDay=name.includes("Shoulders"), gluteExercise=/Hip Thrust|Glute|Kickback|Abduction|Romanian|Lunge/.test(exercise), focusBoost=(focus==="Shoulders & Arms"&&armDay)||(focus==="Chest & Back"&&name.includes("Chest"))||(focus==="Legs"&&name.includes("Legs"))||(focus==="Glutes & Hamstrings"&&gluteExercise);
    const sets=compound?4:(focusBoost&&i>=2?4:3); const reps=compound?(phase==="Lean Gain"?"6–10":"8–12"):(i>=ex.length-2?"12–20":"10–15");
    return{name:exercise,block:compound?"Primary Hypertrophy":"Accessory Hypertrophy",sets,reps,rest:compound?105:45,cue:compound?"Control the eccentric and stop with 1–2 reps in reserve.":"Use full range and constant tension. Add load only after reaching the top of the rep range."};
  })};
}

const conditioningTemplates = {
  "R-1 Recovery Run": {duration:20, exercises:[{name:"Recovery Run", block:"Conditioning", sets:1, reps:"20 min easy", rest:0, cue:"Very easy pace. Nasal breathing when possible."}]},
  "R-2 Easy Run": {duration:30, exercises:[{name:"Easy Run", block:"Conditioning", sets:1, reps:"2–3 miles", rest:0, cue:"Conversational pace."}]},
  "R-3 Tempo Run": {duration:30, exercises:[{name:"Warm-up Walk/Jog", block:"Warm-up", sets:1, reps:"8 min", rest:0, cue:"Start easy."},{name:"Tempo Run", block:"Conditioning", sets:3, reps:"5 min", rest:120, cue:"Controlled hard pace."},{name:"Cool-down", block:"Cool-down", sets:1, reps:"5 min", rest:0, cue:"Easy jog or walk."}]},
  "R-4 Intervals": {duration:30, exercises:[{name:"Warm-up", block:"Warm-up", sets:1, reps:"10 min", rest:0, cue:"Easy work plus drills."},{name:"Fast Interval", block:"Conditioning", sets:6, reps:"1 min", rest:120, cue:"Fast, not all-out."},{name:"Cool-down", block:"Cool-down", sets:1, reps:"5 min", rest:0, cue:"Walk or easy movement."}]},
  "R-5 Long Run": {duration:45, exercises:[{name:"Long Easy Run", block:"Conditioning", sets:1, reps:"3–5 miles", rest:0, cue:"Keep effort easy and steady."}]},
  "M-1 Daily Reset": {duration:10, exercises:[{name:"Deep Squat Hold", block:"Mobility", sets:1, reps:"60 sec", rest:0, cue:"Use support if needed."},{name:"World's Greatest Stretch", block:"Mobility", sets:1, reps:"5/side", rest:0, cue:"Slow rotation."},{name:"Couch Stretch", block:"Mobility", sets:1, reps:"45 sec/side", rest:0, cue:"Keep ribs down."},{name:"90/90 Hip Rotations", block:"Mobility", sets:1, reps:"10", rest:0, cue:"Stay tall."},{name:"Dead Hang", block:"Mobility", sets:1, reps:"30–45 sec", rest:0, cue:"Relax shoulders."}]}
};

function getRotationWeek() {
  const week = Number(data?.settings?.rotationWeek) || 1;
  return Math.min(4, Math.max(1, week));
}

function applyAthleteProfile(template, name) {
  if (!template) return null;
  const sex=data?.settings?.sex||"Prefer not to say";
  if (sex!=="Female" || !name.startsWith("S-")) return template;
  const copy={...template,exercises:template.exercises.map(x=>({...x}))};
  if (name.includes("Lower")) {
    const preferred=copy.exercises.find(x=>/Lunge|Split Squat|Romanian|Hip Thrust|Glute|Hamstring/.test(x.name));
    if (preferred) { preferred.sets=Math.min(4,(preferred.sets||3)+1); preferred.cue=`${preferred.cue||""} Female profile: extra lower-body accessory volume while maintaining the same primary strength work.`.trim(); }
  }
  if (name.includes("Upper")) {
    const preferred=copy.exercises.find(x=>/Row|Pull|Rear|Face Pull|Lateral/.test(x.name));
    if (preferred) { preferred.sets=Math.min(4,(preferred.sets||3)+1); preferred.cue=`${preferred.cue||""} Female profile: extra upper-back or shoulder volume for balanced development.`.trim(); }
  }
  return copy;
}

function getWorkoutTemplate(name, rotationWeek = getRotationWeek()) {
  if (name.startsWith("S-")) return applyAthleteProfile(strengthRotations[rotationWeek]?.[name] || strengthRotations[1][name],name);
  if (name.startsWith("B-")) return getBodybuildingTemplate(name, rotationWeek);
  return conditioningTemplates[name] || null;
}

function getWorkoutLabel(name, rotationWeek = getRotationWeek()) {
  return getWorkoutTemplate(name, rotationWeek)?.label || name;
}

function allWorkoutNames() {
  return ["S-1 Upper Strength", "S-2 Lower Strength", "S-3 Athletic Upper", "S-4 Athletic Lower", "B-1 Chest & Back", "B-2 Legs", "B-3 Shoulders & Arms", "B-4 Back & Posterior", "R-1 Recovery Run", "R-2 Easy Run", "R-3 Tempo Run", "R-4 Intervals", "R-5 Long Run", "M-1 Daily Reset"];
}

const motivationalQuotes=[
 {text:"Discipline is choosing between what you want now and what you want most.",author:"Abraham Lincoln"},
 {text:"Success is the sum of small efforts repeated day in and day out.",author:"Robert Collier"},
 {text:"You do not rise to the level of your goals. You fall to the level of your systems.",author:"James Clear"},
 {text:"The secret of getting ahead is getting started.",author:"Mark Twain"},
 {text:"Train hard, recover well, and show up again.",author:"Bell Performance"},
 {text:"Strong enough for the task. Fit enough for the mission. Ready for the life.",author:"Bell Performance"},
 {text:"Build the body that can carry the life you want to live.",author:"Bell Performance"},
 {text:"Stay ready so you do not have to get ready.",author:"Traditional saying"}
];
