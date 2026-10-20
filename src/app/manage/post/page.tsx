import { requireManager } from "@/lib/session";
import { AppShell } from "@/components/ui";
import { saDate } from "@/lib/format";
import { managerNav } from "../nav";
import PostForm from "./post-form";

export default async function PostPage() {
  const { supabase, studio } = await requireManager();
  const [{ data: locations }, { data: s }] = await Promise.all([
    supabase.from("locations").select("id, name").eq("studio_id", studio.id).order("name"),
    supabase.from("studios").select("default_rate, wave_delay_minutes").eq("id", studio.id).single(),
  ]);
  const ids = (locations ?? []).map((l) => l.id);
  const { data: classes } = ids.length
    ? await supabase.from("timetable_classes").select("id, location_id, name, weekday, start_time, duration_minutes").in("location_id", ids).order("start_time")
    : { data: [] };
  const days = Array.from({ length: 14 }, (_, i) => saDate(i));

  return (
    <AppShell eyebrow={studio.name} title="Post a cover" subtitle="Qualified teachers see it the moment you post." nav={managerNav("post")}>
      <PostForm
        locations={locations ?? []}
        classes={classes ?? []}
        days={days}
        defaultRate={s?.default_rate ?? 275}
        headStart={s?.wave_delay_minutes ?? 15}
      />
    </AppShell>
  );
}
