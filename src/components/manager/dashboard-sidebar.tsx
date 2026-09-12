import {
  LayoutDashboard,
  CalendarCheck,
  MessageSquare,
  Users,
  Mail,
  ScrollText,
  FileDown,
  LogOut,
  ExternalLink,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export type DashboardSection =
  | "overview"
  | "bookings"
  | "messages"
  | "subscribers"
  | "emails"
  | "audit"
  | "export";

export const NAV_ITEMS: { id: DashboardSection; label: string; icon: typeof LayoutDashboard; badge?: (counts: SidebarCounts) => number | undefined }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "bookings", label: "Bookings", icon: CalendarCheck, badge: (c) => c.pendingBookings || undefined },
  { id: "messages", label: "Messages", icon: MessageSquare, badge: (c) => c.messages || undefined },
  { id: "subscribers", label: "Subscribers", icon: Users },
  { id: "emails", label: "Email activity", icon: Mail },
  { id: "audit", label: "Audit trail", icon: ScrollText },
  { id: "export", label: "Export", icon: FileDown },
];

export interface SidebarCounts {
  pendingBookings?: number;
  messages?: number;
}

interface DashboardSidebarProps {
  active: DashboardSection;
  onNavigate: (section: DashboardSection) => void;
  counts: SidebarCounts;
  managerEmail?: string;
  onLogout: () => void;
  logoutBusy?: boolean;
  onViewWebsite: () => void;
}

export function DashboardSidebar({
  active,
  onNavigate,
  counts,
  managerEmail,
  onLogout,
  logoutBusy,
  onViewWebsite,
}: DashboardSidebarProps) {
  return (
    <div className="flex h-full flex-col bg-card">
      <div className="p-5">
        <span className="eyebrow">Gorilla Resort</span>
        <p className="mt-1 font-display text-xl text-tide-900 dark:text-sand-50">Control room</p>
        {managerEmail && <p className="mt-1 truncate text-xs text-muted-foreground">{managerEmail}</p>}
      </div>

      <Separator />

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const badgeValue = item.badge?.(counts);
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              className={cn(
                "flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground shadow"
                  : "text-foreground/70 hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <span className="flex items-center gap-2.5">
                <Icon className="h-4 w-4" />
                {item.label}
              </span>
              {Boolean(badgeValue) && (
                <span
                  className={cn(
                    "flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-semibold",
                    isActive ? "bg-primary-foreground/20" : "bg-coral-500 text-white"
                  )}
                >
                  {badgeValue}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <Separator />

      <div className="space-y-2 p-3">
        <Button variant="outline" size="sm" className="w-full justify-start gap-2" onClick={onViewWebsite}>
          <ExternalLink className="h-4 w-4" /> View website
        </Button>
        <Button variant="ghost" size="sm" loading={logoutBusy} className="w-full justify-start gap-2 text-red-600 hover:bg-red-500/10 hover:text-red-700 dark:text-red-300" onClick={onLogout}>
          {!logoutBusy && <LogOut className="h-4 w-4" />} Sign out
        </Button>
      </div>
    </div>
  );
}
