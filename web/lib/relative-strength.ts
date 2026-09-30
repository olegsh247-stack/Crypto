export type RelativeStrengthSignal = {
  label: "Strong outperforming" | "Outperforming" | "Neutral" | "Underperforming" | "Strong underperforming";
  direction: "positive" | "neutral" | "negative";
  changePct: number;
  interpretation: string;
};

export function getRelativeStrengthSignal(changePct: number): RelativeStrengthSignal {
  const value = Number.isFinite(changePct) ? changePct : 0;
  if (value >= 20) return { label: "Strong outperforming", direction: "positive", changePct: value, interpretation: `Base asset is materially outperforming the quote asset over the selected period (+${value.toFixed(1)}%).` };
  if (value >= 5) return { label: "Outperforming", direction: "positive", changePct: value, interpretation: `Base asset is outperforming the quote asset over the selected period (+${value.toFixed(1)}%).` };
  if (value > -5) return { label: "Neutral", direction: "neutral", changePct: value, interpretation: `Relative performance is broadly balanced over the selected period (${value >= 0 ? "+" : ""}${value.toFixed(1)}%).` };
  if (value > -20) return { label: "Underperforming", direction: "negative", changePct: value, interpretation: `Base asset is underperforming the quote asset over the selected period (${value.toFixed(1)}%).` };
  return { label: "Strong underperforming", direction: "negative", changePct: value, interpretation: `Base asset is materially underperforming the quote asset over the selected period (${value.toFixed(1)}%).` };
}
