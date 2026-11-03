import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const sql = readFileSync(new URL("./audit-stage3-observations.sql", import.meta.url), "utf8");
const executableSql = sql
  .split("\n")
  .filter(line => !line.trimStart().startsWith("--") && !line.trimStart().startsWith("\\echo"))
  .join("\n");

test("Stage 3 observation inventory is read-only and covers all four assets", () => {
  assert.doesNotMatch(executableSql, /\b(INSERT|UPDATE|DELETE|MERGE|CREATE|ALTER|DROP|TRUNCATE|CALL|DO|GRANT|REVOKE)\b/i);
  for (const assetId of ["btc", "eth", "sol", "cake"]) {
    assert.match(executableSql, new RegExp("'" + assetId + "'"));
  }
  assert.match(executableSql, /HAVING count\(\*\) > 1/i);
  assert.match(executableSql, /source_payload_sha256/i);
  assert.match(executableSql, /missing_registered_source/i);
});
