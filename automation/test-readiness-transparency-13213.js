'use strict';
const fs = require('fs');
const vm = require('vm');
const path = require('path');

function dateKey(offset = 0) {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function session(id, offset = -1) {
  return { completedAt:id, date:dateKey(offset), name:'Strength Session' };
}
function strengthFeedback(id, values = {}, offset = -1) {
  return {
    sessionId:id,
    date:dateKey(offset),
    type:'strength',
    sessionQuality:3,
    postEnergy:3,
    overallFeeling:3,
    strain:3,
    ...values
  };
}
function baseData() {
  return {
    settings:{
      appControlMode:'coach',
      readiness:{
        checkInVersion:'quick-v1',
        sleepState:'okay', bodyState:'normal', energyState:'steady',
        sleepQuality:4, recoveryStatus:4, energy:4, motivation:4,
        painToday:false, timeMinutes:60, timeAvailability:3,
        lastPromptDate:dateKey(0)
      },
      injuryProfile:{hasLimitations:false}
    },
    readinessLog:[], sessionFeedbackLog:[], history:[]
  };
}
function load(data) {
  const context = {
    data,
    console,
    Date,
    Math,
    Number,
    String,
    Set,
    Map,
    document:{getElementById:()=>null,querySelectorAll:()=>[]},
    window:{setTimeout:()=>{}},
    alert:()=>{},
    saveData:()=>{},
    renderApp:()=>{},
    todayKey:()=>dateKey(0)
  };
  vm.createContext(context);
  const source = fs.readFileSync(path.join(__dirname,'..','js','readiness.js'),'utf8');
  vm.runInContext(source, context, {filename:'readiness.js'});
  return context;
}
const checks=[];
function check(name, condition, detail='') {
  checks.push({name, pass:Boolean(condition), detail});
}

{
  const ctx=load(baseData());
  const b=ctx.readinessBreakdown();
  check('normal quick check-in scores 80', b.dailyScore===80 && b.finalScore===80, JSON.stringify(b));
}
{
  const d=baseData();
  ['a','b'].forEach((id,i)=>{d.history.push(session(id,-1-i));d.sessionFeedbackLog.push(strengthFeedback(id,{},-1-i));});
  const ctx=load(d);const b=ctx.readinessBreakdown();
  check('two normal completed sessions create only a small modifier', b.weekly.feedbackCount===2 && b.trendModifier===-3 && b.finalScore===77, JSON.stringify(b));
}
{
  const d=baseData();
  ['a','b','c'].forEach((id,i)=>{d.history.push(session(id,-1-i));d.sessionFeedbackLog.push(strengthFeedback(id,{sessionQuality:1,postEnergy:1,overallFeeling:1,strain:5},-1-i));});
  const ctx=load(d);const b=ctx.readinessBreakdown();
  check('three low feedback records no longer hard-cap readiness at 50', b.weekly.lowFeedbackCount===3 && b.finalScore>=65 && b.finalScore!==50, JSON.stringify(b));
}
{
  const d=baseData();d.history.push(session('dup',-1));
  d.sessionFeedbackLog.push(strengthFeedback('dup',{sessionQuality:1,postEnergy:1,overallFeeling:1,strain:5},-1));
  d.sessionFeedbackLog.push(strengthFeedback('dup',{sessionQuality:1,postEnergy:1,overallFeeling:1,strain:5},-1));
  d.sessionFeedbackLog.push(strengthFeedback('dup',{sessionQuality:1,postEnergy:1,overallFeeling:1,strain:5},-1));
  const ctx=load(d);const b=ctx.readinessBreakdown();
  check('duplicate feedback is counted once by session id', b.weekly.feedbackCount===1 && b.weekly.lowFeedbackCount===1, JSON.stringify(b.weekly));
}
{
  const d=baseData();d.sessionFeedbackLog=[
    {date:dateKey(-1),sessionQuality:1,postEnergy:1,overallFeeling:1,strain:5},
    {sessionId:'missing-values',date:dateKey(-1),sessionQuality:1},
    {sessionId:'not-completed',date:dateKey(-1),sessionQuality:1,postEnergy:1,overallFeeling:1,strain:5}
  ];
  d.history.push(session('different-completed',-1));
  const ctx=load(d);const b=ctx.readinessBreakdown();
  check('malformed and unmatched feedback records are ignored', b.weekly.feedbackCount===0 && b.finalScore===80, JSON.stringify(b.weekly));
}
{
  const d=baseData();d.settings.readiness.painToday=true;
  const ctx=load(d);const b=ctx.readinessBreakdown();
  check('pain applies an explained protective cap', b.finalScore===45 && b.protectiveModifier<0 && b.protectiveCap===45, JSON.stringify(b));
}
{
  const d=baseData();const ctx=load(d);
  ctx.commitReadiness({
    checkInVersion:'quick-v1',sleepState:'okay',bodyState:'normal',energyState:'steady',
    sleepQuality:4,recoveryStatus:4,energy:4,motivation:4,painToday:false,timeMinutes:60,timeAvailability:3
  });
  const entry=d.readinessLog[0];
  check('saved check-in persists transparent score components', entry && entry.score===80 && entry.dailyScore===80 && entry.trendModifier===0 && d.settings.readiness.breakdown?.dailyScore===80, JSON.stringify(entry));
}
{
  const d=baseData();
  d.history.push(session('good',-1));
  d.sessionFeedbackLog.push(strengthFeedback('good',{sessionQuality:5,postEnergy:5,overallFeeling:5,strain:1},-1));
  const ctx=load(d);const b=ctx.readinessBreakdown();
  check('strong recovery feedback can add a small bounded positive modifier', b.trendModifier===3 && b.finalScore===83, JSON.stringify(b));
}

const failed=checks.filter(x=>!x.pass);
for(const item of checks) console.log(`${item.pass?'PASS':'FAIL'}: ${item.name}${item.detail?` — ${item.detail}`:''}`);
if(failed.length){console.error(`\n${failed.length}/${checks.length} checks failed.`);process.exit(1);}
console.log(`\nPASS: ${checks.length}/${checks.length} readiness transparency checks.`);
