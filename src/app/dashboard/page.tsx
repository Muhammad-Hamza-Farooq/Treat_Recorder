import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { Card, EmptyState, LinkButton, SectionTitle, StatusBadge } from "@/components/ui/primitives";
import { requireProfile } from "@/lib/auth";
import { formatDateTime } from "@/lib/datetime";
import { listObligations } from "@/lib/queries";
import { isOpenStatus } from "@/lib/treat-workflow";

export default async function DashboardPage() {
  const me = await requireProfile();
  const mine = await listObligations({ involving: me.id });

  const owe = mine.filter((o) => o.giver_id === me.id && isOpenStatus(o.status));
  const owed = mine.filter((o) => o.requester_id === me.id && isOpenStatus(o.status));
  const awaiting = owe.filter((o) => o.status === "PENDING");
  const completed = mine.filter((o) => o.status === "COMPLETED");
  const upcoming = mine
    .filter((o) => o.scheduled_at && isOpenStatus(o.status) && new Date(o.scheduled_at) > new Date())
    .sort((a, b) => a.scheduled_at!.localeCompare(b.scheduled_at!))
    .slice(0, 3);

  const stats = [
    { label: "I owe", value: owe.length },
    { label: "Owed to me", value: owed.length },
    { label: "Awaiting my reply", value: awaiting.length },
    { label: "Completed", value: completed.length },
  ];

  return (
    <AppShell
      profile={me}
      title={`Hi, ${me.full_name.split(" ")[0]}`}
      description="Where your treats stand right now."
      actions={<LinkButton href="/request-treat">Request a treat</LinkButton>}
    >
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {stats.map((s) => (
            <Card key={s.label} className="p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted">{s.label}</p>
              <p className="mt-2 font-heading text-3xl font-semibold">{s.value}</p>
            </Card>
          ))}
        </div>

        <Card>
          <SectionTitle>Coming up</SectionTitle>
          {upcoming.length === 0 ? (
            <EmptyState>Nothing scheduled yet.</EmptyState>
          ) : (
            <ul className="divide-y divide-border">
              {upcoming.map((o) => (
                <li key={o.id} className="flex items-center justify-between gap-3 py-3">
                  <Link href={`/treats/${o.id}`} className="min-w-0 hover:text-accent">
                    <p className="truncate text-sm font-medium">
                      {o.giver_id === me.id ? `You owe ${o.requester?.full_name}` : `${o.giver?.full_name} owes you`}
                    </p>
                    <p className="text-xs text-muted">{formatDateTime(o.scheduled_at, me.timezone)}</p>
                  </Link>
                  <StatusBadge status={o.status} />
                </li>
              ))}
            </ul>
          )}
        </Card>

        <div className="flex flex-wrap gap-2">
          {[
            ["/treats", "My treats"],
            ["/calendar", "Calendar"],
            ["/outings", "Outings"],
            ["/reviews", "Reviews"],
            ["/activity", "Activity"],
          ].map(([href, label]) => (
            <Link
              key={href}
              href={href}
              className="rounded-lg border border-border bg-card px-3 py-2 text-sm transition hover:border-accent hover:text-accent"
            >
              {label}
            </Link>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
