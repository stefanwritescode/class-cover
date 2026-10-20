"use client";

import { useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { buttonClass, Card, Field, inputClass } from "@/components/ui";
import { saISO, shortLocation, URGENT_HOURS, weekdayOf } from "@/lib/format";
import { postCover } from "../actions";

type Loc = { id: string; name: string };
type Cls = { id: string; location_id: string; name: string; weekday: number; start_time: string; duration_minutes: number };

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return <button className={`${buttonClass()} w-full`} disabled={pending}>{pending ? "Posting…" : label}</button>;
}

export default function PostForm({ locations, classes, days, defaultRate, headStart }: { locations: Loc[]; classes: Cls[]; days: string[]; defaultRate: number; headStart: number }) {
  const [date, setDate] = useState(days[0]);
  const [locationId, setLocationId] = useState(locations[0]?.id ?? "");
  const [classId, setClassId] = useState<string>("");
  const [custom, setCustom] = useState({ name: "", time: "", duration: 50 });
  const [urgentToggle, setUrgentToggle] = useState(false);

  const dayClasses = useMemo(
    () => classes.filter((c) => c.location_id === locationId && c.weekday === weekdayOf(date)),
    [classes, locationId, date],
  );
  const picked = dayClasses.find((c) => c.id === classId);
  const name = picked?.name ?? custom.name;
  const time = picked?.start_time.slice(0, 5) ?? custom.time;
  const duration = picked?.duration_minutes ?? custom.duration;
  const startsMs = time ? new Date(saISO(date, time)).getTime() : NaN;
  const past = !Number.isNaN(startsMs) && startsMs <= Date.now();
  const autoUrgent = !Number.isNaN(startsMs) && !past && startsMs - Date.now() < URGENT_HOURS * 3600_000;
  const urgent = autoUrgent || urgentToggle;

  const dayLabel = (d: string, i: number) =>
    i === 0 ? "Today" : i === 1 ? "Tmrw" : new Date(`${d}T12:00:00+02:00`).toLocaleDateString("en-ZA", { weekday: "short", timeZone: "UTC" });

  return (
    <form action={postCover} className="grid gap-5">
      <input type="hidden" name="date" value={date} />
      <input type="hidden" name="class_id" value={classId} />
      <input type="hidden" name="class_name" value={name} />
      <input type="hidden" name="time" value={time} />
      <input type="hidden" name="duration" value={duration} />
      <input type="hidden" name="urgent" value={urgentToggle ? "on" : ""} />

      <div className="grid gap-2">
        <p className="text-xs font-semibold text-muted">When</p>
        <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1">
          {days.map((d, i) => (
            <button
              type="button"
              key={d}
              onClick={() => { setDate(d); setClassId(""); }}
              className={`grid min-w-14 flex-none justify-items-center rounded-2xl border px-2 py-2 ${d === date ? "border-accent bg-accent text-accent-ink" : "border-line bg-surface"}`}
            >
              <span className="text-[11px] font-semibold">{dayLabel(d, i)}</span>
              <span className="font-mono text-base">{Number(d.slice(8))}</span>
            </button>
          ))}
        </div>
      </div>

      <Field label="Studio" htmlFor="location_id">
        <select id="location_id" name="location_id" className={inputClass} value={locationId} onChange={(e) => { setLocationId(e.target.value); setClassId(""); }}>
          {locations.map((l) => <option key={l.id} value={l.id}>{shortLocation(l.name)}</option>)}
        </select>
      </Field>

      <div className="grid gap-2">
        <p className="text-xs font-semibold text-muted">Class</p>
        {dayClasses.length === 0 && <p className="text-sm text-muted">No classes on the timetable that day. Add the details below.</p>}
        <div className="grid grid-cols-2 gap-2">
          {dayClasses.map((c) => {
            const isPast = new Date(saISO(date, c.start_time)).getTime() <= Date.now();
            return (
              <button
                type="button"
                key={c.id}
                disabled={isPast}
                onClick={() => setClassId(c.id)}
                className={`grid rounded-2xl border p-3 text-left disabled:opacity-35 ${c.id === classId ? "border-accent bg-accent-soft" : "border-line bg-surface"}`}
              >
                <span className="font-mono text-base">{c.start_time.slice(0, 5)}</span>
                <span className="text-sm font-semibold leading-tight">{c.name}</span>
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => setClassId("")}
            className={`grid rounded-2xl border border-dashed p-3 text-left ${!classId ? "border-accent bg-accent-soft" : "border-line"}`}
          >
            <span className="text-sm font-semibold">Something else</span>
            <span className="text-xs text-muted">Not on the timetable</span>
          </button>
        </div>
        {!classId && (
          <div className="grid grid-cols-[1fr_auto] gap-2">
            <input aria-label="Class name" placeholder="Class name, e.g. Level 1 Reformer" className={inputClass} value={custom.name} onChange={(e) => setCustom({ ...custom, name: e.target.value })} required />
            <input aria-label="Start time" type="time" className={`${inputClass} w-28 font-mono`} value={custom.time} onChange={(e) => setCustom({ ...custom, time: e.target.value })} required />
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Rate (R)" htmlFor="rate">
          <input id="rate" name="rate" type="number" min={0} step={5} defaultValue={defaultRate} className={`${inputClass} font-mono`} />
        </Field>
        <Field label="Reason" htmlFor="reason">
          <select id="reason" name="reason" className={inputClass} defaultValue="Sick">
            {["Sick", "Family emergency", "Injury", "Other"].map((r) => <option key={r}>{r}</option>)}
          </select>
        </Field>
      </div>

      <Card tone="sunk">
        <Field label="Notes for the cover teacher" htmlFor="notes" hint="Shown to everyone who can take the class. Don't include client names or health details.">
          <textarea id="notes" name="notes" rows={3} className={inputClass} placeholder="e.g. Mixed level, lots of regulars. Music is on the studio iPad. Springs reset after class." />
        </Field>
        <Field label="Access details" htmlFor="access_notes" hint="Only the teacher who takes the class sees this.">
          <textarea id="access_notes" name="access_notes" rows={2} className={inputClass} placeholder="e.g. Door code 4821. Park in bays 12-14. Keys at the shop next door." />
        </Field>
      </Card>

      <Card tone={urgent ? "urgent" : undefined}>
        <label className="flex items-start justify-between gap-4" htmlFor="urgent_toggle">
          <span>
            <span className="block font-semibold">Urgent: send to everyone now</span>
            <span className="block text-xs text-muted">
              {autoUrgent
                ? `On automatically, because the class starts within ${URGENT_HOURS} hours.`
                : `Otherwise preferred teachers get a ${headStart}-minute head start before vetted locums.`}
            </span>
          </span>
          <input id="urgent_toggle" type="checkbox" checked={urgent} disabled={autoUrgent} onChange={(e) => setUrgentToggle(e.target.checked)} className="mt-1 h-5 w-5 flex-none accent-[var(--accent)]" />
        </label>
      </Card>

      {past && <p className="text-sm text-bad">That class has already started. Pick a later class or time.</p>}
      <Submit label={name && time ? `Post cover for ${name}, ${time}` : "Post cover"} />
    </form>
  );
}
