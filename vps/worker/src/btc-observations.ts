import { withSqlTransaction } from "@crypto/vps-runtime";

export type ObservationFreshness = "CURRENT" | "STALE";
export interface BtcObservationCandidate {
  metricId: string;
  sourceId: string;
  sourceUrl: string;
  valueNumeric: number;
  unit: string;
  observedAt: Date;
  periodStart: Date | null;
  periodEnd: Date | null;
  methodology: string;
  status: "NORMAL";
  freshness: ObservationFreshness;
}
export interface CandidateCollection {
  retrievedAt: string;
  candidates: BtcObservationCandidate[];
  failures: Array<{ metric_id: string; reason: string }>;
  unresolvedMetrics: string[];
}
type Fetcher = (input: string | URL, init?: RequestInit) => Promise<Response>;

const BINANCE_URL = "https://data-api.binance.vision/api/v3/ticker/price?symbol=BTCUSDT";
const HASHRATE_URL = "https://mempool.space/api/v1/mining/hashrate/1w";
const REWARD_STATS_URL = "https://mempool.space/api/v1/mining/reward-stats/144";
const FARSIDE_URL = "https://farside.co.uk/btc/";
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const FOURTEEN_DAYS_MS = 14 * 24 * 60 * 60 * 1000;
const DAY_SECONDS = 24 * 60 * 60;

function finitePositive(value: unknown): number | null {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
}
function toDateFromSeconds(value: unknown): Date | null {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return null;
  const d = new Date(n * 1000);
  return Number.isFinite(d.getTime()) ? d : null;
}
function freshnessFor(observedAt: Date, now: Date, maxAgeMs = SEVEN_DAYS_MS): ObservationFreshness {
  const age = now.getTime() - observedAt.getTime();
  return age >= 0 && age <= maxAgeMs ? "CURRENT" : "STALE";
}
async function responseText(fetchImpl: Fetcher, url: string): Promise<string> {
  const response = await fetchImpl(url, {
    headers: { accept: "application/json,text/html,text/plain;q=0.9,*/*;q=0.8", "user-agent": "Crypto-BTC-Research/1.0" },
    signal: AbortSignal.timeout(12_000),
  });
  if (!response.ok) throw new Error(`http_${response.status}`);
  return response.text();
}
async function responseJson(fetchImpl: Fetcher, url: string): Promise<any> {
  const text = await responseText(fetchImpl, url);
  try { return JSON.parse(text); } catch { throw new Error("invalid_json_response"); }
}

export function parseHashratePayload(payload: unknown, now: Date): BtcObservationCandidate | null {
  const rows = (payload as any)?.hashrates;
  if (!Array.isArray(rows)) throw new Error("hashrate_series_missing");
  const mapped: Array<BtcObservationCandidate | null> = rows.map((row: any) => {
    const observedAt = toDateFromSeconds(row?.timestamp);
    const rawHashrate = finitePositive(row?.avgHashrate ?? row?.hashrate);
    if (!observedAt || !rawHashrate) return null;
    const dayStartSeconds = Math.floor(observedAt.getTime() / 1000 / DAY_SECONDS) * DAY_SECONDS;
    const periodStart = new Date(dayStartSeconds * 1000);
    const periodEnd = new Date((dayStartSeconds + DAY_SECONDS) * 1000);
    // The endpoint includes a partial current UTC day. Only use closed daily buckets.
    if (periodEnd.getTime() > now.getTime()) return null;
    return {
      metricId: "security.hashrate",
      sourceId: "network.primary",
      sourceUrl: HASHRATE_URL,
      valueNumeric: rawHashrate / 1e18,
      unit: "EH/s",
      observedAt,
      periodStart,
      periodEnd,
      methodology: "Mempool.space trailing-week hashrate series; latest fully closed UTC daily bucket; avgHashrate converted from H/s to EH/s.",
      status: "NORMAL" as const,
      freshness: freshnessFor(observedAt, now),
    };
  });
  const candidates = mapped.filter((x): x is BtcObservationCandidate => x !== null)
    .sort((a, b) => b.observedAt.getTime() - a.observedAt.getTime());
  return candidates[0] ?? null;
}

