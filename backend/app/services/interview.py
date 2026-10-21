from .llm import ask,json_parse
from .rag import search

def question(resume,job,difficulty,previous,owner=None):
 evidence='\n'.join(d.page_content for d in search(job[:1200]+' technical interview',4,owner=owner))
 history='\n'.join((f"Question: {item.get('question','')}\nCandidate answer: {item.get('answer','')}\nEvaluation: {item.get('evaluation',{}).get('feedback','')}" if isinstance(item,dict) else str(item)) for item in previous[-4:]) or 'No previous questions or answers.'
 out,_=ask('You are an adaptive technical interviewer. Ask exactly ONE concise, specific question. Ground it in a concrete project, tool, or achievement from the candidate resume AND a responsibility or skill in the target job description. Avoid generic textbook questions, invented candidate experience, and repeating earlier questions. If a previous answer exists, ask a natural follow-up that probes its decisions, evidence, trade-offs, or an identified weakness. Match the selected difficulty. Return only the question.','Difficulty: {difficulty}\nCandidate resume: {resume}\nTarget job description: {job}\nPrevious interview turns: {previous}\nOptional reference context: {evidence}',difficulty=difficulty,resume=resume[:12000],job=job[:12000],previous=history,evidence=evidence or 'No extra reference context.')
 return out

def evaluate(q,a,resume,job):
 out,lat=ask('Evaluate the answer against the question and target job, using the resume only to understand the candidate\'s actual context. Be specific, fair, and useful; do not reward invented claims. Return ONLY JSON with score,correctness,relevance,completeness,communication,feedback,follow_up. Score fields 0-100.','Candidate resume: {resume}\nTarget job description: {job}\nQuestion: {q}\nCandidate answer: {a}',resume=resume[:12000],job=job[:12000],q=q,a=a)
 return json_parse(out),lat
