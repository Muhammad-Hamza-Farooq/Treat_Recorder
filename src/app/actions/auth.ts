"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { findAllowedMemberByEmail, getAllowedEmailDomain } from "@/config/allowed-members";
import type { ActionState } from "@/components/ui/action-form";
import { writeAudit } from "@/lib/audit";
import { findUsableInvitation, findUsableInvitationByCode } from "@/lib/invitations";
import { recordLoginDevice } from "@/lib/security";
import { createClient, createServiceClient } from "@/lib/supabase/server";

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter your ITU email."),
  password: z.string().min(1, "Enter your password."),
});

/**
 * After browser sign-in, verify the member profile and record the device.
 * Session cookies are set by the browser client — this only validates access.
 */
export async function finalizeLogin(): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sign-in did not stick. Try again." };

  const { data: profile } = await createServiceClient()
    .from("profiles")
    .select("id, full_name, email, account_status")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (!profile || profile.account_status !== "active") {
    await supabase.auth.signOut();
    return { error: "Your account is not active. Ask Hamza for help." };
  }

  await recordLoginDevice(profile);
  return { success: "ok" };
}

/** @deprecated Prefer client LoginForm + finalizeLogin (reliable cookies). */
export async function login(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { email, password } = parsed.data;

  if (!email.endsWith(`@${getAllowedEmailDomain()}`)) {
    return { error: `Use your @${getAllowedEmailDomain()} email.` };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) return { error: "Incorrect email or password." };

  const { data: profile } = await createServiceClient()
    .from("profiles")
    .select("id, full_name, email, account_status")
    .eq("auth_user_id", data.user.id)
    .maybeSingle();

  if (!profile || profile.account_status !== "active") {
    await supabase.auth.signOut();
    return { error: "Your account is not active. Ask Hamza for help." };
  }

  await recordLoginDevice(profile);
  redirect("/dashboard");
}

const acceptSchema = z
  .object({
    token: z.string().optional(),
    code: z.string().optional(),
    password: z.string().min(6, "Use at least 6 characters.").max(72),
    confirm: z.string(),
  })
  .refine((v) => Boolean(v.token?.length || v.code?.trim()), {
    message: "Missing invitation token or setup code.",
    path: ["token"],
  })
  .refine((v) => v.password === v.confirm, { message: "Passwords do not match.", path: ["confirm"] });

const setupEmailSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter your ITU email."),
});

/**
 * Member enters only their allowlisted email → we email a one-time link to set a password.
 * Always returns a generic success message (no account enumeration).
 */
export async function requestPasswordSetup(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = setupEmailSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const email = parsed.data.email;

  const generic =
    "Ask Hamza for your one-time setup code (email sending is limited without a custom domain). Enter it at Setup with code.";

  if (!email.endsWith(`@${getAllowedEmailDomain()}`)) {
    return { success: generic };
  }

  const member = findAllowedMemberByEmail(email);
  if (!member) return { success: generic };

  try {
    const { createInvitation } = await import("@/lib/invitations");
    const invite = await createInvitation(email, null);
    await writeAudit({
      actorId: null,
      eventType: "auth.password_setup_requested",
      entityType: "invitation",
      entityId: invite.invitationId,
      metadata: { email, emailResult: invite.emailResult, setupCode: invite.setupCode },
    });
  } catch (error) {
    console.error("password setup invite failed", error);
    return { error: "Could not create a setup code. Ask Hamza for help." };
  }

  return { success: generic };
}

export async function acceptInvitation(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = acceptSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { token, code, password } = parsed.data;

  const invitation = token
    ? await findUsableInvitation(token)
    : code
      ? await findUsableInvitationByCode(code)
      : null;
  if (!invitation) return { error: "This invitation is invalid, expired, or already used." };

  const member = findAllowedMemberByEmail(invitation.email);
  if (!member) return { error: "This email is not on the allowlist." };

  const db = createServiceClient();
  const { data: existing } = await db
    .from("profiles")
    .select("id, auth_user_id")
    .eq("email", invitation.email)
    .maybeSingle();

  let profileId: string;

  if (existing?.auth_user_id) {
    // Re-invite = password recovery for an existing member.
    const { error } = await db.auth.admin.updateUserById(existing.auth_user_id, { password });
    if (error) return { error: error.message };
    await db.from("profiles").update({ account_status: "active" }).eq("id", existing.id);
    profileId = existing.id;
  } else {
    const { data: created, error } = await db.auth.admin.createUser({
      email: invitation.email,
      password,
      email_confirm: true,
      user_metadata: { full_name: member.fullName },
    });
    if (error || !created.user) return { error: error?.message ?? "Could not create your account." };

    // Role always comes from the server-side allowlist, never from the client.
    const profileRow = {
      auth_user_id: created.user.id,
      full_name: member.fullName,
      email: invitation.email,
      role: member.role,
      account_status: "active" as const,
    };
    const { data: profile, error: profileError } = existing
      ? await db.from("profiles").update(profileRow).eq("id", existing.id).select("id").single()
      : await db.from("profiles").insert(profileRow).select("id").single();

    if (profileError || !profile) {
      await db.auth.admin.deleteUser(created.user.id);
      return { error: profileError?.message ?? "Could not create your profile." };
    }
    profileId = profile.id;
  }

  await db
    .from("invitations")
    .update({
      status: "accepted",
      accepted_at: new Date().toISOString(),
      setup_code: null,
    })
    .eq("id", invitation.id);
  await writeAudit({
    actorId: profileId,
    eventType: "invitation.accepted",
    entityType: "invitation",
    entityId: invitation.id,
  });

  const supabase = await createClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: invitation.email,
    password,
  });
  if (signInError) redirect("/login?message=Account ready. Please sign in.");

  await recordLoginDevice({ id: profileId, full_name: member.fullName, email: invitation.email });
  redirect("/dashboard");
}
