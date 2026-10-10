#!/usr/bin/env python3
"""Read-only ETH observation capture for rehearsal.

This script only calls public read endpoints and writes a local JSON artifact.
It does not connect to a database, authenticate to application services, sign
transactions, or write to a blockchain. Unavailable/unverified metrics are
reported as gaps rather than fabricated values.
"""
from __future__ import annotations

import argparse
import datetime as dt
import json
from decimal import Decimal, InvalidOperation
import math
import os
import re
import sys
import urllib.error
import urllib.request
from typing import Any

BINANCE_TICKER_URL = "https://data-api.binance.vision/api/v3/ticker/price?symbol=ETHUSDT"
ETHEREUM_RPC_URL = os.environ.get("ETHEREUM_RPC_URL", "https://ethereum-rpc.publicnode.com")
L2BEAT_TVS_URL = "https://api.l2beat.com/v1/tvs"
ETHSUPPLY_LIVE_URL = "https://ethsupply.fyi/api/live"
ETHSUPPLY_HISTORY_URL = "https://ethsupply.fyi/api/history?range=30d"
USER_AGENT = "Crypto-ETH-readonly-capture/1.0"


def utc_now() -> str:
    return dt.datetime.now(dt.timezone.utc).isoformat(timespec="milliseconds").replace("+00:00", "Z")


def http_json(url: str, method: str = "GET", body: dict[str, Any] | None = None) -> dict[str, Any]:
    payload = json.dumps(body).encode("utf-8") if body is not None else None
    request = urllib.request.Request(
        url,
        data=payload,
        method=method,
        headers={
            "Accept": "application/json",
            "User-Agent": USER_AGENT,
            **({"Content-Type": "application/json"} if payload is not None else {}),
        },
    )
    started = utc_now()
    try:
        with urllib.request.urlopen(request, timeout=20) as response:
            raw = response.read()
            finished = utc_now()
            parsed = json.loads(raw.decode("utf-8"))
            return {
                "ok": True,
                "http_status": response.status,
                "started_at_utc": started,
                "finished_at_utc": finished,
                "payload": parsed,
            }
    except (urllib.error.URLError, TimeoutError, ValueError, OSError) as exc:
        return {
            "ok": False,
            "started_at_utc": started,
            "finished_at_utc": utc_now(),
            "error": f"{type(exc).__name__}: {exc}",
        }


def rpc(method: str, params: list[Any]) -> dict[str, Any]:
    return http_json(
        ETHEREUM_RPC_URL,
        method="POST",
        body={"jsonrpc": "2.0", "id": 1, "method": method, "params": params},
    )


def finite_positive(value: Any) -> bool:
    try:
        number = float(value)
        return math.isfinite(number) and number > 0
    except (TypeError, ValueError):
        return False



