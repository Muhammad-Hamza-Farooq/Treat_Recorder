"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LEADER_NAV, MEMBER_NAV } from "@/config/navigation";
import { cn } from "@/lib/utils";

type AppSidebarProps = {
  isLeader?: boolean;
  userName?: string;
};

export function AppSidebar({ isLeader = false, userName = "Member" }: AppSidebarProps) {
  const pathname = usePathname();
  const items = isLeader ? [...MEMBER_NAV, ...LEADER_NAV] : MEMBER_NAV;

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-stone-200 bg-[#FAFAF8]">
      <div className="border-b border-stone-200 px-5 py-5">
        <Link href="/dashboard" className="block">
          <p className="font-[family-name:var(--font-display)] text-xl font-semibold tracking-tight text-stone-900">
            TreatTracker
          </p>
          <p className="mt-0.5 text-xs text-stone-500">Nobody escapes a treat</p>
        </Link>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
        {items.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href.split("?")[0]));
          const Icon = item.icon;
          return (
            <Link
              key={item.href + item.title}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-teal-700 text-white shadow-sm"
                  : "text-stone-700 hover:bg-stone-100"
              )}
            >
              <Icon className="h-4 w-4 shrink-0 opacity-90" />
              <span className="truncate">{item.title}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-stone-200 px-4 py-4">
        <p className="truncate text-sm font-medium text-stone-900">{userName}</p>
        <p className="text-xs text-stone-500">{isLeader ? "Leader" : "Member"}</p>
      </div>
    </aside>
  );
}
