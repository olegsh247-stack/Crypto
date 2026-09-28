import MarketTabs from "../components/MarketTabs";
import { getPairs } from "../../lib/api";
export default async function PairsPage(){let data:any={pairs:[]};let error="";try{data=await getPairs()}catch(e){error=e instanceof Error?e.message:"Unable to load pairs"}return <main className="shell"><MarketTabs/><header className="section"><div className="row"><div><h1>Pair</h1><p className="muted">Live pairs from the dynamic engine.</p></div><span className="pill">{data.pairs?.length??0} loaded</span></div></header>{error?<div className="error">{error}</div>:<section className="grid">{(data.pairs??[]).map((p:any)=><article className="card" key={p.id}><div className="row"><strong>{p.symbol}</strong><span className="pill">{p.exchange??"—"}</span></div></article>)}</section>}</main>;
}
