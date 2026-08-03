from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Header, Query
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.security import current_user
from app.database import get_db
from app.models import (
    Athlete, Mission, CheckIn, Decision, SessionCompletion, IdempotencyRecord, User, CoachingMemory,
)
from app.repositories.access import athlete_for_user
from app.schemas import AthleteCreate, AthleteProfileUpdate, MissionCreate, CheckInCreate, CompletionCreate, CoachingMemoryCreate
from app.services.core import (
    dumps, loads, uid, event, project_state, generate_plan, latest_plan, today_payload,
    compile_mission_request, learn_from_completion, intelligence_summary, session_for_completion, coaching_state,
    coach_intelligence_payload, list_coaching_memories, refresh_coaching_memories,
    create_explicit_coaching_memory, deactivate_coaching_memory,
)
from intelligence.adaptive_coaching import BellAdaptiveCoachingEngine
from intelligence.mission_compiler import BellMissionCompiler
from intelligence.athlete_profile import normalize_athlete_profile
from pathlib import Path

router = APIRouter()
ROOT = Path(__file__).resolve().parents[3]


@router.post("/athletes", status_code=201, tags=["Athletes"])
def create_athlete(body: AthleteCreate, db: Session = Depends(get_db), user: User = Depends(current_user)):
    coach = body.coach_user_id if user.role in ("coach", "admin") else None
    normalized_profile = normalize_athlete_profile(body.profile, name=body.name)
    row = Athlete(
        id=uid("ath"), owner_user_id=user.id, coach_user_id=coach,
        name=body.name, profile_json=dumps(normalized_profile),
    )
    db.add(row)
    event(db, row.id, "athlete_created", {"name": body.name, "profile": normalized_profile})
    db.commit()
    return {
        "id": row.id, "name": row.name, "profile": normalized_profile,
        "owner_user_id": row.owner_user_id, "coach_user_id": row.coach_user_id,
    }


@router.get("/athletes/{athlete_id}", tags=["Athletes"])
def get_athlete(athlete_id: str, db: Session = Depends(get_db), user: User = Depends(current_user)):
    athlete = athlete_for_user(db, athlete_id, user)
    profile = normalize_athlete_profile(loads(athlete.profile_json), name=athlete.name)
    return {
        "id": athlete.id, "name": athlete.name, "profile": profile,
        "owner_user_id": athlete.owner_user_id, "coach_user_id": athlete.coach_user_id,
    }


@router.patch("/athletes/{athlete_id}", tags=["Athletes"])
def update_athlete_profile(
    athlete_id: str,
    body: AthleteProfileUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
):
    athlete = athlete_for_user(db, athlete_id, user)
    current = loads(athlete.profile_json)
    merged = {**current, **body.profile}
    for section in ("demographics", "identity", "experience", "availability", "baselines", "recovery", "coaching"):
        if isinstance(current.get(section), dict) and isinstance(body.profile.get(section), dict):
            merged[section] = {**current[section], **body.profile[section]}
    if isinstance(current.get("baselines", {}).get("maxes"), dict) and isinstance(body.profile.get("baselines", {}).get("maxes"), dict):
        merged.setdefault("baselines", {})["maxes"] = {
            **current["baselines"]["maxes"], **body.profile["baselines"]["maxes"]
        }
    name = body.name.strip() if body.name is not None else athlete.name
    normalized = normalize_athlete_profile(merged, name=name)
    athlete.name = name
    athlete.profile_json = dumps(normalized)
    event(db, athlete.id, "athlete_profile_updated", {
        "name": name, "profile_completeness": normalized["profile_completeness"],
        "schema_version": normalized["schema_version"],
    })
    db.commit()
    return {"id": athlete.id, "name": athlete.name, "profile": normalized}


@router.post("/athletes/{athlete_id}/missions", status_code=201, tags=["Missions"])
def create_mission(athlete_id: str, body: MissionCreate, db: Session = Depends(get_db), user: User = Depends(current_user)):
    athlete_for_user(db, athlete_id, user)
    request, bcl_text = compile_mission_request(body.model_dump(exclude_none=True))
    compiled = BellMissionCompiler().compile(request)
    row = Mission(
        id=uid("mis"), athlete_id=athlete_id,
        request_json=dumps(request), compiled_json=dumps(compiled),
    )
    db.add(row)
    event(db, athlete_id, "mission_created", {
        "mission_id": row.id, "goal": body.goal,
        "required_adaptations": compiled.get("required_adaptations", []),
    })
    db.commit()
    return {"id": row.id, "compiled": compiled, "coaching_language": bcl_text}


