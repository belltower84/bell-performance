"use strict";

function bpClone(value){return value==null?value:JSON.parse(JSON.stringify(value));}
function bpDateLabel(key){if(!key)return"";const d=new Date(`${key}T12:00:00`);return d.toLocaleDateString(undefined,{weekday:"long",month:"long",day:"numeric"});}
function bpFollowingMondayKey(){const d=new Date();d.setHours(0,0,0,0);const add=(8-d.getDay())%7||7;d.setDate(d.getDate()+add);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;}
function selectedBlockStartChoice(){return document.querySelector('input[name="blockStartChoice"]:checked')?.value||"today";}
function syncBlockStartChoice(){
  const choice=selectedBlockStartChoice(),select=document.getElementById("onboardingBlockStart"),note=document.getElementById("blockStartChoiceNote");
  if(select)select.value=choice;
  if(note)note.innerHTML=choice==="nextMonday"?`<strong>Starts ${bpDateLabel(bpFollowingMondayKey())}</strong><span>The new block will appear as Upcoming and activate automatically Monday.</span>`:`<strong>Start Today</strong><span>Your Week 1 plan will be available as soon as you launch.</span>`;
  if(typeof renderOnboardingReview==="function")renderOnboardingReview();
}
function bpArchiveBlock(block,reason="replaced"){
  if(!block?.enabled)return;
  data.archivedTrainingBlocks=data.archivedTrainingBlocks||[];
  const copy=bpClone(block);copy.status="archived";copy.archivedAt=new Date().toISOString();copy.archiveReason=reason;
  data.archivedTrainingBlocks.push(copy);
}
function bpActivateBlock(block,reason="scheduled_start"){
  if(!block)return false;
  if(data.trainingBlock?.enabled&&data.trainingBlock.generatedAt!==block.generatedAt)bpArchiveBlock(data.trainingBlock,reason);
  data.trainingBlock={...bpClone(block),enabled:true,status:"active",currentWeek:Math.max(1,Number(block.currentWeek)||1),activatedAt:new Date().toISOString()};
  data.upcomingTrainingBlock=null;
  if(typeof bpPrepareBlockPlan==="function")bpPrepareBlockPlan(data.trainingBlock);
  if(typeof bpLoadActiveWeekFromPlan==="function")bpLoadActiveWeekFromPlan();else if(typeof buildCurrentWeekPlan==="function")buildCurrentWeekPlan();
  return true;
}
function maybeActivateScheduledBlock(){
  const upcoming=data.upcomingTrainingBlock;
  if(!upcoming?.startDate||upcoming.startDate>todayKey())return false;
  const did=bpActivateBlock(upcoming,"scheduled_block_activation");
  if(did)saveData({render:false});
  return did;
}
function activateUpcomingBlockNow(){
  if(!data.upcomingTrainingBlock)return;
  if(data.trainingBlock?.enabled&&!confirm("Start the upcoming block today? Your current block will be archived and all history will be preserved."))return;
  data.upcomingTrainingBlock.startDate=todayKey();bpActivateBlock(data.upcomingTrainingBlock,"started_early");saveData();renderApp();showScreen("home");
}
function cancelUpcomingBlock(){if(!data.upcomingTrainingBlock)return;if(!confirm("Cancel the scheduled training block? Your current block and history will remain unchanged."))return;data.upcomingTrainingBlock=null;saveData();renderApp();}
function renderUpcomingTrainingBlock(){
  const card=document.getElementById("upcomingBlockCard"),block=data.upcomingTrainingBlock;if(!card)return;
  card.classList.toggle("hidden",!block);if(!block)return;
  const style=block.dualGoals?.strengthGoal||data.settings?.primaryTrainingIdentity||"Training";
  const focus=block.secondaryGoal||block.dualGoals?.engineGoal||"Balanced Program";
  document.getElementById("upcomingBlockTitle").textContent=style;
  document.getElementById("upcomingBlockFocus").textContent=focus;
  document.getElementById("upcomingBlockStart").textContent=`Starts ${bpDateLabel(block.startDate)} • ${block.lengthWeeks||12} weeks`;
}

const bpLifecycleBaseRenderApp=renderApp;
renderApp=function(){maybeActivateScheduledBlock();bpLifecycleBaseRenderApp();renderUpcomingTrainingBlock();};

completeOnboarding=function(){
  const previousBlock=bpClone(data.trainingBlock),hadActive=!!previousBlock?.enabled,isEditing=!!missionEditorActive;
  if(!saveFirstFlightProfile()||!saveOnboardingDualGoals(false)||!saveOnboardingInjuryProfile()||!bpSaveOnboardingReadiness())return;
  bpApplyEnvironment();if(typeof saveOnboardingEquipment==="function")saveOnboardingEquipment();
  const choice=selectedBlockStartChoice(),candidate=bpClone(data.trainingBlock),startDate=choice==="nextMonday"?bpFollowingMondayKey():todayKey();
  candidate.startDate=startDate;candidate.currentWeek=1;candidate.generatedAt=new Date().toISOString();candidate.status=choice==="nextMonday"?"scheduled":"active";candidate.enabled=choice!=="nextMonday";
  data.settings.coachMessages={setupComplete:true,style:byId("onboardingMessageStyle").value,scriptureFrequency:byId("onboardingScriptureFrequency").value};
  data.settings.firstFlightStage="complete";data.settings.firstFlightTourComplete=true;data.settings.firstBlockLaunchMode=choice;
  if(choice==="nextMonday"){
    data.upcomingTrainingBlock={...candidate,enabled:true,status:"scheduled"};
    if(typeof bpPrepareBlockPlan==="function")bpPrepareBlockPlan(data.upcomingTrainingBlock);
    if(hadActive)data.trainingBlock=previousBlock;else{data.trainingBlock={enabled:false,status:"scheduled",currentWeek:0};data.plan=[];}
  }else{
    if(hadActive&&isEditing)bpArchiveBlock(previousBlock,"mission_updated");
    data.trainingBlock={...candidate,enabled:true,status:"active",activatedAt:new Date().toISOString()};data.upcomingTrainingBlock=null;
    if(typeof bpPrepareBlockPlan==="function")bpPrepareBlockPlan(data.trainingBlock);
    if(typeof bpLoadActiveWeekFromPlan==="function")bpLoadActiveWeekFromPlan();else if(typeof buildCurrentWeekPlan==="function")buildCurrentWeekPlan();
  }
  saveData({render:false});byId("onboardingModal").classList.add("hidden");document.body.classList.remove("modal-open");renderApp();showScreen("home");
  const msg=choice==="nextMonday"?`Your new training block is scheduled for ${bpDateLabel(startDate)}.`:`Your new training block starts today.`;
  alert(isEditing?`Mission updated. ${msg} Prior history was preserved.`:msg);missionEditorActive=false;
};

const bpLifecycleBaseRenderOnboardingStep=renderOnboardingStep;
renderOnboardingStep=function(){bpLifecycleBaseRenderOnboardingStep();if(onboardingStep===5){const choice=data.trainingBlock?.enabled?"nextMonday":"today";const radio=document.querySelector(`input[name="blockStartChoice"][value="${choice}"]`);if(radio&&!document.querySelector('input[name="blockStartChoice"]:checked')?.dataset.userChosen)radio.checked=true;syncBlockStartChoice();}};
