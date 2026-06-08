"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building,
  Users,
  Bot,
  Target,
  Cpu,
  Mail,
  User,
  Shield,
  Layers,
  ArrowLeft,
  Calendar,
  AlertTriangle,
  Loader2,
  Trash2,
  CheckCircle,
  AlertOctagon,
  Clock,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import TenantDetailChart from "./TenantDetailChart";

interface TenantUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

interface TenantChatbot {
  id: string;
  name: string;
  status: string;
  model: string;
  provider: string;
  conversations: number;
  leads: number;
  createdAt: string;
}

interface TenantLead {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  status: string;
  score: number;
  source: string | null;
  createdAt: string;
}

interface TenantData {
  id: string;
  name: string;
  slug: string;
  domain: string | null;
  plan: string;
  createdAt: string;
  status: "ACTIVE" | "SUSPENDED";
  users: TenantUser[];
  chatbots: TenantChatbot[];
  subscription: {
    id: string;
    status: string;
    stripeSubscriptionId: string | null;
    trialEndsAt: string | null;
    currentPeriodStart: string | null;
    currentPeriodEnd: string | null;
  } | null;
  recentLeads: TenantLead[];
  usage: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    cost: number;
  };
  chartData: Array<{
    date: string;
    conversations: number;
    leads: number;
  }>;
  settings: any;
}

interface TenantDetailClientProps {
  tenantData: TenantData;
}

