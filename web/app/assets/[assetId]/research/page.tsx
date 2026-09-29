import Link from "next/link";
import { getAsset } from "../../../../lib/api";
import MarketTabs from "../../../components/MarketTabs";
import { STRUCTURE_1_BLOCKS } from "../../../../lib/research-structure";
import { getResearchProgress, getResearchStatus, normalizeResearchBlocks } from "../../../../lib/research-status";

export default async function DeepResearchPage({ params }: { params: Promise<{ assetId: string }> }) {
  const { assetId } = await params;
  let data: any;
  try { data = await getAsset(assetId); } catch (e) { return <main className="shell"><MarketTabs /><div className="error section">Unable to load research: {e instanceof Error ? e.message : "unknown error"}</div></main>; }
  const asset = data.asset;
  const blocks = normalizeResearchBlocks(data.research_blocks);
  const progress = getResearchProgress(blocks);
  const status = getResearchStatus(blocks);
  const snapshot = data.research_snapshot;
  const scenarios = data.scenario_states ?? data.scenarios ?? [];
  const factors = data.critical_factors ?? [];
  const blockMap = new Map(blocks.map(b => [b.number, b]));

  return <main className="shell">
    <MarketTabs />
    <header className="section"><Link href={`/assets/${assetId}`}>← {asset.symbol} overview</Link><p className="muted">Deep reading mode</p><h1>{asset.symbol} — Full Research</h1><p className="muted">Structure 1 · {progress.completed}/{progress.total} blocks · {status}</p></header>
    <section className="card section"><div className="row"><div><h2>Research document</h2><p className="muted">The complete analytical version for readers who want the full 15-block research.</p></div><span className="pill">{progress.percent}%</span></div>{snapshot?.content?.summary && <p>{snapshot.content.summary}</p>}</section>
    <section className="section"><h2>Structure 1</h2>{STRUCTURE_1_BLOCKS.map(def => { const block = blockMap.get(def.number)!; return <article className="card section" id={`research-${def.number}`} key={def.number}><div className="row"><h2>{String(def.number).padStart(2,"0")} · {def.title}</h2><span className="pill">{block.status}</span></div>{block.summary ? <p>{block.summary}</p> : <p className="muted">This block has not been completed yet.</p>}{block.analysis && <div><h3>Analysis</h3><p>{block.analysis}</p></div>}</article>; })}</section>
    <section className="section card"><h2>Critical Factors</h2>{factors.length ? factors.map((f:any)=><div className="row" key={f.id}><span>{f.name}</span><span>{f.trend ?? "—"}</span></div>) : <p className="muted">No critical factors recorded.</p>}</section>
    <section className="section card"><h2>Scenarios</h2>{scenarios.length ? scenarios.map((s:any)=><div className="row" key={s.id ?? s.scenario_id}><span>{s.scenario_type ?? s.state}</span><span>{s.confidence ?? "—"}</span></div>) : <p className="muted">No scenarios recorded.</p>}</section>
  </main>;
}
