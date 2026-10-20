"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { buttonClass, Card, Field, inputClass } from "@/components/ui";

type Option = { id: string; name: string };

export default function SignupForm({
  userId,
  email,
  trainings,
  studios,
}: {
  userId: string;
  email: string;
  trainings: Option[];
  studios: Option[];
}) {
  const router = useRouter();
  const [picked, setPicked] = useState<string[]>([]);
  const [studioId, setStudioId] = useState(studios[0]?.id ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function toggleTraining(id: string) {
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const f = new FormData(e.currentTarget);
    if (!picked.length) return setError("Choose at least one teacher training.");
    if (!f.get("consent")) return setError("Please agree to how we use your details.");

    setBusy(true);
    const supabase = createClient();
    try {
      const { error: pErr } = await supabase.from("profiles").insert({
        id: userId,
        full_name: String(f.get("full_name")).trim(),
        area: String(f.get("area") || "").trim() || null,
        years_teaching: f.get("years") ? Number(f.get("years")) : null,
        first_aid_expiry: f.get("first_aid") || null,
        visibility: f.get("visibility"),
        open_to: f.getAll("open_to").map(String),
        popia_consent_at: new Date().toISOString(),
      });
      if (pErr) throw pErr;

      const { error: cErr } = await supabase.from("profile_contacts").insert({
        profile_id: userId,
        phone: String(f.get("phone")).trim(),
        whatsapp_opt_in: !!f.get("whatsapp"),
      });
      if (cErr) throw cErr;

      const { error: tErr } = await supabase
        .from("profile_trainings")
        .insert(picked.map((trainingId) => ({ profile_id: userId, training_id: trainingId })));
      if (tErr) throw tErr;

      if (studioId) {
        const { error: jErr } = await supabase.rpc("request_to_join", { p_studio: studioId });
        if (jErr) throw jErr;
      }
      router.replace("/teach");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-5">
      <Field label="Full name" htmlFor="full_name">
        <input id="full_name" name="full_name" required className={inputClass} autoComplete="name" />
      </Field>
      <Field label="Mobile number" htmlFor="phone" hint="We'll send cover alerts to this number on WhatsApp.">
        <input id="phone" name="phone" required type="tel" inputMode="tel" placeholder="082 123 4567" className={inputClass} autoComplete="tel" />
      </Field>
      <label className="flex items-start gap-3 text-sm" htmlFor="whatsapp">
        <input id="whatsapp" name="whatsapp" type="checkbox" defaultChecked className="mt-1 accent-[var(--accent)]" />
        <span>Send me cover alerts on WhatsApp</span>
      </label>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Area you live in" htmlFor="area">
          <input id="area" name="area" placeholder="e.g. Umhlanga" className={inputClass} />
        </Field>
        <Field label="Years teaching" htmlFor="years">
          <input id="years" name="years" type="number" min={0} max={60} className={inputClass} />
        </Field>
      </div>

      <Card tone="sunk">
        <p className="text-sm font-semibold">Teacher training</p>
        <p className="-mt-2 text-xs text-muted">Tick each training you completed. The studio checks it with you before approving you.</p>
        {trainings.map((t) => (
          <div key={t.id} className="grid gap-2">
            <label className="flex items-center gap-3 text-sm" htmlFor={`t-${t.id}`}>
              <input id={`t-${t.id}`} type="checkbox" checked={picked.includes(t.id)} onChange={() => toggleTraining(t.id)} className="accent-[var(--accent)]" />
              {t.name}
            </label>
          </div>
        ))}
      </Card>

      <Field label="First aid certificate valid until" htmlFor="first_aid">
        <input id="first_aid" name="first_aid" type="date" className={inputClass} />
      </Field>

      {studios.length > 0 && (
        <Field label="Apply to cover for" htmlFor="studio">
          <select id="studio" className={inputClass} value={studioId} onChange={(e) => setStudioId(e.target.value)}>
            {studios.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </Field>
      )}

      <div className="grid gap-2">
        <p className="text-xs font-semibold text-muted">Open to</p>
        <div className="flex flex-wrap gap-4 text-sm">
          {[["cover", "Cover"], ["locum", "Locum work"], ["permanent", "Permanent roles"]].map(([v, l]) => (
            <label key={v} className="flex items-center gap-2" htmlFor={`o-${v}`}>
              <input id={`o-${v}`} type="checkbox" name="open_to" value={v} defaultChecked={v !== "permanent"} className="accent-[var(--accent)]" />
              {l}
            </label>
          ))}
        </div>
      </div>

      <Card tone="sunk">
        <p className="text-sm font-semibold">Who can see my profile</p>
        <label className="flex items-start gap-3 text-sm" htmlFor="v-mine">
          <input id="v-mine" type="radio" name="visibility" value="studios_i_work_with" className="mt-1 accent-[var(--accent)]" />
          <span><b>Only studios I work with</b><br /><span className="text-muted">Other studios can&apos;t find you.</span></span>
        </label>
        <label className="flex items-start gap-3 text-sm" htmlFor="v-verified">
          <input id="v-verified" type="radio" name="visibility" value="verified_studios" defaultChecked className="mt-1 accent-[var(--accent)]" />
          <span>
            <b>Verified studios on Class Cover</b><br />
            <span className="text-muted">They see your name, area and training. Never your phone, email, ID or bank details. Contact details are shared only if you accept a studio&apos;s request.</span>
          </span>
        </label>
      </Card>

      <label className="flex items-start gap-3 text-sm" htmlFor="consent">
        <input id="consent" name="consent" type="checkbox" className="mt-1 accent-[var(--accent)]" />
        <span className="text-muted">
          I agree that Class Cover stores my details to vet me and offer me cover, and shares them only as described above.
          I can update or delete my details at any time. (Signed in as {email}.)
        </span>
      </label>

      {error && <p className="text-sm text-bad">{error}</p>}
      <button className={buttonClass()} disabled={busy}>{busy ? "Saving…" : "Create my profile"}</button>
    </form>
  );
}
