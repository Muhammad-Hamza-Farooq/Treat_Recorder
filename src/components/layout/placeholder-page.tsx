import { AppShell } from "@/components/layout/app-shell";

type PlaceholderPageProps = {
  title: string;
  description: string;
  phase: string;
  isLeader?: boolean;
};

export function PlaceholderPage({
  title,
  description,
  phase,
  isLeader = false,
}: PlaceholderPageProps) {
  return (
    <AppShell title={title} description={description} isLeader={isLeader} userName="Hamza (Leader)">
      <div className="rounded-2xl border border-dashed border-stone-300 bg-white/70 p-8 text-center shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wider text-teal-700">{phase}</p>
        <h2 className="mt-2 font-[family-name:var(--font-display)] text-xl font-semibold text-stone-900">
          Route ready — feature wired in {phase}
        </h2>
        <p className="mx-auto mt-2 max-w-lg text-sm text-stone-600">
          This page is part of the app shell. Real data, auth, and actions land in the phase above —
          no mock arrays pretending to be production.
        </p>
      </div>
    </AppShell>
  );
}
