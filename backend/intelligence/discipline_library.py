from __future__ import annotations

from dataclasses import dataclass
import re
from typing import Any, Iterable

VERSION = "13.2.0"


def _clean(value: Any) -> str:
    return re.sub(r"\s+", " ", str(value or "")).strip()


def _slug(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "_", value.lower()).strip("_") or "performance_health"


@dataclass(frozen=True)
class DisciplinePhase:
    name: str
    weight: float
    purpose: str
    objectives: tuple[str, ...]
    training_emphasis: str
    nutrition_strategy: str
    exit_criteria: tuple[str, ...]
    milestone: str
    load_phase: str = "Build"
    progression_rule: str = "Progress one meaningful variable while preserving technical quality."
    protected_sessions: tuple[str, ...] = ()
    assessment_metrics: tuple[str, ...] = ()


class BellDisciplineLibrary:
    """Canonical discipline-specific coaching policy for Bell 13.2.

    Journey planning, weekly architecture, progression, missed-session decisions,
    readiness changes, and cycle renewal all resolve through this library.
    """

    version = VERSION

    _profiles: dict[str, dict[str, Any]] = {
        "performance_health": {
            "label": "Performance & Health",
            "promise": "Build a stronger, leaner, healthier athlete through repeatable strength work, aerobic development, and sustainable habits.",
            "weekly_architecture": {"strength": 3, "engine": 2, "recovery": 2},
            "protected_sessions": ["Full-body strength", "Second strength exposure", "Aerobic base"],
            "progression": "Add repetitions and consistency before adding load, density, or conditioning difficulty.",
            "missed_session_rule": "Resume the next highest-priority strength session. Replace missed conditioning with walking instead of stacking hard work.",
            "readiness_yellow": "Keep the primary strength work, remove optional finishers, and make Engine work easy.",
            "readiness_red": "Use recovery, mobility, and easy walking only until readiness or symptoms improve.",
            "assessments": ["bodyweight trend", "waist trend", "strength retention", "weekly adherence", "aerobic tolerance"],
            "cycle_rotation": ["Consistency", "Strength Capacity", "Body Composition", "Work Capacity"],
        },
        "powerlifting": {
            "label": "Powerlifting",
            "promise": "Improve squat, bench press, and deadlift through specific practice, controlled overload, weak-point development, and fatigue-aware peaking.",
            "weekly_architecture": {"strength": 4, "engine": 1, "recovery": 2},
            "protected_sessions": ["Squat focus", "Bench focus", "Deadlift focus", "Secondary squat and bench"],
            "progression": "Progress top sets only when bar speed, technique, and target RPE agree; derive back-off work from the completed top set.",
            "missed_session_rule": "Preserve competition-lift order. Move a missed primary lift only when at least 48 hours remain before the next high-fatigue lower session.",
            "readiness_yellow": "Keep competition-lift technique and one priority top set; reduce back-off and accessory volume by roughly 25 percent.",
            "readiness_red": "Replace heavy work with technique practice at low RPE or a recovery session. Do not force missed heavy exposures into the week.",
            "assessments": ["estimated squat 1RM", "estimated bench 1RM", "estimated deadlift 1RM", "top-set RPE accuracy", "bar-quality trend"],
            "cycle_rotation": ["Hypertrophy Base", "Competition-Lift Strength", "Weak-Point Strength", "Technique Efficiency"],
        },
        "bodybuilding": {
            "label": "Bodybuilding",
            "promise": "Build muscle through stable exercise selection, productive weekly volume, deliberate weak-point work, and recoverable proximity to failure.",
            "weekly_architecture": {"strength": 5, "engine": 2, "recovery": 1},
            "protected_sessions": ["Priority weak-point exposure", "Legs", "Push", "Pull"],
            "progression": "Use double progression at one to three repetitions in reserve; add load after the top of the rep range is owned across prescribed sets.",
            "missed_session_rule": "Skip the missed full session or merge one small accessory block. Never double two complete hypertrophy sessions.",
            "readiness_yellow": "Keep priority muscle work and compounds, cut low-value isolation volume, and stop farther from failure.",
            "readiness_red": "Use a recovery microcycle with reduced sets and no failure work.",
            "assessments": ["target-muscle performance", "weekly set tolerance", "bodyweight trend", "circumference or photo review", "joint tolerance"],
            "cycle_rotation": ["Global Growth", "Weak-Point Emphasis", "Strength Support", "Volume Resensitization"],
        },
        "hybrid_athlete": {
            "label": "Hybrid Athlete",
            "promise": "Develop strength and endurance concurrently while protecting key sessions from interference and unproductive fatigue.",
            "weekly_architecture": {"strength": 4, "engine": 3, "recovery": 1},
            "protected_sessions": ["Primary lower strength", "Primary upper strength", "Quality Engine", "Long aerobic session"],
            "progression": "Increase only one major lower-body stressor at a time: lifting intensity, hard running volume, or long-session duration.",
            "missed_session_rule": "Protect primary strength and the long Engine session. Remove redundant intensity before rescheduling a missed workout.",
            "readiness_yellow": "Preserve one key strength and one key Engine exposure; convert secondary intensity to Zone 2.",
            "readiness_red": "Remove intervals and mixed-modal intensity; retain easy aerobic work and low-fatigue technique lifting only.",
            "assessments": ["strength retention", "threshold pace or power", "long-session durability", "concurrent fatigue", "weekly completion"],
            "cycle_rotation": ["Strength Bias", "Aerobic Bias", "Balanced Development", "Durability"],
        },
        "tactical_athlete": {
            "label": "Tactical Athlete",
            "promise": "Build operational strength, aerobic durability, load carriage, grip, and repeatable work capacity without compromising readiness for duty.",
            "weekly_architecture": {"strength": 4, "engine": 3, "recovery": 1},
            "protected_sessions": ["Lower strength", "Upper strength", "Long aerobic or ruck", "Operational work-capacity session"],
            "progression": "Progress load carriage, running intensity, and lower-body strength on separate weeks whenever possible.",
            "missed_session_rule": "Protect duty readiness. Keep the long aerobic or ruck session and primary strength work; drop redundant conditioning first.",
            "readiness_yellow": "Retain strength technique and easy aerobic durability; reduce loaded carries and high-impact intervals.",
            "readiness_red": "Use mobility, easy aerobic recovery, and pain-free technique only. Operational readiness outranks training completion.",
            "assessments": ["loaded movement tolerance", "grip endurance", "aerobic benchmark", "strength benchmark", "work-capacity repeatability"],
            "cycle_rotation": ["Strength & Armor", "Aerobic Durability", "Work Capacity", "Load Carriage"],
        },
        "functional_fitness": {
            "label": "Functional Fitness",
            "promise": "Develop strength, gymnastics or skill capacity, and mixed-modal conditioning through balanced exposure and controlled intensity density.",
            "weekly_architecture": {"strength": 3, "engine": 3, "recovery": 1},
            "protected_sessions": ["Primary strength or Olympic-lift exposure", "Skill exposure", "Mixed-modal benchmark"],
            "progression": "Progress skill complexity, strength loading, and conditioning density independently rather than increasing all three together.",
            "missed_session_rule": "Preserve the primary skill and strength exposure. Skip duplicate mixed-modal intensity rather than stacking metcons.",
            "readiness_yellow": "Keep skill practice and strength technique; shorten the conditioning piece and avoid failure density.",
            "readiness_red": "Remove mixed-modal intensity and use skill drills, mobility, and easy cyclical work.",
            "assessments": ["strength benchmark", "skill consistency", "mixed-modal repeatability", "movement quality", "recovery between efforts"],
            "cycle_rotation": ["Strength", "Skill", "Aerobic Capacity", "Mixed-Modal Integration"],
        },
        "endurance_athlete": {
            "label": "Endurance Athlete",
            "promise": "Build durable aerobic volume, threshold speed, high-end aerobic power, and event-specific execution while preserving strength and tissue capacity.",
            "weekly_architecture": {"strength": 3, "engine": 4, "recovery": 1},
            "protected_sessions": ["Long session", "Quality Engine session", "Durability strength"],
            "progression": "Increase volume before intensity, and avoid increasing long-session duration and interval volume in the same week.",
            "missed_session_rule": "Protect the long session and one quality session. Do not make up missed easy volume by turning recovery days hard.",
            "readiness_yellow": "Keep the long session easy and reduce interval repetitions; preserve short durability strength.",
            "readiness_red": "Replace intensity with easy aerobic work or rest. Resume quality only after symptoms and mechanics normalize.",
            "assessments": ["aerobic pace or power", "threshold pace or power", "long-session durability", "running economy or efficiency", "strength retention"],
            "cycle_rotation": ["Aerobic Base", "Threshold", "VO2 Support", "Durability"],
        },
    }

    def discipline_id(self, identity: str, objective: str = "", text: str = "") -> str:
        value = " ".join((_clean(identity), _clean(objective), _clean(text))).lower()
        if "powerlift" in value or all(token in value for token in ("squat", "bench", "deadlift")):
            return "powerlifting"
        if any(token in value for token in ("bodybuild", "physique", "hypertrophy", "muscle building")):
            return "bodybuilding"
        if any(token in value for token in ("tactical", "selection", "ruck", "police", "military", "fire")):
            return "tactical_athlete"
        if any(token in value for token in ("functional fitness", "crossfit", "mixed modal")):
            return "functional_fitness"
        if any(token in value for token in ("marathon", "half marathon", "10k", "5k", "running", "cycling", "triathlon", "endurance")):
            return "endurance_athlete"
        if any(token in value for token in ("hybrid", "athletic performance", "sport performance", "speed", "agility")):
            return "hybrid_athlete"
        return "performance_health"

    def get(self, identity: str, objective: str = "", text: str = "") -> dict[str, Any]:
        discipline_id = self.discipline_id(identity, objective, text)
        return {"id": discipline_id, "library_version": self.version, **self._profiles[discipline_id]}

    @staticmethod
    def phase(
        name: str,
        weight: float,
        purpose: str,
        objectives: Iterable[str],
        training_emphasis: str,
        nutrition_strategy: str,
        exit_criteria: Iterable[str],
        milestone: str,
        *,
        load_phase: str = "Build",
        progression_rule: str = "Progress one meaningful variable while preserving technical quality.",
        protected_sessions: Iterable[str] = (),
        assessment_metrics: Iterable[str] = (),
    ) -> DisciplinePhase:
        return DisciplinePhase(
            name=name,
            weight=weight,
            purpose=purpose,
            objectives=tuple(objectives),
            training_emphasis=training_emphasis,
            nutrition_strategy=nutrition_strategy,
            exit_criteria=tuple(exit_criteria),
            milestone=milestone,
            load_phase=load_phase,
            progression_rule=progression_rule,
            protected_sessions=tuple(protected_sessions),
            assessment_metrics=tuple(assessment_metrics),
        )

    def journey_templates(self, identity: str, objective: str, mode: str, weeks: int) -> list[DisciplinePhase]:
        discipline = self.discipline_id(identity, objective)
        if mode == "event_preparation":
            return self._event_templates(discipline, weeks)
        return self._continuous_templates(discipline, objective)

    def _event_templates(self, discipline: str, weeks: int) -> list[DisciplinePhase]:
        if weeks <= 6:
            return [
                self.phase("Specific Preparation", .55, "Practice the objective's highest-value demands.", ("specificity", "execution"), "specific", "maintenance", ("Key sessions completed", "No unresolved red flags"), "Complete the final event-specific simulation", progression_rule="Preserve event-specific quality; remove low-value volume first."),
                self.phase("Peak", .25, "Express performance with lower volume and high-quality work.", ("performance_expression",), "peak", "maintenance", ("Performance is stable",), "Complete the final readiness assessment", load_phase="Peak", progression_rule="Maintain intensity while reducing total work."),
                self.phase("Taper", .20, "Reduce fatigue without losing readiness.", ("fatigue_reduction",), "taper", "maintenance", ("Arrive recovered",), "Event day", load_phase="Deload", progression_rule="Reduce volume; do not create new fitness in taper."),
            ]
        if discipline == "powerlifting":
            return [
                self.phase("Foundation", .15, "Build competition-lift technique, work capacity, and tolerance for heavier training.", ("movement_quality", "work_capacity"), "foundation", "maintenance", ("Technique is repeatable",), "Foundation review", load_phase="Foundation", protected_sessions=("Squat focus", "Bench focus", "Deadlift focus")),
                self.phase("Volume", .22, "Accumulate competition-lift volume and useful muscle.", ("strength_base", "hypertrophy"), "accumulation", "maintenance", ("Volume targets completed",), "Rep-strength assessment", progression_rule="Add back-off volume or repetitions before raising top-set intensity."),
                self.phase("Strength", .24, "Increase force production in the competition lifts.", ("max_strength",), "strength", "maintenance", ("Top sets progress at target RPE",), "Heavy triple or double benchmark", progression_rule="Progress top sets at target RPE and calculate back-offs from the completed top set."),
                self.phase("Intensification", .18, "Raise specificity and practice heavier competition work.", ("specific_strength",), "intensification", "maintenance", ("Heavy exposures remain technically sound",), "Opener-range exposure", progression_rule="Increase specificity while reducing accessory fatigue."),
                self.phase("Peak", .12, "Convert training into meet-day performance.", ("performance_expression",), "peak", "maintenance", ("Openers are selected",), "Final opener practice", load_phase="Peak", progression_rule="Practice commands and selected attempts; avoid grinders."),
                self.phase("Taper", .09, "Reduce fatigue while preserving confidence and skill.", ("fatigue_reduction",), "taper", "maintenance", ("Athlete is recovered",), "Meet day", load_phase="Deload", progression_rule="Retain brief competition-lift exposure and remove nonessential work."),
            ]
        if discipline == "endurance_athlete":
            return [
                self.phase("Aerobic Base", .27, "Expand durable aerobic capacity and consistent volume.", ("aerobic_base",), "foundation", "maintenance", ("Volume is tolerated consistently",), "Aerobic benchmark", load_phase="Foundation", progression_rule="Increase easy volume gradually while keeping most work conversational."),
                self.phase("Threshold", .20, "Improve sustainable speed and lactate clearance.", ("lactate_threshold",), "threshold", "maintenance", ("Threshold sessions are repeatable",), "Threshold assessment", progression_rule="Add controlled threshold minutes without racing training."),
                self.phase("VO2 Development", .15, "Raise high-end aerobic power without overwhelming recovery.", ("vo2",), "intensification", "maintenance", ("Quality intervals are completed",), "VO2 benchmark", progression_rule="Progress interval volume before pace; preserve mechanics."),
                self.phase("Race Specific", .22, "Practice goal pace, fueling, and event-specific durability.", ("specificity", "durability"), "specific", "event_fueling", ("Key simulation is complete",), "Final race simulation", progression_rule="Progress race-specific duration while protecting the long-session recovery window."),
                self.phase("Peak", .08, "Sharpen speed while lowering accumulated fatigue.", ("performance_expression",), "peak", "maintenance", ("Race pace feels controlled",), "Readiness check", load_phase="Peak", progression_rule="Keep brief race-pace contact and reduce total volume."),
                self.phase("Taper", .08, "Arrive fresh without losing rhythm.", ("fatigue_reduction",), "taper", "event_fueling", ("Athlete is recovered",), "Event day", load_phase="Deload", progression_rule="Reduce volume while preserving familiar rhythm and fueling."),
            ]
        if discipline == "bodybuilding":
            return [
                self.phase("Foundation", .15, "Build movement quality, training tolerance, and consistent execution.", ("movement_quality",), "foundation", "maintenance", ("Training is consistent",), "Foundation review", load_phase="Foundation"),
                self.phase("Growth", .28, "Build muscle with progressive volume and stable recovery.", ("hypertrophy",), "accumulation", "small_surplus_or_maintenance", ("Target muscle groups are progressing",), "Physique and performance review"),
                self.phase("Weak-Point Development", .18, "Prioritize the physique areas that need the most improvement.", ("weak_points",), "hypertrophy", "maintenance", ("Weak-point volume is tolerated",), "Weak-point review"),
                self.phase("Contest Preparation", .24, "Preserve muscle while reducing body fat and maintaining training quality.", ("body_composition", "muscle_retention"), "specific", "calorie_deficit", ("Rate of loss is appropriate",), "Final physique assessment", progression_rule="Maintain load and execution while reducing fatigue and body weight at a sustainable rate."),
                self.phase("Peak Week", .15, "Reduce fatigue and preserve fullness without last-minute extremes.", ("performance_expression",), "taper", "coach_supervised_peak", ("No unresolved health concerns",), "Competition day", load_phase="Deload", progression_rule="Avoid aggressive last-minute changes; preserve health and predictability."),
            ]
        return [
            self.phase("Foundation", .20, "Build the base that supports harder work later.", ("movement_quality", "work_capacity"), "foundation", "maintenance", ("Consistency established",), "Foundation review", load_phase="Foundation"),
            self.phase("Development", .30, "Build the highest-priority physical qualities.", ("primary_adaptation",), "accumulation", "maintenance", ("Progress markers improve",), "Development benchmark"),
            self.phase("Intensification", .20, "Increase the specificity and difficulty of key sessions.", ("specificity",), "intensification", "maintenance", ("Key sessions completed",), "Performance assessment"),
            self.phase("Specific Preparation", .17, "Practice the exact demands of the event.", ("event_specificity",), "specific", "event_fueling", ("Simulation completed",), "Final simulation"),
            self.phase("Peak", .07, "Express performance while controlling fatigue.", ("performance_expression",), "peak", "maintenance", ("Readiness is stable",), "Readiness check", load_phase="Peak"),
            self.phase("Taper", .06, "Reduce fatigue and arrive prepared.", ("fatigue_reduction",), "taper", "maintenance", ("Athlete is recovered",), "Event day", load_phase="Deload"),
        ]

    def _continuous_templates(self, discipline: str, objective: str) -> list[DisciplinePhase]:
        if objective == "Lose Fat":
            return [
                self.phase("Foundation", .16, "Build repeatable training, movement, and nutrition habits.", ("consistency", "movement_quality"), "foundation", "small_deficit", ("Adherence is stable",), "Foundation check-in", load_phase="Foundation"),
                self.phase("Fat Loss I", .24, "Reduce body fat while preserving strength and muscle.", ("body_composition", "muscle_retention"), "fat_loss", "calorie_deficit", ("Weight trend is appropriate", "Strength is stable"), "First bodyweight milestone", progression_rule="Preserve strength first; progress steps or easy aerobic work before cutting calories further."),
                self.phase("Recovery", .10, "Reduce training and diet fatigue before the next push.", ("fatigue_reduction",), "deload", "maintenance", ("Readiness improves",), "Recovery review", load_phase="Deload"),
                self.phase("Fat Loss II", .24, "Continue fat loss with progressive strength and aerobic support.", ("body_composition", "work_capacity"), "fat_loss", "calorie_deficit", ("Progress resumes without excessive fatigue",), "Next bodyweight milestone", progression_rule="Adjust one lever at a time: adherence, daily movement, cardio, then calories."),
                self.phase("Diet Break", .10, "Restore training quality and diet adherence at maintenance intake.", ("recovery", "adherence"), "recovery", "maintenance", ("Hunger and performance normalize",), "Maintenance review", load_phase="Recovery"),
                self.phase("Recomposition", .16, "Consolidate the result and improve performance at a stable bodyweight.", ("muscle_retention", "strength"), "recomposition", "maintenance", ("Weight is stable and performance improves",), "Journey assessment"),
            ]
        if discipline == "bodybuilding" or objective in ("Build Muscle", "Body Recomposition"):
            return [
                self.phase("Foundation", .14, "Establish technique, volume tolerance, and recovery habits.", ("movement_quality",), "foundation", "maintenance", ("Execution is consistent",), "Foundation review", load_phase="Foundation"),
                self.phase("Growth", .30, "Accumulate productive hypertrophy volume.", ("hypertrophy",), "accumulation", "small_surplus_or_maintenance", ("Volume and performance progress",), "Growth review"),
                self.phase("Strength Support", .18, "Raise force production to support future hypertrophy.", ("strength",), "strength", "maintenance", ("Key lifts progress",), "Strength assessment"),
                self.phase("Weak-Point Development", .22, "Prioritize lagging muscle groups without losing global progress.", ("weak_points",), "hypertrophy", "small_surplus_or_maintenance", ("Target areas tolerate added volume",), "Weak-point review"),
                self.phase("Recovery", .16, "Reduce fatigue and resensitize the athlete to productive volume.", ("fatigue_reduction",), "deload", "maintenance", ("Readiness improves",), "Cycle assessment", load_phase="Deload"),
            ]
        if discipline == "powerlifting" or (discipline == "performance_health" and objective == "Increase Strength"):
            return [
                self.phase("Hypertrophy Base", .24, "Build muscle and work capacity for future strength work.", ("hypertrophy", "work_capacity"), "accumulation", "maintenance", ("Volume is tolerated",), "Rep-strength assessment"),
                self.phase("Strength Development", .28, "Increase competition-lift force production.", ("max_strength",), "strength", "maintenance", ("Top sets progress at target RPE",), "Heavy triple assessment", progression_rule="Use top-set RPE and bar quality to progress; calculate back-offs from the completed top set."),
                self.phase("Intensification", .20, "Practice heavier, more specific lifting while controlling fatigue.", ("specific_strength",), "intensification", "maintenance", ("Heavy exposures remain technically sound",), "Estimated 1RM assessment"),
                self.phase("Assessment", .12, "Measure progress and identify the next limiting lift or quality.", ("testing",), "assessment", "maintenance", ("Assessment completed",), "Performance review", load_phase="Peak"),
                self.phase("Recovery", .16, "Reduce fatigue before beginning the next strength cycle.", ("fatigue_reduction",), "deload", "maintenance", ("Readiness improves",), "Next-cycle decision", load_phase="Deload"),
            ]
        if discipline == "endurance_athlete":
            return [
                self.phase("Aerobic Base", .30, "Build durable aerobic capacity and consistent volume.", ("aerobic_base",), "foundation", "maintenance", ("Volume is tolerated",), "Aerobic benchmark", load_phase="Foundation"),
                self.phase("Threshold", .22, "Improve sustainable pace and efficiency.", ("lactate_threshold",), "threshold", "maintenance", ("Threshold sessions progress",), "Threshold assessment"),
                self.phase("VO2 Development", .18, "Raise high-end aerobic power.", ("vo2",), "intensification", "maintenance", ("Quality work is repeatable",), "VO2 assessment"),
                self.phase("Assessment", .12, "Measure progress and identify the next limiter.", ("testing",), "assessment", "maintenance", ("Assessment completed",), "Performance review", load_phase="Peak"),
                self.phase("Recovery", .18, "Reduce fatigue before the next aerobic cycle.", ("fatigue_reduction",), "deload", "maintenance", ("Readiness improves",), "Next-cycle decision", load_phase="Deload"),
            ]
        if discipline == "tactical_athlete":
            return [
                self.phase("Foundation", .16, "Build movement quality and aerobic durability for duty demands.", ("movement_quality", "aerobic_base"), "foundation", "maintenance", ("Consistency established",), "Foundation review", load_phase="Foundation"),
                self.phase("Strength & Armor", .22, "Increase force production, structural resilience, grip, and trunk strength.", ("strength", "durability"), "strength", "maintenance", ("Strength markers improve",), "Operational strength benchmark"),
                self.phase("Aerobic Durability", .18, "Improve sustainable conditioning and recovery between efforts.", ("aerobic_base", "threshold"), "threshold", "maintenance", ("Engine work is repeatable",), "Aerobic benchmark"),
                self.phase("Load & Work Capacity", .22, "Integrate carries, loaded movement, and repeatable high-output work.", ("load_carriage", "work_capacity"), "specific", "maintenance", ("Loaded work remains technically sound",), "Operational simulation"),
                self.phase("Assessment", .10, "Measure readiness and identify the next limiting quality.", ("testing",), "assessment", "maintenance", ("Assessment completed",), "Readiness review", load_phase="Peak"),
                self.phase("Recovery", .12, "Reduce fatigue and restore readiness for the next cycle.", ("fatigue_reduction",), "deload", "maintenance", ("Readiness improves",), "Next-cycle decision", load_phase="Deload"),
            ]
        if discipline == "functional_fitness":
            return [
                self.phase("Foundation", .16, "Build movement quality, aerobic capacity, and repeatable skill practice.", ("movement_quality", "aerobic_base"), "foundation", "maintenance", ("Movement standards are consistent",), "Foundation review", load_phase="Foundation"),
                self.phase("Strength & Skill", .22, "Improve primary strength and the athlete's highest-priority skill limiter.", ("strength", "skill"), "strength", "maintenance", ("Strength and skill markers improve",), "Strength and skill benchmark"),
                self.phase("Engine Development", .18, "Raise cyclical capacity and recovery between efforts.", ("aerobic_base", "threshold"), "threshold", "maintenance", ("Engine work is repeatable",), "Engine benchmark"),
                self.phase("Mixed-Modal Integration", .24, "Combine strength, skill, and conditioning under controlled density.", ("mixed_modal", "work_capacity"), "specific", "maintenance", ("Movement quality holds under fatigue",), "Mixed-modal benchmark"),
                self.phase("Assessment", .08, "Measure progress and select the next limiter.", ("testing",), "assessment", "maintenance", ("Assessment completed",), "Performance review", load_phase="Peak"),
                self.phase("Recovery", .12, "Reduce fatigue and prepare for the next cycle.", ("fatigue_reduction",), "deload", "maintenance", ("Readiness improves",), "Next-cycle decision", load_phase="Deload"),
            ]
        if discipline == "hybrid_athlete":
            return [
                self.phase("Foundation", .18, "Build durable movement quality and aerobic capacity.", ("movement_quality", "aerobic_base"), "foundation", "maintenance", ("Consistency established",), "Foundation review", load_phase="Foundation"),
                self.phase("Strength Development", .22, "Increase force production while preserving aerobic volume.", ("strength",), "strength", "maintenance", ("Strength markers improve",), "Strength benchmark"),
                self.phase("Engine Development", .20, "Improve sustainable conditioning while maintaining key lifts.", ("aerobic_base", "threshold"), "threshold", "maintenance", ("Engine sessions progress",), "Engine benchmark"),
                self.phase("Hybrid Integration", .22, "Combine strength and Engine qualities under controlled fatigue.", ("work_capacity", "concurrent_fitness"), "specific", "maintenance", ("Mixed sessions remain repeatable",), "Hybrid simulation"),
                self.phase("Assessment", .08, "Measure progress and identify the next limiting quality.", ("testing",), "assessment", "maintenance", ("Assessment completed",), "Performance review", load_phase="Peak"),
                self.phase("Recovery", .10, "Reduce fatigue and prepare for the next bias cycle.", ("fatigue_reduction",), "deload", "maintenance", ("Readiness improves",), "Next-cycle decision", load_phase="Deload"),
            ]
        return [
            self.phase("Foundation", .22, "Build movement quality, consistency, and general capacity.", ("movement_quality", "consistency"), "foundation", "maintenance", ("Routine is sustainable",), "Foundation review", load_phase="Foundation"),
            self.phase("Capacity", .25, "Improve strength and aerobic work capacity.", ("strength", "aerobic_base"), "accumulation", "maintenance", ("Capacity markers improve",), "Capacity benchmark"),
            self.phase("Performance", .24, "Develop the athlete's highest-priority performance quality.", ("primary_adaptation",), "intensification", "maintenance", ("Performance markers improve",), "Performance assessment"),
            self.phase("Assessment", .12, "Measure progress and select the next emphasis.", ("testing",), "assessment", "maintenance", ("Assessment completed",), "Journey review", load_phase="Peak"),
            self.phase("Recovery", .17, "Reduce fatigue and prepare for the next cycle.", ("fatigue_reduction",), "deload", "maintenance", ("Readiness improves",), "Next-cycle decision", load_phase="Deload"),
        ]

    def priorities(self, identity: str, objective: str, mode: str) -> list[dict[str, Any]]:
        profile = self.get(identity, objective)
        if objective == "Lose Fat":
            labels = ["Preserve muscle and strength", "Reduce body fat at a sustainable rate", "Maintain training consistency"]
        elif objective == "Body Recomposition":
            labels = ["Increase or preserve lean mass", "Improve body composition", "Maintain recoverable conditioning"]
        else:
            labels = list(profile["protected_sessions"][:3])
            labels = [f"Protect {item.lower()}" for item in labels]
        if mode == "event_preparation":
            labels[0] = f"Arrive prepared for the event while preserving {labels[0].replace('Protect ', '').lower()}"
        return [{"rank": index + 1, "label": label} for index, label in enumerate(labels)]

    def continuous_policy(self, identity: str, objective: str) -> dict[str, Any]:
        profile = self.get(identity, objective)
        return {
            "mode": "renewable_cycles",
            "cycle_rotation": profile["cycle_rotation"],
            "renewal_trigger": "Complete assessment and recovery, then begin the next cycle without resetting completed history.",
            "selection_rule": "Select the next bias from objective priority, weakest assessment metric, adherence, and recovery response.",
            "extension_rule": "Extend the current development phase one to two weeks when progress is continuing, recovery is stable, and no deadline conflicts.",
            "recovery_rule": "Insert or advance recovery when readiness, pain, illness, or adherence risk exceeds tolerance.",
        }

    def next_cycle_emphasis(self, identity: str, objective: str, cycle_number: int) -> str:
        rotation = self.get(identity, objective)["cycle_rotation"]
        return rotation[(max(1, cycle_number) - 1) % len(rotation)]

    def weekly_rules(
        self,
        identity: str,
        objective: str,
        phase_name: str,
        *,
        training_days: int,
        requested_strength: int | None = None,
        requested_engine: int | None = None,
    ) -> dict[str, Any]:
        profile = self.get(identity, objective)
        discipline = profile["id"]
        phase = _clean(phase_name).lower()
        strength = int(requested_strength if requested_strength is not None else profile["weekly_architecture"]["strength"])
        engine = int(requested_engine if requested_engine is not None else profile["weekly_architecture"]["engine"])
        load_phase = "Build"
        if any(token in phase for token in ("foundation", "base")):
            load_phase = "Foundation"
        if any(token in phase for token in ("peak", "assessment")):
            load_phase = "Peak"
        if any(token in phase for token in ("recovery", "deload", "diet break", "taper")):
            load_phase = "Deload"

        if discipline == "powerlifting":
            strength = min(4, max(3, strength or 4))
            engine = 0 if any(token in phase for token in ("taper", "meet week")) else min(1, max(0, engine))
            sessions = ["Powerlifting Squat Focus", "Powerlifting Bench Focus", "Powerlifting Deadlift Focus", "Powerlifting Secondary Squat + Bench", "Powerlifting Aerobic Recovery"]
        elif discipline == "bodybuilding":
            strength = min(5, max(4, strength or 5))
            if "recovery" in phase or "deload" in phase:
                strength = min(strength, 4)
            engine = min(2, max(1, engine))
            sessions = ["Push", "Pull", "Legs", "Upper", "Lower", "Aerobic Base", "Easy Run"]
        elif discipline == "endurance_athlete":
            strength = min(3, max(2, strength or 3))
            engine = min(5, max(3, engine or 4))
            if "aerobic base" in phase:
                sessions = ["Easy Run", "Long Run", "Aerobic Base", "Upper Strength", "Lower Strength", "Threshold"]
            elif "threshold" in phase:
                sessions = ["Threshold", "Easy Run", "Long Run", "Aerobic Base", "Upper Strength", "Lower Strength"]
            elif "vo2" in phase:
                sessions = ["Intervals", "Easy Run", "Long Run", "Threshold", "Upper Strength", "Lower Strength"]
            else:
                sessions = ["Long Run", "Threshold", "Easy Run", "Intervals", "Upper Strength", "Lower Strength"]
        elif discipline == "tactical_athlete":
            strength = min(4, max(3, strength or 4))
            engine = min(3, max(2, engine or 3))
            sessions = ["Lower Strength", "Upper Strength", "Upper Volume", "Lower Volume", "Long Aerobic", "Mixed Modal", "Intervals", "Aerobic Base"]
        elif discipline == "functional_fitness":
            strength = min(4, max(3, strength or 3))
            engine = min(3, max(2, engine or 3))
            sessions = ["Lower Strength", "Upper Strength", "Full Body Hypertrophy", "Mixed Modal", "Intervals", "Aerobic Base"]
        elif discipline == "hybrid_athlete":
            strength = min(4, max(3, strength or 4))
            engine = min(4, max(2, engine or 3))
            sessions = ["Lower Strength", "Upper Strength", "Lower Volume", "Upper Volume", "Threshold", "Easy Run", "Long Run", "Aerobic Base"]
        else:
            strength = min(4, max(3, strength or 3))
            engine = min(3, max(2, engine or 2))
            sessions = ["Full Body Hypertrophy", "Upper Strength", "Lower Strength", "Upper Hypertrophy", "Lower Hypertrophy", "Aerobic Base", "Easy Run", "Threshold"]

        if any(token in phase for token in ("recovery", "deload", "diet break")):
            strength = max(2, min(strength, 3 if discipline != "bodybuilding" else 4))
            engine = min(engine, 1)
        if any(token in phase for token in ("assessment", "peak")) and discipline != "endurance_athlete":
            engine = min(engine, 1)

        # Exposures may exceed selected calendar days because compatible upper +
        # easy Engine pairings are intentionally supported.
        strength = max(1, min(5, strength))
        engine = max(0, min(5, engine))
        return {
            "discipline_id": discipline,
            "discipline_label": profile["label"],
            "load_phase": load_phase,
            "strength_target": strength,
            "engine_target": engine,
            "session_order": sessions,
            "protected_sessions": profile["protected_sessions"],
            "progression_rule": profile["progression"],
            "missed_session_rule": profile["missed_session_rule"],
            "readiness_yellow": profile["readiness_yellow"],
            "readiness_red": profile["readiness_red"],
            "assessment_metrics": profile["assessments"],
            "weekly_architecture": profile["weekly_architecture"],
            "training_days": training_days,
        }

    def evaluate_transition(self, journey: dict[str, Any], signals: dict[str, Any] | None = None) -> dict[str, Any]:
        signals = signals or {}
        readiness = float(signals.get("readiness", 70) or 70)
        adherence = float(signals.get("adherence", 1.0) or 0)
        pain = float(signals.get("pain", 0) or 0)
        progress = float(signals.get("progress", 0.5) or 0)
        phase_complete = bool(signals.get("phase_complete", False))
        deadline_pressure = bool(signals.get("deadline_pressure", False))
        if pain >= 7 or readiness < 45 or signals.get("illness"):
            action, reason = "recover", "Recovery risk is too high to justify normal progression."
        elif adherence < .60:
            action, reason = "hold", "Bell needs a repeatable week before increasing training demand."
        elif phase_complete and progress >= .70:
            action, reason = "advance", "The phase objective was achieved with acceptable recovery."
        elif phase_complete and progress < .40 and not deadline_pressure:
            action, reason = "extend", "The adaptation needs more exposure and the timeline permits an extension."
        elif deadline_pressure:
            action, reason = "advance", "The event timeline requires the next specificity step."
        else:
            action, reason = "continue", "Current work remains appropriate and no transition trigger is active."
        return {"action": action, "reason": reason, "library_version": self.version}
