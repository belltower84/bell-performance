"use strict";

function habitDateKey(date=new Date()){return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;}
function habitCompletedIds(key=habitDateKey()){const value=data.habits?.completions?.[key];return Array.isArray(value)?value:[];}
function toggleHabit(id){
  const key=habitDateKey(),done=new Set(habitCompletedIds(key));
  done.has(id)?done.delete(id):done.add(id);
  data.habits.completions[key]=[...done];
  saveData({render:false});renderHabits();
}
function addCustomHabit(){
  const label=prompt("Name the habit you want to track:");
  if(!label||!label.trim())return;
  const clean=label.trim().slice(0,70);
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
function renderHabits(){
  const list=byId("habitList");if(!list)return;
  const items=data.habits?.items||[],done=new Set(habitCompletedIds()),count=items.filter(x=>done.has(x.id)).length,pct=items.length?Math.round(count/items.length*100):0;
  setText("habitTodayScore",`${count} of ${items.length} complete`);setText("habitRing",`${pct}%`);
  setText("habitTodayMessage",pct===100?"Daily standard complete. Recover and repeat.":pct>=60?"Strong progress. Finish the remaining essentials.":"Build momentum with the next useful action.");
  const bar=byId("habitProgressBar");if(bar)bar.style.width=`${pct}%`;
  list.innerHTML=items.map(item=>`<div class="card habit-row ${done.has(item.id)?"habit-complete":""}"><button type="button" class="habit-check" onclick="toggleHabit('${escapeHtml(item.id)}')" aria-label="Toggle ${escapeHtml(item.label)}">${done.has(item.id)?"✓":""}</button><div class="habit-copy"><span class="habit-icon">${escapeHtml(item.icon)}</span><strong>${escapeHtml(item.label)}</strong><small>${done.has(item.id)?"Completed today":"Tap the circle when complete"}</small></div>${item.custom?`<button type="button" class="habit-remove" onclick="removeCustomHabit('${escapeHtml(item.id)}')">Remove</button>`:""}</div>`).join("");
  renderHabitWeek();
}
function renderHabitWeek(){
  const grid=byId("habitWeekGrid"),summary=byId("habitWeekSummary");if(!grid||!summary)return;
  const items=data.habits?.items||[],days=[];let totalDone=0,totalPossible=0,perfect=0;
  for(let offset=6;offset>=0;offset--){const d=new Date();d.setHours(0,0,0,0);d.setDate(d.getDate()-offset);const key=habitDateKey(d),done=habitCompletedIds(key).filter(id=>items.some(x=>x.id===id)).length,pct=items.length?Math.round(done/items.length*100):0;totalDone+=done;totalPossible+=items.length;if(items.length&&done===items.length)perfect++;days.push({label:d.toLocaleDateString(undefined,{weekday:"short"}),date:d.getDate(),pct,done});}
  grid.innerHTML=days.map(day=>`<div class="habit-day"><span>${escapeHtml(day.label)}</span><b>${day.date}</b><div class="habit-day-bar"><i style="height:${day.pct}%"></i></div><small>${day.pct}%</small></div>`).join("");
  const weekly=totalPossible?Math.round(totalDone/totalPossible*100):0;summary.innerHTML=`<strong>${weekly}% weekly consistency</strong><br>${perfect} perfect day${perfect===1?"":"s"} in the last seven days. Habit completion is tracked separately from prescribed workout compliance.`;
}
