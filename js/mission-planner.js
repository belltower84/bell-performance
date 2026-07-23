"use strict";

const EVENT_MISSION_PROFILES = {
  "HYROX": {strengthGoal:"Hybrid",engineMode:"Running",engineGoal:"hyrox",strengthDays:3,engineDays:4,minimumWeeks:8,idealWeeks:16,strengthFocus:"Strength endurance, sled capacity, loaded carries, lunging durability, and posterior-chain strength",engineFocus:"Aerobic base, compromised running, threshold control, and repeated 1 km efforts"},
  "CrossFit Competition": {strengthGoal:"Olympic Lifting",engineMode:"General Conditioning",engineGoal:"crossfit",strengthDays:4,engineDays:3,minimumWeeks:8,idealWeeks:14,strengthFocus:"Olympic-lift skill, absolute strength, gymnastics strength, and mixed-modal durability",engineFocus:"Repeated high-output intervals, aerobic recovery, and event-style mixed conditioning"},
  "Powerlifting Meet": {strengthGoal:"Powerlifting",engineMode:"None / Recovery Only",engineGoal:"recovery-only",strengthDays:4,engineDays:2,minimumWeeks:8,idealWeeks:16,strengthFocus:"Competition squat, bench press, and deadlift strength with meet-specific peaking",engineFocus:"Low-fatigue aerobic recovery that supports heavy lifting without interference"},
  "Strongman Competition": {strengthGoal:"Powerlifting",engineMode:"General Conditioning",engineGoal:"strongman",strengthDays:4,engineDays:3,minimumWeeks:10,idealWeeks:16,strengthFocus:"Maximum strength, overhead power, carries, loading, grip, and event-specific implements",engineFocus:"Heavy work capacity, repeated event efforts, and recovery between implements"},
  "Combat Sports Tournament": {strengthGoal:"Athlete",engineMode:"Sprint / Field",engineGoal:"combat",strengthDays:3,engineDays:4,minimumWeeks:8,idealWeeks:14,strengthFocus:"Relative strength, rotational power, grip, neck, trunk stability, and muscular endurance",engineFocus:"Round-specific intervals, repeated high-intensity efforts, and aerobic recovery between exchanges"},
  "Marathon": {strengthGoal:"Athlete",engineMode:"Running",engineGoal:"marathon",strengthDays:2,engineDays:5,minimumWeeks:12,idealWeeks:20,strengthFocus:"Single-leg durability, calf capacity, posterior-chain strength, and trunk stability",engineFocus:"Mileage progression, long runs, threshold work, marathon pace, fueling practice, and taper"},
  "Half Marathon": {strengthGoal:"Athlete",engineMode:"Running",engineGoal:"half",strengthDays:2,engineDays:4,minimumWeeks:10,idealWeeks:16,strengthFocus:"Running durability, single-leg strength, calf capacity, and trunk stability",engineFocus:"Aerobic volume, long runs, threshold development, race pace, and taper"},
  "10K Race": {strengthGoal:"Hybrid",engineMode:"Running",engineGoal:"10k-time",strengthDays:3,engineDays:4,minimumWeeks:8,idealWeeks:14,strengthFocus:"Maintain total-body strength and running durability",engineFocus:"Aerobic volume, threshold durability, goal-pace intervals, and race sharpening"},
  "5K Race": {strengthGoal:"Hybrid",engineMode:"Running",engineGoal:"5k-time",strengthDays:3,engineDays:4,minimumWeeks:6,idealWeeks:12,strengthFocus:"Maintain strength, stiffness, and sprint mechanics without excess fatigue",engineFocus:"Threshold speed, VO₂ development, race pace, and finishing speed"},
  "Triathlon": {strengthGoal:"Athlete",engineMode:"Swimming",engineGoal:"triathlon",strengthDays:2,engineDays:5,minimumWeeks:12,idealWeeks:20,strengthFocus:"Whole-body durability, shoulder health, single-leg strength, and trunk stability",engineFocus:"Swim-bike-run aerobic development, transitions, bricks, pacing, and taper"},
  "Obstacle Course Race": {strengthGoal:"Athlete",engineMode:"Running",engineGoal:"ocr",strengthDays:3,engineDays:4,minimumWeeks:8,idealWeeks:16,strengthFocus:"Grip, pulling, carries, climbing strength, single-leg durability, and obstacle skill",engineFocus:"Trail running, hills, threshold work, compromised running, and obstacle transitions"},
  "Tactical Games": {strengthGoal:"Hybrid",engineMode:"Sprint / Field",engineGoal:"tactical",strengthDays:3,engineDays:4,minimumWeeks:8,idealWeeks:14,strengthFocus:"Usable strength, carries, power, grip, and task-specific durability",engineFocus:"Running, loaded work capacity, repeat efforts, and recovery under fatigue"},
  "Military / Law-Enforcement Fitness Test": {strengthGoal:"Athlete",engineMode:"Running",engineGoal:"fitness-test",strengthDays:3,engineDays:4,minimumWeeks:6,idealWeeks:12,strengthFocus:"Test-specific calisthenics, relative strength, trunk endurance, and movement quality",engineFocus:"Timed-run performance, repeatability, and test-specific pacing"},
  "Custom Sport Event": {strengthGoal:"Athlete",engineMode:"Sprint / Field",engineGoal:"custom-event",strengthDays:3,engineDays:3,minimumWeeks:8,idealWeeks:12,strengthFocus:"General athletic strength, power, resilience, and event-relevant movement patterns",engineFocus:"Aerobic base plus event-specific work-to-rest demands"}
};

