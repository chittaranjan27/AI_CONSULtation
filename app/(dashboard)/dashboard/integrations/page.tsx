"use client";

import React, { useState, useEffect } from "react";
import { Search, Plug, X, Loader2, Check, Settings, AlertCircle, ExternalLink } from "lucide-react";

interface DBIntegration {
  id: string;
  type: string;
  name: string;
  config: any;
  isActive: boolean;
}

const AVAILABLE_INTEGRATIONS = [
  { 
    type: "OPENAI", 
    name: "OpenAI", 
    category: "AI Provider", 
    color: "#10a37f",
    description: "Provide key for embeddings search and standard model backups.",
    fields: [
      { key: "apiKey", label: "OpenAI API Key", type: "password", placeholder: "sk-proj-..." }
    ]
  },
  { 
    type: "ANTHROPIC", 
    name: "Anthropic", 
    category: "AI Provider", 
    color: "#d4a27f",
    description: "Connect Claude models for advanced intake workflows.",
    fields: [
      { key: "apiKey", label: "Anthropic API Key", type: "password", placeholder: "sk-ant-..." }
    ]
  },
  { 
    type: "HUBSPOT", 
    name: "HubSpot", 
    category: "CRM", 
    color: "#ff7a59",
    description: "Automatically sync qualified leads directly into your HubSpot contact pipelines.",
    fields: [
      { key: "accessToken", label: "Private App Access Token", type: "password", placeholder: "pat-na1-..." },
      { key: "portalId", label: "HubSpot Portal ID", type: "text", placeholder: "1234567" }
    ]
  },
  { 
    type: "GOOGLE_SHEETS", 
    name: "Google Sheets", 
    category: "Data", 
    color: "#34a853",
    description: "Export lead contact details and diagnostic logs into active spreadsheets.",
    fields: [
      { key: "spreadsheetId", label: "Spreadsheet ID", type: "text", placeholder: "1Y4... (from Google Sheet URL)" },
      { key: "sheetName", label: "Sheet Tab Name", type: "text", placeholder: "Leads" }
    ]
  },
  { 
    type: "CALENDLY", 
    name: "Calendly", 
    category: "Calendar", 
    color: "#006bff",
    description: "Let users schedule face-to-face consultations with expert wellness advisors.",
    fields: [
      { key: "apiKey", label: "Calendly Personal Token", type: "password", placeholder: "c_..." },
      { key: "eventUrl", label: "Calendly Profile / Event Link", type: "text", placeholder: "https://calendly.com/your-org/consultation" }
    ]
  },
  { 
    type: "SLACK", 
    name: "Slack", 
    category: "Messaging", 
    color: "#4a154b",
    description: "Alert support agents in real time via Slack channels when human handoff is triggered.",
    fields: [
      { key: "webhookUrl", label: "Incoming Webhook URL", type: "password", placeholder: "https://hooks.slack.com/services/..." }
    ]
  },
  { 
    type: "ZAPIER", 
    name: "Zapier", 
    category: "Automation", 
    color: "#ff4f00",
    description: "Connect webhook events to trigger thousands of automated app processes.",
    fields: [
      { key: "webhookUrl", label: "Zapier Catch Webhook URL", type: "text", placeholder: "https://hooks.zapier.com/hooks/catch/..." }
    ]
  },
  { 
    type: "STRIPE", 
    name: "Stripe", 
    category: "Billing", 
    color: "#635bff",
    description: "Securely collect payments and manage patient subscription memberships.",
    fields: [
      { key: "secretKey", label: "Secret API Key", type: "password", placeholder: "sk_test_..." },
      { key: "publishableKey", label: "Publishable Key", type: "text", placeholder: "pk_test_..." }
    ]
  },
];

