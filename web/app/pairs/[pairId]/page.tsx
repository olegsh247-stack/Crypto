import Link from "next/link";
import { getPairHistory, getPairs } from "../../../lib/api";
import MarketTabs from "../../components/MarketTabs";
import { PAIR_RESEARCH_BLOCKS } from "../../../lib/pair-research";
import { getRelativeStrengthSignal } from "../../../lib/relative-strength";

export default async function PairPage({ params }: { params: Promise<{ pairId: string }> }) {
  const { pairId } = await params; let data:any;
  try { data = await getPairs(); } catch(e) { return <main className="shell"><MarketTabs/><div className="error section">Unable to load pairs: {e instanceof Error ? e.message : "unknown error"}</div></main>; }
  const pair = (data.items ?? data.pairs ?? []).find((p:any) => String(p.id) === pairId || String(p.symbol).toLowerCase() === decodeURIComponent(pairId).toLowerCase());
  if (!pair) return <main className="shell"><MarketTabs/><div className="error section">Pair not found: {decodeURIComponent(pairId)}</div></main>;

  let live:any = null;
  try { live = await getPairHistory(pair.symbol, 30, "1d"); } catch { live = null; }
  const rows = live?.rows ?? [];
  const last = rows.at(-1) ?? null;
  const first = rows[0] ?? null;
  const changePct = first?.pair && last?.pair ? ((Number(last.pair) / Number(first.pair)) - 1) * 100 : null;
  const signal = changePct === null ? null : getRelativeStrengthSignal(changePct);

  return <main className="shell"><MarketTabs/>
    <header className="section"><Link href="/pairs">← Pairs</Link><p className="muted">Pair monitor</p><div className="row"><div><h1>{pair.symbol}</h1><p className="muted">Relative-value instrument · {pair.exchange ?? "Exchange not specified"}</p></div><span className="pill">{pair.enabled ? "Active" : "Disabled"}</span></div></header>
    <section className="card section"><div className="row"><div><p className="muted">Executive view</p><h2>Relative strength</h2></div><span className="pill">{signal?.label ?? "Unavailable"}</span></div><p>{signal?.interpretation ?? "Relative strength will be calculated when pair history is available."}</p>{signal && <div className="card" style={{marginTop:16}}><div className="row"><strong>{changePct! >= 0 ? "+" : ""}{changePct!.toFixed(1)}% vs quote asset · 30d</strong><span className="pill">{signal.direction}</span></div><p className="muted">{live?.source ? `Live calculation from ${live.source} daily candles.` : "Live market data unavailable."}</p></div>}</section>
    <section className="grid section"><div className="card"><span className="muted">Current pair value</span><h2>{last?.pair != null ? Number(last.pair).toPrecision(8) : "—"}</h2></div><div className="card"><span className="muted">Base asset USD</span><h2>{last?.baseUsd != null ? Number(last.baseUsd).toLocaleString() : "—"}</h2></div><div className="card"><span className="muted">Quote asset USD</span><h2>{last?.quoteUsd != null ? Number(last.quoteUsd).toLocaleString() : "—"}</h2></div><div className="card"><span className="muted">30d relative change</span><h2>{changePct !== null ? `${changePct >= 0 ? "+" : ""}${changePct.toFixed(1)}%` : "—"}</h2></div></section>
    <section className="section card"><div className="row"><div><p className="muted">Monitoring</p><h2>Relative strength signal</h2></div><span className="pill">{signal ? signal.label : "Unavailable"}</span></div><div className="row"><span>Instrument</span><strong>{pair.symbol}</strong></div><div className="row"><span>Current reading</span><strong>{changePct !== null ? `${changePct >= 0 ? "+" : ""}${changePct.toFixed(1)}%` : "—"}</strong></div><div className="row"><span>Data source</span><span className="muted">{live?.source ?? "Unavailable"}</span></div><div className="row"><span>Interpretation</span><span className="muted">Base asset performance relative to quote asset</span></div></section>
    <section className="section"><div className="row"><div><h2>Pair Research Framework</h2><p className="muted">Generic analytical questions for this market instrument. Asset research remains attached to the underlying assets.</p></div><span className="pill">15 blocks</span></div><div className="grid">{PAIR_RESEARCH_BLOCKS.map(b=><article className="card" key={b.number}><div className="row"><strong>{String(b.number).padStart(2,"0")}</strong><span className="pill">Framework</span></div><h3>{b.title}</h3><p>{b.question}</p></article>)}</div></section>
    <p className="muted section">Pair data are market observations. Fundamental research belongs to the underlying Asset Cards, not to the Pair.</p>
  </main>;
}