@router.post("/athletes/{athlete_id}/plans", status_code=201, tags=["Plans"])
def create_plan(athlete_id: str, db: Session = Depends(get_db), user: User = Depends(current_user)):
    athlete = athlete_for_user(db, athlete_id, user)
    mission = db.scalar(
        select(Mission).where(Mission.athlete_id == athlete_id).order_by(Mission.created_at.desc())
    )
    if not mission:
        raise HTTPException(400, "Create a mission first")
    old = latest_plan(db, athlete_id)
    if old:
        old.status = "superseded"
        db.flush()
    row = generate_plan(db, athlete, mission)
    data = loads(row.plan_json)
    return {
        "id": row.id,
        "weeks": len(data["weeks"]),
        "journey": data.get("journey"),
        "discipline": data.get("discipline"),
        "periodization": data["periodization"],
        "goal_probability": data["goal_probability"],
        "selected_strategy": (data.get("simulation") or {}).get("selected"),
        "competition": data.get("competition"),
        "nutrition": data.get("nutrition"),
        "engine_manifest": data.get("engine_manifest"),
    }


@router.get("/athletes/{athlete_id}/plan", tags=["Plans"])
def get_plan(athlete_id: str, db: Session = Depends(get_db), user: User = Depends(current_user)):
    athlete_for_user(db, athlete_id, user)
    plan = latest_plan(db, athlete_id)
    if not plan:
        raise HTTPException(404, "Plan not found")
    return {"id": plan.id, **loads(plan.plan_json)}


@router.get("/athletes/{athlete_id}/coaching-state", tags=["Plans"])
def get_coaching_state(
    athlete_id: str,
    week: int | None = Query(default=None, ge=1, le=520),
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
):
    athlete_for_user(db, athlete_id, user)
    state = coaching_state(db, athlete_id, week)
    if state is None:
        raise HTTPException(404, "Plan not found")
    return state


@router.get("/athletes/{athlete_id}/today", tags=["Sessions"])
def get_today(
    athlete_id: str,
    date_key: str | None = Query(default=None, alias="date"),
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
):
    athlete_for_user(db, athlete_id, user)
    data = today_payload(db, athlete_id, date_key)
    if data is None:
        raise HTTPException(404, "Plan not found")
    return data


@router.post("/athletes/{athlete_id}/check-ins", status_code=201, tags=["Readiness"])
def checkin(athlete_id: str, body: CheckInCreate, db: Session = Depends(get_db), user: User = Depends(current_user)):
    athlete_for_user(db, athlete_id, user)
    payload = body.model_dump()
    adaptive = BellAdaptiveCoachingEngine(ROOT / "rules" / "adaptation_rules_v1.yaml")
    readiness = adaptive.score_readiness(payload)
    payload["readiness_score"] = readiness["score"]
    row = CheckIn(
        id=uid("chk"), athlete_id=athlete_id, payload_json=dumps(payload),
        readiness_score=readiness["score"], readiness_band=readiness["band"],
    )
    db.add(row)
    event(db, athlete_id, "daily_checkin", payload)
    db.commit()
    today = today_payload(db, athlete_id)
    adaptation = (today or {}).get("adaptation")
    return {
        "id": row.id,
        "readiness": readiness,
        "decision": (adaptation or {}).get("action") or adaptive.decide_action(payload, readiness),
        "adaptive_action": (adaptation or {}).get("adaptive_action"),
        "explanation": (adaptation or {}).get("explanation"),
        "decision_id": (adaptation or {}).get("decision_id"),
        "bcl_rules_fired": (adaptation or {}).get("bcl_rules_fired", []),
    }


