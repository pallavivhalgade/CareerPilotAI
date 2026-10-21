from datetime import datetime
from sqlalchemy import String,Text,DateTime,ForeignKey,Integer,Float
from sqlalchemy.orm import Mapped,mapped_column
from .db import Base
class User(Base):
 __tablename__='users'; id:Mapped[int]=mapped_column(primary_key=True); email:Mapped[str]=mapped_column(String(255),unique=True,index=True); password_hash:Mapped[str]=mapped_column(String(255))
class Analysis(Base):
 __tablename__='analyses'; id:Mapped[int]=mapped_column(primary_key=True); user_id:Mapped[int]=mapped_column(ForeignKey('users.id')); resume_text:Mapped[str]=mapped_column(Text); job_text:Mapped[str]=mapped_column(Text); result_json:Mapped[str]=mapped_column(Text); ats_score:Mapped[int]=mapped_column(Integer); created_at:Mapped[datetime]=mapped_column(DateTime,default=datetime.utcnow)
class InterviewSession(Base):
 __tablename__='interview_sessions'; id:Mapped[int]=mapped_column(primary_key=True); user_id:Mapped[int]=mapped_column(ForeignKey('users.id')); resume_text:Mapped[str]=mapped_column(Text); job_text:Mapped[str]=mapped_column(Text); difficulty:Mapped[str]=mapped_column(String(30)); history_json:Mapped[str]=mapped_column(Text,default='[]'); total_score:Mapped[float]=mapped_column(Float,default=0); turns:Mapped[int]=mapped_column(Integer,default=0); created_at:Mapped[datetime]=mapped_column(DateTime,default=datetime.utcnow)
class Event(Base):
 __tablename__='events'; id:Mapped[int]=mapped_column(primary_key=True); user_id:Mapped[int|None]=mapped_column(ForeignKey('users.id'),nullable=True); event_type:Mapped[str]=mapped_column(String(80)); latency_ms:Mapped[float]=mapped_column(Float,default=0); detail_json:Mapped[str]=mapped_column(Text,default='{}'); created_at:Mapped[datetime]=mapped_column(DateTime,default=datetime.utcnow)
