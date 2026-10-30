import Link from "next/link";
import { requestPasswordSetup } from "@/app/actions/auth";
import { AuthCard } from "@/components/layout/auth-card";
import { ActionForm } from "@/components/ui/action-form";
import { Field, inputClass } from "@/components/ui/primitives";

export default function ForgotPasswordPage() {
  return (
    <AuthCard
      title="Reset your password"
      description="Enter your ITU email. We’ll send a one-time link to set a new password."
    >
      <ActionForm action={requestPasswordSetup} submitLabel="Email me a reset link" buttonClassName="w-full">
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
        First time here?{" "}
        <Link href="/signup" className="text-accent hover:underline">
          Sign up
        </Link>
        {" · "}
        <Link href="/login" className="hover:text-accent hover:underline">
          Sign in
        </Link>
      </p>
    </AuthCard>
  );
}
