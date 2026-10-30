import { createHash } from "crypto";
import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { findAllowedMemberByEmail, isLeaderEmail } from "@/config/allowed-members";
import { writeAudit } from "@/lib/audit";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const token = typeof body?.token === "string" ? body.token : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!token || password.length < 6) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const tokenHash = createHash("sha256").update(token).digest("hex");
  const supabase = createServiceClient();

  const { data: invite } = await supabase
    .from("invitations")
    .select("*")
    .eq("token_hash", tokenHash)
    .eq("status", "pending")
    .maybeSingle();

  if (!invite) {
    return NextResponse.json({ error: "Invite not found or already used." }, { status: 400 });
  }

  if (new Date(invite.expires_at).getTime() < Date.now()) {
    await supabase.from("invitations").update({ status: "expired" }).eq("id", invite.id);
    return NextResponse.json({ error: "Invite expired." }, { status: 400 });
  }

  const email = String(invite.email).toLowerCase();
  if (!email.endsWith("@itu.edu.pk")) {
    return NextResponse.json({ error: "Only @itu.edu.pk emails are allowed." }, { status: 400 });
  }

  const allowed = findAllowedMemberByEmail(email);
  if (!allowed) {
    return NextResponse.json({ error: "This email is not on the allowlist." }, { status: 400 });
  }

  const role = isLeaderEmail(email) ? "leader" : "member";

  const { data: created, error: createError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: invite.invited_name },
  });

  if (createError || !created.user) {
    return NextResponse.json(
      { error: createError?.message ?? "Could not create account." },
      { status: 400 }
    );
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .upsert(
      {
        auth_user_id: created.user.id,
        full_name: invite.invited_name || allowed.fullName,
        email,
        role,
        account_status: "active",
        timezone: "Asia/Karachi",
      },
      { onConflict: "email" }
    )
    .select("id")
    .single();

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  await supabase
    .from("invitations")
    .update({ status: "accepted", accepted_at: new Date().toISOString() })
    .eq("id", invite.id);

  // First device authorization (registration IP if available)
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() ?? request.headers.get("x-real-ip") ?? "unknown";
  await supabase.from("authorized_devices").insert({
    user_id: profile.id,
    ip_address: ip,
    user_agent: request.headers.get("user-agent"),
    authorization_status: "authorized",
    authorized_by: profile.id,
  });

  await writeAudit({
    actorId: profile.id,
    eventType: "auth.invitation_accepted",
    entityType: "invitation",
    entityId: invite.id,
    metadata: { email, role, ip },
  });

  return NextResponse.json({ ok: true });
}
