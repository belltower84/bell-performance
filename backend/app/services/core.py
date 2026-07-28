from __future__ import annotations

import copy
import json
import re
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Athlete, Mission, Plan, CheckIn, AthleteEvent, Decision, SessionCompletion
from intelligence.adaptive_coaching import BellAdaptiveCoachingEngine
from intelligence.athlete_state import BellAthleteStateEngine
from intelligence.coaching_language import BellCoachingLanguage
from intelligence.coaching_reasoning import BellCoachingReasoningEngine
from intelligence.intelligence_orchestrator import BellIntelligenceOrchestrator
from intelligence.learning_engine import BellLearningEngine
from intelligence.pattern_recognition import BellPatternRecognitionEngine
from intelligence.session_builder import BellSessionBuilder
from intelligence.weekly_planner import BellWeeklyPlanningEngine

ROOT = Path(__file__).resolve().parents[2]
KB_DATABASE = ROOT / "database" / "bckb_v1.3.0.sqlite"
RULEBOOK = ROOT / "rules" / "bell_rules_v1.yaml"
STATE_RULES = ROOT / "rules" / "athlete_state_rules_v1.yaml"
ADAPTATION_RULES = ROOT / "rules" / "adaptation_rules_v1.yaml"
REASONING_RULES = ROOT / "rules" / "coaching_reasoning_rules_v1.yaml"
EVIDENCE_CATALOG = ROOT / "research" / "evidence_catalog_v1.json"

DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]


def dumps(value: Any) -> str:
    return json.dumps(value, sort_keys=True, default=str)


def loads(value: str | None) -> Any:
    return json.loads(value or "{}")


def uid(prefix: str) -> str:
    return prefix + "_" + uuid.uuid4().hex[:16]


def now() -> datetime:
    return datetime.now(timezone.utc)


def event(db: Session, athlete_id: str, event_type: str, payload: dict[str, Any]) -> AthleteEvent:
    row = AthleteEvent(
        id=uid("evt"), athlete_id=athlete_id, event_type=event_type,
        payload_json=dumps(payload), occurred_at=now(),
    )
    db.add(row)
    return row


def _event_rows(db: Session, athlete_id: str) -> list[dict[str, Any]]:
    rows = db.scalars(
        select(AthleteEvent)
        .where(AthleteEvent.athlete_id == athlete_id)
        .order_by(AthleteEvent.occurred_at, AthleteEvent.id)
    ).all()
    return [
        {
            "event_id": row.id,
            "athlete_id": row.athlete_id,
            "event_type": row.event_type,
            "occurred_at": row.occurred_at.isoformat(),
            "source": "bell-core",
            "payload": loads(row.payload_json),
        }
        for row in rows
    ]


def pattern_events(db: Session, athlete_id: str) -> list[dict[str, Any]]:
    return [
        {"type": item["event_type"], "data": item["payload"], "occurred_at": item["occurred_at"]}
        for item in _event_rows(db, athlete_id)
    ]


def project_state(db: Session, athlete_id: str) -> dict[str, Any]:
    """Run the canonical Bell Athlete State Engine over the SQL event stream."""
    engine = BellAthleteStateEngine(None, STATE_RULES)
    state = engine.project_events(athlete_id, _event_rows(db, athlete_id), persist=False)
    # Compatibility aliases consumed by the Reasoning and Digital Twin engines.
    state["fatigue_banks"] = copy.deepcopy(state.get("fatigue", {}))
    state["compliance_rate"] = state.get("compliance", {}).get("rate")
    state["momentum_score"] = state.get("momentum", {}).get("score")
    state["training_age"] = "intermediate"
    state.setdefault("performance", {})["plateau"] = (
        state.get("performance", {}).get("underperformance_streak", 0) >= 2
    )
    return state


def _profile(athlete: Athlete) -> dict[str, Any]:
    return loads(athlete.profile_json)


def _learning_parameters(profile: dict[str, Any]) -> dict[str, float]:
    defaults = {"volume_response": 1.0, "intensity_response": 1.0, "recovery_response": 1.0}
    raw = profile.get("bell_learning_parameters") or {}
    return {key: float(raw.get(key, value)) for key, value in defaults.items()}


def _nutrition_athlete(profile: dict[str, Any]) -> dict[str, Any]:
    weight_lb = profile.get("body_weight_lb", profile.get("weight_lb", 180)) or 180
    payload = {
        "body_weight_lb": float(weight_lb),
        "body_weight_kg": float(weight_lb) * 0.453592,
        "age": profile.get("age"),
        "sex": profile.get("sex"),
    }
    if profile.get("maintenance_calories") is not None:
        payload["maintenance_calories"] = float(profile["maintenance_calories"])
    return payload


