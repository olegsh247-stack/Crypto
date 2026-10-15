const FUND_KEYS = ["IBIT", "FBTC", "BITB", "ARKB", "BTCO", "EZBC", "BRRR", "HODL", "BTCW", "MSBT", "GBTC", "BTC"];
const MONTHS = { Jan:"01", Feb:"02", Mar:"03", Apr:"04", May:"05", Jun:"06", Jul:"07", Aug:"08", Sep:"09", Oct:"10", Nov:"11", Dec:"12" };

function textOf(html) {
  return html.replace(/<[^>]*>/g, " ").replace(/&nbsp;|&#160;/gi, " ").replace(/&amp;/gi, "&").replace(/\s+/g, " ").trim();
}

function parseDate(value) {
  const m = /^(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})$/.exec(value);
  if (!m || !MONTHS[m[2]]) return null;
  return `${m[3]}-${MONTHS[m[2]]}-${m[1].padStart(2, "0")}`;
}

function parseNumber(value) {
  const s = value.trim();
  if (!s || s === "-" || s === "—") return null;
  const negative = /^\([\d,]+(?:\.\d+)?\)$/.test(s);
  const normalized = s.replace(/[(),]/g, "");
  if (!/^\d+(?:\.\d+)?$/.test(normalized)) return null;
  const number = Number(normalized);
  return Number.isFinite(number) ? (negative ? -number : number) : null;
}

/**
 * Parse only dated data rows from the official Farside all-data HTML table.
 * Values are in displayed USD millions. Missing dashes remain null; an all-dash
 * row with a displayed total of 0.0 is flagged as an unreported placeholder.
 * This parser intentionally does not invent observed_at/publication timestamps.
 */
export function parseFarsideEtfTable(html, { recentRows = 14 } = {}) {
  const rows = [];
  for (const match of html.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)) {
    const cells = [...match[1].matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)].map(x => textOf(x[1]));
    if (cells.length < 14) continue;
    const period = parseDate(cells[0]);
    if (!period) continue;
    const fundFlows = Object.fromEntries(FUND_KEYS.map((key, i) => [key, parseNumber(cells[i + 1])]));
    const reportedTotal = parseNumber(cells[13]);
    const fundValues = Object.values(fundFlows);
    const allFundsMissing = fundValues.every(value => value === null);
    const allFundsReported = fundValues.every(value => value !== null);
    const fundsReportedCount = fundValues.filter(value => value !== null).length;
    const missingFunds = Object.entries(fundFlows).filter(([, value]) => value === null).map(([fund]) => fund);
    const fundCompletenessStatus = allFundsMissing ? "NO_FUND_VALUES_REPORTED"
      : allFundsReported ? "ALL_FUNDS_REPORTED"
      : "PARTIAL_FUND_REPORTING";
    const status = allFundsMissing && reportedTotal === 0
      ? "UNREPORTED_PLACEHOLDER"
      : fundValues.some(value => value !== null)
        ? "REPORTED_CANDIDATE"
        : "UNRESOLVED_ROW";
    const calculatedFundSum = allFundsReported
      ? Number(fundValues.reduce((sum, value) => sum + value, 0).toFixed(6))
      : null;
    const delta = calculatedFundSum !== null && reportedTotal !== null
      ? Number((calculatedFundSum - reportedTotal).toFixed(6))
      : null;
    // Each of 12 fund values and the displayed total is rounded to one decimal.
    // The theoretical sum-vs-total rounding envelope is 12*0.05 + 0.05 = 0.65m.
    // This is diagnostic only; it does not approve the row for ingestion.
    const reconciliationStatus = status === "UNREPORTED_PLACEHOLDER"
      ? "UNREPORTED"
      : calculatedFundSum === null || reportedTotal === null
        ? "INCOMPLETE"
        : Math.abs(delta) <= 0.650001
          ? "MATCHES_DISPLAY_ROUNDING"
          : "MATERIAL_DIFFERENCE";
    rows.push({
      period_start: period,
      period_end: period,
      source_reporting_date: cells[0],
      unit: "USD million/day",
      fund_flows: fundFlows,
      funds_reported_count: fundsReportedCount,
      funds_expected_count: FUND_KEYS.length,
      missing_funds: missingFunds,
      fund_completeness_status: fundCompletenessStatus,
      reported_total_usd_million: reportedTotal,
      calculated_fund_sum_usd_million: calculatedFundSum,
      fund_sum_minus_reported_total_usd_million: delta,
      reconciliation_status: reconciliationStatus,
      status,
      observed_at: null
    });
  }
  return {
    parsed_reporting_row_count: rows.length,
    latest_rows: rows.slice(-Math.max(1, recentRows)),
    latest_reported_rows: rows.filter(row => row.status === "REPORTED_CANDIDATE").slice(-5),
    parser_version: "farside-all-data-html-v2"
  };
}
