"use strict";

const EQUIPMENT_OPTIONS = [
  ["barbell","Barbell & plates"],["rack","Squat rack"],["bench","Adjustable bench"],["dumbbells","Dumbbells"],
  ["cables","Cable station"],["machines","Selectorized machines"],["smith","Smith machine"],["kettlebells","Kettlebells"],
  ["bands","Resistance bands"],["suspension","Suspension trainer"],["medicineBall","Medicine ball"],["sandbag","Sandbag"],
  ["weightVest","Weight vest"],["pullupBar","Pull-up bar"],["dipStation","Dip station"],["rings","Gymnastics rings"],
  ["plyoBox","Plyometric box"],["treadmill","Treadmill"],["bike","Stationary bike"],["rower","Rower"],
  ["skiErg","Ski erg"],["sled","Sled"],["airBike","Air bike"],["jumpRope","Jump rope"],["outdoor","Outdoor running access"]
];

const EQUIPMENT_PRESETS = {
  commercial:["barbell","rack","bench","dumbbells","cables","machines","smith","kettlebells","bands","medicineBall","pullupBar","dipStation","plyoBox","treadmill","bike","rower","skiErg","sled","airBike","jumpRope","outdoor"],
  home:["barbell","rack","bench","dumbbells","kettlebells","bands","pullupBar","plyoBox","jumpRope","outdoor"],
  minimal:["dumbbells","kettlebells","bands","jumpRope","outdoor"],
  bodyweight:["outdoor"],
  travel:["bands","jumpRope","outdoor"]
};