export default function IntegrationsPage() {
  const [dbIntegrations, setDbIntegrations] = useState<DBIntegration[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedInt, setSelectedInt] = useState<any>(null);
  const [modalFormData, setModalFormData] = useState<Record<string, string>>({});
  const [isSubmitLoading, setIsSubmitLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Load active integrations from API
  const fetchIntegrations = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/integrations");
      if (res.ok) {
        const data = await res.json();
        setDbIntegrations(data);
      }
    } catch (error) {
      console.error("Failed to load integrations:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const getIntegrationState = (type: string) => {
    const found = dbIntegrations.find((di) => di.type === type);
    if (!found) return { status: "disconnected", isActive: false, config: {} };
    return {
      status: found.isActive ? "connected" : "paused",
      isActive: found.isActive,
      config: found.config || {},
    };
  };

  const handleOpenConfigure = (int: any) => {
    const state = getIntegrationState(int.type);
    setSelectedInt(int);
    setErrorMsg(null);
    setSaveSuccess(false);
    
    // Pre-populate fields with existing config
    const initialForm: Record<string, string> = {};
    int.fields.forEach((f: any) => {
      initialForm[f.key] = state.config[f.key] || "";
    });
    setModalFormData(initialForm);
  };

  const handleCloseModal = () => {
    setSelectedInt(null);
    setModalFormData({});
    setErrorMsg(null);
  };

  const handleFieldChange = (key: string, value: string) => {
    setModalFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSaveIntegration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInt) return;

    setIsSubmitLoading(true);
    setErrorMsg(null);

    // Validate that all fields have values
    const missing = selectedInt.fields.some((f: any) => !modalFormData[f.key]?.trim());
    if (missing) {
      setErrorMsg("All configuration fields are required.");
      setIsSubmitLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: selectedInt.type,
          name: selectedInt.name,
          config: modalFormData,
          isActive: true,
        }),
      });

      if (res.ok) {
        setSaveSuccess(true);
        await fetchIntegrations();
        setTimeout(() => {
          handleCloseModal();
        }, 1500);
      } else {
        setErrorMsg("Failed to configure integration. Please try again.");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Connection error. Check settings and retry.");
    } finally {
      setIsSubmitLoading(false);
    }
  };

  const handleToggleDisconnect = async (type: string, name: string) => {
    const existing = dbIntegrations.find((di) => di.type === type);
    if (!existing) return;

    if (!confirm(`Are you sure you want to disconnect ${name}?`)) return;

    try {
      const res = await fetch("/api/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          name,
          config: existing.config,
          isActive: false, // Disconnected
        }),
      });

      if (res.ok) {
        await fetchIntegrations();
      }
    } catch (error) {
      console.error("Error toggling integration status:", error);
    }
  };

  const filteredIntegrations = AVAILABLE_INTEGRATIONS.filter((int) =>
    int.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    int.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Integrations</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Synchronize consultation leads, configure real-time notification warnings, and manage billing pipelines.
        </p>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-primary)] max-w-md focus-within:border-[var(--brand-purple)]/60 transition-all">
        <Search className="w-4 h-4 text-[var(--text-muted)]" />
        <input
          type="text"
          placeholder="Search integrations by name or category..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="bg-transparent text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none flex-1"
        />
      </div>

      {/* Grid List */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--brand-purple)]" />
          <p className="text-xs text-[var(--text-muted)]">Loading integration modules...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredIntegrations.map((int) => {
            const state = getIntegrationState(int.type);
            return (
              <div 
                key={int.type} 
                className={`glass-card p-5 hover:transform-none flex flex-col justify-between border transition-all ${
                  state.status === "connected" 
                    ? "border-[var(--brand-purple)]/20 shadow-[0_0_15px_rgba(139,92,246,0.02)]" 
                    : "border-[var(--border-primary)]"
                }`}
              >
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold shadow-inner"
                      style={{ background: `${int.color}15`, color: int.color, border: `1px solid ${int.color}25` }}
                    >
                      {int.name[0]}
                    </div>
                    <span 
                      className={`text-[8px] font-bold px-2 py-0.5 rounded-full ${
                        state.status === "connected" 
                          ? "badge-emerald" 
                          : "badge-blue"
                      }`}
                    >
                      {state.status.toUpperCase()}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-[var(--text-primary)]">{int.name}</h3>
                  <span className="text-[9px] font-bold text-[var(--brand-purple)] uppercase tracking-wide block mt-0.5">{int.category}</span>
                  <p className="text-[11px] text-[var(--text-tertiary)] mt-2.5 leading-relaxed">{int.description}</p>
                </div>
                
                <div className="mt-6 space-y-2">
                  <button 
                    onClick={() => handleOpenConfigure(int)}
                    className="w-full text-xs py-2.5 rounded-lg font-semibold transition-all btn-primary"
                  >
                    {state.status === "connected" ? "Configure Settings" : "Connect Tool"}
                  </button>
                  {state.status === "connected" && (
                    <button 
                      onClick={() => handleToggleDisconnect(int.type, int.name)}
                      className="w-full text-xs py-2 rounded-lg font-medium bg-red-500/10 border border-red-500/15 text-red-400 hover:bg-red-500/15 transition-all"
                    >
                      Disconnect
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Configuration Modal */}
      {selectedInt && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--bg-elevated)] border border-[var(--border-primary)] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-[var(--border-primary)]">
              <div className="flex items-center gap-2">
                <Plug className="w-4.5 h-4.5" style={{ color: selectedInt.color }} />
                <h2 className="text-sm font-bold text-[var(--text-primary)]">
                  Configure {selectedInt.name}
                </h2>
              </div>
              <button 
                onClick={handleCloseModal}
                className="p-1.5 rounded hover:bg-[var(--bg-glass-hover)] text-[var(--text-muted)] hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveIntegration} className="p-4 space-y-4">
              <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                {selectedInt.description}
              </p>

              {errorMsg && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {saveSuccess && (
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 shrink-0" />
                  <span>Configuration saved successfully!</span>
                </div>
              )}

              <div className="space-y-3.5">
                {selectedInt.fields.map((f: any) => (
                  <div key={f.key} className="space-y-1.5">
                    <label className="text-[10px] font-semibold block text-[var(--text-secondary)]">
                      {f.label} *
                    </label>
                    <input
                      type={f.type}
                      required
                      placeholder={f.placeholder}
                      value={modalFormData[f.key] || ""}
                      onChange={(e) => handleFieldChange(f.key, e.target.value)}
                      className="w-full px-3 py-2 rounded-xl text-xs bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-[var(--text-primary)] outline-none focus:border-[var(--brand-purple)] focus:ring-2 focus:ring-[var(--brand-purple)]/20 transition-all"
                    />
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--border-primary)]">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-3.5 py-1.5 rounded-xl border border-[var(--border-primary)] hover:bg-[var(--bg-glass-hover)] text-xs font-semibold text-[var(--text-secondary)] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitLoading || saveSuccess}
                  className="btn-primary text-xs py-1.5 px-4 flex items-center gap-1.5 cursor-pointer"
                >
                  {isSubmitLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Saving...
                    </>
                  ) : saveSuccess ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      Connected!
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      Save Configuration
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
