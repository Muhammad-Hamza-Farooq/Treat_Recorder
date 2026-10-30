import Link from "next/link";
import { acceptInvitation } from "@/app/actions/auth";
import { PasswordField } from "@/components/auth/password-field";
import { AuthCard } from "@/components/layout/auth-card";
import { ActionForm } from "@/components/ui/action-form";
import { findUsableInvitation, findUsableInvitationByCode } from "@/lib/invitations";

export default async function AcceptInvitationPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; code?: string }>;
}) {
  const { token, code } = await searchParams;
  const invitation = token
    ? await findUsableInvitation(token)
    : code
      ? await findUsableInvitationByCode(code)
      : null;

  if ((!token && !code) || !invitation) {
    return (
      <AuthCard title="Invitation unavailable">
        <p className="text-sm text-muted">
          This invitation is invalid, expired, or already used. Ask Hamza for a new one-time code.
        </p>
        <div className="mt-5 flex flex-col gap-2 text-sm">
          <Link href="/setup" className="text-accent hover:underline">
            Enter a setup code
          </Link>
          <Link href="/login" className="text-muted hover:underline">
            Go to sign in
          </Link>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard title={`Welcome, ${invitation.invited_name}`} description={`Choose a password for ${invitation.email}.`}>
      <ActionForm action={acceptInvitation} submitLabel="Join TreatTracker" buttonClassName="w-full">
        {token ? <input type="hidden" name="token" value={token} /> : null}
        {code || invitation.setup_code ? (
          <input type="hidden" name="code" value={code || invitation.setup_code || ""} />
        ) : null}
        <PasswordField name="password" label="Password" hint="At least 6 characters." autoComplete="new-password" />
        <PasswordField name="confirm" label="Confirm password" autoComplete="new-password" />
      </ActionForm>
    </AuthCard>
  );
}
