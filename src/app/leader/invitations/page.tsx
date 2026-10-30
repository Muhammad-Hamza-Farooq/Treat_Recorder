import { createInvite, revokeInvite } from "@/app/actions/leader";
import { AppShell } from "@/components/layout/app-shell";
import { ActionForm } from "@/components/ui/action-form";
import { Card, EmptyState, Field, SectionTitle, ghostButtonClass, inputClass } from "@/components/ui/primitives";
import { ALLOWED_MEMBERS, memberEmail } from "@/config/allowed-members";
import { requireLeader } from "@/lib/auth";
import { formatDate } from "@/lib/datetime";
import { createClient } from "@/lib/supabase/server";

export default async function LeaderInvitationsPage() {
  const me = await requireLeader();
  const supabase = await createClient();
  const { data: invitations } = await supabase
    .from("invitations")
    .select("id, email, invited_name, status, expires_at, created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <AppShell
      profile={me}
      title="Invites"
      description="Invite an allowlisted member, or re-invite someone who forgot their password."
    >
      <div className="space-y-6">
        <Card className="max-w-xl">
          <SectionTitle>New invitation</SectionTitle>
          <ActionForm action={createInvite} submitLabel="Create invitation">
            <Field label="Member" hint="Only people on the allowlist can be invited.">
              <select name="email" required defaultValue="" className={inputClass}>
                <option value="" disabled>
                  Choose a member
                </option>
                {ALLOWED_MEMBERS.map((m) => (
                  <option key={m.studentId} value={memberEmail(m.studentId)}>
                    {m.fullName} · {memberEmail(m.studentId)}
                  </option>
                ))}
              </select>
            </Field>
          </ActionForm>
        </Card>

        <Card>
          <SectionTitle>History</SectionTitle>
          {!invitations || invitations.length === 0 ? (
            <EmptyState>No invitations yet.</EmptyState>
          ) : (
            <ul className="divide-y divide-border">
              {invitations.map((i) => (
                <li key={i.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{i.invited_name}</p>
                    <p className="text-xs text-muted">
                      {i.email} · {i.status} · expires {formatDate(i.expires_at, me.timezone)}
                    </p>
                  </div>
                  {i.status === "pending" ? (
                    <form action={revokeInvite}>
                      <input type="hidden" name="id" value={i.id} />
                      <button className={ghostButtonClass}>Revoke</button>
                    </form>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </AppShell>
  );
}
