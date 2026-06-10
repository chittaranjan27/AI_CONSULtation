"use client";

import { useState, useEffect } from "react";
import {
  Settings as SettingsIcon,
  User,
  Building2,
  CreditCard,
  Shield,
  Bell,
  Key,
  Globe,
  Palette,
  ArrowLeft,
  Loader2,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
  Trash2,
  Lock,
  Users,
  UserPlus,
  Mail,
} from "lucide-react";

type SettingsSection = "profile" | "workspace" | "api-keys" | "security" | "notifications" | "languages" | "appearance" | "team";

interface ApiKeyData {
  id: string;
  provider: string;
  label: string | null;
  isActive: boolean;
  encryptedKey: string;
}

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState<SettingsSection | null>(null);
  
  // Loading states
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Profile fields
  const [profileName, setProfileName] = useState("");
  const [profileEmail, setProfileEmail] = useState("");

  // Security fields
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Password visibility states
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Workspace fields
  const [workspaceName, setWorkspaceName] = useState("");
  const [workspaceSlug, setWorkspaceSlug] = useState("");
  const [workspacePlan, setWorkspacePlan] = useState("FREE");

  // API Keys state
  const [apiKeys, setApiKeys] = useState<ApiKeyData[]>([]);
  const [newKeys, setNewKeys] = useState<Record<string, string>>({
    GEMINI: "",
    OPENAI: "",
    ANTHROPIC: "",
    GROQ: "",
    OPENROUTER: "",
  });
  const [showKeyField, setShowKeyField] = useState<Record<string, boolean>>({});

  // Notifications state
  const [notifyLead, setNotifyLead] = useState(true);
  const [notifyDigest, setNotifyDigest] = useState(false);
  const [notifyTokens, setNotifyTokens] = useState(true);

  // Languages state
  const [defaultLang, setDefaultLang] = useState("en");

  // Appearance state
  const [accentColor, setAccentColor] = useState("purple");
  const [uiScale, setUiScale] = useState("default");

  // Team states
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [pendingInvites, setPendingInvites] = useState<any[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("SUPPORT_AGENT");
  const [isInviting, setIsInviting] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Load current user profile on page mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch("/api/tenant/profile");
        if (res.ok) {
          const data = await res.json();
          setCurrentUser(data);
        }
      } catch (err) {
        console.error("Failed to load user profile:", err);
      }
    };
    fetchProfile();
  }, []);

  const fetchTeamData = async () => {
    try {
      const [membersRes, invitesRes] = await Promise.all([
        fetch("/api/tenant/team"),
        fetch("/api/tenant/invitations"),
      ]);
      if (membersRes.ok) {
        const membersData = await membersRes.json();
        setTeamMembers(membersData);
      }
      if (invitesRes.ok) {
        const invitesData = await invitesRes.json();
        setPendingInvites(invitesData);
      }
    } catch (err) {
      console.error("Failed to fetch team data:", err);
      setErrorMsg("Failed to load workspace team records.");
    }
  };

  // Fetch initial data based on active section
  useEffect(() => {
    if (!activeSection) return;
    setErrorMsg(null);
    setSuccessMsg(null);

    const loadData = async () => {
      // Direct access RBAC validation
      if (currentUser) {
        const role = currentUser.role;
        if (activeSection === "api-keys" && role !== "TENANT_OWNER" && role !== "SUPER_ADMIN") {
          setActiveSection(null);
          return;
        }
        if ((activeSection === "team" || activeSection === "workspace") && role !== "TENANT_OWNER" && role !== "MANAGER" && role !== "SUPER_ADMIN") {
          setActiveSection(null);
          return;
        }
      }

      setLoading(true);
      try {
        if (activeSection === "team") {
          await fetchTeamData();
        } else if (activeSection === "profile" || activeSection === "security") {
          const res = await fetch("/api/tenant/profile");
          if (res.ok) {
            const data = await res.json();
            setProfileName(data.name || "");
            setProfileEmail(data.email || "");
          }
        } else if (activeSection === "workspace") {
          const res = await fetch("/api/tenant/settings");
          if (res.ok) {
            const data = await res.json();
            setWorkspaceName(data.name || "");
            setWorkspaceSlug(data.slug || "");
            setWorkspacePlan(data.plan || "FREE");
          }
        } else if (activeSection === "api-keys") {
          await fetchApiKeys();
        } else if (activeSection === "notifications" || activeSection === "languages" || activeSection === "appearance") {
          const res = await fetch("/api/tenant/settings");
          if (res.ok) {
            const data = await res.json();
            const configSettings = data.settings || {};
            const configBranding = data.branding || {};
            
            // Set notification checkboxes
            if (configSettings.notifications) {
              setNotifyLead(configSettings.notifications.leadCaptured ?? true);
              setNotifyDigest(configSettings.notifications.dailyDigest ?? false);
              setNotifyTokens(configSettings.notifications.tokenThreshold ?? true);
            }
            // Set language dropdown
            if (configSettings.defaultLanguage) {
              setDefaultLang(configSettings.defaultLanguage);
            }
            // Set appearance preferences
            if (configBranding.accentColor) {
              setAccentColor(configBranding.accentColor);
            }
            if (configBranding.uiScale) {
              setUiScale(configBranding.uiScale);
            }
          }
        }
      } catch (err) {
        console.error("Failed to load settings data:", err);
        setErrorMsg("Failed to load settings data. Please refresh and try again.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [activeSection]);

  const fetchApiKeys = async () => {
    try {
      const res = await fetch("/api/tenant/api-keys");
      if (res.ok) {
        const data = await res.json();
        setApiKeys(data);
      }
    } catch (err) {
      console.error("Failed to load api keys:", err);
    }
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch("/api/tenant/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: profileName, email: profileEmail }),
      });

      if (res.ok) {
        setSuccessMsg("Profile details updated successfully!");
      } else {
        const txt = await res.text();
        setErrorMsg(txt || "Failed to update profile details.");
      }
    } catch {
      setErrorMsg("A network error occurred. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleSecuritySave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setErrorMsg("New passwords do not match.");
      return;
    }

    setSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch("/api/tenant/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      if (res.ok) {
        setSuccessMsg("Password updated successfully!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setShowCurrentPassword(false);
        setShowNewPassword(false);
        setShowConfirmPassword(false);
      } else {
        const txt = await res.text();
        setErrorMsg(txt || "Failed to update password. Verify current password.");
      }
    } catch {
      setErrorMsg("A network error occurred. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleWorkspaceSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch("/api/tenant/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: workspaceName }),
      });

      if (res.ok) {
        setSuccessMsg("Workspace settings updated successfully!");
      } else {
        const txt = await res.text();
        setErrorMsg(txt || "Failed to update workspace settings.");
      }
    } catch {
      setErrorMsg("A network error occurred. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveApiKey = async (provider: string) => {
    const keyVal = newKeys[provider]?.trim();
    if (!keyVal) return;

    setSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch("/api/tenant/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, apiKey: keyVal }),
      });

      if (res.ok) {
        setSuccessMsg(`${provider} API key saved successfully!`);
        setNewKeys((prev) => ({ ...prev, [provider]: "" }));
        await fetchApiKeys();
      } else {
        const txt = await res.text();
        setErrorMsg(txt || `Failed to save ${provider} API key.`);
      }
    } catch {
      setErrorMsg("A network error occurred. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteApiKey = async (provider: string) => {
    if (!confirm(`Are you sure you want to disconnect and delete your ${provider} API key?`)) return;

    setSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch(`/api/tenant/api-keys?provider=${provider.toLowerCase()}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setSuccessMsg(`${provider} API key removed.`);
        await fetchApiKeys();
      } else {
        const txt = await res.text();
        setErrorMsg(txt || `Failed to delete ${provider} API key.`);
      }
    } catch {
      setErrorMsg("A network error occurred. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleNotificationsSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch("/api/tenant/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          settings: {
            notifications: {
              leadCaptured: notifyLead,
              dailyDigest: notifyDigest,
              tokenThreshold: notifyTokens,
            },
          },
        }),
      });

      if (res.ok) {
        setSuccessMsg("Notification preferences updated!");
      } else {
        setErrorMsg("Failed to update notification preferences.");
      }
    } catch {
      setErrorMsg("A network error occurred. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleLanguagesSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch("/api/tenant/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          settings: {
            defaultLanguage: defaultLang,
          },
        }),
      });

      if (res.ok) {
        setSuccessMsg("Default language preference saved!");
      } else {
        setErrorMsg("Failed to save language preferences.");
      }
    } catch {
      setErrorMsg("A network error occurred.");
    } finally {
      setSaving(false);
    }
  };

  const handleAppearanceSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch("/api/tenant/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          branding: {
            accentColor,
            uiScale,
          },
        }),
      });

      if (res.ok) {
        setSuccessMsg("Appearance options saved successfully!");
      } else {
        setErrorMsg("Failed to save appearance details.");
      }
    } catch {
      setErrorMsg("A network error occurred.");
    } finally {
      setSaving(false);
    }
  };

  // Team handlers
  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setIsInviting(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const res = await fetch("/api/tenant/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMsg("Invitation sent successfully!");
        setInviteEmail("");
        await fetchTeamData();
      } else {
        setErrorMsg(data.error || "Failed to send invitation.");
      }
    } catch {
      setErrorMsg("Failed to connect to invitation server.");
    } finally {
      setIsInviting(false);
    }
  };

  const handleRevokeInvite = async (inviteId: string) => {
    if (!confirm("Are you sure you want to revoke this invitation?")) return;
    setActionLoadingId(inviteId);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const res = await fetch(`/api/tenant/invitations/${inviteId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setSuccessMsg("Invitation revoked successfully.");
        await fetchTeamData();
      } else {
        const data = await res.json();
        setErrorMsg(data.error || "Failed to revoke invitation.");
      }
    } catch {
      setErrorMsg("Failed to connect to server.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleUpdateMemberRole = async (userId: string, newRole: string) => {
    setActionLoadingId(userId);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const res = await fetch("/api/tenant/team", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role: newRole }),
      });
      if (res.ok) {
        setSuccessMsg("User role updated successfully.");
        await fetchTeamData();
      } else {
        const data = await res.json();
        setErrorMsg(data.error || "Failed to update member role.");
      }
    } catch {
      setErrorMsg("Connection error.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleToggleMemberStatus = async (userId: string, currentActive: boolean) => {
    setActionLoadingId(userId);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const res = await fetch("/api/tenant/team", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, isActive: !currentActive }),
      });
      if (res.ok) {
        setSuccessMsg(`User account ${!currentActive ? "activated" : "deactivated"} successfully.`);
        await fetchTeamData();
      } else {
        const data = await res.json();
        setErrorMsg(data.error || "Failed to toggle status.");
      }
    } catch {
      setErrorMsg("Connection error.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeleteMember = async (userId: string, name: string) => {
    if (!confirm(`Are you sure you want to remove ${name} from this workspace?`)) return;
    setActionLoadingId(userId);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const res = await fetch(`/api/tenant/team?userId=${userId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setSuccessMsg("Team member removed successfully.");
        await fetchTeamData();
      } else {
        const data = await res.json();
        setErrorMsg(data.error || "Failed to remove member.");
      }
    } catch {
      setErrorMsg("Connection error.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const menuSections = [
    { key: "profile", label: "Profile", desc: "Update your name, email, and personal information", icon: User },
    { key: "workspace", label: "Workspace", desc: "Customize workspace name, URL slug, and plan features", icon: Building2 },
    { key: "team", label: "Team", desc: "Invite colleagues and configure workspace roles & access", icon: Users },
    { key: "api-keys", label: "API Keys", desc: "Configure and manage secure LLM provider API credentials", icon: Key },
    { key: "security", label: "Security", desc: "Reset account passwords and configure login credentials", icon: Shield },
    { key: "notifications", label: "Notifications", desc: "Manage alerts, daily digests, and token warnings", icon: Bell },
    { key: "languages", label: "Languages", desc: "Configure default system language settings", icon: Globe },
    { key: "appearance", label: "Appearance", desc: "Customize dashboard layout theme and interface styles", icon: Palette },
  ] as const;

  const filteredMenuSections = menuSections.filter((section) => {
    if (!currentUser) return true;
    const role = currentUser.role;
    if (role === "SUPPORT_AGENT" || role === "ANALYST") {
      return section.key === "profile" || section.key === "security";
    }
    if (role === "MANAGER") {
      return section.key !== "api-keys";
    }
    return true;
  });

  // Render Header Info
  const renderHeader = (title: string, desc: string) => (
    <div className="flex items-center justify-between border-b border-[var(--border-primary)] pb-5 mb-6">
      <div className="space-y-1">
        <h2 className="text-xl font-bold text-[var(--text-primary)]">{title}</h2>
        <p className="text-sm text-[var(--text-secondary)]">{desc}</p>
      </div>
      <button
        onClick={() => {
          setActiveSection(null);
          setErrorMsg(null);
          setSuccessMsg(null);
        }}
        className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-primary)] text-[var(--text-secondary)] hover:text-white hover:bg-[var(--bg-glass-hover)] transition-all cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Alert Banners */}
      {successMsg && (
        <div className="flex items-start gap-3 p-4.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-sm animate-fade-in-scale">
          <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>{successMsg}</div>
        </div>
      )}
      {errorMsg && (
        <div className="flex items-start gap-3 p-4.5 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 text-sm animate-fade-in-scale">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>{errorMsg}</div>
        </div>
      )}

      {activeSection === null ? (
        <>
          {/* Main settings grid */}
          <div>
            <h1 className="text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">Settings</h1>
            <p className="text-base text-[var(--text-secondary)] mt-1.5">Manage your user profile, workspace preferences, and external integrations.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-6">
            {filteredMenuSections.map((section) => {
              const Icon = section.icon;
              return (
                <div
                  key={section.key}
                  onClick={() => setActiveSection(section.key)}
                  className="glass-card p-6 cursor-pointer group hover:transform-none hover:border-purple-500/30 flex items-start gap-4.5 transition-all"
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-[var(--border-primary)] flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                    <Icon className="w-6 h-6 text-[var(--brand-purple)]" />
                  </div>
                  <div className="space-y-1 min-w-0">
                    <h3 className="text-base font-bold text-[var(--text-primary)] group-hover:text-[var(--brand-purple)] transition-colors">
                      {section.label}
                    </h3>
                    <p className="text-sm text-[var(--text-tertiary)] leading-relaxed">
                      {section.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <div className="glass-card p-5 sm:p-8 hover:transform-none hover:border-[var(--border-primary)]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="w-8 h-8 text-[var(--brand-purple)] animate-spin" />
              <span className="text-sm text-[var(--text-secondary)] font-medium">Loading settings...</span>
            </div>
          ) : (
            <>
              {/* Profile Form */}
              {activeSection === "profile" && (
                <form onSubmit={handleProfileSave} className="space-y-5">
                  {renderHeader("Profile Details", "Update your personal credentials and communication data.")}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <label className="input-label">Full Name</label>
                      <input
                        type="text"
                        required
                        value={profileName}
                        onChange={(e) => setProfileName(e.target.value)}
                        className="input-field"
                        placeholder="e.g. Admin User"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="input-label">Email Address</label>
                      <input
                        type="email"
                        required
                        value={profileEmail}
                        onChange={(e) => setProfileEmail(e.target.value)}
                        className="input-field"
                        placeholder="admin@brahmagraha.ai"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end pt-3">
                    <button
                      type="submit"
                      disabled={saving}
                      className="btn-primary"
                    >
                      {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                      Save Profile
                    </button>
                  </div>
                </form>
              )}

              {/* Workspace Form */}
              {activeSection === "workspace" && (
                <form onSubmit={handleWorkspaceSave} className="space-y-5">
                  {renderHeader("Workspace Configuration", "Manage your workspace settings and tenant values.")}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <label className="input-label">Workspace Name</label>
                      <input
                        type="text"
                        required
                        value={workspaceName}
                        onChange={(e) => setWorkspaceName(e.target.value)}
                        className="input-field"
                        placeholder="e.g. My Organization"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="input-label">URL Slug (Immutable)</label>
                      <input
                        type="text"
                        disabled
                        value={workspaceSlug}
                        className="input-field opacity-60 cursor-not-allowed bg-[var(--bg-tertiary)]"
                      />
                    </div>
                  </div>

                  <div className="p-4.5 rounded-xl bg-purple-500/5 border border-[var(--border-primary)] space-y-2">
                    <h4 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
                      Active Account Tier: 
                      <span className="badge badge-purple text-xs font-bold">{workspacePlan}</span>
                    </h4>
                    <p className="text-xs text-[var(--text-tertiary)] leading-relaxed">
                      Your tier determines monthly token limits, active chatbot capacities, and vector storage caps.
                    </p>
                  </div>

                  <div className="flex justify-end pt-3">
                    <button
                      type="submit"
                      disabled={saving}
                      className="btn-primary"
                    >
                      {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                      Save Workspace
                    </button>
                  </div>
                </form>
              )}

              {/* API Keys Management */}
              {activeSection === "api-keys" && (
                <div className="space-y-6">
                  {renderHeader("AI Provider API Keys", "Securely connect your LLM accounts to power your chatbots.")}
                  
                  <div className="space-y-4">
                    {["GEMINI", "OPENAI", "ANTHROPIC", "GROQ", "OPENROUTER"].map((provider) => {
                      const keyRecord = apiKeys.find((k) => k.provider === provider);
                      const isConnected = !!keyRecord;
                      const showPassword = showKeyField[provider] || false;

                      return (
                        <div key={provider} className="p-5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="space-y-1.5 flex-1">
                            <div className="flex items-center gap-3">
                              <h3 className="text-base font-bold text-[var(--text-primary)]">{provider}</h3>
                              {isConnected ? (
                                <span className="badge badge-emerald text-xs flex items-center gap-1">
                                  <CheckCircle className="w-3.5 h-3.5" />
                                  Connected
                                </span>
                              ) : (
                                <span className="badge badge-purple text-xs opacity-60">
                                  Not Configured
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-[var(--text-tertiary)] leading-relaxed">
                              {isConnected 
                                ? `Active Key Preview: ${keyRecord.encryptedKey}`
                                : `Configure your personal ${provider} credentials to unlock models.`}
                            </p>
                            
                            <div className="flex items-center gap-2 mt-3 max-w-md">
                              <div className="relative flex-1">
                                <input
                                  type={showPassword ? "text" : "password"}
                                  value={newKeys[provider]}
                                  onChange={(e) => setNewKeys((prev) => ({ ...prev, [provider]: e.target.value }))}
                                  placeholder={isConnected ? "Enter new key to update..." : "Paste API key here..."}
                                  className="w-full px-3.5 py-2.5 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-primary)] focus:border-[var(--brand-purple)] outline-none text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] font-mono"
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowKeyField((prev) => ({ ...prev, [provider]: !prev[provider] }))}
                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-white"
                                >
                                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleSaveApiKey(provider)}
                                disabled={saving || !newKeys[provider]}
                                className="px-4.5 py-2.5 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 font-semibold text-xs text-white transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shrink-0"
                              >
                                Save
                              </button>
                            </div>
                          </div>

                          {isConnected && (
                            <div className="flex items-center shrink-0">
                              <button
                                type="button"
                                onClick={() => handleDeleteApiKey(provider)}
                                disabled={saving}
                                className="p-3 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-all flex items-center gap-2 text-xs font-semibold border border-red-500/20 cursor-pointer"
                              >
                                <Trash2 className="w-4.5 h-4.5" />
                                Remove Key
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Security Form */}
              {activeSection === "security" && (
                <form onSubmit={handleSecuritySave} className="space-y-5">
                  {renderHeader("Security Credentials", "Update passwords and account login details.")}
                  <div className="space-y-4 max-w-md">
                    <div className="space-y-2">
                      <label className="input-label">Current Password</label>
                      <div className="relative">
                        <input
                          type={showCurrentPassword ? "text" : "password"}
                          required
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          className="input-field !pr-10 font-mono"
                          placeholder="••••••••"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
                        >
                          {showCurrentPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="input-label">New Password</label>
                      <div className="relative">
                        <input
                          type={showNewPassword ? "text" : "password"}
                          required
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="input-field !pr-10 font-mono"
                          placeholder="Minimum 8 characters"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
                        >
                          {showNewPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="input-label">Confirm New Password</label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          required
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="input-field !pr-10 font-mono"
                          placeholder="Confirm new password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end pt-3">
                    <button
                      type="submit"
                      disabled={saving}
                      className="btn-primary"
                    >
                      {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                      Change Password
                    </button>
                  </div>
                </form>
              )}

              {/* Notifications settings */}
              {activeSection === "notifications" && (
                <form onSubmit={handleNotificationsSave} className="space-y-5">
                  {renderHeader("Notifications Setup", "Set workspace activity trigger email actions.")}
                  
                  <div className="space-y-4">
                    <label className="flex items-start gap-3.5 p-4.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] cursor-pointer hover:bg-[var(--bg-glass-hover)] transition-all">
                      <input
                        type="checkbox"
                        checked={notifyLead}
                        onChange={(e) => setNotifyLead(e.target.checked)}
                        className="w-5 h-5 mt-0.5 text-purple-600 rounded bg-[var(--bg-primary)] border-[var(--border-primary)] focus:ring-purple-500 focus:ring-offset-0 focus:ring-0 cursor-pointer"
                      />
                      <div className="space-y-0.5">
                        <span className="text-sm font-semibold text-[var(--text-primary)]">Lead Capture Alerts</span>
                        <p className="text-xs text-[var(--text-tertiary)] leading-relaxed">
                          Receive email notifications immediately when a bot successfully registers a new lead.
                        </p>
                      </div>
                    </label>

                    <label className="flex items-start gap-3.5 p-4.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] cursor-pointer hover:bg-[var(--bg-glass-hover)] transition-all">
                      <input
                        type="checkbox"
                        checked={notifyDigest}
                        onChange={(e) => setNotifyDigest(e.target.checked)}
                        className="w-5 h-5 mt-0.5 text-purple-600 rounded bg-[var(--bg-primary)] border-[var(--border-primary)] focus:ring-purple-500 focus:ring-offset-0 focus:ring-0 cursor-pointer"
                      />
                      <div className="space-y-0.5">
                        <span className="text-sm font-semibold text-[var(--text-primary)]">Daily Consultation Digest</span>
                        <p className="text-xs text-[var(--text-tertiary)] leading-relaxed">
                          Get a daily morning email summary tracking total chats, token usages, and lead aggregates.
                        </p>
                      </div>
                    </label>

                    <label className="flex items-start gap-3.5 p-4.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] cursor-pointer hover:bg-[var(--bg-glass-hover)] transition-all">
                      <input
                        type="checkbox"
                        checked={notifyTokens}
                        onChange={(e) => setNotifyTokens(e.target.checked)}
                        className="w-5 h-5 mt-0.5 text-purple-600 rounded bg-[var(--bg-primary)] border-[var(--border-primary)] focus:ring-purple-500 focus:ring-offset-0 focus:ring-0 cursor-pointer"
                      />
                      <div className="space-y-0.5">
                        <span className="text-sm font-semibold text-[var(--text-primary)]">Token Threshold Warnings</span>
                        <p className="text-xs text-[var(--text-tertiary)] leading-relaxed">
                          Alert admins when monthly token consumption crosses 80%, 90%, and 99% of limits.
                        </p>
                      </div>
                    </label>
                  </div>

                  <div className="flex justify-end pt-3">
                    <button
                      type="submit"
                      disabled={saving}
                      className="btn-primary"
                    >
                      {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                      Save Preferences
                    </button>
                  </div>
                </form>
              )}

              {/* Languages form */}
              {activeSection === "languages" && (
                <form onSubmit={handleLanguagesSave} className="space-y-5">
                  {renderHeader("Language Configurations", "Set system defaults and translation options.")}
                  
                  <div className="max-w-md space-y-4">
                    <div className="space-y-2">
                      <label className="input-label">Default Consultation Language</label>
                      <select
                        value={defaultLang}
                        onChange={(e) => setDefaultLang(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-primary)] text-sm text-[var(--text-primary)] outline-none focus:border-[var(--brand-purple)] transition-all cursor-pointer"
                      >
                        <option value="en">English (US/UK)</option>
                        <option value="es">Español (Spanish)</option>
                        <option value="fr">Français (French)</option>
                        <option value="de">Deutsch (German)</option>
                        <option value="hi">हिन्दी (Hindi)</option>
                        <option value="zh">中文 (Chinese)</option>
                      </select>
                      <p className="text-xs text-[var(--text-tertiary)] leading-relaxed mt-1.5">
                        New chatbots default to this language for welcome templates and suggestions unless overridden.
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end pt-3">
                    <button
                      type="submit"
                      disabled={saving}
                      className="btn-primary"
                    >
                      {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                      Save Languages
                    </button>
                  </div>
                </form>
              )}

              {/* Appearance form */}
              {activeSection === "appearance" && (
                <form onSubmit={handleAppearanceSave} className="space-y-5">
                  {renderHeader("Appearance Options", "Customize your workspace layout styling and accent colors.")}
                  
                  <div className="space-y-5">
                    <div className="space-y-3">
                      <label className="input-label">Workspace Accent Theme</label>
                      <div className="flex gap-4">
                        {[
                          { key: "purple", color: "bg-purple-600", label: "Purple (Default)" },
                          { key: "blue", color: "bg-blue-600", label: "Ocean Blue" },
                          { key: "emerald", color: "bg-emerald-600", label: "Emerald Green" },
                          { key: "cyan", color: "bg-cyan-500", label: "Cyan Glow" },
                        ].map((theme) => (
                          <button
                            type="button"
                            key={theme.key}
                            onClick={() => setAccentColor(theme.key)}
                            className={`p-3 rounded-xl border flex flex-col items-center gap-2 cursor-pointer transition-all flex-1 ${
                              accentColor === theme.key
                                ? "border-[var(--brand-purple)] bg-[var(--bg-glass-hover)]"
                                : "border-[var(--border-primary)] bg-[var(--bg-secondary)] hover:bg-[var(--bg-glass-hover)]"
                            }`}
                          >
                            <span className={`w-6 h-6 rounded-full ${theme.color} shadow-md`} />
                            <span className="text-xs font-semibold text-[var(--text-primary)]">{theme.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2 max-w-md">
                      <label className="input-label">Default Dashboard Spacing Scale</label>
                      <select
                        value={uiScale}
                        onChange={(e) => setUiScale(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-primary)] text-sm text-[var(--text-primary)] outline-none focus:border-[var(--brand-purple)] transition-all cursor-pointer"
                      >
                        <option value="default">Default Proportional</option>
                        <option value="roomy">Roomy / Scaled-Up (Recommended for legibility)</option>
                      </select>
                      <p className="text-xs text-[var(--text-tertiary)] leading-relaxed mt-1">
                        Select Roomy to enforce larger spacing values globally across elements and navigation grids.
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end pt-3">
                    <button
                      type="submit"
                      disabled={saving}
                      className="btn-primary"
                    >
                      {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                      Save Styling
                    </button>
                  </div>
                </form>
              )}

              {/* Team Management section */}
              {activeSection === "team" && (
                <div className="space-y-8">
                  {renderHeader("Team Management", "Invite teammates, manage roles, and control active user permissions.")}

                  {/* Invite Member Section */}
                  {currentUser && (currentUser.role === "TENANT_OWNER" || currentUser.role === "MANAGER") ? (
                    <div className="p-5 rounded-xl bg-purple-500/5 border border-purple-500/10 space-y-4">
                      <div>
                        <h3 className="text-sm font-bold text-[var(--text-primary)]">Invite New Member</h3>
                        <p className="text-xs text-[var(--text-tertiary)]">Send an invite email to add someone to this workspace.</p>
                      </div>
                      <form onSubmit={handleSendInvite} className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                          <input
                            type="email"
                            required
                            value={inviteEmail}
                            onChange={(e) => setInviteEmail(e.target.value)}
                            placeholder="teammate@company.com"
                            className="input-field !pl-10 !py-2.5 text-xs text-[var(--text-primary)]"
                          />
                        </div>
                        <div className="w-full sm:w-44">
                          <select
                            value={inviteRole}
                            onChange={(e) => setInviteRole(e.target.value)}
                            className="input-field !py-2.5 text-xs cursor-pointer"
                          >
                            <option value="SUPPORT_AGENT">Support Agent</option>
                            <option value="ANALYST">Analyst</option>
                            <option value="MANAGER">Manager</option>
                            {currentUser.role === "TENANT_OWNER" && (
                              <option value="TENANT_OWNER">Site Owner</option>
                            )}
                          </select>
                        </div>
                        <button
                          type="submit"
                          disabled={isInviting || !inviteEmail.trim()}
                          className="btn-primary flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-lg text-xs"
                        >
                          {isInviting ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <UserPlus className="w-4 h-4" />
                              Send Invite
                            </>
                          )}
                        </button>
                      </form>
                    </div>
                  ) : (
                    <div className="p-4.5 rounded-xl bg-amber-500/5 border border-amber-500/10 text-amber-400 text-xs flex items-center gap-2">
                      <Shield className="w-4 h-4 shrink-0" />
                      Only managers and owners can invite new team members.
                    </div>
                  )}

                  {/* Pending Invitations */}
                  {pendingInvites.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Pending Invitations ({pendingInvites.length})</h3>
                      <div className="glass-card p-0 hover:transform-none overflow-hidden border border-[var(--border-primary)]">
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="border-b border-[var(--border-primary)] bg-[var(--bg-tertiary)]/30 text-[var(--text-tertiary)]">
                                <th className="p-3.5 font-semibold">Email</th>
                                <th className="p-3.5 font-semibold">Assigned Role</th>
                                <th className="p-3.5 font-semibold">Expires</th>
                                <th className="p-3.5 font-semibold text-right">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--border-primary)] text-[var(--text-secondary)]">
                              {pendingInvites.map((invite) => {
                                const isActionLoading = actionLoadingId === invite.id;
                                return (
                                  <tr key={invite.id} className="hover:bg-[var(--bg-tertiary)]/10">
                                    <td className="p-3.5 font-medium text-[var(--text-primary)]">{invite.email}</td>
                                    <td className="p-3.5">
                                      <span className="badge badge-purple text-[9px] uppercase font-bold">
                                        {invite.role === "TENANT_OWNER" ? "Site Owner" : invite.role.replace("_", " ")}
                                      </span>
                                    </td>
                                    <td className="p-3.5 text-[var(--text-tertiary)]">
                                      {new Date(invite.expiresAt).toLocaleDateString()}
                                    </td>
                                    <td className="p-3.5 text-right">
                                      <button
                                        type="button"
                                        disabled={isActionLoading}
                                        onClick={() => handleRevokeInvite(invite.id)}
                                        className="p-1.5 rounded-lg bg-[var(--bg-tertiary)] hover:bg-red-500/10 text-red-400 hover:text-red-300 transition-colors cursor-pointer"
                                        title="Revoke invitation"
                                      >
                                        {isActionLoading ? (
                                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        ) : (
                                          <Trash2 className="w-3.5 h-3.5" />
                                        )}
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Active Team Members */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Active Members ({teamMembers.length})</h3>
                    <div className="glass-card p-0 hover:transform-none overflow-hidden border border-[var(--border-primary)]">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="border-b border-[var(--border-primary)] bg-[var(--bg-tertiary)]/30 text-[var(--text-tertiary)]">
                              <th className="p-3.5 font-semibold">User</th>
                              <th className="p-3.5 font-semibold">Email</th>
                              <th className="p-3.5 font-semibold">Role</th>
                              <th className="p-3.5 font-semibold text-center">Status</th>
                              <th className="p-3.5 font-semibold text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[var(--border-primary)] text-[var(--text-secondary)]">
                            {teamMembers.map((member) => {
                              const isActionLoading = actionLoadingId === member.id;
                              const isSelf = currentUser && currentUser.id === member.id;
                              
                              // Check editing permissions
                              // Managers cannot edit Owners or other Managers.
                              const isEditable = currentUser && (
                                currentUser.role === "SUPER_ADMIN" ||
                                currentUser.role === "TENANT_OWNER" ||
                                (currentUser.role === "MANAGER" && member.role !== "TENANT_OWNER" && member.role !== "MANAGER")
                              ) && !isSelf;

                              return (
                                <tr key={member.id} className="hover:bg-[var(--bg-tertiary)]/10">
                                  <td className="p-3.5 font-medium text-[var(--text-primary)]">
                                    <div className="flex items-center gap-2">
                                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-purple-500/10 flex items-center justify-center text-[10px] font-bold text-[var(--brand-purple)]">
                                        {(member.name || member.email).charAt(0).toUpperCase()}
                                      </div>
                                      <span>
                                        {member.name || "Unnamed"} {isSelf && <span className="text-[10px] text-[var(--text-muted)] font-normal">(You)</span>}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="p-3.5 font-mono text-[10px] text-[var(--text-tertiary)]">{member.email}</td>
                                  <td className="p-3.5">
                                    {isEditable ? (
                                      <select
                                        value={member.role}
                                        disabled={isActionLoading}
                                        onChange={(e) => handleUpdateMemberRole(member.id, e.target.value)}
                                        className="bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded px-1.5 py-0.5 text-xs text-[var(--text-primary)] outline-none cursor-pointer"
                                      >
                                        <option value="SUPPORT_AGENT">Support Agent</option>
                                        <option value="ANALYST">Analyst</option>
                                        <option value="MANAGER">Manager</option>
                                        {currentUser.role === "TENANT_OWNER" && (
                                          <option value="TENANT_OWNER">Site Owner</option>
                                        )}
                                      </select>
                                    ) : (
                                      <span className="badge badge-purple text-[9px] uppercase font-bold">
                                        {member.role === "TENANT_OWNER" ? "Site Owner" : member.role.replace("_", " ")}
                                      </span>
                                    )}
                                  </td>
                                  <td className="p-3.5 text-center">
                                    {isEditable ? (
                                      <button
                                        type="button"
                                        disabled={isActionLoading}
                                        onClick={() => handleToggleMemberStatus(member.id, member.isActive)}
                                        className={`badge text-[9px] uppercase font-bold cursor-pointer transition-all hover:opacity-80 ${
                                          member.isActive ? "badge-emerald" : "badge-amber"
                                        }`}
                                        title={member.isActive ? "Deactivate User" : "Activate User"}
                                      >
                                        {member.isActive ? "Active" : "Inactive"}
                                      </button>
                                    ) : (
                                      <span className={`badge text-[9px] uppercase font-bold ${
                                        member.isActive ? "badge-emerald" : "badge-amber"
                                      }`}>
                                        {member.isActive ? "Active" : "Inactive"}
                                      </span>
                                    )}
                                  </td>
                                  <td className="p-3.5 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                      {isEditable && (
                                        <button
                                          type="button"
                                          disabled={isActionLoading}
                                          onClick={() => handleDeleteMember(member.id, member.name || member.email)}
                                          className="p-1.5 rounded-lg bg-[var(--bg-tertiary)] hover:bg-red-500/10 text-red-400 hover:text-red-300 transition-colors cursor-pointer"
                                          title="Remove team member"
                                        >
                                          {isActionLoading ? (
                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                          ) : (
                                            <Trash2 className="w-3.5 h-3.5" />
                                          )}
                                        </button>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
