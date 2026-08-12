"use strict";
(function(){
  const VERSION="13.22.15";
  const BUILD="13.22.15-execution-integrity-engine-flow";
  const LABEL="13.22.15 · Execution Integrity & Engine Flow";
  const HINT="Engine sessions explicitly identify their training type and can adapt modality to the selected location and available equipment without changing the intended stimulus.";

  function applyBuildIdentity(){
    window.BELL_BUILD_IDENTITY_LOCK=true;
    window.BELL_APP_VERSION=BUILD;
    document.querySelectorAll("[data-app-version]").forEach(node=>node.textContent=`Bell Performance ${BUILD}`);
    const card=document.querySelector(".bp-build-card");
    const strong=card?.querySelector("strong");
    const hint=card?.querySelector(".hint");
    if(strong)strong.textContent=LABEL;
    if(hint)hint.textContent=HINT;
  }

  applyBuildIdentity();
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",applyBuildIdentity,{once:true});
  setTimeout(applyBuildIdentity,100);
  setTimeout(applyBuildIdentity,800);
  window.BellRuntimeStability={version:VERSION,build:BUILD,applyBuildIdentity};
})();
