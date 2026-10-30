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
          title="Outing detail"
          description="Loading outing…"
          phase="Phase 4"
        />
      }
    >
      <OutingDetail params={params} />
    </Suspense>
  );
}

async function OutingDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <PlaceholderPage
      title={`Outing ${id}`}
      description="Attendance and per-person obligation status."
      phase="Phase 4"
    />
  );
}
