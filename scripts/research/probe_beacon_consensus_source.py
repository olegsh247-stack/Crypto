#!/usr/bin/env python3
"""Bounded, read-only Beacon API feasibility probe for historical ETH epochs.

This verifies historical finalized-state access and the shape/finality metadata
of one validator's attestation-reward response. It deliberately does NOT claim
complete consensus issuance or penalty accounting.
"""
from __future__ import annotations

import argparse
import datetime as dt
import json
import time
import urllib.error
import urllib.request
from pathlib import Path
from typing import Any

BEACON_URL = "https://ethereum-beacon-api.publicnode.com"
USER_AGENT = "Crypto-ETH-consensus-source-probe/1.0"


class ProbeError(RuntimeError):
    pass


def request_json(path: str, method: str = "GET", body: Any = None, timeout: int = 25) -> dict[str, Any]:
    data = None if body is None else json.dumps(body).encode("utf-8")
    headers = {"Accept": "application/json", "User-Agent": USER_AGENT}
    if data is not None:
        headers["Content-Type"] = "application/json"
    req = urllib.request.Request(BEACON_URL + path, data=data, headers=headers, method=method)
    last: Exception | None = None
    for attempt in range(3):
        try:
            with urllib.request.urlopen(req, timeout=timeout) as response:
                if response.status != 200:
                    raise ProbeError(f"HTTP {response.status} for {path}")
                parsed = json.loads(response.read().decode("utf-8"))
                if not isinstance(parsed, dict):
                    raise ProbeError(f"Non-object JSON response for {path}")
                return parsed
        except urllib.error.HTTPError as exc:
            last = exc
            if exc.code not in (408, 429, 500, 502, 503, 504):
                raise ProbeError(f"HTTP {exc.code} for {path}") from exc
        except (urllib.error.URLError, TimeoutError, json.JSONDecodeError) as exc:
            last = exc
        if attempt < 2:
            time.sleep(0.5 * (attempt + 1))
    raise ProbeError(f"request failed for {path}: {type(last).__name__}") from last


def complete_interval_slots(artifact: dict[str, Any], count: int) -> list[int]:
    metrics = artifact.get("metrics")
    if not isinstance(metrics, list):
        raise ProbeError("capture artifact has no metrics array")
    windows: dict[tuple[int, int], set[str]] = {}
    wanted = {"eth.gross_issuance_per_interval", "eth.consensus_penalties_per_interval"}
    for item in metrics:
        if not isinstance(item, dict) or item.get("metric_id") not in wanted:
            continue
        start, end = item.get("source_from_slot"), item.get("source_to_slot")
        if isinstance(start, int) and isinstance(end, int) and 0 <= start <= end:
            windows.setdefault((start, end), set()).add(str(item["metric_id"]))
    complete = sorted(
        (window for window, found in windows.items() if found == wanted),
        key=lambda window: window[1],
    )
    if not complete:
        raise ProbeError("no aligned issuance/penalty interval slots found in capture artifact")
    n = min(count, len(complete))
    if n == 1:
        selected = [complete[-1]]
    else:
        indices = [round(i * (len(complete) - 1) / (n - 1)) for i in range(n)]
        selected = [complete[i] for i in dict.fromkeys(indices)]
    # Probe the final slot of each 30-epoch interval, which maps to its epoch.
    return [end for _, end in selected]


def validate_response(response: dict[str, Any], label: str) -> dict[str, Any]:
    data = response.get("data")
    if not isinstance(data, dict):
        raise ProbeError(f"{label}: missing object data")
    finalized = response.get("finalized")
    optimistic = response.get("execution_optimistic")
    if not isinstance(finalized, bool) or not isinstance(optimistic, bool):
        raise ProbeError(f"{label}: missing finalized/execution_optimistic booleans")
    return {
        "finalized": finalized,
        "execution_optimistic": optimistic,
        "data_fields": sorted(data.keys()),
    }


