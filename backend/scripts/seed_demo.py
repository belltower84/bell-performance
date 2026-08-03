from sqlalchemy import select
from app.database import Base,engine,SessionLocal
from app.models import User,Athlete
from app.services.core import uid,dumps
from app.core.security import hash_password
Base.metadata.create_all(engine); db=SessionLocal()
email='demo@bell.local'; user=db.scalar(select(User).where(User.email==email))
if not user:
    user=User(id=uid('usr'),email=email,password_hash=hash_password('BellDemo123!'),role='athlete'); db.add(user); db.flush()
if not db.scalar(select(Athlete).where(Athlete.owner_user_id==user.id)):
    db.add(Athlete(id=uid('ath'),owner_user_id=user.id,name='Demo Athlete',profile_json=dumps({'experience':'intermediate'})))
db.commit(); print('Demo login: demo@bell.local / BellDemo123!')
