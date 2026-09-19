# Crypto project integrations

The Crypto repository is the canonical research/data layer.

## Registered applications

### alt-tracker

Repository: https://github.com/olegsh247-stack/alt-tracker

Role:
- existing market-tracking application;
- exchange price and kline adapters;
- pair/ratio calculations;
- commodity market module;
- candidate ingestion adapter and future website component.

Integration status: DISCOVERED / NOT YET CONNECTED

The repository has been inspected structurally. No changes were made to alt-tracker during this integration step.

Canonical boundary:

alt-tracker -> normalized observations -> CryptoDataModel -> API -> website
