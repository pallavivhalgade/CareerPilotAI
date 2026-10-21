from fastapi import APIRouter,Depends,HTTPException
from sqlalchemy.orm import Session
from ..db import get_db
from ..models import User
from ..schemas import Auth
from ..security import hash_password,verify_password,token
r=APIRouter(prefix='/auth')
@r.post('/register')
def register(x:Auth,db:Session=Depends(get_db)):
 if db.query(User).filter_by(email=x.email).first(): raise HTTPException(409,'Email already exists')
 u=User(email=x.email,password_hash=hash_password(x.password)); db.add(u); db.commit(); db.refresh(u); return {'token':token(u.id)}
@r.post('/login')
def login(x:Auth,db:Session=Depends(get_db)):
 u=db.query(User).filter_by(email=x.email).first()
 if not u or not verify_password(x.password,u.password_hash): raise HTTPException(401,'Invalid credentials')
 return {'token':token(u.id)}
