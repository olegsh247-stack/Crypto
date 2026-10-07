import Link from "next/link";
import { getAssets, type Asset } from "../lib/api";
import MarketTabs from "./components/MarketTabs";
import { getResearchStatusLabel, getResearchFreshnessLabel } from "../lib/research-status";

export default async function Home() {
  let assets: Asset[] = [];
  let error = "";
  try { assets = await getAssets(); } catch (e) { error = e instanceof Error ? e.message : "Unable to load assets"; }
  const monitoring = assets.filter(a => a.research_status === "monitoring").length;
  const complete = assets.filter(a => a.research_status === "complete").length;
  const inProgress = assets.filter(a => a.research_status === "in_progress").length;

  return <main className="shell">
    <MarketTabs />
    <header className="hero section">
      <div><p className="eyebrow">CRYPTO · DECISION PLATFORM</p><h1>See the asset. Understand the thesis. Monitor what changes.</h1><p className="lead">Crypto combines market context, structured research and monitoring into one Asset Card. The dashboard is the short decision view; Deep Research is the full 15-block investigation.</p><div className="hero-actions"><Link className="button" href="#assets">Open Assets</Link><Link className="button secondary" href="/research">Research status</Link></div></div>
      <div className="hero-card"><span className="muted">Product contour</span><strong>Dashboard → Deep Research → Monitoring</strong><span className="muted">Domains · Factors · Scores · Scenarios · Evidence</span></div>
    </header>
    {error ? <div className="error section" role="alert">{error}. Set <code>CRYPTO_API_URL</code> to the deployed Crypto API URL.</div> : <>
      <section className="grid section" aria-label="Research overview">
        <div className="card"><span className="muted">Assets</span><div className="metric">{assets.length}</div></div>
        <div className="card"><span className="muted">Monitoring</span><div className="metric">{monitoring}</div></div>
        <div className="card"><span className="muted">Research complete</span><div className="metric">{complete}</div></div>
        <div className="card"><span className="muted">In progress</span><div className="metric">{inProgress}</div></div>
      </section>
      <section id="assets" className="section">
        <div className="row section-heading"><div><p className="eyebrow">01 · ASSETS</p><h2>Assets</h2><p className="muted">The canonical research subjects. Open an asset to enter its decision dashboard.</p></div><span className="pill">{assets.length} loaded</span></div>
        {assets.length === 0 ? <div className="card"><h3>No assets available</h3><p className="muted">The asset registry returned no enabled assets.</p></div> : <section className="grid" aria-label="Assets">{assets.map(asset => <Link className="card asset-card" href={`/assets/${asset.asset_id}`} key={asset.asset_id}>
          <div className="row"><strong>{asset.symbol}</strong><span className="pill">{asset.research_tier ?? "—"}</span></div><h2>{asset.name}</h2><p className="muted">{asset.asset_type?.name ?? asset.category ?? "Crypto asset"}</p>
          <div className="row"><span className="muted">Lifecycle</span><span>{asset.research_status ? getResearchStatusLabel(asset.research_status) : "Not started"}</span></div>
          {asset.research_freshness && <div className="row"><span className="muted">Freshness</span><span>{getResearchFreshnessLabel(asset.research_freshness.status)}</span></div>}
        </Link>)}</section>}
      </section>
    </>}
  </main>;
}
