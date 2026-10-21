from datetime import datetime,timedelta,timezone
from jose import jwt
from passlib.context import CryptContext
from fastapi import Depends,HTTPException
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from .config import settings
from .db import get_db
from .models import User
pwd=CryptContext(schemes=['bcrypt'],deprecated='auto'); oauth2=OAuth2PasswordBearer(tokenUrl='/auth/login')
def hash_password(x): return pwd.hash(x)
def verify_password(x,h): return pwd.verify(x,h)
def token(uid): return jwt.encode({'sub':str(uid),'exp':datetime.now(timezone.utc)+timedelta(hours=24)},settings.secret_key,algorithm='HS256')
def current_user(t=Depends(oauth2),db:Session=Depends(get_db)):
 try: uid=int(jwt.decode(t,settings.secret_key,algorithms=['HS256'])['sub'])
 except Exception: raise HTTPException(401,'Invalid or expired token')
 u=db.get(User,uid)
 if not u: raise HTTPException(401,'User not found')
 return u
