(function(){
  'use strict';
  const labels={home:'Home',plan:'Plan',workouts:'Train',history:'Progress',more:'Control'};
  const controlMap={
    help:['Support','Help'],
    athlete:['Preferences','Athlete Settings'],
    mission:['Active Programming','Mission & Block Management'],
    training:['Training Locations & Equipment','Equipment'],
    coach:['Readiness','Coaching'],
    data:['Data','Backup']
  };
  function text(id,value){const el=document.getElementById(id);if(el&&value)el.textContent=value;}
  function safeState(){try{return window.state||JSON.parse(localStorage.getItem('bellPerformanceState')||'{}')||{};}catch(e){return {};}}
  function athleteName(s){return s.athleteName||s.profile?.name||s.firstName||'Athlete';}
  function missionName(s){return s.eventName||s.mission?.eventName||s.mission?.name||s.primaryGoal||'Build your mission';}
  function phaseName(s){return s.phase||s.currentPhase||s.block?.phase||'Foundation';}
  function updateFoundation(){
    const s=safeState(),name=athleteName(s),mission=missionName(s),phase=phaseName(s);
    const initials=name.split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0]).join('').toUpperCase()||'BP';
    text('bp10AthleteInitials',initials);text('bp10ControlAthlete',name);text('bp10ControlMission',mission);text('bp10ControlCurrentPhase',phase);text('bp10ControlPhase',String(phase).toUpperCase());
    const streak=Number(s.streak||s.trainingStreak||0),history=Array.isArray(s.history)?s.history:[];
    let score='—'; if(history.length){const done=history.filter(x=>x&&x.completed!==false).length;score=Math.round(done/history.length*100)+'%';}
    text('bp10ComplianceScore',score);
    document.title='Bell Performance 10 — '+name;
  }
  function findHeading(words){
    const root=document.getElementById('more'); if(!root)return null;
    const all=[...root.querySelectorAll('h2,h3,.metric-label')];
    return all.find(el=>words.some(w=>(el.textContent||'').toLowerCase().includes(w.toLowerCase())));
  }
  window.bp10OpenControl=function(key){
    const words=controlMap[key]||[key]; const target=findHeading(words);
    if(target){const card=target.closest('.card')||target.closest('.settings-section-heading')||target;card.classList.add('bp10-control-flash');target.scrollIntoView({behavior:'smooth',block:'start'});setTimeout(()=>card.classList.remove('bp10-control-flash'),1400);}
  };
  window.bp10StartToday=function(){
    if(typeof window.showScreen==='function')window.showScreen('home');
    setTimeout(()=>{const btn=[...document.querySelectorAll('#home button')].find(b=>/start|open|train/i.test(b.textContent||''));if(btn)btn.click();else window.scrollTo({top:0,behavior:'smooth'});},180);
  };
  const original=window.showScreen;
  if(typeof original==='function'){
    window.showScreen=function(name){original(name);document.body.dataset.bp10Screen=name;const label=labels[name];if(label)document.documentElement.setAttribute('data-current-screen',label);updateFoundation();};
  }
  window.addEventListener('storage',updateFoundation);
  document.addEventListener('DOMContentLoaded',()=>{document.body.classList.add('bell-performance-10');updateFoundation();setTimeout(updateFoundation,700);});
  setInterval(updateFoundation,5000);
})();
