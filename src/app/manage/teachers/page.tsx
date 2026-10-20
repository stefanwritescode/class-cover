import { requireManager, STAGE_LABEL, type Stage } from "@/lib/session";
import { AppShell, Avatar, buttonClass, Card, Pill, Section } from "@/components/ui";
import { managerNav } from "../nav";
import { setStage, setTrainingVerified } from "../actions";

type Training = { training_id: string; certificate_path: string | null; verified_at: string | null; trainings: { name: string } | null };
type Teacher = {
  teacher_id: string;
  stage: Stage;
  created_at: string;
  profiles: {
    full_name: string;
    area: string | null;
    years_teaching: number | null;
    first_aid_expiry: string | null;
    profile_contacts: { phone: string | null } | null;
    profile_trainings: Training[];
  } | null;
};

const ORDER: { stage: Stage; title: string }[] = [
  { stage: "to_meet", title: "Meet first" },
  { stage: "checking_documents", title: "Checking documents" },
  { stage: "preferred", title: "Preferred cover" },
  { stage: "locum", title: "Vetted locums" },
  { stage: "declined", title: "Not a fit" },
];

function StageButton({ teacherId, stage, label, variant = "ghost", disabled }: { teacherId: string; stage: Stage; label: string; variant?: "primary" | "ghost" | "danger"; disabled?: boolean }) {
  return (
    <form action={setStage}>
      <input type="hidden" name="teacher_id" value={teacherId} />
      <input type="hidden" name="stage" value={stage} />
      <button className={buttonClass(variant, true)} disabled={disabled}>{label}</button>
    </form>
  );
}

export default async function TeachersPage() {
  const { supabase, studio } = await requireManager();
  const { data } = await supabase
    .from("studio_teachers")
    .select(
      "teacher_id, stage, created_at, profiles(full_name, area, years_teaching, first_aid_expiry, profile_contacts(phone), profile_trainings(training_id, certificate_path, verified_at, trainings(name)))",
    )
    .eq("studio_id", studio.id)
    .order("created_at", { ascending: false });
  const teachers = (data ?? []) as unknown as Teacher[];

  // Short-lived links so managers can open certificates from the private bucket.
  const paths = teachers.flatMap((t) => t.profiles?.profile_trainings.map((pt) => pt.certificate_path) ?? []).filter((p): p is string => !!p);
  const urls = new Map<string, string>();
  if (paths.length) {
    const { data: signed } = await supabase.storage.from("certificates").createSignedUrls(paths, 3600);
    signed?.forEach((s) => s.path && s.signedUrl && urls.set(s.path, s.signedUrl));
  }

  return (
    <AppShell eyebrow={studio.name} title="Your teachers" nav={managerNav("teachers")}>
      {teachers.length === 0 && (
        <Card tone="sunk">
          <p className="text-sm text-muted">No teachers yet. Share the sign-up link with your cover teachers and they&apos;ll appear here to vet.</p>
        </Card>
      )}
      {ORDER.map(({ stage, title }) => {
        const list = teachers.filter((t) => t.stage === stage);
        if (!list.length) return null;
        return (
          <Section key={stage} title={`${title} · ${list.length}`}>
            {list.map((t) => {
              const p = t.profiles;
              if (!p) return null;
              const anyVerified = p.profile_trainings.some((pt) => pt.verified_at);
              return (
                <Card key={t.teacher_id}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={p.full_name} />
                      <div>
                        <p className="font-semibold">{p.full_name}</p>
                        <p className="text-xs text-muted">
                          {[p.area, p.years_teaching != null ? `${p.years_teaching} yrs teaching` : null, p.profile_contacts?.phone].filter(Boolean).join(" · ")}
                        </p>
                      </div>
                    </div>
                    <Pill tone={stage === "preferred" ? "accent" : stage === "locum" ? "good" : stage === "declined" ? "bad" : "urgent"}>{STAGE_LABEL[stage]}</Pill>
                  </div>

                  <div className="grid gap-2">
                    {p.profile_trainings.map((pt) => (
                      <div key={pt.training_id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-sunk px-3 py-2 text-sm">
                        <span>
                          {pt.trainings?.name}{" "}
                          {pt.verified_at ? <Pill tone="good">Verified</Pill> : <Pill>Not checked</Pill>}
                        </span>
                        <span className="flex items-center gap-3">
                          {pt.certificate_path && urls.get(pt.certificate_path) && (
                            <a href={urls.get(pt.certificate_path)} target="_blank" rel="noreferrer" className="text-xs font-semibold text-accent">View certificate</a>
                          )}
                          {stage !== "declined" && (
                            <form action={setTrainingVerified}>
                              <input type="hidden" name="teacher_id" value={t.teacher_id} />
                              <input type="hidden" name="training_id" value={pt.training_id} />
                              <input type="hidden" name="verify" value={pt.verified_at ? "0" : "1"} />
                              <button className="text-xs font-semibold text-muted underline">{pt.verified_at ? "Undo" : "Mark verified"}</button>
                            </form>
                          )}
                        </span>
                      </div>
                    ))}
                    {p.first_aid_expiry && (
                      <p className="text-xs text-muted">First aid valid to {new Date(p.first_aid_expiry).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })}</p>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {stage === "to_meet" && <StageButton teacherId={t.teacher_id} stage="checking_documents" label="Mark as met" variant="primary" />}
                    {stage === "checking_documents" && (
                      <StageButton teacherId={t.teacher_id} stage="locum" label="Approve as locum" variant="primary" disabled={!anyVerified} />
                    )}
                    {stage === "locum" && <StageButton teacherId={t.teacher_id} stage="preferred" label="Make preferred" />}
                    {stage === "preferred" && <StageButton teacherId={t.teacher_id} stage="locum" label="Move to locum" />}
                    {stage === "declined" && <StageButton teacherId={t.teacher_id} stage="checking_documents" label="Reconsider" />}
                    {(stage === "to_meet" || stage === "checking_documents") && <StageButton teacherId={t.teacher_id} stage="declined" label="Not a fit" variant="danger" />}
                  </div>
                  {stage === "checking_documents" && !anyVerified && <p className="text-xs text-muted">Check their training (certificate, or with the provider) and mark it verified to approve.</p>}
                </Card>
              );
            })}
          </Section>
        );
      })}
    </AppShell>
  );
}
