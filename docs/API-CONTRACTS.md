# Crypto API Contracts

Дата: 2026-10-07

Канонический runtime API: `workers/crypto-api/src/index.ts`.
Канонические Web TypeScript contracts: `shared/api-contract.ts`.
Lifecycle/freshness contracts: `shared/research-status-contract.ts`.

## Общие правила

- JSON responses use `Cache-Control: no-store`.
- Admin mutations require `Authorization: Bearer <ADMIN_TOKEN>`.
- Public read endpoints do not require admin authentication.
- Asset and pair identifiers are normalized server-side.
- API errors expose stable error codes, not raw exception messages.
- Market Pair identity is `(exchange, symbol)`.

## Health

### GET /api/health

Returns:

```json
{"status":"ok","service":"crypto-api"}
```

### GET /api/db-health

Returns database health and server time. Failure uses HTTP 503.

## Assets

### GET /api/assets

Returns the enabled Asset Registry plus research/lifecycle data used by the Web UI.

Canonical identity fields include:

- `asset_id`
- `symbol`
- `name`
- `asset_type`
- `enabled`
- `research_status`
- `research_status_source`
- `research_freshness`

Research freshness is normalized as an object in asset detail responses:

```ts
{
  status: "current" | "update_recommended" | "outdated",
  reason: string | null,
  last_research_at: string | null,
  last_major_update_at?: string | null,
  next_review_at?: string | null
}
```

The lifecycle authority is the server Engine; Web must not independently derive lifecycle state.

### POST /api/assets

Admin-only mutation.

Minimum contract:

```json
{
  "asset_id": "example",
  "symbol": "EXAMPLE",
  "name": "Example",
  "asset_type": "token"
}
```

An enabled asset must have a valid primary asset type. New unclassified assets are disabled.

## Market Pairs

### GET /api/pairs

Returns:

```ts
{
  items: MarketPair[],
  pairs: MarketPair[],
  count: number
}
```

`MarketPair`:

```ts
{
  id: string;
  symbol: string;
  base_asset_id: string;
  base_asset: string;
  quote_asset_id: string;
  quote_asset: string;
  exchange: string;
  enabled: boolean;
  created_at?: string;
  disabled_at?: string | null;
}
```

### POST /api/pairs

Admin-only.

Required:

- `symbol`: `BASE/QUOTE`
- `exchange`

The server resolves both legs through the Asset Registry and persists the canonical pair identity `(exchange, symbol)`.

### DELETE /api/pairs/:pairId

Admin-only pair disable operation.

## Pair history

### GET /api/pairs/:pairId/history

History resolution is pair-first:

1. resolve the canonical Market Pair;
2. obtain its exchange and symbol;
3. use the registered history adapter/fallback;
4. return normalized history.

Response contract:

```ts
{
  status: "ok";
  source: string;
  pair: string;
  interval: string;
  days: number;
  rows: Array<{
    time: string;
    pair: number;
    baseUsd: number;
    quoteUsd: number;
  }>;
  normalized?: {
    relative: Array<{ value: number }>;
    base: Array<{ value: number }>;
    quote: Array<{ value: number }>;
  };
  interpretation?: {
    relative_strength?: string;
  };
}
```

## Research lifecycle

Lifecycle values:

`not_started | in_progress | complete | monitoring`

Freshness values:

`current | update_recommended | outdated`

The shared contract is defined in `shared/research-status-contract.ts` and is the single lifecycle authority for Worker and Web normalization.

## Runtime proof

Release Gate #50 verifies:

- clean DB bootstrap;
- API/Web build;
- Worker deployment;
- live API E2E;
- scheduled ingestion/idempotency;
- deployed Engine contract;
- post-deploy Web runtime E2E;
- ETH lifecycle and freshness rendering;
- canonical pair navigation.

## Security boundary

Do not expose `ADMIN_TOKEN` to browser code. Web mutations go through server-side admin proxy paths.

CORS is intentionally still marked for infrastructure review until the production Web origin is explicitly fixed.
