import Link from "next/link";
import { redirect } from "next/navigation";
import { getViewer, STAGE_LABEL, type Stage } from "@/lib/session";
import { AppShell, buttonClass, Card, Icon, Pill, Section } from "@/components/ui";
import { fmtDay, fmtTime, rand, saDate, shortLocation, startsIn } from "@/lib/format";
import { teacherNav } from "./nav";
import { acceptCover, dropCover } from "./actions";

const STEPS = ["Applied", "Met", "Training checked", "Approved"];
const REACHED: Record<Stage, number> = { to_meet: 1, checking_documents: 2, locum: 4, preferred: 4, declined: 0 };
const NEXT_STEP: Record<Stage, string> = {
  to_meet: "The studio will be in touch to set up a short meeting or trial class.",
  checking_documents: "The studio is checking your training. You'll hear once you're approved.",
  locum: "You're approved. You see covers once preferred teachers have had first refusal.",
  preferred: "You're on the preferred list. You see covers first.",
  declined: "This studio isn't taking you on for cover right now.",
};

type OpenReq = { id: string; class_name: string; starts_at: string; duration_minutes: number; rate: number; notes: string | null; urgent: boolean; locations: { name: string } | null };
type Mine = {
  id: string;
  rate: number;
  checked_in_at: string | null;
  cover_requests: { class_name: string; starts_at: string; duration_minutes: number; notes: string | null; locations: { name: string } | null; cover_request_access: { access_notes: string | null } | null };
};

