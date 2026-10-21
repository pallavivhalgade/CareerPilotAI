import re
from pathlib import Path
from pypdf import PdfReader
from docx import Document

def extract_upload(filename,data):
 ext=Path(filename or '').suffix.lower()
 if ext=='.pdf':
  p=Path('_upload.pdf'); p.write_bytes(data)
  try:return '\n'.join((x.extract_text() or '') for x in PdfReader(str(p)).pages)
  finally:p.unlink(missing_ok=True)
 if ext=='.docx':
  p=Path('_upload.docx'); p.write_bytes(data)
  try:return '\n'.join(x.text for x in Document(str(p)).paragraphs)
  finally:p.unlink(missing_ok=True)
 return data.decode('utf-8','ignore')

def chunks(text,size=900,overlap=120):
 text=re.sub(r'\s+',' ',text).strip(); out=[]; i=0
 while i<len(text): out.append(text[i:i+size]); i+=size-overlap
 return out

def extract_requirements(job):
 skills=['python','sql','django','fastapi','machine learning','deep learning','tensorflow','pytorch','scikit-learn','pandas','numpy','rag','agentic ai','generative ai','llm','langchain','langgraph','hugging face','openai api','chromadb','docker','git','rest api','nlp','computer vision','aws','azure','gcp','postgresql','mongodb']
 low=job.lower(); found=[s for s in skills if s in low]
 return {'skills':found,'responsibilities':[x.strip() for x in re.split(r'[.;]',job) if len(x.strip())>30][:12]}
