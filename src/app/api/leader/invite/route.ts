import { createHash, randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { requireProfile } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";
import { findAllowedMemberByEmail } from "@/config/allowed-members";
import { writeAudit } from "@/lib/audit";
import { sendEmail } from "@/lib/email";

export async function POST(request: Request) {
  const profile = await requireProfile();
  if (!profile || profile.role !== "leader") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const email = String(body?.email ?? "")
    .trim()
    .toLowerCase();
  const notes = typeof body?.notes === "string" ? body.notes : "";

  if (!email.endsWith("@itu.edu.pk")) {
    return NextResponse.json({ error: "Only @itu.edu.pk emails allowed." }, { status: 400 });
  }

  const allowed = findAllowedMemberByEmail(email);
  if (!allowed) {
    return NextResponse.json({ error: "Email not on allowlist." }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { data: existing } = await supabase
    .from("profiles")
    .select("id, auth_user_id")
    .eq("email", email)
    .maybeSingle();

  if (existing?.auth_user_id) {
    return NextResponse.json({ error: "Account already exists." }, { status: 400 });
  }

  await supabase
    .from("invitations")
    .update({ status: "revoked" })
    .eq("email", email)
    .eq("status", "pending");

  const rawToken = randomBytes(32).toString("hex");
  const tokenHash = createHash("sha256").update(rawToken).digest("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data: invite, error } = await supabase
    .from("invitations")
    .insert({
      email,
      invited_name: allowed.fullName,
      token_hash: tokenHash,
      status: "pending",
      expires_at: expiresAt,
      invited_by: profile.id,
      notes: notes || null,
    })
    .select("id")
    .single();

  if (error || !invite) {
    return NextResponse.json({ error: error?.message ?? "Failed" }, { status: 500 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const acceptUrl = `${appUrl}/accept-invitation?token=${rawToken}`;

  await sendEmail({
    idempotencyKey: `invite:${invite.id}`,
    to: email,
    subject: "You’re invited to TreatTracker",
    template: "invitation",
    html: `<p>Hi ${allowed.fullName},</p><p>Hamza invited you to TreatTracker.</p><p><a href="${acceptUrl}">Accept invite</a></p><p>This link expires in 7 days.</p>`,
  });

  await writeAudit({
    actorId: profile.id,
    eventType: "invitation.created",
    entityType: "invitation",
    entityId: invite.id,
    metadata: { email },
  });

  // Always return acceptUrl so leader can share if email domain isn’t verified yet
  return NextResponse.json({ ok: true, acceptUrl });
}
