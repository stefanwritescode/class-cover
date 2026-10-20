import Link from "next/link";
import { redirect } from "next/navigation";
import { getViewer } from "@/lib/session";
import { AppShell, buttonClass, Card, Field, inputClass, Section } from "@/components/ui";
import { shortLocation } from "@/lib/format";
import { teacherNav } from "../nav";
import { saveDetails, savePreferences } from "../actions";

const DAYS: [number, string][] = [[1, "Mon"], [2, "Tue"], [3, "Wed"], [4, "Thu"], [5, "Fri"], [6, "Sat"], [0, "Sun"]];
const PARTS: [string, string, string][] = [["morning", "Mornings", "before 12:00"], ["midday", "Midday", "12:00 to 16:00"], ["evening", "Evenings", "after 16:00"]];

function Toggle({ name, value, label, sub, checked }: { name: string; value: string | number; label: string; sub?: string; checked: boolean }) {
  const id = `${name}-${value}`;
  return (
    <label htmlFor={id} className="cursor-pointer">
      <input id={id} type="checkbox" name={name} value={value} defaultChecked={checked} className="peer sr-only" />
      <span className="grid rounded-2xl border border-line bg-surface px-3 py-2 text-center peer-checked:border-accent peer-checked:bg-accent-soft peer-checked:text-accent peer-focus-visible:ring-2 peer-focus-visible:ring-accent">
        <span className="text-sm font-semibold">{label}</span>
        {sub && <span className="text-[10px] text-muted">{sub}</span>}
      </span>
    </label>
  );
}

