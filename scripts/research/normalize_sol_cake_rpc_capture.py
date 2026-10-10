#!/usr/bin/env python3
"""Normalize a raw SOL/CAKE RPC capture into the Research Evidence Envelope v1."""
from __future__ import annotations

import argparse
import json
import sys
from decimal import Decimal
from pathlib import Path
from typing import Any


SOL_SUPPLY_URL = "https://solana.com/docs/rpc/http/getsupply"
SOL_RPC_URL = "https://solana.com/docs/rpc/http"
CAKE_TOKENOMICS_URL = "https://docs.pancakeswap.finance/protocol/cake-tokenomics"


def require_result(section: dict[str, Any], key: str) -> dict[str, Any]:
    item = section.get(key)
    if not isinstance(item, dict) or item.get("ok") is not True or "result" not in item:
        raise ValueError(f"required successful capture field missing: {key}")
    return item


def decimal_text(value: Any) -> str:
    if isinstance(value, bool) or value is None:
        raise ValueError("expected numeric value")
    result = Decimal(str(value))
    if not result.is_finite():
        raise ValueError("value must be finite")
    return format(result, "f")


def lamports_to_sol(value: Any) -> str:
    # Solana getSupply returns u64 lamport counts, not SOL-denominated decimals.
    if isinstance(value, bool) or not isinstance(value, int) or value < 0:
        raise ValueError("getSupply fields must be non-negative integer lamport counts")
    return format(Decimal(value) / Decimal(10**9), "f")


def make_metric(
    asset_id: str,
    metric_id: str,
    value: str,
    unit: str,
    source_id: str,
    source_url: str,
    observed_at: str,
    retrieved_at: str,
    evidence_kind: str,
    raw_artifact_ref: str,
    definition: str,
    methodology_url: str | None = None,
) -> dict[str, Any]:
    metric = {
        "asset_id": asset_id,
        "metric_id": metric_id,
        "value": value,
        "unit": unit,
        "source_id": source_id,
        "source_url": source_url,
        "observed_at_utc": observed_at,
        "retrieved_at_utc": retrieved_at,
        "evidence_kind": evidence_kind,
        "raw_artifact_ref": raw_artifact_ref,
        "definition": definition,
        "window_start_utc": None,
        "window_end_utc": None,
        "freshness_lag_seconds": None,
    }
    if methodology_url:
        metric["methodology_url"] = methodology_url
    return metric


