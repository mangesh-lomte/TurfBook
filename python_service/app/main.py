from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1.health import router as health_router
from app.api.v1.pricing import router as pricing_router
from app.api.v1.analytics import router as analytics_router
from app.api.v1.diagnostics import router as diagnostics_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup actions
    print(f"[STARTING] {settings.PROJECT_NAME} v{settings.VERSION} on port {settings.PORT}...")
    yield
    # Shutdown actions
    print(f"[SHUTDOWN] {settings.PROJECT_NAME} shutting down...")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="""
    ## TurfBook Polyglot Microservice Architecture
    High-performance Python service providing:
    * **Dynamic Pricing Engine**: Computes time-of-day surge, off-peak discounts, and weather adjustments.
    * **Analytics & Utilization Engine**: Aggregates booking occupancy and revenue distribution using Pandas.
    * **Production Support & Log Diagnostics**: Real-time log triage, GiST exclusion race-condition detection, and incident severity classification.
    * **Model Context Protocol (MCP)**: AI-ready diagnostic tools for automated incident response.
    """,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API v1 Routers
app.include_router(health_router, prefix=settings.API_V1_PREFIX)
app.include_router(pricing_router, prefix=settings.API_V1_PREFIX)
app.include_router(analytics_router, prefix=settings.API_V1_PREFIX)
app.include_router(diagnostics_router, prefix=settings.API_V1_PREFIX)

@app.get("/", tags=["Root"])
async def root():
    return {
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "environment": settings.ENV,
        "docs": "/docs",
        "health": f"{settings.API_V1_PREFIX}/health/live",
        "telemetry": f"{settings.API_V1_PREFIX}/health/telemetry",
    }
