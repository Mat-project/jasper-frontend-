"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  FolderKanban,
  Building2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Edit2,
} from "lucide-react";
import { getProjects } from "@/lib/api/projects";
import { cn } from "@/lib/utils";
import AIRegisterTab from "./components/AIRegisterTab";
import RevisionManagementTab from "./components/RevisionManagementTab";
import RelationshipConfirmation from "./components/RelationshipConfirmation";
import RegisterReview from "./components/RegisterReview";
// Commercial is disconnected but not removed from the codebase per client instruction
// import CommercialTab from "./components/CommercialTab";

export default function ProjectDetailsPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const searchParams = useSearchParams();
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [register, setRegister] = useState<any | null>(null);
  const [rows, setRows] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"Extraction" | "Relationships" | "Review" | "Revisions">("Extraction");

  // Read search params for deep linking
  useEffect(() => {
    const tabParam = searchParams.get("tab") as any;
    if (tabParam && ["Extraction", "Relationships", "Review", "Revisions"].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const fetchRegisterData = React.useCallback(async () => {
    if (!id) return;
    try {
      const { getRegisters, getRegisterRows } = await import("@/lib/api/register_ai");
      const regs = await getRegisters(id);
      if (regs && regs.length > 0) {
        const activeReg = regs[0];
        setRegister(activeReg);
        // Rows are fetched separately — not embedded in the Register object
        const registerRows = await getRegisterRows(id, activeReg.id);
        setRows(registerRows ?? []);
        
        // Deep linking to specific row
        const rowId = searchParams.get("row");
        if (rowId && activeTab === "Review") {
          setTimeout(() => {
            const el = document.getElementById(`row-${rowId}`);
            if (el) {
              el.scrollIntoView({ behavior: 'smooth', block: 'center' });
              el.classList.add('ring-2', 'ring-blue-400', 'bg-blue-50/50');
              setTimeout(() => el.classList.remove('ring-2', 'ring-blue-400', 'bg-blue-50/50'), 3000);
            }
          }, 500); // Give React time to render the table
        }
      }
    } catch (error) {
      console.error("Failed to load register data", error);
    }
  }, [id, searchParams, activeTab]);

  useEffect(() => {
    async function loadProject() {
      try {
        const projects = await getProjects();
        const p = projects.find((proj: any) => proj.id === id);
        if (p) setProject(p);
      } catch (error) {
        console.error("Failed to load project", error);
      } finally {
        setLoading(false);
      }
    }
    loadProject();
  }, [id]);

  useEffect(() => {
    if (project) {
      fetchRegisterData();
    }
    
    // Listen for completion events from AIRegisterTab
    const handleZipCompleted = () => {
      fetchRegisterData();
      setActiveTab("Relationships"); // Auto-switch to relationships when extraction finishes
    };
    window.addEventListener("zip-processing-completed", handleZipCompleted);
    return () => window.removeEventListener("zip-processing-completed", handleZipCompleted);
  }, [project, fetchRegisterData]);

  if (loading) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-slate-800">Project Not Found</h2>
          <p className="text-slate-500 mt-2">The project you are looking for does not exist or you don&apos;t have access.</p>
          <button onClick={() => router.push("/projects")} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Return to Projects
          </button>
        </div>
      </div>
    );
  }

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      Active: "bg-blue-50 text-blue-700 border-blue-200",
      "On Hold": "bg-amber-50 text-amber-700 border-amber-200",
      Completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
      "At Risk": "bg-rose-50 text-rose-700 border-rose-200"
    };
    return map[status] || "bg-gray-50 text-gray-600 border-gray-200";
  };

  const priorityBadge = (priority: string) => {
    const map: Record<string, string> = {
      Critical: "bg-red-50 text-red-700 border-red-200",
      High: "bg-orange-50 text-orange-700 border-orange-200",
      Medium: "bg-yellow-50 text-yellow-700 border-yellow-200",
      Low: "bg-green-50 text-green-700 border-green-200"
    };
    return map[priority] || "bg-gray-50 text-gray-600 border-gray-200";
  };

  const tabs = [
    { id: "Extraction", label: "Upload & Extract" },
    { id: "Relationships", label: "Pending Relationships" },
    { id: "Review", label: "Register Review" },
    { id: "Revisions", label: "Revision History" }
  ] as const;

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 space-y-6">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs font-medium mb-1">
        <button onClick={() => router.push("/projects")} className="text-slate-500 hover:text-slate-800 transition-colors flex items-center gap-1">
          <ChevronLeft className="h-3 w-3" /> Back to Projects
        </button>
        <span className="text-slate-300">|</span>
        <span className="text-slate-400">Enterprise HRMS</span>
        <ChevronRight className="h-3 w-3 text-slate-400" />
        <span className="text-slate-400">Projects</span>
        <ChevronRight className="h-3 w-3 text-slate-400" />
        <span className="text-slate-600 font-semibold">{project.code}</span>
      </div>

      {/* Header Card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-50 rounded-xl">
              <FolderKanban className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded">
                  {project.code}
                </span>
                <span className={cn("px-2.5 py-0.5 rounded-full text-xs font-semibold border", statusBadge(project.status))}>
                  {project.status}
                </span>
                <span className={cn("px-2.5 py-0.5 rounded-full text-xs font-bold border", priorityBadge(project.priority || "Low"))}>
                  {project.priority || "Low"}
                </span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
              <div className="flex items-center gap-4 mt-2 text-sm text-slate-600">
                <span className="flex items-center gap-1"><Building2 className="h-4 w-4 text-slate-400" /> {project.client}</span>
                <span className="flex items-center gap-1"><Calendar className="h-4 w-4 text-slate-400" /> {project.start_date} to {project.end_date}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="px-4 py-2 bg-gray-50 border border-gray-200 hover:bg-gray-100 text-gray-700 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2">
              <Edit2 className="h-4 w-4" /> Edit Project
            </button>
            <button className="p-2 border border-gray-200 hover:bg-gray-100 rounded-lg transition-colors text-slate-500">
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors",
                activeTab === tab.id
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              )}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content: Conditional Rendering */}
      <div className="min-h-[50vh] pt-4">
        {activeTab === "Extraction" && <AIRegisterTab project={project} />}
        
        {activeTab === "Relationships" && (
          <RelationshipConfirmation
            projectId={project.id}
            onAllConfirmed={() => {
              fetchRegisterData();
              setActiveTab("Review"); // Auto-switch to review when relationships confirmed
            }}
          />
        )}
        
        {activeTab === "Review" && register ? (
          <RegisterReview
            register={register}
            rows={rows}
            onUploadNew={() => {
              fetchRegisterData();
              setActiveTab("Revisions");
            }}
          />
        ) : activeTab === "Review" ? (
          <div className="p-8 text-center bg-white rounded-xl shadow-sm border border-border">
            <p className="text-muted-foreground">No active register generated yet. Please complete extraction and relationships.</p>
          </div>
        ) : null}
        
        {activeTab === "Revisions" && <RevisionManagementTab projectId={project.id} />}
      </div>
    </div>
  );
}
