import { setAccountStatus } from "@/app/actions/leader";
import { AppShell } from "@/components/layout/app-shell";
import { Card, ghostButtonClass } from "@/components/ui/primitives";
import { ALLOWED_MEMBERS, memberEmail } from "@/config/allowed-members";
import { requireLeader } from "@/lib/auth";
import { formatDate } from "@/lib/datetime";
import { createClient } from "@/lib/supabase/server";

export default async function LeaderUsersPage() {
  const me = await requireLeader();
  const supabase = await createClient();
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, account_status, last_login_at")
    .order("full_name");

  const joined = new Set((profiles ?? []).map((p) => p.email));
  const notJoined = ALLOWED_MEMBERS.filter((m) => !joined.has(memberEmail(m.studentId)));

  return (
    <AppShell profile={me} title="Members" description="Who has joined, and who still needs an invite.">
      <div className="space-y-6">
        <Card>
          <ul className="divide-y divide-border">
            {(profiles ?? []).map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium">
                    {p.full_name} <span className="font-normal text-muted">· {p.role}</span>
                  </p>
                  <p className="text-xs text-muted">
                    {p.email} · {p.account_status}
                    {p.last_login_at ? ` · last login ${formatDate(p.last_login_at, me.timezone)}` : ""}
                  </p>
                </div>
                {p.id !== me.id ? (
                  <form action={setAccountStatus}>
                    <input type="hidden" name="id" value={p.id} />
                    <input type="hidden" name="status" value={p.account_status === "active" ? "suspended" : "active"} />
                    <button className={ghostButtonClass}>{p.account_status === "active" ? "Suspend" : "Reactivate"}</button>
                  </form>
                ) : null}
              </li>
            ))}
          </ul>
        </Card>

        {notJoined.length > 0 ? (
          <Card>
            <h2 className="mb-2 text-sm font-medium">Not joined yet</h2>
            <ul className="text-sm text-muted">
              {notJoined.map((m) => (
                <li key={m.studentId}>
                  {m.fullName} · {memberEmail(m.studentId)}
                </li>
              ))}
            </ul>
          </Card>
        ) : null}
      </div>
    </AppShell>
  );
}
