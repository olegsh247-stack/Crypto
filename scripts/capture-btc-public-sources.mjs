#!/usr/bin/env node
/**
 * Read-only public-source capture for BTC input review.
 *
 * Writes raw responses and a provenance manifest to tmp/btc-source-review.
 * Does not connect to PostgreSQL, ingest observations, or mutate scenario state.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const outDir = join(process.cwd(), "tmp", "btc-source-review");
await mkdir(outDir, { recursive: true });

const retrievedAt = new Date().toISOString();
const manifest = {
  schema_version: 1,
  asset_id: "btc",
  retrieved_at: retrievedAt,
  mode: "read-only-staging-only",
  production_database_accessed: false,
  production_writes_performed: false,
  sources: [],
  unresolved: [
    {
      metric_id: "macro.dxy",
      reason: "No canonical, accessible DXY feed and observation-time convention has been approved. Do not substitute a broad USD index or mix vendor quotes."
    },
    {
      metric_id: "institutional.etf_net_flow",
      reason: "The Farside page capture is preserved for review, but the exact publication timestamp and parser reconciliation contract are not inferred from page retrieval time."
    }
  ]
};

async function capture({ name, metricId, sourceId, url, parse }) {
  const item = {
    name,
    metric_id: metricId,
    source_id: sourceId,
    url,
    retrieved_at: new Date().toISOString(),
    status: "FAILED"
  };
  try {
    const response = await fetch(url, {
      headers: { "user-agent": "Crypto-BTC-Source-Review/1.0", "accept": "application/json,text/html;q=0.9,*/*;q=0.8" },
      signal: AbortSignal.timeout(20000)
    });
    item.http_status = response.status;
    item.content_type = response.headers.get("content-type");
    const body = await response.text();
    item.body_sha256 = await sha256(body);
    item.body_file = `${name}.raw`;
    await writeFile(join(outDir, item.body_file), body, "utf8");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const parsed = parse ? parse(body) : null;
    item.status = "CAPTURED";
    if (parsed) Object.assign(item, parsed);
  } catch (error) {
    item.error = error instanceof Error ? error.message : String(error);
  }
  manifest.sources.push(item);
}

let feeRows = null;
let rewardRows = null;
let latestTipHeight = null;

async function sha256(value) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map(x => x.toString(16).padStart(2, "0")).join("");
}

await capture({
  name: "kraken-xbtusd-trades",
  metricId: "market.spot_price",
  sourceId: "market.kraken",
  url: "https://api.kraken.com/0/public/Trades?pair=XBTUSD",
  parse: body => {
    const data = JSON.parse(body);
    if (Array.isArray(data.error) && data.error.length) throw new Error(`Kraken API error: ${data.error.join(", ")}`);
    const result = data.result ?? {};
    const pairKey = Object.keys(result).find(key => key !== "last");
    const trades = result[pairKey];
    if (!pairKey || !Array.isArray(trades) || trades.length === 0) throw new Error("Kraken response has no trade rows");
    const latest = trades.reduce((best, row) => Number(row[2]) > Number(best[2]) ? row : best);
    const epochSeconds = Number(latest[2]);
    if (!Number.isFinite(epochSeconds) || !Number.isFinite(Number(latest[0]))) throw new Error("Kraken latest trade has invalid price/timestamp");
    return {
      pair_key: pairKey,
      requested_pair: "XBTUSD",
      latest_trade_price_usd_per_btc: Number(latest[0]),
      latest_trade_epoch_seconds: epochSeconds,
      latest_trade_observed_at: new Date(epochSeconds * 1000).toISOString(),
      trade_rows_in_response: trades.length,
      freshness_max_age_seconds: 3600,
      age_seconds_at_capture: Math.max(0, Math.floor((Date.now() - epochSeconds * 1000) / 1000)),
      freshness_at_capture: Date.now() - epochSeconds * 1000 <= 3600 * 1000 ? "PASS" : "FAIL_STALE",
      acceptance_status: "CANDIDATE_ONLY",
      note: "Freshness is evaluated at capture time only. Source timestamp is the trade time; retrieved_at is capture time. Passing freshness does not approve ingestion."
    };
  }
});

