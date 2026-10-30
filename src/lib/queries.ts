import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { OBLIGATION_LIST_SELECT, OBLIGATION_SELECT, type ObligationRow } from "@/types/treat";

/**
 * Obligations for list/calendar UIs.
 * Primitive args so React `cache()` can dedupe within a request.
 */
export const listObligations = cache(
  async (involving?: string, limit = 100): Promise<ObligationRow[]> => {
    const supabase = await createClient();
    let query = supabase
      .from("treat_obligations")
      .select(OBLIGATION_LIST_SELECT)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (involving) {
      query = query.or(`giver_id.eq.${involving},requester_id.eq.${involving}`);
    }
    const { data, error } = await query;
    if (error) console.error("listObligations failed", error.message);
    return (data ?? []) as unknown as ObligationRow[];
  }
);

/** Full obligation detail (single row). */
export const getObligation = cache(async (id: string): Promise<ObligationRow | null> => {
  const supabase = await createClient();
  const { data } = await supabase.from("treat_obligations").select(OBLIGATION_SELECT).eq("id", id).maybeSingle();
  return (data as unknown as ObligationRow | null) ?? null;
});

export type MemberOption = { id: string; full_name: string };

/** Active members for pickers — request-deduped. */
export const listActiveMembers = cache(async (): Promise<MemberOption[]> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("account_status", "active")
    .order("full_name")
    .limit(50);
  return data ?? [];
});
