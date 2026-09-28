import MarketTabs from "../components/MarketTabs";

export default function CommoditiesPage() {
  return <main className="shell">
    <MarketTabs />
    <header className="section"><h1>Commodities</h1><p className="muted">Commodity instruments remain separate from crypto Assets and Pairs while using the same navigation model.</p></header>
    <section className="card"><div className="row"><strong>Commodity Engine</strong><span className="pill">Ready</span></div><p className="muted">This keeps the interface extensible without pretending that a commodity is a crypto Asset.</p></section>
  </main>;
}
