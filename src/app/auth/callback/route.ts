import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// The email link lands here with a one-time code, which becomes a session cookie.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    // Only follow same-site paths, never another domain.
    const next = searchParams.get("next") ?? "/";
    const safe = next.startsWith("/") && !next.startsWith("//") ? next : "/";
    if (!error) return NextResponse.redirect(`${origin}${safe}`);
  }
  return NextResponse.redirect(`${origin}/login?error=link`);
}
