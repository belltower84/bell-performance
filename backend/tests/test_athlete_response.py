from copy import deepcopy

from intelligence.athlete_response import (
    evaluate_athlete_response,
    exercise_progression_decisions,
    normalize_completion,
)


def completion(**overrides):
    payload = {
        "schema_version": 1,
        "session_id": "session-1",
        "session_type": "strength",
        "duration_minutes": 60,
        "session_rpe": 7,
        "performance_ratio": 1.0,
        "difficulty": "right",
        "planned": {"duration_minutes": 60},
        "readiness": {"score": 78},
        "pain": {},
        "technique_issues": [],
        "symptoms": [],
        "exercise_results": [],
    }
    for key, value in overrides.items():
        if key == "planned_duration":
            payload["planned"] = {"duration_minutes": value}
        else:
            payload[key] = value
    return payload


def exercise_result(**overrides):
    payload = {
        "name": "Back Squat",
        "completion_ratio": 1.0,
        "rep_ratio": 1.0,
        "average_rpe": 8.0,
        "average_rir": 2.0,
        "pain": 0,
        "technique_issue": False,
    }
    payload.update(overrides)
    return payload


def test_normalization_preserves_zero_performance():
    item = normalize_completion(completion(performance_ratio=0, duration_minutes=0))
    assert item["performance_ratio"] == 0
    assert item["duration_minutes"] == 0


def test_one_good_session_is_observed_not_progressed():
    result = evaluate_athlete_response(completion())
    assert result["status"] == "observe"
    assert result["intensity_factor"] == 1


def test_two_quality_sessions_progress():
    prior = completion(session_id="prior")
    result = evaluate_athlete_response(completion(), [prior])
    assert result["status"] == "progress"
    assert 1 < result["intensity_factor"] <= 1.05


def test_three_rapid_sessions_accelerate_with_caps():
    rapid = completion(performance_ratio=1.08, session_rpe=6.5)
    result = evaluate_athlete_response(rapid, [deepcopy(rapid), deepcopy(rapid)])
    assert result["status"] == "accelerate"
    assert result["intensity_factor"] == 1.05
    assert result["engine_duration_factor"] == 1.10


def test_single_difficult_session_holds():
    result = evaluate_athlete_response(completion(performance_ratio=.78, session_rpe=9.5))
    assert result["status"] == "hold"


def test_repeated_underperformance_regresses():
    hard = completion(performance_ratio=.80, session_rpe=9.5)
    result = evaluate_athlete_response(hard, [hard])
    assert result["status"] == "regress"
    assert result["intensity_factor"] < 1


def test_pain_and_technique_block_progression():
    pain = evaluate_athlete_response(completion(pain={"knee": 5}))
    technique = evaluate_athlete_response(completion(technique_issues=["lumbar position"]))
    assert pain["status"] == "protect"
    assert technique["status"] == "protect"


def test_severe_pain_and_red_flags_create_safety_hold():
    severe = evaluate_athlete_response(completion(pain={"shoulder": 8}))
    red_flag = evaluate_athlete_response(completion(symptoms=["chest pain"]))
    assert severe["status"] == "safety_hold"
    assert red_flag["status"] == "safety_hold"


def test_interruption_and_low_completion_rebuild_without_catchup_volume():
    interrupted = evaluate_athlete_response(completion(), context={"interruption_days": 12})
    missed = evaluate_athlete_response(completion(), context={"missed_sessions": 3, "compliance": .5})
    for result in (interrupted, missed):
        assert result["status"] == "rebuild"
        assert result["volume_factor"] < 1
        assert "No catch-up volume" in result["guardrails"][0]


def test_exercise_requires_repeated_success_before_progressing():
    current = completion(exercise_results=[exercise_result()])
    first = exercise_progression_decisions(current)
    second = exercise_progression_decisions(current, [current])
    assert first[0]["status"] == "hold"
    assert second[0]["status"] == "progress"


def test_exercise_repeated_failure_regresses_and_pain_protects():
    hard_result = exercise_result(completion_ratio=.7, rep_ratio=.75, average_rpe=9.7)
    hard = completion(exercise_results=[hard_result])
    repeat = exercise_progression_decisions(hard, [hard])
    painful = exercise_progression_decisions(completion(exercise_results=[exercise_result(pain=5)]))
    assert repeat[0]["status"] == "regress"
    assert painful[0]["status"] == "protect"


def test_structured_completion_endpoint_records_adaptive_state(client, auth):
    headers, _ = auth("response-engine@example.com")
    athlete = client.post("/api/v1/athletes", headers=headers, json={"name": "Response Athlete", "profile": {"age": 41}})
    aid = athlete.json()["id"]
    client.post(f"/api/v1/athletes/{aid}/missions", headers=headers, json={
        "goal": "Build strength and conditioning", "timeline_weeks": 4,
        "constraints": {"training_days": 4, "session_minutes": 60},
    })
    assert client.post(f"/api/v1/athletes/{aid}/plans", headers=headers).status_code == 201
    today = client.get(f"/api/v1/athletes/{aid}/today", headers=headers).json()
    sid = today["session"]["session"]["session_id"]
    body = completion(
        session_id=sid,
        exercise_results=[exercise_result()],
        actual={"duration_minutes": 60, "session_rpe": 7, "performance_ratio": 1.0},
        feedback={"difficulty": "right"},
    )
    done = client.post(
        f"/api/v1/athletes/{aid}/sessions/{sid}/complete",
        headers={**headers, "Idempotency-Key": "structured-response-001"}, json=body,
    )
    assert done.status_code == 201
    learning = done.json()["learning"]
    assert learning["response"]["status"] == "observe"
    assert learning["learning_engine_version"] == "0.1.0"
    adaptive = client.get(f"/api/v1/athletes/{aid}/adaptive-progression", headers=headers)
    assert adaptive.status_code == 200
    assert adaptive.json()["last_decision"]["status"] == "observe"
    assert adaptive.json()["exercise_decisions"][0]["exercise_name"] == "Back Squat"


def test_safety_hold_replaces_hard_session_with_recovery():
    from app.services.core import _apply_athlete_response_adjustment
    session = {
        "session_type": "strength",
        "session": {"title": "Heavy Squat", "estimated_minutes": 60},
        "exercise_blocks": [{"name": "Squat", "prescription": {"sets": 5, "target_rpe": 9}}],
    }
    profile = {"adaptive_progression": {"last_decision": {
        "status": "safety_hold", "intensity_factor": .9, "volume_factor": .6,
        "engine_duration_factor": .7, "reason_codes": ["SEVERE_PAIN"],
        "explanation": "Stop hard progression.",
    }}}
    revised = _apply_athlete_response_adjustment(session, profile)
    assert revised["session"]["title"] == "Athlete Response Safety Hold"
    assert revised["programming"]["athlete_response_adjustment"]["status"] == "safety_hold"

def test_complete_current_session_overrides_low_broader_adherence():
    result = evaluate_athlete_response(
        completion(),
        context={"session_completion": 1.0, "compliance": .1, "missed_sessions": 0},
    )
    assert result["status"] != "rebuild"
    assert "LOW_SESSION_COMPLETION" not in result["reason_codes"]


def test_low_current_session_completion_rebuilds_explicitly():
    result = evaluate_athlete_response(
        completion(performance_ratio=.4),
        context={"session_completion": .4, "compliance": 1.0, "missed_sessions": 0},
    )
    assert result["status"] == "rebuild"
    assert result["reason_codes"] == ["LOW_SESSION_COMPLETION"]
