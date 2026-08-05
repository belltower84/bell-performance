from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parent.parent
CSS_FILES=[
 'css/app.css','css/guided-workout-13193.css','css/guided-workout-13203.css',
 'css/guided-workout-13216.css','css/guided-workout-13205.css','css/guided-workout-13206.css','css/guided-workout-13212.css','css/guided-workout-cleanup-13216.css'
]
CSS='\n'.join((ROOT/f).read_text() for f in CSS_FILES)
JS=(ROOT/'js/guided-workout-13216.js').read_text()+'\n'+(ROOT/'js/guided-workout-13212.js').read_text()
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
    page.wait_for_timeout(500)
    result=page.evaluate("""() => {
      const group=document.querySelector('.gw-exercise-group.is-superset');
      const cards=[...document.querySelectorAll('.gw-exercise-group.is-superset .gw-group-exercise')];
      const modal=document.querySelector('#workoutModal .modal-box');
      const rows=[...document.querySelectorAll('.gw-exercise-group.is-superset .gw-log-row')];
      const tools=[...document.querySelectorAll('.gw-tool-button')];
      const first=cards[0]?.getBoundingClientRect(); const second=cards[1]?.getBoundingClientRect(); const mr=modal.getBoundingClientRect();
      return {columns:getComputedStyle(group).gridTemplateColumns,cardCount:cards.length,stacked:Math.abs(first.left-second.left)<2&&second.top>=first.bottom+8,
      cardOverflow:cards.map(x=>x.scrollWidth-x.clientWidth),rowOverflow:rows.map(x=>Math.ceil(x.getBoundingClientRect().right-mr.right)),visibleOverflow:cards.map(card=>Math.max(0,...[...card.querySelectorAll('.gw-log-row > *')].map(x=>Math.ceil(x.getBoundingClientRect().right-card.getBoundingClientRect().right)))),toolCount:tools.length,
      toolsHaveSvg:tools.every(x=>!!x.querySelector('svg')),toolText:tools.map(x=>x.textContent.trim()),forbiddenGlyphs:tools.some(x=>/[▣⇄]/.test(x.textContent)),
      hasAutoNotice:!!document.querySelector('.gw-change-notice.is-equipment'),hasSummary:!!document.querySelector('details.gw-adjustment-summary'),
      bodyText:document.querySelector('#activeExercises').innerText,modalOverflow:modal.scrollWidth-modal.clientWidth};
    }""")
    print(result)
    assert result['cardCount']==2 and result['stacked'],result
    assert max(result['rowOverflow'])<=1 and max(result['visibleOverflow'])<=1 and result['modalOverflow']<=16,result
    assert result['toolsHaveSvg'] and result['toolCount']==4 and not result['forbiddenGlyphs'],result
    assert result['toolText']==['Guide','Replace','Guide','Replace'],result
    assert 'Superset with triceps.' not in result['bodyText'],result
    assert 'Substituted for Rope Pressdown' not in result['bodyText'],result
    assert 'Full lockout without shoulder movement.' in result['bodyText'],result
    assert result['hasAutoNotice'] and result['hasSummary'],result
    page.screenshot(path=str(ROOT/'VALIDATION_13_21_6_DESKTOP.png'))
    page.set_viewport_size({'width':390,'height':844}); page.wait_for_timeout(200)
    mobile=page.evaluate("""() => {const modal=document.querySelector('#workoutModal .modal-box');const cards=[...document.querySelectorAll('.gw-group-exercise')];const tools=[...document.querySelectorAll('.gw-tool-button')];return{overflow:modal.scrollWidth-modal.clientWidth,cardOverflow:cards.map(x=>x.scrollWidth-x.clientWidth),visibleOverflow:cards.map(card=>Math.max(0,...[...card.querySelectorAll('.gw-log-row > *')].map(x=>Math.ceil(x.getBoundingClientRect().right-card.getBoundingClientRect().right)))),toolWidths:tools.map(x=>x.getBoundingClientRect().width)}}""")
    print('mobile',mobile)
    assert mobile['overflow']<=16 and max(mobile['visibleOverflow'])<=1,mobile
    assert all(34<=w<=42 for w in mobile['toolWidths']),mobile
    page.screenshot(path=str(ROOT/'VALIDATION_13_21_6_MOBILE.png'))
    browser.close()
print('PASS: cleanup fixture renders stacked full-width supersets, reliable SVG tools, clean cues, and visible equipment swaps without horizontal clipping.')
