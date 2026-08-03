from __future__ import annotations

from copy import deepcopy
from hashlib import sha256
from typing import Any

SCHEMA_VERSION = 1
CHANNELS = {"strength", "engine"}
UPWARD = {"progress", "accelerate"}
DOWNWARD = {"regress", "rebuild"}
PROTECTIVE = {"protect", "safety_hold", "reentry", "deload"}


def _number(value: Any, fallback: float = 1.0) -> float:
    try:
        number = float(value)
    except (TypeError, ValueError):
        return fallback
    return number


def _clamp(value: float, minimum: float, maximum: float) -> float:
    return max(minimum, min(maximum, value))


def _session_id(session: dict[str, Any]) -> str:
    return str((session.get("session") or {}).get("session_id") or session.get("session_id") or "")


def _session_type(session: dict[str, Any]) -> str:
    value = str(session.get("session_type") or (session.get("session") or {}).get("session_type") or "strength").lower()
    return "engine" if value in {"engine", "running", "cycling", "endurance"} else "strength"


def _roles(session: dict[str, Any]) -> dict[str, Any]:
    programming = session.get("programming") or {}
    return {
        key: deepcopy(value)
        for key, value in {
            "event_role": session.get("event_role"),
            "session_role": session.get("session_role"),
            "endurance_role": session.get("endurance_role"),
            "exercise_role": session.get("exercise_role"),
            "physique_role": session.get("physique_role"),
            "block_phase": programming.get("block_phase"),
            "journey_phase_id": programming.get("journey_phase_id"),
        }.items()
        if value not in (None, "")
    }


def _exercise_key(value: Any) -> str:
    import re
    return re.sub(r"(^-|-$)", "", re.sub(r"[^a-z0-9]+", "-", str(value or "").strip().lower()))


def _protected_substitute(name: str) -> str:
    value = name.lower()
    if "squat" in value:
        return "Pain-Free Box Squat Variation"
    if "deadlift" in value or "hinge" in value:
        return "Pain-Free Supported Hinge Variation"
    if "bench" in value or "chest press" in value:
        return "Pain-Free Neutral-Grip Press Variation"
    if "overhead" in value or "shoulder press" in value:
        return "Pain-Free Landmine Press Variation"
    if "row" in value or "pull" in value:
        return "Pain-Free Chest-Supported Pull Variation"
    if "lunge" in value or "split squat" in value:
        return "Pain-Free Supported Single-Leg Variation"
    return f"Pain-Free {name} Variation"


def build_prescription_application(
    decision: dict[str, Any],
    exercise_decisions: list[dict[str, Any]] | None,
    source_session_id: str,
    *,
    source_session_type: str | None = None,
    created_at: str | None = None,
) -> dict[str, Any]:
    longitudinal = decision.get("longitudinal") or {}
    channel = str(longitudinal.get("channel") or source_session_type or "strength").lower()
    channel = "engine" if channel in {"engine", "running", "cycling", "endurance"} else "strength"
    token = "|".join([
        str(source_session_id),
        str(decision.get("status") or "observe"),
        str(longitudinal.get("global_exposure") or "0"),
        str(longitudinal.get("channel_exposure") or "0"),
    ])
    application_id = "rxapp-" + sha256(token.encode("utf-8")).hexdigest()[:16]
    status = str(decision.get("status") or "observe")
    return {
        "schema_version": SCHEMA_VERSION,
        "application_id": application_id,
        "source_session_id": source_session_id,
        "target_session_id": None,
        "channel": channel,
        "status": status,
        "intensity_factor": round(_clamp(_number(decision.get("intensity_factor"), 1.0), .90, 1.10), 3),
        "volume_factor": round(_clamp(_number(decision.get("volume_factor"), 1.0), .60, 1.15), 3),
        "engine_duration_factor": round(_clamp(_number(decision.get("engine_duration_factor"), 1.0), .70, 1.20), 3),
        "exercise_decisions": deepcopy(exercise_decisions or []),
        "reason_codes": list(decision.get("reason_codes") or []),
        "explanation": decision.get("explanation") or "",
        "created_at": created_at,
        "scope": "next_comparable_exposure",
        "state": "pending",
        "preserve_event_specificity": True,
    }


def _exercise_decision_map(application: dict[str, Any]) -> dict[str, dict[str, Any]]:
    result: dict[str, dict[str, Any]] = {}
    for item in application.get("exercise_decisions") or []:
        key = str(item.get("exercise_key") or _exercise_key(item.get("exercise_name")))
        if key:
            result[key] = item
    return result