def _flatten_equipment(value: Any) -> list[str]:
    found: list[str] = []

    def walk(item: Any, key: str | None = None) -> None:
        if isinstance(item, dict):
            for k, v in item.items():
                if isinstance(v, bool) and v:
                    found.append(str(k))
                else:
                    walk(v, str(k))
        elif isinstance(item, (list, tuple, set)):
            for child in item:
                walk(child, key)
        elif isinstance(item, str) and item.strip():
            found.append(item.strip())

    walk(value)
    normalized: list[str] = []
    aliases = {
        "rack": "Power Rack", "power rack": "Power Rack", "barbell": "Barbell",
        "bench": "Adjustable Bench", "dumbbells": "Dumbbell", "dumbbell": "Dumbbell",
        "bands": "Resistance Band", "band": "Resistance Band", "pull up bar": "Pull-Up Bar",
        "mat": "Exercise Mat", "kettlebells": "Kettlebell", "kettlebell": "Kettlebell",
    }
    for item in found:
        key = " ".join(re.sub(r"[_-]+", " ", item).lower().split())
        label = aliases.get(key, item)
        if label not in normalized:
            normalized.append(label)
    # A new Bell athlete may not have completed equipment setup yet. Bodyweight
    # is always valid; the common home-gym baseline prevents empty plans.
    return normalized or [
        "Bodyweight", "Barbell", "Power Rack", "Adjustable Bench", "Dumbbell",
        "Resistance Band", "Pull-Up Bar", "Exercise Mat",
    ]


def _default_available_days(training_days: int) -> list[str]:
    maps = {
        2: ["Tuesday", "Friday"],
        3: ["Monday", "Wednesday", "Saturday"],
        4: ["Monday", "Tuesday", "Thursday", "Saturday"],
        5: ["Monday", "Tuesday", "Thursday", "Friday", "Saturday"],
        6: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    }
    return maps.get(max(2, min(6, training_days)), maps[4])


def _phase_name(phase: str) -> str:
    value = str(phase or "build").lower()
    if value == "foundation":
        return "Foundation"
    if value in ("taper", "realization"):
        return "Peak"
    if value == "deload":
        return "Deload"
    return "Build"


def _competition_type(goal: str) -> str:
    text = str(goal or "").lower()
    for label, terms in (
        ("tactical_games", ("tactical games", "tactical")),
        ("powerlifting", ("powerlifting", "squat", "bench", "deadlift")),
        ("marathon", ("marathon",)),
        ("10k", ("10k",)),
        ("bodybuilding", ("bodybuilding", "physique")),
        ("hockey", ("hockey",)),
    ):
        if any(term in text for term in terms):
            return label
    return "general"


def _auto_bcl(request: dict[str, Any]) -> str:
    constraints = request.get("constraints") or {}
    priority = request.get("priority_order") or ["mission_success", "health", "consistency"]
    lines = [
        f"MISSION {request.get('goal', 'GeneralPerformance')}",
        "PRIORITY " + " > ".join(str(x) for x in priority),
        "CONSTRAINT",
        f"training_days = {int(constraints.get('training_days', 4))}",
        f"session_minutes = {int(constraints.get('session_minutes', 60))}",
        "RULE",
        "IF Readiness < 55",
        "THEN reduce_volume",
        "THEN cap_rpe_7",
        "IF Pain >= 7",
        "THEN replace_or_stop_painful_loading",
        "IF Sleep < 5",
        "THEN protect_primary_objective_with_reduced_dose",
    ]
    return "\n".join(lines)


def compile_mission_request(request: dict[str, Any]) -> tuple[dict[str, Any], str]:
    bcl_text = request.get("coaching_language") or _auto_bcl(request)
    program = BellCoachingLanguage().parse(bcl_text)
    merged = copy.deepcopy(request)
    merged["constraints"] = {**program.get("constraints", {}), **(request.get("constraints") or {})}
    if program.get("priorities") and not merged.get("priority_order"):
        merged["priority_order"] = program["priorities"]
    merged["coaching_language"] = bcl_text
    return merged, bcl_text


