import { redirect } from "next/navigation";
import { getViewer } from "@/lib/session";
import { AppShell, Card, Pill, Section } from "@/components/ui";
import { fmtDay, fmtTime, monthLabel, monthOf, rand, shortLocation } from "@/lib/format";
import { teacherNav } from "../nav";

type Row = { id: string; rate: number; confirmed_at: string | null; paid_at: string | null; cover_requests: { class_name: string; starts_at: string; locations: { name: string } | null } };

export default async function EarningsPage() {
  const { supabase, user, profile } = await getViewer();
  if (!user) redirect("/login");
  if (!profile) redirect("/onboarding");
  const { data } = await supabase
    .from("cover_assignments")
    .select("id, rate, confirmed_at, paid_at, cover_requests!inner(class_name, starts_at, locations(name))")
    .eq("teacher_id", user.id)
    .is("dropped_at", null)
    .lt("cover_requests.starts_at", new Date().toISOString());
  const rows = ((data ?? []) as unknown as Row[]).sort((a, b) => b.cover_requests.starts_at.localeCompare(a.cover_requests.starts_at));
  const months = [...new Set(rows.map((r) => monthOf(r.cover_requests.starts_at)))];
  const owed = rows.filter((r) => r.confirmed_at && !r.paid_at).reduce((a, r) => a + r.rate, 0);
  const paid = rows.filter((r) => r.paid_at).reduce((a, r) => a + r.rate, 0);

  return (
    <AppShell
      eyebrow="Class Cover"
      title="Earnings"
      nav={teacherNav("earnings")}
      headerExtra={
        <div className="grid grid-cols-2 gap-1.5">
          {[[rand(owed), "To be paid"], [rand(paid), "Paid so far"]].map(([v, l]) => (
            <div key={l} className="rounded-2xl bg-accent-ink/10 px-3 py-2">
              <div className="font-display text-2xl font-bold leading-none">{v}</div>
              <div className="mt-1 text-[10px] font-semibold uppercase tracking-wide opacity-80">{l}</div>
            </div>
          ))}
        </div>
      }
    >
      {rows.length === 0 && <Card tone="sunk"><p className="text-sm text-muted">Covers you teach show up here once the class has happened.</p></Card>}
      {months.map((m) => {
        const list = rows.filter((r) => monthOf(r.cover_requests.starts_at) === m);
        return (
          <Section key={m} title={monthLabel(m)} aside={rand(list.reduce((a, r) => a + r.rate, 0))}>
            <Card>
              {list.map((r) => (
                <div key={r.id} className="flex items-center justify-between gap-3 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{r.cover_requests.class_name}</p>
                    <p className="text-xs text-muted">{fmtDay(r.cover_requests.starts_at)} {fmtTime(r.cover_requests.starts_at)} · {shortLocation(r.cover_requests.locations?.name ?? "")}</p>
                  </div>
                  <div className="grid justify-items-end gap-1">
                    <span className="font-mono">{rand(r.rate)}</span>
                    {r.paid_at ? <Pill tone="good">Paid</Pill> : r.confirmed_at ? <Pill tone="urgent">Confirmed</Pill> : <Pill>Awaiting studio</Pill>}
                  </div>
                </div>
              ))}
            </Card>
          </Section>
        );
      })}
    </AppShell>
  );
}
