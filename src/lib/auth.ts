import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type Profile = {
  id: string;
  auth_user_id: string | null;
  full_name: string;
  email: string;
  role: "leader" | "member";
  account_status: "active" | "suspended" | "pending";
  timezone: string;
};

const PROFILE_COLUMNS = "id, auth_user_id, full_name, email, role, account_status, timezone";

/** Profile of the signed-in user, or null (no session / no active profile). */
export const getCurrentProfile = cache(async (): Promise<Profile | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (!data || data.account_status !== "active") return null;
  return data as Profile;
});

/** Page guard: signed-in active member, else send to logout/login. */
export async function requireProfile(): Promise<Profile> {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/api/logout?reason=no-access");
  return profile;
}

/** Page guard: leader only; members are bounced to the dashboard. */
export async function requireLeader(): Promise<Profile> {
  const profile = await requireProfile();
  if (profile.role !== "leader") redirect("/dashboard");
  return profile;
}