const DEVELOPMENT_MISSION_PROFILES = {
  "Fat Loss": {strengthGoal:"Bodybuilding",engineMode:"General Conditioning",engineGoal:"aesthetics",strengthDays:4,engineDays:4,strengthFocus:"Preserve or build lean mass with progressive resistance training",engineFocus:"Recoverable Zone 2 and controlled intervals that increase expenditure"},
  "Muscle Building": {strengthGoal:"Bodybuilding",engineMode:"None / Recovery Only",engineGoal:"recovery-only",strengthDays:4,engineDays:2,strengthFocus:"Hypertrophy, symmetry, weak-point development, and progressive overload",engineFocus:"Low-fatigue aerobic recovery that supports health and work capacity"},
  "Body Recomposition": {strengthGoal:"Bodybuilding",engineMode:"General Conditioning",engineGoal:"aesthetics",strengthDays:4,engineDays:3,strengthFocus:"Build muscle while preserving performance through progressive hypertrophy work",engineFocus:"Moderate conditioning volume that supports energy balance and recovery"},
  "Mobility & Longevity": {strengthGoal:"Athlete",engineMode:"General Conditioning",engineGoal:"health",strengthDays:3,engineDays:3,strengthFocus:"Movement quality, full-range strength, balance, tissue capacity, and independence",engineFocus:"Aerobic health, recovery, and sustainable cardiovascular fitness"},
  "Sport-Specific Performance": {strengthGoal:"Athlete",engineMode:"Sprint / Field",engineGoal:"repeat-sprint",strengthDays:3,engineDays:3,strengthFocus:"Sport-relevant strength, speed, power, agility, and resilience",engineFocus:"Sport-specific work-to-rest conditioning and repeat-effort ability"},
  "General Hybrid Fitness": {strengthGoal:"Hybrid",engineMode:"General Conditioning",engineGoal:"work-capacity",strengthDays:3,engineDays:3,strengthFocus:"Balanced strength and muscle development",engineFocus:"Aerobic fitness, work capacity, and mixed-modal conditioning"},
  "Strength Development": {strengthGoal:"Powerlifting",engineMode:"None / Recovery Only",engineGoal:"recovery-only",strengthDays:4,engineDays:2,strengthFocus:"Build the major lifts and general force production",engineFocus:"Minimal aerobic support for health and recovery"},
  "Endurance Development": {strengthGoal:"Athlete",engineMode:"Running",engineGoal:"general-run",strengthDays:2,engineDays:4,strengthFocus:"Maintain durable total-body strength and injury resistance",engineFocus:"Progress aerobic volume, threshold ability, and long-duration capacity"}
};

