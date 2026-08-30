"use client";

/**
 * NotificationCenter
 *
 * Cross-project notification center for the Register AI workflow.
 * Rendered inside the global Header so it is available on every page.
 *
 * Features:
 *   - Live unread badge with 15s polling
 *   - Notification list (all projects for the current user)
 *   - Mark as Read (single)
 *   - Mark All as Read
 *   - Delete notification (soft-delete via backend)
 *   - Click a notification → navigate to the related project + tab + submission
 *
 * Navigation contract:
 *   Each notification carries action_type, project, and submission_id.
 *   The URL built is:
 *     /projects/<project_id>?tab=<TAB>&submission=<submission_id>
 *   The project page reads these query params and:
 *     - switches the active tab
 *     - switches the active submission via WorkspaceContext
 *
 * Persistence: notifications live in the backend (register_ai.Notification),
 * so they survive refresh, logout/login, and browser close automatically.
 */
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  CheckCheck,
  Trash2,
  CheckCircle2,
  XCircle,
  UploadCloud,
  FileText,
  Mail,
  MailX,
  Link2,
  FileCheck2,
  Activity,
  X,
} from "lucide-react";
import {
  RegisterNotification,
  getAllNotifications,
  getUnreadNotificationCount,
  markNotificationReadGlobal,
  markAllNotificationsRead,
  deleteNotification,
} from "@/lib/api/register_ai";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Map an action_type to the project tab the user should land on. */
function actionTypeToTab(actionType: string): string {
  switch (actionType) {
    case "PROCESSING_STARTED":
    case "PROCESSING_COMPLETED":
    case "PROCESSING_FAILED":
      return "Extraction";
    case "RELATIONSHIP_READY":
      return "Relationships";
    case "REGISTER_GENERATED":
    case "REGISTER_SAVED":
      return "Review";
    case "EMAIL_SENT":
    case "EMAIL_FAILED":
      return "Transmittals";
    default:
      return "Extraction";
  }
}

/** Pick an icon + color scheme based on the notification action_type. */
function getNotificationStyles(actionType: string): {
  icon: React.ComponentType<{ className?: string }>;
  bg: string;
  color: string;
} {
  const t = (actionType || "").toUpperCase();
  if (t.includes("FAIL")) {
    return {
      icon: XCircle,
      bg: "bg-rose-500/10 dark:bg-rose-500/20",
      color: "text-rose-600 dark:text-rose-400",
    };
  }
  if (t === "PROCESSING_STARTED" || t.includes("UPLOAD")) {
    return {
      icon: UploadCloud,
      bg: "bg-sky-500/10 dark:bg-sky-500/20",
      color: "text-sky-600 dark:text-sky-400",
    };
  }
  if (t === "PROCESSING_COMPLETED") {
    return {
      icon: CheckCircle2,
      bg: "bg-emerald-500/10 dark:bg-emerald-500/20",
      color: "text-emerald-600 dark:text-emerald-400",
    };
  }
  if (t === "RELATIONSHIP_READY") {
    return {
      icon: Link2,
      bg: "bg-indigo-500/10 dark:bg-indigo-500/20",
      color: "text-indigo-600 dark:text-indigo-400",
    };
  }
  if (t === "REGISTER_GENERATED") {
    return {
      icon: FileText,
      bg: "bg-blue-500/10 dark:bg-blue-500/20",
      color: "text-blue-600 dark:text-blue-400",
    };
  }
  if (t === "REGISTER_SAVED") {
    return {
      icon: FileCheck2,
      bg: "bg-teal-500/10 dark:bg-teal-500/20",
      color: "text-teal-600 dark:text-teal-400",
    };
  }
  if (t === "EMAIL_SENT") {
    return {
      icon: Mail,
      bg: "bg-violet-500/10 dark:bg-violet-500/20",
      color: "text-violet-600 dark:text-violet-400",
    };
  }
  if (t === "EMAIL_FAILED") {
    return {
      icon: MailX,
      bg: "bg-rose-500/10 dark:bg-rose-500/20",
      color: "text-rose-600 dark:text-rose-400",
    };
  }
  return {
    icon: Activity,
    bg: "bg-slate-500/10 dark:bg-slate-500/20",
    color: "text-slate-600 dark:text-slate-400",
  };
}

function formatRelativeTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return "Some time ago";
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export function NotificationCenter() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<RegisterNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchCount = useCallback(async () => {
    try {
      const count = await getUnreadNotificationCount();
      setUnreadCount(count);
    } catch (e) {
      // Silent fail — badge is non-critical
    }
  }, []);

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAllNotifications();
      setNotifications(data);
    } catch (e) {
      console.error("Failed to fetch notifications:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  // Poll the unread count every 15 seconds — cheap and keeps the badge live.
  useEffect(() => {
    fetchCount();
    const interval = setInterval(fetchCount, 15000);
    return () => clearInterval(interval);
  }, [fetchCount]);

  // Refresh the list + count whenever the dropdown is opened.
  useEffect(() => {
    if (isOpen) {
      fetchList();
      fetchCount();
    }
  }, [isOpen, fetchList, fetchCount]);

  // Close on outside click.
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
      await markAllNotificationsRead();
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, status: "Read" as const })));
    } catch (e) {
      console.error("Failed to mark all as read:", e);
    }
  };

  const handleMarkRead = async (id: string, currentlyUnread: boolean) => {
    if (!currentlyUnread) return;
    try {
      await markNotificationReadGlobal(id);
      setUnreadCount((prev) => Math.max(0, prev - 1));
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, status: "Read" as const } : n))
      );
    } catch (e) {
      console.error("Failed to mark notification as read:", e);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string, currentlyUnread: boolean) => {
    e.stopPropagation();
    try {
      await deleteNotification(id);
      if (currentlyUnread) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      console.error("Failed to delete notification:", err);
    }
  };

  /**
   * Navigate to the project + tab + submission for this notification.
   * The project page reads `?tab=` and `?submission=` and applies them
   * via the existing WorkspaceContext (no new state machine required).
   */
  const handleNavigate = (n: RegisterNotification) => {
    const tab = actionTypeToTab(n.action_type);
    const params = new URLSearchParams();
    params.set("tab", tab);
    if (n.submission_id) params.set("submission", n.submission_id);
    // Mark as read on open
    if (n.status === "Unread") {
      handleMarkRead(n.id, true);
    }
    setIsOpen(false);
    router.push(`/projects/${n.project}?${params.toString()}`);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell */}
      <button
        onClick={() => setIsOpen((v) => !v)}
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

      {isOpen && (
        <div className="absolute right-0 mt-2 w-[460px] rounded-xl border border-border bg-card shadow-2xl z-50 overflow-hidden animate-fade-in flex flex-col max-h-[600px]">
          {/* Header */}
          <div className="flex items-start justify-between px-4 py-3 border-b border-border bg-muted/20">
            <div className="flex flex-col">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                <Bell className="h-4 w-4" /> Notifications
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Register AI activity across all projects
              </p>
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-xs font-semibold text-brand-500 hover:text-brand-600 hover:underline transition-colors flex items-center gap-1"
                  title="Mark all as read"
                >
                  <CheckCheck className="h-3.5 w-3.5" /> Mark all read
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto divide-y divide-border/60 bg-slate-50/30 dark:bg-transparent">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="animate-spin h-6 w-6 border-2 border-brand-500 border-t-transparent rounded-full mb-2" />
                <p className="text-xs text-muted-foreground">Loading…</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Bell className="h-10 w-10 text-muted-foreground/30 mb-2" />
                <p className="text-sm font-semibold text-muted-foreground">No notifications</p>
                <p className="text-xs text-muted-foreground/80 mt-0.5">
                  You&apos;re all caught up.
                </p>
              </div>
            ) : (
              notifications.map((n) => {
                const style = getNotificationStyles(n.action_type);
                const Icon = style.icon;
                const isUnread = n.status === "Unread";
                return (
                  <div
                    key={n.id}
                    onClick={() => handleNavigate(n)}
                    className={`group flex items-start gap-3 p-3.5 cursor-pointer hover:bg-slate-100/60 dark:hover:bg-muted/50 transition-colors relative border-l-4 ${
                      isUnread
                        ? "bg-[#f4f8ff] dark:bg-blue-950/20 border-l-blue-600 dark:border-l-blue-500"
                        : "bg-white dark:bg-card border-l-transparent"
                    }`}
                  >
                    {/* Icon */}
                    <div className={`flex items-center justify-center h-9 w-9 rounded-full shrink-0 ${style.bg}`}>
                      <Icon className={`h-5 w-5 ${style.color}`} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 pr-1">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <h4
                          className={`text-xs text-foreground leading-snug truncate ${
                            isUnread ? "font-bold" : "font-semibold"
                          }`}
                          title={n.title}
                        >
                          {n.title}
                        </h4>
                        {n.project_code && (
                          <span className="shrink-0 text-[10px] font-mono font-bold text-brand-600 bg-brand-50 dark:bg-brand-950/40 px-1.5 py-0.5 rounded">
                            {n.project_code}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground/90 break-words leading-relaxed line-clamp-2">
                        {n.message}
                      </p>
                      <p className="text-[10px] text-muted-foreground/75 mt-1 font-semibold">
                        {formatRelativeTime(n.created_at)}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      {isUnread && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkRead(n.id, true);
                          }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-emerald-600"
                          title="Mark as read"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={(e) => handleDelete(e, n.id, isUnread)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-rose-600"
                        title="Delete notification"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                      {isUnread && (
                        <span className="h-2 w-2 rounded-full bg-blue-600 dark:bg-blue-500 mt-1" />
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-border bg-muted/20 py-2 text-center shrink-0">
            <span className="text-[11px] text-muted-foreground font-semibold">
              {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
