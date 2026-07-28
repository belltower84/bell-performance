from __future__ import annotations
from typing import Any

from .mission_compiler import BellMissionCompiler
from .periodization_engine import BellPeriodizationEngine
from .block_programming import BellBlockProgrammingEngine
from .performance_forecast import BellPerformanceForecastEngine
from .competition_intelligence import BellCompetitionIntelligenceEngine
from .nutrition_periodization import BellNutritionPeriodizationEngine
from .pattern_recognition import BellPatternRecognitionEngine
from .goal_probability import BellGoalProbabilityEngine
from .digital_twin_simulation import BellDigitalTwinSimulationEngine
from .learning_engine import BellLearningEngine
from .coaching_language import BellCoachingLanguage

VERSION = "0.2.0"


class BellIntelligenceOrchestrator:
    """Coordinates Bell's long-horizon intelligence engines.

    The orchestrator deliberately stops at the multiweek-program layer. Weekly
    scheduling, session construction, exercise selection, readiness adaptation,
    and decision reasoning are executed by Bell Core after this result is
    produced so each layer can be audited independently.
    """

    def run(self, request: dict[str, Any]) -> dict[str, Any]:
        state = request.get("athlete_state", {})
        mission_request = dict(request["mission"])

        bcl_result = None
        bcl_text = request.get("coaching_language")
        if bcl_text:
            bcl = BellCoachingLanguage()
            program = bcl.parse(bcl_text)
            # BCL constraints augment, but do not silently erase, explicit API
            # constraints. Explicit request fields retain precedence.
            mission_request.setdefault("constraints", {})
            mission_request["constraints"] = {
                **program.get("constraints", {}),
                **mission_request.get("constraints", {}),
            }
            if program.get("priorities") and not mission_request.get("priority_order"):
                mission_request["priority_order"] = program["priorities"]
            context = request.get("bcl_context", {})
            bcl_result = {
                "program": program,
                "fired_rules": bcl.evaluate_rules(program, context) if context else [],
            }

        mission = BellMissionCompiler().compile(mission_request)
        period = BellPeriodizationEngine().select(mission, state)
        blocks = BellBlockProgrammingEngine().build(mission, period, state)
        forecast = BellPerformanceForecastEngine().forecast(mission, blocks, state)
        patterns = BellPatternRecognitionEngine().analyze(request.get("events", []))
        probability = BellGoalProbabilityEngine().estimate(mission, forecast, state, patterns)

        result: dict[str, Any] = {
            "intelligence_orchestrator_version": VERSION,
            "mission": mission,
            "periodization": period,
            "program": blocks,
            "forecast": forecast,
            "patterns": patterns,
            "goal_probability": probability,
        }
        if bcl_result is not None:
            result["coaching_language"] = bcl_result
        if request.get("competition"):
            result["competition"] = BellCompetitionIntelligenceEngine().plan(request["competition"], blocks)
        if request.get("athlete"):
            result["nutrition"] = BellNutritionPeriodizationEngine().build(mission, blocks, request["athlete"])
        if request.get("simulation_candidates"):
            result["simulation"] = BellDigitalTwinSimulationEngine().simulate(
                state, request["simulation_candidates"], mission
            )
        if request.get("learning_observations"):
            result["learning"] = BellLearningEngine().update(
                request.get("learning_parameters", {}),
                request["learning_observations"],
                float(request.get("learning_rate", 0.08)),
            )
        return result
