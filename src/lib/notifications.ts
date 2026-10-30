import { createServiceClient } from "@/lib/supabase/server";

type NotifyInput = {
  recipientId: string;
  type: string;
  title: string;
  message: string;
  obligationId?: string;
  eventId?: string;
};

/** Inserts in-app notifications (service role; members have no insert policy). */
export async function notify(inputs: NotifyInput | NotifyInput[]): Promise<void> {
  const list = Array.isArray(inputs) ? inputs : [inputs];
  if (list.length === 0) return;

  const { error } = await createServiceClient()
    .from("notifications")
    .insert(
      list.map((n) => ({
        recipient_id: n.recipientId,
        notification_type: n.type,
        title: n.title,
        message: n.message,
        related_obligation_id: n.obligationId ?? null,
        related_event_id: n.eventId ?? null,
      }))
    );
  if (error) console.error("notification insert failed", error.message);
}

/** Notifies the single active leader, if any. */
export async function notifyLeader(input: Omit<NotifyInput, "recipientId">): Promise<void> {
  const { data } = await createServiceClient()
    .from("profiles")
    .select("id")
    .eq("role", "leader")
    .eq("account_status", "active")
    .maybeSingle();
  if (data) await notify({ ...input, recipientId: data.id });
}
