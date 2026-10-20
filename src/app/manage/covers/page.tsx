import Link from "next/link";
import { requireManager } from "@/lib/session";
import { AppShell, Avatar, buttonClass, Card, ErrorNote, Icon, Pill, Section } from "@/components/ui";
import { fmtDay, fmtTime, rand, shortLocation, startsIn } from "@/lib/format";
import { managerNav } from "../nav";
import { cancelCover, confirmCover, openToEveryone } from "../actions";

type Assignment = {
  id: string;
  dropped_at: string | null;
  checked_in_at: string | null;
  confirmed_at: string | null;
  rating: number | null;
  profiles: { full_name: string } | null;
};
type Req = {
  id: string;
  class_name: string;
  starts_at: string;
  duration_minutes: number;
  rate: number;
  reason: string | null;
  notes: string | null;
  urgent: boolean;
  wave: "preferred" | "all";
  wave_opened_at: string;
  status: "open" | "filled" | "cancelled";
  locations: { name: string } | null;
  cover_assignments: Assignment[];
};

export default async function CoversPage({ searchParams }: { searchParams: Promise<{ posted?: string }> }) {
  const { supabase, studio } = await requireManager();
  const { posted } = await searchParams;
  const since = new Date(Date.now() - 14 * 864e5).toISOString();
  const [{ data, error }, { data: s }] = await Promise.all([
    supabase
      .from("cover_requests")
      .select("id, class_name, starts_at, duration_minutes, rate, reason, notes, urgent, wave, wave_opened_at, status, locations(name), cover_assignments(id, dropped_at, checked_in_at, confirmed_at, rating, profiles(full_name))")
      .eq("studio_id", studio.id)
      .gte("starts_at", since)
      .order("starts_at"),
    supabase.from("studios").select("wave_delay_minutes").eq("id", studio.id).single(),
  ]);
  const reqs = (data ?? []) as unknown as Req[];
  const now = Date.now();
  const active = (r: Req) => r.cover_assignments.find((a) => !a.dropped_at);
  const future = (r: Req) => new Date(r.starts_at).getTime() > now;
  const delay = s?.wave_delay_minutes ?? 15;
  const everyoneAt = (r: Req) => new Date(r.wave_opened_at).getTime() + delay * 60_000;

  const open = reqs.filter((r) => r.status === "open" && future(r));
  const covered = reqs.filter((r) => r.status === "filled" && future(r));
  const toConfirm = reqs.filter((r) => r.status === "filled" && !future(r) && !active(r)?.confirmed_at);
  const unfilled = reqs.filter((r) => r.status === "open" && !future(r));
  const done = reqs.filter((r) => r.status === "filled" && !future(r) && active(r)?.confirmed_at).reverse();

  const head = (r: Req) => (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="font-display text-lg font-semibold leading-tight">{r.class_name}</p>
        <p className="mt-0.5 text-sm text-muted">
          {fmtDay(r.starts_at)} · <span className="font-mono">{fmtTime(r.starts_at)}</span> · {shortLocation(r.locations?.name ?? "")}
        </p>
      </div>
      <span className="font-mono text-base">{rand(r.rate)}</span>
    </div>
  );

  return (
    <AppShell
      eyebrow={studio.name}
      title="Covers"
      subtitle={open.length ? `${open.length} class${open.length > 1 ? "es" : ""} still need${open.length > 1 ? "" : "s"} a teacher` : "Every posted class is covered"}
      nav={managerNav("covers", { open: open.length })}
      headerExtra={<Link href="/manage/post" className="inline-flex items-center gap-2 rounded-full bg-accent-ink px-4 py-2 text-sm font-semibold text-accent">{Icon.plus} Post a cover</Link>}
    >
      {error && <ErrorNote message={error.message} />}
      {posted && <Card tone="sunk"><p className="text-sm"><b>Posted.</b> Qualified teachers can see it now. WhatsApp alerts come in the next step of the build.</p></Card>}

      {open.length > 0 && (
        <Section title="Needs cover" aside={`${open.length}`}>
          {open.map((r) => {
            const everyone = r.wave === "all" || r.urgent || now >= everyoneAt(r);
            const mins = Math.max(0, Math.ceil((everyoneAt(r) - now) / 60000));
            return (
              <Card key={r.id} tone="urgent">
                {head(r)}
                <div className="flex flex-wrap gap-2">
                  {r.urgent && <Pill tone="bad">Urgent</Pill>}
                  <Pill tone="urgent">{startsIn(r.starts_at) ? `Starts ${startsIn(r.starts_at)}` : "Starting"}</Pill>
                  {r.cover_assignments.some((a) => a.dropped_at) && <Pill>Re-posted after a dropout</Pill>}
                </div>
                <ol className="grid gap-1.5 text-sm">
                  <li className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-good" />Preferred teachers can accept</li>
                  <li className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${everyone ? "bg-good" : "bg-line"}`} />
                    {everyone ? "Vetted locums can accept too" : `Opens to vetted locums in ${mins} min`}
                  </li>
                </ol>
                <div className="flex flex-wrap gap-2 border-t border-line pt-3">
                  {!everyone && (
                    <form action={openToEveryone}>
                      <input type="hidden" name="request_id" value={r.id} />
                      <button className={buttonClass("primary", true)}>Open to locums now</button>
                    </form>
                  )}
                  <form action={cancelCover}>
                    <input type="hidden" name="request_id" value={r.id} />
                    <button className={buttonClass("danger", true)}>Cancel request</button>
                  </form>
                </div>
              </Card>
            );
          })}
        </Section>
      )}

      {toConfirm.length > 0 && (
        <Section title="Did these classes happen?" aside="Confirm for pay">
          {toConfirm.map((r) => {
            const a = active(r)!;
            return (
              <Card key={r.id}>
                {head(r)}
                <div className="flex items-center gap-2 text-sm">
                  <Avatar name={a.profiles?.full_name ?? "?"} />
                  <span className="font-semibold">{a.profiles?.full_name}</span>
                  {a.checked_in_at ? <Pill tone="good">Checked in {fmtTime(a.checked_in_at)}</Pill> : <Pill>No check-in</Pill>}
                </div>
                <form action={confirmCover} className="grid gap-3 border-t border-line pt-3">
                  <input type="hidden" name="assignment_id" value={a.id} />
                  <fieldset className="flex items-center gap-1">
                    <legend className="mb-1 text-xs font-semibold text-muted">How did it go? (only you see this)</legend>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <label key={n} className="cursor-pointer" htmlFor={`r-${a.id}-${n}`}>
                        <input id={`r-${a.id}-${n}`} type="radio" name="rating" value={n} className="peer sr-only" />
                        <span className="grid h-9 w-9 place-items-center rounded-full border border-line font-mono text-sm peer-checked:border-accent peer-checked:bg-accent peer-checked:text-accent-ink">{n}</span>
                      </label>
                    ))}
                  </fieldset>
                  <input name="manager_note" placeholder="Private note (optional)" className="w-full rounded-2xl border border-line bg-surface px-4 py-2.5 text-sm" />
                  <button className={buttonClass("primary", true)}>Class happened</button>
                </form>
              </Card>
            );
          })}
        </Section>
      )}

      {covered.length > 0 && (
        <Section title="Covered" aside={`${covered.length}`}>
          {covered.map((r) => {
            const a = active(r)!;
            return (
              <Card key={r.id}>
                {head(r)}
                <div className="flex items-center gap-2 text-sm">
                  <Avatar name={a.profiles?.full_name ?? "?"} />
                  <span><b>{a.profiles?.full_name}</b> is covering</span>
                </div>
              </Card>
            );
          })}
        </Section>
      )}

      {open.length + covered.length + toConfirm.length === 0 && (
        <Card tone="sunk">
          <p className="font-semibold">No covers right now</p>
          <p className="text-sm text-muted">When a teacher calls in sick, tap Post a cover. Qualified teachers see it straight away.</p>
        </Card>
      )}

      {(done.length > 0 || unfilled.length > 0) && (
        <Section title="Last two weeks">
          <Card>
            {[...done, ...unfilled].map((r) => (
              <div key={r.id} className="flex items-center justify-between gap-3 text-sm">
                <span className="min-w-0 truncate">{fmtDay(r.starts_at)} · {r.class_name}</span>
                {r.status === "open" ? <Pill tone="bad">Not covered</Pill> : <span className="text-xs text-muted">{active(r)?.profiles?.full_name}</span>}
              </div>
            ))}
          </Card>
        </Section>
      )}
    </AppShell>
  );
}
