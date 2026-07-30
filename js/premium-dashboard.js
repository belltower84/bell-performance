"use strict";

let premiumQuoteOffset = 0;

function bellCanonicalPlanDateKey(item,block=data.trainingBlock,week=Number(data.trainingBlock?.currentWeek||1)){
  const days=['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
  const dayIndex=days.indexOf(item?.day);
  const monday=typeof bpWeekStartKey==='function'
    ? bpWeekStartKey(block,week)
    : (typeof planWeekStartKey==='function'?planWeekStartKey():mondayKeyFor(localDateKey()));
  if(dayIndex>=0)return addLocalDays(monday,dayIndex);
  return item?.scheduledDate||'';
}
function bellActivePlanItemsForDate(key=selectedDashboardDateKey()){
  const block=data.trainingBlock;
  const week=Math.max(1,Number(block?.currentWeek)||1);
  const plan=typeof bpWeekPlan==='function'&&block?bpWeekPlan(block,week):(data.plan||[]);
  return (plan||[]).filter(item=>{
    if(['skipped','replaced'].includes(item?.status))return false;
    return bellCanonicalPlanDateKey(item,block,week)===key;
  });
}
function bellRepairActivePlanDates(){
  const block=data.trainingBlock;if(!block)return false;
  const week=Math.max(1,Number(block.currentWeek)||1);
  let changed=false;
  (data.plan||[]).forEach(item=>{
    const canonical=bellCanonicalPlanDateKey(item,block,week);
    if(canonical&&item.scheduledDate!==canonical){item.scheduledDate=canonical;changed=true;}
  });
  if(changed&&typeof saveData==='function')saveData({render:false});
  return changed;
}
function premiumSelectedItems(){return bellActivePlanItemsForDate(selectedDashboardDateKey());}
function premiumAllSessions(){return premiumSelectedItems().flatMap(sessionsFromPlanItem);}
function premiumSessionType(session){return scheduleTypeForMission(session?.mission,session?.label,session?.detail)||'strength';}
function premiumDisplayLabel(session){
  const raw=String(session?.label||scaledTemplate(session?.mission)?.label||session?.mission||'Training')
    .replace(/^\s*(?:AM|A\.?M\.?|PM|P\.?M\.?)\s*[-–—:|•]*\s*/i,'')
    .replace(/\s*[-–—:|•]*\s*(?:AM|A\.?M\.?|PM|P\.?M\.?)\s*$/i,'')
    .replace(/\s*\((?:AM|A\.?M\.?|PM|P\.?M\.?)\)\s*/ig,' ')
    .trim();
  const type=premiumSessionType(session);
  if(type==='engine'){
    return raw
      .replace(/^\s*(?:engine|conditioning|cardio)\s*[-–—:|•]*\s*/i,'')
      .replace(/\s*[-–—:|•]*\s*(?:engine|conditioning|cardio)\s*$/i,'')
      .trim()||String(data.settings?.cardioType||'Engine');
  }
  const parts=raw.split(/\s+[—–|:]\s+/).map(x=>x.trim()).filter(Boolean);
  if(parts.length>1&&/\b(?:upper|lower|full body|strength|hypertrophy|power|powerbuilding|bodybuilding|session|workout)\b/i.test(parts[0])){
    return parts.slice(1).join(' — ');
  }
  return raw
    .replace(/^\s*(?:upper|lower|full body)?\s*(?:strength|hypertrophy|power|powerbuilding|bodybuilding|training|workout|session)(?:\s+[A-Z])?\s*[-–—:|•]*\s*/i,'')
    .replace(/\s*[-–—:|•]*\s*(?:strength|hypertrophy|power|powerbuilding|bodybuilding|training|workout|session)\s*$/i,'')
    .trim()||'Full Body';
}
function premiumInlineIcon(kind){
  const icons={
    strength:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9v6"/><path d="M6 7v10"/><path d="M9 6v12"/><path d="M15 6v12"/><path d="M18 7v10"/><path d="M21 9v6"/><path d="M9 12h6"/></svg>`,
    engine:`<img class="engine-mark-icon" src="./assets/icons/engine-mark.svg?v=8640" alt="" aria-hidden="true">`,
    core:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4c1.8 2.7 5.2 2.7 7 5.4-1.3 1.9-1.3 4.1 0 6-1.8 2.7-5.2 2.7-7 5.4-1.8-2.7-5.2-2.7-7-5.4 1.3-1.9 1.3-4.1 0-6C6.8 6.7 10.2 6.7 12 4Z"/></svg>`,
    rest:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 12c0 3.3 2.7 6 6 6 2.8 0 5.2-1.9 5.9-4.5A7 7 0 0 1 10.5 6 6 6 0 0 0 6 12Z"/></svg>`
  };
  return `<span class="premium-inline-icon ${kind}">${icons[kind]||icons.strength}</span>`;
}
function premiumSessionIcon(type){return premiumInlineIcon(type==='engine'?'engine':'strength');}

function premiumSessionArtwork(type,session){
  const copy=`${session?.label||''} ${session?.mission||''}`.toLowerCase();
  if(type==='engine') return './assets/artwork/engine/mountain-trail.jpg?v=8710';
  if(type==='core') return './assets/artwork/strength/custom-strength-shadows.jpg?v=8710';
  if(copy.includes('upper')) return './assets/artwork/strength/upper-body.jpg?v=8710';
  if(copy.includes('bodybuild')||copy.includes('hypertrophy')) return './assets/artwork/strength/bodybuilding.jpg?v=8710';
  if(copy.includes('power')||copy.includes('deadlift')||copy.includes('squat')) return './assets/artwork/strength/powerlifting.jpg?v=8710';
  return './assets/artwork/strength/strength-building.jpg?v=8710';
}
function premiumLocationSelector(){
  normalizeEquipmentSettings();const setup=data.settings.equipmentSetup,active=activeEquipmentLocation();
  return `<label class="premium-session-selector"><span>Training at</span><select onchange="switchEquipmentLocation(this.value)">${setup.locations.map(x=>`<option value="${x.id}" ${x.id===active.id?'selected':''}>${escapeHtml(x.name)}</option>`).join('')}</select></label>`;
}
function premiumEngineSelector(){
  const options=["Running","Cycling","Rower","Swimming","Hiking / Rucking","Sprint / Field","Air Bike","Elliptical","Stair Climber"],active=data.settings.cardioType||"Running";
  return `<label class="premium-session-selector engine-selector"><span>Engine mode</span><select onchange="switchQuickEngineMode(this.value)">${options.map(x=>`<option ${x===active?'selected':''}>${x}</option>`).join('')}</select></label>`;
}
function premiumSessionDescription(session){
  const template=scaledTemplate(session?.mission)||{};
  const raw=String(
    session?.description||
    session?.detail||
    template.description||
    template.detail||
    template.summary||
    template.coachBrief||
    ''
  ).replace(/\s+/g,' ').trim();
  if(raw) return raw;
  const type=premiumSessionType(session);
  if(type==='engine') return 'Build the engine with controlled, purposeful work at the prescribed effort.';
  const title=premiumDisplayLabel(session);
  return `Focused ${title.toLowerCase()} training with quality reps, controlled effort, and steady progression.`;
}

function premiumSessionAction(session){
  if(session.completed)return `<button class="premium-session-status completed" onclick="showScreen('history')">Completed ›</button>`;
  const active=data.activeWorkout?.planSessionKey===session.sessionKey;
  return `<div class="premium-mission-actions"><button class="premium-preview-button" onclick="event.stopPropagation();previewPlannedWorkout('${session.planId}','${session.sessionKey}','${String(session.mission).replaceAll("'","\\'")}')">Preview</button><button class="premium-start-button" onclick="event.stopPropagation();beginPlannedWorkout('${session.planId}','${session.sessionKey}','${String(session.mission).replaceAll("'","\\'")}')">${active?'Resume':'Start Workout'} ›</button></div>`;
}
function premiumSessionRow(session){
  const type=premiumSessionType(session), template=scaledTemplate(session.mission),duration=Number(session.prescribedDuration)||Number(template?.duration)||30;
  const description=premiumSessionDescription(session);
  return `<article class="premium-session-row compact-mission ${type} ${session.completed?'completed':''}" onclick="${session.completed?"showScreen('history')":`beginPlannedWorkout('${session.planId}','${session.sessionKey}','${String(session.mission).replaceAll("'","\'")}')`}"><div class="premium-session-copy"><strong>${escapeHtml(premiumDisplayLabel(session))}</strong><p>${escapeHtml(description)}</p><small>◷ ${duration} min estimated</small></div>${premiumSessionAction(session)}</article>`;
}
function premiumOptionalCoreRow(){
  const key=selectedDashboardDateKey(),done=optionalCoreCompletedForDate(key),name=coreSessionName(key),template=coreTemplate(name),art=premiumSessionArtwork('core');
  return `<article class="premium-session-row premium-session-hero optional core ${done?'completed':''}" style="--session-art:url('${art}')"><div class="premium-session-shade"></div><div class="premium-session-icon">${done?'<span class="premium-complete-check">✓</span>':premiumInlineIcon('core')}</div><div class="premium-session-copy"><span>Optional Core</span><strong>${escapeHtml(template.label)}</strong><small>${template.duration} min · Does not affect completion</small></div><button class="premium-session-status" ${done?'disabled':''} onclick="beginOptionalCore('${key}')">${done?'Completed':'Start ›'}</button></article>`;
}
function renderPremiumMission(){
  const key=selectedDashboardDateKey(),date=localDateFromKey(key),today=localDateKey(),sessions=premiumAllSessions().sort((a,b)=>{const order={strength:0,engine:1};return (order[premiumSessionType(a)]??2)-(order[premiumSessionType(b)]??2);});
  const completed=sessions.filter(x=>x.completed).length,total=sessions.length,pct=total?Math.round(completed/total*100):100;
  setText('premiumMissionDate',key===today?'Today':date.toLocaleDateString('en-US',{weekday:'long',month:'short',day:'numeric'}));
  const todayButton=byId('premiumTodayButton');if(todayButton)todayButton.textContent=key===today?'Today':'Return to Today';
  setText('premiumCompletionCount',String(completed));setText('premiumCompletionTotal',`of ${total}`);setText('premiumCompletionLabel',total?(completed===total?'MISSION COMPLETE':'COMPLETE'):'REST DAY');
  const ring=byId('premiumCompletionRing');if(ring)ring.style.setProperty('--mission-progress',`${pct*3.6}deg`);
  const stack=byId('premiumSessionStack');if(!stack)return;
  stack.innerHTML=sessions.map(premiumSessionRow).join('');
  stack.classList.remove('is-scrollable');
  if(!sessions.length)stack.insertAdjacentHTML('afterbegin','<article class="premium-session-row rest"><div class="premium-session-icon">☾</div><div class="premium-session-copy"><span>Recovery</span><strong>No prescribed training</strong><small>Mobility, walking, and daily standards remain available.</small></div></article>');
}

function premiumWeekSessionChip(session){
  const type=premiumSessionType(session), title=escapeHtml(session.label||scaledTemplate(session.mission)?.label||session.mission);
  return `<div class="premium-week-chip ${type} ${session.completed?'completed':''}" title="${title}">${premiumInlineIcon(type)}${session.completed?'<i class="premium-week-chip-check">✓</i>':''}</div>`;
}
function premiumWeekRestChip(){return `<div class="premium-week-chip rest" title="Rest day">${premiumInlineIcon('rest')}</div>`;}

function renderPremiumWeek(){
  const block=typeof bpResolvePlanBlock==='function'?bpResolvePlanBlock():data.trainingBlock;
  if(!block){return;}
  if(typeof bpPrepareBlockPlan==='function')bpPrepareBlockPlan(block);
  const week=typeof bpCurrentTimelineWeek==='function'?bpCurrentTimelineWeek(block):Number(block.currentWeek||1);
  const plan=typeof bpWeekPlan==='function'?bpWeekPlan(block,week):(data.plan||[]);
  const monday=typeof bpWeekStartKey==='function'?bpWeekStartKey(block,week):mondayKeyFor(selectedDashboardDateKey());
  const selected=week===Number(data.trainingBlock?.currentWeek||1)&&block===data.trainingBlock?selectedDashboardDateKey():monday;
  const days=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],fullDays=['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
  const phase=typeof bpPhaseForWeek==='function'?bpPhaseForWeek(week,Number(block.lengthWeeks)||12):{name:'Training'};
  setText('premiumWeekKicker',typeof bpWeekStatus==='function'&&bpWeekStatus(block,week)==='active'?'Weekly Schedule':typeof bpWeekStatus==='function'&&bpWeekStatus(block,week)==='complete'?'Completed Week':'Plan Preview');
  setText('premiumWeekTitle',`Week ${week} · ${phase.name}`);
  const host=byId('premiumWeekDays');if(!host)return;
  host.innerHTML=days.map((day,index)=>{
    const key=addLocalDays(monday,index),items=plan.filter(x=>(x.day===fullDays[index]||planDateKey(x)===key)&&!['skipped','replaced'].includes(x.status)),sessions=items.flatMap(sessionsFromPlanItem),allDone=sessions.length&&sessions.every(x=>x.completed),chips=sessions.length?sessions.slice(0,2).map(premiumWeekSessionChip).join(''):premiumWeekRestChip();
    const label=sessions.length?sessions.map(x=>x.label||scaledTemplate(x.mission)?.label||x.mission).join(', '):'Rest / recovery';
    const isActive=block===data.trainingBlock&&week===Number(block.currentWeek||1);
    const action=isActive?`setDashboardDate('${key}')`:`bpPreviewWeek(${week})`;
    return `<button class="premium-week-day-card ${key===selected?'selected':''} ${key===localDateKey()?'today':''} ${allDone?'completed':''} ${sessions.length>1?'two-a-day':''}" onclick="${action}" aria-label="${day} ${localDateFromKey(key).getDate()}: ${escapeHtml(label)}"><span>${day}</span><strong>${localDateFromKey(key).getDate()}</strong><div class="premium-week-chips">${chips}</div></button>`;
  }).join('');
  const selectedItems=plan.filter(x=>(x.day===fullDays[0]||planDateKey(x)===selected)&&!['skipped','replaced'].includes(x.status)).flatMap(sessionsFromPlanItem);
  const summary=byId('premiumWeekSelectedSummary');
  if(summary){
    const status=typeof bpWeekStatus==='function'?bpWeekStatus(block,week):'planned';
    const copy=status==='active'?'Tap a day to view today’s mission.':'Tap any day to open the full week preview.';
    summary.innerHTML=`<span>${status==='active'?'Current week':status==='complete'?'Completed week':'Future week preview'}</span><strong>${copy}</strong><button type="button" onclick="bpPreviewWeek(${week})">Preview week ›</button>`;
  }
}

function premiumReadinessMetric(value){return `${Math.max(1,Math.min(5,Math.round(Number(value)||1)))}/5`;}
function premiumSleepDuration(r){if(typeof readinessSleepLabel==='function'&&(r?.checkInVersion==='quick-v1'||r?.sleepState))return readinessSleepLabel(r);const h=Math.max(0,Number(r.sleepHours)||0),m=Math.max(0,Number(r.sleepMinutes)||0);return `${h}h ${String(m).padStart(2,'0')}m`;}
function renderPremiumReadiness(){
  const score=readinessScore(),status=readinessStatus(score),r=data.settings.readiness||{};
  const checkedIn=r.lastPromptDate===todayKey();
  const descriptions={GREEN:'High readiness. You are recovered and ready for the full training prescription.',YELLOW:'Moderate readiness. Train with purpose and let quality lead the day.',RED:'Low readiness. Recovery comes first, so today’s demand has been adjusted.'};
  setText('premiumReadinessScore',checkedIn?String(score):'—');setText('premiumReadinessStatus',checkedIn?status:'CHECK IN');setText('premiumReadinessDetail',checkedIn?descriptions[status]:'Complete today’s check-in to personalize your training.');
  setText('premiumSleep',premiumSleepDuration(r));setText('premiumBody',typeof readinessBodyLabel==='function'?readinessBodyLabel(r):premiumReadinessMetric(r.recoveryStatus));setText('premiumEnergy',typeof readinessEnergyLabel==='function'?readinessEnergyLabel(r):premiumReadinessMetric(r.energy));setText('commandPain',typeof readinessPainLabel==='function'?readinessPainLabel(r):'None');setText('commandTime',typeof readinessTimeLabel==='function'?readinessTimeLabel(r):timeAvailabilityLabel(r.timeAvailability));
  const card=byId('premiumReadinessCard');if(card){card.dataset.status=status.toLowerCase();card.dataset.complete=checkedIn?'true':'false';card.setAttribute('aria-label',checkedIn?`Readiness ${score}, ${status}`:'Readiness check-in not completed');}
  const btn=card?.querySelector('.premium-readiness-update');if(btn)btn.textContent=(checkedIn?'Update':'Check In');
}
function rotatePremiumQuote(){premiumQuoteOffset++;renderPremiumQuote();}
function renderPremiumQuote(){
  const pool=(window.BELL_QUOTE_CACHE?.length?window.BELL_QUOTE_CACHE:motivationalQuotes)||[];
  let quote;
  if(pool.length){const base=Math.floor((new Date()-new Date(new Date().getFullYear(),0,0))/86400000);quote=pool[(base+premiumQuoteOffset)%pool.length];}
  if(Array.isArray(quote)){setText('premiumQuoteText',quote[0]);setText('premiumQuoteSource',quote[1]||'Bell Performance');}
  else if(quote&&typeof quote==='object'){setText('premiumQuoteText',quote.quote||quote.text||'Consistency beats perfection. Win today.');setText('premiumQuoteSource',quote.source||quote.author||'Bell Performance');}
  else {const fallback=getDailyQuote();setText('premiumQuoteText',fallback?.[0]||'Consistency beats perfection. Win today.');setText('premiumQuoteSource',fallback?.[1]||'Bell Performance Coach');}
}
function togglePremiumSupport(){const panel=byId('premiumSupportPanel');panel?.classList.toggle('hidden');renderPremiumSupport();}
function renderPremiumSupport(){
  const host=byId('premiumSupportContent');if(!host)return;const key=selectedDashboardDateKey(),mobilityDone=data.mobility.completedDates.includes(key),coreDone=optionalCoreCompletedForDate(key);
  host.innerHTML=`<div class="premium-support-art mobility" style="--support-art:url('./assets/artwork/engine/alpine-lake.jpg?v=8710')"><div class="premium-support-art-shade"></div><div class="premium-support-art-copy"><span class="premium-kicker">Recovery Mobility</span><strong>${data.mobility.minutes||10} min ${escapeHtml(resolvedMobilityFocus())}</strong><p>${mobilityDone?'Completed for this day.':'Open the full mobility prescription and work through each movement.'}</p><button class="premium-outline-button" ${mobilityDone?'disabled':''} onclick="openMobilityRoutine('${key}')">${mobilityDone?'Mobility Complete':'View Mobility Routine'}</button></div></div><div class="premium-support-art core" style="--support-art:url('./assets/artwork/strength/custom-strength-shadows.jpg?v=8710')"><div class="premium-support-art-shade"></div><div class="premium-support-art-copy"><span class="premium-kicker">Optional Core</span><strong>${escapeHtml(coreTemplate(coreSessionName(key)).label)}</strong><p>Rotates by goal and recent core exposure. Never blocks mission completion.</p><button class="premium-outline-button" ${coreDone?'disabled':''} onclick="beginOptionalCore('${key}')">${coreDone?'Core Complete':'Start Core'}</button></div></div>`;
}
function percentChange(current,previous){if(!previous)return current?100:0;return Math.round((current-previous)/previous*100);}
function renderPremiumProgress(){
  const current=weeklyPerformanceSummary(0),previous=weeklyPerformanceSummary(-1),planned=Math.max(1,current.planned),consistency=Math.round(current.completed/planned*100),strength=percentChange(current.volume,previous.volume),engine=current.minutes-previous.minutes;
  setText('premiumConsistency',`${consistency}%`);setText('premiumConsistencyNote',consistency>=80?'On Track':consistency>=60?'Building':'Needs Attention');
  setText('premiumStrengthTrend',`${strength>=0?'+':''}${strength}%`);setText('premiumEngineTrend',`${engine>=0?'+':''}${engine} min`);setText('premiumWeightTrend',`${Number(data.settings.weight)||'—'} lb`);
}
function renderPremiumCoach(){
  const enabled=Boolean(data.trainingBlock?.enabled),week=enabled?Math.max(1,Number(blockWeek())||1):0,total=enabled?Math.max(1,Number(data.trainingBlock.lengthWeeks)||12):0;
  const title=enabled?`${dualBlockPhase()} · Week ${week} of ${total}`:'Build your first mission';
  setText('premiumCoachTitle',title);setText('premiumCoachText',coachRecommendation());setText('premiumWeekChip',enabled?`Week ${week} of ${total}`:'Open Plan');
  const pct=enabled?Math.max(0,Math.min(100,Math.round((week/total)*100))):0;
  setText('premiumMissionProgressText',enabled?`Week ${week} of ${total}`:'No active plan');
  const bar=byId('premiumMissionProgressBar');if(bar)bar.style.width=`${pct}%`;
  const greeting=byId('bell11Greeting');if(greeting){const hour=new Date().getHours();greeting.textContent=`Good ${hour<12?'Morning':hour<18?'Afternoon':'Evening'}, ${data.settings?.athleteName||'Athlete'}`;}
  const statusLine=byId('bell11MissionStatus');if(statusLine){const sessions=premiumAllSessions();const complete=sessions.filter(x=>x.completed).length;statusLine.textContent=sessions.length?`${complete} of ${sessions.length} prescribed sessions complete today.`:'Recovery day. Keep the daily standards and prepare for the next mission.';}
}
function renderPremiumStandards(){
  const host=byId('premiumStandardsGrid');if(!host)return;const items=(data.habits?.items||[]).slice(0,4),done=new Set(typeof habitCompletedIds==='function'?habitCompletedIds(todayKey()):[]);
  host.innerHTML=items.length?items.map(item=>{const copy=habitDisplay(item),complete=done.has(item.id);return `<button class="${complete?'complete':''}" onclick="toggleHabit('${escapeHtml(item.id)}');renderPremiumStandards()"><i>${complete?'✓':'○'}</i><span>${escapeHtml(copy.title)}</span><strong>${complete?'Complete':escapeHtml(copy.detail||'Today')}</strong></button>`}).join(''):'<button onclick="showScreen(\'habits\')"><i>+</i><span>Set Daily Standards</span><strong>Open Habits</strong></button>';
}

function renderPremiumNext(){
  const current=selectedDashboardDateKey();
  let found=null;
  for(let i=1;i<=7&&!found;i++){
    const key=addLocalDays(current,i);
    const sessions=(data.plan||[]).filter(item=>planDateKey(item)===key&&!['skipped','replaced'].includes(item.status)).flatMap(sessionsFromPlanItem);
    if(sessions.length)found={key,session:sessions[0]};
  }
  if(!found){setText('premiumNextTitle','No upcoming session');setText('premiumNextDetail','Open the full schedule to plan ahead.');return;}
  const date=localDateFromKey(found.key), template=scaledTemplate(found.session.mission);
  setText('premiumNextTitle',`${date.toLocaleDateString('en-US',{weekday:'long'})} · ${found.session.label||template?.label||found.session.mission}`);
  setText('premiumNextDetail',`${Number(found.session.prescribedDuration)||Number(template?.duration)||30} min · Tap for full schedule`);
}
function renderPremiumDashboard(){renderPremiumQuote();renderPremiumReadiness();renderPremiumMission();renderPremiumNext();renderPremiumSupport();renderPremiumProgress();renderPremiumCoach();renderPremiumStandards();}

const premiumBaseRenderApp=renderApp;
renderApp=function(){premiumBaseRenderApp();renderPremiumDashboard();};
