"use strict";
(function(){
  const VERSION="13.22.5";
  const LABEL="13.22.5 · Mission Location & Engine Selectors";
  const HINT="Today’s Mission again lets the athlete select the active training location for strength and the modality for engine work.";
  function updateBuild(){
    window.BELL_APP_VERSION="13.22.5-mission-location-engine-selectors";
    const card=document.querySelector(".bp-build-card");
    const build=card?.querySelector("strong");
    const hint=card?.querySelector(".hint");
    if(build)build.textContent=LABEL;
    if(hint)hint.textContent=HINT;
  }
  updateBuild();
  document.addEventListener("DOMContentLoaded",updateBuild,{once:true});
  window.setTimeout(updateBuild,0);
  window.setTimeout(updateBuild,250);
  window.BellMissionSetupSelectors={version:VERSION,updateBuild};
})();
