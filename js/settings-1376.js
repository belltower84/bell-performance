/* Bell Performance 13.7.6 — Settings Detail Flow */
(function(){
  "use strict";
  const COPY={
    "Athlete Profile":"Personal details and performance baseline.","Current Journey":"Current mission, event, phase, and program direction.","Mission & Block Management":"Edit or restart the active mission without deleting history.","Dual Mission Goal Builder":"Coordinate strength and engine goals inside one block.","Active Block Control":"Move to a specific week of the current training block.","Mission Goals":"Set measurable milestones for the active mission.","Training Schedule":"Choose the days and time Bell can realistically use.","Training Locations & Equipment":"Manage the places you train and equipment available there.","Training Rotation":"Control the current workout-variety rotation.","Max Lifts":"Update strength and performance baselines.","Movement Limitations":"Manage pain triggers and restricted movements.","Recovery Profile":"Set sleep, recovery, and deload preferences.","Nutrition Setup — Beta":"Choose manual targets or match nutrition to the mission.","Choose how Bell behaves":"Choose adaptive coaching or a fixed workout planner.","How to Use the App":"Replay the guided tour or open workout instructions.","Exercise Intelligence Library":"Open exercise guides and purpose-matched substitutions.","Backup":"Export, restore, or reset local app data.","Bell Diagnostics":"Review app version, profile schema, and connection status."
  };
  function clean(v){return String(v||"").replace(/\s+/g," ").trim();}
  function titleFor(card){return clean(card.querySelector("h3")?.textContent||card.querySelector("h4")?.textContent||"Settings");}
  function iconFor(title){return title.split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0]).join("").toUpperCase()||"S";}
  function closeSubview(panel,focusToggle){
    const open=panel?.querySelector(":scope > .card.settings-section-open");
    open?.classList.remove("settings-section-open");
    panel?.classList.remove("settings-subview-open");
    if(focusToggle) setTimeout(()=>focusToggle.focus(),20);
    window.scrollTo({top:0,behavior:"smooth"});
  }
  function decorateCard(card){
    if(card.dataset.settings1376)return;
    card.dataset.settings1376="true";
    const title=titleFor(card);
    const heading=card.querySelector(":scope > .bell133-card-heading");
    const desc=clean(heading?.querySelector("p")?.textContent||card.querySelector(":scope > .hint")?.textContent||COPY[title]||"Review and update this setting.");
    const body=document.createElement("div");body.className="settings-section-body";
    [...card.childNodes].forEach(node=>body.appendChild(node));
    const toggle=document.createElement("button");toggle.type="button";toggle.className="settings-section-toggle secondary";
    toggle.innerHTML=`<span class="settings-section-toggle-icon">${iconFor(title)}</span><span class="settings-section-toggle-copy"><strong>${title}</strong><small>${desc}</small></span><span class="settings-section-toggle-state"><span>Open</span><i>›</i></span>`;
    const subhead=document.createElement("div");subhead.className="settings-subview-head";
    subhead.innerHTML=`<button class="settings-subview-back secondary" type="button" aria-label="Back to settings category">‹</button><div class="settings-subview-title"><small>Settings</small><strong>${title}</strong></div>`;
    body.prepend(subhead);
    subhead.querySelector("button").addEventListener("click",()=>closeSubview(card.closest(".bell133-settings-panel"),toggle));
    toggle.addEventListener("click",()=>{
      const panel=card.closest(".bell133-settings-panel");
      panel?.querySelectorAll(":scope > .card.settings-section-open").forEach(c=>c.classList.remove("settings-section-open"));
      card.classList.add("settings-section-open");panel?.classList.add("settings-subview-open");
      window.scrollTo({top:0,behavior:"smooth"});
    });
    card.append(toggle,body);
  }
  function decoratePanel(panel){if(!panel)return;[...panel.querySelectorAll(":scope > .card")].forEach(decorateCard);}
  function decorateAll(){document.querySelectorAll("#settingsPanels > .bell133-settings-panel").forEach(decoratePanel);}
  const base=window.showSettingsPanel;
  if(typeof base==="function")window.showSettingsPanel=function(){document.querySelectorAll("#settingsPanels > .bell133-settings-panel").forEach(p=>closeSubview(p));const r=base.apply(this,arguments);decorateAll();return r;};
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",()=>setTimeout(decorateAll,0));else setTimeout(decorateAll,0);
  window.BellSettings1376={refresh:decorateAll};
})();
