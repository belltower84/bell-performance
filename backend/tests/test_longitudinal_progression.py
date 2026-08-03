from intelligence.longitudinal_progression import stabilize_longitudinal_progression


def raw(status, intensity=1.0, volume=1.0, engine=1.0, reasons=None):
    return {
        "status": status,
        "intensity_factor": intensity,
        "volume_factor": volume,
        "engine_duration_factor": engine,
        "reason_codes": reasons or [],
        "explanation": status,
        "guardrails": [],
    }


def step(status, state=None, session_type="strength", phase="build", **factors):
    return stabilize_longitudinal_progression(
        raw(status, **factors), state, {"session_type": session_type, "phase_id": phase}
    )


def test_progression_cooldown_spaces_upward_decisions():
    state = None
    statuses = []
    for _ in range(5):
        result = step("progress", state)
        state = result["state"]
        statuses.append(result["decision"]["status"])
    assert statuses == ["progress", "observe", "observe", "progress", "observe"]


def test_taper_blocks_upward_progression():
    result = step("accelerate", phase="taper")
    assert result["decision"]["status"] == "hold"
    assert result["decision"]["longitudinal"]["preserve_event_specificity"] is True


def test_safety_hold_requires_three_reentry_exposures():
    result = step("safety_hold")
    state = result["state"]
    statuses = []
    for _ in range(3):
        result = step("progress", state)
        state = result["state"]
        statuses.append(result["decision"]["status"])
    assert statuses == ["reentry", "reentry", "reentry"]


def test_repeated_regression_is_not_compounded_immediately():
    first = step("regress", intensity=.95, volume=.8, engine=.85)
    second = step("regress", first["state"], intensity=.95, volume=.8, engine=.85)
    assert first["decision"]["status"] == "regress"
    assert second["decision"]["status"] in {"hold", "deload"}
    assert second["state"]["channels"]["strength"]["intensity_target"] == first["state"]["channels"]["strength"]["intensity_target"]


def test_strength_and_engine_targets_are_independent():
    strength = step("regress", intensity=.95, volume=.8, engine=.85)
    engine = step("progress", strength["state"], session_type="engine")
    assert engine["state"]["channels"]["strength"]["intensity_target"] == .95
    assert engine["state"]["channels"]["engine"]["duration_target"] == 1.05


def test_cumulative_targets_have_hard_ceilings():
    state = None
    for _ in range(30):
        result = step("accelerate", state, intensity=1.05, volume=1.08, engine=1.1)
        state = result["state"]
    assert state["channels"]["strength"]["intensity_target"] <= 1.10
    assert state["channels"]["strength"]["volume_target"] <= 1.15


def test_accumulated_fatigue_triggers_deload():
    state = None
    statuses = []
    for _ in range(6):
        result = step("hold", state, reasons=["LOW_READINESS"])
        state = result["state"]
        statuses.append(result["decision"]["status"])
    assert "deload" in statuses


def test_holds_do_not_reset_earned_target():
    progress = step("progress")
    earned = progress["state"]["channels"]["strength"]["intensity_target"]
    held = step("hold", progress["state"], intensity=.98, volume=.9, engine=.92)
    assert held["state"]["channels"]["strength"]["intensity_target"] == earned
    assert held["decision"]["intensity_factor"] < earned
