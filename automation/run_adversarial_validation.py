from __future__ import annotations
import argparse, copy, datetime as dt, html, json, re, sys
from collections import Counter
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import run_year_simulations as sim

VERSION = "13.10.4"
RULES = {
    'PL_SPECIFICITY_MISSING': 'Powerlifting meet preparation lacks one or more canonical competition lifts.',
    'EVENT_TAPER_MISSING': 'Powerlifting or endurance event preparation lacks a defensible taper/peak phase.',
    'PHYSIQUE_FINAL_PREP_MISSING': 'Physique preparation lacks a show-specific final preparation or event week.',
    'RECOVERY_PHASE_MISSING': 'A post-event recovery phase is absent or contains no restore/recovery prescription.',
    'MUSCLE_VOLUME_EXTREME': 'A muscle exceeds the adversarial weekly hard-set ceiling of 25 sets.',
    'MOVEMENT_IMBALANCE': 'Pressing volume greatly exceeds pulling volume or pulling work is absent.',
    'ENDURANCE_HIGH_DAYS_CLUSTERED': 'Three or more true quality/rehearsal endurance sessions occur in one week.',
    'ENDURANCE_LONG_RUN_SHARE': 'The long run exceeds 50% of modeled weekly endurance duration.',
    'ENDURANCE_LOAD_SPIKE': 'Normal-development endurance duration rises by more than 40% week to week.',
    'BEGINNER_INTENSITY_EXCESSIVE': 'A beginner week averages above RPE 8.5 or includes repeated RPE 9.5+ work.',
    'BEGINNER_FOUNDATION_MISSING': 'Beginner programming omits the foundational movement sessions.'
}

ENDURANCE_ROLES = {
    'easy_run', 'quality_run', 'long_run', 'race_rehearsal', 'race_primer',
    'event_day', 'recovery_run', 'easy_aerobic', 'endurance'
}


def item_role(item):
    return str(item.get('enduranceRole') or item.get('exerciseRole') or item.get('physiqueRole') or item.get('eventRole') or '').strip().lower()


def item_text(item):
    return ' '.join(str(item.get(k) or '') for k in ('label', 'title', 'name', 'detail', 'description')).lower()


def item_name_text(item):
    # Classification must not inherit generic athlete/block metadata stored in detail/description.
    return ' '.join(str(item.get(k) or '') for k in ('label', 'title', 'name')).lower()


def is_endurance_item(item):
    role = item_role(item)
    if role in ENDURANCE_ROLES:
        return True
    name = item_name_text(item)
    # Untyped fallback requires an explicit endurance modality in the session name.
    return any(k in name for k in (
        'run', 'running', 'interval', 'tempo', 'threshold', 'race', 'aerobic',
        'jog', 'fartlek', 'strides', 'hill repeat', 'track', 'time trial'
    ))


def is_hard_endurance_item(item):
    role = item_role(item)
    if role in ('quality_run', 'race_rehearsal'):
        return True
    if role:
        return False
    name = item_name_text(item)
    # An untyped session is hard only when the session name itself is explicitly running-specific.
    has_run_context = any(k in name for k in ('run', 'running', 'race', 'track', 'fartlek', 'hill'))
    has_quality = any(k in name for k in ('threshold', 'interval', 'tempo', 'goal pace', 'race rehearsal', 'repeats'))
    return has_run_context and has_quality


def ex_rpe(ex):
    for value in (ex.get('rpe'), ex.get('reps'), ex.get('notes')):
        m = re.search(r'RPE\s*(\d+(?:\.\d+)?)', str(value or ''), re.I)
        if m:
            return float(m.group(1))
    return None


def phase_for_week(run, week_number):
    for phase in run.phases:
        if phase.get('startWeek', 0) <= week_number <= phase.get('endWeek', -1):
            return phase
    return {}


def is_event_phase(phase):
    return bool(phase.get('eventType'))


def is_transition_week(week, phase, previous_phase):
    program = str(week.get('programPhase') or '').lower()
    phase_name = str(phase.get('name') or '').lower()
    transition_terms = ('recovery', 'absorption', 'taper', 'event week', 'peak', 'post-race', 'post race')
    return (
        any(term in program for term in transition_terms)
        or any(term in phase_name for term in ('post-race', 'post race', 'recovery'))
        or (previous_phase and previous_phase.get('name') != phase.get('name'))
    )


