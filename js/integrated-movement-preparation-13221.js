"use strict";

/* Bell Performance 13.22.1 — Integrated Movement Preparation Scheduling
   - Strength days: adaptive movement preparation lives inside the workout and is required before working sets.
   - Non-strength days: healthy movement prehab is optional.
   - Non-strength days with an active injury profile: Rehab/Injury Support becomes required.
*/
(function(){
  const VERSION="13.22.1";
  const esc=value=>String(value??"").replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
  const today=()=>{try{return typeof todayKey==="function"?todayKey():new Date().toISOString().slice(0,10);}catch(_){return new Date().toISOString().slice(0,10);}};
  const selectedKey=()=>{try{return typeof selectedDashboardDateKey==="function"?selectedDashboardDateKey():today();}catch(_){return today();}};
  const workoutKey=active=>String(active?.dailySessionDate||active?.scheduledDate||selectedKey()||today()).slice(0,10);

  function ensureMobilityStore(){
    data.mobility=data.mobility&&typeof data.mobility==="object"?data.mobility:{};
    data.mobility.completedDates=Array.isArray(data.mobility.completedDates)?data.mobility.completedDates:[];
    data.mobility.checks=data.mobility.checks&&typeof data.mobility.checks==="object"?data.mobility.checks:{};
    data.mobility.sessionLog=Array.isArray(data.mobility.sessionLog)?data.mobility.sessionLog:[];
    data.mobility.integratedPreparation=data.mobility.integratedPreparation&&typeof data.mobility.integratedPreparation==="object"?data.mobility.integratedPreparation:{};
  }

  function isStrengthWorkout(workout){
    if(!workout)return false;
    const type=String(workout.dailySessionType||workout.sessionType||"").toLowerCase();
    const name=String(workout.name||workout.mission||"");
    if(type)return type==="strength";
    if(workout.optionalCore||workout.cardioType||workout.engineMetrics)return false;
    if(/^[RMC]-/i.test(name))return false;
    return Array.isArray(workout.exercises)&&workout.exercises.length>0;
  }

  function prescriptionForWorkout(workout){
    if(!window.BellAdaptiveMobility?.prescription)return null;
    try{return window.BellAdaptiveMobility.prescription(workoutKey(workout));}catch(error){console.error("Integrated movement preparation failed",error);return null;}
  }

  const baseBlueprint=typeof bellWarmupBlueprint==="function"?bellWarmupBlueprint:null;
  if(baseBlueprint){
    bellWarmupBlueprint=function(active){
      if(!isStrengthWorkout(active))return baseBlueprint(active);
      const prescription=prescriptionForWorkout(active);
      if(!prescription)return baseBlueprint(active);
      if(prescription.blocked){
        return [{
          id:"integrated-safety-block",
          title:"Training preparation paused",
          detail:"A safety-screen symptom is active. Save and exit instead of beginning working sets.",
          kind:"safety",
          integratedPreparation:true,
          done:false,
          skipped:false
        }];
      }
      return (prescription.movements||[]).map((move,index)=>({
        id:`integrated-${move.id||index+1}`,
        title:move.name||`Preparation movement ${index+1}`,
        detail:[move.dose,move.cue].filter(Boolean).join(" · "),
        dose:move.dose||"",
        cue:move.cue||"",
        why:move.why||"",
        kind:prescription.mode==="healthy"?"movement-preparation":"rehab-support",
        integratedPreparation:true,
        sourceMode:prescription.mode,
        done:false,
        skipped:false
      }));
    };
    window.bellWarmupBlueprint=bellWarmupBlueprint;
  }

  const baseWarmupHandled=typeof bellWarmupHandled==="function"?bellWarmupHandled:null;
  if(baseWarmupHandled){
    bellWarmupHandled=function(active=data.activeWorkout){
      if(isStrengthWorkout(active)){
        const prescription=prescriptionForWorkout(active);
        if(prescription?.blocked)return false;
        const items=typeof bellEnsureWarmupState==="function"?bellEnsureWarmupState(active):[];
        return items.length===0||items.every(item=>item.done===true);
      }
      return baseWarmupHandled(active);
    };
    window.bellWarmupHandled=bellWarmupHandled;
  }

  function integratedComplete(active=data.activeWorkout){
    if(!isStrengthWorkout(active))return false;
    const prescription=prescriptionForWorkout(active);
    if(!prescription||prescription.blocked)return false;
    const items=typeof bellEnsureWarmupState==="function"?bellEnsureWarmupState(active):[];
    return Boolean(items.length)&&items.every(item=>item.done===true);
  }

  function recordIntegratedPreparation(active=data.activeWorkout){
    if(!integratedComplete(active))return false;
    ensureMobilityStore();
    const key=workoutKey(active),prescription=prescriptionForWorkout(active);
    const identity=`${key}|${active.planSessionKey||active.name||"strength"}`;
    if(!data.mobility.completedDates.includes(key))data.mobility.completedDates.push(key);
    data.mobility.integratedPreparation[key]={
      completed:true,
      completedAt:new Date().toISOString(),
      workout:active.label||active.name||"Strength Training",
      sessionKey:active.planSessionKey||"",
      mode:prescription?.mode||"healthy",
      title:prescription?.title||"Movement Preparation"
    };
    if(!data.mobility.sessionLog.some(entry=>entry?.identity===identity&&entry?.source==="integrated_strength_preparation")){
      data.mobility.sessionLog.push({
        identity,
        date:key,
        completedAt:new Date().toISOString(),
        source:"integrated_strength_preparation",
        mode:prescription?.mode||"healthy",
        kind:prescription?.kind||"Movement Preparation",
        title:prescription?.title||"Strength Preparation",
        movementIds:(prescription?.movements||[]).map(move=>move.id)
      });
      data.mobility.sessionLog=data.mobility.sessionLog.slice(-160);
    }
    active.integratedMovementPreparation={completed:true,date:key,mode:prescription?.mode||"healthy",title:prescription?.title||"Movement Preparation"};
    try{window.BellDailySessions?.setComplete?.("mobility",key);}catch(_){}
    try{saveData({render:false});}catch(_){}
    return true;
  }

  const baseToggle=typeof toggleWorkoutWarmupItem==="function"?toggleWorkoutWarmupItem:null;
  if(baseToggle){
    toggleWorkoutWarmupItem=function(id){
      const result=baseToggle(id);
      if(isStrengthWorkout(data.activeWorkout)&&integratedComplete(data.activeWorkout))recordIntegratedPreparation(data.activeWorkout);
      return result;
    };
    window.toggleWorkoutWarmupItem=toggleWorkoutWarmupItem;
  }

  const baseAdvance=typeof advanceToTraining==="function"?advanceToTraining:null;
  if(baseAdvance){
    advanceToTraining=function(){
      if(isStrengthWorkout(data.activeWorkout)){
        const prescription=prescriptionForWorkout(data.activeWorkout);
        if(prescription?.blocked){
          alert("Training is paused by the active injury safety screen. Save and exit, then seek appropriate evaluation.");
          return;
        }
        if(!integratedComplete(data.activeWorkout)){
          alert(`Complete every ${prescription?.mode==="healthy"?"movement-preparation":"rehab-support"} item before beginning the working sets.`);
          return;
        }
        recordIntegratedPreparation(data.activeWorkout);
      }
      return baseAdvance.apply(this,arguments);
    };
    window.advanceToTraining=advanceToTraining;
  }

  const baseRenderWarmup=typeof renderWarmupPanel==="function"?renderWarmupPanel:null;
  if(baseRenderWarmup){
    renderWarmupPanel=function(){
      const panel=document.getElementById("warmupPanel"),active=data.activeWorkout;
      if(!panel||!active||!isStrengthWorkout(active))return baseRenderWarmup();
      const p=prescriptionForWorkout(active);
      if(!p)return baseRenderWarmup();
      const items=typeof bellEnsureWarmupState==="function"?bellEnsureWarmupState(active):[];
      const completed=items.filter(item=>item.done===true).length,total=items.length,percent=total?Math.round(completed/total*100):0;
      const label=p.mode==="healthy"?"Movement Preparation":p.mode==="rehab"?"Rehab Support":"Injury Support";
      const kicker=p.mode==="healthy"?"REQUIRED STRENGTH PREPARATION":p.mode==="rehab"?"REQUIRED REHAB SUPPORT":"REQUIRED INJURY SUPPORT";
      panel.classList.remove("hidden");
      panel.innerHTML=`
        <section class="bp13221-workout-prep" aria-labelledby="bp13221PrepTitle">
          <header class="bp13221-prep-header">
            <div><span class="metric-label">${kicker}</span><h2 id="bp13221PrepTitle">${esc(p.title||label)}</h2><p>${esc(p.blocked?"Do not begin the strength session while the active safety-screen condition is unresolved.":p.why||"Complete this preparation before beginning the working sets.")}</p></div>
            <div class="bp13221-prep-summary"><strong>${p.blocked?"PAUSED":`${completed}/${total}`}</strong><small>${p.blocked?"Safety screen":"movements complete"}</small></div>
          </header>
          ${p.blocked?`<div class="bp13221-prep-safety"><strong>TRAINING PAUSED</strong><p>${esc(p.disclaimer||"Bell will not generate an exercise session while concerning symptoms are active. Seek appropriate medical evaluation.")}</p></div>`:`
          <section class="bp13221-prep-rationale"><div><span class="metric-label">WHY THIS PREPARATION</span><h3>${esc(p.why||"")}</h3><p>${esc(p.evidence||"")}</p></div><small>${esc(p.disclaimer||"")}</small></section>
          <div class="bp13221-prep-progress" aria-hidden="true"><span style="width:${percent}%"></span></div>
          <div class="bp13221-prep-list">
            ${items.map((item,index)=>{
              const checked=Boolean(item.done);
              return `<article class="bp13221-prep-move ${checked?"is-complete":""}"><div class="bp13221-prep-number">${checked?"✓":index+1}</div><div class="bp13221-prep-copy"><span class="metric-label">${label} · ${index+1}</span><h3>${esc(item.title)}</h3><p>${esc(item.dose||item.detail||"")}</p>${item.cue?`<small>${esc(item.cue)}</small>`:""}${item.why?`<em>${esc(item.why)}</em>`:""}<button type="button" class="bp13221-prep-complete ${checked?"is-complete":""}" onclick="toggleWorkoutWarmupItem('${esc(item.id)}')">${checked?"COMPLETED ✓":"MARK COMPLETE"}</button></div></article>`;
            }).join("")}
          </div>`}
          <footer class="bp13221-prep-actions">
            <button type="button" class="secondary" onclick="closeWorkout()">Save &amp; Exit</button>
            <button type="button" class="good" onclick="advanceToTraining()" ${p.blocked||!integratedComplete(active)?"disabled":""}>${p.blocked?"Training Paused":"Begin Working Sets"}</button>
          </footer>
        </section>`;
    };
    window.renderWarmupPanel=renderWarmupPanel;
  }

  const basePreview=typeof openWorkoutPreview==="function"?openWorkoutPreview:null;
  if(basePreview){
    openWorkoutPreview=function(workout,onBegin){
      const result=basePreview(workout,onBegin);
      if(isStrengthWorkout(workout)){
        const p=prescriptionForWorkout(workout);
        const headings=[...document.querySelectorAll("#workoutPreviewContent .bp-preview-heading")];
        const prep=headings[0];
        if(prep){
          const small=prep.querySelector("small"),h3=prep.querySelector("h3");
          if(small)small.textContent=p?.mode==="healthy"?"Integrated preparation":"Injury-aware preparation";
          if(h3)h3.textContent=p?.mode==="healthy"?"Movement Preparation":p?.kind||"Rehab Support";
        }
        const meta=document.getElementById("workoutPreviewMeta");
        if(meta&&p)meta.textContent=`${workout.duration||30} minutes · ${(workout.exercises||[]).length} exercises · ${(p.movements||[]).length} required preparation movements`;
      }
      return result;
    };
    window.openWorkoutPreview=openWorkoutPreview;
  }

  const baseDailyBuild=window.BellDailySessions?.buildRows?.bind(window.BellDailySessions);
  function baseDayModel(key){
    try{return baseDailyBuild?baseDailyBuild(key):null;}catch(error){console.error("Movement scheduling failed",error);return null;}
  }
  function strengthRowFrom(model){return model?.rows?.find(row=>row.type==="strength"&&!row.optional)||model?.rows?.find(row=>row.type==="strength");}
  function dayRole(key,model=baseDayModel(key)){
    const strength=strengthRowFrom(model),p=window.BellAdaptiveMobility?.prescription?.(key||today());
    return {strength,p,injury:Boolean(p&&p.mode!=="healthy"),blocked:Boolean(p?.blocked)};
  }

  if(baseDailyBuild){
    window.BellDailySessions.buildRows=function(key){
      const model=baseDayModel(key),date=key||model?.key||today();
      if(!model)return model;
      const {strength,p,injury,blocked}=dayRole(date,model);
      const mobility=model.rows.find(row=>row.type==="mobility");
      if(strength){
        model.rows=model.rows.filter(row=>row.type!=="mobility");
        strength.integratedMovementPreparation=true;
        strength.preparationMode=p?.mode||"healthy";
        strength.description=`${String(strength.description||"").replace(/\s+/g," ").trim()} ${p?.mode==="healthy"?"Includes required movement preparation before the working sets.":"Includes required injury-aware support before the working sets."}`.trim();
        model.integratedMovement={kind:p?.kind||"Movement Preparation",title:p?.title||"Strength Preparation",minutes:p?.minutes||data.mobility?.minutes||10,completed:Boolean(data.mobility?.completedDates?.includes(date)),blocked};
      }else if(mobility){
        mobility.minutes=Math.max(5,Number(p?.minutes)||Number(mobility.minutes)||10);
        if(injury&&!blocked){
          mobility.optional=false;mobility.required=true;mobility.outsideBudget=false;mobility.recoveryFocus=false;
          mobility.label=`Required ${p.kind||"Rehab Support"}`;
          mobility.status="Required";
          mobility.description=`${p.title}. Complete this support session today unless it conflicts with clinician restrictions or worsens symptoms.`;
        }else if(blocked){
          mobility.optional=true;mobility.required=false;mobility.label="Injury Safety Review";mobility.status="Training Paused";
          mobility.description="Exercise support is paused because a concerning symptom is active. Seek appropriate evaluation before resuming.";
        }else{
          mobility.optional=true;mobility.required=false;mobility.outsideBudget=true;
          mobility.label="Optional Movement Prehab";mobility.status="Optional";
          mobility.description="Optional movement-quality, range-of-motion, and recovery work selected for today’s training context.";
        }
      }
      model.required=model.rows.filter(row=>row.required);
      model.requiredMinutes=model.required.reduce((sum,row)=>sum+Number(row.minutes||0),0);
      model.recoveryDay=!model.rows.some(row=>row.type==="strength"||row.type==="engine");
      return model;
    };
  }

  function currentDayRole(key=selectedKey()){
    const model=window.BellDailySessions?.buildRows?.(key),strength=strengthRowFrom(model),p=window.BellAdaptiveMobility?.prescription?.(key);
    return {model,strength,p,injury:Boolean(p&&p.mode!=="healthy"),blocked:Boolean(p?.blocked),done:Boolean(data.mobility?.completedDates?.includes(key))};
  }

  function openIntegratedStrength(key){
    const date=key||selectedKey();
    if(data.activeWorkout&&isStrengthWorkout(data.activeWorkout)&&workoutKey(data.activeWorkout)===date){
      if(typeof openWorkoutUI==="function")openWorkoutUI();
      return;
    }
    if(window.BellDailySessions?.preview)window.BellDailySessions.preview("strength",date);
    else if(window.BellDailySessions?.start)window.BellDailySessions.start("strength",date);
  }

  const baseOpenMobility=window.openMobilityRoutine;
  if(typeof baseOpenMobility==="function"){
    window.openMobilityRoutine=function(key){
      const date=String(key||selectedKey()).slice(0,10),role=currentDayRole(date);
      if(role.strength){openIntegratedStrength(date);return;}
      return baseOpenMobility.apply(this,arguments);
    };
  }

  const baseMobilityRender=window.renderMobilityRoutineScreen;
  if(typeof baseMobilityRender==="function"){
    window.renderMobilityRoutineScreen=function(){
      const result=baseMobilityRender.apply(this,arguments),key=String((()=>{try{return activeMobilityDateKey||selectedKey();}catch(_){return selectedKey();}})()).slice(0,10),role=currentDayRole(key),p=role.p;
      if(!role.strength&&p){
        const healthy=p.mode==="healthy";
        if(typeof setText==="function"){
          setText("mobilityRoutineTitle",role.done?(healthy?"Movement Prehab Complete":`${p.kind} Complete`):(healthy?"Optional Movement Prehab":`Required ${p.kind}`));
          setText("mobilityRoutineReason",healthy?"Optional today because no strength session is scheduled. Complete it when it supports recovery, movement quality, or tomorrow’s training.":p.blocked?"Exercise support is paused by the active safety screen.":"Required today while the active injury profile is limiting normal training.");
        }
        const kicker=document.querySelector("#mobilityRoutineModal .mobility-routine-hero .metric-label");
        if(kicker)kicker.textContent=healthy?"OPTIONAL MOVEMENT PREHAB":p.blocked?"INJURY SAFETY SCREEN":"REQUIRED REHAB SUPPORT";
      }
      return result;
    };
  }

  function updateDashboardScheduling(){
    ensureMobilityStore();
    const key=selectedKey(),role=currentDayRole(key),p=role.p;if(!p)return;
    const support=document.querySelector(".premium-support-art.mobility .premium-support-art-copy")||[...document.querySelectorAll(".premium-support-art-copy")].find(copy=>/mobility|movement|rehab|injury support/i.test(copy.textContent||""));
    if(support){
      const kicker=support.querySelector(".premium-kicker"),strong=support.querySelector("strong"),paragraph=support.querySelector("p"),button=support.querySelector("button");
      if(role.strength){
        if(kicker)kicker.textContent="Inside Today’s Strength Session";
        if(strong)strong.textContent=`${p.minutes} min · ${p.title}`;
        if(paragraph)paragraph.textContent=role.done?"Completed inside today’s strength warm-up.":p.blocked?"Strength training is paused by the injury safety screen.":"Required before the first working set. It is now part of the strength workout rather than a separate session.";
        if(button){button.textContent=role.done?"Preparation Complete":"Open Strength Session";button.disabled=role.done||p.blocked;button.onclick=()=>openIntegratedStrength(key);}
      }else{
        if(kicker)kicker.textContent=p.mode==="healthy"?"Optional Movement Prehab":p.blocked?"Injury Safety Review":`Required ${p.kind}`;
        if(strong)strong.textContent=`${p.minutes} min · ${p.title}`;
        if(paragraph)paragraph.textContent=role.done?"Completed for this day.":p.mode==="healthy"?"Optional today because no strength session is scheduled.":p.blocked?"Exercise support is paused until the safety concern is evaluated.":"Required today while the active injury profile is limiting training.";
        if(button){button.textContent=role.done?`${p.kind} Complete`:p.blocked?"Review Safety Screen":p.mode==="healthy"?"Open Optional Prehab":`Start ${p.kind}`;button.disabled=role.done;button.onclick=()=>baseOpenMobility.call(window,key);}
      }
    }
    const card=document.getElementById("dailyMobilityCard");
    if(card){
      const title=card.querySelector("h3"),reason=document.getElementById("mobilityReason"),button=document.getElementById("mobilityCompleteButton");
      if(role.strength){
        if(title)title.textContent="Movement Preparation · Inside Strength";
        if(reason)reason.textContent=role.done?"Completed with today’s strength session.":"Required before today’s working sets. Open the strength workout to complete it.";
        if(button){button.textContent=role.done?"Preparation Completed ✓":"Open Strength Session";button.disabled=role.done||p.blocked;button.onclick=()=>openIntegratedStrength(key);}
      }else{
        if(title)title.textContent=p.mode==="healthy"?"Optional Movement Prehab":p.blocked?"Injury Safety Review":`Required ${p.kind}`;
        if(reason)reason.textContent=p.mode==="healthy"?"Optional today because no strength session is scheduled.":p.blocked?"Exercise support is paused by the safety screen.":"Required today while the active injury profile remains active.";
        if(button){button.textContent=role.done?`${p.kind} Completed Today ✓`:p.blocked?"Review Safety Screen":p.mode==="healthy"?"Open Optional Prehab":`Open ${p.kind}`;button.disabled=role.done;button.onclick=()=>baseOpenMobility.call(window,key);}
      }
    }
    const build=document.querySelector(".bp-build-card strong");if(build)build.textContent="13.22.1 · Integrated Movement Preparation Scheduling";
  }

  function wrapRender(name){
    const original=window[name];if(typeof original!=="function"||original.__bp13221Wrapped)return;
    const wrapped=function(){const result=original.apply(this,arguments);setTimeout(updateDashboardScheduling,10);return result;};
    wrapped.__bp13221Wrapped=true;window[name]=wrapped;
  }
  ["renderApp","renderPremiumSupport","renderBellCommercialHome","renderTrainingHub","renderVisualProfile"].forEach(wrapRender);

  window.BellIntegratedMovementPreparation={version:VERSION,isStrengthWorkout,recordIntegratedPreparation,dayRole:currentDayRole,openIntegratedStrength};
  function boot(){ensureMobilityStore();setTimeout(updateDashboardScheduling,20);}
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
})();
