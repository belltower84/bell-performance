
"use strict";

/* Bell Performance 12.2.2 — Unified Mission Flow view layer.
   This file intentionally reuses the existing Bell planning, readiness,
   workout, nutrition, history, and Bell Core functions. */

function commandSetText(id,value){const el=document.getElementById(id);if(el)el.textContent=value==null?'—':String(value);}
function commandReadinessWord(value,kind){const n=Math.max(1,Math.min(5,Math.round(Number(value)||3)));if(kind==='soreness')return ['High','High','Moderate','Mild','Low'][n-1];return ['Low','Low','Moderate','Good','High'][n-1];}
function commandAvailableTime(readiness){return ({1:'25 min',2:'40 min',3:'55 min',4:'70 min',5:'90 min'})[Number(readiness?.timeAvailability)||3]||'55 min';}
function commandRelativeTime(iso){if(!iso)return 'Sync pending';const seconds=Math.max(0,Math.floor((Date.now()-new Date(iso).getTime())/1000));if(seconds<60)return 'Synced just now';const minutes=Math.floor(seconds/60);if(minutes<60)return `Synced ${minutes} min ago`;const hours=Math.floor(minutes/60);if(hours<24)return `Synced ${hours} hr ago`;return `Synced ${Math.floor(hours/24)} day ago`;}
function commandMissionInfo(){
  const block=data.trainingBlock||{},mission=block.mission||{};
  const title=mission.path==='event'?(mission.eventName||mission.eventType||block.goalType):(mission.developmentGoal||block.dualGoals?.strengthGoal||block.goalType||'Current Mission');
  const target=mission.eventDate||mission.secondaryGoal?.targetDate||block.targetDate||'';
  let days=null;if(target){try{days=Math.max(0,typeof daysBetweenKeys==='function'?daysBetweenKeys(todayKey(),target):Math.ceil((new Date(`${target}T12:00:00`)-new Date())/86400000));}catch(_){days=null;}}
  return {title,target,days,mission,block};
}
function commandCloudExplanation(){return bellCloud?.lastDecision?.explanation||bellCloud?.today?.adaptation?.explanation||'';}
function commandCloudAction(){return bellCloud?.lastDecision?.decision?.action||bellCloud?.today?.adaptation?.action?.action||'';}
function commandFirstIncompleteSession(sessions=premiumAllSessions()){return sessions.find(session=>!session.completed)||sessions[0]||null;}
function commandSessionCall(session,mode='start'){
  if(!session)return;
  if(mode==='start')beginPlannedWorkout(session.planId,session.sessionKey,session.mission);
  else previewPlannedWorkout(session.planId,session.sessionKey,session.mission);
}
function commandPrimaryExercise(session){const template=scaledTemplate(session?.mission)||{};return template.exercises?.[0]||null;}
function commandAccessoryCount(session){const template=scaledTemplate(session?.mission)||{};return Math.max(0,(template.exercises||[]).length-1);}
function commandSessionSummary(sessions){
  if(!sessions.length)return '<div class="command-session-block"><span>Recovery</span><strong>No prescribed training</strong><small>Mobility, walking, and daily standards remain available.</small></div>';
  const blocks=[];const strength=sessions.find(x=>premiumSessionType(x)==='strength');const engine=sessions.find(x=>premiumSessionType(x)==='engine');
  if(strength){const exercise=commandPrimaryExercise(strength),template=scaledTemplate(strength.mission)||{};blocks.push(`<div class="command-session-block"><span>Main Strength</span><strong>${escapeHtml(exercise?.name||premiumDisplayLabel(strength))}</strong><small>${exercise?`${exercise.sets||''}×${exercise.reps||''}`:`${Number(strength.prescribedDuration)||Number(template.duration)||30} min`}</small></div>`);const accessories=commandAccessoryCount(strength);blocks.push(`<div class="command-session-block"><span>Accessories</span><strong>${accessories} movement${accessories===1?'':'s'}</strong><small>${escapeHtml((template.exercises||[]).slice(1,3).map(x=>x.name).join(' · ')||'Purpose-matched assistance')}</small></div>`);}
  if(engine){const template=scaledTemplate(engine.mission)||{};blocks.push(`<div class="command-session-block"><span>Engine</span><strong>${escapeHtml(premiumDisplayLabel(engine))}</strong><small>${Number(engine.prescribedDuration)||Number(template.duration)||30} min · prescribed effort</small></div>`);}
  sessions.filter(x=>x!==strength&&x!==engine).slice(0,Math.max(0,3-blocks.length)).forEach(session=>blocks.push(`<div class="command-session-block"><span>${escapeHtml(premiumSessionType(session))}</span><strong>${escapeHtml(premiumDisplayLabel(session))}</strong><small>${Number(session.prescribedDuration)||Number(scaledTemplate(session.mission)?.duration)||30} min</small></div>`));
  return blocks.slice(0,3).join('');
}

