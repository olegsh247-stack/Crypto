import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const sourcePath = resolve(root, "data/CryptoDataModel/registry/source-registry.json");
const metricPath = resolve(root, "data/CryptoDataModel/registry/metric-registry.json");

export function validateRegistries(sourceRegistry, metricRegistry) {
  const errors = [];
  const warnings = [];
  const sources = Array.isArray(sourceRegistry?.sources) ? sourceRegistry.sources : [];
  const metrics = Array.isArray(metricRegistry?.metrics) ? metricRegistry.metrics : [];

  if (sources.length === 0) errors.push("source registry must contain a non-empty sources array");
  if (metrics.length === 0) errors.push("metric registry must contain a non-empty metrics array");

  const sourceIds = new Set();
  for (const [index, source] of sources.entries()) {
    const id = source?.source_id;
    if (typeof id !== "string" || !id.trim()) {
      errors.push(`sources[${index}] has no non-empty source_id`);
      continue;
    }
    if (sourceIds.has(id)) errors.push(`duplicate source_id: ${id}`);
    sourceIds.add(id);
    if (source.url != null) {
      try {
        const parsed = new URL(source.url);
        if (!["https:", "http:"].includes(parsed.protocol)) errors.push(`source ${id} has unsupported URL protocol`);
      } catch {
        errors.push(`source ${id} has an invalid URL`);
      }
    }
  }

  const metricIds = new Set();
  const referencedSourceIds = new Set();
  const placeholderIds = new Set();
  for (const [index, metric] of metrics.entries()) {
    const id = metric?.metric_id;
    if (typeof id !== "string" || !id.trim()) {
      errors.push(`metrics[${index}] has no non-empty metric_id`);
      continue;
    }
    if (metricIds.has(id)) errors.push(`duplicate metric_id: ${id}`);
    metricIds.add(id);
    if (typeof metric.unit !== "string" || !metric.unit.trim()) errors.push(`metric ${id} has no canonical unit`);
    if (!Array.isArray(metric.source_priority) || metric.source_priority.length === 0) {
      errors.push(`metric ${id} must declare at least one source_priority entry`);
      continue;
    }
    for (const sourceId of metric.source_priority) {
      referencedSourceIds.add(sourceId);
      if (!sourceIds.has(sourceId)) errors.push(`metric ${id} references unknown source_id: ${sourceId}`);
      const source = sources.find((item) => item?.source_id === sourceId);
      if (source && (
        source.url == null ||
        source.reliability === "to_validate" ||
        /^(market data provider|data provider)$/i.test(source.name ?? "")
      )) placeholderIds.add(sourceId);
    }
  }

  for (const sourceId of [...placeholderIds].sort()) {
    const metricNames = metrics.filter((metric) => metric.source_priority?.includes(sourceId)).map((metric) => metric.metric_id);
    warnings.push({
      code: "GENERIC_OR_UNVALIDATED_SOURCE_IN_ACTIVE_PRIORITY",
      source_id: sourceId,
      metric_ids: metricNames,
      message: `Source ${sourceId} is generic/unvalidated but appears in metric source_priority; do not treat it as an accepted production adapter.`,
    });
  }

  return {
    ok: errors.length === 0,
    source_count: sources.length,
    metric_count: metrics.length,
    referenced_source_count: referencedSourceIds.size,
    errors,
    warnings,
  };
}

async function main() {
  const [sourceText, metricText] = await Promise.all([
    readFile(sourcePath, "utf8"),
    readFile(metricPath, "utf8"),
  ]);
  const report = validateRegistries(JSON.parse(sourceText), JSON.parse(metricText));
  console.log(JSON.stringify(report, null, 2));
  if (!report.ok) process.exitCode = 1;
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(import.meta.filename)) {
  await main();
}
