import json
import re
from datetime import datetime, timezone
from typing import List
from app.models.schemas import (
    LogIncidentTriageRequest,
    IncidentTriageReport,
    IncidentSeverity,
    DetectedIssue,
)

class LogDiagnosticsEngine:
    """
    Parses application logs, classifies server error spikes, detects PostgreSQL
    concurrency contention (GiST exclusion violations), and provides automated remediation runbooks.
    """

    PATTERNS = {
        "GIST_CONCURRENCY_409": {
            "regex": re.compile(r"(23P01|exclusion constraint|Slot.*already booked|409 Conflict)", re.IGNORECASE),
            "severity": IncidentSeverity.P2_HIGH,
            "root_cause": "Concurrent booking race condition. PostgreSQL GiST exclusion constraint successfully prevented a double-booking.",
            "remediation": "Healthy defensive behavior. If spike is unusually high, consider front-ending slot reservation with an in-memory Redis lock or availability TTL cache."
        },
        "DATABASE_CONNECTION_POOL_EXHAUSTION": {
            "regex": re.compile(r"(Timed out fetching a new connection from the connection pool|connection pool timeout)", re.IGNORECASE),
            "severity": IncidentSeverity.P1_CRITICAL,
            "root_cause": "Prisma connection pool saturation. Database queries or long-running transactions are hoarding connections.",
            "remediation": "Increase DATABASE_URL connection_limit in .env or check for uncommitted Prisma transactions in booking.service.ts."
        },
        "SERVER_ERROR_500": {
            "regex": re.compile(r"(status:\s*500|HTTP/1\.1\s*500|Internal Server Error|TypeError:|ReferenceError:)", re.IGNORECASE),
            "severity": IncidentSeverity.P1_CRITICAL,
            "root_cause": "Unhandled application exception in Node.js Express backend.",
            "remediation": "Inspect stack trace in server logs. Verify error boundary in errorHandler.ts."
        },
        "PAYMENT_GATEWAY_TIMEOUT": {
            "regex": re.compile(r"(payment.*timeout|gateway timeout|ETIMEDOUT|ECONNRESET)", re.IGNORECASE),
            "severity": IncidentSeverity.P2_HIGH,
            "root_cause": "Downstream payment webhook or external payment provider socket timeout.",
            "remediation": "Check payment gateway status page. Verify retry queues and ensure idempotency key header is present."
        },
        "TOKEN_AUTH_FAILURE_401": {
            "regex": re.compile(r"(jwt expired|JsonWebTokenError|401 Unauthorized|Invalid refresh token)", re.IGNORECASE),
            "severity": IncidentSeverity.P3_MEDIUM,
            "root_cause": "Expired access token or invalidated refresh session.",
            "remediation": "Normal client-side token expiration. If occurring immediately after login, check JWT_SECRET consistency across instances."
        }
    }

    @classmethod
    def triage_logs(cls, request: LogIncidentTriageRequest) -> IncidentTriageReport:
        lines: List[str] = []
        if request.lines:
            lines = request.lines
        elif request.log_content:
            lines = [l.strip() for l in request.log_content.splitlines() if l.strip()]

        total_lines = len(lines)
        issue_counts = {k: 0 for k in cls.PATTERNS.keys()}
        sample_logs = {k: "" for k in cls.PATTERNS.keys()}

        http_500_count = 0
        conflict_409_count = 0
        unauth_401_count = 0

        for line in lines:
            # Check 409
            if "409" in line or "23P01" in line:
                conflict_409_count += 1
            # Check 500
            if "500" in line or "Internal Server Error" in line:
                http_500_count += 1
            # Check 401
            if "401" in line or "jwt expired" in line:
                unauth_401_count += 1

            for key, meta in cls.PATTERNS.items():
                if meta["regex"].search(line):
                    issue_counts[key] += 1
                    if not sample_logs[key]:
                        sample_logs[key] = line[:200]

        detected_issues: List[DetectedIssue] = []
        for key, count in issue_counts.items():
            if count > 0:
                meta = cls.PATTERNS[key]
                detected_issues.append(
                    DetectedIssue(
                        issue_type=key,
                        count=count,
                        severity=meta["severity"],
                        sample_log=sample_logs[key],
                        root_cause_analysis=meta["root_cause"],
                        recommended_remediation=meta["remediation"],
                    )
                )

        # Determine overall severity
        if issue_counts["DATABASE_CONNECTION_POOL_EXHAUSTION"] > 0 or http_500_count >= 5:
            overall_severity = IncidentSeverity.P1_CRITICAL
            summary = f"CRITICAL INCIDENT: Detected {http_500_count} server errors or database pool exhaustion. Immediate engineer intervention required."
        elif conflict_409_count > 10 or issue_counts["PAYMENT_GATEWAY_TIMEOUT"] > 0:
            overall_severity = IncidentSeverity.P2_HIGH
            summary = f"HIGH ALERT: Detected {conflict_409_count} concurrent booking collisions or payment network latency."
        elif unauth_401_count > 0 or total_lines > 0 and len(detected_issues) > 0:
            overall_severity = IncidentSeverity.P3_MEDIUM
            summary = f"MODERATE: Routine client token expirations or minor warnings detected."
        else:
            overall_severity = IncidentSeverity.HEALTHY
            summary = f"HEALTHY: System operating smoothly. Analyzed {total_lines} lines with zero critical faults."

        return IncidentTriageReport(
            analyzed_at=datetime.now(timezone.utc),
            total_lines_analyzed=total_lines,
            overall_status=overall_severity,
            http_5xx_count=http_500_count,
            concurrency_conflict_409_count=conflict_409_count,
            unauthorized_401_count=unauth_401_count,
            detected_issues=detected_issues,
            executive_summary=summary,
        )
