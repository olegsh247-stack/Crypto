#!/usr/bin/env python3
"""Validate normalized, provenance-preserving research evidence envelopes.

This is a local artifact validator only. It performs no network or database writes.
"""
from __future__ import annotations

import argparse
import json
import math
import re
import sys
from datetime import datetime
from pathlib import Path
from typing import Any
from urllib.parse import urlparse

REQUIRED = (
    "asset_id",
    "metric_id",
    "value",
    "unit",
    "source_id",
    "source_url",
    "observed_at_utc",
    "retrieved_at_utc",
    "evidence_kind",
)
ALLOWED_KINDS = {"onchain_observation", "provider_metric", "issuer_report", "derived_metric"}
DECIMAL_STRING = re.compile(r"^-?(?:0|[1-9][0-9]*)(?:\\.[0-9]+)?$")


def parse_utc(value: Any, field: str) -> datetime:
    if not isinstance(value, str) or not value.strip():
        raise ValueError(f"{field}: expected non-empty ISO-8601 timestamp")
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError as exc:
        raise ValueError(f"{field}: invalid ISO-8601 timestamp") from exc
    if parsed.tzinfo is None or parsed.utcoffset() is None:
        raise ValueError(f"{field}: timezone offset is required")
    return parsed


def validate_metric(metric: Any, index: int) -> list[str]:
    errors: list[str] = []
    prefix = f"metrics[{index}]"
    if not isinstance(metric, dict):
        return [f"{prefix}: expected object"]
    for field in REQUIRED:
        if field not in metric or metric[field] is None or metric[field] == "":
            errors.append(f"{prefix}.{field}: required")
    if errors:
        return errors

    if metric["asset_id"] not in {"SOL", "CAKE"}:
        errors.append(f"{prefix}.asset_id: expected SOL or CAKE")
    if not isinstance(metric["metric_id"], str) or not metric["metric_id"].strip():
        errors.append(f"{prefix}.metric_id: expected non-empty string")
    if not isinstance(metric["unit"], str) or not metric["unit"].strip():
        errors.append(f"{prefix}.unit: expected non-empty string")
    value = metric["value"]
    if isinstance(value, bool) or not (
        (isinstance(value, (int, float)) and math.isfinite(value))
        or (isinstance(value, str) and DECIMAL_STRING.fullmatch(value))
    ):
        errors.append(f"{prefix}.value: expected finite number or exact decimal string")

    for field in ("source_url", "methodology_url"):
        value_url = metric.get(field)
        if value_url is None and field == "methodology_url":
            continue
        parsed = urlparse(value_url) if isinstance(value_url, str) else None
        if not parsed or parsed.scheme != "https" or not parsed.netloc:
            errors.append(f"{prefix}.{field}: expected absolute HTTPS URL")

    if metric["evidence_kind"] not in ALLOWED_KINDS:
        errors.append(f"{prefix}.evidence_kind: unsupported kind")

    for field in ("observed_at_utc", "retrieved_at_utc"):
        try:
            parse_utc(metric[field], f"{prefix}.{field}")
        except ValueError as exc:
            errors.append(str(exc))

    start, end = metric.get("window_start_utc"), metric.get("window_end_utc")
    if (start is None) != (end is None):
        errors.append(f"{prefix}.window_start_utc/window_end_utc: both must be supplied together")
    elif start is not None:
        try:
            start_dt = parse_utc(start, f"{prefix}.window_start_utc")
            end_dt = parse_utc(end, f"{prefix}.window_end_utc")
            if start_dt >= end_dt:
                errors.append(f"{prefix}.window_start_utc: must be earlier than window_end_utc")
        except ValueError as exc:
            errors.append(str(exc))

    lag = metric.get("freshness_lag_seconds")
    if lag is not None and (isinstance(lag, bool) or not isinstance(lag, int) or lag < 0):
        errors.append(f"{prefix}.freshness_lag_seconds: expected non-negative integer or null")

    for field in ("raw_artifact_ref", "definition"):
        if field in metric and metric[field] is not None and not isinstance(metric[field], str):
            errors.append(f"{prefix}.{field}: expected string or null")
    return errors


def validate_document(document: Any) -> list[str]:
    if not isinstance(document, dict):
        return ["document: expected object"]
    if document.get("schema_version") != "1.0":
        return ["schema_version: expected '1.0'"]
    metrics = document.get("metrics")
    if not isinstance(metrics, list) or not metrics:
        return ["metrics: expected non-empty array"]
    errors: list[str] = []
    for index, metric in enumerate(metrics):
        errors.extend(validate_metric(metric, index))
    return errors


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("artifact", type=Path, help="JSON file containing schema_version and metrics")
    args = parser.parse_args()
    try:
        document = json.loads(args.artifact.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        print(f"invalid artifact: {exc}", file=sys.stderr)
        return 2
    errors = validate_document(document)
    if errors:
        print("\n".join(errors), file=sys.stderr)
        return 1
    print(f"evidence envelope valid: {len(document['metrics'])} metric(s)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
