"use strict";

let exerciseCatalogCache = null;
let exerciseSwapIndex = null;
let currentExerciseDetailName = null;
let exerciseLibraryCategory = "all";
let exerciseLibraryPattern = "all";
let exerciseLibraryFavoritesOnly = false;

const LIBRARY_CATEGORY_ORDER = ["all","strength","hypertrophy","power","mobility","conditioning","recovery","core"];
const LIBRARY_PATTERN_ORDER = ["all","Squat","Hinge","Push","Pull","Carry","Core","Mobility"];
const PILOT_GUIDE_ORDER = [
  "Back Squat",
  "Deadlift",
  "Bench Press",
  "Overhead Press",
  "Pull-up",
  "Dumbbell Row",
  "Split Squat",
  "Hip Thrust",
  "Plank",
  "Kettlebell Swing"
];

const GUIDE_TEMPLATE_ITEMS = [
  ["Instructional artwork","Clear images with key coaching callouts."],
  ["Setup","Step-by-step starting position."],
  ["Execution","Detailed movement breakdown."],
  ["Bell Coaching Cues","Simple cues that improve performance fast."],
  ["Common Mistakes","What to avoid and why."],
  ["Muscles Worked","Primary and secondary focus."],
  ["Scale or Substitute","Options for every athlete."]
];

