import { requireManager, STAGE_LABEL, type Stage } from "@/lib/session";
import { AppShell, Avatar, buttonClass, Card, ErrorNote, Icon, Pill, Section } from "@/components/ui";
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

const ORDER: { stage: Stage; title: string; empty?: string }[] = [
  { stage: "to_meet", title: "Meet first" },
  { stage: "checking_documents", title: "Checking training" },
  { stage: "preferred", title: "Preferred cover" },
  { stage: "locum", title: "Vetted locums" },
  { stage: "declined", title: "Not a fit" },
];
const PIPELINE: { stage: Stage; short: string }[] = [
  { stage: "to_meet", short: "To meet" },
  { stage: "checking_documents", short: "Checking" },
  { stage: "locum", short: "Locum" },
  { stage: "preferred", short: "Preferred" },
];
const TONE: Record<Stage, "urgent" | "accent" | "good" | "bad"> = {
  to_meet: "urgent",
  checking_documents: "urgent",
  locum: "good",
  preferred: "accent",
  declined: "bad",
};

function StageButton({ teacherId, stage, label, variant = "ghost", disabled }: { teacherId: string; stage: Stage; label: string; variant?: "primary" | "ghost" | "danger"; disabled?: boolean }) {
  return (
    <form action={setStage}>
      <input type="hidden" name="teacher_id" value={teacherId} />
      <input type="hidden" name="stage" value={stage} />
      <button className={buttonClass(variant, true)} disabled={disabled}>{label}</button>
    </form>
  );
}

const shortDate = (d: string) => new Date(d).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });

