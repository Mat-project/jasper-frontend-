"use client";

import React, { useState, useEffect, useRef } from "react";
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
  CornerUpRight,
  Plus,
  FileSpreadsheet,
  FileArchive,
  X,
  FileCode,
  User,
  Calendar,
  FileIcon,
  Archive,
  Image as ImageIcon
} from "lucide-react";
import { getProjects, type EnterpriseProject } from "@/lib/api/projects";
import apiClient from "@/lib/api/client";

// Sender identity — read from public env var (set NEXT_PUBLIC_DEFAULT_FROM_EMAIL in .env)
const SENDER_EMAIL = process.env.NEXT_PUBLIC_DEFAULT_FROM_EMAIL || "jasperalief1@gmail.com";
const SENDER_NAME = "Lead Draftsman";

// Target Companies & templates configuration
const TARGET_COMPANIES = [
  {
    name: "Jasper Contracting LLC",
    emails: "contacts@jaspercontracting.com, project.manager@jaspercontracting.com",
    template: "Dear Jasper Contracting Team,\n\nPlease find attached the latest Transmittal Notice and verified Document Register for {projectName} ({projectCode}).\n\nAll drawings listed have been approved for construction. Please verify receipt and let us know if you require further details.\n\nBest regards,\nLead Draftsman\nJasper Contracting LLC"
  },
  {
    name: "Alef Detailing Services",
    emails: "detailing@alefservices.com, coordination@alefservices.com",
    template: "Dear Alef Detailing Team,\n\nWe have issued the official Document Register package for {projectName} under project ID {projectId} dated {dateString}.\n\nPlease coordinate structural steel fabrication details based on these revisions immediately.\n\nWarm regards,\nLead Draftsman\nAlef Detailing Services"
  },
  {
    name: "Econ Steel Construction",
    emails: "engineering@econsteel.com, info@econsteel.com",
    template: "Hi Econ Steel Team,\n\nFollowing up on our UAT cycle, we are dispatching the current document register release for {projectName}.\n\nPlease check the attached register for details on updated sheets.\n\nRegards,\nLead Draftsman\nEcon Steel Construction"
  },
  {
    name: "Vertex Design Group",
    emails: "design@vertexgroup.ae, approvals@vertexgroup.ae",
    template: "Dear Vertex Design Team,\n\nPlease review the attached document register for {projectName} ({projectCode}). This transmittal contains the final approved submittals for review.\n\nKindly send approval response before target release date.\n\nBest regards,\nLead Draftsman\nVertex Design Group"
  }
];

// Types
interface AttachmentFile {
  name: string;
  size: string;
  type: string;
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
  status: "Sent" | "Delivered" | "Failed" | "Read" | "Unread";
  replies: EmailMessage[];
}

