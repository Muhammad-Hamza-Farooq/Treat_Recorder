import { describe, expect, it } from "vitest";
import {
  ALLOWED_MEMBERS,
  findAllowedMemberByEmail,
  isAllowedEmail,
  isLeaderEmail,
  LEADER_STUDENT_ID,
  memberEmail,
} from "./allowed-members";

describe("allowed-members", () => {
  it("includes exactly one leader (Hamza)", () => {
    const leaders = ALLOWED_MEMBERS.filter((m) => m.role === "leader");
    expect(leaders).toHaveLength(1);
    expect(leaders[0]?.studentId).toBe(LEADER_STUDENT_ID);
    expect(leaders[0]?.fullName).toBe("Hamza");
  });

  it("has nine allowlisted friends", () => {
    expect(ALLOWED_MEMBERS).toHaveLength(9);
  });

  it("resolves emails for allowlisted IDs", () => {
    expect(isAllowedEmail("bscs23057@itu.edu.pk")).toBe(true);
    expect(isAllowedEmail("outsider@itu.edu.pk")).toBe(false);
    expect(findAllowedMemberByEmail("bscs23172@itu.edu.pk")?.fullName).toBe(
      "Bilal Chaudhary"
    );
  });

  it("identifies the leader email", () => {
    expect(isLeaderEmail(memberEmail(LEADER_STUDENT_ID))).toBe(true);
    expect(isLeaderEmail("bscs23054@itu.edu.pk")).toBe(false);
  });
});
