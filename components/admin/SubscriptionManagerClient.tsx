"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Layers,
  Edit2,
  CheckCircle,
  X,
  Loader2,
  DollarSign,
  Building,
  Activity,
  Zap,
  Users,
  Bot,
} from "lucide-react";

interface Plan {
  id: string;
  name: string;
  planType: string;
  priceMonthly: number;
  priceYearly: number;
  chatbotLimit: number;
  teamMemberLimit: number;
  tokenLimit: number;
  leadLimit: number;
  features: string[];
}

interface TenantBrief {
  id: string;
  name: string;
  plan: string;
}

interface SubscriptionManagerClientProps {
  plans: Plan[];
  tenants: TenantBrief[];
}

export default function SubscriptionManagerClient({
  plans: initialPlans,
  tenants,
}: SubscriptionManagerClientProps) {
  const router = useRouter();
  const [plans, setPlans] = useState<Plan[]>(initialPlans);

  // Edit Plan State
  const [editOpen, setEditOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [isUpdatingPlan, setIsUpdatingPlan] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    priceMonthly: "",
    priceYearly: "",
    chatbotLimit: "",
    teamMemberLimit: "",
    tokenLimit: "",
    leadLimit: "",
    features: "",
  });

  // Assign Plan State
  const [selectedTenantId, setSelectedTenantId] = useState("");
  const [selectedPlanType, setSelectedPlanType] = useState("FREE");
  const [isAssigning, setIsAssigning] = useState(false);
  const [assignError, setAssignError] = useState("");
  const [assignSuccess, setAssignSuccess] = useState("");

  // Open Edit Form
  const handleOpenEdit = (plan: Plan) => {
    setSelectedPlan(plan);
    setEditForm({
      name: plan.name,
      priceMonthly: plan.priceMonthly.toString(),
      priceYearly: plan.priceYearly.toString(),
      chatbotLimit: plan.chatbotLimit.toString(),
      teamMemberLimit: plan.teamMemberLimit.toString(),
      tokenLimit: plan.tokenLimit.toString(),
      leadLimit: plan.leadLimit.toString(),
      features: plan.features.join(", "),
    });
    setEditOpen(true);
  };

  // Submit Edit Plan
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan) return;
    setIsUpdatingPlan(true);

    try {
      const res = await fetch("/api/admin/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planType: selectedPlan.planType,
          ...editForm,
        }),
      });

      if (res.ok) {
        setEditOpen(false);
        // Refresh plans local state
        const updatedPlanRes = await fetch("/api/admin/subscriptions");
        if (updatedPlanRes.ok) {
          setPlans(await updatedPlanRes.json());
        }
        router.refresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdatingPlan(false);
    }
  };

  // Submit Assign Plan
  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTenantId) {
      setAssignError("Please select a tenant workspace");
      return;
    }
    setIsAssigning(true);
    setAssignError("");
    setAssignSuccess("");

    try {
      const res = await fetch("/api/admin/subscriptions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId: selectedTenantId,
          planType: selectedPlanType,
        }),
      });

      if (res.ok) {
        setAssignSuccess("Subscription updated successfully!");
        router.refresh();
      } else {
        const data = await res.json();
        setAssignError(data.error || "Failed to update subscription");
      }
    } catch {
      setAssignError("Something went wrong");
    } finally {
      setIsAssigning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">SaaS Plan & Subscription Manager</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Configure subscription plans, pricing tiers, limits, and assign subscription updates manually.
        </p>
      </div>

      {/* Plan Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((p) => (
          <div key={p.id} className="glass-card p-5 hover:transform-none flex flex-col justify-between relative overflow-hidden">
            {/* Branding gradient top line */}
            <div
              className="absolute top-0 left-0 right-0 h-1.5"
              style={{
                background:
                  p.planType === "ENTERPRISE"
                    ? "var(--gradient-brand)"
                    : p.planType === "PRO"
                    ? "linear-gradient(90deg, var(--brand-purple) 0%, var(--brand-blue) 100%)"
                    : p.planType === "STARTER"
                    ? "var(--brand-blue)"
                    : "var(--text-muted)",
              }}
            />

            <div>
              <div className="flex justify-between items-start pt-2">
                <div>
                  <h3 className="text-lg font-bold text-[var(--text-primary)]">{p.name}</h3>
                  <span className="text-[10px] text-[var(--text-tertiary)] uppercase font-mono tracking-wider">
                    {p.planType} Tier
                  </span>
                </div>
                <button
                  onClick={() => handleOpenEdit(p)}
                  className="p-1.5 rounded-lg bg-[var(--bg-tertiary)] hover:bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-white transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="my-5 flex items-baseline gap-1">
                <span className="text-2xl font-extrabold text-[var(--text-primary)]">${p.priceMonthly}</span>
                <span className="text-xs text-[var(--text-tertiary)]">/ mo</span>
                <span className="text-xs text-[var(--text-muted)] ml-2">(${p.priceYearly}/yr)</span>
              </div>

              <div className="space-y-3 text-sm border-t border-[var(--border-primary)] pt-4">
                <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
                  <span className="flex items-center gap-1">
                    <Bot className="w-3.5 h-3.5 text-[var(--brand-purple)]" />
                    Allowed Chatbots:
                  </span>
                  <span className="font-bold text-[var(--text-primary)]">
                    {p.chatbotLimit > 9999 ? "Unlimited" : p.chatbotLimit}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-[var(--brand-blue)]" />
                    Team Members:
                  </span>
                  <span className="font-bold text-[var(--text-primary)]">
                    {p.teamMemberLimit > 9999 ? "Unlimited" : p.teamMemberLimit}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
                  <span className="flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    Token limits:
                  </span>
                  <span className="font-bold text-[var(--text-primary)]">
                    {p.tokenLimit > 9999999 ? "Unlimited" : p.tokenLimit.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
                  <span className="flex items-center gap-1">
                    <Activity className="w-3.5 h-3.5 text-emerald-400" />
                    Leads limit:
                  </span>
                  <span className="font-bold text-[var(--text-primary)]">
                    {p.leadLimit > 99999 ? "Unlimited" : p.leadLimit.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="border-t border-[var(--border-primary)] pt-4 mt-5">
              <p className="text-[11px] text-[var(--text-tertiary)] font-bold mb-2">FEATURES INCLUDE:</p>
              <div className="space-y-1.5">
                {p.features.map((feat) => (
                  <p key={feat} className="text-xs text-[var(--text-secondary)] flex items-center gap-1.5">
                    <CheckCircle className="w-3 h-3 text-emerald-500 shrink-0" />
                    {feat}
                  </p>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Manual Plan Assignment Section */}
      <div className="glass-card p-5 hover:transform-none">
        <h3 className="text-base font-semibold text-[var(--text-primary)] mb-3">
          Manual Tenant Plan Assignment
        </h3>
        <p className="text-xs text-[var(--text-tertiary)] mb-5">
          Manually upgrade or downgrade subscriptions for custom enterprise agreements or billing overrides.
        </p>

        {assignError && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
            {assignError}
          </div>
        )}
        {assignSuccess && (
          <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">
            {assignSuccess}
          </div>
        )}

        <form onSubmit={handleAssignSubmit} className="flex flex-col md:flex-row gap-4 items-end max-w-3xl">
          <div className="flex-1 w-full">
            <label className="input-label">Select Tenant Workspace</label>
            <div className="relative">
              <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
              <select
                value={selectedTenantId}
                onChange={(e) => setSelectedTenantId(e.target.value)}
                className="input-field !pl-10 !py-2 text-sm"
              >
                <option value="">-- Choose Workspace --</option>
                {tenants.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} (Current: {t.plan})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="w-full md:w-64">
            <label className="input-label">Target Subscription Plan</label>
            <div className="relative">
              <Layers className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
              <select
                value={selectedPlanType}
                onChange={(e) => setSelectedPlanType(e.target.value)}
                className="input-field !pl-10 !py-2 text-sm"
              >
                <option value="FREE">Free</option>
                <option value="STARTER">Starter</option>
                <option value="PRO">Pro</option>
                <option value="ENTERPRISE">Enterprise</option>
              </select>
            </div>
          </div>

          <button type="submit" disabled={isAssigning} className="btn-primary text-sm py-2 px-6 shrink-0 w-full md:w-auto justify-center">
            {isAssigning ? <Loader2 className="w-4 h-4 animate-spin" /> : "Apply Subscription"}
          </button>
        </form>
      </div>

      {/* Modal: Edit Pricing Plans configuration */}
      {editOpen && selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl shadow-2xl p-5 space-y-4 animate-fade-in-scale max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-primary)]">
              <div>
                <h3 className="text-base font-bold text-[var(--text-primary)]">Edit Pricing Plan: {selectedPlan.name}</h3>
                <p className="text-xs text-[var(--text-tertiary)]">Adjust thresholds, limits and monthly rates</p>
              </div>
              <button
                onClick={() => setEditOpen(false)}
                className="p-1.5 rounded-lg hover:bg-[var(--bg-glass-hover)] text-[var(--text-secondary)] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="input-label">Plan Display Name</label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="input-field !py-2 text-sm font-semibold"
                    required
                  />
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="input-label">Price / Mo ($)</label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                      <input
                        type="number"
                        step="0.01"
                        value={editForm.priceMonthly}
                        onChange={(e) => setEditForm({ ...editForm, priceMonthly: e.target.value })}
                        className="input-field !pl-8 !py-2 text-sm"
                        required
                      />
                    </div>
                  </div>
                  <div className="flex-1">
                    <label className="input-label">Price / Yr ($)</label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                      <input
                        type="number"
                        step="0.01"
                        value={editForm.priceYearly}
                        onChange={(e) => setEditForm({ ...editForm, priceYearly: e.target.value })}
                        className="input-field !pl-8 !py-2 text-sm"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="input-label">Chatbots Allocation</label>
                  <input
                    type="number"
                    value={editForm.chatbotLimit}
                    onChange={(e) => setEditForm({ ...editForm, chatbotLimit: e.target.value })}
                    className="input-field !py-2 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="input-label">Team Members Allocation</label>
                  <input
                    type="number"
                    value={editForm.teamMemberLimit}
                    onChange={(e) => setEditForm({ ...editForm, teamMemberLimit: e.target.value })}
                    className="input-field !py-2 text-sm"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="input-label">Monthly Token Allocation</label>
                  <input
                    type="number"
                    value={editForm.tokenLimit}
                    onChange={(e) => setEditForm({ ...editForm, tokenLimit: e.target.value })}
                    className="input-field !py-2 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="input-label">Monthly Leads Allocation</label>
                  <input
                    type="number"
                    value={editForm.leadLimit}
                    onChange={(e) => setEditForm({ ...editForm, leadLimit: e.target.value })}
                    className="input-field !py-2 text-sm"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="input-label">Plan Features (comma-separated)</label>
                <input
                  type="text"
                  value={editForm.features}
                  onChange={(e) => setEditForm({ ...editForm, features: e.target.value })}
                  className="input-field !py-2.5 text-xs text-[var(--text-secondary)]"
                  placeholder="e.g. 5 Chatbots, 1000 Leads, Dedicated Support"
                  required
                />
              </div>

              <div className="flex items-center gap-3 pt-6 border-t border-[var(--border-primary)] mt-6">
                <button
                  type="button"
                  onClick={() => setEditOpen(false)}
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
                    "Save Plan Limits"
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
