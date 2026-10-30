"use client";

import { ActionForm } from "@/components/ui/action-form";
import { Field, inputClass } from "@/components/ui/primitives";
import { requestTreat } from "@/app/actions/treats";

type Friend = { id: string; full_name: string; email: string };

export function RequestTreatForm({ friends }: { friends: Friend[] }) {
  return (
    <ActionForm action={requestTreat} submitLabel="Send request" buttonClassName="w-full rounded-full">
      <Field label="Who owes you?">
        <select name="giverId" required className={inputClass} defaultValue="">
          <option value="" disabled>
            Select a friend
          </option>
          {friends.map((f) => (
            <option key={f.id} value={f.id}>
              {f.full_name}
            </option>
          ))}
        </select>
      </Field>
      {friends.length === 0 ? (
        <p className="text-xs text-muted">No other active members yet — invite friends first.</p>
      ) : null}
      <Field label="Why do you want this treat?">
        <textarea name="reason" required minLength={3} className={`${inputClass} min-h-24`} />
      </Field>
      <Field label="What did you do to earn it?">
        <textarea name="achievement" required minLength={3} className={`${inputClass} min-h-24`} />
      </Field>
      <Field label="Treat idea (optional)">
        <input name="requestedTreat" className={inputClass} placeholder="Dinner, chai, …" />
      </Field>
      <Field label="Notes (optional)">
        <input name="notes" className={inputClass} />
      </Field>
    </ActionForm>
  );
}
