"use strict";
(function(){
  const VERSION="13.22.6";
  const LABEL="13.22.6 · Coach’s Dashboard";
  const HINT="The dashboard greeting now includes the Word of the Day and today’s mission-specific coaching focus.";
  function updateBuild(){
    window.BELL_APP_VERSION="13.22.6-coachs-dashboard";
    const app=document.getElementById("settingsAppVersion");if(app)app.textContent=VERSION;
    const card=document.querySelector(".bp-build-card");
    const build=card?.querySelector("strong");const hint=card?.querySelector(".hint");
    if(build)build.textContent=LABEL;if(hint)hint.textContent=HINT;
  }
  updateBuild();document.addEventListener("DOMContentLoaded",updateBuild,{once:true});setTimeout(updateBuild,100);setTimeout(updateBuild,500);
  window.BellCoachDashboard={version:VERSION,updateBuild};
})();