const EXERCISE_OVERRIDES = {
  "Back Squat": {
    pattern:"Squat",
    primary:["Quads","Glutes"],
    secondary:["Adductors","Core"],
    equipment:["Barbell","Rack","Plates"],
    role:["strength","hypertrophy"],
    summary:"A foundational compound squat that builds lower-body strength, power, and overall athleticism.",
    whatItIs:"A foundational compound lift that builds lower body strength, power, and overall athleticism by training the entire posterior chain and trunk.",
    setup:["Set the bar in the rack around upper-chest height.","Feet about shoulder-width, toes slightly out.","Grip the bar hard and set the upper back before unracking.","Brace your core before every rep and step into your stance deliberately."],
    steps:["Sit the hips back and down while keeping the chest tall.","Let the knees track over the toes as you descend.","Reach full depth only while maintaining tension and position.","Drive through the entire foot and stand up powerfully."],
    cues:["Brace hard before every rep.","Chest tall, back neutral.","Push the knees out and stay balanced.","Keep full-foot pressure from start to finish."],
    mistakes:["Knees caving inward.","Rounding the lower back.","Leaning too far forward.","Missing depth because tension was lost early."],
    start:"Standing tall with the bar secured and brace set.",
    finish:"Hips and knees fully extended with the ribcage stacked.",
    guideCategory:"Strength",
    bodyRegion:"Lower Body",
    level:"Intermediate",
    thumbnail:"./assets/artwork/strength/powerlifting.jpg?v=10006",
    callouts:[
      {slot:"tl",title:"Brace hard",text:"Tight core and brace before you descend."},
      {slot:"tr",title:"Chest tall",text:"Keep your chest up and your back neutral."},
      {slot:"ml",title:"Knees track over toes",text:"Push the knees out in line with the toes."},
      {slot:"mr",title:"Drive up",text:"Push the floor away and stand strong."},
      {slot:"bl",title:"Full-foot pressure",text:"Drive through the heel, midfoot, and big toe."}
    ],
    substitutions:["Goblet Squat","Safety Bar Squat","Box Squat"]
  },
  "Deadlift": {
    pattern:"Hinge",
    primary:["Glutes","Hamstrings","Back"],
    secondary:["Grip","Core"],
    equipment:["Barbell","Plates"],
    role:["strength"],
    summary:"A foundational hip hinge that builds total-body pulling strength and posterior-chain power.",
    whatItIs:"A heavy hip-hinge used to train force from the floor while strengthening the glutes, hamstrings, trunk, and upper back.",
    setup:["Place the bar over the middle of the foot.","Take a firm grip before pulling tension into the bar.","Set the lats and lock the ribcage over the pelvis."],
    steps:["Push the floor away while keeping the bar close.","Let the hips and shoulders rise together off the floor.","Finish tall without leaning backward at the top."],
    cues:["Pull slack out of the bar.","Keep the bar glued to the body.","Stand tall — don’t over-finish."],
    mistakes:["Jerking the bar off the floor.","Letting the bar drift forward.","Hyperextending at lockout."],
    start:"Bar over midfoot with the lats tight and spine neutral.",
    finish:"Standing tall with the bar close to the thighs.",
    guideCategory:"Strength",
    bodyRegion:"Posterior Chain",
    level:"Intermediate",
    thumbnail:"./assets/artwork/strength/custom-heavy-deadlift.jpg?v=10006",
    callouts:[
      {slot:"tl",title:"Bar over midfoot",text:"Start with the bar close enough to move straight up."},
      {slot:"tr",title:"Set the lats",text:"Squeeze the armpits and lock the upper back in."},
      {slot:"ml",title:"Push the floor",text:"Leg drive starts the movement — don’t yank it."},
      {slot:"mr",title:"Stand tall",text:"Finish with hips through and ribs stacked."}
    ],
    substitutions:["Trap Bar Deadlift","Romanian Deadlift","Kettlebell Deadlift"]
  },
  "Bench Press": {
    pattern:"Push",
    primary:["Chest","Triceps"],
    secondary:["Front Delts"],
    equipment:["Barbell","Bench","Rack"],
    role:["strength","hypertrophy"],
    summary:"A primary upper-body press used to build pressing strength, chest size, and barbell control.",
    whatItIs:"A foundational horizontal press that develops upper-body strength and chest development while teaching upper-back tension and bar control.",
    setup:["Set the eyes just behind the bar.","Plant the feet and pull the shoulder blades down and back.","Use a grip that stacks the wrists over the elbows."],
    steps:["Unrack with the upper back tight.","Lower the bar with control to the lower chest.","Press up and slightly back while keeping the feet rooted."],
    cues:["Bend the bar toward your feet.","Stay tight through the upper back.","Leg drive supports the press."],
    mistakes:["Elbows flaring abruptly.","Shoulders rolling forward.","Bouncing the bar or lifting the hips."],
    start:"Upper back set, feet planted, bar over the shoulders.",
    finish:"Arms extended with the ribcage and shoulders controlled.",
    guideCategory:"Strength",
    bodyRegion:"Upper Body",
    level:"Intermediate",
    thumbnail:"./assets/artwork/strength/upper-body.jpg?v=10006",
    callouts:[
      {slot:"tl",title:"Upper back set",text:"Pack the shoulders before the first rep."},
      {slot:"tr",title:"Wrists stacked",text:"Keep the forearms vertical near the bottom."},
      {slot:"ml",title:"Touch low chest",text:"Lower under control to a repeatable touchpoint."},
      {slot:"mr",title:"Press up and back",text:"Follow a smooth bar path toward lockout."}
    ],
    substitutions:["Dumbbell Bench Press","Incline Dumbbell Press","Push-up"]
  },
  "Overhead Press": {
    pattern:"Push",
    primary:["Shoulders","Triceps"],
    secondary:["Upper Chest","Core"],
    equipment:["Barbell"],
    role:["strength"],
    summary:"A vertical press that builds shoulder strength, trunk stability, and force overhead.",
    whatItIs:"A strict vertical press that trains shoulder strength, upper-body stability, and efficient overhead mechanics.",
    setup:["Grip the bar just outside shoulder width.","Squeeze the glutes and brace the trunk.","Start with the bar on the upper chest and elbows slightly forward."],
    steps:["Press the bar straight up while moving the head back slightly.","Push through once the bar clears the face.","Finish with the bar stacked over the shoulders and hips."],
    cues:["Ribs down.","Press through the bar.","Finish in one stacked line."],
    mistakes:["Leaning back too far.","Pressing around the face in a big arc.","Soft lockout overhead."],
    start:"Bar resting on the upper chest with the body braced.",
    finish:"Bar stacked overhead with the glutes and trunk tight.",
    guideCategory:"Strength",
    bodyRegion:"Upper Body",
    level:"Intermediate",
    thumbnail:"./assets/artwork/strength/strength-building.jpg?v=10006",
    callouts:[
      {slot:"tl",title:"Brace the trunk",text:"Glutes and abs stay tight so the press stays vertical."},
      {slot:"tr",title:"Head through",text:"Move under the bar once it clears the face."},
      {slot:"ml",title:"Elbows slightly forward",text:"Start from a strong rack position."},
      {slot:"mr",title:"Stack overhead",text:"Finish with bar, shoulders, ribs, and hips aligned."}
    ],
    substitutions:["Dumbbell Shoulder Press","Landmine Press","Push Press"]
  },
  "Pull-up": {
    pattern:"Pull",
    primary:["Lats","Upper Back"],
    secondary:["Biceps","Grip"],
    equipment:["Pull-up Bar"],
    role:["strength","hypertrophy"],
    summary:"A bodyweight vertical pull that develops the upper back, arms, and grip.",
    whatItIs:"A classic bodyweight pull that develops back strength, arm strength, scapular control, and grip endurance.",
    setup:["Hang from the bar with the ribs stacked.","Set the shoulders down away from the ears.","Create a small hollow-body position."],
    steps:["Drive the elbows down and back.","Pull the chest toward the bar without craning the neck.","Lower under control to a full hang."],
    cues:["Pull the elbows into the back pockets.","Chest to bar, not chin to ceiling.","Own the lowering phase."],
    mistakes:["Kicking excessively.","Shrugging into the rep.","Cutting the range of motion short."],
    start:"Full hang with shoulders active and trunk tight.",
    finish:"Chin clears the bar while body tension is maintained.",
    guideCategory:"Strength",
    bodyRegion:"Upper Body",
    level:"Intermediate",
    thumbnail:"./assets/artwork/strength/bodybuilding.jpg?v=10006",
    callouts:[
      {slot:"tl",title:"Active hang",text:"Set the shoulders before pulling."},
      {slot:"tr",title:"Chest leads",text:"Think chest up instead of chin jutting forward."},
      {slot:"ml",title:"Elbows down",text:"Drive the elbows toward the ribs."},
      {slot:"mr",title:"Control the descent",text:"Lower all the way back to a full hang."}
    ],
    substitutions:["Lat Pulldown","Band-Assisted Pull-up","Inverted Row"]
  },
  "Dumbbell Row": {
    pattern:"Pull",
    primary:["Lats","Upper Back"],
    secondary:["Biceps","Rear Delts"],
    equipment:["Dumbbell","Bench"],
    role:["strength","hypertrophy"],
    summary:"A stable single-arm row that builds the lats, upper back, and pulling symmetry.",
    whatItIs:"A unilateral row used to train the lats and upper back while exposing side-to-side control and bracing demands.",
    setup:["Support the body with the free hand on a bench.","Keep the spine long and hips square.","Let the working shoulder stretch at the bottom."],
    steps:["Drive the elbow toward the hip.","Pause briefly at the top without twisting.","Lower under control back into the stretch."],
    cues:["Row with the elbow, not the hand.","Keep the chest quiet.","Reach long on the way down."],
    mistakes:["Rotating the torso aggressively.","Shrugging the shoulder.","Using momentum instead of a controlled pull."],
    start:"One hand supported with the dumbbell hanging naturally.",
    finish:"Elbow driven back with the shoulder blade controlled.",
    guideCategory:"Strength",
    bodyRegion:"Upper Body",
    level:"Intermediate",
    thumbnail:"./assets/artwork/strength/upper-body.jpg?v=10006",
    callouts:[
      {slot:"tl",title:"Brace on the bench",text:"Create a stable torso before the row starts."},
      {slot:"tr",title:"Shoulder stays packed",text:"Avoid shrugging as the elbow travels back."},
      {slot:"ml",title:"Elbow to hip",text:"Think toward the pocket, not straight up."},
      {slot:"mr",title:"Stretch and control",text:"Lower the bell with control between reps."}
    ],
    substitutions:["Barbell Row","Chest-Supported Row","Seated Cable Row"]
  },
  "Split Squat": {
    pattern:"Squat",
    primary:["Quads","Glutes"],
    secondary:["Adductors","Core"],
    equipment:["Dumbbells"],
    role:["strength","hypertrophy"],
    summary:"A unilateral squat that builds leg strength, balance, and positional control.",
    whatItIs:"A single-leg dominant squat variation that builds quads, glutes, pelvic control, and balance with less load than a bilateral squat.",
    setup:["Step into a long split stance.","Keep most of the pressure through the front foot.","Stand tall before descending."],
    steps:["Lower straight down between the hips.","Allow the front knee to travel naturally over the foot.","Drive through the front leg to stand tall."],
    cues:["Stay tall in the torso.","Front foot owns the rep.","Control the bottom."],
    mistakes:["Bouncing off the back leg.","Cutting depth short.","Losing balance or collapsing the front knee inward."],
    start:"Tall split stance with the front foot rooted.",
    finish:"Front leg extends while trunk stays stacked.",
    guideCategory:"Strength",
    bodyRegion:"Lower Body",
    level:"Intermediate",
    thumbnail:"./assets/artwork/strength/strength-size.jpg?v=10006",
    callouts:[
      {slot:"tl",title:"Long split stance",text:"Give the hips room to move straight down."},
      {slot:"tr",title:"Torso tall",text:"Don’t fold forward as you descend."},
      {slot:"ml",title:"Front foot pressure",text:"Drive the rep from the working leg."},
      {slot:"mr",title:"Control the bottom",text:"Move with balance and own the turnaround."}
    ],
    substitutions:["Reverse Lunge","Front-Foot Elevated Split Squat","Leg Press"]
  },
  "Hip Thrust": {
    pattern:"Hinge",
    primary:["Glutes"],
    secondary:["Hamstrings","Core"],
    equipment:["Barbell","Bench"],
    role:["strength","hypertrophy"],
    summary:"A glute-dominant bridge variation used to build hip extension strength and shape.",
    whatItIs:"A glute-focused hinge that trains powerful hip extension while limiting spinal loading compared with heavier barbell hinges.",
    setup:["Set the upper back on a bench.","Roll the bar into the hip crease with padding as needed.","Plant the feet so the shins are nearly vertical at the top."],
    steps:["Brace and drive the hips upward.","Finish with the ribcage down and glutes locked out.","Lower with control until the hips reset."],
    cues:["Ribs down at lockout.","Push through the midfoot.","Own the pause at the top."],
    mistakes:["Overarching at the top.","Feet placed too far away.","Rushing the lowering phase."],
    start:"Upper back supported with the hips lowered and feet planted.",
    finish:"Hips fully extended with the trunk controlled.",
    guideCategory:"Strength",
    bodyRegion:"Posterior Chain",
    level:"Intermediate",
    thumbnail:"./assets/artwork/strength/strength-size.jpg?v=10006",
    callouts:[
      {slot:"tl",title:"Upper back supported",text:"Settle the bench under the shoulder blades."},
      {slot:"tr",title:"Ribs stay down",text:"Lock out with the glutes, not the low back."},
      {slot:"ml",title:"Feet under knees",text:"Aim for vertical shins at the top."},
      {slot:"mr",title:"Pause at lockout",text:"Own the top position before lowering."}
    ],
    substitutions:["Glute Bridge","Romanian Deadlift","Cable Pull-Through"]
  },
  "Plank": {
    pattern:"Core",
    primary:["Abdominals","Obliques"],
    secondary:["Shoulders","Glutes"],
    equipment:["Bodyweight"],
    role:["core","strength"],
    summary:"A foundational trunk-stability drill that teaches full-body tension and bracing.",
    whatItIs:"A simple but challenging bracing drill that trains trunk stiffness, shoulder stability, and full-body tension.",
    setup:["Place the elbows under the shoulders.","Extend the legs behind you and squeeze the glutes.","Set the ribs down and make a straight line from head to heels."],
    steps:["Push the forearms into the floor.","Hold tension without letting the hips sag.","Breathe behind the brace until the set ends."],
    cues:["Ribs down.","Squeeze the quads and glutes.","Reach the floor away."],
    mistakes:["Letting the low back sag.","Piking the hips too high.","Relaxing the shoulders or neck."],
    start:"Forearms grounded with the body in one long line.",
    finish:"Position remains unchanged until the set ends.",
    guideCategory:"Core",
    bodyRegion:"Trunk",
    level:"Beginner",
    thumbnail:"./assets/artwork/strength/gym-conditioning.jpg?v=10006",
    callouts:[
      {slot:"tl",title:"Elbows under shoulders",text:"Build the plank from a stacked base."},
      {slot:"tr",title:"Ribs down",text:"Lock the torso in with a quiet ribcage."},
      {slot:"ml",title:"Glutes on",text:"Squeeze to keep the hips from sagging."},
      {slot:"mr",title:"Push the floor away",text:"Create active tension through the shoulders."}
    ],
    substitutions:["Dead Bug","Body Saw","Hardstyle Plank"]
  },
  "Kettlebell Swing": {
    pattern:"Hinge",
    primary:["Glutes","Hamstrings"],
    secondary:["Core","Grip"],
    equipment:["Kettlebell"],
    role:["power","conditioning"],
    summary:"An explosive hinge that develops hip snap, conditioning, and repeatable power output.",
    whatItIs:"A ballistic hinge that teaches powerful hip extension while building work capacity and rhythmic power.",
    setup:["Start the bell a foot in front of you.","Hinge to grip it with a long spine.","Hike the bell back like a football snap."],
    steps:["Explosively extend the hips.","Let the bell float to chest height from hip power.","Receive it back into the hinge and repeat smoothly."],
    cues:["Hips power the bell.","Float — don’t lift.","Snap, plank, hinge."],
    mistakes:["Turning it into a squat.","Lifting with the arms.","Overextending the low back at the top."],
    start:"Bell hiked back high between the legs.",
    finish:"Bell floats forward while the body is tall and braced.",
    guideCategory:"Power",
    bodyRegion:"Posterior Chain",
    level:"Intermediate",
    thumbnail:"./assets/artwork/strength/power-performance.jpg?v=10006",
    callouts:[
      {slot:"tl",title:"Hike, don’t lift",text:"Load the hinge by snapping the bell back first."},
      {slot:"tr",title:"Tall finish",text:"The swing tops out because the hips finished hard."},
      {slot:"ml",title:"Arms stay relaxed",text:"The shoulders guide the bell — they do not front raise it."},
      {slot:"mr",title:"Reload the hinge",text:"Receive the bell back into another crisp rep."}
    ],
    substitutions:["Dumbbell Swing","RDL","Sled Push"]
  },
  "Romanian Deadlift": {pattern:"Hinge",primary:["Hamstrings","Glutes"],secondary:["Back","Grip"],equipment:["Barbell"],role:["strength","hypertrophy"],summary:"A controlled hinge emphasizing hamstring length and posterior-chain tension."},
  "Push Press": {pattern:"Push",primary:["Shoulders","Triceps"],secondary:["Legs","Core"],equipment:["Barbell"],role:["power","strength"],summary:"An explosive overhead press that transfers force from the legs through the upper body."},
  "Weighted Pull-up": {pattern:"Pull",primary:["Lats","Upper Back"],secondary:["Biceps","Grip"],equipment:["Pull-up Bar","Weight Belt"],role:["strength","hypertrophy"],summary:"A loaded vertical pull for upper-back and arm strength."},
  "Chin-up": {pattern:"Pull",primary:["Lats","Biceps"],secondary:["Upper Back","Grip"],equipment:["Pull-up Bar"],role:["strength","hypertrophy"],summary:"A supinated-grip vertical pull with greater biceps contribution."},
  "Box Jump": {pattern:"Power",primary:["Glutes","Quadriceps","Calves"],secondary:["Core"],equipment:["Plyo Box"],role:["power"],summary:"A low-volume explosive jump used to develop power and landing control."},
  "Farmer Carry": {pattern:"Carry",primary:["Grip","Traps","Core"],secondary:["Glutes","Calves"],equipment:["Dumbbells or Kettlebells"],role:["strength","conditioning"],summary:"A loaded carry that develops grip, posture, and total-body bracing."},
  "Zone 2 Run": {pattern:"Conditioning",primary:["Cardiovascular System"],secondary:["Calves","Hamstrings","Quadriceps"],equipment:["Running Shoes"],role:["conditioning"],summary:"Steady aerobic running at a sustainable conversational effort."},
  "Easy Run": {pattern:"Conditioning",primary:["Cardiovascular System"],secondary:["Lower Body"],equipment:["Running Shoes"],role:["conditioning"],summary:"Comfortable running used to build aerobic capacity with low recovery cost."}
};

