import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import { AuthCard } from "@/components/layout/auth-card";
import { getCurrentProfile } from "@/lib/auth";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  if (await getCurrentProfile()) redirect("/dashboard");
  const { message } = await searchParams;

  return (
    <AuthCard title="Sign in" description="Use your ITU email and password.">
      {message ? (
        <p className="mb-4 rounded-lg border border-accent/40 bg-accent-soft px-3 py-2 text-sm">{message}</p>
      ) : null}
      <LoginForm />
    </AuthCard>
  );
}
