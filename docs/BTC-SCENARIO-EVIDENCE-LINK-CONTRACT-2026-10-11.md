# BTC scenario evidence-link contract — 2026-10-11

**Status:** implementation proposal on PR branch; not production-applied.  
**Asset in scope:** BTC only.  
**Purpose:** make each Bull/Base/Bear definition traceable to existing evidence without pretending stale market data is current.

## Key correction: freshness is runtime state, not a reason to stop building

Research definitions, observations and current market readings have different lifetimes. We should not wait for every number to remain fresh while developing the product. Instead, preserve the observation's actual `observed_at`, retrieve/update data independently, and evaluate freshness at request/display time against a metric-specific policy.

- **Historical research baseline:** remains tied to the published snapshot and its real research/as-of timestamp. Build time must never refresh it.
- **Time-sensitive market observations:** display value, source, `observed_at`, age and freshness status. Stale data may remain available for portability/tests, but must be visibly marked stale and excluded from any “current market” assertion.
- **Slow-changing protocol facts:** use a metric-specific review interval; do not apply a universal one-hour TTL to maximum supply or block subsidy.
- **Retrieval time vs observation time:** where supported by the ingestion contract, retain both. Retrieval time says when Crypto fetched a record; it does not say when the represented event/value occurred.
- **Decision snapshots:** any scenario assessment records the exact research snapshot and the exact observation/evidence timestamps used. A new market tick should not silently rewrite an immutable research snapshot.

This means we can continue implementing contracts and tests now; live readings will be refreshed when the ingestion path runs. We should not invent freshness or move timestamps forward to make a gate pass.

## Existing contract and gap

The existing `research_scenarios` table has one Bull/Base/Bear definition per snapshot, a probability, assumptions, free-text `supporting_evidence`, invalidation text, thesis impact and confidence. The existing `evidence` table already has stable UUID `evidence_id`, snapshot, claim, observation/source links, as-of, status, confidence and thesis impact.

The free-text `supporting_evidence` field cannot prove which rows support or contradict a scenario, so probabilities and confidence are not reproducible from the API payload alone.

## Additive schema proposal

Migration artifact: `infrastructure/neon/migrations/2026-10-11-research-scenario-evidence-links.sql`

It introduces `research_scenario_evidence` with:
- `snapshot_id`, `research_scenario_id`, `evidence_id`;
- `relation_type`: `supports`, `contradicts`, `invalidation`, or `context`;
- required human-readable `rationale`;
- composite foreign keys that enforce scenario/evidence membership in the same snapshot.

This is a link table, not a new scenario engine. It preserves current definitions and Evidence records. It does not create links automatically, alter the 50/30/20 probabilities, or create a `scenario_states` row. The migration is additive and idempotent; it has not been run against production.

## Link acceptance rules

A link is accepted only after a reviewer can answer:
1. What exact claim does the Evidence row make?
2. Does the cited source directly support that claim, and is the source time-relevant?
3. Does the claim support, contradict, invalidate, or contextualize this specific scenario?
4. Is its observation measured or qualitative assessment? Do not treat qualitative text as a numeric market signal.
5. Is the observation fresh enough for the role assigned to it? Freshness is metric-specific, not a universal clock.
6. Is the rationale explicit enough for another reviewer to reproduce the link?

Do not link evidence to scenarios solely because it is from the same snapshot or has a positive thesis impact.

## Probability and confidence policy

The current Base 50% / Bull 30% / Bear 20% values are existing analyst judgments, not outputs derivable from the current API contract. Until a separate reviewed methodology defines how probabilities are elicited or calculated:
- preserve existing values as **analyst-assigned scenario weights**;
- do not label them statistically calibrated probabilities;
- do not recalculate them from a count of positive/negative Evidence rows;
- expose the assumptions, supporting and contradicting Evidence links, and rationale that informed the judgment;
- record methodology/version and assessment as-of in a future scenario assessment record before claiming reproducibility over time.

