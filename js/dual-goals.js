"use strict";

const STRENGTH_GOALS = {
  "Powerlifting": { description:"Peak the squat, bench press, and deadlift while protecting recovery for heavy barbell work.", defaultStrengthDays:4, engineCap:2, recommendedModes:["General Conditioning","Cycling","Rowing","None / Recovery Only"], phaseNames:["Base Volume","Strength Development","Competition Specificity","Peak & Taper"] },
  "Olympic Lifting": { description:"Develop the snatch, clean & jerk, technical consistency, speed-strength, and mobility.", defaultStrengthDays:4, engineCap:3, recommendedModes:["Cycling","Rowing","General Conditioning","Sprint / Field"], phaseNames:["Technique Base","Volume & Positions","Intensity & Complexes","Peak & Taper"] },
  "Athlete": { description:"Build usable strength, speed, power, agility, and resilience for field, court, or ice performance.", defaultStrengthDays:4, engineCap:4, recommendedModes:["Sprint / Field","Running","Cycling","Rowing","Swimming"], phaseNames:["Movement Base","Strength & Power","Sport Specificity","Performance Peak"] },
  "Hybrid": { description:"Develop strength and endurance concurrently without allowing either quality to collapse.", defaultStrengthDays:4, engineCap:5, recommendedModes:["Running","Rowing","Cycling","Hiking / Rucking","Swimming"], phaseNames:["Concurrent Base","Capacity Build","Specific Development","Peak & Consolidate"] },
  "Bodybuilding": { description:"Maximize hypertrophy, symmetry, and weak-point development while using Engine work to support health, recovery, or fat loss.", defaultStrengthDays:5, engineCap:5, recommendedModes:["General Conditioning","Cycling","Walking","Rowing","None / Recovery Only"], phaseNames:["Volume Accumulation","Progressive Overload","Specialization","Deload & Review"] }
};

