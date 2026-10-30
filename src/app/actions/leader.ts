"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isAllowedEmail } from "@/config/allowed-members";
import type { ActionState } from "@/components/ui/action-form";
import { writeAudit } from "@/lib/audit";
import { requireLeader } from "@/lib/auth";
import { createInvitation } from "@/lib/invitations";
import { createServiceClient } from "@/lib/supabase/server";

const uuid = z.string().uuid();

export async function createInvite(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const leader = await requireLeader();
  const email = z.string().trim().toLowerCase().email().safeParse(formData.get("email"));
  if (!email.success || !isAllowedEmail(email.data)) {
    return { error: "Only allowlisted ITU emails can be invited." };
  }

  try {
    const invite = await createInvitation(email.data, leader.id);
    await writeAudit({
      actorId: leader.id,
      eventType: "invitation.created",
      entityType: "invitation",
      entityId: invite.invitationId,
      metadata: { email: invite.email, emailResult: invite.emailResult },
    });
    revalidatePath("/leader/invitations");
    return {
      success: `Code for ${invite.email}: ${invite.setupCode} — share it (or the code link). Email: ${invite.emailResult}.`,
    };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not create the invitation." };
  }
}

/** Create/refresh one-time setup codes for every allowlisted member who cannot log in yet. */
export async function generateAllSetupCodes(_formData: FormData): Promise<void> {
  const leader = await requireLeader();
  const db = createServiceClient();
  const { data: profiles } = await db.from("profiles").select("email, auth_user_id, full_name");
  const needSetup = (profiles ?? []).filter((p) => !p.auth_user_id && isAllowedEmail(p.email));

  for (const p of needSetup) {
    try {
      const invite = await createInvitation(p.email, leader.id);
      await writeAudit({
        actorId: leader.id,
        eventType: "invitation.created",
        entityType: "invitation",
        entityId: invite.invitationId,
        metadata: { email: invite.email, setupCode: invite.setupCode, bulk: true },
      });
    } catch (e) {
      console.error("bulk invite failed", p.email, e);
    }
  }

  revalidatePath("/leader/invitations");
}

export async function revokeInvite(formData: FormData): Promise<void> {
  const leader = await requireLeader();
  const id = uuid.safeParse(formData.get("id"));
  if (!id.success) return;
  await createServiceClient().from("invitations").update({ status: "revoked" }).eq("id", id.data).eq("status", "pending");
  await writeAudit({ actorId: leader.id, eventType: "invitation.revoked", entityType: "invitation", entityId: id.data });
  revalidatePath("/leader/invitations");
}

export async function setAccountStatus(formData: FormData): Promise<void> {
  const leader = await requireLeader();
  const id = uuid.safeParse(formData.get("id"));
  const status = z.enum(["active", "suspended"]).safeParse(formData.get("status"));
  if (!id.success || !status.success || id.data === leader.id) return;
  await createServiceClient().from("profiles").update({ account_status: status.data }).eq("id", id.data);
  await writeAudit({
    actorId: leader.id,
    eventType: `member.${status.data}`,
    entityType: "profile",
    entityId: id.data,
  });
  revalidatePath("/leader/users");
}

export async function resolveSecurityEvent(formData: FormData): Promise<void> {
  const leader = await requireLeader();
  const id = uuid.safeParse(formData.get("id"));
  if (!id.success) return;
  await createServiceClient()
    .from("security_events")
    .update({ resolution_status: "resolved", resolved_by: leader.id, resolved_at: new Date().toISOString() })
    .eq("id", id.data);
  await writeAudit({ actorId: leader.id, eventType: "security.resolved", entityType: "security_event", entityId: id.data });
  revalidatePath("/leader/security");
}

const SETTING_KEYS = [
  "invitation_expiry_days",
  "reminder_unanswered_days",
  "reminder_unscheduled_days",
  "review_edit_hours",
] as const;

export async function updateAppSettings(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const leader = await requireLeader();
  const parsed = z
    .object(Object.fromEntries(SETTING_KEYS.map((k) => [k, z.coerce.number().int().min(1).max(365)])))
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Each value must be a whole number between 1 and 365." };

  const db = createServiceClient();
  const now = new Date().toISOString();
  const { error } = await db.from("app_settings").upsert(
    SETTING_KEYS.map((key) => ({ key, value: parsed.data[key], updated_by: leader.id, updated_at: now }))
  );
  if (error) return { error: error.message };

  await writeAudit({ actorId: leader.id, eventType: "settings.updated", metadata: parsed.data });
  revalidatePath("/leader/settings");
  return { success: "Settings saved." };
}
