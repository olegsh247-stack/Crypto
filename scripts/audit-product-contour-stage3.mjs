#!/usr/bin/env node
import { buildAssetAudit, resolveAuditConfig } from "./lib/product-contour-audit.mjs";

const config = resolveAuditConfig(process.env);
const { apiBase, apiOrigin, apiCommitSha, assetIds } = config;

async function getAsset(assetId) {
  const response = await fetch(apiBase + "/api/assets/" + encodeURIComponent(assetId), {
    method: "GET",
    headers: { accept: "application/json" },
    cache: "no-store",
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error("GET /api/assets/" + assetId + " -> " + response.status + " " + JSON.stringify(payload));
  return payload;
}

const assets = [];
for (const assetId of assetIds) {
  assets.push(buildAssetAudit(assetId, await getAsset(assetId)));
}

const report = {
  report_type: "product_contour_stage3_read_only_payload_audit",
  generated_at: new Date().toISOString(),
  api_origin: apiOrigin,
  api_commit_sha: apiCommitSha,
  http_methods_used: ["GET"],
  production_or_database_writes: false,
  assets,
  issue_count: assets.reduce((total, asset) => total + asset.issues.length, 0),
};
console.log(JSON.stringify(report, null, 2));
if (report.issue_count > 0) process.exitCode = 2;
