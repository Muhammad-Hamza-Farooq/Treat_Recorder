import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { Card, EmptyState } from "@/components/ui/primitives";
import { requireProfile } from "@/lib/auth";
import { formatDateTime } from "@/lib/datetime";
import { createClient } from "@/lib/supabase/server";
import { TREAT_STATUS_LABELS, type TreatStatus } from "@/types/treat";

export default async function ActivityPage() {
  const me = await requireProfile();
  const supabase = await createClient();
  const { data: responses } = await supabase
    .from("treat_responses")
    .select(
      "id, obligation_id, response_type, explanation, new_status, created_at, responder:profiles!treat_responses_responder_id_fkey(full_name)"
    )
    .order("created_at", { ascending: false })
    .limit(30);

  return (
    <AppShell profile={me} title="Activity" description="The latest 30 treat updates across the group.">
      <Card>
        {!responses || responses.length === 0 ? (
          <EmptyState>No activity yet.</EmptyState>
        ) : (
          <ul className="divide-y divide-border">
            {responses.map((r) => {
              const responder = r.responder as unknown as { full_name: string } | null;
              return (
                <li key={r.id} className="py-3 text-sm">
                  <Link href={`/treats/${r.obligation_id}`} className="block hover:text-accent">
                    <p>
                      <span className="font-medium">{responder?.full_name}</span>{" "}
                      {r.response_type.replaceAll("_", " ")}
                      {r.new_status ? <span className="text-muted"> → {TREAT_STATUS_LABELS[r.new_status as TreatStatus]}</span> : null}
                    </p>
                    {r.explanation ? <p className="text-muted">{r.explanation}</p> : null}
                    <p className="text-xs text-muted">{formatDateTime(r.created_at, me.timezone)}</p>
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
