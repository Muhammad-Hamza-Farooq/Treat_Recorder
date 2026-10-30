import Link from "next/link";
import { acceptInvitation } from "@/app/actions/auth";
import { PasswordField } from "@/components/auth/password-field";
import { AuthCard } from "@/components/layout/auth-card";
import { ActionForm } from "@/components/ui/action-form";
import { findUsableInvitation } from "@/lib/invitations";

export default async function AcceptInvitationPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const invitation = token ? await findUsableInvitation(token) : null;

  if (!token || !invitation) {
    return (
      <AuthCard title="Invitation unavailable">
        <p className="text-sm text-muted">
          This invitation link is invalid, expired, or already used. Ask Hamza for a new one.
        </p>
        <Link href="/login" className="mt-5 inline-block text-sm text-accent hover:underline">
          Go to sign in
        </Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard title={`Welcome, ${invitation.invited_name}`} description={`Choose a password for ${invitation.email}.`}>
      <ActionForm action={acceptInvitation} submitLabel="Join TreatTracker" buttonClassName="w-full">
        <input type="hidden" name="token" value={token} />
        <PasswordField name="password" label="Password" hint="At least 6 characters." autoComplete="new-password" />
        <PasswordField name="confirm" label="Confirm password" autoComplete="new-password" />
      </ActionForm>
    </AuthCard>
  );
}
