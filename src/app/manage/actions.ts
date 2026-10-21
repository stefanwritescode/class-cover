"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { notifyRequest } from "@/lib/notify";
import { requireManager, type Stage } from "@/lib/session";

const STAGES: Stage[] = ["to_meet", "checking_documents", "locum", "preferred", "declined"];

export async function setStage(formData: FormData) {
  const { supabase, studio } = await requireManager();
  const stage = String(formData.get("stage")) as Stage;
  if (!STAGES.includes(stage)) throw new Error("Unknown stage");
  const { error } = await supabase
    .from("studio_teachers")
    .update({ stage })
    .eq("studio_id", studio.id)
    .eq("teacher_id", String(formData.get("teacher_id")));
  if (error) throw new Error(error.message);
  revalidatePath("/manage/teachers");
}

export async function setTrainingVerified(formData: FormData) {
  const { supabase, user } = await requireManager();
  const verify = formData.get("verify") === "1";
  const { error } = await supabase
    .from("profile_trainings")
    .update({ verified_at: verify ? new Date().toISOString() : null, verified_by: verify ? user!.id : null })
    .eq("profile_id", String(formData.get("teacher_id")))
    .eq("training_id", String(formData.get("training_id")));
  if (error) throw new Error(error.message);
  revalidatePath("/manage/teachers");
}

export async function saveSettings(formData: FormData) {
  const { supabase, studio } = await requireManager();
  const int = (k: string, min: number, max: number) => Math.min(max, Math.max(min, Math.round(Number(formData.get(k)))));
  const { error } = await supabase
    .from("studios")
    .update({
      meet_first: formData.get("meet_first") === "on",
      default_rate: int("default_rate", 0, 10000),
      wave_delay_minutes: int("wave_delay_minutes", 0, 240),
      dropout_limit: int("dropout_limit", 1, 20),
    })
    .eq("id", studio.id);
  if (error) throw new Error(error.message);
  revalidatePath("/manage/settings");
}

/* ---------- Covers ---------- */

export async function postCover(formData: FormData) {
  const { supabase, studio, user } = await requireManager();
  const { saISO, URGENT_HOURS } = await import("@/lib/format");
  const date = String(formData.get("date"));
  const time = String(formData.get("time"));
  const startsAt = saISO(date, time);
  const msToStart = new Date(startsAt).getTime() - Date.now();
  if (!(msToStart > 0)) throw new Error("That class has already started. Pick a later time.");

  const classId = String(formData.get("class_id") || "") || null;
  let accepted: string[] = [];
  if (classId) {
    const { data: c } = await supabase.from("timetable_classes").select("accepted_training_ids").eq("id", classId).single();
    accepted = c?.accepted_training_ids ?? [];
  }
  if (!accepted.length) {
    const { data: all } = await supabase.from("trainings").select("id");
    accepted = (all ?? []).map((t) => t.id);
  }

  const urgent = formData.get("urgent") === "on" || msToStart < URGENT_HOURS * 3600_000;
  const { data: req, error } = await supabase
    .from("cover_requests")
    .insert({
      studio_id: studio.id,
      location_id: String(formData.get("location_id")),
      timetable_class_id: classId,
      class_name: String(formData.get("class_name")).trim(),
      starts_at: startsAt,
      duration_minutes: Number(formData.get("duration")) || 50,
      reason: String(formData.get("reason") || "") || null,
      rate: Math.max(0, Math.round(Number(formData.get("rate")))),
      accepted_training_ids: accepted,
      notes: String(formData.get("notes") || "").trim() || null,
      urgent,
      wave: urgent ? "all" : "preferred",
      created_by: user!.id,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  const access = String(formData.get("access_notes") || "").trim();
  if (access) {
    const { error: aErr } = await supabase.from("cover_request_access").insert({ request_id: req.id, access_notes: access });
    if (aErr) throw new Error(aErr.message);
  }
  // Send WhatsApp alerts after the response, so posting stays instant.
  after(() => notifyRequest(req.id).catch((e) => console.error("notify failed", e)));
  revalidatePath("/manage/covers");
  const { redirect } = await import("next/navigation");
  redirect("/manage/covers?posted=1");
}

export async function openToEveryone(formData: FormData) {
  const { supabase, studio } = await requireManager();
  const requestId = String(formData.get("request_id"));
  const { error } = await supabase.from("cover_requests").update({ wave: "all" }).eq("id", requestId).eq("studio_id", studio.id);
  if (error) throw new Error(error.message);
  after(() => notifyRequest(requestId).catch((e) => console.error("notify failed", e)));
  revalidatePath("/manage/covers");
}

export async function cancelCover(formData: FormData) {
  const { supabase, studio } = await requireManager();
  const { error } = await supabase
    .from("cover_requests")
    .update({ status: "cancelled" })
    .eq("id", String(formData.get("request_id")))
    .eq("studio_id", studio.id);
  if (error) throw new Error(error.message);
  revalidatePath("/manage/covers");
}

export async function confirmCover(formData: FormData) {
  const { supabase } = await requireManager();
  const rating = Number(formData.get("rating"));
  const { error } = await supabase
    .from("cover_assignments")
    .update({
      confirmed_at: new Date().toISOString(),
      rating: rating >= 1 && rating <= 5 ? rating : null,
      manager_note: String(formData.get("manager_note") || "").trim() || null,
    })
    .eq("id", String(formData.get("assignment_id")));
  if (error) throw new Error(error.message);
  revalidatePath("/manage/covers");
  revalidatePath("/manage/pay");
}

export async function markPaid(formData: FormData) {
  const { supabase } = await requireManager();
  const ids = String(formData.get("assignment_ids")).split(",").filter(Boolean);
  if (!ids.length) return;
  const { error } = await supabase.from("cover_assignments").update({ paid_at: new Date().toISOString() }).in("id", ids).is("paid_at", null);
  if (error) throw new Error(error.message);
  revalidatePath("/manage/pay");
}
