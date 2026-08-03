"use strict";
/* Bell Performance 13.8.5 — mission edits always return to First Flight page 2. */
(function(){
  function openMissionPageTwo(){
    try{missionEditorActive=true;}catch(_){}
    if(typeof openFirstFlight==="function")openFirstFlight(1);
  }
  function resetMissionThroughFirstFlight(){
    if(!confirm("Review and rebuild the active mission? Workout history, settings, equipment, and progress records will be preserved."))return;
    openMissionPageTwo();
  }
  function updateLabels(){
    document.querySelectorAll('button[onclick*="openMissionEditor"]').forEach(button=>{
      if(/edit mission|edit mission \/ event|edit mission or event/i.test(button.textContent||""))button.textContent="Edit Mission / Event";
    });
    document.querySelectorAll('button[onclick*="startFreshBlockFromCurrentMission"]').forEach(button=>button.textContent="Reset / Rebuild Mission");
  }
  window.openMissionEditor=openMissionPageTwo;
  window.startFreshBlockFromCurrentMission=resetMissionThroughFirstFlight;
  document.addEventListener("DOMContentLoaded",updateLabels);
  const prior=window.renderSettings;
  if(typeof prior==="function")window.renderSettings=function(){const result=prior.apply(this,arguments);updateLabels();return result;};
})();
