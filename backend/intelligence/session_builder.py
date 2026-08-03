from __future__ import annotations

import argparse
import json
import math
import sqlite3
from pathlib import Path
from typing import Any

from .selection_engine import BellExerciseSelectionEngine, _norm

VERSION = "0.1.0"

SKELETONS = {
    "strength": ["movement_prep", "primary", "secondary", "accessory", "core", "cooldown"],
    "hypertrophy": ["movement_prep", "primary", "secondary", "accessory", "accessory", "finisher", "cooldown"],
    "performance": ["movement_prep", "power", "primary", "secondary", "accessory", "core", "cooldown"],
    "engine": ["movement_prep", "skill", "conditioning", "accessory", "cooldown"],
    "recovery": ["general_warmup", "mobility", "activation", "recovery", "cooldown"],
}

ROLE_ORDER = {
    "primer": 10,
    "power": 20,
    "primary lift": 30,
    "secondary compound": 40,
    "hypertrophy compound": 45,
    "accessory": 50,
    "weak point": 55,
    "isolation": 60,
    "core": 70,
    "carry": 75,
    "conditioning": 80,
    "finisher": 90,
    "recovery": 100,
}


class BellSessionBuilder:
    """Builds complete, explainable training sessions from BCKB exercise intelligence."""

    def __init__(self, database_path: str | Path):
        self.database_path = str(database_path)
        self.selector = BellExerciseSelectionEngine(database_path)
        self.connection = sqlite3.connect(self.database_path)
        self.connection.row_factory = sqlite3.Row

    def close(self) -> None:
        self.selector.close()
        self.connection.close()

    def _exercise_details(self, exercise_id: str) -> dict[str, Any]:
        row = self.connection.execute(
            """
            SELECT e.*, mp.label movement_pattern, pa.label primary_adaptation,
                   pr.label default_role, ef.systemic, ef.neurological,
                   ef.cardiovascular, ef.musculoskeletal, rw.label recovery_window
            FROM exercises e
            LEFT JOIN vocabulary_values mp ON mp.value_id=e.movement_pattern_id
            LEFT JOIN vocabulary_values pa ON pa.value_id=e.primary_adaptation_id
            LEFT JOIN vocabulary_values pr ON pr.value_id=e.default_programming_role_id
            LEFT JOIN exercise_fatigue ef ON ef.exercise_id=e.exercise_id
            LEFT JOIN vocabulary_values rw ON rw.value_id=ef.recovery_window_id
            WHERE e.exercise_id=?
            """,
            (exercise_id,),
        ).fetchone()
        if row is None:
            return {}
        details = dict(row)
        details["cues"] = [r[0] for r in self.connection.execute(
            "SELECT cue FROM coaching_cues WHERE exercise_id=? ORDER BY cue_order", (exercise_id,)
        ).fetchall()]
        details["errors"] = [r[0] for r in self.connection.execute(
            "SELECT error_text FROM common_errors WHERE exercise_id=? ORDER BY error_order", (exercise_id,)
        ).fetchall()]
        details["loading_methods"] = [r[0] for r in self.connection.execute(
            """SELECT vv.label FROM exercise_loading_methods elm
               JOIN vocabulary_values vv ON vv.value_id=elm.loading_method_id
               WHERE elm.exercise_id=?""", (exercise_id,)
        ).fetchall()]
        details["progression_models"] = [r[0] for r in self.connection.execute(
            """SELECT vv.label FROM exercise_progression_models epm
               JOIN vocabulary_values vv ON vv.value_id=epm.progression_model_id
               WHERE epm.exercise_id=?""", (exercise_id,)
        ).fetchall()]
        return details

    @staticmethod
    def _session_type(request: dict[str, Any]) -> str:
        explicit = _norm(request.get("session_type"))
        if explicit in SKELETONS:
            return explicit
        adaptation = _norm(request.get("primary_adaptation") or request.get("goal"))
        if any(x in adaptation for x in ["hypertrophy", "muscle", "physique"]):
            return "hypertrophy"
        if any(x in adaptation for x in ["aerobic", "threshold", "vo2", "conditioning", "endurance"]):
            return "engine"
        if any(x in adaptation for x in ["power", "speed", "athletic"]):
            return "performance"
        return "strength"

    @staticmethod
    def _prescription(role: str, adaptation: str, phase: str, readiness: int, details: dict[str, Any]) -> dict[str, Any]:
        r, a, p = _norm(role), _norm(adaptation), _norm(phase)
        readiness = max(1, min(10, int(readiness or 7)))
        modifier = -1 if readiness <= 4 else (1 if readiness >= 9 else 0)

        if "power" in r or "speed strength" in a or "power" in a:
            sets, reps, rpe, rest = 4 + max(0, modifier), "2-3", 7.0, 150
            intensity = "Explosive; stop when velocity drops"
        elif "primary" in r and "strength" in a:
            sets = max(3, 5 + modifier)
            reps = "2-4" if "peak" in p else "3-5"
            rpe = 7.0 if readiness <= 4 else (8.5 if readiness >= 8 else 8.0)
            rest = 210
            intensity = "78-88% 1RM" if "peak" not in p else "85-92% 1RM"
        elif "secondary" in r or "compound" in r:
            sets = max(2, 4 + modifier)
            reps = "5-8" if "strength" in a else "6-10"
            rpe = 7.5 if readiness >= 6 else 7.0
            rest = 120
            intensity = "2-3 reps in reserve"
        elif any(x in r for x in ["accessory", "isolation", "weak point"]):
            sets = max(2, 3 + modifier)
            reps = "8-12" if "strength" in a else "10-15"
            rpe = 8.0 if readiness >= 6 else 7.0
            rest = 75
            intensity = "1-3 reps in reserve"
        elif any(x in r for x in ["core", "carry"]):
            sets, reps, rpe, rest = 3, "8-12 or 30-45 sec", 7.0, 60
            intensity = "Crisp technique; no grinding"
        elif "conditioning" in r or "engine" in a:
            sets, reps, rpe, rest = 1, "As programmed", 7.0, 0
            intensity = "Use pace, heart rate, or work:rest target"
        else:
            sets, reps, rpe, rest = 3, "8-12", 7.0, 75
            intensity = "2-3 reps in reserve"

        if readiness <= 3:
            sets = max(1, sets - 1)
            rpe = min(rpe, 6.5)
            intensity += "; reduced-volume readiness adjustment"

        tempo = "Controlled eccentric; intentful concentric"
        if "paused" in _norm(details.get("canonical_name")):
            tempo = "Controlled eccentric, full pause, forceful concentric"

        progression = (details.get("progression_models") or ["Double progression"])[0]
        return {
            "sets": sets,
            "reps": reps,
            "target_rpe": rpe,
            "target_rir": max(0, round(10 - rpe, 1)),
            "intensity_guidance": intensity,
            "tempo": tempo,
            "rest_seconds": rest,
            "progression_model": progression,
            "stop_rule": "End the set when technique meaningfully deteriorates or target RPE is exceeded.",
        }

    @staticmethod
    def _warmup_sets(details: dict[str, Any], prescription: dict[str, Any]) -> list[dict[str, Any]]:
        role = _norm(details.get("default_role"))
        if "primary" not in role and "secondary" not in role:
            return []
        if "primary" in role:
            return [
                {"set": 1, "load": "Empty implement or very light", "reps": 8},
                {"set": 2, "load": "~40% work weight", "reps": 5},
                {"set": 3, "load": "~60% work weight", "reps": 3},
                {"set": 4, "load": "~75% work weight", "reps": 1},
            ]
        return [
            {"set": 1, "load": "~40% work weight", "reps": 6},
            {"set": 2, "load": "~65% work weight", "reps": 3},
        ]

    @staticmethod
    def _movement_prep(selected: list[dict[str, Any]], minutes: int = 10) -> dict[str, Any]:
        patterns = {_norm(x.get("details", {}).get("movement_pattern")) for x in selected}
        drills = ["2-3 minutes easy cyclical movement", "Dynamic joint circles and controlled range-of-motion work"]
        if "squat" in patterns or "lunge" in patterns:
            drills += ["Ankle rocks: 1 x 8/side", "Bodyweight squat: 2 x 6"]
        if "hinge" in patterns:
            drills += ["Hip hinge drill: 2 x 6", "Glute bridge: 1 x 10"]
        if any("push" in p for p in patterns):
            drills += ["Scapular push-up: 1 x 10", "Band external rotation: 1 x 12"]
        if any("pull" in p for p in patterns):
            drills += ["Band pull-apart: 1 x 15", "Scapular pull or row: 1 x 8"]
        return {"name": "Movement preparation", "minutes": minutes, "drills": drills[:6]}

    @staticmethod
    def _estimate_block_minutes(details: dict[str, Any], prescription: dict[str, Any]) -> int:
        sets = int(prescription.get("sets", 3))
        rest = int(prescription.get("rest_seconds", 75))
        execution = sets * 1.0
        warmup = len(prescription.get("warmup_sets", [])) * 1.5
        setup = details.get("setup_time_minutes") or 2
        return max(details.get("block_time_min") or 0, math.ceil(setup + execution + warmup + max(0, sets - 1) * rest / 60))

    def build_session(self, request: dict[str, Any]) -> dict[str, Any]:
        selection_request = dict(request)
        selection_request.setdefault("name", request.get("name", "Bell session"))
        selection = self.selector.build_selection(selection_request)
        readiness = int(request.get("readiness", 7))
        phase = request.get("phase", "Build")
        default_adaptation = request.get("primary_adaptation") or request.get("goal") or "General Strength"

        exercises: list[dict[str, Any]] = []
        for chosen in selection["selected_exercises"]:
            details = self._exercise_details(chosen["exercise_id"])
            slot = next((x["slot"] for x in selection["slots"] if x.get("selected") and x["selected"]["exercise_id"] == chosen["exercise_id"]), {})
            role = slot.get("programming_role") or chosen["metadata"].get("default_role") or details.get("default_role") or chosen.get("slot_name", "Accessory")
            adaptation = slot.get("adaptation") or details.get("primary_adaptation") or default_adaptation
            rx = self._prescription(role, adaptation, phase, readiness, details)
            rx["warmup_sets"] = self._warmup_sets(details, rx)
            block_minutes = self._estimate_block_minutes(details, rx)
            exercises.append({
                "order": 0,
                "slot_name": chosen.get("slot_name"),
                "exercise_id": chosen["exercise_id"],
                "name": chosen["name"],
                "role": role,
                "adaptation": adaptation,
                "selection_score": chosen["score"],
                "prescription": rx,
                "estimated_minutes": block_minutes,
                "coaching": {
                    "why": details.get("why_exists") or f"Selected to support {adaptation}.",
                    "primary_cue": (details.get("cues") or ["Use controlled, repeatable technique."])[0],
                    "common_error": (details.get("errors") or ["Allowing technique to deteriorate."])[0],
                    "breathing": "Brace or inhale before the effort; exhale after the hardest portion while maintaining position.",
                },
                "details": details,
            })

        exercises.sort(key=lambda x: ROLE_ORDER.get(_norm(x["role"]), 65))
        for idx, item in enumerate(exercises, 1):
            item["order"] = idx

        warmup_minutes = int(request.get("warmup_minutes", 10))
        cooldown_minutes = int(request.get("cooldown_minutes", 5))
        warmup = self._movement_prep(exercises, warmup_minutes)
        exercise_minutes = sum(x["estimated_minutes"] for x in exercises)
        total_minutes = warmup_minutes + exercise_minutes + cooldown_minutes
        limit = int(request.get("session_minutes", total_minutes))

        adjustments: list[str] = []
        if total_minutes > limit:
            over = total_minutes - limit
            for item in reversed(exercises):
                if over <= 0:
                    break
                role = _norm(item["role"])
                if any(x in role for x in ["accessory", "isolation", "weak point", "core", "finisher"]):
                    current_sets = item["prescription"]["sets"]
                    if current_sets > 2:
                        item["prescription"]["sets"] -= 1
                        saved = max(2, math.ceil(item["prescription"]["rest_seconds"] / 60 + 1))
                        item["estimated_minutes"] = max(3, item["estimated_minutes"] - saved)
                        over -= saved
                        adjustments.append(f"Reduced {item['name']} by one set to fit the session limit.")
            exercise_minutes = sum(x["estimated_minutes"] for x in exercises)
            total_minutes = warmup_minutes + exercise_minutes + cooldown_minutes

        systemic_values = [x["details"].get("systemic") or 5 for x in exercises]
        avg_selection = sum(x["selection_score"] for x in exercises) / max(1, len(exercises))
        completion = len(exercises) / max(1, len(request.get("slots", [])))
        time_score = 100 if total_minutes <= limit else max(40, 100 - (total_minutes - limit) * 5)
        fatigue_ceiling = int(request.get("max_systemic_fatigue", 10))
        peak_fatigue = max(systemic_values or [0])
        fatigue_score = 100 if peak_fatigue <= fatigue_ceiling else max(30, 100 - (peak_fatigue - fatigue_ceiling) * 20)
        structure_score = 100 if exercises and any("primary" in _norm(x["role"]) for x in exercises) else 85
        progression_score = 100 if all(x["prescription"].get("progression_model") for x in exercises) else 75
        bell_score = round(
            avg_selection * 0.35 + completion * 100 * 0.20 + time_score * 0.20 + fatigue_score * 0.15 + progression_score * 0.10,
            1,
        )

        warnings = list(selection["validation"].get("warnings", []))
        if total_minutes > limit:
            warnings.append(f"Session still exceeds the {limit}-minute limit by {total_minutes-limit} minutes.")
        if peak_fatigue > fatigue_ceiling:
            warnings.append(f"Peak exercise systemic fatigue {peak_fatigue}/10 exceeds requested ceiling {fatigue_ceiling}/10.")
        if readiness <= 3:
            warnings.append("Low readiness triggered reduced sets and capped intensity.")

        return {
            "builder_version": VERSION,
            "knowledge_base_version": "1.3.0",
            "session": {
                "name": request.get("name", "Bell training session"),
                "session_type": self._session_type(request),
                "phase": phase,
                "goal": default_adaptation,
                "readiness": readiness,
                "estimated_minutes": total_minutes,
                "requested_minutes": limit,
                "estimated_recovery": max((x["details"].get("recovery_window") or "24-48 hours" for x in exercises), default="24-48 hours"),
            },
            "skeleton": SKELETONS[self._session_type(request)],
            "warmup": warmup,
            "exercise_blocks": [{k: v for k, v in x.items() if k != "details"} for x in exercises],
            "cooldown": {
                "name": "Cooldown and downshift",
                "minutes": cooldown_minutes,
                "steps": ["Easy walk or cyclical movement", "Slow nasal breathing", "Brief mobility only where it improves comfort"],
            },
            "coach_notes": {
                "session_focus": request.get("session_focus") or "Execute every repetition with repeatable technique and stop before form breaks down.",
                "readiness_adjustment": "Normal prescription" if readiness >= 6 else "Volume and intensity reduced for current readiness.",
                "progression_rule": "Advance only when all prescribed work is completed inside the target RPE/RIR with stable technique.",
                "next_session_interaction": "Avoid repeating the highest-fatigue movement pattern at high intensity before its recovery window has passed.",
            },
            "validation": {
                "bell_score": bell_score,
                "selection_quality": round(avg_selection, 1),
                "slot_completion_percent": round(completion * 100, 1),
                "time_score": round(time_score, 1),
                "fatigue_score": round(fatigue_score, 1),
                "structure_score": structure_score,
                "progression_score": progression_score,
                "peak_systemic_fatigue": peak_fatigue,
                "adjustments": adjustments,
                "warnings": warnings,
                "passed": len(exercises) == len(request.get("slots", [])) and total_minutes <= limit and not warnings,
            },
            "selection_trace": selection,
        }


def main() -> None:
    parser = argparse.ArgumentParser(description="Bell Session Builder")
    parser.add_argument("request", help="Path to a JSON session request")
    parser.add_argument("--database", default=str(Path(__file__).resolve().parents[1] / "database" / "bckb_v1.3.0.sqlite"))
    parser.add_argument("--output", help="Optional output JSON path")
    args = parser.parse_args()
    request = json.loads(Path(args.request).read_text())
    builder = BellSessionBuilder(args.database)
    try:
        result = builder.build_session(request)
    finally:
        builder.close()
    text = json.dumps(result, indent=2)
    if args.output:
        Path(args.output).write_text(text)
    print(text)


if __name__ == "__main__":
    main()
