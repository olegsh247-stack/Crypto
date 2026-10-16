import test from "node:test";
import assert from "node:assert/strict";
import { buildBtcEtfSnapshot } from "./diff-btc-etf-snapshots.mjs";
import { evaluateBtcEtfResearchEligibility, BTC_ETF_STABILITY_WINDOW_MS } from "./evaluate-btc-etf-research-eligibility.mjs";

const H = "a".repeat(64);
const J = "b".repeat(64);
const K = "c".repeat(64);
const FAR = "https://farside.co.uk/bitcoin-etf-flow-all-data/";
const TFTC = "https://www.tftc.io/bitcoin-etf-flows/data.json";

function snapshot({ at, farside = -484.9, tftc = -487.1, farsideStatus = "CAPTURED", tftcStatus = "CAPTURED", incomplete = false } = {}) {
  const cp = { contract_version: "1", capture_script_sha256: H, farside_parser_sha256: J };
  const np = { contract_version: "1", normalizer_script_sha256: K, farside_parser_sha256: J, metric_registry_sha256: H, capture_provenance: cp };
  const manifest = {
    schema_version: 1, asset_id: "btc", retrieved_at: at, capture_provenance: cp,
    sources: [
      { source_id: "institutional.primary", metric_id: "institutional.etf_net_flow", url: FAR, status: farsideStatus, retrieved_at: at, body_sha256: H,
        latest_rows: [{ period_start: "2026-10-07", status: incomplete ? "INCOMPLETE" : "REPORTED_CANDIDATE", reported_total_usd_million: incomplete ? null : farside,
          calculated_fund_sum_usd_million: incomplete ? null : farside, reconciliation_status: incomplete ? "INCOMPLETE" : "MATCHES_DISPLAY_ROUNDING",
          fund_completeness_status: incomplete ? "UNKNOWN" : "ALL_FUNDS_REPORTED", fund_flows: { IBIT: incomplete ? null : farside } }] },
      { source_id: "institutional.tftc", metric_id: "institutional.etf_net_flow", url: TFTC, status: tftcStatus, retrieved_at: at, body_sha256: J,
        recent_days_in_last_14_days: [{ date: "2026-10-07", netFlowUsd: tftc * 1_000_000, perEtfUsd: { IBIT: tftc * 1_000_000 } }] }
    ]
  };
  const candidates = { mode: "review-only-normalized-candidates", processing_provenance: np };
  return buildBtcEtfSnapshot({ manifest, candidates, manifestBytes: JSON.stringify(manifest), candidatesBytes: JSON.stringify(candidates) });
}

const firstTime = "2026-10-14T10:00:00.000Z";
const after24h = new Date(Date.parse(firstTime) + BTC_ETF_STABILITY_WINDOW_MS).toISOString();

test("allows a review candidate only after two unchanged, complete source captures 24h apart", () => {
  const result = evaluateBtcEtfResearchEligibility(snapshot({ at: firstTime }), snapshot({ at: after24h }), "2026-10-07");
  assert.equal(result.status, "ELIGIBLE_FOR_REVIEW");
  assert.equal(result.reviewer_approval_required, true);
  assert.equal(result.provider_finality_claimed, false);
  assert.deepEqual(result.source_checks.map(x => x.status), ["UNCHANGED", "UNCHANGED"]);
});

test("blocks captures less than 24 hours apart", () => {
  const current = new Date(Date.parse(firstTime) + BTC_ETF_STABILITY_WINDOW_MS - 1).toISOString();
  assert.equal(evaluateBtcEtfResearchEligibility(snapshot({ at: firstTime }), snapshot({ at: current }), "2026-10-07").status, "BLOCKED_STABILITY_WINDOW");
});

test("blocks changed rows without replacing the earlier evidence", () => {
  const result = evaluateBtcEtfResearchEligibility(snapshot({ at: firstTime }), snapshot({ at: after24h, farside: -480 }), "2026-10-07");
  assert.equal(result.status, "BLOCKED_REVISION_CANDIDATE");
  assert.equal(result.source_checks[0].previous_fingerprint !== result.source_checks[0].current_fingerprint, true);
});

test("blocks missing/failed source coverage rather than treating it as zero", () => {
  const result = evaluateBtcEtfResearchEligibility(snapshot({ at: firstTime }), snapshot({ at: after24h, tftcStatus: "FAILED" }), "2026-10-07");
  assert.equal(result.status, "BLOCKED_SOURCE_COVERAGE");
});

test("blocks incomplete rows and does not impute a zero", () => {
  const result = evaluateBtcEtfResearchEligibility(snapshot({ at: firstTime }), snapshot({ at: after24h, incomplete: true }), "2026-10-07");
  assert.equal(result.status, "BLOCKED_INCOMPLETE_ROW");
});

test("keeps independent source values even when they differ", () => {
  const result = evaluateBtcEtfResearchEligibility(snapshot({ at: firstTime }), snapshot({ at: after24h }), "2026-10-07");
  assert.deepEqual(result.source_checks.map(x => x.value_usd_million), [-484.9, -487.1]);
  assert.equal(result.source_checks.some(x => x.value_usd_million === -486), false);
});
