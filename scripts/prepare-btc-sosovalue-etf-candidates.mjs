import { createHash } from "node:crypto";

export const SOSOVALUE_SUMMARY_HISTORY_URL =
  "https://openapi.sosovalue.com/openapi/v1/etfs/summary-history";

/**
 * Offline-only normalizer for a previously captured SoSoValue summary-history
 * response. It performs no network request and never reads an API key.
 *
 * Input body must be the exact UTF-8 response body captured by a separate,
 * reviewed manual process. Retrieval time is supplied separately and is not
 * inferred from the reporting date.
 */
export function prepareBtcSoSoValueEtfCandidates({
  responseBody,
  retrievedAt,
  requestUrl = SOSOVALUE_SUMMARY_HISTORY_URL,
  httpStatus = 200,
}) {
  const retrievedMs = Date.parse(String(retrievedAt ?? ""));
  const validRetrieval = Number.isFinite(retrievedMs)
    && new Date(retrievedMs).toISOString() === retrievedAt;
  const payload = typeof responseBody === "string" ? responseBody : "";
  const payloadSha256 = createHash("sha256").update(payload, "utf8").digest("hex");
  const base = {
    schema_version: 1,
    mode: "offline-research-candidate-normalization-only",
    source_id: "institutional.sosovalue.candidate",
    source_url: requestUrl,
    retrieved_at: validRetrieval ? retrievedAt : null,
    http_status: httpStatus,
    source_payload_sha256: payloadSha256,
    provider_observed_at: null,
    provider_revision: null,
    finalization_status: "unknown",
    persistable: false,
    production_database_accessed: false,
    production_writes_performed: false,
    scenario_state_changed: false,
    rows: [],
    blockers: [],
  };

  if (!validRetrieval) base.blockers.push("VALID_RETRIEVAL_TIMESTAMP_REQUIRED");
  if (httpStatus !== 200) base.blockers.push("HTTP_STATUS_NOT_200");
  if (!/^https:\/\/openapi\.sosovalue\.com\/openapi\/v1\/etfs\/summary-history(?:\?|$)/.test(requestUrl)) {
    base.blockers.push("REQUEST_URL_NOT_APPROVED_SOSOVALUE_SUMMARY_HISTORY_ENDPOINT");
  }
  if (typeof responseBody !== "string" || !payload.length) {
    base.blockers.push("RAW_RESPONSE_BODY_REQUIRED");
    return base;
  }

  let parsed;
  try {
    parsed = JSON.parse(payload);
  } catch {
    base.blockers.push("RESPONSE_BODY_NOT_VALID_JSON");
    return base;
  }
  if (httpStatus !== 200 || !validRetrieval || base.blockers.includes("REQUEST_URL_NOT_APPROVED_SOSOVALUE_SUMMARY_HISTORY_ENDPOINT")) {
    return base;
  }

  const records = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.data) ? parsed.data : null;
  if (!records) {
    base.blockers.push("SUMMARY_HISTORY_ARRAY_NOT_FOUND");
    return base;
  }

  const seen = new Set();
  for (const row of records) {
    const date = typeof row?.date === "string" ? row.date : "";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)
      || new Date(date + "T00:00:00.000Z").toISOString().slice(0, 10) !== date) {
      base.rows.push({
        reporting_date: date || null,
        status: "BLOCKED_INVALID_REPORTING_DATE",
        value_usd: null,
        value_usd_million: null,
      });
      continue;
    }
    if (seen.has(date)) {
      base.rows.push({
        reporting_date: date,
        status: "BLOCKED_DUPLICATE_REPORTING_DATE",
        value_usd: null,
        value_usd_million: null,
      });
      continue;
    }
    seen.add(date);
    const value = row?.total_net_inflow;
    if (value === null || value === undefined || value === "") {
      base.rows.push({
        reporting_date: date,
        status: "BLOCKED_MISSING_VALUE",
        value_usd: null,
        value_usd_million: null,
      });
      continue;
    }
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) {
      base.rows.push({
        reporting_date: date,
        status: "BLOCKED_NON_NUMERIC_VALUE",
        value_usd: null,
        value_usd_million: null,
      });
      continue;
    }
    base.rows.push({
      reporting_date: date,
      status: "CANDIDATE",
      value_usd: numeric,
      value_usd_million: numeric / 1_000_000,
      unit: "USD million/day",
      source_field: "total_net_inflow",
      source_payload_sha256: payloadSha256,
      source_url: requestUrl,
      retrieved_at: retrievedAt,
      provider_observed_at: null,
      finalization_status: "unknown",
      lineage_independence: "NOT_ESTABLISHED",
      persistable: false,
    });
  }

  if (!base.rows.length) base.blockers.push("NO_SUMMARY_HISTORY_ROWS");
  return base;
}
