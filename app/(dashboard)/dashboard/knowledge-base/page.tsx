"use client";
import { FileText, Upload, Globe, Plus } from "lucide-react";

export default function KnowledgeBasePage() {
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Knowledge Base</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">Train your AI with documents, websites, and FAQs</p>
        </div>
        <button className="btn-primary text-sm py-2.5 px-5">
          <Upload className="w-4 h-4" />
          Upload Documents
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { icon: FileText, label: "Documents", count: 12, desc: "PDF, DOCX, TXT, CSV" },
          { icon: Globe, label: "Web Crawls", count: 3, desc: "Websites indexed" },
          { icon: FileText, label: "FAQ Entries", count: 45, desc: "Custom Q&A pairs" },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="glass-card p-5 hover:transform-none">
              <Icon className="w-6 h-6 text-[var(--brand-purple)] mb-3" />
              <p className="text-2xl font-bold text-[var(--text-primary)]">{item.count}</p>
              <p className="text-sm font-medium text-[var(--text-secondary)]">{item.label}</p>
              <p className="text-xs text-[var(--text-tertiary)] mt-1">{item.desc}</p>
            </div>
          );
        })}
      </div>

      <div className="glass-card p-6 hover:transform-none">
        <h3 className="text-base font-semibold text-[var(--text-primary)] mb-4">Recent Documents</h3>
        <div className="space-y-2">
          {[
            { name: "Product Catalog 2024.pdf", size: "2.4 MB", status: "Processed", chunks: 156 },
            { name: "FAQ Document.docx", size: "540 KB", status: "Processed", chunks: 42 },
            { name: "Pricing Guide.txt", size: "12 KB", status: "Processed", chunks: 8 },
            { name: "Support Manual.pdf", size: "5.1 MB", status: "Processing", chunks: 0 },
          ].map((doc, i) => (
            <div key={i} className="flex items-center gap-4 p-3 rounded-lg hover:bg-[var(--bg-glass-hover)] transition-colors">
              <FileText className="w-5 h-5 text-[var(--brand-blue)] shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--text-primary)] truncate">{doc.name}</p>
                <p className="text-xs text-[var(--text-tertiary)]">{doc.size} · {doc.chunks} chunks</p>
              </div>
              <span className={`badge text-[10px] ${doc.status === "Processed" ? "badge-emerald" : "badge-amber"}`}>{doc.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