function commandUnifiedCloudMission(key=selectedDashboardDateKey()){
  if(typeof bellCloudConnected!=="function"||!bellCloudConnected()||key!==todayKey())return null;
  const state=bellCloud?.today;if(!state)return null;
  if((state.status==='planned'||state.status==='adapted')&&state.session?.session)return {mode:'active',state,payload:state.session};
  if(state.status==='today_complete')return {mode:'complete',state,payload:null};
  if(state.status==='program_complete')return {mode:'program-complete',state,payload:null};
  return null;
}
function commandCloudSessionType(payload){const raw=String(payload?.session_type||payload?.session?.session_type||payload?.session?.type||'training').toLowerCase();return raw==='engine'?'Engine':raw==='recovery'?'Recovery':raw==='strength'?'Strength':raw.replaceAll('_',' ').replace(/\b\w/g,x=>x.toUpperCase());}
function commandCloudSessionSummary(payload){
  if(!payload?.session)return '<div class="command-session-block"><span>Recovery</span><strong>No remaining training</strong><small>Today’s prescribed work is complete.</small></div>';
  const meta=payload.session||{},type=commandCloudSessionType(payload),blocks=[];
  if(type==='Engine'){const engine=payload.engine_prescription||{};blocks.push(`<div class="command-session-block"><span>Engine</span><strong>${escapeHtml(engine.mode||meta.title||'Conditioning')}</strong><small>${Number(engine.duration_minutes)||Number(meta.estimated_minutes)||30} min · ${escapeHtml(engine.intensity||'prescribed effort')}</small></div>`);if(engine.structure||engine.description)blocks.push(`<div class="command-session-block"><span>Prescription</span><strong>${escapeHtml(engine.structure||'Controlled work')}</strong><small>${escapeHtml(engine.description||payload.coach_summary||'Execute the prescribed effort with control.')}</small></div>`);}
  else{(payload.exercise_blocks||[]).slice(0,3).forEach((block,index)=>{const rx=block.prescription||{},label=index===0?'Main Strength':block.role||block.slot_name||'Training';blocks.push(`<div class="command-session-block"><span>${escapeHtml(String(label).replaceAll('_',' '))}</span><strong>${escapeHtml(block.name||'Training Exercise')}</strong><small>${Number(rx.sets)||1} × ${escapeHtml(String(rx.reps||'As prescribed'))}${Number.isFinite(Number(rx.target_rpe))?` · RPE ${Number(rx.target_rpe)}`:''}</small></div>`);});}
  if(!blocks.length)blocks.push(`<div class="command-session-block"><span>${escapeHtml(type)}</span><strong>${escapeHtml(meta.title||meta.name||'Bell Core Training')}</strong><small>${Number(meta.estimated_minutes)||Number(meta.requested_minutes)||45} min</small></div>`);
  return blocks.slice(0,3).join('');
}
function commandCloudCompleteSummary(state){
  const completed=Array.isArray(state?.completed_today)?state.completed_today:[],next=state?.next_session_preview;const blocks=[];
  completed.slice(0,2).forEach(item=>blocks.push(`<div class="command-session-block complete"><span>Completed</span><strong>${escapeHtml(item?.title||'Training Session')}</strong><small>${escapeHtml(commandCloudSessionType({session_type:item?.session_type}))} · recorded in Bell Core</small></div>`));
  blocks.push(`<div class="command-session-block"><span>${next?'Next Session':'Recovery'}</span><strong>${escapeHtml(next?.title||'Recover and prepare')}</strong><small>${next?`${Number(next.estimated_minutes)||45} min · preview only`:'No additional training is prescribed today.'}</small></div>`);
  return blocks.slice(0,3).join('');
}

