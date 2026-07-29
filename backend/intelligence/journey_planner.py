from __future__ import annotations

from dataclasses import dataclass
from datetime import date, datetime
import math
import re
from typing import Any, Iterable

from .discipline_library import BellDisciplineLibrary, DisciplinePhase

VERSION = "13.2.0"
MAX_ACTIVE_HORIZON_WEEKS = 52


def _clean(value: Any) -> str:
    return re.sub(r"\s+", " ", str(value or "")).strip()


def _slug(value: str) -> str:
    text = re.sub(r"[^a-z0-9]+", "_", value.lower()).strip("_")
    return text or "phase"


def _parse_date(value: Any) -> date | None:
    if isinstance(value, date) and not isinstance(value, datetime):
        return value
    if isinstance(value, datetime):
        return value.date()
    text = _clean(value)
    if not text:
        return None
    try:
        return date.fromisoformat(text[:10])
    except ValueError:
        return None


def event_timeline_weeks(target: Any, *, as_of: date | None = None, fallback: int = 12) -> dict[str, int | bool]:
    """Resolve a dated objective into an active planning horizon.

    Bell plans up to 52 weeks at once. Events farther away retain their full
    countdown while the active horizon remains 52 weeks and can be regenerated
    as the athlete progresses.
    """
    today = as_of or date.today()
    target_date = _parse_date(target)
    if not target_date:
        weeks = max(4, min(MAX_ACTIVE_HORIZON_WEEKS, int(fallback or 12)))
        return {
            "event_weeks_remaining": weeks,
            "planning_horizon_weeks": weeks,
            "horizon_limited": False,
        }
    days = max(0, (target_date - today).days)
    full_weeks = max(1, math.ceil(days / 7))
    active = max(4, min(MAX_ACTIVE_HORIZON_WEEKS, full_weeks))
    return {
        "event_weeks_remaining": full_weeks,
        "planning_horizon_weeks": active,
        "horizon_limited": full_weeks > active,
    }


@dataclass(frozen=True)
class PhaseTemplate:
    name: str
    weight: float
    purpose: str
    objectives: tuple[str, ...]
    training_emphasis: str
    nutrition_strategy: str
    exit_criteria: tuple[str, ...]
    milestone: str


