import { NextResponse } from "next/server";
import { sweep } from "@/lib/notify";

// Called every minute by a Supabase cron job. Only sends alerts that are due and
// never sends one twice, so an extra call is harmless.
export const dynamic = "force-dynamic";

export async function POST() {
  return NextResponse.json(await sweep());
}
export const GET = POST;
