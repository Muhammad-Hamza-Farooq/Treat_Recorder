import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anon || anon.startsWith("REPLACE_")) {
    throw new Error(
      "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local (see SECRETS.md)."
    );
  }

  return createBrowserClient(url, anon, {
    cookieOptions: {
      path: "/",
      sameSite: "lax",
      // Persist across browser restarts so navigating Calendar/Notifications keeps the session.
      maxAge: 60 * 60 * 24 * 30,
    },
  });
}
