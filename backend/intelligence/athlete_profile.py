from __future__ import annotations

from copy import deepcopy
from datetime import datetime, timezone
from typing import Any

VERSION = "0.1.0"

IDENTITIES = {
    "Performance & Health",
    "Hybrid Athlete",
    "Powerlifting",
    "Bodybuilding",
    "Tactical Athlete",
    "Functional Fitness",
    "Endurance Athlete",
}

OBJECTIVES = {
    "Lose Fat",
    "Build Muscle",
    "Body Recomposition",
    "Increase Strength",
    "Improve Conditioning",
    "Improve Performance",
    "Improve Endurance",
    "Prepare for Competition",
    "Maintain Performance",
    "Continuous Development",
}

DEFAULT_PROFILE: dict[str, Any] = {
    "schema_version": 1,
    "demographics": {
        "first_name": "",
        "age": None,
        "sex": "Prefer not to say",
        "height_inches": None,
        "bodyweight_lb": None,
        "goal_weight_lb": None,
    },
    "identity": {
        "primary": "Performance & Health",
        "objective": "Continuous Development",
        "journey_mode": "continuous_development",
        "journey_name": "",
        "event_name": "",
        "event_date": "",
    },
    "experience": {"level": "Intermediate", "training_age_years": None},
    "availability": {
        "normal_days": [],
        "session_minutes": 60,
        "preferred_time": "Flexible",
        "reliability": "Mostly consistent",
        "minimum_days": 3,
    },
    "baselines": {"maxes": {"bench": None, "squat": None, "deadlift": None, "push_press": None}},
    "recovery": {"sleep_target_hours": 8, "deload_preference": "Bell decides", "limitation_status": "none"},
    "coaching": {
        "style": "Performance",
        "detail_level": "Balanced",
        "check_in_frequency": "Weekly",
        "scripture_frequency": "Occasionally",
    },
    "profile_completeness": 0,
    "updated_at": "",
}


def _merge(base: dict[str, Any], incoming: dict[str, Any]) -> dict[str, Any]:
    out = deepcopy(base)
    for key, value in incoming.items():
        if isinstance(value, dict) and isinstance(out.get(key), dict):
            out[key] = _merge(out[key], value)
        else:
            out[key] = value
    return out


def _number(value: Any, minimum: float | None = None, maximum: float | None = None) -> float | None:
    try:
        number = float(value)
    except (TypeError, ValueError):
        return None
    if minimum is not None and number < minimum:
        return None
    if maximum is not None and number > maximum:
        return None
    return int(number) if number.is_integer() else number


def _first(payload: dict[str, Any] | None, *keys: str) -> Any:
    if not isinstance(payload, dict):
        return None
    for key in keys:
        if payload.get(key) not in (None, ""):
            return payload[key]
    return None


def profile_completeness(profile: dict[str, Any]) -> int:
    demographics = profile["demographics"]
    identity = profile["identity"]
    experience = profile["experience"]
    availability = profile["availability"]
    maxes = profile["baselines"]["maxes"]
    checks = [
        bool(str(demographics.get("first_name") or "").strip()),
        bool(demographics.get("age")),
        bool(demographics.get("height_inches")),
        bool(demographics.get("bodyweight_lb")),
        bool(identity.get("primary")),
        bool(identity.get("objective")),
        bool(experience.get("level")),
        len(availability.get("normal_days") or []) >= 2,
        bool(availability.get("session_minutes")),
        bool(profile["coaching"].get("style")),
    ]
    if identity.get("primary") == "Powerlifting":
        checks.extend(bool(maxes.get(lift)) for lift in ("squat", "bench", "deadlift"))
    if identity.get("journey_mode") == "event_preparation":
        checks.extend([bool(identity.get("event_name")), bool(identity.get("event_date"))])
    return round(100 * sum(checks) / len(checks))


