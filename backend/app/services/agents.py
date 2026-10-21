import json
from typing import TypedDict
from langgraph.graph import StateGraph,START,END
from .ats import score
from .parsing import extract_requirements
from .llm import ask,json_parse
from .rag import search
from .hallucination import verify_answer
class State(TypedDict, total=False): resume:str; job:str; owner:str; ats:dict; gap:dict; plan:list; evidence:list; verification:dict

def ats_node(s): return {'ats':score(s['resume'],s['job'])}
def gap_node(s):
 req=extract_requirements(s['job']); m=set(s['ats']['matched_skills']); miss=[x for x in req['skills'] if x not in m]; return {'gap':{'strong_skills':list(m),'missing_skills':miss,'priority':miss[:5]}}
def evidence_node(s): return {'evidence':[d.page_content for d in search(' '.join(s['gap'].get('priority',[]))+' interview preparation',5,owner=s.get('owner'))]}
def plan_node(s):
 prompt=('Create exactly seven personalized daily actions for this candidate. Use their real projects and strengths from the resume, the job responsibilities and requirements, and prioritize the missing skills. '
         'Keep every task realistic for one day, include a tangible deliverable and one interview practice prompt each day. Never invent experience or claim the candidate has a missing skill. '
         'Return ONLY valid JSON as an array of exactly 7 objects with keys day (integer 1-7), focus, why, tasks (array of 2-3 strings), deliverable, interview_prompt.')
 txt,lat=ask(prompt,'Resume: {resume}\nJob description: {job}\nMatched skills: {matched}\nPriority gaps: {gaps}\nRetrieved learning context: {evidence}',resume=s['resume'][:12000],job=s['job'][:12000],matched=', '.join(s['gap'].get('strong_skills',[])),gaps=', '.join(s['gap'].get('priority',[])) or 'No clear skill gaps; deepen role-specific evidence',evidence='\n'.join(s['evidence']) or 'No retrieved context available. Build tasks from the resume and job description only.')
 plan=json_parse(txt)
 if not isinstance(plan,list) or len(plan)!=7 or any(not isinstance(day,dict) for day in plan):
  gap=s['gap'].get('priority',[]); strength=s['gap'].get('strong_skills',[]); target=gap[0] if gap else (strength[0] if strength else 'a core job requirement')
  focuses=['Select your anchor project','Make the evidence clear','Study one priority gap','Build a small proof','Check quality and trade-offs','Rehearse a technical explanation','Run a focused mock interview']
  tasks=[['Choose one resume project that best matches this job.','Map its real responsibilities to two job requirements.'],['Write a concise STAR outline using only details you can verify.','Add real scope or impact numbers where available.'],[f'Learn the core ideas behind {target}.','List what you know and what still needs practice.'],[f'Build a small example that demonstrates {target}.','Add a short README explaining your choices.'],['Test your example with one normal case and one edge case.','Write down one trade-off and what you would measure.'],['Practice explaining the project and the {target} connection aloud.','Keep the explanation clear about what you personally did.'],['Answer one role-specific question without notes.','Review your answer and choose one point to improve next.']]
  plan=[{'day':i+1,'focus':focuses[i],'why':f"Use a truthful example from your resume to show how you meet this job's requirements; prioritize {target} where it fits.",'tasks':tasks[i],'deliverable':['A project-to-requirement map.','A verified STAR outline.','A short learning note.','A working mini-example.','A test note with one trade-off.','A two-minute spoken explanation.','A revised answer and next step.'][i],'interview_prompt':['Which project best shows your fit for this role?','What evidence supports the impact you described?','How would you approach learning '+target+'?','How would you design a small proof of '+target+'?','How would you test this and measure success?','What trade-off did you make and why?','What would you improve after receiving feedback?'][i]} for i in range(7)]
 for i,day in enumerate(plan): day['day']=i+1
 return {'plan':plan}
def verify_node(s): return {'verification':verify_answer(json.dumps(s['plan'],ensure_ascii=False),s['evidence'])}
g=StateGraph(State); g.add_node('ats',ats_node); g.add_node('gap',gap_node); g.add_node('evidence',evidence_node); g.add_node('plan',plan_node); g.add_node('verify',verify_node); g.add_edge(START,'ats'); g.add_edge('ats','gap'); g.add_edge('gap','evidence'); g.add_edge('evidence','plan'); g.add_edge('plan','verify'); g.add_edge('verify',END); graph=g.compile()

def analyze(resume,job,owner=None): return graph.invoke({'resume':resume,'job':job,'owner':str(owner) if owner is not None else None})
