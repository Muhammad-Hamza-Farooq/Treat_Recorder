import { AxiomWithoutBatching } from "@axiomhq/js";
import { createServiceClient } from "@/lib/supabase/server";
import { getRequestContext } from "@/lib/request-context";

type AuditInput = {
  actorId: string | null;
  eventType: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
};

/** Appends to audit_logs (service role) and mirrors to Axiom without blocking. */
export async function writeAudit(input: AuditInput): Promise<void> {
  let ip: string | null = null;
  let userAgent: string | null = null;
  try {
    const ctx = await getRequestContext();
    ip = ctx.ip;
    userAgent = ctx.userAgent;
  } catch {
    // Outside a request scope (e.g. scripts) — log without context.
  }

  const row = {
    actor_id: input.actorId,
    event_type: input.eventType,
    entity_type: input.entityType ?? null,
    entity_id: input.entityId ?? null,
    ip_address: ip,
    user_agent: userAgent,
    metadata: input.metadata ?? {},
  };

  const { error } = await createServiceClient().from("audit_logs").insert(row);
  if (error) console.error("audit_logs insert failed", error.message);

  const token = process.env.AXIOM_TOKEN;
  const dataset = process.env.AXIOM_DATASET;
  if (token && dataset && !token.startsWith("REPLACE_")) {
    const axiom = new AxiomWithoutBatching({
      token,
      orgId: process.env.AXIOM_ORG_ID || undefined,
    });
    // Fire-and-forget: never let observability fail a user action.
    axiom
      .ingest(dataset, [{ _time: new Date().toISOString(), service: "treattracker", ...row }])
      .catch((e: unknown) => console.error("axiom ingest failed", e));
  }
}
