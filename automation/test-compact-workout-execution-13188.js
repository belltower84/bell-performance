const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'..');
const js=fs.readFileSync(path.join(root,'js','guided-workout-13188.js'),'utf8');
const css=fs.readFileSync(path.join(root,'css','guided-workout-13188.css'),'utf8');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const checks=[
  ['compact set grid',css.includes('grid-template-columns:42px minmax(84px,1fr) minmax(62px,.65fr) 96px')],
  ['fixed bottom dock',css.includes('.gw-bottom-dock{position:fixed')],
  ['next set skip semantics',js.includes('function nextSet(exerciseIndex)')&&js.includes('skipSet(exerciseIndex,setIndex)')],
  ['explicit skipped state',js.includes('skipped:Boolean(set?.skipped)')&&js.includes('is-skipped')],
  ['load rating preserved',js.includes('How did the weight feel?')],
  ['muscle indicators',js.includes('muscleProfile')&&js.includes('gw-muscle-icon')],
  ['13.18.8 assets referenced',html.includes('guided-workout-13188.css?v=131880')&&html.includes('guided-workout-13188.js?v=131880')]
];
const failed=checks.filter(([,ok])=>!ok);
for(const [name,ok] of checks)console.log(`${ok?'PASS':'FAIL'}: ${name}`);
if(failed.length)process.exit(1);
console.log(`PASS: ${checks.length}/${checks.length} compact workout execution checks.`);
