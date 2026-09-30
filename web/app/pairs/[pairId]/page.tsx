import Link from "next/link";
import { getPairs } from "../../../lib/api";
import MarketTabs from "../../components/MarketTabs";
import { PAIR_RESEARCH_BLOCKS, pairResearchProgress } from "../../../lib/pair-research";

export default async function PairPage({ params }: { params: Promise<{ pairId: string }> }) {
  const { pairId } = await params;
  let data:any;
  try { data = await getPairs(); } catch(e) { return <main className="shell"><MarketTabs/><div className="error section">Unable to load pairs: {e instanceof Error ? e.message : "unknown error"}</div></main>; }
  const pair = (data.pairs ?? []).find((p:any) => String(p.id) === pairId || String(p.symbol).toLowerCase() === decodeURIComponent(pairId).toLowerCase());
  if (!pair) return <main className="shell"><MarketTabs/><div className="error section">Pair not found: {decodeURIComponent(pairId)}</div></main>;
  const progress = pairResearchProgress([]);
  return <main className="shell"><MarketTabs/>
    <header className="section"><Link href="/pairs">← Pairs</Link><p className="muted">Pair Research</p><div className="row"><div><h1>{pair.symbol}</h1><p className="muted">Relative-value research · {pair.exchange ?? "Exchange not specified"}</p></div><span className="pill">{progress.percent}%</span></div></header>
    <section className="card section"><div className="row"><div><p className="muted">Executive view</p><h2>Relative strength</h2></div><span className="pill">Not started</span></div><p>Pair Research asks whether the base asset is becoming stronger or weaker relative to the quote asset. The research engine will combine price, volume, liquidity, fundamentals and regime signals.</p><div className="row"><strong>{progress.completed}/{progress.total} blocks</strong><strong>{progress.percent}%</strong></div><div style={{height:8,background:"var(--viz-border)",borderRadius:99,overflow:"hidden",marginTop:10}}><div style={{height:"100%",width:`${progress.percent}%`,background:"var(--viz-accent)"}}/></div><div className="row" style={{marginTop:16}}><Link className="button" href={`/pairs/${encodeURIComponent(pair.symbol)}/research`}>Open full research</Link></div></section>
    <section className="grid section"><div className="card"><span className="muted">Relative strength</span><h2>—</h2></div><div className="card"><span className="muted">Base</span><h2>{pair.base_asset ?? "—"}</h2></div><div className="card"><span className="muted">Quote</span><h2>{pair.quote_asset ?? "—"}</h2></div><div className="card"><span className="muted">Monitoring</span><h2>Not started</h2></div></section>
    <section className="section"><div className="row"><h2>Pair Research</h2><span className="pill">15 blocks</span></div><div className="grid">{PAIR_RESEARCH_BLOCKS.map(b=><article className="card" key={b.number}><div className="row"><strong>{String(b.number).padStart(2,"0")}</strong><span className="pill">Not started</span></div><h3>{b.title}</h3><p className="muted">{b.question}</p></article>)}</div></section>
  </main>;
}
