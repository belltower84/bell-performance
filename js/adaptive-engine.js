"use strict";

function adaptiveDateKey(value){
  const d=value instanceof Date?value:new Date(value||Date.now());
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}
function adaptiveDaysAgo(days){const d=new Date();d.setHours(0,0,0,0);d.setDate(d.getDate()-days);return d;}
function adaptiveRecentHistory(days=14){const cutoff=adaptiveDaysAgo(days);return (data.history||[]).filter(x=>new Date(x.completedAt||0)>=cutoff);}
function adaptiveRecentReadiness(days=7){const cutoff=adaptiveDateKey(adaptiveDaysAgo(days-1));return (data.readinessLog||[]).filter(x=>String(x.date||"")>=cutoff).map(x=>Number(x.score)).filter(Number.isFinite);}
function adaptiveRecentFeedback(days=14){const cutoff=adaptiveDateKey(adaptiveDaysAgo(days-1));return (data.sessionFeedbackLog||[]).filter(x=>String(x.date||"")>=cutoff);}
function adaptivePlanCompliance(){
  const today=adaptiveDateKey(new Date());
  const eligible=(data.plan||[]).filter(item=>{
    const key=typeof planDateKey==="function"?planDateKey(item):(item.scheduledDate||today);
    return !key||key<=today;
  });
  const plan=eligible.flatMap(item=>typeof sessionsFromPlanItem==="function"?sessionsFromPlanItem(item):[{completed:Boolean(item.done),mission:item.mission}]).filter(x=>x.mission&&!String(x.mission).startsWith("M-"));
  if(!plan.length)return null;
  return plan.filter(x=>x.completed).length/plan.length;
}
function adaptiveTrainingEvaluation(){
  const readiness=adaptiveRecentReadiness(7), feedback=adaptiveRecentFeedback(14), history=adaptiveRecentHistory(14), compliance=adaptivePlanCompliance();
  const avgReadiness=readiness.length?readiness.reduce((a,b)=>a+b,0)/readiness.length:null;
  const lowReadiness=readiness.filter(x=>x<52).length;
  const yellowReadiness=readiness.filter(x=>x>=52&&x<75).length;
  const highStrain=feedback.filter(x=>Number(x.strain)>=4||Number(x.symptoms)>=4).length;
  const lowPostEnergy=feedback.filter(x=>Number(x.postEnergy)<=2||Number(x.legFreshness)<=2).length;
  const hardSessions=history.filter(x=>Number(x.rpe)>=9).length;
  const recentMisses=typeof recentMissedSessionSignals==="function"?recentMissedSessionSignals(14):{fatigue:0,skipped:0};
  const reasons=[];
  let status="BUILD",volumeScale=1,loadScale=1,engineScale=1;
  if(lowReadiness>=3||(avgReadiness!==null&&avgReadiness<52)||highStrain>=3||recentMisses.fatigue>=2){
    status="RECOVER";volumeScale=.58;loadScale=.82;engineScale=.45;
    if(lowReadiness>=3||avgReadiness<52)reasons.push("readiness has remained below the recovery threshold");
    if(highStrain>=3)reasons.push("recent sessions produced repeated high strain or symptoms");
    if(recentMisses.fatigue>=2)reasons.push("multiple sessions were missed for fatigue, pain, or illness");
  }else if(lowReadiness>=1||yellowReadiness>=3||highStrain>=1||lowPostEnergy>=2||hardSessions>=3){
    status="HOLD";volumeScale=.82;loadScale=.92;engineScale=.72;
    if(lowReadiness>=1||yellowReadiness>=3)reasons.push("the seven-day readiness trend calls for controlled loading");
    if(highStrain>=1||lowPostEnergy>=2)reasons.push("post-session recovery has been inconsistent");
    if(hardSessions>=3)reasons.push("too many recent sessions were completed at RPE 9–10");
  }else if(compliance!==null&&compliance<.55){
    status="REBUILD";volumeScale=.85;loadScale=.94;engineScale=.8;reasons.push("plan completion is low, so progression is being rebuilt conservatively");
  }else{
    reasons.push("readiness, adherence, and session feedback support normal progression");
  }
  return {status,volumeScale,loadScale,engineScale,reasons,avgReadiness,lowReadiness,compliance,sessionCount:history.length,evaluatedAt:new Date().toISOString()};
}
function updateAdaptiveTrainingState({save=false}={}){
  if(!data.adaptiveTraining?.enabled)return {status:"OFF",volumeScale:1,loadScale:1,engineScale:1,reasons:["adaptive training is disabled"]};
  const next=adaptiveTrainingEvaluation();
  data.adaptiveTraining={...data.adaptiveTraining,...next,currentStatus:next.status,lastEvaluation:next.evaluatedAt,complianceRate:next.compliance};
  if(save&&typeof saveData==="function")saveData({render:false});
  return data.adaptiveTraining;
}
function adaptiveTrainingModifier(){return updateAdaptiveTrainingState({save:false});}
function adaptiveStrengthVolumeScale(){return Number(adaptiveTrainingModifier().volumeScale)||1;}
function adaptiveStrengthLoadScale(){return Number(adaptiveTrainingModifier().loadScale)||1;}
function adaptiveEngineScale(){return Number(adaptiveTrainingModifier().engineScale)||1;}
function adaptiveCoachBrief(){
  const a=adaptiveTrainingModifier(), pct=a.complianceRate==null?"not enough data":`${Math.round(a.complianceRate*100)}% plan completion`;
  const lead={BUILD:"Progress is supportable",HOLD:"Load is being managed",RECOVER:"Recovery protocol active",REBUILD:"Consistency rebuild active",OFF:"Adaptive training disabled"}[a.status]||"Adaptive review";
  return `${lead}. ${a.reasons.join("; ")}. Current signal: ${pct}.`;
}
function applyAdaptiveEnginePrescription(prescription,kind){
  if(!prescription)return prescription;
  const a=adaptiveTrainingModifier(), scale=Number(a.engineScale)||1;
  if(a.status==="BUILD")return {...prescription,adaptiveStatus:a.status,adaptiveNote:"Progression supported by current readiness and feedback."};
  const duration=Math.max(15,Math.round((Number(prescription.duration)||25)*scale));
  let detail=prescription.detail;
  if(a.status==="RECOVER")detail=kind==="quality"?`${duration} min easy Zone 1–2 technique work. Hard intervals removed.`:`${duration} min very easy recovery effort.`;
  else if(a.status==="HOLD")detail=`${detail} Volume reduced to approximately ${Math.round(scale*100)}% while intensity remains controlled.`;
  else if(a.status==="REBUILD")detail=`${detail} Keep the session simple and finish with energy in reserve.`;
  return {...prescription,duration,detail,adaptiveStatus:a.status,adaptiveNote:a.reasons.join("; ")};
}
function adaptiveSessionCompleted(session){
  if(!session)return;
  const a=updateAdaptiveTrainingState({save:false});
  session.adaptiveDecision={status:a.status,volumeScale:a.volumeScale,loadScale:a.loadScale,engineScale:a.engineScale,reasons:[...a.reasons],evaluatedAt:a.lastEvaluation};
}
