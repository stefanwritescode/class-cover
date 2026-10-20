import { requireManager } from "@/lib/session";
import { AppShell, buttonClass, Card, Field, inputClass } from "@/components/ui";
import { managerNav } from "../nav";
import { saveSettings } from "../actions";

export default async function SettingsPage() {
  const { supabase, studio } = await requireManager();
  const { data: s } = await supabase.from("studios").select("*").eq("id", studio.id).single();

  return (
    <AppShell eyebrow={studio.name} title="Settings" nav={managerNav("settings")}>
      <form action={saveSettings} className="grid gap-4">
        <Card>
          <label className="flex items-start gap-3 text-sm" htmlFor="meet_first">
            <input id="meet_first" name="meet_first" type="checkbox" defaultChecked={s?.meet_first} className="mt-1 accent-[var(--accent)]" />
            <span><b>Meet new instructors before approving them</b><br /><span className="text-muted">A coffee, video call or trial class. Turn off to approve on documents alone.</span></span>
          </label>
        </Card>
        <Card>
          <Field label="Default cover rate (R)" htmlFor="default_rate" hint="Pre-filled on each request. Managers can change it per class.">
            <input id="default_rate" name="default_rate" type="number" min={0} step={5} defaultValue={s?.default_rate} className={`${inputClass} font-mono`} />
          </Field>
          <Field label="Minutes before locums are pinged" htmlFor="wave_delay_minutes" hint="Preferred teachers get this long to accept first.">
            <input id="wave_delay_minutes" name="wave_delay_minutes" type="number" min={0} max={240} defaultValue={s?.wave_delay_minutes} className={`${inputClass} font-mono`} />
          </Field>
          <Field label="Late dropouts per quarter before preferred moves to locum" htmlFor="dropout_limit" hint="Late means under 24 hours before class.">
            <input id="dropout_limit" name="dropout_limit" type="number" min={1} max={20} defaultValue={s?.dropout_limit} className={`${inputClass} font-mono`} />
          </Field>
        </Card>
        <button className={buttonClass()}>Save settings</button>
      </form>
    </AppShell>
  );
}
