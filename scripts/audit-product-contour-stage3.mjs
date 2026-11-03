#!/usr/bin/env node
import { buildAssetAudit, PRODUCT_CONTOUR_ASSETS } from "./lib/product-contour-audit.mjs";

if (process.env.PRODUCT_CONTOUR_ENVIRONMENT !== "staging") {
  throw new Error("Set PRODUCT_CONTOUR_ENVIRONMENT=staging only after verifying the target is an isolated non-production API");
}
const apiBase = (process.env.CRYPTO_API_URL ?? "").replace(/\/+$/, "");
if (!apiBase) throw new Error("CRYPTO_API_URL is required");
const assetIds = (process.env.PRODUCT_CONTOUR_ASSETS ?? PRODUCT_CONTOUR_ASSETS.join(","))
  .split(",").map(value => value.trim().toLowerCase()).filter(Boolean);

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
  api_origin: new URL(apiBase).origin,
  http_methods_used: ["GET"],
  production_or_database_writes: false,
  assets,
  issue_count: assets.reduce((total, asset) => total + asset.issues.length, 0),
};
console.log(JSON.stringify(report, null, 2));
if (report.issue_count > 0) process.exitCode = 2;
