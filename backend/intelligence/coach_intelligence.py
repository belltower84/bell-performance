from __future__ import annotations

from collections import Counter, defaultdict
from datetime import datetime, timezone
from typing import Any

VERSION = "13.4.0"


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _number(value: Any, default: float = 0.0) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def _confidence_label(value: float) -> str:
    if value >= 0.85:
        return "high"
    if value >= 0.65:
        return "medium"
    return "low"


def infer_memory_candidates(events: list[dict[str, Any]], profile: dict[str, Any] | None = None) -> list[dict[str, Any]]:
    """Infer only repeat-supported coaching observations.

    A single event never creates an inferred durable memory. Athlete-entered
    preferences are handled separately by the explicit memory endpoint.
    """
    candidates: list[dict[str, Any]] = []
    workouts: dict[str, list[dict[str, Any]]] = defaultdict(list)
    checkins: list[dict[str, Any]] = []
    missed_by_weekday: Counter[str] = Counter()

    for row in events:
        event_type = str(row.get("event_type") or "")
        payload = row.get("payload") if isinstance(row.get("payload"), dict) else {}
        occurred_at = str(row.get("occurred_at") or "")
        if event_type == "workout_completed":
            kind = str(payload.get("adaptation_type") or payload.get("session_type") or "training")
            workouts[kind].append({**payload, "occurred_at": occurred_at})
        elif event_type == "daily_checkin":
            checkins.append({**payload, "occurred_at": occurred_at})
        elif event_type == "missed_session":
            day = str(payload.get("day") or payload.get("weekday") or "").strip()
            if day:
                missed_by_weekday[day] += 1

    for kind, samples in workouts.items():
        if len(samples) < 4:
            continue
        recent = samples[-8:]
        performance = [_number(item.get("performance_ratio"), 1.0) for item in recent]
        rpes = [_number(item.get("session_rpe"), 7.0) for item in recent]
        avg_performance = sum(performance) / len(performance)
        avg_rpe = sum(rpes) / len(rpes)
        first = recent[0].get("occurred_at") or _now_iso()
        last = recent[-1].get("occurred_at") or _now_iso()
        if avg_performance >= 1.0 and avg_rpe <= 8.0:
            confidence = min(0.94, 0.62 + len(recent) * 0.04)
            candidates.append({
                "memory_key": f"response:{kind}:positive",
                "category": "training_response",
                "observation": f"Responds well to {kind.replace('_', ' ')} sessions at the current dose.",
                "confidence": confidence,
                "source_type": "inferred_repeated_evidence",
                "evidence": {
                    "sample_count": len(recent), "average_performance_ratio": round(avg_performance, 3),
                    "average_session_rpe": round(avg_rpe, 2), "first_observed": first, "last_confirmed": last,
                },
            })
        elif avg_performance < 0.93 or avg_rpe >= 9.0:
            confidence = min(0.92, 0.62 + len(recent) * 0.04)
            candidates.append({
                "memory_key": f"response:{kind}:high_cost",
                "category": "fatigue_response",
                "observation": f"Current {kind.replace('_', ' ')} dose may create excessive fatigue.",
                "confidence": confidence,
                "source_type": "inferred_repeated_evidence",
                "evidence": {
                    "sample_count": len(recent), "average_performance_ratio": round(avg_performance, 3),
                    "average_session_rpe": round(avg_rpe, 2), "first_observed": first, "last_confirmed": last,
                },
            })

    if len(checkins) >= 5:
        recent = checkins[-10:]
        low_sleep = [item for item in recent if _number(item.get("sleep_hours"), 8.0) < 6.5]
        limited_time = [item for item in recent if _number(item.get("available_minutes"), 60) <= 40]
        if len(low_sleep) >= 3:
            confidence = min(0.9, 0.58 + len(low_sleep) * 0.06)
            candidates.append({
                "memory_key": "recovery:recurring_low_sleep",
                "category": "recovery_pattern",
                "observation": "Sleep frequently falls below the recovery target.",
                "confidence": confidence,
                "source_type": "inferred_repeated_evidence",
                "evidence": {"sample_count": len(low_sleep), "window": len(recent), "first_observed": low_sleep[0].get("occurred_at"), "last_confirmed": low_sleep[-1].get("occurred_at")},
            })
        if len(limited_time) >= 3:
            confidence = min(0.9, 0.58 + len(limited_time) * 0.06)
            candidates.append({
                "memory_key": "schedule:recurring_limited_time",
                "category": "schedule_pattern",
                "observation": "Training time is frequently limited to 40 minutes or less.",
                "confidence": confidence,
                "source_type": "inferred_repeated_evidence",
                "evidence": {"sample_count": len(limited_time), "window": len(recent), "first_observed": limited_time[0].get("occurred_at"), "last_confirmed": limited_time[-1].get("occurred_at")},
            })

    for day, count in missed_by_weekday.items():
        if count >= 2:
            candidates.append({
                "memory_key": f"schedule:missed:{day.lower()}",
                "category": "schedule_pattern",
                "observation": f"{day} sessions have been missed repeatedly.",
                "confidence": min(0.9, 0.62 + count * 0.06),
                "source_type": "inferred_repeated_evidence",
                "evidence": {"sample_count": count, "weekday": day},
            })

    for item in candidates:
        item["confidence_label"] = _confidence_label(item["confidence"])
    return candidates


