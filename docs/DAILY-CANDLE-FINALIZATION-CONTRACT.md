# Daily candle finalization contract

## Purpose

The daily market-candle table may contain the current UTC day's candle before its close time. That row is useful as an in-progress observation, but it must not silently be treated as a completed daily close in history-derived calculations.

## Contract

- A candle is finalized only when `candle_close_at <= now()` in PostgreSQL.
- Asset API history exposes `is_finalized` so consumers can distinguish completed candles from the current in-progress candle.
- Stored candle history used by calculations excludes rows whose `candle_close_at` is still in the future.
- Ingestion may continue to upsert the current daily candle idempotently; this contract does not require deleting or rewriting production rows.
- This is an API/query contract change only. No schema migration or production data repair is required.
- The VPS API implementation applies the contract in `vps/api/src/app.ts`. The former runtime Worker implementation remains a removed source path until the VPS cutover is explicitly completed; keep the contract equivalent during the transition.

## Verification

The read-only production database audit on 2026-10-12 found 14 daily candle rows for each of nine enabled non-USDT assets: 13 finalized candles and one current candle closing at 2026-10-13 00:00 UTC. Structural checks found no duplicate candle keys or invalid OHLCV relationships, but historical source parity for the completed 2026-10-09 through 2026-10-11 candles remains unverified.

For the VPS build, verify against a disposable PostgreSQL database that:
1. a candle with `candle_close_at > now()` appears in asset history with `is_finalized: false`;
2. the same in-progress candle is excluded from stored history used by calculations;
3. a candle with `candle_close_at <= now()` remains included and is labelled finalized.

Use read-only requests for production verification. Do not run ingestion against production as part of this check.
