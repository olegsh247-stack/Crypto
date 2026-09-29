import Link from "next/link";
import { getAssets, type Asset } from "../../lib/api";
import MarketTabs from "../components/MarketTabs";

const statusOrder = ["In progress", "Research complete", "Monitoring", "Not started"];

export default async function ResearchPage() {
  let assets: Asset[] = [];
  let error = "";
  try { assets = await getAssets(); } catch (e) { error = e instanceof Error ? e.message : "Unable to load research"; }
  const sorted = [...assets].sort((a, b) => statusOrder.indexOf(a.research_status ?? "Not started") - statusOrder.indexOf(b.research_status ?? "Not started"));
  const counts = { monitoring: assets.filter(a => a.research_status === "Monitoring").length, complete: assets.filter(a => a.research_status === "Research complete").length, progress: assets.filter(a => a.research_status === "In progress").length, notStarted: assets.filter(a => !a.research_status || a.research_status === "Not started").length };

  return <main className="shell">
    <MarketTabs />
    <header className="section"><div className="row"><div><p className="muted">Research</p><h1>Research Status</h1><p className="muted">One view of the research lifecycle. Monitoring remains part of the same system.</p></div><span className="pill">{assets.length} assets</span></div></header>
    {error ? <div className="error section">{error}</div> : <>
      <section className="grid">
        <div className="card"><span className="muted">In progress</span><h2>{counts.progress}</h2></div>
        <div className="card"><span className="muted">Research complete</span><h2>{counts.complete}</h2></div>
        <div className="card"><span className="muted">Monitoring</span><h2>{counts.monitoring}</h2></div>
        <div className="card"><span className="muted">Not started</span><h2>{counts.notStarted}</h2></div>
      </section>
      <section className="section grid">{sorted.map(asset => <Link className="card" href={`/assets/${asset.asset_id}`} key={asset.asset_id}>
        <div className="row"><strong>{asset.symbol}</strong><span className="pill">{asset.research_status ?? "Not started"}</span></div>
        <h2>{asset.name}</h2>
        <div className="row"><span className="muted">Research tier</span><span>{asset.research_tier ?? "—"}</span></div>
      </Link>)}</section>
    </>}
  </main>;
}
