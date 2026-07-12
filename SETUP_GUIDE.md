# LastWork — Full Team Setup Guide

This guide explains how to safely clone, configure, run, test, monitor, and contribute to the project.

> Keep the GitHub repository **Private**.
> Never commit `.env`, API keys, passwords, tokens, local databases, downloaded models, or Docker volume data.

---

## 1. Project Overview

This project is an **Agentic AI E-commerce Support Platform** that combines:

- **FastAPI** backend
- **Next.js** frontend
- **Neo4j** Knowledge Graph
- **Weaviate** Vector Database
- **BGE-M3** embedding model
- **Groq LLM**
- **Prometheus** monitoring
- **Grafana** dashboards
- **Pytest** automated tests
- A custom **evaluation pipeline**

The system supports policy questions, order tracking, refunds, returns, replacements, warranty claims, cancellation requests, payment issues, and support-ticket tracking.

---

## 2. Repository

Repository name:

```text
lastwork
```

Repository visibility:

```text
Private
```

Clone URL format:

```text
https://github.com/YOUR_GITHUB_USERNAME/lastwork.git
```

Replace `YOUR_GITHUB_USERNAME` with the repository owner's GitHub username.

---

## 3. Prerequisites

Install:

- Git
- Docker Desktop
- Docker Compose
- Python 3.11
- Git Bash or PowerShell
- A modern browser

Verify:

```bash
git --version
docker --version
docker compose version
python --version
```

Expected Python version:

```text
Python 3.11.x
```

Docker Desktop must be fully running before any Docker command is used.

---

## 4. Accept the Repository Invitation

Because the repository is private, every team member must accept the GitHub collaborator invitation before cloning.

Then clone the repository.

### Git Bash

```bash
git clone https://github.com/YOUR_GITHUB_USERNAME/lastwork.git
cd lastwork
```

### PowerShell

```powershell
git clone https://github.com/YOUR_GITHUB_USERNAME/lastwork.git
Set-Location lastwork
```

---

## 5. Project Structure

```text
lastwork/
├── backend/
├── frontend/
├── data/
├── eval/
├── monitoring/
├── neo4j/
├── scripts/
├── tests/
├── .dockerignore
├── .env.example
├── .gitignore
├── business_rules.yaml
├── docker-compose.yml
├── requirements.txt
└── SETUP_GUIDE.md
```

| Path | Purpose |
|---|---|
| `backend/` | FastAPI API, agents, authentication, orchestration, RAG, and monitoring |
| `frontend/` | Next.js user interface |
| `data/` | Seed and project data |
| `eval/` | Evaluation fixtures, runner, and reports |
| `monitoring/` | Prometheus and Grafana configuration |
| `neo4j/` | Neo4j schema, constraints, and graph scripts |
| `scripts/` | Data-loading and utility scripts |
| `tests/` | Unit and integration tests |

---

## 6. Environment Configuration

The real `.env` file is not stored in Git.

Create it from the example.

### Git Bash

```bash
cp .env.example .env
```

### PowerShell

```powershell
Copy-Item .env.example .env
```

Open `.env` and fill in the required values.

Example:

```env
GROQ_API_KEY=
PLANNER_GROQ_API_KEY=

NEO4J_URI=bolt://neo4j:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=

WEAVIATE_URL=http://weaviate:8080

JWT_SECRET=
JWT_ALGORITHM=HS256

EMBEDDING_MODEL=BAAI/bge-m3
EMBEDDING_DEVICE=cpu

PLANNER_MODEL=llama-3.3-70b-versatile
```

Use the exact variable names already present in `.env.example`.

Never put real secrets inside `.env.example`.

Verify that `.env` is ignored:

```bash
git check-ignore .env
git ls-files .env
```

Expected result:

- `git check-ignore .env` prints `.env`
- `git ls-files .env` prints nothing

---

## 7. Secret Sharing

Share secrets only through a secure private channel.

Do not share secrets through:

- GitHub commits
- Pull Requests
- Issue comments
- Public chats
- Screenshots
- Documentation files

If a secret is accidentally pushed, revoke and rotate it immediately.

---

## 8. Start the Full Project

From the repository root:

```bash
docker compose up -d --build
```

This starts:

