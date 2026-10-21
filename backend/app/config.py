from pydantic_settings import BaseSettings
class Settings(BaseSettings):
    secret_key:str='change-me'; database_url:str='sqlite:///./careerpilot.db'; cors_origins:str='http://localhost:5173'; ollama_base_url:str='http://localhost:11434'; ollama_model:str='llama3.2:3b'; embedding_model:str='sentence-transformers/all-MiniLM-L6-v2'; rerank_model:str='cross-encoder/ms-marco-MiniLM-L-6-v2'; chroma_dir:str='./chroma_data'; max_input_chars:int=50000
    class Config: env_file='.env'
settings=Settings()
