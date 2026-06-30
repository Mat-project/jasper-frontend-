"use client";

import { useState, useEffect } from "react";
import { getSystemSettings, updateSystemSetting, createSystemSetting } from "@/lib/api/settings";
import { Settings, ShieldAlert, Users2, Save, CheckCircle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"general" | "user" | "security">("general");
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

            {/* USER SETTINGS */}
            {activeTab === "user" && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-foreground pb-2 border-b border-border">User Controls</h3>

                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-500/5 border border-border">
                  <div>
                    <span className="text-xs font-semibold text-foreground block">Allow Public Registrations</span>
                    <span className="text-[10px] text-muted-foreground">Toggle open signups from the login panel</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={userValues.allowRegistration}
                    onChange={(e) => setUserValues({ ...userValues, allowRegistration: e.target.checked })}
                    className="rounded border-input text-brand-500 focus:ring-brand-500 h-4 w-4 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-500/5 border border-border">
                  <div>
                    <span className="text-xs font-semibold text-foreground block">Verify Email Activation</span>
                    <span className="text-[10px] text-muted-foreground">Require new users to activate email addresses</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={userValues.requireEmailVerification}
                    onChange={(e) => setUserValues({ ...userValues, requireEmailVerification: e.target.checked })}
                    className="rounded border-input text-brand-500 focus:ring-brand-500 h-4 w-4 cursor-pointer"
                  />
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
