from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parent.parent
CSS='\n'.join((ROOT/f).read_text() for f in [
    'css/app.css',
    'css/guided-workout-13193.css',
    'css/guided-workout-13204.css',
    'css/guided-workout-13206.css',
    'css/guided-workout-13211.css',
])
JS=(ROOT/'js/guided-workout-13211.js').read_text()
ROWS=''.join(f'<div class="gw-log-row" id="row{i}">Set {i}</div>' for i in range(1,7))
HTML=(
    "<!doctype html><html><head><meta charset='utf-8'></head>"
    "<body class='workout-open'><div id='workoutModal' class='modal'>"
    "<div class='modal-box gw-stable-13204'><section class='gw-commercial-shell'>"
    "<div style='height:300px'>Header and exercise details</div>"
    f"<div class='gw-log-list'>{ROWS}</div>"
    "<button class='gw-add-set'>Add Set</button><div class='gw-action-spacer'></div>"
    "<footer class='gw-action-dock'><div style='height:190px'>Fixed workout actions</div></footer>"
    "</section></div></div></body></html>"
)
EXTRA="""
html,body{margin:0;height:100%;background:#070b0f}
.modal{display:block!important}
.modal-box{height:100vh!important}
.gw-log-row{height:76px}
.gw-action-dock{height:190px}
"""

with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    for width,height,zoom in [(1280,800,1),(900,650,1),(900,650,1.25)]:
        page=browser.new_page(viewport={'width':width,'height':height})
        page.set_content(HTML,wait_until='load')
        page.add_style_tag(content=CSS+'\n'+EXTRA)
        page.add_script_tag(content=JS)
        if zoom != 1:
            page.evaluate(f"document.documentElement.style.zoom='{zoom}'")
        page.wait_for_timeout(350)
        page.evaluate("document.querySelector('#workoutModal .modal-box').scrollTop=99999")
        page.wait_for_timeout(100)
        result=page.evaluate("""() => {
          const modal=document.querySelector('#workoutModal .modal-box');
          const dock=document.querySelector('.gw-action-dock');
          const row=document.querySelector('#row6');
          const spacer=document.querySelector('.gw-action-spacer');
          return {
            canScroll: modal.scrollHeight > modal.clientHeight,
            scrollTop: modal.scrollTop,
            maxScroll: modal.scrollHeight-modal.clientHeight,
            rowBottom: row.getBoundingClientRect().bottom,
            dockTop: dock.getBoundingClientRect().top,
            spacerHeight: spacer.getBoundingClientRect().height,
            dockHeight: dock.getBoundingClientRect().height,
            release: modal.dataset.dockReservationRelease
          };
        }""")
        print(width,height,zoom,result)
        assert result['canScroll'], result
        assert result['scrollTop'] >= result['maxScroll']-3, result
        assert result['rowBottom'] <= result['dockTop']-8, result
        assert result['spacerHeight'] >= result['dockHeight'], result
        assert result['release']=='13.21.1', result
        page.close()
    browser.close()
print('PASS: bottom dock reserves its live height and all set rows scroll fully above it at desktop, compact, and zoomed layouts.')
