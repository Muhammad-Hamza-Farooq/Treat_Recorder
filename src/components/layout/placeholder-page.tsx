import { AppShell } from "@/components/layout/app-shell";
import { Card } from "@/components/ui/primitives";
import { requireProfile } from "@/lib/auth";

type PlaceholderPageProps = {
  title: string;
  description: string;
};

export async function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  const profile = await requireProfile();
  return (
    <AppShell profile={profile} title={title} description={description}>
      <Card className="p-10 text-center">
        <p className="font-heading text-3xl italic">Coming together</p>
        <p className="mx-auto mt-3 max-w-md text-sm text-muted">
          This screen is wired into the shell. Feature work continues phase by phase.
        </p>
      </Card>
    </AppShell>
  );
}
