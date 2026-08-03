const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const js = fs.readFileSync(path.join(root, 'js', 'guided-workout-13186.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'css', 'guided-workout-13186.css'), 'utf8');
const checks = [
  ['renders all sets for the current exercise', js.includes('exercise.sets.map')],
  ['reps are editable inline', js.includes('gwReps-${exerciseIndex}-${setIndex}') && js.includes("'reps',this.value")],
  ['individual set completion remains available', js.includes('gwCompleteSet')],
  ['completed sets can be corrected', js.includes('gwUndoSet')],
  ['load editing is optional', js.includes('gw-load-toggle') && js.includes('gw-load-edit')],
  ['rest timer is not fixed over content', css.includes('position:static!important') && !css.includes('position:fixed!important')],
  ['mobile set layout is responsive', css.includes('@media(max-width:700px)')]
];
let passed = 0;
for (const [name, ok] of checks) {
  console.log(`${ok ? 'PASS' : 'FAIL'}: ${name}`);
  if (ok) passed++;
}
console.log(`PASS: ${passed}/${checks.length} guided exercise set-list checks.`);
if (passed !== checks.length) process.exit(1);
