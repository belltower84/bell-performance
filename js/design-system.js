"use strict";

const BELL_SCREEN_IDENTITIES = {
  workouts:{kicker:"Training System",title:"Training Library",subtitle:"Today’s rotation, complete session library, and purpose-matched substitutions.",image:"./assets/artwork/strength/custom-sled-push.jpg?v=8700",badge:"Execute with purpose",theme:"strength"},
  plan:{kicker:"Mission Architecture",title:"Weekly Plan",subtitle:"See how Strength, Engine, recovery, and two-a-day sessions fit together across the week.",image:"./assets/artwork/engine/custom-ridge-runner.jpg?v=8700",badge:"Week structure",theme:"engine"},
  history:{kicker:"Performance Intelligence",title:"Performance Review",subtitle:"Track consistency, training volume, engine progress, milestones, and the direction of the current block.",image:"./assets/artwork/strength/custom-strength-shadows.jpg?v=8700",badge:"Review the trend",theme:"analysis"},
  more:{kicker:"System Control",title:"More",subtitle:"Manage your mission, athlete profile, equipment, standards, support, and application data.",image:"./assets/engine-mountain-trail-bg.jpg?v=8700",badge:"Adapt without restarting",theme:"system"},
  exerciseLibrary:{kicker:"Movement Intelligence",title:"Exercise Library",subtitle:"Learn movements, understand purpose, review technique, and choose intelligent substitutions.",image:"./assets/artwork/strength/custom-heavy-deadlift.jpg?v=8700",badge:"Learn. Perform. Replace.",theme:"strength"}
};

const FIRST_FLIGHT_IDENTITIES = [
  {kicker:"Athlete Profile",title:"Identify the athlete",detail:"Build the baseline Bell Performance will coach from.",image:"./assets/artwork/strength/custom-strength-shadows.jpg?v=8700"},
  {kicker:"Movement Screen",title:"Train around reality",detail:"Record limitations before the system builds the prescription.",image:"./assets/artwork/engine/forest-trail.jpg?v=8700"},
  {kicker:"Training Environment",title:"Tell us where you train",detail:"Equipment availability changes exercise selection, not the mission.",image:"./assets/artwork/strength/custom-sled-push.jpg?v=8700"},
  {kicker:"Mission Selection",title:"Choose what matters now",detail:"Your goal drives the physiology and the shape of the block.",image:"./assets/artwork/engine/custom-ridge-runner.jpg?v=8700"},
  {kicker:"Coaching Voice",title:"Choose how the coach speaks",detail:"Set a tone that supports consistent action without becoming noise.",image:"./assets/engine-mountain-trail-bg.jpg?v=8700"},
  {kicker:"Launch Review",title:"Your first block is ready",detail:"Review the mission, constraints, and start date before launch.",image:"./assets/artwork/strength/custom-heavy-deadlift.jpg?v=8700"}
];

function bellHeroMarkup(identity){
  return `<div class="bp-screen-hero-art"><img src="${identity.image}" alt="" onerror="this.onerror=null;this.src='./assets/strength-classic.jpg?v=8700';"><div class="bp-screen-hero-shade"></div></div><div class="bp-screen-hero-copy"><span>${identity.kicker}</span><h1>${identity.title}</h1><p>${identity.subtitle}</p><b>${identity.badge}</b></div>`;
}
function buildBellScreenHeroes(){
  document.querySelectorAll('.bp-screen-hero[data-hero-screen]').forEach(hero=>{
    const identity=BELL_SCREEN_IDENTITIES[hero.dataset.heroScreen];
    if(identity)hero.innerHTML=bellHeroMarkup(identity);
  });
}
function applyBellScreenIdentity(name){
  document.body.dataset.bellScreen=name||'home';
  const hero=document.querySelector(`#${CSS.escape(name)} .bp-screen-hero`);
  if(hero){hero.classList.remove('bp-enter');void hero.offsetWidth;hero.classList.add('bp-enter');}
  document.querySelectorAll(`#${CSS.escape(name)} > .card, #${CSS.escape(name)} > .list > *, #${CSS.escape(name)} .exercise-library-card`).forEach((el,index)=>{
    el.style.setProperty('--bp-delay',`${Math.min(index,10)*35}ms`);el.classList.add('bp-reveal');
  });
}
function ensureFirstFlightIdentity(){
  const shell=document.querySelector('.first-flight-shell');
  const body=document.querySelector('.first-flight-body');
  if(!shell||!body||shell.querySelector('.bp-first-flight-visual'))return;
  const visual=document.createElement('aside');
  visual.className='bp-first-flight-visual';
  visual.innerHTML='<img alt=""><div class="bp-first-flight-shade"></div><div class="bp-first-flight-copy"><span></span><strong></strong><p></p><div class="bp-first-flight-mark"><img src="./assets/logo-shield.svg?v=8700" alt=""></div></div>';
  shell.insertBefore(visual,body);
  shell.classList.add('bp-first-flight-layout');
}
function updateFirstFlightIdentity(step=0){
  ensureFirstFlightIdentity();
  const identity=FIRST_FLIGHT_IDENTITIES[Math.max(0,Math.min(FIRST_FLIGHT_IDENTITIES.length-1,Number(step)||0))];
  const visual=document.querySelector('.bp-first-flight-visual');if(!visual||!identity)return;
  const img=visual.querySelector(':scope > img');img.onerror=()=>{img.onerror=null;img.src='./assets/strength-classic.jpg?v=8700';};img.src=identity.image;
  visual.querySelector('.bp-first-flight-copy>span').textContent=identity.kicker;
  visual.querySelector('.bp-first-flight-copy>strong').textContent=identity.title;
  visual.querySelector('.bp-first-flight-copy>p').textContent=identity.detail;
  visual.classList.remove('bp-enter');void visual.offsetWidth;visual.classList.add('bp-enter');
}
function initBellCommercialDesign(){
  buildBellScreenHeroes();ensureFirstFlightIdentity();updateFirstFlightIdentity(typeof onboardingStep==='number'?onboardingStep:0);applyBellScreenIdentity(document.querySelector('.screen.active')?.id||'home');
  document.documentElement.classList.add('bell-commercial-ui');
}
window.addEventListener('DOMContentLoaded',initBellCommercialDesign);
