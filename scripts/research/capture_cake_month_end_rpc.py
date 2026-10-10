#!/usr/bin/env python3
"""Read-only historical month-boundary CAKE/CakePool state capture on BSC."""
from __future__ import annotations

import argparse
import datetime as dt
import json
import sys
from typing import Any

from capture_sol_cake_rpc import (
    BSC_RPC,
    BURN_ADDRESS,
    CAKE_TOKEN,
    LEGACY_CAKE_POOL,
    POOL_VIEW_SELECTORS,
    cake_balance_call,
    cake_pool_view_call,
    eth_call,
    rpc_post,
)

BOUNDARY_BLOCK_LOCATORS = (
    ("2026-06-01T00:00:00Z", 101590093, "0x7ec5f3aa41b23d4291504c2367b3279767230641f455c771b5966c9639b0fe62"),
    ("2026-07-01T00:00:00Z", 107345138, "0xa8ab3a63046ba1e1826516c9af618fd2b58a0255524b204e0384b7c2aeb4728b"),
    ("2026-08-01T00:00:00Z", 113293990, "0x9fb9ab8b77a5b803de13d434fdface1d16a7060a3fb8ccea8bc9a63370e01897"),
    ("2026-09-01T00:00:00Z", 119243647, "0x5a12662f9527c4a5ec695e48f10465d63f408f9cdaebf068e97bea269c01df67"),
    ("2026-10-01T00:00:00Z", 125000756, "0x8d758fa165acb0b464e9a6b77b8c060876dbe40f32de7ebfe9e7783f76101021"),
)
BOUNDARIES_UTC = tuple(item[0] for item in BOUNDARY_BLOCK_LOCATORS)


def parse_utc_epoch(value: str) -> int:
    parsed = dt.datetime.fromisoformat(value.replace("Z", "+00:00"))
    if parsed.tzinfo is None or parsed.utcoffset() is None:
        raise ValueError("boundary timestamp must include UTC timezone")
    return int(parsed.timestamp())


def get_block(endpoint: str, number: int) -> dict[str, Any]:
    response = rpc_post(endpoint, "eth_getBlockByNumber", [hex(number), False])
    if response.get("ok") is not True or not isinstance(response.get("result"), dict):
        raise ValueError(f"could not read BSC block {number}: {response.get('error')}")
    block = response["result"]
    if not isinstance(block.get("timestamp"), str):
        raise ValueError(f"BSC block {number} is missing timestamp")
    return block


def find_block_at_or_before_timestamp(endpoint: str, target_timestamp: int, latest_number: int) -> dict[str, Any]:
    """Return the greatest block number whose timestamp is <= target_timestamp."""
    low, high = 0, latest_number
    best: dict[str, Any] | None = None
    while low <= high:
        middle = (low + high) // 2
        block = get_block(endpoint, middle)
        timestamp = int(block["timestamp"], 16)
        if timestamp <= target_timestamp:
            best = block
            low = middle + 1
        else:
            high = middle - 1
    if best is None:
        raise ValueError(f"no BSC block found at or before Unix timestamp {target_timestamp}")
    return best


def verify_pinned_boundary_block(endpoint: str, boundary: str, number: int, expected_hash: str) -> dict[str, Any]:
    block = get_block(endpoint, number)
    actual_hash = block.get("hash")
    actual_timestamp = int(block["timestamp"], 16)
    target_timestamp = parse_utc_epoch(boundary)
    if actual_hash != expected_hash:
        raise ValueError(f"block hash mismatch at {boundary}: expected {expected_hash}, got {actual_hash}")
    if actual_timestamp != target_timestamp:
        raise ValueError(f"block timestamp mismatch at {boundary}: expected {target_timestamp}, got {actual_timestamp}")
    return block