function addMissionEngineGoal(mode, profile) {
  if (!ENGINE_GOALS[mode] || ENGINE_GOALS[mode].some(item => item.id === profile.id)) return;
  ENGINE_GOALS[mode].push(profile);
}
[
  ["Running",{id:"hyrox",label:"HYROX Compromised Running",weeks:16,level:"specialist",description:"Repeated 1 km running efforts paired with race stations and threshold control."}],
  ["General Conditioning",{id:"crossfit",label:"CrossFit Competition Conditioning",weeks:14,level:"specialist",description:"Mixed-modal intervals, repeatability, pacing, and competition simulation."}],
  ["General Conditioning",{id:"strongman",label:"Strongman Event Capacity",weeks:16,level:"specialist",description:"Repeated heavy event work, carries, loading, and recovery between implements."}],
  ["Sprint / Field",{id:"combat",label:"Combat Sports Round Conditioning",weeks:14,level:"specialist",description:"Round-specific intervals, repeat efforts, and aerobic recovery."}],
  ["Swimming",{id:"triathlon",label:"Triathlon Preparation",weeks:20,level:"specialist",description:"Coordinated swim-bike-run development, bricks, transitions, and taper."}],
  ["Running",{id:"ocr",label:"Obstacle Course Race Preparation",weeks:16,level:"specialist",description:"Trail running, hills, compromised efforts, and obstacle transitions."}],
  ["Running",{id:"fitness-test",label:"Fitness Test Run Preparation",weeks:12,level:"performance",description:"Timed-run pacing and test-specific conditioning."}],
  ["Sprint / Field",{id:"custom-event",label:"Custom Event Conditioning",weeks:12,level:"sport",description:"General base and event-specific work-to-rest conditioning."}]
].forEach(([mode,profile])=>addMissionEngineGoal(mode,profile));

function onboardingMissionPath() { return document.querySelector('input[name="onboardingMissionPath"]:checked')?.value || "event"; }
function toggleOnboardingMissionPath() {
  const eventPath=onboardingMissionPath()==="event";
  byId("onboardingEventMissionPanel")?.classList.toggle("hidden",!eventPath);
  byId("onboardingDevelopmentMissionPanel")?.classList.toggle("hidden",eventPath);
  toggleSportGoalField();
  updateOnboardingMissionPreview();
}
function toggleSportGoalField(){
  const sport=byId("onboardingDevelopmentGoal")?.value==="Sport-Specific Performance";
  byId("onboardingSportGoalWrap")?.classList.toggle("hidden",!sport);
}
function daysBetweenKeys(startKey,endKey){
  const start=new Date(`${startKey}T12:00:00`),end=new Date(`${endKey}T12:00:00`);
  return Math.ceil((end-start)/86400000);
}
function eventWeeksFrom(startKey,eventDate){return Math.max(2,Math.min(52,Math.ceil(daysBetweenKeys(startKey,eventDate)/7)));}
function selectedMissionProfile(){
  if(onboardingMissionPath()==="event") return EVENT_MISSION_PROFILES[byId("onboardingEventType")?.value] || EVENT_MISSION_PROFILES["Custom Sport Event"];
  return DEVELOPMENT_MISSION_PROFILES[byId("onboardingDevelopmentGoal")?.value] || DEVELOPMENT_MISSION_PROFILES["General Hybrid Fitness"];
}
function missionAvailability(profile){
  const days=Number(byId("onboardingTrainingDays")?.value)||5;
  const maxSessions=Math.max(3,Math.min(10,days*2));
  let strengthDays=profile.strengthDays,engineDays=profile.engineDays;
  while(strengthDays+engineDays>maxSessions){if(engineDays>strengthDays)engineDays--;else strengthDays--;}
  return {strengthDays:Math.max(2,strengthDays),engineDays:Math.max(1,engineDays),trainingDays:days,sessionMinutes:Number(byId("onboardingSessionMinutes")?.value)||75};
}
function updateOnboardingMissionPreview(){
  const box=byId("onboardingMissionPreview");if(!box)return;
  const profile=selectedMissionProfile(),availability=missionAvailability(profile);
  if(onboardingMissionPath()==="event"){
    const type=byId("onboardingEventType")?.value||"Event",date=byId("onboardingEventDate")?.value;
    const start=byId("onboardingBlockStart")?.value==="nextMonday"?nextMondayKey():todayKey();
    const weeks=date?eventWeeksFrom(start,date):profile.idealWeeks;
    const timing=date?(daysBetweenKeys(start,date)<profile.minimumWeeks*7?`Compressed ${weeks}-week preparation. The timeline is shorter than the recommended ${profile.minimumWeeks}+ weeks.`:`${weeks}-week preparation leading into peak and taper.`):`Recommended preparation: approximately ${profile.idealWeeks} weeks.`;
    box.innerHTML=`<strong>${escapeHtml(type)} mission</strong><span><b>Derived Strength:</b> ${escapeHtml(profile.strengthFocus)}</span><span><b>Derived Engine:</b> ${escapeHtml(profile.engineFocus)}</span><span>${escapeHtml(timing)} ${availability.strengthDays} Strength + ${availability.engineDays} Engine sessions across ${availability.trainingDays} training days.</span>`;
  }else{
    const goal=byId("onboardingDevelopmentGoal")?.value||"General Hybrid Fitness",sport=goal==="Sport-Specific Performance"?(byId("onboardingSportGoal")?.value.trim()||"your sport"):"";
    box.innerHTML=`<strong>${escapeHtml(goal)}${sport?` • ${escapeHtml(sport)}`:""}</strong><span><b>Derived Strength:</b> ${escapeHtml(profile.strengthFocus)}</span><span><b>Derived Engine:</b> ${escapeHtml(profile.engineFocus)}</span><span>${availability.strengthDays} Strength + ${availability.engineDays} Engine sessions across ${availability.trainingDays} training days, followed by an end-of-block review.</span>`;
  }
}

