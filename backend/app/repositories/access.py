from fastapi import HTTPException
from sqlalchemy.orm import Session
from app.models import Athlete, User

def athlete_for_user(db:Session, athlete_id:str, user:User) -> Athlete:
    athlete=db.get(Athlete,athlete_id)
    if not athlete: raise HTTPException(404,'Athlete not found')
    permitted=user.role=='admin' or athlete.owner_user_id==user.id or athlete.coach_user_id==user.id
    if not permitted: raise HTTPException(403,'You do not have access to this athlete')
    return athlete
