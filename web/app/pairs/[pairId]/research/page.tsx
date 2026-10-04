import Link from "next/link";
import { getPairHistory, getPairs } from "../../../../lib/api";
import MarketTabs from "../../../components/MarketTabs";
import { PAIR_RESEARCH_BLOCKS } from "../../../../lib/pair-research";

export default async function PairResearchPage({ params }: { params: Promise<{ pairId: string }> }) {
  const { pairId } = await params; let data:any;
  try { data = await getPairs(); } catch(e) { return <main className="shell"><MarketTabs/><div className="error section">Unable to load pairs: {e instanceof Error ? e.message : "unknown error"}</div></main>; }
  const pair=(data.items ?? data.pairs ?? []).find((p:any)=>String(p.id)===pairId||String(p.symbol).toLowerCase()===decodeURIComponent(pairId).toLowerCase());
  if(!pair) return <main className="shell"><MarketTabs/><div className="error section">Pair not found.</div></main>;
  let live:any = null; try { live = await getPairHistory(pair.symbol, 30, "1d"); } catch { live = null; }
  const rows = live?.rows ?? []; const first = rows[0]?.pair; const last = rows.at(-1)?.pair; const changePct = first && last ? ((Number(last)/Number(first))-1)*100 : null;
  return <main className="shell"><MarketTabs/><header className="section"><Link href={`/pairs/${encodeURIComponent(pair.symbol)}`}>← {pair.symbol} overview</Link><p className="muted">Generic pair analysis framework</p><div className="row"><div><h1>{pair.symbol} — Pair Research Framework</h1><p className="muted">The Pair is a market instrument; underlying fundamental research remains on the Asset Cards.</p></div><span className="pill">15 blocks</span></div></header>
    <section className="card section"><div className="row"><div><h2>How to read this</h2><p className="muted">Use the pair to measure relative market performance and regime effects. Do not treat the pair as a separate research identity.</p></div><span className="pill">{live?.source ? "Live data" : "Data unavailable"}</span></div>{changePct !== null && <p>Current 30d relative change: <strong>{changePct >= 0 ? "+" : ""}{changePct.toFixed(1)}%</strong>.</p>}</section>
    <section className="section" id="pair-chapters"><div className="row"><div><h2>Research framework</h2><p className="muted">Generic questions that can be populated from the underlying Asset Cards and pair observations.</p></div><span className="pill">15 chapters</span></div><nav className="card" aria-label="Pair research chapters" style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(210px,1fr))",gap:8}}>{PAIR_RESEARCH_BLOCKS.map(b=><a key={b.number} href={`#pair-research-${b.number}`} style={{textDecoration:"none",padding:"10px 12px",border:"1px solid var(--viz-border)",borderRadius:10}}><div className="row"><strong>{String(b.number).padStart(2,"0")}</strong><span className="pill">Framework</span></div><div style={{marginTop:4}}>{b.title}</div></a>)}</nav></section>
    <section className="section"><h2>Relative-value Structure</h2>{PAIR_RESEARCH_BLOCKS.map(b=><article className="card section" id={`pair-research-${b.number}`} key={b.number}><div className="row"><h2>{String(b.number).padStart(2,"0")} · {b.title}</h2><span className="pill">Framework</span></div><p className="muted">Research question</p><p>{b.question}</p><div className="row" style={{marginTop:16}}><a className="muted" href="#pair-chapters">↑ Chapters</a>{b.number>1&&<a className="muted" href={`#pair-research-${b.number-1}`}>← Previous</a>}{b.number<15&&<a className="muted" href={`#pair-research-${b.number+1}`}>Next →</a>}</div></article>)}</section>
  </main>;
}
