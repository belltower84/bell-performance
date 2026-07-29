from __future__ import annotations

import copy
import json
import re
import uuid
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Athlete, Mission, Plan, CheckIn, AthleteEvent, Decision, SessionCompletion, CoachingMemory
from intelligence.adaptive_coaching import BellAdaptiveCoachingEngine
from intelligence.athlete_state import BellAthleteStateEngine
from intelligence.coaching_language import BellCoachingLanguage
from intelligence.coaching_reasoning import BellCoachingReasoningEngine
from intelligence.coach_intelligence import infer_memory_candidates, build_explanation, build_summary
from intelligence.intelligence_orchestrator import BellIntelligenceOrchestrator
from intelligence.learning_engine import BellLearningEngine
from intelligence.journey_planner import BellJourneyPlanner, event_timeline_weeks
from intelligence.discipline_library import BellDisciplineLibrary
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




def _session_schedule_profile(item: dict[str, Any]) -> dict[str, Any]:
    """Classify a weekly-planner item for concurrent-training scheduling."""
    session = item.get("session") or {}
    meta = session.get("session") or {}
    title = " ".join(str(x or "") for x in (
        item.get("session_name"), item.get("name"), meta.get("title"), meta.get("name"),
        session.get("name"), item.get("detail")
    )).lower()
    session_type = str(session.get("session_type") or meta.get("session_type") or meta.get("type") or "").lower()
    mobility = bool(session_type in {"mobility", "recovery"} or any(x in title for x in ("mobility", "daily reset", "recovery reset")))
    engine = bool(session_type == "engine" or any(x in title for x in ("run", "engine", "interval", "tempo", "threshold", "zone 2", "aerobic", "ruck", "bike", "row"))) and not mobility
    strength = not engine and not mobility
    lower = strength and any(x in title for x in ("lower", "squat", "deadlift", "leg", "hinge"))
    upper = strength and any(x in title for x in ("upper", "bench", "press", "pull")) and not lower
    full = strength and not lower and not upper
    long_engine = engine and any(x in title for x in ("long run", "long aerobic", "long endurance"))
    hard_engine = engine and any(x in title for x in ("interval", "tempo", "threshold", "quality", "sprint", "hill", "vo2"))
    easy_engine = engine and not long_engine and not hard_engine
    return {"mobility": mobility, "engine": engine, "strength": strength, "lower": lower,
            "upper": upper, "full": full, "long_engine": long_engine,
            "hard_engine": hard_engine, "easy_engine": easy_engine}


