import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { assessBtcScenarioReadiness } from "./btc-scenario-readiness.mjs";

const now = new Date("2026-10-12T12:00:00.000Z");
const units = {
  "market.spot_price": "USD/BTC",
  "security.hashrate": "EH/s",
  "security.fee_subsidy_ratio": "ratio",
  "macro.dxy": "index",
  "institutional.etf_net_flow": "USD million/day",
};
const canonicalSources = {
  "market.spot_price": "market.kraken",
  "security.hashrate": "network.primary",
  "security.fee_subsidy_ratio": "network.primary",
  "macro.dxy": "macro.primary",
  "institutional.etf_net_flow": "institutional.primary",
};
const canonicalUrls = {
  "market.spot_price": "https://api.kraken.com/0/public/Trades?pair=XBTUSD",
  "security.hashrate": "https://mempool.space/api/v1/mining/hashrate/1w",
  "security.fee_subsidy_ratio": "https://mempool.space/api/v1/mining/blocks/fees/1w",
  "macro.dxy": "https://example.com/data",
  "institutional.etf_net_flow": "https://farside.co.uk/bitcoin-etf-flow-all-data/",
};
const row = (metric_id, observed_at, value_numeric = 1, sourceId = canonicalSources[metric_id]) => ({
  metric_id, observed_at, value_numeric, freshness: "CURRENT",
  ...(metric_id === "institutional.etf_net_flow" ? {
    period_start: String(observed_at).slice(0, 10),
    funds_reported_count: 12,
    funds_expected_count: 12,
    missing_funds: [],
    fund_completeness_status: "ALL_FUNDS_REPORTED",
    provider_revision: "fixture-r1",
    finalization_status: "final",
  } : {}),
  retrieved_at: String(observed_at),
  source_row_key: metric_id === "institutional.etf_net_flow" ? String(observed_at).slice(0, 10) : `${metric_id}:${observed_at}`,
  source_payload_sha256: "a".repeat(64),
  source_id: sourceId, source_url: canonicalUrls[metric_id],
  source_registered: true, unit: units[metric_id], expected_unit: units[metric_id],
});

function completeInputs() {
  return [
    row("market.spot_price", "2026-10-12T11:00:00.000Z", 80000),
    row("security.hashrate", "2026-10-12T00:00:00.000Z", 1000),
    row("security.fee_subsidy_ratio", "2026-10-11T00:00:00.000Z", 0.2),
    row("macro.dxy", "2026-10-11T00:00:00.000Z", 99),
    ...[
      ["2026-10-12", 10], ["2026-10-11", 20], ["2026-10-10", -5],
      ["2026-10-09", 8], ["2026-10-08", 2],
    ].map(([day, value]) => row("institutional.etf_net_flow", day+"T00:00:00.000Z", value)),
  ];
}

test("fresh inputs still block while no canonical DXY source is approved", () => {
  const result = assessBtcScenarioReadiness(completeInputs(), now);
  assert.equal(result.status, "not_evaluable");
  assert.equal(result.can_persist_scenario_state, false);
  assert.ok(result.blockers.some(x => x.metric_id === "macro.dxy" && x.reason === "source_not_approved_for_metric"));
  assert.equal(result.selected_inputs["market.spot_price"].source_id, "market.kraken");
  assert.equal(result.selected_inputs["institutional.etf_net_flow"].length, 5);
});


test("historical ETF sessions count toward the five-day series even when they are no longer fresh latest inputs", () => {
  const inputs = completeInputs().map(x =>
    x.metric_id === "institutional.etf_net_flow" && x.observed_at < "2026-10-12T00:00:00.000Z"
      ? { ...x, freshness: "STALE" }
      : x);
  const result = assessBtcScenarioReadiness(inputs, now);
  assert.equal(result.status, "not_evaluable");
  assert.ok(result.blockers.some(x => x.metric_id === "macro.dxy" && x.reason === "source_not_approved_for_metric"));
  assert.equal(result.selected_inputs["institutional.etf_net_flow"].length, 5);
});

