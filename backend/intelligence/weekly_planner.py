from __future__ import annotations

import argparse
import copy
import json
from pathlib import Path
from typing import Any

from .session_builder import BellSessionBuilder

VERSION = "0.1.0"
DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]


def _norm(value: Any) -> str:
    return " ".join(str(value or "").strip().lower().replace("_", " ").split())


class BellWeeklyPlanningEngine:
    """Decomposes a mission into objectives, schedules sessions, builds them, and validates the week."""

    def __init__(self, database_path: str | Path, rulebook_path: str | Path):
        self.database_path = str(database_path)
        self.rulebook_path = Path(rulebook_path)
        self.rules = json.loads(self.rulebook_path.read_text())
        self.session_builder = BellSessionBuilder(database_path)

    def close(self) -> None:
        self.session_builder.close()

    def _mission_key(self, request: dict[str, Any]) -> str:
        text = _norm(" ".join(str(request.get(k, "")) for k in ("mission", "goal", "specialization", "event")))
        if "10k" in text:
            return "10k"
        if any(x in text for x in ("recomp", "body composition", "fat loss")):
            return "body_recomposition"
        if any(x in text for x in ("tactical", "police", "military", "fire")):
            return "tactical"
        if any(x in text for x in ("physique", "bodybuilding", "hypertrophy")):
            return "physique"
        if any(x in text for x in ("hybrid", "running and strength")):
            return "hybrid"
        return "general_strength"

    def _resolve_template(self, name: str) -> dict[str, Any]:
        templates = self.rules["session_templates"]
        template = copy.deepcopy(templates[name])
        if "inherits" in template:
            parent = copy.deepcopy(templates[template.pop("inherits")])
            parent.update(template)
            template = parent
        return template

    def _available_days(self, request: dict[str, Any]) -> list[str]:
        available = request.get("available_days") or DAYS
        normalized = {_norm(x): x for x in DAYS}
        result = [normalized[_norm(x)] for x in available if _norm(x) in normalized]
        return result or DAYS

    @staticmethod
    def _preferred_order(session_names: list[str]) -> list[str]:
        # Place high-fatigue lower and engine days apart before filling moderate sessions.
        priorities = {
            "Lower Strength": 10, "Threshold": 20, "Intervals": 20, "Long Run": 30,
            "Long Aerobic": 30, "Upper Strength": 40, "Lower Volume": 50,
            "Legs": 50, "Upper Volume": 60, "Push": 60, "Pull": 60,
            "Upper": 60, "Lower": 60, "Full Body Hypertrophy": 70,
            "Easy Run": 80, "Aerobic Base": 80, "Mixed Modal": 25,
        }
        return sorted(session_names, key=lambda x: priorities.get(x, 65))

    def _assign_days(self, sessions: list[str], available_days: list[str], preferred: dict[str, str]) -> list[dict[str, Any]]:
        """Assign every requested exposure, allowing compatible same-day pairings."""
        available_idx = [DAYS.index(d) for d in available_days]
        ordered = self._preferred_order(sessions)
        assigned: dict[str, list[str]] = {day: [] for day in DAYS}

        def profile(name: str) -> dict[str, bool]:
            template = self._resolve_template(name)
            kind = template.get("session_type", "strength")
            lower = kind != "engine" and ("Lower" in name or name == "Legs")
            upper = kind != "engine" and any(x in name for x in ("Upper", "Push", "Pull"))
            long_engine = kind == "engine" and "Long" in name
            hard_engine = kind == "engine" and any(x in name for x in ("Threshold", "Intervals", "Tempo", "Sprint", "Quality"))
            easy_engine = kind == "engine" and not long_engine and not hard_engine
            return {"engine": kind == "engine", "strength": kind != "engine", "lower": lower,
                    "upper": upper, "long_engine": long_engine, "hard_engine": hard_engine,
                    "easy_engine": easy_engine}

        def day_score(day: str, name: str) -> float:
            idx = DAYS.index(day)
            candidate = profile(name)
            existing = [profile(x) for x in assigned[day]]
            score = len(existing) * 35.0
            if candidate["long_engine"]:
                score += 0 if day == "Saturday" else 80
                if existing:
                    score += 400
            if candidate["strength"]:
                if day == "Friday":
                    score -= 12
                if any(x["long_engine"] for x in existing):
                    score += 500
            if candidate["engine"]:
                if any(x["upper"] for x in existing):
                    score -= 28
                if any(x["lower"] for x in existing):
                    score += 18 if candidate["easy_engine"] else 160
                if any(x["strength"] and not x["lower"] and not x["upper"] for x in existing):
                    score += 8 if candidate["easy_engine"] else 75
            for other_day, names in assigned.items():
                distance = abs(DAYS.index(other_day) - idx)
                for other_name in names:
                    other = profile(other_name)
                    if candidate["hard_engine"] and other["lower"] and distance <= 1:
                        score += 45
                    if candidate["lower"] and other["hard_engine"] and distance <= 1:
                        score += 45
                    if candidate["lower"] and other["lower"] and distance <= 1:
                        score += 35
            if not existing and day in ("Wednesday", "Thursday") and candidate["engine"]:
                score -= 6
            return score

        for name in ordered:
            pref = preferred.get(name)
            candidates = [pref] if pref in available_days else available_days
            chosen = min(candidates, key=lambda d: day_score(d, name))
            assigned[chosen].append(name)

        schedule: list[dict[str, Any]] = []
        for day in DAYS:
            if assigned[day]:
                schedule.extend({"day": day, "session_name": name, "status": "training"} for name in assigned[day])
            else:
                schedule.append({"day": day, "session_name": None, "status": "recovery"})
        return schedule

    def _build_engine_session(self, name: str, template: dict[str, Any], request: dict[str, Any]) -> dict[str, Any]:
        rx = copy.deepcopy(template["engine_prescription"])
        phase = request.get("phase", "Build")
        modifier = self.rules["phase_modifiers"].get(phase, self.rules["phase_modifiers"]["Build"])["volume"]
        if "duration_minutes" in rx:
            rx["duration_minutes"] = max(15, round(rx["duration_minutes"] * modifier))
        return {
            "name": name,
            "session_type": "engine",
            "estimated_total_minutes": rx.get("duration_minutes", request.get("session_minutes", 45)),
            "engine_prescription": rx,
            "bell_score": 90.0,
            "validation": {"passed": True, "warnings": []},
            "coach_summary": f"{name} supports the week's endurance objective while respecting the {phase} phase.",
        }

    def _build_strength_session(self, name: str, template: dict[str, Any], request: dict[str, Any]) -> dict[str, Any]:
        session_request = {
            "name": name,
            "session_type": template.get("session_type", "strength"),
            "primary_adaptation": template.get("slots", [{}])[0].get("adaptation", "General Strength"),
            "bell_system": request.get("bell_system", "Performance"),
            "phase": request.get("phase", "Build"),
            "athlete_skill": request.get("athlete_skill", "Intermediate"),
            "readiness": request.get("readiness", 7),
            "max_systemic_fatigue": request.get("max_systemic_fatigue", 9),
            "session_minutes": request.get("session_minutes", 70),
            "warmup_minutes": request.get("warmup_minutes", 10),
            "cooldown_minutes": request.get("cooldown_minutes", 5),
            "environment": request.get("environment", "Commercial Gym"),
            "available_equipment": request.get("available_equipment", []),
            "required_equipment_policy": request.get("required_equipment_policy", "strict"),
            "strict_pattern": True,
            "recent_exercise_ids": request.get("recent_exercise_ids", []),
            "excluded_exercise_ids": request.get("excluded_exercise_ids", []),
            "slots": copy.deepcopy(template.get("slots", [])),
        }
        return self.session_builder.build_session(session_request)

    def _validate_week(self, schedule: list[dict[str, Any]], objectives: list[str], built: list[dict[str, Any]], available_days: list[str]) -> dict[str, Any]:
        warnings: list[str] = []
        high_days = []
        training_indices = []
        session_scores = []
        for i, item in enumerate(schedule):
            if item["session_name"]:
                training_indices.append(i)
                template = self._resolve_template(item["session_name"])
                if template.get("systemic_load") == "high":
                    high_days.append(i)
        for session in built:
            session_scores.append(float(session.get("bell_score", session.get("validation", {}).get("bell_score", 85))))

        names = [item["session_name"] for item in schedule if item.get("session_name")]
        duplicate_names = sorted({name for name in names if names.count(name) > 1})
        if duplicate_names:
            warnings.append("Duplicate weekly session templates detected: " + ", ".join(duplicate_names))
        long_sessions = [name for name in names if name in ("Long Run", "Long Aerobic")]
        if len(long_sessions) > 1:
            warnings.append("More than one long-endurance session was generated.")

        limits = self.rules["weekly_limits"]
        if len(high_days) > limits["max_high_systemic_days"]:
            warnings.append("High-systemic session limit exceeded.")
        if any(b - a == 1 for a, b in zip(high_days, high_days[1:])):
            warnings.append("Consecutive high-systemic sessions detected.")
        streak = max_streak = 0
        for i in range(7):
            if i in training_indices:
                streak += 1
                max_streak = max(max_streak, streak)
            else:
                streak = 0
        if max_streak > limits["max_consecutive_training_days"]:
            warnings.append("Maximum consecutive training-day rule exceeded.")
        recovery_days = 7 - len(training_indices)
        if recovery_days < limits["minimum_recovery_days"]:
            warnings.append("Minimum weekly recovery-day rule not met.")

        alignment = 100 if objectives else 70
        recovery = max(0, 100 - 18 * len(warnings))
        schedule_fit = round(100 * len(training_indices) / max(1, min(len(available_days), len(training_indices)))) if training_indices else 0
        volume = 92 if len(training_indices) >= 3 else 72
        fatigue = 100 if not high_days or not any(b - a == 1 for a, b in zip(high_days, high_days[1:])) else 72
        session_quality = sum(session_scores) / len(session_scores) if session_scores else 80
        components = {
            "goal_alignment": alignment,
            "recovery_balance": recovery,
            "schedule_fit": min(100, schedule_fit),
            "volume_distribution": volume,
            "fatigue_management": fatigue,
            "session_quality": round(session_quality, 1),
        }
        weights = self.rules["week_score_weights"]
        score = round(sum(components[k] * weights[k] for k in weights), 1)
        passed = score >= self.rules["governance"]["minimum_week_score"] and not any("exceeded" in w for w in warnings)
        return {"passed": passed, "bell_score": score, "components": components, "warnings": warnings}

    def build_week(self, request: dict[str, Any]) -> dict[str, Any]:
        mission_key = self._mission_key(request)
        profile = self.rules["mission_profiles"][mission_key]
        objectives = request.get("weekly_objectives") or profile["objectives"]
        available_days = self._available_days(request)
        strength_target = max(0, int(request.get("strength_days", 0) or 0))
        engine_target = max(0, int(request.get("engine_days", 0) or 0))
        defaults = list(profile["default_sessions"])
        strength_pool = [name for name in defaults if self._resolve_template(name).get("session_type", "strength") != "engine"]
        engine_pool = [name for name in defaults if self._resolve_template(name).get("session_type", "strength") == "engine"]
        if not strength_target and not engine_target:
            requested_sessions = int(request.get("training_days", len(defaults)))
            sessions = defaults[:requested_sessions]
        else:
            sessions = []
            # Build distinct exposure roles. Never satisfy a target by cycling the same template.
            strength_fallback = ["Upper Strength", "Lower Strength", "Upper Volume", "Lower Volume", "Full Body Hypertrophy", "Push", "Pull", "Legs", "Upper", "Lower"]
            engine_fallback = ["Easy Run", "Threshold", "Aerobic Base", "Intervals", "Long Run", "Mixed Modal", "Long Aerobic"]
            def unique_pool(primary: list[str], fallback: list[str]) -> list[str]:
                result: list[str] = []
                for name in [*primary, *fallback]:
                    if name in self.rules["session_templates"] and name not in result:
                        result.append(name)
                return result
            strength_pool = unique_pool(strength_pool, strength_fallback)
            engine_pool = unique_pool(engine_pool, engine_fallback)
            if strength_target > len(strength_pool):
                raise ValueError(f"Bell cannot create {strength_target} unique strength exposures from {len(strength_pool)} templates.")
            if engine_target > len(engine_pool):
                raise ValueError(f"Bell cannot create {engine_target} unique engine exposures from {len(engine_pool)} templates.")
            sessions.extend(strength_pool[:strength_target])
            sessions.extend(engine_pool[:engine_target])
            requested_sessions = len(sessions)
        preferred = request.get("preferred_session_days", {})
        schedule = self._assign_days(sessions, available_days, preferred)

        built_sessions = []
        for item in schedule:
            name = item["session_name"]
            if not name:
                item["recovery_guidance"] = "Rest or complete 20-30 minutes of easy walking and mobility as needed."
                continue
            template = self._resolve_template(name)
            if template.get("session_type") == "engine":
                built = self._build_engine_session(name, template, request)
            else:
                built = self._build_strength_session(name, template, request)
            item["session"] = built
            item["estimated_minutes"] = built.get("estimated_total_minutes", built.get("estimated_minutes", request.get("session_minutes", 60)))
            built_sessions.append(built)

        validation = self._validate_week(schedule, objectives, built_sessions, available_days)
        return {
            "engine_version": VERSION,
            "rulebook_version": self.rules["rulebook_version"],
            "mission": request.get("mission") or request.get("goal") or mission_key,
            "mission_profile": mission_key,
            "phase": request.get("phase", "Build"),
            "weekly_objectives": objectives,
            "schedule": schedule,
            "validation": validation,
            "coach_summary": f"Bell built a {len(built_sessions)}-session {mission_key.replace('_', ' ')} week with a score of {validation['bell_score']}.",
            "decision_trace": {
                "available_days": available_days,
                "requested_training_days": requested_sessions,
                "requested_strength_exposures": strength_target,
                "requested_engine_exposures": engine_target,
                "selected_session_templates": sessions,
                "rules_applied": ["mission profile", "phase modifiers", "recovery spacing", "weekly fatigue limits", "week scoring"],
            },
        }


def main() -> None:
    parser = argparse.ArgumentParser(description="Bell Weekly Planning Engine")
    parser.add_argument("request")
    parser.add_argument("--database", required=True)
    parser.add_argument("--rulebook", required=True)
    parser.add_argument("--output")
    args = parser.parse_args()
    request = json.loads(Path(args.request).read_text())
    engine = BellWeeklyPlanningEngine(args.database, args.rulebook)
    try:
        result = engine.build_week(request)
    finally:
        engine.close()
    text = json.dumps(result, indent=2)
    if args.output:
        Path(args.output).write_text(text)
    else:
        print(text)


if __name__ == "__main__":
    main()
