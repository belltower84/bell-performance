"use strict";

const BP_QUOTE_ART = [
  './assets/artwork/engine/alpine-lake.jpg?v=8800',
  './assets/artwork/engine/forest-trail.jpg?v=8800',
  './assets/artwork/engine/hill-country.jpg?v=8800',
  './assets/artwork/engine/mountain-trail.jpg?v=8800',
  './assets/artwork/engine/custom-ridge-runner.jpg?v=8800',
  './assets/artwork/engine/desert-trail.jpg?v=8800',
  './assets/artwork/engine/winter-trail.jpg?v=8800',
  './assets/artwork/strength/custom-strength-shadows.jpg?v=8800',
  './assets/artwork/strength/custom-heavy-deadlift.jpg?v=8800',
  './assets/artwork/strength/custom-sled-push.jpg?v=8800'
];
let bpQuoteArtOffset = Number(sessionStorage.getItem('bpQuoteArtOffset') || 0);
function bpApplyQuoteArtwork(advance=false){
  const card=document.getElementById('premiumQuoteCard'); if(!card)return;
  if(advance){bpQuoteArtOffset=(bpQuoteArtOffset+1)%BP_QUOTE_ART.length;sessionStorage.setItem('bpQuoteArtOffset',String(bpQuoteArtOffset));}
  const dateSeed=Math.floor(Date.now()/86400000); const index=(dateSeed+bpQuoteArtOffset)%BP_QUOTE_ART.length;
  card.style.backgroundImage=`url('${BP_QUOTE_ART[index]}')`;
  card.style.backgroundPosition=index%3===0?'center 58%':index%3===1?'center 44%':'center';
  card.classList.remove('bp-image-swap'); void card.offsetWidth; card.classList.add('bp-image-swap');
}

function bpInstallQuoteRotation(){
  const original=window.rotatePremiumQuote;
  window.rotatePremiumQuote=function(){ if(typeof original==='function')original(); bpApplyQuoteArtwork(true); };
  bpApplyQuoteArtwork(false);
}

function bpEnsureModalityTiles(){
  const dashboard=document.getElementById('premiumDashboard'); const mission=document.querySelector('.premium-mission-card');
  if(!dashboard||!mission||document.getElementById('bpModalityGrid'))return;
  const grid=document.createElement('section'); grid.id='bpModalityGrid'; grid.className='bp-modality-grid';
  grid.innerHTML=`
    <button class="bp-modality-tile strength" onclick="showScreen('workouts')"><div><span>Strength</span><strong>Build force</strong><small>Prescribed resistance work</small></div></button>
    <button class="bp-modality-tile engine" onclick="showScreen('workouts')"><div><span>Engine</span><strong>Build capacity</strong><small>Run, ride, row, or condition</small></div></button>
    <button class="bp-modality-tile recovery" onclick="togglePremiumSupport()"><div><span>Recovery</span><strong>Restore output</strong><small>Readiness-led support</small></div></button>
    <button class="bp-modality-tile mobility" onclick="togglePremiumSupport()"><div><span>Mobility</span><strong>Move well</strong><small>Purpose-matched movement care</small></div></button>`;
  mission.insertAdjacentElement('afterend',grid);
}

function bpPlanModality(item){
  const text=`${item?.mission||''} ${item?.customLabel||''} ${item?.detail||''} ${item?.secondaryLabel||''}`.toLowerCase();
  const strength=/strength|squat|deadlift|bench|upper|lower|hypertrophy|power/.test(text);
  const engine=/engine|run|ride|row|zone|interval|cardio|ruck|swim|aerobic/.test(text);
  if(strength&&engine)return 'mixed'; if(strength)return 'strength'; if(engine)return 'engine';
  if(/mobility|stretch|movement/.test(text))return 'mobility'; return 'recovery';
}
function bpRefinePlan(){
  const rows=[...document.querySelectorAll('#planList .plan-row')];
  rows.forEach((row,index)=>{row.dataset.modality=bpPlanModality(data?.plan?.[index]); row.setAttribute('role','group');});
}

