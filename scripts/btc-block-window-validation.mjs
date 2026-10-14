/**
 * Pure BTC block-window validation helpers.
 * No network access, filesystem access, or state mutation.
 */

export function expectedSubsidySats(height) {
  if (!Number.isSafeInteger(height) || height < 0) {
    throw new TypeError("Block height must be a non-negative safe integer");
  }
  const halvings = Math.floor(height / 210000);
  if (halvings >= 64) return 0;
  return Math.floor(5000000000 / (2 ** halvings));
}

export function validateBlockPage(rows, startHeight, pageSize = 15) {
  if (!Array.isArray(rows) || rows.length !== pageSize) {
    throw new Error(`Expected ${pageSize} block rows`);
  }
  if (!Number.isSafeInteger(startHeight) || startHeight <= 0) {
    throw new TypeError("Page start height must be a positive safe integer");
  }
  const heights = rows.map(row => Number(row?.height));
  if (heights.some(height => !Number.isSafeInteger(height) || height <= 0)) {
    throw new Error("Block page contains an invalid height");
  }
  if (new Set(heights).size !== pageSize) {
    throw new Error("Block page contains duplicate heights");
  }
  const expected = Array.from({ length: pageSize }, (_, index) => startHeight - index);
  if (expected.some(height => !heights.includes(height))) {
    throw new Error("Block page contains missing or unexpected heights");
  }
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
