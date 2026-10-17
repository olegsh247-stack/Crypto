"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import MarketTabs from "../components/MarketTabs";
import { getPairs, disablePair, type MarketPair } from "../../lib/api";

export default function PairsPage() {
  const [pairs, setPairs] = useState<MarketPair[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");

  async function load() {
    try {
      setLoading(true);
      setError("");
      const data = await getPairs();
      setPairs(data.items ?? data.pairs ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load pairs");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  async function remove(id: string) {
    setBusy(id);
    setError("");
    try {
      await disablePair(id);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to remove pair");
      setBusy("");
    }
  }

  return <main className="shell">
    <MarketTabs />
    <header className="section">
      <div className="row">
        <div><h1>Pairs</h1><p className="muted">Live pairs from the dynamic engine.</p></div>
        <Link className="button" href="/pairs/add">+ Add Pair</Link>
      </div>
    </header>

    {error && <div className="error section" role="alert">{error}</div>}
    {loading ? (
      <div className="card section" role="status" aria-live="polite">Loading pairs…</div>
    ) : pairs.length === 0 ? (
      <div className="card section">
        <h2>No active pairs</h2>
        <p className="muted">The market-pair registry returned no enabled pairs.</p>
        <Link className="button" href="/pairs/add">Add the first pair</Link>
      </div>
    ) : (
      <section className="grid" aria-label="Market pairs">
        {pairs.map((p) => <article className="card" key={p.id}>
          <div className="row"><strong>{p.symbol}</strong><span className="pill">{p.exchange}</span></div>
          <div className="row" style={{ marginTop: 12 }}>
            <Link className="button" href={`/pairs/${encodeURIComponent(p.id)}`}>Research</Link>
            <button className="button secondary" onClick={() => void remove(p.id)} disabled={busy === p.id}>
              {busy === p.id ? "Removing…" : "− Remove"}
            </button>
          </div>
        </article>)}
      </section>
    )}
  </main>;
}
