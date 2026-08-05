from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parent.parent
CSS_FILES=[
 'css/app.css','css/guided-workout-13193.css','css/guided-workout-13203.css',
 'css/guided-workout-13216.css','css/guided-workout-13205.css','css/guided-workout-13206.css',
 'css/guided-workout-13212.css','css/guided-workout-cleanup-13216.css',
 'css/guided-workout-paired-rounds-13219.css'
]
CSS='\n'.join((ROOT/f).read_text() for f in CSS_FILES)
JS='\n'.join((ROOT/f).read_text() for f in ['js/guided-workout-13219.js','js/guided-workout-13205.js','js/guided-workout-13206.js','js/guided-workout-13212.js'])
HTML='''<!doctype html><html><head><meta charset="utf-8"></head><body class="workout-open">
<div id="workoutModal" class="modal"><div class="modal-box workout-shell-1385"><div id="restPanel" class="hidden"><span id="restTimer"></span></div><div id="activeExercises"></div><div id="workoutCompletionCard"></div></div></div>
<script>
let data={activeWorkout:null};
window.restCalls=[];
window.saveData=()=>{}; window.setText=()=>{}; window.updateTimerDisplay=()=>{}; window.updateWorkoutProgress=()=>{};
window.beginRestTimer=(seconds,name)=>window.restCalls.push({seconds,name}); window.closeWorkout=()=>{}; window.discardWorkout=()=>{};
window.openExerciseSwap=()=>{}; window.openExerciseDetail=()=>{};
</script></body></html>'''
SAMPLE={
  'name':'S-3 Athletic Upper','title':'S-3 Athletic Upper','duration':55,'equipmentLocation':'Home Gym','stage':'active','gwExerciseIndex':0,
  'exercises':[
    {'name':'Rear-Delt Fly','block':'Accessory','prescription':'3 × 15–20','plannedReps':'15–20','cue':'Superset with triceps.','rest':30,'supersetId':'test-superset','supersetType':'superset','supersetPosition':'A','supersetInstruction':'Alternate A1 and B1. Complete both exercises, then rest 45 seconds.','sets':[{'set':1,'reps':'15–20','weight':'','rpe':'','done':False},{'set':2,'reps':'15–20','weight':'','rpe':'','done':False},{'set':3,'reps':'15–20','weight':'','rpe':'','done':False}]},
    {'name':'Band Pressdown','block':'Accessory','prescription':'3 × 12–15','plannedReps':'12–15','cue':'Full lockout without shoulder movement.','rest':30,'supersetId':'test-superset','supersetType':'superset','supersetPosition':'B','supersetInstruction':'Alternate A1 and B1. Complete both exercises, then rest 45 seconds.','equipmentAdjusted':True,'equipmentAdjustmentReason':'Cable station unavailable at Home Gym.','originalExercise':'Rope Pressdown','sets':[{'set':1,'reps':'12–15','weight':'','rpe':'','done':False},{'set':2,'reps':'12–15','weight':'','rpe':'','done':False},{'set':3,'reps':'12–15','weight':'','rpe':'','done':False}]}
  ]
}

