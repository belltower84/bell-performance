(function(){
  'use strict';
  function esc(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
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
    const count=countFromPrescription(ex), reps=repsFromPrescription(ex), weight=ex.recommendedWeight??'';
    ex.sets=Array.from({length:count},(_,index)=>({set:index+1,plannedWeight:weight,plannedReps:reps,weight,reps,rpe:'',rir:'',done:false}));
    return ex;
  }
  function materializeWorkout(active){
    if(!active||!Array.isArray(active.exercises))return false;
    active.exercises=active.exercises.map(materializeExercise).filter(Boolean);
    return active.exercises.some(ex=>Array.isArray(ex.sets)&&ex.sets.length);
  }
  function locate(){
    const a=window.data?.activeWorkout;
    if(!a||!materializeWorkout(a))return null;
    for(let ei=0;ei<a.exercises.length;ei++){
      const sets=Array.isArray(a.exercises[ei].sets)?a.exercises[ei].sets:[];
      const si=sets.findIndex(s=>!s.done);
      if(si>=0)return{a,ei,si,ex:a.exercises[ei],set:sets[si]};
    }
    return{a,done:true};
  }
  function nextLabel(a,ei,si){const ex=a.exercises[ei];if(si+1<ex.sets.length)return `${ex.name} — Set ${si+2}`;const n=a.exercises.slice(ei+1).find(x=>x.sets.some(s=>!s.done));return n?`${n.name} — Set 1`:'Session review';}
  function renderGuard(message){
    const c=document.getElementById('activeExercises');
    if(!c)return;
    c.innerHTML=`<section class="gw-shell"><article class="gw-current gw-guard"><div class="gw-kicker">Workout setup</div><h2 class="gw-title">${esc(message||'Preparing your first working set')}</h2><p class="gw-sub">Bell could not read this exercise prescription yet. Return to the workout overview and try again.</p><button class="gw-complete" type="button" onclick="renderActiveWorkout()">Retry workout setup</button></article></section>`;
  }
  window.gwMaterializeWorkout=materializeWorkout;
  window.gwToggle=function(id){document.getElementById(id)?.classList.toggle('open');};
  window.gwCompleteCurrent=function(){
    const p=locate();if(!p||p.done)return;
    const w=document.getElementById('gwWeight'),r=document.getElementById('gwReps');
    if(w)p.set.weight=w.value;if(r)p.set.reps=r.value;p.set.done=true;
    window.saveData?.({render:false});
    if(window.beginRestTimer){const hasMore=p.a.exercises.some(x=>x.sets.some(s=>!s.done));if(hasMore)window.beginRestTimer(p.ex.rest||60,nextLabel(p.a,p.ei,p.si));}
    window.renderActiveWorkout();
  };
  window.renderActiveWorkout=function(){
    const c=document.getElementById('activeExercises');if(!c)return;
    const p=locate();
    if(!p){renderGuard('No valid working sets found');return;}
    const card=document.getElementById('workoutCompletionCard');
    const total=p.a.exercises.reduce((n,x)=>n+(Array.isArray(x.sets)?x.sets.length:0),0),done=p.a.exercises.reduce((n,x)=>n+(Array.isArray(x.sets)?x.sets.filter(s=>s.done).length:0),0);
    if(p.done){c.innerHTML=`<div class="gw-done"><h3>Working sets complete</h3><p>Review the session and finish when ready.</p></div>`;card?.classList.add('gw-show');window.updateWorkoutProgress?.();return;}
    card?.classList.remove('gw-show');
    const pct=total?Math.round(done/total*100):0;
    const weight=p.set.weight??p.set.plannedWeight??'';
    const reps=p.set.reps??p.set.plannedReps??p.ex.plannedReps??'target reps';
    const weightText=String(weight).trim()?`${esc(weight)} lb`:'Choose load';
    c.innerHTML=`<section class="gw-shell"><div class="gw-progress"><span style="width:${pct}%"></span></div><div class="gw-topline"><span><strong>Exercise ${p.ei+1}</strong> of ${p.a.exercises.length}</span><span>${done}/${total} sets</span></div><article class="gw-current"><div><div class="gw-kicker">Current exercise</div><h2 class="gw-title">${esc(p.ex.name||'Current exercise')}</h2><div class="gw-sub">Set ${p.si+1} of ${p.ex.sets.length}</div></div><div class="gw-prescription"><span>${weightText}</span><b>×</b><span>${esc(reps)}</span></div>${p.ex.cue?`<div class="gw-sub">${esc(p.ex.cue)}</div>`:''}<button class="gw-complete" type="button" onclick="gwCompleteCurrent()">Complete Set ${p.si+1}</button><div class="gw-next">Next: <b>${esc(nextLabel(p.a,p.ei,p.si))}</b></div><button class="gw-more" type="button" onclick="gwToggle('gwTools')">More options</button><div class="gw-tools" id="gwTools"><button type="button" onclick="gwToggle('gwAdjust')">Adjust result</button><button type="button" onclick="openExerciseGuide?.('${esc(p.ex.name).replace(/'/g,'&#39;')}')">Exercise guide</button><button type="button" onclick="openExerciseReplacement?.(${p.ei})">Replace exercise</button><button type="button" onclick="closeWorkout?.()">Save & exit</button></div><div class="gw-adjust" id="gwAdjust"><label>Weight<input id="gwWeight" inputmode="decimal" value="${esc(weight)}"></label><label>Reps<input id="gwReps" inputmode="text" value="${esc(reps)}"></label></div></article></section>`;
    window.setText?.('currentExerciseOut',p.ex.name||'Current exercise');window.updateTimerDisplay?.();window.updateWorkoutProgress?.();
  };
})();