export default async function ProfilePage({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const { supabase, user, profile } = await getViewer();
  if (!user) redirect("/login");
  if (!profile) redirect("/onboarding");
  const { saved } = await searchParams;
  const [{ data: prefs }, { data: contact }, { data: priv }, { data: locations }] = await Promise.all([
    supabase.from("teacher_preferences").select("*").eq("profile_id", user.id).maybeSingle(),
    supabase.from("profile_contacts").select("phone, whatsapp_opt_in").eq("profile_id", user.id).maybeSingle(),
    supabase.from("profile_private").select("bank_name, bank_account_number, bank_branch_code").eq("profile_id", user.id).maybeSingle(),
    supabase.from("locations").select("id, name").order("name"),
  ]);

  return (
    <AppShell eyebrow="Class Cover" title="Profile" subtitle={profile.full_name} nav={teacherNav("profile")}>
      {saved && <Card tone="sunk"><p className="text-sm"><b>Saved.</b></p></Card>}
      <Link href="/account/password" className="flex items-center justify-between rounded-3xl border border-line bg-surface p-4">
        <span><span className="block font-semibold">Password</span><span className="block text-xs text-muted">Set one to sign in without waiting for an email</span></span>
        <span className="text-accent">→</span>
      </Link>

      <Section title="When can you cover?" aside="Leave all off for any">
        <form action={savePreferences} className="grid gap-4">
          <Card>
            {(locations ?? []).length > 0 ? (
              <div className="grid gap-2">
                <p className="text-xs font-semibold text-muted">Studios</p>
                <div className="grid grid-cols-2 gap-2">
                  {locations!.map((l) => <Toggle key={l.id} name="location_ids" value={l.id} label={shortLocation(l.name)} checked={!!prefs?.location_ids.length && prefs.location_ids.includes(l.id)} />)}
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted">You can choose studios once a studio approves you.</p>
            )}
            <div className="grid gap-2">
              <p className="text-xs font-semibold text-muted">Days</p>
              <div className="grid grid-cols-7 gap-1">
                {DAYS.map(([v, l]) => <Toggle key={v} name="weekdays" value={v} label={l} checked={!!prefs?.weekdays.length && prefs.weekdays.includes(v)} />)}
              </div>
            </div>
            <div className="grid gap-2">
              <p className="text-xs font-semibold text-muted">Times</p>
              <div className="grid grid-cols-3 gap-2">
                {PARTS.map(([v, l, s]) => <Toggle key={v} name="dayparts" value={v} label={l} sub={s} checked={!!prefs?.dayparts.length && prefs.dayparts.includes(v)} />)}
              </div>
            </div>
            <p className="text-xs text-muted">
              We&apos;ll only send you alerts for covers that match. You can still see every cover you qualify for in the app.
              {prefs && !prefs.location_ids.length && !prefs.weekdays.length && !prefs.dayparts.length ? " Right now you get alerts for everything." : ""}
            </p>
          </Card>
          <button className={buttonClass()}>Save availability</button>
        </form>
      </Section>

      <Section title="Your details">
        <form action={saveDetails} className="grid gap-4">
          <Card>
            <Field label="Mobile number" htmlFor="phone">
              <input id="phone" name="phone" type="tel" defaultValue={contact?.phone ?? ""} className={inputClass} />
            </Field>
            <label className="flex items-center gap-3 text-sm" htmlFor="whatsapp">
              <input id="whatsapp" name="whatsapp" type="checkbox" defaultChecked={contact?.whatsapp_opt_in ?? true} className="accent-[var(--accent)]" />
              Send me cover alerts on WhatsApp
            </label>
            <Field label="Area you live in" htmlFor="area">
              <input id="area" name="area" defaultValue={profile.area ?? ""} className={inputClass} />
            </Field>
          </Card>
          <Card>
            <p className="font-semibold">Documents</p>
            <p className="-mt-2 text-xs text-muted">If either has expired, you won&apos;t be offered covers until it&apos;s renewed.</p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="First aid valid to" htmlFor="first_aid_expiry">
                <input id="first_aid_expiry" name="first_aid_expiry" type="date" defaultValue={profile.first_aid_expiry ?? ""} className={inputClass} />
              </Field>
              <Field label="Insurance valid to" htmlFor="insurance_expiry">
                <input id="insurance_expiry" name="insurance_expiry" type="date" defaultValue={profile.insurance_expiry ?? ""} className={inputClass} />
              </Field>
            </div>
          </Card>
          <Card>
            <p className="font-semibold">Payment details</p>
            <p className="-mt-2 text-xs text-muted">Only studios that approve you can see these, to pay you for covers.</p>
            <Field label="Bank" htmlFor="bank_name">
              <input id="bank_name" name="bank_name" defaultValue={priv?.bank_name ?? ""} placeholder="e.g. FNB" className={inputClass} />
            </Field>
            <div className="grid grid-cols-[1fr_8rem] gap-3">
              <Field label="Account number" htmlFor="bank_account_number">
                <input id="bank_account_number" name="bank_account_number" inputMode="numeric" defaultValue={priv?.bank_account_number ?? ""} className={`${inputClass} font-mono`} />
              </Field>
              <Field label="Branch code" htmlFor="bank_branch_code">
                <input id="bank_branch_code" name="bank_branch_code" inputMode="numeric" defaultValue={priv?.bank_branch_code ?? ""} className={`${inputClass} font-mono`} />
              </Field>
            </div>
          </Card>
          <Card>
            <p className="font-semibold">Who can see my profile</p>
            <label className="flex items-start gap-3 text-sm" htmlFor="v-mine">
              <input id="v-mine" type="radio" name="visibility" value="studios_i_work_with" defaultChecked={profile.visibility === "studios_i_work_with"} className="mt-1 accent-[var(--accent)]" />
              <span><b>Only studios I work with</b></span>
            </label>
            <label className="flex items-start gap-3 text-sm" htmlFor="v-verified">
              <input id="v-verified" type="radio" name="visibility" value="verified_studios" defaultChecked={profile.visibility === "verified_studios"} className="mt-1 accent-[var(--accent)]" />
              <span><b>Verified studios on Class Cover</b><br /><span className="text-muted">Name, area and training only. Contact details are shared only if you accept a studio&apos;s request.</span></span>
            </label>
          </Card>
          <button className={buttonClass()}>Save details</button>
        </form>
      </Section>
    </AppShell>
  );
}
