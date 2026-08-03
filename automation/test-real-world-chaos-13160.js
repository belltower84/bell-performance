"use strict";
const fs=require('fs'),path=require('path');global.window=global;
require(path.join(__dirname,'..','js','real-world-chaos-13160.js'));
require(path.join(__dirname,'..','js','longitudinal-progression-13140.js'));
require(path.join(__dirname,'..','js','prescription-application-13150.js'));
function rng(seed){let x=seed>>>0;return()=>{x=(Math.imul(x,1664525)+1013904223)>>>0;return x/4294967296;};}
const personas=['steady','rapid','slow','inconsistent','low_adherence','overreaching','pain_interrupted','travel','beginner_bad_data','plateau','goal_change','hybrid'];
const phases=['base','build','build','specific','taper','event_week','recovery'];
const results=[];let totalExposures=0;
const assert=(v,m)=>{if(!v)throw new Error(m)};
function rawFor(persona,i,r,gate){let status='observe',reasons=[];
  if(persona==='rapid')status=i%4===1?'accelerate':'progress';
  else if(persona==='steady')status=i%3===1?'progress':'observe';
  else if(persona==='slow')status=i%4===2?'progress':'observe';
  else if(persona==='inconsistent')status=i%2?'hold':'progress';
  else if(persona==='low_adherence')status=i%3===0?'rebuild':'observe';
  else if(persona==='overreaching'){status=i%3===0?'regress':'hold';reasons=['LOW_READINESS'];}
  else if(persona==='pain_interrupted')status=i===4?'protect':i===9?'safety_hold':'progress';
  else if(persona==='travel')status=[5,6,7].includes(i)?'rebuild':'progress';
  else if(persona==='beginner_bad_data')status=i%4===0?'progress':'observe';
  else if(persona==='plateau')status=i<8?'observe':i%3===0?'regress':'hold';
  else if(persona==='goal_change')status=i===8?'rebuild':i%3===1?'progress':'observe';
  else status=i%2===0?'progress':'observe';
  if(!gate.allow_adaptation)status='observe';
  if(!gate.allow_upward&&['progress','accelerate'].includes(status)){status='observe';reasons.push('INSUFFICIENT_OR_CONTRADICTORY_EVIDENCE');}
  return{status,intensity_factor:status==='regress'||status==='rebuild'?.95:1.025,volume_factor:status==='regress'||status==='rebuild'?.8:1.04,engine_duration_factor:status==='regress'||status==='rebuild'?.85:1.05,reason_codes:reasons,explanation:'Chaos simulation decision.'};
}
function template(channel,eventRole){return channel==='engine'?{name:'Event Run',duration:60,eventRole,exercises:[{name:'Run',sets:1,reps:'60 min'}]}:{name:'Strength Session',eventRole,exercises:[{name:'Back Squat',sets:4,reps:'5',recommendedWeight:300},{name:'Barbell Row',sets:3,reps:'8',recommendedWeight:150}]};}
for(let p=0;p<personas.length;p++)for(let seed=1;seed<=10;seed++){
 const persona=personas[p],rand=rng((p+1)*1000+seed),history=[],ids=new Set();let state=null,applications=new Set(),deloadEpisodes=0,lastDeload=false,downRun={strength:0,engine:0},maxDownRun=0,unsafe=false,roleLoss=false,lateRewrite=false,duplicateApplied=false;
 const exposures=16+(seed%3);let phase='build',goal='hybrid';
 for(let i=0;i<exposures;i++){
  const channel=(persona==='hybrid'||i%3===0)?'engine':'strength';phase=phases[Math.min(phases.length-1,Math.floor(i/(exposures/phases.length)))];
  if(persona==='goal_change'&&i===8)goal='10k';
  let raw={session_id:`${persona}-${seed}-${i}`,session_type:channel,completed_at:`2026-08-${String(1+i).padStart(2,'0')}T12:00:00Z`,status:'completed',session_rpe:4+Math.round(rand()*5),readiness:2+Math.round(rand()*3),pain_severity:0,completed_duration_minutes:45+Math.round(rand()*30),exercises:channel==='strength'?[{exercise_name:'Back Squat',planned_sets:4,completed_sets:3+Math.round(rand()),average_rpe:6+rand()*3}]:[]};
  if(persona==='beginner_bad_data'&&i%3===0){raw.session_rpe=99;raw.readiness=-4;raw.completed_duration_minutes=9999;raw.average_heart_rate=400;}
  if(persona==='pain_interrupted'&&(i===4||i===9)){raw.pain_severity=i===9?9:5;raw.session_feedback='felt great';}
  if(persona==='low_adherence'&&i%3===0){raw.completed_duration_minutes=0;raw.status='missed';}
  if(persona==='travel'&&[5,6,7].includes(i)){raw.completed_duration_minutes=15;raw.readiness=2;}
  if(persona==='overreaching'){raw.readiness=1;raw.session_rpe=9.5;}
  if(i===6&&seed%2===0&&history.length)raw={...history[history.length-1]};
  const gate=bellRealWorldConfidenceGate(raw,history),finger=raw.completion_id||bellCompletionFingerprint(raw);
  if(gate.duplicate){assert(ids.has(finger),'duplicate not previously seen');history.push({...raw,completion_id:finger});totalExposures++;continue;}
  ids.add(finger);history.push({...raw,completion_id:finger});
  const rawDecision=rawFor(persona,i,rand,gate);const stabilized=bellStabilizeLongitudinalProgression(rawDecision,state,{session_type:channel,phase_id:phase,event_role:goal});state=stabilized.state;const d=stabilized.decision;
  if(['taper','event_week','recovery'].includes(phase)&&['progress','accelerate'].includes(d.status))unsafe=true;
  if(gate.normalized.pain_severity>=5&&['progress','accelerate'].includes(d.status))unsafe=true;
  assert(d.intensity_factor>=.9&&d.intensity_factor<=1.1,'intensity outside cap');assert(d.volume_factor>=.6&&d.volume_factor<=1.15,'volume outside cap');assert(d.engine_duration_factor>=.7&&d.engine_duration_factor<=1.2,'engine outside cap');
  if(d.status==='deload'&&!lastDeload)deloadEpisodes++;lastDeload=d.status==='deload';downRun[channel]=['regress','rebuild'].includes(d.status)?downRun[channel]+1:0;maxDownRun=Math.max(maxDownRun,downRun[channel]);
  const app=bellBuildPrescriptionApplication(d,[],raw.session_id,channel);const before=template(channel,goal),after=bellApplyClosedLoopPrescription(before,app,{sessionType:channel,eventRole:goal,mission:before.name});
  if(applications.has(app.applicationId)){const twice=bellApplyClosedLoopPrescription(after,app,{sessionType:channel,eventRole:goal});if(JSON.stringify(twice)!==JSON.stringify(after))duplicateApplied=true;}applications.add(app.applicationId);
  if(after.prescriptionApplication?.rolesBefore?.eventRole!==goal&&d.status!=='safety_hold')roleLoss=true;
  if(i>0&&raw.completed_at<history[history.length-2]?.completed_at)lateRewrite=true;
  totalExposures++;
 }
 try{assert(!unsafe,'unsafe progression occurred');assert(!roleLoss,'event role lost');assert(!duplicateApplied,'duplicate application compounded');assert(maxDownRun<=1,'regression spiral');assert(deloadEpisodes<=3,'endless deload loop');assert(state.channels.strength.intensity_target<=1.1&&state.channels.strength.volume_target<=1.15&&state.channels.engine.duration_target<=1.2,'cumulative ceiling exceeded');results.push({persona,seed,passed:true,exposures,goal,deloadEpisodes,maxDownRun});}
 catch(e){results.push({persona,seed,passed:false,exposures,error:e.message,deloadEpisodes,maxDownRun});}
}
const summary={version:'13.16.0',journeys:results.length,passed:results.filter(x=>x.passed).length,failed:results.filter(x=>!x.passed).length,exposures:totalExposures,results};
const dir=path.join(__dirname,'real_world_chaos_reports','latest');fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,'js-results.json'),JSON.stringify(summary,null,2));console.log(`${summary.passed}/${summary.journeys} journeys passed across ${summary.exposures} exposures`);if(summary.failed)process.exit(1);
