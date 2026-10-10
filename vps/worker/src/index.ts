import { runScheduledIngestion } from "./scheduler.js";
import { millisecondsUntilNextLondonDayBoundary, nextLondonDayBoundary } from "./schedule.js";

const env = { DATABASE_URL: process.env.DATABASE_URL ?? "" };
// CI can explicitly request a one-shot run against disposable PostgreSQL.
// Normal service mode waits for the next London midnight and then re-arms after
// each run; it does not drift by 24 hours or skip DST transitions.
const oneShot = process.env.WORKER_INTERVAL_MS === "0";

async function run() {
  try {
    const result = await runScheduledIngestion(env);
    console.log(JSON.stringify({
      status: "ok",
      service: "crypto-worker-vps",
      schedule_timezone: "Europe/London",
      ...result,
    }));
  } catch (error) {
    console.error(JSON.stringify({
      status: "error",
      service: "crypto-worker-vps",
      error: error instanceof Error ? error.message : "worker_failed",
    }));
  }
}

let timer: NodeJS.Timeout | undefined;
let shuttingDown = false;

function scheduleNextRun() {
  if (shuttingDown) return;
  const now = new Date();
  const delay = millisecondsUntilNextLondonDayBoundary(now);
  const next = nextLondonDayBoundary(now);
  console.log(JSON.stringify({
    status: "scheduled",
    service: "crypto-worker-vps",
    schedule_timezone: "Europe/London",
    next_run_at: next.toISOString(),
    delay_ms: delay,
  }));
  timer = setTimeout(async () => {
    await run();
    scheduleNextRun();
  }, delay);
  timer.unref();
}

if (oneShot) {
  void run();
} else {
  scheduleNextRun();
}

function shutdown() {
  shuttingDown = true;
  if (timer) clearTimeout(timer);
  process.exit(0);
}
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
