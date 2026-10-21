"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { notifyRequest } from "@/lib/notify";
import { redirect } from "next/navigation";
import { getViewer } from "@/lib/session";

async function teacher() {
  const v = await getViewer();
  if (!v.user) redirect("/login");
  return { supabase: v.supabase, userId: v.user.id };
}

export async function acceptCover(formData: FormData) {
  const { supabase } = await teacher();
  const { error } = await supabase.rpc("accept_cover", { p_request: String(formData.get("request_id")) });
  if (error) redirect(`/teach?msg=${encodeURIComponent(error.message)}`);
  revalidatePath("/teach");
  redirect("/teach?msg=accepted");
}

export async function dropCover(formData: FormData) {
  const { supabase } = await teacher();
  const assignmentId = String(formData.get("assignment_id"));
  const { data: a } = await supabase.from("cover_assignments").select("request_id").eq("id", assignmentId).single();
  const { error } = await supabase.rpc("drop_cover", { p_assignment: assignmentId });
  if (error) redirect(`/teach?msg=${encodeURIComponent(error.message)}`);
  // The class is back out: alert preferred teachers again.
  if (a?.request_id) after(() => notifyRequest(a.request_id).catch((e) => console.error("notify failed", e)));
  revalidatePath("/teach");
  redirect("/teach?msg=dropped");
}

export async function savePreferences(formData: FormData) {
  const { supabase, userId } = await teacher();
  const { error } = await supabase.from("teacher_preferences").upsert({
    profile_id: userId,
    location_ids: formData.getAll("location_ids").map(String),
    weekdays: formData.getAll("weekdays").map(Number),
    dayparts: formData.getAll("dayparts").map(String),
    updated_at: new Date().toISOString(),
  });
  if (error) throw new Error(error.message);
  revalidatePath("/teach/profile");
  redirect("/teach/profile?saved=availability");
}

export async function saveDetails(formData: FormData) {
  const { supabase, userId } = await teacher();
  const s = (k: string) => String(formData.get(k) ?? "").trim() || null;
  const [p, c, b] = await Promise.all([
    supabase.from("profiles").update({
      first_aid_expiry: s("first_aid_expiry"),
      insurance_expiry: s("insurance_expiry"),
      visibility: formData.get("visibility") === "studios_i_work_with" ? "studios_i_work_with" : "verified_studios",
      area: s("area"),
    }).eq("id", userId),
    supabase.from("profile_contacts").upsert({ profile_id: userId, phone: s("phone"), whatsapp_opt_in: formData.get("whatsapp") === "on" }),
    supabase.from("profile_private").upsert({
      profile_id: userId,
      bank_name: s("bank_name"),
      bank_account_number: s("bank_account_number"),
      bank_branch_code: s("bank_branch_code"),
    }),
  ]);
  const err = p.error ?? c.error ?? b.error;
  if (err) throw new Error(err.message);
  revalidatePath("/teach/profile");
  redirect("/teach/profile?saved=details");
}
