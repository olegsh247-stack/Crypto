import test from "node:test";
import assert from "node:assert/strict";
import { parseFarsideEtfTable } from "./parse-farside-etf-table.mjs";

const row = (date, values) => `<tr><td><span class="tabletext">${date}</span></td>${values.map(v => `<td><div><span class="tabletext">${v}</span></div></td>`).join("")}</tr>`;

test("parses reported daily fund values, negatives in parentheses, and USD-million units", () => {
  const values = ["(207.7)", "(105.1)", "(27.6)", "(101.7)", "0.0", "0.0", "(3.5)", "0.0", "0.0", "0.0", "(39.3)", "0.0", "(484.9)"];
  const result = parseFarsideEtfTable(row("07 Oct 2026", values));
  assert.equal(result.parsed_reporting_row_count, 1);
  const parsed = result.latest_rows[0];
  assert.equal(parsed.period_start, "2026-10-07");
  assert.equal(parsed.unit, "USD million/day");
  assert.equal(parsed.fund_flows.IBIT, -207.7);
  assert.equal(parsed.fund_flows.BRRR, -3.5);
  assert.equal(parsed.reported_total_usd_million, -484.9);
  assert.equal(parsed.calculated_fund_sum_usd_million, -483.5);
  assert.equal(parsed.fund_sum_minus_reported_total_usd_million, 1.4);
  assert.equal(parsed.reconciliation_status, "MATERIAL_DIFFERENCE");
  assert.equal(parsed.status, "REPORTED_CANDIDATE");
  assert.equal(parsed.observed_at, null);
});

test("preserves dash placeholders as null instead of converting them to zero", () => {
  const result = parseFarsideEtfTable(row("14 Oct 2026", [...Array(12).fill("-"), "0.0"]));
  const parsed = result.latest_rows[0];
  assert.equal(parsed.status, "UNREPORTED_PLACEHOLDER");
  assert.equal(parsed.reported_total_usd_million, 0);
  assert.ok(Object.values(parsed.fund_flows).every(value => value === null));
  assert.equal(parsed.fund_values_complete, false);
  assert.equal(parsed.calculated_fund_sum_usd_million, null);
  assert.equal(parsed.reconciliation_status, "UNREPORTED");
  assert.equal(parsed.observed_at, null);
});

test("does not treat malformed or undated rows as observations", () => {
  const html = row("Not a date", [...Array(12).fill("0.0"), "0.0"]) + "<tr><td>Summary</td></tr>";
  const result = parseFarsideEtfTable(html);
  assert.equal(result.parsed_reporting_row_count, 0);
  assert.deepEqual(result.latest_rows, []);
  assert.equal(result.latest_reporting_date, null);
  assert.equal(result.latest_reported_date, null);
});

test("exposes latest reported session, page date, full fund coverage, and reconciliation separately", () => {
  const latest = row("16 Oct 2026", ["(71.8)", "(10.6)", "0.0", "0.0", "0.0", "0.0", "0.0", "0.0", "0.0", "0.0", "0.0", "0.0", "(82.4)"]);
  const html = latest + "<footer>Today's date is 17 October 2026. Your IP: 127.0.0.1</footer>";
  const result = parseFarsideEtfTable(html);
  assert.equal(result.page_generated_date, "2026-10-17");
  assert.equal(result.latest_reporting_date, "2026-10-16");
  assert.equal(result.latest_reported_date, "2026-10-16");
  assert.equal(result.latest_reported_row.fund_values_complete, true);
  assert.equal(result.latest_reported_row.reported_total_usd_million, -82.4);
  assert.equal(result.latest_reported_row.calculated_fund_sum_usd_million, -82.4);
  assert.equal(result.latest_reported_row.reconciliation_status, "MATCHES_DISPLAY_ROUNDING");
  assert.equal(result.latest_reported_row.observed_at, null);
});

test("does not infer a page date when provider footer is absent", () => {
  const result = parseFarsideEtfTable(row("16 Oct 2026", [...Array(12).fill("0.0"), "0.0"]));
  assert.equal(result.page_generated_date, null);
  assert.equal(result.latest_reported_date, "2026-10-16");
});

test("allows only the one-decimal rounding envelope for aggregate reconciliation", () => {
  const values = ["(207.7)", "(105.1)", "(27.6)", "(101.7)", "0.0", "0.0", "(2.1)", "0.0", "0.0", "0.0", "(39.3)", "0.0", "(484.0)"];
  const parsed = parseFarsideEtfTable(row("07 Oct 2026", values)).latest_rows[0];
  assert.equal(parsed.calculated_fund_sum_usd_million, -483.5);
  assert.equal(parsed.fund_sum_minus_reported_total_usd_million, 0.5);
  assert.equal(parsed.reconciliation_status, "MATCHES_DISPLAY_ROUNDING");
});
