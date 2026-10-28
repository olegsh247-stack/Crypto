import test from "node:test";
import assert from "node:assert/strict";
import {
  collectBtcObservationCandidates,
  parseFarsideBtcFlows,
  parseHashratePayload,
  parseRewardStatsPayload,
} from "../vps/worker/dist/btc-observations.js";

import { BTC_SOURCE_CATALOG } from "../vps/worker/dist/btc-source-catalog.js";
import { assessBtcScenarioReadiness } from "../vps/shared/dist/btc-scenario-readiness.js";
import { evaluateBtcScenarioV1 } from "./btc-scenario-direction.mjs";

const now = new Date("2026-10-12T18:00:00.000Z");
const seconds = value => Math.floor(new Date(value).getTime() / 1000);
const hashYesterday = "a".repeat(64);
const hashEnd = "b".repeat(64);

test("hashrate parser chooses the latest complete UTC day and converts H/s to EH/s", () => {
  const candidate = parseHashratePayload({
    hashrates: [
      { timestamp: seconds("2026-10-10T12:00:00Z"), avgHashrate: 2.4e20 },
      { timestamp: seconds("2026-10-11T12:00:00Z"), avgHashrate: 2.5e20 },
      { timestamp: seconds("2026-10-12T12:00:00Z"), avgHashrate: 2.6e20 },
    ],
  }, now);
  assert.ok(candidate);
  assert.equal(candidate.valueNumeric, 250);
  assert.equal(candidate.unit, "EH/s");
  assert.equal(candidate.periodStart.toISOString(), "2026-10-11T00:00:00.000Z");
  assert.equal(candidate.periodEnd.toISOString(), "2026-10-12T00:00:00.000Z");
});

test("hashrate parser rejects an incomplete current-day-only series", () => {
  assert.equal(parseHashratePayload({
    hashrates: [{ timestamp: seconds("2026-10-12T12:00:00Z"), avgHashrate: 2.6e20 }],
  }, now), null);
});

test("fee/subsidy parser derives a dimensionless ratio from the 144-block window", () => {
  const candidate = parseRewardStatsPayload({
    startBlock: 100, endBlock: 243, totalReward: 450, totalFee: 2.5,
  }, new Date("2026-10-10T00:00:00Z"), new Date("2026-10-12T10:00:00Z"), now);
  assert.ok(Math.abs(candidate.valueNumeric - (2.5 / 447.5)) < 1e-12);
  assert.equal(candidate.unit, "ratio");
  assert.equal(candidate.periodStart.toISOString(), "2026-10-10T00:00:00.000Z");
  assert.equal(candidate.periodEnd.toISOString(), "2026-10-12T10:00:00.000Z");
});

test("Farside parser reads the Total column, parentheses as negative and skips no-data rows", () => {
  const html = `<table>
    <tr><th></th><th>Fund A</th><th>Fund B</th><th>Total</th></tr>
    <tr><td>12 Oct 2026</td><td>5.0</td><td>(2.0)</td><td>3.0</td></tr>
    <tr><td>11 Oct 2026</td><td>-</td><td>-</td><td>0.0</td></tr>
    <tr><td>09 Oct 2026</td><td>1.0</td><td>-</td><td>1.0</td></tr>
  </table>`;
  const candidates = parseFarsideBtcFlows(html, now);
  assert.equal(candidates.length, 2);
  assert.equal(candidates[0].valueNumeric, 1);
  assert.equal(candidates[1].valueNumeric, 3);
  assert.equal(candidates[1].unit, "USD million/day");
  assert.equal(candidates[1].observedAt.toISOString(), now.toISOString());
  assert.equal(candidates[1].periodStart.toISOString(), "2026-10-12T00:00:00.000Z");
});

test("Farside parser fails closed when the Total column is missing", () => {
  assert.throws(() => parseFarsideBtcFlows("<table><tr><th>Date</th><th>Fund A</th></tr></table>", now), /farside_total_column_missing/);
});

