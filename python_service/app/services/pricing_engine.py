from datetime import datetime
from typing import List, Tuple
from app.models.schemas import PricingQuoteRequest, PricingBreakdown, WeatherCondition

class DynamicPricingEngine:
    """
    Computes dynamic hourly slot rates based on peak demand windows,
    day-of-week multipliers, off-peak discount heuristics, and weather factors.
    """

    PRIME_TIME_HOURS = {18, 19, 20, 21}  # 6 PM - 10 PM
    OFF_PEAK_HOURS = {11, 12, 13, 14, 15}  # 11 AM - 4 PM
    WEEKEND_DAYS = {5, 6}  # Saturday=5, Sunday=6 (Python weekday)

    @classmethod
    def calculate_quote(cls, request: PricingQuoteRequest) -> PricingBreakdown:
        start = request.start_time
        end = request.end_time

        # Duration in hours
        duration_seconds = max(0.0, (end - start).total_seconds())
        duration_hours = max(0.5, round(duration_seconds / 3600.0, 2))

        start_hour = start.hour
        is_weekend = start.weekday() in cls.WEEKEND_DAYS
        reasons: List[str] = []

        # 1. Time of Day Multiplier
        if start_hour in cls.PRIME_TIME_HOURS:
            time_mult = 1.20
            reasons.append("Peak Evening Prime Time (+20% surge)")
        elif (not is_weekend) and (start_hour in cls.OFF_PEAK_HOURS):
            time_mult = 0.75
            reasons.append("Weekday Off-Peak Slot (-25% discount to fill capacity)")
        else:
            time_mult = 1.00

        # 2. Weekend Multiplier
        if is_weekend:
            weekend_mult = 1.15
            reasons.append("Weekend High Demand (+15% surge)")
        else:
            weekend_mult = 1.00

        # 3. Weather Condition Multiplier (Only applies to outdoor turfs)
        weather_mult = 1.00
        if not request.is_indoor:
            if request.weather == WeatherCondition.RAINY:
                weather_mult = 0.80
                reasons.append("Outdoor Inclement Weather Discount (-20%)")
            elif request.weather == WeatherCondition.EXTREME_HEAT and (12 <= start_hour <= 15):
                weather_mult = 0.85
                reasons.append("Midday Heat Advisory Discount (-15%)")

        if not reasons:
            reasons.append("Standard Base Pricing Tier")

        # Composite hourly rate
        final_hourly_rate = round(request.base_price_per_hour * time_mult * weekend_mult * weather_mult, 2)
        subtotal = round(final_hourly_rate * duration_hours, 2)
        gst = round(subtotal * 0.18, 2)
        total_amount = round(subtotal + gst, 2)

        tier = "SURGE" if (time_mult > 1.0 or weekend_mult > 1.0) and weather_mult >= 1.0 else (
            "DISCOUNT" if (time_mult < 1.0 or weather_mult < 1.0) else "STANDARD"
        )

        return PricingBreakdown(
            base_price=request.base_price_per_hour,
            duration_hours=duration_hours,
            time_of_day_multiplier=time_mult,
            weekend_multiplier=weekend_mult,
            weather_multiplier=weather_mult,
            final_hourly_rate=final_hourly_rate,
            subtotal=subtotal,
            tax_gst_18_pct=gst,
            total_amount=total_amount,
            pricing_tier=tier,
            discount_or_surge_reasons=reasons,
        )
