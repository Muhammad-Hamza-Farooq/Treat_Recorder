import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/** Routes reachable without a session. Everything else requires login. */
const PUBLIC_PATHS = [
  "/",
  "/login",
  "/signup",
  "/setup",
  "/forgot-password",
  "/accept-invitation",
  "/register",
];

function isPublic(pathname: string) {
  return (
    PUBLIC_PATHS.includes(pathname) ||
    pathname === "/api/logout" ||
    pathname === "/api/accept-invitation" ||
    pathname.startsWith("/api/bootstrap-leader")
  );
}

function copyCookies(from: NextResponse, to: NextResponse) {
  from.cookies.getAll().forEach((cookie) => {
    to.cookies.set(cookie);
  });
}

function noStore(response: NextResponse) {
  // Prevent Next.js from caching auth redirects into the client router
  // (prefetch of /calendar while logged out must not stick after login).
  response.headers.set("Cache-Control", "no-store, max-age=0");
  return response;
}

/** Refreshes the Supabase session cookies and gates non-public routes. */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  // Fail closed: never serve gated routes if auth config is missing.
  if (!url || !anon) {
    if (!isPublic(request.nextUrl.pathname)) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/login";
      loginUrl.search = "";
      return noStore(NextResponse.redirect(loginUrl));
    }
    return response;
  }

  const supabase = createServerClient(url, anon, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  if (!user && !isPublic(pathname)) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.search = "";
    const redirectResponse = noStore(NextResponse.redirect(loginUrl));
    copyCookies(response, redirectResponse);
    return redirectResponse;
  }

  // Already signed in — don't keep them on auth screens.
  if (
    user &&
    (pathname === "/login" ||
      pathname === "/signup" ||
      pathname === "/setup" ||
      pathname === "/forgot-password" ||
      pathname === "/register" ||
      pathname === "/")
  ) {
    const dash = request.nextUrl.clone();
    dash.pathname = "/dashboard";
    dash.search = "";
    const redirectResponse = noStore(NextResponse.redirect(dash));
    copyCookies(response, redirectResponse);
    return redirectResponse;
  }

  return noStore(response);
}
