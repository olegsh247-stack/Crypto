export const PRODUCT_CONTOUR_ASSETS = ["btc", "eth", "sol", "cake"];

const SECTION_NAMES = [
  "research_blocks",
  "research_domains",
  "critical_factors",
  "scores",
  "research_scenarios",
  "scenario_states",
  "monitoring_signals",
  "monitoring_events",
  "sources",
  "evidence",
  "metrics",
  "history",
];

function rows(value) {
  return Array.isArray(value) ? value : [];
}

function isNullish(value) {
  return value === null || value === undefined || value === "";
}

export function calculateNullRates(items, fields) {
  const list = rows(items);
  return Object.fromEntries(fields.map(field => {
    const nullCount = list.filter(item => isNullish(item?.[field])).length;
    return [field, {
      row_count: list.length,
      null_count: nullCount,
      null_rate: list.length ? Number((nullCount / list.length).toFixed(4)) : null,
    }];
  }));
}

function snapshotIssues(section, items, snapshotId, required = true) {
  return rows(items).flatMap((item, index) => {
    const value = item?.snapshot_id;
    if (isNullish(value)) return required ? [{ code: "snapshot_id_missing", section, index }] : [];
    return value === snapshotId ? [] : [{
      code: "snapshot_id_mismatch",
      section,
      index,
      expected_snapshot_id: snapshotId,
      actual_snapshot_id: value,
    }];
  });
}

export function buildAssetAudit(assetId, payload) {
  const sections = Object.fromEntries(SECTION_NAMES.map(name => [name, rows(payload?.[name])]));
  const snapshotId = payload?.research_snapshot?.snapshot_id ?? null;
  const issues = [];

  if (payload?.asset?.asset_id !== assetId) {
    issues.push({ code: "asset_identity_mismatch", expected_asset_id: assetId, actual_asset_id: payload?.asset?.asset_id ?? null });
  }
  if (!snapshotId) issues.push({ code: "published_snapshot_missing" });

  for (const section of ["critical_factors", "scores", "research_scenarios", "scenario_states", "evidence"]) {
    issues.push(...snapshotIssues(section, sections[section], snapshotId));
  }

  const sourceIds = new Set(sections.sources.map(source => source?.source_id).filter(Boolean));
  const referencedSourceIds = new Set([
    ...sections.metrics.map(item => item?.source_id),
    ...sections.evidence.map(item => item?.source_id),
  ].filter(Boolean));
  const missingSourceIds = [...referencedSourceIds].filter(sourceId => !sourceIds.has(sourceId)).sort();
  for (const sourceId of missingSourceIds) issues.push({ code: "source_registry_reference_missing", source_id: sourceId });

  const missingSections = SECTION_NAMES.filter(name => !Array.isArray(payload?.[name]));
  for (const section of missingSections) issues.push({ code: "section_missing", section });

  const nullRates = {
    metrics: calculateNullRates(sections.metrics, [
      "metric_id", "value", "unit", "observed_at", "retrieved_at", "source_updated_at",
      "source_id", "source_url", "methodology", "methodology_version", "freshness", "revision",
    ]),
    evidence: calculateNullRates(sections.evidence, [
      "snapshot_id", "research_block_id", "block_number", "observation_id", "source_id",
      "metric_id", "claim", "evidence_type", "status", "thesis_impact",
    ]),
    sources: calculateNullRates(sections.sources, ["source_id", "name", "source_type", "base_url", "trust_level"]),
  };

  const freshnessCounts = Object.fromEntries(
    [...new Set(sections.metrics.map(item => item?.freshness ?? "missing"))]
      .sort()
      .map(status => [status, sections.metrics.filter(item => (item?.freshness ?? "missing") === status).length]),
  );

  return {
    asset_id: assetId,
    snapshot_id: snapshotId,
    snapshot_version: payload?.research_snapshot?.version ?? null,
    snapshot_status: payload?.research_snapshot?.status ?? null,
    section_row_counts: Object.fromEntries(SECTION_NAMES.map(name => [name, sections[name].length])),
    null_rates: nullRates,
    source_lineage: {
      registry_source_count: sourceIds.size,
      referenced_source_count: referencedSourceIds.size,
      missing_source_ids: missingSourceIds,
    },
    freshness_display: {
      asset: payload?.asset?.research_freshness ?? null,
      metric_counts: freshnessCounts,
      evidence_freshness_counts: Object.fromEntries(
        [...new Set(sections.evidence.map(item => item?.observation_freshness ?? "missing"))]
          .sort()
          .map(status => [status, sections.evidence.filter(item => (item?.observation_freshness ?? "missing") === status).length]),
      ),
    },
    scenario_snapshot_lineage: {
      scenario_count: sections.research_scenarios.length,
      state_count: sections.scenario_states.length,
      cross_snapshot_state_count: issues.filter(issue => issue.section === "scenario_states" && issue.code === "snapshot_id_mismatch").length,
      issues: issues.filter(issue => ["research_scenarios", "scenario_states"].includes(issue.section)),
    },
    issues,
  };
}