export default function MiniGmailPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();

  // State variables
  const [project, setProject] = useState<EnterpriseProject | null>(null);
  const [loadingProject, setLoadingProject] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  // Folder and view state
  const [activeFolder, setActiveFolder] = useState<"inbox" | "sent" | "drafts">("inbox");
  const [emails, setEmails] = useState<EmailMessage[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<EmailMessage | null>(null);
  const [composing, setComposing] = useState(false);
  const [replyMode, setReplyMode] = useState<"reply" | "replyAll" | null>(null);

  // New Email Composer state
  const [targetCompany, setTargetCompany] = useState("");
  const [toField, setToField] = useState("");
  const [ccField, setCcField] = useState("");
  const [subjectField, setSubjectField] = useState("");
  const [bodyField, setBodyField] = useState("");
  const [composerAttachments, setComposerAttachments] = useState<AttachmentFile[]>([]);
  const [sending, setSending] = useState(false);

  // Inline Reply state
  const [replyBody, setReplyBody] = useState("");
  const [replyAttachments, setReplyAttachments] = useState<AttachmentFile[]>([]);

  // Drag and drop upload state
  const [isDragOver, setIsDragOver] = useState(false);

  // Refs
  const composerTextareaRef = useRef<HTMLTextAreaElement>(null);
  const replyTextareaRef = useRef<HTMLTextAreaElement>(null);
  const composerFileInputRef = useRef<HTMLInputElement>(null);
  const replyFileInputRef = useRef<HTMLInputElement>(null);

  // Toast Helper
  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Fetch project details
  useEffect(() => {
    async function fetchProject() {
      try {
        const projects = await getProjects();
        const p = projects.find((proj: EnterpriseProject) => proj.id === id);
        if (p) {
          setProject(p);
        }
      } catch (err) {
        console.error("Failed to load project details", err);
      } finally {
        setLoadingProject(false);
      }
    }
    fetchProject();
  }, [id]);

  // Load and initialize emails from API/localStorage
  const fetchEmails = React.useCallback(async () => {
    try {
      // Attempt API call to retrieve emails from Django
      const res = await apiClient.get(`/api/v1/projects/${id}/emails/`);
      const backendEmails: EmailMessage[] = res.data;
      
      // Load local changes from localStorage to merge
      const stored = localStorage.getItem(`gmail_emails_${id}`);
      if (stored) {
        const localList: EmailMessage[] = JSON.parse(stored);
        
        // Merge list: prefer backend emails but keep unique local simulation items
        const combined = [...localList];
        backendEmails.forEach(be => {
          const idx = combined.findIndex(le => le.id === be.id);
          if (idx !== -1) {
            combined[idx] = { ...combined[idx], ...be };
          } else {
            combined.push(be);
          }
        });
        
        // Sort chronologically
        combined.sort((a, b) => new Date(b.dateSent).getTime() - new Date(a.dateSent).getTime());
        setEmails(combined);
        localStorage.setItem(`gmail_emails_${id}`, JSON.stringify(combined));
      } else {
        setEmails(backendEmails);
      }
    } catch (err) {
      console.warn("Backend transmittal log API not loaded, loading simulated local database...", err);
      
      // Fallback: Initialize complete mock database inside localStorage
      const stored = localStorage.getItem(`gmail_emails_${id}`);
      if (stored) {
        setEmails(JSON.parse(stored));
      } else {
        const defaultMockEmails: EmailMessage[] = [
          {
            id: "inbound-1",
            from: "engineering@econsteel.com",
            fromName: "Econ Steel Construction",
            to: SENDER_EMAIL,
            cc: "approvals@jasper.com",
            subject: "Clarification Request: Abu Dhabi Mall Anchor Details",
            body: "Hi Jasper Engineering Team,\n\nWe noticed a coordinates mismatch on sheet STR-02 (Revision 02) anchor bolts coordinates.\n\nCould you please verify with the latest layout plan and upload the updated document register?\n\nBest regards,\nEcon Detailing Team",
            dateSent: new Date(Date.now() - 3600000 * 2).toISOString(),
            companyName: "Econ Steel Construction",
            attachments: [],
            folder: "inbox",
            status: "Unread",
            replies: []
          },
          {
            id: "inbound-2",
            from: "detailing@alefservices.com",
            fromName: "Alef Detailing Services",
            to: SENDER_EMAIL,
            cc: "",
            subject: "Drawing Revision: Oman Industrial Plant - Rev 03 Detail Sheets",
            body: "Dear Lead Draftsman,\n\nWe have completed the requested detailing revisions for the Oman Industrial Plant columns.\n\nPlease check the attached drawings and send the finalized transmittal notice.\n\nThanks,\nAlef Coordination Team",
            dateSent: new Date(Date.now() - 86400000).toISOString(),
            companyName: "Alef Detailing Services",
            attachments: [
              { name: "OMAN_PLANT_REV_03_DETAILING.zip", size: "4.82 MB", type: "application/zip" }
            ],
            folder: "inbox",
            status: "Read",
            replies: []
          },
          {
            id: "sent-mock-1",
            from: SENDER_EMAIL,
            fromName: SENDER_NAME,
            to: "contacts@jaspercontracting.com, manager@jaspercontracting.com",
            cc: "cc@jasper.com",
            subject: "Transmittal Notice: Oman Industrial Plant - Verified Document Register",
            body: "Dear Jasper Contracting Team,\n\nPlease find attached the latest Transmittal Notice and verified Document Register for Oman Industrial Plant (PRJ-105).\n\nAll drawings listed have been approved for construction. Please verify receipt.\n\nBest regards,\nLead Draftsman\nJasper Contracting LLC",
            dateSent: new Date(Date.now() - 86400000 * 3).toISOString(),
            companyName: "Jasper Contracting LLC",
            attachments: [
              { name: "JASPER_DOCUMENT_REGISTER_v2.0.pdf", size: "1.45 MB", type: "application/pdf" }
            ],
            folder: "sent",
            status: "Delivered",
            replies: []
          }
        ];
        localStorage.setItem(`gmail_emails_${id}`, JSON.stringify(defaultMockEmails));
        setEmails(defaultMockEmails);
      }
    }
  }, [id]);

  useEffect(() => {
    fetchEmails();
  }, [fetchEmails]);

  // Sync state helper to write back to localStorage
  const saveEmailsToStorage = (updatedList: EmailMessage[]) => {
    setEmails(updatedList);
    localStorage.setItem(`gmail_emails_${id}`, JSON.stringify(updatedList));
  };

  // Target Company selection dropdown handler
  const handleCompanyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const name = e.target.value;
    setTargetCompany(name);

    if (!name) {
      setToField("");
      setSubjectField("");
      setBodyField("");
      return;
    }

    const companyData = TARGET_COMPANIES.find(c => c.name === name);
    if (companyData) {
      setToField(companyData.emails);
      
      const pName = project?.name || "Project";
      const pCode = project?.code || "PROJ-CODE";
      const today = new Date().toLocaleDateString("en-AE", {
        day: "numeric",
        month: "short",
        year: "numeric"
      });

      setSubjectField(`Transmittal Notice: ${pName} - Document Register`);

      // Compile template dynamically
      const bodyText = companyData.template
        .replace(/{projectName}/g, pName)
        .replace(/{projectCode}/g, pCode)
        .replace(/{projectId}/g, id)
        .replace(/{dateString}/g, today);

      setBodyField(bodyText);
      showToast(`Autofilled template for ${name}`, "info");
    }
  };

  // Helper to parse file sizes
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // File addition handler (Universal file formats)
  const handleAddFiles = (fileList: FileList, isReply: boolean = false) => {
    const filesArray: AttachmentFile[] = [];
    for (let i = 0; i < fileList.length; i++) {
      const f = fileList[i];
      filesArray.push({
        name: f.name,
        size: formatBytes(f.size),
        type: f.type || "application/octet-stream"
      });
    }

    if (isReply) {
      setReplyAttachments(prev => [...prev, ...filesArray]);
      showToast(`Attached ${filesArray.length} file(s) to reply`, "success");
    } else {
      setComposerAttachments(prev => [...prev, ...filesArray]);
      showToast(`Attached ${filesArray.length} file(s) to composer`, "success");
    }
  };

  // Drag-and-drop event handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent, isReply: boolean = false) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleAddFiles(e.dataTransfer.files, isReply);
    }
  };

  // Format Helper insert tool for textareas
  const insertFormat = (type: "bold" | "italic" | "heading" | "list" | "link", isReply: boolean = false) => {
    const textarea = isReply ? replyTextareaRef.current : composerTextareaRef.current;
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
        replacement = `\n### ${selectedText || "Heading"}\n`;
        break;
      case "list":
        replacement = `\n- ${selectedText || "List item"}\n`;
        break;
      case "link":
        replacement = `[${selectedText || "Link Text"}](http://example.com)`;
        break;
    }

    const newText = text.substring(0, start) + replacement + text.substring(end);
    if (isReply) {
      setReplyBody(newText);
    } else {
      setBodyField(newText);
    }
    
    setTimeout(() => {
      textarea.focus();
      const offset = replacement.length - selectedText.length;
      textarea.setSelectionRange(start, end + offset);
    }, 10);
  };

  // Compose / Send transmittal form submit
  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!toField.trim() || !subjectField.trim() || !bodyField.trim()) {
      showToast("To, Subject, and Body fields are required.", "error");
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
      // Send via Django backend — handles SMTP dispatch + DB record in one transaction
      const res = await apiClient.post(`/api/v1/projects/${id}/email/send/`, {
        to: toField,
        cc: ccField,
        subject: subjectField,
        body: bodyField,
        companyName: targetCompany || "Other",
        attachments: composerAttachments.map(a => a.name)
      });

      showToast(`Email sent successfully from ${SENDER_EMAIL}!`, "success");
      newEmailObj.status = res.data?.status || "Delivered";
      newEmailObj.id = res.data?.id || newMsgId;
      newEmailObj.dateSent = res.data?.dateSent || newEmailObj.dateSent;

      const updated = [newEmailObj, ...emails];
      saveEmailsToStorage(updated);
    } catch (err: any) {
      console.error("Email dispatch failed via backend:", err);
      newEmailObj.status = "Failed";
      const updated = [newEmailObj, ...emails];
      saveEmailsToStorage(updated);
      const errMsg = err?.response?.data?.error || err?.message || "Could not send email";
      showToast(`Send failed: ${errMsg}`, "error");
    } finally {
      setSending(false);
      setComposing(false);
      resetComposerForm();
      fetchEmails();
    }
  };

  // Send Inline Reply
  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmail || !replyBody.trim()) return;

    setSending(true);
    const replyId = `reply-${Date.now()}`;
    const replyObj: EmailMessage = {
      id: replyId,
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
      // Send reply via Django backend — SMTP + DB record in one call
      const res = await apiClient.post(`/api/v1/projects/${id}/email/send/`, {
        to: replyObj.to,
        cc: replyObj.cc,
        subject: replyObj.subject,
        body: replyObj.body,
        companyName: replyObj.companyName,
        attachments: replyAttachments.map(a => a.name)
      });

      showToast(`Reply sent successfully from ${SENDER_EMAIL}!`, "success");
      replyObj.status = res.data?.status || "Delivered";
      replyObj.id = res.data?.id || replyId;
      replyObj.dateSent = res.data?.dateSent || replyObj.dateSent;
    } catch (err: any) {
      console.error("Reply dispatch failed via backend:", err);
      replyObj.status = "Failed";
      const errMsg = err?.response?.data?.error || err?.message || "Failed to send reply";
      showToast(`Send failed: ${errMsg}`, "error");
    } finally {
      // Update active email structure in storage regardless
      const currentList = [...emails];
      const emailIndex = currentList.findIndex(item => item.id === selectedEmail.id);
      if (emailIndex !== -1) {
        const targetEmail = currentList[emailIndex];
        targetEmail.replies = [...(targetEmail.replies || []), replyObj];
        currentList[emailIndex] = { ...targetEmail };
        saveEmailsToStorage(currentList);
        setSelectedEmail({ ...targetEmail });
      }

      setSending(false);
      setReplyMode(null);
      setReplyBody("");
      setReplyAttachments([]);
    }
  };

  // Delete message
  const handleDeleteEmail = (emailId: string) => {
    const updated = emails.filter(item => item.id !== emailId);
    saveEmailsToStorage(updated);
    setSelectedEmail(null);
    showToast("Conversation deleted.", "info");
  };

  const resetComposerForm = () => {
    setTargetCompany("");
    setToField("");
    setCcField("");
    setSubjectField("");
    setBodyField("");
    setComposerAttachments([]);
  };

  // Open email thread handler
  const handleSelectEmail = (msg: EmailMessage) => {
    setSelectedEmail(msg);
    setReplyMode(null);
    setReplyBody("");
    setReplyAttachments([]);

    // Mark as read if in Inbox and unread
    if (msg.folder === "inbox" && msg.status === "Unread") {
      const updated = emails.map(item => {
        if (item.id === msg.id) {
          return { ...item, status: "Read" as const };
        }
        return item;
      });
      saveEmailsToStorage(updated);
    }
  };

  // Universal File Format Icon lookup
  const getFileIcon = (fileName: string) => {
    const ext = fileName.split(".").pop()?.toLowerCase();
    switch (ext) {
      case "pdf":
        return <FileText className="w-5 h-5 text-rose-500" />;
      case "xlsx":
      case "xls":
      case "csv":
        return <FileSpreadsheet className="w-5 h-5 text-emerald-500" />;
      case "zip":
      case "rar":
        return <FileArchive className="w-5 h-5 text-amber-500" />;
      case "png":
      case "jpg":
      case "jpeg":
      case "gif":
        return <ImageIcon className="w-5 h-5 text-indigo-500" />;
      case "dwg":
      case "dxf":
      case "cad":
        return <FileCode className="w-5 h-5 text-sky-500 font-bold" />;
      default:
        return <FileIcon className="w-5 h-5 text-slate-400" />;
    }
  };

  const filteredEmails = emails.filter(item => item.folder === activeFolder);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-8 flex flex-col font-sans">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-xl bg-white border border-slate-200 animate-slide-in">
          {toast.type === "success" && <CheckCircle className="w-5 h-5 text-emerald-500" />}
          {toast.type === "error" && <AlertCircle className="w-5 h-5 text-rose-500" />}
          {toast.type === "info" && <Building2 className="w-5 h-5 text-blue-500" />}
          <span className="text-sm font-medium text-slate-700">{toast.message}</span>
        </div>
      )}

      {/* Header bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push(`/projects/${id}`)}
              className="p-2 -ml-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition"
              title="Back to project"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">
                  {loadingProject ? "Loading..." : project?.code}
                </span>
                <h1 className="text-base font-bold text-slate-800">
                  {loadingProject ? "Project Details" : project?.name}
                </h1>
              </div>
              <p className="text-xs text-slate-500">Transmittal Communication & Logs (Gmail Workspace)</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-full text-xs text-slate-600 border border-slate-200">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Gmail SMTP Live ({SENDER_EMAIL})</span>
            </div>
          </div>
        </div>
      </header>

      {/* 2-Panel Gmail Layout Container */}
      <div className="max-w-7xl mx-auto w-full px-4 mt-6 flex gap-6 flex-1 items-stretch">
        
        {/* Navigation Sidebar Panel (Gmail style) */}
        <aside className="w-64 shrink-0 flex flex-col gap-6">
          <button
            onClick={() => {
              resetComposerForm();
              setComposing(true);
              setSelectedEmail(null);
            }}
            className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl shadow-md transition flex items-center justify-center gap-2.5 hover:shadow-lg active:scale-98"
          >
            <Plus className="w-5 h-5" />
            <span className="text-sm">Compose</span>
          </button>

          <nav className="bg-white rounded-xl border border-slate-200 p-2 shadow-xs space-y-1">
            <button
              onClick={() => {
                setActiveFolder("inbox");
                setSelectedEmail(null);
                setComposing(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition font-medium ${
                activeFolder === "inbox" && !composing
                  ? "bg-blue-50 text-blue-700"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Inbox className="w-4.5 h-4.5" />
                <span>Inbox</span>
              </div>
              {emails.filter(e => e.folder === "inbox" && e.status === "Unread").length > 0 && (
                <span className="px-2 py-0.5 bg-blue-600 text-white text-xxs font-bold rounded-full">
                  {emails.filter(e => e.folder === "inbox" && e.status === "Unread").length}
                </span>
              )}
            </button>

            <button
              onClick={() => {
                setActiveFolder("sent");
                setSelectedEmail(null);
                setComposing(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition font-medium ${
                activeFolder === "sent" && !composing
                  ? "bg-blue-50 text-blue-700"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Send className="w-4.5 h-4.5" />
                <span>Sent Mail</span>
              </div>
            </button>

            <button
              onClick={() => {
                setActiveFolder("drafts");
                setSelectedEmail(null);
                setComposing(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition font-medium ${
                activeFolder === "drafts" && !composing
                  ? "bg-blue-50 text-blue-700"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <FileText className="w-4.5 h-4.5" />
                <span>Drafts</span>
              </div>
            </button>
          </nav>
        </aside>

        {/* Content Pane */}
        <main className="flex-1 min-w-0 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
          
          {/* Default Folder Lists View */}
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
                </div>
              ) : (
                <div className="divide-y divide-slate-100 overflow-y-auto max-h-[calc(100vh-280px)]">
                  {filteredEmails.map(item => (
                    <div
                      key={item.id}
                      onClick={() => handleSelectEmail(item)}
                      className={`p-4 flex items-start gap-4 cursor-pointer hover:bg-slate-50 transition border-l-3 ${
                        item.status === "Unread" 
                          ? "border-l-blue-600 bg-blue-50/10 font-semibold" 
                          : "border-l-transparent"
                      }`}
                    >
                      <div className="p-2 bg-slate-100 rounded-lg text-slate-500 shrink-0">
                        <User className="w-5 h-5" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-slate-800 truncate block">
                            {item.fromName} <span className="text-xs text-slate-400 font-normal ml-1">From: {item.from}</span>
                          </span>
                          <span className="text-xs text-slate-400 font-normal shrink-0">
                            {new Date(item.dateSent).toLocaleDateString("en-AE", {
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit"
                            })}
                          </span>
                        </div>
                        <h4 className="text-sm text-slate-900 truncate mb-1">{item.subject}</h4>
                        <p className="text-xs text-slate-500 truncate leading-relaxed line-clamp-1">{item.body}</p>
                        
                        {/* Attachments indicators */}
                        {item.attachments.length > 0 && (
                          <div className="flex items-center gap-2 mt-2">
                            {item.attachments.map(att => (
                              <div key={att.name} className="flex items-center gap-1 px-2 py-0.5 bg-slate-100 border border-slate-200 rounded text-xxs text-slate-600">
                                <Paperclip className="w-3 h-3" />
                                <span className="truncate max-w-[120px]">{att.name}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Email Conversation / Open Thread Details View */}
          {selectedEmail && !composing && (
            <div className="flex flex-col flex-1 overflow-y-auto max-h-[calc(100vh-200px)]">
              {/* Thread Action bar */}
              <div className="px-6 py-3 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center sticky top-0 z-10">
                <button
                  onClick={() => setSelectedEmail(null)}
                  className="px-3 py-1.5 border border-slate-200 text-slate-600 hover:text-slate-800 bg-white rounded-lg text-xs hover:bg-slate-50 transition flex items-center gap-1.5"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Back
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setReplyMode("reply")}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs transition flex items-center gap-1.5"
                  >
                    <CornerUpLeft className="w-4 h-4" />
                    Reply
                  </button>
                  <button
                    onClick={() => setReplyMode("replyAll")}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs transition flex items-center gap-1.5"
                  >
                    <Mail className="w-4 h-4" />
                    Reply All
                  </button>
                  <button
                    onClick={() => handleDeleteEmail(selectedEmail.id)}
                    className="px-3 py-1.5 border border-slate-200 text-rose-600 hover:bg-rose-50 rounded-lg text-xs transition"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {/* Main Thread Head message */}
              <div className="p-6 border-b border-slate-100">
                <h3 className="text-base font-bold text-slate-800 mb-4">{selectedEmail.subject}</h3>
                
                <div className="flex items-start gap-3.5 mb-5">
                  <div className="p-2.5 bg-blue-50 text-blue-600 rounded-full shrink-0">
                    <User className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-sm font-semibold text-slate-800">{selectedEmail.fromName}</h4>
                        <span className="text-xs text-slate-500 font-medium block">From: {selectedEmail.from}</span>
                        <span className="text-xs text-slate-500 block">To: {selectedEmail.to}</span>
                        {selectedEmail.cc && <span className="text-xs text-slate-400 block">Cc: {selectedEmail.cc}</span>}
                      </div>
                      <span className="text-xs text-slate-400 font-normal shrink-0">
                        {new Date(selectedEmail.dateSent).toLocaleString("en-AE", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-sm text-slate-700 whitespace-pre-line leading-relaxed pl-1">
                  {selectedEmail.body}
                </div>

                {/* Main Message Pinned Attachments display */}
                {selectedEmail.attachments.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-slate-100">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1">
                      <Paperclip className="w-3.5 h-3.5" />
                      Attachments ({selectedEmail.attachments.length})
                    </h5>
                    <div className="flex flex-wrap gap-3">
                      {selectedEmail.attachments.map(file => (
                        <div key={file.name} className="flex items-center gap-3 p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs text-slate-700 max-w-sm transition shrink-0">
                          {getFileIcon(file.name)}
                          <div className="min-w-0 flex-1">
                            <p className="font-medium truncate max-w-[180px]">{file.name}</p>
                            <p className="text-slate-400 text-xxs">{file.size}</p>
                          </div>
                          <button className="p-1 text-slate-400 hover:text-slate-600 rounded" title="Download">
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Replies Thread chronological list */}
              {selectedEmail.replies && selectedEmail.replies.length > 0 && (
                <div className="bg-slate-50/50 p-6 space-y-6 border-b border-slate-100">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Replies History</h4>
                  {selectedEmail.replies.map((rep) => (
                    <div key={rep.id} className="bg-white p-5 rounded-lg border border-slate-200 shadow-xxs">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 bg-slate-100 text-slate-600 rounded-full flex items-center justify-center text-xs font-bold">
                            LD
                          </div>
                          <div>
                            <span className="text-xs font-semibold text-slate-800">{rep.fromName}</span>
                            <span className="text-xxs text-slate-400 block">From: {rep.from}</span>
                          </div>
                        </div>
                        <span className="text-xxs text-slate-400">
                          {new Date(rep.dateSent).toLocaleString("en-AE", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 whitespace-pre-line pl-1">{rep.body}</p>

                      {/* Reply Attachments */}
                      {rep.attachments && rep.attachments.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-slate-100">
                          {rep.attachments.map(file => (
                            <div key={file.name} className="flex items-center gap-2 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded text-xxs text-slate-600">
                              {getFileIcon(file.name)}
                              <span>{file.name} ({file.size})</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Inline Reply Composer Panel */}
              {replyMode && (
                <div className="p-6 bg-slate-50 border-t border-slate-100">
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-2">
                      <CornerUpLeft className="w-4 h-4 text-blue-600" />
                      <span className="text-xs font-bold text-slate-700">
                        {replyMode === "replyAll" ? "Reply All" : "Reply"} to {selectedEmail.from}
                      </span>
                    </div>
                    <button onClick={() => setReplyMode(null)} className="p-1 text-slate-400 hover:text-slate-600 rounded">
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <form onSubmit={handleSendReply} className="space-y-4">
                    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition">
                      
                      {/* Editor formatting toolbar */}
                      <div className="bg-slate-50 border-b border-slate-200 px-3 py-2 flex items-center gap-2.5">
                        <button type="button" onClick={() => insertFormat("bold", true)} className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-200/50 rounded" title="Bold">
                          <Bold className="w-4 h-4" />
                        </button>
                        <button type="button" onClick={() => insertFormat("italic", true)} className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-200/50 rounded" title="Italic">
                          <Italic className="w-4 h-4" />
                        </button>
                        <button type="button" onClick={() => insertFormat("heading", true)} className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-200/50 rounded" title="Heading">
                          <Heading className="w-4 h-4" />
                        </button>
                        <button type="button" onClick={() => insertFormat("list", true)} className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-200/50 rounded" title="List">
                          <List className="w-4 h-4" />
                        </button>
                        <button type="button" onClick={() => insertFormat("link", true)} className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-200/50 rounded" title="Link">
                          <Link2 className="w-4 h-4" />
                        </button>
                      </div>

                      <textarea
                        ref={replyTextareaRef}
                        rows={6}
                        placeholder={`Write reply here... (Original message quotes automatically appended)`}
                        value={replyBody}
                        onChange={e => setReplyBody(e.target.value)}
                        required
                        className="w-full px-4 py-3 text-sm text-slate-800 bg-transparent border-0 focus:ring-0 focus:outline-none placeholder-slate-400 font-mono"
                      />
                    </div>

                    {/* Universal Drag and Drop Upload container for Reply */}
                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, true)}
                      className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition ${
                        isDragOver ? "border-blue-500 bg-blue-50/50" : "border-slate-200 hover:border-slate-300"
                      }`}
                      onClick={() => replyFileInputRef.current?.click()}
                    >
                      <input
                        type="file"
                        ref={replyFileInputRef}
                        multiple
                        className="hidden"
                        onChange={(e) => e.target.files && handleAddFiles(e.target.files, true)}
                      />
                      <Paperclip className="w-6 h-6 text-slate-400 mx-auto mb-1.5" />
                      <p className="text-xs text-slate-600 font-medium">
                        Drag and drop attachments here, or <span className="text-blue-600 hover:underline">browse files</span>
                      </p>
                      <p className="text-xxs text-slate-400 mt-1">Accepts any file type (PDF, XLSX, DOCX, DWG, ZIP, images...)</p>
                    </div>

                    {/* Pinned Reply Attachments chips display */}
                    {replyAttachments.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {replyAttachments.map((file, idx) => (
                          <div key={idx} className="flex items-center gap-2 pl-2.5 pr-1.5 py-1 bg-white border border-slate-200 rounded-full text-xxs text-slate-700 shadow-xxs">
                            {getFileIcon(file.name)}
                            <span className="font-medium max-w-[180px] truncate">{file.name}</span>
                            <span className="text-slate-400 font-normal">({file.size})</span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setReplyAttachments(prev => prev.filter((_, i) => i !== idx));
                              }}
                              className="p-0.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-full transition"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Form reply buttons */}
                    <div className="flex justify-end gap-3.5">
                      <button
                        type="button"
                        onClick={() => {
                          setReplyMode(null);
                          setReplyBody("");
                          setReplyAttachments([]);
                        }}
                        className="px-4 py-2 bg-white border border-slate-200 text-slate-600 hover:text-slate-800 rounded-lg text-xs font-medium hover:bg-slate-50 transition"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={sending || !replyBody.trim()}
                        className="px-4.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-xs shadow-sm transition flex items-center gap-1.5 disabled:bg-blue-400 disabled:scale-100 active:scale-97"
                      >
                        {sending ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <Send className="w-3.5 h-3.5" />
                            Send Reply
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          )}

          {/* New Email Composer Panel */}
          {composing && (
            <div className="flex flex-col flex-1 overflow-y-auto max-h-[calc(100vh-200px)]">
              <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center">
                <div className="flex items-center gap-2.5">
                  <Plus className="w-5 h-5 text-blue-600" />
                  <h2 className="font-semibold text-slate-800 text-sm">New Transmittal Notice</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setComposing(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              <form onSubmit={handleSendEmail} className="p-6 space-y-5">
                {/* Visible From Field */}
                <div className="grid grid-cols-1 gap-1 border-b border-slate-100 pb-3">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">From</span>
                  <div className="text-sm text-slate-700 font-semibold bg-slate-50 px-3 py-1.5 rounded border border-slate-100 flex items-center gap-2">
                    <User className="w-4 h-4 text-slate-400" />
                    <span>{SENDER_NAME} &lt;{SENDER_EMAIL}&gt;</span>
                  </div>
                </div>

                {/* Target Company Selector */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                    Target Recipient Company
                  </label>
                  <select
                    value={targetCompany}
                    onChange={handleCompanyChange}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                  >
                    <option value="">-- Choose target company to autofill transmittal template --</option>
                    {TARGET_COMPANIES.map(company => (
                      <option key={company.name} value={company.name}>
                        {company.name}
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

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                      Cc (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="comma-separated CC emails"
                      value={ccField}
                      onChange={e => setCcField(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                    />
                  </div>
                </div>

                {/* Subject */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                    Subject <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Enter email subject line"
                    value={subjectField}
                    onChange={e => setSubjectField(e.target.value)}
                    required
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition font-medium"
                  />
                </div>

                {/* Email Body & Editor */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                    Transmittal Message Body <span className="text-rose-500">*</span>
                  </label>
                  
                  <div className="border border-slate-200 rounded-t-lg bg-slate-50 px-3 py-2 flex items-center gap-2 border-b-0">
                    <button type="button" onClick={() => insertFormat("bold")} className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200/50 rounded transition" title="Bold">
                      <Bold className="w-4 h-4" />
                    </button>
                    <button type="button" onClick={() => insertFormat("italic")} className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200/50 rounded transition" title="Italic">
                      <Italic className="w-4 h-4" />
                    </button>
                    <button type="button" onClick={() => insertFormat("heading")} className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200/50 rounded transition" title="Heading">
                      <Heading className="w-4 h-4" />
                    </button>
                    <button type="button" onClick={() => insertFormat("list")} className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200/50 rounded transition" title="Bullet List">
                      <List className="w-4 h-4" />
                    </button>
                    <button type="button" onClick={() => insertFormat("link")} className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200/50 rounded transition" title="Insert Link">
                      <Link2 className="w-4 h-4" />
                    </button>
                  </div>

                  <textarea
                    ref={composerTextareaRef}
                    rows={8}
                    placeholder="Write transmittal content here..."
                    value={bodyField}
                    onChange={e => setBodyField(e.target.value)}
                    required
                    className="w-full bg-white border border-slate-200 rounded-b-lg px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition font-mono"
                  />
                </div>

                {/* Universal Drag and Drop Upload container for Composer */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, false)}
                  className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition ${
                    isDragOver ? "border-blue-500 bg-blue-50/50" : "border-slate-200 hover:border-slate-300"
                  }`}
                  onClick={() => composerFileInputRef.current?.click()}
                >
                  <input
                    type="file"
                    ref={composerFileInputRef}
                    multiple
                    className="hidden"
                    onChange={(e) => e.target.files && handleAddFiles(e.target.files, false)}
                  />
                  <Paperclip className="w-7 h-7 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm text-slate-700 font-medium">
                    Drag and drop transmittal files here, or <span className="text-blue-600 hover:underline">browse files</span>
                  </p>
                  <p className="text-xs text-slate-400 mt-1">Accepts any file formats (PDF, XLSX, DOCX, DWG, ZIP, images...)</p>
                </div>

                {/* Pinned Composer Attachments chips display */}
                {composerAttachments.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">Pinned Attachments ({composerAttachments.length})</span>
                    <div className="flex flex-wrap gap-2">
                      {composerAttachments.map((file, idx) => (
                        <div key={idx} className="flex items-center gap-2 pl-3 pr-2 py-1.5 bg-slate-50 border border-slate-200 rounded-full text-xs text-slate-700 shadow-xxs">
                          {getFileIcon(file.name)}
                          <span className="font-medium max-w-[200px] truncate">{file.name}</span>
                          <span className="text-slate-400 font-normal">({file.size})</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setComposerAttachments(prev => prev.filter((_, i) => i !== idx));
                            }}
                            className="p-0.5 text-slate-400 hover:text-rose-600 hover:bg-slate-200 rounded-full transition"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Form Buttons */}
                <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setComposing(false);
                      resetComposerForm();
                    }}
                    className="px-4 py-2 border border-slate-200 text-slate-600 hover:text-slate-800 rounded-lg text-sm hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={sending}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-sm shadow-sm transition flex items-center gap-2 disabled:bg-blue-400 disabled:scale-100 active:scale-97"
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
          )}

        </main>

      </div>
    </div>
  );
}
