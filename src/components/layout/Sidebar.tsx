import React, { useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth/context";
import {
  LayoutDashboard,
  Database,
  Users,
  Building,
  Layers,
  ShieldCheck,
  Tags,
  FolderKanban,
  Clock,
  Factory,
  ClipboardSignature,
  FileCheck2,
  History,
  FileText,
  GitBranch,
  BarChart3,
  Settings,
  Shield,
  FileSpreadsheet,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  CreditCard,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SubNavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

interface NavItem {
  label: string;
  href?: string;
  icon: React.ElementType;
  subItems?: SubNavItem[];
}

// Prefetch functions to populate browser/api cache on hover
const triggerPrefetch = (href: string) => {
  if (href === "/payroll") {
    import("@/lib/api/payroll").then((api) => {
      api.getPayslips().catch(() => null);
      api.getSalaryStructures().catch(() => null);
    });
  } else if (href === "/production/history") {
    import("@/lib/api/production").then((api) => {
      api.getProductionEntries({ status: "Approved" }).catch(() => null);
    });
  } else if (href === "/projects") {
    import("@/lib/api/projects").then((api) => {
      api.getProjects().catch(() => null);
    });
  }
};

// Memoized Sidebar Link component to prevent unnecessary re-renders
const SidebarLink = React.memo(({
  href,
  label,
  isActive,
  collapsed,
  icon: Icon,
}: {
  href: string;
  label: string;
  isActive: boolean;
  collapsed: boolean;
  icon: React.ElementType;
}) => {
  return (
    <Link
      href={href}
      onMouseEnter={() => triggerPrefetch(href)}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
        isActive
          ? "bg-brand-500/20 text-brand-300"
          : "text-white/60 hover:bg-white/5 hover:text-white"
      )}
      title={collapsed ? label : undefined}
    >
      <Icon className={cn("shrink-0 h-5 w-5", isActive && "text-brand-400")} />
      {!collapsed && <span>{label}</span>}
    </Link>
  );
});
SidebarLink.displayName = "SidebarLink";

