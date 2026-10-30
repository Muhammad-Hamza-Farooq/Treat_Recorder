import Link from "next/link";
import { redirect } from "next/navigation";
import { login } from "@/app/actions/auth";
import { AuthCard } from "@/components/layout/auth-card";
import { ActionForm } from "@/components/ui/action-form";
import { Field, inputClass } from "@/components/ui/primitives";
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
      <ActionForm action={login} submitLabel="Sign in" buttonClassName="w-full">
        <Field label="Email">
          <input
            name="email"
            type="email"
            autoComplete="email"
            placeholder="bscs23057@itu.edu.pk"
            required
            className={inputClass}
          />
        </Field>
        <Field label="Password">
          <input name="password" type="password" autoComplete="current-password" required className={inputClass} />
        </Field>
      </ActionForm>
      <p className="mt-4 text-center text-sm text-muted">
        <Link href="/forgot-password" className="hover:text-accent hover:underline">
          Forgot your password?
        </Link>
      </p>
    </AuthCard>
  );
}
