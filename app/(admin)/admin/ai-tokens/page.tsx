import prisma from "@/lib/db/prisma";
import { Cpu, MessageSquare, PhoneCall, Volume2, DollarSign } from "lucide-react";
import AIUsageCharts from "@/components/admin/AIUsageCharts";

export default async function AdminAITokensPage() {

  // Parallel database aggregates
  const [
    llmAggregate,
    sttAggregate,
    ttsAggregate,
    totalAggregate,
    providerGroup,
    dailyStats,
  ] = await Promise.all([
    // LLM Aggregates
    prisma.usageRecord.aggregate({
      where: { requestType: "LLM" },
      _sum: { inputTokens: true, outputTokens: true, totalTokens: true, cost: true },
      _count: { id: true },
    }),
    // STT Aggregates
    prisma.usageRecord.aggregate({
      where: { requestType: "STT" },
      _sum: { audioDuration: true, cost: true },
      _count: { id: true },
    }),
    // TTS Aggregates
    prisma.usageRecord.aggregate({
      where: { requestType: "TTS" },
      _sum: { characterCount: true, cost: true },
      _count: { id: true },
    }),
    // Total Aggregates
    prisma.usageRecord.aggregate({
      _sum: { cost: true },
    }),
    // Group by Provider
    prisma.usageRecord.groupBy({
      by: ["provider"],
      _sum: { cost: true },
    }),
    // Daily Stats for last 30 days — only fetch needed chart fields
    prisma.dailyStats.findMany({
      where: {
        date: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      },
      select: {
        date: true,
        totalTokens: true,
        sttDuration: true,
        ttsCharacters: true,
        totalCost: true,
      },
      orderBy: { date: "asc" },
    }),
  ]);

  // Roll up statistics for display cards
  const llmCost = llmAggregate._sum.cost || 0;
  const sttCost = sttAggregate._sum.cost || 0;
  const ttsCost = ttsAggregate._sum.cost || 0;
  const totalCost = totalAggregate._sum.cost || 0;

  const totalTokens = llmAggregate._sum.totalTokens || 0;
  const sttMinutes = (sttAggregate._sum.audioDuration || 0) / 60;
  const ttsCharacters = ttsAggregate._sum.characterCount || 0;

  // Format Provider Expense Breakdown
  const providerData = providerGroup.map((pg) => ({
    name: pg.provider,
    value: pg._sum.cost || 0,
  }));

  // Process timeline data for 30 days
  const dailyMap = new Map<
    string,
    { date: string; tokens: number; voiceSeconds: number; voiceChars: number; cost: number }
  >();

  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    dailyMap.set(dateStr, {
      date: dateStr,
      tokens: 0,
      voiceSeconds: 0,
      voiceChars: 0,
      cost: 0,
    });
  }

  dailyStats.forEach((ds) => {
    const dateStr = new Date(ds.date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const dayData = dailyMap.get(dateStr);
    if (dayData) {
      dayData.tokens += Math.floor(ds.totalTokens / 1000); // Scale down for graph readability
      dayData.voiceSeconds += Math.floor(ds.sttDuration);
      dayData.voiceChars += Math.floor(ds.ttsCharacters / 10); // Scale down
      dayData.cost += ds.totalCost;
    }
  });

  const timelineData = Array.from(dailyMap.values());

  const blocks = [
    {
      title: "Large Language Model (LLM)",
      metrics: [
        { label: "Total Requests", value: (llmAggregate._count.id).toLocaleString() },
        { label: "Input Tokens", value: (llmAggregate._sum.inputTokens || 0).toLocaleString() },
        { label: "Output Tokens", value: (llmAggregate._sum.outputTokens || 0).toLocaleString() },
        { label: "Combined Tokens", value: totalTokens.toLocaleString() },
        { label: "Infrastructure Cost", value: `$${llmCost.toFixed(4)}`, highlight: true },
      ],
      icon: MessageSquare,
      color: "purple",
    },
    {
      title: "Speech-to-Text (STT / Transcription)",
      metrics: [
        { label: "Transcription Calls", value: (sttAggregate._count.id).toLocaleString() },
        { label: "Total Audio Processed", value: `${sttMinutes.toFixed(2)} mins` },
        { label: "Audio Duration (Secs)", value: `${(sttAggregate._sum.audioDuration || 0).toFixed(1)}s` },
        { label: "Infrastructure Cost", value: `$${sttCost.toFixed(4)}`, highlight: true },
      ],
      icon: PhoneCall,
      color: "blue",
    },
    {
      title: "Text-to-Speech (TTS / Synthesis)",
      metrics: [
        { label: "Voice Synthesis Calls", value: (ttsAggregate._count.id).toLocaleString() },
        { label: "Characters Synthesized", value: ttsCharacters.toLocaleString() },
        { label: "Avg Chars / Request", value: ttsAggregate._count.id > 0 ? Math.floor(ttsCharacters / ttsAggregate._count.id).toLocaleString() : "0" },
        { label: "Infrastructure Cost", value: `$${ttsCost.toFixed(4)}`, highlight: true },
      ],
      icon: Volume2,
      color: "cyan",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">AI Infrastructure & Token Consumption</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Track real-time LLM token usage, voice synthesis character metrics, speech-to-text billing, and API expenses.
          </p>
        </div>
        <div className="glass-card p-3 hover:transform-none flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-[var(--brand-pink)]/10 flex items-center justify-center text-[var(--brand-pink)]">
            <DollarSign className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] text-[var(--text-tertiary)] uppercase font-semibold">Total Cost (MTD)</p>
            <p className="text-sm font-extrabold text-[var(--text-primary)]">${totalCost.toFixed(3)}</p>
          </div>
        </div>
      </div>

      {/* Consumption Charts */}
      <AIUsageCharts timelineData={timelineData} providerData={providerData} />

      {/* Breakdown Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {blocks.map((block) => {
          const Icon = block.icon;
          return (
            <div key={block.title} className="glass-card p-5 hover:transform-none flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2.5 mb-4">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{
                      background: `color-mix(in srgb, var(--brand-${block.color}) 12%, transparent)`,
                    }}
                  >
                    <Icon className="w-4.5 h-4.5" style={{ color: `var(--brand-${block.color})` }} />
                  </div>
                  <h3 className="text-sm font-bold text-[var(--text-primary)]">{block.title}</h3>
                </div>

                <div className="space-y-2.5">
                  {block.metrics.map((metric) => (
                    <div
                      key={metric.label}
                      className="flex justify-between items-center text-xs pb-1.5 border-b border-[var(--border-primary)]"
                    >
                      <span className="text-[var(--text-secondary)]">{metric.label}</span>
                      <span
                        className={`font-semibold ${
                          metric.highlight ? "text-[var(--brand-pink)] font-bold text-sm" : "text-[var(--text-primary)]"
                        }`}
                      >
                        {metric.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
