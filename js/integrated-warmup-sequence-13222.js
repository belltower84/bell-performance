"use strict";

/* Bell Performance 13.22.2 — General Warm-Up + Move / Activate / Ramp Sequence
   Restores a five-minute general warm-up before adaptive movement preparation,
   then organizes the required strength-session preparation into clear phases. */
(function(){
  const VERSION="13.22.2";
  const esc=value=>String(value??"").replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
  const jsq=value=>String(value??"").replace(/\\/g,"\\\\").replace(/'/g,"\\'");
  const isStrength=workout=>{
    try{return Boolean(window.BellIntegratedMovementPreparation?.isStrengthWorkout?.(workout));}
    catch(_){return Boolean(workout&&!workout.cardioType&&Array.isArray(workout.exercises)&&workout.exercises.length);}
  };
  const prescription=workout=>{
    try{return window.BellAdaptiveMobility?.prescription?.(String(workout?.dailySessionDate||workout?.scheduledDate||new Date().toISOString().slice(0,10)).slice(0,10))||null;}
    catch(_){return null;}
  };
  const activeEquipment=()=>{
    try{return new Set(window.activeEquipmentLocation?.().equipment||[]);}
    catch(_){return new Set(data?.settings?.equipmentSetup?.locations?.find(x=>x.id===data?.settings?.equipmentSetup?.activeLocationId)?.equipment||[]);}
  };
  const activeLocationName=()=>{
    try{return window.activeEquipmentLocation?.().name||"current training location";}
    catch(_){return "current training location";}
  };

  function primaryExercise(active){
    const exercises=Array.isArray(active?.exercises)?active.exercises:[];
    return exercises.find(ex=>["Primary Strength","Primary Hypertrophy"].includes(ex?.block))||exercises[0]||null;
  }

  function workoutPattern(active){
    const names=(active?.exercises||[]).map(ex=>String(ex?.name||"")).join(" ").toLowerCase();
    if(/squat|deadlift|hinge|lunge|leg press|hamstring|glute|calf/.test(names))return "lower";
    if(/bench|press|row|pulldown|pull-up|chin-up|curl|triceps|raise|fly/.test(names))return "upper";
    return "full";
  }

  function generalWarmup(active,p){
    const equipment=activeEquipment(),pattern=workoutPattern(active),injuryArea=String(p?.injury?.area||p?.injury?.condition||"").toLowerCase();
    let title="5-Minute General Warm-Up",modality="Brisk walk or continuous easy movement";
    const available=key=>equipment.has(key);
    if(/shoulder|rotator/.test(injuryArea)){
      if(available("bike"))modality="Easy stationary bike";
      else if(available("treadmill"))modality="Easy treadmill walk";
      else if(available("outdoor"))modality="Brisk outdoor walk";
    }else if(/ankle|knee|hip|back/.test(injuryArea)){
      if(available("bike"))modality="Easy, symptom-free stationary bike";
      else if(available("rower"))modality="Easy, symptom-free rower";
      else if(available("treadmill"))modality="Easy treadmill walk";
      else modality="Easy symptom-free walking or marching";
    }else if(pattern==="upper"){
      if(available("rower"))modality="Easy rower";
      else if(available("bike"))modality="Easy stationary bike";
      else if(available("airBike"))modality="Easy air bike";
      else if(available("treadmill"))modality="Easy treadmill walk or jog";
      else if(available("outdoor"))modality="Brisk walk or easy jog";
    }else{
      if(available("bike"))modality="Easy stationary bike";
      else if(available("treadmill"))modality="Easy treadmill walk or jog";
      else if(available("rower"))modality="Easy rower";
      else if(available("airBike"))modality="Easy air bike";
      else if(available("outdoor"))modality="Brisk walk or easy jog";
    }
    return {
      id:"general-warmup-5min",
      title,
      detail:`5 minutes · ${modality}`,
      dose:"5 minutes",
      cue:`Use a conversational effort at ${activeLocationName()}. Finish warm, not tired.${p?.mode!=="healthy"?" Stop if symptoms increase.":""}`,
      why:"Raise body temperature and breathing before the targeted preparation work.",
      kind:"general-warmup",
      phase:"general",
      integratedPreparation:true,
      done:false,
      skipped:false
    };
  }

  function isRampItem(item){
    const text=`${item?.id||""} ${item?.title||""} ${item?.detail||""}`.toLowerCase();
    return /ramp|competition-lift|first exercise|primary lift pattern|primary movement|specific preparation/.test(text);
  }

  function preparationPhase(item,p){
    if(p?.mode!=="healthy")return "rehab";
    const text=`${item?.id||""} ${item?.title||""} ${item?.cue||""} ${item?.why||""}`.toLowerCase();
    if(/bridge|dead bug|deadbug|bird dog|external rotation|band|pull-apart|pullapart|scap|serratus|calf raise|tibialis|tib raise|carry|split squat|goblet|push-up|pushup|hinge drill|kettlebell|march|ankling|skip|bound|activation|prime|isometric|frog pump|wall slide|bodyweight pattern|push-pull/.test(text))return "activate";
    return "move";
  }

  function specificRampItems(active,p){
    const first=primaryExercise(active);
    if(!first)return [];
    let ramps=[];
    try{ramps=typeof warmupSetsFor==="function"?warmupSetsFor(first):[];}catch(_){ramps=[];}
    const injuryNote=p?.mode!=="healthy"?" Use only the adjusted exercise and stay inside saved restrictions.":"";
    if(ramps.length){
      return ramps.map((ramp,index)=>({
        id:`specific-ramp-${index+1}`,
        title:`${first.name} · Ramp ${index+1}`,
        detail:`${ramp.weight} lb × ${ramp.reps}`,
        dose:`${ramp.weight} lb × ${ramp.reps}`,
        cue:`Increase load gradually. Every repetition should stay crisp and technically clean.${injuryNote}`,
        why:"Bridge the movement preparation into the first working set without creating fatigue.",
        kind:"ramp",
        phase:"ramp",
        integratedPreparation:true,
        done:false,
        skipped:false
      }));
    }
    return [{
      id:"specific-ramp-practice",
      title:`${first.name} · Practice Ramp`,
      detail:"2–4 gradually heavier practice sets",
      dose:"2–4 practice sets",
      cue:`Start very light and add load only while technique and speed remain sharp.${injuryNote}`,
      why:"Rehearse the exact first exercise before the working sets begin.",
      kind:"ramp",
      phase:"ramp",
      integratedPreparation:true,
      done:false,
      skipped:false
    }];
  }

  const baseBlueprint=typeof bellWarmupBlueprint==="function"?bellWarmupBlueprint:null;
  if(baseBlueprint){
    bellWarmupBlueprint=function(active){
      if(!isStrength(active))return baseBlueprint(active);
      const p=prescription(active);
      if(!p||p.blocked)return baseBlueprint(active);
      const adaptive=baseBlueprint(active).filter(item=>!isRampItem(item)).map(item=>({
        ...item,
        phase:preparationPhase(item,p),
        integratedPreparation:true
      }));
      return [generalWarmup(active,p),...adaptive,...specificRampItems(active,p)];
    };
    window.bellWarmupBlueprint=bellWarmupBlueprint;
  }

  const PHASES={
    general:{number:"01",label:"GENERAL WARM-UP",title:"Raise",description:"Five easy minutes to raise temperature and breathing without creating fatigue."},
    move:{number:"02",label:"MOVE",title:"Open the Required Positions",description:"Dynamic movement selected for today’s joints, ranges, and training patterns."},
    activate:{number:"03",label:"ACTIVATE",title:"Prime the Working Muscles",description:"Low-fatigue activation and pattern rehearsal before loading."},
    rehab:{number:"03",label:"REHAB SUPPORT",title:"Complete the Injury-Aware Work",description:"Follow the saved condition, phase, and restrictions before training."},
    ramp:{number:"04",label:"RAMP",title:"Build Into the Primary Lift",description:"Progressively rehearse the first exercise before the working sets."}
  };

  function phaseOrder(p){return p?.mode==="healthy"?["general","move","activate","ramp"]:["general","rehab","ramp"];}

  function renderMove(item,index,label){
    const checked=Boolean(item.done);
    return `<article class="bp13221-prep-move bp13222-prep-move ${checked?"is-complete":""}">
      <div class="bp13221-prep-number">${checked?"✓":index+1}</div>
      <div class="bp13221-prep-copy">
        <span class="metric-label">${esc(label)} · ${index+1}</span>
        <h3>${esc(item.title)}</h3>
        <p>${esc(item.dose||item.detail||"")}</p>
        ${item.cue?`<small>${esc(item.cue)}</small>`:""}
        ${item.why?`<em>${esc(item.why)}</em>`:""}
        <button type="button" class="bp13221-prep-complete ${checked?"is-complete":""}" onclick="toggleWorkoutWarmupItem('${jsq(item.id)}')">${checked?"COMPLETED ✓":"MARK COMPLETE"}</button>
      </div>
    </article>`;
  }

  const baseRender=typeof renderWarmupPanel==="function"?renderWarmupPanel:null;
  if(baseRender){
    renderWarmupPanel=function(){
      const panel=document.getElementById("warmupPanel"),active=data.activeWorkout;
      if(!panel||!active||!isStrength(active))return baseRender();
      const p=prescription(active);
      if(!p||p.blocked)return baseRender();
      const items=typeof bellEnsureWarmupState==="function"?bellEnsureWarmupState(active):[];
      const completed=items.filter(item=>item.done===true).length,total=items.length,percent=total?Math.round(completed/total*100):0;
      const order=phaseOrder(p);
      const complete=Boolean(total)&&completed===total;
      const modeLabel=p.mode==="healthy"?"MOVEMENT PREPARATION":p.mode==="rehab"?"REHAB SUPPORT":"INJURY SUPPORT";
      const phaseSummary=order.map(key=>{
        const group=items.filter(item=>item.phase===key),done=group.filter(item=>item.done).length,meta=PHASES[key];
        return `<span class="${group.length&&done===group.length?"is-complete":""}"><b>${meta.number}</b><small>${meta.label}</small><strong>${done}/${group.length}</strong></span>`;
      }).join("");
      panel.classList.remove("hidden");
      panel.innerHTML=`
        <section class="bp13221-workout-prep bp13222-workout-prep" aria-labelledby="bp13222PrepTitle">
          <header class="bp13221-prep-header bp13222-prep-header">
            <div><span class="metric-label">REQUIRED STRENGTH WARM-UP</span><h2 id="bp13222PrepTitle">${esc(p.title||modeLabel)}</h2><p>Complete the five-minute general warm-up, then move, activate, and ramp into today’s first working exercise.</p></div>
            <div class="bp13221-prep-summary"><strong>${completed}/${total}</strong><small>items complete</small></div>
          </header>
          <div class="bp13222-phase-summary" aria-label="Warm-up phase progress">${phaseSummary}</div>
          <section class="bp13221-prep-rationale"><div><span class="metric-label">WHY THIS PREPARATION</span><h3>${esc(p.why||"")}</h3><p>${esc(p.evidence||"")}</p></div><small>${esc(p.disclaimer||"")}</small></section>
          <div class="bp13221-prep-progress" aria-hidden="true"><span style="width:${percent}%"></span></div>
          <div class="bp13222-phase-list">
            ${order.map(key=>{
              const group=items.filter(item=>item.phase===key),meta=PHASES[key];
              if(!group.length)return "";
              return `<section class="bp13222-phase bp13222-phase-${key}">
                <header><div><span>${meta.number}</span><div><small>${meta.label}</small><h3>${meta.title}</h3></div></div><p>${meta.description}</p></header>
                <div class="bp13221-prep-list">${group.map((item,index)=>renderMove(item,index,meta.label)).join("")}</div>
              </section>`;
            }).join("")}
          </div>
          <footer class="bp13221-prep-actions bp13222-prep-actions">
            <button type="button" class="secondary" onclick="closeWorkout()">Save &amp; Exit</button>
            <button type="button" class="good" onclick="advanceToTraining()" ${complete?"":"disabled"}>Begin Working Sets</button>
          </footer>
        </section>`;
    };
    window.renderWarmupPanel=renderWarmupPanel;
  }

  const basePreview=typeof openWorkoutPreview==="function"?openWorkoutPreview:null;
  if(basePreview){
    openWorkoutPreview=function(workout,onBegin){
      const result=basePreview(workout,onBegin);
      if(isStrength(workout)){
        const warmups=typeof bellWarmupBlueprint==="function"?bellWarmupBlueprint(workout):[];
        const heading=document.querySelector("#workoutPreviewContent .bp-preview-heading");
        const small=heading?.querySelector("small"),h3=heading?.querySelector("h3");
        if(small)small.textContent="Integrated Warm-Up";
        if(h3)h3.textContent="Raise · Move · Activate · Ramp";
        const meta=document.getElementById("workoutPreviewMeta");
        if(meta)meta.textContent=`${workout.duration||30} minutes · ${(workout.exercises||[]).length} exercises · ${warmups.length} required warm-up items`;
      }
      return result;
    };
    window.openWorkoutPreview=openWorkoutPreview;
  }

  function updateLabels(){
    const build=document.querySelector(".bp-build-card strong");
    if(build)build.textContent="13.22.2 · Integrated Warm-Up Phase Sequence";
    const support=document.querySelector(".premium-support-art.mobility .premium-support-art-copy")||[...document.querySelectorAll(".premium-support-art-copy")].find(copy=>/inside today|movement preparation|rehab support/i.test(copy.textContent||""));
    const active=data.activeWorkout;
    if(support&&(!active||isStrength(active))){
      const paragraph=support.querySelector("p");
      if(paragraph&&/required before|part of the strength|inside today/i.test(paragraph.textContent||""))paragraph.textContent="Inside today’s strength session: 5-minute general warm-up, then move, activate, and ramp before working sets.";
    }
    const card=document.getElementById("dailyMobilityCard"),reason=document.getElementById("mobilityReason");
    if(card&&/inside strength/i.test(card.querySelector("h3")?.textContent||"")&&reason)reason.textContent="Inside today’s strength session: 5-minute general warm-up, targeted movement preparation, activation, and lift-specific ramp sets.";
  }

  function wrapRender(name){
    const original=window[name];if(typeof original!=="function"||original.__bp13222Wrapped)return;
    const wrapped=function(){const result=original.apply(this,arguments);setTimeout(updateLabels,35);return result;};
    wrapped.__bp13222Wrapped=true;window[name]=wrapped;
  }
  ["renderApp","renderPremiumSupport","renderBellCommercialHome","renderTrainingHub","renderVisualProfile"].forEach(wrapRender);

  window.BellIntegratedWarmupSequence={version:VERSION,generalWarmup,preparationPhase,specificRampItems};
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",()=>setTimeout(updateLabels,40),{once:true});else setTimeout(updateLabels,40);
})();
