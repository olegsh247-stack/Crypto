import { NextResponse } from "next/server";
import { getLiveRelativeStrength } from "../../../../../lib/pair-history";
import { getRelativeStrengthSignal } from "../../../../../lib/relative-strength";

export async function GET(request: Request, { params }: { params: Promise<{ pairId: string }> }) {
  const { pairId } = await params;
  const url = new URL(request.url);
  const daysParam = Number(url.searchParams.get("days") ?? "30");
  const days = Number.isFinite(daysParam) ? Math.max(1, Math.min(Math.floor(daysParam), 180)) : 30;
  const [baseSymbol, quoteSymbol] = pairId.toUpperCase().split("-");
  if (!baseSymbol || !quoteSymbol) return NextResponse.json({ error: "Pair must be BASE-QUOTE" }, { status: 400 });
  try {
    const result = await getLiveRelativeStrength(baseSymbol, quoteSymbol, days);
    return NextResponse.json({ ...result, signal: getRelativeStrengthSignal(result.changePct) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to calculate relative strength" }, { status: 502 });
  }
}
