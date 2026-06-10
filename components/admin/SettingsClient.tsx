"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Settings,
  Palette,
  Bot,
  Mail,
  Sliders,
  CheckCircle,
  Loader2,
  Lock,
} from "lucide-react";

interface SettingsConfig {
  branding: {
    platformName: string;
    logoUrl: string;
    primaryColor: string;
    secondaryColor: string;
  };
  aiProviders: {
    openaiActive: boolean;
    anthropicActive: boolean;
    geminiActive: boolean;
    sarvamActive: boolean;
  };
  emailTemplates: {
    welcomeSubject: string;
    welcomeBody: string;
    alertSubject: string;
    alertBody: string;
  };
  notifications: {
    costSpikeThreshold: number;
    tokenLimitThreshold: number;
    syncFailureEmail: string;
  };
}

interface SettingsClientProps {
  initialConfig: SettingsConfig;
}

export default function SettingsClient({ initialConfig }: SettingsClientProps) {
  const router = useRouter();
  const [config, setConfig] = useState<SettingsConfig>(initialConfig);
  const [activeTab, setActiveTab] = useState<"branding" | "ai" | "email" | "thresholds">("branding");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState("");

  const handleTextChange = (section: keyof SettingsConfig, field: string, value: string | number) => {
    setConfig((prev) => ({
      ...prev,
      [section]: {
        ...(prev[section] as any),
        [field]: value,
      },
    }));
  };

  const handleToggleChange = (section: keyof SettingsConfig, field: string) => {
    setConfig((prev) => ({
      ...prev,
      [section]: {
        ...(prev[section] as any),
        [field]: !(prev[section] as any)[field],
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess("");

    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });

      if (res.ok) {
        setSaveSuccess("Configuration settings saved successfully!");
        router.refresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Platform Settings & Control</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Global controls for branding, mail templates, external AI gateways, and warning notifications.
          </p>
        </div>
        {saveSuccess && (
          <div className="p-2.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold text-xs flex items-center gap-1.5 animate-fade-in-scale">
            <CheckCircle className="w-4 h-4" />
            {saveSuccess}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Navigation Sidebar */}
        <div className="glass-card p-3 hover:transform-none flex flex-row lg:flex-col gap-1 overflow-x-auto lg:overflow-x-visible">
          {[
            { id: "branding", label: "Platform Branding", icon: Palette },
            { id: "ai", label: "AI Provider Gateways", icon: Bot },
            { id: "email", label: "Mail Templates", icon: Mail },
            { id: "thresholds", label: "Rule Thresholds", icon: Sliders },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  setSaveSuccess("");
                }}
                className={`flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-semibold rounded-lg text-left transition-colors cursor-pointer w-full shrink-0 ${
                  active
                    ? "bg-[var(--brand-purple)]/10 text-[var(--brand-purple)] border border-[var(--brand-purple)]/20"
                    : "text-[var(--text-secondary)] hover:text-white hover:bg-[var(--bg-glass-hover)] border border-transparent"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Configurations Form */}
        <div className="lg:col-span-3">
          <form onSubmit={handleSubmit} className="glass-card p-5 hover:transform-none space-y-6">
            {activeTab === "branding" && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-base font-bold text-[var(--text-primary)]">Platform Branding</h3>
                  <p className="text-xs text-[var(--text-tertiary)] mt-1">Configure client-facing system details and colors.</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="input-label">Platform Display Name</label>
                    <input
                      type="text"
                      value={config.branding.platformName}
                      onChange={(e) => handleTextChange("branding", "platformName", e.target.value)}
                      className="input-field !py-2 text-sm"
                      placeholder="e.g. AIAssist"
                      required
                    />
                  </div>
                  <div>
                    <label className="input-label">Logo Image URL</label>
                    <input
                      type="text"
                      value={config.branding.logoUrl}
                      onChange={(e) => handleTextChange("branding", "logoUrl", e.target.value)}
                      className="input-field !py-2 text-sm"
                      placeholder="/static/brand-logo.png"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="input-label">Primary Color Code</label>
                    <div className="flex gap-2.5">
                      <input
                        type="color"
                        value={config.branding.primaryColor}
                        onChange={(e) => handleTextChange("branding", "primaryColor", e.target.value)}
                        className="w-10 h-10 rounded bg-transparent border border-[var(--border-primary)] cursor-pointer"
                      />
                      <input
                        type="text"
                        value={config.branding.primaryColor}
                        onChange={(e) => handleTextChange("branding", "primaryColor", e.target.value)}
                        className="input-field !py-2 text-sm font-mono flex-1"
                        maxLength={7}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="input-label">Secondary Color Code</label>
                    <div className="flex gap-2.5">
                      <input
                        type="color"
                        value={config.branding.secondaryColor}
                        onChange={(e) => handleTextChange("branding", "secondaryColor", e.target.value)}
                        className="w-10 h-10 rounded bg-transparent border border-[var(--border-primary)] cursor-pointer"
                      />
                      <input
                        type="text"
                        value={config.branding.secondaryColor}
                        onChange={(e) => handleTextChange("branding", "secondaryColor", e.target.value)}
                        className="input-field !py-2 text-sm font-mono flex-1"
                        maxLength={7}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "ai" && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-base font-bold text-[var(--text-primary)]">AI Provider Gateways</h3>
                  <p className="text-xs text-[var(--text-tertiary)] mt-1">Activate or deactivate specific AI backend endpoints globally.</p>
                </div>
                <div className="space-y-3 pt-2">
                  {[
                    { id: "openaiActive", label: "OpenAI GPT Models Gateway", desc: "Powers GPT-4o, GPT-4o-mini client models." },
                    { id: "anthropicActive", label: "Anthropic Claude Models Gateway", desc: "Powers Claude 3.5 Sonnet, Claude 3.5 Haiku models." },
                    { id: "geminiActive", label: "Google Gemini Models Gateway", desc: "Powers Gemini 1.5 Pro, Flash client models." },
                    { id: "sarvamActive", label: "Sarvam AI Voice Gateway", desc: "Powers Hindi and regional TTS/STT consultation agents." },
                  ].map((prov) => (
                    <div
                      key={prov.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-primary)]"
                    >
                      <div>
                        <p className="text-sm font-semibold text-[var(--text-primary)]">{prov.label}</p>
                        <p className="text-xs text-[var(--text-tertiary)] mt-0.5">{prov.desc}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleToggleChange("aiProviders", prov.id)}
                        className={`w-12 h-6.5 rounded-full p-1 transition-colors cursor-pointer ${
                          (config.aiProviders as any)[prov.id] ? "bg-emerald-500" : "bg-[var(--bg-elevated)]"
                        }`}
                      >
                        <div
                          className={`w-4.5 h-4.5 rounded-full bg-white transition-transform ${
                            (config.aiProviders as any)[prov.id] ? "translate-x-5.5" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="p-3 border border-[var(--border-brand)] bg-purple-500/5 text-purple-400 text-xs rounded-lg flex items-center gap-2 mt-4">
                  <Lock className="w-5 h-5 shrink-0" />
                  API Keys for these providers are encrypted at database layer using AES-256 security protocols.
                </div>
              </div>
            )}

            {activeTab === "email" && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-base font-bold text-[var(--text-primary)]">Email Notification Templates</h3>
                  <p className="text-xs text-[var(--text-tertiary)] mt-1">Configure subjects and message templates for outgoing transactional mails.</p>
                </div>
                <div className="space-y-4 pt-2">
                  <div className="border border-[var(--border-primary)] rounded-lg p-4 bg-[var(--bg-tertiary)]/10 space-y-3">
                    <p className="text-xs font-semibold text-[var(--brand-purple)]">New Tenant Welcome Template</p>
                    <div>
                      <label className="text-[10px] text-[var(--text-tertiary)] mb-1 block">Subject</label>
                      <input
                        type="text"
                        value={config.emailTemplates.welcomeSubject}
                        onChange={(e) => handleTextChange("emailTemplates", "welcomeSubject", e.target.value)}
                        className="input-field !py-1.5 text-xs font-semibold"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-[var(--text-tertiary)] mb-1 block">Body Message</label>
                      <textarea
                        value={config.emailTemplates.welcomeBody}
                        onChange={(e) => handleTextChange("emailTemplates", "welcomeBody", e.target.value)}
                        className="input-field !py-1.5 text-xs font-mono h-24 resize-none leading-normal"
                      />
                    </div>
                  </div>

                  <div className="border border-[var(--border-primary)] rounded-lg p-4 bg-[var(--bg-tertiary)]/10 space-y-3">
                    <p className="text-xs font-semibold text-[var(--brand-purple)]">Security Alert Template</p>
                    <div>
                      <label className="text-[10px] text-[var(--text-tertiary)] mb-1 block">Subject</label>
                      <input
                        type="text"
                        value={config.emailTemplates.alertSubject}
                        onChange={(e) => handleTextChange("emailTemplates", "alertSubject", e.target.value)}
                        className="input-field !py-1.5 text-xs font-semibold"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-[var(--text-tertiary)] mb-1 block">Body Message</label>
                      <textarea
                        value={config.emailTemplates.alertBody}
                        onChange={(e) => handleTextChange("emailTemplates", "alertBody", e.target.value)}
                        className="input-field !py-1.5 text-xs font-mono h-24 resize-none leading-normal"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "thresholds" && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-base font-bold text-[var(--text-primary)]">Rule Warning Thresholds</h3>
                  <p className="text-xs text-[var(--text-tertiary)] mt-1">Configure criteria thresholds for launching system notification warnings.</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="input-label">Cost Spike Trigger Threshold ($)</label>
                    <input
                      type="number"
                      value={config.notifications.costSpikeThreshold}
                      onChange={(e) => handleTextChange("notifications", "costSpikeThreshold", parseFloat(e.target.value))}
                      className="input-field !py-2 text-sm"
                      placeholder="e.g. 50"
                      required
                    />
                  </div>
                  <div>
                    <label className="input-label">Token Allocation Warning Limit (%)</label>
                    <input
                      type="number"
                      value={config.notifications.tokenLimitThreshold}
                      onChange={(e) => handleTextChange("notifications", "tokenLimitThreshold", parseInt(e.target.value))}
                      className="input-field !py-2 text-sm"
                      placeholder="e.g. 90"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="input-label">Sync Failures Warning Email</label>
                  <input
                    type="email"
                    value={config.notifications.syncFailureEmail}
                    onChange={(e) => handleTextChange("notifications", "syncFailureEmail", e.target.value)}
                    className="input-field !py-2 text-sm"
                    placeholder="e.g. operations@aiassist.com"
                    required
                  />
                </div>
              </div>
            )}

            {/* Actions button */}
            <div className="flex items-center justify-end gap-3 border-t border-[var(--border-primary)] pt-5 mt-6">
              <button
                type="submit"
                disabled={isSaving}
                className="btn-primary text-sm py-2.5 px-8 flex items-center justify-center shrink-0 w-full sm:w-auto"
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Save Platform Settings"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
