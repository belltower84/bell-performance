/* Bell Performance 13.20.9 — Preview and Warm-up Render Completion */
(function(){
  'use strict';

  const esc = (value) => String(value ?? '').replace(/[&<>'"]/g, (ch) => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));

  function getActive(){
    try { return data && data.activeWorkout ? data.activeWorkout : null; }
    catch (_) { return null; }
  }

  function rampSets(exercise){
    try {
      if (typeof warmupSetsFor === 'function') return warmupSetsFor(exercise) || [];
    } catch (_) {}
    const work = Number(exercise?.recommendedWeight);
    if (!Number.isFinite(work) || work < 45) return [];
    const round5 = (n) => Math.round(n / 5) * 5;
    const bar = /dumbbell/i.test(String(exercise?.name || '')) ? 0 : 45;
    return [
      {label:'Warm-up 1', weight:Math.max(bar, round5(work * .40)), reps:'8'},
      {label:'Warm-up 2', weight:Math.max(bar, round5(work * .60)), reps:'5'},
      {label:'Warm-up 3', weight:Math.max(bar, round5(work * .78)), reps:'3'}
    ].filter((set, index, all) => index === 0 || set.weight > all[index - 1].weight);
  }

  function workingExercises(active){
    return (active?.exercises || []).filter((exercise) => !/^warm/i.test(String(exercise?.block || '')));
  }

  function warmupItems(active){
    const items = [];
    workingExercises(active).forEach((exercise, exerciseIndex) => {
      rampSets(exercise).forEach((set, setIndex) => items.push({
        key:`${exerciseIndex}:${setIndex}`,
        exercise:exercise.name || `Exercise ${exerciseIndex + 1}`,
        label:set.label || `Warm-up ${setIndex + 1}`,
        weight:set.weight,
        reps:set.reps
      }));
    });
    return items;
  }

  window.bp13209ToggleWarmupItem = function(key){
    const active = getActive();
    if (!active) return;
    active.warmupChecks = active.warmupChecks && typeof active.warmupChecks === 'object' ? active.warmupChecks : {};
    active.warmupChecks[key] = !active.warmupChecks[key];
    try { if (typeof saveData === 'function') saveData({render:false}); } catch (_) {}
    window.bp13209RenderWarmupPanel();
  };

  window.bp13209SkipWarmup = function(){
    const active = getActive();
    if (!active) return;
    const items = warmupItems(active);
    active.warmupChecks = active.warmupChecks && typeof active.warmupChecks === 'object' ? active.warmupChecks : {};
    items.forEach((item) => { active.warmupChecks[item.key] = true; });
    try { if (typeof saveData === 'function') saveData({render:false}); } catch (_) {}
    window.bp13209RenderWarmupPanel();
  };

  window.bp13209RenderWarmupPanel = function(){
    const panel = document.getElementById('warmupPanel');
    const active = getActive();
    if (!panel || !active) return;

    const items = warmupItems(active);
    active.warmupChecks = active.warmupChecks && typeof active.warmupChecks === 'object' ? active.warmupChecks : {};
    const completed = items.filter((item) => active.warmupChecks[item.key]).length;
    const percent = items.length ? Math.round((completed / items.length) * 100) : 100;

    panel.classList.remove('hidden');
    panel.innerHTML = `<section class="bp13209-warmup-shell">
      <header class="bp13209-warmup-header">
        <div>
          <span class="metric-label">Workout Warm-up</span>
          <h2>Prepare for the working sets</h2>
          <p>${items.length ? 'Complete each ramp set in order. Tap the number to mark it complete.' : 'No loaded ramp sets are required. Complete your normal movement preparation before continuing.'}</p>
        </div>
        <div class="bp13209-warmup-count"><strong>${completed}/${items.length}</strong><span>complete</span></div>
      </header>
      <div class="bp13209-warmup-progress"><span style="width:${percent}%"></span></div>
      <div class="bp13209-warmup-list">
        ${items.length ? items.map((item, index) => {
          const done = Boolean(active.warmupChecks[item.key]);
          return `<article class="bp13209-warmup-item ${done ? 'is-complete' : ''}">
            <button type="button" class="bp13209-warmup-check" onclick="bp13209ToggleWarmupItem('${esc(item.key)}')" aria-pressed="${done}">${done ? '✓' : index + 1}</button>
            <div class="bp13209-warmup-copy"><strong>${esc(item.exercise)}</strong><span>${esc(item.label)}</span></div>
            <div class="bp13209-warmup-prescription"><strong>${esc(item.weight)} lb</strong><span>× ${esc(item.reps)} reps</span></div>
          </article>`;
        }).join('') : `<article class="bp13209-warmup-empty"><strong>Movement preparation</strong><span>Use your normal dynamic warm-up, then continue when ready.</span></article>`}
      </div>
      <footer class="bp13209-warmup-footer">
        ${items.length && completed < items.length ? '<button type="button" class="secondary" onclick="bp13209SkipWarmup()">Skip Remaining Warm-up</button>' : ''}
        <button type="button" class="good" onclick="advanceToTraining()" ${items.length && completed < items.length ? 'disabled' : ''}>Begin Working Sets</button>
      </footer>
    </section>`;

    const legacyActions = document.getElementById('warmupActions');
    if (legacyActions) legacyActions.classList.add('hidden');
  };

  function previewRow(index, title, detail, tag){
    return `<article class="bp13209-preview-row">
      <span>${index}</span>
      <div><strong>${esc(title)}</strong><small>${esc(detail || 'As prescribed')}</small>${tag ? `<em>${esc(tag)}</em>` : ''}</div>
    </article>`;
  }

  window.bp13209PreviewActiveWorkout = function(){
    const active = getActive();
    const modal = document.getElementById('workoutPreviewModal');
    const content = document.getElementById('workoutPreviewContent');
    if (!active || !modal || !content) return;

    const exercises = workingExercises(active);
    const warmups = warmupItems(active);
    const displayTitle = typeof bellWorkoutDisplayLabel === 'function' ? bellWorkoutDisplayLabel(active) : (active.label || active.name || 'Today’s Mission');
    const title = document.getElementById('workoutPreviewTitle');
    const meta = document.getElementById('workoutPreviewMeta');
    if (title) title.textContent = displayTitle;
    if (meta) meta.textContent = `${Number(active.duration) || 30} minutes · ${exercises.length} exercises`;

    let html = '';
    if (warmups.length) {
      html += `<section class="bp13209-preview-section"><header><span>Warm-up</span><small>${warmups.length} ramp sets</small></header>${warmups.map((item, i) => previewRow(i + 1, `${item.exercise} — ${item.label}`, `${item.weight} lb × ${item.reps}`, 'Generated Warm-up')).join('')}</section>`;
    } else {
      html += `<section class="bp13209-preview-section"><header><span>Warm-up</span><small>Movement preparation</small></header>${previewRow(1, 'Dynamic movement preparation', 'Complete your normal warm-up before working sets', 'Warm-up')}</section>`;
    }

    html += `<section class="bp13209-preview-section"><header><span>Working Sets</span><small>${exercises.length} exercises</small></header>${exercises.map((exercise, i) => {
      const prescription = exercise.prescription || [exercise.sets, exercise.reps].filter(Boolean).join(' × ') || 'As prescribed';
      return previewRow(i + 1, exercise.name || `Exercise ${i + 1}`, prescription, exercise.block || 'Working Sets');
    }).join('')}</section>`;
    content.innerHTML = html;

    const begin = document.getElementById('previewBeginButton');
    if (begin) {
      begin.textContent = 'Start Session';
      begin.onclick = function(){
        modal.classList.add('hidden');
        beginWorkoutFlow();
      };
    }

    modal.classList.remove('hidden');
    modal.style.display = 'block';
    modal.setAttribute('aria-hidden', 'false');
  };

  window.bp13209CloseWorkoutPreview = function(){
    const modal = document.getElementById('workoutPreviewModal');
    if (!modal) return;
    modal.classList.add('hidden');
    modal.style.display = '';
    modal.setAttribute('aria-hidden', 'true');
  };

  document.addEventListener('click', (event) => {
    if (event.target?.id === 'workoutPreviewModal') window.bp13209CloseWorkoutPreview();
  });
})();