def normalize(capture: Any, raw_artifact_ref: str) -> dict[str, Any]:
    if not isinstance(capture, dict) or capture.get("schema_version") != "1.0":
        raise ValueError("expected raw capture schema_version '1.0'")
    finished = capture.get("finished_at_utc")
    if not isinstance(finished, str) or not finished:
        raise ValueError("raw capture is missing finished_at_utc")
    sol = capture.get("solana")
    bsc = capture.get("bsc_cake")
    if not isinstance(sol, dict) or not isinstance(bsc, dict):
        raise ValueError("raw capture must contain solana and bsc_cake objects")
    metrics: list[dict[str, Any]] = []

    supply = require_result(sol, "getSupply")
    supply_value = supply["result"].get("value", {})
    if not isinstance(supply_value, dict):
        raise ValueError("getSupply.result.value must be an object")
    slot = supply["result"].get("context", {}).get("slot")
    if slot is None:
        raise ValueError("getSupply context slot is required")
    observed = supply.get("finished_at_utc") or finished
    for field, metric_id in (
        ("circulating", "circulating_supply"),
        ("nonCirculating", "non_circulating_supply"),
    ):
        if field not in supply_value:
            raise ValueError(f"getSupply value is missing {field}")
        metrics.append(make_metric(
            "SOL", metric_id, lamports_to_sol(supply_value[field]), "SOL",
            "solana_rpc_getSupply", SOL_SUPPLY_URL, observed, finished,
            "onchain_observation", raw_artifact_ref,
            f"getSupply {field}; raw integer lamports divided by 1e9 to convert to SOL; finalized context slot {slot}. Raw RPC value preserved in referenced artifact.",
            SOL_SUPPLY_URL,
        ))

    inflation = require_result(sol, "getInflationRate")
    inflation_result = inflation["result"]
    if isinstance(inflation_result, dict) and "total" in inflation_result:
        epoch = require_result(sol, "getEpochInfo")["result"].get("epoch", "unknown")
        metrics.append(make_metric(
            "SOL", "reported_epoch_total_inflation_rate", decimal_text(inflation_result["total"]), "fraction",
            "solana_rpc_getInflationRate", SOL_RPC_URL, inflation.get("finished_at_utc") or finished, finished,
            "onchain_observation", raw_artifact_ref,
            f"RPC-reported total inflation parameter for captured epoch {epoch}; not realized net issuance after burns.",
            SOL_RPC_URL,
        ))

    vote_totals = sol.get("derived_vote_account_totals")
    if isinstance(vote_totals, dict) and "current_activated_stake_lamports" in vote_totals:
        stake_sol = Decimal(str(vote_totals["current_activated_stake_lamports"])) / Decimal(10**9)
        metrics.append(make_metric(
            "SOL", "current_vote_account_activated_stake", format(stake_sol, "f"), "SOL",
            "solana_rpc_getVoteAccounts", SOL_RPC_URL,
            require_result(sol, "getVoteAccounts").get("finished_at_utc") or finished, finished,
            "derived_metric", raw_artifact_ref,
            "Sum of activatedStake over current vote accounts divided by 1e9 lamports/SOL; not unique operator stake or client diversity.",
            SOL_RPC_URL,
        ))

    block_tag = bsc.get("eth_call_block_tag")
    if not isinstance(block_tag, str) or not block_tag.startswith("0x"):
        raise ValueError("CAKE capture is missing a pinned eth_call block tag")
    block_number = int(block_tag, 16)
    chain_id = require_result(bsc, "eth_chainId").get("result")
    if int(chain_id, 16) != 56:
        raise ValueError("CAKE capture chain ID is not BNB Smart Chain (56)")
    total = require_result(bsc, "totalSupply")
    decimals = require_result(bsc, "decimals")
    total_raw = total.get("raw_integer")
    decimals_raw = decimals.get("raw_integer")
    if not isinstance(total_raw, int) or not isinstance(decimals_raw, int) or not 0 <= decimals_raw <= 36:
        raise ValueError("invalid CAKE totalSupply or decimals result")
    scale = Decimal(10) ** decimals_raw
    total_value = Decimal(total_raw) / scale
    bsc_observed = total.get("finished_at_utc") or finished
    metrics.append(make_metric(
        "CAKE", "contract_total_supply", format(total_value, "f"), "CAKE",
        "bsc_eth_call_totalSupply", "https://bscscan.com/token/0x0e09fabb73bd3ade0a17ecc321fd13a19e81ce82",
        bsc_observed, finished, "onchain_observation", raw_artifact_ref,
        f"CAKE totalSupply at BSC block {block_number}, decimals={decimals_raw}; this is not circulating supply.",
        CAKE_TOKENOMICS_URL,
    ))

    balances = bsc.get("balances")
    if not isinstance(balances, dict):
        raise ValueError("CAKE balances object is required")
    burn = require_result(balances, "burn_address")
    burn_raw = burn.get("raw_integer")
    if not isinstance(burn_raw, int):
        raise ValueError("burn-address raw integer is missing")
    burn_value = Decimal(burn_raw) / scale
    metrics.append(make_metric(
        "CAKE", "burn_address_balance", format(burn_value, "f"), "CAKE",
        "bsc_eth_call_balanceOf_burn_address", "https://bscscan.com/token/0x0e09fabb73bd3ade0a17ecc321fd13a19e81ce82",
        burn.get("finished_at_utc") or finished, finished, "onchain_observation", raw_artifact_ref,
        f"CAKE balance at burn address, pinned to BSC block {block_number}.",
        CAKE_TOKENOMICS_URL,
    ))
    legacy_pool = require_result(balances, "legacy_cake_pool_balance")
    legacy_pool_raw = legacy_pool.get("raw_integer")
    if not isinstance(legacy_pool_raw, int):
        raise ValueError("legacy CAKE pool raw balance is missing")
    legacy_pool_value = Decimal(legacy_pool_raw) / scale
    metrics.append(make_metric(
        "CAKE", "legacy_cake_pool_balance", format(legacy_pool_value, "f"), "CAKE",
        "bsc_eth_call_balanceOf_legacy_cake_pool", "https://bscscan.com/token/0x0e09fabb73bd3ade0a17ecc321fd13a19e81ce82",
        legacy_pool.get("finished_at_utc") or finished, finished, "onchain_observation", raw_artifact_ref,
        f"CAKE balance of the historically documented legacy CAKE Pool at BSC block {block_number}; included as a separately observed candidate locked balance pending final methodology reconciliation.",
        CAKE_TOKENOMICS_URL,
    ))
    metrics.append(make_metric(
        "CAKE", "contract_supply_minus_burn_address", format(total_value - burn_value, "f"), "CAKE",
        "derived_bsc_totalSupply_minus_burn_balance", CAKE_TOKENOMICS_URL,
        bsc_observed, finished, "derived_metric", raw_artifact_ref,
        f"totalSupply minus burn-address balance at the same BSC block {block_number}; legacy-pool locked CAKE methodology still requires reconciliation.",
        CAKE_TOKENOMICS_URL,
    ))

    pool_state = bsc.get("cake_pool_state")
    if not isinstance(pool_state, dict):
        raise ValueError("CAKE capture is missing legacy pool state")
    pool_metrics = (
        ("total_locked_amount", "legacy_cake_pool_total_locked_amount", "CAKE", True),
        ("total_shares", "legacy_cake_pool_total_shares", "pool_shares", True),
        ("available", "legacy_cake_pool_available", "CAKE", True),
        ("balance_of", "legacy_cake_pool_balance_of", "CAKE", True),
    )
    pool_url = "https://bscscan.com/address/0x45c54210128a065de780c4b0df3d16664f7f859e"
    for field, metric_id, unit, scaled in pool_metrics:
        item = require_result(pool_state, field)
        raw_value = item.get("raw_integer")
        if not isinstance(raw_value, int) or raw_value < 0:
            raise ValueError(f"legacy CAKE pool raw integer is missing or invalid: {field}")
        value = Decimal(raw_value) / scale if scaled else Decimal(raw_value)
        definition = (
            f"Legacy CakePool {field}() getter at BSC block {block_number}; "
            "raw result is preserved in the referenced capture. This is contract state, "
            "not by itself a permanently burned or circulating-supply amount."
        )
        if field == "total_shares":
            definition += " Shares are scaled by token decimals for readability and are not assumed equivalent to CAKE."
        metrics.append(make_metric(
            "CAKE", metric_id, format(value, "f"), unit,
            f"bsc_eth_call_legacy_cake_pool_{field}", pool_url,
            item.get("finished_at_utc") or finished, finished, "onchain_observation",
            raw_artifact_ref, definition, CAKE_TOKENOMICS_URL,
        ))

    return {"schema_version": "1.0", "metrics": metrics}


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("capture", type=Path, help="Raw JSON capture created by capture_sol_cake_rpc.py")
    parser.add_argument("--raw-artifact-ref", help="Stable reference stored with each normalized metric")
    parser.add_argument("--output", type=Path, help="Optional output path; JSON is always printed to stdout")
    args = parser.parse_args()
    try:
        raw = json.loads(args.capture.read_text(encoding="utf-8"))
        ref = args.raw_artifact_ref or str(args.capture)
        result = normalize(raw, ref)
        from validate_evidence_envelope import validate_document
        errors = validate_document(result)
        if errors:
            raise ValueError("normalized envelope failed validation: " + "; ".join(errors))
    except (OSError, json.JSONDecodeError, ValueError, KeyError, TypeError) as exc:
        print(f"normalization failed: {exc}", file=sys.stderr)
        return 1
    rendered = json.dumps(result, indent=2, sort_keys=True)
    print(rendered)
    if args.output:
        args.output.write_text(rendered + "\n", encoding="utf-8")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