class BellJourneyPlanner:
    """Builds Bell's long-horizon Journey contract.

    This layer does not choose exercises. It translates athlete identity,
    objective, deadline, and Bell's generated program into a human-readable
    macrocycle that every UI and coaching service can consume.
    """

    version = VERSION

    def build(
        self,
        request: dict[str, Any],
        mission: dict[str, Any],
        program: dict[str, Any],
        profile: dict[str, Any] | None = None,
        *,
        as_of: date | None = None,
        current_week: int = 1,
    ) -> dict[str, Any]:
        profile = profile or {}
        today = as_of or date.today()
        target_date = _parse_date(request.get("competition_date") or mission.get("deadline"))
        mode = "event_preparation" if target_date else "continuous_development"
        identity = self._identity(request, mission, profile)
        objective = self._objective(request, mission, identity, mode)
        name = self._journey_name(request, identity, objective, mode)

        if mode == "event_preparation":
            timeline = event_timeline_weeks(
                target_date,
                as_of=today,
                fallback=int(mission.get("timeline_weeks", request.get("timeline_weeks", 12))),
            )
            total_weeks = int(timeline["planning_horizon_weeks"])
            event_weeks_remaining = int(timeline["event_weeks_remaining"])
            horizon_limited = bool(timeline["horizon_limited"])
        else:
            total_weeks = max(8, min(MAX_ACTIVE_HORIZON_WEEKS, int(mission.get("timeline_weeks", 24) or 24)))
            event_weeks_remaining = None
            horizon_limited = False

        discipline_library = BellDisciplineLibrary()
        discipline = discipline_library.get(identity, objective, _clean(request.get("goal")))
        templates = discipline_library.journey_templates(identity, objective, mode, total_weeks)
        phases = self._allocate_phases(templates, total_weeks)
        priorities = discipline_library.priorities(identity, objective, mode)
        journey = {
            "journey_engine_version": self.version,
            "mode": mode,
            "mode_label": "Event Preparation" if mode == "event_preparation" else "Continuous Development",
            "identity": identity,
            "objective": objective,
            "name": name,
            "start_date": today.isoformat(),
            "target_date": target_date.isoformat() if target_date else None,
            "event_weeks_remaining": event_weeks_remaining,
            "planning_horizon_weeks": total_weeks,
            "horizon_limited": horizon_limited,
            "total_weeks": total_weeks,
            "priorities": priorities,
            "discipline": discipline,
            "discipline_library_version": discipline_library.version,
            "continuous_policy": discipline_library.continuous_policy(identity, objective) if mode == "continuous_development" else None,
            "phases": phases,
            "transition_policy": {
                "advance": "Advance when phase work is complete, adherence is acceptable, and no unresolved recovery red flags are present.",
                "extend": "Extend a productive phase when performance is still improving and the next deadline permits it.",
                "recover": "Insert or advance recovery when fatigue, pain, illness, or adherence risk exceeds tolerance.",
                "rebuild": "Rebuild the remaining Journey when the objective, event date, schedule, or major constraint changes.",
            },
            "source_program": {
                "periodization_model": program.get("periodization_model"),
                "block_count": len(program.get("blocks", [])),
                "total_weeks": program.get("total_weeks"),
            },
        }
        return self.state_for_week(journey, current_week)

    def state_for_week(self, journey: dict[str, Any], current_week: int) -> dict[str, Any]:
        result = dict(journey)
        phases = [dict(phase) for phase in journey.get("phases", [])]
        total = max(1, int(journey.get("total_weeks", 1)))
        requested_week = max(1, int(current_week or 1))
        continuous = journey.get("mode") == "continuous_development"
        if continuous:
            cycle_number = ((requested_week - 1) // total) + 1
            cycle_week = ((requested_week - 1) % total) + 1
            week = cycle_week
        else:
            cycle_number = 1
            cycle_week = max(1, min(total, requested_week))
            week = cycle_week
        current: dict[str, Any] | None = None
        for phase in phases:
            if int(phase["start_week"]) <= week <= int(phase["end_week"]):
                current = phase
                break
        current = current or (phases[-1] if phases else {
            "id": "foundation", "name": "Foundation", "start_week": 1,
            "end_week": total, "duration_weeks": total, "purpose": "Build the foundation.",
            "objectives": [], "milestone": "Complete the current phase",
        })
        for phase in phases:
            if int(phase["end_week"]) < week:
                phase["status"] = "complete"
            elif phase["id"] == current["id"]:
                phase["status"] = "current"
            else:
                phase["status"] = "upcoming"
        current = next((phase for phase in phases if phase["id"] == current["id"]), current)
        phase_week = week - int(current["start_week"]) + 1
        next_phase = next((phase for phase in phases if int(phase["start_week"]) > week), None)
        library = BellDisciplineLibrary()
        next_cycle_emphasis = library.next_cycle_emphasis(
            journey.get("identity", "Performance & Health"),
            journey.get("objective", "Continuous Development"),
            cycle_number + 1,
        ) if continuous else None
        if continuous and next_phase is None:
            first = dict(phases[0]) if phases else None
            if first:
                first["cycle_number"] = cycle_number + 1
                first["cycle_emphasis"] = next_cycle_emphasis
                first["status"] = "upcoming"
                next_phase = first
        result.update({
            "requested_week": requested_week,
            "current_week": requested_week if continuous else week,
            "cycle_number": cycle_number,
            "cycle_week": cycle_week,
            "cycle_length": total,
            "cycle_emphasis": library.next_cycle_emphasis(
                journey.get("identity", "Performance & Health"),
                journey.get("objective", "Continuous Development"),
                cycle_number,
            ) if continuous else journey.get("name"),
            "next_cycle_emphasis": next_cycle_emphasis,
            "progress_percent": max(0, min(100, round((cycle_week / total) * 100))),
            "current_phase": current,
            "current_phase_id": current.get("id"),
            "current_phase_name": current.get("name"),
            "phase_week": phase_week,
            "phase_length": int(current.get("duration_weeks", 1)),
            "next_phase": next_phase,
            "next_milestone": current.get("milestone") or (next_phase or {}).get("milestone") or "Complete the current phase",
            "status": "cycle_review" if continuous and cycle_week >= total else "complete" if (not continuous and week >= total) else "on_plan",
            "phases": phases,
            "transition_guidance": library.evaluate_transition(result, {}),
        })
        return result

    def phase_for_week(self, journey: dict[str, Any], week: int) -> dict[str, Any]:
        return self.state_for_week(journey, week)["current_phase"]

    def _identity(self, request: dict[str, Any], mission: dict[str, Any], profile: dict[str, Any]) -> str:
        explicit = _clean(
            profile.get("primary_training_identity")
            or profile.get("identity")
            or profile.get("athlete_mode")
            or (request.get("constraints") or {}).get("identity")
        )
        text = " ".join([
            explicit,
            _clean(request.get("goal")),
            " ".join(map(str, mission.get("required_adaptations", []))),
        ]).lower()
        if "powerlift" in text or all(term in text for term in ("squat", "bench", "deadlift")):
            return "Powerlifting"
        if any(term in text for term in ("bodybuild", "physique", "hypertrophy")):
            return "Bodybuilding"
        if any(term in text for term in ("tactical", "selection", "pt test", "ruck")):
            return "Tactical Athlete"
        if any(term in text for term in ("functional fitness", "crossfit", "mixed modal")):
            return "Functional Fitness"
        if any(term in text for term in ("marathon", "half marathon", "10k", "5k", "running", "triathlon", "cycling", "endurance")):
            return "Endurance Athlete"
        if any(term in text for term in ("hybrid", "athletic performance", "sport performance", "power", "speed", "agility")):
            return "Hybrid Athlete"
        if any(term in text for term in ("fat loss", "weight loss", "body composition", "health", "general fitness")):
            return "Performance & Health"
        return explicit or "Performance & Health"

    def _objective(self, request: dict[str, Any], mission: dict[str, Any], identity: str, mode: str) -> str:
        goal_text = _clean(request.get("goal")).lower()
        supporting_text = " ".join([
            " ".join(map(str, mission.get("required_adaptations", []))),
            " ".join(map(str, request.get("priority_order", []))),
        ]).lower()
        text = f"{goal_text} {supporting_text}"
        if mode == "event_preparation":
            return "Prepare for Competition"
        if any(term in goal_text for term in ("fat loss", "weight loss", "lose fat", "body fat", "cut")):
            return "Lose Fat"
        if any(term in goal_text for term in ("recomp", "body composition")):
            return "Body Recomposition"
        if any(term in goal_text for term in ("muscle gain", "build muscle", "hypertrophy", "size")):
            return "Build Muscle"
        if any(term in goal_text for term in ("conditioning", "work capacity", "engine")):
            return "Improve Conditioning"
        if any(term in goal_text for term in ("maintain", "readiness", "longevity")):
            return "Maintain Performance"
        if any(term in goal_text for term in ("strength", "squat", "bench", "deadlift")):
            return "Increase Strength"
        if identity == "Powerlifting":
            return "Increase Strength"
        if identity == "Bodybuilding":
            return "Build Muscle"
        if identity == "Endurance Athlete":
            return "Improve Endurance"
        if identity in ("Tactical Athlete", "Functional Fitness", "Hybrid Athlete"):
            return "Improve Performance"
        if any(term in supporting_text for term in ("fat loss", "weight loss", "body composition")):
            return "Body Recomposition"
        return "Continuous Development"

    def _journey_name(self, request: dict[str, Any], identity: str, objective: str, mode: str) -> str:
        goal = _clean(request.get("goal"))
        event_type = _clean(request.get("competition_type"))
        if mode == "event_preparation":
            return event_type or goal or f"{identity} Event Preparation"
        names = {
            "Lose Fat": "Fat-Loss Transformation",
            "Body Recomposition": "Body Recomposition",
            "Build Muscle": "Muscle-Building Journey",
            "Increase Strength": "Strength Development",
            "Improve Conditioning": "Conditioning Development",
            "Improve Endurance": "Endurance Development",
        }
        return names.get(objective, f"{identity} Development")

    def _templates(self, identity: str, objective: str, mode: str, total_weeks: int) -> list[DisciplinePhase]:
        return BellDisciplineLibrary().journey_templates(identity, objective, mode, total_weeks)

    def _event_templates(self, identity: str, weeks: int) -> list[PhaseTemplate]:
        if weeks <= 6:
            return [
                self._phase("Specific Preparation", 0.55, "Practice the event's highest-value demands.", ("specificity", "execution"), "specific", "maintenance", ("Key sessions completed", "No unresolved red flags"), "Complete the final event-specific simulation"),
                self._phase("Peak", 0.25, "Express performance with lower volume and high-quality work.", ("performance_expression",), "peak", "maintenance", ("Performance is stable",), "Complete the final readiness assessment"),
                self._phase("Taper", 0.20, "Reduce fatigue without losing readiness.", ("fatigue_reduction",), "taper", "maintenance", ("Arrive recovered",), "Event day"),
            ]
        if identity == "Powerlifting":
            return [
                self._phase("Foundation", .15, "Build work capacity, technique, and tolerance for heavier training.", ("movement_quality", "work_capacity"), "foundation", "maintenance", ("Technique is repeatable",), "Foundation review"),
                self._phase("Volume", .22, "Accumulate competition-lift volume and useful muscle.", ("strength_base", "hypertrophy"), "accumulation", "maintenance", ("Volume targets completed",), "Rep-strength assessment"),
                self._phase("Strength", .24, "Increase force production in the competition lifts.", ("max_strength",), "strength", "maintenance", ("Top sets progress at target RPE",), "Heavy triple or double benchmark"),
                self._phase("Intensification", .18, "Raise specificity and practice heavier competition work.", ("specific_strength",), "intensification", "maintenance", ("Heavy exposures remain technically sound",), "Opener-range exposure"),
                self._phase("Peak", .12, "Convert training into meet-day performance.", ("performance_expression",), "peak", "maintenance", ("Openers are selected",), "Final opener practice"),
                self._phase("Taper", .09, "Reduce fatigue while preserving confidence and skill.", ("fatigue_reduction",), "taper", "maintenance", ("Athlete is recovered",), "Meet day"),
            ]
        if identity == "Endurance Athlete":
            return [
                self._phase("Aerobic Base", .27, "Expand durable aerobic capacity and consistent volume.", ("aerobic_base",), "foundation", "maintenance", ("Volume is tolerated consistently",), "Aerobic benchmark"),
                self._phase("Threshold", .20, "Improve sustainable speed and lactate clearance.", ("lactate_threshold",), "threshold", "maintenance", ("Threshold sessions are repeatable",), "Threshold assessment"),
                self._phase("VO₂ Development", .15, "Raise high-end aerobic power without overwhelming recovery.", ("vo2",), "intensification", "maintenance", ("Quality intervals are completed",), "VO₂ benchmark"),
                self._phase("Race Specific", .22, "Practice goal pace, fueling, and event-specific durability.", ("specificity", "durability"), "specific", "event_fueling", ("Key simulation is complete",), "Final race simulation"),
                self._phase("Peak", .08, "Sharpen speed while lowering accumulated fatigue.", ("performance_expression",), "peak", "maintenance", ("Race pace feels controlled",), "Readiness check"),
                self._phase("Taper", .08, "Arrive fresh without losing rhythm.", ("fatigue_reduction",), "taper", "event_fueling", ("Athlete is recovered",), "Event day"),
            ]
        if identity == "Bodybuilding":
            return [
                self._phase("Foundation", .15, "Build movement quality, training tolerance, and consistent execution.", ("movement_quality",), "foundation", "maintenance", ("Training is consistent",), "Foundation review"),
                self._phase("Growth", .28, "Build muscle with progressive volume and stable recovery.", ("hypertrophy",), "accumulation", "small_surplus_or_maintenance", ("Target muscle groups are progressing",), "Physique and performance review"),
                self._phase("Weak-Point Development", .18, "Prioritize the physique areas that need the most improvement.", ("weak_points",), "hypertrophy", "maintenance", ("Weak-point volume is tolerated",), "Weak-point review"),
                self._phase("Contest Preparation", .24, "Preserve muscle while increasing event specificity and reducing body fat.", ("body_composition", "posing_readiness"), "specific", "calorie_deficit", ("Rate of loss is appropriate",), "Final physique assessment"),
                self._phase("Peak Week", .15, "Reduce fatigue and preserve fullness without last-minute extremes.", ("performance_expression",), "taper", "coach_supervised_peak", ("No unresolved health concerns",), "Competition day"),
            ]
        return [
            self._phase("Foundation", .20, "Build the base that supports harder work later.", ("movement_quality", "work_capacity"), "foundation", "maintenance", ("Consistency established",), "Foundation review"),
            self._phase("Development", .30, "Build the highest-priority physical qualities.", ("primary_adaptation",), "accumulation", "maintenance", ("Progress markers improve",), "Development benchmark"),
            self._phase("Intensification", .20, "Increase the specificity and difficulty of key sessions.", ("specificity",), "intensification", "maintenance", ("Key sessions completed",), "Performance assessment"),
            self._phase("Specific Preparation", .17, "Practice the exact demands of the event.", ("event_specificity",), "specific", "event_fueling", ("Simulation completed",), "Final simulation"),
            self._phase("Peak", .07, "Express performance while controlling fatigue.", ("performance_expression",), "peak", "maintenance", ("Readiness is stable",), "Readiness check"),
            self._phase("Taper", .06, "Reduce fatigue and arrive prepared.", ("fatigue_reduction",), "taper", "maintenance", ("Athlete is recovered",), "Event day"),
        ]

    def _continuous_templates(self, identity: str, objective: str, weeks: int) -> list[PhaseTemplate]:
        if objective == "Lose Fat":
            return [
                self._phase("Foundation", .16, "Build repeatable training, movement, and nutrition habits.", ("consistency", "movement_quality"), "foundation", "small_deficit", ("Adherence is stable",), "Foundation check-in"),
                self._phase("Fat Loss I", .24, "Reduce body fat while preserving strength and muscle.", ("body_composition", "muscle_retention"), "fat_loss", "calorie_deficit", ("Weight trend is appropriate", "Strength is stable"), "First bodyweight milestone"),
                self._phase("Recovery", .10, "Reduce training and diet fatigue before the next push.", ("fatigue_reduction",), "deload", "maintenance", ("Readiness improves",), "Recovery review"),
                self._phase("Fat Loss II", .24, "Continue fat loss with progressive strength and aerobic support.", ("body_composition", "work_capacity"), "fat_loss", "calorie_deficit", ("Progress resumes without excessive fatigue",), "Next bodyweight milestone"),
                self._phase("Diet Break", .10, "Restore training quality and diet adherence at maintenance intake.", ("recovery", "adherence"), "recovery", "maintenance", ("Hunger and performance normalize",), "Maintenance review"),
                self._phase("Recomposition", .16, "Consolidate the result and improve performance at a stable bodyweight.", ("muscle_retention", "strength"), "recomposition", "maintenance", ("Weight is stable and performance improves",), "Journey assessment"),
            ]
        if objective in ("Build Muscle", "Body Recomposition") or identity == "Bodybuilding":
            return [
                self._phase("Foundation", .14, "Establish technique, volume tolerance, and recovery habits.", ("movement_quality",), "foundation", "maintenance", ("Execution is consistent",), "Foundation review"),
                self._phase("Growth", .30, "Accumulate productive hypertrophy volume.", ("hypertrophy",), "accumulation", "small_surplus_or_maintenance", ("Volume and performance progress",), "Growth review"),
                self._phase("Strength Support", .18, "Raise force production to support future hypertrophy.", ("strength",), "strength", "maintenance", ("Key lifts progress",), "Strength assessment"),
                self._phase("Weak-Point Development", .22, "Prioritize lagging muscle groups without losing global progress.", ("weak_points",), "hypertrophy", "small_surplus_or_maintenance", ("Target areas tolerate added volume",), "Weak-point review"),
                self._phase("Recovery", .16, "Reduce fatigue and prepare for the next development cycle.", ("fatigue_reduction",), "deload", "maintenance", ("Readiness improves",), "Cycle assessment"),
            ]
        if identity == "Powerlifting" or objective == "Increase Strength":
            return [
                self._phase("Hypertrophy Base", .24, "Build muscle and work capacity for future strength work.", ("hypertrophy", "work_capacity"), "accumulation", "maintenance", ("Volume is tolerated",), "Rep-strength assessment"),
                self._phase("Strength Development", .28, "Increase competition-lift force production.", ("max_strength",), "strength", "maintenance", ("Top sets progress at target RPE",), "Heavy triple assessment"),
                self._phase("Intensification", .20, "Practice heavier, more specific lifting while controlling fatigue.", ("specific_strength",), "intensification", "maintenance", ("Heavy exposures remain technically sound",), "Estimated 1RM assessment"),
                self._phase("Assessment", .12, "Measure progress and identify the next limiting factor.", ("testing",), "assessment", "maintenance", ("Assessment completed",), "Performance review"),
                self._phase("Recovery", .16, "Reduce fatigue before beginning the next strength cycle.", ("fatigue_reduction",), "deload", "maintenance", ("Readiness improves",), "Next-cycle decision"),
            ]
        if identity == "Endurance Athlete":
            return [
                self._phase("Aerobic Base", .30, "Build durable aerobic capacity and consistent volume.", ("aerobic_base",), "foundation", "maintenance", ("Volume is tolerated",), "Aerobic benchmark"),
                self._phase("Threshold", .22, "Improve sustainable pace and efficiency.", ("lactate_threshold",), "threshold", "maintenance", ("Threshold sessions progress",), "Threshold assessment"),
                self._phase("VO₂ Development", .18, "Raise high-end aerobic power.", ("vo2",), "intensification", "maintenance", ("Quality work is repeatable",), "VO₂ assessment"),
                self._phase("Assessment", .12, "Measure progress and identify the next limiter.", ("testing",), "assessment", "maintenance", ("Assessment completed",), "Performance review"),
                self._phase("Recovery", .18, "Reduce fatigue before the next aerobic cycle.", ("fatigue_reduction",), "deload", "maintenance", ("Readiness improves",), "Next-cycle decision"),
            ]
        if identity in ("Tactical Athlete", "Functional Fitness", "Hybrid Athlete"):
            return [
                self._phase("Foundation", .18, "Build durable movement quality and aerobic capacity.", ("movement_quality", "aerobic_base"), "foundation", "maintenance", ("Consistency established",), "Foundation review"),
                self._phase("Strength Development", .22, "Increase force production and structural resilience.", ("strength",), "strength", "maintenance", ("Strength markers improve",), "Strength benchmark"),
                self._phase("Engine Development", .20, "Improve sustainable conditioning and recovery between efforts.", ("aerobic_base", "threshold"), "threshold", "maintenance", ("Engine sessions progress",), "Engine benchmark"),
                self._phase("Hybrid Development", .22, "Combine strength and engine qualities under controlled fatigue.", ("work_capacity", "concurrent_fitness"), "specific", "maintenance", ("Mixed sessions remain repeatable",), "Hybrid simulation"),
                self._phase("Assessment", .08, "Measure progress and identify the next limiting quality.", ("testing",), "assessment", "maintenance", ("Assessment completed",), "Performance review"),
                self._phase("Recovery", .10, "Reduce fatigue and prepare for the next cycle.", ("fatigue_reduction",), "deload", "maintenance", ("Readiness improves",), "Next-cycle decision"),
            ]
        return [
            self._phase("Foundation", .22, "Build movement quality, consistency, and general capacity.", ("movement_quality", "consistency"), "foundation", "maintenance", ("Routine is sustainable",), "Foundation review"),
            self._phase("Capacity", .25, "Improve strength and aerobic work capacity.", ("strength", "aerobic_base"), "accumulation", "maintenance", ("Capacity markers improve",), "Capacity benchmark"),
            self._phase("Performance", .24, "Develop the athlete's highest-priority performance quality.", ("primary_adaptation",), "intensification", "maintenance", ("Performance markers improve",), "Performance assessment"),
            self._phase("Assessment", .12, "Measure progress and select the next emphasis.", ("testing",), "assessment", "maintenance", ("Assessment completed",), "Journey review"),
            self._phase("Recovery", .17, "Reduce fatigue and prepare for the next cycle.", ("fatigue_reduction",), "deload", "maintenance", ("Readiness improves",), "Next-cycle decision"),
        ]

    def _phase(
        self,
        name: str,
        weight: float,
        purpose: str,
        objectives: Iterable[str],
        training_emphasis: str,
        nutrition_strategy: str,
        exit_criteria: Iterable[str],
        milestone: str,
    ) -> PhaseTemplate:
        return PhaseTemplate(
            name=name,
            weight=weight,
            purpose=purpose,
            objectives=tuple(objectives),
            training_emphasis=training_emphasis,
            nutrition_strategy=nutrition_strategy,
            exit_criteria=tuple(exit_criteria),
            milestone=milestone,
        )

    def _allocate_phases(self, templates: list[DisciplinePhase | PhaseTemplate], total_weeks: int) -> list[dict[str, Any]]:
        if not templates:
            return []
        # A very short horizon cannot support more phases than weeks. Keep the
        # beginning, the highest-specificity phase, and the taper/recovery end.
        if len(templates) > total_weeks:
            if total_weeks <= 3:
                templates = templates[-total_weeks:]
            else:
                middle_count = max(0, total_weeks - 2)
                middle = sorted(templates[1:-1], key=lambda item: item.weight, reverse=True)[:middle_count]
                selected = {templates[0], templates[-1], *middle}
                templates = [item for item in templates if item in selected]
        weights = [max(0.01, item.weight) for item in templates]
        weight_sum = sum(weights)
        raw = [total_weeks * weight / weight_sum for weight in weights]
        lengths = [max(1, int(math.floor(value))) for value in raw]
        while sum(lengths) < total_weeks:
            index = max(range(len(raw)), key=lambda i: raw[i] - lengths[i])
            lengths[index] += 1
        while sum(lengths) > total_weeks:
            candidates = [i for i, length in enumerate(lengths) if length > 1]
            if not candidates:
                break
            index = min(candidates, key=lambda i: raw[i] - lengths[i])
            lengths[index] -= 1
        phases: list[dict[str, Any]] = []
        cursor = 1
        used_ids: dict[str, int] = {}
        for template, length in zip(templates, lengths):
            base_id = _slug(template.name)
            used_ids[base_id] = used_ids.get(base_id, 0) + 1
            phase_id = base_id if used_ids[base_id] == 1 else f"{base_id}_{used_ids[base_id]}"
            phases.append({
                "id": phase_id,
                "name": template.name,
                "start_week": cursor,
                "end_week": cursor + length - 1,
                "duration_weeks": length,
                "purpose": template.purpose,
                "objectives": list(template.objectives),
                "training_emphasis": template.training_emphasis,
                "nutrition_strategy": template.nutrition_strategy,
                "exit_criteria": list(template.exit_criteria),
                "milestone": template.milestone,
                "load_phase": getattr(template, "load_phase", "Build"),
                "progression_rule": getattr(template, "progression_rule", "Progress one meaningful variable while preserving technical quality."),
                "protected_sessions": list(getattr(template, "protected_sessions", ())),
                "assessment_metrics": list(getattr(template, "assessment_metrics", ())),
                "status": "upcoming",
            })
            cursor += length
        return phases

    def _priorities(self, identity: str, objective: str, mode: str) -> list[dict[str, Any]]:
        return BellDisciplineLibrary().priorities(identity, objective, mode)
