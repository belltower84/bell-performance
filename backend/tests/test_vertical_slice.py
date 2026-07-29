from pathlib import Path


def _weekly_engine(tmp_path):
    from intelligence.weekly_planner import BellWeeklyPlanningEngine
    root = Path(__file__).resolve().parents[1]
    return BellWeeklyPlanningEngine(
        root / "database" / "bckb_v1.3.0.sqlite",
        root / "rules" / "bell_rules_v1.yaml",
    )

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


def test_discipline_exposure_targets_hybrid_six_days():
    from app.services.core import _discipline_exposure_targets
    request = {"goal": "Hybrid Performance: Body Recomposition", "constraints": {"training_days": 6}}
    assert _discipline_exposure_targets(request, 6) == {"strength": 4, "engine": 3}


def test_discipline_exposure_targets_running_six_days():
    from app.services.core import _discipline_exposure_targets
    request = {"goal": "10K race performance", "constraints": {"training_days": 6}}
    assert _discipline_exposure_targets(request, 6) == {"strength": 3, "engine": 4}


def test_powerlifting_week_uses_competition_lift_roles_and_only_easy_engine(tmp_path):
    engine = _weekly_engine(tmp_path)
    try:
        result = engine.build_week({
            "goal": "Powerlifting: improve competition squat, bench press, and deadlift",
            "available_days": ["Monday", "Tuesday", "Thursday", "Friday", "Saturday"],
            "strength_days": 4,
            "engine_days": 1,
            "training_days": 5,
            "phase": "Build",
        })
        names = [x["session_name"] for x in result["schedule"] if x.get("session_name")]
        assert "Powerlifting Squat Focus" in names
        assert "Powerlifting Bench Focus" in names
        assert "Powerlifting Deadlift Focus" in names
        assert "Powerlifting Secondary Squat + Bench" in names
        assert "Powerlifting Aerobic Recovery" in names
        assert not any(name in names for name in ("Threshold", "Intervals", "Long Run", "Mixed Modal"))
    finally:
        engine.close()


def test_powerlifting_meet_prep_removes_engine_during_taper(tmp_path):
    from datetime import date, timedelta
    engine = _weekly_engine(tmp_path)
    try:
        result = engine.build_week({
            "goal": "Powerlifting Meet Prep",
            "event": "Powerlifting Meet",
            "competition_date": (date.today() + timedelta(days=10)).isoformat(),
            "available_days": ["Monday", "Tuesday", "Thursday", "Friday"],
            "strength_days": 4,
            "engine_days": 1,
            "training_days": 4,
        })
        assert result["mission_profile"] == "powerlifting_meet"
        assert result["phase"] == "Taper & Openers"
        names = [x["session_name"] for x in result["schedule"] if x.get("session_name")]
        assert len(names) == 4
        assert not any("Aerobic" in name or "Run" in name for name in names)
    finally:
        engine.close()

def test_powerlifting_meet_prep_keeps_only_recovery_engine_in_strength_block(tmp_path):
    from datetime import date, timedelta
    engine = _weekly_engine(tmp_path)
    try:
        result = engine.build_week({
            "goal": "Powerlifting Meet Prep",
            "event": "Powerlifting Meet",
            "competition_date": (date.today() + timedelta(days=49)).isoformat(),
            "available_days": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
            "strength_days": 4,
            "engine_days": 2,
            "training_days": 5,
        })
        assert result["phase"] == "Meet Strength Block"
        names = [x["session_name"] for x in result["schedule"] if x.get("session_name")]
        assert names.count("Powerlifting Aerobic Recovery") == 1
        assert not any(name in names for name in ("Threshold", "Intervals", "Long Run", "Mixed Modal"))
    finally:
        engine.close()


