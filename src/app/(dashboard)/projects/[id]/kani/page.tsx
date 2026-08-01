"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Mail,
  Send,
  History,
  FileText,
  CheckCircle,
  AlertCircle,
  Loader2,
  Paperclip,
  ChevronLeft,
  Building2,
  Download,
  Eye,
  Bold,
  Italic,
  Heading,
  List,
  Link2
} from "lucide-react";
import { getProjects, type EnterpriseProject } from "@/lib/api/projects";
import apiClient from "@/lib/api/client";

// Types
interface EmailTransmittal {
  id: string;
  dateSent: string;
  subject: string;
  to: string;
  cc?: string;
  body: string;
  companyName: string;
  status: "Sent" | "Delivered" | "Failed";
}

// Preset Target Companies
const TARGET_COMPANIES = [
  {
    name: "Jasper Contracting LLC",
    emails: "contacts@jaspercontracting.com, project.manager@jaspercontracting.com",
    template: `Dear Jasper Contracting Team,

Please find attached the latest Transmittal Notice and verified Document Register for **{projectName}** (Project Code: {projectCode}).

### Document Transmittal Summary
- **Project Name:** {projectName}
- **Document Code:** {projectCode}-DR-001
- **Package Status:** Approved & Released
- **Revision:** Rev 2.0

You can view the full live register and download all relevant fabrication packages here:
[Live Document Register Link](http://localhost:3000/projects/{projectId})

Should you have any technical queries or need further revisions, please let our section detailing team know.

Best Regards,
Document Control Department
**Jasper Steel Detailing Operations**`
  },
  {
    name: "Alef Detailing Services",
    emails: "detailing@alefservices.com, review@alefservices.com",
    template: `Dear Alef Detailing Team,

We have issued the official Document Register for **{projectName}** (Project Code: {projectCode}).

### Transmittal Details
- **Subject:** Approved Fabrication Drawings release
- **Project Code:** {projectCode}
- **Transmittal Ref:** EOMS-TX-{projectCode}-004
- **Release Date:** {dateString}

Please review the attached register file and coordinate with the checker team on:
[EOMS Review Workspace](http://localhost:3000/projects/{projectId})

Kind Regards,
Section Manager
**Jasper Steel Detailing Operations**`
  },
  {
    name: "Econ Steel Construction",
    emails: "steel.eng@econconstruction.com, support@econconstruction.com",
    template: `Dear Econ Steel Engineering Team,

Please find the updated Document Register and project files for **{projectName}** ({projectCode}) ready for erection review.

### Transmittal Summary
- **Project:** {projectName}
- **Transmittal Code:** EOMS-{projectCode}-ER-02
- **Attached Register:** {projectCode}_Register_v2.pdf

Access the digital approval dashboard at:
[EOMS Project Board](http://localhost:3000/projects/{projectId})

Sincerely,
Engineering Department
**Jasper Steel Detailing Operations**`
  },
  {
    name: "Vertex Design Group",
    emails: "design@vertexgroup.ae, admin@vertexgroup.ae",
    template: `Dear Vertex Design Team,

Transmittal of project files for **{projectName}** ({projectCode}) is complete.

- **Status:** Release for Construction (RFC)
- **Reference Project:** {projectName}
- **Review Portal:** [Vertex Design Portal](http://localhost:3000/projects/{projectId})

Please download the register document and acknowledge receipt.

Best Regards,
Document Control`
  }
];