def probe_slot(slot: int) -> dict[str, Any]:
    epoch = slot // 32
    state_path = f"/eth/v1/beacon/states/{slot}/finality_checkpoints"
    state = request_json(state_path)
    state_meta = validate_response(state, "historical_state")
    checkpoints = state["data"]
    finalized_checkpoint = checkpoints.get("finalized")
    if not isinstance(finalized_checkpoint, dict) or not isinstance(finalized_checkpoint.get("epoch"), str):
        raise ProbeError("historical_state: missing finalized checkpoint epoch")

    # One public validator index bounds response size; this is a schema/access
    # probe only, not a network-wide sum or a complete protocol accounting total.
    rewards_path = f"/eth/v1/beacon/rewards/attestations/{epoch}"
    rewards = request_json(rewards_path, method="POST", body=["0"])
    reward_meta = validate_response(rewards, "attestation_rewards")
    reward_data = rewards["data"]
    total_rewards = reward_data.get("total_rewards")
    if not isinstance(total_rewards, list):
        raise ProbeError("attestation_rewards: total_rewards is not an array")
    return {
        "slot": slot,
        "epoch": epoch,
        "historical_state_endpoint": state_path,
        "historical_state": state_meta,
        "finalized_checkpoint_epoch": finalized_checkpoint["epoch"],
        "attestation_rewards_endpoint": rewards_path,
        "attestation_rewards": reward_meta,
        "sample_validator_rows_returned": len(total_rewards),
        "complete_accounting_ledger_available": False,
        "interpretation": (
            "historical endpoint access confirmed; attestation rewards are partial evidence only, "
            "not total consensus issuance or all consensus penalties"
        ),
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--artifact", required=True)
    parser.add_argument("--output", default="eth-consensus-source-probe.json")
    parser.add_argument("--interval-count", type=int, default=3)
    args = parser.parse_args()
    now = dt.datetime.now(dt.timezone.utc).isoformat()
    results: list[dict[str, Any]] = []
    try:
        if args.interval_count < 1 or args.interval_count > 5:
            raise ProbeError("interval-count must be between 1 and 5")
        artifact = json.loads(Path(args.artifact).read_text(encoding="utf-8"))
        slots = complete_interval_slots(artifact, args.interval_count)
        for slot in slots:
            try:
                results.append(probe_slot(slot))
            except Exception as exc:
                results.append({
                    "slot": slot,
                    "epoch": slot // 32,
                    "status": "not_evaluable",
                    "reason": f"{type(exc).__name__}: {str(exc)[:240]}",
                })
        accessible = sum(1 for item in results if item.get("historical_state", {}).get("finalized") is True
                         and item.get("historical_state", {}).get("execution_optimistic") is False
                         and item.get("attestation_rewards", {}).get("finalized") is True
                         and item.get("attestation_rewards", {}).get("execution_optimistic") is False)
        result = {
            "status": "historical_partial_source_accessible" if accessible == len(slots) else "not_evaluable",
            "provider": "PublicNode Ethereum Beacon API",
            "base_url": BEACON_URL,
            "captured_at": now,
            "intervals_requested": args.interval_count,
            "intervals_probed": len(results),
            "finalized_non_optimistic_probes": accessible,
            "results": results,
            "complete_consensus_issuance_penalty_accounting_verified": False,
            "database_write_performed": False,
            "blockchain_write_performed": False,
            "decision": "Probe confirms endpoint feasibility only; reward endpoint is not a complete consensus accounting ledger.",
        }
    except Exception as exc:
        result = {
            "status": "not_evaluable",
            "provider": "PublicNode Ethereum Beacon API",
            "base_url": BEACON_URL,
            "captured_at": now,
            "reason": f"{type(exc).__name__}: {str(exc)[:240]}",
            "results": results,
            "complete_consensus_issuance_penalty_accounting_verified": False,
            "database_write_performed": False,
            "blockchain_write_performed": False,
        }
    Path(args.output).write_text(json.dumps(result, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(json.dumps(result, indent=2, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
