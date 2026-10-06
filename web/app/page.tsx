import Link from "next/link";
import { getAssets, type Asset } from "../lib/api";
import MarketTabs from "./components/MarketTabs";
import { getResearchStatusLabel, getResearchFreshnessLabel } from "../lib/research-status";

export default async function Home() {
  let assets: Asset[] = [];
  let error = "";
  try { assets = await getAssets(); } catch (e) { error = e instanceof Error ? e.message : "Unable to load assets"; }

  return <main className="shell">
    <MarketTabs />
    <header className="section"><div className="row"><div><h1>Assets</h1><p className="muted">Dynamic assets from the research database.</p></div><span className="pill">{assets.length} loaded</span></div></header>
    {error ? <div className="error" role="alert">{error}. Set <code>CRYPTO_API_URL</code> to the deployed Crypto API URL.</div> : assets.length === 0 ? <div className="card section"><h2>No assets available</h2><p className="muted">The asset registry returned no enabled assets.</p></div> : <section className="grid" aria-label="Assets">
      {assets.map((asset) => <Link className="card" href={`/assets/${asset.asset_id}`} key={asset.asset_id}>
        <div className="row"><strong>{asset.symbol}</strong><span className="pill">{asset.research_tier ?? "—"}</span></div>
        <h2>{asset.name}</h2><p className="muted">{asset.asset_type?.name ?? asset.category ?? "Crypto asset"}</p>
        <div className="row"><span className="muted">Research</span><span>{asset.research_status ? getResearchStatusLabel(asset.research_status) : "Not started"}</span></div>
        {asset.research_freshness && <div className="row"><span className="muted">Freshness</span><span>{getResearchFreshnessLabel(asset.research_freshness.status)}</span></div>}
      </Link>)}
    </section>}
  </main>;
}
