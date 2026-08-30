"use client";

import { useState, useEffect } from "react";
import { getSystemSettings, updateSystemSetting, createSystemSetting, uploadCompanyFile } from "@/lib/api/settings";
import { getBaseUrl } from "@/lib/api/client";
import { Settings, ShieldAlert, Users2, Save, CheckCircle, RefreshCw, Building2, UploadCloud } from "lucide-react";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"general" | "user" | "security" | "company">("general");
  const [isSaved, setIsSaved] = useState(false);

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

  useEffect(() => {
    loadSettings();
  }, []);

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
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-foreground tracking-tight">System Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Configure security baselines, user registration policies, and generic application parameters.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Left tabs links */}
        <div className="md:col-span-1 flex flex-row md:flex-col gap-1 bg-slate-500/5 p-1.5 rounded-xl border border-border h-fit">
          {[
            { id: "general" as const, label: "General", icon: Settings },
            { id: "company" as const, label: "Company Profile", icon: Building2 },
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

            {/* Save trigger */}
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
          </form>
        </div>
      </div>
    </div>
  );
}
