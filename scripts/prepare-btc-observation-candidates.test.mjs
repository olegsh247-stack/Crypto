import test from "node:test";
import assert from "node:assert/strict";
import { prepareBtcObservationCandidates } from "./prepare-btc-observation-candidates.mjs";

const hash = "b".repeat(64);
const manifest = (overrides = {}) => ({
  schema_version: 1,
  asset_id: "btc",
  retrieved_at: "2026-10-14T16:53:33.900Z",
  production_database_accessed: false,
  production_writes_performed: false,
  sources: [{
    name: "kraken-xbtusd-trades",
    metric_id: "market.spot_price",
    source_id: "market.kraken",
    url: "https://api.kraken.com/0/public/Trades?pair=XBTUSD",
    status: "CAPTURED",
    retrieved_at: "2026-10-14T16:53:33.900Z",
    body_file: "kraken-xbtusd-trades.raw",
    body_sha256: hash,
    source_payload_sha256: hash,
    quote_unit: "USD/BTC",
    latest_trade_price_usd_per_btc: 81826.7,
    latest_trade_observed_at: "2026-10-14T16:53:33.584Z",
    observed_at: "2026-10-14T16:53:33.584Z",
    source_row_key: "XBTUSD:1791996813.584:81826.7:0.001: b",
    methodology: "kraken-public-trades-latest-trade-v1",
    methodology_version: "1",
    ...overrides
  }]
});

test("maps canonical Kraken capture into a review-only normalized observation", () => {
  const result = prepareBtcObservationCandidates(manifest());
  assert.equal(result.candidates.length, 1);
  assert.equal(result.blocked.length, 0);
  const candidate = result.candidates[0];
  assert.equal(candidate.asset_id, "btc");
  assert.equal(candidate.metric_id, "market.spot_price");
  assert.equal(candidate.value_numeric, 81826.7);
  assert.equal(candidate.unit, "USD/BTC");
  assert.equal(candidate.observed_at, "2026-10-14T16:53:33.584Z");
  assert.equal(candidate.retrieved_at, "2026-10-14T16:53:33.900Z");
  assert.equal(candidate.source_payload_sha256, hash);
  assert.equal(candidate.source_updated_at, null);
  assert.equal(candidate.revision, 1);
  assert.equal(candidate.revision_scope, "local_candidate_observation_record");
  assert.equal(candidate.revision_identity_status, "not_a_provider_revision");
  assert.equal(candidate.persistable, false);
  assert.equal(result.production_writes_performed, false);
});

test("blocks capture without a stable row key or valid payload hash", () => {
  const result = prepareBtcObservationCandidates(manifest({ source_row_key: "", source_payload_sha256: "bad" }));
  assert.equal(result.candidates.length, 0);
  assert.deepEqual(result.blocked[0].reasons, ["source_row_key_missing", "source_payload_sha256_missing_or_invalid"]);
});

test("does not accept USDT cross-checks as canonical USD/BTC observations", () => {
  const candidate = manifest({
    source_id: "market.okx",
    url: "https://www.okx.com/api/v5/market/trades?instId=BTC-USDT&limit=500",
    quote_unit: "USDT/BTC"
  });
  const result = prepareBtcObservationCandidates(candidate);
  assert.equal(result.candidates.length, 0);
  assert.ok(result.blocked.some(x => x.source_id === "market.okx"
    && x.reasons.includes("source_not_approved_for_canonical_spot")
    && x.reasons.includes("noncanonical_quote_unit")));
});

test("keeps ETF capture blocked until row-level values and reporting dates are normalized", () => {
  const result = prepareBtcObservationCandidates({
    sources: [{ metric_id: "institutional.etf_net_flow", source_id: "institutional.primary", status: "CAPTURED" }]
  });
  assert.equal(result.candidates.length, 0);
  assert.deepEqual(result.blocked[0].reasons, ["ETF_source_not_canonical_or_capture_missing_parsed_reporting_rows"]);
});

test("blocks a source event timestamp later than the capture retrieval time", () => {
  const result = prepareBtcObservationCandidates(manifest({
    latest_trade_observed_at: "2026-10-14T16:54:00.000Z",
    observed_at: "2026-10-14T16:54:00.000Z",
    retrieved_at: "2026-10-14T16:53:33.900Z",
    http_date: "Wed, 14 Oct 2026 16:53:00 GMT",
    provider_last_modified: "Wed, 14 Oct 2026 16:50:00 GMT",
    etag: '"provider-revision-example"'
  }));
  assert.equal(result.candidates.length, 0);
  assert.ok(result.blocked[0].reasons.includes("source_observation_timestamp_after_retrieval"));
});

test("does not treat HTTP response headers as the metric observation timestamp", () => {
  const result = prepareBtcObservationCandidates(manifest({
    http_date: "Wed, 14 Oct 2026 16:53:34 GMT",
    provider_last_modified: "Wed, 14 Oct 2026 16:50:00 GMT",
    etag: '"provider-revision-example"'
  }));
  assert.equal(result.candidates.length, 1);
  assert.equal(result.candidates[0].observed_at, "2026-10-14T16:53:33.584Z");
  assert.equal(result.candidates[0].retrieved_at, "2026-10-14T16:53:33.900Z");
  assert.equal(result.candidates[0].source_updated_at, null);
});


