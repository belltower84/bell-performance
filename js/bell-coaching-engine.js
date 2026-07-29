"use strict";
/* Bell Performance 13.1 — Journey-centered coaching state.
   This local engine mirrors the Bell Core Journey contract so Mission Control
   remains useful offline and during cloud transitions. */
(function(){
  const VERSION="13.2.0";
  const MAX_WEEKS=52;
  const appData=()=>typeof data!=="undefined"?data:null;
  const clean=value=>String(value??"").replace(/\s+/g," ").trim();
  const clamp=(value,min,max)=>Math.max(min,Math.min(max,Number(value)||0));
  const slug=value=>clean(value).toLowerCase().replace(/[^a-z0-9]+/g,"_").replace(/^_+|_+$/g,"")||"phase";
  function parseDate(value){
    if(!value)return null;
    const date=new Date(`${String(value).slice(0,10)}T12:00:00`);
    return Number.isNaN(date.getTime())?null:date;
  }
  function weeksUntil(value){
    const target=parseDate(value);if(!target)return null;
    const now=new Date();now.setHours(12,0,0,0);
    return Math.max(1,Math.ceil(Math.max(0,target-now)/604800000));
  }
  function phase(name,weight,purpose,emphasis,milestone,objectives=[]){
    return {name,weight,purpose,trainingEmphasis:emphasis,milestone,objectives};
  }
  function athleteIdentity(){
    const settings=appData()?.settings||{},block=appData()?.trainingBlock||{},dual=block.dualGoals||{};
    const explicit=clean(settings.primaryTrainingIdentity||settings.athleteMode||dual.strengthGoal||block.goalType);
    const text=[explicit,settings.secondaryTrainingGoal,block.secondaryGoal,dual.strengthGoal,dual.engineGoal].filter(Boolean).join(" ").toLowerCase();
    if(/powerlift|squat.*bench.*deadlift/.test(text))return"Powerlifting";
    if(/bodybuild|physique|hypertrophy/.test(text))return"Bodybuilding";
    if(/tactical|selection|ruck|pt test/.test(text))return"Tactical Athlete";
    if(/functional fitness|crossfit|mixed modal/.test(text))return"Functional Fitness";
    if(/marathon|half marathon|10k|5k|endurance|running|cycling|triathlon/.test(text))return"Endurance Athlete";
    if(/athletic|hybrid|speed|agility|power/.test(text))return"Hybrid Athlete";
    if(/fat loss|weight loss|recomp|health|general fitness/.test(text))return"Performance & Health";
    return explicit||"Performance & Health";
  }
  function objective(identity,isEvent){
    if(isEvent)return"Prepare for Competition";
    const settings=appData()?.settings||{},block=appData()?.trainingBlock||{},dual=block.dualGoals||{};
    const primary=[settings.secondaryTrainingGoal,block.secondaryGoal,block.goalType,appData()?.nutrition?.goal].filter(Boolean).join(" ").toLowerCase();
    const supporting=[dual.strengthGoal,dual.engineGoal].filter(Boolean).join(" ").toLowerCase();
    if(/fat loss|weight loss|lose fat|cut/.test(primary))return"Lose Fat";
    if(/recomp|body composition/.test(primary))return"Body Recomposition";
    if(/muscle gain|build muscle|bodybuild|hypertrophy|size/.test(primary))return"Build Muscle";
    if(/conditioning|work capacity|engine/.test(primary))return"Improve Conditioning";
    if(/maintain|readiness|longevity/.test(primary))return"Maintain Performance";
    if(/strength|squat|bench|deadlift/.test(primary))return"Increase Strength";
    if(identity==="Powerlifting")return"Increase Strength";
    if(identity==="Bodybuilding")return"Build Muscle";
    if(identity==="Endurance Athlete")return"Improve Endurance";
    if(["Tactical Athlete","Functional Fitness","Hybrid Athlete"].includes(identity))return"Improve Performance";
    if(/recomp|body composition|fat loss/.test(supporting))return"Body Recomposition";
    return"Continuous Development";
  }
  function eventInfo(){
    const settings=appData()?.settings||{},block=appData()?.trainingBlock||{},mission=block.mission||{};
    const target=mission.eventDate||block.targetDate||settings.secondaryTargetDate||"";
    const label=clean(mission.eventName||mission.eventType||settings.secondaryTrainingGoal||block.secondaryGoal||block.goalType);
    const looksDated=/meet|competition|marathon|half marathon|10k|5k|race|test|selection|event/i.test(label);
    const isEvent=Boolean(target)&&(mission.path==="event"||looksDated);
    return {isEvent,target:isEvent?String(target).slice(0,10):"",label};
  }
  function journeyName(identity,goal,event){
    if(event.isEvent)return event.label||`${identity} Event Preparation`;
    const names={
      "Lose Fat":"Fat-Loss Transformation",
      "Body Recomposition":"Body Recomposition",
      "Build Muscle":"Muscle-Building Journey",
      "Increase Strength":"Strength Development",
      "Improve Conditioning":"Conditioning Development",
      "Improve Endurance":"Endurance Development"
    };
    return names[goal]||`${identity} Development`;
  }
  function eventTemplates(identity,weeks){
    if(weeks<=6)return[
      phase("Specific Preparation",.55,"Practice the objective's highest-value demands.","specific","Complete the final event-specific simulation",["specificity","execution"]),
      phase("Peak",.25,"Express performance with lower volume and high-quality work.","peak","Complete the final readiness assessment",["performance expression"]),
      phase("Taper",.20,"Reduce fatigue without losing readiness.","taper","Event day",["fatigue reduction"])
    ];
    if(identity==="Powerlifting")return[
      phase("Foundation",.15,"Build work capacity, technique, and tolerance for heavier training.","foundation","Foundation review",["technique","work capacity"]),
      phase("Volume",.22,"Accumulate competition-lift volume and useful muscle.","accumulation","Rep-strength assessment",["volume","hypertrophy"]),
      phase("Strength",.24,"Increase force production in the competition lifts.","strength","Heavy triple or double benchmark",["max strength"]),
      phase("Intensification",.18,"Raise specificity and practice heavier competition work.","intensification","Opener-range exposure",["specific strength"]),
      phase("Peak",.12,"Convert training into meet-day performance.","peak","Final opener practice",["performance expression"]),
      phase("Taper",.09,"Reduce fatigue while preserving confidence and skill.","taper","Meet day",["fatigue reduction"])
    ];
    if(identity==="Endurance Athlete")return[
      phase("Aerobic Base",.27,"Expand durable aerobic capacity and consistent volume.","foundation","Aerobic benchmark",["aerobic base"]),
      phase("Threshold",.20,"Improve sustainable speed and lactate clearance.","threshold","Threshold assessment",["threshold"]),
      phase("VO₂ Development",.15,"Raise high-end aerobic power without overwhelming recovery.","intensification","VO₂ benchmark",["VO₂"]),
      phase("Race Specific",.22,"Practice goal pace, fueling, and event-specific durability.","specific","Final race simulation",["specificity","durability"]),
      phase("Peak",.08,"Sharpen speed while lowering accumulated fatigue.","peak","Readiness check",["performance expression"]),
      phase("Taper",.08,"Arrive fresh without losing rhythm.","taper","Event day",["fatigue reduction"])
    ];
    if(identity==="Bodybuilding")return[
      phase("Foundation",.15,"Build movement quality, training tolerance, and consistent execution.","foundation","Foundation review"),
      phase("Growth",.28,"Build muscle with progressive volume and stable recovery.","accumulation","Physique and performance review",["hypertrophy"]),
      phase("Weak-Point Development",.18,"Prioritize the physique areas that need the most improvement.","hypertrophy","Weak-point review",["weak points"]),
      phase("Contest Preparation",.24,"Preserve muscle while increasing event specificity and reducing body fat.","specific","Final physique assessment",["body composition"]),
      phase("Peak Week",.15,"Reduce fatigue and preserve fullness without last-minute extremes.","taper","Competition day",["performance expression"])
    ];
    return[
      phase("Foundation",.20,"Build the base that supports harder work later.","foundation","Foundation review"),
      phase("Development",.30,"Build the highest-priority physical qualities.","accumulation","Development benchmark"),
      phase("Intensification",.20,"Increase the specificity and difficulty of key sessions.","intensification","Performance assessment"),
      phase("Specific Preparation",.17,"Practice the exact demands of the objective.","specific","Final simulation"),
      phase("Peak",.07,"Express performance while controlling fatigue.","peak","Readiness check"),
      phase("Taper",.06,"Reduce fatigue and arrive prepared.","taper","Event day")
    ];
  }
  function continuousTemplates(identity,goal){
    if(goal==="Lose Fat")return[
      phase("Foundation",.16,"Build repeatable training, movement, and nutrition habits.","foundation","Foundation check-in",["consistency"]),
      phase("Fat Loss I",.24,"Reduce body fat while preserving strength and muscle.","fat_loss","First bodyweight milestone",["body composition","muscle retention"]),
      phase("Recovery",.10,"Reduce training and diet fatigue before the next push.","deload","Recovery review",["fatigue reduction"]),
      phase("Fat Loss II",.24,"Continue fat loss with progressive strength and aerobic support.","fat_loss","Next bodyweight milestone",["body composition","work capacity"]),
      phase("Diet Break",.10,"Restore training quality and diet adherence at maintenance intake.","recovery","Maintenance review",["adherence"]),
      phase("Recomposition",.16,"Consolidate the result and improve performance at a stable bodyweight.","recomposition","Journey assessment",["strength","muscle retention"])
    ];
    if(goal==="Build Muscle"||goal==="Body Recomposition"||identity==="Bodybuilding")return[
      phase("Foundation",.14,"Establish technique, volume tolerance, and recovery habits.","foundation","Foundation review"),
      phase("Growth",.30,"Accumulate productive hypertrophy volume.","accumulation","Growth review",["hypertrophy"]),
      phase("Strength Support",.18,"Raise force production to support future hypertrophy.","strength","Strength assessment",["strength"]),
      phase("Weak-Point Development",.22,"Prioritize lagging muscle groups without losing global progress.","hypertrophy","Weak-point review",["weak points"]),
      phase("Recovery",.16,"Reduce fatigue and prepare for the next development cycle.","deload","Cycle assessment",["fatigue reduction"])
    ];
    if(identity==="Powerlifting"||goal==="Increase Strength")return[
      phase("Hypertrophy Base",.24,"Build muscle and work capacity for future strength work.","accumulation","Rep-strength assessment"),
      phase("Strength Development",.28,"Increase competition-lift force production.","strength","Heavy triple assessment"),
      phase("Intensification",.20,"Practice heavier, more specific lifting while controlling fatigue.","intensification","Estimated 1RM assessment"),
      phase("Assessment",.12,"Measure progress and identify the next limiting factor.","assessment","Performance review"),
      phase("Recovery",.16,"Reduce fatigue before beginning the next strength cycle.","deload","Next-cycle decision")
    ];
    if(identity==="Endurance Athlete")return[
      phase("Aerobic Base",.30,"Build durable aerobic capacity and consistent volume.","foundation","Aerobic benchmark"),
      phase("Threshold",.22,"Improve sustainable pace and efficiency.","threshold","Threshold assessment"),
      phase("VO₂ Development",.18,"Raise high-end aerobic power.","intensification","VO₂ assessment"),
      phase("Assessment",.12,"Measure progress and identify the next limiter.","assessment","Performance review"),
      phase("Recovery",.18,"Reduce fatigue before the next aerobic cycle.","deload","Next-cycle decision")
    ];
    if(["Tactical Athlete","Functional Fitness","Hybrid Athlete"].includes(identity))return[
      phase("Foundation",.18,"Build durable movement quality and aerobic capacity.","foundation","Foundation review"),
      phase("Strength Development",.22,"Increase force production and structural resilience.","strength","Strength benchmark"),
      phase("Engine Development",.20,"Improve sustainable conditioning and recovery between efforts.","threshold","Engine benchmark"),
      phase("Hybrid Development",.22,"Combine strength and engine qualities under controlled fatigue.","specific","Hybrid simulation"),
      phase("Assessment",.08,"Measure progress and identify the next limiting quality.","assessment","Performance review"),
      phase("Recovery",.10,"Reduce fatigue and prepare for the next cycle.","deload","Next-cycle decision")
    ];
    return[
      phase("Foundation",.22,"Build movement quality, consistency, and general capacity.","foundation","Foundation review"),
      phase("Capacity",.25,"Improve strength and aerobic work capacity.","accumulation","Capacity benchmark"),
      phase("Performance",.24,"Develop the athlete's highest-priority performance quality.","intensification","Performance assessment"),
      phase("Assessment",.12,"Measure progress and select the next emphasis.","assessment","Journey review"),
      phase("Recovery",.17,"Reduce fatigue and prepare for the next cycle.","deload","Next-cycle decision")
    ];
  }
  function allocate(templates,total){
    let source=[...templates];
    if(source.length>total){
      if(total<=3)source=source.slice(-total);
      else{
        const middle=[...source.slice(1,-1)].sort((a,b)=>b.weight-a.weight).slice(0,total-2);
        const selected=new Set([source[0],source[source.length-1],...middle]);
        source=source.filter(item=>selected.has(item));
      }
    }
    const weightSum=source.reduce((sum,item)=>sum+Math.max(.01,item.weight),0);
    const raw=source.map(item=>total*Math.max(.01,item.weight)/weightSum);
    const lengths=raw.map(value=>Math.max(1,Math.floor(value)));
    while(lengths.reduce((a,b)=>a+b,0)<total){
      let index=0,best=-Infinity;raw.forEach((value,i)=>{const remainder=value-lengths[i];if(remainder>best){best=remainder;index=i;}});lengths[index]++;
    }
    while(lengths.reduce((a,b)=>a+b,0)>total){
      const candidates=lengths.map((value,index)=>({value,index,score:raw[index]-value})).filter(item=>item.value>1).sort((a,b)=>a.score-b.score);
      if(!candidates.length)break;lengths[candidates[0].index]--;
    }
    let cursor=1;const ids={};
    return source.map((item,index)=>{
      const base=slug(item.name);ids[base]=(ids[base]||0)+1;const id=ids[base]===1?base:`${base}_${ids[base]}`;const length=lengths[index];
      const out={id,name:item.name,startWeek:cursor,endWeek:cursor+length-1,durationWeeks:length,purpose:item.purpose,trainingEmphasis:item.trainingEmphasis,milestone:item.milestone,objectives:item.objectives||[],progressionRule:item.progressionRule||"Progress one meaningful variable while preserving technical quality.",loadPhase:item.loadPhase||"Build",status:"upcoming"};cursor+=length;return out;
    });
  }
  function priorities(identity,goal,isEvent){
    let labels;
    if(goal==="Lose Fat")labels=["Preserve muscle and strength","Reduce body fat at a sustainable rate","Maintain training consistency"];
    else if(goal==="Body Recomposition")labels=["Increase or preserve lean mass","Improve body composition","Maintain recoverable conditioning"];
    else if(identity==="Powerlifting")labels=["Improve competition-lift performance","Manage fatigue around heavy exposures","Maintain useful aerobic recovery"];
    else if(identity==="Endurance Athlete")labels=["Develop event-specific endurance","Preserve strength and durability","Control fatigue and injury risk"];
    else if(identity==="Tactical Athlete")labels=["Build operational readiness","Develop strength and work capacity","Maintain durability under load"];
    else if(goal==="Build Muscle")labels=["Build target muscle groups","Progress training volume","Protect recovery and joint tolerance"];
    else labels=["Develop the primary objective","Preserve complementary qualities","Maintain adherence and recovery"];
    if(isEvent)labels[0]=`Arrive prepared for the event: ${labels[0].toLowerCase()}`;
    return labels.map((label,index)=>({rank:index+1,label}));
  }
  function fingerprint(identity,goal,event,total){
    return [VERSION,identity,goal,event.isEvent?event.target:"continuous",event.label,total].join("|");
  }
  function build(){
    if(!appData())return null;
    const block=data.trainingBlock||{},event=eventInfo(),identity=athleteIdentity(),goal=objective(identity,event.isEvent);
    const eventWeeks=event.isEvent?weeksUntil(event.target):null;
    const savedLength=Number(block.lengthWeeks)||12;
    const total=event.isEvent?clamp(eventWeeks||savedLength,4,MAX_WEEKS):clamp(savedLength,8,MAX_WEEKS);
    const discipline=window.BellDisciplineLibrary?.resolve(identity,goal,[block.goalType,block.secondaryGoal].filter(Boolean).join(" "))||null;
    const libraryTemplates=window.BellDisciplineLibrary?.journeyTemplates(identity,goal,event.isEvent?"event_preparation":"continuous_development",total);
    const templates=Array.isArray(libraryTemplates)&&libraryTemplates.length?libraryTemplates:(event.isEvent?eventTemplates(identity,total):continuousTemplates(identity,goal));
    const phases=allocate(templates,total);
    return {
      engineVersion:VERSION,
      mode:event.isEvent?"event_preparation":"continuous_development",
      modeLabel:event.isEvent?"Event Preparation":"Continuous Development",
      identity,
      objective:goal,
      name:journeyName(identity,goal,event),
      startDate:block.startDate||new Date().toISOString().slice(0,10),
      targetDate:event.target||null,
      eventWeeksRemaining:eventWeeks,
      horizonLimited:Boolean(eventWeeks&&eventWeeks>MAX_WEEKS),
      totalWeeks:total,
      planningHorizonWeeks:total,
      priorities:priorities(identity,goal,event.isEvent),
      discipline,
      disciplineLibraryVersion:discipline?.libraryVersion||VERSION,
      continuousPolicy:event.isEvent?null:{mode:"renewable_cycles",cycleRotation:discipline?.cycleRotation||[],renewalTrigger:"Complete assessment and recovery, then begin the next cycle without resetting completed history.",selectionRule:"Select the next bias from objective priority, weakest assessment metric, adherence, and recovery response.",extensionRule:"Extend a productive phase when progress continues and recovery remains stable.",recoveryRule:"Insert or advance recovery when readiness, pain, illness, or adherence risk exceeds tolerance."},
      phases,
      fingerprint:fingerprint(identity,goal,event,total),
      createdAt:new Date().toISOString()
    };
  }
  function stateForWeek(base,week){
    if(!base)return null;
    const out=JSON.parse(JSON.stringify(base));
    const total=Math.max(1,Number(out.totalWeeks)||1),requested=Math.max(1,Number(week)||1),continuous=out.mode==="continuous_development";
    const cycleNumber=continuous?Math.floor((requested-1)/total)+1:1;
    const cycleWeek=continuous?((requested-1)%total)+1:clamp(requested,1,total)||1;
    let current=out.phases.find(item=>cycleWeek>=item.startWeek&&cycleWeek<=item.endWeek)||out.phases[out.phases.length-1];
    out.phases.forEach(item=>item.status=item.endWeek<cycleWeek?"complete":item.id===current?.id?"current":"upcoming");
    current=out.phases.find(item=>item.id===current?.id)||current;
    let next=out.phases.find(item=>item.startWeek>cycleWeek)||null;
    const nextCycleEmphasis=continuous?(window.BellDisciplineLibrary?.nextCycleEmphasis(out.identity,out.objective,cycleNumber+1)||null):null;
    if(continuous&&!next&&out.phases.length)next={...out.phases[0],status:"upcoming",cycleNumber:cycleNumber+1,cycleEmphasis:nextCycleEmphasis};
    return {...out,requestedWeek:requested,currentWeek:continuous?requested:cycleWeek,cycleNumber,cycleWeek,cycleLength:total,cycleEmphasis:continuous?(window.BellDisciplineLibrary?.nextCycleEmphasis(out.identity,out.objective,cycleNumber)||out.name):out.name,nextCycleEmphasis,progressPercent:clamp(Math.round(cycleWeek/total*100),0,100),currentPhase:current,currentPhaseId:current?.id,currentPhaseName:current?.name||"Foundation",phaseWeek:current?cycleWeek-current.startWeek+1:1,phaseLength:current?.durationWeeks||total,nextPhase:next,nextMilestone:current?.milestone||next?.milestone||"Complete the current phase",status:continuous&&cycleWeek>=total?"cycle_review":!continuous&&cycleWeek>=total?"complete":"on_plan"};
  }
  function sync(options={}){
    if(!appData())return null;
    const candidate=build();if(!candidate)return null;
    const existing=data.coachingState;
    const base=!options.force&&existing?.fingerprint===candidate.fingerprint?{...existing,...candidate,phases:candidate.phases}:candidate;
    const state=stateForWeek(base,Number(data.trainingBlock?.currentWeek)||1);
    data.coachingState=state;
    if(options.persist!==false&&typeof saveData==="function")saveData({render:false});
    return state;
  }
  function getState(options={}){
    if(!appData())return null;
    const existing=data.coachingState;
    const cloudActive=typeof bellCloud!=="undefined"&&Boolean(bellCloud?.connected&&bellCloud?.coachingState?.journey);
    if(!options.force&&cloudActive&&String(existing?.fingerprint||"").startsWith("cloud|")){
      const state=stateForWeek(existing,Number(data.trainingBlock?.currentWeek)||existing.currentWeek||1);
      data.coachingState=state;return state;
    }
    const candidate=build();
    if(options.force||!existing||!candidate||existing.fingerprint!==candidate.fingerprint)return sync({persist:options.persist!==false,force:true});
    const state=stateForWeek(existing,Number(data.trainingBlock?.currentWeek)||1);
    data.coachingState=state;
    return state;
  }
  function explain(topic="phase"){
    const state=getState({persist:false});if(!state)return"Bell is still building your coaching state.";
    const phase=state.currentPhase||{};
    if(topic==="journey")return`${state.name} uses the ${state.discipline?.label||state.identity} coaching library because your objective is ${state.objective.toLowerCase()}. ${state.mode==="continuous_development"?`Bell will renew the Journey in cycles; this is Cycle ${state.cycleNumber}, biased toward ${state.cycleEmphasis}.`:"The event date determines how Bell builds backward from performance day."}`;
    if(topic==="milestone")return`${state.nextMilestone} is the next checkpoint because it confirms whether ${phase.name} produced the intended adaptation before Bell advances, extends, or recovers.`;
    if(topic==="progression")return phase.progressionRule||state.discipline?.progression||"Progress one meaningful variable while preserving technical quality.";
    return`You are in ${phase.name} because ${phase.purpose?.toLowerCase()||"Bell is building the next required adaptation"} Progression rule: ${phase.progressionRule||state.discipline?.progression||"preserve quality before adding demand"}`;
  }
  function renderPlanTimeline(){
    const host=document.getElementById("planProgressArea");if(!host)return;
    const state=getState({persist:false});if(!state)return;
    const discipline=state.discipline||window.BellDisciplineLibrary?.resolve(state.identity,state.objective)||{};
    const architecture=discipline.weeklyArchitecture||{};
    host.innerHTML=`<section class="bell13-plan-overview" aria-labelledby="bellJourneyPlanTitle">
      <div class="bell13-plan-overview-head"><div><span class="bell13-eyebrow">Current Journey</span><h3 id="bellJourneyPlanTitle">${escapeHtml(state.name)}</h3><p>${escapeHtml(discipline.label||state.identity)} · ${escapeHtml(state.objective)} · ${escapeHtml(state.modeLabel)}</p></div><div class="bell13-plan-week"><strong>${state.mode==="continuous_development"?`Cycle ${state.cycleNumber}`:`Week ${state.currentWeek}`}</strong><span>${state.mode==="continuous_development"?`Week ${state.cycleWeek} of ${state.cycleLength}`:`of ${state.totalWeeks}`}</span></div></div>
      <div class="bell13-plan-progress"><i style="width:${state.progressPercent}%"></i></div>
      <article class="bell13-discipline-card"><div><span class="bell13-eyebrow">Coaching Library</span><h4>${escapeHtml(discipline.label||state.identity)}</h4><p>${escapeHtml(discipline.promise||"")}</p></div><div class="bell13-discipline-grid"><div><span>Weekly architecture</span><strong>${architecture.strength||0} Strength · ${architecture.engine||0} Engine</strong></div><div><span>Progression</span><strong>${escapeHtml(state.currentPhase?.progressionRule||discipline.progression||"")}</strong></div><div><span>Protected first</span><strong>${escapeHtml((discipline.protectedSessions||[]).slice(0,3).join(" · "))}</strong></div><div><span>${state.mode==="continuous_development"?"Next cycle bias":"Assessment focus"}</span><strong>${escapeHtml(state.mode==="continuous_development"?(state.nextCycleEmphasis||"Assessment-driven"):(discipline.assessments||[]).slice(0,2).join(" · "))}</strong></div></div><button type="button" class="bell13-why-button" onclick="alert(BellCoachingEngine.explain('progression'))">Why this progression?</button></article>
      <div class="bell13-phase-timeline">${state.phases.map(item=>`<article class="bell13-phase-node ${item.status}" data-phase="${escapeHtml(item.id)}"><span>${item.status==="complete"?"✓":item.status==="current"?"◆":"○"}</span><div><small>Weeks ${item.startWeek}–${item.endWeek}</small><strong>${escapeHtml(item.name)}</strong><p>${escapeHtml(item.purpose)}</p>${item.status==="current"?`<button type="button" class="bell13-why-button" onclick="alert(BellCoachingEngine.explain('phase'))">Why this phase?</button>`:""}</div></article>`).join("")}</div>
      <div class="bell13-plan-footer"><div><span>Next milestone</span><strong>${escapeHtml(state.nextMilestone)}</strong></div><div><span>${state.mode==="continuous_development"&&!state.nextPhase?.name?"Next cycle":"Next phase"}</span><strong>${escapeHtml(state.nextPhase?.name||state.nextCycleEmphasis||"Journey review")}</strong></div></div>
    </section>`;
  }
  function escapeHtml(value){
    if(typeof window.escapeHtml==="function")return window.escapeHtml(value);
    return String(value??"").replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[char]));
  }
  window.BellCoachingEngine={version:VERSION,buildJourney:build,getState,sync,stateForWeek,explain,renderPlanTimeline};
  document.addEventListener("DOMContentLoaded",()=>{try{sync({persist:true});renderPlanTimeline();}catch(error){console.warn("Bell Coaching Engine initialization failed",error);}});
  const priorRender=window.renderApp;
  if(typeof priorRender==="function")window.renderApp=function(){const result=priorRender.apply(this,arguments);try{getState({persist:false});renderPlanTimeline();}catch(error){console.warn("Bell Coaching Engine render failed",error);}return result;};
})();