function normalizeEquipmentSettings(){
  const fallback={locations:[{id:"default",name:"My Gym",environment:"commercial",equipment:[...EQUIPMENT_PRESETS.commercial]}],activeLocationId:"default"};
  data.settings.equipmentSetup=data.settings.equipmentSetup||fallback;
  if(!Array.isArray(data.settings.equipmentSetup.locations)||!data.settings.equipmentSetup.locations.length)data.settings.equipmentSetup.locations=fallback.locations;
  data.settings.equipmentSetup.locations=data.settings.equipmentSetup.locations.map((x,i)=>({id:x.id||`location-${i+1}`,name:x.name||`Location ${i+1}`,environment:x.environment||"custom",equipment:Array.isArray(x.equipment)?x.equipment:[]}));
  if(!data.settings.equipmentSetup.locations.some(x=>x.id===data.settings.equipmentSetup.activeLocationId))data.settings.equipmentSetup.activeLocationId=data.settings.equipmentSetup.locations[0].id;
}
function activeEquipmentLocation(){normalizeEquipmentSettings();return data.settings.equipmentSetup.locations.find(x=>x.id===data.settings.equipmentSetup.activeLocationId)||data.settings.equipmentSetup.locations[0];}
function hasEquipment(key){return activeEquipmentLocation().equipment.includes(key);}
function hasAnyEquipment(keys){return keys.some(hasEquipment);}
function exerciseRequirements(name){
  if(/Barbell|Bench Press|Back Squat|Front Squat|Deadlift|Good Morning|Pendlay|Push Press|Overhead Press|Landmine|Rack Pull|Hip Thrust/.test(name)) return ["barbell"];
  if(/Dumbbell|Arnold Press|Goblet/.test(name)) return ["dumbbells"];
  if(/Kettlebell/.test(name)) return ["kettlebells"];
  if(/Cable|Pulldown|Pressdown|Face Pull/.test(name)) return ["cables"];
  if(/Leg Extension|Hamstring Curl|Hack Squat|Machine|Pec Deck|Seated Calf/.test(name)) return ["machines"];
  if(/Pull-up|Chin-up|Hanging Knee/.test(name)) return ["pullupBar"];
  if(/Dip/.test(name)) return ["dipStation"];
  if(/Box Jump|Step-up/.test(name)) return ["plyoBox"];
  if(/Sled/.test(name)) return ["sled"];
  return [];
}
const EXERCISE_SWAPS={
  "Bench Press":[["dumbbells","Flat Dumbbell Press"],["bands","Banded Push-up"],["bodyweight","Push-up"]],
  "Paused Bench Press":[["dumbbells","Paused Dumbbell Press"],["bands","Tempo Banded Push-up"],["bodyweight","Tempo Push-up"]],
  "Close-Grip Bench Press":[["dumbbells","Neutral-Grip Dumbbell Press"],["bands","Close-Grip Banded Push-up"],["bodyweight","Close-Grip Push-up"]],
  "Incline Barbell Press":[["dumbbells","Incline Dumbbell Press"],["bands","Feet-Elevated Banded Push-up"],["bodyweight","Feet-Elevated Push-up"]],
  "Back Squat":[["dumbbells","Double-Dumbbell Front Squat"],["kettlebells","Double-Kettlebell Front Squat"],["bands","Banded Split Squat"],["bodyweight","Tempo Bulgarian Split Squat"]],
  "Tempo Back Squat":[["dumbbells","Tempo Goblet Squat"],["kettlebells","Tempo Goblet Squat"],["bands","Tempo Banded Squat"],["bodyweight","Tempo Split Squat"]],
  "Speed Back Squat":[["dumbbells","Dumbbell Jump Squat"],["kettlebells","Kettlebell Jump Squat"],["bodyweight","Jump Squat"]],
  "Front Squat":[["dumbbells","Double-Dumbbell Front Squat"],["kettlebells","Double-Kettlebell Front Squat"],["bands","Banded Front Squat"],["bodyweight","Rear-Foot-Elevated Split Squat"]],
  "Deadlift":[["dumbbells","Dumbbell Romanian Deadlift"],["kettlebells","Kettlebell Deadlift"],["bands","Banded Romanian Deadlift"],["bodyweight","Single-Leg Hip Hinge"]],
  "Trap-Bar Deadlift":[["dumbbells","Heavy Dumbbell Deadlift"],["kettlebells","Double-Kettlebell Deadlift"],["bands","Banded Deadlift"],["bodyweight","Single-Leg Hip Hinge"]],
  "Romanian Deadlift":[["dumbbells","Dumbbell Romanian Deadlift"],["kettlebells","Kettlebell Romanian Deadlift"],["bands","Banded Romanian Deadlift"],["bodyweight","Single-Leg Romanian Deadlift"]],
  "Good Morning":[["dumbbells","Dumbbell Romanian Deadlift"],["kettlebells","Kettlebell Good Morning"],["bands","Banded Good Morning"],["bodyweight","Tempo Hip Hinge"]],
  "Weighted Pull-up":[["pullupBar","Pull-up"],["dumbbells","Dumbbell Pullover"],["bands","Band Lat Pulldown"],["bodyweight","Prone Lat Pull"]],
  "Weighted Chin-up":[["pullupBar","Chin-up"],["dumbbells","Dumbbell Pullover"],["bands","Band Lat Pulldown"],["bodyweight","Prone Lat Pull"]],
  "Neutral-Grip Lat Pulldown":[["pullupBar","Neutral-Grip Pull-up"],["bands","Band Lat Pulldown"],["dumbbells","Dumbbell Pullover"],["bodyweight","Prone Lat Pull"]],
  "Chest-Supported Row":[["dumbbells","Chest-Supported Dumbbell Row"],["bands","Seated Band Row"],["kettlebells","Kettlebell Row"],["bodyweight","Prone W Raise"]],
  "Pendlay Row":[["dumbbells","Dumbbell Bent-Over Row"],["kettlebells","Double-Kettlebell Row"],["bands","Band Row"],["bodyweight","Prone W Raise"]],
  "Cable Row":[["dumbbells","One-Arm Dumbbell Row"],["bands","Seated Band Row"],["kettlebells","One-Arm Kettlebell Row"],["bodyweight","Prone W Raise"]],
  "Leg Extension":[["bands","Band Leg Extension"],["dumbbells","Heel-Elevated Goblet Squat"],["kettlebells","Heel-Elevated Goblet Squat"],["bodyweight","Reverse Nordic Curl"]],
  "Hamstring Curl":[["bands","Band Hamstring Curl"],["bodyweight","Slider Hamstring Curl"]],
  "Rope Pressdown":[["bands","Band Pressdown"],["dumbbells","Dumbbell Skull Crusher"],["bodyweight","Diamond Push-up"]],
  "Cable Lateral Raise":[["dumbbells","Dumbbell Lateral Raise"],["bands","Band Lateral Raise"],["bodyweight","Wall Lateral Raise Isometric"]],
  "Box Jump":[["plyoBox","Box Jump"],["bodyweight","Broad Jump"]],
  "Kettlebell Swing":[["dumbbells","Dumbbell Swing"],["bands","Band Hip Hinge"],["bodyweight","Broad Jump"]]
};
function modalityKeyAvailable(key){if(key==="bodyweight")return true;return hasEquipment(key);}
const INJURY_PATTERN_LABELS={overheadPress:"overhead pressing",horizontalPress:"horizontal pressing",pulling:"pulling or hanging",squat:"squatting",lunge:"lunging or single-leg work",hinge:"hinging or deadlifting",running:"running or impact",jumping:"jumping or landing"};
function exerciseMovementPatterns(name){
  const patterns=[];
  if(/Push Press|Overhead Press|Arnold Press|Landmine Press|Overhead Triceps|Shoulder Press/.test(name))patterns.push("overheadPress");
  if(/Bench Press|Dumbbell Press|Barbell Press|Push-up|Pec Deck|Chest Press/.test(name)&&!/Overhead/.test(name))patterns.push("horizontalPress");
  if(/Pull-up|Chin-up|Pulldown|Row|Pullover|Face Pull|Hanging/.test(name))patterns.push("pulling");
  if(/Squat|Leg Extension|Reverse Nordic/.test(name))patterns.push("squat");
  if(/Lunge|Split Squat|Step-up|Single-Leg/.test(name))patterns.push("lunge");
  if(/Deadlift|Romanian|Good Morning|Hip Hinge|Swing|Rack Pull/.test(name))patterns.push("hinge");
  if(/Run|Sprint|Jog|Hill Repeat/.test(name))patterns.push("running");
  if(/Jump|Bound|Plyo/.test(name))patterns.push("jumping");
  return [...new Set(patterns)];
}
function restrictedMovementPatterns(){const p=data.settings.injuryProfile||{};return p.hasLimitations?new Set(p.restrictedPatterns||[]):new Set();}
function injuryFallbackCandidates(pattern){
  const map={
    overheadPress:[["horizontalPress","Neutral-Grip Dumbbell Floor Press","dumbbells"],["horizontalPress","Incline Push-up","bodyweight"],["pulling","Chest-Supported Row","dumbbells"]],
    horizontalPress:[["overheadPress","Half-Kneeling Landmine Press","barbell"],["pulling","Chest-Supported Row","dumbbells"]],
    pulling:[["horizontalPress","Neutral-Grip Dumbbell Floor Press","dumbbells"],["overheadPress","Half-Kneeling Landmine Press","barbell"]],
    squat:[["hinge","Glute Bridge","bodyweight"],["hinge","Hip Thrust","barbell"]],
    lunge:[["squat","Box Squat","bodyweight"],["hinge","Glute Bridge","bodyweight"]],
    hinge:[["squat","Box Squat","bodyweight"],["lunge","Supported Split Squat","bodyweight"]],
    running:[["conditioning","Stationary Bike","bike"],["conditioning","Air Bike","airBike"],["conditioning","Rower","rower"]],
    jumping:[["conditioning","Bike Sprint","bike"],["conditioning","Sled Push","sled"],["squat","Fast Box Squat","bodyweight"]]
  };return map[pattern]||[];
}
function adaptExerciseToInjuries(exercise){
  const restricted=restrictedMovementPatterns();if(!restricted.size)return {...exercise,injuryAdjusted:false};
  const hit=exerciseMovementPatterns(exercise.name).find(x=>restricted.has(x));if(!hit)return {...exercise,injuryAdjusted:false};
  const pick=injuryFallbackCandidates(hit).find(([candidatePattern,,equipment])=>!restricted.has(candidatePattern)&&modalityKeyAvailable(equipment));
  const original=exercise.originalExercise||exercise.name;
  if(!pick)return {...exercise,name:"Coach Review — Movement Omitted",sets:0,reps:"—",cue:`${original} was removed because ${INJURY_PATTERN_LABELS[hit]} is restricted. Use only a clinician-approved, pain-free alternative.`,injuryAdjusted:true,originalExercise:original,restrictedPattern:hit};
  return {...exercise,name:pick[1],cue:`Adjusted for your ${INJURY_PATTERN_LABELS[hit]} restriction. Stop if symptoms appear. ${exercise.cue||""}`,injuryAdjusted:true,originalExercise:original,restrictedPattern:hit};
}
function equipmentLabelForKey(key){const item=EQUIPMENT_OPTIONS.find(([id])=>id===key);return item?item[1]:String(key||"equipment");}
function adaptExerciseToEquipment(exercise){
  const req=exerciseRequirements(exercise.name);
  if(!req.length||hasAnyEquipment(req))return {...exercise,equipmentAdjusted:false,equipmentAdjustmentReason:"",requiredEquipment:req};
  const location=activeEquipmentLocation();
  const missing=req.filter(key=>!hasEquipment(key));
  const missingLabel=(missing.length?missing:req).map(equipmentLabelForKey).join(", ");
  const candidates=EXERCISE_SWAPS[exercise.name]||[];
  const pick=candidates.find(([key])=>modalityKeyAvailable(key));
  const original=exercise.originalExercise||exercise.name;
  if(!pick)return {...exercise,name:`Bodyweight ${exercise.name}`,reps:exercise.reps,cue:`Equipment-aware fallback. Use controlled tempo and train close to technical failure. ${exercise.cue||""}`,equipmentAdjusted:true,originalExercise:original,requiredEquipment:req,equipmentLocation:location.name,equipmentAdjustmentReason:`${missingLabel} unavailable at ${location.name}.`};
  return {...exercise,name:pick[1],cue:`Substituted for ${exercise.name} at ${location.name}. ${exercise.cue||""}`,equipmentAdjusted:true,originalExercise:original,requiredEquipment:req,equipmentLocation:location.name,equipmentAdjustmentReason:`${missingLabel} unavailable at ${location.name}.`};
}
function applyEquipmentToTemplate(template){const location=activeEquipmentLocation();return {...template,equipmentLocation:location.name,exercises:template.exercises.map(adaptExerciseToEquipment).map(adaptExerciseToInjuries)}};let equipmentEditingLocationId="";
let equipmentDraftLocationId="";
function equipmentCheckboxesHtml(prefix,onchange=""){
  const handler=onchange||(prefix==="equipment"?"updateEquipmentSelectionCount()":"");
  const change=handler?` onchange="${handler}"`:"";
  return EQUIPMENT_OPTIONS.map(([id,label])=>`<label class="equipment-option"><input type="checkbox" id="${prefix}-${id}" value="${id}"${change}> <span>${label}</span></label>`).join("");
}
function setEquipmentChecks(prefix,items){EQUIPMENT_OPTIONS.forEach(([id])=>{const el=document.getElementById(`${prefix}-${id}`);if(el)el.checked=items.includes(id);});}
function readEquipmentChecks(prefix){return EQUIPMENT_OPTIONS.map(([id])=>id).filter(id=>document.getElementById(`${prefix}-${id}`)?.checked);}
function applyEquipmentPreset(prefix,value){setEquipmentChecks(prefix,EQUIPMENT_PRESETS[value]||[]);if(prefix==="equipment")updateEquipmentSelectionCount();}
function equipmentEscape(value){return String(value??"").replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[char]);}
function equipmentEnvironmentLabel(value){return ({commercial:"Commercial gym",home:"Home gym",minimal:"Minimal equipment",bodyweight:"Bodyweight only",travel:"Travel",custom:"Custom"})[value]||"Custom";}
function equipmentEditorLocation(){normalizeEquipmentSettings();return data.settings.equipmentSetup.locations.find(x=>x.id===equipmentEditingLocationId)||null;}
function equipmentNames(location){const selected=new Set(location?.equipment||[]);return EQUIPMENT_OPTIONS.filter(([id])=>selected.has(id)).map(([,label])=>label);}
function equipmentSummaryText(location){const names=equipmentNames(location);if(!names.length)return "No equipment selected";const visible=names.slice(0,3).join(", ");return names.length>3?`${visible} +${names.length-3}`:visible;}
function renderEquipmentLocationTable(){
  const host=document.getElementById("equipmentLocationTable");if(!host)return;
  normalizeEquipmentSettings();const setup=data.settings.equipmentSetup,active=activeEquipmentLocation();
  host.innerHTML=`<div class="bell1364-equipment-table-head" aria-hidden="true"><span>Location</span><span>Setup</span><span>Equipment</span><span>Actions</span></div>${setup.locations.map(location=>{
    const isActive=location.id===active.id,isDraft=location.id===equipmentDraftLocationId,id=equipmentEscape(location.id),name=equipmentEscape(location.name),environment=equipmentEscape(equipmentEnvironmentLabel(location.environment)),summary=equipmentEscape(equipmentSummaryText(location));
    const badge=isActive?'<span>Active</span>':isDraft?'<span class="draft">Unsaved</span>':'';
    return `<div class="bell1364-equipment-row ${isActive?"active":""} ${isDraft?"draft":""}"><div class="bell1364-equipment-location"><strong>${name}</strong>${badge}</div><div class="bell1364-equipment-environment">${environment}</div><div class="bell1364-equipment-summary"><strong>${location.equipment.length} items</strong><small>${summary}</small></div><div class="bell1364-equipment-row-actions">${isActive||isDraft?'':`<button class="secondary small-button" type="button" onclick="setActiveEquipmentLocation('${id}')">Use</button>`}<button class="secondary small-button" type="button" onclick="editEquipmentLocation('${id}')">Edit</button></div></div>`;
  }).join("")}`;
}
function updateEquipmentSelectionCount(){const count=readEquipmentChecks("equipment").length;const out=document.getElementById("equipmentSelectionCount");if(out)out.textContent=`${count} selected`;}
function renderEquipmentSettings(){
  normalizeEquipmentSettings();const setup=data.settings.equipmentSetup,active=activeEquipmentLocation();
  const select=document.getElementById("activeLocationInput");if(select){select.innerHTML=setup.locations.map(x=>`<option value="${equipmentEscape(x.id)}">${equipmentEscape(x.name)}</option>`).join("");select.value=active.id;}
  const quick=document.getElementById("activeLocationQuick");if(quick){quick.innerHTML=setup.locations.map(x=>`<option value="${equipmentEscape(x.id)}">${equipmentEscape(x.name)}</option>`).join("");quick.value=active.id;}
  renderEquipmentLocationTable();
  const editor=document.getElementById("equipmentEditor"),editing=equipmentEditorLocation();
  if(editor&&!editor.classList.contains("hidden")&&editing){
    const name=document.getElementById("equipmentLocationName");if(name)name.value=editing.name;
    const env=document.getElementById("equipmentEnvironment");if(env)env.value=editing.environment||"custom";
    const title=document.getElementById("equipmentEditorTitle");if(title)title.textContent=`Edit ${editing.name}`;
    setEquipmentChecks("equipment",editing.equipment);updateEquipmentSelectionCount();
  }
  const label=document.getElementById("activeLocationLabel");if(label)label.textContent=active.name;
  const summary=document.getElementById("equipmentSummary");if(summary)summary.textContent=`${active.name}: ${active.equipment.length} equipment options available. Workouts will substitute unavailable movements automatically.`;
}
function setActiveEquipmentLocation(id){normalizeEquipmentSettings();if(!data.settings.equipmentSetup.locations.some(x=>x.id===id))return;data.settings.equipmentSetup.activeLocationId=id;saveData();renderEquipmentSettings();}
function switchEquipmentLocation(id){setActiveEquipmentLocation(id);}
function loadEquipmentLocation(){const select=document.getElementById("activeLocationInput");if(select)setActiveEquipmentLocation(select.value);}
function editEquipmentLocation(id){normalizeEquipmentSettings();if(!data.settings.equipmentSetup.locations.some(x=>x.id===id))return;equipmentEditingLocationId=id;const editor=document.getElementById("equipmentEditor");if(editor)editor.classList.remove("hidden");renderEquipmentSettings();window.requestAnimationFrame(()=>editor?.scrollIntoView({behavior:"smooth",block:"nearest"}));}
function cancelEquipmentEdit(){
  normalizeEquipmentSettings();
  if(equipmentDraftLocationId&&equipmentEditingLocationId===equipmentDraftLocationId){data.settings.equipmentSetup.locations=data.settings.equipmentSetup.locations.filter(x=>x.id!==equipmentDraftLocationId);equipmentDraftLocationId="";}
  equipmentEditingLocationId="";document.getElementById("equipmentEditor")?.classList.add("hidden");renderEquipmentLocationTable();
}
function saveEquipmentLocation(){
  normalizeEquipmentSettings();const location=equipmentEditorLocation();if(!location)return;
  location.name=document.getElementById("equipmentLocationName")?.value.trim()||location.name;
  location.environment=document.getElementById("equipmentEnvironment")?.value||"custom";
  location.equipment=readEquipmentChecks("equipment");
  if(equipmentDraftLocationId===location.id)equipmentDraftLocationId="";
  equipmentEditingLocationId="";document.getElementById("equipmentEditor")?.classList.add("hidden");saveData();renderEquipmentSettings();alert("Training location saved. Future workouts will adapt automatically.");
}
function addEquipmentLocation(){
  normalizeEquipmentSettings();
  if(equipmentDraftLocationId)data.settings.equipmentSetup.locations=data.settings.equipmentSetup.locations.filter(x=>x.id!==equipmentDraftLocationId);
  const id=`location-${Date.now()}`;data.settings.equipmentSetup.locations.push({id,name:`Location ${data.settings.equipmentSetup.locations.length+1}`,environment:"minimal",equipment:[...EQUIPMENT_PRESETS.minimal]});equipmentDraftLocationId=id;equipmentEditingLocationId=id;editEquipmentLocation(id);
}
function deleteEquipmentLocation(){
  normalizeEquipmentSettings();if(data.settings.equipmentSetup.locations.length<=1){alert("Keep at least one training location.");return;}
  const location=equipmentEditorLocation();if(!location)return;if(!confirm(`Delete ${location.name}?`))return;
  data.settings.equipmentSetup.locations=data.settings.equipmentSetup.locations.filter(x=>x.id!==location.id);
  if(data.settings.equipmentSetup.activeLocationId===location.id)data.settings.equipmentSetup.activeLocationId=data.settings.equipmentSetup.locations[0].id;
  if(equipmentDraftLocationId===location.id)equipmentDraftLocationId="";
  equipmentEditingLocationId="";document.getElementById("equipmentEditor")?.classList.add("hidden");saveData();renderEquipmentSettings();
}
function selectAllEquipment(){setEquipmentChecks("equipment",EQUIPMENT_OPTIONS.map(([id])=>id));updateEquipmentSelectionCount();}
function clearEquipmentSelection(){setEquipmentChecks("equipment",[]);updateEquipmentSelectionCount();}
function saveOnboardingEquipment(){
  if(!onboardingLocations.length) initializeOnboardingLocationEditor();
  data.settings.equipmentSetup={
    locations:onboardingLocations.map(location=>({id:location.id,name:location.name,environment:location.environment,equipment:[...location.equipment]})),
    activeLocationId:onboardingActiveLocationId||onboardingLocations[0].id
  };
  normalizeEquipmentSettings();
}

