import Link from "next/link";
import { requireManager } from "@/lib/session";
import { fmtDate, fmtTime, monthLabel, monthOf, monthRange, rand, shortLocation } from "@/lib/format";
import { loadMonth, totals } from "@/lib/pay";
import PrintButton from "./print-button";

export default async function InvoicePage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const { supabase, studio } = await requireManager();
  const params = await searchParams;
  const month = params.month && /^\d{4}-\d{2}$/.test(params.month) ? params.month : monthOf(new Date().toISOString());
  const { rows } = await loadMonth(supabase, studio.id, month);
  const t = totals(rows);
  const { to } = monthRange(month);
  const number = `CC-${studio.id.slice(0, 4).toUpperCase()}-${month.replace("-", "")}`;

  return (
    <div className="min-h-dvh bg-surface print:bg-white">
      <div className="mx-auto grid max-w-3xl gap-8 px-5 py-8 text-ink print:text-black">
        <div className="flex items-center justify-between print:hidden">
          <Link href={`/manage/pay?month=${month}`} className="text-sm font-semibold text-accent">← Back to Pay</Link>
          <PrintButton />
        </div>

        <header className="flex flex-wrap items-start justify-between gap-6 border-b-4 border-accent pb-6">
          <div>
            <p className="font-display text-3xl font-bold">Class Cover</p>
            <p className="text-sm text-muted">Cover statement and invoice</p>
          </div>
          <dl className="grid grid-cols-[auto_auto] gap-x-4 gap-y-1 text-sm">
            <dt className="text-muted">Invoice</dt><dd className="font-mono">{number}</dd>
            <dt className="text-muted">Period</dt><dd>{monthLabel(month)}</dd>
            <dt className="text-muted">Issued</dt><dd>{fmtDate(new Date(Math.min(Date.now(), new Date(to).getTime() - 1)).toISOString())}</dd>
            <dt className="text-muted">Bill to</dt><dd className="font-semibold">{studio.name}</dd>
          </dl>
        </header>

        <section className="grid gap-3">
          <h2 className="font-display text-xl font-semibold">Summary</h2>
          <table className="w-full text-sm">
            <tbody>
              <tr className="border-b border-line"><td className="py-2">Cover classes taught and confirmed</td><td className="py-2 text-right font-mono">{t.confirmed.length}</td></tr>
              <tr className="border-b border-line"><td className="py-2">Cover cost, paid by the studio directly to teachers</td><td className="py-2 text-right font-mono">{rand(t.teacherTotal)}</td></tr>
              <tr className="border-b border-line"><td className="py-2">Class Cover platform fee <span className="text-muted">(free during launch)</span></td><td className="py-2 text-right font-mono">{rand(t.platformFee)}.00</td></tr>
              <tr><td className="py-3 font-semibold">Amount due to Class Cover</td><td className="py-3 text-right font-mono text-lg font-semibold">{rand(t.platformFee)}.00</td></tr>
            </tbody>
          </table>
          {t.awaiting.length > 0 && <p className="text-xs text-muted">{t.awaiting.length} class{t.awaiting.length > 1 ? "es were" : " was"} not confirmed and {t.awaiting.length > 1 ? "are" : "is"} not included.</p>}
        </section>

        <section className="grid gap-3">
          <h2 className="font-display text-xl font-semibold">Cost by studio</h2>
          <table className="w-full text-sm">
            <thead><tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted"><th className="py-2">Studio</th><th className="py-2 text-right">Classes</th><th className="py-2 text-right">Cost</th></tr></thead>
            <tbody>
              {t.byLocation.map((l) => (
                <tr key={l.key} className="border-b border-line"><td className="py-2">{shortLocation(l.key)}</td><td className="py-2 text-right font-mono">{l.rows.length}</td><td className="py-2 text-right font-mono">{rand(l.total)}</td></tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="grid gap-3">
          <h2 className="font-display text-xl font-semibold">Cover cost by teacher</h2>
          <table className="w-full text-sm">
            <thead><tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted"><th className="py-2">Teacher</th><th className="py-2 text-right">Classes</th><th className="py-2 text-right">Amount</th><th className="py-2 text-right">Status</th></tr></thead>
            <tbody>
              {t.byTeacher.map((g) => (
                <tr key={g.key} className="border-b border-line">
                  <td className="py-2">{g.rows[0].profiles?.full_name}</td>
                  <td className="py-2 text-right font-mono">{g.rows.length}</td>
                  <td className="py-2 text-right font-mono">{rand(g.total)}</td>
                  <td className="py-2 text-right">{g.rows.every((r) => r.paid_at) ? "Paid" : "To pay"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="grid gap-3">
          <h2 className="font-display text-xl font-semibold">Every class</h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[34rem] text-sm">
              <thead><tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted"><th className="py-2">Date</th><th className="py-2">Studio</th><th className="py-2">Class</th><th className="py-2">Teacher</th><th className="py-2 text-right">Rate</th></tr></thead>
              <tbody>
                {t.confirmed.map((r) => (
                  <tr key={r.id} className="border-b border-line">
                    <td className="py-2 font-mono text-xs">{fmtDate(r.cover_requests.starts_at)} {fmtTime(r.cover_requests.starts_at)}</td>
                    <td className="py-2">{shortLocation(r.cover_requests.locations?.name ?? "")}</td>
                    <td className="py-2">{r.cover_requests.class_name}</td>
                    <td className="py-2">{r.profiles?.full_name}</td>
                    <td className="py-2 text-right font-mono">{rand(r.rate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <p className="border-t border-line pt-4 text-xs text-muted">Teachers are paid by the studio. Class Cover records each cover and confirmation but does not handle teacher payments.</p>
      </div>
    </div>
  );
}
