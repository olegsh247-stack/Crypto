export type Commodity = {
  id: string;
  symbol: string;
  name: string;
  unit?: string | null;
  enabled: boolean;
};

export function normalizeCommodity(item: any): Commodity {
  return {
    id: String(item?.id ?? item?.symbol ?? ""),
    symbol: String(item?.symbol ?? ""),
    name: String(item?.name ?? item?.symbol ?? ""),
    unit: item?.unit ?? null,
    enabled: item?.enabled !== false,
  };
}
