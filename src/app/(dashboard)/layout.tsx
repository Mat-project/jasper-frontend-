/**
 * Dashboard protected layout — includes sidebar and header.
 */
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/context";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { NotificationToaster } from "@/components/NotificationToaster";
import { DiagnosticErrorModal } from "@/components/DiagnosticErrorModal";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <span className="text-sm text-muted-foreground">Loading EOMS...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        <main
          id="main-content"
          className="flex-1 overflow-y-auto p-6 animate-fade-in"
        >
          {children}
        </main>
      </div>
      {/* Global toast notifications for Register AI workflow events.
          Mounted once at the dashboard root so toasts appear on every page;
          the toaster self-filters to only show toasts for the project the
          user is currently viewing. */}
      <NotificationToaster />
      {/* Global diagnostic modal interceptor for API errors */}
      <DiagnosticErrorModal />
    </div>
  );
}
