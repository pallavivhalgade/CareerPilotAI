# CareerPilot AI

**Your next move. A little clearer.**

A career preparation workspace that connects your resume to a target role, helps you practice technical interviews, and turns skill gaps into practical next steps.

**[Open the live demo](https://careerpilot-ai-three-virid.vercel.app)** · [Browse the code](https://github.com/pallavivhalgade/CareerPilotAI) · [Local setup](#local-setup) · [Project structure](#project-structure)

![CareerPilot AI homepage with a sample role-fit analysis](docs/images/careerpilot-preview.png)

> **Live demo:** The Vercel deployment provides the frontend and an account-free preview. Choose **Take a look inside** to explore sample data. Signup and model-powered features require a reachable backend; they are not enabled by the static frontend deployment alone.

## Overview

CareerPilot brings three preparation tools into one workspace:

| Workspace | What you can do |
| --- | --- |
| **Overview** | Review analysis counts, role-fit averages, interview scores, and recent activity. |
| **Role fit** | Compare a resume with a job description, identify matching and missing skills, and generate a seven-day preparation plan. |
| **Interview studio** | Practice role-specific questions, choose a difficulty, and receive feedback on correctness, relevance, completeness, and communication. |
| **Career coach** | Ask questions using resume context, the target role, and retrieved career knowledge. |

The interface uses locally bundled **DM Sans** and **Instrument Serif**, responsive layouts, keyboard navigation, a **Ctrl/Cmd + K** tool switcher, and reduced-motion support. Interview answers can use browser speech-to-text where supported.

## Features

- **Resume extraction:** Upload PDF, DOCX, or TXT files, or paste resume text.
- **Role comparison:** Calculate a deterministic match score and identify skill gaps.
- **Preparation plans:** Generate seven daily actions with tasks, deliverables, and interview prompts.
- **Adaptive interviews:** Keep session history and generate follow-up questions.
- **Hybrid retrieval:** Combine semantic search and BM25 keyword retrieval, then rerank candidates with a CrossEncoder.
- **Workflow orchestration:** Use LangGraph to run scoring, gap analysis, retrieval, planning, and evidence-overlap checks.
- **User accounts:** Register and sign in with JWT authentication; scope saved records and private retrieval context to the user.
- **Local inference:** Run the language model through Ollama without a paid model-provider API key.
- **Preview mode:** Explore the product without an account using clearly labelled sample results.

## Tech stack

| Layer | Technologies |
| --- | --- |
| Frontend | React, Vite, CSS, DM Sans, Instrument Serif |
| API | Python, FastAPI, Pydantic, Uvicorn |
| Language model | Ollama with `llama3.2:3b` by default |
| Orchestration | LangChain, LangGraph |
| Retrieval | Hugging Face embeddings, ChromaDB, BM25, CrossEncoder |
| Data and authentication | SQLite, SQLAlchemy, JWT, bcrypt |
| Verification | Playwright, axe-core, Pytest |
| Deployment | Vercel frontend; Docker configuration for local services |

## Project structure

```text
CareerPilotAI/
├── frontend/                         # React application
│   ├── public/
│   │   ├── favicon.svg
│   │   └── licenses/                 # Bundled font licenses
│   ├── src/
│   │   ├── components/
│   │   │   ├── Landing.jsx           # Public homepage and product preview
│   │   │   ├── Workspace.jsx         # Overview, role fit, interviews, coach
│   │   │   ├── Common.jsx            # Shared dialogs, headings, score ring
│   │   │   └── Icons.jsx             # Icons and brand mark
│   │   ├── lib/
│   │   │   ├── api.js                # API requests and session helpers
│   │   │   └── demo.js               # Sample data and preview responses
│   │   ├── App.jsx                   # Routing, authentication, application state
│   │   ├── main.jsx                  # Entry point and font imports
│   │   ├── style.css                 # Core visual styles
│   │   └── responsive.css            # Responsive and reduced-motion styles
│   ├── tests/workspace.spec.js       # Browser and accessibility checks
│   ├── .env.example
│   ├── .vercelignore
│   ├── package.json
│   ├── package-lock.json
│   ├── playwright.config.js
│   ├── vercel.json                   # SPA routing for Vercel
│   └── vite.config.js                # Development server and API proxy
├── backend/                          # FastAPI application
│   ├── app/
│   │   ├── routers/
│   │   │   ├── auth.py               # Registration and login endpoints
│   │   │   └── core.py               # Analysis, interviews, chat, dashboard
│   │   ├── services/
│   │   │   ├── agents.py             # LangGraph analysis workflow
│   │   │   ├── ats.py                # Resume and job-description scoring
│   │   │   ├── parsing.py            # Document extraction and text chunking
│   │   │   ├── rag.py                # Retrieval and reranking
│   │   │   ├── llm.py                # Ollama model calls
│   │   │   ├── interview.py          # Questions and answer evaluation
│   │   │   ├── guardrails.py         # Input checks and output cleaning
│   │   │   ├── hallucination.py      # Lexical evidence-overlap heuristic
│   │   │   └── monitor.py            # Activity and latency events
│   │   ├── main.py                   # API entry point and CORS setup
│   │   ├── config.py                 # Environment-based configuration
│   │   ├── db.py                     # Database connection
│   │   ├── models.py                 # Database models
│   │   ├── schemas.py                # Request schemas
│   │   ├── security.py               # Password hashing and JWT helpers
│   │   └── seed.py                   # Built-in career knowledge
│   ├── tests/test_core.py            # Scoring, guardrail, retrieval tests
│   ├── .env.example
│   ├── Dockerfile
│   └── requirements.txt
├── fine_tuning/                      # Optional experiment notes and sample data
│   ├── data/sample.jsonl
│   └── README.md
├── docs/images/                      # README preview image
├── .gitignore                        # Excludes secrets and local runtime files
├── docker-compose.yml
├── setup_windows.ps1                 # Install dependencies and create configuration
├── run_windows.ps1                   # Seed knowledge and launch local services
├── GITHUB_SETUP.md                   # Repository upload and deployment notes
└── README.md
```

Local environments, dependencies, database files, uploaded documents, logs, and build output are excluded from version control.

## How it works

1. **Add context:** Provide your resume and a target job description.
2. **Compare:** Extract requirements and calculate a skill and keyword match.
3. **Retrieve:** Combine semantic and keyword results from shared knowledge and the user's indexed notes.
4. **Plan:** Generate seven focused preparation days using the resume, job requirements, and retrieved context.
5. **Practice:** Start an interview or ask the career coach for a specific next step.

The backend's analysis workflow is:

```text
Resume + job description
          ↓
      Match scoring
          ↓
     Skill gap analysis
          ↓
    Knowledge retrieval
          ↓
     Seven-day plan
          ↓
   Evidence-overlap check
```

## Local setup

### Prerequisites

- Python **3.12** for the supplied Windows setup script.
- Node.js **20.19+** or **22.12+**, with npm.
- [Ollama](https://ollama.com/) installed and running.
- Git, if cloning the repository.
- Around **8 GB RAM** as a starting point for the default small model; actual requirements and response times depend on your machine.

The first use can download embedding and reranking models.

### Quick start on Windows

Clone the repository and install the application dependencies:

```powershell
git clone https://github.com/pallavivhalgade/CareerPilotAI.git
cd CareerPilotAI
powershell -ExecutionPolicy Bypass -File .\setup_windows.ps1
```

Download the default language model:

```powershell
ollama pull llama3.2:3b
```

Keep Ollama running, then launch CareerPilot:

```powershell
powershell -ExecutionPolicy Bypass -File .\run_windows.ps1
```

| Service | Local URL |
| --- | --- |
| Frontend | http://localhost:5173 |
| API documentation | http://localhost:8000/docs |
| API health | http://localhost:8000/health |

The launcher runs both services in the background and prints their process IDs. Startup output is written to `logs/`.

### Manual setup

Run the backend from one PowerShell terminal:

```powershell
cd backend
py -3.12 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
if (!(Test-Path .env)) { Copy-Item .env.example .env }
.\.venv\Scripts\python.exe -m app.seed
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload
```

From the repository root, start the frontend in another terminal:

```powershell
cd frontend
npm.cmd ci
npm.cmd run dev
```

To explore only the frontend preview, you can run the frontend commands without starting the backend.

## Configuration

Copy `backend/.env.example` to `backend/.env`. The setup script does this automatically when the file is missing.

| Variable | Purpose | Default |
| --- | --- | --- |
| `SECRET_KEY` | JWT signing key; replace the placeholder with a unique secret | `change-me` |
| `DATABASE_URL` | SQLAlchemy database connection | `sqlite:///./careerpilot.db` |
| `CORS_ORIGINS` | Comma-separated frontend origins allowed by the API | `http://localhost:5173` |
| `OLLAMA_BASE_URL` | Ollama server address | `http://localhost:11434` |
| `OLLAMA_MODEL` | Model used for inference | `llama3.2:3b` |
| `EMBEDDING_MODEL` | Semantic retrieval model | `sentence-transformers/all-MiniLM-L6-v2` |
| `RERANK_MODEL` | CrossEncoder reranking model | `cross-encoder/ms-marco-MiniLM-L-6-v2` |
| `CHROMA_DIR` | Local vector-store directory | `./chroma_data` |
| `MAX_INPUT_CHARS` | Backend input length limit | `50000` |

Optional frontend settings are documented in `frontend/.env.example`:

- **`VITE_API_URL`:** API base URL for a separately hosted backend, including any required base path.
- **`VITE_API_PROXY_TARGET`:** Backend proxy target during Vite development and preview; defaults to `http://127.0.0.1:8000`.

Without `VITE_API_URL`, browser requests use `/api`. Vite strips that prefix and forwards requests to FastAPI locally.

Model-provider secrets belong in backend configuration. Values starting with `VITE_` are exposed in the browser bundle. The current inference adapter uses Ollama; adding a cloud-provider key alone does not change that.

## Deployment

### Live frontend

**https://careerpilot-ai-three-virid.vercel.app**

### Vercel build settings

Connect this repository to the existing CareerPilot AI project, or import it into your own Vercel account:

| Setting | Value |
| --- | --- |
| Root directory | `frontend` |
| Framework preset | Vite |
| Install command | `npm ci` |
| Build command | `npm run build` |
| Output directory | `dist` |

`frontend/vercel.json` provides an index-page fallback for client routes.

### Enable the backend in a hosted deployment

1. Host FastAPI at a public HTTPS address.
2. Make Ollama reachable from that backend, or implement an adapter for a hosted language model.
3. Provide persistent storage for the database and Chroma data.
4. Set a unique backend `SECRET_KEY` and add the deployed frontend origin to `CORS_ORIGINS`.
5. Set `VITE_API_URL` in Vercel to the backend's API base URL, then redeploy the frontend.

The Vercel frontend cannot use Ollama running only on a visitor's laptop. The current local storage and model architecture needs the hosting arrangements above for a complete online service.

## Verification

### Frontend

```powershell
cd frontend
npm.cmd ci
npx.cmd playwright install chromium
npm.cmd test
npm.cmd run build
```

To use an installed Google Chrome instead of downloading Chromium:

```powershell
$env:PLAYWRIGHT_CHANNEL = 'chrome'
npm.cmd test
```

Browser checks cover desktop and mobile layouts, typography, accessibility, preview navigation, authentication, document uploads, interview and chat API contracts, reduced motion, and safe rendering of generated text. Most API responses are mocked.

The live backend health checks are optional:

```powershell
$env:CAREERPILOT_LIVE_API = '1'
npm.cmd test
```

### Backend

After installing the backend requirements:

```powershell
cd backend
.\.venv\Scripts\python.exe -m pytest tests -q
```

Backend tests cover deterministic scoring, input checks, and retrieval visibility. These checks do not evaluate the quality of every model-generated response.

## Troubleshooting

| Problem | Check |
| --- | --- |
| The preview works, but signup fails on Vercel | Configure a reachable backend with `VITE_API_URL` and the correct CORS origin. |
| The local backend does not start | Check `logs/backend.err.log`, the Python environment, and dependency installation. |
| Model responses are slow or fail | Confirm Ollama is running and the configured model has been downloaded. |
| Port 5173 is already in use | Stop the existing development server before launching another. |
| Playwright cannot find a browser | Install Chromium or set `PLAYWRIGHT_CHANNEL=chrome`. |

## Scope and limitations

- Match scores are heuristics for preparation, not hiring predictions.
- The evidence-overlap check measures lexical overlap; it does not prove factual accuracy.
- Preview analysis uses keyword matching, and preview interview and coach responses are examples.
- Model quality and speed depend on the configured model and hardware.
- `fine_tuning/` contains optional experiment notes and sample data; it is not required for the application and does not establish that training has been run.

## Credits

Built by [Pallavi Vhalgade](https://github.com/pallavivhalgade).

DM Sans and Instrument Serif are distributed under the SIL Open Font License. Their license files are included in [`frontend/public/licenses/`](frontend/public/licenses/).