def _simulation_candidates(parameters: dict[str, float]) -> list[dict[str, Any]]:
    volume = parameters.get("volume_response", 1.0)
    intensity = parameters.get("intensity_response", 1.0)
    recovery = parameters.get("recovery_response", 1.0)
    return [
        {
            "id": "aggressive", "volume_factor": round(1.08 * volume, 3),
            "intensity_factor": round(1.04 * intensity, 3),
            "recovery_factor": round(0.90 * recovery, 3), "mission_fit": 0.90,
        },
        {
            "id": "balanced", "volume_factor": round(1.00 * volume, 3),
            "intensity_factor": round(1.00 * intensity, 3),
            "recovery_factor": round(1.00 * recovery, 3), "mission_fit": 0.94,
        },
        {
            "id": "conservative", "volume_factor": round(0.90 * volume, 3),
            "intensity_factor": round(0.95 * intensity, 3),
            "recovery_factor": round(1.10 * recovery, 3), "mission_fit": 0.82,
        },
    ]


def _state_for_intelligence(state: dict[str, Any], profile: dict[str, Any]) -> dict[str, Any]:
    out = copy.deepcopy(state)
    if out.get("compliance", {}).get("rate") is None:
        out.setdefault("compliance", {})["rate"] = 85.0
        out["compliance_rate"] = 85.0
    out["training_age"] = str(
        profile.get("training_experience", profile.get("experience", "intermediate"))
    ).lower()
    out["fatigue_banks"] = copy.deepcopy(out.get("fatigue", {}))
    return out


def _week_meta(program: dict[str, Any], week_number: int) -> tuple[dict[str, Any], dict[str, Any]]:
    for block in program.get("blocks", []):
        if block["start_week"] <= week_number < block["start_week"] + block["duration_weeks"]:
            detail = next((w for w in block.get("weeks", []) if w.get("week") == week_number), {})
            return block, detail
    raise ValueError(f"No block contains week {week_number}")


def _apply_programming_factors(session: dict[str, Any], volume_factor: float, intensity_factor: float,
                               available_minutes: int) -> dict[str, Any]:
    revised = copy.deepcopy(session)
    if revised.get("session_type") == "engine":
        rx = revised.get("engine_prescription", {})
        if isinstance(rx.get("duration_minutes"), (int, float)):
            rx["duration_minutes"] = max(15, min(available_minutes, round(rx["duration_minutes"] * volume_factor)))
        revised["estimated_total_minutes"] = min(
            available_minutes, int(rx.get("duration_minutes", revised.get("estimated_total_minutes", available_minutes)))
        )
        return revised

    for block in revised.get("exercise_blocks", []):
        rx = block.get("prescription", {})
        if isinstance(rx.get("sets"), int):
            rx["sets"] = max(1, min(8, round(rx["sets"] * volume_factor)))
        if isinstance(rx.get("target_rpe"), (int, float)):
            rx["target_rpe"] = round(max(5.5, min(9.5, rx["target_rpe"] + (intensity_factor - 1) * 5)), 1)
            rx["target_rir"] = round(max(0.5, 10 - rx["target_rpe"]), 1)
        block["estimated_minutes"] = max(3, round(float(block.get("estimated_minutes", 8)) * volume_factor))
    total = (
        int(revised.get("warmup", {}).get("minutes", 8))
        + int(revised.get("cooldown", {}).get("minutes", 5))
        + sum(int(x.get("estimated_minutes", 0)) for x in revised.get("exercise_blocks", []))
    )
    revised.setdefault("session", {})["estimated_minutes"] = min(total, available_minutes)
    return revised


def _normalize_session(built: dict[str, Any], session_id: str, day: str, week_number: int,
                       phase: str, programming: dict[str, Any]) -> dict[str, Any]:
    normalized = copy.deepcopy(built)
    session_type = built.get("session_type") or built.get("session", {}).get("session_type", "strength")
    if session_type == "engine":
        name = built.get("name", "Engine Training")
        estimated = int(built.get("estimated_total_minutes", 45))
        normalized["session"] = {
            "session_id": session_id, "day": day, "week": week_number, "title": name,
            "name": name, "session_type": "engine", "type": "engine", "phase": phase,
            "requested_minutes": estimated, "estimated_minutes": estimated,
        }
        normalized.setdefault("warmup", {"minutes": 5, "items": ["Easy movement and event-specific preparation"]})
        normalized.setdefault("cooldown", {"minutes": 5, "items": ["Easy downshift and breathing"]})
    else:
        original = built.get("session", {})
        name = original.get("name", "Strength Training")
        estimated = int(original.get("estimated_minutes", original.get("requested_minutes", 60)))
        normalized["session"] = {
            **original,
            "session_id": session_id, "day": day, "week": week_number, "title": name,
            "type": session_type, "session_type": session_type,
            "requested_minutes": int(original.get("requested_minutes", estimated)),
            "estimated_minutes": estimated,
        }
    normalized["session_type"] = session_type
    normalized["programming"] = programming
    return normalized


