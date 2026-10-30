import { describe, expect, it } from "vitest";
import { resolveTransition, treatActionSchema, type TransitionContext } from "./treat-workflow";

const base: TransitionContext = {
  action: "accept_unscheduled",
  status: "PENDING",
  isGiver: true,
  isRequester: false,
  isLeader: false,
  confirmedBy: [],
};

describe("resolveTransition", () => {
  it("lets the giver accept a pending treat", () => {
    expect(resolveTransition(base)).toEqual({ ok: true, next: "ACCEPTED_UNSCHEDULED" });
    expect(resolveTransition({ ...base, action: "accept_schedule" })).toEqual({
      ok: true,
      next: "SCHEDULED",
    });
  });

  it("blocks the requester from accepting", () => {
    const r = resolveTransition({ ...base, isGiver: false, isRequester: true });
    expect(r.ok).toBe(false);
  });

  it("requires both parties to confirm completion", () => {
    const first = resolveTransition({
      ...base,
      action: "confirm_completion",
      status: "SCHEDULED",
    });
    expect(first).toEqual({ ok: true, next: "COMPLETION_PENDING" });

    const second = resolveTransition({
      ...base,
      action: "confirm_completion",
      status: "COMPLETION_PENDING",
      isGiver: false,
      isRequester: true,
      confirmedBy: ["giver"],
    });
    expect(second).toEqual({ ok: true, next: "COMPLETED", completionMethod: "dual_confirm" });
  });

  it("does not let the same party confirm twice", () => {
    const r = resolveTransition({
      ...base,
      action: "confirm_completion",
      status: "COMPLETION_PENDING",
      confirmedBy: ["giver"],
    });
    expect(r.ok).toBe(false);
  });

  it("rejects any action on closed treats", () => {
    expect(resolveTransition({ ...base, status: "COMPLETED" }).ok).toBe(false);
    expect(resolveTransition({ ...base, status: "REJECTED", isLeader: true, action: "leader_reject" }).ok).toBe(
      false
    );
  });

  it("restricts leader actions to the leader", () => {
    expect(resolveTransition({ ...base, action: "leader_reject" }).ok).toBe(false);
    expect(resolveTransition({ ...base, action: "leader_override_complete", isLeader: true })).toEqual({
      ok: true,
      next: "COMPLETED",
      completionMethod: "leader_override",
    });
  });
});

describe("treatActionSchema", () => {
  const id = "3f2b8f0e-6b6e-4b76-9d31-0c6a8b7d9a11";

  it("requires a reason for delays", () => {
    expect(treatActionSchema.safeParse({ action: "delay", obligationId: id, reason: "no" }).success).toBe(false);
    expect(
      treatActionSchema.safeParse({ action: "delay", obligationId: id, reason: "Exams this week" }).success
    ).toBe(true);
  });

  it("requires a date for scheduling", () => {
    expect(treatActionSchema.safeParse({ action: "accept_schedule", obligationId: id }).success).toBe(false);
    expect(
      treatActionSchema.safeParse({
        action: "accept_schedule",
        obligationId: id,
        scheduledAt: "2026-11-05T19:00",
      }).success
    ).toBe(true);
  });
});