def test_journey_planner_builds_continuous_fat_loss_cycle():
    from datetime import date
    from intelligence.journey_planner import BellJourneyPlanner

    planner = BellJourneyPlanner()
    journey = planner.build(
        {"goal": "Performance & Health: Lose Fat", "timeline_weeks": 24},
        {
            "timeline_weeks": 24,
            "required_adaptations": ["body_composition", "strength"],
        },
        {"periodization_model": "block", "total_weeks": 24, "blocks": []},
        {"primary_training_identity": "Performance & Health"},
        as_of=date(2026, 7, 28),
        current_week=7,
    )
    assert journey["mode"] == "continuous_development"
    assert journey["name"] == "Fat-Loss Transformation"
    assert journey["objective"] == "Lose Fat"
    assert sum(phase["duration_weeks"] for phase in journey["phases"]) == 24
    assert [phase["name"] for phase in journey["phases"]] == [
        "Foundation", "Fat Loss I", "Recovery", "Fat Loss II", "Diet Break", "Recomposition"
    ]
    assert journey["current_phase_name"] == "Fat Loss I"
    assert journey["phase_week"] >= 1
    assert journey["next_milestone"]


def test_journey_planner_uses_event_date_for_powerlifting_macrocycle():
    from datetime import date
    from intelligence.journey_planner import BellJourneyPlanner, event_timeline_weeks

    timeline = event_timeline_weeks("2027-01-26", as_of=date(2026, 7, 28), fallback=12)
    assert timeline["planning_horizon_weeks"] == 26

    journey = BellJourneyPlanner().build(
        {
            "goal": "Powerlifting Meet Preparation",
            "timeline_weeks": 12,
            "competition_date": "2027-01-26",
            "competition_type": "Texas Powerlifting Meet",
        },
        {
            "timeline_weeks": 26,
            "deadline": "2027-01-26",
            "required_adaptations": ["strength"],
        },
        {"periodization_model": "block", "total_weeks": 26, "blocks": []},
        {"primary_training_identity": "Powerlifting"},
        as_of=date(2026, 7, 28),
        current_week=1,
    )
    assert journey["mode"] == "event_preparation"
    assert journey["total_weeks"] == 26
    assert journey["identity"] == "Powerlifting"
    assert journey["name"] == "Texas Powerlifting Meet"
    assert journey["phases"][-1]["name"] == "Taper"
    assert sum(phase["duration_weeks"] for phase in journey["phases"]) == 26


def test_coaching_state_endpoint_exposes_journey(client, auth):
    headers, _ = auth("journey-state@example.com")
    athlete = client.post("/api/v1/athletes", headers=headers, json={
        "name": "Journey Athlete",
        "profile": {
            "primary_training_identity": "Powerlifting",
            "training_experience": "Intermediate",
        },
    })
    aid = athlete.json()["id"]
    mission = client.post(f"/api/v1/athletes/{aid}/missions", headers=headers, json={
        "goal": "Powerlifting strength development",
        "timeline_weeks": 8,
        "constraints": {"training_days": 4, "session_minutes": 60},
    })
    assert mission.status_code == 201
    created = client.post(f"/api/v1/athletes/{aid}/plans", headers=headers)
    assert created.status_code == 201
    assert created.json()["journey"]["journey_engine_version"] == "13.2.0"

    response = client.get(f"/api/v1/athletes/{aid}/coaching-state?week=5", headers=headers)
    assert response.status_code == 200
    body = response.json()
    assert body["journey"]["current_week"] == 5
    assert body["journey"]["current_phase_name"]
    assert body["journey"]["phase_week"] >= 1
    assert body["next_milestone"]
    assert body["engine_manifest"]["journey_planner"] == "13.2.0"

    renewed = client.get(f"/api/v1/athletes/{aid}/coaching-state?week=52", headers=headers)
    assert renewed.status_code == 200
    renewed_body = renewed.json()
    assert renewed_body["journey"]["current_week"] == 52
    assert renewed_body["journey"]["cycle_number"] == 7
    assert renewed_body["journey"]["cycle_week"] == 4
    assert renewed_body["journey"]["next_cycle_emphasis"]
    assert renewed_body["current_week"] is not None


