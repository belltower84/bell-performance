(function(){
  'use strict';

  function esc(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
  function appData(){try{if(typeof data!=='undefined'&&data)return data;}catch(_){}return window.data||null;}
  function resolved(set){return Boolean(set?.done||set?.skipped);}

  function countFromPrescription(ex){
    const direct=Number(ex?.setCount||ex?.setsCount||ex?.originalSets);
    if(Number.isFinite(direct)&&direct>0)return Math.max(1,Math.round(direct));
    const text=String(ex?.prescription||'').trim();
    const m=text.match(/(\d+)\s*[x×]/i);
    return m?Math.max(1,Number(m[1])):1;
  }
  function repsFromPrescription(ex){
    if(ex?.plannedReps!==undefined&&ex?.plannedReps!==null&&String(ex.plannedReps).trim())return ex.plannedReps;
    const text=String(ex?.prescription||'').trim();
    const m=text.match(/\d+\s*[x×]\s*(.+)$/i);
    return m?m[1].trim():'target reps';
  }
  function materializeExercise(ex){
    if(!ex||typeof ex!=='object')return null;
    const existing=Array.isArray(ex.sets)?ex.sets:[];
    if(existing.length){
      ex.sets=existing.map((set,index)=>({
        set:Number(set?.set)||index+1,
        plannedWeight:set?.plannedWeight??ex.recommendedWeight??'',
        plannedReps:set?.plannedReps??set?.reps??repsFromPrescription(ex),
        weight:set?.weight??set?.plannedWeight??ex.recommendedWeight??'',
        reps:set?.reps??set?.plannedReps??repsFromPrescription(ex),
        rpe:set?.rpe??'',rir:set?.rir??'',done:Boolean(set?.done),skipped:Boolean(set?.skipped),
        skippedAt:set?.skippedAt??''
      }));
      return ex;
    }
    const count=countFromPrescription(ex),reps=repsFromPrescription(ex),weight=ex.recommendedWeight??'';
    ex.sets=Array.from({length:count},(_,index)=>({set:index+1,plannedWeight:weight,plannedReps:reps,weight,reps,rpe:'',rir:'',done:false,skipped:false}));
    return ex;
  }
  function materializeWorkout(active){
    if(!active||!Array.isArray(active.exercises))return false;
    active.exercises=active.exercises.map(materializeExercise).filter(Boolean);
    return active.exercises.some(ex=>Array.isArray(ex.sets)&&ex.sets.length);
  }
  function locateExercise(){
    const active=appData()?.activeWorkout;
    if(!active||!materializeWorkout(active))return null;
    const requested=Number(active.gwExerciseIndex);
    if(Number.isInteger(requested)&&requested>=0&&requested<active.exercises.length){
      const exercise=active.exercises[requested];
      if(Array.isArray(exercise?.sets)&&exercise.sets.length){
        return{active,exercise,exerciseIndex:requested,rating:exercise.sets.every(resolved)&&!exercise.loadRating};
      }
    }
    const exerciseIndex=active.exercises.findIndex(ex=>Array.isArray(ex.sets)&&ex.sets.some(set=>!resolved(set)));
    if(exerciseIndex>=0){
      active.gwExerciseIndex=exerciseIndex;
      return{active,exercise:active.exercises[exerciseIndex],exerciseIndex,rating:false};
    }
    const unrated=active.exercises.findIndex(ex=>Array.isArray(ex.sets)&&ex.sets.length&&ex.sets.every(resolved)&&!ex.loadRating);
    if(unrated>=0){active.gwExerciseIndex=unrated;return{active,exercise:active.exercises[unrated],exerciseIndex:unrated,rating:true};}
    return{active,done:true};
  }
  function nextExercise(active,index){
    return active.exercises.slice(index+1).find(ex=>Array.isArray(ex.sets)&&ex.sets.some(set=>!resolved(set)))||null;
  }
  function muscleProfile(name){
    const n=String(name||'').toLowerCase();
    if(/squat|leg press|lunge|split squat/.test(n))return['Quads','Glutes','Hamstrings','Core'];
    if(/deadlift|rdl|good morning|hinge/.test(n))return['Hamstrings','Glutes','Back'];
    if(/bench|chest|push-up|fly|incline|dip/.test(n))return['Chest','Triceps','Front delts'];
    if(/pull-up|pulldown|row|chin|\bback\b/.test(n))return['Lats','Upper back','Biceps'];
    if(/press|shoulder|lateral raise/.test(n))return['Shoulders','Triceps'];
    if(/curl/.test(n))return['Biceps','Forearms'];
    if(/triceps|extension|pushdown/.test(n))return['Triceps'];
    if(/calf/.test(n))return['Calves'];
    if(/plank|core|ab|carry/.test(n))return['Core'];
    return ['Primary muscles'];
  }
  function muscleIcon(){
    return `<svg class="gw-muscle-icon" viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="7" r="4"/><path d="M18 13c-4 3-6 8-6 14m18-14c4 3 6 8 6 14M19 14l-2 13 3 15m9-28 2 13-3 15M18 18h12M17 25h14"/><path class="gw-muscle-hot" d="M18 15c2-2 10-2 12 0l-1 8c-3 2-7 2-10 0z"/></svg>`;
  }
  function renderGuard(message){
    const c=document.getElementById('activeExercises'); if(!c)return;
    c.innerHTML=`<section class="gw-shell"><article class="gw-current gw-guard"><div class="gw-kicker">Workout setup</div><h2 class="gw-title">${esc(message||'Preparing your working sets')}</h2><p class="gw-sub">Bell could not read this exercise prescription yet. Return to the workout overview and try again.</p><button class="gw-complete" type="button" onclick="renderActiveWorkout()">Retry workout setup</button></article></section>`;
  }
  function updateSetValue(exerciseIndex,setIndex,field,value){
    const set=appData()?.activeWorkout?.exercises?.[exerciseIndex]?.sets?.[setIndex]; if(!set)return;
    set[field]=value; window.saveData?.({render:false});
  }
  function rateExercise(exerciseIndex,rating){
    const active=appData()?.activeWorkout,exercise=active?.exercises?.[exerciseIndex]; if(!exercise)return;
    exercise.loadRating=rating;
    exercise.loadRatingAt=new Date().toISOString();
    const nextIndex=active.exercises.findIndex((ex,index)=>index>exerciseIndex&&Array.isArray(ex.sets)&&ex.sets.length);
    if(nextIndex>=0)active.gwExerciseIndex=nextIndex;
    else delete active.gwExerciseIndex;
    window.saveData?.({render:false});
    window.renderActiveWorkout();
  }
  function navigateExercise(delta){
    const active=appData()?.activeWorkout;if(!active||!Array.isArray(active.exercises))return;
    const current=Number.isInteger(Number(active.gwExerciseIndex))?Number(active.gwExerciseIndex):0;
    let target=Math.max(0,Math.min(active.exercises.length-1,current+Number(delta||0)));
    if(target===current)return;
    active.gwExerciseIndex=target;
    window.saveData?.({render:false});window.renderActiveWorkout();
  }
  function currentOpenSet(exercise){return exercise?.sets?.findIndex(set=>!resolved(set))??-1;}
  function skipSet(exerciseIndex,setIndex){
    const set=appData()?.activeWorkout?.exercises?.[exerciseIndex]?.sets?.[setIndex];if(!set||resolved(set))return;
    set.done=false;set.skipped=true;set.skippedAt=new Date().toISOString();
    window.saveData?.({render:false});window.renderActiveWorkout();
  }
  function setSetState(exerciseIndex,setIndex,state){
    const ex=appData()?.activeWorkout?.exercises?.[exerciseIndex],set=ex?.sets?.[setIndex];
    if(!set)return;
    if(state==='complete'){
      const reps=document.getElementById(`gwReps-${exerciseIndex}-${setIndex}`),weight=document.getElementById(`gwWeight-${exerciseIndex}-${setIndex}`);
      if(reps)set.reps=reps.value;if(weight)set.weight=weight.value;
      set.done=true;set.skipped=false;set.skippedAt='';
      if(ex.sets.some(s=>!resolved(s))&&window.beginRestTimer)window.beginRestTimer(ex.rest||60,ex.name);
    }else if(state==='skip'){
      set.done=false;set.skipped=true;set.skippedAt=new Date().toISOString();
    }else{
      set.done=false;set.skipped=false;set.skippedAt='';ex.loadRating='';
    }
    window.saveData?.({render:false});window.renderActiveWorkout();
  }
  function nextSet(exerciseIndex){
    const exercise=appData()?.activeWorkout?.exercises?.[exerciseIndex];if(!exercise)return;
    const setIndex=currentOpenSet(exercise);
    if(setIndex>=0)skipSet(exerciseIndex,setIndex);
  }

  window.gwMaterializeWorkout=materializeWorkout;
  window.gwUpdateSetValue=updateSetValue;
  window.gwRateExercise=rateExercise;
  window.gwSkipSet=skipSet;
  window.gwNextSet=nextSet;
  window.gwNavigateExercise=navigateExercise;
  window.gwSetSetState=setSetState;
  window.gwCompleteSet=function(exerciseIndex,setIndex){
    const active=appData()?.activeWorkout,exercise=active?.exercises?.[exerciseIndex],set=exercise?.sets?.[setIndex];
    if(!set||resolved(set))return;
    const reps=document.getElementById(`gwReps-${exerciseIndex}-${setIndex}`),weight=document.getElementById(`gwWeight-${exerciseIndex}-${setIndex}`);
    if(reps)set.reps=reps.value;if(weight)set.weight=weight.value;
    set.done=true;set.skipped=false;window.saveData?.({render:false});
    const more=exercise.sets.some(s=>!resolved(s));
    if(more&&window.beginRestTimer)window.beginRestTimer(exercise.rest||60,exercise.name);
    window.renderActiveWorkout();
  };
  window.gwUndoSet=function(exerciseIndex,setIndex){
    const ex=appData()?.activeWorkout?.exercises?.[exerciseIndex],set=ex?.sets?.[setIndex];if(!set)return;
    set.done=false;set.skipped=false;set.skippedAt='';ex.loadRating='';window.saveData?.({render:false});window.renderActiveWorkout();
  };

  window.gwAddSet=function(exerciseIndex){
    const ex=appData()?.activeWorkout?.exercises?.[exerciseIndex];if(!ex)return;
    const prior=ex.sets?.[ex.sets.length-1]||{};
    ex.sets.push({set:ex.sets.length+1,plannedWeight:prior.plannedWeight??prior.weight??'',plannedReps:prior.plannedReps??prior.reps??'',weight:prior.weight??prior.plannedWeight??'',reps:prior.reps??prior.plannedReps??'',rpe:'',done:false,skipped:false});
    window.saveData?.({render:false});window.renderActiveWorkout();
  };
  window.gwUpdateRpe=function(exerciseIndex,setIndex,value){updateSetValue(exerciseIndex,setIndex,'rpe',value);};

  function anatomyPair(){
    return `<div class="gw-anatomy" aria-hidden="true"><svg viewBox="0 0 72 78"><g class="body"><circle cx="20" cy="9" r="5"/><path d="M14 17c-3 7-4 15-3 24l3 13-2 20m16-57c3 7 4 15 3 24l-3 13 2 20M15 20h10l3 23-4 12h-8l-4-12z"/><path d="M14 24 6 45m20-21 8 21"/></g><g class="hot"><path d="M14 21h12l1 12c-4 3-10 3-14 0z"/></g><g class="body" transform="translate(36 0)"><circle cx="20" cy="9" r="5"/><path d="M14 17c-3 7-4 15-3 24l3 13-2 20m16-57c3 7 4 15 3 24l-3 13 2 20M15 20h10l3 23-4 12h-8l-4-12z"/><path d="M14 24 6 45m20-21 8 21"/></g><g class="hot" transform="translate(36 0)"><path d="M14 21h12l1 13c-4 3-10 3-14 0z"/></g></svg></div>`;
  }

  window.renderActiveWorkout=function(){
    const c=document.getElementById('activeExercises');if(!c)return;
    document.querySelector('#workoutModal .modal-box')?.classList.add('gw-execution-active','gw-commercial');
    const state=locateExercise();if(!state){renderGuard('No valid working sets found');return;}
    const completion=document.getElementById('workoutCompletionCard');
    const total=state.active.exercises.reduce((n,ex)=>n+(Array.isArray(ex.sets)?ex.sets.length:0),0);
    const handled=state.active.exercises.reduce((n,ex)=>n+(Array.isArray(ex.sets)?ex.sets.filter(resolved).length:0),0);
    if(state.done){c.innerHTML=`<div class="gw-done"><h3>Workout complete</h3><p>Review your session, add a note if needed, and finish.</p></div>`;completion?.classList.add('gw-show');window.updateWorkoutProgress?.();return;}
    completion?.classList.remove('gw-show');
    const {active,exercise,exerciseIndex}=state;
    const firstOpen=currentOpenSet(exercise),exerciseHandled=exercise.sets.filter(resolved).length,pct=total?Math.round(handled/total*100):0;
    const muscles=muscleProfile(exercise.name), primary=muscles[0]||'Primary muscles';
    const rows=exercise.sets.map((set,setIndex)=>{
      const current=setIndex===firstOpen,reps=set.reps??set.plannedReps??'',weight=set.weight??set.plannedWeight??exercise.recommendedWeight??'',rpe=set.rpe??'';
      const label=set.done?'DONE':set.skipped?'SKIPPED':'COMPLETE';
      const cls=set.done?'is-done':set.skipped?'is-skipped':'';
      const act=resolved(set)?`gwSetSetState(${exerciseIndex},${setIndex},'reset')`:`gwSetSetState(${exerciseIndex},${setIndex},'complete')`;
      return `<div class="gw-log-row ${current?'is-current':''} ${cls}">
        <strong class="gw-log-set">${setIndex+1}</strong>
        <input id="gwWeight-${exerciseIndex}-${setIndex}" inputmode="decimal" value="${esc(weight)}" placeholder="—" oninput="gwUpdateSetValue(${exerciseIndex},${setIndex},'weight',this.value)" aria-label="Weight for set ${setIndex+1}">
        <input id="gwReps-${exerciseIndex}-${setIndex}" value="${esc(reps)}" oninput="gwUpdateSetValue(${exerciseIndex},${setIndex},'reps',this.value)" aria-label="Reps for set ${setIndex+1}">
        <input class="gw-rpe" inputmode="decimal" value="${esc(rpe)}" placeholder="--" oninput="gwUpdateRpe(${exerciseIndex},${setIndex},this.value)" aria-label="RPE for set ${setIndex+1}">
        <button class="gw-status ${cls}" onclick="${act}" type="button">${label}${set.done?' <span>✓</span>':''}</button>
        <button class="gw-row-menu" type="button" aria-label="Set options" onclick="gwSetSetState(${exerciseIndex},${setIndex},'${set.skipped?'reset':'skip'}')">⋮</button>
      </div>`;
    }).join('');
    const upcoming=active.exercises[exerciseIndex+1]||null;
    const est=Number(active.duration||active.estimatedDuration||55)||55;
    const setLabel=firstOpen>=0?`Set ${firstOpen+1}`:'Exercise complete';
    c.innerHTML=`<section class="gw-commercial-shell">
      <header class="gw-commercial-top"><button class="gw-back" onclick="closeWorkout?.()" aria-label="Save and exit">‹</button><div><small>STRENGTH TRAINING</small><h1>${esc(active.name||active.title||'Today’s Workout')}</h1></div><div class="gw-est"><b>${est}:00</b><small>EST. TIME</small></div><button class="gw-overflow" onclick="document.querySelector('.gw-session-menu')?.classList.toggle('open')">•••</button><div class="gw-session-menu"><button onclick="closeWorkout?.()">Save & Exit</button><button class="danger" onclick="discardWorkout?.()">Discard Workout</button></div></header>
      <div class="gw-progress"><span style="width:${pct}%"></span></div>
      <section class="gw-exercise-hero"><div><small>EXERCISE ${exerciseIndex+1} OF ${active.exercises.length}</small><h2>${esc(exercise.name||'Current exercise')}</h2></div><button class="gw-guide" onclick="openExerciseGuide?.('${esc(exercise.name).replace(/'/g,"&#39;")}')">▣ <span>Exercise Guide</span></button></section>
      <section class="gw-target">${anatomyPair()}<div><b>Primary:</b> ${esc(primary)}<small>${muscles.slice(1).map(esc).join(' · ')}</small></div></section>
      ${exercise.cue?`<p class="gw-cue">${esc(exercise.cue)}</p>`:''}
      <div class="gw-log-head"><span>SET</span><span>WEIGHT (LB)</span><span>REPS</span><span>RPE</span><span>STATUS</span><span></span></div>
      <div class="gw-log-list">${rows}</div>
      <button class="gw-add-set" type="button" onclick="gwAddSet(${exerciseIndex})"><span>＋</span> ADD SET</button>
      <section class="gw-feel ${exerciseHandled===exercise.sets.length?'is-ready':''}"><div class="gw-feel-title">HOW DID THE WEIGHT FEEL? <span>ⓘ</span></div><div class="gw-feel-buttons"><button onclick="gwRateExercise(${exerciseIndex},'too_hard')">⌄ TOO HARD</button><button class="right" onclick="gwRateExercise(${exerciseIndex},'just_right')">✓ JUST RIGHT</button><button onclick="gwRateExercise(${exerciseIndex},'too_light')">⌃ TOO LIGHT</button></div></section>
      <div class="gw-action-spacer"></div>
      <footer class="gw-action-dock">
        <div class="gw-action-row"><button class="gw-skip-current" onclick="gwNextSet(${exerciseIndex})"><b>SKIP SET</b><small>Mark as skipped</small></button><button class="gw-next-current" onclick="gwNextSet(${exerciseIndex})"><b>NEXT SET ›</b><small>Uncompleted set will be marked skipped</small></button><div class="gw-rest-slot"><div class="gw-rest-fallback"><b>01:15</b><small>REST TIMER</small></div></div></div>
        <div class="gw-next-preview"><button ${exerciseIndex===0?'disabled':''} onclick="gwNavigateExercise(-1)">‹</button><div><small>NEXT EXERCISE</small><strong>${esc(upcoming?.name||'Session Review')}</strong><span>${upcoming?`${upcoming.sets?.length||countFromPrescription(upcoming)} sets`:'Finish workout'}</span></div><button ${!upcoming?'disabled':''} onclick="gwNavigateExercise(1)">›</button></div>
      </footer>
    </section>`;
    const restPanel=document.getElementById('restPanel'),restSlot=c.querySelector('.gw-rest-slot');if(restPanel&&restSlot){restSlot.innerHTML='';restSlot.appendChild(restPanel);}
    window.setText?.('currentExerciseOut',exercise.name||'Current exercise');window.updateTimerDisplay?.();window.updateWorkoutProgress?.();
  };
})();