def add_flag(flags, code, evidence):
    if not any(x['code'] == code for x in flags):
        flags.append({'code': code, 'evidence': evidence})


def validate_details(run):
    flags = []
    rid = str(run.config.get('baseId') or run.config.get('id', '')).lower()

    # Discipline-specific event preparation checks.
    event_weeks = [w for w in run.weeks if is_event_phase(phase_for_week(run, w.get('globalWeek', 0)))]
    if event_weeks and ('powerlifting' in rid or 'endurance' in rid):
        taper_weeks = [
            w for w in event_weeks
            if any(k in str(w.get('programPhase', '')).lower() for k in ('taper', 'peak'))
            or any('taper' in str(x).lower() or 'opener' in str(x).lower() for x in w.get('planLabels', []))
        ]
        if not taper_weeks:
            add_flag(flags, 'EVENT_TAPER_MISSING', 'No peak/taper program phase or taper/opener prescription was found inside event preparation.')

    if event_weeks and 'physique' in rid:
        final_prep = [
            w for w in event_weeks
            if any(k in str(w.get('programPhase', '')).lower() for k in ('event week', 'competition preparation', 'specific development'))
            or any(k in ' '.join(w.get('planLabels', [])).lower() for k in ('show week', 'peak week', 'contest prep', 'physique'))
        ]
        if not final_prep:
            add_flag(flags, 'PHYSIQUE_FINAL_PREP_MISSING', 'No show-specific final preparation or event-week prescription was found.')

    # Recovery phase check.
    recovery_phases = [p for p in run.phases if any(x in p.get('name', '').lower() for x in ('post-', 'recovery'))]
    for p in recovery_phases:
        phase_weeks = [w for w in run.weeks if p['startWeek'] <= w['globalWeek'] <= p['endWeek']]
        evidence_text = ' '.join(
            ' '.join(w.get('planLabels', [])) + ' ' + ' '.join(w.get('planDetails', []))
            for w in phase_weeks
        ).lower()
        if not any(k in evidence_text for k in ('recovery', 'restore', 'easy return', 'walk', 're-entry')):
            add_flag(flags, 'RECOVERY_PHASE_MISSING', f"{p.get('name')}: no restore/recovery/easy-return prescription found.")
            break

    # Powerlifting specificity must be found in actual event-plan items, not cached summary roles.
    if 'powerlifting' in rid:
        found = set()
        aliases = {
            'competition_squat': ('competition_squat', 'competition squat'),
            'competition_bench': ('competition_bench', 'competition bench'),
            'competition_deadlift': ('competition_deadlift', 'competition deadlift'),
        }
        for w in event_weeks:
            for item in w.get('plan', []):
                blob = f"{item_role(item)} {item_text(item)}"
                for canonical, terms in aliases.items():
                    if any(term in blob for term in terms):
                        found.add(canonical)
        missing = sorted(set(aliases) - found)
        if missing:
            add_flag(flags, 'PL_SPECIFICITY_MISSING', f"Missing canonical event-plan roles: {', '.join(missing)}. Found: {', '.join(sorted(found)) or 'none'}.")

    # Physique dose and movement balance.
    if 'physique' in rid:
        for w in run.weeks:
            muscle = Counter()
            for item in w.get('plan', []):
                for ex in item.get('exercises', []):
                    sets = float(ex.get('sets') or 0)
                    for muscle_name in [str(x).lower() for x in (ex.get('primary') or [])]:
                        muscle[muscle_name] += sets
            if muscle and max(muscle.values()) > 25:
                name, sets = muscle.most_common(1)[0]
                add_flag(flags, 'MUSCLE_VOLUME_EXTREME', f"Week {w.get('globalWeek')}: {name} received {sets:g} modeled hard sets.")
                break

        totals = Counter()
        for w in run.weeks:
            for item in w.get('plan', []):
                for ex in item.get('exercises', []):
                    sets = float(ex.get('sets') or 0)
                    blob = (str(ex.get('pattern') or '') + ' ' + str(ex.get('name') or ex.get('exercise') or '')).lower()
                    if any(k in blob for k in ('press', 'push', 'chest')):
                        totals['press'] += sets
                    if any(k in blob for k in ('pull', 'row', 'back', 'lat')):
                        totals['pull'] += sets
        if totals['press'] > 0 and (totals['pull'] == 0 or totals['press'] / max(1, totals['pull']) > 2.5):
            ratio = 'undefined' if totals['pull'] == 0 else f"{totals['press'] / totals['pull']:.2f}:1"
            add_flag(flags, 'MOVEMENT_IMBALANCE', f"Modeled press sets={totals['press']:g}, pull sets={totals['pull']:g}, ratio={ratio}.")

    # Endurance checks use only endurance sessions and are context aware.
    if 'endurance' in rid:
        summaries = []
        for w in run.weeks:
            endurance_items = []
            for item in w.get('plan', []):
                if is_endurance_item(item):
                    endurance_items.append(item)

            total = 0.0
            long_duration = 0.0
            hard_items = []
            for item in endurance_items:
                role = item_role(item)
                name_text = item_name_text(item)
                duration = float(item.get('duration') or 0)
                total += duration
                # True hard days are determined by canonical role or an explicitly running-specific name.
                if is_hard_endurance_item(item):
                    hard_items.append(item)
                if role in ('long_run', 'race_rehearsal') or 'long run' in name_text:
                    long_duration += duration

            hard_cluster = len(hard_items) >= 3
            long_share = (long_duration / total) if total > 0 else 0.0
            if hard_cluster:
                detail = '; '.join(f"{item_text(i)[:70] or item_role(i)} ({item_role(i) or 'untyped'})" for i in hard_items)
                add_flag(flags, 'ENDURANCE_HIGH_DAYS_CLUSTERED', f"Week {w.get('globalWeek')}: {len(hard_items)} quality/rehearsal sessions — {detail}.")
            if total > 0 and long_share > 0.50:
                add_flag(flags, 'ENDURANCE_LONG_RUN_SHARE', f"Week {w.get('globalWeek')}: long/rehearsal duration {long_duration:g} of {total:g} minutes ({long_share:.0%}).")

            phase = phase_for_week(run, w.get('globalWeek', 0))
            summaries.append({
                'week': w,
                'phase': phase,
                'total': total,
                'hard_cluster': hard_cluster,
                'long_share': long_share,
            })

        for prev, curr in zip(summaries, summaries[1:]):
            a, b = prev['total'], curr['total']
            previous_phase = prev['phase']
            current_phase = curr['phase']
            # Compare normal development weeks only. Do not punish expected transitions after recovery,
            # taper/event weeks, or the first week of a new block. Also avoid duplicate warnings where
            # the same injected fault is already better described as a hard-day cluster or oversized long run.
            transition = is_transition_week(prev['week'], previous_phase, None) or is_transition_week(curr['week'], current_phase, previous_phase)
            dominant_fault = curr['hard_cluster'] or curr['long_share'] > 0.50
            if not transition and not dominant_fault and a > 0 and (b - a) / a > 0.40:
                increase = (b - a) / a
                add_flag(
                    flags,
                    'ENDURANCE_LOAD_SPIKE',
                    f"Week {prev['week'].get('globalWeek')} to {curr['week'].get('globalWeek')}: modeled endurance duration rose from {a:g} to {b:g} minutes ({increase:.0%}) within {current_phase.get('name') or curr['week'].get('programPhase') or 'normal development'}.",
                )
                break

    # Beginner checks.
    if 'beginner' in rid:
        text = ' '.join(
            ' '.join(w.get('planLabels', [])) + ' ' + ' '.join(item_text(item) for item in w.get('plan', []))
            for w in run.weeks
        ).lower()
        if not ('foundation a' in text and 'foundation b' in text):
            add_flag(flags, 'BEGINNER_FOUNDATION_MISSING', 'Foundation A and/or Foundation B was absent from the generated beginner journey.')
        for w in run.weeks:
            vals = []
            for item in w.get('plan', []):
                for ex in item.get('exercises', []):
                    rpe = ex_rpe(ex)
                    if rpe is not None:
                        vals.append(rpe)
            if vals and (sum(vals) / len(vals) > 8.5 or sum(v >= 9.5 for v in vals) >= 3):
                add_flag(flags, 'BEGINNER_INTENSITY_EXCESSIVE', f"Week {w.get('globalWeek')}: mean RPE {sum(vals)/len(vals):.1f}; {sum(v >= 9.5 for v in vals)} exercises at RPE 9.5+.")
                break

    return sorted(flags, key=lambda x: x['code'])


