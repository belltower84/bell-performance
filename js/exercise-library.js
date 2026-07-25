"use strict";

let exerciseCatalogCache = null;
let exerciseSwapIndex = null;

const EXERCISE_OVERRIDES = {
  "Bench Press": {pattern:"Horizontal Press",primary:["Chest","Triceps"],secondary:["Front delts"],equipment:["Barbell","Bench","Rack"],role:["strength","hypertrophy"],summary:"A foundational horizontal press for upper-body strength and chest development.",setup:["Set eyes slightly behind the bar.","Plant the feet and set the shoulder blades down and back.","Use a grip that keeps the forearms vertical near the bottom."],steps:["Unrack with the upper back tight.","Lower the bar under control to the lower chest.","Press up and slightly back while maintaining leg drive and shoulder position."],cues:["Bend the bar toward your feet.","Keep the chest tall and wrists stacked.","Stop before shoulder position or bar path breaks down."],mistakes:["Elbows flaring abruptly.","Losing upper-back tension.","Bouncing the bar or lifting the hips."],start:"Upper back set, feet planted, bar over shoulders",finish:"Arms extended with ribs and shoulder blades controlled"},
  "Back Squat": {pattern:"Squat",primary:["Quadriceps","Glutes"],secondary:["Adductors","Trunk","Spinal erectors"],equipment:["Barbell","Rack"],role:["strength","hypertrophy"],summary:"A primary lower-body squat used to build total-body strength and leg size.",setup:["Set the bar securely across the upper back.","Choose a stance that allows the knees and hips to move freely.","Brace before leaving the rack."],steps:["Sit between the hips while the knees track over the feet.","Descend only as far as position remains controlled.","Drive the floor away and stand without losing the brace."],cues:["Brace 360 degrees.","Keep the whole foot connected to the floor.","Drive hips and shoulders together."],mistakes:["Collapsing the knees inward.","Losing foot pressure.","Turning the ascent into a good morning."],start:"Standing tall with bar secured and brace set",finish:"Hips and knees extended without over-arching"},
  "Deadlift": {pattern:"Hinge",primary:["Glutes","Hamstrings","Back"],secondary:["Grip","Trunk","Quadriceps"],equipment:["Barbell"],role:["strength"],summary:"A heavy hip-hinge used to build whole-body pulling strength.",setup:["Place the bar over the midfoot.","Take the grip and bring the shins to the bar.","Brace and pull slack from the bar before lifting."],steps:["Push the floor away while keeping the bar close.","Extend the hips as the bar passes the knees.","Finish tall without leaning backward."],cues:["Squeeze oranges in the armpits.","Keep the bar over the midfoot.","Push, then stand tall."],mistakes:["Jerking the bar from the floor.","Allowing the bar to drift forward.","Hyperextending at lockout."],start:"Bar over midfoot, hips set, lats tight",finish:"Standing tall with bar close and ribs stacked"},
  "Romanian Deadlift": {pattern:"Hinge",primary:["Hamstrings","Glutes"],secondary:["Back","Grip"],equipment:["Barbell"],role:["strength","hypertrophy"],summary:"A controlled hinge emphasizing hamstring length and posterior-chain tension."},
  "Push Press": {pattern:"Vertical Press",primary:["Shoulders","Triceps"],secondary:["Legs","Trunk"],equipment:["Barbell"],role:["power","strength"],summary:"An explosive overhead press that transfers force from the legs through the upper body."},
  "Weighted Pull-up": {pattern:"Vertical Pull",primary:["Lats","Upper back"],secondary:["Biceps","Grip"],equipment:["Pull-up bar","Weight belt"],role:["strength","hypertrophy"],summary:"A loaded vertical pull for upper-back and arm strength."},
  "Pull-up": {pattern:"Vertical Pull",primary:["Lats","Upper back"],secondary:["Biceps","Grip"],equipment:["Pull-up bar"],role:["strength","hypertrophy"],summary:"A bodyweight vertical pull that develops the back, arms, and grip."},
  "Chin-up": {pattern:"Vertical Pull",primary:["Lats","Biceps"],secondary:["Upper back","Grip"],equipment:["Pull-up bar"],role:["strength","hypertrophy"],summary:"A supinated-grip vertical pull with greater biceps contribution."},
  "Box Jump": {pattern:"Jump",primary:["Glutes","Quadriceps","Calves"],secondary:["Trunk"],equipment:["Plyo box"],role:["power"],summary:"A low-volume explosive jump used to develop power and landing control."},
  "Farmer Carry": {pattern:"Carry",primary:["Grip","Traps","Trunk"],secondary:["Glutes","Calves"],equipment:["Dumbbells or kettlebells"],role:["strength","conditioning"],summary:"A loaded carry that develops grip, posture, and total-body bracing."},
  "Zone 2 Run": {pattern:"Running",primary:["Cardiovascular system"],secondary:["Calves","Hamstrings","Quadriceps"],equipment:["Running shoes"],role:["conditioning"],summary:"Steady aerobic running at a sustainable conversational effort."},
  "Easy Run": {pattern:"Running",primary:["Cardiovascular system"],secondary:["Lower body"],equipment:["Running shoes"],role:["conditioning"],summary:"Comfortable running used to build aerobic capacity with low recovery cost."}
};

