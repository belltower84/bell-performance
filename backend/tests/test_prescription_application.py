from copy import deepcopy

from intelligence.prescription_application import (
    apply_application_to_plan,
    apply_prescription_application,
    build_prescription_application,
)


def decision(status="progress", channel="strength", **overrides):
    payload = {
        "status": status,
        "intensity_factor": 1.025,
        "volume_factor": 1.04,
        "engine_duration_factor": 1.05,
        "reason_codes": ["TEST"],
        "explanation": "Apply the stabilized response.",
        "longitudinal": {"channel": channel, "global_exposure": 2, "channel_exposure": 2},
    }
    payload.update(overrides)
    return payload


def strength_session(session_id="S1", role="competition_squat"):
    return {
        "session_type": "strength",
        "session": {"session_id": session_id, "title": "Squat Focus", "estimated_minutes": 60, "requested_minutes": 60},
        "event_role": "primary_lift",
        "exercise_role": role,
        "programming": {"block_phase": "build"},
        "exercise_blocks": [
            {"exercise_id": "back-squat", "name": "Back Squat", "prescription": {"sets": 4, "target_load": 300, "target_rpe": 8}},
            {"exercise_id": "row", "name": "Barbell Row", "prescription": {"sets": 3, "target_load": 150, "target_rpe": 8}},
        ],
    }


def engine_session(session_id="E1"):
    return {
        "session_type": "engine",
        "session": {"session_id": session_id, "title": "Long Run", "estimated_minutes": 60, "requested_minutes": 60},
        "event_role": "long",
        "session_role": "event_long",
        "engine_prescription": {"duration_minutes": 50, "zone": "easy"},
        "programming": {"block_phase": "build"},
    }


def test_application_id_is_deterministic():
    one = build_prescription_application(decision(), [], "S0", source_session_type="strength")
    two = build_prescription_application(decision(), [], "S0", source_session_type="strength")
    assert one["application_id"] == two["application_id"]


def test_strength_progress_changes_dose_and_preserves_roles():
    app = build_prescription_application(decision(), [], "S0", source_session_type="strength")
    revised = apply_prescription_application(strength_session(), app)
    squat = revised["exercise_blocks"][0]["prescription"]
    assert squat["sets"] == 4
    assert squat["target_load"] > 300
    meta = revised["programming"]["closed_loop_application"]
    assert meta["identity_invariant"] == {
        "session_id_preserved": True,
        "session_type_preserved": True,
        "event_roles_preserved": True,
    }


def test_application_is_idempotent():
    app = build_prescription_application(decision(), [], "S0", source_session_type="strength")
    once = apply_prescription_application(strength_session(), app)
    twice = apply_prescription_application(once, app)
    assert once == twice


def test_engine_application_changes_only_duration():
    app = build_prescription_application(decision(channel="engine"), [], "E0", source_session_type="engine")
    revised = apply_prescription_application(engine_session(), app)
    assert revised["session"]["estimated_minutes"] == 63
    assert revised["engine_prescription"]["duration_minutes"] == 52
    assert revised["event_role"] == "long"
    assert revised["session_role"] == "event_long"


def test_channel_mismatch_does_not_modify_session():
    app = build_prescription_application(decision(channel="engine"), [], "E0", source_session_type="engine")
    original = strength_session()
    assert apply_prescription_application(original, app) == original


def test_exercise_protection_substitutes_only_affected_movement():
    app = build_prescription_application(
        decision(status="protect", intensity_factor=.95, volume_factor=.75),
        [{"exercise_key": "back-squat", "exercise_name": "Back Squat", "status": "protect", "load_factor": 1}],
        "S0",
        source_session_type="strength",
    )
    revised = apply_prescription_application(strength_session(), app)
    squat, row = revised["exercise_blocks"]
    assert squat["protected_substitution"] is True
    assert "Pain-Free" in squat["name"]
    assert squat["prescription"]["sets"] <= 2
    assert row["name"] == "Barbell Row"
    assert revised["exercise_role"] == "competition_squat"


def test_safety_hold_replaces_hard_work_but_keeps_original_identity_metadata():
    app = build_prescription_application(
        decision(status="safety_hold", intensity_factor=.9, volume_factor=.6, engine_duration_factor=.7),
        [], "S0", source_session_type="strength",
    )
    revised = apply_prescription_application(strength_session(), app)
    assert revised["session_type"] == "recovery"
    assert revised["session"]["session_id"] == "S1"
    original = revised["programming"]["closed_loop_original_identity"]
    assert original["session_type"] == "strength"
    assert original["roles"]["exercise_role"] == "competition_squat"