await capture({
  name: "mempool-hashrate-1w",
  metricId: "security.hashrate",
  sourceId: "network.primary",
  url: "https://mempool.space/api/v1/mining/hashrate/1w",
  parse: body => {
    const data = JSON.parse(body);
    const rows = Array.isArray(data) ? data
      : Array.isArray(data.hashrates) ? data.hashrates
      : Array.isArray(data.data) ? data.data
      : [];
    const latest = rows.reduce((best, row) =>
      !best || Number(row.timestamp) > Number(best.timestamp) ? row : best, null);
    const epochSeconds = latest ? Number(latest.timestamp) : NaN;
    const hashrate = latest ? Number(latest.avgHashrate ?? latest.hashrate ?? latest.value) : NaN;
    return {
      response_shape: Array.isArray(data) ? "array" : typeof data,
      top_level_keys: data && typeof data === "object" && !Array.isArray(data) ? Object.keys(data) : [],
      row_count: rows.length,
      latest_series_timestamp: Number.isFinite(epochSeconds) ? new Date(epochSeconds * 1000).toISOString() : null,
      latest_series_value_eh_s: Number.isFinite(hashrate) ? hashrate / 1e18 : null,
      freshness_max_age_seconds: 48 * 3600,
      age_seconds_at_capture: Number.isFinite(epochSeconds) ? Math.max(0, Math.floor((Date.now() - epochSeconds * 1000) / 1000)) : null,
      freshness_at_capture: Number.isFinite(epochSeconds) ? (Date.now() - epochSeconds * 1000 <= 48 * 3600 * 1000 ? "PASS" : "FAIL_STALE") : "FAIL_NO_TIMESTAMP",
      acceptance_status: "CANDIDATE_ONLY",
      note: "Freshness is evaluated against the series bucket timestamp, but is not proof that the bucket semantics are accepted. Raw response retained; do not label a rolling estimate as instantaneous hashrate."
    };
  }
});


await capture({
  name: "mempool-tip-height",
  metricId: "security.fee_subsidy_ratio",
  sourceId: "network.primary",
  url: "https://mempool.space/api/blocks/tip/height",
  parse: body => {
    const height = Number(body.trim());
    if (!Number.isSafeInteger(height) || height <= 0) throw new Error("Mempool tip height is not a positive integer");
    latestTipHeight = height;
    return {
      tip_height: height,
      acceptance_status: "REFERENCE_ONLY",
      note: "Used only to choose a recent bounded block sample. Tip height is not a fee/subsidy observation."
    };
  }
});