const ENGINE_GOALS = {
  "Running": [
    {id:"general-run",label:"General Aerobic Fitness",weeks:12,level:"support",description:"Build a durable aerobic base with easy running, controlled progression, and no race-time pressure."},
    {id:"run-fat-loss",label:"Aesthetics / Fat Loss",weeks:12,level:"support",description:"Use recoverable aerobic work and limited intervals to increase expenditure without compromising muscle or strength."},
    {id:"5k",label:"Complete a 5K",weeks:10,level:"event",description:"Progress from run/walk or easy mileage to confidently completing 3.1 miles."},
    {id:"5k-time",label:"Race a Faster 5K",weeks:12,level:"performance",description:"Build threshold speed, VO₂ work, and race-specific pacing for a goal 5K time.",target:"minutes"},
    {id:"10k",label:"Complete a 10K",weeks:12,level:"event",description:"Progress weekly volume and long runs toward a controlled 6.2-mile finish."},
    {id:"10k-time",label:"Race a Faster 10K",weeks:14,level:"performance",description:"Develop aerobic volume, threshold durability, and goal-pace intervals.",target:"minutes"},
    {id:"half",label:"Half Marathon",weeks:16,level:"performance",description:"Build long-run durability, fueling practice, threshold work, and a taper.",target:"minutes"},
    {id:"marathon",label:"Marathon",weeks:20,level:"specialist",description:"A high-volume event progression requiring Engine priority and reduced lower-body lifting fatigue.",target:"minutes"}
  ],
  "Rowing": [
    {id:"row-health",label:"General Rowing Fitness",weeks:10,level:"support",description:"Improve aerobic fitness and rowing technique with low joint impact."},
    {id:"row-fat-loss",label:"Aesthetics / Fat Loss",weeks:12,level:"support",description:"Build calorie-efficient conditioning while keeping leg fatigue manageable."},
    {id:"row-500",label:"500 m Sprint",weeks:8,level:"performance",description:"Develop power, start speed, and high-intensity tolerance.",target:"seconds"},
    {id:"row-2k",label:"2,000 m Time",weeks:10,level:"performance",description:"Progress stroke efficiency, threshold power, and race-pace intervals.",target:"minutes"},
    {id:"row-5k",label:"5,000 m Time",weeks:12,level:"performance",description:"Build aerobic power, pacing discipline, and sustained rowing strength.",target:"minutes"},
    {id:"row-endurance",label:"30–60 Minute Endurance",weeks:12,level:"event",description:"Extend steady rowing duration while maintaining efficient technique."}
  ],
  "Hiking / Rucking": [
    {id:"hike-fitness",label:"Weekend Hiking Fitness",weeks:10,level:"support",description:"Build time-on-feet, climbing tolerance, and lower-leg durability."},
    {id:"hike-event",label:"Long-Distance Hike",weeks:14,level:"event",description:"Progress duration, elevation, terrain, fueling, and pack familiarity."},
    {id:"backpacking",label:"Multi-Day Backpacking",weeks:16,level:"performance",description:"Build consecutive-day durability, loaded climbing, and recovery between days."},
    {id:"ruck-12",label:"12-Mile Ruck",weeks:12,level:"performance",description:"Progress load and pace toward a strong 12-mile effort without reckless mileage.",target:"minutes"},
    {id:"ruck-tactical",label:"Tactical / Selection Ruck",weeks:16,level:"specialist",description:"Develop loaded movement, feet and trunk durability, hills, and work capacity.",target:"minutes"},
    {id:"hunt",label:"Mountain Hunt Preparation",weeks:16,level:"performance",description:"Train steep terrain, pack carriage, descents, and repeated long days."}
  ],
  "Cycling": [
    {id:"cycle-health",label:"General Cycling Fitness",weeks:10,level:"support",description:"Build aerobic health and leg endurance with low-impact riding."},
    {id:"cycle-fat-loss",label:"Aesthetics / Fat Loss",weeks:12,level:"support",description:"Use Zone 2 volume and brief intervals without excessive eccentric fatigue."},
    {id:"cycle-20",label:"20 km Time Trial",weeks:10,level:"performance",description:"Develop threshold power, pacing, and aerodynamic durability.",target:"minutes"},
    {id:"cycle-40",label:"40 km Time Trial",weeks:12,level:"performance",description:"Build sustained power and race-specific pacing.",target:"minutes"},
    {id:"metric-century",label:"Metric Century (100 km)",weeks:16,level:"event",description:"Progress long rides, fueling, climbing, and saddle durability."},
    {id:"century",label:"Century Ride (100 mi)",weeks:20,level:"specialist",description:"High-volume endurance progression with long rides, fueling practice, and taper."},
    {id:"mtb",label:"Mountain Bike Event",weeks:14,level:"performance",description:"Blend aerobic endurance, repeated climbs, technical bursts, and grip/trunk resilience."}
  ],
  "Sprint / Field": [
    {id:"sprint-speed",label:"Acceleration & Top Speed",weeks:10,level:"performance",description:"Progress mechanics, acceleration, max velocity, and full-rest quality sprinting."},
    {id:"repeat-sprint",label:"Repeat Sprint Ability",weeks:10,level:"performance",description:"Develop the ability to reproduce high-speed efforts with incomplete recovery."},
    {id:"hockey",label:"Hockey Conditioning",weeks:12,level:"sport",description:"Train repeat shifts, lateral power, alactic speed, and aerobic recovery."},
    {id:"lacrosse",label:"Lacrosse Conditioning",weeks:12,level:"sport",description:"Develop acceleration, change of direction, repeat efforts, and field endurance."},
    {id:"football",label:"Football Conditioning",weeks:10,level:"sport",description:"Build position-relevant speed, repeat power, and work-to-rest tolerance."},
    {id:"soccer",label:"Soccer Conditioning",weeks:14,level:"sport",description:"Combine aerobic volume, high-speed running, repeat sprints, and change of direction."},
    {id:"tactical",label:"Tactical Work Capacity",weeks:12,level:"performance",description:"Develop short hard efforts, carries, stairs, and recoverability under load."}
  ],
  "Swimming": [
    {id:"swim-technique",label:"Technique & General Fitness",weeks:10,level:"support",description:"Improve breathing, stroke efficiency, and continuous easy swimming."},
    {id:"swim-sprint",label:"50–100 m Sprint",weeks:8,level:"performance",description:"Build starts, speed, power, and high-quality short repeats.",target:"seconds"},
    {id:"swim-500",label:"500 m / 500 yd Time",weeks:10,level:"performance",description:"Progress pacing, threshold sets, and stroke efficiency.",target:"minutes"},
    {id:"swim-mile",label:"1-Mile Swim",weeks:14,level:"event",description:"Build continuous swimming durability, open-water skills where appropriate, and fueling confidence.",target:"minutes"},
    {id:"tri-swim",label:"Triathlon Swim Leg",weeks:14,level:"performance",description:"Develop efficient sustained swimming and transitions while coordinating other training."},
    {id:"recovery-swim",label:"Recovery / Low-Impact Conditioning",weeks:8,level:"support",description:"Use easy swimming to support recovery, mobility, and cardiovascular health."}
  ],
  "General Conditioning": [
    {id:"health",label:"Heart Health & Longevity",weeks:12,level:"support",description:"Meet progressive aerobic-health targets through flexible low-impact modalities."},
    {id:"aesthetics",label:"Aesthetics / Fat Loss",weeks:12,level:"support",description:"Progress weekly caloric expenditure while protecting strength and muscle retention."},
    {id:"work-capacity",label:"General Work Capacity",weeks:12,level:"performance",description:"Build the ability to sustain and repeat mixed physical efforts."},
    {id:"recovery",label:"Recovery & Base Building",weeks:8,level:"support",description:"Easy Zone 2, walking, and circulation work to improve recovery between strength sessions."},
    {id:"vo2",label:"VO₂ Max Development",weeks:10,level:"performance",description:"Use a progressive mix of aerobic base and carefully dosed high-intensity intervals."}
  ],
  "None / Recovery Only": [
    {id:"none",label:"No Formal Engine Goal",weeks:12,level:"none",description:"Prioritize Strength. Engine work is limited to walking, mobility, and optional recovery sessions."},
    {id:"recovery-only",label:"Recovery Cardio Only",weeks:12,level:"support",description:"Use 1–2 very easy sessions to support health and recovery without creating training interference."}
  ]
};