test("normalizes Farside reporting rows while keeping publication time, provider revision, and finality unknown", () => {
  const result = prepareBtcObservationCandidates({
    retrieved_at: "2026-10-14T19:30:00.000Z",
    sources: [{
      metric_id: "institutional.etf_net_flow",
      source_id: "institutional.primary",
      url: "https://farside.co.uk/bitcoin-etf-flow-all-data/",
      status: "CAPTURED",
      retrieved_at: "2026-10-14T19:30:00.000Z",
      http_date: "Wed, 14 Oct 2026 10:01:30 GMT",
      provider_last_modified: null,
      etag: null,
      body_file: "farside-btc-etf-all-data-page.raw",
      body_sha256: hash,
      source_payload_sha256: hash,
      latest_rows: [
        {
          period_start: "2026-10-13",
          period_end: "2026-10-13",
          status: "REPORTED_CANDIDATE",
          reported_total_usd_million: 175.7,
          calculated_fund_sum_usd_million: 175.7,
          fund_sum_minus_reported_total_usd_million: 0,
          reconciliation_status: "MATCHES_DISPLAY_ROUNDING"
        },
        {
          period_start: "2026-10-14",
          period_end: "2026-10-14",
          status: "UNREPORTED_PLACEHOLDER",
          reported_total_usd_million: 0,
          calculated_fund_sum_usd_million: null,
          fund_sum_minus_reported_total_usd_million: null,
          reconciliation_status: "UNREPORTED"
        }
      ]
    }]
  });
  assert.equal(result.candidates.length, 0);
  assert.equal(result.etf_review_rows.length, 2);
  const reported = result.etf_review_rows[0];
  assert.equal(reported.metric_id, "institutional.etf_net_flow");
  assert.equal(reported.period_start, "2026-10-13");
  assert.equal(reported.value_numeric, 175.7);
  assert.equal(reported.observed_at, null);
  assert.equal(reported.source_updated_at, null);
  assert.equal(reported.retrieved_at, "2026-10-14T19:30:00.000Z");
  assert.equal(reported.http_date, "Wed, 14 Oct 2026 10:01:30 GMT");
  assert.equal(reported.source_row_key, "farside-btc-etf-flow:2026-10-13");
  assert.equal(reported.source_payload_sha256, hash);
  assert.equal(reported.source_payload_hash_scope, "full_http_response_body_not_individual_row");
  assert.equal(reported.provider_revision, null);
  assert.equal(reported.revision_identity_status, "provider_revision_unknown");
  assert.equal(reported.finalization_status, "unknown");
  assert.equal(reported.persistable, false);
  assert.ok(reported.reasons.includes("provider_observation_or_publication_timestamp_unverified"));
  const placeholder = result.etf_review_rows[1];
  assert.equal(placeholder.value_numeric, null);
  assert.ok(placeholder.reasons.includes("unreported_placeholder_not_a_zero_observation"));
  assert.equal(placeholder.persistable, false);
});


test("flags material Farside versus TFTC ETF total deltas without approving either source", () => {
  const result = prepareBtcObservationCandidates({
    sources: [
      {
        metric_id: "institutional.etf_net_flow",
        source_id: "institutional.primary",
        url: "https://farside.co.uk/bitcoin-etf-flow-all-data/",
        status: "CAPTURED",
        source_payload_sha256: hash,
        latest_rows: [{
          period_start: "2026-10-07",
          status: "REPORTED_CANDIDATE",
          reported_total_usd_million: -484.9,
          fund_flows: { BRRR: 0 },
          reconciliation_status: "MATCHES_DISPLAY_ROUNDING"
        }]
      },
      {
        metric_id: "institutional.etf_net_flow",
        source_id: "institutional.tftc",
        url: "https://www.tftc.io/bitcoin-etf-flows/data.json",
        status: "CAPTURED",
        source_payload_sha256: "c".repeat(64),
        updated_through: "2026-10-13",
        recent_days_in_last_14_days: [{
          date: "2026-10-07",
          netFlowUsd: -487067411.5,
          perEtfUsd: { BRRR: -2114298 }
        }]
      }
    ]
  });
  assert.equal(result.etf_cross_source_comparisons.length, 1);
  const comparison = result.etf_cross_source_comparisons[0];
  assert.equal(comparison.period_start, "2026-10-07");
  assert.equal(comparison.source_a_total_usd_million, -484.9);
  assert.equal(comparison.source_b_total_usd_million, -487.0674115);
  assert.equal(comparison.delta_b_minus_a_usd_million, -2.1674115);
  assert.equal(comparison.screening_status, "DELTA_EXCEEDS_SCREENING_BAND");
  assert.equal(comparison.differing_fund_values_usd_million.BRRR, -2.114298);
  assert.equal(comparison.decision, "DIAGNOSTIC_ONLY_NOT_SOURCE_ACCEPTANCE");
  assert.equal(result.candidates.length, 0);
});
