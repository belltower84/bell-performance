(function(){
  'use strict';
  const VERSION='13.21.2';
  let dockObserver=null;
  let modalObserver=null;
  let mutationObserver=null;
  let scheduled=false;

  function modal(){return document.querySelector('#workoutModal .modal-box.gw-stable-13204');}
  function dock(root=modal()){return root?.querySelector('.gw-action-dock')||null;}
  function shell(root=modal()){return root?.querySelector('.gw-commercial-shell')||null;}
  function spacer(root=modal()){return root?.querySelector('.gw-action-spacer')||null;}

  function scheduleSync(){
    if(scheduled)return;
    scheduled=true;
    requestAnimationFrame(()=>{
      scheduled=false;
      syncDockReservation();
    });
  }

  function syncDockReservation(){
    const m=modal();
    const d=dock(m);
    const s=shell(m);
    if(!m||!d||!s)return;

    const rect=d.getBoundingClientRect();
    const style=getComputedStyle(d);
    const marginTop=parseFloat(style.marginTop)||0;
    const marginBottom=parseFloat(style.marginBottom)||0;
    const measured=Math.max(1,Math.ceil(rect.height+marginTop+marginBottom));
    const value=`${measured}px`;

    m.style.setProperty('--gw-action-dock-height',value);
    s.style.setProperty('--gw-action-dock-height',value);
    document.documentElement.style.setProperty('--gw-action-dock-height',value);
    m.dataset.dockHeight=value;

    const gap=spacer(m);
    if(gap){
      gap.style.height=`calc(${value} + var(--gw-dock-clearance,40px) + env(safe-area-inset-bottom,0px))`;
      gap.style.minHeight=gap.style.height;
    }
  }

  function observe(){
    const m=modal();
    const d=dock(m);
    if(!m||!d)return;

    dockObserver?.disconnect?.();
    modalObserver?.disconnect?.();
    mutationObserver?.disconnect?.();

    if('ResizeObserver' in window){
      dockObserver=new ResizeObserver(scheduleSync);
      dockObserver.observe(d);
      modalObserver=new ResizeObserver(scheduleSync);
      modalObserver.observe(m);
    }

    mutationObserver=new MutationObserver(scheduleSync);
    mutationObserver.observe(d,{subtree:true,childList:true,characterData:true,attributes:true});

    scheduleSync();
    [40,120,300,700].forEach(ms=>setTimeout(scheduleSync,ms));
  }

  function enhance(){
    const m=modal();
    if(!m)return;
    m.setAttribute('data-dock-reservation-release',VERSION);
    observe();
  }

  const priorRender=window.renderActiveWorkout;
  if(typeof priorRender==='function'){
    window.renderActiveWorkout=function(){
      const result=priorRender.apply(this,arguments);
      requestAnimationFrame(enhance);
      return result;
    };
  }

  ['resize','orientationchange'].forEach(name=>window.addEventListener(name,()=>setTimeout(scheduleSync,40),{passive:true}));
  window.visualViewport?.addEventListener('resize',scheduleSync,{passive:true});
  window.visualViewport?.addEventListener('scroll',scheduleSync,{passive:true});
  document.addEventListener('fullscreenchange',scheduleSync);
  document.addEventListener('click',event=>{
    if(event.target.closest('#workoutModal')){
      setTimeout(enhance,0);
      setTimeout(scheduleSync,100);
    }
  });
  document.addEventListener('input',event=>{
    if(event.target.closest('#workoutModal'))scheduleSync();
  });

  requestAnimationFrame(enhance);
})();
