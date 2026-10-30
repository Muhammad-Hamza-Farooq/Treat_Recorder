/**
 * Ensures Hamza (leader) exists with password 333333.
 * Usage: node --env-file=.env.local scripts/ensure-hamza.mjs
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = (process.env.LEADER_EMAIL || "bscs23057@itu.edu.pk").toLowerCase();
const password = "333333";

if (!url || !service) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const db = createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } });

const { data: listed, error: listError } = await db.auth.admin.listUsers({ perPage: 200 });
if (listError) {
  console.error(listError.message);
  process.exit(1);
}

const existing = listed.users.find((u) => (u.email || "").toLowerCase() === email);

let userId;
if (existing) {
  const { data, error } = await db.auth.admin.updateUserById(existing.id, {
    password,
    email_confirm: true,
  });
  if (error) {
    console.error("updateUser failed:", error.message);
    process.exit(1);
  }
  userId = data.user.id;
  console.log("Updated Hamza password.");
} else {
  const { data, error } = await db.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: "Hamza" },
  });
  if (error) {
    console.error("createUser failed:", error.message);
    process.exit(1);
  }
  userId = data.user.id;
  console.log("Created Hamza auth user.");
}

const { data: profile, error: profileError } = await db
  .from("profiles")
  .upsert(
    {
      auth_user_id: userId,
      full_name: "Hamza",
      email,
      role: "leader",
      account_status: "active",
      timezone: "Asia/Karachi",
    },
    { onConflict: "email" }
  )
  .select("id, role")
  .single();

if (profileError) {
  console.error("profile upsert failed:", profileError.message);
  process.exit(1);
}

// Verify sign-in works
const anon = createClient(url, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const { error: signInError } = await anon.auth.signInWithPassword({ email, password });
if (signInError) {
  console.error("Sign-in verify failed:", signInError.message);
  process.exit(1);
}

console.log("OK", { email, profileId: profile.id, role: profile.role, password: "333333" });