export function parseRewardStatsPayload(
  payload: unknown,
  startBlockAt: Date,
  endBlockAt: Date,
  now: Date
): BtcObservationCandidate {
  const stats = payload as any;
  const totalReward = finitePositive(stats?.totalReward);
  const totalFee = Number(stats?.totalFee);
  const startBlock = Number(stats?.startBlock);
  const endBlock = Number(stats?.endBlock);
  if (!totalReward || !Number.isFinite(totalFee) || totalFee < 0 || totalFee >= totalReward
      || !Number.isInteger(startBlock) || !Number.isInteger(endBlock) || endBlock < startBlock
      || !Number.isFinite(startBlockAt.getTime()) || !Number.isFinite(endBlockAt.getTime())
      || endBlockAt <= startBlockAt || endBlockAt > now) {
    throw new Error("invalid_reward_stats_contract");
  }
  const subsidy = totalReward - totalFee;
  const ratio = totalFee / subsidy;
  if (!Number.isFinite(ratio) || ratio < 0) throw new Error("invalid_fee_subsidy_ratio");
  return {
    metricId: "security.fee_subsidy_ratio",
    sourceId: "network.primary",
    sourceUrl: REWARD_STATS_URL,
    valueNumeric: ratio,
    unit: "ratio",
    observedAt: endBlockAt,
    periodStart: startBlockAt,
    periodEnd: endBlockAt,
    methodology: `Mempool.space reward-stats/144; fee/subsidy ratio = totalFee / (totalReward - totalFee) over block heights ${startBlock}-${endBlock}; timestamps verified from block-height endpoints.`,
    status: "NORMAL",
    freshness: freshnessFor(endBlockAt, now),
  };
}

function decodeHtml(value: string): string {
  return value
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<img\b[^>]*alt=["']([^"']*)["'][^>]*>/gi, " $1 ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, " ")
    .trim();
}
function parseFarsideDate(value: string): Date | null {
  const match = value.trim().match(/^(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})$/);
  if (!match) return null;
  const months: Record<string, number> = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };
  const month = months[match[2].toLowerCase()];
  if (month === undefined) return null;
  const date = new Date(Date.UTC(Number(match[3]), month, Number(match[1])));
  return date.getUTCFullYear() === Number(match[3]) && date.getUTCMonth() === month && date.getUTCDate() === Number(match[1]) ? date : null;
}
function parseFlowNumber(value: string): number | null {
  const text = value.trim().replace(/,/g, "");
  if (!text || text === "-" || text.toLowerCase() === "n/a") return null;
  const negative = /^\(.*\)$/.test(text);
  const n = Number(text.replace(/^\(|\)$/g, ""));
  if (!Number.isFinite(n)) return null;
  return negative ? -n : n;
}

export function parseFarsideBtcFlows(html: string, now: Date): BtcObservationCandidate[] {
  const rows = [...html.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)].map(match =>
    [...match[1].matchAll(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi)].map(cell => decodeHtml(cell[1]))
  );
  const headerIndex = rows.findIndex(cells =>
    cells.length >= 3 && cells[cells.length - 1].toLowerCase() === "total" && cells[0].toLowerCase() !== "total"
  );
  if (headerIndex < 0) throw new Error("farside_total_column_missing");
  const totalIndex = rows[headerIndex].length - 1;
  const candidates: BtcObservationCandidate[] = [];
  for (const cells of rows.slice(headerIndex + 1)) {
    if (cells.length <= totalIndex) continue;
    const observedAt = parseFarsideDate(cells[0]);
    if (!observedAt || observedAt.getTime() > now.getTime() || now.getTime() - observedAt.getTime() > FOURTEEN_DAYS_MS) continue;
    const fundCells = cells.slice(1, totalIndex);
    if (fundCells.length === 0 || fundCells.every(cell => parseFlowNumber(cell) === null)) continue;
    const valueNumeric = parseFlowNumber(cells[totalIndex]);
    if (valueNumeric === null) continue;
    const periodEnd = new Date(observedAt.getTime() + 24 * 60 * 60 * 1000);
    candidates.push({
      metricId: "institutional.etf_net_flow",
      sourceId: "institutional.primary",
      sourceUrl: FARSIDE_URL,
      valueNumeric,
      unit: "USD million/day",
      observedAt,
      periodStart: observedAt,
      periodEnd,
      methodology: "Farside Investors BTC ETF table Total column; reporting date represented as UTC day; rows with no reported fund values are skipped.",
      status: "NORMAL",
      freshness: freshnessFor(observedAt, now),
    });
  }
  const unique = new Map<number, BtcObservationCandidate>();
  for (const candidate of candidates) {
    const key = candidate.observedAt.getTime();
    const existing = unique.get(key);
    if (!existing) unique.set(key, candidate);
  }
  return [...unique.values()].sort((a, b) => a.observedAt.getTime() - b.observedAt.getTime());
}

