from intelligence.real_world_chaos import completion_fingerprint, confidence_gate


def base(week, date, key="squat-main"):
    return {
        "session_id": key, "session_type":"strength", "session_rpe":7.5,
        "completed_duration_minutes":45, "pain_severity":0,
        "completion_identity":{"athleteId":"a1","planId":"p1","weekIndex":week,"scheduledDate":date,"sessionKey":key,"attempt":1},
        "exercises":[{"exercise_name":"Squat","planned_sets":3,"completed_sets":3}],
    }

def test_same_template_different_week_is_new_evidence():
    a=base(1,"2026-08-03"); b=base(2,"2026-08-10")
    assert completion_fingerprint(a) != completion_fingerprint(b)
    assert not confidence_gate(b,[a])["duplicate"]

def test_same_scheduled_occurrence_is_duplicate_after_reload():
    a=base(1,"2026-08-03"); copied=dict(a)
    assert completion_fingerprint(a) == completion_fingerprint(copied)
    assert confidence_gate(copied,[a])["duplicate"]

def test_identical_exercises_different_session_keys_are_not_duplicates():
    a=base(1,"2026-08-03","session-a"); b=base(1,"2026-08-03","session-b")
    assert completion_fingerprint(a) != completion_fingerprint(b)
