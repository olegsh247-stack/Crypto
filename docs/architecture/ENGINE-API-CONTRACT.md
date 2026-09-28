# Dynamic Engine API Contract

The UI must call the API for mutations. It must never write directly to Neon.

## Read

`GET /api/assets`

Returns enabled Assets with Asset Type and Research Status.

`GET /api/assets/:id`

Returns the complete Asset detail used by AssetDetail.

## Mutations

The implementation may expose these operations through the existing API layer:

- `POST /api/assets` — create/enable an Asset.
- `DELETE /api/assets/:id` — disable an Asset without deleting historical research or observations.
- `POST /api/pairs` — create/enable a Pair.
- `DELETE /api/pairs/:id` — disable a Pair.
- `POST /api/commodities` — create/enable a Commodity.
- `DELETE /api/commodities/:id` — disable a Commodity.

All mutation endpoints must validate input server-side and return the normalized engine item. They must never accept arbitrary SQL or table names from the client.

## Important implementation rule

Until the corresponding persistence tables/endpoints exist, the UI should not claim that an add/remove action succeeded. The client can validate and prepare an action, but the server remains the source of truth.
