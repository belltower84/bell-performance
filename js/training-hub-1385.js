"use strict";
/* Bell Performance 13.8.5 — focused Train tab. */
(function(){
  const esc=value=>String(value??"").replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
  const titleCase=value=>String(value||"").replace(/\b\w/g,char=>char.toUpperCase());
  function key(){
    try{return typeof todayKey==="function"?todayKey():new Date().toISOString().slice(0,10);}catch(_){return new Date().toISOString().slice(0,10);}
  }
  function openTodayMission(){
    if(typeof showScreen==="function")showScreen("home");
    window.setTimeout(()=>document.querySelector(".b135-primary")?.scrollIntoView({behavior:"smooth",block:"start"}),60);
  }
  function resumeActive(){
    if(data?.activeWorkout&&typeof openWorkoutUI==="function")openWorkoutUI();
    else openTodayMission();
  }
  function renderTrainingHub(){
    const host=document.getElementById("trainingHubCurrent");if(!host)return;
    let model=null;
    try{model=window.BellDailySessions?.buildRows?.(key())||null;}catch(error){console.error("Training hub render failed",error);}
    const rows=model?.rows||[];
    const required=rows.filter(row=>row.required);
    const requiredDone=required.length>0&&required.every(row=>row.completed);
    const title=requiredDone?"Mission Complete":required.length?required.map(row=>row.label).join(" + "):"Recovery Day";
    const active=data?.activeWorkout;
    const statusRows=rows.map(row=>`<div class="training-hub-row ${row.completed?"completed":""}"><span>${esc(row.type==="strength"?"Primary":titleCase(row.type))}</span><strong>${esc(row.label)}</strong><small>${esc(row.minutes)} min · ${row.completed?"Complete":row.required?"Required":"Optional"}</small></div>`).join("");
    host.innerHTML=`
      ${active?`<section class="card training-hub-active"><div><span class="metric-label">In Progress</span><h3>${esc(typeof bellWorkoutDisplayLabel==="function"?bellWorkoutDisplayLabel(active):(active.label||active.name||"Workout"))}</h3><p>Continue where you left off. Your timer and completed sets are saved.</p></div><button class="good" type="button" id="trainingHubResume">Resume Workout</button></section>`:""}
      <section class="card training-hub-today">
        <div class="training-hub-title"><div><span class="metric-label">Today’s Mission</span><h3>${esc(title)}</h3><p>${required.length?`${model.requiredMinutes||model.available} minutes of required work. Optional Core and Mobility remain separate.`:"Recovery, mobility, and normal daily movement."}</p></div><button class="good" type="button" id="trainingHubOpenMission">Open Today’s Mission</button></div>
        <div class="training-hub-rows">${statusRows||'<div class="training-hub-empty">No scheduled training sessions today.</div>'}</div>
      </section>`;
    document.getElementById("trainingHubResume")?.addEventListener("click",resumeActive);
    document.getElementById("trainingHubOpenMission")?.addEventListener("click",openTodayMission);
  }
  window.openTodayMission=openTodayMission;
  window.renderTrainingHub=renderTrainingHub;
  document.addEventListener("DOMContentLoaded",()=>{
    window.setTimeout(renderTrainingHub,80);
    document.querySelectorAll('button[data-screen="workouts"]').forEach(button=>button.addEventListener("click",()=>window.setTimeout(renderTrainingHub,0)));
  });
})();
