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
    const exerciseIndex=active.exercises.findIndex(ex=>Array.isArray(ex.sets)&&ex.sets.some(set=>!resolved(set)));
    if(exerciseIndex>=0){
      const previousPending=active.exercises.slice(0,exerciseIndex).findIndex(ex=>Array.isArray(ex.sets)&&ex.sets.length&&ex.sets.every(resolved)&&!ex.loadRating);
      if(previousPending>=0)return{active,exercise:active.exercises[previousPending],exerciseIndex:previousPending,rating:true};
      return{active,exercise:active.exercises[exerciseIndex],exerciseIndex,rating:false};
    }
    const unrated=active.exercises.findIndex(ex=>Array.isArray(ex.sets)&&ex.sets.length&&ex.sets.every(resolved)&&!ex.loadRating);
    if(unrated>=0)return{active,exercise:active.exercises[unrated],exerciseIndex:unrated,rating:true};
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
    const exercise=appData()?.activeWorkout?.exercises?.[exerciseIndex]; if(!exercise)return;
    exercise.loadRating=rating;
    exercise.loadRatingAt=new Date().toISOString();
    window.saveData?.({render:false});
    window.renderActiveWorkout();
  }
  function currentOpenSet(exercise){return exercise?.sets?.findIndex(set=>!resolved(set))??-1;}
  function skipSet(exerciseIndex,setIndex){
    const set=appData()?.activeWorkout?.exercises?.[exerciseIndex]?.sets?.[setIndex];if(!set||resolved(set))return;
    set.done=false;set.skipped=true;set.skippedAt=new Date().toISOString();
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

  window.renderActiveWorkout=function(){
    const c=document.getElementById('activeExercises');if(!c)return;
    document.querySelector('#workoutModal .modal-box')?.classList.add('gw-execution-active');
    const state=locateExercise();if(!state){renderGuard('No valid working sets found');return;}
    const completion=document.getElementById('workoutCompletionCard');
    const total=state.active.exercises.reduce((n,ex)=>n+(Array.isArray(ex.sets)?ex.sets.length:0),0);
    const handled=state.active.exercises.reduce((n,ex)=>n+(Array.isArray(ex.sets)?ex.sets.filter(resolved).length:0),0);
    if(state.done){
      c.innerHTML=`<div class="gw-done"><h3>Working sets complete</h3><p>Review the session and finish when ready.</p></div>`;
      completion?.classList.add('gw-show');window.updateWorkoutProgress?.();return;
    }
    completion?.classList.remove('gw-show');
    const {active,exercise,exerciseIndex}=state;
    const firstOpen=currentOpenSet(exercise),exerciseHandled=exercise.sets.filter(resolved).length,pct=total?Math.round(handled/total*100):0;
    const muscles=muscleProfile(exercise.name);
    const rows=exercise.sets.map((set,setIndex)=>{
      const current=setIndex===firstOpen,reps=set.reps??set.plannedReps??'',weight=set.weight??set.plannedWeight??exercise.recommendedWeight??'';
      const status=set.done?'Done':set.skipped?'Skipped':'Complete';
      const action=resolved(set)?`gwUndoSet(${exerciseIndex},${setIndex})`:`gwCompleteSet(${exerciseIndex},${setIndex})`;
      return `<div class="gw-set-row ${set.done?'is-done':''} ${set.skipped?'is-skipped':''} ${current?'is-current':''}">
        <div class="gw-set-number"><span>Set</span><strong>${setIndex+1}</strong></div>
        <label class="gw-entry"><span>Weight</span><input id="gwWeight-${exerciseIndex}-${setIndex}" inputmode="decimal" value="${esc(weight)}" placeholder="—" oninput="gwUpdateSetValue(${exerciseIndex},${setIndex},'weight',this.value)" aria-label="Weight for set ${setIndex+1}"></label>
        <label class="gw-entry"><span>Reps</span><input id="gwReps-${exerciseIndex}-${setIndex}" inputmode="numeric" value="${esc(reps)}" oninput="gwUpdateSetValue(${exerciseIndex},${setIndex},'reps',this.value)" aria-label="Reps for set ${setIndex+1}"></label>
        <button class="gw-set-action ${set.done?'is-done':''} ${set.skipped?'is-skipped':''}" type="button" onclick="${action}">${set.done?'✓ ':set.skipped?'↷ ':''}${status}</button>
      </div>`;
    }).join('');
    const upcoming=nextExercise(active,exerciseIndex);
    const openLabel=firstOpen>=0?`Set ${firstOpen+1}`:'Exercise feedback';
    c.innerHTML=`<section class="gw-shell">
      <div class="gw-progress"><span style="width:${pct}%"></span></div>
      <header class="gw-sticky-head"><div class="gw-kicker">Exercise ${exerciseIndex+1} of ${active.exercises.length}</div><div class="gw-sticky-row"><h2>${esc(exercise.name||'Current exercise')}</h2><span>${exerciseHandled}/${exercise.sets.length} handled</span></div><div class="gw-muscles">${muscleIcon()}<div>${muscles.map(m=>`<span>${esc(m)}</span>`).join('')}</div></div></header>
      <article class="gw-current">
        ${exercise.cue?`<div class="gw-sub">${esc(exercise.cue)}</div>`:''}
        <div class="gw-set-head" aria-hidden="true"><span>Set</span><span>Weight</span><span>Reps</span><span>Status</span></div>
        <div class="gw-set-list">${rows}</div>
        <details class="gw-more"><summary>More options</summary><div class="gw-tools"><button type="button" onclick="openExerciseGuide?.('${esc(exercise.name).replace(/'/g,'&#39;')}')">Exercise guide</button><button type="button" onclick="openExerciseReplacement?.(${exerciseIndex})">Replace exercise</button><button type="button" onclick="closeWorkout?.()">Save & exit</button></div></details>
      </article>
      <div class="gw-dock-spacer" aria-hidden="true"></div>
      <footer class="gw-bottom-dock">
        ${state.rating?`<div class="gw-rating-dock"><div class="gw-rating-copy"><small>Exercise feedback</small><strong>How did the weight feel?</strong></div><button onclick="gwRateExercise(${exerciseIndex},'too_hard')">Too hard</button><button class="is-primary" onclick="gwRateExercise(${exerciseIndex},'just_right')">Just right</button><button onclick="gwRateExercise(${exerciseIndex},'too_light')">Too light</button></div>`:`<div class="gw-dock-top"><div class="gw-next-lock ${upcoming?'':'is-finish'}"><span class="gw-lock-icon">${upcoming?'›':'✓'}</span><div><small>${upcoming?'Next exercise':'After this exercise'}</small><strong>${esc(upcoming?.name||'Session review')}</strong></div></div><div class="gw-dock-actions"><button class="gw-skip" type="button" onclick="gwSkipSet(${exerciseIndex},${firstOpen})">Skip</button><button class="gw-next-set" type="button" onclick="gwNextSet(${exerciseIndex})"><span>Next</span><small>Incomplete set is skipped</small></button></div><div class="gw-rest-slot"></div></div>`}
      </footer>
    </section>`;
    const restPanel=document.getElementById('restPanel'),restSlot=c.querySelector('.gw-rest-slot');if(restPanel&&restSlot)restSlot.appendChild(restPanel);
    window.setText?.('currentExerciseOut',exercise.name||'Current exercise');window.updateTimerDisplay?.();window.updateWorkoutProgress?.();
  };
})();
