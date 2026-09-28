import Link from "next/link";
import { getAsset } from "../../../lib/api";

export default async function AssetPage({ params }: { params: Promise<{ assetId: string }> }) {
  const { assetId } = await params;
  let data: any;
  try { data = await getAsset(assetId); } catch (e) { return <main className="shell"><Link href="/">← Assets</Link><div className="error section">Unable to load asset: {e instanceof Error ? e.message : "unknown error"}</div></main>; }
  const asset = data.asset;
  const research = data.research_snapshot;
  const factors = data.critical_factors ?? [];
  const scores = data.scores ?? [];
  const monitoring = data.monitoring_signals ?? [];
  const scenarios = data.scenarios ?? data.scenario_states ?? [];

  return <main className="shell">
    <nav className="tabs"><Link className="tab" href="/">Assets</Link><button className="tab" type="button">Pair</button><button className="tab" type="button">Commodities</button><button className="tab action" type="button">+</button><button className="tab action" type="button">−</button></nav>
    <div className="section"><Link href="/">← Assets</Link><h1>{asset.symbol} — {asset.name}</h1><p className="muted">{asset.category ?? "Crypto asset"} · Research tier {asset.research_tier ?? "—"}</p></div>
    <div className="detail">
      <section>
        <div className="card"><div className="row"><h2>Research</h2><span className="pill">{research?.status ?? "Not started"}</span></div><p className="muted">{research?.title ?? "No research snapshot published yet."}</p>{research?.content && <pre style={{whiteSpace:"pre-wrap",fontFamily:"inherit"}}>{typeof research.content === "string" ? research.content : JSON.stringify(research.content,null,2)}</pre>}</div>
        <div className="section card"><h2>Critical Factors</h2>{factors.length ? factors.map((f:any)=><div className="row" key={f.id}><span>{f.name}</span><span className="muted">{f.trend ?? "—"}</span></div>) : <p className="muted">No factors recorded yet.</p>}</div>
        <div className="section card"><h2>Scenarios</h2>{scenarios.length ? scenarios.map((s:any)=><div className="row" key={s.id ?? s.scenario_id}><span>{s.scenario_type ?? s.state}</span><span>{s.confidence ?? "—"}</span></div>) : <p className="muted">No scenarios recorded yet.</p>}</div>
      </section>
      <aside>
        <div className="card"><h2>Scores</h2>{scores.length ? scores.map((s:any)=><div className="row" key={s.id}><span>{s.score_type}</span><strong>{s.value ?? "—"}</strong></div>) : <p className="muted">No scores recorded yet.</p>}</div>
        <div className="section card"><h2>Monitoring</h2>{monitoring.length ? monitoring.map((m:any)=><div className="row" key={m.id}><span>{m.name}</span><span className="pill">{m.status}</span></div>) : <p className="muted">No live signals recorded yet.</p>}</div>
      </aside>
    </div>
  </main>;
}
