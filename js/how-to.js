"use strict";

const HOW_TO_KEY = "bellPerformanceHowToSeenV5";
const howToSlides = [
  {kicker:"Welcome aboard",title:"This is your main dashboard",body:"The dashboard is Bell Performance's daily command center. Start here each day to see your mission, recovery status, prescribed training, active location, and recovery work.",bullets:["The dashboard opens first after profile setup.","Read the Mission Status before choosing extra work.","Strength, Engine, readiness, and recovery are coordinated here."],image:"./assets/artwork/engine/mountain-trail.jpg?v=707",visual:"Dashboard",detail:"Assess first. Train second.",screen:"home",target:".dashboard-greeting"},
  {kicker:"Daily readiness",title:"Tap Update Check-In here",body:"Use the Update Check-In button inside Mission Status. Five quick answers—sleep, soreness, energy, motivation, and available time—set today's Green, Yellow, or Red status and adjust the prescription.",metrics:[["Sleep","1–5"],["Soreness","1–5"],["Energy","1–5"],["Motivation","1–5"]],image:"./assets/artwork/engine/forest-trail.jpg?v=707",visual:"Update Check-In",detail:"The button is at the top of Mission Status.",screen:"home",target:"#trainingStatusCard",panelPosition:"left"},
  {kicker:"Daily mobility",title:"Recovery work is part of the plan",body:"Today's Recovery Prescription previews the mobility focus matched to your training. Scroll to Daily Mobility to change the focus or duration, check off each movement, and tap Complete Daily Mobility to log it.",bullets:["Auto matches mobility to today's training demand.","Choose 6, 10, or 15 minutes.","Completion is tracked and earns consistency credit."],image:"./assets/artwork/engine/alpine-lake.jpg?v=707",visual:"Daily Mobility",detail:"Matched work, not random stretching.",screen:"home",target:"#dailyMobilityCard"},
  {kicker:"Dual mission",title:"Set two coordinated goals",body:"The Goal Builder pairs one Strength discipline with one Engine outcome. Bell Performance coordinates the workload instead of treating conditioning as random extra work.",bullets:["Choose the outcomes that matter now.","Set training days and session limits.","Coach Decides can manage same-day versus split work."],image:"./assets/artwork/strength/strength-building.jpg?v=707",visual:"Strength + Engine",detail:"One coordinated training block.",screen:"more",target:".dual-goal-builder"},
  {kicker:"Training",title:"Use Today's Mission or the Training tab",body:"Start the prescribed Strength or Engine session from the dashboard. The Training tab holds the complete session library when you need to browse the current rotation.",bullets:["Today's Mission is the fastest route.","Training contains Strength and Engine together.","The active workout location controls substitutions."],image:"./assets/artwork/strength/powerlifting.jpg?v=707",visual:"Training Library",detail:"Purpose stays intact when equipment changes.",screen:"home",target:".training-pair"},
  {kicker:"Workout locations",title:"Tell the app where you are training",body:"The active Workout Location tells Bell Performance which equipment is available. First Flight will open the full editor after this tour so you can build home, commercial, travel, or custom setups.",bullets:["Switch locations before starting a workout.","Unavailable exercises receive purpose-matched substitutions.","You can edit locations later under More."],image:"./assets/artwork/strength/upper-body.jpg?v=707",visual:"Workout Location",detail:"Your environment changes. The mission does not.",screen:"home",target:".strength-location-control"},
  {kicker:"Exercise logging",title:"Log the work you actually complete",body:"During Strength training, enter the real load and reps, then report whether the movement was Too Easy, Just Right, Too Heavy, or affected by pain or technique.",feedback:["Too Easy","Just Right","Too Heavy","Pain / Technique"],image:"./assets/artwork/strength/power-performance.jpg?v=707",visual:"Progression Engine",detail:"Honest inputs improve the next prescription.",screen:"home",target:".training-pair"},
  {kicker:"Training debrief",title:"Finish every session with feedback",body:"The post-session debrief records session quality, energy afterward, overall condition, and strain. It feeds your rolling seven-day readiness and helps control future loading.",bullets:["Note unusual fatigue or excellent performance.","Recovery feedback can prevent unnecessary load increases.","Concerning symptoms require appropriate care, not a lower readiness score."],image:"./assets/artwork/engine/ridge-run.jpg?v=707",visual:"Debrief",detail:"Tomorrow's plan starts here.",screen:"home",target:".weekly-readiness-card"},
  {kicker:"Tour complete",title:"Return to First Flight",body:"You now know the daily flow: assess, train, debrief, recover, and adapt. Next, First Flight will help you build workout locations, set your Dual Mission goals, and choose your coaching voice.",bullets:["Set up every place you regularly train.","Choose your Strength and Engine goals.","Review the setup and launch Bell Performance."],image:"./assets/artwork/engine/alpine-lake.jpg?v=707",visual:"Continue Setup",detail:"The tour can be replayed anytime from Help.",screen:"home",target:".strength-location-control"}
];
let howToIndex=0;
let howToTimer=null;
let resumeFirstFlightAfterTour=false;
let activeTourTarget=null;

