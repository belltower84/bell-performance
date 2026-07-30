"use strict";
/* Bell Performance 13.7.2 — First Flight & Mission Alignment */
(function(){
  const VERSION="13.7.2";
  const $=id=>document.getElementById(id);
  const clean=value=>String(value??"").replace(/\s+/g," ").trim();
  const escapeHtml=value=>clean(value).replace(/[&<>'"]/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[ch]));
  const clamp=(value,min,max)=>Math.max(min,Math.min(max,Number(value)||0));
  const selectedRadio=(name,fallback="")=>document.querySelector(`input[name="${name}"]:checked`)?.value||fallback;
  const setRadio=(name,value)=>{const input=[...document.querySelectorAll(`input[name="${name}"]`)].find(x=>String(x.value)===String(value));if(input)input.checked=true;};
  const athleteProfile=()=>window.BellAthleteProfile?.get?.()||(data.athleteProfile=data.athleteProfile||{});

  const CONTINUOUS_OBJECTIVES={
    "Performance & Health":["Lose Fat","Build Muscle","Body Recomposition","Improve Conditioning","Maintain Performance"],
    "Hybrid Athlete":["Improve Performance","Body Recomposition","Improve Conditioning","Improve Endurance","Maintain Performance"],
    "Powerlifting":["Increase Strength","Build Muscle","Body Recomposition","Maintain Performance"],
    "Bodybuilding":["Build Muscle","Body Recomposition","Lose Fat","Maintain Performance"],
    "Tactical Athlete":["Improve Performance","Improve Conditioning","Increase Strength","Maintain Performance"],
    "Functional Fitness":["Improve Performance","Improve Conditioning","Increase Strength","Maintain Performance"],
    "Endurance Athlete":["Improve Endurance","Improve Conditioning","Body Recomposition","Maintain Performance"]
  };
  const OBJECTIVE_COPY={
    "Lose Fat":"Reduce body fat while protecting muscle, strength, and training quality.",
    "Build Muscle":"Prioritize recoverable hypertrophy volume and progressive overload.",
    "Body Recomposition":"Improve muscle and body composition together at a controlled pace.",
    "Increase Strength":"Prioritize force production and measurable progress in the major lifts.",
    "Improve Conditioning":"Build aerobic capacity and repeatable work without sacrificing useful strength.",
    "Improve Performance":"Develop the physical qualities that matter most for your discipline.",
    "Improve Endurance":"Build durable aerobic capacity, threshold, and event-specific endurance.",
    "Maintain Performance":"Preserve capability with sustainable training and controlled fatigue."
  };
  const EVENT_OPTIONS={
    "Performance & Health":["5K Race","10K Race","Custom Sport Event"],
    "Hybrid Athlete":["HYROX","5K Race","10K Race","Triathlon","Custom Sport Event"],
    "Powerlifting":["Powerlifting Meet","Strongman Competition"],
    "Bodybuilding":["Bodybuilding / Physique Competition"],
    "Tactical Athlete":["Tactical Games","Military / Law-Enforcement Fitness Test","Custom Sport Event"],
    "Functional Fitness":["HYROX","CrossFit Competition","Combat Sports Tournament"],
    "Endurance Athlete":["5K Race","10K Race","Half Marathon","Marathon","Triathlon","Cycling Time Trial"]
  };
  const EVENT_COPY={
    "5K Race":"Build speed, threshold, running economy, and race-specific pacing.",
    "10K Race":"Develop aerobic durability, threshold, and controlled race-pace work.",
    "Half Marathon":"Build durable weekly volume, long-run capacity, and fueling practice.",
    "Marathon":"Progress long-run durability, race fueling, pacing, and taper readiness.",
    "Triathlon":"Coordinate swim, bike, run, brick training, and transitions.",
    "Cycling Time Trial":"Develop cycling threshold, sustained power, pacing, and event-specific endurance.",
    "HYROX":"Coordinate running, stations, strength endurance, and repeatable transitions.",
    "CrossFit Competition":"Develop event skills, strength retention, and mixed-modal repeatability.",
    "Combat Sports Tournament":"Support round capacity, strength, power, and competition recovery.",
    "Powerlifting Meet":"Peak the competition squat, bench press, and deadlift with fatigue control.",
    "Strongman Competition":"Prepare event strength, carries, loading, grip, and competition transitions.",
    "Bodybuilding / Physique Competition":"Preserve muscle, manage cardio, refine symmetry, and reduce fatigue toward show day.",
    "Tactical Games":"Develop usable strength, loaded movement, running, shooting-task support, and durability.",
    "Military / Law-Enforcement Fitness Test":"Prepare directly for the test standards while preserving strength and recovery.",
    "Custom Sport Event":"Use the event name and date to build a focused preparation timeline."
  };
  const STYLE_PREVIEWS={
    Performance:{title:"Performance",message:"Today’s priority is repeatable quality. Keep two reps in reserve, maintain position, and finish every set with the same control you started with."},
    Stoic:{title:"Stoic",message:"Control the effort in front of you. Execute the next set well, accept the day as it is, and do not waste energy negotiating with the plan."},
    "Faith-Based":{title:"Faith-Based",message:"Train with discipline and gratitude today. Steward the strength you have been given, work with purpose, and leave the outcome in God’s hands."},
    Mixed:{title:"Mixed",message:"Execute the session with discipline. Control what you can, train with purpose, and remember that steady faithfulness compounds over time."},
    Off:{title:"Off",message:"Daily coaching messages will be hidden. Workout instructions, readiness guidance, and safety notes will remain available."}
  };
  const FLIGHT_COPY=[
    ["Athlete Profile","Build the athlete baseline","Personal details and optional performance metrics help Bell start from a realistic place."],
    ["Application Control & Identity","Choose how Bell should work","Select the app behavior and the athlete identity that should shape the plan."],
    ["Journey Type","Choose the kind of development","First choose continuous development or event preparation, then choose the specific objective or event."],
    ["Availability","Build around real life","Your normal days, session length, and equipment shape the weekly plan."],
    ["Experience & Limitations","Set responsible boundaries","Training history and current limitations help Bell scale the opening phase safely."],
    ["Recovery & Communication","Set coaching preferences","Choose deload behavior and preview exactly how Bell will communicate with you."],
    ["Launch Review","Your Journey is ready","Review the complete profile before Bell builds the opening phase."]
  ];

  function identity(){return selectedRadio("onboardingPrimaryGoal",athleteProfile()?.identity?.primary||data.settings?.primaryTrainingIdentity||"Performance & Health");}
  function journeyMode(){return selectedRadio("onboardingJourneyMode",athleteProfile()?.identity?.journeyMode||"continuous_development");}
  function eventType(){return selectedRadio("onboardingEventTypeChoice",athleteProfile()?.identity?.eventType||EVENT_OPTIONS[identity()]?.[0]||"Custom Sport Event");}
  function controlMode(){return selectedRadio("onboardingControlMode",athleteProfile()?.coaching?.controlMode||data.settings?.appControlMode||"coach")==="planner"?"planner":"coach";}
  function weeksUntil(dateKey){if(!dateKey)return null;const target=new Date(`${dateKey}T12:00:00`),now=new Date();now.setHours(12,0,0,0);if(Number.isNaN(target.getTime()))return null;return Math.max(1,Math.ceil((target-now)/604800000));}
  function valueNumber(id){const raw=$(id)?.value;if(raw==null||String(raw).trim()==="")return null;const value=Number(raw);return Number.isFinite(value)&&value>0?value:NaN;}
  function identityPrescription(currentIdentity,objective,mode){
    const table={
      "Performance & Health":{strength:"Bodybuilding",engineMode:"General Conditioning",engineGoal:"work-capacity",strengthDays:3,engineDays:3,totalDays:5},
      "Hybrid Athlete":{strength:"Hybrid",engineMode:"Running",engineGoal:"work-capacity",strengthDays:4,engineDays:3,totalDays:5},
      "Powerlifting":{strength:"Powerlifting",engineMode:"None / Recovery Only",engineGoal:"recovery-only",strengthDays:4,engineDays:1,totalDays:5},
      "Bodybuilding":{strength:"Bodybuilding",engineMode:"General Conditioning",engineGoal:"work-capacity",strengthDays:5,engineDays:2,totalDays:5},
      "Tactical Athlete":{strength:"Athlete",engineMode:"Hiking / Rucking",engineGoal:"tactical",strengthDays:3,engineDays:4,totalDays:5},
      "Functional Fitness":{strength:"Olympic Lifting",engineMode:"General Conditioning",engineGoal:"crossfit",strengthDays:4,engineDays:3,totalDays:5},
      "Endurance Athlete":{strength:"Athlete",engineMode:"Running",engineGoal:"endurance",strengthDays:2,engineDays:5,totalDays:6}
    };
    const rx={...(table[currentIdentity]||table["Performance & Health"])};
    if(objective==="Build Muscle"){rx.strength="Bodybuilding";rx.strengthDays=Math.max(4,rx.strengthDays);rx.engineDays=Math.min(2,rx.engineDays);}
    if(objective==="Lose Fat"){rx.strength=currentIdentity==="Powerlifting"?"Powerlifting":"Bodybuilding";rx.engineMode="General Conditioning";rx.engineGoal="fat-loss";rx.engineDays=Math.max(3,rx.engineDays);}
    if(objective==="Increase Strength"){rx.strength=currentIdentity==="Powerlifting"?"Powerlifting":"Hybrid";rx.strengthDays=Math.max(4,rx.strengthDays);rx.engineDays=Math.min(2,rx.engineDays);}
    if(objective==="Improve Conditioning"){rx.engineMode="General Conditioning";rx.engineGoal="work-capacity";rx.engineDays=Math.max(4,rx.engineDays);}
    if(objective==="Improve Endurance"){rx.engineMode=currentIdentity==="Endurance Athlete"?"Running":rx.engineMode;rx.engineGoal="endurance";rx.engineDays=Math.max(4,rx.engineDays);}
    if(mode==="event_preparation"&&eventType()==="Cycling Time Trial"){rx.engineMode="Cycling";rx.engineGoal="cycling-event";rx.engineDays=Math.max(4,rx.engineDays);}
    return rx;
  }
  function continuousLength(currentIdentity,objective){if(objective==="Lose Fat")return 24;if(currentIdentity==="Endurance Athlete")return 20;if(currentIdentity==="Bodybuilding"||objective==="Build Muscle"||objective==="Body Recomposition")return 24;return 20;}
  function journeyName(currentIdentity,objective,mode,currentEventType,eventName){
    if(mode==="event_preparation")return clean(eventName)||currentEventType;
    const names={"Lose Fat":"Fat-Loss Transformation","Build Muscle":"Muscle-Building Journey","Body Recomposition":"Body Recomposition","Increase Strength":"Strength Development","Improve Conditioning":"Conditioning Development","Improve Endurance":"Endurance Development","Improve Performance":`${currentIdentity} Development`,"Maintain Performance":`${currentIdentity} Maintenance`};
    return names[objective]||`${currentIdentity} Development`;
  }

  function buildPerformanceBaselineMarkup(){
    return `<span class="first-flight-kicker">Performance Baseline</span><div class="baseline-heading-row"><div><h3>Current max lifts and performance markers</h3><p class="sub">Optional. Enter reliable numbers only. Bell can begin with effort-based loading when a metric is unknown.</p></div><span class="baseline-optional-badge">Optional</span></div>
      <div class="profile-basics-grid bell-primary-baselines">
        <div><label>Back Squat 1RM (lb)</label><input id="onboardingSquatMax" inputmode="decimal" min="1" placeholder="Example: 405" type="number"></div>
        <div><label>Bench Press 1RM (lb)</label><input id="onboardingBenchMax" inputmode="decimal" min="1" placeholder="Example: 275" type="number"></div>
        <div><label>Deadlift 1RM (lb)</label><input id="onboardingDeadliftMax" inputmode="decimal" min="1" placeholder="Example: 455" type="number"></div>
        <div><label>Overhead Press 1RM (lb)</label><input id="onboardingPushPressMax" inputmode="decimal" min="1" placeholder="Optional" type="number"></div>
      </div>
      <button class="secondary baseline-expand-button" id="performanceBaselineToggle" type="button" onclick="togglePerformanceBaselines()"><span>Olympic lifts and endurance metrics</span><i aria-hidden="true">+</i></button>
      <div class="performance-baseline-advanced hidden" id="performanceBaselineAdvanced">
        <div class="baseline-group"><span>Olympic weightlifting</span><div class="profile-basics-grid">
          <div><label>Snatch 1RM (lb)</label><input id="onboardingSnatchMax" inputmode="decimal" min="1" type="number" placeholder="Optional"></div>
          <div><label>Clean &amp; Jerk 1RM (lb)</label><input id="onboardingCleanJerkMax" inputmode="decimal" min="1" type="number" placeholder="Optional"></div>
          <div><label>Power Clean 1RM (lb)</label><input id="onboardingPowerCleanMax" inputmode="decimal" min="1" type="number" placeholder="Optional"></div>
          <div><label>Front Squat 1RM (lb)</label><input id="onboardingFrontSquatMax" inputmode="decimal" min="1" type="number" placeholder="Optional"></div>
        </div></div>
        <div class="baseline-group"><span>Running</span><div class="profile-basics-grid">
          <div><label>1-mile time</label><input id="onboardingMileTime" inputmode="numeric" placeholder="Example: 7:45"></div>
          <div><label>5K time</label><input id="onboarding5kTime" inputmode="numeric" placeholder="Example: 25:30"></div>
          <div><label>10K time</label><input id="onboarding10kTime" inputmode="numeric" placeholder="Example: 54:00"></div>
        </div></div>
        <div class="baseline-group"><span>Cycling and rowing</span><div class="profile-basics-grid">
          <div><label>Cycling FTP (watts)</label><input id="onboardingCyclingFtp" inputmode="decimal" min="1" type="number" placeholder="Optional"></div>
          <div><label>20K cycling time</label><input id="onboardingCycling20kTime" inputmode="numeric" placeholder="Example: 38:20"></div>
          <div><label>2,000 m row time</label><input id="onboardingRow2kTime" inputmode="numeric" placeholder="Example: 7:25"></div>
        </div></div>
      </div>
      <div class="first-flight-callout"><strong>Use a reliable baseline</strong><span>A recent true max, conservative estimated max, or verified time is useful. Leave unfamiliar metrics blank rather than guessing.</span></div>`;
  }

  function rebuildFirstFlightMarkup(){
    const modal=$("onboardingModal");if(!modal||modal.dataset.bell1372Aligned)return;modal.dataset.bell1372Aligned="true";
    const steps=[...modal.querySelectorAll("[data-onboarding-step]")];if(steps.length<7)return;
    const [step0,step1,step2,step3,step4,step5,review]=steps;
    const badge=modal.querySelector(".first-flight-step-badge span");if(badge)badge.textContent="of 7";

    step0.querySelector("h3").textContent="Build your athlete profile";
    step0.querySelector(".first-flight-welcome-sub").textContent="Give Bell the personal and performance baseline it needs to begin intelligently.";
    const sexLabel=[...step0.querySelectorAll("label")].find(label=>/Programming profile/i.test(label.textContent));if(sexLabel)sexLabel.childNodes[0].textContent="Sex";
    const profileGrid=step0.querySelector(".profile-basics-grid");
    let goalInput=$("onboardingGoalWeight");if(!goalInput){goalInput=document.createElement("input");goalInput.id="onboardingGoalWeight";goalInput.type="number";goalInput.min="50";goalInput.max="700";goalInput.step="0.1";}
    goalInput.remove();
    const goalField=document.createElement("div");goalField.className="desired-weight-field";goalField.innerHTML="<label>Desired weight (lb) <span class=\"optional-label\">optional</span></label>";goalField.appendChild(goalInput);goalInput.placeholder="Optional";profileGrid.appendChild(goalField);
    $("onboardingGoalWeightWrap")?.remove();
    const baseline=$("onboardingStrengthBaseline");if(baseline){baseline.innerHTML=buildPerformanceBaselineMarkup();profileGrid.insertAdjacentElement("afterend",baseline);}
    const reason=step0.querySelector(":scope > .first-flight-callout");if(reason){reason.querySelector("strong").textContent="Why Bell asks";reason.querySelector("span").textContent="Age, sex, height, current weight, desired weight, and reliable performance markers help set sensible volume, scaling, and starting prescriptions.";}

    step2.innerHTML=`<span class="first-flight-kicker">Flight Check 03</span><h3>How should Bell build this Journey?</h3><p class="sub">Choose the development model first. Bell will then show only the objectives or events that fit that choice.</p>
      <div class="journey-mode-grid journey-mode-first">
        <label><input checked name="onboardingJourneyMode" type="radio" value="continuous_development"><span><strong>Continuous Development</strong><small>Build through renewable phases without requiring an event date.</small></span></label>
        <label><input name="onboardingJourneyMode" type="radio" value="event_preparation"><span><strong>Event Preparation</strong><small>Build backward from a race, show, meet, competition, test, or selection date.</small></span></label>
      </div>
      <section class="journey-specific-panel" id="onboardingContinuousFields"><span class="first-flight-kicker">Development objective</span><h4>What should Bell emphasize now?</h4><div class="secondary-goal-grid bell-objective-grid" id="onboardingObjectiveGrid"></div></section>
      <section class="journey-specific-panel hidden" id="onboardingEventFields"><span class="first-flight-kicker">Event type</span><h4 id="onboardingEventHeading">What are you preparing for?</h4><div class="event-type-grid" id="onboardingEventTypeGrid"></div><div class="bell-onboarding-event-fields"><div><label id="onboardingEventNameLabel">Event name <span class="optional-label">optional</span></label><input id="onboardingEventName" placeholder="Example: Central Texas Championship"></div><div><label>Event date</label><input id="onboardingEventDate" type="date"></div></div></section>
      <select class="hidden" id="onboardingSecondaryEmphasis" aria-hidden="true"></select><input id="onboardingSecondaryTargetDate" type="hidden"><input id="onboardingStrengthGoal" type="hidden"><input id="onboardingEngineMode" type="hidden"><input id="onboardingEngineGoal" type="hidden"><input id="onboardingStrengthDays" type="hidden"><input id="onboardingEngineDays" type="hidden"><input id="onboardingBlockLength" type="hidden" value="20">
      <div class="first-flight-callout"><strong>Identity and Journey are different</strong><span>Your athlete identity stays stable. The Journey can change when the objective, competition, race, test, or life season changes.</span></div>`;

    step4.querySelector("h3").textContent="Set experience and current limitations";
    step4.querySelector(".sub").textContent="Bell uses training history and current limitations to choose responsible exercise, volume, and progression.";
    const limitationsLabel=$("onboardingHasLimitations")?.closest("label");const limitationsPanel=$("onboardingLimitationsPanel");const hiddenGrid=$("onboardingLimitationGrid");const clearance=$("onboardingMedicalClearance");
    [limitationsLabel,limitationsPanel,hiddenGrid,clearance].filter(Boolean).forEach(node=>step4.appendChild(node));
    const baselineInStep4=step4.querySelector("#onboardingStrengthBaseline");if(baselineInStep4)step0.appendChild(baselineInStep4);

    step5.innerHTML=`<span class="first-flight-kicker">Flight Check 06</span><h3 id="onboardingRecoveryHeading">Recovery and coaching preferences</h3><p class="sub" id="onboardingRecoverySub">Readiness will be collected after First Flight using the same 10-second check-in shown on the dashboard.</p>
      <div class="bell-recovery-profile-fields"><div><label>Preferred deload approach</label><select id="onboardingDeloadPreference"><option>Planned every fourth week</option><option>Follow the program</option><option data-coach-only-option>Bell decides</option><option data-coach-only-option>Only when readiness declines</option></select></div><div class="onboarding-coach-only"><label>Coaching detail</label><select id="onboardingCoachDetailLevel"><option>Concise</option><option selected>Balanced</option><option>Detailed</option></select></div><div class="onboarding-coach-only"><label>Formal check-in frequency</label><select id="onboardingCheckInFrequency"><option>Every session</option><option selected>Weekly</option><option>Every phase</option></select></div></div>
      <div class="onboarding-coach-preference"><div><label>Coaching message style</label><select id="onboardingMessageStyle"><option value="Performance">Performance</option><option value="Stoic">Stoic</option><option value="Faith-Based">Faith-Based</option><option value="Mixed">Mixed</option><option value="Off">Off</option></select></div><div id="onboardingScriptureWrap"><label>Scripture frequency</label><select id="onboardingScriptureFrequency"><option>Occasionally</option><option>Several</option><option>Daily</option></select></div></div>
      <article class="coach-style-preview" id="onboardingCoachStylePreview"><span class="metric-label">Message preview</span><strong>Performance</strong><p></p></article>
      <div class="first-flight-callout"><strong>Daily readiness comes next</strong><span>After launch, Bell will open the normal dashboard check-in. The guided tour begins after that first check-in is saved.</span></div>`;

    review.querySelector(".first-flight-kicker").textContent="Flight Check 07";review.querySelector("h3").textContent="Your Journey is ready";review.querySelector(".sub").textContent="Review the athlete profile, Journey type, event alignment, and application behavior before Bell builds the opening phase.";
    const sexSettingLabels=[...document.querySelectorAll("label")].filter(label=>/Programming profile/i.test(label.textContent));sexSettingLabels.forEach(label=>{const text=[...label.childNodes].find(node=>node.nodeType===Node.TEXT_NODE&&/Programming profile/i.test(node.textContent));if(text)text.textContent=text.textContent.replace(/Programming profile/i,"Sex");});
  }

  function renderContinuousObjectives(preferred){
    const currentIdentity=identity(),choices=CONTINUOUS_OBJECTIVES[currentIdentity]||CONTINUOUS_OBJECTIVES["Performance & Health"],grid=$("onboardingObjectiveGrid"),select=$("onboardingSecondaryEmphasis");if(!grid||!select)return;
    const chosen=choices.includes(preferred)?preferred:choices[0];
    select.innerHTML=choices.map(x=>`<option value="${escapeHtml(x)}">${escapeHtml(x)}</option>`).join("");select.value=chosen;
    grid.innerHTML=choices.map(x=>`<label class="secondary-goal-option"><input type="radio" name="onboardingObjectiveChoice" value="${escapeHtml(x)}" ${x===chosen?"checked":""}><span><strong>${escapeHtml(x)}</strong><small>${escapeHtml(OBJECTIVE_COPY[x]||"")}</small></span></label>`).join("");
  }
  function renderEventTypes(preferred){
    const currentIdentity=identity(),choices=EVENT_OPTIONS[currentIdentity]||["Custom Sport Event"],grid=$("onboardingEventTypeGrid");if(!grid)return;
    const chosen=choices.includes(preferred)?preferred:choices[0];
    grid.innerHTML=choices.map(x=>`<label><input type="radio" name="onboardingEventTypeChoice" value="${escapeHtml(x)}" ${x===chosen?"checked":""}><span><strong>${escapeHtml(x)}</strong><small>${escapeHtml(EVENT_COPY[x]||"")}</small></span></label>`).join("");
    const heading=$("onboardingEventHeading"),nameLabel=$("onboardingEventNameLabel"),placeholder=$("onboardingEventName");
    if(heading)heading.textContent=currentIdentity==="Bodybuilding"?"Which show are you preparing for?":currentIdentity==="Powerlifting"?"Which meet or competition are you preparing for?":currentIdentity==="Endurance Athlete"?"Which race or event are you preparing for?":"What event are you preparing for?";
    if(nameLabel)nameLabel.innerHTML=`${currentIdentity==="Bodybuilding"?"Show name":currentIdentity==="Powerlifting"?"Meet name":"Event name"} <span class="optional-label">optional</span>`;
    if(placeholder)placeholder.placeholder=currentIdentity==="Bodybuilding"?"Example: Texas State Championship":currentIdentity==="Powerlifting"?"Example: USPA Austin Open":"Example: Central Texas Championship";
  }
  function updateJourneyPanels(){
    const mode=journeyMode();$("onboardingContinuousFields")?.classList.toggle("hidden",mode!=="continuous_development");$("onboardingEventFields")?.classList.toggle("hidden",mode!=="event_preparation");
    if($("onboardingSecondaryTargetDate"))$("onboardingSecondaryTargetDate").value=mode==="event_preparation"?($("onboardingEventDate")?.value||""):"";
  }
  function updateCoachPreview(){
    const style=$("onboardingMessageStyle")?.value||"Performance",preview=STYLE_PREVIEWS[style]||STYLE_PREVIEWS.Performance,card=$("onboardingCoachStylePreview");if(card){card.querySelector("strong").textContent=preview.title;card.querySelector("p").textContent=preview.message;card.dataset.style=style;}
    const scripture=$("onboardingScriptureWrap");if(scripture)scripture.style.display=["Faith-Based","Mixed"].includes(style)?"grid":"none";
  }
  function updateControlMode(){
    const coach=controlMode()==="coach";document.querySelectorAll(".onboarding-coach-only, .onboarding-coach-preference, #onboardingCoachStylePreview").forEach(el=>el.hidden=!coach);
    const note=$("onboardingControlModeNote");if(note)note.textContent=coach?"Bell Coach can adapt daily training from readiness, progress, and feedback. You can change modes later in Settings.":"Workout Planner follows the scheduled program until you manually change it. Readiness remains visible but informational.";
    const deload=$("onboardingDeloadPreference");if(deload){[...deload.options].forEach(option=>{if(option.hasAttribute("data-coach-only-option"))option.disabled=!coach;});if(!coach&&["Bell decides","Only when readiness declines"].includes(deload.value))deload.value="Planned every fourth week";}
    const heading=$("onboardingRecoveryHeading"),sub=$("onboardingRecoverySub");if(heading)heading.textContent=coach?"Recovery and coaching preferences":"Recovery and planner preferences";if(sub)sub.textContent=coach?"Readiness will be collected after First Flight using the same 10-second check-in shown on the dashboard.":"Readiness remains visible after First Flight, but Workout Planner does not automatically change the scheduled workout.";
  }
  function togglePerformanceBaselines(){const panel=$("performanceBaselineAdvanced"),button=$("performanceBaselineToggle");if(!panel||!button)return;const open=panel.classList.toggle("hidden")===false;button.classList.toggle("open",open);button.querySelector("i").textContent=open?"−":"+";}

  function saveProfileAndBaselines(){
    const name=clean($("onboardingAthleteName")?.value),age=Number($("onboardingAge")?.value),weight=Number($("onboardingBodyweight")?.value),goal=Number($("onboardingGoalWeight")?.value),feet=Number($("onboardingHeightFeet")?.value),inches=Number($("onboardingHeightInches")?.value);
    if(!name){alert("Enter your first name to continue.");$("onboardingAthleteName")?.focus();return false;}if(!(age>=8&&age<=100)){alert("Enter a valid age between 8 and 100.");$("onboardingAge")?.focus();return false;}if(!(weight>=50&&weight<=700)){alert("Enter a valid current weight between 50 and 700 lb.");$("onboardingBodyweight")?.focus();return false;}if(!(feet>=3&&feet<=7&&inches>=0&&inches<=11)){alert("Enter a valid height in feet and inches.");$("onboardingHeightFeet")?.focus();return false;}if(goal&&!(goal>=50&&goal<=700)){alert("Enter a desired weight between 50 and 700 lb, or leave it blank.");$("onboardingGoalWeight")?.focus();return false;}
    const numericIds=["onboardingSquatMax","onboardingBenchMax","onboardingDeadliftMax","onboardingPushPressMax","onboardingSnatchMax","onboardingCleanJerkMax","onboardingPowerCleanMax","onboardingFrontSquatMax","onboardingCyclingFtp"];
    const invalid=numericIds.find(id=>Number.isNaN(valueNumber(id)));if(invalid){alert("Enter a positive performance value or leave the field blank.");$(invalid)?.focus();return false;}
    const p=athleteProfile();p.demographics={...(p.demographics||{}),firstName:name,age,sex:$("onboardingSex")?.value||"Prefer not to say",heightInches:feet*12+inches,bodyweightLb:weight,goalWeightLb:goal||null};p.baselines=p.baselines||{};p.baselines.maxes={...(p.baselines.maxes||{}),squat:valueNumber("onboardingSquatMax"),bench:valueNumber("onboardingBenchMax"),deadlift:valueNumber("onboardingDeadliftMax"),pushPress:valueNumber("onboardingPushPressMax"),overheadPress:valueNumber("onboardingPushPressMax"),snatch:valueNumber("onboardingSnatchMax"),cleanJerk:valueNumber("onboardingCleanJerkMax"),powerClean:valueNumber("onboardingPowerCleanMax"),frontSquat:valueNumber("onboardingFrontSquatMax")};p.baselines.endurance={...(p.baselines.endurance||{}),mileTime:clean($("onboardingMileTime")?.value)||null,fiveKTime:clean($("onboarding5kTime")?.value)||null,tenKTime:clean($("onboarding10kTime")?.value)||null,cyclingFtp:valueNumber("onboardingCyclingFtp"),cycling20kTime:clean($("onboardingCycling20kTime")?.value)||null,row2kTime:clean($("onboardingRow2kTime")?.value)||null};
    data.settings.athleteName=name;data.settings.sex=p.demographics.sex;data.settings.weight=weight;data.settings.goal=goal||null;data.settings.maxes={...(data.settings.maxes||{}),...p.baselines.maxes};data.nutrition.age=age;data.nutrition.height=feet*12+inches;window.BellAthleteProfile?.syncToLegacy?.();return true;
  }
  function saveIdentityAndControl(){
    const currentIdentity=identity(),mode=controlMode();if(!currentIdentity)return false;const p=athleteProfile();p.identity=p.identity||{};p.identity.primary=currentIdentity;p.coaching=p.coaching||{};p.coaching.controlMode=mode;data.settings.primaryTrainingIdentity=currentIdentity;data.settings.athleteMode=currentIdentity;data.settings.appControlMode=mode;data.adaptiveTraining={...(data.adaptiveTraining||{}),enabled:mode==="coach"};window.BellAthleteProfile?.syncToLegacy?.();return true;
  }
  function saveJourney(buildPlan=false){
    const currentIdentity=identity(),mode=journeyMode(),objective=mode==="event_preparation"?"Prepare for Competition":selectedRadio("onboardingObjectiveChoice",CONTINUOUS_OBJECTIVES[currentIdentity]?.[0]),currentEventType=eventType(),eventName=clean($("onboardingEventName")?.value),eventDate=$("onboardingEventDate")?.value||"";
    if(mode==="event_preparation"){const weeks=weeksUntil(eventDate);if(!currentEventType){alert("Choose the event type Bell should prepare for.");return false;}if(!eventDate||!weeks||weeks<2){alert("Choose an event date at least two weeks away.");$("onboardingEventDate")?.focus();return false;}}
    const p=athleteProfile(),rx=identityPrescription(currentIdentity,objective,mode),days=Math.max(2,Number($("onboardingTrainingDays")?.value)||p.availability?.normalDays?.length||rx.totalDays),minutes=Number($("onboardingSessionMinutes")?.value)||60,length=mode==="event_preparation"?(weeksUntil(eventDate)||12):continuousLength(currentIdentity,objective),name=journeyName(currentIdentity,objective,mode,currentEventType,eventName);
    p.identity={...(p.identity||{}),primary:currentIdentity,objective,journeyMode:mode,journeyName:name,eventType:mode==="event_preparation"?currentEventType:"",eventName:mode==="event_preparation"?(eventName||currentEventType):"",eventDate:mode==="event_preparation"?eventDate:""};
    data.settings.primaryTrainingIdentity=currentIdentity;data.settings.secondaryTrainingGoal=objective;data.settings.secondaryTargetDate=mode==="event_preparation"?eventDate:"";data.settings.athleteMode=currentIdentity;
    const mission=mode==="event_preparation"?{path:"event",eventType:currentEventType,eventName:eventName||currentEventType,eventDate,objective:"perform",developmentObjective:objective,identity:currentIdentity,experience:String(data.settings.trainingExperience||"Intermediate").toLowerCase()}:{path:"development",developmentGoal:objective,priority:objective,identity:currentIdentity};
    data.trainingBlock={...(data.trainingBlock||{}),enabled:true,goalType:rx.strength,lengthWeeks:length,currentWeek:1,trainingDays:days,strengthDays:Math.min(rx.strengthDays,days),runDays:Math.min(rx.engineDays,days),sessionMinutes:minutes,targetDate:mode==="event_preparation"?eventDate:"",secondaryGoal:objective,mission,dualGoals:{...(data.trainingBlock?.dualGoals||{}),strengthGoal:rx.strength,engineMode:rx.engineMode,engineGoal:rx.engineGoal,trainingCoordination:controlMode()==="coach"?"Coach Decides":"Manual Planner",engineSessions:Math.min(rx.engineDays,days),targetValue:0}};
    data.settings.cardioType=rx.engineMode==="General Conditioning"?"Air Bike":rx.engineMode==="None / Recovery Only"?"Running":rx.engineMode;window.BellAthleteProfile?.syncToLegacy?.();if(buildPlan&&typeof buildCurrentWeekPlan==="function")buildCurrentWeekPlan();return true;
  }
  function saveAvailability(){
    const host=$("onboardingWeekdayChoices"),days=host&&typeof bellSelectedCheckboxDays==="function"?bellSelectedCheckboxDays(host):[];if(days.length<2){alert("Select at least two normal training days.");return false;}const p=athleteProfile();p.availability=p.availability||{};p.availability.normalDays=[...days];p.availability.sessionMinutes=Number($("onboardingSessionMinutes")?.value)||60;p.availability.preferredTime=$("onboardingPreferredTime")?.value||"Flexible";p.availability.reliability=$("onboardingScheduleReliability")?.value||"Mostly consistent";p.availability.minimumDays=Math.min(days.length,Math.max(2,Number(p.availability.minimumDays)||3));if(typeof bellSetNormalTrainingDays==="function")bellSetNormalTrainingDays(days);if(typeof bpApplyEnvironment==="function")bpApplyEnvironment();window.BellAthleteProfile?.syncToLegacy?.();return true;
  }
  function saveExperienceAndLimitations(){
    const p=athleteProfile();p.experience=p.experience||{};p.experience.level=selectedRadio("onboardingExperience",p.experience.level||"Intermediate");p.experience.trainingAgeYears=Number($("onboardingTrainingAge")?.value)||null;data.settings.trainingExperience=p.experience.level;if(typeof saveOnboardingInjuryProfile==="function"&&!saveOnboardingInjuryProfile())return false;window.BellAthleteProfile?.syncToLegacy?.();return true;
  }
  function savePreferences(){
    const p=athleteProfile();p.recovery=p.recovery||{};p.coaching=p.coaching||{};p.recovery.deloadPreference=$("onboardingDeloadPreference")?.value||"Bell decides";p.recovery.limitationStatus=data.settings.injuryProfile?.hasLimitations?"active":"none";p.coaching.controlMode=controlMode();p.coaching.detailLevel=$("onboardingCoachDetailLevel")?.value||"Balanced";p.coaching.checkInFrequency=$("onboardingCheckInFrequency")?.value||"Weekly";p.coaching.style=$("onboardingMessageStyle")?.value||"Performance";p.coaching.scriptureFrequency=$("onboardingScriptureFrequency")?.value||"Occasionally";data.settings.coachMessages={...(data.settings.coachMessages||{}),style:p.coaching.style,scriptureFrequency:p.coaching.scriptureFrequency};window.BellAthleteProfile?.syncToLegacy?.();return true;
  }
  function validatePowerliftingBaseline(){if(identity()!=="Powerlifting")return true;const missing=[["onboardingSquatMax","Back Squat"],["onboardingBenchMax","Bench Press"],["onboardingDeadliftMax","Deadlift"]].find(([id])=>!(Number($(id)?.value)>0));if(!missing)return true;alert(`Powerlifting programming requires a reliable ${missing[1]} training max. Return to Athlete Profile and enter it.`);onboardingStep=0;renderOnboardingStep();window.setTimeout(()=>$(missing[0])?.focus(),100);return false;}

  function scrollFirstFlightTop(){
    const body=document.querySelector(".first-flight-body"),box=document.querySelector(".first-flight-box"),active=document.querySelector(".onboarding-step.active");if(body)body.scrollTop=0;if(box)box.scrollTop=0;const heading=active?.querySelector("h3,h2");if(heading){heading.tabIndex=-1;try{heading.focus({preventScroll:true});}catch(_){}}window.requestAnimationFrame(()=>{if(body)body.scrollTo({top:0,behavior:"instant"});if(box)box.scrollTo({top:0,behavior:"instant"});});
  }
  function updateFlightHeader(step){const [kicker,,detail]=FLIGHT_COPY[clamp(step,0,6)];if($("onboardingVersion"))$("onboardingVersion").textContent=`Bell Performance ${VERSION} · ${kicker}`;if($("onboardingStepSubtitle"))$("onboardingStepSubtitle").textContent=detail;if($("onboardingTitle"))$("onboardingTitle").textContent=missionEditorActive?"Update Journey":"First Flight";}
  function renderReview(){
    const host=$("onboardingReview");if(!host)return;const p=athleteProfile(),currentIdentity=identity(),mode=journeyMode(),objective=mode==="event_preparation"?"Event Preparation":selectedRadio("onboardingObjectiveChoice",p.identity?.objective||"Continuous Development"),currentEventType=eventType(),eventName=clean($("onboardingEventName")?.value),eventDate=$("onboardingEventDate")?.value||"",days=$("onboardingWeekdayChoices")&&typeof bellSelectedCheckboxDays==="function"?bellSelectedCheckboxDays($("onboardingWeekdayChoices")):p.availability?.normalDays||[];
    const maxes=[["Squat","onboardingSquatMax"],["Bench","onboardingBenchMax"],["Deadlift","onboardingDeadliftMax"],["OHP","onboardingPushPressMax"]].filter(([,id])=>Number($(id)?.value)>0).map(([label,id])=>`${label} ${$(id).value}`).join(" · ");
    const endurance=[["Mile","onboardingMileTime"],["5K","onboarding5kTime"],["10K","onboarding10kTime"],["Row 2K","onboardingRow2kTime"]].filter(([,id])=>clean($(id)?.value)).map(([label,id])=>`${label} ${clean($(id).value)}`).join(" · ");
    const coach=controlMode()==="coach";
    host.innerHTML=`<div><span>Athlete</span><strong>${escapeHtml($("onboardingAthleteName")?.value)}</strong><small>${escapeHtml(selectedRadio("onboardingExperience","Intermediate"))} · ${escapeHtml($("onboardingAge")?.value)} years · ${escapeHtml($("onboardingBodyweight")?.value)} lb${Number($("onboardingGoalWeight")?.value)>0?` → ${escapeHtml($("onboardingGoalWeight").value)} lb desired`:""}</small></div>
      <div><span>Identity</span><strong>${escapeHtml(currentIdentity)}</strong><small>${coach?"Bell Coach":"Workout Planner"}</small></div>
      <div><span>Journey</span><strong>${escapeHtml(mode==="event_preparation"?(eventName||currentEventType):objective)}</strong><small>${mode==="event_preparation"?`${escapeHtml(currentEventType)} · ${escapeHtml(eventDate)}`:"Continuous Development · renewable phases"}</small></div>
      <div><span>Availability</span><strong>${days.length} training days</strong><small>${escapeHtml($("onboardingSessionMinutes")?.value)}-minute sessions · ${escapeHtml($("onboardingPreferredTime")?.value||"Flexible")}</small></div>
      <div><span>Performance baseline</span><strong>${maxes||endurance||"Effort-based starting prescriptions"}</strong><small>${maxes&&endurance?escapeHtml(endurance):"Metrics can be updated later in Athlete Settings."}</small></div>
      <div><span>Limitations</span><strong>${$("onboardingHasLimitations")?.checked?"Movement modifications enabled":"None reported"}</strong><small>Bell will preserve the stated boundaries throughout the plan.</small></div>
      <div><span>Coaching style</span><strong>${coach?escapeHtml($("onboardingMessageStyle")?.value||"Performance"):"Messages off in Workout Planner"}</strong><small>${coach?`${escapeHtml($("onboardingCoachDetailLevel")?.value||"Balanced")} detail · readiness adapts training`:"Readiness is informational"}</small></div>`;
  }
  function renderStep(){
    document.querySelectorAll("[data-onboarding-step]").forEach((step,index)=>step.classList.toggle("active",index===onboardingStep));if($("onboardingStepNumber"))$("onboardingStepNumber").textContent=String(onboardingStep+1);if($("onboardingProgress"))$("onboardingProgress").style.width=`${((onboardingStep+1)/7)*100}%`;if($("onboardingBack"))$("onboardingBack").disabled=onboardingStep===0;if($("onboardingNext"))$("onboardingNext").textContent=onboardingStep===6?(missionEditorActive?"Apply Journey Changes":"Launch My Journey"):"Continue";updateFlightHeader(onboardingStep);
    if(onboardingStep===2){renderContinuousObjectives(selectedRadio("onboardingObjectiveChoice",athleteProfile()?.identity?.objective));renderEventTypes(eventType());updateJourneyPanels();}
    if(onboardingStep===5){updateControlMode();updateCoachPreview();}
    if(onboardingStep===6){renderReview();if(typeof syncBlockStartChoice==="function")syncBlockStartChoice();}
    scrollFirstFlightTop();
  }
  function validateStep(){if(onboardingStep===0)return saveProfileAndBaselines();if(onboardingStep===1)return saveIdentityAndControl();if(onboardingStep===2)return saveJourney(false);if(onboardingStep===3)return saveAvailability();if(onboardingStep===4)return saveExperienceAndLimitations();if(onboardingStep===5)return savePreferences();return validatePowerliftingBaseline();}
  function nextStep(){if(!validateStep())return;if(onboardingStep<6){onboardingStep++;renderStep();return;}completeFirstFlight();}
  function previousStep(){if(onboardingStep>0){onboardingStep--;renderStep();}}

  function loadProfileIntoFirstFlight(){
    const p=athleteProfile(),d=p.demographics||{},i=p.identity||{},e=p.experience||{},a=p.availability||{},maxes=p.baselines?.maxes||{},endurance=p.baselines?.endurance||{};
    $("onboardingAthleteName").value=d.firstName||data.settings?.athleteName||"";$("onboardingAge").value=d.age||data.nutrition?.age||"";$("onboardingSex").value=d.sex||data.settings?.sex||"Prefer not to say";$("onboardingBodyweight").value=d.bodyweightLb||data.settings?.weight||"";$("onboardingGoalWeight").value=d.goalWeightLb||data.settings?.goal||"";const h=Number(d.heightInches||data.nutrition?.height)||0;$("onboardingHeightFeet").value=h?Math.floor(h/12):"";$("onboardingHeightInches").value=h?h%12:"";
    const baselineValues={onboardingSquatMax:maxes.squat,onboardingBenchMax:maxes.bench,onboardingDeadliftMax:maxes.deadlift,onboardingPushPressMax:maxes.overheadPress||maxes.pushPress,onboardingSnatchMax:maxes.snatch,onboardingCleanJerkMax:maxes.cleanJerk,onboardingPowerCleanMax:maxes.powerClean,onboardingFrontSquatMax:maxes.frontSquat,onboardingMileTime:endurance.mileTime,onboarding5kTime:endurance.fiveKTime,onboarding10kTime:endurance.tenKTime,onboardingCyclingFtp:endurance.cyclingFtp,onboardingCycling20kTime:endurance.cycling20kTime,onboardingRow2kTime:endurance.row2kTime};Object.entries(baselineValues).forEach(([id,value])=>{if($(id))$(id).value=value||"";});
    setRadio("onboardingControlMode",p.coaching?.controlMode||data.settings?.appControlMode||"coach");setRadio("onboardingPrimaryGoal",i.primary||data.settings?.primaryTrainingIdentity||"Performance & Health");renderContinuousObjectives(i.journeyMode==="event_preparation"?CONTINUOUS_OBJECTIVES[identity()]?.[0]:i.objective);setRadio("onboardingJourneyMode",i.journeyMode||"continuous_development");renderEventTypes(i.eventType);$("onboardingEventName").value=i.eventName&&i.eventName!==i.eventType?i.eventName:"";$("onboardingEventDate").value=i.eventDate||"";updateJourneyPanels();
    setRadio("onboardingExperience",e.level||data.settings?.trainingExperience||"Intermediate");if($("onboardingTrainingAge"))$("onboardingTrainingAge").value=e.trainingAgeYears||"";if($("onboardingSessionMinutes"))$("onboardingSessionMinutes").value=String(a.sessionMinutes||data.trainingBlock?.sessionMinutes||60);if($("onboardingPreferredTime"))$("onboardingPreferredTime").value=a.preferredTime||"Flexible";if($("onboardingScheduleReliability"))$("onboardingScheduleReliability").value=a.reliability||"Mostly consistent";
    if($("onboardingWeekdayChoices")&&typeof bellDayCheckboxes==="function")$("onboardingWeekdayChoices").innerHTML=bellDayCheckboxes(a.normalDays?.length?a.normalDays:(typeof bellNormalTrainingDays==="function"?bellNormalTrainingDays():[]));const env=data.settings?.equipmentSetup?.locations?.find(x=>x.id===data.settings.equipmentSetup.activeLocationId)?.environment||"commercial";setRadio("onboardingSimpleEnvironment",env);if(typeof initializeOnboardingLocationEditor==="function")initializeOnboardingLocationEditor();if(typeof loadOnboardingInjuryProfile==="function")loadOnboardingInjuryProfile();
    if($("onboardingDeloadPreference"))$("onboardingDeloadPreference").value=p.recovery?.deloadPreference||"Bell decides";if($("onboardingCoachDetailLevel"))$("onboardingCoachDetailLevel").value=p.coaching?.detailLevel||"Balanced";if($("onboardingCheckInFrequency"))$("onboardingCheckInFrequency").value=p.coaching?.checkInFrequency||"Weekly";if($("onboardingMessageStyle"))$("onboardingMessageStyle").value=p.coaching?.style||data.settings?.coachMessages?.style||"Performance";if($("onboardingScriptureFrequency"))$("onboardingScriptureFrequency").value=p.coaching?.scriptureFrequency||data.settings?.coachMessages?.scriptureFrequency||"Occasionally";updateControlMode();updateCoachPreview();
  }
  function openFirstFlightAligned(startStep=null){const modal=$("onboardingModal");if(!modal||!modal.classList.contains("hidden"))return;loadProfileIntoFirstFlight();onboardingStep=clamp(startStep===null?0:Number(startStep),0,6);renderStep();modal.classList.remove("hidden");document.body.classList.add("modal-open");scrollFirstFlightTop();}

  function completeFirstFlight(){
    if(!saveProfileAndBaselines()||!saveIdentityAndControl()||!saveJourney(false)||!saveAvailability()||!saveExperienceAndLimitations()||!savePreferences()||!validatePowerliftingBaseline())return;
    if(typeof saveOnboardingEquipment==="function")saveOnboardingEquipment();
    const previousBlock=typeof bpClone==="function"?bpClone(data.trainingBlock):JSON.parse(JSON.stringify(data.trainingBlock||{})),hadActive=Boolean(previousBlock?.enabled),isEditing=Boolean(missionEditorActive),choice=typeof selectedBlockStartChoice==="function"?selectedBlockStartChoice():"today",startDate=choice==="nextMonday"&&typeof bpFollowingMondayKey==="function"?bpFollowingMondayKey():todayKey(),candidate=typeof bpClone==="function"?bpClone(data.trainingBlock):JSON.parse(JSON.stringify(data.trainingBlock||{}));
    candidate.startDate=startDate;candidate.currentWeek=1;candidate.generatedAt=new Date().toISOString();candidate.status=choice==="nextMonday"?"scheduled":"active";candidate.enabled=choice!=="nextMonday";
    const wasFirstSetup=!data.settings.coachMessages?.setupComplete;data.settings.coachMessages={...(data.settings.coachMessages||{}),setupComplete:true,style:$("onboardingMessageStyle")?.value||"Performance",scriptureFrequency:$("onboardingScriptureFrequency")?.value||"Occasionally"};data.settings.firstFlightStage="complete";data.settings.firstFlightTourComplete=wasFirstSetup?false:Boolean(data.settings.firstFlightTourComplete);data.settings.pendingFirstFlightTour=wasFirstSetup;data.settings.firstBlockLaunchMode=choice;
    if(choice==="nextMonday"){
      data.upcomingTrainingBlock={...candidate,enabled:true,status:"scheduled"};if(typeof bpPrepareBlockPlan==="function")bpPrepareBlockPlan(data.upcomingTrainingBlock);if(hadActive)data.trainingBlock=previousBlock;else{data.trainingBlock={enabled:false,status:"scheduled",currentWeek:0};data.plan=[];}
    }else{
      if(hadActive&&isEditing&&typeof bpArchiveBlock==="function")bpArchiveBlock(previousBlock,"mission_updated");data.trainingBlock={...candidate,enabled:true,status:"active",activatedAt:new Date().toISOString()};data.upcomingTrainingBlock=null;if(typeof bpPrepareBlockPlan==="function")bpPrepareBlockPlan(data.trainingBlock);if(typeof bpLoadActiveWeekFromPlan==="function")bpLoadActiveWeekFromPlan();else if(typeof buildCurrentWeekPlan==="function")buildCurrentWeekPlan();
    }
    window.BellAthleteProfile?.syncToLegacy?.();saveData({render:false});$("onboardingModal")?.classList.add("hidden");document.body.classList.remove("modal-open");renderApp();showScreen("home");window.scrollTo(0,0);missionEditorActive=false;
    if(wasFirstSetup){window.setTimeout(()=>{if(typeof openDailyReadiness==="function")openDailyReadiness();else $("dailyReadinessModal")?.classList.remove("hidden");},220);}else{alert(choice==="nextMonday"?`Your updated Journey is scheduled for ${typeof bpDateLabel==="function"?bpDateLabel(startDate):startDate}.`:`Your updated Journey starts today. Prior history was preserved.`);}
  }

  rebuildFirstFlightMarkup();
  window.togglePerformanceBaselines=togglePerformanceBaselines;
  window.openFirstFlight=openFirstFlightAligned;
  window.renderOnboardingStep=renderStep;
  window.renderOnboardingReview=renderReview;
  window.validateOnboardingStep=validateStep;
  window.nextOnboardingStep=nextStep;
  window.previousOnboardingStep=previousStep;
  window.completeOnboarding=completeFirstFlight;
  window.openMissionEditor=function(){missionEditorActive=true;openFirstFlightAligned(2);};
  window.saveOnboardingDualGoals=saveJourney;
  window.BellFirstFlight1372={version:VERSION,events:EVENT_OPTIONS,saveJourney,renderReview};

  document.addEventListener("change",event=>{
    if(event.target?.name==="onboardingPrimaryGoal"){renderContinuousObjectives(CONTINUOUS_OBJECTIVES[identity()]?.[0]);renderEventTypes(EVENT_OPTIONS[identity()]?.[0]);updateJourneyPanels();}
    if(event.target?.name==="onboardingJourneyMode"){updateJourneyPanels();}
    if(event.target?.name==="onboardingObjectiveChoice"&&$("onboardingSecondaryEmphasis"))$("onboardingSecondaryEmphasis").value=event.target.value;
    if(event.target?.id==="onboardingEventDate"&&$("onboardingSecondaryTargetDate"))$("onboardingSecondaryTargetDate").value=event.target.value;
    if(event.target?.name==="onboardingControlMode")updateControlMode();
    if(event.target?.id==="onboardingMessageStyle")updateCoachPreview();
  });
})();
