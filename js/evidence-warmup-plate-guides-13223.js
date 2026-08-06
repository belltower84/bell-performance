"use strict";

/* Bell Performance 13.22.3 — Evidence-Informed Barbell Ramps, Plate Math & Movement Guides
   - Uses low-volume, lift-specific ramp sets with descending repetitions.
   - Keeps practical plate landmarks where they fit the prescribed working load.
   - Adds plate-loading math and expanded movement-preparation instructions. */
(function(){
  const VERSION="13.22.3";
  const esc=value=>String(value??"").replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
  const jsq=value=>String(value??"").replace(/\\/g,"\\\\").replace(/'/g,"\\'");
  const appData=()=>{try{if(typeof data!=="undefined"&&data)return data;}catch(_){}return window.data||null;};
  const round5=value=>Math.max(0,Math.round(Number(value||0)/5)*5);
  const slug=value=>String(value||"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");

  function liftProfile(exercise){
    const name=String(exercise?.name||"").toLowerCase();
    const excluded=/dumbbell|kettlebell|machine|cable|band|bodyweight|push-up|pull-up|chin-up|landmine|smith|sled|medicine ball/.test(name);
    const barbell=!excluded&&/barbell|bench press|back squat|front squat|box squat|deadlift|romanian deadlift|\brdl\b|good morning|push press|overhead press|military press|pendlay row|bent-over row|hip thrust|power clean|hang clean|clean and jerk|snatch/.test(name);
    let family="other",maxKey="";
    if(/bench press|incline bench|close-grip bench|floor press/.test(name)){family="bench";maxKey="bench";}
    else if(/back squat|front squat|box squat/.test(name)){family="squat";maxKey="squat";}
    else if(/deadlift|romanian deadlift|\brdl\b/.test(name)){family="deadlift";maxKey="deadlift";}
    else if(/push press|overhead press|military press/.test(name)){family="press";maxKey="pushPress";}
    else if(/clean|snatch/.test(name)){family="olympic";maxKey="";}
    else if(/row/.test(name)){family="row";maxKey="";}
    return{barbell,family,maxKey,name};
  }

  function workWeight(exercise){
    const candidates=[exercise?.recommendedWeight,exercise?.sets?.[0]?.plannedWeight,exercise?.sets?.[0]?.weight,exercise?.recommendationDisplay];
    for(const candidate of candidates){
      const match=String(candidate??"").match(/\d+(?:\.\d+)?/);
      const value=match?Number(match[0]):Number(candidate);
      if(Number.isFinite(value)&&value>0)return round5(value);
    }
    return 0;
  }

  function estimatedMax(exercise){
    const profile=liftProfile(exercise),d=appData(),maxes=d?.settings?.maxes||d?.athleteProfile?.baselines?.maxes||{};
    const value=Number(maxes?.[profile.maxKey]);
    return Number.isFinite(value)&&value>0?value:0;
  }

  function repsForRamp(weight,work,{bar=false,family="other"}={}){
    if(bar)return family==="bench"?"10":family==="olympic"?"5":"8";
    const ratio=work>0?weight/work:0;
    if(ratio<=.60)return"5";
    if(ratio<=.76)return"3";
    if(ratio<=.85)return"2";
    return"1";
  }

  function addUnique(list,weight,label,role,work,profile){
    weight=round5(weight);
    if(weight<=45||weight>=work)return;
    const prior=list[list.length-1]?.weight||45;
    if(weight-prior<10)return;
    const lowDeadlift=profile.family==="deadlift"&&weight<135;
    list.push({
      label,weight,reps:repsForRamp(weight,work,{family:profile.family}),role,
      barbell:true,barWeight:45,
      cue:lowDeadlift?"Use an RDL or elevate the bar to normal pulling height until full-size plates are loaded.":role==="landmark"?"Use the simple plate landmark, move every repetition with intent, and stop well before fatigue.":role==="primer"?"Treat this as a neural and technical primer. One or two crisp repetitions—never a grind.":"Bridge the gap with controlled, fast repetitions.",
      why:"Prepare the exact lift with progressively heavier, low-volume exposure before the working sets."
    });
  }

  function barbellWarmups(exercise,work,profile){
    const max=estimatedMax(exercise);
    const firstLabel=profile.family==="deadlift"?"Empty Bar Hinge Rehearsal":"Empty Bar";
    const firstCue=profile.family==="deadlift"?"Use the empty bar for an RDL or elevated hinge rehearsal so the start position stays controlled.":"Rehearse the exact grip, stance, bar path, and range used for the working sets.";
    const sets=[{
      label:firstLabel,weight:45,reps:repsForRamp(45,work,{bar:true,family:profile.family}),role:"bar",barbell:true,barWeight:45,
      cue:firstCue,why:"Start with the unloaded implement to rehearse technique and assess how the movement feels today."
    }];
    if(work<=45)return sets;

    if(profile.family==="bench"){
      if(work>=170)addUnique(sets,135,"135 lb Plate Landmark","landmark",work,profile);
      else if(work>=125)addUnique(sets,95,"95 lb Bridge Set","bridge",work,profile);
      else if(work>=85)addUnique(sets,65,"65 lb Bridge Set","bridge",work,profile);
    }else if(profile.family==="squat"||profile.family==="deadlift"){
      if((max>=315||work>=245)&&work>=245){
        addUnique(sets,135,"135 lb Plate Landmark","landmark",work,profile);
        addUnique(sets,225,"225 lb Plate Landmark","landmark",work,profile);
      }else if(work>=170){
        addUnique(sets,95,"95 lb Bridge Set","bridge",work,profile);
        addUnique(sets,135,"135 lb Plate Landmark","landmark",work,profile);
      }else if(work>=120){
        addUnique(sets,65,"65 lb Bridge Set","bridge",work,profile);
        addUnique(sets,95,"95 lb Bridge Set","bridge",work,profile);
      }else addUnique(sets,65,"65 lb Bridge Set","bridge",work,profile);
    }else{
      if(work>=185){addUnique(sets,95,"95 lb Bridge Set","bridge",work,profile);addUnique(sets,135,"135 lb Plate Landmark","landmark",work,profile);}
      else if(work>=135){addUnique(sets,75,"75 lb Bridge Set","bridge",work,profile);addUnique(sets,95,"95 lb Bridge Set","bridge",work,profile);}
      else if(work>=90)addUnique(sets,65,"65 lb Bridge Set","bridge",work,profile);
    }

    const last=sets[sets.length-1]?.weight||45;
    const primer=round5(work*.88);
    if(primer-last>=55){
      const bridge=round5(work*.72);
      addUnique(sets,bridge,"Intermediate Bridge","bridge",work,profile);
    }
    addUnique(sets,primer,"Final Primer","primer",work,profile);

    return sets.slice(0,5);
  }

  function nonBarbellWarmups(exercise,work){
    if(work<=0)return[];
    const raw=[
      {label:"Light Practice",weight:round5(work*.40),reps:"8",role:"bridge"},
      {label:"Moderate Practice",weight:round5(work*.62),reps:"5",role:"bridge"},
      {label:"Final Primer",weight:round5(work*.82),reps:"2",role:"primer"}
    ];
    return raw.filter((item,index,array)=>item.weight>0&&(index===0||item.weight>array[index-1].weight)).map(item=>({...item,barbell:false,cue:"Keep the movement crisp and stop well before fatigue.",why:"Progressively rehearse the exercise before the working sets."}));
  }

  function evidenceWarmupSetsFor(exercise){
    if(!exercise||!["Primary Strength","Primary Hypertrophy"].includes(exercise.block))return[];
    const work=workWeight(exercise);if(!work)return[];
    const profile=liftProfile(exercise);
    return profile.barbell?barbellWarmups(exercise,work,profile):nonBarbellWarmups(exercise,work);
  }

  try{warmupSetsFor=evidenceWarmupSetsFor;}catch(_){}
  window.warmupSetsFor=evidenceWarmupSetsFor;

  const priorBlueprint=window.bellWarmupBlueprint;
  if(typeof priorBlueprint==="function"){
    const enhancedBlueprint=function(active){
      const items=priorBlueprint(active)||[];
      const exercises=Array.isArray(active?.exercises)?active.exercises:[];
      const first=exercises.find(ex=>["Primary Strength","Primary Hypertrophy"].includes(ex?.block))||exercises[0];
      const ramps=evidenceWarmupSetsFor(first);
      let rampIndex=0;
      const enhanced=[];
      items.forEach(item=>{
        if(item?.phase!=="ramp"){enhanced.push(item);return;}
        const ramp=ramps[rampIndex++];
        if(!ramp)return;
        enhanced.push({
          ...item,
          id:`evidence-ramp-${slug(first?.name)}-${ramp.weight}-${ramp.reps}`,
          title:`${first?.name||"Primary Lift"} · ${ramp.label}`,
          detail:`${ramp.weight} lb × ${ramp.reps}`,
          dose:`${ramp.weight} lb × ${ramp.reps}`,
          cue:ramp.cue,
          why:ramp.why,
          kind:"ramp",
          phase:"ramp",
          rampRole:ramp.role,
          barbell:Boolean(ramp.barbell),
          barWeight:ramp.barWeight||45,
          plateTarget:ramp.weight,
          evidenceProtocol:"Low-volume progressive specific warm-up"
        });
      });
      return enhanced;
    };
    try{bellWarmupBlueprint=enhancedBlueprint;}catch(_){}
    window.bellWarmupBlueprint=enhancedBlueprint;
  }

  const GUIDE_RULES=[
    {test:/knee-to-wall|ankle rock|ankle pulse/,setup:"Face a wall in a split stance with the working foot flat. Start close enough that the knee can reach forward without the heel lifting.",steps:["Keep the tripod of the foot—heel, base of the big toe, and base of the little toe—firmly planted.","Drive the knee forward over the middle toes until you reach a controlled end range.","Return slowly and repeat without bouncing."],breathe:"Exhale gently as the knee moves forward; keep the ribs relaxed.",feel:"A controlled stretch or pressure around the ankle and calf, not pinching in the front of the joint.",avoid:"Heel lift, arch collapse, knee diving inward, or forcing through sharp pain.",easier:"Move farther from the wall or use a smaller range.",harder:"Increase the wall distance gradually or add a light load over the knee."},
    {test:/90\/90|hip transition/,setup:"Sit with both knees bent about 90 degrees, one leg in front and one to the side. Use your hands behind you if needed.",steps:["Stay tall through the trunk.","Rotate both knees together to the opposite side without forcing the end position.","Pause briefly, then return under control."],breathe:"Exhale during the transition and inhale in the settled position.",feel:"Rotation through the hips, not twisting or pinching in the knees.",avoid:"Rushing, collapsing through the spine, or forcing the knees to the floor.",easier:"Keep both hands behind you and reduce the range.",harder:"Use fewer hand supports or rise into a tall 90/90 position."},
    {test:/adductor rock|rock-back/,setup:"Start on hands and knees. Extend one leg to the side with the foot supported and the knee straight or softly bent.",steps:["Keep a long, neutral spine.","Shift the hips backward until you feel a mild inner-thigh stretch.","Return to the start without rotating the pelvis."],breathe:"Exhale as the hips move back; inhale as you return.",feel:"A mild stretch through the inner thigh and groin.",avoid:"Rounding the low back, turning the foot excessively, or pushing into groin pain.",easier:"Bring the extended leg closer or reduce the rock-back distance.",harder:"Increase the side-leg distance while keeping the pelvis square."},
    {test:/open-book|thread-the-needle|thoracic rotation/,setup:"Set the hips and lower body so they stay stable while the upper back is free to rotate.",steps:["Initiate the movement through the ribcage and upper back.","Follow the moving hand with your eyes.","Pause at a comfortable end range, then return slowly."],breathe:"Exhale into the rotation and inhale as you reset.",feel:"Rotation through the mid and upper back without shoulder pinching.",avoid:"Forcing the arm to the floor, letting the knees separate, or twisting through a painful low-back range.",easier:"Use a smaller rotation or support the moving arm.",harder:"Add a longer pause at end range without forcing it."},
    {test:/scapular controlled|scap car|scapular circle/,setup:"Stand or sit tall with the arm relaxed and the ribs stacked over the pelvis.",steps:["Move the shoulder blade up, back, down, and forward in a slow circle.","Keep the elbow mostly straight and the neck relaxed.","Reverse direction after the prescribed repetitions."],breathe:"Breathe normally and avoid bracing the neck.",feel:"Smooth movement around the shoulder blade.",avoid:"Shrugging hard, bending the elbow to create motion, or moving through a painful pinch.",easier:"Make smaller circles.",harder:"Use a slower tempo and pause at each corner of the circle."},
    {test:/external rotation|band er|er-isometric/,setup:"Anchor a light band or use a wall. Keep the elbow close to the body, usually bent to about 90 degrees.",steps:["Set the shoulder gently down and back without over-squeezing.","Rotate the forearm outward or press into the isometric resistance.","Return slowly while the elbow stays quiet."],breathe:"Exhale during the effort and keep the ribs down.",feel:"Light work in the back of the shoulder, not the neck or front of the joint.",avoid:"Heavy resistance, elbow drifting away, trunk rotation, or painful range.",easier:"Use less tension or shorten the range.",harder:"Add a small amount of tension or a longer controlled hold."},
    {test:/wall slide|serratus slide/,setup:"Stand facing a wall with forearms or hands supported and ribs stacked over the pelvis.",steps:["Press gently into the wall.","Slide the arms upward while allowing the shoulder blades to rotate and reach.","Stop before the ribs flare or the shoulders pinch, then lower with control."],breathe:"Exhale as the arms move up and keep the abdomen relaxed but controlled.",feel:"Work around the side of the ribcage and shoulder blades.",avoid:"Shrugging, arching the low back, or forcing overhead range.",easier:"Use a shorter slide or stand farther from the wall.",harder:"Add a very light band around the wrists."},
    {test:/dead bug/,setup:"Lie on your back with hips and knees bent and arms pointed upward. Find a neutral, comfortable trunk position.",steps:["Exhale and slowly lower the opposite arm and leg.","Move only as far as the trunk stays quiet.","Return and alternate sides."],breathe:"Use a long exhale during each reach; inhale at the center.",feel:"Controlled abdominal tension without low-back strain.",avoid:"Holding the breath, arching aggressively, or moving too far too soon.",easier:"Move one limb at a time or keep the heel closer to the floor.",harder:"Lengthen the lever or add a light band pulldown."},
    {test:/bird dog/,setup:"Start on hands and knees with shoulders over hands and hips over knees.",steps:["Reach the opposite arm and leg long without twisting.","Pause while the pelvis stays level.","Return slowly and switch sides."],breathe:"Exhale during the reach and inhale as you return.",feel:"Trunk and hip control rather than low-back compression.",avoid:"Arching, rotating, lifting the leg too high, or rushing.",easier:"Slide the foot back or reach only one limb.",harder:"Add a longer pause or light resistance."},
    {test:/glute bridge|frog pump|bridge march/,setup:"Lie on your back with feet positioned so you can drive through the whole foot. Keep the ribs stacked.",steps:["Push through the feet and extend the hips.","Finish with the glutes without arching the low back.","Pause, lower under control, and repeat."],breathe:"Exhale as the hips rise; inhale as they lower.",feel:"Glutes and hamstrings, not cramping in the low back.",avoid:"Overarching, pushing only through the toes, or letting the knees collapse.",easier:"Use a smaller range or standard two-leg bridge.",harder:"Add a pause, band, march, or light load."},
    {test:/hip hinge|dowel|rdl|good morning/,setup:"Stand with feet about hip width. For a dowel drill, keep contact at the head, upper back, and tailbone.",steps:["Soften the knees and push the hips backward.","Keep the load or hands close to the legs.","Stand by driving the hips forward while the trunk stays controlled."],breathe:"Inhale before the hinge, maintain gentle trunk pressure, and exhale near standing.",feel:"Hamstrings and glutes with a stable trunk.",avoid:"Squatting the hinge, losing dowel contact, reaching the weight away, or rounding under load.",easier:"Reduce range or use a wall target behind the hips.",harder:"Add a light kettlebell or bar while preserving the same pattern."},
    {test:/split squat|lunge/,setup:"Take a stable split stance with enough width to balance. Use a rack or wall for support when needed.",steps:["Lower straight down while both feet stay planted.","Track the front knee over the middle toes.","Drive through the front foot to return."],breathe:"Inhale on the descent and exhale as you rise.",feel:"Front-leg quadriceps and glute with steady balance.",avoid:"Narrow stance, knee collapse, bouncing, or forcing painful depth.",easier:"Use support and a shorter range.",harder:"Add tempo, depth, or a light load."},
    {test:/goblet squat|squat-to-stand|cossack|lateral lunge|squat/,setup:"Set the feet and stance for the named variation. Keep the whole foot connected to the floor.",steps:["Brace gently and sit between or behind the hips as appropriate.","Keep knees tracking with the toes.","Move through the largest controlled, comfortable range and stand smoothly."],breathe:"Inhale before descending and exhale through the return.",feel:"Hips, thighs, and ankles working together without joint pinching.",avoid:"Arch collapse, knees diving inward, bouncing, or chasing depth at the expense of control.",easier:"Use support, reduce depth, or use a box.",harder:"Add a pause, slower tempo, or light load."},
    {test:/calf raise|tibialis|tib raise/,setup:"Stand tall with support nearby. Keep the feet parallel and pressure distributed through the foot.",steps:["Move through the ankle without rocking the whole body.","Pause at the top position.","Lower slowly through the available range."],breathe:"Breathe normally and keep the trunk relaxed.",feel:"Calf for heel raises or front of the lower leg for tibialis raises.",avoid:"Bouncing, rolling to the outside of the foot, or rushing the lowering phase.",easier:"Use both legs or a smaller range.",harder:"Use one leg, a longer pause, or light load."},
    {test:/hamstring floss/,setup:"Lie on your back and support the thigh behind the knee. Keep the hip in a comfortable position.",steps:["Slowly straighten the knee until mild tension appears.","Bend the knee again to release tension.","Repeat smoothly rather than holding a hard stretch."],breathe:"Exhale as the knee straightens.",feel:"Gentle sliding tension through the hamstring, not nerve-like pain.",avoid:"Forcing the knee straight, flexing the neck, or holding a painful stretch.",easier:"Lower the thigh or reduce knee extension.",harder:"Slightly increase hip flexion while symptoms remain calm."},
    {test:/carry/,setup:"Choose a manageable load and stand tall before walking.",steps:["Keep the ribs stacked and shoulders level.","Walk with short controlled steps.","Turn carefully and finish before posture breaks down."],breathe:"Take steady breaths behind light trunk tension.",feel:"Trunk, grip, and shoulder-girdle control.",avoid:"Leaning, shrugging, rushing, or choosing a load that distorts gait.",easier:"Reduce the load or duration.",harder:"Increase distance or load gradually."},
    {test:/cat-camel|pelvic rock/,setup:"Use a comfortable supported position with no load.",steps:["Move slowly between the two comfortable end positions.","Let the movement come from the trunk and pelvis.","Stay well inside a symptom-tolerable range."],breathe:"Exhale into one direction and inhale into the other.",feel:"Gentle spinal movement, not a hard stretch.",avoid:"Forcing end range, moving quickly, or reproducing sharp symptoms.",easier:"Use a smaller range.",harder:"Add a brief pause at each comfortable end position."},
    {test:/band pull-apart|pulldown hold|row isometric/,setup:"Hold or anchor a light band with the ribs stacked and shoulders relaxed.",steps:["Initiate with the shoulder blades and upper back.","Move or hold without shrugging.","Return slowly while keeping tension controlled."],breathe:"Exhale during the pull and inhale during the return.",feel:"Upper back and posterior shoulders.",avoid:"Using heavy tension, flaring the ribs, or jutting the head forward.",easier:"Use a lighter band or shorter range.",harder:"Add a pause or slightly more tension."},
    {test:/push-up|pushup/,setup:"Set hands under or slightly outside the shoulders. Use a wall, bench, floor, or knees to match your current level.",steps:["Keep the body organized from head to hips.","Lower with control while elbows track comfortably.","Press away and finish with controlled shoulder-blade motion."],breathe:"Inhale down and exhale as you press.",feel:"Chest, triceps, shoulders, and trunk working together.",avoid:"Sagging, shrugging, elbows flaring excessively, or painful depth.",easier:"Raise the hands to a higher surface.",harder:"Lower the surface or add a controlled plus/reach."},
    {test:/hip airplane|hip open-and-close|hip open close/,setup:"Stand on one leg with light support from a rack or wall. Hinge slightly at the hip while keeping the foot firmly planted.",steps:["Keep the stance knee softly bent.","Rotate the pelvis open and closed over the stable hip without losing foot pressure.","Use a small controlled range before trying to increase motion."],breathe:"Breathe normally and move slowly.",feel:"The side and back of the stance hip controlling rotation.",avoid:"Spinning on the foot, collapsing the knee, or rotating through the low back.",easier:"Use two hands for support and reduce the hinge depth.",harder:"Use less hand support or pause at each end position."},
    {test:/hip-flexor|half-kneeling.*rock/,setup:"Kneel in a split position with the rear knee padded and the front foot planted. Stack the ribs over the pelvis.",steps:["Gently squeeze the rear-leg glute.","Shift the pelvis forward only until a mild stretch appears at the front of the rear hip.","Return without arching the low back."],breathe:"Exhale during the forward shift and keep the ribs down.",feel:"A mild stretch at the front of the rear hip, not pressure in the low back.",avoid:"Overarching, leaning far forward, or forcing the pelvis down.",easier:"Use a smaller shift or raise the rear knee on extra padding.",harder:"Add an overhead reach while maintaining pelvic control."},
    {test:/progressive.*ramp|lift pattern ramp|primary movement ramp|first exercise ramp|competition-lift ramp|specific ramp/,setup:"Use the exact exercise setup planned for the first working movement and begin with a very light load.",steps:["Complete a small number of technically clean repetitions.","Increase load in logical steps while reducing repetitions.","Finish with a crisp primer near the working load without grinding."],breathe:"Use the same breathing and bracing pattern planned for the lift.",feel:"Increasing confidence, speed, and coordination without fatigue.",avoid:"Large unnecessary jumps, extra repetitions, or treating warm-ups as working sets.",easier:"Add a smaller intermediate jump or repeat the prior load.",harder:"Warm-ups should not be made harder; progress only toward the planned working weight."},
    {test:/wall clock|face pull|straight-arm.*pulldown|scapular pull|active hang|light.*row|supported row|pulldown/,setup:"Use a light band, cable, bar, or support that allows smooth shoulder-blade movement without strain.",steps:["Set the ribs and neck in a relaxed position.","Initiate the motion with the shoulder blades and upper back.","Pause briefly, then return under control."],breathe:"Exhale during the pull or hold and inhale during the return.",feel:"Upper back, lats, and posterior shoulder working without neck tension.",avoid:"Shrugging, swinging, flaring the ribs, or using excessive resistance.",easier:"Reduce resistance, range, or bodyweight support demand.",harder:"Add a controlled pause or slightly more resistance."},
    {test:/leg swing|tall march|a-march|a-skip|wall-drive march|ankling|skip for distance|strides|progressive easy build|engine build|sport-specific build|run.walk exposure|graded conditioning|conditioning/,setup:"Use a clear, level space and begin at an easy pace with upright posture.",steps:["Start with controlled rhythm and modest range.","Keep foot contacts quiet and organized under the body.","Increase speed or range gradually only when the pattern stays smooth."],breathe:"Breathe rhythmically and stay below a fatiguing effort.",feel:"Elastic, coordinated movement through the feet, ankles, hips, and trunk.",avoid:"Sprinting too early, overstriding, stiff landings, or continuing when symptoms rise.",easier:"Use marching, walking, or a shorter range.",harder:"Progress to a faster drill or short build-up while preserving mechanics."},
    {test:/lateral band walk|lateral walk|hip abduction|side-lying hip abduction|supported abduction/,setup:"Place the band where prescribed or lie/stand in a stable position. Keep the pelvis stacked and the working foot facing forward.",steps:["Create light band tension before moving.","Move from the hip while keeping the trunk quiet.","Return slowly without letting the band pull the leg back."],breathe:"Exhale during the outward effort and inhale during the return.",feel:"The side and back of the hip.",avoid:"Turning the toes out, leaning the trunk, or using momentum.",easier:"Use less band tension, smaller steps, or external support.",harder:"Increase band tension or add a controlled pause."},
    {test:/balance reach|single-leg balance|supported balance|star-excursion|three-direction balance|reach-balance/,setup:"Stand near a rack or wall for safety. Establish a tripod foot and soft knee on the stance leg.",steps:["Hold the pelvis level over the stance foot.","Reach the free foot or hand in the prescribed direction.","Return to center without touching down when possible."],breathe:"Breathe normally and avoid rigid breath holding.",feel:"Foot, ankle, hip, and trunk working together to maintain control.",avoid:"Knee collapse, arch collapse, rushing, or using a range that causes pain.",easier:"Use fingertip support or shorten the reach.",harder:"Reduce support, extend the reach, or add a light load."},
    {test:/step-down|step-off|lateral step and stick|landing control|pogo/,setup:"Use a low, stable step or clear floor space. Begin with support nearby if balance is limited.",steps:["Control the lowering or landing quietly.","Keep the knee tracking over the middle toes and the pelvis level.","Hold the finish position before resetting."],breathe:"Exhale through the lowering or landing and reset between repetitions.",feel:"Quadriceps, calf, and hip controlling deceleration.",avoid:"Dropping quickly, knee collapse, loud landings, or progressing impact without clearance.",easier:"Use a lower step, smaller range, or no impact.",harder:"Increase step height or impact only after stable, symptom-free control."},
    {test:/world.s greatest|ankle-to-hip flow|thoracic reach|bear-plank rock|bodyweight pattern rehearsal/,setup:"Move through the sequence in a clear space using a range that stays controlled and comfortable.",steps:["Enter each position slowly.","Pause long enough to own the position rather than bouncing through it.","Transition smoothly to the next portion of the flow."],breathe:"Use slow breaths and exhale into the more restricted positions.",feel:"A whole-body opening effect without fatigue or joint pinching.",avoid:"Rushing the flow, forcing end ranges, or losing alignment between positions.",easier:"Shorten the sequence or use support.",harder:"Add a longer controlled pause, not more speed."},
    {test:/front-rack elbow lift/,setup:"Place the bar in a light front-rack position or use a rack-supported setup with the hands relaxed.",steps:["Keep the chest and ribs stacked.","Lift one or both elbows while maintaining bar contact and a relaxed grip.","Lower slowly without forcing the wrists."],breathe:"Exhale as the elbows lift.",feel:"Upper-back extension, lat length, and front-rack positioning.",avoid:"Forcing wrist extension, shrugging, or arching the low back.",easier:"Use straps or a dowel and reduce the elbow height.",harder:"Hold the top position slightly longer while maintaining relaxed wrists."},
    {test:/ankle pumps|ankle circles|toe yoga|band ankle eversion|foot roll-through/,setup:"Sit or stand with the foot supported and the lower leg relaxed.",steps:["Move the ankle or toes through the named direction slowly.","Keep the knee and hip quiet.","Use the largest comfortable range without forcing."],breathe:"Breathe normally.",feel:"Light muscular work and smooth motion through the foot and ankle.",avoid:"Fast uncontrolled circles, toe gripping, or moving into sharp pain.",easier:"Use a smaller range or no resistance.",harder:"Add light band resistance or a brief pause."},
    {test:/knee-extension isometric|quadriceps set|quad set|resisted knee extension|heel slide|sit-to-stand|sit to stand/,setup:"Choose a chair, floor position, or resistance that allows the knee to move or load comfortably.",steps:["Set the foot and knee alignment before beginning.","Complete the prescribed extension, bend, hold, or stand with controlled tempo.","Return slowly and monitor the symptom response."],breathe:"Exhale during the effort and avoid breath holding.",feel:"Quadriceps and surrounding leg muscles working within a tolerable range.",avoid:"Snapping the knee straight, collapsing inward, or forcing painful depth.",easier:"Reduce resistance, range, or chair height demand.",harder:"Increase resistance or range gradually when symptoms remain stable."},
    {test:/pendulum|table slide|serratus punch|scaption|gentle scapular set/,setup:"Support the arm and body so the shoulder can move without unnecessary guarding or load.",steps:["Begin with a small comfortable range.","Move smoothly in the named direction while the neck stays relaxed.","Return slowly and stop before symptoms meaningfully increase."],breathe:"Use relaxed breathing and avoid bracing the neck.",feel:"Gentle shoulder or shoulder-blade motion with tolerable muscular effort.",avoid:"Forcing elevation, shrugging, or pushing through sharp pain.",easier:"Reduce range, resistance, or use more arm support.",harder:"Increase active range or light resistance only when cleared and well tolerated."},
    {test:/comfortable walk|easy walk|easy bike|walk, bike, or swim|aerobic|comfortable range-of-motion/,setup:"Choose a comfortable mode and environment that matches the current restriction and available equipment.",steps:["Begin below the expected tolerance level.","Maintain smooth, relaxed movement.","Stop or reduce the dose if symptoms build rather than settle."],breathe:"Use easy rhythmic breathing at a conversational effort.",feel:"General movement and circulation without symptom escalation.",avoid:"Turning recovery work into a hard conditioning session or ignoring delayed symptom increase.",easier:"Reduce duration, pace, range, or impact.",harder:"Increase only one variable—time, pace, or range—at a time."},
    {test:/side plank/,setup:"Lie on your side with the elbow under the shoulder. Use bent knees or straight legs based on current capacity.",steps:["Lift the hips while keeping the body aligned.","Maintain steady shoulder and trunk position.","Stop the hold before posture breaks down."],breathe:"Take slow breaths throughout the hold.",feel:"Side trunk and shoulder support muscles.",avoid:"Hips rolling, shoulder shrugging, or holding the breath.",easier:"Use bent knees or a shorter hold.",harder:"Use straight legs or a longer hold while maintaining form."},
    {test:/relaxed breathing|360.*breathing/,setup:"Lie, sit, or kneel in a supported position with the shoulders and jaw relaxed.",steps:["Inhale through the nose and allow the abdomen, sides, and back of the ribcage to expand.","Exhale slowly without aggressively pulling the stomach inward.","Keep the pace calm and repeat."],breathe:"Use a quiet inhale and a slightly longer relaxed exhale.",feel:"Expansion around the ribcage and reduced unnecessary tension.",avoid:"Shrugging, forceful breath holds, or chasing a maximal breath.",easier:"Use a more supported position.",harder:"Maintain the same breathing during a simple movement pattern."},
    {test:/pain-free isometric|gentle.*isometric|symptom recheck|previously limited movement exposure/,setup:"Use the saved restriction, clinician guidance, and a position that is currently tolerable.",steps:["Begin with a low effort or small range.","Hold or move smoothly while monitoring symptoms.","Recheck the response immediately and again after the session."],breathe:"Exhale gently during effort and avoid straining.",feel:"Tolerable muscular effort without a meaningful increase in symptoms.",avoid:"Maximal effort, forcing range, or continuing when symptoms escalate.",easier:"Reduce effort, duration, or range.",harder:"Progress only one variable at a time and only when the response remains stable."},
    {test:/engine transition/,setup:"Set up the next conditioning modality before leaving the strength area. Begin below session pace.",steps:["Start with easy rhythm and technique.","Build cadence or speed in two or three small steps.","Finish ready for the prescribed engine work, not fatigued."],breathe:"Use controlled rhythmic breathing and stay conversational until the final short build.",feel:"A smooth transition from lifting mechanics to the conditioning pattern.",avoid:"Starting at target pace immediately, sprinting, or carrying strength-session tension into the engine work.",easier:"Use a longer easy transition and fewer pickups.",harder:"Use a slightly sharper final pickup without exceeding session pace."},
    {test:/band[- ]complex|band pull \+ press|push-pull superset|muscle-lift complex/,setup:"Use an empty bar or very light band and enough space to move through the full sequence safely.",steps:["Learn the order before adding speed.","Complete each movement with clean positions and continuous control.","Keep the entire complex easy enough that breathing and technique stay steady."],breathe:"Exhale through each effort and take a reset breath between movements as needed.",feel:"Whole-body coordination and activation without local fatigue.",avoid:"Using too much resistance, rushing transitions, or turning the complex into conditioning.",easier:"Use fewer movements, less resistance, or a slower pace.",harder:"Improve transition quality before adding any load."},
    {test:/thoracic extension/,setup:"Place the upper back against a bench edge, foam roller, or supported surface. Keep the ribs and pelvis controlled.",steps:["Support the head if needed.","Extend gently through the upper back over the support.","Return to neutral without forcing the low back to create the motion."],breathe:"Exhale into the supported extension and inhale back to neutral.",feel:"Opening through the upper back and ribcage.",avoid:"Flaring the ribs, hinging through the low back, or forcing the neck.",easier:"Use a higher support or smaller range.",harder:"Add an overhead reach while maintaining rib control."},
    {test:/calf isometric/,setup:"Sit or stand in the prescribed position with the ball of the foot supported and the ankle at a tolerable angle.",steps:["Press through the forefoot and create steady calf tension.","Hold without bouncing or changing the ankle position.","Release gradually between efforts."],breathe:"Breathe continuously during the hold.",feel:"Steady calf effort without sharp Achilles or ankle pain.",avoid:"Maximal effort, toe gripping, or losing foot alignment.",easier:"Reduce effort or hold time.",harder:"Increase effort or duration gradually when symptoms remain stable."},
    {test:/weight shift/,setup:"Stand with support nearby and feet placed securely. Begin with more weight on the comfortable side if needed.",steps:["Shift bodyweight slowly toward the involved side.","Keep the foot, knee, and hip aligned.","Pause briefly, then return without pushing through worsening symptoms."],breathe:"Exhale during the shift and keep the upper body relaxed.",feel:"Controlled acceptance of weight through the foot and leg.",avoid:"Dropping suddenly, knee collapse, gripping with the toes, or shifting beyond tolerance.",easier:"Use more hand support or a smaller shift.",harder:"Use less hand support or progress toward single-leg stance."},
    {test:/landmine press/,setup:"Secure the bar in a landmine. Use a split or half-kneeling stance with the bar held at the shoulder.",steps:["Set the ribs over the pelvis.","Press the bar up and forward along its natural arc.","Reach slightly at the top, then lower under control."],breathe:"Exhale during the press and inhale during the return.",feel:"Shoulder, triceps, serratus, and trunk working together without shoulder pinching.",avoid:"Overarching, shrugging, or forcing a painful overhead path.",easier:"Use a lighter bar or taller standing position.",harder:"Add load gradually or use a more demanding stance."},
    {test:/medicine-ball.*pass|power toss/,setup:"Use a light medicine ball and a clear wall or partner space. Set a stable athletic stance.",steps:["Load the movement quickly but under control.","Throw or pass with full intent while maintaining alignment.","Reset completely between repetitions so every effort stays sharp."],breathe:"Exhale forcefully with each throw.",feel:"Fast coordinated power through the chest, shoulders, trunk, and legs as appropriate.",avoid:"Using a ball that is too heavy, sloppy catches, or continuing after speed drops.",easier:"Use a lighter ball or shorter throw distance.",harder:"Increase intent or distance before increasing ball weight."},
    {test:/supine march/,setup:"Lie on your back with knees bent and feet planted. Find a comfortable neutral trunk position.",steps:["Gently brace and lift one foot a small distance.","Keep the pelvis quiet as the foot returns.","Alternate sides without rushing."],breathe:"Exhale as each foot lifts and inhale as it returns.",feel:"Low-level abdominal and hip control without back strain.",avoid:"Pelvic rocking, breath holding, or lifting the knee too high.",easier:"Slide the heel instead of lifting the foot.",harder:"Use a tabletop start or longer lever while maintaining control."}
  ];

  function guideForItem(item){
    const name=String(item?.title||item?.name||"");
    if(item?.kind==="general-warmup")return{
      setup:"Choose the listed bike, rower, treadmill, walk, or equivalent easy modality.",
      steps:["Start very easy for the first minute.","Build only enough to feel warm and increase breathing slightly.","Finish at a conversational effort without leg or upper-body fatigue."],
      breathe:"Breathe rhythmically; you should still be able to speak in full sentences.",feel:"Warmer, looser, and ready to move—not tired.",avoid:"Turning the warm-up into conditioning, sprinting, or ignoring increasing symptoms.",easier:"Use a lower-impact modality or slower pace.",harder:"A slightly faster easy pace, while remaining conversational."
    };
    if(item?.kind==="ramp")return{
      setup:`Load ${item?.dose||item?.detail||"the prescribed weight"}. Match the exact grip, stance, equipment setup, and range planned for the working sets.`,
      steps:["Treat every repetition as technical practice.","Move the concentric phase with intent while keeping control.","Stop at the prescribed reps even when the set feels easy, then rest about 60–120 seconds before the next ramp."],
      breathe:"Use the same bracing and breathing pattern planned for the lift; do not turn the set into conditioning.",
      feel:"Increasing readiness and confidence with no meaningful fatigue.",
      avoid:"Adding extra repetitions, grinding, rushing plate changes, or skipping a step after a long layoff or poor readiness.",
      easier:"Repeat the prior load or reduce the jump when technique feels off.",
      harder:"Do not make warm-ups harder for their own sake. Progress only toward the prescribed working load."
    };
    const haystack=`${name} ${item?.id||""}`.toLowerCase();
    const rule=GUIDE_RULES.find(entry=>entry.test.test(haystack));
    const base=rule||{
      setup:"Use the support, body position, and equipment shown in the movement name. Begin in a range you can control.",
      steps:[item?.cue||"Move slowly through the prescribed range.","Pause briefly where control is most difficult.","Return to the starting position without bouncing or compensating."],
      breathe:"Breathe continuously; exhale through the effort and avoid unnecessary breath holding.",
      feel:item?.why||"Controlled work in the intended area without sharp pain or joint pinching.",
      avoid:"Forcing range, rushing repetitions, losing alignment, or continuing through worsening symptoms.",
      easier:"Reduce range, resistance, or complexity and use external support.",
      harder:"Add range, control, or light resistance only after the base version is comfortable."
    };
    return{...base,feel:base.feel||item?.why||"Controlled movement without sharp pain."};
  }

  function ensureModals(){
    if(!document.getElementById("bp13223MovementGuideModal")){
      const modal=document.createElement("div");modal.id="bp13223MovementGuideModal";modal.className="bp13223-modal hidden";modal.setAttribute("role","dialog");modal.setAttribute("aria-modal","true");
      modal.innerHTML=`<div class="bp13223-modal-card bp13223-guide-card"><header><div><span class="metric-label">MOVEMENT GUIDE</span><h2 id="bp13223GuideTitle">Movement</h2><p id="bp13223GuideDose"></p></div><button type="button" aria-label="Close movement guide" onclick="BellWarmupPlateGuides.closeGuide()">×</button></header><div id="bp13223GuideBody"></div><footer><button type="button" class="good" onclick="BellWarmupPlateGuides.closeGuide()">Back to Preparation</button></footer></div>`;
      document.body.appendChild(modal);
    }
    if(!document.getElementById("bp13223PlateModal")){
      const modal=document.createElement("div");modal.id="bp13223PlateModal";modal.className="bp13223-modal hidden";modal.setAttribute("role","dialog");modal.setAttribute("aria-modal","true");
      modal.innerHTML=`<div class="bp13223-modal-card bp13223-plate-card"><header><div><span class="metric-label">PLATE MATH</span><h2 id="bp13223PlateTitle">Load the Bar</h2><p>Enter the total bar weight. Bell shows the plates required on each side.</p></div><button type="button" aria-label="Close plate math" onclick="BellWarmupPlateGuides.closePlateMath()">×</button></header><div class="bp13223-plate-controls"><label><span>Total Weight</span><input id="bp13223PlateTarget" type="number" min="0" step="2.5" inputmode="decimal" oninput="BellWarmupPlateGuides.renderPlateMath()"></label><label><span>Units</span><select id="bp13223PlateUnit" onchange="BellWarmupPlateGuides.changePlateUnit()"><option value="lb">Pounds</option><option value="kg">Kilograms</option></select></label><label><span>Bar</span><select id="bp13223BarWeight" onchange="BellWarmupPlateGuides.renderPlateMath()"></select></label></div><div id="bp13223PlateResult"></div><footer><button type="button" class="good" onclick="BellWarmupPlateGuides.closePlateMath()">Done</button></footer></div>`;
      document.body.appendChild(modal);
    }
  }

  let renderedItems=new Map();
  function currentWarmupItems(){
    const active=appData()?.activeWorkout;
    try{return typeof bellEnsureWarmupState==="function"?bellEnsureWarmupState(active):active?.warmupItems||[];}catch(_){return active?.warmupItems||[];}
  }

  function openGuide(id){
    ensureModals();
    const item=renderedItems.get(id)||currentWarmupItems().find(entry=>entry.id===id);if(!item)return;
    const guide=guideForItem(item),body=document.getElementById("bp13223GuideBody");
    document.getElementById("bp13223GuideTitle").textContent=item.title||item.name||"Movement";
    document.getElementById("bp13223GuideDose").textContent=item.dose||item.detail||"";
    body.innerHTML=`<section class="bp13223-guide-purpose"><span>WHY IT IS HERE</span><p>${esc(item.why||"Prepare the positions and tissues used in today’s training.")}</p></section><div class="bp13223-guide-grid"><section><span>SETUP</span><p>${esc(guide.setup)}</p></section><section><span>HOW TO PERFORM</span><ol>${guide.steps.map(step=>`<li>${esc(step)}</li>`).join("")}</ol></section><section><span>BREATHING</span><p>${esc(guide.breathe)}</p></section><section><span>WHAT YOU SHOULD FEEL</span><p>${esc(guide.feel)}</p></section><section><span>COMMON MISTAKES</span><p>${esc(guide.avoid)}</p></section><section><span>EASIER OPTION</span><p>${esc(guide.easier)}</p></section><section><span>PROGRESSION</span><p>${esc(guide.harder)}</p></section></div>${appData()?.injuryProfile?.active||appData()?.settings?.injuryProfile?.active?`<p class="bp13223-guide-warning">Follow saved clinician restrictions. Stop if symptoms meaningfully increase during or after the movement.</p>`:""}`;
    document.getElementById("bp13223MovementGuideModal").classList.remove("hidden");
  }
  function closeGuide(){document.getElementById("bp13223MovementGuideModal")?.classList.add("hidden");}

  function plateOptions(unit){return unit==="kg"?[25,20,15,10,5,2.5,1.25,.5]:[45,35,25,10,5,2.5];}
  function barOptions(unit){return unit==="kg"?[20,15,10]:[45,35,15];}
  function platePlan(target,bar,unit){
    target=Number(target);bar=Number(bar);const plates=plateOptions(unit),increment=unit==="kg"?.5:2.5;
    if(!Number.isFinite(target)||target<=0)return{valid:false,message:"Enter a target weight."};
    if(target<bar)return{valid:false,message:`Target is lighter than the selected ${bar} ${unit} bar.`};
    const perSide=(target-bar)/2;let remaining=Math.max(0,Math.round(perSide/increment)*increment),loaded=[];
    for(const plate of plates){let count=0;while(remaining+1e-6>=plate){remaining=Math.round((remaining-plate)*100)/100;count++;if(count>20)break;}if(count)loaded.push({plate,count});}
    const loadedPerSide=loaded.reduce((sum,item)=>sum+item.plate*item.count,0),actual=Math.round((bar+2*loadedPerSide)*100)/100,exact=Math.abs(actual-target)<.01;
    return{valid:true,target,bar,unit,perSide,loaded,actual,exact};
  }

  function refreshBarOptions(preferred){
    const unit=document.getElementById("bp13223PlateUnit")?.value||"lb",select=document.getElementById("bp13223BarWeight");if(!select)return;
    const options=barOptions(unit),value=Number(preferred)||options[0];
    select.innerHTML=options.map(weight=>`<option value="${weight}" ${weight===value?"selected":""}>${weight} ${unit} bar</option>`).join("");
  }
  function openPlateMath(target,name,barWeight=45){
    ensureModals();
    document.getElementById("bp13223PlateUnit").value="lb";refreshBarOptions(barWeight);
    document.getElementById("bp13223PlateTarget").value=Number(target)||"";
    document.getElementById("bp13223PlateTitle").textContent=name?`${name} · Plate Math`:"Load the Bar";
    renderPlateMath();document.getElementById("bp13223PlateModal").classList.remove("hidden");
  }
  function closePlateMath(){document.getElementById("bp13223PlateModal")?.classList.add("hidden");}
  function changePlateUnit(){const unit=document.getElementById("bp13223PlateUnit")?.value||"lb";refreshBarOptions();const input=document.getElementById("bp13223PlateTarget");if(input&&Number(input.value)>0)input.step=unit==="kg"?.5:2.5;renderPlateMath();}
  function renderPlateMath(){
    const unit=document.getElementById("bp13223PlateUnit")?.value||"lb",target=Number(document.getElementById("bp13223PlateTarget")?.value),bar=Number(document.getElementById("bp13223BarWeight")?.value),result=document.getElementById("bp13223PlateResult");if(!result)return;
    const plan=platePlan(target,bar,unit);if(!plan.valid){result.innerHTML=`<p class="bp13223-plate-empty">${esc(plan.message)}</p>`;return;}
    const plates=plan.loaded.length?plan.loaded.map(item=>`<span class="bp13223-plate-chip"><b>${item.plate}</b><small>${unit}${item.count>1?` × ${item.count}`:""}</small></span>`).join(""):`<span class="bp13223-empty-bar">EMPTY BAR</span>`;
    result.innerHTML=`<section class="bp13223-plate-total"><span>TOTAL LOAD</span><strong>${plan.actual} ${unit}</strong>${plan.exact?"":`<small>Nearest loadable weight to ${plan.target} ${unit}</small>`}</section><section class="bp13223-per-side"><div><span>LEFT SIDE</span><div>${plates}</div></div><div class="bp13223-bar-graphic"><span>${bar}</span><small>${unit} BAR</small></div><div><span>RIGHT SIDE</span><div>${plates}</div></div></section><p class="bp13223-plate-note">Load the same plates on both sides. Collars are not included in the total.</p>`;
  }

  function decorateWarmup(){
    const cards=[...document.querySelectorAll("#warmupPanel .bp13222-prep-move")];if(!cards.length)return;
    const items=currentWarmupItems(),ordered=[];
    const phases=["general","move","activate","rehab","ramp"];
    phases.forEach(phase=>ordered.push(...items.filter(item=>item.phase===phase)));
    renderedItems=new Map(ordered.map(item=>[item.id,item]));
    cards.forEach((card,index)=>{
      const item=ordered[index];if(!item||card.dataset.bp13223Decorated==="true")return;
      card.dataset.bp13223Decorated="true";card.dataset.warmupId=item.id;
      const copy=card.querySelector(".bp13221-prep-copy");if(!copy)return;
      const complete=copy.querySelector(".bp13221-prep-complete");
      const actions=document.createElement("div");actions.className="bp13223-prep-tools";
      const guide=document.createElement("button");guide.type="button";guide.className="bp13223-prep-tool";guide.innerHTML="<span>?</span> HOW TO";guide.onclick=()=>openGuide(item.id);actions.appendChild(guide);
      if(item.barbell&&Number(item.plateTarget)>0){const plate=document.createElement("button");plate.type="button";plate.className="bp13223-prep-tool bp13223-plate-tool";plate.innerHTML="<span>◉</span> PLATE MATH";plate.onclick=()=>openPlateMath(item.plateTarget,item.title,item.barWeight||45);actions.appendChild(plate);}
      if(complete)complete.insertAdjacentElement("beforebegin",actions);else copy.appendChild(actions);
    });
    const rampHeader=document.querySelector("#warmupPanel .bp13222-phase-ramp > header p");
    if(rampHeader&&rampHeader.textContent!=="Low-volume, progressively heavier practice. Repetitions decrease as load rises; no warm-up set should become fatiguing.")rampHeader.textContent="Low-volume, progressively heavier practice. Repetitions decrease as load rises; no warm-up set should become fatiguing.";
  }

  function currentGroup(){
    const active=appData()?.activeWorkout;if(!active)return null;
    const api=window.BellWorkoutGrouping13219||window.BellWorkoutGrouping13218||window.BellWorkoutGrouping13217;
    const index=Number(active.gwExerciseIndex)||0;
    try{return api?.groupFor?.(active,index)||{exercises:[active.exercises?.[index]],indices:[index]};}catch(_){return{exercises:[active.exercises?.[index]],indices:[index]};}
  }
  function firstOpenWeight(ex){const set=(ex?.sets||[]).find(entry=>!entry.done&&!entry.skipped)||(ex?.sets||[])[0];return workWeight({...ex,recommendedWeight:set?.weight||set?.plannedWeight||ex?.recommendedWeight});}
  function decorateWorkingSets(){
    const group=currentGroup();if(!group)return;
    const cards=[...document.querySelectorAll("#activeExercises .gw-group-exercise, #activeExercises .gw-paired-summary")];
    cards.forEach((card,index)=>{
      const ex=group.exercises?.[index];if(!ex||!liftProfile(ex).barbell)return;
      const actions=card.querySelector(".gw-exercise-actions")||card.querySelector(".gw-summary-actions")||card.querySelector(".gw-group-heading");if(!actions||actions.querySelector(".bp13223-workout-plate"))return;
      const button=document.createElement("button");button.type="button";button.className="gw-tool-button gw-guide-small bp13223-workout-plate";button.title="Plate math";button.setAttribute("aria-label",`Open plate math for ${ex.name||"exercise"}`);button.innerHTML="<span class=\"bp13223-plate-icon\">◉</span><span>Plates</span>";button.onclick=()=>openPlateMath(firstOpenWeight(ex),ex.name,45);actions.appendChild(button);
    });
  }

  function wrapRender(name,decorator){
    const original=window[name];if(typeof original!=="function"||original.__bp13223Wrapped)return;
    const wrapped=function(){const result=original.apply(this,arguments);setTimeout(decorator,0);return result;};wrapped.__bp13223Wrapped=true;window[name]=wrapped;
  }
  wrapRender("renderWarmupPanel",decorateWarmup);
  wrapRender("renderActiveWorkout",decorateWorkingSets);

  function updateBuildLabel(){
    window.BELL_APP_VERSION="13.22.3-evidence-warmup-plate-math-movement-guides";
    const card=document.querySelector(".bp-build-card"),build=card?.querySelector("strong"),hint=card?.querySelector(".hint");
    if(build&&build.textContent!=="13.22.3 · Evidence Warm-Ups, Plate Math & Movement Guides")build.textContent="13.22.3 · Evidence Warm-Ups, Plate Math & Movement Guides";
    const hintText="Strength sessions use low-volume barbell ramps, practical plate loading, and expanded movement-preparation guides.";
    if(hint&&hint.textContent!==hintText)hint.textContent=hintText;
  }

  const observer=typeof MutationObserver!=="undefined"?new MutationObserver(()=>{decorateWarmup();decorateWorkingSets();updateBuildLabel();}):null;
  function init(){ensureModals();decorateWarmup();decorateWorkingSets();updateBuildLabel();observer?.observe(document.body,{childList:true,subtree:true});}

  window.BellWarmupPlateGuides={version:VERSION,liftProfile,evidenceWarmupSetsFor,platePlan,guideForItem,openGuide,closeGuide,openPlateMath,closePlateMath,renderPlateMath,changePlateUnit,decorateWarmup,decorateWorkingSets};
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();