async function fetchBlockTimestamp(fetchImpl: Fetcher, height: number): Promise<Date> {
  const hash = (await responseText(fetchImpl, `https://mempool.space/api/block-height/${height}`)).trim();
  if (!/^[0-9a-f]{64}$/i.test(hash)) throw new Error("invalid_block_hash_response");
  const block = await responseJson(fetchImpl, `https://mempool.space/api/block/${hash}`);
  const timestamp = toDateFromSeconds(block?.timestamp);
  if (!timestamp) throw new Error("block_timestamp_missing");
  return timestamp;
}

export async function collectBtcObservationCandidates(options: {
  fetchImpl?: Fetcher;
  now?: Date;
} = {}): Promise<CandidateCollection> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const now = options.now ?? new Date();
  if (!Number.isFinite(now.getTime())) throw new TypeError("now must be a valid date");
  const candidates: BtcObservationCandidate[] = [];
  const failures: CandidateCollection["failures"] = [];
  const collect = async (metricId: string, fn: () => Promise<BtcObservationCandidate[] | BtcObservationCandidate | null>) => {
    try {
      const result = await fn();
      if (result === null || (Array.isArray(result) && result.length === 0)) throw new Error("no_valid_source_rows");
      candidates.push(...(Array.isArray(result) ? result : [result]));
    } catch (error) {
      failures.push({ metric_id: metricId, reason: error instanceof Error ? error.message : "source_collection_failed" });
    }
  };

  await Promise.all([
    collect("market.spot_price", async () => {
      const payload = await responseJson(fetchImpl, BINANCE_URL);
      if (payload?.symbol !== "BTCUSDT") throw new Error("unexpected_binance_symbol");
      const price = finitePositive(payload?.price);
      if (!price) throw new Error("invalid_spot_price");
      const observedAt = new Date(Math.floor(now.getTime() / 60_000) * 60_000);
      return {
        metricId: "market.spot_price",
        sourceId: "market_binance",
        sourceUrl: BINANCE_URL,
        valueNumeric: price,
        unit: "USD/BTC",
        observedAt,
        periodStart: null,
        periodEnd: null,
        methodology: "Binance public BTCUSDT ticker; endpoint does not include a quote timestamp, so observed_at is the UTC collection minute.",
        status: "NORMAL",
        freshness: "CURRENT",
      };
    }),
    collect("security.hashrate", async () => {
      const payload = await responseJson(fetchImpl, HASHRATE_URL);
      const candidate = parseHashratePayload(payload, now);
      if (!candidate) throw new Error("no_complete_hashrate_day");
      return candidate;
    }),
    collect("security.fee_subsidy_ratio", async () => {
      const stats = await responseJson(fetchImpl, REWARD_STATS_URL);
      const startBlock = Number(stats?.startBlock);
      const endBlock = Number(stats?.endBlock);
      if (!Number.isInteger(startBlock) || !Number.isInteger(endBlock) || endBlock < startBlock) throw new Error("invalid_reward_stats_block_range");
      const [startBlockAt, endBlockAt] = await Promise.all([
        fetchBlockTimestamp(fetchImpl, startBlock),
        fetchBlockTimestamp(fetchImpl, endBlock),
      ]);
      return parseRewardStatsPayload(stats, startBlockAt, endBlockAt, now);
    }),
    collect("institutional.etf_net_flow", async () => {
      const html = await responseText(fetchImpl, FARSIDE_URL);
      return parseFarsideBtcFlows(html, now);
    }),
  ]);

  return {
    retrievedAt: now.toISOString(),
    candidates: candidates.sort((a, b) => a.observedAt.getTime() - b.observedAt.getTime() || a.metricId.localeCompare(b.metricId)),
    failures,
    unresolvedMetrics: ["macro.dxy"],
  };
}

