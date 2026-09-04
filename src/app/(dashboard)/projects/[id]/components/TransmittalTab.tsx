"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Mail,
  Send,
  History,
  FileText,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  ShieldCheck,
  Loader2,
  Paperclip,
  Building2,
  Download,
  Eye,
  Bold,
  Italic,
  Heading,
  List,
  Link2,
  Plus,
  X,
  FileSpreadsheet,
  FileArchive,
  FileCode,
  Image as ImageIcon,
  FileIcon,
} from "lucide-react";
import apiClient from "@/lib/api/client";
import ActiveSubmissionBanner from "./ActiveSubmissionBanner";
import { useProjectWorkspace } from "../WorkspaceProvider";
import { cn } from "@/lib/utils";

interface AttachmentFile {
  name: string;
  size: string;
  type: string;
  data?: string; // base64-encoded file content
  url?: string;
}

interface EmailTransmittal {
  id: string;
  dateSent: string;
  subject: string;
  to: string;
  cc?: string;
  bcc?: string;
  body: string;
  companyName: string;
  status: "Sent" | "Delivered" | "Failed";
}

interface ProjectContact {
  id: string;
  company_name: string;
  emails: string;
}

interface ZipPackage {
  id: string;
  submission_no: string;
  original_filename: string;
  heading?: string | null;
  created_at: string;
}