function loadOnboardingDualGoals(){
  const mission=data.trainingBlock?.mission||{};
  const path=mission.path||"event";
  const radio=document.querySelector(`input[name="onboardingMissionPath"][value="${path}"]`);if(radio)radio.checked=true;
  if(mission.eventType&&byId("onboardingEventType"))byId("onboardingEventType").value=mission.eventType;
  if(byId("onboardingEventName"))byId("onboardingEventName").value=mission.eventName||"";
  if(byId("onboardingEventDate"))byId("onboardingEventDate").value=mission.eventDate||"";
  if(byId("onboardingEventExperience"))byId("onboardingEventExperience").value=mission.experience||"intermediate";
  if(byId("onboardingEventObjective"))byId("onboardingEventObjective").value=mission.objective||"perform";
  if(byId("onboardingEventDivision"))byId("onboardingEventDivision").value=mission.division||"";
  if(mission.developmentGoal&&byId("onboardingDevelopmentGoal"))byId("onboardingDevelopmentGoal").value=mission.developmentGoal;
  if(byId("onboardingSportGoal"))byId("onboardingSportGoal").value=mission.sport||"";
  if(byId("onboardingDevelopmentPriority"))byId("onboardingDevelopmentPriority").value=mission.priority||"balanced";
  if(byId("onboardingDevelopmentWeeks"))byId("onboardingDevelopmentWeeks").value=String(data.trainingBlock?.lengthWeeks||12);
  if(byId("onboardingTrainingDays"))byId("onboardingTrainingDays").value=String(data.trainingBlock?.trainingDays||5);
  if(byId("onboardingSessionMinutes"))byId("onboardingSessionMinutes").value=String(data.trainingBlock?.sessionMinutes||75);
  toggleOnboardingMissionPath();
}

