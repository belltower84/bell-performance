"use strict";

const HOW_TO_KEY = "bellPerformanceHowToSeenV1";
const howToSlides = [
  {
    kicker:"Start here", title:"Your daily coaching briefing",
    body:"Bell Performance opens with the information that should drive the day: your Coach's Message, Mission Status, readiness trend, and current Strength + Engine goals.",
    bullets:["Complete the daily check-in before training.","Readiness changes volume and intensity—it does not replace good judgment.","Your actual Training sessions sit below the coaching briefing."],
    image:"./assets/artwork/engine/mountain-trail.jpg?v=680", visual:"Dashboard", detail:"Assess first. Train second."
  },
  {
    kicker:"Step 1", title:"Set two coordinated goals",
    body:"Use the Dual Mission Goal Builder to choose one Strength discipline and one Engine outcome. The app coordinates them instead of treating cardio as random extra work.",
    bullets:["Strength: Powerlifting, Olympic Lifting, Athlete, Hybrid, or Bodybuilding.","Engine: Running, Rowing, Hiking/Rucking, Cycling, Sprint/Field, Swimming, or general conditioning.","Choose Coach Decides when you want the app to manage same-day versus split sessions."],
    image:"./assets/artwork/strength/strength-building.jpg?v=680", visual:"Dual Mission", detail:"Strength + Engine, built together."
  },
  {
    kicker:"Step 2", title:"Complete the readiness check-in",
    body:"Tap Update Check-In at the top of the dashboard. Five quick answers determine a Green, Yellow, or Red Mission Status and shape today's prescription.",
    metrics:[["Sleep","1–5"],["Soreness","1–5"],["Energy","1–5"],["Motivation","1–5"]],
    image:"./assets/artwork/engine/forest-trail.jpg?v=680", visual:"Mission Status", detail:"Green, Yellow, or Red."
  },
  {
    kicker:"Step 3", title:"Use the Training tab",
    body:"Training contains the complete library of Strength and Engine sessions. Today's Mission on the dashboard is the fastest route; the Training tab lets you browse or start another prescribed session.",
    bullets:["Tap Start Strength or Start Engine from the dashboard.","Use Training to see all available sessions.","The artwork rotates based on your selected goals."],
    image:"./assets/artwork/strength/powerlifting.jpg?v=680", visual:"Training Library", detail:"Strength and Engine live together."
  },
  {
    kicker:"Step 4", title:"Log each exercise honestly",
    body:"During Strength training, enter the actual load and reps you complete. After the movement, tell the Coach Engine how the prescription felt.",
    feedback:["Too Easy","Just Right","Too Heavy","Pain / Technique"],
    image:"./assets/artwork/strength/upper-body.jpg?v=680", visual:"Exercise Feedback", detail:"Your next load depends on this."
  },
  {
    kicker:"Step 5", title:"Let the discipline drive progression",
    body:"Progression is not identical across every goal. Bodybuilding uses rep-range progression, powerlifting uses training-max and effort logic, Olympic lifting protects technical quality, and Athlete work may progress speed or complexity instead of load.",
    bullets:["Do not press Too Easy just because the first set felt good.","Report pain or technical breakdown immediately.","The next prescription is based on the exercise's own history."],
    image:"./assets/artwork/strength/power-performance.jpg?v=680", visual:"Progression Engine", detail:"The method matches the mission."
  },
  {
    kicker:"Step 6", title:"Finish the training debrief",
    body:"After the session, log how training landed, your energy afterward, overall condition, and any muscle or joint strain. This feeds the rolling seven-day readiness trend.",
    bullets:["Use notes for unusual fatigue or excellent performance.","Recovery feedback helps prevent unnecessary load increases.","Concerning symptoms are not a readiness problem—stop and seek appropriate care."],
    image:"./assets/artwork/engine/ridge-run.jpg?v=680", visual:"Training Debrief", detail:"Tomorrow's plan starts here."
  },
  {
    kicker:"Finish", title:"Follow the recovery prescription",
    body:"Use the mobility, nutrition, hydration, and recovery prompts as part of the training plan. Bell Performance works best when every check-in and completed session is logged consistently.",
    bullets:["Review the Weekly Readiness trend before adding extra work.","Change goals or equipment locations in More.","Reopen this guide anytime from Settings & Data."],
    image:"./assets/artwork/engine/alpine-lake.jpg?v=680", visual:"Train for Life", detail:"Assess. Train. Debrief. Recover. Adapt."
  }
];
let howToIndex=0;
let howToTimer=null;

