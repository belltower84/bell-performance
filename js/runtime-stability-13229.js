"use strict";
(function(){
  const VERSION="13.22.10";
  const BUILD="13.22.10-github-actions-deployment";
  const LABEL="13.22.10 · GitHub Actions Deployment";
  const HINT="Stable runtime baseline for continued Bell Performance development, with competing build observers removed and resilient network-first updates retained.";

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
