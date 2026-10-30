import { Suspense } from "react";
import { PlaceholderPage } from "@/components/layout/placeholder-page";

export default function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense
      fallback={
        <PlaceholderPage
          title="Treat detail"
          description="Loading obligation…"
          phase="Phase 3"
        />
      }
    >
      <TreatDetail params={params} />
    </Suspense>
  );
}

async function TreatDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <PlaceholderPage
      title={`Treat ${id}`}
      description="Full obligation history, responses, and actions."
      phase="Phase 3"
    />
  );
}
