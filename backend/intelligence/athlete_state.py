from __future__ import annotations

import argparse
import hashlib
import json
import math
import sqlite3
import uuid
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterable

VERSION = "0.1.0"


def _clamp(v: float, lo: float = 0.0, hi: float = 100.0) -> float:
    return max(lo, min(hi, v))


def _parse_ts(value: str | None) -> datetime:
    if not value:
        return datetime.now(timezone.utc)
    dt = datetime.fromisoformat(value.replace("Z", "+00:00"))
    return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)


def _iso(dt: datetime) -> str:
    return dt.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")


def _mean(values: Iterable[float], default: float = 0.0) -> float:
    values = list(values)
    return sum(values) / len(values) if values else default


@dataclass(frozen=True)
class AthleteEvent:
    athlete_id: str
    event_type: str
    occurred_at: str
    payload: dict[str, Any]
    event_id: str | None = None
    source: str = "bell"

    def normalized(self) -> dict[str, Any]:
        occurred = _iso(_parse_ts(self.occurred_at))
        canonical = json.dumps(self.payload, sort_keys=True, separators=(",", ":"))
        event_id = self.event_id or str(uuid.uuid5(uuid.NAMESPACE_URL, f"{self.athlete_id}|{self.event_type}|{occurred}|{canonical}"))
        return {"event_id": event_id, "athlete_id": self.athlete_id, "event_type": self.event_type,
                "occurred_at": occurred, "source": self.source, "payload": self.payload}


