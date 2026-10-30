import Link from "next/link";
import { createOuting } from "@/app/actions/outings";
import { AppShell } from "@/components/layout/app-shell";
import { ActionForm } from "@/components/ui/action-form";
import { Card, EmptyState, Field, SectionTitle, inputClass } from "@/components/ui/primitives";
import { requireProfile } from "@/lib/auth";
import { formatDateTime } from "@/lib/datetime";
import { listObligations } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";

const SCHEDULABLE = ["PENDING", "ACCEPTED_UNSCHEDULED", "TEMPORARILY_DELAYED", "SCHEDULED"];

export default async function OutingsPage() {
  const me = await requireProfile();
  const supabase = await createClient();
  const [{ data: events }, owed] = await Promise.all([
    supabase
      .from("treat_events")
      .select("id, title, location, starts_at, timezone, organizer:profiles!treat_events_organizer_id_fkey(full_name)")
      .order("starts_at", { ascending: false }),
    listObligations({ involving: me.id }),
  ]);

  const linkable = owed.filter((o) => o.giver_id === me.id && SCHEDULABLE.includes(o.status));

  return (
    <AppShell profile={me} title="Outings" description="Group events that schedule the treats you owe.">
      <div className="space-y-6">
        <Card>
          <SectionTitle>Plan an outing</SectionTitle>
          {linkable.length === 0 ? (
            <EmptyState>You have no open treats to link. Outings schedule treats you owe.</EmptyState>
          ) : (
            <ActionForm action={createOuting} submitLabel="Create outing">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Title">
                  <input name="title" required maxLength={120} className={inputClass} />
                </Field>
                <Field label="Date & time">
                  <input type="datetime-local" name="startsAt" required className={inputClass} />
                </Field>
                <Field label="Location (optional)">
                  <input name="location" maxLength={200} className={inputClass} />
                </Field>
                <Field label="Description (optional)">
                  <input name="description" maxLength={1000} className={inputClass} />
                </Field>
              </div>
              <fieldset className="space-y-2">
                <legend className="text-sm font-medium">Treats this outing covers</legend>
                {linkable.map((o) => (
                  <label key={o.id} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" name="obligationIds" value={o.id} className="accent-[var(--accent)]" />
                    Treat for {o.requester?.full_name} — {o.request?.reason}
                  </label>
                ))}
                <p className="text-xs text-muted">Each treat still needs its own completion confirmation.</p>
              </fieldset>
            </ActionForm>
          )}
        </Card>

        <Card>
          <SectionTitle>All outings</SectionTitle>
          {!events || events.length === 0 ? (
            <EmptyState>No outings yet.</EmptyState>
          ) : (
            <ul className="divide-y divide-border">
              {events.map((e) => {
                const organizer = e.organizer as unknown as { full_name: string } | null;
                return (
                  <li key={e.id}>
                    <Link href={`/outings/${e.id}`} className="block py-3 hover:text-accent">
                      <p className="text-sm font-medium">{e.title}</p>
                      <p className="text-xs text-muted">
                        {formatDateTime(e.starts_at, e.timezone)} · {e.location ?? "No location"} · by {organizer?.full_name}
                      </p>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>
    </AppShell>
  );
}
