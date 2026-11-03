import Link from "next/link";
import { redirect } from "next/navigation";
import { getViewer } from "@/lib/session";
import { buttonClass } from "@/components/ui";
import { CitySky, partOfDayNow, Wobs } from "@/components/wobs";

export default async function Home() {
  const { user, profile, managed } = await getViewer();

  if (user) {
    if (managed.length) redirect("/manage/covers");
    if (!profile) redirect("/onboarding");
    redirect("/teach");
  }

  return (
    <main className="mx-auto grid min-h-dvh max-w-md content-start gap-8 pb-10">
      <div className="relative overflow-hidden rounded-b-[2.5rem] bg-night px-5 pb-8 pt-16 text-white">
        <CitySky part={partOfDayNow()} />
        <p className="relative text-[11px] font-semibold uppercase tracking-widest text-cyan">Stretch Pilates</p>
        <div className="relative flex items-end gap-2">
          <div className="min-w-0 flex-1">
            <h1 className="mt-3 text-6xl leading-[0.95]">Wobs</h1>
            <p className="mt-4 max-w-xs text-white/85">When a class wobbles, Wobs steadies it.</p>
          </div>
          <Wobs mood="cheer" className="h-32 w-32 flex-none" />
        </div>
      </div>
      <ol className="grid gap-3 px-5">
        {[
          ["A class wobbles", "A teacher calls in sick. The studio sends Wobs in seconds."],
          ["Wobs knocks on WhatsApp", "Preferred teachers first, then vetted locums."],
          ["First to take it steadies it", "The class is covered and the pay is tracked."],
        ].map(([title, body], i) => (
          <li key={title} className="flex gap-4">
            <span className="grid h-8 w-8 flex-none place-items-center rounded-full bg-accent-soft font-display text-sm font-bold text-accent">{i + 1}</span>
            <span><span className="block font-semibold">{title}</span><span className="block text-sm text-muted">{body}</span></span>
          </li>
        ))}
      </ol>
      <div className="px-5">
        <Link href="/login" className={`${buttonClass()} w-full`}>
          Sign in or create an account
        </Link>
      </div>
    </main>
  );
}