- Backend
- Frontend
- Neo4j
- Weaviate
- Prometheus
- Grafana

Check all services:

```bash
docker compose ps
```

Expected status:

```text
Up
healthy
```

---

## 9. First Backend Startup

The first startup may take longer because `BAAI/bge-m3` may need to download and initialize.

Monitor backend logs:

```bash
docker compose logs -f backend
```

Wait for:

```text
Embedding model ready.
Application startup complete.
```

Press:

```text
Ctrl + C
```

This stops log streaming only. It does not stop the container.

The Hugging Face cache is stored in a Docker named volume, so later starts should be faster.

---

## 10. Service URLs

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| FastAPI Swagger Docs | http://localhost:8000/docs |
| Health Check | http://localhost:8000/health |
| Readiness Check | http://localhost:8000/ready |
| Metrics Endpoint | http://localhost:8000/metrics |
| Neo4j Browser | http://localhost:7474 |
| Weaviate | http://localhost:18080 |
| Prometheus | http://localhost:9090 |
| Grafana | http://localhost:3001 |

Grafana default login may be:

```text
Username: admin
Password: admin
```

Grafana may ask for a password change on first login.

---

## 11. Verify the Backend

### Git Bash

```bash
curl http://localhost:8000/health
curl http://localhost:8000/ready
```

Expected:

- `/health` returns HTTP `200`
- `/ready` returns HTTP `200`
- Neo4j and Weaviate are ready

Open Swagger:

```text
http://localhost:8000/docs
```

---

## 12. Verify the Frontend

Open:

```text
http://localhost:3000
```

Then:

1. Register or sign in.
2. Open Chat.
3. Send a supported request.

Examples:

```text
What is the refund policy?
```

```text
Where is my order?
```

```text
I want to return order ORD000145.
```

Monitor backend logs:

```bash
docker compose logs -f backend
```

---

## 13. Start Selected Services

Backend, Prometheus, and Grafana:

```bash
docker compose up -d backend prometheus grafana
```

Frontend only:

```bash
docker compose up -d frontend
```

Neo4j and Weaviate:

```bash
docker compose up -d neo4j weaviate
```

---

## 14. Monitoring

### Backend Metrics

```text
http://localhost:8000/metrics
```

### Prometheus

```text
http://localhost:9090
```

Targets:

```text
http://localhost:9090/targets
```

The backend target should show:

```text
UP
```

### Grafana

```text
http://localhost:3001
```

Open the provisioned dashboard and refresh it after generating application traffic.

Generate sample metrics:

```bash
curl http://localhost:8000/health
curl http://localhost:8000/ready
curl http://localhost:8000/metrics
```

---

## 15. Monitoring Commands

View monitoring logs:

```bash
docker compose logs -f backend prometheus grafana
```

Recent backend logs:

```bash
docker compose logs backend --tail 100
```

Recent chat activity:

```bash
docker compose logs backend --since 10m | grep -E 'POST /chat|tools_used|orchestrator_outcome|latency_ms'
```

Check embedding-model load count:

```bash
docker compose logs backend --since 20m | grep -c "Loading SentenceTransformer model"
```

Expected with one Uvicorn worker:

```text
1
```

---

## 16. Local Python Environment

Docker is enough to run the app, but a local Python environment is useful for tests and evaluation.

### Git Bash

```bash
python -m venv .venv
source .venv/Scripts/activate
```

### PowerShell

```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
```

Upgrade pip:

```bash
python -m pip install --upgrade pip
```

Install dependencies:

```bash
pip install -r requirements.txt
```

If the project uses a separate backend requirements file:

```bash
pip install -r backend/requirements.txt
```

Deactivate:

```bash
deactivate
```

---

## 17. Run Tests

From the repository root with `.venv` activated.

### Git Bash

```bash
PYTHONPATH="$PWD/backend" python -m pytest   --basetemp="$PWD/.pytest_tmp"   -p no:cacheprovider
```

### PowerShell

```powershell
$env:PYTHONPATH="$PWD\backend"
python -m pytest `
  --basetemp="$PWD\.pytest_tmp" `
  -p no:cacheprovider
```

Expected result:

```text
passed
```

Verified result when this guide was prepared:

```text
116 passed
```

---

## 18. Run Evaluation

