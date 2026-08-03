"use strict";

/* Bell Performance 13.7.4 — Guided Tour Visibility & Focus */
const HOW_TO_KEY = "bellPerformanceHowToSeenV9";
const howToSlides = [
  {
    kicker: "Welcome to Bell",
    icon: "B",
    title: "One clear training decision at a time",
    body: "Bell Performance turns your Journey, readiness, schedule, and training history into a practical plan for today.",
    points: ["Start on the Dashboard each day.", "Gold marks the action that matters next."],
    screen: "home",
    target: null,
    centered: true
  },
  {
    kicker: "Daily Check-In",
    icon: "⌁",
    title: "Tell Bell what you can handle today",
    body: "The 10-second check-in records sleep, body condition, energy, pain concerns, and available time before you train.",
    points: ["Bell Coach may adjust today’s prescription.", "Update it whenever your condition changes."],
    screen: "home",
    target: "#b135ReadinessCard"
  },
  {
    kicker: "Today’s Mission",
    icon: "▶",
    title: "This is your main route into training",
    body: "Today’s Mission shows the prescribed work, estimated duration, priority, and any readiness-based adjustment in one place.",
    points: ["Start Workout opens the correct session.", "Use View Session when you want the details first."],
    screen: "home",
    target: ".b135-primary"
  },
  {
    kicker: "Bell Coach",
    icon: "☊",
    title: "Understand why today matters",
    body: "Today’s Briefing explains the purpose of the session and keeps the workout aligned with your selected Journey and training phase.",
    points: ["Use View rationale for more context.", "The coaching direction should match the workout you receive."],
    screen: "home",
    target: "#b135GuidanceCard"
  },
  {
    kicker: "Weekly Plan",
    icon: "▣",
    title: "See the week before life changes it",
    body: "The Weekly Plan previews training, recovery, and completed work. Open it when availability changes or you need more context than today’s card provides.",
    points: ["Current and completed days remain visible.", "Missed work should be handled—not blindly stacked."],
    screen: "home",
    target: ".b135-week-card"
  },
  {
    kicker: "Workouts",
    icon: "⚒",
    title: "Execute, record, and finish honestly",
    body: "The Workouts screen contains your current rotation and access to the Exercise Library. Log the work you actually complete so Bell has useful training data.",
    points: ["Record loads, reps, effort, and notes.", "Use movement guides or substitutions when needed."],
    screen: "workouts",
    target: "#workouts .section-heading"
  },
  {
    kicker: "Primary Navigation",
    icon: "⌂",
    title: "Everything else supports the daily mission",
    body: "Use Calendar to understand the week, Performance to review trends, and Settings to update your athlete profile, Journey, equipment, or coaching behavior.",
    points: ["Your completed history stays intact when settings change.", "Replay this tour from Settings → Help."],
    screen: "home",
    target: ".app-nav",
    mobilePosition: "top"
  },
  {
    kicker: "Ready",
    icon: "✓",
    title: "Your dashboard is ready",
    body: "The daily rhythm is simple: check in, understand the direction, execute the session, and record what actually happened.",
    points: ["Begin with Today’s Mission.", "Report anything confusing, incorrect, or blocked during testing."],
    screen: "home",
    target: null,
    centered: true,
    finish: true
  }
];

let howToIndex = 0;
let firstFlightTourActive = false;
let activeTourTarget = null;
let howToReturnScreen = "home";
let tourPositionFrame = null;
let tourGeometryTimers = [];

function activeScreenName() {
  return document.querySelector(".screen.active")?.id || "home";
}

function clearHowToTarget() {
  if (activeTourTarget) {
    activeTourTarget.classList.remove("tour-highlight");
    activeTourTarget.removeAttribute("data-tour-active");
    activeTourTarget = null;
  }
  tourGeometryTimers.forEach(timer => window.clearTimeout(timer));
  tourGeometryTimers = [];
  const spotlight = document.getElementById("howToSpotlight");
  if (spotlight) {
    spotlight.classList.remove("is-visible");
    spotlight.style.left = "";
    spotlight.style.top = "";
    spotlight.style.width = "";
    spotlight.style.height = "";
  }
  document.body.classList.remove("tour-active");
  const modal = document.getElementById("howToModal");
  if (modal) {
    modal.classList.remove("tour-centered", "tour-mobile-top");
    modal.removeAttribute("data-placement");
  }
}

