from __future__ import annotations
from typing import Any, Literal
from pydantic import BaseModel, EmailStr, Field


class RegisterCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=10, max_length=128)
    role: Literal["athlete", "coach"] = "athlete"


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    role: str


class AthleteCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    profile: dict[str, Any] = Field(default_factory=dict)
    coach_user_id: str | None = None




class AthleteProfileUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=120)
    profile: dict[str, Any] = Field(default_factory=dict)


class MissionCreate(BaseModel):
    goal: str = Field(min_length=3, max_length=500)
    timeline_weeks: int = Field(default=12, ge=4, le=52)
    priority_order: list[str] = Field(default_factory=list, max_length=10)
    constraints: dict[str, Any] = Field(default_factory=dict)
    competition_date: str | None = None
    competition_type: str | None = Field(default=None, max_length=80)
    coaching_language: str | None = Field(default=None, max_length=12000)


class CheckInCreate(BaseModel):
    sleep_hours: float = Field(default=8, ge=0, le=24)
    sleep_quality: float = Field(default=7, ge=0, le=10)
    stress: float = Field(default=5, ge=0, le=10)
    motivation: float = Field(default=7, ge=0, le=10)
    soreness: dict[str, float] = Field(default_factory=dict)
    pain: dict[str, float] = Field(default_factory=dict)
    available_minutes: int = Field(default=60, ge=0, le=300)
    symptoms: list[str] = Field(default_factory=list, max_length=20)
    illness: dict[str, bool] = Field(default_factory=dict)
    athlete_preference: Literal[
        "proceed", "modify_session", "swap_session", "move_session", "recovery", "deload"
    ] | None = None


class CompletionCreate(BaseModel):
    schema_version: int = Field(default=1, ge=1, le=10)
    session_type: Literal["strength", "engine", "recovery", "mobility"] | None = None
    duration_minutes: int = Field(default=45, ge=1, le=600)
    session_rpe: float = Field(default=7, ge=0, le=10)
    performance_ratio: float = Field(default=1.0, ge=0, le=2)
    difficulty: Literal["easy", "right", "hard", "very_hard"] | None = None
    notes: str | None = Field(default=None, max_length=2000)
    planned: dict[str, Any] = Field(default_factory=dict)
    actual: dict[str, Any] = Field(default_factory=dict)
    readiness: dict[str, Any] = Field(default_factory=dict)
    feedback: dict[str, Any] = Field(default_factory=dict)
    pain: dict[str, float] = Field(default_factory=dict)
    technique_issues: list[str] = Field(default_factory=list, max_length=50)
    symptoms: list[str] = Field(default_factory=list, max_length=50)
    exercise_results: list[dict[str, Any]] = Field(default_factory=list, max_length=100)
    engine_results: dict[str, Any] = Field(default_factory=dict)

class CoachingMemoryCreate(BaseModel):
    observation: str = Field(min_length=3, max_length=1000)
    category: str = Field(default="athlete_preference", min_length=2, max_length=80)
    memory_key: str | None = Field(default=None, max_length=180)
    evidence: dict[str, Any] = Field(default_factory=dict)
