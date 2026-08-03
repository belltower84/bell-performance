from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User
from app.schemas import RegisterCreate, TokenResponse
from app.services.core import uid
from app.core.security import hash_password, verify_password, create_access_token
router=APIRouter(prefix='/auth',tags=['Authentication'])
@router.post('/register',response_model=TokenResponse,status_code=201)
def register(body:RegisterCreate,db:Session=Depends(get_db)):
    email=body.email.lower().strip()
    if db.scalar(select(User).where(User.email==email)): raise HTTPException(409,'Email already registered')
    user=User(id=uid('usr'),email=email,password_hash=hash_password(body.password),role=body.role); db.add(user); db.commit()
    return TokenResponse(access_token=create_access_token(user),user_id=user.id,role=user.role)
@router.post('/token',response_model=TokenResponse)
def token(form:OAuth2PasswordRequestForm=Depends(),db:Session=Depends(get_db)):
    user=db.scalar(select(User).where(User.email==form.username.lower().strip()))
    if not user or not verify_password(form.password,user.password_hash): raise HTTPException(401,'Incorrect email or password',headers={'WWW-Authenticate':'Bearer'})
    return TokenResponse(access_token=create_access_token(user),user_id=user.id,role=user.role)
