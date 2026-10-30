import { z } from "zod";
import type { TreatStatus } from "@/types/treat";

/* ----------------------------- input validation ---------------------------- */

const optionalText = z
  .string()
  .trim()
  .optional()
  .transform((v) => v || undefined);
const reason = z.string().trim().min(5, "Please give a reason (at least 5 characters).").max(1000);
const localDateTime = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, "Pick a date and time.");
const obligationId = z.string().uuid();

export const treatActionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("accept_schedule"),
    obligationId,
    scheduledAt: localDateTime,
    location: optionalText,
  }),
  z.object({ action: z.literal("accept_unscheduled"), obligationId, reason }),
  z.object({
    action: z.literal("schedule"),
    obligationId,
    scheduledAt: localDateTime,
    location: optionalText,
  }),
  z.object({ action: z.literal("delay"), obligationId, reason }),
  z.object({ action: z.literal("confirm_completion"), obligationId, notes: optionalText }),
  z.object({ action: z.literal("tag_leader"), obligationId, reason }),
  z.object({ action: z.literal("leader_accept"), obligationId, reason }),
  z.object({ action: z.literal("leader_reject"), obligationId, reason }),
  z.object({ action: z.literal("leader_override_complete"), obligationId, reason }),
]);

export type TreatActionInput = z.infer<typeof treatActionSchema>;
export type TreatAction = TreatActionInput["action"];

/* ---------------------------- transition rules ----------------------------- */

const OPEN: TreatStatus[] = [
  "PENDING",
  "ACCEPTED_UNSCHEDULED",
  "SCHEDULED",
  "IN_PROGRESS",
  "TEMPORARILY_DELAYED",
  "COMPLETION_PENDING",
  "DISPUTED",
];

export function isOpenStatus(status: TreatStatus): boolean {
  return OPEN.includes(status);
}

export type TransitionContext = {
  action: TreatAction;
  status: TreatStatus;
  isGiver: boolean;
  isRequester: boolean;
  isLeader: boolean;
  /** Which parties have already confirmed completion. */
  confirmedBy: ("giver" | "requester")[];
};

export type TransitionResult =
  | { ok: true; next: TreatStatus; completionMethod?: "dual_confirm" | "leader_override" }
  | { ok: false; error: string };

const fail = (error: string): TransitionResult => ({ ok: false, error });

export function resolveTransition(ctx: TransitionContext): TransitionResult {
  const { action, status, isGiver, isRequester, isLeader } = ctx;

  if (!isOpenStatus(status)) return fail("This treat is already closed.");

  switch (action) {
    case "accept_schedule":
    case "accept_unscheduled": {
      if (!isGiver) return fail("Only the giver can accept this treat.");
      if (status !== "PENDING") return fail("Only pending treats can be accepted.");
      return { ok: true, next: action === "accept_schedule" ? "SCHEDULED" : "ACCEPTED_UNSCHEDULED" };
    }
    case "schedule": {
      if (!isGiver) return fail("Only the giver can schedule this treat.");
      if (!["ACCEPTED_UNSCHEDULED", "TEMPORARILY_DELAYED", "SCHEDULED"].includes(status)) {
        return fail("Accept the treat before scheduling it.");
      }
      return { ok: true, next: "SCHEDULED" };
    }
    case "delay": {
      if (!isGiver) return fail("Only the giver can delay this treat.");
      if (!["ACCEPTED_UNSCHEDULED", "SCHEDULED", "IN_PROGRESS"].includes(status)) {
        return fail("Only an accepted treat can be delayed.");
      }
      return { ok: true, next: "TEMPORARILY_DELAYED" };
    }
    case "confirm_completion": {
      if (!isGiver && !isRequester) return fail("Only the giver or requester can confirm completion.");
      const party = isGiver ? "giver" : "requester";
      if (ctx.confirmedBy.includes(party)) return fail("You already confirmed this treat.");
      if (status === "COMPLETION_PENDING") {
        return { ok: true, next: "COMPLETED", completionMethod: "dual_confirm" };
      }
      if (["ACCEPTED_UNSCHEDULED", "SCHEDULED", "IN_PROGRESS"].includes(status)) {
        return { ok: true, next: "COMPLETION_PENDING" };
      }
      return fail("This treat is not ready to be completed.");
    }
    case "tag_leader": {
      if (!isGiver && !isRequester) return fail("Only the giver or requester can tag the leader.");
      return { ok: true, next: status };
    }
    case "leader_accept": {
      if (!isLeader) return fail("Leader only.");
      if (status !== "PENDING") return fail("Only pending treats can be accepted on the giver's behalf.");
      return { ok: true, next: "ACCEPTED_UNSCHEDULED" };
    }
    case "leader_reject": {
      if (!isLeader) return fail("Leader only.");
      return { ok: true, next: "REJECTED" };
    }
    case "leader_override_complete": {
      if (!isLeader) return fail("Leader only.");
      return { ok: true, next: "COMPLETED", completionMethod: "leader_override" };
    }
  }
}
