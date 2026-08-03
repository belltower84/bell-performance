from __future__ import annotations

import argparse
import copy
import json
from pathlib import Path
from typing import Any

VERSION = "0.1.0"
DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]


def _norm(v: Any) -> str:
    return " ".join(str(v or "").strip().lower().replace("_", " ").split())


def _clamp(v: float, lo: float = 0, hi: float = 100) -> float:
    return max(lo, min(hi, v))


class BellAdaptiveCoachingEngine:
    """Modifies a planned session and rebalances the remaining week from daily athlete state."""

    def __init__(self, adaptation_rulebook_path: str | Path):
        self.rulebook_path = Path(adaptation_rulebook_path)
        self.rules = json.loads(self.rulebook_path.read_text())

    def score_readiness(self, checkin: dict[str, Any]) -> dict[str, Any]:
        sleep_h = float(checkin.get("sleep_hours", 7.5))
        sleep_q = float(checkin.get("sleep_quality", 7))
        soreness = max([float(v) for v in (checkin.get("soreness", {}) or {}).values()] or [0])
        pain = max([float(v) for v in (checkin.get("pain", {}) or {}).values()] or [0])
        stress = float(checkin.get("stress", 5))
        motivation = float(checkin.get("motivation", 7))
        resting_delta = float(checkin.get("resting_hr_delta_bpm", 0))
        hrv_delta = float(checkin.get("hrv_delta_percent", 0))

        sleep = _clamp((sleep_h / 8.0) * 70 + sleep_q * 3)
        muscular = _clamp(100 - soreness * 8 - pain * 4)
        cardiovascular = _clamp(100 - max(0, resting_delta) * 4 + min(0, hrv_delta) * 0.7)
        psychological = _clamp(motivation * 10)
        stress_score = _clamp(100 - stress * 8)
        pain_safety = _clamp(100 - pain * 10)
        dimensions = {
            "sleep": round(sleep, 1), "muscular": round(muscular, 1),
            "cardiovascular": round(cardiovascular, 1), "psychological": round(psychological, 1),
            "stress": round(stress_score, 1), "pain_safety": round(pain_safety, 1),
        }
        weights = self.rules["readiness_weights"]
        total = sum(dimensions[k] * weights[k] for k in weights)
        band = "red"
        for name in ("green", "yellow", "orange", "red"):
            if total >= self.rules["readiness_bands"][name]["minimum"]:
                band = name
                break
        return {"score": round(total, 1), "band": band, "dimensions": dimensions}

    def _safety_check(self, checkin: dict[str, Any]) -> list[str]:
        text = _norm(" ".join(checkin.get("symptoms", []) or []))
        hits = [x for x in self.rules["red_flags"] if _norm(x) in text]
        illness = checkin.get("illness", {}) or {}
        for key, action in self.rules["illness_rules"].items():
            if illness.get(key) and action == "stop":
                hits.append(key.replace("_", " "))
        return sorted(set(hits))

    def decide_action(self, checkin: dict[str, Any], readiness: dict[str, Any]) -> dict[str, Any]:
        triggers: list[str] = []
        red_flags = self._safety_check(checkin)
        if red_flags:
            return {"action": "stop_and_escalate", "triggers": red_flags, "severity": "critical"}
        pain = max([float(v) for v in (checkin.get("pain", {}) or {}).values()] or [0])
        illness = checkin.get("illness", {}) or {}
        if pain >= self.rules["thresholds"]["pain_stop"]:
            return {"action": "recovery", "triggers": [f"pain {pain}/10"], "severity": "high"}
        if any(illness.get(k) for k in ("systemic_body_aches",)):
            return {"action": "recovery", "triggers": ["systemic illness symptoms"], "severity": "high"}

        action = self.rules["readiness_bands"][readiness["band"]]["default_action"]
        if float(checkin.get("sleep_hours", 8)) < self.rules["thresholds"]["sleep_hours_severe"]:
            action = "modify_major"; triggers.append("severely restricted sleep")
        elif float(checkin.get("sleep_hours", 8)) < self.rules["thresholds"]["sleep_hours_low"]:
            triggers.append("low sleep")
            if action == "proceed": action = "modify_light"
        if pain >= self.rules["thresholds"]["pain_modify"]:
            triggers.append(f"regional pain {pain}/10")
            action = "modify_major"
        max_sore = max([float(v) for v in (checkin.get("soreness", {}) or {}).values()] or [0])
        if max_sore >= self.rules["thresholds"]["soreness_high"]:
            triggers.append(f"high soreness {max_sore}/10")
            action = "modify_major"
        if float(checkin.get("stress", 0)) >= self.rules["thresholds"]["stress_high"]:
            triggers.append("high life stress")
            if action == "proceed": action = "modify_light"
        if float(checkin.get("available_minutes", 999)) < self.rules["thresholds"]["minimum_training_minutes"]:
            triggers.append("insufficient training time")
            action = "recovery"
        return {"action": action, "triggers": triggers or ["readiness band"], "severity": readiness["band"]}

    def _regional_constraints(self, checkin: dict[str, Any]) -> dict[str, Any]:
        avoid, reduce, changes = set(), set(), set()
        combined = {}
        for src in (checkin.get("pain", {}) or {}, checkin.get("soreness", {}) or {}):
            for region, value in src.items(): combined[region] = max(float(value), combined.get(region, 0))
        for region, value in combined.items():
            rule = self.rules["regional_rules"].get(_norm(region))
            if not rule or value < 5: continue
            if value >= 7: avoid.update(rule.get("avoid_patterns", []))
            reduce.update(rule.get("reduce_patterns", [])); changes.update(rule.get("preferred_changes", []))
        return {"avoid_patterns": sorted(avoid), "reduce_patterns": sorted(reduce), "preferred_changes": sorted(changes)}

    def _modify_strength_session(self, session: dict[str, Any], action: str, checkin: dict[str, Any]) -> tuple[dict[str, Any], list[dict[str, Any]]]:
        revised = copy.deepcopy(session)
        mods = self.rules["action_modifiers"].get(action, self.rules["action_modifiers"]["proceed"])
        constraints = self._regional_constraints(checkin)
        changes: list[dict[str, Any]] = []
        available = int(checkin.get("available_minutes", revised.get("session", {}).get("requested_minutes", 60)))
        kept=[]
        for block in revised.get("exercise_blocks", []):
            before = copy.deepcopy(block.get("prescription", {}))
            pattern = block.get("movement_pattern") or block.get("pattern") or ""
            role = block.get("role", "Accessory")
            if pattern in constraints["avoid_patterns"] and role not in ("Primary Lift",):
                changes.append({"type":"remove_exercise", "exercise":block.get("name"), "reason":f"Avoid {pattern} due to regional symptoms."})
                continue
            rx=block.get("prescription", {})
            old_sets=int(rx.get("sets", 1)); new_sets=max(1, round(old_sets * mods["volume"]))
            rx["sets"]=new_sets
            if isinstance(rx.get("target_rpe"), (int,float)):
                rx["target_rpe"]=round(max(5.5, rx["target_rpe"] * mods["intensity"]),1)
                rx["target_rir"]=round(max(1, 10-rx["target_rpe"]),1)
            rx["rest_seconds"]=round(float(rx.get("rest_seconds",90))*mods["rest"])
            if pattern in constraints["reduce_patterns"]:
                rx["sets"]=max(1, rx["sets"]-1)
                rx["target_rpe"]=min(float(rx.get("target_rpe",7)), 7.0)
                rx["intensity_guidance"]="Use a pain-free range and joint-tolerant variation; stop if symptoms increase."
            if rx != before:
                changes.append({"type":"modify_prescription", "exercise":block.get("name"), "before":before, "after":copy.deepcopy(rx)})
            block["estimated_minutes"] = max(4, round(float(block.get("estimated_minutes",10))*rx["sets"]/max(1,old_sets)))
            kept.append(block)
        revised["exercise_blocks"]=kept
        # Trim lowest-priority blocks until time fits.
        def total(): return revised.get("warmup",{}).get("minutes",8)+revised.get("cooldown",{}).get("minutes",5)+sum(b.get("estimated_minutes",0) for b in revised.get("exercise_blocks",[]))
        while len(revised.get("exercise_blocks",[]))>1 and total()>available:
            dropped=revised["exercise_blocks"].pop()
            changes.append({"type":"remove_for_time", "exercise":dropped.get("name"), "reason":f"Fit {available}-minute limit."})
        revised.setdefault("session",{})["estimated_minutes"]=total()
        revised["session"]["readiness_adjustment"]=action
        revised["adaptive_constraints"]=constraints
        return revised, changes

    def _modify_engine_session(self, session: dict[str, Any], action: str, checkin: dict[str, Any]) -> tuple[dict[str, Any], list[dict[str, Any]]]:
        revised=copy.deepcopy(session); changes=[]
        rx=revised.get("engine_prescription",{})
        before=copy.deepcopy(rx); mods=self.rules["action_modifiers"].get(action, {"volume":1,"intensity":1})
        if "duration_minutes" in rx: rx["duration_minutes"]=max(15, round(rx["duration_minutes"]*mods["volume"]))
        if action=="modify_light": rx["intensity"]="Easy to moderate; cap at RPE 7"
        elif action=="modify_major": rx["intensity"]="Zone 1-2 / recovery effort"; rx.pop("work",None); rx.pop("recovery",None)
        constraints=self._regional_constraints(checkin)
        if any(p in constraints["avoid_patterns"]+constraints["reduce_patterns"] for p in ("Run","Sprint","Jump")):
            rx["mode"]="bike, row, or other pain-free low-impact modality"
        available=int(checkin.get("available_minutes", session.get("estimated_total_minutes",45)))
        if "duration_minutes" in rx: rx["duration_minutes"]=min(rx["duration_minutes"], available)
        revised["estimated_total_minutes"]=rx.get("duration_minutes", min(available, session.get("estimated_total_minutes",45)))
        if rx!=before: changes.append({"type":"modify_engine_prescription","before":before,"after":copy.deepcopy(rx)})
        return revised, changes

    def _replan_remaining_week(self, week: dict[str, Any], target_day: str, action: str) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
        schedule=copy.deepcopy(week.get("schedule",[])); changes=[]
        if action not in ("recovery", "stop_and_escalate"): return schedule, changes
        idx=next((i for i,x in enumerate(schedule) if x.get("day")==target_day),None)
        if idx is None or not schedule[idx].get("session_name"): return schedule, changes
        displaced=copy.deepcopy(schedule[idx]); schedule[idx]={"day":target_day,"session_name":None,"status":"recovery","recovery_guidance":"Recovery day inserted by Adaptive Coaching Engine."}
        # Move to first later recovery day within two days, without stacking.
        moved=False
        for j in range(idx+1,min(len(schedule),idx+3)):
            if not schedule[j].get("session_name"):
                newday=schedule[j]["day"]; displaced["day"]=newday; schedule[j]=displaced
                changes.append({"type":"move_session","session":displaced.get("session_name"),"from":target_day,"to":newday})
                moved=True; break
        if not moved: changes.append({"type":"drop_session","session":displaced.get("session_name"),"reason":"No safe recovery slot within shift window."})
        return schedule, changes

    def adapt(self, request: dict[str, Any]) -> dict[str, Any]:
        week=copy.deepcopy(request["planned_week"]); checkin=request.get("checkin",{}); target_day=request.get("target_day","Monday")
        readiness=self.score_readiness(checkin); decision=self.decide_action(checkin,readiness)
        original_item=next((x for x in week.get("schedule",[]) if x.get("day")==target_day),None)
        if original_item is None: raise ValueError(f"Target day {target_day!r} not found in planned week")
        original_session=copy.deepcopy(original_item.get("session"))
        revised_session=None; session_changes=[]
        action=decision["action"]
        if original_session and action not in ("recovery","stop_and_escalate"):
            if original_session.get("session_type")=="engine": revised_session,session_changes=self._modify_engine_session(original_session,action,checkin)
            else: revised_session,session_changes=self._modify_strength_session(original_session,action,checkin)
        elif original_session and action=="proceed": revised_session=copy.deepcopy(original_session)
        revised_schedule,week_changes=self._replan_remaining_week(week,target_day,action)
        if revised_session:
            for item in revised_schedule:
                if item.get("day")==target_day: item["session"]=revised_session; item["estimated_minutes"]=revised_session.get("estimated_total_minutes",revised_session.get("session",{}).get("estimated_minutes")); break
        explanation = self._explain(target_day, action, readiness, decision, session_changes, week_changes)
        return {
            "adaptive_engine_version": VERSION,
            "adaptation_rulebook_version": self.rules["adaptation_rulebook_version"],
            "target_day": target_day,
            "readiness": readiness,
            "decision": decision,
            "original_session": original_session,
            "revised_session": revised_session,
            "revised_schedule": revised_schedule,
            "session_changes": session_changes,
            "weekly_changes": week_changes,
            "coach_explanation": explanation,
            "follow_up": self._follow_up(action, checkin),
            "audit": {"inputs": copy.deepcopy(checkin), "rules_applied": [decision["action"], *decision["triggers"]], "change_count": len(session_changes)+len(week_changes)}
        }

    def _explain(self, day, action, readiness, decision, sc, wc):
        if action=="stop_and_escalate": return f"Training stopped on {day} because a red-flag symptom was reported. Seek appropriate medical evaluation before resuming training."
        if action=="recovery": return f"Bell changed {day} to recovery because readiness was {readiness['score']}/100 and the risk signals outweighed the benefit of forcing the planned session."
        if action=="proceed": return f"Readiness is {readiness['score']}/100. Proceed as planned; no material adjustment is required."
        return f"Bell preserved the session's primary objective but applied a {action.replace('_',' ')} adjustment because of {', '.join(decision['triggers'])}. Volume, intensity, exercise exposure, and time were modified before changing the weekly plan."

    def _follow_up(self, action, checkin):
        if action=="stop_and_escalate": return {"when":"before next training","check":"Medical clearance or resolution of red-flag symptoms."}
        if action in ("modify_major","recovery"): return {"when":"within 24 hours","check":"Repeat readiness, pain, soreness, sleep, and illness check-in."}
        return {"when":"after session","check":"Record completion, actual RPE, pain response, and performance versus target."}


def main() -> None:
    parser=argparse.ArgumentParser(description="Bell Adaptive Coaching Engine")
    parser.add_argument("request"); parser.add_argument("--rules", required=True); parser.add_argument("--output")
    args=parser.parse_args(); engine=BellAdaptiveCoachingEngine(args.rules)
    result=engine.adapt(json.loads(Path(args.request).read_text()))
    text=json.dumps(result,indent=2)
    if args.output: Path(args.output).write_text(text+"\n")
    else: print(text)

if __name__=="__main__": main()
