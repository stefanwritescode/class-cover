import { redirect } from "next/navigation";
import { getViewer } from "@/lib/session";
import SignupForm from "./signup-form";

export default async function OnboardingPage() {
  const { supabase, user, profile } = await getViewer();
  if (!user) redirect("/login");
  if (profile) redirect("/");

  const [{ data: trainings }, { data: studios }] = await Promise.all([
    supabase.from("trainings").select("id, name").order("name"),
    supabase.from("studios").select("id, name").eq("status", "approved").order("name"),
  ]);

  return (
    <main className="mx-auto grid max-w-md gap-6 px-4 pb-16 pt-8">
      <div className="grid gap-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted">Join Class Cover</p>
        <h1 className="text-3xl font-bold">Your teaching profile</h1>
        <p className="text-muted">Studios use this to check your training and contact you about cover.</p>
      </div>
      <SignupForm userId={user.id} email={user.email ?? ""} trainings={trainings ?? []} studios={studios ?? []} />
    </main>
  );
}
