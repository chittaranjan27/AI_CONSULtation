import { auth } from "@/lib/auth/auth";
import prisma from "@/lib/db/prisma";
import { redirect } from "next/navigation";
import { FileText, Globe, Database, ArrowRight, Plus } from "lucide-react";
import Link from "next/link";
import VectorSearchDebugger from "@/components/dashboard/VectorSearchDebugger";

function formatBytes(bytes: number, decimals = 1) {
  if (!bytes) return "0 B";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

export default async function KnowledgeBasePage() {
  const session = await auth();
  if (!session?.user?.tenantId) {
    redirect("/login");
  }

  const tenantId = session.user.tenantId;

  // Fetch real knowledge base metrics, documents, and chatbots in parallel
  const [documents, docCount, crawlJobsCount, chunksCount, chatbots] = await Promise.all([
    prisma.document.findMany({
      where: { tenantId },
      select: {
        id: true,
        filename: true,
        fileType: true,
        fileSize: true,
        status: true,
        chunkCount: true,
        createdAt: true,
        chatbot: {
          select: { name: true }
        }
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.document.count({ where: { tenantId } }),
    prisma.crawlJob.count({
      where: { chatbot: { tenantId } },
    }),
    prisma.documentChunk.count({
      where: { document: { tenantId } },
    }),
    prisma.chatbot.findMany({
      where: { tenantId },
      select: { id: true, name: true },
    }),
  ]);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Knowledge Base</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">Train your AI models with uploaded documents, website crawls, and articles.</p>
        </div>
        <Link 
          href="/dashboard/chatbots" 
          className="btn-primary text-xs font-semibold py-2.5 px-5 flex items-center gap-2 w-fit"
        >
          <Plus className="w-4 h-4" />
          Train a Chatbot
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { icon: FileText, label: "Total Documents", count: docCount, desc: "PDF, DOCX, TXT, CSV training files" },
          { icon: Globe, label: "Web Crawl Jobs", count: crawlJobsCount, desc: "Indexed websites & public URLs" },
          { icon: Database, label: "Indexed Chunks", count: chunksCount, desc: "Segmented text vectors loaded in RAG" },
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

      {/* Documents List */}
      <div className="glass-card p-6 hover:transform-none">
        <h3 className="text-base font-semibold text-[var(--text-primary)] mb-4">Recent Documents</h3>
        
        {documents.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-[var(--border-primary)] rounded-2xl p-6">
            <FileText className="w-10 h-10 mx-auto text-[var(--text-muted)] mb-3 animate-pulse" />
            <h4 className="text-sm font-bold text-[var(--text-primary)]">No training documents yet</h4>
            <p className="text-xs text-[var(--text-secondary)] mt-1.5 max-w-md mx-auto">
              Your knowledge base is clean! To train your AI, select a chatbot from your workspace and upload documents or index URLs in its editor.
            </p>
            <Link
              href="/dashboard/chatbots"
              className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-[var(--brand-purple)] hover:underline"
            >
              Go to Chatbots <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {documents.map((doc) => (
              <div 
                key={doc.id} 
                className="flex items-center gap-4 p-3 rounded-xl hover:bg-[var(--bg-glass-hover)] transition-colors border border-transparent hover:border-[var(--border-primary)]"
              >
                <FileText className="w-5 h-5 text-[var(--brand-blue)] shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--text-primary)] truncate" title={doc.filename}>{doc.filename}</p>
                  <p className="text-[10px] text-[var(--text-tertiary)] mt-0.5">
                    {formatBytes(doc.fileSize)} · {doc.chunkCount} chunks · Assigned to: <strong className="text-[var(--text-secondary)]">{doc.chatbot?.name || "General"}</strong>
                  </p>
                </div>
                <span className={`badge text-[9px] font-bold ${doc.status === "COMPLETED" ? "badge-emerald" : doc.status === "FAILED" ? "badge-pink" : "badge-amber"}`}>
                  {doc.status.toLowerCase()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Vector Debugger Terminal */}
      {chatbots.length > 0 && (
        <div className="space-y-4">
          <div className="border-t border-[var(--border-primary)]/40 pt-6">
            <h2 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
              <Database className="w-5 h-5 text-[var(--brand-purple)]" />
              Knowledge Debug Console
            </h2>
          </div>
          <VectorSearchDebugger chatbots={chatbots} />
        </div>
      )}
    </div>
  );
}