function clampTourPosition(value, minimum, maximum) {
  return Math.max(minimum, Math.min(maximum, value));
}

function positionHowToSpotlight() {
  const spotlight = document.getElementById("howToSpotlight");
  const modal = document.getElementById("howToModal");
  if (!spotlight || !modal || modal.classList.contains("hidden") || !activeTourTarget) {
    spotlight?.classList.remove("is-visible");
    return;
  }

  const rect = activeTourTarget.getBoundingClientRect();
  if (!rect.width || !rect.height) {
    spotlight.classList.remove("is-visible");
    return;
  }

  const mobile = window.matchMedia("(max-width: 760px)").matches;
  const padding = mobile ? 5 : 8;
  const left = clampTourPosition(rect.left - padding, 4, window.innerWidth - 8);
  const top = clampTourPosition(rect.top - padding, 4, window.innerHeight - 8);
  const right = clampTourPosition(rect.right + padding, 8, window.innerWidth - 4);
  const bottom = clampTourPosition(rect.bottom + padding, 8, window.innerHeight - 4);
  const radius = parseFloat(window.getComputedStyle(activeTourTarget).borderRadius) || (mobile ? 16 : 18);

  spotlight.style.left = `${left}px`;
  spotlight.style.top = `${top}px`;
  spotlight.style.width = `${Math.max(12, right - left)}px`;
  spotlight.style.height = `${Math.max(12, bottom - top)}px`;
  spotlight.style.borderRadius = `${Math.min(28, Math.max(14, radius + padding))}px`;
  spotlight.classList.add("is-visible");
}

function scheduleHowToGeometry(slide, delays = [0, 90, 220, 420]) {
  tourGeometryTimers.forEach(timer => window.clearTimeout(timer));
  tourGeometryTimers = delays.map(delay => window.setTimeout(() => {
    positionHowToSpotlight();
    positionHowToPanel(slide, { skipScroll: delay > 0 });
  }, delay));
}

function scrollTargetIntoTourView(target, panel, mobileTop) {
  if (!target || !panel) return;
  const rect = target.getBoundingClientRect();
  const mobile = window.matchMedia("(max-width: 760px)").matches;

  if (!mobile) {
    const safeTop = 84;
    const safeBottom = window.innerHeight - 42;
    if (rect.top < safeTop || rect.bottom > safeBottom) {
      target.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
    }
    return;
  }

  const panelHeight = Math.min(panel.offsetHeight || 320, window.innerHeight * 0.58);
  const safeTop = mobileTop ? panelHeight + 28 : 76;
  const safeBottom = mobileTop ? window.innerHeight - 92 : window.innerHeight - panelHeight - 28;
  const availableHeight = Math.max(120, safeBottom - safeTop);
  let delta = 0;
  if (rect.height > availableHeight) delta = rect.top - safeTop;
  else if (rect.top < safeTop) delta = rect.top - safeTop;
  else if (rect.bottom > safeBottom) delta = rect.bottom - safeBottom;
  if (Math.abs(delta) > 4) window.scrollBy({ top: delta, behavior: "smooth" });
}

