"use strict";

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

  renderApp();

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js").catch(error => {
      console.warn("Service worker registration failed:", error);
    });
  }
});
