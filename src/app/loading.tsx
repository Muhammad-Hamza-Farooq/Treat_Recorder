export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="w-full max-w-md space-y-4">
        <div className="h-8 w-40 animate-pulse rounded-lg bg-muted/40" />
        <div className="h-28 animate-pulse rounded-2xl border border-border bg-card/60" />
        <div className="h-28 animate-pulse rounded-2xl border border-border bg-card/60" />
        <p className="text-center text-sm text-muted">Loading…</p>
      </div>
    </div>
  );
}
