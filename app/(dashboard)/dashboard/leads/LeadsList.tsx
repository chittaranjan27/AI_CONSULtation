"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Download,
  Plus,
  Mail,
  Phone,
  MoreVertical,
  X,
  Loader2,
  Trash2,
  Users,
  MapPin,
} from "lucide-react";

interface LeadProp {
  id: string;
  name: string;
  phone: string;
  location?: string;
  score: number;
  status: string;
  source: string;
  created: string;
}

interface ChatbotProp {
  id: string;
  name: string;
}

interface StatProp {
  label: string;
  value: string;
  change: string;
}

interface LeadsListProps {
  initialLeads: LeadProp[];
  chatbots: ChatbotProp[];
  stats: StatProp[];
}

const statusColors: Record<string, string> = {
  new: "badge-blue",
  contacted: "badge-amber",
  qualified: "badge-emerald",
  unqualified: "badge-pink",
  won: "badge-purple",
  lost: "badge-pink",
};

export default function LeadsList({ initialLeads, chatbots, stats }: LeadsListProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState("NEW");
  const [score, setScore] = useState("70");
  const [source, setSource] = useState("Manual");
  const [chatbotId, setChatbotId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredLeads = initialLeads.filter((lead) => {
    const matchesSearch =
      (lead.name && lead.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (lead.phone && lead.phone.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (lead.location && lead.location.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (lead.source && lead.source.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === "all" || lead.status.toLowerCase() === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleExport = () => {
    const headers = ["Name", "Phone", "Location", "Score", "Status", "Source", "Created"];
    const rows = filteredLeads.map((l) => [
      `"${l.name.replace(/"/g, '""')}"`,
      `"${l.phone}"`,
      `"${l.location ? l.location.replace(/"/g, '""') : ""}"`,
      l.score,
      l.status,
      `"${l.source.replace(/"/g, '""')}"`,
      `"${l.created}"`,
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `leads_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !location) return;

    setIsSubmitting(true);
    try {
      const selectedBot = chatbots.find((b) => b.id === chatbotId);
      const leadSource = selectedBot ? selectedBot.name : source;

      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          location,
          phone,
          status,
          score,
          source: leadSource,
          chatbotId: chatbotId || null,
        }),
      });

      if (res.ok) {
        setIsModalOpen(false);
        setName("");
        setLocation("");
        setPhone("");
        setStatus("NEW");
        setScore("70");
        setSource("Manual");
        setChatbotId("");
        router.refresh();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteLead = async (id: string) => {
    if (!confirm("Are you sure you want to delete this lead?")) return;

    setIsDeletingId(id);
    try {
      const res = await fetch(`/api/leads?id=${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        router.refresh();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsDeletingId(null);
      setActiveMenuId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Leads</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">Manage and track your captured leads</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExport}
            disabled={filteredLeads.length === 0}
            className="btn-secondary text-sm py-2.5 px-5 flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="btn-primary text-sm py-2.5 px-5 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Lead
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="glass-card p-4 hover:transform-none">
            <p className="text-xs text-[var(--text-tertiary)]">{stat.label}</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl font-bold text-[var(--text-primary)]">{stat.value}</span>
              <span className="text-xs text-[var(--brand-emerald)]">{stat.change}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-primary)] flex-1 max-w-md">
          <Search className="w-4 h-4 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Search leads..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none flex-1"
          />
        </div>
        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2.5 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-primary)] text-sm text-[var(--text-secondary)] outline-none cursor-pointer focus:border-purple-500"
          >
            <option value="all">All Statuses</option>
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="qualified">Qualified</option>
            <option value="unqualified">Unqualified</option>
            <option value="won">Won</option>
            <option value="lost">Lost</option>
          </select>
          <span className="text-xs text-[var(--text-tertiary)] ml-2">
            {filteredLeads.length} matches
          </span>
        </div>
      </div>

      {filteredLeads.length === 0 ? (
        <div className="glass-card p-12 text-center space-y-3 hover:transform-none">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mx-auto mb-2">
            <Users className="w-6 h-6 text-[var(--brand-blue)]" />
          </div>
          <p className="text-base font-semibold text-[var(--text-primary)]">No leads found</p>
          <p className="text-sm text-[var(--text-tertiary)] max-w-sm mx-auto">
            {initialLeads.length === 0
              ? "When visitors interact with your chatbots and provide contact details, qualified leads will populate here."
              : "No leads match your search criteria. Try modifying your search query or status filter."}
          </p>
        </div>
      ) : (
        <div className="glass-card overflow-hidden hover:transform-none">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border-primary)] bg-[var(--bg-tertiary)]/50">
                  <th className="text-left px-5 py-3 text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">Lead</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">Contact</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">Score</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">Status</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">Source</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">Created</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filteredLeads.map((lead) => (
                  <tr
                    key={lead.id}
                    className="border-b border-[var(--border-primary)] last:border-0 hover:bg-[var(--bg-glass-hover)] cursor-pointer transition-colors"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500/30 to-cyan-500/30 border border-blue-500/20 flex items-center justify-center text-xs font-bold text-[var(--brand-blue)] shrink-0">
                          {lead.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </div>
                        <span className="text-sm font-medium text-[var(--text-primary)]">{lead.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="space-y-0.5">
                        {lead.phone && (
                          <div className="flex items-center gap-1 text-xs text-[var(--text-tertiary)]">
                            <Phone className="w-3 h-3 shrink-0" /> {lead.phone}
                          </div>
                        )}
                        {lead.location && (
                          <div className="flex items-center gap-1 text-xs text-[var(--text-tertiary)] mt-1">
                            <MapPin className="w-3 h-3 shrink-0" /> {lead.location}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 rounded-full bg-[var(--bg-tertiary)] overflow-hidden shrink-0">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${lead.score}%`,
                              background:
                                lead.score >= 80
                                  ? "var(--brand-emerald)"
                                  : lead.score >= 60
                                  ? "var(--brand-amber)"
                                  : "var(--brand-pink)",
                            }}
                          />
                        </div>
                        <span className="text-sm font-medium text-[var(--text-primary)]">{lead.score}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`badge text-[10px] ${statusColors[lead.status.toLowerCase()] || "badge-blue"}`}>
                        {lead.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm text-[var(--text-secondary)]">{lead.source}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm text-[var(--text-tertiary)]">{lead.created}</span>
                    </td>
                    <td className="px-5 py-4 relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenuId(activeMenuId === lead.id ? null : lead.id);
                        }}
                        className="p-1.5 rounded-md hover:bg-[var(--bg-glass-hover)] text-[var(--text-muted)]"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {/* Dropdown Options */}
                      {activeMenuId === lead.id && (
                        <div className="absolute right-5 mt-1 w-32 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-primary)] shadow-xl z-20 py-1">
                          <button
                            onClick={() => handleDeleteLead(lead.id)}
                            disabled={isDeletingId === lead.id}
                            className="w-full text-left px-4 py-2 text-xs text-red-400 hover:bg-[var(--bg-glass-hover)] flex items-center gap-2"
                          >
                            {isDeletingId === lead.id ? (
                              <Loader2 className="w-3 animate-spin" />
                            ) : (
                              <Trash2 className="w-3 h-3" />
                            )}
                            Delete Lead
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Lead Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] w-full max-w-md rounded-2xl shadow-2xl overflow-hidden relative animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-5 border-b border-[var(--border-primary)]">
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">Add New Lead</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-[var(--bg-glass-hover)] text-[var(--text-muted)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateLead} className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--text-secondary)]">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Jane Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-primary)] focus:border-purple-500 outline-none text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--text-secondary)]">
                  Location <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dubai, UAE"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-primary)] focus:border-purple-500 outline-none text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--text-secondary)]">Phone</label>
                <input
                  type="text"
                  placeholder="e.g. +1 555-0199"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-primary)] focus:border-purple-500 outline-none text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-primary)] focus:border-purple-500 outline-none text-sm text-[var(--text-secondary)]"
                  >
                    <option value="NEW">New</option>
                    <option value="CONTACTED">Contacted</option>
                    <option value="QUALIFIED">Qualified</option>
                    <option value="UNQUALIFIED">Unqualified</option>
                    <option value="WON">Won</option>
                    <option value="LOST">Lost</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">Score (0-100)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="70"
                    value={score}
                    onChange={(e) => setScore(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-primary)] focus:border-purple-500 outline-none text-sm text-[var(--text-primary)]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--text-secondary)]">Source Chatbot</label>
                <select
                  value={chatbotId}
                  onChange={(e) => {
                    setChatbotId(e.target.value);
                    if (e.target.value === "") {
                      setSource("Manual");
                    }
                  }}
                  className="w-full px-3 py-2 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-primary)] focus:border-purple-500 outline-none text-sm text-[var(--text-secondary)]"
                >
                  <option value="">Manual Entry (No Chatbot)</option>
                  {chatbots.map((bot) => (
                    <option key={bot.id} value={bot.id}>
                      {bot.name}
                    </option>
                  ))}
                </select>
              </div>

              {chatbotId === "" && (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">Source Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Landing Page Form"
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-primary)] focus:border-purple-500 outline-none text-sm text-[var(--text-primary)]"
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--border-primary)]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn-secondary text-sm py-2 px-4"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !name || !location}
                  className="btn-primary text-sm py-2 px-5 flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    "Add Lead"
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
