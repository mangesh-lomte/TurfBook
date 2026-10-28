from fastapi import APIRouter
from app.models.schemas import UtilizationRequest, UtilizationReport
from app.services.analytics_engine import AnalyticsEngine

router = APIRouter(prefix="/analytics", tags=["Revenue & Utilization Analytics"])

@router.post("/occupancy-report", response_model=UtilizationReport, summary="Generate Pandas Occupancy & Revenue Report")
async def generate_occupancy_report(request: UtilizationRequest):
    """
    Ingests booking records and computes:
    - Overall revenue and cancellation rates
    - Hourly peak slot distributions
    - Sport revenue share percentages
    - Health tier categorization
    """
    return AnalyticsEngine.generate_report(request)