function dualGoalDefaults(){ return {strengthGoal:"Hybrid",engineMode:"Running",engineGoal:"general-run",trainingCoordination:"Coach Decides",targetValue:"",engineSessions:3}; }
function normalizeDualGoals(){ data.trainingBlock.dualGoals={...dualGoalDefaults(),...(data.trainingBlock.dualGoals||{})}; }
normalizeDualGoals();

function engineGoalProfile(mode=data.trainingBlock.dualGoals.engineMode,id=data.trainingBlock.dualGoals.engineGoal){ return (ENGINE_GOALS[mode]||[]).find(g=>g.id===id) || (ENGINE_GOALS[mode]||[])[0] || ENGINE_GOALS["None / Recovery Only"][0]; }
function strengthGoalProfile(goal=data.trainingBlock.dualGoals.strengthGoal){ return STRENGTH_GOALS[goal] || STRENGTH_GOALS.Hybrid; }
function compatibilityInfo(strength, engineMode, engineGoal){
  const s=STRENGTH_GOALS[strength], e=engineGoalProfile(engineMode,engineGoal); let status="Excellent match", cls="good"; let note="These goals can progress concurrently with normal readiness-based adjustments.";
  if(strength==="Powerlifting" && ["specialist","performance"].includes(e.level)){status="High interference risk";cls="warning";note="Powerlifting remains primary. Hard Engine work is capped, lower-body sessions are separated, and two-a-days are discouraged.";}
  if(strength==="Bodybuilding" && ["specialist"].includes(e.level)){status="Competing priorities";cls="warning";note="This event goal will reduce hypertrophy volume and may slow physique progress. Choose Aesthetics / Fat Loss or general fitness for a physique-first plan.";}
  if(strength==="Hybrid" && ["performance","event","specialist"].includes(e.level)){status="Bell Performance flagship match";cls="good";note="Strength volume is maintained while Engine specificity increases toward the event.";}
  if(strength==="Athlete" && e.level==="sport"){status="Sport-specific match";cls="good";note="Strength, power, speed, and conditioning are coordinated around sport demands.";}
  if(e.level==="none"){status="Strength-priority plan";cls="neutral";note="No formal Engine progression. Walking, mobility, and optional recovery work remain available.";}
  return {status,cls,note};
}