@router.post("/athletes/{athlete_id}/sessions/{session_id}/complete", status_code=201, tags=["Sessions"])
def complete(
    athlete_id: str,
    session_id: str,
    body: CompletionCreate,
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
    idempotency_key: str | None = Header(default=None, alias="Idempotency-Key"),
):
    athlete = athlete_for_user(db, athlete_id, user)
    route = f"/athletes/{athlete_id}/sessions/{session_id}/complete"
    if idempotency_key:
        prior = db.scalar(
            select(IdempotencyRecord).where(
                IdempotencyRecord.user_id == user.id,
                IdempotencyRecord.key == idempotency_key,
                IdempotencyRecord.route == route,
            )
        )
        if prior:
            return loads(prior.response_json)

    existing = db.scalar(
        select(SessionCompletion).where(
            SessionCompletion.athlete_id == athlete_id,
            SessionCompletion.session_id == session_id,
        )
    )
    if existing:
        raise HTTPException(409, "Session already completed")

    planned_session = session_for_completion(db, athlete_id, session_id)
    session_type = (planned_session or {}).get("session_type", "strength")
    adaptation_type = "easy_aerobic" if session_type == "engine" else "strength"
    payload = {
        **body.model_dump(), "session_id": session_id,
        "session_type": session_type, "adaptation_type": adaptation_type,
    }
    row = SessionCompletion(
        id=uid("cmp"), athlete_id=athlete_id, session_id=session_id,
        payload_json=dumps(payload), idempotency_key=idempotency_key,
    )
    db.add(row)
    event(db, athlete_id, "workout_completed", payload)
    db.flush()
    learning = learn_from_completion(db, athlete, planned_session, payload)
    db.flush()
    response = {
        "id": row.id,
        "state": project_state(db, athlete_id),
        "learning": learning,
    }
    if idempotency_key:
        db.add(IdempotencyRecord(
            id=uid("idem"), user_id=user.id, key=idempotency_key,
            route=route, status_code=201, response_json=dumps(response),
        ))
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(409, "Duplicate completion request")
    return response


@router.get("/athletes/{athlete_id}/state", tags=["Athletes"])
def state(athlete_id: str, db: Session = Depends(get_db), user: User = Depends(current_user)):
    athlete_for_user(db, athlete_id, user)
    return project_state(db, athlete_id)


@router.get("/athletes/{athlete_id}/intelligence", tags=["Intelligence"])
def intelligence(athlete_id: str, db: Session = Depends(get_db), user: User = Depends(current_user)):
    athlete_for_user(db, athlete_id, user)
    return intelligence_summary(db, athlete_id)


@router.get("/athletes/{athlete_id}/adaptive-progression", tags=["Intelligence"])
def adaptive_progression(athlete_id: str, db: Session = Depends(get_db), user: User = Depends(current_user)):
    athlete = athlete_for_user(db, athlete_id, user)
    profile = loads(athlete.profile_json)
    return profile.get("adaptive_progression") or {
        "schema_version": 3,
        "status": "collecting_data",
        "longitudinal_state": {"total_exposures": 0, "channels": {}},
        "message": "Complete comparable sessions before Bell changes the prescription.",
        "history": [],
        "exercise_decisions": [],
    }


@router.get("/decisions/{decision_id}", tags=["Decisions"])
def decision(decision_id: str, db: Session = Depends(get_db), user: User = Depends(current_user)):
    row = db.get(Decision, decision_id)
    if not row:
        raise HTTPException(404, "Decision not found")
    athlete_for_user(db, row.athlete_id, user)
    return {
        "id": row.id, "athlete_id": row.athlete_id,
        "type": row.decision_type, **loads(row.payload_json),
    }


@router.get("/athletes/{athlete_id}/coach", tags=["Bell Coach"])
def coach_intelligence(athlete_id: str, db: Session = Depends(get_db), user: User = Depends(current_user)):
    athlete_for_user(db, athlete_id, user)
    payload = coach_intelligence_payload(db, athlete_id)
    db.commit()
    return payload


@router.get("/athletes/{athlete_id}/memories", tags=["Bell Coach"])
def memories(athlete_id: str, db: Session = Depends(get_db), user: User = Depends(current_user)):
    athlete_for_user(db, athlete_id, user)
    return {"items": list_coaching_memories(db, athlete_id), "athlete_controls": ["add", "review", "remove"]}


@router.post("/athletes/{athlete_id}/memories", status_code=201, tags=["Bell Coach"])
def add_memory(athlete_id: str, body: CoachingMemoryCreate, db: Session = Depends(get_db), user: User = Depends(current_user)):
    athlete_for_user(db, athlete_id, user)
    row = create_explicit_coaching_memory(db, athlete_id, body.model_dump())
    db.commit()
    return row


@router.post("/athletes/{athlete_id}/memories/refresh", tags=["Bell Coach"])
def refresh_memories(athlete_id: str, db: Session = Depends(get_db), user: User = Depends(current_user)):
    athlete_for_user(db, athlete_id, user)
    items = refresh_coaching_memories(db, athlete_id)
    db.commit()
    return {"items": items}


@router.delete("/athletes/{athlete_id}/memories/{memory_id}", tags=["Bell Coach"])
def remove_memory(athlete_id: str, memory_id: str, db: Session = Depends(get_db), user: User = Depends(current_user)):
    athlete_for_user(db, athlete_id, user)
    row = deactivate_coaching_memory(db, athlete_id, memory_id)
    if not row:
        raise HTTPException(404, "Coaching memory not found")
    db.commit()
    return row
