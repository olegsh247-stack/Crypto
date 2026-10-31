import assert from "node:assert/strict";
import test from "node:test";
import { isClosedUtcDailyCandle, mergeRecentDailyCandleRows, refreshResearchReviewStatus, utcDayBoundary } from "./scheduler.js";

const boundaryCases: Array<{ name: string; input: string; expected: string }> = [
  { name: "winter date uses UTC midnight", input: "2026-01-15T12:00:00.000Z", expected: "2026-01-15T00:00:00.000Z" },
  { name: "summer date also uses UTC midnight", input: "2026-07-15T12:00:00.000Z", expected: "2026-07-15T00:00:00.000Z" },
  { name: "spring DST transition does not shift UTC candle boundary", input: "2026-03-29T12:00:00.000Z", expected: "2026-03-29T00:00:00.000Z" },
  { name: "day after spring DST transition uses UTC midnight", input: "2026-03-30T12:00:00.000Z", expected: "2026-03-30T00:00:00.000Z" },
  { name: "autumn DST transition does not shift UTC candle boundary", input: "2026-10-25T12:00:00.000Z", expected: "2026-10-25T00:00:00.000Z" },
  { name: "day after autumn DST transition uses UTC midnight", input: "2026-10-26T12:00:00.000Z", expected: "2026-10-26T00:00:00.000Z" },
];

for (const item of boundaryCases) {
  test(item.name, () => {
    assert.equal(utcDayBoundary(new Date(item.input)).toISOString(), item.expected);
  });
}

test("current UTC daily candle remains open until 24 hours have elapsed", () => {
  assert.equal(isClosedUtcDailyCandle(new Date("2026-10-27T00:00:00.000Z"), new Date("2026-10-27T00:30:00.000Z")), false);
  assert.equal(isClosedUtcDailyCandle(new Date("2026-10-27T00:00:00.000Z"), new Date("2026-10-27T23:59:59.999Z")), false);
  assert.equal(isClosedUtcDailyCandle(new Date("2026-10-27T00:00:00.000Z"), new Date("2026-10-28T00:00:00.000Z")), true);
});

test("previous UTC daily candle is finalized after its close", () => {
  assert.equal(isClosedUtcDailyCandle(new Date("2026-10-26T00:00:00.000Z"), new Date("2026-10-27T00:30:00.000Z")), true);
});


function candle(day:string,close:number=100){
  return {time:`${day}T00:00:00.000Z`,open:close-1,high:close+1,low:close-2,close,volume:10};
}

test("partial Binance history is filled from Kraken for missing finalized UTC days",()=>{
  const now=new Date("2026-10-28T12:00:00.000Z");
  const binance=[candle("2026-10-27",110),candle("2026-10-25",105)];
  const kraken=[
    candle("2026-10-27",210),candle("2026-10-26",106),candle("2026-10-25",205),
    candle("2026-10-24",104),candle("2026-10-23",103),candle("2026-10-22",102),
    candle("2026-10-21",101),candle("2026-10-20",100),candle("2026-10-19",99),
    candle("2026-10-28",999)
  ];
  const rows=mergeRecentDailyCandleRows(binance,kraken,"BTC","BTCUSDT",now);
  assert.equal(rows.length,8);
  assert.deepEqual(rows.map(row=>row.time.slice(0,10)),[
    "2026-10-20","2026-10-21","2026-10-22","2026-10-23",
    "2026-10-24","2026-10-25","2026-10-26","2026-10-27"
  ]);
  const byDay=new Map(rows.map(row=>[row.time.slice(0,10),row]));
  assert.equal(byDay.get("2026-10-27")?.sourceId,"market_binance");
  assert.equal(byDay.get("2026-10-27")?.close,110);
  assert.equal(byDay.get("2026-10-25")?.sourceId,"market_binance");
  assert.equal(byDay.get("2026-10-26")?.sourceId,"market_kraken");
  assert.equal(byDay.get("2026-10-26")?.sourceSymbol,"XBTUSD");
});

test("unsupported assets do not receive Kraken fallback rows",()=>{
  const now=new Date("2026-10-28T12:00:00.000Z");
  const rows=mergeRecentDailyCandleRows([],[candle("2026-10-27")],"DOGE","DOGEUSDT",now);
  assert.deepEqual(rows,[]);
});

test("daily candle selector ignores open UTC day and dates outside recent eight finalized days",()=>{
  const now=new Date("2026-10-28T12:00:00.000Z");
  const rows=mergeRecentDailyCandleRows(
    [candle("2026-10-28"),candle("2026-10-10")],
    [candle("2026-10-28"),candle("2026-10-10")],
    "BTC","BTCUSDT",now
  );
  assert.deepEqual(rows,[]);
});


test("research status refresh propagates database failures for the scheduler to report", async () => {
  const failingSql = async () => { throw new Error("research_status_db_unavailable"); };
  await assert.rejects(() => refreshResearchReviewStatus(failingSql), /research_status_db_unavailable/);
});
