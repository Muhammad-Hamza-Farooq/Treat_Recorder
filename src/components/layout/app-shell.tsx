import { AppSidebar, MobileNav } from "@/components/layout/app-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import type { Profile } from "@/lib/auth";

type AppShellProps = {
  children: React.ReactNode;
  profile: Profile;
  title: string;
  description?: string;
  actions?: React.ReactNode;
};

export function AppShell({ children, profile, title, description, actions }: AppShellProps) {
  const isLeader = profile.role === "leader";
  const words = title.trim().split(/\s+/);
  const head = words.slice(0, -1).join(" ");
  const tail = words.slice(-1)[0] ?? title;

  return (
    <div className="glow-stage flex min-h-screen bg-background text-foreground">
      <div className="relative z-10 flex min-h-screen w-full">
        <div className="hidden md:block">
          <div className="sticky top-0 h-screen">
            <AppSidebar isLeader={isLeader} userName={profile.full_name} />
          </div>
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <MobileNav isLeader={isLeader} />
          <header className="px-5 py-6 md:px-10">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
                  {head ? (
                    <>
                      {head} <span className="font-heading italic font-normal">{tail}</span>
                    </>
                  ) : (
                    <span className="font-heading italic font-normal">{tail}</span>
                  )}
                </h1>
                {description ? (
                  <p className="mt-2 max-w-xl text-sm text-muted">{description}</p>
                ) : null}
              </div>
              <div className="flex items-center gap-2">
                {actions}
                <ThemeToggle />
              </div>
            </div>
          </header>
          <main className="mx-auto w-full max-w-5xl flex-1 px-5 pb-10 md:px-10">{children}</main>
        </div>
      </div>
    </div>
  );
}
