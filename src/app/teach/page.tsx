import { redirect } from "next/navigation";
import { getViewer, STAGE_LABEL, type Stage } from "@/lib/session";
import { AppShell, Card, Chip, Pill, Section } from "@/components/ui";

const NEXT_STEP: Record<Stage, string> = {
  to_meet: "The studio will be in touch to set up a short meeting or trial class.",
  checking_documents: "The studio is checking your certificates. You'll hear once you're approved.",
  locum: "You're approved. You'll be pinged for covers after preferred teachers have had first refusal.",
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
    <AppShell eyebrow="Class Cover" title={`Hi ${profile.full_name.split(" ")[0]}`}>
      <Section title="Your studios">
        {(links ?? []).length === 0 && <Card><p className="text-sm text-muted">You haven&apos;t applied to a studio yet.</p></Card>}
        {(links ?? []).map((l, i) => {
          const stage = l.stage as Stage;
          const studio = l.studios as unknown as { name: string } | null;
          return (
            <Card key={i}>
              <div className="flex items-start justify-between gap-3">
                <p className="font-display text-lg font-semibold">{studio?.name}</p>
                <Pill tone={stage === "preferred" ? "accent" : stage === "declined" ? "bad" : stage === "locum" ? "good" : "urgent"}>
                  {STAGE_LABEL[stage]}
                </Pill>
              </div>
              <p className="text-sm text-muted">{NEXT_STEP[stage]}</p>
            </Card>
          );
        })}
      </Section>

      <Section title="Your training">
        <Card>
          <div className="flex flex-wrap gap-2">
            {(trainings ?? []).map((t, i) => {
              const name = (t.trainings as unknown as { name: string } | null)?.name;
              return <Chip key={i}>{name}{t.verified_at ? " · verified" : " · being checked"}</Chip>;
            })}
          </div>
          {profile.first_aid_expiry && <p className="text-xs text-muted">First aid valid to {new Date(profile.first_aid_expiry).toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" })}</p>}
        </Card>
      </Section>

      <Section title="Open covers">
        <Card tone="sunk">
          <p className="text-sm text-muted">Cover requests will show here, and you&apos;ll get a WhatsApp when a class you&apos;re trained for needs someone.</p>
        </Card>
      </Section>
    </AppShell>
  );
}
