import test from "node:test";
import assert from "node:assert/strict";
import { parseFarsideEtfTable } from "./parse-farside-etf-table.mjs";

const row = (date, values) => `<tr><td><span class="tabletext">${date}</span></td>${values.map(v => `<td><div><span class="tabletext">${v}</span></div></td>`).join("")}</tr>`;

test("parses reported daily fund values, negatives in parentheses, and USD-million units", () => {
  const values = ["(207.7)", "(105.1)", "(27.6)", "(101.7)", "0.0", "0.0", "0.0", "(3.5)", "0.0", "0.0", "(39.3)", "0.0", "(484.9)"];
  const result = parseFarsideEtfTable(row("07 Oct 2026", values));
  assert.equal(result.parsed_reporting_row_count, 1);
  const parsed = result.latest_rows[0];
  assert.equal(parsed.period_start, "2026-10-07");
  assert.equal(parsed.unit, "USD million/day");
  assert.equal(parsed.fund_flows.IBIT, -207.7);
  assert.equal(parsed.fund_flows.BRRR, 0);
  assert.equal(parsed.reported_total_usd_million, -484.9);
  assert.equal(parsed.status, "REPORTED_CANDIDATE");
  assert.equal(parsed.observed_at, null);
});

test("preserves dash placeholders as null instead of converting them to zero", () => {
  const result = parseFarsideEtfTable(row("14 Oct 2026", [...Array(12).fill("-"), "0.0"]));
  const parsed = result.latest_rows[0];
  assert.equal(parsed.status, "UNREPORTED_PLACEHOLDER");
  assert.equal(parsed.reported_total_usd_million, 0);
  assert.ok(Object.values(parsed.fund_flows).every(value => value === null));
  assert.equal(parsed.observed_at, null);
});

test("does not treat malformed or undated rows as observations", () => {
  const html = row("Not a date", [...Array(12).fill("0.0"), "0.0"]) + "<tr><td>Summary</td></tr>";
  const result = parseFarsideEtfTable(html);
  assert.equal(result.parsed_reporting_row_count, 0);
  assert.deepEqual(result.latest_rows, []);
});
