"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import {
  MessageSquare,
  Search,
  Download,
  Star,
  Bot,
  Calendar,
  Clock,
  DollarSign,
  Layers,
  ChevronRight,
  Info,
} from "lucide-react";

interface Message {
  id: string;
  role: "USER" | "ASSISTANT" | "SYSTEM";
  content: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  cost: number;
  metadata: unknown;
  createdAt: string;
}

interface Visitor {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  metadata: unknown;
}

interface Chatbot {
  id: string;
  name: string;
  status: string;
}

interface Conversation {
  id: string;
  chatbotId: string;
  status: string;
  rating: number | null;
  feedback: string | null;
  metadata: unknown;
  createdAt: string;
  updatedAt: string;
  startedAt: string;
  endedAt: string | null;
  visitor: Visitor | null;
  chatbot: Chatbot | null;
  messages: Message[];
  usageRecords?: {
    requestType: string;
    cost: number;
    audioDuration?: number;
    characterCount?: number;
  }[];
}

interface ConversationProduct {
  id: string;
  name: string;
  price: number;
  category?: string;
  checkoutUrl?: string;
}

interface ConversationsListProps {
  initialConversations: Conversation[];
  chatbots: Chatbot[];
}

const statusColors: Record<string, string> = {
  active: "badge-emerald",
  closed: "badge-blue",
  handoff: "badge-amber",
  archived: "badge-pink",
};

