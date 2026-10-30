"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { ActionState } from "@/components/ui/action-form";
import { writeAudit } from "@/lib/audit";
import { requireProfile } from "@/lib/auth";
import { zonedLocalToUtc } from "@/lib/datetime";
import { notify } from "@/lib/notifications";
import { createServiceClient } from "@/lib/supabase/server";
import { resolveTransition } from "@/lib/treat-workflow";
import type { TreatStatus } from "@/types/treat";

const outingSchema = z.object({
  title: z.string().trim().min(3, "Give the outing a title.").max(120),
  location: z.string().trim().max(200).optional().transform((v) => v || undefined),
  description: z.string().trim().max(1000).optional().transform((v) => v || undefined),
  startsAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, "Pick a date and time."),
  obligationIds: z.array(z.string().uuid()).min(1, "Link at least one treat you owe."),
});

/** Creates a group outing and schedules the linked obligations the organizer owes. */
export async function createOuting(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const me = await requireProfile();
  const parsed = outingSchema.safeParse({
    ...Object.fromEntries(formData),
    obligationIds: formData.getAll("obligationIds"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const input = parsed.data;

  const startsAt = zonedLocalToUtc(input.startsAt, me.timezone);
  if (startsAt <= new Date()) return { error: "Pick a date and time in the future." };

  const db = createServiceClient();
  const { data: obligations } = await db
    .from("treat_obligations")
    .select("id, treat_request_id, giver_id, requester_id, status")
    .in("id", input.obligationIds);

  if (!obligations || obligations.length !== input.obligationIds.length) {
    return { error: "One of the selected treats was not found." };
  }
  for (const o of obligations) {
    const check = resolveTransition({
      action: o.status === "PENDING" ? "accept_schedule" : "schedule",
      status: o.status as TreatStatus,
      isGiver: o.giver_id === me.id,
      isRequester: false,
      isLeader: false,
      confirmedBy: [],
    });
    if (!check.ok) return { error: check.error };
  }

  const { data: event, error } = await db
    .from("treat_events")
    .insert({
      title: input.title,
      organizer_id: me.id,
      location: input.location ?? null,
      description: input.description ?? null,
      starts_at: startsAt.toISOString(),
      timezone: me.timezone,
    })
    .select("id")
    .single();
  if (error || !event) return { error: error?.message ?? "Could not create the outing." };

  // One attendee row per member; every obligation still completes independently.
  const attendees = new Map<string, string>();
  for (const o of obligations) if (!attendees.has(o.requester_id)) attendees.set(o.requester_id, o.id);
  await db.from("event_attendees").insert(
    [...attendees].map(([memberId, obligationId]) => ({
      event_id: event.id,
      member_id: memberId,
      obligation_id: obligationId,
    }))
  );

  const now = new Date().toISOString();
  for (const o of obligations) {
    const next = { status: "SCHEDULED", scheduled_at: startsAt.toISOString(), timezone: me.timezone, location: input.location ?? null, delay_reason: null, updated_at: now };
    await db
      .from("treat_obligations")
      .update(o.status === "PENDING" ? { ...next, accepted_at: now } : next)
      .eq("id", o.id);
    await db
      .from("treat_requests")
      .update({ request_status: "SCHEDULED", updated_at: now })
      .eq("id", o.treat_request_id);
    await db.from("treat_responses").insert({
      obligation_id: o.id,
      responder_id: me.id,
      response_type: "outing_scheduled",
      explanation: input.title,
      previous_status: o.status,
      new_status: "SCHEDULED",
    });
  }

  await notify(
    obligations.map((o) => ({
      recipientId: o.requester_id,
      type: "outing_created",
      title: `${me.full_name} planned "${input.title}"`,
      message: `Your treat is scheduled for this outing${input.location ? ` at ${input.location}` : ""}.`,
      obligationId: o.id,
      eventId: event.id,
    }))
  );
  await writeAudit({
    actorId: me.id,
    eventType: "outing.created",
    entityType: "treat_event",
    entityId: event.id,
    metadata: { obligationIds: input.obligationIds },
  });

  revalidatePath("/", "layout");
  redirect(`/outings/${event.id}`);
}
