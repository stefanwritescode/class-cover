import { requireManager } from "@/lib/session";
import { AppShell, Card, Section } from "@/components/ui";
import { managerNav } from "../nav";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default async function TimetablePage({ searchParams }: { searchParams: Promise<{ location?: string }> }) {
  const { supabase, studio } = await requireManager();
  const { location } = await searchParams;
  const { data: locations } = await supabase.from("locations").select("id, name").eq("studio_id", studio.id).order("name");
  const current = locations?.find((l) => l.id === location) ?? locations?.[0];
  const { data: classes } = current
    ? await supabase.from("timetable_classes").select("id, name, weekday, start_time, duration_minutes").eq("location_id", current.id).order("weekday").order("start_time")
    : { data: [] };

  return (
    <AppShell eyebrow={studio.name} title="Timetable" nav={managerNav("timetable")}>
      <div className="flex flex-wrap gap-2">
        {locations?.map((l) => (
          <a
            key={l.id}
            href={`/manage/timetable?location=${l.id}`}
            className={`rounded-full border px-3 py-1 text-xs font-semibold ${l.id === current?.id ? "border-accent bg-accent-soft text-accent" : "border-line bg-surface text-muted"}`}
          >
            {l.name.replace("Stretch Pilates ", "")}
          </a>
        ))}
      </div>
      {[1, 2, 3, 4, 5, 6, 0].map((d) => {
        const day = (classes ?? []).filter((c) => c.weekday === d);
        if (!day.length) return null;
        return (
          <Section key={d} title={DAYS[d]}>
            <Card>
              <div className="grid gap-1.5">
                {day.map((c) => (
                  <div key={c.id} className="flex justify-between gap-3 text-sm">
                    <span>{c.name}</span>
                    <span className="font-mono text-muted">{c.start_time.slice(0, 5)} · {c.duration_minutes}m</span>
                  </div>
                ))}
              </div>
            </Card>
          </Section>
        );
      })}
      <p className="text-xs text-muted">Imported from Octiv for the week of 26 Oct 2026. Group classes only.</p>
    </AppShell>
  );
}
