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
      const snapshot = data.activeWorkout ? JSON.parse(JSON.stringify(data.activeWorkout)) : null;
      const result = originalComplete.apply(this, arguments);
      if (snapshot && bellCloudConnected()) {
        snapshot.completedAt = snapshot.completedAt || new Date().toISOString();
        snapshot.sessionRpe = Number(document.getElementById("sessionRpe")?.value) || 7;
        snapshot.notes = document.getElementById("sessionNotes")?.value || "";
        bellRunInBackground(() => bellCompleteCurrentSession(snapshot));
      }
      return result;
    };
  }
})();
