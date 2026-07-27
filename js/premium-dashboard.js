"use strict";

let premiumQuoteOffset = 0;

function premiumSelectedItems(){
  const key=selectedDashboardDateKey();
  return (data.plan||[]).filter(item=>planDateKey(item)===key&&!['skipped','replaced'].includes(item.status));
}
function premiumAllSessions(){return premiumSelectedItems().flatMap(sessionsFromPlanItem);}
function premiumSessionType(session){return scheduleTypeForMission(session?.mission,session?.label,session?.detail)||'strength';}
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
function premiumSessionAction(session){
  if(session.completed)return `<button class="premium-session-status completed" onclick="showScreen('history')">Completed ›</button>`;
  const active=data.activeWorkout?.planSessionKey===session.sessionKey;
  return `<button class="premium-start-button" onclick="beginPlannedWorkout('${session.planId}','${session.sessionKey}','${String(session.mission).replaceAll("'","\\'")}')">${active?'Resume Workout':'Start Workout'} ›</button>`;
}
function premiumSessionRow(session){
  const type=premiumSessionType(session), template=scaledTemplate(session.mission),duration=Number(session.prescribedDuration)||Number(template?.duration)||30,art=premiumSessionArtwork(type,session);
  return `<article class="premium-session-row premium-session-hero ${type} ${session.completed?'completed':''}" style="--session-art:url('${art}')"><div class="premium-session-shade"></div><div class="premium-session-icon">${session.completed?'<span class="premium-complete-check">✓</span>':premiumSessionIcon(type)}</div><div class="premium-session-copy"><div class="premium-session-titleline"><span>${type==='engine'?'Engine':'Strength'}</span>${type==='engine'?premiumEngineSelector():premiumLocationSelector()}</div><strong>${escapeHtml(session.label||template?.label||session.mission)}</strong><small>◷ ${duration} min${session.detail?` · ${escapeHtml(session.detail)}`:''}</small></div>${premiumSessionAction(session)}</article>`;
}
function premiumOptionalCoreRow(){
  const key=selectedDashboardDateKey(),done=optionalCoreCompletedForDate(key),name=coreSessionName(key),template=coreTemplate(name),art=premiumSessionArtwork('core');
  return `<article class="premium-session-row premium-session-hero optional core ${done?'completed':''}" style="--session-art:url('${art}')"><div class="premium-session-shade"></div><div class="premium-session-icon">${done?'<span class="premium-complete-check">✓</span>':premiumInlineIcon('core')}</div><div class="premium-session-copy"><span>Optional Core</span><strong>${escapeHtml(template.label)}</strong><small>${template.duration} min · Does not affect completion</small></div><button class="premium-session-status" ${done?'disabled':''} onclick="beginOptionalCore('${key}')">${done?'Completed':'Start ›'}</button></article>`;
}
function renderPremiumMission(){
  const key=selectedDashboardDateKey(),date=localDateFromKey(key),today=localDateKey(),sessions=premiumAllSessions();
  const completed=sessions.filter(x=>x.completed).length,total=sessions.length,pct=total?Math.round(completed/total*100):100;
  setText('premiumMissionDate',key===today?'Today':date.toLocaleDateString('en-US',{weekday:'long',month:'short',day:'numeric'}));
  const todayButton=byId('premiumTodayButton');if(todayButton)todayButton.textContent=key===today?'Today':'Return to Today';
  setText('premiumCompletionCount',String(completed));setText('premiumCompletionTotal',`of ${total}`);setText('premiumCompletionLabel',total?(completed===total?'MISSION COMPLETE':'COMPLETE'):'REST DAY');
  const ring=byId('premiumCompletionRing');if(ring)ring.style.setProperty('--mission-progress',`${pct*3.6}deg`);
  const stack=byId('premiumSessionStack');if(!stack)return;
  const eligible=sessions.length<=1;
  stack.innerHTML=sessions.map(premiumSessionRow).join('')+(eligible?premiumOptionalCoreRow():'');
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
function premiumSleepDuration(r){const h=Math.max(0,Number(r.sleepHours)||0),m=Math.max(0,Number(r.sleepMinutes)||0);return `${h}h ${String(m).padStart(2,'0')}m`;}
function renderPremiumReadiness(){
  const score=readinessScore(),status=readinessStatus(score),r=data.settings.readiness||{};
  setText('premiumReadinessScore',String(score));setText('premiumReadinessStatus',status);setText('premiumReadinessDetail',trainingStatusText(status));
  setText('premiumSleep',premiumSleepDuration(r));setText('premiumEnergy',premiumReadinessMetric(r.energy));setText('premiumSoreness',premiumReadinessMetric(r.recoveryStatus));setText('premiumMotivation',premiumReadinessMetric(r.motivation));
  const card=byId('premiumReadinessCard');if(card)card.dataset.status=status.toLowerCase();
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
function renderPremiumCoach(){const title=data.trainingBlock?.enabled?`${dualBlockPhase()} · Week ${blockWeek()} of ${data.trainingBlock.lengthWeeks}`:'Build your first mission';setText('premiumCoachTitle',title);setText('premiumCoachText',coachRecommendation());setText('premiumWeekChip',data.trainingBlock?.enabled?`Week ${blockWeek()} of ${data.trainingBlock.lengthWeeks}`:'Open Plan');}
function renderPremiumStandards(){
  const host=byId('premiumStandardsGrid');if(!host)return;const items=(data.habits?.items||[]).slice(0,4),done=new Set(typeof habitCompletedIds==='function'?habitCompletedIds(todayKey()):[]);
  host.innerHTML=items.length?items.map(item=>{const copy=habitDisplay(item),complete=done.has(item.id);return `<button class="${complete?'complete':''}" onclick="toggleHabit('${escapeHtml(item.id)}');renderPremiumStandards()"><i>${complete?'✓':'○'}</i><span>${escapeHtml(copy.title)}</span><strong>${complete?'Complete':escapeHtml(copy.detail||'Today')}</strong></button>`}).join(''):'<button onclick="showScreen(\'habits\')"><i>+</i><span>Set Daily Standards</span><strong>Open Habits</strong></button>';
}
function renderPremiumDashboard(){renderPremiumQuote();renderPremiumReadiness();renderPremiumMission();renderPremiumWeek();renderPremiumSupport();renderPremiumProgress();renderPremiumCoach();renderPremiumStandards();}

const premiumBaseRenderApp=renderApp;
renderApp=function(){premiumBaseRenderApp();renderPremiumDashboard();};