renderPremiumReadiness=function(){
  const score=readinessScore(),status=readinessStatus(score),r=data.settings.readiness||{},checkedIn=r.lastPromptDate===todayKey();
  const descriptions={GREEN:'High readiness. You are recovered and ready for the full training prescription.',YELLOW:'Moderate readiness. Quality leads today and nonessential volume can be trimmed.',RED:'Low readiness. Bell has reduced demand and placed recovery first.'};
  commandSetText('premiumReadinessScore',checkedIn?score:'—');commandSetText('premiumReadinessStatus',checkedIn?(status==='GREEN'?'READY':status==='YELLOW'?'CAUTION':'RECOVER'):'CHECK IN');commandSetText('premiumReadinessDetail',checkedIn?descriptions[status]:'Complete today’s check-in to personalize your training.');
  commandSetText('premiumSleep',premiumSleepDuration(r));commandSetText('premiumEnergy',commandReadinessWord(r.energy));commandSetText('premiumSoreness',commandReadinessWord(r.recoveryStatus,'soreness'));commandSetText('premiumMotivation',commandReadinessWord(r.motivation));commandSetText('commandPain',data.settings?.injuryProfile?.hasLimitations?'Review':'None');commandSetText('commandTime',commandAvailableTime(r));
  const card=document.getElementById('premiumReadinessCard');if(card){card.dataset.status=status.toLowerCase();card.dataset.complete=checkedIn?'true':'false';}
  const ring=document.getElementById('commandReadinessRing');if(ring)ring.style.setProperty('--score-deg',`${checkedIn?Math.max(0,Math.min(100,score))*3.6:0}deg`);
  const btn=card?.querySelector('.premium-readiness-update');if(btn)btn.textContent=checkedIn?'Update Check-In ›':'Check In ›';
};