function updateDualGoalBuilder(){
  const strength=document.getElementById("strengthGoal")?.value||"Hybrid"; const p=STRENGTH_GOALS[strength];
  const desc=document.getElementById("strengthGoalDescription"); if(desc)desc.textContent=p.description;
  const strengthDays=document.getElementById("blockStrengthDays"); if(strengthDays && !strengthDays.dataset.touched) strengthDays.value=String(p.defaultStrengthDays);
  const specific=document.getElementById("strengthSpecificFields");
  if(specific) specific.innerHTML = strength==="Bodybuilding" ? '<div class="row"><div><label>Physique phase</label><select id="dualPhysiquePhase"><option>Lean Gain</option><option selected>Recomposition</option><option>Cut</option></select></div><div><label>Weak-point emphasis</label><select id="dualBodybuildingFocus"><option>Balanced</option><option>Shoulders & Arms</option><option>Chest & Back</option><option>Legs</option><option>Glutes & Hamstrings</option></select></div></div>' : strength==="Athlete" ? '<label>Sport emphasis</label><select id="dualSport"><option>General Athlete</option><option>Hockey</option><option>Lacrosse</option><option>Football</option><option>Soccer</option><option>Baseball</option><option>Basketball</option></select>' : strength==="Olympic Lifting" ? '<label>Technical emphasis</label><select id="dualOlympicFocus"><option>Balanced Snatch + Clean & Jerk</option><option>Snatch Priority</option><option>Clean & Jerk Priority</option></select>' : '';
  populateEngineGoals(true);
}

function populateEngineGoals(preserve=false){
  const mode=document.getElementById("engineMode")?.value||"Running", select=document.getElementById("engineGoal"); if(!select)return;
  const old=preserve?select.value:data.trainingBlock.dualGoals.engineGoal; select.innerHTML=(ENGINE_GOALS[mode]||[]).map(g=>`<option value="${g.id}">${g.label}</option>`).join("");
  if([...select.options].some(o=>o.value===old))select.value=old; updateEngineGoalDetails();
}
function updateEngineGoalDetails(){
  const strength=document.getElementById("strengthGoal")?.value||"Hybrid", mode=document.getElementById("engineMode")?.value||"Running", id=document.getElementById("engineGoal")?.value; const e=engineGoalProfile(mode,id);
  const desc=document.getElementById("engineGoalDescription"); if(desc)desc.textContent=e.description;
  const target=document.getElementById("engineTargetFields"); if(target)target.innerHTML=e.target?`<label>Goal ${e.target}</label><input id="engineTargetValue" type="number" min="1" step="0.1" placeholder="Optional">`:'';
  const info=compatibilityInfo(strength,mode,id), box=document.getElementById("goalCompatibilityMessage"); if(box){box.className=`compatibility-callout ${info.cls}`;box.innerHTML=`<strong>${info.status}</strong><span>${info.note}</span>`;}
  const hint=document.getElementById("goalBuilderHint"); if(hint)hint.textContent=`Recommended starting block: ${e.weeks} weeks. Weekly volume progresses through base, build, specific preparation, and taper/review phases.`;
  applyHybridScheduleRecommendation();
}

function applyHybridScheduleRecommendation(){
  const strength=document.getElementById("strengthGoal")?.value||"Hybrid";
  const mode=document.getElementById("engineMode")?.value||"Running";
  const goal=document.getElementById("engineGoal")?.value||"";
  const days=Number(document.getElementById("blockTrainingDays")?.value)||5;
  const coord=document.getElementById("trainingCoordination")?.value||"Coach Decides";
  const strengthDays=document.getElementById("blockStrengthDays");
  const engineDays=document.getElementById("blockRunDays");
  const isGeneralHybrid=strength==="Hybrid"&&mode==="General Conditioning"&&goal==="work-capacity"&&coord==="Coach Decides";
  if(!isGeneralHybrid)return;
  const split={3:[3,1],4:[4,1],5:[4,2],6:[4,3],7:[4,3]}[days]||[4,2];
  if(strengthDays&&!strengthDays.dataset.touched)strengthDays.value=String(split[0]);
  if(engineDays&&!engineDays.dataset.touched)engineDays.value=String(split[1]);
  const box=document.getElementById("goalCompatibilityMessage");
  if(box&&days===6){box.className="compatibility-callout good";box.innerHTML="<strong>Six-day hybrid structure</strong><span>4 Strength exposures + 3 Engine exposures across 6 days. One shorter Strength session is blended with easy aerobic work, and one full recovery day remains.</span>";}
}