def _compact_plan_summary(intelligence: dict[str, Any]) -> dict[str, Any]:
    return {
        "orchestrator_version": intelligence.get("intelligence_orchestrator_version"),
        "forecast": intelligence.get("forecast"),
        "patterns": intelligence.get("patterns"),
        "goal_probability": intelligence.get("goal_probability"),
        "simulation": intelligence.get("simulation"),
        "competition": intelligence.get("competition"),
        "nutrition": intelligence.get("nutrition"),
        "coaching_language": intelligence.get("coaching_language"),
    }


def generate_plan(db: Session, athlete: Athlete, mission_row: Mission) -> Plan:
    """Generate a multiweek program through the full Bell intelligence stack."""
    profile = _profile(athlete)
    state = _state_for_intelligence(project_state(db, athlete.id), profile)
    request = loads(mission_row.request_json)
    bcl_text = request.get("coaching_language") or _auto_bcl(request)
    parameters = _learning_parameters(profile)
    competition = None
    if request.get("competition_date"):
        competition = {
            "type": request.get("competition_type") or _competition_type(request.get("goal", "")),
            "date": request["competition_date"],
        }

    orchestrated = BellIntelligenceOrchestrator().run({
        "mission": request,
        "athlete_state": state,
        "athlete": _nutrition_athlete(profile),
        "events": pattern_events(db, athlete.id),
        "competition": competition,
        "simulation_candidates": _simulation_candidates(parameters),
        "coaching_language": bcl_text,
        "bcl_context": {
            "Readiness": float(state.get("readiness", {}).get("current", 70)),
            "Pain": max(state.get("recovery", {}).get("pain_regions", {}).values(), default=0),
            "Sleep": float(state.get("recovery", {}).get("sleep_7d") or 8),
        },
    })

    mission = orchestrated["mission"]
    program = orchestrated["program"]
    constraints = mission.get("constraints", {})
    training_days = max(2, min(6, int(constraints.get("training_days", 4))))
    session_minutes = max(20, min(180, int(constraints.get("session_minutes", 60))))
    available_days = constraints.get("available_days") or _default_available_days(training_days)
    equipment = _flatten_equipment(profile.get("equipment") or constraints.get("equipment"))
    simulation_selected = (orchestrated.get("simulation") or {}).get("selected") or {}
    assumptions = simulation_selected.get("assumptions", {})
    strategy_volume = float(assumptions.get("volume_factor", 1.0))
    strategy_intensity = float(assumptions.get("intensity_factor", 1.0))

    planner = BellWeeklyPlanningEngine(KB_DATABASE, RULEBOOK)
    weeks: list[dict[str, Any]] = []
    recent_exercise_ids: list[str] = []
    try:
        for week_number in range(1, int(mission["timeline_weeks"]) + 1):
            block, week_detail = _week_meta(program, week_number)
            phase = _phase_name(block.get("phase"))
            volume_factor = max(0.45, min(1.30, strategy_volume * float(week_detail.get("volume_multiplier", 1.0))))
            intensity_factor = max(0.75, min(1.20, strategy_intensity * float(week_detail.get("intensity_multiplier", 1.0))))
            weekly = planner.build_week({
                "mission": mission.get("mission_text"),
                "goal": mission.get("mission_text"),
                "specialization": " ".join(mission.get("required_adaptations", [])),
                "event": competition.get("type") if competition else None,
                "phase": phase,
                "bell_system": "Performance",
                "athlete_skill": str(profile.get("training_experience", "Intermediate")).title(),
                "readiness": max(1, min(10, round(float(state.get("readiness", {}).get("current", 70)) / 10))),
                "max_systemic_fatigue": 8 if block.get("target_fatigue") == "high" else 7,
                "training_days": training_days,
                "session_minutes": session_minutes,
                "available_days": available_days,
                "preferred_session_days": {"Long Run": "Saturday", "Long Aerobic": "Saturday"},
                "environment": constraints.get("equipment_location", "Home or Commercial Gym"),
                "available_equipment": equipment,
                "required_equipment_policy": "flexible",
                "weekly_objectives": week_detail.get("objectives") or block.get("objectives"),
                "recent_exercise_ids": recent_exercise_ids[-12:],
            })
            sessions: list[dict[str, Any]] = []
            for index, item in enumerate((x for x in weekly["schedule"] if x.get("session_name")), start=1):
                session_id = f"W{week_number:02d}-S{index:02d}"
                built = _apply_programming_factors(
                    item["session"], volume_factor, intensity_factor, session_minutes
                )
                normalized = _normalize_session(
                    built, session_id, item["day"], week_number, phase,
                    {
                        "block_id": block["block_id"], "block_phase": block["phase"],
                        "week_purpose": week_detail.get("purpose"),
                        "volume_factor": round(volume_factor, 3),
                        "intensity_factor": round(intensity_factor, 3),
                        "digital_twin_strategy": simulation_selected.get("candidate_id", "balanced"),
                    },
                )
                sessions.append(normalized)
                recent_exercise_ids.extend(
                    x.get("exercise_id") for x in normalized.get("exercise_blocks", []) if x.get("exercise_id")
                )
            weeks.append({
                "week": week_number, "phase": block["phase"],
                "objectives": week_detail.get("objectives") or block.get("objectives"),
                "purpose": week_detail.get("purpose"), "testing": week_detail.get("testing", False),
                "schedule": [{k: v for k, v in item.items() if k != "session"} for item in weekly["schedule"]],
                "sessions": sessions,
                "validation": weekly["validation"], "coach_summary": weekly["coach_summary"],
                "decision_trace": weekly["decision_trace"],
            })
    finally:
        planner.close()

    payload = {
        "mission": mission,
        "periodization": orchestrated["periodization"],
        "program": program,
        "weeks": weeks,
        **_compact_plan_summary(orchestrated),
        "engine_manifest": {
            "mission_compiler": mission.get("mission_compiler_version"),
            "periodization": orchestrated["periodization"].get("periodization_engine_version"),
            "block_programming": program.get("block_programming_version"),
            "performance_forecast": (orchestrated.get("forecast") or {}).get("performance_forecast_version"),
            "goal_probability": (orchestrated.get("goal_probability") or {}).get("goal_probability_version"),
            "competition_intelligence": (orchestrated.get("competition") or {}).get("competition_engine_version"),
            "nutrition_periodization": (orchestrated.get("nutrition") or {}).get("nutrition_periodization_version"),
            "pattern_recognition": (orchestrated.get("patterns") or {}).get("pattern_recognition_version"),
            "digital_twin": (orchestrated.get("simulation") or {}).get("digital_twin_simulation_version"),
            "intelligence_orchestrator": orchestrated.get("intelligence_orchestrator_version"),
            "weekly_planner": "0.1.0", "session_builder": "0.1.0", "exercise_selection": "0.1.0",
            "adaptive_coaching": "0.1.0", "coaching_reasoning": "0.1.0", "learning": "0.1.0",
            "athlete_state": state.get("engine_version"), "coaching_language": "0.1.0",
        },
    }
    row = Plan(
        id=uid("plan"), athlete_id=athlete.id, mission_id=mission_row.id,
        plan_json=dumps(payload),
    )
    db.add(row)
    event(db, athlete.id, "program_created", {
        "plan_id": row.id, "weeks": len(weeks),
        "strategy": simulation_selected.get("candidate_id", "balanced"),
        "goal_probability": (orchestrated.get("goal_probability") or {}).get("probability"),
    })
    decision = Decision(
        id=uid("dec"), athlete_id=athlete.id, decision_type="plan_generated",
        payload_json=dumps({
            "plan_id": row.id,
            "selected_strategy": simulation_selected,
            "goal_probability": orchestrated.get("goal_probability"),
            "patterns": orchestrated.get("patterns"),
            "competition": orchestrated.get("competition"),
            "nutrition": orchestrated.get("nutrition"),
            "coaching_language": orchestrated.get("coaching_language"),
            "explanation": "Bell compared candidate strategies, selected a periodization model, built blocks and weeks, then selected and prescribed each exercise under athlete constraints.",
            "engines": list(payload["engine_manifest"].keys()),
        }),
    )
    db.add(decision)
    db.commit()
    return row


