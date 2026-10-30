"use client";

import { performTreatAction } from "@/app/actions/treats";
import { ActionForm } from "@/components/ui/action-form";
import { Field, inputClass } from "@/components/ui/primitives";
import { isOpenStatus, type TreatAction } from "@/lib/treat-workflow";
import type { TreatStatus } from "@/types/treat";

type Props = {
  obligationId: string;
  isGiver: boolean;
  isRequester: boolean;
  isLeader: boolean;
  status: TreatStatus;
};

function ActionBlock({
  action,
  obligationId,
  label,
  children,
}: {
  action: TreatAction;
  obligationId: string;
  label: string;
  children?: React.ReactNode;
}) {
  return (
    <ActionForm action={performTreatAction} submitLabel={label} buttonClassName="rounded-full">
      <input type="hidden" name="action" value={action} />
      <input type="hidden" name="obligationId" value={obligationId} />
      {children}
    </ActionForm>
  );
}

export function ObligationActions({
  obligationId,
  isGiver,
  isRequester,
  isLeader,
  status,
}: Props) {
  if (!isOpenStatus(status)) {
    return (
      <div className="rounded-2xl border border-border bg-card p-5 text-sm text-muted">
        This treat is closed.
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-2xl border border-border bg-card p-5">
      <h3 className="text-lg font-semibold tracking-tight">
        Take <span className="font-heading italic font-normal">action</span>
      </h3>

      {(isGiver || isLeader) && (
        <div className="grid gap-4">
          <ActionBlock action="accept_schedule" obligationId={obligationId} label="Accept & schedule">
            <Field label="When">
              <input name="scheduledAt" type="datetime-local" required className={inputClass} />
            </Field>
            <Field label="Where (optional)">
              <input name="location" className={inputClass} />
            </Field>
          </ActionBlock>
          <ActionBlock action="accept_unscheduled" obligationId={obligationId} label="Accept without a date">
            <Field label="Why no date yet?">
              <textarea name="reason" required minLength={5} className={`${inputClass} min-h-20`} />
            </Field>
          </ActionBlock>
          <ActionBlock action="delay" obligationId={obligationId} label="Temporarily delay">
            <Field label="Delay reason">
              <textarea name="reason" required minLength={5} className={`${inputClass} min-h-20`} />
            </Field>
          </ActionBlock>
          <ActionBlock action="schedule" obligationId={obligationId} label="Set / change date">
            <Field label="When">
              <input name="scheduledAt" type="datetime-local" required className={inputClass} />
            </Field>
            <Field label="Where (optional)">
              <input name="location" className={inputClass} />
            </Field>
          </ActionBlock>
        </div>
      )}

      {(isGiver || isRequester) && (
        <ActionBlock action="confirm_completion" obligationId={obligationId} label="Confirm completed">
          <Field label="Notes (optional)">
            <input name="notes" className={inputClass} />
          </Field>
        </ActionBlock>
      )}

      <ActionBlock action="tag_leader" obligationId={obligationId} label="Tag leader">
        <Field label="Message to Hamza">
          <textarea name="reason" required minLength={5} className={`${inputClass} min-h-20`} />
        </Field>
      </ActionBlock>

      {isLeader && (
        <div className="grid gap-4 border-t border-border pt-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Leader</p>
          <ActionBlock action="leader_accept" obligationId={obligationId} label="Accept on behalf">
            <Field label="Note">
              <textarea name="reason" required minLength={5} className={`${inputClass} min-h-16`} />
            </Field>
          </ActionBlock>
          <ActionBlock action="leader_reject" obligationId={obligationId} label="Reject request">
            <Field label="Rejection reason">
              <textarea name="reason" required minLength={5} className={`${inputClass} min-h-16`} />
            </Field>
          </ActionBlock>
          <ActionBlock
            action="leader_override_complete"
            obligationId={obligationId}
            label="Override complete"
          >
            <Field label="Override explanation">
              <textarea name="reason" required minLength={5} className={`${inputClass} min-h-16`} />
            </Field>
          </ActionBlock>
        </div>
      )}
    </div>
  );
}