function updateGoalBuilderFields(){ updateDualGoalBuilder(); }

function dualBlockPhase(){ const b=data.trainingBlock,w=blockWeek(),t=b.lengthWeeks||12,s=strengthGoalProfile(),names=s.phaseNames;if(w===t)return names[3]; const r=w/t;if(w%4===0)return"Recovery & Absorption";if(r<=.3)return names[0];if(r<=.7)return names[1];return names[2]; }
function blockPhase(){ return dualBlockPhase(); }

function engineWeekPrescription(kind){
  const b=data.trainingBlock,e=engineGoalProfile(),w=blockWeek(),t=b.lengthWeeks||12,r=Math.min(1,w/Math.max(1,t-2)),recovery=w%4===0&&w!==t, taper=w>=t-1;
  const mode=b.dualGoals.engineMode; const baseDur=Math.round((25+r*25)*(recovery?.7:1)*(taper?.65:1));
  const modality={"Running":"Run","Rowing":"Row","Hiking / Rucking":"Hike / Ruck","Cycling":"Ride","Sprint / Field":"Speed Session","Swimming":"Swim","General Conditioning":"Conditioning","None / Recovery Only":"Recovery Walk"}[mode]||"Engine";
  if(e.level==="none") return {label:"Optional Recovery Walk",detail:"20–30 minutes easy plus mobility",duration:25,intensity:"Recovery"};
  if(kind==="easy")return{label:`Easy ${modality}`,detail:`${baseDur} min Zone 2 / conversational effort`,duration:baseDur,intensity:"Easy"};
  if(kind==="quality"){
    if(mode==="Sprint / Field")return{label:e.label,detail:`${recovery?4:6+Math.round(r*3)} quality efforts with full or sport-specific recovery`,duration:35,intensity:"High quality"};
    return{label:`${modality} Quality`,detail:recovery?"Short controlled technique intervals; finish fresh":taper?"Goal-specific sharpening; low total volume":`${4+Math.round(r*4)} repeats at threshold or goal-specific effort`,duration:Math.round(35+r*12),intensity:"Quality"};
  }
  const longDuration=Math.round((40+r*(e.level==="specialist"?80:45))*(recovery?.7:1)*(taper?.55:1));
  return{label:`Long ${modality}`,detail:`${longDuration} min progressive endurance with fueling and technique practice`,duration:longDuration,intensity:"Endurance"};
}