export default async function TeachersPage() {
  const { supabase, studio } = await requireManager();
  // profile_trainings links to profiles twice (teacher and verifier), so name the teacher link.
  const { data, error } = await supabase
    .from("studio_teachers")
    .select(
      "teacher_id, stage, created_at, profiles(full_name, area, years_teaching, first_aid_expiry, profile_contacts(phone), profile_trainings!profile_trainings_profile_id_fkey(training_id, certificate_path, verified_at, trainings(name)))",
    )
    .eq("studio_id", studio.id)
    .order("created_at", { ascending: false });
  const teachers = (data ?? []) as unknown as Teacher[];
  const count = (s: Stage) => teachers.filter((t) => t.stage === s).length;
  const toVet = count("to_meet") + count("checking_documents");

  const paths = teachers.flatMap((t) => t.profiles?.profile_trainings.map((pt) => pt.certificate_path) ?? []).filter((p): p is string => !!p);
  const urls = new Map<string, string>();
  if (paths.length) {
    const { data: signed } = await supabase.storage.from("certificates").createSignedUrls(paths, 3600);
    signed?.forEach((s) => s.path && s.signedUrl && urls.set(s.path, s.signedUrl));
  }

  const pipeline = (
    <div className="grid grid-cols-4 gap-1.5">
      {PIPELINE.map((p) => (
        <div key={p.stage} className="rounded-2xl bg-accent-ink/10 px-2 py-2 text-center">
          <div className="font-display text-2xl font-bold leading-none">{count(p.stage)}</div>
          <div className="mt-1 text-[10px] font-semibold uppercase tracking-wide opacity-80">{p.short}</div>
        </div>
      ))}
    </div>
  );

  return (
    <AppShell
      eyebrow={studio.name}
      title="Your teachers"
      subtitle={toVet ? `${toVet} waiting for you to vet` : "Everyone's been vetted"}
      headerExtra={pipeline}
      nav={managerNav("teachers", { toVet })}
    >
      {error && <ErrorNote message={error.message} />}
      {!error && teachers.length === 0 && (
        <Card tone="sunk">
          <p className="font-semibold">No teachers yet</p>
          <p className="text-sm text-muted">Share the sign-up link with your cover teachers. They&apos;ll appear here to vet.</p>
        </Card>
      )}
      {ORDER.map(({ stage, title }) => {
        const list = teachers.filter((t) => t.stage === stage);
        if (!list.length) return null;
        return (
          <Section key={stage} title={title} aside={`${list.length}`}>
            {list.map((t) => {
              const p = t.profiles;
              if (!p) return null;
              const anyVerified = p.profile_trainings.some((pt) => pt.verified_at);
              const firstAidExpired = p.first_aid_expiry && new Date(p.first_aid_expiry) < new Date();
              return (
                <Card key={t.teacher_id}>
                  <div className="flex items-start gap-3">
                    <Avatar name={p.full_name} size="lg" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-display text-lg font-semibold leading-tight">{p.full_name}</p>
                        <Pill tone={TONE[stage]}>{STAGE_LABEL[stage]}</Pill>
                      </div>
                      <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted">
                        {p.area && <span className="inline-flex items-center gap-1">{Icon.pin}{p.area}</span>}
                        {p.profile_contacts?.phone && <span className="inline-flex items-center gap-1 font-mono">{Icon.phone}{p.profile_contacts.phone}</span>}
                        {p.years_teaching != null && <span>{p.years_teaching} yrs teaching</span>}
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-1.5">
                    {p.profile_trainings.map((pt) => (
                      <div key={pt.training_id} className="flex items-center justify-between gap-2 rounded-2xl bg-sunk px-3 py-2.5 text-sm">
                        <span className="flex items-center gap-2">
                          <span className={`grid h-5 w-5 place-items-center rounded-full ${pt.verified_at ? "bg-good text-surface" : "border border-line"}`}>
                            {pt.verified_at && Icon.check}
                          </span>
                          {pt.trainings?.name}
                        </span>
                        <span className="flex items-center gap-3">
                          {pt.certificate_path && urls.get(pt.certificate_path) && (
                            <a href={urls.get(pt.certificate_path)} target="_blank" rel="noreferrer" className="text-xs font-semibold text-accent">Certificate</a>
                          )}
                          {stage !== "declined" && (
                            <form action={setTrainingVerified}>
                              <input type="hidden" name="teacher_id" value={t.teacher_id} />
                              <input type="hidden" name="training_id" value={pt.training_id} />
                              <input type="hidden" name="verify" value={pt.verified_at ? "0" : "1"} />
                              <button className={`text-xs font-semibold ${pt.verified_at ? "text-muted" : "text-accent"}`}>{pt.verified_at ? "Undo" : "Verify"}</button>
                            </form>
                          )}
                        </span>
                      </div>
                    ))}
                    {p.first_aid_expiry && (
                      <p className={`px-1 text-xs ${firstAidExpired ? "font-semibold text-bad" : "text-muted"}`}>
                        First aid {firstAidExpired ? "expired" : "valid to"} {shortDate(p.first_aid_expiry)}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 border-t border-line pt-3">
                    {stage === "to_meet" && <StageButton teacherId={t.teacher_id} stage="checking_documents" label="Mark as met" variant="primary" />}
                    {stage === "checking_documents" && <StageButton teacherId={t.teacher_id} stage="locum" label="Approve as locum" variant="primary" disabled={!anyVerified} />}
                    {stage === "locum" && <StageButton teacherId={t.teacher_id} stage="preferred" label="Make preferred" variant="primary" />}
                    {stage === "preferred" && <StageButton teacherId={t.teacher_id} stage="locum" label="Move to locum" />}
                    {stage === "declined" && <StageButton teacherId={t.teacher_id} stage="checking_documents" label="Reconsider" />}
                    {(stage === "to_meet" || stage === "checking_documents") && <StageButton teacherId={t.teacher_id} stage="declined" label="Not a fit" variant="danger" />}
                    <span className="ml-auto text-[11px] text-muted">Applied {shortDate(t.created_at)}</span>
                  </div>
                  {stage === "checking_documents" && !anyVerified && (
                    <p className="-mt-1 text-xs text-muted">Verify at least one training to approve.</p>
                  )}
                </Card>
              );
            })}
          </Section>
        );
      })}
    </AppShell>
  );
}
