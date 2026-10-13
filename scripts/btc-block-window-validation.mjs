/**
 * Pure BTC block-window validation helpers.
 * No network access, filesystem access, or state mutation.
 */
export function expectedSubsidySats(height) {
  if (!Number.isSafeInteger(height) || height < 0) throw new TypeError("Block height must be a non-negative safe integer");
  const halvings = Math.floor(height / 210000);
  if (halvings >= 64) return 0;
  return Math.floor(5000000000 / (2 ** halvings));
}
export function validateBlockPage(rows, startHeight, pageSize = 15) {
  if (!Array.isArray(rows) || rows.length !== pageSize) throw new Error(`Expected ${pageSize} block rows`);
  if (!Number.isSafeInteger(startHeight) || startHeight <= 0) throw new TypeError("Page start height must be a positive safe integer");
  const heights = rows.map(row => Number(row?.height));
  if (heights.some(height => !Number.isSafeInteger(height) || height <= 0)) throw new Error("Block page contains an invalid height");
  if (new Set(heights).size !== pageSize) throw new Error("Block page contains duplicate heights");
  const expected = Array.from({ length: pageSize }, (_, index) => startHeight - index);
  if (expected.some(height => !heights.includes(height))) throw new Error("Block page contains missing or unexpected heights");
  return heights;
}
export function tipAnchorMatches(initial, current) {
  return Number.isSafeInteger(initial?.height)
    && Number.isSafeInteger(current?.height)
    && initial.height === current.height
    && typeof initial.hash === "string"
    && typeof current.hash === "string"
    && /^[0-9a-f]{64}$/i.test(initial.hash)
    && /^[0-9a-f]{64}$/i.test(current.hash)
    && initial.hash.toLowerCase() === current.hash.toLowerCase();
}

/**
 * Derive one completed UTC-day candidate from block-timestamped rows.
 * Requires a time buffer around both day boundaries so the captured height
 * range is not a partial-day sample. Does not imply canonical acceptance.
 */
export function deriveUtcDayCandidate(blocks, dayStartEpoch, bufferSeconds = 6 * 60 * 60) {
  if (!Array.isArray(blocks) || blocks.length === 0) throw new Error("UTC-day candidate requires block rows");
  if (!Number.isSafeInteger(dayStartEpoch) || dayStartEpoch % 86400 !== 0) {
    throw new TypeError("UTC day start must be an epoch timestamp aligned to UTC midnight");
  }
  if (!Number.isSafeInteger(bufferSeconds) || bufferSeconds < 0) {
    throw new TypeError("UTC-day boundary buffer must be a non-negative safe integer");
  }
  const dayEndEpoch = dayStartEpoch + 86400;
  const timestamps = blocks.map(row => Number(row?.timestamp));
  if (timestamps.some(value => !Number.isSafeInteger(value) || value <= 0)) {
    throw new Error("UTC-day candidate contains an invalid block timestamp");
  }
  if (Math.min(...timestamps) > dayStartEpoch - bufferSeconds
    || Math.max(...timestamps) < dayEndEpoch + bufferSeconds) {
    throw new Error("Captured block range does not provide the required UTC-day boundary buffer");
  }
  const rows = blocks.filter(row => row.timestamp >= dayStartEpoch && row.timestamp < dayEndEpoch);
  if (rows.length === 0) throw new Error("No blocks found for the completed UTC day");
  const heights = rows.map(row => row.height);
  if (heights.some(height => !Number.isSafeInteger(height) || height <= 0)
    || new Set(heights).size !== heights.length) {
    throw new Error("UTC-day candidate contains invalid or duplicate block heights");
  }
  const totalFees = rows.reduce((sum, row) => {
    const value = Number(row.total_fees_sats_candidate);
    if (!Number.isFinite(value) || value < 0) throw new Error("UTC-day candidate contains invalid fees");
    return sum + value;
  }, 0);
  const totalSubsidy = rows.reduce((sum, row) => {
    const value = Number(row.subsidy_sats_candidate);
    if (!Number.isFinite(value) || value <= 0) throw new Error("UTC-day candidate contains invalid subsidy");
    return sum + value;
  }, 0);
  if (totalSubsidy <= 0) throw new Error("UTC-day candidate subsidy total must be positive");
  const sortedHeights = [...heights].sort((a, b) => a - b);
  return {
    date_utc: new Date(dayStartEpoch * 1000).toISOString().slice(0, 10),
    window_start_utc: new Date(dayStartEpoch * 1000).toISOString(),
    window_end_utc_exclusive: new Date(dayEndEpoch * 1000).toISOString(),
    block_count: rows.length,
    first_height: sortedHeights[0],
    last_height: sortedHeights[sortedHeights.length - 1],
    total_fees_sats_candidate: totalFees,
    total_subsidy_sats_candidate: totalSubsidy,
    value_candidate: totalFees / totalSubsidy,
    status: "CANDIDATE_ONLY_NOT_ACCEPTED",
    production_approved: false
  };
}
