import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { Card, EmptyState, LinkButton, SectionTitle, StatusBadge } from "@/components/ui/primitives";
import { requireProfile } from "@/lib/auth";
import { formatDateTime } from "@/lib/datetime";
import { listObligations } from "@/lib/queries";
import type { ObligationRow } from "@/types/treat";

function TreatList({ rows, meId, emptyText }: { rows: ObligationRow[]; meId: string; emptyText: string }) {
  if (rows.length === 0) return <EmptyState>{emptyText}</EmptyState>;
  return (
    <ul className="divide-y divide-border">
      {rows.map((o) => (
        <li key={o.id}>
          <Link href={`/treats/${o.id}`} className="flex items-center justify-between gap-3 py-3 hover:text-accent">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">
                {o.giver_id === meId ? `To ${o.requester?.full_name}` : `From ${o.giver?.full_name}`}
                <span className="font-normal text-muted"> · {o.request?.reason}</span>
              </p>
              <p className="text-xs text-muted">{formatDateTime(o.scheduled_at, o.timezone ?? "Asia/Karachi")}</p>
            </div>
            <StatusBadge status={o.status} />
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default async function TreatsPage() {
  const me = await requireProfile();
  const mine = await listObligations({ involving: me.id });

  return (
    <AppShell
      profile={me}
      title="My treats"
      description="What you owe and what you're owed."
      actions={<LinkButton href="/request-treat">Request a treat</LinkButton>}
    >
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <SectionTitle>I owe</SectionTitle>
          <TreatList rows={mine.filter((o) => o.giver_id === me.id)} meId={me.id} emptyText="You don't owe anyone a treat." />
        </Card>
        <Card>
          <SectionTitle>Owed to me</SectionTitle>
          <TreatList
            rows={mine.filter((o) => o.requester_id === me.id)}
            meId={me.id}
            emptyText="Nobody owes you yet. Request a treat."
          />
        </Card>
      </div>
    </AppShell>
  );
}
