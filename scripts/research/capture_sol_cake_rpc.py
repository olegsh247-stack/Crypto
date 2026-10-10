#!/usr/bin/env python3
"""Read-only SOL + CAKE on-chain evidence capture.

Uses public JSON-RPC endpoints only. It never signs transactions or writes to a chain.
All balances are emitted as raw on-chain observations; supply methodology is deliberately
not auto-decided by this script.
"""
from __future__ import annotations

import argparse
import datetime as dt
import json
import os
import sys
import urllib.error
import urllib.request
from typing import Any

SOLANA_RPC = os.environ.get("SOLANA_RPC_URL", "https://api.mainnet-beta.solana.com")
BSC_RPC = os.environ.get("BSC_RPC_URL", "https://bsc-dataseed.binance.org")
CAKE_TOKEN = "0x0e09fabb73bd3ade0a17ecc321fd13a19e81ce82"
BURN_ADDRESS = "0x000000000000000000000000000000000000dead"
ZERO_ADDRESS = "0x0000000000000000000000000000000000000000"
LOCKED_CANDIDATES = {
    "token_contract_self_balance": CAKE_TOKEN,
    "precompile_0x1_balance": "0x0000000000000000000000000000000000000001",
    "precompile_0x2_balance": "0x0000000000000000000000000000000000000002",
}


def utc_now() -> str:
    return dt.datetime.now(dt.timezone.utc).isoformat(timespec="milliseconds").replace("+00:00", "Z")


def rpc_post(endpoint: str, method: str, params: list[Any]) -> dict[str, Any]:
    body = json.dumps({"jsonrpc": "2.0", "id": 1, "method": method, "params": params}).encode()
    request = urllib.request.Request(
        endpoint,
        data=body,
        headers={"Content-Type": "application/json", "Accept": "application/json", "User-Agent": "Crypto-readonly-research-capture/1.0"},
        method="POST",
    )
    started = utc_now()
    try:
        with urllib.request.urlopen(request, timeout=20) as response:
            payload = json.loads(response.read().decode("utf-8"))
        finished = utc_now()
        if "error" in payload:
            return {"method": method, "started_at_utc": started, "finished_at_utc": finished, "ok": False, "error": payload["error"]}
        return {"method": method, "started_at_utc": started, "finished_at_utc": finished, "ok": True, "result": payload.get("result")}
    except (urllib.error.URLError, TimeoutError, ValueError, OSError) as exc:
        return {"method": method, "started_at_utc": started, "finished_at_utc": utc_now(), "ok": False, "error": f"{type(exc).__name__}: {exc}"}


def eth_call(endpoint: str, method: str, data: str, block_tag: str) -> dict[str, Any]:
    result = rpc_post(endpoint, "eth_call", [{"to": CAKE_TOKEN, "data": data}, block_tag])
    result["field"] = method
    if result.get("ok") and result.get("result"):
        try:
            result["raw_integer"] = int(result["result"], 16)
        except (TypeError, ValueError):
            pass
    return result


def cake_balance_call(endpoint: str, label: str, address: str, block_tag: str) -> dict[str, Any]:
    selector = "70a08231"
    data = "0x" + selector + address.lower().removeprefix("0x").rjust(64, "0")
    result = eth_call(endpoint, f"balanceOf({label})", data, block_tag)
    result["address"] = address
    return result


def capture() -> dict[str, Any]:
    started = utc_now()
    sol_methods = [
        ("getSlot", [{"commitment": "finalized"}]),
        ("getEpochInfo", [{"commitment": "finalized"}]),
        ("getSupply", [{"commitment": "finalized"}]),
        ("getVoteAccounts", [{"commitment": "finalized"}]),
        ("getInflationRate", []),
    ]
    sol = {name: rpc_post(SOLANA_RPC, name, params) for name, params in sol_methods}

    bsc_chain_id = rpc_post(BSC_RPC, "eth_chainId", [])
    bsc_block_number = rpc_post(BSC_RPC, "eth_blockNumber", [])
    # Pin every eth_call to the same block so supply and balances are comparable.
    block_tag = bsc_block_number.get("result") if bsc_block_number.get("ok") else "latest"
    bsc = {
        "eth_chainId": bsc_chain_id,
        "eth_blockNumber": bsc_block_number,
        "eth_call_block_tag": block_tag,
        "totalSupply": eth_call(BSC_RPC, "totalSupply", "0x18160ddd", block_tag),
        "decimals": eth_call(BSC_RPC, "decimals", "0x313ce567", block_tag),
        "balances": {
            "burn_address": cake_balance_call(BSC_RPC, "burn_address", BURN_ADDRESS, block_tag),
            "zero_address": cake_balance_call(BSC_RPC, "zero_address", ZERO_ADDRESS, block_tag),
            **{label: cake_balance_call(BSC_RPC, label, address, block_tag) for label, address in LOCKED_CANDIDATES.items()},
        },
    }

    vote_result = sol.get("getVoteAccounts", {}).get("result")
    if isinstance(vote_result, dict):
        current = vote_result.get("current", [])
        delinquent = vote_result.get("delinquent", [])
        sol["derived_vote_account_totals"] = {
            "current_vote_accounts": len(current),
            "delinquent_vote_accounts": len(delinquent),
            "current_activated_stake_lamports": sum(int(item.get("activatedStake", 0)) for item in current),
            "delinquent_activated_stake_lamports": sum(int(item.get("activatedStake", 0)) for item in delinquent),
            "note": "Aggregates raw activatedStake fields from this getVoteAccounts response; not a validator-client concentration measure.",
        }

    errors = []
    for section_name, section in (("solana", sol), ("bsc", bsc)):
        for key, value in section.items():
            if isinstance(value, dict) and value.get("ok") is False:
                errors.append(f"{section_name}.{key}")
            elif isinstance(value, dict) and "balances" in value:
                for balance_key, balance_value in value["balances"].items():
                    if balance_value.get("ok") is False:
                        errors.append(f"{section_name}.balances.{balance_key}")

    return {
        "schema_version": "1.0",
        "purpose": "read-only evidence capture; raw chain data, not a publication-ready snapshot",
        "started_at_utc": started,
        "finished_at_utc": utc_now(),
        "sources": {
            "solana_rpc_endpoint": SOLANA_RPC,
            "solana_methods": ["getSlot", "getEpochInfo", "getSupply", "getVoteAccounts", "getInflationRate"],
            "bsc_rpc_endpoint": BSC_RPC,
            "cake_contract": CAKE_TOKEN,
            "cake_contract_reference": "https://docs.pancakeswap.finance/bridge/bridging",
            "solana_rpc_docs": "https://solana.com/docs/rpc/http",
            "cake_tokenomics_docs": "https://docs.pancakeswap.finance/protocol/cake-tokenomics",
        },
        "solana": sol,
        "bsc_cake": bsc,
        "errors": errors,
        "interpretation_guardrails": [
            "Store raw response and UTC times; do not infer user counts from transaction counts.",
            "getVoteAccounts aggregates are not a validator software-client share metric.",
            "CAKE balances are raw contract reads. Do not subtract candidate locked balances from supply until methodology and addresses are reviewed.",
            "No chain writes, signatures, transactions or database writes are performed.",
        ],
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", help="Optional output path; JSON is always printed to stdout.")
    args = parser.parse_args()
    data = capture()
    rendered = json.dumps(data, indent=2, sort_keys=True)
    print(rendered)
    if args.output:
        with open(args.output, "w", encoding="utf-8") as handle:
            handle.write(rendered + "\n")
    return 1 if data["errors"] else 0


if __name__ == "__main__":
    sys.exit(main())
