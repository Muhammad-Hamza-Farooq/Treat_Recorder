/**
 * Hard allowlist for TreatTracker invitations / registration.
 * Only these student IDs (plus ALLOWED_EMAIL_DOMAIN) may join.
 * Hamza (bscs23057) is the sole LEADER.
 */

export type MemberRole = "leader" | "member";

export type AllowedMember = {
  fullName: string;
  studentId: string;
  role: MemberRole;
};

export const ALLOWED_MEMBERS: readonly AllowedMember[] = [
  { fullName: "Hamza", studentId: "bscs23057", role: "leader" },
  { fullName: "Adil Baig", studentId: "bscs23054", role: "member" },
  { fullName: "Mehar Ali", studentId: "bscs23087", role: "member" },
  { fullName: "Moeez Umer", studentId: "bscs23150", role: "member" },
  { fullName: "Bilal Chaudhary", studentId: "bscs23172", role: "member" },
  { fullName: "Abrar Ahmed", studentId: "bscs23093", role: "member" },
  { fullName: "Wahaj Aziz", studentId: "bscs23107", role: "member" },
  { fullName: "Emad Sohail", studentId: "bscs23117", role: "member" },
  { fullName: "M. Abdullah", studentId: "bscs23202", role: "member" },
] as const;

export const LEADER_STUDENT_ID = "bscs23057";

export function getAllowedEmailDomain(): string {
  return (process.env.ALLOWED_EMAIL_DOMAIN ?? "itu.edu.pk").toLowerCase();
}

export function memberEmail(studentId: string, domain = getAllowedEmailDomain()): string {
  return `${studentId.toLowerCase()}@${domain}`;
}

export function getLeaderEmail(domain = getAllowedEmailDomain()): string {
  return (
    process.env.LEADER_EMAIL?.toLowerCase() ??
    memberEmail(LEADER_STUDENT_ID, domain)
  );
}

export function findAllowedMemberByEmail(email: string): AllowedMember | undefined {
  const normalized = email.trim().toLowerCase();
  const domain = getAllowedEmailDomain();
  return ALLOWED_MEMBERS.find((m) => memberEmail(m.studentId, domain) === normalized);
}

export function isAllowedEmail(email: string): boolean {
  return Boolean(findAllowedMemberByEmail(email));
}

export function isLeaderEmail(email: string): boolean {
  return email.trim().toLowerCase() === getLeaderEmail();
}