def validate(run):
    return [x['code'] for x in validate_details(run)]


def all_items(run):
    return [item for w in run.weeks for item in w.get('plan', [])]


def mutate(run, case):
    r = copy.deepcopy(run)
    if case == 'pl_no_specificity':
        for w in r.weeks:
            w['planRoles'] = [x for x in w.get('planRoles', []) if 'competition_' not in str(x)]
            for item in w.get('plan', []):
                for k in ('exerciseRole', 'eventRole'):
                    item[k] = 'general_strength'
                for k in ('label', 'title', 'name', 'detail', 'description'):
                    if k in item:
                        item[k] = re.sub(r'competition|meet prep|meet peak|meet taper', 'general', str(item[k]), flags=re.I)
    elif case == 'no_taper':
        for w in r.weeks:
            if any(k in str(w.get('programPhase', '')).lower() for k in ('taper', 'peak')):
                w['programPhase'] = 'Specific Development'
            w['planLabels'] = [re.sub(r'taper|peak|opener', 'specific', str(x), flags=re.I) for x in w.get('planLabels', [])]
    elif case == 'no_recovery':
        for p in r.phases:
            if any(k in p.get('name', '').lower() for k in ('post-', 'recovery')):
                for w in r.weeks:
                    if p['startWeek'] <= w['globalWeek'] <= p['endWeek']:
                        w['planLabels'] = ['Heavy Development Session'] * max(1, len(w.get('planLabels', [])))
                        w['planDetails'] = ['High stress loading'] * max(1, len(w.get('planDetails', [])))
    elif case == 'physique_30_chest_sets':
        w = r.weeks[4]
        item = w['plan'][0]
        item['exercises'] = [{'name': 'Barbell Bench Press', 'sets': 30, 'reps': '8 @ RPE 9', 'pattern': 'Horizontal Press', 'primary': ['Chest'], 'secondary': ['Triceps']}]
    elif case == 'physique_no_pull':
        for item in all_items(r):
            item['exercises'] = [ex for ex in item.get('exercises', []) if not any(k in (str(ex.get('pattern') or '') + ' ' + str(ex.get('name') or ex.get('exercise') or '')).lower() for k in ('pull', 'row', 'back', 'lat'))]
    elif case == 'endurance_three_hard_days':
        w = r.weeks[10]
        for item in w.get('plan', [])[:3]:
            item['enduranceRole'] = 'quality_run'
            item['label'] = 'Threshold Intervals'
            item['duration'] = 60
    elif case == 'endurance_long_run_60pct':
        w = r.weeks[12]
        plans = w.get('plan', [])
        for item in plans:
            item['duration'] = 20
        if plans:
            plans[-1]['enduranceRole'] = 'long_run'
            plans[-1]['label'] = 'Long Run'
            plans[-1]['duration'] = 100
    elif case == 'endurance_50pct_spike':
        # Inject the spike into two adjacent, ordinary weeks in the same journey phase so the
        # detector is tested directly rather than being legitimately suppressed by transition logic.
        pair = None
        for wa, wb in zip(r.weeks, r.weeks[1:]):
            pa = phase_for_week(r, wa.get('globalWeek', 0))
            pb = phase_for_week(r, wb.get('globalWeek', 0))
            if pa.get('name') != pb.get('name'):
                continue
            if is_transition_week(wa, pa, None) or is_transition_week(wb, pb, pa):
                continue
            ea = [i for i in wa.get('plan', []) if is_endurance_item(i)]
            eb = [i for i in wb.get('plan', []) if is_endurance_item(i)]
            if ea and eb:
                pair = (ea, eb)
                break
        if pair:
            a, b = pair
            for item in a:
                item['duration'] = 30
            for item in b:
                item['duration'] = 60
    elif case == 'beginner_max_effort':
        w = r.weeks[2]
        for item in w.get('plan', []):
            for ex in item.get('exercises', []):
                ex['reps'] = '3 @ RPE 10'
    elif case == 'beginner_no_foundation':
        for w in r.weeks:
            w['planLabels'] = [re.sub(r'Foundation [ABC][^<]*', 'Generic Workout', str(x), flags=re.I) for x in w.get('planLabels', [])]
            for item in w.get('plan', []):
                for k in ('label', 'title', 'name'):
                    if k in item:
                        item[k] = re.sub(r'Foundation [ABC].*', 'Generic Workout', str(item[k]), flags=re.I)
    return r


