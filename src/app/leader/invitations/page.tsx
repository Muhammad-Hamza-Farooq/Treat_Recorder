import { createInvite, generateAllSetupCodes, revokeInvite } from "@/app/actions/leader";
import { CopyCodeButton } from "@/components/leader/copy-code-button";
import { AppShell } from "@/components/layout/app-shell";
import { ActionForm } from "@/components/ui/action-form";
import {
  Card,
  EmptyState,
  Field,
  SectionTitle,
  buttonClass,
  ghostButtonClass,
  inputClass,
} from "@/components/ui/primitives";
import { ALLOWED_MEMBERS, memberEmail } from "@/config/allowed-members";
import { requireLeader } from "@/lib/auth";
import { formatDate } from "@/lib/datetime";
import { invitationCodeLink } from "@/lib/invitations";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export default async function LeaderInvitationsPage() {
  const me = await requireLeader();
  const supabase = await createClient();
  const db = createServiceClient();

  const [{ data: invitations }, { data: profiles }] = await Promise.all([
    supabase
      .from("invitations")
      .select("id, email, invited_name, status, expires_at, created_at, setup_code")
      .order("created_at", { ascending: false })
      .limit(100),
    db.from("profiles").select("email, full_name, auth_user_id").order("full_name"),
  ]);

  const pendingByEmail = new Map(
    (invitations ?? []).filter((i) => i.status === "pending" && i.setup_code).map((i) => [i.email, i])
  );

  const roster = ALLOWED_MEMBERS.map((m) => {
    const email = memberEmail(m.studentId);
    const profile = (profiles ?? []).find((p) => p.email === email);
    const pending = pendingByEmail.get(email);
    return {
      name: m.fullName,
      email,
      canLogin: Boolean(profile?.auth_user_id),
      pending,
    };
  }).filter((r) => r.email !== me.email);

  return (
    <AppShell
      profile={me}
      title="Setup codes"
      description="No custom domain needed — copy each one-time code and send it on WhatsApp. Members enter it at /setup to set a password."
    >
      <div className="space-y-6">
        <Card>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <SectionTitle>Member codes</SectionTitle>
            <form action={generateAllSetupCodes}>
              <button type="submit" className={buttonClass}>
                Generate codes for everyone without login
              </button>
            </form>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[36rem] text-left text-sm">
              <thead className="border-b border-border text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="py-2 pr-3 font-medium">Member</th>
                  <th className="py-2 pr-3 font-medium">Status</th>
                  <th className="py-2 pr-3 font-medium">One-time code</th>
                  <th className="py-2 font-medium">Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {roster.map((row) => (
                  <tr key={row.email}>
                    <td className="py-3 pr-3">
                      <p className="font-medium">{row.name}</p>
                      <p className="text-xs text-muted">{row.email}</p>
                    </td>
                    <td className="py-3 pr-3 text-muted">
                      {row.canLogin ? "Can sign in" : row.pending ? "Code ready" : "Needs code"}
                    </td>
                    <td className="py-3 pr-3 font-mono text-sm tracking-wide">
                      {row.canLogin ? "—" : row.pending?.setup_code ?? "—"}
                    </td>
                    <td className="py-3">
                      {row.pending?.setup_code ? (
                        <div className="flex flex-wrap gap-2">
                          <CopyCodeButton value={row.pending.setup_code} label="Copy code" />
                          <CopyCodeButton value={invitationCodeLink(row.pending.setup_code)} label="Copy link" />
                        </div>
                      ) : row.canLogin ? (
                        <span className="text-xs text-muted">Done</span>
                      ) : (
                        <span className="text-xs text-muted">Generate above</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-xs text-muted">
            Tell them: open treat-recorder.vercel.app/setup → paste the code → set password. Codes expire{" "}
            {roster.find((r) => r.pending)?.pending
              ? formatDate(roster.find((r) => r.pending)!.pending!.expires_at, me.timezone)
              : "in about 14 days"}
            .
          </p>
        </Card>

        <Card className="max-w-xl">
          <SectionTitle>Create one code</SectionTitle>
          <ActionForm action={createInvite} submitLabel="Create / refresh code">
            <Field label="Member" hint="Creates a new one-time code (old pending codes for them are revoked).">
              <select name="email" required defaultValue="" className={inputClass}>
                <option value="" disabled>
                  Choose a member
                </option>
                {ALLOWED_MEMBERS.filter((m) => memberEmail(m.studentId) !== me.email).map((m) => (
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
                      {i.email} · {i.status}
                      {i.setup_code ? ` · ${i.setup_code}` : ""} · expires{" "}
                      {formatDate(i.expires_at, me.timezone)}
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
