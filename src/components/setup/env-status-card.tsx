import { integrationStatus } from "@/lib/env";
import { ALLOWED_MEMBERS, getLeaderEmail, memberEmail } from "@/config/allowed-members";
import { CheckCircle2, CircleAlert } from "lucide-react";

function StatusRow({ label, ok, hint }: { label: string; ok: boolean; hint?: string }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-stone-100 py-2.5 last:border-0">
      <div>
        <p className="text-sm font-medium text-stone-800">{label}</p>
        {hint ? <p className="text-xs text-stone-500">{hint}</p> : null}
      </div>
      {ok ? (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
          <CheckCircle2 className="h-3.5 w-3.5" /> Ready
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800">
          <CircleAlert className="h-3.5 w-3.5" /> Needs setup
        </span>
      )}
    </div>
  );
}

export function EnvStatusCard() {
  const status = integrationStatus();

  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold">
        Integration setup
      </h2>
      <p className="mt-1 text-sm text-stone-600">
        Fill secrets in <code className="rounded bg-stone-100 px-1">.env.local</code>. Full
        instructions: <code className="rounded bg-stone-100 px-1">SECRETS.md</code>.
      </p>

      <div className="mt-4">
        <StatusRow
          label="Supabase URL + anon key"
          ok={status.supabaseUrl && status.supabaseAnon}
          hint="Dashboard → Project Settings → API"
        />
        <StatusRow
          label="Supabase service role key"
          ok={status.supabaseServiceRole}
          hint="Server-only. Never expose to the browser."
        />
        <StatusRow
          label="Resend email"
          ok={status.resend}
          hint="API key + verified from-address"
        />
        <StatusRow
          label="Axiom logging"
          ok={status.axiom}
          hint="Token + dataset treattracker"
        />
        <StatusRow
          label="Cron secret"
          ok={status.cronSecret}
          hint="Random string for scheduled reminders"
        />
      </div>

      <div className="mt-5 rounded-xl bg-stone-50 p-4">
        <p className="text-sm font-medium text-stone-800">Allowed group (invitation-only)</p>
        <p className="mt-1 text-xs text-stone-500">
          Leader: {getLeaderEmail()} (Hamza). Domain from ALLOWED_EMAIL_DOMAIN.
        </p>
        <ul className="mt-3 grid gap-1.5 sm:grid-cols-2">
          {ALLOWED_MEMBERS.map((m) => (
            <li key={m.studentId} className="text-sm text-stone-700">
              <span className="font-medium">{m.fullName}</span>
              <span className="text-stone-400"> · </span>
              <span className="text-stone-500">{memberEmail(m.studentId)}</span>
              {m.role === "leader" ? (
                <span className="ml-1 rounded bg-teal-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-teal-800">
                  Leader
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
