"use strict";

let exerciseCatalogCache = null;
let exerciseSwapIndex = null;
let currentExerciseDetailName = null;
let exerciseDetailReturnScreen = "exerciseLibrary";
let exerciseDetailReturnSwap = false;
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
  const source=q ? exerciseCatalog() : getFeaturedGuides();
  return source.filter(x=>{
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
      const guideLevel=exerciseGuideLevel(x);const pilotIndex=getFeaturedGuideNames().indexOf(x.name);
      return `<button class="library-guide-card ${favorite?"is-favorite":""}" onclick="openExerciseDetail('${escapeQuote(x.name)}')" type="button"><div class="library-guide-thumb" style="background-image:url('${thumbnailUrl(x)}')"><button aria-label="${favorite?"Remove from":"Save to"} favorites" class="library-favorite-toggle" onclick="toggleExerciseFavorite('${escapeQuote(x.name)}');event.stopPropagation();" type="button">${favorite?"★":"☆"}</button><span class="guide-category-badge">${escapeHtml(roleLabel(x))}</span><span class="library-guide-level ${guideLevel.id}">${escapeHtml(guideLevel.label)}</span></div><div class="library-guide-body"><h3>${pilotIndex>=0?`${pilotIndex+1}. `:""}${escapeHtml(x.name)}</h3><div class="library-guide-meta"><span>${escapeHtml(x.pattern)}</span><span>${escapeHtml(equipmentLabel(x))}</span></div><div class="library-guide-footer"><span>${escapeHtml(levelLabel(x))}</span><span>${escapeHtml(bodyRegionLabel(x))}</span></div></div></button>`;
    }).join("") : `<div class="card library-empty-state"><strong>No exercise guides match those filters.</strong><div class="hint">Clear the filters or search by exercise, muscle group, equipment, or movement pattern.</div></div>`;
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
  if(exercise.name==="Back Squat"){
    return `<section class="guide-artwork-panel exact-artwork"><img alt="Back squat instructional guide with Bell coaching callouts" src="./assets/library/back-squat-production-guide.png?v=13710"/></section>`;
  }
  const callouts=(exercise.callouts||[]).map(callout=>`<div class="guide-callout ${callout.slot||"tl"}"><strong>${escapeHtml(callout.title)}</strong><span>${escapeHtml(callout.text)}</span></div>`).join("");
  return `<section class="guide-artwork-panel"><div class="guide-hero-stage" style="background-image:url('${thumbnailUrl(exercise)}')"><div class="guide-stage-overlay"></div>${callouts}</div></section>`;
}

function updateExerciseDetailFavoriteButton(name){
  const button=document.getElementById("exerciseDetailFavoriteButton");
  if(button){
    button.textContent=`${isExerciseFavorite(name)?"★ Saved to Favorites":"☆ Save to Favorites"}`;
    button.classList.toggle("saved",isExerciseFavorite(name));
  }
}

function renderGuideCategoryChips(){
  const target=document.getElementById("exerciseGuideCategoryChips");
  if(!target)return;
  target.innerHTML=["all","strength","hypertrophy","power","mobility","conditioning"].map(value=>`<button class="library-chip ${value==="all"?"active":""}" onclick="openExerciseLibraryWithCategory('${value}')" type="button">${value==="all"?"All":value.charAt(0).toUpperCase()+value.slice(1)}</button>`).join("");
}
function openExerciseLibraryWithCategory(category){
  exerciseLibraryCategory=category||"all";
  exerciseLibraryPattern="all";
  exerciseLibraryFavoritesOnly=false;
  showScreen("exerciseLibrary");
  renderExerciseLibrary();
}
function searchExerciseGuideLibrary(){
  const input=document.getElementById("exerciseGuideSearch");
  const libraryInput=document.getElementById("exerciseLibrarySearch");
  if(libraryInput) libraryInput.value=input?.value||"";
  openExerciseLibraryWithCategory("all");
}