function formatTimeAgo(dateStr: string) {
  const date = new Date(dateStr);
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function ConversationsList({
  initialConversations,
  chatbots,
}: ConversationsListProps) {
  const [selectedBotId, setSelectedBotId] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedRating, setSelectedRating] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedChatId, setSelectedChatId] = useState<string | null>(
    initialConversations[0]?.id || null
  );
  const [activeView, setActiveView] = useState<"overview" | "timeline" | "transcript">("overview");

  const transcriptContainerRef = useRef<HTMLDivElement>(null);

  // Dynamic grouping counter for chatbots
  const botConversationsCounts = useMemo(() => {
    const counts: Record<string, number> = { all: initialConversations.length };
    initialConversations.forEach((c) => {
      counts[c.chatbotId] = (counts[c.chatbotId] || 0) + 1;
    });
    return counts;
  }, [initialConversations]);

  // Main Filter Logic
  const filteredConversations = useMemo(() => {
    return initialConversations.filter((c) => {
      const matchBot = selectedBotId === "all" || c.chatbotId === selectedBotId;
      const matchStatus = selectedStatus === "all" || c.status.toLowerCase() === selectedStatus;

      let matchRating = true;
      if (selectedRating !== "all") {
        if (selectedRating === "rated") {
          matchRating = c.rating !== null;
        } else {
          matchRating = c.rating === Number(selectedRating);
        }
      }

      const search = searchTerm.toLowerCase();
      const visitorName = (
        c.visitor?.name ||
        c.visitor?.email?.split("@")[0] ||
        "Anonymous"
      ).toLowerCase();
      const visitorEmail = (c.visitor?.email || "").toLowerCase();
      const visitorPhone = (c.visitor?.phone || "").toLowerCase();
      const matchSearch =
        !searchTerm ||
        visitorName.includes(search) ||
        visitorEmail.includes(search) ||
        visitorPhone.includes(search) ||
        c.messages.some((m) => m.content.toLowerCase().includes(search));

      return matchBot && matchStatus && matchRating && matchSearch;
    });
  }, [initialConversations, selectedBotId, selectedStatus, selectedRating, searchTerm]);

  // Fallback selector matching currently filtered list first item
  const activeConversation = useMemo(() => {
    const found = filteredConversations.find((c) => c.id === selectedChatId);
    return found || filteredConversations[0] || null;
  }, [filteredConversations, selectedChatId]);

  // Auto-scroll transcript container to bottom
  useEffect(() => {
    if (activeView === "transcript" && transcriptContainerRef.current) {
      const container = transcriptContainerRef.current;
      container.scrollTop = container.scrollHeight;
    }
  }, [activeConversation?.id, activeView]);

  // Scroll into view on mobile/tablet viewports when selectedBotId changes
  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 1024 && selectedBotId) {
      const panel = document.getElementById("conversation-inbox-list");
      if (panel) {
        panel.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  }, [selectedBotId]);

  // Scroll into view on mobile/tablet viewports when selectedChatId changes
  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 1024 && selectedChatId) {
      const panel = document.getElementById("conversation-detail-panel");
      if (panel) {
        panel.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  }, [selectedChatId]);

  // Export CSV of currently filtered list
  const handleExport = () => {
    const headers = [
      "Conversation ID",
      "Visitor Name",
      "Visitor Email",
      "Visitor Phone",
      "Chatbot Name",
      "Started At",
      "Messages Count",
      "Status",
      "Rating",
      "Feedback",
    ];
    const rows = filteredConversations.map((c) => [
      `"${c.id}"`,
      `"${(c.visitor?.name || "Anonymous Visitor").replace(/"/g, '""')}"`,
      `"${(c.visitor?.email || "").replace(/"/g, '""')}"`,
      `"${(c.visitor?.phone || "").replace(/"/g, '""')}"`,
      `"${(c.chatbot?.name || "").replace(/"/g, '""')}"`,
      `"${new Date(c.createdAt).toLocaleString()}"`,
      c.messages.length,
      `"${c.status}"`,
      c.rating || "N/A",
      `"${(c.feedback || "").replace(/"/g, '""')}"`,
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `conversations_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper metadata extractions
  const getVisitorMetadata = (visitor: Visitor | null) => {
    if (!visitor || !visitor.metadata) return null;
    try {
      return typeof visitor.metadata === "string"
        ? JSON.parse(visitor.metadata)
        : visitor.metadata;
    } catch {
      return null;
    }
  };

  const getConversationDuration = (c: Conversation) => {
    const start = new Date(c.startedAt || c.createdAt).getTime();
    const end = c.endedAt ? new Date(c.endedAt).getTime() : new Date(c.updatedAt).getTime();
    const diffSeconds = Math.max(1, Math.floor((end - start) / 1000));

    if (diffSeconds < 60) return `${diffSeconds}s`;
    const minutes = Math.floor(diffSeconds / 60);
    const seconds = diffSeconds % 60;
    return `${minutes}m ${seconds}s`;
  };

  const getMessageProducts = (msg: Message) => {
    if (!msg.metadata) return null;
    try {
      const meta = typeof msg.metadata === "string" ? JSON.parse(msg.metadata) : msg.metadata;
      return Array.isArray(meta?.products) ? meta.products : null;
    } catch {
      return null;
    }
  };

  const getMessageSuggestions = (msg: Message) => {
    if (!msg.metadata) return null;
    try {
      const meta = typeof msg.metadata === "string" ? JSON.parse(msg.metadata) : msg.metadata;
      return Array.isArray(meta?.suggestions) ? meta.suggestions : null;
    } catch {
      return null;
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Conversations</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Group chatbot interactions, monitor client surveys, and audit RAG pipeline transcripts.
          </p>
        </div>
        <button
          onClick={handleExport}
          disabled={filteredConversations.length === 0}
          className="btn-secondary text-sm py-2.5 px-5 flex items-center gap-2 self-start sm:self-center"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Main Split Screen Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:h-[calc(100vh-230px)] lg:min-h-[650px]">
        {/* Panel 1: Chatbots Left Bar (col-span-3) */}
        <div className="lg:col-span-3 flex flex-col bg-[var(--bg-secondary)]/50 border border-[var(--border-primary)] rounded-2xl overflow-hidden lg:h-full">
          <div className="p-4 border-b border-[var(--border-primary)] bg-[var(--bg-tertiary)]/30">
            <h3 className="text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider">
              Chatbots Grouping
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            <button
              onClick={() => setSelectedBotId("all")}
              className={`w-full flex items-center justify-between p-3 rounded-xl text-left text-xs font-semibold transition-all ${selectedBotId === "all"
                  ? "bg-[var(--brand-purple)]/10 border border-[var(--brand-purple)]/30 text-[var(--brand-purple)]"
                  : "bg-transparent hover:bg-[var(--bg-glass-hover)] border border-transparent text-[var(--text-secondary)]"
                }`}
            >
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                <span>All Chatbots</span>
              </div>
              <span className="text-[9px] font-bold bg-[var(--bg-elevated)] px-2 py-0.5 rounded-full border border-[var(--border-primary)]">
                {botConversationsCounts.all || 0}
              </span>
            </button>
            {chatbots.map((bot) => (
              <button
                key={bot.id}
                onClick={() => setSelectedBotId(bot.id)}
                className={`w-full flex items-center justify-between p-3 rounded-xl text-left text-xs font-semibold transition-all ${selectedBotId === bot.id
                    ? "bg-[var(--brand-purple)]/10 border border-[var(--brand-purple)]/30 text-[var(--brand-purple)]"
                    : "bg-transparent hover:bg-[var(--bg-glass-hover)] border border-transparent text-[var(--text-secondary)]"
                  }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Bot className="w-4 h-4 shrink-0" />
                  <span className="truncate">{bot.name}</span>
                </div>
                <span className="text-[9px] font-bold bg-[var(--bg-elevated)] px-2 py-0.5 rounded-full border border-[var(--border-primary)] shrink-0">
                  {botConversationsCounts[bot.id] || 0}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Panel 2: Inbox Stream List (col-span-4) */}
        <div id="conversation-inbox-list" className="lg:col-span-4 flex flex-col bg-[var(--bg-secondary)]/50 border border-[var(--border-primary)] rounded-2xl overflow-hidden lg:h-full">
          {/* Filters area */}
          <div className="p-3 border-b border-[var(--border-primary)] bg-[var(--bg-tertiary)]/20 space-y-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-[var(--text-muted)]" />
              <input
                type="text"
                placeholder="Search visitor, email, message..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-[var(--bg-tertiary)] border border-[var(--border-primary)] text-[var(--text-primary)] outline-none focus:border-[var(--brand-purple)] transition-all placeholder:text-[var(--text-muted)]"
              />
            </div>

            {/* Filter selectors */}
            <div className="grid grid-cols-2 gap-2">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full p-2 rounded-xl text-[10px] bg-[var(--bg-tertiary)] border border-[var(--border-primary)] text-[var(--text-secondary)] outline-none cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="closed">Closed</option>
                <option value="handoff">Handoff</option>
                <option value="archived">Archived</option>
              </select>
              <select
                value={selectedRating}
                onChange={(e) => setSelectedRating(e.target.value)}
                className="w-full p-2 rounded-xl text-[10px] bg-[var(--bg-tertiary)] border border-[var(--border-primary)] text-[var(--text-secondary)] outline-none cursor-pointer"
              >
                <option value="all">All Ratings</option>
                <option value="rated">Any Rated</option>
                <option value="5">5 Stars</option>
                <option value="4">4 Stars</option>
                <option value="3">3 Stars</option>
                <option value="2">2 Stars</option>
                <option value="1">1 Star</option>
              </select>
            </div>
          </div>

          {/* Conversation stream list container */}
          <div className="flex-1 overflow-y-auto p-2.5 space-y-2 lg:max-h-none max-h-[450px]">
            {filteredConversations.length === 0 ? (
              <div className="text-center py-12">
                <Info className="w-6 h-6 mx-auto mb-2 text-[var(--text-muted)]" />
                <p className="text-xs text-[var(--text-secondary)] font-semibold">
                  No matches found
                </p>
                <p className="text-[10px] text-[var(--text-muted)] mt-1">
                  Try clearing filters or search queries.
                </p>
              </div>
            ) : (
              filteredConversations.map((c) => {
                const visitorName =
                  c.visitor?.name || c.visitor?.email?.split("@")[0] || "Anonymous Visitor";
                const isSelected = activeConversation?.id === c.id;
                const latestMsgObj = c.messages[c.messages.length - 1];
                const latestMsg = latestMsgObj ? latestMsgObj.content : "No messages yet";
                const latestRole = latestMsgObj
                  ? latestMsgObj.role === "USER"
                    ? "You: "
                    : "AI: "
                  : "";

                return (
                  <div
                    key={c.id}
                    onClick={() => setSelectedChatId(c.id)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col gap-2 relative ${isSelected
                        ? "bg-[var(--brand-purple)]/10 border-[var(--brand-purple)]/40 shadow-sm"
                        : "bg-[var(--bg-tertiary)]/50 border-[var(--border-primary)] hover:border-[var(--border-secondary)]"
                      }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0 flex items-center gap-2">
                        {/* Gradient Initials Avatar */}
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-purple-500/10 flex items-center justify-center text-[10px] font-bold text-[var(--brand-purple)] shrink-0">
                          {visitorName
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .slice(0, 2)
                            .toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-[var(--text-primary)] truncate">
                            {visitorName}
                          </p>
                          <p className="text-[9px] text-[var(--text-tertiary)] truncate">
                            {c.chatbot?.name || "AI Agent"}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className="text-[9px] text-[var(--text-muted)]">
                          {formatTimeAgo(c.createdAt)}
                        </span>
                        <span
                          className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full badge ${statusColors[c.status.toLowerCase()] || "badge-blue"
                            }`}
                        >
                          {c.status.toUpperCase()}
                        </span>
                      </div>
                    </div>

                    {/* Preview line */}
                    <p className="text-[10px] text-[var(--text-secondary)] line-clamp-1 italic">
                      <span className="font-semibold not-italic text-[var(--text-tertiary)]">
                        {latestRole}
                      </span>
                      &ldquo;{latestMsg}&rdquo;
                    </p>

                    {/* Bottom Stats Line */}
                    <div className="flex items-center justify-between text-[9px] text-[var(--text-muted)] pt-1.5 border-t border-[var(--border-primary)]/40">
                      <span>{c.messages.length} messages</span>
                      {c.rating && (
                        <span className="flex items-center gap-0.5 text-[var(--brand-amber)] font-bold">
                          <Star className="w-2.5 h-2.5 fill-current" /> {c.rating}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Panel 3: Selected Conversation Detail Reader (col-span-5) */}
        <div id="conversation-detail-panel" className="lg:col-span-5 flex flex-col bg-[var(--bg-secondary)]/50 border border-[var(--border-primary)] rounded-2xl overflow-hidden lg:h-full">
          {!activeConversation ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3">
              <MessageSquare className="w-10 h-10 text-[var(--text-muted)] animate-pulse" />
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                Select a conversation
              </h3>
              <p className="text-xs text-[var(--text-tertiary)] max-w-sm">
                Click on any session in the list to drill down into logs, transcripts, and capture data.
              </p>
            </div>
          ) : (
            <div className="flex flex-col h-full divide-y divide-[var(--border-primary)]">
              {/* Header block */}
              <div className="p-4 bg-[var(--bg-tertiary)]/40 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-bold text-[var(--text-primary)]">
                      {activeConversation.visitor?.name ||
                        activeConversation.visitor?.email ||
                        "Anonymous Visitor"}
                    </h4>
                    <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
                      Bot: <strong>{activeConversation.chatbot?.name}</strong> · ID:{" "}
                      <span className="font-mono text-[9px]">{activeConversation.id}</span>
                    </p>
                  </div>

                  {/* Tabs selector */}
                  <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-primary)] shrink-0 self-start sm:self-center">
                    {[
                      { id: "overview", label: "Overview" },
                      { id: "timeline", label: "Timeline" },
                      { id: "transcript", label: "Transcript" },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() =>
                          setActiveView(tab.id as "overview" | "timeline" | "transcript")
                        }
                        className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${activeView === tab.id
                            ? "bg-[var(--brand-purple)] text-white shadow-sm"
                            : "text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                          }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sub headers stats details */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-[var(--border-primary)]/40 text-[9px] text-[var(--text-secondary)]">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-[var(--text-muted)]" />
                    <span className="truncate">
                      {new Date(activeConversation.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-[var(--text-muted)]" />
                    <span>{getConversationDuration(activeConversation)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <DollarSign className="w-3 h-3 text-[var(--text-muted)]" />
                    <span>
                      ${(() => {
                        const llmCost = activeConversation.messages.reduce((sum, m) => sum + (Number(m.cost) || 0), 0);
                        const voiceCost = activeConversation.usageRecords?.reduce((sum, r) => sum + (Number(r.cost) || 0), 0) || 0;
                        return (llmCost + voiceCost).toFixed(4);
                      })()}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Layers className="w-3 h-3 text-[var(--text-muted)]" />
                    <span>
                      Step{" "}
                      {(() => {
                        const metadata = activeConversation.metadata;
                        const meta = typeof metadata === "string"
                          ? JSON.parse(metadata || "{}")
                          : metadata;
                        return String(meta?.currentStep || 1);
                      })()}
                    </span>
                  </div>
                </div>
              </div>

              {/* View 1: Overview Panel */}
              {activeView === "overview" && (
                <div className="flex-1 p-4 space-y-4 overflow-y-auto lg:max-h-none max-h-[400px]">
                  {/* Lead details */}
                  <div className="space-y-1.5">
                    <h5 className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider">
                      Lead Contact Info
                    </h5>
                    <div className="p-3 rounded-xl bg-[var(--bg-tertiary)]/50 border border-[var(--border-primary)] grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div>
                        <span className="text-[9px] text-[var(--text-muted)] block">Name</span>
                        <span className="text-[var(--text-secondary)] truncate block font-medium">
                          {activeConversation.visitor?.name || "Not captured"}
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] text-[var(--text-muted)] block">Email</span>
                        <span className="text-[var(--text-secondary)] truncate block font-medium">
                          {activeConversation.visitor?.email || "Not captured"}
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] text-[var(--text-muted)] block">Phone</span>
                        <span className="text-[var(--text-secondary)] truncate block font-medium">
                          {activeConversation.visitor?.phone || "Not captured"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Browser/Geo Metadata */}
                  {(() => {
                    const meta = getVisitorMetadata(activeConversation.visitor);
                    if (!meta) return null;
                    return (
                      <div className="space-y-1.5">
                        <h5 className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider">
                          Browser & Device metadata
                        </h5>
                        <div className="p-3 rounded-xl bg-[var(--bg-tertiary)]/50 border border-[var(--border-primary)] grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          <div>
                            <span className="text-[9px] text-[var(--text-muted)] block">Referrer URL</span>
                            <span className="text-[var(--text-secondary)] truncate block" title={String(meta?.referrer || "")}>
                              {String(meta?.referrer || "Direct Visit")}
                            </span>
                          </div>
                          <div>
                            <span className="text-[9px] text-[var(--text-muted)] block">User Agent</span>
                            <span className="text-[var(--text-secondary)] truncate block" title={String(meta?.userAgent || "")}>
                              {String(meta?.userAgent || "Unknown Browser")}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Survey Rating and Comments */}
                  {(activeConversation.rating || activeConversation.feedback) && (
                    <div className="space-y-1.5">
                      <h5 className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider">
                        Exit Survey Feedback
                      </h5>
                      <div className="p-3 rounded-xl bg-[var(--bg-tertiary)]/50 border border-[var(--border-primary)] space-y-2 text-xs">
                        {activeConversation.rating && (
                          <div className="flex items-center gap-1.5">
                            <span className="text-[9px] text-[var(--text-muted)]">Exit Rating:</span>
                            <div className="flex items-center gap-0.5 text-[var(--brand-amber)]">
                              {Array.from({ length: activeConversation.rating }).map((_, i) => (
                                <Star key={i} className="w-3.5 h-3.5 fill-current shrink-0" />
                              ))}
                            </div>
                          </div>
                        )}
                        {activeConversation.feedback && (
                          <div>
                            <span className="text-[9px] text-[var(--text-muted)] block">Comments:</span>
                            <p className="text-[var(--text-secondary)] italic leading-relaxed">
                              &ldquo;{activeConversation.feedback}&rdquo;
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Token & cost diagnostics */}
                  <div className="space-y-1.5">
                    <h5 className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider">
                      Model Usage Diagnostics
                    </h5>
                    <div className="p-3 rounded-xl bg-[var(--bg-tertiary)]/50 border border-[var(--border-primary)] space-y-2 text-xs text-[var(--text-secondary)]">
                      <div className="flex justify-between items-center text-[10px] text-[var(--text-muted)]">
                        <span>Total Tokens</span>
                        <span>Prompt / Completion</span>
                      </div>
                      <div className="flex justify-between items-center font-bold">
                        <span>
                          {activeConversation.messages
                            .reduce((sum, m) => sum + m.totalTokens, 0)
                            .toLocaleString()}
                        </span>
                        <span>
                          {activeConversation.messages
                            .reduce((sum, m) => sum + m.inputTokens, 0)
                            .toLocaleString()}{" "}
                          /{" "}
                          {activeConversation.messages
                            .reduce((sum, m) => sum + m.outputTokens, 0)
                            .toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Voice Assistant Metrics */}
                  {activeConversation.usageRecords && activeConversation.usageRecords.length > 0 && (
                    <div className="space-y-1.5 animate-fade-in-up">
                      <h5 className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider">
                        Voice Assistant Metrics
                      </h5>
                      <div className="p-3 rounded-xl bg-[var(--bg-tertiary)]/50 border border-[var(--border-primary)] space-y-3 text-xs text-[var(--text-secondary)]">
                        {(() => {
                          const sttRecords = activeConversation.usageRecords?.filter((r) => r.requestType === "STT") || [];
                          const ttsRecords = activeConversation.usageRecords?.filter((r) => r.requestType === "TTS") || [];

                          const sttRequests = sttRecords.length;
                          const sttDuration = sttRecords.reduce((sum, r) => sum + (r.audioDuration || 0), 0);
                          const ttsRequests = ttsRecords.length;
                          const ttsCharacters = ttsRecords.reduce((sum, r) => sum + (r.characterCount || 0), 0);
                          const voiceCost = activeConversation.usageRecords?.reduce((sum, r) => sum + (r.cost || 0), 0) || 0;
                          const llmCost = activeConversation.messages.reduce((sum, m) => sum + (Number(m.cost) || 0), 0);

                          return (
                            <>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <span className="text-[9px] text-[var(--text-muted)] block">STT Requests & Duration</span>
                                  <span className="font-semibold text-[var(--text-primary)]">
                                    {sttRequests} reqs · {Math.round(sttDuration)}s
                                  </span>
                                </div>
                                <div>
                                  <span className="text-[9px] text-[var(--text-muted)] block">TTS Requests & Chars</span>
                                  <span className="font-semibold text-[var(--text-primary)]">
                                    {ttsRequests} reqs · {ttsCharacters.toLocaleString()}
                                  </span>
                                </div>
                              </div>
                              <div className="pt-2 border-t border-[var(--border-primary)]/40 grid grid-cols-3 gap-2 text-[9px]">
                                <div>
                                  <span className="text-[var(--text-muted)] block">LLM Cost</span>
                                  <span className="font-semibold text-[var(--text-secondary)] font-mono">${llmCost.toFixed(4)}</span>
                                </div>
                                <div>
                                  <span className="text-[var(--text-muted)] block">Voice Cost</span>
                                  <span className="font-semibold text-[var(--text-secondary)] font-mono">${voiceCost.toFixed(4)}</span>
                                </div>
                                <div>
                                  <span className="text-[var(--text-muted)] block">Total Cost</span>
                                  <span className="font-bold text-[var(--brand-emerald)] font-mono">${(llmCost + voiceCost).toFixed(4)}</span>
                                </div>
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* View 2: Flow Timeline Panel */}
              {activeView === "timeline" && (
                <div className="flex-1 p-4 overflow-y-auto lg:max-h-none max-h-[400px] space-y-4 relative before:absolute before:inset-y-0 before:left-8 before:w-0.5 before:bg-[var(--border-primary)]">
                  {/* Session start log */}
                  <div className="flex items-start gap-3 relative">
                    <div className="w-7 h-7 rounded-full bg-[var(--bg-tertiary)] border border-[var(--border-primary)] flex items-center justify-center shrink-0 z-10 text-[9px] font-bold">
                      🚀
                    </div>
                    <div className="p-3 rounded-xl bg-[var(--bg-tertiary)]/30 border border-[var(--border-primary)] text-xs flex-grow">
                      <span className="font-semibold text-[var(--text-primary)] block">
                        Chat Session Initialized
                      </span>
                      <span className="text-[9px] text-[var(--text-muted)] block mt-0.5">
                        Visitor loaded the widget and connected.
                      </span>
                    </div>
                  </div>

                  {/* Parse messages into events */}
                  {activeConversation.messages.map((msg) => {
                    const isUser = msg.role === "USER";
                    const suggestions = getMessageSuggestions(msg);
                    const products = getMessageProducts(msg);

                    if (isUser) {
                      return (
                        <div key={msg.id} className="flex items-start gap-3 relative">
                          <div className="w-7 h-7 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center shrink-0 z-10 text-xs">
                            👤
                          </div>
                          <div className="p-3 rounded-xl bg-[var(--bg-tertiary)]/30 border border-[var(--border-primary)] text-xs flex-grow">
                            <span className="font-semibold text-[var(--text-primary)] block">
                              Visitor Response
                            </span>
                            <p className="text-[var(--text-secondary)] mt-1">{msg.content}</p>
                          </div>
                        </div>
                      );
                    } else {
                      return (
                        <div key={msg.id} className="flex items-start gap-3 relative flex-col">
                          <div className="flex items-start gap-3 w-full">
                            <div className="w-7 h-7 rounded-full bg-purple-500/10 border border-purple-500/30 flex items-center justify-center shrink-0 z-10 text-xs">
                              🤖
                            </div>
                            <div className="p-3 rounded-xl bg-[var(--bg-tertiary)]/30 border border-[var(--border-primary)] text-xs flex-grow">
                              <span className="font-semibold text-[var(--text-primary)] block">
                                AI Agent Response
                              </span>
                              <p className="text-[var(--text-secondary)] mt-1 line-clamp-3">
                                {msg.content}
                              </p>

                              {/* Action items presented in timeline logs */}
                              {!!suggestions && (
                                <div className="mt-2 pt-2 border-t border-[var(--border-primary)]/30 flex flex-wrap gap-1">
                                  <span className="text-[8px] text-[var(--text-muted)] mr-1 self-center">
                                    Suggestion chips:
                                  </span>
                                  {suggestions.map((s: string) => (
                                    <span
                                      key={s}
                                      className="px-1.5 py-0.5 rounded bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-[8px] text-[var(--text-secondary)]"
                                    >
                                      {s}
                                    </span>
                                  ))}
                                </div>
                              )}

                              {/* Products listed */}
                              {!!products && (
                                <div className="mt-2 pt-2 border-t border-[var(--border-primary)]/30 space-y-1">
                                  <span className="text-[8px] text-[var(--text-muted)] block">
                                    Catalog Recommendations:
                                  </span>
                                  {products.map((prod: unknown) => {
                                    const p = prod as ConversationProduct;
                                    return (
                                      <div
                                        key={p.id}
                                        className="flex items-center justify-between text-[9px] bg-[var(--bg-secondary)] px-2 py-1 rounded"
                                      >
                                        <span className="text-[var(--text-secondary)] truncate max-w-[140px]">
                                          {p.name}
                                        </span>
                                        <span className="text-[var(--brand-emerald)] font-bold">
                                          ${Number(p.price).toFixed(2)}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    }
                  })}

                  {/* Survey event */}
                  {activeConversation.rating && (
                    <div className="flex items-start gap-3 relative">
                      <div className="w-7 h-7 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0 z-10 text-xs">
                        ⭐
                      </div>
                      <div className="p-3 rounded-xl bg-[var(--bg-tertiary)]/30 border border-[var(--border-primary)] text-xs flex-grow">
                        <span className="font-semibold text-[var(--text-primary)] block">
                          Exit Survey Submitted
                        </span>
                        <p className="text-[var(--text-secondary)] mt-1">
                          Visitor submitted a rating of{" "}
                          <strong>{activeConversation.rating} / 5 stars</strong>.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* View 3: Chat Transcript bubbles player */}
              {activeView === "transcript" && (
                <div
                  ref={transcriptContainerRef}
                  className="flex-1 p-4 overflow-y-auto lg:max-h-none max-h-[400px] bg-[var(--bg-secondary)]/30 space-y-4"
                >
                  {activeConversation.messages.map((msg) => {
                    const isUser = msg.role === "USER";
                    const suggestions = getMessageSuggestions(msg);
                    const products = getMessageProducts(msg);

                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
                      >
                        {/* Bubble */}
                        <div
                          className={`max-w-[85%] p-3.5 rounded-2xl text-xs leading-relaxed ${isUser
                              ? "bg-[var(--brand-purple)] text-white rounded-tr-none shadow-sm"
                              : "bg-[var(--bg-tertiary)] border border-[var(--border-primary)] text-[var(--text-primary)] rounded-tl-none"
                            }`}
                        >
                          <p className="whitespace-pre-wrap">{msg.content}</p>

                          {/* Embed Products in assistant transcript blocks */}
                          {!!products && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 pt-2.5 border-t border-[var(--border-primary)]/40">
                              {products.map((prod: unknown) => {
                                const p = prod as ConversationProduct;
                                return (
                                  <div
                                    key={p.id}
                                    className="p-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] flex flex-col justify-between gap-1.5 text-[10px]"
                                  >
                                    <div>
                                      <span className="text-[8px] font-semibold text-[var(--brand-purple)] uppercase tracking-wider block">
                                        {p.category?.replace("_", " ") || "Product"}
                                      </span>
                                      <span className="font-bold text-[var(--text-primary)] block truncate">
                                        {p.name}
                                      </span>
                                    </div>
                                    <div className="flex items-center justify-between mt-1">
                                      <span className="font-bold text-[var(--text-primary)]">
                                        ${Number(p.price).toFixed(2)}
                                      </span>
                                      {p.checkoutUrl && (
                                        <a
                                          href={p.checkoutUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-[9px] text-[var(--brand-purple)] font-bold flex items-center hover:underline shrink-0"
                                        >
                                          Buy <ChevronRight className="w-2.5 h-2.5" />
                                        </a>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {/* Embed suggestion chips under assistant transcript blocks */}
                        {!!suggestions && (
                          <div className="flex flex-wrap gap-1.5 mt-2 max-w-[85%]">
                            {suggestions.map((s: string) => (
                              <button
                                key={s}
                                disabled
                                className="px-3 py-1.5 rounded-full bg-[var(--bg-tertiary)] border border-[var(--border-primary)] text-[10px] text-[var(--text-secondary)] font-medium cursor-not-allowed opacity-80"
                              >
                                {s}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