test("candidate collector validates provider payloads and leaves DXY explicitly unresolved", async () => {
  const html = `<table>
    <tr><th></th><th>Fund A</th><th>Fund B</th><th>Total</th></tr>
    <tr><td>12 Oct 2026</td><td>5.0</td><td>(2.0)</td><td>3.0</td></tr>
    <tr><td>09 Oct 2026</td><td>1.0</td><td>-</td><td>1.0</td></tr>
  </table>`;
  const fetchImpl = async input => {
    const url = String(input);
    if (url.includes("/Trades?pair=XBTUSD")) return new Response(JSON.stringify({ error: [], result: { XXBTZUSD: [ ["81000.25", "0.001", seconds("2026-10-12T17:59:30Z"), "b", "l", ""], ["81001.25", "0.002", seconds("2026-10-12T17:59:50Z"), "b", "l", ""] ], last: "123" } }), { status: 200 });
    if (url.includes("hashrate/1w")) return new Response(JSON.stringify({ hashrates: [
      { timestamp: seconds("2026-10-11T12:00:00Z"), avgHashrate: 2.5e20 },
      { timestamp: seconds("2026-10-12T12:00:00Z"), avgHashrate: 2.6e20 },
    ] }), { status: 200 });
    if (url.includes("reward-stats/144")) return new Response(JSON.stringify({ startBlock: 100, endBlock: 243, totalReward: 450, totalFee: 2.5 }), { status: 200 });
    if (url.endsWith("/api/block-height/100")) return new Response(hashYesterday, { status: 200 });
    if (url.endsWith("/api/block-height/243")) return new Response(hashEnd, { status: 200 });
    if (url.endsWith(`/api/block/${hashYesterday}`)) return new Response(JSON.stringify({ timestamp: seconds("2026-10-10T00:00:00Z") }), { status: 200 });
    if (url.endsWith(`/api/block/${hashEnd}`)) return new Response(JSON.stringify({ timestamp: seconds("2026-10-12T10:00:00Z") }), { status: 200 });
    if (url === "https://farside.co.uk/btc/") return new Response(html, { status: 200 });
    throw new Error(`unexpected_url:${url}`);
  };
  const result = await collectBtcObservationCandidates({ fetchImpl, now });
  assert.deepEqual(result.failures, []);
  assert.ok(result.candidates.some(x => x.metricId === "market.spot_price" && x.valueNumeric === 81001.25 && x.sourceId === "market.kraken"));
  const spot = result.candidates.find(x => x.metricId === "market.spot_price");
  assert.equal(spot.observedAt.toISOString(), "2026-10-12T17:59:50.000Z");
  assert.equal(spot.retrievedAt.toISOString(), now.toISOString());
  assert.match(spot.sourceRowKey, /^kraken:XBTUSD:/);
  assert.match(spot.sourcePayloadSha256, /^[0-9a-f]{64}$/);
  assert.ok(result.candidates.some(x => x.metricId === "security.hashrate" && x.valueNumeric === 250));
  assert.ok(result.candidates.some(x => x.metricId === "security.fee_subsidy_ratio"));
  assert.equal(result.candidates.filter(x => x.metricId === "institutional.etf_net_flow").length, 2);
  assert.deepEqual(result.unresolvedMetrics, ["macro.dxy"]);
  const catalogByMetric = new Map([
    [BTC_SOURCE_CATALOG.spotPrice.metricId, BTC_SOURCE_CATALOG.spotPrice],
    [BTC_SOURCE_CATALOG.hashrate.metricId, BTC_SOURCE_CATALOG.hashrate],
    [BTC_SOURCE_CATALOG.feeSubsidyRatio.metricId, BTC_SOURCE_CATALOG.feeSubsidyRatio],
    [BTC_SOURCE_CATALOG.etfNetFlow.metricId, BTC_SOURCE_CATALOG.etfNetFlow],
  ]);
  for (const candidate of result.candidates) {
    const contract = catalogByMetric.get(candidate.metricId);
    assert.ok(contract, "candidate metric must be present in the central source catalog");
    assert.equal(candidate.sourceUrl, contract.url);
    assert.equal(candidate.sourceId, contract.sourceId);
    assert.equal(candidate.unit, contract.unit);
  }
});