def _optimize_concurrent_schedule(schedule: list[dict[str, Any]], available_days: list[str]) -> list[dict[str, Any]]:
    """Place primary work before mobility and use evidence-aligned strength/engine pairings."""
    week = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    days = [day for day in week if day in available_days]
    if not days:
        return schedule
    day_index = {day: index for index, day in enumerate(week)}
    primary = [item for item in schedule if not _session_schedule_profile(item)["mobility"]]
    support = [item for item in schedule if _session_schedule_profile(item)["mobility"]]
    assigned: dict[str, list[dict[str, Any]]] = {day: [] for day in days}

    def profiles(day: str) -> list[dict[str, Any]]:
        return [_session_schedule_profile(x) for x in assigned[day]]

    def place(item: dict[str, Any], candidates: list[str], scorer) -> None:
        candidates = candidates or days
        chosen = min(candidates, key=lambda d: scorer(d))
        item["day"] = chosen
        assigned[chosen].append(item)

    # Long endurance gets a dedicated late-week slot whenever possible.
    long_items = [x for x in primary if _session_schedule_profile(x)["long_engine"]]
    remaining = [x for x in primary if x not in long_items]
    for item in long_items:
        target = "Saturday" if "Saturday" in days else days[-1]
        place(item, [target], lambda d: 0)

    # Place strength before engine. Friday is a meaningful strength opportunity when selected.
    strength_items = [x for x in remaining if _session_schedule_profile(x)["strength"]]
    engine_items = [x for x in remaining if _session_schedule_profile(x)["engine"]]
    anchor_templates = {
        2: ["Monday", "Friday"],
        3: ["Monday", "Tuesday", "Friday"],
        4: ["Monday", "Tuesday", "Thursday", "Friday"],
        5: ["Monday", "Tuesday", "Wednesday", "Friday", "Saturday"],
    }
    anchors = [
        day for day in anchor_templates.get(min(5, len(strength_items)), week)
        if day in days and not any(q["long_engine"] for q in profiles(day))
    ]
    for index, item in enumerate(strength_items):
        candidates = [day for day in days if not any(q["long_engine"] for q in profiles(day))]
        target = anchors[index] if index < len(anchors) else next(
            (day for day in candidates if not assigned[day]), candidates[index % len(candidates)]
        )
        place(item, [target], lambda day: 0)

    # Then place engine according to compatibility: upper+engine preferred; lower+hard blocked.
    for item in engine_items:
        p = _session_schedule_profile(item)
        def engine_score(day: str) -> float:
            existing = profiles(day)
            score = len(existing) * 35
            if any(q["long_engine"] for q in existing): score += 500
            if any(q["upper"] for q in existing): score -= 28
            if any(q["lower"] for q in existing):
                score += 18 if p["easy_engine"] else 160
            if any(q["full"] for q in existing): score += 8 if p["easy_engine"] else 75
            # Hard engine should avoid the day immediately before/after lower strength.
            if p["hard_engine"]:
                idx = day_index[day]
                for other in days:
                    if any(q["lower"] for q in profiles(other)) and abs(day_index[other] - idx) <= 1:
                        score += 45
            # Empty midweek days are useful for quality engine sessions.
            if not existing and day in {"Wednesday", "Thursday"}: score -= 8
            return score
        place(item, days, engine_score)

    # Mobility is layered onto an existing training day and never consumes a primary slot.
    for index, item in enumerate(support):
        target = days[min(index, len(days)-1)]
        occupied = [d for d in days if assigned[d]]
        if occupied:
            target = occupied[index % len(occupied)]
        item["day"] = target
        item["support_component"] = True
        assigned[target].append(item)

    optimized: list[dict[str, Any]] = []
    for day in days:
        optimized.extend(assigned[day])
    return optimized

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



def _discipline_exposure_targets(request: dict[str, Any], training_days: int) -> dict[str, int]:
    """Return pathway-appropriate weekly strength and engine exposure targets."""
    constraints = request.get("constraints") or {}
    goal = " ".join(str(x or "") for x in (
        request.get("goal"), request.get("mission_text"), request.get("specialization"),
        " ".join(request.get("priority_order") or [])
    )).lower()
    explicit_strength = int(constraints.get("strength_days") or 0)
    explicit_engine = int(constraints.get("engine_days") or 0)
    if explicit_strength and explicit_engine:
        return {"strength": explicit_strength, "engine": explicit_engine}
    if any(x in goal for x in ("marathon", "half marathon", "10k", "5k", "running")):
        strength, engine = (3, 4) if training_days >= 6 else (2, min(4, training_days))
    elif any(x in goal for x in ("bodybuilding", "physique", "muscle building", "hypertrophy")):
        strength, engine = (5 if training_days >= 6 else 4, 2)
    elif any(x in goal for x in ("powerlifting", "olympic", "strength")) and "hybrid" not in goal:
        strength, engine = (4 if training_days >= 4 else training_days, 2 if training_days >= 5 else 1)
    elif any(x in goal for x in ("hybrid", "body composition", "body recomposition", "general fitness", "athlete", "tactical")):
        strength, engine = (4 if training_days >= 5 else 3, 3 if training_days >= 5 else 2)
    else:
        strength, engine = (4 if training_days >= 5 else 3, 2)
    return {"strength": max(1, strength), "engine": max(0, engine)}

