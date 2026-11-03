import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [catalog, candidateScript] = await Promise.all([
  readFile(new URL("../vps/worker/src/btc-source-catalog.ts", import.meta.url), "utf8"),
  readFile(new URL("./prepare-btc-observation-candidates.mjs", import.meta.url), "utf8"),
]);

test("review-only BTC spot candidate uses the canonical runtime Kraken endpoint", () => {
  const spotPriceBlock = /spotPrice:\s*\{([^}]*)\}/.exec(catalog)?.[1];
  assert.ok(spotPriceBlock, "runtime BTC spot catalog entry must exist");
  const metricId = /metricId:\s*"([^"]+)"/.exec(spotPriceBlock)?.[1];
  const sourceId = /sourceId:\s*"([^"]+)"/.exec(spotPriceBlock)?.[1];
  const catalogUrl = /url:\s*"([^"]+)"/.exec(spotPriceBlock)?.[1];
  const unit = /unit:\s*"([^"]+)"/.exec(spotPriceBlock)?.[1];
  const candidateUrl = /const KRAKEN_URL\s*=\s*"([^"]+)"/.exec(candidateScript)?.[1];

  assert.equal(metricId, "market.spot_price");
  assert.equal(sourceId, "market.kraken");
  assert.equal(unit, "USD/BTC");
  assert.ok(catalogUrl, "runtime spot catalog must declare its endpoint");
  assert.ok(candidateUrl, "candidate-preparation script must declare its Kraken endpoint");
  assert.equal(candidateUrl, catalogUrl, "review candidate endpoint must match the runtime source catalog");
  assert.match(candidateScript, /source\?\.source_id\s*!==\s*"market\.kraken"/);
  assert.match(candidateScript, /source\?\.metric_id\s*===\s*"market\.spot_price"/);
  assert.match(candidateScript, /source\.url\s*!==\s*KRAKEN_URL/);
  assert.match(candidateScript, /source\.quote_unit\s*!==\s*"USD\/BTC"/);
});
