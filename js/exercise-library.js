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


function buildExerciseTeaching(name,meta){
  const n=String(name||"").toLowerCase();
  const muscleText=meta.primary.join(" and ").toLowerCase();
  const base={
    summary:`A ${meta.pattern.toLowerCase()} movement used to develop ${muscleText} with a repeatable, controlled technique.`,
    why:`Bell Performance uses this movement to build ${muscleText} while reinforcing the ${meta.pattern.toLowerCase()} pattern needed elsewhere in the program.`,
    setup:[`Set the equipment so you can begin in a stable position without reaching or twisting.`,`Use a range of motion you can control without pain.`,`Choose a load that lets the final repetitions remain technically consistent.`],
    steps:[`Create tension before the first repetition.`,`Move through the intended ${meta.pattern.toLowerCase()} pattern without rushing the difficult portion.`,`Finish under control, reset your position, and repeat.`],
    cues:["Own the starting position.","Move smoothly; do not chase momentum.","End the set when position changes noticeably."],
    mistakes:["Using more load than the position can support.","Shortening the range to finish repetitions.","Continuing through sharp pain, numbness, or instability."],
    breathing:["Inhale and brace before the hardest portion of the repetition.","Exhale after passing the sticking point while keeping the trunk controlled.","For continuous conditioning work, use rhythmic breathing that matches the effort."],
    regressions:["Reduce the load and slow the tempo.","Shorten the range of motion to a pain-free, controlled range.","Use a supported or machine-based version of the same pattern."],
    progressions:["Increase load only after all prescribed reps look alike.","Add a pause or controlled eccentric before adding more weight.","Progress to a less-supported or more demanding variation."],
    substitutions:["Choose an exercise with the same movement pattern and primary muscles.","Match the original intent: strength, hypertrophy, power, conditioning, or mobility.","Avoid substituting solely because another exercise feels harder."],
    safety:"Stop and modify the exercise for sharp pain, loss of balance, numbness, dizziness, or a sudden change in normal movement quality.",
    start:"Stable setup with tension established",finish:"Controlled finish with posture maintained",
    media:{thumbnail:"",animation:"",video:"",status:"planned"}
  };
  const templates={
    "Squat":{
      summary:`A knee- and hip-dominant lower-body movement that develops ${muscleText}.`,
      why:"Squatting builds leg strength, reinforces lower-body control, and provides the foundation for jumping, running, lifting, and daily movement.",
      setup:["Set the feet at a comfortable width with the whole foot planted.","Brace the trunk before beginning the descent.","Allow the knees to track in the same direction as the toes."],
      steps:["Lower the hips between the legs while maintaining full-foot pressure.","Descend only as far as the pelvis, knees, and torso remain controlled.","Drive the floor away and stand with the hips and shoulders rising together."],
      cues:["Brace before you move.","Keep the whole foot heavy.","Sit between the hips; push the floor away."],
      mistakes:["Heels lifting or arches collapsing.","Knees falling inward.","Chest collapsing or hips shooting up first."],
      breathing:["Take a breath into the abdomen and sides before descending.","Hold the brace through the bottom and early ascent.","Exhale near the top, then reset before the next rep."],
      regressions:["Box squat to a controlled target.","Goblet squat.","Bodyweight squat with counterbalance."],
      progressions:["Tempo or pause squat.","Front-loaded squat variation.","Heavier barbell squat while preserving depth and control."],
      start:"Feet rooted, trunk braced, hips and knees unlocked",finish:"Standing tall with ribs stacked over the pelvis"
    },
    "Hinge":{
      summary:`A hip-dominant movement that loads the posterior chain, especially ${muscleText}.`,
      why:"The hinge builds force through the hips and teaches the athlete to load the hamstrings without turning every lower-body movement into a squat.",
      setup:["Stand with the load close to the body and feet firmly planted.","Soften the knees, brace the trunk, and set the shoulders.","Create tension through the lats before moving the hips."],
      steps:["Push the hips backward while keeping the load close.","Continue until the hamstrings are loaded or the prescribed start position is reached.","Drive the hips forward and finish tall without leaning backward."],
      cues:["Close the car door with your hips.","Keep the load close.","Stand tall; do not overextend."],
      mistakes:["Squatting the weight instead of hinging.","Rounding to reach a deeper range.","Letting the load drift away from the body."],
      breathing:["Brace before initiating the hinge.","Maintain pressure through the most demanding portion.","Exhale after the hips pass through and the torso is stable."],
      regressions:["Dowel hip-hinge drill.","Kettlebell deadlift from an elevated position.","Reduced-range Romanian deadlift."],
      progressions:["Tempo Romanian deadlift.","Paused deadlift or deficit variation when appropriate.","Heavier bilateral hinge with consistent bar path."],
      start:"Hips loaded, spine controlled, load close",finish:"Hips extended with ribs stacked and glutes engaged"
    },
    "Horizontal Press":{
      summary:`A pressing movement that develops ${muscleText} while training shoulder and trunk stability.`,
      why:"Horizontal pressing builds upper-body force and muscle while teaching the shoulder blades, elbows, and wrists to work as one stable pressing system.",
      setup:["Set the shoulders in a stable position and keep the wrists stacked over the forearms.","Plant the feet or create a stable body line for bodyweight variations.","Choose a grip that does not force painful shoulder rotation."],
      steps:["Lower under control toward the prescribed touch point or depth.","Keep the forearms aligned with the direction of force.","Press away while maintaining shoulder and trunk position."],
      cues:["Stay tight before you press.","Stack wrists over elbows.","Press smoothly without losing the shoulder position."],
      mistakes:["Elbows flaring suddenly.","Shoulders rolling forward at the bottom.","Bouncing, over-arching, or using uncontrolled momentum."],
      breathing:["Inhale and brace before lowering.","Hold tension through the bottom transition.","Exhale as the implement moves through the sticking point."],
      regressions:["Incline push-up.","Neutral-grip dumbbell press.","Machine chest press with controlled range."],
      progressions:["Paused press.","Unilateral dumbbell press.","Heavier free-weight press with consistent touch point."],
      start:"Shoulders stable, wrists stacked, trunk braced",finish:"Arms extended without shoulders rolling forward"
    },
    "Vertical Press":{
      summary:`An overhead pressing movement for ${muscleText} and whole-body stability.`,
      why:"Vertical pressing develops overhead strength while teaching the athlete to keep the ribs, pelvis, and shoulder blades controlled under load.",
      setup:["Stand or sit with a stable base and the load near shoulder level.","Brace the abdomen and avoid beginning with the ribs flared.","Set the forearms under the implement."],
      steps:["Press upward while keeping the load close to the body's center line.","Allow the shoulder blades to rotate naturally as the arms rise.","Finish overhead without leaning backward, then lower under control."],
      cues:["Ribs down; press tall.","Move your head through after the weight clears.","Finish stacked, not arched."],
      mistakes:["Turning the press into a standing incline press.","Pressing around the body instead of vertically.","Lowering too quickly or losing wrist position."],
      breathing:["Brace before the press.","Exhale through the sticking point while keeping the trunk firm.","Reset the breath with the load securely returned."],
      regressions:["Half-kneeling landmine press.","Neutral-grip dumbbell press.","Machine shoulder press."],
      progressions:["Strict barbell press.","Single-arm overhead press.","Push press for power when the program calls for it."],
      start:"Load supported near shoulders, trunk stacked",finish:"Arms overhead with ribs and pelvis controlled"
    },
    "Vertical Pull":{
      summary:`A vertical pulling movement that develops ${muscleText}.`,
      why:"Vertical pulls build the lats, upper back, arms, and grip while supporting shoulder balance and overhead control.",
      setup:["Use a secure grip and begin with the shoulders controlled rather than shrugged.","Brace the trunk and keep the legs quiet unless assistance is prescribed.","Select assistance or load that allows a complete, repeatable range."],
      steps:["Initiate by drawing the shoulder blades down and engaging the back.","Pull the elbows toward the ribs while keeping the chest controlled.","Lower to a full, active stretch without dropping into the shoulders."],
      cues:["Drive elbows toward your pockets.","Keep the ribs controlled.","Own the lowering phase."],
      mistakes:["Kicking or swinging to complete reps.","Pulling only with the arms.","Dropping quickly into the bottom position."],
      breathing:["Inhale in the controlled bottom position.","Exhale while pulling through the hardest range.","Reset while lowering under control."],
      regressions:["Band-assisted pull-up.","Lat pulldown.","Eccentric-only pull-up."],
      progressions:["Unassisted pull-up.","Paused chest-to-bar variation.","Weighted pull-up or chin-up."],
      start:"Arms long with shoulders active and trunk braced",finish:"Elbows drawn down with chest controlled"
    },
    "Horizontal Pull":{
      summary:`A rowing movement that develops ${muscleText} and reinforces shoulder-blade control.`,
      why:"Rows balance pressing volume, strengthen posture, and teach the upper back to stabilize the shoulder during lifting and athletic movement.",
      setup:["Create a stable torso and neutral wrist position.","Begin with the shoulder blade reaching naturally without losing trunk control.","Set the cable, bench, or implement so the pull travels toward the lower ribs."],
      steps:["Initiate by moving the shoulder blade, then drive the elbow backward.","Pause briefly when the elbow reaches the torso.","Return under control until the back is lengthened without the body twisting."],
      cues:["Lead with the elbow.","Pull toward the hip or lower ribs.","Do not shrug into the finish."],
      mistakes:["Rotating or heaving the torso.","Shrugging the shoulder toward the ear.","Cutting the return phase short."],
      breathing:["Brace before the pull.","Exhale as the elbow reaches the body.","Inhale during the controlled return."],
      regressions:["Chest-supported row.","Seated cable row.","Band row."],
      progressions:["Unsupported barbell row.","Paused row.","Heavier unilateral row without torso rotation."],
      start:"Arm extended, shoulder controlled, torso stable",finish:"Elbow near the torso with shoulder blade retracted"
    },
    "Single-Leg":{
      summary:`A unilateral lower-body movement that develops ${muscleText}, balance, and side-to-side control.`,
      why:"Single-leg work exposes strength differences, improves hip and knee control, and transfers well to running, field sports, and daily movement.",
      setup:["Set the feet far enough apart to maintain balance and allow the front foot to stay planted.","Square the hips and brace the trunk.","Use support when needed so balance does not limit the target muscles."],
      steps:["Lower with control through the working hip and knee.","Keep the knee tracking over the toes and maintain full-foot pressure.","Drive through the working leg to return without pushing excessively from the trailing leg."],
      cues:["Stay tall and own the front foot.","Knee follows the toes.","Push through the working leg."],
      mistakes:["Using a stance too narrow to balance.","Pushing mostly from the back leg.","Knee collapsing inward or heel lifting."],
      breathing:["Brace before descending.","Maintain tension at the bottom.","Exhale while driving back to the start."],
      regressions:["Supported split squat.","Low step-up.","Reverse lunge with bodyweight."],
      progressions:["Rear-foot-elevated split squat.","Front-foot-elevated variation.","Loaded walking lunge or step-up."],
      start:"Stable split stance with hips square",finish:"Working leg extended with balance maintained"
    },
    "Elbow Flexion":{
      summary:`An arm-isolation movement that develops ${muscleText}.`,why:"Curl variations add direct arm volume without demanding the recovery cost of another compound pulling exercise.",
      setup:["Set the shoulders down and keep the elbows close to the intended position.","Use a grip that keeps the wrists comfortable.","Choose a load that does not require torso movement."],
      steps:["Curl by bending the elbow while keeping the upper arm controlled.","Squeeze briefly near the top without letting the shoulder roll forward.","Lower fully and slowly until the elbow is extended under control."],
      cues:["Pin the elbow.","Keep the wrist quiet.","Lower slower than you lift."],
      mistakes:["Swinging the torso.","Letting elbows drift forward to shorten the rep.","Dropping the weight through the eccentric."],
      breathing:["Exhale while curling.","Inhale during the controlled lowering phase."],
      regressions:["Lighter dumbbell curl.","Machine curl.","Supported preacher curl."],
      progressions:["Strict barbell or cable curl.","Lengthened-position curl.","Slow eccentric or pause at peak contraction."],
      start:"Arms long with shoulders stable",finish:"Elbows flexed without shoulder movement"
    },
    "Elbow Extension":{
      summary:`A direct triceps movement that develops ${muscleText}.`,why:"Direct triceps work supports pressing strength and adds upper-arm volume without requiring another heavy press.",
      setup:["Set the shoulders and keep the elbows in the intended position.","Use a grip and range that feel comfortable at the elbow.","Choose a load that permits full extension without torso movement."],
      steps:["Extend the elbows while keeping the upper arms controlled.","Reach a strong contraction without snapping the joint.","Return slowly until the triceps are lengthened."],
      cues:["Move at the elbow, not the shoulder.","Finish long without slamming lockout.","Control the return."],
      mistakes:["Using bodyweight to drive the implement.","Allowing elbows to flare or drift excessively.","Cutting off the stretched position."],
      breathing:["Exhale during extension.","Inhale during the controlled return."],
      regressions:["Cable pressdown with lighter load.","Machine dip.","Close-grip incline push-up."],
      progressions:["Overhead cable extension.","Skull crusher with controlled range.","Weighted dip when shoulder position is solid."],
      start:"Elbows flexed with upper arms controlled",finish:"Elbows extended with shoulders stable"
    },
    "Running":{
      summary:"A running session prescribed to develop aerobic capacity, speed, or race-specific endurance.",
      why:"Running sessions improve cardiovascular fitness and movement economy. The exact pace and duration determine whether the goal is recovery, aerobic development, threshold work, or speed.",
      setup:["Use running shoes suited to the surface and start on a clear, predictable route.","Complete the prescribed warm-up before faster work.","Begin easier than goal pace and allow breathing and stride to settle."],
      steps:["Run tall with relaxed shoulders and a compact arm swing.","Land quietly beneath the body rather than reaching far ahead.","Follow the prescribed effort, pace, or interval structure instead of racing every session."],
      cues:["Run tall and relaxed.","Quick, quiet feet.","Save the hardest effort for the prescribed work."],
      mistakes:["Starting too fast.","Overstriding and braking with each step.","Turning an easy or Zone 2 run into a threshold session."],
      breathing:["Easy/Zone 2: breathing should remain controlled enough for short conversation.","Tempo/threshold: use strong rhythmic breathing without sprint-level strain.","Intervals: recover until breathing is controlled enough to repeat the intended quality."],
      regressions:["Run-walk intervals.","Shorter duration on a flat route.","Incline treadmill walk or low-impact aerobic machine."],
      progressions:["Increase total duration gradually.","Add controlled hills or strides.","Progress to longer tempo work or race-specific intervals."],
      safety:"Stop for chest pain, faintness, unusual shortness of breath, loss of coordination, or pain that changes your stride.",
      start:"Tall posture at a controlled opening pace",finish:"Session completed with form and effort appropriate to the prescription"
    },
    "Cardio Machine":{
      summary:"A machine-based conditioning movement used to develop aerobic capacity, power, or repeatable high-intensity output.",
      why:"Conditioning machines allow precise work-to-rest control and can build the Engine with less impact than running.",
      setup:["Adjust the machine to fit your body and secure feet or straps as required.","Learn the resistance and monitor settings before beginning the work interval.","Warm up progressively instead of starting at maximal output."],
      steps:["Use a repeatable full-body rhythm appropriate to the machine.","Match output to the prescribed zone, pace, calories, distance, or time.","During recovery, keep moving lightly unless complete rest is prescribed."],
      cues:["Smooth before fast.","Hold the target output.","Do not sprint the first interval."],
      mistakes:["Using excessive resistance that destroys rhythm.","Starting above the sustainable target.","Allowing posture to collapse as fatigue rises."],
      breathing:["Use rhythmic breathing during steady work.","Exhale forcefully during hard efforts without holding the breath for the full interval.","Use the recovery interval to regain controlled breathing."],
      regressions:["Reduce resistance or target output.","Shorten work intervals and lengthen recovery.","Use steady aerobic work instead of repeated sprints."],
      progressions:["Increase total work time.","Hold the same output with less recovery.","Increase target pace or power while maintaining technique."],
      start:"Machine adjusted with an easy warm-up rhythm",finish:"Target work completed without technique collapse"
    },
    "Jump":{
      summary:`An explosive movement used to develop lower-body power through ${muscleText}.`,why:"Jumps train rapid force production and landing skill. They are performed for quality, not fatigue.",
      setup:["Use a stable, non-slip surface and clear the landing area.","Choose a height or distance you can land quietly and confidently.","Begin with an athletic stance and arms ready to assist."],
      steps:["Load the hips and knees quickly while maintaining balance.","Drive forcefully through the floor and extend the body.","Land softly with knees tracking over the feet, then reset before repeating."],
      cues:["Explode, then land quietly.","Own every landing.","Reset between reps."],
      mistakes:["Choosing a box or distance that requires tucking excessively.","Landing stiff or with knees collapsing inward.","Performing repeated fatigued reps without resetting."],
      breathing:["Take a quick preparatory breath before takeoff.","Exhale naturally during effort and reset breathing between reps."],
      regressions:["Snap-down landing drill.","Low box jump.","Squat jump with controlled landing."],
      progressions:["Higher-quality countermovement jump.","Broad jump or lateral bound.","Loaded jump only when prescribed and technically appropriate."],
      safety:"Stop when landings become loud, unstable, or significantly different from the first repetitions.",
      start:"Athletic stance with balance established",finish:"Stable, quiet landing with control"
    },
    "Core":{
      summary:`A trunk exercise that develops ${muscleText} and the ability to resist unwanted movement.`,why:"Core training helps transfer force between the upper and lower body and supports stable lifting, running, and carrying.",
      setup:["Position the ribs over the pelvis and create light abdominal tension.","Use a range that does not cause the lower back to arch or the neck to strain.","Set the equipment securely before loading the movement."],
      steps:["Create tension before moving the arms or legs.","Maintain the intended trunk position through the full repetition or hold.","End the set when the spine position can no longer be controlled."],
      cues:["Ribs down; belt buckle up.","Brace as if preparing for contact.","Move around a stable trunk."],
      mistakes:["Holding the breath for the entire set.","Arching the lower back to extend range.","Letting hip flexors or neck dominate the exercise."],
      breathing:["Use short controlled breaths behind the brace.","Exhale fully during the hardest portion when the exercise permits.","Do not sacrifice trunk position to take a larger breath."],
      regressions:["Shorter lever or bent-knee variation.","Reduced hold time.","Supported dead bug or plank variation."],
      progressions:["Longer lever.","Added load.","Anti-rotation or dynamic variation with the same trunk control."],
      start:"Ribs and pelvis stacked with abdominal tension",finish:"Repetition completed without loss of trunk position"
    },
    "Carry":{
      summary:`A loaded locomotion exercise that develops ${muscleText}.`,why:"Carries train grip, posture, trunk stiffness, and the ability to maintain position while moving under load.",
      setup:["Choose a clear walking lane and load the implements evenly unless an offset carry is prescribed.","Stand tall before beginning and secure the grip.","Brace the trunk while keeping the shoulders away from the ears."],
      steps:["Walk with short controlled steps and the implements close to the body.","Keep the ribs stacked over the pelvis without leaning or twisting.","Set the weights down with the same control used to pick them up."],
      cues:["Walk tall.","Crush the handles.","Quiet feet and steady ribs."],
      mistakes:["Shrugging and losing neck position.","Leaning excessively away from the load.","Rushing steps or setting the weights down carelessly."],
      breathing:["Brace before the first step.","Take short controlled breaths while maintaining trunk pressure.","Reset fully between trips."],
      regressions:["Lighter farmer carry.","Shorter distance.","Suitcase hold without walking."],
      progressions:["Heavier farmer carry.","Longer distance or duration.","Offset, front-rack, or overhead carry when appropriate."],
      start:"Standing tall with load controlled at the sides or prescribed position",finish:"Distance completed with posture and grip intact"
    },
    "Shoulder Abduction":{
      summary:"An isolation movement that develops the side deltoids and shoulder-width appearance.",why:"Lateral-raise variations add direct shoulder volume with low systemic fatigue and complement pressing work.",
      setup:["Use a light load and a stable torso.","Keep a soft elbow bend and wrists neutral.","Begin with the arms slightly in front of the body rather than directly at the sides."],
      steps:["Raise the arms outward in the shoulder-blade plane.","Stop near shoulder height or the highest pain-free controlled position.","Lower slowly without letting the weights fall."],
      cues:["Lead with the elbows.","Reach wide, not high.","Keep the traps quiet."],
      mistakes:["Using momentum from the hips.","Shrugging the shoulders upward.","Turning the movement into a front raise."],
      breathing:["Exhale while raising.","Inhale during the slow lowering phase."],
      regressions:["One-arm supported lateral raise.","Cable or machine lateral raise with light resistance."],
      progressions:["Longer controlled eccentric.","Lengthened partials after full-range work.","Cable variation for continuous tension."],
      start:"Arms near sides with shoulders relaxed",finish:"Arms raised under control without shrugging"
    },
    "Calf Raise":{
      summary:"An ankle-extension movement that develops the calf complex.",why:"Calf training supports running, jumping, ankle stiffness, and lower-leg muscular development.",
      setup:["Place the ball of the foot securely on the platform with support available for balance.","Keep the ankle tracking straight rather than rolling outward.","Use a load that permits a controlled stretch and full rise."],
      steps:["Lower the heel under control into a comfortable stretch.","Drive through the ball of the foot and rise as high as possible.","Pause briefly at the top, then lower slowly."],
      cues:["Stretch, rise, squeeze.","Keep pressure through the big toe.","Do not bounce."],
      mistakes:["Using short bouncing repetitions.","Rolling onto the outside of the foot.","Letting knee or hip movement create momentum."],
      breathing:["Exhale while rising.","Inhale during the controlled lowering phase."],
      regressions:["Bodyweight calf raise with support.","Reduced range while ankle tolerance improves."],
      progressions:["Single-leg calf raise.","Loaded standing or seated variation.","Paused stretch and top contraction."],
      start:"Heel lowered under control with forefoot secure",finish:"Heel elevated with calf fully contracted"
    }
  };
  const selected=templates[meta.pattern]||{};
  Object.assign(base,selected);
  if(/easy run|zone 2/i.test(name)){
    base.why="This session builds the aerobic base with limited recovery cost, allowing the athlete to accumulate useful work while remaining prepared for strength training.";
    base.cues=["Keep the effort conversational.","Run slower than your ego wants.","Finish feeling capable of continuing."];
    base.mistakes=["Running by pace instead of the prescribed easy effort.","Letting hills turn the session into intervals.","Adding unplanned distance because the session feels good."];
  }else if(/tempo|threshold/i.test(name)){
    base.why="This session raises the speed you can sustain before fatigue and breathing rise sharply.";
    base.cues=["Controlled discomfort, not a sprint.","Settle into the pace.","Keep the final interval technically strong."];
  }else if(/sprint|interval|repeat/i.test(name)&&meta.pattern==="Running"){
    base.why="This session develops speed, running economy, and the ability to repeat hard efforts with planned recovery.";
    base.cues=["Accelerate smoothly.","Fast and relaxed.","Stop before mechanics deteriorate."];
  }
  if(/dumbbell/i.test(name)&&base.setup)base.setup[0]="Choose dumbbells you can control independently and set them within easy reach before beginning.";
  if(/machine|leg press|hack|pec deck/i.test(name)&&base.setup)base.setup[0]="Adjust the seat, pad, and start position so the machine aligns with your joints and allows a controlled range.";
  if(/cable|pulldown|pressdown|face pull/i.test(name)&&base.setup)base.setup[0]="Set the cable height, attachment, and stance so the line of pull matches the intended movement.";
  return base;
}

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
  const teaching=buildExerciseTeaching(name,{pattern,primary,secondary,equipment,role});
  return {pattern,primary,secondary,equipment,role,...teaching};
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
  grid.innerHTML=results.length?results.map(x=>`<button class="exercise-library-card" onclick="openExerciseDetail('${x.name.replace(/'/g,"\\'")}')"><div class="exercise-card-topline"><span class="exercise-pattern-chip">${x.pattern}</span><span class="exercise-guide-badge">Full Guide</span></div><h3>${x.name}</h3><p class="exercise-card-summary">${x.summary}</p><div class="exercise-tags">${x.primary.slice(0,3).map(v=>`<span>${v}</span>`).join("")}${x.equipment.slice(0,2).map(v=>`<span>${v}</span>`).join("")}</div><span class="exercise-card-open">Setup · Steps · Cues · Mistakes · Progressions</span></button>`).join(""):'<div class="card">No exercises match those filters.</div>';
}
function openExerciseDetail(name){
  const x=findExercise(name);setText("exerciseDetailTitle",x.name);const content=document.getElementById("exerciseDetailContent");if(!content)return;
  const alternatives=rankExerciseAlternatives(x.name).slice(0,5);
  const list=(items,ordered=false)=>`<${ordered?"ol":"ul"}>${(items||[]).map(v=>`<li>${v}</li>`).join("")}</${ordered?"ol":"ul"}>`;
  const mediaReady=Boolean(x.media?.animation||x.media?.video);
  content.innerHTML=`
    <div class="exercise-detail-hero">
      <div><span class="exercise-pattern-chip">${x.pattern}</span><div class="exercise-detail-meta">${x.role.map(v=>`<span class="method-chip">${v}</span>`).join("")}</div></div>
      <p>${x.summary}</p>
      <div class="exercise-purpose"><span class="metric-label">Why it is in your program</span><strong>${x.why}</strong></div>
    </div>
    <div class="exercise-media-panel ${mediaReady?"has-media":"media-planned"}">
      <div class="exercise-media-stage">
        ${x.media?.animation?`<video src="${x.media.animation}" autoplay muted loop playsinline></video>`:`<div class="exercise-media-placeholder"><span class="media-play-icon">▶</span><strong>Movement demonstration</strong><small>Animation and coaching video support is built in and ready for future media.</small></div>`}
      </div>
      <div class="exercise-media-actions"><button type="button" ${x.media?.animation?`onclick="window.open('${x.media.animation}','_blank')"`:'disabled'}>View Animation</button><button type="button" ${x.media?.video?`onclick="window.open('${x.media.video}','_blank')"`:'disabled'}>Watch Coaching Video</button></div>
    </div>
    <div class="movement-diagram"><div class="movement-frame"><b>START</b><span>${x.start}</span></div><div class="movement-arrow">→</div><div class="movement-frame"><b>FINISH</b><span>${x.finish}</span></div></div>
    <div class="exercise-detail-grid teaching-grid">
      <section class="exercise-detail-section overview-section"><h3>Muscles & Equipment</h3><p><strong>Primary:</strong> ${x.primary.join(", ")}</p><p><strong>Secondary:</strong> ${x.secondary.length?x.secondary.join(", "):"Stabilizers as required"}</p><p><strong>Equipment:</strong> ${x.equipment.join(", ")}</p></section>
      <section class="exercise-detail-section"><h3>1. Setup</h3>${list(x.setup,true)}</section>
      <section class="exercise-detail-section execution-section"><h3>2. How to Perform It</h3>${list(x.steps,true)}</section>
      <section class="exercise-detail-section cues-section"><h3>Bell Coaching Cues</h3>${list(x.cues)}</section>
      <section class="exercise-detail-section mistakes-section"><h3>Common Mistakes</h3>${list(x.mistakes)}</section>
      <section class="exercise-detail-section"><h3>Breathing & Bracing</h3>${list(x.breathing)}</section>
      <section class="exercise-detail-section"><h3>Make It Easier</h3>${list(x.regressions)}</section>
      <section class="exercise-detail-section"><h3>Make It Harder</h3>${list(x.progressions)}</section>
      <section class="exercise-detail-section"><h3>How to Substitute It</h3>${list(x.substitutions)}</section>
      <section class="exercise-detail-section safety-section"><h3>When to Stop or Modify</h3><p>${x.safety}</p><p class="exercise-safety-note">Technique guidance is educational and does not replace individualized medical evaluation or hands-on coaching.</p></section>
      <section class="exercise-detail-section alternatives-section"><h3>Purpose-Matched Alternatives</h3><ul>${alternatives.map(v=>`<li><button class="link-button" onclick="openExerciseDetail('${v.name.replace(/'/g,"\\'")}')">${v.name}</button> — ${v.reason}</li>`).join("")||"<li>No close alternatives cataloged.</li>"}</ul></section>
    </div>`;
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
