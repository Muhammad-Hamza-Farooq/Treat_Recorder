import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

export default function HomePage() {
  return (
    <div className="glow-stage relative min-h-screen">
      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col px-5 pb-12 pt-6 sm:px-8">
        <header className="glass-nav mx-auto flex w-full max-w-3xl items-center justify-between rounded-full px-3 py-2 shadow-sm sm:px-4">
          <Link href="/" className="font-heading pl-2 text-xl tracking-tight">
            TreatTracker
          </Link>
          <nav className="hidden items-center gap-6 text-sm text-muted sm:flex">
            <a href="#how" className="hover:text-foreground">
              How it works
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link
              href="/login"
              className="rounded-full bg-accent px-4 py-2 text-xs font-semibold text-accent-foreground sm:text-sm"
            >
              Sign in
            </Link>
          </div>
        </header>

        <main className="flex flex-1 flex-col items-center justify-center px-2 text-center">
          <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-card shadow-[0_0_40px_var(--glow-a)]">
            <Sparkles className="h-7 w-7" />
          </div>
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-3 py-1 text-xs text-muted backdrop-blur">
            Invitation-only · Hamza leads
            <ArrowRight className="h-3 w-3" />
          </div>
          <h1 className="max-w-3xl text-4xl font-semibold leading-[1.08] tracking-tight sm:text-6xl">
            Keep every treat honest —{" "}
            <em className="font-heading not-italic italic font-normal">no escapes</em>,{" "}
            <em className="font-heading not-italic italic font-normal">no forgotten dinners</em>.
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
            Ask, track, confirm. Delaying or missing an outing never clears someone else’s obligation.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-3 text-sm font-semibold text-accent-foreground"
            >
              Get started
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#how"
              className="inline-flex items-center rounded-full border border-border px-5 py-3 text-sm"
            >
              See how it works
            </a>
          </div>
          <p className="mt-8 text-sm text-muted">@itu.edu.pk friends only</p>
        </main>

        <section id="how" className="mx-auto mt-4 grid w-full max-w-4xl gap-3 sm:grid-cols-3">
          {[
            { title: "Request", body: "Say why you earned it." },
            { title: "Track", body: "Accept, delay, or schedule — always visible." },
            { title: "Confirm", body: "Both sides confirm. Then review." },
          ].map((item) => (
            <div key={item.title} className="rounded-2xl border border-border bg-card p-5 text-left">
              <p className="font-heading text-2xl italic">{item.title}</p>
              <p className="mt-2 text-sm text-muted">{item.body}</p>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