const MUSCLE_TAXONOMY = {
  "quadriceps": {label:"Quads", view:"front", zones:["quadL","quadR"]},
  "quads": {label:"Quads", view:"front", zones:["quadL","quadR"]},
  "glutes": {label:"Glutes", view:"back", zones:["gluteL","gluteR"]},
  "gluteus maximus": {label:"Glutes", view:"back", zones:["gluteL","gluteR"]},
  "gluteus medius": {label:"Glute Medius", view:"back", zones:["gluteMedL","gluteMedR"]},
  "hamstrings": {label:"Hamstrings", view:"back", zones:["hamL","hamR"]},
  "adductors": {label:"Adductors", view:"front", zones:["adductorL","adductorR"]},
  "calves": {label:"Calves", view:"back", zones:["calfL","calfR"]},
  "tibialis anterior": {label:"Tibialis", view:"front", zones:["shinL","shinR"]},
  "chest": {label:"Chest", view:"front", zones:["pecL","pecR"]},
  "pectorals": {label:"Chest", view:"front", zones:["pecL","pecR"]},
  "upper chest": {label:"Upper Chest", view:"front", zones:["upperPecL","upperPecR"]},
  "shoulders": {label:"Shoulders", view:"front", zones:["shoulderL","shoulderR"]},
  "front delts": {label:"Front Delts", view:"front", zones:["frontDeltL","frontDeltR"]},
  "front deltoids": {label:"Front Delts", view:"front", zones:["frontDeltL","frontDeltR"]},
  "side delts": {label:"Side Delts", view:"front", zones:["shoulderL","shoulderR"]},
  "rear delts": {label:"Rear Delts", view:"back", zones:["rearDeltL","rearDeltR"]},
  "triceps": {label:"Triceps", view:"back", zones:["tricepsL","tricepsR"]},
  "biceps": {label:"Biceps", view:"front", zones:["bicepsL","bicepsR"]},
  "forearms": {label:"Forearms", view:"front", zones:["forearmL","forearmR"]},
  "grip": {label:"Grip", view:"front", zones:["forearmL","forearmR"]},
  "lats": {label:"Lats", view:"back", zones:["latL","latR"]},
  "upper back": {label:"Upper Back", view:"back", zones:["upperBack"]},
  "mid-back": {label:"Mid-Back", view:"back", zones:["midBack"]},
  "back": {label:"Back", view:"back", zones:["upperBack","midBack","latL","latR"]},
  "traps": {label:"Traps", view:"back", zones:["traps"]},
  "trapezius": {label:"Traps", view:"back", zones:["traps"]},
  "rhomboids": {label:"Rhomboids", view:"back", zones:["midBack"]},
  "abdominals": {label:"Abs", view:"front", zones:["abs"]},
  "obliques": {label:"Obliques", view:"front", zones:["obliqueL","obliqueR"]},
  "core": {label:"Core", view:"front", zones:["abs","obliqueL","obliqueR"]},
  "deep core": {label:"Deep Core", view:"front", zones:["abs","obliqueL","obliqueR"]},
  "trunk": {label:"Trunk", view:"front", zones:["abs","obliqueL","obliqueR"]},
  "spinal erectors": {label:"Spinal Erectors", view:"back", zones:["erectors"]},
  "lower back": {label:"Lower Back", view:"back", zones:["erectors"]},
  "hip flexors": {label:"Hip Flexors", view:"front", zones:["hipFlexL","hipFlexR"]}
};

function canonicalMuscle(name){
  const key=String(name||"").trim().toLowerCase();
  if(MUSCLE_TAXONOMY[key]) return MUSCLE_TAXONOMY[key];
  const found=Object.keys(MUSCLE_TAXONOMY).find(k=>key.includes(k)||k.includes(key));
  return MUSCLE_TAXONOMY[found]||{label:titleWords(name)||"Supporting Muscles",view:"front",zones:["abs"]};
}

function exerciseGuideLevel(exercise){
  if(PILOT_GUIDE_ORDER.includes(exercise.name)) return {id:"complete",label:"Complete Guide"};
  if((exercise.setup||[]).length>=3 && (exercise.steps||[]).length>=3) return {id:"written",label:"Written Guide"};
  return {id:"basic",label:"Basic Reference"};
}

