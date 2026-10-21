import re
from rapidfuzz.fuzz import ratio
from .parsing import extract_requirements

def score(resume,job):
 req=extract_requirements(job); low=resume.lower(); matched=[]; missing=[]
 for s in req['skills']:
  (matched if s in low else missing).append(s)
 keyword=round(100*len(matched)/max(1,len(req['skills'])))
 phrases=[p for p in re.findall(r'[A-Za-z][A-Za-z0-9+#.-]{2,}',job.lower()) if len(p)>3]
 unique=list(dict.fromkeys(phrases)); hits=sum(1 for p in unique if p in low); textmatch=round(100*hits/max(1,len(unique)))
 final=round(.65*keyword+.35*textmatch)
 return {'score':final,'keyword_match':keyword,'skills_match':keyword,'matched_skills':matched,'missing_skills':missing,'suggestions':[f'Add evidence for {x} if you genuinely have it.' for x in missing[:8]]}