def generate_plan(db: Session, athlete: Athlete, mission_row: Mission) -> Plan:
    """Generate a multiweek program through the full Bell intelligence stack."""
    profile = _profile(athlete)
    state = _state_for_intelligence(project_state(db, athlete.id), profile)
    request = loads(mission_row.request_json)
    # A dated objective owns the planning horizon. Bell no longer forces event
    # preparation into a default 12-week container. The active horizon is
    # capped at 52 weeks and can be regenerated for farther-away events.
    if request.get("competition_date"):
        timeline = event_timeline_weeks(
            request.get("competition_date"),
            fallback=int(request.get("timeline_weeks", 12) or 12),
        )
        request["timeline_weeks"] = int(timeline["planning_horizon_weeks"])
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
    journey_planner = BellJourneyPlanner()
    discipline_library = BellDisciplineLibrary()
    journey = journey_planner.build(request, mission, program, profile, current_week=1)
    discipline = journey.get("discipline") or discipline_library.get(journey.get("identity", ""), journey.get("objective", ""), request.get("goal", ""))
    constraints = mission.get("constraints", {})
    training_days = max(2, min(6, int(constraints.get("training_days", 4))))
    session_minutes = max(20, min(180, int(constraints.get("session_minutes", 60))))
    available_days = constraints.get("available_days") or _default_available_days(training_days)
    exposure_targets = _discipline_exposure_targets(request, training_days)
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
            journey_phase = journey_planner.phase_for_week(journey, week_number)
            phase = _phase_name(block.get("phase"))
            volume_factor = max(0.45, min(1.30, strategy_volume * float(week_detail.get("volume_multiplier", 1.0))))
            intensity_factor = max(0.75, min(1.20, strategy_intensity * float(week_detail.get("intensity_multiplier", 1.0))))
            weekly = planner.build_week({
                "mission": mission.get("mission_text"),
                "goal": mission.get("mission_text"),
                "specialization": " ".join(mission.get("required_adaptations", [])),
                "event": competition.get("type") if competition else None,
                "phase": phase,
                "journey_phase": journey_phase.get("name"),
                "journey_training_emphasis": journey_phase.get("training_emphasis"),
                "identity": journey.get("identity"),
                "objective": journey.get("objective"),
                "discipline": discipline.get("id"),
                "bell_system": "Performance",
                "athlete_skill": str(profile.get("training_experience", "Intermediate")).title(),
                "readiness": max(1, min(10, round(float(state.get("readiness", {}).get("current", 70)) / 10))),
                "max_systemic_fatigue": 8 if block.get("target_fatigue") == "high" else 7,
                "training_days": training_days,
                "strength_days": exposure_targets["strength"],
                "engine_days": exposure_targets["engine"],
                "session_minutes": session_minutes,
                "available_days": available_days,
                "preferred_session_days": {"Long Run": "Saturday", "Long Aerobic": "Saturday"},
                "environment": constraints.get("equipment_location", "Home or Commercial Gym"),
                "available_equipment": equipment,
                "required_equipment_policy": "flexible",
                "weekly_objectives": week_detail.get("objectives") or block.get("objectives"),
                "recent_exercise_ids": recent_exercise_ids[-12:],
            })
            weekly["schedule"] = _optimize_concurrent_schedule(weekly["schedule"], available_days)
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
                        "journey_phase_id": journey_phase.get("id"),
                        "journey_phase": journey_phase.get("name"),
                        "journey_phase_week": week_number - int(journey_phase.get("start_week", week_number)) + 1,
                        "journey_phase_length": int(journey_phase.get("duration_weeks", 1)),
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
                "journey_phase_id": journey_phase.get("id"),
                "journey_phase": journey_phase.get("name"),
                "journey_phase_week": week_number - int(journey_phase.get("start_week", week_number)) + 1,
                "journey_phase_length": int(journey_phase.get("duration_weeks", 1)),
                "journey_purpose": journey_phase.get("purpose"),
                "journey_milestone": journey_phase.get("milestone"),
                "discipline": discipline.get("id"),
                "discipline_label": discipline.get("label"),
                "coaching_rules": weekly.get("coaching_rules", {}),
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
        "journey": journey,
        "discipline": discipline,
        "periodization": orchestrated["periodization"],
        "program": program,
        "weeks": weeks,
        **_compact_plan_summary(orchestrated),
        "engine_manifest": {
            "mission_compiler": mission.get("mission_compiler_version"),
            "journey_planner": journey.get("journey_engine_version"),
            "discipline_library": discipline_library.version,
            "periodization": orchestrated["periodization"].get("periodization_engine_version"),
            "block_programming": program.get("block_programming_version"),
            "performance_forecast": (orchestrated.get("forecast") or {}).get("performance_forecast_version"),
            "goal_probability": (orchestrated.get("goal_probability") or {}).get("goal_probability_version"),
            "competition_intelligence": (orchestrated.get("competition") or {}).get("competition_engine_version"),
            "nutrition_periodization": (orchestrated.get("nutrition") or {}).get("nutrition_periodization_version"),
            "pattern_recognition": (orchestrated.get("patterns") or {}).get("pattern_recognition_version"),
            "digital_twin": (orchestrated.get("simulation") or {}).get("digital_twin_simulation_version"),
            "intelligence_orchestrator": orchestrated.get("intelligence_orchestrator_version"),
            "weekly_planner": "13.2.0", "session_builder": "0.1.0", "exercise_selection": "0.1.0",
            "adaptive_coaching": "0.1.0", "coaching_reasoning": "0.1.0", "learning": "0.1.0",
            "athlete_state": state.get("engine_version"), "coaching_language": "0.1.0",
        },
    }
    row = Plan(
        id=uid("plan"), athlete_id=athlete.id, mission_id=mission_row.id,
        plan_json=dumps(payload),
    )
    db.add(row)
    event(db, athlete.id, "journey_created", {
        "plan_id": row.id,
        "journey": journey.get("name"),
        "mode": journey.get("mode"),
        "identity": journey.get("identity"),
        "objective": journey.get("objective"),
        "weeks": journey.get("total_weeks"),
        "phases": [phase.get("name") for phase in journey.get("phases", [])],
    })
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
            "journey": journey,
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