def test_plan_targets_only_next_same_channel_session():
    plan = {"weeks": [{"week": 1, "sessions": [strength_session("S0"), engine_session("E1"), strength_session("S2")]}]}
    app = build_prescription_application(decision(), [], "S0", source_session_type="strength")
    result = apply_application_to_plan(plan, app, source_session_id="S0")
    assert result["target_session_id"] == "S2"
    e1 = result["plan"]["weeks"][0]["sessions"][1]
    s2 = result["plan"]["weeks"][0]["sessions"][2]
    assert "closed_loop_application" not in e1.get("programming", {})
    assert s2["programming"]["closed_loop_application"]["application_id"] == app["application_id"]


def test_plan_skips_completed_target():
    plan = {"weeks": [{"week": 1, "sessions": [strength_session("S0"), strength_session("S1"), strength_session("S2")]}]}
    app = build_prescription_application(decision(), [], "S0", source_session_type="strength")
    result = apply_application_to_plan(plan, app, source_session_id="S0", completed_session_ids={"S1"})
    assert result["target_session_id"] == "S2"


def test_plan_reports_pending_when_no_future_comparable_session():
    plan = {"weeks": [{"week": 1, "sessions": [strength_session("S0"), engine_session("E1")]}]}
    app = build_prescription_application(decision(), [], "S0", source_session_type="strength")
    result = apply_application_to_plan(plan, app, source_session_id="S0")
    assert result["applied"] is False
    assert result["application"]["state"] == "awaiting_future_session"


def test_regress_reduces_load_without_removing_exercise():
    app = build_prescription_application(
        decision(status="regress", intensity_factor=.95, volume_factor=.8),
        [{"exercise_key": "back-squat", "exercise_name": "Back Squat", "status": "regress", "load_factor": .95}],
        "S0", source_session_type="strength",
    )
    revised = apply_prescription_application(strength_session(), app)
    assert revised["exercise_blocks"][0]["name"] == "Back Squat"
    assert revised["exercise_blocks"][0]["prescription"]["target_load"] == 285


def test_original_input_is_never_mutated():
    original = strength_session()
    snapshot = deepcopy(original)
    app = build_prescription_application(decision(), [], "S0", source_session_type="strength")
    apply_prescription_application(original, app)
    assert original == snapshot


def test_completion_rewrites_next_comparable_plan_session(client, auth):
    headers, _ = auth("closed-loop@example.com")
    athlete = client.post("/api/v1/athletes", headers=headers, json={"name": "Closed Loop Athlete", "profile": {"age": 41}})
    aid = athlete.json()["id"]
    client.post(f"/api/v1/athletes/{aid}/missions", headers=headers, json={
        "goal": "Build strength and conditioning",
        "timeline_weeks": 4,
        "constraints": {"training_days": 4, "session_minutes": 60},
    })
    assert client.post(f"/api/v1/athletes/{aid}/plans", headers=headers).status_code == 201
    plan_before = client.get(f"/api/v1/athletes/{aid}/plan", headers=headers).json()
    sessions_before = [session for week in plan_before["weeks"] for session in week["sessions"]]
    source = sessions_before[0]
    source_id = source["session"]["session_id"]
    source_type = source["session_type"]
    expected_target = next(
        session for session in sessions_before[1:]
        if ("engine" if session["session_type"] == "engine" else "strength") == ("engine" if source_type == "engine" else "strength")
    )
    done = client.post(
        f"/api/v1/athletes/{aid}/sessions/{source_id}/complete",
        headers={**headers, "Idempotency-Key": "closed-loop-complete-001"},
        json={
            "schema_version": 1,
            "session_id": source_id,
            "session_type": source_type,
            "duration_minutes": 60,
            "session_rpe": 7,
            "performance_ratio": 1.0,
            "planned": {"duration_minutes": 60},
            "readiness": {"score": 80},
            "pain": {}, "technique_issues": [], "symptoms": [], "exercise_results": [],
        },
    )
    assert done.status_code == 201
    learning = done.json()["learning"]
    assert learning["prescription_applied"] is True
    assert learning["target_session_id"] == expected_target["session"]["session_id"]

    plan_after = client.get(f"/api/v1/athletes/{aid}/plan", headers=headers).json()
    target_after = next(
        session for week in plan_after["weeks"] for session in week["sessions"]
        if session["session"]["session_id"] == learning["target_session_id"]
    )
    applied = target_after["programming"]["closed_loop_application"]
    assert applied["application_id"] == learning["prescription_application"]["application_id"]
    assert applied["identity_invariant"]["event_roles_preserved"] is True

    adaptive = client.get(f"/api/v1/athletes/{aid}/adaptive-progression", headers=headers).json()
    assert adaptive["last_application"]["target_session_id"] == learning["target_session_id"]
    assert adaptive["prescription_applications"]
