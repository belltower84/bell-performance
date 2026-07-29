from __future__ import annotations
from datetime import datetime, timezone
from sqlalchemy import String, DateTime, ForeignKey, Text, Float, UniqueConstraint, Boolean
from sqlalchemy.orm import Mapped, mapped_column
from .database import Base

def now(): return datetime.now(timezone.utc)
class User(Base):
    __tablename__='users'
    id: Mapped[str]=mapped_column(String,primary_key=True)
    email: Mapped[str]=mapped_column(String(255),unique=True,index=True)
    password_hash: Mapped[str]=mapped_column(String(512))
    role: Mapped[str]=mapped_column(String(20),default='athlete',index=True)
    is_active: Mapped[bool]=mapped_column(Boolean,default=True)
    created_at: Mapped[datetime]=mapped_column(DateTime(timezone=True),default=now)
class Athlete(Base):
    __tablename__='athletes'
    id: Mapped[str]=mapped_column(String,primary_key=True)
    owner_user_id: Mapped[str]=mapped_column(ForeignKey('users.id'),index=True)
    coach_user_id: Mapped[str|None]=mapped_column(ForeignKey('users.id'),nullable=True,index=True)
    name: Mapped[str]=mapped_column(String(120)); profile_json: Mapped[str]=mapped_column(Text,default='{}')
    created_at: Mapped[datetime]=mapped_column(DateTime(timezone=True),default=now)
class Mission(Base):
    __tablename__='missions'; id: Mapped[str]=mapped_column(String,primary_key=True); athlete_id: Mapped[str]=mapped_column(ForeignKey('athletes.id'),index=True); request_json: Mapped[str]=mapped_column(Text); compiled_json: Mapped[str]=mapped_column(Text); created_at: Mapped[datetime]=mapped_column(DateTime(timezone=True),default=now)
class Plan(Base):
    __tablename__='plans'; id: Mapped[str]=mapped_column(String,primary_key=True); athlete_id: Mapped[str]=mapped_column(ForeignKey('athletes.id'),index=True); mission_id: Mapped[str]=mapped_column(ForeignKey('missions.id')); plan_json: Mapped[str]=mapped_column(Text); status: Mapped[str]=mapped_column(String(30),default='active'); created_at: Mapped[datetime]=mapped_column(DateTime(timezone=True),default=now)
class CheckIn(Base):
    __tablename__='checkins'; id: Mapped[str]=mapped_column(String,primary_key=True); athlete_id: Mapped[str]=mapped_column(ForeignKey('athletes.id'),index=True); payload_json: Mapped[str]=mapped_column(Text); readiness_score: Mapped[float]=mapped_column(Float); readiness_band: Mapped[str]=mapped_column(String(20)); created_at: Mapped[datetime]=mapped_column(DateTime(timezone=True),default=now)
class AthleteEvent(Base):
    __tablename__='athlete_events'; id: Mapped[str]=mapped_column(String,primary_key=True); athlete_id: Mapped[str]=mapped_column(ForeignKey('athletes.id'),index=True); event_type: Mapped[str]=mapped_column(String(60),index=True); occurred_at: Mapped[datetime]=mapped_column(DateTime(timezone=True),default=now); payload_json: Mapped[str]=mapped_column(Text)
class Decision(Base):
    __tablename__='decisions'; id: Mapped[str]=mapped_column(String,primary_key=True); athlete_id: Mapped[str]=mapped_column(ForeignKey('athletes.id'),index=True); decision_type: Mapped[str]=mapped_column(String(60)); payload_json: Mapped[str]=mapped_column(Text); created_at: Mapped[datetime]=mapped_column(DateTime(timezone=True),default=now)
class SessionCompletion(Base):
    __tablename__='session_completions'; __table_args__=(UniqueConstraint('athlete_id','session_id'),)
    id: Mapped[str]=mapped_column(String,primary_key=True); athlete_id: Mapped[str]=mapped_column(ForeignKey('athletes.id'),index=True); session_id: Mapped[str]=mapped_column(String,index=True); payload_json: Mapped[str]=mapped_column(Text); idempotency_key: Mapped[str|None]=mapped_column(String(100),nullable=True,index=True); created_at: Mapped[datetime]=mapped_column(DateTime(timezone=True),default=now)
class IdempotencyRecord(Base):
    __tablename__='idempotency_records'; __table_args__=(UniqueConstraint('user_id','key','route'),)
    id: Mapped[str]=mapped_column(String,primary_key=True); user_id: Mapped[str]=mapped_column(ForeignKey('users.id'),index=True); key: Mapped[str]=mapped_column(String(100)); route: Mapped[str]=mapped_column(String(255)); status_code: Mapped[float]=mapped_column(Float); response_json: Mapped[str]=mapped_column(Text); created_at: Mapped[datetime]=mapped_column(DateTime(timezone=True),default=now)

class CoachingMemory(Base):
    __tablename__='coaching_memories'; __table_args__=(UniqueConstraint('athlete_id','memory_key'),)
    id: Mapped[str]=mapped_column(String,primary_key=True)
    athlete_id: Mapped[str]=mapped_column(ForeignKey('athletes.id'),index=True)
    memory_key: Mapped[str]=mapped_column(String(180),index=True)
    category: Mapped[str]=mapped_column(String(80),default='athlete_preference')
    observation: Mapped[str]=mapped_column(Text)
    confidence: Mapped[float]=mapped_column(Float,default=1.0)
    evidence_json: Mapped[str]=mapped_column(Text,default='{}')
    source_type: Mapped[str]=mapped_column(String(80),default='athlete_explicit')
    is_active: Mapped[bool]=mapped_column(Boolean,default=True,index=True)
    first_observed: Mapped[datetime]=mapped_column(DateTime(timezone=True),default=now)
    last_confirmed: Mapped[datetime]=mapped_column(DateTime(timezone=True),default=now)
    created_at: Mapped[datetime]=mapped_column(DateTime(timezone=True),default=now)
