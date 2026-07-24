"use strict";

/* Bell Performance 8.2: discipline-specific coaching architecture. */
const BELL_COACHING_PATHWAYS = {
  general_fitness: {
    label:"General Fitness",
    promise:"Build durable strength, aerobic fitness, movement confidence, and consistency without unnecessary exhaustion.",
    split:"Three balanced strength exposures plus two recoverable Engine exposures",
    rotationWeeks:6,
    deloadCadence:4,
    priorities:["movement quality","whole-body strength","aerobic base","consistency"],
    coachTone:"Consistency beats punishment. Finish capable of training again.",
    missedRule:"Resume the next planned session. Do not cram missed work into the week."
  },
  body_recomposition: {
    label:"Body Recomposition",
    promise:"Preserve or build muscle while improving body composition through recoverable resistance training and consistent energy expenditure.",
    split:"Four resistance exposures, two to three low-interference Engine exposures, and daily movement",
    rotationWeeks:5,
    deloadCadence:4,
    priorities:["muscle retention","training density","recoverable cardio","adherence"],
    coachTone:"Train hard enough to preserve muscle, not so hard that fatigue ruins the week.",
    missedRule:"Protect the next resistance session. Replace missed cardio with walking rather than stacking intervals."
  },
  muscle_building: {
    label:"Muscle Building",
    promise:"Accumulate productive muscle-specific volume, progress repetitions and load, and manage fatigue across a long hypertrophy runway.",
    split:"Four to five hypertrophy exposures with deliberate muscle-frequency and low-fatigue aerobic support",
    rotationWeeks:6,
    deloadCadence:4,
    priorities:["weekly muscle volume","double progression","exercise stability","recovery"],
    coachTone:"Own the rep range. Add load only after the target muscle—not momentum—does the work.",
    missedRule:"Skip the missed session or merge only one small accessory block. Never double full hypertrophy sessions."
  },
  strength: {
    label:"Strength",
    promise:"Improve the major lifts through repeatable practice, controlled loading, supplemental work, and fatigue-aware peaks.",
    split:"Three to four main-lift exposures with heavy, moderate, and technique roles plus aerobic support",
    rotationWeeks:8,
    deloadCadence:4,
    priorities:["specificity","bar quality","load progression","fatigue control"],
    coachTone:"Strong reps count. Grinders are a cost, not a badge.",
    missedRule:"Preserve lift order and move the missed primary lift only when at least 48 hours of recovery remains."
  },
  hybrid: {
    label:"Hybrid Performance",
    promise:"Develop strength and endurance concurrently while actively managing interference between demanding sessions.",
    split:"Three to four strength exposures and three Engine exposures arranged around high-low stress principles",
    rotationWeeks:6,
    deloadCadence:4,
    priorities:["strength retention","aerobic capacity","quality separation","durability"],
    coachTone:"Every hard session needs a purpose. More fatigue is not automatically more fitness.",
    missedRule:"Protect the long Engine session and primary strength exposures; remove redundant intensity before rescheduling."
  }
};

