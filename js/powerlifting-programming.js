"use strict";

/* Bell Performance 12.2.12 — discipline-specific powerlifting programming.
   Powerlifting is built around squat, bench press, and deadlift specificity.
   Engine work is limited to low-intensity aerobic support unless the athlete
   deliberately chooses a separate endurance-focused mission. */

const BELL_POWERLIFTING_MISSIONS = [
  "PL-1 Squat Focus",
  "PL-2 Bench Focus",
  "PL-3 Deadlift Focus",
  "PL-4 Secondary Squat + Bench"
];

const bellPowerliftingRotations = {
  1: {
    "PL-1 Squat Focus": {label:"Squat Focus — Competition Volume",duration:72,exercises:[
      {name:"Back Squat",block:"Competition Lift",sets:4,reps:"5 @ RPE 6–7",rest:180,cue:"Competition stance and depth. Every rep should look the same."},
      {name:"Paused Bench Press",block:"Secondary Competition Lift",sets:4,reps:"5 @ RPE 6–7",rest:150,cue:"One-count pause. Hold the same setup on every rep."},
      {name:"Romanian Deadlift",block:"Supplemental Strength",sets:3,reps:"6–8",rest:120,cue:"Build the posterior chain without creating deadlift-day fatigue."},
      {name:"Leg Press",block:"Assistance",sets:3,reps:"8–12",rest:90,cue:"Controlled range and repeatable effort."},
      {name:"Ab Wheel",block:"Required Core",sets:3,reps:"8–12",rest:60,cue:"Brace as if preparing for a heavy squat."}
    ]},
    "PL-2 Bench Focus": {label:"Bench Focus — Competition Volume",duration:68,exercises:[
      {name:"Bench Press",block:"Competition Lift",sets:5,reps:"5 @ RPE 6–7",rest:180,cue:"Use commands in practice when possible."},
      {name:"Close-Grip Bench Press",block:"Supplemental Press",sets:3,reps:"6–8",rest:120,cue:"Keep the competition setup and build triceps strength."},
      {name:"Chest-Supported Row",block:"Upper-Back Strength",sets:4,reps:"8–12",rest:90,cue:"Keep the upper back strong enough to hold position."},
      {name:"Neutral-Grip Lat Pulldown",block:"Assistance",sets:3,reps:"8–12",rest:75,cue:"Control the stretch and drive elbows down."},
      {name:"Rope Pressdown",block:"Assistance",sets:3,reps:"12–15",rest:45,cue:"Finish with clean lockouts."}
    ]},
    "PL-3 Deadlift Focus": {label:"Deadlift Focus — Competition Volume",duration:72,exercises:[
      {name:"Deadlift",block:"Competition Lift",sets:4,reps:"4 @ RPE 6–7",rest:210,cue:"Reset and brace before every repetition."},
      {name:"Tempo Back Squat",block:"Secondary Squat",sets:3,reps:"5 @ RPE 6",rest:150,cue:"Control the descent and maintain position."},
      {name:"Barbell Row",block:"Supplemental Strength",sets:4,reps:"6–8",rest:105,cue:"Build lats and upper back for the pull."},
      {name:"Hamstring Curl",block:"Assistance",sets:3,reps:"10–15",rest:60,cue:"Use a controlled eccentric."},
      {name:"Side Plank",block:"Required Core",sets:3,reps:"30–45 sec/side",rest:45,cue:"Resist rotation and keep the pelvis stacked."}
    ]},
    "PL-4 Secondary Squat + Bench": {label:"Secondary Squat + Bench — Technique",duration:65,exercises:[
      {name:"Paused Back Squat",block:"Squat Variation",sets:4,reps:"4 @ RPE 6–7",rest:165,cue:"Pause without losing brace or position."},
      {name:"Bench Press",block:"Bench Technique",sets:6,reps:"3 @ RPE 6",rest:105,cue:"Fast, technically identical repetitions."},
      {name:"Bulgarian Split Squat",block:"Assistance",sets:3,reps:"8/leg",rest:75,cue:"Build leg strength without excessive spinal fatigue."},
      {name:"Cable Row",block:"Upper-Back Assistance",sets:3,reps:"10–12",rest:60,cue:"Stay braced and do not lean back."},
      {name:"Face Pull",block:"Shoulder Health",sets:3,reps:"15–20",rest:45,cue:"Support stable bench mechanics."}
    ]}
  },
  2: {
    "PL-1 Squat Focus": {label:"Squat Focus — Strength Build",duration:74,exercises:[
      {name:"Back Squat",block:"Competition Lift",sets:1,reps:"Top set of 4 @ RPE 8",rest:240,cue:"No grinding. Record the actual RPE."},
      {name:"Back Squat",block:"Back-Off Strength",sets:4,reps:"4 at 90–92% of top-set load",rest:180,cue:"Preserve depth and bar path."},
      {name:"Paused Bench Press",block:"Secondary Competition Lift",sets:4,reps:"4 @ RPE 7",rest:150,cue:"Competition pause and stable touch point."},
      {name:"Good Morning",block:"Supplemental Strength",sets:3,reps:"6–8",rest:120,cue:"Use a conservative load and rigid brace."},
      {name:"Hanging Knee Raise",block:"Required Core",sets:3,reps:"10–15",rest:45,cue:"Control the pelvis."}
    ]},
    "PL-2 Bench Focus": {label:"Bench Focus — Strength Build",duration:70,exercises:[
      {name:"Bench Press",block:"Competition Lift",sets:1,reps:"Top set of 4 @ RPE 8",rest:240,cue:"Practice commands and record actual RPE."},
      {name:"Bench Press",block:"Back-Off Strength",sets:4,reps:"4 at 90–92% of top-set load",rest:165,cue:"Repeat the same setup and touch point."},
      {name:"Spoto Press",block:"Supplemental Press",sets:3,reps:"5–7",rest:120,cue:"Pause just above the chest without losing tension."},
      {name:"Weighted Pull-up",block:"Upper-Back Strength",sets:4,reps:"5–8",rest:105,cue:"Full range and no swinging."},
      {name:"Overhead Triceps Extension",block:"Assistance",sets:3,reps:"10–15",rest:60,cue:"Build lockout strength without elbow irritation."}
    ]},
    "PL-3 Deadlift Focus": {label:"Deadlift Focus — Strength Build",duration:74,exercises:[
      {name:"Deadlift",block:"Competition Lift",sets:1,reps:"Top set of 3 @ RPE 8",rest:270,cue:"End the set before position breaks."},
      {name:"Deadlift",block:"Back-Off Strength",sets:3,reps:"3 at 88–90% of top-set load",rest:210,cue:"Reset completely between reps."},
      {name:"Front Squat",block:"Secondary Squat",sets:3,reps:"5–6 @ RPE 7",rest:150,cue:"Stay upright and build quad strength."},
      {name:"Chest-Supported Row",block:"Upper-Back Strength",sets:4,reps:"8–10",rest:90,cue:"Support deadlift position without more low-back fatigue."},
      {name:"Hamstring Curl",block:"Assistance",sets:3,reps:"10–12",rest:60,cue:"Controlled eccentric."}
    ]},
    "PL-4 Secondary Squat + Bench": {label:"Secondary Squat + Bench — Volume",duration:68,exercises:[
      {name:"High-Bar Back Squat",block:"Squat Variation",sets:4,reps:"5 @ RPE 7",rest:165,cue:"Use controlled volume to support the competition squat."},
      {name:"Close-Grip Bench Press",block:"Bench Variation",sets:4,reps:"6 @ RPE 7",rest:135,cue:"Keep the same leg drive and upper-back position."},
      {name:"Romanian Deadlift",block:"Posterior Chain",sets:3,reps:"8",rest:105,cue:"Moderate load; do not turn this into another deadlift day."},
      {name:"Single-Arm Dumbbell Row",block:"Upper-Back Assistance",sets:3,reps:"10/side",rest:60,cue:"Keep the torso stable."},
      {name:"Rope Pressdown",block:"Assistance",sets:3,reps:"12–15",rest:45,cue:"Clean lockout."}
    ]}
  },
  3: {
    "PL-1 Squat Focus": {label:"Squat Focus — Intensification",duration:72,exercises:[
      {name:"Back Squat",block:"Competition Lift",sets:1,reps:"Top single @ RPE 7–8",rest:270,cue:"A technically clean single, not a max."},
      {name:"Back Squat",block:"Back-Off Strength",sets:4,reps:"3 @ 80–84%",rest:195,cue:"Keep every rep competition-standard."},
      {name:"Paused Bench Press",block:"Secondary Competition Lift",sets:4,reps:"3 @ RPE 7",rest:150,cue:"Pause and press on command."},
      {name:"Leg Press",block:"Assistance",sets:3,reps:"8–10",rest:90,cue:"Maintain quad volume with lower technical cost."},
      {name:"Ab Wheel",block:"Required Core",sets:3,reps:"8–12",rest:60,cue:"Brace hard."}
    ]},
    "PL-2 Bench Focus": {label:"Bench Focus — Intensification",duration:68,exercises:[
      {name:"Bench Press",block:"Competition Lift",sets:1,reps:"Top single @ RPE 7–8",rest:270,cue:"Use commands and a stable pause."},
      {name:"Bench Press",block:"Back-Off Strength",sets:5,reps:"3 @ 80–84%",rest:165,cue:"Fast press with no technical drift."},
      {name:"Pin Press",block:"Weak-Point Press",sets:3,reps:"4–6",rest:120,cue:"Select a pin height that targets the athlete's sticking point."},
      {name:"Chest-Supported Row",block:"Upper-Back Strength",sets:4,reps:"8",rest:90,cue:"Heavy but controlled."},
      {name:"Rope Pressdown",block:"Assistance",sets:3,reps:"10–15",rest:45,cue:"Protect elbows and build lockout capacity."}
    ]},
    "PL-3 Deadlift Focus": {label:"Deadlift Focus — Intensification",duration:72,exercises:[
      {name:"Deadlift",block:"Competition Lift",sets:1,reps:"Top single @ RPE 7–8",rest:300,cue:"Treat it like a meet attempt without maxing out."},
      {name:"Deadlift",block:"Back-Off Strength",sets:3,reps:"3 @ 78–82%",rest:225,cue:"Repeat the competition setup."},
      {name:"Paused Back Squat",block:"Secondary Squat",sets:3,reps:"3–4 @ RPE 7",rest:165,cue:"Stay tight in the bottom."},
      {name:"Barbell Row",block:"Upper-Back Strength",sets:3,reps:"6–8",rest:105,cue:"Use only as much load as the low back can recover from."},
      {name:"Hamstring Curl",block:"Assistance",sets:3,reps:"10–12",rest:60,cue:"Controlled repetitions."}
    ]},
    "PL-4 Secondary Squat + Bench": {label:"Secondary Squat + Bench — Weak Points",duration:66,exercises:[
      {name:"Tempo Back Squat",block:"Squat Variation",sets:3,reps:"4 @ RPE 7",rest:165,cue:"Use the variation selected for the athlete's technical weakness."},
      {name:"Close-Grip Bench Press",block:"Bench Variation",sets:4,reps:"5 @ RPE 7",rest:135,cue:"Prioritize triceps and consistent technique."},
      {name:"Bulgarian Split Squat",block:"Assistance",sets:3,reps:"8/leg",rest:75,cue:"Build balance and leg strength."},
      {name:"Neutral-Grip Lat Pulldown",block:"Upper-Back Assistance",sets:3,reps:"8–12",rest:75,cue:"Maintain upper-back volume."},
      {name:"Face Pull",block:"Shoulder Health",sets:3,reps:"15–20",rest:45,cue:"Keep shoulders prepared for frequent benching."}
    ]}
  },
  4: {
    "PL-1 Squat Focus": {label:"Squat Focus — Recovery / Technique",duration:55,exercises:[
      {name:"Back Squat",block:"Competition Technique",sets:3,reps:"3 @ RPE 6",rest:165,cue:"Crisp, low-fatigue competition reps."},
      {name:"Paused Bench Press",block:"Secondary Technique",sets:3,reps:"3 @ RPE 6",rest:120,cue:"Practice pauses and commands."},
      {name:"Romanian Deadlift",block:"Light Assistance",sets:2,reps:"6–8",rest:90,cue:"Leave substantial reserve."},
      {name:"Ab Wheel",block:"Core",sets:2,reps:"8–10",rest:45,cue:"Stop fresh."}
    ]},
    "PL-2 Bench Focus": {label:"Bench Focus — Recovery / Technique",duration:52,exercises:[
      {name:"Bench Press",block:"Competition Technique",sets:4,reps:"3 @ RPE 6",rest:135,cue:"Fast, repeatable reps."},
      {name:"Chest-Supported Row",block:"Upper-Back Assistance",sets:3,reps:"8–10",rest:75,cue:"Moderate load."},
      {name:"Rope Pressdown",block:"Light Assistance",sets:2,reps:"12–15",rest:45,cue:"No joint irritation."}
    ]},
    "PL-3 Deadlift Focus": {label:"Deadlift Focus — Recovery / Technique",duration:55,exercises:[
      {name:"Deadlift",block:"Competition Technique",sets:3,reps:"2 @ RPE 6",rest:180,cue:"Perfect setup and controlled speed."},
      {name:"Front Squat",block:"Light Secondary Squat",sets:2,reps:"5 @ RPE 6",rest:120,cue:"Easy, clean reps."},
      {name:"Hamstring Curl",block:"Light Assistance",sets:2,reps:"10–12",rest:60,cue:"Stop with reserve."}
    ]},
    "PL-4 Secondary Squat + Bench": {label:"Secondary Squat + Bench — Recovery",duration:50,exercises:[
      {name:"Paused Back Squat",block:"Technique",sets:2,reps:"3 @ RPE 6",rest:135,cue:"Low-fatigue positional practice."},
      {name:"Close-Grip Bench Press",block:"Technique",sets:3,reps:"4 @ RPE 6",rest:105,cue:"Smooth and controlled."},
      {name:"Cable Row",block:"Light Assistance",sets:2,reps:"10–12",rest:60,cue:"Stop well before fatigue."},
      {name:"Face Pull",block:"Shoulder Health",sets:2,reps:"15",rest:45,cue:"Easy quality work."}
    ]}
  }
};

