import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [catalog, candidateScript] = await Promise.all([
  readFile(new URL("../vps/worker/src/btc-source-catalog.ts", import.meta.url), "utf8"),
  readFile(new URL("./prepare-btc-observation-candidates.mjs", import.meta.url), "utf8"),
]);

test("review-only BTC spot candidate uses the canonical runtime Kraken endpoint", () => {
  const catalogSpot = /spotPrice:\s*\{[\s\S]*?metricId:\s*"market\.spot_price",[\s\S]*?sourceId:\s*"market\.kraken",[\s\S]*?url:\s*"([^"]+)"[\s\S]*?unit:\s*"USD\/BTC"/.exec(catalog);
  const candidateUrl = /const KRAKEN_URL\s*=\s*"([^"]+)"/.exec(candidateScript);
  assert.ok(catalogSpot, "runtime BTC spot catalog entry must declare metric, source, URL and unit");
  assert.ok(candidateUrl, "candidate-preparation script must declare its Kraken endpoint");
  assert.equal(candidateUrl[1], catalogSpot[1], "review candidate endpoint must match the runtime source catalog");
  assert.match(candidateScript, /source\?\.source_id\s*!==\s*"market\.kraken"/);
  assert.match(candidateScript, /source\?\.metric_id\s*===\s*"market\.spot_price"/);
  assert.match(candidateScript, /unit:\s*"USD\/BTC"/);
});
