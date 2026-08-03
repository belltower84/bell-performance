"use strict";

/* Bell Performance 12.2.13 — Powerlifting Meet Prep
   Activates only when Powerlifting is the discipline and a powerlifting meet
   date is attached to the mission. The competition date controls specificity,
   peaking, tapering, and meet-week behavior. */

function bellPowerliftingMeetInfo(block=data.trainingBlock||{}){
  const mission=block.mission||{};
  const eventText=[mission.eventType,mission.eventName,block.goalType,block.primaryGoal,data.settings?.secondaryTrainingGoal].filter(Boolean).join(" ").toLowerCase();
  const date=mission.eventDate||block.targetDate||data.settings?.secondaryTargetDate||null;
  const active=bellPowerliftingActive(block)&&Boolean(date)&&/powerlift|meet|competition/.test(eventText);
  let days=null,weeks=null;
  if(date){
    const target=new Date(`${date}T12:00:00`),now=new Date();
    now.setHours(12,0,0,0);
    if(Number.isFinite(target.getTime())){days=Math.max(0,Math.ceil((target-now)/86400000));weeks=Math.ceil(days/7);}
  }
  return {active,date,days,weeks,eventText};
}

function bellPowerliftingMeetPhase(block=data.trainingBlock||{}){
  const info=bellPowerliftingMeetInfo(block);
  if(!info.active)return null;
  if(info.days<=7)return {id:"meet_week",name:"Meet Week",rotation:4,engine:0};
  if(info.weeks<=2)return {id:"taper",name:"Taper & Openers",rotation:4,engine:0};
  if(info.weeks<=5)return {id:"peak",name:"Competition Peak",rotation:3,engine:1};
  if(info.weeks<=10)return {id:"strength",name:"Meet Strength Block",rotation:2,engine:1};
  return {id:"base",name:"Meet Base Building",rotation:1,engine:1};
}

const bellMeetPrepTemplates={
  base:{
    "PL-1 Squat Focus":{label:"Meet Prep — Squat Volume",duration:75,exercises:[
      {name:"Back Squat",block:"Competition Squat",sets:1,reps:"Top set of 5 @ RPE 7",rest:240,cue:"Use competition stance, depth, belt, and commands."},
      {name:"Back Squat",block:"Back-Off Volume",sets:4,reps:"5 @ 88–90% of top-set load",rest:180,cue:"Identical setup and depth."},
      {name:"Paused Bench Press",block:"Secondary Bench",sets:4,reps:"5 @ RPE 7",rest:150,cue:"Competition pause and stable touch point."},
      {name:"Romanian Deadlift",block:"Posterior Chain",sets:3,reps:"6–8",rest:120,cue:"Build capacity without compromising deadlift recovery."},
      {name:"Ab Wheel",block:"Required Core",sets:3,reps:"8–12",rest:60,cue:"Brace hard."}]},
    "PL-2 Bench Focus":{label:"Meet Prep — Bench Volume",duration:70,exercises:[
      {name:"Bench Press",block:"Competition Bench",sets:1,reps:"Top set of 5 @ RPE 7",rest:240,cue:"Practice start, press, and rack commands."},
      {name:"Bench Press",block:"Back-Off Volume",sets:5,reps:"5 @ 88–90% of top-set load",rest:165,cue:"Repeat setup and touch point."},
      {name:"Close-Grip Bench Press",block:"Supplemental Press",sets:3,reps:"6–8",rest:120,cue:"Build triceps without changing setup."},
      {name:"Chest-Supported Row",block:"Upper Back",sets:4,reps:"8–12",rest:90,cue:"Support a stable bench platform."},
      {name:"Rope Pressdown",block:"Assistance",sets:3,reps:"12–15",rest:45,cue:"Clean lockouts."}]},
    "PL-3 Deadlift Focus":{label:"Meet Prep — Deadlift Volume",duration:75,exercises:[
      {name:"Deadlift",block:"Competition Deadlift",sets:1,reps:"Top set of 4 @ RPE 7",rest:270,cue:"Use competition setup and full lockout."},
      {name:"Deadlift",block:"Back-Off Volume",sets:3,reps:"4 @ 88–90% of top-set load",rest:225,cue:"Reset every rep."},
      {name:"Tempo Back Squat",block:"Secondary Squat",sets:3,reps:"5 @ RPE 6–7",rest:150,cue:"Improve position with low fatigue."},
      {name:"Chest-Supported Row",block:"Upper Back",sets:4,reps:"8–10",rest:90,cue:"Build lats without low-back fatigue."},
      {name:"Hamstring Curl",block:"Assistance",sets:3,reps:"10–15",rest:60,cue:"Controlled eccentric."}]},
    "PL-4 Secondary Squat + Bench":{label:"Meet Prep — Secondary Squat + Bench",duration:68,exercises:[
      {name:"Paused Back Squat",block:"Squat Variation",sets:4,reps:"4 @ RPE 7",rest:165,cue:"Correct the athlete's weakest position."},
      {name:"Bench Press",block:"Competition Bench Technique",sets:6,reps:"3 @ RPE 6–7",rest:120,cue:"Commands and fast bar speed."},
      {name:"Bulgarian Split Squat",block:"Assistance",sets:3,reps:"8/leg",rest:75,cue:"Build legs with controlled fatigue."},
      {name:"Cable Row",block:"Upper Back",sets:3,reps:"10–12",rest:60,cue:"Stay braced."},
      {name:"Face Pull",block:"Shoulder Health",sets:3,reps:"15–20",rest:45,cue:"Keep shoulders prepared for frequent benching."}]}
  },
  strength:{},peak:{},taper:{},meet_week:{}
};