def coaching_state(db: Session, athlete_id: str, current_week: int | None = None) -> dict[str, Any] | None:
    """Return the canonical Journey-centered state consumed by Mission Control."""
    plan = latest_plan(db, athlete_id)
    if not plan:
        return None
    data = loads(plan.plan_json)
    journey = data.get("journey") or {}
    requested_week = max(1, int(current_week or journey.get("current_week") or 1))
    if journey:
        journey = BellJourneyPlanner().state_for_week(journey, requested_week)
    week = int(journey.get("current_week", requested_week)) if journey else requested_week
    plan_week = int(journey.get("cycle_week", week)) if journey.get("mode") == "continuous_development" else week
    week_payload = next((item for item in data.get("weeks", []) if int(item.get("week", 0)) == plan_week), None)
    return {
        "plan_id": plan.id,
        "journey": journey,
        "current_week": week_payload,
        "mission": data.get("mission"),
        "periodization": data.get("periodization"),
        "priorities": journey.get("priorities", []) if journey else [],
        "discipline": data.get("discipline") or journey.get("discipline"),
        "continuous_policy": journey.get("continuous_policy") if journey else None,
        "next_milestone": journey.get("next_milestone") if journey else None,
        "engine_manifest": data.get("engine_manifest", {}),
    }


def _session_from_plan(plan_data: dict[str, Any], session_id: str) -> dict[str, Any] | None:
    for week in plan_data.get("weeks", []):
        for session in week.get("sessions", []):
            if session.get("session", {}).get("session_id") == session_id:
                return session
    return None


def _completed_session_ids(db: Session, athlete_id: str) -> set[str]:
    return {
        row.session_id for row in db.scalars(
            select(SessionCompletion).where(SessionCompletion.athlete_id == athlete_id)
        ).all()
    }


def _next_session(
    db: Session, athlete_id: str, plan_data: dict[str, Any],
    *, exclude_session_ids: set[str] | None = None,
) -> dict[str, Any] | None:
    completed = _completed_session_ids(db, athlete_id)
    excluded = exclude_session_ids or set()
    for week in plan_data.get("weeks", []):
        for session in week.get("sessions", []):
            session_id = session.get("session", {}).get("session_id")
            if session_id and session_id not in completed and session_id not in excluded:
                return session
    return None


def _normalize_target_date(value: str | None) -> str:
    if value:
        try:
            return date.fromisoformat(value).isoformat()
        except ValueError:
            pass
    return now().date().isoformat()


