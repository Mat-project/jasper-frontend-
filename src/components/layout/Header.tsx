"use client";

/**
 * Top header bar component with notification dropdown.
 */
import { useAuth } from "@/lib/auth/context";
import { getInitials } from "@/lib/utils";
import { 
  Bell, 
  LogOut, 
  CheckCircle2, 
  DollarSign, 
  Clock, 
  UserPlus, 
  FolderKanban, 
  Calendar, 
  AlertCircle,
  FileText,
  XCircle,
  UploadCloud,
  Activity,
  FileCheck
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { 
  getNotifications, 
  getUnreadCount, 
  markAsRead, 
  markAllAsRead, 
  NotificationResponse 
} from "@/lib/api/notifications";

export function Header() {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationResponse[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeTab, setActiveTab] = useState<'All' | 'Unread' | 'Approvals'>('All');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch count and list
  const fetchNotificationData = async () => {
    if (!user) return;
    try {
      const count = await getUnreadCount();
      setUnreadCount(count);
      
      const listData = await getNotifications({ page_size: 50 });
      setNotifications(listData.results);
    } catch (e) {
      console.error("Failed to fetch notifications:", e);
    }
  };

  useEffect(() => {
    fetchNotificationData();

    // 30 seconds auto-refresh polling
    const interval = setInterval(() => {
      fetchNotificationData();
    }, 30000);

    return () => clearInterval(interval);
  }, [user]);

  // Click outside listener to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead();
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (e) {
      console.error("Failed to mark all as read:", e);
    }
  };

  const handleMarkRead = async (id: string, currentlyRead: boolean) => {
    if (currentlyRead) return; // Already read
    try {
      await markAsRead(id);
      setUnreadCount(prev => Math.max(0, prev - 1));
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (e) {
      console.error("Failed to mark notification as read:", e);
    }
  };

  const formatRelativeTime = (isoString: string): string => {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins} minutes ago`;
      if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
      if (diffDays === 1) return "Yesterday";
      if (diffDays < 7) return `${diffDays} days ago`;
      return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    } catch (e) {
      return "Some time ago";
    }
  };

  const getNotificationStyles = (type: string | null | undefined, module: string | null | undefined) => {
    const t = (type || "").toLowerCase();
    const m = (module || "").toLowerCase();

    if (t.includes("approve") || m.includes("approval")) {
      return {
        icon: CheckCircle2,
        bg: "bg-emerald-500/10 dark:bg-emerald-500/20",
        color: "text-emerald-500 dark:text-emerald-400",
      };
    }
    if (t.includes("reject") || t.includes("fail")) {
      return {
        icon: XCircle,
        bg: "bg-rose-500/10 dark:bg-rose-500/20",
        color: "text-rose-500 dark:text-rose-400",
      };
    }
    if (m === "payroll" || t.includes("payslip") || t.includes("salary")) {
      return {
        icon: DollarSign,
        bg: "bg-indigo-500/10 dark:bg-indigo-500/20",
        color: "text-indigo-500 dark:text-indigo-400",
      };
    }
    if (m === "employees" || t.includes("employee")) {
      return {
        icon: UserPlus,
        bg: "bg-sky-500/10 dark:bg-sky-500/20",
        color: "text-sky-500 dark:text-sky-400",
      };
    }
    if (m === "projects" || t.includes("project")) {
      return {
        icon: FolderKanban,
        bg: "bg-blue-500/10 dark:bg-blue-500/20",
        color: "text-blue-500 dark:text-blue-400",
      };
    }
    if (m === "attendance" || t.includes("leave")) {
      return {
        icon: Calendar,
        bg: "bg-purple-500/10 dark:bg-purple-500/20",
        color: "text-purple-500 dark:text-purple-400",
      };
    }
    if (t.includes("upload") || t.includes("revision")) {
      return {
        icon: UploadCloud,
        bg: "bg-sky-500/10 dark:bg-sky-500/20",
        color: "text-sky-500 dark:text-sky-400",
      };
    }
    return {
      icon: Activity,
      bg: "bg-slate-500/10 dark:bg-slate-500/20",
      color: "text-slate-500 dark:text-slate-400",
    };
  };

  const filteredNotifications = notifications.filter(n => {
    if (activeTab === 'Unread') {
      return !n.isRead;
    }
    if (activeTab === 'Approvals') {
      const m = (n.module || "").toLowerCase();
      const t = (n.type || "").toLowerCase();
      return m === 'approvals' || t === 'drawing_approved' || t.includes('approve') || m.includes('approval');
    }
    return true;
  });

  return (
    <header className="flex items-center justify-between h-16 px-6 border-b border-border bg-background shrink-0">
      {/* Left — breadcrumb placeholder */}
      <div />

      {/* Right — actions */}
      <div className="flex items-center gap-3">
        {/* Notification bell dropdown wrapper */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => {
              setIsOpen(!isOpen);
              if (!isOpen) {
                fetchNotificationData();
              }
            }}
            className="relative flex items-center justify-center w-9 h-9 rounded-lg hover:bg-muted transition-colors"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4 text-muted-foreground" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white shadow-sm ring-1 ring-background">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>

          {/* Medium size Dropdown Panel */}
          {isOpen && (
            <div className="absolute right-0 mt-2 w-[480px] rounded-xl border border-border bg-card shadow-2xl z-50 overflow-hidden animate-fade-in flex flex-col h-[580px]">
              {/* Dropdown Header */}
              <div className="flex items-start justify-between px-4 py-4 border-b border-border bg-muted/20">
                <div className="flex flex-col">
                  <h3 className="text-base font-bold text-foreground flex items-center gap-1.5">
                    <span>🔔</span> Notifications
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Latest activities across the organization
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-xs font-semibold text-brand-500 hover:text-brand-600 hover:underline transition-colors"
                    >
                      Mark all as read
                    </button>
                  )}
                  <span className="text-muted-foreground/30 text-xs px-1">|</span>
                  <button className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors">
                    View All
                  </button>
                </div>
              </div>

              {/* Tabs Menu */}
              <div className="flex border-b border-border bg-muted/10 px-2 py-1 gap-1 shrink-0">
                {(['All', 'Unread', 'Approvals'] as const).map(tab => {
                  const isActive = activeTab === tab;
                  return (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                        isActive 
                          ? "bg-brand-500 text-white shadow-sm" 
                          : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                      }`}
                    >
                      {tab}
                    </button>
                  );
                })}
              </div>

              {/* Scrollable Notification List */}
              <div className="flex-1 overflow-y-auto divide-y divide-border/60 bg-slate-50/30 dark:bg-transparent">
                {filteredNotifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full py-16 text-center">
                    <Bell className="h-10 w-10 text-muted-foreground/30 mb-2" />
                    <p className="text-sm font-semibold text-muted-foreground">No notifications</p>
                    <p className="text-xs text-muted-foreground/80 mt-0.5">Nothing matches this filter.</p>
                  </div>
                ) : (
                  filteredNotifications.map(n => {
                    const style = getNotificationStyles(n.type, n.module);
                    const Icon = style.icon;
                    return (
                      <div
                        key={n.id}
                        onClick={() => handleMarkRead(n.id, n.isRead)}
                        className={`flex items-start gap-3.5 p-4 cursor-pointer hover:bg-slate-100/60 dark:hover:bg-muted/50 transition-colors relative border-l-4 ${
                          n.isRead 
                            ? "bg-white dark:bg-card border-l-transparent" 
                            : "bg-[#f4f8ff] dark:bg-blue-950/20 border-l-blue-600 dark:border-l-blue-500"
                        }`}
                      >
                        {/* Icon Badge */}
                        <div className={`flex items-center justify-center h-9 w-9 rounded-full shrink-0 ${style.bg}`}>
                          <Icon className={`h-5 w-5 ${style.color}`} />
                        </div>

                        {/* Text Content */}
                        <div className="flex-1 min-w-0">
                          <h4 className={`text-xs text-foreground leading-snug break-words ${!n.isRead ? "font-bold" : "font-semibold"}`}>
                            {n.title}
                          </h4>
                          <p className="text-xs text-muted-foreground/90 mt-0.5 break-words leading-relaxed font-medium">
                            {n.message}
                          </p>
                          <p className="text-[10px] text-muted-foreground/75 mt-1.5 font-semibold">
                            {formatRelativeTime(n.createdAt)}
                          </p>
                        </div>

                        {/* Unread indicator blue dot */}
                        {!n.isRead && (
                          <span className="h-2 w-2 rounded-full bg-blue-600 dark:bg-blue-500 shrink-0 mt-2" />
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* View all activity footer */}
              <div className="border-t border-border bg-muted/20 shrink-0 py-2.5 text-center">
                <div className="text-[11px] text-muted-foreground font-semibold">
                  Showing latest activities
                </div>
              </div>
            </div>
          )}
        </div>

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
