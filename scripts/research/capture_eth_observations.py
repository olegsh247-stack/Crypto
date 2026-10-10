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


def capture() -> dict[str, Any]:
    started = utc_now()
    metrics: list[dict[str, Any]] = []
    requests: dict[str, Any] = {}

    # Binance ticker/price returns a quote but no provider observation timestamp.
    ticker = http_json(BINANCE_TICKER_URL)
    requests["binance_ethusdt_ticker"] = {k: v for k, v in ticker.items() if k != "payload"}
    if ticker.get("ok"):
        payload = ticker.get("payload")
        price = payload.get("price") if isinstance(payload, dict) else None
        if finite_positive(price):
            metrics.append({
                "metric_id": "market.spot_price",
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
                        "metric_id": "ethereum.base_fee_burned",
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

    # Preserve the documented public L2BEAT response for schema inspection. Do not
    # turn an unknown response shape into a numeric observation.
    l2beat = http_json(L2BEAT_TVS_URL)
    requests["l2beat_tvs"] = {k: v for k, v in l2beat.items() if k != "payload"}
    l2beat_payload = l2beat.get("payload")
    l2beat_shape = type(l2beat_payload).__name__ if l2beat.get("ok") else "unavailable"
    requests["l2beat_tvs"]["payload_shape"] = l2beat_shape
    requests["l2beat_tvs"]["note"] = "Raw response intentionally not mapped to a numeric observation until the API schema, time range, aggregation and units are validated."

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
                "metric_id": "ethereum.net_supply_flow",
                "status": "not_captured",
                "reason": "Requires verified daily issuance and burn methodology and a documented source; do not infer net flow from incomplete components."
            },
            {
                "metric_id": "ethereum.l2_total_value_secured",
                "status": "raw_response_only",
                "reason": "L2BEAT endpoint is documented, but its response schema, universe, time semantics and USD aggregation must be validated before numeric mapping.",
                "source_url": "https://api.l2beat.com/docs/"
            },
            {
                "metric_id": "ethereum.staking_entry_queue",
                "status": "not_captured",
                "reason": "A public source with verified endpoint, units and post-Pectra queue semantics has not yet been selected."
            },
            {
                "metric_id": "ethereum.staking_exit_queue",
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