function strengthMissionsForGoal(goal){
  return {
    "Powerlifting":["S-2 Lower Strength","S-1 Upper Strength","S-4 Athletic Lower","S-3 Athletic Upper"],
    "Olympic Lifting":["S-4 Athletic Lower","S-3 Athletic Upper","S-2 Lower Strength","S-1 Upper Strength"],
    "Athlete":["S-2 Lower Strength","S-3 Athletic Upper","S-4 Athletic Lower","S-1 Upper Strength"],
    "Hybrid":["S-1 Upper Strength","S-2 Lower Strength","S-3 Athletic Upper","S-4 Athletic Lower"],
    "Bodybuilding":["B-1 Chest & Back","B-2 Legs","B-3 Shoulders & Arms","B-4 Back & Posterior","B-3 Shoulders & Arms","B-1 Chest & Back"]
  }[goal]||["S-1 Upper Strength","S-2 Lower Strength","S-3 Athletic Upper"];
}
function saveBlockFromGoalBuilder(preserveProgress=false){
  applyHybridScheduleRecommendation();
  const previous={currentWeek:data.trainingBlock?.currentWeek||1,startDate:data.trainingBlock?.startDate||todayKey(),mission:data.trainingBlock?.mission};
  const strength=document.getElementById("strengthGoal").value, mode=document.getElementById("engineMode").value, engineGoal=document.getElementById("engineGoal").value, e=engineGoalProfile(mode,engineGoal), targetDate=document.getElementById("blockTargetDate").value;
  const length=weeksUntil(targetDate)||(+document.getElementById("blockLength").value||e.weeks); const engineSessions=+document.getElementById("blockRunDays").value||0;
  data.trainingBlock={...data.trainingBlock,enabled:true,goalType:strength,targetDate,targetMinutes:+document.getElementById("engineTargetValue")?.value||0,lengthWeeks:length,currentWeek:preserveProgress?Math.min(previous.currentWeek,length):1,trainingDays:+document.getElementById("blockTrainingDays").value||5,runDays:engineSessions,strengthDays:+document.getElementById("blockStrengthDays").value||4,sessionMinutes:+document.getElementById("blockSessionMinutes").value||75,bodybuildingFocus:document.getElementById("dualBodybuildingFocus")?.value||"Balanced",bodybuildingPhase:document.getElementById("dualPhysiquePhase")?.value||"Recomposition",startDate:preserveProgress?previous.startDate:todayKey(),generatedAt:new Date().toISOString(),mission:previous.mission,dualGoals:{strengthGoal:strength,engineMode:mode,engineGoal,trainingCoordination:document.getElementById("trainingCoordination").value,targetValue:+document.getElementById("engineTargetValue")?.value||0,engineSessions}};
  data.settings.cardioType=mode==="General Conditioning"?"Air Bike":mode==="None / Recovery Only"?"Running":mode;
  buildCurrentWeekPlan();saveData();return {strength,e,length};
}
function generateTrainingBlock(){if(data.trainingBlock?.enabled&&!confirm("Start a new block at Week 1 with these changes? Workout history and all other app data will be preserved."))return;const x=saveBlockFromGoalBuilder(false);alert(`${x.strength} + ${x.e.label} block created: ${x.length} weeks. Prior history was preserved.`);}
function updateCurrentTrainingBlock(){if(!data.trainingBlock?.enabled){generateTrainingBlock();return;}const x=saveBlockFromGoalBuilder(true);alert(`Current block updated at Week ${data.trainingBlock.currentWeek}. Prior history and completed block progress were preserved.`);}
function buildCurrentWeekPlan(){
  if(!data.trainingBlock.enabled)return; normalizeDualGoals(); const b=data.trainingBlock,s=b.dualGoals.strengthGoal,e=engineGoalProfile(),strengthMissions=strengthMissionsForGoal(s),sd=Math.min(strengthMissions.length,b.strengthDays||4),ed=Math.min(6,b.runDays||0),coord=b.dualGoals.trainingCoordination||"Coach Decides",sp=strengthProgression();
  data.settings.rotationWeek=((blockWeek()-1)%4)+1;data.settings.phase=`${s} + ${e.label} • ${dualBlockPhase()}`;
  const days=["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"], plan=days.map(day=>({day,mission:"M-1 Daily Reset",detail:"Daily mobility and recovery",done:false}));
  const isSixDayGeneralHybrid=s==="Hybrid"&&b.trainingDays===6&&e&&e.id==="work-capacity"&&coord==="Coach Decides";
  if(isSixDayGeneralHybrid){
    const quality=engineWeekPrescription("quality"),easy=engineWeekPrescription("easy"),long=engineWeekPrescription("long");
    plan[0]={day:days[0],mission:strengthMissions[0],detail:`${s} • ${sp.label} • Primary upper-body strength`,done:false};
    plan[1]={day:days[1],mission:"R-4 Intervals",detail:quality.detail,customLabel:quality.label,prescribedDuration:quality.duration,done:false};
    plan[2]={day:days[2],mission:strengthMissions[1],detail:`${s} • ${sp.label} • Primary lower-body strength`,done:false};
    plan[3]={day:days[3],mission:strengthMissions[2],detail:`${s} • ${sp.label} • Short power and durability emphasis`,done:false,secondaryMission:"R-2 Easy Run",secondaryLabel:easy.label,secondaryDuration:easy.duration,secondaryDetail:`20–30 min easy aerobic support after strength or in a separate session. ${easy.detail}`};
    plan[4]={day:days[4],mission:strengthMissions[3],detail:`${s} • ${sp.label} • Secondary strength exposure; keep 1–3 reps in reserve`,done:false};
    plan[5]={day:days[5],mission:"R-5 Long Run",detail:long.detail,customLabel:long.label,prescribedDuration:long.duration,done:false};
    plan[6]={day:days[6],mission:"M-1 Daily Reset",detail:"Full recovery day: mobility, walking, and readiness review",done:false};
  }else{
    const strengthSlots=sd>=5?[0,1,3,4,5]:sd===4?[0,1,3,5]:sd===3?[0,2,4]:[0,3]; strengthSlots.slice(0,sd).forEach((idx,i)=>{plan[idx]={day:days[idx],mission:strengthMissions[i%strengthMissions.length],detail:`${s} • ${sp.label}`,done:false};});
    if(ed>0){const engineKinds=ed===1?["easy"]:ed===2?["easy","long"]:ed===3?["easy","quality","long"]:ed===4?["easy","easy","quality","long"]:["easy","easy","quality","easy","long","easy"].slice(0,ed); const preferred=[1,3,5,2,6,4];engineKinds.forEach((kind,i)=>{const idx=preferred[i],p=engineWeekPrescription(kind),engine={mission:kind==="quality"?"R-4 Intervals":kind==="long"?"R-5 Long Run":"R-2 Easy Run",detail:p.detail,customLabel:p.label};if(plan[idx].mission==="M-1 Daily Reset"||coord==="Alternate Days")plan[idx]={day:days[idx],...engine,done:false};else{plan[idx].secondaryMission=engine.mission;plan[idx].secondaryLabel=p.label;plan[idx].secondaryDuration=p.duration;plan[idx].secondaryDetail=p.detail;plan[idx].detail+=` • PM: ${p.label}`;}});}
  }
  data.plan=plan;
}
function coachRecommendation(){ if(!data.trainingBlock.enabled)return"Choose a Strength goal and a compatible Engine goal in More. The Coach Engine will coordinate both progressions."; const status=readinessStatus(readinessScore()),e=engineGoalProfile(),compat=compatibilityInfo(data.trainingBlock.dualGoals.strengthGoal,data.trainingBlock.dualGoals.engineMode,e.id); if(status==="RED")return`${dualBlockPhase()}: recovery is the mission. Keep mobility, remove hard Engine work, and retain only essential technique or easy strength work.`;if(status==="YELLOW")return`${dualBlockPhase()}: preserve the main Strength work, trim accessory volume, and convert hard Engine work to easy aerobic support. ${compat.note}`;return`${dualBlockPhase()}: execute both progressions as scheduled. ${compat.note}`; }