renderPremiumMission=function(){
  const key=selectedDashboardDateKey(),date=localDateFromKey(key),today=localDateKey(),cloudMission=commandUnifiedCloudMission(key);
  const missionCard=document.querySelector('.command-mission-card');if(missionCard)missionCard.dataset.missionSource=cloudMission?'bell-core':'local';
  commandSetText('premiumMissionDate',key===today?'Today':date.toLocaleDateString('en-US',{month:'short',day:'numeric'}));const todayButton=document.getElementById('premiumTodayButton');if(todayButton)todayButton.textContent=key===today?'Today':'Return';
  const start=document.getElementById('commandStartWorkout'),view=document.getElementById('commandViewSession'),modify=document.getElementById('commandModifySession'),stack=document.getElementById('premiumSessionStack');

  if(cloudMission?.mode==='active'){
    const state=cloudMission.state,payload=cloudMission.payload,meta=payload.session||{},completedCount=Array.isArray(state.completed_today)?state.completed_today.length:0,remaining=Math.max(1,Number(state.remaining_today)||1),total=completedCount+remaining;
    commandSetText('premiumCompletionCount',completedCount);commandSetText('premiumCompletionTotal',`of ${total}`);commandSetText('premiumCompletionLabel',completedCount?'IN PROGRESS':'BELL CORE');
    commandSetText('commandMissionTitle',meta.title||meta.name||'Bell Core Training');
    commandSetText('commandMissionPurpose',state.adaptation?.explanation||payload.coach_notes?.session_focus||payload.coach_summary||'Bell selected this session from your mission, current phase, readiness, equipment, and training history.');
    commandSetText('commandMissionDuration',`${Number(meta.estimated_minutes)||Number(meta.requested_minutes)||45} min`);commandSetText('commandMissionType',commandCloudSessionType(payload));commandSetText('commandMissionPriority',state.status==='adapted'?'Readiness Adjusted':'Primary Session');
    if(stack)stack.innerHTML=commandCloudSessionSummary(payload);
    if(start){start.disabled=false;const active=data.activeWorkout?.cloudSessionId===meta.session_id;start.textContent=active?'▶ Resume Workout':'▶ Start Workout';start.onclick=()=>bellStartCloudWorkout();}
    if(view){view.disabled=false;view.textContent='☷ View Session';view.onclick=()=>bellPreviewCloudWorkout();}
    if(modify){modify.disabled=false;modify.textContent='✎ View Rationale';modify.onclick=()=>openCommandTile('coaching');}
    commandSetText('commandAdjustmentTitle',state.status==='adapted'?'Adjusted for today':'Bell Core prescription');
    commandSetText('commandAdjustmentDetail',state.adaptation?.explanation||'The final prescription is synchronized with Bell Core.');
    return;
  }

  if(cloudMission?.mode==='complete'||cloudMission?.mode==='program-complete'){
    const state=cloudMission.state,next=state.next_session_preview,completedCount=Array.isArray(state.completed_today)?state.completed_today.length:0;
    commandSetText('premiumCompletionCount',completedCount);commandSetText('premiumCompletionTotal',completedCount?`of ${completedCount}`:'Complete');commandSetText('premiumCompletionLabel',cloudMission.mode==='program-complete'?'PROGRAM COMPLETE':'MISSION COMPLETE');
    commandSetText('commandMissionTitle',cloudMission.mode==='program-complete'?'Training Program Complete':'Today’s Mission Complete');
    commandSetText('commandMissionPurpose',cloudMission.mode==='program-complete'?'Your current Bell Core plan is complete. Review your results before building the next mission.':'Training is complete for today. Recover, refuel, and prepare for the next prescribed session.');
    commandSetText('commandMissionDuration',completedCount?`${completedCount} session${completedCount===1?'':'s'} complete`:'Complete');commandSetText('commandMissionType','Recovery & Review');commandSetText('commandMissionPriority','Recover & Refuel');
    if(stack)stack.innerHTML=commandCloudCompleteSummary(state);
    if(start){start.disabled=false;start.textContent='✓ View Results';start.onclick=()=>showScreen('history');}
    if(view){view.disabled=!next;view.textContent=next?'☷ Preview Next Session':'☷ Open Full Plan';view.onclick=next?()=>bellPreviewNextCloudWorkout():()=>showScreen('plan');}
    if(modify){modify.disabled=false;modify.textContent='♥ Recovery';modify.onclick=()=>openCommandTile('recovery');}
    commandSetText('commandAdjustmentTitle',cloudMission.mode==='program-complete'?'Program complete':'Mission complete');commandSetText('commandAdjustmentDetail',next?'The next workout is preview-only and cannot be started from today’s dashboard.':'No additional workout will be pulled forward today.');
    return;
  }

  const sessions=premiumAllSessions().sort((a,b)=>({strength:0,engine:1}[premiumSessionType(a)]??2)-({strength:0,engine:1}[premiumSessionType(b)]??2));
  const completed=sessions.filter(x=>x.completed).length,total=sessions.length,target=commandFirstIncompleteSession(sessions),futureDay=key>today;
  commandSetText('premiumCompletionCount',completed);commandSetText('premiumCompletionTotal',`of ${total}`);commandSetText('premiumCompletionLabel',total?(completed===total?'MISSION COMPLETE':'COMPLETE'):'REST DAY');
  const strength=sessions.find(x=>premiumSessionType(x)==='strength'),engine=sessions.find(x=>premiumSessionType(x)==='engine');
  const title=!sessions.length?'Recovery Day':strength&&engine?`${premiumDisplayLabel(strength)} + ${premiumDisplayLabel(engine)}`:sessions.map(premiumDisplayLabel).join(' + ');
  const purpose=!sessions.length?'Recover, move well, and prepare for the next prescribed session.':premiumSessionDescription(strength||engine||sessions[0]);
  const duration=sessions.reduce((sum,session)=>sum+(Number(session.prescribedDuration)||Number(scaledTemplate(session.mission)?.duration)||30),0),types=[strength?'Strength':'',engine?'Engine':''].filter(Boolean).join(' + ')||'Recovery';
  commandSetText('commandMissionTitle',title);commandSetText('commandMissionPurpose',purpose);commandSetText('commandMissionDuration',sessions.length?`${duration} min`:'Recovery');commandSetText('commandMissionType',types);commandSetText('commandMissionPriority',futureDay?'Preview Only':readinessStatus(readinessScore())==='RED'?'Recovery Priority':sessions.length>1?'High Priority':'Primary Session');
  if(stack)stack.innerHTML=commandSessionSummary(sessions);
  if(start){start.disabled=false;if(!sessions.length){start.textContent='Open Recovery';start.onclick=()=>openCommandTile('recovery');}else if(futureDay){start.textContent='☷ Preview Workout';start.onclick=()=>commandSessionCall(target,'preview');}else if(completed===total){start.textContent='✓ Mission Complete';start.onclick=()=>showScreen('history');}else{const active=data.activeWorkout?.planSessionKey===target?.sessionKey;start.textContent=active?'▶ Resume Workout':'▶ Start Workout';start.onclick=()=>commandSessionCall(target,'start');}}
  if(view){view.disabled=!target;view.textContent='☷ View Session';view.onclick=target?()=>commandSessionCall(target,'preview'):()=>openCommandTile('weekly');}
  if(modify){modify.disabled=!target||futureDay;modify.textContent='✎ Modify';modify.onclick=target&&!futureDay?()=>commandSessionCall(target,'preview'):()=>showScreen('more');}
  const status=readinessStatus(readinessScore()),action=String(commandCloudAction()).toLowerCase(),cloudCopy=commandCloudExplanation();let adjustmentTitle=futureDay?'Future session preview':'Normal prescription',adjustmentDetail=futureDay?'Future workouts can be reviewed here but cannot be started early.':'Execute the planned work with quality.';
  if(!futureDay&&(status==='YELLOW'||/reduce|trim|modify|adjust/.test(action))){adjustmentTitle='Adjusted for readiness';adjustmentDetail='Quality-first volume and controlled effort.';}if(!futureDay&&(status==='RED'||/replace|recovery|rest|skip/.test(action))){adjustmentTitle='Recovery adjustment';adjustmentDetail='Demand reduced to protect recovery.';}if(!futureDay&&cloudCopy)adjustmentDetail=cloudCopy.split(/[.!?]/)[0].slice(0,88)+(cloudCopy.length>88?'…':'');
  commandSetText('commandAdjustmentTitle',adjustmentTitle);commandSetText('commandAdjustmentDetail',adjustmentDetail);
};