export default async function TeacherCovers({ searchParams }: { searchParams: Promise<{ msg?: string }> }) {
  const { supabase, user, profile, managed } = await getViewer();
  if (!user) redirect("/login");
  if (managed.length) redirect("/manage/covers");
  if (!profile) redirect("/onboarding");
  const { msg } = await searchParams;
  const nowIso = new Date().toISOString();

  const [{ data: links }, { data: openData }, { data: mineData }] = await Promise.all([
    supabase.from("studio_teachers").select("stage, studios(name)").eq("teacher_id", user.id),
    supabase.from("cover_requests").select("id, class_name, starts_at, duration_minutes, rate, notes, urgent, locations(name)").eq("status", "open").gt("starts_at", nowIso).order("starts_at"),
    supabase
      .from("cover_assignments")
      .select("id, rate, checked_in_at, cover_requests!inner(class_name, starts_at, duration_minutes, notes, locations(name), cover_request_access(access_notes))")
      .eq("teacher_id", user.id)
      .is("dropped_at", null)
      .gt("cover_requests.starts_at", new Date(Date.now() - 2 * 3600_000).toISOString()),
  ]);
  const open = (openData ?? []) as unknown as OpenReq[];
  const mine = ((mineData ?? []) as unknown as Mine[]).sort((a, b) => a.cover_requests.starts_at.localeCompare(b.cover_requests.starts_at));
  const approved = (links ?? []).some((l) => l.stage === "locum" || l.stage === "preferred");
  const today = saDate(0);
  const expired = [
    profile.first_aid_expiry && profile.first_aid_expiry < today ? "first aid" : null,
    profile.insurance_expiry && profile.insurance_expiry < today ? "insurance" : null,
  ].filter(Boolean);

  const message =
    msg === "accepted" ? "You're on. The class is in your upcoming covers below." :
    msg === "dropped" ? "Class handed back. It's been re-posted to other teachers." :
    msg ? msg : null;

  return (
    <AppShell
      eyebrow="Class Cover"
      title={`Hi ${profile.full_name.split(" ")[0]}`}
      subtitle={approved ? (open.length ? `${open.length} class${open.length > 1 ? "es" : ""} need${open.length > 1 ? "" : "s"} cover` : "No open covers right now") : "Here's where your application stands."}
      nav={teacherNav("covers", open.length)}
    >
      {message && <Card tone="sunk"><p className="text-sm">{message}</p></Card>}
      {expired.length > 0 && (
        <Card tone="urgent">
          <p className="font-semibold">Your {expired.join(" and ")} has expired</p>
          <p className="text-sm text-muted">You won&apos;t see covers until it&apos;s renewed. <Link href="/teach/profile" className="font-semibold text-accent">Update your dates</Link></p>
        </Card>
      )}

      {approved && (
        <Section title="Open covers" aside={open.length ? "First to accept gets it" : undefined}>
          {open.length === 0 && (
            <Card tone="sunk"><p className="text-sm text-muted">When a class you&apos;re trained for needs cover, it shows up here. WhatsApp alerts are coming next.</p></Card>
          )}
          {open.map((r) => (
            <Card key={r.id} tone="urgent">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-display text-lg font-semibold leading-tight">{r.class_name}</p>
                  <p className="mt-0.5 text-sm text-muted">{fmtDay(r.starts_at)} · <span className="font-mono">{fmtTime(r.starts_at)}</span> · {r.duration_minutes} min</p>
                </div>
                <span className="font-mono text-lg">{rand(r.rate)}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <Pill tone="accent"><span className="inline-flex items-center gap-1">{Icon.pin}{shortLocation(r.locations?.name ?? "")}</span></Pill>
                {r.urgent && <Pill tone="bad"><span className="inline-flex items-center gap-1">{Icon.bolt}Urgent</span></Pill>}
                {startsIn(r.starts_at) && <Pill tone="urgent"><span className="inline-flex items-center gap-1">{Icon.clock}Starts {startsIn(r.starts_at)}</span></Pill>}
              </div>
              {r.notes && <p className="rounded-2xl bg-sunk px-3 py-2 text-sm">{r.notes}</p>}
              <form action={acceptCover}>
                <input type="hidden" name="request_id" value={r.id} />
                <button className={`${buttonClass()} w-full`}>Accept cover · {rand(r.rate)}</button>
              </form>
            </Card>
          ))}
        </Section>
      )}

      {mine.length > 0 && (
        <Section title="Your upcoming covers">
          {mine.map((a) => {
            const r = a.cover_requests;
            const late = new Date(r.starts_at).getTime() - Date.now() < 24 * 3600_000;
            return (
              <Card key={a.id}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-display text-lg font-semibold leading-tight">{r.class_name}</p>
                    <p className="mt-0.5 text-sm text-muted">{fmtDay(r.starts_at)} · <span className="font-mono">{fmtTime(r.starts_at)}</span> · {shortLocation(r.locations?.name ?? "")}</p>
                  </div>
                  {a.checked_in_at ? <Pill tone="good">Checked in</Pill> : <span className="font-mono">{rand(a.rate)}</span>}
                </div>
                {r.notes && <p className="rounded-2xl bg-sunk px-3 py-2 text-sm">{r.notes}</p>}
                {r.cover_request_access?.access_notes && (
                  <div className="rounded-2xl border border-accent bg-accent-soft px-3 py-2 text-sm">
                    <p className="text-xs font-semibold text-accent">Getting in</p>
                    <p>{r.cover_request_access.access_notes}</p>
                  </div>
                )}
                <p className="text-xs text-muted">When you arrive, scan the Class Cover QR code at reception to check in.</p>
                <details className="border-t border-line pt-3">
                  <summary className="cursor-pointer text-sm font-semibold text-bad">Can&apos;t make it?</summary>
                  <div className="mt-2 grid gap-2">
                    <p className="text-xs text-muted">
                      {late ? "This is less than 24 hours away, so it counts as a late dropout. " : ""}
                      The class goes straight back out to other teachers.
                    </p>
                    <form action={dropCover}>
                      <input type="hidden" name="assignment_id" value={a.id} />
                      <button className={buttonClass("danger", true)}>Hand this class back</button>
                    </form>
                  </div>
                </details>
              </Card>
            );
          })}
        </Section>
      )}

      <Section title="Your studios">
        {(links ?? []).length === 0 && <Card tone="sunk"><p className="text-sm text-muted">You haven&apos;t applied to a studio yet.</p></Card>}
        {(links ?? []).map((l, i) => {
          const stage = l.stage as Stage;
          const studio = l.studios as unknown as { name: string } | null;
          const reached = REACHED[stage];
          return (
            <Card key={i}>
              <div className="flex items-start justify-between gap-3">
                <p className="font-display text-lg font-semibold">{studio?.name}</p>
                <Pill tone={stage === "preferred" ? "accent" : stage === "declined" ? "bad" : stage === "locum" ? "good" : "urgent"}>{STAGE_LABEL[stage]}</Pill>
              </div>
              {stage !== "declined" && reached < 4 && (
                <ol className="grid grid-cols-4 gap-1.5">
                  {STEPS.map((s, idx) => (
                    <li key={s} className="grid gap-1.5">
                      <span className={`h-1.5 rounded-full ${idx < reached ? "bg-accent" : "bg-line"}`} />
                      <span className={`text-[10px] font-semibold leading-tight ${idx < reached ? "text-ink" : "text-muted"}`}>{s}</span>
                    </li>
                  ))}
                </ol>
              )}
              <p className="text-sm text-muted">{NEXT_STEP[stage]}</p>
            </Card>
          );
        })}
      </Section>
    </AppShell>
  );
}