def _unix_utc(value: Any) -> str | None:
    if not isinstance(value, (int, float)) or isinstance(value, bool) or not math.isfinite(float(value)):
        return None
    try:
        return dt.datetime.fromtimestamp(float(value), tz=dt.timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")
    except (OverflowError, OSError, ValueError):
        return None


def _data_value_shape(value: Any) -> dict[str, Any]:
    if not isinstance(value, dict):
        return {"present": value is not None, "object": False}
    as_of = value.get("asOf")
    age = None
    if isinstance(as_of, (int, float)) and not isinstance(as_of, bool) and math.isfinite(float(as_of)):
        age = int(dt.datetime.now(dt.timezone.utc).timestamp() - float(as_of))
    return {
        "present": True,
        "object": True,
        "has_value": value.get("value") is not None,
        "status": value.get("status"),
        "kind": value.get("kind"),
        "as_of_utc": _unix_utc(as_of),
        "as_of_age_seconds": age,
        "stale_over_one_hour": age is None or age > 3600,
        "sources_count": len(value.get("sources", [])) if isinstance(value.get("sources"), list) else None,
        "sources": value.get("sources", [])[:10] if isinstance(value.get("sources"), list) else [],
        "sources_truncated": isinstance(value.get("sources"), list) and len(value.get("sources", [])) > 10,
    }


def probe_ethsupply(url: str, kind: str) -> tuple[dict[str, Any], dict[str, Any] | None]:
    """Probe the documented public API without storing its full response or deriving metrics."""
    response = http_json(url)
    summary = {k: v for k, v in response.items() if k != "payload"}
    if not response.get("ok"):
        summary["schema_probe"] = {"kind": kind, "status": "unavailable"}
        return summary, None

    payload = response.get("payload")
    if not isinstance(payload, dict):
        summary["schema_probe"] = {"kind": kind, "status": "invalid_payload_type"}
        return summary, None

    generated_at = payload.get("generatedAt")
    generated_at_utc = _unix_utc(generated_at)
    generated_age = None
    if isinstance(generated_at, (int, float)) and not isinstance(generated_at, bool) and math.isfinite(float(generated_at)):
        generated_age = int(dt.datetime.now(dt.timezone.utc).timestamp() - float(generated_at))

    probe: dict[str, Any] = {
        "kind": kind,
        "status": "schema_probe_only",
        "top_level_keys": sorted(str(k) for k in payload.keys()),
        "schema_version": payload.get("schemaVersion"),
        "revision": payload.get("revision"),
        "generated_at_utc": generated_at_utc,
        "generated_age_seconds": generated_age,
        "stale_over_one_hour": generated_age is None or generated_age > 3600,
        "warning_count": len(payload.get("warnings", [])) if isinstance(payload.get("warnings"), list) else None,
        "warning_codes": sorted({str(w.get("code")) for w in payload.get("warnings", []) if isinstance(w, dict) and w.get("code")})[:20] if isinstance(payload.get("warnings"), list) else [],
    }

    if kind == "live":
        head = payload.get("head") if isinstance(payload.get("head"), dict) else {}
        finalized = payload.get("finalized") if isinstance(payload.get("finalized"), dict) else {}
        supply = payload.get("supply") if isinstance(payload.get("supply"), dict) else {}
        supply_as_of = supply.get("asOf") if isinstance(supply.get("asOf"), dict) else {}
        accounting = payload.get("accounting") if isinstance(payload.get("accounting"), dict) else {}
        issuance = accounting.get("issuance") if isinstance(accounting.get("issuance"), dict) else {}
        burn = accounting.get("burn") if isinstance(accounting.get("burn"), dict) else {}
        probe.update({
            "head": {
                "block": head.get("block"),
                "slot": head.get("slot"),
                "timestamp_utc": _unix_utc(head.get("timestamp")),
            },
            "finalized": {
                "block": finalized.get("block"),
                "slot": finalized.get("slot"),
                "epoch": finalized.get("epoch"),
            },
            "supply_as_of": {
                "block": supply_as_of.get("block"),
                "slot": supply_as_of.get("slot"),
                "timestamp_utc": _unix_utc(supply_as_of.get("timestamp")),
            },
            "data_value_shapes": {
                "supply.totalWei": _data_value_shape(supply.get("totalWei")),
                "supply.executionNetIssuanceWei": _data_value_shape(supply.get("executionNetIssuanceWei")),
                "supply.consensusNetIssuanceWei": _data_value_shape(supply.get("consensusNetIssuanceWei")),
                "accounting.netWei": _data_value_shape(accounting.get("netWei")),
                "accounting.issuance.totalWei": _data_value_shape(issuance.get("totalWei")),
                "accounting.burn.totalWei": _data_value_shape(burn.get("totalWei")),
                "accounting.burn.baseFeeWei": _data_value_shape(burn.get("baseFeeWei")),
                "accounting.burn.blobBaseFeeWei": _data_value_shape(burn.get("blobBaseFeeWei")),
            },
        })
    else:
        coverage = payload.get("coverage") if isinstance(payload.get("coverage"), dict) else {}
        epochs = payload.get("epochs") if isinstance(payload.get("epochs"), list) else []
        slots = payload.get("slots") if isinstance(payload.get("slots"), list) else []
        staking = payload.get("staking") if isinstance(payload.get("staking"), list) else []
        queue_waits = payload.get("queueWaits") if isinstance(payload.get("queueWaits"), list) else []
        validator_types = payload.get("validatorTypes") if isinstance(payload.get("validatorTypes"), list) else []
        epoch_sample = epochs[0] if epochs and isinstance(epochs[0], dict) else {}
        slot_sample = slots[0] if slots and isinstance(slots[0], dict) else {}
        staking_sample = staking[0] if staking and isinstance(staking[0], dict) else {}
        queue_sample = queue_waits[0] if queue_waits and isinstance(queue_waits[0], dict) else {}
        history_summary = payload.get("summary") if isinstance(payload.get("summary"), dict) else {}
        probe.update({
            "range": payload.get("range"),
            "interval": payload.get("interval"),
            "interval_epochs": payload.get("intervalEpochs"),
            "interval_slots": payload.get("intervalSlots"),
            "coverage_keys": sorted(str(k) for k in coverage.keys()),
            "coverage": {
                "from_slot": coverage.get("fromSlot"),
                "to_slot": coverage.get("toSlot"),
                "slots": coverage.get("slots"),
                "blocks": coverage.get("blocks"),
                "complete": coverage.get("complete"),
            },
            "point_counts": {
                "epochs": len(epochs),
                "slots": len(slots),
                "staking": len(staking),
                "queue_waits": len(queue_waits),
                "validator_types": len(validator_types),
            },
            "summary_keys": sorted(str(k) for k in history_summary.keys()),
            "sample_field_names": {
                "epoch": sorted(str(k) for k in epoch_sample.keys()),
                "slot": sorted(str(k) for k in slot_sample.keys()),
                "staking": sorted(str(k) for k in staking_sample.keys()),
                "queue_wait": sorted(str(k) for k in queue_sample.keys()),
            },
            "slot_sample_value_types": {
                key: type(slot_sample.get(key)).__name__ if key in slot_sample else "missing"
                for key in ("issuanceWei", "burnWei", "netWei", "baseFeeBurnWei", "blobBaseFeeBurnWei", "gasUsed", "blobsUsed", "fromTimestamp", "toTimestamp", "blocks")
            },
            "staking_sample_value_types": {
                key: type(staking_sample.get(key)).__name__ if key in staking_sample else "missing"
                for key in ("activeBalanceGwei", "activeValidators", "pendingDepositsGwei", "scheduledActivationsGwei", "scheduledExitsGwei", "entryQueueWaitSeconds", "exitQueueWaitSeconds")
            },
            "queue_sample_value_types": {
                key: type(queue_sample.get(key)).__name__ if key in queue_sample else "missing"
                for key in ("entryQueueWaitSeconds", "exitQueueWaitSeconds")
            },
            "summary_value_types": {
                key: type(history_summary.get(key)).__name__ if key in history_summary else "missing"
                for key in ("issuanceWei", "burnWei", "netWei", "baseFeeBurnWei", "blobBaseFeeBurnWei", "gasUsed", "blocks", "fromTimestamp", "toTimestamp")
            },
        })

    summary["schema_probe"] = probe
    return summary, payload


def capture_ethsupply_metrics(payload: dict[str, Any] | None) -> tuple[list[dict[str, Any]], list[dict[str, str]]]:
    """Extract bounded, dated candidate observations from verified 30-epoch history points."""
    metrics: list[dict[str, Any]] = []
    gaps: list[dict[str, str]] = []
    if not isinstance(payload, dict):
        return metrics, [{"metric_id": "eth.supply_history", "status": "not_captured", "reason": "Historical source payload unavailable or invalid."}]
    if payload.get("schemaVersion") != 1 or not isinstance(payload.get("revision"), int) or payload.get("range") != "30d" or payload.get("interval") != "30epochs" or payload.get("intervalSlots") != 960:
        return metrics, [{"metric_id": "eth.supply_history", "status": "not_captured", "reason": "Unexpected range/interval; expected range=30d, interval=30epochs and 960 slots."}]
    coverage = payload.get("coverage") if isinstance(payload.get("coverage"), dict) else {}
    warnings = payload.get("warnings") if isinstance(payload.get("warnings"), list) else []
    generated_at = payload.get("generatedAt")
    generated_age = int(dt.datetime.now(dt.timezone.utc).timestamp() - generated_at) if isinstance(generated_at, (int, float)) and not isinstance(generated_at, bool) else None
    if coverage.get("complete") is not True or generated_age is None or generated_age < 0 or generated_age > 3600 or warnings:
        return metrics, [{"metric_id": "eth.supply_history", "status": "not_captured", "reason": "History incomplete, stale, has provider warnings, or invalid generatedAt."}]

    def iso_unix(value: Any) -> str | None:
        if not isinstance(value, int) or isinstance(value, bool) or value <= 0:
            return None
        try:
            return dt.datetime.fromtimestamp(value, tz=dt.timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")
        except (OverflowError, OSError, ValueError):
            return None

    def scaled_integer(value: Any, scale: int, signed: bool = False) -> str | None:
        pattern = r"-?[0-9]+" if signed else r"[0-9]+"
        if not isinstance(value, str) or not re.fullmatch(pattern, value):
            return None
        try:
            result = Decimal(value) / Decimal(scale)
        except (InvalidOperation, ValueError):
            return None
        if not result.is_finite():
            return None
        text_value = format(result, "f")
        if "." in text_value:
            text_value = text_value.rstrip("0").rstrip(".")
        return text_value or "0"

    source_url = ETHSUPPLY_HISTORY_URL
    quality = "candidate_needs_independent_cross_check"
    methodology_base = f"ethsupply.fyi public 30d history; revision={payload.get('revision')}; generatedAt={iso_unix(generated_at)}; coverageSlots={coverage.get('fromSlot')}..{coverage.get('toSlot')}; 30-epoch aggregate (960 slots); exact integer converted with Decimal; not independently cross-checked."
    slot_specs = [
        ("issuanceWei", "eth.gross_issuance_per_interval", "ETH/interval", False, "Gross issuance reported by provider."),
        ("burnWei", "eth.execution_fee_burn_per_interval", "ETH/interval", False, "Execution fee burn (base-fee plus blob-fee burn) reported by provider; excludes consensus penalties and other execution destruction."),
        ("consensusPenaltiesWei", "eth.consensus_penalties_per_interval", "ETH/interval", False, "Consensus-layer penalties deducted from issuance in the provider interval."),
        ("otherExecutionBurnWei", "eth.other_execution_burn_per_interval", "ETH/interval", False, "Other execution-layer ETH destruction reported for the provider interval, including proven SELFDESTRUCT destruction."),
        ("netWei", "eth.net_supply_flow_per_interval", "ETH/interval", True, "Provider-derived net supply flow; reconcile only over the exact same interval."),
        ("baseFeeBurnWei", "eth.base_fee_burn_per_interval", "ETH/interval", False, "Base-fee burn for the provider interval."),
        ("blobBaseFeeBurnWei", "eth.blob_fee_burn_per_interval", "ETH/interval", False, "Blob base-fee burn for the provider interval."),
    ]
    slots = payload.get("slots") if isinstance(payload.get("slots"), list) else []
    valid_slots = [x for x in slots if isinstance(x, dict) and iso_unix(x.get("fromTimestamp")) and iso_unix(x.get("toTimestamp")) and x.get("toTimestamp", 0) > x.get("fromTimestamp", 0)]
    valid_slots.sort(key=lambda x: x["toTimestamp"])
    recent_slots = valid_slots[-48:]
    latest_end = iso_unix(recent_slots[-1]["toTimestamp"]) if recent_slots else None
    if latest_end and (dt.datetime.now(dt.timezone.utc) - dt.datetime.fromisoformat(latest_end.replace("Z", "+00:00"))).total_seconds() > 3600:
        return [], [{"metric_id": "eth.supply_history", "status": "not_captured", "reason": "Latest history interval is more than one hour behind capture time."}]
    if not recent_slots:
        gaps.append({"metric_id": "eth.supply_history", "status": "not_captured", "reason": "No valid interval rows were present in slots[]."})
    for row in recent_slots:
        start, end = iso_unix(row.get("fromTimestamp")), iso_unix(row.get("toTimestamp"))
        if not start or not end:
            continue
        for field, metric_id, unit, signed, description in slot_specs:
            value = scaled_integer(row.get(field), 10**18, signed=signed)
            if value is None:
                continue
            metrics.append({
                "metric_id": metric_id, "asset_id": "ETH", "value_numeric": value, "unit": unit,
                "observed_at": end, "period_start": start, "period_end": end,
                "source_id": "ethsupply_fyi", "source_url": source_url,
                "methodology": f"{description} Source field={field}; interval bounds retained; provider slots={row.get('fromSlot')}..{row.get('toSlot')}; blocks={row.get('blocks')}. {methodology_base}",
                "quality": quality,
                "source_interval_blocks": row.get("blocks"),
                "source_from_slot": row.get("fromSlot"),
                "source_to_slot": row.get("toSlot"),
            })

    staking = payload.get("staking") if isinstance(payload.get("staking"), list) else []
    staking_rows = [x for x in staking if isinstance(x, dict) and iso_unix(x.get("timestamp"))]
    staking_rows.sort(key=lambda x: x["timestamp"])
    if staking_rows:
        staking_age = dt.datetime.now(dt.timezone.utc).timestamp() - staking_rows[-1]["timestamp"]
        if staking_age > 3600 or staking_age < -300:
            gaps.append({"metric_id": "eth.staking_queue_history", "status": "not_captured", "reason": "Latest staking queue point is stale or future-dated."})
            staking_rows = []
    for row in staking_rows[-48:]:
        observed = iso_unix(row.get("timestamp"))
        if not observed:
            continue
        for field, metric_id, description in (
            ("pendingDepositsGwei", "eth.pending_deposit_queue_eth", "Pending deposit queue balance converted from Gwei to ETH."),
            ("scheduledActivationsGwei", "eth.scheduled_activation_queue_eth", "Scheduled activation balance converted from Gwei to ETH."),
            ("scheduledExitsGwei", "eth.scheduled_exit_queue_eth", "Scheduled exit balance converted from Gwei to ETH."),
        ):
            value = scaled_integer(row.get(field), 10**9)
            if value is None:
                continue
            metrics.append({
                "metric_id": metric_id, "asset_id": "ETH", "value_numeric": value, "unit": "ETH",
                "observed_at": observed, "period_start": None, "period_end": None,
                "source_id": "ethsupply_fyi", "source_url": source_url,
                "methodology": f"{description} Source field={field}; point timestamp retained. {methodology_base}",
                "quality": quality,
            })

    queue_waits = payload.get("queueWaits") if isinstance(payload.get("queueWaits"), list) else []
    queue_rows = [x for x in queue_waits if isinstance(x, dict) and iso_unix(x.get("timestamp"))]
    queue_rows.sort(key=lambda x: x["timestamp"])
    if queue_rows:
        queue_age = dt.datetime.now(dt.timezone.utc).timestamp() - queue_rows[-1]["timestamp"]
        if queue_age > 3600 or queue_age < -300:
            gaps.append({"metric_id": "eth.queue_wait_history", "status": "not_captured", "reason": "Latest queue-wait point is stale or future-dated."})
            queue_rows = []
    for row in queue_rows[-48:]:
        observed = iso_unix(row.get("timestamp"))
        if not observed:
            continue
        for field, metric_id in (("entryQueueWaitSeconds", "eth.entry_queue_wait_seconds"), ("exitQueueWaitSeconds", "eth.exit_queue_wait_seconds")):
            value = row.get(field)
            if not isinstance(value, int) or isinstance(value, bool) or value < 0:
                continue
            metrics.append({
                "metric_id": metric_id, "asset_id": "ETH", "value_numeric": value, "unit": "seconds",
                "observed_at": observed, "period_start": None, "period_end": None,
                "source_id": "ethsupply_fyi", "source_url": source_url,
                "methodology": f"Provider historical {field}; point timestamp retained; not a queue balance or concentration metric. {methodology_base}",
                "quality": quality,
            })

    if len(recent_slots) < 40:
        gaps.append({"metric_id": "eth.supply_history", "status": "partial_capture", "reason": f"Only {len(recent_slots)} valid 30-epoch interval rows available; expected at least 40 for rehearsal."})
    return metrics, gaps


def reconcile_ethsupply_intervals(payload: Any, limit: int = 48) -> dict[str, Any]:
    """Check provider netWei against the exact same interval's published components."""
    slots = payload.get("slots") if isinstance(payload, dict) and isinstance(payload.get("slots"), list) else []
    valid = [
        row for row in slots
        if isinstance(row, dict)
        and _unix_utc(row.get("fromTimestamp"))
        and _unix_utc(row.get("toTimestamp"))
        and row.get("toTimestamp", 0) > row.get("fromTimestamp", 0)
    ]
    valid.sort(key=lambda row: row["toTimestamp"])
    checked = 0
    missing = 0
    mismatches: list[dict[str, str]] = []
    required = ("issuanceWei", "burnWei", "consensusPenaltiesWei", "otherExecutionBurnWei", "netWei")
    for row in valid[-limit:]:
        values: dict[str, int] = {}
        try:
            for field in required:
                raw = row.get(field)
                if not isinstance(raw, str) or not re.fullmatch(r"-?[0-9]+", raw):
                    raise ValueError(field)
                values[field] = int(raw)
        except (ValueError, TypeError):
            missing += 1
            continue
        checked += 1
        expected = values["issuanceWei"] - values["burnWei"] - values["consensusPenaltiesWei"] - values["otherExecutionBurnWei"]
        actual = values["netWei"]
        if expected != actual:
            mismatches.append({
                "period_end": _unix_utc(row.get("toTimestamp")) or "",
                "delta_wei": str(actual - expected),
            })
    status = "exact" if checked > 0 and missing == 0 and not mismatches else ("mismatch" if mismatches else "incomplete")
    return {
        "status": status,
        "formula": "netWei = issuanceWei - burnWei - consensusPenaltiesWei - otherExecutionBurnWei",
        "checked_intervals": checked,
        "exact_matches": checked - len(mismatches),
        "missing_component_intervals": missing,
        "mismatch_count": len(mismatches),
        "mismatches": mismatches[:5],
    }


def capture() -> dict[str, Any]:
    started = utc_now()
    metrics: list[dict[str, Any]] = []
    requests: dict[str, Any] = {}

    # Probe the live and historical API; retain only schema metadata in requests.
    requests["ethsupply_live"], _ = probe_ethsupply(ETHSUPPLY_LIVE_URL, "live")
    requests["ethsupply_history_30d"], history_payload = probe_ethsupply(ETHSUPPLY_HISTORY_URL, "history_30d")
    history_metrics, history_gaps = capture_ethsupply_metrics(history_payload)
    accounting_reconciliation = reconcile_ethsupply_intervals(history_payload)
    requests["ethsupply_history_30d"]["accounting_reconciliation"] = accounting_reconciliation
    if accounting_reconciliation["status"] != "exact":
        history_gaps.append({
            "metric_id": "eth.supply_accounting_reconciliation",
            "status": accounting_reconciliation["status"],
            "reason": "Provider netWei did not reconcile exactly to issuance, execution fee burn, consensus penalties and other execution burn for the same intervals.",
            "details": accounting_reconciliation,
            "source_url": "https://ethsupply.fyi/methodology/",
        })
    metrics.extend(history_metrics)

    # Binance ticker/price returns a quote but no provider observation timestamp.
    ticker = http_json(BINANCE_TICKER_URL)
    requests["binance_ethusdt_ticker"] = {k: v for k, v in ticker.items() if k != "payload"}
    if ticker.get("ok"):
        payload = ticker.get("payload")
        price = payload.get("price") if isinstance(payload, dict) else None
        if finite_positive(price):
            metrics.append({
                "metric_id": "eth.market_spot_price",
                "asset_id": "ETH",
                "value_numeric": float(price),
                "unit": "USDT/ETH",
                "observed_at": ticker["finished_at_utc"],
                "time_semantics": "capture_time_proxy; Binance ticker response has no observation timestamp",
                "period_start": None,
                "period_end": None,
                "source_id": "market_binance",
                "source_url": BINANCE_TICKER_URL,
                "methodology": "Public Binance ETHUSDT ticker/price; quote is USDT, not USD.",
                "quality": "usable_for_rehearsal_only",
            })
        else:
            requests["binance_ethusdt_ticker"]["validation_error"] = "Missing or invalid positive numeric price."

    # Capture a canonical chain block. The computed base-fee burn is not total fees.
    block_number = rpc("eth_blockNumber", [])
    requests["ethereum_block_number"] = {k: v for k, v in block_number.items() if k != "payload"}
    block_hex = None
    if block_number.get("ok") and isinstance(block_number.get("payload"), dict):
        block_hex = block_number["payload"].get("result")
    if isinstance(block_hex, str) and block_hex.startswith("0x"):
        block = rpc("eth_getBlockByNumber", [block_hex, False])
        requests["ethereum_latest_block"] = {k: v for k, v in block.items() if k != "payload"}
        block_data = block.get("payload", {}).get("result") if block.get("ok") and isinstance(block.get("payload"), dict) else None
        if isinstance(block_data, dict):
            try:
                timestamp = dt.datetime.fromtimestamp(int(block_data["timestamp"], 16), tz=dt.timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")
                gas_used = int(block_data["gasUsed"], 16)
                base_fee_wei = int(block_data["baseFeePerGas"], 16)
                burned_eth = base_fee_wei * gas_used / 10**18
                if math.isfinite(burned_eth) and burned_eth >= 0:
                    metrics.append({
                        "metric_id": "eth.base_fee_burned_per_block",
                        "asset_id": "ETH",
                        "value_numeric": burned_eth,
                        "unit": "ETH/block",
                        "observed_at": timestamp,
                        "period_start": timestamp,
                        "period_end": timestamp,
                        "source_id": "ethereum_public_rpc",
                        "source_url": ETHEREUM_RPC_URL,
                        "methodology": "baseFeePerGas × gasUsed from one canonical execution-layer block; excludes priority fees and is not total network fees.",
                        "quality": "single_block_observation_not_daily_series",
                        "source_block_number": int(block_data["number"], 16),
                        "source_block_hash": block_data.get("hash"),
                    })
            except (KeyError, TypeError, ValueError, OverflowError) as exc:
                requests["ethereum_latest_block"]["validation_error"] = f"Required block fields unavailable/invalid: {type(exc).__name__}"
    else:
        requests["ethereum_block_number"]["validation_error"] = "No valid JSON-RPC block number returned."

    # Official L2BEAT API requires an API key in the query string. Do not make
    # unauthenticated calls or place a credential in a CI artifact/log. Keep this
    # source as an explicit gap until a reviewed secret-handling plan exists.
    requests["l2beat_tvs"] = {
        "ok": False,
        "skipped": True,
        "reason": "Official L2BEAT API requires an API key; no credential is configured for this read-only CI capture.",
        "documentation_url": "https://api.l2beat.com/openapi",
        "note": "Do not map TVS to a numeric observation until authenticated access, response schema, range and aggregation are validated."
    }

    return {
        "schema_version": "1.0",
        "artifact_type": "read_only_eth_observation_capture",
        "started_at_utc": started,
        "finished_at_utc": utc_now(),
        "database_write_performed": False,
        "blockchain_write_performed": False,
        "metrics": metrics,
        "requests": requests,
        "unresolved_metric_gaps": history_gaps + [
            {
                "metric_id": "eth.ethsupply_series_validation",
                "status": "candidate_needs_independent_cross_check",
                "reason": "Dated interval, issuance, burn, net-flow and staking queue observations are captured from ethsupply.fyi but must be cross-checked independently before use in signal evaluation.",
                "source_url": "https://ethsupply.fyi/methodology/"
            },
            {
                "metric_id": "eth.l2_total_value_secured",
                "status": "not_captured",
                "reason": "L2BEAT endpoint requires approved API access; its response schema, universe, time semantics and USD aggregation must be validated before numeric mapping.",
                "source_url": "https://api.l2beat.com/docs/"
            },
            {
                "metric_id": "eth.staking_provider_concentration",
                "status": "not_captured",
                "reason": "Withdrawal-credential categories and queue balances are not staking-provider/operator concentration; a separate comparable source and denominator are required."
            },
            {
                "metric_id": "eth.competitive_share",
                "status": "not_captured",
                "reason": "No fixed peer universe and cross-chain comparable activity/fee-share source has been selected."
            }
        ],
        "source_documentation": [
            "https://data-api.binance.vision/api/v3/ticker/price?symbol=ETHUSDT",
            "https://ethereum.org/en/developers/apis/json-rpc/",
            "https://api.l2beat.com/docs/"
        ],
        "guardrails": [
            "This artifact is not a published snapshot or a monitoring evaluation.",
            "Ticker capture time is not represented as a provider-issued observation timestamp.",
            "USDT is not silently relabeled as USD.",
            "One block's base-fee burn is not represented as total fees or a daily fee series.",
            "Provider-derived interval series remain candidates pending independent cross-check; no placeholder numeric values are emitted.",
            "No database, production API, or blockchain writes are performed."
        ]
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", default="eth-observation-capture.json")
    args = parser.parse_args()
    result = capture()
    with open(args.output, "w", encoding="utf-8") as handle:
        json.dump(result, handle, indent=2, ensure_ascii=False)
        handle.write("\n")
    print(json.dumps({
        "output": args.output,
        "metric_count": len(result["metrics"]),
        "database_write_performed": result["database_write_performed"],
        "blockchain_write_performed": result["blockchain_write_performed"],
        "unresolved_metric_gaps": len(result["unresolved_metric_gaps"]),
        "accounting_reconciliation": result["requests"].get("ethsupply_history_30d", {}).get("accounting_reconciliation"),
        "request_statuses": {name: data.get("ok", False) for name, data in result["requests"].items()},
    }, indent=2))
    # Partial captures are useful for diagnosis and must still upload their artifact.
    return 0


if __name__ == "__main__":
    sys.exit(main())
