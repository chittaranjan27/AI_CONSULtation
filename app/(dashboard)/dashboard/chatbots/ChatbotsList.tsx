"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Bot,
  Plus,
  Search,
  MoreVertical,
  MessageSquare,
  Users,
  Zap,
  Globe,
  Settings,
  Copy,
  Trash2,
  Eye,
  X,
  Loader2,
} from "lucide-react";

interface ChatbotProps {
  id: string;
  name: string;
  description: string | null;
  status: string;
  aiProvider: string;
  model: string;
  language: string;
  conversations: number;
  leads: number;
  conversionRate: string;
}

interface ChatbotsListProps {
  initialChatbots: ChatbotProps[];
}

export default function ChatbotsList({ initialChatbots }: ChatbotsListProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [welcomeMessage, setWelcomeMessage] = useState("");
  const [supportedLanguages, setSupportedLanguages] = useState<string[]>(["en"]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const availableLanguages = [
    { code: "en", name: "English", flag: "🇺🇸" },
    { code: "hi", name: "Hindi", flag: "🇮🇳" },
    { code: "es", name: "Spanish", flag: "🇪🇸" },
    { code: "fr", name: "French", flag: "🇫🇷" },
    { code: "ar", name: "Arabic", flag: "🇸🇦" },
    { code: "ur", name: "Urdu", flag: "🇵🇰" },
    { code: "ja", name: "Japanese", flag: "🇯🇵" },
    { code: "de", name: "German", flag: "🇩🇪" },
    { code: "pt", name: "Portuguese", flag: "🇧🇷" },
    { code: "zh", name: "Chinese", flag: "🇨🇳" },
  ];

  const toggleLanguage = (code: string) => {
    setSupportedLanguages((prev) =>
      prev.includes(code)
        ? prev.filter((l) => l !== code)
        : [...prev, code]
    );
  };

  const filteredBots = initialChatbots.filter(
    (bot) =>
      bot.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (bot.description && bot.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleCreateChatbot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/chatbots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          systemPrompt,
          welcomeMessage,
          supportedLanguages,
        }),
      });

      if (res.ok) {
        setIsModalOpen(false);
        setName("");
        setDescription("");
        setSystemPrompt("");
        setWelcomeMessage("");
        setSupportedLanguages(["en"]);
        router.refresh();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteChatbot = async (id: string) => {
    if (!confirm("Are you sure you want to delete this chatbot?")) return;

    setIsDeletingId(id);
    try {
      const res = await fetch(`/api/chatbots?id=${id}`, {
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
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">
            Chatbots
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Create and manage your AI consultation assistants
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn-primary text-sm py-2.5 px-5 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Create Chatbot
        </button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-primary)] flex-1 max-w-md">
          <Search className="w-4 h-4 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Search chatbots..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none flex-1"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-[var(--text-tertiary)]">
            {filteredBots.length} chatbot{filteredBots.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Chatbot Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {/* Create New Card */}
        <button
          onClick={() => setIsModalOpen(true)}
          className="glass-card p-6 border-dashed hover:border-purple-500/30 flex flex-col items-center justify-center min-h-[280px] group transition-all"
        >
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Plus className="w-7 h-7 text-[var(--brand-purple)]" />
          </div>
          <p className="text-base font-semibold text-[var(--text-primary)] mb-1">
            Create New Chatbot
          </p>
          <p className="text-sm text-[var(--text-tertiary)] text-center">
            Set up an AI assistant in minutes
          </p>
        </button>

        {/* Chatbot Cards */}
        {filteredBots.map((bot) => (
          <div
            key={bot.id}
            className="glass-card p-0 overflow-hidden hover:transform-none flex flex-col justify-between"
          >
            {/* Card Header & Body */}
            <div className="p-5 flex-1">
              <div className="flex items-start justify-between mb-3 relative">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center">
                    <Bot className="w-5 h-5 text-[var(--brand-purple)]" />
                  </div>
                  <div>
                    <Link href={`/dashboard/chatbots/${bot.id}`} className="text-base font-semibold text-[var(--text-primary)] hover:text-[var(--brand-purple)] transition-colors">
                      {bot.name}
                    </Link>
                    <div className="flex items-center gap-2">
                      <span className="badge badge-emerald text-[10px]">
                        {bot.status}
                      </span>
                      <span className="text-[10px] text-[var(--text-muted)]">
                        {bot.aiProvider} · {bot.model}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="relative">
                  <button
                    onClick={() =>
                      setActiveMenuId(activeMenuId === bot.id ? null : bot.id)
                    }
                    className="p-1.5 rounded-lg hover:bg-[var(--bg-glass-hover)] text-[var(--text-muted)]"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>

                  {/* Dropdown Menu */}
                  {activeMenuId === bot.id && (
                    <div className="absolute right-0 mt-1 w-40 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-primary)] shadow-xl z-20 py-1">
                      <button
                        onClick={() => handleDeleteChatbot(bot.id)}
                        disabled={isDeletingId === bot.id}
                        className="w-full text-left px-4 py-2 text-xs text-red-400 hover:bg-[var(--bg-glass-hover)] flex items-center gap-2"
                      >
                        {isDeletingId === bot.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                        Delete Chatbot
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <p className="text-sm text-[var(--text-secondary)] mb-4 line-clamp-3">
                {bot.description || "No description provided."}
              </p>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3 mt-auto">
                <div className="p-2.5 rounded-lg bg-[var(--bg-tertiary)]">
                  <div className="flex items-center gap-1 text-[var(--text-muted)] mb-1">
                    <MessageSquare className="w-3 h-3" />
                    <span className="text-[10px]">Chats</span>
                  </div>
                  <p className="text-sm font-semibold text-[var(--text-primary)]">
                    {bot.conversations.toLocaleString()}
                  </p>
                </div>
                <div className="p-2.5 rounded-lg bg-[var(--bg-tertiary)]">
                  <div className="flex items-center gap-1 text-[var(--text-muted)] mb-1">
                    <Users className="w-3 h-3" />
                    <span className="text-[10px]">Leads</span>
                  </div>
                  <p className="text-sm font-semibold text-[var(--text-primary)]">
                    {bot.leads}
                  </p>
                </div>
                <div className="p-2.5 rounded-lg bg-[var(--bg-tertiary)]">
                  <div className="flex items-center gap-1 text-[var(--text-muted)] mb-1">
                    <Zap className="w-3 h-3" />
                    <span className="text-[10px]">Conv.</span>
                  </div>
                  <p className="text-sm font-semibold text-[var(--text-primary)]">
                    {bot.conversionRate}%
                  </p>
                </div>
              </div>
            </div>

            {/* Card Footer */}
            <div className="flex items-center justify-between px-5 py-3 border-t border-[var(--border-primary)] bg-[var(--bg-tertiary)]/50">
              <div className="flex items-center gap-1 text-[10px] text-[var(--text-muted)]">
                <Globe className="w-3 h-3" />
                {bot.language.toUpperCase()}
                <span className="mx-1">·</span>
                Active
              </div>
              <div className="flex items-center gap-1">
                <button
                  className="p-1.5 rounded-md hover:bg-[var(--bg-glass-hover)] text-[var(--text-muted)] hover:text-white transition-colors"
                  title="Preview"
                >
                  <Eye className="w-3.5 h-3.5" />
                </button>
                <Link
                  href={`/dashboard/chatbots/${bot.id}`}
                  className="p-1.5 rounded-md hover:bg-[var(--bg-glass-hover)] text-[var(--text-muted)] hover:text-white transition-colors"
                  title="Settings"
                >
                  <Settings className="w-3.5 h-3.5" />
                </Link>
                <button
                  className="p-1.5 rounded-md hover:bg-[var(--bg-glass-hover)] text-[var(--text-muted)] hover:text-white transition-colors"
                  title="Copy Embed"
                  onClick={() => {
                    navigator.clipboard.writeText(
                      `<script src="${window.location.origin}/widget.js" data-chatbot-id="${bot.id}"></script>`
                    );
                    alert("Widget script copied to clipboard!");
                  }}
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Chatbot Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden relative animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-[var(--border-primary)]">
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                Create New Chatbot
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-[var(--bg-glass-hover)] text-[var(--text-muted)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateChatbot} className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--text-secondary)]">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sales Assistant"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-primary)] focus:border-purple-500 outline-none text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--text-secondary)]">
                  Description
                </label>
                <textarea
                  placeholder="What is the purpose of this chatbot?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-primary)] focus:border-purple-500 outline-none text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--text-secondary)]">
                  System Prompt
                </label>
                <textarea
                  placeholder="e.g. You are a professional sales assistant for TechCorp..."
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  rows={3}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-primary)] focus:border-purple-500 outline-none text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--text-secondary)]">
                  Welcome Message
                </label>
                <input
                  type="text"
                  placeholder="Hello! How can I help you today?"
                  value={welcomeMessage}
                  onChange={(e) => setWelcomeMessage(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-primary)] focus:border-purple-500 outline-none text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
                />
              </div>

              {/* Supported Languages */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[var(--text-secondary)] flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5" />
                  Supported Languages
                </label>
                <p className="text-[10px] text-[var(--text-muted)] -mt-1">
                  Select which languages your chatbot should respond in
                </p>
                <div className="flex flex-wrap gap-2">
                  {availableLanguages.map((lang) => {
                    const isSelected = supportedLanguages.includes(lang.code);
                    return (
                      <button
                        key={lang.code}
                        type="button"
                        onClick={() => toggleLanguage(lang.code)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 border ${isSelected
                            ? "bg-purple-500/15 border-purple-500/30 text-purple-300 shadow-[0_0_12px_rgba(139,92,246,0.1)]"
                            : "bg-[var(--bg-tertiary)] border-[var(--border-primary)] text-[var(--text-tertiary)] hover:border-[var(--border-secondary)] hover:text-[var(--text-secondary)]"
                          }`}
                      >
                        <span className="text-sm">{lang.flag}</span>
                        {lang.name}
                        {isSelected && (
                          <span className="w-3.5 h-3.5 rounded-full bg-purple-500/30 flex items-center justify-center ml-0.5">
                            <span className="text-[8px] text-purple-300">✓</span>
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
                {supportedLanguages.length === 0 && (
                  <p className="text-[10px] text-amber-400">Please select at least one language</p>
                )}
              </div>

              {/* Actions */}
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
                  disabled={isSubmitting || !name}
                  className="btn-primary text-sm py-2 px-5 flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Chatbot"
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