class BellAthleteStateEngine:
    """Event-sourced athlete memory and deterministic state projection engine."""

    def __init__(self, database_path: str | Path | None, rulebook_path: str | Path):
        self.database_path = Path(database_path) if database_path is not None else None
        self.rules = json.loads(Path(rulebook_path).read_text())
        if self.database_path is not None:
            self._init_schema()

    def connect(self) -> sqlite3.Connection:
        if self.database_path is None:
            raise RuntimeError("This athlete-state engine instance has no persistence database.")
        con = sqlite3.connect(self.database_path)
        con.row_factory = sqlite3.Row
        con.execute("PRAGMA foreign_keys=ON")
        return con

    def _init_schema(self) -> None:
        with self.connect() as con:
            con.executescript("""
            CREATE TABLE IF NOT EXISTS athlete_events (
              event_id TEXT PRIMARY KEY, athlete_id TEXT NOT NULL, event_type TEXT NOT NULL,
              occurred_at TEXT NOT NULL, recorded_at TEXT NOT NULL, source TEXT NOT NULL,
              payload_json TEXT NOT NULL, payload_sha256 TEXT NOT NULL
            );
            CREATE INDEX IF NOT EXISTS idx_athlete_events_athlete_time
              ON athlete_events(athlete_id, occurred_at, event_id);
            CREATE TABLE IF NOT EXISTS athlete_state_snapshots (
              athlete_id TEXT NOT NULL, as_of TEXT NOT NULL, projection_version TEXT NOT NULL,
              last_event_id TEXT, event_count INTEGER NOT NULL, state_json TEXT NOT NULL,
              created_at TEXT NOT NULL, PRIMARY KEY(athlete_id, as_of, projection_version)
            );
            CREATE TABLE IF NOT EXISTS athlete_profiles (
              athlete_id TEXT PRIMARY KEY, profile_json TEXT NOT NULL, updated_at TEXT NOT NULL
            );
            """)

    def append_event(self, event: AthleteEvent | dict[str, Any]) -> dict[str, Any]:
        e = event.normalized() if isinstance(event, AthleteEvent) else AthleteEvent(**event).normalized()
        payload_text = json.dumps(e["payload"], sort_keys=True, separators=(",", ":"))
        digest = hashlib.sha256(payload_text.encode()).hexdigest()
        with self.connect() as con:
            con.execute("""INSERT OR IGNORE INTO athlete_events
              (event_id, athlete_id, event_type, occurred_at, recorded_at, source, payload_json, payload_sha256)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
              (e["event_id"], e["athlete_id"], e["event_type"], e["occurred_at"], _iso(datetime.now(timezone.utc)), e["source"], payload_text, digest))
            inserted = con.total_changes > 0
        return {**e, "inserted": inserted, "payload_sha256": digest}

    def append_events(self, events: list[dict[str, Any]]) -> dict[str, Any]:
        results = [self.append_event(e) for e in events]
        return {"received": len(results), "inserted": sum(r["inserted"] for r in results), "events": results}

    def list_events(self, athlete_id: str, as_of: str | None = None) -> list[dict[str, Any]]:
        sql = "SELECT * FROM athlete_events WHERE athlete_id=?"
        args: list[Any] = [athlete_id]
        if as_of:
            sql += " AND occurred_at<=?"; args.append(_iso(_parse_ts(as_of)))
        sql += " ORDER BY occurred_at, event_id"
        with self.connect() as con:
            rows = con.execute(sql, args).fetchall()
        return [{"event_id": r["event_id"], "athlete_id": r["athlete_id"], "event_type": r["event_type"],
                 "occurred_at": r["occurred_at"], "source": r["source"], "payload": json.loads(r["payload_json"])} for r in rows]

    def project(self, athlete_id: str, as_of: str | None = None, persist: bool = True) -> dict[str, Any]:
        events = self.list_events(athlete_id, as_of)
        return self.project_events(athlete_id, events, as_of=as_of, persist=persist)

    def project_events(self, athlete_id: str, events: list[dict[str, Any]], as_of: str | None = None,
                       persist: bool = False) -> dict[str, Any]:
        """Project state directly from externally stored immutable events.

        Bell Core keeps its canonical event stream in SQLAlchemy/PostgreSQL. This
        adapter lets the full Athlete State Engine consume that stream without
        maintaining a second source of truth.
        """
        as_of_dt = _parse_ts(as_of)
        normalized: list[dict[str, Any]] = []
        for raw in events:
            occurred = _iso(_parse_ts(raw.get("occurred_at")))
            if _parse_ts(occurred) > as_of_dt:
                continue
            normalized.append({
                "event_id": raw.get("event_id") or raw.get("id") or str(uuid.uuid4()),
                "athlete_id": athlete_id,
                "event_type": raw.get("event_type") or raw.get("type"),
                "occurred_at": occurred,
                "source": raw.get("source", "bell-core"),
                "payload": raw.get("payload", raw.get("data", {})),
            })
        normalized.sort(key=lambda e: (e["occurred_at"], e["event_id"]))
        state = self._initial_state(athlete_id, as_of_dt)
        last_dt = _parse_ts(normalized[0]["occurred_at"]) if normalized else as_of_dt
        for item in normalized:
            dt = _parse_ts(item["occurred_at"])
            self._decay(state, max(0.0, (dt-last_dt).total_seconds()/86400.0))
            self._apply_event(state, item)
            last_dt = dt
        self._decay(state, max(0.0, (as_of_dt-last_dt).total_seconds()/86400.0))
        self._finalize(state, normalized, as_of_dt)
        if persist and self.database_path is not None:
            with self.connect() as con:
                con.execute("""INSERT OR REPLACE INTO athlete_state_snapshots
                  (athlete_id, as_of, projection_version, last_event_id, event_count, state_json, created_at)
                  VALUES (?, ?, ?, ?, ?, ?, ?)""",
                  (athlete_id, state["as_of"], VERSION, normalized[-1]["event_id"] if normalized else None,
                   len(normalized), json.dumps(state, sort_keys=True), _iso(datetime.now(timezone.utc))))
        return state

    def _initial_state(self, athlete_id: str, as_of: datetime) -> dict[str, Any]:
        return {
          "athlete_id": athlete_id, "as_of": _iso(as_of), "engine_version": VERSION,
          "rulebook_version": self.rules["athlete_state_rulebook_version"], "event_count": 0,
          "fatigue": {k: 0.0 for k in self.rules["fatigue"]["dimensions"]},
          "adaptation": {k: 50.0 for k in self.rules["adaptation"]["dimensions"]},
          "readiness": {"current": 70.0, "trend": "stable", "history": []},
          "performance": {"exercise_bests": {}, "recent_sessions": [], "trend_score": 50.0, "underperformance_streak": 0},
          "recovery": {"sleep_7d": None, "sleep_quality_7d": None, "stress_7d": None, "pain_regions": {}, "soreness_regions": {}},
          "compliance": {"planned": 0, "completed": 0, "missed": 0, "rate": None, "current_streak": 0},
          "body_composition": {"weight_history": [], "latest_weight": None, "trend": "unknown"},
          "health": {"active_injuries": [], "active_illness": False, "risk_flags": []},
          "momentum": {"score": 50.0, "band": "neutral", "confidence": 0.0, "components": {}},
          "recommendations": [], "data_quality": {}
        }

    def _decay(self, state: dict[str, Any], days: float) -> None:
        if days <= 0: return
        for k, rate in self.rules["fatigue"]["daily_decay"].items():
            state["fatigue"][k] *= math.exp(-rate * days)
        for k, rate in self.rules["adaptation"]["daily_decay"].items():
            state["adaptation"][k] = 50 + (state["adaptation"][k]-50) * math.exp(-rate * days)

    def _apply_event(self, state: dict[str, Any], event: dict[str, Any]) -> None:
        t, p = event["event_type"], event["payload"]
        state["event_count"] += 1
        if t == "workout_planned":
            state["compliance"]["planned"] += 1
        elif t == "workout_completed":
            self._apply_workout(state, event)
        elif t == "workout_missed":
            state["compliance"]["missed"] += 1; state["compliance"]["current_streak"] = 0
        elif t == "daily_checkin":
            self._apply_checkin(state, event)
        elif t == "body_measurement":
            if p.get("weight") is not None:
                state["body_composition"]["weight_history"].append({"date": event["occurred_at"], "weight": float(p["weight"]), "unit": p.get("unit", "lb")})
        elif t == "personal_record":
            key = p.get("exercise_id") or p.get("exercise_name", "unknown")
            state["performance"]["exercise_bests"][key] = {**p, "date": event["occurred_at"]}
        elif t == "injury_reported":
            state["health"]["active_injuries"].append({**p, "reported_at": event["occurred_at"]})
        elif t == "injury_resolved":
            region = p.get("region")
            state["health"]["active_injuries"] = [x for x in state["health"]["active_injuries"] if x.get("region") != region]
        elif t == "illness_reported": state["health"]["active_illness"] = True
        elif t == "illness_resolved": state["health"]["active_illness"] = False

    def _apply_workout(self, state: dict[str, Any], event: dict[str, Any]) -> None:
        p = event["payload"]
        duration = float(p.get("duration_minutes", 45)); rpe = float(p.get("session_rpe", 7))
        load = _clamp(duration * rpe / 6.0)
        for k, w in self.rules["fatigue"]["session_load_weights"].items(): state["fatigue"][k] = _clamp(state["fatigue"][k] + load*w)
        category = p.get("adaptation_type", p.get("session_type", "strength"))
        if rpe >= 8.5:
            for k,v in self.rules["fatigue"]["high_intensity_bonus"].items(): state["fatigue"][k] = _clamp(state["fatigue"][k]+v)
        if category in ("easy_aerobic","threshold","interval","sprint"):
            for k,v in self.rules["fatigue"]["endurance_bonus"].items(): state["fatigue"][k] = _clamp(state["fatigue"][k]+v)
        quality = float(p.get("performance_ratio", 1.0))
        gains = self.rules["adaptation"]["session_gain"].get(category, self.rules["adaptation"]["session_gain"].get("strength", {}))
        gain_factor = _clamp(quality*100, 50, 120)/100 * max(0.4, 1-_mean(state["fatigue"].values())/160)
        for k,v in gains.items(): state["adaptation"][k] = _clamp(state["adaptation"][k] + v*gain_factor)
        perf = {"date": event["occurred_at"], "session_type": category, "performance_ratio": quality, "rpe": rpe, "duration_minutes": duration}
        state["performance"]["recent_sessions"].append(perf)
        state["compliance"]["completed"] += 1; state["compliance"]["current_streak"] += 1
        if quality < 0.95: state["performance"]["underperformance_streak"] += 1
        else: state["performance"]["underperformance_streak"] = 0

    def _apply_checkin(self, state: dict[str, Any], event: dict[str, Any]) -> None:
        p = event["payload"]
        if p.get("readiness_score") is not None:
            state["readiness"]["current"] = float(p["readiness_score"])
            state["readiness"]["history"].append({"date": event["occurred_at"], "score": float(p["readiness_score"])})
        for metric in ("sleep_hours", "sleep_quality", "stress"):
            if p.get(metric) is not None: state["recovery"].setdefault(metric+"_history", []).append(float(p[metric]))
        for region, value in (p.get("pain") or {}).items(): state["recovery"]["pain_regions"][region] = float(value)
        for region, value in (p.get("soreness") or {}).items(): state["recovery"]["soreness_regions"][region] = float(value)
        pain = max(state["recovery"]["pain_regions"].values(), default=0)
        sore = max(state["recovery"]["soreness_regions"].values(), default=0)
        if pain: state["fatigue"]["joint"] = _clamp(state["fatigue"]["joint"] + pain*self.rules["fatigue"]["pain_multiplier"])
        if sore: state["fatigue"]["muscular"] = _clamp(state["fatigue"]["muscular"] + sore*self.rules["fatigue"]["soreness_multiplier"])

    def _finalize(self, state: dict[str, Any], events: list[dict[str, Any]], as_of: datetime) -> None:
        c=state["compliance"]
        denominator=max(c["planned"], c["completed"]+c["missed"])
        c["rate"] = round(100*c["completed"]/denominator,1) if denominator else None
        for metric, out in (("sleep_hours_history","sleep_7d"),("sleep_quality_history","sleep_quality_7d"),("stress_history","stress_7d")):
            vals=state["recovery"].get(metric, [])[-7:]; state["recovery"][out]=round(_mean(vals),1) if vals else None
        hist=state["readiness"]["history"][-7:]
        if len(hist)>=2:
            delta=hist[-1]["score"]-hist[0]["score"]; state["readiness"]["trend"]="improving" if delta>5 else "declining" if delta<-5 else "stable"
        sessions=state["performance"]["recent_sessions"][-8:]
        ratio=_mean([s["performance_ratio"] for s in sessions],1.0)
        state["performance"]["trend_score"]=round(_clamp(50+(ratio-1)*200),1)
        wh=state["body_composition"]["weight_history"]
        if wh:
            state["body_composition"]["latest_weight"]=wh[-1]
            if len(wh)>=2:
                d=wh[-1]["weight"]-wh[0]["weight"]; state["body_composition"]["trend"]="up" if d>0.5 else "down" if d<-0.5 else "stable"
        fatigue_avg=_mean(state["fatigue"].values()); recovery_score=_clamp(100-fatigue_avg)
        readiness=state["readiness"]["current"]
        components={"compliance": c["rate"] if c["rate"] is not None else 50,
                    "performance": state["performance"]["trend_score"], "recovery": recovery_score,
                    "readiness": readiness, "body_composition": 50}
        weights=self.rules["momentum"]["weights"]
        momentum=sum(components[k]*weights[k] for k in weights)
        state["momentum"]={"score":round(momentum,1), "band":"strong" if momentum>=75 else "positive" if momentum>=60 else "neutral" if momentum>=45 else "declining",
                           "confidence":round(min(1.0,len(events)/self.rules["momentum"]["minimum_events_for_confidence"]),2), "components":{k:round(v,1) for k,v in components.items()}}
        flags=[]; risk=self.rules["risk"]
        for k,v in state["fatigue"].items():
            if v>=risk["high_fatigue"]: flags.append({"type":"high_fatigue","dimension":k,"value":round(v,1)})
        if readiness<risk["low_readiness"]: flags.append({"type":"low_readiness","value":readiness})
        for region,v in state["recovery"]["pain_regions"].items():
            if v>=risk["pain_warning"]: flags.append({"type":"pain","region":region,"value":v,"severity":"high" if v>=risk["pain_high"] else "warning"})
        if state["performance"]["underperformance_streak"]>=risk["underperformance_streak"]: flags.append({"type":"repeated_underperformance","count":state["performance"]["underperformance_streak"]})
        if state["health"]["active_illness"]: flags.append({"type":"active_illness"})
        state["health"]["risk_flags"]=flags
        rec=[]
        if any(f["type"]=="high_fatigue" for f in flags): rec.append("Reduce loading or schedule recovery before the next high-cost session.")
        if any(f["type"]=="pain" for f in flags): rec.append("Use pain-free variations and reassess symptoms before loading the affected region.")
        if any(f["type"]=="repeated_underperformance" for f in flags): rec.append("Review sleep, nutrition, fatigue, and progression; consider a deload or load reset.")
        if c["rate"] is not None and c["rate"]<70: rec.append("Simplify the schedule and protect the highest-priority mission sessions.")
        state["recommendations"]=rec or ["Continue the current plan and record the next session outcome."]
        last_age=(as_of-_parse_ts(events[-1]["occurred_at"])).total_seconds()/86400 if events else None
        q=self.rules["state_quality"]
        freshness="empty" if last_age is None else "fresh" if last_age<=q["fresh_days"] else "aging" if last_age<=q["stale_days"] else "stale"
        state["data_quality"]={"event_count":len(events),"freshness":freshness,"days_since_last_event":round(last_age,1) if last_age is not None else None,
                               "confidence":round(min(1.0,len(events)/q["minimum_confidence_events"]),2)}
        state["event_count"]=len(events)
        state["fatigue"]={k:round(v,1) for k,v in state["fatigue"].items()}
        state["adaptation"]={k:round(v,1) for k,v in state["adaptation"].items()}
        state["performance"]["recent_sessions"]=sessions


def main() -> None:
    p=argparse.ArgumentParser(description="Bell Athlete State Engine")
    p.add_argument("--database", required=True); p.add_argument("--rules", required=True)
    sub=p.add_subparsers(dest="command",required=True)
    a=sub.add_parser("append"); a.add_argument("events")
    r=sub.add_parser("project"); r.add_argument("athlete_id"); r.add_argument("--as-of"); r.add_argument("--output")
    args=p.parse_args(); engine=BellAthleteStateEngine(args.database,args.rules)
    if args.command=="append": result=engine.append_events(json.loads(Path(args.events).read_text()))
    else:
        result=engine.project(args.athlete_id,args.as_of)
        if args.output: Path(args.output).write_text(json.dumps(result,indent=2)+"\n")
    print(json.dumps(result,indent=2))

if __name__ == "__main__": main()
