const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const css=fs.readFileSync(path.join(root,'css','personal-pilot-13180.css'),'utf8');
const js=fs.readFileSync(path.join(root,'js','personal-pilot-13180.js'),'utf8');
const checks=[
  ['version updated',html.includes('13.18.0-personal-pilot-ux-visual-refinement')],
  ['UX stylesheet loaded',html.includes('personal-pilot-13180.css')],
  ['UX script loaded',html.includes('personal-pilot-13180.js')],
  ['mission card redesigned',css.includes('.command-mission-card')&&css.includes('.command-start-button')],
  ['10-second check-in refined',css.includes('.quick-readiness-question')&&js.includes('openDailyReadiness()')],
  ['workout execution refined',css.includes('.exercise-card')&&css.includes('.workout-stage-actions')],
  ['coaching explanation visible',js.includes('Why did Bell choose this?')&&js.includes('coachingReasons')],
  ['design tokens standardized',css.includes('--bell-space-')&&css.includes('--bell-radius')]
];
for(const [name,ok] of checks) console.log(`${ok?'PASS':'FAIL'}: ${name}`);
if(checks.some(([,ok])=>!ok)) process.exit(1);
console.log(`PASS: ${checks.length}/${checks.length} personal pilot UX checks.`);
