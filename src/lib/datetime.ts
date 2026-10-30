function offsetMs(date: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(date);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
  return asUtc - Math.floor(date.getTime() / 1000) * 1000;
}

/** Converts a `datetime-local` value ("2026-11-02T19:30") in `timeZone` to a UTC Date. */
export function zonedLocalToUtc(local: string, timeZone: string): Date {
  const guess = new Date(`${local}:00Z`);
  const first = new Date(guess.getTime() - offsetMs(guess, timeZone));
  // Second pass settles DST boundaries.
  return new Date(guess.getTime() - offsetMs(first, timeZone));
}

export function formatDateTime(iso: string | null, timeZone: string): string {
  if (!iso) return "Not scheduled";
  return new Intl.DateTimeFormat("en-GB", {
    timeZone,
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function formatDate(iso: string, timeZone = "Asia/Karachi"): string {
  return new Intl.DateTimeFormat("en-GB", { timeZone, day: "numeric", month: "short", year: "numeric" }).format(
    new Date(iso)
  );
}

export function isValidTimeZone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}
