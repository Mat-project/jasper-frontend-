"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getAccessToken } from "@/lib/api/client";
import { 
  FileText, 
  ArrowLeft, 
  Download, 
  Eye, 
  ExternalLink,
  FolderKanban,
  Building2,
  Calendar,
  Clock,
  HardDrive,
  FileBadge2,
  Hash,
  AlertCircle
} from "lucide-react";

interface DocumentDetail {
  id: string;
  file_name: string;
  document_number: string;
  document_type: string;
  file_extension: string;
  file_size: string;
  project: { id: string; name: string };
  company: { name: string };
  register: { name: string; version: string };
  uploaded_by: string;
  uploaded_date: string;
  last_modified: string;
  status: string;
  file_path: string;
}

export default function DocumentDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [doc, setDoc] = useState<DocumentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const docId = params.id as string;

  useEffect(() => {
    const fetchDoc = async () => {
      try {
        const token = getAccessToken();
        const res = await fetch(`http://localhost:8000/api/v1/search/documents/${docId}/`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (res.ok) {
          const data = await res.json();
          setDoc(data);
        } else {
          setError("Document not found");
        }
      } catch (e) {
        setError("Failed to fetch document");
      } finally {
        setLoading(false);
      }
    };

    fetchDoc();
  }, [docId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin h-8 w-8 border-4 border-brand-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error || !doc) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <AlertCircle className="h-12 w-12 text-rose-500" />
        <h2 className="text-xl font-bold">Document Not Found</h2>
        <button 
          onClick={() => router.back()}
          className="text-brand-600 font-medium hover:underline"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto pb-12 animate-fade-in">
      {/* Header & Navigation */}
      <div className="flex items-center justify-between mb-8">
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to previous
        </button>
        
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-card border border-border rounded-lg text-sm font-semibold hover:bg-muted/50 transition-colors shadow-sm opacity-50 cursor-not-allowed">
            <Eye className="h-4 w-4" /> View File
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-card border border-border rounded-lg text-sm font-semibold hover:bg-muted/50 transition-colors shadow-sm opacity-50 cursor-not-allowed">
            <Download className="h-4 w-4" /> Download
          </button>
          <button 
            onClick={() => router.push(`/projects/${doc.project.id}`)}
            className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-semibold hover:bg-brand-700 transition-colors shadow-sm"
          >
            <ExternalLink className="h-4 w-4" /> Open Register
          </button>
        </div>
      </div>

      {/* Hero Section */}
      <div className="bg-white dark:bg-card rounded-2xl p-8 border border-border shadow-sm mb-6 flex items-start justify-between">
        <div className="flex gap-6 items-start">
          <div className={`mt-1 flex items-center justify-center h-16 w-16 rounded-2xl shrink-0 shadow-sm ${
            doc.document_type === 'Drawing' 
              ? 'bg-blue-500/10 text-blue-600' 
              : 'bg-emerald-500/10 text-emerald-600'
          }`}>
            <FileText className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-foreground mb-2">
              {doc.document_number}
            </h1>
            <div className="flex items-center gap-3">
              <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${
                doc.document_type === 'Drawing' 
                  ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800' 
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800'
              }`}>
                {doc.document_type}
              </span>
              <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${
                doc.status === 'Valid' 
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800' 
                  : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/20 dark:border-rose-800'
              }`}>
                {doc.status}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid Information */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Card 1: File Info */}
        <div className="bg-white dark:bg-card rounded-2xl p-6 border border-border shadow-sm">
          <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-5 flex items-center gap-2">
            <HardDrive className="h-4 w-4" /> File Information
          </h3>
          <div className="space-y-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">File Name</p>
              <p className="text-sm font-semibold truncate" title={doc.file_name}>{doc.file_name}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Extension</p>
                <p className="text-sm font-semibold uppercase">{doc.file_extension}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Size</p>
                <p className="text-sm font-semibold">{doc.file_size}</p>
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1.5"><Calendar className="h-3 w-3"/> Upload Date</p>
              <p className="text-sm font-semibold">{new Date(doc.uploaded_date).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1.5"><Clock className="h-3 w-3"/> Last Modified</p>
              <p className="text-sm font-semibold">{new Date(doc.last_modified).toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Card 2: Project Info */}
        <div className="bg-white dark:bg-card rounded-2xl p-6 border border-border shadow-sm">
          <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-5 flex items-center gap-2">
            <FolderKanban className="h-4 w-4" /> Project Context
          </h3>
          <div className="space-y-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Project Name</p>
              <p className="text-sm font-semibold">{doc.project.name}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1.5"><Hash className="h-3 w-3"/> Project ID</p>
              <p className="text-sm font-semibold">{doc.project.id}</p>
            </div>
            <div className="pt-2 mt-2 border-t border-border/50">
              <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1.5"><Building2 className="h-3 w-3"/> Client / Company</p>
              <p className="text-sm font-semibold">{doc.company.name}</p>
            </div>
          </div>
        </div>

        {/* Card 3: Register Metadata */}
        <div className="bg-white dark:bg-card rounded-2xl p-6 border border-border shadow-sm">
          <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-5 flex items-center gap-2">
            <FileBadge2 className="h-4 w-4" /> Register Details
          </h3>
          <div className="space-y-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Register Source</p>
              <p className="text-sm font-semibold">{doc.register.name}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Register Version</p>
              <p className="text-sm font-semibold">{doc.register.version}</p>
            </div>
            <div className="pt-2 mt-2 border-t border-border/50">
              <p className="text-xs text-muted-foreground mb-1">Uploaded By</p>
              <p className="text-sm font-semibold">{doc.uploaded_by}</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
