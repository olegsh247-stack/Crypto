import Link from "next/link";
import { getAssets } from "../lib/api";
import MarketTabs from "./components/MarketTabs";

export default async function Home() {
  let assets = [];
  let error = "";
  try { assets = await getAssets(); } catch (e) { error = e instanceof Error ? e.message : "Unable to load assets"; }

  return <main className="shell">
    <MarketTabs />
    <header className="section"><div className="row"><div><h1>Assets</h1><p className="muted">Dynamic assets from the research database.</p></div><span className="pill">{assets.length} loaded</span></div></header>
    {error ? <div className="error">{error}. Set <code>CRYPTO_API_URL</code> to the deployed Crypto API URL.</div> : <section className="grid" aria-label="Assets">
      {assets.map((asset: any) => <Link className="card" href={`/assets/${asset.asset_id}`} key={asset.asset_id}>
        <div className="row"><strong>{asset.symbol}</strong><span className="pill">{asset.research_tier ?? "—"}</span></div>
        <h2>{asset.name}</h2><p className="muted">{asset.asset_type_name ?? asset.category ?? "Crypto asset"}</p>
        <div className="row"><span className="muted">Research</span><span>{asset.research_status ?? "Not started"}</span></div>
      </Link>)}
    </section>}
  </main>;
}
