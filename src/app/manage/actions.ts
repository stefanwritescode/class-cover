"use server";

import { revalidatePath } from "next/cache";
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
