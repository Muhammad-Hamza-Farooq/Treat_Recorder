import { updateSettings } from "@/app/actions/member";
import { AppShell } from "@/components/layout/app-shell";
import { ActionForm } from "@/components/ui/action-form";
import { Card, Field, inputClass } from "@/components/ui/primitives";
import { requireProfile } from "@/lib/auth";

export default async function SettingsPage() {
  const me = await requireProfile();
  const zones = Intl.supportedValuesOf("timeZone");

  return (
    <AppShell profile={me} title="Settings" description="Your profile and preferences.">
      <Card className="max-w-xl">
        <ActionForm action={updateSettings} submitLabel="Save">
          <Field label="Email">
            <input value={me.email} disabled readOnly className={inputClass} />
          </Field>
          <Field label="Name">
            <input name="fullName" defaultValue={me.full_name} required maxLength={60} className={inputClass} />
          </Field>
          <Field label="Time zone" hint="Used when you schedule treats and outings.">
            <select name="timezone" defaultValue={me.timezone} className={inputClass}>
              {zones.map((z) => (
                <option key={z} value={z}>
                  {z}
                </option>
              ))}
            </select>
          </Field>
        </ActionForm>
        <p className="mt-5 text-sm text-muted">
          Theme: use the sun/moon button in the top bar. It follows your device until you pick one.
        </p>
      </Card>
    </AppShell>
  );
}
