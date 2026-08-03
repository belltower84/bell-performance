"use strict";

// Wrap existing local-first workflows without changing their visual behavior.
(function installBellCoreHooks() {
  const originalOnboarding = window.completeOnboarding;
  if (typeof originalOnboarding === "function") {
    window.completeOnboarding = function bellIntegratedOnboarding() {
      const before = Boolean(data.settings.coachMessages?.setupComplete);
      const result = originalOnboarding.apply(this, arguments);
      if (bellCloudConnected() && data.settings.coachMessages?.setupComplete) {
        bellRunInBackground(async () => {
          if (!before || !bellCloud.athleteId) await bellEnsureAthlete();
          await bellSyncMissionAndPlan();
        });
      }
      return result;
    };
  }

  ["saveReadiness", "saveDailyReadinessPrompt"].forEach(name => {
    const original = window[name];
    if (typeof original !== "function") return;
    window[name] = function bellIntegratedReadiness() {
      const result = original.apply(this, arguments);
      if (bellCloudConnected()) bellRunInBackground(bellSubmitReadiness);
      return result;
    };
  });

  const originalComplete = window.completeWorkout;
  if (typeof originalComplete === "function") {
    window.completeWorkout = function bellIntegratedCompletion() {
      const activeIdentity=data.activeWorkout?{planId:data.activeWorkout.planId,sessionKey:data.activeWorkout.planSessionKey,name:data.activeWorkout.name}:null;
      const result = originalComplete.apply(this, arguments);
      if (activeIdentity && bellCloudConnected()) {
        const completed=(data.history||[]).find(item=>String(item.planId||"")===String(activeIdentity.planId||"")&&String(item.planSessionKey||"")===String(activeIdentity.sessionKey||""))||(data.history||[])[0];
        if(completed)bellRunInBackground(() => bellCompleteCurrentSession(completed));
      }
      return result;
    };
  }
})();
