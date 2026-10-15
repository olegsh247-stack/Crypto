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
  assert.equal(parsed.calculated_fund_sum_usd_million, -484.9);
  assert.equal(parsed.fund_sum_minus_reported_total_usd_million, 0);
  assert.equal(parsed.reconciliation_status, "MATCHES_DISPLAY_ROUNDING");
  assert.equal(parsed.status, "REPORTED_CANDIDATE");
  assert.equal(parsed.fund_completeness_status, "ALL_FUNDS_REPORTED");
  assert.equal(parsed.funds_reported_count, 12);
  assert.deepEqual(parsed.missing_funds, []);
  assert.equal(parsed.observed_at, null);
});

test("preserves dash placeholders as null instead of converting them to zero", () => {
  const result = parseFarsideEtfTable(row("14 Oct 2026", [...Array(12).fill("-"), "0.0"]));
  const parsed = result.latest_rows[0];
  assert.equal(parsed.status, "UNREPORTED_PLACEHOLDER");
  assert.equal(parsed.reported_total_usd_million, 0);
  assert.ok(Object.values(parsed.fund_flows).every(value => value === null));
  assert.equal(parsed.calculated_fund_sum_usd_million, null);
  assert.equal(parsed.reconciliation_status, "UNREPORTED");
  assert.equal(parsed.observed_at, null);
});

test("distinguishes explicit zero from missing fund values in a partial session", () => {
  const values = ["(110.9)", "(152.7)", "2.2", "-", "-", "-", "-", "-", "-", "-", "-", "-", "(261.4)"];
  const parsed = parseFarsideEtfTable(row("14 Oct 2026", values)).latest_rows[0];
  assert.equal(parsed.status, "REPORTED_CANDIDATE");
  assert.equal(parsed.fund_completeness_status, "PARTIAL_FUND_REPORTING");
  assert.equal(parsed.funds_reported_count, 3);
  assert.deepEqual(parsed.missing_funds, ["BTCO", "EZBC", "BRRR", "HODL", "BTCW", "MSBT", "GBTC", "BTC"]);
  assert.equal(parsed.fund_flows.BITB, 2.2);
  assert.equal(parsed.fund_flows.BRRR, null);
  assert.equal(parsed.reconciliation_status, "INCOMPLETE");
  assert.equal(parsed.observed_at, null);
});

test("does not treat malformed or undated rows as observations", () => {
  const html = row("Not a date", [...Array(12).fill("0.0"), "0.0"]) + "<tr><td>Summary</td></tr>";
  const result = parseFarsideEtfTable(html);
  assert.equal(result.parsed_reporting_row_count, 0);
  assert.deepEqual(result.latest_rows, []);
});

test("flags material aggregate-versus-fund discrepancies instead of normalizing them away", () => {
  const values = ["(207.7)", "(105.1)", "(27.6)", "(101.7)", "0.0", "0.0", "(2.1)", "0.0", "0.0", "0.0", "(39.3)", "0.0", "(484.9)"];
  const parsed = parseFarsideEtfTable(row("07 Oct 2026", values)).latest_rows[0];
  assert.equal(parsed.calculated_fund_sum_usd_million, -483.5);
  assert.equal(parsed.fund_sum_minus_reported_total_usd_million, 1.4);
  assert.equal(parsed.reconciliation_status, "MATERIAL_DIFFERENCE");
  assert.equal(parsed.status, "REPORTED_CANDIDATE");
  assert.equal(parsed.observed_at, null);
});

test("allows only the one-decimal rounding envelope for aggregate reconciliation", () => {
  const values = ["(207.7)", "(105.1)", "(27.6)", "(101.7)", "0.0", "0.0", "(2.1)", "0.0", "0.0", "0.0", "(39.3)", "0.0", "(484.0)"];
  const parsed = parseFarsideEtfTable(row("07 Oct 2026", values)).latest_rows[0];
  assert.equal(parsed.calculated_fund_sum_usd_million, -483.5);
  assert.equal(parsed.fund_sum_minus_reported_total_usd_million, 0.5);
  assert.equal(parsed.reconciliation_status, "MATCHES_DISPLAY_ROUNDING");
});