function renderCommandStatus(){
  const now=new Date(),streak=typeof currentActivityStreak==='function'?currentActivityStreak():0;commandSetText('commandDayOut',`Day ${Math.max(1,streak||1)}`);commandSetText('commandDateOut',now.toLocaleDateString('en-US',{weekday:'long',month:'short',day:'numeric'}));commandSetText('commandAthleteOut',data.settings?.athleteName||'Athlete');
  const connected=typeof bellCloudConnected==='function'&&bellCloudConnected();commandSetText('commandSyncOut',connected?commandRelativeTime(bellCloud.lastSyncAt):'Local / offline mode');const dot=document.getElementById('commandSyncDot');if(dot)dot.classList.toggle('connected',connected);
}
function renderCommandMissionTile(){const info=commandMissionInfo(),block=info.block,week=Math.max(1,Number(block.currentWeek)||1),total=Math.max(1,Number(block.lengthWeeks)||12);commandSetText('commandMissionGoal',info.title);commandSetText('commandMissionTarget',info.days!=null?`${info.days} day${info.days===1?'':'s'} remaining`:`Week ${week} of ${total}`);commandSetText('commandMissionCountdownLabel',info.title);commandSetText('commandMissionCountdown',info.days!=null?`${info.days} days`:`Week ${week} of ${total}`);}
function renderCommandTiles(){
  const r=data.settings.readiness||{},score=r.lastPromptDate===todayKey()?readinessScore():null;commandSetText('commandRecoverySleep',premiumSleepDuration(r));commandSetText('commandRecoveryScore',score==null?'—':`${score}%`);commandSetText('commandRecoverySoreness',score==null?'Check in to personalize recovery.':`Soreness: ${commandReadinessWord(r.recoveryStatus,'soreness')}`);
  const macros=typeof macroTargets==='function'?macroTargets():null;if(macros){commandSetText('commandNutritionCalories',macros.incomplete?'—':`${Number(macros.calories).toLocaleString()} kcal`);commandSetText('commandNutritionMode',macros.detail||'Target today');commandSetText('commandNutritionMacros',macros.incomplete?macros.detail:`${macros.protein}g protein · ${macros.carbs}g carbs · ${macros.fat}g fat`);}
  const current=weeklyPerformanceSummary(0),planned=Math.max(0,current.planned),completed=Math.max(0,current.completed);commandSetText('commandComplianceCount',`${completed} of ${planned}`);const streak=typeof currentActivityStreak==='function'?currentActivityStreak():0;commandSetText('commandComplianceStreak',`${streak} day${streak===1?'':'s'}`);
  commandSetText('commandPerformanceTitle',data.trainingBlock?.dualGoals?.strengthGoal||data.trainingBlock?.goalType||'Strength trend');const cloud=commandCloudExplanation();commandSetText('commandInsightCount',cloud?'1 current insight':'Today’s guidance');commandSetText('commandInsightText',cloud||coachRecommendation());renderCommandMissionTile();
  const status=readinessStatus(readinessScore());commandSetText('commandBriefFocus',dualBlockPhase?.()||'Training');commandSetText('commandBriefQuality',status==='GREEN'?'Ready':status==='YELLOW'?'Quality':'Recover');commandSetText('commandBriefControl',premiumAllSessions().some(x=>premiumSessionType(x)==='engine')?'Hybrid':'Control');
}

