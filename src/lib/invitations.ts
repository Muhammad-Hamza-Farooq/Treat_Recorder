import { createHash, randomBytes } from "node:crypto";
import { findAllowedMemberByEmail } from "@/config/allowed-members";
import { escapeHtml, sendEmail, type EmailResult } from "@/lib/email";
import { createServiceClient } from "@/lib/supabase/server";

/** Unambiguous alphabet (no 0/O/1/I) for codes humans type from WhatsApp. */
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function hashToken(rawToken: string): string {
  return createHash("sha256").update(rawToken).digest("hex");
}

export function invitationLink(rawToken: string): string {
  const base = appBaseUrl();
  return `${base}/accept-invitation?token=${rawToken}`;
}

export function invitationCodeLink(setupCode: string): string {
  return `${appBaseUrl()}/accept-invitation?code=${encodeURIComponent(setupCode)}`;
}

function appBaseUrl() {
  const raw = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const base = raw.replace(/\/$/, "");
  return base.includes("localhost") && process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : base.includes("localhost")
      ? "https://treat-recorder.vercel.app"
      : base;
}

/** Short one-time setup code, e.g. TT-7K2MP9QX */
export function generateSetupCode(): string {
  const bytes = randomBytes(8);
  let body = "";
  for (let i = 0; i < 8; i++) body += CODE_ALPHABET[bytes[i]! % CODE_ALPHABET.length];
  return `TT-${body.slice(0, 4)}-${body.slice(4)}`;
}

async function expiryDays(): Promise<number> {
  const { data } = await createServiceClient()
    .from("app_settings")
    .select("value")
    .eq("key", "invitation_expiry_days")
    .maybeSingle();
  const days = Number(data?.value);
  return Number.isFinite(days) && days > 0 ? days : 14;
}

export type UsableInvitation = {
  id: string;
  email: string;
  invited_name: string;
  status: string;
  expires_at: string;
  setup_code: string | null;
};

function isUsable(data: { status: string; expires_at: string } | null): boolean {
  if (!data) return false;
  return data.status === "pending" && new Date(data.expires_at) >= new Date();
}

/** Validates a raw invitation token (service role). */
export async function findUsableInvitation(rawToken: string): Promise<UsableInvitation | null> {
  const { data } = await createServiceClient()
    .from("invitations")
    .select("id, email, invited_name, status, expires_at, setup_code")
    .eq("token_hash", hashToken(rawToken))
    .maybeSingle();
  if (!isUsable(data)) return null;
  return data as UsableInvitation;
}

/** Validates a short setup code the leader shared in person. */
export async function findUsableInvitationByCode(rawCode: string): Promise<UsableInvitation | null> {
  const code = rawCode.trim().toUpperCase().replace(/\s+/g, "");
  if (code.length < 6) return null;
  const { data } = await createServiceClient()
    .from("invitations")
    .select("id, email, invited_name, status, expires_at, setup_code")
    .eq("setup_code", code)
    .eq("status", "pending")
    .maybeSingle();
  if (!isUsable(data)) return null;
  return data as UsableInvitation;
}

export type CreatedInvitation = {
  invitationId: string;
  email: string;
  link: string;
  setupCode: string;
  codeLink: string;
  emailResult: EmailResult;
};

/**
 * Creates an invitation for an allowlisted email.
 * Stores a short setup_code the leader can share without email (Resend test-domain workaround).
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
  const setupCode = generateSetupCode();
  const days = await expiryDays();

  const { data, error } = await db
    .from("invitations")
    .insert({
      email: normalized,
      invited_name: member.fullName,
      token_hash: hashToken(rawToken),
      setup_code: setupCode,
      expires_at: new Date(Date.now() + days * 86_400_000).toISOString(),
      invited_by: invitedBy,
    })
    .select("id")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Could not create invitation.");

  const link = invitationLink(rawToken);
  const codeLink = invitationCodeLink(setupCode);
  const emailResult = await sendEmail({
    idempotencyKey: `invite:${data.id}`,
    to: normalized,
    template: "invitation",
    subject: "Set your TreatTracker password",
    html: `<p>Hi ${escapeHtml(member.fullName)},</p>
<p>Use this link to set your TreatTracker password:</p>
<p><a href="${link}">Set my password</a></p>
<p>Or enter this one-time code on the site: <strong>${escapeHtml(setupCode)}</strong></p>
<p>This invite expires in ${days} days and can be used once.</p>`,
  });

  return {
    invitationId: data.id,
    email: normalized,
    link,
    setupCode,
    codeLink,
    emailResult,
  };
}