def latest_plan(db: Session, athlete_id: str) -> Plan | None:
    return db.scalar(
        select(Plan)
        .where(Plan.athlete_id == athlete_id, Plan.status == "active")
        .order_by(Plan.created_at.desc())
    )


def _session_from_plan(plan_data: dict[str, Any], session_id: str) -> dict[str, Any] | None:
    for week in plan_data.get("weeks", []):
        for session in week.get("sessions", []):
            if session.get("session", {}).get("session_id") == session_id:
                return session
    return None


def _next_session(db: Session, athlete_id: str, plan_data: dict[str, Any]) -> dict[str, Any] | None:
    completed = {
        row.session_id for row in db.scalars(
            select(SessionCompletion).where(SessionCompletion.athlete_id == athlete_id)
        ).all()
    }
    for week in plan_data.get("weeks", []):
        for session in week.get("sessions", []):
            if session.get("session", {}).get("session_id") not in completed:
                return session
    return None


def _ensure_planned_event(db: Session, athlete_id: str, session: dict[str, Any]) -> None:
    session_id = session.get("session", {}).get("session_id")
    rows = db.scalars(
        select(AthleteEvent).where(
            AthleteEvent.athlete_id == athlete_id,
            AthleteEvent.event_type == "workout_planned",
        )
    ).all()
    if any(loads(row.payload_json).get("session_id") == session_id for row in rows):
        return
    event(db, athlete_id, "workout_planned", {
        "session_id": session_id,
        "week": session.get("session", {}).get("week"),
        "session_type": session.get("session_type"),
    })
    db.flush()


