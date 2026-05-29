"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import {
  Bot,
  BarChart3,
  Zap,
  Globe,
  Shield,
  Users,
  MessageSquare,
  Brain,
  Workflow,
  Target,
  Palette,
  Code,
} from "lucide-react";

const features = [
  {
    icon: Bot,
    title: "AI Consultation Engine",
    description:
      "Deploy intelligent AI assistants that understand context, guide users through consultations, and provide personalized recommendations.",
    color: "purple",
    gradient: "from-purple-500/20 to-purple-500/5",
  },
  {
    icon: Target,
    title: "Smart Lead Capture",
    description:
      "AI intelligently collects contact information, qualifies leads with scoring, and auto-syncs with your CRM in real-time.",
    color: "blue",
    gradient: "from-blue-500/20 to-blue-500/5",
  },
  {
    icon: BarChart3,
    title: "Advanced Analytics",
    description:
      "Track conversations, leads, conversions, and AI costs with beautiful real-time dashboards and funnel visualization.",
    color: "cyan",
    gradient: "from-cyan-500/20 to-cyan-500/5",
  },
  {
    icon: Brain,
    title: "Custom AI Training",
    description:
      "Train your chatbot on your data — PDFs, documents, websites, FAQs. Powered by RAG architecture for accurate responses.",
    color: "pink",
    gradient: "from-pink-500/20 to-pink-500/5",
  },
  {
    icon: Workflow,
    title: "Visual Workflow Builder",
    description:
      "Create consultation flows with drag-and-drop. Add conditional logic, lead qualification steps, and automated actions.",
    color: "amber",
    gradient: "from-amber-500/20 to-amber-500/5",
  },
  {
    icon: Globe,
    title: "Multilingual Support",
    description:
      "Communicate with customers in 9+ languages with auto-detection, AI translation, and RTL layout support.",
    color: "emerald",
    gradient: "from-emerald-500/20 to-emerald-500/5",
  },
  {
    icon: Palette,
    title: "Full Customization",
    description:
      "Match your brand with custom colors, themes, typography, logos, and chat icons. Dark mode, light mode, or auto.",
    color: "purple",
    gradient: "from-purple-500/20 to-purple-500/5",
  },
  {
    icon: Code,
    title: "Embed Anywhere",
    description:
      "One script tag. Floating widget, inline chat, or full-page embed. Non-blocking async loading, zero performance impact.",
    color: "blue",
    gradient: "from-blue-500/20 to-blue-500/5",
  },
  {
    icon: Shield,
    title: "Enterprise Security",
    description:
      "SOC 2 ready. Rate limiting, API encryption, tenant isolation, RBAC, audit logs, GDPR compliance built-in.",
    color: "cyan",
    gradient: "from-cyan-500/20 to-cyan-500/5",
  },
  {
    icon: Users,
    title: "Team Collaboration",
    description:
      "Invite team members with role-based access. Human agent handoff, conversation assignment, and internal notes.",
    color: "pink",
    gradient: "from-pink-500/20 to-pink-500/5",
  },
  {
    icon: Zap,
    title: "Multi-Provider AI",
    description:
      "Use OpenAI, Anthropic, Gemini, Groq, or OpenRouter. Bring your own keys, switch providers, set fallbacks.",
    color: "amber",
    gradient: "from-amber-500/20 to-amber-500/5",
  },
  {
    icon: MessageSquare,
    title: "Omnichannel Ready",
    description:
      "One AI brain, everywhere. Website, WhatsApp, Telegram, Instagram DM, Facebook Messenger — all from one dashboard.",
    color: "emerald",
    gradient: "from-emerald-500/20 to-emerald-500/5",
  },
];

const colorMap: Record<string, string> = {
  purple: "var(--brand-purple)",
  blue: "var(--brand-blue)",
  cyan: "var(--brand-cyan)",
  pink: "var(--brand-pink)",
  amber: "var(--brand-amber)",
  emerald: "var(--brand-emerald)",
};

export default function FeaturesSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="features" className="section relative" ref={ref}>
      <div className="container-wide">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <div className="badge badge-purple mb-4">Features</div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            Everything You Need to{" "}
            <span className="gradient-text">Convert & Scale</span>
          </h2>
          <p className="text-lg text-[var(--text-secondary)]">
            A complete AI consultation ecosystem. From chatbot creation to lead
            conversion analytics, every tool you need in one platform.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: index * 0.06 }}
              >
                <div className="glass-card p-6 h-full group cursor-default">
                  <div
                    className={`w-11 h-11 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}
                  >
                    <Icon
                      className="w-5 h-5"
                      style={{ color: colorMap[feature.color] }}
                    />
                  </div>
                  <h3 className="text-base font-semibold text-[var(--text-primary)] mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