function bellPowerliftingActive(block=data.trainingBlock||{}){
  if(block?.mission?.path==="event"&&block?.mission?.eventType==="Strongman Competition")return false;
  const text=[data.settings?.primaryTrainingIdentity,data.settings?.athleteMode,block?.dualGoals?.strengthGoal,block?.primaryGoal,block?.goalType].filter(Boolean).join(" ").toLowerCase();
  return /powerlifting/.test(text);
}

const bellBaseGetWorkoutTemplate=getWorkoutTemplate;
getWorkoutTemplate=function(name,rotationWeek=typeof getRotationWeek==="function"?getRotationWeek():1){
  if(String(name).startsWith("PL-")) return bellPowerliftingRotations[rotationWeek]?.[name]||bellPowerliftingRotations[1][name]||null;
  return bellBaseGetWorkoutTemplate(name,rotationWeek);
};
const bellBaseAllWorkoutNames=allWorkoutNames;
allWorkoutNames=function(){return [...new Set([...bellBaseAllWorkoutNames(),...BELL_POWERLIFTING_MISSIONS])];};

const bellBaseStrengthMissionsForGoal=strengthMissionsForGoal;
strengthMissionsForGoal=function(goal){return goal==="Powerlifting"?[...BELL_POWERLIFTING_MISSIONS]:bellBaseStrengthMissionsForGoal(goal);};

