import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { CalendarLazy, type CalendarEvent } from "@/components/calendar/calendar-lazy";
import { Card, EmptyState, SectionTitle, StatusBadge } from "@/components/ui/primitives";
import { requireProfile } from "@/lib/auth";
import { listObligations } from "@/lib/queries";
import { isOpenStatus } from "@/lib/treat-workflow";
import { createClient } from "@/lib/supabase/server";
import { TREAT_STATUS_COLORS } from "@/types/treat";

export default async function CalendarPage() {
  const me = await requireProfile();
  const supabase = await createClient();
  const [obligations, { data: outings }] = await Promise.all([
    listObligations(undefined, 100),
    supabase.from("treat_events").select("id, title, starts_at"),
  ]);

  const events: CalendarEvent[] = [
    ...obligations
      .filter((o) => o.scheduled_at && o.status !== "REJECTED")
      .map((o) => ({
        id: `o-${o.id}`,
        title: `${o.giver?.full_name} → ${o.requester?.full_name}`,
        start: o.scheduled_at!,
        color: TREAT_STATUS_COLORS[o.status],
        href: `/treats/${o.id}`,
      })),
    ...(outings ?? []).map((e) => ({
      id: `e-${e.id}`,
      title: e.title,
      start: e.starts_at,
      color: "#475569",
      href: `/outings/${e.id}`,
    })),
  ];

  // Treats with no real date stay here instead of getting a made-up one.
  const unscheduled = obligations.filter((o) => !o.scheduled_at && isOpenStatus(o.status));

  return (
    <AppShell profile={me} title="Calendar" description="Everyone's scheduled treats and outings.">
      <div className="grid gap-6 lg:grid-cols-4">
        <Card className="lg:col-span-3">
          <CalendarLazy events={events} />
        </Card>
        <Card className="h-fit">
          <SectionTitle>Unscheduled</SectionTitle>
          {unscheduled.length === 0 ? (
            <EmptyState>Everything has a date.</EmptyState>
          ) : (
            <ul className="space-y-3">
              {unscheduled.map((o) => (
                <li key={o.id}>
                  <Link href={`/treats/${o.id}`} className="block space-y-1 hover:text-accent">
                    <p className="text-sm font-medium">
                      {o.giver?.full_name} → {o.requester?.full_name}
                    </p>
                    <StatusBadge status={o.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </AppShell>
  );
}
