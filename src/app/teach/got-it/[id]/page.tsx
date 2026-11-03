import Link from "next/link";
import { redirect } from "next/navigation";
import { getViewer } from "@/lib/session";
import { fmtDay, fmtTime, rand, shortLocation } from "@/lib/format";
import { Wobs } from "@/components/wobs";

const CONFETTI = ["#C6FF3D", "#33F0FF", "#FF3EA5", "#FFB020", "#A57BFF"];

type Held = { rate: number; cover_requests: { class_name: string; starts_at: string; duration_minutes: number; locations: { name: string } | null } };

/** Shown right after a teacher takes a class. */
export default async function GotIt({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, user } = await getViewer();
  if (!user) redirect("/login");

  const [{ data }, { count }] = await Promise.all([
    supabase
      .from("cover_assignments")
      .select("rate, cover_requests(class_name, starts_at, duration_minutes, locations(name))")
      .eq("request_id", id)
      .eq("teacher_id", user.id)
      .is("dropped_at", null)
      .maybeSingle(),
    supabase.from("cover_assignments").select("id", { count: "exact", head: true }).eq("teacher_id", user.id).is("dropped_at", null),
  ]);
  const held = data as unknown as Held | null;
  if (!held) redirect("/teach");
  const r = held.cover_requests;

  return (
    <main className="relative mx-auto grid min-h-dvh max-w-md content-center justify-items-center gap-3 overflow-hidden bg-night px-6 py-10 text-center text-white">
      {Array.from({ length: 28 }, (_, i) => (
        <span
          key={i}
          aria-hidden
          className="confetti"
          style={{ left: `${(i * 37) % 100}%`, background: CONFETTI[i % CONFETTI.length], animationDelay: `${(i % 7) * 0.12}s` }}
        />
      ))}
      <Wobs mood="cheer" className="h-44 w-44" />
      <h1 className="text-[2.75rem] leading-none text-lime">It&apos;s yours!</h1>
      <p className="text-lg">{r.class_name} · {fmtDay(r.starts_at)} <span className="font-mono">{fmtTime(r.starts_at)}</span></p>
      <p className="text-sm text-white/70">
        {shortLocation(r.locations?.name ?? "")} · {r.duration_minutes} min · {rand(held.rate)} added to your earnings
      </p>
      {!!count && (
        <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-cyan">
          {count === 1 ? "Your first cover!" : `Cover #${count}`}
        </span>
      )}
      <p className="mt-2 w-full rounded-2xl bg-white/10 px-4 py-3 text-left text-sm text-white/85">
        Door codes and parking notes show on the class in your upcoming covers. Scan the QR code at reception when you arrive.
      </p>
      <Link href="/teach" className="mt-2 w-full rounded-full bg-cyan px-5 py-3 font-semibold text-night">
        Back to covers
      </Link>
    </main>
  );
}
