import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { CONNECT_KEYWORD, getSubscriber } from "@/lib/manychat";

// ManyChat's "Class Cover connect" automation calls this when a teacher sends their code.
// The code is secret to that teacher, and the contact is confirmed with ManyChat's API, so
// the request needs no shared secret.
const CODE = new RegExp(`${CONNECT_KEYWORD}\\s+([a-f0-9]{10})`, "i");

export async function POST(request: NextRequest) {
  const db = createAdminClient();
  if (!db) return NextResponse.json({ ok: false, error: "not configured" }, { status: 503 });

  const body = (await request.json().catch(() => ({}))) as { subscriber_id?: string | number; text?: string };
  const subscriberId = String(body.subscriber_id ?? "").trim();
  if (!/^\d+$/.test(subscriberId)) return NextResponse.json({ ok: false, error: "bad contact" }, { status: 400 });

  let info;
  try {
    info = await getSubscriber(subscriberId);
  } catch {
    return NextResponse.json({ ok: false, error: "unknown contact" }, { status: 404 });
  }

  const code = (body.text?.match(CODE) ?? info.last_input_text?.match(CODE))?.[1]?.toLowerCase();
  if (!code) return NextResponse.json({ ok: false, error: "no code" }, { status: 400 });

  const { data, error } = await db
    .from("profile_contacts")
    .update({ manychat_subscriber_id: subscriberId, whatsapp_connected_at: new Date().toISOString(), whatsapp_opt_in: true })
    .eq("whatsapp_link_code", code)
    .select("profile_id");
  if (error) return NextResponse.json({ ok: false, error: "could not save" }, { status: 500 });
  if (!data?.length) return NextResponse.json({ ok: false, error: "code not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
