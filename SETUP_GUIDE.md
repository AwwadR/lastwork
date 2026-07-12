# FusionMind — Complete Setup Guide

> **Authoritative 2026 monitoring/evaluation note:** historical example scores
> later in this document are illustrative, not verified results. The canonical
> workflow below supersedes older data-pipeline and full-stack examples.

## Canonical Monitoring and Evaluation Workflow

### Data pipeline

Keep cleaned Olist data separate from the application-schema output.

```powershell
python scripts\clean_data.py --raw data\raw --out data\cleaned
python scripts\prepare_full_dataset.py `
  --source data\cleaned `
  --output data\processed `
  --anchor-date 2026-07-11
python scripts\generate_support_layer.py --processed data\processed --rules business_rules.yaml --out data\seed
```

```bash
python scripts/clean_data.py --raw data/raw --out data/cleaned
python scripts/prepare_full_dataset.py --source data/cleaned --output data/processed --anchor-date 2026-07-11
python scripts/generate_support_layer.py --processed data/processed --rules business_rules.yaml --out data/seed
```

Choose an appropriate fixed anchor date for reproducible fixtures. Automated
tests use temporary directories and do not overwrite current processed data.

### Host workflow

```powershell
docker compose up -d neo4j weaviate
$env:PYTHONPATH="backend"
python scripts\build_neo4j_graph.py --processed data\processed --seed data\seed --neo4j-dir neo4j --with-schema
python scripts\ingest_rag_documents.py
cd backend
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

In another terminal: `cd frontend`, `npm install`, then `npm run dev`.

### Docker and monitoring workflow

```powershell
docker compose up --build -d neo4j weaviate backend frontend prometheus grafana
Invoke-RestMethod http://localhost:8000/health
Invoke-RestMethod http://localhost:8000/ready
Invoke-WebRequest http://localhost:9090/-/ready -UseBasicParsing
Invoke-WebRequest http://localhost:3001/api/health -UseBasicParsing
```

Prometheus is exposed on port 9090 and Grafana on port 3001. Configuration
files alone are not evidence that either service is healthy; verify the endpoints.

### Tests and evaluation

```powershell
python -m pytest
python -m eval.run_eval `
  --base-url http://localhost:8000 `
  --fixtures eval `
  --json-output eval\reports\results.json `
  --markdown-output eval\reports\report.md
```

```bash
python -m pytest
python -m eval.run_eval --base-url http://localhost:8000 --fixtures eval \
  --json-output eval/reports/results.json --markdown-output eval/reports/report.md
```

Offline data/intent/entity checks require no token. Live write evaluation is
deliberately skipped until isolated records are configured. The runner returns
non-zero when a measured required threshold fails.

Stop safely with `docker compose down`. Never use `docker compose down -v`
unless permanent deletion of all persistent volumes is explicitly intended.
Read `neo4j/MIGRATION.md` before applying constraints to an existing database.
## E-commerce AI Customer Support Platform
### group1-team3 · AISPIRE Capstone

---

## Quick Reference

| What | Where |
|------|-------|
| Backend API | http://localhost:8000 |
| API Docs (Swagger) | http://localhost:8000/docs |
| Frontend | http://localhost:3000 |
| Neo4j Browser | http://localhost:7474 |
| Weaviate | http://localhost:18080 |
| Prometheus Metrics | http://localhost:8000/metrics |

---

## Prerequisites

| Tool | Version | Download |
|------|---------|----------|
| Python | ≥ 3.11 | https://python.org |
| Node.js | ≥ 20 LTS | https://nodejs.org |
| Docker Desktop | latest | https://docker.com/products/docker-desktop |
| Git | any | https://git-scm.com |

**PowerShell:**
```powershell
python --version; node --version; docker --version; git --version
```

**Bash:**
```bash
python3 --version && node --version && docker --version && git --version
```

You also need a **Groq API key** (free): https://console.groq.com → API Keys → Create

---

## Step 1 — Get the Project

**PowerShell:**
```powershell
cd fusionmind-platform
```

**Bash:**
```bash
cd fusionmind-platform
```

---

## Step 2 — Environment Variables

**PowerShell:**
```powershell
Copy-Item env.example .env
notepad .env
```

**Bash:**
```bash
cp env.example .env && nano .env
```

Set these values:
```
NEO4J_USER=neo4j
NEO4J_PASSWORD=YourPasswordHere
GROQ_API_KEY=gsk_...
JWT_SECRET=any-long-random-string
WEAVIATE_HTTP_PORT=18080
```

> Keep `.env` in the **project root** (same folder as docker-compose.yml).
> Also copy it to `backend/` if running uvicorn from inside that folder.

---

## Step 3 — Python Virtual Environment

**PowerShell:**
```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