Confidence is also an assessment, not the probability that the scenario occurs. Keep these concepts separate.

## Runtime/API follow-up

Implementation status on PR branch `fix/vps-worker-london-schedule-parity`:
1. **Implemented in code:** both Worker API and VPS API project `research_scenario_evidence` into each scenario as `evidence_links`, including relation/rationale, claim, Evidence assessment, source URL, observation value/unit and actual observation timestamp. Empty links are returned as `[]`, not omitted.
2. **Read-only preflight extended:** `scripts/btc-scenario-preflight.mjs` validates snapshot lineage, relation types, non-empty rationale, source URL and observation timestamps when the new field is exposed. It explicitly reports older deployed APIs that do not yet expose the field instead of misreporting them as a passing implementation.
3. **Source review completed; narrow seed artifact added:** see `docs/BTC-EVIDENCE-REVIEW-2026-10-11.md` and `infrastructure/neon/migrations/2026-10-12-btc-scenario-evidence-links-seed.sql`. The seed resolves the SEC Evidence row by exact claim + source ID within the BTC snapshot (UUIDs are database-generated and are not hard-coded). It contains one Bull `supports` link and one Bear `context` link. Base remains unlinked because current Evidence/source URLs do not directly support its central claim. The seed has not been applied to any production database; CI applies it only in disposable PostgreSQL.
4. **Still outstanding:** display-time freshness classification by metric policy; stale values must remain visibly stale rather than silently dropped or refreshed.
5. Scenario-state creation remains separate and requires explicit authorization after read-only scenario acceptance.

**Rollout ordering:** apply `2026-10-11-research-scenario-evidence-links.sql` first, then the later-dated `2026-10-12-btc-scenario-evidence-links-seed.sql`, through the separately approved migration process before deploying either API version that queries `research_scenario_evidence`. The current PR is not production-applied; no production migration or deployment is authorized here.

## Latest CI correction — 2026-10-11

VPS Build Rehearsal #314 found a preflight ordering defect, not an Evidence-link or observation-parity defect: the script already allowed exactly four reviewed source IDs to be staged on the disposable VPS, but its later generic `registered_sources` count assertion still demanded equal raw counts (live Worker 9, VPS 13). The check now accepts that count delta only when the earlier exact-ID validation confirms the four expected sources and no extra/missing source IDs. All other structural counts remain strict. This does not change the live API, database, migrations or source data. Re-run the read-only preflight before treating the correction as validated.

## Acceptance status — updated 2026-10-11

- **Disposable migration/build rehearsal:** PASS on code commit `9fdc0270ca96099fd162cfb634711c6198807f3a`: [VPS API Build Rehearsal #38159782685](https://github.com/olegsh247-stack/Crypto/actions/runs/38159782685), [Product Contour Gate #38159782922](https://github.com/olegsh247-stack/Crypto/actions/runs/38159782922).
- **VPS implementation:** the two reviewed SEC-proposal links pass the row-level contract (Bull `supports`, Bear `context`); Base deliberately remains unlinked. These are narrow, claim-specific links, not proof that the scenarios are quantitatively calibrated.
- **Deployed Worker parity:** NOT COMPLETE. The live Worker still does not expose `evidence_links` or scenario-definition `snapshot_id`; the preflight reports the rollout gap rather than treating the projections as equal. Production rollout requires a separate explicit approval.
- **Source/evidence quality:** NOT ACCEPTED for a current BTC scenario state. The ETF-flow source has conflicting historical totals; the stored hashrate value/date does not match the cited article; circulating supply lacks a reproducible source and may be mislabeled UTXO-set amount. See `docs/BTC-EVIDENCE-REVIEW-2026-10-11.md`.
- **Quantitative monitoring:** qualitative baseline only; no metric/factor links or thresholds are exposed. No thresholds are invented.
- **Scenario state:** zero persisted rows; no state write is authorized by this document.
- **Production:** no production migration, deployment, database write or scenario-state write was performed or authorized. PR #9 remains draft/unmerged.
