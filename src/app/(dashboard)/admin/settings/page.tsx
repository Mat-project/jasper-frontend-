"use client";

import { useState, useEffect } from "react";
import { getSystemSettings, updateSystemSetting, createSystemSetting, uploadCompanyFile } from "@/lib/api/settings";
import { getAIUsageStats, type AIUsageStatsResponse } from "@/lib/api/aiUsage";
import { getBaseUrl } from "@/lib/api/client";
import { Settings, ShieldAlert, Users2, Save, CheckCircle, RefreshCw, Building2, UploadCloud, Sparkles, Cpu, AlertTriangle, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"general" | "company" | "ai" | "user" | "security">("general");
  const [isSaved, setIsSaved] = useState(false);

  // AI Usage State
  const [aiStats, setAiStats] = useState<AIUsageStatsResponse | null>(null);
  const [loadingAiStats, setLoadingAiStats] = useState(false);

  // Form State
  const [generalValues, setGeneralValues] = useState({
    siteName: "EOMS Portal",
    contactEmail: "support@eoms.local",
    rowsPerPage: 10,
  });

  const [userValues, setUserValues] = useState({
    allowRegistration: false,
    requireEmailVerification: true,
  });

  const [securityValues, setSecurityValues] = useState({
    passwordMinLength: 8,
    sessionTimeoutMinutes: 30,
    mfaRequired: false,
  });

  const [companyValues, setCompanyValues] = useState({
    companyName: "",
    address: "",
    email: "",
    phone: "",
    website: "",
    taxNumber: "",
    currency: "AED",
    logo_url: "",
    signature_url: "",
    invoice_footer: "",
    bankInfo: {
      bankName: "",
      accountName: "",
      accountNumber: "",
      iban: "",
      swift: ""
    },
    notes: ""
  });

  const loadSettings = async () => {
    setLoading(true);
    try {
      const data = await getSystemSettings();
      const settingsMap: Record<string, any> = {};
      if (Array.isArray(data)) {
        data.forEach((s: any) => {
          settingsMap[s.key] = s.value;
        });
      }

      if (settingsMap.siteName !== undefined) setGeneralValues(prev => ({ ...prev, siteName: settingsMap.siteName }));
      if (settingsMap.contactEmail !== undefined) setGeneralValues(prev => ({ ...prev, contactEmail: settingsMap.contactEmail }));
      if (settingsMap.rowsPerPage !== undefined) setGeneralValues(prev => ({ ...prev, rowsPerPage: settingsMap.rowsPerPage }));

      if (settingsMap.allowRegistration !== undefined) setUserValues(prev => ({ ...prev, allowRegistration: settingsMap.allowRegistration }));
      if (settingsMap.requireEmailVerification !== undefined) setUserValues(prev => ({ ...prev, requireEmailVerification: settingsMap.requireEmailVerification }));

      if (settingsMap.passwordMinLength !== undefined) setSecurityValues(prev => ({ ...prev, passwordMinLength: settingsMap.passwordMinLength }));
      if (settingsMap.sessionTimeoutMinutes !== undefined) setSecurityValues(prev => ({ ...prev, sessionTimeoutMinutes: settingsMap.sessionTimeoutMinutes }));
      if (settingsMap.mfaRequired !== undefined) setSecurityValues(prev => ({ ...prev, mfaRequired: settingsMap.mfaRequired }));

        if (settingsMap.company_profile !== undefined) {
        setCompanyValues(prev => ({
          ...prev,
          ...settingsMap.company_profile,
          bankInfo: { ...prev.bankInfo, ...(settingsMap.company_profile.bankInfo || {}) }
        }));
      }
    } catch (err) {
      console.error("Failed to load settings:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadAiStats = async () => {
    setLoadingAiStats(true);
    try {
      const data = await getAIUsageStats();
      setAiStats(data);
    } catch (err) {
      console.error("Failed to load AI usage stats:", err);
    } finally {
      setLoadingAiStats(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    if (activeTab === "ai") {
      loadAiStats();
    }
  }, [activeTab]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setIsSaved(false);

    try {
      // Determine which keys to save based on the active tab
      let keysToSave: Record<string, any> = {};
      if (activeTab === "general") {
        keysToSave = generalValues;
      } else if (activeTab === "user") {
        keysToSave = userValues;
      } else if (activeTab === "company") {
        keysToSave = { company_profile: companyValues };
      } else {
        keysToSave = securityValues;
      }

      // Update or create each setting
      for (const [key, value] of Object.entries(keysToSave)) {
        try {
          await updateSystemSetting(key, value);
        } catch {
          // If PATCH fails (e.g. setting key doesn't exist yet), call POST to create
          await createSystemSetting(key, value);
        }
      }

      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (err) {
      console.error("Save settings failed:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'logo_url' | 'signature_url') => {
    if (e.target.files && e.target.files[0]) {
      try {
        const data = await uploadCompanyFile(e.target.files[0]);
        setCompanyValues(prev => ({ ...prev, [field]: data.file_url }));
      } catch (err) {
        console.error("File upload failed", err);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
        <p className="text-sm text-muted-foreground animate-pulse">Loading system settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-foreground tracking-tight">System Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Configure security baselines, AI API token tracking, company profile, and generic application parameters.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Left tabs links */}
        <div className="md:col-span-1 flex flex-row md:flex-col gap-1 bg-slate-500/5 p-1.5 rounded-xl border border-border h-fit">
          {[
            { id: "general" as const, label: "General", icon: Settings },
            { id: "company" as const, label: "Company Profile", icon: Building2 },
            { id: "ai" as const, label: "AI & Spend Tracker", icon: Sparkles },
            { id: "user" as const, label: "Users", icon: Users2 },
            { id: "security" as const, label: "Security", icon: ShieldAlert },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex-1 md:flex-initial flex items-center justify-center md:justify-start gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-150 text-left",
                activeTab === tab.id
                  ? "bg-slate-800 text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-slate-500/5"
              )}
            >
              <tab.icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Right Settings Form */}
        <div className="md:col-span-3">
          <form onSubmit={handleSave} className="bg-card border border-border rounded-xl p-6 space-y-6 shadow-sm">
            {isSaved && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-sm flex items-center gap-2 animate-fade-in">
                <CheckCircle className="h-4 w-4 shrink-0" />
                <span>Settings saved and audited successfully!</span>
              </div>
            )}

            {/* GENERAL SETTINGS */}
            {activeTab === "general" && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-foreground pb-2 border-b border-border">General Settings</h3>
                
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground">Portal Name</label>
                  <input
                    type="text"
                    value={generalValues.siteName}
                    onChange={(e) => setGeneralValues({ ...generalValues, siteName: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-background border border-input text-sm text-foreground focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground">Support Contact Email</label>
                  <input
                    type="email"
                    value={generalValues.contactEmail}
                    onChange={(e) => setGeneralValues({ ...generalValues, contactEmail: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-background border border-input text-sm text-foreground focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground">Tables Page Size Limit</label>
                  <input
                    type="number"
                    min={5}
                    max={100}
                    value={generalValues.rowsPerPage}
                    onChange={(e) => setGeneralValues({ ...generalValues, rowsPerPage: parseInt(e.target.value) || 10 })}
                    className="w-full px-3 py-2 rounded-lg bg-background border border-input text-sm text-foreground focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* USER SETTINGS (Future Features - Commented for future activation) */}
            {activeTab === "user" && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-foreground pb-2 border-b border-border">User Controls</h3>

                {/* Future Feature: Public Registrations
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-500/5 border border-border">
                  <div>
                    <span className="text-xs font-semibold text-foreground block">Allow Public Registrations</span>
                    <span className="text-[10px] text-muted-foreground font-medium">Toggle open signups from the login panel</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={userValues.allowRegistration}
                    onChange={(e) => setUserValues({ ...userValues, allowRegistration: e.target.checked })}
                    className="rounded border-input text-brand-500 focus:ring-brand-500 h-4 w-4 cursor-pointer"
                  />
                </div>
                */}

                {/* Future Feature: Email Verification
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-500/5 border border-border">
                  <div>
                    <span className="text-xs font-semibold text-foreground block">Verify Email Activation</span>
                    <span className="text-[10px] text-muted-foreground font-medium">Require new users to activate email addresses</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={userValues.requireEmailVerification}
                    onChange={(e) => setUserValues({ ...userValues, requireEmailVerification: e.target.checked })}
                    className="rounded border-input text-brand-500 focus:ring-brand-500 h-4 w-4 cursor-pointer"
                  />
                </div>
                */}

                <div className="p-4 bg-amber-500/10 border border-amber-500/20 text-amber-600 rounded-lg text-xs font-medium">
                  User accounts are managed centrally by Administrators under <strong>Masters ➔ Employees</strong>. Self-registration features are reserved for future updates.
                </div>
              </div>
            )}

            {/* SECURITY SETTINGS */}
            {activeTab === "security" && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-foreground pb-2 border-b border-border">Security Settings</h3>

                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground">Minimum Password Length</label>
                  <input
                    type="number"
                    min={6}
                    value={securityValues.passwordMinLength}
                    onChange={(e) => setSecurityValues({ ...securityValues, passwordMinLength: parseInt(e.target.value) || 8 })}
                    className="w-full px-3 py-2 rounded-lg bg-background border border-input text-sm text-foreground focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground">Session Timeout (Minutes)</label>
                  <input
                    type="number"
                    min={5}
                    value={securityValues.sessionTimeoutMinutes}
                    onChange={(e) => setSecurityValues({ ...securityValues, sessionTimeoutMinutes: parseInt(e.target.value) || 30 })}
                    className="w-full px-3 py-2 rounded-lg bg-background border border-input text-sm text-foreground focus:outline-none"
                  />
                </div>

                {/* Future Feature: MFA Setup
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-500/5 border border-border">
                  <div>
                    <span className="text-xs font-semibold text-foreground block">Force MFA Authentication</span>
                    <span className="text-[10px] text-muted-foreground">Mandate multi-factor setup on all logins</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={securityValues.mfaRequired}
                    onChange={(e) => setSecurityValues({ ...securityValues, mfaRequired: e.target.checked })}
                    className="rounded border-input text-brand-500 focus:ring-brand-500 h-4 w-4 cursor-pointer"
                  />
                </div>
                */}
              </div>
            )}
            {/* COMPANY PROFILE SETTINGS */}
            {activeTab === "company" && (
              <div className="space-y-6 animate-fade-in">
                <h3 className="text-sm font-bold text-foreground pb-2 border-b border-border">Company Identity</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs text-muted-foreground">Company Name</label>
                    <input
                      type="text"
                      value={companyValues.companyName}
                      onChange={(e) => setCompanyValues({ ...companyValues, companyName: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-background border border-input text-sm text-foreground focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-muted-foreground">Tax / TRN Number</label>
                    <input
                      type="text"
                      value={companyValues.taxNumber}
                      onChange={(e) => setCompanyValues({ ...companyValues, taxNumber: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-background border border-input text-sm text-foreground focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs text-muted-foreground">Address</label>
                    <textarea
                      rows={2}
                      value={companyValues.address}
                      onChange={(e) => setCompanyValues({ ...companyValues, address: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-background border border-input text-sm text-foreground focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-muted-foreground">Contact Email</label>
                    <input
                      type="email"
                      value={companyValues.email}
                      onChange={(e) => setCompanyValues({ ...companyValues, email: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-background border border-input text-sm text-foreground focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-muted-foreground">Contact Phone</label>
                    <input
                      type="text"
                      value={companyValues.phone}
                      onChange={(e) => setCompanyValues({ ...companyValues, phone: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-background border border-input text-sm text-foreground focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-muted-foreground">Website</label>
                    <input
                      type="text"
                      value={companyValues.website}
                      onChange={(e) => setCompanyValues({ ...companyValues, website: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-background border border-input text-sm text-foreground focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-muted-foreground">Base Currency</label>
                    <input
                      type="text"
                      value={companyValues.currency}
                      onChange={(e) => setCompanyValues({ ...companyValues, currency: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-background border border-input text-sm text-foreground focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-border">
                  <div className="space-y-3">
                    <label className="text-xs font-semibold text-foreground">Company Logo</label>
                    <div className="flex items-center gap-4">
                      {companyValues.logo_url && (
                        <img src={companyValues.logo_url.startsWith("http") ? companyValues.logo_url : `${getBaseUrl()}${companyValues.logo_url}`} alt="Logo" className="h-12 w-auto object-contain bg-slate-50 p-1 rounded border border-border" />
                      )}
                      <label className="cursor-pointer flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-border hover:bg-slate-100 rounded text-xs font-medium text-slate-700">
                        <UploadCloud className="h-4 w-4" /> Upload Logo
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'logo_url')} />
                      </label>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-xs font-semibold text-foreground">Authorized Signature</label>
                    <div className="flex items-center gap-4">
                      {companyValues.signature_url && (
                        <img src={companyValues.signature_url.startsWith("http") ? companyValues.signature_url : `${getBaseUrl()}${companyValues.signature_url}`} alt="Signature" className="h-12 w-auto object-contain bg-slate-50 p-1 rounded border border-border" />
                      )}
                      <label className="cursor-pointer flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-border hover:bg-slate-100 rounded text-xs font-medium text-slate-700">
                        <UploadCloud className="h-4 w-4" /> Upload Signature
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'signature_url')} />
                      </label>
                    </div>
                  </div>
                </div>

                <h3 className="text-sm font-bold text-foreground pt-4 pb-2 border-b border-border">Bank Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs text-muted-foreground">Bank Name</label>
                    <input
                      type="text"
                      value={companyValues.bankInfo.bankName}
                      onChange={(e) => setCompanyValues({ ...companyValues, bankInfo: { ...companyValues.bankInfo, bankName: e.target.value } })}
                      className="w-full px-3 py-2 rounded-lg bg-background border border-input text-sm text-foreground focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-muted-foreground">Account Name</label>
                    <input
                      type="text"
                      value={companyValues.bankInfo.accountName}
                      onChange={(e) => setCompanyValues({ ...companyValues, bankInfo: { ...companyValues.bankInfo, accountName: e.target.value } })}
                      className="w-full px-3 py-2 rounded-lg bg-background border border-input text-sm text-foreground focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs text-muted-foreground">Account Number</label>
                    <input
                      type="text"
                      value={companyValues.bankInfo.accountNumber}
                      onChange={(e) => setCompanyValues({ ...companyValues, bankInfo: { ...companyValues.bankInfo, accountNumber: e.target.value } })}
                      className="w-full px-3 py-2 rounded-lg bg-background border border-input text-sm text-foreground focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-muted-foreground">IBAN</label>
                    <input
                      type="text"
                      value={companyValues.bankInfo.iban}
                      onChange={(e) => setCompanyValues({ ...companyValues, bankInfo: { ...companyValues.bankInfo, iban: e.target.value } })}
                      className="w-full px-3 py-2 rounded-lg bg-background border border-input text-sm text-foreground focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-muted-foreground">SWIFT Code</label>
                    <input
                      type="text"
                      value={companyValues.bankInfo.swift}
                      onChange={(e) => setCompanyValues({ ...companyValues, bankInfo: { ...companyValues.bankInfo, swift: e.target.value } })}
                      className="w-full px-3 py-2 rounded-lg bg-background border border-input text-sm text-foreground focus:outline-none"
                    />
                  </div>
                </div>

                <h3 className="text-sm font-bold text-foreground pt-4 pb-2 border-b border-border">Document Defaults</h3>
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground">Invoice Terms & Notes</label>
                  <textarea
                    rows={3}
                    value={companyValues.notes}
                    onChange={(e) => setCompanyValues({ ...companyValues, notes: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-background border border-input text-sm text-foreground focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground">Invoice Footer</label>
                  <input
                    type="text"
                    value={companyValues.invoice_footer}
                    onChange={(e) => setCompanyValues({ ...companyValues, invoice_footer: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-background border border-input text-sm text-foreground focus:outline-none"
                    placeholder="e.g. Generated by EOMS Portal - Thank you for your business"
                  />
                </div>
              </div>
            )}

            {/* AI & SPEND TRACKER */}
            {activeTab === "ai" && (
              <div className="space-y-6 animate-fade-in">
                {/* AI Header & Controls */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
                  <div>
                    <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-brand-500" />
                      Google Gemini AI Token & Spend Telemetry
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Live tracking of multimodal API calls, token counts, INR cost, and spend cap protection.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={loadAiStats}
                      disabled={loadingAiStats}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-500/10 hover:bg-slate-500/20 text-foreground rounded-lg text-xs font-medium transition"
                    >
                      <RefreshCw className={cn("h-3.5 w-3.5", loadingAiStats && "animate-spin")} />
                      Refresh
                    </button>
                    <a
                      href="https://aistudio.google.com/spend"
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-500/10 hover:bg-brand-500/20 text-brand-600 dark:text-brand-400 rounded-lg text-xs font-semibold transition"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      AI Studio Spend
                    </a>
                  </div>
                </div>

                {/* Quota / Spend Cap Alert Banner if 429 errors exist */}
                {aiStats && aiStats.summary.quota_exceeded_requests > 0 && (
                  <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-3 text-xs text-amber-700 dark:text-amber-300">
                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-500" />
                    <div>
                      <p className="font-semibold">Spend Cap / 429 Quota Block Detected ({aiStats.summary.quota_exceeded_requests} blocked calls)</p>
                      <p className="mt-0.5 text-muted-foreground">
                        Your backend Circuit Breaker successfully intercepted these requests to protect your account. Ensure your billing spend cap in Google AI Studio is raised or unblocked.
                      </p>
                    </div>
                  </div>
                )}

                {/* Summary Metrics Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-4 bg-slate-500/5 border border-border rounded-xl space-y-1">
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Total Est. Spend</span>
                    <p className="text-xl font-bold text-foreground">₹{aiStats?.summary.total_cost_inr.toFixed(2) || "0.00"}</p>
                    <span className="text-[10px] text-muted-foreground block">~₹0.006 / 1k input tokens</span>
                  </div>

                  <div className="p-4 bg-slate-500/5 border border-border rounded-xl space-y-1">
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Total Tokens</span>
                    <p className="text-xl font-bold text-foreground">{aiStats?.summary.total_tokens.toLocaleString() || "0"}</p>
                    <span className="text-[10px] text-muted-foreground block">
                      In: {aiStats?.summary.total_prompt_tokens.toLocaleString() || 0} | Out: {aiStats?.summary.total_completion_tokens.toLocaleString() || 0}
                    </span>
                  </div>

                  <div className="p-4 bg-slate-500/5 border border-border rounded-xl space-y-1">
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Success Rate</span>
                    <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                      {aiStats?.summary.success_rate !== undefined ? `${aiStats.summary.success_rate}%` : "100%"}
                    </p>
                    <span className="text-[10px] text-muted-foreground block">
                      {aiStats?.summary.success_requests || 0} of {aiStats?.summary.total_requests || 0} calls
                    </span>
                  </div>

                  <div className="p-4 bg-slate-500/5 border border-border rounded-xl space-y-1">
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Active Engine</span>
                    <p className="text-sm font-bold text-brand-600 dark:text-brand-400 truncate mt-1">
                      {aiStats?.summary.active_model || "gemini-1.5-flash"}
                    </p>
                    <span className="text-[10px] text-muted-foreground block">Vision Cropping Enabled</span>
                  </div>
                </div>

                {/* Telemetry Request Logs Table */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Recent AI API Calls ({aiStats?.logs.length || 0})</h4>
                    <span className="text-[10px] text-muted-foreground">Showing latest 50 requests</span>
                  </div>

                  {loadingAiStats ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
                    </div>
                  ) : !aiStats || aiStats.logs.length === 0 ? (
                    <div className="p-8 text-center border border-dashed border-border rounded-xl">
                      <Cpu className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
                      <p className="text-xs text-muted-foreground">No AI API requests recorded yet.</p>
                      <p className="text-[10px] text-muted-foreground/80 mt-1">
                        Upload a ZIP package in the Projects workspace to see live per-file token usage and costs here.
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto border border-border rounded-xl">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-500/10 text-muted-foreground font-semibold border-b border-border">
                          <tr>
                            <th className="py-2.5 px-3">Timestamp</th>
                            <th className="py-2.5 px-3">File / Task</th>
                            <th className="py-2.5 px-3">Project / Sub</th>
                            <th className="py-2.5 px-3">Tokens (In / Out)</th>
                            <th className="py-2.5 px-3">Cost (INR)</th>
                            <th className="py-2.5 px-3">Status</th>
                            <th className="py-2.5 px-3">Latency</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {aiStats.logs.map((log) => (
                            <tr key={log.id} className="hover:bg-slate-500/5 transition">
                              <td className="py-2.5 px-3 text-muted-foreground whitespace-nowrap">
                                {new Date(log.created_at).toLocaleDateString()} {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                              </td>
                              <td className="py-2.5 px-3 font-medium text-foreground max-w-[180px] truncate" title={log.file_name}>
                                {log.file_name}
                              </td>
                              <td className="py-2.5 px-3 text-muted-foreground whitespace-nowrap">
                                {log.project_code || "—"} {log.submission_no ? `(${log.submission_no})` : ""}
                              </td>
                              <td className="py-2.5 px-3 text-muted-foreground whitespace-nowrap">
                                <span className="font-semibold text-foreground">{log.total_tokens.toLocaleString()}</span>
                                <span className="text-[10px] text-muted-foreground/70 ml-1">({log.prompt_tokens} / {log.completion_tokens})</span>
                              </td>
                              <td className="py-2.5 px-3 font-semibold text-foreground whitespace-nowrap">
                                ₹{log.cost_inr.toFixed(4)}
                              </td>
                              <td className="py-2.5 px-3 whitespace-nowrap">
                                {log.status === "SUCCESS" ? (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                                    Success
                                  </span>
                                ) : log.status === "QUOTA_EXCEEDED" ? (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-600 dark:text-amber-400" title={log.error_message || ""}>
                                    429 Quota Exceeded
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-500/15 text-red-600 dark:text-red-400" title={log.error_message || ""}>
                                    Error
                                  </span>
                                )}
                              </td>
                              <td className="py-2.5 px-3 text-muted-foreground whitespace-nowrap">
                                {log.latency_ms ? `${(log.latency_ms / 1000).toFixed(2)}s` : "—"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Save trigger (only for editable configuration tabs) */}
            {activeTab !== "ai" && (
              <div className="flex justify-end pt-4 border-t border-border mt-6">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-lg text-sm shadow-md transition-colors disabled:opacity-50"
                >
                  {saving ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Save Settings
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