> If you get an execution policy error:
> ```powershell
> Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
> ```

**Bash:**
```bash
python3 -m venv .venv
source .venv/bin/activate
```

---

## Step 4 — Install Python Dependencies

**PowerShell:**
```powershell
pip install --upgrade pip
pip install -r requirements.txt
```

**Bash:**
```bash
pip install --upgrade pip && pip install -r requirements.txt
```

---

## Step 5 — Start Docker Services

Make sure Docker Desktop is running:

**PowerShell:**
```powershell
docker compose up -d neo4j weaviate
Start-Sleep -Seconds 30
docker compose ps
```

**Bash:**
```bash
docker compose up -d neo4j weaviate && sleep 30 && docker compose ps
```

Both services must show **healthy**.

Verify:

**PowerShell:**
```powershell
Invoke-WebRequest -Uri "http://localhost:7474" -UseBasicParsing | Select-Object StatusCode
Invoke-WebRequest -Uri "http://localhost:18080/v1/.well-known/ready" -UseBasicParsing | Select-Object Content
```

**Bash:**
```bash
curl -s http://localhost:7474 | head -3
curl -s http://localhost:18080/v1/.well-known/ready
```

Weaviate returns `{}` when ready.

> ⚠️ Weaviate uses port **18080** (HTTP) and **50051** (gRPC). Both must be open.
> `WeaviateGRPCUnavailableError` means port 50051 is blocked by a firewall.

---

## Step 6 — Place Dataset Files

**PowerShell:**
```powershell
New-Item -ItemType Directory -Force -Path data\raw
Copy-Item C:\path\to\olist_customers_dataset.csv      data\raw\
Copy-Item C:\path\to\olist_orders_dataset.csv          data\raw\
Copy-Item C:\path\to\olist_order_items_dataset.csv     data\raw\
Copy-Item C:\path\to\olist_products_dataset.csv        data\raw\
Copy-Item C:\path\to\olist_order_payments_dataset.csv  data\raw\
```

**Bash:**
```bash
mkdir -p data/raw
cp /path/to/olist_*.csv data/raw/
```

Required columns per file:

| File | Required columns |
|------|-----------------|
| customers | customer_id, customer_name, customer_email, customer_password_hash |
| orders | order_id, customer_id, order_status, order_purchase_date, estimated_delivery_date, delivered_date |
| products | product_id, product_name, product_category, price |
| order_items | order_id, product_id, quantity, unit_price, shipping_cost |
| payments | payment_id, order_id, payment_method, payment_status, payment_amount, payment_date |

---

## Step 7 — Data Pipeline

### 7a — Clean Data

**PowerShell:**
```powershell
python scripts\clean_data.py --raw data\raw --out data\processed
```

**Bash:**
```bash
python scripts/clean_data.py --raw data/raw --out data/processed
```

### 7b — Generate Support Layer (tickets, requests, payment issues)

**PowerShell:**
```powershell
python scripts\generate_support_layer.py `
  --processed data\processed `
  --rules business_rules.yaml `
  --out data\seed
```

**Bash:**
```bash
python scripts/generate_support_layer.py \
  --processed data/processed \
  --rules business_rules.yaml \
  --out data/seed
```

---

## Step 8 — Build the Neo4j Graph

**PowerShell:**
```powershell
python scripts\build_neo4j_graph.py `
  --processed data\processed `
  --seed data\seed `
  --neo4j-dir neo4j `
  --with-schema
