import Link from "next/link";
import { getPairs } from "../../../../lib/api";
import MarketTabs from "../../../components/MarketTabs";
import { PAIR_RESEARCH_BLOCKS, pairResearchProgress } from "../../../../lib/pair-research";

export default async function PairResearchPage({ params }: { params: Promise<{ pairId: string }> }) {
  const { pairId } = await params; let data:any;
  try { data = await getPairs(); } catch(e) { return <main className="shell"><MarketTabs/><div className="error section">Unable to load pairs: {e instanceof Error ? e.message : "unknown error"}</div></main>; }
  const pair=(data.pairs??[]).find((p:any)=>String(p.id)===pairId||String(p.symbol).toLowerCase()===decodeURIComponent(pairId).toLowerCase());
  if(!pair) return <main className="shell"><MarketTabs/><div className="error section">Pair not found.</div></main>;
  const progress=pairResearchProgress([]);
  return <main className="shell"><MarketTabs/><header className="section"><Link href={`/pairs/${encodeURIComponent(pair.symbol)}`}>← {pair.symbol} overview</Link><p className="muted">Deep reading mode</p><div className="row"><div><h1>{pair.symbol} — Full Pair Research</h1><p className="muted">Relative-value Structure · {progress.completed}/{progress.total} blocks</p></div><span className="pill">{progress.percent}%</span></div></header>
    <section className="card section"><h2>How to read this research</h2><p className="muted">The central question is not whether either asset is rising in isolation. It is whether the base asset is gaining or losing strength relative to the quote asset.</p></section>
    <section className="section" id="pair-chapters"><div className="row"><div><h2>Research chapters</h2><p className="muted">Jump directly to any chapter.</p></div><span className="pill">15 chapters</span></div><nav className="card" aria-label="Pair research chapters" style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(210px,1fr))",gap:8}}>{PAIR_RESEARCH_BLOCKS.map(b=><a key={b.number} href={`#pair-research-${b.number}`} style={{textDecoration:"none",padding:"10px 12px",border:"1px solid var(--viz-border)",borderRadius:10}}><div className="row"><strong>{String(b.number).padStart(2,"0")}</strong><span className="pill">Not started</span></div><div style={{marginTop:4}}>{b.title}</div></a>)}</nav></section>
    <section className="section"><h2>Relative-value Structure</h2>{PAIR_RESEARCH_BLOCKS.map(b=><article className="card section" id={`pair-research-${b.number}`} key={b.number}><div className="row"><h2>{String(b.number).padStart(2,"0")} · {b.title}</h2><span className="pill">Not started</span></div><p className="muted">Research question</p><p>{b.question}</p><p className="muted">This chapter is ready for research data and monitoring signals.</p><div className="row" style={{marginTop:16}}><a className="muted" href="#pair-chapters">↑ Chapters</a>{b.number>1&&<a className="muted" href={`#pair-research-${b.number-1}`}>← Previous</a>}{b.number<15&&<a className="muted" href={`#pair-research-${b.number+1}`}>Next →</a>}</div></article>)}</section>
  </main>;
}
