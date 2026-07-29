"use strict";
/* Bell Performance 13.6.3 — streamlined Settings hub, athlete profile, application control, and First Flight. */
(function(){
  const VERSION="13.6.3";
  const $=id=>document.getElementById(id);
  const clamp=(value,min,max)=>Math.max(min,Math.min(max,Number(value)||0));
  const clean=value=>String(value??"").replace(/\s+/g," ").trim();
  const escapeHtml=value=>clean(value).replace(/[&<>'"]/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[ch]));
  const IDENTITIES=[
    {id:"Performance & Health",title:"Performance & Health",detail:"Lose fat, build muscle, improve health, and become more capable."},
    {id:"Hybrid Athlete",title:"Hybrid Athlete",detail:"Develop strength and endurance together without treating either as an afterthought."},
    {id:"Powerlifting",title:"Powerlifting",detail:"Build the squat, bench press, and deadlift for long-term strength or meet preparation."},
    {id:"Bodybuilding",title:"Bodybuilding",detail:"Build muscle, improve proportions, and manage body composition intelligently."},
    {id:"Tactical Athlete",title:"Tactical Athlete",detail:"Develop strength, engine, durability, carries, and occupational readiness."},
    {id:"Functional Fitness",title:"Functional Fitness",detail:"Train strength, skills, mixed-modal conditioning, and repeatable work capacity."},
    {id:"Endurance Athlete",title:"Endurance Athlete",detail:"Develop running, cycling, or multisport performance with supporting strength."}
  ];
  const OBJECTIVES={
    "Performance & Health":["Lose Fat","Build Muscle","Body Recomposition","Improve Conditioning","Maintain Performance"],
    "Hybrid Athlete":["Improve Performance","Body Recomposition","Improve Conditioning","Prepare for Competition","Maintain Performance"],
    "Powerlifting":["Increase Strength","Prepare for Competition","Body Recomposition","Maintain Performance"],
    "Bodybuilding":["Build Muscle","Body Recomposition","Lose Fat","Prepare for Competition"],
    "Tactical Athlete":["Improve Performance","Improve Conditioning","Prepare for Competition","Maintain Performance"],
    "Functional Fitness":["Improve Performance","Improve Conditioning","Prepare for Competition","Maintain Performance"],
    "Endurance Athlete":["Improve Endurance","Prepare for Competition","Improve Conditioning","Body Recomposition"]
  };
  const OBJECTIVE_COPY={
    "Lose Fat":"Reduce body fat while protecting muscle, strength, and training quality.",
    "Build Muscle":"Prioritize recoverable hypertrophy volume and progressive overload.",
    "Body Recomposition":"Improve muscle and body composition together at a controlled pace.",
    "Increase Strength":"Prioritize force production and measurable progress in the major lifts.",
    "Improve Conditioning":"Build aerobic capacity and repeatable work without sacrificing useful strength.",
    "Improve Performance":"Develop the physical qualities that matter most for your discipline.",
    "Improve Endurance":"Build durable aerobic capacity, threshold, and event-specific endurance.",
    "Prepare for Competition":"Build backward from a dated event and arrive prepared rather than merely fit.",
    "Maintain Performance":"Preserve capability with sustainable training and controlled fatigue.",
    "Continuous Development":"Continue purposeful development without a fixed event date."
  };
  const FLIGHT_COPY=[
    ["Athlete Profile","Start with the athlete","Bell uses your physical baseline to scale training and nutrition estimates."],
    ["Application Control & Identity","Choose how Bell should work","Select a fixed Workout Planner or adaptive Bell Coach, then choose the identity that shapes the program."],
    ["Objective & Journey","Define what matters now","Bell can coach continuous development or build backward from a dated event."],
    ["Availability","Build around real life","Your normal days, session length, and equipment shape the weekly plan."],
    ["Training Baseline","Establish the starting point","Experience and strength baselines help Bell prescribe responsibly."],
    ["Recovery & Preferences","Set recovery and communication preferences","Readiness remains visible in both modes; only Bell Coach changes training automatically."],
    ["Launch Review","Your Journey is ready","Review the coaching profile before Bell builds the first phase."]
  ];

  function profile(){
    data.athleteProfile=data.athleteProfile&&typeof data.athleteProfile==="object"?data.athleteProfile:{};
    data.athleteProfile.demographics=data.athleteProfile.demographics||{};
    data.athleteProfile.identity=data.athleteProfile.identity||{};
    data.athleteProfile.experience=data.athleteProfile.experience||{};
    data.athleteProfile.availability=data.athleteProfile.availability||{};
    data.athleteProfile.baselines=data.athleteProfile.baselines||{maxes:{}};
    data.athleteProfile.baselines.maxes=data.athleteProfile.baselines.maxes||{};
    data.athleteProfile.recovery=data.athleteProfile.recovery||{};
    data.athleteProfile.coaching=data.athleteProfile.coaching||{};
    data.athleteProfile.coaching.controlMode=data.athleteProfile.coaching.controlMode==="planner"?"planner":"coach";
    data.athleteProfile.coaching.memoryEnabled=data.athleteProfile.coaching.memoryEnabled!==false;
    data.athleteProfile.coaching.showConfidence=data.athleteProfile.coaching.showConfidence!==false;
    return data.athleteProfile;
  }
  function primaryIdentity(){return profile().identity.primary||data.settings?.primaryTrainingIdentity||"Performance & Health";}
  function primaryObjective(){return profile().identity.objective||data.settings?.secondaryTrainingGoal||"Continuous Development";}
  function objectiveOptions(identity=primaryIdentity()){return OBJECTIVES[identity]||OBJECTIVES["Performance & Health"];}
  function selectedRadio(name,fallback=""){return document.querySelector(`input[name="${name}"]:checked`)?.value||fallback;}
  function applicationControlMode(){return selectedRadio("onboardingControlMode",profile().coaching.controlMode||data.settings?.appControlMode||"coach")==="planner"?"planner":"coach";}
  function setRadio(name,value){const input=document.querySelector(`input[name="${name}"][value="${CSS.escape(String(value))}"]`);if(input)input.checked=true;}
  function weeksUntil(dateKey){if(!dateKey)return null;const target=new Date(`${dateKey}T12:00:00`),now=new Date();now.setHours(12,0,0,0);if(Number.isNaN(target.getTime()))return null;return Math.max(1,Math.ceil((target-now)/604800000));}
  function journeyMode(){return selectedRadio("onboardingJourneyMode",profile().identity.journeyMode||"continuous_development");}
  function identityPrescription(identity,objective){
    const table={
      "Performance & Health":{strength:"Bodybuilding",mode:"General Conditioning",goal:"work-capacity",sd:3,ed:3,days:5},
      "Hybrid Athlete":{strength:"Hybrid",mode:"Running",goal:"work-capacity",sd:4,ed:3,days:5},
      "Powerlifting":{strength:"Powerlifting",mode:"None / Recovery Only",goal:"recovery-only",sd:4,ed:1,days:5},
      "Bodybuilding":{strength:"Bodybuilding",mode:"General Conditioning",goal:"work-capacity",sd:5,ed:2,days:5},
      "Tactical Athlete":{strength:"Athlete",mode:"Hiking / Rucking",goal:"tactical",sd:3,ed:4,days:5},
      "Functional Fitness":{strength:"Olympic Lifting",mode:"General Conditioning",goal:"crossfit",sd:4,ed:3,days:5},
      "Endurance Athlete":{strength:"Athlete",mode:"Running",goal:"endurance",sd:2,ed:5,days:6}
    };
    const result={...(table[identity]||table["Performance & Health"])};
    if(objective==="Build Muscle"){result.strength="Bodybuilding";result.sd=Math.max(4,result.sd);result.ed=Math.min(2,result.ed);}
    if(objective==="Lose Fat"){result.strength=identity==="Powerlifting"?"Powerlifting":"Bodybuilding";result.mode="General Conditioning";result.goal="fat-loss";result.ed=Math.max(3,result.ed);}
    if(objective==="Increase Strength"){result.strength=identity==="Powerlifting"?"Powerlifting":"Hybrid";result.sd=Math.max(4,result.sd);result.ed=Math.min(2,result.ed);}
    if(objective==="Improve Conditioning"){result.mode="General Conditioning";result.goal="work-capacity";result.ed=Math.max(4,result.ed);}
    if(objective==="Body Recomposition"){result.sd=Math.max(4,result.sd);result.ed=Math.max(2,Math.min(3,result.ed));}
    return result;
  }
  function continuousLength(identity,objective){if(objective==="Lose Fat")return 24;if(identity==="Endurance Athlete")return 20;if(identity==="Bodybuilding"||objective==="Build Muscle"||objective==="Body Recomposition")return 24;return 20;}
  function journeyName(identity,objective,mode,eventName){
    if(mode==="event_preparation")return eventName||`${identity} Event Preparation`;
    const names={"Lose Fat":"Fat-Loss Transformation","Build Muscle":"Muscle-Building Journey","Body Recomposition":"Body Recomposition","Increase Strength":"Strength Development","Improve Conditioning":"Conditioning Development","Improve Endurance":"Endurance Development","Improve Performance":`${identity} Development`,"Maintain Performance":`${identity} Maintenance`};
    return names[objective]||`${identity} Development`;
  }
  function computeCompleteness(){
    const p=profile(),d=p.demographics||{},i=p.identity||{},e=p.experience||{},a=p.availability||{},b=p.baselines?.maxes||{};
    const checks=[Boolean(clean(d.firstName)),Number(d.age)>0,Number(d.heightInches)>0,Number(d.bodyweightLb)>0,Boolean(clean(i.primary)),Boolean(clean(i.objective)),Boolean(clean(e.level)),Array.isArray(a.normalDays)&&a.normalDays.length>=2,Number(a.sessionMinutes)>0,Boolean(p.coaching?.style)];
    if(i.primary==="Powerlifting")checks.push(Number(b.squat)>0,Number(b.bench)>0,Number(b.deadlift)>0);
    if(i.journeyMode==="event_preparation")checks.push(Boolean(clean(i.eventName)),Boolean(i.eventDate));
    const score=Math.round(checks.filter(Boolean).length/checks.length*100);p.profileCompleteness=score;return score;
  }
  function syncProfileToLegacy(){
    const p=profile(),d=p.demographics,i=p.identity,e=p.experience,a=p.availability,b=p.baselines.maxes;
    data.settings=data.settings||{};data.nutrition=data.nutrition||{};data.trainingBlock=data.trainingBlock||{};
    data.settings.athleteName=d.firstName||"";data.settings.sex=d.sex||"Prefer not to say";data.settings.weight=Number(d.bodyweightLb)||null;data.settings.goal=Number(d.goalWeightLb)||null;
    data.nutrition.age=Number(d.age)||null;data.nutrition.height=Number(d.heightInches)||null;
    data.settings.primaryTrainingIdentity=i.primary||"Performance & Health";data.settings.secondaryTrainingGoal=i.objective||"Continuous Development";data.settings.secondaryTargetDate=i.eventDate||"";
    data.settings.athleteMode=i.primary||"Performance & Health";data.settings.trainingExperience=e.level||"Intermediate";data.settings.appControlMode=p.coaching.controlMode==="planner"?"planner":"coach";
    data.settings.maxes={bench:Number(b.bench)||null,squat:Number(b.squat)||null,deadlift:Number(b.deadlift)||null,pushPress:Number(b.pushPress)||null};
    data.settings.coachMessages={...(data.settings.coachMessages||{}),style:p.coaching.style||"Performance",scriptureFrequency:p.coaching.scriptureFrequency||"Occasionally"};
    data.settings.trainingAvailability=data.settings.trainingAvailability||{};
    if(Array.isArray(a.normalDays)&&a.normalDays.length)data.settings.trainingAvailability.normalDays=[...a.normalDays];
    data.trainingBlock.sessionMinutes=Number(a.sessionMinutes)||data.trainingBlock.sessionMinutes||60;
    if(Array.isArray(a.normalDays)&&a.normalDays.length){data.trainingBlock.availableDays=[...a.normalDays];data.trainingBlock.trainingDays=a.normalDays.length;}
    if(data.nutrition.goalMode!=="manual")data.nutrition.goal=i.objective==="Lose Fat"?"cut":i.objective==="Build Muscle"?"gain":"maintain";
    p.updatedAt=new Date().toISOString();computeCompleteness();
  }
  function syncProfileToCloud(){
    if(typeof bellSyncAthleteProfile!=="function"||typeof bellCloudConnected!=="function"||!bellCloudConnected())return;
    Promise.resolve(bellSyncAthleteProfile()).catch(error=>{console.warn("Bell profile sync deferred",error);});
  }

  function captureProfileFromLegacy(){
    const p=profile(),d=p.demographics;
    d.firstName=d.firstName||data.settings?.athleteName||"";d.age=Number(d.age)||Number(data.nutrition?.age)||null;d.sex=d.sex||data.settings?.sex||"Prefer not to say";
    d.heightInches=Number(d.heightInches)||Number(data.nutrition?.height)||null;d.bodyweightLb=Number(d.bodyweightLb)||Number(data.settings?.weight)||null;d.goalWeightLb=Number(d.goalWeightLb)||Number(data.settings?.goal)||null;
    p.identity.primary=p.identity.primary||data.settings?.primaryTrainingIdentity||data.settings?.athleteMode||"Performance & Health";
    p.coaching.controlMode=p.coaching.controlMode==="planner"||data.settings?.appControlMode==="planner"?"planner":"coach";
    p.identity.objective=p.identity.objective||data.settings?.secondaryTrainingGoal||"Continuous Development";
    p.experience.level=p.experience.level||data.settings?.trainingExperience||"Intermediate";
    const days=typeof bellNormalTrainingDays==="function"?bellNormalTrainingDays():data.settings?.trainingAvailability?.normalDays||[];
    if(!Array.isArray(p.availability.normalDays)||!p.availability.normalDays.length)p.availability.normalDays=[...days];
    p.availability.sessionMinutes=Number(p.availability.sessionMinutes)||Number(data.trainingBlock?.sessionMinutes)||60;
    p.baselines.maxes={...(data.settings?.maxes||{}),...(p.baselines.maxes||{})};computeCompleteness();
  }

  function modernizeOnboardingMarkup(){
    const modal=$("onboardingModal");if(!modal||modal.dataset.bell133Modernized)return;modal.dataset.bell133Modernized="true";
    const badge=modal.querySelector(".first-flight-step-badge span");if(badge)badge.textContent="of 7";
    const steps=[...modal.querySelectorAll("[data-onboarding-step]")];if(steps.length<6)return;
    const step0=steps[0],step1=steps[1],step2=steps[2],step3=steps[3],step4=steps[4],review=steps[5];
    step0.querySelector("h3").textContent="Build your athlete profile";step0.querySelector(".first-flight-welcome-sub").textContent="Give Bell the baseline it needs to build training around the athlete—not just generate a random workout.";
    step1.querySelector("h3").textContent="Choose how Bell should work for you";step1.querySelector(".sub").textContent="Select the level of application control you want, then choose the athlete identity that should shape the plan.";
    $("onboardingGoalWeight")?.remove();
    const identityGrid=$("onboardingPrimaryGoalGrid");identityGrid.insertAdjacentHTML("beforebegin",`<div class="application-control-panel"><span class="first-flight-kicker">Application Control</span><div class="application-control-grid"><label><input name="onboardingControlMode" type="radio" value="planner"><span><strong>Workout Planner</strong><small>A straightforward, repeatable plan. Readiness is visible, but Bell does not automatically change the workout.</small></span></label><label><input checked name="onboardingControlMode" type="radio" value="coach"><span><strong>Bell Coach</strong><small>Bell adapts load, volume, conditioning, and recovery using readiness, progress, and feedback.</small></span></label></div><div class="application-control-note" id="onboardingControlModeNote">You can change this later in Settings.</div></div><div class="readiness-divider application-identity-divider"><span>Training identity</span></div>`);identityGrid.innerHTML=IDENTITIES.map((x,index)=>`<label><input ${index===0?"checked":""} name="onboardingPrimaryGoal" type="radio" value="${escapeHtml(x.id)}"/><span><strong>${escapeHtml(x.title)}</strong><small>${escapeHtml(x.detail)}</small></span></label>`).join("");
    step2.innerHTML=`<span class="first-flight-kicker">Flight Check 03</span><h3>What are you trying to accomplish now?</h3><p class="sub">Your identity can remain stable while your current objective and Journey change over time.</p><div class="secondary-goal-grid bell-objective-grid" id="onboardingObjectiveGrid"></div><select class="hidden" id="onboardingSecondaryEmphasis" aria-hidden="true"></select><div class="journey-mode-grid"><label><input checked name="onboardingJourneyMode" type="radio" value="continuous_development"><span><strong>Continuous Development</strong><small>Bell cycles purposeful phases without requiring an event date.</small></span></label><label><input name="onboardingJourneyMode" type="radio" value="event_preparation"><span><strong>Event Preparation</strong><small>Bell builds backward from a competition, race, test, or selection date.</small></span></label></div><div class="bell-onboarding-event-fields hidden" id="onboardingEventFields"><div><label>Event name</label><input id="onboardingEventName" placeholder="Example: Texas Powerlifting Meet"></div><div><label>Event date</label><input id="onboardingEventDate" type="date"></div></div><div class="bell-onboarding-goal-weight hidden" id="onboardingGoalWeightWrap"><label>Goal weight (lb) <span class="optional-label">optional</span></label><input id="onboardingGoalWeight" min="50" max="700" step="0.1" type="number" placeholder="A useful milestone, not a requirement"></div><div class="first-flight-callout"><strong>Bell separates identity from objective</strong><span>A powerlifter can pursue body recomposition. A general-fitness athlete can prepare for a race. Bell adjusts the Journey without forcing a new identity.</span></div><input id="onboardingSecondaryTargetDate" type="hidden"><input id="onboardingStrengthGoal" type="hidden"><input id="onboardingEngineMode" type="hidden"><input id="onboardingEngineGoal" type="hidden"><input id="onboardingStrengthDays" type="hidden"><input id="onboardingEngineDays" type="hidden"><input id="onboardingBlockLength" type="hidden" value="20">`;
    step3.querySelector("h3").textContent="Build a schedule Bell can trust";step3.querySelector(".sub").textContent="Bell protects your priorities by planning around the days and time you can actually sustain.";
    step3.querySelector(".schedule-choice-panel").insertAdjacentHTML("beforeend",`<div class="profile-basics-grid bell-schedule-preferences"><div><label>Preferred training time</label><select id="onboardingPreferredTime"><option>Flexible</option><option>Morning</option><option>Midday</option><option>Evening</option></select></div><div><label>Schedule consistency</label><select id="onboardingScheduleReliability"><option>Very consistent</option><option selected>Mostly consistent</option><option>Changes week to week</option></select></div></div>`);
    step4.querySelector("h3").textContent="Establish your training baseline";step4.querySelector(".sub").textContent="Experience and reliable maxes help Bell select sensible loading and progression.";
    const experienceGrid=step4.querySelector(".experience-choice-grid");experienceGrid.insertAdjacentHTML("afterend",`<div class="profile-basics-grid bell-training-age"><div><label>Years of structured training <span class="optional-label">optional</span></label><input id="onboardingTrainingAge" min="0" max="70" step="0.5" type="number" placeholder="Example: 5"></div></div>`);
    const newStep=document.createElement("section");newStep.className="onboarding-step";newStep.dataset.onboardingStep="5";newStep.innerHTML=`<span class="first-flight-kicker">Flight Check 06</span><h3 id="onboardingRecoveryHeading">Recovery and training preferences</h3><p class="sub" id="onboardingRecoverySub">Readiness stays visible in either mode. Bell Coach can adapt training; Workout Planner leaves the scheduled workout unchanged.</p><div class="bell-recovery-profile-fields"><div><label>Preferred deload approach</label><select id="onboardingDeloadPreference"><option>Planned every fourth week</option><option>Follow the program</option><option data-coach-only-option>Bell decides</option><option data-coach-only-option>Only when readiness declines</option></select></div><div class="onboarding-coach-only"><label>Coaching detail</label><select id="onboardingCoachDetailLevel"><option>Concise</option><option selected>Balanced</option><option>Detailed</option></select></div><div class="onboarding-coach-only"><label>Formal check-in frequency</label><select id="onboardingCheckInFrequency"><option>Every session</option><option selected>Weekly</option><option>Every phase</option></select></div></div>`;
    const move=(node)=>{if(node)newStep.appendChild(node);};
    move($("onboardingHasLimitations")?.closest("label"));move($("onboardingLimitationsPanel"));move($("onboardingLimitationGrid"));move($("onboardingMedicalClearance"));move(step4.querySelector(".readiness-divider"));move(step4.querySelector(".onboarding-readiness-list"));move(step4.querySelector(".onboarding-coach-preference"));
    const safety=[...step4.querySelectorAll(".first-flight-callout")].pop();if(safety&&safety!==step4.querySelector("#onboardingStrengthBaseline .first-flight-callout"))move(safety);
    review.parentNode.insertBefore(newStep,review);review.dataset.onboardingStep="6";
    review.querySelector(".first-flight-kicker").textContent="Flight Check 07";review.querySelector("h3").textContent="Your Journey is ready";review.querySelector(".sub").textContent="Review the athlete profile and application-control mode before Bell builds the opening phase.";
    const note=review.querySelector(".mission-ready-note");if(note){note.querySelector("strong").textContent="Your plan includes";note.querySelector("span").textContent="Strength · Engine · Mobility · Core · Recovery";}
    renderObjectiveChoices(primaryObjective());toggleJourneyFields();updateOnboardingControlModeUI();
  }
  function updateOnboardingControlModeUI(){
    const coachMode=applicationControlMode()==="coach";
    const note=$("onboardingControlModeNote");if(note)note.textContent=coachMode?"Bell Coach can adapt daily training from readiness, performance, and feedback. You can change modes later in Settings.":"Workout Planner follows the scheduled program until you manually change it. Readiness remains visible but informational.";
    document.querySelectorAll(".onboarding-coach-only, .onboarding-coach-preference").forEach(el=>el.hidden=!coachMode);
    const timeRow=$("onboardingTimeAvailability")?.closest("label");if(timeRow)timeRow.hidden=!coachMode;
    const deload=$("onboardingDeloadPreference");
    if(deload){[...deload.options].forEach(option=>{if(option.hasAttribute("data-coach-only-option"))option.disabled=!coachMode;});if(!coachMode&&["Bell decides","Only when readiness declines"].includes(deload.value))deload.value="Planned every fourth week";}
    const heading=$("onboardingRecoveryHeading"),sub=$("onboardingRecoverySub");
    if(heading)heading.textContent=coachMode?"Recovery and coaching preferences":"Recovery and planner preferences";
    if(sub)sub.textContent=coachMode?"Bell uses readiness, limitations, and your preferences to adapt training responsibly—not to diagnose injuries.":"Readiness and limitations remain visible, but Workout Planner does not automatically reduce, replace, or reschedule the workout.";
  }
  function renderObjectiveChoices(preferred){
    const identity=selectedRadio("onboardingPrimaryGoal",primaryIdentity()),choices=objectiveOptions(identity),grid=$("onboardingObjectiveGrid"),select=$("onboardingSecondaryEmphasis");if(!grid||!select)return;
    const chosen=choices.includes(preferred)?preferred:choices[0];select.innerHTML=choices.map(x=>`<option value="${escapeHtml(x)}">${escapeHtml(x)}</option>`).join("");select.value=chosen;
    grid.innerHTML=choices.map(x=>`<label class="secondary-goal-option"><input type="radio" name="onboardingObjectiveChoice" value="${escapeHtml(x)}" ${x===chosen?"checked":""}><span><strong>${escapeHtml(x)}</strong><small>${escapeHtml(OBJECTIVE_COPY[x]||"")}</small></span></label>`).join("");
    toggleJourneyFields();renderStrengthBaselineContext();
  }
  function toggleJourneyFields(){
    const objective=selectedRadio("onboardingObjectiveChoice",$("onboardingSecondaryEmphasis")?.value||primaryObjective());if($("onboardingSecondaryEmphasis"))$("onboardingSecondaryEmphasis").value=objective;
    const eventObjective=objective==="Prepare for Competition";if(eventObjective)setRadio("onboardingJourneyMode","event_preparation");
    const mode=journeyMode();$("onboardingEventFields")?.classList.toggle("hidden",mode!=="event_preparation");
    $("onboardingGoalWeightWrap")?.classList.toggle("hidden",!["Lose Fat","Body Recomposition"].includes(objective));
    if($("onboardingSecondaryTargetDate"))$("onboardingSecondaryTargetDate").value=mode==="event_preparation"?($("onboardingEventDate")?.value||""):"";
  }
  function renderStrengthBaselineContext(){
    const identity=selectedRadio("onboardingPrimaryGoal",primaryIdentity()),box=$("onboardingStrengthBaseline");if(!box)return;
    const required=identity==="Powerlifting";box.classList.toggle("bell-required-baseline",required);
    const title=box.querySelector("h3"),copy=box.querySelector(".sub");if(title)title.textContent=required?"Enter required competition-lift maxes":"Enter useful strength baselines";
    if(copy)copy.textContent=required?"Squat, bench press, and deadlift maxes are required so Bell can calculate top sets and automatic back-off work.":"Enter recent, reliable maxes when known. Leave unfamiliar lifts blank rather than guessing.";
  }
  function updateFlightCopy(step){
    const [kicker,title,detail]=FLIGHT_COPY[clamp(step,0,6)];const subtitle=$("onboardingStepSubtitle");if(subtitle)subtitle.textContent=detail;
    const header=$("onboardingTitle");if(header)header.textContent=missionEditorActive?"Update Journey":"First Flight";
    const label=$("onboardingVersion");if(label)label.textContent=`Bell Performance ${VERSION} · ${kicker}`;
  }

  function saveFirstFlightProfileModern(){
    const name=clean($("onboardingAthleteName")?.value),age=Number($("onboardingAge")?.value),weight=Number($("onboardingBodyweight")?.value),feet=Number($("onboardingHeightFeet")?.value),inches=Number($("onboardingHeightInches")?.value);
    if(!name){alert("Enter your first name to continue.");$("onboardingAthleteName")?.focus();return false;}
    if(!(age>=8&&age<=100)){alert("Enter a valid age between 8 and 100.");$("onboardingAge")?.focus();return false;}
    if(!(weight>=50&&weight<=700)){alert("Enter a valid bodyweight between 50 and 700 lb.");$("onboardingBodyweight")?.focus();return false;}
    if(!(feet>=3&&feet<=7&&inches>=0&&inches<=11)){alert("Enter a valid height in feet and inches.");$("onboardingHeightFeet")?.focus();return false;}
    const p=profile();p.demographics={...p.demographics,firstName:name,age,sex:$("onboardingSex")?.value||"Prefer not to say",bodyweightLb:weight,heightInches:feet*12+inches,goalWeightLb:Number($("onboardingGoalWeight")?.value)||p.demographics.goalWeightLb||null};syncProfileToLegacy();return true;
  }
  function saveOnboardingBaselines(){
    const identity=selectedRadio("onboardingPrimaryGoal",primaryIdentity()),squat=Number($("onboardingSquatMax")?.value),bench=Number($("onboardingBenchMax")?.value),deadlift=Number($("onboardingDeadliftMax")?.value),pushPress=Number($("onboardingPushPressMax")?.value);
    if(identity==="Powerlifting"&&(!(squat>0)||!(bench>0)||!(deadlift>0))){alert("Powerlifting coaching requires a squat, bench press, and deadlift training max.");(!squat?$("onboardingSquatMax"):!bench?$("onboardingBenchMax"):$("onboardingDeadliftMax"))?.focus();return false;}
    const p=profile();p.experience.level=selectedRadio("onboardingExperience",p.experience.level||"Intermediate");p.experience.trainingAgeYears=Number($("onboardingTrainingAge")?.value)||null;p.baselines.maxes={squat:squat||null,bench:bench||null,deadlift:deadlift||null,pushPress:pushPress||null};syncProfileToLegacy();return true;
  }
  function saveAvailabilityPreferences(){
    const host=$("onboardingWeekdayChoices"),days=host&&typeof bellSelectedCheckboxDays==="function"?bellSelectedCheckboxDays(host):[];if(days.length<2){alert("Select at least two normal training days.");return false;}
    const p=profile();p.availability.normalDays=[...days];p.availability.sessionMinutes=Number($("onboardingSessionMinutes")?.value)||60;p.availability.preferredTime=$("onboardingPreferredTime")?.value||"Flexible";p.availability.reliability=$("onboardingScheduleReliability")?.value||"Mostly consistent";p.availability.minimumDays=Math.min(days.length,Math.max(2,Number(p.availability.minimumDays)||3));
    if(typeof bellSetNormalTrainingDays==="function")bellSetNormalTrainingDays(days);syncProfileToLegacy();return true;
  }
  function saveApplicationControlMode(){
    const mode=applicationControlMode(),p=profile();p.coaching.controlMode=mode;data.settings.appControlMode=mode;data.adaptiveTraining={...(data.adaptiveTraining||{}),enabled:mode==="coach"};return true;
  }
  function saveOnboardingJourney(buildPlan=true){
    const identity=selectedRadio("onboardingPrimaryGoal",primaryIdentity()),objective=selectedRadio("onboardingObjectiveChoice",$("onboardingSecondaryEmphasis")?.value||objectiveOptions(identity)[0]),mode=journeyMode();
    const eventName=clean($("onboardingEventName")?.value),eventDate=$("onboardingEventDate")?.value||"";
    if(mode==="event_preparation"){if(!eventName){alert("Name the event Bell is preparing you for.");$("onboardingEventName")?.focus();return false;}const weeks=weeksUntil(eventDate);if(!eventDate||!weeks||weeks<2){alert("Choose an event date at least two weeks away.");$("onboardingEventDate")?.focus();return false;}}
    const goalWeight=Number($("onboardingGoalWeight")?.value)||null;if(["Lose Fat","Body Recomposition"].includes(objective)&&goalWeight&&Number($("onboardingBodyweight")?.value)&&goalWeight===Number($("onboardingBodyweight")?.value)){alert("Goal weight should differ from current bodyweight, or leave it blank and use other milestones.");return false;}
    const p=profile(),rx=identityPrescription(identity,objective),days=Math.max(2,Number($("onboardingTrainingDays")?.value)||p.availability.normalDays?.length||rx.days),minutes=Number($("onboardingSessionMinutes")?.value)||60;
    const length=mode==="event_preparation"?(weeksUntil(eventDate)||12):continuousLength(identity,objective),name=journeyName(identity,objective,mode,eventName);
    p.identity={...p.identity,primary:identity,objective,journeyMode:mode,journeyName:name,eventName:mode==="event_preparation"?eventName:"",eventDate:mode==="event_preparation"?eventDate:""};if(goalWeight)p.demographics.goalWeightLb=goalWeight;
    data.settings.primaryTrainingIdentity=identity;data.settings.secondaryTrainingGoal=objective;data.settings.secondaryTargetDate=mode==="event_preparation"?eventDate:"";data.settings.trainingExperience=selectedRadio("onboardingExperience",p.experience.level||"Intermediate");data.settings.athleteMode=identity;
    const mission=mode==="event_preparation"?{path:"event",eventType:identity,eventName,eventDate,objective:"perform",developmentObjective:objective,experience:String(data.settings.trainingExperience||"Intermediate").toLowerCase()}:{path:"development",developmentGoal:objective,priority:objective,identity};
    data.trainingBlock={...data.trainingBlock,enabled:true,goalType:rx.strength,lengthWeeks:length,currentWeek:1,trainingDays:days,strengthDays:Math.min(rx.sd,days),runDays:Math.min(rx.ed,days),sessionMinutes:minutes,targetDate:mode==="event_preparation"?eventDate:"",secondaryGoal:objective,mission,dualGoals:{...(data.trainingBlock.dualGoals||{}),strengthGoal:rx.strength,engineMode:rx.mode,engineGoal:rx.goal,trainingCoordination:applicationControlMode()==="coach"?"Coach Decides":"Manual Planner",engineSessions:Math.min(rx.ed,days),targetValue:0}};
    data.settings.cardioType=rx.mode==="General Conditioning"?"Air Bike":rx.mode==="None / Recovery Only"?"Running":rx.mode;syncProfileToLegacy();if(buildPlan&&typeof buildCurrentWeekPlan==="function")buildCurrentWeekPlan();return true;
  }
  function saveRecoveryAndCoaching(){
    if(typeof saveOnboardingInjuryProfile==="function"&&!saveOnboardingInjuryProfile())return false;if(typeof bpSaveOnboardingReadiness==="function"&&!bpSaveOnboardingReadiness())return false;
    const p=profile();saveApplicationControlMode();p.recovery.deloadPreference=$("onboardingDeloadPreference")?.value||"Bell decides";p.recovery.limitationStatus=data.settings.injuryProfile?.hasLimitations?"active":"none";p.coaching.detailLevel=$("onboardingCoachDetailLevel")?.value||"Balanced";p.coaching.checkInFrequency=$("onboardingCheckInFrequency")?.value||"Weekly";p.coaching.style=$("onboardingMessageStyle")?.value||"Performance";p.coaching.scriptureFrequency=$("onboardingScriptureFrequency")?.value||"Occasionally";syncProfileToLegacy();return true;
  }
  function renderOnboardingReviewModern(){
    const host=$("onboardingReview");if(!host)return;const p=profile(),identity=selectedRadio("onboardingPrimaryGoal",p.identity.primary),objective=selectedRadio("onboardingObjectiveChoice",p.identity.objective),mode=journeyMode(),days=$("onboardingWeekdayChoices")&&typeof bellSelectedCheckboxDays==="function"?bellSelectedCheckboxDays($("onboardingWeekdayChoices")):p.availability.normalDays||[],eventName=clean($("onboardingEventName")?.value),eventDate=$("onboardingEventDate")?.value||"",maxes=[Number($("onboardingSquatMax")?.value)&&`Squat ${$("onboardingSquatMax").value}`,Number($("onboardingBenchMax")?.value)&&`Bench ${$("onboardingBenchMax").value}`,Number($("onboardingDeadliftMax")?.value)&&`Deadlift ${$("onboardingDeadliftMax").value}`].filter(Boolean).join(" · ");
    const coachMode=applicationControlMode()==="coach";
    host.innerHTML=`<div><span>Athlete</span><strong>${escapeHtml($("onboardingAthleteName")?.value)}</strong><small>${escapeHtml(selectedRadio("onboardingExperience","Intermediate"))} · ${escapeHtml($("onboardingAge")?.value)} years · ${escapeHtml($("onboardingBodyweight")?.value)} lb</small></div><div><span>Identity</span><strong>${escapeHtml(identity)}</strong><small>${escapeHtml(objective)}</small></div><div><span>Journey</span><strong>${escapeHtml(mode==="event_preparation"?(eventName||"Event Preparation"):journeyName(identity,objective,mode,""))}</strong><small>${mode==="event_preparation"?`Event date: ${escapeHtml(eventDate)}`:"Continuous Development · renewable phases"}</small></div><div><span>Availability</span><strong>${days.length} training days</strong><small>${escapeHtml($("onboardingSessionMinutes")?.value)}-minute sessions · ${escapeHtml($("onboardingPreferredTime")?.value||"Flexible")}</small></div><div><span>Strength baseline</span><strong>${maxes||"Build from conservative starting loads"}</strong><small>Bell can update maxes later as performance data improves.</small></div><div><span>Application control</span><strong>${coachMode?"Bell Coach":"Workout Planner"}</strong><small>${coachMode?"Readiness and feedback can adapt training":"Scheduled workouts stay fixed until you change them"}</small></div><div><span>${coachMode?"Coaching":"Planner behavior"}</span><strong>${coachMode?`${escapeHtml($("onboardingCoachDetailLevel")?.value||"Balanced")} detail`:"Manual changes only"}</strong><small>${$("onboardingHasLimitations")?.checked?"Movement limitations enabled":"No current limitations reported"}</small></div>`;
  }
  function openFirstFlightModern(startStep=null){
    const modal=$("onboardingModal");if(!modal||!modal.classList.contains("hidden"))return;captureProfileFromLegacy();const p=profile(),d=p.demographics,i=p.identity,e=p.experience,a=p.availability,b=p.baselines.maxes;
    $("onboardingAthleteName").value=d.firstName||"";$("onboardingAge").value=d.age||"";$("onboardingSex").value=d.sex||"Prefer not to say";$("onboardingBodyweight").value=d.bodyweightLb||"";$("onboardingGoalWeight").value=d.goalWeightLb||"";const height=Number(d.heightInches)||0;$("onboardingHeightFeet").value=height?Math.floor(height/12):"";$("onboardingHeightInches").value=height?height%12:"";
    setRadio("onboardingControlMode",p.coaching.controlMode||data.settings?.appControlMode||"coach");updateOnboardingControlModeUI();setRadio("onboardingPrimaryGoal",i.primary||"Performance & Health");renderObjectiveChoices(i.objective);setRadio("onboardingJourneyMode",i.journeyMode||"continuous_development");$("onboardingEventName").value=i.eventName||"";$("onboardingEventDate").value=i.eventDate||"";toggleJourneyFields();
    setRadio("onboardingExperience",e.level||"Intermediate");$("onboardingTrainingAge").value=e.trainingAgeYears||"";$("onboardingSquatMax").value=b.squat||"";$("onboardingBenchMax").value=b.bench||"";$("onboardingDeadliftMax").value=b.deadlift||"";$("onboardingPushPressMax").value=b.pushPress||"";
    $("onboardingSessionMinutes").value=String(a.sessionMinutes||60);$("onboardingPreferredTime").value=a.preferredTime||"Flexible";$("onboardingScheduleReliability").value=a.reliability||"Mostly consistent";
    if($("onboardingWeekdayChoices")&&typeof bellDayCheckboxes==="function")$("onboardingWeekdayChoices").innerHTML=bellDayCheckboxes(a.normalDays?.length?a.normalDays:(typeof bellNormalTrainingDays==="function"?bellNormalTrainingDays():[]));
    const env=data.settings.equipmentSetup?.locations?.find(x=>x.id===data.settings.equipmentSetup.activeLocationId)?.environment||"commercial";setRadio("onboardingSimpleEnvironment",env);
    if(typeof initializeOnboardingLocationEditor==="function")initializeOnboardingLocationEditor();
    if(typeof loadOnboardingInjuryProfile==="function")loadOnboardingInjuryProfile();if(typeof bpLoadOnboardingReadiness==="function")bpLoadOnboardingReadiness();
    $("onboardingDeloadPreference").value=p.recovery.deloadPreference||"Bell decides";$("onboardingCoachDetailLevel").value=p.coaching.detailLevel||"Balanced";$("onboardingCheckInFrequency").value=p.coaching.checkInFrequency||"Weekly";$("onboardingMessageStyle").value=p.coaching.style||"Performance";$("onboardingScriptureFrequency").value=p.coaching.scriptureFrequency||"Occasionally";
    onboardingStep=clamp(startStep===null?0:Number(startStep),0,6);renderOnboardingStepModern();modal.classList.remove("hidden");document.body.classList.add("modal-open");
  }
  function renderOnboardingStepModern(){
    document.querySelectorAll("[data-onboarding-step]").forEach((step,index)=>step.classList.toggle("active",index===onboardingStep));$("onboardingStepNumber").textContent=String(onboardingStep+1);$("onboardingProgress").style.width=`${((onboardingStep+1)/7)*100}%`;$("onboardingBack").disabled=onboardingStep===0;$("onboardingNext").textContent=onboardingStep===6?(missionEditorActive?"Apply Journey Changes":"Launch My Journey"):"Continue";updateFlightCopy(onboardingStep);
    if(onboardingStep===2){renderObjectiveChoices(selectedRadio("onboardingObjectiveChoice",primaryObjective()));toggleJourneyFields();}if(onboardingStep===4)renderStrengthBaselineContext();if(onboardingStep===5&&typeof bpUpdateOnboardingReadiness==="function")bpUpdateOnboardingReadiness();if(onboardingStep===6){renderOnboardingReviewModern();if(typeof syncBlockStartChoice==="function")syncBlockStartChoice();}
  }
  function validateOnboardingStepModern(){
    if(onboardingStep===0)return saveFirstFlightProfileModern();if(onboardingStep===1)return saveApplicationControlMode()&&Boolean(selectedRadio("onboardingPrimaryGoal"));if(onboardingStep===2)return saveOnboardingJourney(false);if(onboardingStep===3){if(!saveAvailabilityPreferences())return false;if(typeof bpApplyEnvironment==="function")bpApplyEnvironment();return true;}if(onboardingStep===4)return saveOnboardingBaselines();if(onboardingStep===5)return saveRecoveryAndCoaching();return true;
  }

  const SETTINGS_ROUTES={
    profile:{kicker:"Athlete",title:"Athlete Profile",description:"Personal details, training experience, and strength baselines."},
    journey:{kicker:"Program",title:"Mission & Program",description:"Review the current Journey, edit the mission, and manage the active phase."},
    training:{kicker:"Training",title:"Training Setup",description:"Set availability, locations, equipment, and workout rotation preferences."},
    health:{kicker:"Health",title:"Recovery & Nutrition",description:"Manage recovery targets, movement limitations, and nutrition settings."},
    coach:{kicker:"Bell",title:"Bell Behavior",description:"Choose between adaptive coaching and a fixed workout planner."},
    app:{kicker:"Support",title:"Help & Data",description:"Open help resources, manage backups, and review app diagnostics."}
  };
  let settingsRoute="home";
  let settingsDirectOpen=false;
  let advancedJourneyOpen=false;
  function settingsIcon(name){
    const paths={
      profile:'<circle cx="12" cy="8" r="3.2"/><path d="M5.5 20c.8-4.1 3-6.1 6.5-6.1s5.7 2 6.5 6.1"/>',
      journey:'<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="3"/><path d="M12 3.5V6M20.5 12H18M12 18v2.5M6 12H3.5"/>',
      training:'<path d="M3 9v6M6 7v10M9 6v12M15 6v12M18 7v10M21 9v6M9 12h6"/>',
      health:'<path d="M20.5 8.9c0 5.1-8.5 10.1-8.5 10.1S3.5 14 3.5 8.9A4.4 4.4 0 0 1 12 7.4a4.4 4.4 0 0 1 8.5 1.5Z"/><path d="M8.2 12h2l1.2-2.3 1.7 4 1.1-1.7h1.8"/>',
      coach:'<path d="M4 7h10M18 7h2M4 12h3M11 12h9M4 17h8M16 17h4"/><circle cx="16" cy="7" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="14" cy="17" r="2"/>',
      app:'<circle cx="12" cy="12" r="8.5"/><path d="M9.8 9.3a2.4 2.4 0 1 1 3.5 2.1c-.9.5-1.3 1-1.3 2M12 17h.01"/>'
    };
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]||paths.app}</svg>`;
  }
  function settingsHubCard(route,title,copy,statusId){return `<button class="bell1363-settings-entry" type="button" onclick="showSettingsPanel('${route}')"><span class="bell1363-settings-entry-icon">${settingsIcon(route)}</span><span class="bell1363-settings-entry-copy"><strong>${title}</strong><small>${copy}</small><em id="${statusId}">Review settings</em></span><i aria-hidden="true">›</i></button>`;}
  function createSettingsShell(){
    const screen=$("more");if(!screen||screen.dataset.bell1363Settings)return;screen.dataset.bell1363Settings="true";screen.querySelector(":scope > .bell13-page-heading")?.classList.add("hidden");screen.querySelector(":scope > .section-title")?.classList.add("hidden");screen.querySelectorAll(":scope > .settings-section-heading").forEach(x=>x.classList.add("hidden"));
    const header=document.createElement("header");header.className="bell1363-settings-page-head";header.id="bell1363SettingsHead";header.innerHTML=`<span class="metric-label">Control Center</span><h2>Settings</h2><p>Manage the athlete, the program, and how Bell behaves without digging through one long page.</p>`;
    const summary=document.createElement("section");summary.className="bell1363-settings-summary";summary.id="bell1363SettingsSummary";summary.innerHTML=`<div class="bell1363-settings-avatar" id="settingsProfileMark">A</div><div class="bell1363-settings-summary-copy"><span>Athlete profile</span><h3 id="settingsAthleteName">Athlete</h3><p><strong id="settingsIdentityOut">Performance & Health</strong><i>•</i><span id="settingsObjectiveOut">Continuous Development</span></p></div><div class="bell1363-settings-summary-meta"><span id="settingsModeSummary">Bell Coach</span><span id="settingsPhaseSummary">Foundation</span><span id="settingsCompletenessOut">0% profile</span></div><div class="bell1363-settings-progress" aria-label="Profile completion"><i id="settingsCompletenessBar"></i></div><small id="settingsCompletenessNote">Complete the athlete baseline to improve Bell's decisions.</small>`;
    const hub=document.createElement("section");hub.className="bell1363-settings-hub";hub.id="settingsHub";hub.innerHTML=`<div class="bell1363-settings-grid">${settingsHubCard("profile","Athlete Profile","Name, body metrics, experience, and strength baseline.","settingsProfileStatus")}${settingsHubCard("journey","Mission & Program","Current Journey, event, phase, and advanced program controls.","settingsJourneyStatus")}${settingsHubCard("training","Training Setup","Weekly availability, equipment, locations, and workout rotation.","settingsTrainingStatus")}${settingsHubCard("health","Recovery & Nutrition","Recovery targets, limitations, return status, and nutrition.","settingsHealthStatus")}${settingsHubCard("coach","Bell Behavior","Adaptive Bell Coach or a fixed Workout Planner.","settingsCoachStatus")}${settingsHubCard("app","Help & Data","Guides, exercise library, backups, and diagnostics.","settingsAppStatus")}</div>`;
    const detail=document.createElement("section");detail.className="bell1363-settings-detail hidden";detail.id="settingsDetail";
    const detailHeader=document.createElement("header");detailHeader.className="bell1363-settings-detail-head";detailHeader.id="settingsDetailHeader";detailHeader.innerHTML=`<button class="bell1363-settings-back" type="button" onclick="showSettingsHome()" aria-label="Return to Settings">‹ <span>Settings</span></button><div><span class="metric-label" id="settingsDetailKicker">Athlete</span><h2 id="settingsDetailTitle">Athlete Profile</h2><p id="settingsDetailDescription">Personal details and training baseline.</p></div>`;
    const panels=document.createElement("div");panels.className="bell133-settings-panels";panels.id="settingsPanels";panels.innerHTML=["profile","journey","training","recovery","nutrition","coach","app"].map(id=>`<section class="bell133-settings-panel" data-settings-panel="${id}"></section>`).join("");
    detail.append(detailHeader,panels);
    const firstDirect=[...screen.children].find(x=>!x.classList.contains("section-title")&&!x.classList.contains("settings-section-heading"));screen.insertBefore(header,firstDirect||null);screen.insertBefore(summary,firstDirect||null);screen.insertBefore(hub,firstDirect||null);screen.insertBefore(detail,firstDirect||null);
    buildModernProfileCard();buildJourneyOverviewCard();buildAvailabilityCard();buildRecoveryPreferencesCard();buildCoachControls();buildDiagnosticsCard();organizeSettingsCards();
  }
  function panel(name){return document.querySelector(`[data-settings-panel="${name}"]`);}
  function buildModernProfileCard(){
    const legacy=[...$("more").querySelectorAll(":scope > .card")].find(card=>card.querySelector("h3")?.textContent.trim()==="Athlete Profile");if(legacy)legacy.remove();
    const card=document.createElement("article");card.className="card bell133-profile-card";card.innerHTML=`<div class="bell133-card-heading"><div><span class="metric-label">Personal Baseline</span><h3>Athlete Profile</h3><p>Keep stable personal details accurate. Change identity, objective, or event through Mission & Program so Bell can rebuild safely.</p></div><button class="secondary" type="button" onclick="showSettingsPanel('journey')">Open Program</button></div><div class="bell133-form-grid"><label>First name<input id="athleteNameInput" autocomplete="given-name"></label><label>Programming profile<select id="sexInput"><option>Male</option><option>Female</option><option>Prefer not to say</option></select></label><label>Age<input id="profileAgeInput" min="8" max="100" type="number"></label><label>Height<div class="height-inputs"><input id="profileHeightFeetInput" min="3" max="7" type="number" placeholder="ft"><input id="profileHeightInchesInput" min="0" max="11" type="number" placeholder="in"></div></label><label>Current weight (lb)<input id="weightInput" min="50" max="700" step="0.1" type="number"></label><label>Goal weight (lb)<input id="goalInput" min="50" max="700" step="0.1" type="number" placeholder="Optional"></label><label>Training experience<select id="profileExperienceInput"><option>Beginner</option><option>Intermediate</option><option>Advanced</option></select></label><label>Years of structured training<input id="profileTrainingAgeInput" min="0" max="70" step="0.5" type="number" placeholder="Optional"></label></div><div class="bell133-profile-context"><div><span>Identity</span><strong id="profileIdentityContext">Performance & Health</strong></div><div><span>Objective</span><strong id="profileObjectiveContext">Continuous Development</strong></div><div><span>Current phase</span><strong id="profilePhaseContext">Foundation</strong></div></div><input id="phaseInput" type="hidden"><select id="athleteModeInput" class="hidden"><option>Performance & Health</option><option>Hybrid Athlete</option><option>Powerlifting</option><option>Bodybuilding</option><option>Tactical Athlete</option><option>Functional Fitness</option><option>Endurance Athlete</option></select><small class="hidden" id="athleteModeDescription"></small><button class="good" type="button" onclick="saveProfile()">Save Athlete Profile</button>`;panel("profile").appendChild(card);
  }
  function buildJourneyOverviewCard(){const card=document.createElement("article");card.className="card bell133-journey-settings-card";card.innerHTML=`<div class="bell133-card-heading"><div><span class="metric-label">Program Direction</span><h3 id="settingsJourneyName">Current Journey</h3><p id="settingsJourneyPurpose">Bell uses this Journey to choose phases, weekly priorities, and today's Mission.</p></div><button class="good" type="button" onclick="openMissionEditor()">Edit Mission or Event</button></div><div class="bell133-journey-metrics"><div><span>Planning mode</span><strong id="settingsJourneyMode">Continuous Development</strong></div><div><span>Current phase</span><strong id="settingsJourneyPhase">Foundation</strong></div><div><span>Phase week</span><strong id="settingsJourneyWeek">Week 1</strong></div><div><span>Next milestone</span><strong id="settingsJourneyMilestone">Foundation review</strong></div></div>`;panel("journey").appendChild(card);}
  function buildAvailabilityCard(){const card=document.createElement("article");card.className="card";card.id="trainingAvailabilityCard";card.innerHTML=`<div class="bell133-card-heading"><div><span class="metric-label">Weekly Availability</span><h3>Training Schedule</h3><p>Bell schedules formal training only on saved days and adapts when a specific week changes.</p></div><button class="secondary" type="button" onclick="bellOpenWeeklyCheckIn()">Plan Next Week</button></div><div class="bell-weekday-grid" id="settingsWeekdayChoices"></div><div class="bell133-form-grid compact"><label>Typical session length<select id="settingsSessionMinutes"><option value="45">45 minutes</option><option value="60">60 minutes</option><option value="75">75 minutes</option><option value="90">90 minutes</option></select></label><label>Preferred training time<select id="settingsPreferredTime"><option>Flexible</option><option>Morning</option><option>Midday</option><option>Evening</option></select></label><label>Schedule consistency<select id="settingsScheduleReliability"><option>Very consistent</option><option>Mostly consistent</option><option>Changes week to week</option></select></label><label>Minimum viable training days<select id="settingsMinimumDays"><option value="2">2 days</option><option value="3">3 days</option><option value="4">4 days</option><option value="5">5 days</option></select></label></div><button class="good" type="button" onclick="saveModernTrainingAvailability()">Save Training Availability</button>`;panel("training").appendChild(card);}
  function buildRecoveryPreferencesCard(){const card=document.createElement("article");card.className="card";card.innerHTML=`<div class="bell133-card-heading"><div><span class="metric-label">Recovery Preferences</span><h3>Recovery Profile</h3><p>Readiness is visible in both modes. Bell Coach may use it for adaptations; Workout Planner leaves the scheduled workout unchanged.</p></div></div><div class="bell133-form-grid compact"><label>Sleep target<select id="settingsSleepTarget"><option value="7">7 hours</option><option value="7.5">7.5 hours</option><option value="8">8 hours</option><option value="8.5">8.5 hours</option><option value="9">9 hours</option></select></label><label>Deload preference<select id="settingsDeloadPreference"><option>Planned every fourth week</option><option>Follow the program</option><option data-coach-only-option>Bell decides</option><option data-coach-only-option>Only when readiness declines</option></select></label></div><button class="secondary" type="button" onclick="saveRecoveryProfile()">Save Recovery Preferences</button>`;panel("recovery").appendChild(card);}
  function buildCoachControls(){const card=document.createElement("article");card.className="card bell133-coach-control-card";card.innerHTML=`<div class="bell133-card-heading"><div><span class="metric-label">Application Control</span><h3>Choose how Bell behaves</h3><p>Set this once and change it only when you want a different relationship with the program.</p></div></div><div class="bell1363-mode-grid"><button type="button" data-control-mode="planner" onclick="setSettingsControlMode('planner')"><span class="bell1363-mode-mark">P</span><span><strong>Workout Planner</strong><small>Fixed workouts. Bell waits for you to make changes.</small></span></button><button type="button" data-control-mode="coach" onclick="setSettingsControlMode('coach')"><span class="bell1363-mode-mark">B</span><span><strong>Bell Coach</strong><small>Readiness and progress can adapt the plan.</small></span></button></div><select id="settingsControlMode" class="hidden" onchange="updateControlModeSettingsUI()"><option value="coach">Bell Coach — adaptive</option><option value="planner">Workout Planner — fixed plan</option></select><div class="application-control-note" id="settingsControlModeNote"></div><div class="bell133-form-grid compact settings-coach-only"><label>Coaching detail<select id="settingsCoachDetail"><option>Concise</option><option>Balanced</option><option>Detailed</option></select></label><label>Formal check-ins<select id="settingsCheckInFrequency"><option>Every session</option><option>Weekly</option><option>Every phase</option></select></label><label>Message style<select id="coachMessageStyle"><option value="Performance">Performance</option><option value="Stoic">Stoic</option><option value="Faith-Based">Faith-Based</option><option value="Mixed">Mixed</option><option value="Off">Off</option></select></label><label id="scriptureFrequencyWrap">Scripture frequency<select id="scriptureFrequency"><option value="Occasionally">Occasionally</option><option value="Several">A few times per week</option><option value="Daily">Daily</option></select></label></div><button class="good" type="button" onclick="saveCoachMessagePreferences()">Save Bell Behavior</button><div class="hint settings-coach-only">Faith-based messages remain optional and never replace training rationale.</div>`;panel("coach").appendChild(card);}
  function buildDiagnosticsCard(){const card=document.createElement("article");card.className="card bell133-diagnostics-card";card.innerHTML=`<div class="bell133-card-heading"><div><span class="metric-label">System Status</span><h3>Bell Diagnostics</h3><p>Review the local profile schema and Bell Core connection before troubleshooting.</p></div></div><div class="bell133-diagnostic-grid"><div><span>App version</span><strong id="settingsAppVersion">${VERSION}</strong></div><div><span>Profile schema</span><strong id="settingsProfileSchema">v1</strong></div><div><span>Bell Core</span><strong id="settingsCoreStatus">Local mode</strong></div><div><span>Last profile update</span><strong id="settingsProfileUpdated">Not yet saved</strong></div></div>`;panel("app").appendChild(card);}
  function cardTitle(card){return clean(card.querySelector("h3")?.textContent);}
  function organizeSettingsCards(){
    const screen=$("more"),cards=[...screen.querySelectorAll(":scope > .card")];cards.forEach(card=>{const title=cardTitle(card);if(card.id==="bellCloudCard"||title==="How to Use the App"||title==="Exercise Intelligence Library"||title==="Backup"||/Cloud Coaching Connection/.test(title))panel("app").appendChild(card);else if(/Mission & Block|Dual Mission|Active Block|Mission Goals/.test(title))panel("journey").appendChild(card);else if(/Movement Limitations/.test(title))panel("recovery").appendChild(card);else if(/Training Locations|Training Rotation/.test(title))panel("training").appendChild(card);else if(/Max Lifts/.test(title))panel("profile").appendChild(card);else if(/Nutrition Setup/.test(title))panel("nutrition").appendChild(card);else if(/Coach's Message/.test(title))card.remove();});
    const dual=panel("journey").querySelector(".dual-goal-builder");if(dual){const h=dual.querySelector("h3");if(h)h.textContent="Advanced Program Controls";const hint=dual.querySelector(":scope > .hint");if(hint)hint.textContent="Fine-tune Strength and Engine exposure only when the automatic Journey prescription needs a deliberate adjustment.";}
    const advancedCards=[...panel("journey").querySelectorAll(":scope > .card")].filter(card=>/Advanced Program Controls|Active Block Control|Mission Goals/.test(cardTitle(card)));advancedCards.forEach(card=>card.classList.add("bell133-advanced-card","bell1363-advanced-card"));if(advancedCards.length&&!$("settingsAdvancedJourneyToggle")){const toggle=document.createElement("button");toggle.id="settingsAdvancedJourneyToggle";toggle.className="bell1363-advanced-toggle";toggle.type="button";toggle.setAttribute("onclick","toggleAdvancedJourneySettings()");advancedCards[0].parentNode.insertBefore(toggle,advancedCards[0]);}
    const missionCard=panel("journey").querySelector(".mission-management-card"),mission=missionCard?.querySelector("h3");if(mission)mission.textContent="Journey & Phase Management";const duplicateMissionEdit=missionCard?.querySelector('button[onclick="openMissionEditor()"]');if(duplicateMissionEdit)duplicateMissionEdit.remove();const missionActions=missionCard?.querySelector(".row.three");if(missionActions){missionActions.classList.remove("three");missionActions.classList.add("bell1363-two-actions");}
    const movement=[...panel("recovery").querySelectorAll("h3")].find(x=>x.textContent==="Movement Limitations");if(movement)movement.textContent="Movement Limitations & Return Status";
    const reviewButton=panel("recovery").querySelector('button[onclick^="openFirstFlight"]');if(reviewButton)reviewButton.setAttribute("onclick","openFirstFlight(5)");
    [...screen.querySelectorAll(":scope > p.hint")].forEach(x=>panel("app").appendChild(x));const diagnostics=panel("app").querySelector(".bell133-diagnostics-card");if(diagnostics)panel("app").appendChild(diagnostics);updateAdvancedJourneyToggle();
  }
  function updateAdvancedJourneyToggle(){const toggle=$("settingsAdvancedJourneyToggle"),cards=[...panel("journey")?.querySelectorAll(".bell1363-advanced-card")||[]];cards.forEach(card=>card.hidden=!advancedJourneyOpen);if(toggle){toggle.setAttribute("aria-expanded",String(advancedJourneyOpen));toggle.innerHTML=`<span><strong>${advancedJourneyOpen?"Hide":"Show"} advanced program controls</strong><small>Manual block, Mission goal, Strength, and Engine overrides.</small></span><i aria-hidden="true">${advancedJourneyOpen?"−":"+"}</i>`;}}
  function toggleAdvancedJourneySettings(){advancedJourneyOpen=!advancedJourneyOpen;updateAdvancedJourneyToggle();if(advancedJourneyOpen)window.requestAnimationFrame(()=>panel("journey")?.querySelector(".bell1363-advanced-card")?.scrollIntoView({behavior:"smooth",block:"start"}));}
  function renderModernSettings(){
    createSettingsShell();organizeSettingsCards();$("more")?.querySelector(":scope > .bell13-page-heading")?.classList.add("hidden");captureProfileFromLegacy();const p=profile(),d=p.demographics,i=p.identity,e=p.experience,a=p.availability,state=window.BellCoachingEngine?.getState?.({persist:false})||data.coachingState||{};
    if($("athleteNameInput"))$("athleteNameInput").value=d.firstName||"";if($("sexInput"))$("sexInput").value=d.sex||"Prefer not to say";if($("profileAgeInput"))$("profileAgeInput").value=d.age||"";const height=Number(d.heightInches)||0;if($("profileHeightFeetInput"))$("profileHeightFeetInput").value=height?Math.floor(height/12):"";if($("profileHeightInchesInput"))$("profileHeightInchesInput").value=height?height%12:"";if($("weightInput"))$("weightInput").value=d.bodyweightLb||"";if($("goalInput"))$("goalInput").value=d.goalWeightLb||"";if($("profileExperienceInput"))$("profileExperienceInput").value=e.level||"Intermediate";if($("profileTrainingAgeInput"))$("profileTrainingAgeInput").value=e.trainingAgeYears||"";if($("athleteModeInput"))$("athleteModeInput").value=i.primary||"Performance & Health";if($("phaseInput"))$("phaseInput").value=state.currentPhaseName||data.settings.phase||"Foundation";
    const score=computeCompleteness(),name=d.firstName||"Athlete",phase=state.currentPhaseName||data.settings.phase||"Foundation",mode=(p.coaching.controlMode||data.settings.appControlMode)==="planner"?"Workout Planner":"Bell Coach",days=a.normalDays?.length||0,minutes=a.sessionMinutes||60,sleep=p.recovery.sleepTargetHours||8,coreConnected=typeof bellCloudConnected==="function"&&bellCloudConnected();
    $("settingsAthleteName").textContent=name;$("settingsProfileMark").textContent=name.slice(0,1).toUpperCase();$("settingsIdentityOut").textContent=i.primary||"Performance & Health";$("settingsObjectiveOut").textContent=i.objective||"Continuous Development";$("settingsModeSummary").textContent=mode;$("settingsPhaseSummary").textContent=phase;$("settingsCompletenessOut").textContent=`${score}% profile`;$("settingsCompletenessBar").style.width=`${score}%`;$("settingsCompletenessNote").textContent=score===100?"Profile ready. Bell has the core baseline it needs.":score>=80?"Profile is strong. Add optional event or lift details when they matter.":"Complete the athlete baseline to improve Bell's decisions.";
    $("settingsProfileStatus").textContent=`${score}% complete`;$("settingsJourneyStatus").textContent=phase;$("settingsTrainingStatus").textContent=`${days||"—"} days · ${minutes} min`;$("settingsHealthStatus").textContent=`${sleep}h sleep target`;$("settingsCoachStatus").textContent=mode;$("settingsAppStatus").textContent=coreConnected?"Bell Core connected":"Local mode";
    $("profileIdentityContext").textContent=i.primary||"Performance & Health";$("profileObjectiveContext").textContent=i.objective||"Continuous Development";$("profilePhaseContext").textContent=phase;
    $("settingsJourneyName").textContent=state.journeyName||i.journeyName||journeyName(i.primary,i.objective,i.journeyMode,i.eventName);$("settingsJourneyMode").textContent=(state.mode||i.journeyMode||"continuous_development").replaceAll("_"," ").replace(/\b\w/g,x=>x.toUpperCase());$("settingsJourneyPhase").textContent=phase;$("settingsJourneyWeek").textContent=`Week ${state.phaseWeek||1} of ${state.phaseLength||1}`;$("settingsJourneyMilestone").textContent=state.nextMilestone||"Complete the current phase";$("settingsJourneyPurpose").textContent=OBJECTIVE_COPY[i.objective]||"Bell uses this Journey to choose phases, weekly priorities, and today's Mission.";
    if($("settingsWeekdayChoices")&&typeof bellDayCheckboxes==="function")$("settingsWeekdayChoices").innerHTML=bellDayCheckboxes(a.normalDays?.length?a.normalDays:(typeof bellNormalTrainingDays==="function"?bellNormalTrainingDays():[]));if($("settingsSessionMinutes"))$("settingsSessionMinutes").value=String(minutes);if($("settingsPreferredTime"))$("settingsPreferredTime").value=a.preferredTime||"Flexible";if($("settingsScheduleReliability"))$("settingsScheduleReliability").value=a.reliability||"Mostly consistent";if($("settingsMinimumDays"))$("settingsMinimumDays").value=String(a.minimumDays||3);
    if($("settingsSleepTarget"))$("settingsSleepTarget").value=String(sleep);if($("settingsDeloadPreference"))$("settingsDeloadPreference").value=p.recovery.deloadPreference||"Planned every fourth week";if($("settingsControlMode"))$("settingsControlMode").value=p.coaching.controlMode||data.settings.appControlMode||"coach";if($("settingsCoachDetail"))$("settingsCoachDetail").value=p.coaching.detailLevel||"Balanced";if($("settingsCheckInFrequency"))$("settingsCheckInFrequency").value=p.coaching.checkInFrequency||"Weekly";if($("coachMessageStyle"))$("coachMessageStyle").value=p.coaching.style||"Performance";if($("scriptureFrequency"))$("scriptureFrequency").value=p.coaching.scriptureFrequency||"Occasionally";if($("scriptureFrequencyWrap"))$("scriptureFrequencyWrap").style.display=["Faith-Based","Mixed"].includes(p.coaching.style)?"grid":"none";
    $("settingsAppVersion").textContent=String(window.BELL_APP_VERSION||VERSION).split("-")[0];$("settingsProfileSchema").textContent=`v${p.schemaVersion||1}`;$("settingsCoreStatus").textContent=coreConnected?"Connected":"Local mode";$("settingsProfileUpdated").textContent=p.updatedAt?new Date(p.updatedAt).toLocaleString():"Not yet saved";
    updateControlModeSettingsUI();updateAdvancedJourneyToggle();if(settingsRoute==="home")showSettingsHome(false);else showSettingsPanel(settingsRoute,false,false);
  }

  function saveProfileModern(){
    const name=clean($("athleteNameInput")?.value),age=Number($("profileAgeInput")?.value),feet=Number($("profileHeightFeetInput")?.value),inches=Number($("profileHeightInchesInput")?.value),weight=Number($("weightInput")?.value),goal=Number($("goalInput")?.value);
    if(!name)return alert("Enter a first name.");if(!(age>=8&&age<=100))return alert("Enter a valid age between 8 and 100.");if(!(feet>=3&&feet<=7&&inches>=0&&inches<=11))return alert("Enter a valid height.");if(!(weight>=50&&weight<=700))return alert("Enter a valid current weight.");
    const p=profile();p.demographics={...p.demographics,firstName:name,age,sex:$("sexInput")?.value||"Prefer not to say",heightInches:feet*12+inches,bodyweightLb:weight,goalWeightLb:goal||null};p.experience.level=$("profileExperienceInput")?.value||"Intermediate";p.experience.trainingAgeYears=Number($("profileTrainingAgeInput")?.value)||null;syncProfileToLegacy();saveData({render:false});syncProfileToCloud();renderApp();alert("Athlete profile saved.");
  }
  function saveModernTrainingAvailability(){
    const host=$("settingsWeekdayChoices"),days=host&&typeof bellSelectedCheckboxDays==="function"?bellSelectedCheckboxDays(host):[];if(days.length<2)return alert("Select at least two normal training days.");const p=profile();p.availability.normalDays=[...days];p.availability.sessionMinutes=Number($("settingsSessionMinutes")?.value)||60;p.availability.preferredTime=$("settingsPreferredTime")?.value||"Flexible";p.availability.reliability=$("settingsScheduleReliability")?.value||"Mostly consistent";p.availability.minimumDays=Math.min(days.length,Number($("settingsMinimumDays")?.value)||3);if(typeof bellSetNormalTrainingDays==="function")bellSetNormalTrainingDays(days);syncProfileToLegacy();if(data.trainingBlock?.enabled&&typeof buildCurrentWeekPlan==="function")buildCurrentWeekPlan();if(data.trainingBlock?.enabled&&typeof bpPrepareBlockPlan==="function"){data.trainingBlock.weeks=[];bpPrepareBlockPlan(data.trainingBlock);}saveData({render:false});syncProfileToCloud();renderApp();alert("Training availability saved. Bell rebuilt upcoming sessions around those constraints.");
  }
  function saveRecoveryProfile(){const p=profile();p.recovery.sleepTargetHours=Number($("settingsSleepTarget")?.value)||8;p.recovery.deloadPreference=$("settingsDeloadPreference")?.value||"Bell decides";syncProfileToLegacy();saveData({render:false});syncProfileToCloud();renderApp();alert("Recovery preferences saved.");}
  function setSettingsControlMode(mode){const select=$("settingsControlMode");if(!select)return;select.value=mode==="planner"?"planner":"coach";updateControlModeSettingsUI();}
  function updateControlModeSettingsUI(){
    const coachMode=$("settingsControlMode")?.value!=="planner";
    document.querySelectorAll(".settings-coach-only").forEach(el=>el.hidden=!coachMode);
    document.querySelectorAll("[data-control-mode]").forEach(button=>{const active=button.dataset.controlMode===(coachMode?"coach":"planner");button.classList.toggle("active",active);button.setAttribute("aria-pressed",String(active));});
    if($("bellMemorySettings"))$("bellMemorySettings").hidden=!coachMode;
    const note=$("settingsControlModeNote");if(note)note.textContent=coachMode?"Bell may adjust volume, load, conditioning, recovery, or scheduling when your data supports a change.":"Readiness stays visible, but workouts remain fixed until you use Modify or change the schedule.";
    const deload=$("settingsDeloadPreference");if(deload){[...deload.options].forEach(option=>{if(option.hasAttribute("data-coach-only-option"))option.disabled=!coachMode;});if(!coachMode&&["Bell decides","Only when readiness declines"].includes(deload.value))deload.value="Planned every fourth week";}
    if(typeof updateReadinessControlModeUI==="function")updateReadinessControlModeUI();
  }
  function saveCoachPreferences(){const p=profile();p.coaching.controlMode=$("settingsControlMode")?.value==="planner"?"planner":"coach";data.settings.appControlMode=p.coaching.controlMode;data.adaptiveTraining={...(data.adaptiveTraining||{}),enabled:p.coaching.controlMode==="coach"};p.coaching.detailLevel=$("settingsCoachDetail")?.value||"Balanced";p.coaching.checkInFrequency=$("settingsCheckInFrequency")?.value||"Weekly";p.coaching.style=$("coachMessageStyle")?.value||"Performance";p.coaching.scriptureFrequency=$("scriptureFrequency")?.value||"Occasionally";if(p.coaching.controlMode==="planner"&&["Bell decides","Only when readiness declines"].includes(p.recovery.deloadPreference))p.recovery.deloadPreference="Planned every fourth week";syncProfileToLegacy();saveData({render:false});syncProfileToCloud();renderApp();alert(p.coaching.controlMode==="coach"?"Bell Coach mode saved. Adaptive coaching is active.":"Workout Planner mode saved. Readiness is informational and scheduled workouts remain fixed until you change them.");}
  function showSettingsHome(scroll=true){settingsRoute="home";$("bell1363SettingsHead").hidden=false;$("bell1363SettingsSummary").hidden=false;$("settingsHub").hidden=false;$("settingsDetail").classList.add("hidden");document.querySelectorAll("[data-settings-panel]").forEach(x=>x.classList.remove("active"));if(scroll)window.requestAnimationFrame(()=>$("bell1363SettingsHead")?.scrollIntoView({behavior:"smooth",block:"start"}));}
  function showSettingsPanel(name,persist=true,scroll=true){const resolved=SETTINGS_ROUTES[name]?name:"profile",config=SETTINGS_ROUTES[resolved],activePanels=resolved==="health"?["recovery","nutrition"]:[resolved];settingsRoute=resolved;$("bell1363SettingsHead").hidden=true;$("bell1363SettingsSummary").hidden=true;$("settingsHub").hidden=true;$("settingsDetail").classList.remove("hidden");$("settingsDetailKicker").textContent=config.kicker;$("settingsDetailTitle").textContent=config.title;$("settingsDetailDescription").textContent=config.description;document.querySelectorAll("[data-settings-panel]").forEach(x=>x.classList.toggle("active",activePanels.includes(x.dataset.settingsPanel)));if(persist){data.settings.lastSettingsPanel=resolved;saveData({render:false});}if(scroll)window.requestAnimationFrame(()=>$("settingsDetailHeader")?.scrollIntoView({behavior:"smooth",block:"start"}));}

  modernizeOnboardingMarkup();captureProfileFromLegacy();createSettingsShell();
  window.bpPrimaryGoal=()=>selectedRadio("onboardingPrimaryGoal",primaryIdentity());
  window.bpPrimaryFromSaved=()=>primaryIdentity();
  window.bpPopulateSecondary=preferred=>renderObjectiveChoices(preferred||primaryObjective());
  window.saveFirstFlightProfile=saveFirstFlightProfileModern;
  window.saveOnboardingDualGoals=saveOnboardingJourney;
  window.openFirstFlight=openFirstFlightModern;
  window.renderOnboardingStep=renderOnboardingStepModern;
  window.renderOnboardingReview=renderOnboardingReviewModern;
  window.validateOnboardingStep=validateOnboardingStepModern;
  window.nextOnboardingStep=function(){if(!validateOnboardingStepModern())return;if(onboardingStep<6){onboardingStep++;renderOnboardingStepModern();return;}completeOnboarding();};
  window.previousOnboardingStep=function(){if(onboardingStep>0){onboardingStep--;renderOnboardingStepModern();}};
  window.openMissionEditor=function(){missionEditorActive=true;openFirstFlightModern(2);};
  const baseComplete=window.completeOnboarding;
  window.completeOnboarding=function(){if(!saveApplicationControlMode()||!saveOnboardingBaselines()||!saveRecoveryAndCoaching())return;const launchTour=!missionEditorActive&&!data.settings.firstFlightTourComplete;const result=baseComplete.apply(this,arguments);syncProfileToLegacy();saveData({render:false});syncProfileToCloud();if(launchTour&&typeof launchFirstFlightTour==="function")window.setTimeout(launchFirstFlightTour,350);return result;};
  const baseRenderSettings=window.renderSettings;
  window.renderSettings=function(){if(typeof baseRenderSettings==="function")baseRenderSettings.apply(this,arguments);renderModernSettings();};
  const baseShowScreen=window.showScreen;
  if(typeof baseShowScreen==="function")window.showScreen=function(name){const result=baseShowScreen.apply(this,arguments);if(name==="more"&&!settingsDirectOpen)showSettingsHome(false);return result;};
  window.saveProfile=saveProfileModern;
  window.saveModernTrainingAvailability=saveModernTrainingAvailability;
  window.saveRecoveryProfile=saveRecoveryProfile;
  window.saveCoachMessagePreferences=saveCoachPreferences;
  window.updateControlModeSettingsUI=updateControlModeSettingsUI;
  window.setSettingsControlMode=setSettingsControlMode;
  window.showSettingsHome=showSettingsHome;
  window.showSettingsPanel=showSettingsPanel;
  window.toggleAdvancedJourneySettings=toggleAdvancedJourneySettings;
  window.openAthleteProfile=function(){settingsDirectOpen=true;window.showScreen("more");settingsDirectOpen=false;showSettingsPanel("profile",false);};
  window.BellAthleteProfile={version:VERSION,identities:IDENTITIES,objectives:OBJECTIVES,get:profile,completeness:computeCompleteness,syncToLegacy:syncProfileToLegacy,renderSettings:renderModernSettings};
  document.addEventListener("change",event=>{
    if(event.target?.name==="onboardingPrimaryGoal")renderObjectiveChoices(objectiveOptions(event.target.value)[0]);
    if(event.target?.name==="onboardingObjectiveChoice"){if($("onboardingSecondaryEmphasis"))$("onboardingSecondaryEmphasis").value=event.target.value;toggleJourneyFields();}
    if(event.target?.name==="onboardingJourneyMode"||event.target?.id==="onboardingEventDate")toggleJourneyFields();
    if(event.target?.name==="onboardingControlMode")updateOnboardingControlModeUI();
    if(event.target?.id==="coachMessageStyle"&&$("scriptureFrequencyWrap"))$("scriptureFrequencyWrap").style.display=["Faith-Based","Mixed"].includes(event.target.value)?"grid":"none";
  });
  document.addEventListener("DOMContentLoaded",()=>{renderModernSettings();});
})();