with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    page=browser.new_page(viewport={'width':1440,'height':1000})
    page.set_content(HTML,wait_until='load')
    page.add_style_tag(content=CSS+'\nhtml,body{margin:0;background:#070b0f}.modal{display:block!important}.modal-box{height:100vh!important}')
    page.add_script_tag(content=JS)
    page.evaluate("sample=>{data.activeWorkout=sample;renderActiveWorkout();}",SAMPLE)
    page.wait_for_timeout(250)

    initial=page.evaluate("""() => {
      const rounds=[...document.querySelectorAll('.gw-paired-round-row:not(.is-triset)')];
      return {
        roundCount:rounds.length,
        completeRoundButtons:document.querySelectorAll('.gw-complete-round').length,
        exerciseCompleteButtons:document.querySelectorAll('.gw-paired-set-cell .gw-status').length,
        passiveStatuses:document.querySelectorAll('.gw-paired-set-cell .gw-paired-status').length,
        currentRound:document.querySelector('.gw-paired-round-row.is-current-round .gw-round-number')?.innerText,
        groupRest:window.BellWorkoutGrouping13219.groupRestSeconds(window.BellWorkoutGrouping13219.groupFor(data.activeWorkout,0)),
        rowAlignment:rounds.map(row=>{const cells=[...row.querySelectorAll('.gw-paired-set-cell')];return {count:cells.length,topDelta:Math.abs(cells[0].getBoundingClientRect().top-cells[1].getBoundingClientRect().top),heightDelta:Math.abs(cells[0].getBoundingClientRect().height-cells[1].getBoundingClientRect().height)};}),
        text:document.querySelector('#activeExercises').innerText
      };
    }""")
    print('initial',initial)
    assert initial['roundCount']==3,initial
    assert initial['completeRoundButtons']==1,initial
    assert initial['exerciseCompleteButtons']==0,initial
    assert initial['passiveStatuses']==6,initial
    assert initial['groupRest']==45,initial
    assert all(x['count']==2 and x['topDelta']<=1 and x['heightDelta']<=1 for x in initial['rowAlignment']),initial
    assert 'COMPLETE ROUND' in initial['text'],initial
    assert 'Complete both exercises, then rest 45 seconds.' in initial['text'],initial
    page.screenshot(path=str(ROOT/'VALIDATION_13_21_9_ROUND_ACTION_DESKTOP.png'),full_page=True)

    page.click('.gw-complete-round')
    page.wait_for_timeout(100)
    after1=page.evaluate("""() => ({
      doneA:data.activeWorkout.exercises[0].sets[0].done,
      doneB:data.activeWorkout.exercises[1].sets[0].done,
      nextA:data.activeWorkout.exercises[0].sets[1].done,
      calls:window.restCalls,
      activeRound:window.BellWorkoutGrouping13219.currentRoundIndex(window.BellWorkoutGrouping13219.groupFor(data.activeWorkout,0)),
      completeButtons:document.querySelectorAll('.gw-complete-round').length,
      doneStatuses:[...document.querySelectorAll('.gw-paired-round-row')][0].innerText,
      liveRest:document.querySelector('.gw-live-rest strong')?.textContent
    })""")
    print('after round 1',after1)
    assert after1['doneA'] and after1['doneB'] and not after1['nextA'],after1
    assert len(after1['calls'])==1 and after1['calls'][0]['seconds']==45,after1
    assert after1['liveRest'] in ('00:45','00:44'),after1
    assert after1['activeRound']==1 and after1['completeButtons']==1,after1
    assert 'ROUND DONE' in after1['doneStatuses'],after1

    page.click('.gw-complete-round'); page.wait_for_timeout(80)
    after2=page.evaluate("() => ({calls:window.restCalls,activeRound:window.BellWorkoutGrouping13219.currentRoundIndex(window.BellWorkoutGrouping13219.groupFor(data.activeWorkout,0))})")
    assert len(after2['calls'])==2 and after2['calls'][1]['seconds']==45,after2
    assert after2['activeRound']==2,after2

    page.click('.gw-complete-round'); page.wait_for_timeout(120)
    final=page.evaluate("""() => ({
      calls:window.restCalls,
      allDone:data.activeWorkout.exercises.every(ex=>ex.sets.every(s=>s.done)),
      feedback:Boolean(document.querySelector('.gw-feel-reveal')),
      completeButtons:document.querySelectorAll('.gw-complete-round').length
    })""")
    print('final',final)
    assert final['allDone'],final
    assert len(final['calls'])==2,final  # no rest after final round
    assert final['feedback'] and final['completeButtons']==0,final
    page.screenshot(path=str(ROOT/'VALIDATION_13_21_9_DESKTOP.png'),full_page=True)

    # Reset fixture for mobile layout validation.
    page.evaluate("sample=>{window.restCalls=[];data.activeWorkout=JSON.parse(JSON.stringify(sample));renderActiveWorkout();}",SAMPLE)
    page.set_viewport_size({'width':390,'height':844}); page.wait_for_timeout(180)
    mobile=page.evaluate("""() => {
      const modal=document.querySelector('#workoutModal .modal-box');
      const rows=[...document.querySelectorAll('.gw-paired-round-row:not(.is-triset)')];
      return {
        modalOverflow:modal.scrollWidth-modal.clientWidth,
        rowOverflow:rows.map(r=>r.scrollWidth-r.clientWidth),
        actionButtons:document.querySelectorAll('.gw-complete-round').length,
        sequence:rows.map(r=>[...r.querySelectorAll('.gw-paired-set-id')].map(x=>x.textContent.trim()))
      };
    }""")
    print('mobile',mobile)
    assert mobile['modalOverflow']<=16 and max(mobile['rowOverflow'])<=1,mobile
    assert mobile['actionButtons']==1,mobile
    assert mobile['sequence']==[['A1','B1'],['A2','B2'],['A3','B3']],mobile
    page.screenshot(path=str(ROOT/'VALIDATION_13_21_9_MOBILE.png'),full_page=True)
    browser.close()
print('PASS: supersets use one shared round-completion action and start the programmed rest timer only after the full round.')
