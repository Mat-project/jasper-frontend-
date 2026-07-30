"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
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
// Commercial is disconnected but not removed from the codebase per client instruction
// import CommercialTab from "./components/CommercialTab";

export default function ProjectDetailsPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen p-6 flex flex-col items-center justify-center text-slate-500">
        <FolderKanban className="h-12 w-12 text-slate-300 mb-4" />
        <h2 className="text-xl font-bold text-gray-900">Project Not Found</h2>
        <button onClick={() => router.push("/projects")} className="mt-4 text-blue-600 hover:underline">
          Return to Projects
        </button>
      </div>
    );
  }

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      "Active": "bg-emerald-50 text-emerald-700 border-emerald-200",
      "At Risk": "bg-red-50 text-red-700 border-red-200",
      "Completed": "bg-blue-50 text-blue-700 border-blue-200",
      "On Hold": "bg-amber-50 text-amber-700 border-amber-200",
      "Planned": "bg-slate-50 text-slate-600 border-slate-200",
    };
    return map[status] || "bg-gray-50 text-gray-600 border-gray-200";
  };

  const priorityBadge = (priority: string) => {
    const map: Record<string, string> = {
      "High": "bg-orange-50 text-orange-700 border-orange-200",
      "Low": "bg-slate-50 text-slate-600 border-slate-200",
    };
    return map[priority] || "bg-gray-50 text-gray-600 border-gray-200";
  };

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

      {/* Main Content: Register AI Hub (Tabs removed per client request) */}
      <div className="min-h-[50vh]">
        <AIRegisterTab project={project} />
      </div>
    </div>
  );
}