const bellBaseEngineKindsForCount=engineKindsForCount;
engineKindsForCount=function(count,family){
  if(family==="strength"&&bellPowerliftingActive())return Array.from({length:Math.max(0,count)},()=>"easy");
  return bellBaseEngineKindsForCount(count,family);
};

const bellBaseDisciplineExposureTargets=bellDisciplineExposureTargets;
bellDisciplineExposureTargets=function(block=data.trainingBlock||{}){
  if(!bellPowerliftingActive(block))return bellBaseDisciplineExposureTargets(block);
  const days=Math.max(2,Math.min(7,Number(block.trainingDays)||(typeof bellNormalTrainingDays==="function"?bellNormalTrainingDays().length:4)));
  return {strength:Math.min(4,days),engine:days>=6?2:1};
};

const bellBaseEnsureDisciplineExposures=bellEnsureDisciplineExposures;
bellEnsureDisciplineExposures=function(plan,block=data.trainingBlock||{},targetOverride=null){
  if(!bellPowerliftingActive(block))return bellBaseEnsureDisciplineExposures(plan,block,targetOverride);
  const targets=targetOverride||bellDisciplineExposureTargets(block),existing=Array.isArray(plan)?plan:[];
  const engine=existing.filter(x=>bellSessionProfile(x).engine).filter(x=>bellSessionProfile(x).easyEngine).slice(0,targets.engine);
  const sources=existing.filter(x=>bellSessionProfile(x).strength);
  const strength=BELL_POWERLIFTING_MISSIONS.slice(0,targets.strength).map((mission,index)=>{
    const source=JSON.parse(JSON.stringify(sources[index]||sources[0]||{}));
    source.id=`bell-powerlifting-${index}-${Date.now()}`;source.mission=mission;source.customLabel=getWorkoutLabel(mission);source.status="planned";source.done=false;
    source.detail="Powerlifting-specific competition-lift exposure with RPE-guided progression.";
    return source;
  });
  while(engine.length<targets.engine){
    engine.push({id:`bell-pl-cardio-${engine.length}-${Date.now()}`,mission:"R-1 Recovery Run",customLabel:"Low-Intensity Aerobic Recovery",detail:"20–35 minutes Zone 2 for recovery, work capacity, and weight management.",status:"planned",done:false});
  }
  return [...strength,...engine];
};

const bellBaseBellMissionRequest=bellMissionRequest;
bellMissionRequest=function(){
  const request=bellBaseBellMissionRequest();
  if(bellPowerliftingActive()){
    request.goal=`Powerlifting: improve competition squat, bench press, and deadlift`;
    request.priority_order=["Powerlifting","Competition Squat","Competition Bench Press","Competition Deadlift"];
    request.constraints.strength_days=bellDisciplineExposureTargets().strength;
    request.constraints.engine_days=bellDisciplineExposureTargets().engine;
    request.constraints.engine_policy="low_intensity_aerobic_support_only";
  }
  return request;
};
