import Link from "next/link";
import { requireManager } from "@/lib/session";
import { AppShell, Avatar, buttonClass, Card, ErrorNote, Pill, Section } from "@/components/ui";
import { monthLabel, monthOf, rand, shortLocation } from "@/lib/format";
import { loadMonth, totals } from "@/lib/pay";
import { managerNav } from "../nav";
import { markPaid } from "../actions";

function shiftMonth(month: string, by: number) {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + by, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export default async function PayPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const { supabase, studio } = await requireManager();
  const params = await searchParams;
  const month = params.month && /^\d{4}-\d{2}$/.test(params.month) ? params.month : monthOf(new Date().toISOString());
  const { rows, error } = await loadMonth(supabase, studio.id, month);
  const t = totals(rows);
  const max = Math.max(1, ...t.byLocation.map((l) => l.total));

  return (
    <AppShell
      eyebrow={studio.name}
      title="Pay"
      subtitle={monthLabel(month)}
      nav={managerNav("pay")}
      headerExtra={
        <div className="grid gap-3">
          <div className="flex items-center gap-2">
            <Link href={`/manage/pay?month=${shiftMonth(month, -1)}`} className="rounded-full bg-accent-ink/10 px-3 py-1 text-xs font-semibold">← {monthLabel(shiftMonth(month, -1)).split(" ")[0]}</Link>
            <Link href={`/manage/pay?month=${shiftMonth(month, 1)}`} className="rounded-full bg-accent-ink/10 px-3 py-1 text-xs font-semibold">{monthLabel(shiftMonth(month, 1)).split(" ")[0]} →</Link>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {[
              [rand(t.teacherTotal), "Cover cost"],
              [String(t.confirmed.length), "Classes"],
              [String(t.awaiting.length), "To confirm"],
            ].map(([v, l]) => (
              <div key={l} className="rounded-2xl bg-accent-ink/10 px-2 py-2 text-center">
                <div className="font-display text-xl font-bold leading-none">{v}</div>
                <div className="mt-1 text-[10px] font-semibold uppercase tracking-wide opacity-80">{l}</div>
              </div>
            ))}
          </div>
        </div>
      }
    >
      {error && <ErrorNote message={error.message} />}
      {t.awaiting.length > 0 && (
        <Card tone="sunk">
          <p className="text-sm"><b>{t.awaiting.length} class{t.awaiting.length > 1 ? "es" : ""} not confirmed yet.</b> Only confirmed classes count towards pay. <Link href="/manage/covers" className="font-semibold text-accent">Confirm on Covers</Link></p>
        </Card>
      )}

      <div className="flex flex-wrap gap-2">
        <Link href={`/manage/pay/invoice?month=${month}`} className={buttonClass("primary", true)}>Monthly invoice</Link>
        <a href={`/manage/pay/export?month=${month}&kind=bank`} className={buttonClass("ghost", true)}>Bank payment file</a>
        <a href={`/manage/pay/export?month=${month}&kind=xero`} className={buttonClass("ghost", true)}>Xero CSV</a>
      </div>

      {t.byLocation.length > 0 && (
        <Section title="By studio">
          <Card>
            {t.byLocation.map((l) => (
              <div key={l.key} className="grid gap-1">
                <div className="flex justify-between text-sm"><span>{shortLocation(l.key)}</span><span className="font-mono">{rand(l.total)} · {l.rows.length}</span></div>
                <div className="h-2 rounded-full bg-sunk"><div className="h-2 rounded-full bg-accent" style={{ width: `${(l.total / max) * 100}%` }} /></div>
              </div>
            ))}
          </Card>
        </Section>
      )}

      <Section title="By teacher">
        {t.byTeacher.length === 0 && <Card tone="sunk"><p className="text-sm text-muted">No confirmed covers in {monthLabel(month)}.</p></Card>}
        {t.byTeacher.map((g) => {
          const unpaid = g.rows.filter((r) => !r.paid_at);
          const name = g.rows[0].profiles?.full_name ?? "Teacher";
          return (
            <Card key={g.key}>
              <div className="flex items-center gap-3">
                <Avatar name={name} />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{name}</p>
                  <p className="text-xs text-muted">{g.rows.length} class{g.rows.length > 1 ? "es" : ""}</p>
                </div>
                <span className="font-mono text-lg">{rand(g.total)}</span>
              </div>
              <div className="flex items-center justify-between gap-2 border-t border-line pt-3">
                {unpaid.length ? <Pill tone="urgent">{rand(unpaid.reduce((a, r) => a + r.rate, 0))} to pay</Pill> : <Pill tone="good">Paid</Pill>}
                {unpaid.length > 0 && (
                  <form action={markPaid}>
                    <input type="hidden" name="assignment_ids" value={unpaid.map((r) => r.id).join(",")} />
                    <button className={buttonClass("ghost", true)}>Mark as paid</button>
                  </form>
                )}
              </div>
            </Card>
          );
        })}
      </Section>
      <p className="px-1 text-xs text-muted">Class Cover is free during launch. Platform fee this month: {rand(t.platformFee)}.</p>
    </AppShell>
  );
}
