import { createHash } from "node:crypto";
import { getRequestContext } from "@/lib/request-context";
import { notifyLeader } from "@/lib/notifications";
import { writeAudit } from "@/lib/audit";
import { createServiceClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/auth";

/**
 * Soft device/IP policy: the first login registers the device; a login from an unfamiliar IP
 * creates a security_event and notifies the leader, but never blocks the login.
 */
export async function recordLoginDevice(profile: Pick<Profile, "id" | "full_name" | "email">) {
  const { ip, userAgent } = await getRequestContext();
  const db = createServiceClient();

  await db.from("profiles").update({ last_login_at: new Date().toISOString() }).eq("id", profile.id);

  const { data: devices } = await db
    .from("authorized_devices")
    .select("id, ip_address")
    .eq("user_id", profile.id);

  const known = devices?.find((d) => d.ip_address === ip);
  if (known) {
    await db
      .from("authorized_devices")
      .update({ last_seen_at: new Date().toISOString() })
      .eq("id", known.id);
  } else {
    const isFirst = !devices || devices.length === 0;
    await db.from("authorized_devices").insert({
      user_id: profile.id,
      ip_address: ip,
      user_agent: userAgent,
      device_fingerprint_hash: userAgent
        ? createHash("sha256").update(userAgent).digest("hex")
        : null,
      authorization_status: isFirst ? "authorized" : "unreviewed",
      last_seen_at: new Date().toISOString(),
    });

    if (!isFirst) {
      await db.from("security_events").insert({
        user_id: profile.id,
        attempted_email: profile.email,
        attempted_ip: ip,
        user_agent: userAgent,
        event_type: "unfamiliar_ip_login",
        event_details: { known_ips: devices?.map((d) => d.ip_address) ?? [] },
      });
      await notifyLeader({
        type: "security",
        title: "Login from a new network",
        message: `${profile.full_name} signed in from an unfamiliar IP (${ip}). Review it in Security.`,
      });
    }
  }

  await writeAudit({ actorId: profile.id, eventType: "auth.login", entityType: "profile", entityId: profile.id });
}
