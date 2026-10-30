import { createClient } from "@/lib/supabase/server";
import { OBLIGATION_SELECT, type ObligationRow } from "@/types/treat";

/** Obligations visible to the signed-in member (RLS: all active members can read), newest first. */
export async function listObligations(filter?: { involving?: string; limit?: number }): Promise<ObligationRow[]> {
  const supabase = await createClient();
  let query = supabase.from("treat_obligations").select(OBLIGATION_SELECT).order("created_at", { ascending: false });
  if (filter?.involving) {
    query = query.or(`giver_id.eq.${filter.involving},requester_id.eq.${filter.involving}`);
  }
  if (filter?.limit) query = query.limit(filter.limit);
  const { data, error } = await query;
  if (error) console.error("listObligations failed", error.message);
  return (data ?? []) as unknown as ObligationRow[];
}

export async function getObligation(id: string): Promise<ObligationRow | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("treat_obligations").select(OBLIGATION_SELECT).eq("id", id).maybeSingle();
  return (data as unknown as ObligationRow | null) ?? null;
}

export type MemberOption = { id: string; full_name: string };

export async function listActiveMembers(): Promise<MemberOption[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("account_status", "active")
    .order("full_name");
  return data ?? [];
}