function coachingTextBlob(){
  const b=data.trainingBlock||{},m=b.mission||{},d=b.dualGoals||{};
  return [b.goalType,d.strengthGoal,d.engineGoal,m.developmentGoal,m.eventType,m.priority,b.bodybuildingPhase,b.bodybuildingFocus,data.settings?.athleteMode].filter(Boolean).join(" ").toLowerCase();
}
function currentCoachingPathwayId(){
  const t=coachingTextBlob();
  if(/general fitness|foundational fitness|return to fitness/.test(t)&&!/general hybrid fitness/.test(t))return "general_fitness";
  if(/body recomposition|recomposition|fat loss|weight loss|cut|lean out/.test(t))return "body_recomposition";
  if(/muscle building|bodybuilding|hypertrophy|physique|mass|wellness/.test(t))return "muscle_building";
  if(/powerlifting|general strength|max strength|strength development|olympic lifting/.test(t))return "strength";
  if(/hybrid|tactical|hyrox|crossfit|athlete|sport-specific|combat|strongman|murph/.test(t))return "hybrid";
  return "general_fitness";
}
function currentCoachingPathway(){return BELL_COACHING_PATHWAYS[currentCoachingPathwayId()];}
function pathwayWeekRole(){
  const w=Math.max(1,Number(data.trainingBlock?.currentWeek)||1),total=Math.max(1,Number(data.trainingBlock?.lengthWeeks)||12),p=currentCoachingPathway();
  if(w===total)return currentCoachingPathwayId()==="strength"?"Test and transition":"Review and transition";
  if(w%p.deloadCadence===0)return "Recovery and absorption";
  const ratio=w/total;
  if(ratio<=.3)return "Foundation";
  if(ratio<=.7)return currentCoachingPathwayId()==="muscle_building"?"Volume progression":"Build";
  return currentCoachingPathwayId()==="strength"?"Intensification":"Specific development";
}
function pathwayReadinessAdjustment(){
  const status=typeof readinessStatus==="function"?readinessStatus(readinessScore()):"GREEN",id=currentCoachingPathwayId();
  if(status==="RED")return {status,setScale:.5,intensityScale:.82,engine:"recovery",message:"Keep only essential technique work, mobility, and easy aerobic recovery. Remove intervals and optional finishers."};
  if(status==="YELLOW"){
    const scale=id==="strength"?.75:id==="muscle_building"?.72:.8;
    return {status,setScale:scale,intensityScale:.92,engine:"easy",message:id==="hybrid"?"Preserve the primary session and convert secondary intensity to easy aerobic support.":"Keep the primary work, trim accessory volume, and stop farther from failure."};
  }
  return {status,setScale:1,intensityScale:1,engine:"planned",message:"Execute the planned quality and leave enough recovery for the next session."};
}
function pathwayProgressionPrescription(){
  const id=currentCoachingPathwayId(),role=pathwayWeekRole(),recovery=/Recovery|Review/.test(role),w=Math.max(1,Number(data.trainingBlock?.currentWeek)||1);
  const prescriptions={
    general_fitness:{load:recovery?.7:.72+Math.min(.08,(w%4)*.02),setScale:recovery?.65:1,method:"Add repetitions first, then the smallest practical load after two technically strong exposures."},
    body_recomposition:{load:recovery?.67:.7+Math.min(.07,(w%4)*.018),setScale:recovery?.62:1,method:"Maintain loads while improving repetitions, control, or density. Do not chase failure during a calorie deficit."},
    muscle_building:{load:recovery?.65:.68+Math.min(.09,(w%4)*.022),setScale:recovery?.58:1,method:"Use double progression at 1–3 reps in reserve; add load only after reaching the top of the range across prescribed sets."},
    strength:{load:recovery?.7:.76+Math.min(.1,(w%4)*.025),setScale:recovery?.6:1,method:"Progress load after clean prescribed work. Heavy exposures stop before grinding; technique exposures prioritize speed."},
    hybrid:{load:recovery?.68:.73+Math.min(.07,(w%4)*.018),setScale:recovery?.62:1,method:"Progress one major stressor at a time. Do not increase lower-body lifting demand and hard running volume in the same week."}
  };
  return {id,role,...prescriptions[id]};
}
function pathwaySessionIntent(item,index){
  const id=currentCoachingPathwayId(),mission=String(item?.mission||""),engine=/^R-|engine|run|cardio|interval|zone 2/i.test(`${mission} ${item?.customLabel||""}`),secondary=Boolean(item?.secondaryMission);
  if(engine){
    if(/R-5|long/i.test(`${mission} ${item?.customLabel||""}`))return "Build durable aerobic capacity without turning the finish into a race.";
    if(/R-4|interval|tempo|threshold/i.test(`${mission} ${item?.customLabel||""}`))return "Accumulate high-quality work at the prescribed effort; stop before pace or mechanics collapse.";
    return "Build the aerobic base at a conversational effort that supports recovery.";
  }
  if(id==="strength")return index===0?"Primary strength exposure: crisp competition-pattern practice and controlled heavy work.":"Secondary strength exposure: build the lift without duplicating peak fatigue.";
  if(id==="muscle_building")return "Accumulate target-muscle tension through stable technique, full range, and repeatable proximity to failure.";
  if(id==="body_recomposition")return "Preserve or build muscle with productive volume while keeping weekly fatigue supportable.";
  if(id==="hybrid")return secondary?"Strength is primary today; the paired Engine work must remain truly easy.":"Build strength or power without compromising the next key Engine session.";
  return "Practice foundational patterns and finish with enough capacity to train consistently.";
}
function annotatePlanWithPathway(){
  const pathway=currentCoachingPathway(),id=currentCoachingPathwayId(),progression=pathwayProgressionPrescription();
  data.trainingBlock.coachingPathway=id;
  data.trainingBlock.coachingPathwayLabel=pathway.label;
  data.trainingBlock.coachingWeekRole=progression.role;
  (data.plan||[]).forEach((item,index)=>{
    item.coachingPathway=id;
    item.coachingIntent=pathwaySessionIntent(item,index);
    item.progressionMethod=progression.method;
    item.rotationCadenceWeeks=pathway.rotationWeeks;
    item.missedSessionRule=pathway.missedRule;
    if(item.mission!=="M-1 Daily Reset"&&!String(item.detail||"").includes("Coach intent:"))item.detail=`${item.detail||""} • Coach intent: ${item.coachingIntent}`;
  });
}

