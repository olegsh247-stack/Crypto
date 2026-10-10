#!/usr/bin/env python3
"""Read-only independent RPC cross-check for one ethsupply.fyi ETH interval.

Recomputes execution base-fee and EIP-4844 blob-fee burn from Ethereum block
headers for the exact provider interval. It never writes to a database or chain.
"""
from __future__ import annotations

import argparse
import concurrent.futures
import datetime as dt
import json
import re
import sys
import time
import urllib.error
import urllib.request
from decimal import Decimal
from pathlib import Path
from typing import Any

RPC_URL = "https://ethereum-rpc.publicnode.com"
BLOB_BASE_FEE_UPDATE_FRACTION = 3_338_477
WEI_PER_ETH = Decimal(10**18)


class RpcError(RuntimeError):
    pass


def post_json(payload: Any, timeout: int = 30) -> Any:
    request = urllib.request.Request(
        RPC_URL,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json", "User-Agent": "Crypto-ETH-source-crosscheck/1.0"},
        method="POST",
    )
    last_error: Exception | None = None
    for attempt in range(3):
        try:
            with urllib.request.urlopen(request, timeout=timeout) as response:
                return json.loads(response.read().decode("utf-8"))
        except urllib.error.HTTPError as exc:
            last_error = exc
            if exc.code not in (408, 429, 500, 502, 503, 504):
                raise RpcError(f"RPC HTTP {exc.code}") from exc
        except (urllib.error.URLError, TimeoutError, json.JSONDecodeError) as exc:
            last_error = exc
        if attempt < 2:
            time.sleep(0.5 * (attempt + 1))
    raise RpcError(f"RPC request failed after retries: {type(last_error).__name__}") from last_error


def rpc_call(method: str, params: list[Any]) -> Any:
    response = post_json({"jsonrpc": "2.0", "id": 1, "method": method, "params": params})
    if not isinstance(response, dict) or response.get("error") or "result" not in response:
        raise RpcError(f"RPC method failed: {method}")
    return response["result"]


def hex_int(value: Any, field: str) -> int:
    if not isinstance(value, str) or not re.fullmatch(r"0x[0-9a-fA-F]+", value):
        raise RpcError(f"Invalid RPC field: {field}")
    return int(value, 16)


def block_by_number(number: int) -> dict[str, Any]:
    result = rpc_call("eth_getBlockByNumber", [hex(number), False])
    if not isinstance(result, dict):
        raise RpcError(f"Missing block {number}")
    return result


def fake_exponential(factor: int, numerator: int, denominator: int) -> int:
    """EIP-4844 fake_exponential, using integer arithmetic only."""
    i = 1
    output = 0
    numerator_accum = factor * denominator
    while numerator_accum > 0:
        output += numerator_accum
        numerator_accum = (numerator_accum * numerator) // (denominator * i)
        i += 1
    return output // denominator


def iso_epoch(value: Any) -> int:
    if not isinstance(value, str):
        raise ValueError("timestamp must be an ISO-8601 string")
    normalized = value.replace("Z", "+00:00")
    parsed = dt.datetime.fromisoformat(normalized)
    if parsed.tzinfo is None:
        raise ValueError("timestamp must include a timezone")
    return int(parsed.timestamp())


def eth_decimal_to_wei(value: Any) -> int:
    if not isinstance(value, str) or not re.fullmatch(r"-?(0|[1-9][0-9]*)(?:\.[0-9]{1,18})?", value):
        raise ValueError("ETH value must be a decimal string with at most 18 fractional digits")
    scaled = Decimal(value) * WEI_PER_ETH
    if scaled != scaled.to_integral_value():
        raise ValueError("ETH value cannot be represented exactly in wei")
    return int(scaled)


def first_block_at_or_after(target: int, latest: int, cache: dict[int, dict[str, Any]]) -> int:
    low, high = 0, latest
    while low < high:
        mid = (low + high) // 2
        block = cache.setdefault(mid, block_by_number(mid))
        timestamp = hex_int(block.get("timestamp"), "timestamp")
        if timestamp >= target:
            high = mid
        else:
            low = mid + 1
    return low


