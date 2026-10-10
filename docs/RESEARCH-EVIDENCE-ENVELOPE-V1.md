# Research evidence envelope v1

**Status:** internal ingestion contract; not a published Research Snapshot.  
**Assets currently in scope:** SOL and CAKE.  
**Purpose:** preserve provenance and definitions when normalizing direct RPC facts, third-party historical metrics and issuer reports.

## Shape

Each document is a JSON object with `schema_version: "1.0"` and a non-empty `metrics` array. Each metric is one observation and must include:

| Field | Meaning |
|---|---|
| `asset_id` | `SOL` or `CAKE` |
| `metric_id` | Stable snake_case identifier, e.g. `circulating_supply`, `non_vote_successful_transactions`, `protocol_revenue` |
| `value` | Finite JSON number or exact decimal string; prefer decimal strings for token quantities |
| `unit` | Explicit unit, e.g. `SOL`, `CAKE`, `transactions/day`, `USD` |
| `source_id` | Stable source/method identifier |
| `source_url` | HTTPS URL for the source |
| `methodology_url` | Optional HTTPS definition/methodology URL |
| `observed_at_utc` | Time the observation represents, timezone required |
| `retrieved_at_utc` | Time Crypto retrieved the record, timezone required |
| `evidence_kind` | `onchain_observation`, `provider_metric`, `issuer_report`, or `derived_metric` |
| `window_start_utc`, `window_end_utc` | Optional pair; both required together and start must precede end |
| `freshness_lag_seconds` | Optional non-negative lag when known; do not infer if unknown |
| `raw_artifact_ref` | Optional stable reference to the retained raw artifact |
| `definition` | Optional source-specific semantic definition |

## Guardrails

1. A metric is not publication-ready merely because it passes schema validation.
2. Do not label fee payers as retained users without cohort evidence.
3. Do not conflate total supply, circulating supply, burn-address balance, protocol revenue, gross fees, holder revenue, or token emissions.
4. Keep the source's native units and definition; convert only in a separately identified derived metric.
5. Keep provider observations and issuer-reported claims separate from direct chain reads.
6. Preserve unknown freshness as null rather than fabricating a lag.
7. The validator performs no network access, database writes, chain transactions, deployments or publication.
8. The schema is an internal first iteration; expanding supported asset IDs or evidence kinds requires a reviewed code + documentation change.

## Local validation

```bash
python scripts/research/validate_evidence_envelope.py path/to/evidence.json
cd scripts/research
python -m unittest discover -s tests -v
```

The validator is deliberately dependency-free and checks structural/provenance basics only. Semantic review, source credibility, window alignment, supply reconciliation and publication approval remain separate gates.
