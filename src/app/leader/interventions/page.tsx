import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { Card, EmptyState } from "@/components/ui/primitives";
import { requireLeader } from "@/lib/auth";
import { formatDateTime } from "@/lib/datetime";
import { createClient } from "@/lib/supabase/server";

export default async function LeaderInterventionsPage() {
  const me = await requireLeader();
  const supabase = await createClient();
  const { data: items } = await supabase
    .from("leader_interventions")
    .select(
      "id, obligation_id, intervention_reason, status, action_taken, decision_reason, created_at, requester:profiles!leader_interventions_requested_by_fkey(full_name)"
    )
    .order("status", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <AppShell profile={me} title="Interventions" description="Treats where a member asked you to step in.">
      <Card>
        {!items || items.length === 0 ? (
          <EmptyState>No one has asked for help.</EmptyState>
        ) : (
          <ul className="divide-y divide-border">
            {items.map((i) => {
              const requester = i.requester as unknown as { full_name: string } | null;
              return (
                <li key={i.id} className="py-3 text-sm">
                  <Link href={`/treats/${i.obligation_id}`} className="block hover:text-accent">
                    <p>
                      <span className="font-medium">{requester?.full_name}</span>{" "}
                      <span className="text-muted">
                        · {i.status === "open" ? "open" : `resolved (${i.action_taken?.replaceAll("_", " ")})`} ·{" "}
                        {formatDateTime(i.created_at, me.timezone)}
                      </span>
                    </p>
                    <p className="text-muted">{i.intervention_reason}</p>
                    {i.decision_reason ? <p className="text-muted">Decision: {i.decision_reason}</p> : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </AppShell>
  );
}