/* Wrap the existing weekly builder without removing event-specific programming. */
if(typeof buildCurrentWeekPlan==="function"){
  const baseBuildCurrentWeekPlan=buildCurrentWeekPlan;
  buildCurrentWeekPlan=function(){baseBuildCurrentWeekPlan();annotatePlanWithPathway();};
}

/* Pathway-specific progression layers on top of existing tested load logic. */
if(typeof strengthProgression==="function"){
  const basePathwayStrengthProgression=strengthProgression;
  strengthProgression=function(){
    const base=basePathwayStrengthProgression(),p=pathwayProgressionPrescription(),r=pathwayReadinessAdjustment();
    return {...base,label:`${p.role} • ${currentCoachingPathway().label}`,load:Math.min(Number(base.load)||1,p.load)*r.intensityScale,setScale:Math.min(Number(base.setScale)||1,p.setScale)*r.setScale,note:`${p.method} ${r.message}`};
  };
}

/* Make the Coach Briefing sound discipline-aware. */
if(typeof coachRecommendation==="function"){
  const basePathwayCoachRecommendation=coachRecommendation;
  coachRecommendation=function(){
    if(!data.trainingBlock?.enabled)return basePathwayCoachRecommendation();
    const pathway=currentCoachingPathway(),p=pathwayProgressionPrescription(),r=pathwayReadinessAdjustment();
    return `${pathway.label} • ${p.role}. ${pathway.coachTone} ${r.message} Progression: ${p.method}`;
  };
}

function coachingPathwaySummary(){
  const p=currentCoachingPathway(),prog=pathwayProgressionPrescription();
  return {id:currentCoachingPathwayId(),label:p.label,promise:p.promise,split:p.split,weekRole:prog.role,progression:prog.method,rotationWeeks:p.rotationWeeks,missedRule:p.missedRule,priorities:p.priorities};
}

/* Use pathway rules when the user manages a missed session. */
if(typeof openMissedSessionManager==="function"){
  const baseOpenMissedSessionManager=openMissedSessionManager;
  openMissedSessionManager=function(index){
    baseOpenMissedSessionManager(index);
    const item=data.plan?.[index],summary=coachingPathwaySummary(),box=document.getElementById("missedSessionCurrent");
    if(item&&box)box.textContent=`Currently scheduled for ${item.day}. ${summary.missedRule}`;
  };
}

/* Ensure previously generated active blocks receive the coaching metadata. */
document.addEventListener("DOMContentLoaded",()=>{if(data.trainingBlock?.enabled){annotatePlanWithPathway();saveData({render:false});}});
