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
function adaptExerciseToEquipment(exercise){
  const req=exerciseRequirements(exercise.name);
  if(!req.length||hasAnyEquipment(req))return {...exercise,equipmentAdjusted:false};
  const candidates=EXERCISE_SWAPS[exercise.name]||[];
  const pick=candidates.find(([key])=>modalityKeyAvailable(key));
  if(!pick)return {...exercise,name:`Bodyweight ${exercise.name}`,reps:exercise.reps,cue:`Equipment-aware fallback. Use controlled tempo and train close to technical failure. ${exercise.cue||""}`,equipmentAdjusted:true,originalExercise:exercise.name};
  return {...exercise,name:pick[1],cue:`Substituted for ${exercise.name} at ${activeEquipmentLocation().name}. ${exercise.cue||""}`,equipmentAdjusted:true,originalExercise:exercise.name};
}
function applyEquipmentToTemplate(template){return {...template,equipmentLocation:activeEquipmentLocation().name,exercises:template.exercises.map(adaptExerciseToEquipment)};}
function equipmentCheckboxesHtml(prefix,onchange=""){const change=onchange?` onchange="${onchange}"`:"";return EQUIPMENT_OPTIONS.map(([id,label])=>`<label class="equipment-option"><input type="checkbox" id="${prefix}-${id}" value="${id}"${change}> <span>${label}</span></label>`).join("");}
function setEquipmentChecks(prefix,items){EQUIPMENT_OPTIONS.forEach(([id])=>{const el=document.getElementById(`${prefix}-${id}`);if(el)el.checked=items.includes(id);});}
function readEquipmentChecks(prefix){return EQUIPMENT_OPTIONS.map(([id])=>id).filter(id=>document.getElementById(`${prefix}-${id}`)?.checked);}
function applyEquipmentPreset(prefix,value){setEquipmentChecks(prefix,EQUIPMENT_PRESETS[value]||[]);}
function renderEquipmentSettings(){
  normalizeEquipmentSettings(); const setup=data.settings.equipmentSetup, active=activeEquipmentLocation();
  const select=document.getElementById("activeLocationInput"); if(select){select.innerHTML=setup.locations.map(x=>`<option value="${x.id}">${x.name}</option>`).join("");select.value=active.id;}
  const quick=document.getElementById("activeLocationQuick");if(quick){quick.innerHTML=setup.locations.map(x=>`<option value="${x.id}">${x.name}</option>`).join("");quick.value=active.id;}
  const name=document.getElementById("equipmentLocationName");if(name)name.value=active.name;
  const env=document.getElementById("equipmentEnvironment");if(env)env.value=active.environment||"custom";
  setEquipmentChecks("equipment",active.equipment);
  const label=document.getElementById("activeLocationLabel");if(label)label.textContent=active.name;
  const summary=document.getElementById("equipmentSummary");if(summary)summary.textContent=`${active.name}: ${active.equipment.length} equipment options available. Workouts will substitute unavailable movements automatically.`;
}
function switchEquipmentLocation(id){data.settings.equipmentSetup.activeLocationId=id;saveData();}
function loadEquipmentLocation(){data.settings.equipmentSetup.activeLocationId=document.getElementById("activeLocationInput").value;saveData();}
function saveEquipmentLocation(){
  normalizeEquipmentSettings();const active=activeEquipmentLocation();active.name=document.getElementById("equipmentLocationName").value.trim()||active.name;active.environment=document.getElementById("equipmentEnvironment").value;active.equipment=readEquipmentChecks("equipment");saveData();alert("Equipment location saved. Future workouts will adapt automatically.");
}
function addEquipmentLocation(){
  normalizeEquipmentSettings();const name=prompt("Name this training location (for example Home, Commercial Gym, or Travel):","New Location");if(!name)return;const id=`location-${Date.now()}`;data.settings.equipmentSetup.locations.push({id,name,environment:"minimal",equipment:[...EQUIPMENT_PRESETS.minimal]});data.settings.equipmentSetup.activeLocationId=id;saveData();
}
function deleteEquipmentLocation(){normalizeEquipmentSettings();if(data.settings.equipmentSetup.locations.length<=1){alert("Keep at least one training location.");return;}const active=activeEquipmentLocation();if(!confirm(`Delete ${active.name}?`))return;data.settings.equipmentSetup.locations=data.settings.equipmentSetup.locations.filter(x=>x.id!==active.id);data.settings.equipmentSetup.activeLocationId=data.settings.equipmentSetup.locations[0].id;saveData();}
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