if (latestTipHeight !== null) {
  await capture({
    name: "mempool-individual-block-sample",
    metricId: "security.fee_subsidy_ratio",
    sourceId: "network.primary",
    url: `https://mempool.space/api/v1/blocks/${latestTipHeight}`,
    parse: body => {
      const data = JSON.parse(body);
      const rows = Array.isArray(data) ? data : [];
      const sample = rows.map(row => {
        const extras = row && typeof row.extras === "object" && row.extras !== null ? row.extras : null;
        const feesRaw = Number(extras?.totalFees);
        const rewardRaw = Number(extras?.reward);
        const subsidyRaw = rewardRaw - feesRaw;
        const fieldsPresent = Number.isFinite(feesRaw) && feesRaw >= 0
          && Number.isFinite(rewardRaw) && rewardRaw > feesRaw;
        return {
          height: row.height ?? null,
          id: row.id ?? row.hash ?? null,
          timestamp: row.timestamp ?? null,
          total_fees_raw: Number.isFinite(feesRaw) ? feesRaw : null,
          total_reward_raw: Number.isFinite(rewardRaw) ? rewardRaw : null,
          derived_subsidy_raw: fieldsPresent ? subsidyRaw : null,
          fee_to_subsidy_ratio: fieldsPresent && subsidyRaw > 0 ? feesRaw / subsidyRaw : null,
          fields_present: fieldsPresent,
          subsidy_matches_current_era: fieldsPresent ? subsidyRaw === 312500000 : false,
          top_level_keys: row && typeof row === "object" ? Object.keys(row).sort() : [],
          extras_keys: extras ? Object.keys(extras).sort() : []
        };
      });
      const validRows = sample.filter(row => row.fields_present);
      const subsidyMismatchRows = validRows.filter(row => !row.subsidy_matches_current_era).length;
      const individualBlockReview = {
        status: validRows.length === rows.length && rows.length > 0 && subsidyMismatchRows === 0
          ? "SAMPLE_VALIDATION_PASS_CANDIDATE_ONLY"
          : "SAMPLE_VALIDATION_FAILED",
        sample_count: rows.length,
        valid_field_rows: validRows.length,
        subsidy_mismatch_rows: subsidyMismatchRows,
        expected_current_subsidy_raw: 312500000,
        fee_field: "extras.totalFees",
        reward_field: "extras.reward",
        calculation: "fee_to_subsidy_ratio = totalFees / (reward - totalFees)",
        unit_assessment: "Raw values are consistent with satoshis because reward minus totalFees equals the current 312,500,000-satoshi subsidy in this sample; confirm against the documented API contract before production use.",
        production_approved: false
      };
      manifest.individual_block_review = individualBlockReview;
      return {
        response_shape: Array.isArray(data) ? "array" : typeof data,
        row_count: rows.length,
        requested_tip_height: latestTipHeight,
        individual_block_review: individualBlockReview,
        sample,
        acceptance_status: individualBlockReview.status,
        note: "Bounded individual-block sample validates candidate fields and arithmetic only. Raw response is retained; source-contract confirmation, broader boundary tests and duplicate dry-run remain required before production acceptance."
      };
    }
  });
} else {
  manifest.sources.push({
    name: "mempool-individual-block-sample",
    metric_id: "security.fee_subsidy_ratio",
    source_id: "network.primary",
    url: "https://mempool.space/api/v1/blocks/{tip-height}",
    retrieved_at: new Date().toISOString(),
    status: "SKIPPED",
    error: "Tip-height capture failed; no fallback height is substituted."
  });
}


