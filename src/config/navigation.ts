import type { LucideIcon } from "lucide-react";
import {
  Activity,
  Bell,
  CalendarDays,
  ClipboardList,
  LayoutDashboard,
  PartyPopper,
  Settings,
  Shield,
  ShieldAlert,
  Star,
  Users,
  UserPlus,
  UtensilsCrossed,
  ScrollText,
  Inbox,
} from "lucide-react";

export type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  leaderOnly?: boolean;
};

export const MEMBER_NAV: NavItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Request a Treat", href: "/request-treat", icon: UtensilsCrossed },
  { title: "My Treats", href: "/treats", icon: ClipboardList },
  { title: "All Treat Requests", href: "/treats?scope=all", icon: Inbox },
  { title: "Group Calendar", href: "/calendar", icon: CalendarDays },
  { title: "Group Outings", href: "/outings", icon: PartyPopper },
  { title: "Reviews", href: "/reviews", icon: Star },
  { title: "Notifications", href: "/notifications", icon: Bell },
  { title: "Activity History", href: "/activity", icon: Activity },
  { title: "Settings", href: "/settings", icon: Settings },
];

export const LEADER_NAV: NavItem[] = [
  { title: "Administration", href: "/leader", icon: Shield, leaderOnly: true },
  { title: "User Management", href: "/leader/users", icon: Users, leaderOnly: true },
  { title: "Invitations", href: "/leader/invitations", icon: UserPlus, leaderOnly: true },
  { title: "Intervention Queue", href: "/leader/interventions", icon: Inbox, leaderOnly: true },
  { title: "Security Center", href: "/leader/security", icon: ShieldAlert, leaderOnly: true },
  { title: "Audit Logs", href: "/leader/audit-logs", icon: ScrollText, leaderOnly: true },
  { title: "App Settings", href: "/leader/settings", icon: Settings, leaderOnly: true },
];
