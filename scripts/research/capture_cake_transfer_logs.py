#!/usr/bin/env python3
"""Read-only CAKE Transfer-log reconciliation for pinned BSC month boundaries.

This script sums ERC-20 Transfer events to/from the conventional dead address
between reviewed boundary blocks. It does not decide circulating-supply policy.
"""
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
    ZERO_ADDRESS,
    rpc_post,
)
from capture_cake_month_end_rpc import BOUNDARY_BLOCK_LOCATORS

TRANSFER_TOPIC = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"


def topic_address(address: str) -> str:
    return "0x" + address.lower().removeprefix("0x").rjust(64, "0")


def utc_now() -> str:
    return dt.datetime.now(dt.timezone.utc).isoformat(timespec="milliseconds").replace("+00:00", "Z")


def get_logs(endpoint: str, start: int, end: int, topics: list[Any]) -> list[dict[str, Any]]:
    response = rpc_post(endpoint, "eth_getLogs", [{
        "address": CAKE_TOKEN,
        "fromBlock": hex(start),
        "toBlock": hex(end),
        "topics": topics,
    }])
    if response.get("ok") is not True or not isinstance(response.get("result"), list):
        raise ValueError(
            f"eth_getLogs failed for blocks {start}-{end}: {response.get('error')}"
        )
    return response["result"]


def query_range(endpoint: str, start: int, end: int, chunk_size: int) -> dict[str, Any]:
    dead_topic = topic_address(BURN_ADDRESS)
    zero_topic = topic_address(ZERO_ADDRESS)
    transfers_to_dead: list[dict[str, Any]] = []
    transfers_from_dead: list[dict[str, Any]] = []
    chunks: list[dict[str, int]] = []

    for chunk_start in range(start, end + 1, chunk_size):
        chunk_end = min(end, chunk_start + chunk_size - 1)
        chunks.append({"from_block": chunk_start, "to_block": chunk_end})
        transfers_to_dead.extend(get_logs(
            endpoint, chunk_start, chunk_end, [TRANSFER_TOPIC, None, dead_topic]
        ))
        transfers_from_dead.extend(get_logs(
            endpoint, chunk_start, chunk_end, [TRANSFER_TOPIC, dead_topic, None]
        ))

    def sum_raw(logs: list[dict[str, Any]]) -> int:
        total = 0
        for log in logs:
            data = log.get("data")
            if not isinstance(data, str) or not data.startswith("0x"):
                raise ValueError("Transfer log is missing a valid data amount")
            total += int(data, 16)
        return total

    # Deduplicate by transaction hash + log index defensively; mint-to-dead logs
    # are a subset of transfers-to-dead and must not be added a second time.
    def dedupe(logs: list[dict[str, Any]]) -> list[dict[str, Any]]:
        by_id: dict[tuple[str, str], dict[str, Any]] = {}
        for log in logs:
            key = (str(log.get("transactionHash", "")).lower(), str(log.get("logIndex", "")).lower())
            by_id[key] = log
        return list(by_id.values())

    transfers_to_dead = dedupe(transfers_to_dead)
    transfers_from_dead = dedupe(transfers_from_dead)
    # Mint-to-dead events are a subset of the already captured to-dead logs.
    # Filter locally to avoid a third historical eth_getLogs request per chunk.
    mints_to_dead = [
        log for log in transfers_to_dead
        if isinstance(log.get("topics"), list)
        and len(log["topics"]) > 1
        and str(log["topics"][1]).lower() == zero_topic.lower()
    ]

    return {
        "from_block_exclusive_boundary_plus_one": start,
        "to_block_inclusive": end,
        "chunk_size_blocks": chunk_size,
        "chunks": chunks,
        "transfer_to_dead_count": len(transfers_to_dead),
        "transfer_from_dead_count": len(transfers_from_dead),
        "mint_directly_to_dead_count": len(mints_to_dead),
        "transfer_to_dead_raw_integer": str(sum_raw(transfers_to_dead)),
        "transfer_from_dead_raw_integer": str(sum_raw(transfers_from_dead)),
        "mint_directly_to_dead_raw_integer": str(sum_raw(mints_to_dead)),
        "net_dead_balance_change_from_logs_raw_integer": str(
            sum_raw(transfers_to_dead) - sum_raw(transfers_from_dead)
        ),
        "transfer_to_dead_logs": transfers_to_dead,
        "transfer_from_dead_logs": transfers_from_dead,
        "mint_directly_to_dead_logs": mints_to_dead,
    }


def capture(endpoint: str = BSC_RPC, chunk_size: int = 20000) -> dict[str, Any]:
    if chunk_size < 1 or chunk_size > 50000:
        raise ValueError("chunk size must be between 1 and 50000 blocks")
    chain = rpc_post(endpoint, "eth_chainId", [])
    if chain.get("ok") is not True or int(chain.get("result", "0x0"), 16) != 56:
        raise ValueError("CAKE Transfer-log capture requires BNB Smart Chain (chain ID 56)")

    started = utc_now()
    intervals = []
    for (start_utc, start_block, start_hash), (end_utc, end_block, end_hash) in zip(
        BOUNDARY_BLOCK_LOCATORS, BOUNDARY_BLOCK_LOCATORS[1:]
    ):
        # State snapshots are pinned at each boundary block. To compare the
        # state difference, logs begin at start_block + 1 and include end_block.
        interval = query_range(endpoint, start_block + 1, end_block, chunk_size)
        interval.update({
            "start_boundary_utc": start_utc,
            "start_boundary_block": start_block,
            "start_boundary_hash": start_hash,
            "end_boundary_utc": end_utc,
            "end_boundary_block": end_block,
            "end_boundary_hash": end_hash,
        })
        intervals.append(interval)

    return {
        "schema_version": "1.0",
        "purpose": "read-only CAKE Transfer event sums for dead-address balance reconciliation; not a circulating-supply determination",
        "started_at_utc": started,
        "finished_at_utc": utc_now(),
        "chain_id": 56,
        "rpc_endpoint": endpoint,
        "token_address": CAKE_TOKEN,
        "transfer_topic0": TRANSFER_TOPIC,
        "dead_address": BURN_ADDRESS,
        "zero_address": ZERO_ADDRESS,
        "interval_convention": "For state snapshots at blocks A and B, include logs from A+1 through B inclusive.",
        "intervals": intervals,
        "limitations": [
            "The sum of Transfer logs to/from the dead address explains its balance delta only if all matching logs are returned by the RPC.",
            "Mint-to-dead is a subset of transfer-to-dead and is reported separately, not added again.",
            "Official monthly reports pro-rate weekly burns and exclude mints that directly contribute to burning; their accounting periods are not identical to UTC month-boundary intervals.",
            "No circulating-supply formula is selected by this capture."
        ],
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", help="Optional path to write raw JSON")
    parser.add_argument("--chunk-size", type=int, default=20000)
    args = parser.parse_args()
    try:
        result = capture(chunk_size=args.chunk_size)
    except (ValueError, TypeError) as exc:
        print(f"CAKE Transfer-log capture failed: {exc}", file=sys.stderr)
        return 1
    rendered = json.dumps(result, indent=2, sort_keys=True)
    print(rendered)
    if args.output:
        with open(args.output, "w", encoding="utf-8") as handle:
            handle.write(rendered + "\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
