import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { Card } from "@/components/ui/primitives";
import { requireLeader } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function LeaderPage() {
  const me = await requireLeader();
  const supabase = await createClient();
  const count = async (table: string, column: string, value: string) =>
    (await supabase.from(table).select("id", { count: "exact", head: true }).eq(column, value)).count ?? 0;

  const [interventions, security, invites, members] = await Promise.all([
    count("leader_interventions", "status", "open"),
    count("security_events", "resolution_status", "open"),
    count("invitations", "status", "pending"),
    count("profiles", "account_status", "active"),
  ]);

  const tiles = [
    { href: "/leader/interventions", label: "Open interventions", value: interventions },
    { href: "/leader/security", label: "Open security events", value: security },
    { href: "/leader/invitations", label: "Pending invites", value: invites },
    { href: "/leader/users", label: "Active members", value: members },
  ];

  return (
    <AppShell profile={me} title="Leader" description="What needs your attention.">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {tiles.map((t) => (
          <Link key={t.href} href={t.href}>
            <Card className="p-4 transition hover:border-accent">
              <p className="text-xs font-medium uppercase tracking-wide text-muted">{t.label}</p>
              <p className="mt-2 font-heading text-3xl font-semibold">{t.value}</p>
            </Card>
          </Link>
        ))}
      </div>
      <p className="mt-6 text-sm text-muted">
        <Link href="/leader/settings" className="text-accent hover:underline">
          App settings
        </Link>{" "}
        control invitation expiry and reminder timing.
      </p>
    </AppShell>
  );
}