bellMeetPrepTemplates.strength={
  "PL-1 Squat Focus":{label:"Meet Prep — Heavy Squat",duration:75,exercises:[{name:"Back Squat",block:"Competition Squat",sets:1,reps:"Top set of 3 @ RPE 8",rest:270,cue:"No grinders. Record actual RPE."},{name:"Back Squat",block:"Back-Off Strength",sets:4,reps:"3 @ 90–92% of top-set load",rest:210,cue:"Competition-standard reps."},{name:"Paused Bench Press",block:"Secondary Bench",sets:4,reps:"4 @ RPE 7",rest:150,cue:"Commands and stable pause."},{name:"Leg Press",block:"Quad Assistance",sets:3,reps:"8–10",rest:90,cue:"Moderate fatigue only."},{name:"Ab Wheel",block:"Core",sets:3,reps:"8–12",rest:60,cue:"Meet-level bracing."}]},
  "PL-2 Bench Focus":{label:"Meet Prep — Heavy Bench",duration:72,exercises:[{name:"Bench Press",block:"Competition Bench",sets:1,reps:"Top set of 3 @ RPE 8",rest:270,cue:"Use full commands."},{name:"Bench Press",block:"Back-Off Strength",sets:5,reps:"3 @ 90–92% of top-set load",rest:180,cue:"Repeatable setup."},{name:"Spoto Press",block:"Weak Point Press",sets:3,reps:"5 @ RPE 7",rest:120,cue:"Maintain tension near the chest."},{name:"Weighted Pull-up",block:"Upper Back",sets:4,reps:"5–8",rest:105,cue:"Controlled full range."},{name:"Triceps Extension",block:"Lockout Assistance",sets:3,reps:"10–15",rest:60,cue:"No elbow irritation."}]},
  "PL-3 Deadlift Focus":{label:"Meet Prep — Heavy Deadlift",duration:75,exercises:[{name:"Deadlift",block:"Competition Deadlift",sets:1,reps:"Top set of 3 @ RPE 8",rest:300,cue:"Stop before position breaks."},{name:"Deadlift",block:"Back-Off Strength",sets:3,reps:"3 @ 88–90% of top-set load",rest:240,cue:"Reset fully."},{name:"Front Squat",block:"Secondary Squat",sets:3,reps:"4–5 @ RPE 7",rest:165,cue:"Build quads without another maximal squat exposure."},{name:"Chest-Supported Row",block:"Upper Back",sets:4,reps:"8",rest:90,cue:"Protect recovery."},{name:"Hamstring Curl",block:"Assistance",sets:3,reps:"10–12",rest:60,cue:"Controlled."}]},
  "PL-4 Secondary Squat + Bench":{label:"Meet Prep — Technique & Weak Points",duration:66,exercises:[{name:"Competition Squat",block:"Secondary Squat",sets:4,reps:"3 @ RPE 7",rest:180,cue:"Competition setup with clean speed."},{name:"Competition Bench Press",block:"Secondary Bench",sets:5,reps:"4 @ RPE 7",rest:150,cue:"Practice commands."},{name:"Romanian Deadlift",block:"Posterior Chain",sets:2,reps:"6–8",rest:105,cue:"Leave reserve."},{name:"Cable Row",block:"Upper Back",sets:3,reps:"10",rest:60,cue:"Stable torso."},{name:"Face Pull",block:"Shoulder Health",sets:2,reps:"15–20",rest:45,cue:"Easy quality work."}]}
};