// Memoized Sidebar Group component for nested subitems list
const SidebarGroup = React.memo(({
  label,
  icon: Icon,
  subItems,
  pathname,
  collapsed,
  isGroupOpen,
  isSubActive,
  onToggle,
}: {
  label: string;
  icon: React.ElementType;
  subItems: SubNavItem[];
  pathname: string;
  collapsed: boolean;
  isGroupOpen: boolean;
  isSubActive: boolean;
  onToggle: () => void;
}) => {
  return (
    <div className="space-y-1">
      <button
        onClick={onToggle}
        className={cn(
          "w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 text-left",
          isSubActive
            ? "text-white bg-slate-800/40"
            : "text-white/60 hover:bg-white/5 hover:text-white"
        )}
        title={collapsed ? label : undefined}
      >
        <div className="flex items-center gap-3">
          <Icon className={cn("shrink-0 h-5 w-5", isSubActive && "text-brand-400")} />
          {!collapsed && <span>{label}</span>}
        </div>
        {!collapsed && (
          <div>
            {isGroupOpen ? (
              <ChevronDown className="h-4 w-4 text-white/40" />
            ) : (
              <ChevronRight className="h-4 w-4 text-white/40" />
            )}
          </div>
        )}
      </button>

      {isGroupOpen && (
        <div className="pl-4 pr-1 py-1 space-y-1 animate-fade-in">
          {subItems.map((sub) => {
            const isSubItemActive = pathname === sub.href;
            return (
              <Link
                key={sub.href}
                href={sub.href}
                onMouseEnter={() => triggerPrefetch(sub.href)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150",
                  isSubItemActive
                    ? "bg-brand-500/15 text-brand-300 font-semibold"
                    : "text-white/50 hover:bg-white/5 hover:text-white"
                )}
              >
                <sub.icon className={cn("shrink-0 h-4 w-4", isSubItemActive && "text-brand-400")} />
                <span>{sub.label}</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
});
SidebarGroup.displayName = "SidebarGroup";

export function Sidebar() {
  const { user } = useAuth();
  const roleName = user?.roles?.[0]?.name || "Viewer";

  const [collapsed, setCollapsed] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    Masters: true,
    Production: true,
    Administration: false,
  });

  const pathname = usePathname();

  const toggleGroup = useCallback((groupName: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupName]: !prev[groupName],
    }));
  }, []);

  const allNavItems: NavItem[] = useMemo(() => [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    {
      label: "Masters",
      icon: Database,
      subItems: [
        { label: "Employees", href: "/masters/employees", icon: Users },
        { label: "Departments", href: "/masters/departments", icon: Building },
        { label: "Sections", href: "/masters/sections", icon: Layers },
        { label: "Roles", href: "/masters/roles", icon: ShieldCheck },
        { label: "Drawing Categories", href: "/masters/drawing-categories", icon: Tags },
      ],
    },
    { label: "Projects", href: "/projects", icon: FolderKanban },
    { label: "Attendance", href: "/attendance", icon: Clock },
    { label: "Payroll", href: "/payroll", icon: CreditCard },
    {
      label: "Production",
      icon: Factory,
      subItems: [
        { label: "Production Entry", href: "/production/entry", icon: ClipboardSignature },
        { label: "Production Approval", href: "/production/approval", icon: FileCheck2 },
        { label: "Production History", href: "/production/history", icon: History },
      ],
    },
    { label: "Documents", href: "/documents", icon: FileText },
    { label: "Revisions", href: "/revisions", icon: GitBranch },
    { label: "Reports", href: "/reports", icon: BarChart3 },
    {
      label: "Administration",
      icon: Shield,
      subItems: [
        { label: "Audit Logs", href: "/admin/audit-logs", icon: FileSpreadsheet },
        { label: "System Settings", href: "/admin/settings", icon: Settings },
      ],
    },
  ], []);

  const navItems = useMemo(() => {
    const hasRoleIn = (rolesList: string[]) => rolesList.some(r => r.toLowerCase() === roleName.toLowerCase());

    const isGlobal = hasRoleIn(["System Admin", "Managing Director", "Operations Manager", "Technical Manager", "Document Controller", "Admin"]);
    const isManager = hasRoleIn(["Project Manager", "Section Manager", "Assistant Section Manager", "Manager", "HR"]);
    const isEmployee = hasRoleIn(["Draftsman", "Checker", "Data Entry Operator"]);

    const filtered = allNavItems.filter((item) => {
      // 1. Global Admin and Executives see everything
      if (isGlobal) return true;

      // 2. Managers see specific modules, but restricted in Masters and no Administration
      if (isManager) {
        const allowedManager = ["Dashboard", "Masters", "Projects", "Attendance", "Payroll", "Production", "Documents", "Revisions", "Reports"];
        return allowedManager.includes(item.label);
      }

      // 3. Employees see production and basic tracking
      if (isEmployee) {
        const allowedEmployee = ["Dashboard", "Attendance", "Production", "Documents", "Revisions"];
        return allowedEmployee.includes(item.label);
      }

      return false;
    });

    // Clone and map subItems to avoid mutation
    return filtered.map((item) => {
      if (item.subItems) {
        let subItems = [...item.subItems];
        if (isManager && item.label === "Masters") {
          subItems = subItems.filter(sub => sub.label === "Employees");
        } else if (isEmployee && item.label === "Production") {
          if (hasRoleIn(["Checker"])) {
            subItems = subItems.filter(sub => ["Production Entry", "Production Approval", "Production History"].includes(sub.label));
          } else {
            subItems = subItems.filter(sub => ["Production Entry", "Production History"].includes(sub.label));
          }
        }
        return { ...item, subItems };
      }
      return item;
    });
  }, [allNavItems, roleName]);

  return (
    <aside
      className={cn(
        "relative flex flex-col h-screen bg-slate-900 border-r border-white/10 transition-all duration-300 ease-in-out z-20 shrink-0",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Brand Logo */}
      <div className="flex items-center h-16 px-4 border-b border-white/10 shrink-0 bg-slate-950/40">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-brand-500 shrink-0 shadow-lg shadow-brand-500/20">
          <span className="text-white font-bold text-sm">E</span>
        </div>
        {!collapsed && (
          <span className="ml-3 font-bold text-white text-sm tracking-wider uppercase">
            EOMS ({roleName})
          </span>
        )}
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1.5 scrollbar-thin">
        {navItems.map((item) => {
          if (item.href) {
            const isActive = pathname === item.href;
            return (
              <SidebarLink
                key={item.href}
                href={item.href}
                label={item.label}
                isActive={isActive}
                collapsed={collapsed}
                icon={item.icon}
              />
            );
          }

          const isGroupOpen = expandedGroups[item.label] && !collapsed;
          const isSubActive = item.subItems?.some((sub) => pathname === sub.href || pathname.startsWith(`${sub.href}/`)) || false;

          return (
            <SidebarGroup
              key={item.label}
              label={item.label}
              icon={item.icon}
              subItems={item.subItems || []}
              pathname={pathname}
              collapsed={collapsed}
              isGroupOpen={isGroupOpen}
              isSubActive={isSubActive}
              onToggle={() => {
                if (collapsed) setCollapsed(false);
                toggleGroup(item.label);
              }}
            />
          );
        })}
      </nav>

      {/* Collapse Toggle Button */}
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="absolute -right-3 top-20 z-30 flex items-center justify-center w-6 h-6 rounded-full bg-slate-700 border border-white/20 text-white hover:bg-slate-600 transition-colors shadow-md"
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
      </button>
    </aside>
  );
}
