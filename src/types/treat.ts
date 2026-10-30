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

export type Party = { full_name: string } | null;

export type ObligationRow = {
  id: string;
  treat_request_id: string;
  giver_id: string;
  requester_id: string;
  status: TreatStatus;
  accepted_at: string | null;
  scheduled_at: string | null;
  timezone: string | null;
  location: string | null;
  scheduling_reason: string | null;
  delay_reason: string | null;
  completed_at: string | null;
  completion_method: "dual_confirm" | "leader_override" | null;
  created_at: string;
  giver: Party;
  requester: Party;
  request: {
    reason: string;
    achievement_description: string;
    requested_treat: string | null;
    additional_notes: string | null;
  } | null;
};

/** PostgREST select string that embeds names + request details for an obligation. */
export const OBLIGATION_SELECT =
  "id, treat_request_id, giver_id, requester_id, status, accepted_at, scheduled_at, timezone, location, scheduling_reason, delay_reason, completed_at, completion_method, created_at, " +
  "giver:profiles!treat_obligations_giver_id_fkey(full_name), " +
  "requester:profiles!treat_obligations_requester_id_fkey(full_name), " +
  "request:treat_requests(reason, achievement_description, requested_treat, additional_notes)";
