"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import MarketTabs from "../components/MarketTabs";
import { getPairs, disablePair, type MarketPair } from "../../lib/api";

export default function PairsPage(){
  const [data,setData]=useState<{pairs:MarketPair[]}>({pairs:[]});
  const [error,setError]=useState("");
  const [busy,setBusy]=useState("");
  async function load(){try{setError("");setData(await getPairs())}catch(e){setError(e instanceof Error?e.message:"Unable to load pairs")}}
  useEffect(()=>{load()},[]);
  async function remove(id:string){setBusy(id);try{await disablePair(id);await load()}catch(e){setError(e instanceof Error?e.message:"Unable to remove pair")}finally{setBusy("")}}
  return <main className="shell"><MarketTabs/><header className="section"><div className="row"><div><h1>Pair</h1><p className="muted">Live pairs from the dynamic engine.</p></div><Link className="button" href="/pairs/add">+ Add Pair</Link></div></header>{error&&<div className="error">{error}</div>}<section className="grid">{data.pairs.map(p=><article className="card" key={p.id}><div className="row"><strong>{p.symbol}</strong><span className="pill">{p.exchange}</span></div><div className="row" style={{marginTop:12}}><Link className="button" href={`/pairs/${encodeURIComponent(p.id)}`}>Research</Link><button className="button secondary" onClick={()=>remove(p.id)} disabled={busy===p.id}>{busy===p.id?"Removing…":"− Remove"}</button></div></article>)}</section></main>}
