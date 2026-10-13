#!/usr/bin/env node
/**
 * Read-only BTC block-window candidate capture.
 * Stores public-source evidence locally; never connects to a database or writes product state.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { expectedSubsidySats, validateBlockPage, tipAnchorMatches } from "./btc-block-window-validation.mjs";

const outDir = join(process.cwd(), "tmp", "btc-block-window-review");
await mkdir(outDir, { recursive: true });
const targetCount = 165;
const pageSize = 15;
const candidateWindowSize = 144;
const manifest = {
  schema_version: 1,
  asset_id: "btc",
  capture_mode: "read-only-candidate-only",
  production_database_accessed: false,
  production_writes_performed: false,
  started_at: new Date().toISOString(),
  pages: [],
  status: "FAILED",
  candidate_metric: { metric_id: "security.fee_subsidy_ratio", status: "NOT_EVALUATED", production_approved: false }
};
async function sha256(value) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map(x => x.toString(16).padStart(2, "0")).join("");
}
async function readText(url, accept) {
  const retrievedAt = new Date().toISOString();
  const response = await fetch(url, {
    headers: { "user-agent": "Crypto-BTC-Block-Window-Review/1.0", accept: accept || "text/plain,application/json" },
    signal: AbortSignal.timeout(20000)
  });
  const body = await response.text();
  return { url, retrieved_at: retrievedAt, http_status: response.status,
    content_type: response.headers.get("content-type"), body, body_sha256: await sha256(body) };
}
function parseHeight(capture) {
  if (capture.http_status !== 200) throw new Error("Tip height endpoint returned HTTP " + capture.http_status);
  const height = Number(capture.body.trim());
  if (!Number.isSafeInteger(height) || height <= 0) throw new Error("Tip height is invalid");
  return height;
}
function parseHash(capture) {
  if (capture.http_status !== 200) throw new Error("Tip hash endpoint returned HTTP " + capture.http_status);
  const hash = capture.body.trim().toLowerCase();
  if (!/^[0-9a-f]{64}$/.test(hash)) throw new Error("Tip hash is invalid");
  return hash;
}
try {
  const initialHeightCapture = await readText("https://mempool.space/api/blocks/tip/height");
  const initialHashCapture = await readText("https://mempool.space/api/blocks/tip/hash");
  const initialAnchor = { height: parseHeight(initialHeightCapture), hash: parseHash(initialHashCapture) };
  manifest.initial_anchor = { height: initialAnchor.height, hash: initialAnchor.hash,
    height_capture: initialHeightCapture, hash_capture: initialHashCapture };

  const byHeight = new Map();
  const byHash = new Set();
  const pagesNeeded = Math.ceil(targetCount / pageSize);
  for (let page = 0; page < pagesNeeded; page++) {
    const startHeight = initialAnchor.height - page * pageSize;
    const capture = await readText("https://mempool.space/api/v1/blocks/" + startHeight, "application/json");
    const pageEvidence = {
      page: page + 1, requested_start_height: startHeight, url: capture.url,
      retrieved_at: capture.retrieved_at, http_status: capture.http_status,
      content_type: capture.content_type, body_sha256: capture.body_sha256,
      raw_file: "page-" + String(page + 1).padStart(2, "0") + ".raw"
    };
    manifest.pages.push(pageEvidence);
    await writeFile(join(outDir, pageEvidence.raw_file), capture.body, "utf8");
    if (capture.http_status !== 200) throw new Error("Block page HTTP " + capture.http_status + " at height " + startHeight);
    if (!capture.content_type || !capture.content_type.toLowerCase().includes("json")) throw new Error("Unexpected content type at height " + startHeight);
    const rows = JSON.parse(capture.body);
    const returnedHeights = validateBlockPage(rows, startHeight, pageSize);
    pageEvidence.returned_heights = returnedHeights;
    for (const row of rows) {
      const height = Number(row.height);
      const id = String(row.id || row.hash || "").toLowerCase();
      const timestamp = Number(row.timestamp);
      const extras = row.extras && typeof row.extras === "object" ? row.extras : null;
      const fees = Number(extras?.totalFees);
      const reward = Number(extras?.reward);
      if (!/^[0-9a-f]{64}$/.test(id)) throw new Error("Invalid block hash at height " + height);
      if (!Number.isSafeInteger(timestamp) || timestamp <= 0) throw new Error("Invalid block timestamp at height " + height);
      if (!Number.isFinite(fees) || fees < 0 || !Number.isFinite(reward) || reward <= fees) throw new Error("Invalid fee/reward fields at height " + height);
      const subsidy = reward - fees;
      if (subsidy !== expectedSubsidySats(height)) throw new Error("Subsidy mismatch at height " + height);
      if (byHeight.has(height)) throw new Error("Duplicate block height across pages: " + height);
      if (byHash.has(id)) throw new Error("Duplicate block hash across window: " + id);
      byHeight.set(height, { height, hash: id, timestamp, total_fees_sats_candidate: fees,
        coinbase_reward_sats_candidate: reward, subsidy_sats_candidate: subsidy });
      byHash.add(id);
    }
  }

  const heights = [...byHeight.keys()].sort((a, b) => a - b);
  const blocks = heights.map(height => byHeight.get(height));
  if (blocks.length !== targetCount) throw new Error("Expected " + targetCount + " unique blocks, got " + blocks.length);
  for (let i = 1; i < heights.length; i++) {
    if (heights[i] !== heights[i - 1] + 1) throw new Error("Missing height between " + heights[i - 1] + " and " + heights[i]);
  }
  const now = Math.floor(Date.now() / 1000);
  const futureRows = blocks.filter(row => row.timestamp > now + 7200);
  const mtpViolations = [];
  for (let i = 11; i < blocks.length; i++) {
    const previous = blocks.slice(i - 11, i).map(row => row.timestamp).sort((a, b) => a - b);
    if (blocks[i].timestamp <= previous[5]) mtpViolations.push(blocks[i].height);
  }
  if (futureRows.length || mtpViolations.length) throw new Error("Timestamp consensus checks failed");

  const finalHeightCapture = await readText("https://mempool.space/api/blocks/tip/height");
  const finalHashCapture = await readText("https://mempool.space/api/blocks/tip/hash");
  const finalAnchor = { height: parseHeight(finalHeightCapture), hash: parseHash(finalHashCapture) };
  manifest.final_anchor = { height: finalAnchor.height, hash: finalAnchor.hash,
    height_capture: finalHeightCapture, hash_capture: finalHashCapture };
  manifest.anchor_recheck = { status: tipAnchorMatches(initialAnchor, finalAnchor) ? "PASS" : "FAIL_ANCHOR_CHANGED_OR_UNAVAILABLE" };
  if (manifest.anchor_recheck.status !== "PASS") throw new Error("Tip height/hash changed during collection; candidate blocked");

  const candidate = blocks.slice(-candidateWindowSize);
  const totalFees = candidate.reduce((sum, row) => sum + row.total_fees_sats_candidate, 0);
  const totalSubsidy = candidate.reduce((sum, row) => sum + row.subsidy_sats_candidate, 0);
  if (candidate.length !== candidateWindowSize || totalSubsidy <= 0) throw new Error("Candidate 144-block window is invalid");
  const ratio = totalFees / totalSubsidy;
  manifest.validation = { status: "PASS_CANDIDATE_ONLY", block_count: blocks.length,
    first_height: heights[0], last_height: heights[heights.length - 1],
    missing_height_count: 0, duplicate_height_count: 0, duplicate_hash_count: 0,
    timestamp_future_violation_count: futureRows.length, median_time_past_violation_count: mtpViolations.length };
  manifest.candidate_metric = { metric_id: "security.fee_subsidy_ratio", window: "latest 144 consecutive completed blocks",
    window_size: candidate.length, first_height: candidate[0].height, last_height: candidate[candidate.length - 1].height,
    total_fees_sats_candidate: totalFees, total_subsidy_sats_candidate: totalSubsidy,
    value_candidate: ratio, status: "CANDIDATE_ONLY_NOT_ACCEPTED", production_approved: false,
    note: "The calculation window remains unapproved until metric, source, and monitoring registries explicitly agree." };
  manifest.status = "PASS_CANDIDATE_ONLY";
  manifest.completed_at = new Date().toISOString();
  await writeFile(join(outDir, "blocks-normalized.json"), JSON.stringify({ blocks, candidate_window: candidate }, null, 2) + "\n", "utf8");
} catch (error) {
  manifest.error = error instanceof Error ? error.message : String(error);
  manifest.status = "FAILED_CANDIDATE_BLOCKED";
  manifest.completed_at = new Date().toISOString();
}
await writeFile(join(outDir, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n", "utf8");
console.log(JSON.stringify({ manifest: "tmp/btc-block-window-review/manifest.json",
  status: manifest.status, validation: manifest.validation || null,
  candidate_metric: manifest.candidate_metric, error: manifest.error || null }, null, 2));
if (manifest.status !== "PASS_CANDIDATE_ONLY") process.exitCode = 1;