export default function TransmittalTab({
  project,
  projectId,
  onGoToReview,
}: {
  project: any;
  projectId: string;
  onGoToReview?: () => void;
}) {
  // Shared workspace context — keeps this tab's selected submission in sync
  // with the rest of the Register AI tabs.
  const { activeSubmissionId } = useProjectWorkspace();

  // State
  const [targetCompany, setTargetCompany] = useState("");
  const [senderAccount, setSenderAccount] = useState("domain");
  const [toField, setToField] = useState("");
  const [ccField, setCcField] = useState("");
  const [bccField, setBccField] = useState("");
  const [subjectField, setSubjectField] = useState("");
  const [bodyField, setBodyField] = useState("");
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const [localMailNumber, setLocalMailNumber] = useState("");

  // Submissions
  const [submissions, setSubmissions] = useState<ZipPackage[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState("");
  const [loadingSubmissions, setLoadingSubmissions] = useState(true);

  // Contacts
  const [contacts, setContacts] = useState<ProjectContact[]>([]);
  const [showAddContact, setShowAddContact] = useState(false);
  const [newContactName, setNewContactName] = useState("");
  const [newContactEmails, setNewContactEmails] = useState("");
  const [addingContact, setAddingContact] = useState(false);

  // Drawings
  const [drawings, setDrawings] = useState<string[]>([]);
  const [registerRows, setRegisterRows] = useState<any[]>([]);
  const [activeRegVersion, setActiveRegVersion] = useState("1.0");
  const [isRegisterApproved, setIsRegisterApproved] = useState(false);
  const [loadingDrawings, setLoadingDrawings] = useState(false);

  // Attachments State
  const [customAttachments, setCustomAttachments] = useState<AttachmentFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Derived visible count helper for attachments size calculation
  const visibleRowsCount = selectedSubmission
    ? registerRows.filter(r => r.zip_package === selectedSubmission).length
    : registerRows.length;

  // Attachments state - visually representing the active register dynamically
  const attachments = [
    { name: `JASPER_DOCUMENT_REGISTER_v${activeRegVersion}.csv`, size: `${Math.max(1, visibleRowsCount * 0.15).toFixed(2)} KB`, type: "text/csv" }
  ];

  // History State
  const [history, setHistory] = useState<EmailTransmittal[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [selectedTransmittal, setSelectedTransmittal] = useState<EmailTransmittal | null>(null);

  // Textarea Ref for formatting
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Format bytes helper
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Read file as base64
  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Add files handler
  const handleAddFiles = async (fileList: FileList) => {
    const filesArray: AttachmentFile[] = [];
    for (let i = 0; i < fileList.length; i++) {
      const f = fileList[i];
      try {
        const base64 = await readFileAsBase64(f);
        filesArray.push({
          name: f.name,
          size: formatBytes(f.size),
          type: f.type || "application/octet-stream",
          data: base64,
        });
      } catch (err) {
        console.error("Failed to read file", err);
        filesArray.push({ name: f.name, size: formatBytes(f.size), type: f.type || "application/octet-stream" });
      }
    }
    setCustomAttachments(prev => [...prev, ...filesArray]);
    showToast(`Attached ${filesArray.length} file(s)`, "success");
  };

  // Drag handlers
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragOver(true); };
  const handleDragLeave = () => setIsDragOver(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleAddFiles(e.dataTransfer.files);
    }
  };

  // File Icon helper
  const getFileIcon = (fileName: string) => {
    const ext = fileName.split(".").pop()?.toLowerCase();
    switch (ext) {
      case "pdf": return <FileText className="w-4 h-4 text-rose-500" />;
      case "xlsx": case "xls": case "csv": return <FileSpreadsheet className="w-4 h-4 text-emerald-500" />;
      case "zip": case "rar": return <FileArchive className="w-4 h-4 text-amber-500" />;
      case "png": case "jpg": case "jpeg": case "gif": return <ImageIcon className="w-4 h-4 text-indigo-500" />;
      case "dwg": case "dxf": case "cad": return <FileCode className="w-4 h-4 text-sky-500 font-bold" />;
      default: return <FileIcon className="w-4 h-4 text-slate-400" />;
    }
  };

  // Initialize To, Cc, Bcc and Mail Number from project defaults
  useEffect(() => {
    if (project?.mail_to) {
      setToField(project.mail_to);
    }
    if (project?.mail_cc) {
      setCcField(project.mail_cc);
    }
    if (project?.mail_bcc) {
      setBccField(project.mail_bcc);
    }
    if (project?.mail_number) {
      setLocalMailNumber(project.mail_number);
    }
  }, [project]);

  // Fetch transmittal history
  const fetchHistory = React.useCallback(async () => {
    setLoadingHistory(true);
    try {
      const res = await apiClient.get(`/api/v1/projects/${projectId}/emails/`);
      setHistory(res.data);
    } catch (err) {
      console.warn("Backend transmittal history API failed, loading local simulation...", err);
      const stored = localStorage.getItem(`transmittals_${projectId}`);
      if (stored) {
        setHistory(JSON.parse(stored));
      } else {
        setHistory([]);
      }
    } finally {
      setLoadingHistory(false);
    }
  }, [projectId]);

  // Fetch Contacts
  const fetchContacts = React.useCallback(async () => {
    try {
      const res = await apiClient.get(`/api/v1/projects/contacts/?project_id=${projectId}`);
      let data = res.data;
      if (data && typeof data === 'object' && 'results' in data) {
        data = data.results;
      }
      setContacts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch contacts", err);
    }
  }, [projectId]);

  // Fetch Submissions
  const fetchSubmissions = React.useCallback(async () => {
    setLoadingSubmissions(true);
    try {
      const res = await apiClient.get(`/api/v1/projects/${projectId}/submissions/`);
      let data = res.data;
      if (data && typeof data === 'object' && 'results' in data) {
        data = data.results;
      }
      const submissionsArray = Array.isArray(data) ? data : [];
      // Sort: newest first
      const sorted = submissionsArray.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setSubmissions(sorted);
      if (sorted && sorted.length > 0) {
        // Default to the shared active submission when available; otherwise
        // fall back to the latest submission. This keeps this tab in sync
        // with the rest of the Register AI workspace.
        const activeId = activeSubmissionId;
        const match = activeId ? sorted.find((s: any) => s.id === activeId) : null;
        setSelectedSubmission(match ? match.id : sorted[0].id);
      }
    } catch (err) {
      console.error("Failed to fetch submissions", err);
    } finally {
      setLoadingSubmissions(false);
    }
  }, [projectId, activeSubmissionId]);

  // Fetch Drawings filtered by submission
  const fetchDrawings = React.useCallback(async () => {
    if (!selectedSubmission) {
      setDrawings([]);
      setRegisterRows([]);
      return;
    }
    setLoadingDrawings(true);
    try {
      // Get all registers for this project
      const regRes = await apiClient.get(`/api/v1/projects/${projectId}/registers/`);
      let registers = regRes.data;
      if (registers && typeof registers === 'object' && 'results' in registers) {
        registers = registers.results;
      }
      const registersArray = Array.isArray(registers) ? registers : [];
      if (registersArray.length > 0) {
        // Find active register, or fallback to the latest draft
        const activeReg = registersArray.find((r: any) => r.status === "Active") || registersArray[0];
        setActiveRegVersion(activeReg.version_number.toString());
        setIsRegisterApproved(activeReg.is_approved === true);
        
        // Get rows for this register
        const rowsRes = await apiClient.get(`/api/v1/projects/${projectId}/registers/${activeReg.id}/rows/`);
        let allRows = rowsRes.data;
        if (allRows && typeof allRows === 'object' && 'results' in allRows) {
          allRows = allRows.results;
        }
        const rowsArray = Array.isArray(allRows) ? allRows : [];
        setRegisterRows(rowsArray);
        
        // Extract drawing numbers in order, filtered by the selected submission
        // (ZipPackage), sorted by drawing_number ascending so they appear in
        // proper sequential order (e.g. B5-025, B5-026, B5-027, ...).
        const extracted = rowsArray
          .filter((row: any) => row.drawing_number && row.zip_package === selectedSubmission)
          .sort((a: any, b: any) => {
            const aNum = a.drawing_number || "";
            const bNum = b.drawing_number || "";
            return aNum.localeCompare(bNum, undefined, { numeric: true, sensitivity: "base" });
          })
          .map((row: any) => {
            const rev = row.drawing_rev ? ` (Rev ${row.drawing_rev})` : "";
            return `${row.drawing_number}${rev}`;
          });
        
        setDrawings(extracted);
      }
    } catch (err) {
      console.error("Failed to fetch drawings", err);
    } finally {
      setLoadingDrawings(false);
    }
  }, [projectId, selectedSubmission]);

  // Fetch Register Approval status on mount
  const fetchRegisterStatus = React.useCallback(async () => {
    try {
      const regRes = await apiClient.get(`/api/v1/projects/${projectId}/registers/`);
      let registers = regRes.data;
      if (registers && typeof registers === 'object' && 'results' in registers) {
        registers = registers.results;
      }
      const registersArray = Array.isArray(registers) ? registers : [];
      if (registersArray.length > 0) {
        const activeReg = registersArray.find((r: any) => r.status === "Active") || registersArray[0];
        setActiveRegVersion(activeReg.version_number.toString());
        setIsRegisterApproved(activeReg.is_approved === true);
      } else {
        setIsRegisterApproved(false);
      }
    } catch (err) {
      console.error("Failed to fetch register status in TransmittalTab", err);
    }
  }, [projectId]);

  useEffect(() => {
    if (project) {
      fetchHistory();
      fetchContacts();
      fetchSubmissions();
      fetchRegisterStatus();
    }
  }, [project, fetchHistory, fetchContacts, fetchSubmissions, fetchRegisterStatus]);

  useEffect(() => {
    if (projectId && selectedSubmission) {
      fetchDrawings();
    }
  }, [projectId, selectedSubmission, fetchDrawings]);

  // Keep the local selector in sync with the shared active submission.
  // When the workspace active submission changes (e.g. a new ZIP finishes or
  // the user switches submission from another tab), follow it as long as it
  // exists in the loaded submissions list.
  useEffect(() => {
    if (!activeSubmissionId || submissions.length === 0) return;
    const exists = submissions.some((s) => s.id === activeSubmissionId);
    if (exists && selectedSubmission !== activeSubmissionId) {
      setSelectedSubmission(activeSubmissionId);
    }
  }, [activeSubmissionId, submissions, selectedSubmission]);

  // Reactive email body compiler
  useEffect(() => {
    let companyName = project?.client || "Client";
    
    if (targetCompany) {
      const contactData = contacts.find(c => c.id.toString() === targetCompany);
      if (contactData) {
        // Use contact's emails for To, but keep project default CC/BCC
        setToField(contactData.emails);
        setCcField(project?.mail_cc || "");
        setBccField(project?.mail_bcc || "");
        companyName = contactData.company_name;
      }
    }

    const mailNum = localMailNumber || "MAIL-001";
    setSubjectField(mailNum);

    // ── Use ZIP filename heading instead of project name ──────────
    // The client wants the descriptive heading from the ZIP filename
    // to appear in the email body instead of the project name.
    const selectedSub = submissions.find(s => s.id === selectedSubmission);
    const heading = selectedSub?.heading || selectedSub?.original_filename || project?.name || "Project";

    let drawingListText = "";
    if (drawings.length > 0) {
      drawingListText = drawings.map((dwg, idx) => `${idx + 1}. ${dwg}`).join("\n");
    } else {
      drawingListText = "1. [No drawings found in this submission]";
    }

    const bodyText = `Dear ${companyName} Team,

Please click the link below to download the following drawings.

${heading}

${drawingListText}

[Paste Link Here]

Thanks & Regards,
${project?.created_by?.first_name || 'Document Control'}
Jasper Detailing Services`;

    setBodyField(bodyText);
  }, [targetCompany, drawings, localMailNumber, contacts, project, submissions, selectedSubmission]);

  // Toast Helper
  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleDownloadRegisterCSV = () => {
    if (registerRows.length === 0) {
      showToast("No active register rows found to export.", "error");
      return;
    }
    const subMap = new Map(submissions.map(s => [s.id, s.submission_no]));
    const submissionNo = subMap.get(selectedSubmission) || "Master";
    
    const headers = [
      "Drawing Number",
      "Drawing Title",
      "BBS Number",
      "Total Weight (kg)",
      "Sheet No",
      "Drawing Rev",
      "BBS Rev",
      "Drawn By",
      "Checked By",
      "Section",
      "Remarks"
    ];
    
    const targetRows = selectedSubmission
      ? registerRows.filter(r => r.zip_package === selectedSubmission)
      : registerRows;
      
    if (targetRows.length === 0) {
      showToast("No rows found in this submission view to export.", "info");
      return;
    }
    
    const csvRows = targetRows.map(row => [
      `"${(row.drawing_number || '').replace(/"/g, '""')}"`,
      `"${(row.drawing_title || '').replace(/"/g, '""')}"`,
      `"${(row.bbs_numbers || '').replace(/"/g, '""')}"`,
      `"${row.total_weight ?? ''}"`,
      `"${(row.sheet_no || '').replace(/"/g, '""')}"`,
      `"${(row.drawing_rev || '').replace(/"/g, '""')}"`,
      `"${(row.bbs_revs || '').replace(/"/g, '""')}"`,
      `"${(row.drawn_by || '').replace(/"/g, '""')}"`,
      `"${(row.checked_by || '').replace(/"/g, '""')}"`,
      `"${(row.section || '').replace(/"/g, '""')}"`,
      `"${(row.remarks || '').replace(/"/g, '""')}"`
    ]);
    
    const csvContent = [
      headers.join(","),
      ...csvRows.map(e => e.join(","))
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `JASPER_DOCUMENT_REGISTER_v${activeRegVersion}_${submissionNo}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Downloaded document register as CSV successfully!", "success");
  };

  const handleExportHistoryCSV = () => {
    if (history.length === 0) {
      showToast("No transmittal records found to export.", "error");
      return;
    }
    const headers = ["Date Sent", "Subject", "To", "Cc", "Bcc", "Recipient Company", "Status"];
    const csvRows = history.map(item => [
      `"${new Date(item.dateSent).toLocaleString()}"`,
      `"${(item.subject || '').replace(/"/g, '""')}"`,
      `"${(item.to || '').replace(/"/g, '""')}"`,
      `"${(item.cc || '').replace(/"/g, '""')}"`,
      `"${(item.bcc || '').replace(/"/g, '""')}"`,
      `"${(item.companyName || '').replace(/"/g, '""')}"`,
      `"${item.status}"`
    ]);
    const csvContent = [headers.join(","), ...csvRows.map(e => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `PROJECT_TRANSMITTAL_DISPATCH_REPORT.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Downloaded transmittal history report as CSV successfully!", "success");
  };

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContactName.trim() || !newContactEmails.trim()) {
      return;
    }
    setAddingContact(true);
    try {
      const res = await apiClient.post(`/api/v1/projects/contacts/`, {
        project: projectId,
        company_name: newContactName,
        emails: newContactEmails
      });
      setContacts([...contacts, res.data]);
      setShowAddContact(false);
      setNewContactName("");
      setNewContactEmails("");
      showToast("Contact saved successfully", "success");
    } catch (err) {
      console.error(err);
      showToast("Failed to save contact", "error");
    } finally {
      setAddingContact(false);
    }
  };

  const handleCompanyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const contactId = e.target.value;
    setTargetCompany(contactId);
    if (!contactId) {
      setToField("");
      setSubjectField("");
      setBodyField("");
    }
  };

  const handleSubmissionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const subId = e.target.value;
    setSelectedSubmission(subId);
  };

  // Text formatting controls
  const insertFormat = (type: "bold" | "italic" | "heading" | "list" | "link") => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selectedText = text.substring(start, end);

    let replacement = "";
    switch (type) {
      case "bold":
        replacement = `**${selectedText || "bold text"}**`;
        break;
      case "italic":
        replacement = `*${selectedText || "italic text"}*`;
        break;
      case "heading":
        replacement = `
### ${selectedText || "Heading"}
`;
        break;
      case "list":
        replacement = `
- ${selectedText || "List item"}
`;
        break;
      case "link":
        replacement = `[${selectedText || "Link Text"}](http://example.com)`;
        break;
    }

    const newText = text.substring(0, start) + replacement + text.substring(end);
    setBodyField(newText);
    
    // Reset caret selection
    setTimeout(() => {
      textarea.focus();
      const offset = replacement.length - selectedText.length;
      textarea.setSelectionRange(start, end + offset);
    }, 10);
  };

  // Form submission
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isRegisterApproved) {
      showToast("Document Register must be formally approved in Register Review before sending client transmittals.", "error");
      return;
    }
    if (!toField.trim() || !subjectField.trim() || !bodyField.trim()) {
      showToast("Please fill in To, Subject, and Email Body fields.", "error");
      return;
    }

    setSending(true);
    
    const targetContact = contacts.find(c => c.id.toString() === targetCompany);

    // Build attachments payload (with real base64 file data)
    const allAttachmentsPayload = customAttachments.map(a => ({
      name: a.name,
      size: a.size,
      type: a.type,
      data: a.data
    }));

    const payload = {
      senderAccount: senderAccount,
      to: toField,
      cc: ccField,
      bcc: bccField,
      subject: subjectField,
      body: bodyField,
      companyName: targetContact ? targetContact.company_name : (project?.client || "Client"),
      attachments: allAttachmentsPayload
    };

    try {
      const res = await apiClient.post(`/api/v1/projects/${projectId}/email/send/`, payload);
      showToast("Transmittal email sent successfully via SMTP!", "success");
      fetchHistory();
      
      if (res.data.newMailNumber) {
        setLocalMailNumber(res.data.newMailNumber);
        if (project) {
          project.mail_number = res.data.newMailNumber;
        }
      }
      
      // Reset form controls
      setTargetCompany("");
      setToField(project?.mail_to || "");
      setCcField(project?.mail_cc || "");
      setBccField(project?.mail_bcc || "");
      setSubjectField("");
      setBodyField("");
      setCustomAttachments([]);
    } catch (err: any) {
      console.error("Failed to send email via API", err);
      showToast(err.response?.data?.error || "Failed to dispatch email. Check SMTP setup.", "error");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-slate-50 rounded-xl p-4 md:p-6 space-y-6 relative border border-slate-200 shadow-inner">
      {/* Toast Notification banner */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-xl bg-white border border-slate-200 animate-slide-in">
          {toast.type === "success" && <CheckCircle className="w-5 h-5 text-emerald-500" />}
          {toast.type === "error" && <AlertCircle className="w-5 h-5 text-rose-500" />}
          {toast.type === "info" && <Building2 className="w-5 h-5 text-blue-500" />}
          <span className="text-sm font-medium text-slate-700">{toast.message}</span>
        </div>
      )}

      {/* Active Submission banner — shared across all tabs */}
      <ActiveSubmissionBanner
        selectedSubmissionId={selectedSubmission || undefined}
        selectedSubmissionNo={
          submissions.find((s) => s.id === selectedSubmission)?.submission_no
        }
      />

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Email Composer form block */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-blue-50 text-blue-600 rounded-md">
                  <Mail className="w-4.5 h-4.5" />
                </div>
                <h2 className="font-semibold text-slate-800">Create Transmittal Notice</h2>
              </div>
            </div>

            <form onSubmit={handleSend} className="p-6 space-y-5">
              {/* Approval Status Alert Banner */}
              {!isRegisterApproved ? (
                <div className="bg-amber-50 border border-amber-200/90 text-amber-900 p-4 rounded-xl flex items-center justify-between shadow-2xs">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-100 text-amber-700 rounded-lg shrink-0">
                      <AlertTriangle className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-amber-900">
                        Register Approval Required Before Client Dispatch
                      </h4>
                      <p className="text-xs text-amber-700 mt-0.5">
                        Document Register v{activeRegVersion} is currently in <span className="font-semibold">Draft</span> status. Formally sign off in Register Review before sending transmittal emails to clients.
                      </p>
                    </div>
                  </div>
                  {onGoToReview && (
                    <button
                      type="button"
                      onClick={onGoToReview}
                      className="text-xs font-bold text-amber-900 bg-amber-200/80 hover:bg-amber-300 px-3.5 py-2 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 ml-4"
                    >
                      <ShieldCheck className="h-4 w-4 text-amber-800" />
                      Go to Register Review
                    </button>
                  )}
                </div>
              ) : (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 px-4 py-3 rounded-xl flex items-center justify-between shadow-2xs">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle className="h-4.5 w-4.5 text-emerald-600 shrink-0" />
                    <p className="text-xs text-emerald-800 font-medium">
                      <span className="font-bold text-emerald-900">Document Register v{activeRegVersion} Formally Approved</span> — Certified and ready for client dispatch.
                    </p>
                  </div>
                  <span className="px-2.5 py-0.5 text-[10px] font-bold bg-emerald-200/80 text-emerald-800 rounded-full border border-emerald-300">
                    Certified
                  </span>
                </div>
              {/* Sender Account Channel Selector */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center justify-between">
                  <span>Sender Account Channel</span>
                  <span className="text-[10px] font-normal text-slate-400">Select outgoing mail account</span>
                </label>
                <select
                  value={senderAccount}
                  onChange={(e) => setSenderAccount(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                >
                  <option value="domain">
                    🔹 Domain Email: jaspermdu_submission@alef-jasper.com (Verified 100% Inboxing)
                  </option>
                  <option value="personal_gmail">
                    🔸 Personal Gmail: jasperalef1@gmail.com (Native Google Dispatch)
                  </option>
                </select>
              </div>

              {/* Submission Selector */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                  Select Submission (ZIP Batch)
                </label>
                {loadingSubmissions ? (
                  <div className="text-xs text-slate-400 py-2">Loading submissions...</div>
                ) : submissions.length === 0 ? (
                  <div className="text-xs text-rose-500 py-2">No submissions (ZIP uploads) found for this project.</div>
                ) : (
                  <select
                    value={selectedSubmission}
                    onChange={handleSubmissionChange}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                  >
                    {submissions.map(sub => (
                      <option key={sub.id} value={sub.id}>
                        {sub.submission_no || "SUB-New"} - {sub.original_filename} ({new Date(sub.created_at).toLocaleDateString()})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Target Company Selector */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Saved Contacts
                  </label>
                  <button 
                    type="button" 
                    onClick={() => setShowAddContact(!showAddContact)}
                    className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Contact
                  </button>
                </div>
                
                {showAddContact && (
                  <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-4 space-y-3">
                    <h4 className="text-xs font-bold text-blue-800 uppercase">Save New Contact</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input 
                        type="text" 
                        placeholder="Company or Contact Name" 
                        value={newContactName}
                        onChange={e => setNewContactName(e.target.value)}
                        className="text-sm px-3 py-2 border border-blue-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                      <input 
                        type="text" 
                        placeholder="Emails (comma separated)" 
                        value={newContactEmails}
                        onChange={e => setNewContactEmails(e.target.value)}
                        className="text-sm px-3 py-2 border border-blue-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <button 
                        type="button" 
                        onClick={() => setShowAddContact(false)}
                        className="px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100 rounded transition"
                      >
                        Cancel
                      </button>
                      <button 
                        type="button" 
                        onClick={handleAddContact}
                        disabled={addingContact}
                        className="px-3 py-1.5 text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 rounded transition"
                      >
                        {addingContact ? "Saving..." : "Save Contact"}
                      </button>
                    </div>
                  </div>
                )}

                <select
                  value={targetCompany}
                  onChange={handleCompanyChange}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                >
                  <option value="">-- Choose saved contact to autofill transmittal --</option>
                  {contacts.map(contact => (
                    <option key={contact.id} value={contact.id.toString()}>
                      {contact.company_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* To Recipient emails */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                    To <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="comma-separated emails (e.g. engineering@client.com)"
                    value={toField}
                    onChange={e => setToField(e.target.value)}
                    required
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                  />
                </div>

                {/* Cc Recipient emails */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                    Cc (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="carbon copy email addresses"
                    value={ccField}
                    onChange={e => setCcField(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                  />
                </div>

                {/* Bcc Recipient emails */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                    Bcc (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="blind carbon copy email addresses"
                    value={bccField}
                    onChange={e => setBccField(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                  />
                </div>
              </div>

              {/* Subject line input */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                  Subject Line (Mail Number) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter email subject line"
                  value={subjectField}
                  onChange={e => setSubjectField(e.target.value)}
                  required
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition font-mono"
                />
              </div>

              {/* Body Rich Text editor */}
              <div>
                <div className="flex justify-between items-end mb-1">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Transmittal Notice Body <span className="text-rose-500">*</span>
                  </label>
                  {loadingDrawings && (
                     <span className="text-[10px] text-blue-500 flex items-center gap-1">
                        <Loader2 className="w-3 h-3 animate-spin" /> Fetching Drawings...
                     </span>
                  )}
                </div>
                
                {/* Rich Text controls toolbar */}
                <div className="flex flex-wrap items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-b-0 border-slate-200 rounded-t-lg">
                  <button
                    type="button"
                    onClick={() => insertFormat("bold")}
                    className="p-1.5 text-slate-600 hover:text-slate-800 rounded hover:bg-slate-200 transition"
                    title="Bold text"
                  >
                    <Bold className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormat("italic")}
                    className="p-1.5 text-slate-600 hover:text-slate-800 rounded hover:bg-slate-200 transition"
                    title="Italic text"
                  >
                    <Italic className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormat("heading")}
                    className="p-1.5 text-slate-600 hover:text-slate-800 rounded hover:bg-slate-200 transition"
                    title="Add Heading"
                  >
                    <Heading className="w-4 h-4" />
                  </button>
                  <span className="w-px h-5 bg-slate-200 mx-1"></span>
                  <button
                    type="button"
                    onClick={() => insertFormat("list")}
                    className="p-1.5 text-slate-600 hover:text-slate-800 rounded hover:bg-slate-200 transition"
                    title="Bullet List"
                  >
                    <List className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormat("link")}
                    className="p-1.5 text-slate-600 hover:text-slate-800 rounded hover:bg-slate-200 transition"
                    title="Insert Link"
                  >
                    <Link2 className="w-4 h-4" />
                  </button>
                </div>

                <textarea
                  ref={textareaRef}
                  rows={14}
                  placeholder="Transmittal notice message will appear here..."
                  value={bodyField}
                  onChange={e => setBodyField(e.target.value)}
                  required
                  className="w-full bg-white border border-slate-200 rounded-b-lg px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition font-mono"
                />
              </div>

              {/* Attachments Upload Dropzone */}
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <Paperclip className="w-3.5 h-3.5 text-slate-400" />
                    <span>Transmittal Attachments (Optional)</span>
                  </label>
                  <span className="text-xs text-slate-400 font-medium">
                    {customAttachments.length} file{customAttachments.length === 1 ? "" : "s"} attached
                  </span>
                </div>

                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition ${
                    isDragOver
                      ? "border-blue-500 bg-blue-50/50"
                      : "border-slate-200 hover:border-blue-400 hover:bg-slate-50/60 bg-slate-50/30"
                  }`}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    multiple
                    className="hidden"
                    onChange={(e) => e.target.files && handleAddFiles(e.target.files)}
                  />
                  <div className="flex flex-col items-center justify-center gap-1.5">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-full">
                      <Paperclip className="w-5 h-5" />
                    </div>
                    <p className="text-xs text-slate-700 font-medium">
                      Drag &amp; drop attachments here, or <span className="text-blue-600 font-semibold hover:underline">browse files</span>
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Supports PDF drawings, ZIP archives, DWG, Excel registers, BBS reports, and images
                    </p>
                  </div>
                </div>

                {customAttachments.length > 0 && (
                  <div className="space-y-2 pt-1">
                    <div className="flex flex-wrap gap-2">
                      {customAttachments.map((file, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2 pl-3 pr-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 shadow-2xs group"
                        >
                          {getFileIcon(file.name)}
                          <span className="font-medium max-w-[220px] truncate" title={file.name}>
                            {file.name}
                          </span>
                          <span className="text-slate-400 font-normal text-xxs">({file.size})</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setCustomAttachments((prev) => prev.filter((_, i) => i !== idx));
                            }}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                            title="Remove attachment"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Send Button container */}
              <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100">
                {!isRegisterApproved ? (
                  <p className="text-xs text-amber-700 font-medium flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    Approve register in Register Review to unlock client email dispatch
                  </p>
                ) : (
                  <div />
                )}
                <button
                  type="submit"
                  disabled={sending || !isRegisterApproved}
                  title={!isRegisterApproved ? "Approve register in Register Review tab to enable client dispatch" : undefined}
                  className={cn(
                    "px-5 py-2 font-medium rounded-lg text-sm shadow-sm transition flex items-center gap-2",
                    !isRegisterApproved
                      ? "bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300"
                      : "bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
                  )}
                >
                  {sending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Sending Notice...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Send Transmittal Email
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Sidebar components block */}
        <div className="space-y-6">
          
          {/* Attachment Register & Custom Files list component */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Paperclip className="w-4.5 h-4.5 text-slate-500" />
                <h3 className="font-semibold text-slate-800 text-sm">Transmittal Bundle ({1 + customAttachments.length})</h3>
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs text-blue-600 font-semibold hover:text-blue-700 flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Attach
              </button>
            </div>
            <div className="p-4 space-y-3">
              {/* Auto Document Register */}
              {attachments.map(att => (
                <div key={att.name} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="p-2 bg-rose-50 text-rose-500 rounded-md shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-700 truncate" title={att.name}>
                        {att.name}
                      </p>
                      <p className="text-[10px] text-emerald-600 font-medium">{att.size} • Auto-generated</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleDownloadRegisterCSV}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded transition cursor-pointer"
                    title="Download Copy"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              ))}

              {/* Custom Attached Files */}
              {customAttachments.map((att, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-white hover:bg-slate-50 transition shadow-2xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="p-2 bg-slate-100 rounded-md shrink-0">
                      {getFileIcon(att.name)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-700 truncate" title={att.name}>
                        {att.name}
                      </p>
                      <p className="text-[10px] text-slate-400 font-medium">{att.size}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCustomAttachments(prev => prev.filter((_, i) => i !== idx))}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded transition cursor-pointer"
                    title="Remove"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}

              <p className="text-[11px] text-slate-400 text-center italic mt-2">
                * All attached files will be dispatched as real email attachments to the client.
              </p>
            </div>
          </div>

          {/* Smart Project Info block */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
            <h3 className="font-semibold text-slate-800 text-sm border-b border-slate-100 pb-2">
              Project Information Summary
            </h3>
            
            <div className="space-y-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Project Code
                </span>
                <span className="text-sm font-medium text-slate-700">
                  {project?.code}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Client Name
                </span>
                <span className="text-sm font-medium text-slate-700">
                  {project?.client || "Not Specified"}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Mail Number (Fixed Ref)
                </span>
                <span className="text-sm font-medium text-slate-700 font-mono">
                  {localMailNumber || "None Configured"}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Drawings in this Submission
                </span>
                <span className="text-sm font-medium text-slate-700 font-mono">
                  {drawings.length} items
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Email history table section */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <History className="w-4.5 h-4.5 text-slate-500" />
            <h3 className="font-semibold text-slate-800">Transmittal Dispatch History</h3>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full font-medium">
              {history.length} Record{history.length !== 1 ? "s" : ""}
            </span>
            {history.length > 0 && (
              <button
                type="button"
                onClick={handleExportHistoryCSV}
                className="flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg text-xs font-semibold transition"
                title="Download full history report as CSV"
              >
                <Download className="w-3.5 h-3.5 text-emerald-600" />
                Export Report (CSV)
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          {loadingHistory ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
              <span className="text-sm">Loading dispatch records...</span>
            </div>
          ) : history.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400">
              <Mail className="w-10 h-10 mb-2 stroke-1" />
              <span className="text-sm font-medium">No transmittal emails dispatched yet.</span>
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 text-xs font-semibold uppercase tracking-wider bg-slate-50/40">
                  <th className="py-3.5 px-6">Date Sent</th>
                  <th className="py-3.5 px-6">Subject</th>
                  <th className="py-3.5 px-6">Recipients (To / Cc)</th>
                  <th className="py-3.5 px-6">Recipient Company</th>
                  <th className="py-3.5 px-6">Delivery Status</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {history.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition">
                    <td className="py-4 px-6 whitespace-nowrap text-slate-500 font-mono text-xs">
                      {new Date(item.dateSent).toLocaleString("en-AE", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </td>
                    <td className="py-4 px-6 font-medium text-slate-700">
                      {item.subject}
                    </td>
                    <td className="py-4 px-6">
                      <div className="max-w-xs truncate" title={item.to}>
                        <span className="text-slate-600 block truncate font-medium">{item.to}</span>
                        {item.cc && (
                          <span className="text-[11px] text-slate-400 block truncate">Cc: {item.cc}</span>
                        )}
                        {item.bcc && (
                          <span className="text-[11px] text-slate-400 block truncate">Bcc: {item.bcc}</span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-slate-600">
                      {item.companyName}
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                          item.status === "Delivered"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                            : item.status === "Sent"
                            ? "bg-blue-50 text-blue-700 border border-blue-100"
                            : "bg-rose-50 text-rose-700 border border-rose-100"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            item.status === "Delivered"
                              ? "bg-emerald-500"
                              : item.status === "Sent"
                              ? "bg-blue-500"
                              : "bg-rose-500"
                          }`}
                        />
                        {item.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right whitespace-nowrap">
                      <button
                        onClick={() => setSelectedTransmittal(item)}
                        className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 hover:text-slate-800 rounded-lg text-xs font-medium transition inline-flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Details View modal dialog */}
      {selectedTransmittal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col animate-scale-up">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center">
              <h3 className="font-bold text-slate-800">Transmittal Dispatch Details</h3>
              <button
                onClick={() => setSelectedTransmittal(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-medium p-1"
              >
                &times;
              </button>
            </div>
            
            <div className="p-6 space-y-4 overflow-y-auto flex-1 text-sm">
              <div className="grid grid-cols-3 gap-2 border-b border-slate-100 pb-3">
                <span className="text-slate-400 font-medium">Recipient Company:</span>
                <span className="col-span-2 text-slate-700 font-semibold">{selectedTransmittal.companyName}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 border-b border-slate-100 pb-3">
                <span className="text-slate-400 font-medium">To:</span>
                <span className="col-span-2 text-slate-700 break-all">{selectedTransmittal.to}</span>
              </div>
              {selectedTransmittal.cc && (
                <div className="grid grid-cols-3 gap-2 border-b border-slate-100 pb-3">
                  <span className="text-slate-400 font-medium">Cc:</span>
                  <span className="col-span-2 text-slate-700 break-all">{selectedTransmittal.cc}</span>
                </div>
              )}
              {selectedTransmittal.bcc && (
                <div className="grid grid-cols-3 gap-2 border-b border-slate-100 pb-3">
                  <span className="text-slate-400 font-medium">Bcc:</span>
                  <span className="col-span-2 text-slate-700 break-all">{selectedTransmittal.bcc}</span>
                </div>
              )}
              <div className="grid grid-cols-3 gap-2 border-b border-slate-100 pb-3">
                <span className="text-slate-400 font-medium">Date Dispatched:</span>
                <span className="col-span-2 text-slate-700 font-mono">
                  {new Date(selectedTransmittal.dateSent).toLocaleString()}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 border-b border-slate-100 pb-3">
                <span className="text-slate-400 font-medium">Delivery Status:</span>
                <span className="col-span-2">
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold border border-slate-200">
                    {selectedTransmittal.status}
                  </span>
                </span>
              </div>

              <div>
                <span className="text-slate-400 font-medium block mb-2">Transmittal Content:</span>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 font-mono text-xs text-slate-600 whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto">
                  {selectedTransmittal.body}
                </div>
              </div>
            </div>

            <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/50 flex justify-end">
              <button
                onClick={() => setSelectedTransmittal(null)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
