import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { LEADER_STUDENT_ID, findAllowedMemberByEmail, getLeaderEmail } from "@/config/allowed-members";
import { writeAudit } from "@/lib/audit";
import { createInvitation } from "@/lib/invitations";
import { createServiceClient } from "@/lib/supabase/server";

function authorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret || secret.length < 16) return false;
  const given = Buffer.from(request.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret}`);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

/**
 * One-time leader bootstrap, protected by CRON_SECRET.
 * - Leader already joined  -> 409, nothing changes.
 * - SEED_LEADER_PASSWORD set -> creates the leader auth user + profile directly.
 * - Otherwise -> creates a fresh leader invitation (superseding an older pending one) and returns the link.
 */
export async function POST(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const email = getLeaderEmail();
  const leader = findAllowedMemberByEmail(email);
  if (!leader || leader.studentId !== LEADER_STUDENT_ID || leader.role !== "leader") {
    return NextResponse.json({ error: "LEADER_EMAIL must be Hamza's allowlisted email." }, { status: 500 });
  }

  const db = createServiceClient();
  const { data: existing } = await db
    .from("profiles")
    .select("id, auth_user_id")
    .eq("email", email)
    .maybeSingle();
  if (existing?.auth_user_id) {
    return NextResponse.json({ status: "already-bootstrapped", email }, { status: 409 });
  }

  const password = process.env.SEED_LEADER_PASSWORD;
  if (password) {
    if (password.length < 6) {
      return NextResponse.json({ error: "SEED_LEADER_PASSWORD must be at least 6 characters." }, { status: 500 });
    }
    const { data: created, error } = await db.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: leader.fullName },
    });
    if (error || !created.user) {
      return NextResponse.json({ error: error?.message ?? "Could not create user." }, { status: 500 });
    }
    const { data: profile, error: profileError } = await db
      .from("profiles")
      .insert({
        auth_user_id: created.user.id,
        full_name: leader.fullName,
        email,
        role: "leader",
        account_status: "active",
      })
      .select("id")
      .single();
    if (profileError || !profile) {
      await db.auth.admin.deleteUser(created.user.id);
      return NextResponse.json({ error: profileError?.message ?? "Could not create profile." }, { status: 500 });
    }
    await writeAudit({ actorId: profile.id, eventType: "bootstrap.leader_created", entityType: "profile", entityId: profile.id });
    return NextResponse.json({ status: "created", email });
  }

  const invite = await createInvitation(email, null);
  await writeAudit({ actorId: null, eventType: "bootstrap.leader_invited", entityType: "invitation", entityId: invite.invitationId });
  return NextResponse.json({ status: "invited", email, link: invite.link, emailResult: invite.emailResult });
}
