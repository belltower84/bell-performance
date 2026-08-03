(function(){
  'use strict';

  function esc(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
  function appData(){try{if(typeof data!=='undefined'&&data)return data;}catch(_){}return window.data||null;}

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
        rpe:set?.rpe??'',rir:set?.rir??'',done:Boolean(set?.done)
      }));
      return ex;
    }
    const count=countFromPrescription(ex),reps=repsFromPrescription(ex),weight=ex.recommendedWeight??'';
    ex.sets=Array.from({length:count},(_,index)=>({set:index+1,plannedWeight:weight,plannedReps:reps,weight,reps,rpe:'',rir:'',done:false}));
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
    const exerciseIndex=active.exercises.findIndex(ex=>Array.isArray(ex.sets)&&ex.sets.some(set=>!set.done));
    if(exerciseIndex<0)return{active,done:true};
    const exercise=active.exercises[exerciseIndex];
    return{active,exercise,exerciseIndex};
  }

  function nextExerciseLabel(active,index){
    const next=active.exercises.slice(index+1).find(ex=>Array.isArray(ex.sets)&&ex.sets.some(set=>!set.done));
    return next?next.name:'Session review';
  }

  function setDisplayWeight(set,exercise){
    const value=set?.weight??set?.plannedWeight??exercise?.recommendedWeight??'';
    return String(value).trim()?`${esc(value)} lb`:'Choose load';
  }

  function renderGuard(message){
    const c=document.getElementById('activeExercises');
    if(!c)return;
    c.innerHTML=`<section class="gw-shell"><article class="gw-current gw-guard"><div class="gw-kicker">Workout setup</div><h2 class="gw-title">${esc(message||'Preparing your working sets')}</h2><p class="gw-sub">Bell could not read this exercise prescription yet. Return to the workout overview and try again.</p><button class="gw-complete" type="button" onclick="renderActiveWorkout()">Retry workout setup</button></article></section>`;
  }

  function updateSetValue(exerciseIndex,setIndex,field,value){
    const active=appData()?.activeWorkout;
    const set=active?.exercises?.[exerciseIndex]?.sets?.[setIndex];
    if(!set)return;
    set[field]=value;
    window.saveData?.({render:false});
  }

  window.gwMaterializeWorkout=materializeWorkout;
  window.gwToggle=function(id){document.getElementById(id)?.classList.toggle('open');};
  window.gwUpdateSetValue=updateSetValue;

  window.gwCompleteSet=function(exerciseIndex,setIndex){
    const active=appData()?.activeWorkout;
    const exercise=active?.exercises?.[exerciseIndex];
    const set=exercise?.sets?.[setIndex];
    if(!set||set.done)return;
    const reps=document.getElementById(`gwReps-${exerciseIndex}-${setIndex}`);
    const weight=document.getElementById(`gwWeight-${exerciseIndex}-${setIndex}`);
    if(reps)set.reps=reps.value;
    if(weight)set.weight=weight.value;
    set.done=true;
    window.saveData?.({render:false});
    const moreInExercise=exercise.sets.some(s=>!s.done);
    const moreInWorkout=active.exercises.some(ex=>ex.sets.some(s=>!s.done));
    if(moreInWorkout&&window.beginRestTimer){
      window.beginRestTimer(exercise.rest||60,moreInExercise?exercise.name:nextExerciseLabel(active,exerciseIndex));
    }
    window.renderActiveWorkout();
  };

  window.gwUndoSet=function(exerciseIndex,setIndex){
    const set=appData()?.activeWorkout?.exercises?.[exerciseIndex]?.sets?.[setIndex];
    if(!set)return;
    set.done=false;
    window.saveData?.({render:false});
    window.renderActiveWorkout();
  };

  window.renderActiveWorkout=function(){
    const c=document.getElementById('activeExercises');
    if(!c)return;
    const state=locateExercise();
    if(!state){renderGuard('No valid working sets found');return;}
    const completion=document.getElementById('workoutCompletionCard');
    const total=state.active.exercises.reduce((n,ex)=>n+(Array.isArray(ex.sets)?ex.sets.length:0),0);
    const done=state.active.exercises.reduce((n,ex)=>n+(Array.isArray(ex.sets)?ex.sets.filter(set=>set.done).length:0),0);

    if(state.done){
      c.innerHTML=`<div class="gw-done"><h3>Working sets complete</h3><p>Review the session and finish when ready.</p></div>`;
      completion?.classList.add('gw-show');
      window.updateWorkoutProgress?.();
      return;
    }

    completion?.classList.remove('gw-show');
    const {active,exercise,exerciseIndex}=state;
    const firstOpen=exercise.sets.findIndex(set=>!set.done);
    const exerciseDone=exercise.sets.filter(set=>set.done).length;
    const pct=total?Math.round(done/total*100):0;
    const rows=exercise.sets.map((set,setIndex)=>{
      const current=setIndex===firstOpen;
      const reps=set.reps??set.plannedReps??exercise.plannedReps??'';
      const weight=set.weight??set.plannedWeight??exercise.recommendedWeight??'';
      return `<div class="gw-set-row ${set.done?'is-done':''} ${current?'is-current':''}">
        <div class="gw-set-number"><span>Set</span><strong>${setIndex+1}</strong></div>
        <div class="gw-set-load"><span>Load</span><strong>${setDisplayWeight(set,exercise)}</strong></div>
        <label class="gw-reps-field"><span>Reps</span><input id="gwReps-${exerciseIndex}-${setIndex}" inputmode="numeric" value="${esc(reps)}" oninput="gwUpdateSetValue(${exerciseIndex},${setIndex},'reps',this.value)" aria-label="Reps for set ${setIndex+1}"></label>
        <button class="gw-set-action ${set.done?'is-done':''}" type="button" onclick="${set.done?`gwUndoSet(${exerciseIndex},${setIndex})`:`gwCompleteSet(${exerciseIndex},${setIndex})`}">${set.done?'✓ Done':'Complete'}</button>
        <button class="gw-load-toggle" type="button" onclick="gwToggle('gwLoad-${exerciseIndex}-${setIndex}')">Edit load</button>
        <div class="gw-load-edit" id="gwLoad-${exerciseIndex}-${setIndex}"><label><span>Weight</span><input id="gwWeight-${exerciseIndex}-${setIndex}" inputmode="decimal" value="${esc(weight)}" oninput="gwUpdateSetValue(${exerciseIndex},${setIndex},'weight',this.value)"></label></div>
      </div>`;
    }).join('');

    c.innerHTML=`<section class="gw-shell">
      <div class="gw-progress"><span style="width:${pct}%"></span></div>
      <div class="gw-topline"><span><strong>Exercise ${exerciseIndex+1}</strong> of ${active.exercises.length}</span><span>${done}/${total} sets</span></div>
      <article class="gw-current">
        <div class="gw-exercise-heading"><div><div class="gw-kicker">Current exercise</div><h2 class="gw-title">${esc(exercise.name||'Current exercise')}</h2></div><div class="gw-exercise-count">${exerciseDone}/${exercise.sets.length} complete</div></div>
        ${exercise.cue?`<div class="gw-sub">${esc(exercise.cue)}</div>`:''}
        <div class="gw-set-list">${rows}</div>
        <div class="gw-next">Next exercise: <b>${esc(nextExerciseLabel(active,exerciseIndex))}</b></div>
        <button class="gw-more" type="button" onclick="gwToggle('gwTools')">More options</button>
        <div class="gw-tools" id="gwTools"><button type="button" onclick="openExerciseGuide?.('${esc(exercise.name).replace(/'/g,'&#39;')}')">Exercise guide</button><button type="button" onclick="openExerciseReplacement?.(${exerciseIndex})">Replace exercise</button><button type="button" onclick="closeWorkout?.()">Save & exit</button></div>
      </article>
    </section>`;
    window.setText?.('currentExerciseOut',exercise.name||'Current exercise');
    window.updateTimerDisplay?.();
    window.updateWorkoutProgress?.();
  };
})();
