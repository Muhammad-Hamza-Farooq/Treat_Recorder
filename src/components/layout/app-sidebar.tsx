"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LEADER_NAV, MEMBER_NAV, type NavItem } from "@/config/navigation";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";

function isActive(pathname: string, href: string) {
  const base = href.split("?")[0];
  return pathname === base || (base !== "/dashboard" && pathname.startsWith(`${base}/`));
}

function NavLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-2.5 rounded-full px-3 py-2.5 text-sm transition",
        isActive(pathname, item.href)
          ? "bg-accent text-accent-foreground"
          : "text-muted hover:bg-accent-soft hover:text-foreground"
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="truncate">{item.title}</span>
    </Link>
  );
}

type NavProps = { isLeader?: boolean; userName?: string };

export function AppSidebar({ isLeader = false, userName = "Member" }: NavProps) {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-60 shrink-0 flex-col border-r border-border bg-card/70 backdrop-blur">
      <div className="flex items-center justify-between px-5 py-5">
        <Link href="/dashboard" className="font-heading text-xl tracking-tight">
          TreatTracker
        </Link>
        <ThemeToggle />
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-4">
        {MEMBER_NAV.map((item) => (
          <NavLink key={item.href + item.title} item={item} pathname={pathname} />
        ))}
        {isLeader ? (
          <>
            <p className="px-3 pb-1 pt-5 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
              Leader
            </p>
            {LEADER_NAV.map((item) => (
              <NavLink key={item.href + item.title} item={item} pathname={pathname} />
            ))}
          </>
        ) : null}
      </nav>
      <div className="border-t border-border px-5 py-4">
        <p className="truncate text-sm font-medium">{userName}</p>
        <p className="text-xs text-muted">{isLeader ? "Leader" : "Member"}</p>
        <Link href="/api/logout" className="mt-2 inline-block text-xs text-muted underline-offset-2 hover:underline">
          Sign out
        </Link>
      </div>
    </aside>
  );
}

export function MobileNav({ isLeader = false }: { isLeader?: boolean }) {
  const pathname = usePathname();
  const items = isLeader ? [...MEMBER_NAV.slice(0, 4), ...LEADER_NAV.slice(0, 2)] : MEMBER_NAV.slice(0, 5);
  return (
    <div className="border-b border-border px-3 py-2 md:hidden">
      <div className="flex gap-1 overflow-x-auto">
        {items.map((item) => (
          <NavLink key={item.href + item.title} item={item} pathname={pathname} />
        ))}
      </div>
    </div>
  );
}
