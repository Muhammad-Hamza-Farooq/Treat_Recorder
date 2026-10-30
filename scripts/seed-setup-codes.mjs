/**
 * Generate one-time setup codes for every member without a login.
 * Usage: node --env-file=.env.local scripts/seed-setup-codes.mjs
 */
import { createHash, randomBytes } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function setupCode() {
  const bytes = randomBytes(8);
  let body = "";
  for (let i = 0; i < 8; i++) body += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  return `TT-${body.slice(0, 4)}-${body.slice(4)}`;
}
function hashToken(raw) {
  return createHash("sha256").update(raw).digest("hex");
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
const base = "https://treat-recorder.vercel.app";
const db = createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } });

const { data: profiles, error } = await db.from("profiles").select("email, full_name, auth_user_id").order("full_name");
if (error) {
  console.error(error.message);
  process.exit(1);
}

const rows = [];
for (const p of profiles ?? []) {
  if (p.auth_user_id) continue;
  const email = p.email.toLowerCase();
  const code = setupCode();
  const raw = randomBytes(32).toString("base64url");

  await db.from("invitations").update({ status: "revoked" }).eq("email", email).eq("status", "pending");
  const { data, error: insErr } = await db
    .from("invitations")
    .insert({
      email,
      invited_name: p.full_name,
      token_hash: hashToken(raw),
      setup_code: code,
      expires_at: new Date(Date.now() + 14 * 86_400_000).toISOString(),
    })
    .select("id")
    .single();
  if (insErr) {
    console.error(email, insErr.message);
    continue;
  }
  rows.push({
    name: p.full_name,
    email,
    code,
    link: `${base}/accept-invitation?code=${encodeURIComponent(code)}`,
    invitationId: data.id,
  });
}

console.log(JSON.stringify({ count: rows.length, members: rows }, null, 2));
