import Link from "next/link";
import { getPairs } from "../../../lib/api";
import MarketTabs from "../../components/MarketTabs";
import { PAIR_RESEARCH_BLOCKS, pairResearchProgress } from "../../../lib/pair-research";
import { CAKE_BTC_RESEARCH } from "../../../lib/cake-btc-research";
import { getRelativeStrengthSignal } from "../../../lib/relative-strength";

export default async function PairPage({ params }: { params: Promise<{ pairId: string }> }) {
  const { pairId } = await params; let data:any;
  try { data = await getPairs(); } catch(e) { return <main className="shell"><MarketTabs/><div className="error section">Unable to load pairs: {e instanceof Error ? e.message : "unknown error"}</div></main>; }
  const pair = (data.pairs ?? []).find((p:any) => String(p.id) === pairId || String(p.symbol).toLowerCase() === decodeURIComponent(pairId).toLowerCase());
  if (!pair) return <main className="shell"><MarketTabs/><div className="error section">Pair not found: {decodeURIComponent(pairId)}</div></main>;
  const seeded = pair.symbol.toUpperCase() === "CAKE/BTC";
  const progress = seeded ? { completed: 15, total: 15, percent: 100 } : pairResearchProgress([]);
  const conclusion = seeded ? CAKE_BTC_RESEARCH.conclusion : "Pair Research asks whether the base asset is becoming stronger or weaker relative to the quote asset.";
  const signal = seeded ? getRelativeStrengthSignal(CAKE_BTC_RESEARCH.market.cakeBtc30dChangeApproxPct) : null;
  return <main className="shell"><MarketTabs/>
    <header className="section"><Link href="/pairs">← Pairs</Link><p className="muted">Pair Research</p><div className="row"><div><h1>{pair.symbol}</h1><p className="muted">Relative-value research · {pair.exchange ?? "Exchange not specified"}</p></div><span className="pill">{seeded ? "Research complete" : `${progress.percent}%`}</span></div></header>
    <section className="card section"><div className="row"><div><p className="muted">Executive view</p><h2>Relative strength</h2></div><span className="pill">{signal?.label ?? "Not started"}</span></div><p>{conclusion}</p>{signal && <div className="card" style={{marginTop:16}}><div className="row"><strong>{signal.changePct >= 0 ? "+" : ""}{signal.changePct.toFixed(1)}% vs BTC · 30d</strong><span className="pill">{signal.direction}</span></div><p className="muted">{signal.interpretation}</p><p className="muted">This signal is generated from the selected relative-return period; it is not an investment recommendation.</p></div>}<div className="row" style={{marginTop:16}}><strong>{progress.completed}/{progress.total} blocks</strong><strong>{progress.percent}%</strong></div><div style={{height:8,background:"var(--viz-border)",borderRadius:99,overflow:"hidden",marginTop:10}}><div style={{height:"100%",width:`${progress.percent}%`,background:"var(--viz-accent)"}}/></div><div className="row" style={{marginTop:16}}><Link className="button" href={`/pairs/${encodeURIComponent(pair.symbol)}/research`}>Open full research</Link></div></section>
    {seeded && <section className="grid section"><div className="card"><span className="muted">CAKE/BTC</span><h2>{CAKE_BTC_RESEARCH.market.cakeBtc.toFixed(8)}</h2></div><div className="card"><span className="muted">30d relative change</span><h2>+{CAKE_BTC_RESEARCH.market.cakeBtc30dChangeApproxPct.toFixed(1)}%</h2></div><div className="card"><span className="muted">CAKE USD</span><h2>${CAKE_BTC_RESEARCH.market.cakeUsd.toFixed(3)}</h2></div><div className="card"><span className="muted">BTC USD</span><h2>${CAKE_BTC_RESEARCH.market.btcUsd.toLocaleString()}</h2></div></section>}
    {seeded && <section className="section card"><div className="row"><div><p className="muted">Monitoring</p><h2>Relative strength signal</h2></div><span className="pill">Active</span></div><div className="row"><span>CAKE/BTC 30d</span><strong>{signal!.label}</strong></div><div className="row"><span>Current reading</span><strong>{signal!.changePct >= 0 ? "+" : ""}{signal!.changePct.toFixed(1)}%</strong></div><div className="row"><span>Next review trigger</span><span className="muted">Signal changes category or crosses ±5% / ±20%</span></div></section>}
    <section className="section"><div className="row"><h2>Pair Research</h2><span className="pill">15 blocks</span></div><div className="grid">{PAIR_RESEARCH_BLOCKS.map(b=><article className="card" key={b.number}><div className="row"><strong>{String(b.number).padStart(2,"0")}</strong><span className="pill">{seeded ? "Complete" : "Not started"}</span></div><h3>{b.title}</h3><p>{seeded ? (CAKE_BTC_RESEARCH.chapters as any)[b.number] : <span className="muted">{b.question}</span>}</p></article>)}</div></section>
    {seeded && <p className="muted section">Research snapshot: {CAKE_BTC_RESEARCH.asOf}. Market data are observations, not investment advice.</p>}
  </main>;
}
