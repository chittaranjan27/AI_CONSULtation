"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const integrations = [
  { name: "OpenAI", category: "AI", color: "#10a37f" },
  { name: "Anthropic", category: "AI", color: "#d4a27f" },
  { name: "Google Gemini", category: "AI", color: "#4285f4" },
  { name: "HubSpot", category: "CRM", color: "#ff7a59" },
  { name: "Salesforce", category: "CRM", color: "#00a1e0" },
  { name: "Zoho", category: "CRM", color: "#e42527" },
  { name: "Google Sheets", category: "Data", color: "#34a853" },
  { name: "Airtable", category: "Data", color: "#18bfff" },
  { name: "Notion", category: "Data", color: "#ffffff" },
  { name: "Calendly", category: "Calendar", color: "#006bff" },
  { name: "Google Calendar", category: "Calendar", color: "#4285f4" },
  { name: "Slack", category: "Messaging", color: "#4a154b" },
  { name: "Zapier", category: "Automation", color: "#ff4f00" },
  { name: "Make", category: "Automation", color: "#6d00cc" },
  { name: "Stripe", category: "Billing", color: "#635bff" },
  { name: "WhatsApp", category: "Channel", color: "#25d366" },
];

const categories = ["All", "AI", "CRM", "Data", "Calendar", "Messaging", "Automation", "Channel"];

export default function IntegrationsSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="integrations" className="section relative" ref={ref}>
      <div className="absolute inset-0 bg-mesh opacity-30" />
      <div className="container-wide relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <div className="badge badge-cyan mb-4">Integrations</div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            Connects With Your{" "}
            <span className="gradient-text">Favorite Tools</span>
          </h2>
          <p className="text-lg text-[var(--text-secondary)]">
            Seamlessly integrate with the tools you already use. CRMs,
            calendars, messaging, automation — all connected.
          </p>
        </motion.div>

        {/* Integration Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-4 max-w-5xl mx-auto">
          {integrations.map((integration, index) => (
            <motion.div
              key={integration.name}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.4, delay: index * 0.03 }}
              className="glass-card p-4 flex flex-col items-center gap-2 cursor-default group"
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold transition-transform group-hover:scale-110"
                style={{
                  background: `${integration.color}20`,
                  color: integration.color,
                }}
              >
                {integration.name[0]}
              </div>
              <span className="text-[11px] text-[var(--text-secondary)] text-center font-medium">
                {integration.name}
              </span>
            </motion.div>
          ))}
        </div>

        {/* Bottom text */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="text-center text-sm text-[var(--text-tertiary)] mt-8"
        >
          And many more via Zapier and Make webhooks
        </motion.p>
      </div>
    </section>
  );
}
