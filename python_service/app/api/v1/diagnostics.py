from fastapi import APIRouter
from app.models.schemas import LogIncidentTriageRequest, IncidentTriageReport
from app.services.log_diagnostics import LogDiagnosticsEngine

router = APIRouter(prefix="/diagnostics", tags=["Production Support & Diagnostics"])

@router.post("/triage", response_model=IncidentTriageReport, summary="Parse Logs and Triage Incidents")
async def triage_logs(request: LogIncidentTriageRequest):
    """
    Analyzes raw log strings or log line arrays to:
    - Identify PostgreSQL GiST exclusion conflicts (23P01 / 409)
    - Triage HTTP 5xx errors and connection pool exhaustion
    - Provide incident severity (P1/P2/P3) and root cause remediation steps
    """
    return LogDiagnosticsEngine.triage_logs(request)
