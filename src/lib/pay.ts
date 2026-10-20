import type { SupabaseClient } from "@supabase/supabase-js";
import { monthRange } from "@/lib/format";

export type PayRow = {
  id: string;
  teacher_id: string;
  rate: number;
  platform_fee: number;
  confirmed_at: string | null;
  paid_at: string | null;
  profiles: { full_name: string } | null;
  cover_requests: { class_name: string; starts_at: string; locations: { name: string } | null };
};

/** All covers taught (not dropped) at a studio in a month, oldest first. */
export async function loadMonth(supabase: SupabaseClient, studioId: string, month: string) {
  const { from, to } = monthRange(month);
  const { data, error } = await supabase
    .from("cover_assignments")
    .select("id, teacher_id, rate, platform_fee, confirmed_at, paid_at, profiles(full_name), cover_requests!inner(class_name, starts_at, studio_id, locations(name))")
    .is("dropped_at", null)
    .eq("cover_requests.studio_id", studioId)
    .gte("cover_requests.starts_at", from)
    .lt("cover_requests.starts_at", to);
  const rows = ((data ?? []) as unknown as PayRow[]).sort((a, b) => a.cover_requests.starts_at.localeCompare(b.cover_requests.starts_at));
  return { rows, error };
}

export function totals(rows: PayRow[]) {
  const confirmed = rows.filter((r) => r.confirmed_at);
  const sum = (rs: PayRow[]) => rs.reduce((a, r) => a + r.rate, 0);
  const group = (key: (r: PayRow) => string) => {
    const m = new Map<string, PayRow[]>();
    confirmed.forEach((r) => m.set(key(r), [...(m.get(key(r)) ?? []), r]));
    return [...m.entries()].map(([k, rs]) => ({ key: k, rows: rs, total: sum(rs) })).sort((a, b) => b.total - a.total);
  };
  return {
    confirmed,
    awaiting: rows.filter((r) => !r.confirmed_at),
    teacherTotal: sum(confirmed),
    platformFee: confirmed.reduce((a, r) => a + r.platform_fee, 0),
    byTeacher: group((r) => r.teacher_id),
    byLocation: group((r) => r.cover_requests.locations?.name ?? "Unknown"),
  };
}
