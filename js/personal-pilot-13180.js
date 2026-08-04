(function(){
  "use strict";
  const $=id=>document.getElementById(id);
  function safeText(id){return String($(id)?.textContent||"").trim();}

  function useReadinessOpener(){
    document.querySelectorAll('[onclick*="dailyReadinessModal"]').forEach(btn=>{
      const old=btn.getAttribute('onclick')||'';
      if(old.includes("classList.remove('hidden')")||old.includes('classList.remove("hidden")')){
        btn.setAttribute('onclick','openDailyReadiness()');
      }
    });
  }

  function coachingReasons(){
    const reasons=[];
    const detail=safeText('commandAdjustmentDetail');
    const title=safeText('commandAdjustmentTitle');
    const readiness=safeText('premiumReadinessStatus');
    const sleep=safeText('premiumSleep');
    const soreness=safeText('premiumSoreness');
    const energy=safeText('premiumEnergy');
    const pain=safeText('commandPain');
    const time=safeText('commandTime');
    if(detail && !/checking|loading/i.test(detail)) reasons.push(detail);
    if(readiness && !/check in|—/i.test(readiness)) reasons.push(`Readiness is ${readiness.toLowerCase()}.`);
    if(sleep && !/—/.test(sleep)) reasons.push(`Sleep: ${sleep}.`);
    if(soreness && !/—/.test(soreness)) reasons.push(`Soreness: ${soreness}.`);
    if(energy && !/—/.test(energy)) reasons.push(`Energy: ${energy}.`);
    if(pain && !/—|none/i.test(pain)) reasons.push(`Pain flag: ${pain}.`);
    if(time && !/—/.test(time)) reasons.push(`Available training time: ${time}.`);
    if(!reasons.length) reasons.push('Bell found no reason to alter the scheduled session.');
    return {title:title||'Train as planned',reasons:[...new Set(reasons)].slice(0,5)};
  }

  function installWhyCard(){
    const box=$('commandAdjustment');
    if(!box||box.querySelector('.bell-why-button'))return;
    const button=document.createElement('button');
    button.type='button';button.className='bell-why-button';button.textContent='Why did Bell choose this?';
    const panel=document.createElement('div');panel.className='bell-coaching-why';panel.setAttribute('aria-live','polite');
    button.addEventListener('click',()=>{
      const open=panel.classList.toggle('open');
      button.textContent=open?'Hide coaching rationale':'Why did Bell choose this?';
      const info=coachingReasons();
      panel.innerHTML=`<strong>${escapeHtml(info.title)}</strong><ul>${info.reasons.map(x=>`<li>${escapeHtml(x)}</li>`).join('')}</ul>`;
    });
    box.append(button,panel);
  }

  function escapeHtml(value){return String(value).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}

  function improveMissionLanguage(){
    const start=$('commandStartWorkout');
    if(start && !start.dataset.bell13180){start.dataset.bell13180='1';start.textContent='Start Today’s Workout';}
    const readinessButtons=document.querySelectorAll('.premium-readiness-update,.readiness-checkin-button');
    readinessButtons.forEach(b=>b.textContent='Daily Check-In');
  }

  function enhanceWorkoutCards(){
    document.querySelectorAll('#activeExercises .exercise-card').forEach((card,index)=>{
      card.dataset.exerciseNumber=String(index+1);
      const head=card.querySelector('.exercise-head');
      if(head&&!head.querySelector('.bell-exercise-status')){
        const status=document.createElement('span');status.className='bell-exercise-status';status.textContent=`Exercise ${index+1}`;
        head.prepend(status);
      }
    });
  }

  function apply(){useReadinessOpener();installWhyCard();improveMissionLanguage();enhanceWorkoutCards();}
  document.addEventListener('DOMContentLoaded',apply);
  const observer=new MutationObserver(()=>apply());
  observer.observe(document.documentElement,{childList:true,subtree:true,characterData:false});
  window.BELL_PERSONAL_PILOT_UX={version:'13.18.0',apply,coachingReasons};
})();
