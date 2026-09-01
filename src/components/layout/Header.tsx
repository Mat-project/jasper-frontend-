"use client";

/**
 * Top header bar component.
 *
 * The notification bell + dropdown is now provided by the reusable
 * <NotificationCenter /> component (Register AI workflow notifications,
 * cross-project, with navigation, mark-as-read, mark-all-read and delete).
 */
import { useAuth } from "@/lib/auth/context";
import { getInitials } from "@/lib/utils";
import { LogOut } from "lucide-react";
import { GlobalSearch } from "./GlobalSearch";
import { NotificationCenter } from "@/components/NotificationCenter";

export function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="relative z-30 flex items-center justify-between h-16 px-6 border-b border-border bg-background shrink-0">
      {/* Left — Global Search */}
      <div className="flex-1 flex items-center">
        <GlobalSearch />
      </div>

      {/* Right — actions */}
      <div className="flex items-center gap-3">
        {/* Notification Center (Register AI workflow, cross-project) */}
        <NotificationCenter />

        {/* User avatar + name */}
        {user && (
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-9 h-9 rounded-full bg-brand-500 text-white text-xs font-bold shrink-0">
              {getInitials(user.full_name || user.email)}
            </div>
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-foreground leading-tight">
                {user.full_name}
              </p>
              <p className="text-xs text-muted-foreground leading-tight">
                {user.roles?.[0]?.name ?? "User"}
              </p>
            </div>
          </div>
        )}

        {/* Logout */}
        <button
          onClick={logout}
          className="flex items-center justify-center w-9 h-9 rounded-lg hover:bg-muted transition-colors"
          aria-label="Sign out"
          title="Sign out"
        >
          <LogOut className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>
    </header>
  );
}
