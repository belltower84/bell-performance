from __future__ import annotations
import base64, hashlib, hmac, os
from datetime import datetime, timedelta, timezone
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.core.config import get_settings
from app.database import get_db
from app.models import User

_oauth2 = OAuth2PasswordBearer(tokenUrl='/api/v1/auth/token')

def hash_password(password: str) -> str:
    salt = os.urandom(16)
    digest = hashlib.pbkdf2_hmac('sha256', password.encode(), salt, 210_000)
    return 'pbkdf2_sha256$210000$%s$%s' % (
        base64.urlsafe_b64encode(salt).decode(), base64.urlsafe_b64encode(digest).decode()
    )

def verify_password(password: str, encoded: str) -> bool:
    try:
        algo, rounds, salt_b64, digest_b64 = encoded.split('$', 3)
        if algo != 'pbkdf2_sha256': return False
        salt = base64.urlsafe_b64decode(salt_b64.encode())
        expected = base64.urlsafe_b64decode(digest_b64.encode())
        actual = hashlib.pbkdf2_hmac('sha256', password.encode(), salt, int(rounds))
        return hmac.compare_digest(actual, expected)
    except Exception:
        return False

def create_access_token(user: User) -> str:
    s=get_settings(); now=datetime.now(timezone.utc)
    payload={'sub':user.id,'role':user.role,'iat':now,'exp':now+timedelta(minutes=s.access_token_minutes)}
    return jwt.encode(payload,s.jwt_secret,algorithm=s.jwt_algorithm)

def current_user(token: str=Depends(_oauth2), db: Session=Depends(get_db)) -> User:
    s=get_settings(); credentials=HTTPException(status.HTTP_401_UNAUTHORIZED,'Invalid or expired token',headers={'WWW-Authenticate':'Bearer'})
    try: payload=jwt.decode(token,s.jwt_secret,algorithms=[s.jwt_algorithm]); uid=payload.get('sub')
    except jwt.PyJWTError: raise credentials
    user=db.get(User,uid) if uid else None
    if not user or not user.is_active: raise credentials
    return user

def require_roles(*roles: str):
    def dependency(user: User=Depends(current_user)) -> User:
        if user.role not in roles: raise HTTPException(403,'Insufficient permissions')
        return user
    return dependency
