"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createAsset, getAssetTypes, type AssetType } from "../../../lib/api";
import MarketTabs from "../../components/MarketTabs";

const categories = [
  ["core", "Core"],
  ["defi", "DeFi"],
  ["l1_infrastructure", "L1 infrastructure"],
  ["bitcoin_ecosystem", "Bitcoin ecosystem"],
  ["stablecoin_payments", "Stablecoin payments"],
] as const;

export default function AddAssetPage() {
  const router = useRouter();
  const [symbol, setSymbol] = useState("");
  const [name, setName] = useState("");
  const [assetTypes, setAssetTypes] = useState<AssetType[]>([]);
  const [assetTypeId, setAssetTypeId] = useState("");
  const [category, setCategory] = useState("core");
  const [tier, setTier] = useState("C");
  const [loadingTypes, setLoadingTypes] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    getAssetTypes()
      .then(({ items }) => {
        if (!active) return;
        setAssetTypes(items);
        if (items.length === 0) setError("No active asset types are configured");
      })
      .catch(err => {
        if (active) setError(err instanceof Error ? err.message : "Unable to load asset types");
      })
      .finally(() => {
        if (active) setLoadingTypes(false);
      });
    return () => { active = false; };
  }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const result = await createAsset({
        symbol, name, category, research_tier: tier,
        primary_asset_type_id: assetTypeId, enabled: true,
      });
      router.push("/assets/" + encodeURIComponent(result.item.asset_id));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to add asset");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="shell">
      <MarketTabs />
      <section className="section">
        <h1>Add Asset</h1>
        <form className="form" onSubmit={submit}>
          <label>Symbol<input value={symbol} onChange={e => setSymbol(e.target.value)} placeholder="BTC" required /></label>
          <label>Name<input value={name} onChange={e => setName(e.target.value)} placeholder="Bitcoin" required /></label>
          <label>
            Asset type
            <select value={assetTypeId} onChange={e => setAssetTypeId(e.target.value)} required disabled={loadingTypes || assetTypes.length === 0}>
              <option value="" disabled>Select an asset type</option>
              {assetTypes.map(type => <option key={type.asset_type_id} value={type.asset_type_id}>{type.name} ({type.code})</option>)}
            </select>
          </label>
          <label>
            Category
            <select value={category} onChange={e => setCategory(e.target.value)}>
              {categories.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <label>
            Research tier
            <select value={tier} onChange={e => setTier(e.target.value)}>
              <option value="A">A</option><option value="B">B</option><option value="C">C</option>
            </select>
          </label>
          {error && <div className="error" role="alert">{error}</div>}
          {loadingTypes && <p className="muted">Loading active asset types…</p>}
          <div className="row">
            <button className="button" disabled={saving || loadingTypes || !assetTypeId}>{saving ? "Adding…" : "Add Asset"}</button>
            <button className="button secondary" type="button" onClick={() => router.back()}>Cancel</button>
          </div>
        </form>
      </section>
    </main>
  );
}
