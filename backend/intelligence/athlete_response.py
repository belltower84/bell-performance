from __future__ import annotations

from dataclasses import dataclass
from statistics import mean
from typing import Any, Iterable

SCHEMA_VERSION = 1
RED_FLAG_SYMPTOMS = {
    "chest_pain", "fainting", "syncope", "new_neurologic_symptom",
    "severe_shortness_of_breath", "acute_trauma", "loss_of_function",
}


def _number(value: Any, default: float | None = None) -> float | None:
    try:
        number = float(value)
    except (TypeError, ValueError):
        return default
    return number


def _clamp(value: float, low: float, high: float) -> float:
    return max(low, min(high, value))


def _max_numeric(values: Any) -> float:
    if isinstance(values, dict):
        seq: Iterable[Any] = values.values()
    elif isinstance(values, list):
        seq = values
    else:
        seq = [values]
    numbers = [_number(item) for item in seq]
    return max((item for item in numbers if item is not None), default=0.0)


def _completion_type(completion: dict[str, Any]) -> str:
    value = str(
        completion.get("session_type")
        or completion.get("actual", {}).get("session_type")
        or completion.get("adaptation_type")
        or "strength"
    ).lower()
    return "engine" if value in {"engine", "running", "cycling", "endurance", "easy_aerobic"} else "strength"


def _exercise_key(value: Any) -> str:
    return "-".join("".join(ch.lower() if ch.isalnum() else " " for ch in str(value or "")).split())


def normalize_completion(completion: dict[str, Any]) -> dict[str, Any]:
    actual = completion.get("actual") if isinstance(completion.get("actual"), dict) else {}
    planned = completion.get("planned") if isinstance(completion.get("planned"), dict) else {}
    feedback = completion.get("feedback") if isinstance(completion.get("feedback"), dict) else {}
    readiness = completion.get("readiness") if isinstance(completion.get("readiness"), dict) else {}

    session_rpe = _number(
        completion.get("session_rpe", actual.get("session_rpe", feedback.get("session_rpe"))), 7.0
    )
    if session_rpe is None:
        session_rpe = 7.0
    performance_ratio = _number(
        completion.get("performance_ratio", actual.get("performance_ratio")), 1.0
    )
    if performance_ratio is None:
        performance_ratio = 1.0

    duration = _number(completion.get("duration_minutes", actual.get("duration_minutes")), 0.0)
    duration = 0.0 if duration is None else duration
    planned_duration = _number(planned.get("duration_minutes"), duration)
    planned_duration = duration if planned_duration is None else planned_duration
    duration_ratio = duration / planned_duration if planned_duration > 0 else performance_ratio

    pain = completion.get("pain")
    if pain is None:
        pain = actual.get("pain", feedback.get("pain", {}))
    pain_severity = _max_numeric(pain)
    technique_issues = completion.get("technique_issues") or actual.get("technique_issues") or []
    if isinstance(technique_issues, str):
        technique_issues = [technique_issues] if technique_issues.strip() else []

    symptoms = completion.get("symptoms") or feedback.get("symptoms") or []
    if isinstance(symptoms, str):
        symptoms = [symptoms]
    symptom_keys = {_exercise_key(item).replace("-", "_") for item in symptoms}

    exercise_results = completion.get("exercise_results") or actual.get("exercise_results") or []
    engine_results = completion.get("engine_results") or actual.get("engine_results") or {}
    readiness_score = _number(readiness.get("score", completion.get("readiness_score")))

    return {
        "schema_version": int(completion.get("schema_version") or SCHEMA_VERSION),
        "session_id": completion.get("session_id"),
        "session_type": _completion_type(completion),
        "duration_minutes": round(duration, 2),
        "planned_duration_minutes": round(planned_duration, 2),
        "duration_ratio": round(_clamp(duration_ratio, 0.0, 2.0), 3),
        "session_rpe": round(_clamp(session_rpe, 0.0, 10.0), 2),
        "performance_ratio": round(_clamp(performance_ratio, 0.0, 2.0), 3),
        "pain_severity": round(_clamp(pain_severity, 0.0, 10.0), 2),
        "technique_issues": [str(item) for item in technique_issues if str(item).strip()],
        "symptoms": sorted(symptom_keys),
        "readiness_score": readiness_score,
        "difficulty": str(completion.get("difficulty") or feedback.get("difficulty") or "").lower(),
        "exercise_results": exercise_results if isinstance(exercise_results, list) else [],
        "engine_results": engine_results if isinstance(engine_results, dict) else {},
        "notes": completion.get("notes"),
    }


def _success(item: dict[str, Any]) -> bool:
    return (
        item["performance_ratio"] >= 0.95
        and item["duration_ratio"] >= 0.90
        and item["session_rpe"] <= 8.5
        and item["pain_severity"] < 4
        and not item["technique_issues"]
    )


def _rapid_success(item: dict[str, Any]) -> bool:
    return (
        item["performance_ratio"] >= 1.05
        and item["duration_ratio"] >= 0.95
        and item["session_rpe"] <= 7.0
        and item["pain_severity"] < 3
        and not item["technique_issues"]
    )


