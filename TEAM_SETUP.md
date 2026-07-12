# FusionMind Team Setup

## 1. Requirements

- Python 3.11
- Node.js 18+
- Docker Desktop
- A personal Groq API key

## 2. Environment

The shared `.env` already contains the common project configuration and model names.
Each teammate must set only their own Groq key:

```env
GROQ_API_KEY=your_personal_groq_key
```

If the optional planner is enabled, also set:

```env
PLANNER_GROQ_API_KEY=your_personal_planner_groq_key
```

Never commit or resend a `.env` containing real keys.

## 3. Python environment (Git Bash)

```bash
python -m venv .venv
source .venv/Scripts/activate
python -m pip install --upgrade pip
pip install -r requirements.txt
```

## 4. Databases and data

```bash
docker compose up -d neo4j weaviate
export PYTHONPATH=backend
python scripts/build_neo4j_graph.py --processed data/processed --seed data/seed --neo4j-dir neo4j --with-schema
python scripts/ingest_rag_documents.py --full
```

## 5. Backend

```bash
export PYTHONPATH=backend
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

## 6. Frontend (new Git Bash window)

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000.

Demo login:

```text
Email: mohammed@example.com
Password: FusionMind@2026
```
