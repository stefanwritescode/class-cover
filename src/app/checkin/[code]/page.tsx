import Link from "next/link";
import { redirect } from "next/navigation";
import { getViewer } from "@/lib/session";
import { buttonClass } from "@/components/ui";
import { fmtTime } from "@/lib/format";

export default async function CheckInPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const { supabase, user } = await getViewer();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/checkin/${code}`)}`);
  const { data: cls, error } = await supabase.rpc("check_in", { p_code: code });

  return (
    <main className="mx-auto grid min-h-dvh max-w-md content-center gap-6 px-5 py-10 text-center">
      <div className={`mx-auto grid h-20 w-20 place-items-center rounded-full text-3xl ${error ? "bg-urgent-soft" : "bg-good-soft text-good"}`}>{error ? "!" : "✓"}</div>
      {error ? (
        <>
          <h1 className="text-3xl font-bold">Couldn&apos;t check you in</h1>
          <p className="text-muted">{error.message}. Check-in works from 3 hours before your class until 2 hours after it starts. If something&apos;s wrong, let the studio know.</p>
        </>
      ) : (
        <>
          <h1 className="text-3xl font-bold">You&apos;re checked in</h1>
          <p className="text-muted">{cls} · {fmtTime(new Date().toISOString())}. Have a great class.</p>
        </>
      )}
      <Link href="/" className={buttonClass("ghost")}>Back to Class Cover</Link>
    </main>
  );
}
