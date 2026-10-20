import { redirect } from "next/navigation";
import { getViewer, STAGE_LABEL, type Stage } from "@/lib/session";
import { AppShell, Card, Icon, Pill, Section } from "@/components/ui";

const STEPS: { key: string; label: string }[] = [
  { key: "applied", label: "Applied" },
  { key: "met", label: "Met" },
  { key: "checked", label: "Training checked" },
  { key: "approved", label: "Approved" },
];
const REACHED: Record<Stage, number> = { to_meet: 1, checking_documents: 2, locum: 4, preferred: 4, declined: 0 };

const NEXT_STEP: Record<Stage, string> = {
  to_meet: "The studio will be in touch to set up a short meeting or trial class.",
  checking_documents: "The studio is checking your training. You'll hear once you're approved.",
  locum: "You're approved. You'll be pinged for covers once preferred teachers have had first refusal.",
  preferred: "You're on the preferred list. You'll be pinged first when a class needs cover.",
  declined: "This studio isn't taking you on for cover right now.",
};

export default async function TeacherHome() {
  const { supabase, user, profile, managed } = await getViewer();
  if (!user) redirect("/login");
  if (managed.length) redirect("/manage/teachers");
  if (!profile) redirect("/onboarding");

  const [{ data: links }, { data: trainings }] = await Promise.all([
    supabase.from("studio_teachers").select("stage, studios(name)").eq("teacher_id", user.id),
    supabase.from("profile_trainings").select("verified_at, trainings(name)").eq("profile_id", user.id),
  ]);

  return (
    <AppShell
      eyebrow="Class Cover"
      title={`Hi ${profile.full_name.split(" ")[0]}`}
      subtitle="Here's where your cover applications stand."
    >
      <Section title="Your studios">
        {(links ?? []).length === 0 && <Card tone="sunk"><p className="text-sm text-muted">You haven&apos;t applied to a studio yet.</p></Card>}
        {(links ?? []).map((l, i) => {
          const stage = l.stage as Stage;
          const studio = l.studios as unknown as { name: string } | null;
          const reached = REACHED[stage];
          return (
            <Card key={i}>
              <div className="flex items-start justify-between gap-3">
                <p className="font-display text-xl font-semibold">{studio?.name}</p>
                <Pill tone={stage === "preferred" ? "accent" : stage === "declined" ? "bad" : stage === "locum" ? "good" : "urgent"}>{STAGE_LABEL[stage]}</Pill>
              </div>
              {stage !== "declined" && (
                <ol className="grid grid-cols-4 gap-1.5">
                  {STEPS.map((s, idx) => (
                    <li key={s.key} className="grid gap-1.5">
                      <span className={`h-1.5 rounded-full ${idx < reached ? "bg-accent" : "bg-line"}`} />
                      <span className={`text-[10px] font-semibold leading-tight ${idx < reached ? "text-ink" : "text-muted"}`}>{s.label}</span>
                    </li>
                  ))}
                </ol>
              )}
              <p className="text-sm text-muted">{NEXT_STEP[stage]}</p>
            </Card>
          );
        })}
      </Section>

      <Section title="Your training">
        <Card>
          {(trainings ?? []).map((t, i) => {
            const name = (t.trainings as unknown as { name: string } | null)?.name;
            return (
              <div key={i} className="flex items-center justify-between gap-2 text-sm">
                <span className="flex items-center gap-2">
                  <span className={`grid h-5 w-5 place-items-center rounded-full ${t.verified_at ? "bg-good text-surface" : "border border-line"}`}>{t.verified_at && Icon.check}</span>
                  {name}
                </span>
                <span className="text-xs text-muted">{t.verified_at ? "Verified" : "Being checked"}</span>
              </div>
            );
          })}
          {profile.first_aid_expiry && (
            <p className="border-t border-line pt-3 text-xs text-muted">
              First aid valid to {new Date(profile.first_aid_expiry).toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          )}
        </Card>
      </Section>

      <Section title="Open covers">
        <Card tone="sunk">
          <p className="text-sm text-muted">When a class you&apos;re trained for needs cover, it shows up here and you get a WhatsApp. First to accept gets it.</p>
        </Card>
      </Section>
    </AppShell>
  );
}
