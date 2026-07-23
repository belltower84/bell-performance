"use strict";

const BELL_APP_VERSION = window.BELL_APP_VERSION || "7.0.28";

function renderAppVersion() {
  document.querySelectorAll("[data-app-version]").forEach(element => {
    element.textContent = `Bell Performance ${BELL_APP_VERSION}`;
  });
  const onboardingVersion = document.getElementById("onboardingVersion");
  if (onboardingVersion) onboardingVersion.textContent = `Bell Performance ${BELL_APP_VERSION}`;
}

function todayKey() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function getDailyQuote() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const day = Math.floor((now - start) / 86400000);
  return motivationalQuotes[day % motivationalQuotes.length];
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("nav button[data-screen]").forEach(button => {
    button.addEventListener("click", () => showScreen(button.dataset.screen));
  });

  renderAppVersion();
  renderApp();
  setTimeout(() => { maybePromptDailyReadiness(); openPendingSessionFeedback(); }, 250);

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js").catch(error => {
      console.warn("Service worker registration failed:", error);
    });
  }
});

// 6.4 rebuilt: keep artwork failures isolated instead of allowing a broken asset
// or stale cache to disrupt the entire page.
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("img").forEach(image => {
    image.addEventListener("error", () => {
      if (image.closest(".brand-lockup")) return;
      image.style.display = "none";
      const card = image.closest(".training-card, .workout-hero");
      if (card) card.classList.add("artwork-unavailable");
    }, { once: true });
  });
  if ("caches" in window) {
    caches.keys().then(keys => Promise.all(
      keys.filter(key => key.startsWith("bell-performance-") && key !== `bell-performance-${BELL_APP_VERSION}`)
          .map(key => caches.delete(key))
    )).catch(() => {});
  }
});