function titleWords(value){return String(value||"").trim().replace(/\s+/g," ");}
function normalizeExerciseName(name){return titleWords(String(name||"").replace(/^Bodyweight\s+/i,"").replace(/^Coach Review — Movement Omitted$/i,""));}

function inferExerciseMeta(name){
  const n=name.toLowerCase();
  let pattern="Accessory", primary=["General musculature"], secondary=[], equipment=["Bodyweight"], role=["hypertrophy"];
  if(/run|jog|sprint|tempo|interval|fartlek/.test(n)){pattern="Running";primary=["Cardiovascular system"];secondary=["Lower body"];equipment=["Running shoes"];role=["conditioning"]}
  else if(/rower|rowing|ski erg|bike|cycling|air bike|swim|ruck/.test(n)){pattern="Cardio Machine";primary=["Cardiovascular system"];secondary=["Total body"];equipment=[/ski/.test(n)?"Ski erg":/row/.test(n)?"Rower":/bike/.test(n)?"Bike":"Conditioning equipment"];role=["conditioning"]}
  else if(/jump|bound|hop/.test(n)){pattern="Jump";primary=["Glutes","Quadriceps","Calves"];secondary=["Trunk"];equipment=[/box/.test(n)?"Plyo box":"Bodyweight"];role=["power"]}
  else if(/squat|leg press|hack/.test(n)){pattern="Squat";primary=["Quadriceps","Glutes"];secondary=["Adductors","Trunk"];equipment=[/goblet|dumbbell/.test(n)?"Dumbbell":/hack|leg press|machine/.test(n)?"Machine":"Barbell"];role=["strength","hypertrophy"]}
  else if(/deadlift|romanian|good morning|hip thrust|glute bridge|swing|back extension/.test(n)){pattern="Hinge";primary=["Glutes","Hamstrings"];secondary=["Back","Trunk"];equipment=[/dumbbell/.test(n)?"Dumbbell":/kettlebell|swing/.test(n)?"Kettlebell":/machine|extension/.test(n)?"Machine":"Barbell"];role=["strength","hypertrophy"]}
  else if(/lunge|split squat|step-up|step up/.test(n)){pattern="Single-Leg";primary=["Quadriceps","Glutes"];secondary=["Hamstrings","Trunk"];equipment=[/smith/.test(n)?"Smith machine":/dumbbell/.test(n)?"Dumbbell":"Bodyweight or free weights"];role=["strength","hypertrophy"]}
  else if(/bench|chest press|push-up|push up|floor press|fly|pec deck|crossover/.test(n)){pattern="Horizontal Press";primary=["Chest","Triceps"];secondary=["Front delts"];equipment=[/dumbbell/.test(n)?"Dumbbell":/cable|crossover/.test(n)?"Cable":/machine|pec deck/.test(n)?"Machine":/push/.test(n)?"Bodyweight":"Barbell and bench"];role=["strength","hypertrophy"]}
  else if(/overhead press|shoulder press|push press|arnold press|landmine press/.test(n)){pattern="Vertical Press";primary=["Shoulders","Triceps"];secondary=["Upper chest","Trunk"];equipment=[/dumbbell|arnold/.test(n)?"Dumbbell":/landmine/.test(n)?"Landmine":"Barbell"];role=[/push press/.test(n)?"power":"strength","hypertrophy"]}
  else if(/pull-up|pullup|chin-up|chinup|pulldown|straight-arm pulldown/.test(n)){pattern="Vertical Pull";primary=["Lats","Upper back"];secondary=["Biceps","Grip"];equipment=[/pulldown/.test(n)?"Cable machine":"Pull-up bar"];role=["strength","hypertrophy"]}
  else if(/row|face pull|rear-delt|reverse pec deck/.test(n)){pattern="Horizontal Pull";primary=["Upper back","Rear delts"];secondary=["Biceps","Grip"];equipment=[/cable|face pull/.test(n)?"Cable":/dumbbell/.test(n)?"Dumbbell":/machine|pec deck/.test(n)?"Machine":"Barbell"];role=["strength","hypertrophy"]}
  else if(/curl/.test(n)){pattern="Elbow Flexion";primary=["Biceps","Forearms"];equipment=[/cable|bayesian/.test(n)?"Cable":/barbell|ez-bar/.test(n)?"Barbell":"Dumbbell"];role=["hypertrophy"]}
  else if(/pressdown|triceps|skull crusher|dip/.test(n)){pattern="Elbow Extension";primary=["Triceps"];secondary=["Chest","Shoulders"];equipment=[/cable|pressdown/.test(n)?"Cable":/dip/.test(n)?"Dip station":"Barbell or dumbbells"];role=["hypertrophy"]}
  else if(/lateral raise/.test(n)){pattern="Shoulder Abduction";primary=["Side delts"];secondary=["Upper traps"];equipment=[/cable/.test(n)?"Cable":/machine/.test(n)?"Machine":"Dumbbell"];role=["hypertrophy"]}
  else if(/calf/.test(n)){pattern="Calf Raise";primary=["Calves"];equipment=[/seated/.test(n)?"Seated calf machine":"Machine or free weights"];role=["hypertrophy"]}
  else if(/tibialis/.test(n)){pattern="Ankle Dorsiflexion";primary=["Tibialis anterior"];equipment=["Bodyweight or tibialis machine"];role=["hypertrophy","mobility"]}
  else if(/plank|ab wheel|crunch|knee raise/.test(n)){pattern="Core";primary=["Abdominals","Obliques"];secondary=["Hip flexors","Trunk stabilizers"];equipment=[/cable/.test(n)?"Cable":/ab wheel/.test(n)?"Ab wheel":/hanging/.test(n)?"Pull-up bar":"Bodyweight"];role=["strength"]}
  else if(/carry/.test(n)){pattern="Carry";primary=["Grip","Traps","Trunk"];secondary=["Lower body"];equipment=["Dumbbells or kettlebells"];role=["strength","conditioning"]}
  else if(/extension|curl/.test(n)){pattern="Machine Isolation";primary=[/leg extension/.test(n)?"Quadriceps":"Hamstrings"];equipment=["Machine"];role=["hypertrophy"]}
  const summary=`A ${pattern.toLowerCase()} movement used to develop ${primary.join(" and ").toLowerCase()} within Bell Performance programming.`;
  return {pattern,primary,secondary,equipment,role,summary,
    setup:[`Choose a stable setup appropriate for ${equipment.join(" or ").toLowerCase()}.`,`Use a range of motion you can control without pain.`,`Select a load that matches the prescribed effort and technique standard.`],
    steps:[`Begin from a balanced, braced position.`,`Move smoothly through the intended ${pattern.toLowerCase()} pattern.`,`Finish each repetition under control and reset before the next rep.`],
    cues:["Control the lowering phase.","Keep joints stacked and posture stable.","Stop the set when technique noticeably changes."],
    mistakes:["Using momentum instead of the target muscles.","Adding load before owning the range of motion.","Continuing through sharp pain or unstable technique."],
    start:"Stable setup with tension established",finish:"Controlled finish with posture maintained"};
}