def last_block_at_or_before(target: int, latest: int, cache: dict[int, dict[str, Any]]) -> int:
    low, high = 0, latest
    while low < high:
        mid = (low + high + 1) // 2
        block = cache.setdefault(mid, block_by_number(mid))
        timestamp = hex_int(block.get("timestamp"), "timestamp")
        if timestamp <= target:
            low = mid
        else:
            high = mid - 1
    return low


def batch_blocks(numbers: list[int]) -> list[dict[str, Any]]:
    output: dict[int, dict[str, Any]] = {}
    for offset in range(0, len(numbers), 40):
        chunk = numbers[offset:offset + 40]
        payload = [
            {"jsonrpc": "2.0", "id": number, "method": "eth_getBlockByNumber", "params": [hex(number), False]}
            for number in chunk
        ]
        try:
            response = post_json(payload, timeout=45)
            if not isinstance(response, list):
                raise RpcError("RPC provider does not support JSON-RPC batches")
            for item in response:
                if not isinstance(item, dict) or item.get("error") or not isinstance(item.get("result"), dict):
                    raise RpcError("Incomplete JSON-RPC batch response")
                output[int(item["id"])] = item["result"]
        except RpcError as exc:
            # Some public RPC gateways disable batch requests; fall back to bounded
            # concurrency only for a batch-shape/unsupported response, not HTTP 429.
            if "HTTP 429" in str(exc) or "after retries" in str(exc):
                raise
            with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
                futures = {pool.submit(block_by_number, number): number for number in chunk}
                for future in concurrent.futures.as_completed(futures):
                    output[futures[future]] = future.result()
    if any(number not in output for number in numbers):
        raise RpcError("Missing block results after batch retrieval")
    return [output[number] for number in numbers]


def choose_latest_window(metrics: list[dict[str, Any]]) -> tuple[dict[str, Any], dict[str, Any]]:
    by_window: dict[tuple[str, str], dict[str, dict[str, Any]]] = {}
    for metric in metrics:
        metric_id = metric.get("metric_id")
        if metric_id not in ("eth.base_fee_burn_per_interval", "eth.blob_fee_burn_per_interval"):
            continue
        start, end = metric.get("period_start"), metric.get("period_end")
        if not isinstance(start, str) or not isinstance(end, str):
            continue
        by_window.setdefault((start, end), {})[metric_id] = metric
    complete = [
        (window, values) for window, values in by_window.items()
        if "eth.base_fee_burn_per_interval" in values and "eth.blob_fee_burn_per_interval" in values
    ]
    if not complete:
        raise ValueError("artifact has no same-window base-fee and blob-fee metrics")
    window, values = max(complete, key=lambda item: iso_epoch(item[0][1]))
    base = values["eth.base_fee_burn_per_interval"]
    blob = values["eth.blob_fee_burn_per_interval"]
    for metric in (base, blob):
        for field in ("source_interval_blocks", "source_from_slot", "source_to_slot"):
            if not isinstance(metric.get(field), int) or metric[field] < 0:
                raise ValueError(f"missing provider interval lineage: {field}")
    if any(base[field] != blob[field] for field in ("source_interval_blocks", "source_from_slot", "source_to_slot")):
        raise ValueError("provider lineage differs between base-fee and blob-fee metrics")
    return base, blob


