export const TREAT_STATUSES = [
  "PENDING",
  "ACCEPTED_UNSCHEDULED",
  "SCHEDULED",
  "IN_PROGRESS",
  "TEMPORARILY_DELAYED",
  "COMPLETION_PENDING",
  "COMPLETED",
  "DISPUTED",
  "REJECTED",
] as const;

export type TreatStatus = (typeof TREAT_STATUSES)[number];

export const TREAT_STATUS_LABELS: Record<TreatStatus, string> = {
  PENDING: "Pending",
  ACCEPTED_UNSCHEDULED: "Accepted (unscheduled)",
  SCHEDULED: "Scheduled",
  IN_PROGRESS: "In progress",
  TEMPORARILY_DELAYED: "Temporarily delayed",
  COMPLETION_PENDING: "Completion pending",
  COMPLETED: "Completed",
  DISPUTED: "Disputed",
  REJECTED: "Rejected",
};

/** Calendar / legend colors (distinct per status). */
export const TREAT_STATUS_COLORS: Record<TreatStatus, string> = {
  PENDING: "#F59E0B",
  ACCEPTED_UNSCHEDULED: "#8B5CF6",
  SCHEDULED: "#2563EB",
  IN_PROGRESS: "#0891B2",
  TEMPORARILY_DELAYED: "#EA580C",
  COMPLETION_PENDING: "#DB2777",
  COMPLETED: "#16A34A",
  DISPUTED: "#DC2626",
  REJECTED: "#64748B",
};