test("deferred fee/subsidy ratio is not required for the first BTC scenario", () => {
  const inputs = completeInputs().filter(x => x.metric_id !== "security.fee_subsidy_ratio");
  const result = assessBtcScenarioReadiness(inputs, now);
  assert.equal(result.status, "not_evaluable");
  assert.ok(!result.blockers.some(x => x.metric_id === "security.fee_subsidy_ratio"));
});

test("supporting hashrate is not a mandatory directional input", () => {
  const inputs = completeInputs().filter(x => x.metric_id !== "security.hashrate");
  const result = assessBtcScenarioReadiness(inputs, now);
  assert.equal(result.status, "not_evaluable");
  assert.ok(!result.blockers.some(x => x.metric_id === "security.hashrate"));
});

test("spot price must be positive", () => {
  const inputs = completeInputs().map(x => x.metric_id === "market.spot_price" ? { ...x, value_numeric: 0 } : x);
  const result = assessBtcScenarioReadiness(inputs, now);
  assert.equal(result.status, "not_evaluable");
  assert.ok(result.blockers.some(x => x.metric_id === "market.spot_price"));
});

test("stale observation cannot pass even with a source URL", () => {
  const inputs = completeInputs().map(x => x.metric_id === "market.spot_price"
    ? { ...x, observed_at: "2026-10-10T11:00:00.000Z" } : x);
  const result = assessBtcScenarioReadiness(inputs, now);
  assert.equal(result.status, "not_evaluable");
  assert.ok(result.blockers.some(x => x.metric_id === "market.spot_price"));
});

test("ETF flows need five distinct recent days", () => {
  const inputs = completeInputs().filter(x => x.metric_id !== "institutional.etf_net_flow");
  inputs.push(
    row("institutional.etf_net_flow", "2026-10-12T01:00:00.000Z", 10),
    row("institutional.etf_net_flow", "2026-10-12T02:00:00.000Z", 20),
    row("institutional.etf_net_flow", "2026-10-11T00:00:00.000Z", 3),
  );
  const result = assessBtcScenarioReadiness(inputs, now);
  assert.equal(result.status, "not_evaluable");
  assert.ok(result.blockers.some(x => x.metric_id === "institutional.etf_net_flow"));
});

test("stale latest ETF flow blocks instead of falling back to five older current days", () => {
  const inputs = completeInputs().filter(x => x.metric_id !== "institutional.etf_net_flow");
  inputs.push(
    row("institutional.etf_net_flow", "2026-10-12T01:00:00.000Z", 10),
    row("institutional.etf_net_flow", "2026-10-11T01:00:00.000Z", 20),
    row("institutional.etf_net_flow", "2026-10-10T01:00:00.000Z", 30),
    row("institutional.etf_net_flow", "2026-10-09T01:00:00.000Z", 40),
    row("institutional.etf_net_flow", "2026-10-08T01:00:00.000Z", 50),
    { ...row("institutional.etf_net_flow", "2026-10-12T02:00:00.000Z", 60), freshness: "STALE" },
  );
  const result = assessBtcScenarioReadiness(inputs, now);
  assert.equal(result.status, "not_evaluable");
  assert.ok(result.blockers.some(x => x.metric_id === "institutional.etf_net_flow"
    && x.reason === "latest_observation_must_be_current_traceable_and_within_36_hours"));
});

test("future-dated observations are rejected", () => {
  const inputs = completeInputs().map(x => x.metric_id === "market.spot_price"
    ? { ...x, observed_at: "2026-10-13T00:00:00.000Z" } : x);
  const result = assessBtcScenarioReadiness(inputs, now);
  assert.equal(result.status, "not_evaluable");
  assert.ok(result.blockers.some(x => x.metric_id === "market.spot_price"));
});