def crosscheck(artifact: dict[str, Any]) -> dict[str, Any]:
    metrics = artifact.get("metrics")
    if not isinstance(metrics, list):
        raise ValueError("artifact metrics missing")
    base, blob = choose_latest_window(metrics)
    start_text, end_text = base["period_start"], base["period_end"]
    start, end = iso_epoch(start_text), iso_epoch(end_text)
    if end <= start:
        raise ValueError("invalid provider interval bounds")

    latest_number = hex_int(rpc_call("eth_blockNumber", []), "latest block number")
    cache: dict[int, dict[str, Any]] = {}
    # Keep latest block in cache and prove the target interval is not in the future.
    cache[latest_number] = block_by_number(latest_number)
    latest_timestamp = hex_int(cache[latest_number].get("timestamp"), "latest timestamp")
    if latest_timestamp < end:
        raise RpcError("latest RPC block is earlier than the provider interval end")

    first = first_block_at_or_after(start, latest_number, cache)
    last = last_block_at_or_before(end, latest_number, cache)
    if first > last or last > latest_number:
        raise RpcError("no execution blocks found inside the provider interval")

    numbers = list(range(first, last + 1))
    blocks = batch_blocks(numbers)
    base_burn_wei = 0
    blob_burn_wei = 0
    for block in blocks:
        timestamp = hex_int(block.get("timestamp"), "timestamp")
        if timestamp < start or timestamp > end:
            raise RpcError("RPC block escaped provider interval boundaries")
        gas_used = hex_int(block.get("gasUsed"), "gasUsed")
        base_fee = hex_int(block.get("baseFeePerGas", "0x0"), "baseFeePerGas")
        base_burn_wei += gas_used * base_fee

        blob_gas_used = hex_int(block.get("blobGasUsed", "0x0"), "blobGasUsed")
        excess_blob_gas = hex_int(block.get("excessBlobGas", "0x0"), "excessBlobGas")
        blob_base_fee = fake_exponential(1, excess_blob_gas, BLOB_BASE_FEE_UPDATE_FRACTION)
        blob_burn_wei += blob_gas_used * blob_base_fee

    expected_blocks = base["source_interval_blocks"]
    provider_base_wei = eth_decimal_to_wei(base["value_numeric"])
    provider_blob_wei = eth_decimal_to_wei(blob["value_numeric"])
    base_delta = base_burn_wei - provider_base_wei
    blob_delta = blob_burn_wei - provider_blob_wei
    count_match = len(blocks) == expected_blocks
    base_match = base_delta == 0
    blob_match = blob_delta == 0
    exact = count_match and base_match and blob_match
    return {
        "status": "matched" if exact else "mismatch",
        "method": "Ethereum JSON-RPC block headers; exact interval bounds; EIP-1559 baseFeePerGas*gasUsed; EIP-4844 fake_exponential blob base fee",
        "provider": "ethsupply.fyi",
        "independent_source": RPC_URL,
        "period_start": start_text,
        "period_end": end_text,
        "provider_slot_range": [base["source_from_slot"], base["source_to_slot"]],
        "provider_block_count": expected_blocks,
        "rpc_block_range": [first, last],
        "rpc_block_count": len(blocks),
        "block_count_match": count_match,
        "provider_base_fee_burn_wei": str(provider_base_wei),
        "rpc_base_fee_burn_wei": str(base_burn_wei),
        "base_fee_delta_wei": str(base_delta),
        "base_fee_match": base_match,
        "provider_blob_fee_burn_wei": str(provider_blob_wei),
        "rpc_blob_fee_burn_wei": str(blob_burn_wei),
        "blob_fee_delta_wei": str(blob_delta),
        "blob_fee_match": blob_match,
        "database_write_performed": False,
        "blockchain_write_performed": False,
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--artifact", required=True)
    parser.add_argument("--output", default="eth-source-crosscheck.json")
    args = parser.parse_args()
    try:
        artifact = json.loads(Path(args.artifact).read_text(encoding="utf-8"))
        result = crosscheck(artifact)
    except Exception as exc:
        result = {
            "status": "not_evaluable",
            "reason": f"{type(exc).__name__}: {exc}",
            "database_write_performed": False,
            "blockchain_write_performed": False,
        }
    Path(args.output).write_text(json.dumps(result, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(json.dumps(result, indent=2, ensure_ascii=False))
    # This is a research artifact, not a merge gate: mismatch/not-evaluable is
    # retained for review and must never be interpreted as a green source verdict.
    return 0


if __name__ == "__main__":
    sys.exit(main())
