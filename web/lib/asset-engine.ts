export type AssetTab = "assets" | "pair" | "commodities";

export type AssetEngineItem = {
  id: string;
  symbol: string;
  name: string;
  kind: AssetTab;
  type?: string | null;
  researchStatus?: string | null;
  enabled: boolean;
};

export function normalizeAsset(asset: any): AssetEngineItem {
  const kind = asset?.category === "pair" ? "pair" : asset?.category === "commodity" ? "commodities" : "assets";
  return {
    id: String(asset?.asset_id ?? asset?.id ?? asset?.symbol ?? ""),
    symbol: String(asset?.symbol ?? ""),
    name: String(asset?.name ?? asset?.symbol ?? ""),
    kind,
    type: asset?.asset_type?.name ?? asset?.asset_type?.code ?? null,
    researchStatus: asset?.research_status ?? null,
    enabled: asset?.enabled !== false,
  };
}

export function filterByTab(items: AssetEngineItem[], tab: AssetTab) {
  return items.filter((item) => item.kind === tab && item.enabled);
}

export function nextAction(tab: AssetTab): "add-pair" | "add-asset" | "add-commodity" {
  if (tab === "pair") return "add-pair";
  if (tab === "commodities") return "add-commodity";
  return "add-asset";
}