CASES = [
    ('Clean powerlifting control', 'powerlifting', None, []),
    ('Powerlifting specificity removed', 'powerlifting', 'pl_no_specificity', ['PL_SPECIFICITY_MISSING']),
    ('Powerlifting taper removed', 'powerlifting', 'no_taper', ['EVENT_TAPER_MISSING']),
    ('Powerlifting recovery corrupted', 'powerlifting', 'no_recovery', ['RECOVERY_PHASE_MISSING']),
    ('Clean physique control', 'physique', None, []),
    ('Physique 30-set chest week', 'physique', 'physique_30_chest_sets', ['MUSCLE_VOLUME_EXTREME']),
    ('Physique pulling removed', 'physique', 'physique_no_pull', ['MOVEMENT_IMBALANCE']),
    ('Clean endurance control', 'endurance', None, []),
    ('Endurance three hard days', 'endurance', 'endurance_three_hard_days', ['ENDURANCE_HIGH_DAYS_CLUSTERED']),
    ('Endurance oversized long run', 'endurance', 'endurance_long_run_60pct', ['ENDURANCE_LONG_RUN_SHARE']),
    ('Endurance 100% load spike', 'endurance', 'endurance_50pct_spike', ['ENDURANCE_LOAD_SPIKE']),
    ('Clean beginner control', 'beginner', None, []),
    ('Beginner repeated maximal work', 'beginner', 'beginner_max_effort', ['BEGINNER_INTENSITY_EXCESSIVE']),
    ('Beginner foundation removed', 'beginner', 'beginner_no_foundation', ['BEGINNER_FOUNDATION_MISSING'])
]


