const LONDON_TIME_ZONE = "Europe/London";

function londonDateParts(input: Date) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: LONDON_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(input);
  const get = (type: string) => Number(parts.find((part) => part.type === type)?.value);
  return { year: get("year"), month: get("month"), day: get("day") };
}

/** Convert a London wall-clock time to its UTC instant, accounting for GMT/BST. */
function londonWallTimeToUtc(year: number, month: number, day: number, hour = 0) {
  const targetWallClock = Date.UTC(year, month - 1, day, hour, 0, 0);
  let guess = targetWallClock;

  // Correct the guess against the timezone's actual offset. London midnight is
  // unambiguous; iteration handles both GMT and BST without a fixed 24h offset.
  for (let attempt = 0; attempt < 4; attempt++) {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: LONDON_TIME_ZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    }).formatToParts(new Date(guess));
    const get = (type: string) => Number(parts.find((part) => part.type === type)?.value);
    const representedWallClock = Date.UTC(
      get("year"), get("month") - 1, get("day"),
      get("hour"), get("minute"), get("second"),
    );
    const correction = targetWallClock - representedWallClock;
    guess += correction;
    if (correction === 0) break;
  }
  return new Date(guess);
}

/** Return midnight at the start of the London calendar day containing input. */
export function londonDayBoundary(input: Date): Date {
  const { year, month, day } = londonDateParts(input);
  return londonWallTimeToUtc(year, month, day);
}

/** Return the next exact 00:00 boundary in Europe/London, strictly after input. */
export function nextLondonDayBoundary(input: Date = new Date()): Date {
  const { year, month, day } = londonDateParts(input);
  const nextDay = new Date(Date.UTC(year, month - 1, day + 1));
  const boundary = londonWallTimeToUtc(
    nextDay.getUTCFullYear(),
    nextDay.getUTCMonth() + 1,
    nextDay.getUTCDate(),
  );
  if (boundary.getTime() <= input.getTime()) {
    throw new Error("Could not calculate a future Europe/London day boundary");
  }
  return boundary;
}

export function millisecondsUntilNextLondonDayBoundary(input: Date = new Date()): number {
  return nextLondonDayBoundary(input).getTime() - input.getTime();
}
