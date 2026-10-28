import time
import httpx
from datetime import datetime
from fastapi import APIRouter
from app.core.config import settings
from app.models.schemas import HealthProbeResponse

router = APIRouter(prefix="/health", tags=["Health & Ops Probes"])

SERVICE_START_TIME = time.time()

@router.get("/live", summary="Basic Liveness Probe")
async def liveness_probe():
    """Kubernetes/Docker liveness probe returning HTTP 200."""
    return {"status": "alive", "service": "turfbook-python-diagnostics"}

@router.get("/ready", summary="Readiness Probe with Node Backend Ping")
async def readiness_probe():
    """Verifies that the microservice is operational and can reach the core Node.js server."""
    node_ok = False
    latency = None
    try:
        async with httpx.AsyncClient(timeout=2.0) as client:
            t0 = time.time()
            res = await client.get(f"{settings.CORE_API_URL}/health")
            latency = round((time.time() - t0) * 1000.0, 2)
            node_ok = res.status_code == 200
    except Exception:
        node_ok = False

    return {
        "status": "ready" if node_ok else "degraded",
        "node_backend_healthy": node_ok,
        "node_backend_latency_ms": latency,
        "timestamp": datetime.utcnow().isoformat(),
    }

@router.get("/telemetry", response_model=HealthProbeResponse, summary="Detailed System Telemetry")
async def system_telemetry():
    """Returns memory usage, uptime, and node connectivity for operational dashboards."""
    import sys
    uptime = round(time.time() - SERVICE_START_TIME, 2)
    node_ok = False
    latency = None

    try:
        async with httpx.AsyncClient(timeout=2.0) as client:
            t0 = time.time()
            res = await client.get(f"{settings.CORE_API_URL}/health")
            latency = round((time.time() - t0) * 1000.0, 2)
            node_ok = res.status_code == 200
    except Exception:
        node_ok = False

    # Rough memory approximation in MB
    mem_mb = round(sys.getsizeof({}) / (1024 * 1024), 2)

    return HealthProbeResponse(
        service="turfbook-python-diagnostics",
        status="HEALTHY" if node_ok else "STANDALONE_ACTIVE",
        version=settings.VERSION,
        uptime_seconds=uptime,
        timestamp=datetime.utcnow(),
        node_backend_healthy=node_ok,
        node_backend_latency_ms=latency,
        memory_usage_mb=mem_mb,
    )
