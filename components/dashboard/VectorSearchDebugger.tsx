"use client";

import { useState } from "react";
import { Search, Loader2, Database, AlertCircle, FileText, Percent } from "lucide-react";

interface ChatbotOption {
  id: string;
  name: string;
}

interface VectorChunk {
  content: string;
  similarity: number;
  source: string;
}

interface VectorSearchDebuggerProps {
  chatbots: ChatbotOption[];
}

export default function VectorSearchDebugger({ chatbots }: VectorSearchDebuggerProps) {
  const [chatbotId, setChatbotId] = useState(chatbots[0]?.id || "");
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState(5);
  const [similarity, setSimilarity] = useState(0.35);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<VectorChunk[] | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatbotId) {
      setErrorMsg("Please select a chatbot workspace to search against.");
      return;
    }
    if (!query.trim()) {
      setErrorMsg("Please enter a query term.");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    setResults(null);

    try {
      const res = await fetch("/api/knowledge-base/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatbotId,
          query,
          limit,
          similarity,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setResults(data.chunks || []);
      } else {
        setErrorMsg(data.error || "Failed to search vector database");
      }
    } catch {
      setErrorMsg("Failed to connect to search API.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Control Panel Card */}
      <div className="glass-card p-5 hover:transform-none h-fit space-y-4 lg:col-span-1">
        <div>
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">RAG Vector Query Terminal</h3>
          <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5">
            Test semantic matching thresholds and preview content sent to the LLM.
          </p>
        </div>

        <form onSubmit={handleSearch} className="space-y-3.5">
          {/* Chatbot Selector */}
          <div>
            <label className="text-[10px] font-semibold text-[var(--text-secondary)] mb-1 block">Chatbot Knowledge Base</label>
            <select
              value={chatbotId}
              onChange={(e) => setChatbotId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-xs bg-[var(--bg-tertiary)] border border-[var(--border-primary)] text-[var(--text-primary)] outline-none focus:border-[var(--brand-purple)] focus:ring-2 focus:ring-[var(--brand-purple)]/20 transition-all"
            >
              <option value="">-- Choose Chatbot --</option>
              {chatbots.map((bot) => (
                <option key={bot.id} value={bot.id}>
                  {bot.name}
                </option>
              ))}
            </select>
          </div>

          {/* Query Input */}
          <div>
            <label className="text-[10px] font-semibold text-[var(--text-secondary)] mb-1 block">User Query Text</label>
            <div className="relative">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask something to match chunks..."
                className="w-full pl-9 pr-3 py-2 rounded-xl text-xs bg-[var(--bg-tertiary)] border border-[var(--border-primary)] text-[var(--text-primary)] outline-none focus:border-[var(--brand-purple)] focus:ring-2 focus:ring-[var(--brand-purple)]/20 transition-all"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
            </div>
          </div>

          {/* Limit and Similarity Sliders */}
          <div className="grid grid-cols-2 gap-3.5 pt-1">
            <div>
              <label className="text-[10px] font-semibold text-[var(--text-secondary)] mb-1 block">Max Chunks: {limit}</label>
              <input
                type="range"
                min="1"
                max="10"
                step="1"
                value={limit}
                onChange={(e) => setLimit(parseInt(e.target.value))}
                className="w-full accent-[var(--brand-purple)]"
              />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-[var(--text-secondary)] mb-1 block">Threshold: {(similarity * 100).toFixed(0)}%</label>
              <input
                type="range"
                min="0.1"
                max="0.9"
                step="0.05"
                value={similarity}
                onChange={(e) => setSimilarity(parseFloat(e.target.value))}
                className="w-full accent-[var(--brand-purple)]"
              />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary text-xs py-2 px-4 justify-center"
          >
            {loading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                Querying Vectors...
              </>
            ) : (
              <>
                <Database className="w-3.5 h-3.5 mr-1.5" />
                Test Match Context
              </>
            )}
          </button>
        </form>
      </div>

      {/* Results Card */}
      <div className="glass-card p-5 hover:transform-none lg:col-span-2 flex flex-col min-h-[300px]">
        <h4 className="text-sm font-semibold text-[var(--text-primary)] border-b border-[var(--border-primary)] pb-2 mb-4">
          Query Match Results
        </h4>

        {errorMsg && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {errorMsg}
          </div>
        )}

        {loading && (
          <div className="flex-grow flex flex-col items-center justify-center py-10 gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-[var(--brand-purple)]" />
            <span className="text-xs text-[var(--text-secondary)]">Computing cosine similarity matrices...</span>
          </div>
        )}

        {!loading && results === null && (
          <div className="flex-grow flex flex-col items-center justify-center text-center py-10 text-[var(--text-muted)]">
            <Database className="w-8 h-8 mb-2 opacity-50" />
            <p className="text-xs font-semibold">Ready for Query Test</p>
            <p className="text-[10px] text-[var(--text-tertiary)] max-w-xs mt-1">
              Select a chatbot, write a test question, and press query to view matching document chunks.
            </p>
          </div>
        )}

        {!loading && results !== null && results.length === 0 && (
          <div className="flex-grow flex flex-col items-center justify-center text-center py-10 text-amber-400/80">
            <AlertCircle className="w-8 h-8 mb-2 opacity-75" />
            <p className="text-xs font-semibold">No matching segments found</p>
            <p className="text-[10px] text-[var(--text-tertiary)] max-w-xs mt-1">
              Try lower similarity threshold settings or check that your files are fully uploaded and indexed.
            </p>
          </div>
        )}

        {!loading && results && results.length > 0 && (
          <div className="space-y-4 overflow-y-auto max-h-[380px] pr-1">
            {results.map((chunk, index) => (
              <div
                key={index}
                className="p-3.5 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-tertiary)]/40 hover:border-purple-500/20 hover:bg-[var(--bg-tertiary)]/75 transition-all text-xs"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] text-[var(--text-secondary)] font-semibold flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5 text-[var(--brand-blue)] shrink-0" />
                    Source: {chunk.source}
                  </span>
                  <span className={`badge text-[9px] font-bold ${
                    chunk.similarity >= 0.6
                      ? "badge-emerald"
                      : chunk.similarity >= 0.4
                      ? "badge-purple"
                      : "badge-cyan"
                  }`}>
                    Score: {(chunk.similarity * 100).toFixed(1)}%
                  </span>
                </div>
                <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap font-mono select-all p-2 bg-[var(--bg-primary)]/50 rounded-lg border border-[var(--border-primary)]/35">
                  {chunk.content}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
