"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Edit2,
  Trash2,
  CheckCircle,
  AlertOctagon,
  X,
  Loader2,
  User,
  Mail,
  Shield,
  Layers,
  Key,
} from "lucide-react";

interface UserRecord {
  id: string;
  name: string | null;
  email: string;
  role: string;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  tenant: {
    name: string;
    slug: string;
  };
}

interface UsersListClientProps {
  initialUsers: UserRecord[];
}

export default function UsersListClient({ initialUsers }: UsersListClientProps) {
  const router = useRouter();
  const [users, setUsers] = useState<UserRecord[]>(initialUsers);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Edit Modal State
  const [editOpen, setEditOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [editForm, setEditForm] = useState({
    name: "",
    role: "SUPPORT_AGENT",
    isActive: true,
    password: "",
  });

  // Action loading indicators
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Filter Logic
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      (u.name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.tenant.name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = roleFilter === "ALL" || u.role === roleFilter;
    const matchesStatus =
      statusFilter === "ALL" ||
      (statusFilter === "ACTIVE" && u.isActive) ||
      (statusFilter === "INACTIVE" && !u.isActive);

    return matchesSearch && matchesRole && matchesStatus;
  });

  // Handle Edit Submit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setIsUpdating(true);
    setErrorMsg("");

    try {
      const res = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editForm.name,
          role: editForm.role,
          isActive: editForm.isActive,
          password: editForm.password || undefined,
        }),
      });
      const data = await res.json();

      if (res.ok) {
        setEditOpen(false);
        // Refresh local state
        setUsers((prev) =>
          prev.map((u) =>
            u.id === selectedUser.id
              ? {
                  ...u,
                  name: editForm.name,
                  role: editForm.role,
                  isActive: editForm.isActive,
                }
              : u
          )
        );
        router.refresh();
      } else {
        setErrorMsg(data.error || "Failed to update user");
      }
    } catch {
      setErrorMsg("An error occurred. Please try again.");
    } finally {
      setIsUpdating(false);
    }
  };

  // Toggle Status
  const handleToggleStatus = async (userRecord: UserRecord) => {
    setActionLoadingId(userRecord.id);
    const newActiveState = !userRecord.isActive;

    try {
      const res = await fetch(`/api/admin/users/${userRecord.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: newActiveState }),
      });

      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userRecord.id ? { ...u, isActive: newActiveState } : u))
        );
        router.refresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Delete User
  const handleDeleteUser = async (userRecord: UserRecord) => {
    if (
      !confirm(
        `Are you sure you want to delete user "${userRecord.name || userRecord.email}"? This action cannot be undone.`
      )
    ) {
      return;
    }
    setActionLoadingId(userRecord.id);

    try {
      const res = await fetch(`/api/admin/users/${userRecord.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setUsers((prev) => prev.filter((u) => u.id !== userRecord.id));
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete user");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case "SUPER_ADMIN":
        return "badge-pink";
      case "TENANT_OWNER":
        return "badge-purple";
      case "MANAGER":
        return "badge-blue";
      case "SUPPORT_AGENT":
        return "badge-cyan";
      default:
        return "badge-amber";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Platform Users</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Global directory of all {users.length} users registered across all workspace tenants.
          </p>
        </div>
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
            placeholder="Search users name, email, workspace..."
            className="bg-transparent text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none flex-1"
          />
        </div>

        {/* Dropdowns */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--text-tertiary)] font-medium">Role:</span>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg text-xs px-3 py-2 text-[var(--text-primary)] outline-none"
            >
              <option value="ALL">All Roles</option>
              <option value="SUPER_ADMIN">Super Admin</option>
              <option value="TENANT_OWNER">Tenant Owner</option>
              <option value="MANAGER">Manager</option>
              <option value="SUPPORT_AGENT">Support Agent</option>
              <option value="ANALYST">Analyst</option>
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
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="glass-card p-0 hover:transform-none overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-[var(--border-primary)] bg-[var(--bg-tertiary)]/30 text-[var(--text-tertiary)]">
                <th className="p-4 font-semibold">User Details</th>
                <th className="p-4 font-semibold">Email</th>
                <th className="p-4 font-semibold">Workspace Tenant</th>
                <th className="p-4 font-semibold">System Role</th>
                <th className="p-4 font-semibold text-center">Status</th>
                <th className="p-4 font-semibold text-center">Last Login</th>
                <th className="p-4 font-semibold text-center">Joined</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-primary)]">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-[var(--text-muted)]">
                    No users match your search criteria.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isLoading = actionLoadingId === u.id;
                  return (
                    <tr
                      key={u.id}
                      className="text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]/20 hover:text-white"
                    >
                      <td className="p-4 font-medium text-[var(--text-primary)]">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500/30 to-blue-500/30 border border-purple-500/20 flex items-center justify-center text-xs font-bold text-[var(--brand-purple)]">
                            {(u.name || u.email).charAt(0).toUpperCase()}
                          </div>
                          <span>{u.name || "Unnamed User"}</span>
                        </div>
                      </td>
                      <td className="p-4 text-xs font-mono">{u.email}</td>
                      <td className="p-4">
                        <span className="font-semibold text-xs text-[var(--text-primary)]">
                          {u.tenant.name}
                        </span>
                        <span className="text-[10px] text-[var(--text-muted)] block">
                          slug: {u.tenant.slug}
                        </span>
                      </td>
                      <td className="p-4">
                        <span
                          className={`badge text-[10px] uppercase font-bold ${getRoleBadgeClass(
                            u.role
                          )}`}
                        >
                          {u.role.replace("_", " ")}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <span
                          className={`badge text-[10px] uppercase font-bold ${
                            u.isActive ? "badge-emerald" : "badge-amber"
                          }`}
                        >
                          {u.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="p-4 text-center text-xs">
                        {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString() : "Never"}
                      </td>
                      <td className="p-4 text-center text-xs">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setSelectedUser(u);
                              setEditForm({
                                name: u.name || "",
                                role: u.role,
                                isActive: u.isActive,
                                password: "",
                              });
                              setErrorMsg("");
                              setEditOpen(true);
                            }}
                            className="p-1.5 rounded-lg bg-[var(--bg-tertiary)] hover:bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-white transition-colors"
                            title="Edit User Details / Role / Password"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleToggleStatus(u)}
                            disabled={isLoading}
                            className={`p-1.5 rounded-lg bg-[var(--bg-tertiary)] hover:bg-[var(--bg-elevated)] transition-colors ${
                              u.isActive
                                ? "text-amber-400 hover:text-amber-300"
                                : "text-emerald-400 hover:text-emerald-300"
                            }`}
                            title={u.isActive ? "Suspend User" : "Activate User"}
                          >
                            {isLoading ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : u.isActive ? (
                              <AlertOctagon className="w-3.5 h-3.5" />
                            ) : (
                              <CheckCircle className="w-3.5 h-3.5" />
                            )}
                          </button>

                          <button
                            onClick={() => handleDeleteUser(u)}
                            disabled={isLoading}
                            className="p-1.5 rounded-lg bg-[var(--bg-tertiary)] hover:bg-red-500/10 text-red-400 hover:text-red-300 transition-colors"
                            title="Delete User"
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

      {/* Slide-over or Modal Panel: Edit User */}
      {editOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-[var(--bg-secondary)] border-l border-[var(--border-primary)] shadow-2xl flex flex-col h-full animate-fade-in-scale">
            {/* Header */}
            <div className="p-5 border-b border-[var(--border-primary)] flex items-center justify-between bg-[var(--bg-tertiary)]/20">
              <div>
                <h2 className="text-base font-bold text-[var(--text-primary)]">Edit User details</h2>
                <p className="text-xs text-[var(--text-tertiary)]">
                  Modify system role, status, or force password reset for {selectedUser.email}
                </p>
              </div>
              <button
                onClick={() => setEditOpen(false)}
                className="p-1.5 rounded-lg hover:bg-[var(--bg-glass-hover)] text-[var(--text-secondary)] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error message */}
            {errorMsg && (
              <div className="mx-5 mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                <AlertOctagon className="w-4 h-4 shrink-0" />
                {errorMsg}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleEditSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
              <div>
                <label className="input-label">User Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="input-field !pl-10 !py-2.5 text-sm"
                    placeholder="User Name"
                  />
                </div>
              </div>

              <div>
                <label className="input-label">Role Authorization</label>
                <div className="relative">
                  <Layers className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                  <select
                    value={editForm.role}
                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                    className="input-field !pl-10 !py-2.5 text-sm"
                  >
                    <option value="SUPER_ADMIN">Super Admin</option>
                    <option value="TENANT_OWNER">Tenant Owner</option>
                    <option value="MANAGER">Manager</option>
                    <option value="SUPPORT_AGENT">Support Agent</option>
                    <option value="ANALYST">Analyst</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="input-label">Account Status</label>
                <div className="relative">
                  <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                  <select
                    value={editForm.isActive ? "ACTIVE" : "INACTIVE"}
                    onChange={(e) =>
                      setEditForm({ ...editForm, isActive: e.target.value === "ACTIVE" })
                    }
                    className="input-field !pl-10 !py-2.5 text-sm"
                  >
                    <option value="ACTIVE">Active (Allowed to sign in)</option>
                    <option value="INACTIVE">Inactive (Suspended from platform)</option>
                  </select>
                </div>
              </div>

              <div className="border-t border-[var(--border-primary)] pt-4 mt-6">
                <h4 className="text-xs font-semibold text-[var(--text-primary)] mb-1">
                  Force Password Update
                </h4>
                <p className="text-[11px] text-[var(--text-tertiary)] mb-3">
                  Leave this field empty unless you explicitly want to override their password.
                </p>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                  <input
                    type="password"
                    value={editForm.password}
                    onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                    className="input-field !pl-10 !py-2.5 text-sm"
                    placeholder="Enter new temporary password"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-6 border-t border-[var(--border-primary)] mt-8">
                <button
                  type="button"
                  onClick={() => setEditOpen(false)}
                  className="btn-secondary text-sm py-2 px-6 flex-1 justify-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="btn-primary text-sm py-2 px-6 flex-1 justify-center"
                >
                  {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