bellMeetPrepTemplates.peak={
  "PL-1 Squat Focus":{label:"Meet Peak — Squat Single",duration:62,exercises:[{name:"Back Squat",block:"Competition Squat",sets:1,reps:"Single @ RPE 8–8.5",rest:300,cue:"Full meet setup and commands. No missed lifts."},{name:"Back Squat",block:"Back-Off Practice",sets:3,reps:"2 @ 80–83%",rest:210,cue:"Fast, clean doubles."},{name:"Paused Bench Press",block:"Secondary Bench",sets:3,reps:"3 @ RPE 7",rest:150,cue:"Low-fatigue command practice."},{name:"Ab Wheel",block:"Core",sets:2,reps:"8",rest:60,cue:"Stop fresh."}]},
  "PL-2 Bench Focus":{label:"Meet Peak — Bench Single",duration:58,exercises:[{name:"Bench Press",block:"Competition Bench",sets:1,reps:"Single @ RPE 8–8.5",rest:300,cue:"Full commands. No missed lifts."},{name:"Bench Press",block:"Back-Off Practice",sets:4,reps:"2 @ 80–83%",rest:180,cue:"Fast press and clean pause."},{name:"Chest-Supported Row",block:"Upper Back",sets:3,reps:"8",rest:90,cue:"Maintain, do not create soreness."},{name:"Rope Pressdown",block:"Triceps",sets:2,reps:"10–12",rest:45,cue:"Easy lockout work."}]},
  "PL-3 Deadlift Focus":{label:"Meet Peak — Deadlift Single",duration:60,exercises:[{name:"Deadlift",block:"Competition Deadlift",sets:1,reps:"Single @ RPE 8",rest:330,cue:"Full setup and lockout. Never grind in the peak."},{name:"Deadlift",block:"Back-Off Practice",sets:2,reps:"2 @ 78–80%",rest:240,cue:"Fast and technically exact."},{name:"Paused Back Squat",block:"Light Secondary Squat",sets:2,reps:"3 @ RPE 6",rest:150,cue:"Maintain pattern without fatigue."},{name:"Hamstring Curl",block:"Assistance",sets:2,reps:"10",rest:60,cue:"Easy."}]},
  "PL-4 Secondary Squat + Bench":{label:"Meet Peak — Command Practice",duration:50,exercises:[{name:"Back Squat",block:"Competition Technique",sets:3,reps:"2 @ 72–75%",rest:180,cue:"Commands, depth, and confidence."},{name:"Bench Press",block:"Competition Technique",sets:4,reps:"2 @ 72–75%",rest:150,cue:"Commands and consistent pause."},{name:"Cable Row",block:"Upper Back",sets:2,reps:"8–10",rest:60,cue:"Maintenance only."},{name:"Face Pull",block:"Shoulder Health",sets:2,reps:"15",rest:45,cue:"Easy."}]}
};

bellMeetPrepTemplates.taper={
  "PL-1 Squat Focus":{label:"Meet Taper — Squat Opener",duration:42,exercises:[{name:"Back Squat",block:"Opener Practice",sets:1,reps:"1 @ planned opener (about 87–91%)",rest:360,cue:"Commands, equipment, and exact meet setup. Stop after a confident opener."},{name:"Back Squat",block:"Confidence Back-Off",sets:2,reps:"2 @ 65–70%",rest:180,cue:"Fast and easy."}]},
  "PL-2 Bench Focus":{label:"Meet Taper — Bench Opener",duration:38,exercises:[{name:"Bench Press",block:"Opener Practice",sets:1,reps:"1 @ planned opener (about 87–91%)",rest:360,cue:"Full commands. Stop after a confident opener."},{name:"Bench Press",block:"Confidence Back-Off",sets:3,reps:"2 @ 65–70%",rest:150,cue:"Fast and easy."}]},
  "PL-3 Deadlift Focus":{label:"Meet Taper — Deadlift Opener",duration:38,exercises:[{name:"Deadlift",block:"Opener Practice",sets:1,reps:"1 @ planned opener (about 87–90%)",rest:420,cue:"Take this 7–10 days before the meet. No grinding."},{name:"Deadlift",block:"Confidence Back-Off",sets:2,reps:"1 @ 65–70%",rest:210,cue:"Perfect setup."}]},
  "PL-4 Secondary Squat + Bench":{label:"Meet Taper — Technique Primer",duration:30,exercises:[{name:"Back Squat",block:"Technique",sets:2,reps:"2 @ 55–60%",rest:150,cue:"Fast and easy."},{name:"Bench Press",block:"Technique",sets:3,reps:"2 @ 55–60%",rest:120,cue:"Commands and speed."}]}
};

