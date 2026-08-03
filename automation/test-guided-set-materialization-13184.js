const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'..');
const guided=fs.readFileSync(path.join(root,'js','guided-workout-13183.js'),'utf8');
const workouts=fs.readFileSync(path.join(root,'js','workouts.js'),'utf8');
const index=fs.readFileSync(path.join(root,'index.html'),'utf8');
const checks=[
 ['materializer exists',guided.includes('function materializeWorkout')],
 ['text prescription parsed',guided.includes("match(/(\\d+)\\s*[x×]/i)")],
 ['fallback render guard exists',guided.includes('No valid working sets found')],
 ['training entry invokes materializer',workouts.includes("typeof gwMaterializeWorkout==='function'")],
 ['training entry renders active set',workouts.includes("window.renderActiveWorkout()")],
 ['current set button exists',guided.includes('Complete Set ${p.si+1}')],
 ['13.18.4 asset version loaded',index.includes('guided-workout-13183.js?v=131840')]
];
const failed=checks.filter(([,ok])=>!ok);checks.forEach(([name,ok])=>console.log(`${ok?'PASS':'FAIL'}: ${name}`));if(failed.length)process.exit(1);console.log(`PASS: ${checks.length}/${checks.length} guided set materialization checks.`);
