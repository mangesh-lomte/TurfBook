"""
Generates realistic mock production logs for TurfBook.
Includes normal 200 operations, concurrent GiST 409 conflicts, and simulated 500 errors.
"""

from datetime import datetime, timedelta, timezone
import random

SAMPLE_LOGS = [
    '{"level":"info","message":"HTTP GET /api/v1/venues?city=Pune status: 200 latency: 18ms"}',
    '{"level":"info","message":"HTTP GET /api/v1/grounds/grd_01/availability?date=2026-10-30 status: 200 latency: 24ms"}',
    '{"level":"info","message":"User login successful for user_id: usr_rohit_44"}',
    '{"level":"warn","message":"jwt expired for session_id: sess_9981 - status: 401 Unauthorized"}',
    '{"level":"error","message":"PostgreSQL GiST exclusion constraint conflict: 23P01 - conflicting key value violates exclusion constraint on ground_id: grd_football_01 for range [18:00, 19:00). Returned 409 Conflict to client."}',
    '{"level":"error","message":"PostgreSQL GiST exclusion constraint conflict: 23P01 - conflicting key value violates exclusion constraint on ground_id: grd_cricket_02 for range [20:00, 21:00). Returned 409 Conflict to client."}',
    '{"level":"info","message":"HTTP POST /api/v1/bookings status: 201 Created booking_id: bkg_7721"}',
    '{"level":"error","message":"Downstream payment webhook timeout: ETIMEDOUT payment_gateway_inquiry for payment_id: pay_8819 status: 500 Internal Server Error"}',
    '{"level":"info","message":"HTTP GET /health status: 200 database: connected uptime: 42100s"}',
]

def generate_mock_log_file(output_path: str = "sample_production.log", line_count: int = 50):
    now = datetime.now(timezone.utc)
    with open(output_path, "w", encoding="utf-8") as f:
        for i in range(line_count):
            timestamp = (now - timedelta(minutes=line_count - i)).isoformat()
            log_line = random.choice(SAMPLE_LOGS)
            f.write(f"[{timestamp}] {log_line}\n")
    print(f"Generated {line_count} realistic production log lines at: {output_path}")

if __name__ == "__main__":
    generate_mock_log_file()
