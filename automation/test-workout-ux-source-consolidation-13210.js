const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'..');
const workouts=fs.readFileSync(path.join(root,'js','workouts.js'),'utf8');
const v8=fs.readFileSync(path.join(root,'js','version-8.js'),'utf8');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const css=fs.readFileSync(path.join(root,'css','workout-preview-warmup-13210.css'),'utf8');
const checks=[
  ['single warm-up renderer',(workouts.match(/function renderWarmupPanel\s*\(/g)||[]).length===1&&!v8.includes('renderWarmupPanel=function')],
  ['persistent warm-up state',workouts.includes('function bellEnsureWarmupState')&&workouts.includes('warmupItems')],
  ['preview contains warm-up and exercises',workouts.includes('Preparation')&&workouts.includes('Working Plan')],
  ['preview modal overlays workout',css.includes('#workoutPreviewModal{z-index:260')],
  ['working sets gated',workouts.includes('if(!bellWarmupHandled(active))')],
  ['legacy warm-up override removed',!v8.includes('function bellWarmupRoutine')],
  ['versioned workout source',html.includes('./js/workouts.js?v=132100')],
  ['active build visible',html.includes('13.21.0 · Workout UX Source Consolidation')]
];
let failed=0;
for(const [name,ok] of checks){console.log(`${ok?'PASS':'FAIL'}: ${name}`);if(!ok)failed++;}
if(failed)process.exit(1);
console.log(`PASS: ${checks.length}/${checks.length} workout UX consolidation checks.`);
