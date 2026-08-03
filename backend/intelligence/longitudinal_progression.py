from __future__ import annotations

from copy import deepcopy
from typing import Any

SCHEMA_VERSION = 1
UPWARD = {"progress", "accelerate"}
PROTECTIVE = {"protect", "safety_hold"}
DOWNWARD = {"regress", "rebuild"}
PHASE_LOCKS = {"taper", "event_week", "event", "competition", "recovery", "post_event_recovery"}


def _number(value: Any, default: float = 0.0) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def _clamp(value: float, low: float, high: float) -> float:
    return max(low, min(high, value))


def _channel(value: Any) -> str:
    return "engine" if str(value or "").lower() in {"engine", "running", "cycling", "endurance", "easy_aerobic"} else "strength"


def _phase(value: Any) -> str:
    return str(value or "build").strip().lower().replace("-", "_").replace(" ", "_")


def default_longitudinal_state() -> dict[str, Any]:
    return {
        "schema_version": SCHEMA_VERSION,
        "total_exposures": 0,
        "channels": {
            "strength": {
                "exposures": 0,
                "intensity_target": 1.0,
                "volume_target": 1.0,
                "last_upward_exposure": -99,
                "last_downward_exposure": -99,
                "history": [],
            },
            "engine": {
                "exposures": 0,
                "duration_target": 1.0,
                "last_upward_exposure": -99,
                "last_downward_exposure": -99,
                "history": [],
            },
        },
        "protective_lock": 0,
        "fatigue_score": 0,
        "deload_remaining": 0,
        "last_deload_exposure": -99,
        "history": [],
    }


def _normalize_state(previous: dict[str, Any] | None) -> dict[str, Any]:
    state = default_longitudinal_state()
    if not isinstance(previous, dict):
        return state
    state.update({key: deepcopy(value) for key, value in previous.items() if key not in {"channels", "history"}})
    channels = previous.get("channels") if isinstance(previous.get("channels"), dict) else {}
    for name in ("strength", "engine"):
        supplied = channels.get(name) if isinstance(channels.get(name), dict) else {}
        state["channels"][name].update(deepcopy(supplied))
        state["channels"][name]["history"] = list(supplied.get("history") or [])[-11:]
    state["history"] = list(previous.get("history") or [])[-23:]
    state["schema_version"] = SCHEMA_VERSION
    return state


def _recent_upward(channel_state: dict[str, Any], window: int = 6) -> int:
    history = list(channel_state.get("history") or [])[-window:]
    return sum(1 for item in history if item.get("status") in UPWARD)


def _phase_blocks_upward(phase_id: str) -> bool:
    return phase_id in PHASE_LOCKS or phase_id.startswith("taper") or phase_id.startswith("recovery")