def _struggle(item: dict[str, Any]) -> bool:
    return (
        item["performance_ratio"] < 0.85
        or item["duration_ratio"] < 0.75
        or item["session_rpe"] >= 9.5
        or item["pain_severity"] >= 4
    )


def _decision(
    status: str,
    *,
    intensity: float = 1.0,
    volume: float = 1.0,
    engine_duration: float = 1.0,
    reason_codes: list[str],
    explanation: str,
    confidence: float,
) -> dict[str, Any]:
    return {
        "status": status,
        "intensity_factor": round(_clamp(intensity, 0.90, 1.05), 3),
        "volume_factor": round(_clamp(volume, 0.60, 1.10), 3),
        "engine_duration_factor": round(_clamp(engine_duration, 0.70, 1.10), 3),
        "reason_codes": reason_codes,
        "explanation": explanation,
        "confidence": round(_clamp(confidence, 0.0, 1.0), 3),
        "guardrails": [
            "No catch-up volume after missed training.",
            "Pain and red-flag symptoms block progression.",
            "One exceptional session cannot trigger accelerated progression.",
            "Intensity changes are capped at five percent per evaluation.",
            "Endurance duration changes are capped at ten percent per evaluation.",
        ],
    }


def evaluate_athlete_response(
    completion: dict[str, Any],
    recent_completions: list[dict[str, Any]] | None = None,
    context: dict[str, Any] | None = None,
) -> dict[str, Any]:
    current = normalize_completion(completion)
    context = context or {}
    recent = [normalize_completion(item) for item in (recent_completions or [])]
    same_type = [item for item in recent if item["session_type"] == current["session_type"]][-5:]
    window = (same_type + [current])[-5:]

    success_streak = 0
    rapid_streak = 0
    struggle_streak = 0
    for item in reversed(window):
        if _success(item):
            success_streak += 1
        else:
            break
    for item in reversed(window):
        if _rapid_success(item):
            rapid_streak += 1
        else:
            break
    for item in reversed(window):
        if _struggle(item):
            struggle_streak += 1
        else:
            break

    compliance = _number(context.get("compliance"))
    session_completion = _number(context.get("session_completion"))
    missed_sessions = int(_number(context.get("missed_sessions"), 0) or 0)
    interruption_days = int(_number(context.get("interruption_days"), 0) or 0)
    low_session_completion = session_completion is not None and session_completion < .55
    legacy_low_completion = session_completion is None and compliance is not None and compliance < .55
    low_readiness = current["readiness_score"] is not None and current["readiness_score"] < 55
    red_flags = sorted(set(current["symptoms"]) & RED_FLAG_SYMPTOMS)

    if red_flags or current["pain_severity"] >= 7:
        decision = _decision(
            "safety_hold", intensity=.90, volume=.60, engine_duration=.70,
            reason_codes=["RED_FLAG_SYMPTOM" if red_flags else "SEVERE_PAIN"],
            explanation="Progression is stopped. Bell will substitute or remove painful loading and require reassessment before hard training.",
            confidence=.98,
        )
    elif current["pain_severity"] >= 4 or current["technique_issues"]:
        decision = _decision(
            "protect", intensity=.95, volume=.75, engine_duration=.85,
            reason_codes=["PAIN_OR_TECHNIQUE_LIMIT"],
            explanation="The next exposure is protected. Bell holds load, reduces nonessential work, and favors pain-free technique or a purpose-matched substitution.",
            confidence=.93,
        )
    elif interruption_days >= 10 or low_session_completion or legacy_low_completion or missed_sessions >= 3:
        reason = "INTERRUPTION" if interruption_days >= 10 else "LOW_SESSION_COMPLETION" if low_session_completion else "LOW_WEEKLY_ADHERENCE" if missed_sessions >= 3 else "LOW_COMPLETION"
        decision = _decision(
            "rebuild", intensity=.95, volume=.80, engine_duration=.85,
            reason_codes=[reason],
            explanation="Bell rebuilds the last successful exposure instead of adding catch-up work. Progression resumes after consistency returns.",
            confidence=.90,
        )
    elif struggle_streak >= 2:
        decision = _decision(
            "regress", intensity=.95, volume=.80, engine_duration=.85,
            reason_codes=["REPEATED_UNDERPERFORMANCE"],
            explanation="Two or more difficult exposures show that the current dose is not being absorbed. Bell reduces the next prescription and rebuilds from successful work.",
            confidence=.91,
        )
    elif low_readiness or _struggle(current) or current["difficulty"] in {"very_hard", "hard"}:
        decision = _decision(
            "hold", intensity=.98, volume=.90, engine_duration=.92,
            reason_codes=["LOW_READINESS" if low_readiness else "SINGLE_DIFFICULT_EXPOSURE"],
            explanation="Bell holds progression and trims optional load. One difficult day is not treated as failure, but it does not earn a harder prescription.",
            confidence=.78,
        )
    elif rapid_streak >= 3:
        decision = _decision(
            "accelerate", intensity=1.05, volume=1.08, engine_duration=1.10,
            reason_codes=["RAPID_POSITIVE_RESPONSE"],
            explanation="Three consecutive high-quality exposures were completed with reserve. Bell advances within strict load and duration caps.",
            confidence=.91,
        )
    elif success_streak >= 2:
        decision = _decision(
            "progress", intensity=1.025, volume=1.04, engine_duration=1.05,
            reason_codes=["REPEATED_SUCCESS"],
            explanation="Two consecutive quality exposures support a measured progression. Bell increases only the smallest useful dose.",
            confidence=.86,
        )
    else:
        decision = _decision(
            "observe", reason_codes=["MORE_EVIDENCE_REQUIRED"],
            explanation="The session was recorded, but Bell needs another comparable exposure before changing the prescription.",
            confidence=.62,
        )

    response_values = [item["performance_ratio"] for item in window]
    rpe_values = [item["session_rpe"] for item in window]
    decision.update({
        "schema_version": SCHEMA_VERSION,
        "session_type": current["session_type"],
        "evidence": {
            "sample_size": len(window),
            "success_streak": success_streak,
            "rapid_success_streak": rapid_streak,
            "struggle_streak": struggle_streak,
            "mean_performance_ratio": round(mean(response_values), 3) if response_values else None,
            "mean_session_rpe": round(mean(rpe_values), 2) if rpe_values else None,
            "current": current,
            "context": {
                "compliance": compliance,
                "missed_sessions": missed_sessions,
                "interruption_days": interruption_days,
            },
        },
    })
    return decision


