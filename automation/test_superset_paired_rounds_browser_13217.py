from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parent.parent
CSS_FILES=[
 'css/app.css','css/guided-workout-13193.css','css/guided-workout-13203.css',
 'css/guided-workout-13216.css','css/guided-workout-13205.css','css/guided-workout-13206.css',
 'css/guided-workout-13212.css','css/guided-workout-cleanup-13216.css',
 'css/guided-workout-paired-rounds-13217.css'
]
CSS='\n'.join((ROOT/f).read_text() for f in CSS_FILES)
JS=(ROOT/'js/guided-workout-13217.js').read_text()+'\n'+(ROOT/'js/guided-workout-13212.js').read_text()
HTML='''<!doctype html><html><head><meta charset="utf-8"></head><body class="workout-open">
<div id="workoutModal" class="modal"><div class="modal-box workout-shell-1385"><div id="restPanel" class="hidden"></div><div id="activeExercises"></div><div id="workoutCompletionCard"></div></div></div>
<script>
let data={activeWorkout:null};
window.saveData=()=>{}; window.setText=()=>{}; window.updateTimerDisplay=()=>{}; window.updateWorkoutProgress=()=>{};
window.beginRestTimer=()=>{}; window.closeWorkout=()=>{}; window.discardWorkout=()=>{};
window.openExerciseSwap=()=>{}; window.openExerciseDetail=()=>{};
</script></body></html>'''
SAMPLE={
  'name':'S-3 Athletic Upper','title':'S-3 Athletic Upper','duration':55,'equipmentLocation':'Home Gym','stage':'active','gwExerciseIndex':0,
  'exercises':[
    {'name':'Rear-Delt Fly','block':'Accessory','prescription':'3 × 15–20','plannedReps':'15–20','cue':'Superset with triceps.','rest':45,'supersetId':'test-superset','supersetType':'superset','supersetPosition':'A','supersetInstruction':'Alternate A1 and B1. Complete both exercises, then rest 45 seconds.','sets':[{'set':1,'reps':'15–20','weight':'','rpe':'','done':False},{'set':2,'reps':'15–20','weight':'','rpe':'','done':False},{'set':3,'reps':'15–20','weight':'','rpe':'','done':False}]},
    {'name':'Dumbbell Triceps Extension','block':'Accessory','prescription':'3 × 12–15','plannedReps':'12–15','cue':'Substituted for Rope Pressdown at Home Gym. Full lockout without shoulder movement.','rest':45,'supersetId':'test-superset','supersetType':'superset','supersetPosition':'B','supersetInstruction':'Alternate A1 and B1. Complete both exercises, then rest 45 seconds.','equipmentAdjusted':True,'equipmentAdjustmentReason':'Cable station unavailable at Home Gym.','originalExercise':'Rope Pressdown','sets':[{'set':1,'reps':'12–15','weight':'','rpe':'','done':False},{'set':2,'reps':'12–15','weight':'','rpe':'','done':False},{'set':3,'reps':'12–15','weight':'','rpe':'','done':False}]}
  ]
}

with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    page=browser.new_page(viewport={'width':1280,'height':900})
    page.set_content(HTML,wait_until='load')
    page.add_style_tag(content=CSS+'\nhtml,body{margin:0;background:#070b0f}.modal{display:block!important}.modal-box{height:100vh!important}')
    page.add_script_tag(content=JS)
    page.evaluate("sample=>{data.activeWorkout=sample;renderActiveWorkout();}",SAMPLE)
    page.wait_for_timeout(350)
    result=page.evaluate("""() => {
      const modal=document.querySelector('#workoutModal .modal-box');
      const summaries=[...document.querySelectorAll('.gw-paired-summary')];
      const rounds=[...document.querySelectorAll('.gw-paired-round-row:not(.is-triset)')];
      const cells=rounds.map(r=>[...r.querySelectorAll('.gw-paired-set-cell')]);
      const paired=cells.map(pair=>({count:pair.length,topDelta:Math.abs(pair[0].getBoundingClientRect().top-pair[1].getBoundingClientRect().top),heightDelta:Math.abs(pair[0].getBoundingClientRect().height-pair[1].getBoundingClientRect().height)}));
      const controls=[...document.querySelectorAll('.gw-paired-set-cell input,.gw-paired-set-cell button')];
      const overflow=controls.map(x=>Math.max(0,Math.ceil(x.getBoundingClientRect().right-modal.getBoundingClientRect().right)));
      const current=document.querySelector('.gw-paired-set-cell.is-current .gw-paired-set-id')?.textContent.trim();
      return {summaryCount:summaries.length,summaryTopDelta:Math.abs(summaries[0].getBoundingClientRect().top-summaries[1].getBoundingClientRect().top),roundCount:rounds.length,paired,overflow,modalOverflow:modal.scrollWidth-modal.clientWidth,current,bodyText:document.querySelector('#activeExercises').innerText};
    }""")
    print(result)
    assert result['summaryCount']==2 and result['summaryTopDelta']<=1,result
    assert result['roundCount']==3,result
    assert all(x['count']==2 and x['topDelta']<=1 and x['heightDelta']<=1 for x in result['paired']),result
    assert max(result['overflow'])<=1 and result['modalOverflow']<=16,result
    assert result['current']=='A1',result
    assert 'Superset with triceps.' not in result['bodyText'],result
    assert 'Full lockout without shoulder movement.' in result['bodyText'],result
    page.click('.gw-paired-set-cell.is-current .gw-status')
    page.wait_for_timeout(150)
    next_current=page.locator('.gw-paired-set-cell.is-current .gw-paired-set-id').inner_text().strip()
    assert next_current=='B1',next_current
    page.screenshot(path=str(ROOT/'VALIDATION_13_21_7_DESKTOP.png'),full_page=True)

    page.set_viewport_size({'width':390,'height':844}); page.wait_for_timeout(200)
    mobile=page.evaluate("""() => {
      const modal=document.querySelector('#workoutModal .modal-box');
      const rounds=[...document.querySelectorAll('.gw-paired-round-row:not(.is-triset)')];
      const sequence=rounds.map(r=>[...r.querySelectorAll('.gw-paired-set-id')].map(x=>x.textContent.trim()));
      const cells=[...document.querySelectorAll('.gw-paired-set-cell')];
      return {overflow:modal.scrollWidth-modal.clientWidth,cellOverflow:cells.map(x=>x.scrollWidth-x.clientWidth),sequence,roundColumns:rounds.map(r=>getComputedStyle(r).gridTemplateColumns)};
    }""")
    print('mobile',mobile)
    assert mobile['overflow']<=16 and max(mobile['cellOverflow'])<=1,mobile
    assert mobile['sequence']==[['A1','B1'],['A2','B2'],['A3','B3']],mobile
    page.screenshot(path=str(ROOT/'VALIDATION_13_21_7_MOBILE.png'),full_page=True)
    browser.close()
print('PASS: supersets align A1/B1, A2/B2, and A3/B3 by shared round without desktop or mobile horizontal clipping.')
