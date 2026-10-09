import Link from "next/link";
import { getAsset } from "../../../../lib/api";
import MarketTabs from "../../../components/MarketTabs";
import { STRUCTURE_1_BLOCKS } from "../../../../lib/research-structure";
import { getResearchBlockStatusLabel, getResearchProgress, getResearchStatusLabel, normalizeResearchBlocks } from "../../../../lib/research-status";

export default async function DeepResearchPage({ params }: { params: Promise<{ assetId: string }> }) {
  const { assetId } = await params;
  let data: any;
  try { data = await getAsset(assetId); } catch (e) { return <main className="shell"><MarketTabs /><div className="error section">Unable to load research: {e instanceof Error ? e.message : "unknown error"}</div></main>; }
  const asset = data.asset;
  const blocks = normalizeResearchBlocks(data.research_blocks);
  const progress = getResearchProgress(blocks);
  const snapshot = data.research_snapshot;
  const factors = data.critical_factors ?? [];
  const scenarios = data.research_scenarios ?? data.scenario_states ?? [];
  const blockMap = new Map(blocks.map((b: any) => [b.number, b]));

  return <main className="shell"><MarketTabs />
    <header className="section"><Link href={`/assets/${assetId}`}>← {asset.symbol} dashboard</Link><p className="eyebrow">09 · DEEP RESEARCH</p><div className="row"><div><h1>{asset.symbol} — Full Research</h1><p className="muted">Structure 1 · {progress.completed} completed · {progress.resolved}/{progress.total} resolved · {getResearchStatusLabel(asset.research_status ?? "not_started")}</p></div><span className="pill">{progress.percent}%</span></div></header>
    <section className="card section"><div className="row"><div><h2>Research document</h2><p className="muted">Complete analytical version for deep reading. The dashboard remains the concise decision layer.</p></div><Link className="button secondary" href={`/assets/${assetId}`}>Back to dashboard</Link></div>{snapshot?.content?.summary && <p>{snapshot.content.summary}</p>}</section>
    <section className="section" id="research-chapters"><div className="row"><div><h2>Research chapters</h2><p className="muted">The canonical 15-block Structure 1 path.</p></div><span className="pill">15 chapters</span></div><nav className="card chapter-grid" aria-label="Research chapters">{STRUCTURE_1_BLOCKS.map(def => { const block = blockMap.get(def.number)!; return <a key={def.number} href={`#research-${def.number}`} className="chapter-link"><div className="row"><strong>{String(def.number).padStart(2,"0")}</strong><span className="pill">{getResearchBlockStatusLabel(block.status)}</span></div><div>{def.title}</div></a>; })}</nav></section>
    <section className="section"><h2>Structure 1</h2>{STRUCTURE_1_BLOCKS.map(def => { const block = blockMap.get(def.number)!; return <article className="card section" id={`research-${def.number}`} key={def.number}><div className="row"><h2>{String(def.number).padStart(2,"0")} · {def.title}</h2><span className="pill">{getResearchBlockStatusLabel(block.status)}</span></div>{block.summary ? <p>{block.summary}</p> : <p className="muted">This block has not been completed yet.</p>}{block.analysis && <div><h3>Analysis</h3><p>{block.analysis}</p></div>}<div className="row" style={{marginTop:16}}><a className="muted" href="#research-chapters">↑ Chapters</a>{def.number>1 && <a className="muted" href={`#research-${def.number-1}`}>← Previous</a>}{def.number<15 && <a className="muted" href={`#research-${def.number+1}`}>Next →</a>}</div></article>; })}</section>
    <section className="section card"><h2>Critical Factors</h2>{factors.length ? factors.map((f:any) => <div className="row" key={f.critical_factor_id}><span>{f.name}</span><span>{f.trend ?? "—"}</span></div>) : <p className="muted">No critical factors recorded.</p>}</section>
    <section className="section card"><h2>Scenarios</h2>{scenarios.length ? scenarios.map((s:any) => <div className="row" key={s.research_scenario_id ?? s.scenario_state_id ?? s.scenario_type}><span>{s.scenario_type ?? s.state}</span><span>{s.confidence ?? s.probability ?? "—"}</span></div>) : <p className="muted">No scenarios recorded.</p>}</section>
  </main>;
}