function saveOnboardingDualGoals(buildPlan=true){
  const path=onboardingMissionPath(),profile=selectedMissionProfile(),availability=missionAvailability(profile);
  let mission,lengthWeeks;
  if(path==="event"){
    const eventType=byId("onboardingEventType").value,eventDate=byId("onboardingEventDate").value;
    if(!eventDate){byId("onboardingEventDate").focus();alert("Choose the future date of the event so Bell Performance can build the preparation and taper.");return false;}
    const start=byId("onboardingBlockStart")?.value==="nextMonday"?nextMondayKey():todayKey();
    if(daysBetweenKeys(start,eventDate)<7){byId("onboardingEventDate").focus();alert("Choose an event date at least one week after the block start.");return false;}
    lengthWeeks=eventWeeksFrom(start,eventDate);
    mission={path,eventType,eventName:byId("onboardingEventName").value.trim()||eventType,eventDate,experience:byId("onboardingEventExperience").value,objective:byId("onboardingEventObjective").value,division:byId("onboardingEventDivision").value.trim(),strengthFocus:profile.strengthFocus,engineFocus:profile.engineFocus,minimumWeeks:profile.minimumWeeks,idealWeeks:profile.idealWeeks};
  }else{
    const goal=byId("onboardingDevelopmentGoal").value;
    if(goal==="Sport-Specific Performance"&&!byId("onboardingSportGoal").value.trim()){byId("onboardingSportGoal").focus();alert("Enter the sport or activity you want the program to prepare for.");return false;}
    lengthWeeks=Number(byId("onboardingDevelopmentWeeks").value)||12;
    mission={path,developmentGoal:goal,sport:byId("onboardingSportGoal").value.trim(),priority:byId("onboardingDevelopmentPriority").value,strengthFocus:profile.strengthFocus,engineFocus:profile.engineFocus};
  }
  data.trainingBlock={...data.trainingBlock,enabled:true,goalType:profile.strengthGoal,lengthWeeks,currentWeek:1,trainingDays:availability.trainingDays,strengthDays:availability.strengthDays,runDays:availability.engineDays,sessionMinutes:availability.sessionMinutes,targetDate:mission.eventDate||"",mission,dualGoals:{strengthGoal:profile.strengthGoal,engineMode:profile.engineMode,engineGoal:profile.engineGoal,trainingCoordination:"Coach Decides",engineSessions:availability.engineDays,targetValue:0}};
  data.settings.cardioType=profile.engineMode==="General Conditioning"?"Air Bike":profile.engineMode==="None / Recovery Only"?"Walking":profile.engineMode;
  if(buildPlan&&typeof buildCurrentWeekPlan==="function")buildCurrentWeekPlan();
  return true;
}

function recommendedFirstBlockSettings(){
  const p=selectedMissionProfile(),a=missionAvailability(p);
  let lengthWeeks=onboardingMissionPath()==="event"?(byId("onboardingEventDate")?.value?eventWeeksFrom(byId("onboardingBlockStart")?.value==="nextMonday"?nextMondayKey():todayKey(),byId("onboardingEventDate").value):p.idealWeeks):(Number(byId("onboardingDevelopmentWeeks")?.value)||12);
  return {...a,lengthWeeks,strength:p.strengthGoal,mode:p.engineMode,goal:p.engineGoal};
}
function applyRecommendedFirstBlock(){
  const r=recommendedFirstBlockSettings();
  if(byId("onboardingTrainingDays"))byId("onboardingTrainingDays").value=String(r.trainingDays);
  if(byId("onboardingSessionMinutes"))byId("onboardingSessionMinutes").value=String(r.sessionMinutes);
  if(onboardingMissionPath()==="development"&&byId("onboardingDevelopmentWeeks"))byId("onboardingDevelopmentWeeks").value=String(r.lengthWeeks);
  updateOnboardingMissionPreview();return r;
}

function renderOnboardingReview(){
  if(typeof syncOnboardingEquipmentFromChecks==="function")syncOnboardingEquipmentFromChecks();
  const injurySummary=injuryProfileSummaryText(),primary=onboardingLocations.find(x=>x.id===onboardingActiveLocationId)||onboardingLocations[0],height=Number(data.nutrition.height)||66,p=selectedMissionProfile(),r=recommendedFirstBlockSettings(),start=byId("onboardingBlockStart")?.value==="nextMonday"?"Next Monday":"Today";
  const missionTitle=onboardingMissionPath()==="event"?(byId("onboardingEventName")?.value.trim()||byId("onboardingEventType")?.value||"Event Mission"):(byId("onboardingDevelopmentGoal")?.value||"Development Mission");
  const missionDetail=onboardingMissionPath()==="event"?`${byId("onboardingEventDate")?.value||"Date required"} • ${r.lengthWeeks}-week event build`:`${r.lengthWeeks}-week development block`;
  byId("onboardingReview").innerHTML=`<div><span>Athlete</span><strong>${escapeHtml(byId("onboardingAthleteName").value.trim())}</strong><small>${escapeHtml(byId("onboardingAthleteMode").value)} • Age ${escapeHtml(data.nutrition.age)} • ${escapeHtml(data.settings.weight)} lb • ${Math.floor(height/12)}′${height%12}″</small></div><div><span>Movement limitations</span><strong>${escapeHtml(injurySummary.title)}</strong><small>${escapeHtml(injurySummary.detail)}</small></div><div><span>Primary workout location</span><strong>${escapeHtml(primary.name)}</strong><small>${primary.equipment.length} equipment options • ${onboardingLocations.length} saved location${onboardingLocations.length===1?"":"s"}</small></div><div><span>Mission</span><strong>${escapeHtml(missionTitle)}</strong><small>${escapeHtml(missionDetail)}</small></div><div><span>Derived training priorities</span><strong>${escapeHtml(p.strengthGoal)} + ${escapeHtml(p.engineMode)}</strong><small>${r.strengthDays} Strength • ${r.engineDays} Engine • peak/deload logic included</small></div><div><span>Block launch</span><strong>${selectedOnboardingBlockMode()==="recommended"?"Recommended structure":"Mission-based structure"}</strong><small>Week 1 begins ${escapeHtml(start.toLowerCase())}</small></div><div><span>Coach messages</span><strong>${escapeHtml(byId("onboardingMessageStyle").value)}</strong><small>Preference saved</small></div>`;
}

