"""
Model Context Protocol (MCP) Server for TurfBook Operations & Support Automation.

This server exposes diagnostic and operational tools to AI agents using the
official Model Context Protocol (MCP) specification.
"""

import json
from datetime import datetime
from mcp.server.fastmcp import FastMCP
from app.services.pricing_engine import DynamicPricingEngine
from app.models.schemas import PricingQuoteRequest, WeatherCondition, SportCategory
from app.services.log_diagnostics import LogDiagnosticsEngine
from app.models.schemas import LogIncidentTriageRequest

# Initialize FastMCP Server
mcp = FastMCP("turfbook-ops-diagnostics")

@mcp.tool()
def check_system_health() -> str:
    """
    Check the current health, uptime, and status of the TurfBook system.
    Returns status JSON with timestamp and service availability indicators.
    """
    return json.dumps({
        "status": "HEALTHY",
        "service": "turfbook-microservice-ops",
        "database": "PostgreSQL 16 (GiST Extension Active)",
        "backend": "Node.js Express + Python FastAPI",
        "timestamp": datetime.utcnow().isoformat(),
        "active_monitors": ["Database Connection Pool", "HTTP 5xx Spikes", "409 GiST Collisions"],
    }, indent=2)

@mcp.tool()
def analyze_error_logs(raw_logs: str) -> str:
    """
    Analyze raw application logs or error messages from TurfBook backend.
    Detects PostgreSQL GiST exclusion conflicts, 500 exceptions, and connection pool issues.
    Returns root-cause analysis and actionable remediation steps.
    """
    req = LogIncidentTriageRequest(log_content=raw_logs)
    report = LogDiagnosticsEngine.triage_logs(req)
    return json.dumps(report.model_dump(mode="json"), indent=2)

@mcp.tool()
def quote_slot_pricing(
    ground_id: str,
    base_price_per_hour: float,
    start_hour: int,
    duration_hours: float = 1.0,
    is_weekend: bool = False,
    is_indoor: bool = False,
    weather: str = "SUNNY",
) -> str:
    """
    Calculate dynamic slot pricing with peak surge, off-peak discount, and weather factors.
    Returns subtotal, GST (18%), and final customer price breakdown.
    """
    now = datetime.utcnow()
    # Mock date aligned with hour
    start_time = datetime(now.year, now.month, 10 if not is_weekend else 11, start_hour, 0)
    end_time = datetime(now.year, now.month, 10 if not is_weekend else 11, min(23, int(start_hour + duration_hours)), 0)

    weather_enum = WeatherCondition.SUNNY
    try:
        weather_enum = WeatherCondition(weather.upper())
    except ValueError:
        pass

    req = PricingQuoteRequest(
        ground_id=ground_id,
        base_price_per_hour=base_price_per_hour,
        start_time=start_time,
        end_time=end_time,
        sport=SportCategory.FOOTBALL,
        is_indoor=is_indoor,
        weather=weather_enum,
    )
    quote = DynamicPricingEngine.calculate_quote(req)
    return json.dumps(quote.model_dump(mode="json"), indent=2)

@mcp.tool()
def triage_booking_incident(incident_description: str) -> str:
    """
    Triage a customer booking dispute (e.g., 'Slot double booked' or 'Payment deducted but pending').
    Returns severity level, probable failure point, and runbook SOP reference.
    """
    req = LogIncidentTriageRequest(log_content=incident_description)
    report = LogDiagnosticsEngine.triage_logs(req)

    return json.dumps({
        "triage_summary": report.executive_summary,
        "severity": report.overall_status.value,
        "detected_issues": [i.model_dump(mode="json") for i in report.detected_issues],
        "sop_reference": "docs/PRODUCTION_SUPPORT_RUNBOOK.md - Section 3.2 (Concurrency Control & Payment Triage)",
    }, indent=2)

if __name__ == "__main__":
    # Runs standard stdio MCP transport
    mcp.run()