async function captureIndividualBlockWindow() {
  const item = {
    name: "mempool-individual-block-window",
    metric_id: "security.fee_subsidy_ratio",
    source_id: "network.primary",
    url: "https://mempool.space/api/v1/blocks/{start-height}",
    retrieved_at: new Date().toISOString(),
    status: "FAILED",
    acceptance_status: "CANDIDATE_ONLY"
  };
  try {
    if (latestTipHeight === null) throw new Error("Tip height unavailable; no fallback height is substituted.");
    const targetCount = 150;
    const pageSize = 15;
    const pagesNeeded = Math.ceil(targetCount / pageSize);
    const byHeight = new Map();
    const pageEvidence = [];
    for (let page = 0; page < pagesNeeded; page++) {
      const startHeight = latestTipHeight - page * pageSize;
      const url = `https://mempool.space/api/v1/blocks/${startHeight}`;
      const response = await fetch(url, {
        headers: { "user-agent": "Crypto-BTC-Source-Review/1.0", "accept": "application/json" },
        signal: AbortSignal.timeout(20000)
      });
      const body = await response.text();
      const digest = await sha256(body);
      const file = `mempool-block-window-page-${String(page + 1).padStart(2, "0")}.raw`;
      await writeFile(join(outDir, file), body, "utf8");
      if (!response.ok) throw new Error(`HTTP ${response.status} for block page starting at ${startHeight}`);
      const rows = JSON.parse(body);
      if (!Array.isArray(rows) || rows.length === 0) throw new Error(`No block rows for page starting at ${startHeight}`);
      pageEvidence.push({
        page: page + 1, requested_start_height: startHeight, row_count: rows.length,
        retrieved_at: new Date().toISOString(), raw_file: file, raw_payload_sha256: digest
      });
      for (const row of rows) {
        const height = Number(row?.height);
        const extras = row && typeof row.extras === "object" && row.extras !== null ? row.extras : null;
        const fees = Number(extras?.totalFees);
        const reward = Number(extras?.reward);
        const timestamp = Number(row?.timestamp);
        const id = row?.id ?? row?.hash ?? null;
        if (!Number.isSafeInteger(height) || height <= 0) continue;
        const normalized = {
          height, id, timestamp,
          observed_at: Number.isFinite(timestamp) ? new Date(timestamp * 1000).toISOString() : null,
          total_fees_raw: Number.isFinite(fees) && fees >= 0 ? fees : null,
          total_reward_raw: Number.isFinite(reward) && reward >= 0 ? reward : null,
          derived_subsidy_raw: Number.isFinite(fees) && Number.isFinite(reward) && reward >= fees ? reward - fees : null,
          fee_to_subsidy_ratio: Number.isFinite(fees) && Number.isFinite(reward) && reward > fees ? fees / (reward - fees) : null,
          fields_valid: typeof id === "string" && id.length >= 16 && Number.isSafeInteger(timestamp) && timestamp > 0
            && Number.isFinite(fees) && fees >= 0 && Number.isFinite(reward) && reward > fees
        };
        const existing = byHeight.get(height);
        if (existing && existing.id !== normalized.id) throw new Error(`Conflicting block hashes for height ${height}`);
        byHeight.set(height, normalized);
      }
    }
    const heights = [...byHeight.keys()].sort((a, b) => a - b);
    const blocks = heights.map(height => byHeight.get(height));
    const expectedMin = latestTipHeight - targetCount + 1;
    const expectedMax = latestTipHeight;
    const missingHeights = [];
    for (let h = expectedMin; h <= expectedMax; h++) if (!byHeight.has(h)) missingHeights.push(h);
    const invalidRows = blocks.filter(row => !row.fields_valid);
    const subsidyMismatches = blocks.filter(row => row.derived_subsidy_raw !== 312500000);
    const duplicateHashes = blocks.length - new Set(blocks.map(row => row.id)).size;
    const timestampsMonotonic = blocks.every((row, i) => i === 0 || row.timestamp >= blocks[i - 1].timestamp);
    const totalFeesRaw = blocks.every(row => row.fields_valid) ? blocks.reduce((sum, row) => sum + row.total_fees_raw, 0) : null;
    const totalSubsidyRaw = blocks.every(row => row.fields_valid) ? blocks.reduce((sum, row) => sum + row.derived_subsidy_raw, 0) : null;
    const ratio = totalFeesRaw !== null && totalSubsidyRaw > 0 ? totalFeesRaw / totalSubsidyRaw : null;
    const passed = blocks.length === targetCount && missingHeights.length === 0 && invalidRows.length === 0
      && subsidyMismatches.length === 0 && duplicateHashes === 0 && timestampsMonotonic && ratio !== null;
    const review = {
      status: passed ? "WIDE_WINDOW_VALIDATION_PASS_CANDIDATE_ONLY" : "WIDE_WINDOW_VALIDATION_FAILED",
      target_block_count: targetCount, unique_block_count: blocks.length,
      first_height: heights[0] ?? null, last_height: heights.at(-1) ?? null,
      expected_min_height: expectedMin, expected_max_height: expectedMax,
      missing_height_count: missingHeights.length, missing_heights: missingHeights,
      invalid_field_rows: invalidRows.length, subsidy_mismatch_rows: subsidyMismatches.length,
      expected_current_subsidy_raw: 312500000, duplicate_hash_count: duplicateHashes,
      timestamps_monotonic: timestampsMonotonic,
      total_fees_raw: totalFeesRaw, total_subsidy_raw: totalSubsidyRaw,
      window_fee_to_subsidy_ratio: ratio,
      per_block_ratio_min: blocks.length ? Math.min(...blocks.map(row => row.fee_to_subsidy_ratio ?? Infinity)) : null,
      per_block_ratio_max: blocks.length ? Math.max(...blocks.map(row => row.fee_to_subsidy_ratio ?? -Infinity)) : null,
      calculation: "sum(totalFees) / sum(reward - totalFees), using the same validated individual blocks",
      unit_assessment: "Raw values are treated as satoshis provisionally; exact field/unit contract and repository metric definition still require approval.",
      pages: pageEvidence,
      production_approved: false,
      unresolved: [
        "confirm endpoint field and unit contract against authoritative API documentation",
        "reconcile ratio window with the repository metric frequency and methodology",
        "verify source ID/runtime mapping and perform a separately scoped read-only duplicate dry-run"
      ]
    };
    await writeFile(join(outDir, "individual-block-window.json"), JSON.stringify({ review, blocks }, null, 2) + "\n", "utf8");
    manifest.individual_block_window_review = review;
    item.status = "CAPTURED";
    Object.assign(item, {
      retrieved_at: new Date().toISOString(),
      page_count: pageEvidence.length,
      raw_pages: pageEvidence,
      review,
      normalized_file: "individual-block-window.json",
      normalized_file_sha256: await sha256(JSON.stringify({ review, blocks }, null, 2) + "\n"),
      note: "Last 150 individual blocks are checked by exact height and block hash. Candidate metric only; no ingestion or scenario writes."
    });
  } catch (error) {
    item.error = error instanceof Error ? error.message : String(error);
    manifest.individual_block_window_review = { status: "CAPTURE_FAILED", error: item.error, production_approved: false };
  }
  manifest.sources.push(item);
}
await captureIndividualBlockWindow();

