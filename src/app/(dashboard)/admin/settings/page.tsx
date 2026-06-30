"use client";

import { useState, useEffect } from "react";
import { mockService } from "@/lib/api/mockService";
import { SystemSettings } from "@/types/admin";
import {
  Settings,
  ShieldAlert,
  Users2,
  Save,
  CheckCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [activeTab, setActiveTab] = useState<"general" | "user" | "security">("general");
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    setSettings(mockService.getSettings());
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    mockService.saveSettings(settings);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  if (!settings) return null;

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">System Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Configure default layout, registration capabilities, user controls, and session parameters.
          </p>
        </div>
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
                <span>Settings saved successfully!</span>
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
                    value={settings.general.siteName}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        general: { ...settings.general, siteName: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-background border border-input text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground">Support Contact Email</label>
                  <input
                    type="email"
                    value={settings.general.contactEmail}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        general: { ...settings.general, contactEmail: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-background border border-input text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground">Tables Page Size Limit</label>
                  <input
                    type="number"
                    min={5}
                    max={100}
                    value={settings.general.rowsPerPage}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        general: { ...settings.general, rowsPerPage: parseInt(e.target.value) || 10 },
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-background border border-input text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
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
                    checked={settings.user.allowRegistration}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        user: { ...settings.user, allowRegistration: e.target.checked },
                      })
                    }
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
                    checked={settings.user.requireEmailVerification}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        user: { ...settings.user, requireEmailVerification: e.target.checked },
                      })
                    }
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
                    value={settings.security.passwordMinLength}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        security: { ...settings.security, passwordMinLength: parseInt(e.target.value) || 8 },
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-background border border-input text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground">Session Timeout (Minutes)</label>
                  <input
                    type="number"
                    min={5}
                    value={settings.security.sessionTimeoutMinutes}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        security: { ...settings.security, sessionTimeoutMinutes: parseInt(e.target.value) || 30 },
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-background border border-input text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-500/5 border border-border">
                  <div>
                    <span className="text-xs font-semibold text-foreground block">Force MFA Authentication</span>
                    <span className="text-[10px] text-muted-foreground">Mandate multi-factor setup on all logins</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.security.mfaRequired}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        security: { ...settings.security, mfaRequired: e.target.checked },
                      })
                    }
                    className="rounded border-input text-brand-500 focus:ring-brand-500 h-4 w-4 cursor-pointer"
                  />
                </div>
              </div>
            )}

            {/* Save trigger */}
            <div className="flex justify-end pt-4 border-t border-border mt-6">
              <button
                type="submit"
                className="flex items-center gap-1.5 px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-lg text-sm shadow-md transition-colors"
              >
                <Save className="h-4 w-4" />
                Save Settings
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
