import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function HomePage() {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-[#1A2E2A] text-stone-50">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 80% 50% at 20% 10%, #0F766E 0%, transparent 55%), radial-gradient(ellipse 60% 40% at 90% 80%, #B45309 0%, transparent 50%)",
        }}
      />
      <main className="relative z-10 mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center px-6 py-16">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-teal-200/80">
          Treat accountability
        </p>
        <h1 className="mt-4 font-[family-name:var(--font-display)] text-5xl font-semibold tracking-tight sm:text-6xl">
          TreatTracker
        </h1>
        <p className="mt-5 max-w-xl text-lg text-stone-200/90">
          Nobody should escape a treat by ignoring a request, postponing forever, or
          attending somebody else&apos;s outing. Every obligation stays independent
          until both sides confirm it is done.
        </p>
        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-xl bg-teal-500 px-5 py-3 text-sm font-semibold text-teal-950 transition hover:bg-teal-400"
          >
            Sign in
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-5 py-3 text-sm font-medium text-white backdrop-blur transition hover:bg-white/10"
          >
            Open dashboard shell
          </Link>
        </div>
        <p className="mt-8 text-sm text-stone-400">
          Invitation-only · Leader: Hamza · Fill secrets in{" "}
          <code className="text-stone-300">.env.local</code> (see{" "}
          <code className="text-stone-300">SECRETS.md</code>)
        </p>
      </main>
    </div>
  );
}
