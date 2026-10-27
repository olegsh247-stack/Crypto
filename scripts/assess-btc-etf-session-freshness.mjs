import { readFile } from "node:fs/promises";

const calendarUrl = new URL("../data/CryptoDataModel/calendars/us-etf-equity-session-calendar-2026-2028.json", import.meta.url);

function localDateParts(now, timeZone) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone, year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23"
  }).formatToParts(now);
  return Object.fromEntries(parts.filter(p => p.type !== "literal").map(p => [p.type, p.value]));
}
function isoDate(y, m, d) { return `${y}-${m}-${d}`; }
function previousDate(date) {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}
function isWeekend(date) {
  const day = new Date(`${date}T12:00:00Z`).getUTCDay();
  return day === 0 || day === 6;
}
function calendarDateSets(calendar) {
  return {
    closures: new Set(calendar.full_closures.map(x => x.date)),
    early: new Map(calendar.early_closes.map(x => [x.date, x.local_close_time]))
  };
}
export function latestCompletedUsEtfSession(now, calendar) {
  const instant = new Date(now);
  if (!Number.isFinite(instant.getTime())) throw new TypeError("now must be a valid date");
  const p = localDateParts(instant, calendar.timezone);
  let date = isoDate(p.year, p.month, p.day);
  const { closures, early } = calendarDateSets(calendar);
  const inCoverage = value => calendar.coverage_years.includes(Number(value.slice(0, 4)));
  if (!inCoverage(date)) return { status: "BLOCKED_CALENDAR_COVERAGE", session_date: null };
  const closeTime = early.get(date) ?? "16:00";
  const localMinutes = Number(p.hour) * 60 + Number(p.minute);
  const [closeHour, closeMinute] = closeTime.split(":").map(Number);
  if (!isWeekend(date) && !closures.has(date) && localMinutes >= closeHour * 60 + closeMinute) {
    return { status: "SESSION_COMPLETED", session_date: date, close_time_local: closeTime, timezone: calendar.timezone };
  }
  for (let i = 0; i < 10; i++) {
    date = previousDate(date);
    if (!inCoverage(date)) return { status: "BLOCKED_CALENDAR_COVERAGE", session_date: null };
    if (!isWeekend(date) && !closures.has(date)) {
      return { status: "SESSION_COMPLETED", session_date: date, close_time_local: early.get(date) ?? "16:00", timezone: calendar.timezone };
    }
  }
  return { status: "BLOCKED_NO_SESSION_FOUND", session_date: null };
}

/**
 * This validator deliberately separates exchange-session logic from provider
 * publication timing. It cannot pass production freshness while that policy is
 * undefined, and it never manufactures observed_at from a session date.
 */
export function assessEtfSessionFreshness({ now, calendar, rows, publicationPolicy }) {
  const latestSession = latestCompletedUsEtfSession(now, calendar);
  if (latestSession.status !== "SESSION_COMPLETED") {
    return { status: latestSession.status, expected_session_date: null, observed_at: null };
  }
  if (!publicationPolicy || publicationPolicy.status !== "reviewed"
      || !Number.isInteger(publicationPolicy.max_session_lag)
      || publicationPolicy.max_session_lag < 0) {
    return {
      status: "BLOCKED_PROVIDER_PUBLICATION_WINDOW_UNDEFINED",
      expected_session_date: latestSession.session_date,
      latest_complete_row_date: null,
      observed_at: null,
      note: "Exchange calendar does not establish when Farside publishes a session row."
    };
  }
  const completeDates = new Set(rows.filter(row =>
    row?.status === "REPORTED_CANDIDATE"
    && row?.fund_values_complete === true
    && row?.reconciliation_status === "MATCHES_DISPLAY_ROUNDING"
    && /^\\d{4}-\\d{2}-\\d{2}$/.test(String(row?.period_start ?? ""))
    && row.period_start <= latestSession.session_date
  ).map(row => row.period_start));
  const ordered = [...completeDates].sort().reverse();
  const latestComplete = ordered[0] ?? null;
  // max_session_lag is applied to actual scheduled sessions, not elapsed hours.
  let expected = latestSession.session_date;
  const { closures } = calendarDateSets(calendar);
  let lag = 0;
  while (!completeDates.has(expected) && lag <= publicationPolicy.max_session_lag) {
    if (lag === publicationPolicy.max_session_lag) break;
    expected = previousDate(expected);
    while (isWeekend(expected) || closures.has(expected)) expected = previousDate(expected);
    lag++;
  }
  const passed = completeDates.has(latestSession.session_date)
    || (latestComplete !== null && lag <= publicationPolicy.max_session_lag && completeDates.has(expected));
  return {
    status: passed ? "SESSION_FRESHNESS_REVIEW_PASS" : "BLOCKED_LATEST_EXPECTED_SESSION_MISSING_OR_INCOMPLETE",
    expected_session_date: latestSession.session_date,
    accepted_row_date: passed ? expected : null,
    latest_complete_row_date: latestComplete,
    session_lag: passed ? lag : null,
    observed_at: null,
    note: "Research contract result only; does not approve production ingestion."
  };
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  const calendar = JSON.parse(await readFile(calendarUrl, "utf8"));
  const [nowArg] = process.argv.slice(2);
  console.log(JSON.stringify({
    latest_completed_session: latestCompletedUsEtfSession(nowArg ?? new Date(), calendar),
    publication_policy: "UNDEFINED — no production freshness pass until provider publication window is reviewed"
  }, null, 2));
}
