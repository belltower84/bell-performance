"use strict";

/* Bell Performance 13.9.1 — Formal Week Wiring & Endurance Event Repair
   One formal week model, discipline-specific event recovery, explicit endurance
   roles, and phase-aware variation for long-horizon training blocks. */

(function(){
  const VERSION="13.22.13";
  const WEEKDAYS=["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
  const clone=value=>value==null?value:JSON.parse(JSON.stringify(value));
  const text=value=>String(value||"").trim();
  const lower=value=>text(value).toLowerCase();
  const clamp=(value,min,max)=>Math.max(min,Math.min(max,Number(value)||0));

  function blockFamily(block=data.trainingBlock||{}){
    const mission=block?.mission||{};
    const event=lower(mission.eventType||block.eventType);
    const identity=lower([
      mission.identity,block.goalType,block.dualGoals?.strengthGoal,
      data.settings?.primaryTrainingIdentity,data.settings?.athleteMode
    ].filter(Boolean).join(" "));
    if(/powerlifting meet|strongman/.test(event))return "strength_competition";
    if(/bodybuilding|physique/.test(event))return "physique";
    if(/marathon|half marathon|10k|5k|running/.test(event))return "running";
    if(/triathlon/.test(event))return "multisport";
    if(/cycling/.test(event))return "cycling";
    if(/powerlifting/.test(identity))return "powerlifting";
    if(/bodybuilding|physique/.test(identity))return "physique";
    if(/running|endurance/.test(identity)||/endurance/.test(lower(block.secondaryGoal)))return "running";
    if(/beginner/.test(lower(data.settings?.trainingExperience)))return "beginner";
    return "general";
  }

  function recentEnough(timestamp,days=56){
    if(!timestamp)return false;
    const when=new Date(timestamp).getTime(),now=Date.now();
    return Number.isFinite(when)&&Math.abs(now-when)<=days*86400000;
  }
  function recentEventFamily(){
    const last=data.settings?.lastCompletedEvent;
    if(last?.family&&recentEnough(last.completedAt))return last.family;
    const archived=Array.isArray(data.archivedTrainingBlocks)?[...data.archivedTrainingBlocks].reverse():[];
    const prior=archived.find(item=>item?.mission?.path==="event"&&recentEnough(item.archivedAt||item.completedAt||item.updatedAt));
    if(!prior)return "";
    return blockFamily(prior);
  }

  function transitionType(block=data.trainingBlock||{}){
    const explicit=lower(block.transitionType||block.journeyPhaseName||block.longitudinalContext).replace(/_/g," ");
    if(/post[- ]?meet/.test(explicit))return "post_meet";
    if(/post[- ]?show/.test(explicit))return "post_show";
    if(/post[- ]?race/.test(explicit))return "post_race";
    const objective=lower(block.mission?.developmentGoal||block.secondaryGoal||data.settings?.secondaryTrainingGoal);
    if(!/maintain|recovery|restore/.test(objective))return "";
    const family=recentEventFamily();
    if(family==="strength_competition")return "post_meet";
    if(family==="physique")return "post_show";
    if(family==="running"||family==="cycling"||family==="multisport")return "post_race";
    return "";
  }

  function eventPhase(block,week){
    const total=Math.max(2,Number(block?.lengthWeeks)||12);
    const family=blockFamily(block);
    const taperWeeks=family==="physique"?1:family==="strength_competition"||family==="running"||family==="cycling"||family==="multisport"?2:1;
    const remaining=Math.max(0,total-week);
    if(remaining===0)return {id:"event_week",label:"Event Week",objective:"Arrive fresh and execute the rehearsed plan.",volumeScale:.42,specificity:1};
    if(remaining<taperWeeks)return {id:"taper",label:"Peak & Taper",objective:"Reduce fatigue while preserving event-specific readiness.",volumeScale:.58,specificity:.96};
    const ratio=week/total;
    if(week%4===0&&remaining>taperWeeks+1)return {id:"recovery",label:"Recovery & Absorption",objective:"Absorb training and restore movement quality.",volumeScale:.68,specificity:Math.min(.82,ratio+.12)};
    if(ratio<=.25)return {id:"general",label:"General Preparation",objective:"Build the physical base needed for specific preparation.",volumeScale:.88,specificity:.3};
    if(ratio<=.55)return {id:"build",label:"Capacity Build",objective:"Increase productive workload without losing repeatability.",volumeScale:1,specificity:.52};
    if(ratio<=.78)return {id:"specific",label:"Specific Development",objective:"Shift training toward event-specific demands.",volumeScale:.94,specificity:.76};
    return {id:"competition",label:"Competition Preparation",objective:"Rehearse competition demands while managing fatigue.",volumeScale:.82,specificity:.92};
  }

  function continuousPhase(block,week){
    const total=Math.max(1,Number(block?.lengthWeeks)||12);
    const transition=transitionType(block);
    if(transition){
      const labels={post_meet:"Post-Meet Recovery",post_show:"Post-Show Recovery",post_race:"Post-Race Recovery"};
      return {id:transition,label:labels[transition],objective:"Restore readiness before rebuilding normal training stress.",volumeScale:week===1?.45:week===2?.58:.7,specificity:.15};
    }
    if(week===total)return {id:"transition",label:"Review & Transition",objective:"Review progress and establish the next training direction.",volumeScale:.65,specificity:.5};
    const ratio=week/total;
    if(week%4===0)return {id:"recovery",label:"Recovery & Resensitization",objective:"Reduce fatigue and prepare for the next progression wave.",volumeScale:.65,specificity:.4};
    if(ratio<=.25)return {id:"foundation",label:"Foundation",objective:"Build repeatable movement, workload tolerance, and training habits.",volumeScale:.82,specificity:.3};
    if(ratio<=.62)return {id:"progressive",label:"Progressive Development",objective:"Progress load, volume, or density one variable at a time.",volumeScale:1,specificity:.55};
    if(ratio<=.86)return {id:"specialization",label:"Specialization",objective:"Prioritize the athlete's mission and current weak points.",volumeScale:.92,specificity:.78};
    return {id:"consolidation",label:"Consolidation & Testing",objective:"Confirm progress without turning every session into a test.",volumeScale:.78,specificity:.88};
  }

  function phaseFor(block,week){
    return block?.mission?.path==="event"?eventPhase(block,week):continuousPhase(block,week);
  }

  function weekStart(block,week){
    const base=block?.startDate||((typeof todayKey==="function")?todayKey():new Date().toISOString().slice(0,10));
    if(typeof mondayKeyFor==="function"&&typeof addLocalDays==="function")return addLocalDays(mondayKeyFor(base),(week-1)*7);
    const d=new Date(`${base}T12:00:00`);d.setDate(d.getDate()-((d.getDay()+6)%7)+(week-1)*7);return d.toISOString().slice(0,10);
  }

  function configSignature(block){
    return JSON.stringify({
      goal:block?.goalType,mission:block?.mission,dual:block?.dualGoals,
      days:block?.availableDays||data.athleteProfile?.availability?.normalDays||[],
      trainingDays:block?.trainingDays,strengthDays:block?.strengthDays,runDays:block?.runDays,
      minutes:block?.sessionMinutes,length:block?.lengthWeeks,experience:data.settings?.trainingExperience,
      transition:block?.transitionType||block?.journeyPhaseName||""
    });
  }

  const CUSTOM_TEMPLATES={
    "S-9 Post-Meet Restore A":{label:"Post-Meet Restore A",duration:45,exercises:[
      {name:"Goblet Squat",block:"Restorative Strength",sets:3,reps:"8 @ RPE 5–6",rest:75,cue:"Use a comfortable range and leave plenty in reserve."},
      {name:"Flat Dumbbell Press",block:"Restorative Strength",sets:3,reps:"8–10 @ RPE 6",rest:75,cue:"No grinding and no competition setup demands."},
      {name:"Chest-Supported Row",block:"Upper Back",sets:3,reps:"10–12",rest:60,cue:"Move smoothly and restore upper-back volume."},
      {name:"Romanian Deadlift",block:"Posterior Chain",sets:2,reps:"8 @ RPE 5–6",rest:75,cue:"Light hinge practice only."},
      {name:"Farmer Carry",block:"Trunk & Grip",sets:3,reps:"30 seconds",rest:60,cue:"Walk tall and breathe normally."}
    ]},
    "S-10 Post-Meet Restore B":{label:"Post-Meet Restore B",duration:45,exercises:[
      {name:"Tempo Back Squat",block:"Technique",sets:3,reps:"5 @ RPE 5–6",rest:120,cue:"Slow descent, easy load, no meet-day pressure."},
      {name:"Paused Bench Press",block:"Technique",sets:3,reps:"5 @ RPE 5–6",rest:105,cue:"Practice position without chasing load."},
      {name:"Single-Arm Dumbbell Row",block:"Upper Back",sets:3,reps:"10 each",rest:60,cue:"Stay braced and controlled."},
      {name:"Reverse Lunge",block:"Single-Leg",sets:2,reps:"8 each",rest:60,cue:"Use a stable range and moderate effort."},
      {name:"Dead Bug",block:"Core",sets:3,reps:"6 each",rest:45,cue:"Restore breathing and trunk control."}
    ]},
    "B-9 Post-Show Restore A":{label:"Post-Show Full-Body Restore A",duration:45,exercises:[
      {name:"Goblet Squat",block:"Low-Soreness Lower",sets:3,reps:"10 @ RPE 6",rest:75,cue:"Comfortable range and controlled tempo."},
      {name:"Incline Dumbbell Press",block:"Upper Body",sets:3,reps:"10 @ RPE 6",rest:75,cue:"Stop well before failure."},
      {name:"Neutral-Grip Lat Pulldown",block:"Back",sets:3,reps:"10–12",rest:60,cue:"Smooth stretch and squeeze."},
      {name:"Hip Thrust",block:"Glutes",sets:3,reps:"10",rest:75,cue:"Moderate load and no soreness chase."},
      {name:"Lateral Raise",block:"Delts",sets:2,reps:"12–15",rest:45,cue:"Easy pump only."}
    ]},
    "B-10 Post-Show Restore B":{label:"Post-Show Full-Body Restore B",duration:45,exercises:[
      {name:"Romanian Deadlift",block:"Posterior Chain",sets:3,reps:"8 @ RPE 6",rest:75,cue:"Keep fatigue low."},
      {name:"Flat Dumbbell Press",block:"Chest",sets:3,reps:"10",rest:75,cue:"Leave at least four clean reps in reserve."},
      {name:"Chest-Supported Row",block:"Back",sets:3,reps:"10–12",rest:60,cue:"No body English."},
      {name:"Step-up",block:"Single-Leg",sets:2,reps:"8 each",rest:60,cue:"Stable and controlled."},
      {name:"Face Pull",block:"Shoulder Health",sets:2,reps:"15",rest:45,cue:"Restore position and movement quality."}
    ]},
    "S-11 Runner Recovery Strength":{label:"Runner Recovery Strength",duration:35,exercises:[
      {name:"Goblet Squat",block:"Movement Quality",sets:2,reps:"8 @ RPE 5–6",rest:60,cue:"Easy strength only."},
      {name:"Romanian Deadlift",block:"Posterior Chain",sets:2,reps:"8 @ RPE 5–6",rest:60,cue:"Keep the hamstrings fresh."},
      {name:"Step-up",block:"Single-Leg",sets:2,reps:"8 each",rest:60,cue:"Smooth and stable."},
      {name:"Calf Raise",block:"Lower-Leg Capacity",sets:2,reps:"12",rest:45,cue:"Controlled range."},
      {name:"Dead Bug",block:"Core",sets:2,reps:"6 each",rest:45,cue:"Breathe and brace."}
    ]},
    "S-12 Beginner Foundation A":{label:"Foundation A — Squat, Push & Pull",duration:40,exercises:[
      {name:"Goblet Squat",block:"Learn the Pattern",sets:3,reps:"8",rest:75,cue:"Move through a comfortable range and keep the whole foot down."},
      {name:"Incline Push-up",block:"Upper Push",sets:3,reps:"6–10",rest:60,cue:"Use a height that keeps every rep controlled."},
      {name:"Single-Arm Dumbbell Row",block:"Upper Pull",sets:3,reps:"8 each",rest:60,cue:"Keep the torso quiet."},
      {name:"Glute Bridge",block:"Hip Extension",sets:3,reps:"10",rest:45,cue:"Finish with the glutes, not the lower back."},
      {name:"Dead Bug",block:"Core",sets:2,reps:"6 each",rest:45,cue:"Move slowly and keep the ribs down."}
    ]},
    "S-13 Beginner Foundation B":{label:"Foundation B — Hinge, Press & Single-Leg",duration:40,exercises:[
      {name:"Dumbbell Romanian Deadlift",block:"Learn the Hinge",sets:3,reps:"8",rest:75,cue:"Push the hips back and keep the weights close."},
      {name:"Dumbbell Floor Press",block:"Upper Push",sets:3,reps:"8–10",rest:60,cue:"Pause gently on the floor."},
      {name:"Reverse Lunge",block:"Single-Leg",sets:2,reps:"6 each",rest:60,cue:"Use support if needed."},
      {name:"Band Row",block:"Upper Pull",sets:3,reps:"10–12",rest:45,cue:"Finish with the shoulder blades."},
      {name:"Farmer Carry",block:"Carry",sets:3,reps:"30 seconds",rest:45,cue:"Walk tall and breathe."}
    ]},
    "S-14 Beginner Foundation C":{label:"Foundation C — Step, Press & Trunk",duration:40,exercises:[
      {name:"Step-up",block:"Single-Leg",sets:3,reps:"8 each",rest:60,cue:"Choose a low, stable step."},
      {name:"Seated Dumbbell Press",block:"Upper Push",sets:3,reps:"8",rest:60,cue:"Keep the ribs stacked."},
      {name:"Hip Thrust",block:"Hip Extension",sets:3,reps:"10",rest:60,cue:"Pause at the top without overextending."},
      {name:"Neutral-Grip Lat Pulldown",block:"Upper Pull",sets:3,reps:"10",rest:60,cue:"Drive the elbows down."},
      {name:"Plank",block:"Core",sets:3,reps:"20–30 seconds",rest:45,cue:"Create full-body tension."}
    ]}
  };

  if(typeof getWorkoutTemplate==="function"){
    const baseGetWorkoutTemplate=getWorkoutTemplate;
    getWorkoutTemplate=function(name,rotationWeek){
      const custom=CUSTOM_TEMPLATES[text(name)];
      return custom?clone(custom):baseGetWorkoutTemplate(name,rotationWeek);
    };
  }
  if(typeof getWorkoutLabel==="function"){
    const baseGetWorkoutLabel=getWorkoutLabel;
    getWorkoutLabel=function(name,rotationWeek){return CUSTOM_TEMPLATES[text(name)]?.label||baseGetWorkoutLabel(name,rotationWeek);};
  }
  if(typeof allWorkoutNames==="function"){
    const baseAllWorkoutNames=allWorkoutNames;
    allWorkoutNames=function(){return [...new Set([...baseAllWorkoutNames(),...Object.keys(CUSTOM_TEMPLATES)])];};
  }

  function availableDays(block){
    const explicit=block?.availableDays||data.athleteProfile?.availability?.normalDays;
    const days=Array.isArray(explicit)&&explicit.length?explicit:(typeof bellNormalTrainingDays==="function"?bellNormalTrainingDays():WEEKDAYS.slice(0,5));
    return WEEKDAYS.filter(day=>days.includes(day));
  }

  function distribute(entries,block){
    const days=availableDays(block);
    if(!days.length)return [];
    return entries.map((entry,index)=>({...entry,day:days[index%days.length],status:"planned",done:false}));
  }

  function postEventPlan(block,week,type){
    const easy=(label,duration,detail="Conversational movement that restores circulation without adding fatigue")=>({mission:"R-1 Recovery Run",customLabel:label,detail,prescribedDuration:duration,eventRole:"recovery",optional:false});
    if(type==="post_meet"){
      const sessions=week===1?[
        {mission:"S-9 Post-Meet Restore A",customLabel:"Post-Meet Restore A",detail:"Low-soreness full-body training. No competition singles, grinders, or back-off volume.",prescribedDuration:45,eventRole:"recovery_strength"},
        easy("Easy Aerobic Restore",25),
        {mission:"S-10 Post-Meet Restore B",customLabel:"Post-Meet Restore B",detail:"Light technique and general strength. Finish fresher than you started.",prescribedDuration:45,eventRole:"recovery_strength"}
      ]:[
        {mission:"S-9 Post-Meet Restore A",customLabel:"Re-Entry Strength A",detail:"Moderate full-body work at RPE 6 with no testing.",prescribedDuration:50,eventRole:"recovery_strength"},
        easy("Easy Aerobic Restore",30),
        {mission:"S-10 Post-Meet Restore B",customLabel:"Re-Entry Strength B",detail:"Technique-led strength before the next formal build.",prescribedDuration:50,eventRole:"recovery_strength"}
      ];
      return distribute(sessions,block);
    }
    if(type==="post_show"){
      const sessions=[
        {mission:"B-9 Post-Show Restore A",customLabel:"Post-Show Restore A",detail:"Low-fatigue full-body training with no failure or soreness chase.",prescribedDuration:week===1?40:45,eventRole:"recovery_hypertrophy"},
        easy("Recovery Walk or Easy Cardio",week===1?20:25),
        {mission:"B-10 Post-Show Restore B",customLabel:"Post-Show Restore B",detail:"Restore training rhythm, joint comfort, and appetite without high fatigue.",prescribedDuration:week===1?40:45,eventRole:"recovery_hypertrophy"}
      ];
      if(week>=3)sessions.push({mission:"B-9 Post-Show Restore A",customLabel:"Post-Show Rebuild C",detail:"A third low-fatigue exposure as recovery stabilizes.",prescribedDuration:45,eventRole:"recovery_hypertrophy"});
      return distribute(sessions,block);
    }
    if(type==="post_race"){
      const sessions=week===1?[
        easy("Recovery Walk / Easy Spin",25,"Walking or low-impact movement only. No pace target."),
        easy("Easy Return Run",30,"Very easy running only if soreness and gait are normal."),
        {mission:"S-11 Runner Recovery Strength",customLabel:"Runner Recovery Strength",detail:"Low-volume tissue-capacity and trunk work.",prescribedDuration:35,eventRole:"recovery_strength"}
      ]:[
        easy("Easy Aerobic Run",35,"Conversational effort with no quality work."),
        {mission:"S-11 Runner Recovery Strength",customLabel:"Runner Recovery Strength",detail:"Low-volume strength before normal training resumes.",prescribedDuration:40,eventRole:"recovery_strength"},
        easy("Easy Aerobic Run + Strides",40,"Easy running with four relaxed strides only if fully recovered.")
      ];
      return distribute(sessions,block);
    }
    return null;
  }

  function ensureRunningEventSlots(plan,block){
    const days=availableDays(block);
    if(!days.length)return plan;
    const roleText=item=>lower([item.eventRole,item.enduranceRole,item.sessionRole,item.customLabel,item.label].filter(Boolean).join(" "));
    const isEngine=item=>{
      const roles=lower([item.eventRole,item.enduranceRole,item.sessionRole].filter(Boolean).join(" "));
      if(/runner_strength|strength_support|recovery_strength/.test(roles))return false;
      if(/quality_run|easy_run|long_run|race_rehearsal|event_quality|event_easy|event_long|event_rehearsal/.test(roles))return true;
      return /^R-/.test(text(item.mission))||/\beasy run\b|aerobic|tempo|interval|rehearsal|quality|long run/.test(roleText(item));
    };
    const strength=plan.filter(item=>!isEngine(item));
    const engine=plan.filter(isEngine);
    const pick=(predicate,fallback,used=[])=>clone(engine.find(item=>predicate(item)&&!used.includes(item))||fallback);
    const strengthFallback={mission:"S-1 Upper Strength",customLabel:"Runner Strength",detail:"Low-fatigue strength support for running durability.",prescribedDuration:Math.min(45,Number(block.sessionMinutes)||60)};
    const firstStrength=clone(strength[0]||strengthFallback),secondStrength=clone(strength[1]||{...strengthFallback,mission:"S-2 Lower Strength",customLabel:"Runner Strength B"});
    [firstStrength,secondStrength].forEach(item=>{item.eventRole="runner_strength";item.enduranceRole="runner_strength";item.sessionRole="runner_strength";});
    const qualitySource=engine.find(item=>/quality_run|event_quality|quality|tempo|interval/.test(roleText(item)));
    const longSource=engine.find(item=>/race_rehearsal|long_run|event_long|long run|rehearsal/.test(roleText(item)));
    const easySources=engine.filter(item=>/easy_run|event_easy|easy aerobic|easy run/.test(roleText(item))&&item!==qualitySource&&item!==longSource);
    const quality=clone(qualitySource||{mission:"R-4 Intervals",customLabel:"Running Quality",detail:"Phase-appropriate quality running with repeatable mechanics.",prescribedDuration:45});
    const long=clone(longSource||{mission:"R-5 Long Run",customLabel:"Progressive Long Run",detail:"Easy long-run durability with stable mechanics.",prescribedDuration:60});
    const easyA=clone(easySources[0]||{mission:"R-2 Easy Run",customLabel:"Easy Aerobic Run",detail:"Conversational running that builds volume and restores mechanics.",prescribedDuration:40});
    const easyB=clone(easySources[1]||{...easyA,customLabel:"Easy Run + Strides",detail:"Conversational running followed by relaxed strides."});
    let placements;
    if(days.length>=6)placements=[firstStrength,quality,easyA,secondStrength,easyB,long];
    else if(days.length===5)placements=[firstStrength,quality,easyA,secondStrength,long];
    else if(days.length===4)placements=[firstStrength,quality,easyA,long];
    else if(days.length===3)placements=[firstStrength,quality,long];
    else if(days.length===2)placements=[quality,long];
    else placements=[long];
    placements.forEach((item,index)=>{item.day=days[Math.min(index,days.length-1)];item.status=item.status||"planned";item.done=Boolean(item.done);});
    return placements;
  }

  function runningProgression(plan,block,week,phase){
    plan=ensureRunningEventSlots(plan,block);
    const total=Math.max(2,Number(block.lengthWeeks)||12),ratio=clamp(week/total,0,1),event=lower(block.mission?.eventType);
    const eventLabel=String(block.mission?.eventType||"Running Event").replace(/\s+Race$/i,"");
    const isHalf=/half marathon/.test(event),isMarathon=/marathon/.test(event),is10=/10k/.test(event);
    const maxSession=Math.max(30,Number(block.sessionMinutes)||60);
    const quality=plan.find(item=>item.eventRole==="quality"||item.enduranceRole==="quality"||/quality|tempo|interval/.test(lower(item.customLabel)));
    const long=plan.find(item=>item.eventRole==="long"||item.enduranceRole==="long"||/long run|rehearsal/.test(lower(item.customLabel)));
    const easy=plan.filter(item=>item.eventRole==="easy"||item.enduranceRole==="easy"||/easy aerobic|easy run/.test(lower(item.customLabel)));
    if(quality){
      quality.enduranceRole="quality_run";quality.eventRole="quality";quality.sessionRole="event_quality";
      if(phase.id==="general"){quality.customLabel=`${eventLabel} Running Economy + Hills`;quality.detail=`${eventLabel} preparation: easy running, relaxed strides, and short controlled hills. Build mechanics before sustained intensity.`;quality.prescribedDuration=Math.min(maxSession,40);}
      else if(phase.id==="build"){quality.customLabel=`${eventLabel} Threshold Development`;quality.detail=`${eventLabel} threshold work with equal-quality repetitions. Add duration before pace.`;quality.prescribedDuration=Math.min(maxSession,45+Math.round(ratio*10));}
      else if(phase.id==="specific"){quality.customLabel=isHalf||isMarathon?`${eventLabel} Goal-Pace Tempo Blocks`:`${eventLabel} Goal-Pace Intervals`;quality.detail=`${eventLabel} goal-pace work with enough recovery to preserve mechanics and finish under control.`;quality.prescribedDuration=Math.min(maxSession,50+Math.round(ratio*10));}
      else if(phase.id==="competition"){quality.customLabel=`${eventLabel} Race-Pace Rehearsal`;quality.detail=`Rehearse ${eventLabel} pacing, shoes, warm-up, and fueling without racing the workout.`;quality.prescribedDuration=Math.min(maxSession,50);}
      else {quality.customLabel=`${eventLabel} Race Sharpening`;quality.detail=`Brief ${eventLabel} pace work with full recovery. Finish fresh.`;quality.prescribedDuration=Math.min(maxSession,30);}
    }
    if(long){
      const start=isMarathon?70:isHalf?55:is10?45:40;
      const target=isMarathon?Math.min(150,maxSession):isHalf?Math.min(110,maxSession):is10?Math.min(75,maxSession):Math.min(65,maxSession);
      const progressed=Math.round(start+(target-start)*Math.min(1,ratio*1.15));
      long.enduranceRole=phase.id==="competition"?"race_rehearsal":"long_run";long.eventRole="long";long.sessionRole=phase.id==="competition"?"event_rehearsal":"event_long";
      long.customLabel=phase.id==="competition"?`${eventLabel} Race Rehearsal`:phase.id==="taper"||phase.id==="event_week"?`${eventLabel} Reduced Long Run`:`${eventLabel} Progressive Long Run`;
      long.detail=phase.id==="competition"?`Controlled ${eventLabel} rehearsal with practiced pacing, fueling, equipment, and finish strategy.`:phase.id==="taper"||phase.id==="event_week"?`Reduced easy duration with only a brief ${eventLabel} pace reminder.`:`${eventLabel} long-run durability. Practice fueling and finish with stable mechanics, not a race effort.`;
      long.prescribedDuration=phase.id==="taper"||phase.id==="event_week"?Math.min(maxSession,Math.max(30,Math.round(progressed*.55))):Math.min(maxSession,progressed);
    }
    easy.forEach((item,index)=>{item.enduranceRole="easy_run";item.eventRole="easy";item.sessionRole="event_easy";item.customLabel=index?"Easy Run + Strides":"Easy Aerobic Run";item.detail=index?"Conversational running followed by four to six relaxed strides.":"Conversational running that builds volume and restores mechanics.";item.prescribedDuration=Math.min(maxSession,phase.id==="taper"||phase.id==="event_week"?25:35+Math.round(ratio*10));});
    return plan;
  }

  function annotatePowerlifting(plan,block,week,phase){
    const objective=lower(block.mission?.developmentGoal||block.secondaryGoal);
    const labelFor=(role)=>{
      if(block.mission?.path==="event"){
        const suffix={general:"Volume",build:"Strength Build",specific:"Heavy Specificity",competition:"Competition Single",recovery:"Technique Deload",taper:"Opener Practice",event_week:"Primer"}[phase.id]||phase.label;
        return `${role} — ${suffix}`;
      }
      if(/build muscle/.test(objective))return `${role} — Weak-Point Hypertrophy`;
      if(/increase strength/.test(objective)){
        const wave=((week-1)%4)+1;return `${role} — ${["Base Volume","Strength Build","Intensification","Technique Deload"][wave-1]}`;
      }
      return `${role} — ${phase.label}`;
    };
    plan.forEach(item=>{
      const mission=text(item.mission);
      if(mission.startsWith("PL-1")){item.exerciseRole="competition_squat";item.eventRole="primary_lift";item.customLabel=labelFor("Competition Squat");}
      else if(mission.startsWith("PL-2")){item.exerciseRole="competition_bench";item.eventRole="primary_lift";item.customLabel=labelFor("Competition Bench");}
      else if(mission.startsWith("PL-3")){item.exerciseRole="competition_deadlift";item.eventRole="primary_lift";item.customLabel=labelFor("Competition Deadlift");}
      else if(mission.startsWith("PL-4")){item.exerciseRole="secondary_competition_lifts";item.eventRole="secondary_lift";item.customLabel=/build muscle/.test(objective)?"Upper Back, Triceps & Technique":`Secondary Squat + Bench — ${phase.label}`;}
      if(item.exerciseRole)item.detail=`${item.customLabel}. ${phase.objective}`;
    });
    return plan;
  }

  function annotatePhysique(plan,block,week,phase){
    const cycle=Math.floor((week-1)/4)%3;
    const focus=["Balanced Symmetry","Delts & Arms Emphasis","Back & Glute Emphasis"][cycle];
    const event=block.mission?.path==="event";
    plan.forEach(item=>{
      if(/^B-/.test(text(item.mission))){
        const lowerBody=/^B-(2|4)/.test(text(item.mission))||/legs|posterior|glute|hamstring|quad/.test(lower(item.customLabel));
        item.physiqueRole=lowerBody?"resistance_lower":"resistance_upper";item.weakPointEmphasis=focus;
        const base=(typeof getWorkoutLabel==="function"?getWorkoutLabel(item.mission):item.customLabel||item.mission).replace(/^Bell Hypertrophy\s*[•-]?\s*/i,"");
        const peakWeek=event&&(phase.id==="taper"||phase.id==="event_week");
        item.customLabel=`${base} — ${peakWeek?"Peak Week Fatigue Reduction":event?phase.label:focus}`;
        item.detail=peakWeek
          ?`Peak-week fatigue reduction: brief low-soreness resistance work for ${focus.toLowerCase()}. Avoid failure, grinders, and soreness-producing volume.`
          :`${event?"Preserve muscle and symmetry":"Progress productive hypertrophy"} with ${focus.toLowerCase()}. Use phase-appropriate volume and avoid unnecessary failure.`;
      }
      if(/^R-/.test(text(item.mission))){
        item.physiqueRole="cardio";item.eventRole=item.eventRole||"cardio";
        const total=Math.max(2,Number(block.lengthWeeks)||12),ratio=week/total,max=Math.max(20,Number(block.sessionMinutes)||60);
        item.prescribedDuration=Math.min(max,phase.id==="taper"||phase.id==="event_week"?20:Math.round(22+ratio*18));
        item.customLabel=event?"Contest Prep Cardio":"Low-Impact Aerobic Support";
        item.detail="Low-impact, recoverable aerobic work. Increase duration gradually without compromising resistance training.";
      }
    });
    return plan;
  }

  function beginnerProgression(plan,block,week,phase){
    if(lower(data.settings?.trainingExperience)!=="beginner")return plan;
    const strength=plan.filter(item=>!/^R-|^M-/.test(text(item.mission)));
    if(phase.id==="foundation"||week<=Math.min(12,Number(block.lengthWeeks)||12)){
      const missions=["S-12 Beginner Foundation A","S-13 Beginner Foundation B","S-14 Beginner Foundation C"];
      strength.forEach((item,index)=>{item.mission=missions[index%missions.length];item.customLabel=CUSTOM_TEMPLATES[item.mission].label;item.beginnerStage="movement_foundation";item.detail="Learn the movement patterns, finish every set with clean technique, and build consistency before load.";});
    }else{
      strength.forEach(item=>{item.beginnerStage=phase.id;item.detail=`${phase.objective} Progress only after the prescribed repetitions remain controlled and repeatable.`;});
    }
    return plan;
  }

  function applyCorrections(rawPlan,block,week){
    const phase=phaseFor(block,week),transition=transitionType(block);
    let plan=clone(rawPlan||[]);
    if(transition){
      const recovery=postEventPlan(block,week,transition);
      if(recovery?.length)plan=recovery;
    }else{
      const family=blockFamily(block);
      if(family==="running"&&block.mission?.path==="event")plan=runningProgression(plan,block,week,phase);
      if(family==="strength_competition"||family==="powerlifting")plan=annotatePowerlifting(plan,block,week,phase);
      if(family==="physique")plan=annotatePhysique(plan,block,week,phase);
      plan=beginnerProgression(plan,block,week,phase);
    }
    return plan.map((item,index)=>({
      ...item,
      id:item.id||`bp1390-w${week}-${index}-${lower(item.day||"day").replace(/\s+/g,"-")}`,
      weekNumber:week,
      formalWeekId:`${block.generatedAt||block.startDate||"block"}-w${week}`,
      longitudinalPhaseId:phase.id,
      longitudinalPhase:phase.label,
      longitudinalObjective:phase.objective,
      planSchemaVersion:VERSION,
      status:item.status||"planned",
      done:Boolean(item.done)
    }));
  }

  /* Running event plans need enough exposure slots to retain quality and long work,
     even when several sessions share four available days. */
  if(typeof bellMissionAlignedExposureTargets==="function"){
    const baseMissionTargets=bellMissionAlignedExposureTargets;
    bellMissionAlignedExposureTargets=function(base,block,remainingDays){
      const result=baseMissionTargets(base,block,remainingDays),n=remainingDays?.length||0;
      if(block?.mission?.path==="event"&&blockFamily(block)==="running"){
        const source=result||base||{},strengthTarget=Number(source.strength)||2,engineTarget=Number(source.engine)||4;
        if(n>=5)return {strength:Math.min(2,strengthTarget),engine:Math.min(4,engineTarget)};
        if(n===4)return {strength:Math.min(2,strengthTarget),engine:Math.min(3,engineTarget)};
        if(n===3)return {strength:1,engine:Math.min(2,engineTarget)};
        if(n===2)return {strength:0,engine:Math.min(2,engineTarget)};
        if(n===1)return {strength:0,engine:1};
      }
      return result;
    };
  }

  const baseBuildCurrentWeekPlan=typeof buildCurrentWeekPlan==="function"?buildCurrentWeekPlan:null;
  function generateWeek(block,week){
    if(!baseBuildCurrentWeekPlan)return [];
    const savedBlockRef=data.trainingBlock,savedPlan=clone(data.plan),savedRotation=data.settings?.rotationWeek,savedPhase=data.settings?.phase,savedSelected=data.dayNavigation?.selectedDate;
    try{
      data.trainingBlock={...clone(block),enabled:true,currentWeek:week,weeks:clone(block.weeks||[])};
      window.__bell1390GeneratingWeek=true;
      baseBuildCurrentWeekPlan();
      return applyCorrections(data.plan||[],data.trainingBlock,week);
    }finally{
      window.__bell1390GeneratingWeek=false;
      data.trainingBlock=savedBlockRef;data.plan=savedPlan;
      if(data.settings){data.settings.rotationWeek=savedRotation;data.settings.phase=savedPhase;}
      if(data.dayNavigation)data.dayNavigation.selectedDate=savedSelected;
    }
  }

  function weekStatus(block,week){
    const current=Number(block.currentWeek||1);
    if(block===data.trainingBlock&&block.enabled&&week===current)return "active";
    if(week<current)return "complete";
    return "planned";
  }

  function mergeCompletion(oldPlan,newPlan){
    const old=Array.isArray(oldPlan)?oldPlan:[];
    return newPlan.map((item,index)=>{
      const match=old.find(candidate=>candidate.id===item.id)||old.find(candidate=>candidate.day===item.day&&candidate.mission===item.mission&&candidate.eventRole===item.eventRole)||old[index];
      if(match&&(match.done||match.completed||match.status==="completed"))return {...item,done:true,completed:true,status:"completed",completedAt:match.completedAt};
      return item;
    });
  }

  function prepareBlock(block,options={}){
    if(!block)return block;
    const total=Math.max(1,Number(block.lengthWeeks)||12),prior=Array.isArray(block.weeks)?block.weeks:[],signature=configSignature(block),force=Boolean(options.force);
    const entries=[];
    for(let week=1;week<=total;week++){
      const existing=prior.find(item=>Number(item.week)===week),phase=phaseFor(block,week),status=weekStatus(block,week);
      const formalCount=Array.isArray(existing?.plan)?existing.plan.filter(item=>!/^M-/i.test(text(item?.mission))).length:0;
      const reusable=formalCount>0&&existing.schemaVersion===VERSION&&existing.configSignature===signature&&!force;
      const generated=reusable?clone(existing.plan):generateWeek(block,week);
      const plan=mergeCompletion(existing?.plan,generated);
      const startDate=weekStart(block,week),endDate=typeof addLocalDays==="function"?addLocalDays(startDate,6):(()=>{const d=new Date(`${startDate}T12:00:00`);d.setDate(d.getDate()+6);return d.toISOString().slice(0,10);})();
      entries.push({
        ...(existing||{}),week,startDate,endDate,status,phaseId:phase.id,phase:phase.label,objective:phase.objective,
        schemaVersion:VERSION,configSignature:signature,generatedAt:existing?.generatedAt||new Date().toISOString(),plan
      });
    }
    block.weeks=entries;block.formalWeekCount=entries.length;block.planSchemaVersion=VERSION;block.planBuiltAt=block.planBuiltAt||new Date().toISOString();
    return block;
  }

  function syncCurrentWeek(block=data.trainingBlock){
    if(!block?.enabled||window.__bell1390GeneratingWeek)return;
    const week=Number(block.currentWeek||1),phase=phaseFor(block,week),signature=configSignature(block);
    if(!Array.isArray(block.weeks)||block.weeks.length!==Number(block.lengthWeeks)||block.planSchemaVersion!==VERSION)prepareBlock(block);
    const entry=block.weeks.find(item=>Number(item.week)===week);
    if(!entry)return;
    entry.plan=mergeCompletion(entry.plan,applyCorrections(data.plan||[],block,week));
    entry.status="active";entry.phaseId=phase.id;entry.phase=phase.label;entry.objective=phase.objective;entry.schemaVersion=VERSION;entry.configSignature=signature;entry.updatedAt=new Date().toISOString();
    data.plan=clone(entry.plan);
  }

  if(baseBuildCurrentWeekPlan){
    buildCurrentWeekPlan=function(){
      const result=baseBuildCurrentWeekPlan.apply(this,arguments);
      if(data.trainingBlock?.enabled&&!window.__bell1390GeneratingWeek){
        data.plan=applyCorrections(data.plan||[],data.trainingBlock,Number(data.trainingBlock.currentWeek||1));
        syncCurrentWeek(data.trainingBlock);
      }
      return result;
    };
  }

  bpGenerateWeekForBlock=function(block,week){return generateWeek(block,Number(week)||1);};
  bpPrepareBlockPlan=function(block){return prepareBlock(block);};
  bpLoadActiveWeekFromPlan=function(){
    const block=data.trainingBlock;if(!block?.enabled)return;
    prepareBlock(block);
    const week=Number(block.currentWeek||1),entry=block.weeks.find(item=>Number(item.week)===week);
    if(entry?.plan?.length)data.plan=clone(entry.plan);
    else buildCurrentWeekPlan();
  };
  bpPhaseForWeek=function(week,total){
    const block=(typeof bpResolvePlanBlock==="function"?bpResolvePlanBlock():data.trainingBlock)||{lengthWeeks:total||12};
    const phase=phaseFor({...block,lengthWeeks:Number(total)||block.lengthWeeks},Number(week)||1);
    return {name:phase.label,objective:phase.objective,id:phase.id};
  };

  if(typeof bpArchiveBlock==="function"){
    const baseArchiveBlock=bpArchiveBlock;
    bpArchiveBlock=function(block,reason){
      if(block?.mission?.path==="event"){
        data.settings=data.settings||{};
        data.settings.lastCompletedEvent={family:blockFamily(block),eventType:block.mission.eventType,eventName:block.mission.eventName,completedAt:new Date().toISOString()};
      }
      return baseArchiveBlock(block,reason);
    };
  }

  if(typeof completeWorkout==="function"){
    const baseCompleteWorkout=completeWorkout;
    completeWorkout=function(){
      const result=baseCompleteWorkout.apply(this,arguments);
      try{syncCurrentWeek(data.trainingBlock);if(typeof saveData==="function")saveData({render:false});}catch(error){console.warn("Bell 13.9.1 week sync after completion failed",error);}
      return result;
    };
  }

  function migrate(){
    const blocks=[data.trainingBlock,data.upcomingTrainingBlock].filter(Boolean);
    blocks.forEach(block=>{if(block.enabled||block.status==="scheduled")prepareBlock(block);});
    if(data.trainingBlock?.enabled){
      const current=data.trainingBlock.weeks?.find(item=>Number(item.week)===Number(data.trainingBlock.currentWeek||1));
      if(current?.plan?.length)data.plan=mergeCompletion(data.plan,current.plan);
    }
    data.settings=data.settings||{};data.settings.longitudinalEngineVersion=VERSION;
  }

  const api={version:VERSION,blockFamily,transitionType,phaseFor,prepareBlock,generateWeek,applyCorrections,syncCurrentWeek,customTemplates:CUSTOM_TEMPLATES};
  window.BellLongitudinal1390=api;

  document.addEventListener("DOMContentLoaded",()=>{
    try{migrate();if(typeof saveData==="function")saveData({render:false});if(typeof renderApp==="function")renderApp();}
    catch(error){console.error("Bell 13.9.1 longitudinal migration failed",error);}
  });
})();
