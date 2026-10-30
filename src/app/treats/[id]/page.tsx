import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { TreatActions } from "@/components/treats/treat-actions";
import { Card, EmptyState, SectionTitle, StatusBadge } from "@/components/ui/primitives";
import { requireProfile } from "@/lib/auth";
import { formatDateTime } from "@/lib/datetime";
import { getObligation } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function TreatDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!uuidPattern.test(id)) notFound();

  const me = await requireProfile();
  const obligation = await getObligation(id);
  if (!obligation) notFound();

  const supabase = await createClient();
  const [{ data: responses }, { data: confirmations }] = await Promise.all([
    supabase
      .from("treat_responses")
      .select("id, response_type, explanation, new_status, created_at, responder:profiles!treat_responses_responder_id_fkey(full_name)")
      .eq("obligation_id", id)
      .order("created_at", { ascending: false }),
    supabase.from("treat_confirmations").select("confirmer_id").eq("obligation_id", id),
  ]);

  const confirmedBy = (confirmations ?? []).map((c) =>
    c.confirmer_id === obligation.giver_id ? ("giver" as const) : ("requester" as const)
  );
  const tz = me.timezone;
  const rows: [string, string][] = [
    ["Giver", obligation.giver?.full_name ?? "—"],
    ["Requester", obligation.requester?.full_name ?? "—"],
    ["When", formatDateTime(obligation.scheduled_at, tz)],
    ["Where", obligation.location ?? "—"],
    ["Treat", obligation.request?.requested_treat ?? "—"],
  ];

  return (
    <AppShell
      profile={me}
      title={obligation.request?.reason ?? "Treat"}
      description={obligation.request?.achievement_description}
      actions={<StatusBadge status={obligation.status} />}
    >
      <div className="grid gap-6 md:grid-cols-5">
        <div className="space-y-6 md:col-span-3">
          <Card>
            <dl className="grid grid-cols-[7rem_1fr] gap-y-2 text-sm">
              {rows.map(([k, v]) => (
                <div key={k} className="contents">
                  <dt className="text-muted">{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
              {obligation.request?.additional_notes ? (
                <div className="contents">
                  <dt className="text-muted">Notes</dt>
                  <dd>{obligation.request.additional_notes}</dd>
                </div>
              ) : null}
              {obligation.scheduling_reason ? (
                <div className="contents">
                  <dt className="text-muted">Unscheduled because</dt>
                  <dd>{obligation.scheduling_reason}</dd>
                </div>
              ) : null}
              {obligation.delay_reason ? (
                <div className="contents">
                  <dt className="text-muted">Delayed because</dt>
                  <dd>{obligation.delay_reason}</dd>
                </div>
              ) : null}
              {confirmedBy.length > 0 && obligation.status === "COMPLETION_PENDING" ? (
                <div className="contents">
                  <dt className="text-muted">Confirmed by</dt>
                  <dd>{confirmedBy.join(" & ")} — waiting for the other side</dd>
                </div>
              ) : null}
            </dl>
          </Card>

          <Card>
            <SectionTitle>History</SectionTitle>
            {!responses || responses.length === 0 ? (
              <EmptyState>No activity yet.</EmptyState>
            ) : (
              <ul className="space-y-3">
                {responses.map((r) => {
                  const responder = r.responder as unknown as { full_name: string } | null;
                  return (
                    <li key={r.id} className="text-sm">
                      <p>
                        <span className="font-medium">{responder?.full_name}</span>{" "}
                        <span className="text-muted">
                          {r.response_type.replaceAll("_", " ")} · {formatDateTime(r.created_at, tz)}
                        </span>
                      </p>
                      {r.explanation ? <p className="text-muted">{r.explanation}</p> : null}
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </div>

        <div className="md:col-span-2">
          <Card>
            <SectionTitle>Actions</SectionTitle>
            <TreatActions
              obligationId={obligation.id}
              status={obligation.status}
              isGiver={me.id === obligation.giver_id}
              isRequester={me.id === obligation.requester_id}
              isLeader={me.role === "leader"}
              confirmedBy={confirmedBy}
            />
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
