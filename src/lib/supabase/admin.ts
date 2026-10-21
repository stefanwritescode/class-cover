import { createClient } from "@supabase/supabase-js";

/**
 * Server-only client that bypasses row-level security. Used for sending alerts,
 * which runs without a signed-in user. Never import this into a client component.
 */
export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) return null;
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, { auth: { persistSession: false } });
}