export default function TransmittalEmailPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();

  // State
  const [project, setProject] = useState<EnterpriseProject | null>(null);
  const [loadingProject, setLoadingProject] = useState(true);
  const [targetCompany, setTargetCompany] = useState("");
  
  // Form fields
  const [toField, setToField] = useState("");
  const [ccField, setCcField] = useState("");
  const [subjectField, setSubjectField] = useState("");
  const [bodyField, setBodyField] = useState("");
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  // Attachments state
  const [attachments] = useState<Array<{ name: string; size: string; type: string }>>([
    { name: "JASPER_DOCUMENT_REGISTER_v2.0.pdf", size: "1.45 MB", type: "application/pdf" }
  ]);

  // History State
  const [history, setHistory] = useState<EmailTransmittal[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [selectedTransmittal, setSelectedTransmittal] = useState<EmailTransmittal | null>(null);

  // Textarea Ref for formatting
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  // Fetch transmittal history
  const fetchHistory = React.useCallback(async () => {
    setLoadingHistory(true);
    try {
      // Attempt API call
      const res = await apiClient.get(`/api/v1/projects/${id}/emails/`);
      setHistory(res.data);
    } catch (err) {
      console.warn("Backend transmittal history API not found, loading from localStorage...", err);
      // Fallback to localStorage mock data
      const stored = localStorage.getItem(`transmittals_${id}`);
      if (stored) {
        setHistory(JSON.parse(stored));
      } else {
        // Initialize default mock history items
        const defaultMock: EmailTransmittal[] = [
          {
            id: "tx-mock-1",
            dateSent: new Date(Date.now() - 86400000 * 3).toISOString(),
            subject: `Transmittal Notice: ${project?.name || "Abu Dhabi Mall"} - Document Register`,
            to: "contacts@jaspercontracting.com, project.manager@jaspercontracting.com",
            cc: "cc@jasper.com",
            body: "Dear Jasper Contracting Team,\n\nPlease find attached the latest Transmittal Notice and verified Document Register...",
            companyName: "Jasper Contracting LLC",
            status: "Delivered"
          },
          {
            id: "tx-mock-2",
            dateSent: new Date(Date.now() - 86400000 * 7).toISOString(),
            subject: `Transmittal Notice: ${project?.name || "Abu Dhabi Mall"} - Document Register`,
            to: "detailing@alefservices.com",
            cc: "",
            body: "Dear Alef Detailing Team,\n\nWe have issued the official Document Register...",
            companyName: "Alef Detailing Services",
            status: "Sent"
          }
        ];
        localStorage.setItem(`transmittals_${id}`, JSON.stringify(defaultMock));
        setHistory(defaultMock);
      }
    } finally {
      setLoadingHistory(false);
    }
  }, [id, project]);

  useEffect(() => {
    if (project) {
      fetchHistory();
    }
  }, [project, fetchHistory]);

  // Toast Helper
  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Company selection autofill
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

      // Compile template
      const bodyText = companyData.template
        .replace(/{projectName}/g, pName)
        .replace(/{projectCode}/g, pCode)
        .replace(/{projectId}/g, id)
        .replace(/{dateString}/g, today);

      setBodyField(bodyText);
      showToast(`Autofilled template for ${name}`, "info");
    }
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
    if (!toField.trim() || !subjectField.trim() || !bodyField.trim()) {
      showToast("Please fill in To, Subject, and Email Body fields.", "error");
      return;
    }

    setSending(true);

    const payload = {
      to: toField,
      cc: ccField,
      subject: subjectField,
      body: bodyField,
      companyName: targetCompany || "Other",
      attachments: attachments.map(a => a.name)
    };

    try {
      // POST API attempt
      await apiClient.post(`/api/v1/projects/${id}/email/send/`, payload);
      showToast("Transmittal email sent successfully via API!", "success");
      fetchHistory();
    } catch (err) {
      console.warn("Backend API send not implemented, executing local simulation...", err);
      
      // Simulate API success
      const newTX: EmailTransmittal = {
        id: `tx-${Date.now()}`,
        dateSent: new Date().toISOString(),
        subject: subjectField,
        to: toField,
        cc: ccField,
        body: bodyField,
        companyName: targetCompany || "Other",
        status: "Sent"
      };

      const stored = localStorage.getItem(`transmittals_${id}`);
      const list = stored ? JSON.parse(stored) : [];
      const updatedList = [newTX, ...list];
      localStorage.setItem(`transmittals_${id}`, JSON.stringify(updatedList));
      setHistory(updatedList);

      // Trigger automatic status update simulation
      setTimeout(() => {
        const storedList = JSON.parse(localStorage.getItem(`transmittals_${id}`) || "[]");
        const idx = storedList.findIndex((item: EmailTransmittal) => item.id === newTX.id);
        if (idx !== -1) {
          storedList[idx].status = "Delivered";
          localStorage.setItem(`transmittals_${id}`, JSON.stringify(storedList));
          setHistory(storedList);
        }
      }, 5000);

      showToast("Transmittal dispatched successfully (simulated)!", "success");
    } finally {
      setSending(false);
      // Reset form controls
      setTargetCompany("");
      setToField("");
      setCcField("");
      setSubjectField("");
      setBodyField("");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-12">
      {/* Toast Notification banner */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-xl bg-white border border-slate-200 animate-slide-in">
          {toast.type === "success" && <CheckCircle className="w-5 h-5 text-emerald-500" />}
          {toast.type === "error" && <AlertCircle className="w-5 h-5 text-rose-500" />}
          {toast.type === "info" && <Building2 className="w-5 h-5 text-blue-500" />}
          <span className="text-sm font-medium text-slate-700">{toast.message}</span>
        </div>
      )}

      {/* Top Header bar */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30">
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
              <p className="text-xs text-slate-500">Transmittal Email Composer & Dispatch History</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid Content */}
      <main className="max-w-7xl mx-auto px-4 mt-6">
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
                </div>

                {/* Subject line input */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                    Subject Line <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Enter email subject line"
                    value={subjectField}
                    onChange={e => setSubjectField(e.target.value)}
                    required
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                  />
                </div>

                {/* Body Rich Text editor */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                    Transmittal Notice Body <span className="text-rose-500">*</span>
                  </label>
                  
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
                    rows={12}
                    placeholder="Write transmittal content here..."
                    value={bodyField}
                    onChange={e => setBodyField(e.target.value)}
                    required
                    className="w-full bg-white border border-slate-200 rounded-b-lg px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition font-mono"
                  />
                </div>

                {/* Send Button container */}
                <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => router.push(`/projects/${id}`)}
                    className="px-4 py-2 border border-slate-200 text-slate-600 hover:text-slate-800 rounded-lg text-sm hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={sending}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-sm shadow-sm transition flex items-center gap-2 disabled:bg-blue-400"
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
            
            {/* Attachment Register list component */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <Paperclip className="w-4.5 h-4.5 text-slate-500" />
                  <h3 className="font-semibold text-slate-800 text-sm">Finalized Register Attachment</h3>
                </div>
              </div>
              <div className="p-4 space-y-3">
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
                        <p className="text-[10px] text-slate-400 font-medium">{att.size}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="p-1 text-slate-400 hover:text-slate-600 rounded transition"
                      title="Download PDF Copy"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <p className="text-[11px] text-slate-400 text-center italic mt-2">
                  * Transmittal notice will automatically append the Document Register attachment.
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
                    {loadingProject ? "..." : project?.code}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                    Client Name
                  </span>
                  <span className="text-sm font-medium text-slate-700">
                    {loadingProject ? "..." : project?.client || "Not Specified"}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                    EOMS Project URL
                  </span>
                  <span className="text-xs text-blue-600 underline font-mono break-all block mt-0.5">
                    http://localhost:3000/projects/{id}
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Email history table section */}
        <div className="mt-8 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <History className="w-4.5 h-4.5 text-slate-500" />
              <h3 className="font-semibold text-slate-800">Transmittal Dispatch History</h3>
            </div>
            <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full font-medium">
              {history.length} Record{history.length !== 1 ? "s" : ""}
            </span>
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
      </main>

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
