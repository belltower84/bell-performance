def test_full_authenticated_lifecycle(client,auth):
    headers,_=auth(); athlete=client.post('/api/v1/athletes',headers=headers,json={'name':'Chris','profile':{'age':41,'experience':'intermediate'}}); assert athlete.status_code==201; aid=athlete.json()['id']
    mission=client.post(f'/api/v1/athletes/{aid}/missions',headers=headers,json={'goal':'Run a faster 10K while preserving strength','timeline_weeks':12,'constraints':{'training_days':4,'session_minutes':60}}); assert mission.status_code==201
    plan=client.post(f'/api/v1/athletes/{aid}/plans',headers=headers); assert plan.status_code==201 and plan.json()['weeks']==12
    today=client.get(f'/api/v1/athletes/{aid}/today',headers=headers); sid=today.json()['session']['session']['session_id']
    ci=client.post(f'/api/v1/athletes/{aid}/check-ins',headers=headers,json={'sleep_hours':4,'sleep_quality':3,'stress':8,'motivation':5,'pain':{'low back':6},'soreness':{'low back':7},'available_minutes':45}); assert ci.status_code==201
    adapted=client.get(f'/api/v1/athletes/{aid}/today',headers=headers); assert adapted.json()['adaptation'] is not None
    decision_id=adapted.json()['adaptation']['decision_id']; assert client.get(f'/api/v1/decisions/{decision_id}',headers=headers).status_code==200
    done=client.post(f'/api/v1/athletes/{aid}/sessions/{sid}/complete',headers={**headers,'Idempotency-Key':'complete-001'},json={'duration_minutes':42,'session_rpe':7,'performance_ratio':0.98}); assert done.status_code==201
    replay=client.post(f'/api/v1/athletes/{aid}/sessions/{sid}/complete',headers={**headers,'Idempotency-Key':'complete-001'},json={'duration_minutes':42,'session_rpe':7,'performance_ratio':0.98}); assert replay.status_code==201 and replay.json()['id']==done.json()['id']
    state=client.get(f'/api/v1/athletes/{aid}/state',headers=headers); assert state.json()['compliance']['completed']==1

def test_ownership_is_enforced(client,auth):
    h1,_=auth('one@example.com'); aid=client.post('/api/v1/athletes',headers=h1,json={'name':'Private Athlete'}).json()['id']
    h2,_=auth('two@example.com')
    assert client.get(f'/api/v1/athletes/{aid}/state',headers=h2).status_code==403

def test_auth_and_operations(client):
    assert client.get('/health').json()['version']=='0.3.0'; assert client.get('/ready').status_code==200
    assert client.post('/api/v1/athletes',json={'name':'No Auth'}).status_code==401

def test_validation_error_shape(client,auth):
    h,_=auth(); r=client.post('/api/v1/athletes',headers=h,json={'name':''}); assert r.status_code==422; assert r.json()['error']['code']=='validation_error'

def test_full_intelligence_stack_is_live(client, auth):
    headers, _ = auth('engines@example.com')
    athlete = client.post('/api/v1/athletes', headers=headers, json={
        'name': 'Engine Test Athlete',
        'profile': {
            'age': 41,
            'weight_lb': 205,
            'training_experience': 'Intermediate',
            'equipment': ['Barbell', 'Power Rack', 'Dumbbell', 'Adjustable Bench', 'Pull-Up Bar', 'Resistance Band'],
        },
    })
    aid = athlete.json()['id']
    bcl = '''MISSION Faster10K
PRIORITY aerobic_base > strength
CONSTRAINT
training_days = 4
session_minutes = 60
RULE
IF Readiness < 55
THEN reduce_volume
IF Pain >= 7
THEN stop_or_swap'''
    mission = client.post(f'/api/v1/athletes/{aid}/missions', headers=headers, json={
        'goal': 'Run a faster 10K while maintaining strength',
        'timeline_weeks': 4,
        'competition_date': '2026-10-10',
        'competition_type': '10k',
        'constraints': {'training_days': 4, 'session_minutes': 60},
        'coaching_language': bcl,
    })
    assert mission.status_code == 201
    plan_create = client.post(f'/api/v1/athletes/{aid}/plans', headers=headers)
    assert plan_create.status_code == 201
    assert plan_create.json()['selected_strategy'] is not None
    assert plan_create.json()['competition']['event_type'] == '10k'

    plan = client.get(f'/api/v1/athletes/{aid}/plan', headers=headers).json()
    manifest = plan['engine_manifest']
    for engine in (
        'mission_compiler', 'periodization', 'block_programming', 'performance_forecast',
        'goal_probability', 'competition_intelligence', 'nutrition_periodization',
        'pattern_recognition', 'digital_twin', 'weekly_planner', 'session_builder',
        'exercise_selection', 'athlete_state', 'coaching_language',
    ):
        assert engine in manifest
    assert plan['simulation']['selected'] is not None
    assert plan['nutrition']['blocks']
    assert plan['coaching_language']['program']['mission'] == 'Faster10K'

    strength_sessions = [
        session
        for week in plan['weeks']
        for session in week['sessions']
        if session.get('session_type') != 'engine'
    ]
    assert strength_sessions
    assert strength_sessions[0]['exercise_blocks']
    assert strength_sessions[0]['selection_trace']['selected_exercises']
    assert strength_sessions[0]['validation']['bell_score'] > 0

    checkin = client.post(f'/api/v1/athletes/{aid}/check-ins', headers=headers, json={
        'sleep_hours': 4.2, 'sleep_quality': 3, 'stress': 8, 'motivation': 5,
        'pain': {'low back': 6}, 'soreness': {'hamstrings': 7}, 'available_minutes': 45,
    })
    assert checkin.status_code == 201
    assert checkin.json()['decision_id']
    decision = client.get(f"/api/v1/decisions/{checkin.json()['decision_id']}", headers=headers).json()
    assert decision['reasoning']['reasoning_engine_version'] == '0.1.0'
    assert decision['adaptive']['adaptive_engine_version'] == '0.1.0'
    assert decision['coaching_language']['fired_rules']
    assert decision['pattern_recognition']['pattern_recognition_version'] == '0.1.0'

    today = client.get(f'/api/v1/athletes/{aid}/today', headers=headers).json()
    sid = today['original_session']['session']['session_id']
    complete = client.post(
        f'/api/v1/athletes/{aid}/sessions/{sid}/complete', headers={**headers, 'Idempotency-Key': 'learn-001'},
        json={'duration_minutes': 45, 'session_rpe': 8, 'performance_ratio': 0.9},
    )
    assert complete.status_code == 201
    assert complete.json()['learning']['learning_engine_version'] == '0.1.0'
    assert complete.json()['learning']['changes']
    assert complete.json()['state']['engine_version'] == '0.1.0'
    assert 'fatigue_banks' in complete.json()['state']

    intelligence = client.get(f'/api/v1/athletes/{aid}/intelligence', headers=headers)
    assert intelligence.status_code == 200
    body = intelligence.json()
    assert body['engine_manifest'] == manifest
    assert body['learning_parameters'] != {'volume_response': 1.0, 'intensity_response': 1.0, 'recovery_response': 1.0}