function titleWords(value){return String(value||"").trim().replace(/\s+/g," ");}
function normalizeExerciseName(name){return titleWords(String(name||"").replace(/^Bodyweight\s+/i,"").replace(/^Coach Review — Movement Omitted$/i,""));}
function escapeQuote(value){return String(value||"").replace(/'/g,"\\'");}

function inferExerciseMeta(name){
  const n=String(name||"").toLowerCase();
  let pattern="Accessory", primary=["General musculature"], secondary=[], equipment=["Bodyweight"], role=["hypertrophy"];
  if(/run|jog|sprint|tempo|interval|fartlek/.test(n)){pattern="Conditioning";primary=["Cardiovascular System"];secondary=["Lower Body"];equipment=["Running Shoes"];role=["conditioning"]}
  else if(/rower|rowing|ski erg|bike|cycling|air bike|swim|ruck/.test(n)){pattern="Conditioning";primary=["Cardiovascular System"];secondary=["Total Body"];equipment=[/ski/.test(n)?"Ski Erg":/row/.test(n)?"Rower":/bike/.test(n)?"Bike":"Conditioning Equipment"];role=["conditioning"]}
  else if(/jump|bound|hop/.test(n)){pattern="Power";primary=["Glutes","Quadriceps","Calves"];secondary=["Core"];equipment=[/box/.test(n)?"Plyo Box":"Bodyweight"];role=["power"]}
  else if(/squat|leg press|hack/.test(n)){pattern="Squat";primary=["Quads","Glutes"];secondary=["Adductors","Core"];equipment=[/goblet|dumbbell/.test(n)?"Dumbbell":/hack|leg press|machine/.test(n)?"Machine":"Barbell"];role=["strength","hypertrophy"]}
  else if(/deadlift|romanian|good morning|hip thrust|glute bridge|swing|back extension/.test(n)){pattern="Hinge";primary=["Glutes","Hamstrings"];secondary=["Back","Core"];equipment=[/dumbbell/.test(n)?"Dumbbell":/kettlebell|swing/.test(n)?"Kettlebell":/machine|extension/.test(n)?"Machine":"Barbell"];role=["strength","hypertrophy"]}
  else if(/lunge|split squat|step-up|step up/.test(n)){pattern="Squat";primary=["Quads","Glutes"];secondary=["Hamstrings","Core"];equipment=[/smith/.test(n)?"Smith Machine":/dumbbell/.test(n)?"Dumbbells":"Bodyweight or Free Weights"];role=["strength","hypertrophy"]}
  else if(/bench|chest press|push-up|push up|floor press|fly|pec deck|crossover/.test(n)){pattern="Push";primary=["Chest","Triceps"];secondary=["Front Delts"];equipment=[/dumbbell/.test(n)?"Dumbbell":/cable|crossover/.test(n)?"Cable":/machine|pec deck/.test(n)?"Machine":/push/.test(n)?"Bodyweight":"Barbell and Bench"];role=["strength","hypertrophy"]}
  else if(/overhead press|shoulder press|push press|arnold press|landmine press/.test(n)){pattern="Push";primary=["Shoulders","Triceps"];secondary=["Upper Chest","Core"];equipment=[/dumbbell|arnold/.test(n)?"Dumbbell":/landmine/.test(n)?"Landmine":"Barbell"];role=[/push press/.test(n)?"power":"strength","hypertrophy"]}
  else if(/pull-up|pullup|chin-up|chinup|pulldown|straight-arm pulldown/.test(n)){pattern="Pull";primary=["Lats","Upper Back"];secondary=["Biceps","Grip"];equipment=[/pulldown/.test(n)?"Cable Machine":"Pull-up Bar"];role=["strength","hypertrophy"]}
  else if(/row|face pull|rear-delt|reverse pec deck/.test(n)){pattern="Pull";primary=["Upper Back","Rear Delts"];secondary=["Biceps","Grip"];equipment=[/cable|face pull/.test(n)?"Cable":/dumbbell/.test(n)?"Dumbbell":/machine|pec deck/.test(n)?"Machine":"Barbell"];role=["strength","hypertrophy"]}
  else if(/curl/.test(n)){pattern="Arms";primary=["Biceps","Forearms"];secondary=[];equipment=[/cable|bayesian/.test(n)?"Cable":/barbell|ez-bar/.test(n)?"Barbell":"Dumbbell"];role=["hypertrophy"]}
  else if(/pressdown|triceps|skull crusher|dip/.test(n)){pattern="Push";primary=["Triceps"];secondary=["Chest","Shoulders"];equipment=[/cable|pressdown/.test(n)?"Cable":/dip/.test(n)?"Dip Station":"Barbell or Dumbbells"];role=["hypertrophy"]}
  else if(/lateral raise/.test(n)){pattern="Shoulders";primary=["Side Delts"];secondary=["Upper Traps"];equipment=[/cable/.test(n)?"Cable":/machine/.test(n)?"Machine":"Dumbbell"];role=["hypertrophy"]}
  else if(/calf/.test(n)){pattern="Lower Body";primary=["Calves"];secondary=[];equipment=[/seated/.test(n)?"Seated Calf Machine":"Machine or Free Weights"];role=["hypertrophy"]}
  else if(/tibialis/.test(n)){pattern="Mobility";primary=["Tibialis Anterior"];secondary=[];equipment=["Bodyweight or Tibialis Machine"];role=["mobility","hypertrophy"]}
  else if(/plank|ab wheel|crunch|knee raise/.test(n)){pattern="Core";primary=["Abdominals","Obliques"];secondary=["Hip Flexors","Trunk Stabilizers"];equipment=[/cable/.test(n)?"Cable":/ab wheel/.test(n)?"Ab Wheel":/hanging/.test(n)?"Pull-up Bar":"Bodyweight"];role=["core","strength"]}
  else if(/carry/.test(n)){pattern="Carry";primary=["Grip","Traps","Core"];secondary=["Lower Body"];equipment=["Dumbbells or Kettlebells"];role=["strength","conditioning"]}
  else if(/mobility|stretch|rotation|cat-cow|cat cow|90\/90|couch stretch/.test(n)){pattern="Mobility";primary=["Mobility"],secondary=[];equipment=["Bodyweight"];role=["mobility","recovery"]}
  else if(/extension/.test(n)){pattern="Isolation";primary=[/leg extension/.test(n)?"Quads":"Hamstrings"];secondary=[];equipment=["Machine"];role=["hypertrophy"]}
  const summary=`A ${pattern.toLowerCase()} movement used to develop ${primary.join(" and ").toLowerCase()} within Bell Performance programming.`;
  return {
    pattern, primary, secondary, equipment, role, summary,
    whatItIs: summary,
    setup:[`Choose a stable setup for ${name}.`,`Brace before the first rep and keep the body organized.`],
    steps:[`Move through the working range with control.`,`Use the intended muscles and maintain the target position throughout.`],
    cues:[`Move with control.`,`Keep tension where the lift is supposed to challenge you.`],
    mistakes:[`Rushing the setup.`,`Losing position during the hardest part of the lift.`],
    start:`Starting position for ${name}.`,
    finish:`Finished position for ${name}.`,
    guideCategory: role.includes("power") ? "Power" : role.includes("conditioning") ? "Conditioning" : role.includes("mobility") ? "Mobility" : role.includes("core") ? "Core" : role.includes("recovery") ? "Recovery" : "Strength",
    bodyRegion: pattern,
    level: role.includes("mobility") || role.includes("recovery") ? "Beginner" : "Intermediate",
    thumbnail: "./assets/artwork/strength/custom-strength-shadows.jpg?v=10006",
    callouts:[
      {slot:"tl",title:"Set the position",text:"Own the start before the rep begins."},
      {slot:"tr",title:"Stay organized",text:"Keep the body stacked and balanced."},
      {slot:"ml",title:"Move with control",text:"The rep should look repeatable."},
      {slot:"mr",title:"Finish clean",text:"Lock in the final position without rushing."}
    ],
    substitutions:[]
  };
}

function addExerciseName(set,name){const clean=normalizeExerciseName(name);if(clean)set.add(clean)}
function collectExerciseNames(){
  const set=new Set();
  try{Object.values(strengthRotations||{}).forEach(rotation=>Object.values(rotation).forEach(workout=>(workout.exercises||[]).forEach(ex=>addExerciseName(set,ex.name))))}catch{}
  [typeof bodybuildingVariations!=="undefined"?bodybuildingVariations:null,typeof femaleBodybuildingVariations!=="undefined"?femaleBodybuildingVariations:null].filter(Boolean).forEach(group=>Object.values(group).forEach(variants=>variants.forEach(list=>list.forEach(name=>addExerciseName(set,name)))));
  try{Object.values(conditioningTemplates||{}).forEach(template=>(template.exercises||[]).forEach(ex=>addExerciseName(set,ex.name)))}catch{}
  try{Object.values(mobilityRoutines||{}).forEach(routine=>(Array.isArray(routine)?routine:(routine.exercises||[])).forEach(ex=>addExerciseName(set,typeof ex==="string"?ex:ex.name)))}catch{}
  Object.keys(EXERCISE_OVERRIDES).forEach(name=>addExerciseName(set,name));
  return [...set].sort((a,b)=>a.localeCompare(b));
}

function exerciseRecord(name){
  const inferred=inferExerciseMeta(name);const override=EXERCISE_OVERRIDES[name]||{};
  return {name,...inferred,...override,primary:override.primary||inferred.primary,secondary:override.secondary||inferred.secondary,equipment:override.equipment||inferred.equipment,role:override.role||inferred.role};
}
function exerciseCatalog(){if(!exerciseCatalogCache)exerciseCatalogCache=collectExerciseNames().map(exerciseRecord);return exerciseCatalogCache}
function findExercise(name){const normalized=normalizeExerciseName(name);return exerciseCatalog().find(item=>item.name.toLowerCase()===normalized.toLowerCase())||exerciseRecord(normalized||name)}
function getFeaturedGuideNames(){return PILOT_GUIDE_ORDER.filter(name=>!!findExercise(name))}
function getFeaturedGuides(){return getFeaturedGuideNames().map(name=>findExercise(name))}
function exerciseFavorites(){return Array.isArray(data.exerciseLibraryFavorites)?data.exerciseLibraryFavorites:[]}
function isExerciseFavorite(name){return exerciseFavorites().includes(name)}
function persistLibraryState(){if(typeof saveData==="function")saveData({render:false})}

function openExerciseLibrary(){showScreen("exerciseLibrary");renderExerciseLibrary()}
function initializeExerciseFilters(){return}
function setExerciseLibraryCategory(value){exerciseLibraryCategory=value||"all";renderExerciseLibrary()}
function setExerciseLibraryPattern(value){exerciseLibraryPattern=value||"all";renderExerciseLibrary()}
function resetExerciseLibrarySearch(){const input=document.getElementById("exerciseLibrarySearch");if(input)input.value="";exerciseLibraryCategory="all";exerciseLibraryPattern="all";exerciseLibraryFavoritesOnly=false;renderExerciseLibrary()}
function toggleLibraryFavoritesFilter(){exerciseLibraryFavoritesOnly=!exerciseLibraryFavoritesOnly;renderExerciseLibrary()}
function toggleExerciseFavorite(name){
  data.exerciseLibraryFavorites=exerciseFavorites().slice();
  if(isExerciseFavorite(name)) data.exerciseLibraryFavorites=data.exerciseLibraryFavorites.filter(entry=>entry!==name);
  else data.exerciseLibraryFavorites.push(name);
  persistLibraryState();
  if(currentExerciseDetailName===name) updateExerciseDetailFavoriteButton(name);
  renderExerciseLibrary();
}

function roleLabel(exercise){
  const roles=(exercise.role||[]).map(v=>String(v).toLowerCase());
  if(roles.includes("power")) return "Power";
  if(roles.includes("conditioning")) return "Conditioning";
  if(roles.includes("mobility")) return "Mobility";
  if(roles.includes("recovery")) return "Recovery";
  if(roles.includes("core")) return "Core";
  if(roles.includes("hypertrophy") && !roles.includes("strength")) return "Hypertrophy";
  return exercise.guideCategory || "Strength";
}
function equipmentLabel(exercise){return exercise.equipment?.[0]||"Bodyweight"}
function levelLabel(exercise){return exercise.level || (roleLabel(exercise)==="Core" || roleLabel(exercise)==="Mobility" ? "Beginner" : "Intermediate")}
function bodyRegionLabel(exercise){return exercise.bodyRegion || exercise.pattern}
function thumbnailUrl(exercise){return exercise.thumbnail || "./assets/artwork/strength/custom-strength-shadows.jpg?v=10006"}

function filterFeaturedGuides(){
  const q=(document.getElementById("exerciseLibrarySearch")?.value||"").trim().toLowerCase();
  return getFeaturedGuides().filter(x=>{
    const text=[x.name,x.pattern,x.summary,x.whatItIs,...(x.primary||[]),...(x.secondary||[]),...(x.equipment||[]),roleLabel(x),bodyRegionLabel(x)].join(" ").toLowerCase();
    const matchesQuery=!q || text.includes(q);
    const matchesCategory=exerciseLibraryCategory==="all" || (exerciseLibraryCategory==="core" ? roleLabel(x).toLowerCase()==="core" : (x.role||[]).map(v=>String(v).toLowerCase()).includes(exerciseLibraryCategory) || roleLabel(x).toLowerCase()===exerciseLibraryCategory);
    const matchesPattern=exerciseLibraryPattern==="all" || (x.pattern||"").toLowerCase()===exerciseLibraryPattern.toLowerCase();
    const matchesFavorites=!exerciseLibraryFavoritesOnly || isExerciseFavorite(x.name);
    return matchesQuery && matchesCategory && matchesPattern && matchesFavorites;
  });
}

function renderExerciseLibrary(){
  const results=filterFeaturedGuides();
  setText("exerciseLibraryCount",results.length);
  const grid=document.getElementById("exerciseLibraryGrid");
  if(grid){
    grid.innerHTML=results.length ? results.map((x,index)=>{
      const favorite=isExerciseFavorite(x.name);
      return `<button class="library-guide-card ${favorite?"is-favorite":""}" onclick="openExerciseDetail('${escapeQuote(x.name)}')" type="button"><div class="library-guide-thumb" style="background-image:url('${thumbnailUrl(x)}')"><button aria-label="${favorite?"Remove from":"Save to"} favorites" class="library-favorite-toggle" onclick="toggleExerciseFavorite('${escapeQuote(x.name)}');event.stopPropagation();" type="button">${favorite?"★":"☆"}</button><span class="guide-category-badge">${escapeHtml(roleLabel(x))}</span></div><div class="library-guide-body"><h3>${getFeaturedGuideNames().indexOf(x.name)+1}. ${escapeHtml(x.name)}</h3><div class="library-guide-meta"><span>${escapeHtml(x.pattern)}</span><span>${escapeHtml(equipmentLabel(x))}</span></div><div class="library-guide-footer"><span>${escapeHtml(levelLabel(x))}</span><span>${escapeHtml(bodyRegionLabel(x))}</span></div></div></button>`;
    }).join("") : `<div class="card library-empty-state"><strong>No pilot guides match those filters.</strong><div class="hint">This first build focuses on the ten featured movements. Clear filters or search for one of the pilot guides.</div></div>`;
  }
  const chipContainer=document.getElementById("libraryCategoryChips");
  if(chipContainer){
    chipContainer.innerHTML=LIBRARY_CATEGORY_ORDER.map(value=>`<button class="library-chip ${exerciseLibraryCategory===value?"active":""}" onclick="setExerciseLibraryCategory('${value}')" type="button">${value==="all"?"All":value.charAt(0).toUpperCase()+value.slice(1)}</button>`).join("");
  }
  const patternContainer=document.getElementById("libraryPatternButtons");
  if(patternContainer){
    patternContainer.innerHTML=LIBRARY_PATTERN_ORDER.filter(value=>value!=="all").map(value=>`<button class="library-pattern-button ${exerciseLibraryPattern===value?"active":""}" onclick="setExerciseLibraryPattern('${value}')" type="button"><span>${escapeHtml(value)}</span></button>`).join("");
  }
  const favoritesButtons=[document.getElementById("libraryFavoritesButton"),document.getElementById("librarySidebarFavoritesButton")].filter(Boolean);
  favoritesButtons.forEach(button=>{
    button.classList.toggle("active",exerciseLibraryFavoritesOnly);
    button.textContent=exerciseLibraryFavoritesOnly?"Showing Favorites":"View My Favorites";
  });
}

function renderInstructionalHero(exercise){
  const callouts=(exercise.callouts||[]).map(callout=>`<div class="guide-callout ${callout.slot||"tl"}"><strong>${escapeHtml(callout.title)}</strong><span>${escapeHtml(callout.text)}</span></div>`).join("");
  return `<section class="guide-media-card"><div class="guide-media-top"><div><span class="metric-label">Instructional Artwork</span><strong>Exercise Guide Visual</strong></div><span class="guide-media-status">Video demo reserved for a future update</span></div><div class="guide-hero-stage" style="background-image:url('${thumbnailUrl(exercise)}')"><div class="guide-stage-overlay"></div>${callouts}<div class="guide-hero-caption"><span>Start</span><strong>${escapeHtml(exercise.start || "Stable start position")}</strong><span>Finish</span><strong>${escapeHtml(exercise.finish || "Controlled finish position")}</strong></div></div></section>`;
}

function updateExerciseDetailFavoriteButton(name){
  const button=document.getElementById("exerciseDetailFavoriteButton");
  if(button) button.textContent=`${isExerciseFavorite(name)?"★ Saved to Favorites":"☆ Save to Favorites"}`;
}

function openExerciseDetail(name){
  const x=findExercise(name);currentExerciseDetailName=x.name;setText("exerciseDetailTitle",x.name);updateExerciseDetailFavoriteButton(x.name);
  const content=document.getElementById("exerciseDetailContent");if(!content)return;
  const alternatives=rankExerciseAlternatives(x.name).slice(0,5);
  const substitutions=(x.substitutions||[]).length?(x.substitutions||[]):alternatives.map(entry=>entry.name).slice(0,3);
  content.innerHTML=`<div class="guide-detail-shell"><div class="guide-detail-main"><div class="guide-detail-badges"><span class="guide-detail-badge primary">${escapeHtml(roleLabel(x))}</span><span class="guide-detail-badge">${escapeHtml(bodyRegionLabel(x))}</span><span class="guide-detail-badge">${escapeHtml(x.pattern)}</span></div>${renderInstructionalHero(x)}<div class="guide-detail-lower"><section class="guide-detail-panel"><h3>Setup</h3><ol>${(x.setup||[]).map(v=>`<li>${escapeHtml(v)}</li>`).join("")}</ol></section><section class="guide-detail-panel"><h3>Execution</h3><ol>${(x.steps||[]).map(v=>`<li>${escapeHtml(v)}</li>`).join("")}</ol></section><section class="guide-detail-panel"><h3>Bell Coaching Cues</h3><ul>${(x.cues||[]).map(v=>`<li>${escapeHtml(v)}</li>`).join("")}</ul></section></div></div><aside class="guide-detail-side"><section class="guide-detail-panel"><h3>What it is</h3><p>${escapeHtml(x.whatItIs || x.summary)}</p></section><section class="guide-detail-panel"><h3>Primary Muscles</h3><div class="guide-muscle-grid">${(x.primary||[]).concat((x.secondary||[]).slice(0,2)).slice(0,4).map(v=>`<span>${escapeHtml(v)}</span>`).join("")}</div></section><section class="guide-detail-panel"><h3>Equipment</h3><div class="guide-pill-grid">${(x.equipment||[]).map(v=>`<span>${escapeHtml(v)}</span>`).join("")}</div></section><section class="guide-detail-panel"><h3>Scale or Substitute</h3><div class="guide-pill-grid">${substitutions.length?substitutions.map(v=>`<button class="link-button subtle" onclick="openExerciseDetail('${escapeQuote(v)}')" type="button">${escapeHtml(v)}</button>`).join(""):`<span>Options will appear here as the library expands.</span>`}</div></section><section class="guide-detail-panel" id="exerciseSimilarLiftsSection"><h3>Common Mistakes</h3><ul>${(x.mistakes||[]).map(v=>`<li>${escapeHtml(v)}</li>`).join("")}</ul></section><section class="guide-detail-panel"><h3>Similar Lifts</h3><ul class="guide-alt-list">${alternatives.length?alternatives.map(v=>`<li><button class="link-button" onclick="openExerciseDetail('${escapeQuote(v.name)}')" type="button">${escapeHtml(v.name)}</button><span>${escapeHtml(v.reason)}</span></li>`).join(""):`<li><span>No close alternatives cataloged yet.</span></li>`}</ul></section></aside></div>`;
  document.getElementById("exerciseDetailModal")?.classList.remove("hidden");
}
function scrollExerciseSimilarLifts(){document.getElementById("exerciseSimilarLiftsSection")?.scrollIntoView({behavior:"smooth",block:"start"})}
function closeExerciseDetail(){document.getElementById("exerciseDetailModal")?.classList.add("hidden")}

function rankExerciseAlternatives(name,reason="preference"){
  const source=findExercise(name);const activeEquipment=(typeof activeEquipmentLocation==="function"?activeEquipmentLocation().equipment:[])||[];
  return exerciseCatalog().filter(x=>x.name!==source.name).map(x=>{let score=0;if(x.pattern===source.pattern)score+=50;score+=x.primary.filter(m=>source.primary.includes(m)).length*12;score+=x.role.filter(r=>source.role.includes(r)).length*6;if(reason==="equipment"&&activeEquipment.length){const text=x.equipment.join(" ").toLowerCase();if(activeEquipment.some(e=>text.includes(String(e).toLowerCase())))score+=15}if(reason==="skill"&&/bodyweight|machine|dumbbell/i.test(x.equipment.join(" ")))score+=8;if(reason==="setup"&&x.equipment.length===1)score+=5;return {name:x.name,score,reason:x.pattern===source.pattern?`Preserves the ${source.pattern.toLowerCase()} pattern`:`Targets ${x.primary.join(" and ").toLowerCase()}`}}).filter(x=>x.score>=45).sort((a,b)=>b.score-a.score||a.name.localeCompare(b.name));
}

function openExerciseSwap(index){exerciseSwapIndex=index;const exercise=data.activeWorkout?.exercises?.[index];if(!exercise)return;setText("exerciseSwapTitle",`Replace ${exercise.name}`);const original=document.getElementById("exerciseSwapOriginal");if(original)original.innerHTML=`<strong>Current prescription:</strong> ${escapeHtml(exercise.name)} • ${escapeHtml(exercise.prescription||"")}<br><span>The replacement will keep the same sets and reps unless the workout explicitly requires a different format.</span>`;document.getElementById("exerciseSwapModal")?.classList.remove("hidden");renderExerciseSwapOptions()}
function closeExerciseSwap(){document.getElementById("exerciseSwapModal")?.classList.add("hidden");exerciseSwapIndex=null}
function renderExerciseSwapOptions(){const exercise=data.activeWorkout?.exercises?.[exerciseSwapIndex];const container=document.getElementById("exerciseSwapOptions");if(!exercise||!container)return;const reason=document.getElementById("exerciseSwapReason")?.value||"preference";const options=rankExerciseAlternatives(exercise.originalExercise||exercise.name,reason).slice(0,8);container.innerHTML=options.length?options.map(x=>`<div class="exercise-swap-option"><div><h3>${escapeHtml(x.name)}</h3><p>${escapeHtml(x.reason)}. ${escapeHtml(findExercise(x.name).equipment.join(", "))}.</p><button class="link-button" onclick="openExerciseDetail('${escapeQuote(x.name)}')" type="button">Open guide</button></div><button onclick="selectExerciseReplacement('${escapeQuote(x.name)}')" type="button">Use This</button></div>`).join(""):'<div class="performance-callout">No close match was found. Keep the current movement or review the full library.</div>'}
function selectExerciseReplacement(replacementName){
  const index=exerciseSwapIndex,exercise=data.activeWorkout?.exercises?.[index];if(!exercise)return;const originalName=exercise.originalExercise||exercise.name;const reason=document.getElementById("exerciseSwapReason")?.value||"preference";const scope=document.getElementById("exerciseSwapScope")?.value||"today";
  exercise.originalExercise=originalName;exercise.name=replacementName;exercise.userAdjusted=true;exercise.replacementReason=reason;exercise.replacementScope=scope;exercise.cue=`User-selected replacement for ${originalName}. ${findExercise(replacementName).cues[0]}`;
  if(scope!=="today"){
    data.exerciseIntelligence=data.exerciseIntelligence||{replacements:[],personalConstraints:[]};data.exerciseIntelligence.replacements=data.exerciseIntelligence.replacements||[];
    data.exerciseIntelligence.replacements=data.exerciseIntelligence.replacements.filter(r=>!(r.originalName===originalName&&r.scope===scope));
    data.exerciseIntelligence.replacements.push({originalName,replacementName,reason,scope,blockId:scope==="block"?(data.trainingBlock.generatedAt||data.trainingBlock.startDate||""):"",createdAt:new Date().toISOString()});
  }
  persistLibraryState();closeExerciseSwap();renderActiveWorkout();
}
function applySavedExerciseReplacement(exercise){
  const rules=data.exerciseIntelligence?.replacements||[];const name=exercise.originalExercise||exercise.name;const currentBlock=data.trainingBlock?.generatedAt||data.trainingBlock?.startDate||"";
  const rule=[...rules].reverse().find(r=>r.originalName===name&&(r.scope==="always"||(r.scope==="block"&&r.blockId===currentBlock)));
  if(!rule)return exercise;return {...exercise,name:rule.replacementName,originalExercise:name,userAdjusted:true,replacementReason:rule.reason,replacementScope:rule.scope,cue:`Saved replacement for ${name}. ${findExercise(rule.replacementName).cues[0]} ${exercise.cue||""}`};
}
