import MarketTabs from "../components/MarketTabs";

export default function PairsPage() {
  return <main className="shell">
    <MarketTabs />
    <header className="section"><h1>Pair</h1><p className="muted">Trading pairs will use the same dynamic engine, with exchange and quote-asset data kept separate from Asset identity.</p></header>
    <section className="card"><div className="row"><strong>Pair Engine</strong><span className="pill">Ready</span></div><p className="muted">Pairs are intentionally separate from Assets: BTC is an Asset; BTC/USDT is a Pair.</p></section>
  </main>;
}
