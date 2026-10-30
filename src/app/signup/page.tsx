import Link from "next/link";
import { requestPasswordSetup } from "@/app/actions/auth";
import { AuthCard } from "@/components/layout/auth-card";
import { ActionForm } from "@/components/ui/action-form";
import { Field, inputClass } from "@/components/ui/primitives";

export default function SignupPage() {
  return (
    <AuthCard
      title="Sign up"
      description="Enter your ITU email. If you’re on the allowlist and don’t have a password yet, we’ll email you a one-time invitation link to set one up."
    >
      <ActionForm action={requestPasswordSetup} submitLabel="Email me an invitation link" buttonClassName="w-full">
        <Field label="Email">
          <input
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@itu.edu.pk"
            required
            className={inputClass}
          />
        </Field>
      </ActionForm>
      <p className="mt-4 text-center text-sm text-muted">
        Already have a password?{" "}
        <Link href="/login" className="text-accent hover:underline">
          Sign in
        </Link>
      </p>
    </AuthCard>
  );
}
