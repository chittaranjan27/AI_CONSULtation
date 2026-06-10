"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

export default function CTASection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className="section relative" ref={ref}>
      <div className="container-wide">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="relative overflow-hidden rounded-3xl"
        >
          {/* Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 via-blue-600/10 to-cyan-600/20" />
          <div className="absolute inset-0 dot-pattern opacity-20" />
          <div className="glow-orb w-[400px] h-[400px] bg-purple-500/20 -top-[20%] -left-[10%]" />
          <div className="glow-orb w-[300px] h-[300px] bg-blue-500/15 -bottom-[10%] -right-[5%]" />

          <div className="relative z-10 px-8 py-20 sm:px-16 sm:py-24 text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 mb-8"
            >
              <Sparkles className="w-4 h-4 text-[var(--brand-purple)]" />
              <span className="text-sm text-purple-300">
                Start your free trial today
              </span>
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6 max-w-3xl mx-auto"
            >
              Ready to Transform Your
              <br />
              <span className="gradient-text">Customer Conversations?</span>
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-lg text-[var(--text-secondary)] mb-10 max-w-xl mx-auto"
            >
              Join thousands of businesses using AIAssist to automate
              consultations, capture leads, and grow revenue.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Link
                href="/register"
                className="btn-primary text-base py-4 px-10"
              >
                Get Started Free
                <ArrowRight className="w-5 h-5" />
              </Link>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : {}}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="text-sm text-[var(--text-tertiary)] mt-6"
            >
              No credit card required · 14-day free trial · Cancel anytime
            </motion.p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