function commandAction(label,handler,primary=false){return {label,handler,primary};}
function commandDetailStats(items){return `<div class="command-detail-grid">${items.map(item=>`<div class="command-detail-stat"><span>${escapeHtml(item.label)}</span><strong>${escapeHtml(String(item.value))}</strong>${item.note?`<small>${escapeHtml(item.note)}</small>`:''}</div>`).join('')}</div>`;}
function closeCommandTile(){const drawer=document.getElementById('commandDrawer');if(!drawer)return;drawer.classList.add('hidden');drawer.setAttribute('aria-hidden','true');document.body.classList.remove('command-drawer-open');}
function commandGo(screen){closeCommandTile();showScreen(screen);}
function commandDrawerActionButtons(actions){const host=document.getElementById('commandDrawerActions');if(!host)return;host.innerHTML='';actions.forEach(action=>{const button=document.createElement('button');button.type='button';button.textContent=action.label;if(action.primary)button.classList.add('primary');button.addEventListener('click',action.handler);host.appendChild(button);});}
function openCommandTile(type){
  const drawer=document.getElementById('commandDrawer'),body=document.getElementById('commandDrawerBody');if(!drawer||!body)return;let title='Bell Performance',kicker='Command Center',html='',actions=[];const r=data.settings.readiness||{},score=readinessScore(),status=readinessStatus(score),summary=weeklyPerformanceSummary(0),macros=typeof macroTargets==='function'?macroTargets():null,mission=commandMissionInfo();
  if(type==='weekly'){title='Weekly Plan';kicker='Training Timeline';html=commandDetailStats([{label:'Current week',value:`Week ${Number(mission.block.currentWeek)||1}`},{label:'Block length',value:`${Number(mission.block.lengthWeeks)||12} weeks`},{label:'Strength days',value:Number(mission.block.strengthDays)||0},{label:'Engine days',value:Number(mission.block.runDays)||0}])+`<div class="command-detail-section"><h3>Next Action</h3><p>Open the full calendar to review every prescribed session, navigate future weeks, or select another training day.</p></div>`;actions=[commandAction('Close',closeCommandTile),commandAction('Open Full Plan',()=>commandGo('plan'),true)];}
  else if(type==='recovery'){html=commandDetailStats([{label:'Readiness',value:`${score}/100`,note:status},{label:'Sleep',value:premiumSleepDuration(r)},{label:'Energy',value:commandReadinessWord(r.energy)},{label:'Soreness',value:commandReadinessWord(r.recoveryStatus,'soreness')}])+`<div class="command-detail-section"><h3>Today’s Recovery Direction</h3><p>${escapeHtml(document.getElementById('premiumReadinessDetail')?.textContent||'Complete the daily check-in to personalize recovery.')}</p></div><div class="command-detail-section"><h3>Mobility</h3><p>${escapeHtml(`${data.mobility?.minutes||10} minute ${typeof resolvedMobilityFocus==='function'?resolvedMobilityFocus():'full-body'} routine matched to today’s training.`)}</p></div>`;title='Recovery';kicker='Readiness & Mobility';actions=[commandAction('Update Check-In',()=>{closeCommandTile();document.getElementById('dailyReadinessModal')?.classList.remove('hidden');}),commandAction('Open Mobility',()=>{closeCommandTile();openMobilityRoutine(todayKey());},true)];}
  else if(type==='performance'){const previous=weeklyPerformanceSummary(-1),strength=percentChange(summary.volume,previous.volume),engine=summary.minutes-previous.minutes,consistency=Math.round(summary.completed/Math.max(1,summary.planned)*100);html=commandDetailStats([{label:'Consistency',value:`${consistency}%`},{label:'Strength volume',value:`${strength>=0?'+':''}${strength}%`},{label:'Engine time',value:`${engine>=0?'+':''}${engine} min`},{label:'Body weight',value:`${Number(data.settings.weight)||'—'} lb`}])+`<div class="command-detail-section"><h3>Four-Week Review</h3><p>Open Performance Review for completed sessions, strength volume, Engine results, bodyweight, milestones, and training history.</p></div>`;title='Performance';kicker='Progress Snapshot';actions=[commandAction('Close',closeCommandTile),commandAction('View Performance',()=>commandGo('history'),true)];}
  else if(type==='nutrition'){html=macros?commandDetailStats([{label:'Calories',value:macros.incomplete?'—':macros.calories},{label:'Protein',value:macros.incomplete?'—':`${macros.protein} g`},{label:'Carbohydrate',value:macros.incomplete?'—':`${macros.carbs} g`},{label:'Fat',value:macros.incomplete?'—':`${macros.fat} g`}])+`<div class="command-detail-section"><h3>${escapeHtml(macros.profile?.label||'Nutrition Target')}</h3><p>${escapeHtml(macros.incomplete?macros.detail:macros.focus)}</p></div>`:'<div class="command-detail-section"><p>Nutrition targets are unavailable.</p></div>';title='Nutrition';kicker='Fuel the Mission';actions=[commandAction('Close',closeCommandTile),commandAction('Nutrition Settings',()=>commandGo('more'),true)];}
  else if(type==='mission'){const eventCopy=mission.days!=null?`${mission.days} days until ${mission.title}`:`Week ${Number(mission.block.currentWeek)||1} of ${Number(mission.block.lengthWeeks)||12}`;html=commandDetailStats([{label:'Mission',value:mission.title},{label:'Timeline',value:eventCopy},{label:'Phase',value:dualBlockPhase?.()||'Training'},{label:'Coordination',value:mission.block.dualGoals?.trainingCoordination||'Coach Decides'}])+`<div class="command-detail-section"><h3>Mission Direction</h3><p>${escapeHtml(coachRecommendation())}</p></div>`;title='Mission';kicker='Goal & Training Block';actions=[commandAction('Close',closeCommandTile),commandAction('Edit Mission',()=>commandGo('more'),true)];}
  else if(type==='compliance'){const consistency=Math.round(summary.completed/Math.max(1,summary.planned)*100),habitDone=typeof habitCompletedIds==='function'?habitCompletedIds(todayKey()).length:0,habitTotal=(data.habits?.items||[]).length;html=commandDetailStats([{label:'Workouts',value:`${summary.completed} of ${summary.planned}`},{label:'Compliance',value:`${consistency}%`},{label:'Activity streak',value:`${typeof currentActivityStreak==='function'?currentActivityStreak():0} days`},{label:'Daily standards',value:`${habitDone} of ${habitTotal}`}])+`<div class="command-detail-section"><h3>Consistency</h3><p>Training completion and Daily Standards are tracked separately so optional habits support the mission without blocking workout completion.</p></div>`;title='Compliance';kicker='Consistency Review';actions=[commandAction('Close',closeCommandTile),commandAction('Open Habits',()=>commandGo('habits'),true)];}
  else if(type==='coaching'){const cloud=commandCloudExplanation(),action=commandCloudAction();html=`<div class="command-detail-section"><h3>Coach’s Instruction</h3><p>${escapeHtml(coachRecommendation())}</p></div><div class="command-detail-section"><h3>Bell Core Decision</h3><p>${escapeHtml(cloud||(typeof bellCloudConnected==='function'&&bellCloudConnected()?'No new cloud adjustment is currently required.':'Connect Bell Core in Settings to synchronize cloud coaching decisions.'))}</p></div>${action?commandDetailStats([{label:'Current action',value:action},{label:'Readiness',value:`${score}/100`} ]):''}`;title='Coaching';kicker='Bell Insight';actions=[commandAction('Close',closeCommandTile),commandAction(typeof bellCloudConnected==='function'&&bellCloudConnected()?'Sync Bell Core':'Open Connection',()=>{if(typeof bellCloudConnected==='function'&&bellCloudConnected()){bellManualSync();closeCommandTile();}else commandGo('more');},true)];}
  else {html=`<div class="command-detail-section"><h3>Exercise Intelligence</h3><p>Search every prescribed movement, review setup and execution, understand what it trains, and choose purpose-matched substitutions.</p></div><div class="command-detail-section"><h3>Training Library</h3><p>Open complete Strength and Engine sessions while preserving today’s prescribed mission on the dashboard.</p></div>`;title='Training Library';kicker='Exercises & Programs';actions=[commandAction('Workout Library',()=>commandGo('workouts')),commandAction('Exercise Library',()=>{closeCommandTile();openExerciseLibrary();},true)];}
  commandSetText('commandDrawerTitle',title);commandSetText('commandDrawerKicker',kicker);body.innerHTML=html;commandDrawerActionButtons(actions);drawer.classList.remove('hidden');drawer.setAttribute('aria-hidden','false');document.body.classList.add('command-drawer-open');setTimeout(()=>drawer.querySelector('.command-drawer-close')?.focus(),20);
}


