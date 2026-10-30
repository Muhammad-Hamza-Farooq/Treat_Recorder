import { createHash, randomBytes } from "node:crypto";
import { findAllowedMemberByEmail } from "@/config/allowed-members";
import { escapeHtml, sendEmail, type EmailResult } from "@/lib/email";
import { createServiceClient } from "@/lib/supabase/server";

export function hashToken(rawToken: string): string {
  return createHash("sha256").update(rawToken).digest("hex");
}

export function invitationLink(rawToken: string): string {
  const base = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
  return `${base}/accept-invitation?token=${rawToken}`;
}

async function expiryDays(): Promise<number> {
  const { data } = await createServiceClient()
    .from("app_settings")
    .select("value")
    .eq("key", "invitation_expiry_days")
    .maybeSingle();
  const days = Number(data?.value);
  return Number.isFinite(days) && days > 0 ? days : 7;
}

/** Validates a raw invitation token (service role) and returns the pending invite, if usable. */
export async function findUsableInvitation(rawToken: string) {
  const { data } = await createServiceClient()
    .from("invitations")
    .select("id, email, invited_name, status, expires_at")
    .eq("token_hash", hashToken(rawToken))
    .maybeSingle();
  if (!data) return null;
  if (data.status !== "pending" || new Date(data.expires_at) < new Date()) return null;
  return data;
}

export type CreatedInvitation = {
  invitationId: string;
  email: string;
  link: string;
  emailResult: EmailResult;
};

/**
 * Creates an invitation for an allowlisted email. Only the sha256 hash of the token is stored;
 * the raw token exists only in the emailed/returned link. Supersedes older pending invitations.
 */
export async function createInvitation(
  email: string,
  invitedBy: string | null
): Promise<CreatedInvitation> {
  const normalized = email.trim().toLowerCase();
  const member = findAllowedMemberByEmail(normalized);
  if (!member) throw new Error("That email is not on the TreatTracker allowlist.");

  const db = createServiceClient();
  await db
    .from("invitations")
    .update({ status: "revoked" })
    .eq("email", normalized)
    .eq("status", "pending");

  const rawToken = randomBytes(32).toString("base64url");
  const days = await expiryDays();

  const { data, error } = await db
    .from("invitations")
    .insert({
      email: normalized,
      invited_name: member.fullName,
      token_hash: hashToken(rawToken),
      expires_at: new Date(Date.now() + days * 86_400_000).toISOString(),
      invited_by: invitedBy,
    })
    .select("id")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Could not create invitation.");

  const link = invitationLink(rawToken);
  const emailResult = await sendEmail({
    idempotencyKey: `invite:${data.id}`,
    to: normalized,
    template: "invitation",
    subject: "You're invited to TreatTracker",
    html: `<p>Hi ${escapeHtml(member.fullName)},</p>
<p>You've been invited to TreatTracker. Set your password to join:</p>
<p><a href="${link}">${link}</a></p>
<p>This link expires in ${days} days and can be used once.</p>`,
  });

  return { invitationId: data.id, email: normalized, link, emailResult };
}
