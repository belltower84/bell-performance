from pathlib import Path
from playwright.sync_api import sync_playwright

root=Path(__file__).resolve().parent.parent
source=(root/'js/workouts.js').read_text()
block=source[source.index('function warmupSetsFor(exercise) {'):source.index('\nfunction beginRestTimer', source.index('function warmupSetsFor(exercise) {'))]
preview=source[source.index('function previewActiveWorkout()'):source.index('\nfunction beginWorkoutFlow()', source.index('function previewActiveWorkout()'))]

html='''<!doctype html><html><body>
<div id="workoutPreviewModal" class="modal hidden" aria-hidden="true"><div class="modal-box"><h2 id="workoutPreviewTitle"></h2><p id="workoutPreviewMeta"></p><div id="workoutPreviewContent"></div><button id="previewBeginButton"></button></div></div>
<div id="warmupPanel" class="hidden"></div>
</body></html>'''
stubs='''
const data={settings:{cardioType:'Running'},activeWorkout:{name:'S-2 Lower Strength',label:'S-2 Lower Strength',duration:90,readiness:{status:'GREEN'},exercises:[{name:'Back Squat',block:'Primary Strength',recommendedWeight:305,prescription:'4 × 5',plannedReps:'5',sets:[{set:1,plannedWeight:305,weight:305,reps:'5',done:false},{set:2,plannedWeight:305,weight:305,reps:'5',done:false},{set:3,plannedWeight:305,weight:305,reps:'5',done:false},{set:4,plannedWeight:305,weight:305,reps:'5',done:false}]},{name:'Romanian Deadlift',block:'Athletic Assistance',recommendedWeight:200,prescription:'3 × 6–8',plannedReps:'6–8',sets:[{set:1,plannedWeight:200,weight:200,reps:'6–8',done:false},{set:2,plannedWeight:200,weight:200,reps:'6–8',done:false},{set:3,plannedWeight:200,weight:200,reps:'6–8',done:false}]}]}};
function readinessStatus(){return 'GREEN'}
function roundTo5(v){return Math.round(v/5)*5}
function saveData(){}
function escapeHtml(v){return String(v).replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]))}
function setText(id,v){const el=document.getElementById(id);if(el)el.textContent=v}
function bellWorkoutDisplayLabel(w){return w.label||w.name}
'''

with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    page=browser.new_page(viewport={'width':900,'height':900})
    page.set_content(html)
    page.add_script_tag(content=stubs+'\n'+block+'\n'+preview)

    page.evaluate("openWorkoutPreview(data.activeWorkout,()=>{})")
    assert 'hidden' not in (page.locator('#workoutPreviewModal').get_attribute('class') or '')
    preview_text=page.locator('#workoutPreviewContent').inner_text()
    assert 'Warm-Up' in preview_text and 'Back Squat' in preview_text and 'Romanian Deadlift' in preview_text
    assert page.locator('#workoutPreviewContent article').count() >= 7

    page.evaluate('renderWarmupPanel()')
    warm_text=page.locator('#warmupPanel').inner_text()
    assert 'Workout Warm-Up' in warm_text and 'Back Squat · Ramp 1' in warm_text
    count=page.locator('.bp-warmup-item').count()
    assert count >= 6
    begin=page.locator('.bp-warmup-actions .good')
    assert begin.is_disabled()
    for _ in range(count):
        page.locator('.bp-warmup-item:not(.is-done):not(.is-skipped) .bp-warmup-state').first.click()
    assert not page.locator('.bp-warmup-actions .good').is_disabled()
    assert page.locator('.bp-warmup-item.is-done').count()==count
    print(f'PASS: preview rendered with real warm-up and exercise data; warm-up rendered {count} persistent items and gated working sets.')
    browser.close()