def normalize_athlete_profile(raw: dict[str, Any] | None, *, name: str = "") -> dict[str, Any]:
    source = deepcopy(raw or {})

    # Keep the exact incoming sections separate from the default-filled profile.
    # Legacy Bell profiles sometimes stored values such as ``experience`` or
    # ``identity`` as strings; defaults must never mask those explicit values.
    raw_demographics = source.get("demographics") if isinstance(source.get("demographics"), dict) else {}
    raw_identity_value = source.get("identity")
    raw_identity = raw_identity_value if isinstance(raw_identity_value, dict) else {}
    raw_experience_value = source.get("experience")
    raw_experience = raw_experience_value if isinstance(raw_experience_value, dict) else {}
    raw_availability = source.get("availability") if isinstance(source.get("availability"), dict) else {}
    raw_baselines = source.get("baselines") if isinstance(source.get("baselines"), dict) else {}
    raw_recovery = source.get("recovery") if isinstance(source.get("recovery"), dict) else {}
    raw_coaching = source.get("coaching") if isinstance(source.get("coaching"), dict) else {}

    profile = _merge(DEFAULT_PROFILE, source)
    for section in ("demographics", "identity", "experience", "availability", "baselines", "recovery", "coaching"):
        if not isinstance(profile.get(section), dict):
            profile[section] = deepcopy(DEFAULT_PROFILE[section])
    if not isinstance(profile["baselines"].get("maxes"), dict):
        profile["baselines"]["maxes"] = deepcopy(DEFAULT_PROFILE["baselines"]["maxes"])

    demographics = profile["demographics"]
    demographics["first_name"] = str(
        _first(raw_demographics, "first_name", "firstName")
        or _first(source, "first_name", "firstName", "name")
        or demographics.get("first_name")
        or name
        or ""
    ).strip()
    demographics["age"] = _number(
        _first(raw_demographics, "age") or _first(source, "age") or demographics.get("age"), 8, 100
    )
    demographics["sex"] = str(
        _first(raw_demographics, "sex") or _first(source, "sex") or demographics.get("sex") or "Prefer not to say"
    )
    demographics["height_inches"] = _number(
        _first(raw_demographics, "height_inches", "heightInches")
        or _first(source, "height_inches", "heightInches", "height")
        or demographics.get("height_inches"),
        36, 96,
    )
    demographics["bodyweight_lb"] = _number(
        _first(raw_demographics, "bodyweight_lb", "bodyweightLb")
        or _first(source, "bodyweight_lb", "bodyweightLb", "weight_lb", "weight")
        or demographics.get("bodyweight_lb"),
        40, 800,
    )
    demographics["goal_weight_lb"] = _number(
        _first(raw_demographics, "goal_weight_lb", "goalWeightLb")
        or _first(source, "goal_weight_lb", "goalWeightLb", "goal_weight")
        or demographics.get("goal_weight_lb"),
        40, 800,
    )

    identity = profile["identity"]
    explicit_primary = (
        _first(raw_identity, "primary")
        or _first(source, "primary_training_identity")
        or (raw_identity_value if isinstance(raw_identity_value, str) else None)
    )
    identity["primary"] = str(
        explicit_primary or identity.get("primary") or DEFAULT_PROFILE["identity"]["primary"]
    ).strip()
    if identity["primary"] not in IDENTITIES:
        identity["primary"] = DEFAULT_PROFILE["identity"]["primary"]

    identity["objective"] = str(
        _first(raw_identity, "objective")
        or _first(source, "objective", "secondary_goal")
        or identity.get("objective")
        or DEFAULT_PROFILE["identity"]["objective"]
    ).strip()
    if identity["objective"] not in OBJECTIVES:
        identity["objective"] = DEFAULT_PROFILE["identity"]["objective"]

    explicit_mode = (
        _first(raw_identity, "journey_mode", "journeyMode", "planning_mode")
        or _first(source, "journey_mode", "journeyMode", "planning_mode")
    )
    raw_mode = explicit_mode or identity.get("journey_mode")
    has_event = bool(
        _first(raw_identity, "event_name", "eventName", "event_date", "eventDate")
        or _first(source, "event_name", "eventName", "event_date", "eventDate", "competition_date")
    )
    identity["journey_mode"] = (
        "event_preparation"
        if str(raw_mode or "").lower() in {"event", "event_preparation", "competition", "competition_preparation"}
        or (not explicit_mode and has_event)
        else "continuous_development"
    )
    identity["journey_name"] = str(
        _first(raw_identity, "journey_name", "journeyName")
        or _first(source, "journey_name", "journeyName")
        or identity.get("journey_name")
        or ""
    ).strip()
    identity["event_name"] = str(
        _first(raw_identity, "event_name", "eventName")
        or _first(source, "event_name", "eventName", "competition_type")
        or identity.get("event_name")
        or ""
    ).strip()
    identity["event_date"] = str(
        _first(raw_identity, "event_date", "eventDate")
        or _first(source, "event_date", "eventDate", "competition_date")
        or identity.get("event_date")
        or ""
    ).strip()

    experience = profile["experience"]
    explicit_experience = (
        _first(raw_experience, "level")
        or _first(source, "training_experience")
        or (raw_experience_value if isinstance(raw_experience_value, str) else None)
    )
    experience["level"] = str(explicit_experience or experience.get("level") or "Intermediate").title()
    if experience["level"] not in {"Beginner", "Intermediate", "Advanced"}:
        experience["level"] = "Intermediate"
    experience["training_age_years"] = _number(
        _first(raw_experience, "training_age_years", "trainingAgeYears")
        or _first(source, "training_age_years", "trainingAgeYears")
        or experience.get("training_age_years"),
        0, 70,
    )

    availability = profile["availability"]
    days = (
        _first(raw_availability, "normal_days", "normalDays")
        or _first(source, "available_days", "training_days", "normal_days")
        or availability.get("normal_days")
        or []
    )
    if isinstance(days, int):
        defaults = {
            2: ["Tuesday", "Friday"],
            3: ["Monday", "Wednesday", "Saturday"],
            4: ["Monday", "Tuesday", "Thursday", "Saturday"],
            5: ["Monday", "Tuesday", "Thursday", "Friday", "Saturday"],
            6: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
            7: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
        }
        days = defaults.get(days, [])
    valid_days = [
        day for day in (days if isinstance(days, list) else [])
        if day in {"Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"}
    ]
    availability["normal_days"] = list(dict.fromkeys(valid_days))
    availability["session_minutes"] = int(_number(
        _first(raw_availability, "session_minutes", "sessionMinutes")
        or _first(source, "session_minutes", "sessionMinutes")
        or availability.get("session_minutes"),
        20, 300,
    ) or 60)
    availability["preferred_time"] = str(
        _first(raw_availability, "preferred_time", "preferredTime")
        or availability.get("preferred_time")
        or "Flexible"
    )
    availability["reliability"] = str(
        _first(raw_availability, "reliability") or availability.get("reliability") or "Mostly consistent"
    )
    availability["minimum_days"] = int(_number(
        _first(raw_availability, "minimum_days", "minimumDays") or availability.get("minimum_days"), 2, 7
    ) or min(3, max(2, len(availability["normal_days"]) or 3)))

    maxes = profile["baselines"]["maxes"]
    raw_nested_maxes = raw_baselines.get("maxes") if isinstance(raw_baselines.get("maxes"), dict) else {}
    source_maxes = source.get("maxes") if isinstance(source.get("maxes"), dict) else {}
    for canonical, aliases in {
        "bench": ("bench", "bench_press"),
        "squat": ("squat", "back_squat"),
        "deadlift": ("deadlift",),
        "push_press": ("push_press", "pushPress"),
    }.items():
        value = next((_first(raw_nested_maxes, alias) for alias in aliases if _first(raw_nested_maxes, alias) is not None), None)
        if value in (None, ""):
            value = next((_first(source_maxes, alias) for alias in aliases if _first(source_maxes, alias) is not None), None)
        if value in (None, ""):
            value = next((_first(maxes, alias) for alias in aliases if _first(maxes, alias) is not None), None)
        maxes[canonical] = _number(value, 1, 2000)
    maxes.pop("pushPress", None)

    recovery = profile["recovery"]
    recovery["sleep_target_hours"] = _number(
        _first(raw_recovery, "sleep_target_hours", "sleepTargetHours")
        or _first(source, "sleep_target_hours", "sleepTargetHours")
        or recovery.get("sleep_target_hours"),
        3, 14,
    ) or 8
    recovery["deload_preference"] = str(
        _first(raw_recovery, "deload_preference", "deloadPreference")
        or recovery.get("deload_preference")
        or "Bell decides"
    )
    recovery["limitation_status"] = str(
        _first(raw_recovery, "limitation_status", "limitationStatus")
        or _first(source, "limitation_status", "limitationStatus")
        or recovery.get("limitation_status")
        or "none"
    )

    coaching = profile["coaching"]
    coaching["style"] = str(
        _first(raw_coaching, "style") or _first(source, "coach_style") or coaching.get("style") or "Performance"
    )
    coaching["detail_level"] = str(
        _first(raw_coaching, "detail_level", "detailLevel")
        or coaching.get("detail_level")
        or "Balanced"
    )
    coaching["check_in_frequency"] = str(
        _first(raw_coaching, "check_in_frequency", "checkInFrequency")
        or coaching.get("check_in_frequency")
        or "Weekly"
    )
    coaching["scripture_frequency"] = str(
        _first(raw_coaching, "scripture_frequency", "scriptureFrequency")
        or coaching.get("scripture_frequency")
        or "Occasionally"
    )

    profile["schema_version"] = 1
    profile["profile_completeness"] = profile_completeness(profile)
    profile["updated_at"] = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
    return profile
