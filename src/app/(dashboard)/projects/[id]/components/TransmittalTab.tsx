"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Mail,
  Send,
  History,
  FileText,
  CheckCircle,
  AlertCircle,
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
  Plus
} from "lucide-react";
import apiClient from "@/lib/api/client";

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

interface ProjectContact {
  id: string;
  company_name: string;
  emails: string;
}

interface ZipPackage {
  id: string;
  submission_no: string;
  original_filename: string;
  created_at: string;
}

export default function TransmittalTab({ project, projectId }: { project: any; projectId: string }) {
  // State
  const [targetCompany, setTargetCompany] = useState("");
  const [toField, setToField] = useState("");
  const [ccField, setCcField] = useState("");
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
  const [loadingDrawings, setLoadingDrawings] = useState(false);

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

  // Initialize Cc List and Mail Number from project defaults
  useEffect(() => {
    if (project?.mail_cc) {
      setCcField(project.mail_cc);
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
        setSelectedSubmission(sorted[0].id);
      }
    } catch (err) {
      console.error("Failed to fetch submissions", err);
    } finally {
      setLoadingSubmissions(false);
    }
  }, [projectId]);

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
        
        // Get rows for this register
        const rowsRes = await apiClient.get(`/api/v1/projects/${projectId}/registers/${activeReg.id}/rows/`);
        let allRows = rowsRes.data;
        if (allRows && typeof allRows === 'object' && 'results' in allRows) {
          allRows = allRows.results;
        }
        const rowsArray = Array.isArray(allRows) ? allRows : [];
        setRegisterRows(rowsArray);
        
        // Extract drawing numbers in order, filtered by the selected submission (ZipPackage)
        const extracted = rowsArray
          .filter((row: any) => row.drawing_number && row.zip_package === selectedSubmission)
          .map((row: any) => row.drawing_number);
        
        setDrawings(extracted);
      }
    } catch (err) {
      console.error("Failed to fetch drawings", err);
    } finally {
      setLoadingDrawings(false);
    }
  }, [projectId, selectedSubmission]);

  useEffect(() => {
    if (project) {
      fetchHistory();
      fetchContacts();
      fetchSubmissions();
    }
  }, [project, fetchHistory, fetchContacts, fetchSubmissions]);

  useEffect(() => {
    if (projectId && selectedSubmission) {
      fetchDrawings();
    }
  }, [projectId, selectedSubmission, fetchDrawings]);

  // Reactive email body compiler
  useEffect(() => {
    if (!targetCompany) return;
    
    const contactData = contacts.find(c => c.id.toString() === targetCompany);
    if (contactData) {
      setToField(contactData.emails);
      const pName = project?.name || "Project";
      const mailNum = localMailNumber || "MAIL-001";
      
      setSubjectField(mailNum);

      let drawingListText = "";
      if (drawings.length > 0) {
        drawingListText = drawings.map((dwg, idx) => `${idx + 1}. ${dwg}`).join("\n");
      } else {
        drawingListText = "1. [No drawings found in this submission]";
      }

      const bodyText = `Dear ${contactData.company_name} Team,

Please click the link below to download the following drawings.

${pName}

${drawingListText}

[Paste Link Here]

Thanks & Regards,
${project?.created_by?.first_name || 'Document Control'}
Jasper Detailing Services`;

      setBodyField(bodyText);
    }
  }, [targetCompany, drawings, localMailNumber, contacts, project]);

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
    if (!toField.trim() || !subjectField.trim() || !bodyField.trim()) {
      showToast("Please fill in To, Subject, and Email Body fields.", "error");
      return;
    }

    setSending(true);
    
    const targetContact = contacts.find(c => c.id.toString() === targetCompany);

    const payload = {
      to: toField,
      cc: ccField,
      subject: subjectField,
      body: bodyField,
      companyName: targetContact ? targetContact.company_name : "Other",
      attachments: attachments.map(a => a.name)
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
      setToField("");
      setCcField(project?.mail_cc || "");
      setSubjectField("");
      setBodyField("");
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
                  rows={20}
                  placeholder="Select contact above to auto-fill format..."
                  value={bodyField}
                  onChange={e => setBodyField(e.target.value)}
                  required
                  className="w-full bg-white border border-slate-200 rounded-b-lg px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition font-mono"
                />
              </div>

              {/* Send Button container */}
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
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
                    onClick={handleDownloadRegisterCSV}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded transition"
                    title="Download Copy"
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