```

**Bash:**
```bash
python scripts/build_neo4j_graph.py \
  --processed data/processed \
  --seed data/seed \
  --neo4j-dir neo4j \
  --with-schema
```

Verify in Neo4j Browser (http://localhost:7474 — neo4j / your_password):
```cypher
MATCH (n) RETURN labels(n), count(n) ORDER BY count(n) DESC
```

---

## Step 9 — RAG Ingestion (Policy Documents)

**First run downloads BGE-M3 (~1.1 GB) — normal, only happens once.**

**PowerShell:**
```powershell
python scripts\ingest_rag_documents.py
```

**Bash:**
```bash
python scripts/ingest_rag_documents.py
```

To force full rebuild:

**PowerShell:**
```powershell
python scripts\ingest_rag_documents.py --full
```

**Bash:**
```bash
python scripts/ingest_rag_documents.py --full
```

---

## Step 10 — Start the Backend

Open a **new terminal**, activate venv, then:

**PowerShell:**
```powershell
.\.venv\Scripts\Activate.ps1
cd backend
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

**Bash:**
```bash
source .venv/bin/activate
cd backend
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Verify health:

**PowerShell:**
```powershell
Invoke-WebRequest -Uri "http://localhost:8000/health" -UseBasicParsing | Select-Object -ExpandProperty Content
```

**Bash:**
```bash
curl -s http://localhost:8000/health | python3 -m json.tool
```

Expected: `{"status": "healthy", "services": {"neo4j": "ok", "weaviate": "ok"}}`

---

## Step 11 — Start the Frontend

Open **another new terminal**:

**PowerShell:**
```powershell
cd frontend
npm install
npm run dev
```

**Bash:**
```bash
cd frontend && npm install && npm run dev
```

Open http://localhost:3000

---

## Step 12 — Register and Login

### Register a customer account

**PowerShell:**
```powershell
$body = @{customer_id="CUST001"; email="demo@fusionmind.com"; password="demo123"} | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:8000/auth/register" -Method POST -ContentType "application/json" -Body $body
```

**Bash:**
```bash
curl -s -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"customer_id":"CUST001","email":"demo@fusionmind.com","password":"demo123"}'
```

### Login and save token

**PowerShell:**
```powershell
$body = @{email="demo@fusionmind.com"; password="demo123"} | ConvertTo-Json
$TOKEN = (Invoke-RestMethod -Uri "http://localhost:8000/auth/login" -Method POST -ContentType "application/json" -Body $body).access_token
Write-Host "Token saved: $($TOKEN.Substring(0,20))..."
```

**Bash:**
```bash
TOKEN=$(curl -s -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@fusionmind.com","password":"demo123"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])")
echo "Token: ${TOKEN:0:20}..."
```

### Register a staff account (for Dashboard)

**PowerShell:**
```powershell
$body = @{customer_id="staff-001"; email="staff@fusionmind.com"; password="staff123"; role="staff"} | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:8000/auth/register" -Method POST -ContentType "application/json" -Body $body
```

**Bash:**
```bash
curl -s -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"customer_id":"staff-001","email":"staff@fusionmind.com","password":"staff123","role":"staff"}'
```

---

## Step 13 — Test the Chat (Single Turn)

**PowerShell:**
```powershell
$headers = @{Authorization="Bearer $TOKEN"; "Content-Type"="application/json"}
$body = @{message="What is your refund policy?"; history=@()} | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:8000/chat" -Method POST -Headers $headers -Body $body | ConvertTo-Json -Depth 5
```

**Bash:**
```bash
curl -s -X POST http://localhost:8000/chat \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message":"What is your refund policy?","history":[]}' \
  | python3 -m json.tool
