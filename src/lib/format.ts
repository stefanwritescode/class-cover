// South Africa has no daylight saving, so Africa/Johannesburg is always UTC+02:00.
export const TZ = "Africa/Johannesburg";

export const rand = (n: number) => `R${n.toLocaleString("en-ZA")}`;

/** Combine a YYYY-MM-DD date and HH:MM time in SA into an ISO timestamp. */
export const saISO = (date: string, time: string) => `${date}T${time.slice(0, 5)}:00+02:00`;

/** Today's date in SA as YYYY-MM-DD, offset by `days`. */
export function saDate(days = 0) {
  const d = new Date(Date.now() + days * 864e5);
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(d);
}

export const weekdayOf = (date: string) => new Date(`${date}T12:00:00+02:00`).getUTCDay();

export function fmtTime(iso: string) {
  return new Intl.DateTimeFormat("en-ZA", { timeZone: TZ, hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(iso));
}

/** "Today", "Tomorrow" or "Thu 23 Oct". */
export function fmtDay(iso: string) {
  const day = new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date(iso));
  if (day === saDate(0)) return "Today";
  if (day === saDate(1)) return "Tomorrow";
  return new Intl.DateTimeFormat("en-ZA", { timeZone: TZ, weekday: "short", day: "numeric", month: "short" }).format(new Date(iso));
}

export const fmtDate = (iso: string) =>
  new Intl.DateTimeFormat("en-ZA", { timeZone: TZ, day: "numeric", month: "short", year: "numeric" }).format(new Date(iso));

/** "in 2 h 10 min" style countdown, or null once started. */
export function startsIn(iso: string) {
  const mins = Math.round((new Date(iso).getTime() - Date.now()) / 60000);
  if (mins <= 0) return null;
  if (mins < 60) return `in ${mins} min`;
  const h = Math.floor(mins / 60);
  if (h < 24) return `in ${h} h${mins % 60 ? ` ${mins % 60} min` : ""}`;
  return `in ${Math.round(h / 24)} days`;
}

export function daypart(time: string): "morning" | "midday" | "evening" {
  const h = Number(time.slice(0, 2));
  return h < 12 ? "morning" : h < 16 ? "midday" : "evening";
}

export const shortLocation = (name: string) => name.replace("Stretch Pilates ", "");

/** Month key YYYY-MM in SA for an ISO timestamp. */
export const monthOf = (iso: string) => new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit" }).format(new Date(iso));

export function monthRange(month: string) {
  const [y, m] = month.split("-").map(Number);
  const next = m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, "0")}`;
  return { from: `${month}-01T00:00:00+02:00`, to: `${next}-01T00:00:00+02:00` };
}

export const monthLabel = (month: string) =>
  new Intl.DateTimeFormat("en-ZA", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${month}-15T00:00:00Z`));

/** Classes starting within this many hours skip the preferred head start. */
export const URGENT_HOURS = 3;
