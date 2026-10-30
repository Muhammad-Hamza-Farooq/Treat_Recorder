import { updateAppSettings } from "@/app/actions/leader";
import { AppShell } from "@/components/layout/app-shell";
import { ActionForm } from "@/components/ui/action-form";
import { Card, Field, inputClass } from "@/components/ui/primitives";
import { requireLeader } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const FIELDS = [
  { key: "invitation_expiry_days", label: "Invitation expiry (days)" },
  { key: "reminder_unanswered_days", label: "Remind about unanswered requests after (days)" },
  { key: "reminder_unscheduled_days", label: "Remind about unscheduled treats after (days)" },
  { key: "review_edit_hours", label: "Review edit window (hours)" },
] as const;

export default async function LeaderSettingsPage() {
  const me = await requireLeader();
  const supabase = await createClient();
  const { data } = await supabase.from("app_settings").select("key, value");
  const values = new Map((data ?? []).map((s) => [s.key, String(s.value)]));

  return (
    <AppShell profile={me} title="App settings" description="Group-wide timing rules.">
      <Card className="max-w-xl">
        <ActionForm action={updateAppSettings} submitLabel="Save">
          {FIELDS.map((f) => (
            <Field key={f.key} label={f.label}>
              <input
                type="number"
                name={f.key}
                min={1}
                max={365}
                required
                defaultValue={values.get(f.key)}
                className={inputClass}
              />
            </Field>
          ))}
        </ActionForm>
      </Card>
    </AppShell>
  );
}