function positionHowToPanel(slide, options = {}) {
  const modal = document.getElementById("howToModal");
  const panel = document.getElementById("howToPanel");
  if (!modal || !panel || modal.classList.contains("hidden")) return;

  panel.style.left = "";
  panel.style.right = "";
  panel.style.top = "";
  panel.style.bottom = "";
  modal.classList.toggle("tour-mobile-top", slide.mobilePosition === "top");

  if (slide.centered || !activeTourTarget) {
    modal.classList.add("tour-centered");
    modal.dataset.placement = "center";
    document.getElementById("howToSpotlight")?.classList.remove("is-visible");
    return;
  }

  modal.classList.remove("tour-centered");
  const mobile = window.matchMedia("(max-width: 760px)").matches;
  if (mobile) {
    modal.dataset.placement = slide.mobilePosition === "top" ? "top" : "bottom";
    if (!options.skipScroll) scrollTargetIntoTourView(activeTourTarget, panel, slide.mobilePosition === "top");
    positionHowToSpotlight();
    return;
  }

  const targetRect = activeTourTarget.getBoundingClientRect();
  const panelRect = panel.getBoundingClientRect();
  const gap = 24;
  const edge = 20;
  const candidates = [
    { placement: "right", left: targetRect.right + gap, top: targetRect.top + targetRect.height / 2 - panelRect.height / 2 },
    { placement: "left", left: targetRect.left - panelRect.width - gap, top: targetRect.top + targetRect.height / 2 - panelRect.height / 2 },
    { placement: "bottom", left: targetRect.left + targetRect.width / 2 - panelRect.width / 2, top: targetRect.bottom + gap },
    { placement: "top", left: targetRect.left + targetRect.width / 2 - panelRect.width / 2, top: targetRect.top - panelRect.height - gap }
  ];

  const overlapArea = candidate => {
    const left = Math.max(candidate.left, targetRect.left);
    const right = Math.min(candidate.left + panelRect.width, targetRect.right);
    const top = Math.max(candidate.top, targetRect.top);
    const bottom = Math.min(candidate.top + panelRect.height, targetRect.bottom);
    return Math.max(0, right - left) * Math.max(0, bottom - top);
  };
  const overflow = candidate =>
    Math.max(0, edge - candidate.left) +
    Math.max(0, candidate.left + panelRect.width - (window.innerWidth - edge)) +
    Math.max(0, edge - candidate.top) +
    Math.max(0, candidate.top + panelRect.height - (window.innerHeight - edge));

  const fit = candidates
    .map((candidate, index) => ({ ...candidate, score: overflow(candidate) * 10000 + overlapArea(candidate) + index }))
    .sort((a, b) => a.score - b.score)[0];

  panel.style.left = `${clampTourPosition(fit.left, edge, Math.max(edge, window.innerWidth - panelRect.width - edge))}px`;
  panel.style.top = `${clampTourPosition(fit.top, edge, Math.max(edge, window.innerHeight - panelRect.height - edge))}px`;
  modal.dataset.placement = fit.placement;
  if (!options.skipScroll) scrollTargetIntoTourView(activeTourTarget, panel, false);
  positionHowToSpotlight();
}

function applyHowToTarget(slide) {
  clearHowToTarget();
  if (slide.screen && typeof showScreen === "function") showScreen(slide.screen);
  window.requestAnimationFrame(() => {
    const target = slide.target ? document.querySelector(slide.target) : null;
    if (target && target.getClientRects().length) {
      activeTourTarget = target;
      target.classList.add("tour-highlight");
      target.setAttribute("data-tour-active", "true");
      document.body.classList.add("tour-active");
    }
    window.requestAnimationFrame(() => scheduleHowToGeometry(slide));
  });
}

function openHowToGuide(startIndex = 0, options = {}) {
  firstFlightTourActive = Boolean(options.firstFlight || options.resumeFirstFlight);
  howToReturnScreen = firstFlightTourActive ? "home" : activeScreenName();
  howToIndex = Math.max(0, Math.min(howToSlides.length - 1, Number(startIndex) || 0));
  const modal = document.getElementById("howToModal");
  if (!modal) return;
  modal.classList.remove("hidden");
  document.body.classList.add("modal-open", "guided-tour-open");
  renderHowToSlide();
  window.setTimeout(() => document.getElementById("howToPanel")?.focus(), 60);
}

function launchFirstFlightTour() {
  openHowToGuide(0, { firstFlight: true });
}

