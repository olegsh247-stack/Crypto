import unittest

from validate_evidence_envelope import validate_document


def metric():
    return {
        "asset_id": "SOL",
        "metric_id": "circulating_supply",
        "value": "588768304.987148293",
        "unit": "SOL",
        "source_id": "solana_rpc_getSupply",
        "source_url": "https://solana.com/docs/rpc/http/getsupply",
        "methodology_url": "https://solana.com/docs/rpc/http/getsupply",
        "observed_at_utc": "2026-10-09T19:44:30Z",
        "retrieved_at_utc": "2026-10-09T19:44:31Z",
        "evidence_kind": "onchain_observation",
        "window_start_utc": None,
        "window_end_utc": None,
        "freshness_lag_seconds": None,
        "raw_artifact_ref": "actions-run:37982243766",
        "definition": "Circulating supply returned by getSupply at the recorded context slot.",
    }


class EvidenceEnvelopeTests(unittest.TestCase):
    def test_accepts_decimal_string_and_provenance(self):
        self.assertEqual(validate_document({"schema_version": "1.0", "metrics": [metric()]}), [])

    def test_rejects_missing_provenance(self):
        item = metric()
        del item["source_url"]
        self.assertTrue(any("source_url: required" in error for error in validate_document({"schema_version": "1.0", "metrics": [item]})))

    def test_rejects_timezone_naive_timestamp(self):
        item = metric()
        item["observed_at_utc"] = "2026-10-09T19:44:30"
        self.assertTrue(any("timezone offset is required" in error for error in validate_document({"schema_version": "1.0", "metrics": [item]})))

    def test_rejects_inverted_window(self):
        item = metric()
        item["window_start_utc"] = "2026-10-10T00:00:00Z"
        item["window_end_utc"] = "2026-10-09T00:00:00Z"
        self.assertTrue(any("must be earlier" in error for error in validate_document({"schema_version": "1.0", "metrics": [item]})))

    def test_rejects_boolean_as_numeric_value(self):
        item = metric()
        item["value"] = True
        self.assertTrue(any("expected finite number" in error for error in validate_document({"schema_version": "1.0", "metrics": [item]})))


if __name__ == "__main__":
    unittest.main()
