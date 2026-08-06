"use strict";
/* Bell Performance 13.8.5 — commercial Home with optional support sessions and streamlined training. */
(function(){
  const $=id=>document.getElementById(id);
  const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const text=id=>$(id)?.textContent?.trim()||"";
  const clean=v=>String(v||"").replace(/\s+/g," ").trim();
  const titleCase=v=>clean(v).replace(/\b\w/g,c=>c.toUpperCase());
  let selectedWeekKey="";
  let weekDays=[];
  let selectedMissionSessionKey="";
  let selectedMissionSessionType="";

  function athlete(){const appData=typeof data!=="undefined"?data:window.data;return clean(appData?.athleteProfile?.demographics?.preferredName||appData?.athleteProfile?.demographics?.firstName||appData?.settings?.athleteName||appData?.settings?.name||"Athlete");}
  function greeting(){const h=new Date().getHours();return h<12?"Good morning":h<18?"Good afternoon":"Good evening";}
  function controlMode(){try{return typeof bellAppControlMode==="function"?bellAppControlMode():(window.data?.settings?.appControlMode==="planner"?"planner":"coach");}catch(_){return "coach";}}
  function state(){try{return window.BellCoachingEngine?.getState({persist:false})||{};}catch(_){return {};}}
  function currentSessions(){try{return typeof premiumAllSessions==='function'?premiumAllSessions():[];}catch(_){return [];}}
  function todayDateKey(){try{return typeof todayKey==='function'?todayKey():new Date().toISOString().slice(0,10);}catch(_){return new Date().toISOString().slice(0,10);}}
  function sessionLabel(s){try{return typeof bellWorkoutDisplayLabel==="function"?bellWorkoutDisplayLabel(s):clean(s?.label||scaledTemplate(s?.mission)?.label||s?.mission||"Training");}catch(_){return clean(s?.label||s?.mission||"Training");}}
  function sessionType(s){try{return clean(typeof premiumSessionType==='function'?premiumSessionType(s):"training").toLowerCase();}catch(_){return "training";}}
  function sessionMinutes(s){try{return Number(s?.minutes)||Number(s?.allocatedMinutes)||Number(s?.prescribedDuration)||Number(scaledTemplate(s?.mission)?.duration)||30;}catch(_){return Number(s?.minutes)||Number(s?.allocatedMinutes)||Number(s?.prescribedDuration)||30;}}
  function sessionPurpose(s){
    try{
      const template=typeof scaledTemplate==='function'?scaledTemplate(s?.mission):null;
      return clean(s?.detail||template?.purpose||template?.detail||template?.description||"");
    }catch(_){return clean(s?.detail||"");}
  }
  function dailyWord(){
    try{
      const selected=window.BellQuoteCache?.selected?.()||BellQuoteCache?.selected?.();
      if(Array.isArray(selected)&&selected[0])return {text:clean(selected[0]),source:clean(selected[1]||"Bell Performance Coach")};
    }catch(_){}
    const hiddenText=clean(text("premiumQuoteText"));
    const hiddenSource=clean(text("premiumQuoteSource"));
    return {text:hiddenText||"Consistency beats perfection. Win today.",source:hiddenSource||"Bell Performance Coach"};
  }
  function focusFromText(label,detail,type=""){
    const corpus=clean(`${label} ${detail} ${type}`).toLowerCase();
    let title="Execute with Intent";
    let cue="Complete the prescribed work with controlled effort and quality execution.";
    if(/recovery|mobility|prehab|rehab|rest/.test(corpus)){title="Restore & Prepare";cue="Move with control, reduce unnecessary fatigue, and leave the session feeling better than you started.";}
    else if(/easy run|zone 2|aerobic base|easy aerobic|recovery cardio/.test(corpus)){title="Aerobic Base";cue="Stay conversational, keep the effort controlled, and finish with more in reserve.";}
    else if(/long run|long ride|long aerobic|durability/.test(corpus)){title="Aerobic Durability";cue="Hold a sustainable rhythm, fuel the work, and avoid turning the session into a race.";}
    else if(/interval|sprint|speed|tempo|threshold/.test(corpus)){title="Repeatable Quality";cue="Make every hard effort look alike. Protect mechanics and stop before quality breaks down.";}
    else if(/power|push press|clean|snatch|jerk|jump|throw/.test(corpus)){title="Speed & Power";cue="Move explosively, keep repetitions crisp, and avoid slow grinders.";}
    else if(/squat|deadlift|lower strength|leg/.test(corpus)){title="Lower-Body Strength";cue="Own position and bracing first. Add force without sacrificing clean movement.";}
    else if(/bench|press|upper strength|chin-up|pull-up|row/.test(corpus)){title="Upper-Body Strength";cue="Create stable positions, control every repetition, and preserve strong bar or body speed.";}
    else if(/hypertrophy|bodybuilding|recomposition|muscle/.test(corpus)){title="Controlled Tension";cue="Use full useful range, controlled reps, and enough effort to stimulate without wasting recovery.";}
    else if(/hybrid|tactical|work capacity|conditioning/.test(corpus)){title="Strength + Engine Balance";cue="Protect the primary training quality while building capacity that does not steal from tomorrow.";}
    return {title,detail:cue,mission:clean(label||"Today’s mission")};
  }
  function coachDashboardModel(m,independent){
    const word=dailyWord();
    if(independent){
      const rows=Array.isArray(independent.rows)?independent.rows:[];
      const row=rows.find(item=>item.required&&!item.completed&&(item.type==="strength"||item.type==="engine"))||rows.find(item=>!item.completed&&(item.type==="strength"||item.type==="engine"))||rows[0];
      const focus=focusFromText(row?.label||independent.title,row?.description||independent.purpose,row?.type||"");
      return {word,focus};
    }
    const selected=m?.sessions?.length?selectedMissionSession(m):null;
    const focus=focusFromText(selected?sessionLabel(selected):m?.title,selected?sessionPurpose(selected):m?.purpose,selected?sessionType(selected):m?.type);
    return {word,focus};
  }

  function todayMission(){
    const rawSessions=currentSessions();
    if(!rawSessions.length)return {title:"Recovery Day",purpose:"Recover, move well, and prepare for the next training day.",minutes:"Flexible",type:"Recovery",sessions:[],budget:null};
    const budget=typeof bellDailySessionBudget==='function'?bellDailySessionBudget(rawSessions,todayDateKey()):null;
    const sessions=(budget?.sessions||rawSessions).map(session=>({...session,allocatedMinutes:session.minutes||sessionMinutes(session)}));
    const first=sessions.find(s=>!s.completed&&!s.optional)||sessions.find(s=>!s.completed)||sessions[0];
    const required=sessions.filter(s=>!s.optional);
    const total=(required.length?required:sessions).reduce((n,s)=>n+sessionMinutes(s),0);
    const title=typeof bellCombinedWorkoutDisplayLabel==='function'?bellCombinedWorkoutDisplayLabel(rawSessions):(sessions.length>1?`${sessionLabel(first)} + ${sessionLabel(sessions.find(s=>s!==first)||sessions[1])}`:sessionLabel(first));
    const s=state();
    const purpose=budget?.checkedIn?`Today’s required work has been fit to your ${budget.available}-minute availability.${sessions.some(x=>x.optional)?" Optional support is shown separately.":""}`:clean(s.currentPhase?.purpose||text('commandMissionPurpose')||"Complete the prescribed work with controlled effort and quality execution.");
    return {title,purpose,minutes:`${total} min${sessions.some(x=>x.optional)?" required":""}`,type:sessions.map(sessionType).join(" + "),sessions,budget};
  }

  function markup(){return `<div class="b135-home" id="b135Home" data-control="coach">
    <section class="b135-welcome">
      <div class="b135-welcome-copy"><span class="b135-eyebrow">Bell Performance</span><h1><span id="b135Greeting">Good morning</span>, <span id="b135Athlete">Athlete</span></h1><p id="b135WelcomeLine">Here is what matters today.</p></div>
      <aside class="b135-coach-dashboard" aria-labelledby="b135CoachDashboardTitle">
        <div class="b135-coach-dashboard-head"><div><span class="b135-eyebrow">Coach’s Dashboard</span><strong id="b135CoachDashboardTitle">Today at a glance</strong></div><button class="b135-coach-open" id="b135CoachDashboardOpen" type="button">Open Coach ›</button></div>
        <div class="b135-coach-dashboard-grid">
          <section class="b135-coach-word"><span>Word of the Day</span><blockquote id="b135WordText">Consistency beats perfection. Win today.</blockquote><cite id="b135WordSource">Bell Performance Coach</cite></section>
          <section class="b135-coach-focus"><span>Today’s Mission Focus</span><strong id="b135TrainingFocus">Execute with intent</strong><p id="b135TrainingFocusDetail">Complete the prescribed work with controlled effort and quality execution.</p></section>
        </div>
      </aside>
    </section>
    <section class="b135-card b135-readiness-card" id="b135ReadinessCard" data-status="neutral"><div class="b135-readiness-main"><div class="b135-readiness-score"><strong id="b135ReadinessScore">—</strong><span>/100</span></div><div class="b135-readiness-copy"><span class="b135-eyebrow">Today’s readiness</span><strong id="b135ReadinessStatus">Check-in needed</strong><small id="b135ReadinessDetail">Complete your check-in before training.</small></div></div><div class="b135-readiness-actions"><span class="b135-readiness-level"><i></i><b id="b135ReadinessLevel">Not scored</b></span><button class="b135-readiness-update" id="b135ReadinessUpdate" type="button">Update Check-In</button></div></section>
    <section class="b135-card b135-primary"><div class="b135-primary-body"><div class="b135-mission-top"><div><span class="b135-eyebrow">Today’s training</span><h2 id="b135MissionTitle">Preparing your training</h2><p id="b135MissionPurpose">Bell is loading today’s prescription.</p></div><span class="b135-duration" id="b135MissionDuration">—</span></div><div class="b135-session-summary" id="b135SessionSummary"></div><div class="b135-primary-actions"><button class="b135-start" id="b135Start" type="button">Start Training</button><button class="b135-secondary" id="b135View" type="button">View Session</button><button class="b135-secondary" id="b135Modify" type="button">Modify</button></div><button class="b135-why" type="button" id="b135WhyMission">Why this workout?</button></div></section>
    <div class="b135-grid"><section class="b135-card b135-section b135-week-card"><div class="b135-section-head"><div><span class="b135-eyebrow">This week</span><h3 id="b135WeekTitle">Your training week</h3></div><button class="b135-link" type="button" onclick="showScreen('plan')">View Plan</button></div><div class="b135-week" id="b135Week" role="tablist" aria-label="Training days"></div><div class="b135-week-summary" id="b135WeekSummary" aria-live="polite"></div><div class="b135-week-foot"><span id="b135WeekComplete">0 of 0 sessions complete</span><strong id="b135WeekNext">Next: Today</strong></div></section>
    <section class="b135-card b135-section b135-coach-card" id="b135GuidanceCard"><div class="b135-section-head"><div><span class="b135-eyebrow" id="b135GuidanceEyebrow">Bell Coach</span><h3 id="b135GuidanceTitle">Today’s direction</h3></div><button class="b135-link" type="button" id="b135GuidanceAction">Open Coach</button></div><p class="b135-coach-text" id="b135CoachText">Bell is preparing your direction.</p><div class="b135-coach-context"><span class="b135-chip" id="b135PhaseChip">Current phase</span><span class="b135-chip" id="b135ReadinessChip">Readiness</span></div><button class="b135-why b135-card-action" type="button" id="b135GuidanceWhy">Why?</button></section></div>
    <div class="b135-bottom-grid"><section class="b135-card b135-section b135-plan-card"><div class="b135-section-head"><div><span class="b135-eyebrow">Your plan</span><h3 id="b135Journey">Performance & Health</h3></div><button class="b135-link" type="button" onclick="showScreen('plan')">View Plan</button></div><div class="b135-plan-row"><div class="b135-progress-ring" id="b135PlanRing"></div><div class="b135-plan-copy"><strong id="b135Phase">Foundation</strong><span id="b135PhaseWeek">Week 1 of 4</span><small id="b135NextPhase">Next: Development</small></div></div></section>
    <section class="b135-card b135-section b135-progress-card"><div class="b135-section-head"><div><span class="b135-eyebrow">Your progress</span><h3>Current trend</h3></div><button class="b135-link" type="button" onclick="showScreen('history')">View Progress</button></div><div class="b135-stat"><div><span id="b135ProgressLabel">Training consistency</span><strong id="b135ProgressValue">—</strong></div><span class="b135-trend" id="b135ProgressTrend">Building</span></div></section></div>
  </div>`;}

  function missionSessionIdentity(session,index=0){
    return clean(session?.sessionKey||`${sessionType(session)}:${session?.planId||"plan"}:${session?.mission||index}`);
  }
  function selectMissionSession(key,type=""){
    selectedMissionSessionKey=clean(key);
    selectedMissionSessionType=clean(type).toLowerCase();
    render();
  }
  function selectedMissionSession(m){
    if(!m.sessions.length)return null;
    let selected=m.sessions.find((s,index)=>missionSessionIdentity(s,index)===selectedMissionSessionKey);
    if(!selected&&selectedMissionSessionType)selected=m.sessions.find(s=>sessionType(s)===selectedMissionSessionType&&!s.completed);
    if(!selected)selected=m.sessions.find(s=>!s.completed&&!s.optional)||m.sessions.find(s=>!s.completed)||m.sessions[0];
    selectedMissionSessionKey=missionSessionIdentity(selected,m.sessions.indexOf(selected));
    selectedMissionSessionType=sessionType(selected);
    return selected;
  }
  function independentMissionModel(){
    try{
      if(!window.BellDailySessions?.buildRows)return null;
      const model=window.BellDailySessions.buildRows(todayDateKey());
      const training=model.rows.filter(row=>row.type==="strength"||row.type==="engine");
      const required=model.rows.filter(row=>row.required);
      const requiredDone=required.length>0&&required.every(row=>row.completed);
      const requiredTraining=training.filter(row=>row.required);
      const title=requiredDone?"Mission Complete":requiredTraining.length?requiredTraining.map(row=>row.label).join(" + "):"Recovery Day";
      const purpose=requiredDone
        ?"Today’s required training is complete. Optional Core and Mobility remain available."
        :requiredTraining.length
          ?`Required Strength and Engine work has been fit to your ${model.available}-minute availability. Core and Mobility are optional support.`
          :"Mobility, easy movement, and recovery habits are today’s main focus. Core remains optional.";
      return {...model,training,required,requiredDone,title,purpose,minutes:requiredTraining.length?`${model.requiredMinutes||model.available} min`:"Recovery"};
    }catch(error){console.error("Bell independent mission render failed",error);return null;}
  }
  function renderIndependentSessions(model){
    const host=$("b135SessionSummary");if(!host)return;
    host.className="b135-session-summary b1384-session-stack";
    host.innerHTML=model.rows.map(row=>{
      const typeLabel=row.type==='strength'?'Primary':titleCase(row.type);
      const statusLabel=row.recoveryFocus?'Recovery Focus · Optional':row.status;
      const timeNote=row.required?'included in today’s required time':row.type==='engine'?'optional support':row.type==='core'?'optional · based on usual availability':'optional · separate from training';
      return `<article class="b1384-session ${esc(row.type)}${row.completed?' completed':''}${row.recoveryFocus?' recovery-focus':''}" data-session-type="${esc(row.type)}">
      <div class="b1384-session-top"><span>${esc(typeLabel)} · ${esc(statusLabel)}</span>${row.completed?'<i aria-hidden="true">✓</i>':''}</div>
      <div class="b1384-session-copy"><h3>${esc(row.label)}</h3><p>${esc(row.description)}</p><small>${esc(row.minutes)} min · ${esc(timeNote)}</small></div>
      <div class="b1384-session-actions"><button type="button" class="b135-secondary" data-independent-preview="${esc(row.type)}">Preview</button><button type="button" class="b135-start" data-independent-start="${esc(row.type)}" ${row.completed?'disabled':''}>${row.completed?'✓ Completed':`▶ Start ${esc(row.type==='strength'?'Strength':titleCase(row.type))}`}</button></div>
    </article>`;
    }).join('')+(model.requiredDone?`<div class="b1384-tomorrow"><div><strong>Mission Complete</strong><span>Required training for today is finished. Optional support remains available.</span></div><button type="button" class="b135-secondary" id="b1384PreviewTomorrow">Preview Tomorrow</button></div>`:'');
    host.querySelectorAll('[data-independent-start]').forEach(button=>button.addEventListener('click',event=>{event.preventDefault();window.BellDailySessions.start(button.dataset.independentStart,model.key);}));
    host.querySelectorAll('[data-independent-preview]').forEach(button=>button.addEventListener('click',event=>{event.preventDefault();window.BellDailySessions.preview(button.dataset.independentPreview,model.key);}));
    const tomorrow=$("b1384PreviewTomorrow");if(tomorrow)tomorrow.onclick=()=>{const next=typeof addLocalDays==='function'?addLocalDays(model.key,1):model.key;if(typeof setDashboardDate==='function')setDashboardDate(next);};
  }
  function renderSessions(m,independent=null){
    const host=$("b135SessionSummary");if(!host)return;
    if(independent){renderIndependentSessions(independent);return;}
    host.className="b135-session-summary";
    if(!m.sessions.length){host.innerHTML='<div class="b135-session-item"><span>Today</span><strong>Recovery</strong><small>Walking, mobility, and normal daily activity</small></div>';return;}
    const selected=selectedMissionSession(m);
    host.innerHTML=m.sessions.slice(0,3).map((s,i)=>{
      const identity=missionSessionIdentity(s,i),isSelected=identity===selectedMissionSessionKey;
      const kind=sessionType(s)==='engine'?'Engine':'Primary';
      return `<button type="button" class="b135-session-item b135-session-choice ${isSelected?'selected':'muted'} ${s.completed?'complete':''}" data-mission-session="${esc(identity)}" data-mission-type="${esc(sessionType(s))}" aria-pressed="${isSelected?'true':'false'}" aria-label="Select ${esc(kind)} session: ${esc(sessionLabel(s))}"><span>${esc(kind)} · ${s.optional?'Optional':s.completed?'Complete':'Required'}</span><strong>${esc(sessionLabel(s))}</strong><small>${sessionMinutes(s)} min${s.optional?' · not included in required total':s.completed?' · Complete':''}</small><i class="b135-session-check" aria-hidden="true">${isSelected?'✓':''}</i></button>`;
    }).join('');
    host.querySelectorAll('[data-mission-session]').forEach(button=>{
      button.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();selectMissionSession(button.dataset.missionSession,button.dataset.missionType);});
      button.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();selectMissionSession(button.dataset.missionSession,button.dataset.missionType);}});
    });
  }

  function dateLabel(key){
    try{return localDateFromKey(key).toLocaleDateString('en-US',{weekday:'long',month:'short',day:'numeric'});}catch(_){return key;}
  }
  function weekDayModel(key,name,items){
    const sessions=items.flatMap(item=>typeof sessionsFromPlanItem==='function'?sessionsFromPlanItem(item):[item]).filter(Boolean);
    const totalMinutes=sessions.reduce((n,s)=>n+sessionMinutes(s),0);
    const allComplete=Boolean(sessions.length)&&sessions.every(s=>s.completed);
    const someComplete=sessions.some(s=>s.completed);
    const types=[...new Set(sessions.map(sessionType).filter(Boolean))];
    const labels=sessions.map(sessionLabel).filter(Boolean);
    const detail=sessions.map(sessionPurpose).find(Boolean)||state().currentPhase?.purpose||"Complete the scheduled work with quality effort and controlled execution.";
    return {
      key,name,date:dateLabel(key),sessions,totalMinutes,types,labels,
      title:typeof bellCombinedWorkoutDisplayLabel==='function'?bellCombinedWorkoutDisplayLabel(sessions):(labels.length?labels.join(' + '):'Recovery Day'),
      detail:labels.length?clean(detail):'Recover, move well, and maintain normal daily activity.',
      status:!sessions.length?'Recovery':allComplete?'Complete':someComplete?'In progress':'Planned',
      statusClass:!sessions.length?'recovery':allComplete?'complete':someComplete?'active':'planned',
      allComplete
    };
  }
  function renderWeekSummary(day){
    const host=$('b135WeekSummary');if(!host||!day)return;
    const meta=[];
    meta.push(day.sessions.length?`${day.totalMinutes} min`:'Flexible');
    meta.push(day.types.length?day.types.map(titleCase).join(' + '):'Recovery');
    host.innerHTML=`<div class="b135-week-summary-head"><div><span>${esc(day.date)}</span><strong>${esc(day.title)}</strong></div><em class="b135-status ${esc(day.statusClass)}">${esc(day.status)}</em></div><p>${esc(day.detail)}</p><div class="b135-week-meta">${meta.map(value=>`<span>${esc(value)}</span>`).join('')}</div>`;
  }
  function selectWeekDay(key){
    const day=weekDays.find(item=>item.key===key);if(!day)return;
    selectedWeekKey=key;
    const host=$('b135Week');
    host?.querySelectorAll('[data-week-key]').forEach(button=>{
      const selected=button.dataset.weekKey===key;
      button.classList.toggle('selected',selected);
      button.setAttribute('aria-selected',selected?'true':'false');
      button.tabIndex=selected?0:-1;
    });
    renderWeekSummary(day);
  }
  function renderWeek(){
    const host=$('b135Week');if(!host)return;
    try{
      const block=typeof bpResolvePlanBlock==='function'?bpResolvePlanBlock():data.trainingBlock;
      if(typeof bpPrepareBlockPlan==='function')bpPrepareBlockPlan(block);
      const week=typeof bpCurrentTimelineWeek==='function'?bpCurrentTimelineWeek(block):Number(block?.currentWeek||1);
      const plan=typeof bpWeekPlan==='function'?bpWeekPlan(block,week):(data.plan||[]);
      const monday=typeof bpWeekStartKey==='function'?bpWeekStartKey(block,week):mondayKeyFor(todayDateKey());
      const names=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],full=['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
      let done=0,total=0;
      weekDays=names.map((name,i)=>{
        const key=addLocalDays(monday,i);
        const items=plan.filter(x=>!['skipped','replaced'].includes(x.status)&&((typeof bellCanonicalPlanDateKey==='function'?bellCanonicalPlanDateKey(x,block,week):planDateKey(x))===key));
        const model=weekDayModel(key,full[i],items);
        total+=model.sessions.length;
        done+=model.sessions.filter(x=>x.completed).length;
        return model;
      });
      const today=todayDateKey();
      if(!weekDays.some(day=>day.key===selectedWeekKey))selectedWeekKey=weekDays.some(day=>day.key===today)?today:weekDays[0]?.key||"";
      host.innerHTML=weekDays.map((day,i)=>`<button class="b135-day ${day.allComplete?'done':''} ${day.key===today?'today':''} ${day.key===selectedWeekKey?'selected':''}" type="button" role="tab" data-week-key="${esc(day.key)}" aria-selected="${day.key===selectedWeekKey?'true':'false'}" aria-controls="b135WeekSummary" tabindex="${day.key===selectedWeekKey?'0':'-1'}"><span>${names[i]}</span><strong>${localDateFromKey(day.key).getDate()}</strong><i></i></button>`).join('');
      host.querySelectorAll('[data-week-key]').forEach(button=>button.addEventListener('click',()=>selectWeekDay(button.dataset.weekKey)));
      host.onkeydown=event=>{
        if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
        const index=weekDays.findIndex(day=>day.key===selectedWeekKey);
        let next=index;
        if(event.key==='ArrowLeft')next=Math.max(0,index-1);
        if(event.key==='ArrowRight')next=Math.min(weekDays.length-1,index+1);
        if(event.key==='Home')next=0;
        if(event.key==='End')next=weekDays.length-1;
        if(next!==index){event.preventDefault();selectWeekDay(weekDays[next].key);host.querySelector(`[data-week-key="${weekDays[next].key}"]`)?.focus();}
      };
      renderWeekSummary(weekDays.find(day=>day.key===selectedWeekKey)||weekDays[0]);
      $('b135WeekComplete').textContent=`${done} of ${total} sessions complete`;
      $('b135WeekTitle').textContent=`Week ${week}`;
      const nextDay=weekDays.find(day=>day.sessions.some(session=>!session.completed));
      $('b135WeekNext').textContent=!total?'Recovery week':total===done?'Week complete':nextDay?`Next: ${nextDay.name}`:'Keep moving forward';
    }catch(_){
      weekDays=[];
      host.innerHTML=['M','T','W','T','F','S','S'].map(x=>`<div class="b135-day"><span>${x}</span><i></i></div>`).join('');
      if($('b135WeekSummary'))$('b135WeekSummary').innerHTML='<div class="b135-week-empty">Your weekly summary will appear here when Bell finishes building the plan.</div>';
    }
  }

  function render(){
    if(!$("b135Home"))return;
    if(typeof bellRepairActivePlanDates==='function')bellRepairActivePlanDates();
    const s=state(),independent=independentMissionModel(),m=independent?{sessions:[],title:independent.title,purpose:independent.purpose,minutes:independent.minutes}:todayMission(),mode=controlMode(),coachMode=mode==="coach";
    $("b135Home").dataset.control=mode;
    $("b135Greeting").textContent=greeting();$("b135Athlete").textContent=athlete();$("b135WelcomeLine").textContent=coachMode?"Your plan, readiness, and coaching direction for today.":"Your workout plan and readiness at a glance.";
    $("b135MissionTitle").textContent=independent?.title||m.title;$("b135MissionPurpose").textContent=independent?.purpose||m.purpose;$("b135MissionDuration").textContent=independent?.minutes||m.minutes;renderSessions(m,independent);renderWeek();
    const coachDash=coachDashboardModel(m,independent);
    if($("b135WordText"))$("b135WordText").textContent=coachDash.word.text;
    if($("b135WordSource"))$("b135WordSource").textContent=coachDash.word.source;
    if($("b135TrainingFocus"))$("b135TrainingFocus").textContent=coachDash.focus.title;
    if($("b135TrainingFocusDetail"))$("b135TrainingFocusDetail").textContent=`${coachDash.focus.mission} · ${coachDash.focus.detail}`;
    const checked=typeof hasTodayReadiness==="function"?hasTodayReadiness():window.data?.settings?.readiness?.lastPromptDate===todayDateKey();
    const score=typeof readinessScore==="function"?readinessScore():Number(window.data?.settings?.readiness?.score)||0;
    const status=typeof readinessStatus==="function"?readinessStatus(score):"GREEN";
    const readinessMap={GREEN:{label:"Ready to Train",level:"Green readiness",detail:coachMode?"Bell can keep the full training prescription today.":"Your readiness supports the workout as written."},YELLOW:{label:"Train Smart",level:"Yellow readiness",detail:coachMode?"Bell will protect the main work and reduce lower-value fatigue.":"Consider reducing volume or intensity if needed."},RED:{label:"Recovery Priority",level:"Red readiness",detail:coachMode?"Bell will shift today toward recovery and lower demand.":"Consider recovery or a manually modified session today."}};
    const readiness=readinessMap[status]||readinessMap.GREEN,card=$("b135ReadinessCard");
    card.dataset.status=checked?status.toLowerCase():"neutral";$("b135ReadinessScore").textContent=checked?String(score):"—";$("b135ReadinessStatus").textContent=checked?readiness.label:"Check-in needed";$("b135ReadinessLevel").textContent=checked?readiness.level:"Not scored";$("b135ReadinessDetail").textContent=checked?readiness.detail:(coachMode?"Complete the daily check-in so Bell can adjust training responsibly.":"Readiness is optional in Workout Planner mode and will not change the plan automatically.");
    $("b135CoachText").textContent=coachMode?clean(text("premiumCoachText")||window.BellCoachIntelligence?.brief?.()?.instruction||s.currentPhase?.purpose||"Focus on controlled effort and complete the work Bell prescribed."):"Follow the scheduled workout as written, or use Modify when you want to make a manual change. Readiness is informational in Workout Planner mode.";
    $("b135GuidanceEyebrow").textContent=coachMode?"Bell Coach":"Workout Planner";$("b135GuidanceTitle").textContent=coachMode?"Today’s direction":"Fixed-plan control";$("b135GuidanceAction").textContent=coachMode?"Open Coach":"Open Plan";$("b135GuidanceWhy").textContent=coachMode?"Why?":"Edit Plan";
    $("b135GuidanceAction").onclick=coachMode?()=>openCommandTile("coaching"):()=>showScreen("plan");$("b135GuidanceWhy").onclick=coachMode?()=>openCommandTile("coaching"):()=>showScreen("plan");
    $("b135PhaseChip").textContent=s.currentPhaseName||"Current phase";$("b135ReadinessChip").textContent=checked?`Readiness ${status.toLowerCase()}`:(coachMode?"Check-in needed":"Readiness optional");
    $("b135Journey").textContent=s.name||"Performance & Health";$("b135Phase").textContent=s.currentPhaseName||"Foundation";$("b135PhaseWeek").textContent=`Week ${s.phaseWeek||1} of ${s.phaseLength||1}`;$("b135NextPhase").textContent=`Next: ${s.nextPhase?.name||"Journey review"}`;$("b135PlanRing").style.setProperty("--p",`${Math.max(0,Math.min(100,Number(s.progressPercent)||0))}%`);
    let completed=0;try{completed=(data.history||[]).filter(x=>x.completed||x.status==="completed").length;}catch(_){}
    $("b135ProgressValue").textContent=completed?`${completed} sessions`:"Getting started";$("b135ProgressTrend").textContent=completed?"On track":"Building";
    const start=$("b135Start"),view=$("b135View"),modify=$("b135Modify"),legacyStart=$("commandStartWorkout"),legacyView=$("commandViewSession"),legacyModify=$("commandModifySession");
    const sharedActions=start?.closest('.b135-primary-actions');
    if(sharedActions)sharedActions.hidden=Boolean(independent);
    if(!independent){
      const selected=selectedMissionSession(m);
      if(selected){
        const kind=sessionType(selected)==="engine"?"Engine":"Strength";
        const active=window.data?.activeWorkout?.planSessionKey===selected.sessionKey;
        start.disabled=Boolean(selected.completed);
        start.textContent=selected.completed?"✓ Completed":active?`▶ Resume ${kind}`:`▶ Start ${kind}`;
        view.disabled=false;view.textContent="☷ Preview";
        modify.disabled=Boolean(selected.completed);modify.textContent=selected.optional?"Optional Session":"✎ Modify";
        start.onclick=selected.completed?null:()=>{
          if(typeof beginPlannedWorkout==='function')beginPlannedWorkout(selected.planId,selected.sessionKey,selected.mission);
          else if(typeof commandSessionCall==='function')commandSessionCall(selected,'start');
          else legacyStart?.click();
        };
        view.onclick=()=>{
          if(typeof previewPlannedWorkout==='function')previewPlannedWorkout(selected.planId,selected.sessionKey,selected.mission);
          else if(typeof commandSessionCall==='function')commandSessionCall(selected,'preview');
          else legacyView?.click();
        };
        modify.onclick=()=>selected.optional?(typeof openCommandTile==='function'&&openCommandTile('coaching')):(typeof commandSessionCall==='function'?commandSessionCall(selected,'preview'):legacyModify?.click());
      }else{
        start.disabled=Boolean(legacyStart?.disabled);view.disabled=Boolean(legacyView?.disabled);modify.disabled=Boolean(legacyModify?.disabled);
        start.textContent=legacyStart?.textContent?.trim()||"Start Recovery";view.textContent=legacyView?.textContent?.trim()||"View Recovery";modify.textContent=legacyModify?.textContent?.trim()||"Recovery Options";
        start.onclick=()=>legacyStart?.click();view.onclick=()=>legacyView?.click();modify.onclick=()=>legacyModify?.click();
      }
    }
    $("b135WhyMission").hidden=!coachMode;$("b135WhyMission").onclick=()=>{if(window.openBellCoachExplanation)openBellCoachExplanation("mission");else openCommandTile("coaching");};
  }

  function bind(){
    $("b135ReadinessUpdate").onclick=()=>{if(typeof openDailyReadiness==="function")openDailyReadiness();};
    if($("b135CoachDashboardOpen"))$("b135CoachDashboardOpen").onclick=()=>{if(typeof openCommandTile==="function")openCommandTile("coaching");};
  }

  function navButtonByAction(fragment){return [...document.querySelectorAll('.app-nav button')].find(button=>(button.getAttribute('onclick')||'').includes(fragment));}
  function setNavLabel(button,label){
    if(!button)return;
    const labels=[...button.querySelectorAll('span')].filter(span=>!span.classList.contains('icon'));
    labels.forEach(span=>span.textContent=label);
  }
  function organizeNavigation(){
    const nav=document.querySelector('.app-nav');if(!nav)return;
    const items={
      home:nav.querySelector('[data-screen="home"]'),
      train:nav.querySelector('[data-screen="workouts"]'),
      plan:nav.querySelector('[data-screen="plan"]'),
      progress:nav.querySelector('[data-screen="history"]'),
      coach:navButtonByAction("'coaching'"),
      recovery:navButtonByAction("'recovery'"),
      nutrition:navButtonByAction("'nutrition'"),
      library:navButtonByAction('openExerciseLibrary'),
      more:nav.querySelector('[data-screen="more"]')
    };
    const labels={home:'Home',train:'Train',plan:'Plan',progress:'Progress',coach:'Coach',recovery:'Recovery',nutrition:'Nutrition',library:'Library',more:'More'};
    Object.entries(labels).forEach(([key,label])=>setNavLabel(items[key],label));
    Object.entries(items).forEach(([key,button])=>{if(button){button.classList.remove('b135-nav-support-start','b135-nav-utility');button.dataset.navRole=key;}});
    if(items.coach)items.coach.hidden=controlMode()!=="coach";
    items.recovery?.classList.add('b135-nav-support-start');
    items.more?.classList.add('b135-nav-utility');
    ['home','train','plan','progress','coach','recovery','nutrition','library','more'].forEach(key=>{if(items[key])nav.appendChild(items[key]);});
  }

  function init(){
    const home=$('home');if(!home)return;
    if(!$('b135Home'))home.insertAdjacentHTML('afterbegin',markup());
    bind();organizeNavigation();setTimeout(()=>{organizeNavigation();render();},120);
    setInterval(()=>{if($('home')?.classList.contains('active'))render();},2500);
  }
  document.addEventListener('DOMContentLoaded',init);
  const prior=window.renderApp;
  if(typeof prior==='function')window.renderApp=function(){const out=prior.apply(this,arguments);setTimeout(()=>{organizeNavigation();render();},20);return out;};
  window.renderBellCommercialHome=render;
  window.selectBellCommercialWeekDay=selectWeekDay;
})();
