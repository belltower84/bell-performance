"use strict";

/* Bell Performance 13.22.4 — Visible General Warm-Up Modality
   Shows the prescribed bike, rower, air bike, treadmill, walk, or jog option
   directly on the warm-up card instead of hiding it inside the movement guide. */
(function(){
  const VERSION="13.22.4";

  function modalityFrom(item){
    const explicit=String(item?.modality||"").trim();
    if(explicit)return explicit;

    const detail=String(item?.detail||"").trim();
    const parts=detail.split(/\s+[·•|]\s+/).map(part=>part.trim()).filter(Boolean);
    if(parts.length>1&&/^\d+\s*(?:min|minute)/i.test(parts[0]))return parts.slice(1).join(" · ");

    const currentTitle=String(item?.title||"").trim();
    if(currentTitle&&!/^(?:5[- ]minute general warm[- ]up|general warm[- ]up|raise)$/i.test(currentTitle))return currentTitle;

    return "Choose: Bike, Air Bike, Rower, or Easy Walk/Jog";
  }

  function makeVisible(item){
    if(!item||item.kind!=="general-warmup")return item;
    const modality=modalityFrom(item);
    return {
      ...item,
      sessionTitle:item.sessionTitle||"5-Minute General Warm-Up",
      modality,
      title:modality,
      dose:item.dose||"5 minutes",
      detail:item.detail||`5 minutes · ${modality}`
    };
  }

  const existingBlueprint=(typeof window.bellWarmupBlueprint==="function")
    ? window.bellWarmupBlueprint
    : (typeof bellWarmupBlueprint==="function"?bellWarmupBlueprint:null);

  if(existingBlueprint&&!existingBlueprint.__bp13224Wrapped){
    const wrapped=function(active){
      const items=existingBlueprint(active);
      return Array.isArray(items)?items.map(makeVisible):items;
    };
    wrapped.__bp13224Wrapped=true;
    window.bellWarmupBlueprint=wrapped;
    try{bellWarmupBlueprint=wrapped;}catch(_){/* global lexical binding may be unavailable */}
  }

  function refreshWarmup(){
    try{
      const panel=document.getElementById("warmupPanel");
      if(panel&&!panel.classList.contains("hidden")&&typeof window.renderWarmupPanel==="function"){
        window.renderWarmupPanel();
      }
    }catch(_){/* no active workout */}
  }

  function init(){
    // The feature only updates the visible warm-up modality. Build identity is
    // intentionally left to the final release module to avoid observer loops.
    refreshWarmup();
  }

  window.BellVisibleWarmupModality={version:VERSION,modalityFrom,makeVisible};
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});
  else init();
})();
