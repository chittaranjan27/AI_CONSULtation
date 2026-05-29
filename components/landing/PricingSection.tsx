"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Check, ArrowRight, Sparkles, Zap, Crown, Building2 } from "lucide-react";
import Link from "next/link";

const plans = [
  {
    name: "Free",
    icon: Sparkles,
    price: 0,
    period: "forever",
    description: "Perfect for trying out the platform",
    color: "text-[var(--text-secondary)]",
    borderColor: "border-[var(--border-primary)]",
    bgGlow: "",
    features: [
      "1 AI Chatbot",
      "100 messages/month",
      "Basic analytics",
      "Email support",
      "Floating widget",
      "1 team member",
    ],
    cta: "Get Started",
    ctaStyle: "btn-secondary",
    popular: false,
  },
  {
    name: "Starter",
    icon: Zap,
    price: 29,
    period: "/month",
    description: "For growing businesses getting started",
    color: "text-[var(--brand-blue)]",
    borderColor: "border-[var(--border-secondary)]",
    bgGlow: "",
    features: [
      "3 AI Chatbots",
      "2,000 messages/month",
      "Full analytics dashboard",
      "Lead capture & export",
      "Knowledge base (5 docs)",
      "3 team members",
      "Email + Chat support",
      "Custom branding",
    ],
    cta: "Start Free Trial",
    ctaStyle: "btn-secondary",
    popular: false,
  },
  {
    name: "Pro",
    icon: Crown,
    price: 99,
    period: "/month",
    description: "For teams that need advanced features",
    color: "text-[var(--brand-purple)]",
    borderColor: "border-purple-500/30",
    bgGlow: "shadow-[0_0_80px_rgba(139,92,246,0.1)]",
    features: [
      "10 AI Chatbots",
      "10,000 messages/month",
      "Advanced analytics & funnels",
      "Workflow automation",
      "RAG with unlimited docs",
      "10 team members",
      "Human handoff",
      "Multi-language (9+ langs)",
      "API access",
      "Priority support",
      "Integrations (CRM, Calendar)",
    ],
    cta: "Start Free Trial",
    ctaStyle: "btn-primary",
    popular: true,
  },
  {
    name: "Enterprise",
    icon: Building2,
    price: null,
    period: "",
    description: "For large organizations with custom needs",
    color: "text-[var(--brand-cyan)]",
    borderColor: "border-[var(--border-secondary)]",
    bgGlow: "",
    features: [
      "Unlimited chatbots",
      "Unlimited messages",
      "White-label & custom domain",
      "Dedicated AI models",
      "Unlimited team members",
      "SSO / SAML",
      "Custom integrations",
      "SLA guarantee",
      "Dedicated account manager",
      "On-premise deployment",
      "Omnichannel (WhatsApp, etc.)",
    ],
    cta: "Contact Sales",
    ctaStyle: "btn-secondary",
    popular: false,
  },
];

export default function PricingSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="pricing" className="section relative" ref={ref}>
      <div className="container-wide">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <div className="badge badge-amber mb-4">Pricing</div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            Simple, Transparent{" "}
            <span className="gradient-text">Pricing</span>
          </h2>
          <p className="text-lg text-[var(--text-secondary)]">
            Start free, scale as you grow. No hidden fees, no surprises.
            Every plan includes a 14-day free trial.
          </p>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {plans.map((plan, index) => {
            const Icon = plan.icon;
            return (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={`relative ${plan.popular ? "lg:-mt-4 lg:mb-[-16px]" : ""}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                    <span className="px-4 py-1 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 text-white text-xs font-semibold shadow-lg">
                      Most Popular
                    </span>
                  </div>
                )}
                <div
                  className={`glass-card p-6 h-full flex flex-col hover:transform-none ${plan.borderColor} ${plan.bgGlow} ${
                    plan.popular ? "border-purple-500/30" : ""
                  }`}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Icon className={`w-5 h-5 ${plan.color}`} />
                    <h3 className={`text-lg font-semibold ${plan.color}`}>
                      {plan.name}
                    </h3>
                  </div>

                  <div className="mb-4">
                    {plan.price !== null ? (
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-bold text-[var(--text-primary)]">
                          ${plan.price}
                        </span>
                        <span className="text-sm text-[var(--text-tertiary)]">
                          {plan.period}
                        </span>
                      </div>
                    ) : (
                      <div className="text-4xl font-bold text-[var(--text-primary)]">
                        Custom
                      </div>
                    )}
                    <p className="text-sm text-[var(--text-tertiary)] mt-1">
                      {plan.description}
                    </p>
                  </div>

                  <ul className="space-y-2.5 mb-6 flex-1">
                    {plan.features.map((feature) => (
                      <li
                        key={feature}
                        className="flex items-start gap-2 text-sm text-[var(--text-secondary)]"
                      >
                        <Check className="w-4 h-4 text-[var(--brand-emerald)] shrink-0 mt-0.5" />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <Link
                    href="/register"
                    className={`${plan.ctaStyle} w-full justify-center text-sm`}
                  >
                    {plan.cta}
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
