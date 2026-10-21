import json,time
from fastapi import APIRouter,Depends,HTTPException,UploadFile,File
from sqlalchemy.orm import Session
from ..db import get_db
from ..models import Analysis,InterviewSession,Event
from ..schemas import Analyze,InterviewStart,InterviewAnswer,ChatIn
from ..security import current_user
from ..services.parsing import extract_upload,extract_requirements
from ..services.guardrails import check_input
from ..services.ats import score
from ..services.agents import analyze
from ..services.interview import question,evaluate
from ..services.rag import search,add_text
from ..services.llm import ask
from ..services.hallucination import verify_answer
from ..services.monitor import event
r=APIRouter()
@r.post('/resume/extract')
def extract(file:UploadFile=File(...),user=Depends(current_user)):
 data=file.file.read(); text=extract_upload(file.filename,data); ok,msg=check_input(text)
 if not ok: raise HTTPException(400,msg)
 return {'text':text}
@r.post('/knowledge/add')
def knowledge(file:UploadFile=File(...),user=Depends(current_user)):
 text=extract_upload(file.filename,file.file.read()); add_text(text,{'owner':str(user.id),'source':file.filename}); return {'message':'indexed','characters':len(text)}
@r.post('/analysis')
def analysis(x:Analyze,db:Session=Depends(get_db),user=Depends(current_user)):
 for t in [x.resume_text,x.job_text]:
  ok,msg=check_input(t)
  if not ok: raise HTTPException(400,msg)
 start=time.perf_counter(); result=analyze(x.resume_text,x.job_text,owner=str(user.id)); lat=(time.perf_counter()-start)*1000
 rec=Analysis(user_id=user.id,resume_text=x.resume_text,job_text=x.job_text,result_json=json.dumps(result,default=str),ats_score=int(result['ats']['score'])); db.add(rec); db.commit(); event(db,user.id,'analysis',lat,{'analysis_id':rec.id}); return {'analysis_id':rec.id,**result,'latency_ms':round(lat,2)}
@r.post('/interview/start')
def start(x:InterviewStart,db:Session=Depends(get_db),user=Depends(current_user)):
 q=question(x.resume_text,x.job_text,x.difficulty,[],owner=str(user.id)); s=InterviewSession(user_id=user.id,resume_text=x.resume_text,job_text=x.job_text,difficulty=x.difficulty,history_json=json.dumps([{'role':'interviewer','question':q}])); db.add(s); db.commit(); db.refresh(s); return {'session_id':s.id,'question':q}
@r.post('/interview/answer')
def answer(x:InterviewAnswer,db:Session=Depends(get_db),user=Depends(current_user)):
 s=db.get(InterviewSession,x.session_id)
 if not s or s.user_id!=user.id: raise HTTPException(404,'Session not found')
 start=time.perf_counter(); ev,lat=evaluate(x.question,x.answer,s.resume_text,s.job_text); history=json.loads(s.history_json); history += [{'role':'candidate','question':x.question,'answer':x.answer,'evaluation':ev}]; nextq=question(s.resume_text,s.job_text,s.difficulty,history,owner=str(user.id)); history.append({'role':'interviewer','question':nextq}); s.history_json=json.dumps(history); s.turns+=1; s.total_score=((s.total_score*(s.turns-1))+float(ev.get('score',0)))/s.turns; db.commit(); event(db,user.id,'interview_evaluation',lat,{'session_id':s.id,'score':ev.get('score',0)}); return {'evaluation':ev,'next_question':nextq,'average_score':round(s.total_score,1)}
@r.post('/chat')
def chat(x:ChatIn,user=Depends(current_user)):
 ok,msg=check_input(x.query,4000)
 if not ok: raise HTTPException(400,msg)
 docs=search(x.query+' '+x.job_text[:1000],6,owner=str(user.id)); ctx=[d.page_content for d in docs]; answer,lat=ask('Act as a practical career coach. Use the candidate context, target job, and retrieved evidence to answer the question with relevant next steps. Never invent experience or credentials. If the evidence is insufficient, say what is unknown.','Question: {q}\nCandidate resume context: {resume}\nTarget job description: {job}\nRetrieved evidence:\n{e}',q=x.query,resume=x.resume_text[:12000] or 'Not provided',job=x.job_text[:12000] or 'Not provided',e='\n\n'.join(ctx) or 'No relevant knowledge-base passages found.'); return {'answer':answer,'sources':[d.metadata for d in docs],'grounding':verify_answer(answer,ctx),'latency_ms':lat}
@r.get('/dashboard')
def dashboard(db:Session=Depends(get_db),user=Depends(current_user)):
 a=db.query(Analysis).filter_by(user_id=user.id).all(); s=db.query(InterviewSession).filter_by(user_id=user.id).all(); ev=db.query(Event).filter_by(user_id=user.id).order_by(Event.id.desc()).limit(50).all(); return {'analyses':len(a),'avg_ats':round(sum(x.ats_score for x in a)/len(a),1) if a else 0,'interviews':len(s),'avg_interview':round(sum(x.total_score for x in s)/len(s),1) if s else 0,'recent_events':[{'type':e.event_type,'latency_ms':e.latency_ms,'created_at':e.created_at.isoformat()} for e in ev]}
@r.get('/requirements')
def requirements(job:str,user=Depends(current_user)): return extract_requirements(job)