function renderDualGoals(){
  normalizeDualGoals(); const b=data.trainingBlock,d=b.dualGoals,e=engineGoalProfile(),week=b.currentWeek||1,total=b.lengthWeeks||12;
  const sg=document.getElementById("strengthGoal");if(sg)sg.value=d.strengthGoal;const em=document.getElementById("engineMode");if(em)em.value=d.engineMode;populateEngineGoals();const eg=document.getElementById("engineGoal");if(eg)eg.value=d.engineGoal;updateEngineGoalDetails();
  const coord=document.getElementById("trainingCoordination");if(coord)coord.value=d.trainingCoordination||"Coach Decides";
  setText("currentStrengthGoal",d.strengthGoal);setText("currentEngineGoal",`${d.engineMode} • ${e.label}`);setText("currentStrengthWeek",b.enabled?`Week ${week} of ${total}`:"Not started");setText("currentEngineWeek",b.enabled?`Week ${week} of ${total}`:"Not started");setText("dualMissionHeadline",`${d.strengthGoal} + ${e.label}`);setText("dualMissionPhase",b.enabled?`${dualBlockPhase()} • coordinated by readiness and interference rules`:"Build a coordinated block in More");
  setText("missionBlock",b.enabled?`${d.strengthGoal} + ${e.label}`:data.settings.phase);
  const engineTitle=document.getElementById("engineSessionTitle"), enginePurpose=document.getElementById("engineSessionPurpose"), p=engineWeekPrescription("easy"); if(engineTitle)engineTitle.textContent=p.label;if(enginePurpose)enginePurpose.textContent=p.detail;
  renderNotifications();
}