```

---

## Step 14 — Test Multi-Turn Conversation

The system remembers context across turns via the history field.

**Bash:**
```bash
# Turn 1 — mention damaged laptop
RESP1=$(curl -s -X POST http://localhost:8000/chat \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message":"My laptop arrived damaged","history":[]}')
echo "Turn 1 intent: $(echo $RESP1 | python3 -c "import sys,json;d=json.load(sys.stdin);print(d['intent'])")"

# Save history from turn 1
HISTORY=$(echo $RESP1 | python3 -c "import sys,json;print(json.dumps(json.load(sys.stdin)['history']))")

# Turn 2 — follow-up, no need to repeat "laptop" or "damaged"
RESP2=$(curl -s -X POST http://localhost:8000/chat \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"message\":\"Can I get a refund for it?\",\"history\":$HISTORY}")
echo "Turn 2 answer: $(echo $RESP2 | python3 -c "import sys,json;print(json.load(sys.stdin)['answer'][:120])")"
```

Turn 2 should understand "it" = laptop, carry forward "damaged" as the issue,
and proceed with a refund request — no repeated questions.

---

## Step 15 — Monitor the System

### Live metrics

**PowerShell:**
```powershell
Invoke-WebRequest -Uri "http://localhost:8000/metrics" -UseBasicParsing | Select-Object -ExpandProperty Content | Select-String "grounding|tools|intent|latency"
```

**Bash:**
```bash
curl -s http://localhost:8000/metrics | grep -E "grounding|tools|intent|latency"
```

After several chat messages:
```
grounding_answered_total 5.0
grounding_passed_total 5.0          ← 5/5 = 100% grounded
intent_detected_total{intent="refund_request"} 2.0
orchestrator_tools_total{tool="rag_policy"} 4.0
orchestrator_tools_total{tool="order_graph"} 5.0
request_latency_seconds_count{path="/chat"} 5.0
```

### Watch live (auto-refresh)

**PowerShell:**
```powershell
while ($true) {
    Clear-Host
    (Invoke-WebRequest -Uri "http://localhost:8000/metrics" -UseBasicParsing).Content | Select-String "grounding|tools|latency_seconds_count"
    Start-Sleep 2
}
```

**Bash:**
```bash
watch -n 2 "curl -s http://localhost:8000/metrics | grep -E 'grounding|tools|latency_count'"
```

---

## Step 16 — Run Evaluation Harness

**PowerShell:**
```powershell
python eval\run_eval.py --base http://localhost:8000 --token $TOKEN --out eval\results.json
```

**Bash:**
```bash
python eval/run_eval.py \
  --base http://localhost:8000 \
  --token "$TOKEN" \
  --out eval/results.json
```

Expected summary:
```
=== EVALUATION RESULTS ===
Criterion 1 — Grounded Policy Response Rate:  0.943 ± 0.012  (target >= 0.92)
Criterion 2 — Neo4j Customer-Fact Accuracy:   0.967 ± 0.005  (target >= 0.95)
Criterion 3 — Intent Detection F1:            0.917 ± 0.008  (target >= 0.90)
Criterion 4 — p95 latency:  1.84s  (target <= 2.5s)
              error rate:   0.000%  (target < 1%)
```

---

## Useful Commands

### Full reset (wipe all data and rebuild)

**PowerShell:**
```powershell
docker compose down -v
docker compose up -d neo4j weaviate
Start-Sleep -Seconds 30
python scripts\build_neo4j_graph.py --processed data\processed --seed data\seed --neo4j-dir neo4j --with-schema
python scripts\ingest_rag_documents.py --full
```

**Bash:**
```bash
docker compose down -v
docker compose up -d neo4j weaviate
sleep 30
python scripts/build_neo4j_graph.py --processed data/processed --seed data/seed --neo4j-dir neo4j --with-schema
python scripts/ingest_rag_documents.py --full
```

### Run all via Docker Compose (production-like)

**PowerShell:**
```powershell
docker compose up --build -d
docker compose logs -f
docker compose down
```

**Bash:**
```bash
docker compose up --build -d
docker compose logs -f
docker compose down
```

### Re-run after editing a policy file

**PowerShell:**
```powershell
python scripts\ingest_rag_documents.py
```

**Bash:**
```bash
python scripts/ingest_rag_documents.py
```

Only changed sections are re-embedded. The manifest in
`vector_store/pipeline_storage/manifest.json` tracks hashes.

### Useful Neo4j Browser queries

```cypher
-- All node counts
MATCH (n) RETURN labels(n), count(n) ORDER BY count(n) DESC

-- Customer 360 view
MATCH (c:Customer {customer_id: "CUST001"})
OPTIONAL MATCH (c)-[:PLACED]->(o:Order)
OPTIONAL MATCH (c)-[:HAS_TICKET]->(t:Ticket)
OPTIONAL MATCH (c)-[:HAS_REQUEST]->(s:ServiceRequest)
RETURN c, o, t, s

-- All open tickets
MATCH (t:Ticket {status: "open"}) RETURN t LIMIT 20

-- All service requests by type
MATCH (s:ServiceRequest) RETURN s.type, count(s) ORDER BY count(s) DESC
```

---

## Troubleshooting

### `AuthenticationRateLimit` on Neo4j
```powershell
# PowerShell
docker compose down neo4j; docker compose up -d neo4j; Start-Sleep 30
```
```bash
# Bash
docker compose down neo4j && docker compose up -d neo4j && sleep 30
```
Ensure NEO4J_PASSWORD in `.env` matches NEO4J_AUTH in `docker-compose.yml`.

### `WeaviateGRPCUnavailableError`
Port 50051 is blocked. Check Docker Desktop is running, check Windows Firewall,
ensure `50051:50051` is in docker-compose.yml under weaviate ports.

### `ModuleNotFoundError` when running scripts
Run from **project root** (where `business_rules.yaml` is), not from `backend/`:
```powershell
cd C:\path\to\fusionmind-platform
python scripts\build_neo4j_graph.py ...
```

### `.env` not being read by uvicorn
Copy `.env` to the `backend/` directory:
```powershell
Copy-Item .env backend\.env
```
```bash
cp .env backend/.env
```

### BGE-M3 download takes very long
Normal — 1.1 GB, one-time download cached in `~/.cache/huggingface/`.

### PowerShell execution policy error
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Frontend "Network Error"
Ensure backend is running on port 8000 and `next.config.js` rewrites
`/api/*` to `http://localhost:8000/*`.

---

## Project Structure Reference

```
fusionmind-platform/
├── .env                          # your secrets (copy from env.example)
├── business_rules.yaml           # single source of truth for all rule numbers
├── docker-compose.yml            # Neo4j + Weaviate (port 18080) + backend + frontend
├── requirements.txt
├── env.example
│
├── data/
│   ├── raw/                      # place your 5 CSV files here
│   ├── processed/                # output of clean_data.py
│   ├── seed/                     # output of generate_support_layer.py
│   └── policies/                 # 7 policy .md files (RAG source)
│
├── scripts/
│   ├── clean_data.py             # step 7a
│   ├── generate_support_layer.py # step 7b (uses customer_id)
│   ├── build_neo4j_graph.py      # step 8 (new dataset schema)
│   └── ingest_rag_documents.py   # step 9
│
├── backend/app/
│   ├── main.py
│   ├── config/settings.py        # reads .env (weaviate_http_port=18080)
│   ├── auth/                     # JWT with customer_id, login/register/login-by-id
│   ├── api/routes_chat.py        # accepts history, returns updated history
│   ├── agents/orchestrator/      # state has conversation_history
│   │   ├── intent_detector.py    # uses history for ambiguous follow-ups
│   │   └── entity_extractor.py   # inherits entities from history
│   ├── agents/action/            # all handlers use customer_id
│   ├── agents/order_graph/       # all queries scoped by customer_id
│   └── graph/cypher_templates.py # updated for new schema + Payment node
│
├── frontend/src/
│   ├── components/ChatBox.tsx    # stores history, sends it with each request
│   └── lib/api.ts                # chat() sends history, receives updated history
│
├── eval/
│   ├── heldout.jsonl             # 60 test scenarios
│   └── run_eval.py               # 4-criterion evaluation harness
│
└── vector_store/
    └── pipeline_storage/         # hash manifest for incremental re-ingestion
```
