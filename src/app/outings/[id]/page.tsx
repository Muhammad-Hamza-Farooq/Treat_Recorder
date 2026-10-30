import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { Card, SectionTitle, StatusBadge } from "@/components/ui/primitives";
import { requireProfile } from "@/lib/auth";
import { formatDateTime } from "@/lib/datetime";
import { createClient } from "@/lib/supabase/server";
import type { TreatStatus } from "@/types/treat";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function OutingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!uuidPattern.test(id)) notFound();

  const me = await requireProfile();
  const supabase = await createClient();
  const { data: event } = await supabase
    .from("treat_events")
    .select("id, title, location, description, starts_at, timezone, organizer:profiles!treat_events_organizer_id_fkey(full_name)")
    .eq("id", id)
    .maybeSingle();
  if (!event) notFound();

  const { data: attendees } = await supabase
    .from("event_attendees")
    .select(
      "id, attendance_status, obligation_id, member:profiles!event_attendees_member_id_fkey(full_name), obligation:treat_obligations(status)"
    )
    .eq("event_id", id);

  const organizer = event.organizer as unknown as { full_name: string } | null;

  return (
    <AppShell
      profile={me}
      title={event.title}
      description={`${formatDateTime(event.starts_at, event.timezone)} · ${event.location ?? "No location"} · by ${organizer?.full_name}`}
    >
      <Card>
        {event.description ? <p className="mb-4 text-sm text-muted">{event.description}</p> : null}
        <SectionTitle>Attendees &amp; treats</SectionTitle>
        <ul className="divide-y divide-border">
          {(attendees ?? []).map((a) => {
            const member = a.member as unknown as { full_name: string } | null;
            const obligation = a.obligation as unknown as { status: TreatStatus } | null;
            return (
              <li key={a.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                <span>{member?.full_name}</span>
                {obligation && a.obligation_id ? (
                  <Link href={`/treats/${a.obligation_id}`}>
                    <StatusBadge status={obligation.status} />
                  </Link>
                ) : null}
              </li>
            );
          })}
        </ul>
        <p className="mt-4 text-xs text-muted">
          Showing up never completes anyone else&apos;s treat — each one is confirmed on its own page.
        </p>
      </Card>
    </AppShell>
  );
}
