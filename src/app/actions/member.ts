"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionState } from "@/components/ui/action-form";
import { writeAudit } from "@/lib/audit";
import { requireProfile } from "@/lib/auth";
import { isValidTimeZone } from "@/lib/datetime";
import { createClient, createServiceClient } from "@/lib/supabase/server";

const reviewSchema = z.object({
  obligationId: z.string().uuid("Choose a completed treat."),
  rating: z.coerce.number().int().min(1, "Pick a rating.").max(5),
  comments: z.string().trim().max(1000).optional().transform((v) => v || undefined),
  foodOrActivity: z.string().trim().max(200).optional().transform((v) => v || undefined),
  recommended: z.string().optional(),
});

export async function submitReview(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const me = await requireProfile();
  const parsed = reviewSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const input = parsed.data;

  const db = createServiceClient();
  const { data: obligation } = await db
    .from("treat_obligations")
    .select("id, giver_id, requester_id, status")
    .eq("id", input.obligationId)
    .maybeSingle();
  const isParty = obligation && (obligation.giver_id === me.id || obligation.requester_id === me.id);
  if (!obligation || !isParty || obligation.status !== "COMPLETED") {
    return { error: "You can only review completed treats you were part of." };
  }

  const { error } = await db.from("treat_reviews").insert({
    obligation_id: obligation.id,
    reviewer_id: me.id,
    rating: input.rating,
    food_or_activity: input.foodOrActivity ?? null,
    comments: input.comments ?? null,
    recommended: input.recommended === "on",
  });
  if (error) {
    return { error: error.code === "23505" ? "You already reviewed this treat." : error.message };
  }

  await writeAudit({ actorId: me.id, eventType: "review.submitted", entityType: "treat_obligation", entityId: obligation.id });
  revalidatePath("/reviews");
  return { success: "Review submitted. Thanks!" };
}

export async function markNotificationRead(formData: FormData): Promise<void> {
  await requireProfile();
  const id = z.string().uuid().safeParse(formData.get("id"));
  if (!id.success) return;
  // RLS limits updates to the signed-in user's own notifications.
  const supabase = await createClient();
  await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", id.data).is("read_at", null);
  revalidatePath("/", "layout");
}

export async function markAllNotificationsRead(): Promise<void> {
  const me = await requireProfile();
  const supabase = await createClient();
  await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("recipient_id", me.id)
    .is("read_at", null);
  revalidatePath("/", "layout");
}

const settingsSchema = z.object({
  fullName: z.string().trim().min(2, "Enter your name.").max(60),
  timezone: z.string().refine(isValidTimeZone, "Choose a valid time zone."),
});

export async function updateSettings(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const me = await requireProfile();
  const parsed = settingsSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ full_name: parsed.data.fullName, timezone: parsed.data.timezone })
    .eq("id", me.id);
  if (error) return { error: error.message };

  await writeAudit({ actorId: me.id, eventType: "profile.updated", entityType: "profile", entityId: me.id });
  revalidatePath("/", "layout");
  return { success: "Settings saved." };
}
