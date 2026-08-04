(function(){
  'use strict';
  const VERSION='13.20.5';
  let uiInterval=null;
  let restEndAt=0;
  let restDuration=0;
  const originalBegin=window.beginRestTimer;
  const originalAdjust=window.adjustRestTimer;
  const originalSkip=window.skipRestTimer;

  function dataRef(){try{if(typeof data!=='undefined')return data;}catch(_){}return window.data||null;}
  function fmt(seconds){seconds=Math.max(0,Math.floor(Number(seconds)||0));const h=Math.floor(seconds/3600),m=Math.floor((seconds%3600)/60),s=seconds%60;return h?`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`:`${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;}
  function workoutElapsed(){const active=dataRef()?.activeWorkout;if(!active)return 0;const base=Number(active.timerAccumulatedSeconds??active.elapsed??0)||0;if(active.timerRunning&&active.timerStartedAt){return base+Math.max(0,Math.floor((Date.now()-new Date(active.timerStartedAt).getTime())/1000));}return base;}
  function restRemaining(){return restEndAt?Math.max(0,Math.ceil((restEndAt-Date.now())/1000)):0;}

  window.beginRestTimer=function(seconds,exerciseName){restDuration=Math.max(0,Number(seconds)||0);restEndAt=restDuration?Date.now()+restDuration*1000:0;try{originalBegin?.(seconds,exerciseName);}catch(_){}tick();};
  window.adjustRestTimer=function(delta){if(restEndAt)restEndAt+=Number(delta||0)*1000;try{originalAdjust?.(delta);}catch(_){}tick();};
  window.skipRestTimer=function(){restEndAt=0;restDuration=0;try{originalSkip?.();}catch(_){}tick();};
  window.gwAdjustRest13205=function(delta){window.adjustRestTimer(delta);};
  window.gwSkipRest13205=function(){window.skipRestTimer();};

  function timerMarkup(){const remain=restRemaining();return `<div class="gw-live-rest ${remain?'is-running':'is-ready'}"><div><small>${remain?'REST TIMER':'READY'}</small><strong>${remain?fmt(remain):'NEXT SET'}</strong></div><div class="gw-live-rest-actions">${remain?`<button type="button" onclick="gwAdjustRest13205(-30)">−30</button><button type="button" onclick="gwAdjustRest13205(30)">+30</button><button type="button" onclick="gwSkipRest13205()">Skip</button>`:''}</div></div>`;}

  function enhance(){
    const shell=document.querySelector('#workoutModal .gw-commercial-shell');if(!shell)return;
    shell.setAttribute('data-release',VERSION);
    const est=shell.querySelector('.gw-est');if(est){est.innerHTML=`<b id="gwWorkoutElapsed13205">${fmt(workoutElapsed())}</b><small>WORKOUT TIME</small>`;}
    const slot=shell.querySelector('.gw-rest-slot');if(slot){slot.innerHTML=timerMarkup();}
    const oldPanel=document.getElementById('restPanel');if(oldPanel){oldPanel.classList.add('hidden');oldPanel.style.display='none';}
    shell.querySelectorAll('.gw-session-actions button').forEach(btn=>btn.classList.add('gw-session-utility'));
    const title=(shell.querySelector('.gw-exercise-hero h2')?.textContent||'').toLowerCase();
    if(/squat|lunge|deadlift|rdl|leg|hinge/.test(title)){
      shell.querySelectorAll('.gw-anatomy-pro').forEach(el=>{el.classList.add('gw-anatomy-image');el.innerHTML='<img src="./assets/library/commercial-lower-body-anatomy.png" alt="Front and back muscle anatomy">';});
    }
    tick();
  }
  function tick(){
    const w=document.getElementById('gwWorkoutElapsed13205');if(w)w.textContent=fmt(workoutElapsed());
    const slot=document.querySelector('#workoutModal .gw-rest-slot');if(slot){const current=slot.querySelector('.gw-live-rest');const running=restRemaining()>0;if(!current||current.classList.contains('is-running')!==running){slot.innerHTML=timerMarkup();}else if(running){const strong=current.querySelector('strong');if(strong)strong.textContent=fmt(restRemaining());}}
    if(restEndAt&&restRemaining()<=0){restEndAt=0;restDuration=0;const slot2=document.querySelector('#workoutModal .gw-rest-slot');if(slot2)slot2.innerHTML=timerMarkup();}
  }

  const priorRender=window.renderActiveWorkout;
  if(typeof priorRender==='function')window.renderActiveWorkout=function(){const out=priorRender.apply(this,arguments);requestAnimationFrame(enhance);return out;};
  document.addEventListener('click',e=>{if(e.target.closest('#workoutModal'))setTimeout(enhance,0);});
  uiInterval=setInterval(tick,1000);
  window.addEventListener('beforeunload',()=>clearInterval(uiInterval));
  requestAnimationFrame(enhance);
})();
