import { Suspense } from "react";
import { AppSidebar } from "@/components/layout/app-sidebar";

type AppShellProps = {
  children: React.ReactNode;
  title: string;
  description?: string;
  isLeader?: boolean;
  userName?: string;
  actions?: React.ReactNode;
};

function SidebarFallback() {
  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-stone-200 bg-[#FAFAF8]" />
  );
}

export function AppShell({
  children,
  title,
  description,
  isLeader = false,
  userName,
  actions,
}: AppShellProps) {
  return (
    <div className="flex min-h-screen bg-[#F3F1EC] text-stone-900">
      <div className="hidden md:block">
        <div className="sticky top-0 h-screen">
          <Suspense fallback={<SidebarFallback />}>
            <AppSidebar isLeader={isLeader} userName={userName} />
          </Suspense>
        </div>
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="border-b border-stone-200/80 bg-[#FAFAF8]/80 px-4 py-4 backdrop-blur md:px-8">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight">
                {title}
              </h1>
              {description ? (
                <p className="mt-1 max-w-2xl text-sm text-stone-600">{description}</p>
              ) : null}
            </div>
            {actions}
          </div>
        </header>
        <main className="flex-1 px-4 py-6 md:px-8">{children}</main>
      </div>
    </div>
  );
}