The backend must already be running on:

```text
http://localhost:8000
```

### Git Bash

```bash
python -m eval.run_eval   --base-url http://localhost:8000   --fixtures eval   --graph-read-only   --json-output eval/reports/results.json   --markdown-output eval/reports/report.md
```

### PowerShell

```powershell
python -m eval.run_eval `
  --base-url http://localhost:8000 `
  --fixtures eval `
  --graph-read-only `
  --json-output eval/reports/results.json `
  --markdown-output eval/reports/report.md
```

Generated reports:

```text
eval/reports/results.json
eval/reports/report.md
```

Do not change expected labels or lower thresholds simply to make evaluation pass.

---

## 19. Rebuild After Code Changes

Backend changes:

```bash
docker compose build backend
docker compose up -d --force-recreate --no-deps backend
```

Monitor startup:

```bash
docker compose logs -f backend
```

Frontend changes:

```bash
docker compose build frontend
docker compose up -d --force-recreate --no-deps frontend
```

Rebuild everything only when needed:

```bash
docker compose up -d --build
```

---

## 20. Useful Docker Commands

Check services:

```bash
docker compose ps
```

View all logs:

```bash
docker compose logs -f
```

Restart backend:

```bash
docker compose restart backend
```

Stop services without deleting data:

```bash
docker compose stop
```

Start stopped services:

```bash
docker compose start
```

Stop and remove containers while keeping volumes:

```bash
docker compose down
```

Do not use during normal development:

```bash
docker compose down -v
```

The `-v` option can delete:

- Neo4j data
- Weaviate data
- Prometheus data
- Grafana data
- Hugging Face cache

---

## 21. Daily Startup

```bash
cd lastwork
docker compose up -d
docker compose ps
```

Open:

```text
Frontend: http://localhost:3000
Grafana:  http://localhost:3001
```

---

## 22. Daily Shutdown

```bash
docker compose stop
```

Then Docker Desktop can be closed safely.

Start later with:

```bash
docker compose start
```

or:

```bash
docker compose up -d
```

---

## 23. Build the Neo4j Graph

Example:

```bash
python scripts/build_neo4j_graph.py   --processed data/processed   --seed data/seed   --neo4j-dir neo4j   --with-schema
```

Before rebuilding:

- Confirm Neo4j is running.
- Confirm input data exists.
- Confirm `.env` values are correct.
- Do not delete shared data without team approval.

---

## 24. Common Problems

### Docker Desktop is not running

Start Docker Desktop and wait until it is ready.

```bash
docker compose ps
```

### Port already in use

```bash
netstat -ano | findstr :3000
netstat -ano | findstr :8000
netstat -ano | findstr :3001
netstat -ano | findstr :9090
```

| Port | Service |
|---|---|
| 3000 | Frontend |
| 8000 | Backend |
| 3001 | Grafana |
| 9090 | Prometheus |
| 7474 | Neo4j |
| 7687 | Neo4j Bolt |
| 18080 | Weaviate |

### Backend changes are not visible

```bash
docker compose build backend
docker compose up -d --force-recreate --no-deps backend
```

### Frontend cannot connect to backend

Inside Docker, frontend should use:

```text
http://backend:8000
```

Not:

```text
http://localhost:8000
```

inside the frontend container.

### Backend is still starting

```bash
docker compose logs -f backend
```

Wait for:

```text
Embedding model ready.
Application startup complete.
```

### `ModuleNotFoundError: No module named 'app'`

```bash
PYTHONPATH="$PWD/backend" python -m pytest
```

Optional `pytest.ini`:

```ini
[pytest]
pythonpath = backend
testpaths = tests
```

### Pytest temp permission error

```bash
PYTHONPATH="$PWD/backend" python -m pytest   --basetemp="$PWD/.pytest_tmp"   -p no:cacheprovider
```

### Chat returns a generic error

```bash
docker compose logs backend --since 10m 2>&1 | grep -i -A 40 -B 15 -E "POST /chat|traceback|exception|error|planner"
```

### Planner returns HTTP 400

```bash
docker compose logs backend --since 10m | grep -E 'Planner call failed|BadRequestError|fallback'
```

Inspect:

- Planner model
- `response_format`
- Unsupported parameters
- Tool schema
- Reasoning parameters
- Fallback logic

