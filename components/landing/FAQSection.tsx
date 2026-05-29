"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    q: "How does the AI chatbot work?",
    a: "Our AI chatbots use advanced language models (OpenAI, Anthropic, Gemini, etc.) combined with your custom knowledge base to provide intelligent, context-aware responses. You upload your documents, configure the chatbot's personality, and embed it on your website with a single script tag.",
  },
  {
    q: "Can I use my own AI API keys?",
    a: "Absolutely! You can bring your own API keys for OpenAI, Anthropic, Gemini, Groq, or OpenRouter. This gives you full control over costs and lets you use your preferred AI provider. You can also switch providers or set fallback models at any time.",
  },
  {
    q: "How does the lead capture system work?",
    a: "Our AI intelligently collects lead information during natural conversations — names, emails, phone numbers, requirements, and budget. It uses progressive profiling so users never feel overwhelmed. Each lead gets a qualification score based on engagement and intent signals.",
  },
  {
    q: "Is my data secure and isolated?",
    a: "Yes. We use complete multi-tenant isolation — your data is never mixed with other accounts. All API keys are encrypted at rest using AES-256. We support RBAC, audit logging, rate limiting, GDPR compliance, and SOC 2 ready security controls.",
  },
  {
    q: "Can I embed the chatbot on any website?",
    a: "Yes! Simply copy a script tag and paste it into your website HTML. The widget loads asynchronously and won't slow down your site. You can choose floating, inline, or full-page modes, and fully customize colors, branding, and behavior.",
  },
  {
    q: "What languages are supported?",
    a: "We support 9+ languages including English, Hindi, Kannada, Tamil, Telugu, Arabic, Spanish, French, and German. The system auto-detects language and provides AI responses in the user's preferred language with full RTL support.",
  },
  {
    q: "How does the workflow builder work?",
    a: "Our visual drag-and-drop workflow builder lets you create consultation flows without coding. Add conditional logic, decision trees, lead qualification steps, API triggers, and automated actions. Think of it as a conversation flowchart that your AI follows.",
  },
  {
    q: "Can I switch plans at any time?",
    a: "Yes, you can upgrade or downgrade your plan at any time. Upgrades take effect immediately with prorated billing. Downgrades take effect at the end of your current billing cycle. You can also cancel anytime with no hidden fees.",
  },
];

function FAQItem({ faq, isOpen, onToggle }: { faq: typeof faqs[0]; isOpen: boolean; onToggle: () => void }) {
  return (
    <div
      className={`glass-card overflow-hidden transition-all duration-300 hover:transform-none ${
        isOpen ? "border-purple-500/20" : ""
      }`}
    >
      <button
        onClick={onToggle}
        className="flex items-center justify-between w-full p-5 text-left"
      >
        <span className="text-sm font-medium text-[var(--text-primary)] pr-4">
          {faq.q}
        </span>
        <div
          className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all duration-300 ${
            isOpen
              ? "bg-purple-500/20 rotate-180"
              : "bg-[var(--bg-glass-hover)]"
          }`}
        >
          <ChevronDown className="w-4 h-4 text-[var(--text-secondary)]" />
        </div>
      </button>
      <motion.div
        initial={false}
        animate={{
          height: isOpen ? "auto" : 0,
          opacity: isOpen ? 1 : 0,
        }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        className="overflow-hidden"
      >
        <p className="px-5 pb-5 text-sm text-[var(--text-secondary)] leading-relaxed">
          {faq.a}
        </p>
      </motion.div>
    </div>
  );
}

export default function FAQSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="section relative" ref={ref}>
      <div className="container-wide">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <div className="badge badge-emerald mb-4">FAQ</div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            Frequently Asked{" "}
            <span className="gradient-text">Questions</span>
          </h2>
          <p className="text-lg text-[var(--text-secondary)]">
            Everything you need to know about the platform.
          </p>
        </motion.div>

        <div className="max-w-3xl mx-auto space-y-3">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: index * 0.05 }}
            >
              <FAQItem
                faq={faq}
                isOpen={openIndex === index}
                onToggle={() =>
                  setOpenIndex(openIndex === index ? null : index)
                }
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
