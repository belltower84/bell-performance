(function(){
  'use strict';
  const VERSION='13.20.7';

  function esc(value){
    return String(value??'').replace(/[&<>'"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
  }

  function workout(){ return window.data?.activeWorkout || null; }

  function displayName(item){
    if(typeof window.bellWorkoutDisplayLabel==='function') return window.bellWorkoutDisplayLabel(item);
    return item?.label || item?.name || 'Workout';
  }

  function previewRows(items){
    return items.map((ex,index)=>{
      const prescription=ex.prescription || [ex.sets,ex.reps].filter(Boolean).join(' × ') || 'As prescribed';
      const block=ex.block ? `<span class="bp-preview-block">${esc(ex.block)}</span>` : '';
      return `<article class="bp-preview-exercise">
        <span class="bp-preview-index">${index+1}</span>
        <div><strong>${esc(ex.name)}</strong><small>${esc(prescription)}</small>${block}</div>
      </article>`;
    }).join('');
  }

  function generatedWarmups(active){
    const out=[];
    (active?.exercises||[]).forEach((ex,exerciseIndex)=>{
      if(typeof window.warmupSetsFor!=='function') return;
      const sets=window.warmupSetsFor(ex)||[];
      sets.forEach((set,setIndex)=>out.push({
        name:`${ex.name} — ${set.label}`,
        prescription:`${set.weight} lb × ${set.reps}`,
        block:'Generated Warm-up',
        exerciseIndex,
        setIndex
      }));
    });
    return out;
  }

  window.previewActiveWorkout=function(){
    const active=workout();
    if(!active) return;
    const modal=document.getElementById('workoutPreviewModal');
    const content=document.getElementById('workoutPreviewContent');
    if(!modal||!content) return;

    const exercises=(active.exercises||[]).filter(ex=>!/^warm/i.test(String(ex.block||'')));
    const warmups=generatedWarmups(active);
    const grouped=new Map();
    exercises.forEach(ex=>{
      const label=String(ex.block||'Working Sets');
      if(!grouped.has(label)) grouped.set(label,[]);
      grouped.get(label).push(ex);
    });

    const sections=[];
    if(warmups.length){
      sections.push(`<section class="bp-preview-section"><div class="bp-preview-heading"><span>Warm-up</span><small>${warmups.length} ramp sets</small></div>${previewRows(warmups)}</section>`);
    }
    grouped.forEach((items,label)=>{
      sections.push(`<section class="bp-preview-section"><div class="bp-preview-heading"><span>${esc(label)}</span><small>${items.length} exercise${items.length===1?'':'s'}</small></div>${previewRows(items)}</section>`);
    });

    const title=document.getElementById('workoutPreviewTitle');
    const meta=document.getElementById('workoutPreviewMeta');
    if(title) title.textContent=displayName(active);
    if(meta) meta.textContent=`${active.duration||30} minutes · ${exercises.length} exercises`;
    content.innerHTML=sections.join('') || '<p class="hint">No exercises are available for this session.</p>';
    const begin=document.getElementById('previewBeginButton');
    if(begin){
      begin.textContent='Start Session';
      begin.onclick=()=>{ window.closeWorkoutPreview?.(); window.beginWorkoutFlow?.(); };
    }
    modal.classList.remove('hidden');
    modal.setAttribute('data-preview-release',VERSION);
  };

  function warmupItems(active){
    const items=[];
    (active?.exercises||[]).forEach((ex,exerciseIndex)=>{
      if(typeof window.warmupSetsFor!=='function') return;
      const sets=window.warmupSetsFor(ex)||[];
      sets.forEach((set,setIndex)=>items.push({
        key:`${exerciseIndex}:${setIndex}`,
        exercise:ex.name,
        label:set.label,
        weight:set.weight,
        reps:set.reps
      }));
    });
    return items;
  }

  window.toggleWorkoutWarmupItem=function(key){
    const active=workout();
    if(!active) return;
    active.warmupChecks=active.warmupChecks&&typeof active.warmupChecks==='object'?active.warmupChecks:{};
    active.warmupChecks[key]=!active.warmupChecks[key];
    if(typeof window.saveData==='function') window.saveData({render:false});
    window.renderWarmupPanel?.();
  };

  window.renderWarmupPanel=function(){
    const panel=document.getElementById('warmupPanel');
    const active=workout();
    if(!panel||!active) return;
    const items=warmupItems(active);
    active.warmupChecks=active.warmupChecks&&typeof active.warmupChecks==='object'?active.warmupChecks:{};

    if(!items.length){
      panel.classList.remove('hidden');
      panel.innerHTML=`<div class="bp-warmup-shell"><div class="bp-warmup-header"><div><span class="metric-label">Warm-up</span><h2>Prepare to train</h2><p>No loaded ramp sets are required for this session. Complete your normal movement preparation, then begin the working sets.</p></div></div></div>`;
      return;
    }

    const completed=items.filter(item=>active.warmupChecks[item.key]).length;
    const percent=Math.round((completed/items.length)*100);
    panel.classList.remove('hidden');
    panel.innerHTML=`<div class="bp-warmup-shell">
      <header class="bp-warmup-header">
        <div><span class="metric-label">Workout Warm-up</span><h2>Prepare for the working sets</h2><p>Check off each ramp set as you complete it. Adjust the load when needed.</p></div>
        <div class="bp-warmup-count"><strong>${completed}/${items.length}</strong><span>complete</span></div>
      </header>
      <div class="bp-warmup-progress"><span style="width:${percent}%"></span></div>
      <div class="bp-warmup-list">
        ${items.map((item,index)=>{
          const done=Boolean(active.warmupChecks[item.key]);
          return `<article class="bp-warmup-item ${done?'is-complete':''}">
            <button type="button" class="bp-warmup-check" onclick="toggleWorkoutWarmupItem('${item.key}')" aria-pressed="${done}">${done?'✓':index+1}</button>
            <div class="bp-warmup-copy"><strong>${esc(item.exercise)}</strong><span>${esc(item.label)}</span></div>
            <div class="bp-warmup-prescription"><strong>${esc(item.weight)} lb</strong><span>× ${esc(item.reps)} reps</span></div>
          </article>`;
        }).join('')}
      </div>
    </div>`;
  };

  function relabel(){
    const button=document.querySelector('#workoutBriefActions button.secondary');
    if(button) button.textContent='Preview Exercises';
  }

  document.addEventListener('click',event=>{
    if(event.target.closest('#workoutModal')) setTimeout(relabel,0);
  });
  window.addEventListener('load',relabel);
  requestAnimationFrame(relabel);
})();