def test_today_does_not_pull_tomorrows_session_forward(client, auth):
    headers, _ = auth('unified-mission@example.com')
    athlete = client.post('/api/v1/athletes', headers=headers, json={
        'name': 'Unified Mission Athlete',
        'profile': {'age': 41, 'training_experience': 'Intermediate'},
    })
    aid = athlete.json()['id']
    mission = client.post(f'/api/v1/athletes/{aid}/missions', headers=headers, json={
        'goal': 'Build strength and conditioning',
        'timeline_weeks': 4,
        'constraints': {'training_days': 4, 'session_minutes': 60},
    })
    assert mission.status_code == 201
    assert client.post(f'/api/v1/athletes/{aid}/plans', headers=headers).status_code == 201

    date_one = '2026-07-28'
    first = client.get(f'/api/v1/athletes/{aid}/today?date={date_one}', headers=headers)
    assert first.status_code == 200
    first_body = first.json()
    assert first_body['status'] in ('planned', 'adapted')
    first_id = first_body['session']['session']['session_id']

    completed = client.post(
        f'/api/v1/athletes/{aid}/sessions/{first_id}/complete',
        headers={**headers, 'Idempotency-Key': 'unified-mission-complete-001'},
        json={'duration_minutes': 50, 'session_rpe': 7, 'performance_ratio': 1.0},
    )
    assert completed.status_code == 201

    same_day = client.get(f'/api/v1/athletes/{aid}/today?date={date_one}', headers=headers)
    assert same_day.status_code == 200
    same_day_body = same_day.json()
    assert same_day_body['status'] == 'today_complete'
    assert same_day_body['session'] is None
    assert same_day_body['remaining_today'] == 0
    assert same_day_body['next_session_preview']['preview_only'] is True
    next_id = same_day_body['next_session_preview']['session_id']
    assert next_id and next_id != first_id

    date_two = '2026-07-29'
    next_day = client.get(f'/api/v1/athletes/{aid}/today?date={date_two}', headers=headers)
    assert next_day.status_code == 200
    assert next_day.json()['session']['session']['session_id'] == next_id


def test_concurrent_scheduler_uses_friday_for_strength_and_layers_mobility():
    from app.services.core import _optimize_concurrent_schedule
    schedule = [
        {"session_name": "S-1 Upper Strength", "session": {"session_type": "strength", "session": {"title": "S-1 Upper Strength"}}},
        {"session_name": "S-2 Lower Strength", "session": {"session_type": "strength", "session": {"title": "S-2 Lower Strength"}}},
        {"session_name": "S-3 Athletic Upper", "session": {"session_type": "strength", "session": {"title": "S-3 Athletic Upper"}}},
        {"session_name": "Run Quality", "session": {"session_type": "engine", "session": {"title": "Run Quality"}}},
        {"session_name": "M-1 Daily Reset", "session": {"session_type": "mobility", "session": {"title": "M-1 Daily Reset"}}},
        {"session_name": "Long Run", "session": {"session_type": "engine", "session": {"title": "Long Run"}}},
    ]
    result = _optimize_concurrent_schedule(schedule, ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"])
    strength_days = [x["day"] for x in result if "Strength" in x.get("session_name", "") or "Athletic Upper" in x.get("session_name", "")]
    assert strength_days == ["Monday", "Tuesday", "Friday"]
    assert next(x for x in result if x["session_name"] == "Long Run")["day"] == "Saturday"
    mobility = next(x for x in result if x["session_name"] == "M-1 Daily Reset")
    assert mobility.get("support_component") is True
    assert mobility["day"] in strength_days + ["Thursday", "Saturday"]


def test_concurrent_scheduler_never_uses_unselected_days():
    from app.services.core import _optimize_concurrent_schedule
    schedule = [
        {"session_name": "Upper Strength", "session": {"session_type": "strength", "session": {"title": "Upper Strength"}}},
        {"session_name": "Lower Strength", "session": {"session_type": "strength", "session": {"title": "Lower Strength"}}},
        {"session_name": "Tempo Run", "session": {"session_type": "engine", "session": {"title": "Tempo Run"}}},
    ]
    selected = ["Monday", "Wednesday", "Friday", "Saturday"]
    result = _optimize_concurrent_schedule(schedule, selected)
    assert all(item["day"] in selected for item in result)
