"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    Masters: true,
    Production: true,
    Administration: false,
  });

  const pathname = usePathname();

  const toggleGroup = (groupName: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupName]: !prev[groupName],
    }));
  };

  const navItems: NavItem[] = [
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
  ];

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
            EOMS Portal
          </span>
        )}
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1.5 scrollbar-thin">
        {navItems.map((item) => {
          // If it's a simple link
          if (item.href) {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                  isActive
                    ? "bg-brand-500/20 text-brand-300"
                    : "text-white/60 hover:bg-white/5 hover:text-white"
                )}
                title={collapsed ? item.label : undefined}
              >
                <item.icon className={cn("shrink-0 h-5 w-5", isActive && "text-brand-400")} />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          }

          // If it has sub-items (nested list)
          const isGroupOpen = expandedGroups[item.label] && !collapsed;
          const isSubActive = item.subItems?.some((sub) => pathname === sub.href || pathname.startsWith(`${sub.href}/`));

          return (
            <div key={item.label} className="space-y-1">
              <button
                onClick={() => {
                  if (collapsed) setCollapsed(false);
                  toggleGroup(item.label);
                }}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 text-left",
                  isSubActive
                    ? "text-white bg-slate-800/40"
                    : "text-white/60 hover:bg-white/5 hover:text-white"
                )}
                title={collapsed ? item.label : undefined}
              >
                <div className="flex items-center gap-3">
                  <item.icon className={cn("shrink-0 h-5 w-5", isSubActive && "text-brand-400")} />
                  {!collapsed && <span>{item.label}</span>}
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

              {isGroupOpen && item.subItems && (
                <div className="pl-4 pr-1 py-1 space-y-1 animate-fade-in">
                  {item.subItems.map((sub) => {
                    const isSubItemActive = pathname === sub.href;
                    return (
                      <Link
                        key={sub.href}
                        href={sub.href}
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