def stabilize_longitudinal_progression(
    raw_decision: dict[str, Any],
    previous_state: dict[str, Any] | None = None,
    context: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Turn a correct single-session decision into a stable multi-week prescription.

    The function preserves event roles and phase intent. It only changes dose factors and
    the timing of progression decisions; it never changes exercise or event specificity.
    """
    context = context or {}
    state = _normalize_state(previous_state)
    channel_name = _channel(context.get("session_type"))
    phase_id = _phase(context.get("phase_id") or context.get("phase"))
    channel_state = state["channels"][channel_name]
    state["total_exposures"] = int(state.get("total_exposures") or 0) + 1
    channel_state["exposures"] = int(channel_state.get("exposures") or 0) + 1
    exposure = channel_state["exposures"]

    raw_status = str(raw_decision.get("status") or "observe")
    reason_codes = list(raw_decision.get("reason_codes") or [])
    status = raw_status
    trace: list[str] = []
    upward_blocked = False

    # Update accumulated fatigue from the raw response before deciding whether a deload is due.
    fatigue = int(state.get("fatigue_score") or 0)
    if raw_status in {"hold"} and set(reason_codes) & {"LOW_READINESS", "SINGLE_DIFFICULT_EXPOSURE"}:
        fatigue += 1
    elif raw_status in DOWNWARD | PROTECTIVE:
        fatigue += 2
    elif raw_status in {"observe", "progress", "accelerate"}:
        fatigue = max(0, fatigue - 1)
    state["fatigue_score"] = min(8, fatigue)

    # Immediate safety decisions always win and start a conservative re-entry lock.
    if raw_status == "safety_hold":
        state["protective_lock"] = max(3, int(state.get("protective_lock") or 0))
        trace.append("Safety hold overrides all progression and starts a three-exposure re-entry lock.")
    elif raw_status == "protect":
        state["protective_lock"] = max(2, int(state.get("protective_lock") or 0))
        trace.append("Pain or technique protection starts a two-exposure re-entry lock.")
    else:
        lock = int(state.get("protective_lock") or 0)
        if lock > 0 and raw_status in {"observe", "progress", "accelerate"}:
            status = "reentry"
            state["protective_lock"] = lock - 1
            upward_blocked = True
            trace.append(f"Protective re-entry lock preserved for {lock - 1} more comparable exposure(s).")

    # Event taper, event week, and recovery phases may absorb or reduce load but never progress it.
    if status in UPWARD and _phase_blocks_upward(phase_id):
        status = "hold"
        upward_blocked = True
        trace.append(f"{phase_id.replace('_', ' ').title()} phase blocks upward progression while preserving event specificity.")

    # A short planned deload is triggered only by repeated fatigue and cannot immediately repeat.
    deload_remaining = int(state.get("deload_remaining") or 0)
    if status not in PROTECTIVE and deload_remaining > 0:
        status = "deload"
        state["deload_remaining"] = deload_remaining - 1
        upward_blocked = True
        trace.append(f"Planned deload continues for {deload_remaining - 1} more exposure(s).")
    elif (
        status in {"hold", "regress"}
        and state["fatigue_score"] >= 4
        and state["total_exposures"] - int(state.get("last_deload_exposure") or -99) >= 6
        and not _phase_blocks_upward(phase_id)
    ):
        status = "deload"
        state["deload_remaining"] = 1
        state["last_deload_exposure"] = state["total_exposures"]
        state["fatigue_score"] = 1
        upward_blocked = True
        trace.append("Accumulated fatigue triggered one two-exposure deload instead of repeated reactive reductions.")

    # Repeated downward signals are consolidated so a bad week cannot cause runaway regression.
    if status in DOWNWARD:
        gap = exposure - int(channel_state.get("last_downward_exposure") or -99)
        if gap < 3:
            status = "hold"
            trace.append("A recent downward adjustment is still active; Bell holds instead of compounding another reduction.")
        else:
            channel_state["last_downward_exposure"] = exposure

    # Upward decisions require spacing and are limited to two in any six comparable exposures.
    if status in UPWARD:
        min_gap = 4 if status == "accelerate" else 3
        gap = exposure - int(channel_state.get("last_upward_exposure") or -99)
        rolling_upward = _recent_upward(channel_state, 6)
        if gap < min_gap or rolling_upward >= 2:
            status = "observe"
            upward_blocked = True
            trace.append("Progression cooldown prevented another increase before the prior change was absorbed.")
        else:
            channel_state["last_upward_exposure"] = exposure

    # Longitudinal target factors. Holds are temporary; progress/regress update the stored target.
    strength = state["channels"]["strength"]
    engine = state["channels"]["engine"]
    if status == "progress":
        if channel_name == "strength":
            strength["intensity_target"] = _clamp(_number(strength.get("intensity_target"), 1.0) * 1.025, .90, 1.10)
            strength["volume_target"] = _clamp(_number(strength.get("volume_target"), 1.0) * 1.04, .70, 1.15)
        else:
            engine["duration_target"] = _clamp(_number(engine.get("duration_target"), 1.0) * 1.05, .75, 1.20)
    elif status == "accelerate":
        if channel_name == "strength":
            strength["intensity_target"] = _clamp(_number(strength.get("intensity_target"), 1.0) * 1.05, .90, 1.10)
            strength["volume_target"] = _clamp(_number(strength.get("volume_target"), 1.0) * 1.08, .70, 1.15)
        else:
            engine["duration_target"] = _clamp(_number(engine.get("duration_target"), 1.0) * 1.10, .75, 1.20)
    elif status in DOWNWARD:
        if channel_name == "strength":
            strength["intensity_target"] = _clamp(_number(strength.get("intensity_target"), 1.0) * _number(raw_decision.get("intensity_factor"), .95), .90, 1.10)
            strength["volume_target"] = _clamp(_number(strength.get("volume_target"), 1.0) * _number(raw_decision.get("volume_factor"), .80), .70, 1.15)
        else:
            engine["duration_target"] = _clamp(_number(engine.get("duration_target"), 1.0) * _number(raw_decision.get("engine_duration_factor"), .85), .75, 1.20)

    intensity = _number(strength.get("intensity_target"), 1.0)
    volume = _number(strength.get("volume_target"), 1.0)
    duration = _number(engine.get("duration_target"), 1.0)
    if status == "hold":
        intensity = max(.90, intensity * .98)
        volume = max(.70, volume * .90)
        duration = max(.75, duration * .92)
    elif status == "reentry":
        intensity = min(intensity, .98)
        volume = min(volume, .90)
        duration = min(duration, .92)
    elif status == "deload":
        intensity = min(intensity, .95)
        volume = min(volume, .75)
        duration = min(duration, .80)
    elif status == "protect":
        intensity = min(intensity, .95)
        volume = min(volume, .75)
        duration = min(duration, .85)
    elif status == "safety_hold":
        intensity = min(intensity, .90)
        volume = min(volume, .60)
        duration = min(duration, .70)

    explanation = str(raw_decision.get("explanation") or "")
    if status != raw_status:
        explanation = (" ".join(trace) + " " + explanation).strip()
    elif trace:
        explanation = (explanation + " " + " ".join(trace)).strip()

    record = {
        "global_exposure": state["total_exposures"],
        "channel_exposure": exposure,
        "channel": channel_name,
        "phase_id": phase_id,
        "raw_status": raw_status,
        "status": status,
        "intensity_factor": round(_clamp(intensity, .90, 1.10), 3),
        "volume_factor": round(_clamp(volume, .60, 1.15), 3),
        "engine_duration_factor": round(_clamp(duration, .70, 1.20), 3),
        "upward_blocked": upward_blocked,
    }
    channel_state["history"] = (list(channel_state.get("history") or []) + [record])[-12:]
    state["history"] = (list(state.get("history") or []) + [record])[-24:]

    decision = {
        **raw_decision,
        "schema_version": SCHEMA_VERSION,
        "status": status,
        "raw_status": raw_status,
        "intensity_factor": record["intensity_factor"],
        "volume_factor": record["volume_factor"],
        "engine_duration_factor": record["engine_duration_factor"],
        "reason_codes": list(dict.fromkeys(reason_codes + (["LONGITUDINAL_STABILITY"] if status != raw_status else []))),
        "explanation": explanation,
        "longitudinal": {
            "channel": channel_name,
            "phase_id": phase_id,
            "global_exposure": state["total_exposures"],
            "channel_exposure": exposure,
            "fatigue_score": state["fatigue_score"],
            "protective_lock": state["protective_lock"],
            "deload_remaining": state["deload_remaining"],
            "upward_blocked": upward_blocked,
            "preserve_event_specificity": True,
            "trace": trace,
        },
        "guardrails": list(dict.fromkeys(list(raw_decision.get("guardrails") or []) + [
            "Upward changes require a progression cooldown.",
            "Repeated reductions are consolidated instead of compounded.",
            "Taper, event week, and recovery phases block upward progression.",
            "Event-specific session roles are never removed by dose adaptation.",
            "Longitudinal targets have hard cumulative ceilings.",
        ])),
    }
    return {"decision": decision, "state": state, "record": record}
