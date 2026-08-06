"use strict";
(function(){
  const VERSION="13.22.7";
  const BUILD="13.22.7-github-pages-refresh-repair";
  const LABEL="13.22.7 · GitHub Pages Refresh Repair";
  const HINT="Coach’s Dashboard is active, and build identity plus service-worker delivery are synchronized for GitHub Pages.";

  function applyBuildIdentity(){
    window.BELL_APP_VERSION=BUILD;
    const app=document.getElementById("settingsAppVersion");
    if(app) app.textContent=VERSION;
    const card=document.querySelector(".bp-build-card");
    const build=card?.querySelector("strong");
    const hint=card?.querySelector(".hint");
    if(build) build.textContent=LABEL;
    if(hint) hint.textContent=HINT;
    document.documentElement.dataset.bellBuild=VERSION;
  }

  applyBuildIdentity();
  document.addEventListener("DOMContentLoaded",applyBuildIdentity,{once:true});
  window.addEventListener("load",applyBuildIdentity,{once:true});
  setTimeout(applyBuildIdentity,100);
  setTimeout(applyBuildIdentity,750);

  window.BellDeploymentRefresh={version:VERSION,build:BUILD,applyBuildIdentity};
})();
