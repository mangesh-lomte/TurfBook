#!/usr/bin/env python3
"""
TurfBook Production Support Log Analyzer CLI Tool.

Usage:
    python -m python_service.scripts.analyze_logs --file <path_to_log>
"""

import sys
import os
import argparse
from datetime import datetime

# Add root of python_service to sys.path so app imports work
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.models.schemas import LogIncidentTriageRequest
from app.services.log_diagnostics import LogDiagnosticsEngine

if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

def run_cli():
    parser = argparse.ArgumentParser(description="TurfBook Production Log Incident Triage Tool")
    parser.add_argument("--file", "-f", type=str, default="sample_production.log", help="Path to log file to analyze")
    args = parser.parse_args()

    file_path = args.file
    if not os.path.exists(file_path):
        print(f"[!] Log file not found at: {file_path}")
        print("Generating a sample log file automatically...")
        from scripts.seed_mock_logs import generate_mock_log_file
        generate_mock_log_file(file_path, line_count=40)

    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    req = LogIncidentTriageRequest(log_content=content)
    report = LogDiagnosticsEngine.triage_logs(req)

    print("\n" + "=" * 70)
    print(" [TURFBOOK OPS] PRODUCTION SUPPORT - LOG INCIDENT TRIAGE REPORT")
    print("=" * 70)
    print(f" Timestamp:              {report.analyzed_at.strftime('%Y-%m-%d %H:%M:%S UTC')}")
    print(f" Log File Analyzed:      {file_path}")
    print(f" Total Lines Analyzed:   {report.total_lines_analyzed}")
    print(f" Incident Severity:      {report.overall_status.value}")
    print("-" * 70)
    print(f" HTTP 5xx Server Errors:              {report.http_5xx_count}")
    print(f" 409 PostgreSQL GiST Collisions:     {report.concurrency_conflict_409_count}")
    print(f" 401 Unauthorized / Token Expiries:   {report.unauthorized_401_count}")
    print("-" * 70)
    print(f" Executive Summary: \n {report.executive_summary}")
    print("-" * 70)

    if report.detected_issues:
        print("\n[*] DETECTED ISSUES & RUNBOOK REMEDIATION:")
        for idx, issue in enumerate(report.detected_issues, start=1):
            print(f"\n [{idx}] Issue Type: {issue.issue_type} ({issue.count} occurrences)")
            print(f"     Severity:    {issue.severity.value}")
            print(f"     Root Cause:  {issue.root_cause_analysis}")
            print(f"     Remedy SOP:  {issue.recommended_remediation}")
    else:
        print("\n[OK] Zero issues detected. All services operating normally.")

    print("\n" + "=" * 70 + "\n")

if __name__ == "__main__":
    run_cli()