### Prometheus target is DOWN

Open:

```text
http://localhost:9090/targets
```

Then verify:

```bash
curl http://localhost:8000/metrics
docker compose logs prometheus --tail 100
```

### Grafana shows no data

1. Confirm Prometheus target is `UP`.
2. Generate backend requests.
3. Refresh the dashboard.
4. Check the dashboard time range.
5. Review logs:

```bash
docker compose logs grafana --tail 100
```

---

## 25. Git Team Workflow

Do not work directly on `main`.

Before starting:

```bash
git checkout main
git pull origin main
```

Create a branch:

```bash
git checkout -b feature/short-feature-name
```

Examples:

```text
feature/improve-chat-ui
fix/planner-response-loop
test/add-rag-tests
docs/update-setup-guide
```

After editing:

```bash
git status
git add .
git commit -m "Describe the completed change"
git push -u origin feature/short-feature-name
```

Create a Pull Request into:

```text
main
```

---

## 26. Update Your Branch

```bash
git checkout main
git pull origin main
git checkout feature/short-feature-name
git merge main
```

After resolving conflicts:

```bash
git add .
git commit -m "Resolve merge conflicts"
git push
```

---

## 27. Files That Must Never Be Committed

```text
.env
.venv/
venv/
node_modules/
.next/
__pycache__/
.pytest_cache/
.pytest_tmp/
.test-packages/
vector_store/
.huggingface/
*.log
*.pem
*.key
*.db
*.sqlite
*.sqlite3
Docker volume data
Neo4j runtime data
Weaviate runtime data
Downloaded model files
API keys
Passwords
Tokens
Private customer data
```

Before every push:

```bash
git status
git check-ignore .env
git ls-files .env
```

The last command must print nothing.

---

## 28. Recommended `.gitignore`

```gitignore
# Secrets
.env
.env.*
!.env.example
*.pem
*.key

# Python
.venv/
venv/
__pycache__/
*.py[cod]
.pytest_cache/
.pytest_tmp/
.pytest_tmp_*/
.test-packages/
.mypy_cache/
.ruff_cache/

# Frontend
node_modules/
.next/
dist/
build/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Logs and caches
*.log
.cache/
.huggingface/
huggingface_cache/

# Coverage
.coverage
coverage.xml
htmlcov/

# Local databases
*.db
*.sqlite
*.sqlite3

# Generated vector data
vector_store/

# IDE and OS
.vscode/
.idea/
.DS_Store
Thumbs.db
```

---

## 29. First Push by Repository Owner

```bash
git init
git branch -M main
git add .
git commit -m "Initial project setup"
```

Connect to GitHub:

```bash
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/lastwork.git
```

Verify:

```bash
git remote -v
```

Push:

```bash
git push -u origin main
```

---

## 30. Add Team Members

On GitHub:

```text
Repository
→ Settings
→ Collaborators
→ Add people
```

Add each teammate by GitHub username or email.

They must accept the invitation before cloning.

---

## 31. Final Setup Checklist

- [ ] Repository is private
- [ ] Collaborator invitation was accepted
- [ ] Repository was cloned
- [ ] `.env` was created from `.env.example`
- [ ] Required secrets were added locally
- [ ] Docker Desktop is running
- [ ] `docker compose up -d --build` completed
- [ ] Backend reached `Application startup complete`
- [ ] Frontend opens on port `3000`
- [ ] Backend health returns `200`
- [ ] Backend readiness returns `200`
- [ ] Prometheus target is `UP`
- [ ] Grafana dashboard opens
- [ ] Tests pass
- [ ] Evaluation runs
- [ ] Team member works on a separate branch
- [ ] No secrets are tracked by Git

---

## 32. Quick Start

```bash
git clone https://github.com/YOUR_GITHUB_USERNAME/lastwork.git
cd lastwork
cp .env.example .env
docker compose up -d --build
docker compose logs -f backend
```

Wait for:

```text
Embedding model ready.
Application startup complete.
```

Then open:

```text
Frontend:   http://localhost:3000
Backend:    http://localhost:8000
Swagger:    http://localhost:8000/docs
Prometheus: http://localhost:9090
Grafana:    http://localhost:3001
```
