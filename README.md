# CareerPilot AI — End-to-End Agentic GenAI Career Intelligence Platform

A complete local-first portfolio project: resume/JD intelligence, ATS scoring, advanced hybrid RAG, LangGraph agents, tool calling, adaptive interviews, evaluation, guardrails, hallucination checks, memory, streaming, monitoring, and an admin-style dashboard.

## Zero-cost local stack
React + Vite | FastAPI | SQLite | Ollama | LangChain | LangGraph | Hugging Face embeddings | ChromaDB | BM25 | CrossEncoder reranker | JWT | Pytest | Docker.

### Requirements
- Windows 10/11, Python 3.12, Node 20.19+ or 22.12+, Git optional
- 8 GB RAM recommended: use `llama3.2:3b` locally.
- Install Ollama and run: `ollama pull llama3.2:3b`

## Quick start (Windows PowerShell)
```powershell
cd CareerPilotAI
powershell -ExecutionPolicy Bypass -File .\setup_windows.ps1
```
Then start Ollama and run:
```powershell
powershell -ExecutionPolicy Bypass -File .\run_windows.ps1
```
Frontend: http://localhost:5173 | API docs: http://localhost:8000/docs
The Windows launcher starts the servers in the background and prints their process IDs.
Check `logs/backend.err.log` and `logs/frontend.err.log` for startup errors.
Activation is optional: the scripts call the virtual environment's Python and `npm.cmd` directly.

## Manual start
### Backend
```powershell
cd backend
py -3.12 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
if (!(Test-Path .env)) { Copy-Item .env.example .env }
.\.venv\Scripts\python.exe -m app.seed
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload
```
### Frontend
```powershell
cd frontend
npm.cmd install
npm.cmd run dev
```

## Implemented end-to-end
1. JWT registration/login and user isolation
2. PDF/DOCX/TXT resume extraction
3. JD parsing and requirement extraction
4. Deterministic ATS scoring + LLM explanation
5. Skill gap: strong/moderate/missing + priorities
6. Advanced RAG: chunking, metadata, Hugging Face embeddings, ChromaDB
7. Hybrid retrieval: semantic + BM25 keyword retrieval
8. CrossEncoder reranking (lazy loaded)
9. Query rewriting and context compression
10. LangGraph career-analysis workflow with conditional verification
11. Tool/function layer: ATS calculator, resume/JD parser, knowledge search, interview question tool
12. Structured Pydantic outputs with safe fallback parsing
13. Context management: compact analysis context instead of resending full history
14. Adaptive interview with session memory
15. Interview evaluation with rubric scores
16. Guardrails: prompt-injection detection, input limits, output validation
17. Hallucination/grounding checker using retrieved evidence and unsupported-claim flags
18. RAG/agent evaluation metrics and monitoring events
19. SSE token streaming for career Q&A and interview feedback
20. Dashboard: ATS, skill gaps, interview score, latency/events
21. Dockerfiles + compose
22. Pytest suite for core deterministic components
23. Optional LoRA experiment under `fine_tuning/`

## Important honesty note
Model quality and response time depend on the local Ollama model and hardware. Automated browser tests verify the interface and API contracts; they do not measure the quality of every generated answer.

## Frontend workspace

The frontend includes a public landing page and four workspace tools: Overview, Role fit, Interview studio, and Career coach. Interview Studio supports browser speech-to-text where available; the submitted transcript joins the typed answer. DM Sans and Instrument Serif are bundled locally. The interface uses a compact sample-analysis preview, a focused dashboard, keyboard navigation, a Ctrl+K tool switcher, phone layouts, and reduced-motion support. The landing page keeps all content visible without scroll-triggered reveals.

Choose **Take a look inside** to explore the labelled preview without an account. Preview analyses use a simple keyword comparison; interview feedback and career-coach answers are examples. Sign in to use the real backend and local model. Resume and job-description drafts stay in page memory and are cleared on sign-out.

Frontend requests use /api on the same origin. Vite proxies these requests to http://127.0.0.1:8000 during development and preview. Docker Compose sets the proxy target to the backend container. See frontend/.env.example for optional API configuration.

### API keys and Vercel

The local app does not need a paid API key: `backend/app/services/llm.py` calls Ollama at `OLLAMA_BASE_URL` and runs `llama3.2:3b` on your machine. The current code has no cloud-model adapter, so adding a provider key alone will not switch inference to a hosted model. Do not put a model-provider secret in a `VITE_*` variable; Vite exposes those values in the browser bundle.

The Vite frontend is prepared for a static Vercel deployment. Import the repository, set **Root Directory** to `frontend`, and deploy with the default Vite build (`npm run build`, output `dist`). `frontend/vercel.json` keeps workspace routes working after refresh. Set `VITE_API_URL` in Vercel to a public HTTPS API origin to enable account and AI features; without it, only the local `/api` proxy works.

The current backend still depends on Ollama on the same machine and local SQLite/Chroma files. A Vercel deployment cannot reach your laptop's Ollama or provide durable storage for those local files. The live product therefore needs the backend hosted somewhere reachable, a hosted model provider (put its API key only in backend environment variables), and persistent database/vector storage. Also set a unique random `SECRET_KEY` and `CORS_ORIGINS` (your deployed frontend origin) on the backend. The frontend can be deployed independently now, but it will not provide working signup or AI features until that API is configured.

### Frontend verification

    cd frontend
    npm.cmd install
    npx.cmd playwright install chromium
    npm.cmd test
    npm.cmd run build

The browser suite covers desktop and mobile layouts, accessibility, reduced motion, preview flows, authentication, uploads, API payloads, and safe rendering of generated text. Most API responses are mocked so the tests do not require model inference. To include the live backend health check, set $env:CAREERPILOT_LIVE_API='1' before testing. To use an installed Chrome instead of downloading Chromium, set $env:PLAYWRIGHT_CHANNEL='chrome'.

The production files are generated in frontend/dist. When deploying them, route /api to FastAPI through your web server. If you set VITE_API_URL to a separate API origin, also configure FastAPI's allowed CORS origins for that deployment.