test("untraceable observations are rejected", () => {
  const inputs = completeInputs().map(x => x.metric_id === "macro.dxy"
    ? { ...x, source_url: null } : x);
  const result = assessBtcScenarioReadiness(inputs, now);
  assert.equal(result.status, "not_evaluable");
  assert.ok(result.blockers.some(x => x.metric_id === "macro.dxy"));
});


test("unregistered source cannot pass even with an HTTPS URL for a required input", () => {
  const inputs = completeInputs().map(x => x.metric_id === "market.spot_price"
    ? { ...x, source_registered: false } : x);
  const result = assessBtcScenarioReadiness(inputs, now);
  assert.equal(result.status, "not_evaluable");
  assert.ok(result.blockers.some(x => x.metric_id === "market.spot_price" && x.reason === "source_not_registered"));
});

test("approved source ID with an unrelated HTTPS URL cannot pass provenance gate", () => {
  const inputs = completeInputs().map(x => x.metric_id === "market.spot_price"
    ? { ...x, source_url: "https://example.com/pretend-kraken" } : x);
  const result = assessBtcScenarioReadiness(inputs, now);
  assert.equal(result.status, "not_evaluable");
  assert.ok(result.blockers.some(x => x.metric_id === "market.spot_price"
    && x.reason === "source_url_not_approved_for_metric"));
});

test("registered but unapproved ETF mirror cannot pass canonical-source gate", () => {
  const inputs = completeInputs().map(x => x.metric_id === "institutional.etf_net_flow"
    ? { ...x, source_id: "institutional.tftc" } : x);
  const result = assessBtcScenarioReadiness(inputs, now);
  assert.equal(result.status, "not_evaluable");
  assert.ok(result.blockers.some(x => x.metric_id === "institutional.etf_net_flow"
    && x.reason === "latest_observation_must_be_current_traceable_and_within_36_hours"));
  assert.equal(result.selected_inputs["institutional.etf_net_flow"], undefined);
});

test("non-canonical unit cannot pass readiness", () => {
  const inputs = completeInputs().map(x => x.metric_id === "market.spot_price"
    ? { ...x, unit: "USDT/BTC" } : x);
  const result = assessBtcScenarioReadiness(inputs, now);
  assert.equal(result.status, "not_evaluable");
  assert.ok(result.blockers.some(x => x.metric_id === "market.spot_price" && x.reason === "unit_mismatch"));
});


test("metric registry unit drift blocks readiness", () => {
  const inputs = completeInputs().map(x => x.metric_id === "market.spot_price"
    ? { ...x, expected_unit: "USDT/BTC" } : x);
  const result = assessBtcScenarioReadiness(inputs, now);
  assert.equal(result.status, "not_evaluable");
  assert.ok(result.blockers.some(x => x.metric_id === "market.spot_price" && x.reason === "metric_unit_contract_mismatch"));
});


for (const [sourceId, sourceUrl] of [
  ["market.binance", "https://api.binance.com/api/v3/trades?symbol=BTCUSDT&limit=1000"],
  ["market.okx", "https://www.okx.com/api/v5/market/trades?instId=BTC-USDT&limit=500"],
  ["market.bybit", "https://api.bybit.com/v5/market/recent-trade?category=spot&symbol=BTCUSDT&limit=1000"],
]) {
  test(`registered cross-check source ${sourceId} cannot replace canonical USD/BTC spot source`, () => {
    const inputs = completeInputs().map(x => x.metric_id === "market.spot_price"
      ? { ...x, source_id: sourceId, source_url: sourceUrl, source_registered: true }
      : x);
    const result = assessBtcScenarioReadiness(inputs, now);
    assert.equal(result.status, "not_evaluable");
    assert.ok(result.blockers.some(x => x.metric_id === "market.spot_price"
      && x.reason === "source_not_approved_for_metric"));
    assert.equal(result.selected_inputs["market.spot_price"], undefined);
  });
}