function bpWeeklySeries(weeks=8){
  const result=[]; const current=startOfWeek();
  for(let i=weeks-1;i>=0;i--){const start=new Date(current);start.setDate(start.getDate()-i*7);const end=new Date(start);end.setDate(end.getDate()+7);const sessions=sessionsInRange(start,end);const engine=sessions.filter(s=>s.cardioType||String(s.name||'').startsWith('R-'));const strength=sessions.filter(s=>!engine.includes(s)&&!String(s.name||'').startsWith('M-'));result.push({label:start.toLocaleDateString(undefined,{month:'numeric',day:'numeric'}),volume:strength.reduce((a,s)=>a+completedStrengthVolume(s),0),miles:engine.reduce((a,s)=>a+engineDistanceMiles(s),0)});}return result;
}
function bpChartMarkup(series,key,unit,emptyText){
  const max=Math.max(0,...series.map(x=>x[key]));
  if(!max)return `<div class="bp-chart-empty">${emptyText}<br>Charts populate as sessions are completed.</div>`;
  return series.map((x,i)=>{const value=x[key];const pct=Math.max(value?5:2,(value/max)*100);return `<div class="bp-chart-col" title="${x.label}: ${key==='volume'?Math.round(value).toLocaleString():value.toFixed(1)} ${unit}"><i class="bp-chart-bar" style="height:${pct}%;--bar-delay:${i*55}ms"></i><small>${x.label}</small></div>`;}).join('');
}
function bpRenderAnalytics(){
  const history=document.getElementById('history'); const weekly=document.getElementById('weeklyReview'); if(!history||!weekly)return;
  let panel=document.getElementById('bpAnalyticsDashboard'); if(!panel){panel=document.createElement('section');panel.id='bpAnalyticsDashboard';panel.className='bp-analytics-dashboard';weekly.before(panel);}
  const series=bpWeeklySeries(8); const totalVolume=series.reduce((a,x)=>a+x.volume,0); const totalMiles=series.reduce((a,x)=>a+x.miles,0);
  panel.innerHTML=`
  <article class="bp-chart-card strength"><div class="bp-chart-heading"><div><span class="metric-label">Strength History</span><h3>Weekly Work Volume</h3></div><div class="bp-chart-total"><strong>${Math.round(totalVolume).toLocaleString()}</strong><span>lb-reps / 8 weeks</span></div></div><div class="bp-chart">${bpChartMarkup(series,'volume','lb-reps','No recorded strength volume yet.')}</div></article>
  <article class="bp-chart-card engine"><div class="bp-chart-heading"><div><span class="metric-label">Engine History</span><h3>Weekly Distance</h3></div><div class="bp-chart-total"><strong>${totalMiles.toFixed(1)}</strong><span>miles / 8 weeks</span></div></div><div class="bp-chart">${bpChartMarkup(series,'miles','mi','No recorded engine distance yet.')}</div></article>`;
}

function bpRefineSettings(){
  const more=document.getElementById('more'); if(!more)return;
  [...more.children].forEach((el,i)=>{if(el.classList.contains('card')){el.style.setProperty('--bp-delay',`${Math.min(i,12)*30}ms`);el.classList.add('bp-reveal');}});
}

function bpInstallMicroInteractions(){
  document.addEventListener('pointerdown',e=>{const target=e.target.closest('button,.premium-session-row,.plan-row,.card[onclick]');if(!target||target.disabled)return;target.classList.add('bp-pressable');if(target.tagName==='BUTTON'){const rect=target.getBoundingClientRect();const ripple=document.createElement('i');ripple.className='bp-ripple';ripple.style.left=`${e.clientX-rect.left}px`;ripple.style.top=`${e.clientY-rect.top}px`;target.style.position=target.style.position||'relative';target.style.overflow='hidden';target.appendChild(ripple);setTimeout(()=>ripple.remove(),520);}}, {passive:true});
  const originalShow=window.showScreen; window.showScreen=function(name){if(typeof originalShow==='function')originalShow(name);const screen=document.getElementById(name);if(screen){screen.classList.remove('bp-screen-enter');void screen.offsetWidth;screen.classList.add('bp-screen-enter');}setTimeout(()=>{if(name==='plan')bpRefinePlan();if(name==='history')bpRenderAnalytics();if(name==='more')bpRefineSettings();},30);};
}

function bpPatchRenderers(){
  const originalRender=window.renderApp;
  if(typeof originalRender==='function')window.renderApp=function(){const value=originalRender.apply(this,arguments);setTimeout(()=>{bpEnsureModalityTiles();bpApplyQuoteArtwork(false);bpRefinePlan();bpRenderAnalytics();bpRefineSettings();},0);return value;};
}

function initBell880(){bpInstallQuoteRotation();bpEnsureModalityTiles();bpRefinePlan();bpRenderAnalytics();bpRefineSettings();bpInstallMicroInteractions();bpPatchRenderers();document.documentElement.classList.add('bell-880');}
window.addEventListener('DOMContentLoaded',initBell880);
