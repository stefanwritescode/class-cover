import Link from "next/link";
import { headers } from "next/headers";
import QRCode from "qrcode";
import { requireManager } from "@/lib/session";
import { shortLocation } from "@/lib/format";
import PrintButton from "../../pay/invoice/print-button";

export default async function PostersPage() {
  const { supabase, studio } = await requireManager();
  const h = await headers();
  const origin = `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`;
  const { data: locations } = await supabase.from("locations").select("id, name, checkin_code").eq("studio_id", studio.id).order("name");
  const posters = await Promise.all(
    (locations ?? []).map(async (l) => ({ ...l, qr: await QRCode.toDataURL(`${origin}/checkin/${l.checkin_code}`, { margin: 1, width: 480 }) })),
  );

  return (
    <div className="min-h-dvh bg-surface">
      <div className="mx-auto grid max-w-3xl gap-6 px-5 py-8">
        <div className="flex items-center justify-between print:hidden">
          <Link href="/manage/settings" className="text-sm font-semibold text-accent">← Back to Settings</Link>
          <PrintButton />
        </div>
        <p className="text-sm text-muted print:hidden">Print one poster for each studio and stick it at reception. Cover teachers scan it when they arrive, which records their check-in for pay.</p>
        {posters.map((p) => (
          <section key={p.id} className="grid justify-items-center gap-4 rounded-3xl border-4 border-accent p-8 text-center break-after-page">
            <p className="font-display text-sm font-semibold uppercase tracking-widest text-accent">Covering a class today?</p>
            <h2 className="font-display text-4xl font-bold">Scan to check in</h2>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.qr} alt={`Check-in QR code for ${p.name}`} className="h-64 w-64" />
            <p className="text-lg font-semibold">{shortLocation(p.name)}</p>
            <p className="text-sm text-muted">Class Cover · Stretch Pilates</p>
          </section>
        ))}
      </div>
    </div>
  );
}
