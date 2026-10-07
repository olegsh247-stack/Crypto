import Link from "next/link";
import { getAssets, type Asset } from "../../lib/api";
import MarketTabs from "../components/MarketTabs";
import { getResearchStatusLabel, getResearchFreshnessLabel } from "../../lib/research-status";

const statusOrder = ["in_progress", "complete", "monitoring", "not_started"] as const;

export default async function ResearchPage() {
  let assets: Asset[] = [];
  let error = "";
  try { assets = await getAssets(); } catch (e) { error = e instanceof Error ? e.message : "Unable to load research"; }
  const sorted = [...assets].sort((a,b) => statusOrder.indexOf(a.research_status ?? "not_started") - statusOrder.indexOf(b.research_status ?? "not_started"));
  const counts = { monitoring: assets.filter(a => a.research_status === "monitoring").length, complete: assets.filter(a => a.research_status === "complete").length, progress: assets.filter(a => a.research_status === "in_progress").length, notStarted: assets.filter(a => !a.research_status || a.research_status === "not_started").length };

  return <main className="shell"><MarketTabs />
    <header className="hero section"><div><p className="eyebrow">09 · DEEP RESEARCH</p><h1>Deep Research</h1><p className="lead">The full 15-block Structure 1 investigation. This is the detailed reading layer behind the short decision dashboard.</p></div><div className="hero-card"><strong>01 → 15</strong><span className="muted">Read the full research when you need to understand the thesis in depth.</span></div></header>
    {error ? <div className="error section" role="alert">{error}</div> : assets.length === 0 ? <div className="card section"><h2>No assets to research</h2><p className="muted">The asset registry returned no enabled assets.</p><Link className="button" href="/">Open Assets</Link></div> : <>
      <section className="grid section" aria-label="Research status summary"><div className="card"><span className="muted">In progress</span><div className="metric">{counts.progress}</div></div><div className="card"><span className="muted">Research complete</span><div className="metric">{counts.complete}</div></div><div className="card"><span className="muted">Monitoring</span><div className="metric">{counts.monitoring}</div></div><div className="card"><span className="muted">Not started</span><div className="metric">{counts.notStarted}</div></div></section>
      <section className="section"><div className="section-heading"><p className="eyebrow">SELECT AN ASSET</p><h2>Open full research</h2><p className="muted">The dashboard is the default decision layer; this page is for the complete research path.</p></div><div className="grid">{sorted.map(asset => <Link className="card" href={`/assets/${asset.asset_id}/research`} key={asset.asset_id}><div className="row"><strong>{asset.symbol}</strong><span className="pill">{asset.research_status ? getResearchStatusLabel(asset.research_status) : "Not started"}</span></div><h2>{asset.name}</h2><div className="row"><span className="muted">Research tier</span><span>{asset.research_tier ?? "—"}</span></div>{asset.research_freshness && <div className="row"><span className="muted">Freshness</span><span>{getResearchFreshnessLabel(asset.research_freshness.status)}</span></div>}<p className="muted">15 blocks · Structure 1</p></Link>)}</div></section>
    </>}
  </main>;
}