def build_explanation(topic: str, context: dict[str, Any]) -> dict[str, Any]:
    journey = context.get("journey") or {}
    current_phase = journey.get("current_phase") or {}
    discipline = context.get("discipline") or journey.get("discipline") or {}
    today = context.get("today") or {}
    adaptation = today.get("adaptation") or {}
    today_session = today.get("session") or {}
    today_title = today_session.get("title") or (today_session.get("session") or {}).get("title")
    memories = context.get("memories") or []
    phase_name = current_phase.get("name") or journey.get("current_phase_name") or "current phase"
    objective = journey.get("objective") or context.get("objective") or "your objective"
    next_milestone = journey.get("next_milestone") or context.get("next_milestone") or "complete the current phase"
    known = [f"Current phase: {phase_name}", f"Primary objective: {objective}"]
    if memories:
        known.append(f"Active coaching memories reviewed: {len(memories)}")
    missing: list[str] = []
    inferred: list[str] = []
    confidence = "high" if journey else "medium"

    templates = {
        "mission": (
            "Why this Mission?",
            today.get("coach_summary") or today_title or "Bell selected today's prescribed work.",
            adaptation.get("explanation") or f"This Mission supports {phase_name} and protects the highest-priority adaptation for {objective}.",
            f"Execute the prescribed quality, record RPE and performance, then recover for {next_milestone}.",
        ),
        "phase": (
            "Why this Phase?",
            f"Bell placed you in {phase_name}.",
            current_phase.get("purpose") or f"This phase develops the next quality required for {objective}.",
            f"Progress until Bell can verify {next_milestone}, then advance, extend, or recover.",
        ),
        "progression": (
            "Why this Progression?",
            current_phase.get("progression_rule") or discipline.get("progression") or "Bell is progressing one meaningful variable at a time.",
            "The progression protects technical quality and recovery before adding more load, volume, density, or specificity.",
            "Complete the prescribed work and log honest feedback so Bell can confirm the dose.",
        ),
        "weekly_plan": (
            "Why this Weekly Plan?",
            "Bell arranged the week around the current phase, available days, and protected sessions.",
            adaptation.get("explanation") or "Higher-priority sessions are protected first, while lower-priority work can move or reduce when life or recovery changes.",
            "Complete the protected sessions first and report any schedule changes before Bell rebuilds the week.",
        ),
        "recovery": (
            "Why Recovery Now?",
            adaptation.get("explanation") or "Bell is controlling fatigue relative to readiness and recent training demand.",
            "Recovery is prescribed when continuing the original dose would carry more risk than benefit.",
            "Restore sleep, movement quality, and readiness before the next high-priority exposure.",
        ),
        "nutrition": (
            "Why this Nutrition Direction?",
            f"Nutrition is aligned to {objective} and the demands of {phase_name}.",
            "Bell preserves performance and lean tissue before making more aggressive calorie or activity changes.",
            "Track bodyweight trend, adherence, and training performance before the next adjustment.",
        ),
        "milestone": (
            "Why this Milestone?",
            f"The next checkpoint is {next_milestone}.",
            f"It tests whether {phase_name} produced the intended adaptation before Bell changes direction.",
            "Complete the checkpoint with consistent conditions so the next decision is based on useful evidence.",
        ),
        "adaptation": (
            "Why did Bell change the plan?",
            adaptation.get("explanation") or "Bell reviewed readiness, pain, time available, and current priorities.",
            "The change preserves the most valuable work while reducing avoidable fatigue or risk.",
            "Follow the adjusted prescription and record how it felt so Bell can learn from the outcome.",
        ),
    }
    title, decision, reason, next_focus = templates.get(topic, templates["phase"])
    if not today and topic in {"mission", "adaptation", "recovery"}:
        missing.append("No current-day Bell Core prescription was available.")
        confidence = "medium"
    if memories:
        inferred.append("Relevant repeated patterns may influence future decisions; memory evidence remains reviewable by the athlete.")
    return {
        "topic": topic,
        "title": title,
        "context": "; ".join(known),
        "decision": decision,
        "reason": reason,
        "next_focus": next_focus,
        "confidence": confidence,
        "known": known,
        "inferred": inferred,
        "missing": missing,
        "generated_at": _now_iso(),
        "engine_version": VERSION,
    }


def build_summary(context: dict[str, Any]) -> dict[str, Any]:
    journey = context.get("journey") or {}
    phase = journey.get("current_phase") or {}
    today = context.get("today") or {}
    today_session = today.get("session") or {}
    today_title = today_session.get("title") or (today_session.get("session") or {}).get("title")
    memories = context.get("memories") or []
    phase_name = phase.get("name") or journey.get("current_phase_name") or "Foundation"
    phase_week = journey.get("phase_week") or 1
    phase_length = journey.get("phase_length") or phase.get("duration_weeks") or 1
    objective = journey.get("objective") or "Continuous Development"
    mission = today.get("coach_summary") or today_title or "Complete the next prescribed Mission"
    return {
        "headline": f"{phase_name} · Week {phase_week} of {phase_length}",
        "instruction": mission,
        "reason": f"Bell is prioritizing the adaptations required for {objective}.",
        "next_focus": journey.get("next_milestone") or "Complete the current phase checkpoint",
        "memory_context": f"{len(memories)} active coaching memories available" if memories else "No durable coaching memories are active yet",
        "confidence": "high" if journey else "medium",
        "generated_at": _now_iso(),
        "engine_version": VERSION,
    }