def write_report(results, out):
    rows = []
    diagnostics = []
    for x in results:
        cls = 'pass' if x['passed'] else 'fail'
        rows.append(
            f"<tr class='{cls}'><td>{'PASS' if x['passed'] else 'FAIL'}</td>"
            f"<td>{html.escape(x['name'])}</td>"
            f"<td>{html.escape(', '.join(x['expected']) or 'No warnings')}</td>"
            f"<td>{html.escape(', '.join(x['detected']) or 'No warnings')}</td>"
            f"<td>{html.escape(', '.join(x['missing']) or 'None')}</td>"
            f"<td>{html.escape(', '.join(x['unexpected']) or 'None')}</td></tr>"
        )
        if x['details']:
            items = ''.join(f"<li><b>{html.escape(d['code'])}</b> — {html.escape(d['evidence'])}</li>" for d in x['details'])
            diagnostics.append(f"<article><h3>{html.escape(x['name'])}</h3><ul>{items}</ul></article>")

    passed = sum(x['passed'] for x in results)
    total = len(results)
    rules = ''.join(f'<li><b>{k}</b> — {html.escape(v)}</li>' for k, v in RULES.items())
    doc = f'''<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Bell {VERSION} Detector Calibration</title><style>body{{font-family:Segoe UI,Arial;background:#090b0f;color:#f5f5f3;margin:0}}main{{max-width:1450px;margin:auto;padding:28px}}header,section,article{{background:#12161d;border:1px solid #303641;border-radius:18px;padding:22px;margin-bottom:18px}}h1{{font-size:clamp(2rem,5vw,4rem)}}p,li{{color:#b6bdc8;line-height:1.55}}table{{width:100%;border-collapse:collapse;min-width:1150px}}th,td{{padding:10px;border-bottom:1px solid #303641;text-align:left;vertical-align:top}}th{{color:#e0ae32}}.wrap{{overflow:auto}}.pass td:first-child{{color:#64d69a;font-weight:900}}.fail td:first-child{{color:#ff7777;font-weight:900}}.metric{{font-size:2rem;font-weight:900}}article h3{{margin-top:0}}</style></head><body><main><header><h1>Detector Calibration & Diagnostic Evidence</h1><p>Known-good controls and deliberately corrupted programs verify that each scientific detector rejects the intended fault without contaminating the result with unrelated false alarms.</p><div class="metric">{passed}/{total} cases passed</div></header><section><h2>Mutation results</h2><div class="wrap"><table><thead><tr><th>Result</th><th>Case</th><th>Expected detection</th><th>Detected</th><th>Missed</th><th>Unexpected</th></tr></thead><tbody>{''.join(rows)}</tbody></table></div></section><section><h2>Diagnostic evidence</h2>{''.join(diagnostics) or '<p>No warnings were produced.</p>'}</section><section><h2>Scientific guardrails under test</h2><ul>{rules}</ul></section><section><h2>Interpretation</h2><p>A passing report demonstrates sensitivity against these specific known faults and specificity in the clean controls. Endurance detectors are phase-aware, distinguish true quality work from event primers and ordinary long runs, and suppress duplicate warnings when one injected fault already explains the abnormal week.</p></section></main></body></html>'''
    out.mkdir(parents=True, exist_ok=True)
    (out / 'index.html').write_text(doc, encoding='utf-8')
    (out / 'results.json').write_text(json.dumps({
        'version': VERSION,
        'generatedAt': dt.datetime.now().isoformat(),
        'passed': passed,
        'total': total,
        'results': results,
        'rules': RULES,
    }, indent=2), encoding='utf-8')


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--app-root', required=True, type=Path)
    ap.add_argument('--journeys', required=True, type=Path)
    ap.add_argument('--headed', action='store_true')
    a = ap.parse_args()

    base = json.loads(a.journeys.read_text())
    selected = {}
    for x in base:
        key = 'powerlifting' if 'powerlifting' in x['id'] else 'physique' if 'physique' in x['id'] else 'endurance' if 'endurance' in x['id'] else 'beginner'
        cfg = copy.deepcopy(x)
        cfg['baseId'] = x['id']
        cfg['id'] = x['id'] + '-adversarial-control'
        cfg['adherence'] = .90
        cfg['targetCompliance'] = .90
        selected[key] = cfg

    root = a.app_root.resolve()
    report_root = root / 'automation' / 'adversarial_reports'
    out = report_root / dt.datetime.now().strftime('%Y%m%d-%H%M%S')
    controls = {}
    with sim.local_server(root) as url:
        with sim.sync_playwright() as p:
            kwargs = {'headless': not a.headed}
            exe = sim.find_browser_executable()
            if exe:
                kwargs['executable_path'] = exe
            browser = p.chromium.launch(**kwargs)
            try:
                for i, (key, cfg) in enumerate(selected.items(), 1):
                    print(f'[{i}/4] Building clean {key} control')
                    controls[key] = sim.simulate_journey(browser, url, cfg, out / 'controls')
            finally:
                browser.close()

    results = []
    for name, key, mutation, expected in CASES:
        candidate = controls[key] if mutation is None else mutate(controls[key], mutation)
        details = validate_details(candidate)
        detected = [d['code'] for d in details]
        missing = sorted(set(expected) - set(detected))
        unexpected = sorted(set(detected) - set(expected))
        passed = not missing and not unexpected
        results.append({
            'name': name,
            'discipline': key,
            'mutation': mutation,
            'expected': expected,
            'detected': detected,
            'details': details,
            'missing': missing,
            'unexpected': unexpected,
            'passed': passed,
        })

    write_report(results, out)
    sim.copy_latest(out, report_root / 'latest')
    print(f"Detector calibration complete: {sum(x['passed'] for x in results)}/{len(results)}. Report: {report_root/'latest'/'index.html'}")
    return 0 if all(x['passed'] for x in results) else 1


if __name__ == '__main__':
    raise SystemExit(main())