function clearHowToTarget(){if(activeTourTarget){activeTourTarget.classList.remove("tour-highlight");activeTourTarget=null;}document.body.classList.remove("tour-active");const modal=document.getElementById("howToModal");if(modal)modal.classList.remove("tour-panel-left");}
function applyHowToTarget(slide){
  clearHowToTarget();
  const modal=document.getElementById("howToModal");
  if(modal&&slide.panelPosition==="left")modal.classList.add("tour-panel-left");
  if(slide.screen&&typeof showScreen==="function")showScreen(slide.screen);
  const target=slide.target?document.querySelector(slide.target):null;
  if(!target)return;
  activeTourTarget=target;target.classList.add("tour-highlight");document.body.classList.add("tour-active");
  window.setTimeout(()=>target.scrollIntoView({behavior:"smooth",block:"center"}),80);
}
function openHowToGuide(startIndex=0,options={}){
  resumeFirstFlightAfterTour=Boolean(options.resumeFirstFlight);
  howToIndex=Math.max(0,Math.min(howToSlides.length-1,Number(startIndex)||0));
  document.getElementById("howToModal")?.classList.remove("hidden");
  document.body.classList.add("modal-open");renderHowToSlide();
}
function launchFirstFlightTour(){openHowToGuide(0,{resumeFirstFlight:true});}
function closeHowToGuide(){
  stopHowToAutoplay();clearHowToTarget();
  document.getElementById("howToModal")?.classList.add("hidden");document.body.classList.remove("modal-open");localStorage.setItem(HOW_TO_KEY,"1");
  if(resumeFirstFlightAfterTour){
    resumeFirstFlightAfterTour=false;data.settings.firstFlightTourComplete=true;data.settings.firstFlightStage="configure";saveData({render:false});
    window.setTimeout(()=>openFirstFlight(2),180);
  }
}
function renderHowToSlide(){
  const slide=howToSlides[howToIndex];applyHowToTarget(slide);
  const extras=slide.metrics?`<div class="guide-metric-grid">${slide.metrics.map(x=>`<div class="guide-metric"><span>${x[0]}</span><b>${x[1]}</b></div>`).join("")}</div>`:slide.feedback?`<div class="guide-feedback">${slide.feedback.map(x=>`<span>${x}</span>`).join("")}</div>`:slide.bullets?`<ul>${slide.bullets.map(x=>`<li>${x}</li>`).join("")}</ul>`:"";
  document.getElementById("howToSlide").innerHTML=`<div class="how-to-slide-copy"><div class="how-to-kicker">${slide.kicker}</div><h3>${slide.title}</h3><p>${slide.body}</p>${extras}</div><div class="how-to-visual"><img src="${slide.image}" alt=""><div class="how-to-visual-content"><strong>${slide.visual}</strong><span>${slide.detail}</span></div></div>`;
  document.getElementById("howToProgress").style.width=`${((howToIndex+1)/howToSlides.length)*100}%`;
  document.getElementById("howToBack").disabled=howToIndex===0;
  document.getElementById("howToNext").textContent=howToIndex===howToSlides.length-1?(resumeFirstFlightAfterTour?"Continue First Flight":"Finish"):"Next";
  document.getElementById("howToDots").innerHTML=howToSlides.map((_,i)=>`<button class="${i===howToIndex?"active":""}" aria-label="Go to slide ${i+1}" onclick="goToHowToSlide(${i})"></button>`).join("");
}
function nextHowToSlide(){if(howToIndex>=howToSlides.length-1){closeHowToGuide();return;}howToIndex++;renderHowToSlide();}
function previousHowToSlide(){if(howToIndex>0){howToIndex--;renderHowToSlide();}}
function goToHowToSlide(i){howToIndex=i;renderHowToSlide();}
function toggleHowToAutoplay(){howToTimer?stopHowToAutoplay():startHowToAutoplay();}
function startHowToAutoplay(){document.getElementById("howToAutoPlay").textContent="Ⅱ Pause Auto-Advance";howToTimer=setInterval(()=>{if(howToIndex===howToSlides.length-1){stopHowToAutoplay();return;}howToIndex++;renderHowToSlide();},6500);}
function stopHowToAutoplay(){if(howToTimer)clearInterval(howToTimer);howToTimer=null;const b=document.getElementById("howToAutoPlay");if(b)b.textContent="▶ Auto-Advance";}
function hasSeenHowToGuide(){return localStorage.getItem(HOW_TO_KEY)==="1";}
function maybeShowHowToGuideAfterProfileSetup(){if(hasSeenHowToGuide())return;window.setTimeout(()=>openHowToGuide(0),350);}
window.addEventListener("keydown",e=>{if(document.getElementById("howToModal")?.classList.contains("hidden"))return;if(e.key==="Escape")closeHowToGuide();if(e.key==="ArrowRight")nextHowToSlide();if(e.key==="ArrowLeft")previousHowToSlide();});