def _recovery_session(original: dict[str, Any], title: str, instructions: list[str], minutes: int = 25) -> dict[str, Any]:
    meta = original.get("session", {})
    return {
        "session_type": "recovery",
        "session": {
            **meta, "title": title, "name": title, "session_type": "recovery", "type": "recovery",
            "estimated_minutes": minutes, "requested_minutes": minutes,
        },
        "warmup": {"minutes": 5, "items": ["Easy walk and calm breathing"]},
        "recovery_prescription": instructions,
        "cooldown": {"minutes": 5, "items": ["Reassess symptoms and record response"]},
    }


def _lower_cost_swap(original: dict[str, Any], profile: dict[str, Any], checkin: dict[str, Any]) -> dict[str, Any]:
    slots = [
        copy.deepcopy(item.get("slot", {}))
        for item in original.get("selection_trace", {}).get("slots", [])
        if item.get("slot")
    ]
    if not slots:
        revised = copy.deepcopy(original)
        for block in revised.get("exercise_blocks", []):
            rx = block.get("prescription", {})
            rx["sets"] = max(1, round(int(rx.get("sets", 3)) * 0.65))
            rx["target_rpe"] = min(float(rx.get("target_rpe", 7)), 6.5)
            rx["target_rir"] = max(2.5, 10 - rx["target_rpe"])
        revised["session"]["title"] = "Lower-Cost " + revised["session"].get("title", "Training")
        return revised

    builder = BellSessionBuilder(KB_DATABASE)
    try:
        built = builder.build_session({
            "name": "Lower-Cost " + original.get("session", {}).get("title", "Training"),
            "session_type": original.get("session_type", "strength"),
            "primary_adaptation": original.get("session", {}).get("goal", "General Strength"),
            "bell_system": "Performance", "phase": original.get("session", {}).get("phase", "Build"),
            "athlete_skill": str(profile.get("training_experience", "Intermediate")).title(),
            "readiness": max(1, min(10, round(float(checkin.get("readiness_score", 50)) / 10))),
            "max_systemic_fatigue": 5,
            "session_minutes": int(checkin.get("available_minutes", 45)),
            "environment": "Available Equipment",
            "available_equipment": _flatten_equipment(profile.get("equipment")),
            "required_equipment_policy": "flexible", "strict_pattern": True,
            "slots": slots,
        })
    finally:
        builder.close()
    return _normalize_session(
        built,
        original.get("session", {}).get("session_id", "SWAP"),
        original.get("session", {}).get("day", "Today"),
        int(original.get("session", {}).get("week", 1)),
        original.get("session", {}).get("phase", "Build"),
        {**original.get("programming", {}), "daily_swap": True},
    )