function finishHowToGuide() {
  clearHowToTarget();
  const modal = document.getElementById("howToModal");
  if (modal) modal.classList.add("hidden");
  document.body.classList.remove("modal-open", "guided-tour-open");
  localStorage.setItem(HOW_TO_KEY, "1");

  if (firstFlightTourActive) {
    firstFlightTourActive = false;
    data.settings.firstFlightTourComplete = true;
    data.settings.pendingFirstFlightTour = false;
    data.settings.firstFlightStage = "complete";
    saveData({ render: false });
    if (typeof showScreen === "function") showScreen("home");
    if (typeof renderApp === "function") renderApp();
    else if (typeof renderBellCommercialHome === "function") renderBellCommercialHome();
    window.scrollTo(0, 0);
    return;
  }

  if (typeof showScreen === "function") showScreen(howToReturnScreen || "home");
}

function closeHowToGuide() {
  finishHowToGuide();
}

function skipHowToGuide() {
  finishHowToGuide();
}

function renderHowToSlide() {
  const slide = howToSlides[howToIndex];
  const panel = document.getElementById("howToPanel");
  const slideRoot = document.getElementById("howToSlide");
  if (!slideRoot || !panel) return;

  const pointMarkup = Array.isArray(slide.points) && slide.points.length
    ? `<ul class="guided-tour-points">${slide.points.slice(0, 2).map(point => `<li>${point}</li>`).join("")}</ul>`
    : "";

  document.getElementById("howToKicker").textContent = slide.kicker;
  document.getElementById("howToStepCount").textContent = `${howToIndex + 1} of ${howToSlides.length}`;
  document.getElementById("howToTitle").textContent = slide.title;
  document.getElementById("howToProgress").style.width = `${((howToIndex + 1) / howToSlides.length) * 100}%`;
  slideRoot.innerHTML = `
    <div class="guided-tour-icon" aria-hidden="true">${slide.icon || "B"}</div>
    <div class="guided-tour-copy">
      <h2 id="howToTitle">${slide.title}</h2>
      <p>${slide.body}</p>
      ${pointMarkup}
    </div>`;

  const back = document.getElementById("howToBack");
  const next = document.getElementById("howToNext");
  if (back) back.disabled = howToIndex === 0;
  if (next) next.textContent = slide.finish ? "Go to Dashboard" : "Next";
  panel.dataset.step = String(howToIndex + 1);
  applyHowToTarget(slide);
}

function nextHowToSlide() {
  if (howToIndex >= howToSlides.length - 1) {
    finishHowToGuide();
    return;
  }
  howToIndex += 1;
  renderHowToSlide();
}

function previousHowToSlide() {
  if (howToIndex <= 0) return;
  howToIndex -= 1;
  renderHowToSlide();
}

function goToHowToSlide(index) {
  howToIndex = Math.max(0, Math.min(howToSlides.length - 1, Number(index) || 0));
  renderHowToSlide();
}

/* Kept as harmless compatibility hooks for older saved markup. */
function toggleHowToAutoplay() {}
function startHowToAutoplay() {}
function stopHowToAutoplay() {}

function hasSeenHowToGuide() {
  return localStorage.getItem(HOW_TO_KEY) === "1";
}

function maybeShowHowToGuideAfterProfileSetup() {
  if (hasSeenHowToGuide()) return;
  window.setTimeout(() => openHowToGuide(0), 350);
}

function refreshHowToGeometry() {
  window.cancelAnimationFrame(tourPositionFrame);
  tourPositionFrame = window.requestAnimationFrame(() => {
    const slide = howToSlides[howToIndex];
    if (!document.getElementById("howToModal")?.classList.contains("hidden")) {
      positionHowToSpotlight();
      positionHowToPanel(slide, { skipScroll: true });
    }
  });
}

window.addEventListener("resize", refreshHowToGeometry);
window.addEventListener("scroll", refreshHowToGeometry, { passive: true });

window.addEventListener("keydown", event => {
  const modal = document.getElementById("howToModal");
  if (!modal || modal.classList.contains("hidden")) return;
  if (event.key === "Escape") skipHowToGuide();
  if (event.key === "ArrowRight") nextHowToSlide();
  if (event.key === "ArrowLeft") previousHowToSlide();
});