test("integrated historical BTC path: mocked source payloads -> normalized candidates -> readiness -> derived inputs -> preliminary result", async () => {
  const fixture = JSON.parse(await (await import("node:fs/promises")).readFile(
    new URL("../fixtures/btc-offline-scenario-v1.json", import.meta.url), "utf8"
  ));
  const now = new Date("2026-10-12T18:00:00.000Z");
  const secs = value => Math.floor(new Date(value).getTime() / 1000);
  const rows = [
    ["09 Oct 2026", -89.8],
    ["08 Oct 2026", 118.8],
    ["07 Oct 2026", -484.9],
    ["06 Oct 2026", -244.1],
    ["05 Oct 2026", 21.1],
  ];
  const html = `<table><tr><th>Date</th><th>Fund A</th><th>Total</th></tr>${
    rows.map(([date, total]) => `<tr><td>${date}</td><td>${total}</td><td>${total}</td></tr>`).join("")
  }</table>`;
  const fetchImpl = async input => {
    const url = String(input);
    if (url === BTC_SOURCE_CATALOG.spotPrice.url) return new Response(JSON.stringify({
      error: [], result: { XXBTZUSD: [
        ["83679.46", "0.01", secs("2026-10-12T17:59:50Z"), "b", "l", ""]
      ], last: "123" }
    }), { status: 200 });
    if (url === BTC_SOURCE_CATALOG.hashrate.url) return new Response(JSON.stringify({ hashrates: [
      { timestamp: secs("2026-10-10T12:00:00Z"), avgHashrate: 2.475247524752475e20 },
      { timestamp: secs("2026-10-11T12:00:00Z"), avgHashrate: 2.5e20 },
      { timestamp: secs("2026-10-12T12:00:00Z"), avgHashrate: 2.6e20 }
    ] }), { status: 200 });
    if (url === BTC_SOURCE_CATALOG.feeSubsidyRatio.url) return new Response(JSON.stringify({
      startBlock: 100, endBlock: 243, totalReward: 3.1379, totalFee: 0.0129
    }), { status: 200 });
    if (url === BTC_SOURCE_CATALOG.blockByHeightUrl(100)) return new Response("a".repeat(64), { status: 200 });
    if (url === BTC_SOURCE_CATALOG.blockByHeightUrl(243)) return new Response("b".repeat(64), { status: 200 });
    if (url === BTC_SOURCE_CATALOG.blockByHashUrl("a".repeat(64))) return new Response(JSON.stringify({ timestamp: secs("2026-10-10T00:00:00Z") }), { status: 200 });
    if (url === BTC_SOURCE_CATALOG.blockByHashUrl("b".repeat(64))) return new Response(JSON.stringify({ timestamp: secs("2026-10-12T10:00:00Z") }), { status: 200 });
    if (url === BTC_SOURCE_CATALOG.etfNetFlow.url) return new Response(html, { status: 200 });
    throw new Error("unexpected_url:" + url);
  };

  // This is an intentionally historical/mock capture, not live market data or DB observations.
  const collected = await collectBtcObservationCandidates({ fetchImpl, now });
  assert.deepEqual(collected.failures, []);
  const spot = collected.candidates.find(x => x.metricId === "market.spot_price");
  const hashrate = collected.candidates.find(x => x.metricId === "security.hashrate");
  const fee = collected.candidates.find(x => x.metricId === "security.fee_subsidy_ratio");
  const etf = collected.candidates.filter(x => x.metricId === "institutional.etf_net_flow");
  assert.ok(spot && hashrate && fee);
  assert.equal(etf.length, 5);

  const toReadinessRow = candidate => ({
    metric_id: candidate.metricId,
    value_numeric: candidate.valueNumeric,
    unit: candidate.unit,
    expected_unit: candidate.unit,
    observed_at: candidate.observedAt.toISOString(),
    retrieved_at: candidate.retrievedAt.toISOString(),
    period_start: candidate.periodStart?.toISOString() ?? null,
    period_end: candidate.periodEnd?.toISOString() ?? null,
    source_id: candidate.sourceId,
    source_url: candidate.sourceUrl,
    source_row_key: candidate.sourceRowKey,
    source_payload_sha256: candidate.sourcePayloadSha256,
    methodology: candidate.methodology,
    freshness: candidate.freshness,
    source_registered: true,
    revision: 1,
  });
  const readinessRows = [toReadinessRow(spot), ...etf.map(toReadinessRow)];
  const readiness = assessBtcScenarioReadiness(readinessRows, now);
  assert.equal(readiness.status, "ready_for_rule_evaluation", JSON.stringify(readiness.blockers));

  // The 7-day anchor is a reviewed historical fixture value; the current endpoint
  // capture is mocked. The test explicitly does not claim a DB-to-scenario bridge.
  const priceReturn = (spot.valueNumeric / fixture.provenance.btc_spot_close_start_usd - 1) * 100;
  const etfFlow5d = etf.reduce((sum, row) => sum + row.valueNumeric, 0);
  const hashrateChange = (hashrate.valueNumeric / 247.5247524752475 - 1) * 100;
  const dxyChange = (fixture.provenance.dxy_close_end / fixture.provenance.dxy_close_start - 1) * 100;
  const feeRatio = fee.valueNumeric;
  const result = evaluateBtcScenarioV1({
    readiness_status: readiness.status,
    price_return_7d_pct: priceReturn,
    etf_net_flow_5d_usd_millions: etfFlow5d,
    hashrate_change_7d_pct: hashrateChange,
    dxy_change_5d_pct: dxyChange,
    fee_subsidy_ratio: feeRatio,
  });
  assert.equal(result.status, "evaluated");
  assert.equal(result.scenario_type, fixture.expected.scenario_type);
  assert.equal(result.directional_score, fixture.expected.directional_score);
  assert.equal(result.baseline_probabilities_changed, false);
  assert.equal(result.can_persist_scenario_state, false);
  assert.equal(readiness.can_persist_scenario_state, false);
});