def _apply_reasoning(original: dict[str, Any], adaptive: dict[str, Any], reasoning: dict[str, Any],
                     profile: dict[str, Any], checkin: dict[str, Any]) -> tuple[dict[str, Any], list[dict[str, Any]]]:
    action = reasoning["decision"]["action"]
    changes = copy.deepcopy(reasoning["decision"].get("changes", []))
    adaptive_action = adaptive.get("decision", {}).get("action")

    if adaptive_action == "stop_and_escalate" or action == "escalate":
        return _recovery_session(
            original, "Safety Hold",
            ["Do not train.", "Seek appropriate medical evaluation for the reported red-flag symptom."], 0,
        ), changes
    if adaptive_action == "recovery" or action in ("recovery", "move_session"):
        return _recovery_session(
            original, "Recovery / Session Moved",
            ["Easy pain-free walking or cycling.", "Gentle mobility only where it improves comfort.", "Repeat readiness before hard training."],
            min(30, int(checkin.get("available_minutes", 30))),
        ), changes
    if action == "deload":
        revised = adaptive.get("revised_session") or copy.deepcopy(original)
        if not revised:
            revised = copy.deepcopy(original)
        for block in revised.get("exercise_blocks", []):
            rx = block.get("prescription", {})
            if isinstance(rx.get("sets"), int):
                rx["sets"] = max(1, round(rx["sets"] * 0.60))
            if isinstance(rx.get("target_rpe"), (int, float)):
                rx["target_rpe"] = min(rx["target_rpe"], 6.5)
                rx["target_rir"] = max(3.5, 10 - rx["target_rpe"])
        revised.setdefault("session", {})["title"] = "Micro-Deload: " + revised.get("session", {}).get("title", "Training")
        return revised, changes
    if action == "swap_session":
        return _lower_cost_swap(original, profile, checkin), changes
    if action == "modify_session" or adaptive_action in ("modify_light", "modify_major"):
        revised = adaptive.get("revised_session") or copy.deepcopy(original)
        # Reasoning changes are applied after the Adaptive Engine so the final
        # prescription reflects both readiness rules and competing-action scoring.
        for change in reasoning["decision"].get("changes", []):
            if change.get("type") == "reduce_volume":
                factor = float(change.get("factor", 0.70))
                for block in revised.get("exercise_blocks", []):
                    rx = block.get("prescription", {})
                    if isinstance(rx.get("sets"), int):
                        rx["sets"] = max(1, round(rx["sets"] * factor))
            elif change.get("type") == "cap_rpe":
                cap = float(change.get("value", 7.0))
                for block in revised.get("exercise_blocks", []):
                    rx = block.get("prescription", {})
                    if isinstance(rx.get("target_rpe"), (int, float)):
                        rx["target_rpe"] = min(rx["target_rpe"], cap)
                        rx["target_rir"] = max(1, round(10 - rx["target_rpe"], 1))
        return revised, changes
    return copy.deepcopy(original), changes


def _daily_bcl(mission_row: Mission, checkin: dict[str, Any], readiness: dict[str, Any]) -> dict[str, Any]:
    request = loads(mission_row.request_json)
    text = request.get("coaching_language") or _auto_bcl(request)
    engine = BellCoachingLanguage()
    program = engine.parse(text)
    context = {
        "Readiness": float(readiness.get("score", 70)),
        "Pain": max((checkin.get("pain") or {}).values(), default=0),
        "Sleep": float(checkin.get("sleep_hours", 8)),
    }
    return {"program": program, "context": context, "fired_rules": engine.evaluate_rules(program, context)}