function openHowToGuide(startIndex=0){
  howToIndex=Math.max(0,Math.min(howToSlides.length-1,Number(startIndex)||0));
  document.getElementById("howToModal")?.classList.remove("hidden");
  document.body.classList.add("modal-open");
  renderHowToSlide();
}
function closeHowToGuide(){
  stopHowToAutoplay();
  document.getElementById("howToModal")?.classList.add("hidden");
  document.body.classList.remove("modal-open");
  localStorage.setItem(HOW_TO_KEY,"1");
}
function renderHowToSlide(){
  const slide=howToSlides[howToIndex];
  const extras=slide.metrics?`<div class="guide-metric-grid">${slide.metrics.map(x=>`<div class="guide-metric"><span>${x[0]}</span><b>${x[1]}</b></div>`).join("")}</div>`:slide.feedback?`<div class="guide-feedback">${slide.feedback.map(x=>`<span>${x}</span>`).join("")}</div>`:slide.bullets?`<ul>${slide.bullets.map(x=>`<li>${x}</li>`).join("")}</ul>`:"";
  document.getElementById("howToSlide").innerHTML=`<div class="how-to-slide-copy"><div class="how-to-kicker">${slide.kicker}</div><h3>${slide.title}</h3><p>${slide.body}</p>${extras}</div><div class="how-to-visual"><img src="${slide.image}" alt=""><div class="how-to-visual-content"><strong>${slide.visual}</strong><span>${slide.detail}</span></div></div>`;
  document.getElementById("howToProgress").style.width=`${((howToIndex+1)/howToSlides.length)*100}%`;
  document.getElementById("howToBack").disabled=howToIndex===0;
  const next=document.getElementById("howToNext"); next.textContent=howToIndex===howToSlides.length-1?"Finish":"Next";
  document.getElementById("howToDots").innerHTML=howToSlides.map((_,i)=>`<button class="${i===howToIndex?"active":""}" aria-label="Go to slide ${i+1}" onclick="goToHowToSlide(${i})"></button>`).join("");
}
function nextHowToSlide(){if(howToIndex>=howToSlides.length-1){closeHowToGuide();return;}howToIndex++;renderHowToSlide();}
function previousHowToSlide(){if(howToIndex>0){howToIndex--;renderHowToSlide();}}
function goToHowToSlide(i){howToIndex=i;renderHowToSlide();}
function toggleHowToAutoplay(){howToTimer?stopHowToAutoplay():startHowToAutoplay();}
function startHowToAutoplay(){document.getElementById("howToAutoPlay").textContent="Ⅱ Pause Slideshow";howToTimer=setInterval(()=>{if(howToIndex===howToSlides.length-1){stopHowToAutoplay();return;}howToIndex++;renderHowToSlide();},5500);}
function stopHowToAutoplay(){if(howToTimer)clearInterval(howToTimer);howToTimer=null;const b=document.getElementById("howToAutoPlay");if(b)b.textContent="▶ Play Slideshow";}
function maybeShowHowToGuide(){if(!localStorage.getItem(HOW_TO_KEY))setTimeout(()=>openHowToGuide(0),700);}
window.addEventListener("keydown",e=>{if(document.getElementById("howToModal")?.classList.contains("hidden"))return;if(e.key==="Escape")closeHowToGuide();if(e.key==="ArrowRight")nextHowToSlide();if(e.key==="ArrowLeft")previousHowToSlide();});
