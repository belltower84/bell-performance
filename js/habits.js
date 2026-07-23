"use strict";

function habitDateKey(date=new Date()){return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;}
function habitCompletedIds(key=habitDateKey()){const value=data.habits?.completions?.[key];return Array.isArray(value)?value:[];}
function roundTo(value,step=5){return Math.max(step,Math.round(value/step)*step);}
function habitGoalName(){return String(data.missionPlan?.label||data.missionPlan?.eventType||data.trainingBlock?.goalType||data.settings?.athleteMode||"").toLowerCase();}
function recommendedHabitTargets(){
  const weight=Math.max(90,Number(data.settings?.weight)||180),goalWeight=Math.max(90,Number(data.settings?.goal)||weight),goal=habitGoalName();
  const physique=/fat loss|bodybuilding|physique|muscle|hypertrophy|recomposition/.test(goal), endurance=/marathon|half marathon|10k|5k|triathlon|endurance|running|cycling/.test(goal), mobility=/mobility|longevity|recovery/.test(goal);
  const proteinBase=physique?Math.max(goalWeight,weight*.9):endurance?weight*.8:weight*.85;
  return {
    proteinGrams:roundTo(proteinBase,5),
    hydrationOz:roundTo(Math.max(80,weight*.5+(endurance?15:physique?5:0)),5),
    steps:roundTo(physique&&/fat loss|recomposition/.test(goal)?10000:endurance?9000:physique?7500:8000,500),
    sleepHours:physique||endurance?8:7.5,
    mobilityMinutes:mobility?20:endurance?12:10,
    customized:false
  };
}
function ensureHabitTargets(force=false){
  data.habits=data.habits||{items:[],completions:{}};
  const current=data.habits.targets||{},missing=!current.proteinGrams||!current.hydrationOz||!current.steps||!current.sleepHours||!current.mobilityMinutes;
  if(force||(!current.customized&&missing)) data.habits.targets={...recommendedHabitTargets(),customized:Boolean(force?false:current.customized)};
  return data.habits.targets;
}
function habitDisplay(item){
  const t=ensureHabitTargets(), map={
    training:{title:"Prescribed training",detail:"Complete today’s programmed session"},
    mobility:{title:`Mobility: ${t.mobilityMinutes} min`,detail:"Complete mobility or recovery work"},
    protein:{title:`Protein: ${t.proteinGrams} g`,detail:"Reach your daily protein target"},
    hydration:{title:`Hydration: ${t.hydrationOz} oz`,detail:"Reach your daily fluid target"},
    steps:{title:`Steps: ${Number(t.steps).toLocaleString()}`,detail:"Reach your daily movement target"},
    sleep:{title:`Sleep: ${t.sleepHours} hr`,detail:"Protect tonight’s sleep opportunity"}
  };
  return item.custom?{title:item.label,detail:"Custom daily standard"}:(map[item.id]||{title:item.label,detail:"Daily standard"});
}
function toggleHabit(id){
  const key=habitDateKey(),done=new Set(habitCompletedIds(key));
  done.has(id)?done.delete(id):done.add(id);
  data.habits.completions[key]=[...done];
  saveData({render:false});renderHabits();
}
function addCustomHabit(){
  const label=prompt("Name the habit you want to track:");
  if(!label)return;const clean=label.trim();if(!clean)return;
  data.habits.items.push({id:`custom-${Date.now()}`,label:clean,icon:"✓",custom:true});
  saveData({render:false});renderHabits();
}
function removeCustomHabit(id){
  const habit=data.habits.items.find(x=>x.id===id);if(!habit?.custom)return;
  if(!confirm(`Remove “${habit.label}” from your tracker?`))return;
  data.habits.items=data.habits.items.filter(x=>x.id!==id);
  Object.keys(data.habits.completions).forEach(key=>data.habits.completions[key]=habitCompletedIds(key).filter(x=>x!==id));
  saveData({render:false});renderHabits();
}
function loadHabitTargetEditor(){
  const t=ensureHabitTargets();
  [["habitProteinTarget",t.proteinGrams],["habitHydrationTarget",t.hydrationOz],["habitStepsTarget",t.steps],["habitSleepTarget",t.sleepHours],["habitMobilityTarget",t.mobilityMinutes]].forEach(([id,value])=>{const el=byId(id);if(el)el.value=value;});
  const note=byId("habitTargetSource");if(note)note.textContent=t.customized?"Using your custom targets.":"Recommended from your bodyweight and current mission. You can edit any number.";
}
function saveHabitTargets(){
  const values={
    proteinGrams:Number(byId("habitProteinTarget")?.value),hydrationOz:Number(byId("habitHydrationTarget")?.value),steps:Number(byId("habitStepsTarget")?.value),sleepHours:Number(byId("habitSleepTarget")?.value),mobilityMinutes:Number(byId("habitMobilityTarget")?.value)
  };
  if(values.proteinGrams<40||values.hydrationOz<20||values.steps<1000||values.sleepHours<3||values.mobilityMinutes<1){alert("Please enter practical positive targets for every habit.");return;}
  data.habits.targets={...values,proteinGrams:Math.round(values.proteinGrams),hydrationOz:Math.round(values.hydrationOz),steps:Math.round(values.steps),sleepHours:Math.round(values.sleepHours*2)/2,mobilityMinutes:Math.round(values.mobilityMinutes),customized:true};
  saveData({render:false});renderHabits();alert("Daily habit targets updated.");
}
function resetHabitTargets(){data.habits.targets=recommendedHabitTargets();saveData({render:false});renderHabits();alert("Targets recalculated from your current bodyweight and mission.");}
function habitProgressMessage(pct){return pct===100?"Daily standard complete. Recover and repeat.":pct>=60?"Strong progress. Finish the remaining essentials.":"Build momentum with the next useful action.";}
function renderDashboardHabits(items,done,count,pct){
  const list=byId("dashboardHabitList");if(!list)return;
  setText("dashboardHabitScore",`${count} of ${items.length}`);setText("dashboardHabitPercent",`${pct}%`);setText("dashboardHabitMessage",habitProgressMessage(pct));
  const bar=byId("dashboardHabitProgressBar");if(bar)bar.style.width=`${pct}%`;
  list.innerHTML=items.map(item=>{const copy=habitDisplay(item);return `<button type="button" class="dashboard-habit-chip ${done.has(item.id)?"complete":""}" onclick="toggleHabit('${escapeHtml(item.id)}')" aria-pressed="${done.has(item.id)}"><span>${done.has(item.id)?"✓":escapeHtml(item.icon)}</span><b>${escapeHtml(copy.title)}</b></button>`;}).join("");
}
function renderHabits(){
  ensureHabitTargets();
  const items=data.habits?.items||[],done=new Set(habitCompletedIds()),count=items.filter(x=>done.has(x.id)).length,pct=items.length?Math.round(count/items.length*100):0;
  renderDashboardHabits(items,done,count,pct);loadHabitTargetEditor();
  const list=byId("habitList");if(!list)return;
  setText("habitTodayScore",`${count} of ${items.length} complete`);setText("habitRing",`${pct}%`);
  setText("habitTodayMessage",habitProgressMessage(pct));
  const bar=byId("habitProgressBar");if(bar)bar.style.width=`${pct}%`;
  list.innerHTML=items.map(item=>{const copy=habitDisplay(item);return `<div class="card habit-row ${done.has(item.id)?"habit-complete":""}"><button type="button" class="habit-check" onclick="toggleHabit('${escapeHtml(item.id)}')" aria-label="Toggle ${escapeHtml(copy.title)}">${done.has(item.id)?"✓":""}</button><div class="habit-copy"><span class="habit-icon">${escapeHtml(item.icon)}</span><strong>${escapeHtml(copy.title)}</strong><small>${done.has(item.id)?"Completed today":escapeHtml(copy.detail)}</small></div>${item.custom?`<button type="button" class="habit-remove" onclick="removeCustomHabit('${escapeHtml(item.id)}')">Remove</button>`:""}</div>`;}).join("");
  renderHabitWeek();
}
function renderHabitWeek(){
  const grid=byId("habitWeekGrid"),summary=byId("habitWeekSummary");if(!grid||!summary)return;
  const items=data.habits?.items||[],days=[];let totalDone=0,totalPossible=0,perfect=0;
  for(let offset=6;offset>=0;offset--){const d=new Date();d.setHours(0,0,0,0);d.setDate(d.getDate()-offset);const key=habitDateKey(d),done=habitCompletedIds(key).filter(id=>items.some(x=>x.id===id)).length,pct=items.length?Math.round(done/items.length*100):0;totalDone+=done;totalPossible+=items.length;if(items.length&&done===items.length)perfect++;days.push({label:d.toLocaleDateString(undefined,{weekday:"short"}),date:d.getDate(),pct,done});}
  grid.innerHTML=days.map(day=>`<div class="habit-day"><span>${escapeHtml(day.label)}</span><b>${day.date}</b><div class="habit-day-bar"><i style="height:${day.pct}%"></i></div><small>${day.pct}%</small></div>`).join("");
  const weekly=totalPossible?Math.round(totalDone/totalPossible*100):0;summary.innerHTML=`<strong>${weekly}% weekly consistency</strong><br>${perfect} perfect day${perfect===1?"":"s"} in the last seven days. Habit completion is tracked separately from prescribed workout compliance.`;
}
