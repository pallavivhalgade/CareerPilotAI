# CareerPilot AI

A career preparation workspace for resume matching, interview practice, and personalized next steps.

**[View Live Demo](https://careerpilot-ai-three-virid.vercel.app)**

![CareerPilot AI preview](docs/images/careerpilot-preview.png)

<a id="system-architecture"></a>
## 🏗️ System Architecture

The repository contains separate frontend account endpoints and a Python AI backend. The React interface can show sample data; the complete AI workflow needs the configured FastAPI service, retrieval store, and Ollama model. The diagram separates these paths rather than implying that all AI services run inside a Vercel function.

```mermaid
flowchart TD
    U["Resume, job description and practice answers"] --> UI["React workspace"]
    UI --> DEMO["Sample-data browsing mode"]
    UI --> AUTH["Vercel account API"]
    AUTH --> SQL["Configured SQL account storage"]
    UI -. "configured API URL" .-> API["FastAPI backend"]
    API --> GRAPH["LangGraph analysis and preparation workflow"]
    API --> DB["SQLAlchemy application database"]
    GRAPH --> RAG["Chroma and BM25 retrieval with reranking"]
    RAG --> LLM["Ollama model via LangChain"]
    LLM --> RESULT["Grounded plans and coaching responses"]
    RESULT --> API
    API --> UI
    class U entry
    class UI,API,GRAPH,RAG process
    class AUTH,SQL,DB,LLM system
    class DEMO,RESULT output
    classDef entry fill:#EAF2FF,stroke:#5275AD,color:#1E3556
    classDef process fill:#F0EBFA,stroke:#8870B2,color:#3B2856
    classDef system fill:#FFF2DA,stroke:#AA8440,color:#51401E
    classDef output fill:#E3F4EC,stroke:#4C8A72,color:#234C3B
    classDef pending fill:#F8E9E7,stroke:#AD706A,color:#653C37,stroke-dasharray:5 5
```

<details>
<summary><strong>Follow the implementation</strong></summary>

| Stage | Source |
| --- | --- |
| Frontend API configuration | [frontend/src/lib/api.js](frontend/src/lib/api.js) |
| Account API | [frontend/server/auth.js](frontend/server/auth.js) |
| AI endpoints | [backend/app/routers/core.py](backend/app/routers/core.py) |
| Agent workflow | [backend/app/services/agents.py](backend/app/services/agents.py) |
| Retrieval implementation | [backend/app/services/rag.py](backend/app/services/rag.py) |
| Local model integration | [backend/app/services/llm.py](backend/app/services/llm.py) |

</details>

## Features

- **Resume analysis** — Compare your experience with a job description and identify skill gaps.
- **Preparation plans** — Get a focused seven-day learning plan.
- **Interview practice** — Answer role-specific questions and review feedback.
- **Career coach** — Ask questions using your resume and target role as context.

## Tech Stack

React · Vite · FastAPI · SQLite · Ollama · LangChain · LangGraph · ChromaDB · BM25

## Project Structure

```text
CareerPilotAI/
├── frontend/             # React interface, Vercel account API, and tests
├── backend/              # API, AI workflows, and backend tests
├── docs/                 # Preview image
├── fine_tuning/          # Optional experiment notes
├── setup_windows.ps1     # Install dependencies
├── run_windows.ps1       # Start local services
└── docker-compose.yml    # Local Docker configuration
```

## Run Locally

Requires **Python 3.12**, **Node.js 22.12+**, and **Ollama**. Keep Ollama running.

```powershell
git clone https://github.com/pallavivhalgade/CareerPilotAI.git
cd CareerPilotAI
powershell -ExecutionPolicy Bypass -File .\setup_windows.ps1
ollama pull llama3.2:3b
powershell -ExecutionPolicy Bypass -File .\run_windows.ps1
```

**App:** http://localhost:5173 · **API docs:** http://localhost:8000/docs

Configuration examples: [backend](backend/.env.example) · [frontend](frontend/.env.example).

## Deployment

The frontend is hosted on **Vercel**. Use `frontend` as the root directory, `npm run build` as the build command, and `dist` as the output directory.

Hosted accounts use Neon Postgres (`DATABASE_URL`) and a server-only `SECRET_KEY`. AI features still require a connected Python backend; preview mode uses sample data.

---

Built by [Pallavi Vhalgade](https://github.com/pallavivhalgade).

---

## About the developer

Built by **Pallavi Vholgade**. Explore my AI / ML projects, experience, and skills in my [portfolio](https://pallavi-portfolio-preview.vercel.app).

[LinkedIn](https://www.linkedin.com/in/pallavi-vholgade-05565b24b) · [Email](mailto:pallavivhalgade@gmail.com)
