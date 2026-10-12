# Daily candle finalization contract

## Purpose

The daily market-candle table may contain the current UTC day's candle before its close time. That row is useful as an in-progress observation, but it must not silently be treated as a completed daily close in history-derived calculations.

## Contract

- A candle is finalized only when `candle_close_at <= now()` in the database.
- The asset API history includes `is_finalized` so consumers can distinguish completed candles from the current in-progress candle.
- Stored candle history used by calculations excludes rows whose `candle_close_at` is still in the future.
- Ingestion may continue to upsert the current daily candle idempotently; this contract does not require deleting or rewriting production rows.
- This is an API/query contract change only. No schema migration or production data repair is required.

## Verification

The read-only production database audit on 2026-10-12 found 14 daily candle rows for each of nine enabled non-USDT assets: 13 finalized candles and one current candle closing at 2026-10-13 00:00 UTC. Structural checks found no duplicate candle keys or invalid OHLCV relationships, but historical source parity for the completed 2026-10-09 through 2026-10-11 candles remains unverified.

After the code change is merged and deployed, verify that the BTC asset response labels the in-progress candle with `is_finalized: false`, and that finalized history calculations exclude it. Use read-only requests only; do not run ingestion as part of this verification.