def _planned_session_ids_for_date(db: Session, athlete_id: str, target_date: str) -> list[str]:
    rows = db.scalars(
        select(AthleteEvent)
        .where(
            AthleteEvent.athlete_id == athlete_id,
            AthleteEvent.event_type == "workout_planned",
        )
        .order_by(AthleteEvent.occurred_at, AthleteEvent.id)
    ).all()
    session_ids: list[str] = []
    legacy_date_seen = False
    for row in rows:
        payload = loads(row.payload_json)
        planned_date = payload.get("scheduled_date")
        is_legacy = not planned_date
        if is_legacy:
            occurred = row.occurred_at
            if occurred.tzinfo is None:
                occurred = occurred.replace(tzinfo=timezone.utc)
            planned_date = occurred.date().isoformat()
        session_id = payload.get("session_id")
        if planned_date != target_date or not session_id:
            continue
        # Before 12.2.2 every /today refresh could mark the next unfinished
        # session as planned on the same date. Honor only the first legacy
        # event for a date so existing beta accounts do not inherit that bug.
        if is_legacy:
            if legacy_date_seen:
                continue
            legacy_date_seen = True
        if session_id not in session_ids:
            session_ids.append(session_id)
    return session_ids


def _session_preview(session: dict[str, Any] | None, scheduled_date: str | None = None) -> dict[str, Any] | None:
    if not session:
        return None
    meta = session.get("session", {})
    return {
        "session_id": meta.get("session_id"),
        "title": meta.get("title") or meta.get("name") or "Training",
        "session_type": session.get("session_type") or meta.get("session_type") or meta.get("type") or "training",
        "estimated_minutes": meta.get("estimated_minutes") or meta.get("requested_minutes"),
        "week": meta.get("week"),
        "day": meta.get("day"),
        "phase": session.get("programming", {}).get("block_phase") or meta.get("phase"),
        "scheduled_date": scheduled_date,
        "preview_only": True,
    }


