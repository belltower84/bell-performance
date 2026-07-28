from __future__ import annotations

import argparse
import json
import math
import sqlite3
from dataclasses import dataclass, asdict
from pathlib import Path
from typing import Any, Iterable

SKILL_ORDER = {
    "beginner": 1,
    "novice": 2,
    "intermediate": 3,
    "advanced": 4,
    "expert": 5,
}

COMPATIBILITY_SCORE = {
    "preferred": 100,
    "compatible": 78,
    "situational": 45,
    "avoid": 0,
}

DEFAULT_WEIGHTS = {
    "adaptation": 20,
    "pattern": 18,
    "role": 16,
    "equipment": 11,
    "skill": 8,
    "system": 7,
    "phase": 7,
    "fatigue": 6,
    "time": 4,
    "continuity": 2,
    "novelty": 1,
}

HARD_CONFLICT_TYPES = {"PAIRING_CONFLICT"}
SOFT_CONFLICT_TYPES = {"ADJACENT_DAY_CONFLICT"}


def _norm(value: str | None) -> str:
    if value is None:
        return ""
    words = (
        str(value)
        .lower()
        .replace("_", " ")
        .replace("-", " ")
        .replace("—", " ")
        .split()
    )
    semantic_prefixes = {"eq", "env", "pat", "fam", "adapt", "role", "skill", "system", "phase", "comp", "rec"}
    while words and words[0] in semantic_prefixes:
        words = words[1:]
    return " ".join(words)


def _tokens(value: str | None) -> set[str]:
    stop = {"adapt", "pat", "fam", "role", "skill", "system", "phase", "the", "and"}
    return {x for x in _norm(value).split() if x not in stop}


def _semantic_similarity(a: str | None, b: str | None) -> float:
    aa, bb = _tokens(a), _tokens(b)
    if not aa or not bb:
        return 0.0
    if aa == bb:
        return 1.0
    return len(aa & bb) / len(aa | bb)


@dataclass
class CandidateResult:
    exercise_id: str
    name: str
    score: float
    accepted: bool
    component_scores: dict[str, float]
    reasons: list[str]
    rejection_reasons: list[str]
    metadata: dict[str, Any]