let onboardingLocations=[];
let onboardingEditingLocationId="";
let onboardingActiveLocationId="";

function uniqueLocationId(){return `location-${Date.now()}-${Math.random().toString(36).slice(2,7)}`;}
function defaultLocationName(environment){return environment==="commercial"?"Commercial Gym":environment==="home"?"Home Gym":environment==="minimal"?"Minimal Setup":environment==="bodyweight"?"Bodyweight / Outdoors":environment==="travel"?"Travel Setup":"Training Location";}
function currentOnboardingLocation(){return onboardingLocations.find(x=>x.id===onboardingEditingLocationId)||onboardingLocations[0];}
function initializeOnboardingLocationEditor(){
  normalizeEquipmentSettings();
  onboardingLocations=data.settings.equipmentSetup.locations.map(x=>({id:x.id||uniqueLocationId(),name:x.name||"Training Location",environment:x.environment||"custom",equipment:[...(x.equipment||[])]}));
  if(!onboardingLocations.length)onboardingLocations=[{id:"default",name:"Commercial Gym",environment:"commercial",equipment:[...EQUIPMENT_PRESETS.commercial]}];
  onboardingActiveLocationId=data.settings.equipmentSetup.activeLocationId||onboardingLocations[0].id;
  onboardingEditingLocationId=onboardingActiveLocationId;
  renderOnboardingLocationEditor();
}
function renderOnboardingLocationEditor(){
  const list=document.getElementById("onboardingLocationList"); if(!list)return;
  list.innerHTML=onboardingLocations.map(location=>`<button type="button" class="onboarding-location-item ${location.id===onboardingEditingLocationId?"active":""}" onclick="editOnboardingLocation('${location.id}')"><span>${escapeHtml(location.name||"Unnamed Location")}</span><small>${location.id===onboardingActiveLocationId?"Primary • ":""}${location.equipment.length} items</small></button>`).join("");
  const location=currentOnboardingLocation(); if(!location)return;
  document.getElementById("onboardingLocationName").value=location.name;
  document.getElementById("onboardingEnvironment").value=location.environment||"custom";
  document.getElementById("onboardingActiveLocation").checked=location.id===onboardingActiveLocationId;
  setEquipmentChecks("onboardingEquipment",location.equipment);
  document.getElementById("onboardingEquipmentCount").textContent=`${location.equipment.length} selected`;
  document.getElementById("removeOnboardingLocationButton").disabled=onboardingLocations.length<=1;
}
function editOnboardingLocation(id){syncOnboardingEquipmentFromChecks();onboardingEditingLocationId=id;renderOnboardingLocationEditor();}
function addOnboardingLocation(){
  syncOnboardingEquipmentFromChecks();
  const id=uniqueLocationId(); onboardingLocations.push({id,name:`Location ${onboardingLocations.length+1}`,environment:"minimal",equipment:[...EQUIPMENT_PRESETS.minimal]});
  onboardingEditingLocationId=id; renderOnboardingLocationEditor();
  document.getElementById("onboardingLocationName")?.focus();
}
function removeOnboardingLocation(){
  if(onboardingLocations.length<=1)return;
  const location=currentOnboardingLocation();
  onboardingLocations=onboardingLocations.filter(x=>x.id!==location.id);
  if(onboardingActiveLocationId===location.id)onboardingActiveLocationId=onboardingLocations[0].id;
  onboardingEditingLocationId=onboardingLocations[0].id;renderOnboardingLocationEditor();
}
function updateOnboardingLocationName(value){const location=currentOnboardingLocation();if(!location)return;location.name=value.trimStart();renderOnboardingLocationListOnly();}
function renderOnboardingLocationListOnly(){const list=document.getElementById("onboardingLocationList");if(!list)return;list.innerHTML=onboardingLocations.map(location=>`<button type="button" class="onboarding-location-item ${location.id===onboardingEditingLocationId?"active":""}" onclick="editOnboardingLocation('${location.id}')"><span>${escapeHtml(location.name||"Unnamed Location")}</span><small>${location.id===onboardingActiveLocationId?"Primary • ":""}${location.equipment.length} items</small></button>`).join("");}
function applyOnboardingEnvironment(value){const location=currentOnboardingLocation();if(!location)return;location.environment=value;if(value!=="custom")location.equipment=[...(EQUIPMENT_PRESETS[value]||[])];if(!location.name||/^Location \d+$|Training Location|Commercial Gym|Home Gym|Minimal Setup|Bodyweight \/ Outdoors|Travel Setup$/.test(location.name))location.name=defaultLocationName(value);renderOnboardingLocationEditor();}
function syncOnboardingEquipmentFromChecks(){const location=currentOnboardingLocation();if(!location)return;location.equipment=readEquipmentChecks("onboardingEquipment");if(document.getElementById("onboardingEnvironment")?.value)location.environment=document.getElementById("onboardingEnvironment").value;document.getElementById("onboardingEquipmentCount").textContent=`${location.equipment.length} selected`;renderOnboardingLocationListOnly();}
function setOnboardingActiveLocation(){const location=currentOnboardingLocation();if(!location)return;onboardingActiveLocationId=location.id;renderOnboardingLocationEditor();}
function selectAllOnboardingEquipment(){setEquipmentChecks("onboardingEquipment",EQUIPMENT_OPTIONS.map(([id])=>id));syncOnboardingEquipmentFromChecks();}
function clearOnboardingEquipment(){setEquipmentChecks("onboardingEquipment",[]);syncOnboardingEquipmentFromChecks();}

