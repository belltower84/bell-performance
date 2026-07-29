"use strict";
/* Bell Performance 13.5.0 — Commercial UX foundation and Home dashboard. */
(function(){
  const $=id=>document.getElementById(id);
  const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const text=id=>$(id)?.textContent?.trim()||"";
  const clean=v=>String(v||"").replace(/\s+/g," ").trim();
  function athlete(){return clean(window.data?.settings?.athleteProfile?.preferredName||window.data?.settings?.athleteProfile?.firstName||window.data?.settings?.name||"Athlete");}
  function greeting(){const h=new Date().getHours();return h<12?"Good morning":h<18?"Good afternoon":"Good evening";}
  function state(){try{return window.BellCoachingEngine?.getState({persist:false})||{};}catch(_){return {};}}
  function currentSessions(){try{return typeof premiumAllSessions==='function'?premiumAllSessions():[];}catch(_){return [];}}
  function sessionLabel(s){try{return clean(s?.label||scaledTemplate(s?.mission)?.label||s?.mission||"Training");}catch(_){return clean(s?.label||s?.mission||"Training");}}
  function sessionType(s){try{return typeof premiumSessionType==='function'?premiumSessionType(s):"training";}catch(_){return "training";}}
  function sessionMinutes(s){try{return Number(s?.prescribedDuration)||Number(scaledTemplate(s?.mission)?.duration)||30;}catch(_){return Number(s?.prescribedDuration)||30;}}
  function todayMission(){
    const sessions=currentSessions();
    if(!sessions.length)return {title:"Recovery Day",purpose:"Recover, move well, and prepare for the next training day.",minutes:"Flexible",type:"Recovery",sessions:[]};
    const first=sessions.find(s=>!s.completed)||sessions[0];
    const total=sessions.reduce((n,s)=>n+sessionMinutes(s),0);
    const title=sessions.length>1?`${sessionLabel(first)} + ${sessionLabel(sessions.find(s=>s!==first)||sessions[1])}`:sessionLabel(first);
    const s=state();
    return {title,purpose:clean(s.currentPhase?.purpose||text('commandMissionPurpose')||"Complete the prescribed work with controlled effort and quality execution."),minutes:`${total} min`,type:sessions.map(sessionType).join(" + "),sessions};
  }
  function markup(){return `<div class="b135-home" id="b135Home" data-view="guided">
    <section class="b135-welcome"><div><span class="b135-eyebrow">Bell Performance</span><h1><span id="b135Greeting">Good morning</span>, <span id="b135Athlete">Athlete</span></h1><p id="b135WelcomeLine">Here is what matters today.</p></div><div class="b135-mode" role="group" aria-label="Display detail"><button class="active" data-b135-view="guided" type="button">Guided</button><button data-b135-view="advanced" type="button">Advanced</button></div></section>
    <section class="b135-card b135-checkin"><div class="b135-checkin-copy"><span class="b135-eyebrow">Daily check-in</span><strong>How are you feeling today?</strong><small id="b135CheckinStatus">A quick check-in helps Bell adjust your training.</small></div><div class="b135-feeling"><button type="button" data-feeling="low">Low</button><button type="button" data-feeling="ready">Ready</button><button type="button" data-feeling="great">Great</button></div></section>
    <section class="b135-card b135-primary"><div class="b135-primary-body"><div class="b135-mission-top"><div><span class="b135-eyebrow">Today’s training</span><h2 id="b135MissionTitle">Preparing your training</h2><p id="b135MissionPurpose">Bell is loading today’s prescription.</p></div><span class="b135-duration" id="b135MissionDuration">—</span></div><div class="b135-session-summary" id="b135SessionSummary"></div><div class="b135-primary-actions"><button class="b135-start" id="b135Start" type="button">Start Training</button><button class="b135-secondary" id="b135View" type="button">View Session</button><button class="b135-secondary b135-advanced" id="b135Modify" type="button">Modify</button></div><button class="b135-why" type="button" id="b135WhyMission">Why this workout?</button></div></section>
    <div class="b135-grid"><section class="b135-card b135-section"><div class="b135-section-head"><div><span class="b135-eyebrow">This week</span><h3 id="b135WeekTitle">Your training week</h3></div><button class="b135-link" type="button" onclick="showScreen('plan')">View Plan</button></div><div class="b135-week" id="b135Week"></div><div class="b135-week-foot"><span id="b135WeekComplete">0 of 0 sessions complete</span><strong id="b135WeekNext">Next: Today</strong></div></section>
    <section class="b135-card b135-section"><div class="b135-section-head"><div><span class="b135-eyebrow">Bell Coach</span><h3>Today’s direction</h3></div><button class="b135-link" type="button" onclick="openCommandTile('coaching')">Open Coach</button></div><p class="b135-coach-text" id="b135CoachText">Bell is preparing your coaching direction.</p><div class="b135-coach-context"><span class="b135-chip" id="b135PhaseChip">Current phase</span><span class="b135-chip" id="b135ReadinessChip">Readiness</span></div><button class="b135-why" type="button" onclick="openCommandTile('coaching')">Why?</button></section></div>
    <div class="b135-bottom-grid"><section class="b135-card b135-section"><div class="b135-section-head"><div><span class="b135-eyebrow">Your plan</span><h3 id="b135Journey">Performance & Health</h3></div><button class="b135-link" type="button" onclick="showScreen('plan')">View Plan</button></div><div class="b135-plan-row"><div class="b135-progress-ring" id="b135PlanRing"></div><div class="b135-plan-copy"><strong id="b135Phase">Foundation</strong><span id="b135PhaseWeek">Week 1 of 4</span><small id="b135NextPhase">Next: Development</small></div></div></section>
    <section class="b135-card b135-section"><div class="b135-section-head"><div><span class="b135-eyebrow">Your progress</span><h3>Current trend</h3></div><button class="b135-link" type="button" onclick="showScreen('history')">View Progress</button></div><div class="b135-stat"><div><span id="b135ProgressLabel">Training consistency</span><strong id="b135ProgressValue">—</strong></div><span class="b135-trend" id="b135ProgressTrend">Building</span></div><div class="b135-advanced"><p class="hint" id="b135AdvancedNote">Advanced coaching details are available throughout Bell.</p></div></section></div>
  </div>`;}
  function renderSessions(m){
    const host=$('b135SessionSummary');if(!host)return;
    if(!m.sessions.length){host.innerHTML='<div class="b135-session-item"><span>Today</span><strong>Recovery</strong><small>Walking, mobility, and normal daily activity</small></div>';return;}
    host.innerHTML=m.sessions.slice(0,3).map((s,i)=>`<div class="b135-session-item"><span>${i===0?'Primary':sessionType(s)}</span><strong>${esc(sessionLabel(s))}</strong><small>${sessionMinutes(s)} min${s.completed?' · Complete':''}</small></div>`).join('');
  }
  function renderWeek(){
    const host=$('b135Week');if(!host)return;
    try{
      const block=typeof bpResolvePlanBlock==='function'?bpResolvePlanBlock():data.trainingBlock;
      if(typeof bpPrepareBlockPlan==='function')bpPrepareBlockPlan(block);
      const week=typeof bpCurrentTimelineWeek==='function'?bpCurrentTimelineWeek(block):Number(block?.currentWeek||1);
      const plan=typeof bpWeekPlan==='function'?bpWeekPlan(block,week):(data.plan||[]);
      const monday=typeof bpWeekStartKey==='function'?bpWeekStartKey(block,week):mondayKeyFor(todayKey());
      const names=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],full=['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];let done=0,total=0;
      host.innerHTML=names.map((name,i)=>{const key=addLocalDays(monday,i),items=plan.filter(x=>(x.day===full[i]||planDateKey(x)===key)&&!['skipped','replaced'].includes(x.status));const sessions=items.flatMap(sessionsFromPlanItem);total+=sessions.length;done+=sessions.filter(x=>x.completed).length;const all=sessions.length&&sessions.every(x=>x.completed);return `<button class="b135-day ${all?'done':''} ${key===todayKey()?'today':''}" type="button" onclick="setDashboardDate('${key}')"><span>${name}</span><strong>${localDateFromKey(key).getDate()}</strong><i></i></button>`;}).join('');
      $('b135WeekComplete').textContent=`${done} of ${total} sessions complete`;$('b135WeekTitle').textContent=`Week ${week}`;$('b135WeekNext').textContent=total===done?'Week complete':'Keep moving forward';
    }catch(_){host.innerHTML=['M','T','W','T','F','S','S'].map(x=>`<div class="b135-day"><span>${x}</span><i></i></div>`).join('');}
  }
  function render(){
    if(!$('b135Home'))return;
    const s=state(),m=todayMission();$('b135Greeting').textContent=greeting();$('b135Athlete').textContent=athlete();$('b135MissionTitle').textContent=m.title;$('b135MissionPurpose').textContent=m.purpose;$('b135MissionDuration').textContent=m.minutes;renderSessions(m);renderWeek();
    const checked=window.data?.settings?.readiness?.lastPromptDate===window.todayKey?.();$('b135CheckinStatus').textContent=checked?'Today’s check-in is complete. Bell has adjusted your plan.':'A quick check-in helps Bell adjust your training.';
    $('b135CoachText').textContent=clean(text('premiumCoachText')||window.BellCoachIntelligence?.brief?.()?.instruction||s.currentPhase?.purpose||"Focus on controlled effort and complete the work Bell prescribed.");
    $('b135PhaseChip').textContent=s.currentPhaseName||'Current phase';$('b135ReadinessChip').textContent=checked?`Readiness ${typeof readinessStatus==='function'?readinessStatus(readinessScore()).toLowerCase():'updated'}`:'Check-in needed';
    $('b135Journey').textContent=s.name||'Performance & Health';$('b135Phase').textContent=s.currentPhaseName||'Foundation';$('b135PhaseWeek').textContent=`Week ${s.phaseWeek||1} of ${s.phaseLength||1}`;$('b135NextPhase').textContent=`Next: ${s.nextPhase?.name||'Journey review'}`;$('b135PlanRing').style.setProperty('--p',`${Math.max(0,Math.min(100,Number(s.progressPercent)||0))}%`);
    let completed=0,total=0;try{const hist=data.history||[];completed=hist.filter(x=>x.completed||x.status==='completed').length;total=Math.max(completed,Number(data.trainingBlock?.currentWeek||1)*(Number(data.trainingBlock?.strengthDays||0)+Number(data.trainingBlock?.runDays||0)));}catch(_){}$('b135ProgressValue').textContent=completed?`${completed} sessions`:'Getting started';$('b135ProgressTrend').textContent=completed?'On track':'Building';
    const start=$('b135Start'),view=$('b135View'),modify=$('b135Modify'),legacyStart=$('commandStartWorkout'),legacyView=$('commandViewSession'),legacyModify=$('commandModifySession');
    start.textContent=legacyStart?.textContent?.trim()|| (m.sessions.length?'Start Training':'Open Recovery');start.onclick=()=>legacyStart?.click();view.onclick=()=>legacyView?.click();modify.onclick=()=>legacyModify?.click();$('b135WhyMission').onclick=()=>{if(window.openBellCoachExplanation)openBellCoachExplanation('mission');else openCommandTile('coaching');};
  }
  function bind(){
    $('b135Home')?.querySelectorAll('[data-b135-view]').forEach(b=>b.addEventListener('click',()=>{$('b135Home').dataset.view=b.dataset.b135View;$('b135Home').querySelectorAll('[data-b135-view]').forEach(x=>x.classList.toggle('active',x===b));localStorage.setItem('bellDisplayMode',b.dataset.b135View);}));
    const saved=localStorage.getItem('bellDisplayMode')||'guided';$('b135Home').dataset.view=saved;$('b135Home').querySelectorAll('[data-b135-view]').forEach(x=>x.classList.toggle('active',x.dataset.b135View===saved));
    $('b135Home')?.querySelectorAll('[data-feeling]').forEach(b=>b.addEventListener('click',()=>{document.getElementById('dailyReadinessModal')?.classList.remove('hidden');}));
  }
  function relabel(){const nav=document.querySelector('.app-nav');if(!nav)return;const labels={home:'Home',workouts:'Train',plan:'Plan',history:'Progress',more:'More'};Object.entries(labels).forEach(([id,label])=>{const b=nav.querySelector(`[data-screen="${id}"]`);if(!b)return;const spans=b.querySelectorAll('span');if(spans.length)spans[spans.length-1].textContent=label;});}
  function init(){const home=$('home');if(!home)return;if(!$('b135Home'))home.insertAdjacentHTML('afterbegin',markup());bind();relabel();setTimeout(render,120);setInterval(()=>{if($('home')?.classList.contains('active'))render();},2500);}
  document.addEventListener('DOMContentLoaded',init);
  const prior=window.renderApp;if(typeof prior==='function')window.renderApp=function(){const out=prior.apply(this,arguments);setTimeout(render,20);return out;};
  window.renderBellCommercialHome=render;
})();
