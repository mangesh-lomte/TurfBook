import pytest
from app.models.schemas import LogIncidentTriageRequest, IncidentSeverity
from app.services.log_diagnostics import LogDiagnosticsEngine

def test_diagnose_gist_concurrency_race_condition():
    logs = """
    [2026-10-30T18:00:01Z] HTTP POST /api/v1/bookings status: 201 Created
    [2026-10-30T18:00:01Z] PostgreSQL GiST exclusion constraint conflict: 23P01 - conflicting key value violates exclusion constraint on ground_id: grd_football_01 for range [18:00, 19:00). Returned 409 Conflict to client.
    """
    req = LogIncidentTriageRequest(log_content=logs)
    report = LogDiagnosticsEngine.triage_logs(req)

    assert report.concurrency_conflict_409_count == 1
    assert any(i.issue_type == "GIST_CONCURRENCY_409" for i in report.detected_issues)
    gist_issue = next(i for i in report.detected_issues if i.issue_type == "GIST_CONCURRENCY_409")
    assert "exclusion constraint" in gist_issue.root_cause_analysis.lower()

def test_diagnose_critical_server_500():
    logs = """
    [2026-10-30T19:15:00Z] TypeError: Cannot read properties of undefined (reading 'id')
    [2026-10-30T19:15:00Z] HTTP 500 Internal Server Error in booking.controller.ts
    [2026-10-30T19:15:01Z] HTTP 500 Internal Server Error in payment.service.ts
    [2026-10-30T19:15:02Z] HTTP 500 Internal Server Error in auth.service.ts
    [2026-10-30T19:15:03Z] HTTP 500 Internal Server Error
    [2026-10-30T19:15:04Z] HTTP 500 Internal Server Error
    """
    req = LogIncidentTriageRequest(log_content=logs)
    report = LogDiagnosticsEngine.triage_logs(req)

    assert report.http_5xx_count >= 5
    assert report.overall_status == IncidentSeverity.P1_CRITICAL

def test_diagnose_clean_healthy_logs():
    logs = """
    HTTP GET /api/v1/venues status: 200 latency: 12ms
    HTTP GET /health status: 200 database: connected
    """
    req = LogIncidentTriageRequest(log_content=logs)
    report = LogDiagnosticsEngine.triage_logs(req)

    assert report.overall_status == IncidentSeverity.HEALTHY
    assert report.http_5xx_count == 0
    assert report.concurrency_conflict_409_count == 0
    assert len(report.detected_issues) == 0
