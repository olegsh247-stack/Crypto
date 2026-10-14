/**
 * Explicit U.S. equity session calendar for 2026.
 * Source: official NYSE and Nasdaq holiday schedules (links in docs).
 * Early-close dates are trading sessions and are intentionally retained.
 * This module fails closed outside the published calendar year.
 */
const YEAR = 2026;
const HOLIDAYS = new Set([
  "2026-01-01", // New Year's Day
  "2026-01-19", // Martin Luther King Jr. Day
  "2026-02-16", // Washington's Birthday / Presidents Day
  "2026-04-03", // Good Friday
  "2026-05-25", // Memorial Day
  "2026-06-19", // Juneteenth
  "2026-07-03", // Independence Day observed
  "2026-09-07", // Labor Day
  "2026-11-26", // Thanksgiving Day
  "2026-12-25", // Christmas Day
]);

const pad = value => String(value).padStart(2, "0");
const isoDate = date => `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;

export function getUsEquitySessionDates2026({ from, through } = {}) {
  const valid = value => typeof value === "string"
    && /^2026-\d{2}-\d{2}$/.test(value)
    && (() => {
      const date = new Date(value + "T00:00:00Z");
      return Number.isFinite(date.getTime()) && isoDate(date) === value;
    })();
  if (from != null && !valid(from)) throw new TypeError("from must be a valid 2026 ISO date");
  if (through != null && !valid(through)) throw new TypeError("through must be a valid 2026 ISO date");
  const start = from ?? "2026-01-01";
  const end = through ?? "2026-12-31";
  if (start > end) throw new RangeError("from must not be after through");

  const sessions = [];
  for (let cursor = new Date(start + "T00:00:00Z"), last = new Date(end + "T00:00:00Z");
    cursor <= last;
    cursor.setUTCDate(cursor.getUTCDate() + 1)) {
    const day = cursor.getUTCDay();
    const value = isoDate(cursor);
    if (day !== 0 && day !== 6 && !HOLIDAYS.has(value)) sessions.push(value);
  }
  return sessions;
}

export const US_EQUITY_CALENDAR_2026_METADATA = Object.freeze({
  calendar_id: "us-equity-sessions-2026",
  source_urls: [
    "https://www.nyse.com/trade/hours-calendars",
    "https://www.nasdaq.com/market-activity/stock-market-holiday-schedule",
  ],
  coverage: "2026-01-01/2026-12-31",
  early_closes_are_sessions: true,
  holidays_are_exchange_closed_days: true,
  supported_years: [2026],
});
