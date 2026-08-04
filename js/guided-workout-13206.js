(function(){
  'use strict';
  const VERSION='13.20.6';
  let dockObserver=null;
  let shellObserver=null;
  let scheduled=false;

  function modal(){return document.querySelector('#workoutModal .modal-box.gw-stable-13204');}
  function dock(){return modal()?.querySelector('.gw-action-dock');}
  function shell(){return modal()?.querySelector('.gw-commercial-shell');}

  function scheduleSync(){
    if(scheduled)return;
    scheduled=true;
    requestAnimationFrame(()=>{scheduled=false;syncDock();});
  }

  function syncDock(){
    const m=modal(),d=dock(),s=shell();
    if(!m||!d||!s)return;
    const rect=d.getBoundingClientRect();
    const css=getComputedStyle(d);
    const marginTop=parseFloat(css.marginTop)||0;
    const marginBottom=parseFloat(css.marginBottom)||0;
    const height=Math.max(0,Math.ceil(rect.height+marginTop+marginBottom));
    if(!height)return;
    m.style.setProperty('--gw-action-dock-height',`${height}px`);
    s.style.setProperty('--gw-action-dock-height',`${height}px`);
    s.dataset.dockHeight=String(height);
  }

  function observe(){
    const d=dock(),s=shell();
    if(!d||!s)return;
    dockObserver?.disconnect?.();
    shellObserver?.disconnect?.();
    if('ResizeObserver' in window){
      dockObserver=new ResizeObserver(scheduleSync);
      dockObserver.observe(d);
      shellObserver=new ResizeObserver(scheduleSync);
      shellObserver.observe(s);
    }
    scheduleSync();
    setTimeout(scheduleSync,40);
    setTimeout(scheduleSync,160);
    setTimeout(scheduleSync,500);
  }

  function enhance(){
    const s=shell();
    if(!s)return;
    s.setAttribute('data-responsive-dock-release',VERSION);
    observe();
  }

  const priorRender=window.renderActiveWorkout;
  if(typeof priorRender==='function'){
    window.renderActiveWorkout=function(){
      const out=priorRender.apply(this,arguments);
      requestAnimationFrame(enhance);
      return out;
    };
  }

  window.addEventListener('resize',scheduleSync,{passive:true});
  window.addEventListener('orientationchange',()=>setTimeout(scheduleSync,80),{passive:true});
  window.visualViewport?.addEventListener('resize',scheduleSync,{passive:true});
  window.visualViewport?.addEventListener('scroll',scheduleSync,{passive:true});
  document.addEventListener('fullscreenchange',scheduleSync);
  document.addEventListener('click',e=>{
    if(e.target.closest('#workoutModal')){
      setTimeout(enhance,0);
      setTimeout(scheduleSync,120);
    }
  });
  document.addEventListener('input',e=>{
    if(e.target.closest('#workoutModal'))scheduleSync();
  });

  requestAnimationFrame(enhance);
})();
