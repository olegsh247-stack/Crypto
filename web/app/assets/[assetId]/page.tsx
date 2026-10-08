import Link from "next/link";
import { getAsset, getPairHistory } from "../../../lib/api";
import MarketTabs from "../../components/MarketTabs";
import { getResearchProgress, getResearchStatusLabel, normalizeResearchBlocks, normalizeResearchFreshness, getResearchFreshnessLabel } from "../../../lib/research-status";

function scoreByType(scores: any[], terms: string[]) { return scores.find(s => terms.some(t => String(s.score_type ?? "").toLowerCase().includes(t))); }

export default async function AssetPage({ params, searchParams }: { params: Promise<{ assetId: string }>; searchParams: Promise<{ chart?: string }> }) {
  const { assetId } = await params;
  const { chart = "1d" } = await searchParams;
  let data: any;
  try { data = await getAsset(assetId); } catch (e) { return <main className="shell"><MarketTabs /><Link href="/">← Home</Link><div className="error section">Unable to load asset: {e instanceof Error ? e.message : "unknown error"}</div></main>; }
  const asset = data.asset;
  const research = data.research_snapshot;
  const blocks = normalizeResearchBlocks(data.research_blocks);
  const domains = data.research_domains ?? [];
  const factors = data.critical_factors ?? [];
  const scores = data.scores ?? [];
  const monitoring = data.monitoring_signals ?? [];
  const scenarios = data.research_scenarios ?? data.scenario_states ?? [];
  const sources = data.sources ?? [];
  const evidence = data.evidence ?? [];
  const progress = getResearchProgress(blocks);
  const status = asset.research_status ?? "not_started";
  const freshness = normalizeResearchFreshness(data.research_freshness?.status ?? asset.research_freshness?.status);
  const blockMap = new Map(blocks.map((b: any) => [b.number, b]));
  const summary = research?.content?.summary ?? research?.summary ?? blockMap.get(14)?.summary ?? null;
  const health = scoreByType(scores, ["health"]);
  const thesis = scoreByType(scores, ["thesis"]);
  const valueAccrual = scoreByType(scores, ["value", "accrual"]);
  const confidence = scores.reduce((best: any, s: any) => (s.confidence ?? -1) > (best?.confidence ?? -1) ? s : best, null);
  const currentScenarioState = (data.scenario_states ?? [])[0] ?? null;
  const currentScenarioDefinition = currentScenarioState ? scenarios.find((s: any) => s.research_scenario_id === currentScenarioState.scenario_id) : null;
  const currentScenario = currentScenarioState ? { ...currentScenarioDefinition, ...currentScenarioState } : null;
  const mainCatalyst = factors.filter((f: any) => f.thesis_impact === "positive").sort((a: any, b: any) => (a.monitoring_priority ?? 999) - (b.monitoring_priority ?? 999))[0] ?? null;
  const mainRisk = factors.filter((f: any) => f.thesis_impact === "negative").sort((a: any, b: any) => (a.monitoring_priority ?? 999) - (b.monitoring_priority ?? 999))[0] ?? null;
  const monitoringEvents = data.monitoring_events ?? [];

  const positiveFactors = factors.filter((f: any) => f.thesis_impact === "positive").length;
  const negativeFactors = factors.filter((f: any) => f.thesis_impact === "negative").length;
  const mixedFactors = factors.filter((f: any) => f.thesis_impact === "mixed").length;
  const improvingSignals = monitoring.filter((m: any) => m.direction === "improving").length;
  const deterioratingSignals = monitoring.filter((m: any) => m.direction === "deteriorating").length;
  const thesisState = thesis?.value != null
    ? Number(thesis.value) >= 70 ? "Positive" : Number(thesis.value) <= 40 ? "Negative" : "Neutral"
    : positiveFactors > negativeFactors ? "Positive" : negativeFactors > positiveFactors ? "Negative" : "Mixed";
  const marketDirection = weekChange == null ? "Unknown" : weekChange > 0.5 ? "Improving" : weekChange < -0.5 ? "Deteriorating" : "Stable";
  const researchDirection = improvingSignals > deterioratingSignals ? "Improving" : deterioratingSignals > improvingSignals ? "Deteriorating" : mixedFactors > 0 ? "Mixed" : "Stable";
  const decisionHeadline = thesisState === "Positive"
    ? "The thesis currently has more support than pressure."
    : thesisState === "Negative"
      ? "The thesis currently has more pressure than support."
      : "The thesis is currently balanced or insufficiently resolved.";
  const decisionDrivers = [
    mainCatalyst?.name ? { label: "Catalyst", value: mainCatalyst.name } : null,
    mainRisk?.name ? { label: "Risk", value: mainRisk.name } : null,
    currentScenario?.scenario_type ? { label: "Scenario", value: currentScenario.scenario_type } : null,
  ].filter(Boolean) as Array<{ label: string; value: string }>;

  const chartPresets: Record<string, { label: string; interval: string; days: number }> = {
    "1h": { label: "1 hour", interval: "1h", days: 7 },
    "4h": { label: "4 hours", interval: "4h", days: 7 },
    "1d": { label: "1 day", interval: "1d", days: 30 },
    "7d": { label: "7 days", interval: "1d", days: 7 },
  };
  const chartKey = chartPresets[chart] ? chart : "1d";
  const chartPreset = chartPresets[chartKey];
  let chartData: any = null;
  try { chartData = await getPairHistory(`${asset.symbol}/USDT`, chartPreset.days, chartPreset.interval); } catch { chartData = null; }
  const chartRows = (chartData?.rows ?? []).filter((row: any) => Number.isFinite(Number(row.pair)) && row.time);
  const chartValues = chartRows.map((row: any) => Number(row.pair));
  const chartMin = chartValues.length ? Math.min(...chartValues) : 0;
  const chartMax = chartValues.length ? Math.max(...chartValues) : 1;
  const chartRange = chartMax - chartMin || 1;
  const chartPoints = chartRows.map((row: any, i: number) => `${(i / Math.max(chartRows.length - 1, 1)) * 100},${92 - ((Number(row.pair) - chartMin) / chartRange) * 84}`).join(" ");
  const chartFirst = chartValues[0] ?? null;
  const chartLast = chartValues.at(-1) ?? null;
  const chartChange = chartFirst && chartLast ? ((chartLast / chartFirst) - 1) * 100 : null;
  const history = Array.isArray(data.history) ? data.history : [];
  const marketRows = history.map((row: any) => ({
    time: row.candle_open_at ?? row.candle_close_at ?? null,
    close: row.close_price != null ? Number(row.close_price) : null,
    source: row.source_id ?? row.source_symbol ?? null,
  })).filter((row: any) => row.time && Number.isFinite(row.close));
  const latestMarket = marketRows.at(-1) ?? null;
  const weekRows = marketRows.slice(-7);
  const weekStart = weekRows[0]?.close ?? null;
  const weekEnd = weekRows.at(-1)?.close ?? null;
  const weekChange = weekStart && weekEnd ? ((weekEnd / weekStart) - 1) * 100 : null;

  return <main className="shell">
    <MarketTabs />
    <div className="section"><Link href="/">← Assets</Link><div className="row asset-heading"><div><p className="eyebrow">02 · ASSET DASHBOARD</p><h1>{asset.symbol} — {asset.name}</h1><p className="muted">{asset.asset_type_name ?? asset.category ?? "Crypto asset"} · Research tier {asset.research_tier ?? "—"}</p></div><div className="hero-actions"><span className="pill">{getResearchStatusLabel(status)}</span>{freshness && <span className="pill">{getResearchFreshnessLabel(freshness)}</span>}</div></div></div>
    <nav className="dashboard-nav" aria-label="Asset dashboard sections"><a href="#overview">Overview</a><a href="#domains">Domains</a><a href="#factors">Factors</a><a href="#scores">Scores</a><a href="#scenarios">Scenarios</a><a href="#monitoring">Monitoring</a><a href="#evidence">Evidence</a></nav>

    <section id="market" className="section card" aria-label="Market chart">
      <div className="row">
        <div><p className="eyebrow">MARKET</p><h2>{asset.symbol}/USDT</h2><p className="muted">Stored market history. 1h and 4h remain temporary market data; daily history is persisted.</p></div>
        <span className="pill">{chartData?.source ?? "No source"}</span>
      </div>
      <div className="row">
        <div className="chart-tabs" aria-label="Chart interval">
          {Object.entries(chartPresets).map(([key, preset]) => <Link key={key} className={`button ${key === chartKey ? "active" : ""}`} href={`/assets/${assetId}?chart=${key}#market`}>{preset.label}</Link>)}
        </div>
        <div><strong>{chartLast != null ? chartLast.toLocaleString(undefined, { maximumFractionDigits: 8 }) : "—"}</strong>{chartChange != null && <span className="muted"> {chartChange >= 0 ? "+" : ""}{chartChange.toFixed(2)}%</span>}</div>
      </div>
      {chartRows.length > 1 ? <div className="chart-wrap" aria-label={`${asset.symbol} ${chartPreset.label} price chart`}>
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" role="img" aria-label={`${asset.symbol} ${chartPreset.label} market history`}>
          <polyline fill="none" stroke="currentColor" strokeWidth="1.5" vectorEffect="non-scaling-stroke" points={chartPoints} />
        </svg>
      </div> : <p className="muted">No market history is available for this interval yet.</p>}
      <p className="muted">{chartRows.length} observations · {chartPreset.interval} interval · {chartPreset.days} day window · {chartData?.source ?? "unavailable"}</p>
    </section>
    <section id="overview" className="section card">
      <div className="row">
        <div><p className="eyebrow">DECISION VIEW</p><h2>What is happening — and what does it mean?</h2></div>
        <Link className="button" href={`/assets/${assetId}/research`}>Open Deep Research · 01–15</Link>
      </div>
      <div className="decision-lead">
        <div><span className="muted">Thesis state</span><div className="metric">{thesisState}</div><p>{decisionHeadline}</p></div>
        <div><span className="muted">Market direction</span><div className="metric">{marketDirection}</div><p>{chartChange != null ? `${chartChange >= 0 ? "+" : ""}${chartChange.toFixed(2)}% over selected market window` : "Market change is not available."}</p></div>
        <div><span className="muted">Research direction</span><div className="metric">{researchDirection}</div><p>{improvingSignals} improving · {deterioratingSignals} deteriorating signals</p></div>
      </div>
      <div className="decision-drivers">
        {decisionDrivers.length ? decisionDrivers.map((driver) => <div className="row table-row" key={driver.label}><span className="muted">{driver.label}</span><strong>{driver.value}</strong></div>) : <p className="muted">No current catalyst, risk or scenario has been recorded yet.</p>}
      </div>
      <p>{summary ?? "The research is still being assembled. The dashboard will become richer as the Asset Card fills."}</p>
      <div className="progress-row"><strong>{progress.completed}/{progress.total} research blocks</strong><strong>{progress.percent}%</strong></div>
      <div className="progress-track" aria-label={`Research progress ${progress.percent}%`}><div className="progress-fill" style={{width: `${progress.percent}%`}} /></div>
    </section>

    <section id="market-snapshot" className="section card" aria-label="Market snapshot">
      <div className="row">
        <div>
          <p className="eyebrow">MARKET SNAPSHOT</p>
          <h2>Market context</h2>
          <p className="muted">Latest stored daily market data. This is separate from the research thesis.</p>
        </div>
        <span className="pill">{latestMarket?.source ?? "Stored market history"}</span>
      </div>
      <div className="grid">
        <div className="card">
          <span className="muted">Latest stored close</span>
          <div className="metric">{latestMarket ? latestMarket.close.toLocaleString(undefined, { maximumFractionDigits: 8 }) : "—"}</div>
          <span className="muted">{latestMarket?.time ? new Date(latestMarket.time).toLocaleString() : "No market history"}</span>
        </div>
        <div className="card">
          <span className="muted">7d change</span>
          <div className="metric">{weekChange != null ? (weekChange >= 0 ? "+" : "") + weekChange.toFixed(2) + "%" : "—"}</div>
          <span className="muted">{weekRows.length ? weekRows.length + " daily observations" : "No 7d history"}</span>
        </div>
      </div>
      {weekRows.length > 1 ? (
        <div className="table-list" aria-label="Recent daily market history">
          {weekRows.map((row: any) => <div className="row table-row" key={row.time}>
            <span className="muted">{new Date(row.time).toLocaleDateString()}</span>
            <strong>{row.close.toLocaleString(undefined, { maximumFractionDigits: 8 })}</strong>
          </div>)}
        </div>
      ) : <p className="muted">Market history is not available for this asset yet.</p>}
    </section>
    <section className="grid section" aria-label="Decision scores">
      <div className="card"><span className="muted">Health Score</span><div className="metric">{health?.value ?? "—"}</div><span className="muted">{health?.confidence != null ? `Confidence ${health.confidence}` : "Not scored"}</span></div>
      <div className="card"><span className="muted">Thesis Score</span><div className="metric">{thesis?.value ?? "—"}</div><span className="muted">{thesis?.confidence != null ? `Confidence ${thesis.confidence}` : "Not scored"}</span></div>
      <div className="card"><span className="muted">Value Accrual</span><div className="metric">{valueAccrual?.value ?? "—"}</div><span className="muted">{valueAccrual?.confidence != null ? `Confidence ${valueAccrual.confidence}` : "Not scored"}</span></div>
      <div className="card"><span className="muted">Confidence</span><div className="metric">{confidence?.confidence ?? "—"}</div><span className="muted">{confidence?.score_type ?? "No score confidence recorded"}</span></div>
    </section>

    <section className="grid section"><div className="card"><span className="muted">Current Scenario</span><h2>{currentScenario?.scenario_type ?? currentScenario?.state ?? "—"}</h2><p className="muted">{currentScenario?.rationale ?? currentScenario?.thesis_impact ?? "Current scenario state not recorded."}</p></div><div className="card"><span className="muted">Main Catalyst</span><h3>{mainCatalyst?.name ?? "—"}</h3><p>{mainCatalyst?.current_state ?? mainCatalyst?.description ?? "No positive thesis driver is currently recorded."}</p></div><div className="card"><span className="muted">Main Risk</span><h3>{mainRisk?.name ?? "—"}</h3><p>{mainRisk?.current_state ?? mainRisk?.description ?? "No negative thesis driver is currently recorded."}</p></div></section>

    <section id="domains" className="section"><div className="section-heading"><p className="eyebrow">03 · DOMAINS</p><h2>Research Domains</h2><p className="muted">Six dashboard-level views aggregate the canonical 15 research blocks; they do not replace them.</p></div><div className="grid">{domains.length ? domains.map((d: any) => <article className="card" key={d.research_domain_id}><div className="row"><h3>{d.name}</h3><span className="pill">{d.code}</span></div><p className="muted">{d.description ?? "Domain state is available from the Asset Card."}</p></article>) : <div className="card"><p className="muted">No research domains recorded yet.</p></div>}</div></section>

    <section id="factors" className="section"><div className="section-heading"><p className="eyebrow">04 · FACTORS</p><h2>Critical Factors</h2><p className="muted">Asset-specific thesis drivers that deserve active attention.</p></div><div className="grid">{factors.length ? factors.map((f: any) => <article className="card" key={f.critical_factor_id}><div className="row"><h3>{f.name}</h3><span className="pill">{f.thesis_impact ?? "—"}</span></div><p>{f.current_state ?? f.description ?? "No current state recorded."}</p><div className="row"><span className="muted">Trend</span><span>{f.trend ?? "—"}</span></div><div className="row"><span className="muted">Confidence</span><span>{f.confidence ?? "—"}</span></div></article>) : <div className="card"><p className="muted">No critical factors recorded yet.</p></div>}</div></section>

    <section id="scores" className="section card"><div className="section-heading"><p className="eyebrow">05 · SCORES</p><h2>Research Scores</h2><p className="muted">Scores are shown with methodology, confidence and calculation date rather than as unexplained numbers.</p></div>{scores.length ? <div className="table-list">{scores.map((s: any) => <div className="row table-row" key={s.score_id}><div><strong>{s.score_type}</strong><p className="muted">{s.explanation}</p></div><div className="score-value">{s.value ?? "—"}</div><span className="muted">{s.confidence ?? "—"}</span></div>)}</div> : <p className="muted">No scores recorded yet.</p>}</section>

    <section id="scenarios" className="section"><div className="section-heading"><p className="eyebrow">06 · SCENARIOS</p><h2>Scenario States</h2><p className="muted">Bull / Base / Bear logic, assumptions and invalidation conditions.</p></div><div className="grid">{scenarios.length ? scenarios.map((s: any) => <article className="card" key={s.research_scenario_id ?? s.scenario_state_id ?? s.scenario_type}><div className="row"><h3>{s.scenario_type ?? s.state ?? "Scenario"}</h3><span className="pill">{s.probability ?? s.confidence ?? "—"}</span></div><p>{s.assumptions ?? s.description ?? "No assumptions recorded."}</p>{s.invalidation_conditions && <p className="muted"><strong>Invalidation:</strong> {s.invalidation_conditions}</p>}{s.thesis_impact && <p className="muted">Thesis impact: {s.thesis_impact}</p>}</article>) : <div className="card"><p className="muted">No scenario states recorded yet.</p></div>}</div></section>

    <section id="monitoring" className="section"><div className="section-heading"><p className="eyebrow">07 · MONITORING</p><h2>What changed?</h2><p className="muted">Monitoring keeps current state separate from historical research snapshots.</p></div><div className="grid">{monitoring.length ? monitoring.map((m: any) => <article className="card" key={m.monitoring_signal_id}><div className="row"><h3>{m.name}</h3><span className="pill">{m.status}</span></div><div className="row"><span className="muted">Current</span><span>{String(m.current_value ?? "—")}</span></div><div className="row"><span className="muted">Direction</span><span>{m.direction ?? "—"}</span></div><div className="row"><span className="muted">Thesis impact</span><span>{m.thesis_impact ?? "—"}</span></div></article>) : <div className="card"><p className="muted">No live monitoring signals recorded yet.</p></div>}</div>{monitoringEvents.length > 0 && <div className="section card"><div className="section-heading"><p className="eyebrow">MONITORING EVENTS</p><h3>Recent changes</h3></div><div className="table-list">{monitoringEvents.slice(0, 10).map((event: any) => <div className="row table-row" key={event.event_id}><div><strong>{event.event_type ?? "Event"}</strong><p className="muted">{event.observed_at ? new Date(event.observed_at).toLocaleString() : "—"}</p></div><span className="pill">{event.severity ?? event.status ?? "—"}</span></div>)}</div></div>}</section>

    <section id="evidence" className="section card"><div className="section-heading"><p className="eyebrow">08 · EVIDENCE</p><h2>Evidence & Sources</h2><p className="muted">Trace the research claim from observation and metric through signal, assessment, confidence, thesis impact and status.</p></div>{evidence.length ? <div className="table-list">{evidence.map((e: any) => <article className="table-row" key={e.evidence_id}><div><div className="row"><strong>{e.claim}</strong><span className="pill">{e.status}</span></div><p className="muted">{e.metric_id ?? "Metric not recorded"} · {e.signal} · thesis impact {e.thesis_impact} · confidence {e.confidence ?? "—"}</p><p>{e.assessment ?? e.data_summary ?? "No assessment recorded."}</p><p className="muted">Data: {e.observation_text ?? e.observation_value ?? "—"}{e.observation_unit ? ` ${e.observation_unit}` : ""} · Source: {e.source_name ?? e.source_id ?? "—"}</p></div>{e.source_url ? <a href={e.source_url} target="_blank" rel="noreferrer">Open source</a> : <span className="muted">No source URL</span>}</article>)}</div> : <p className="muted">No evidence records recorded yet.</p>}<div className="section"><div className="section-heading"><h3>Sources</h3><p className="muted">Source provenance used by the evidence chain.</p></div>{sources.length ? <div className="table-list">{sources.map((s: any) => <div className="row table-row" key={s.source_id}><div><strong>{s.name}</strong><p className="muted">{s.source_type} · trust {s.trust_level ?? "—"}</p></div>{s.base_url ? <a href={s.base_url} target="_blank" rel="noreferrer">Open source</a> : <span className="muted">No URL</span>}</div>)}</div> : <p className="muted">No sources recorded yet.</p>}</div></section>
  </main>;
}
