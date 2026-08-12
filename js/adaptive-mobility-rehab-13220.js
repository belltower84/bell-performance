"use strict";

/* Bell Performance 13.22.0 — Adaptive Movement Preparation & Rehab Support
   Healthy athletes receive discipline- and workout-specific movement preparation.
   Active injury profiles replace movement preparation with conservative Rehab Support.
   Bell does not diagnose injury and pauses prescriptions when red-flag symptoms are saved. */
(function(){
  const VERSION="13.22.0";
  const SOURCE_LABELS={
    healthy:"Evidence-informed movement preparation",
    ankle:"JOSPT lateral ankle sprain CPG · doi:10.2519/jospt.2021.0302",
    knee:"JOSPT patellofemoral pain CPG · doi:10.2519/jospt.2019.0302",
    shoulder:"JOSPT rotator cuff tendinopathy CPG · doi:10.2519/jospt.2025.13182",
    back:"JOSPT low-back pain CPG · doi:10.2519/jospt.2021.0304"
  };
  const CONDITION_LABELS={
    lateral_ankle_sprain:"Lateral ankle sprain / chronic ankle instability",
    patellofemoral_pain:"Patellofemoral pain",
    rotator_cuff_tendinopathy:"Rotator cuff tendinopathy",
    nonspecific_low_back_pain:"Nonspecific low-back pain",
    undiagnosed_ankle:"Ankle / foot symptoms",
    undiagnosed_knee:"Knee symptoms",
    undiagnosed_shoulder:"Shoulder symptoms",
    undiagnosed_back:"Back symptoms",
    undiagnosed_hip:"Hip symptoms",
    undiagnosed_other:"Current movement limitation"
  };
  const PHASE_LABELS={early:"Early / symptom calming",build:"Build capacity",return:"Return to training"};
  const RED_FLAG_LABELS={
    majorTrauma:"Major trauma or a suspected fracture",
    deformity:"Visible deformity or a joint that looks out of place",
    cannotBearWeight:"Unable to bear weight or use the limb",
    rapidSwelling:"Rapidly increasing swelling or bruising",
    numbnessWeakness:"New numbness, progressive weakness, or loss of control",
    bowelBladder:"New bowel/bladder change or saddle numbness with back symptoms",
    systemic:"Fever, unexplained illness, chest pain, or shortness of breath"
  };

  const M=(id,name,dose,cue,why)=>({id,name,dose,cue,why});
  const HEALTHY_TEMPLATES={
    lower_squat:[
      {title:"Lower Strength Preparation",focus:"Squat pattern",why:"Today emphasizes knee-dominant lower-body strength. Bell selected ankle, hip, adductor, and squat-pattern preparation before loaded ramp sets.",moves:[
        M("ankle-rock","Knee-to-Wall Ankle Rock","8 controlled reps per side","Keep the heel down and drive the knee over the middle toes.","Prepare ankle dorsiflexion for squatting."),
        M("adductor-rock","Adductor Rock-Back","8 reps per side","Keep a long spine and shift only as far as you can control.","Prepare the adductors for stance and depth."),
        M("hip-90-90","90/90 Hip Transitions","6 controlled transitions","Move without forcing the end range.","Prepare hip rotation used during stance control."),
        M("split-squat-tempo","Tempo Split Squat","5 reps per side · 3-second lower","Use bodyweight and stay balanced.","Prime single-leg control before heavier bilateral work."),
        M("squat-ramp","Progressive Squat Ramp Sets","3–5 increasingly loaded sets","Increase load gradually while keeping every rep crisp.","Specific preparation for the primary lift."),
        M("calf-raise","Slow Calf Raise","10 reps · 2-second pause","Keep pressure through the big toe and control the lowering.","Add ankle stiffness and lower-leg capacity.")
      ]},
      {title:"Lower Strength Preparation",focus:"Squat pattern",why:"The session requires squat depth, frontal-plane control, and force production. This variation rotates secondary drills while preserving task-specific ramp sets.",moves:[
        M("supported-airplane","Supported Hip Airplane","4 reps per side","Use a rack or wall and rotate slowly.","Prepare hip rotation and single-leg control."),
        M("ankle-pulse","Half-Kneeling Ankle Pulse","10 reps per side","Keep the arch active and heel planted.","Prepare the ankle for knee travel."),
        M("lateral-shift","Lateral Lunge Weight Shift","6 reps per side","Shift the hips back while the opposite leg stays long.","Prepare adductors and lateral hip control."),
        M("goblet-pause","Light Goblet Squat Pause","6 reps · 2-second pause","Use a light load and own the bottom position.","Rehearse squat position under light load."),
        M("squat-ramp","Progressive Squat Ramp Sets","3–5 increasingly loaded sets","Stop each ramp set well before fatigue.","Specific preparation for the primary lift."),
        M("dead-bug","Dead Bug","5 reps per side","Exhale without flattening aggressively or straining.","Prepare trunk control without creating fatigue.")
      ]},
      {title:"Lower Strength Preparation",focus:"Squat pattern",why:"Bell is preparing ankle motion, hip extension, and controlled squat exposure without using the exact same sequence as the prior lower session.",moves:[
        M("bridge-march","Glute Bridge March","6 reps per side","Keep the pelvis level and move slowly.","Prepare hip extension and pelvic control."),
        M("hip-flexor-rock","Half-Kneeling Hip-Flexor Rock","6 reps per side","Squeeze the rear glute and avoid arching the back.","Prepare hip extension for an upright squat."),
        M("cossack-shift","Cossack Squat Shift","5 reps per side","Use a comfortable depth and keep the planted foot stable.","Prepare adductors and frontal-plane control."),
        M("squat-to-stand","Squat-to-Stand","6 controlled reps","Move smoothly between hinge and squat positions.","Rehearse lower-body range through multiple patterns."),
        M("squat-ramp","Progressive Squat Ramp Sets","3–5 increasingly loaded sets","Match the stance and bar position used today.","Specific preparation for the primary lift."),
        M("tib-raise","Tibialis Raise","12–15 reps","Lift the toes without rocking the hips backward.","Prime the anterior lower leg for ankle control.")
      ]}
    ],
    lower_hinge:[
      {title:"Posterior-Chain Preparation",focus:"Hinge pattern",why:"Today emphasizes hinging and posterior-chain strength. Bell selected trunk movement, hamstring tolerance, glute activation, and specific hinge rehearsal.",moves:[
        M("cat-camel","Cat-Camel","6 slow cycles","Move through a comfortable range without forcing either end.","Introduce relaxed spinal movement."),
        M("hamstring-floss","Supine Hamstring Floss","8 reps per side","Alternate gentle knee extension and flexion; do not hold a hard stretch.","Prepare the hamstrings dynamically."),
        M("bridge","Glute Bridge","10 reps · 2-second squeeze","Finish with the hips, not the low back.","Prepare hip extension."),
        M("dowel-hinge","Dowel Hip-Hinge Drill","8 reps","Keep the dowel touching head, upper back, and tailbone.","Rehearse hinge mechanics before loading."),
        M("hinge-ramp","Progressive Hinge Ramp Sets","3–5 increasingly loaded sets","Build load gradually and stop before bar speed slows.","Specific preparation for the primary lift."),
        M("lat-pulldown-isometric","Straight-Arm Band Pulldown Hold","3 × 10 seconds","Keep ribs stacked and shoulders away from the ears.","Prime lat tension for bar control.")
      ]},
      {title:"Posterior-Chain Preparation",focus:"Hinge pattern",why:"The sequence rotates the secondary movements while preserving light hinge practice and loaded ramp sets.",moves:[
        M("breathing-rock","Rock-Back Breathing","5 slow breaths","Sit toward the heels while breathing into the back and sides of the ribcage.","Reduce unnecessary trunk tension before loading."),
        M("single-leg-rdl-reach","Supported Single-Leg RDL Reach","5 reps per side","Use a wall or rack and keep the hips square.","Prepare hamstrings and single-leg hip control."),
        M("frog-pump","Frog Pump","12 reps","Use a short controlled range and squeeze the glutes.","Prime hip extension without fatigue."),
        M("kb-rdl","Light Kettlebell RDL","8 reps","Keep the load close and move through the hips.","Rehearse the loaded hinge pattern."),
        M("hinge-ramp","Progressive Hinge Ramp Sets","3–5 increasingly loaded sets","Increase load only while setup and speed stay consistent.","Specific preparation for the primary lift."),
        M("brace-carry","Light Suitcase Carry","20–30 seconds per side","Walk tall without leaning away from the load.","Prepare lateral trunk control.")
      ]}
    ],
    upper_press:[
      {title:"Upper Press Preparation",focus:"Pressing",why:"Today emphasizes pressing. Bell selected thoracic motion, scapular control, rotator-cuff loading, and specific press ramp sets.",moves:[
        M("open-book","Open-Book Thoracic Rotation","6 reps per side","Let the upper back rotate while the knees stay stacked.","Prepare thoracic rotation without forcing the shoulder."),
        M("scap-car","Scapular Controlled Circles","6 each direction","Move the shoulder blade without shrugging aggressively.","Prepare scapular motion."),
        M("band-er","Light Band External Rotation","10 reps per side","Keep the elbow close and use light tension.","Prime the external rotators."),
        M("serratus-slide","Serratus Wall Slide","8 reps","Reach gently into the wall as the arms slide upward.","Prepare upward rotation and serratus control."),
        M("press-ramp","Progressive Press Ramp Sets","3–5 increasingly loaded sets","Match today’s grip and range; keep bar speed high.","Specific preparation for the primary lift."),
        M("scap-pushup","Scapular Push-Up","8–10 reps","Keep elbows straight and move only the shoulder blades.","Prepare closed-chain scapular control.")
      ]},
      {title:"Upper Press Preparation",focus:"Pressing",why:"This variation changes the accessory sequence but keeps dynamic shoulder preparation and specific pressing exposure.",moves:[
        M("thread-needle","Thread-the-Needle Rotation","5 reps per side","Rotate through the upper back and keep the motion comfortable.","Prepare thoracic motion."),
        M("band-pullapart","Band Pull-Apart","12 reps","Use light tension and keep ribs down.","Prime posterior shoulder and scapular control."),
        M("wall-clock","Band Wall Clock","5 reaches per side","Keep light band tension and avoid shrugging.","Prepare multidirectional scapular control."),
        M("incline-pushup","Incline Push-Up","6–8 smooth reps","Choose a height that feels easy and controlled.","Rehearse pressing without fatigue."),
        M("press-ramp","Progressive Press Ramp Sets","3–5 increasingly loaded sets","Use small jumps and preserve speed.","Specific preparation for the primary lift."),
        M("bottoms-carry","Light Bottoms-Up Carry","15–20 seconds per side","Use a very light kettlebell and keep the wrist stacked.","Prepare shoulder stability and grip.")
      ]}
    ],
    upper_pull:[
      {title:"Upper Pull Preparation",focus:"Pulling",why:"Today emphasizes rows, pull-ups, or upper-back work. Bell selected thoracic movement, scapular control, and light pulling before the primary exercise.",moves:[
        M("open-book","Open-Book Thoracic Rotation","6 reps per side","Rotate through the upper back without forcing the shoulder.","Prepare thoracic motion."),
        M("scap-pull","Scapular Pull-Up or Pulldown","8 reps","Keep elbows straight and move the shoulder blades only.","Prepare scapular depression."),
        M("pullapart","Band Pull-Apart","12–15 reps","Use light tension and stop before fatigue.","Prime upper-back activation."),
        M("facepull","Light Band Face Pull","10 reps","Pull toward eye level with smooth control.","Prepare rear shoulder and external rotation."),
        M("pull-ramp","Progressive Pulling Ramp Sets","2–4 increasingly loaded sets","Increase load gradually while keeping full control.","Specific preparation for the primary pull."),
        M("hang","Supported Active Hang","15–20 seconds","Keep some foot support if needed and avoid painful traction.","Prepare grip and overhead shoulder position.")
      ]},
      {title:"Upper Pull Preparation",focus:"Pulling",why:"This rotated sequence preserves scapular and pulling preparation while avoiding a repeated cookie-cutter routine.",moves:[
        M("quadruped-rotation","Quadruped Thoracic Rotation","5 reps per side","Follow the elbow with the eyes and move smoothly.","Prepare upper-back rotation."),
        M("wall-slide-liftoff","Wall Slide with Small Lift-Off","6 reps","Lift only if the shoulder remains comfortable.","Prepare upward rotation and lower-trap control."),
        M("straight-arm-pull","Straight-Arm Band Pulldown","12 reps","Keep elbows long and ribs stacked.","Prime the lats."),
        M("light-row","Light Chest-Supported Row","8 reps","Pause briefly with the shoulder blades controlled.","Rehearse horizontal pulling."),
        M("pull-ramp","Progressive Pulling Ramp Sets","2–4 increasingly loaded sets","Preserve grip and range as load increases.","Specific preparation for the primary pull."),
        M("farmer-carry","Light Farmer Carry","20–30 seconds","Walk tall with relaxed neck and firm grip.","Prepare grip and shoulder-girdle stiffness.")
      ]}
    ],
    run_easy:[
      {title:"Easy-Run Preparation",focus:"Running",why:"Today’s engine work is low intensity. Bell selected a brief lower-leg and hip sequence that prepares running mechanics without creating fatigue.",moves:[
        M("ankle-rock","Knee-to-Wall Ankle Rock","8 reps per side","Keep the heel down and arch controlled.","Prepare ankle motion for stance."),
        M("calf-raise","Slow Calf Raise","10 reps","Pause at the top and lower under control.","Prime the calf–Achilles complex."),
        M("leg-swing","Front-to-Back Leg Swing","8 reps per side","Use a small controlled arc before increasing range.","Prepare hip flexion and extension dynamically."),
        M("march","Tall March","20 controlled steps","Drive through the ground and keep posture tall.","Rehearse posture and reciprocal mechanics."),
        M("easy-build","Progressive Easy Build-Up","2 × 20 seconds","Increase from walk to easy run; do not sprint.","Bridge into today’s running pace."),
        M("lateral-walk","Lateral Band Walk","8 steps each way","Use light tension and keep feet parallel.","Prime lateral hip control.")
      ]},
      {title:"Easy-Run Preparation",focus:"Running",why:"The routine rotates drills while keeping the lower-leg, hip, and gait demands relevant to easy aerobic work.",moves:[
        M("foot-roll","Controlled Foot Roll-Through","10 reps per side","Move from heel to forefoot while keeping the toes relaxed.","Prepare foot loading."),
        M("bent-calf","Bent-Knee Calf Raise","10 reps","Keep the heel moving straight up and down.","Prime the soleus for running stance."),
        M("hip-open-close","Standing Hip Open-and-Close","6 reps each direction","Use support and move slowly.","Prepare hip rotation and single-leg balance."),
        M("walking-lunge","Short Walking Lunge","5 reps per side","Use a comfortable stride and shallow depth.","Prepare hip extension and gait coordination."),
        M("easy-build","Progressive Easy Build-Up","2 × 20 seconds","Ease into pace without accelerating hard.","Bridge into the aerobic session."),
        M("balance-reach","Single-Leg Balance Reach","4 reaches per side","Use fingertip support if needed.","Prepare foot and hip control.")
      ]}
    ],
    run_quality:[
      {title:"Speed & Interval Preparation",focus:"Running speed",why:"Today includes faster running. Bell selected dynamic lower-leg work, running drills, and progressive strides before the first hard repetition.",moves:[
        M("ankle-rock","Knee-to-Wall Ankle Rock","8 reps per side","Keep the heel planted and knee tracking smoothly.","Prepare ankle motion."),
        M("pogo-prep","Low Pogo Preparation","2 × 15 seconds","Stay low and elastic; stop if impact is uncomfortable.","Prepare lower-leg stiffness for faster running."),
        M("a-march","A-March","2 × 15 metres","Stay tall and place the foot beneath the hips.","Rehearse front-side running mechanics."),
        M("a-skip","A-Skip","2 × 15 metres","Keep the rhythm light rather than forcing height.","Add coordination and elastic rhythm."),
        M("strides","Progressive Strides","3 × 20 seconds","Build from easy to fast, never all-out.","Prepare speed gradually."),
        M("lateral-step","Lateral Step and Stick","4 reps per side","Step, absorb, and hold a balanced position.","Prepare frontal-plane control.")
      ]},
      {title:"Speed & Interval Preparation",focus:"Running speed",why:"This alternative quality-day sequence rotates drills while preserving progressive speed exposure.",moves:[
        M("calf-isometric","Calf Raise Isometric","2 × 20 seconds","Hold mid-to-high range without pain.","Prime calf–Achilles force transmission."),
        M("leg-swing","Multi-Directional Leg Swing","6 each direction per side","Use support and control the range.","Prepare hip motion dynamically."),
        M("wall-drill","Wall-Drive March","2 × 8 reps per side","Keep a straight line from head through heel.","Rehearse force direction."),
        M("ankling","Ankling Drill","2 × 15 metres","Use quick low contacts and stay relaxed.","Prepare foot and ankle rhythm."),
        M("strides","Progressive Strides","3 × 20 seconds","Finish fast but controlled.","Prepare the target pace."),
        M("skip-bound","Low Skip for Distance","2 × 15 metres","Use submaximal contacts; skip if impact feels wrong.","Prepare elastic horizontal force.")
      ]}
    ],
    hybrid:[
      {title:"Hybrid Session Preparation",focus:"Strength + Engine",why:"Today combines lifting and conditioning. Bell selected a short whole-body sequence, the primary lift pattern, and a transition drill for the engine component.",moves:[
        M("breathing-squat","Squat Pry with Breathing","4 slow breaths","Shift gently without forcing depth.","Prepare hips and ankles without fatigue."),
        M("world-greatest","World’s Greatest Stretch Flow","3 reps per side","Move continuously rather than holding long stretches.","Prepare hip extension and thoracic rotation."),
        M("scap-pushup","Scapular Push-Up","8 reps","Keep elbows straight and control the shoulder blades.","Prepare upper-body support."),
        M("pattern-ramp","Primary Lift Pattern Ramp Sets","3–4 increasingly loaded sets","Use the exact movement scheduled today.","Specific lifting preparation."),
        M("engine-transition","Engine Transition Build-Up","2 × 20 seconds","Use the day’s engine modality and build only to moderate pace.","Prepare the conditioning transition."),
        M("carry","Light Mixed Carry","20–30 seconds","Walk tall and choose a load that does not create fatigue.","Prepare whole-body bracing and gait.")
      ]},
      {title:"Hybrid Session Preparation",focus:"Strength + Engine",why:"The hybrid prescription rotates secondary movements but still prepares the day’s main lift and engine modality.",moves:[
        M("ankle-hip-flow","Ankle-to-Hip Flow","5 reps per side","Move from ankle rock into a controlled lunge reach.","Prepare lower-body range through linked positions."),
        M("tspine-reach","Quadruped Thoracic Reach","5 reps per side","Rotate smoothly and breathe out at end range.","Prepare thoracic motion."),
        M("band-complex","Light Band Pull + Press Complex","8 reps each","Use light tension and smooth tempo.","Prepare upper-body push and pull patterns."),
        M("pattern-ramp","Primary Lift Pattern Ramp Sets","3–4 increasingly loaded sets","Keep the early sets easy.","Specific lifting preparation."),
        M("engine-transition","Engine Transition Build-Up","2 × 20 seconds","Build to moderate pace using today’s modality.","Prepare the engine component."),
        M("deadbug","Dead Bug","5 reps per side","Breathe normally and avoid straining.","Prepare trunk coordination.")
      ]}
    ],
    bodybuilding_upper:[
      {title:"Upper-Body Hypertrophy Preparation",focus:"Upper-body hypertrophy",why:"Today’s bodybuilding work emphasizes the upper body. Bell uses light dynamic range, activation, and the first exercise’s ramp sets rather than a generic shoulder stretch list.",moves:[
        M("tspine-extension","Bench Thoracic Extension","6 controlled reps","Keep the ribs from flaring aggressively.","Prepare upper-back position."),
        M("band-pullapart","Band Pull-Apart","12 reps","Use light tension and stop well before fatigue.","Prime the upper back."),
        M("band-er","Light Band External Rotation","10 reps per side","Use a smooth pain-free range.","Prime rotator-cuff loading."),
        M("push-pull","Light Push-Pull Superset","6 push-ups + 8 light rows","Use easy variations and controlled tempo.","Prepare antagonistic upper-body patterns."),
        M("first-exercise-ramp","First Exercise Ramp Sets","2–4 increasingly loaded sets","Use the day’s first compound movement.","Specific preparation for hypertrophy work."),
        M("scap-circle","Scapular Circle","6 each direction","Move slowly without shrugging hard.","Prepare scapular movement variability.")
      ]}
    ],
    bodybuilding_lower:[
      {title:"Lower-Body Hypertrophy Preparation",focus:"Lower-body hypertrophy",why:"Today’s bodybuilding work emphasizes the lower body. Bell prepares the joint angles and muscles trained, then uses specific ramp sets instead of a repeated generic hip routine.",moves:[
        M("ankle-rock","Knee-to-Wall Ankle Rock","8 reps per side","Keep the heel down.","Prepare knee travel and squat depth."),
        M("hip-90-90","90/90 Hip Transitions","6 reps","Move slowly without forcing range.","Prepare hip rotation."),
        M("adductor-rock","Adductor Rock-Back","8 reps per side","Keep the spine long.","Prepare adductors for lower-body volume."),
        M("bodyweight-pattern","Bodyweight Pattern Rehearsal","8 controlled reps","Use the first exercise’s pattern and tempo.","Rehearse the day’s joint angles."),
        M("first-exercise-ramp","First Exercise Ramp Sets","2–4 increasingly loaded sets","Build gradually without accumulating fatigue.","Specific preparation for hypertrophy work."),
        M("calf-tib","Calf Raise + Tibialis Raise","10 reps each","Use smooth controlled reps.","Prepare the lower leg for stance and volume.")
      ]}
    ],
    olympic:[
      {title:"Olympic-Lifting Preparation",focus:"Explosive lifting",why:"Today requires rapid force, deep receiving positions, and overhead or front-rack control. Bell uses dynamic range and bar-specific rehearsal.",moves:[
        M("ankle-rock","Knee-to-Wall Ankle Rock","8 reps per side","Keep the heel down and arch active.","Prepare the receiving position."),
        M("tspine-rotation","Quadruped Thoracic Rotation","5 reps per side","Rotate smoothly through the upper back.","Prepare front-rack and overhead positions."),
        M("overhead-squat-pvc","PVC Overhead Squat","6 controlled reps","Use a comfortable grip and depth.","Rehearse whole-body position."),
        M("muscle-complex","Empty-Bar Muscle-Lift Complex","2 rounds of 3 reps each","Use a light bar and crisp technique.","Prepare the pull and turnover."),
        M("lift-ramp","Competition-Lift Ramp Sets","4–6 gradually loaded sets","Keep every rep technically clean.","Specific preparation for explosive lifting."),
        M("front-rack-mob","Front-Rack Elbow Lift","6 reps","Use straps or an empty bar if needed.","Prepare front-rack tolerance.")
      ]}
    ],
    tactical:[
      {title:"Tactical Performance Preparation",focus:"Strength + work capacity",why:"Tactical training needs whole-body movement, loaded locomotion, and rapid transitions. Bell prepares those demands without exhausting the athlete before the session.",moves:[
        M("crawl-rock","Bear-Plank Rock","8 controlled reps","Use a short range and keep breathing.","Prepare shoulders, hips, and trunk together."),
        M("lunge-reach","Reverse Lunge with Reach","5 reps per side","Use bodyweight and stay tall.","Prepare single-leg control and hip extension."),
        M("scap-pushup","Scapular Push-Up","8 reps","Keep elbows straight.","Prepare shoulder-girdle control."),
        M("carry-build","Progressive Carry Build-Up","2 × 20 metres","Start light and preserve posture.","Prepare loaded locomotion."),
        M("primary-ramp","Primary Movement Ramp Sets","3–4 increasingly loaded sets","Use the scheduled strength movement.","Specific strength preparation."),
        M("engine-build","Short Engine Build-Up","2 × 20 seconds","Use today’s modality at moderate pace.","Prepare work-capacity transitions.")
      ]}
    ],
    full_body:[
      {title:"Full-Body Movement Preparation",focus:"General training",why:"No single movement pattern dominates today. Bell selected a short whole-body sequence and preserves room for task-specific warm-up sets.",moves:[
        M("cat-camel","Cat-Camel","6 slow cycles","Move comfortably and breathe.","Introduce relaxed spinal movement."),
        M("world-greatest","World’s Greatest Stretch Flow","3 reps per side","Move continuously rather than holding.","Prepare hips and thoracic rotation."),
        M("ankle-rock","Knee-to-Wall Ankle Rock","8 reps per side","Keep the heel down.","Prepare ankle motion."),
        M("scap-pushup","Scapular Push-Up","8 reps","Control the shoulder blades.","Prepare upper-body support."),
        M("squat-to-stand","Squat-to-Stand","6 reps","Move smoothly through hinge and squat.","Prepare multiple lower-body patterns."),
        M("specific-ramp","First Exercise Ramp Sets","2–4 easy sets","Use the day’s first primary movement.","Add task-specific preparation.")
      ]},
      {title:"Full-Body Movement Preparation",focus:"General training",why:"This rotated general sequence uses dynamic movement and light activation rather than repeating the same hip or shoulder checklist every day.",moves:[
        M("march","Tall March","20 steps","Stay tall and place the foot beneath the hips.","Prepare gait and coordination."),
        M("hip-90-90","90/90 Hip Transitions","6 reps","Move slowly and comfortably.","Prepare hip rotation."),
        M("open-book","Open-Book Thoracic Rotation","5 reps per side","Rotate through the upper back.","Prepare thoracic motion."),
        M("bridge","Glute Bridge","10 reps","Use the hips without arching the low back.","Prepare hip extension."),
        M("band-complex","Light Band Pull + Press","8 reps each","Use light tension.","Prepare upper-body patterns."),
        M("specific-ramp","First Exercise Ramp Sets","2–4 easy sets","Use the day’s first primary movement.","Add task-specific preparation.")
      ]}
    ]
  };

  const MANUAL_MAP={
    "Full Body":"full_body","Hips":"lower_squat","Shoulders":"upper_press","Low Back":"lower_hinge","Ankles":"run_easy"
  };

  const REHAB_TEMPLATES={
    lateral_ankle_sprain:{source:"ankle",early:{why:"This clinician-diagnosed ankle module emphasizes symptom-limited ankle motion, calf loading, and supported balance. Follow weight-bearing and bracing restrictions from your clinician.",moves:[
      M("ankle-pumps","Ankle Pumps","20 slow reps","Move only through a comfortable range.","Maintain gentle ankle motion."),
      M("ankle-circles","Controlled Ankle Circles","6 each direction","Use a small smooth circle without forcing pain.","Restore multidirectional ankle motion."),
      M("seated-calf-isometric","Seated Calf Isometric","4 × 15 seconds","Press the forefoot into the floor without increasing symptoms.","Begin calf loading."),
      M("supported-weight-shift","Supported Weight Shift","8 reps each direction","Use a counter or rack and follow weight-bearing restrictions.","Reintroduce controlled loading."),
      M("supported-balance","Supported Single-Leg Balance","3 × 15–20 seconds","Keep fingertip support and stop if the ankle gives way.","Begin balance retraining."),
      M("toe-yoga","Toe Yoga","8 reps each pattern","Keep the heel down and move the big toe and lesser toes separately.","Restore foot control.")
    ]},build:{why:"This ankle capacity phase combines range of motion, progressive calf and evertor loading, and balance work—common components of post-acute ankle rehabilitation.",moves:[
      M("ankle-rock","Knee-to-Wall Ankle Rock","2 × 8 per side","Use a pain-limited range and keep the heel down.","Progress ankle dorsiflexion."),
      M("band-eversion","Band Ankle Eversion","2 × 12","Move slowly and keep the knee still.","Load the lateral ankle musculature."),
      M("calf-raise","Double-Leg Calf Raise","3 × 10","Progress toward more load only if symptoms stay controlled.","Build plantar-flexor capacity."),
      M("single-balance","Single-Leg Balance","3 × 20–30 seconds","Use support as needed; progress by reducing hand contact.","Restore static balance."),
      M("reach-balance","Three-Direction Balance Reach","2 rounds per side","Keep the stance foot controlled and reach only as far as stable.","Add dynamic balance and proprioception."),
      M("step-down","Low Step-Down","2 × 8 per side","Use a low step and keep the knee tracking smoothly.","Integrate ankle control into a functional task.")
    ]},return:{why:"This return-to-training ankle phase uses progressive single-leg strength, dynamic balance, and controlled impact only when the athlete has clinician clearance for impact.",moves:[
      M("single-calf","Single-Leg Calf Raise","3 × 8–12","Use support and match the uninvolved side’s control.","Build single-leg calf capacity."),
      M("loaded-step","Loaded Step-Down","3 × 8 per side","Add load gradually while keeping the foot stable.","Build functional lower-limb control."),
      M("star-reach","Star-Excursion Reach","2 rounds per side","Reach in multiple directions without losing foot control.","Challenge dynamic balance."),
      M("lateral-step-stick","Lateral Step and Stick","3 × 5 per side","Absorb quietly and hold a balanced landing.","Prepare lateral deceleration."),
      M("pogo-clearance","Low Pogo — Only If Cleared","3 × 15 seconds","Skip this movement without clinician clearance for impact.","Reintroduce elastic impact."),
      M("sport-build","Sport-Specific Build-Up","3 controlled exposures","Increase speed or complexity gradually.","Bridge rehabilitation into training demands.")
    ]}},
    patellofemoral_pain:{source:"knee",early:{why:"This clinician-diagnosed patellofemoral-pain module prioritizes posterolateral hip work with tolerable knee loading. The guideline favors combined hip- and knee-targeted exercise, with hip emphasis reasonable early.",moves:[
      M("side-hip-abduction","Side-Lying Hip Abduction","3 × 10 per side","Keep the pelvis stacked and toes facing forward.","Load the posterolateral hip."),
      M("bridge-band","Band Glute Bridge","3 × 10","Keep knees tracking over the feet and use a comfortable range.","Build hip extension and external-rotation capacity."),
      M("quad-isometric","Knee-Extension Isometric","5 × 20–30 seconds","Choose a knee angle that keeps symptoms tolerable.","Begin quadriceps loading."),
      M("sit-stand","High-Box Sit-to-Stand","3 × 8","Use a box height and depth that keep pain controlled.","Reintroduce functional knee loading."),
      M("calf-raise","Calf Raise","3 × 12","Keep pressure through the big toe and control the lowering.","Support lower-limb capacity."),
      M("easy-bike","Easy Bike or Walk","5–10 minutes","Use a comfortable pace that does not escalate symptoms.","Maintain aerobic activity and movement tolerance.")
    ]},build:{why:"This phase combines hip and knee strengthening through tolerable ranges, consistent with the patellofemoral-pain guideline’s preferred combined approach.",moves:[
      M("lateral-band","Lateral Band Walk","3 × 8 steps each way","Keep the feet parallel and pelvis level.","Load the posterolateral hip."),
      M("split-squat","Supported Split Squat","3 × 8 per side","Use support and a depth that keeps symptoms acceptable.","Build knee and hip strength together."),
      M("knee-extension","Resisted Knee Extension","3 × 10–15","Use controlled tempo and a tolerable range.","Progress quadriceps strength."),
      M("step-down","Low Step-Down","3 × 8 per side","Keep the knee tracking over the middle toes.","Build eccentric knee control."),
      M("single-rdl","Supported Single-Leg RDL","3 × 8 per side","Keep the hips square and use support.","Build hip strength and single-leg control."),
      M("calf-raise","Single-Leg Calf Raise","3 × 8–12","Use support and control the lowering.","Build lower-leg capacity.")
    ]},return:{why:"This return-to-training phase advances combined hip and knee strength into single-leg and running-relevant tasks while retaining symptom-response limits.",moves:[
      M("front-squat","Controlled Squat","3 × 6–10","Use a load and depth that keep symptoms stable during and after training.","Build knee-dominant strength."),
      M("rear-split","Rear-Foot-Elevated Split Squat","3 × 6–10 per side","Use support and adjust depth as needed.","Build single-leg hip and knee capacity."),
      M("lateral-step","Lateral Step-Down","3 × 8 per side","Control the pelvis and knee through the full rep.","Challenge frontal-plane control."),
      M("hip-abduction","Cable or Band Hip Abduction","3 × 12 per side","Move slowly without leaning.","Maintain posterolateral hip capacity."),
      M("run-walk","Graded Run–Walk Exposure","Clinician-approved progression","Increase running volume before speed and hills.","Bridge strength into running tolerance."),
      M("landing-control","Low Step-Off and Stick","3 × 5","Use only if jumping is cleared and symptoms remain controlled.","Prepare landing control.")
    ]}},
    rotator_cuff_tendinopathy:{source:"shoulder",early:{why:"This clinician-diagnosed rotator-cuff module uses symptom-limited active movement and low-load cuff/scapular exercise. Follow any restrictions on overhead range or loading.",moves:[
      M("pendulum","Supported Pendulum","30–45 seconds","Let the arm relax and use body motion rather than forcing the shoulder.","Maintain comfortable movement."),
      M("er-isometric","External-Rotation Isometric","5 × 20 seconds","Press gently into a wall or towel without moving the arm.","Begin rotator-cuff loading."),
      M("row-isometric","Supported Row Isometric","4 × 20 seconds","Pull lightly and keep the neck relaxed.","Begin scapular and posterior-shoulder loading."),
      M("table-slide","Table Slide","2 × 8","Slide only through a comfortable range.","Restore active-assisted elevation."),
      M("serratus-punch","Supine Serratus Punch","2 × 10","Reach toward the ceiling without shrugging.","Prepare scapular protraction control."),
      M("walk","Easy Walk","5–10 minutes","Keep the arm relaxed and maintain normal breathing.","Maintain general activity.")
    ]},build:{why:"This shoulder capacity phase uses progressive rotator-cuff and scapular loading with controlled elevation and pulling.",moves:[
      M("band-er","Band External Rotation","3 × 10–15","Use light-to-moderate resistance and a controlled tempo.","Build external-rotator capacity."),
      M("scaption","Light Scaption Raise","3 × 8–12","Raise in the shoulder-blade plane within a tolerable range.","Load elevation progressively."),
      M("row","Chest-Supported Row","3 × 10–12","Keep the neck relaxed and control the shoulder blades.","Build posterior shoulder and scapular strength."),
      M("wall-slide","Serratus Wall Slide","3 × 8","Reach gently and avoid painful shrugging.","Build upward-rotation control."),
      M("incline-push","Incline Push-Up Plus","3 × 8–12","Choose a height that keeps symptoms stable.","Build closed-chain shoulder capacity."),
      M("carry","Light Suitcase Carry","3 × 20 seconds per side","Walk tall without hiking the shoulder.","Build shoulder-girdle and trunk tolerance.")
    ]},return:{why:"This return-to-training phase advances pressing, pulling, overhead tolerance, and power gradually while preserving symptom-response and clinician restrictions.",moves:[
      M("landmine-press","Half-Kneeling Landmine Press","3 × 8 per side","Press in a comfortable arc and avoid forcing end range.","Build overhead-adjacent pressing capacity."),
      M("high-row","High Row to External Rotation","3 × 8–10","Use light resistance and smooth control.","Integrate cuff and scapular loading."),
      M("overhead-carry","Overhead Carry — If Cleared","3 × 15–20 metres","Use only with clinician clearance and stable symptoms.","Build sustained overhead tolerance."),
      M("pushup","Push-Up Progression","3 × 6–12","Choose the variation that remains controlled.","Return to horizontal pressing."),
      M("lat-pulldown","Neutral-Grip Pulldown","3 × 8–12","Use a pain-free range and controlled tempo.","Return to vertical pulling."),
      M("power-toss","Light Medicine-Ball Chest Pass","3 × 5","Use only when faster work is cleared.","Reintroduce upper-body power.")
    ]}},
    nonspecific_low_back_pain:{source:"back",early:{why:"This clinician-diagnosed nonspecific low-back-pain module uses tolerable general movement, aerobic activity, and low-load trunk control. No single exercise is treated as universally best.",moves:[
      M("walk","Comfortable Walk","5–10 minutes","Use a pace and duration that do not escalate symptoms.","Maintain general activity and aerobic movement."),
      M("breathing","Relaxed 360° Breathing","5 slow breaths","Let the abdomen and ribcage expand without forceful bracing.","Reduce unnecessary tension and support comfortable movement."),
      M("pelvic-rock","Supine Pelvic Rock","8 slow reps","Move through a small comfortable range.","Explore symptom-tolerable lumbar movement."),
      M("cat-camel","Cat-Camel","6 slow cycles","Stay in a comfortable range and avoid forcing end positions.","Add gentle trunk mobility."),
      M("bird-dog-short","Short-Lever Bird Dog","2 × 5 per side","Slide one foot or arm at a time before progressing.","Begin trunk coordination."),
      M("sit-stand","Sit-to-Stand","2 × 8","Use a comfortable chair height and normal breathing.","Maintain functional lower-body activity.")
    ]},build:{why:"This phase combines trunk endurance, movement-control practice, hip strength, and general aerobic exercise—categories supported in the low-back-pain guideline.",moves:[
      M("bird-dog","Bird Dog","3 × 6 per side","Reach long without twisting or holding your breath.","Build trunk coordination and endurance."),
      M("side-plank","Modified Side Plank","3 × 15–25 seconds per side","Use the knees or feet based on tolerance.","Build lateral trunk endurance."),
      M("bridge","Glute Bridge","3 × 10","Use the hips and maintain comfortable spinal position.","Build hip extension capacity."),
      M("hinge-drill","Dowel Hip-Hinge Drill","3 × 8","Practice a controlled task-specific hinge.","Retrain a functional movement pattern."),
      M("carry","Suitcase Carry","3 × 20–30 metres per side","Use a manageable load and normal breathing.","Build trunk and gait capacity."),
      M("aerobic","Walk, Bike, or Swim","10–20 minutes","Choose the modality that feels most tolerable.","Build general exercise tolerance.")
    ]},return:{why:"This return-to-training phase progresses whole-body strength, loaded movement, and conditioning while matching the athlete’s tolerated direction and clinician restrictions.",moves:[
      M("goblet-squat","Goblet Squat","3 × 8","Use a comfortable depth and controlled tempo.","Build whole-body strength."),
      M("rdl","Romanian Deadlift","3 × 8","Use a manageable load and the hinge style that feels best.","Build posterior-chain capacity."),
      M("row","Supported Row","3 × 10","Maintain normal breathing and controlled posture.","Build upper-body and trunk endurance."),
      M("carry","Farmer or Suitcase Carry","4 × 20 metres","Increase load gradually.","Build loaded locomotion capacity."),
      M("movement-exposure","Previously Limited Movement Exposure","3 graded sets","Increase range, load, or speed one variable at a time.","Bridge rehabilitation to the athlete’s training task."),
      M("conditioning","Graded Conditioning","15–25 minutes","Progress duration before intensity.","Restore general work capacity.")
    ]}}
  };

  function esc(value){
    if(typeof escapeHtml==="function")return escapeHtml(String(value??""));
    return String(value??"").replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
  }
  function quote(value){return String(value??"").replace(/\\/g,"\\\\").replace(/'/g,"\\'");}
  function today(){try{return typeof todayKey==="function"?todayKey():new Date().toISOString().slice(0,10);}catch(_){return new Date().toISOString().slice(0,10);}}
  function currentDateKey(){try{return activeMobilityDateKey||((typeof selectedDashboardDateKey==="function")?selectedDashboardDateKey():today());}catch(_){return today();}}
  function hash(value){let h=2166136261;for(const ch of String(value)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);}return Math.abs(h>>>0);}
  function ensureData(){
    if(typeof data!=="object"||!data)return;
    data.mobility=data.mobility&&typeof data.mobility==="object"?data.mobility:{};
    Object.assign(data.mobility,{focus:data.mobility.focus||"Auto",minutes:Number(data.mobility.minutes)||10});
    data.mobility.completedDates=Array.isArray(data.mobility.completedDates)?data.mobility.completedDates:[];
    data.mobility.checks=data.mobility.checks&&typeof data.mobility.checks==="object"?data.mobility.checks:{};
    data.mobility.prescriptions=data.mobility.prescriptions&&typeof data.mobility.prescriptions==="object"?data.mobility.prescriptions:{};
    data.mobility.sessionLog=Array.isArray(data.mobility.sessionLog)?data.mobility.sessionLog:[];
    data.mobility.schemaVersion=2;
    data.settings=data.settings||{};
    const p=data.settings.injuryProfile&&typeof data.settings.injuryProfile==="object"?data.settings.injuryProfile:{};
    p.rehab=p.rehab&&typeof p.rehab==="object"?p.rehab:{};
    p.rehab={active:Boolean(p.rehab.active??p.hasLimitations),clinicianDiagnosed:Boolean(p.rehab.clinicianDiagnosed),condition:p.rehab.condition||"",side:p.rehab.side||"not_specified",phase:p.rehab.phase||"early",severity:Number(p.rehab.severity)||0,restrictions:p.rehab.restrictions||"",redFlags:Array.isArray(p.rehab.redFlags)?p.rehab.redFlags:[],updatedAt:p.rehab.updatedAt||""};
    data.settings.injuryProfile=p;
  }
  function disciplineText(){
    const parts=[data?.settings?.athleteMode,data?.trainingBlock?.goalType,data?.trainingBlock?.strengthGoal,data?.athleteProfile?.identity?.primary,data?.athleteProfile?.identity?.objective];
    try{if(typeof BellAthleteProfile?.get==="function"){const p=BellAthleteProfile.get();parts.push(p?.identity?.primary,p?.identity?.objective);}}catch(_){}
    return parts.filter(Boolean).join(" ").toLowerCase();
  }
  function planText(key){
    const parts=[];
    // When a workout is open, its actual exercise list is authoritative. This prevents
    // a rescheduled upper-body session from inheriting mobility context from another
    // session that happens to occupy the same day after availability changes.
    try{
      const active=data.activeWorkout;
      const activeKey=String(active?.scheduledDate||active?.dailySessionDate||key).slice(0,10);
      if(active&&activeKey===key){
        parts.push(active.name,active.label,active.displayLabel,active.coachBrief,...(active.exercises||[]).map(x=>`${x.name||""} ${x.block||""}`));
        return parts.filter(Boolean).join(" ").toLowerCase();
      }
    }catch(_){}
    try{
      if(typeof premiumAllSessions==="function"){(premiumAllSessions()||[]).forEach(session=>parts.push(session?.mission,session?.label,session?.detail,session?.name));}
    }catch(_){}
    try{(data.plan||[]).filter(item=>String(item.scheduledDate||"").slice(0,10)===key).forEach(item=>parts.push(item.mission,item.label,item.detail,item.name));}catch(_){}
    if(!parts.length){try{const p=typeof currentPlan==="function"?currentPlan():null;parts.push(p?.mission,p?.label,p?.detail);}catch(_){} }
    return parts.filter(Boolean).join(" ").toLowerCase();
  }
  function contextFor(key){
    const discipline=disciplineText(),session=planText(key);
    const hasRun=/\brun|sprint|interval|tempo|5k|10k|marathon|track|engine|conditioning\b/.test(session);
    const quality=/sprint|interval|tempo|threshold|vo2|speed|hill repeat/.test(session);
    const lower=/lower|squat|lunge|leg press|front squat|back squat|split squat|quad/.test(session);
    const hinge=/deadlift|hinge|romanian|rdl|hamstring|posterior/.test(session);
    const upper=/upper|bench|press|push press|overhead|row|pull-up|chin-up|pulldown|shoulder|chest|back/.test(session);
    const pull=/row|pull-up|chin-up|pulldown|rear delt|back day/.test(session)&&!/bench|push press|overhead press/.test(session);
    const isOlympic=/olympic|weightlifting|snatch|clean|jerk/.test(`${discipline} ${session}`);
    const isBodybuilding=/bodybuild|hypertrophy|physique/.test(`${discipline} ${session}`);
    const isTactical=/tactical|law enforcement|military|firefighter/.test(discipline);
    let template="full_body";
    if(data.mobility.focus&&data.mobility.focus!=="Auto")template=MANUAL_MAP[data.mobility.focus]||"full_body";
    else if(isOlympic)template="olympic";
    else if(isTactical&&(hasRun||lower||upper))template="tactical";
    else if(isBodybuilding&&lower)template="bodybuilding_lower";
    else if(isBodybuilding&&upper)template="bodybuilding_upper";
    else if(hasRun&&(lower||upper))template="hybrid";
    else if(hasRun)template=quality?"run_quality":"run_easy";
    else if(hinge)template="lower_hinge";
    else if(lower)template="lower_squat";
    else if(upper)template=pull?"upper_pull":"upper_press";
    else if(/hybrid/.test(discipline))template="hybrid";
    return {discipline,session,template,hasRun,quality,lower,upper,hinge};
  }
  function inferredArea(profile,readiness){
    const areas=Array.isArray(profile?.affectedAreas)?profile.affectedAreas:[];
    const text=`${profile?.notes||""} ${readiness?.painNotes||""}`.toLowerCase();
    if(areas.includes("ankleFoot")||/ankle|foot|achilles/.test(text))return"ankle";
    if(areas.includes("knee")||/knee|kneecap|patella/.test(text))return"knee";
    if(areas.includes("shoulder")||/shoulder|rotator|cuff/.test(text))return"shoulder";
    if(areas.includes("back")||/back|lumbar|sciatica/.test(text))return"back";
    if(areas.includes("hip")||/hip|groin/.test(text))return"hip";
    return"other";
  }
  function inferCondition(profile,readiness){
    const explicit=profile?.rehab?.condition;
    if(explicit)return explicit;
    const area=inferredArea(profile,readiness),text=`${profile?.notes||""} ${readiness?.painNotes||""}`.toLowerCase();
    if(area==="ankle"&&/sprain|instability|giving way/.test(text))return profile?.rehab?.clinicianDiagnosed?"lateral_ankle_sprain":"undiagnosed_ankle";
    if(area==="knee"&&/patell|kneecap|front of knee|anterior knee/.test(text))return profile?.rehab?.clinicianDiagnosed?"patellofemoral_pain":"undiagnosed_knee";
    if(area==="shoulder"&&/rotator|cuff|tendin/.test(text))return profile?.rehab?.clinicianDiagnosed?"rotator_cuff_tendinopathy":"undiagnosed_shoulder";
    if(area==="back"&&/non.?specific|low back|lumbar/.test(text))return profile?.rehab?.clinicianDiagnosed?"nonspecific_low_back_pain":"undiagnosed_back";
    return`undiagnosed_${area}`;
  }
  function activeInjury(key){
    ensureData();
    const profile=data.settings.injuryProfile||{},r=data.settings.readiness||{};
    const readinessPain=String(r.lastPromptDate||"").slice(0,10)===key&&Boolean(r.painToday===true||r.painToday==="yes");
    const active=Boolean(profile.hasLimitations||profile.rehab?.active||readinessPain);
    if(!active)return null;
    const condition=inferCondition(profile,r),area=inferredArea(profile,r),diagnosed=Boolean(profile.rehab?.clinicianDiagnosed&&REHAB_TEMPLATES[condition]);
    return {active,condition,area,diagnosed,phase:profile.rehab?.phase||"early",side:profile.rehab?.side||"not_specified",severity:Number(profile.rehab?.severity)||0,restrictions:profile.rehab?.restrictions||profile.notes||r.painNotes||"",redFlags:Array.isArray(profile.rehab?.redFlags)?profile.rehab.redFlags:[],readinessPain};
  }
  function undiagnosedMoves(area){
    const common={ankle:[M("ankle-pumps","Gentle Ankle Pumps","15–20 reps","Move only within a comfortable range.","Maintain gentle ankle movement."),M("seated-calf","Seated Calf Raise","2 × 10","Use light pressure and stop if symptoms increase.","Introduce low-load calf movement."),M("supported-shift","Supported Weight Shift","2 × 6 each direction","Use a counter and do not exceed comfortable weight bearing.","Explore tolerable loading."),M("toe-yoga","Toe Yoga","8 reps","Keep the heel down.","Maintain foot control."),M("easy-walk","Short Easy Walk — If Comfortable","3–5 minutes","Stop if walking worsens symptoms.","Maintain general movement only when tolerated."),M("breathing","Relaxed Breathing","5 slow breaths","Let the ribcage expand naturally.","Reduce unnecessary tension.")],
      knee:[M("heel-slide","Heel Slide","2 × 8","Use a comfortable knee range.","Maintain gentle knee motion."),M("quad-set","Quadriceps Set","5 × 10 seconds","Tighten gently without forcing the knee flat.","Introduce low-load quadriceps activation."),M("bridge","Glute Bridge","2 × 8","Use a comfortable range.","Maintain hip strength without deep knee flexion."),M("high-sit-stand","High-Box Sit-to-Stand","2 × 6","Use only a depth that feels comfortable.","Explore functional loading."),M("calf-raise","Supported Calf Raise","2 × 10","Use hand support.","Maintain lower-leg capacity."),M("easy-bike","Easy Bike — If Comfortable","5 minutes","Stop if symptoms increase.","Maintain low-impact movement.")],
      shoulder:[M("pendulum","Supported Pendulum","30 seconds","Relax the arm and use body motion.","Maintain comfortable shoulder movement."),M("scap-set","Gentle Scapular Set","5 × 5 seconds","Draw the shoulder blade lightly back and down without force.","Maintain scapular awareness."),M("er-isometric","Very Light External-Rotation Isometric","4 × 10 seconds","Press gently into a wall with no visible movement.","Explore tolerable cuff loading."),M("table-slide","Table Slide","2 × 6","Slide only through a comfortable range.","Maintain assisted elevation."),M("walk","Easy Walk","5 minutes","Let the arm rest naturally.","Maintain general activity."),M("breathing","Relaxed Breathing","5 slow breaths","Avoid forceful bracing.","Reduce unnecessary upper-body tension.")],
      back:[M("walk","Comfortable Walk","5 minutes","Choose a pace and duration that feel tolerable.","Maintain general activity."),M("breathing","Relaxed 360° Breathing","5 slow breaths","Avoid forceful bracing.","Reduce unnecessary trunk tension."),M("pelvic-rock","Small Pelvic Rock","6 reps","Use only a comfortable range.","Explore symptom-tolerable movement."),M("cat-camel","Gentle Cat-Camel","5 cycles","Do not force end range.","Maintain gentle trunk motion."),M("sit-stand","Sit-to-Stand","2 × 6","Use a comfortable chair height.","Maintain functional movement."),M("supported-hinge","Supported Hip Hinge","2 × 6","Use hand support and a small range.","Explore a functional bending pattern.")],
      hip:[M("supine-march","Supine March","2 × 6 per side","Use a small comfortable range.","Maintain hip movement and trunk control."),M("bridge","Glute Bridge","2 × 8","Stop before symptoms increase.","Maintain hip extension capacity."),M("supported-abduction","Supported Hip Abduction","2 × 8 per side","Move slowly without leaning.","Maintain lateral hip loading."),M("sit-stand","High-Box Sit-to-Stand","2 × 6","Use a comfortable depth.","Explore functional loading."),M("easy-walk","Easy Walk — If Comfortable","5 minutes","Stop if symptoms increase.","Maintain general activity."),M("breathing","Relaxed Breathing","5 slow breaths","Keep the body relaxed.","Reduce unnecessary guarding.")],
      other:[M("breathing","Relaxed Breathing","5 slow breaths","Avoid forceful bracing.","Create a calm start before deciding what movement is tolerable."),M("easy-walk","Easy Walk — If Comfortable","3–5 minutes","Stop if symptoms increase.","Maintain general activity only if tolerated."),M("comfortable-rom","Comfortable Range-of-Motion Practice","6 slow reps","Move only the affected area through a comfortable range.","Maintain motion without diagnosing the condition."),M("isometric","Gentle Pain-Free Isometric","4 × 10 seconds","Use very light effort and stop if symptoms worsen.","Explore low-load muscle activation."),M("supported-balance","Supported Balance","2 × 20 seconds","Use stable support.","Maintain general control."),M("recheck","Symptom Recheck","After the session","Stop and seek evaluation if symptoms are worsening or concerning.","Keep the session conservative.")]
    };
    return common[area]||common.other;
  }
  function countForMinutes(minutes){return minutes<=6?4:minutes<=10?5:6;}
  function prescriptionSignature(key,ctx,injury){
    return JSON.stringify({key,focus:data.mobility.focus,minutes:data.mobility.minutes,template:ctx.template,session:ctx.session.slice(0,220),discipline:ctx.discipline.slice(0,120),injury:injury?{condition:injury.condition,diagnosed:injury.diagnosed,phase:injury.phase,side:injury.side,severity:injury.severity,restrictions:injury.restrictions,redFlags:injury.redFlags}:null});
  }
  function buildPrescription(key){
    ensureData();
    const ctx=contextFor(key),injury=activeInjury(key),minutes=Math.max(5,Number(data.mobility.minutes)||10),count=countForMinutes(minutes),signature=prescriptionSignature(key,ctx,injury);
    const cached=data.mobility.prescriptions[key];
    if(cached&&cached.signature===signature&&Array.isArray(cached.movements))return cached;
    let p;
    if(injury){
      const blocked=injury.redFlags.length>0;
      if(injury.diagnosed&&REHAB_TEMPLATES[injury.condition]){
        const module=REHAB_TEMPLATES[injury.condition],phase=module[injury.phase]||module.early;
        p={version:VERSION,key,mode:"rehab",kind:"Rehab Support",title:`${CONDITION_LABELS[injury.condition]} · ${PHASE_LABELS[injury.phase]}`,focus:CONDITION_LABELS[injury.condition],why:phase.why,evidence:SOURCE_LABELS[module.source],disclaimer:"Use this only with the diagnosis and restrictions entered by the athlete or clinician. Bell does not replace clinical care.",movements:blocked?[]:phase.moves.slice(0,count),blocked,injury};
      }else{
        p={version:VERSION,key,mode:"injury_support",kind:"Injury Support",title:`${CONDITION_LABELS[injury.condition]||"Current symptoms"} · Conservative Support`,focus:CONDITION_LABELS[injury.condition]||"Current symptoms",why:"Bell detected an active limitation or pain report without a supported clinician-diagnosed condition. The session is intentionally conservative and does not diagnose the problem.",evidence:"Conservative symptom-limited movement support · evaluation recommended when symptoms are new, severe, or persistent",disclaimer:"This is not a diagnosis or condition-specific treatment plan. Stop if symptoms worsen and seek appropriate evaluation.",movements:blocked?[]:undiagnosedMoves(injury.area).slice(0,count),blocked,injury};
      }
    }else{
      const options=HEALTHY_TEMPLATES[ctx.template]||HEALTHY_TEMPLATES.full_body,variant=options[hash(`${key}|${ctx.template}|${data.settings?.athleteName||"athlete"}`)%options.length];
      p={version:VERSION,key,mode:"healthy",kind:"Movement Preparation",title:variant.title,focus:variant.focus,why:variant.why,evidence:"Dynamic, task-specific preparation with strength, balance, and range-of-motion elements. Bell does not treat stretching alone as injury prevention.",disclaimer:"Preparation should feel useful, not fatiguing. Skip any movement that causes pain or conflicts with a clinician restriction.",movements:variant.moves.slice(0,count),blocked:false,context:ctx};
    }
    p.minutes=minutes;p.signature=signature;p.createdAt=new Date().toISOString();
    data.mobility.prescriptions[key]=p;
    const keys=Object.keys(data.mobility.prescriptions).sort();while(keys.length>28){delete data.mobility.prescriptions[keys.shift()];}
    try{saveData({render:false});}catch(_){}
    return p;
  }
  function invalidate(key=currentDateKey()){
    ensureData();delete data.mobility.prescriptions[key];data.mobility.checks[key]={};
    try{saveData({render:false});}catch(_){}
  }
  function moveArray(p){return p.movements.map(m=>{const a=[m.name,m.dose,m.cue,m.why];a.id=m.id;return a;});}

  window.BellAdaptiveMobility={version:VERSION,prescription:buildPrescription,activeInjury,invalidate,conditionLabels:CONDITION_LABELS,phaseLabels:PHASE_LABELS};
  if(window.BellDailySessions?.buildRows){
    const originalDailyRows=window.BellDailySessions.buildRows.bind(window.BellDailySessions);
    window.BellDailySessions.buildRows=function(key){
      const model=originalDailyRows(key),p=buildPrescription(key||today());
      (model?.rows||[]).filter(row=>row.type==="mobility").forEach(row=>{row.label=p.kind;row.description=p.blocked?"Exercise recommendations are paused by the injury safety screen.":p.mode==="healthy"?p.why:`${p.title}. ${p.why}`;row.recoveryFocus=Boolean(model.recoveryDay);});
      return model;
    };
  }
  window.dailyMobilityRoutine=function(){return moveArray(buildPrescription(currentDateKey()));};
  window.resolvedMobilityFocus=function(){return buildPrescription(currentDateKey()).focus;};

  function ensureModalEnhancements(){
    const settings=document.querySelector("#mobilityRoutineModal .mobility-routine-settings");
    if(settings&&!document.getElementById("bp13220PrescriptionExplanation")){
      const explanation=document.createElement("section");
      explanation.id="bp13220PrescriptionExplanation";
      explanation.className="bp13220-prescription-explanation";
      settings.insertAdjacentElement("afterend",explanation);
    }
    const hero=document.querySelector("#mobilityRoutineModal .mobility-routine-hero");
    if(hero&&!document.getElementById("bp13220SafetyBanner")){
      const banner=document.createElement("div");banner.id="bp13220SafetyBanner";banner.className="bp13220-safety-banner hidden";hero.insertAdjacentElement("afterend",banner);
    }
  }
  function renderExplanation(p){
    ensureModalEnhancements();
    const host=document.getElementById("bp13220PrescriptionExplanation");if(!host)return;
    const injury=p.injury;
    host.innerHTML=`<div><span class="metric-label">WHY THIS ${p.mode==="healthy"?"ROUTINE":"PRESCRIPTION"}</span><h3>${esc(p.why)}</h3><p>${esc(p.evidence)}</p></div>${injury?`<div class="bp13220-rehab-context"><span><small>MODE</small><strong>${esc(p.kind)}</strong></span><span><small>PHASE</small><strong>${esc(PHASE_LABELS[injury.phase]||"Conservative")}</strong></span><span><small>SIDE</small><strong>${esc(String(injury.side||"not specified").replaceAll("_"," "))}</strong></span></div>`:""}<small class="bp13220-disclaimer">${esc(p.disclaimer)}</small>`;
    const safety=document.getElementById("bp13220SafetyBanner");
    if(safety){
      safety.classList.toggle("hidden",!p.blocked);
      safety.innerHTML=p.blocked?`<strong>REHAB SUPPORT PAUSED</strong><p>One or more concerning symptoms were saved: ${p.injury.redFlags.map(x=>esc(RED_FLAG_LABELS[x]||x)).join("; ")}. Do not use an app-generated exercise session for this. Seek appropriate medical evaluation.</p>`:"";
    }
  }
  window.renderMobilityRoutineScreen=function(){
    ensureData();ensureModalEnhancements();
    const key=currentDateKey(),p=buildPrescription(key),checks=data.mobility.checks[key]||{},done=data.mobility.completedDates.includes(key),total=p.movements.length,completed=p.movements.filter((_,i)=>checks[i]).length,percent=total?Math.round(completed/total*100):0;
    const focusSelect=document.getElementById("mobilityRoutineFocusSelect"),minutesSelect=document.getElementById("mobilityRoutineMinutesSelect");
    if(focusSelect){focusSelect.value=data.mobility.focus||"Auto";focusSelect.disabled=p.mode!=="healthy";}
    if(minutesSelect)minutesSelect.value=String(data.mobility.minutes||10);
    if(typeof setText==="function"){
      setText("mobilityRoutineTitle",done?`${p.kind} Complete`:p.kind);
      setText("mobilityRoutineHeroTitle",`${p.minutes} min · ${p.title}`);
      setText("mobilityRoutineDuration",`${p.minutes} min`);
      setText("mobilityRoutineFocus",p.mode==="healthy"?p.focus:(p.mode==="rehab"?"Clinician-diagnosed":"Conservative"));
      setText("mobilityRoutineReason",p.mode==="healthy"?"Matched to today’s discipline and programmed session.":p.mode==="rehab"?"Replaces Daily Mobility while this injury profile is active.":"Active symptoms detected. Conservative support replaces Daily Mobility.");
      setText("mobilityRoutineProgressText",p.blocked?"Exercise prescription paused":`${completed} of ${total} movements complete`);
    }
    const kicker=document.querySelector("#mobilityRoutineModal .mobility-routine-hero .metric-label");if(kicker)kicker.textContent=p.mode==="healthy"?"ADAPTIVE MOVEMENT PREPARATION":p.mode==="rehab"?"GUIDELINE-INFORMED REHAB SUPPORT":"INJURY SUPPORT";
    const recoveryLabel=document.querySelector("#mobilityRoutineModal .progress-label span:last-child");if(recoveryLabel)recoveryLabel.textContent=p.kind;
    const bar=document.getElementById("mobilityRoutineProgressBar");if(bar)bar.style.width=`${done?100:percent}%`;
    renderExplanation(p);
    const host=document.getElementById("mobilityRoutineMoves");
    if(host){
      if(p.blocked)host.innerHTML="";
      else host.innerHTML=p.movements.map((move,index)=>{
        const checked=Boolean(checks[index]);
        return `<article class="mobility-routine-move bp13220-move ${checked?"complete":""}"><div class="bp13220-move-number">${checked?"✓":index+1}</div><div class="bp13220-move-copy"><span class="metric-label">Movement ${index+1}</span><h3>${esc(move.name)}</h3><p>${esc(move.dose)}</p><small>${esc(move.cue)}</small><em>${esc(move.why)}</em><button type="button" class="bp13220-move-complete ${checked?"is-complete":""}" onclick="toggleMobilityRoutineMove(${index},${checked?"false":"true"})">${checked?"COMPLETED ✓":"MARK COMPLETE"}</button></div></article>`;
      }).join("");
    }
    const finish=document.getElementById("finishMobilityRoutineButton"),hint=document.getElementById("mobilityRoutineFinishHint");
    if(finish){
      finish.disabled=done||p.blocked;
      finish.textContent=done?`${p.kind} Completed ✓`:p.blocked?"Prescription Paused":completed===total?"Complete Session":`Mark Remaining Complete & Finish`;
    }
    if(hint)hint.textContent=done?`${p.kind} is complete for this day.`:p.blocked?"Save and exit. Bell will not record a rehab session while red-flag symptoms are active.":completed===total?"All movements are marked complete. Finish to record the session.":`${completed} of ${total} completed. You may mark movements individually or finish the entire session.`;
  };
  window.toggleMobilityRoutineMove=function(index,checked){
    ensureData();const key=currentDateKey();data.mobility.checks[key]=data.mobility.checks[key]||{};data.mobility.checks[key][index]=Boolean(checked);try{saveData({render:false});}catch(_){}window.renderMobilityRoutineScreen();
  };
  window.finishMobilityRoutine=function(){
    ensureData();const key=currentDateKey(),p=buildPrescription(key);if(p.blocked){alert("Bell paused exercise recommendations because concerning symptoms are saved. Seek appropriate medical evaluation.");return;}
    const checks=data.mobility.checks[key]||{},remaining=p.movements.filter((_,i)=>!checks[i]).length;
    if(remaining){const okay=confirm(`Mark the remaining ${remaining} movement${remaining===1?"":"s"} complete and finish this ${p.kind.toLowerCase()} session?`);if(!okay)return;p.movements.forEach((_,i)=>{checks[i]=true;});data.mobility.checks[key]=checks;}
    if(!data.mobility.completedDates.includes(key))data.mobility.completedDates.push(key);
    data.mobility.sessionLog.push({date:key,completedAt:new Date().toISOString(),mode:p.mode,kind:p.kind,title:p.title,condition:p.injury?.condition||"",phase:p.injury?.phase||"",movementIds:p.movements.map(m=>m.id)});
    data.mobility.sessionLog=data.mobility.sessionLog.slice(-120);
    try{saveData({render:false});}catch(_){}
    window.renderMobilityRoutineScreen();
    try{if(window.BellDailySessions?.setComplete)BellDailySessions.setComplete("mobility",key);}catch(_){}
    try{if(typeof renderApp==="function")renderApp();}catch(_){}
    setTimeout(()=>alert(`${p.kind} complete. +40 XP earned.`),40);
  };
  window.completeMobility=function(){window.openMobilityRoutine?.(today());};

  const oldSaveFocus=window.saveMobilityFocus;
  window.saveMobilityFocus=function(){
    if(typeof oldSaveFocus==="function")oldSaveFocus.apply(this,arguments);invalidate(today());setTimeout(updateAllLabels,0);
  };
  const oldUpdateSettings=window.updateMobilityRoutineSettings;
  window.updateMobilityRoutineSettings=function(){
    if(typeof oldUpdateSettings==="function")oldUpdateSettings.apply(this,arguments);invalidate(currentDateKey());window.renderMobilityRoutineScreen();
  };

  function diagnosisOptions(){return `<option value="">Not selected / not diagnosed</option><option value="lateral_ankle_sprain">Lateral ankle sprain / chronic ankle instability</option><option value="patellofemoral_pain">Patellofemoral pain</option><option value="rotator_cuff_tendinopathy">Rotator cuff tendinopathy</option><option value="nonspecific_low_back_pain">Nonspecific low-back pain</option>`;}
  function ensureRehabProfileFields(){
    const panel=document.getElementById("onboardingLimitationsPanel");if(panel&&!document.getElementById("bp13220RehabProfileFields")){
      const section=document.createElement("section");section.id="bp13220RehabProfileFields";section.className="bp13220-rehab-profile-fields";
      section.innerHTML=`<div class="bp13220-profile-heading"><span class="metric-label">INJURY-AWARE SUPPORT</span><h3>Should Bell replace mobility with Rehab Support?</h3><p>Condition-specific modules require a diagnosis entered by the athlete or clinician. New or undiagnosed pain receives conservative Injury Support only.</p></div><div class="bp13220-profile-grid"><label>Diagnosis status<select id="bp13220DiagnosisStatus"><option value="undiagnosed">New / undiagnosed symptoms</option><option value="diagnosed">Clinician-diagnosed condition</option></select></label><label>Condition<select id="bp13220Condition">${diagnosisOptions()}</select></label><label>Affected side<select id="bp13220Side"><option value="not_specified">Not specified</option><option value="left">Left</option><option value="right">Right</option><option value="bilateral">Both sides</option><option value="central">Central / midline</option></select></label><label>Current phase<select id="bp13220Phase"><option value="early">Early / symptom calming</option><option value="build">Build capacity</option><option value="return">Return to training</option></select></label><label>Current symptom severity<input id="bp13220Severity" type="number" min="0" max="10" value="0"/></label><label class="bp13220-wide">Clinician restrictions or athlete notes<textarea id="bp13220Restrictions" maxlength="500" placeholder="Example: No impact, no heavy overhead pressing, weight bearing as tolerated."></textarea></label></div><details class="bp13220-red-flags"><summary>Safety screening — select any concerning symptom</summary><div>${Object.entries(RED_FLAG_LABELS).map(([value,label])=>`<label><input type="checkbox" value="${value}"/>${esc(label)}</label>`).join("")}</div></details><p class="bp13220-profile-note">Bell does not diagnose injuries. Selecting a supported diagnosis tells Bell which guideline-informed exercise categories to use; clinician restrictions always take priority.</p>`;
      panel.appendChild(section);
      const status=section.querySelector("#bp13220DiagnosisStatus"),condition=section.querySelector("#bp13220Condition");
      status?.addEventListener("change",()=>{condition.disabled=status.value!=="diagnosed";if(condition.disabled)condition.value="";});
    }
    const card=document.getElementById("injuryProfileSummary")?.closest(".card");
    if(card&&!document.getElementById("bp13220RehabSettingsSummary")){
      const div=document.createElement("div");div.id="bp13220RehabSettingsSummary";div.className="bp13220-rehab-settings-summary";const buttons=card.querySelector(".row");buttons?.insertAdjacentElement("beforebegin",div);
    }
  }
  function loadRehabFields(){
    ensureData();ensureRehabProfileFields();const r=data.settings.injuryProfile.rehab||{};
    const status=document.getElementById("bp13220DiagnosisStatus"),condition=document.getElementById("bp13220Condition"),side=document.getElementById("bp13220Side"),phase=document.getElementById("bp13220Phase"),severity=document.getElementById("bp13220Severity"),restrictions=document.getElementById("bp13220Restrictions");
    if(status)status.value=r.clinicianDiagnosed?"diagnosed":"undiagnosed";if(condition){condition.value=r.condition||"";condition.disabled=!r.clinicianDiagnosed;}if(side)side.value=r.side||"not_specified";if(phase)phase.value=r.phase||"early";if(severity)severity.value=String(Number(r.severity)||0);if(restrictions)restrictions.value=r.restrictions||"";
    document.querySelectorAll("#bp13220RehabProfileFields .bp13220-red-flags input").forEach(input=>input.checked=(r.redFlags||[]).includes(input.value));
  }
  function saveRehabFields(){
    ensureData();const p=data.settings.injuryProfile||{},diagnosed=document.getElementById("bp13220DiagnosisStatus")?.value==="diagnosed",condition=diagnosed?(document.getElementById("bp13220Condition")?.value||""):"";
    p.rehab={active:Boolean(p.hasLimitations),clinicianDiagnosed:diagnosed&&Boolean(condition),condition,side:document.getElementById("bp13220Side")?.value||"not_specified",phase:document.getElementById("bp13220Phase")?.value||"early",severity:Math.max(0,Math.min(10,Number(document.getElementById("bp13220Severity")?.value)||0)),restrictions:document.getElementById("bp13220Restrictions")?.value?.trim()||"",redFlags:[...document.querySelectorAll("#bp13220RehabProfileFields .bp13220-red-flags input:checked")].map(x=>x.value),updatedAt:new Date().toISOString()};
    data.settings.injuryProfile=p;invalidate(today());
  }
  const oldLoadProfile=window.loadOnboardingInjuryProfile;
  window.loadOnboardingInjuryProfile=function(){ensureRehabProfileFields();const result=typeof oldLoadProfile==="function"?oldLoadProfile.apply(this,arguments):undefined;loadRehabFields();return result;};
  const oldSaveProfile=window.saveOnboardingInjuryProfile;
  window.saveOnboardingInjuryProfile=function(){ensureRehabProfileFields();const okay=typeof oldSaveProfile==="function"?oldSaveProfile.apply(this,arguments):true;if(okay===false)return false;saveRehabFields();try{saveData({render:false});}catch(_){}setTimeout(updateAllLabels,0);return true;};
  const oldToggleLimitations=window.toggleOnboardingLimitations;
  window.toggleOnboardingLimitations=function(){const result=typeof oldToggleLimitations==="function"?oldToggleLimitations.apply(this,arguments):undefined;const on=document.getElementById("onboardingHasLimitations")?.checked;document.getElementById("bp13220RehabProfileFields")?.classList.toggle("hidden",!on);return result;};

  function updateRehabSettingsSummary(){
    ensureRehabProfileFields();const host=document.getElementById("bp13220RehabSettingsSummary");if(!host)return;const injury=activeInjury(today());
    if(!injury){host.innerHTML=`<span>Movement Preparation active</span><strong>Healthy-mode programming</strong><small>Bell matches the routine to discipline and today’s workout.</small>`;return;}
    host.innerHTML=`<span>${injury.diagnosed?"Rehab Support active":"Injury Support active"}</span><strong>${esc(CONDITION_LABELS[injury.condition]||"Current limitation")}</strong><small>${injury.redFlags.length?"Exercise recommendations paused by safety screening.":injury.diagnosed?`${esc(PHASE_LABELS[injury.phase])} · Daily Mobility is replaced while active.`:"Conservative support only until a diagnosis or clearance is entered."}</small>`;
  }
  function updateAllLabels(){
    ensureData();const key=(typeof selectedDashboardDateKey==="function"?selectedDashboardDateKey():today()),p=buildPrescription(key),done=data.mobility.completedDates.includes(key);
    const title=`${p.minutes} min ${p.kind}`;
    if(typeof setText==="function"){
      setText("mobilityDashboardTitle",title);
      setText("mobilityDashboardDetail",done?"Completed for this day ✓":p.mode==="healthy"?`Matched to ${p.focus} · Open when ready`:p.mode==="rehab"?`${p.focus} · ${PHASE_LABELS[p.injury.phase]}`:"Conservative support · evaluation may be appropriate");
    }
    const card=document.getElementById("dailyMobilityCard");if(card){const h=card.querySelector("h3");if(h)h.textContent=p.kind;const reason=document.getElementById("mobilityReason");if(reason)reason.textContent=p.why;const focusInput=document.getElementById("mobilityFocus");if(focusInput){focusInput.disabled=p.mode!=="healthy";focusInput.title=p.mode!=="healthy"?"Focus is controlled by the active injury profile.":"";}const btn=document.getElementById("mobilityCompleteButton");if(btn){btn.textContent=done?`${p.kind} Completed Today ✓`:`Open ${p.kind}`;btn.disabled=done;}}
    document.querySelectorAll(".premium-support-art-copy").forEach(copy=>{const kicker=copy.querySelector(".premium-kicker");if(kicker&&/mobility/i.test(kicker.textContent||"")){kicker.textContent=p.kind;const strong=copy.querySelector("strong"),paragraph=copy.querySelector("p"),button=copy.querySelector("button");if(strong)strong.textContent=`${p.minutes} min ${p.title}`;if(paragraph)paragraph.textContent=done?"Completed for this day.":p.why;if(button)button.textContent=done?`${p.kind} Complete`:`View ${p.kind}`;}});
    updateRehabSettingsSummary();
    const buildCard=document.querySelector(".bp-build-card strong");if(buildCard)buildCard.textContent="13.22.0 · Adaptive Movement Preparation & Rehab Support";
  }

  const oldRenderApp=window.renderApp;
  if(typeof oldRenderApp==="function")window.renderApp=function(){const result=oldRenderApp.apply(this,arguments);setTimeout(updateAllLabels,0);return result;};
  const oldPremiumSupport=window.renderPremiumSupport;
  if(typeof oldPremiumSupport==="function")window.renderPremiumSupport=function(){const result=oldPremiumSupport.apply(this,arguments);setTimeout(updateAllLabels,0);return result;};
  const oldVisualProfile=window.renderVisualProfile;
  if(typeof oldVisualProfile==="function")window.renderVisualProfile=function(){const result=oldVisualProfile.apply(this,arguments);setTimeout(updateAllLabels,0);return result;};

  function boot(){ensureData();ensureModalEnhancements();ensureRehabProfileFields();loadRehabFields();updateAllLabels();}
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else setTimeout(boot,0);
})();
