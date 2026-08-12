(function(){
  'use strict';
  const VERSION='13.22.15';
  const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const clean=v=>String(v??'').replace(/\s+/g,' ').trim();
  const isEngine=x=>Boolean(x&&(x.cardioType||x.engineMetrics||/^R-/i.test(String(x.name||x.mission||''))||String(x.dailySessionType||x.sessionType||'').toLowerCase()==='engine'));
  const dateKey=x=>String(x?.scheduledDate||x?.dailySessionDate||x?.completionIdentity?.scheduledDate||x?.completedAt||'').slice(0,10);

  // --- Persistent strength rest display ---
  let restEndAt=0;
  const priorBeginRest=window.beginRestTimer, priorAdjustRest=window.adjustRestTimer, priorSkipRest=window.skipRestTimer;
  const remaining=()=>restEndAt?Math.max(0,Math.ceil((restEndAt-Date.now())/1000)):0;
  const fmt=s=>`${String(Math.floor(Math.max(0,s)/60)).padStart(2,'0')}:${String(Math.max(0,s)%60).padStart(2,'0')}`;
  function renderRestBanner(){
    const active=window.data?.activeWorkout;if(!active||isEngine(active))return;
    const shell=document.querySelector('#workoutModal .gw-commercial-shell');if(!shell)return;
    let banner=shell.querySelector('.b132215-rest-banner');
    const sec=remaining(),running=sec>0;
    if(!banner){banner=document.createElement('section');banner.className='b132215-rest-banner';const anchor=shell.querySelector('.gw-log-wrap,.gw-log-head,.gw-group-exercise');(anchor||shell.querySelector('.gw-action-spacer'))?.insertAdjacentElement('beforebegin',banner);}
    if(!banner)return;
    banner.classList.toggle('running',running);
    banner.innerHTML=`<div class="b132215-rest-copy"><small>${running?'Rest timer':'Rest status'}</small><strong>${running?fmt(sec):'READY'}</strong></div><div class="b132215-rest-actions">${running?'<button type="button" data-rm="-30">−30</button><button type="button" data-rm="30">+30</button><button type="button" data-rskip>Skip</button>':'<span style="color:#8e99a4;font-size:.72rem">Complete a set to start rest</span>'}</div>`;
    banner.querySelectorAll('[data-rm]').forEach(b=>b.onclick=()=>window.adjustRestTimer(Number(b.dataset.rm)||0));
    const skip=banner.querySelector('[data-rskip]');if(skip)skip.onclick=()=>window.skipRestTimer();
  }
  window.beginRestTimer=function(seconds,name){restEndAt=Date.now()+Math.max(0,Number(seconds)||0)*1000;const r=priorBeginRest?.apply(this,arguments);setTimeout(renderRestBanner,0);return r;};
  window.adjustRestTimer=function(delta){if(restEndAt)restEndAt+=Number(delta||0)*1000;const r=priorAdjustRest?.apply(this,arguments);renderRestBanner();return r;};
  window.skipRestTimer=function(){restEndAt=0;const r=priorSkipRest?.apply(this,arguments);renderRestBanner();return r;};
  setInterval(()=>{if(restEndAt&&remaining()<=0)restEndAt=0;renderRestBanner();},1000);

  // --- Same-day strength warm-up carryover for Engine ---
  function recentStrength(active=window.data?.activeWorkout){
    if(!active||!isEngine(active))return null;
    const key=dateKey(active)||new Date().toISOString().slice(0,10),now=Date.now();
    return (window.data?.history||[]).find(item=>{
      if(isEngine(item)||item?.optionalCore)return false;
      if(dateKey(item)!==key)return false;
      const t=new Date(item.completedAt||0).getTime();
      return Number.isFinite(t)&&t>0&&now-t<=150*60*1000;
    })||null;
  }
  function engineWarmupCovered(active=window.data?.activeWorkout){return Boolean(recentStrength(active));}

  // --- Engine modality selection at launch ---
  function engineType(active){try{return window.BellEngine132212?.engineType(active)||'Engine';}catch(_){return 'Engine';}}
  function mode(active){try{return window.BellEngine132212?.sessionMode(active)||active?.cardioType||'Running';}catch(_){return active?.cardioType||'Running';}}
  function modes(){try{return window.BellEngine132212?.availableModes?.()||[];}catch(_){return [];}}
  function setMode(value){const active=window.data?.activeWorkout;if(!active)return;const key=active.planSessionKey||'active';try{window.BellEngine132212?.setMode?.(key,value);}catch(_){}active.cardioType=value;window.saveData?.({render:false});renderEngineLaunchSetup();try{window.BellDashboardEngineHistory132211?.renderEngineExperience?.();}catch(_){}enhanceEngineTraining();}
  window.BellEngine132215SetMode=setMode;

  function renderEngineLaunchSetup(){
    const active=window.data?.activeWorkout;if(!active||!isEngine(active))return;
    const briefing=document.getElementById('missionBriefing');if(!briefing)return;
    briefing.querySelector('.b132215-engine-launch')?.remove();
    const current=mode(active),available=modes(),covered=engineWarmupCovered(active),type=engineType(active);
    const block=document.createElement('section');block.className='b132215-engine-launch';
    block.innerHTML=`<small>ENGINE SETUP</small><h3>${esc(type)}</h3><p>Choose how you are doing today’s Engine prescription. Bell keeps the training purpose and adapts the execution mode.</p><div class="b132215-mode-grid">${available.map(x=>`<button type="button" class="b132215-mode ${x.value===current?'active':''}" onclick="BellEngine132215SetMode('${esc(x.value)}')">${esc(x.label)}<span>${x.value===current?'Selected':'Available here'}</span></button>`).join('')}</div>${covered?`<div class="b132215-covered">✓ Your strength session was completed recently today. Bell will carry that preparation forward and skip a redundant full Engine warm-up. Start with 1–2 easy transition minutes if the modality needs it.</div>`:''}`;
    briefing.appendChild(block);
    const start=document.querySelector('#workoutBriefActions .good');if(start)start.textContent=covered?'Start Engine — Warm-Up Covered':'Start Engine';
  }

  const priorBrief=window.renderMissionBriefing;
  if(typeof priorBrief==='function')window.renderMissionBriefing=function(active){const r=priorBrief.apply(this,arguments);if(isEngine(active))setTimeout(renderEngineLaunchSetup,0);return r;};

  const priorBeginFlow=window.beginWorkoutFlow;
  window.beginWorkoutFlow=function(){
    const active=window.data?.activeWorkout;
    if(active&&isEngine(active)&&engineWarmupCovered(active)){
      active.warmupCoveredByStrength=true;active.warmupCoveredAt=new Date().toISOString();active.startedAt=active.startedAt||new Date().toISOString();active.timerStartedAt=new Date().toISOString();active.timerRunning=true;active.stage='training';
      window.saveData?.({render:false});window.renderWorkoutStage?.();window.startTimer?.();setTimeout(enhanceEngineTraining,0);return;
    }
    return priorBeginFlow?.apply(this,arguments);
  };

  function parseIntervals(text){
    const t=clean(text);let m=t.match(/(\d+)\s*[x×]\s*(\d+(?:\.\d+)?)\s*(?:min|minute)s?\s*(?:hard|on)?\s*[\/·,-]+\s*(\d+(?:\.\d+)?)\s*(?:min|minute)s?\s*(?:easy|off|recovery)?/i);
    if(m)return{rounds:Number(m[1]),hard:Number(m[2]),easy:Number(m[3]),unit:'min'};
    m=t.match(/(\d+)\s*[x×]\s*(\d+)\s*sec(?:ond)?s?\s*(?:hard|on)?\s*[\/·,-]+\s*(\d+)\s*sec(?:ond)?s?/i);
    if(m)return{rounds:Number(m[1]),hard:Number(m[2]),easy:Number(m[3]),unit:'sec'};
    return null;
  }
  function prescription(active){const ex=active?.exercises?.[0]||{};return clean(ex.plannedReps||ex.prescription||ex.sets?.[0]?.plannedReps||ex.sets?.[0]?.reps||`${active?.duration||30} minutes`);}
  function enhanceEngineTraining(){
    const active=window.data?.activeWorkout;if(!active||!isEngine(active)||active.stage!=='training')return;
    const host=document.querySelector('.b132211-engine');if(!host)return;
    host.querySelector('.b132215-engine-top-setup')?.remove();host.querySelector('.b132215-engine-plan')?.remove();
    const current=mode(active),type=engineType(active),p=prescription(active),interval=parseIntervals(p),available=modes();
    const setup=document.createElement('section');setup.className='b132215-engine-top-setup b132215-engine-launch';
    setup.innerHTML=`<small>DO IT AS</small><h3>${esc(current)}</h3><div class="b132215-mode-grid">${available.map(x=>`<button type="button" class="b132215-mode ${x.value===current?'active':''}" onclick="BellEngine132215SetMode('${esc(x.value)}')">${esc(x.label)}<span>${x.value===current?'Current modality':'Switch modality'}</span></button>`).join('')}</div>`;
    const hero=host.querySelector('.b132211-engine-hero');hero?.insertAdjacentElement('afterend',setup);
    const plan=document.createElement('section');plan.className='b132215-engine-plan';
    plan.innerHTML=`<small>TODAY'S PLAN</small><h3>${esc(type)}</h3>${interval?`<div class="b132215-interval-structure"><b>ROUNDS</b><span>${interval.rounds}</span><b>HARD</b><span>${interval.hard} ${interval.unit}${interval.hard===1?'':'s'} at repeatable hard effort</span><b>EASY</b><span>${interval.easy} ${interval.unit}${interval.easy===1?'':'s'} easy recovery</span></div>`:`<p style="margin:7px 0 0;color:#e8edf2;font-weight:750">${esc(p)}</p>`}${active.warmupCoveredByStrength?'<p class="b132215-engine-note">Strength warm-up carried forward. Use only a short modality transition before the first work interval.</p>':''}`;
    setup.insertAdjacentElement('afterend',plan);
  }
  const priorEngineRender=window.BellDashboardEngineHistory132211?.renderEngineExperience;
  if(priorEngineRender){window.BellDashboardEngineHistory132211.renderEngineExperience=function(){const r=priorEngineRender.apply(this,arguments);setTimeout(enhanceEngineTraining,0);return r;};}
  const priorRender=window.renderActiveWorkout;
  if(typeof priorRender==='function')window.renderActiveWorkout=function(){const r=priorRender.apply(this,arguments);setTimeout(()=>{renderRestBanner();enhanceEngineTraining();},0);return r;};

  document.addEventListener('DOMContentLoaded',()=>setTimeout(()=>{renderEngineLaunchSetup();renderRestBanner();enhanceEngineTraining();},120));
  window.BellExecutionIntegrity132215={version:VERSION,recentStrength,engineWarmupCovered,renderRestBanner,renderEngineLaunchSetup,enhanceEngineTraining};
})();