await capture({
  name: "mempool-block-fees-1w",
  metricId: "security.fee_subsidy_ratio",
  sourceId: "network.primary",
  url: "https://mempool.space/api/v1/mining/blocks/fees/1w",
  parse: body => {
    const data = JSON.parse(body);
    feeRows = Array.isArray(data) ? data : null;
    const latest = feeRows?.at(-1) ?? null;
    return {
      response_shape: Array.isArray(data) ? "array" : typeof data,
      row_count: feeRows?.length ?? null,
      latest_avg_height: latest?.avgHeight ?? null,
      latest_timestamp: Number.isFinite(Number(latest?.timestamp)) ? new Date(Number(latest.timestamp) * 1000).toISOString() : null,
      latest_avg_fees_raw: latest?.avgFees ?? null,
      latest_usd_mark: latest?.USD ?? null,
      acceptance_status: "BLOCKED_AGGREGATE_SEMANTICS",
      note: "This is an averaged series, not a guaranteed per-block record stream. Preserve it for diagnostics only; do not calculate a fee/subsidy ratio from it."
    };
  }
});

await capture({
  name: "mempool-block-rewards-1w",
  metricId: "security.fee_subsidy_ratio",
  sourceId: "network.primary",
  url: "https://mempool.space/api/v1/mining/blocks/rewards/1w",
  parse: body => {
    const data = JSON.parse(body);
    rewardRows = Array.isArray(data) ? data : null;
    const latest = rewardRows?.at(-1) ?? null;
    return {
      response_shape: Array.isArray(data) ? "array" : typeof data,
      row_count: rewardRows?.length ?? null,
      latest_avg_height: latest?.avgHeight ?? null,
      latest_timestamp: Number.isFinite(Number(latest?.timestamp)) ? new Date(Number(latest.timestamp) * 1000).toISOString() : null,
      latest_avg_rewards_raw: latest?.avgRewards ?? null,
      acceptance_status: "BLOCKED_AGGREGATE_SEMANTICS",
      note: "This is an averaged series, not a guaranteed per-block record stream. Preserve it for diagnostics only; do not calculate a fee/subsidy ratio from it."
    };
  }
});

const rewardsByHeight = new Map((rewardRows ?? []).map(row => [String(row.avgHeight), row]));
const matchedRawRows = (feeRows ?? []).flatMap(fee => {
  const reward = rewardsByHeight.get(String(fee.avgHeight));
  return reward ? [{ fee, reward }] : [];
});
const timestampMismatchRows = matchedRawRows.filter(({ fee, reward }) =>
  Number(fee.timestamp) !== Number(reward.timestamp)).length;
manifest.fee_subsidy_review = {
  status: "BLOCKED_AGGREGATE_SEMANTICS",
  fee_rows: feeRows?.length ?? null,
  reward_rows: rewardRows?.length ?? null,
  matched_avg_height_rows: matchedRawRows.length,
  fee_rows_without_reward_match: (feeRows?.length ?? 0) - matchedRawRows.length,
  reward_rows_without_fee_match: (rewardRows?.length ?? 0) - matchedRawRows.length,
  matched_timestamp_mismatch_rows: timestampMismatchRows,
  aggregate_ratio_calculated: false,
  rule: "Do not derive a fee/subsidy ratio from averaged series. Equal avgHeight values do not prove equal block sets or time windows, especially when timestamps differ. Use a bounded sample of individual block records to validate source fields and units before defining a reproducible calculation."
};

