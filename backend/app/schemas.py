from pydantic import BaseModel,Field,EmailStr
class Auth(BaseModel): email:EmailStr; password:str=Field(min_length=6)
class Analyze(BaseModel): resume_text:str=Field(min_length=30); job_text:str=Field(min_length=30)
class InterviewStart(BaseModel): resume_text:str; job_text:str; difficulty:str='medium'
class InterviewAnswer(BaseModel): session_id:int; question:str; answer:str; job_text:str
class ChatIn(BaseModel): query:str=Field(min_length=2,max_length=4000); resume_text:str=Field(default='',max_length=12000); job_text:str=Field(default='',max_length=12000)
