from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parent.parent
CSS_FILES=[
 'css/app.css','css/guided-workout-13193.css','css/guided-workout-13203.css',
 'css/guided-workout-13216.css','css/guided-workout-13205.css','css/guided-workout-13206.css',
 'css/guided-workout-13212.css','css/guided-workout-cleanup-13216.css',
 'css/guided-workout-paired-rounds-13218.css'
]
CSS='\n'.join((ROOT/f).read_text() for f in CSS_FILES)
JS=(ROOT/'js/guided-workout-13218.js').read_text()+'\n'+(ROOT/'js/guided-workout-13212.js').read_text()
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
    {'name':'Band Pressdown','block':'Accessory','prescription':'3 × 12–15','plannedReps':'12–15','cue':'Substituted for Rope Pressdown at Home Gym. Full lockout without shoulder movement.','rest':45,'supersetId':'test-superset','supersetType':'superset','supersetPosition':'B','supersetInstruction':'Alternate A1 and B1. Complete both exercises, then rest 45 seconds.','equipmentAdjusted':True,'equipmentAdjustmentReason':'Cable station unavailable at Home Gym.','originalExercise':'Rope Pressdown','sets':[{'set':1,'reps':'12–15','weight':'','rpe':'','done':False},{'set':2,'reps':'12–15','weight':'','rpe':'','done':False},{'set':3,'reps':'12–15','weight':'','rpe':'','done':False}]}
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
      const group=document.querySelector('.gw-paired-group');
      const summariesWrap=document.querySelector('.gw-paired-summaries');
      const pairedLog=document.querySelector('.gw-paired-log');
      const notice=document.querySelector('.gw-paired-adjustments .gw-change-notice');
      const summaries=[...document.querySelectorAll('.gw-paired-summary')];
      const nested=[...document.querySelectorAll('.gw-paired-summary .gw-change-notice')];
      const rounds=[...document.querySelectorAll('.gw-paired-round-row:not(.is-triset)')];
      const cells=rounds.map(r=>[...r.querySelectorAll('.gw-paired-set-cell')]);
      const gb=group.getBoundingClientRect(), sb=summariesWrap.getBoundingClientRect(), lb=pairedLog.getBoundingClientRect(), nb=notice.getBoundingClientRect();
      const paired=cells.map(pair=>({count:pair.length,topDelta:Math.abs(pair[0].getBoundingClientRect().top-pair[1].getBoundingClientRect().top),heightDelta:Math.abs(pair[0].getBoundingClientRect().height-pair[1].getBoundingClientRect().height)}));
      return {
        noticeCount:document.querySelectorAll('.gw-paired-adjustments .gw-change-notice').length,
        nestedCount:nested.length,
        noticeLeftDelta:Math.abs(nb.left-sb.left),
        noticeRightDelta:Math.abs(nb.right-sb.right),
        logLeftDelta:Math.abs(nb.left-lb.left),
        logRightDelta:Math.abs(nb.right-lb.right),
        summaryTopDelta:Math.abs(summaries[0].getBoundingClientRect().top-summaries[1].getBoundingClientRect().top),
        summaryHeightDelta:Math.abs(summaries[0].getBoundingClientRect().height-summaries[1].getBoundingClientRect().height),
        paired,
        text:document.querySelector('#activeExercises').innerText,
        modalOverflow:document.querySelector('#workoutModal .modal-box').scrollWidth-document.querySelector('#workoutModal .modal-box').clientWidth
      };
    }""")
    print(result)
    assert result['noticeCount']==1,result
    assert result['nestedCount']==0,result
    assert result['noticeLeftDelta']<=1 and result['noticeRightDelta']<=1,result
    assert result['logLeftDelta']<=1 and result['logRightDelta']<=1,result
    assert result['summaryTopDelta']<=1,result
    assert result['summaryHeightDelta']<=1,result
    assert all(x['count']==2 and x['topDelta']<=1 and x['heightDelta']<=1 for x in result['paired']),result
    assert 'EQUIPMENT ADJUSTMENT' in result['text'],result
    assert 'Rope Pressdown' in result['text'] and 'Band Pressdown' in result['text'],result
    assert 'Cable station unavailable at Home Gym.' in result['text'],result
    assert 'Primary: Triceps' in result['text'],result
    assert 'Superset with triceps.' not in result['text'],result
    assert result['modalOverflow']<=16,result
    page.screenshot(path=str(ROOT/'VALIDATION_13_21_8_DESKTOP.png'),full_page=True)

    page.set_viewport_size({'width':390,'height':844}); page.wait_for_timeout(200)
    mobile=page.evaluate("""() => {
      const group=document.querySelector('.gw-paired-group');
      const summariesWrap=document.querySelector('.gw-paired-summaries');
      const pairedLog=document.querySelector('.gw-paired-log');
      const notice=document.querySelector('.gw-paired-adjustments .gw-change-notice');
      const gb=summariesWrap.getBoundingClientRect(), nb=notice.getBoundingClientRect();
      const modal=document.querySelector('#workoutModal .modal-box');
      return {leftDelta:Math.abs(nb.left-gb.left),rightDelta:Math.abs(nb.right-gb.right),overflow:modal.scrollWidth-modal.clientWidth,noticeOverflow:notice.scrollWidth-notice.clientWidth};
    }""")
    print('mobile',mobile)
    assert mobile['leftDelta']<=1 and mobile['rightDelta']<=1,mobile
    assert mobile['overflow']<=16 and mobile['noticeOverflow']<=1,mobile
    page.screenshot(path=str(ROOT/'VALIDATION_13_21_8_MOBILE.png'),full_page=True)
    browser.close()
print('PASS: superset equipment adjustments span the complete paired-workout width without offsetting either exercise summary or paired set rows.')