export default function TenantDetailClient({ tenantData }: TenantDetailClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"users" | "chatbots" | "leads" | "billing">("users");
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(tenantData.plan);
  const [isUpdatingPlan, setIsUpdatingPlan] = useState(false);

  const isSuspended = tenantData.status === "SUSPENDED";

  // Toggle Activation
  const handleToggleStatus = async () => {
    setIsActionLoading(true);
    const newAction = isSuspended ? "activate" : "suspend";

    try {
      const res = await fetch(`/api/admin/tenants/${tenantData.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: newAction }),
      });

      if (res.ok) {
        router.refresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsActionLoading(false);
    }
  };

  // Change Subscription Plan
  const handlePlanChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newPlan = e.target.value;
    setSelectedPlan(newPlan);
    setIsUpdatingPlan(true);

    try {
      const res = await fetch(`/api/admin/tenants/${tenantData.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: newPlan }),
      });

      if (res.ok) {
        router.refresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdatingPlan(false);
    }
  };

  // Delete Tenant Workspace
  const handleDeleteTenant = async () => {
    if (
      !confirm(
        `DANGER ZONE: Are you sure you want to delete workspace "${tenantData.name}"? This deletes ALL chatbots, users, conversations, and leads! This action cannot be undone.`
      )
    ) {
      return;
    }
    setIsActionLoading(true);

    try {
      const res = await fetch(`/api/admin/tenants/${tenantData.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        router.push("/admin/tenants");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <div>
        <Link
          href="/admin/tenants"
          className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--text-tertiary)] hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Tenants Directory
        </Link>
      </div>

      {/* Header Profile */}
      <div className="glass-card p-6 hover:transform-none flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        {/* Glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-red-500/5 rounded-full blur-[80px] pointer-events-none" />

        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-red-500/10">
            {tenantData.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-[var(--text-primary)]">{tenantData.name}</h1>
            <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-[var(--text-tertiary)]">
              <span className="font-mono bg-[var(--bg-tertiary)] px-2 py-0.5 rounded border border-[var(--border-primary)]">
                {tenantData.slug}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                Joined {new Date(tenantData.createdAt).toLocaleDateString()}
              </span>
              <span>•</span>
              <span
                className={`badge text-[10px] py-0 px-2 uppercase font-extrabold ${
                  tenantData.status === "ACTIVE" ? "badge-emerald" : "badge-amber"
                }`}
              >
                {tenantData.status}
              </span>
            </div>
          </div>
        </div>

        {/* Administration Actions */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Quick Plan Switcher */}
          <div className="flex items-center gap-2 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg px-3 py-1 text-xs">
            <span className="text-[var(--text-tertiary)]">Plan:</span>
            {isUpdatingPlan ? (
              <Loader2 className="w-3 h-3 animate-spin text-[var(--brand-purple)]" />
            ) : (
              <select
                value={selectedPlan}
                onChange={handlePlanChange}
                className="bg-transparent text-[var(--text-primary)] font-bold outline-none cursor-pointer"
              >
                <option value="FREE">Free</option>
                <option value="STARTER">Starter</option>
                <option value="PRO">Pro</option>
                <option value="ENTERPRISE">Enterprise</option>
              </select>
            )}
          </div>

          {/* Toggle status */}
          <button
            onClick={handleToggleStatus}
            disabled={isActionLoading}
            className={`btn-secondary text-xs py-2 px-4 flex items-center gap-1.5 justify-center ${
              isSuspended
                ? "text-emerald-400 border-emerald-500/30 hover:border-emerald-500"
                : "text-amber-400 border-amber-500/30 hover:border-amber-500"
            }`}
          >
            {isActionLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : isSuspended ? (
              <>
                <CheckCircle className="w-3.5 h-3.5" /> Activate Tenant
              </>
            ) : (
              <>
                <AlertOctagon className="w-3.5 h-3.5" /> Suspend Tenant
              </>
            )}
          </button>

          {/* Wipe workspace */}
          <button
            onClick={handleDeleteTenant}
            disabled={isActionLoading}
            className="p-2 rounded-lg border border-red-500/20 hover:border-red-500 bg-red-500/5 hover:bg-red-500/15 text-red-400 hover:text-red-300 transition-colors shrink-0"
            title="Wipe Workspace"
          >
            {isActionLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Trash2 className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Aggregate metrics grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-4 hover:transform-none">
          <p className="text-xs text-[var(--text-tertiary)] font-medium">Chatbots Created</p>
          <p className="text-xl font-bold text-[var(--text-primary)] mt-1.5">
            {tenantData.chatbots.length}
          </p>
        </div>
        <div className="glass-card p-4 hover:transform-none">
          <p className="text-xs text-[var(--text-tertiary)] font-medium">Leads Captured</p>
          <p className="text-xl font-bold text-[var(--brand-blue)] mt-1.5">
            {tenantData.recentLeads.length}+
          </p>
        </div>
        <div className="glass-card p-4 hover:transform-none">
          <p className="text-xs text-[var(--text-tertiary)] font-medium">Tokens Consumed</p>
          <p className="text-xl font-bold text-[var(--brand-purple)] mt-1.5">
            {tenantData.usage.totalTokens.toLocaleString()}
          </p>
        </div>
        <div className="glass-card p-4 hover:transform-none">
          <p className="text-xs text-[var(--text-tertiary)] font-medium">Accumulated AI Cost</p>
          <p className="text-xl font-bold text-[var(--brand-pink)] mt-1.5">
            ${tenantData.usage.cost.toFixed(4)}
          </p>
        </div>
      </div>

      {/* Recharts chart */}
      <TenantDetailChart chartData={tenantData.chartData} />

      {/* Details Tabs */}
      <div className="space-y-4">
        {/* Tab buttons */}
        <div className="flex border-b border-[var(--border-primary)] gap-4">
          {[
            { id: "users", label: "Team Members", icon: Users },
            { id: "chatbots", label: "Chatbots", icon: Bot },
            { id: "leads", label: "Recent Leads", icon: Target },
            { id: "billing", label: "Subscription & Billing", icon: Layers },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 pb-3 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
                  active
                    ? "border-red-500 text-red-400"
                    : "border-transparent text-[var(--text-secondary)] hover:text-white"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab contents */}
        <div className="glass-card p-5 hover:transform-none">
          {activeTab === "users" && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-[var(--text-primary)]">Team Members</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border-primary)] text-[var(--text-tertiary)] pb-2">
                      <th className="py-2">Name</th>
                      <th className="py-2">Email</th>
                      <th className="py-2">Role</th>
                      <th className="py-2 text-center">Status</th>
                      <th className="py-2 text-right">Last Login</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-primary)] text-[var(--text-secondary)]">
                    {tenantData.users.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-4 text-center text-[var(--text-muted)]">
                          No users registered.
                        </td>
                      </tr>
                    ) : (
                      tenantData.users.map((user) => (
                        <tr key={user.id} className="hover:text-white">
                          <td className="py-3 font-semibold text-[var(--text-primary)]">
                            {user.name || "Unnamed"}
                          </td>
                          <td className="py-3">{user.email}</td>
                          <td className="py-3 text-xs uppercase font-mono">{user.role}</td>
                          <td className="py-3 text-center">
                            <span
                              className={`badge text-[9px] py-0 px-2 uppercase font-bold ${
                                user.isActive ? "badge-emerald" : "badge-amber"
                              }`}
                            >
                              {user.isActive ? "Active" : "Deactivated"}
                            </span>
                          </td>
                          <td className="py-3 text-right text-xs">
                            {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : "Never"}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "chatbots" && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-[var(--text-primary)]">Workspace Chatbots</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border-primary)] text-[var(--text-tertiary)] pb-2">
                      <th className="py-2">Chatbot Name</th>
                      <th className="py-2">Model & Provider</th>
                      <th className="py-2 text-center">Conversations</th>
                      <th className="py-2 text-center">Leads Captured</th>
                      <th className="py-2 text-center">Status</th>
                      <th className="py-2 text-right">Created Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-primary)] text-[var(--text-secondary)]">
                    {tenantData.chatbots.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-4 text-center text-[var(--text-muted)]">
                          No chatbots created.
                        </td>
                      </tr>
                    ) : (
                      tenantData.chatbots.map((bot) => (
                        <tr key={bot.id} className="hover:text-white">
                          <td className="py-3 font-semibold text-[var(--text-primary)]">{bot.name}</td>
                          <td className="py-3 text-xs uppercase font-mono">
                            {bot.provider} ({bot.model})
                          </td>
                          <td className="py-3 text-center font-bold">{bot.conversations}</td>
                          <td className="py-3 text-center font-bold text-[var(--brand-blue)]">
                            {bot.leads}
                          </td>
                          <td className="py-3 text-center">
                            <span
                              className={`badge text-[9px] py-0 px-2 uppercase font-bold ${
                                bot.status === "ACTIVE" ? "badge-emerald" : "badge-amber"
                              }`}
                            >
                              {bot.status}
                            </span>
                          </td>
                          <td className="py-3 text-right text-xs">
                            {new Date(bot.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "leads" && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-[var(--text-primary)]">Recently Captured Leads</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border-primary)] text-[var(--text-tertiary)] pb-2">
                      <th className="py-2">Name</th>
                      <th className="py-2">Email</th>
                      <th className="py-2">Phone</th>
                      <th className="py-2 text-center">Qualification Score</th>
                      <th className="py-2 text-center">Status</th>
                      <th className="py-2 text-right">Captured On</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-primary)] text-[var(--text-secondary)]">
                    {tenantData.recentLeads.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-4 text-center text-[var(--text-muted)]">
                          No leads captured.
                        </td>
                      </tr>
                    ) : (
                      tenantData.recentLeads.map((lead) => (
                        <tr key={lead.id} className="hover:text-white">
                          <td className="py-3 font-semibold text-[var(--text-primary)]">
                            {lead.name || "Unknown"}
                          </td>
                          <td className="py-3">{lead.email || "N/A"}</td>
                          <td className="py-3">{lead.phone || "N/A"}</td>
                          <td className="py-3 text-center">
                            <div className="inline-flex items-center gap-1.5">
                              <span
                                className={`w-2 h-2 rounded-full ${
                                  lead.score >= 75
                                    ? "bg-emerald-500"
                                    : lead.score >= 50
                                    ? "bg-blue-500"
                                    : "bg-amber-500"
                                }`}
                              />
                              <span className="font-bold">{lead.score}/100</span>
                            </div>
                          </td>
                          <td className="py-3 text-center">
                            <span
                              className={`badge text-[9px] py-0 px-2 uppercase font-bold ${
                                lead.status === "QUALIFIED"
                                  ? "badge-emerald"
                                  : lead.status === "NEW"
                                  ? "badge-blue"
                                  : "badge-purple"
                              }`}
                            >
                              {lead.status}
                            </span>
                          </td>
                          <td className="py-3 text-right text-xs">
                            {new Date(lead.createdAt).toLocaleString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "billing" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-[var(--text-primary)]">Subscription Details</h3>
                <p className="text-xs text-[var(--text-tertiary)] mt-1">
                  Active billing plan parameters and subscription status.
                </p>
              </div>

              {tenantData.subscription ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center pb-2 border-b border-[var(--border-primary)]">
                      <span className="text-sm text-[var(--text-secondary)]">Subscription Status</span>
                      <span
                        className={`badge text-xs uppercase font-extrabold ${
                          tenantData.subscription.status === "ACTIVE" ||
                          tenantData.subscription.status === "TRIALING"
                            ? "badge-emerald"
                            : "badge-pink"
                        }`}
                      >
                        {tenantData.subscription.status}
                      </span>
                    </div>

                    <div className="flex justify-between items-center pb-2 border-b border-[var(--border-primary)]">
                      <span className="text-sm text-[var(--text-secondary)]">Billing Plan</span>
                      <span className="text-sm font-bold text-[var(--text-primary)] uppercase">
                        {tenantData.plan} Plan
                      </span>
                    </div>

                    <div className="flex justify-between items-center pb-2 border-b border-[var(--border-primary)]">
                      <span className="text-sm text-[var(--text-secondary)]">Stripe ID</span>
                      <span className="text-xs font-mono text-[var(--text-primary)]">
                        {tenantData.subscription.stripeSubscriptionId || "No Stripe ID Connected"}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center pb-2 border-b border-[var(--border-primary)]">
                      <span className="text-sm text-[var(--text-secondary)]">Period Started</span>
                      <span className="text-sm text-[var(--text-primary)]">
                        {tenantData.subscription.currentPeriodStart
                          ? new Date(tenantData.subscription.currentPeriodStart).toLocaleDateString()
                          : "N/A"}
                      </span>
                    </div>

                    <div className="flex justify-between items-center pb-2 border-b border-[var(--border-primary)]">
                      <span className="text-sm text-[var(--text-secondary)]">Period Ending / Renewal</span>
                      <span className="text-sm text-[var(--text-primary)]">
                        {tenantData.subscription.currentPeriodEnd
                          ? new Date(tenantData.subscription.currentPeriodEnd).toLocaleDateString()
                          : "N/A"}
                      </span>
                    </div>

                    <div className="flex justify-between items-center pb-2 border-b border-[var(--border-primary)]">
                      <span className="text-sm text-[var(--text-secondary)]">Trial Ends At</span>
                      <span className="text-sm text-[var(--text-primary)]">
                        {tenantData.subscription.trialEndsAt
                          ? new Date(tenantData.subscription.trialEndsAt).toLocaleDateString()
                          : "None"}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 border border-amber-500/20 bg-amber-500/5 text-amber-400 text-xs rounded-lg flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 shrink-0" />
                  No subscription record exists for this tenant. Please assign a plan using the plan selector at the top.
                </div>
              )}

              {/* Dynamic plan limits overrides summary */}
              {tenantData.settings && (
                <div className="border-t border-[var(--border-primary)] pt-6">
                  <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-3">
                    Active Plan Limits Configuration
                  </h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-3 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg">
                      <p className="text-xs text-[var(--text-tertiary)]">Chatbots Capacity</p>
                      <p className="text-lg font-bold text-[var(--text-primary)] mt-1">
                        {(tenantData.settings as any).allowedChatbots || "Standard"}
                      </p>
                    </div>
                    <div className="p-3 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg">
                      <p className="text-xs text-[var(--text-tertiary)]">Allowed Team Members</p>
                      <p className="text-lg font-bold text-[var(--text-primary)] mt-1">
                        {(tenantData.settings as any).allowedTeamMembers || "Standard"}
                      </p>
                    </div>
                    <div className="p-3 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg">
                      <p className="text-xs text-[var(--text-tertiary)]">API Token Limit</p>
                      <p className="text-lg font-bold text-[var(--text-primary)] mt-1">
                        {((tenantData.settings as any).tokenLimits || 0).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
