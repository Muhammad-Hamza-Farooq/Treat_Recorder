import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthCard } from "@/components/layout/auth-card";
import { Field, buttonClass, inputClass } from "@/components/ui/primitives";

async function goToCode(formData: FormData) {
  "use server";
  const code = String(formData.get("code") ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");
  if (code.length < 6) redirect("/setup?error=invalid");
  redirect(`/accept-invitation?code=${encodeURIComponent(code)}`);
}

export default async function SetupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <AuthCard
      title="Enter your setup code"
      description="Hamza will send you a one-time code (WhatsApp / in person). Enter it here to set your password."
    >
      {error ? (
        <p className="mb-4 rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
          That code looks too short. Check it and try again.
        </p>
      ) : null}
      <form action={goToCode} className="space-y-4">
        <Field label="One-time code" hint="Example: TT-7K2M-P9QX">
          <input
            name="code"
            required
            autoComplete="off"
            spellCheck={false}
            placeholder="TT-XXXX-XXXX"
            className={`${inputClass} font-mono tracking-wider uppercase`}
          />
        </Field>
        <button type="submit" className={`${buttonClass} w-full`}>
          Continue
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-muted">
        Already set a password?{" "}
        <Link href="/login" className="text-accent hover:underline">
          Sign in
        </Link>
      </p>
    </AuthCard>
  );
}
