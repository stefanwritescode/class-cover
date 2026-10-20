import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type Stage = "to_meet" | "checking_documents" | "locum" | "preferred" | "declined";

export const STAGE_LABEL: Record<Stage, string> = {
  to_meet: "To meet",
  checking_documents: "Checking documents",
  locum: "Locum",
  preferred: "Preferred",
  declined: "Not a fit",
};

/** The signed-in person, their profile, and the studios they manage. */
export async function getViewer() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, profile: null, managed: [] as { id: string; name: string }[] };

  const [{ data: profile }, { data: managedRows }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase.from("studio_managers").select("studios(id, name)").eq("profile_id", user.id),
  ]);
  const managed = (managedRows ?? [])
    .map((r) => r.studios as unknown as { id: string; name: string } | null)
    .filter((s): s is { id: string; name: string } => !!s);
  return { supabase, user, profile, managed };
}

export async function requireManager() {
  const viewer = await getViewer();
  if (!viewer.user) redirect("/login");
  if (!viewer.managed.length) redirect("/");
  return { ...viewer, studio: viewer.managed[0] };
}
