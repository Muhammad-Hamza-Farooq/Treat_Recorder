import type { LucideIcon } from "lucide-react";
import {
  Bell,
  CalendarDays,
  ClipboardList,
  Inbox,
  LayoutDashboard,
  PartyPopper,
  ScrollText,
  Settings,
  ShieldAlert,
  UserPlus,
  Users,
  UtensilsCrossed,
} from "lucide-react";

export type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
};

export const MEMBER_NAV: NavItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Request", href: "/request-treat", icon: UtensilsCrossed },
  { title: "My Treats", href: "/treats", icon: ClipboardList },
  { title: "Calendar", href: "/calendar", icon: CalendarDays },
  { title: "Outings", href: "/outings", icon: PartyPopper },
  { title: "Notifications", href: "/notifications", icon: Bell },
  { title: "Settings", href: "/settings", icon: Settings },
];

export const LEADER_NAV: NavItem[] = [
  { title: "Members", href: "/leader/users", icon: Users },
  { title: "Invites", href: "/leader/invitations", icon: UserPlus },
  { title: "Interventions", href: "/leader/interventions", icon: Inbox },
  { title: "Security", href: "/leader/security", icon: ShieldAlert },
  { title: "Audit", href: "/leader/audit-logs", icon: ScrollText },
];
