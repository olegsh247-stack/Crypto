import type { AssetTab, AssetEngineItem } from "./asset-engine";
import { canAddPair, pairKey } from "./pair-engine";

export type EngineAction =
  | { type: "add-asset"; symbol: string; name: string }
  | { type: "remove-asset"; id: string }
  | { type: "add-pair"; symbol: string; exchange?: string }
  | { type: "remove-pair"; id: string }
  | { type: "add-commodity"; symbol: string; name: string; unit?: string }
  | { type: "remove-commodity"; id: string };

export function actionForAdd(tab: AssetTab, values: Record<string, string>): EngineAction | null {
  if (tab === "assets") {
    const symbol = values.symbol?.trim().toUpperCase();
    const name = values.name?.trim();
    return symbol && name ? { type: "add-asset", symbol, name } : null;
  }
  if (tab === "pair") {
    const base = values.base?.trim().toUpperCase();
    const quote = values.quote?.trim().toUpperCase();
    if (!base || !quote || !canAddPair(base, quote)) return null;
    return { type: "add-pair", symbol: pairKey(base, quote), exchange: values.exchange?.trim() || undefined };
  }
  const symbol = values.symbol?.trim().toUpperCase();
  const name = values.name?.trim();
  return symbol && name ? { type: "add-commodity", symbol, name, unit: values.unit?.trim() || undefined } : null;
}

export function actionForRemove(tab: AssetTab, item: AssetEngineItem): EngineAction {
  if (tab === "assets") return { type: "remove-asset", id: item.id };
  if (tab === "pair") return { type: "remove-pair", id: item.id };
  return { type: "remove-commodity", id: item.id };
}
