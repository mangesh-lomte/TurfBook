from typing import List
from collections import defaultdict

try:
    import pandas as pd
    HAS_PANDAS = True
except ImportError:
    HAS_PANDAS = False

from app.models.schemas import (
    UtilizationRequest,
    UtilizationReport,
    HourlyOccupancy,
    SportRevenueShare,
)

class AnalyticsEngine:
    """
    Pandas-powered data aggregation engine to compute slot occupancy,
    revenue breakdown, and operational metrics from raw booking records.
    Includes seamless native-fallback if Pandas is being installed.
    """

    @classmethod
    def generate_report(cls, request: UtilizationRequest) -> UtilizationReport:
        bookings = request.bookings
        if not bookings:
            return cls._empty_report()

        if HAS_PANDAS:
            return cls._generate_with_pandas(request)
        return cls._generate_with_native_python(request)

    @classmethod
    def _generate_with_pandas(cls, request: UtilizationRequest) -> UtilizationReport:
        records = [
            {
                "booking_id": b.booking_id,
                "ground_id": b.ground_id,
                "sport": b.sport.upper(),
                "start_time": b.start_time,
                "end_time": b.end_time,
                "amount": float(b.amount),
                "status": b.status.upper(),
                "hour": b.start_time.hour,
            }
            for b in request.bookings
        ]
        df = pd.DataFrame(records)

        total_bookings = len(df)
        confirmed_df = df[df["status"] == "CONFIRMED"]
        cancelled_count = len(df[df["status"] == "CANCELLED"])
        confirmed_count = len(confirmed_df)

        total_revenue = round(float(confirmed_df["amount"].sum()), 2) if not confirmed_df.empty else 0.0
        avg_booking_val = round(float(confirmed_df["amount"].mean()), 2) if not confirmed_df.empty else 0.0
        cancellation_rate = round((cancelled_count / total_bookings) * 100, 2) if total_bookings > 0 else 0.0

        hourly_counts = confirmed_df["hour"].value_counts().to_dict() if not confirmed_df.empty else {}
        peak_hours: List[HourlyOccupancy] = []
        for hour in range(6, 24):
            count = hourly_counts.get(hour, 0)
            pct = round(min(100.0, (count / max(1, request.days_window)) * 100), 1)
            peak_hours.append(HourlyOccupancy(hour=hour, booking_count=count, occupancy_percentage=pct))

        peak_hours.sort(key=lambda x: x.booking_count, reverse=True)

        sport_shares: List[SportRevenueShare] = []
        if not confirmed_df.empty:
            sport_grouped = confirmed_df.groupby("sport").agg(
                revenue=("amount", "sum"),
                booking_count=("booking_id", "count")
            ).reset_index()

            for _, row in sport_grouped.iterrows():
                sport_rev = round(float(row["revenue"]), 2)
                share_pct = round((sport_rev / total_revenue) * 100, 2) if total_revenue > 0 else 0.0
                sport_shares.append(SportRevenueShare(
                    sport=str(row["sport"]),
                    revenue=sport_rev,
                    booking_count=int(row["booking_count"]),
                    percentage_of_total=share_pct
                ))

            sport_shares.sort(key=lambda x: x.revenue, reverse=True)

        return cls._build_report(
            total_revenue=total_revenue,
            total_bookings=total_bookings,
            confirmed_count=confirmed_count,
            cancelled_count=cancelled_count,
            cancellation_rate=cancellation_rate,
            avg_booking_val=avg_booking_val,
            peak_hours=peak_hours[:8],
            sport_shares=sport_shares,
        )

    @classmethod
    def _generate_with_native_python(cls, request: UtilizationRequest) -> UtilizationReport:
        bookings = request.bookings
        total_bookings = len(bookings)
        confirmed = [b for b in bookings if b.status.upper() == "CONFIRMED"]
        cancelled = [b for b in bookings if b.status.upper() == "CANCELLED"]
        confirmed_count = len(confirmed)
        cancelled_count = len(cancelled)

        total_revenue = round(sum(float(b.amount) for b in confirmed), 2)
        avg_booking_val = round(total_revenue / confirmed_count, 2) if confirmed_count > 0 else 0.0
        cancellation_rate = round((cancelled_count / total_bookings) * 100, 2) if total_bookings > 0 else 0.0

        hourly_counts = defaultdict(int)
        sport_rev = defaultdict(float)
        sport_cnt = defaultdict(int)

        for b in confirmed:
            hourly_counts[b.start_time.hour] += 1
            sport_name = b.sport.upper()
            sport_rev[sport_name] += float(b.amount)
            sport_cnt[sport_name] += 1

        peak_hours: List[HourlyOccupancy] = []
        for hour in range(6, 24):
            count = hourly_counts[hour]
            pct = round(min(100.0, (count / max(1, request.days_window)) * 100), 1)
            peak_hours.append(HourlyOccupancy(hour=hour, booking_count=count, occupancy_percentage=pct))

        peak_hours.sort(key=lambda x: x.booking_count, reverse=True)

        sport_shares: List[SportRevenueShare] = []
        for sport, rev in sport_rev.items():
            s_rev = round(rev, 2)
            pct = round((s_rev / total_revenue) * 100, 2) if total_revenue > 0 else 0.0
            sport_shares.append(SportRevenueShare(
                sport=sport,
                revenue=s_rev,
                booking_count=sport_cnt[sport],
                percentage_of_total=pct
            ))

        sport_shares.sort(key=lambda x: x.revenue, reverse=True)

        return cls._build_report(
            total_revenue=total_revenue,
            total_bookings=total_bookings,
            confirmed_count=confirmed_count,
            cancelled_count=cancelled_count,
            cancellation_rate=cancellation_rate,
            avg_booking_val=avg_booking_val,
            peak_hours=peak_hours[:8],
            sport_shares=sport_shares,
        )

    @staticmethod
    def _build_report(
        total_revenue: float,
        total_bookings: int,
        confirmed_count: int,
        cancelled_count: int,
        cancellation_rate: float,
        avg_booking_val: float,
        peak_hours: List[HourlyOccupancy],
        sport_shares: List[SportRevenueShare],
    ) -> UtilizationReport:
        if cancellation_rate > 25.0:
            rating = "HIGH_CHURN_ATTENTION_NEEDED"
        elif total_revenue > 50000.0:
            rating = "HIGH_PERFORMING"
        elif total_bookings >= 10:
            rating = "HEALTHY_STEADY_VOLUME"
        else:
            rating = "EMERGING_LOW_VOLUME"

        return UtilizationReport(
            total_revenue=total_revenue,
            total_bookings=total_bookings,
            confirmed_bookings=confirmed_count,
            cancelled_bookings=cancelled_count,
            cancellation_rate_pct=cancellation_rate,
            average_booking_value=avg_booking_val,
            peak_hours=peak_hours,
            sport_revenue_distribution=sport_shares,
            utilization_rating=rating,
        )

    @staticmethod
    def _empty_report() -> UtilizationReport:
        return UtilizationReport(
            total_revenue=0.0,
            total_bookings=0,
            confirmed_bookings=0,
            cancelled_bookings=0,
            cancellation_rate_pct=0.0,
            average_booking_value=0.0,
            peak_hours=[],
            sport_revenue_distribution=[],
            utilization_rating="NO_DATA_AVAILABLE",
        )
