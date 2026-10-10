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
import math
import os
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
    return {
        "present": True,
        "object": True,
        "has_value": value.get("value") is not None,
        "status": value.get("status"),
        "kind": value.get("kind"),
        "as_of_utc": _unix_utc(value.get("asOf")),
        "sources_count": len(value.get("sources", [])) if isinstance(value.get("sources"), list) else None,
    }


def probe_ethsupply(url: str, kind: str) -> dict[str, Any]:
    """Probe the documented public API without storing its full response or deriving metrics."""
    response = http_json(url)
    summary = {k: v for k, v in response.items() if k != "payload"}
    if not response.get("ok"):
        summary["schema_probe"] = {"kind": kind, "status": "unavailable"}
        return summary

    payload = response.get("payload")
    if not isinstance(payload, dict):
        summary["schema_probe"] = {"kind": kind, "status": "invalid_payload_type"}
        return summary

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
        staking_sample = staking[0] if staking and isinstance(staking[0], dict) else {}
        queue_sample = queue_waits[0] if queue_waits and isinstance(queue_waits[0], dict) else {}
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
            "sample_field_names": {
                "epoch": sorted(str(k) for k in epoch_sample.keys()),
                "staking": sorted(str(k) for k in staking_sample.keys()),
                "queue_wait": sorted(str(k) for k in queue_sample.keys()),
            },
            "sample_value_types": {
                key: type(epoch_sample.get(key)).__name__ if key in epoch_sample else "missing"
                for key in ("issuanceWei", "burnWei", "netWei", "baseFeeBurnWei", "blobBaseFeeBurnWei", "gasUsed", "blobsUsed")
            },
        })

    summary["schema_probe"] = probe
    return summary


def capture() -> dict[str, Any]:
    started = utc_now()
    metrics: list[dict[str, Any]] = []
    requests: dict[str, Any] = {}

    # Schema/freshness probe only: do not map provider fields into observations yet.
    requests["ethsupply_live"] = probe_ethsupply(ETHSUPPLY_LIVE_URL, "live")
    requests["ethsupply_history_30d"] = probe_ethsupply(ETHSUPPLY_HISTORY_URL, "history_30d")

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
        "unresolved_metric_gaps": [
            {
                "metric_id": "eth.net_supply_flow",
                "status": "not_captured",
                "reason": "Requires verified daily issuance and burn methodology and a documented source; do not infer net flow from incomplete components."
            },
            {
                "metric_id": "eth.l2_total_value_secured",
                "status": "raw_response_only",
                "reason": "L2BEAT endpoint is documented, but its response schema, universe, time semantics and USD aggregation must be validated before numeric mapping.",
                "source_url": "https://api.l2beat.com/docs/"
            },
            {
                "metric_id": "eth.staking_entry_queue",
                "status": "not_captured",
                "reason": "A public source with verified endpoint, units and post-Pectra queue semantics has not yet been selected."
            },
            {
                "metric_id": "eth.staking_exit_queue",
                "status": "not_captured",
                "reason": "Must remain separate from the entry queue; a public source with verified endpoint, units and post-Pectra queue semantics has not yet been selected."
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
            "Unverified metrics remain explicit gaps; no placeholder numeric values are emitted.",
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
        "request_statuses": {name: data.get("ok", False) for name, data in result["requests"].items()},
    }, indent=2))
    # Partial captures are useful for diagnosis and must still upload their artifact.
    return 0


if __name__ == "__main__":
    sys.exit(main())