test("registered ICE DXY candidate cannot bypass the unapproved DXY source contract", () => {
  const inputs = completeInputs().map(x => x.metric_id === "macro.dxy"
    ? {
        ...x,
        source_id: "macro.ice_dxy_candidate",
        source_url: "https://developer.ice.com/fixed-income-data-services/catalog/ice-data-indices-currency-indices",
        source_registered: true,
      }
    : x);
  const result = assessBtcScenarioReadiness(inputs, now);
  assert.equal(result.status, "not_evaluable");
  assert.ok(result.blockers.some(x => x.metric_id === "macro.dxy"
    && x.reason === "source_not_approved_for_metric"));
  assert.equal(result.selected_inputs["macro.dxy"], undefined);
});

test("registered SoSoValue ETF candidate cannot bypass the canonical Farside source contract", () => {
  const inputs = completeInputs().map(x => x.metric_id === "institutional.etf_net_flow"
    ? {
        ...x,
        source_id: "institutional.sosovalue",
        source_url: "https://openapi.sosovalue.com/openapi/v1/etfs/summary-history?symbol=BTC&country_code=US",
        source_registered: true,
      }
    : x);
  const result = assessBtcScenarioReadiness(inputs, now);
  assert.equal(result.status, "not_evaluable");
  assert.ok(result.blockers.some(x => x.metric_id === "institutional.etf_net_flow"
    && x.reason === "latest_observation_must_be_current_traceable_and_within_36_hours"));
  assert.equal(result.selected_inputs["institutional.etf_net_flow"], undefined);
});


test("ETF observation timestamp cannot substitute for a missing reporting date", () => {
  const inputs = completeInputs().map(x => {
    if (x.metric_id !== "institutional.etf_net_flow") return x;
    const { period_start, ...withoutReportingDate } = x;
    return withoutReportingDate;
  });
  const result = assessBtcScenarioReadiness(inputs, now);
  assert.equal(result.status, "not_evaluable");
  assert.ok(result.blockers.some(x => x.metric_id === "institutional.etf_net_flow"
    && x.reason === "latest_observation_must_be_current_traceable_and_within_36_hours"));
  assert.ok(!result.selected_inputs["institutional.etf_net_flow"]);
});


test("missing retrieval timestamp blocks an otherwise fresh canonical observation", () => {
  const inputs = completeInputs().map(x => x.metric_id === "market.spot_price"
    ? { ...x, retrieved_at: null } : x);
  const result = assessBtcScenarioReadiness(inputs, now);
  assert.equal(result.status, "not_evaluable");
  assert.ok(result.blockers.some(x => x.metric_id === "market.spot_price"
    && x.reason === "retrieval_timestamp_missing_or_invalid"));
});

test("missing raw source payload hash blocks an otherwise fresh canonical observation", () => {
  const inputs = completeInputs().map(x => x.metric_id === "market.spot_price"
    ? { ...x, source_payload_sha256: null } : x);
  const result = assessBtcScenarioReadiness(inputs, now);
  assert.equal(result.status, "not_evaluable");
  assert.ok(result.blockers.some(x => x.metric_id === "market.spot_price"
    && x.reason === "source_payload_hash_missing_or_invalid"));
});

test("missing stable source-row key blocks an otherwise traceable observation", () => {
  const inputs = completeInputs().map(x => x.metric_id === "market.spot_price"
    ? { ...x, source_row_key: null } : x);
  const result = assessBtcScenarioReadiness(inputs, now);
  assert.equal(result.status, "not_evaluable");
  assert.ok(result.blockers.some(x => x.metric_id === "market.spot_price"
    && x.reason === "source_row_key_missing"));
});

