"use client";

/**
 * NotificationToaster
 *
 * Polls the Register AI notifications endpoint and shows transient toast
 * notifications for the four toast-worthy events:
 *   - PROCESSING_COMPLETED
 *   - PROCESSING_FAILED
 *   - REGISTER_GENERATED
 *   - EMAIL_SENT
 *
 * Scope rule (per spec):
 *   "If the user is currently inside the project, display toast notifications"
 *   We only show a toast when the notification's project matches the project
 *   the user is currently viewing (read from the URL /projects/<id>...).
 *   Notifications for other projects are silently recorded (the Notification
 *   Center bell badge still updates) — they just don't pop a toast.
 *
 * Each toast has an "Open" action that navigates to:
 *   /projects/<project_id>?tab=<TAB>&submission=<submission_id>
 *
 * Persistence of "seen" state:
 *   We track the IDs of notifications we've already toasted in a ref + a
 *   sessionStorage cache keyed by user, so a toast isn't re-shown after a
 *   same-session navigation. Cross-session re-show is acceptable and rare
 *   (only happens if a notification arrives while logged out).
 */
import React, { useEffect, useRef, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  CheckCircle2,
  XCircle,
  FileText,
  Mail,
  X,
  ExternalLink,
} from "lucide-react";
import {
  RegisterNotification,
  getAllNotifications,
} from "@/lib/api/register_ai";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ToastItem {
  id: string;
  notification: RegisterNotification;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
  iconColor: string;
}

const TOAST_WORTHY: Record<string, { tab: string }> = {
  PROCESSING_COMPLETED: { tab: "Relationships" },
  PROCESSING_FAILED: { tab: "Extraction" },
  REGISTER_GENERATED: { tab: "Review" },
  EMAIL_SENT: { tab: "Transmittals" },
};

const SEEN_STORAGE_KEY = "eoms_toasted_notification_ids";

function getSeenIds(): Set<string> {
  try {
    const raw = sessionStorage.getItem(SEEN_STORAGE_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw) as string[];
    return new Set(arr);
  } catch {
    return new Set();
  }
}

function persistSeenIds(ids: Set<string>) {
  try {
    // Keep only the last 200 to avoid unbounded growth
    const arr = Array.from(ids).slice(-200);
    sessionStorage.setItem(SEEN_STORAGE_KEY, JSON.stringify(arr));
  } catch {
    // ignore
  }
}

function getToastMeta(actionType: string): {
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
  iconColor: string;
} | null {
  switch (actionType) {
    case "PROCESSING_COMPLETED":
      return {
        icon: CheckCircle2,
        accent: "border-l-emerald-500",
        iconColor: "text-emerald-600",
      };
    case "PROCESSING_FAILED":
      return {
        icon: XCircle,
        accent: "border-l-rose-500",
        iconColor: "text-rose-600",
      };
    case "REGISTER_GENERATED":
      return {
        icon: FileText,
        accent: "border-l-blue-500",
        iconColor: "text-blue-600",
      };
    case "EMAIL_SENT":
      return {
        icon: Mail,
        accent: "border-l-violet-500",
        iconColor: "text-violet-600",
      };
    default:
      return null;
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export function NotificationToaster() {
  const router = useRouter();
  const pathname = usePathname();
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const seenRef = useRef<Set<string>>(getSeenIds());
  const knownIdsRef = useRef<Set<string>>(new Set(seenRef.current));

  // The currently-viewed project id, parsed from /projects/<id>... paths.
  const currentProjectId = React.useMemo(() => {
    if (!pathname) return null;
    const m = pathname.match(/^\/projects\/([0-9a-fA-F-]{36})/);
    return m ? m[1] : null;
  }, [pathname]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const poll = useCallback(async () => {
    try {
      const data = await getAllNotifications();
      const seen = seenRef.current;
      const known = knownIdsRef.current;
      const newToasts: ToastItem[] = [];

      for (const n of data) {
        // Only toast-worthy types
        if (!TOAST_WORTHY[n.action_type]) continue;
        // Only once per session
        if (seen.has(n.id)) continue;
        // Mark as seen so we never toast it again this session
        seen.add(n.id);
        // Scope: only show a toast if the user is currently inside the
        // notification's project. If they're elsewhere, the bell badge
        // still updates — we just don't pop a toast.
        if (!currentProjectId || n.project !== currentProjectId) continue;

        const meta = getToastMeta(n.action_type);
        if (!meta) continue;

        // If we already know about this id from a previous poll but hadn't
        // toasted it (because we were on a different page), skip — but only
        // toast genuinely new arrivals while on the right project page.
        if (known.has(n.id)) continue;
        known.add(n.id);

        newToasts.push({
          id: n.id,
          notification: n,
          icon: meta.icon,
          accent: meta.accent,
          iconColor: meta.iconColor,
        });
      }

      if (newToasts.length > 0) {
        persistSeenIds(seen);
        setToasts((prev) => [...prev, ...newToasts].slice(-4));
        // Auto-dismiss after 8 seconds
        for (const t of newToasts) {
          setTimeout(() => dismissToast(t.id), 8000);
        }
      } else if (seen.size > 0) {
        // Persist periodically to keep sessionStorage in sync
        persistSeenIds(seen);
      }
    } catch (e) {
      // Silent — toaster is non-critical
    }
  }, [currentProjectId, dismissToast]);

  useEffect(() => {
    // Initial poll after a short delay to let the page settle
    const initial = setTimeout(poll, 1500);
    const interval = setInterval(poll, 10000);
    return () => {
      clearTimeout(initial);
      clearInterval(interval);
    };
  }, [poll]);

  const handleOpen = (n: RegisterNotification) => {
    const tab = TOAST_WORTHY[n.action_type]?.tab ?? "Extraction";
    const params = new URLSearchParams();
    params.set("tab", tab);
    if (n.submission_id) params.set("submission", n.submission_id);
    dismissToast(n.id);
    router.push(`/projects/${n.project}?${params.toString()}`);
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 w-[380px] pointer-events-none">
      {toasts.map((t) => {
        const Icon = t.icon;
        return (
          <div
            key={t.id}
            className={`pointer-events-auto bg-white dark:bg-card rounded-xl shadow-2xl border border-border border-l-4 ${t.accent} overflow-hidden animate-fade-in`}
            role="alert"
          >
            <div className="flex items-start gap-3 p-4">
              <div className="shrink-0 mt-0.5">
                <Icon className={`h-5 w-5 ${t.iconColor}`} />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-foreground leading-snug">
                  {t.notification.title}
                </h4>
                <p className="text-xs text-muted-foreground mt-1 break-words leading-relaxed line-clamp-3">
                  {t.notification.message}
                </p>
                <div className="flex items-center gap-2 mt-3">
                  <button
                    onClick={() => handleOpen(t.notification)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:text-brand-700 bg-brand-50 dark:bg-brand-950/40 hover:bg-brand-100 dark:hover:bg-brand-900/40 px-2.5 py-1.5 rounded-lg transition-colors"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Open
                  </button>
                  <button
                    onClick={() => dismissToast(t.id)}
                    className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground px-2 py-1.5 rounded-lg transition-colors"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
              <button
                onClick={() => dismissToast(t.id)}
                className="shrink-0 text-muted-foreground/60 hover:text-foreground transition-colors"
                aria-label="Close toast"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
