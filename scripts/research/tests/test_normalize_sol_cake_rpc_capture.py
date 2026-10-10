import unittest

from capture_sol_cake_rpc import POOL_VIEW_SELECTORS
from normalize_sol_cake_rpc_capture import normalize
from validate_evidence_envelope import validate_document


def rpc(value, finished="2026-10-10T10:00:01Z"):
    return {"ok": True, "result": value, "finished_at_utc": finished}


def fixture():
    return {
        "schema_version": "1.0",
        "finished_at_utc": "2026-10-10T10:00:02Z",
        "solana": {
            "getSupply": rpc({"context": {"slot": 12345}, "value": {"circulating": 100250000000, "nonCirculating": 20500000000}}),
            "getInflationRate": rpc({"total": 0.036}),
            "getEpochInfo": rpc({"epoch": 100}),
            "getVoteAccounts": rpc({"current": [], "delinquent": []}),
            "derived_vote_account_totals": {"current_activated_stake_lamports": 2500000000},
        },
        "bsc_cake": {
            "eth_chainId": rpc("0x38"),
            "eth_call_block_tag": "0x100",
            "totalSupply": {**rpc("0x3635c9adc5dea00000"), "raw_integer": 1000000000000000000000},
            "decimals": {**rpc("0x12"), "raw_integer": 18},
            "balances": {
                "burn_address": {**rpc("0x1bc16d674ec80000"), "raw_integer": 2000000000000000000},
                "legacy_cake_pool_balance": {**rpc("0x29a2241af62c0000"), "raw_integer": 3000000000000000000},
            },
            "cake_pool_state": {
                "total_locked_amount": {**rpc("0x2c68af0bb1400000"), "raw_integer": 3200000000000000000},
                "total_shares": {**rpc("0x3635c9adc5dea00000"), "raw_integer": 1000000000000000000000},
                "available": {**rpc("0x1bc16d674ec80000"), "raw_integer": 2000000000000000000},
                "balance_of": {**rpc("0x29a2241af62c0000"), "raw_integer": 3000000000000000000},
                "total_boost_debt": {**rpc("0x1bc16d674ec80000"), "raw_integer": 2000000000000000000},
            },
        },
    }


class NormalizeCaptureTests(unittest.TestCase):
    def test_legacy_pool_getter_selectors_match_verified_signatures(self):
        self.assertEqual(POOL_VIEW_SELECTORS["total_locked_amount"], ("totalLockedAmount()", "0x05a9f274"))
        self.assertEqual(POOL_VIEW_SELECTORS["total_shares"], ("totalShares()", "0x3a98ef39"))
        self.assertEqual(POOL_VIEW_SELECTORS["available"], ("available()", "0x48a0d754"))
        self.assertEqual(POOL_VIEW_SELECTORS["balance_of"], ("balanceOf()", "0x722713f7"))
        self.assertEqual(POOL_VIEW_SELECTORS["total_boost_debt"], ("totalBoostDebt()", "0x7d5e81e2"))

    def test_normalizes_capture_and_preserves_context(self):
        result = normalize(fixture(), "actions-run:fixture")
        self.assertEqual(result["schema_version"], "1.0")
        self.assertEqual(validate_document(result), [])
        metrics = {m["metric_id"]: m for m in result["metrics"]}
        self.assertEqual(metrics["circulating_supply"]["value"], "100.25")
        self.assertEqual(metrics["non_circulating_supply"]["value"], "20.5")
        self.assertIn("lamports divided by 1e9", metrics["circulating_supply"]["definition"])
        self.assertIn("slot 12345", metrics["circulating_supply"]["definition"])
        self.assertEqual(metrics["contract_total_supply"]["value"], "1000")
        self.assertEqual(metrics["burn_address_balance"]["value"], "2")
        self.assertEqual(metrics["legacy_cake_pool_balance"]["value"], "3")
        self.assertIn("legacy CAKE Pool", metrics["legacy_cake_pool_balance"]["definition"])
        self.assertEqual(metrics["contract_supply_minus_burn_address"]["value"], "998")
        self.assertEqual(metrics["legacy_cake_pool_total_locked_amount"]["value"], "3.2")
        self.assertEqual(metrics["legacy_cake_pool_total_shares"]["value"], "1000")
        self.assertEqual(metrics["legacy_cake_pool_total_shares"]["unit"], "pool_shares")
        self.assertEqual(metrics["legacy_cake_pool_available"]["value"], "2")
        self.assertEqual(metrics["legacy_cake_pool_balance_of"]["value"], "3")
        self.assertEqual(metrics["legacy_cake_pool_total_boost_debt"]["value"], "2")
        self.assertIn("direct CAKE balance plus totalBoostDebt", metrics["legacy_cake_pool_balance_of"]["definition"])
        self.assertIn("not by itself a permanently burned", metrics["legacy_cake_pool_total_locked_amount"]["definition"])
        self.assertEqual(metrics["contract_total_supply"]["raw_artifact_ref"], "actions-run:fixture")

    def test_rejects_non_integer_get_supply_units(self):
        data = fixture()
        data["solana"]["getSupply"]["result"]["value"]["circulating"] = 100.25
        with self.assertRaisesRegex(ValueError, "integer lamport counts"):
            normalize(data, "fixture")

    def test_rejects_wrong_chain_id(self):
        data = fixture()
        data["bsc_cake"]["eth_chainId"] = rpc("0x1")
        with self.assertRaisesRegex(ValueError, "chain ID"):
            normalize(data, "fixture")

    def test_rejects_unpinned_cake_block(self):
        data = fixture()
        data["bsc_cake"]["eth_call_block_tag"] = "latest"
        with self.assertRaisesRegex(ValueError, "pinned"):
            normalize(data, "fixture")


if __name__ == "__main__":
    unittest.main()
