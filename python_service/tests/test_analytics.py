from datetime import datetime
import pytest
from app.models.schemas import UtilizationRequest, BookingRecord
from app.services.analytics_engine import AnalyticsEngine

def test_analytics_revenue_and_occupancy():
    bookings = [
        BookingRecord(
            booking_id="b1",
            ground_id="g1",
            sport="Football",
            start_time=datetime(2026, 10, 20, 19, 0),
            end_time=datetime(2026, 10, 20, 20, 0),
            amount=1500.0,
            status="CONFIRMED",
        ),
        BookingRecord(
            booking_id="b2",
            ground_id="g1",
            sport="Football",
            start_time=datetime(2026, 10, 21, 19, 0),
            end_time=datetime(2026, 10, 21, 20, 0),
            amount=1500.0,
            status="CONFIRMED",
        ),
        BookingRecord(
            booking_id="b3",
            ground_id="g2",
            sport="Cricket",
            start_time=datetime(2026, 10, 21, 10, 0),
            end_time=datetime(2026, 10, 21, 11, 0),
            amount=2000.0,
            status="CONFIRMED",
        ),
        BookingRecord(
            booking_id="b4",
            ground_id="g1",
            sport="Football",
            start_time=datetime(2026, 10, 22, 18, 0),
            end_time=datetime(2026, 10, 22, 19, 0),
            amount=1500.0,
            status="CANCELLED",
        ),
    ]

    req = UtilizationRequest(days_window=7, bookings=bookings)
    report = AnalyticsEngine.generate_report(req)

    assert report.total_bookings == 4
    assert report.confirmed_bookings == 3
    assert report.cancelled_bookings == 1
    assert report.total_revenue == 5000.0  # 1500 + 1500 + 2000
    assert report.cancellation_rate_pct == 25.0
    assert report.average_booking_value == round(5000.0 / 3, 2)

    # 19:00 should be the peak hour with 2 bookings
    top_peak = report.peak_hours[0]
    assert top_peak.hour == 19
    assert top_peak.booking_count == 2

    # Sport breakdown
    sports = {s.sport: s.revenue for s in report.sport_revenue_distribution}
    assert sports["FOOTBALL"] == 3000.0
    assert sports["CRICKET"] == 2000.0

def test_analytics_empty_bookings():
    req = UtilizationRequest(days_window=30, bookings=[])
    report = AnalyticsEngine.generate_report(req)

    assert report.total_bookings == 0
    assert report.total_revenue == 0.0
    assert report.utilization_rating == "NO_DATA_AVAILABLE"