def snapshot_at_block(endpoint: str, block: dict[str, Any]) -> dict[str, Any]:
    block_number = int(block["number"], 16)
    block_tag = hex(block_number)
    state = {
        "block_number": block_number,
        "block_hash": block.get("hash"),
        "block_timestamp_unix": int(block["timestamp"], 16),
        "block_timestamp_utc": dt.datetime.fromtimestamp(
            int(block["timestamp"], 16), tz=dt.timezone.utc
        ).isoformat(timespec="seconds").replace("+00:00", "Z"),
        "eth_call_block_tag": block_tag,
        "totalSupply": eth_call(endpoint, "totalSupply", "0x18160ddd", block_tag),
        "decimals": eth_call(endpoint, "decimals", "0x313ce567", block_tag),
        "balances": {
            "burn_address": cake_balance_call(endpoint, "burn_address", BURN_ADDRESS, block_tag),
            "legacy_cake_pool_balance": cake_balance_call(endpoint, "legacy_cake_pool_balance", LEGACY_CAKE_POOL, block_tag),
        },
        "cake_pool_state": {
            key: cake_pool_view_call(endpoint, signature, selector, block_tag)
            for key, (signature, selector) in POOL_VIEW_SELECTORS.items()
        },
    }
    return state


def capture(endpoint: str = BSC_RPC, boundaries: tuple[str, ...] = BOUNDARIES_UTC) -> dict[str, Any]:
    started = dt.datetime.now(dt.timezone.utc).isoformat(timespec="milliseconds").replace("+00:00", "Z")
    chain = rpc_post(endpoint, "eth_chainId", [])
    latest = rpc_post(endpoint, "eth_blockNumber", [])
    if chain.get("ok") is not True or int(chain.get("result", "0x0"), 16) != 56:
        raise ValueError("historical CAKE capture requires BNB Smart Chain (chain ID 56)")
    if latest.get("ok") is not True:
        raise ValueError(f"could not determine latest BSC block: {latest.get('error')}")
    latest_number = int(latest["result"], 16)
    snapshots = []
    errors: list[str] = []
    locator_by_boundary = {boundary: (number, block_hash) for boundary, number, block_hash in BOUNDARY_BLOCK_LOCATORS}
    for boundary in boundaries:
        if boundary not in locator_by_boundary:
            raise ValueError(f"no reviewed pinned block locator exists for boundary {boundary}")
        number, expected_hash = locator_by_boundary[boundary]
        block = verify_pinned_boundary_block(endpoint, boundary, number, expected_hash)
        snapshot = snapshot_at_block(endpoint, block)
        snapshot["requested_boundary_utc"] = boundary
        snapshot["boundary_offset_seconds"] = snapshot["block_timestamp_unix"] - target
        snapshots.append(snapshot)
        for key in ("totalSupply", "decimals"):
            if snapshot[key].get("ok") is not True:
                errors.append(f"{boundary}.{key}")
        for key, value in snapshot["balances"].items():
            if value.get("ok") is not True:
                errors.append(f"{boundary}.balances.{key}")
        for key, value in snapshot["cake_pool_state"].items():
            if value.get("ok") is not True or not isinstance(value.get("raw_integer"), int):
                errors.append(f"{boundary}.cake_pool_state.{key}")
    finished = dt.datetime.now(dt.timezone.utc).isoformat(timespec="milliseconds").replace("+00:00", "Z")
    return {
        "schema_version": "1.0",
        "purpose": "read-only historical month-boundary CAKE and CakePool accounting capture; not a final circulating-supply determination",
        "started_at_utc": started,
        "finished_at_utc": finished,
        "chain_id": 56,
        "rpc_endpoint": endpoint,
        "cake_token": CAKE_TOKEN,
        "legacy_cake_pool": LEGACY_CAKE_POOL,
        "latest_block_at_capture": latest_number,
        "boundary_selection": "Use previously resolved UTC-boundary block numbers and hashes, verify each hash and exact timestamp against the configured RPC, then query historical state at that pinned block. The block locators were found by binary search in prior read-only runs.",
        "snapshots": snapshots,
        "errors": errors,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", help="Optional path to write the raw JSON capture")
    args = parser.parse_args()
    try:
        result = capture()
    except (ValueError, TypeError) as exc:
        print(f"historical capture failed: {exc}", file=sys.stderr)
        return 1
    rendered = json.dumps(result, indent=2, sort_keys=True)
    print(rendered)
    if args.output:
        with open(args.output, "w", encoding="utf-8") as handle:
            handle.write(rendered + "\n")
    return 1 if result["errors"] else 0


if __name__ == "__main__":
    raise SystemExit(main())