def _apply_load_factor(rx: dict[str, Any], factor: float) -> list[dict[str, Any]]:
    changes: list[dict[str, Any]] = []
    for key in ("load_kg", "target_load", "working_load", "percentage_1rm"):
        if isinstance(rx.get(key), (int, float)):
            before = float(rx[key])
            after = round(before * factor, 2)
            rx[key] = after
            changes.append({"field": key, "before": before, "after": after})
    return changes


def _recovery_replacement(original: dict[str, Any], application: dict[str, Any]) -> dict[str, Any]:
    meta = deepcopy(original.get("session") or {})
    roles = _roles(original)
    minutes = min(25, int(meta.get("estimated_minutes") or meta.get("requested_minutes") or 20))
    replacement = {
        "session_type": "recovery",
        "session": {
            **meta,
            "title": "Athlete Response Safety Hold",
            "name": "Athlete Response Safety Hold",
            "session_type": "recovery",
            "type": "recovery",
            "estimated_minutes": minutes,
            "requested_minutes": minutes,
        },
        "warmup": {"minutes": 5, "items": ["Easy pain-free movement and calm breathing"]},
        "recovery_prescription": [
            "Do not repeat the painful or red-flag hard exposure.",
            "Use only easy, pain-free movement when appropriate.",
            "Reassess symptoms before hard training and seek qualified evaluation for red-flag symptoms.",
        ],
        "cooldown": {"minutes": 5, "items": ["Record symptoms and response"]},
        "programming": deepcopy(original.get("programming") or {}),
    }
    replacement["programming"].update({
        "closed_loop_original_identity": {"session_id": _session_id(original), "session_type": _session_type(original), "roles": roles},
        "closed_loop_application": deepcopy(application),
        "athlete_response_adjustment": {
            "status": application.get("status"),
            "intensity_factor": application.get("intensity_factor"),
            "volume_factor": application.get("volume_factor"),
            "engine_duration_factor": application.get("engine_duration_factor"),
            "explanation": application.get("explanation"),
            "reason_codes": application.get("reason_codes") or [],
        },
        "event_specificity_preserved": True,
    })
    replacement["programming"]["closed_loop_application"]["state"] = "applied"
    return replacement