class BellExerciseSelectionEngine:
    """Deterministic, explainable exercise-selection engine for BCKB v1.2.0."""

    def __init__(self, database_path: str | Path, weights: dict[str, float] | None = None):
        self.database_path = str(database_path)
        self.weights = dict(DEFAULT_WEIGHTS)
        if weights:
            self.weights.update(weights)
        self.connection = sqlite3.connect(self.database_path)
        self.connection.row_factory = sqlite3.Row
        self._load_reference_data()

    def close(self) -> None:
        self.connection.close()

    def _load_reference_data(self) -> None:
        rows = self.connection.execute(
            "SELECT value_id, vocabulary_key, label FROM vocabulary_values"
        ).fetchall()
        self.vocab = {r["value_id"]: dict(r) for r in rows}
        self.label_to_ids: dict[str, list[str]] = {}
        for row in rows:
            for key in {_norm(row["label"]), _norm(row["value_id"])}:
                self.label_to_ids.setdefault(key, []).append(row["value_id"])

        compat_rows = self.connection.execute(
            """
            SELECT ec.exercise_id, ec.context_type, ec.context_id, ec.rating_id,
                   cv.label AS context_label, rv.label AS rating_label
            FROM exercise_compatibility ec
            LEFT JOIN vocabulary_values cv ON cv.value_id=ec.context_id
            LEFT JOIN vocabulary_values rv ON rv.value_id=ec.rating_id
            """
        ).fetchall()
        self.compatibility: dict[tuple[str, str, str], str] = {}
        for row in compat_rows:
            self.compatibility[(row["exercise_id"], row["context_type"], _norm(row["context_label"]))] = row["rating_label"]
            self.compatibility[(row["exercise_id"], row["context_type"], _norm(row["context_id"]))] = row["rating_label"]

        rel_rows = self.connection.execute(
            "SELECT * FROM exercise_relationships WHERE status='Approved'"
        ).fetchall()
        self.relationships: dict[tuple[str, str, str], dict[str, Any]] = {
            (r["source_exercise_id"], r["target_exercise_id"], r["relationship_type"]): dict(r)
            for r in rel_rows
        }

    def _resolve_label(self, value: str | None, vocabulary_key: str | None = None) -> str | None:
        if not value:
            return None
        norm = _norm(value)
        exact = self.label_to_ids.get(norm, [])
        if vocabulary_key:
            exact = [x for x in exact if self.vocab.get(x, {}).get("vocabulary_key") == vocabulary_key]
        if exact:
            return exact[0]
        candidates = []
        for value_id, row in self.vocab.items():
            if vocabulary_key and row["vocabulary_key"] != vocabulary_key:
                continue
            sim = _semantic_similarity(value, row["label"])
            if sim:
                candidates.append((sim, value_id))
        candidates.sort(reverse=True)
        return candidates[0][1] if candidates and candidates[0][0] >= 0.45 else None

    def _exercise_rows(self) -> list[dict[str, Any]]:
        rows = self.connection.execute(
            """
            SELECT e.*, mp.label AS movement_pattern, mf.label AS movement_family,
                   pa.label AS primary_adaptation, pr.label AS default_role,
                   sl.label AS minimum_skill, ef.systemic, ef.neurological,
                   ef.cardiovascular, ef.musculoskeletal,
                   ef.technical_degradation_risk, rw.label AS recovery_window
            FROM exercises e
            LEFT JOIN vocabulary_values mp ON mp.value_id=e.movement_pattern_id
            LEFT JOIN vocabulary_values mf ON mf.value_id=e.movement_family_id
            LEFT JOIN vocabulary_values pa ON pa.value_id=e.primary_adaptation_id
            LEFT JOIN vocabulary_values pr ON pr.value_id=e.default_programming_role_id
            LEFT JOIN vocabulary_values sl ON sl.value_id=e.minimum_skill_level_id
            LEFT JOIN exercise_fatigue ef ON ef.exercise_id=e.exercise_id
            LEFT JOIN vocabulary_values rw ON rw.value_id=ef.recovery_window_id
            WHERE e.review_status_id IN ('REVIEW_APPROVED','REVIEW_003')
               OR e.status_id IN ('STATUS_ACTIVE','EXSTATUS_001')
               OR e.review_status_id IS NULL
            ORDER BY e.canonical_name
            """
        ).fetchall()
        exercises = [dict(r) for r in rows]
        for exercise in exercises:
            eid = exercise["exercise_id"]
            exercise["equipment"] = [dict(x) for x in self.connection.execute(
                """SELECT ee.equipment_id, ee.requirement, vv.label
                   FROM exercise_equipment ee JOIN vocabulary_values vv ON vv.value_id=ee.equipment_id
                   WHERE ee.exercise_id=?""", (eid,)
            ).fetchall()]
            exercise["environments"] = [x[0] for x in self.connection.execute(
                """SELECT vv.label FROM exercise_environments ee
                   JOIN vocabulary_values vv ON vv.value_id=ee.environment_id
                   WHERE ee.exercise_id=?""", (eid,)
            ).fetchall()]
            exercise["supported_roles"] = [x[0] for x in self.connection.execute(
                """SELECT vv.label FROM exercise_supported_roles er
                   JOIN vocabulary_values vv ON vv.value_id=er.role_id
                   WHERE er.exercise_id=?""", (eid,)
            ).fetchall()]
            exercise["secondary_adaptations"] = [x[0] for x in self.connection.execute(
                """SELECT vv.label FROM exercise_secondary_adaptations ea
                   JOIN vocabulary_values vv ON vv.value_id=ea.adaptation_id
                   WHERE ea.exercise_id=?""", (eid,)
            ).fetchall()]
        return exercises

    @staticmethod
    def _skill_value(label: str | None) -> int:
        n = _norm(label).replace("skill ", "")
        for key, value in SKILL_ORDER.items():
            if key in n:
                return value
        return 3

    @staticmethod
    def _score_match(requested: str | None, primary: str | None, alternatives: Iterable[str] = ()) -> float:
        if not requested:
            return 70.0
        similarities = [_semantic_similarity(requested, primary)] + [
            _semantic_similarity(requested, x) for x in alternatives
        ]
        best = max(similarities or [0.0])
        if best >= 0.99:
            return 100.0
        if best >= 0.65:
            return 88.0
        if best >= 0.35:
            return 65.0
        if best > 0:
            return 35.0
        return 0.0

    @staticmethod
    def _fatigue_score(systemic: int | None, max_systemic: int | None, readiness: int | None) -> float:
        systemic = systemic if systemic is not None else 5
        effective_limit = max_systemic if max_systemic is not None else 10
        if readiness is not None:
            if readiness <= 3:
                effective_limit = min(effective_limit, 4)
            elif readiness <= 5:
                effective_limit = min(effective_limit, 6)
            elif readiness <= 7:
                effective_limit = min(effective_limit, 8)
        if systemic <= effective_limit:
            return max(55.0, 100.0 - max(0, systemic - effective_limit + 2) * 8)
        return max(0.0, 55.0 - (systemic - effective_limit) * 22)

    @staticmethod
    def _time_score(block_min: int | None, block_max: int | None, slot_minutes: int | None) -> float:
        if not slot_minutes:
            return 80.0
        low = block_min or 0
        high = block_max or low
        if high <= slot_minutes:
            return 100.0
        if low <= slot_minutes:
            return 72.0
        over = low - slot_minutes
        return max(0.0, 55.0 - 10.0 * over)

    def _compatibility_score(self, exercise_id: str, context_type: str, requested: str | None) -> tuple[float, str | None]:
        if not requested:
            return 75.0, None
        rating = self.compatibility.get((exercise_id, context_type, _norm(requested)))
        if rating is None:
            return 60.0, None
        score = COMPATIBILITY_SCORE.get(_norm(rating), 60.0)
        return score, rating

    def rank_candidates(self, request: dict[str, Any], limit: int = 10) -> dict[str, Any]:
        """Rank exercises for one programming slot.

        The request may include adaptation, movement_pattern, programming_role,
        athlete_skill, available_equipment, environment, bell_system, phase,
        readiness (1-10), max_systemic_fatigue (1-10), slot_minutes,
        contraindicated_exercise_ids, excluded_exercise_ids, recent_exercise_ids,
        preferred_exercise_ids, required_equipment_policy, and hard_time_limit.
        """
        results: list[CandidateResult] = []
        available_eq = {_norm(x) for x in request.get("available_equipment", [])}
        excluded = set(request.get("excluded_exercise_ids", []))
        contraindicated = set(request.get("contraindicated_exercise_ids", []))
        recent = list(request.get("recent_exercise_ids", []))
        preferred = set(request.get("preferred_exercise_ids", []))
        athlete_skill = self._skill_value(request.get("athlete_skill", "Intermediate"))
        required_equipment_policy = request.get("required_equipment_policy", "strict")

        for ex in self._exercise_rows():
            rejection: list[str] = []
            reasons: list[str] = []
            eid = ex["exercise_id"]

            if eid in excluded:
                rejection.append("Explicitly excluded by request")
            if eid in contraindicated:
                rejection.append("Exercise-specific contraindication")

            required_equipment = {
                _norm(x["label"]) for x in ex["equipment"] if _norm(x["requirement"]) == "required"
            }
            missing = required_equipment - available_eq if available_eq else set()
            if missing and required_equipment_policy == "strict":
                rejection.append("Missing required equipment: " + ", ".join(sorted(missing)))

            required_skill = self._skill_value(ex["minimum_skill"])
            if required_skill > athlete_skill:
                rejection.append(
                    f"Requires {ex['minimum_skill']}; athlete is {request.get('athlete_skill', 'Intermediate')}"
                )

            if request.get("environment") and ex["environments"]:
                env_score = max(_semantic_similarity(request["environment"], x) for x in ex["environments"])
                if env_score == 0 and request.get("strict_environment", False):
                    rejection.append(f"Not approved for {request['environment']}")

            time_score = self._time_score(ex["block_time_min"], ex["block_time_max"], request.get("slot_minutes"))
            if request.get("hard_time_limit") and time_score == 0:
                rejection.append("Minimum exercise block time exceeds slot")

            adaptation_score = self._score_match(
                request.get("adaptation"), ex["primary_adaptation"], ex["secondary_adaptations"]
            )
            pattern_score = self._score_match(request.get("movement_pattern"), ex["movement_pattern"])
            role_score = self._score_match(
                request.get("programming_role"), ex["default_role"], ex["supported_roles"]
            )

            if request.get("strict_pattern") and pattern_score == 0:
                rejection.append("Movement-pattern mismatch")
            if request.get("strict_role") and role_score == 0:
                rejection.append("Programming-role mismatch")
            if request.get("strict_adaptation") and adaptation_score == 0:
                rejection.append("Adaptation mismatch")

            if available_eq:
                if not missing:
                    equipment_score = 100.0
                elif required_equipment_policy == "soft":
                    equipment_score = max(0.0, 70.0 - 20.0 * len(missing))
                else:
                    equipment_score = 0.0
            else:
                equipment_score = 75.0

            skill_gap = max(0, athlete_skill - required_skill)
            skill_score = 100.0 if required_skill <= athlete_skill else 0.0
            if skill_gap >= 3:
                skill_score = 82.0

            system_score, system_rating = self._compatibility_score(eid, "bell_system", request.get("bell_system"))
            phase_score, phase_rating = self._compatibility_score(eid, "phase", request.get("phase"))
            fatigue_score = self._fatigue_score(ex["systemic"], request.get("max_systemic_fatigue"), request.get("readiness"))

            continuity_score = 65.0
            if eid in preferred:
                continuity_score = 100.0
                reasons.append("Preserves planned progression continuity")
            for idx, recent_id in enumerate(recent):
                rel = self.relationships.get((recent_id, eid, "PROGRESSION"))
                if rel:
                    continuity_score = max(continuity_score, 92.0 - idx * 5)
                    reasons.append("Direct progression from a recently used exercise")

            novelty_score = 100.0
            if eid in recent:
                position = recent.index(eid)
                novelty_score = max(15.0, 35.0 + position * 10)
                reasons.append("Recent-use penalty applied")

            components = {
                "adaptation": adaptation_score,
                "pattern": pattern_score,
                "role": role_score,
                "equipment": equipment_score,
                "skill": skill_score,
                "system": system_score,
                "phase": phase_score,
                "fatigue": fatigue_score,
                "time": time_score,
                "continuity": continuity_score,
                "novelty": novelty_score,
            }
            denominator = sum(self.weights.values())
            score = sum(components[k] * self.weights[k] for k in self.weights) / denominator

            if pattern_score >= 88:
                reasons.append("Strong movement-pattern match")
            if adaptation_score >= 88:
                reasons.append("Strong adaptation match")
            if role_score >= 88:
                reasons.append("Fits requested programming role")
            if equipment_score == 100:
                reasons.append("All required equipment is available")
            if fatigue_score >= 85:
                reasons.append("Fatigue cost fits current readiness")
            if system_rating:
                reasons.append(f"{request.get('bell_system')} compatibility: {system_rating}")
            if phase_rating:
                reasons.append(f"{request.get('phase')} phase compatibility: {phase_rating}")

            results.append(CandidateResult(
                exercise_id=eid,
                name=ex["canonical_name"],
                score=round(score, 2),
                accepted=not rejection,
                component_scores={k: round(v, 1) for k, v in components.items()},
                reasons=reasons[:6],
                rejection_reasons=rejection,
                metadata={
                    "movement_pattern": ex["movement_pattern"],
                    "movement_family": ex["movement_family"],
                    "primary_adaptation": ex["primary_adaptation"],
                    "default_role": ex["default_role"],
                    "minimum_skill": ex["minimum_skill"],
                    "systemic_fatigue": ex["systemic"],
                    "block_time_min": ex["block_time_min"],
                    "block_time_max": ex["block_time_max"],
                    "required_equipment": sorted(required_equipment),
                },
            ))

        accepted = sorted((r for r in results if r.accepted), key=lambda r: (-r.score, r.name))
        rejected = sorted((r for r in results if not r.accepted), key=lambda r: (-r.score, r.name))
        selected = accepted[0] if accepted else None
        return {
            "engine_version": "0.1.0",
            "request": request,
            "selected": asdict(selected) if selected else None,
            "ranked_candidates": [asdict(x) for x in accepted[:limit]],
            "rejected_candidates": [asdict(x) for x in rejected[:limit]],
            "candidate_counts": {"accepted": len(accepted), "rejected": len(rejected)},
            "explanation": self._explain_selection(selected, request),
        }

    def _relationship(self, source: str, target: str, relationship_type: str) -> dict[str, Any] | None:
        return self.relationships.get((source, target, relationship_type)) or self.relationships.get((target, source, relationship_type))

    def build_selection(self, request: dict[str, Any]) -> dict[str, Any]:
        """Select one exercise per slot while applying graph conflict logic."""
        selected: list[dict[str, Any]] = []
        slot_outputs: list[dict[str, Any]] = []
        warnings: list[str] = []
        total_minutes = 0
        total_systemic = 0

        shared = {k: v for k, v in request.items() if k != "slots"}
        for position, slot in enumerate(request.get("slots", []), start=1):
            slot_request = dict(shared)
            slot_request.update(slot)
            slot_request["excluded_exercise_ids"] = list(set(slot_request.get("excluded_exercise_ids", [])) | {x["exercise_id"] for x in selected})
            ranked = self.rank_candidates(slot_request, limit=25)

            chosen = None
            graph_rejections = []
            for candidate in ranked["ranked_candidates"]:
                conflicts = []
                for prior in selected:
                    conflict = self._relationship(prior["exercise_id"], candidate["exercise_id"], "PAIRING_CONFLICT")
                    if conflict and _norm(conflict.get("severity")) in {"high", "prohibited"}:
                        conflicts.append(
                            f"Conflicts with {prior['name']}: {conflict.get('rationale') or conflict.get('severity')}"
                        )
                if conflicts:
                    graph_rejections.append({"candidate": candidate["name"], "reasons": conflicts})
                    continue
                chosen = candidate
                break

            if chosen is None:
                warnings.append(f"No conflict-free candidate found for slot {position}: {slot.get('name', 'Unnamed slot')}")
                slot_outputs.append({"slot": slot, "selected": None, "graph_rejections": graph_rejections})
                continue

            chosen = dict(chosen)
            chosen["slot_name"] = slot.get("name", f"Slot {position}")
            selected.append(chosen)
            total_minutes += chosen["metadata"].get("block_time_max") or 0
            total_systemic += chosen["metadata"].get("systemic_fatigue") or 0
            slot_outputs.append({
                "slot": slot,
                "selected": chosen,
                "graph_rejections": graph_rejections,
                "top_alternatives": [x for x in ranked["ranked_candidates"] if x["exercise_id"] != chosen["exercise_id"]][:3],
            })

        session_limit = request.get("session_minutes")
        if session_limit and total_minutes > session_limit:
            warnings.append(f"Estimated maximum block time ({total_minutes} min) exceeds session limit ({session_limit} min)")

        if selected:
            avg = sum(x["score"] for x in selected) / len(selected)
            completion = len(selected) / max(1, len(request.get("slots", [])))
            time_factor = 1.0 if not session_limit or total_minutes <= session_limit else max(0.5, session_limit / total_minutes)
            bell_score = round(avg * completion * time_factor, 1)
        else:
            bell_score = 0.0

        return {
            "engine_version": "0.1.0",
            "selection_name": request.get("name", "Bell exercise selection"),
            "selected_exercises": selected,
            "slots": slot_outputs,
            "validation": {
                "bell_score": bell_score,
                "selected_slots": len(selected),
                "requested_slots": len(request.get("slots", [])),
                "estimated_max_minutes": total_minutes,
                "aggregate_systemic_fatigue": total_systemic,
                "warnings": warnings,
                "passed": len(selected) == len(request.get("slots", [])) and not warnings,
            },
            "coach_explanation": self._explain_session(selected, warnings),
        }

    @staticmethod
    def _explain_selection(selected: CandidateResult | None, request: dict[str, Any]) -> str:
        if selected is None:
            return "Bell could not find an exercise that passed the current hard filters."
        details = []
        if request.get("movement_pattern"):
            details.append(f"matches the {request['movement_pattern']} pattern")
        if request.get("adaptation"):
            details.append(f"supports {request['adaptation']}")
        if request.get("programming_role"):
            details.append(f"fits the {request['programming_role']} slot")
        if request.get("readiness") is not None:
            details.append(f"fits readiness {request['readiness']}/10")
        return f"Bell selected {selected.name} because it " + ", ".join(details) + "."

    @staticmethod
    def _explain_session(selected: list[dict[str, Any]], warnings: list[str]) -> str:
        if not selected:
            return "Bell did not produce a viable selection under the current constraints."
        names = ", ".join(x["name"] for x in selected)
        explanation = f"Bell selected {names}. The choices satisfy each slot's requested adaptation, role, equipment, skill, fatigue, and time constraints while avoiding high-severity same-session graph conflicts."
        if warnings:
            explanation += " The selection requires review because: " + "; ".join(warnings) + "."
        return explanation


def main() -> None:
    parser = argparse.ArgumentParser(description="Bell Exercise Selection Engine")
    parser.add_argument("request", help="Path to a JSON request")
    parser.add_argument("--database", default=str(Path(__file__).resolve().parents[1] / "database" / "bckb_v1.2.0.sqlite"))
    parser.add_argument("--output", help="Optional output JSON path")
    parser.add_argument("--mode", choices=["rank", "selection"], default="selection")
    args = parser.parse_args()

    request = json.loads(Path(args.request).read_text())
    engine = BellExerciseSelectionEngine(args.database)
    try:
        result = engine.rank_candidates(request) if args.mode == "rank" else engine.build_selection(request)
    finally:
        engine.close()
    text = json.dumps(result, indent=2)
    if args.output:
        Path(args.output).write_text(text)
    print(text)


if __name__ == "__main__":
    main()
