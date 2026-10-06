"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createAsset } from "../../../lib/api";
import MarketTabs from "../../components/MarketTabs";

export default function AddAssetPage() {
  const router = useRouter();
  const [symbol, setSymbol] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault(); setError(""); setSaving(true);
    try { await createAsset({ symbol, name }); router.push("/"); router.refresh(); }
    catch (err) { setError(err instanceof Error ? err.message : "Unable to add asset"); }
    finally { setSaving(false); }
  }

  return <main className="shell"><MarketTabs/><section className="section"><h1>Add Asset</h1><form className="form" onSubmit={submit}><label>Symbol<input value={symbol} onChange={e => setSymbol(e.target.value)} placeholder="BTC" required /></label><label>Name<input value={name} onChange={e => setName(e.target.value)} placeholder="Bitcoin" required /></label>{error && <div className="error">{error}</div>}<div className="row"><button className="button" disabled={saving}>{saving ? "Adding…" : "Add Asset"}</button><button className="button secondary" type="button" onClick={() => router.back()}>Cancel</button></div></form></section></main>;
}
