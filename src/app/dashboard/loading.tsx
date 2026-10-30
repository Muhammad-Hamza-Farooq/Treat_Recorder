export default function DashboardLoading() {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 px-5 py-10 md:px-10">
      <div className="h-10 w-48 animate-pulse rounded-lg bg-muted/40" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-2xl border border-border bg-card/60" />
        ))}
      </div>
      <div className="h-48 animate-pulse rounded-2xl border border-border bg-card/60" />
    </div>
  );
}
