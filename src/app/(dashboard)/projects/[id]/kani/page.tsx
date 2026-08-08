"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Mail,
  Send,
  FileText,
  CheckCircle,
  AlertCircle,
  Loader2,
  Paperclip,
  ChevronLeft,
  Building2,
  Download,
  Bold,
  Italic,
  Heading,
  List,
  Link2,
  Inbox,
  CornerUpLeft,
  Plus,
  FileSpreadsheet,
  FileArchive,
  X,
  FileCode,
  User,
  FileIcon,
  Image as ImageIcon,
  RefreshCw,
  Trash2,
  Save,
  RotateCcw,
  Tag,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { getProjects, type EnterpriseProject } from "@/lib/api/projects";
import apiClient from "@/lib/api/client";

// Sender identity — read from public env var
const SENDER_EMAIL = process.env.NEXT_PUBLIC_DEFAULT_FROM_EMAIL || "jasperalief1@gmail.com";
const SENDER_NAME = "Lead Draftsman";

// Types
interface AttachmentFile {
  name: string;
  size: string;
  type: string;
  data?: string; // base64-encoded file content for real uploads
}

interface EmailMessage {
  id: string;
  from: string;
  fromName: string;
  to: string;
  cc?: string;
  subject: string;
  body: string;
  dateSent: string;
  companyName: string;
  attachments: AttachmentFile[];
  folder: "inbox" | "sent" | "drafts";
  status: "Sent" | "Delivered" | "Failed" | "Read" | "Unread" | "Draft";
  replies: EmailMessage[];
  matchedSentEmailId?: string | null;
  replyType?: "Unclassified" | "Acknowledgment" | "Revision Requested" | "General Query";
  actioned?: boolean;
  actionNotes?: string;
}

interface ContactCompany {
  id: string;
  name: string;
  emails: string;
}