function samePayload(row: any, candidate: BtcObservationCandidate): boolean {
  const existingNumeric = row.value_numeric === null || row.value_numeric === undefined ? null : Number(row.value_numeric);
  return existingNumeric === candidate.valueNumeric
    && row.value_integer == null
    && row.value_boolean == null
    && row.value_text == null
    && row.value_json == null
    && row.unit === candidate.unit
    && row.source_url === candidate.sourceUrl
    && row.methodology === candidate.methodology
    && row.status === candidate.status
    && row.freshness === candidate.freshness;
}

export async function persistBtcObservation(databaseUrl: string, candidate: BtcObservationCandidate) {
  return withSqlTransaction(databaseUrl, async client => {
    const lockKey = [
      "btc", candidate.metricId, candidate.sourceId, candidate.observedAt.toISOString(),
      candidate.periodStart?.toISOString() ?? "", candidate.periodEnd?.toISOString() ?? "",
    ].join("|");
    await client.query("SELECT pg_advisory_xact_lock(hashtextextended($1, 0))", [lockKey]);
    const existing = await client.query(
      `SELECT revision,value_numeric,value_integer,value_boolean,value_text,value_json,unit,source_url,methodology,status,freshness
       FROM observations
       WHERE asset_id='btc' AND metric_id=$1 AND source_id=$2 AND observed_at=$3
         AND period_start IS NOT DISTINCT FROM $4::timestamptz
         AND period_end IS NOT DISTINCT FROM $5::timestamptz
       ORDER BY revision DESC LIMIT 1 FOR UPDATE`,
      [candidate.metricId, candidate.sourceId, candidate.observedAt, candidate.periodStart, candidate.periodEnd]
    );
    const latest = existing.rows[0];
    if (latest && samePayload(latest, candidate)) {
      return { action: "unchanged" as const, revision: Number(latest.revision) };
    }
    const revision = latest ? Number(latest.revision) + 1 : 1;
    await client.query(
      `INSERT INTO observations (
         metric_id,asset_id,value_numeric,value_integer,value_boolean,value_text,value_json,
         unit,observed_at,period_start,period_end,source_id,source_url,methodology,status,freshness,revision
       ) VALUES ($1,'btc',$2,NULL,NULL,NULL,NULL,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
      [candidate.metricId,candidate.valueNumeric,candidate.unit,candidate.observedAt,candidate.periodStart,candidate.periodEnd,
       candidate.sourceId,candidate.sourceUrl,candidate.methodology,candidate.status,candidate.freshness,revision]
    );
    return { action: latest ? "revised" as const : "inserted" as const, revision };
  });
}

export async function refreshBtcObservationInputs(databaseUrl: string, options: { fetchImpl?: Fetcher; now?: Date } = {}) {
  const collection = await collectBtcObservationCandidates(options);
  const writeResults = await Promise.all(collection.candidates.map(async candidate => {
    try {
      const result = await persistBtcObservation(databaseUrl, candidate);
      return { metric_id: candidate.metricId, observed_at: candidate.observedAt.toISOString(), ...result };
    } catch (error) {
      return { metric_id: candidate.metricId, observed_at: candidate.observedAt.toISOString(), action: "failed" as const, reason: error instanceof Error ? error.message : "persistence_failed" };
    }
  }));
  const failures = [...collection.failures, ...writeResults.filter(x => x.action === "failed").map(x => ({ metric_id: x.metric_id, reason: "persistence_failed" }))];
  return {
    status: failures.length ? "partial" : "ok",
    retrieved_at: collection.retrievedAt,
    candidate_count: collection.candidates.length,
    inserted: writeResults.filter(x => x.action === "inserted").length,
    revised: writeResults.filter(x => x.action === "revised").length,
    unchanged: writeResults.filter(x => x.action === "unchanged").length,
    failures,
    unresolved_metrics: collection.unresolvedMetrics,
    writes: writeResults,
  };
}
