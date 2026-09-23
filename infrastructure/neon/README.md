# Neon database

This directory contains the PostgreSQL schema for CryptoDataModel v1.

## Purpose

Neon stores normalized observations, research snapshots, monitoring state, scenario state, and permanent daily market history.

Realtime 1H/4H market data is deliberately temporary and is not stored in PostgreSQL.

## Tables

- `assets` — curated asset universe.
- `metric_definitions` — stable machine-readable metric registry.
- `sources` — source registry.
- `observations` — canonical normalized measurements and revisions.
- `research_snapshots` — versioned research conclusions.
- `monitoring_events` — monitoring triggers and their lifecycle.
- `scenario_states` — current/recorded scenario states.
- `market_daily_candles` — permanent 1D market history used to derive 7D views.
- `schema_migrations` — migration bookkeeping.

## Design rules

1. Primary source -> ingestion -> normalized observation -> validation -> snapshot/history -> API -> UI.
2. Observations are append-oriented; corrections are represented by revisions rather than silent overwrites.
3. Research snapshots are versioned and remain immutable after publication.
4. Website code must not silently rewrite fundamental research conclusions.
5. Market history uses the actual source timestamp/convention supplied by the exchange.
6. 1H/4H data is temporary; 1D is permanent; 7D is derived from stored daily candles.

Neon provides standard PostgreSQL connection URIs, including pooled connection URIs for applications with many concurrent connections. 
