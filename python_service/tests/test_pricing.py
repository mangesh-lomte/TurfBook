from datetime import datetime
import pytest
from app.models.schemas import PricingQuoteRequest, WeatherCondition, SportCategory
from app.services.pricing_engine import DynamicPricingEngine

def test_prime_time_surge_pricing():
    # Friday 19:00 (7 PM) -> Prime time surge (+20%)
    # Friday = weekday 4 (not weekend in python where Sat=5, Sun=6)
    start = datetime(2026, 10, 30, 19, 0)
    end = datetime(2026, 10, 30, 20, 0)

    req = PricingQuoteRequest(
        ground_id="grd_test_01",
        base_price_per_hour=1000.0,
        start_time=start,
        end_time=end,
        sport=SportCategory.FOOTBALL,
        is_indoor=False,
        weather=WeatherCondition.SUNNY,
    )
    quote = DynamicPricingEngine.calculate_quote(req)

    assert quote.base_price == 1000.0
    assert quote.time_of_day_multiplier == 1.20
    assert quote.weekend_multiplier == 1.00
    assert quote.final_hourly_rate == 1200.0
    assert quote.subtotal == 1200.0
    assert quote.tax_gst_18_pct == round(1200.0 * 0.18, 2)
    assert quote.total_amount == round(1200.0 + (1200.0 * 0.18), 2)
    assert quote.pricing_tier == "SURGE"

def test_off_peak_weekday_discount():
    # Tuesday 13:00 (1 PM) -> Off-peak discount (-25%)
    start = datetime(2026, 10, 27, 13, 0)
    end = datetime(2026, 10, 27, 14, 0)

    req = PricingQuoteRequest(
        ground_id="grd_test_02",
        base_price_per_hour=1000.0,
        start_time=start,
        end_time=end,
        sport=SportCategory.BADMINTON,
        is_indoor=True,
        weather=WeatherCondition.SUNNY,
    )
    quote = DynamicPricingEngine.calculate_quote(req)

    assert quote.time_of_day_multiplier == 0.75
    assert quote.final_hourly_rate == 750.0
    assert quote.pricing_tier == "DISCOUNT"

def test_outdoor_rain_discount():
    # Outdoor turf in heavy rain receives 20% weather discount
    start = datetime(2026, 10, 28, 9, 0)
    end = datetime(2026, 10, 28, 10, 0)

    req = PricingQuoteRequest(
        ground_id="grd_outdoor_01",
        base_price_per_hour=1000.0,
        start_time=start,
        end_time=end,
        sport=SportCategory.CRICKET,
        is_indoor=False,
        weather=WeatherCondition.RAINY,
    )
    quote = DynamicPricingEngine.calculate_quote(req)

    assert quote.weather_multiplier == 0.80
    assert quote.final_hourly_rate == 800.0
    assert any("Inclement Weather" in r for r in quote.discount_or_surge_reasons)
