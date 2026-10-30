import { resolveSecurityEvent } from "@/app/actions/leader";
import { AppShell } from "@/components/layout/app-shell";
import { Card, EmptyState, ghostButtonClass } from "@/components/ui/primitives";
import { requireLeader } from "@/lib/auth";
import { formatDateTime } from "@/lib/datetime";
import { createClient } from "@/lib/supabase/server";

export default async function LeaderSecurityPage() {
  const me = await requireLeader();
  const supabase = await createClient();
  const { data: events } = await supabase
    .from("security_events")
    .select("id, event_type, attempted_email, attempted_ip, resolution_status, created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <AppShell
      profile={me}
      title="Security"
      description="Logins from unfamiliar networks are allowed but flagged here."
    >
      <Card>
        {!events || events.length === 0 ? (
          <EmptyState>No security events.</EmptyState>
        ) : (
          <ul className="divide-y divide-border">
            {events.map((e) => (
              <li key={e.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0 text-sm">
                  <p className="font-medium">{e.event_type.replaceAll("_", " ")}</p>
                  <p className="text-xs text-muted">
                    {e.attempted_email} · {e.attempted_ip} · {formatDateTime(e.created_at, me.timezone)} · {e.resolution_status}
                  </p>
                </div>
                {e.resolution_status === "open" ? (
                  <form action={resolveSecurityEvent}>
                    <input type="hidden" name="id" value={e.id} />
                    <button className={ghostButtonClass}>Mark reviewed</button>
                  </form>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </AppShell>
  );
}
