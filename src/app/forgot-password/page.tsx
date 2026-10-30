import Link from "next/link";
import { AuthCard } from "@/components/layout/auth-card";

export default function ForgotPasswordPage() {
  return (
    <AuthCard title="Forgot your password?" description="Recovery goes through the leader.">
      <p className="text-sm text-muted">
        Ask Hamza to send you a fresh invitation from <span className="text-foreground">Leader → Invites</span>.
        Opening the new link lets you choose a new password for your existing account.
      </p>
      <Link href="/login" className="mt-5 inline-block text-sm text-accent hover:underline">
        Back to sign in
      </Link>
    </AuthCard>
  );
}
