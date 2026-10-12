#!/usr/bin/env node
/**
 * Reproduce the read-only Mempool fee/reward reconciliation from saved raw JSON.
 *
 * Usage:
 *   node scripts/check-btc-fee-reward-reconciliation.mjs fees.json rewards.json
 *
 * No network calls, database access, or writes are performed. The script joins
 * by avgHeight (never array position), requires exact timestamp equality, checks
 * a constant reward-minus-fee component, and reports the derived candidate only.
 */
import { readFile } from "node:fs/promises";

const [feesPath, rewardsPath] = process.argv.slice(2);
if (!feesPath || !rewardsPath) {
  console.error("Usage: node scripts/check-btc-fee-reward-reconciliation.mjs <fees.json> <rewards.json>");
  process.exit(2);
}

async function readRows(path, label) {
  const parsed = JSON.parse(await readFile(path, "utf8"));
  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error(`${label} payload must be a non-empty JSON array`);
  }
  for (const [index, row] of parsed.entries()) {
    if (!row || !Number.isSafeInteger(Number(row.avgHeight)) ||
        !Number.isFinite(Number(row.timestamp))) {
      throw new Error(`${label} row ${index} lacks numeric avgHeight/timestamp`);
    }
  }
  return parsed;
}

function uniqueByHeight(rows, label) {
  const map = new Map();
  for (const row of rows) {
    const height = Number(row.avgHeight);
    if (map.has(height)) throw new Error(`${label} has duplicate avgHeight ${height}`);
    map.set(height, row);
  }
  return map;
}

try {
  const feeRows = await readRows(feesPath, "fees");
  const rewardRows = await readRows(rewardsPath, "rewards");
  const fees = uniqueByHeight(feeRows, "fees");
  const rewards = uniqueByHeight(rewardRows, "rewards");
  const matched = [...fees.keys()].filter(height => rewards.has(height)).sort((a, b) => a - b);
  if (!matched.length) throw new Error("No shared avgHeight keys");

  let feeTotal = 0;
  let subsidyTotal = 0;
  const deltas = new Set();
  for (const height of matched) {
    const fee = fees.get(height);
    const reward = rewards.get(height);
    if (Number(fee.timestamp) !== Number(reward.timestamp)) {
      throw new Error(`Timestamp mismatch at avgHeight ${height}: ${fee.timestamp} vs ${reward.timestamp}`);
    }
    const feeValue = Number(fee.avgFees);
    const rewardValue = Number(reward.avgRewards);
    if (!Number.isFinite(feeValue) || !Number.isFinite(rewardValue) || rewardValue <= feeValue) {
      throw new Error(`Invalid avgFees/avgRewards values at avgHeight ${height}`);
    }
    feeTotal += feeValue;
    subsidyTotal += rewardValue - feeValue;
    deltas.add(rewardValue - feeValue);
  }

  if (deltas.size !== 1) {
    throw new Error(`Reward-minus-fee component is not constant across matched rows: ${[...deltas].join(", ")}`);
  }
  const firstHeight = matched[0];
  const lastHeight = matched[matched.length - 1];
  const latestTimestamp = Math.max(...matched.map(height => Number(fees.get(height).timestamp)));
  const ratio = feeTotal / subsidyTotal;
  if (!Number.isFinite(ratio) || ratio < 0) throw new Error("Derived ratio is invalid");

  console.log(JSON.stringify({
    status: "PASS_CANDIDATE_ONLY",
    fees_rows: feeRows.length,
    rewards_rows: rewardRows.length,
    matched_rows: matched.length,
    first_avgHeight: firstHeight,
    last_avgHeight: lastHeight,
    fee_only_heights: [...fees.keys()].filter(height => !rewards.has(height)).sort((a, b) => a - b),
    reward_only_heights: [...rewards.keys()].filter(height => !fees.has(height)).sort((a, b) => a - b),
    timestamps_equal_for_all_matches: true,
    constant_avgRewards_minus_avgFees_raw_units: [...deltas][0],
    total_matched_avg_fees_raw_units: feeTotal,
    total_matched_subsidy_component_raw_units: subsidyTotal,
    candidate_fee_subsidy_ratio: ratio,
    latest_matched_timestamp: new Date(latestTimestamp * 1000).toISOString(),
    acceptance: "NOT_ACCEPTED: confirm source unit semantics and canonical calculation contract before use"
  }, null, 2));
} catch (error) {
  console.error(`FAIL: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
}
