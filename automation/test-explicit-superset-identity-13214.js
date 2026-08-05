'use strict';
const fs=require('fs');
const vm=require('vm');
const path=require('path');
const source=fs.readFileSync(path.join(__dirname,'..','js','guided-workout-13214.js'),'utf8');
const noop=()=>{};
const style={setProperty:noop};
const context={
  console,Date,Math,Number,String,Set,Map,setTimeout:noop,setInterval:noop,clearInterval:noop,
  requestAnimationFrame:fn=>{if(typeof fn==='function')fn();},
  MutationObserver:function(){this.observe=noop;this.disconnect=noop;},
  ResizeObserver:function(){this.observe=noop;this.disconnect=noop;},
  document:{querySelector:()=>null,getElementById:()=>null,addEventListener:noop,documentElement:{style}},
  window:{addEventListener:noop,visualViewport:null,saveData:noop}
};
context.window.window=context.window;
vm.createContext(context);
vm.runInContext(source,context,{filename:'guided-workout-13214.js'});
const api=context.window.BellWorkoutGrouping13214;
const checks=[];
function check(name,ok,detail=''){checks.push({name,ok:Boolean(ok),detail});}
function ex(name,extra={}){return{name,block:'Primary Strength',sets:[{set:1,reps:3,done:false,skipped:false}],...extra};}
const straight={exercises:[ex('Push Press',{cue:'Fast bar speed.'}),ex('Chin-up',{cue:'Stop before form breaks.'})]};
let g=api.groupFor(straight,0);
check('Push Press remains a normal standalone exercise',g.kind==='single'&&g.exercises.length===1,JSON.stringify(g.indices));
check('single exercise uses its real block label',api.exerciseSlotLabel(straight.exercises[0],0,g)==='PRIMARY STRENGTH');
check('Push Press muscle targets include legs and core',JSON.stringify(api.muscleProfile('Push Press'))===JSON.stringify(['Shoulders','Triceps','Legs','Core']),JSON.stringify(api.muscleProfile('Push Press')));
const cueOnly={exercises:[ex('Exercise A',{cue:'Superset with Exercise B.'}),ex('Exercise B',{cue:'Superset with Exercise A.'})]};
g=api.groupFor(cueOnly,0);
check('cue text alone cannot create a superset',g.kind==='single'&&g.exercises.length===1,JSON.stringify(g.indices));
const explicit={exercises:[ex('Lateral Raise',{supersetId:'pair-1',supersetPosition:'A',supersetInstruction:'Alternate A1 and B1.'}),ex('Curl',{supersetId:'pair-1',supersetPosition:'B'})]};
g=api.groupFor(explicit,0);
check('explicit superset metadata groups both exercises',g.kind==='superset'&&g.exercises.length===2,JSON.stringify(g.indices));
check('explicit superset has clear instructions',api.groupInstruction(g).includes('Alternate A1 and B1'),api.groupInstruction(g));
const bellPair={exercises:[ex('Rear-Delt Fly',{advancedTechnique:{name:'Bell Pair',short:'Antagonist superset',instruction:'Pair with Rope Pressdown. Complete both, then rest.'}}),ex('Rope Pressdown',{advancedTechnique:{name:'Bell Pair',short:'Antagonist superset',instruction:'Pair with Rear-Delt Fly. Stop with clean form.'}})]};
g=api.groupFor(bellPair,1);
check('reciprocal Bell Pair metadata groups both exercises',g.kind==='superset'&&g.start===0&&g.end===1,JSON.stringify(g.indices));
const legacy={exercises:[ex('Dumbbell Lateral Raise'),ex('Incline Dumbbell Curl')]};
g=api.groupFor(legacy,0);
check('known legacy pair is migrated for active saved workouts',g.kind==='superset'&&legacy.exercises.every(x=>x.supersetId),JSON.stringify(g.indices));
check('visible FRONT/BACK text removed',!source.includes('<span>FRONT</span>')&&!source.includes('<span>BACK</span>'));
const failed=checks.filter(x=>!x.ok);
for(const item of checks)console.log(`${item.ok?'PASS':'FAIL'}: ${item.name}${item.detail?` — ${item.detail}`:''}`);
if(failed.length){console.error(`\\n${failed.length}/${checks.length} checks failed.`);process.exit(1);}console.log(`\\nPASS: ${checks.length}/${checks.length} explicit superset identity checks.`);