function addExerciseName(set,name){name=normalizeExerciseName(name);if(name)set.add(name)}
function collectExerciseNames(){
  const set=new Set();
  try{Object.values(strengthRotations||{}).forEach(rotation=>Object.values(rotation).forEach(workout=>(workout.exercises||[]).forEach(ex=>addExerciseName(set,ex.name))))}catch{}
  [typeof bodybuildingVariations!=="undefined"?bodybuildingVariations:null,typeof femaleBodybuildingVariations!=="undefined"?femaleBodybuildingVariations:null].filter(Boolean).forEach(group=>Object.values(group).forEach(variants=>variants.forEach(list=>list.forEach(name=>addExerciseName(set,name)))));
  try{Object.values(conditioningTemplates||{}).forEach(template=>(template.exercises||[]).forEach(ex=>addExerciseName(set,ex.name)))}catch{}
  try{Object.values(mobilityRoutines||{}).forEach(routine=>(Array.isArray(routine)?routine:(routine.exercises||[])).forEach(ex=>addExerciseName(set,typeof ex==="string"?ex:ex.name)))}catch{}
  Object.keys(EXERCISE_OVERRIDES).forEach(name=>addExerciseName(set,name));
  return [...set].sort((a,b)=>a.localeCompare(b));
}
function exerciseRecord(name){const inferred=inferExerciseMeta(name);const override=EXERCISE_OVERRIDES[name]||{};return {name,...inferred,...override,primary:override.primary||inferred.primary,secondary:override.secondary||inferred.secondary,equipment:override.equipment||inferred.equipment,role:override.role||inferred.role}}
function exerciseCatalog(){if(!exerciseCatalogCache)exerciseCatalogCache=collectExerciseNames().map(exerciseRecord);return exerciseCatalogCache}
function findExercise(name){const normalized=normalizeExerciseName(name);return exerciseCatalog().find(item=>item.name.toLowerCase()===normalized.toLowerCase())||exerciseRecord(normalized||name)}
function openExerciseLibrary(){showScreen("exerciseLibrary");initializeExerciseFilters();renderExerciseLibrary()}
function initializeExerciseFilters(){
  const patterns=[...new Set(exerciseCatalog().map(x=>x.pattern))].sort();const equipment=[...new Set(exerciseCatalog().flatMap(x=>x.equipment))].sort();
  const p=document.getElementById("exercisePatternFilter"),e=document.getElementById("exerciseEquipmentFilter");
  if(p&&p.options.length===1)patterns.forEach(value=>p.add(new Option(value,value)));
  if(e&&e.options.length===1)equipment.forEach(value=>e.add(new Option(value,value)));
}
function renderExerciseLibrary(){
  initializeExerciseFilters();const q=(document.getElementById("exerciseLibrarySearch")?.value||"").trim().toLowerCase();const pattern=document.getElementById("exercisePatternFilter")?.value||"all";const equip=document.getElementById("exerciseEquipmentFilter")?.value||"all";const role=document.getElementById("exerciseRoleFilter")?.value||"all";
  const results=exerciseCatalog().filter(x=>(!q||[x.name,x.pattern,x.summary,...x.primary,...x.secondary,...x.equipment].join(" ").toLowerCase().includes(q))&&(pattern==="all"||x.pattern===pattern)&&(equip==="all"||x.equipment.includes(equip))&&(role==="all"||x.role.includes(role)));
  setText("exerciseLibraryCount",results.length);const grid=document.getElementById("exerciseLibraryGrid");if(!grid)return;
  grid.innerHTML=results.length?results.map(x=>`<button class="exercise-library-card" onclick="openExerciseDetail('${x.name.replace(/'/g,"\\'")}')"><span class="exercise-pattern-chip">${x.pattern}</span><h3>${x.name}</h3><p class="exercise-card-summary">${x.summary}</p><div class="exercise-tags">${x.primary.slice(0,3).map(v=>`<span>${v}</span>`).join("")}${x.equipment.slice(0,2).map(v=>`<span>${v}</span>`).join("")}</div></button>`).join(""):'<div class="card">No exercises match those filters.</div>';
}
function openExerciseDetail(name){
  const x=findExercise(name);setText("exerciseDetailTitle",x.name);const content=document.getElementById("exerciseDetailContent");if(!content)return;
  const alternatives=rankExerciseAlternatives(x.name).slice(0,5);
  content.innerHTML=`<div class="exercise-detail-hero"><span class="exercise-pattern-chip">${x.pattern}</span><p>${x.summary}</p><div class="exercise-detail-meta">${x.role.map(v=>`<span class="method-chip">${v}</span>`).join("")}</div></div><div class="movement-diagram"><div class="movement-frame"><b>START</b><span>${x.start}</span></div><div class="movement-arrow">→</div><div class="movement-frame"><b>FINISH</b><span>${x.finish}</span></div></div><div class="exercise-detail-grid"><section class="exercise-detail-section"><h3>Muscles & Equipment</h3><p><strong>Primary:</strong> ${x.primary.join(", ")}</p><p><strong>Secondary:</strong> ${x.secondary.length?x.secondary.join(", "):"Stabilizers as required"}</p><p><strong>Equipment:</strong> ${x.equipment.join(", ")}</p></section><section class="exercise-detail-section"><h3>Setup</h3><ol>${x.setup.map(v=>`<li>${v}</li>`).join("")}</ol></section><section class="exercise-detail-section"><h3>Execution</h3><ol>${x.steps.map(v=>`<li>${v}</li>`).join("")}</ol></section><section class="exercise-detail-section"><h3>Bell Cues</h3><ul>${x.cues.map(v=>`<li>${v}</li>`).join("")}</ul></section><section class="exercise-detail-section"><h3>Common Mistakes</h3><ul>${x.mistakes.map(v=>`<li>${v}</li>`).join("")}</ul></section><section class="exercise-detail-section"><h3>Purpose-Matched Alternatives</h3><ul>${alternatives.map(v=>`<li><button class="link-button" onclick="openExerciseDetail('${v.name.replace(/'/g,"\\'")}')">${v.name}</button> — ${v.reason}</li>`).join("")||"<li>No close alternatives cataloged.</li>"}</ul></section></div>`;
  document.getElementById("exerciseDetailModal")?.classList.remove("hidden");
}
function closeExerciseDetail(){document.getElementById("exerciseDetailModal")?.classList.add("hidden")}
function rankExerciseAlternatives(name,reason="preference"){
  const source=findExercise(name);const activeEquipment=(typeof activeEquipmentLocation==="function"?activeEquipmentLocation().equipment:[])||[];
  return exerciseCatalog().filter(x=>x.name!==source.name).map(x=>{let score=0;if(x.pattern===source.pattern)score+=50;score+=x.primary.filter(m=>source.primary.includes(m)).length*12;score+=x.role.filter(r=>source.role.includes(r)).length*6;if(reason==="equipment"&&activeEquipment.length){const text=x.equipment.join(" ").toLowerCase();if(activeEquipment.some(e=>text.includes(String(e).toLowerCase())))score+=15}if(reason==="skill"&&/bodyweight|machine|dumbbell/i.test(x.equipment.join(" ")))score+=8;if(reason==="setup"&&x.equipment.length===1)score+=5;return {name:x.name,score,reason:x.pattern===source.pattern?`Preserves the ${source.pattern.toLowerCase()} pattern`:`Targets ${x.primary.join(" and ").toLowerCase()}`}}).filter(x=>x.score>=45).sort((a,b)=>b.score-a.score||a.name.localeCompare(b.name));
}
function openExerciseSwap(index){exerciseSwapIndex=index;const exercise=data.activeWorkout?.exercises?.[index];if(!exercise)return;setText("exerciseSwapTitle",`Replace ${exercise.name}`);const original=document.getElementById("exerciseSwapOriginal");if(original)original.innerHTML=`<strong>Current prescription:</strong> ${exercise.name} • ${exercise.prescription}<br><span>The replacement will keep the same sets and reps unless the workout explicitly requires a different format.</span>`;document.getElementById("exerciseSwapModal")?.classList.remove("hidden");renderExerciseSwapOptions()}
function closeExerciseSwap(){document.getElementById("exerciseSwapModal")?.classList.add("hidden");exerciseSwapIndex=null}
function renderExerciseSwapOptions(){const exercise=data.activeWorkout?.exercises?.[exerciseSwapIndex];const container=document.getElementById("exerciseSwapOptions");if(!exercise||!container)return;const reason=document.getElementById("exerciseSwapReason")?.value||"preference";const options=rankExerciseAlternatives(exercise.originalExercise||exercise.name,reason).slice(0,8);container.innerHTML=options.length?options.map(x=>`<div class="exercise-swap-option"><div><h3>${x.name}</h3><p>${x.reason}. ${findExercise(x.name).equipment.join(", ")}.</p></div><button onclick="selectExerciseReplacement('${x.name.replace(/'/g,"\\'")}')">Use This</button></div>`).join(""):'<div class="performance-callout">No close match was found. Keep the current movement or review the full library.</div>'}
function selectExerciseReplacement(replacementName){
  const index=exerciseSwapIndex,exercise=data.activeWorkout?.exercises?.[index];if(!exercise)return;const originalName=exercise.originalExercise||exercise.name;const reason=document.getElementById("exerciseSwapReason")?.value||"preference";const scope=document.getElementById("exerciseSwapScope")?.value||"today";
  exercise.originalExercise=originalName;exercise.name=replacementName;exercise.userAdjusted=true;exercise.replacementReason=reason;exercise.replacementScope=scope;exercise.cue=`User-selected replacement for ${originalName}. ${findExercise(replacementName).cues[0]}`;
  if(scope!=="today"){
    data.exerciseIntelligence=data.exerciseIntelligence||{replacements:[],personalConstraints:[]};data.exerciseIntelligence.replacements=data.exerciseIntelligence.replacements||[];
    data.exerciseIntelligence.replacements=data.exerciseIntelligence.replacements.filter(r=>!(r.originalName===originalName&&r.scope===scope));
    data.exerciseIntelligence.replacements.push({originalName,replacementName,reason,scope,blockId:scope==="block"?(data.trainingBlock.generatedAt||data.trainingBlock.startDate||""):"",createdAt:new Date().toISOString()});
  }
  saveData({render:false});closeExerciseSwap();renderActiveWorkout();
}
function applySavedExerciseReplacement(exercise){
  const rules=data.exerciseIntelligence?.replacements||[];const name=exercise.originalExercise||exercise.name;const currentBlock=data.trainingBlock?.generatedAt||data.trainingBlock?.startDate||"";
  const rule=[...rules].reverse().find(r=>r.originalName===name&&(r.scope==="always"||(r.scope==="block"&&r.blockId===currentBlock)));
  if(!rule)return exercise;return {...exercise,name:rule.replacementName,originalExercise:name,userAdjusted:true,replacementReason:rule.reason,replacementScope:rule.scope,cue:`Saved replacement for ${name}. ${findExercise(rule.replacementName).cues[0]} ${exercise.cue||""}`};
}