def test_discipline_library_resolves_distinct_coaching_models():
    from intelligence.discipline_library import BellDisciplineLibrary

    library = BellDisciplineLibrary()
    cases = {
        "Powerlifting": "powerlifting",
        "Bodybuilding": "bodybuilding",
        "Tactical Athlete": "tactical_athlete",
        "Functional Fitness": "functional_fitness",
        "Endurance Athlete": "endurance_athlete",
        "Hybrid Athlete": "hybrid_athlete",
        "Performance & Health": "performance_health",
    }
    for identity, expected in cases.items():
        profile = library.get(identity, "Continuous Development")
        assert profile["id"] == expected
        assert profile["progression"]
        assert profile["protected_sessions"]
        assert profile["assessments"]


def test_continuous_journey_rolls_into_new_cycle_without_resetting_history():
    from datetime import date
    from intelligence.journey_planner import BellJourneyPlanner

    planner = BellJourneyPlanner()
    base = planner.build(
        {"goal": "Powerlifting strength development", "timeline_weeks": 8},
        {"timeline_weeks": 8, "required_adaptations": ["strength"]},
        {"periodization_model": "block", "total_weeks": 8, "blocks": []},
        {"primary_training_identity": "Powerlifting"},
        as_of=date(2026, 7, 28),
        current_week=1,
    )
    renewed = planner.state_for_week(base, 10)
    assert renewed["current_week"] == 10
    assert renewed["cycle_number"] == 2
    assert renewed["cycle_week"] == 2
    assert renewed["cycle_emphasis"] != ""
    assert renewed["continuous_policy"]["mode"] == "renewable_cycles"
    assert renewed["current_phase_name"] == base["phases"][0]["name"]


def test_tactical_continuous_library_has_operational_phases():
    from datetime import date
    from intelligence.journey_planner import BellJourneyPlanner

    journey = BellJourneyPlanner().build(
        {"goal": "Tactical Athlete continuous readiness", "timeline_weeks": 24},
        {"timeline_weeks": 24, "required_adaptations": ["strength", "ruck", "work_capacity"]},
        {"periodization_model": "block", "total_weeks": 24, "blocks": []},
        {"primary_training_identity": "Tactical Athlete"},
        as_of=date(2026, 7, 28),
    )
    names = [phase["name"] for phase in journey["phases"]]
    assert names == ["Foundation", "Strength & Armor", "Aerobic Durability", "Load & Work Capacity", "Assessment", "Recovery"]
    assert journey["discipline"]["id"] == "tactical_athlete"
    assert journey["phases"][1]["progression_rule"]


def test_endurance_vo2_week_uses_endurance_library(tmp_path):
    engine = _weekly_engine(tmp_path)
    try:
        result = engine.build_week({
            "goal": "Endurance Athlete 10K development",
            "identity": "Endurance Athlete",
            "objective": "Improve Endurance",
            "journey_phase": "VO2 Development",
            "available_days": ["Monday", "Tuesday", "Wednesday", "Friday", "Saturday"],
            "strength_days": 3,
            "engine_days": 4,
            "training_days": 5,
        })
        names = [item["session_name"] for item in result["schedule"] if item.get("session_name")]
        assert result["discipline"] == "endurance_athlete"
        assert "Intervals" in names
        assert "Long Run" in names
        assert result["coaching_rules"]["progression_rule"]
        assert result["coaching_rules"]["discipline_library_version"] == "13.2.0"
    finally:
        engine.close()


def test_transition_rules_recover_before_advancing():
    from intelligence.discipline_library import BellDisciplineLibrary

    library = BellDisciplineLibrary()
    decision = library.evaluate_transition({}, {"readiness": 38, "pain": 8, "phase_complete": True, "progress": .9})
    assert decision["action"] == "recover"
    healthy = library.evaluate_transition({}, {"readiness": 80, "pain": 0, "phase_complete": True, "progress": .85})
    assert healthy["action"] == "advance"