bellMeetPrepTemplates.meet_week={
  "PL-1 Squat Focus":{label:"Meet Week — Squat Primer",duration:25,exercises:[{name:"Back Squat",block:"Primer",sets:3,reps:"1 @ 50–60%",rest:150,cue:"Early in the week only. Fast, confident reps. Go home fresh."}]},
  "PL-2 Bench Focus":{label:"Meet Week — Bench Primer",duration:25,exercises:[{name:"Bench Press",block:"Primer",sets:3,reps:"1 @ 50–60%",rest:120,cue:"Full commands, fast press, no fatigue."}]},
  "PL-3 Deadlift Focus":{label:"Meet Week — Recovery & Equipment Check",duration:20,exercises:[{name:"Recovery Walk",block:"Recovery",sets:1,reps:"15–20 minutes easy",rest:0,cue:"No deadlifting. Check belt, shoes, singlet, socks, membership card, and attempt plan."}]},
  "PL-4 Secondary Squat + Bench":{label:"Meet Day Plan",duration:20,exercises:[{name:"Meet Day Warm-Up & Attempts",block:"Competition",sets:1,reps:"Execute warm-up timing and attempt card",rest:0,cue:"Opener: near-certain lift. Second: build the total. Third: performance-based decision."},{name:"Rack Heights & Commands",block:"Meet Logistics",sets:1,reps:"Verify before lifting",rest:0,cue:"Confirm rack heights, flight, order, and command standards."},{name:"Nutrition & Hydration",block:"Meet Logistics",sets:1,reps:"Follow practiced plan",rest:0,cue:"Do not introduce new foods or aggressive weight-cut tactics."}]}
};

const bellMeetBaseGetWorkoutTemplate=getWorkoutTemplate;
getWorkoutTemplate=function(name,rotationWeek=typeof getRotationWeek==="function"?getRotationWeek():1){
  const phase=bellPowerliftingMeetPhase();
  if(phase&&String(name).startsWith("PL-"))return bellMeetPrepTemplates[phase.id]?.[name]||bellMeetBaseGetWorkoutTemplate(name,rotationWeek);
  return bellMeetBaseGetWorkoutTemplate(name,rotationWeek);
};

const bellMeetBaseExposureTargets=bellDisciplineExposureTargets;
bellDisciplineExposureTargets=function(block=data.trainingBlock||{}){
  const phase=bellPowerliftingMeetPhase(block);
  if(!phase)return bellMeetBaseExposureTargets(block);
  const days=Math.max(2,Math.min(7,Number(block.trainingDays)||(typeof bellNormalTrainingDays==="function"?bellNormalTrainingDays().length:4)));
  if(phase.id==="meet_week")return {strength:Math.min(4,days),engine:0};
  if(phase.id==="taper")return {strength:Math.min(4,days),engine:0};
  return {strength:Math.min(4,days),engine:phase.engine};
};

const bellMeetBaseMissionRequest=bellMissionRequest;
bellMissionRequest=function(){
  const request=bellMeetBaseMissionRequest();
  const info=bellPowerliftingMeetInfo(),phase=bellPowerliftingMeetPhase();
  if(info.active&&phase){
    request.goal="Powerlifting Meet Prep: peak competition squat, bench press, and deadlift";
    request.event="Powerlifting Meet";
    request.competition_date=info.date;
    request.weeks_to_competition=info.weeks;
    request.phase=phase.name;
    request.priority_order=["Powerlifting Meet","Competition Squat","Competition Bench Press","Competition Deadlift"];
    request.constraints.engine_days=phase.engine;
    request.constraints.engine_policy=phase.engine?"low_intensity_recovery_only":"none_during_taper_or_meet_week";
    request.constraints.meet_prep=true;
  }
  return request;
};
