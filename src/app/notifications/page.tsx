import Link from "next/link";
import { markAllNotificationsRead, markNotificationRead } from "@/app/actions/member";
import { AppShell } from "@/components/layout/app-shell";
import { Card, EmptyState, ghostButtonClass } from "@/components/ui/primitives";
import { requireProfile } from "@/lib/auth";
import { formatDateTime } from "@/lib/datetime";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export default async function NotificationsPage() {
  const me = await requireProfile();
  const supabase = await createClient();
  // Leaders can read everyone's rows under RLS, so always filter to the signed-in recipient.
  const { data: items } = await supabase
    .from("notifications")
    .select("id, title, message, read_at, created_at, related_obligation_id")
    .eq("recipient_id", me.id)
    .order("created_at", { ascending: false })
    .limit(50);

  const unread = (items ?? []).filter((n) => !n.read_at).length;

  return (
    <AppShell
      profile={me}
      title="Notifications"
      description={unread ? `${unread} unread` : "You're all caught up."}
      actions={
        unread ? (
          <form action={markAllNotificationsRead}>
            <button className={ghostButtonClass}>Mark all read</button>
          </form>
        ) : undefined
      }
    >
      <Card>
        {!items || items.length === 0 ? (
          <EmptyState>Nothing here yet.</EmptyState>
        ) : (
          <ul className="divide-y divide-border">
            {items.map((n) => (
              <li key={n.id} className="flex items-start justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className={cn("text-sm", !n.read_at && "font-semibold")}>
                    {!n.read_at ? <span className="mr-2 inline-block h-2 w-2 rounded-full bg-accent" /> : null}
                    {n.title}
                  </p>
                  <p className="text-sm text-muted">{n.message}</p>
                  <p className="mt-1 text-xs text-muted">
                    {formatDateTime(n.created_at, me.timezone)}
                    {n.related_obligation_id ? (
                      <>
                        {" · "}
                        <Link href={`/treats/${n.related_obligation_id}`} className="text-accent hover:underline">
                          Open
                        </Link>
                      </>
                    ) : null}
                  </p>
                </div>
                {!n.read_at ? (
                  <form action={markNotificationRead}>
                    <input type="hidden" name="id" value={n.id} />
                    <button className={ghostButtonClass}>Mark read</button>
                  </form>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </AppShell>
  );
}
