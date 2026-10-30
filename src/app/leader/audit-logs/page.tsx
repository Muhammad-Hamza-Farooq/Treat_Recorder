import { AppShell } from "@/components/layout/app-shell";
import { Card, EmptyState } from "@/components/ui/primitives";
import { requireLeader } from "@/lib/auth";
import { formatDateTime } from "@/lib/datetime";
import { createClient } from "@/lib/supabase/server";

export default async function LeaderAuditLogsPage() {
  const me = await requireLeader();
  const supabase = await createClient();
  const { data: logs } = await supabase
    .from("audit_logs")
    .select("id, event_type, entity_type, ip_address, created_at, actor:profiles!audit_logs_actor_id_fkey(full_name)")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <AppShell profile={me} title="Audit" description="The latest 100 recorded actions.">
      <Card>
        {!logs || logs.length === 0 ? (
          <EmptyState>Nothing recorded yet.</EmptyState>
        ) : (
          <ul className="divide-y divide-border">
            {logs.map((l) => {
              const actor = l.actor as unknown as { full_name: string } | null;
              return (
                <li key={l.id} className="py-2.5 text-sm">
                  <span className="font-medium">{l.event_type}</span>{" "}
                  <span className="text-muted">
                    · {actor?.full_name ?? "system"} · {l.ip_address ?? "—"} · {formatDateTime(l.created_at, me.timezone)}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </AppShell>
  );
}