def exercise_progression_decisions(
    completion: dict[str, Any],
    recent_completions: list[dict[str, Any]] | None = None,
) -> list[dict[str, Any]]:
    current = normalize_completion(completion)
    history = [normalize_completion(item) for item in (recent_completions or [])]
    prior_results: dict[str, list[dict[str, Any]]] = {}
    for item in history:
        for result in item.get("exercise_results", []):
            key = _exercise_key(result.get("name"))
            if key:
                prior_results.setdefault(key, []).append(result)

    decisions: list[dict[str, Any]] = []
    for result in current.get("exercise_results", []):
        name = str(result.get("name") or "Exercise")
        key = _exercise_key(name)
        completion_ratio = _number(result.get("completion_ratio"), 1.0)
        completion_ratio = 0.0 if completion_ratio is None else completion_ratio
        rep_ratio = _number(result.get("rep_ratio"), completion_ratio)
        rep_ratio = completion_ratio if rep_ratio is None else rep_ratio
        avg_rpe = _number(result.get("average_rpe"), current["session_rpe"])
        avg_rpe = current["session_rpe"] if avg_rpe is None else avg_rpe
        avg_rir = _number(result.get("average_rir"))
        pain = _max_numeric(result.get("pain", 0))
        technique = bool(result.get("technique_issue"))

        prior = prior_results.get(key, [])[-2:]
        prior_success = [
            (_number(item.get("completion_ratio"), 0) or 0) >= .95
            and (_number(item.get("average_rpe"), 8) or 8) <= 8.5
            and not item.get("technique_issue")
            and _max_numeric(item.get("pain", 0)) < 4
            for item in prior
        ]
        prior_struggle = [
            (_number(item.get("completion_ratio"), 1) or 1) < .85
            or (_number(item.get("average_rpe"), 0) or 0) >= 9.5
            for item in prior
        ]

        if pain >= 4 or technique:
            status, factor, reason = "protect", 1.0, "Pain or technique feedback blocks load progression."
        elif completion_ratio < .85 or rep_ratio < .85 or avg_rpe >= 9.5:
            if prior_struggle and prior_struggle[-1]:
                status, factor, reason = "regress", .95, "Repeated incomplete or maximal-effort work requires a five-percent load reduction."
            else:
                status, factor, reason = "hold", 1.0, "A single difficult exposure is repeated before load changes."
        elif completion_ratio >= .95 and rep_ratio >= .95 and avg_rpe <= 8.5 and (avg_rir is None or avg_rir >= 1):
            if len(prior_success) >= 1 and prior_success[-1]:
                status, factor, reason = "progress", 1.025, "Two quality exposures support the smallest practical load increase."
            else:
                status, factor, reason = "hold", 1.0, "One successful exposure is banked before increasing load."
        else:
            status, factor, reason = "hold", 1.0, "Repeat the prescription until performance and effort agree."

        decisions.append({
            "exercise_key": key,
            "exercise_name": name,
            "status": status,
            "load_factor": factor,
            "reason": reason,
            "evidence": {
                "completion_ratio": round(completion_ratio, 3),
                "rep_ratio": round(rep_ratio, 3),
                "average_rpe": round(avg_rpe, 2),
                "average_rir": avg_rir,
                "pain_severity": pain,
                "prior_comparable_exposures": len(prior),
            },
        })
    return decisions