function completeOnboarding(){
  if(selectedOnboardingBlockMode()==="recommended")applyRecommendedFirstBlock();
  if(!saveOnboardingDualGoals(false))return;
  if(!saveFirstFlightProfile()||!saveOnboardingInjuryProfile())return;
  if(typeof saveOnboardingEquipment==="function")saveOnboardingEquipment();
  data.trainingBlock.startDate=byId("onboardingBlockStart")?.value==="nextMonday"?nextMondayKey():todayKey();
  if(data.trainingBlock.mission?.path==="event")data.trainingBlock.lengthWeeks=eventWeeksFrom(data.trainingBlock.startDate,data.trainingBlock.mission.eventDate);
  data.trainingBlock.currentWeek=1;data.trainingBlock.enabled=true;data.trainingBlock.generatedAt=new Date().toISOString();
  if(typeof buildCurrentWeekPlan==="function")buildCurrentWeekPlan();
  data.settings.coachMessages={setupComplete:true,style:byId("onboardingMessageStyle").value,scriptureFrequency:byId("onboardingScriptureFrequency").value};
  data.settings.firstFlightStage="complete";data.settings.firstFlightTourComplete=true;data.settings.firstBlockLaunchMode=selectedOnboardingBlockMode();
  saveData({render:false});byId("onboardingModal").classList.add("hidden");document.body.classList.remove("modal-open");renderApp();showScreen("home");
  const title=data.trainingBlock.mission?.eventName||data.trainingBlock.mission?.developmentGoal||"First training block";
  alert(`${title} created. Week 1 begins ${data.trainingBlock.startDate}.`);
}

const baseDualBlockPhase=dualBlockPhase;
dualBlockPhase=function(){
  const mission=data.trainingBlock?.mission,w=blockWeek(),t=data.trainingBlock.lengthWeeks||12;
  if(!mission)return baseDualBlockPhase();
  if(mission.path==="event"){
    if(w===t)return "Event Week";
    if(w===t-1)return "Peak & Taper";
    if(w>=t-3)return "Event Specificity";
    if(w%4===0)return "Recovery & Absorption";
    const r=w/t;if(r<=.25)return "General Preparation";if(r<=.55)return "Capacity Build";if(r<=.78)return "Specific Development";return "Competition Preparation";
  }
  if(w===t)return "Review & Transition";
  if(w%4===0)return "Recovery & Resensitization";
  const r=w/t;if(r<=.35)return "Foundation";if(r<=.75)return "Progressive Development";return "Consolidation & Testing";
};
blockPhase=function(){return dualBlockPhase();};

