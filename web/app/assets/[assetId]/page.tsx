import Link from "next/link";
import { getAsset } from "../../../lib/api";
import MarketTabs from "../../components/MarketTabs";
import { STRUCTURE_1_BLOCKS } from "../../../lib/research-structure";
import { getResearchProgress, getResearchStatus, normalizeResearchBlocks } from "../../../lib/research-status";

export default async function AssetPage({ params }: { params: Promise<{ assetId: string }> }) {
  const { assetId } = await params;
  let data: any;
  try { data = await getAsset(assetId); } catch (e) { return <main className="shell"><MarketTabs /><Link href="/">← Assets</Link><div className="error section">Unable to load asset: {e instanceof Error ? e.message : "unknown error"}</div></main>; }
  const asset = data.asset;
  const research = data.research_snapshot;
  const blocks = normalizeResearchBlocks(data.research_blocks);
  const domains = data.research_domains ?? [];
  const factors = data.critical_factors ?? [];
  const scores = data.scores ?? [];
  const monitoring = data.monitoring_signals ?? [];
  const scenarios = data.scenarios ?? data.scenario_states ?? [];
  const progress = getResearchProgress(blocks);
  const status = getResearchStatus(blocks);
  const blockMap = new Map(blocks.map((b) => [b.number, b]));

  return <main className="shell">
    <MarketTabs />
    <div className="section"><Link href="/">← Assets</Link><h1>{asset.symbol} — {asset.name}</h1><p className="muted">{asset.asset_type_name ?? asset.category ?? "Crypto asset"} · Research tier {asset.research_tier ?? "—"}</p></div>
    <div className="detail">
      <section>
        <div className="card"><div className="row"><h2>Research</h2><span className="pill">{status}</span></div><p className="muted">{research?.title ?? "Structure 1 research"}</p><div className="row"><strong>{progress.completed}/{progress.total} blocks</strong><strong>{progress.percent}%</strong></div><div aria-label={`Research progress ${progress.percent}%`} style={{height:8,background:"var(--viz-border)",borderRadius:99,overflow:"hidden",marginTop:10}}><div style={{height:"100%",width:`${progress.percent}%`,background:"var(--viz-accent)"}} /></div></div>
        <div className="section"><div className="row"><h2>Research — Structure 1</h2><span className="pill">15 blocks</span></div>{STRUCTURE_1_BLOCKS.map((definition)=><article className="card section" key={definition.number}><div className="row"><h3>{String(definition.number).padStart(2,"0")} · {definition.title}</h3><span className="pill">{blockMap.get(definition.number)?.status ?? "Not started"}</span></div>{blockMap.get(definition.number)?.summary ? <><p>{blockMap.get(definition.number)?.summary}</p>{blockMap.get(definition.number)?.analysis && <p className="muted">{blockMap.get(definition.number)?.analysis}</p>}</> : <p className="muted">Research block not completed yet.</p>}</article>)}</div>
        <div className="section card"><h2>Critical Factors</h2>{factors.length ? factors.map((f:any)=><div className="row" key={f.id}><span>{f.name}</span><span className="muted">{f.trend ?? "—"}</span></div>) : <p className="muted">No factors recorded yet.</p>}</div>
        <div className="section card"><h2>Scenarios</h2>{scenarios.length ? scenarios.map((s:any)=><div className="row" key={s.id ?? s.scenario_id}><span>{s.scenario_type ?? s.state}</span><span>{s.confidence ?? "—"}</span></div>) : <p className="muted">No scenarios recorded yet.</p>}</div>
      </section>
      <aside>
        <div className="card"><h2>Research Domains</h2>{domains.map((d:any)=><div className="row" key={d.id}><span>{d.name}</span><span className="muted">{d.code}</span></div>)}</div>
        <div className="section card"><h2>Scores</h2>{scores.length ? scores.map((s:any)=><div className="row" key={s.id}><span>{s.score_type}</span><strong>{s.value ?? "—"}</strong></div>) : <p className="muted">No scores recorded yet.</p>}</div>
        <div className="section card"><h2>Monitoring</h2>{monitoring.length ? monitoring.map((m:any)=><div className="row" key={m.id}><span>{m.name}</span><span className="pill">{m.status}</span></div>) : <p className="muted">No live signals recorded yet.</p>}</div>
      </aside>
    </div>
  </main>;
}