function normalizeExerciseGuideRecord(exercise){
  const level=exerciseGuideLevel(exercise);
  return {
    id:String(exercise.name||"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,""),
    name:exercise.name,
    classification:{category:roleLabel(exercise).toLowerCase(),movementPattern:String(exercise.pattern||"Accessory").toLowerCase(),bodyRegions:[bodyRegionLabel(exercise)],difficulty:levelLabel(exercise)},
    purpose:{summary:exercise.whatItIs||exercise.summary,trainingRoles:[...(exercise.role||[])]},
    muscles:{primary:[...(exercise.primary||[])],secondary:[...(exercise.secondary||[])]},
    equipment:{required:[...(exercise.equipment||[])],optional:[]},
    instruction:{setup:[...(exercise.setup||[])],execution:[...(exercise.steps||[])],cues:[...(exercise.cues||[])],mistakes:[...(exercise.mistakes||[])],feel:exercise.feel||inferExerciseFeel(exercise)},
    media:{artwork:{src:thumbnailUrl(exercise),callouts:[...(exercise.callouts||[])]},video:{status:"planned",frontView:null,sideView:null,coachingVideo:null}},
    substitutions:[...(exercise.substitutions||[])],
    guideLevel:level
  };
}

function inferExerciseFeel(exercise){
  const primary=(exercise.primary||[]).map(v=>canonicalMuscle(v).label);
  const expected=primary.length?`You should feel ${primary.join(primary.length>1?", ":"")} working while the movement remains controlled and balanced.`:"You should feel the intended muscles working through a controlled range of motion.";
  const concerning=`You should not feel sharp pain, pinching, sudden weakness, numbness, or loss of control.`;
  return {expected:[expected],concerning:[concerning]};
}

function mistakeCorrection(mistake,exercise){
  const text=String(mistake||"").replace(/[.]$/,'');
  const lower=text.toLowerCase();
  if(/knee.*cav|collapse/.test(lower)) return "Spread the floor and keep each knee tracking over the foot.";
  if(/round|back/.test(lower)) return "Reduce the load or range and rebuild the brace before continuing.";
  if(/lean|forward/.test(lower)) return "Keep pressure through the whole foot and let the hips and knees move together.";
  if(/depth|range/.test(lower)) return "Use only the range you can control and progress it gradually.";
  if(/momentum|rush|bounce/.test(lower)) return "Slow the rep down and own the transition before adding speed or load.";
  if(/shrug/.test(lower)) return "Set the shoulder blade before the rep and keep the neck relaxed.";
  return `Reset the position, reduce the load if needed, and repeat the rep with ${exercise.pattern.toLowerCase()} mechanics intact.`;
}

function anatomyZones(exercise,view){
  const primary=new Set(),secondary=new Set();
  (exercise.primary||[]).forEach(name=>{const m=canonicalMuscle(name);if(m.view===view)m.zones.forEach(z=>primary.add(z))});
  (exercise.secondary||[]).forEach(name=>{const m=canonicalMuscle(name);if(m.view===view && !primary.has(m.zones[0]))m.zones.forEach(z=>secondary.add(z))});
  return {primary,secondary};
}

function anatomyFigureSvg(exercise,view="front"){
  const {primary,secondary}=anatomyZones(exercise,view);
  const uid=`anatomy-${view}-${String(exercise.name||"exercise").toLowerCase().replace(/[^a-z0-9]+/g,"-")}`;
  const cls=id=>primary.has(id)?"primary":secondary.has(id)?"secondary":"";
  const zone=(id,shape)=>`<g class="anatomy-zone ${cls(id)}" data-zone="${id}">${shape}</g>`;
  return `<svg class="professional-anatomy-svg ${view}" viewBox="0 0 210 350" role="img" aria-label="${escapeHtml(view)} anatomy view for ${escapeHtml(exercise.name)}" xmlns="http://www.w3.org/2000/svg">
  <defs><linearGradient id="${uid}-body" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#25313b"/><stop offset=".55" stop-color="#121a21"/><stop offset="1" stop-color="#080d11"/></linearGradient><filter id="${uid}-glow" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
  <g class="anatomy-silhouette" fill="url(#${uid}-body)" stroke="#65727d" stroke-width="1.8" stroke-linejoin="round"><ellipse cx="105" cy="25" rx="17" ry="21"/><path d="M92 46h26l8 13-11 12H95L84 59z"/><path d="M68 63q37-21 74 0l13 43-9 81-23 35H87l-23-35-9-81z"/><path d="M66 69Q45 76 38 101L18 170q-5 14 7 18l12-6 22-58 19-35z"/><path d="M144 69q21 7 28 32l20 69q5 14-7 18l-12-6-22-58-19-35z"/><path d="M82 214q23 14 46 0l5 28-16 22H93l-16-22z"/><path d="M79 238h27l-7 70-10 36H62l9-39z"/><path d="M104 238h27l8 67 9 39h-27l-10-36z"/></g>
  <g class="anatomy-detail" fill="none" stroke="#33414c" stroke-width="1.5" opacity=".9"><path d="M105 49v168M79 89q26 12 52 0M76 125q29 15 58 0M78 174q27 16 54 0M86 239l-8 67M124 239l8 67"/>${view==="front"?'<path d="M84 84q21 14 42 0M89 108h32M88 129h34M87 150h36"/>':'<path d="M78 82q27 20 54 0M86 105q19 14 38 0M88 154q17 15 34 0"/>'}</g>
  <g class="anatomy-highlights" filter="url(#${uid}-glow)">
  ${zone("pecL",'<path d="M77 78q14-13 27 1l-2 27q-16 6-28-7z"/>')}${zone("pecR",'<path d="M133 78q-14-13-27 1l2 27q16 6 28-7z"/>')}${zone("upperPecL",'<path d="M78 77q14-11 27 1l-1 10q-15 3-27-4z"/>')}${zone("upperPecR",'<path d="M132 77q-14-11-27 1l1 10q15 3 27-4z"/>')}
  ${zone("shoulderL",'<ellipse cx="68" cy="79" rx="13" ry="17"/>')}${zone("shoulderR",'<ellipse cx="142" cy="79" rx="13" ry="17"/>')}${zone("frontDeltL",'<path d="M60 73q9-13 18 0l-2 17q-11 4-17-4z"/>')}${zone("frontDeltR",'<path d="M150 73q-9-13-18 0l2 17q11 4 17-4z"/>')}${zone("rearDeltL",'<path d="M61 73q8-12 17 0l-2 17q-10 4-16-4z"/>')}${zone("rearDeltR",'<path d="M149 73q-8-12-17 0l2 17q10 4 16-4z"/>')}
  ${zone("bicepsL",'<ellipse cx="53" cy="113" rx="9" ry="20" transform="rotate(13 53 113)"/>')}${zone("bicepsR",'<ellipse cx="157" cy="113" rx="9" ry="20" transform="rotate(-13 157 113)"/>')}${zone("tricepsL",'<ellipse cx="51" cy="113" rx="8" ry="22" transform="rotate(13 51 113)"/>')}${zone("tricepsR",'<ellipse cx="159" cy="113" rx="8" ry="22" transform="rotate(-13 159 113)"/>')}${zone("forearmL",'<path d="M42 134l-16 42 10 4 19-38z"/>')}${zone("forearmR",'<path d="M168 134l16 42-10 4-19-38z"/>')}
  ${zone("abs",'<path d="M87 107q18-9 36 0l-4 68q-14 17-28 0z"/>')}${zone("obliqueL",'<path d="M77 111l14 2-4 62-12-18z"/>')}${zone("obliqueR",'<path d="M133 111l-14 2 4 62 12-18z"/>')}${zone("latL",'<path d="M76 90q14 8 24 20l-8 65-17-24z"/>')}${zone("latR",'<path d="M134 90q-14 8-24 20l8 65 17-24z"/>')}${zone("upperBack",'<path d="M75 75q30 26 60 0l-5 42q-25 19-50 0z"/>')}${zone("midBack",'<path d="M84 109q21 18 42 0l-5 45q-16 16-32 0z"/>')}${zone("traps",'<path d="M90 51h30l16 30q-31 20-62 0z"/>')}${zone("erectors",'<path d="M96 114h9v78l-9 17-7-18zM105 114h9l7 77-7 18-9-17z"/>')}
  ${zone("hipFlexL",'<path d="M86 181q10-8 19 2l-4 28-13 4-7-18z"/>')}${zone("hipFlexR",'<path d="M124 181q-10-8-19 2l4 28 13 4 7-18z"/>')}${zone("gluteL",'<path d="M80 182q13-14 25 4v31q-17 10-29-3z"/>')}${zone("gluteR",'<path d="M130 182q-13-14-25 4v31q17 10 29-3z"/>')}${zone("gluteMedL",'<path d="M78 179q14-10 25 2l-2 13q-15 6-25-3z"/>')}${zone("gluteMedR",'<path d="M132 179q-14-10-25 2l2 13q15 6 25-3z"/>')}
  ${zone("quadL",'<path d="M75 235q17-13 30 1l-7 65-16 17-12-18z"/>')}${zone("quadR",'<path d="M135 235q-17-13-30 1l7 65 16 17 12-18z"/>')}${zone("adductorL",'<path d="M92 232h13l-5 66-12-4z"/>')}${zone("adductorR",'<path d="M118 232h-13l5 66 12-4z"/>')}${zone("hamL",'<path d="M75 234q17-12 30 1l-7 67-16 16-12-18z"/>')}${zone("hamR",'<path d="M135 234q-17-12-30 1l7 67 16 16 12-18z"/>')}${zone("calfL",'<path d="M72 301q15-8 25 4l-9 37H64z"/>')}${zone("calfR",'<path d="M138 301q-15-8-25 4l9 37h24z"/>')}${zone("shinL",'<path d="M83 300h12l-8 42H68z"/>')}${zone("shinR",'<path d="M127 300h-12l8 42h19z"/>')}
  </g><text x="105" y="347" text-anchor="middle" class="anatomy-view-label">${view.toUpperCase()}</text></svg>`;
}

function renderProfessionalMuscleMap(exercise){
  const primary=(exercise.primary||[]).map(v=>canonicalMuscle(v).label);
  const secondary=(exercise.secondary||[]).map(v=>canonicalMuscle(v).label);
  if(exercise.name==="Back Squat"){
    return `<div class="professional-muscle-map production-muscle-map"><img alt="Back squat anatomy map highlighting quads and glutes as primary muscles and adductors and core as secondary muscles" src="./assets/library/back-squat-muscle-map.png?v=13710"/><div class="muscle-map-legend production-legend"><div><span class="legend-swatch primary"></span><strong>Primary</strong><p>${escapeHtml([...new Set(primary)].join(" · "))}</p></div><div><span class="legend-swatch secondary"></span><strong>Secondary</strong><p>${escapeHtml([...new Set(secondary)].join(" · "))}</p></div></div></div>`;
  }
  return `<div class="professional-muscle-map"><div class="anatomy-pair"><div class="anatomy-view">${anatomyFigureSvg(exercise,"front")}</div><div class="anatomy-view">${anatomyFigureSvg(exercise,"back")}</div></div><div class="muscle-map-legend"><div><span class="legend-swatch primary"></span><strong>Primary</strong><p>${primary.length?escapeHtml([...new Set(primary)].join(" · ")):"General movement musculature"}</p></div><div><span class="legend-swatch secondary"></span><strong>Secondary</strong><p>${secondary.length?escapeHtml([...new Set(secondary)].join(" · ")):"Stabilizers as required"}</p></div></div></div>`;
}

function updateExerciseDetailFavoriteButton(name){
  const button=document.getElementById("exerciseDetailFavoriteButton");
  if(button){button.textContent=`${isExerciseFavorite(name)?"★ Saved":"☆ Save"}`;button.classList.toggle("saved",isExerciseFavorite(name));}
}
function renderGuideCategoryChips(){return}
function openExerciseLibraryWithCategory(category){exerciseLibraryCategory=category||"all";exerciseLibraryPattern="all";exerciseLibraryFavoritesOnly=false;showScreen("exerciseLibrary");renderExerciseLibrary()}
function searchExerciseGuideLibrary(){const input=document.getElementById("exerciseGuideSearch");const libraryInput=document.getElementById("exerciseLibrarySearch");if(libraryInput)libraryInput.value=input?.value||"";openExerciseLibraryWithCategory("all")}

function openExerciseDetail(name){
  const active=document.querySelector(".screen.active");
  if(active?.id!=="exerciseGuide") exerciseDetailReturnScreen=active?.id||"exerciseLibrary";
  const swap=document.getElementById("exerciseSwapModal");exerciseDetailReturnSwap=!!swap&&!swap.classList.contains("hidden");if(exerciseDetailReturnSwap)swap.classList.add("hidden");
  const x=findExercise(name), guide=normalizeExerciseGuideRecord(x);currentExerciseDetailName=x.name;
  const alternatives=rankExerciseAlternatives(x.name).slice(0,5);const substitutions=(x.substitutions||[]).length?x.substitutions:alternatives.map(v=>v.name).slice(0,3);
  setText("exerciseGuideTitle",x.name);const search=document.getElementById("exerciseGuideSearch");if(search)search.value="";updateExerciseDetailFavoriteButton(x.name);
  const tags=document.getElementById("exerciseGuideTags");if(tags)tags.innerHTML=`<span class="exercise-page-tag primary">${escapeHtml(roleLabel(x))}</span><span class="exercise-page-tag">${escapeHtml(bodyRegionLabel(x))}</span><span class="exercise-page-tag">${escapeHtml(x.pattern)}</span><span class="exercise-page-tag guide-level ${guide.guideLevel.id}">${escapeHtml(guide.guideLevel.label)}</span>`;
  const artwork=document.getElementById("exerciseGuideArtwork");if(artwork)artwork.innerHTML=renderInstructionalHero(x);
  const feel=guide.instruction.feel||inferExerciseFeel(x);
  const lower=document.getElementById("exerciseGuideLower");if(lower)lower.innerHTML=`
    <section class="exercise-page-card numbered guide-core-card"><div class="guide-card-kicker">Before the first rep</div><h3>Setup</h3><ol>${guide.instruction.setup.map(v=>`<li>${escapeHtml(v)}</li>`).join("")}</ol></section>
    <section class="exercise-page-card numbered guide-core-card"><div class="guide-card-kicker">During the movement</div><h3>Execution</h3><ol>${guide.instruction.execution.map(v=>`<li>${escapeHtml(v)}</li>`).join("")}</ol></section>
    <section class="exercise-page-card guide-core-card"><div class="guide-card-kicker">Keep it simple</div><h3>Bell Coaching Cues</h3><ul class="cue-list">${guide.instruction.cues.map(v=>`<li>${escapeHtml(v)}</li>`).join("")}</ul></section>
    <section class="exercise-page-card guide-wide-card"><div class="guide-card-kicker">Troubleshooting</div><h3>Common Mistakes & Corrections</h3><div class="mistake-grid">${guide.instruction.mistakes.map(v=>`<article><strong>${escapeHtml(String(v).replace(/[.]$/,''))}</strong><p>${escapeHtml(mistakeCorrection(v,x))}</p></article>`).join("")}</div></section>
    <section class="exercise-page-card guide-feel-card"><div class="guide-card-kicker">Body awareness</div><h3>What You Should Feel</h3><div class="feel-columns"><div><strong>Expected</strong>${(feel.expected||[]).map(v=>`<p>${escapeHtml(v)}</p>`).join("")}</div><div class="concerning"><strong>Stop or modify</strong>${(feel.concerning||[]).map(v=>`<p>${escapeHtml(v)}</p>`).join("")}</div></div></section>`;
  const side=document.getElementById("exerciseGuideSidebar");if(side)side.innerHTML=`
    <section class="exercise-page-card guide-purpose-card"><div class="guide-card-kicker">Why Bell uses it</div><h3>What It Is</h3><p>${escapeHtml(guide.purpose.summary)}</p></section>
    <section class="exercise-page-card professional-muscle-card"><div class="guide-card-kicker">Training emphasis</div><h3>Muscles Worked</h3>${renderProfessionalMuscleMap(x)}</section>
    <section class="exercise-page-card"><div class="guide-card-kicker">Required setup</div><h3>Equipment</h3><div class="exercise-equipment-row">${guide.equipment.required.map(v=>`<span>${escapeHtml(v)}</span>`).join("")}</div></section>
    <section class="exercise-page-card"><div class="guide-card-kicker">Preserve the purpose</div><h3>Scale or Substitute</h3><div class="professional-substitute-list">${substitutions.length?substitutions.map((v,i)=>`<button onclick="openExerciseDetail('${escapeQuote(v)}')" type="button"><strong>${escapeHtml(v)}</strong><span>${escapeHtml(i===0?"Simpler or more accessible option":i===1?"Preserves the movement with a different setup":"Alternative loading or control strategy")}</span></button>`).join(""):`<p>More options will appear as the library expands.</p>`}</div></section>
    <section class="exercise-page-card" id="exerciseSimilarLiftsSection"><div class="guide-card-kicker">Movement family</div><h3>Similar Lifts</h3><div class="exercise-similar-list">${alternatives.length?alternatives.map(v=>`<button onclick="openExerciseDetail('${escapeQuote(v.name)}')" type="button"><strong>${escapeHtml(v.name)}</strong><span>${escapeHtml(v.reason)}</span></button>`).join(""):`<span>No close alternatives cataloged yet.</span>`}</div></section>`;
  showScreen("exerciseGuide");document.querySelector('.app-nav button[data-screen="exerciseLibrary"]')?.classList.add("active");window.scrollTo(0,0);
}
function scrollExerciseSimilarLifts(){document.getElementById("exerciseSimilarLiftsSection")?.scrollIntoView({behavior:"smooth",block:"start"})}
function closeExerciseDetail(){showScreen(exerciseDetailReturnScreen||"exerciseLibrary");if(exerciseDetailReturnScreen==="exerciseLibrary")renderExerciseLibrary();if(exerciseDetailReturnSwap)document.getElementById("exerciseSwapModal")?.classList.remove("hidden");exerciseDetailReturnSwap=false}

function exerciseReplacementReasonLabel(reason){return ({preference:"Exercise preference",equipment:"Equipment unavailable",pain:"Pain or discomfort",crowded:"Gym is crowded",setup:"Need a faster setup",space:"Limited space",noise:"Need a quieter option",skill:"Need a simpler variation",other:"Other constraint"})[reason]||"Exercise preference";}
function exerciseAvailableAtActiveLocation(name){if(typeof exerciseRequirements!=="function")return true;const req=exerciseRequirements(name)||[];return !req.length||(typeof hasAnyEquipment==="function"&&hasAnyEquipment(req));}
function rankExerciseAlternatives(name,reason="preference"){
  const source=findExercise(name);const activeEquipment=(typeof activeEquipmentLocation==="function"?activeEquipmentLocation().equipment:[])||[];
  return exerciseCatalog().filter(x=>x.name!==source.name).map(x=>{let score=0;if(x.pattern===source.pattern)score+=50;score+=x.primary.filter(m=>source.primary.includes(m)).length*12;score+=x.role.filter(r=>source.role.includes(r)).length*6;const available=exerciseAvailableAtActiveLocation(x.name);if(reason==="equipment"){if(available)score+=30;else score-=100}if(reason==="skill"&&/bodyweight|machine|dumbbell/i.test(x.equipment.join(" ")))score+=8;if(reason==="setup"&&x.equipment.length===1)score+=5;if(reason==="crowded"&&/dumbbell|bodyweight|band/i.test(x.equipment.join(" ")))score+=8;return {name:x.name,score,available,reason:x.pattern===source.pattern?`Preserves the ${source.pattern.toLowerCase()} pattern`:`Targets ${x.primary.join(" and ").toLowerCase()}`}}).filter(x=>x.score>=45).sort((a,b)=>b.score-a.score||a.name.localeCompare(b.name));
}

function openExerciseSwap(index){
  exerciseSwapIndex=index;const exercise=data.activeWorkout?.exercises?.[index];if(!exercise)return;
  const reason=document.getElementById("exerciseSwapReason");if(reason)reason.value=exercise.equipmentAdjusted?"equipment":(exercise.replacementReason||"preference");
  const scope=document.getElementById("exerciseSwapScope");if(scope)scope.value="today";
  setText("exerciseSwapTitle",`Replace ${exercise.name}`);
  const original=document.getElementById("exerciseSwapOriginal");
  if(original){const handled=(exercise.sets||[]).filter(set=>set.done||set.skipped).length;const origin=exercise.originalExercise&&exercise.originalExercise!==exercise.name?`<br><span>Originally programmed: ${escapeHtml(exercise.originalExercise)}</span>`:"";const warning=handled?`<br><span class="replacement-warning">${handled} set${handled===1?"":"s"} already handled. Completed entries will be preserved; only remaining sets receive the new load suggestion.</span>`:"";original.innerHTML=`<strong>Current prescription:</strong> ${escapeHtml(exercise.name)} • ${escapeHtml(exercise.prescription||"")}${origin}${warning}<br><span>The replacement keeps the current sets and rep targets unless you edit them.</span>`;}
  document.getElementById("exerciseSwapModal")?.classList.remove("hidden");renderExerciseSwapOptions();
}
function openExerciseReplacement(index){openExerciseSwap(index);}
function closeExerciseSwap(){document.getElementById("exerciseSwapModal")?.classList.add("hidden");exerciseSwapIndex=null}
function renderExerciseSwapOptions(){
  const exercise=data.activeWorkout?.exercises?.[exerciseSwapIndex];const container=document.getElementById("exerciseSwapOptions");if(!exercise||!container)return;
  const reason=document.getElementById("exerciseSwapReason")?.value||"preference";const location=typeof activeEquipmentLocation==="function"?activeEquipmentLocation():null;
  const options=rankExerciseAlternatives(exercise.originalExercise||exercise.name,reason).slice(0,8);
  container.innerHTML=options.length?options.map(x=>{const found=findExercise(x.name),equipment=(found.equipment||[]).join(", ")||"No special equipment",availability=reason==="equipment"&&location?`<span class="replacement-availability ${x.available?"available":"unavailable"}">${x.available?`Available at ${escapeHtml(location.name)}`:`Unavailable at ${escapeHtml(location.name)}`}</span>`:"";return `<div class="exercise-swap-option"><div><h3>${escapeHtml(x.name)}</h3><p>${escapeHtml(x.reason)}. ${escapeHtml(equipment)}.</p>${availability}<button class="link-button" onclick="openExerciseDetail('${escapeQuote(x.name)}')" type="button">Open guide</button></div><button ${reason==="equipment"&&!x.available?"disabled":""} onclick="selectExerciseReplacement('${escapeQuote(x.name)}')" type="button">Use This</button></div>`}).join(""):'<div class="performance-callout">No purpose-matched option is available with the current location setup. Keep the movement, change training location, or choose another reason.</div>';
}
function selectExerciseReplacement(replacementName){
  const index=exerciseSwapIndex,active=data.activeWorkout,exercise=active?.exercises?.[index];if(!exercise)return;
  const previousName=exercise.name,originalName=exercise.originalExercise||previousName;const reason=document.getElementById("exerciseSwapReason")?.value||"preference";const scope=document.getElementById("exerciseSwapScope")?.value||"today";
  const handled=(exercise.sets||[]).filter(set=>set.done||set.skipped).length;if(handled&&!confirm(`${handled} set${handled===1?" has":"s have"} already been handled. Preserve those entries and replace the remaining work?`))return;
  const location=typeof activeEquipmentLocation==="function"?activeEquipmentLocation():null;const status=active?.readiness?.status||(typeof readinessStatus==="function"?readinessStatus():"GREEN");const rec=typeof recommendedWeight==="function"?recommendedWeight(replacementName,status):null;const guide=findExercise(replacementName);
  exercise.originalExercise=originalName;exercise.replacedFrom=previousName;exercise.name=replacementName;exercise.userAdjusted=true;exercise.equipmentAdjusted=false;exercise.equipmentAdjustmentReason="";exercise.replacementSource="athlete";exercise.replacementReason=reason;exercise.replacementReasonLabel=exerciseReplacementReasonLabel(reason);exercise.replacementScope=scope;exercise.replacementAt=new Date().toISOString();exercise.replacementLocation=location?.name||active?.equipmentLocation||"";exercise.recommendedWeight=rec?.value??"";exercise.recommendationDisplay=rec?.display||"Choose by effort";exercise.recommendationNote=rec?.note||`Purpose-matched replacement for ${originalName}.`;exercise.cue=`Replaced ${previousName} because: ${exerciseReplacementReasonLabel(reason)}. ${(guide.cues||[])[0]||"Use controlled technique and preserve the intended movement pattern."}`;
  exercise.sets=(exercise.sets||[]).map(set=>{if(set.done||set.skipped)return set;const load=typeof rec?.value==="number"?rec.value:"";return {...set,plannedWeight:load,weight:load};});
  if(scope!=="today"){
    data.exerciseIntelligence=data.exerciseIntelligence||{replacements:[],personalConstraints:[]};data.exerciseIntelligence.replacements=data.exerciseIntelligence.replacements||[];
    data.exerciseIntelligence.replacements=data.exerciseIntelligence.replacements.filter(r=>!(r.originalName===originalName&&r.scope===scope));
    data.exerciseIntelligence.replacements.push({originalName,replacementName,reason,reasonLabel:exerciseReplacementReasonLabel(reason),scope,blockId:scope==="block"?(data.trainingBlock.generatedAt||data.trainingBlock.startDate||""):"",locationId:location?.id||"",locationName:location?.name||"",createdAt:new Date().toISOString()});
  }
  persistLibraryState();closeExerciseSwap();if(typeof saveData==="function")saveData({render:false});renderActiveWorkout();
}

function applySavedExerciseReplacement(exercise){
  const rules=data.exerciseIntelligence?.replacements||[];const name=exercise.originalExercise||exercise.name;const currentBlock=data.trainingBlock?.generatedAt||data.trainingBlock?.startDate||"";
  const rule=[...rules].reverse().find(r=>r.originalName===name&&(r.scope==="always"||(r.scope==="block"&&r.blockId===currentBlock)));
  if(!rule)return exercise;return {...exercise,name:rule.replacementName,originalExercise:name,userAdjusted:true,replacementSource:"saved",replacementReason:rule.reason,replacementReasonLabel:rule.reasonLabel||exerciseReplacementReasonLabel(rule.reason),replacementScope:rule.scope,replacementLocation:rule.locationName||"",cue:`Saved replacement for ${name}. ${findExercise(rule.replacementName).cues[0]} ${exercise.cue||""}`};
}
