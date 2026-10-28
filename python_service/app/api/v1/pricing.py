from fastapi import APIRouter
from app.models.schemas import PricingQuoteRequest, PricingBreakdown
from app.services.pricing_engine import DynamicPricingEngine

router = APIRouter(prefix="/pricing", tags=["Dynamic Pricing Engine"])

@router.post("/quote", response_model=PricingBreakdown, summary="Calculate Dynamic Slot Price")
async def get_pricing_quote(request: PricingQuoteRequest):
    """
    Computes real-time dynamic pricing based on:
    - Time of day (peak evening surge)
    - Day of week (weekend premium)
    - Off-peak discounts (weekday afternoon capacity filling)
    - Outdoor weather impact
    """
    return DynamicPricingEngine.calculate_quote(request)
