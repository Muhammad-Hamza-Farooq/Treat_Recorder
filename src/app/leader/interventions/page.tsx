import { PlaceholderPage } from "@/components/layout/placeholder-page";

export default function Page() {
  return (
    <PlaceholderPage
      title="Intervention Queue"
      description="Tagged requests awaiting leader action."
      phase="Phase 7"
      isLeader={true}
    />
  );
}
