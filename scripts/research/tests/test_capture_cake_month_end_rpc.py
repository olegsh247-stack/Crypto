import unittest
from unittest.mock import patch

from capture_cake_month_end_rpc import find_block_at_or_before_timestamp, parse_utc_epoch, pool_accounting_consistent, verify_pinned_boundary_block


class HistoricalBlockSelectionTests(unittest.TestCase):
    def test_selects_greatest_block_at_or_before_target(self):
        def fake_rpc(endpoint, method, params):
            if method == "eth_getBlockByNumber":
                number = int(params[0], 16)
                return {"ok": True, "result": {"number": hex(number), "timestamp": hex(number * 10), "hash": f"0x{number:064x}"}}
            raise AssertionError(f"unexpected RPC method: {method}")

        with patch("capture_cake_month_end_rpc.rpc_post", side_effect=fake_rpc):
            block = find_block_at_or_before_timestamp("https://rpc.invalid", 55, 10)
        self.assertEqual(int(block["number"], 16), 5)
        self.assertEqual(int(block["timestamp"], 16), 50)

    def test_parses_utc_boundary(self):
        self.assertEqual(parse_utc_epoch("1970-01-01T00:00:10Z"), 10)

    def test_rejects_boundary_without_timezone(self):
        with self.assertRaises(ValueError):
            parse_utc_epoch("2026-06-01T00:00:00")

    def test_pool_accounting_identity(self):
        valid = {
            "available": {"raw_integer": 10},
            "balance_of": {"raw_integer": 25},
            "total_boost_debt": {"raw_integer": 15},
        }
        self.assertTrue(pool_accounting_consistent(valid))
        valid["balance_of"]["raw_integer"] = 26
        self.assertFalse(pool_accounting_consistent(valid))

    def test_rejects_pinned_block_hash_mismatch(self):
        def fake_rpc(endpoint, method, params):
            if method == "eth_getBlockByNumber":
                return {"ok": True, "result": {"number": params[0], "timestamp": hex(parse_utc_epoch("2026-06-01T00:00:00Z")), "hash": "0xwrong"}}
            raise AssertionError(f"unexpected RPC method: {method}")

        with patch("capture_cake_month_end_rpc.rpc_post", side_effect=fake_rpc):
            with self.assertRaisesRegex(ValueError, "block hash mismatch"):
                verify_pinned_boundary_block("https://rpc.invalid", "2026-06-01T00:00:00Z", 101590093, "0xexpected")



if __name__ == "__main__":
    unittest.main()
