import { createAdminClient } from "@/lib/supabase/admin";
import { ensureSubscriber, manychatConfigured, sendCoverAlert } from "@/lib/manychat";
import { fmtDay, fmtTime, rand, shortLocation } from "@/lib/format";

const siteUrl = () => (process.env.SITE_URL ?? "https://class-cover-five.vercel.app").replace(/\/$/, "");

type Target = { teacher_id: string; full_name: string; phone: string; manychat_subscriber_id: string | null; wave_key: string };

/** Send WhatsApp alerts for one request to everyone due one. Safe to run repeatedly. */
export async function notifyRequest(requestId: string) {
  const db = createAdminClient();
  if (!db || !manychatConfigured()) return { sent: 0, skipped: "not configured" };

  const { data: req } = await db
    .from("cover_requests")
    .select("class_name, starts_at, rate, urgent, locations(name)")
    .eq("id", requestId)
    .single();
  if (!req) return { sent: 0 };
  const { data: targets, error } = await db.rpc("notify_targets", { p_request: requestId });
  if (error) throw new Error(error.message);

  const loc = shortLocation((req.locations as unknown as { name: string } | null)?.name ?? "");
  const fields = {
    cc_class: req.class_name,
    cc_when: `${fmtDay(req.starts_at)} ${fmtTime(req.starts_at)}`,
    cc_studio: loc,
    cc_rate: rand(req.rate),
    cc_link: `${siteUrl()}/teach`,
  };

  let sent = 0;
  for (const t of (targets ?? []) as Target[]) {
    // Claim this alert first; if another run already claimed it, skip.
    const { data: claimed } = await db
      .from("notifications")
      .upsert({ request_id: requestId, teacher_id: t.teacher_id, channel: "whatsapp", wave_key: t.wave_key, status: "sending" }, { onConflict: "request_id,teacher_id,channel,wave_key", ignoreDuplicates: true })
      .select("id");
    if (!claimed?.length) continue;
    const id = claimed[0].id;
    try {
      let sub = t.manychat_subscriber_id;
      if (!sub) {
        sub = await ensureSubscriber(t.phone, t.full_name);
        await db.from("profile_contacts").update({ manychat_subscriber_id: sub }).eq("profile_id", t.teacher_id);
      }
      await sendCoverAlert(sub, fields);
      await db.from("notifications").update({ status: "sent", sent_at: new Date().toISOString() }).eq("id", id);
      sent++;
    } catch (e) {
      await db.from("notifications").update({ status: "failed", detail: e instanceof Error ? e.message.slice(0, 300) : "error" }).eq("id", id);
    }
  }
  return { sent };
}

/** Every open, upcoming request: catches the locum wave once the head start ends. */
export async function sweep() {
  const db = createAdminClient();
  if (!db || !manychatConfigured()) return { checked: 0, sent: 0, skipped: "not configured" };
  const { data } = await db.from("cover_requests").select("id").eq("status", "open").gt("starts_at", new Date().toISOString());
  let sent = 0;
  for (const r of data ?? []) sent += (await notifyRequest(r.id)).sent;
  return { checked: data?.length ?? 0, sent };
}
