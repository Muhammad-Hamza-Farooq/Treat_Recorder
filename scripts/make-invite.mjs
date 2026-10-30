/**
 * Create an invitation link without sending email (Resend test-domain workaround).
 * Usage: node --env-file=.env.local scripts/make-invite.mjs bscs23087@itu.edu.pk
 */
import { createHash, randomBytes } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const email = (process.argv[2] || "").trim().toLowerCase();
if (!email.endsWith("@itu.edu.pk")) {
  console.error("Usage: node --env-file=.env.local scripts/make-invite.mjs EMAIL@itu.edu.pk");
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
const app = (process.env.NEXT_PUBLIC_APP_URL || "https://treat-recorder.vercel.app").replace(/\/$/, "");
// Prefer production URL for shareable links when local env points at localhost
const base = app.includes("localhost") ? "https://treat-recorder.vercel.app" : app;

const db = createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } });

const { data: profile } = await db.from("profiles").select("full_name").eq("email", email).maybeSingle();
const name = profile?.full_name || email.split("@")[0];

const raw = randomBytes(32).toString("base64url");
const hash = createHash("sha256").update(raw).digest("hex");

await db.from("invitations").update({ status: "revoked" }).eq("email", email).eq("status", "pending");

const { data, error } = await db
  .from("invitations")
  .insert({
    email,
    invited_name: name,
    token_hash: hash,
    expires_at: new Date(Date.now() + 7 * 86_400_000).toISOString(),
    invited_by: null,
  })
  .select("id")
  .single();

if (error) {
  console.error(error.message);
  process.exit(1);
}

console.log(
  JSON.stringify(
    {
      invitationId: data.id,
      email,
      name,
      link: `${base}/accept-invitation?token=${raw}`,
      note: "Share this link — Resend test sender cannot email other @itu.edu.pk addresses yet.",
    },
    null,
    2
  )
);