def test_athlete_profile_is_normalized_and_can_be_updated(client, auth):
    headers, _ = auth("profile-modernization@example.com")
    created = client.post("/api/v1/athletes", headers=headers, json={
        "name": "Chris",
        "profile": {
            "age": 41,
            "height_inches": 66,
            "weight_lb": 205,
            "primary_training_identity": "Powerlifting",
            "objective": "Increase Strength",
            "training_experience": "advanced",
            "available_days": ["Monday", "Tuesday", "Thursday", "Friday", "Saturday"],
            "session_minutes": 75,
            "maxes": {"squat": 500, "bench": 325, "deadlift": 500},
        },
    })
    assert created.status_code == 201
    body = created.json()
    assert body["profile"]["schema_version"] == 1
    assert body["profile"]["identity"]["primary"] == "Powerlifting"
    assert body["profile"]["baselines"]["maxes"]["squat"] == 500
    assert body["profile"]["profile_completeness"] == 100

    athlete_id = body["id"]
    updated = client.patch(f"/api/v1/athletes/{athlete_id}", headers=headers, json={
        "profile": {
            "identity": {
                "objective": "Prepare for Competition",
                "journey_mode": "event_preparation",
                "event_name": "Texas State Meet",
                "event_date": "2027-02-20",
            },
            "coaching": {"detail_level": "Detailed"},
        },
    })
    assert updated.status_code == 200
    profile = updated.json()["profile"]
    assert profile["identity"]["objective"] == "Prepare for Competition"
    assert profile["identity"]["event_name"] == "Texas State Meet"
    assert profile["coaching"]["detail_level"] == "Detailed"
    assert profile["baselines"]["maxes"]["squat"] == 500
    assert profile["availability"]["normal_days"] == ["Monday", "Tuesday", "Thursday", "Friday", "Saturday"]

    fetched = client.get(f"/api/v1/athletes/{athlete_id}", headers=headers)
    assert fetched.status_code == 200
    assert fetched.json()["profile"]["identity"]["event_date"] == "2027-02-20"


def test_powerlifting_profile_completeness_requires_three_lift_maxes():
    from intelligence.athlete_profile import normalize_athlete_profile

    incomplete = normalize_athlete_profile({
        "demographics": {"first_name": "Chris", "age": 41, "height_inches": 66, "bodyweight_lb": 205},
        "identity": {"primary": "Powerlifting", "objective": "Increase Strength"},
        "experience": {"level": "Advanced"},
        "availability": {"normal_days": ["Monday", "Tuesday", "Thursday", "Friday"], "session_minutes": 75},
        "baselines": {"maxes": {"squat": 500, "bench": 325}},
    })
    assert incomplete["profile_completeness"] < 100

    complete = normalize_athlete_profile({
        **incomplete,
        "baselines": {"maxes": {"squat": 500, "bench": 325, "deadlift": 500}},
    })
    assert complete["profile_completeness"] == 100


def test_legacy_profile_aliases_preserve_event_intent():
    from intelligence.athlete_profile import normalize_athlete_profile

    profile = normalize_athlete_profile({
        "name": "Runner",
        "age": 35,
        "height_inches": 70,
        "weight_lb": 180,
        "primary_training_identity": "Endurance Athlete",
        "objective": "Prepare for Competition",
        "experience": "intermediate",
        "available_days": ["Monday", "Wednesday", "Friday", "Saturday"],
        "competition_type": "10K",
        "competition_date": "2027-03-20",
    })
    assert profile["identity"]["primary"] == "Endurance Athlete"
    assert profile["identity"]["journey_mode"] == "event_preparation"
    assert profile["identity"]["event_name"] == "10K"
    assert profile["experience"]["level"] == "Intermediate"