def apply_prescription_application(session: dict[str, Any], application: dict[str, Any]) -> dict[str, Any]:
    """Apply one absolute closed-loop decision to one future session.

    The application is idempotent and channel-specific. It changes dose, not mission
    identity or canonical event roles. A safety hold is the only case that replaces
    hard training with recovery, while retaining the original identity in metadata.
    """
    revised = deepcopy(session)
    if not isinstance(application, dict):
        return revised
    existing = (revised.get("programming") or {}).get("closed_loop_application") or {}
    if existing.get("application_id") == application.get("application_id"):
        return revised
    if _session_type(revised) != application.get("channel"):
        return revised

    roles_before = _roles(revised)
    status = str(application.get("status") or "observe")
    if status == "safety_hold":
        return _recovery_replacement(revised, application)

    intensity = _clamp(_number(application.get("intensity_factor"), 1.0), .90, 1.10)
    volume = _clamp(_number(application.get("volume_factor"), 1.0), .60, 1.15)
    duration = _clamp(_number(application.get("engine_duration_factor"), 1.0), .70, 1.20)
    changes: list[dict[str, Any]] = []
    exercise_map = _exercise_decision_map(application)

    if _session_type(revised) == "engine":
        meta = revised.setdefault("session", {})
        for key in ("estimated_minutes", "requested_minutes"):
            if isinstance(meta.get(key), (int, float)):
                before = float(meta[key])
                after = max(10, round(before * duration))
                meta[key] = after
                changes.append({"field": f"session.{key}", "before": before, "after": after})
        rx = revised.get("engine_prescription") or {}
        if isinstance(rx.get("duration_minutes"), (int, float)):
            before = float(rx["duration_minutes"])
            after = max(10, round(before * duration))
            rx["duration_minutes"] = after
            changes.append({"field": "engine_prescription.duration_minutes", "before": before, "after": after})
    else:
        for block in revised.get("exercise_blocks") or []:
            rx = block.setdefault("prescription", {})
            original_name = str(block.get("name") or block.get("exercise_name") or block.get("exercise_id") or "Exercise")
            key = _exercise_key(block.get("exercise_id") or original_name)
            exercise_decision = exercise_map.get(key) or exercise_map.get(_exercise_key(original_name))
            if isinstance(rx.get("sets"), int):
                before_sets = int(rx["sets"])
                after_sets = max(1, min(10, round(before_sets * volume)))
                rx["sets"] = after_sets
                if before_sets != after_sets:
                    changes.append({"exercise": original_name, "field": "sets", "before": before_sets, "after": after_sets})

            load_factor = intensity
            if exercise_decision:
                exercise_status = str(exercise_decision.get("status") or "hold")
                if exercise_status == "progress":
                    load_factor = max(intensity, _number(exercise_decision.get("load_factor"), 1.025))
                elif exercise_status == "regress":
                    load_factor = min(intensity, _number(exercise_decision.get("load_factor"), .95))
                elif exercise_status == "hold":
                    load_factor = min(intensity, 1.0)
                elif exercise_status == "protect":
                    load_factor = min(intensity, .80)
                    substitute = _protected_substitute(original_name)
                    block["closed_loop_original_exercise"] = original_name
                    block["name"] = substitute
                    block["exercise_name"] = substitute
                    block["protected_substitution"] = True
                    block["substitution_note"] = "Use only a pain-free variation and stop if symptoms worsen."
                    if isinstance(rx.get("sets"), int):
                        rx["sets"] = min(rx["sets"], 2)
                    changes.append({"exercise": original_name, "field": "exercise", "before": original_name, "after": substitute})
            changes.extend({"exercise": original_name, **item} for item in _apply_load_factor(rx, load_factor))
            if isinstance(rx.get("target_rpe"), (int, float)):
                before_rpe = float(rx["target_rpe"])
                cap = 9.0
                if status == "hold": cap = 7.5
                elif status in {"regress", "rebuild", "protect", "reentry"}: cap = 7.0
                elif status == "deload": cap = 6.5
                if exercise_decision and exercise_decision.get("status") == "protect": cap = 6.0
                rx["target_rpe"] = min(before_rpe, cap)
                rx["target_rir"] = max(1, round(10 - float(rx["target_rpe"]), 1))
                if before_rpe != rx["target_rpe"]:
                    changes.append({"exercise": original_name, "field": "target_rpe", "before": before_rpe, "after": rx["target_rpe"]})

    programming = revised.setdefault("programming", {})
    applied = deepcopy(application)
    applied["state"] = "applied"
    applied["target_session_id"] = _session_id(revised)
    applied["changes"] = changes
    applied["roles_before"] = roles_before
    applied["roles_after"] = _roles(revised)
    applied["identity_invariant"] = {
        "session_id_preserved": _session_id(revised) == _session_id(session),
        "session_type_preserved": _session_type(revised) == _session_type(session),
        "event_roles_preserved": roles_before == _roles(revised),
    }
    programming["closed_loop_application"] = applied
    programming["athlete_response_adjustment"] = {
        "status": application.get("status"),
        "intensity_factor": application.get("intensity_factor"),
        "volume_factor": application.get("volume_factor"),
        "engine_duration_factor": application.get("engine_duration_factor"),
        "explanation": application.get("explanation"),
        "reason_codes": application.get("reason_codes") or [],
    }
    programming["event_specificity_preserved"] = roles_before == _roles(revised)
    return revised


def apply_application_to_plan(
    plan_data: dict[str, Any],
    application: dict[str, Any],
    *,
    source_session_id: str,
    completed_session_ids: set[str] | None = None,
) -> dict[str, Any]:
    revised = deepcopy(plan_data)
    completed = completed_session_ids or set()
    ordered: list[tuple[int, int, dict[str, Any]]] = []
    for week_index, week in enumerate(revised.get("weeks") or []):
        for session_index, session in enumerate(week.get("sessions") or []):
            ordered.append((week_index, session_index, session))
    source_index = next((i for i, (_, _, item) in enumerate(ordered) if _session_id(item) == source_session_id), -1)
    for index, (week_index, session_index, session) in enumerate(ordered):
        sid = _session_id(session)
        if index <= source_index or not sid or sid in completed:
            continue
        if _session_type(session) != application.get("channel"):
            continue
        targeted = deepcopy(application)
        targeted["target_session_id"] = sid
        targeted["target_week"] = (revised.get("weeks") or [])[week_index].get("week")
        targeted["target_session_index"] = session_index
        targeted["state"] = "scheduled"
        applied_session = apply_prescription_application(session, targeted)
        revised["weeks"][week_index]["sessions"][session_index] = applied_session
        applied_meta = (applied_session.get("programming") or {}).get("closed_loop_application") or targeted
        return {
            "plan": revised,
            "application": applied_meta,
            "applied": True,
            "target_session_id": sid,
            "target_week": targeted.get("target_week"),
        }
    pending = deepcopy(application)
    pending["state"] = "awaiting_future_session"
    return {"plan": revised, "application": pending, "applied": False, "target_session_id": None, "target_week": None}
