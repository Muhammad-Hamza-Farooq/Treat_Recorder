import { AppShell } from "@/components/layout/app-shell";
import { EnvStatusCard } from "@/components/setup/env-status-card";
import { TREAT_STATUS_COLORS, TREAT_STATUS_LABELS, TREAT_STATUSES } from "@/types/treat";
import Link from "next/link";

const PLACEHOLDER_STATS = [
  { label: "Treats I owe", value: "—" },
  { label: "Treats owed to me", value: "—" },
  { label: "Pending requests", value: "—" },
  { label: "Unscheduled", value: "—" },
  { label: "Scheduled", value: "—" },
  { label: "Delayed", value: "—" },
  { label: "In progress", value: "—" },
  { label: "Completed", value: "—" },
  { label: "Overdue", value: "—" },
];

export default function DashboardPage() {
  return (
    <AppShell
      title="Dashboard"
      description="Live counts will come from PostgreSQL after Phase 2 auth + schema. Shell and navigation are ready now."
      isLeader
      userName="Hamza (Leader)"
      actions={
        <Link
          href="/request-treat"
          className="rounded-xl bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800"
        >
          Request a Treat
        </Link>
      }
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {PLACEHOLDER_STATS.map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm"
              >
                <p className="text-xs font-medium uppercase tracking-wide text-stone-500">
                  {stat.label}
                </p>
                <p className="mt-2 font-[family-name:var(--font-display)] text-3xl font-semibold text-stone-900">
                  {stat.value}
                </p>
              </div>
            ))}
          </section>

          <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold">
              Status legend
            </h2>
            <p className="mt-1 text-sm text-stone-600">
              Used across calendar, tables, and obligation cards.
            </p>
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {TREAT_STATUSES.map((status) => (
                <li key={status} className="flex items-center gap-2 text-sm text-stone-700">
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: TREAT_STATUS_COLORS[status] }}
                  />
                  {TREAT_STATUS_LABELS[status]}
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-2xl border border-dashed border-stone-300 bg-white/60 p-5">
            <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold">
              Quick actions
            </h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {[
                ["/request-treat", "Request a Treat"],
                ["/calendar", "View Calendar"],
                ["/treats", "My Treats"],
                ["/notifications", "Notifications"],
                ["/leader", "Leader Admin"],
              ].map(([href, label]) => (
                <Link
                  key={href}
                  href={href}
                  className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-700 hover:border-teal-600 hover:text-teal-800"
                >
                  {label}
                </Link>
              ))}
            </div>
          </section>
        </div>

        <EnvStatusCard />
      </div>
    </AppShell>
  );
}
