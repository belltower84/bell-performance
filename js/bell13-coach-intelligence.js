"use strict";
/* Bell Performance 13.6.2 — refined Bell Coach workspace and athlete-controlled memory. */
(function(){
  const VERSION="13.6.2";
  const $=id=>document.getElementById(id);
  const coachMode=()=>typeof bellCoachModeEnabled!=="function"||bellCoachModeEnabled();
  const esc=value=>typeof window.escapeHtml==="function"?window.escapeHtml(String(value??"")):String(value??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
  const clean=value=>String(value||"").replace(/\s+/g," ").trim();
  const now=()=>new Date().toISOString();
  const keyDate=value=>String(value||"").slice(0,10);
  const confidenceLabel=value=>{const n=Number(value)||0;return n>=.85?"High":n>=.65?"Medium":"Low";};

  function store(){
    data.coachIntelligence=data.coachIntelligence&&typeof data.coachIntelligence==="object"?data.coachIntelligence:{};
    const ci=data.coachIntelligence;
    ci.schemaVersion=1;
    ci.memories=Array.isArray(ci.memories)?ci.memories:[];
    ci.dismissedMemoryKeys=Array.isArray(ci.dismissedMemoryKeys)?ci.dismissedMemoryKeys:[];
    ci.decisions=Array.isArray(ci.decisions)?ci.decisions:[];
    ci.summaries=Array.isArray(ci.summaries)?ci.summaries:[];
    ci.processedSourceRefs=Array.isArray(ci.processedSourceRefs)?ci.processedSourceRefs:[];
    return ci;
  }
  function coachingPreferences(){
    const coaching=data.athleteProfile?.coaching||{};
    return {memoryEnabled:coaching.memoryEnabled!==false,showConfidence:coaching.showConfidence!==false,detailLevel:coaching.detailLevel||"Balanced"};
  }
  function state(){return window.BellCoachingEngine?.getState?.({persist:false})||data.coachingState||{};}
  function currentMission(){
    const cloud=typeof bellCloud!=="undefined"?bellCloud?.today:null;
    const cloudSession=cloud?.session||{};
    if(cloudSession?.title||cloudSession?.name)return {title:cloudSession.title||cloudSession.name,purpose:cloud?.adaptation?.explanation||cloud?.coach_summary||cloudSession.coach_summary||"Bell Core selected this Mission from your current phase and readiness.",source:"Bell Core"};
    try{
      const info=typeof commandMissionInfo==="function"?commandMissionInfo():null;
      if(info?.title)return {title:info.title,purpose:$("commandMissionPurpose")?.textContent||"This Mission supports the current phase.",source:"Local plan"};
    }catch(_){}
    const item=(data.plan||[]).find(x=>!x.done&&!['completed','skipped','replaced'].includes(x.status));
    return {title:item?.label||item?.mission||"Complete the next prescribed Mission",purpose:"Bell is protecting the highest-priority work in your current phase.",source:"Local plan"};
  }
  function readinessContext(){
    const r=data.settings?.readiness||{};
    const status=clean(r.status||"")||"Not checked in";
    return {status,score:Number(r.score)||null,sleep:Number(r.sleepHours||0)+(Number(r.sleepMinutes||0)/60),time:Number(r.timeAvailability)||3};
  }
  function activeMemories(){return coachingPreferences().memoryEnabled?store().memories.filter(x=>x.active!==false):[];}
  function explanation(topic="phase"){
    const cloud=typeof bellCloud!=="undefined"?bellCloud?.coach?.explanations?.[topic]:null;
    if(cloud)return normalizeExplanation(cloud,topic);
    const s=state(),phase=s.currentPhase||{},mission=currentMission(),ready=readinessContext(),memories=activeMemories();
    const phaseName=phase.name||s.currentPhaseName||"Foundation";
    const objective=s.objective||data.athleteProfile?.identity?.objective||"Continuous Development";
    const milestone=s.nextMilestone||"complete the current phase checkpoint";
    const base={topic,title:"Why this decision?",context:`${phaseName} · ${objective}`,decision:"Bell is continuing the current coaching direction.",reason:"The available evidence supports preserving the current priority.",nextFocus:`Work toward ${milestone}.`,confidence:s.currentPhase?"high":"medium",known:[`Current phase: ${phaseName}`,`Objective: ${objective}`],inferred:[],missing:[],evidence:[],generatedAt:now()};
    const map={
      mission:{title:"Why this Mission?",decision:`Today’s Mission is ${mission.title}.`,reason:mission.purpose,nextFocus:`Execute it with honest RPE and performance feedback so Bell can confirm the dose.`,known:[...base.known,`Prescription source: ${mission.source}`]},
      phase:{title:"Why this Phase?",decision:`Bell placed you in ${phaseName}.`,reason:phase.purpose||`This phase builds the next adaptation required for ${objective}.`,nextFocus:`Progress until Bell can verify ${milestone}, then advance, extend, or recover.`},
      progression:{title:"Why this Progression?",decision:phase.progressionRule||s.discipline?.progression||"Bell is progressing one meaningful variable at a time.",reason:"Technical quality and recovery are protected before Bell adds more load, volume, density, or specificity.",nextFocus:"Complete the prescription and log the result rather than guessing at the next increase."},
      weekly_plan:{title:"Why this Weekly Plan?",decision:"Bell arranged the week around your current phase, available days, and protected sessions.",reason:"Higher-priority sessions are protected first. Lower-priority work can move or reduce when schedule or recovery changes.",nextFocus:"Complete the protected sessions first and report schedule changes before Bell rebuilds the week."},
      recovery:{title:"Why Recovery Now?",decision:ready.status==="RED"?"Bell is reducing training demand today.":"Bell is managing fatigue against the current training demand.",reason:`Readiness is ${ready.status}${ready.score?` at ${ready.score}/100`:""}. Recovery work is used when the original dose carries more cost than benefit.`,nextFocus:"Restore sleep, movement quality, and readiness before the next high-priority exposure.",known:[...base.known,`Readiness: ${ready.status}`]},
      nutrition:{title:"Why this Nutrition Direction?",decision:`Nutrition is aligned to ${objective} and ${phaseName}.`,reason:"Bell preserves performance and lean tissue before making more aggressive calorie or activity changes.",nextFocus:"Track bodyweight trend, adherence, and training performance before the next adjustment."},
      milestone:{title:"Why this Milestone?",decision:`The next checkpoint is ${milestone}.`,reason:`It verifies whether ${phaseName} produced the intended adaptation before Bell changes direction.`,nextFocus:"Complete the checkpoint under consistent conditions so the next decision uses useful evidence."},
      adaptation:{title:"Why did Bell change the plan?",decision:typeof bellCloud!=="undefined"&&bellCloud?.lastDecision?.explanation?bellCloud.lastDecision.explanation:"Bell reviewed readiness, available time, limitations, and current priorities.",reason:"The change protects valuable work while reducing avoidable fatigue or risk.",nextFocus:"Follow the adjusted prescription and log how it felt so Bell can learn from the outcome."}
    };
    const chosen=map[topic]||map.phase;
    const result={...base,...chosen};
    if(memories.length){result.inferred=[`Bell has ${memories.length} active, reviewable coaching memor${memories.length===1?"y":"ies"}. Repeated patterns may influence future decisions.`];result.evidence=memories.slice(0,3).map(x=>({source:x.sourceType||"local evidence",detail:x.observation,date:x.lastConfirmed}));}
    if(topic==="mission"&&!mission.title){result.missing.push("No current Mission was available.");result.confidence="medium";}
    return result;
  }
  function normalizeExplanation(raw,topic){
    return {topic,title:raw.title||"Why this decision?",context:raw.context||"Bell coaching context",decision:raw.decision||"Bell selected the current direction.",reason:raw.reason||"It supports the current objective.",nextFocus:raw.next_focus||raw.nextFocus||"Complete the next prescribed action.",confidence:raw.confidence||"medium",known:Array.isArray(raw.known)?raw.known:[],inferred:Array.isArray(raw.inferred)?raw.inferred:[],missing:Array.isArray(raw.missing)?raw.missing:[],evidence:Array.isArray(raw.evidence)?raw.evidence:[],generatedAt:raw.generated_at||raw.generatedAt||now()};
  }
  function summary(){
    const cloud=typeof bellCloud!=="undefined"?bellCloud?.coach?.summary:null;
    if(cloud)return {headline:cloud.headline,instruction:cloud.instruction,reason:cloud.reason,nextFocus:cloud.next_focus||cloud.nextFocus,memoryContext:cloud.memory_context||cloud.memoryContext,confidence:cloud.confidence||"medium"};
    const s=state(),phase=s.currentPhase||{},mission=currentMission(),memories=activeMemories();
    return {headline:`${phase.name||s.currentPhaseName||"Foundation"} · Week ${s.phaseWeek||1} of ${s.phaseLength||1}`,instruction:mission.title,reason:phase.purpose||mission.purpose,nextFocus:s.nextMilestone||"Complete the current phase checkpoint",memoryContext:memories.length?`${memories.length} active coaching memor${memories.length===1?"y":"ies"}`:"Bell is still gathering repeat evidence",confidence:s.currentPhase?"high":"medium"};
  }

  function memoryCandidate(key,category,observation,evidence,confidence,sourceType="inferred_repeated_evidence"){
    return {id:`local-${key}`,key,category,observation,evidence,confidence,sourceType,active:true,reviewable:true,firstObserved:evidence.firstObserved||now(),lastConfirmed:evidence.lastConfirmed||now()};
  }
  function inferLocalMemories(){
    if(!coachingPreferences().memoryEnabled)return [];
    const candidates=[];
    (data.exerciseIntelligence?.replacements||[]).filter(x=>x.scope==="always").forEach(x=>candidates.push(memoryCandidate(`explicit:replacement:${clean(x.originalName).toLowerCase()}`,"exercise_preference",`Prefers ${x.replacementName} instead of ${x.originalName}.`,{athleteStatement:x.reason||"Athlete selected Always use this replacement.",firstObserved:x.createdAt,lastConfirmed:x.createdAt},1,"athlete_explicit")));
    const feedback=data.sessionFeedbackLog||[],groups={};
    feedback.forEach(item=>{const type=clean(item.type||"training").toLowerCase();(groups[type]||(groups[type]=[])).push(item);});
    Object.entries(groups).forEach(([type,items])=>{
      if(items.length<4)return;const recent=items.slice(-8);const quality=recent.map(x=>Number(x.sessionQuality||x.overallFeeling||x.postEnergy||0)).filter(Boolean);if(quality.length<4)return;const avg=quality.reduce((a,b)=>a+b,0)/quality.length;
      if(avg>=4)candidates.push(memoryCandidate(`response:${type}:positive`,"training_response",`Responds well to ${type} sessions at the current dose.`,{sampleCount:quality.length,averageResponse:Number(avg.toFixed(2)),firstObserved:recent[0].date,lastConfirmed:recent.at(-1).date},Math.min(.94,.62+quality.length*.04)));
      if(avg<=2.25)candidates.push(memoryCandidate(`response:${type}:high-cost`,"fatigue_response",`Current ${type} dose may create excessive fatigue.`,{sampleCount:quality.length,averageResponse:Number(avg.toFixed(2)),firstObserved:recent[0].date,lastConfirmed:recent.at(-1).date},Math.min(.92,.62+quality.length*.04)));
    });
    Object.entries(data.exerciseProgression||{}).forEach(([exerciseKey,record])=>{const history=Array.isArray(record?.history)?record.history:[];if(history.length<3)return;const successes=Number(record.successfulSessions)||history.filter(x=>!x.feedback||/good|complete|success/i.test(String(x.feedback))).length;const failures=Number(record.failedSessions)||history.filter(x=>/fail|pain|miss|grind/i.test(String(x.feedback||x.reason))).length;const total=Math.max(history.length,successes+failures);const name=record.name||exerciseKey.replaceAll("-"," ");if(successes>=3&&successes/total>=.67)candidates.push(memoryCandidate(`exercise:${exerciseKey}:positive`,"exercise_response",`${name} has progressed reliably with the current method.`,{sampleCount:total,successfulSessions:successes,firstObserved:history[0]?.date,lastConfirmed:history.at(-1)?.date},Math.min(.94,.62+Math.min(8,total)*.04)));if(failures>=2&&failures/total>=.4)candidates.push(memoryCandidate(`exercise:${exerciseKey}:high-cost`,"exercise_response",`${name} has produced repeated failed or high-cost exposures.`,{sampleCount:total,failedSessions:failures,firstObserved:history[0]?.date,lastConfirmed:history.at(-1)?.date},Math.min(.9,.62+failures*.06)));});
    const ready=(data.readinessLog||[]).slice(-10);if(ready.length>=5){const low=ready.filter(x=>Number(x.sleepHours||0)+(Number(x.sleepMinutes||0)/60)<6.5);if(low.length>=3)candidates.push(memoryCandidate("recovery:recurring-low-sleep","recovery_pattern","Sleep frequently falls below the recovery target.",{sampleCount:low.length,window:ready.length,firstObserved:low[0].date,lastConfirmed:low.at(-1).date},Math.min(.9,.58+low.length*.06)));const limited=ready.filter(x=>Number(x.timeAvailability||3)<=2);if(limited.length>=3)candidates.push(memoryCandidate("schedule:recurring-limited-time","schedule_pattern","Training time is frequently limited.",{sampleCount:limited.length,window:ready.length,firstObserved:limited[0].date,lastConfirmed:limited.at(-1).date},Math.min(.9,.58+limited.length*.06)));}
    const misses={};(data.missedSessionLog||[]).forEach(x=>{const day=clean(x.day);if(day)(misses[day]||(misses[day]=[])).push(x);});Object.entries(misses).forEach(([day,items])=>{if(items.length>=2)candidates.push(memoryCandidate(`schedule:missed:${day.toLowerCase()}`,"schedule_pattern",`${day} sessions have been missed repeatedly.`,{sampleCount:items.length,firstObserved:items[0].recordedAt,lastConfirmed:items.at(-1).recordedAt},Math.min(.9,.62+items.length*.06)));});
    return candidates;
  }
  function mergeCloudMemories(){
    const cloud=typeof bellCloud!=="undefined"&&Array.isArray(bellCloud?.coach?.memories)?bellCloud.coach.memories:[];
    return cloud.map(x=>({id:x.id,key:x.memory_key,category:x.category,observation:x.observation,confidence:Number(x.confidence)||0,sourceType:x.source_type,active:x.is_active!==false,reviewable:true,evidence:x.evidence||{},firstObserved:x.first_observed,lastConfirmed:x.last_confirmed,cloud:true}));
  }
  function analyzeMemories(){
    const ci=store(),dismissed=new Set(ci.dismissedMemoryKeys),existing=new Map(ci.memories.map(x=>[x.key,x]));
    [...inferLocalMemories(),...mergeCloudMemories()].forEach(candidate=>{if(!candidate.key||dismissed.has(candidate.key))return;const prior=existing.get(candidate.key);existing.set(candidate.key,{...prior,...candidate,firstObserved:prior?.firstObserved||candidate.firstObserved,lastConfirmed:candidate.lastConfirmed||prior?.lastConfirmed||now()});});
    ci.memories=[...existing.values()].filter(x=>!dismissed.has(x.key)).sort((a,b)=>(Number(b.confidence)||0)-(Number(a.confidence)||0));
    return ci.memories;
  }
  function addDecision(decision){const ci=store();if(ci.decisions.some(x=>x.sourceRef===decision.sourceRef))return false;ci.decisions.unshift(decision);ci.decisions=ci.decisions.slice(0,100);return true;}
  function analyzeDecisions(){
    let changed=false;const ci=store(),s=state(),phaseFingerprint=`${s.cycleNumber||1}|${s.currentPhaseId||s.currentPhaseName||"phase"}|${s.phaseWeek||1}`;
    if(!ci.lastPhaseFingerprint){ci.lastPhaseFingerprint=phaseFingerprint;changed=true;}
    else if(ci.lastPhaseFingerprint!==phaseFingerprint){changed=addDecision({id:`local-phase-${Date.now()}`,sourceRef:`phase:${phaseFingerprint}`,type:"phase_transition",title:`Entered ${s.currentPhaseName||s.currentPhase?.name||"a new phase"}`,explanation:explanation("phase").reason,changes:[`Phase week ${s.phaseWeek||1} of ${s.phaseLength||1}`],createdAt:now(),source:"Bell Coaching Engine"})||changed;ci.lastPhaseFingerprint=phaseFingerprint;}
    const r=readinessContext();if(["YELLOW","RED"].includes(r.status))changed=addDecision({id:`local-readiness-${keyDate(now())}-${r.status}`,sourceRef:`readiness:${keyDate(now())}:${r.status}`,type:"readiness_adaptation",title:r.status==="RED"?"Recovery direction issued":"Training demand reviewed",explanation:explanation("recovery").reason,changes:[`Readiness ${r.status}${r.score?` · ${r.score}/100`:""}`],createdAt:now(),source:"Daily readiness"})||changed;
    (data.missedSessionLog||[]).slice(-20).forEach(x=>{const ref=`missed:${x.id||x.recordedAt}`;changed=addDecision({id:`local-${ref}`,sourceRef:ref,type:"schedule_change",title:x.action||"Weekly Plan adjusted",explanation:x.reasonLabel||x.reason||"A missed session required Bell to protect higher-priority work.",changes:[x.day,x.mission].filter(Boolean),createdAt:x.recordedAt||now(),source:"Local schedule"})||changed;});
    const cloud=typeof bellCloud!=="undefined"&&Array.isArray(bellCloud?.coach?.adaptation_history)?bellCloud.coach.adaptation_history:[];cloud.forEach(x=>{changed=addDecision({id:x.id,sourceRef:`cloud:${x.id}`,type:x.type,title:String(x.type||"Bell decision").replaceAll("_"," "),explanation:x.explanation||"Bell recorded an auditable coaching decision.",changes:Array.isArray(x.changes)?x.changes:[],createdAt:x.created_at,source:"Bell Core"})||changed;});
    return changed;
  }
  function analyze(){const before=JSON.stringify(store().memories);analyzeMemories();const changed=before!==JSON.stringify(store().memories)||analyzeDecisions();store().lastAnalyzedAt=now();if(changed&&typeof saveData==="function")saveData({render:false});return changed;}

  function explanationHtml(item){
    const prefs=coachingPreferences(),confidence=prefs.showConfidence?`<span class="bell134-confidence ${esc(String(item.confidence).toLowerCase())}">${esc(String(item.confidence).toUpperCase())} confidence</span>`:"";
    const list=(title,values,klass="")=>Array.isArray(values)&&values.length?`<section class="bell134-evidence ${klass}"><h4>${title}</h4><ul>${values.map(x=>`<li>${esc(typeof x==="string"?x:x.detail||JSON.stringify(x))}</li>`).join("")}</ul></section>`:"";
    return `<article class="bell134-explanation"><header><div><span class="metric-label">Bell Coach Explanation</span><h2>${esc(item.title)}</h2></div>${confidence}</header><div class="bell134-reason-grid"><section><span>Context</span><p>${esc(item.context)}</p></section><section><span>Decision</span><p>${esc(item.decision)}</p></section><section><span>Reason</span><p>${esc(item.reason)}</p></section><section><span>Next focus</span><p>${esc(item.nextFocus)}</p></section></div>${list("Known",item.known)}${list("Inferred from repeated evidence",item.inferred,"inferred")}${list("Missing information",item.missing,"missing")}<p class="bell134-trust-note">Bell separates facts, inferences, and missing data. Coaching memory remains reviewable and removable.</p></article>`;
  }
  function ensureModal(){
    if($("bellCoachModal"))return;
    document.body.insertAdjacentHTML("beforeend",`<div class="modal hidden bell134-modal" id="bellCoachModal" aria-hidden="true" role="dialog" aria-modal="true" aria-labelledby="bellCoachModalTitle" onclick="if(event.target===this)BellCoachIntelligence.close()"><div class="modal-box bell134-modal-box"><div class="bell134-shell-header"><div class="notification-header bell134-modal-header"><div class="bell134-modal-titleblock"><span class="metric-label">Bell Performance</span><h2 id="bellCoachModalTitle">Bell Coach</h2></div><button class="modal-close bell134-close" id="bellCoachClose" type="button" onclick="BellCoachIntelligence.close()" aria-label="Close Bell Coach">×</button></div><div class="bell134-tabs" id="bellCoachTabs" role="tablist" aria-label="Bell Coach sections"><button data-coach-tab="now" class="active" role="tab" aria-selected="true">Today</button><button data-coach-tab="why" role="tab" aria-selected="false">Why</button><button data-coach-tab="memory" role="tab" aria-selected="false">Memory</button><button data-coach-tab="history" role="tab" aria-selected="false">Decisions</button></div></div><div class="bell134-modal-body" id="bellCoachModalBody"></div></div></div>`);
    $("bellCoachTabs").addEventListener("click",event=>{const button=event.target.closest("[data-coach-tab]");if(button)openCenter(button.dataset.coachTab);});
    $("bellCoachTabs").addEventListener("keydown",event=>{if(!["ArrowLeft","ArrowRight"].includes(event.key))return;const tabs=[...$("bellCoachTabs").querySelectorAll("[data-coach-tab]")],current=tabs.indexOf(document.activeElement);if(current<0)return;event.preventDefault();const next=(current+(event.key==="ArrowRight"?1:-1)+tabs.length)%tabs.length;tabs[next].focus();openCenter(tabs[next].dataset.coachTab);});
  }
  function setActiveTab(tab){$("bellCoachTabs")?.querySelectorAll("button").forEach(button=>{const active=button.dataset.coachTab===tab;button.classList.toggle("active",active);button.setAttribute("aria-selected",active?"true":"false");button.tabIndex=active?0:-1;});}
  function showCoachModal(){const modal=$("bellCoachModal"),body=$("bellCoachModalBody"),wasHidden=modal?.classList.contains("hidden");if(body)body.scrollTop=0;modal?.classList.remove("hidden");modal?.setAttribute("aria-hidden","false");if(wasHidden)requestAnimationFrame(()=>$("bellCoachClose")?.focus({preventScroll:true}));}
  function openWhy(topic="phase"){if(!coachMode())return;ensureModal();$("bellCoachModalTitle").textContent="Bell Coach · Why";setActiveTab("why");$("bellCoachModalBody").innerHTML=explanationHtml(explanation(topic));showCoachModal();}
  function topicButtons(){return [["mission","Mission"],["phase","Phase"],["progression","Progression"],["weekly_plan","Weekly Plan"],["recovery","Recovery"],["nutrition","Nutrition"],["milestone","Milestone"],["adaptation","Latest Change"]].map(([id,label])=>`<button type="button" onclick="BellCoachIntelligence.openWhy('${id}')">${label}</button>`).join("");}
  function memoriesHtml(){
    const memories=activeMemories(),prefs=coachingPreferences();if(!prefs.memoryEnabled)return `<div class="bell134-empty"><h3>Coaching memory is off</h3><p>Turn it on in Bell Coach settings to let repeated evidence improve future decisions.</p></div>`;
    if(!memories.length)return `<div class="bell134-empty"><h3>No durable memories yet</h3><p>Bell requires repeated evidence before treating a pattern as durable. Explicit preferences can be added below.</p></div>${addMemoryForm()}`;
    return `<div class="bell134-memory-list">${memories.map(x=>`<article><div><span>${esc(clean(x.category||"coaching memory").replaceAll("_"," "))}</span><h3>${esc(x.observation)}</h3><p>${esc(evidenceText(x.evidence))}</p><small>${esc(x.sourceType==="athlete_explicit"?"Confirmed by athlete":"Inferred from repeated evidence")} · ${confidenceLabel(x.confidence)} confidence</small></div><button type="button" onclick="BellCoachIntelligence.removeMemory('${esc(x.key)}','${esc(x.id)}',${x.cloud?"true":"false"})">Remove</button></article>`).join("")}</div>${addMemoryForm()}`;
  }
  function evidenceText(evidence={}){if(evidence.athleteStatement)return evidence.athleteStatement;if(evidence.sampleCount)return `${evidence.sampleCount} supporting observations${evidence.window?` within the last ${evidence.window}`:""}.`;return "Evidence is available for review.";}
  function addMemoryForm(){return `<form class="bell134-add-memory" onsubmit="BellCoachIntelligence.addMemory(event)"><label>Tell Bell a durable preference or limitation<input id="bellMemoryObservation" maxlength="1000" required placeholder="Example: Neutral-grip pressing feels better on my shoulders."></label><button class="secondary" type="submit">Add confirmed memory</button><small>Explicit athlete statements are saved immediately and can be removed at any time.</small></form>`;}
  function historyHtml(){const rows=store().decisions;if(!rows.length)return `<div class="bell134-empty"><h3>No adaptations recorded yet</h3><p>Phase changes, readiness adjustments, and schedule decisions will appear here with their reasons.</p></div>`;return `<div class="bell134-history">${rows.map(x=>`<article><time>${esc(new Date(x.createdAt||Date.now()).toLocaleString())}</time><div><span>${esc(x.source||"Bell")}</span><h3>${esc(x.title)}</h3><p>${esc(x.explanation)}</p>${x.changes?.length?`<small>${esc(x.changes.join(" · "))}</small>`:""}</div></article>`).join("")}</div>`;}
  function openCenter(tab="now"){
    if(!coachMode())return;analyze();ensureModal();const body=$("bellCoachModalBody"),s=summary();$("bellCoachModalTitle").textContent="Bell Coach";setActiveTab(tab);
    if(tab==="now")body.innerHTML=`<article class="bell134-now"><span class="metric-label">Current Coaching Direction</span><h2>${esc(s.headline)}</h2><h3>${esc(s.instruction)}</h3><p>${esc(s.reason)}</p><div><span>Next focus</span><strong>${esc(s.nextFocus)}</strong></div><small>${esc(s.memoryContext)} · ${esc(s.confidence)} confidence</small><button class="good" type="button" onclick="BellCoachIntelligence.openWhy('mission')">Why this Mission?</button></article>`;
    else if(tab==="why")body.innerHTML=`<div class="bell134-topic-grid">${topicButtons()}</div>${explanationHtml(explanation("phase"))}`;
    else if(tab==="memory")body.innerHTML=memoriesHtml();
    else body.innerHTML=historyHtml();
    showCoachModal();
  }
  function close(){const modal=$("bellCoachModal");if(modal){modal.classList.add("hidden");modal.setAttribute("aria-hidden","true");}}
  function removeMemory(key,id,cloud){
    if(!confirm("Remove this coaching memory? Bell will stop using it."))return;const ci=store();ci.dismissedMemoryKeys=[...new Set([...ci.dismissedMemoryKeys,key])];ci.memories=ci.memories.filter(x=>x.key!==key);saveData({render:false});
    if(cloud&&typeof bellApiRequest==="function"&&typeof bellCloud!=="undefined"&&bellCloudConnected?.())bellApiRequest(`/athletes/${bellCloud.athleteId}/memories/${id}`,{method:"DELETE"}).then(()=>bellRefreshCloudState?.()).catch(error=>console.warn("Bell memory removal sync failed",error));openCenter("memory");renderCoachBrief();
  }
  function addMemory(event){event.preventDefault();const input=$("bellMemoryObservation"),observation=clean(input?.value);if(observation.length<3)return;const key=`explicit:${observation.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,140)}`,ci=store();ci.dismissedMemoryKeys=ci.dismissedMemoryKeys.filter(x=>x!==key);const item=memoryCandidate(key,"athlete_preference",observation,{athleteStatement:observation,firstObserved:now(),lastConfirmed:now()},1,"athlete_explicit");ci.memories=ci.memories.filter(x=>x.key!==key);ci.memories.unshift(item);saveData({render:false});if(typeof bellApiRequest==="function"&&typeof bellCloud!=="undefined"&&bellCloudConnected?.()&&bellCloud.athleteId)bellApiRequest(`/athletes/${bellCloud.athleteId}/memories`,{method:"POST",body:JSON.stringify({observation,category:"athlete_preference",memory_key:key,evidence:{athlete_statement:observation}})}).then(()=>bellRefreshCloudState?.()).catch(error=>console.warn("Bell memory sync failed",error));openCenter("memory");renderCoachBrief();}
  function clearDismissed(){store().dismissedMemoryKeys=[];saveData({render:false});analyze();renderCoachBrief();alert("Dismissed memory keys were reset. Repeated evidence may create those memories again.");}

  function briefHtml(){const s=summary();return `<section class="bell134-brief" id="bellCoachBrief"><div class="bell134-brief-mark">B</div><div class="bell134-brief-copy"><span class="metric-label">Bell Coach · Current Direction</span><h2>${esc(s.instruction)}</h2><p>${esc(s.reason)}</p><div class="bell134-brief-meta"><span><b>${esc(s.headline)}</b></span><span>Next: ${esc(s.nextFocus)}</span><span>${esc(s.memoryContext)}</span></div></div><div class="bell134-brief-actions"><button class="secondary" type="button" onclick="BellCoachIntelligence.openWhy('mission')">Why?</button><button class="good" type="button" onclick="BellCoachIntelligence.openCenter('now')">Open Coach</button></div></section>`;}
  function renderCoachBrief(){
    if(typeof data==="undefined")return;
    if(!coachMode()){$("bellCoachBrief")?.remove();$("bellMissionWhyButton")?.remove();return;}
    const dashboard=$("premiumDashboard"),journey=$("bell13JourneyCard");if(dashboard&&!$("bellCoachBrief")){journey?.insertAdjacentHTML("afterend",briefHtml());if(!journey)dashboard.insertAdjacentHTML("afterbegin",briefHtml());}else if($("bellCoachBrief"))$("bellCoachBrief").outerHTML=briefHtml();
    const purpose=$("commandMissionPurpose");if(purpose&&!$("bellMissionWhyButton")){purpose.insertAdjacentHTML("afterend",`<button id="bellMissionWhyButton" class="bell13-why-button bell134-inline-why" type="button" onclick="BellCoachIntelligence.openWhy('mission')">Why this Mission?</button>`);}
  }
  function settingsHtml(){const prefs=coachingPreferences();return `<article class="card bell134-memory-settings" id="bellMemorySettings"><div class="bell133-card-heading"><div><span class="metric-label">Coaching Intelligence</span><h3>Bell Memory & Explanations</h3><p>Bell only creates inferred memory from repeated evidence. You can review and remove every memory.</p></div></div><label class="bell134-toggle"><input id="settingsMemoryEnabled" type="checkbox" ${prefs.memoryEnabled?"checked":""}><span><b>Use coaching memory</b><small>Let repeated patterns influence future decisions.</small></span></label><label class="bell134-toggle"><input id="settingsShowConfidence" type="checkbox" ${prefs.showConfidence?"checked":""}><span><b>Show confidence labels</b><small>Display how certain Bell is about explanations and memories.</small></span></label><div class="row"><button class="secondary" type="button" onclick="BellCoachIntelligence.saveSettings()">Save</button><button class="secondary" type="button" onclick="BellCoachIntelligence.openCenter('memory')">Review Memory</button><button class="secondary" type="button" onclick="BellCoachIntelligence.clearDismissed()">Reset Removed Patterns</button></div></article>`;}
  function injectSettings(){const panel=document.querySelector('[data-settings-panel="coach"]');if(!panel)return;if(!$("bellMemorySettings"))panel.insertAdjacentHTML("beforeend",settingsHtml());if($("bellMemorySettings"))$("bellMemorySettings").hidden=!coachMode();}
  function saveSettings(){const coaching=data.athleteProfile.coaching||(data.athleteProfile.coaching={});coaching.memoryEnabled=$("settingsMemoryEnabled")?.checked!==false;coaching.showConfidence=$("settingsShowConfidence")?.checked!==false;if(!coaching.memoryEnabled)store().memories=store().memories.filter(x=>x.sourceType==="athlete_explicit");saveData({render:false});if(typeof bellSyncAthleteProfile==="function")bellSyncAthleteProfile().catch(()=>{});analyze();renderCoachBrief();alert("Bell Coach intelligence preferences saved.");}
  function patchPlanWhyButtons(){document.querySelectorAll('.bell13-plan-overview .bell13-why-button').forEach(button=>{const text=button.textContent.toLowerCase();button.onclick=()=>openWhy(text.includes("progression")?"progression":"phase");});}
  function init(){if(typeof data==="undefined")return;if(coachMode()){analyze();ensureModal();patchPlanWhyButtons();}renderCoachBrief();injectSettings();}

  const priorOpen=window.openCommandTile;
  if(typeof priorOpen==="function")window.openCommandTile=function(type){if(type==="coaching"&&coachMode()){openCenter("now");return;}return priorOpen.apply(this,arguments);};
  const priorRender=window.renderApp;
  if(typeof priorRender==="function")window.renderApp=function(){const result=priorRender.apply(this,arguments);setTimeout(()=>{if(coachMode()){analyze();patchPlanWhyButtons();}renderCoachBrief();injectSettings();},0);return result;};
  window.BellCoachIntelligence={version:VERSION,explain:explanation,summary,analyze,openWhy,openCenter,close,removeMemory,addMemory,clearDismissed,saveSettings,render:renderCoachBrief};
  document.addEventListener("DOMContentLoaded",()=>setTimeout(init,100));
  document.addEventListener("keydown",event=>{if(event.key==="Escape"&&!$("bellCoachModal")?.classList.contains("hidden"))close();});
})();