const baseEngineWeekPrescription=engineWeekPrescription;
engineWeekPrescription=function(kind){
  const base=baseEngineWeekPrescription(kind),mission=data.trainingBlock?.mission;
  if(!mission||mission.path!=="event")return base;
  const event=mission.eventType,phase=dualBlockPhase(),taper=["Peak & Taper","Event Week"].includes(phase);
  const labels={"HYROX":"HYROX","CrossFit Competition":"Competition WOD","Powerlifting Meet":"Recovery","Strongman Competition":"Strongman","Combat Sports Tournament":"Round","Triathlon":"Triathlon","Obstacle Course Race":"OCR","Tactical Games":"Tactical","Military / Law-Enforcement Fitness Test":"Fitness Test"};
  const prefix=labels[event]||event;
  if(event==="HYROX")return kind==="quality"?{...base,label:`${prefix} Compromised Intervals`,detail:taper?"Short 1 km race-pace repeats with reduced station volume; finish fresh":"Repeated 1 km efforts alternated with sled, carry, lunge, or erg stations",duration:taper?38:55}:{...base,label:kind==="long"?"HYROX Simulation":"HYROX Aerobic Base",detail:kind==="long"?(taper?"Reduced-volume race rehearsal":"Progressive run-station simulation with controlled pacing"):"Easy running or ergs at conversational effort"};
  if(event==="Powerlifting Meet")return {...base,label:"Recovery Aerobic Support",detail:taper?"15–20 min very easy movement only":"20–35 min low-impact Zone 2; stop before leg fatigue",duration:taper?18:30};
  if(event==="Combat Sports Tournament")return {...base,label:kind==="quality"?"Competition Rounds":"Fight Camp Aerobic Base",detail:kind==="quality"?(taper?"Short sharp rounds at low total volume":"Event-length rounds with sport-specific work-to-rest intervals"):"Easy aerobic work to improve recovery between rounds"};
  if(event==="CrossFit Competition"||event==="Strongman Competition"||event==="Tactical Games")return {...base,label:`${prefix} ${kind==="quality"?"Intervals":kind==="long"?"Simulation":"Base"}`,detail:taper?"Competition-specific sharpening with reduced total volume":base.detail};
  if(event==="Triathlon")return {...base,label:kind==="long"?"Long Brick Session":kind==="quality"?"Race-Pace Brick":"Easy Swim / Bike / Run",detail:taper?"Reduced-volume race-specific work and transition rehearsal":kind==="long"?"Progressive bike-run brick with fueling and transition practice":base.detail};
  if(event==="Obstacle Course Race")return {...base,label:kind==="long"?"Trail + Obstacles Simulation":kind==="quality"?"Hill / Grip Intervals":"OCR Aerobic Base",detail:taper?"Short obstacle rehearsal and easy trail work":"Trail running paired with carries, climbs, hangs, or obstacle transitions"};
  return {...base,label:`${prefix} ${base.label}`,detail:taper?`Reduced-volume ${base.detail.toLowerCase()}`:base.detail};
};

const baseStrengthProgression=strengthProgression;
strengthProgression=function(){
  const p=baseStrengthProgression(),mission=data.trainingBlock?.mission,phase=dualBlockPhase();
  if(!mission||mission.path!=="event")return p;
  if(phase==="Event Week")return {...p,label:"Event-week taper",load:.62,setScale:.38,note:"Express fitness, do not create fatigue. Use only brief technique work and event-specific primers."};
  if(phase==="Peak & Taper")return {...p,label:"Peak and taper",load:.75,setScale:.55,note:"Retain intensity where useful, reduce volume, and eliminate unnecessary soreness before the event."};
  if(phase==="Event Specificity")return {...p,label:"Event-specific strength",note:`Prioritize ${mission.strengthFocus.toLowerCase()}. Keep accessory work subordinate to event performance.`};
  return p;
};

const baseRenderDualGoalsForMission=renderDualGoals;
renderDualGoals=function(){
  baseRenderDualGoalsForMission();
  const mission=data.trainingBlock?.mission;if(!mission)return;
  const title=mission.path==="event"?(mission.eventName||mission.eventType):(mission.developmentGoal||"Development Mission");
  const detail=mission.path==="event"?`${mission.eventType} • ${mission.eventDate}`:(mission.sport?`${mission.developmentGoal} • ${mission.sport}`:mission.developmentGoal);
  setText("missionBlock",title);setText("dualMissionHeadline",title);
  const phase=byId("dualMissionPhase");if(phase)phase.textContent=`${dualBlockPhase()} • ${detail}`;
};

document.addEventListener("DOMContentLoaded",()=>{toggleOnboardingMissionPath();["onboardingTrainingDays","onboardingSessionMinutes","onboardingBlockStart"].forEach(id=>byId(id)?.addEventListener("change",updateOnboardingMissionPreview));});