export default function MiniGmailPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();

  // State
  const [project, setProject] = useState<EnterpriseProject | null>(null);
  const [loadingProject, setLoadingProject] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  const [activeFolder, setActiveFolder] = useState<"inbox" | "sent" | "drafts">("inbox");
  const [emails, setEmails] = useState<EmailMessage[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<EmailMessage | null>(null);
  const [composing, setComposing] = useState(false);
  const [replyMode, setReplyMode] = useState<"reply" | "replyAll" | null>(null);
  const [contacts, setContacts] = useState<ContactCompany[]>([]);
  const [polling, setPolling] = useState(false);

  // Composer state
  const [targetCompany, setTargetCompany] = useState("");
  const [toField, setToField] = useState("");
  const [ccField, setCcField] = useState("");
  const [subjectField, setSubjectField] = useState("");
  const [bodyField, setBodyField] = useState("");
  const [composerAttachments, setComposerAttachments] = useState<AttachmentFile[]>([]);
  const [sending, setSending] = useState(false);
  const [editingDraftId, setEditingDraftId] = useState<string | null>(null);

  // Reply state
  const [replyBody, setReplyBody] = useState("");
  const [replyAttachments, setReplyAttachments] = useState<AttachmentFile[]>([]);

  // Drag state
  const [isDragOver, setIsDragOver] = useState(false);

  // Refs
  const composerTextareaRef = useRef<HTMLTextAreaElement>(null);
  const replyTextareaRef = useRef<HTMLTextAreaElement>(null);
  const composerFileInputRef = useRef<HTMLInputElement>(null);
  const replyFileInputRef = useRef<HTMLInputElement>(null);

  // Toast
  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Fetch project
  useEffect(() => {
    async function fetchProject() {
      try {
        const projects = await getProjects();
        const p = projects.find((proj: EnterpriseProject) => proj.id === id);
        if (p) setProject(p);
      } catch (err) {
        console.error("Failed to load project", err);
      } finally {
        setLoadingProject(false);
      }
    }
    fetchProject();
  }, [id]);

  // Fetch contacts from backend
  const fetchContacts = useCallback(async () => {
    try {
      const res = await apiClient.get(`/api/v1/projects/${id}/contacts/`);
      setContacts(res.data);
    } catch (err) {
      console.warn("Could not fetch contacts", err);
    }
  }, [id]);

  // Fetch emails from all sources (inbox + sent + drafts)
  const fetchEmails = useCallback(async () => {
    try {
      const [inboxRes, sentRes, draftsRes] = await Promise.all([
        apiClient.get(`/api/v1/projects/${id}/inbox/`).catch(() => ({ data: [] })),
        apiClient.get(`/api/v1/projects/${id}/emails/`).catch(() => ({ data: [] })),
        apiClient.get(`/api/v1/projects/${id}/drafts/`).catch(() => ({ data: [] })),
      ]);

      const inboxEmails: EmailMessage[] = (inboxRes.data || []).map((e: any) => ({
        ...e,
        attachments: e.attachments || [],
        replies: [],
        folder: "inbox" as const,
      }));
      const sentEmails: EmailMessage[] = (sentRes.data || []).map((e: any) => ({
        ...e,
        from: SENDER_EMAIL,
        fromName: SENDER_NAME,
        attachments: e.attachments || [],
        replies: [],
        folder: "sent" as const,
      }));
      const draftEmails: EmailMessage[] = (draftsRes.data || []).map((e: any) => ({
        ...e,
        attachments: [],
        replies: [],
        folder: "drafts" as const,
      }));

      setEmails([...inboxEmails, ...sentEmails, ...draftEmails]);
    } catch (err) {
      console.error("Failed to fetch emails", err);
    }
  }, [id]);

  useEffect(() => {
    fetchContacts();
    fetchEmails();
  }, [fetchContacts, fetchEmails]);

  // Company change handler — autofill from DB contacts or fallback to project defaults
  const handleCompanyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const name = e.target.value;
    setTargetCompany(name);
    if (!name) {
      setToField("");
      setSubjectField("");
      setBodyField("");
      return;
    }

    // Try DB contacts first
    const contact = contacts.find(c => c.name === name);
    if (contact) {
      setToField(contact.emails);
    } else {
      // Fallback to project defaults
      setToField(project?.mail_to || "");
      setCcField(project?.mail_cc || "");
    }

    const pName = project?.name || "Project";
    const pCode = project?.code || "PROJ-CODE";
    setSubjectField(`Transmittal Notice: ${pName} - Document Register`);
    setBodyField(
      `Dear ${name} Team,\n\nPlease find attached the latest Transmittal Notice and verified Document Register for ${pName} (${pCode}).\n\nAll drawings listed have been approved for construction. Please verify receipt and let us know if you require further details.\n\nBest regards,\n${SENDER_NAME}\n${name}`
    );
    showToast(`Autofilled template for ${name}`, "info");
  };

  // Format bytes
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

  // Add files (with real content)
  const handleAddFiles = async (fileList: FileList, isReply: boolean = false) => {
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
    if (isReply) {
      setReplyAttachments(prev => [...prev, ...filesArray]);
      showToast(`Attached ${filesArray.length} file(s) to reply`, "success");
    } else {
      setComposerAttachments(prev => [...prev, ...filesArray]);
      showToast(`Attached ${filesArray.length} file(s)`, "success");
    }
  };

  // Drag handlers
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragOver(true); };
  const handleDragLeave = () => setIsDragOver(false);
  const handleDrop = (e: React.DragEvent, isReply: boolean = false) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleAddFiles(e.dataTransfer.files, isReply);
    }
  };

  // Format toolbar
  const insertFormat = (type: "bold" | "italic" | "heading" | "list" | "link", isReply: boolean = false) => {
    const textarea = isReply ? replyTextareaRef.current : composerTextareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selectedText = text.substring(start, end);
    let replacement = "";
    switch (type) {
      case "bold": replacement = `**${selectedText || "bold text"}**`; break;
      case "italic": replacement = `*${selectedText || "italic text"}*`; break;
      case "heading": replacement = `\n### ${selectedText || "Heading"}\n`; break;
      case "list": replacement = `\n- ${selectedText || "List item"}\n`; break;
      case "link": replacement = `[${selectedText || "Link Text"}](http://example.com)`; break;
    }
    const newText = text.substring(0, start) + replacement + text.substring(end);
    if (isReply) setReplyBody(newText); else setBodyField(newText);
    setTimeout(() => { textarea.focus(); textarea.setSelectionRange(start, start + replacement.length); }, 10);
  };

  // Send email via Django backend
  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!toField.trim() || !subjectField.trim() || !bodyField.trim()) {
      showToast("To, Subject, and Body are required.", "error");
      return;
    }

    setSending(true);
    const newMsgId = `sent-${Date.now()}`;
    const newEmailObj: EmailMessage = {
      id: newMsgId,
      from: SENDER_EMAIL,
      fromName: SENDER_NAME,
      to: toField,
      cc: ccField,
      subject: subjectField,
      body: bodyField,
      dateSent: new Date().toISOString(),
      companyName: targetCompany || "Other",
      attachments: composerAttachments,
      folder: "sent",
      status: "Sent",
      replies: []
    };

    try {
      const res = await apiClient.post(`/api/v1/projects/${id}/email/send/`, {
        to: toField,
        cc: ccField,
        subject: subjectField,
        body: bodyField,
        companyName: targetCompany || "Other",
        attachments: composerAttachments.map(a => ({ name: a.name, size: a.size, type: a.type, data: a.data })),
      });
      showToast(`Email sent from ${SENDER_EMAIL}!`, "success");
      newEmailObj.status = res.data?.status || "Delivered";
      newEmailObj.id = res.data?.id || newMsgId;
      newEmailObj.dateSent = res.data?.dateSent || newEmailObj.dateSent;

      // If this was a draft, delete it
      if (editingDraftId) {
        await apiClient.post(`/api/v1/projects/${id}/drafts/delete/`, { id: editingDraftId }).catch(() => {});
        setEditingDraftId(null);
      }

      setEmails(prev => [newEmailObj, ...prev]);
    } catch (err: any) {
      console.error("Email send failed:", err);
      newEmailObj.status = "Failed";
      setEmails(prev => [newEmailObj, ...prev]);
      const errMsg = err?.response?.data?.error || err?.message || "Could not send email";
      showToast(`Send failed: ${errMsg}`, "error");
    } finally {
      setSending(false);
      setComposing(false);
      resetComposerForm();
      fetchEmails();
    }
  };

  // Save draft
  const handleSaveDraft = async () => {
    try {
      const res = await apiClient.post(`/api/v1/projects/${id}/drafts/save/`, {
        id: editingDraftId || undefined,
        to: toField,
        cc: ccField,
        subject: subjectField,
        body: bodyField,
        companyName: targetCompany || "Other",
      });
      showToast("Draft saved", "success");
      setEditingDraftId(res.data.id);
      fetchEmails();
    } catch (err) {
      showToast("Failed to save draft", "error");
    }
  };

  // Send reply
  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmail || !replyBody.trim()) return;

    setSending(true);
    const replyObj: EmailMessage = {
      id: `reply-${Date.now()}`,
      from: SENDER_EMAIL,
      fromName: SENDER_NAME,
      to: replyMode === "replyAll"
        ? `${selectedEmail.from}${selectedEmail.cc ? ", " + selectedEmail.cc : ""}`
        : selectedEmail.from,
      cc: "",
      subject: `Re: ${selectedEmail.subject}`,
      body: replyBody,
      dateSent: new Date().toISOString(),
      companyName: selectedEmail.companyName,
      attachments: replyAttachments,
      folder: "sent",
      status: "Sent",
      replies: []
    };

    try {
      const res = await apiClient.post(`/api/v1/projects/${id}/email/send/`, {
        to: replyObj.to,
        cc: replyObj.cc,
        subject: replyObj.subject,
        body: replyObj.body,
        companyName: replyObj.companyName,
        attachments: replyAttachments.map(a => ({ name: a.name, size: a.size, type: a.type, data: a.data })),
      });
      showToast(`Reply sent from ${SENDER_EMAIL}!`, "success");
      replyObj.status = res.data?.status || "Delivered";
      replyObj.id = res.data?.id || replyObj.id;
    } catch (err: any) {
      console.error("Reply failed:", err);
      replyObj.status = "Failed";
      const errMsg = err?.response?.data?.error || err?.message || "Failed to send reply";
      showToast(`Send failed: ${errMsg}`, "error");
    } finally {
      const currentList = [...emails];
      const emailIndex = currentList.findIndex(item => item.id === selectedEmail.id);
      if (emailIndex !== -1) {
        currentList[emailIndex] = {
          ...currentList[emailIndex],
          replies: [...(currentList[emailIndex].replies || []), replyObj],
        };
        setEmails(currentList);
        setSelectedEmail(currentList[emailIndex]);
      }
      setSending(false);
      setReplyMode(null);
      setReplyBody("");
      setReplyAttachments([]);
    }
  };

  // Delete email
  const handleDeleteEmail = async (emailId: string, folder: string) => {
    try {
      if (folder === "drafts") {
        await apiClient.post(`/api/v1/projects/${id}/drafts/delete/`, { id: emailId });
      } else if (folder === "sent") {
        await apiClient.post(`/api/v1/projects/${id}/email/delete/`, { id: emailId });
      }
      // Inbox emails are IMAP-managed, just remove from local state
      setEmails(prev => prev.filter(item => item.id !== emailId));
      setSelectedEmail(null);
      showToast("Deleted.", "info");
      fetchEmails();
    } catch (err) {
      showToast("Failed to delete", "error");
    }
  };

  // Poll inbox manually
  const handlePollInbox = async () => {
    setPolling(true);
    try {
      await apiClient.post(`/api/v1/projects/${id}/inbox/poll/`);
      showToast("Checking Gmail for new emails...", "info");
      // Wait a few seconds then refresh
      setTimeout(() => { fetchEmails(); setPolling(false); }, 5000);
    } catch (err) {
      showToast("Failed to poll inbox", "error");
      setPolling(false);
    }
  };

  // Mark inbox email as read
  const handleSelectEmail = (msg: EmailMessage) => {
    setSelectedEmail(msg);
    setReplyMode(null);
    setReplyBody("");
    setReplyAttachments([]);
    if (msg.folder === "inbox" && msg.status === "Unread") {
      apiClient.post(`/api/v1/projects/${id}/inbox/mark-read/`, { id: msg.id }).catch(() => {});
      setEmails(prev => prev.map(item => item.id === msg.id ? { ...item, status: "Read" } : item));
    }
  };

  // Classify inbox email (Acknowledgment vs Revision Requested vs General)
  const handleClassifyEmail = async (emailId: string, replyType: string) => {
    try {
      await apiClient.post(`/api/v1/projects/${id}/inbox/classify/`, {
        id: emailId,
        reply_type: replyType,
      });
      setEmails(prev => prev.map(e => e.id === emailId ? { ...e, replyType: replyType as any } : e));
      if (selectedEmail && selectedEmail.id === emailId) {
        setSelectedEmail(prev => prev ? { ...prev, replyType: replyType as any } : null);
      }
      showToast(`Classified as "${replyType}"`, "success");
    } catch (err) {
      showToast("Failed to classify email", "error");
    }
  };

  // Trigger revision cycle from inbox feedback
  const handleTriggerRevision = async (emailId: string) => {
    try {
      await apiClient.post(`/api/v1/projects/${id}/inbox/trigger-revision/`, {
        id: emailId,
        notes: `Client feedback received on ${new Date().toLocaleDateString()}`
      });
      setEmails(prev => prev.map(e => e.id === emailId ? { ...e, replyType: "Revision Requested", actioned: true } : e));
      if (selectedEmail && selectedEmail.id === emailId) {
        setSelectedEmail(prev => prev ? { ...prev, replyType: "Revision Requested", actioned: true } : null);
      }
      showToast("Revision cycle triggered! Project status updated and team alerted.", "success");
    } catch (err) {
      showToast("Failed to trigger revision cycle", "error");
    }
  };

  // Export Inward Mail Register Excel
  const handleExportInwardExcel = async () => {
    try {
      const response = await apiClient.get(`/api/v1/projects/${id}/inbox/export-excel/`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `JASPER_INWARD_REGISTER_${project?.code || id}.xlsx`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast("Downloaded inward correspondence register!", "success");
    } catch (err) {
      console.error(err);
      showToast("Failed to export inward mail register", "error");
    }
  };

  // Load draft into composer
  const handleLoadDraft = (draft: EmailMessage) => {
    setEditingDraftId(draft.id);
    setTargetCompany(draft.companyName);
    setToField(draft.to);
    setCcField(draft.cc || "");
    setSubjectField(draft.subject);
    setBodyField(draft.body);
    setComposerAttachments([]);
    setComposing(true);
    setSelectedEmail(null);
  };

  const resetComposerForm = () => {
    setTargetCompany("");
    setToField("");
    setCcField("");
    setSubjectField("");
    setBodyField("");
    setComposerAttachments([]);
    setEditingDraftId(null);
  };

  // File icon
  const getFileIcon = (fileName: string) => {
    const ext = fileName.split(".").pop()?.toLowerCase();
    switch (ext) {
      case "pdf": return <FileText className="w-5 h-5 text-rose-500" />;
      case "xlsx": case "xls": case "csv": return <FileSpreadsheet className="w-5 h-5 text-emerald-500" />;
      case "zip": case "rar": return <FileArchive className="w-5 h-5 text-amber-500" />;
      case "png": case "jpg": case "jpeg": case "gif": return <ImageIcon className="w-5 h-5 text-indigo-500" />;
      case "dwg": case "dxf": case "cad": return <FileCode className="w-5 h-5 text-sky-500 font-bold" />;
      default: return <FileIcon className="w-5 h-5 text-slate-400" />;
    }
  };

  const filteredEmails = emails.filter(item => item.folder === activeFolder);
  const unreadCount = emails.filter(e => e.folder === "inbox" && e.status === "Unread").length;
  const draftCount = emails.filter(e => e.folder === "drafts").length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-8 flex flex-col font-sans">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-xl bg-white border border-slate-200">
          {toast.type === "success" && <CheckCircle className="w-5 h-5 text-emerald-500" />}
          {toast.type === "error" && <AlertCircle className="w-5 h-5 text-rose-500" />}
          {toast.type === "info" && <Building2 className="w-5 h-5 text-blue-500" />}
          <span className="text-sm font-medium text-slate-700">{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push(`/projects/${id}`)} className="p-2 -ml-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition" title="Back to project">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">{loadingProject ? "Loading..." : project?.code}</span>
                <h1 className="text-base font-bold text-slate-800">{loadingProject ? "Project Details" : project?.name}</h1>
              </div>
              <p className="text-xs text-slate-500">Transmittal Communication &amp; Logs (Gmail Workspace)</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleExportInwardExcel}
              className="flex items-center gap-2 px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-full text-xs font-semibold shadow-xs transition cursor-pointer"
              title="Export all incoming correspondence as Excel register"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Inward Register (Excel)</span>
            </button>
            <button onClick={handlePollInbox} disabled={polling} className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-full text-xs text-slate-600 border border-slate-200 transition disabled:opacity-50 cursor-pointer">
              <RefreshCw className={`w-3.5 h-3.5 ${polling ? "animate-spin" : ""}`} />
              <span>{polling ? "Checking..." : "Check Gmail"}</span>
            </button>
            <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-full text-xs text-slate-600 border border-slate-200">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Gmail SMTP ({SENDER_EMAIL})</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <div className="max-w-7xl mx-auto w-full px-4 mt-6 flex gap-6 flex-1 items-stretch">

        {/* Sidebar */}
        <aside className="w-64 shrink-0 flex flex-col gap-6">
          <button
            onClick={() => { resetComposerForm(); setComposing(true); setSelectedEmail(null); }}
            className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl shadow-md transition flex items-center justify-center gap-2.5 hover:shadow-lg"
          >
            <Plus className="w-5 h-5" />
            <span className="text-sm">Compose</span>
          </button>

          <nav className="bg-white rounded-xl border border-slate-200 p-2 shadow-xs space-y-1">
            <button
              onClick={() => { setActiveFolder("inbox"); setSelectedEmail(null); setComposing(false); }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition font-medium ${activeFolder === "inbox" && !composing ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50"}`}
            >
              <div className="flex items-center gap-2.5"><Inbox className="w-4.5 h-4.5" /><span>Inbox</span></div>
              {unreadCount > 0 && <span className="px-2 py-0.5 bg-blue-600 text-white text-xxs font-bold rounded-full">{unreadCount}</span>}
            </button>
            <button
              onClick={() => { setActiveFolder("sent"); setSelectedEmail(null); setComposing(false); }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition font-medium ${activeFolder === "sent" && !composing ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50"}`}
            >
              <div className="flex items-center gap-2.5"><Send className="w-4.5 h-4.5" /><span>Sent Mail</span></div>
            </button>
            <button
              onClick={() => { setActiveFolder("drafts"); setSelectedEmail(null); setComposing(false); }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition font-medium ${activeFolder === "drafts" && !composing ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50"}`}
            >
              <div className="flex items-center gap-2.5"><FileText className="w-4.5 h-4.5" /><span>Drafts</span></div>
              {draftCount > 0 && <span className="px-2 py-0.5 bg-amber-500 text-white text-xxs font-bold rounded-full">{draftCount}</span>}
            </button>
          </nav>

          {/* Contacts section */}
          {contacts.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Saved Contacts</h3>
              <div className="space-y-1.5">
                {contacts.map(c => (
                  <div key={c.id} className="text-xs text-slate-600 py-1.5 px-2 bg-slate-50 rounded-lg">
                    <p className="font-semibold text-slate-700 truncate">{c.name}</p>
                    <p className="text-slate-400 truncate">{c.emails}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>

        {/* Content Pane */}
        <main className="flex-1 min-w-0 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">

          {/* Folder List View */}
          {!selectedEmail && !composing && (
            <div className="flex flex-col flex-1">
              <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center">
                <h2 className="font-semibold text-slate-800 text-sm capitalize">{activeFolder} Messages</h2>
                <span className="text-xs text-slate-500 font-medium">{filteredEmails.length} Conversations</span>
              </div>

              {filteredEmails.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-400 space-y-3">
                  <Mail className="w-12 h-12 stroke-1 text-slate-300" />
                  <p className="text-sm font-medium">No messages found in this folder</p>
                  {activeFolder === "inbox" && (
                    <button onClick={handlePollInbox} disabled={polling} className="text-xs text-blue-600 hover:underline flex items-center gap-1.5">
                      <RefreshCw className={`w-3.5 h-3.5 ${polling ? "animate-spin" : ""}`} />
                      Check Gmail for new emails
                    </button>
                  )}
                </div>
              ) : (
                <div className="divide-y divide-slate-100 overflow-y-auto max-h-[calc(100vh-280px)]">
                  {filteredEmails.map(item => (
                    <div
                      key={item.id}
                      onClick={() => item.folder === "drafts" ? handleLoadDraft(item) : handleSelectEmail(item)}
                      className={`p-4 flex items-start gap-4 cursor-pointer hover:bg-slate-50 transition border-l-3 ${item.status === "Unread" ? "border-l-blue-600 bg-blue-50/10 font-semibold" : "border-l-transparent"}`}
                    >
                      <div className="p-2 bg-slate-100 rounded-lg text-slate-500 shrink-0">
                        {item.folder === "drafts" ? <FileText className="w-5 h-5" /> : <User className="w-5 h-5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-slate-800 truncate block">
                            {item.fromName} <span className="text-xs text-slate-400 font-normal ml-1">From: {item.from}</span>
                          </span>
                          <span className="text-xs text-slate-400 font-normal shrink-0">
                            {new Date(item.dateSent).toLocaleDateString("en-AE", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                        <h4 className="text-sm text-slate-900 truncate mb-1">{item.subject || "(no subject)"}</h4>
                        <p className="text-xs text-slate-500 truncate leading-relaxed line-clamp-1">{item.body}</p>
                        
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          {item.replyType && item.replyType !== "Unclassified" && (
                            <span className={`px-2 py-0.5 rounded-full text-xxs font-bold border ${
                              item.replyType === "Revision Requested"
                                ? "bg-amber-50 text-amber-700 border-amber-200"
                                : item.replyType === "Acknowledgment"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-blue-50 text-blue-700 border-blue-200"
                            }`}>
                              {item.replyType}
                            </span>
                          )}
                          {item.actioned && (
                            <span className="px-2 py-0.5 rounded-full text-xxs font-bold bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1">
                              <RotateCcw className="w-2.5 h-2.5 text-slate-500" />
                              Revision Triggered
                            </span>
                          )}
                          {item.attachments.length > 0 && (
                            item.attachments.map((att, i) => (
                              <div key={i} className="flex items-center gap-1 px-2 py-0.5 bg-slate-100 border border-slate-200 rounded text-xxs text-slate-600">
                                <Paperclip className="w-3 h-3" />
                                <span className="truncate max-w-[120px]">{att.name}</span>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Thread View */}
          {selectedEmail && !composing && (
            <div className="flex flex-col flex-1 overflow-y-auto max-h-[calc(100vh-200px)]">
              <div className="px-6 py-3 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center sticky top-0 z-10">
                <button onClick={() => setSelectedEmail(null)} className="px-3 py-1.5 border border-slate-200 text-slate-600 hover:text-slate-800 bg-white rounded-lg text-xs hover:bg-slate-50 transition flex items-center gap-1.5 cursor-pointer">
                  <ChevronLeft className="w-4 h-4" /> Back
                </button>
                <div className="flex items-center gap-2">
                  {selectedEmail.folder === "inbox" && (
                    <>
                      <button onClick={() => setReplyMode("reply")} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs transition flex items-center gap-1.5 cursor-pointer">
                        <CornerUpLeft className="w-4 h-4" /> Reply
                      </button>
                      <button onClick={() => setReplyMode("replyAll")} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs transition flex items-center gap-1.5 cursor-pointer">
                        <Mail className="w-4 h-4" /> Reply All
                      </button>
                    </>
                  )}
                  <button onClick={() => handleDeleteEmail(selectedEmail.id, selectedEmail.folder)} className="px-3 py-1.5 border border-slate-200 text-rose-600 hover:bg-rose-50 rounded-lg text-xs transition flex items-center gap-1.5 cursor-pointer">
                    <Trash2 className="w-4 h-4" /> Delete
                  </button>
                </div>
              </div>

              {/* Inward Classification & Revision Loop Action Banner */}
              {selectedEmail.folder === "inbox" && (
                <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                      <Tag className="w-3.5 h-3.5 text-slate-400" />
                      Classification:
                    </span>
                    <button
                      onClick={() => handleClassifyEmail(selectedEmail.id, "Acknowledgment")}
                      className={`px-2.5 py-1 rounded-full text-xs font-bold border transition cursor-pointer ${
                        selectedEmail.replyType === "Acknowledgment"
                          ? "bg-emerald-600 text-white border-emerald-600 shadow-2xs"
                          : "bg-white text-slate-600 border-slate-200 hover:bg-emerald-50 hover:text-emerald-700"
                      }`}
                    >
                      ✓ Acknowledgment
                    </button>
                    <button
                      onClick={() => handleClassifyEmail(selectedEmail.id, "Revision Requested")}
                      className={`px-2.5 py-1 rounded-full text-xs font-bold border transition cursor-pointer ${
                        selectedEmail.replyType === "Revision Requested"
                          ? "bg-amber-500 text-white border-amber-500 shadow-2xs"
                          : "bg-white text-slate-600 border-slate-200 hover:bg-amber-50 hover:text-amber-700"
                      }`}
                    >
                      🔄 Revision Requested
                    </button>
                    <button
                      onClick={() => handleClassifyEmail(selectedEmail.id, "General Query")}
                      className={`px-2.5 py-1 rounded-full text-xs font-bold border transition cursor-pointer ${
                        selectedEmail.replyType === "General Query"
                          ? "bg-blue-600 text-white border-blue-600 shadow-2xs"
                          : "bg-white text-slate-600 border-slate-200 hover:bg-blue-50 hover:text-blue-700"
                      }`}
                    >
                      💬 General
                    </button>
                  </div>

                  {selectedEmail.replyType === "Revision Requested" && !selectedEmail.actioned && (
                    <button
                      onClick={() => handleTriggerRevision(selectedEmail.id)}
                      className="px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white rounded-lg text-xs font-bold shadow-2xs transition flex items-center gap-1.5 cursor-pointer shrink-0"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Trigger Revision Cycle &amp; Alert Drafters
                    </button>
                  )}

                  {selectedEmail.actioned && (
                    <span className="px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-semibold flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                      Revision Cycle Active
                    </span>
                  )}
                </div>
              )}

              <div className="p-6 border-b border-slate-100">
                <h3 className="text-base font-bold text-slate-800 mb-4">{selectedEmail.subject}</h3>
                <div className="flex items-start gap-3.5 mb-5">
                  <div className="p-2.5 bg-blue-50 text-blue-600 rounded-full shrink-0"><User className="w-5 h-5" /></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-sm font-semibold text-slate-800">{selectedEmail.fromName}</h4>
                        <span className="text-xs text-slate-500 font-medium block">From: {selectedEmail.from}</span>
                        <span className="text-xs text-slate-500 block">To: {selectedEmail.to}</span>
                        {selectedEmail.cc && <span className="text-xs text-slate-400 block">Cc: {selectedEmail.cc}</span>}
                      </div>
                      <span className="text-xs text-slate-400 font-normal shrink-0">
                        {new Date(selectedEmail.dateSent).toLocaleString("en-AE", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-sm text-slate-700 whitespace-pre-line leading-relaxed pl-1">{selectedEmail.body}</div>

                {selectedEmail.attachments.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-slate-100">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1">
                      <Paperclip className="w-3.5 h-3.5" /> Attachments ({selectedEmail.attachments.length})
                    </h5>
                    <div className="flex flex-wrap gap-3">
                      {selectedEmail.attachments.map((file, i) => (
                        <div key={i} className="flex items-center gap-3 p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs text-slate-700 max-w-sm transition shrink-0">
                          {getFileIcon(file.name)}
                          <div className="min-w-0 flex-1">
                            <p className="font-medium truncate max-w-[180px]">{file.name}</p>
                            <p className="text-slate-400 text-xxs">{file.size}</p>
                          </div>
                          {(file.url || file.data) && (
                            <a
                              href={file.url || file.data}
                              download={file.name}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded transition cursor-pointer"
                              title="Download Attachment"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Replies */}
              {selectedEmail.replies && selectedEmail.replies.length > 0 && (
                <div className="bg-slate-50/50 p-6 space-y-6 border-b border-slate-100">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Replies History</h4>
                  {selectedEmail.replies.map((rep) => (
                    <div key={rep.id} className="bg-white p-5 rounded-lg border border-slate-200 shadow-xxs">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 bg-slate-100 text-slate-600 rounded-full flex items-center justify-center text-xs font-bold">LD</div>
                          <div>
                            <span className="text-xs font-semibold text-slate-800">{rep.fromName}</span>
                            <span className="text-xxs text-slate-400 block">From: {rep.from}</span>
                          </div>
                        </div>
                        <span className="text-xxs text-slate-400">{new Date(rep.dateSent).toLocaleString("en-AE", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                      </div>
                      <p className="text-xs text-slate-700 whitespace-pre-line pl-1">{rep.body}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Reply Composer */}
              {replyMode && (
                <div className="p-6 bg-slate-50 border-t border-slate-100">
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-2">
                      <CornerUpLeft className="w-4 h-4 text-blue-600" />
                      <span className="text-xs font-bold text-slate-700">{replyMode === "replyAll" ? "Reply All" : "Reply"} to {selectedEmail.from}</span>
                    </div>
                    <button onClick={() => setReplyMode(null)} className="p-1 text-slate-400 hover:text-slate-600 rounded"><X className="w-4 h-4" /></button>
                  </div>
                  <form onSubmit={handleSendReply} className="space-y-4">
                    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition">
                      <div className="bg-slate-50 border-b border-slate-200 px-3 py-2 flex items-center gap-2.5">
                        <button type="button" onClick={() => insertFormat("bold", true)} className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-200/50 rounded"><Bold className="w-4 h-4" /></button>
                        <button type="button" onClick={() => insertFormat("italic", true)} className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-200/50 rounded"><Italic className="w-4 h-4" /></button>
                        <button type="button" onClick={() => insertFormat("heading", true)} className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-200/50 rounded"><Heading className="w-4 h-4" /></button>
                        <button type="button" onClick={() => insertFormat("list", true)} className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-200/50 rounded"><List className="w-4 h-4" /></button>
                        <button type="button" onClick={() => insertFormat("link", true)} className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-200/50 rounded"><Link2 className="w-4 h-4" /></button>
                      </div>
                      <textarea ref={replyTextareaRef} rows={6} placeholder="Write reply here..." value={replyBody} onChange={e => setReplyBody(e.target.value)} required className="w-full px-4 py-3 text-sm text-slate-800 bg-transparent border-0 focus:ring-0 focus:outline-none placeholder-slate-400 font-mono" />
                    </div>

                    {/* Reply attachments */}
                    <div onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={(e) => handleDrop(e, true)} className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition ${isDragOver ? "border-blue-500 bg-blue-50/50" : "border-slate-200 hover:border-slate-300"}`} onClick={() => replyFileInputRef.current?.click()}>
                      <input type="file" ref={replyFileInputRef} multiple className="hidden" onChange={(e) => e.target.files && handleAddFiles(e.target.files, true)} />
                      <Paperclip className="w-6 h-6 text-slate-400 mx-auto mb-1.5" />
                      <p className="text-xs text-slate-600 font-medium">Drag and drop attachments, or <span className="text-blue-600 hover:underline">browse files</span></p>
                      <p className="text-xxs text-slate-400 mt-1">Any file type (PDF, XLSX, DOCX, DWG, ZIP, images...)</p>
                    </div>

                    {replyAttachments.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {replyAttachments.map((file, idx) => (
                          <div key={idx} className="flex items-center gap-2 pl-2.5 pr-1.5 py-1 bg-white border border-slate-200 rounded-full text-xxs text-slate-700 shadow-xxs">
                            {getFileIcon(file.name)}
                            <span className="font-medium max-w-[180px] truncate">{file.name}</span>
                            <span className="text-slate-400 font-normal">({file.size})</span>
                            <button type="button" onClick={(e) => { e.stopPropagation(); setReplyAttachments(prev => prev.filter((_, i) => i !== idx)); }} className="p-0.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-full transition"><X className="w-3.5 h-3.5" /></button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex justify-end gap-3.5">
                      <button type="button" onClick={() => { setReplyMode(null); setReplyBody(""); setReplyAttachments([]); }} className="px-4 py-2 bg-white border border-slate-200 text-slate-600 hover:text-slate-800 rounded-lg text-xs font-medium hover:bg-slate-50 transition">Cancel</button>
                      <button type="submit" disabled={sending || !replyBody.trim()} className="px-4.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-xs shadow-sm transition flex items-center gap-1.5 disabled:bg-blue-400">
                        {sending ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Sending...</> : <><Send className="w-3.5 h-3.5" /> Send Reply</>}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          )}

          {/* Compose View */}
          {composing && (
            <div className="flex flex-col flex-1 overflow-y-auto max-h-[calc(100vh-200px)]">
              <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center">
                <div className="flex items-center gap-2.5">
                  <Plus className="w-5 h-5 text-blue-600" />
                  <h2 className="font-semibold text-slate-800 text-sm">{editingDraftId ? "Edit Draft" : "New Transmittal Notice"}</h2>
                </div>
                <button type="button" onClick={() => { setComposing(false); resetComposerForm(); }} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"><X className="w-4.5 h-4.5" /></button>
              </div>

              <form onSubmit={handleSendEmail} className="p-6 space-y-5">
                {/* From */}
                <div className="grid grid-cols-1 gap-1 border-b border-slate-100 pb-3">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">From</span>
                  <div className="text-sm text-slate-700 font-semibold bg-slate-50 px-3 py-1.5 rounded border border-slate-100 flex items-center gap-2">
                    <User className="w-4 h-4 text-slate-400" />
                    <span>{SENDER_NAME} &lt;{SENDER_EMAIL}&gt;</span>
                  </div>
                </div>

                {/* Company selector */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Target Recipient Company</label>
                  <select value={targetCompany} onChange={handleCompanyChange} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition">
                    <option value="">-- Choose company to autofill (or type manually below) --</option>
                    {contacts.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                </div>

                {/* To & CC */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">To <span className="text-rose-500">*</span></label>
                    <input type="text" placeholder="comma-separated emails" value={toField} onChange={e => setToField(e.target.value)} required className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Cc (Optional)</label>
                    <input type="text" placeholder="comma-separated CC emails" value={ccField} onChange={e => setCcField(e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition" />
                  </div>
                </div>

                {/* Subject */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Subject <span className="text-rose-500">*</span></label>
                  <input type="text" placeholder="Enter email subject" value={subjectField} onChange={e => setSubjectField(e.target.value)} required className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition font-medium" />
                </div>

                {/* Body */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Transmittal Message Body <span className="text-rose-500">*</span></label>
                  <div className="border border-slate-200 rounded-t-lg bg-slate-50 px-3 py-2 flex items-center gap-2 border-b-0">
                    <button type="button" onClick={() => insertFormat("bold")} className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200/50 rounded"><Bold className="w-4 h-4" /></button>
                    <button type="button" onClick={() => insertFormat("italic")} className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200/50 rounded"><Italic className="w-4 h-4" /></button>
                    <button type="button" onClick={() => insertFormat("heading")} className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200/50 rounded"><Heading className="w-4 h-4" /></button>
                    <button type="button" onClick={() => insertFormat("list")} className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200/50 rounded"><List className="w-4 h-4" /></button>
                    <button type="button" onClick={() => insertFormat("link")} className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200/50 rounded"><Link2 className="w-4 h-4" /></button>
                  </div>
                  <textarea ref={composerTextareaRef} rows={8} placeholder="Write transmittal content here..." value={bodyField} onChange={e => setBodyField(e.target.value)} required className="w-full bg-white border border-slate-200 rounded-b-lg px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition font-mono" />
                </div>

                {/* Attachments */}
                <div onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={(e) => handleDrop(e, false)} className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition ${isDragOver ? "border-blue-500 bg-blue-50/50" : "border-slate-200 hover:border-slate-300"}`} onClick={() => composerFileInputRef.current?.click()}>
                  <input type="file" ref={composerFileInputRef} multiple className="hidden" onChange={(e) => e.target.files && handleAddFiles(e.target.files, false)} />
                  <Paperclip className="w-7 h-7 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm text-slate-700 font-medium">Drag and drop files here, or <span className="text-blue-600 hover:underline">browse files</span></p>
                  <p className="text-xs text-slate-400 mt-1">Any file format (PDF, XLSX, DOCX, DWG, ZIP, images...)</p>
                </div>

                {composerAttachments.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">Pinned Attachments ({composerAttachments.length})</span>
                    <div className="flex flex-wrap gap-2">
                      {composerAttachments.map((file, idx) => (
                        <div key={idx} className="flex items-center gap-2 pl-3 pr-2 py-1.5 bg-slate-50 border border-slate-200 rounded-full text-xs text-slate-700 shadow-xxs">
                          {getFileIcon(file.name)}
                          <span className="font-medium max-w-[200px] truncate">{file.name}</span>
                          <span className="text-slate-400 font-normal">({file.size})</span>
                          <button type="button" onClick={(e) => { e.stopPropagation(); setComposerAttachments(prev => prev.filter((_, i) => i !== idx)); }} className="p-0.5 text-slate-400 hover:text-rose-600 hover:bg-slate-200 rounded-full transition"><X className="w-4 h-4" /></button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Buttons */}
                <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                  <button type="button" onClick={handleSaveDraft} className="px-4 py-2 border border-slate-200 text-slate-600 hover:text-slate-800 rounded-lg text-sm hover:bg-slate-50 transition flex items-center gap-2">
                    <Save className="w-4 h-4" /> Save Draft
                  </button>
                  <button type="button" onClick={() => { setComposing(false); resetComposerForm(); }} className="px-4 py-2 border border-slate-200 text-slate-600 hover:text-slate-800 rounded-lg text-sm hover:bg-slate-50 transition">Cancel</button>
                  <button type="submit" disabled={sending} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-sm shadow-sm transition flex items-center gap-2 disabled:bg-blue-400">
                    {sending ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</> : <><Send className="w-4 h-4" /> Send Email</>}
                  </button>
                </div>
              </form>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
