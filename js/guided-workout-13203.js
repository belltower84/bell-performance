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

  function anatomyArt(muscles){
    const joined=(muscles||[]).join(' ').toLowerCase();
    const chest=/chest|front delt|triceps/.test(joined), back=/lat|back|biceps/.test(joined);
    const legs=/quad|glute|hamstring|calf/.test(joined), core=/core|ab/.test(joined);
    const hot=(key)=>({chest,back,legs,core}[key]?' hot':'');
    return `<div class="gw-anatomy-pro" aria-label="Target muscles: ${esc((muscles||[]).join(', '))}">
      <svg viewBox="0 0 168 112" role="img" aria-hidden="true">
        <defs><linearGradient id="gwGold" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#ffd44a"/><stop offset="1" stop-color="#b87500"/></linearGradient></defs>
        <g transform="translate(8 4)">
          <circle class="skin" cx="34" cy="12" r="8"/><path class="outline" d="M23 26c-5 5-8 15-8 27l4 20-5 30m31-77c5 5 8 15 8 27l-4 20 5 30M25 26h18l5 25-6 24H26l-6-24zM22 31 6 57m40-26 16 26"/>
          <path class="muscle${hot('chest')}" d="M24 31c5-4 14-4 19 0l-1 13c-5 4-12 4-17 0z"/>
          <path class="muscle${hot('core')}" d="M27 47h13l1 21H26z"/>
          <path class="muscle${hot('legs')}" d="M25 75h8l-2 28h-9zm10 0h8l3 28h-9z"/>
          <path class="muscle${hot('back')}" d="M17 34 8 57l7 3 10-20zm34 0 9 23-7 3-10-20z"/>
        </g>
        <g transform="translate(88 4)">
          <circle class="skin" cx="34" cy="12" r="8"/><path class="outline" d="M23 26c-5 5-8 15-8 27l4 20-5 30m31-77c5 5 8 15 8 27l-4 20 5 30M25 26h18l5 25-6 24H26l-6-24zM22 31 6 57m40-26 16 26"/>
          <path class="muscle${hot('back')}" d="M24 31c5-4 14-4 19 0l-1 18-8 8-8-8z"/>
          <path class="muscle${hot('core')}" d="M27 52h13l1 16H26z"/>
          <path class="muscle${hot('legs')}" d="M25 75h8l-2 28h-9zm10 0h8l3 28h-9z"/>
          <path class="muscle${hot('chest')}" d="M17 34 8 57l7 3 10-20zm34 0 9 23-7 3-10-20z"/>
        </g>
      </svg><span>FRONT</span><span>BACK</span></div>`;
  }

  window.gwOpenGuide=function(name){
    try{window.closeWorkout?.();}catch(_){document.getElementById('workoutModal')?.classList.add('hidden');}
    setTimeout(()=>{if(typeof window.openExerciseDetail==='function')window.openExerciseDetail(name);else alert(`${name} guide is not available yet.`);},0);
  };
  window.gwSaveExit=function(){window.saveData?.({render:false});window.closeWorkout?.();};
  window.gwDiscard=function(){window.discardWorkout?.();};
  window.gwToggleSessionMenu=function(){document.querySelector('.gw-session-menu')?.classList.toggle('open');};
  window.gwCloseSessionMenu=function(){document.querySelector('.gw-session-menu')?.classList.remove('open');};

  let gwDockObserver=null;
  function syncWorkoutDockHeight(){
    const modal=document.querySelector('#workoutModal .modal-box.gw-stable-13203');
    const dock=modal?.querySelector('.gw-action-dock');
    if(!dock)return;
    const measured=Math.ceil(dock.getBoundingClientRect().height);
    if(!measured)return;
    modal.style.setProperty('--gw-action-dock-height',`${measured}px`);
    document.documentElement.style.setProperty('--gw-action-dock-height',`${measured}px`);
  }
  function observeWorkoutDock(){
    const dock=document.querySelector('#workoutModal .gw-stable-13203 .gw-action-dock');
    if(!dock)return;
    try{gwDockObserver?.disconnect();}catch(_){}
    if('ResizeObserver' in window){
      gwDockObserver=new ResizeObserver(()=>requestAnimationFrame(syncWorkoutDockHeight));
      gwDockObserver.observe(dock);
    }
    requestAnimationFrame(()=>{syncWorkoutDockHeight();setTimeout(syncWorkoutDockHeight,80);});
  }
  window.gwSyncWorkoutDockHeight=syncWorkoutDockHeight;
  window.addEventListener('resize',()=>requestAnimationFrame(syncWorkoutDockHeight),{passive:true});
  window.addEventListener('orientationchange',()=>setTimeout(syncWorkoutDockHeight,120),{passive:true});

  window.renderActiveWorkout=function(){
    const c=document.getElementById('activeExercises');if(!c)return;
    document.querySelector('#workoutModal .modal-box')?.classList.add('gw-execution-active','gw-commercial','gw-stable-13203');
    const state=locateExercise();if(!state){renderGuard('No valid working sets found');return;}
    const completion=document.getElementById('workoutCompletionCard');
    const total=state.active.exercises.reduce((n,ex)=>n+(Array.isArray(ex.sets)?ex.sets.length:0),0);
    const handled=state.active.exercises.reduce((n,ex)=>n+(Array.isArray(ex.sets)?ex.sets.filter(resolved).length:0),0);
    if(state.done){c.innerHTML=`<div class="gw-done"><h3>Workout complete</h3><p>Review your session, add a note if needed, and finish.</p></div>`;completion?.classList.add('gw-show');window.updateWorkoutProgress?.();return;}
    completion?.classList.remove('gw-show');
    const {active,exercise,exerciseIndex}=state;
    const firstOpen=currentOpenSet(exercise),exerciseHandled=exercise.sets.filter(resolved).length,pct=total?Math.round(handled/total*100):0;
    const muscles=muscleProfile(exercise.name),primary=muscles[0]||'Primary muscles';
    const rows=exercise.sets.map((set,setIndex)=>{
      const current=setIndex===firstOpen,reps=set.reps??set.plannedReps??'',weight=set.weight??set.plannedWeight??exercise.recommendedWeight??'',rpe=set.rpe??'';
      const label=set.done?'DONE':set.skipped?'SKIPPED':'COMPLETE';
      const cls=set.done?'is-done':set.skipped?'is-skipped':'';
      const action=resolved(set)?`gwSetSetState(${exerciseIndex},${setIndex},'reset')`:`gwSetSetState(${exerciseIndex},${setIndex},'complete')`;
      return `<div class="gw-log-row ${current?'is-current':''} ${cls}">
        <strong class="gw-log-set">${setIndex+1}</strong>
        <input id="gwWeight-${exerciseIndex}-${setIndex}" inputmode="decimal" value="${esc(weight)}" placeholder="—" oninput="gwUpdateSetValue(${exerciseIndex},${setIndex},'weight',this.value)" aria-label="Weight for set ${setIndex+1}">
        <input id="gwReps-${exerciseIndex}-${setIndex}" value="${esc(reps)}" oninput="gwUpdateSetValue(${exerciseIndex},${setIndex},'reps',this.value)" aria-label="Reps for set ${setIndex+1}">
        <input class="gw-rpe" inputmode="decimal" value="${esc(rpe)}" placeholder="--" oninput="gwUpdateRpe(${exerciseIndex},${setIndex},this.value)" aria-label="RPE for set ${setIndex+1}">
        <button class="gw-status ${cls}" onclick="${action}" type="button">${label}${set.done?' <span>✓</span>':''}</button>
        <button class="gw-row-skip" type="button" onclick="gwSetSetState(${exerciseIndex},${setIndex},'${set.skipped?'reset':'skip'}')">${set.skipped?'UNDO':'SKIP'}</button>
      </div>`;
    }).join('');
    const upcoming=active.exercises[exerciseIndex+1]||null,previous=exerciseIndex>0?active.exercises[exerciseIndex-1]:null;
    const est=Number(active.duration||active.estimatedDuration||55)||55;
    const feelReady=exerciseHandled===exercise.sets.length;
    c.innerHTML=`<section class="gw-commercial-shell" onclick="if(event.target.closest('.gw-session-menu')===null&&!event.target.closest('.gw-menu-trigger'))gwCloseSessionMenu()">
      <header class="gw-commercial-top">
        <button class="gw-back" onclick="gwSaveExit()" aria-label="Save and exit">‹</button>
        <div class="gw-workout-name"><small>STRENGTH TRAINING</small><h1>${esc(active.name||active.title||'Today’s Workout')}</h1></div>
        <div class="gw-est"><b>${est}:00</b><small>EST. TIME</small></div>
        <div class="gw-session-actions"><button onclick="gwSaveExit()">Save & Exit</button><button class="danger" onclick="gwDiscard()">Discard</button></div>
        <button class="gw-menu-trigger" onclick="gwToggleSessionMenu()" aria-label="Session menu">•••</button>
        <div class="gw-session-menu"><button onclick="gwSaveExit()">Save & Exit</button><button class="danger" onclick="gwDiscard()">Discard Workout</button></div>
      </header>
      <div class="gw-progress"><span style="width:${pct}%"></span></div>
      <section class="gw-exercise-hero"><div><small>EXERCISE ${exerciseIndex+1} OF ${active.exercises.length}</small><h2>${esc(exercise.name||'Current exercise')}</h2></div><button class="gw-guide" onclick="gwOpenGuide('${esc(exercise.name).replace(/'/g,"&#39;")}')"><span class="gw-guide-icon">▣</span><span>Exercise Guide</span></button></section>
      <section class="gw-target">${anatomyArt(muscles)}<div><b>Primary:</b> ${esc(primary)}<small>${muscles.slice(1).map(esc).join(' · ')}</small></div></section>
      ${exercise.cue?`<p class="gw-cue">${esc(exercise.cue)}</p>`:''}
      <div class="gw-log-wrap"><div class="gw-log-head"><span>SET</span><span>WEIGHT (LB)</span><span>REPS</span><span>RPE</span><span>STATUS</span><span></span></div><div class="gw-log-list">${rows}</div></div>
      <button class="gw-add-set" type="button" onclick="gwAddSet(${exerciseIndex})"><span>＋</span> ADD SET</button>
      ${feelReady?`<section class="gw-feel is-ready gw-feel-reveal" data-auto-focus="true"><div class="gw-feel-title">HOW DID THE WEIGHT FEEL? <span>ⓘ</span></div><p class="gw-feel-help">Rate this exercise to continue to the next one.</p><div class="gw-feel-buttons"><button onclick="gwRateExercise(${exerciseIndex},'too_hard')">⌄ TOO HARD</button><button class="right" onclick="gwRateExercise(${exerciseIndex},'just_right')">✓ JUST RIGHT</button><button onclick="gwRateExercise(${exerciseIndex},'too_light')">⌃ TOO LIGHT</button></div></section>`:''}
      <div class="gw-action-spacer"></div>
      <footer class="gw-action-dock ${feelReady?'is-awaiting-rating':''}">
        ${feelReady?`<div class="gw-rating-required"><b>RATE EXERCISE TO CONTINUE</b><small>Your feedback helps Bell adjust the next prescription.</small></div>`:`<div class="gw-action-row"><button class="gw-skip-current" onclick="gwNextSet(${exerciseIndex})"><b>SKIP SET</b><small>Mark as skipped</small></button><button class="gw-next-current" onclick="gwNextSet(${exerciseIndex})"><b>NEXT SET ›</b><small>Uncompleted set will be marked skipped</small></button><div class="gw-rest-slot"><div class="gw-rest-fallback"><b>01:15</b><small>REST TIMER</small></div></div></div>`}
        <div class="gw-next-preview"><button ${!previous?'disabled':''} onclick="gwNavigateExercise(-1)">‹</button><div><small>${previous?'PREVIOUS / NEXT':'NEXT EXERCISE'}</small><strong>${esc(upcoming?.name||'Session Review')}</strong><span>${upcoming?`${upcoming.sets?.length||countFromPrescription(upcoming)} sets`:'Finish workout'}</span></div><button ${!upcoming?'disabled':''} onclick="gwNavigateExercise(1)">›</button></div>
      </footer>
    </section>`;
    const restPanel=document.getElementById('restPanel'),restSlot=c.querySelector('.gw-rest-slot');if(restPanel&&restSlot){restSlot.innerHTML='';restSlot.appendChild(restPanel);}
    observeWorkoutDock();
    if(feelReady){
      requestAnimationFrame(()=>{
        const feedback=c.querySelector('[data-auto-focus="true"]');
        feedback?.scrollIntoView({behavior:'smooth',block:'center'});
        feedback?.classList.add('is-visible');
      });
    }
    window.setText?.('currentExerciseOut',exercise.name||'Current exercise');window.updateTimerDisplay?.();window.updateWorkoutProgress?.();
  };
})();
