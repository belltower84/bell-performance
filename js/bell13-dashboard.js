"use strict";
/* Bell Performance 13.2.0 — Mission Control powered by discipline-specific coaching libraries. */
(function(){
  const $=id=>document.getElementById(id);
  const clean=value=>String(value||"").replace(/\s+/g," ").trim();
  function safeDateDays(target){
    if(!target)return null;
    try{
      if(typeof daysBetweenKeys==='function'&&typeof todayKey==='function')return Math.max(0,daysBetweenKeys(todayKey(),target));
      return Math.max(0,Math.ceil((new Date(`${target}T12:00:00`)-new Date())/86400000));
    }catch(_){return null;}
  }
  function missionState(){
    try{
      const state=window.BellCoachingEngine?.getState({persist:false});
      if(state){
        return {
          journey:state.name,
          identity:state.identity,
          objective:state.objective,
          phase:state.currentPhaseName,
          phasePurpose:state.currentPhase?.purpose,
          week:state.currentWeek,
          length:state.totalWeeks,
          phaseWeek:state.phaseWeek,
          phaseLength:state.phaseLength,
          progress:state.progressPercent,
          isEvent:state.mode==='event_preparation',
          target:state.targetDate||'',
          days:state.targetDate?safeDateDays(state.targetDate):null,
          next:state.nextMilestone,
          mode:state.modeLabel,
          nextPhase:state.nextPhase?.name||'Journey review',
          cycleNumber:state.cycleNumber||1,
          cycleWeek:state.cycleWeek||state.currentWeek,
          cycleLength:state.cycleLength||state.totalWeeks,
          cycleEmphasis:state.cycleEmphasis||state.name
        };
      }
    }catch(error){console.warn('Bell 13 coaching state unavailable',error);}
    const block=data?.trainingBlock||{},mission=block.mission||{},dual=block.dualGoals||{};
    const isEvent=mission.path==='event'||Boolean(mission.eventDate||block.targetDate);
    const journey=isEvent
      ? clean(mission.eventName||mission.eventType||block.goalType||'Competition Preparation')
      : clean(mission.developmentGoal||dual.strengthGoal||block.goalType||data?.settings?.athleteMode||'Performance & Health');
    const phase=clean(data?.settings?.phase||'Foundation').split('•').pop().trim()||'Foundation';
    const week=Math.max(1,Number(block.currentWeek)||1),length=Math.max(1,Number(block.lengthWeeks)||12);
    const progress=Math.max(0,Math.min(100,Math.round((week/length)*100)));
    const target=mission.eventDate||mission.secondaryGoal?.targetDate||block.targetDate||'';
    const days=safeDateDays(target);
    return {journey,phase,week,length,phaseWeek:week,phaseLength:length,progress,isEvent,target,days,next:isEvent&&days!=null?`${days} day${days===1?'':'s'} to ${journey}`:`Complete Week ${week}`,mode:isEvent?'Event Preparation':'Continuous Development'};
  }
  function cardHtml(){return `
    <section class="bell13-journey-card" id="bell13JourneyCard" aria-labelledby="bell13JourneyTitle">
      <div class="bell13-journey-top">
        <div class="bell13-coach-lockup"><span class="bell13-coach-mark" aria-hidden="true">B</span><div><span class="bell13-eyebrow">Mission Control</span><strong>Bell Coach</strong></div></div>
        <span class="bell13-mode-pill" id="bell13PlanningMode">Continuous Development</span>
      </div>
      <div class="bell13-journey-main">
        <span class="bell13-journey-label">Current Journey</span>
        <h1 class="bell13-journey-title" id="bell13JourneyTitle">Performance &amp; Health</h1>
        <div class="bell13-phase-grid">
          <div class="bell13-phase-stat"><span>Current Phase</span><strong id="bell13CurrentPhase">Foundation</strong><small id="bell13PhasePurpose">Building the qualities required for the next step.</small></div>
          <div class="bell13-phase-stat"><span>Phase Week</span><strong id="bell13PhaseWeek">Week 1 of 12</strong><small>Current training emphasis</small></div>
          <div class="bell13-phase-stat"><span>Journey Status</span><strong id="bell13JourneyStatus">On Plan</strong><small id="bell13JourneyTarget">Continuous development</small></div>
        </div>
        <div class="bell13-progress-wrap">
          <div class="bell13-progress-copy"><span>Journey progress</span><strong id="bell13JourneyPercent">8%</strong></div>
          <div class="bell13-progress-track" aria-hidden="true"><i id="bell13JourneyProgress"></i></div>
        </div>
        <div class="bell13-next-line"><span aria-hidden="true">◆</span><span>Next milestone: <b id="bell13NextMilestone">Complete Week 1</b></span></div>
      </div>
    </section>`;}
  function phasePurpose(phase){
    const p=clean(phase).toLowerCase();
    if(/recover|deload|taper/.test(p))return 'Reducing fatigue while preserving the adaptations already built.';
    if(/peak|competition|meet week/.test(p))return 'Converting training into event-day performance.';
    if(/strength|intens/.test(p))return 'Building force production and competition-specific strength.';
    if(/hypertrophy|growth|muscle/.test(p))return 'Building useful muscle and increasing training capacity.';
    if(/base|foundation|aerobic/.test(p))return 'Building the foundation that supports harder work later.';
    if(/fat loss|recomp/.test(p))return 'Preserving muscle while improving body composition.';
    if(/specific|simulation|race pace/.test(p))return 'Practicing the exact demands of the objective.';
    return 'Developing the qualities required for the next phase.';
  }
  function render(){
    if(typeof data==="undefined")return;
    const state=missionState();
    if($('bell13JourneyTitle'))$('bell13JourneyTitle').textContent=state.journey;
    if($('bell13PlanningMode'))$('bell13PlanningMode').textContent=state.mode;
    if($('bell13CurrentPhase'))$('bell13CurrentPhase').textContent=state.phase;
    if($('bell13PhasePurpose'))$('bell13PhasePurpose').textContent=state.phasePurpose||phasePurpose(state.phase);
    if($('bell13PhaseWeek'))$('bell13PhaseWeek').textContent=`Week ${state.phaseWeek} of ${state.phaseLength}`;
    if($('bell13JourneyPercent'))$('bell13JourneyPercent').textContent=`${state.progress}%`;
    if($('bell13JourneyProgress'))$('bell13JourneyProgress').style.width=`${state.progress}%`;
    if($('bell13JourneyStatus'))$('bell13JourneyStatus').textContent=state.isEvent?(state.days===0?'Event Day':'Building to Peak'):`Cycle ${state.cycleNumber||1}`;
    if($('bell13JourneyTarget'))$('bell13JourneyTarget').textContent=state.isEvent&&state.target?state.target:(state.cycleEmphasis||state.objective||'Continuous development');
    if($('bell13NextMilestone'))$('bell13NextMilestone').textContent=state.next;
  }
  function inject(){
    const dashboard=$('premiumDashboard');if(!dashboard)return;
    if(!$('bell13JourneyCard'))dashboard.insertAdjacentHTML('afterbegin',cardHtml());
    const pageCopy={
      plan:['Journey Plan','See how today’s work fits into your longer-term development.'],
      workouts:['Training','Start today’s prescription or explore purpose-matched sessions.'],
      history:['Progress','Review performance, consistency, readiness, and milestones.'],
      more:['Settings','Control your athlete profile, journey, schedule, and Bell coaching preferences.']
    };
    Object.entries(pageCopy).forEach(([id,[title,description]])=>{
      const screen=$(id);if(!screen||screen.querySelector('.bell13-page-heading'))return;
      screen.insertAdjacentHTML('afterbegin',`<div class="bell13-page-heading"><span>Bell Performance</span><h2>${title}</h2><p>${description}</p></div>`);
    });
    render();
  }
  function relabelNavigation(){
    const nav=document.querySelector('.app-nav');if(!nav)return;
    const labels={home:'Mission',workouts:'Training',plan:'Plan',history:'Progress',more:'More'};
    Object.entries(labels).forEach(([screen,label])=>{const button=nav.querySelector(`[data-screen="${screen}"]`);if(button){const spans=button.querySelectorAll('span');const target=spans[spans.length-1];if(target)target.textContent=label;}});
    const order=['home','workouts','plan','history','more'];order.forEach(name=>{const b=nav.querySelector(`[data-screen="${name}"]`);if(b)nav.appendChild(b);});
  }
  document.addEventListener('DOMContentLoaded',()=>{inject();relabelNavigation();setTimeout(render,80);});
  const oldRender=window.renderApp;
  if(typeof oldRender==='function')window.renderApp=function(){const result=oldRender.apply(this,arguments);setTimeout(render,0);return result;};
  window.renderBell13MissionControl=render;
})();
