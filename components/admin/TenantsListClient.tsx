"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  AlertOctagon,
  Eye,
  X,
  Loader2,
  Building,
  Mail,
  User,
  Shield,
  Layers,
  Calendar,
} from "lucide-react";

interface Tenant {
  id: string;
  name: string;
  slug: string;
  domain: string | null;
  plan: string;
  createdAt: string;
  owner: {
    id: string;
    name: string;
    email: string;
  } | null;
  chatbotsCount: number;
  leadsCount: number;
  status: "ACTIVE" | "SUSPENDED";
}

interface TenantsListClientProps {
  initialTenants: Tenant[];
}

export default function TenantsListClient({ initialTenants }: TenantsListClientProps) {
  const router = useRouter();
  const [tenants, setTenants] = useState<Tenant[]>(initialTenants);
  const [searchTerm, setSearchTerm] = useState("");
  const [planFilter, setPlanFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Create Modal State
  const [createOpen, setCreateOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [createForm, setCreateForm] = useState({
    companyName: "",
    ownerName: "",
    email: "",
    password: "",
    plan: "FREE",
    allowedChatbots: "1",
    allowedTeamMembers: "2",
    tokenLimits: "100000",
    trialExpiration: "",
  });

  // Edit Plan Modal State
  const [editPlanOpen, setEditPlanOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [selectedPlan, setSelectedPlan] = useState("FREE");
  const [isUpdatingPlan, setIsUpdatingPlan] = useState(false);

  // Status/Action Loading State
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Search & Filter Logic
  const filteredTenants = tenants.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.owner?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.owner?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.slug.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesPlan = planFilter === "ALL" || t.plan === planFilter;
    const matchesStatus = statusFilter === "ALL" || t.status === statusFilter;

    return matchesSearch && matchesPlan && matchesStatus;
  });

  // Handle Form Change
  const handleCreateChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCreateForm((prev) => {
      // Auto-set defaults based on plan choice
      if (name === "plan") {
        let defaults = { allowedChatbots: "1", allowedTeamMembers: "2", tokenLimits: "100000" };
        if (value === "STARTER") {
          defaults = { allowedChatbots: "5", allowedTeamMembers: "5", tokenLimits: "500000" };
        } else if (value === "PRO") {
          defaults = { allowedChatbots: "25", allowedTeamMembers: "15", tokenLimits: "2000000" };
        } else if (value === "ENTERPRISE") {
          defaults = { allowedChatbots: "9999", allowedTeamMembers: "9999", tokenLimits: "99999999" };
        }
        return { ...prev, plan: value, ...defaults };
      }
      return { ...prev, [name]: value };
    });
  };

  // Submit Create Tenant
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    setCreateError("");

    try {
      const res = await fetch("/api/admin/tenants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createForm),
      });
      const data = await res.json();

      if (!res.ok) {
        setCreateError(data.error || "Failed to create tenant");
      } else {
        // Reset form & reload data
        setCreateOpen(false);
        setCreateForm({
          companyName: "",
          ownerName: "",
          email: "",
          password: "",
          plan: "FREE",
          allowedChatbots: "1",
          allowedTeamMembers: "2",
          tokenLimits: "100000",
          trialExpiration: "",
        });
        // Refresh list
        router.refresh();
        const refreshRes = await fetch("/api/admin/tenants");
        if (refreshRes.ok) {
          setTenants(await refreshRes.json());
        }
      }
    } catch {
      setCreateError("An error occurred. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  // Change Subscription Plan
  const handleEditPlanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTenant) return;
    setIsUpdatingPlan(true);

    try {
      const res = await fetch(`/api/admin/tenants/${selectedTenant.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: selectedPlan }),
      });

      if (res.ok) {
        setEditPlanOpen(false);
        // Refresh local data
        setTenants((prev) =>
          prev.map((t) => (t.id === selectedTenant.id ? { ...t, plan: selectedPlan } : t))
        );
        router.refresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdatingPlan(false);
    }
  };

  // Toggle Activation (Suspend / Activate)
  const handleToggleStatus = async (tenantId: string, currentStatus: "ACTIVE" | "SUSPENDED") => {
    setActionLoadingId(tenantId);
    const newAction = currentStatus === "ACTIVE" ? "suspend" : "activate";

    try {
      const res = await fetch(`/api/admin/tenants/${tenantId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: newAction }),
      });

      if (res.ok) {
        setTenants((prev) =>
          prev.map((t) =>
            t.id === tenantId ? { ...t, status: currentStatus === "ACTIVE" ? "SUSPENDED" : "ACTIVE" } : t
          )
        );
        router.refresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Delete Tenant
  const handleDeleteTenant = async (tenantId: string, name: string) => {
    if (!confirm(`Are you absolutely sure you want to delete tenant "${name}"? This will permanently wipe all chatbots, conversations, leads, and users!`)) {
      return;
    }
    setActionLoadingId(tenantId);

    try {
      const res = await fetch(`/api/admin/tenants/${tenantId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setTenants((prev) => prev.filter((t) => t.id !== tenantId));
        router.refresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Tenants Directory</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Total of {tenants.length} workspaces registered on the platform.
          </p>
        </div>
        <button onClick={() => setCreateOpen(true)} className="btn-primary text-sm py-2.5 px-5 shrink-0">
          <Plus className="w-4 h-4" />
          Create Tenant
        </button>
      </div>

      {/* Filters bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Search */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-primary)] w-full md:w-80">
          <Search className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search tenant name, email, slug..."
            className="bg-transparent text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none flex-1"
          />
        </div>

        {/* Dropdowns */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--text-tertiary)] font-medium">Plan:</span>
            <select
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value)}
              className="bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg text-xs px-3 py-2 text-[var(--text-primary)] outline-none"
            >
              <option value="ALL">All Plans</option>
              <option value="FREE">Free</option>
              <option value="STARTER">Starter</option>
              <option value="PRO">Pro</option>
              <option value="ENTERPRISE">Enterprise</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--text-tertiary)] font-medium">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg text-xs px-3 py-2 text-[var(--text-primary)] outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tenants Table */}
      <div className="glass-card p-0 hover:transform-none overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-[var(--border-primary)] bg-[var(--bg-tertiary)]/30 text-[var(--text-tertiary)]">
                <th className="p-4 font-semibold">Company Name</th>
                <th className="p-4 font-semibold">Tenant ID / Slug</th>
                <th className="p-4 font-semibold">Owner Details</th>
                <th className="p-4 font-semibold">Subscription Plan</th>
                <th className="p-4 font-semibold text-center">Chatbots</th>
                <th className="p-4 font-semibold text-center">Leads</th>
                <th className="p-4 font-semibold text-center">Status</th>
                <th className="p-4 font-semibold text-center">Created</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-primary)]">
              {filteredTenants.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-[var(--text-muted)]">
                    No tenants match your search criteria.
                  </td>
                </tr>
              ) : (
                filteredTenants.map((t) => {
                  const isLoading = actionLoadingId === t.id;
                  return (
                    <tr key={t.id} className="text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]/20 hover:text-white">
                      <td className="p-4 font-medium text-[var(--text-primary)]">
                        <Link href={`/admin/tenants/${t.id}`} className="hover:underline">
                          {t.name}
                        </Link>
                      </td>
                      <td className="p-4 text-xs font-mono">{t.slug}</td>
                      <td className="p-4">
                        {t.owner ? (
                          <div>
                            <p className="font-semibold text-xs text-text-primary">{t.owner.name}</p>
                            <p className="text-[11px] text-[var(--text-muted)]">{t.owner.email}</p>
                          </div>
                        ) : (
                          <span className="text-xs text-[var(--text-muted)]">No Owner Set</span>
                        )}
                      </td>
                      <td className="p-4">
                        <span
                          className={`badge text-[10px] uppercase font-bold ${
                            t.plan === "ENTERPRISE"
                              ? "badge-pink"
                              : t.plan === "PRO"
                              ? "badge-purple"
                              : t.plan === "STARTER"
                              ? "badge-blue"
                              : "badge-cyan"
                          }`}
                        >
                          {t.plan}
                        </span>
                      </td>
                      <td className="p-4 text-center font-bold">{t.chatbotsCount}</td>
                      <td className="p-4 text-center font-bold text-[var(--brand-blue)]">
                        {t.leadsCount}
                      </td>
                      <td className="p-4 text-center">
                        <span
                          className={`badge text-[10px] uppercase font-bold ${
                            t.status === "ACTIVE" ? "badge-emerald" : "badge-amber"
                          }`}
                        >
                          {t.status}
                        </span>
                      </td>
                      <td className="p-4 text-center text-xs">
                        {new Date(t.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/admin/tenants/${t.id}`}
                            className="p-1.5 rounded-lg bg-[var(--bg-tertiary)] hover:bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-white transition-colors"
                            title="View Tenant Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Link>

                          <button
                            onClick={() => {
                              setSelectedTenant(t);
                              setSelectedPlan(t.plan);
                              setEditPlanOpen(true);
                            }}
                            className="p-1.5 rounded-lg bg-[var(--bg-tertiary)] hover:bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-white transition-colors"
                            title="Edit Plan"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleToggleStatus(t.id, t.status)}
                            disabled={isLoading}
                            className={`p-1.5 rounded-lg bg-[var(--bg-tertiary)] hover:bg-[var(--bg-elevated)] transition-colors ${
                              t.status === "ACTIVE"
                                ? "text-amber-400 hover:text-amber-300"
                                : "text-emerald-400 hover:text-emerald-300"
                            }`}
                            title={t.status === "ACTIVE" ? "Suspend Tenant" : "Activate Tenant"}
                          >
                            {isLoading ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : t.status === "ACTIVE" ? (
                              <AlertOctagon className="w-3.5 h-3.5" />
                            ) : (
                              <CheckCircle className="w-3.5 h-3.5" />
                            )}
                          </button>

                          <button
                            onClick={() => handleDeleteTenant(t.id, t.name)}
                            disabled={isLoading}
                            className="p-1.5 rounded-lg bg-[var(--bg-tertiary)] hover:bg-red-500/10 text-red-400 hover:text-red-300 transition-colors"
                            title="Delete Tenant"
                          >
                            {isLoading ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slide-over Panel: Create Tenant */}
      {createOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-[var(--bg-secondary)] border-l border-[var(--border-primary)] shadow-2xl flex flex-col h-full animate-fade-in-scale">
            {/* Header */}
            <div className="p-5 border-b border-[var(--border-primary)] flex items-center justify-between bg-[var(--bg-tertiary)]/20">
              <div>
                <h2 className="text-base font-bold text-[var(--text-primary)]">Create New Tenant</h2>
                <p className="text-xs text-[var(--text-tertiary)]">Set up tenant and default owner accounts</p>
              </div>
              <button
                onClick={() => setCreateOpen(false)}
                className="p-1.5 rounded-lg hover:bg-[var(--bg-glass-hover)] text-[var(--text-secondary)] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error Message */}
            {createError && (
              <div className="mx-5 mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                <AlertOctagon className="w-4 h-4 shrink-0" />
                {createError}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleCreateSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
              <div>
                <label className="input-label">Company Name</label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                  <input
                    type="text"
                    name="companyName"
                    value={createForm.companyName}
                    onChange={createForm.companyName ? handleCreateChange : handleCreateChange}
                    className="input-field !pl-10 !py-2.5 text-sm"
                    placeholder="e.g. Acme Corp"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="input-label">Owner Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                  <input
                    type="text"
                    name="ownerName"
                    value={createForm.ownerName}
                    onChange={handleCreateChange}
                    className="input-field !pl-10 !py-2.5 text-sm"
                    placeholder="e.g. John Doe"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="input-label">Owner Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                  <input
                    type="email"
                    name="email"
                    value={createForm.email}
                    onChange={handleCreateChange}
                    className="input-field !pl-10 !py-2.5 text-sm"
                    placeholder="owner@acme.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="input-label">Owner Password</label>
                <div className="relative">
                  <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                  <input
                    type="password"
                    name="password"
                    value={createForm.password}
                    onChange={handleCreateChange}
                    className="input-field !pl-10 !py-2.5 text-sm"
                    placeholder="Set temporary password"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="input-label">Subscription Plan</label>
                  <select
                    name="plan"
                    value={createForm.plan}
                    onChange={handleCreateChange}
                    className="input-field !py-2.5 text-sm"
                  >
                    <option value="FREE">Free</option>
                    <option value="STARTER">Starter</option>
                    <option value="PRO">Pro</option>
                    <option value="ENTERPRISE">Enterprise</option>
                  </select>
                </div>
                <div>
                  <label className="input-label">Trial Expiration (Optional)</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                    <input
                      type="date"
                      name="trialExpiration"
                      value={createForm.trialExpiration}
                      onChange={handleCreateChange}
                      className="input-field !pl-10 !py-2.5 text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-[var(--border-primary)] pt-4 mt-6">
                <h4 className="text-xs font-semibold text-[var(--text-primary)] mb-3">Plan Limitations Override</h4>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] text-[var(--text-tertiary)] mb-1 block">Chatbots Limit</label>
                    <input
                      type="number"
                      name="allowedChatbots"
                      value={createForm.allowedChatbots}
                      onChange={handleCreateChange}
                      className="input-field !py-1.5 !px-2.5 text-xs text-center font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-[var(--text-tertiary)] mb-1 block">Team Limits</label>
                    <input
                      type="number"
                      name="allowedTeamMembers"
                      value={createForm.allowedTeamMembers}
                      onChange={handleCreateChange}
                      className="input-field !py-1.5 !px-2.5 text-xs text-center font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-[var(--text-tertiary)] mb-1 block">Tokens Limits</label>
                    <input
                      type="number"
                      name="tokenLimits"
                      value={createForm.tokenLimits}
                      onChange={handleCreateChange}
                      className="input-field !py-1.5 !px-2.5 text-xs text-center font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-6 border-t border-[var(--border-primary)] mt-8">
                <button
                  type="button"
                  onClick={() => setCreateOpen(false)}
                  className="btn-secondary text-sm py-2 px-6 flex-1 justify-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="btn-primary text-sm py-2 px-6 flex-1 justify-center"
                >
                  {isCreating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Create Workspace"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Pricing Plan */}
      {editPlanOpen && selectedTenant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl shadow-2xl p-5 space-y-4 animate-fade-in-scale">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-primary)]">
              <div>
                <h3 className="text-base font-bold text-[var(--text-primary)]">Update Plan</h3>
                <p className="text-xs text-[var(--text-tertiary)]">Change subscription plan for {selectedTenant.name}</p>
              </div>
              <button
                onClick={() => setEditPlanOpen(false)}
                className="p-1.5 rounded-lg hover:bg-[var(--bg-glass-hover)] text-[var(--text-secondary)] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditPlanSubmit} className="space-y-4 pt-2">
              <div>
                <label className="input-label">Subscription Plan</label>
                <div className="relative">
                  <Layers className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                  <select
                    value={selectedPlan}
                    onChange={(e) => setSelectedPlan(e.target.value)}
                    className="input-field !pl-10 !py-2.5 text-sm"
                  >
                    <option value="FREE">Free Plan</option>
                    <option value="STARTER">Starter Plan</option>
                    <option value="PRO">Pro Plan</option>
                    <option value="ENTERPRISE">Enterprise Plan</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-[var(--border-primary)]">
                <button
                  type="button"
                  onClick={() => setEditPlanOpen(false)}
                  className="btn-secondary text-sm py-2 px-6 flex-1 justify-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingPlan}
                  className="btn-primary text-sm py-2 px-6 flex-1 justify-center"
                >
                  {isUpdatingPlan ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Save Plan"
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
