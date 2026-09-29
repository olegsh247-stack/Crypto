"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export default function MarketTabs() {
  const pathname = usePathname();
  const router = useRouter();
  const active = pathname.startsWith("/assets") ? "Assets" : pathname.startsWith("/pairs") ? "Pair" : pathname.startsWith("/commodities") ? "Commodities" : pathname.startsWith("/research") ? "Research" : "Assets";
  const marketActive = active !== "Research";

  return <nav className="tabs" aria-label="Market sections">
    <Link className={`tab ${active === "Assets" ? "active" : ""}`} href="/">Assets</Link>
    <Link className={`tab ${active === "Pair" ? "active" : ""}`} href="/pairs">Pair</Link>
    <Link className={`tab ${active === "Commodities" ? "active" : ""}`} href="/commodities">Commodities</Link>
    <Link className={`tab ${active === "Research" ? "active" : ""}`} href="/research">Research</Link>
    <button className="tab action" type="button" disabled={!marketActive} aria-label={`Add ${active}`} onClick={() => router.push(active === "Assets" ? "/assets/add" : active === "Pair" ? "/pairs/add" : "/commodities/add")}>+</button>
    <button className="tab action" type="button" disabled={!marketActive} aria-label={`Remove ${active}`} onClick={() => router.push(active === "Assets" ? "/assets/remove" : active === "Pair" ? "/pairs/remove" : "/commodities/remove")}>−</button>
  </nav>;
}
