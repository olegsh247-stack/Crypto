/**
 * Runtime source/endpoint contract for the opt-in BTC observation collector.
 * Keep provider endpoints and canonical metric/source/unit mapping here so
 * collection code does not independently redefine source identity.
 *
 * This catalog is a runtime adapter contract, not production-ingestion approval.
 */
export const BTC_SOURCE_CATALOG = {
  spotPrice: {
    metricId: "market.spot_price",
    sourceId: "market.kraken",
    url: "https://api.kraken.com/0/public/Trades?pair=XBTUSD",
    unit: "USD/BTC",
  },
  hashrate: {
    metricId: "security.hashrate",
    sourceId: "network.primary",
    url: "https://mempool.space/api/v1/mining/hashrate/1w",
    unit: "EH/s",
  },
  feeSubsidyRatio: {
    metricId: "security.fee_subsidy_ratio",
    sourceId: "network.primary",
    url: "https://mempool.space/api/v1/mining/reward-stats/144",
    unit: "ratio",
  },
  etfNetFlow: {
    metricId: "institutional.etf_net_flow",
    sourceId: "institutional.primary",
    url: "https://farside.co.uk/btc/",
    unit: "USD million/day",
  },
  blockByHeightUrl: (height: number) => `https://mempool.space/api/block-height/${height}`,
  blockByHashUrl: (hash: string) => `https://mempool.space/api/block/${hash}`,
} as const;
