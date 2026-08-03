const fs=require('fs'),vm=require('vm');
const code=fs.readFileSync('js/adaptive-weekly-schedule.js','utf8');
const context={console,Date,JSON,Math,Set,Object,Array,String,Number,Boolean,RegExp,document:{addEventListener:()=>{},getElementById:()=>null,querySelector:()=>null},window:{},
  data:{settings:{trainingAvailability:{normalDays:['Monday','Tuesday','Wednesday','Thursday','Friday']}},trainingBlock:{}},
  engineWeekPrescription:(kind)=>({label:kind==='quality'?'Run Quality':kind==='long'?'Long Run':'Aerobic Support',duration:kind==='quality'?35:kind==='long'?60:20,detail:`${kind} prescription`}),
  scaledTemplate:()=>({duration:30}),todayKey:()=> '2026-08-03',localDateFromKey:()=>new Date('2026-08-03'),
};
vm.createContext(context);vm.runInContext(code,context);
let checks=0;const ok=(v,m)=>{if(!v)throw new Error(m);checks++;};
const plan=[{id:'d1',day:'Monday',mission:'S-1',customLabel:'Bench & Back',detail:'strength',secondaryMission:'R-2 Easy Run',secondaryLabel:'Aerobic Support',secondaryDetail:'easy',secondaryDuration:20},{id:'d2',day:'Tuesday',mission:'R-4 Intervals',customLabel:'Run Quality',detail:'quality',prescribedDuration:35}];
const atomic=context.bellExplodeConcurrentPlan(plan);
ok(atomic.length===3,'compound plan should become three atomic sessions');
ok(atomic.filter(x=>context.bellSessionProfile(x).engine).length===2,'secondary engine must count toward weekly engine total');
const ensured=context.bellEnsureDisciplineExposures(atomic,{}, {strength:1,engine:2});
ok(ensured.length===3,'exposure repair must not add a duplicate engine');
const placed=context.bellOptimizeConcurrentPlan(ensured,['Monday','Tuesday','Wednesday','Thursday','Friday']);
const byDay={};for(const x of placed)(byDay[x.day]??=[]).push(x);
ok(Object.values(byDay).every(xs=>xs.filter(x=>context.bellSessionProfile(x).engine).length<=1),'ordinary plans must have no more than one engine session per day');
const one=context.bellExplodeConcurrentPlan([plan[0]]);
const repaired=context.bellEnsureDisciplineExposures(one,{}, {strength:1,engine:2});
const engines=repaired.filter(x=>context.bellSessionProfile(x).engine);
ok(engines.length===2,'missing engine role should be repaired exactly once');
ok(engines.every(x=>Number(x.prescribedDuration)>0),'every repaired engine must have a valid duration');
ok(repaired.every(x=>!x.secondaryMission&&!Array.isArray(x.sessions)),'repaired plan must remain atomic');
console.log(`PASS: ${checks}/${checks} concurrent session counting checks.`);
