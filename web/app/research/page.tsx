import Link from "next/link";
import { getAssets, type Asset } from "../../lib/api";
import MarketTabs from "../components/MarketTabs";
import { getResearchStatusLabel, getResearchFreshnessLabel } from "../../lib/research-status";

const statusOrder = ["in_progress", "complete", "monitoring", "not_started"] as const;

export default async function ResearchPage() {
  let assets: Asset[] = [];
  let error = "";
  try { assets = await getAssets(); } catch (e) { error = e instanceof Error ? e.message : "Unable to load research"; }
  const sorted = [...assets].sort((a, b) => statusOrder.indexOf(a.research_status ?? "not_started") - statusOrder.indexOf(b.research_status ?? "not_started"));
  const counts = {
    monitoring: assets.filter(a => a.research_status === "monitoring").length,
    complete: assets.filter(a => a.research_status === "complete").length,
    progress: assets.filter(a => a.research_status === "in_progress").length,
    notStarted: assets.filter(a => !a.research_status || a.research_status === "not_started").length
  };

  return <main className="shell">
    <MarketTabs />
    <header className="section"><div className="row"><div><p className="muted">Research</p><h1>Research Status</h1><p className="muted">Research lifecycle and monitoring in one place.</p></div><span className="pill">{assets.length} assets</span></div></header>
    {error ? <div className="error section" role="alert">{error}</div> : assets.length === 0 ? (
      <div className="card section"><h2>No assets to research</h2><p className="muted">The asset registry returned no enabled assets.</p><Link className="button" href="/">Open Assets</Link></div>
    ) : <>
      <section className="grid" aria-label="Research status summary">
        <div className="card"><span className="muted">In progress</span><h2>{counts.progress}</h2></div>
        <div className="card"><span className="muted">Research complete</span><h2>{counts.complete}</h2></div>
        <div className="card"><span className="muted">Monitoring</span><h2>{counts.monitoring}</h2></div>
        <div className="card"><span className="muted">Not started</span><h2>{counts.notStarted}</h2></div>
      </section>
      <section className="section">
        <div className="row"><div><h2>Assets</h2><p className="muted">Open an Asset to read the full research.</p></div><span className="pill">15 blocks per Asset</span></div>
        <div className="grid">{sorted.map(asset => <Link className="card" href={`/assets/${asset.asset_id}`} key={asset.asset_id}>
          <div className="row"><strong>{asset.symbol}</strong><span className="pill">{asset.research_status ? getResearchStatusLabel(asset.research_status) : "Not started"}</span></div>
          <h2>{asset.name}</h2>
          <div className="row"><span className="muted">Research tier</span><span>{asset.research_tier ?? "—"}</span></div>
          {asset.research_freshness && <div className="row"><span className="muted">Freshness</span><span>{getResearchFreshnessLabel(asset.research_freshness.status)}</span></div>}
        </Link>)}</div>
      </section>
    </>}
  </main>;
}
