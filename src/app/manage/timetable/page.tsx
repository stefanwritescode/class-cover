import Link from "next/link";
import { requireManager } from "@/lib/session";
import { AppShell, Card, ErrorNote } from "@/components/ui";
import { managerNav } from "../nav";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAY_LONG = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function todayInSA() {
  const d = DAYS.indexOf(new Date().toLocaleString("en-US", { timeZone: "Africa/Johannesburg", weekday: "short" }));
  return d <= 0 ? 1 : d; // Sunday has no classes, so show Monday
}

export default async function TimetablePage({ searchParams }: { searchParams: Promise<{ location?: string; day?: string }> }) {
  const { supabase, studio } = await requireManager();
  const params = await searchParams;
  const day = params.day !== undefined && /^[0-6]$/.test(params.day) ? Number(params.day) : todayInSA();
  const { data: locations, error } = await supabase.from("locations").select("id, name").eq("studio_id", studio.id).order("name");
  const current = locations?.find((l) => l.id === params.location) ?? locations?.[0];
  const { data: classes } = current
    ? await supabase.from("timetable_classes").select("id, name, weekday, start_time, duration_minutes").eq("location_id", current.id).order("start_time")
    : { data: [] };
  const all = classes ?? [];
  const today = all.filter((c) => c.weekday === day);
  const href = (loc?: string, d = day) => `/manage/timetable?location=${loc ?? current?.id}&day=${d}`;
  const short = (n: string) => n.replace("Stretch Pilates ", "");

  return (
    <AppShell
      eyebrow={studio.name}
      title="Timetable"
      subtitle={current ? `${short(current.name)} · ${all.length} classes a week` : undefined}
      nav={managerNav("settings")}
      headerExtra={
        <div className="-mx-5 flex gap-1.5 overflow-x-auto px-5 pb-1">
          {locations?.map((l) => (
            <Link
              key={l.id}
              href={href(l.id)}
              className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-semibold ${l.id === current?.id ? "bg-accent-ink text-accent" : "bg-accent-ink/10"}`}
            >
              {short(l.name)}
            </Link>
          ))}
        </div>
      }
    >
      {error && <ErrorNote message={error.message} />}
      <div className="grid grid-cols-6 gap-1.5">
        {[1, 2, 3, 4, 5, 6].map((d) => {
          const n = all.filter((c) => c.weekday === d).length;
          return (
            <Link
              key={d}
              href={href(undefined, d)}
              className={`grid justify-items-center gap-0.5 rounded-2xl border py-2 ${d === day ? "border-accent bg-accent-soft text-accent" : "border-line bg-surface text-muted"}`}
            >
              <span className="text-xs font-semibold">{DAYS[d]}</span>
              <span className="font-mono text-[11px]">{n}</span>
            </Link>
          );
        })}
      </div>

      <div className="grid gap-2">
        <h2 className="px-1 font-display text-lg font-semibold">{DAY_LONG[day]}</h2>
        {today.length === 0 && <Card tone="sunk"><p className="text-sm text-muted">No classes on {DAY_LONG[day]}.</p></Card>}
        {today.map((c) => {
          const reformer = /reformer/i.test(c.name);
          return (
            <div key={c.id} className="flex items-center gap-3 rounded-3xl border border-line bg-surface p-3">
              <div className="grid w-16 flex-none justify-items-center rounded-2xl bg-sunk py-2">
                <span className="font-mono text-base font-medium">{c.start_time.slice(0, 5)}</span>
                <span className="text-[10px] text-muted">{c.duration_minutes} min</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{c.name}</p>
                <p className="text-xs text-muted">{short(current?.name ?? "")}</p>
              </div>
              <span className={`h-2.5 w-2.5 flex-none rounded-full ${reformer ? "bg-accent" : "bg-urgent"}`} title={reformer ? "Reformer" : "Mat"} />
            </div>
          );
        })}
      </div>
      <p className="flex items-center gap-3 px-1 text-xs text-muted">
        <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-accent" />Reformer</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-urgent" />Mat and other</span>
        <span className="ml-auto">From Octiv, 26 Oct 2026</span>
      </p>
    </AppShell>
  );
}
