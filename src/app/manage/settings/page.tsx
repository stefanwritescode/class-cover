import Link from "next/link";
import { requireManager } from "@/lib/session";
import { AppShell, buttonClass, Card, inputClass } from "@/components/ui";
import { managerNav } from "../nav";
import { saveSettings } from "../actions";

function NumberRow({ id, label, hint, unit, value, min, max, step = 1 }: { id: string; label: string; hint: string; unit: string; value?: number; min: number; max: number; step?: number }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <label htmlFor={id} className="min-w-0">
        <span className="block font-semibold">{label}</span>
        <span className="block text-xs text-muted">{hint}</span>
      </label>
      <div className="flex flex-none items-center gap-1.5">
        {unit === "R" && <span className="font-mono text-muted">R</span>}
        <input id={id} name={id} type="number" min={min} max={max} step={step} defaultValue={value} className={`${inputClass} w-20 px-3 py-2 text-right font-mono`} />
        {unit !== "R" && <span className="text-xs text-muted">{unit}</span>}
      </div>
    </div>
  );
}

export default async function SettingsPage() {
  const { supabase, studio } = await requireManager();
  const { data: s } = await supabase.from("studios").select("*").eq("id", studio.id).single();

  return (
    <AppShell eyebrow={studio.name} title="Settings" subtitle="How cover works at your studio" nav={managerNav("settings")}>
      <form action={saveSettings} className="grid gap-4">
        <Card>
          <p className="font-display text-lg font-semibold">Vetting</p>
          <label className="flex items-start justify-between gap-4" htmlFor="meet_first">
            <span>
              <span className="block font-semibold">Meet new instructors first</span>
              <span className="block text-xs text-muted">A coffee, video call or trial class before approving. Turn off to approve on training alone.</span>
            </span>
            <input id="meet_first" name="meet_first" type="checkbox" defaultChecked={s?.meet_first} className="mt-1 h-5 w-5 flex-none accent-[var(--accent)]" />
          </label>
        </Card>
        <Card>
          <p className="font-display text-lg font-semibold">Covers</p>
          <NumberRow id="default_rate" label="Default rate" hint="Pre-filled on each request, editable per class." unit="R" value={s?.default_rate} min={0} max={10000} step={5} />
          <div className="border-t border-line" />
          <NumberRow id="wave_delay_minutes" label="Preferred head start" hint="Minutes before vetted locums are pinged." unit="min" value={s?.wave_delay_minutes} min={0} max={240} />
          <div className="border-t border-line" />
          <NumberRow id="dropout_limit" label="Dropout limit" hint="Late dropouts a quarter before preferred moves to locum." unit="per qtr" value={s?.dropout_limit} min={1} max={20} />
        </Card>
        <button className={buttonClass()}>Save settings</button>
      </form>
      <div className="grid grid-cols-2 gap-3">
        <Link href="/manage/timetable" className="grid gap-1 rounded-3xl border border-line bg-surface p-4">
          <span className="font-semibold">Timetable</span>
          <span className="text-xs text-muted">Classes imported from Octiv</span>
        </Link>
        <Link href="/manage/settings/posters" className="grid gap-1 rounded-3xl border border-line bg-surface p-4">
          <span className="font-semibold">Check-in posters</span>
          <span className="text-xs text-muted">QR codes for each reception</span>
        </Link>
        <Link href="/account/password" className="col-span-2 grid gap-1 rounded-3xl border border-line bg-surface p-4">
          <span className="font-semibold">Password</span>
          <span className="text-xs text-muted">Set or change the password for your account</span>
        </Link>
      </div>
    </AppShell>
  );
}
