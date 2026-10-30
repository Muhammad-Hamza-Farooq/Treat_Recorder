import { requestTreat } from "@/app/actions/treats";
import { AppShell } from "@/components/layout/app-shell";
import { ActionForm } from "@/components/ui/action-form";
import { Card, EmptyState, Field, inputClass } from "@/components/ui/primitives";
import { requireProfile } from "@/lib/auth";
import { listActiveMembers } from "@/lib/queries";

export default async function RequestTreatPage() {
  const me = await requireProfile();
  const givers = (await listActiveMembers()).filter((m) => m.id !== me.id);

  return (
    <AppShell profile={me} title="Request a treat" description="Tell a friend why they owe you one.">
      {givers.length === 0 ? (
        <EmptyState>No other members have joined yet. Ask Hamza to send invitations.</EmptyState>
      ) : (
        <Card className="max-w-xl">
          <ActionForm action={requestTreat} submitLabel="Send request">
            <Field label="Who owes you?">
              <select name="giverId" required defaultValue="" className={inputClass}>
                <option value="" disabled>
                  Choose a member
                </option>
                {givers.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.full_name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Reason">
              <input name="reason" required maxLength={300} placeholder="Got an internship offer" className={inputClass} />
            </Field>
            <Field label="Achievement">
              <textarea
                name="achievement"
                required
                rows={3}
                maxLength={1000}
                placeholder="What exactly did you achieve?"
                className={inputClass}
              />
            </Field>
            <Field label="Treat (optional)">
              <input name="requestedTreat" maxLength={200} placeholder="Biryani, pizza, ice cream…" className={inputClass} />
            </Field>
            <Field label="Notes (optional)">
              <textarea name="notes" rows={2} maxLength={1000} className={inputClass} />
            </Field>
          </ActionForm>
        </Card>
      )}
    </AppShell>
  );
}