test("readiness result carries source provenance for offline review", () => {
  const result = assessBtcScenarioReadiness(completeInputs(), now);
  const spot = result.selected_inputs["market.spot_price"];
  assert.equal(spot.retrieved_at, spot.observed_at);
  assert.equal(spot.source_row_key, "market.spot_price:2026-10-12T11:00:00.000Z");
  assert.equal(spot.source_payload_sha256, "a".repeat(64));
  const etf = result.selected_inputs["institutional.etf_net_flow"][0];
  assert.ok(etf.retrieved_at);
  assert.ok(etf.source_row_key);
});


test("metric registry does not advertise a generic or unlicensed DXY source as canonical", () => {
  const metricRegistry = JSON.parse(readFileSync("data/CryptoDataModel/registry/metric-registry.json", "utf8"));
  const metrics = Array.isArray(metricRegistry) ? metricRegistry : metricRegistry.metrics;
  const dxy = metrics.find(x => x.metric_id === "macro.dxy");
  assert.ok(dxy, "macro.dxy must remain defined");
  assert.deepEqual(dxy.source_priority, []);
  assert.match(dxy.validation_rule, /blocked until an approved DXY feed/i);

  const sourceRegistry = JSON.parse(readFileSync("data/CryptoDataModel/registry/source-registry.json", "utf8"));
  const sources = Array.isArray(sourceRegistry) ? sourceRegistry : sourceRegistry.sources;
  const ice = sources.find(x => x.source_id === "macro.ice_dxy_candidate");
  assert.ok(ice);
  assert.match(ice.notes, /not a public quote endpoint/i);
  assert.match(ice.notes, /not in macro\.dxy source_priority/i);
});

test("official Farside all-data endpoint is accepted as the same canonical source", () => {
  const inputs = completeInputs();
  const result = assessBtcScenarioReadiness(inputs, now);
  assert.equal(result.status, "not_evaluable");
  assert.ok(!result.blockers.some(x => x.metric_id === "institutional.etf_net_flow"
    && x.reason === "source_url_not_approved_for_metric"));
  assert.equal(result.selected_inputs["institutional.etf_net_flow"].length, 5);
});


test("ETF latest row is blocked when provider observation timestamp is unknown", () => {
  const inputs = completeInputs().map(x => {
    if (x.metric_id !== "institutional.etf_net_flow") return x;
    return { ...x, observed_at: null };
  });
  const result = assessBtcScenarioReadiness(inputs, now);
  assert.equal(result.status, "not_evaluable");
  assert.ok(result.blockers.some(x => x.metric_id === "institutional.etf_net_flow"));
  assert.equal(result.selected_inputs["institutional.etf_net_flow"], undefined);
});

test("ETF rows with partial or unverified fund reporting cannot count toward accepted history", () => {
  const inputs = completeInputs().map((x, i) => x.metric_id === "institutional.etf_net_flow" && i % 2 === 0
    ? { ...x, fund_completeness_status: "PARTIAL_FUND_REPORTING", funds_reported_count: 11, missing_funds: ["ARKB"] }
    : x);
  const result = assessBtcScenarioReadiness(inputs, now);
  assert.equal(result.status, "not_evaluable");
  assert.ok(result.blockers.some(x => x.metric_id === "institutional.etf_net_flow"));
  assert.equal(result.selected_inputs["institutional.etf_net_flow"], undefined);
});

test("ETF rows cannot pass while provider revision or finalization semantics remain unknown", () => {
  const inputs = completeInputs().map(x => x.metric_id === "institutional.etf_net_flow"
    ? { ...x, provider_revision: null, finalization_status: "unknown" }
    : x);
  const result = assessBtcScenarioReadiness(inputs, now);
  assert.equal(result.status, "not_evaluable");
  assert.ok(result.blockers.some(x => x.metric_id === "institutional.etf_net_flow"
    && x.reason === "etf_fund_completeness_revision_or_finality_unverified"));
  assert.equal(result.selected_inputs["institutional.etf_net_flow"], undefined);
});
