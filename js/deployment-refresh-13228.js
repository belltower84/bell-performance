"use strict";
(function(){
  const VERSION="13.22.8";
  const BUILD="13.22.8-github-pages-deployment-repair";
  const LABEL="13.22.8 · GitHub Pages Deployment Repair";
  const HINT="Coach’s Dashboard is active. GitHub Pages now uses a stable service worker, resilient caching, and a profile-safe refresh route.";

  function applyBuildIdentity(){
    window.BELL_APP_VERSION=BUILD;
    window.BELL_CACHE_NAME="bell-performance-13-22-8";
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

  window.BellDeploymentRefresh={version:VERSION,build:BUILD,cacheName:"bell-performance-13-22-8",applyBuildIdentity};
})();
