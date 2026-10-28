# TurfBook Python Analytics, Diagnostics & MCP Microservice

A high-performance, asynchronous Python microservice built with **FastAPI**, **Pydantic v2**, **Pandas**, and **Model Context Protocol (MCP)**.

It operates alongside TurfBook's React frontend and Node.js backend as part of a **polyglot microservices architecture**, handling computational, analytical, and operational reliability workloads.

---

## 🌟 Key Capabilities

1. **Dynamic Pricing & Demand Engine (`/api/v1/pricing/quote`):**
   - Heuristic calculation of peak-evening surge (+20%), weekend premium (+15%), weekday off-peak discounts (-25% to fill empty capacity), and inclement weather adjustments for outdoor turfs.
   - Authoritative GST (18%) and subtotal calculations.

2. **Pandas Revenue & Slot Occupancy Engine (`/api/v1/analytics/occupancy-report`):**
   - High-performance data aggregation from raw booking records.
   - Computes hourly utilization distributions, sport-wise revenue share, cancellation churn rates, and business health ratings.

3. **Production Support & Incident Triage Probes (`/api/v1/diagnostics/triage`):**
   - Automated log analysis detecting PostgreSQL GiST exclusion collisions (`23P01` / `409 Conflict`), unhandled HTTP 500 server errors, and database connection pool saturation.
   - Severity classification (`P1_CRITICAL`, `P2_HIGH`, `P3_MEDIUM`, `HEALTHY`) with mapped remediation runbooks.

4. **Model Context Protocol (MCP) Server (`mcp_server/server.py`):**
   - Exposes diagnostic tools (`check_system_health`, `analyze_error_logs`, `quote_slot_pricing`, `triage_booking_incident`) directly to AI agents for automated operational triage.

---

## 🚀 Quickstart & Setup

### 1. Activate Virtual Environment
```bash
# Windows PowerShell
.\python_service\venv\Scripts\Activate.ps1

# Or run directly with venv python:
python_service/venv/Scripts/python.exe
```

### 2. Install Dependencies
```bash
pip install -r python_service/requirements.txt
```

### 3. Run the FastAPI Development Server
```bash
cd python_service
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

* **Interactive Swagger UI:** [http://localhost:8000/docs](http://localhost:8000/docs)
* **ReDoc Documentation:** [http://localhost:8000/redoc](http://localhost:8000/redoc)
* **Liveness Probe:** [http://localhost:8000/api/v1/health/live](http://localhost:8000/api/v1/health/live)

---

## 🧪 Automated Testing (Pytest)

Run the full automated test suite verifying pricing calculations, Pandas dataframes, and log parsing:

```bash
cd python_service
python -m pytest tests/ -v
```

---

## 🛡️ Production Support CLI & Mock Log Triage

Run the standalone log analysis script:

```bash
# Analyze sample production logs
python -m python_service.scripts.analyze_logs --file python_service/sample_production.log
```

---

## 🤖 Model Context Protocol (MCP) Server

To run the MCP server for AI agent integrations:

```bash
python python_service/mcp_server/server.py
```

Exposed MCP Tools:
- `check_system_health`: Real-time system vitals and monitor indicators.
- `analyze_error_logs`: AI-driven log incident triage and error count aggregation.
- `quote_slot_pricing`: Calculates dynamic slot pricing for booking inquiries.
- `triage_booking_incident`: Automated diagnosis of customer payment or booking disputes.

---

## 🎯 Interview Cheat Sheet & Architecture Defense

### 1. Why Did You Choose a Polyglot (Node.js + Python) Architecture?
> *"Node.js and Express excel at high-concurrency I/O and handling real-time slot bookings protected by PostgreSQL GiST exclusion constraints. However, analytical tasks (aggregating thousands of bookings with Pandas) and algorithm-heavy dynamic pricing are CPU-bound and can block the Node.js event loop. Delegating these workloads to an asynchronous FastAPI Python microservice keeps the main booking flow fast and decoupled."*

### 2. How Does This Benefit Both SDE and Production Support?
> *"From a software engineering perspective, it follows clean architecture with Pydantic v2 schemas, type safety, and automated pytest suites. From a production support perspective, it provides automated health check probes, log-parsing scripts for instant P1/P2 triage, and an MCP server that empowers AI agents to assist in incident management."*
