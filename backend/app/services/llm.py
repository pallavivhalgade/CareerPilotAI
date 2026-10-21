import json,re,time
from langchain_ollama import ChatOllama
from langchain_core.prompts import ChatPromptTemplate
from ..config import settings
from .guardrails import clean_output

def llm(): return ChatOllama(model=settings.ollama_model,base_url=settings.ollama_base_url,temperature=.2)
def ask(system,human,**kw):
 t=time.perf_counter(); out=llm().invoke(ChatPromptTemplate.from_messages([('system',system),('human',human)]).format_messages(**kw)); return clean_output(out.content),round((time.perf_counter()-t)*1000,2)
def json_parse(text):
 text=re.sub(r'```json|```','',text).strip()
 try:return json.loads(text)
 except:return {'raw':text}
