/* Bell Performance 13.7.5 — Settings Flow Rebuild */
(function(){
  "use strict";
  const ROUTE_LABELS={profile:["AP","Profile basics","Personal details and performance baseline"],journey:["MP","Program controls","Mission, block, phase, and progression"],training:["TS","Training setup","Availability, locations, equipment, and rotation"],recovery:["RN","Recovery settings","Readiness, limitations, and recovery preferences"],nutrition:["NU","Nutrition settings","Body metrics and nutrition targets"],coach:["BB","Bell behavior","Application control and coaching preferences"],app:["HD","Help and data","Guides, backups, cloud, and diagnostics"]};
  const COPY={
    "Athlete Profile":"Update the stable information Bell uses across every program.","Current Journey":"Review the direction Bell is currently programming toward.","Mission & Block Management":"Edit or restart the active mission without deleting history.","Dual Mission Goal Builder":"Coordinate strength and engine goals inside one training block.","Active Block Control":"Move to a specific week of the current training block.","Mission Goals":"Set measurable milestones for the active mission.","Training Schedule":"Choose the days and time Bell can realistically use.","Training Locations & Equipment":"Save each place you train and the equipment available there.","Training Rotation":"Control the current workout-variety rotation.","Max Lifts":"Update performance baselines used for loading recommendations.","Movement Limitations":"Keep pain triggers and restricted movements current.","Recovery Profile":"Set sleep and deload preferences.","Nutrition Setup — Beta":"Choose manual targets or match nutrition to the active mission.","Choose how Bell behaves":"Switch between adaptive coaching and a fixed workout planner.","How to Use the App":"Replay the guided tour or jump to workout instructions.","Exercise Intelligence Library":"Open movement guides and purpose-matched substitutions.","Backup":"Export, restore, or reset local app data.","Bell Diagnostics":"Review app version, profile schema, and connection status."
  };
  function clean(v){return String(v||"").replace(/\s+/g," ").trim();}
  function titleFor(card){return clean(card.querySelector("h3")?.textContent||card.querySelector("h4")?.textContent||"Settings");}
  function iconFor(title){return title.split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0]).join("").toUpperCase()||"S";}
  function decorateCard(card,index){
    if(card.dataset.settings1375)return; card.dataset.settings1375="true";
    const title=titleFor(card),heading=card.querySelector(":scope > .bell133-card-heading"),desc=clean(heading?.querySelector("p")?.textContent||card.querySelector(":scope > .hint")?.textContent||COPY[title]||"Review and update this part of Bell Performance.");
    const body=document.createElement("div"); body.className="settings-section-body";
    [...card.childNodes].forEach(node=>body.appendChild(node));
    const toggle=document.createElement("button"); toggle.type="button";toggle.className="settings-section-toggle";toggle.setAttribute("aria-expanded",index===0?"true":"false");
    toggle.innerHTML=`<span class="settings-section-toggle-icon">${iconFor(title)}</span><span class="settings-section-toggle-copy"><strong>${title}</strong><small>${desc}</small></span><span class="settings-section-toggle-state"><span>${index===0?"Open":"Review"}</span><i>›</i></span>`;
    toggle.addEventListener("click",()=>{
      const panel=card.closest(".bell133-settings-panel"),opening=!card.classList.contains("settings-section-open");
      panel?.querySelectorAll(":scope > .card.settings-section-open").forEach(other=>{if(other!==card){other.classList.remove("settings-section-open");other.querySelector(":scope > .settings-section-toggle")?.setAttribute("aria-expanded","false");const s=other.querySelector(".settings-section-toggle-state span");if(s)s.textContent="Review";}});
      card.classList.toggle("settings-section-open",opening);toggle.setAttribute("aria-expanded",String(opening));const state=toggle.querySelector(".settings-section-toggle-state span");if(state)state.textContent=opening?"Open":"Review";
      if(opening&&window.innerWidth<700)setTimeout(()=>toggle.scrollIntoView({behavior:"smooth",block:"start"}),80);
    });
    card.append(toggle,body);if(index===0)card.classList.add("settings-section-open");
  }
  function decoratePanel(panel){
    if(!panel)return;const route=panel.dataset.settingsPanel||"app";
    if(!panel.querySelector(":scope > .settings-page-route-summary")){
      const [mark,title,copy]=ROUTE_LABELS[route]||ROUTE_LABELS.app,summary=document.createElement("div");summary.className="settings-page-route-summary";summary.innerHTML=`<span>${mark}</span><div><strong>${title}</strong><small>${copy}</small></div>`;panel.prepend(summary);
    }
    [...panel.querySelectorAll(":scope > .card")].forEach(decorateCard);
  }
  function decorateAll(){document.querySelectorAll("#settingsPanels > .bell133-settings-panel").forEach(decoratePanel);}
  const base=window.showSettingsPanel;
  if(typeof base==="function")window.showSettingsPanel=function(){const result=base.apply(this,arguments);decorateAll();return result;};
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",()=>setTimeout(decorateAll,0));else setTimeout(decorateAll,0);
  window.BellSettings1375={refresh:decorateAll};
})();