function commandWeeklyTypeCode(type){return type==='strength'?'Strength':type==='engine'?'Engine':'Rest';}
function commandWeeklySessionLabel(session){
  if(!session)return '';
  const type=typeof premiumSessionType==='function'?premiumSessionType(session):'rest';
  const label=typeof premiumDisplayLabel==='function'?premiumDisplayLabel(session):(session.label||session.mission||commandWeeklyTypeCode(type));
  return String(label||commandWeeklyTypeCode(type)).replace(/^S-\d+\s*/i,'').replace(/^R-\d+\s*/i,'').trim();
}
function commandRenderCleanWeek(){
  const block=typeof bpResolvePlanBlock==='function'?bpResolvePlanBlock():data.trainingBlock;if(!block)return;
  if(typeof bpPrepareBlockPlan==='function')bpPrepareBlockPlan(block);
  const week=typeof bpCurrentTimelineWeek==='function'?bpCurrentTimelineWeek(block):Number(block.currentWeek||1);
  const plan=typeof bpWeekPlan==='function'?bpWeekPlan(block,week):(data.plan||[]);
  const monday=typeof bpWeekStartKey==='function'?bpWeekStartKey(block,week):mondayKeyFor(selectedDashboardDateKey());
  const selected=block===data.trainingBlock&&week===Number(data.trainingBlock?.currentWeek||1)?selectedDashboardDateKey():monday;
  const shortDays=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],fullDays=['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
  const phase=typeof bpPhaseForWeek==='function'?bpPhaseForWeek(week,Number(block.lengthWeeks)||12):{name:'Training'};
  const host=document.getElementById('premiumWeekDays');if(!host)return;
  let strengthCount=0,engineCount=0;
  host.innerHTML=shortDays.map((day,index)=>{
    const key=addLocalDays(monday,index);
    const items=plan.filter(x=>(x.day===fullDays[index]||(typeof planDateKey==='function'&&planDateKey(x)===key))&&!['skipped','replaced'].includes(x.status));
    const sessions=items.flatMap(item=>typeof sessionsFromPlanItem==='function'?sessionsFromPlanItem(item):[item]).filter(Boolean);
    const types=sessions.map(session=>typeof premiumSessionType==='function'?premiumSessionType(session):'rest');
    strengthCount+=types.filter(type=>type==='strength').length;engineCount+=types.filter(type=>type==='engine').length;
    const labels=sessions.filter((session,i)=>['strength','engine'].includes(types[i])).map(commandWeeklySessionLabel);
    const description=labels.length?labels.join(' + '):'Rest / Recovery';
    const allDone=sessions.length&&sessions.every(x=>x.completed);
    const action=block===data.trainingBlock&&week===Number(data.trainingBlock?.currentWeek||1)?`setDashboardDate('${key}')`:`bpPreviewWeek(${week})`;
    return `<button class="command-week-list-row ${key===selected?'selected':''} ${key===localDateKey()?'today':''} ${allDone?'completed':''}" onclick="${action}" aria-label="${fullDays[index]} ${localDateFromKey(key).getDate()}: ${escapeHtml(description)}"><span class="command-week-list-day"><b>${day}</b><small>${localDateFromKey(key).getDate()}</small></span><strong>${escapeHtml(description)}</strong><i>${allDone?'✓':'›'}</i></button>`;
  }).join('');
  commandSetText('premiumWeekTitle',`Week ${week} · ${phase.name}`);
  commandSetText('premiumWeekKicker',`${strengthCount} strength · ${engineCount} engine`);
  requestAnimationFrame(()=>{
    const todayRow=host.querySelector('.today')||host.querySelector('.selected');
    if(todayRow&&typeof todayRow.scrollIntoView==='function')todayRow.scrollIntoView({block:'nearest'});
  });
}

renderPremiumWeek=commandRenderCleanWeek;

const commandOriginalRenderPremiumDashboard=renderPremiumDashboard;
renderPremiumDashboard=function(){
  renderPremiumQuote();renderPremiumReadiness();renderPremiumMission();renderPremiumNext();renderPremiumProgress();renderPremiumCoach();renderPremiumStandards();renderPremiumWeek();renderCommandStatus();renderCommandTiles();
};

document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!document.getElementById('commandDrawer')?.classList.contains('hidden'))closeCommandTile();});
