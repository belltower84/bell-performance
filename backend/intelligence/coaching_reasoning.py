from __future__ import annotations

import argparse
import copy
import json
from dataclasses import dataclass, asdict
from pathlib import Path
from typing import Any

VERSION = "0.1.0"


def clamp(v: float, lo: float = 0.0, hi: float = 100.0) -> float:
    return max(lo, min(hi, v))


def norm(v: Any) -> str:
    return str(v or "").strip().lower().replace("-", "_").replace(" ", "_")


@dataclass
class CandidateDecision:
    action: str
    score: float
    confidence: float
    feasible: bool
    reason_codes: list[str]
    tradeoffs: list[str]
    projected_effects: dict[str, float]
    changes: list[dict[str, Any]]
    evidence_ids: list[str]


class BellCoachingReasoningEngine:
    """Deterministic, auditable coaching decision orchestrator.

    It combines athlete state, today's check-in, mission priorities, the planned
    week, and engine proposals. It generates competing actions, applies safety
    constraints, scores trade-offs, resolves conflicts, and returns one decision.
    """

    def __init__(self, rulebook_path: str | Path, evidence_catalog_path: str | Path):
        self.rules = json.loads(Path(rulebook_path).read_text())
        catalog = json.loads(Path(evidence_catalog_path).read_text())
        self.evidence = {x["id"]: x for x in catalog["claims"]}
        self.rule_links = catalog.get("rule_links", {})

    def _signals(self, request: dict[str, Any]) -> dict[str, Any]:
        state = request.get("athlete_state", {})
        check = request.get("checkin", {})
        pain = check.get("pain", {}) or {}
        max_pain = max([float(x) for x in pain.values()] or [0.0])
        soreness = check.get("soreness", {}) or {}
        max_soreness = max([float(x) for x in soreness.values()] or [0.0])
        readiness = float(check.get("readiness_score", state.get("readiness", {}).get("current", 75)))
        fatigue = state.get("fatigue_banks", state.get("fatigue", {})) or {}
        peak_fatigue = max([float(x) for x in fatigue.values() if isinstance(x, (int, float))] or [0.0])
        compliance = float(state.get("compliance", {}).get("rate", state.get("compliance_rate", 1.0)))
        if compliance <= 1: compliance *= 100
        momentum = float(state.get("momentum", {}).get("score", state.get("momentum_score", 70)))
        sleep = float(check.get("sleep_hours", check.get("sleep", {}).get("hours", 7.5) if isinstance(check.get("sleep"), dict) else 7.5))
        available = float(check.get("available_minutes", request.get("planned_session", {}).get("estimated_total_minutes", 60)))
        red_flags = bool(check.get("red_flags") or check.get("chest_pain") or check.get("fainting") or check.get("neurological_symptoms"))
        plateau = bool(state.get("performance", {}).get("plateau") or state.get("plateau_detected"))
        return {"readiness":readiness,"peak_fatigue":peak_fatigue,"compliance":compliance,"momentum":momentum,
                "sleep":sleep,"available":available,"max_pain":max_pain,"max_soreness":max_soreness,
                "red_flags":red_flags,"illness":bool(check.get("illness_symptoms")),"plateau":plateau,
                "travel":bool(check.get("travel") or check.get("equipment_changed"))}

    def _reason_codes(self, s: dict[str, Any], mission_criticality: float) -> list[str]:
        out=[]
        if s["red_flags"]: out.append("RED_FLAG")
        if s["max_pain"] >= 7: out.append("PAIN_HIGH")
        if s["readiness"] < 55 or s["sleep"] < 5: out.append("READINESS_LOW")
        if s["peak_fatigue"] >= 75: out.append("FATIGUE_HIGH")
        if s["compliance"] < 70: out.append("COMPLIANCE_LOW")
        if mission_criticality >= 0.8: out.append("MISSION_CRITICAL")
        if s["available"] < 40: out.append("TIME_LIMIT")
        if s["plateau"]: out.append("PLATEAU")
        if s["travel"]: out.append("TRAVEL")
        if s["momentum"] < 55: out.append("RECOVERY_TREND")
        return out

    def _candidate_actions(self, s: dict[str, Any]) -> list[str]:
        if s["red_flags"]: return ["escalate"]
        actions=["proceed","modify_session","swap_session","move_session","recovery"]
        if s["peak_fatigue"] >= 75 or s["plateau"]: actions.append("deload")
        return actions

    def _score(self, action: str, s: dict[str, Any], criticality: float, preference: str | None) -> CandidateDecision:
        rc=self._reason_codes(s,criticality)
        base=float(self.rules["actions"][action]["base"])
        safety=recovery=mission=continuity=schedule=evidence=pref=70.0
        feasible=True; changes=[]; trade=[]

        if action=="escalate":
            feasible=s["red_flags"]
            safety=100; mission=20; recovery=100; continuity=20; schedule=90; evidence=99
            changes=[{"type":"stop_training","reason":"red_flag"}]
            trade=["Training objective is deferred to protect athlete safety."]
        else:
            if s["red_flags"]: feasible=False
            if action=="proceed":
                safety=95 if s["max_pain"]<4 and s["readiness"]>=65 else 30
                recovery=90 if s["readiness"]>=65 and s["peak_fatigue"]<70 else 35
                mission=96; continuity=95; schedule=90
                trade=["Highest progression continuity, but it preserves the full fatigue cost."]
            elif action=="modify_session":
                safety=82 if s["max_pain"]<7 else 55; recovery=82; mission=88; continuity=86; schedule=92
                changes=[{"type":"reduce_volume","factor":0.70},{"type":"cap_rpe","value":7.0},{"type":"trim_accessories_to_minutes","minutes":int(s["available"])}]
                trade=["Preserves the main adaptation with reduced training dose."]
            elif action=="swap_session":
                safety=80; recovery=78; mission=72+18*criticality; continuity=70; schedule=84
                changes=[{"type":"swap_to_lower_cost_session","preserve":"weekly_objective"}]
                trade=["Maintains weekly work but interrupts exercise-specific continuity."]
            elif action=="move_session":
                safety=86; recovery=90; mission=82; continuity=82; schedule=58
                changes=[{"type":"move_session","window_hours":[24,48]}]
                trade=["Improves recovery but may create downstream schedule pressure."]
            elif action=="recovery":
                safety=94; recovery=98; mission=35+35*(1-criticality); continuity=35; schedule=88
                changes=[{"type":"replace_with_recovery","duration_minutes":min(30,int(s["available"]))}]
                trade=["Best immediate recovery outcome, but the planned stimulus is lost."]
            elif action=="deload":
                safety=90; recovery=96; mission=68; continuity=68; schedule=76
                changes=[{"type":"apply_micro_deload","days":4,"volume_factor":0.60,"intensity_factor":0.85}]
                trade=["Reduces short-term training stress to restore future training quality."]

        # Signal-sensitive adjustments
        if s["max_pain"]>=7:
            if action in ("proceed",): safety-=50
            if action in ("modify_session","swap_session"): safety-=10
            if action in ("move_session","recovery","deload"): safety+=5
        if s["readiness"]<55 or s["sleep"]<5:
            if action=="proceed": recovery-=45
            if action in ("modify_session","move_session","recovery","deload"): recovery+=8
        if s["peak_fatigue"]>=75:
            if action in ("proceed","swap_session"): recovery-=30
            if action in ("recovery","deload"): recovery+=10
        if s["available"]<40:
            if action=="proceed": schedule-=35
            if action in ("modify_session","recovery"): schedule+=8
        if criticality>=0.8:
            if action in ("recovery",): mission-=25
            if action in ("modify_session","move_session"): mission+=8
        if s["compliance"]<70 and action in ("move_session","swap_session"): schedule-=15
        if s["plateau"]:
            if action=="proceed": continuity-=25
            if action in ("deload","modify_session"): continuity+=8
        if preference and norm(preference)==norm(action): pref=100

        linked=[]
        for code in rc: linked += self.rule_links.get(code,[])
        linked=sorted(set(linked))
        evidence = 55 + 45*(sum(self.evidence[x]["confidence"] for x in linked)/len(linked) if linked else .55)
        dims={"mission_alignment":mission,"safety":safety,"recovery_fit":recovery,"progression_continuity":continuity,
              "schedule_fit":schedule,"evidence_strength":evidence,"athlete_preference":pref}
        score=base*0.15 + sum(clamp(dims[k])*w for k,w in self.rules["weights"].items())*0.85
        confidence=(clamp(evidence)/100)*0.45 + (abs(score-60)/40)*0.25 + (0.30 if feasible else 0)
        effects={"mission_progress":round((mission-50)/50,2),"fatigue_change":round((50-recovery)/50,2),"risk_change":round((50-safety)/50,2),"schedule_disruption":round((50-schedule)/50,2)}
        return CandidateDecision(action,round(clamp(score),1),round(min(0.99,max(0.2,confidence)),2),feasible,rc,trade,effects,changes,linked)

    def reason(self, request: dict[str, Any]) -> dict[str, Any]:
        signals=self._signals(request)
        mission=request.get("mission",{})
        criticality=float(mission.get("today_session_criticality",0.6))
        candidates=[self._score(a,signals,criticality,request.get("athlete_preference")) for a in self._candidate_actions(signals)]
        candidates.sort(key=lambda x:(x.feasible,x.score,x.confidence),reverse=True)
        winner=next((x for x in candidates if x.feasible),candidates[0])
        min_score=float(self.rules["decision_thresholds"]["minimum_option_score"])
        if winner.score<min_score and winner.action!="escalate":
            fallback=next((x for x in candidates if x.action=="recovery"),winner); winner=fallback
        explanations=[]
        for code in winner.reason_codes:
            explanations.append({"reason_code":code,"explanation":self.rules["reason_codes"].get(code,code),"evidence_ids":self.rule_links.get(code,[])})
        evidence_records=[self.evidence[x] for x in winner.evidence_ids if x in self.evidence]
        result={
            "reasoning_engine_version":VERSION,
            "reasoning_rulebook_version":self.rules["reasoning_rulebook_version"],
            "decision":asdict(winner),
            "signals":signals,
            "mission_context":mission,
            "alternatives":[asdict(x) for x in candidates if x.action!=winner.action],
            "conflict_resolution":{"precedence":self.rules["conflict_precedence"],"resolved_to":winner.action,
                "summary":self._summary(winner,signals,criticality)},
            "explanation":{"user":self._user_explanation(winner,signals),"technical":explanations,"evidence":evidence_records},
            "audit":{"input_snapshot":copy.deepcopy(request),"candidate_count":len(candidates),"selected_score":winner.score,"selected_confidence":winner.confidence}
        }
        return result

    def _user_explanation(self, d: CandidateDecision, s: dict[str, Any]) -> str:
        if d.action=="escalate": return "Bell stopped the training recommendation because a red-flag symptom overrides the benefit of completing the session."
        reasons=[]
        if s["readiness"]<55: reasons.append(f"readiness is {s['readiness']:.0f}/100")
        if s["sleep"]<5: reasons.append(f"sleep was {s['sleep']:.1f} hours")
        if s["max_pain"]>=7: reasons.append(f"pain reached {s['max_pain']:.0f}/10")
        if s["peak_fatigue"]>=75: reasons.append("accumulated fatigue is high")
        why=", ".join(reasons) if reasons else "the current athlete state and mission priorities"
        return f"Bell chose to {d.action.replace('_',' ')} because {why}. This option produced the strongest balance of mission progress, safety, recovery, and schedule fit."

    def _summary(self, d: CandidateDecision, s: dict[str, Any], criticality: float) -> str:
        return f"Selected {d.action} at {d.score}/100. Safety precedence was applied first, then mission criticality ({criticality:.2f}), recovery capacity, progression continuity, and schedule fit."


def main() -> None:
    ap=argparse.ArgumentParser(); ap.add_argument("request"); ap.add_argument("--rules",required=True); ap.add_argument("--evidence",required=True); ap.add_argument("--output")
    a=ap.parse_args(); engine=BellCoachingReasoningEngine(a.rules,a.evidence); result=engine.reason(json.loads(Path(a.request).read_text()))
    text=json.dumps(result,indent=2); Path(a.output).write_text(text) if a.output else print(text)

if __name__=="__main__": main()