def _ensure_planned_event(
    db: Session, athlete_id: str, session: dict[str, Any],
    *, scheduled_date: str, plan_id: str | None = None,
) -> None:
    session_id = session.get("session", {}).get("session_id")
    rows = db.scalars(
        select(AthleteEvent).where(
            AthleteEvent.athlete_id == athlete_id,
            AthleteEvent.event_type == "workout_planned",
        )
    ).all()
    for row in rows:
        payload = loads(row.payload_json)
        existing_date = payload.get("scheduled_date")
        if not existing_date:
            occurred = row.occurred_at
            if occurred.tzinfo is None:
                occurred = occurred.replace(tzinfo=timezone.utc)
            existing_date = occurred.date().isoformat()
        if payload.get("session_id") == session_id and existing_date == scheduled_date:
            return
    event(db, athlete_id, "workout_planned", {
        "session_id": session_id,
        "plan_id": plan_id,
        "scheduled_date": scheduled_date,
        "week": session.get("session", {}).get("week"),
        "day": session.get("session", {}).get("day"),
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


def today_payload(db: Session, athlete_id: str, target_date: str | None = None) -> dict[str, Any] | None:
    plan = latest_plan(db, athlete_id)
    if not plan:
        return None
    scheduled_date = _normalize_target_date(target_date)
    plan_data = loads(plan.plan_json)
    completed = _completed_session_ids(db, athlete_id)
    planned_ids = _planned_session_ids_for_date(db, athlete_id, scheduled_date)
    planned_sessions = [
        session for session_id in planned_ids
        if (session := _session_from_plan(plan_data, session_id)) is not None
    ]

    if not planned_sessions:
        original = _next_session(db, athlete_id, plan_data)
        if original is None:
            return {
                "status": "program_complete", "scheduled_date": scheduled_date,
                "session": None, "original_session": None, "adaptation": None,
                "next_session": None, "next_session_preview": None,
            }
        _ensure_planned_event(
            db, athlete_id, original, scheduled_date=scheduled_date, plan_id=plan.id,
        )
        db.commit()
        planned_sessions = [original]
        planned_ids = [original.get("session", {}).get("session_id")]

    remaining_sessions = [
        session for session in planned_sessions
        if session.get("session", {}).get("session_id") not in completed
    ]
    completed_today = [
        session for session in planned_sessions
        if session.get("session", {}).get("session_id") in completed
    ]

    if not remaining_sessions:
        next_session = _next_session(db, athlete_id, plan_data, exclude_session_ids=set(planned_ids))
        try:
            preview_date = (date.fromisoformat(scheduled_date) + timedelta(days=1)).isoformat()
        except ValueError:
            preview_date = None
        return {
            "status": "today_complete", "scheduled_date": scheduled_date,
            "session": None, "original_session": None, "adaptation": None,
            "completed_today": [_session_preview(session, scheduled_date) for session in completed_today],
            "remaining_today": 0,
            "next_session": next_session,
            "next_session_preview": _session_preview(next_session, preview_date),
        }

    original = remaining_sessions[0]

    check = db.scalar(
        select(CheckIn).where(CheckIn.athlete_id == athlete_id).order_by(CheckIn.created_at.desc())
    )
    if not check:
        return {
            "status": "planned", "scheduled_date": scheduled_date,
            "original_session": original, "session": original, "adaptation": None,
            "completed_today": [_session_preview(session, scheduled_date) for session in completed_today],
            "remaining_today": len(remaining_sessions),
            "next_session": None, "next_session_preview": None,
        }

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
                "status": payload.get("status", "adapted"), "scheduled_date": scheduled_date,
                "original_session": original, "session": payload.get("revised_session", original),
                "adaptation": {"decision_id": row.id, **payload.get("public", {})},
                "completed_today": [_session_preview(session, scheduled_date) for session in completed_today],
                "remaining_today": len(remaining_sessions),
                "next_session": None, "next_session_preview": None,
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
        "status": status, "scheduled_date": scheduled_date,
        "original_session": original, "session": revised,
        "adaptation": {"decision_id": decision.id, **public},
        "completed_today": [_session_preview(session, scheduled_date) for session in completed_today],
        "remaining_today": len(remaining_sessions),
        "next_session": None, "next_session_preview": None,
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



def _memory_time(value: Any, fallback: datetime | None = None) -> datetime:
    if isinstance(value, datetime):
        return value
    text = str(value or "").strip().replace("Z", "+00:00")
    if text:
        try:
            parsed = datetime.fromisoformat(text)
            return parsed if parsed.tzinfo else parsed.replace(tzinfo=timezone.utc)
        except ValueError:
            pass
    return fallback or now()


def _memory_payload(row: CoachingMemory) -> dict[str, Any]:
    evidence = loads(row.evidence_json)
    return {
        "id": row.id,
        "memory_key": row.memory_key,
        "category": row.category,
        "observation": row.observation,
        "confidence": round(float(row.confidence or 0), 3),
        "confidence_label": "high" if float(row.confidence or 0) >= .85 else "medium" if float(row.confidence or 0) >= .65 else "low",
        "evidence": evidence,
        "source_type": row.source_type,
        "is_active": bool(row.is_active),
        "first_observed": row.first_observed.isoformat() if row.first_observed else None,
        "last_confirmed": row.last_confirmed.isoformat() if row.last_confirmed else None,
        "reviewable": True,
    }


def list_coaching_memories(db: Session, athlete_id: str, *, active_only: bool = False) -> list[dict[str, Any]]:
    statement = select(CoachingMemory).where(CoachingMemory.athlete_id == athlete_id)
    if active_only:
        statement = statement.where(CoachingMemory.is_active.is_(True))
    rows = db.scalars(statement.order_by(CoachingMemory.is_active.desc(), CoachingMemory.last_confirmed.desc())).all()
    return [_memory_payload(row) for row in rows]


def refresh_coaching_memories(db: Session, athlete_id: str) -> list[dict[str, Any]]:
    athlete = db.get(Athlete, athlete_id)
    profile = _profile(athlete) if athlete else {}
    candidates = infer_memory_candidates(_event_rows(db, athlete_id), profile)
    for candidate in candidates:
        existing = db.scalar(select(CoachingMemory).where(
            CoachingMemory.athlete_id == athlete_id,
            CoachingMemory.memory_key == candidate["memory_key"],
        ))
        evidence = candidate.get("evidence") or {}
        if existing:
            # Athlete removal is authoritative. Refresh evidence, but never reactivate it.
            existing.observation = candidate["observation"]
            existing.category = candidate["category"]
            existing.confidence = candidate["confidence"]
            existing.evidence_json = dumps(evidence)
            existing.last_confirmed = _memory_time(evidence.get("last_confirmed"), now())
        else:
            db.add(CoachingMemory(
                id=uid("mem"), athlete_id=athlete_id,
                memory_key=candidate["memory_key"], category=candidate["category"],
                observation=candidate["observation"], confidence=candidate["confidence"],
                evidence_json=dumps(evidence), source_type=candidate["source_type"],
                is_active=True, first_observed=_memory_time(evidence.get("first_observed")),
                last_confirmed=_memory_time(evidence.get("last_confirmed")),
            ))
    db.flush()
    return list_coaching_memories(db, athlete_id)


def create_explicit_coaching_memory(db: Session, athlete_id: str, body: dict[str, Any]) -> dict[str, Any]:
    observation = str(body.get("observation") or "").strip()
    supplied = str(body.get("memory_key") or "").strip()
    memory_key = supplied or f"explicit:{re.sub(r'[^a-z0-9]+', '-', observation.lower()).strip('-')[:140]}"
    existing = db.scalar(select(CoachingMemory).where(
        CoachingMemory.athlete_id == athlete_id, CoachingMemory.memory_key == memory_key,
    ))
    evidence = {"athlete_statement": observation, **(body.get("evidence") or {})}
    if existing:
        existing.observation = observation
        existing.category = str(body.get("category") or "athlete_preference")
        existing.confidence = 1.0
        existing.evidence_json = dumps(evidence)
        existing.source_type = "athlete_explicit"
        existing.is_active = True
        existing.last_confirmed = now()
        row = existing
    else:
        row = CoachingMemory(
            id=uid("mem"), athlete_id=athlete_id, memory_key=memory_key,
            category=str(body.get("category") or "athlete_preference"), observation=observation,
            confidence=1.0, evidence_json=dumps(evidence), source_type="athlete_explicit",
            is_active=True, first_observed=now(), last_confirmed=now(),
        )
        db.add(row)
    event(db, athlete_id, "coaching_memory_confirmed", {"memory_key": memory_key, "observation": observation})
    db.flush()
    return _memory_payload(row)


def deactivate_coaching_memory(db: Session, athlete_id: str, memory_id: str) -> dict[str, Any] | None:
    row = db.scalar(select(CoachingMemory).where(
        CoachingMemory.id == memory_id, CoachingMemory.athlete_id == athlete_id,
    ))
    if not row:
        return None
    row.is_active = False
    row.last_confirmed = now()
    event(db, athlete_id, "coaching_memory_removed", {"memory_id": memory_id, "memory_key": row.memory_key})
    db.flush()
    return _memory_payload(row)


def adaptation_history(db: Session, athlete_id: str, limit: int = 25) -> list[dict[str, Any]]:
    rows = db.scalars(
        select(Decision).where(Decision.athlete_id == athlete_id)
        .order_by(Decision.created_at.desc()).limit(max(1, min(100, limit)))
    ).all()
    history = []
    for row in rows:
        payload = loads(row.payload_json)
        public = payload.get("public") or {}
        explanation = public.get("explanation") or payload.get("explanation") or (payload.get("reasoning") or {}).get("explanation", {}).get("user")
        history.append({
            "id": row.id, "type": row.decision_type, "created_at": row.created_at.isoformat(),
            "status": payload.get("status"), "explanation": explanation,
            "changes": public.get("changes") or payload.get("changes") or [],
            "known_inputs": [key for key in ("checkin_id", "original_session_id", "plan_id") if payload.get(key)],
        })
    return history


def coach_intelligence_payload(db: Session, athlete_id: str) -> dict[str, Any]:
    refresh_coaching_memories(db, athlete_id)
    memories = list_coaching_memories(db, athlete_id, active_only=True)
    state = coaching_state(db, athlete_id) or {}
    journey = state.get("journey") or {}
    current_today = today_payload(db, athlete_id) if latest_plan(db, athlete_id) else {}
    context = {
        "journey": journey, "discipline": state.get("discipline") or {},
        "today": current_today or {}, "memories": memories,
        "next_milestone": state.get("next_milestone"),
    }
    topics = ("mission", "phase", "progression", "weekly_plan", "recovery", "nutrition", "milestone", "adaptation")
    explanations = {topic: build_explanation(topic, context) for topic in topics}
    return {
        "coach_engine_version": "13.4.0",
        "summary": build_summary(context),
        "explanations": explanations,
        "memories": memories,
        "adaptation_history": adaptation_history(db, athlete_id),
        "trust": {
            "memory_policy": "Repeated evidence is required unless the athlete explicitly states a preference or limitation.",
            "athlete_controls": ["review", "add", "remove"],
            "certainty_policy": "Known, inferred, and missing information are separated in every explanation.",
        },
    }
