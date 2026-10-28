from datetime import datetime
from enum import Enum
from typing import Dict, List, Optional
from pydantic import BaseModel, Field

class WeatherCondition(str, Enum):
    SUNNY = "SUNNY"
    OVERCAST = "OVERCAST"
    RAINY = "RAINY"
    EXTREME_HEAT = "EXTREME_HEAT"

class SportCategory(str, Enum):
    FOOTBALL = "FOOTBALL"
    CRICKET = "CRICKET"
    BADMINTON = "BADMINTON"
    TENNIS = "TENNIS"
    OTHER = "OTHER"

# ----------------- PRICING SCHEMAS -----------------
class PricingQuoteRequest(BaseModel):
    ground_id: str = Field(..., description="Target ground UUID or identifier")
    base_price_per_hour: float = Field(..., gt=0, description="Base hourly ground rate in INR")
    start_time: datetime = Field(..., description="Requested start timestamp")
    end_time: datetime = Field(..., description="Requested end timestamp")
    sport: SportCategory = Field(default=SportCategory.FOOTBALL)
    is_indoor: bool = Field(default=False, description="Whether the turf is covered/indoor")
    weather: WeatherCondition = Field(default=WeatherCondition.SUNNY)

class PricingBreakdown(BaseModel):
    base_price: float
    duration_hours: float
    time_of_day_multiplier: float
    weekend_multiplier: float
    weather_multiplier: float
    final_hourly_rate: float
    subtotal: float
    tax_gst_18_pct: float
    total_amount: float
    pricing_tier: str
    discount_or_surge_reasons: List[str]

# ----------------- ANALYTICS SCHEMAS -----------------
class BookingRecord(BaseModel):
    booking_id: str
    ground_id: str
    sport: str
    start_time: datetime
    end_time: datetime
    amount: float
    status: str  # CONFIRMED, CANCELLED, PENDING_PAYMENT

class UtilizationRequest(BaseModel):
    venue_id: Optional[str] = None
    days_window: int = Field(default=30, ge=1, le=365)
    bookings: List[BookingRecord] = Field(default_factory=list)

class HourlyOccupancy(BaseModel):
    hour: int
    booking_count: int
    occupancy_percentage: float

class SportRevenueShare(BaseModel):
    sport: str
    revenue: float
    booking_count: int
    percentage_of_total: float

class UtilizationReport(BaseModel):
    total_revenue: float
    total_bookings: int
    confirmed_bookings: int
    cancelled_bookings: int
    cancellation_rate_pct: float
    average_booking_value: float
    peak_hours: List[HourlyOccupancy]
    sport_revenue_distribution: List[SportRevenueShare]
    utilization_rating: str

# ----------------- HEALTH & OPS SCHEMAS -----------------
class HealthProbeResponse(BaseModel):
    service: str
    status: str
    version: str
    uptime_seconds: float
    timestamp: datetime
    node_backend_healthy: bool
    node_backend_latency_ms: Optional[float]
    memory_usage_mb: float

# ----------------- LOG DIAGNOSTICS & INCIDENT TRIAGE -----------------
class LogIncidentTriageRequest(BaseModel):
    log_content: Optional[str] = Field(default=None, description="Raw log text or stream")
    lines: Optional[List[str]] = Field(default=None, description="List of raw log lines")
    user_id_filter: Optional[str] = Field(default=None)

class IncidentSeverity(str, Enum):
    P1_CRITICAL = "P1_CRITICAL"
    P2_HIGH = "P2_HIGH"
    P3_MEDIUM = "P3_MEDIUM"
    P4_LOW = "P4_LOW"
    HEALTHY = "HEALTHY"

class DetectedIssue(BaseModel):
    issue_type: str
    count: int
    severity: IncidentSeverity
    sample_log: str
    root_cause_analysis: str
    recommended_remediation: str

class IncidentTriageReport(BaseModel):
    analyzed_at: datetime
    total_lines_analyzed: int
    overall_status: IncidentSeverity
    http_5xx_count: int
    concurrency_conflict_409_count: int
    unauthorized_401_count: int
    detected_issues: List[DetectedIssue]
    executive_summary: str
