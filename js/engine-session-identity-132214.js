"use strict";
/* Bell Performance 13.22.14 — Engine Session Identity Consistency
   Repairs legacy planned Engine sessions whose display label/detail indicates one
   physiological session type while the stored R-* mission points to another. */
(function(){
  const VERSION="13.22.14";
  function text(item){return `${item?.customLabel||item?.label||""} ${item?.detail||""} ${item?.mission||""}`.toLowerCase();}
  function canonicalMission(item){
    const t=text(item);
    if(/long\s+(run|ride|aerobic)|durability|progressive endurance|fueling/.test(t))return "R-5 Long Run";
    if(/quality|interval|threshold|tempo|repeat|goal-specific|vo2|vo₂/.test(t))return "R-4 Intervals";
    if(/recovery/.test(t)&&!/(quality|interval|threshold|tempo)/.test(t))return "R-1 Recovery Run";
    if(/easy|zone\s*2|aerobic base|conversational/.test(t))return "R-2 Easy Run";
    return null;
  }
  function repairItem(item){
    if(!item||typeof item!=="object")return false;
    let changed=false;
    const expected=canonicalMission(item);
    if(expected&&/^R-/i.test(String(item.mission||""))&&String(item.mission)!==expected){item.mission=expected;changed=true;}
    if(item.secondaryMission){
      const pseudo={mission:item.secondaryMission,customLabel:item.secondaryLabel,detail:item.secondaryDetail};
      const secondary=canonicalMission(pseudo);
      if(secondary&&/^R-/i.test(String(item.secondaryMission))&&String(item.secondaryMission)!==secondary){item.secondaryMission=secondary;changed=true;}
    }
    if(Array.isArray(item.sessions))item.sessions.forEach(s=>{if(repairItem(s))changed=true;});
    return changed;
  }
  function repairPlan(){
    if(!window.data)return false;
    let changed=false;
    if(Array.isArray(data.plan))data.plan.forEach(item=>{if(repairItem(item))changed=true;});
    if(Array.isArray(data.upcomingPlan))data.upcomingPlan.forEach(item=>{if(repairItem(item))changed=true;});
    if(changed&&typeof saveData==="function")saveData({render:false});
    return changed;
  }
  window.bellRepairEngineSessionIdentity=repairPlan;
  repairPlan();
  document.addEventListener("DOMContentLoaded",()=>{repairPlan();setTimeout(repairPlan,250);});
  window.BellEngineSessionIdentity={version:VERSION,repairPlan,canonicalMission};
})();
