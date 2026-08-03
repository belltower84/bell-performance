"use strict";
/* Bell Performance 13.7.8 — concise athlete-facing workout and discipline names. */
(function(global){
  function clean(value){return String(value??"").replace(/\s+/g," ").trim();}
  function isFemale(){try{return String(global.data?.settings?.sex||"").toLowerCase()==="female";}catch(_){return false;}}
  function discipline(value){
    const raw=clean(value);
    if(isFemale()&&/\b(bodybuilding|bell hypertrophy|hypertrophy system)\b/i.test(raw))return raw
      .replace(/Bell Female Physique System/gi,"Bell Female Physique System")
      .replace(/Bell Hypertrophy System/gi,"Bell Female Physique System")
      .replace(/Bell Hypertrophy/gi,"Female Physique")
      .replace(/Bodybuilding/gi,"Female Physique");
    return raw;
  }
  function baseLabel(session){
    try{return clean(session?.label||global.scaledTemplate?.(session?.mission)?.label||session?.mission||"Training");}
    catch(_){return clean(session?.label||session?.mission||"Training");}
  }
  function engineLabel(raw){
    const value=clean(raw).replace(/^\s*(?:engine|conditioning|cardio)\s*[-–—:|•]*\s*/i,"").replace(/\s*[-–—:|•]*\s*(?:engine|conditioning|cardio)\s*$/i,"");
    if(/easy aerobic/i.test(value))return "Aerobic Support";
    if(/zone\s*2|aerobic base/i.test(value))return "Zone 2";
    if(/recovery cardio/i.test(value))return "Recovery Cardio";
    return value||"Conditioning";
  }
  function malformedTitle(value){
    const text=clean(value);
    return !text||text.length<4||/^(?:ress|ngth|ine|workout|session|training)$/i.test(text);
  }
  function workout(session){
    const original=baseLabel(session);
    let raw=original
      .replace(/^\s*(?:AM|A\.?M\.?|PM|P\.?M\.?)\s*[-–—:|•]*\s*/i,"")
      .replace(/\s*[-–—:|•]*\s*(?:AM|A\.?M\.?|PM|P\.?M\.?)\s*$/i,"")
      .replace(/\s*\((?:AM|A\.?M\.?|PM|P\.?M\.?)\)\s*/ig," ")
      .trim();
    let type="";try{type=clean(global.premiumSessionType?.(session)).toLowerCase();}catch(_){}
    if(type==="engine"||/easy aerobic support|recovery cardio|zone\s*2|conditioning/i.test(raw)&&!/chest|back|legs|shoulders|arms|strength/i.test(raw))return engineLabel(raw);
    raw=raw
      .replace(/^Bell Hypertrophy\s*[•|:\-–—]*\s*/i,"")
      .replace(/^Bell Female Physique\s*[•|:\-–—]*\s*/i,"")
      .replace(/^Female Physique\s*[•|:\-–—]*\s*/i,"")
      .replace(/^B-\d+\s*/i,"")
      .replace(/\s*[—–]\s*(?:Balanced Female Physique|Female Physique|Male Profile|Individual Profile).*$/i,"")
      .replace(/\s*\+\s*Easy Aerobic Support\s*$/i," + Aerobic Support")
      .trim();
    const parts=raw.split(/\s+[—–|:]\s+/).map(x=>x.trim()).filter(Boolean);
    if(parts.length>1&&/\b(?:upper|lower|full body|strength|hypertrophy|power|powerbuilding|bodybuilding|female physique|session|workout)\b/i.test(parts[0]))raw=parts.slice(1).join(" — ");
    raw=raw
      .replace(/^\s*(?:upper|lower|full body)?\s*(?:strength|hypertrophy|power|powerbuilding|bodybuilding|female physique|training|workout|session)(?:\s+[A-Z](?=\s*[-–—:|•]|\s*$))?\s*[-–—:|•]*\s*/i,"")
      .replace(/\s*[-–—:|•]*\s*(?:strength|hypertrophy|power|powerbuilding|bodybuilding|female physique|training|workout|session)\s*$/i,"")
      .trim();
    if(malformedTitle(raw)){
      const template=clean(global.scaledTemplate?.(session?.mission)?.label);
      const mission=clean(session?.mission).replace(/^[A-Z]-\d+\s*/i,"");
      const fallback=[template,mission,original,"Full Body"].find(value=>!malformedTitle(value));
      raw=fallback||"Full Body";
    }
    return raw;
  }
  function combined(sessions){
    const names=(sessions||[]).map(workout).filter(Boolean);
    const unique=[...new Set(names)];
    if(unique.length===0)return "Recovery Day";
    if(unique.length===1)return unique[0];
    const primary=unique[0];
    const support=unique.slice(1).map(name=>/easy aerobic/i.test(name)?"Aerobic Support":name);
    return [primary,...support].join(" + ");
  }
  global.bellWorkoutDisplayLabel=workout;
  global.bellWorkoutTitleIsMalformed=malformedTitle;
  global.bellCombinedWorkoutDisplayLabel=combined;
  global.bellDisciplineDisplayName=discipline;
})(window);
