from pathlib import Path
from rank_bm25 import BM25Okapi
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma
from langchain_core.documents import Document
from sentence_transformers import CrossEncoder
from .parsing import chunks
from ..config import settings
_embed=None; store=None; docs=[]; bm25=None; reranker=None

def init():
 global _embed,store,docs,bm25
 _embed=HuggingFaceEmbeddings(model_name=settings.embedding_model)
 store=Chroma(collection_name='careerpilot',embedding_function=_embed,persist_directory=settings.chroma_dir)
 try:
  data=store.get(include=['documents','metadatas']); docs=[Document(page_content=x,metadata=m or {}) for x,m in zip(data.get('documents',[]),data.get('metadatas',[]))]
 except Exception: docs=[]
 if docs: bm25=BM25Okapi([d.page_content.lower().split() for d in docs])

def add_text(text,metadata):
 global docs,bm25
 parts=chunks(text); new=[Document(page_content=x,metadata=metadata) for x in parts]
 store.add_documents(new); docs.extend(new); bm25=BM25Okapi([d.page_content.lower().split() for d in docs])

def search(query,k=8,owner=None):
 global reranker
 owner=str(owner) if owner is not None else None
 def visible(doc):
  return doc.metadata.get('source')=='built-in career knowledge' or (owner is not None and doc.metadata.get('owner')==owner)
 where={'$or':[{'source':'built-in career knowledge'},{'owner':owner}]} if owner is not None else {'source':'built-in career knowledge'}
 semantic=store.similarity_search(query,k=min(k,len(docs)) if docs else k,filter=where)
 lexical=[]
 if bm25 and docs:
  scores=bm25.get_scores(query.lower().split()); allowed=[i for i,doc in enumerate(docs) if visible(doc)]; idx=sorted(allowed,key=lambda i:scores[i],reverse=True)[:k]; lexical=[docs[i] for i in idx]
 seen=set(); candidates=[]
 for d in semantic+lexical:
  if d.page_content not in seen: seen.add(d.page_content); candidates.append(d)
 if not candidates:return []
 try:
  if reranker is None: reranker=CrossEncoder(settings.rerank_model)
  pairs=[(query,d.page_content) for d in candidates]; rs=reranker.predict(pairs); candidates=[d for _,d in sorted(zip(rs,candidates),key=lambda x:x[0],reverse=True)]
 except Exception: pass
 return candidates[:k]
