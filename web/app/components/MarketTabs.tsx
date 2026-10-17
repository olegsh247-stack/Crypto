"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export default function MarketTabs() {
  const pathname = usePathname();
  const router = useRouter();
  const inAssets = pathname.startsWith("/assets");
  const inResearch = pathname.startsWith("/research");
  const active = pathname === "/" ? "Home" : inResearch ? "Research" : inAssets ? "Assets" : pathname.startsWith("/pairs") ? "Pair" : pathname.startsWith("/commodities") ? "Commodities" : "Home";
  const marketActive = !inResearch;
  return <nav className="tabs" aria-label="Crypto product sections">
    <Link className={`tab ${active === "Home" ? "active" : ""}`} href="/">Home</Link>
    <Link className={`tab ${active === "Assets" ? "active" : ""}`} href="/#assets">Assets</Link>
    <Link className={`tab ${active === "Research" ? "active" : ""}`} href="/research">Research</Link>
    <span className="tab-spacer" aria-hidden="true" />
    <Link className={`tab secondary ${active === "Pair" ? "active" : ""}`} href="/pairs">Pair</Link>
    <Link className={`tab secondary ${active === "Commodities" ? "active" : ""}`} href="/commodities">Commodities</Link>
    <button className="tab action" type="button" disabled={!marketActive} aria-label="Add asset" onClick={() => router.push("/assets/add")}>+</button>
  </nav>;
}