def today_payload(db: Session, athlete_id: str) -> dict[str, Any] | None:
    plan = latest_plan(db, athlete_id)
    if not plan:
        return None
    plan_data = loads(plan.plan_json)
    original = _next_session(db, athlete_id, plan_data)
    if original is None:
        return {"status": "program_complete"}
    _ensure_planned_event(db, athlete_id, original)
    db.commit()

    check = db.scalar(
        select(CheckIn).where(CheckIn.athlete_id == athlete_id).order_by(CheckIn.created_at.desc())
    )
    if not check:
        return {"status": "planned", "original_session": original, "session": original, "adaptation": None}

    # Reuse the audited decision for this exact check-in/session pair.
    prior_rows = db.scalars(
        select(Decision)
        .where(Decision.athlete_id == athlete_id, Decision.decision_type == "daily_adaptation")
        .order_by(Decision.created_at.desc())
    ).all()
    session_id = original.get("session", {}).get("session_id")
    for row in prior_rows:
        payload = loads(row.payload_json)
        if payload.get("checkin_id") == check.id and payload.get("original_session_id") == session_id:
            return {
                "status": payload.get("status", "adapted"), "original_session": original,
                "session": payload.get("revised_session", original),
                "adaptation": {"decision_id": row.id, **payload.get("public", {})},
            }

    checkin = loads(check.payload_json)
    readiness_engine = BellAdaptiveCoachingEngine(ADAPTATION_RULES)
    readiness = readiness_engine.score_readiness(checkin)
    checkin["readiness_score"] = readiness["score"]
    adaptive = readiness_engine.adapt({
        "planned_week": {
            "schedule": [{
                "day": original.get("session", {}).get("day", "Monday"),
                "session_name": original.get("session", {}).get("title", "Training"),
                "status": "training", "session": original,
            }]
        },
        "target_day": original.get("session", {}).get("day", "Monday"),
        "checkin": checkin,
    })

    state = project_state(db, athlete_id)
    mission_row = db.get(Mission, plan.mission_id)
    mission = plan_data.get("mission", {})
    reasoning = BellCoachingReasoningEngine(REASONING_RULES, EVIDENCE_CATALOG).reason({
        "athlete_id": athlete_id,
        "mission": {
            "type": "_".join(mission.get("required_adaptations", [])) or "general_fitness",
            "primary_goal": mission.get("mission_text"),
            "today_session_criticality": 0.86 if original.get("programming", {}).get("week_purpose") in ("specificity", "realization") else 0.70,
        },
        "athlete_state": state,
        "checkin": {
            **checkin,
            "illness_symptoms": any((checkin.get("illness") or {}).values()),
        },
        "planned_session": {
            "name": original.get("session", {}).get("title"),
            "estimated_total_minutes": original.get("session", {}).get("estimated_minutes"),
        },
        "athlete_preference": checkin.get("athlete_preference"),
    })
    bcl = _daily_bcl(mission_row, checkin, readiness) if mission_row else None
    patterns = BellPatternRecognitionEngine().analyze(pattern_events(db, athlete_id))
    profile = _profile(db.get(Athlete, athlete_id))
    revised, changes = _apply_reasoning(original, adaptive, reasoning, profile, checkin)
    status = "planned" if reasoning["decision"]["action"] == "proceed" and adaptive["decision"]["action"] == "proceed" else "adapted"

    public = {
        "readiness": readiness,
        "action": reasoning["decision"],
        "adaptive_action": adaptive["decision"],
        "changes": changes,
        "explanation": reasoning.get("explanation", {}).get("user"),
        "bcl_rules_fired": (bcl or {}).get("fired_rules", []),
        "patterns": patterns.get("patterns", []),
    }
    payload = {
        "checkin_id": check.id, "original_session_id": session_id, "status": status,
        "revised_session": revised, "public": public,
        "adaptive": adaptive, "reasoning": reasoning, "coaching_language": bcl,
        "pattern_recognition": patterns,
        "engines": ["adaptive_coaching", "coaching_reasoning", "coaching_language", "pattern_recognition", "athlete_state"],
    }
    decision = Decision(
        id=uid("dec"), athlete_id=athlete_id, decision_type="daily_adaptation",
        payload_json=dumps(payload),
    )
    db.add(decision)
    db.commit()
    return {
        "status": status, "original_session": original, "session": revised,
        "adaptation": {"decision_id": decision.id, **public},
    }


def learn_from_completion(db: Session, athlete: Athlete, session: dict[str, Any] | None,
                          completion: dict[str, Any]) -> dict[str, Any]:
    profile = _profile(athlete)
    parameters = _learning_parameters(profile)
    session_type = (session or {}).get("session_type", "strength")
    target_parameter = "volume_response" if session_type == "engine" else "intensity_response"
    observations = [{
        "parameter": target_parameter, "predicted": 1.0,
        "actual": float(completion.get("performance_ratio", 1.0)),
    }]
    result = BellLearningEngine().update(parameters, observations, learning_rate=0.08)
    profile["bell_learning_parameters"] = result["parameters"]
    profile["bell_learning_last_update"] = now().isoformat()
    athlete.profile_json = dumps(profile)
    event(db, athlete.id, "learning_updated", {
        "session_id": completion.get("session_id"), "changes": result.get("changes", {}),
        "parameters": result.get("parameters", {}),
    })
    return result


def intelligence_summary(db: Session, athlete_id: str) -> dict[str, Any]:
    plan = latest_plan(db, athlete_id)
    state = project_state(db, athlete_id)
    patterns = BellPatternRecognitionEngine().analyze(pattern_events(db, athlete_id))
    result: dict[str, Any] = {"athlete_state": state, "patterns": patterns}
    if plan:
        data = loads(plan.plan_json)
        result.update({
            "plan_id": plan.id, "mission": data.get("mission"),
            "periodization": data.get("periodization"), "program": data.get("program"),
            "forecast": data.get("forecast"), "goal_probability": data.get("goal_probability"),
            "simulation": data.get("simulation"), "competition": data.get("competition"),
            "nutrition": data.get("nutrition"), "coaching_language": data.get("coaching_language"),
            "engine_manifest": data.get("engine_manifest"),
        })
    athlete = db.get(Athlete, athlete_id)
    result["learning_parameters"] = _learning_parameters(_profile(athlete)) if athlete else {}
    return result


def session_for_completion(db: Session, athlete_id: str, session_id: str) -> dict[str, Any] | None:
    plan = latest_plan(db, athlete_id)
    return _session_from_plan(loads(plan.plan_json), session_id) if plan else None
