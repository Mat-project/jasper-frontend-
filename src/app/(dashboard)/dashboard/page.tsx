/**
 * Dashboard home page — Sprint 0 skeleton.
 */
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Welcome to the Engineering Operations Management System.
        </p>
      </div>

      {/* Status cards — Sprint 0 placeholders */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Employees", value: "—", color: "bg-brand-500" },
          { label: "Active Projects", value: "—", color: "bg-emerald-500" },
          { label: "Production Entries", value: "—", color: "bg-amber-500" },
          { label: "Attendance Today", value: "—", color: "bg-purple-500" },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-xl border border-border bg-card p-5 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className={`h-2 w-10 rounded-full ${card.color} mb-4`} />
            <div className="text-3xl font-bold text-foreground">{card.value}</div>
            <div className="text-sm text-muted-foreground mt-1">{card.label}</div>
          </div>
        ))}
      </div>

      {/* Sprint 0 info banner */}
      <div className="rounded-xl border border-brand-200 bg-brand-50 dark:border-brand-800 dark:bg-brand-950/50 p-5">
        <h2 className="font-semibold text-brand-800 dark:text-brand-200">
          🚀 Sprint 0 Complete
        </h2>
        <p className="text-sm text-brand-700 dark:text-brand-300 mt-1">
          Project foundation is set up. Authentication, RBAC, health monitoring,
          API documentation, and the CI/CD pipeline are ready.
          Feature development begins in Sprint 1.
        </p>
      </div>
    </div>
  );
}
