import { submitReview } from "@/app/actions/member";
import { AppShell } from "@/components/layout/app-shell";
import { ActionForm } from "@/components/ui/action-form";
import { Card, EmptyState, Field, SectionTitle, inputClass } from "@/components/ui/primitives";
import { requireProfile } from "@/lib/auth";
import { formatDate } from "@/lib/datetime";
import { listObligations } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";

export default async function ReviewsPage() {
  const me = await requireProfile();
  const supabase = await createClient();
  const [{ data: reviews }, mine] = await Promise.all([
    supabase
      .from("treat_reviews")
      .select("id, rating, comments, food_or_activity, recommended, created_at, reviewer:profiles!treat_reviews_reviewer_id_fkey(full_name)")
      .order("created_at", { ascending: false })
      .limit(50),
    listObligations(me.id, 50),
  ]);

  const { data: myReviews } = await supabase.from("treat_reviews").select("obligation_id").eq("reviewer_id", me.id);
  const reviewed = new Set((myReviews ?? []).map((r) => r.obligation_id));
  const eligible = mine.filter((o) => o.status === "COMPLETED" && !reviewed.has(o.id));

  return (
    <AppShell profile={me} title="Reviews" description="How the treats actually went.">
      <div className="space-y-6">
        {eligible.length > 0 ? (
          <Card>
            <SectionTitle>Write a review</SectionTitle>
            <ActionForm action={submitReview} submitLabel="Submit review">
              <Field label="Treat">
                <select name="obligationId" required className={inputClass}>
                  {eligible.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.giver?.full_name} → {o.requester?.full_name} · {o.request?.reason}
                    </option>
                  ))}
                </select>
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Rating">
                  <select name="rating" required defaultValue="" className={inputClass}>
                    <option value="" disabled>
                      Choose
                    </option>
                    {[5, 4, 3, 2, 1].map((n) => (
                      <option key={n} value={n}>
                        {"★".repeat(n)}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Food or activity (optional)">
                  <input name="foodOrActivity" maxLength={200} className={inputClass} />
                </Field>
              </div>
              <Field label="Comments (optional)">
                <textarea name="comments" rows={2} maxLength={1000} className={inputClass} />
              </Field>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="recommended" className="accent-[var(--accent)]" /> I&apos;d recommend it
              </label>
            </ActionForm>
          </Card>
        ) : null}

        <Card>
          <SectionTitle>All reviews</SectionTitle>
          {!reviews || reviews.length === 0 ? (
            <EmptyState>No reviews yet. Reviews unlock once a treat is completed.</EmptyState>
          ) : (
            <ul className="divide-y divide-border">
              {reviews.map((r) => {
                const reviewer = r.reviewer as unknown as { full_name: string } | null;
                return (
                  <li key={r.id} className="py-3 text-sm">
                    <p>
                      <span className="font-medium">{reviewer?.full_name}</span>{" "}
                      <span className="text-accent">{"★".repeat(r.rating)}</span>{" "}
                      <span className="text-muted">
                        {r.food_or_activity ? `· ${r.food_or_activity} ` : ""}· {formatDate(r.created_at, me.timezone)}
                      </span>
                    </p>
                    {r.comments ? <p className="text-muted">{r.comments}</p> : null}
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>
    </AppShell>
  );
}
