import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const sql = readFileSync(new URL("./audit-stage3-observations.sql", import.meta.url), "utf8");
const executableSql = sql
  .split("\n")
  .filter(line => !line.trimStart().startsWith("--") && !line.trimStart().startsWith("\\echo"))
  .join("\n")
  .trim();

test("Stage 3 observation inventory is read-only and covers all four assets", () => {
  assert.match(executableSql, /^BEGIN TRANSACTION READ ONLY;/i);
  assert.match(executableSql, /COMMIT;$/i);
  assert.doesNotMatch(executableSql, /\b(INSERT|UPDATE|DELETE|MERGE|CREATE|ALTER|DROP|TRUNCATE|CALL|DO|GRANT|REVOKE|COPY)\b/i);
  for (const assetId of ["btc", "eth", "sol", "cake"]) {
    assert.match(executableSql, new RegExp("'" + assetId + "'"));
  }
  assert.equal((executableSql.match(/WITH target_assets AS/gi) ?? []).length, 1);
  assert.equal((executableSql.match(/WITH duplicate_groups AS/gi) ?? []).length, 1);
  assert.match(executableSql, /HAVING count\(\*\) > 1/i);
  assert.match(executableSql, /source_payload_sha256/i);
  assert.match(executableSql, /invalid_payload_sha256/i);
  assert.match(executableSql, /!~\* '\^\[a-f0-9\]\{64\}\$'/i);
  assert.match(executableSql, /missing_source_row_key/i);
  assert.match(executableSql, /missing_methodology_version/i);
  assert.match(executableSql, /source_updated_at/i);
  assert.match(executableSql, /methodology_version/i);
  assert.match(executableSql, /missing_registered_source/i);
});
