(function(){
  'use strict';
  const esc = value => typeof escapeHtml === 'function' ? escapeHtml(value ?? '') : String(value ?? '').replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const originalUpdateSet = window.updateSet;

  window.bellEditCurrentSet = function(exerciseIndex,setIndex){
    const box=document.getElementById(`bellSetEdit-${exerciseIndex}-${setIndex}`);
    if(box) box.open=!box.open;
  };
  window.bellCompleteCurrentSet = function(exerciseIndex,setIndex){
    const active=data.activeWorkout;
    const exercise=active?.exercises?.[exerciseIndex];
    const set=exercise?.sets?.[setIndex];
    if(!set)return;
    set.done=true;
    if(typeof saveData==='function')saveData({render:false});
    const nextSame=exercise.sets.find(s=>!s.done);
    if(nextSame){
      beginRestTimer(exercise.rest||60,exercise.name);
    }else{
      const nextExercise=active.exercises.slice(exerciseIndex+1).find(ex=>ex.sets?.some(s=>!s.done));
      if(nextExercise)beginRestTimer(Math.min(90,exercise.rest||60),nextExercise.name);
      else skipRestTimer();
    }
    renderActiveWorkout();
    if(typeof updateWorkoutProgress==='function')updateWorkoutProgress();
  };
  window.updateSet = function(exerciseIndex,setIndex,field,value){
    originalUpdateSet(exerciseIndex,setIndex,field,value);
    if(field==='done')renderActiveWorkout();
  };

  window.renderActiveWorkout = function(){
    const active=data.activeWorkout;if(!active)return;
    const container=document.getElementById('activeExercises');if(!container)return;
    const isEngine=Boolean(active.cardioType)||String(active.name||'').startsWith('R-');
    const totalSets=active.exercises.reduce((n,e)=>n+(e.sets?.length||0),0);
    const doneSets=active.exercises.reduce((n,e)=>n+(e.sets?.filter(s=>s.done).length||0),0);
    let currentExerciseIndex=active.exercises.findIndex(ex=>ex.sets?.some(s=>!s.done));
    if(currentExerciseIndex<0)currentExerciseIndex=Math.max(0,active.exercises.length-1);
    const exercise=active.exercises[currentExerciseIndex];
    const currentSetIndex=exercise?.sets?.findIndex(s=>!s.done) ?? -1;
    const currentSet=currentSetIndex>=0?exercise.sets[currentSetIndex]:null;
    const complete=doneSets>=totalSets&&totalSets>0;
    const nextExercise=active.exercises.slice(currentExerciseIndex+1).find(ex=>ex.sets?.some(s=>!s.done));
    const queue=active.exercises.map((ex,index)=>{
      const exDone=ex.sets?.every(s=>s.done);
      const exCurrent=index===currentExerciseIndex&&!complete;
      return `<div class="bell-queue-item ${exDone?'done':''} ${exCurrent?'current':''}"><span>${exDone?'✓':index+1}</span><strong>${esc(ex.name)}</strong><small>${exDone?'Complete':exCurrent?'Now':'Next'}</small></div>`;
    }).join('');
    const completedSets=(exercise?.sets||[]).filter(s=>s.done).map(s=>`<span>Set ${s.set}: ${esc(s.weight||'—')} × ${esc(s.reps||'—')}</span>`).join('');
    const target=currentSet?`${currentSet.weight||exercise.recommendationDisplay||'As prescribed'}${isEngine?'':' lb'} × ${currentSet.reps||exercise.plannedReps||'—'}`:'';

    container.innerHTML=`
      <section class="bell-workout-queue" aria-label="Workout order">${queue}</section>
      ${complete?`
        <section class="bell-focus-card bell-session-complete">
          <span class="metric-label">Working Sets Complete</span>
          <h2>Nice work. Finish the session.</h2>
          <p>Give Bell a quick overall rating below. Detailed notes remain optional.</p>
          <button class="good" type="button" onclick="document.getElementById('workoutCompletionCard')?.scrollIntoView({behavior:'smooth'})">Finish Session</button>
        </section>`:`
        <section class="bell-focus-card">
          <div class="bell-focus-topline"><span class="metric-label">Exercise ${currentExerciseIndex+1} of ${active.exercises.length}</span><span>${doneSets}/${totalSets} sets</span></div>
          <div class="bell-focus-heading">
            <div><h2>${esc(exercise.name)}</h2><p>${esc(exercise.prescription||'')}</p></div>
            <div class="bell-focus-actions"><button type="button" onclick="openExerciseDetail('${String(exercise.name).replace(/'/g,"\\'")}')">Guide</button>${isEngine?'':`<button type="button" onclick="openExerciseSwap(${currentExerciseIndex})">Replace</button>`}</div>
          </div>
          ${exercise.cue?`<div class="bell-cue">${esc(exercise.cue)}</div>`:''}
          <div class="bell-current-set">
            <div><span>Current</span><strong>${isEngine?'Round':'Set'} ${currentSet.set} of ${exercise.sets.length}</strong></div>
            <div class="bell-set-target"><span>Target</span><strong>${esc(target)}</strong></div>
          </div>
          <button class="good bell-complete-set" type="button" onclick="bellCompleteCurrentSet(${currentExerciseIndex},${currentSetIndex})">Complete ${isEngine?'Round':'Set'} ${currentSet.set}</button>
          <details class="bell-adjust-result" id="bellSetEdit-${currentExerciseIndex}-${currentSetIndex}">
            <summary>Adjust result</summary>
            <div class="bell-adjust-grid">
              <label>${isEngine?'Target':'Weight'}<input inputmode="decimal" value="${esc(currentSet.weight)}" oninput="updateSet(${currentExerciseIndex},${currentSetIndex},'weight',this.value)"></label>
              <label>${isEngine?'Result':'Reps'}<input inputmode="text" value="${esc(currentSet.reps)}" oninput="updateSet(${currentExerciseIndex},${currentSetIndex},'reps',this.value)"></label>
            </div>
          </details>
          ${completedSets?`<div class="bell-completed-sets"><span class="metric-label">Completed</span><div>${completedSets}</div></div>`:''}
          <div class="bell-next-up"><span class="metric-label">Next Up</span><strong>${currentSetIndex+1<exercise.sets.length?`${exercise.name} — Set ${currentSetIndex+2}`:(nextExercise?nextExercise.name:'Finish session')}</strong></div>
        </section>`}
    `;
    if(typeof renderWarmupPanel==='function')renderWarmupPanel();
    setText('currentExerciseOut',complete?'All working sets complete':exercise.name);
    if(typeof updateTimerDisplay==='function')updateTimerDisplay();
  };

  const originalRenderStage=window.renderWorkoutStage;
  window.renderWorkoutStage=function(){
    originalRenderStage();
    const completion=document.getElementById('workoutCompletionCard');
    if(completion&&data.activeWorkout?.stage==='training')completion.classList.remove('hidden');
  };
})();
