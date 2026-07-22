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
function equipmentCheckboxesHtml(prefix){return EQUIPMENT_OPTIONS.map(([id,label])=>`<label class="equipment-option"><input type="checkbox" id="${prefix}-${id}" value="${id}"> <span>${label}</span></label>`).join("");}
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
  const env=document.getElementById("onboardingEnvironment").value;const equipment=readEquipmentChecks("onboardingEquipment");
  data.settings.equipmentSetup={locations:[{id:"default",name:env==="commercial"?"Commercial Gym":env==="home"?"Home Gym":env==="bodyweight"?"Bodyweight / Outdoors":"My Training Setup",environment:env,equipment}],activeLocationId:"default"};
}
