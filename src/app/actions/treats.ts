"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { ActionState } from "@/components/ui/action-form";
import { writeAudit } from "@/lib/audit";
import { requireProfile } from "@/lib/auth";
import { zonedLocalToUtc } from "@/lib/datetime";
import { escapeHtml, sendEmail } from "@/lib/email";
import { notify, notifyLeader } from "@/lib/notifications";
import { createServiceClient } from "@/lib/supabase/server";
import { resolveTransition, treatActionSchema } from "@/lib/treat-workflow";
import { TREAT_STATUS_LABELS, type TreatStatus } from "@/types/treat";

const text = (min: number, max = 1000) => z.string().trim().min(min, "Please fill in all required fields.").max(max);
const optional = z
  .string()
  .trim()
  .max(1000)
  .optional()
  .transform((v) => v || undefined);

const requestSchema = z.object({
  giverId: z.string().uuid("Choose who owes you the treat."),
  reason: text(3),
  achievement: text(3),
  requestedTreat: optional,
  notes: optional,
});

export async function requestTreat(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const me = await requireProfile();
  const parsed = requestSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const input = parsed.data;

  if (input.giverId === me.id) return { error: "You can't ask yourself for a treat." };

  const db = createServiceClient();
  const { data: giver } = await db
    .from("profiles")
    .select("id, full_name, email")
    .eq("id", input.giverId)
    .eq("account_status", "active")
    .maybeSingle();
  if (!giver) return { error: "That member isn't active yet." };

  const { data: request, error } = await db
    .from("treat_requests")
    .insert({
      requester_id: me.id,
      primary_giver_id: giver.id,
      reason: input.reason,
      achievement_description: input.achievement,
      requested_treat: input.requestedTreat ?? null,
      additional_notes: input.notes ?? null,
    })
    .select("id")
    .single();
  if (error || !request) return { error: error?.message ?? "Could not create the request." };

  const { data: obligation, error: obligationError } = await db
    .from("treat_obligations")
    .insert({
      treat_request_id: request.id,
      giver_id: giver.id,
      requester_id: me.id,
      timezone: me.timezone,
    })
    .select("id")
    .single();
  if (obligationError || !obligation) {
    await db.from("treat_requests").delete().eq("id", request.id);
    return { error: obligationError?.message ?? "Could not create the obligation." };
  }

  await notify({
    recipientId: giver.id,
    type: "treat_requested",
    title: `${me.full_name} requested a treat`,
    message: `${me.full_name}: "${input.reason}". Open it to accept and schedule.`,
    obligationId: obligation.id,
  });
  await sendEmail({
    idempotencyKey: `treat-requested:${obligation.id}`,
    to: giver.email,
    template: "treat_requested",
    subject: `${me.full_name} requested a treat`,
    html: `<p>${escapeHtml(me.full_name)} says you owe a treat: <b>${escapeHtml(input.reason)}</b>.</p>
<p>Open TreatTracker to accept and schedule it.</p>`,
  });
  await writeAudit({
    actorId: me.id,
    eventType: "treat.requested",
    entityType: "treat_obligation",
    entityId: obligation.id,
    metadata: { giverId: giver.id },
  });

  revalidatePath("/", "layout");
  redirect(`/treats/${obligation.id}`);
}

type Party = "giver" | "requester";

