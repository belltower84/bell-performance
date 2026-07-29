"use strict";

/* Bell Performance 13.2 — canonical discipline-specific coaching libraries. */
(function(){
  const VERSION="13.2.0";
  const clean=value=>String(value??"").replace(/\s+/g," ").trim();
  const phase=(name,weight,purpose,trainingEmphasis,milestone,objectives=[],progressionRule="Progress one meaningful variable while preserving technical quality.",loadPhase="Build")=>({name,weight,purpose,trainingEmphasis,milestone,objectives,progressionRule,loadPhase});

  const LIBRARIES={
    performance_health:{
      label:"Performance & Health",
      promise:"Build a stronger, leaner, healthier athlete through repeatable strength work, aerobic development, and sustainable habits.",
      weeklyArchitecture:{strength:3,engine:2,recovery:2},
      protectedSessions:["Full-body strength","Second strength exposure","Aerobic base"],
      progression:"Add repetitions and consistency before adding load, density, or conditioning difficulty.",
      missedRule:"Resume the next highest-priority strength session. Replace missed conditioning with walking instead of stacking hard work.",
      readinessYellow:"Keep the primary strength work, remove optional finishers, and make Engine work easy.",
      readinessRed:"Use recovery, mobility, and easy walking only until readiness or symptoms improve.",
      assessments:["Bodyweight trend","Waist trend","Strength retention","Weekly adherence","Aerobic tolerance"],
      cycleRotation:["Consistency","Strength Capacity","Body Composition","Work Capacity"]
    },
    powerlifting:{
      label:"Powerlifting",
      promise:"Improve squat, bench press, and deadlift through specific practice, controlled overload, weak-point development, and fatigue-aware peaking.",
      weeklyArchitecture:{strength:4,engine:1,recovery:2},
      protectedSessions:["Squat focus","Bench focus","Deadlift focus","Secondary squat and bench"],
      progression:"Progress top sets only when bar speed, technique, and target RPE agree; derive back-off work from the completed top set.",
      missedRule:"Preserve competition-lift order. Move a missed primary lift only when at least 48 hours remain before the next high-fatigue lower session.",
      readinessYellow:"Keep competition-lift technique and one priority top set; reduce back-off and accessory volume by roughly 25 percent.",
      readinessRed:"Replace heavy work with technique practice at low RPE or a recovery session. Do not force missed heavy exposures into the week.",
      assessments:["Estimated squat 1RM","Estimated bench 1RM","Estimated deadlift 1RM","Top-set RPE accuracy","Bar-quality trend"],
      cycleRotation:["Hypertrophy Base","Competition-Lift Strength","Weak-Point Strength","Technique Efficiency"]
    },
    bodybuilding:{
      label:"Bodybuilding",
      promise:"Build muscle through stable exercise selection, productive weekly volume, deliberate weak-point work, and recoverable proximity to failure.",
      weeklyArchitecture:{strength:5,engine:2,recovery:1},
      protectedSessions:["Priority weak-point exposure","Legs","Push","Pull"],
      progression:"Use double progression at one to three repetitions in reserve; add load after the top of the rep range is owned across prescribed sets.",
      missedRule:"Skip the missed full session or merge one small accessory block. Never double two complete hypertrophy sessions.",
      readinessYellow:"Keep priority muscle work and compounds, cut low-value isolation volume, and stop farther from failure.",
      readinessRed:"Use a recovery microcycle with reduced sets and no failure work.",
      assessments:["Target-muscle performance","Weekly set tolerance","Bodyweight trend","Circumference or photo review","Joint tolerance"],
      cycleRotation:["Global Growth","Weak-Point Emphasis","Strength Support","Volume Resensitization"]
    },
    hybrid_athlete:{
      label:"Hybrid Athlete",
      promise:"Develop strength and endurance concurrently while protecting key sessions from interference and unproductive fatigue.",
      weeklyArchitecture:{strength:4,engine:3,recovery:1},
      protectedSessions:["Primary lower strength","Primary upper strength","Quality Engine","Long aerobic session"],
      progression:"Increase only one major lower-body stressor at a time: lifting intensity, hard running volume, or long-session duration.",
      missedRule:"Protect primary strength and the long Engine session. Remove redundant intensity before rescheduling a missed workout.",
      readinessYellow:"Preserve one key strength and one key Engine exposure; convert secondary intensity to Zone 2.",
      readinessRed:"Remove intervals and mixed-modal intensity; retain easy aerobic work and low-fatigue technique lifting only.",
      assessments:["Strength retention","Threshold pace or power","Long-session durability","Concurrent fatigue","Weekly completion"],
      cycleRotation:["Strength Bias","Aerobic Bias","Balanced Development","Durability"]
    },
    tactical_athlete:{
      label:"Tactical Athlete",
      promise:"Build operational strength, aerobic durability, load carriage, grip, and repeatable work capacity without compromising readiness for duty.",
      weeklyArchitecture:{strength:4,engine:3,recovery:1},
      protectedSessions:["Lower strength","Upper strength","Long aerobic or ruck","Operational work capacity"],
      progression:"Progress load carriage, running intensity, and lower-body strength on separate weeks whenever possible.",
      missedRule:"Protect duty readiness. Keep the long aerobic or ruck session and primary strength work; drop redundant conditioning first.",
      readinessYellow:"Retain strength technique and easy aerobic durability; reduce loaded carries and high-impact intervals.",
      readinessRed:"Use mobility, easy aerobic recovery, and pain-free technique only. Operational readiness outranks training completion.",
      assessments:["Loaded movement tolerance","Grip endurance","Aerobic benchmark","Strength benchmark","Work-capacity repeatability"],
      cycleRotation:["Strength & Armor","Aerobic Durability","Work Capacity","Load Carriage"]
    },
    functional_fitness:{
      label:"Functional Fitness",
      promise:"Develop strength, skill capacity, and mixed-modal conditioning through balanced exposure and controlled intensity density.",
      weeklyArchitecture:{strength:3,engine:3,recovery:1},
      protectedSessions:["Primary strength or Olympic-lift exposure","Skill exposure","Mixed-modal benchmark"],
      progression:"Progress skill complexity, strength loading, and conditioning density independently rather than increasing all three together.",
      missedRule:"Preserve the primary skill and strength exposure. Skip duplicate mixed-modal intensity rather than stacking metcons.",
      readinessYellow:"Keep skill practice and strength technique; shorten conditioning and avoid failure density.",
      readinessRed:"Remove mixed-modal intensity and use skill drills, mobility, and easy cyclical work.",
      assessments:["Strength benchmark","Skill consistency","Mixed-modal repeatability","Movement quality","Recovery between efforts"],
      cycleRotation:["Strength","Skill","Aerobic Capacity","Mixed-Modal Integration"]
    },
    endurance_athlete:{
      label:"Endurance Athlete",
      promise:"Build durable aerobic volume, threshold speed, high-end aerobic power, and event-specific execution while preserving strength and tissue capacity.",
      weeklyArchitecture:{strength:3,engine:4,recovery:1},
      protectedSessions:["Long session","Quality Engine session","Durability strength"],
      progression:"Increase volume before intensity, and avoid increasing long-session duration and interval volume in the same week.",
      missedRule:"Protect the long session and one quality session. Do not make up missed easy volume by turning recovery days hard.",
      readinessYellow:"Keep the long session easy and reduce interval repetitions; preserve short durability strength.",
      readinessRed:"Replace intensity with easy aerobic work or rest. Resume quality only after symptoms and mechanics normalize.",
      assessments:["Aerobic pace or power","Threshold pace or power","Long-session durability","Running economy or efficiency","Strength retention"],
      cycleRotation:["Aerobic Base","Threshold","VO₂ Support","Durability"]
    }
  };

  function resolveId(identity="",objective="",text=""){
    const value=[identity,objective,text].map(clean).join(" ").toLowerCase();
    if(/powerlift|squat.*bench.*deadlift/.test(value))return"powerlifting";
    if(/bodybuild|physique|hypertrophy|muscle building/.test(value))return"bodybuilding";
    if(/tactical|selection|ruck|police|military|fire/.test(value))return"tactical_athlete";
    if(/functional fitness|crossfit|mixed modal/.test(value))return"functional_fitness";
    if(/marathon|half marathon|10k|5k|running|cycling|triathlon|endurance/.test(value))return"endurance_athlete";
    if(/hybrid|athletic performance|sport performance|speed|agility/.test(value))return"hybrid_athlete";
    return"performance_health";
  }
  function resolve(identity="",objective="",text=""){
    const id=resolveId(identity,objective,text);return{id,libraryVersion:VERSION,...LIBRARIES[id]};
  }
  function nextCycleEmphasis(identity,objective,cycleNumber=1){
    const rotation=resolve(identity,objective).cycleRotation;return rotation[(Math.max(1,Number(cycleNumber)||1)-1)%rotation.length];
  }
  function continuousTemplates(identity,objective){
    const id=resolveId(identity,objective),fatLoss=objective==="Lose Fat";
    if(fatLoss)return[
      phase("Foundation",.16,"Build repeatable training, movement, and nutrition habits.","foundation","Foundation check-in",["consistency","movement quality"],"Build adherence before increasing training or diet demand.","Foundation"),
      phase("Fat Loss I",.24,"Reduce body fat while preserving strength and muscle.","fat_loss","First bodyweight milestone",["body composition","muscle retention"],"Preserve strength first; progress steps or easy aerobic work before cutting calories further."),
      phase("Recovery",.10,"Reduce training and diet fatigue before the next push.","deload","Recovery review",["fatigue reduction"],"Reduce volume and return nutrition to maintenance.","Deload"),
      phase("Fat Loss II",.24,"Continue fat loss with progressive strength and aerobic support.","fat_loss","Next bodyweight milestone",["body composition","work capacity"],"Adjust one lever at a time: adherence, daily movement, cardio, then calories."),
      phase("Diet Break",.10,"Restore training quality and diet adherence at maintenance intake.","recovery","Maintenance review",["recovery","adherence"],"Restore performance and hunger control before another deficit.","Recovery"),
      phase("Recomposition",.16,"Consolidate the result and improve performance at a stable bodyweight.","recomposition","Journey assessment",["strength","muscle retention"],"Maintain bodyweight while progressing performance.")
    ];
    if(id==="bodybuilding"||["Build Muscle","Body Recomposition"].includes(objective))return[
      phase("Foundation",.14,"Establish technique, volume tolerance, and recovery habits.","foundation","Foundation review",[],"Own exercise execution before adding volume.","Foundation"),
      phase("Growth",.30,"Accumulate productive hypertrophy volume.","accumulation","Growth review",["hypertrophy"],LIBRARIES.bodybuilding.progression),
      phase("Strength Support",.18,"Raise force production to support future hypertrophy.","strength","Strength assessment",["strength"],"Progress stable compounds without sacrificing target-muscle work."),
      phase("Weak-Point Development",.22,"Prioritize lagging muscle groups without losing global progress.","hypertrophy","Weak-point review",["weak points"],"Add volume only to priority areas and remove lower-value work when recovery tightens."),
      phase("Recovery",.16,"Reduce fatigue and resensitize the athlete to productive volume.","deload","Cycle assessment",["fatigue reduction"],"Cut sets and failure exposure while preserving movement practice.","Deload")
    ];
    if(id==="powerlifting"||(id==="performance_health"&&objective==="Increase Strength"))return[
      phase("Hypertrophy Base",.24,"Build muscle and work capacity for future strength work.","accumulation","Rep-strength assessment",["hypertrophy","work capacity"],"Add repeatable back-off volume before heavier loading."),
      phase("Strength Development",.28,"Increase competition-lift force production.","strength","Heavy triple assessment",["max strength"],LIBRARIES.powerlifting.progression),
      phase("Intensification",.20,"Practice heavier, more specific lifting while controlling fatigue.","intensification","Estimated 1RM assessment",["specific strength"],"Increase specificity and reduce accessory fatigue."),
      phase("Assessment",.12,"Measure progress and identify the next limiting lift or quality.","assessment","Performance review",["testing"],"Use submaximal performance evidence before true maximal testing.","Peak"),
      phase("Recovery",.16,"Reduce fatigue before beginning the next strength cycle.","deload","Next-cycle decision",["fatigue reduction"],"Keep technique and remove heavy fatigue.","Deload")
    ];
    if(id==="endurance_athlete")return[
      phase("Aerobic Base",.30,"Build durable aerobic capacity and consistent volume.","foundation","Aerobic benchmark",["aerobic base"],"Increase easy volume gradually.","Foundation"),
      phase("Threshold",.22,"Improve sustainable pace and efficiency.","threshold","Threshold assessment",["threshold"],"Add controlled threshold minutes without racing training."),
      phase("VO₂ Development",.18,"Raise high-end aerobic power.","intensification","VO₂ assessment",["VO₂"],"Progress interval volume before pace while preserving mechanics."),
      phase("Assessment",.12,"Measure progress and identify the next limiter.","assessment","Performance review",["testing"],"Assess the current limiter, not every quality at once.","Peak"),
      phase("Recovery",.18,"Reduce fatigue before the next aerobic cycle.","deload","Next-cycle decision",["fatigue reduction"],"Reduce volume and remove hard intervals.","Deload")
    ];
    if(id==="tactical_athlete")return[
      phase("Foundation",.16,"Build movement quality and aerobic durability for duty demands.","foundation","Foundation review",[],"Build consistency and durability first.","Foundation"),
      phase("Strength & Armor",.22,"Increase force production, structural resilience, grip, and trunk strength.","strength","Operational strength benchmark",["strength","durability"],LIBRARIES.tactical_athlete.progression),
      phase("Aerobic Durability",.18,"Improve sustainable conditioning and recovery between efforts.","threshold","Aerobic benchmark",["aerobic base","threshold"],"Build sustainable output before adding operational density."),
      phase("Load & Work Capacity",.22,"Integrate carries, loaded movement, and repeatable high-output work.","specific","Operational simulation",["load carriage","work capacity"],"Progress only one loaded or high-impact stressor at a time."),
      phase("Assessment",.10,"Measure readiness and identify the next limiting quality.","assessment","Readiness review",["testing"],"Assess operational readiness without exhausting it.","Peak"),
      phase("Recovery",.12,"Reduce fatigue and restore readiness for the next cycle.","deload","Next-cycle decision",["fatigue reduction"],"Duty readiness outranks training completion.","Deload")
    ];
    if(id==="functional_fitness")return[
      phase("Foundation",.16,"Build movement quality, aerobic capacity, and repeatable skill practice.","foundation","Foundation review",[],"Establish standards before density.","Foundation"),
      phase("Strength & Skill",.22,"Improve primary strength and the highest-priority skill limiter.","strength","Strength and skill benchmark",["strength","skill"],LIBRARIES.functional_fitness.progression),
      phase("Engine Development",.18,"Raise cyclical capacity and recovery between efforts.","threshold","Engine benchmark",["aerobic base","threshold"],"Build cyclical fitness without metcon overload."),
      phase("Mixed-Modal Integration",.24,"Combine strength, skill, and conditioning under controlled density.","specific","Mixed-modal benchmark",["mixed modal","work capacity"],"Increase density only when movement quality holds."),
      phase("Assessment",.08,"Measure progress and select the next limiter.","assessment","Performance review",["testing"],"Use repeatable benchmarks, not random suffering.","Peak"),
      phase("Recovery",.12,"Reduce fatigue and prepare for the next cycle.","deload","Next-cycle decision",["fatigue reduction"],"Remove metcon intensity and preserve skill touch.","Deload")
    ];
    if(id==="hybrid_athlete")return[
      phase("Foundation",.18,"Build durable movement quality and aerobic capacity.","foundation","Foundation review",[],"Build both bases before combining stress.","Foundation"),
      phase("Strength Development",.22,"Increase force production while preserving aerobic volume.","strength","Strength benchmark",["strength"],LIBRARIES.hybrid_athlete.progression),
      phase("Engine Development",.20,"Improve sustainable conditioning while maintaining key lifts.","threshold","Engine benchmark",["aerobic base","threshold"],"Progress Engine work without raising lower lifting stress simultaneously."),
      phase("Hybrid Integration",.22,"Combine strength and Engine qualities under controlled fatigue.","specific","Hybrid simulation",["work capacity","concurrent fitness"],"Protect high-value sessions and remove redundant intensity."),
      phase("Assessment",.08,"Measure progress and identify the next limiting quality.","assessment","Performance review",["testing"],"Assess strength and Engine without testing both maximally in one day.","Peak"),
      phase("Recovery",.10,"Reduce fatigue and prepare for the next bias cycle.","deload","Next-cycle decision",["fatigue reduction"],"Retain easy aerobic work and technique lifting.","Deload")
    ];
    return[
      phase("Foundation",.22,"Build movement quality, consistency, and general capacity.","foundation","Foundation review",[],"Add consistency before complexity.","Foundation"),
      phase("Capacity",.25,"Improve strength and aerobic work capacity.","accumulation","Capacity benchmark",["strength","aerobic base"],LIBRARIES.performance_health.progression),
      phase("Performance",.24,"Develop the athlete's highest-priority physical quality.","intensification","Performance assessment",["primary adaptation"],"Progress the primary objective while maintaining complementary fitness."),
      phase("Assessment",.12,"Measure progress and select the next emphasis.","assessment","Journey review",["testing"],"Assess the few metrics that can change the next coaching decision.","Peak"),
      phase("Recovery",.17,"Reduce fatigue and prepare for the next cycle.","deload","Next-cycle decision",["fatigue reduction"],"Reduce demand while preserving routine.","Deload")
    ];
  }
  function eventTemplates(identity,objective,weeks){
    const id=resolveId(identity,objective);
    if(Number(weeks)<=6)return[
      phase("Specific Preparation",.55,"Practice the objective's highest-value demands.","specific","Final simulation",["specificity","execution"],"Preserve event-specific quality and remove low-value volume."),
      phase("Peak",.25,"Express performance with lower volume and high-quality work.","peak","Final readiness assessment",["performance expression"],"Maintain intensity while reducing total work.","Peak"),
      phase("Taper",.20,"Reduce fatigue without losing readiness.","taper","Event day",["fatigue reduction"],"Reduce volume; do not try to create new fitness in taper.","Deload")
    ];
    if(id==="powerlifting")return[
      phase("Foundation",.15,"Build competition-lift technique, work capacity, and tolerance for heavier training.","foundation","Foundation review",[],"Build repeatable technique.","Foundation"),
      phase("Volume",.22,"Accumulate competition-lift volume and useful muscle.","accumulation","Rep-strength assessment",[],"Add back-off volume before top-set intensity."),
      phase("Strength",.24,"Increase force production in the competition lifts.","strength","Heavy triple or double benchmark",[],LIBRARIES.powerlifting.progression),
      phase("Intensification",.18,"Raise specificity and practice heavier competition work.","intensification","Opener-range exposure",[],"Increase specificity and reduce accessory fatigue."),
      phase("Peak",.12,"Convert training into meet-day performance.","peak","Final opener practice",[],"Practice commands and selected attempts; avoid grinders.","Peak"),
      phase("Taper",.09,"Reduce fatigue while preserving confidence and skill.","taper","Meet day",[],"Retain brief competition-lift exposure and remove nonessential work.","Deload")
    ];
    if(id==="endurance_athlete")return[
      phase("Aerobic Base",.27,"Expand durable aerobic capacity and consistent volume.","foundation","Aerobic benchmark",[],"Increase easy volume gradually.","Foundation"),
      phase("Threshold",.20,"Improve sustainable speed and lactate clearance.","threshold","Threshold assessment",[],"Add controlled threshold minutes."),
      phase("VO₂ Development",.15,"Raise high-end aerobic power without overwhelming recovery.","intensification","VO₂ benchmark",[],"Progress interval volume before pace."),
      phase("Race Specific",.22,"Practice goal pace, fueling, and event-specific durability.","specific","Final race simulation",[],"Progress race-specific duration while protecting recovery."),
      phase("Peak",.08,"Sharpen speed while lowering accumulated fatigue.","peak","Readiness check",[],"Keep brief race-pace contact and reduce volume.","Peak"),
      phase("Taper",.08,"Arrive fresh without losing rhythm.","taper","Event day",[],"Reduce volume while preserving familiar rhythm.","Deload")
    ];
    if(id==="bodybuilding")return[
      phase("Foundation",.15,"Build movement quality, training tolerance, and consistent execution.","foundation","Foundation review",[],"Establish stable execution.","Foundation"),
      phase("Growth",.28,"Build muscle with progressive volume and stable recovery.","accumulation","Physique and performance review",[],LIBRARIES.bodybuilding.progression),
      phase("Weak-Point Development",.18,"Prioritize the physique areas that need the most improvement.","hypertrophy","Weak-point review",[],"Add priority volume while controlling global fatigue."),
      phase("Contest Preparation",.24,"Preserve muscle while reducing body fat and maintaining training quality.","specific","Final physique assessment",[],"Maintain load and execution during sustainable loss."),
      phase("Peak Week",.15,"Reduce fatigue and preserve fullness without last-minute extremes.","taper","Competition day",[],"Avoid aggressive last-minute changes.","Deload")
    ];
    return[
      phase("Foundation",.20,"Build the base that supports harder work later.","foundation","Foundation review",[],"Build the base.","Foundation"),
      phase("Development",.30,"Build the highest-priority physical qualities.","accumulation","Development benchmark",[],"Progress the highest-value adaptation."),
      phase("Intensification",.20,"Increase the specificity and difficulty of key sessions.","intensification","Performance assessment",[],"Increase specificity without unnecessary fatigue."),
      phase("Specific Preparation",.17,"Practice the exact demands of the event.","specific","Final simulation",[],"Practice execution under event-like demands."),
      phase("Peak",.07,"Express performance while controlling fatigue.","peak","Readiness check",[],"Maintain intensity and reduce volume.","Peak"),
      phase("Taper",.06,"Reduce fatigue and arrive prepared.","taper","Event day",[],"Arrive fresh.","Deload")
    ];
  }
  function journeyTemplates(identity,objective,mode,weeks){return mode==="event_preparation"?eventTemplates(identity,objective,weeks):continuousTemplates(identity,objective);}
  function currentText(){
    if(typeof data==="undefined")return"";const b=data.trainingBlock||{},m=b.mission||{},d=b.dualGoals||{};
    return[b.goalType,d.strengthGoal,d.engineGoal,m.developmentGoal,m.eventType,m.priority,b.bodybuildingPhase,b.bodybuildingFocus,data.settings?.athleteMode,data.settings?.primaryTrainingIdentity,data.settings?.secondaryTrainingGoal].filter(Boolean).join(" ");
  }
  function currentState(){try{return window.BellCoachingEngine?.getState({persist:false})||null;}catch(_){return null;}}
  function currentCoachingPathwayId(){const s=currentState();return resolveId(s?.identity||"",s?.objective||"",currentText());}
  function currentCoachingPathway(){return resolve(currentState()?.identity||"",currentState()?.objective||"",currentText());}
  function pathwayWeekRole(){return currentState()?.currentPhaseName||"Foundation";}
  function pathwayReadinessAdjustment(){
    const status=typeof readinessStatus==="function"?readinessStatus(readinessScore()):"GREEN",profile=currentCoachingPathway();
    if(status==="RED")return{status,setScale:.5,intensityScale:.82,engine:"recovery",message:profile.readinessRed};
    if(status==="YELLOW")return{status,setScale:.75,intensityScale:.92,engine:"easy",message:profile.readinessYellow};
    return{status,setScale:1,intensityScale:1,engine:"planned",message:"Execute the planned quality and preserve readiness for the next protected session."};
  }
  function pathwayProgressionPrescription(){
    const state=currentState(),profile=currentCoachingPathway(),phaseState=state?.currentPhase||{},recovery=/recover|deload|taper|diet break/i.test(phaseState.name||"");
    return{id:profile.id,role:phaseState.name||"Foundation",load:recovery?.68:.78,setScale:recovery?.6:1,method:phaseState.progressionRule||profile.progression};
  }
  function pathwaySessionIntent(item,index){
    const p=currentCoachingPathway(),mission=String(item?.mission||""),engine=/^R-|engine|run|cardio|interval|zone 2/i.test(`${mission} ${item?.customLabel||""}`);
    if(engine)return/long/i.test(`${mission} ${item?.customLabel||""}`)?"Build durable aerobic capacity without racing the finish.":/interval|tempo|threshold/i.test(`${mission} ${item?.customLabel||""}`)?"Complete quality work at the prescribed effort and stop before mechanics collapse.":"Build the aerobic base at a recoverable effort.";
    return index===0?`Protect ${p.protectedSessions[0].toLowerCase()} and execute it with phase-appropriate quality.`:`Support ${p.label.toLowerCase()} development without compromising the next protected session.`;
  }
  function annotatePlanWithPathway(){
    if(typeof data==="undefined"||!data.trainingBlock)return;const p=currentCoachingPathway(),prog=pathwayProgressionPrescription();
    data.trainingBlock.coachingPathway=p.id;data.trainingBlock.coachingPathwayLabel=p.label;data.trainingBlock.coachingWeekRole=prog.role;
    (data.plan||[]).forEach((item,index)=>{item.coachingPathway=p.id;item.coachingIntent=pathwaySessionIntent(item,index);item.progressionMethod=prog.method;item.rotationCadenceWeeks=currentState()?.cycleLength||6;item.missedSessionRule=p.missedRule;if(item.mission!=="M-1 Daily Reset"&&!String(item.detail||"").includes("Coach intent:"))item.detail=`${item.detail||""} • Coach intent: ${item.coachingIntent}`;});
  }
  if(typeof buildCurrentWeekPlan==="function"){const base=buildCurrentWeekPlan;buildCurrentWeekPlan=function(){base();annotatePlanWithPathway();};}
  if(typeof strengthProgression==="function"){const base=strengthProgression;strengthProgression=function(){const prior=base(),p=pathwayProgressionPrescription(),r=pathwayReadinessAdjustment();return{...prior,label:`${p.role} • ${currentCoachingPathway().label}`,load:Math.min(Number(prior.load)||1,p.load)*r.intensityScale,setScale:Math.min(Number(prior.setScale)||1,p.setScale)*r.setScale,note:`${p.method} ${r.message}`};};}
  if(typeof coachRecommendation==="function"){const base=coachRecommendation;coachRecommendation=function(){if(!data.trainingBlock?.enabled)return base();const p=currentCoachingPathway(),prog=pathwayProgressionPrescription(),r=pathwayReadinessAdjustment();return`${p.label} • ${prog.role}. ${p.progression} ${r.message}`;};}
  function coachingPathwaySummary(){const p=currentCoachingPathway(),prog=pathwayProgressionPrescription();return{...p,weekRole:prog.role,progression:prog.method,rotationWeeks:currentState()?.cycleLength||6};}
  if(typeof openMissedSessionManager==="function"){const base=openMissedSessionManager;openMissedSessionManager=function(index){base(index);const item=data.plan?.[index],box=document.getElementById("missedSessionCurrent");if(item&&box)box.textContent=`Currently scheduled for ${item.day}. ${currentCoachingPathway().missedRule}`;};}

  window.BELL_COACHING_PATHWAYS=LIBRARIES;
  window.BellDisciplineLibrary={version:VERSION,libraries:LIBRARIES,resolveId,resolve,journeyTemplates,nextCycleEmphasis};
  window.currentCoachingPathwayId=currentCoachingPathwayId;
  window.currentCoachingPathway=currentCoachingPathway;
  window.coachingPathwaySummary=coachingPathwaySummary;
  document.addEventListener("DOMContentLoaded",()=>{if(typeof data!=="undefined"&&data.trainingBlock?.enabled){annotatePlanWithPathway();if(typeof saveData==="function")saveData({render:false});}});
})();
