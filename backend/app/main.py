from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .db import Base,engine
from .routers.auth import r as auth_router
from .routers.core import r as core_router
from .services.rag import init
from .config import settings
Base.metadata.create_all(bind=engine)
app=FastAPI(title='CareerPilot AI',version='2.0.0')
app.add_middleware(CORSMiddleware,allow_origins=[origin.strip() for origin in settings.cors_origins.split(',') if origin.strip()],allow_credentials=True,allow_methods=['*'],allow_headers=['*'])
app.include_router(auth_router); app.include_router(core_router)
@app.on_event('startup')
def startup(): init()
@app.get('/health')
def health(): return {'status':'ok','service':'careerpilot-ai','version':'2.0.0'}