export async function performTreatAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const me = await requireProfile();
  const parsed = treatActionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const input = parsed.data;

  const db = createServiceClient();
  const { data: obligation } = await db
    .from("treat_obligations")
    .select("id, treat_request_id, giver_id, requester_id, status")
    .eq("id", input.obligationId)
    .maybeSingle();
  if (!obligation) return { error: "Treat not found." };

  const status = obligation.status as TreatStatus;
  const { data: confirmations } = await db
    .from("treat_confirmations")
    .select("confirmer_id")
    .eq("obligation_id", obligation.id);
  const confirmedBy = (confirmations ?? []).map((c): Party =>
    c.confirmer_id === obligation.giver_id ? "giver" : "requester"
  );

  const result = resolveTransition({
    action: input.action,
    status,
    isGiver: me.id === obligation.giver_id,
    isRequester: me.id === obligation.requester_id,
    isLeader: me.role === "leader",
    confirmedBy,
  });
  if (!result.ok) return { error: result.error };

  const now = new Date();
  const patch: Record<string, unknown> = { status: result.next, updated_at: now.toISOString() };
  let explanation: string | null = null;

  switch (input.action) {
    case "accept_schedule":
    case "schedule": {
      const when = zonedLocalToUtc(input.scheduledAt, me.timezone);
      if (when <= now) return { error: "Pick a date and time in the future." };
      Object.assign(patch, {
        scheduled_at: when.toISOString(),
        timezone: me.timezone,
        location: input.location ?? null,
        delay_reason: null,
      });
      if (input.action === "accept_schedule") patch.accepted_at = now.toISOString();
      break;
    }
    case "accept_unscheduled":
      Object.assign(patch, { accepted_at: now.toISOString(), scheduling_reason: input.reason, scheduled_at: null });
      explanation = input.reason;
      break;
    case "delay":
      Object.assign(patch, { delay_reason: input.reason, scheduled_at: null });
      explanation = input.reason;
      break;
    case "leader_accept":
      Object.assign(patch, { accepted_at: now.toISOString(), scheduling_reason: input.reason });
      explanation = input.reason;
      break;
    case "confirm_completion":
      explanation = input.notes ?? null;
      break;
    case "tag_leader":
    case "leader_reject":
    case "leader_override_complete":
      explanation = input.reason;
      break;
  }

  if (result.next === "COMPLETED") {
    Object.assign(patch, { completed_at: now.toISOString(), completion_method: result.completionMethod });
  }

  if (input.action === "confirm_completion") {
    const { error } = await db
      .from("treat_confirmations")
      .insert({ obligation_id: obligation.id, confirmer_id: me.id, notes: input.notes ?? null });
    if (error) return { error: "You already confirmed this treat." };
  }

  // Optimistic concurrency: only apply if the status is still what we validated against.
  if (input.action !== "tag_leader") {
    const { data: updated, error } = await db
      .from("treat_obligations")
      .update(patch)
      .eq("id", obligation.id)
      .eq("status", status)
      .select("id");
    if (error) return { error: error.message };
    if (!updated || updated.length === 0) return { error: "This treat just changed. Refresh and try again." };

    await db
      .from("treat_requests")
      .update({
        request_status: result.next,
        updated_at: now.toISOString(),
        ...(result.next === "REJECTED"
          ? { rejected_at: now.toISOString(), rejected_by: me.id, rejection_reason: explanation }
          : {}),
      })
      .eq("id", obligation.treat_request_id);
  }

  if (input.action === "tag_leader") {
    await db
      .from("leader_interventions")
      .insert({ obligation_id: obligation.id, requested_by: me.id, intervention_reason: input.reason });
    await notifyLeader({
      type: "intervention_requested",
      title: `${me.full_name} needs the leader`,
      message: input.reason,
      obligationId: obligation.id,
    });
  }

  if (me.role === "leader" && input.action.startsWith("leader_")) {
    await db
      .from("leader_interventions")
      .update({
        status: "resolved",
        leader_id: me.id,
        action_taken: input.action,
        decision_reason: explanation,
        resolved_at: now.toISOString(),
      })
      .eq("obligation_id", obligation.id)
      .eq("status", "open");
  }

  await db.from("treat_responses").insert({
    obligation_id: obligation.id,
    responder_id: me.id,
    response_type: input.action,
    explanation,
    previous_status: status,
    new_status: result.next,
  });

  const recipients = [obligation.giver_id, obligation.requester_id].filter((id) => id !== me.id);
  if (input.action !== "tag_leader") {
    await notify(
      recipients.map((recipientId) => ({
        recipientId,
        type: `treat_${input.action}`,
        title: `${me.full_name}: ${TREAT_STATUS_LABELS[result.next]}`,
        message: explanation ?? `Treat status is now ${TREAT_STATUS_LABELS[result.next]}.`,
        obligationId: obligation.id,
      }))
    );
  }

  await writeAudit({
    actorId: me.id,
    eventType: `treat.${input.action}`,
    entityType: "treat_obligation",
    entityId: obligation.id,
    metadata: { from: status, to: result.next, explanation },
  });

  revalidatePath("/", "layout");
  return { success: "Saved." };
}