await capture({
  name: "farside-btc-etf-page",
  metricId: "institutional.etf_net_flow",
  sourceId: "institutional.primary",
  url: "https://farside.co.uk/btc/",
  parse: body => ({
    html_characters: body.length,
    note: "Raw page retained for parser review. Retrieval time is not treated as ETF observation/publication time; dash/placeholder rows must not become zero."
  })
});

await capture({
  name: "tftc-btc-etf-json-candidate",
  metricId: "institutional.etf_net_flow",
  sourceId: "institutional.tftc",
  url: "https://www.tftc.io/bitcoin-etf-flows/data.json",
  parse: body => {
    const data = JSON.parse(body);
    const rows = Array.isArray(data) ? data
      : Array.isArray(data.days) ? data.days
      : Array.isArray(data.data) ? data.data
      : Array.isArray(data.rows) ? data.rows
      : Array.isArray(data.flows) ? data.flows
      : null;
    const earliestRecentDay = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const recentDays = rows ? rows.filter(row => String(row.date ?? row.day ?? "") >= earliestRecentDay) : null;
    return {
      response_shape: Array.isArray(data) ? "array" : typeof data,
      top_level_keys: data && typeof data === "object" && !Array.isArray(data) ? Object.keys(data) : [],
      row_count: rows ? rows.length : null,
      updated_through: data.updatedThrough ?? null,
      license: data.license ?? null,
      attribution: data.attribution ?? null,
      source_lineage: data.sources ?? null,
      first_row_keys: rows && rows.length && rows[0] && typeof rows[0] === "object" ? Object.keys(rows[0]) : [],
      latest_day: rows && rows.length ? rows[rows.length - 1] : null,
      recent_days_in_last_14_days: recentDays,
      note: "Candidate mirror only. Inspect source lineage, date semantics, revisions and dash/null handling before using any row as canonical ETF flow."
    };
  }
});

await writeFile(join(outDir, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n", "utf8");
console.log(JSON.stringify({
  manifest: "tmp/btc-source-review/manifest.json",
  sources: manifest.sources.map(({
    name, status, http_status, error, retrieved_at, body_sha256,
    latest_trade_observed_at, latest_trade_price_usd_per_btc,
    latest_series_timestamp, latest_series_value_eh_s,
    latest_avg_height, latest_timestamp, latest_avg_fees_raw,
    latest_avg_rewards_raw, latest_usd_mark,
    freshness_max_age_seconds, age_seconds_at_capture, freshness_at_capture,
    acceptance_status, updated_through, row_count
  }) => ({
    name, status, http_status, error, retrieved_at, body_sha256,
    latest_trade_observed_at, latest_trade_price_usd_per_btc,
    latest_series_timestamp, latest_series_value_eh_s,
    latest_avg_height, latest_timestamp, latest_avg_fees_raw,
    latest_avg_rewards_raw, latest_usd_mark,
    freshness_max_age_seconds, age_seconds_at_capture, freshness_at_capture,
    acceptance_status, updated_through, row_count
  })),
  fee_subsidy_review: manifest.fee_subsidy_review,
  individual_block_review: manifest.individual_block_review,
  unresolved: manifest.unresolved
}, null, 2));

const requiredNames = ["kraken-xbtusd-trades", "mempool-hashrate-1w", "mempool-block-fees-1w", "mempool-block-rewards-1w", "mempool-tip-height", "mempool-individual-block-sample"];
const requiredCaptureFailed = requiredNames.some(name =>
  !manifest.sources.some(source => source.name === name && source.status === "CAPTURED"));
const etfCaptureSucceeded = manifest.sources.some(source =>
  ["farside-btc-etf-page", "tftc-btc-etf-json-candidate"].includes(source.name)
  && source.status === "CAPTURED");
if (requiredCaptureFailed || !etfCaptureSucceeded) process.exitCode = 1;
