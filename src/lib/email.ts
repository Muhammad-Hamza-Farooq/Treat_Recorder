import { Resend } from "resend";
import { getAllowedEmailDomain } from "@/config/allowed-members";
import { createServiceClient } from "@/lib/supabase/server";

type EmailInput = {
  /** Same key => the email is sent at most once. */
  idempotencyKey: string;
  to: string;
  template: string;
  subject: string;
  html: string;
};

export type EmailResult = "sent" | "duplicate" | "skipped" | "failed";

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Resend wrapper. Claims the idempotency key in email_delivery_log before sending. */
export async function sendEmail(input: EmailInput): Promise<EmailResult> {
  const to = input.to.trim().toLowerCase();
  if (!to.endsWith(`@${getAllowedEmailDomain()}`)) return "skipped";

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !from || apiKey.startsWith("REPLACE_")) return "skipped";

  const db = createServiceClient();

  // The unique idempotency_key makes this insert the claim: a conflict means already handled.
  const { data: claimed, error: claimError } = await db
    .from("email_delivery_log")
    .upsert(
      {
        idempotency_key: input.idempotencyKey,
        to_email: to,
        template: input.template,
        status: "pending",
      },
      { onConflict: "idempotency_key", ignoreDuplicates: true }
    )
    .select("id");
  if (claimError) {
    console.error("email log claim failed", claimError.message);
    return "failed";
  }
  if (!claimed || claimed.length === 0) return "duplicate";

  const { data, error } = await new Resend(apiKey).emails.send(
    { from, to, subject: input.subject, html: input.html },
    { idempotencyKey: input.idempotencyKey }
  );

  await db
    .from("email_delivery_log")
    .update({
      status: error ? "failed" : "sent",
      provider_id: data?.id ?? null,
      error: error?.message ?? null,
    })
    .eq("id", claimed[0].id);

  return error ? "failed" : "sent";
}