function currentNotifications(){
  const items=[];if(data.settings.readiness.lastPromptDate!==todayKey())items.push({type:"Readiness",title:"Morning Readiness Check-In",body:"Set today’s Mission Status before training.",action:"readiness"});if(data.pendingFeedbackSessionId)items.push({type:"Debrief",title:"Training Debrief Pending",body:"Tell the Coach Engine how the last session affected you.",action:"feedback"});if(!data.mobility.completedDates.includes(todayKey()))items.push({type:"Recovery",title:"Daily Mobility Prescription",body:`${data.mobility.minutes||10}-minute ${resolvedMobilityFocus()} mobility is ready for morning or evening.`,action:"mobility"});if(data.trainingBlock.enabled){const e=engineGoalProfile();items.push({type:"Mission",title:`Week ${blockWeek()}: ${dualBlockPhase()}`,body:`Strength: ${data.trainingBlock.dualGoals.strengthGoal} • Engine: ${e.label}`,action:"plan"});}return items;
}
function renderNotifications(){const items=currentNotifications(),badge=document.getElementById("notificationBadge");if(badge){badge.textContent=String(items.length);badge.classList.toggle("hidden",items.length===0);}const list=document.getElementById("notificationList");if(list)list.innerHTML=items.length?items.map((n,i)=>`<button class="notification-item" onclick="handleNotification('${n.action}')"><span>${n.type}</span><strong>${n.title}</strong><p>${n.body}</p></button>`).join(""):'<div class="empty-notifications">You are caught up. Train for life.</div>';}
function openNotificationCenter(){renderNotifications();document.getElementById("notificationModal")?.classList.remove("hidden");}
function closeNotificationCenter(){document.getElementById("notificationModal")?.classList.add("hidden");}
function markNotificationsReviewed(){data.settings.lastNotificationReview=new Date().toISOString();saveData({render:false});closeNotificationCenter();}
function handleNotification(action){closeNotificationCenter();if(action==="readiness")document.getElementById("dailyReadinessModal")?.classList.remove("hidden");else if(action==="feedback")openPendingSessionFeedback();else if(action==="mobility"){showScreen("home");document.getElementById("mobilityFocus")?.scrollIntoView({behavior:"smooth"});}else if(action==="plan")showScreen("plan");}
function openAthleteProfile(){showScreen("more");setTimeout(()=>document.getElementById("athleteNameInput")?.scrollIntoView({behavior:"smooth",block:"center"}),100);}

const originalRenderApp=renderApp;
renderApp=function(){originalRenderApp();renderDualGoals();const planList=document.getElementById("planList");if(planList){[...planList.children].forEach((row,i)=>{const item=data.plan[i];if(item?.secondaryLabel){const target=row.querySelector(".hint")||row.querySelector(".sub");target?.insertAdjacentHTML("afterend",`<div class="two-a-day-tag">PM ENGINE • ${item.secondaryLabel}<br><small>${item.secondaryDetail}</small></div>`);}});}};

document.addEventListener("DOMContentLoaded",()=>{document.getElementById("blockStrengthDays")?.addEventListener("change",e=>e.target.dataset.touched="1");document.getElementById("blockRunDays")?.addEventListener("change",e=>e.target.dataset.touched="1");["blockTrainingDays","trainingCoordination"].forEach(id=>document.getElementById(id)?.addEventListener("change",applyHybridScheduleRecommendation));setTimeout(()=>{updateDualGoalBuilder();renderDualGoals();applyHybridScheduleRecommendation();},80);});

// 7.0.15: temporarily reduce volume after an injury is marked recovered.
const baseStrengthProgressionRecovery=strengthProgression;
strengthProgression=function(){const p=baseStrengthProgressionRecovery();const r=data.settings.returnToTraining;if(!r?.active)return p;const today=todayKey();if(today>r.endDate){r.active=false;saveData({render:false});return p;}return {...p,label:`Gradual return • ${p.label}`,setScale:Math.min(Number(p.setScale)||1,Number(r.volumeScale)||.75),note:`Recently cleared movement restrictions: use approximately ${Math.round((Number(r.volumeScale)||.75)*100)}% of normal set volume, stop well short of failure, and monitor symptoms. ${p.note||""}`};};
