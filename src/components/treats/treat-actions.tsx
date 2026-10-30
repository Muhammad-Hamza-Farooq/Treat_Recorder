import { performTreatAction } from "@/app/actions/treats";
import { ActionForm } from "@/components/ui/action-form";
import { Field, inputClass } from "@/components/ui/primitives";
import { resolveTransition, type TreatAction } from "@/lib/treat-workflow";
import type { TreatStatus } from "@/types/treat";

type Kind = "schedule" | "reason" | "notes";

const ACTIONS: { action: TreatAction; label: string; kind: Kind; hint?: string }[] = [
  { action: "accept_schedule", label: "Accept & schedule", kind: "schedule" },
  { action: "accept_unscheduled", label: "Accept without a date", kind: "reason", hint: "Why can't you pick a date yet?" },
  { action: "schedule", label: "Set / change date", kind: "schedule" },
  { action: "delay", label: "Delay", kind: "reason", hint: "Why is this being delayed?" },
  { action: "confirm_completion", label: "Confirm completion", kind: "notes" },
  { action: "tag_leader", label: "Ask the leader to step in", kind: "reason", hint: "What do you need help with?" },
  { action: "leader_accept", label: "Leader: accept for giver", kind: "reason", hint: "Reason for accepting on their behalf" },
  { action: "leader_reject", label: "Leader: reject", kind: "reason", hint: "Reason for rejecting" },
  { action: "leader_override_complete", label: "Leader: mark completed", kind: "reason", hint: "Reason for the override" },
];

type Props = {
  obligationId: string;
  status: TreatStatus;
  isGiver: boolean;
  isRequester: boolean;
  isLeader: boolean;
  confirmedBy: ("giver" | "requester")[];
};

/** Shows only the actions the workflow currently allows for the signed-in user. */
export function TreatActions({ obligationId, status, isGiver, isRequester, isLeader, confirmedBy }: Props) {
  const available = ACTIONS.filter(
    (a) => resolveTransition({ action: a.action, status, isGiver, isRequester, isLeader, confirmedBy }).ok
  );

  if (available.length === 0) {
    return <p className="text-sm text-muted">No actions available right now.</p>;
  }

  return (
    <div className="space-y-2">
      {available.map((a) => (
        <details key={a.action} className="rounded-xl border border-border bg-surface px-4 py-3">
          <summary className="cursor-pointer text-sm font-medium">{a.label}</summary>
          <div className="mt-3">
            <ActionForm action={performTreatAction} submitLabel="Submit">
              <input type="hidden" name="action" value={a.action} />
              <input type="hidden" name="obligationId" value={obligationId} />
              {a.kind === "schedule" ? (
                <>
                  <Field label="Date & time">
                    <input type="datetime-local" name="scheduledAt" required className={inputClass} />
                  </Field>
                  <Field label="Location (optional)">
                    <input name="location" maxLength={200} className={inputClass} />
                  </Field>
                </>
              ) : null}
              {a.kind === "reason" ? (
                <Field label="Reason" hint={a.hint}>
                  <textarea name="reason" required minLength={5} maxLength={1000} rows={2} className={inputClass} />
                </Field>
              ) : null}
              {a.kind === "notes" ? (
                <Field label="Notes (optional)">
                  <input name="notes" maxLength={500} className={inputClass} />
                </Field>
              ) : null}
            </ActionForm>
          </div>
        </details>
      ))}
    </div>
  );
}
