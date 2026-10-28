# 1. Check Python Diagnostics Service Liveness
curl http://localhost:8000/api/v1/health/live

# 2. Check System Readiness & Node.js Core Backend Ping
curl http://localhost:8000/api/v1/health/ready

# 3. Inspect Memory & Telemetry Metrics
curl http://localhost:8000/api/v1/health/telemetry
```

### 2.2 Expected Healthy Response
```json
{
  "service": "turfbook-python-diagnostics",
  "status": "HEALTHY",
  "version": "1.0.0",
  "uptime_seconds": 3600.5,
  "node_backend_healthy": true,
  "node_backend_latency_ms": 14.2,
  "memory_usage_mb": 42.1
}
```

---

## 3. COMMON PRODUCTION INCIDENT RUNBOOKS

### 3.1 Runbook: PostgreSQL GiST Concurrency Collision (HTTP 409 Storm)
* **Alert Trigger:** Spike in HTTP 409 Conflict responses on `POST /api/v1/bookings`.
* **Symptom:** User reports: *"Slot showed available, but booking failed with conflict."*
* **Root Cause:** Multiple customers attempted to book the exact same ground for overlapping time ranges simultaneously. PostgreSQL's `btree_gist` exclusion constraint correctly rejected the race condition with error code `23P01`.
* **Triage Steps:**
  1. Run the Python Log Analyzer to confirm the frequency:
     ```bash
     python -m python_service.scripts.analyze_logs --file /var/log/turfbook/server.log
     ```
  2. Inspect whether the 409 errors are isolated to one specific ground (e.g. prime Friday night football slot) or platform-wide.
  3. Verify that the slot availability cache is refreshing:
     ```bash
     curl "http://localhost:5000/api/v1/grounds/<ground_id>/availability?date=YYYY-MM-DD"
     ```
* **Remediation & Customer Communication:**
  - This is expected, defensive behavior protecting against double-booking.
  - Advise customer: *"Another user completed the reservation milliseconds earlier. Please select the next open slot."*

---

### 3.2 Runbook: Database Connection Pool Exhaustion (P1 Incident)
* **Alert Trigger:** Server logs indicate `Timed out fetching a new connection from the connection pool`.
* **Symptom:** API requests hang for 10 seconds and return HTTP 500.
* **Triage Steps:**
  1. Check PostgreSQL active connections:
     ```sql
     SELECT count(*), state FROM pg_stat_activity GROUP BY state;
     ```
  2. Check for long-running uncommitted transactions:
     ```sql
     SELECT pid, now() - xact_start AS duration, query 
     FROM pg_stat_activity 
     WHERE state = 'idle in transaction' AND (now() - xact_start) > interval '10 seconds';
     ```
* **Remediation:**
  1. Terminate hanging idle queries:
     ```sql
     SELECT pg_terminate_backend(<pid>);
     ```
  2. Verify `DATABASE_URL` parameter in `.env`: ensure `connection_limit=20` or higher based on server RAM.
  3. Restart the Node server service if connection pool fails to reclaim sockets.

---

### 3.3 Runbook: Payment Webhook Timeout / Unconfirmed Bookings (P2 Incident)
* **Alert Trigger:** Customer claims: *"UPI / Card payment succeeded, but TurfBook status is PENDING_PAYMENT."*
* **Triage Steps:**
  1. Search logs by user or transaction reference:
     ```bash
     grep "pay_" /var/log/turfbook/server.log
     ```
  2. Or use the Python Model Context Protocol (MCP) tool:
     ```python
     # Inside AI agent console:
     triage_booking_incident("Payment debited for booking bkg_9921 but status pending")
     ```
  3. Verify payment state in database:
     ```sql
     SELECT id, booking_id, status, amount, created_at FROM payments WHERE id = '<payment_id>';
     ```
* **Remediation:**
  - If payment gateway confirmed transaction: manually update payment status to `COMPLETED` and booking status to `CONFIRMED`.
  - If gateway refunded: update status to `FAILED` and release any temporary slot lock.

---

## 4. SHIFT HANDOFF CHECKLIST (SOP)

When handing off shifts between Day Shift (Office) and Night Shift (Remote):
1. [ ] **Active Incidents:** Review open Jira Service Management tickets; ensure all P1/P2 tickets have notes on current status.
2. [ ] **Error Spike Check:** Run `python -m python_service.scripts.analyze_logs` on the last 4 hours of logs.
3. [ ] **Database Replication & Uptime:** Confirm PostgreSQL active connections < 70% threshold.
4. [ ] **Scheduled Jobs & Backups:** Verify that the 02:00 UTC database backup and nightly analytics jobs completed successfully.
5. [ ] **Handoff Communication:** Post handoff summary in `#ops-shift-handoff` Slack/Teams channel.
