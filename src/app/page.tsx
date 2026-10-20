import Link from "next/link";
import { redirect } from "next/navigation";
import { getViewer } from "@/lib/session";
import { buttonClass } from "@/components/ui";

export default async function Home() {
  const { user, profile, managed } = await getViewer();

  if (user) {
    if (managed.length) redirect("/manage/covers");
    if (!profile) redirect("/onboarding");
    redirect("/teach");
  }

  return (
    <main className="mx-auto grid min-h-dvh max-w-md content-start gap-8 pb-10">
      <div className="relative overflow-hidden rounded-b-[2.5rem] bg-accent px-5 pb-10 pt-20 text-accent-ink">
        <svg aria-hidden viewBox="0 0 200 200" className="pointer-events-none absolute -right-24 -top-6 h-80 w-80 opacity-15">
          {[30, 50, 70, 90].map((r) => <circle key={r} cx="100" cy="100" r={r} fill="none" stroke="currentColor" strokeWidth="6" />)}
        </svg>
        <p className="relative text-xs font-semibold uppercase tracking-widest opacity-80">Stretch Pilates</p>
        <h1 className="relative mt-3 text-5xl font-bold leading-[0.95]">Class<br />Cover</h1>
        <p className="relative mt-4 max-w-xs opacity-85">Last-minute cover, filled in minutes.</p>
      </div>
      <ol className="grid gap-3 px-5">
        {[
          ["A teacher calls in sick", "The studio posts the class in seconds."],
          ["Qualified teachers get a WhatsApp", "Preferred cover first, then vetted locums."],
          ["First to accept takes it", "The class is covered and the pay is tracked."],
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
