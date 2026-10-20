import Link from "next/link";
import { redirect } from "next/navigation";
import { getViewer } from "@/lib/session";
import { buttonClass } from "@/components/ui";

export default async function Home() {
  const { user, profile, managed } = await getViewer();

  if (user) {
    if (managed.length) redirect("/manage/teachers");
    if (!profile) redirect("/onboarding");
    redirect("/teach");
  }

  return (
    <main className="mx-auto grid min-h-dvh max-w-md content-center gap-6 px-4 py-10">
      <div className="grid gap-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted">Stretch Pilates</p>
        <h1 className="text-4xl font-bold">Class Cover</h1>
        <p className="text-muted">
          Last-minute cover, filled in minutes. A studio posts a class, qualified teachers get a WhatsApp, and the
          first to accept takes it.
        </p>
      </div>
      <Link href="/login" className={buttonClass()}>
        Sign in or join as a teacher
      </Link>
    </main>
  );
}
